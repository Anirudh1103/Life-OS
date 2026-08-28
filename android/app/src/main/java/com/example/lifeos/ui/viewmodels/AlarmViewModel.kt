package com.example.lifeos.ui.viewmodels

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import com.example.lifeos.alarm.AlarmController
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.util.*

data class Alarm(
    val id: String,
    val time: String,
    val isEnabled: Boolean,
    val timeInMillis: Long
)

class AlarmViewModel(application: Application) : AndroidViewModel(application) {
    private val _alarms = MutableStateFlow<List<Alarm>>(emptyList())
    val alarms: StateFlow<List<Alarm>> = _alarms.asStateFlow()

    init {
        // Mock alarms for now, can be stored in Prefs or Room
        _alarms.value = listOf(
            Alarm("1", "07:00 AM", true, getMillis(7, 0)),
            Alarm("2", "08:30 AM", false, getMillis(8, 30)),
            Alarm("3", "06:00 PM", true, getMillis(18, 0))
        )
    }

    private fun getMillis(hour: Int, min: Int): Long {
        val calendar = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, hour)
            set(Calendar.MINUTE, min)
            set(Calendar.SECOND, 0)
            if (timeInMillis < System.currentTimeMillis()) {
                add(Calendar.DAY_OF_YEAR, 1)
            }
        }
        return calendar.timeInMillis
    }

    fun toggleAlarm(alarmId: String, enabled: Boolean) {
        val list = _alarms.value.toMutableList()
        val index = list.findIndex { it.id == alarmId }
        if (index != -1) {
            val updated = list[index].copy(isEnabled = enabled)
            list[index] = updated
            _alarms.value = list

            if (enabled) {
                AlarmController.setAlarm(getApplication(), updated.timeInMillis)
            } else {
                // In a real app, you'd need unique request codes to cancel specific alarms
                // For now we just have one test cancel in AlarmController
            }
        }
    }

    private fun <T> List<T>.findIndex(predicate: (T) -> Boolean): Int {
        for (i in indices) {
            if (predicate(this[i])) return i
        }
        return -1
    }
}
