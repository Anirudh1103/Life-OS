package com.example.lifeos.ui.viewmodels

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.lifeos.data.FitnessRepository
import com.example.lifeos.data.NutritionRepository
import com.example.lifeos.data.models.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

enum class FitnessTab {
    OVERVIEW,
    WORKOUT,
    NUTRITION,
    BODY,
    PROGRESS
}

sealed class JarvisFoodLoggingState {
    object Idle : JarvisFoodLoggingState()
    object Understanding : JarvisFoodLoggingState() // "Understanding meal..."
    object Calculating : JarvisFoodLoggingState()   // "Calculating nutrition..."
    object Logging : JarvisFoodLoggingState()       // "Logging meal..."
    data class Success(val meal: Meal) : JarvisFoodLoggingState() // "Meal logged ✓"
    data class Error(val message: String) : JarvisFoodLoggingState()
}

class FitnessViewModel(application: Application) : AndroidViewModel(application) {

    private val nutritionRepo = NutritionRepository(application)
    private val fitnessRepo = FitnessRepository(application)

    // Current Active Tab
    private val _activeTab = MutableStateFlow(FitnessTab.OVERVIEW)
    val activeTab: StateFlow<FitnessTab> = _activeTab.asStateFlow()

    // Nutrition Sub-Tab (Today, Trends, Nutrients, History)
    private val _nutritionSubTab = MutableStateFlow("Today")
    val nutritionSubTab: StateFlow<String> = _nutritionSubTab.asStateFlow()

    // Date Navigation
    private val _selectedDate = MutableStateFlow(Calendar.getInstance())
    private val _dateDisplayString = MutableStateFlow("1 Sep 2025")
    val dateDisplayString: StateFlow<String> = _dateDisplayString.asStateFlow()

    // Health & Fitness Data Streams
    val activityState: StateFlow<HealthUiState<DailyActivity>> = fitnessRepo.activityState
    val workoutsState: StateFlow<HealthUiState<List<WorkoutRecord>>> = fitnessRepo.workoutsState
    val vitalsState: StateFlow<HealthUiState<VitalsDisplaySummary>> = fitnessRepo.vitalsState
    val sleepState: StateFlow<HealthUiState<SleepDisplaySummary>> = fitnessRepo.sleepState
    val bodyState: StateFlow<HealthUiState<BodyDisplaySummary>> = fitnessRepo.bodyState
    val progressState: StateFlow<HealthUiState<ProgressSummaryMetrics>> = fitnessRepo.progressState
    val currentWorkout: StateFlow<WorkoutSessionDetail> = fitnessRepo.currentWorkout

    // LifeOS Nutrition Stream (Separately Owned)
    val dailyNutrition: StateFlow<DailyNutritionTotals> = nutritionRepo.dailyNutrition

    // Jarvis Food Logging State
    private val _jarvisLoggingState = MutableStateFlow<JarvisFoodLoggingState>(JarvisFoodLoggingState.Idle)
    val jarvisLoggingState: StateFlow<JarvisFoodLoggingState> = _jarvisLoggingState.asStateFlow()

    // Dialog & Sheet Visibility
    private val _showFoodLoggingSheet = MutableStateFlow(false)
    val showFoodLoggingSheet: StateFlow<Boolean> = _showFoodLoggingSheet.asStateFlow()

    private val _selectedMealForDetails = MutableStateFlow<Meal?>(null)
    val selectedMealForDetails: StateFlow<Meal?> = _selectedMealForDetails.asStateFlow()

    private val _showAllMicronutrients = MutableStateFlow(false)
    val showAllMicronutrients: StateFlow<Boolean> = _showAllMicronutrients.asStateFlow()

    init {
        updateDateAndFetch()
    }

    fun setActiveTab(tab: FitnessTab) {
        _activeTab.value = tab
    }

    fun setNutritionSubTab(subTab: String) {
        _nutritionSubTab.value = subTab
    }

    fun nextDay() {
        _selectedDate.value.add(Calendar.DAY_OF_YEAR, 1)
        updateDateAndFetch()
    }

    fun prevDay() {
        _selectedDate.value.add(Calendar.DAY_OF_YEAR, -1)
        updateDateAndFetch()
    }

    private fun updateDateAndFetch() {
        val displaySdf = SimpleDateFormat("d MMM yyyy", Locale.getDefault())
        _dateDisplayString.value = displaySdf.format(_selectedDate.value.time)

        val querySdf = SimpleDateFormat("yyyy-MM-dd", Locale.US)
        val queryDateStr = querySdf.format(_selectedDate.value.time)

        viewModelScope.launch {
            fitnessRepo.loadFitnessDataForDate(queryDateStr)
        }
    }

    fun seedDevData() {
        viewModelScope.launch {
            fitnessRepo.seedDevTestData()
        }
    }

    fun openFoodLoggingSheet() {
        _jarvisLoggingState.value = JarvisFoodLoggingState.Idle
        _showFoodLoggingSheet.value = true
    }

    fun closeFoodLoggingSheet() {
        _showFoodLoggingSheet.value = false
        _jarvisLoggingState.value = JarvisFoodLoggingState.Idle
    }

    fun openMealDetails(meal: Meal) {
        _selectedMealForDetails.value = meal
    }

    fun closeMealDetails() {
        _selectedMealForDetails.value = null
    }

    fun openAllMicronutrients() {
        _showAllMicronutrients.value = true
    }

    fun closeAllMicronutrients() {
        _showAllMicronutrients.value = false
    }

    /**
     * Natural Language Meal Logging with Animated Processing Sequence
     */
    fun logFoodWithJarvis(prompt: String) {
        if (prompt.isBlank()) return

        viewModelScope.launch {
            try {
                // Step 1: Understanding meal...
                _jarvisLoggingState.value = JarvisFoodLoggingState.Understanding
                delay(650)

                // Step 2: Calculating nutrition...
                _jarvisLoggingState.value = JarvisFoodLoggingState.Calculating
                delay(750)

                // Step 3: Logging meal...
                _jarvisLoggingState.value = JarvisFoodLoggingState.Logging
                val newMeal = nutritionRepo.parseAndLogMealWithJarvis(prompt)
                delay(500)

                // Step 4: Success!
                _jarvisLoggingState.value = JarvisFoodLoggingState.Success(newMeal)
                delay(1200)

                _showFoodLoggingSheet.value = false
                _jarvisLoggingState.value = JarvisFoodLoggingState.Idle
            } catch (e: Exception) {
                _jarvisLoggingState.value = JarvisFoodLoggingState.Error("Jarvis couldn't process that meal. Tap retry.")
            }
        }
    }

    fun removeMeal(mealId: String) {
        viewModelScope.launch {
            nutritionRepo.removeMeal(mealId)
            if (_selectedMealForDetails.value?.id == mealId) {
                _selectedMealForDetails.value = null
            }
        }
    }

    fun addWorkoutSet(weightKg: Float, reps: Int) {
        viewModelScope.launch {
            fitnessRepo.addWorkoutSet(weightKg, reps)
        }
    }

    fun recordWeight(weightKg: Float, bodyFatPct: Float? = null) {
        viewModelScope.launch {
            fitnessRepo.recordWeight(weightKg, bodyFatPct)
        }
    }
}
