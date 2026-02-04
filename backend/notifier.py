"""Multi-channel notification system with priority routing."""
import asyncio
import io
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict

from telegram import Bot, InputFile
from telegram.error import TelegramError
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage

from backend.config import settings
from backend.database import Priority, NotificationChannel, Change, Notification, NotificationStatus


logger = logging.getLogger(__name__)

# Try to import diff_image, but make it optional
try:
    from backend.diff_image import generate_diff_image
    DIFF_IMAGE_AVAILABLE = True
except ImportError as e:
    logger.warning(f"Diff image generation not available: {e}")
    DIFF_IMAGE_AVAILABLE = False
    generate_diff_image = None


class NotificationManager:
    """Manages multi-channel notifications with priority routing."""

    def __init__(self):
        self.telegram_bot: Optional[Bot] = None
        self._rate_limit_cache: Dict[str, datetime] = {}

    def _init_telegram(self):
        """Initialize Telegram bot lazily."""
        if not self.telegram_bot and settings.telegram_bot_token:
            self.telegram_bot = Bot(token=settings.telegram_bot_token)

    async def send_notification(
        self,
        change: Change,
        url_name: str,
        url: str,
        session
    ) -> bool:
        """
        Send notification for any change.

        Sends to all configured channels (Telegram and/or Email)
        for all priority levels (CRITICAL, IMPORTANT, INFO).

        Returns:
            True if at least one notification succeeded
        """
        logger.info(f"=== NOTIFICATION REQUEST ===")
        logger.info(f"URL: {url_name}, Priority: {change.priority.value}")
        logger.info(f"Telegram configured: token={'YES' if settings.telegram_bot_token else 'NO'}, chat_id={'YES' if settings.telegram_chat_id else 'NO'}")
        logger.info(f"Email configured: smtp_host={'YES' if settings.smtp_host else 'NO'}, smtp_to={'YES' if settings.smtp_to else 'NO'}")

        # Check rate limiting
        rate_limit_key = f"{change.check.url_id}_{change.priority.value}"
        if self._is_rate_limited(rate_limit_key):
            logger.info(f"Rate limited: {rate_limit_key}")
            return False

        # Determine channels based on priority
        channels = self._get_channels_for_priority(change.priority)
        logger.info(f"Channels to use: {[c.value for c in channels] if channels else 'NONE - check configuration!'}")

        if not channels:
            logger.warning("No notification channels configured! Configure Telegram or Email in settings.")
            return False

        success_count = 0
        for channel in channels:
            try:
                if channel == NotificationChannel.TELEGRAM:
                    success = await self._send_telegram(change, url_name, url, session)
                    logger.info(f"Telegram notification: {'SUCCESS' if success else 'FAILED'}")
                elif channel == NotificationChannel.EMAIL:
                    success = await self._send_email(change, url_name, url, session)
                    logger.info(f"Email notification: {'SUCCESS' if success else 'FAILED'}")
                else:
                    success = False

                if success:
                    success_count += 1

            except Exception as e:
                logger.exception(f"Failed to send {channel.value} notification: {e}")

        # Update rate limit cache
        if success_count > 0:
            self._rate_limit_cache[rate_limit_key] = datetime.now()

        logger.info(f"=== NOTIFICATION RESULT: {success_count}/{len(channels)} sent ===")
        return success_count > 0

    def _get_channels_for_priority(self, priority: Priority) -> list[NotificationChannel]:
        """Get notification channels for a given priority."""
        channels = []

        # Send notifications for all priorities (CRITICAL, IMPORTANT, INFO)
        if settings.telegram_bot_token:
            channels.append(NotificationChannel.TELEGRAM)
        if settings.smtp_host:
            channels.append(NotificationChannel.EMAIL)

        return channels

    def _is_rate_limited(self, key: str) -> bool:
        """Check if rate limited for given key."""
        if key not in self._rate_limit_cache:
            return False

        last_sent = self._rate_limit_cache[key]
        cooldown = timedelta(minutes=settings.notification_cooldown_minutes)
        return datetime.now() - last_sent < cooldown

    async def _send_with_retry(
        self,
        send_func,
        notification: Notification,
        channel_name: str,
        change: Change,
        session
    ) -> bool:
        """Generic retry logic for all notification channels."""
        for attempt in range(settings.max_notification_retries):
            try:
                await send_func()

                notification.status = NotificationStatus.SENT
                notification.sent_at = datetime.utcnow()
                await session.commit()

                logger.info(f"{channel_name} notification sent for change {change.id}")
                return True

            except Exception as e:
                logger.error(f"{channel_name} send failed (attempt {attempt + 1}): {e}")
                notification.retry_count = attempt + 1
                notification.error = str(e)
                await session.commit()

                if attempt < settings.max_notification_retries - 1:
                    # Exponential backoff: 5s, 15s, 45s
                    await asyncio.sleep(5 * (3 ** attempt))

        notification.status = NotificationStatus.FAILED
        await session.commit()
        return False

    async def _generate_diff_image(self, change: Change, url_name: str) -> Optional[bytes]:
        """Generate diff image if diff is available."""
        if not DIFF_IMAGE_AVAILABLE:
            logger.info("Diff image generation not available")
            return None

        if not change.diff:
            logger.info("No diff available, skipping image generation")
            return None

        try:
            logger.info(f"Generating diff image for {url_name}, diff length: {len(change.diff)}")
            image_bytes = await generate_diff_image(
                diff_text=change.diff,
                url_name=url_name,
                description=change.description,
                priority=change.priority.value
            )
            logger.info(f"Generated diff image ({len(image_bytes)} bytes)")
            return image_bytes
        except Exception as e:
            logger.exception(f"Failed to generate diff image: {e}")
            return None

    async def _send_telegram(
        self,
        change: Change,
        url_name: str,
        url: str,
        session
    ) -> bool:
        """Send Telegram notification with diff image."""
        if not settings.telegram_bot_token or not settings.telegram_chat_id:
            logger.warning("Telegram not configured")
            return False

        self._init_telegram()

        # Create notification record
        notification = Notification(
            change_id=change.id,
            channel=NotificationChannel.TELEGRAM,
            status=NotificationStatus.PENDING
        )
        session.add(notification)
        await session.flush()

        message = self._format_message(change, url_name, url)

        # Generate diff image if available
        diff_image = await self._generate_diff_image(change, url_name)

        async def send():
            if diff_image:
                # Telegram photo caption limit is 1024 chars
                caption = message if len(message) <= 1024 else message[:1000] + "..."

                # Send image with caption
                await self.telegram_bot.send_photo(
                    chat_id=settings.telegram_chat_id,
                    photo=InputFile(io.BytesIO(diff_image), filename='diff.png'),
                    caption=caption,
                    parse_mode='HTML'
                )

                # If message was truncated, send full message as follow-up
                if len(message) > 1024:
                    await self.telegram_bot.send_message(
                        chat_id=settings.telegram_chat_id,
                        text=message,
                        parse_mode='HTML'
                    )
            else:
                # Send text only
                await self.telegram_bot.send_message(
                    chat_id=settings.telegram_chat_id,
                    text=message,
                    parse_mode='HTML'
                )

        return await self._send_with_retry(send, notification, "Telegram", change, session)

    async def _send_email(
        self,
        change: Change,
        url_name: str,
        url: str,
        session
    ) -> bool:
        """Send email notification with diff image."""
        if not settings.smtp_host or not settings.smtp_to:
            logger.warning("Email not configured")
            return False

        # Create notification record
        notification = Notification(
            change_id=change.id,
            channel=NotificationChannel.EMAIL,
            status=NotificationStatus.PENDING
        )
        session.add(notification)
        await session.flush()

        subject = f"🚨 {change.priority.value}: {url_name}"
        body = self._format_email_body(change, url_name, url)

        # Generate diff image if available (don't let failure block email)
        diff_image = None
        try:
            diff_image = await self._generate_diff_image(change, url_name)
        except Exception as e:
            logger.error(f"Failed to generate diff image for email: {e}")

        async def send():
            if diff_image:
                # For inline images: mixed > related > alternative
                msg = MIMEMultipart('mixed')
                msg['Subject'] = subject
                msg['From'] = settings.smtp_from
                msg['To'] = settings.smtp_to

                # Related part for HTML + inline image
                related_part = MIMEMultipart('related')

                # Alternative part for plain text / HTML
                alt_part = MIMEMultipart('alternative')
                text_part = MIMEText(body, 'plain')

                html_body = f"""
                <html>
                <body style="font-family: sans-serif; background: #1e293b; color: #f1f5f9; padding: 20px;">
                    <div style="max-width: 600px; margin: 0 auto;">
                        {body.replace(chr(10), '<br>')}
                        <br><br>
                        <img src="cid:diff_image" style="max-width: 100%; border-radius: 12px; border: 1px solid #334155;">
                    </div>
                </body>
                </html>
                """
                html_part = MIMEText(html_body, 'html')

                alt_part.attach(text_part)
                alt_part.attach(html_part)
                related_part.attach(alt_part)

                # Attach image to related part
                image_part = MIMEImage(diff_image, _subtype='png')
                image_part.add_header('Content-ID', '<diff_image>')
                image_part.add_header('Content-Disposition', 'inline', filename='diff.png')
                related_part.attach(image_part)

                msg.attach(related_part)
            else:
                # Simple email without image
                msg = MIMEMultipart('alternative')
                msg['Subject'] = subject
                msg['From'] = settings.smtp_from
                msg['To'] = settings.smtp_to

                text_part = MIMEText(body, 'plain')
                html_part = MIMEText(body.replace('\n', '<br>'), 'html')
                msg.attach(text_part)
                msg.attach(html_part)

            logger.info(f"Sending email to {settings.smtp_to} via {settings.smtp_host}:{settings.smtp_port}")

            await aiosmtplib.send(
                msg,
                hostname=settings.smtp_host,
                port=settings.smtp_port,
                username=settings.smtp_user,
                password=settings.smtp_password,
                start_tls=True
            )

        return await self._send_with_retry(send, notification, "Email", change, session)

    def _format_message(self, change: Change, url_name: str, url: str) -> str:
        """Format message for notifications."""
        priority_emoji = {
            Priority.CRITICAL: "🚨",
            Priority.IMPORTANT: "⚠️",
            Priority.INFO: "ℹ️"
        }

        emoji = priority_emoji.get(change.priority, "ℹ️")

        message = f"{emoji} <b>{change.priority.value}</b>\n\n"
        message += f"<b>{url_name}</b>\n"
        message += f"{change.description}\n\n"

        if change.matched_keywords:
            keywords_str = ", ".join(change.matched_keywords)
            message += f"🔍 Keywords: {keywords_str}\n\n"

        message += f"🔗 <a href='{url}'>Zur Seite</a>"

        return message

    def _format_email_body(self, change: Change, url_name: str, url: str) -> str:
        """Format email body."""
        body = f"Priority: {change.priority.value}\n\n"
        body += f"URL: {url_name}\n"
        body += f"{change.description}\n\n"

        if change.matched_keywords:
            keywords_str = ", ".join(change.matched_keywords)
            body += f"Matched Keywords: {keywords_str}\n\n"

        body += f"Link: {url}\n\n"
        body += "---\n"
        body += "Boat Slip Monitor\n"

        return body


# Global notifier instance
notifier = NotificationManager()
