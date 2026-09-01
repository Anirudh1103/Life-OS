package com.example.lifeos.ui.fitness

import androidx.compose.animation.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.*
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.lifeos.data.models.*
import com.example.lifeos.ui.fitness.components.*

@Composable
fun NutritionDetailPane(
    totals: DailyNutritionTotals,
    subTab: String,
    dateString: String,
    onSubTabSelected: (String) -> Unit,
    onPrevDate: () -> Unit,
    onNextDate: () -> Unit,
    onOpenMealDetails: (Meal) -> Unit,
    onOpenAllMicros: () -> Unit,
    onLogFoodWithJarvis: () -> Unit,
    onBack: (() -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = FitnessCardBg),
        shape = RoundedCornerShape(24.dp),
        border = BorderStroke(1.dp, FitnessCardBorder),
        modifier = modifier.fillMaxHeight()
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(20.dp)
        ) {
            // Header with Back Button (if provided) & Title
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                if (onBack != null) {
                    IconButton(onClick = onBack, modifier = Modifier.size(32.dp)) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = Color.White)
                    }
                    Spacer(Modifier.width(8.dp))
                }
                Text(
                    text = "Nutrition",
                    color = Color.White,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold
                )
            }

            Spacer(Modifier.height(14.dp))

            // Sub Tabs: Today, Trends, Nutrients, History
            val subTabs = listOf("Today", "Trends", "Nutrients", "History")
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(14.dp))
                    .background(Color(0xFF141829))
                    .padding(4.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                subTabs.forEach { tab ->
                    val isSelected = subTab == tab
                    val bgModifier = if (isSelected) {
                        Modifier.background(Brush.linearGradient(listOf(Color(0xFF8A5DF2), Color(0xFF6366F1))))
                    } else {
                        Modifier.background(Color.Transparent)
                    }
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(10.dp))
                            .then(bgModifier)
                            .clickable { onSubTabSelected(tab) }
                            .padding(vertical = 6.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = tab,
                            color = if (isSelected) Color.White else Color.White.copy(alpha = 0.5f),
                            fontSize = 11.sp,
                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium
                        )
                    }
                }
            }

            Spacer(Modifier.height(12.dp))

            // Date Navigation & Targets Button
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier
                        .clip(RoundedCornerShape(12.dp))
                        .background(Color(0xFF141829))
                        .padding(horizontal = 8.dp, vertical = 4.dp)
                ) {
                    Icon(
                        Icons.Default.ChevronLeft,
                        contentDescription = "Previous",
                        tint = Color.White.copy(alpha = 0.6f),
                        modifier = Modifier.size(16.dp).clickable { onPrevDate() }
                    )
                    Spacer(Modifier.width(6.dp))
                    Text(dateString, color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.width(6.dp))
                    Icon(
                        Icons.Default.ChevronRight,
                        contentDescription = "Next",
                        tint = Color.White.copy(alpha = 0.6f),
                        modifier = Modifier.size(16.dp).clickable { onNextDate() }
                    )
                }

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier
                        .clip(RoundedCornerShape(12.dp))
                        .background(Color(0xFF141829))
                        .clickable { }
                        .padding(horizontal = 10.dp, vertical = 6.dp)
                ) {
                    Icon(Icons.Default.TrackChanges, contentDescription = null, tint = AccentPurpleGlow, modifier = Modifier.size(14.dp))
                    Spacer(Modifier.width(6.dp))
                    Text("Targets", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                }
            }

            Spacer(Modifier.height(14.dp))

            // Scrollable Content
            LazyColumn(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // 4 Macro Cards (Calories, Protein, Carbs, Fat)
                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        MacroSummaryCard(
                            label = "Calories",
                            consumed = "${totals.caloriesConsumed}",
                            target = "/ ${totals.caloriesTarget}",
                            remainingText = "${totals.caloriesRemaining} kcal remaining",
                            progress = totals.caloriesConsumed.toFloat() / totals.caloriesTarget.coerceAtLeast(1),
                            barColor = AccentOrange,
                            modifier = Modifier.weight(1f)
                        )

                        MacroSummaryCard(
                            label = "Protein",
                            consumed = "${totals.proteinConsumed.toInt()}",
                            target = "/ ${totals.proteinTarget.toInt()} g",
                            remainingText = "${totals.proteinRemaining.toInt()} g remaining",
                            progress = totals.proteinConsumed / totals.proteinTarget.coerceAtLeast(1f),
                            barColor = AccentGreenGlow,
                            modifier = Modifier.weight(1f)
                        )

                        MacroSummaryCard(
                            label = "Carbs",
                            consumed = "${totals.carbsConsumed.toInt()}",
                            target = "/ ${totals.carbsTarget.toInt()} g",
                            remainingText = "${totals.carbsRemaining.toInt()} g remaining",
                            progress = totals.carbsConsumed / totals.carbsTarget.coerceAtLeast(1f),
                            barColor = AccentBlueGlow,
                            modifier = Modifier.weight(1f)
                        )

                        MacroSummaryCard(
                            label = "Fat",
                            consumed = "${totals.fatConsumed.toInt()}",
                            target = "/ ${totals.fatTarget.toInt()} g",
                            remainingText = "${totals.fatRemaining.toInt()} g remaining",
                            progress = totals.fatConsumed / totals.fatTarget.coerceAtLeast(1f),
                            barColor = AccentPurpleGlow,
                            modifier = Modifier.weight(1f)
                        )
                    }
                }

                // Micronutrients Section
                item {
                    Column {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                "Micronutrients",
                                color = Color.White,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                "See All",
                                color = AccentPurpleGlow,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.clickable { onOpenAllMicros() }
                            )
                        }

                        Spacer(Modifier.height(12.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            totals.micronutrients.take(6).forEach { micro ->
                                MicronutrientRingItem(micro = micro)
                            }
                        }
                    }
                }

                // Meals Header & List
                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            "Meals",
                            color = Color.White,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            "+ Add Meal",
                            color = AccentPurpleGlow,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.clickable { onLogFoodWithJarvis() }
                        )
                    }
                }

                items(totals.meals) { meal ->
                    MealRowCard(
                        meal = meal,
                        onClick = { onOpenMealDetails(meal) }
                    )
                }

                item {
                    Spacer(Modifier.height(8.dp))
                }
            }

            // Bottom CTA: Log Food with Jarvis
            Spacer(Modifier.height(12.dp))
            Button(
                onClick = onLogFoodWithJarvis,
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
                contentPadding = PaddingValues(0.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp)
                    .clip(RoundedCornerShape(16.dp))
                    .background(
                        Brush.linearGradient(
                            listOf(Color(0xFF8A5DF2), Color(0xFF6366F1))
                        )
                    )
                    .shadow(10.dp, RoundedCornerShape(16.dp), spotColor = Color(0xFF8A5DF2))
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.Center
                ) {
                    Icon(Icons.Default.Mic, contentDescription = null, tint = Color.White, modifier = Modifier.size(16.dp))
                    Spacer(Modifier.width(8.dp))
                    Text(
                        "Log Food with Jarvis",
                        color = Color.White,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}

@Composable
fun MacroSummaryCard(
    label: String,
    consumed: String,
    target: String,
    remainingText: String,
    progress: Float,
    barColor: Color,
    modifier: Modifier = Modifier
) {
    Surface(
        color = Color(0xFF141829),
        shape = RoundedCornerShape(16.dp),
        border = BorderStroke(1.dp, Color(0xFF222944)),
        modifier = modifier
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Text(label, color = Color.White.copy(alpha = 0.4f), fontSize = 9.sp)
            Spacer(Modifier.height(4.dp))
            Row(verticalAlignment = Alignment.Bottom) {
                Text(consumed, color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Black)
                Spacer(Modifier.width(2.dp))
                Text(target, color = Color.White.copy(alpha = 0.4f), fontSize = 8.5.sp)
            }
            Spacer(Modifier.height(2.dp))
            Text(remainingText, color = Color.White.copy(alpha = 0.4f), fontSize = 8.sp, maxLines = 1)
            Spacer(Modifier.height(8.dp))
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(3.5.dp)
                    .clip(CircleShape)
                    .background(Color(0xFF1C223A))
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxHeight()
                        .fillMaxWidth(progress.coerceIn(0f, 1f))
                        .clip(CircleShape)
                        .background(barColor)
                )
            }
        }
    }
}

