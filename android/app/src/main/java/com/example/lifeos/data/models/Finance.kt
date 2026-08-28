package com.example.lifeos.data.models

import kotlinx.serialization.Serializable

@Serializable
data class FinanceAccount(
    val id: String,
    val user_id: String,
    val name: String,
    val type: String,
    val institution: String? = null,
    val currency: String = "USD",
    val opening_balance: Float = 0f,
    val current_balance: Float = 0f,
    val is_active: Boolean = true,
    val created_at: String? = null,
    val updated_at: String? = null
)

@Serializable
data class FinanceCategory(
    val id: String,
    val user_id: String,
    val name: String,
    val type: String, // expense, income, all
    val icon: String,
    val color: String,
    val sort_order: Int = 0
)

@Serializable
data class FinanceTransaction(
    val id: String,
    val user_id: String,
    val account_id: String,
    val category_id: String? = null,
    val type: String, // expense, income, transfer
    val amount: Float,
    val currency: String = "USD",
    val merchant: String? = null,
    val transaction_date: String,
    val description: String? = null,
    val notes: String? = null,
    val is_recurring: Boolean = false,
    val created_at: String? = null,
    val updated_at: String? = null,
    // Joined fields
    val account_name: String? = null,
    val category_name: String? = null,
    val category_color: String? = null,
    val category_icon: String? = null
)

@Serializable
data class FinanceBudget(
    val id: String,
    val user_id: String,
    val category_id: String? = null,
    val name: String,
    val amount: Float,
    val period_type: String = "monthly",
    val start_date: String,
    val end_date: String,
    val category_name: String? = null,
    val category_color: String? = null
)

@Serializable
data class FinanceGoal(
    val id: String,
    val user_id: String,
    val name: String,
    val target_amount: Float,
    val current_amount: Float = 0f,
    val target_date: String,
    val icon: String? = null,
    val color: String? = null,
    val created_at: String? = null
)
