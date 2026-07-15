package com.tracklink.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "cached_locations")
data class CachedLocation(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val latitude: Double,
    val longitude: Double,
    val altitude: Double,
    val accuracy: Float,
    val speed: Float,
    val bearing: Float,
    val batteryLevel: Int,
    val isCharging: Boolean,
    val networkType: String,
    val timestamp: Long,
    val isSynced: Boolean = false,
    val createdAt: Long = System.currentTimeMillis()
)
