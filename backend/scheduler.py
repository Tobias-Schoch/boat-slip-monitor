"""Job scheduler using APScheduler for periodic checks."""
import asyncio
import logging
from datetime import datetime
from typing import Optional

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy import select

from backend.config import settings
from backend.database import (
    AsyncSessionLocal, MonitoredUrl, Check, CheckStatus,
    Change, Screenshot
)
from backend.scraper import scraper
from backend.detector import change_detector
from backend.notifier import notifier
from backend.utils import process_html


logger = logging.getLogger(__name__)


class CheckScheduler:
    """Manages scheduled URL checks using APScheduler."""

    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self._is_running = False

    async def start(self):
        """Start the scheduler."""
        if self._is_running:
            logger.warning("Scheduler already running")
            return

        # Start browser
        await scraper.start()

        # Add check jobs with cron triggers
        # Working hours (7-17h): every 5 minutes
        self.scheduler.add_job(
            self.run_checks,
            trigger=CronTrigger.from_crontab(settings.check_interval_working),
            id='checks_working_hours',
            name='Checks during working hours',
            replace_existing=True
        )

        # Off hours (0-6h, 18-23h): every 3 minutes
        self.scheduler.add_job(
            self.run_checks,
            trigger=CronTrigger.from_crontab(settings.check_interval_off),
            id='checks_off_hours',
            name='Checks during off hours',
            replace_existing=True
        )

        self.scheduler.start()
        self._is_running = True
        logger.info("Scheduler started with cron jobs")

        # Run initial check immediately
        asyncio.create_task(self.run_checks())

    async def stop(self):
        """Stop the scheduler."""
        if not self._is_running:
            return

        self.scheduler.shutdown(wait=False)
        await scraper.stop()
        self._is_running = False
        logger.info("Scheduler stopped")

    async def run_checks(self):
        """Run checks for all enabled URLs."""
        logger.info("Starting check cycle...")

        async with AsyncSessionLocal() as session:
            # Get all enabled URLs
            result = await session.execute(
                select(MonitoredUrl).where(MonitoredUrl.enabled == True)
            )
            urls = result.scalars().all()

            if not urls:
                logger.warning("No enabled URLs to check")
                return

            logger.info(f"Checking {len(urls)} URLs...")

            # Check each URL
            for url in urls:
                try:
                    await self.check_url(url, session)
                except Exception as e:
                    logger.error(f"Failed to check {url.url}: {e}")

        logger.info("Check cycle completed")

    async def check_url(self, url: MonitoredUrl, session):
        """
        Check a single URL for changes.

        This orchestrates the full check flow:
        1. Scrape URL with Playwright
        2. Process HTML (normalize + hash)
        3. Detect changes
        4. Save check result
        5. Save screenshot
        6. Send notifications if changed
        """
        logger.info(f"Checking {url.name}: {url.url}")

        # Scrape the URL
        scrape_result = await scraper.scrape_url(url.url, url.id)

        # Create check record
        check = Check(
            url_id=url.id,
            timestamp=datetime.utcnow(),
            status=CheckStatus.SUCCESS if scrape_result.success else CheckStatus.FAILED,
            duration_ms=scrape_result.duration_ms,
            status_code=scrape_result.status_code,
            error=scrape_result.error
        )
        # Set the url relationship explicitly for downstream use
        check.url = url
        session.add(check)
        await session.flush()

        if not scrape_result.success:
            logger.error(f"Scrape failed for {url.name}: {scrape_result.error}")
            url.last_checked = datetime.utcnow()
            await session.commit()
            return

        # Process HTML
        current_html = scrape_result.html
        current_normalized, current_hash = process_html(current_html)

        check.html_hash = current_hash

        # Save screenshot
        if scrape_result.screenshot_path:
            import os
            screenshot = Screenshot(
                check_id=check.id,
                file_path=scrape_result.screenshot_path,
                size_bytes=os.path.getsize(scrape_result.screenshot_path)
            )
            session.add(screenshot)

        # Detect changes
        detection_result = await change_detector.detect_changes(
            previous_html_normalized=url.last_html_normalized,
            previous_html_original=url.last_html_original,
            current_html=current_html,
            current_normalized_html=current_normalized,
            previous_html_hash=url.last_hash,
            current_html_hash=current_hash
        )

        # Update URL with latest data
        url.last_checked = datetime.utcnow()
        url.last_hash = current_hash
        url.last_html_normalized = current_normalized
        url.last_html_original = current_html

        # If change detected, create change record
        if detection_result.has_changed:
            logger.warning(
                f"Change detected on {url.name}: "
                f"{detection_result.change_type.value} ({detection_result.priority.value})"
            )

            change = Change(
                check_id=check.id,
                type=detection_result.change_type,
                priority=detection_result.priority,
                confidence=detection_result.confidence,
                description=detection_result.description,
                diff=detection_result.diff,
                matched_keywords=detection_result.matched_keywords
            )
            # Set the check relationship explicitly for the notifier
            change.check = check
            session.add(change)
            await session.flush()

            # Send notifications
            await notifier.send_notification(
                change=change,
                url_name=url.name,
                url=url.url,
                session=session
            )

        else:
            logger.info(f"No changes detected on {url.name}")

        await session.commit()


# Global scheduler instance
scheduler = CheckScheduler()
