package com.example.lifeos.data.models

import kotlinx.serialization.Serializable

@Serializable
enum class QuantitySource {
    EXACT,      // e.g. "183g watermelon"
    STANDARD,   // e.g. "2 eggs", "1 banana"
    ESTIMATED   // e.g. "some sambar", "a bowl of rice"
}

@Serializable
enum class MealType {
    BREAKFAST,
    LUNCH,
    SNACK,
    DINNER,
    OTHER
}

@Serializable
data class FoodItem(
    val id: String,
    val name: String,
    val quantityText: String,
    val weightGrams: Float? = null,
    val calories: Int,
    val proteinGrams: Float,
    val carbsGrams: Float,
    val fatGrams: Float,
    val fiberGrams: Float = 0f,
    val quantitySource: QuantitySource = QuantitySource.STANDARD,
    val micronutrients: Map<String, Float> = emptyMap(), // Key -> percentage of Daily Recommended Value
    val confidence: Float = 1.0f
)

@Serializable
data class Meal(
    val id: String,
    val userId: String = "",
    val date: String, // yyyy-MM-dd
    val timestamp: String, // e.g. "8:30 AM" or ISO
    val mealType: MealType,
    val title: String,
    val foodItems: List<FoodItem>,
    val totalCalories: Int,
    val totalProtein: Float,
    val totalCarbs: Float,
    val totalFat: Float,
    val totalFiber: Float = 0f,
    val isCompleted: Boolean = true
)

val Meal.iconEmoji: String
    get() = when (mealType) {
        MealType.BREAKFAST -> "🍳"
        MealType.LUNCH -> "🥗"
        MealType.SNACK -> "🍌"
        MealType.DINNER -> "🍲"
        MealType.OTHER -> "🍽️"
    }

@Serializable
data class MicronutrientInfo(
    val key: String,
    val displayName: String,
    val shortName: String,
    val currentAmount: Float,
    val targetAmount: Float,
    val unit: String,
    val percentage: Int
)

@Serializable
data class DailyNutritionTotals(
    val date: String,
    val caloriesConsumed: Int,
    val caloriesTarget: Int = 2400,
    val proteinConsumed: Float,
    val proteinTarget: Float = 150f,
    val carbsConsumed: Float,
    val carbsTarget: Float = 280f,
    val fatConsumed: Float,
    val fatTarget: Float = 80f,
    val fiberConsumed: Float = 0f,
    val fiberTarget: Float = 35f,
    val meals: List<Meal> = emptyList(),
    val micronutrients: List<MicronutrientInfo> = emptyList()
) {
    val caloriesRemaining: Int
        get() = (caloriesTarget - caloriesConsumed).coerceAtLeast(0)

    val proteinRemaining: Float
        get() = (proteinTarget - proteinConsumed).coerceAtLeast(0f)

    val carbsRemaining: Float
        get() = (carbsTarget - carbsConsumed).coerceAtLeast(0f)

    val fatRemaining: Float
        get() = (fatTarget - fatConsumed).coerceAtLeast(0f)
}
