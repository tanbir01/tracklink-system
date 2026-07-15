package com.tracklink.app.data.remote.dto

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class LoginRequest(
    @Json(name = "username") val username: String,
    @Json(name = "password") val password: String,
    @Json(name = "device_id") val deviceId: String,
    @Json(name = "device_model") val deviceModel: String
)

@JsonClass(generateAdapter = true)
data class LoginResponse(
    @Json(name = "success") val success: Boolean,
    @Json(name = "token") val token: String? = null,
    @Json(name = "refresh_token") val refreshToken: String? = null,
    @Json(name = "device_id") val deviceId: String? = null,
    @Json(name = "message") val message: String? = null,
    @Json(name = "expires_at") val expiresAt: Long? = null
)

@JsonClass(generateAdapter = true)
data class RefreshTokenRequest(
    @Json(name = "refresh_token") val refreshToken: String
)

@JsonClass(generateAdapter = true)
data class RefreshTokenResponse(
    @Json(name = "success") val success: Boolean,
    @Json(name = "token") val token: String? = null,
    @Json(name = "expires_at") val expiresAt: Long? = null,
    @Json(name = "message") val message: String? = null
)
