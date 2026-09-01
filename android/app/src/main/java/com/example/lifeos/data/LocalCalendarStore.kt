package com.example.lifeos.data

import android.content.Context
import android.content.SharedPreferences
import com.example.lifeos.data.models.CalendarEvent
import com.example.lifeos.data.models.CalendarEventType
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.text.SimpleDateFormat
import java.util.*

object LocalCalendarStore {
    private const val PREFS_NAME = "lifeos_calendar_store"
    private const val KEY_EVENTS = "calendar_events_json"

    private val json = Json { ignoreUnknownKeys = true; isLenient = true; encodeDefaults = true }

    private fun getPrefs(context: Context): SharedPreferences {
        return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }

    @Synchronized
    fun getEvents(context: Context, userId: String): List<CalendarEvent> {
        val raw = getPrefs(context).getString(KEY_EVENTS, null)
        if (raw.isNullOrBlank()) {
            return emptyList()
        }
        return try {
            val list = json.decodeFromString<List<CalendarEvent>>(raw)
            list.filter { it.user_id == userId }
        } catch (e: Exception) {
            emptyList()
        }
    }

    @Synchronized
    fun saveEvents(context: Context, events: List<CalendarEvent>) {
        try {
            val raw = json.encodeToString(events)
            getPrefs(context).edit().putString(KEY_EVENTS, raw).apply()
        } catch (e: Exception) {
            android.util.Log.e("LocalCalendarStore", "Failed to save calendar events", e)
        }
    }

    @Synchronized
    fun addOrUpdateEvent(context: Context, event: CalendarEvent) {
        val current = getEvents(context, event.user_id).toMutableList()
        val index = current.indexOfFirst { it.id == event.id }
        if (index >= 0) {
            current[index] = event
        } else {
            current.add(event)
        }
        saveEvents(context, current)
    }

    @Synchronized
    fun deleteEvent(context: Context, userId: String, eventId: String) {
        val current = getEvents(context, userId).toMutableList()
        current.removeAll { it.id == eventId }
        saveEvents(context, current)
    }
}
