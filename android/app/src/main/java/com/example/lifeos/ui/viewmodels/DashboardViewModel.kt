package com.example.lifeos.ui.viewmodels

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.lifeos.data.SupabaseProvider
import com.example.lifeos.data.SupabaseRepository
import com.example.lifeos.data.models.Task
import com.example.lifeos.data.models.FitnessActivity
import com.example.lifeos.data.models.Category
import com.example.lifeos.data.models.Topic
import com.example.lifeos.data.models.FinanceAccount
import com.example.lifeos.data.models.FinanceTransaction
import com.example.lifeos.data.models.ActivityType
import com.example.lifeos.data.models.CalendarEvent
import com.example.lifeos.ui.utils.CalendarUtils
import io.github.jan.supabase.gotrue.auth
import io.github.jan.supabase.gotrue.SessionStatus
import io.github.jan.supabase.postgrest.postgrest
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.*

class DashboardViewModel(application: Application) : AndroidViewModel(application) {
    private val repository = SupabaseRepository()
    private val client = SupabaseProvider.client

    private val _tasks = MutableStateFlow<List<Task>>(emptyList())
    val tasks: StateFlow<List<Task>> = _tasks.asStateFlow()

    private val _fitnessActivities = MutableStateFlow<List<FitnessActivity>>(emptyList())
    val fitnessActivities: StateFlow<List<FitnessActivity>> = _fitnessActivities.asStateFlow()

    private val _learningCategories = MutableStateFlow<List<Category>>(emptyList())
    val learningCategories: StateFlow<List<Category>> = _learningCategories.asStateFlow()

    private val _learningTopics = MutableStateFlow<List<Topic>>(emptyList())
    val learningTopics: StateFlow<List<Topic>> = _learningTopics.asStateFlow()

    private val _financeAccounts = MutableStateFlow<List<FinanceAccount>>(emptyList())
    val financeAccounts: StateFlow<List<FinanceAccount>> = _financeAccounts.asStateFlow()

    private val _financeTransactions = MutableStateFlow<List<FinanceTransaction>>(emptyList())
    val financeTransactions: StateFlow<List<FinanceTransaction>> = _financeTransactions.asStateFlow()

    private val _calendarEvents = MutableStateFlow<List<CalendarEvent>>(emptyList())
    val calendarEvents: StateFlow<List<CalendarEvent>> = _calendarEvents.asStateFlow()

