package com.example.lifeos.ui.viewmodels

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.lifeos.data.SupabaseProvider
import com.example.lifeos.data.SupabaseRepository
import com.example.lifeos.data.models.Task
import com.example.lifeos.data.models.FitnessActivity
import io.github.jan.supabase.gotrue.auth
import io.github.jan.supabase.gotrue.SessionStatus
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

class DashboardViewModel(application: Application) : AndroidViewModel(application) {
    private val repository = SupabaseRepository()
    private val client = SupabaseProvider.client

    private val _tasks = MutableStateFlow<List<Task>>(emptyList())
    val tasks: StateFlow<List<Task>> = _tasks.asStateFlow()

    private val _fitnessActivities = MutableStateFlow<List<FitnessActivity>>(emptyList())
    val fitnessActivities: StateFlow<List<FitnessActivity>> = _fitnessActivities.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage.asStateFlow()

    private val _currentTime = MutableStateFlow("")
    val currentTime: StateFlow<String> = _currentTime.asStateFlow()

    private val _currentDate = MutableStateFlow("")
    val currentDate: StateFlow<String> = _currentDate.asStateFlow()

    init {
        startClock()
        observeAuth()
    }

    private fun observeAuth() {
        viewModelScope.launch {
            client.auth.sessionStatus.collectLatest { status ->
                if (status is SessionStatus.Authenticated) {
                    refresh()
                } else {
                    _tasks.value = emptyList()
                    _fitnessActivities.value = emptyList()
                }
            }
        }
    }

    private fun startClock() {
        viewModelScope.launch {
            while (true) {
                val now = Calendar.getInstance().time
                val sdfTime = SimpleDateFormat("hh:mm a z", Locale.getDefault())
                _currentTime.value = sdfTime.format(now).uppercase()
                val sdfDate = SimpleDateFormat("EEEE, d MMMM yyyy", Locale.getDefault())
                _currentDate.value = sdfDate.format(now)
                delay(1000)
            }
        }
    }

    fun refresh() {
        viewModelScope.launch {
            _isLoading.value = true
            _errorMessage.value = null

            val user = client.auth.currentUserOrNull() ?: run {
                android.util.Log.w("Dashboard", "Refresh failed: No authenticated user session.")
                _isLoading.value = false
                return@launch
            }

            android.util.Log.d("Dashboard", "Refreshing data for Commander: ${user.email} (${user.id})")

            try {
                val t = repository.getTasks(user.id)
                val f = repository.getFitnessActivities(user.id)

                android.util.Log.d("Dashboard", "Retrieved ${t.size} tasks and ${f.size} activities.")

                _tasks.value = t
                _fitnessActivities.value = f

            } catch (e: Exception) {
                android.util.Log.e("Dashboard", "Data sync failure: ${e.message}", e)
                _errorMessage.value = "Link failure: ${e.message}"
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun toggleTask(task: Task) {
        viewModelScope.launch {
            val targetState = !task.is_completed
            _tasks.value = _tasks.value.map { t ->
                if (t.id == task.id) t.copy(is_completed = targetState) else t
            }
            try {
                repository.updateTask(task.id, targetState)
                refresh()
            } catch (e: Exception) {
                _errorMessage.value = "Link failure: ${e.message}"
            }
        }
    }
}
