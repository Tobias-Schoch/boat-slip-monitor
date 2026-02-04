"""Multi-channel notification system with priority routing."""
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict

from telegram import Bot
from telegram.error import TelegramError
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from backend.config import settings
from backend.database import Priority, NotificationChannel, Change, Notification, NotificationStatus


logger = logging.getLogger(__name__)


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
        Send notification based on priority.

        Priority routing:
        - CRITICAL: Telegram + Email
        - IMPORTANT: Telegram + Email
        - INFO: Dashboard only (no notification)

        Returns:
            True if at least one notification succeeded
        """
        if change.priority == Priority.INFO:
            logger.info("INFO priority change - no notification sent")
            return True

        # Check rate limiting
        rate_limit_key = f"{change.check.url_id}_{change.priority.value}"
        if self._is_rate_limited(rate_limit_key):
            logger.info(f"Rate limited: {rate_limit_key}")
            return False

        # Determine channels based on priority
        channels = self._get_channels_for_priority(change.priority)

        success_count = 0
        for channel in channels:
            try:
                if channel == NotificationChannel.TELEGRAM:
                    success = await self._send_telegram(change, url_name, url, session)
                elif channel == NotificationChannel.EMAIL:
                    success = await self._send_email(change, url_name, url, session)
                else:
                    success = False

                if success:
                    success_count += 1

            except Exception as e:
                logger.error(f"Failed to send {channel.value} notification: {e}")

        # Update rate limit cache
        if success_count > 0:
            self._rate_limit_cache[rate_limit_key] = datetime.now()

        return success_count > 0

    def _get_channels_for_priority(self, priority: Priority) -> list[NotificationChannel]:
        """Get notification channels for a given priority."""
        channels = []

        if priority == Priority.CRITICAL:
            # Critical: Telegram + Email
            if settings.telegram_bot_token:
                channels.append(NotificationChannel.TELEGRAM)
            if settings.smtp_host:
                channels.append(NotificationChannel.EMAIL)

        elif priority == Priority.IMPORTANT:
            # Important: Telegram + Email
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

    async def _send_telegram(
        self,
        change: Change,
        url_name: str,
        url: str,
        session
    ) -> bool:
        """Send Telegram notification."""
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

        # Retry logic
        for attempt in range(settings.max_notification_retries):
            try:
                await self.telegram_bot.send_message(
                    chat_id=settings.telegram_chat_id,
                    text=message,
                    parse_mode='HTML'
                )

                notification.status = NotificationStatus.SENT
                notification.sent_at = datetime.utcnow()
                await session.commit()

                logger.info(f"Telegram notification sent for change {change.id}")
                return True

            except TelegramError as e:
                logger.error(f"Telegram send failed (attempt {attempt + 1}): {e}")
                notification.retry_count = attempt + 1
                notification.error = str(e)
                await session.commit()

                if attempt < settings.max_notification_retries - 1:
                    # Exponential backoff: 5s, 15s, 45s
                    await asyncio.sleep(5 * (3 ** attempt))

        notification.status = NotificationStatus.FAILED
        await session.commit()
        return False

    async def _send_email(
        self,
        change: Change,
        url_name: str,
        url: str,
        session
    ) -> bool:
        """Send email notification."""
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

        # Retry logic
        for attempt in range(settings.max_notification_retries):
            try:
                msg = MIMEMultipart('alternative')
                msg['Subject'] = subject
                msg['From'] = settings.smtp_from
                msg['To'] = settings.smtp_to

                # Add HTML and plain text parts
                text_part = MIMEText(body, 'plain')
                html_part = MIMEText(body.replace('\n', '<br>'), 'html')
                msg.attach(text_part)
                msg.attach(html_part)

                await aiosmtplib.send(
                    msg,
                    hostname=settings.smtp_host,
                    port=settings.smtp_port,
                    username=settings.smtp_user,
                    password=settings.smtp_password,
                    start_tls=True
                )

                notification.status = NotificationStatus.SENT
                notification.sent_at = datetime.utcnow()
                await session.commit()

                logger.info(f"Email notification sent for change {change.id}")
                return True

            except Exception as e:
                logger.error(f"Email send failed (attempt {attempt + 1}): {e}")
                notification.retry_count = attempt + 1
                notification.error = str(e)
                await session.commit()

                if attempt < settings.max_notification_retries - 1:
                    await asyncio.sleep(5 * (3 ** attempt))

        notification.status = NotificationStatus.FAILED
        await session.commit()
        return False

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
