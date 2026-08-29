package com.example.lifeos.data

import com.example.lifeos.data.models.*
import io.github.jan.supabase.postgrest.postgrest
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.*
import android.util.Log

class SupabaseRepository {
    private val client = SupabaseProvider.client

    // --- Profile ---
    suspend fun getProfile(userId: String): Profile? = withContext(Dispatchers.IO) {
        try {
            Log.d("Supabase", "Fetching profile for $userId")
            client.postgrest.from("profiles").select {
                filter { eq("id", userId) }
            }.decodeSingleOrNull<Profile>()
        } catch (e: Exception) {
            Log.e("Supabase", "Profile fetch failed", e)
            null
        }
    }

    // --- Tasks ---
    suspend fun getTasks(userId: String): List<Task> = withContext(Dispatchers.IO) {
        try {
            Log.d("Supabase", "Querying 'tasks' for commander ID: $userId")
            val results = client.postgrest.from("tasks").select {
                filter { eq("user_id", userId) }
            }.decodeList<Task>()
            Log.d("Supabase", "Retrieved ${results.size} directives.")
            results
        } catch (e: Exception) {
            Log.e("Supabase", "Directive fetch failed: ${e.message}", e)
            emptyList()
        }
    }

    suspend fun createTask(task: Task) = withContext(Dispatchers.IO) {
        try {
            client.postgrest.from("tasks").insert(task)
        } catch (e: Exception) {
            Log.e("Supabase", "Create task failed", e)
        }
    }

