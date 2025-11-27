package com.anonymous.posturapp

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            Log.d("BootReceiver", "Device booted, ensuring sensor service is stopped")
            val serviceIntent = Intent(context, SensorForegroundService::class.java).apply {
                action = SensorForegroundService.ACTION_STOP
            }
            context.startService(serviceIntent)
        }
    }
}
