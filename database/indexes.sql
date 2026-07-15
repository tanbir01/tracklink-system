-- =============================================================================
-- TrackLink Database Indexes
-- =============================================================================
-- Performance-critical indexes for common queries
-- =============================================================================

-- Locations: Most queried table - optimize for device history lookups
CREATE INDEX IF NOT EXISTS idx_locations_device_timestamp
    ON locations(device_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_locations_device_created
    ON locations(device_id, created_at DESC);

-- Locations: Spatial queries (basic lat/lng box queries)
CREATE INDEX IF NOT EXISTS idx_locations_coordinates
    ON locations(latitude, longitude);

-- Locations: Deduplication check (prevent duplicate timestamps per device)
CREATE UNIQUE INDEX IF NOT EXISTS idx_locations_device_timestamp_unique
    ON locations(device_id, timestamp);

-- Device Status: Latest status lookup
CREATE INDEX IF NOT EXISTS idx_device_status_device_timestamp
    ON device_status(device_id, timestamp DESC);

-- Alerts: Unread alerts per user
CREATE INDEX IF NOT EXISTS idx_alerts_user_unread
    ON alerts(user_id, is_read) WHERE is_read = FALSE;

-- Alerts: Device alerts
CREATE INDEX IF NOT EXISTS idx_alerts_device_created
    ON alerts(device_id, created_at DESC);

-- Alerts: Type filtering
CREATE INDEX IF NOT EXISTS idx_alerts_type
    ON alerts(type, created_at DESC);

-- Devices: User's devices
CREATE INDEX IF NOT EXISTS idx_devices_user
    ON devices(user_id);

-- Devices: Online status
CREATE INDEX IF NOT EXISTS idx_devices_online
    ON devices(is_online);

-- Devices: Unique device ID lookup
CREATE INDEX IF NOT EXISTS idx_devices_device_id
    ON devices(device_id);

-- Sessions: Token lookup
CREATE INDEX IF NOT EXISTS idx_sessions_refresh_token
    ON sessions(refresh_token) WHERE is_revoked = FALSE;

-- Sessions: User sessions
CREATE INDEX IF NOT EXISTS idx_sessions_user
    ON sessions(user_id, is_revoked);

-- Sessions: Expired sessions cleanup
CREATE INDEX IF NOT EXISTS idx_sessions_expires
    ON sessions(expires_at) WHERE is_revoked = FALSE;

-- Geofences: User's geofences
CREATE INDEX IF NOT EXISTS idx_geofences_user
    ON geofences(user_id, is_enabled);

-- Device Geofences: Quick state lookup
CREATE INDEX IF NOT EXISTS idx_device_geofences_device
    ON device_geofences(device_id);

-- Audit Logs: User activity
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created
    ON audit_logs(user_id, created_at DESC);

-- Audit Logs: Action filtering
CREATE INDEX IF NOT EXISTS idx_audit_logs_action
    ON audit_logs(action, created_at DESC);

-- =============================================================================
-- Print success message
-- =============================================================================
DO $$
BEGIN
    RAISE NOTICE 'TrackLink database indexes created successfully!';
END
$$;
