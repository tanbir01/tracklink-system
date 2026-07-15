package com.tracklink.app.data.remote

import com.tracklink.app.data.remote.dto.*
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PUT

interface ApiService {

    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>

    @POST("auth/refresh")
    suspend fun refreshToken(@Body request: RefreshTokenRequest): Response<RefreshTokenResponse>

    @POST("auth/logout")
    suspend fun logout(): Response<Unit>

    @POST("locations")
    suspend fun sendLocation(@Body location: LocationDto): Response<LocationResponse>

    @POST("locations/batch")
    suspend fun sendLocationBatch(@Body batch: LocationBatchDto): Response<LocationResponse>

    @PUT("devices/status")
    suspend fun updateDeviceStatus(@Body status: DeviceStatusDto): Response<DeviceStatusResponse>

    @GET("devices/config")
    suspend fun getDeviceConfig(): Response<DeviceStatusResponse>
}
