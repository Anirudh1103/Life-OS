package com.example.lifeos.jarvis.service

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import com.example.lifeos.jarvis.prefs.JarvisPrefs

/**
 * Ensures JARVIS starts automatically when the device is rebooted,
 * provided the user had enabled it previously.
 */
class JarvisBootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED || 
            intent.action == "android.intent.action.QUICKBOOT_POWERON") {
            
            Log.d("JARVIS_BOOT", "Device boot detected. Checking JARVIS configuration...")
            
            val isEnabled = JarvisPrefs.isListenEnabled(context)
            if (isEnabled) {
                Log.i("JARVIS_BOOT", "Starting JarvisWakeWordService automatically.")
                val serviceIntent = Intent(context, JarvisWakeWordService::class.java).apply {
                    action = JarvisWakeWordService.ACTION_START
                }
                
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(serviceIntent)
                } else {
                    context.startService(serviceIntent)
                }
            } else {
                Log.d("JARVIS_BOOT", "Jarvis listening is disabled in preferences. Skipping start.")
            }
        }
    }
}
