package com.tracklink.app.data.remote.interceptor

import android.content.SharedPreferences
import com.tracklink.app.util.Constants
import okhttp3.Interceptor
import okhttp3.Response
import javax.inject.Inject
import javax.inject.Named

class AuthInterceptor @Inject constructor(
    @Named("encrypted_prefs") private val prefs: SharedPreferences
) : Interceptor {

    override fun intercept(chain: Interceptor.Chain): Response {
        val originalRequest = chain.request()

        // Skip auth header for login and refresh endpoints
        val path = originalRequest.url.encodedPath
        if (path.contains("auth/login") || path.contains("auth/refresh")) {
            return chain.proceed(originalRequest)
        }

        val token = prefs.getString(Constants.PREF_AUTH_TOKEN, null)

        val request = if (token != null) {
            originalRequest.newBuilder()
                .header("Authorization", "Bearer $token")
                .header("Content-Type", "application/json")
                .build()
        } else {
            originalRequest.newBuilder()
                .header("Content-Type", "application/json")
                .build()
        }

        val response = chain.proceed(request)

        // If we get a 401, clear the token (token expired)
        if (response.code == 401) {
            prefs.edit()
                .remove(Constants.PREF_AUTH_TOKEN)
                .remove(Constants.PREF_TOKEN_EXPIRY)
                .apply()
        }

        return response
    }
}
