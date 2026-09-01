package com.example.lifeos.data

import com.example.lifeos.data.models.*
import com.example.lifeos.ui.utils.CalendarUtils
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.gotrue.auth
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
        val app = try { com.example.lifeos.LifeOSApplication.instance } catch (_: Exception) { null }
        Log.d("Supabase", "getCalendarEvents: Fetching for user=$userId")
        try {
            val remote = client.postgrest.from("calendar_events").select {
                filter { eq("user_id", userId) }
            }.decodeList<CalendarEvent>()
            
            Log.d("Supabase", "getCalendarEvents: Remote returned ${remote.size} events")
            
            if (remote.isNotEmpty() && app != null) {
                LocalCalendarStore.saveEvents(app, remote)
            }
            if (remote.isNotEmpty()) {
                remote 
            } else {
                val local = if (app != null) LocalCalendarStore.getEvents(app, userId) else emptyList()
                Log.d("Supabase", "getCalendarEvents: Using local storage, found ${local.size} events")
                local
            }
        } catch (e: Exception) {
            Log.e("Supabase", "Fetch calendar events from Supabase failed", e)
            val local = if (app != null) LocalCalendarStore.getEvents(app, userId) else emptyList()
            Log.d("Supabase", "getCalendarEvents: Error fallback to local, found ${local.size} events")
            local
        }
    }

    suspend fun createCalendarEvent(event: CalendarEvent) = withContext(Dispatchers.IO) {
        val app = try { com.example.lifeos.LifeOSApplication.instance } catch (_: Exception) { null }
        if (app != null) {
            LocalCalendarStore.addOrUpdateEvent(app, event)
        }
        try {
            client.postgrest.from("calendar_events").insert(event)
        } catch (e: Exception) {
            Log.e("Supabase", "Create calendar event in remote failed", e)
        }
    }

    suspend fun updateCalendarEvent(event: CalendarEvent) = withContext(Dispatchers.IO) {
        val app = try { com.example.lifeos.LifeOSApplication.instance } catch (_: Exception) { null }
        if (app != null) {
            LocalCalendarStore.addOrUpdateEvent(app, event)
        }
        try {
            client.postgrest.from("calendar_events").update(event) {
                filter { eq("id", event.id) }
            }
        } catch (e: Exception) {
            Log.e("Supabase", "Update calendar event in remote failed", e)
        }
    }

    suspend fun deleteCalendarEvent(eventId: String, userId: String = "") = withContext(Dispatchers.IO) {
        val app = try { com.example.lifeos.LifeOSApplication.instance } catch (_: Exception) { null }
        if (app != null) {
            val uid = if (userId.isNotBlank()) userId else (client.auth.currentUserOrNull()?.id ?: "")
            LocalCalendarStore.deleteEvent(app, uid, eventId)
        }
        try {
            client.postgrest.from("calendar_events").delete {
                filter { eq("id", eventId) }
            }
        } catch (e: Exception) {
            Log.e("Supabase", "Delete calendar event in remote failed", e)
        }
    }

    suspend fun seedRequestedMeetings(userId: String) = withContext(Dispatchers.IO) {
        Log.d("Supabase", "seedRequestedMeetings: Starting seeding for user=$userId")
        val meetings = listOf(
            // 1. Every Monday I have stand up meeting from 3:30 PM to 4:30 PM
            CalendarEvent(
                id = UUID.randomUUID().toString(),
                user_id = userId,
                title = "Stand up Meeting",
                type = CalendarEventType.MEETING,
                date = "2026-08-31",
                start_time = "15:30",
                end_time = "16:30",
                recurrence = RecurrenceType.WEEKLY,
                location = "Online"
            ),
            // 2. Every Tuesday 7:30 AM to 8:15 Am I have Experience Surface Pod weekly sync meeting -1
            CalendarEvent(
                id = UUID.randomUUID().toString(),
                user_id = userId,
                title = "Experience Surface Pod weekly sync meeting -1",
                type = CalendarEventType.MEETING,
                date = "2026-09-01",
                start_time = "07:30",
                end_time = "08:15",
                recurrence = RecurrenceType.WEEKLY,
                location = "Online"
            ),
            // 3. Every Wednesday from 11:30 AM to 12:30 PM stand up meeting
            CalendarEvent(
                id = UUID.randomUUID().toString(),
                user_id = userId,
                title = "Stand up Meeting",
                type = CalendarEventType.MEETING,
                date = "2026-09-02",
                start_time = "11:30",
                end_time = "12:30",
                recurrence = RecurrenceType.WEEKLY,
                location = "Online"
            ),
            // 3. Wednesday 7:00 PM to 7:30PM Experience Surface Pod weekly sync meeting 2
            CalendarEvent(
                id = UUID.randomUUID().toString(),
                user_id = userId,
                title = "Experience Surface Pod weekly sync meeting 2",
                type = CalendarEventType.MEETING,
                date = "2026-09-02",
                start_time = "19:00",
                end_time = "19:30",
                recurrence = RecurrenceType.WEEKLY,
                location = "Online"
            ),
            // 4. Thursday stand up from 2:30 to 3:30PM
            CalendarEvent(
                id = UUID.randomUUID().toString(),
                user_id = userId,
                title = "Stand up Meeting",
                type = CalendarEventType.MEETING,
                date = "2026-09-03",
                start_time = "14:30",
                end_time = "15:30",
                recurrence = RecurrenceType.WEEKLY,
                location = "Online"
            ),
            // 4. Friday stand up from 2:30 to 3:30PM
            CalendarEvent(
                id = UUID.randomUUID().toString(),
                user_id = userId,
                title = "Stand up Meeting",
                type = CalendarEventType.MEETING,
                date = "2026-09-04",
                start_time = "14:30",
                end_time = "15:30",
                recurrence = RecurrenceType.WEEKLY,
                location = "Online"
            )
        )
        
        try {
            client.postgrest.from("calendar_events").insert(meetings)
            Log.d("Supabase", "Successfully seeded requested recurring meetings.")
        } catch (e: Exception) {
            Log.e("Supabase", "Failed to seed requested meetings", e)
        }
    }

    // --- Intelligence Context ---
    suspend fun getIntelligenceSnapshot(userId: String): String = withContext(Dispatchers.IO) {
        try {
            val tasksList = getTasks(userId).filter { !it.is_completed }
            val accounts = getFinanceAccounts(userId)
            val totalBalance = accounts.sumOf { it.current_balance.toDouble() }
            val fitness = getFitnessActivities(userId).take(3)
            
            val allEvents = getCalendarEvents(userId)
            val todayEvents = CalendarUtils.expandEventsForDate(allEvents, Calendar.getInstance())
            
            val next7DaysEvents = mutableListOf<CalendarEvent>()
            val tempCal = Calendar.getInstance()
            repeat(7) {
                tempCal.add(Calendar.DAY_OF_YEAR, 1)
                next7DaysEvents.addAll(CalendarUtils.expandEventsForDate(allEvents, tempCal))
            }
            
            buildString {
                append("Sir, here is your current status:\n")
                
                if (todayEvents.isNotEmpty()) {
                    append("- Today's Schedule:\n")
                    todayEvents.forEach { event ->
                        val timeStr = if (event.is_all_day) "All day" else "${event.start_time} - ${event.end_time}"
                        append("  * ${event.title} ($timeStr)\n")
                    }
                }

                if (next7DaysEvents.isNotEmpty()) {
                    append("- Upcoming Events (Next 7 Days):\n")
                    next7DaysEvents.forEach { event ->
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

    // ==========================================
    // HEALTH & FITNESS FOUNDATION API
    // ==========================================

    // --- Daily Activity ---
    suspend fun getDailyActivity(userId: String, date: String): DailyActivity? = withContext(Dispatchers.IO) {
        try {
            client.postgrest.from("daily_activity").select {
                filter {
                    eq("user_id", userId)
                    eq("date", date)
                }
            }.decodeSingleOrNull<DailyActivity>()
        } catch (e: Exception) {
            Log.e("Supabase", "Failed to fetch daily activity for $date", e)
            null
        }
    }

    suspend fun getActivityHistory(userId: String, limit: Int = 30): List<DailyActivity> = withContext(Dispatchers.IO) {
        try {
            client.postgrest.from("daily_activity").select {
                filter { eq("user_id", userId) }
            }.decodeList<DailyActivity>().sortedByDescending { it.date }.take(limit)
        } catch (e: Exception) {
            Log.e("Supabase", "Failed to fetch activity history", e)
            emptyList()
        }
    }

    suspend fun upsertDailyActivity(activity: DailyActivity) = withContext(Dispatchers.IO) {
        try {
            client.postgrest.from("daily_activity").upsert(activity)
        } catch (e: Exception) {
            Log.e("Supabase", "Failed to upsert daily activity", e)
        }
    }

    // --- Workouts ---
    suspend fun getRecentWorkouts(userId: String, limit: Int = 10): List<WorkoutRecord> = withContext(Dispatchers.IO) {
        try {
            client.postgrest.from("workouts").select {
                filter { eq("user_id", userId) }
            }.decodeList<WorkoutRecord>().sortedByDescending { it.start_time }.take(limit)
        } catch (e: Exception) {
            Log.e("Supabase", "Failed to fetch recent workouts", e)
            emptyList()
        }
    }

    suspend fun upsertWorkout(workout: WorkoutRecord) = withContext(Dispatchers.IO) {
        try {
            client.postgrest.from("workouts").upsert(workout)
        } catch (e: Exception) {
            Log.e("Supabase", "Failed to upsert workout", e)
        }
    }

    // --- Health Vitals ---
    suspend fun getLatestVitals(userId: String): List<HealthVitalRecord> = withContext(Dispatchers.IO) {
        try {
            client.postgrest.from("health_vitals").select {
                filter { eq("user_id", userId) }
            }.decodeList<HealthVitalRecord>().sortedByDescending { it.recorded_at }
        } catch (e: Exception) {
            Log.e("Supabase", "Failed to fetch vitals", e)
            emptyList()
        }
    }

    suspend fun insertHealthVital(vital: HealthVitalRecord) = withContext(Dispatchers.IO) {
        try {
            client.postgrest.from("health_vitals").insert(vital)
        } catch (e: Exception) {
            Log.e("Supabase", "Failed to insert health vital", e)
        }
    }

    // --- Sleep Sessions ---
    suspend fun getSleepSessionForDate(userId: String, date: String): SleepSessionRecord? = withContext(Dispatchers.IO) {
        try {
            val sessions = client.postgrest.from("sleep_sessions").select {
                filter { eq("user_id", userId) }
            }.decodeList<SleepSessionRecord>()
            sessions.firstOrNull { it.start_time.startsWith(date) || it.end_time.startsWith(date) }
        } catch (e: Exception) {
            Log.e("Supabase", "Failed to fetch sleep session for $date", e)
            null
        }
    }

    suspend fun upsertSleepSession(session: SleepSessionRecord) = withContext(Dispatchers.IO) {
        try {
            client.postgrest.from("sleep_sessions").upsert(session)
        } catch (e: Exception) {
            Log.e("Supabase", "Failed to upsert sleep session", e)
        }
    }

    // --- Body Metrics ---
    suspend fun getBodyMetrics(userId: String): List<BodyMetricRecord> = withContext(Dispatchers.IO) {
        try {
            client.postgrest.from("body_metrics").select {
                filter { eq("user_id", userId) }
            }.decodeList<BodyMetricRecord>().sortedByDescending { it.recorded_at }
        } catch (e: Exception) {
            Log.e("Supabase", "Failed to fetch body metrics", e)
            emptyList()
        }
    }

    suspend fun insertBodyMetric(metric: BodyMetricRecord) = withContext(Dispatchers.IO) {
        try {
            client.postgrest.from("body_metrics").insert(metric)
        } catch (e: Exception) {
            Log.e("Supabase", "Failed to insert body metric", e)
        }
    }
}
