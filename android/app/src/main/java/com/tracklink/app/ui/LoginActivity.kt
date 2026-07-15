package com.tracklink.app.ui

import android.content.Intent
import android.content.SharedPreferences
import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.tracklink.app.R
import com.tracklink.app.data.remote.ApiService
import com.tracklink.app.data.remote.dto.LoginRequest
import com.tracklink.app.data.remote.dto.DeviceCreateDto
import com.tracklink.app.util.Constants
import com.tracklink.app.util.DeviceInfo
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.UUID
import javax.inject.Inject

@AndroidEntryPoint
class LoginActivity : AppCompatActivity() {

    @Inject
    lateinit var sharedPreferences: SharedPreferences

    private lateinit var etServerUrl: EditText
    private lateinit var etUsername: EditText
    private lateinit var etPassword: EditText
    private lateinit var btnLogin: Button

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Auto redirect to MainActivity if token is already saved
        val storedToken = sharedPreferences.getString(Constants.PREF_KEY_TOKEN, null)
        if (storedToken != null) {
            startActivity(Intent(this, MainActivity::class.java))
            finish()
            return
        }

        setContentView(R.layout.activity_login)

        etServerUrl = findViewById(R.id.et_server_url)
        etUsername = findViewById(R.id.et_username)
        etPassword = findViewById(R.id.et_password)
        btnLogin = findViewById(R.id.btn_login)

        // Prepopulate default server url
        etServerUrl.setText(sharedPreferences.getString(Constants.PREF_KEY_SERVER_URL, Constants.DEFAULT_API_URL))

        btnLogin.setOnClickListener {
            handleLogin()
        }
    }

    private fun handleLogin() {
        val serverUrlInput = etServerUrl.text.toString().trim()
        val username = etUsername.text.toString().trim()
        val password = etPassword.text.toString().trim()

        if (serverUrlInput.isEmpty() || username.isEmpty() || password.isEmpty()) {
            Toast.makeText(this, "Please fill in all fields", Toast.LENGTH_SHORT).show()
            return
        }

        // Clean url formatting
        val formattedUrl = if (serverUrlInput.endsWith("/")) serverUrlInput else "$serverUrlInput/"
        
        btnLogin.isEnabled = false
        btnLogin.text = "Authenticating..."

        CoroutineScope(Dispatchers.IO).launch {
            try {
                // Build a dynamic API client to authenticate with custom server URL
                val tempRetrofit = Retrofit.Builder()
                    .baseUrl(formattedUrl)
                    .addConverterFactory(GsonConverterFactory.create())
                    .build()
                val apiService = tempRetrofit.create(ApiService::class.java)

                val response = apiService.login(LoginRequest(username = username, password = password))
                if (response.isSuccessful && response.body() != null) {
                    val tokenResponse = response.body()!!

                    // Register device on backend automatically
                    var deviceId = sharedPreferences.getString(Constants.PREF_KEY_DEVICE_ID, "") ?: ""
                    if (deviceId.isEmpty()) {
                        deviceId = "android-" + UUID.randomUUID().toString().take(12)
                    }

                    val deviceRegisterPayload = DeviceCreateDto(
                        deviceId = deviceId,
                        name = "Android Tracker - ${DeviceInfo.getDeviceModel()}",
                        model = DeviceInfo.getDeviceModel(),
                        manufacturer = DeviceInfo.getDeviceManufacturer(),
                        androidVersion = DeviceInfo.getAndroidVersion()
                    )

                    // Authenticated API request to register device
                    val authHeader = "Bearer ${tokenResponse.accessToken}"
                    val devResponse = apiService.registerDevice(authHeader, deviceRegisterPayload)

                    withContext(Dispatchers.Main) {
                        if (devResponse.isSuccessful) {
                            // Save configurations on success
                            sharedPreferences.edit().apply {
                                putString(Constants.PREF_KEY_SERVER_URL, formattedUrl)
                                putString(Constants.PREF_KEY_TOKEN, tokenResponse.accessToken)
                                putString(Constants.PREF_KEY_REFRESH_TOKEN, tokenResponse.refreshToken)
                                putString(Constants.PREF_KEY_DEVICE_ID, deviceId)
                                apply()
                            }

                            Toast.makeText(this@LoginActivity, "Login and registration successful!", Toast.LENGTH_LONG).show()
                            startActivity(Intent(this@LoginActivity, MainActivity::class.java))
                            finish()
                        } else {
                            btnLogin.isEnabled = true
                            btnLogin.text = "Sign In"
                            Toast.makeText(this@LoginActivity, "Failed to register tracker node: ${devResponse.code()}", Toast.LENGTH_LONG).show()
                        }
                    }
                } else {
                    withContext(Dispatchers.Main) {
                        btnLogin.isEnabled = true
                        btnLogin.text = "Sign In"
                        Toast.makeText(this@LoginActivity, "Login failed: ${response.code()}", Toast.LENGTH_LONG).show()
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    btnLogin.isEnabled = true
                    btnLogin.text = "Sign In"
                    Toast.makeText(this@LoginActivity, "Connection Error: ${e.message}", Toast.LENGTH_LONG).show()
                }
            }
        }
    }
}
