package com.tracklink.app.data.repository

import android.util.Log
import com.tracklink.app.data.remote.ApiService
import com.tracklink.app.data.remote.dto.DeviceStatusDto
import com.tracklink.app.util.DeviceInfo
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class DeviceRepository @Inject constructor(
    private val apiService: ApiService,
    private val authRepository: AuthRepository,
    private val deviceInfo: DeviceInfo
) {

    companion object {
        private const val TAG = "DeviceRepository"
    }

    /**
     * Report full device status to the server.
     * Returns optional remote config (update interval, tracking enabled).
     */
    suspend fun reportDeviceStatus(isTracking: Boolean): Result<DeviceStatusDto> {
        return try {
            val status = DeviceStatusDto(
                deviceId = authRepository.getDeviceId(),
                deviceModel = deviceInfo.getDeviceModel(),
                osVersion = deviceInfo.getOsVersion(),
                appVersion = deviceInfo.getAppVersion(),
                batteryLevel = deviceInfo.getBatteryLevel(),
                isCharging = deviceInfo.isCharging(),
                networkType = deviceInfo.getNetworkType(),
                networkOperator = deviceInfo.getNetworkOperator(),
                wifiConnected = deviceInfo.isWifiConnected(),
                mobileDataEnabled = deviceInfo.isMobileDataEnabled(),
                simOperator = deviceInfo.getSimOperator(),
                simSerial = deviceInfo.getSimSerial(),
                isTracking = isTracking,
                timestamp = System.currentTimeMillis()
            )

            val response = apiService.updateDeviceStatus(status)

            if (response.isSuccessful && response.body()?.success == true) {
                Log.i(TAG, "Device status reported successfully")
                Result.success(status)
            } else {
                val errorMsg = response.body()?.message ?: "Status update failed (${response.code()})"
                Log.w(TAG, "Device status report failed: $errorMsg")
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to report device status", e)
            Result.failure(e)
        }
    }

    /**
     * Fetch device configuration from the server.
     * Can include update interval and tracking enable/disable commands.
     */
    suspend fun fetchDeviceConfig(): Result<Pair<Long?, Boolean?>> {
        return try {
            val response = apiService.getDeviceConfig()

            if (response.isSuccessful) {
                val body = response.body()
                val updateInterval = body?.updateInterval
                val trackingEnabled = body?.trackingEnabled
                Log.i(TAG, "Device config fetched: interval=$updateInterval, tracking=$trackingEnabled")
                Result.success(Pair(updateInterval, trackingEnabled))
            } else {
                Result.failure(Exception("Config fetch failed (${response.code()})"))
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to fetch device config", e)
            Result.failure(e)
        }
    }

    fun getDeviceId(): String = authRepository.getDeviceId()

    fun buildCurrentStatus(isTracking: Boolean): DeviceStatusDto {
        return DeviceStatusDto(
            deviceId = authRepository.getDeviceId(),
            deviceModel = deviceInfo.getDeviceModel(),
            osVersion = deviceInfo.getOsVersion(),
            appVersion = deviceInfo.getAppVersion(),
            batteryLevel = deviceInfo.getBatteryLevel(),
            isCharging = deviceInfo.isCharging(),
            networkType = deviceInfo.getNetworkType(),
            networkOperator = deviceInfo.getNetworkOperator(),
            wifiConnected = deviceInfo.isWifiConnected(),
            mobileDataEnabled = deviceInfo.isMobileDataEnabled(),
            simOperator = deviceInfo.getSimOperator(),
            simSerial = deviceInfo.getSimSerial(),
            isTracking = isTracking,
            timestamp = System.currentTimeMillis()
        )
    }
}