@Composable
fun MicronutrientRingItem(micro: MicronutrientInfo) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Box(modifier = Modifier.size(46.dp), contentAlignment = Alignment.Center) {
            Canvas(modifier = Modifier.fillMaxSize()) {
                val strokeW = 4.dp.toPx()
                val d = size.minDimension - strokeW
                val r = d / 2
                val c = Offset(size.width / 2, size.height / 2)

                drawCircle(color = Color(0xFF1B2236), radius = r, center = c, style = Stroke(strokeW))

                val sweep = (micro.percentage / 100f * 360f).coerceIn(10f, 360f)
                drawArc(
                    color = when {
                        micro.percentage >= 100 -> Color(0xFF10B981)
                        micro.percentage >= 80 -> Color(0xFF2DE1FC)
                        else -> Color(0xFFFF8A3D)
                    },
                    startAngle = -90f,
                    sweepAngle = sweep,
                    useCenter = false,
                    style = Stroke(strokeW, cap = StrokeCap.Round),
                    topLeft = Offset(c.x - r, c.y - r),
                    size = Size(d, d)
                )
            }

            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(micro.shortName, color = Color.White.copy(alpha = 0.6f), fontSize = 7.5.sp)
                Text("${micro.percentage}%", color = Color.White, fontSize = 9.sp, fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
fun MealRowCard(
    meal: Meal,
    onClick: () -> Unit
) {
    Surface(
        onClick = onClick,
        color = Color(0xFF131728),
        shape = RoundedCornerShape(16.dp),
        border = BorderStroke(1.dp, Color(0xFF1F263E)),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            // Food Thumbnail / Avatar
            Box(
                modifier = Modifier
                    .size(42.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(Color(0xFF1A2138)),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = when (meal.mealType) {
                        MealType.BREAKFAST -> "🍳"
                        MealType.LUNCH -> "🥗"
                        MealType.SNACK -> "🍌"
                        MealType.DINNER -> "🍲"
                        MealType.OTHER -> "🍽️"
                    },
                    fontSize = 20.sp
                )
            }

            Spacer(Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        meal.mealType.name.lowercase().replaceFirstChar { it.uppercase() },
                        color = Color.White,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(Modifier.width(6.dp))
                    Text(meal.timestamp, color = Color.White.copy(alpha = 0.35f), fontSize = 9.sp)
                }
                Spacer(Modifier.height(2.dp))
                Text(
                    meal.title,
                    color = Color.White.copy(alpha = 0.6f),
                    fontSize = 10.5.sp,
                    maxLines = 1
                )
            }

            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    "${meal.totalCalories} kcal",
                    color = Color.White,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold
                )
                Spacer(Modifier.width(6.dp))
                Icon(
                    Icons.Default.MoreVert,
                    contentDescription = "Options",
                    tint = Color.White.copy(alpha = 0.4f),
                    modifier = Modifier.size(16.dp)
                )
            }
        }
    }
}
