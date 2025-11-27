package com.anonymous.posturapp

import android.media.MediaPlayer
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class SoundServiceModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String = "SoundService"

    @ReactMethod
    fun playSound(type: String) {
        val resId = reactApplicationContext.resources.getIdentifier(type, "raw", reactApplicationContext.packageName)
        if (resId != 0) {
            val player = MediaPlayer.create(reactApplicationContext, resId)
            player?.setOnCompletionListener { it.release() }
            player?.start()
        }
    }
}
