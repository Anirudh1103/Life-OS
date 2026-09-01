package com.example.lifeos.ui.viewmodels

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.lifeos.data.SupabaseProvider
import com.example.lifeos.data.SupabaseRepository
import com.example.lifeos.data.models.*
import io.github.jan.supabase.gotrue.auth
import com.example.lifeos.jarvis.reminder.CalendarReminderManager
import com.example.lifeos.ui.utils.CalendarUtils
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
    
    // Expose expanded events for the selected date
    val currentDayEvents: StateFlow<List<CalendarEvent>> = combine(_events, _selectedDate) { allEvents, date ->
        val expanded = CalendarUtils.expandEventsForDate(allEvents, date)
        android.util.Log.d("CalendarVM", "Expanding events for ${SimpleDateFormat("yyyy-MM-dd", Locale.US).format(date.time)}: totalIn=${allEvents.size} expandedOut=${expanded.size}")
        expanded
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // Expose upcoming expanded events for the sidebar
    val upcomingEvents: StateFlow<List<CalendarEvent>> = combine(_events, _selectedDate) { allEvents, _ ->
        val result = mutableListOf<CalendarEvent>()
        val tempCal = Calendar.getInstance()
        // Show next 7 days
        repeat(7) {
            result.addAll(CalendarUtils.expandEventsForDate(allEvents, tempCal))
            tempCal.add(Calendar.DAY_OF_YEAR, 1)
        }
        result.sortedBy { it.date + (it.start_time ?: "") }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

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
                var allEvents = repository.getCalendarEvents(user.id)
                val prefs = getApplication<Application>().getSharedPreferences("lifeos_calendar_store", android.content.Context.MODE_PRIVATE)
                val hasSeeded = prefs.getBoolean("has_seeded_initial_calendar_v3", false)
                
                if (allEvents.isEmpty() && !hasSeeded) {
                    prefs.edit().putBoolean("has_seeded_initial_calendar_v3", true).apply()
                    repository.seedRequestedMeetings(user.id)
                    allEvents = repository.getCalendarEvents(user.id)
                }
                
                _events.value = allEvents
                CalendarReminderManager.scheduleReminders(getApplication(), allEvents)
            } catch (e: Exception) {
                // Handle error
            } finally {
                _isLoading.value = false
            }
        }
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
        val user = client.auth.currentUserOrNull() ?: return
        viewModelScope.launch {
            repository.deleteCalendarEvent(eventId, user.id)
            if (_selectedEvent.value?.id == eventId) {
                _selectedEvent.value = null
            }
            fetchEvents()
        }
    }
}
