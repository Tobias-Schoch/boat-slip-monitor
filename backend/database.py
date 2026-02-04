"""Database models and setup using SQLAlchemy."""
import uuid
from datetime import datetime
from enum import Enum
from typing import Optional

from sqlalchemy import (
    JSON, Boolean, Column, DateTime, Enum as SQLEnum, Float, ForeignKey,
    Integer, String, Text, create_engine
)
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, relationship

from backend.config import settings


class Base(DeclarativeBase):
    """Base class for all models."""
    pass


# Enums
class CheckStatus(str, Enum):
    """Status of a check execution."""
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    TIMEOUT = "TIMEOUT"


class ChangeType(str, Enum):
    """Type of detected change."""
    CONTENT = "CONTENT"
    FORM = "FORM"
    KEYWORD = "KEYWORD"
    STRUCTURE = "STRUCTURE"


class Priority(str, Enum):
    """Priority level for changes."""
    INFO = "INFO"
    IMPORTANT = "IMPORTANT"
    CRITICAL = "CRITICAL"


class NotificationChannel(str, Enum):
    """Notification delivery channel."""
    TELEGRAM = "TELEGRAM"
    EMAIL = "EMAIL"
    SMS = "SMS"


class NotificationStatus(str, Enum):
    """Status of a notification."""
    PENDING = "PENDING"
    SENT = "SENT"
    FAILED = "FAILED"


# Models
class MonitoredUrl(Base):
    """URLs being monitored for changes."""
    __tablename__ = "monitored_urls"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    url = Column(String(2048), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    enabled = Column(Boolean, default=True, nullable=False)
    check_interval_minutes = Column(Integer, default=5, nullable=False)
    last_checked = Column(DateTime, nullable=True)
    last_hash = Column(String(64), nullable=True)  # SHA-256 hash
    last_html_normalized = Column(Text, nullable=True)
    last_html_original = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    checks = relationship("Check", back_populates="url", cascade="all, delete-orphan")


class Check(Base):
    """Individual check executions."""
    __tablename__ = "checks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    url_id = Column(String(36), ForeignKey("monitored_urls.id"), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    status = Column(SQLEnum(CheckStatus), nullable=False)
    duration_ms = Column(Integer, nullable=False)
    status_code = Column(Integer, nullable=True)
    error = Column(Text, nullable=True)
    html_hash = Column(String(64), nullable=True)

    # Relationships
    url = relationship("MonitoredUrl", back_populates="checks")
    changes = relationship("Change", back_populates="check", cascade="all, delete-orphan")
    screenshots = relationship("Screenshot", back_populates="check", cascade="all, delete-orphan")


class Change(Base):
    """Detected changes in monitored URLs."""
    __tablename__ = "changes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    check_id = Column(String(36), ForeignKey("checks.id"), nullable=False, index=True)
    type = Column(SQLEnum(ChangeType), nullable=False)
    priority = Column(SQLEnum(Priority), nullable=False, index=True)
    confidence = Column(Float, nullable=False)
    description = Column(Text, nullable=False)
    diff = Column(Text, nullable=True)
    matched_keywords = Column(JSON, nullable=True)  # List of matched keywords
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    check = relationship("Check", back_populates="changes")
    notifications = relationship("Notification", back_populates="change", cascade="all, delete-orphan")


class Screenshot(Base):
    """Screenshots captured during checks."""
    __tablename__ = "screenshots"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    check_id = Column(String(36), ForeignKey("checks.id"), nullable=False, index=True)
    file_path = Column(String(512), nullable=False)
    size_bytes = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    check = relationship("Check", back_populates="screenshots")


class Notification(Base):
    """Notifications sent for changes."""
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    change_id = Column(String(36), ForeignKey("changes.id"), nullable=False, index=True)
    channel = Column(SQLEnum(NotificationChannel), nullable=False)
    status = Column(SQLEnum(NotificationStatus), default=NotificationStatus.PENDING, nullable=False)
    sent_at = Column(DateTime, nullable=True)
    error = Column(Text, nullable=True)
    retry_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    change = relationship("Change", back_populates="notifications")


class Setting(Base):
    """Application settings stored in database."""
    __tablename__ = "settings"

    key = Column(String(255), primary_key=True)
    value = Column(JSON, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


# Database setup
def get_engine(database_url: Optional[str] = None):
    """Create database engine."""
    url = database_url or settings.database_url
    # Convert sqlite:// to sqlite+aiosqlite:// for async support
    if url.startswith("sqlite://"):
        url = url.replace("sqlite://", "sqlite+aiosqlite://", 1)
    return create_async_engine(url, echo=False)


def get_session_maker(engine):
    """Create session maker."""
    return async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


# Global engine and session maker
engine = get_engine()
AsyncSessionLocal = get_session_maker(engine)


async def get_db():
    """Dependency for getting database sessions."""
    async with AsyncSessionLocal() as session:
        yield session


async def init_db():
    """Initialize database (create tables)."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def seed_urls():
    """Seed initial monitored URLs."""
    from sqlalchemy import select

    async with AsyncSessionLocal() as session:
        # Check if URLs already exist
        result = await session.execute(select(MonitoredUrl))
        existing = result.scalars().all()

        if len(existing) > 0:
            print("URLs already seeded, skipping...")
            return

        # Seed URLs
        urls = [
            MonitoredUrl(
                name="Konstanz Bootsliegeplatz",
                url="https://www.konstanz.de/stadt+gestalten/bauen+_+wohnen/privat+bauen/bootsliegeplatz",
                description="Main city of Konstanz boat slip page",
                enabled=True,
                check_interval_minutes=3
            ),
            MonitoredUrl(
                name="Konstanz Serviceportal",
                url="https://www.konstanz.de/serviceportal/-/leistungen+von+a-z/neubeantragung-bootsliegeplatz-bootsliegeplaetze/vbid6001501",
                description="Konstanz service portal boat slip application",
                enabled=True,
                check_interval_minutes=3
            ),
            MonitoredUrl(
                name="Service-BW Leistungen",
                url="https://www.service-bw.de/zufi/leistungen/6001501?plz=78467&ags=08335043",
                description="Baden-Württemberg service portal boat slip info",
                enabled=True,
                check_interval_minutes=3
            ),
            MonitoredUrl(
                name="Service-BW Online Antrag",
                url="https://www.service-bw.de/onlineantraege/onlineantrag?processInstanceId=AZwTjGSsczqMBp3WMQZbUg",
                description="Baden-Württemberg online application form",
                enabled=True,
                check_interval_minutes=3
            )
        ]

        for url in urls:
            session.add(url)

        await session.commit()
        print(f"Seeded {len(urls)} URLs successfully!")
