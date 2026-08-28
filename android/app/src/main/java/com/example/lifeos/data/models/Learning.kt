package com.example.lifeos.data.models

import kotlinx.serialization.Serializable

@Serializable
data class Category(
    val id: String,
    val user_id: String,
    val name: String,
    val description: String? = null,
    val icon: String = "BookOpen",
    val sort_order: Int = 0,
    val created_at: String? = null,
    val updated_at: String? = null
)

@Serializable
data class Topic(
    val id: String,
    val category_id: String,
    val user_id: String,
    val title: String,
    val description: String? = null,
    val notes: String? = null,
    val is_completed: Boolean = false,
    val completed_at: String? = null,
    val sort_order: Int = 0,
    val created_at: String? = null,
    val updated_at: String? = null
)

@Serializable
data class Flashcard(
    val id: String,
    val topic_id: String,
    val user_id: String,
    val question: String,
    val answer: String,
    val difficulty: String = "medium",
    val last_reviewed_at: String? = null,
    val next_review_at: String? = null,
    val created_at: String? = null,
    val updated_at: String? = null
)

@Serializable
data class LearningActivity(
    val id: String,
    val user_id: String,
    val topic_id: String? = null,
    val activity_type: String,
    val created_at: String? = null,
    val topic_title: String? = null,
    val category_name: String? = null
)
