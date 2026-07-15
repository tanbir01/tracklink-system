package com.tracklink.app.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.content.pm.ServiceInfo
import android.location.Location
import android.os.Build
import android.os.IBinder
import android.os.Looper
import android.util.Log
import androidx.core.app.NotificationCompat
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationCallback
import com.google.android.gms.location.LocationRequest
import com.google.android.gms.location.LocationResult
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.tracklink.app.R
import com.tracklink.app.data.repository.DeviceRepository
import com.tracklink.app.data.repository.LocationRepository
import com.tracklink.app.ui.MainActivity
import com.tracklink.app.util.Constants
import com.tracklink.app.util.DeviceInfo
import com.tracklink.app.util.NetworkUtil
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import javax.inject.Inject

@AndroidEntryPoint
class TrackingService : Service() {

    companion object {
        private const val TAG = "TrackingService"
        const val ACTION_START = "ACTION_START_TRACKING"
        const val ACTION_STOP = "ACTION_STOP_TRACKING"
    }

    @Inject
    lateinit var locationRepository: LocationRepository

    @Inject
    lateinit var deviceRepository: DeviceRepository

    @Inject
    lateinit var sharedPreferences: SharedPreferences

    @Inject
    lateinit var networkUtil: NetworkUtil

    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private lateinit var fusedLocationClient: FusedLocationProviderClient
    private var locationCallback: LocationCallback? = null

    override fun onCreate() {
        super.onCreate()
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> startTrackingService()
            ACTION_STOP -> stopTrackingService()
        }
        return START_STICKY
    }

    private fun startTrackingService() {
        Log.d(TAG, "Starting tracking foreground service")
        val notification = createNotification("TrackLink is running in the background", "Capturing GPS telemetry...")
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(
                Constants.FOREGROUND_SERVICE_NOTIFICATION_ID,
                notification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION
            )
        } else {
            startForeground(Constants.FOREGROUND_SERVICE_NOTIFICATION_ID, notification)
        }

        startLocationUpdates()
        sharedPreferences.edit().putBoolean(Constants.PREF_KEY_IS_TRACKING, true).apply()
    }

    private fun startLocationUpdates() {
        val intervalSeconds = sharedPreferences.getLong(
            Constants.PREF_KEY_UPDATE_INTERVAL,
            Constants.DEFAULT_UPDATE_INTERVAL_SECONDS
        )

        val locationRequest = LocationRequest.Builder(
            Priority.PRIORITY_HIGH_ACCURACY,
            intervalSeconds * 1000
        ).apply {
            setMinUpdateIntervalMillis(intervalSeconds * 1000 / 2)
            setWaitForAccurateLocation(false)
        }.build()

        locationCallback = object : LocationCallback() {
            override fun onLocationResult(locationResult: LocationResult) {
                for (location in locationResult.locations) {
                    handleLocationUpdate(location)
                }
            }
        }

        try {
            fusedLocationClient.requestLocationUpdates(
                locationRequest,
                locationCallback!!,
                Looper.getMainLooper()
            )
        } catch (unlikely: SecurityException) {
            Log.e(TAG, "Lost location permission. Could not request updates. $unlikely")
        }
    }

    private fun handleLocationUpdate(location: Location) {
        val batteryLevel = DeviceInfo.getBatteryPercent(this)
        val isCharging = DeviceInfo.isCharging(this)
        val netType = networkUtil.getConnectionType()

        serviceScope.launch {
            try {
                // Send location telemetry
                locationRepository.sendLocation(
                    latitude = location.latitude,
                    longitude = location.longitude,
                    altitude = location.altitude,
                    accuracy = location.accuracy,
                    speed = location.speed,
                    bearing = location.bearing,
                    batteryLevel = batteryLevel,
                    isCharging = isCharging,
                    networkType = netType
                )

                // Periodically update status payload
                val deviceId = sharedPreferences.getString(Constants.PREF_KEY_DEVICE_ID, "") ?: ""
                if (deviceId.isNotEmpty()) {
                    val statusDto = DeviceInfo.getDeviceStatusDto(this@TrackingService, deviceId)
                    deviceRepository.updateDeviceStatus(statusDto)
                }
            } catch (e: Exception) {
                Log.e(TAG, "Failed to process location update", e)
            }
        }
    }

    private fun stopTrackingService() {
        Log.d(TAG, "Stopping tracking service")
        locationCallback?.let {
            fusedLocationClient.removeLocationUpdates(it)
        }
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
        sharedPreferences.edit().putBoolean(Constants.PREF_KEY_IS_TRACKING, false).apply()
    }

    private fun createNotification(title: String, text: String): Notification {
        val mainIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            mainIntent,
            PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, Constants.NOTIFICATION_CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(text)
            // Use fallback icon, or launcher icon since standard res files are generated
            .setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .setOngoing(true)
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .build()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                Constants.NOTIFICATION_CHANNEL_ID,
                Constants.NOTIFICATION_CHANNEL_NAME,
                NotificationManager.IMPORTANCE_LOW
            )
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        serviceScope.cancel()
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }
}
