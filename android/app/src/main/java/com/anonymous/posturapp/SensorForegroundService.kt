package com.anonymous.posturapp

import android.app.*
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.util.Log
import androidx.core.app.NotificationCompat
import com.facebook.react.ReactApplication
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import okhttp3.*
import org.json.JSONObject
import java.io.IOException
import java.util.concurrent.TimeUnit

class SensorForegroundService : Service() {
    private val handler = Handler(Looper.getMainLooper())
    private var pollingRunnable: Runnable? = null
    private val client = OkHttpClient.Builder()
        .connectTimeout(3, TimeUnit.SECONDS)
        .readTimeout(3, TimeUnit.SECONDS)
        .build()

    private var sensorIp: String? = null
    private var isRunning = false
    private var latestData: WritableMap? = null
    private var prevMalaPostura: Int = 0
    private var remoteVibrationActive: Boolean = false

    companion object {
        private const val NOTIFICATION_ID = 1
        private const val CHANNEL_ID = "sensor_service_channel"
        private const val FEEDBACK_CHANNEL_SOUND = "sensor_feedback_channel_sound"
        private const val FEEDBACK_CHANNEL_SILENT = "sensor_feedback_channel_silent"
        private const val FEEDBACK_NOTIFICATION_ID = 2
        private const val TAG = "SensorForegroundService"
        const val ACTION_START = "START_SENSOR_SERVICE"
        const val ACTION_STOP = "STOP_SENSOR_SERVICE"
        const val EXTRA_SENSOR_IP = "sensor_ip"
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        Log.d(TAG, "Service created")
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> {
                sensorIp = intent.getStringExtra(EXTRA_SENSOR_IP)
                Log.d(TAG, "Starting service with IP: $sensorIp")
                startForeground(NOTIFICATION_ID, createNotification("Conectando..."))
                startPolling()
            }
            ACTION_STOP -> {
                Log.d(TAG, "Stopping service")
                stopPolling()
                if (sensorIp != null) {
                    Thread {
                        try {
                            val url = "http://$sensorIp/stopvibrate"
                            val request = Request.Builder().url(url).build()
                            client.newCall(request).execute()
                        } catch (_: Exception) {}
                    }.start()
                }
                stopForeground(STOP_FOREGROUND_REMOVE)
                stopSelf()
            }
        }
        return START_NOT_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

            val serviceChannel = NotificationChannel(
                CHANNEL_ID,
                "Sensor Monitor",
                NotificationManager.IMPORTANCE_LOW
            ).apply { setSound(null, null) }

            val soundUri = android.media.RingtoneManager.getDefaultUri(android.media.RingtoneManager.TYPE_NOTIFICATION)
            val attributes = AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build()

            val feedbackSoundChannel = NotificationChannel(
                FEEDBACK_CHANNEL_SOUND,
                "Postura - Alertas (sonido)",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply { setSound(soundUri, attributes) }

            val feedbackSilentChannel = NotificationChannel(
                FEEDBACK_CHANNEL_SILENT,
                "Postura - Alertas (silencioso)",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply { setSound(null, null) }

            manager.createNotificationChannel(serviceChannel)
            manager.createNotificationChannel(feedbackSoundChannel)
            manager.createNotificationChannel(feedbackSilentChannel)
        }
    }

    private fun showFeedbackNotification(title: String, text: String, soundEnabled: Boolean) {
        val channelId = if (soundEnabled) FEEDBACK_CHANNEL_SOUND else FEEDBACK_CHANNEL_SILENT
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            packageManager.getLaunchIntentForPackage(packageName),
            PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(this, channelId)
            .setContentTitle(title)
            .setContentText(text)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .build()

        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val id = FEEDBACK_NOTIFICATION_ID + (System.currentTimeMillis() % 1000).toInt()
        manager.notify(id, notification)
    }

    private fun createNotification(contentText: String): Notification {
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            packageManager.getLaunchIntentForPackage(packageName),
            PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Posturapp Activo")
            .setContentText(contentText)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .build()
    }

    private fun startPolling() {
        if (isRunning) return
        isRunning = true

        pollingRunnable = object : Runnable {
            override fun run() {
                fetchSensorData()
                if (isRunning) handler.postDelayed(this, 800)
            }
        }
        handler.post(pollingRunnable!!)
    }

    private fun stopPolling() {
        isRunning = false
        pollingRunnable?.let { handler.removeCallbacks(it) }
    }

    private fun fetchSensorData() {
        val ip = sensorIp ?: return
        val url = "http://$ip/data"

        val request = Request.Builder().url(url).build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                updateNotification("Error de conexión")
                val prefs = getSharedPreferences("SensorData", Context.MODE_PRIVATE)
                prefs.edit().clear().apply()
                sendEventToReact("SensorError", null)
            }

