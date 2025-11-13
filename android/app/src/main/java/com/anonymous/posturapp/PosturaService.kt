package com.anonymous.posturapp

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.graphics.PixelFormat
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.provider.Settings
import android.view.Gravity
import android.view.WindowManager
import android.widget.TextView
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

class PosturaService : Service() {

    companion object {
        private const val FOREGROUND_CHANNEL_ID = "postura_foreground"
        private const val ALERT_CHANNEL_ID = "postura_alerts"
        private const val FOREGROUND_NOTIFICATION_ID = 1001
        private const val POLL_INTERVAL_MS = 1500L

        @JvmStatic var BAD_DURATION_MS: Long = 8_000L
        @JvmStatic var COOLDOWN_MS: Long = 60_000L
        @JvmStatic var ENABLE_VIBRATION: Boolean = true
        @JvmStatic var ENABLE_NOTIFICATION: Boolean = true
        @JvmStatic var ENABLE_SOUND: Boolean = false

        @JvmStatic var sensorIp: String = ""   // <-- aquí se guarda la IP enviada desde JS
    }

    private val handler = Handler(Looper.getMainLooper())
    private var isRunning = false

    private var lastBadStartTime: Long? = null
    private var lastNotificationTime: Long = 0L

    private var windowManager: WindowManager? = null
    private var hudView: TextView? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        // ← Recibe la IP enviada desde React Native
        sensorIp = intent?.getStringExtra("sensor_ip") ?: ""
        return START_STICKY
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannels()
        startInForeground()
        windowManager = getSystemService(WindowManager::class.java)
        isRunning = true
        scheduleNextPoll()
    }

    override fun onDestroy() {
        super.onDestroy()
        isRunning = false
        handler.removeCallbacksAndMessages(null)
        hideHud()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun createNotificationChannels() {
        val nm = getSystemService(NotificationManager::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            nm.createNotificationChannel(
                NotificationChannel(
                    FOREGROUND_CHANNEL_ID,
                    "Posturapp Monitoreo",
                    NotificationManager.IMPORTANCE_LOW
                )
            )
            nm.createNotificationChannel(
                NotificationChannel(
                    ALERT_CHANNEL_ID,
                    "Alertas de Postura",
                    NotificationManager.IMPORTANCE_HIGH
                )
            )
        }
    }

    private fun startInForeground() {
        val notification: Notification =
            NotificationCompat.Builder(this, FOREGROUND_CHANNEL_ID)
                .setContentTitle("Posturapp monitoreando")
                .setContentText("Monitoreo de postura activo en segundo plano")
                .setSmallIcon(android.R.drawable.stat_notify_more)
                .setOngoing(true)
                .build()

        startForeground(FOREGROUND_NOTIFICATION_ID, notification)
    }

    private fun scheduleNextPoll() {
        if (!isRunning) return
        handler.postDelayed({ pollSensor() }, POLL_INTERVAL_MS)
    }

    private fun pollSensor() {
        if (!isRunning) return

        Thread {
            try {
                if (sensorIp.isBlank()) {
                    resetBadState()
                } else {
                    val url = URL("http://$sensorIp/data")
                    val conn = url.openConnection() as HttpURLConnection
                    conn.connectTimeout = 3000
                    conn.readTimeout = 3000
                    conn.requestMethod = "GET"

                    val code = conn.responseCode
                    if (code == 200) {
                        val body = conn.inputStream.bufferedReader().use { it.readText() }
                        val json = JSONObject(body)
                        handlePosture(
                            json.optInt("malaPostura", 0),
                            json.optInt("calibrating", 0)
                        )
                    } else {
                        resetBadState()
                    }
                }
            } catch (e: Exception) {
                resetBadState()
            } finally {
                scheduleNextPoll()
            }
        }.start()
    }

    private fun handlePosture(malaPostura: Int, calibrating: Int) {
        val now = System.currentTimeMillis()

        if (calibrating == 1) {
            resetBadState()
            return
        }

        val isBad = malaPostura == 1

        if (isBad) {
            if (lastBadStartTime == null) lastBadStartTime = now
            val badDuration = now - (lastBadStartTime ?: now)

            if (badDuration >= BAD_DURATION_MS) {
                if (now - lastNotificationTime >= COOLDOWN_MS) {
                    lastNotificationTime = now
                    sendAlertNotification()
                    vibrate()
                }
                showHud()
            } else {
                showHud()
            }
        } else resetBadState()
    }

    private fun resetBadState() {
        lastBadStartTime = null
        hideHud()
    }

    private fun sendAlertNotification() {
        if (!ENABLE_NOTIFICATION) return

        val builder = NotificationCompat.Builder(this, ALERT_CHANNEL_ID)
            .setSmallIcon(android.R.drawable.stat_notify_error)
            .setContentTitle("Postura inadecuada")
            .setContentText("Mantén tu cabeza y cuello en posición neutra.")
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)

        with(NotificationManagerCompat.from(this)) {
            notify(System.currentTimeMillis().toInt(), builder.build())
        }
    }

    private fun vibrate() {
        if (!ENABLE_VIBRATION) return
        try {
            val v = getSystemService(android.os.Vibrator::class.java)
            v?.vibrate(
                android.os.VibrationEffect.createOneShot(
                    400,
                    android.os.VibrationEffect.DEFAULT_AMPLITUDE
                )
            )
        } catch (_: Exception) {
        }
    }

    private fun showHud() {
        if (hudView != null) return
        if (!Settings.canDrawOverlays(this)) return

        val wm = windowManager ?: return

        val tv = TextView(this).apply {
            text = "↘ Corrige tu postura"
            setTextColor(0xFFFFFFFF.toInt())
            textSize = 14f
            setPadding(24, 16, 24, 16)
            setBackgroundColor(0xCCFF9966.toInt())
        }

        val type = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        else WindowManager.LayoutParams.TYPE_PHONE

        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            type,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                    WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL or
                    WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.CENTER_HORIZONTAL
            y = 120
        }

        try {
            wm.addView(tv, params)
            hudView = tv
        } catch (_: Exception) {
        }
    }

    private fun hideHud() {
        val wm = windowManager ?: return
        val view = hudView ?: return
        try {
            wm.removeView(view)
        } catch (_: Exception) {
        } finally {
            hudView = null
        }
    }
}