    private val _jarvisInsight = MutableStateFlow("Initializing neural link...")
    val jarvisInsight: StateFlow<String> = _jarvisInsight.asStateFlow()

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
                    _learningCategories.value = emptyList()
                    _learningTopics.value = emptyList()
                    _financeAccounts.value = emptyList()
                    _financeTransactions.value = emptyList()
                    _calendarEvents.value = emptyList()
                }
            }
        }
    }

    private fun startClock() {
        viewModelScope.launch {
            while (true) {
                val now = java.util.Calendar.getInstance().time
                val sdfTime = SimpleDateFormat("hh:mm a z", Locale.getDefault())
                _currentTime.value = sdfTime.format(now).uppercase()
                val sdfDate = SimpleDateFormat("EEEE, d MMMM yyyy", Locale.getDefault())
                _currentDate.value = sdfDate.format(now)
                delay(1000)
            }
        }
    }

    fun refresh() {
        if (_isLoading.value) return // Prevent duplicate refreshes
        
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
                // Check and seed mock data if empty
                seedMockDataIfEmpty(user.id)

                // Parallelize all network requests to load dashboard in sub-second time
                val tDeferred = async(Dispatchers.IO) { repository.getTasks(user.id) }
                val fDeferred = async(Dispatchers.IO) { repository.getFitnessActivities(user.id) }
                val lcDeferred = async(Dispatchers.IO) { repository.getCategories(user.id) }
                val ltDeferred = async(Dispatchers.IO) { repository.getTopics(user.id) }
                val faDeferred = async(Dispatchers.IO) { repository.getFinanceAccounts(user.id) }
                val ftDeferred = async(Dispatchers.IO) { repository.getTransactions(user.id) }
                val ceDeferred = async(Dispatchers.IO) { repository.getCalendarEvents(user.id) }

                val t = tDeferred.await()
                val f = fDeferred.await()
                val lc = lcDeferred.await()
                val lt = ltDeferred.await()
                val fa = faDeferred.await()
                val ft = ftDeferred.await()
                val ce = ceDeferred.await()

                if (ce.isEmpty()) {
                    android.util.Log.d("Dashboard", "No calendar events found, using offline fallback.")
                }

                android.util.Log.d("Dashboard", "Retrieved in parallel: ${t.size} tasks, ${f.size} activities, ${lc.size} categories, ${lt.size} topics, ${fa.size} accounts, ${ft.size} transactions, ${ce.size} events.")

                val todayEvents = CalendarUtils.expandEventsForDate(ce, Calendar.getInstance())

                _tasks.value = t
                _fitnessActivities.value = f
                _learningCategories.value = lc
                _learningTopics.value = lt
                _financeAccounts.value = fa
                _financeTransactions.value = ft
                _calendarEvents.value = todayEvents

                // Generate dynamic insight
                _jarvisInsight.value = repository.getIntelligenceSnapshot(user.id)

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

    private suspend fun seedMockDataIfEmpty(userId: String) {
        val tasks = repository.getTasks(userId)
        if (tasks.isEmpty()) {
            android.util.Log.d("Seeding", "Tasks table empty, seeding mock tasks...")
            val defaultTasks = listOf(
                Task(
                    id = UUID.randomUUID().toString(),
                    user_id = userId,
                    workspace = "work",
                    title = "Review PR #245",
                    is_completed = false,
                    is_in_today = true,
                    priority = "high"
                ),
                Task(
                    id = UUID.randomUUID().toString(),
                    user_id = userId,
                    workspace = "work",
                    title = "Update documentation",
                    is_completed = false,
                    is_in_today = true,
                    priority = "medium"
                ),
                Task(
                    id = UUID.randomUUID().toString(),
                    user_id = userId,
                    workspace = "work",
                    title = "Fix login flow issue",
                    is_completed = true,
                    is_in_today = true,
                    priority = "high",
                    completed_at = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).apply {
                        timeZone = TimeZone.getTimeZone("UTC")
                    }.format(Date())
                ),
                Task(
                    id = UUID.randomUUID().toString(),
                    user_id = userId,
                    workspace = "work",
                    title = "Prepare for team review",
                    is_completed = false,
                    is_in_today = true,
                    priority = "medium"
                ),
                Task(
                    id = UUID.randomUUID().toString(),
                    user_id = userId,
                    workspace = "personal",
                    title = "Reply to client email",
                    is_completed = false,
                    is_in_today = true,
                    priority = "low"
                )
            )
            for (t in defaultTasks) {
                repository.createTask(t)
            }
        }

        val categories = repository.getCategories(userId)
        if (categories.isEmpty()) {
            android.util.Log.d("Seeding", "Categories empty, seeding mock syllabus...")
            val cat1Id = UUID.randomUUID().toString()
            val cat2Id = UUID.randomUUID().toString()
            val categoriesToInsert = listOf(
                Category(id = cat1Id, user_id = userId, name = "Kotlin", description = "Kotlin Learning Syllabus", icon = "Code2", sort_order = 0),
                Category(id = cat2Id, user_id = userId, name = "System Design", description = "High level architecture", icon = "BookOpen", sort_order = 1)
            )
            val topicsToInsert = listOf(
                Topic(id = UUID.randomUUID().toString(), category_id = cat1Id, user_id = userId, title = "Kotlin Coroutines", description = "45 min", notes = "Progress: 60%", is_completed = false),
                Topic(id = UUID.randomUUID().toString(), category_id = cat2Id, user_id = userId, title = "System Design Basics", description = "60 min", notes = "Progress: 0%", is_completed = false)
            )
            withContext(Dispatchers.IO) {
                try {
                    client.postgrest.from("categories").insert(categoriesToInsert)
                    client.postgrest.from("topics").insert(topicsToInsert)
                } catch (e: Exception) {
                    android.util.Log.e("Seeding", "Learning seed failed", e)
                }
            }
        }

        val accounts = repository.getFinanceAccounts(userId)
        if (accounts.isEmpty()) {
            android.util.Log.d("Seeding", "Finance accounts empty, seeding mock finance data...")
            val accountId = UUID.randomUUID().toString()
            val account = FinanceAccount(
                id = accountId,
                user_id = userId,
                name = "Main Wallet",
                type = "wallet",
                opening_balance = 8800f,
                current_balance = 8800f,
                currency = "INR",
                is_active = true
            )
            val transactions = listOf(
                FinanceTransaction(
                    id = UUID.randomUUID().toString(),
                    user_id = userId,
                    account_id = accountId,
                    type = "income",
                    amount = 2450f,
                    currency = "INR",
                    merchant = "Freelance",
                    transaction_date = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).apply {
                        timeZone = TimeZone.getTimeZone("UTC")
                    }.format(Date())
                ),
                FinanceTransaction(
                    id = UUID.randomUUID().toString(),
                    user_id = userId,
                    account_id = accountId,
                    type = "expense",
                    amount = 1200f,
                    currency = "INR",
                    merchant = "Grocery Store",
                    transaction_date = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).apply {
                        timeZone = TimeZone.getTimeZone("UTC")
                    }.format(Date())
                )
            )
            withContext(Dispatchers.IO) {
                try {
                    client.postgrest.from("finance_accounts").insert(account)
                    client.postgrest.from("finance_transactions").insert(transactions)
                } catch (e: Exception) {
                    android.util.Log.e("Seeding", "Finance seed failed", e)
                }
            }
        }

        val fitnessActivities = repository.getFitnessActivities(userId)
        if (fitnessActivities.isEmpty()) {
            android.util.Log.d("Seeding", "Fitness activities empty, seeding mock logs...")
            val defaultActivityTypeId = withContext(Dispatchers.IO) {
                try {
                    val types = client.postgrest.from("activity_types").select().decodeList<ActivityType>()
                    types.find { it.slug == "strength_training" }?.id ?: types.firstOrNull()?.id
                } catch (e: Exception) {
                    null
                }
            }
            if (defaultActivityTypeId != null) {
                val now = Date()
                val oneDayMs = 24 * 60 * 60 * 1000L
                val activities = listOf(
                    FitnessActivity(
                        id = UUID.randomUUID().toString(),
                        user_id = userId,
                        activity_type_id = defaultActivityTypeId,
                        started_at = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).apply {
                            timeZone = TimeZone.getTimeZone("UTC")
                        }.format(Date(now.time - 2 * oneDayMs)),
                        ended_at = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).apply {
                            timeZone = TimeZone.getTimeZone("UTC")
                        }.format(Date(now.time - 2 * oneDayMs + 45 * 60 * 1000L)),
                        duration_minutes = 45,
                        notes = "Upper Body Workout"
                    ),
                    FitnessActivity(
                        id = UUID.randomUUID().toString(),
                        user_id = userId,
                        activity_type_id = defaultActivityTypeId,
                        started_at = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).apply {
                            timeZone = TimeZone.getTimeZone("UTC")
                        }.format(Date(now.time - oneDayMs)),
                        ended_at = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).apply {
                            timeZone = TimeZone.getTimeZone("UTC")
                        }.format(Date(now.time - oneDayMs + 30 * 60 * 1000L)),
                        duration_minutes = 30,
                        notes = "Cardio Session"
                    ),
                    FitnessActivity(
                        id = UUID.randomUUID().toString(),
                        user_id = userId,
                        activity_type_id = defaultActivityTypeId,
                        started_at = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).apply {
                            timeZone = TimeZone.getTimeZone("UTC")
                        }.format(now),
                        ended_at = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).apply {
                            timeZone = TimeZone.getTimeZone("UTC")
                        }.format(Date(now.time + 45 * 60 * 1000L)),
                        duration_minutes = 45,
                        notes = "Leg Day Workout"
                    )
                )
                withContext(Dispatchers.IO) {
                    try {
                        client.postgrest.from("fitness_activities").insert(activities)
                    } catch (e: Exception) {
                        android.util.Log.e("Seeding", "Fitness seed failed", e)
                    }
                }
            }
        }
    }
}

