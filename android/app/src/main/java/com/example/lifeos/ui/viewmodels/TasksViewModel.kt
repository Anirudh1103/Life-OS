package com.example.lifeos.ui.viewmodels

import android.app.Application
import android.util.Log
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.lifeos.data.SupabaseProvider
import com.example.lifeos.data.SupabaseRepository
import com.example.lifeos.data.models.Task
import com.example.lifeos.data.models.TaskStep
import io.github.jan.supabase.gotrue.auth
import io.github.jan.supabase.gotrue.SessionStatus
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

class TasksViewModel(application: Application) : AndroidViewModel(application) {
    private val repository = SupabaseRepository()
    private val client = SupabaseProvider.client

    private val _tasks = MutableStateFlow<List<Task>>(emptyList())
    val tasks: StateFlow<List<Task>> = _tasks.asStateFlow()

    // Map to store subtask progress counts: taskId -> Pair(completedCount, totalCount)
    private val _subtaskCounts = MutableStateFlow<Map<String, Pair<Int, Int>>>(emptyMap())
    val subtaskCounts: StateFlow<Map<String, Pair<Int, Int>>> = _subtaskCounts.asStateFlow()

    // Selected task for Details panel
    private val _selectedTask = MutableStateFlow<Task?>(null)
    val selectedTask: StateFlow<Task?> = _selectedTask.asStateFlow()

    // Steps/Subtasks for the selected task
    private val _selectedTaskSteps = MutableStateFlow<List<TaskStep>>(emptyList())
    val selectedTaskSteps: StateFlow<List<TaskStep>> = _selectedTaskSteps.asStateFlow()

    init {
        observeAuth()
    }

    private fun observeAuth() {
        viewModelScope.launch {
            client.auth.sessionStatus.collectLatest { status ->
                if (status is SessionStatus.Authenticated) {
                    loadTasks()
                } else {
                    _tasks.value = emptyList()
                    _subtaskCounts.value = emptyMap()
                    _selectedTask.value = null
                    _selectedTaskSteps.value = emptyList()
                }
            }
        }
    }

    fun loadTasks() {
        viewModelScope.launch {
            val user = client.auth.currentUserOrNull() ?: return@launch
            val results = repository.getTasks(user.id)
            _tasks.value = results

            // Fetch all steps in bulk to calculate subtask progress efficiently (no N+1 requests)
            val allSteps = repository.getAllTaskSteps(user.id)
            val countsMap = allSteps.groupBy { it.task_id }.mapValues { (_, steps) ->
                Pair(steps.count { it.is_completed }, steps.size)
            }
            _subtaskCounts.value = countsMap

            // Refresh selected task detail if one is selected
            _selectedTask.value?.let { currentSelected ->
                val refreshed = results.find { it.id == currentSelected.id }
                if (refreshed != null) {
                    _selectedTask.value = refreshed
                    loadSelectedTaskSteps(refreshed.id)
                } else {
                    _selectedTask.value = null
                    _selectedTaskSteps.value = emptyList()
                }
            }
        }
    }

    fun selectTask(task: Task?) {
        _selectedTask.value = task
        if (task != null) {
            loadSelectedTaskSteps(task.id)
        } else {
            _selectedTaskSteps.value = emptyList()
        }
    }

    private fun loadSelectedTaskSteps(taskId: String) {
        viewModelScope.launch {
            val user = client.auth.currentUserOrNull() ?: return@launch
            val steps = repository.getTaskSteps(user.id, taskId)
            _selectedTaskSteps.value = steps

            val currentCounts = _subtaskCounts.value.toMutableMap()
            currentCounts[taskId] = Pair(steps.count { it.is_completed }, steps.size)
            _subtaskCounts.value = currentCounts
        }
    }

    // Add a parent task
    fun addTask(titleStr: String, workspaceStr: String, isInToday: Boolean = false, dueAt: String? = null) {
        viewModelScope.launch {
            val user = client.auth.currentUserOrNull() ?: return@launch
            val newTask = Task(
                id = UUID.randomUUID().toString(),
                user_id = user.id,
                workspace = workspaceStr,
                title = titleStr,
                is_completed = false,
                is_important = false,
                is_in_today = isInToday,
                priority = "none",
                due_at = dueAt,
                created_at = null,
                updated_at = null
            )
            repository.createTask(newTask)
            loadTasks()
        }
    }

    // Toggle completion status of parent task (optimistic update)
    fun toggleTask(task: Task) {
        viewModelScope.launch {
            val targetState = !task.is_completed
            _tasks.value = _tasks.value.map { t ->
                if (t.id == task.id) t.copy(is_completed = targetState) else t
            }
            if (_selectedTask.value?.id == task.id) {
                _selectedTask.value = _selectedTask.value?.copy(is_completed = targetState)
            }

            repository.updateTask(task.id, targetState)
            loadTasks()
        }
    }

