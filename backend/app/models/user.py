"""User and UserSettings ORM models."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Integer, String, ForeignKey, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("uuid_generate_v4()"),
    )
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False, server_default="user")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("true"))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        server_default=text("now()"),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        server_default=text("now()"),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    devices: Mapped[list["Device"]] = relationship(  # noqa: F821
        "Device", back_populates="user", cascade="all, delete-orphan", lazy="selectin"
    )
    alerts: Mapped[list["Alert"]] = relationship(  # noqa: F821
        "Alert", back_populates="user", cascade="all, delete-orphan", lazy="selectin"
    )
    geofences: Mapped[list["Geofence"]] = relationship(  # noqa: F821
        "Geofence", back_populates="user", cascade="all, delete-orphan", lazy="selectin"
    )
    sessions: Mapped[list["Session"]] = relationship(  # noqa: F821
        "Session", back_populates="user", cascade="all, delete-orphan", lazy="selectin"
    )
    settings: Mapped["UserSettings | None"] = relationship(
        "UserSettings", back_populates="user", uselist=False, cascade="all, delete-orphan", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<User {self.username}>"


class UserSettings(Base):
    __tablename__ = "user_settings"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("uuid_generate_v4()"),
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    update_interval: Mapped[int] = mapped_column(Integer, nullable=False, server_default="10")
    battery_optimization: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("true"))
    notify_low_battery: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("true"))
    notify_device_offline: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("true"))
    notify_device_online: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("true"))
    notify_geofence_enter: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("true"))
    notify_geofence_exit: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("true"))
    notify_device_restart: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("true"))
    notify_sim_changed: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("true"))
    map_provider: Mapped[str] = mapped_column(String(50), nullable=False, server_default="openstreetmap")
    theme: Mapped[str] = mapped_column(String(20), nullable=False, server_default="dark")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        server_default=text("now()"),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        server_default=text("now()"),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="settings")

    def __repr__(self) -> str:
        return f"<UserSettings user_id={self.user_id}>"
