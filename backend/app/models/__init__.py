"""ORM models package – import all models so Alembic can discover them."""

from app.models.user import User, UserSettings  # noqa: F401
from app.models.device import Device  # noqa: F401
from app.models.location import Location  # noqa: F401
from app.models.device_status import DeviceStatus  # noqa: F401
from app.models.alert import Alert  # noqa: F401
from app.models.geofence import Geofence, DeviceGeofence  # noqa: F401
from app.models.session import Session  # noqa: F401
from app.models.audit_log import AuditLog  # noqa: F401
