package com.tracklink.app.data.remote.dto

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class LocationDto(
    @Json(name = "latitude") val latitude: Double,
    @Json(name = "longitude") val longitude: Double,
    @Json(name = "altitude") val altitude: Double,
    @Json(name = "accuracy") val accuracy: Float,
    @Json(name = "speed") val speed: Float,
    @Json(name = "bearing") val bearing: Float,
    @Json(name = "battery_level") val batteryLevel: Int,
    @Json(name = "is_charging") val isCharging: Boolean,
    @Json(name = "network_type") val networkType: String,
    @Json(name = "timestamp") val timestamp: Long
)

@JsonClass(generateAdapter = true)
data class LocationBatchDto(
    @Json(name = "device_id") val deviceId: String,
    @Json(name = "locations") val locations: List<LocationDto>
)

@JsonClass(generateAdapter = true)
data class LocationResponse(
    @Json(name = "success") val success: Boolean,
    @Json(name = "message") val message: String? = null,
    @Json(name = "synced_count") val syncedCount: Int? = null
)
