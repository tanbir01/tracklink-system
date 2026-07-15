package com.tracklink.app.data.repository

import android.content.SharedPreferences
import android.util.Log
import com.tracklink.app.data.remote.ApiService
import com.tracklink.app.data.remote.dto.LoginRequest
import com.tracklink.app.data.remote.dto.RefreshTokenRequest
import com.tracklink.app.util.Constants
import com.tracklink.app.util.DeviceInfo
import javax.inject.Inject
import javax.inject.Named
import javax.inject.Singleton

@Singleton
class AuthRepository @Inject constructor(
    private val apiService: ApiService,
    @Named("encrypted_prefs") private val prefs: SharedPreferences,
    private val deviceInfo: DeviceInfo
) {

    companion object {
        private const val TAG = "AuthRepository"
    }

    suspend fun login(serverUrl: String, username: String, password: String): Result<String> {
        return try {
            // Save server URL before attempting login
            prefs.edit().putString(Constants.PREF_SERVER_URL, serverUrl).apply()

            val request = LoginRequest(
                username = username,
                password = password,
                deviceId = deviceInfo.getDeviceId(),
                deviceModel = deviceInfo.getDeviceModel()
            )

            val response = apiService.login(request)

            if (response.isSuccessful && response.body()?.success == true) {
                val body = response.body()!!
                prefs.edit()
                    .putString(Constants.PREF_AUTH_TOKEN, body.token)
                    .putString(Constants.PREF_REFRESH_TOKEN, body.refreshToken)
                    .putString(Constants.PREF_DEVICE_ID, body.deviceId ?: deviceInfo.getDeviceId())
                    .putLong(Constants.PREF_TOKEN_EXPIRY, body.expiresAt ?: 0L)
                    .putString(Constants.PREF_USERNAME, username)
                    .putBoolean(Constants.PREF_IS_LOGGED_IN, true)
                    .apply()

                Log.i(TAG, "Login successful for user: $username")
                Result.success(body.token ?: "")
            } else {
                val errorMsg = response.body()?.message ?: "Login failed (${response.code()})"
                Log.w(TAG, "Login failed: $errorMsg")
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Log.e(TAG, "Login error", e)
            Result.failure(e)
        }
    }

    suspend fun refreshToken(): Result<String> {
        return try {
            val refreshToken = prefs.getString(Constants.PREF_REFRESH_TOKEN, null)
                ?: return Result.failure(Exception("No refresh token"))

            val response = apiService.refreshToken(RefreshTokenRequest(refreshToken))

            if (response.isSuccessful && response.body()?.success == true) {
                val body = response.body()!!
                prefs.edit()
                    .putString(Constants.PREF_AUTH_TOKEN, body.token)
                    .putLong(Constants.PREF_TOKEN_EXPIRY, body.expiresAt ?: 0L)
                    .apply()

                Log.i(TAG, "Token refreshed successfully")
                Result.success(body.token ?: "")
            } else {
                val errorMsg = response.body()?.message ?: "Token refresh failed"
                Log.w(TAG, "Token refresh failed: $errorMsg")
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Log.e(TAG, "Token refresh error", e)
            Result.failure(e)
        }
    }

    suspend fun logout() {
        try {
            apiService.logout()
        } catch (e: Exception) {
            Log.w(TAG, "Logout API call failed, clearing local data anyway", e)
        } finally {
            clearAuthData()
        }
    }

    fun isLoggedIn(): Boolean {
        return prefs.getBoolean(Constants.PREF_IS_LOGGED_IN, false) &&
                prefs.getString(Constants.PREF_AUTH_TOKEN, null) != null
    }

    fun isTokenExpired(): Boolean {
        val expiry = prefs.getLong(Constants.PREF_TOKEN_EXPIRY, 0L)
        if (expiry == 0L) return false // No expiry set, assume valid
        return System.currentTimeMillis() >= expiry
    }

    fun getToken(): String? = prefs.getString(Constants.PREF_AUTH_TOKEN, null)

    fun getServerUrl(): String? = prefs.getString(Constants.PREF_SERVER_URL, null)

    fun getDeviceId(): String {
        return prefs.getString(Constants.PREF_DEVICE_ID, null) ?: deviceInfo.getDeviceId()
    }

    fun getUsername(): String? = prefs.getString(Constants.PREF_USERNAME, null)

    private fun clearAuthData() {
        prefs.edit()
            .remove(Constants.PREF_AUTH_TOKEN)
            .remove(Constants.PREF_REFRESH_TOKEN)
            .remove(Constants.PREF_TOKEN_EXPIRY)
            .remove(Constants.PREF_IS_LOGGED_IN)
            .remove(Constants.PREF_USERNAME)
            .apply()
    }
}