            override fun onResponse(call: Call, response: Response) {
                if (!response.isSuccessful) {
                    updateNotification("Error HTTP ${response.code}")
                    return
                }

                val body = response.body?.string() ?: return

                try {
                    val json = JSONObject(body)
                    val pitch = json.optDouble("pitch", 0.0)
                    val roll = json.optDouble("roll", 0.0)
                    val malaPostura = json.optInt("malaPostura", 0)

                    updateNotification("Pitch: %.1f° Roll: %.1f°".format(pitch, roll))

                    val prefs = getSharedPreferences("SensorData", Context.MODE_PRIVATE)
                    val dataWithTimestamp = JSONObject(body).apply {
                        put("_timestamp", System.currentTimeMillis())
                    }.toString()

                    prefs.edit().apply {
                        putString("lastData", dataWithTimestamp)
                        putLong("lastUpdate", System.currentTimeMillis())
                        apply()
                    }

                    val params = Arguments.createMap().apply {
                        putDouble("pitch", pitch)
                        putDouble("roll", roll)
                        putDouble("refPitch", json.optDouble("refPitch", 0.0))
                        putDouble("refRoll", json.optDouble("refRoll", 0.0))
                        putInt("malaPostura", malaPostura)
                        putInt("calibrating", json.optInt("calibrating", 0))
                        putString("timestamp", System.currentTimeMillis().toString())
                    }

                    latestData = params
                    sendEventToReact("SensorData", params)

                    handleNativeFeedbackTransition(malaPostura)
                } catch (_: Exception) {}
            }
        })
    }

    private fun handleNativeFeedbackTransition(malaPostura: Int) {
        try {
            val prefs = getSharedPreferences("SensorConfig", Context.MODE_PRIVATE)
            val feedbackJson = prefs.getString("feedback_type", "[]") ?: "[]"
            var vibrateEnabled = false
            var notifyEnabled = false
            var soundEnabled = false

            val arr = org.json.JSONArray(feedbackJson)
            for (i in 0 until arr.length()) {
                when (arr.optString(i)) {
                    "vibration" -> vibrateEnabled = true
                    "notification" -> notifyEnabled = true
                    "sound" -> soundEnabled = true
                }
            }

            if (malaPostura == 1 && prevMalaPostura != 1) {
                if (vibrateEnabled) sendRemoteVibrate()
                if (notifyEnabled) showFeedbackNotification("Mala postura detectada", "Alerta enviada", soundEnabled)
                if (soundEnabled) playAlertSound()
            }
        } catch (_: Exception) {
        } finally {
            prevMalaPostura = malaPostura
        }
    }

    private fun playAlertSound() {
        try {
            val rawName = "sonido_alerta"
            val resId = resources.getIdentifier(rawName, "raw", packageName)
            val ringtone = if (resId != 0) {
                val uri = Uri.parse("android.resource://$packageName/raw/$rawName")
                android.media.RingtoneManager.getRingtone(this, uri)
            } else {
                android.media.RingtoneManager.getRingtone(this, android.media.RingtoneManager.getDefaultUri(android.media.RingtoneManager.TYPE_NOTIFICATION))
            }
            ringtone?.play()
        } catch (e: Exception) {
            Log.e(TAG, "playAlertSound error: ${e.message}")
        }
    }

    private fun sendRemoteVibrate() {
        val ip = sensorIp ?: return
        if (remoteVibrationActive) return

        Thread {
            try {
                val url = "http://$ip/vibrate"
                val request = Request.Builder().url(url).build()
                val response = client.newCall(request).execute()
                remoteVibrationActive = response.isSuccessful
            } catch (_: Exception) {
                remoteVibrationActive = false
            }
        }.start()
    }

    private fun sendRemoteStopVibrate() {
        val ip = sensorIp ?: return
        Thread {
            try {
                val url = "http://$ip/stopvibrate"
                val request = Request.Builder().url(url).build()
                client.newCall(request).execute()
                remoteVibrationActive = false
            } catch (_: Exception) {}
        }.start()
    }

    private fun updateNotification(text: String) {
        val notification = createNotification(text)
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.notify(NOTIFICATION_ID, notification)
    }

    private fun sendEventToReact(eventName: String, params: WritableMap?) {
        try {
            val reactContext = (application as? ReactApplication)
                ?.reactNativeHost
                ?.reactInstanceManager
                ?.currentReactContext

            if (reactContext != null && reactContext.hasActiveReactInstance()) {
                reactContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    ?.emit(eventName, params)
            }
        } catch (_: Exception) {}
    }

    override fun onDestroy() {
        super.onDestroy()
        stopPolling()
    }
}
