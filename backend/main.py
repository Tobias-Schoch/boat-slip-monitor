"""Main FastAPI application with REST API and SSE endpoints."""
import asyncio
import json
import logging
import os
from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.config import settings
from backend.database import (
    init_db, seed_urls, get_db,
    MonitoredUrl, Check, Change, Screenshot, Notification,
    CheckStatus, Priority
)
from backend.scheduler import scheduler


# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper()),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# Lifespan context manager for startup/shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan."""
    # Startup
    logger.info("Starting Boat Slip Monitor...")

    # Initialize database
    await init_db()
    logger.info("Database initialized")

    # Load settings from database
    from backend.database import AsyncSessionLocal
    async with AsyncSessionLocal() as session:
        await settings.load_from_database(session)

    if settings.is_configured():
        logger.info("Settings loaded from database")
    else:
        logger.warning("Application not configured - please complete setup")

    # Seed initial URLs
    await seed_urls()

    # Start scheduler only if configured
    if settings.is_configured():
        await scheduler.start()
    else:
        logger.warning("Scheduler not started - application needs configuration")

    yield

    # Shutdown
    logger.info("Shutting down...")
    if settings.is_configured():
        await scheduler.stop()


app = FastAPI(
    title="Boat Slip Monitor",
    description="Monitor boat slip registration pages for changes",
    version="2.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Pydantic models for API responses
class UrlResponse(BaseModel):
    """Response model for monitored URL."""
    id: str
    url: str
    name: str
    description: Optional[str]
    enabled: bool
    check_interval_minutes: int
    last_checked: Optional[datetime]
    last_hash: Optional[str]

    class Config:
        from_attributes = True


class CheckResponse(BaseModel):
    """Response model for check."""
    id: str
    url_id: str
    timestamp: datetime
    status: CheckStatus
    duration_ms: int
    status_code: Optional[int]
    error: Optional[str]
    url_name: Optional[str] = None

    class Config:
        from_attributes = True


class ChangeResponse(BaseModel):
    """Response model for change."""
    id: str
    check_id: str
    type: str
    priority: Priority
    confidence: float
    description: str
    diff: Optional[str]
    matched_keywords: Optional[List[str]]
    created_at: datetime
    url_name: Optional[str] = None
    url: Optional[str] = None

    class Config:
        from_attributes = True


# Pydantic models for Settings API
class SettingsRequest(BaseModel):
    """Settings update request."""
    telegram_bot_token: Optional[str] = None
    telegram_chat_id: Optional[str] = None
    smtp_host: Optional[str] = None
    smtp_port: int = 587
    smtp_user: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_from: str = "Boat Monitor <noreply@example.com>"
    smtp_to: Optional[str] = None
    log_level: str = "INFO"
    check_interval_working: str = "*/5 7-17 * * *"
    check_interval_off: str = "*/3 0-6,18-23 * * *"
    page_timeout_ms: int = 30000
    max_retry_attempts: int = 3
    max_screenshots_per_url: int = 50
    screenshot_retention_days: int = 30
    notification_cooldown_minutes: int = 10
    max_notification_retries: int = 3


# API Endpoints
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "2.0.0",
        "configured": settings.is_configured()
    }


@app.get("/api/setup-status")
async def get_setup_status():
    """Check if application is configured."""
    return {
        "configured": settings.is_configured(),
        "has_telegram": bool(settings.telegram_bot_token and settings.telegram_chat_id),
        "has_email": bool(settings.smtp_host and settings.smtp_user)
    }


@app.get("/api/settings")
async def get_settings(db: AsyncSession = Depends(get_db)):
    """Get current settings (with passwords masked)."""
    settings_dict = settings.to_dict()

    # Mask sensitive values
    if settings_dict.get('telegram_bot_token'):
        settings_dict['telegram_bot_token'] = '***MASKED***'
    if settings_dict.get('smtp_password'):
        settings_dict['smtp_password'] = '***MASKED***'

    return settings_dict


@app.post("/api/settings")
async def update_settings(
    settings_data: SettingsRequest,
    db: AsyncSession = Depends(get_db)
):
    """Update application settings."""
    try:
        # Convert to dict
        data = settings_data.dict()

        # Save to database
        await settings.save_to_database(db, data)

        # Restart scheduler if needed
        if settings.is_configured():
            logger.info("Settings updated - restarting scheduler...")
            await scheduler.stop()
            await scheduler.start()

        return {
            "success": True,
            "message": "Settings updated successfully",
            "configured": settings.is_configured()
        }
    except Exception as e:
        logger.error(f"Failed to update settings: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/urls", response_model=List[UrlResponse])
async def get_urls(
    enabled_only: bool = Query(False),
    db: AsyncSession = Depends(get_db)
):
    """Get all monitored URLs."""
    query = select(MonitoredUrl).order_by(MonitoredUrl.name)
    if enabled_only:
        query = query.where(MonitoredUrl.enabled == True)

    result = await db.execute(query)
    urls = result.scalars().all()
    return urls


