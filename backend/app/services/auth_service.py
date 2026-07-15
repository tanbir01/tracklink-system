from __future__ import annotations

import uuid
from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from jose import JWTError

from app.models.user import User, UserSettings
from app.models.session import Session
from app.models.audit_log import AuditLog
from app.schemas.user import UserCreate, UserLogin, TokenResponse, UserSettingsUpdate, UserUpdate
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
)
from app.core.exceptions import (
    DuplicateException,
    UnauthorizedException,
    ForbiddenException,
    BadRequestException,
    NotFoundException,
)
from app.config import settings


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def log_activity(
        self, user_id: uuid.UUID | None, action: str, resource: str, details: dict, ip_address: str | None
    ):
        audit = AuditLog(
            user_id=user_id,
            action=action,
            resource=resource,
            details=details,
            ip_address=ip_address,
        )
        self.db.add(audit)
        await self.db.flush()

    async def register(self, body: UserCreate, ip_address: str | None = None) -> User:
        # Check duplicate username
        res = await self.db.execute(select(User).where(User.username == body.username))
        if res.scalar_one_or_none():
            raise DuplicateException("User", "username")

        # Check duplicate email
        res = await self.db.execute(select(User).where(User.email == body.email))
        if res.scalar_one_or_none():
            raise DuplicateException("User", "email")

        # Create user
        hashed = hash_password(body.password)
        
        # Check if first user
        res_count = await self.db.execute(select(User))
        is_first = len(res_count.scalars().all()) == 0
        role = "admin" if is_first else "user"

        user = User(
            username=body.username,
            email=body.email,
            password_hash=hashed,
            role=role,
            is_active=True,
        )
        self.db.add(user)
        await self.db.flush()

        # Create default settings
        settings_obj = UserSettings(
            user_id=user.id,
            update_interval=settings.DEFAULT_UPDATE_INTERVAL_SECONDS,
            battery_optimization=True,
            notify_low_battery=True,
            notify_device_offline=True,
            notify_device_online=True,
            notify_geofence_enter=True,
            notify_geofence_exit=True,
            notify_device_restart=True,
            notify_sim_changed=True,
            map_provider="openstreetmap",
            theme="dark",
        )
        self.db.add(settings_obj)
        await self.db.flush()

        await self.log_activity(
            user_id=user.id,
            action="register",
            resource="user",
            details={"username": user.username, "role": user.role},
            ip_address=ip_address,
        )
        await self.db.commit()
        return user

    async def login(
        self, body: UserLogin, ip_address: str | None = None, user_agent: str | None = None
    ) -> TokenResponse:
        res = await self.db.execute(
            select(User).where((User.username == body.username.lower()) | (User.email == body.username.lower()))
        )
        user = res.scalar_one_or_none()
        if not user or not verify_password(body.password, user.password_hash):
            raise UnauthorizedException("Invalid username or password")

        if not user.is_active:
            raise ForbiddenException("User account is inactive")

        # Generate tokens
        access_token = create_access_token(user.id, role=user.role)
        refresh_token = create_refresh_token(user.id)

        # Store session
        expires_at = datetime.now(timezone.utc) + timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS)
        session = Session(
            user_id=user.id,
            refresh_token=refresh_token,
            device_info=user_agent,
            ip_address=ip_address,
            expires_at=expires_at,
        )
        self.db.add(session)
        
        await self.log_activity(
            user_id=user.id,
            action="login",
            resource="auth",
            details={},
            ip_address=ip_address,
        )
        await self.db.commit()

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    async def refresh(
        self, refresh_token: str, ip_address: str | None = None, user_agent: str | None = None
    ) -> TokenResponse:
        try:
            payload = decode_refresh_token(refresh_token)
            user_id_str = payload.get("sub")
            if not user_id_str:
                raise UnauthorizedException("Invalid token format")
            user_id = uuid.UUID(user_id_str)
        except (JWTError, ValueError):
            raise UnauthorizedException("Invalid or expired refresh token")

        # Check session
        res = await self.db.execute(
            select(Session).where(
                Session.refresh_token == refresh_token,
                Session.is_revoked == False,
                Session.expires_at > datetime.now(timezone.utc),
            )
        )
        session = res.scalar_one_or_none()
        if not session:
            raise UnauthorizedException("Session expired or revoked")

        # Get user
        res_user = await self.db.execute(select(User).where(User.id == user_id))
        user = res_user.scalar_one_or_none()
        if not user or not user.is_active:
            raise UnauthorizedException("User not active or not found")

        # Generate new tokens
        new_access_token = create_access_token(user.id, role=user.role)
        new_refresh_token = create_refresh_token(user.id)

        # Revoke old session and save new one
        session.is_revoked = True
        
        new_expires_at = datetime.now(timezone.utc) + timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS)
        new_session = Session(
            user_id=user.id,
            refresh_token=new_refresh_token,
            device_info=user_agent,
            ip_address=ip_address,
            expires_at=new_expires_at,
        )
        self.db.add(new_session)
        await self.db.commit()

        return TokenResponse(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    async def logout(self, refresh_token: str, user_id: uuid.UUID) -> None:
        res = await self.db.execute(
            select(Session).where(
                Session.refresh_token == refresh_token,
                Session.user_id == user_id,
            )
        )
        session = res.scalar_one_or_none()
        if session:
            session.is_revoked = True
            await self.db.commit()

    async def change_password(
        self, user: User, current_password: str, new_password: str, ip_address: str | None = None
    ) -> None:
        if not verify_password(current_password, user.password_hash):
            raise BadRequestException("Invalid current password")

        user.password_hash = hash_password(new_password)
        
        # Revoke all sessions for this user
        res = await self.db.execute(select(Session).where(Session.user_id == user.id, Session.is_revoked == False))
        sessions = res.scalars().all()
        for session in sessions:
            session.is_revoked = True

        await self.log_activity(
            user_id=user.id,
            action="change_password",
            resource="user",
            details={},
            ip_address=ip_address,
        )
        await self.db.commit()

    async def get_or_create_settings(self, user_id: uuid.UUID) -> UserSettings:
        res = await self.db.execute(select(UserSettings).where(UserSettings.user_id == user_id))
        s = res.scalar_one_or_none()
        if not s:
            s = UserSettings(
                user_id=user_id,
                update_interval=settings.DEFAULT_UPDATE_INTERVAL_SECONDS,
                battery_optimization=True,
                notify_low_battery=True,
                notify_device_offline=True,
                notify_device_online=True,
                notify_geofence_enter=True,
                notify_geofence_exit=True,
                notify_device_restart=True,
                notify_sim_changed=True,
                map_provider="openstreetmap",
                theme="dark",
            )
            self.db.add(s)
            await self.db.commit()
            await self.db.refresh(s)
        return s

    async def update_settings(self, user_id: uuid.UUID, body: UserSettingsUpdate) -> UserSettings:
        s = await self.get_or_create_settings(user_id)
        
        # Update fields dynamically
        for field, value in body.model_dump(exclude_unset=True).items():
            setattr(s, field, value)

        await self.db.commit()
        await self.db.refresh(s)
        return s

    async def update_profile(self, user_id: uuid.UUID, body: UserUpdate) -> User:
        res = await self.db.execute(select(User).where(User.id == user_id))
        user = res.scalar_one_or_none()
        if not user:
            raise NotFoundException("User", user_id)

        # Check unique constraint if email or username changes
        if body.username is not None and body.username != user.username:
            chk = await self.db.execute(select(User).where(User.username == body.username))
            if chk.scalar_one_or_none():
                raise DuplicateException("User", "username")
            user.username = body.username

        if body.email is not None and body.email != user.email:
            chk = await self.db.execute(select(User).where(User.email == body.email))
            if chk.scalar_one_or_none():
                raise DuplicateException("User", "email")
            user.email = body.email

        await self.db.commit()
        await self.db.refresh(user)
        return user
