package com.example.lifeos.data.models

import kotlinx.serialization.Serializable

/**
 * Normalized source identity for health & fitness records
 */
enum class HealthDataSource(val key: String, val displayName: String) {
    APPLE_HEALTH("APPLE_HEALTH", "Apple Health"),
    ANDROID_HEALTH_CONNECT("ANDROID_HEALTH_CONNECT", "Health Connect"),
    MANUAL("MANUAL", "Manual Entry"),
    OTHER("OTHER", "Other Source")
}

/**
 * Generic UI state container for async health modules
 */
sealed class HealthUiState<out T> {
    object Loading : HealthUiState<Nothing>()
    data class Success<out T>(val data: T) : HealthUiState<T>()
    data class Empty(val message: String = "No data yet", val actionHint: String? = null) : HealthUiState<Nothing>()
    data class Error(val message: String) : HealthUiState<Nothing>()
}

/**
 * Daily Activity aggregate record
 */
@Serializable
data class DailyActivity(
    val id: String? = null,
    val user_id: String,
    val date: String, // YYYY-MM-DD
    val steps: Int = 0,
    val distance_km: Float = 0f,
    val active_calories: Int = 0,
    val total_calories: Int = 0,
    val exercise_minutes: Int = 0,
    val move_goal: Int = 600,
    val exercise_goal: Int = 30,
    val stand_goal: Int = 12,
    val move_completed: Boolean = false,
    val exercise_completed: Boolean = false,
    val stand_completed: Boolean = false,
    val source: String = "MANUAL",
    val source_id: String? = null,
    val created_at: String? = null,
    val updated_at: String? = null
)

/**
 * Workout session record (event-based)
 */
@Serializable
data class WorkoutRecord(
    val id: String? = null,
    val user_id: String,
    val source: String = "MANUAL",
    val source_id: String? = null,
    val workout_type: String, // e.g. "running", "strength_training", "walking", "cycling"
    val title: String? = null,
    val start_time: String,
    val end_time: String,
    val duration_seconds: Int,
    val distance_km: Float? = null,
    val active_calories: Int? = null,
    val total_calories: Int? = null,
    val average_heart_rate: Int? = null,
    val maximum_heart_rate: Int? = null,
    val elevation_gain_meters: Float? = null,
    val created_at: String? = null,
    val updated_at: String? = null
)

/**
 * Discrete Health & Vital measurement
 */
@Serializable
data class HealthVitalRecord(
    val id: String? = null,
    val user_id: String,
    val metric_type: String, // "resting_heart_rate", "heart_rate_variability", "heart_rate", "blood_pressure", "oxygen_saturation", "respiratory_rate", "body_temperature", "blood_glucose"
    val value: Float? = null,
    val unit: String,
    val systolic: Float? = null,
    val diastolic: Float? = null,
    val recorded_at: String,
    val source: String = "MANUAL",
    val source_id: String? = null,
    val created_at: String? = null
)

/**
 * Sleep session with stage breakdowns
 */
@Serializable
data class SleepSessionRecord(
    val id: String? = null,
    val user_id: String,
    val source: String = "MANUAL",
    val source_id: String? = null,
    val start_time: String,
    val end_time: String,
    val duration_seconds: Int,
    val light_seconds: Int? = null,
    val deep_seconds: Int? = null,
    val rem_seconds: Int? = null,
    val awake_seconds: Int? = null,
    val sleep_score: Int? = null,
    val created_at: String? = null,
    val updated_at: String? = null
)

/**
 * Body composition historical measurement
 */
@Serializable
data class BodyMetricRecord(
    val id: String? = null,
    val user_id: String,
    val metric_type: String, // "weight", "height", "body_fat", "lean_body_mass", "basal_energy_burned", "vo2_max", "bmi"
    val value: Float,
    val unit: String,
    val recorded_at: String,
    val source: String = "MANUAL",
    val source_id: String? = null,
    val created_at: String? = null
)

/**
 * Formatted Vitals Summary for UI Display
 */
data class VitalsDisplaySummary(
    val restingHeartRateBpm: Int? = null,
    val hrvMs: Int? = null,
    val oxygenSaturationPct: Float? = null,
    val respiratoryRatePerMin: Float? = null,
    val bloodPressureFormatted: String? = null,
    val bodyTemperatureCelsius: Float? = null,
    val bloodGlucoseMgDl: Float? = null,
    val source: String = "MANUAL",
    val isAutoSynced: Boolean = false
)

/**
 * Formatted Sleep Stage Summary for UI Display
 */
data class SleepDisplaySummary(
    val totalHoursMinutes: String,
    val totalMinutes: Int,
    val deepHoursMinutes: String? = null,
    val remHoursMinutes: String? = null,
    val lightHoursMinutes: String? = null,
    val awakeHoursMinutes: String? = null,
    val deepRatio: Float = 0f,
    val remRatio: Float = 0f,
    val lightRatio: Float = 0f,
    val source: String = "MANUAL",
    val isAutoSynced: Boolean = false
)

/**
 * Body Composition Summary for UI Display
 */
data class BodyDisplaySummary(
    val weightKg: Float? = null,
    val bodyFatPct: Float? = null,
    val leanMassKg: Float? = null,
    val vo2Max: Float? = null,
    val bmi: Float? = null,
    val trendHistory: List<BodyTrendPoint> = emptyList(),
    val source: String = "MANUAL",
    val isAutoSynced: Boolean = false
)
