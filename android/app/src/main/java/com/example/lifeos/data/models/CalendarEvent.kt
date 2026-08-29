package com.example.lifeos.data.models

import kotlinx.serialization.Serializable

@Serializable
enum class CalendarEventType {
    MEETING, EVENT, BIRTHDAY, ANNIVERSARY, REMINDER, PERSONAL, WORK
}

@Serializable
enum class RecurrenceType {
    NONE, DAILY, WEEKLY, MONTHLY, YEARLY
}

@Serializable
data class CalendarEvent(
    val id: String,
    val user_id: String,
    val title: String,
    val description: String? = null,
    val type: CalendarEventType,
    val date: String, // Format: yyyy-MM-dd
    val start_time: String? = null, // Format: HH:mm
    val end_time: String? = null, // Format: HH:mm
    val is_all_day: Boolean = false,
    val location: String? = null,
    val meeting_url: String? = null,
    val recurrence: RecurrenceType = RecurrenceType.NONE,
    val reminder_minutes: Int? = null,
    val category: String? = null,
    val created_at: String? = null,
    val updated_at: String? = null
)
