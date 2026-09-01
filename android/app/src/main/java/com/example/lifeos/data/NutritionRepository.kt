package com.example.lifeos.data

import android.content.Context
import com.example.lifeos.LifeOSApplication
import com.example.lifeos.data.models.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.withContext
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.text.SimpleDateFormat
import java.util.*
import java.util.regex.Pattern

class NutritionRepository(private val context: Context = LifeOSApplication.instance) {

    private val prefs = context.getSharedPreferences("lifeos_nutrition_prefs", Context.MODE_PRIVATE)
    private val json = Json { ignoreUnknownKeys = true; isLenient = true; encodeDefaults = true }

    private val _dailyNutrition = MutableStateFlow(getInitialOrCachedNutrition())
    val dailyNutrition: StateFlow<DailyNutritionTotals> = _dailyNutrition.asStateFlow()

    private fun getTodayDateString(): String {
        return SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
    }

    private fun getInitialOrCachedNutrition(): DailyNutritionTotals {
        val cachedJson = prefs.getString("daily_nutrition_${getTodayDateString()}", null)
        if (cachedJson != null) {
            try {
                return json.decodeFromString(cachedJson)
            } catch (_: Exception) {}
        }
        return createDefaultSeedNutrition()
    }

    private fun createDefaultSeedNutrition(): DailyNutritionTotals {
        val today = getTodayDateString()
        
        val defaultMeals = listOf(
            Meal(
                id = "meal-1",
                date = today,
                timestamp = "8:30 AM",
                mealType = MealType.BREAKFAST,
                title = "Egg & Veg Scramble",
                foodItems = listOf(
                    FoodItem("f1", "Whole Eggs", "2 whole", 100f, 140, 12f, 1f, 10f, 0f, QuantitySource.STANDARD),
                    FoodItem("f2", "Egg Whites", "3 whites", 99f, 51, 11f, 1f, 0f, 0f, QuantitySource.STANDARD),
                    FoodItem("f3", "Medium Onion", "1 medium", 110f, 44, 1.2f, 10f, 0.1f, 1.9f, QuantitySource.STANDARD),
                    FoodItem("f4", "Tomato & Capsicum", "1 cup", 120f, 35, 1.5f, 7f, 0.2f, 2.1f, QuantitySource.STANDARD),
                    FoodItem("f5", "Olive Oil & Spices", "1 tsp", 5f, 50, 0f, 0f, 5.5f, 0f, QuantitySource.ESTIMATED)
                ),
                totalCalories = 320,
                totalProtein = 26f,
                totalCarbs = 20f,
                totalFat = 15.8f,
                totalFiber = 4f
            ),
            Meal(
                id = "meal-2",
                date = today,
                timestamp = "1:30 PM",
                mealType = MealType.LUNCH,
                title = "Chicken Rice + Curd",
                foodItems = listOf(
                    FoodItem("f6", "Grilled Chicken Breast", "180g", 180f, 290, 54f, 0f, 6f, 0f, QuantitySource.EXACT),
                    FoodItem("f7", "Steamed Basmati Rice", "1.5 cups", 240f, 310, 6f, 68f, 0.8f, 1.2f, QuantitySource.STANDARD),
                    FoodItem("f8", "Fresh Curd / Yogurt", "1 cup", 200f, 120, 8f, 9f, 6f, 0f, QuantitySource.STANDARD),
                    FoodItem("f9", "Mixed Salad", "1 bowl", 100f, 60, 2f, 8f, 1.2f, 3f, QuantitySource.ESTIMATED)
                ),
                totalCalories = 780,
                totalProtein = 70f,
                totalCarbs = 85f,
                totalFat = 14f,
                totalFiber = 4.2f
            ),
            Meal(
                id = "meal-3",
                date = today,
                timestamp = "5:30 PM",
                mealType = MealType.SNACK,
                title = "Banana + Protein Shake",
                foodItems = listOf(
                    FoodItem("f10", "Whey Protein Isolate", "1 scoop", 30f, 120, 25f, 2f, 1f, 0f, QuantitySource.STANDARD),
                    FoodItem("f11", "Ripe Banana", "1 medium", 118f, 105, 1.3f, 27f, 0.3f, 3.1f, QuantitySource.STANDARD),
                    FoodItem("f12", "Almond Milk", "250ml", 250f, 40, 1.5f, 1.5f, 3f, 1f, QuantitySource.STANDARD),
                    FoodItem("f13", "Peanut Butter", "1 tbsp", 16f, 45, 2f, 2f, 3.8f, 0.8f, QuantitySource.ESTIMATED)
                ),
                totalCalories = 310,
                totalProtein = 30f,
                totalCarbs = 32.5f,
                totalFat = 8.1f,
                totalFiber = 4.9f
            ),
            Meal(
                id = "meal-4",
                date = today,
                timestamp = "8:30 PM",
                mealType = MealType.DINNER,
                title = "Roti + Paneer + Vegetables",
                foodItems = listOf(
                    FoodItem("f14", "Whole Wheat Roti", "2 rotis", 80f, 180, 5.5f, 36f, 1.5f, 4.5f, QuantitySource.STANDARD),
                    FoodItem("f15", "Paneer Bhurji / Curry", "100g", 100f, 190, 14f, 4f, 13f, 0.5f, QuantitySource.STANDARD),
                    FoodItem("f16", "Stir-fried Green Veggies", "1 cup", 100f, 62, 2.5f, 8f, 2.5f, 3.5f, QuantitySource.ESTIMATED)
                ),
                totalCalories = 432,
                totalProtein = 22f,
                totalCarbs = 48f,
                totalFat = 17f,
                totalFiber = 8.5f
            )
        )

        val defaultMicros = listOf(
            MicronutrientInfo("vit_c", "Vitamin C", "Vit. C", 106.2f, 90f, "mg", 118),
            MicronutrientInfo("iron", "Iron", "Iron", 13.7f, 18f, "mg", 76),
            MicronutrientInfo("calcium", "Calcium", "Calcium", 820f, 1000f, "mg", 82),
            MicronutrientInfo("magnesium", "Magnesium", "Magnesium", 382f, 420f, "mg", 91),
            MicronutrientInfo("potassium", "Potassium", "Potassium", 3080f, 3500f, "mg", 88),
            MicronutrientInfo("zinc", "Zinc", "Zinc", 9.2f, 11f, "mg", 84),
            MicronutrientInfo("vit_d", "Vitamin D", "Vit. D", 14f, 20f, "mcg", 70),
            MicronutrientInfo("vit_b12", "Vitamin B12", "Vit. B12", 2.6f, 2.4f, "mcg", 108)
        )

        val totalCals = defaultMeals.sumOf { it.totalCalories }
        val totalP = defaultMeals.sumOf { it.totalProtein.toDouble() }.toFloat()
        val totalC = defaultMeals.sumOf { it.totalCarbs.toDouble() }.toFloat()
        val totalF = defaultMeals.sumOf { it.totalFat.toDouble() }.toFloat()
        val totalFib = defaultMeals.sumOf { it.totalFiber.toDouble() }.toFloat()

        return DailyNutritionTotals(
            date = today,
            caloriesConsumed = totalCals,
            caloriesTarget = 2400,
            proteinConsumed = totalP,
            proteinTarget = 150f,
            carbsConsumed = totalC,
            carbsTarget = 280f,
            fatConsumed = totalF,
            fatTarget = 80f,
            fiberConsumed = totalFib,
            fiberTarget = 35f,
            meals = defaultMeals,
            micronutrients = defaultMicros
        )
    }

