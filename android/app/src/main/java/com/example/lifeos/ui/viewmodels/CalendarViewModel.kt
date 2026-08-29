package com.example.lifeos.ui.viewmodels

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.lifeos.data.SupabaseProvider
import com.example.lifeos.data.SupabaseRepository
import com.example.lifeos.data.models.*
import io.github.jan.supabase.gotrue.auth
import com.example.lifeos.jarvis.reminder.CalendarReminderManager
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

enum class CalendarViewMode { DAY, WEEK, MONTH }

class CalendarViewModel(application: Application) : AndroidViewModel(application) {
    private val repository = SupabaseRepository()
    private val client = SupabaseProvider.client

    private val _selectedDate = MutableStateFlow(Calendar.getInstance())
    val selectedDate: StateFlow<Calendar> = _selectedDate.asStateFlow()

    private val _viewMode = MutableStateFlow(CalendarViewMode.DAY)
    val viewMode: StateFlow<CalendarViewMode> = _viewMode.asStateFlow()

    private val _events = MutableStateFlow<List<CalendarEvent>>(emptyList())
    val events: StateFlow<List<CalendarEvent>> = _events.asStateFlow()

    private val _selectedEvent = MutableStateFlow<CalendarEvent?>(null)
    val selectedEvent: StateFlow<CalendarEvent?> = _selectedEvent.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.US)

    init {
        fetchEvents()
    }

    fun fetchEvents() {
        val user = client.auth.currentUserOrNull() ?: return
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val allEvents = repository.getCalendarEvents(user.id)
                if (allEvents.isEmpty()) {
                    seedInitialData(user.id)
                } else {
                    _events.value = allEvents
                    CalendarReminderManager.scheduleReminders(getApplication(), allEvents)
                }
            } catch (e: Exception) {
                // Handle error
            } finally {
                _isLoading.value = false
            }
        }
    }

    private suspend fun seedInitialData(userId: String) {
        val today = dateFormat.format(Date())
        val anniversary = CalendarEvent(
            id = UUID.randomUUID().toString(),
            user_id = userId,
            title = "Mom & Dad's Wedding Anniversary 💖",
            type = CalendarEventType.ANNIVERSARY,
            date = today,
            is_all_day = true,
            recurrence = RecurrenceType.YEARLY,
            category = "Personal / Family"
        )
        val standup = CalendarEvent(
            id = UUID.randomUUID().toString(),
            user_id = userId,
            title = "Daily Stand-up Meeting",
            type = CalendarEventType.MEETING,
            date = today,
            start_time = "14:30",
            end_time = "15:00",
            location = "Online"
        )
        repository.createCalendarEvent(anniversary)
        repository.createCalendarEvent(standup)
        _events.value = listOf(anniversary, standup)
    }

    fun setDate(date: Calendar) {
        _selectedDate.value = date
    }

    fun nextDate() {
        val newDate = (_selectedDate.value.clone() as Calendar)
        when(_viewMode.value) {
            CalendarViewMode.DAY -> newDate.add(Calendar.DAY_OF_YEAR, 1)
            CalendarViewMode.WEEK -> newDate.add(Calendar.WEEK_OF_YEAR, 1)
            CalendarViewMode.MONTH -> newDate.add(Calendar.MONTH, 1)
        }
        _selectedDate.value = newDate
    }

    fun prevDate() {
        val newDate = (_selectedDate.value.clone() as Calendar)
        when(_viewMode.value) {
            CalendarViewMode.DAY -> newDate.add(Calendar.DAY_OF_YEAR, -1)
            CalendarViewMode.WEEK -> newDate.add(Calendar.WEEK_OF_YEAR, -1)
            CalendarViewMode.MONTH -> newDate.add(Calendar.MONTH, -1)
        }
        _selectedDate.value = newDate
    }

    fun setViewMode(mode: CalendarViewMode) {
        _viewMode.value = mode
    }

    fun selectEvent(event: CalendarEvent?) {
        _selectedEvent.value = event
    }

    fun createEvent(event: CalendarEvent) {
        val user = client.auth.currentUserOrNull() ?: return
        viewModelScope.launch {
            repository.createCalendarEvent(event.copy(user_id = user.id))
            fetchEvents() // This will trigger scheduleReminders
        }
    }

    fun deleteEvent(eventId: String) {
        viewModelScope.launch {
            repository.deleteCalendarEvent(eventId)
            if (_selectedEvent.value?.id == eventId) {
                _selectedEvent.value = null
            }
            fetchEvents()
        }
    }
}
