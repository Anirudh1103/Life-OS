package com.example.lifeos.alarm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

class AlarmReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val ringtoneUri = intent.getStringExtra("ringtone_uri")
        Log.d("JARVIS", "Alarm triggered in Receiver. Action: ${intent.action}")

        if (intent.action == "STOP_ALARM") {
            context.stopService(Intent(context, AlarmService::class.java))
            return
        }

        val serviceIntent = Intent(context, AlarmService::class.java).apply {
            putExtra("ringtone_uri", ringtoneUri)
        }
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            context.startForegroundService(serviceIntent)
        } else {
            context.startService(serviceIntent)
        }
    }
}
