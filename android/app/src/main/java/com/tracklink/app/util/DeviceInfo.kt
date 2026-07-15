package com.tracklink.app.util

import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.BatteryManager
import android.os.Build
import android.telephony.TelephonyManager
import com.tracklink.app.data.remote.dto.DeviceStatusDto

object DeviceInfo {

    fun getDeviceModel(): String = Build.MODEL
    fun getDeviceManufacturer(): String = Build.MANUFACTURER
    fun getAndroidVersion(): String = Build.VERSION.RELEASE

    fun getBatteryPercent(context: Context): Int {
        val intent = context.registerReceiver(null, IntentFilter(Intent.ACTION_BATTERY_CHANGED))
        val level = intent?.getIntExtra(BatteryManager.EXTRA_LEVEL, -1) ?: -1
        val scale = intent?.getIntExtra(BatteryManager.EXTRA_SCALE, -1) ?: -1
        return if (level >= 0 && scale > 0) {
            (level * 100 / scale.toFloat()).toInt()
        } else {
            100
        }
    }

    fun isCharging(context: Context): Boolean {
        val intent = context.registerReceiver(null, IntentFilter(Intent.ACTION_BATTERY_CHANGED))
        val status = intent?.getIntExtra(BatteryManager.EXTRA_STATUS, -1) ?: -1
        return status == BatteryManager.BATTERY_STATUS_CHARGING || status == BatteryManager.BATTERY_STATUS_FULL
    }

    fun getNetworkOperator(context: Context): String {
        return try {
            val tm = context.getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager
            tm.networkOperatorName ?: "Unknown"
        } catch (e: Exception) {
            "Unknown"
        }
    }

    fun getDeviceStatusDto(context: Context, deviceId: String): DeviceStatusDto {
        val batteryPct = getBatteryPercent(context)
        val charging = isCharging(context)
        val connectionType = NetworkUtil.getConnectionType(context)
        val isWifi = connectionType == "WIFI"
        val isMobile = connectionType == "CELLULAR"
        val operator = getNetworkOperator(context)

        return DeviceStatusDto(
            deviceId = deviceId,
            batteryPercent = batteryPct,
            isCharging = charging,
            wifiConnected = isWifi,
            mobileData = isMobile,
            connectionType = connectionType,
            networkOperator = operator,
            signalStrength = null,
            timestamp = null
        )
    }
}
