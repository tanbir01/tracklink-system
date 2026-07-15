package com.tracklink.app.data.local

import androidx.room.Database
import androidx.room.RoomDatabase
import com.tracklink.app.data.local.dao.LocationDao
import com.tracklink.app.data.local.entity.CachedLocation

@Database(
    entities = [CachedLocation::class],
    version = 1,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun locationDao(): LocationDao

    companion object {
        const val DATABASE_NAME = "tracklink_db"
    }
}