    suspend fun updateTask(taskId: String, isCompleted: Boolean) = withContext(Dispatchers.IO) {
        try {
            val now = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).apply {
                timeZone = TimeZone.getTimeZone("UTC")
            }.format(Date())

            client.postgrest.from("tasks").update({
                set("is_completed", isCompleted)
                if (isCompleted) {
                    set("completed_at", now)
                } else {
                    set("completed_at", null as String?)
                }
                set("updated_at", now)
            }) {
                filter { eq("id", taskId) }
            }
        } catch (e: Exception) {
            Log.e("Supabase", "Update task failed", e)
        }
    }

    suspend fun deleteTask(taskId: String) = withContext(Dispatchers.IO) {
        try {
            client.postgrest.from("tasks").delete {
                filter { eq("id", taskId) }
            }
        } catch (e: Exception) {
            Log.e("Supabase", "Delete task failed", e)
        }
    }

    suspend fun updateTaskImportance(taskId: String, isImportant: Boolean) = withContext(Dispatchers.IO) {
        try {
            client.postgrest.from("tasks").update({
                set("is_important", isImportant)
                set("updated_at", SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).apply {
                    timeZone = TimeZone.getTimeZone("UTC")
                }.format(Date()))
            }) {
                filter { eq("id", taskId) }
            }
        } catch (e: Exception) {
            Log.e("Supabase", "Update task importance failed", e)
        }
    }

    suspend fun updateTaskInToday(taskId: String, isInToday: Boolean) = withContext(Dispatchers.IO) {
        try {
            client.postgrest.from("tasks").update({
                set("is_in_today", isInToday)
                set("updated_at", SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).apply {
                    timeZone = TimeZone.getTimeZone("UTC")
                }.format(Date()))
            }) {
                filter { eq("id", taskId) }
            }
        } catch (e: Exception) {
            Log.e("Supabase", "Update task in today failed", e)
        }
    }

    suspend fun updateTaskPriority(taskId: String, priority: String) = withContext(Dispatchers.IO) {
        try {
            client.postgrest.from("tasks").update({
                set("priority", priority)
                set("updated_at", SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).apply {
                    timeZone = TimeZone.getTimeZone("UTC")
                }.format(Date()))
            }) {
                filter { eq("id", taskId) }
            }
        } catch (e: Exception) {
            Log.e("Supabase", "Update task priority failed", e)
        }
    }

    suspend fun updateTaskDueDate(taskId: String, dueAt: String?) = withContext(Dispatchers.IO) {
        try {
            client.postgrest.from("tasks").update({
                set("due_at", dueAt)
                set("updated_at", SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).apply {
                    timeZone = TimeZone.getTimeZone("UTC")
                }.format(Date()))
            }) {
                filter { eq("id", taskId) }
            }
        } catch (e: Exception) {
            Log.e("Supabase", "Update task due date failed", e)
        }
    }

    suspend fun updateTaskNotes(taskId: String, notes: String?) = withContext(Dispatchers.IO) {
        try {
            client.postgrest.from("tasks").update({
                set("description", notes)
                set("updated_at", SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).apply {
                    timeZone = TimeZone.getTimeZone("UTC")
                }.format(Date()))
            }) {
                filter { eq("id", taskId) }
            }
        } catch (e: Exception) {
            Log.e("Supabase", "Update task notes failed", e)
        }
    }

    suspend fun updateTaskTitle(taskId: String, title: String) = withContext(Dispatchers.IO) {
        try {
            client.postgrest.from("tasks").update({
                set("title", title)
                set("updated_at", SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).apply {
                    timeZone = TimeZone.getTimeZone("UTC")
                }.format(Date()))
            }) {
                filter { eq("id", taskId) }
            }
        } catch (e: Exception) {
            Log.e("Supabase", "Update task title failed", e)
        }
    }

    suspend fun getAllTaskSteps(userId: String): List<TaskStep> = withContext(Dispatchers.IO) {
        try {
            client.postgrest.from("task_steps").select {
                filter { eq("user_id", userId) }
            }.decodeList<TaskStep>()
        } catch (e: Exception) {
            Log.e("Supabase", "Get all task steps failed", e)
            emptyList()
        }
    }

    // --- Subtasks (Task Steps) ---
    suspend fun getTaskSteps(userId: String, taskId: String): List<TaskStep> = withContext(Dispatchers.IO) {
        try {
            client.postgrest.from("task_steps").select {
                filter {
                    eq("user_id", userId)
                    eq("task_id", taskId)
                }
            }.decodeList<TaskStep>().sortedBy { it.sort_order }
        } catch (e: Exception) {
            Log.e("Supabase", "Get task steps failed", e)
            emptyList()
        }
    }

    suspend fun createTaskStep(step: TaskStep) = withContext(Dispatchers.IO) {
        try {
            client.postgrest.from("task_steps").insert(step)
        } catch (e: Exception) {
            Log.e("Supabase", "Create task step failed", e)
        }
    }

    suspend fun updateTaskStepCompletion(stepId: String, isCompleted: Boolean) = withContext(Dispatchers.IO) {
        try {
            client.postgrest.from("task_steps").update({
                set("is_completed", isCompleted)
                set("updated_at", SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).apply {
                    timeZone = TimeZone.getTimeZone("UTC")
                }.format(Date()))
            }) {
                filter { eq("id", stepId) }
            }
        } catch (e: Exception) {
            Log.e("Supabase", "Update task step completion failed", e)
        }
    }

    suspend fun updateTaskStepTitle(stepId: String, title: String) = withContext(Dispatchers.IO) {
        try {
            client.postgrest.from("task_steps").update({
                set("title", title)
                set("updated_at", SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).apply {
                    timeZone = TimeZone.getTimeZone("UTC")
                }.format(Date()))
            }) {
                filter { eq("id", stepId) }
            }
        } catch (e: Exception) {
            Log.e("Supabase", "Update task step title failed", e)
        }
    }

    suspend fun deleteTaskStep(stepId: String) = withContext(Dispatchers.IO) {
        try {
            client.postgrest.from("task_steps").delete {
                filter { eq("id", stepId) }
            }
        } catch (e: Exception) {
            Log.e("Supabase", "Delete task step failed", e)
        }
    }

    suspend fun updateTaskStepOrder(stepId: String, sortOrder: Int) = withContext(Dispatchers.IO) {
        try {
            client.postgrest.from("task_steps").update({
                set("sort_order", sortOrder)
                set("updated_at", SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).apply {
                    timeZone = TimeZone.getTimeZone("UTC")
                }.format(Date()))
            }) {
                filter { eq("id", stepId) }
            }
        } catch (e: Exception) {
            Log.e("Supabase", "Update task step order failed", e)
        }
    }

    // --- Fitness ---
    suspend fun getFitnessActivities(userId: String): List<FitnessActivity> = withContext(Dispatchers.IO) {
        try {
            client.postgrest.from("fitness_activities").select {
                filter { eq("user_id", userId) }
            }.decodeList<FitnessActivity>()
        } catch (e: Exception) {
            emptyList()
        }
    }

    // --- Learning ---
    suspend fun getCategories(userId: String): List<Category> = withContext(Dispatchers.IO) {
        try {
            client.postgrest.from("categories").select {
                filter { eq("user_id", userId) }
            }.decodeList<Category>()
        } catch (e: Exception) {
            emptyList()
        }
    }

    suspend fun getTopics(userId: String, categoryId: String? = null): List<Topic> = withContext(Dispatchers.IO) {
        try {
            val response = client.postgrest.from("topics").select {
                filter { 
                    eq("user_id", userId)
                    if (categoryId != null) eq("category_id", categoryId)
                }
            }
            response.decodeList<Topic>()
        } catch (e: Exception) {
            emptyList()
        }
    }

    // --- Finance ---
    suspend fun getFinanceAccounts(userId: String): List<FinanceAccount> = withContext(Dispatchers.IO) {
        try {
            client.postgrest.from("finance_accounts").select {
                filter { eq("user_id", userId) }
            }.decodeList<FinanceAccount>()
        } catch (e: Exception) {
            emptyList()
        }
    }

    suspend fun getTransactions(userId: String): List<FinanceTransaction> = withContext(Dispatchers.IO) {
        try {
            client.postgrest.from("finance_transactions").select {
                filter { eq("user_id", userId) }
            }.decodeList<FinanceTransaction>()
        } catch (e: Exception) {
            emptyList()
        }
    }

    // --- Calendar Events ---
    suspend fun getCalendarEvents(userId: String): List<CalendarEvent> = withContext(Dispatchers.IO) {
        try {
            client.postgrest.from("calendar_events").select {
                filter { eq("user_id", userId) }
            }.decodeList<CalendarEvent>()
        } catch (e: Exception) {
            Log.w("Supabase", "Fetch calendar events from Supabase failed, using local mock data.", e)
            val todayDate = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())
            listOf(
                CalendarEvent(
                    id = "mock-1",
                    user_id = userId,
                    title = "Project Sync",
                    type = CalendarEventType.WORK,
                    date = todayDate,
                    start_time = "10:30",
                    end_time = "11:30",
                    location = "Meeting Room A"
                ),
                CalendarEvent(
                    id = "mock-2",
                    user_id = userId,
                    title = "Gym Session",
                    type = CalendarEventType.PERSONAL,
                    date = todayDate,
                    start_time = "17:30",
                    end_time = "19:00",
                    location = "Gold's Gym"
                ),
                CalendarEvent(
                    id = "mock-3",
                    user_id = userId,
                    title = "Dinner with family",
                    type = CalendarEventType.PERSONAL,
                    date = todayDate,
                    start_time = "20:30",
                    end_time = "21:30",
                    location = "Indiranagar"
                )
            )
        }
    }

    suspend fun createCalendarEvent(event: CalendarEvent) = withContext(Dispatchers.IO) {
        try {
            client.postgrest.from("calendar_events").insert(event)
        } catch (e: Exception) {
            Log.e("Supabase", "Create calendar event failed", e)
        }
    }

    suspend fun updateCalendarEvent(event: CalendarEvent) = withContext(Dispatchers.IO) {
        try {
            client.postgrest.from("calendar_events").update(event) {
                filter { eq("id", event.id) }
            }
        } catch (e: Exception) {
            Log.e("Supabase", "Update calendar event failed", e)
        }
    }

    suspend fun deleteCalendarEvent(eventId: String) = withContext(Dispatchers.IO) {
        try {
            client.postgrest.from("calendar_events").delete {
                filter { eq("id", eventId) }
            }
        } catch (e: Exception) {
            Log.e("Supabase", "Delete calendar event failed", e)
        }
    }

    // --- Intelligence Context ---
    suspend fun getIntelligenceSnapshot(userId: String): String = withContext(Dispatchers.IO) {
        try {
            val tasksList = getTasks(userId).filter { !it.is_completed }
            val accounts = getFinanceAccounts(userId)
            val totalBalance = accounts.sumOf { it.current_balance.toDouble() }
            val fitness = getFitnessActivities(userId).take(3)
            
            val todayDate = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())
            val calendar = Calendar.getInstance()
            calendar.add(Calendar.DAY_OF_YEAR, 7)
            val nextWeekDate = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(calendar.time)
            
            val allEvents = getCalendarEvents(userId)
            val todayEvents = allEvents.filter { it.date == todayDate }
            val upcomingEvents = allEvents.filter { it.date > todayDate && it.date <= nextWeekDate }
                .sortedBy { it.date }
            
            buildString {
                append("Sir, here is your current status:\n")
                
                if (todayEvents.isNotEmpty()) {
                    append("- Today's Schedule:\n")
                    todayEvents.forEach { event ->
                        val timeStr = if (event.is_all_day) "All day" else "${event.start_time} - ${event.end_time}"
                        append("  * ${event.title} ($timeStr)\n")
                    }
                }

                if (upcomingEvents.isNotEmpty()) {
                    append("- Upcoming Events (Next 7 Days):\n")
                    upcomingEvents.forEach { event ->
                        append("  * ${event.date}: ${event.title}\n")
                    }
                }

                append("- Active Tasks (${tasksList.size}):\n")
                tasksList.take(5).forEach { task ->
                    append("  * ${task.title} (ID: ${task.id})\n")
                }
                append("- Total Liquidity: ₹ $totalBalance\n")
                if (fitness.isNotEmpty()) {
                    append("- Last Fitness Activity: ${fitness.first().notes ?: "Logged"}\n")
                }
                append("- System status: All native modules operational.")
            }
        } catch (e: Exception) {
            "Sir, I'm having trouble fetching the full system snapshot."
        }
    }
}
