package com.tracklink.app.data.remote

import android.content.SharedPreferences
import android.util.Log
import com.squareup.moshi.Moshi
import com.tracklink.app.data.remote.dto.LocationDto
import com.tracklink.app.util.Constants
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import okhttp3.*
import java.util.concurrent.TimeUnit
import javax.inject.Inject
import javax.inject.Named
import javax.inject.Singleton

@Singleton
class WebSocketManager @Inject constructor(
    @Named("websocket_client") private val client: OkHttpClient,
    @Named("encrypted_prefs") private val prefs: SharedPreferences,
    private val moshi: Moshi
) {

    companion object {
        private const val TAG = "WebSocketManager"
        private const val INITIAL_RECONNECT_DELAY_MS = 1000L
        private const val MAX_RECONNECT_DELAY_MS = 60000L
        private const val RECONNECT_BACKOFF_MULTIPLIER = 2.0
        private const val PING_INTERVAL_MS = 30000L
    }

    sealed class ConnectionState {
        data object Disconnected : ConnectionState()
        data object Connecting : ConnectionState()
        data object Connected : ConnectionState()
        data class Error(val message: String) : ConnectionState()
    }

    sealed class IncomingMessage {
        data class LocationUpdate(val location: LocationDto) : IncomingMessage()
        data class Command(val command: String, val payload: String?) : IncomingMessage()
        data class ServerMessage(val text: String) : IncomingMessage()
    }

    private var webSocket: WebSocket? = null
    private var reconnectJob: Job? = null
    private var reconnectAttempt = 0
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    private val _connectionState = MutableStateFlow<ConnectionState>(ConnectionState.Disconnected)
    val connectionState: StateFlow<ConnectionState> = _connectionState

    private val _incomingMessages = MutableSharedFlow<IncomingMessage>(extraBufferCapacity = 64)
    val incomingMessages: SharedFlow<IncomingMessage> = _incomingMessages

    private val locationAdapter by lazy { moshi.adapter(LocationDto::class.java) }

    fun connect() {
        if (_connectionState.value == ConnectionState.Connected ||
            _connectionState.value == ConnectionState.Connecting
        ) {
            Log.d(TAG, "Already connected or connecting, skipping")
            return
        }

        val serverUrl = prefs.getString(Constants.PREF_SERVER_URL, null)
        val token = prefs.getString(Constants.PREF_AUTH_TOKEN, null)

        if (serverUrl == null || token == null) {
            Log.w(TAG, "No server URL or token configured")
            _connectionState.value = ConnectionState.Error("Not authenticated")
            return
        }

        val wsUrl = serverUrl
            .replace("https://", "wss://")
            .replace("http://", "ws://")
            .removeSuffix("/api")
            .removeSuffix("/") + "/ws"

        _connectionState.value = ConnectionState.Connecting

        val request = Request.Builder()
            .url("$wsUrl?token=$token")
            .build()

        webSocket = client.newWebSocket(request, createWebSocketListener())
    }

    fun disconnect() {
        reconnectJob?.cancel()
        reconnectJob = null
        reconnectAttempt = 0
        webSocket?.close(1000, "Client disconnect")
        webSocket = null
        _connectionState.value = ConnectionState.Disconnected
    }

    fun sendLocationUpdate(location: LocationDto): Boolean {
        val ws = webSocket ?: return false
        if (_connectionState.value != ConnectionState.Connected) return false

        return try {
            val json = locationAdapter.toJson(location)
            val message = """{"type":"location_update","data":$json}"""
            ws.send(message)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to send location via WebSocket", e)
            false
        }
    }

    fun sendPing(): Boolean {
        val ws = webSocket ?: return false
        return try {
            ws.send("""{"type":"ping","timestamp":${System.currentTimeMillis()}}""")
        } catch (e: Exception) {
            false
        }
    }

    private fun createWebSocketListener(): WebSocketListener {
        return object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                Log.i(TAG, "WebSocket connected")
                _connectionState.value = ConnectionState.Connected
                reconnectAttempt = 0
                startPingLoop()
            }

            override fun onMessage(webSocket: WebSocket, text: String) {
                Log.d(TAG, "WebSocket message received: ${text.take(200)}")
                handleMessage(text)
            }

            override fun onClosing(webSocket: WebSocket, code: Int, reason: String) {
                Log.i(TAG, "WebSocket closing: $code $reason")
                webSocket.close(code, reason)
            }

            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                Log.i(TAG, "WebSocket closed: $code $reason")
                _connectionState.value = ConnectionState.Disconnected
                if (code != 1000) {
                    scheduleReconnect()
                }
            }

            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                Log.e(TAG, "WebSocket failure: ${t.message}", t)
                _connectionState.value = ConnectionState.Error(t.message ?: "Unknown error")
                scheduleReconnect()
            }
        }
    }

    private fun handleMessage(text: String) {
        scope.launch {
            try {
                val jsonMap = moshi.adapter<Map<String, Any>>(
                    Map::class.java
                ).fromJson(text) ?: return@launch

                when (jsonMap["type"]) {
                    "location_update" -> {
                        val dataJson = moshi.adapter<Map<String, Any>>(
                            Map::class.java
                        ).toJson(
                            @Suppress("UNCHECKED_CAST")
                            (jsonMap["data"] as? Map<String, Any>) ?: return@launch
                        )
                        val location = locationAdapter.fromJson(dataJson)
                        if (location != null) {
                            _incomingMessages.emit(IncomingMessage.LocationUpdate(location))
                        }
                    }
                    "command" -> {
                        val command = jsonMap["command"]?.toString() ?: return@launch
                        val payload = jsonMap["payload"]?.toString()
                        _incomingMessages.emit(IncomingMessage.Command(command, payload))
                    }
                    "pong" -> {
                        // Server acknowledged ping, no action needed
                    }
                    else -> {
                        _incomingMessages.emit(IncomingMessage.ServerMessage(text))
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Failed to parse WebSocket message", e)
            }
        }
    }

    private fun scheduleReconnect() {
        reconnectJob?.cancel()
        reconnectJob = scope.launch {
            val delay = calculateReconnectDelay()
            Log.i(TAG, "Scheduling reconnect attempt ${reconnectAttempt + 1} in ${delay}ms")
            delay(delay)
            reconnectAttempt++
            connect()
        }
    }

    private fun calculateReconnectDelay(): Long {
        val delay = (INITIAL_RECONNECT_DELAY_MS *
                Math.pow(RECONNECT_BACKOFF_MULTIPLIER, reconnectAttempt.toDouble())).toLong()
        return delay.coerceAtMost(MAX_RECONNECT_DELAY_MS)
    }

    private fun startPingLoop() {
        scope.launch {
            while (_connectionState.value == ConnectionState.Connected) {
                delay(PING_INTERVAL_MS)
                if (_connectionState.value == ConnectionState.Connected) {
                    sendPing()
                }
            }
        }
    }

    fun destroy() {
        disconnect()
        scope.cancel()
    }
}
