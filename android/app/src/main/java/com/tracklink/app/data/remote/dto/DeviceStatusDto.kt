package com.tracklink.app.data.remote.dto

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class DeviceStatusDto(
    @Json(name = "device_id") val deviceId: String,
    @Json(name = "device_model") val deviceModel: String,
    @Json(name = "os_version") val osVersion: String,
    @Json(name = "app_version") val appVersion: String,
    @Json(name = "battery_level") val batteryLevel: Int,
    @Json(name = "is_charging") val isCharging: Boolean,
    @Json(name = "network_type") val networkType: String,
    @Json(name = "network_operator") val networkOperator: String,
    @Json(name = "wifi_connected") val wifiConnected: Boolean,
    @Json(name = "mobile_data_enabled") val mobileDataEnabled: Boolean,
    @Json(name = "sim_operator") val simOperator: String,
    @Json(name = "sim_serial") val simSerial: String,
    @Json(name = "is_tracking") val isTracking: Boolean,
    @Json(name = "timestamp") val timestamp: Long
)

@JsonClass(generateAdapter = true)
data class DeviceStatusResponse(
    @Json(name = "success") val success: Boolean,
    @Json(name = "message") val message: String? = null,
    @Json(name = "update_interval") val updateInterval: Long? = null,
    @Json(name = "tracking_enabled") val trackingEnabled: Boolean? = null
)
