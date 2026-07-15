"""DeviceStatus ORM model."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class DeviceStatus(Base):
    __tablename__ = "device_status"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("uuid_generate_v4()"),
    )
    device_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("devices.id", ondelete="CASCADE"),
        nullable=False,
    )
    battery_percent: Mapped[int | None] = mapped_column(Integer, nullable=True)
    is_charging: Mapped[bool | None] = mapped_column(Boolean, server_default=text("false"))
    wifi_connected: Mapped[bool | None] = mapped_column(Boolean, server_default=text("false"))
    mobile_data: Mapped[bool | None] = mapped_column(Boolean, server_default=text("false"))
    connection_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    network_operator: Mapped[str | None] = mapped_column(String(100), nullable=True)
    signal_strength: Mapped[int | None] = mapped_column(Integer, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        server_default=text("now()"),
    )

    # Relationships
    device: Mapped["Device"] = relationship("Device", back_populates="statuses")  # noqa: F821

    def __repr__(self) -> str:
        return f"<DeviceStatus battery={self.battery_percent}%>"
