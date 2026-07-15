# TrackLink Gateway API Specifications

The backend server is built with FastAPI. It exposes a REST API and a real-time WebSocket communication channel.

## REST Endpoints

### 1. Authentication (`/api/auth`)
- `POST /api/auth/register`: Create a new user account.
  - Body: `{ "username": "...", "email": "...", "password": "..." }`
- `POST /api/auth/login`: Authenticate credentials. Returns Access + Refresh tokens.
  - Body: `{ "username": "...", "password": "..." }`
- `POST /api/auth/refresh`: Rotate refresh token to obtain a fresh access token.
  - Body: `{ "refresh_token": "..." }`
- `POST /api/auth/change-password`: Modify user password and revoke all active sessions.
  - Headers: `Authorization: Bearer <TOKEN>`
  - Body: `{ "current_password": "...", "new_password": "..." }`

### 2. Device Fleet (`/api/devices`)
- `POST /api/devices`: Register a new device.
  - Body: `{ "device_id": "string-id", "name": "...", "model": "...", "manufacturer": "..." }`
- `GET /api/devices`: List all registered devices for the user.
- `GET /api/devices/{id}`: Fetch device details.
- `PUT /api/devices/{id}`: Modify device details.
- `DELETE /api/devices/{id}`: Delete a device and clean up all coordinates history.
- `POST /api/devices/status`: Report battery, charger, signal status from client.
  - Body: `{ "device_id": "string-id", "battery_percent": 88, "is_charging": true, "connection_type": "WIFI", ... }`

### 3. Location History (`/api/locations`)
- `POST /api/locations`: Submit a single coordinate point (real-time fallback).
- `POST /api/locations/batch`: Sync batch coordinates (offline sync).
  - Body: `{ "locations": [ { "latitude": 23.81, "longitude": 90.41, "timestamp": "ISO-Date", ... } ] }`
- `GET /api/locations/device/{device_uuid}/history`: Retrieve travel logs. Supports filters `start_time`, `end_time`.
- `GET /api/locations/device/{device_uuid}/latest`: Retrieve the latest recorded position.
- `GET /api/locations/device/{device_uuid}/export`: Export coordinate logs as standard CSV.

### 4. Geofences (`/api/geofences`)
- `POST /api/geofences`: Create a circular boundary fence.
  - Body: `{ "name": "Work", "latitude": 23.81, "longitude": 90.41, "radius_meters": 200 }`
- `GET /api/geofences`: List all user geofences.
- `PATCH /api/geofences/{id}/toggle`: Enable or disable boundaries check.

---

## WebSocket Gateway (`/ws`)

Clients (Web Dashboard) subscribe to real-time events by opening a WebSocket stream:
`ws://localhost:8000/ws?token=<ACCESS_TOKEN>`

### Message Format
The gateway pushes structured updates to subscribed web panels:
```json
{
  "type": "location_update" | "device_status" | "alert",
  "data": { ... }
}
```
- **ping**: Clients should periodically dispatch `{"type": "ping"}` to prevent connection timeouts. The server will reply with `{"type": "pong"}`.
