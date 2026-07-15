package com.tracklink.app.ui

import android.content.Intent
import android.content.SharedPreferences
import android.content.pm.PackageManager
import android.os.Bundle
import android.widget.Button
import android.widget.ImageButton
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import com.tracklink.app.R
import com.tracklink.app.data.repository.LocationRepository
import com.tracklink.app.service.TrackingService
import com.tracklink.app.util.Constants
import com.tracklink.app.util.PermissionHelper
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : AppCompatActivity() {

    private val PERMISSION_REQUEST_CODE = 2002

    @Inject
    lateinit var sharedPreferences: SharedPreferences

    @Inject
    lateinit var locationRepository: LocationRepository

    private lateinit var tvTrackingStatus: TextView
    private lateinit var tvConnectionStatus: TextView
    private lateinit var tvDeviceInfo: TextView
    private lateinit var tvUnsyncedCount: TextView
    private lateinit var tvLatestGps: TextView
    private lateinit var btnToggleTracking: Button
    private lateinit var btnSyncNow: Button
    private lateinit var btnSettings: ImageButton

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        tvTrackingStatus = findViewById(R.id.tv_tracking_status)
        tvConnectionStatus = findViewById(R.id.tv_connection_status)
        tvDeviceInfo = findViewById(R.id.tv_device_info)
        tvUnsyncedCount = findViewById(R.id.tv_unsynced_count)
        tvLatestGps = findViewById(R.id.tv_latest_gps)
        btnToggleTracking = findViewById(R.id.btn_toggle_tracking)
        btnSyncNow = findViewById(R.id.btn_sync_now)
        btnSettings = findViewById(R.id.btn_settings)

        btnToggleTracking.setOnClickListener {
            toggleTracking()
        }

        btnSyncNow.setOnClickListener {
            triggerManualSync()
        }

        btnSettings.setOnClickListener {
            startActivity(Intent(this, SettingsActivity::class.java))
        }

        updateUiState()
        checkPermissions()
    }

    override fun onResume() {
        super.onResume()
        updateUiState()
    }

    private fun updateUiState() {
        val isTracking = sharedPreferences.getBoolean(Constants.PREF_KEY_IS_TRACKING, false)
        val deviceId = sharedPreferences.getString(Constants.PREF_KEY_DEVICE_ID, "N/A")

        tvDeviceInfo.text = "Device ID: $deviceId"
        
        if (isTracking) {
            tvTrackingStatus.text = "BACKGROUND TELEMETRY ACTIVE"
            tvTrackingStatus.setTextColor(getColor(R.color.accent))
            btnToggleTracking.text = "Stop Telemetry Tracking"
            btnToggleTracking.setBackgroundColor(getColor(R.color.error))
        } else {
            tvTrackingStatus.text = "TELEMETRY INACTIVE"
            tvTrackingStatus.setTextColor(getColor(R.color.error))
            btnToggleTracking.text = "Start Telemetry Tracking"
            btnToggleTracking.setBackgroundColor(getColor(R.color.primary))
        }

        // Query Room local database unsynced locations count
        CoroutineScope(Dispatchers.IO).launch {
            val unsyncedCount = locationRepository.getUnsyncedCount()
            val totalCached = locationRepository.getTotalCachedCount()
            val latest = locationRepository.getLatestCachedLocation()

            withContext(Dispatchers.Main) {
                tvUnsyncedCount.text = "Unsynced cached logs: $unsyncedCount (Total: $totalCached)"
                if (latest != null) {
                    tvLatestGps.text = "Latest Coords: ${latest.latitude.format(5)}, ${latest.longitude.format(5)}"
                } else {
                    tvLatestGps.text = "Latest Coords: Not recorded"
                }
            }
        }
    }

    private fun Double.format(digits: Int) = "%.${digits}f".format(this)

    private fun toggleTracking() {
        if (!PermissionHelper.hasPermissions(this)) {
            checkPermissions()
            return
        }

        val isTracking = sharedPreferences.getBoolean(Constants.PREF_KEY_IS_TRACKING, false)
        val serviceIntent = Intent(this, TrackingService::class.java)

        if (isTracking) {
            serviceIntent.action = TrackingService.ACTION_STOP
            startService(serviceIntent)
            Toast.makeText(this, "Tracking service stopped.", Toast.LENGTH_SHORT).show()
        } else {
            serviceIntent.action = TrackingService.ACTION_START
            startForegroundService(serviceIntent)
            Toast.makeText(this, "Tracking service started.", Toast.LENGTH_SHORT).show()
        }

        // Give service small time to process and write preferences
        btnToggleTracking.postDelayed({ updateUiState() }, 500)
    }

    private fun triggerManualSync() {
        btnSyncNow.isEnabled = false
        btnSyncNow.text = "Syncing..."
        
        CoroutineScope(Dispatchers.IO).launch {
            val result = locationRepository.syncCachedLocations()
            withContext(Dispatchers.Main) {
                btnSyncNow.isEnabled = true
                btnSyncNow.text = "Sync Cached Logs"
                if (result.isSuccess) {
                    val count = result.getOrDefault(0)
                    Toast.makeText(this@MainActivity, "Manual Sync Complete. Synced $count logs.", Toast.LENGTH_SHORT).show()
                } else {
                    Toast.makeText(this@MainActivity, "Sync Failed: ${result.exceptionOrNull()?.message}", Toast.LENGTH_LONG).show()
                }
                updateUiState()
            }
        }
    }

    private fun checkPermissions() {
        if (!PermissionHelper.hasPermissions(this)) {
            ActivityCompat.requestPermissions(
                this,
                PermissionHelper.REQUIRED_PERMISSIONS,
                PERMISSION_REQUEST_CODES()
            )
        }
    }

    private fun PERMISSION_REQUEST_CODES() = PERMISSION_REQUEST_CODE

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == PERMISSION_REQUEST_CODE) {
            val granted = grantResults.isNotEmpty() && grantResults.all { it == PackageManager.PERMISSION_GRANTED }
            if (granted) {
                Toast.makeText(this, "Permissions granted! You can start tracking now.", Toast.LENGTH_SHORT).show()
            } else {
                Toast.makeText(this, "Permission denied. Background GPS logging requires approvals.", Toast.LENGTH_LONG).show()
            }
        }
    }
}
