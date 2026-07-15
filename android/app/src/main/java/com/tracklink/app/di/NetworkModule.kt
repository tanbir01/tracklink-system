package com.tracklink.app.di

import android.content.SharedPreferences
import com.tracklink.app.data.remote.ApiService
import com.tracklink.app.data.remote.WebSocketManager
import com.tracklink.app.data.remote.interceptor.AuthInterceptor
import com.tracklink.app.util.Constants
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {

    @Provides
    @Singleton
    fun provideAuthInterceptor(sharedPreferences: SharedPreferences): AuthInterceptor {
        return AuthInterceptor(sharedPreferences)
    }

    @Provides
    @Singleton
    fun provideOkHttpClient(authInterceptor: AuthInterceptor): OkHttpClient {
        val logging = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        }
        return OkHttpClient.Builder()
            .addInterceptor(authInterceptor)
            .addInterceptor(logging)
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .build()
    }

    @Provides
    @Singleton
    fun provideRetrofit(okHttpClient: OkHttpClient, sharedPreferences: SharedPreferences): Retrofit {
        // Read configured server url from preferences or fallback to default constant
        val serverUrl = sharedPreferences.getString(Constants.PREF_KEY_SERVER_URL, Constants.DEFAULT_API_URL) 
            ?: Constants.DEFAULT_API_URL

        val baseUrl = if (serverUrl.endsWith("/")) serverUrl else "$serverUrl/"

        return Retrofit.Builder()
            .baseUrl(baseUrl)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
    }

    @Provides
    @Singleton
    fun provideApiService(retrofit: Retrofit): ApiService {
        return retrofit.create(ApiService::class.java)
    }

    @Provides
    @Singleton
    fun provideWebSocketManager(sharedPreferences: SharedPreferences): WebSocketManager {
        return WebSocketManager(sharedPreferences)
    }
}
