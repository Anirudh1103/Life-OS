package com.example.lifeos.data.models

import kotlinx.serialization.Serializable

@Serializable
data class Task(
    val id: String,
    val user_id: String,
    val workspace: String,
    val title: String,
    val description: String? = null,
    val is_completed: Boolean = false,
    val is_important: Boolean = false,
    val is_in_today: Boolean = false,
    val priority: String = "none",
    val due_at: String? = null,
    val reminder_at: String? = null,
    val recurrence_rule: String? = null,
    val completed_at: String? = null,
    val created_at: String? = null,
    val updated_at: String? = null
)

@Serializable
data class TaskStep(
    val id: String,
    val task_id: String,
    val user_id: String,
    val title: String,
    val is_completed: Boolean = false,
    val sort_order: Int = 0,
    val created_at: String? = null,
    val updated_at: String? = null
)
