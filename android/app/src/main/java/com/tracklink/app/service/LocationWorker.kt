package com.tracklink.app.service

import android.content.Context
import android.util.Log
import androidx.hilt.work.HiltWorker
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.tracklink.app.data.repository.LocationRepository
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject

@HiltWorker
class LocationWorker @AssistedInject constructor(
    @Assisted context: Context,
    @Assisted workerParams: WorkerParameters,
    private val locationRepository: LocationRepository
) : CoroutineWorker(context, workerParams) {

    companion object {
        private const val TAG = "LocationWorker"
    }

    override suspend fun doWork(): Result {
        Log.d(TAG, "Starting periodic location sync worker")
        return try {
            val syncResult = locationRepository.syncCachedLocations()
            if (syncResult.isSuccess) {
                val syncedCount = syncResult.getOrDefault(0)
                Log.d(TAG, "Successfully synced $syncedCount locations")
                Result.success()
            } else {
                Log.w(TAG, "Batch sync failed: ${syncResult.exceptionOrNull()?.message}")
                Result.retry()
            }
        } catch (e: Exception) {
            Log.e(TAG, "Worker failed unexpectedly", e)
            Result.failure()
        }
    }
}
