package com.example.lifeos.jarvis.reminder

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import com.example.lifeos.data.models.CalendarEvent
import java.text.SimpleDateFormat
import java.util.*

object CalendarReminderManager {
    private const val TAG = "CalendarReminder"
    private const val REMINDER_OFFSET_MINUTES = 15

    fun scheduleReminders(context: Context, events: List<CalendarEvent>) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val now = Calendar.getInstance().timeInMillis

        events.filter { !it.is_all_day }.forEach { event ->
            val triggerTime = calculateReminderTime(event)
            
            if (triggerTime > now) {
                val intent = Intent(context, CalendarReminderReceiver::class.java).apply {
                    action = "com.example.lifeos.ACTION_PROACTIVE_REMINDER"
                    putExtra("event_title", event.title)
                    putExtra("event_id", event.id)
                }

                try {
                    val pendingIntent = PendingIntent.getBroadcast(
                        context,
                        event.id.hashCode(),
                        intent,
                        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                    )

                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && !alarmManager.canScheduleExactAlarms()) {
                        Log.w(TAG, "Cannot schedule exact alarm: Permission missing")
                        alarmManager.set(AlarmManager.RTC_WAKEUP, triggerTime, pendingIntent)
                    } else {
                        alarmManager.setExactAndAllowWhileIdle(
                            AlarmManager.RTC_WAKEUP,
                            triggerTime,
                            pendingIntent
                        )
                    }
                    Log.d(TAG, "Scheduled reminder for '${event.title}' at ${Date(triggerTime)}")
                } catch (e: Exception) {
                    Log.e(TAG, "Failed to schedule alarm", e)
                }
            } else {
                val intent = Intent(context, CalendarReminderReceiver::class.java)
                val pendingIntent = PendingIntent.getBroadcast(
                    context,
                    event.id.hashCode(),
                    intent,
                    PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE
                )
                if (pendingIntent != null) {
                    alarmManager.cancel(pendingIntent)
                    pendingIntent.cancel()
                }
            }
        }
    }

    private fun calculateReminderTime(event: CalendarEvent): Long {
        if (event.start_time == null) return 0L
        
        return try {
            val sdf = SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.US)
            val dateTimeStr = "${event.date} ${event.start_time}"
            val startTime = sdf.parse(dateTimeStr)?.time ?: 0L
            startTime - (REMINDER_OFFSET_MINUTES * 60 * 1000L)
        } catch (e: Exception) {
            0L
        }
    }
}
