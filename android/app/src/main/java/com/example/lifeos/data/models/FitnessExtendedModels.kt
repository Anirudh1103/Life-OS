package com.example.lifeos.data.models

import kotlinx.serialization.Serializable

@Serializable
data class ActivityOverviewMetrics(
    val steps: Int = 7420,
    val stepTarget: Int = 10000,
    val distanceKm: Float = 5.6f,
    val activeCalories: Int = 412,
    val moveMinutes: Int = 62,
    val isLive: Boolean = true
) {
    val progressFraction: Float
        get() = if (stepTarget > 0) (steps.toFloat() / stepTarget).coerceIn(0f, 1f) else 0f
}

@Serializable
data class WorkoutSetItem(
    val setNumber: Int,
    val weightKg: Float,
    val reps: Int,
    val isCompleted: Boolean = true
)

@Serializable
data class WorkoutSessionDetail(
    val id: String,
    val name: String = "Push Day",
    val muscleFocus: String = "Upper Body Focus",
    val durationMinutes: Int = 42,
    val durationFormatted: String = "42:15",
    val caloriesBurned: Int = 325,
    val isCompleted: Boolean = true,
    val sets: List<WorkoutSetItem> = emptyList()
)

@Serializable
data class BodyTrendPoint(
    val date: String,
    val weightKg: Float,
    val bodyFatPct: Float? = null
)

@Serializable
data class BodyCompositionMetrics(
    val weightKg: Float = 72.4f,
    val bodyFatPct: Float = 15.2f,
    val muscleMassKg: Float = 54.3f,
    val bmi: Float = 22.8f,
    val trendHistory: List<BodyTrendPoint> = listOf(
        BodyTrendPoint("Mon", 73.1f),
        BodyTrendPoint("Tue", 72.9f),
        BodyTrendPoint("Wed", 72.8f),
        BodyTrendPoint("Thu", 72.6f),
        BodyTrendPoint("Fri", 72.5f),
        BodyTrendPoint("Sat", 72.4f),
        BodyTrendPoint("Sun", 72.4f)
    )
)

@Serializable
data class ProgressSummaryMetrics(
    val workoutsCount: Int = 12,
    val workoutsDelta: String = "+2 vs last month",
    val activeCalories: Int = 6240,
    val caloriesDelta: String = "↑ 820 kcal",
    val avgSteps: Int = 8432,
    val stepsDelta: String = "↑ 1,210",
    val avgSleep: String = "7h 12m",
    val sleepDelta: String = "↑ 32m",
    val timeFrame: String = "This Month"
)
