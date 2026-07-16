package com.tracklink.app.util

object Constants {
    const val DEFAULT_API_URL = "https://tracklink-system.onrender.com/api/" // Production Cloud Backend
    const val DEFAULT_WS_URL = "wss://tracklink-system.onrender.com/ws"

    // Preference Keys
    const val PREF_KEY_SERVER_URL = "server_url"
    const val PREF_KEY_WS_URL = "ws_url"
    const val PREF_KEY_TOKEN = "access_token"
    const val PREF_KEY_REFRESH_TOKEN = "refresh_token"
    const val PREF_KEY_DEVICE_ID = "device_id"
    const val PREF_KEY_UPDATE_INTERVAL = "update_interval"
    const val PREF_KEY_IS_TRACKING = "is_tracking"
    const val PREF_KEY_BATTERY_OPTIMIZE = "battery_optimize"

    // Defaults
    const val DEFAULT_UPDATE_INTERVAL_SECONDS = 10L

    // Notifications
    const val NOTIFICATION_CHANNEL_TRACKING = "tracklink_tracking_channel"
    const val NOTIFICATION_CHANNEL_SYNC = "tracklink_sync_channel"
    const val NOTIFICATION_CHANNEL_ALERTS = "tracklink_alerts_channel"
    const val NOTIFICATION_CHANNEL_ID = "tracklink_tracking_channel"
    const val NOTIFICATION_CHANNEL_NAME = "TrackLink Background Location Tracking"
    const val FOREGROUND_SERVICE_NOTIFICATION_ID = 1001
}
