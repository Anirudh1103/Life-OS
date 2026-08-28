package com.example.lifeos.data.models

import kotlinx.serialization.Serializable

@Serializable
data class ActivityType(
    val id: String,
    val name: String,
    val slug: String,
    val icon: String,
    val category: String,
    val is_active: Boolean = true,
    val created_at: String? = null
)

@Serializable
data class FitnessActivity(
    val id: String,
    val user_id: String,
    val activity_type_id: String,
    val started_at: String,
    val ended_at: String? = null,
    val duration_minutes: Int = 0,
    val distance: Float? = null,
    val calories: Float? = null,
    val avg_heart_rate: Int? = null,
    val max_heart_rate: Int? = null,
    val steps: Int? = null,
    val intensity: String = "medium",
    val notes: String? = null,
    val created_at: String? = null,
    val updated_at: String? = null,
    val activity_type: ActivityType? = null
)

@Serializable
data class FitnessRoutine(
    val id: String,
    val user_id: String,
    val name: String,
    val description: String? = null,
    val start_date: String,
    val end_date: String,
    val status: String = "draft",
    val created_at: String? = null,
    val updated_at: String? = null
)

@Serializable
data class BodyMeasurement(
    val id: String,
    val user_id: String,
    val recorded_at: String,
    val metric_type: String,
    val value: Float,
    val unit: String? = null,
    val source: String? = null,
    val created_at: String? = null
)
