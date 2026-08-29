package com.example.lifeos.ui.viewmodels

import android.app.Application
import android.content.Context
import androidx.lifecycle.AndroidViewModel
import com.example.lifeos.alarm.AlarmController
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.util.*

@Serializable
data class Alarm(
    val id: String,
    val time: String,
    val isEnabled: Boolean,
    val timeInMillis: Long
)

class AlarmViewModel(application: Application) : AndroidViewModel(application) {
    private val _alarms = MutableStateFlow<List<Alarm>>(emptyList())
    val alarms: StateFlow<List<Alarm>> = _alarms.asStateFlow()

    private val prefs = getApplication<Application>().getSharedPreferences("lifeos_alarms", Context.MODE_PRIVATE)

    init {
        loadAlarms()
    }

    private fun loadAlarms() {
        val jsonStr = prefs.getString("alarm_list", null)
        if (jsonStr != null) {
            try {
                _alarms.value = Json.decodeFromString<List<Alarm>>(jsonStr)
            } catch (e: Exception) {
                _alarms.value = emptyList()
            }
        } else {
            // Default alarms if none exist
            _alarms.value = listOf(
                Alarm(UUID.randomUUID().toString(), "07:00 AM", false, getMillis(7, 0)),
                Alarm(UUID.randomUUID().toString(), "08:30 AM", false, getMillis(8, 30))
            )
            saveAlarms()
        }
    }

    private fun saveAlarms() {
        val jsonStr = Json.encodeToString(_alarms.value)
        prefs.edit().putString("alarm_list", jsonStr).apply()
    }

    private fun getMillis(hour: Int, min: Int): Long {
        val calendar = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, hour)
            set(Calendar.MINUTE, min)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
            if (timeInMillis <= System.currentTimeMillis()) {
                add(Calendar.DAY_OF_YEAR, 1)
            }
        }
        return calendar.timeInMillis
    }

    fun addAlarm(hour: Int, min: Int) {
        val cal = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, hour)
            set(Calendar.MINUTE, min)
        }
        val timeStr = java.text.SimpleDateFormat("hh:mm a", Locale.US).format(cal.time)
        val newAlarm = Alarm(
            id = UUID.randomUUID().toString(),
            time = timeStr,
            isEnabled = true,
            timeInMillis = getMillis(hour, min)
        )
        _alarms.value = _alarms.value + newAlarm
        saveAlarms()
        AlarmController.setAlarm(getApplication(), newAlarm.timeInMillis, newAlarm.id.hashCode())
    }

    fun deleteAlarm(alarmId: String) {
        val alarm = _alarms.value.find { it.id == alarmId }
        if (alarm != null) {
            AlarmController.cancelAlarm(getApplication(), alarm.id.hashCode())
        }
        _alarms.value = _alarms.value.filter { it.id != alarmId }
        saveAlarms()
    }

    fun toggleAlarm(alarmId: String, enabled: Boolean) {
        val list = _alarms.value.map { 
            if (it.id == alarmId) it.copy(isEnabled = enabled) else it
        }
        _alarms.value = list
        saveAlarms()

        val toggled = list.find { it.id == alarmId }
        if (toggled != null) {
            if (enabled) {
                // Refresh millis in case it's in the past
                val parts = toggled.time.split(":")
                val h = parts[0].toInt()
                val m = parts[1].split(" ")[0].toInt()
                val isPM = toggled.time.contains("PM")
                val hour24 = if (isPM && h < 12) h + 12 else if (!isPM && h == 12) 0 else h
                
                val newMillis = getMillis(hour24, m)
                AlarmController.setAlarm(getApplication(), newMillis, toggled.id.hashCode())
            } else {
                AlarmController.cancelAlarm(getApplication(), toggled.id.hashCode())
            }
        }
    }
}
