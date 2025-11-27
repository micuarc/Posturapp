package com.anonymous.posturapp

import android.content.Intent
import android.os.Build
import android.util.Log
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise

class SensorServiceModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val TAG = "SensorServiceModule"
    }

    override fun getName(): String = "SensorService"

    @ReactMethod
    fun startService(sensorIp: String, promise: Promise) {
        try {
            Log.d(TAG, "Starting service with IP: $sensorIp")
            val intent = Intent(reactApplicationContext, SensorForegroundService::class.java).apply {
                action = SensorForegroundService.ACTION_START
                putExtra(SensorForegroundService.EXTRA_SENSOR_IP, sensorIp)
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                reactApplicationContext.startForegroundService(intent)
            } else {
                reactApplicationContext.startService(intent)
            }

            promise.resolve("Service started")
        } catch (e: Exception) {
            Log.e(TAG, "Error starting service: ${e.message}")
            promise.reject("START_ERROR", "Failed to start service: ${e.message}")
        }
    }

    @ReactMethod
    fun stopService(promise: Promise) {
        try {
            Log.d(TAG, "Stopping service")
            val intent = Intent(reactApplicationContext, SensorForegroundService::class.java).apply {
                action = SensorForegroundService.ACTION_STOP
            }
            reactApplicationContext.startService(intent)
            promise.resolve("Service stopped")
        } catch (e: Exception) {
            Log.e(TAG, "Error stopping service: ${e.message}")
            promise.reject("STOP_ERROR", "Failed to stop service: ${e.message}")
        }
    }

    @ReactMethod
    fun getLatestData(promise: Promise) {
        try {
            val prefs = reactApplicationContext.getSharedPreferences("SensorData", android.content.Context.MODE_PRIVATE)
            val lastData = prefs.getString("lastData", null)
            val lastUpdate = prefs.getLong("lastUpdate", 0)
            
            if (lastData != null) {
                promise.resolve(lastData)
            } else {
                promise.resolve(null)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error getting latest data: ${e.message}")
            promise.reject("GET_DATA_ERROR", "Failed to get data: ${e.message}")
        }
    }

    @ReactMethod
    fun setFeedbackConfig(vibrate: Boolean, notify: Boolean, sound: Boolean, promise: Promise?) {
        try {
            val prefs = reactApplicationContext.getSharedPreferences("SensorConfig", android.content.Context.MODE_PRIVATE)
            val arr = mutableListOf<String>()
            if (vibrate) arr.add("vibration")
            if (notify) arr.add("notification")
            if (sound) arr.add("sound")
            prefs.edit().putString("feedback_type", org.json.JSONArray(arr as Collection<*>).toString()).apply()
            Log.d(TAG, "Saved feedback_type to SharedPreferences: ${prefs.getString("feedback_type", "[]")}")
            promise?.resolve("ok")
        } catch (e: Exception) {
            Log.e(TAG, "Error saving feedback config: ${e.message}")
            promise?.reject("SAVE_ERROR", "${e.message}")
        }
    }

    @ReactMethod
    fun addListener(eventName: String) {
        // Required for RN built in Event Emitter Calls
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Required for RN built in Event Emitter Calls
    }
}
