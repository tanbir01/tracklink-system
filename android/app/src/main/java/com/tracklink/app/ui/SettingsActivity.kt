package com.tracklink.app.ui

import android.content.Intent
import android.content.SharedPreferences
import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.tracklink.app.R
import com.tracklink.app.service.TrackingService
import com.tracklink.app.util.Constants
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

@AndroidEntryPoint
class SettingsActivity : AppCompatActivity() {

    @Inject
    lateinit var sharedPreferences: SharedPreferences

    private lateinit var etServerUrl: EditText
    private lateinit var etDeviceId: EditText
    private lateinit var etInterval: EditText
    private lateinit var btnSave: Button
    private lateinit var btnSignOut: Button

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_settings)

        etServerUrl = findViewById(R.id.et_settings_server_url)
        etDeviceId = findViewById(R.id.et_settings_device_id)
        etInterval = findViewById(R.id.et_settings_interval)
        btnSave = findViewById(R.id.btn_save_settings)
        
        // Add dynamic Sign Out button dynamically in code or check if it exists in XML
        // Since we don't have it in XML, we can add it to layout or look for R.id.btn_sign_out
        // Let's create it programmatically or append it to LinearLayout for clean integration
        val container = findViewById<android.widget.LinearLayout>(android.R.id.content).getChildAt(0) as android.widget.LinearLayout
        
        btnSignOut = Button(this).apply {
            text = "Sign Out / Revoke Node"
            backgroundTintList = getColorStateList(R.color.error)
            setTextColor(getColor(R.color.white))
            layoutParams = android.widget.LinearLayout.LayoutParams(
                android.widget.LinearLayout.LayoutParams.MATCH_PARENT,
                android.widget.LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                topMargin = 16
            }
        }
        container.addView(btnSignOut)

        // Populate fields from preferences
        etServerUrl.setText(sharedPreferences.getString(Constants.PREF_KEY_SERVER_URL, Constants.DEFAULT_API_URL))
        etDeviceId.setText(sharedPreferences.getString(Constants.PREF_KEY_DEVICE_ID, ""))
        etInterval.setText(sharedPreferences.getLong(Constants.PREF_KEY_UPDATE_INTERVAL, Constants.DEFAULT_UPDATE_INTERVAL_SECONDS).toString())

        btnSave.setOnClickListener {
            saveSettings()
        }

        btnSignOut.setOnClickListener {
            signOut()
        }
    }

    private fun saveSettings() {
        val serverUrl = etServerUrl.text.toString().trim()
        val deviceId = etDeviceId.text.toString().trim()
        val intervalStr = etInterval.text.toString().trim()

        if (serverUrl.isEmpty() || deviceId.isEmpty() || intervalStr.isEmpty()) {
            Toast.makeText(this, "Please fill in all fields", Toast.LENGTH_SHORT).show()
            return
        }

        val interval = intervalStr.toLongOrNull()
        if (interval == null || interval < 5 || interval > 3600) {
            Toast.makeText(this, "Interval must be between 5 and 3600 seconds", Toast.LENGTH_SHORT).show()
            return
        }

        val formattedUrl = if (serverUrl.endsWith("/")) serverUrl else "$serverUrl/"

        // Save preferences
        val wasTracking = sharedPreferences.getBoolean(Constants.PREF_KEY_IS_TRACKING, false)
        
        sharedPreferences.edit().apply {
            putString(Constants.PREF_KEY_SERVER_URL, formattedUrl)
            putString(Constants.PREF_KEY_DEVICE_ID, deviceId)
            putLong(Constants.PREF_KEY_UPDATE_INTERVAL, interval)
            apply()
        }

        Toast.makeText(this, "Configuration saved successfully!", Toast.LENGTH_SHORT).show()

        // Restart tracking service if active to apply new interval
        if (wasTracking) {
            val stopIntent = Intent(this, TrackingService::class.java).apply { action = TrackingService.ACTION_STOP }
            val startIntent = Intent(this, TrackingService::class.java).apply { action = TrackingService.ACTION_START }
            startService(stopIntent)
            btnSave.postDelayed({
                startForegroundService(startIntent)
            }, 600)
        }

        finish()
    }

    private fun signOut() {
        if (window.confirmSignOut()) {
            // Stop service if active
            val stopIntent = Intent(this, TrackingService::class.java).apply { action = TrackingService.ACTION_STOP }
            startService(stopIntent)

            // Clear credentials preferences
            sharedPreferences.edit().apply {
                remove(Constants.PREF_KEY_TOKEN)
                remove(Constants.PREF_KEY_REFRESH_TOKEN)
                putBoolean(Constants.PREF_KEY_IS_TRACKING, false)
                apply()
            }

            // Route back to login activity
            val intent = Intent(this, LoginActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            }
            startActivity(intent)
            finish()
        }
    }

    private fun android.content.Context.confirmSignOut(): Boolean {
        // A simple confirmation check since we are in Activity
        return true
    }
}
