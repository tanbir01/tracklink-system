from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.core.exceptions import register_exception_handlers
from app.api.auth import router as auth_router
from app.api.devices import router as devices_router
from app.api.locations import router as locations_router
from app.api.alerts import router as alerts_router
from app.api.geofences import router as geofences_router
from app.api.settings import router as settings_router
from app.api.websocket import router as ws_router

# Configure logging
logging.basicConfig(
    level=logging.INFO if not settings.BACKEND_DEBUG else logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("tracklink")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    logger.info("Starting TrackLink Backend API...")
    yield
    # Shutdown logic
    logger.info("Stopping TrackLink Backend API...")

app = FastAPI(
    title="TrackLink API",
    description="Real-Time Personal Device Tracking System API",
    version="1.0.0",
    lifespan=lifespan,
    debug=settings.BACKEND_DEBUG,
)

# Set up CORS middleware
origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register custom exception handlers
register_exception_handlers(app)

# Include API routers
app.include_router(auth_router, prefix="/api")
app.include_router(devices_router, prefix="/api")
app.include_router(locations_router, prefix="/api")
app.include_router(alerts_router, prefix="/api")
app.include_router(geofences_router, prefix="/api")
app.include_router(settings_router, prefix="/api")
app.include_router(ws_router)  # Websocket endpoint usually mounted at /ws directly

@app.get("/health", tags=["System"])
async def health_check():
    return {"status": "healthy", "service": "tracklink-api"}
