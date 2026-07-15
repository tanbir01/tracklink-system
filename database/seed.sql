-- =============================================================================
-- TrackLink Database Seed Data
-- =============================================================================
-- Initial data for development and testing
-- Default admin password: admin123 (bcrypt hash)
-- =============================================================================

-- Insert default admin user
-- Password: admin123 (hashed with bcrypt, 12 rounds)
INSERT INTO users (id, username, email, password_hash, role, is_active)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'admin',
    'admin@tracklink.local',
    '$2b$12$LJ3m4ys3LzHOr8MqtVRZ0OcKkHMhqpBtemM0/XMUOiXjHUeclFFpy',
    'admin',
    TRUE
) ON CONFLICT (email) DO NOTHING;

-- Insert default user settings for admin
INSERT INTO user_settings (user_id, update_interval, map_provider, theme)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    10,
    'openstreetmap',
    'dark'
) ON CONFLICT (user_id) DO NOTHING;

-- =============================================================================
-- Print success message
-- =============================================================================
DO $$
BEGIN
    RAISE NOTICE 'TrackLink seed data inserted successfully!';
    RAISE NOTICE 'Default admin credentials: admin@tracklink.local / admin123';
END
$$;
