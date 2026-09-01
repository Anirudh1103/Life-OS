package com.example.lifeos.ui.fitness

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.lifeos.data.models.*
import com.example.lifeos.ui.fitness.components.*
import com.example.lifeos.ui.viewmodels.FitnessTab
import com.example.lifeos.ui.viewmodels.FitnessViewModel

@Composable
fun FitnessScreen(
    modifier: Modifier = Modifier,
    viewModel: FitnessViewModel = viewModel()
) {
    val activeTab by viewModel.activeTab.collectAsStateWithLifecycle()
    val nutritionSubTab by viewModel.nutritionSubTab.collectAsStateWithLifecycle()
    val dateString by viewModel.dateDisplayString.collectAsStateWithLifecycle()

    // Real Health & Fitness Streams
    val activityState by viewModel.activityState.collectAsStateWithLifecycle()
    val workoutsState by viewModel.workoutsState.collectAsStateWithLifecycle()
    val vitalsState by viewModel.vitalsState.collectAsStateWithLifecycle()
    val sleepState by viewModel.sleepState.collectAsStateWithLifecycle()
    val bodyState by viewModel.bodyState.collectAsStateWithLifecycle()
    val progressState by viewModel.progressState.collectAsStateWithLifecycle()
    val currentWorkout by viewModel.currentWorkout.collectAsStateWithLifecycle()

    // LifeOS Nutrition Stream
    val dailyNutrition by viewModel.dailyNutrition.collectAsStateWithLifecycle()

    // Dialogs & Sheets
    val showFoodLoggingSheet by viewModel.showFoodLoggingSheet.collectAsStateWithLifecycle()
    val jarvisLoggingState by viewModel.jarvisLoggingState.collectAsStateWithLifecycle()
    val selectedMealForDetails by viewModel.selectedMealForDetails.collectAsStateWithLifecycle()
    val showAllMicronutrients by viewModel.showAllMicronutrients.collectAsStateWithLifecycle()

    BoxWithConstraints(
        modifier = modifier
            .fillMaxSize()
            .background(FitnessBg)
    ) {
        val isLandscapeTablet = maxWidth >= 840.dp

        Column(modifier = Modifier.fillMaxSize()) {
            // Top Header: Greeting, Date, and Jarvis Search Bar
            FitnessHeader(
                dateString = dateString,
                onPrevDate = { viewModel.prevDay() },
                onNextDate = { viewModel.nextDay() },
                onOpenJarvisFoodLogging = { viewModel.openFoodLoggingSheet() }
            )

            // Main Dual-Pane (Landscape Tablet) or Single Column (Portrait)
            Box(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
                    .padding(horizontal = 24.dp, vertical = 6.dp)
            ) {
                if (isLandscapeTablet) {
                    // DUAL-PANE LANDSCAPE / TABLET LAYOUT (Matching Reference Asset)
                    Row(
                        modifier = Modifier.fillMaxSize(),
                        horizontalArrangement = Arrangement.spacedBy(20.dp)
                    ) {
                        // Left Column: Fitness Command Center (Scrollable if needed on smaller tablets)
                        Column(
                            modifier = Modifier
                                .weight(1.15f)
                                .fillMaxHeight()
                                .verticalScroll(rememberScrollState()),
                            verticalArrangement = Arrangement.spacedBy(14.dp)
                        ) {
                            // Row 1: Activity Ring Card + Workout Card
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(14.dp)
                            ) {
                                ActivityCard(
                                    state = activityState,
                                    modifier = Modifier.weight(1f)
                                )
                                WorkoutCard(
                                    state = workoutsState,
                                    onStartWorkout = { viewModel.setActiveTab(FitnessTab.WORKOUT) },
                                    modifier = Modifier.weight(1f)
                                )
                            }

                            // Row 2: Dedicated LifeOS Nutrition Overview Card (Separate from Apple Health)
                            NutritionOverviewCard(
                                totals = dailyNutrition,
                                onOpenDetails = { viewModel.setActiveTab(FitnessTab.NUTRITION) },
                                modifier = Modifier.fillMaxWidth()
                            )

                            // Row 3: Heart & Vitals Card + Sleep & Recovery Card
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(14.dp)
                            ) {
                                HeartVitalsCard(
                                    state = vitalsState,
                                    modifier = Modifier.weight(1f)
                                )
                                SleepCard(
                                    state = sleepState,
                                    modifier = Modifier.weight(1f)
                                )
                            }

                            // Row 4: Body Card + Progress Card
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(14.dp)
                            ) {
                                BodyOverviewCard(
                                    state = bodyState,
                                    modifier = Modifier.weight(1f)
                                )
                                ProgressOverviewCard(
                                    state = progressState,
                                    modifier = Modifier.weight(1f)
                                )
                            }

                            // Quick Actions Row
                            QuickActionsRow(
                                onLogWorkout = { viewModel.setActiveTab(FitnessTab.WORKOUT) },
                                onLogFood = { viewModel.openFoodLoggingSheet() },
                                onTrackBody = { viewModel.setActiveTab(FitnessTab.BODY) },
                                onViewProgress = { viewModel.setActiveTab(FitnessTab.PROGRESS) },
                                onSeedDevData = { viewModel.seedDevData() },
                                modifier = Modifier.fillMaxWidth()
                            )

                            Spacer(Modifier.height(10.dp))
                        }

                        // Right Column: Dedicated Interactive Section / Detail Pane
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .fillMaxHeight()
                        ) {
                            when (activeTab) {
                                FitnessTab.OVERVIEW, FitnessTab.NUTRITION -> {
                                    NutritionDetailPane(
                                        totals = dailyNutrition,
                                        subTab = nutritionSubTab,
                                        dateString = dateString,
                                        onSubTabSelected = { viewModel.setNutritionSubTab(it) },
                                        onPrevDate = { viewModel.prevDay() },
                                        onNextDate = { viewModel.nextDay() },
                                        onOpenMealDetails = { viewModel.openMealDetails(it) },
                                        onOpenAllMicros = { viewModel.openAllMicronutrients() },
                                        onLogFoodWithJarvis = { viewModel.openFoodLoggingSheet() }
                                    )
                                }
                                FitnessTab.WORKOUT -> {
                                    WorkoutDetailPane(
                                        workout = currentWorkout,
                                        onAddSet = { w, r -> viewModel.addWorkoutSet(w, r) }
                                    )
                                }
                                FitnessTab.BODY -> {
                                    val bodySummary = (bodyState as? HealthUiState.Success)?.data
                                    BodyDetailPane(
                                        body = BodyCompositionMetrics(
                                            weightKg = bodySummary?.weightKg ?: 72.4f,
                                            bodyFatPct = bodySummary?.bodyFatPct ?: 15.2f,
                                            muscleMassKg = bodySummary?.leanMassKg ?: 54.3f,
                                            bmi = bodySummary?.bmi ?: 22.8f,
                                            trendHistory = bodySummary?.trendHistory ?: emptyList()
                                        ),
                                        onRecordWeight = { viewModel.recordWeight(it) }
                                    )
                                }
                                FitnessTab.PROGRESS -> {
                                    val progressSummary = (progressState as? HealthUiState.Success)?.data
                                    ProgressDetailPane(
                                        progress = progressSummary ?: ProgressSummaryMetrics(
                                            workoutsCount = 14,
                                            workoutsDelta = "+3 vs last month",
                                            activeCalories = 7420,
                                            caloriesDelta = "↑ 940 kcal",
                                            avgSteps = 8940,
                                            stepsDelta = "↑ 1,520",
                                            avgSleep = "7h 38m",
                                            sleepDelta = "↑ 26m",
                                            timeFrame = "This Month"
                                        )
                                    )
                                }
                            }
                        }
                    }
                } else {
                    // RESPONSIVE PORTRAIT / COMPACT LAYOUT
                    when (activeTab) {
                        FitnessTab.OVERVIEW -> {
                            LazyColumn(
                                modifier = Modifier.fillMaxSize(),
                                verticalArrangement = Arrangement.spacedBy(14.dp)
                            ) {
                                item { ActivityCard(state = activityState) }
                                item { WorkoutCard(state = workoutsState, onStartWorkout = { viewModel.setActiveTab(FitnessTab.WORKOUT) }) }
                                item { NutritionOverviewCard(totals = dailyNutrition, onOpenDetails = { viewModel.setActiveTab(FitnessTab.NUTRITION) }) }
                                item { HeartVitalsCard(state = vitalsState) }
                                item { SleepCard(state = sleepState) }
                                item { BodyOverviewCard(state = bodyState) }
                                item { ProgressOverviewCard(state = progressState) }
                                item {
                                    QuickActionsRow(
                                        onLogWorkout = { viewModel.setActiveTab(FitnessTab.WORKOUT) },
                                        onLogFood = { viewModel.openFoodLoggingSheet() },
                                        onTrackBody = { viewModel.setActiveTab(FitnessTab.BODY) },
                                        onViewProgress = { viewModel.setActiveTab(FitnessTab.PROGRESS) },
                                        onSeedDevData = { viewModel.seedDevData() }
                                    )
                                }
                                item { Spacer(Modifier.height(40.dp)) }
                            }
                        }
                        FitnessTab.NUTRITION -> {
                            NutritionDetailPane(
                                totals = dailyNutrition,
                                subTab = nutritionSubTab,
                                dateString = dateString,
                                onSubTabSelected = { viewModel.setNutritionSubTab(it) },
                                onPrevDate = { viewModel.prevDay() },
                                onNextDate = { viewModel.nextDay() },
                                onOpenMealDetails = { viewModel.openMealDetails(it) },
                                onOpenAllMicros = { viewModel.openAllMicronutrients() },
                                onLogFoodWithJarvis = { viewModel.openFoodLoggingSheet() }
                            )
                        }
                        FitnessTab.WORKOUT -> {
                            WorkoutDetailPane(
                                workout = currentWorkout,
                                onAddSet = { w, r -> viewModel.addWorkoutSet(w, r) }
                            )
                        }
                        FitnessTab.BODY -> {
                            val bodySummary = (bodyState as? HealthUiState.Success)?.data
                            BodyDetailPane(
                                body = BodyCompositionMetrics(
                                    weightKg = bodySummary?.weightKg ?: 72.4f,
                                    bodyFatPct = bodySummary?.bodyFatPct ?: 15.2f,
                                    muscleMassKg = bodySummary?.leanMassKg ?: 54.3f,
                                    bmi = bodySummary?.bmi ?: 22.8f,
                                    trendHistory = bodySummary?.trendHistory ?: emptyList()
                                ),
                                onRecordWeight = { viewModel.recordWeight(it) }
                            )
                        }
                        FitnessTab.PROGRESS -> {
                            val progressSummary = (progressState as? HealthUiState.Success)?.data
                            ProgressDetailPane(
                                progress = progressSummary ?: ProgressSummaryMetrics(
                                    workoutsCount = 14,
                                    workoutsDelta = "+3 vs last month",
                                    activeCalories = 7420,
                                    caloriesDelta = "↑ 940 kcal",
                                    avgSteps = 8940,
                                    stepsDelta = "↑ 1,520",
                                    avgSleep = "7h 38m",
                                    sleepDelta = "↑ 26m",
                                    timeFrame = "This Month"
                                )
                            )
                        }
                    }
                }
            }

            // Bottom Secondary Navigation Bar (Overview, Workout, Nutrition, Body, Progress)
            FitnessSecondaryBottomBar(
                currentTab = activeTab,
                onTabSelected = { viewModel.setActiveTab(it) }
            )
        }

        // Dialogs & Overlays
        if (showFoodLoggingSheet) {
            JarvisFoodLoggingDialog(
                state = jarvisLoggingState,
                onLogPrompt = { viewModel.logFoodWithJarvis(it) },
                onDismiss = { viewModel.closeFoodLoggingSheet() }
            )
        }

        selectedMealForDetails?.let { meal ->
            MealDetailsDialog(
                meal = meal,
                onDeleteMeal = { viewModel.removeMeal(it) },
                onDismiss = { viewModel.closeMealDetails() }
            )
        }

        if (showAllMicronutrients) {
            AllMicronutrientsDialog(
                micros = dailyNutrition.micronutrients,
                onDismiss = { viewModel.closeAllMicronutrients() }
            )
        }
    }
}