    private fun saveAndEmit(totals: DailyNutritionTotals) {
        val jsonString = json.encodeToString(totals)
        prefs.edit().putString("daily_nutrition_${totals.date}", jsonString).apply()
        _dailyNutrition.value = totals
    }

    /**
     * Natural Language Jarvis Meal Parsing Engine
     * Parses conversational phrases like:
     * "I ate 2 whole eggs, 3 egg whites. I added 1 medium onion, 1 tomato, 1 large capsicum, some curry leaves, a pinch of salt and Maggi masala."
     */
    suspend fun parseAndLogMealWithJarvis(rawText: String): Meal = withContext(Dispatchers.Default) {
        val currentTotals = _dailyNutrition.value
        val now = Date()
        val timeFormat = SimpleDateFormat("h:mm a", Locale.getDefault()).format(now)
        val today = getTodayDateString()
        
        // Identify meal type based on time or keywords
        val lower = rawText.lowercase()
        val mealType = when {
            lower.contains("breakfast") -> MealType.BREAKFAST
            lower.contains("lunch") -> MealType.LUNCH
            lower.contains("dinner") -> MealType.DINNER
            lower.contains("snack") || lower.contains("shake") -> MealType.SNACK
            else -> {
                val hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
                when (hour) {
                    in 5..11 -> MealType.BREAKFAST
                    in 12..16 -> MealType.LUNCH
                    in 17..18 -> MealType.SNACK
                    else -> MealType.DINNER
                }
            }
        }

        val items = mutableListOf<FoodItem>()
        var calcCalories = 0
        var calcProtein = 0f
        var calcCarbs = 0f
        var calcFat = 0f
        var calcFiber = 0f

        // Check for specific foods in rawText
        fun parseNumberBefore(keyword: String): Float? {
            val p = Pattern.compile("(\\d+(\\.\\d+)?)\\s*(?:g|grams|gm|whole|cup|cups|scoop|scoops|slices|rotis|whites)?\\s*${keyword}")
            val m = p.matcher(lower)
            if (m.find()) {
                return m.group(1)?.toFloatOrNull()
            }
            return null
        }

        // 1. Egg whites
        if (lower.contains("egg white") || lower.contains("egg whites")) {
            val count = parseNumberBefore("egg white") ?: 3f
            val cals = (count * 17).toInt()
            val p = count * 3.6f
            val c = count * 0.2f
            val f = 0.1f
            items.add(FoodItem(UUID.randomUUID().toString(), "Egg Whites", "${count.toInt()} whites", count * 33f, cals, p, c, f, 0f, QuantitySource.EXACT))
            calcCalories += cals; calcProtein += p; calcCarbs += c; calcFat += f
        }

        // 2. Whole eggs
        if (lower.contains("whole egg") || (lower.contains("egg") && !lower.contains("white"))) {
            val count = parseNumberBefore("whole egg") ?: parseNumberBefore("egg") ?: 2f
            val cals = (count * 70).toInt()
            val p = count * 6f
            val c = count * 0.5f
            val f = count * 5f
            items.add(FoodItem(UUID.randomUUID().toString(), "Whole Eggs", "${count.toInt()} whole", count * 50f, cals, p, c, f, 0f, QuantitySource.STANDARD))
            calcCalories += cals; calcProtein += p; calcCarbs += c; calcFat += f
        }

        // 3. Watermelon
        if (lower.contains("watermelon")) {
            val grams = parseNumberBefore("watermelon") ?: 180f
            val cals = (grams * 0.30f).toInt()
            val p = grams * 0.006f
            val c = grams * 0.075f
            val f = 0.2f
            val fib = grams * 0.004f
            items.add(FoodItem(UUID.randomUUID().toString(), "Fresh Watermelon", "${grams.toInt()}g", grams, cals, p, c, f, fib, QuantitySource.EXACT))
            calcCalories += cals; calcProtein += p; calcCarbs += c; calcFat += f; calcFiber += fib
        }

        // 4. Banana
        if (lower.contains("banana")) {
            val count = parseNumberBefore("banana") ?: 1f
            val cals = (count * 105).toInt()
            val p = count * 1.3f
            val c = count * 27f
            val f = count * 0.3f
            val fib = count * 3.1f
            items.add(FoodItem(UUID.randomUUID().toString(), "Banana", "${count.toInt()} medium", count * 118f, cals, p, c, f, fib, QuantitySource.STANDARD))
            calcCalories += cals; calcProtein += p; calcCarbs += c; calcFat += f; calcFiber += fib
        }

        // 5. Chicken
        if (lower.contains("chicken") || lower.contains("breast")) {
            val grams = parseNumberBefore("chicken") ?: 150f
            val cals = (grams * 1.65f).toInt()
            val p = grams * 0.31f
            val c = 0f
            val f = grams * 0.036f
            items.add(FoodItem(UUID.randomUUID().toString(), "Chicken Breast", "${grams.toInt()}g", grams, cals, p, c, f, 0f, QuantitySource.EXACT))
            calcCalories += cals; calcProtein += p; calcCarbs += c; calcFat += f
        }

        // 6. Rice
        if (lower.contains("rice")) {
            val cups = parseNumberBefore("rice") ?: 1f
            val cals = (cups * 205).toInt()
            val p = cups * 4.2f
            val c = cups * 45f
            val f = cups * 0.4f
            items.add(FoodItem(UUID.randomUUID().toString(), "Steamed Rice", "$cups cup", cups * 160f, cals, p, c, f, 1f, QuantitySource.STANDARD))
            calcCalories += cals; calcProtein += p; calcCarbs += c; calcFat += f; calcFiber += 1f
        }

        // 7. Onion, Tomato, Capsicum, Veggies
        if (lower.contains("onion") || lower.contains("tomato") || lower.contains("capsicum") || lower.contains("vegetable")) {
            items.add(FoodItem(UUID.randomUUID().toString(), "Vegetables (Onion, Tomato, Capsicum)", "1 portion", 120f, 45, 1.8f, 9.5f, 0.3f, 2.8f, QuantitySource.ESTIMATED))
            calcCalories += 45; calcProtein += 1.8f; calcCarbs += 9.5f; calcFat += 0.3f; calcFiber += 2.8f
        }

        // 8. Protein shake / Whey
        if (lower.contains("protein") || lower.contains("shake") || lower.contains("whey")) {
            val scoops = parseNumberBefore("scoop") ?: 1f
            val cals = (scoops * 120).toInt()
            val p = scoops * 25f
            val c = scoops * 2f
            val f = scoops * 1f
            items.add(FoodItem(UUID.randomUUID().toString(), "Whey Protein", "${scoops.toInt()} scoop", scoops * 30f, cals, p, c, f, 0f, QuantitySource.STANDARD))
            calcCalories += cals; calcProtein += p; calcCarbs += c; calcFat += f
        }

        // 9. Paneer / Roti
        if (lower.contains("paneer")) {
            items.add(FoodItem(UUID.randomUUID().toString(), "Fresh Paneer", "100g", 100f, 265, 18f, 3.5f, 20f, 0f, QuantitySource.STANDARD))
            calcCalories += 265; calcProtein += 18f; calcCarbs += 3.5f; calcFat += 20f
        }
        if (lower.contains("roti") || lower.contains("chapati")) {
            val count = parseNumberBefore("roti") ?: parseNumberBefore("chapati") ?: 2f
            val cals = (count * 90).toInt()
            val p = count * 2.8f
            val c = count * 18f
            val f = count * 0.8f
            items.add(FoodItem(UUID.randomUUID().toString(), "Whole Wheat Roti", "${count.toInt()} rotis", count * 40f, cals, p, c, f, 2.2f, QuantitySource.STANDARD))
            calcCalories += cals; calcProtein += p; calcCarbs += c; calcFat += f; calcFiber += count * 2.2f
        }

        // Fallback if no matching foods parsed
        if (items.isEmpty()) {
            calcCalories = 350
            calcProtein = 20f
            calcCarbs = 40f
            calcFat = 12f
            calcFiber = 4f
            items.add(FoodItem(UUID.randomUUID().toString(), rawText.take(40), "1 meal", 250f, calcCalories, calcProtein, calcCarbs, calcFat, calcFiber, QuantitySource.ESTIMATED))
        }

        val mealTitle = when (mealType) {
            MealType.BREAKFAST -> if (items.any { it.name.contains("Egg") }) "Egg & Veg Scramble" else "Power Breakfast"
            MealType.LUNCH -> if (items.any { it.name.contains("Chicken") }) "Chicken & Rice Bowl" else "Balanced Lunch"
            MealType.SNACK -> if (items.any { it.name.contains("Protein") || it.name.contains("Banana") }) "Banana Protein Shake" else "Healthy Snack"
            MealType.DINNER -> if (items.any { it.name.contains("Paneer") || it.name.contains("Roti") }) "Roti & Paneer Curry" else "Nutritious Dinner"
            MealType.OTHER -> "Custom Meal"
        }

        val newMeal = Meal(
            id = "meal-${UUID.randomUUID().toString().take(8)}",
            date = today,
            timestamp = timeFormat,
            mealType = mealType,
            title = mealTitle,
            foodItems = items,
            totalCalories = calcCalories,
            totalProtein = calcProtein,
            totalCarbs = calcCarbs,
            totalFat = calcFat,
            totalFiber = calcFiber
        )

        val updatedMeals = currentTotals.meals + newMeal
        val updatedTotals = currentTotals.copy(
            caloriesConsumed = updatedMeals.sumOf { it.totalCalories },
            proteinConsumed = updatedMeals.sumOf { it.totalProtein.toDouble() }.toFloat(),
            carbsConsumed = updatedMeals.sumOf { it.totalCarbs.toDouble() }.toFloat(),
            fatConsumed = updatedMeals.sumOf { it.totalFat.toDouble() }.toFloat(),
            fiberConsumed = updatedMeals.sumOf { it.totalFiber.toDouble() }.toFloat(),
            meals = updatedMeals
        )

        saveAndEmit(updatedTotals)
        newMeal
    }

    suspend fun removeMeal(mealId: String) = withContext(Dispatchers.Default) {
        val currentTotals = _dailyNutrition.value
        val updatedMeals = currentTotals.meals.filter { it.id != mealId }
        val updatedTotals = currentTotals.copy(
            caloriesConsumed = updatedMeals.sumOf { it.totalCalories },
            proteinConsumed = updatedMeals.sumOf { it.totalProtein.toDouble() }.toFloat(),
            carbsConsumed = updatedMeals.sumOf { it.totalCarbs.toDouble() }.toFloat(),
            fatConsumed = updatedMeals.sumOf { it.totalFat.toDouble() }.toFloat(),
            fiberConsumed = updatedMeals.sumOf { it.totalFiber.toDouble() }.toFloat(),
            meals = updatedMeals
        )
        saveAndEmit(updatedTotals)
    }

    suspend fun resetToDefault() = withContext(Dispatchers.Default) {
        val seed = createDefaultSeedNutrition()
        saveAndEmit(seed)
    }
}
