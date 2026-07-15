# TrackLink - Real-Time Personal Device Tracking System

TrackLink is an open-source, lightweight, fast, secure, and self-hosted device tracking system. It consists of an Android background tracking application (Tracker), a FastAPI backend API gateway, a React dashboard control panel, and Nginx reverse proxy routing.

## System Architecture

```
Android Tracker App (Kotlin)
           │
           │ HTTPS / WSS
           ▼
Nginx Reverse Proxy (Port 80/443)
           │
           ├── /api/auth    ──► FastAPI Auth
           ├── /api/devices ──► FastAPI Device Manager
           ├── /api/logs    ──► FastAPI Location history
           ├── /ws          ──► FastAPI WebSocket
           └── /            ──► React SPA Static Build
```

## Quick Start (Docker Compose)

### 1. Configure Settings
Copy `.env.example` to `.env` and configure your credentials:
```bash
cp .env.example .env
```

### 2. Run the Stack
Start PostgreSQL, Redis, FastAPI Backend, React Frontend, and Nginx using Docker Compose:
```bash
docker-compose up -d --build
```

The services will initialize and listen on:
- **Web Dashboard**: `http://localhost/` (Port 80)
- **API Server Gateway**: `http://localhost:8000/api/`
- **WebSocket Connection**: `ws://localhost:8000/ws`

### 3. Default Login
- **Admin Email**: `admin@tracklink.local`
- **Password**: `admin123` *(Please change your password immediately in Settings)*

## Modules and Configurations

### Web Dashboard
Built with React, Leaflet Map (OSM), and Tailwind CSS.
Run development environment with hot reload:
```bash
cd frontend
npm install
npm run dev
```

### Backend Gateway
Built with FastAPI, SQLAlchemy Async, PostgreSQL, and Redis.
Run development server:
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Android Tracker Client
Built with Kotlin, Google Fused Location, and Hilt.
1. Open the `./android/` folder in **Android Studio**.
2. Configure your server URL (e.g. `http://your-server-ip:8000/api/`) in Settings.
3. Obtain a Device ID from the Dashboard and input it in the tracker settings.
4. Toggle tracking on and accept background GPS location approvals.

## Security Features
- SSL/TLS encryption support on Nginx proxy.
- JWT Access and Refresh token rotation.
- Bcrypt password hashing (12 rounds).
- Local cache encryption on Android (EncryptedSharedPreferences).
- Sliding-window rate limit protection on auth endpoints.

## License
Licensed under the [MIT License](LICENSE).
