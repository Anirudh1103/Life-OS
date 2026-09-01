package com.example.lifeos.ui.fitness

import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.lifeos.data.models.ProgressSummaryMetrics
import com.example.lifeos.ui.fitness.components.*

@Composable
fun ProgressDetailPane(
    progress: ProgressSummaryMetrics,
    modifier: Modifier = Modifier
) {
    var selectedFilter by remember { mutableStateOf("This Month") }
    val filters = listOf("Week", "This Month", "3 Months", "Year")

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
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(32.dp)
                            .background(AccentBlueGlow.copy(alpha = 0.15f), CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Default.TrendingUp, null, tint = AccentBlueGlow, modifier = Modifier.size(18.dp))
                    }
                    Spacer(Modifier.width(10.dp))
                    Text("Fitness Progress", color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                }
            }

            Spacer(Modifier.height(14.dp))

            // Time filters
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .background(Color(0xFF141829))
                    .padding(3.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                filters.forEach { filter ->
                    val isSelected = selectedFilter == filter
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(10.dp))
                            .background(if (isSelected) AccentBlueGlow else Color.Transparent)
                            .clickable { selectedFilter = filter }
                            .padding(vertical = 6.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            filter,
                            color = if (isSelected) Color.White else Color.White.copy(alpha = 0.5f),
                            fontSize = 10.5.sp,
                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium
                        )
                    }
                }
            }

            Spacer(Modifier.height(16.dp))

            LazyColumn(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                item {
                    ProgressMetricRow(
                        title = "Completed Workouts",
                        value = "${progress.workoutsCount} sessions",
                        delta = progress.workoutsDelta,
                        icon = Icons.Default.FitnessCenter,
                        color = AccentGreenGlow
                    )
                }

                item {
                    ProgressMetricRow(
                        title = "Active Calorie Burn",
                        value = "${progress.activeCalories} kcal",
                        delta = progress.caloriesDelta,
                        icon = Icons.Default.LocalFireDepartment,
                        color = AccentOrange
                    )
                }

                item {
                    ProgressMetricRow(
                        title = "Daily Step Average",
                        value = "${progress.avgSteps} steps/day",
                        delta = progress.stepsDelta,
                        icon = Icons.Default.DirectionsWalk,
                        color = AccentCyanGlow
                    )
                }

                item {
                    ProgressMetricRow(
                        title = "Sleep & Recovery",
                        value = progress.avgSleep,
                        delta = progress.sleepDelta,
                        icon = Icons.Default.Bedtime,
                        color = AccentPurpleGlow
                    )
                }

                item {
                    Spacer(Modifier.height(6.dp))
                    Text("Personal Records & Milestones", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(8.dp))
                    Surface(
                        color = Color(0xFF141829),
                        shape = RoundedCornerShape(14.dp),
                        border = BorderStroke(1.dp, Color(0xFF222944)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Row(horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
                                Text("🏆 Bench Press PR", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                Text("85 kg × 6 reps", color = AccentGreenGlow, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                            Row(horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
                                Text("🔥 Highest Daily Burn", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                Text("620 active kcal", color = AccentOrange, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                            Row(horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
                                Text("⚡ Active Movement Streak", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                Text("14 consecutive days", color = AccentCyanGlow, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun ProgressMetricRow(
    title: String,
    value: String,
    delta: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    color: Color
) {
    Surface(
        color = Color(0xFF141829),
        shape = RoundedCornerShape(14.dp),
        border = BorderStroke(1.dp, Color(0xFF222944)),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier.size(32.dp).background(color.copy(alpha = 0.15f), CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(icon, null, tint = color, modifier = Modifier.size(16.dp))
                }
                Spacer(Modifier.width(12.dp))
                Column {
                    Text(title, color = Color.White.copy(alpha = 0.5f), fontSize = 9.sp)
                    Text(value, color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                }
            }

            Text(delta, color = AccentGreenGlow, fontSize = 10.sp, fontWeight = FontWeight.Bold)
        }
    }
}