@app.get("/api/urls/{url_id}", response_model=UrlResponse)
async def get_url(url_id: str, db: AsyncSession = Depends(get_db)):
    """Get a specific monitored URL."""
    result = await db.execute(
        select(MonitoredUrl).where(MonitoredUrl.id == url_id)
    )
    url = result.scalar_one_or_none()
    if not url:
        raise HTTPException(status_code=404, detail="URL not found")
    return url


@app.get("/api/checks", response_model=List[CheckResponse])
async def get_checks(
    url_id: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    db: AsyncSession = Depends(get_db)
):
    """Get recent checks."""
    query = select(Check).options(selectinload(Check.url))
    if url_id:
        query = query.where(Check.url_id == url_id)

    query = query.order_by(desc(Check.timestamp)).limit(limit)

    result = await db.execute(query)
    checks = result.scalars().all()

    # Add URL name to response
    response = []
    for check in checks:
        check_dict = CheckResponse.from_orm(check).dict()
        check_dict['url_name'] = check.url.name if check.url else None
        response.append(check_dict)

    return response


@app.get("/api/changes", response_model=List[ChangeResponse])
async def get_changes(
    url_id: Optional[str] = Query(None),
    priority: Optional[Priority] = Query(None),
    limit: int = Query(50, le=200),
    db: AsyncSession = Depends(get_db)
):
    """Get detected changes."""
    query = select(Change).options(
        selectinload(Change.check).selectinload(Check.url)
    )

    if priority:
        query = query.where(Change.priority == priority)

    if url_id:
        query = query.join(Check).where(Check.url_id == url_id)

    query = query.order_by(desc(Change.created_at)).limit(limit)

    result = await db.execute(query)
    changes = result.scalars().all()

    # Add URL info to response
    response = []
    for change in changes:
        change_dict = ChangeResponse.from_orm(change).dict()
        if change.check and change.check.url:
            change_dict['url_name'] = change.check.url.name
            change_dict['url'] = change.check.url.url
        response.append(change_dict)

    return response


@app.get("/api/screenshots/{url_id}/{filename}")
async def get_screenshot(url_id: str, filename: str):
    """Serve a screenshot file."""
    filepath = Path(settings.screenshot_dir) / url_id / filename

    if not filepath.exists():
        raise HTTPException(status_code=404, detail="Screenshot not found")

    return FileResponse(filepath)


@app.get("/api/events")
async def event_stream(db: AsyncSession = Depends(get_db)):
    """
    Server-Sent Events (SSE) endpoint for real-time updates.

    Streams check results and changes as they happen.
    """
    async def generate():
        """Generate SSE events."""
        # Send initial connection message
        yield f"data: {json.dumps({'type': 'connected', 'timestamp': datetime.utcnow().isoformat()})}\n\n"

        last_check_id = None
        last_change_id = None

        while True:
            try:
                # Query for new checks
                result = await db.execute(
                    select(Check)
                    .options(selectinload(Check.url))
                    .order_by(desc(Check.timestamp))
                    .limit(1)
                )
                latest_check = result.scalar_one_or_none()

                if latest_check and latest_check.id != last_check_id:
                    last_check_id = latest_check.id

                    event_data = {
                        'type': 'check',
                        'data': {
                            'id': latest_check.id,
                            'url_id': latest_check.url_id,
                            'url_name': latest_check.url.name if latest_check.url else None,
                            'status': latest_check.status.value,
                            'timestamp': latest_check.timestamp.isoformat(),
                            'duration_ms': latest_check.duration_ms
                        }
                    }
                    yield f"data: {json.dumps(event_data)}\n\n"

                # Query for new changes
                result = await db.execute(
                    select(Change)
                    .options(selectinload(Change.check).selectinload(Check.url))
                    .order_by(desc(Change.created_at))
                    .limit(1)
                )
                latest_change = result.scalar_one_or_none()

                if latest_change and latest_change.id != last_change_id:
                    last_change_id = latest_change.id

                    event_data = {
                        'type': 'change',
                        'data': {
                            'id': latest_change.id,
                            'type': latest_change.type.value,
                            'priority': latest_change.priority.value,
                            'description': latest_change.description,
                            'url_name': latest_change.check.url.name if latest_change.check and latest_change.check.url else None,
                            'timestamp': latest_change.created_at.isoformat()
                        }
                    }
                    yield f"data: {json.dumps(event_data)}\n\n"

                await asyncio.sleep(2)

            except Exception as e:
                logger.error(f"SSE error: {e}")
                await asyncio.sleep(5)

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


# Serve frontend static files (if they exist)
frontend_dist = Path(__file__).parent.parent / "frontend" / "dist"
if frontend_dist.exists():
    app.mount("/assets", StaticFiles(directory=frontend_dist / "assets"), name="assets")

    @app.get("/")
    async def serve_frontend():
        """Serve frontend index.html."""
        return FileResponse(frontend_dist / "index.html")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
