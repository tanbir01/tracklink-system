package com.tracklink.app.data.repository

import android.util.Log
import com.tracklink.app.data.local.dao.LocationDao
import com.tracklink.app.data.local.entity.CachedLocation
import com.tracklink.app.data.remote.ApiService
import com.tracklink.app.data.remote.WebSocketManager
import com.tracklink.app.data.remote.dto.LocationBatchDto
import com.tracklink.app.data.remote.dto.LocationDto
import com.tracklink.app.util.NetworkUtil
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class LocationRepository @Inject constructor(
    private val locationDao: LocationDao,
    private val apiService: ApiService,
    private val webSocketManager: WebSocketManager,
    private val networkUtil: NetworkUtil,
    private val authRepository: AuthRepository
) {

    companion object {
        private const val TAG = "LocationRepository"
        private const val BATCH_SIZE = 50
        private const val CACHE_RETENTION_MS = 7L * 24 * 60 * 60 * 1000 // 7 days
    }

    /**
     * Send location to server via WebSocket (real-time) and cache locally.
     * Falls back to REST API if WebSocket is disconnected.
     * Always caches locally for offline resilience.
     */
    suspend fun sendLocation(
        latitude: Double,
        longitude: Double,
        altitude: Double,
        accuracy: Float,
        speed: Float,
        bearing: Float,
        batteryLevel: Int,
        isCharging: Boolean,
        networkType: String
    ) {
        val timestamp = System.currentTimeMillis()

        val locationDto = LocationDto(
            latitude = latitude,
            longitude = longitude,
            altitude = altitude,
            accuracy = accuracy,
            speed = speed,
            bearing = bearing,
            batteryLevel = batteryLevel,
            isCharging = isCharging,
            networkType = networkType,
            timestamp = timestamp
        )

        val cachedLocation = CachedLocation(
            latitude = latitude,
            longitude = longitude,
            altitude = altitude,
            accuracy = accuracy,
            speed = speed,
            bearing = bearing,
            batteryLevel = batteryLevel,
            isCharging = isCharging,
            networkType = networkType,
            timestamp = timestamp
        )

        // Always cache locally first
        val cachedId = locationDao.insert(cachedLocation)

        // Try to send via WebSocket first (real-time)
        var sent = false
        if (webSocketManager.connectionState.value == WebSocketManager.ConnectionState.Connected) {
            sent = webSocketManager.sendLocationUpdate(locationDto)
            if (sent) {
                Log.d(TAG, "Location sent via WebSocket")
                locationDao.markAsSynced(listOf(cachedId))
            }
        }

        // Fallback to REST API if WebSocket failed and we have network
        if (!sent && networkUtil.isNetworkAvailable()) {
            try {
                val response = apiService.sendLocation(locationDto)
                if (response.isSuccessful && response.body()?.success == true) {
                    locationDao.markAsSynced(listOf(cachedId))
                    Log.d(TAG, "Location sent via REST API")
                } else {
                    Log.w(TAG, "REST API rejected location: ${response.code()}")
                }
            } catch (e: Exception) {
                Log.w(TAG, "Failed to send location via REST", e)
                // Location stays cached for later sync
            }
        }

        if (!sent) {
            Log.d(TAG, "Location cached locally for later sync (id=$cachedId)")
        }
    }

    /**
     * Sync all cached (unsynced) locations to the server in batches.
     * Called by WorkManager or manual sync.
     */
    suspend fun syncCachedLocations(): Result<Int> {
        if (!networkUtil.isNetworkAvailable()) {
            return Result.failure(Exception("No network available"))
        }

        var totalSynced = 0
        val deviceId = authRepository.getDeviceId()

        try {
            while (true) {
                val unsyncedLocations = locationDao.getUnsyncedLocations(BATCH_SIZE)
                if (unsyncedLocations.isEmpty()) break

                val locationDtos = unsyncedLocations.map { cached ->
                    LocationDto(
                        latitude = cached.latitude,
                        longitude = cached.longitude,
                        altitude = cached.altitude,
                        accuracy = cached.accuracy,
                        speed = cached.speed,
                        bearing = cached.bearing,
                        batteryLevel = cached.batteryLevel,
                        isCharging = cached.isCharging,
                        networkType = cached.networkType,
                        timestamp = cached.timestamp
                    )
                }

                val batch = LocationBatchDto(
                    deviceId = deviceId,
                    locations = locationDtos
                )

                val response = apiService.sendLocationBatch(batch)
                if (response.isSuccessful && response.body()?.success == true) {
                    val ids = unsyncedLocations.map { it.id }
                    locationDao.markAsSynced(ids)
                    totalSynced += ids.size
                    Log.i(TAG, "Synced batch of ${ids.size} locations")
                } else {
                    Log.w(TAG, "Batch sync failed: ${response.code()} ${response.message()}")
                    break
                }
            }

            // Cleanup old synced locations
            val cutoff = System.currentTimeMillis() - CACHE_RETENTION_MS
            val deleted = locationDao.deleteSyncedOlderThan(cutoff)
            if (deleted > 0) {
                Log.i(TAG, "Cleaned up $deleted old synced locations")
            }

            Log.i(TAG, "Sync complete: $totalSynced locations synced")
            return Result.success(totalSynced)

        } catch (e: Exception) {
            Log.e(TAG, "Sync failed after syncing $totalSynced locations", e)
            return if (totalSynced > 0) {
                Result.success(totalSynced) // Partial success
            } else {
                Result.failure(e)
            }
        }
    }

    suspend fun getUnsyncedCount(): Int = locationDao.getUnsyncedCount()

    suspend fun getTotalCachedCount(): Int = locationDao.getTotalCount()

    suspend fun getLatestCachedLocation(): CachedLocation? = locationDao.getLatestLocation()

    suspend fun clearAllCachedData() {
        locationDao.deleteAll()
    }
}
