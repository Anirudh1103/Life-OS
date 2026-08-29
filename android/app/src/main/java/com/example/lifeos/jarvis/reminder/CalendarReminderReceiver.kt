package com.example.lifeos.jarvis.reminder

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import com.example.lifeos.jarvis.service.JarvisWakeWordService

class CalendarReminderReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == "com.example.lifeos.ACTION_PROACTIVE_REMINDER") {
            val title = intent.getStringExtra("event_title") ?: "Unknown Event"
            Log.d("CalendarReminder", "Triggering JARVIS for: $title")
            
            val serviceIntent = Intent(context, JarvisWakeWordService::class.java).apply {
                action = "com.example.lifeos.jarvis.PROACTIVE_REMINDER"
                putExtra("event_title", title)
            }
            
            try {
                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                    context.startForegroundService(serviceIntent)
                } else {
                    context.startService(serviceIntent)
                }
            } catch (e: Exception) {
                Log.e("CalendarReminder", "Failed to start JARVIS service from receiver", e)
            }
        }
    }
}
