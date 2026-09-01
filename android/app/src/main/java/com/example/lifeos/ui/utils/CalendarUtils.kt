package com.example.lifeos.ui.utils

import com.example.lifeos.data.models.CalendarEvent
import com.example.lifeos.data.models.RecurrenceType
import java.text.SimpleDateFormat
import java.util.*

object CalendarUtils {
    private val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.US)

    /**
     * Expands a list of events to include recurring occurrences for a specific target date.
     */
    fun expandEventsForDate(events: List<CalendarEvent>, targetDate: Calendar): List<CalendarEvent> {
        val targetDateStr = dateFormat.format(targetDate.time)
        val expandedList = mutableListOf<CalendarEvent>()

        for (event in events) {
            val dateObj = try { dateFormat.parse(event.date) } catch (e: Exception) { null } ?: continue
            val eventDate = Calendar.getInstance().apply {
                time = dateObj
            }

            // If the event starts after the target date, it can't occur on the target date
            if (eventDate.after(targetDate) && !isSameDay(eventDate, targetDate)) continue

            when (event.recurrence) {
                RecurrenceType.NONE -> {
                    if (isSameDay(eventDate, targetDate)) {
                        expandedList.add(event)
                    }
                }
                RecurrenceType.DAILY -> {
                    expandedList.add(event.copy(date = targetDateStr))
                }
                RecurrenceType.WEEKLY -> {
                    if (eventDate.get(Calendar.DAY_OF_WEEK) == targetDate.get(Calendar.DAY_OF_WEEK)) {
                        expandedList.add(event.copy(date = targetDateStr))
                    }
                }
                RecurrenceType.MONTHLY -> {
                    if (eventDate.get(Calendar.DAY_OF_MONTH) == targetDate.get(Calendar.DAY_OF_MONTH)) {
                        expandedList.add(event.copy(date = targetDateStr))
                    }
                }
                RecurrenceType.YEARLY -> {
                    if (eventDate.get(Calendar.DAY_OF_MONTH) == targetDate.get(Calendar.DAY_OF_MONTH) &&
                        eventDate.get(Calendar.MONTH) == targetDate.get(Calendar.MONTH)) {
                        expandedList.add(event.copy(date = targetDateStr))
                    }
                }
            }
        }
        return expandedList
    }

    private fun isSameDay(cal1: Calendar, cal2: Calendar): Boolean {
        return cal1.get(Calendar.YEAR) == cal2.get(Calendar.YEAR) &&
               cal1.get(Calendar.DAY_OF_YEAR) == cal2.get(Calendar.DAY_OF_YEAR)
    }
}
