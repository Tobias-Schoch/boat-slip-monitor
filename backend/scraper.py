"""Web scraper using Playwright for JavaScript-rendered pages."""
import asyncio
import logging
import os
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Optional

from playwright.async_api import async_playwright, Page, Browser, Error as PlaywrightError

from backend.config import settings


logger = logging.getLogger(__name__)


@dataclass
class ScrapeResult:
    """Result of a scrape operation."""
    success: bool
    html: Optional[str] = None
    screenshot_path: Optional[str] = None
    status_code: Optional[int] = None
    error: Optional[str] = None
    duration_ms: int = 0


class WebScraper:
    """Web scraper using Playwright for rendering JavaScript."""

    def __init__(self):
        self.browser: Optional[Browser] = None
        self._playwright = None

    async def start(self):
        """Start the browser."""
        if self.browser:
            return

        try:
            self._playwright = await async_playwright().start()
            self.browser = await self._playwright.chromium.launch(
                headless=True,
                args=[
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--disable-gpu'
                ]
            )
            logger.info("Browser started successfully")
        except Exception as e:
            logger.error(f"Failed to start browser: {e}")
            raise

    async def stop(self):
        """Stop the browser."""
        if self.browser:
            await self.browser.close()
            self.browser = None
        if self._playwright:
            await self._playwright.stop()
            self._playwright = None
        logger.info("Browser stopped")

    async def scrape_url(
        self,
        url: str,
        url_id: str,
        timeout_ms: Optional[int] = None
    ) -> ScrapeResult:
        """
        Scrape a URL and capture screenshot.

        Args:
            url: URL to scrape
            url_id: ID of the monitored URL (for screenshot naming)
            timeout_ms: Page timeout in milliseconds

        Returns:
            ScrapeResult with HTML content and screenshot path
        """
        start_time = datetime.now()
        timeout = timeout_ms or settings.page_timeout_ms

        if not self.browser:
            await self.start()

        page: Optional[Page] = None

        try:
            # Create new page with timeout
            page = await self.browser.new_page()
            page.set_default_timeout(timeout)

            # Navigate to URL
            logger.info(f"Navigating to {url}")
            response = await page.goto(url, wait_until='networkidle')

            status_code = response.status if response else None

            if not response or status_code >= 400:
                error_msg = f"HTTP {status_code}" if status_code else "No response"
                logger.error(f"Failed to load {url}: {error_msg}")
                return ScrapeResult(
                    success=False,
                    error=error_msg,
                    status_code=status_code,
                    duration_ms=self._get_duration_ms(start_time)
                )

            # Wait a bit for any late-loading JavaScript
            await asyncio.sleep(2)

            # Extract HTML
            html = await page.content()
            logger.info(f"Extracted HTML ({len(html)} chars) from {url}")

            # Take screenshot
            screenshot_path = await self._take_screenshot(page, url_id)

            duration_ms = self._get_duration_ms(start_time)

            return ScrapeResult(
                success=True,
                html=html,
                screenshot_path=screenshot_path,
                status_code=status_code,
                duration_ms=duration_ms
            )

        except PlaywrightError as e:
            error_msg = f"Playwright error: {str(e)}"
            logger.error(f"Scrape failed for {url}: {error_msg}")
            return ScrapeResult(
                success=False,
                error=error_msg,
                duration_ms=self._get_duration_ms(start_time)
            )

        except Exception as e:
            error_msg = f"Unexpected error: {str(e)}"
            logger.error(f"Scrape failed for {url}: {error_msg}")
            return ScrapeResult(
                success=False,
                error=error_msg,
                duration_ms=self._get_duration_ms(start_time)
            )

        finally:
            if page:
                await page.close()

    async def _take_screenshot(self, page: Page, url_id: str) -> str:
        """Take full-page screenshot and return path."""
        # Create directory for this URL's screenshots
        screenshot_dir = Path(settings.screenshot_dir) / url_id
        screenshot_dir.mkdir(parents=True, exist_ok=True)

        # Generate filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{timestamp}.png"
        filepath = screenshot_dir / filename

        # Take screenshot
        await page.screenshot(path=str(filepath), full_page=True)

        logger.info(f"Screenshot saved to {filepath}")

        # Cleanup old screenshots
        await self._cleanup_old_screenshots(screenshot_dir, url_id)

        return str(filepath)

    async def _cleanup_old_screenshots(self, screenshot_dir: Path, url_id: str):
        """Delete old screenshots beyond retention limit."""
        try:
            # Get all screenshots for this URL
            screenshots = sorted(
                screenshot_dir.glob("*.png"),
                key=lambda p: p.stat().st_mtime,
                reverse=True
            )

            # Keep only the last N screenshots
            max_screenshots = settings.max_screenshots_per_url
            if len(screenshots) > max_screenshots:
                for screenshot in screenshots[max_screenshots:]:
                    screenshot.unlink()
                    logger.debug(f"Deleted old screenshot: {screenshot}")

            # Also delete screenshots older than retention days
            retention_days = settings.screenshot_retention_days
            if retention_days > 0:
                cutoff_time = datetime.now().timestamp() - (retention_days * 86400)
                for screenshot in screenshots:
                    if screenshot.stat().st_mtime < cutoff_time:
                        screenshot.unlink()
                        logger.debug(f"Deleted expired screenshot: {screenshot}")

        except Exception as e:
            logger.error(f"Failed to cleanup screenshots for {url_id}: {e}")

    @staticmethod
    def _get_duration_ms(start_time: datetime) -> int:
        """Calculate duration in milliseconds."""
        return int((datetime.now() - start_time).total_seconds() * 1000)


# Global scraper instance
scraper = WebScraper()
