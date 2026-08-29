package com.example.lifeos.alarm

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log

object AlarmController {

    fun setAlarm(context: Context, timeInMillis: Long, id: Int = 2001) {
        val sharedPrefs = context.getSharedPreferences("jarvis_prefs", Context.MODE_PRIVATE)
        val ringtoneUri = sharedPrefs.getString("ringtone_uri", null)

        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val intent = Intent(context, AlarmReceiver::class.java).apply {
            putExtra("ringtone_uri", ringtoneUri)
            putExtra("alarm_id", id)
        }
        val pendingIntent = PendingIntent.getBroadcast(
            context,
            id,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP,
                    timeInMillis,
                    pendingIntent
                )
            } else {
                alarmManager.setExact(
                    AlarmManager.RTC_WAKEUP,
                    timeInMillis,
                    pendingIntent
                )
            }
            Log.d("JARVIS", "Alarm $id set for $timeInMillis")
        } catch (e: SecurityException) {
            Log.e("JARVIS", "Failed to set exact alarm", e)
        }
    }

    fun cancelAlarm(context: Context, id: Int = 2001) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val intent = Intent(context, AlarmReceiver::class.java)
        val pendingIntent = PendingIntent.getBroadcast(
            context,
            id,
            intent,
            PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE
        )
        if (pendingIntent != null) {
            alarmManager.cancel(pendingIntent)
            Log.d("JARVIS", "Alarm $id cancelled")
        }
    }
}
