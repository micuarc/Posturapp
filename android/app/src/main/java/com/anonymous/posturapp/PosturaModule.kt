package com.anonymous.posturapp

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class PosturaModule(private val ctx: ReactApplicationContext) :
    ReactContextBaseJavaModule(ctx) {

    override fun getName() = "Postura"

    @ReactMethod
    fun startService(ip: String) {
        val intent = Intent(ctx, PosturaService::class.java)
        intent.putExtra("sensor_ip", ip)  // ← Envía la IP al servicio

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            ctx.startForegroundService(intent)
        } else {
            ctx.startService(intent)
        }
    }

    @ReactMethod
    fun stopService() {
        val intent = Intent(ctx, PosturaService::class.java)
        ctx.stopService(intent)
    }

    @ReactMethod
    fun vibrate() {
        val v = ctx.getSystemService(android.os.Vibrator::class.java)
        v?.vibrate(
            android.os.VibrationEffect.createOneShot(
                400,
                android.os.VibrationEffect.DEFAULT_AMPLITUDE
            )
        )
    }

    @ReactMethod
    fun notify(title: String, message: String) {
        val builder = androidx.core.app.NotificationCompat.Builder(
            ctx,
            "postura_alerts"
        )
            .setSmallIcon(android.R.drawable.stat_notify_error)
            .setContentTitle(title)
            .setContentText(message)
            .setPriority(androidx.core.app.NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)

        with(androidx.core.app.NotificationManagerCompat.from(ctx)) {
            notify(System.currentTimeMillis().toInt(), builder.build())
        }
    }

    @ReactMethod
    fun setThresholds(badSeconds: Int, cooldownSeconds: Int) {
        PosturaService.BAD_DURATION_MS = badSeconds * 1000L
        PosturaService.COOLDOWN_MS = cooldownSeconds * 1000L
    }

    @ReactMethod
    fun openOverlaySettings() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (!Settings.canDrawOverlays(ctx)) {
                val intent = Intent(
                    Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:${ctx.packageName}")
                )
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                ctx.startActivity(intent)
            }
        }
    }

    @ReactMethod
    fun setFeedbackConfig(vibrate: Boolean, notify: Boolean, sound: Boolean) {
        PosturaService.ENABLE_VIBRATION = vibrate
        PosturaService.ENABLE_NOTIFICATION = notify
        PosturaService.ENABLE_SOUND = sound
    }
}
