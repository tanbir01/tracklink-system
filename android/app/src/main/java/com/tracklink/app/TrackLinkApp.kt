package com.tracklink.app

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import androidx.hilt.work.HiltWorkerFactory
import androidx.work.Configuration
import com.tracklink.app.util.Constants
import dagger.hilt.android.HiltAndroidApp
import javax.inject.Inject

@HiltAndroidApp
class TrackLinkApp : Application(), Configuration.Provider {

    @Inject
    lateinit var workerFactory: HiltWorkerFactory

    override fun onCreate() {
        super.onCreate()
        createNotificationChannels()
    }

    override val workManagerConfiguration: Configuration
        get() = Configuration.Builder()
            .setWorkerFactory(workerFactory)
            .setMinimumLoggingLevel(android.util.Log.INFO)
            .build()

    private fun createNotificationChannels() {
        val trackingChannel = NotificationChannel(
            Constants.NOTIFICATION_CHANNEL_TRACKING,
            "Location Tracking",
            NotificationManager.IMPORTANCE_LOW
        ).apply {
            description = "Persistent notification while tracking location"
            setShowBadge(false)
        }

        val syncChannel = NotificationChannel(
            Constants.NOTIFICATION_CHANNEL_SYNC,
            "Data Sync",
            NotificationManager.IMPORTANCE_MIN
        ).apply {
            description = "Background data synchronization notifications"
            setShowBadge(false)
        }

        val alertChannel = NotificationChannel(
            Constants.NOTIFICATION_CHANNEL_ALERTS,
            "Alerts",
            NotificationManager.IMPORTANCE_HIGH
        ).apply {
            description = "Important alerts and status updates"
        }

        val manager = getSystemService(NotificationManager::class.java)
        manager.createNotificationChannel(trackingChannel)
        manager.createNotificationChannel(syncChannel)
        manager.createNotificationChannel(alertChannel)
    }
}