    fun updateTaskImportance(task: Task, isImportant: Boolean) {
        viewModelScope.launch {
            _tasks.value = _tasks.value.map { t ->
                if (t.id == task.id) t.copy(is_important = isImportant) else t
            }
            if (_selectedTask.value?.id == task.id) {
                _selectedTask.value = _selectedTask.value?.copy(is_important = isImportant)
            }

            repository.updateTaskImportance(task.id, isImportant)
            loadTasks()
        }
    }

    fun updateTaskInToday(task: Task, isInToday: Boolean) {
        viewModelScope.launch {
            _tasks.value = _tasks.value.map { t ->
                if (t.id == task.id) t.copy(is_in_today = isInToday) else t
            }
            if (_selectedTask.value?.id == task.id) {
                _selectedTask.value = _selectedTask.value?.copy(is_in_today = isInToday)
            }

            repository.updateTaskInToday(task.id, isInToday)
            loadTasks()
        }
    }

    fun updateTaskPriority(task: Task, priority: String) {
        viewModelScope.launch {
            _tasks.value = _tasks.value.map { t ->
                if (t.id == task.id) t.copy(priority = priority) else t
            }
            if (_selectedTask.value?.id == task.id) {
                _selectedTask.value = _selectedTask.value?.copy(priority = priority)
            }

            repository.updateTaskPriority(task.id, priority)
            loadTasks()
        }
    }

    fun updateTaskDueDate(task: Task, dueAt: String?) {
        viewModelScope.launch {
            _tasks.value = _tasks.value.map { t ->
                if (t.id == task.id) t.copy(due_at = dueAt) else t
            }
            if (_selectedTask.value?.id == task.id) {
                _selectedTask.value = _selectedTask.value?.copy(due_at = dueAt)
            }

            repository.updateTaskDueDate(task.id, dueAt)
            loadTasks()
        }
    }

    fun updateTaskNotes(task: Task, notes: String?) {
        viewModelScope.launch {
            _tasks.value = _tasks.value.map { t ->
                if (t.id == task.id) t.copy(description = notes) else t
            }
            if (_selectedTask.value?.id == task.id) {
                _selectedTask.value = _selectedTask.value?.copy(description = notes)
            }

            repository.updateTaskNotes(task.id, notes)
            loadTasks()
        }
    }

    fun updateTaskTitle(task: Task, title: String) {
        viewModelScope.launch {
            _tasks.value = _tasks.value.map { t ->
                if (t.id == task.id) t.copy(title = title) else t
            }
            if (_selectedTask.value?.id == task.id) {
                _selectedTask.value = _selectedTask.value?.copy(title = title)
            }

            repository.updateTaskTitle(task.id, title)
            loadTasks()
        }
    }

    fun deleteTask(task: Task) {
        viewModelScope.launch {
            if (_selectedTask.value?.id == task.id) {
                _selectedTask.value = null
                _selectedTaskSteps.value = emptyList()
            }
            _tasks.value = _tasks.value.filter { t -> t.id != task.id }
            repository.deleteTask(task.id)
            loadTasks()
        }
    }

    // --- Subtask (Task Step) Operations ---

    fun addSubtask(task: Task, title: String) {
        viewModelScope.launch {
            val user = client.auth.currentUserOrNull() ?: return@launch
            val newStep = TaskStep(
                id = UUID.randomUUID().toString(),
                task_id = task.id,
                user_id = user.id,
                title = title,
                is_completed = false,
                sort_order = _selectedTaskSteps.value.size
            )
            _selectedTaskSteps.value = _selectedTaskSteps.value + newStep
            
            repository.createTaskStep(newStep)
            loadSelectedTaskSteps(task.id)
        }
    }

    fun toggleSubtask(step: TaskStep) {
        viewModelScope.launch {
            val targetState = !step.is_completed
            _selectedTaskSteps.value = _selectedTaskSteps.value.map { s ->
                if (s.id == step.id) s.copy(is_completed = targetState) else s
            }

            repository.updateTaskStepCompletion(step.id, targetState)
            loadSelectedTaskSteps(step.task_id)
        }
    }

    fun deleteSubtask(step: TaskStep) {
        viewModelScope.launch {
            _selectedTaskSteps.value = _selectedTaskSteps.value.filter { s -> s.id != step.id }

            repository.deleteTaskStep(step.id)
            loadSelectedTaskSteps(step.task_id)
        }
    }

    fun updateSubtaskTitle(step: TaskStep, title: String) {
        viewModelScope.launch {
            _selectedTaskSteps.value = _selectedTaskSteps.value.map { s ->
                if (s.id == step.id) s.copy(title = title) else s
            }

            repository.updateTaskStepTitle(step.id, title)
            loadSelectedTaskSteps(step.task_id)
        }
    }
}
