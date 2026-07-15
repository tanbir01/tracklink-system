package com.tracklink.app.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.tracklink.app.data.local.entity.CachedLocation

@Dao
interface LocationDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(location: CachedLocation): Long

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(locations: List<CachedLocation>): List<Long>

    @Query("SELECT * FROM cached_locations WHERE isSynced = 0 ORDER BY timestamp ASC LIMIT :limit")
    suspend fun getUnsyncedLocations(limit: Int = 100): List<CachedLocation>

    @Query("SELECT COUNT(*) FROM cached_locations WHERE isSynced = 0")
    suspend fun getUnsyncedCount(): Int

    @Query("UPDATE cached_locations SET isSynced = 1 WHERE id IN (:ids)")
    suspend fun markAsSynced(ids: List<Long>)

    @Query("DELETE FROM cached_locations WHERE isSynced = 1 AND createdAt < :olderThan")
    suspend fun deleteSyncedOlderThan(olderThan: Long): Int

    @Query("DELETE FROM cached_locations WHERE isSynced = 1")
    suspend fun deleteAllSynced(): Int

    @Query("SELECT * FROM cached_locations ORDER BY timestamp DESC LIMIT 1")
    suspend fun getLatestLocation(): CachedLocation?

    @Query("SELECT COUNT(*) FROM cached_locations")
    suspend fun getTotalCount(): Int

    @Query("DELETE FROM cached_locations")
    suspend fun deleteAll()
}
