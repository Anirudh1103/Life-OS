package com.example.lifeos.ui.fitness.components

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.DirectionsRun
import androidx.compose.material.icons.automirrored.filled.TrendingUp
import androidx.compose.material.icons.automirrored.outlined.TrendingUp
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.*
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.lifeos.data.models.*
import com.example.lifeos.ui.viewmodels.FitnessTab

// Color Constants matching reference design
val FitnessBg = Color(0xFF090C15)
val FitnessCardBg = Color(0xFF101423)
val FitnessCardBorder = Color(0xFF1E2438)
val AccentPurpleGlow = Color(0xFF8A5DF2)
val AccentOrange = Color(0xFFFF8A3D)
val AccentCyanGlow = Color(0xFF2DE1FC)
val AccentGreenGlow = Color(0xFF10B981)
val AccentBlueGlow = Color(0xFF3B82F6)

/**
 * Top Fitness Header with greeting, subtitle, date selector, and Jarvis voice search bar.
 */
@Composable
fun FitnessHeader(
    dateString: String,
    onPrevDate: () -> Unit,
    onNextDate: () -> Unit,
    onOpenJarvisFoodLogging: () -> Unit,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 24.dp, vertical = 14.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = "Good morning, Anirudh",
                    color = Color.White,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold
                )
                Spacer(Modifier.width(6.dp))
                Text("👋", fontSize = 18.sp)
            }
            Spacer(Modifier.height(2.dp))
            Text(
                text = "Let's build a better you, every day.",
                color = Color.White.copy(alpha = 0.45f),
                fontSize = 12.sp,
                fontWeight = FontWeight.Normal
            )
        }

        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // Ask Jarvis Search Input Bar with Glowing Voice Action
            Surface(
                onClick = onOpenJarvisFoodLogging,
                color = Color(0xFF14192A),
                shape = RoundedCornerShape(20.dp),
                border = BorderStroke(1.dp, Color(0xFF252D47)),
                modifier = Modifier.widthIn(min = 260.dp, max = 340.dp).height(42.dp)
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 14.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        Icons.Default.Search,
                        contentDescription = "Search",
                        tint = Color.White.copy(alpha = 0.4f),
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(Modifier.width(8.dp))
                    Text(
                        text = "Ask Jarvis anything...",
                        color = Color.White.copy(alpha = 0.35f),
                        fontSize = 12.sp,
                        modifier = Modifier.weight(1f)
                    )
                    // Voice Purple Orb
                    Box(
                        modifier = Modifier
                            .size(28.dp)
                            .clip(CircleShape)
                            .background(
                                Brush.linearGradient(
                                    listOf(Color(0xFF8A5DF2), Color(0xFF6366F1))
                                )
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            Icons.Default.Mic,
                            contentDescription = "Voice",
                            tint = Color.White,
                            modifier = Modifier.size(14.dp)
                        )
                    }
                }
            }
        }
    }
}

/**
 * 1. Activity Card: Activity Ring, Steps, Distance, Active Calories, Move Time with Empty/Loading States
 */
@Composable
fun ActivityCard(
    state: HealthUiState<DailyActivity>,
    modifier: Modifier = Modifier
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = FitnessCardBg),
        shape = RoundedCornerShape(20.dp),
        border = BorderStroke(1.dp, FitnessCardBorder),
        modifier = modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(18.dp)) {
            // Card Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(28.dp)
                            .background(AccentCyanGlow.copy(alpha = 0.15f), CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            Icons.AutoMirrored.Filled.DirectionsRun,
                            contentDescription = null,
                            tint = AccentCyanGlow,
                            modifier = Modifier.size(16.dp)
                        )
                    }
                    Spacer(Modifier.width(8.dp))
                    Text(
                        text = "Activity",
                        color = Color.White,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold
                    )
                }

                // Live / Auto-synced Badge
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier
                        .background(AccentCyanGlow.copy(alpha = 0.12f), RoundedCornerShape(12.dp))
                        .padding(horizontal = 8.dp, vertical = 3.dp)
                ) {
                    Box(modifier = Modifier.size(6.dp).background(AccentCyanGlow, CircleShape))
                    Spacer(Modifier.width(4.dp))
                    Text("LIVE", color = AccentCyanGlow, fontSize = 9.sp, fontWeight = FontWeight.Black)
                }
            }

            Spacer(Modifier.height(14.dp))

            when (state) {
                is HealthUiState.Loading -> {
                    HealthLoadingSkeleton(height = 100.dp)
                }
                is HealthUiState.Empty -> {
                    HealthEmptyStateView(
                        icon = Icons.AutoMirrored.Filled.DirectionsRun,
                        title = "No activity data yet",
                        subtitle = "Connect Apple Health to view your daily activity rings."
                    )
                }
                is HealthUiState.Error -> {
                    HealthErrorView(message = state.message)
                }
                is HealthUiState.Success -> {
                    val activity = state.data
                    val stepRatio = (activity.steps.toFloat() / activity.move_goal.toFloat().coerceAtLeast(1f)).coerceIn(0f, 1f)

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        // Left: Circular Activity Ring
                        Box(
                            contentAlignment = Alignment.Center,
                            modifier = Modifier.size(76.dp)
                        ) {
                            Canvas(modifier = Modifier.size(76.dp)) {
                                drawCircle(
                                    color = Color(0xFF1B2236),
                                    style = Stroke(width = 7.dp.toPx())
                                )
                                drawArc(
                                    brush = Brush.sweepGradient(
                                        listOf(AccentCyanGlow, Color(0xFF6366F1), AccentCyanGlow)
                                    ),
                                    startAngle = -90f,
                                    sweepAngle = stepRatio * 360f,
                                    useCenter = false,
                                    style = Stroke(width = 7.dp.toPx(), cap = StrokeCap.Round)
                                )
                            }
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text(
                                    text = "${(stepRatio * 100).toInt()}%",
                                    color = Color.White,
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Black
                                )
                                Text(
                                    text = "Goal",
                                    color = Color.White.copy(alpha = 0.4f),
                                    fontSize = 8.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }

                        Spacer(Modifier.width(14.dp))

                        // Right: Primary Steps and Target
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "Daily Steps",
                                color = Color.White.copy(alpha = 0.45f),
                                fontSize = 9.5.sp,
                                fontWeight = FontWeight.Medium
                            )
                            Row(verticalAlignment = Alignment.Bottom) {
                                Text(
                                    text = "%,d".format(activity.steps),
                                    color = Color.White,
                                    fontSize = 20.sp,
                                    fontWeight = FontWeight.Black
                                )
                                Spacer(Modifier.width(4.dp))
                                Text(
                                    text = "/ %,d".format(activity.move_goal),
                                    color = Color.White.copy(alpha = 0.4f),
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Normal
                                )
                            }
                        }
                    }

                    Spacer(Modifier.height(14.dp))

                    // Bottom 3 Metric Highlights (Distance, Active Calories, Move Minutes)
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(Color(0xFF14192B))
                            .padding(vertical = 8.dp, horizontal = 10.dp),
                        horizontalArrangement = Arrangement.SpaceAround
                    ) {
                        ActivityMetricItem("Distance", "${activity.distance_km} km", AccentCyanGlow)
                        ActivityMetricItem("Active Burn", "${activity.active_calories} kcal", AccentOrange)
                        ActivityMetricItem("Move Time", "${activity.exercise_minutes} min", AccentGreenGlow)
                    }
                }
            }
        }
    }
}

/**
 * 2. Workout Card: Recent Synced / Active Workout with Source Tag
 */
@Composable
fun WorkoutCard(
    state: HealthUiState<List<WorkoutRecord>>,
    onStartWorkout: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = FitnessCardBg),
        shape = RoundedCornerShape(20.dp),
        border = BorderStroke(1.dp, FitnessCardBorder),
        modifier = modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(18.dp)) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(28.dp)
                            .background(AccentGreenGlow.copy(alpha = 0.15f), CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            Icons.Default.FitnessCenter,
                            contentDescription = null,
                            tint = AccentGreenGlow,
                            modifier = Modifier.size(16.dp)
                        )
                    }
                    Spacer(Modifier.width(8.dp))
                    Text(
                        text = "Workout",
                        color = Color.White,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold
                    )
                }

                // Apple Health / Synced badge
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier
                        .background(AccentGreenGlow.copy(alpha = 0.12f), RoundedCornerShape(10.dp))
                        .padding(horizontal = 8.dp, vertical = 3.dp)
                ) {
                    Icon(Icons.Default.Check, contentDescription = null, tint = AccentGreenGlow, modifier = Modifier.size(10.dp))
                    Spacer(Modifier.width(3.dp))
                    Text("Apple Health", color = AccentGreenGlow, fontSize = 8.5.sp, fontWeight = FontWeight.Bold)
                }
            }

            Spacer(Modifier.height(14.dp))

            when (state) {
                is HealthUiState.Loading -> {
                    HealthLoadingSkeleton(height = 100.dp)
                }
                is HealthUiState.Empty -> {
                    HealthEmptyStateView(
                        icon = Icons.Default.FitnessCenter,
                        title = "No workouts synced yet",
                        subtitle = "Workouts from Apple Watch will appear here automatically."
                    )
                }
                is HealthUiState.Error -> {
                    HealthErrorView(message = state.message)
                }
                is HealthUiState.Success -> {
                    val latest = state.data.firstOrNull()
                    if (latest != null) {
                        val durationMins = latest.duration_seconds / 60
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1.3f)) {
                                Text(
                                    text = latest.title ?: latest.workout_type,
                                    color = Color.White,
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = "${durationMins} min • ${latest.active_calories ?: 380} active kcal",
                                    color = Color.White.copy(alpha = 0.5f),
                                    fontSize = 11.sp
                                )

                                Spacer(Modifier.height(10.dp))

                                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    Surface(
                                        color = Color(0xFF14192B),
                                        shape = RoundedCornerShape(8.dp)
                                    ) {
                                        Text(
                                            "Avg HR: ${latest.average_heart_rate ?: 138} bpm",
                                            color = AccentOrange,
                                            fontSize = 9.sp,
                                            fontWeight = FontWeight.Bold,
                                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 3.dp)
                                        )
                                    }
                                }
                            }

                            // Body Silhouette Vector
                            Box(
                                modifier = Modifier.size(64.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                BodySilhouetteVector(modifier = Modifier.size(54.dp))
                            }
                        }
                    } else {
                        HealthEmptyStateView(
                            icon = Icons.Default.FitnessCenter,
                            title = "No workouts logged today",
                            subtitle = "Start a session or sync from your Apple Watch."
                        )
                    }
                }
            }
        }
    }
}

/**
 * 3. Heart & Vitals Card: Resting HR, HRV, SpO2, Respiratory Rate, Blood Pressure
 */
@Composable
fun HeartVitalsCard(
    state: HealthUiState<VitalsDisplaySummary>,
    modifier: Modifier = Modifier
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = FitnessCardBg),
        shape = RoundedCornerShape(20.dp),
        border = BorderStroke(1.dp, FitnessCardBorder),
        modifier = modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(18.dp)) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(28.dp)
                            .background(Color(0xFFF43F5E).copy(alpha = 0.15f), CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            Icons.Default.Favorite,
                            contentDescription = null,
                            tint = Color(0xFFF43F5E),
                            modifier = Modifier.size(16.dp)
                        )
                    }
                    Spacer(Modifier.width(8.dp))
                    Text(
                        text = "Heart & Vitals",
                        color = Color.White,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold
                    )
                }

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier
                        .background(Color(0xFFF43F5E).copy(alpha = 0.12f), RoundedCornerShape(10.dp))
                        .padding(horizontal = 8.dp, vertical = 3.dp)
                ) {
                    Icon(Icons.Default.Check, null, tint = Color(0xFFF43F5E), modifier = Modifier.size(10.dp))
                    Spacer(Modifier.width(3.dp))
                    Text("Apple Health", color = Color(0xFFF43F5E), fontSize = 8.5.sp, fontWeight = FontWeight.Bold)
                }
            }

            Spacer(Modifier.height(14.dp))

            when (state) {
                is HealthUiState.Loading -> {
                    HealthLoadingSkeleton(height = 80.dp)
                }
                is HealthUiState.Empty -> {
                    HealthEmptyStateView(
                        icon = Icons.Default.Favorite,
                        title = "No vitals data yet",
                        subtitle = "Heart rate, HRV, and SpO2 will appear when synced."
                    )
                }
                is HealthUiState.Error -> {
                    HealthErrorView(message = state.message)
                }
                is HealthUiState.Success -> {
                    val vitals = state.data
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        VitalMetricBox(
                            label = "Resting HR",
                            value = vitals.restingHeartRateBpm?.let { "$it bpm" } ?: "No data",
                            color = Color(0xFFF43F5E),
                            modifier = Modifier.weight(1f)
                        )
                        VitalMetricBox(
                            label = "HRV",
                            value = vitals.hrvMs?.let { "$it ms" } ?: "No data",
                            color = AccentPurpleGlow,
                            modifier = Modifier.weight(1f)
                        )
                        VitalMetricBox(
                            label = "SpO2",
                            value = vitals.oxygenSaturationPct?.let { "$it%" } ?: "No data",
                            color = AccentCyanGlow,
                            modifier = Modifier.weight(1f)
                        )
                        VitalMetricBox(
                            label = "Respiratory",
                            value = vitals.respiratoryRatePerMin?.let { "$it / min" } ?: "No data",
                            color = AccentGreenGlow,
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
            }
        }
    }
}

/**
 * 4. Sleep Card: Sleep duration, visual stage breakdown (Deep, REM, Light)
 */
@Composable
fun SleepCard(
    state: HealthUiState<SleepDisplaySummary>,
    modifier: Modifier = Modifier
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = FitnessCardBg),
        shape = RoundedCornerShape(20.dp),
        border = BorderStroke(1.dp, FitnessCardBorder),
        modifier = modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(18.dp)) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(28.dp)
                            .background(AccentPurpleGlow.copy(alpha = 0.15f), CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            Icons.Default.Bedtime,
                            contentDescription = null,
                            tint = AccentPurpleGlow,
                            modifier = Modifier.size(16.dp)
                        )
                    }
                    Spacer(Modifier.width(8.dp))
                    Text(
                        text = "Sleep & Recovery",
                        color = Color.White,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold
                    )
                }

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier
                        .background(AccentPurpleGlow.copy(alpha = 0.12f), RoundedCornerShape(10.dp))
                        .padding(horizontal = 8.dp, vertical = 3.dp)
                ) {
                    Icon(Icons.Default.Check, null, tint = AccentPurpleGlow, modifier = Modifier.size(10.dp))
                    Spacer(Modifier.width(3.dp))
                    Text("Apple Watch", color = AccentPurpleGlow, fontSize = 8.5.sp, fontWeight = FontWeight.Bold)
                }
            }

            Spacer(Modifier.height(14.dp))

            when (state) {
                is HealthUiState.Loading -> {
                    HealthLoadingSkeleton(height = 90.dp)
                }
                is HealthUiState.Empty -> {
                    HealthEmptyStateView(
                        icon = Icons.Default.Bedtime,
                        title = "No sleep records yet",
                        subtitle = "Wear your Apple Watch to bed to track sleep stages."
                    )
                }
                is HealthUiState.Error -> {
                    HealthErrorView(message = state.message)
                }
                is HealthUiState.Success -> {
                    val sleep = state.data
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.Bottom
                    ) {
                        Column {
                            Text("Total Sleep", color = Color.White.copy(alpha = 0.45f), fontSize = 9.5.sp)
                            Text(sleep.totalHoursMinutes, color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.Black)
                        }
                        Text("Quality: Optimal", color = AccentGreenGlow, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                    }

                    Spacer(Modifier.height(10.dp))

                    // Visual Sleep Stages Multi-Segment Bar
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(8.dp)
                            .clip(RoundedCornerShape(4.dp))
                    ) {
                        Box(modifier = Modifier.weight(sleep.deepRatio.coerceAtLeast(0.05f)).fillMaxHeight().background(Color(0xFF3B82F6)))
                        Box(modifier = Modifier.weight(sleep.remRatio.coerceAtLeast(0.05f)).fillMaxHeight().background(Color(0xFF8A5DF2)))
                        Box(modifier = Modifier.weight(sleep.lightRatio.coerceAtLeast(0.05f)).fillMaxHeight().background(Color(0xFF2DE1FC)))
                    }

                    Spacer(Modifier.height(10.dp))

                    // Stages Breakdown Details
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        SleepStageChip("Deep", sleep.deepHoursMinutes ?: "1h 32m", Color(0xFF3B82F6))
                        SleepStageChip("REM", sleep.remHoursMinutes ?: "1h 48m", Color(0xFF8A5DF2))
                        SleepStageChip("Light", sleep.lightHoursMinutes ?: "4h 22m", Color(0xFF2DE1FC))
                    }
                }
            }
        }
    }
}

/**
 * 5. Body Overview Card: Weight, Body Fat %, Muscle Mass, VO2 Max, Sparkline
 */
@Composable
fun BodyOverviewCard(
    state: HealthUiState<BodyDisplaySummary>,
    modifier: Modifier = Modifier
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = FitnessCardBg),
        shape = RoundedCornerShape(20.dp),
        border = BorderStroke(1.dp, FitnessCardBorder),
        modifier = modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(18.dp)) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(28.dp)
                            .background(AccentPurpleGlow.copy(alpha = 0.15f), CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            Icons.Default.AccessibilityNew,
                            contentDescription = null,
                            tint = AccentPurpleGlow,
                            modifier = Modifier.size(16.dp)
                        )
                    }
                    Spacer(Modifier.width(8.dp))
                    Text(
                        text = "Body Composition",
                        color = Color.White,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold
                    )
                }

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier
                        .background(AccentPurpleGlow.copy(alpha = 0.12f), RoundedCornerShape(10.dp))
                        .padding(horizontal = 8.dp, vertical = 3.dp)
                ) {
                    Icon(Icons.Default.Check, null, tint = AccentPurpleGlow, modifier = Modifier.size(10.dp))
                    Spacer(Modifier.width(3.dp))
                    Text("Synced", color = AccentPurpleGlow, fontSize = 8.5.sp, fontWeight = FontWeight.Bold)
                }
            }

            Spacer(Modifier.height(14.dp))

            when (state) {
                is HealthUiState.Loading -> {
                    HealthLoadingSkeleton(height = 90.dp)
                }
                is HealthUiState.Empty -> {
                    HealthEmptyStateView(
                        icon = Icons.Default.AccessibilityNew,
                        title = "No body measurements yet",
                        subtitle = "Weight and body fat metrics will display here."
                    )
                }
                is HealthUiState.Error -> {
                    HealthErrorView(message = state.message)
                }
                is HealthUiState.Success -> {
                    val body = state.data
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text("Weight", color = Color.White.copy(alpha = 0.45f), fontSize = 9.5.sp)
                            Row(verticalAlignment = Alignment.Bottom) {
                                Text("${body.weightKg ?: 72.4f}", color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.Black)
                                Spacer(Modifier.width(3.dp))
                                Text("kg", color = Color.White.copy(alpha = 0.4f), fontSize = 11.sp)
                            }
                            Text("Body Fat: ${body.bodyFatPct ?: 15.2f}%", color = AccentCyanGlow, fontSize = 9.5.sp, fontWeight = FontWeight.Bold)
                            Text("VO2 Max: ${body.vo2Max ?: 47f}", color = AccentGreenGlow, fontSize = 9.5.sp, fontWeight = FontWeight.Bold)
                        }

                        // Sparkline Mini Graph
                        if (body.trendHistory.isNotEmpty()) {
                            SparklineGraph(
                                dataPoints = body.trendHistory.map { it.weightKg },
                                lineColor = AccentPurpleGlow,
                                modifier = Modifier.size(80.dp, 40.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}

/**
 * 6. Progress Overview Card: Workout sessions, active burn, steps average, sleep average
 */
@Composable
fun ProgressOverviewCard(
    state: HealthUiState<ProgressSummaryMetrics>,
    modifier: Modifier = Modifier
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = FitnessCardBg),
        shape = RoundedCornerShape(20.dp),
        border = BorderStroke(1.dp, FitnessCardBorder),
        modifier = modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(18.dp)) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(28.dp)
                            .background(AccentBlueGlow.copy(alpha = 0.15f), CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            Icons.AutoMirrored.Filled.TrendingUp,
                            contentDescription = null,
                            tint = AccentBlueGlow,
                            modifier = Modifier.size(16.dp)
                        )
                    }
                    Spacer(Modifier.width(8.dp))
                    Text(
                        text = "Progress",
                        color = Color.White,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold
                    )
                }

                Text("This Month ▾", color = Color.White.copy(alpha = 0.45f), fontSize = 10.sp)
            }

            Spacer(Modifier.height(14.dp))

            when (state) {
                is HealthUiState.Loading -> {
                    HealthLoadingSkeleton(height = 90.dp)
                }
                is HealthUiState.Empty -> {
                    HealthEmptyStateView(
                        icon = Icons.AutoMirrored.Filled.TrendingUp,
                        title = "No progress records yet",
                        subtitle = "Monthly analytics will generate as activities sync."
                    )
                }
                is HealthUiState.Error -> {
                    HealthErrorView(message = state.message)
                }
                is HealthUiState.Success -> {
                    val progress = state.data
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        ProgressMiniStat("Workouts", "${progress.workoutsCount}", progress.workoutsDelta, AccentGreenGlow, Modifier.weight(1f))
                        ProgressMiniStat("Active Burn", "${progress.activeCalories}", progress.caloriesDelta, AccentOrange, Modifier.weight(1f))
                        ProgressMiniStat("Avg Steps", "${progress.avgSteps}", progress.stepsDelta, AccentCyanGlow, Modifier.weight(1f))
                    }
                }
            }
        }
    }
}

/**
 * 7. Nutrition Overview Card (Separate LifeOS Nutrition System)
 */
@Composable
fun NutritionOverviewCard(
    totals: DailyNutritionTotals,
    onOpenDetails: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = FitnessCardBg),
        shape = RoundedCornerShape(20.dp),
        border = BorderStroke(1.dp, FitnessCardBorder),
        modifier = modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(18.dp)) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(28.dp)
                            .background(AccentOrange.copy(alpha = 0.15f), CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            Icons.Default.Restaurant,
                            contentDescription = null,
                            tint = AccentOrange,
                            modifier = Modifier.size(16.dp)
                        )
                    }
                    Spacer(Modifier.width(8.dp))
                    Text(
                        text = "Nutrition",
                        color = Color.White,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold
                    )
                }

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.clickable { onOpenDetails() }
                ) {
                    Text(
                        text = "Details",
                        color = AccentCyanGlow,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Icon(
                        Icons.Default.ChevronRight,
                        contentDescription = null,
                        tint = AccentCyanGlow,
                        modifier = Modifier.size(14.dp)
                    )
                }
            }

            Spacer(Modifier.height(14.dp))

            // Main Calories and Remaining
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Bottom
            ) {
                Column {
                    Row(verticalAlignment = Alignment.Bottom) {
                        Text(
                            "${totals.caloriesConsumed}",
                            color = Color.White,
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Black
                        )
                        Text(
                            " / ${totals.caloriesTarget} kcal",
                            color = Color.White.copy(alpha = 0.45f),
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Normal
                        )
                    }
                    Spacer(Modifier.height(2.dp))
                    Text(
                        text = "${totals.caloriesRemaining} kcal remaining",
                        color = AccentOrange,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold
                    )
                }

                // Mini Macro Breakdown
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    MacroMiniBar("P", "${totals.proteinConsumed.toInt()}g", totals.proteinConsumed / totals.proteinTarget, AccentGreenGlow)
                    MacroMiniBar("C", "${totals.carbsConsumed.toInt()}g", totals.carbsConsumed / totals.carbsTarget, AccentBlueGlow)
                    MacroMiniBar("F", "${totals.fatConsumed.toInt()}g", totals.fatConsumed / totals.fatTarget, AccentPurpleGlow)
                }
            }

            Spacer(Modifier.height(14.dp))

            // Dynamic Meal Chips Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                totals.meals.forEach { meal ->
                    MealQuickChip(
                        name = meal.mealType.name.lowercase().replaceFirstChar { it.uppercase() },
                        calories = "${meal.totalCalories}",
                        icon = meal.iconEmoji,
                        isLogged = true,
                        modifier = Modifier.weight(1f)
                    )
                }
            }
        }
    }
}

/**
 * 8. Quick Actions Row
 */
@Composable
fun QuickActionsRow(
    onLogWorkout: () -> Unit,
    onLogFood: () -> Unit,
    onTrackBody: () -> Unit,
    onViewProgress: () -> Unit,
    onSeedDevData: () -> Unit = {},
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        QuickActionButton("Log Workout", Icons.Default.FitnessCenter, AccentGreenGlow, onLogWorkout, Modifier.weight(1f))
        QuickActionButton("Log Food", Icons.Default.AutoAwesome, AccentPurpleGlow, onLogFood, Modifier.weight(1f))
        QuickActionButton("Track Body", Icons.Default.AccessibilityNew, AccentCyanGlow, onTrackBody, Modifier.weight(1f))
        QuickActionButton("View Progress", Icons.AutoMirrored.Filled.TrendingUp, AccentOrange, onViewProgress, Modifier.weight(1f))
    }
}

// -------------------------------------------------------------
// HELPER COMPOSABLES
// -------------------------------------------------------------

@Composable
fun ActivityMetricItem(label: String, value: String, color: Color) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(label, color = Color.White.copy(alpha = 0.4f), fontSize = 8.5.sp)
        Spacer(Modifier.height(2.dp))
        Text(value, color = color, fontSize = 11.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
fun VitalMetricBox(label: String, value: String, color: Color, modifier: Modifier) {
    Surface(
        color = Color(0xFF14192B),
        shape = RoundedCornerShape(12.dp),
        border = BorderStroke(1.dp, Color(0xFF222944)),
        modifier = modifier
    ) {
        Column(modifier = Modifier.padding(10.dp)) {
            Text(label, color = Color.White.copy(alpha = 0.45f), fontSize = 8.5.sp)
            Spacer(Modifier.height(4.dp))
            Text(value, color = color, fontSize = 11.5.sp, fontWeight = FontWeight.Bold, maxLines = 1)
        }
    }
}

@Composable
fun SleepStageChip(stage: String, duration: String, color: Color) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Box(modifier = Modifier.size(6.dp).background(color, CircleShape))
        Spacer(Modifier.width(4.dp))
        Text("$stage: ", color = Color.White.copy(alpha = 0.45f), fontSize = 8.5.sp)
        Text(duration, color = Color.White, fontSize = 9.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
fun ProgressMiniStat(label: String, value: String, delta: String, color: Color, modifier: Modifier) {
    Surface(
        color = Color(0xFF14192B),
        shape = RoundedCornerShape(12.dp),
        border = BorderStroke(1.dp, Color(0xFF222944)),
        modifier = modifier
    ) {
        Column(modifier = Modifier.padding(8.dp)) {
            Text(label, color = Color.White.copy(alpha = 0.45f), fontSize = 8.sp)
            Spacer(Modifier.height(2.dp))
            Text(value, color = Color.White, fontSize = 11.5.sp, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(2.dp))
            Text(delta, color = color, fontSize = 7.5.sp, maxLines = 1)
        }
    }
}

@Composable
fun MacroMiniBar(label: String, value: String, ratio: Float, color: Color) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(label, color = color, fontSize = 9.sp, fontWeight = FontWeight.Bold)
            Spacer(Modifier.width(2.dp))
            Text(value, color = Color.White, fontSize = 9.sp, fontWeight = FontWeight.Medium)
        }
        Spacer(Modifier.height(3.dp))
        Box(
            modifier = Modifier
                .width(36.dp)
                .height(3.dp)
                .clip(RoundedCornerShape(2.dp))
                .background(Color(0xFF1E2438))
        ) {
            Box(
                modifier = Modifier
                    .fillMaxHeight()
                    .fillMaxWidth(ratio.coerceIn(0f, 1f))
                    .background(color)
            )
        }
    }
}

@Composable
fun MealQuickChip(name: String, calories: String, icon: String, isLogged: Boolean, modifier: Modifier) {
    Surface(
        color = Color(0xFF14192B),
        shape = RoundedCornerShape(10.dp),
        border = BorderStroke(1.dp, Color(0xFF222944)),
        modifier = modifier
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 6.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center
        ) {
            Text(icon, fontSize = 11.sp)
            Spacer(Modifier.width(3.dp))
            Column {
                Text(name, color = Color.White.copy(alpha = 0.5f), fontSize = 7.5.sp)
                Text(calories, color = Color.White, fontSize = 9.sp, fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
fun QuickActionButton(title: String, icon: ImageVector, color: Color, onClick: () -> Unit, modifier: Modifier) {
    Surface(
        onClick = onClick,
        color = Color(0xFF141828),
        shape = RoundedCornerShape(12.dp),
        border = BorderStroke(1.dp, Color(0xFF222944)),
        modifier = modifier.height(44.dp)
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center
        ) {
            Icon(icon, contentDescription = null, tint = color, modifier = Modifier.size(14.dp))
            Spacer(Modifier.width(6.dp))
            Text(title, color = Color.White, fontSize = 10.5.sp, fontWeight = FontWeight.Bold, maxLines = 1)
        }
    }
}

@Composable
fun HealthEmptyStateView(icon: ImageVector, title: String, subtitle: String) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 12.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Box(
            modifier = Modifier
                .size(36.dp)
                .background(Color(0xFF14192B), CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Icon(icon, null, tint = Color.White.copy(alpha = 0.35f), modifier = Modifier.size(18.dp))
        }
        Spacer(Modifier.height(8.dp))
        Text(title, color = Color.White.copy(alpha = 0.7f), fontSize = 11.sp, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(2.dp))
        Text(subtitle, color = Color.White.copy(alpha = 0.35f), fontSize = 9.sp)
    }
}

@Composable
fun HealthLoadingSkeleton(height: androidx.compose.ui.unit.Dp) {
    val infiniteTransition = rememberInfiniteTransition(label = "skeleton")
    val alpha by infiniteTransition.animateFloat(
        initialValue = 0.1f,
        targetValue = 0.25f,
        animationSpec = infiniteRepeatable(
            animation = tween(800, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "skeleton_alpha"
    )
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(height)
            .clip(RoundedCornerShape(12.dp))
            .background(Color.White.copy(alpha = alpha))
    )
}

@Composable
fun HealthErrorView(message: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.Center
    ) {
        Icon(Icons.Default.ErrorOutline, null, tint = Color(0xFFF43F5E), modifier = Modifier.size(16.dp))
        Spacer(Modifier.width(6.dp))
        Text(message, color = Color(0xFFF43F5E), fontSize = 10.sp)
    }
}

@Composable
fun SparklineGraph(dataPoints: List<Float>, lineColor: Color, modifier: Modifier = Modifier) {
    if (dataPoints.isEmpty()) return
    val minVal = dataPoints.minOrNull() ?: 0f
    val maxVal = dataPoints.maxOrNull() ?: 1f
    val range = (maxVal - minVal).coerceAtLeast(0.1f)

    Canvas(modifier = modifier) {
        val width = size.width
        val height = size.height
        val stepX = width / (dataPoints.size - 1).coerceAtLeast(1)

        val path = Path()
        dataPoints.forEachIndexed { index, value ->
            val x = index * stepX
            val normalizedY = (value - minVal) / range
            val y = height - (normalizedY * height * 0.8f) - (height * 0.1f)
            if (index == 0) {
                path.moveTo(x, y)
            } else {
                path.lineTo(x, y)
            }
        }

        drawPath(
            path = path,
            color = lineColor,
            style = Stroke(width = 2.5.dp.toPx(), cap = StrokeCap.Round, join = StrokeJoin.Round)
        )
    }
}

@Composable
fun BodySilhouetteVector(modifier: Modifier = Modifier) {
    Canvas(modifier = modifier) {
        val w = size.width
        val h = size.height

        val outlineColor = Color(0xFF2DE1FC).copy(alpha = 0.6f)
        val glowColor = Color(0xFF2DE1FC).copy(alpha = 0.2f)

        // Head
        drawCircle(
            color = outlineColor,
            radius = w * 0.14f,
            center = Offset(w * 0.5f, h * 0.18f),
            style = Stroke(width = 2.dp.toPx())
        )

        // Torso Path
        val torso = Path().apply {
            moveTo(w * 0.32f, h * 0.32f)
            lineTo(w * 0.68f, h * 0.32f)
            lineTo(w * 0.62f, h * 0.65f)
            lineTo(w * 0.38f, h * 0.65f)
            close()
        }
        drawPath(torso, color = glowColor)
        drawPath(torso, color = outlineColor, style = Stroke(width = 1.5.dp.toPx()))

        // Arms
        drawLine(outlineColor, Offset(w * 0.32f, h * 0.35f), Offset(w * 0.18f, h * 0.62f), strokeWidth = 2.dp.toPx(), cap = StrokeCap.Round)
        drawLine(outlineColor, Offset(w * 0.68f, h * 0.35f), Offset(w * 0.82f, h * 0.62f), strokeWidth = 2.dp.toPx(), cap = StrokeCap.Round)

        // Legs
        drawLine(outlineColor, Offset(w * 0.42f, h * 0.65f), Offset(w * 0.38f, h * 0.95f), strokeWidth = 2.dp.toPx(), cap = StrokeCap.Round)
        drawLine(outlineColor, Offset(w * 0.58f, h * 0.65f), Offset(w * 0.62f, h * 0.95f), strokeWidth = 2.dp.toPx(), cap = StrokeCap.Round)
    }
}

@Composable
fun FitnessSecondaryBottomBar(
    currentTab: FitnessTab,
    onTabSelected: (FitnessTab) -> Unit,
    modifier: Modifier = Modifier
) {
    Surface(
        color = Color(0xFF0C0F1D),
        shape = RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp),
        border = BorderStroke(1.dp, Color(0xFF1E2438)),
        modifier = modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.SpaceAround,
            verticalAlignment = Alignment.CenterVertically
        ) {
            FitnessBottomNavItem("Overview", Icons.Default.Dashboard, currentTab == FitnessTab.OVERVIEW) { onTabSelected(FitnessTab.OVERVIEW) }
            FitnessBottomNavItem("Workout", Icons.Default.FitnessCenter, currentTab == FitnessTab.WORKOUT) { onTabSelected(FitnessTab.WORKOUT) }
            FitnessBottomNavItem("Nutrition", Icons.Default.Restaurant, currentTab == FitnessTab.NUTRITION) { onTabSelected(FitnessTab.NUTRITION) }
            FitnessBottomNavItem("Body", Icons.Default.AccessibilityNew, currentTab == FitnessTab.BODY) { onTabSelected(FitnessTab.BODY) }
            FitnessBottomNavItem("Progress", Icons.AutoMirrored.Filled.TrendingUp, currentTab == FitnessTab.PROGRESS) { onTabSelected(FitnessTab.PROGRESS) }
        }
    }
}

@Composable
fun FitnessBottomNavItem(label: String, icon: ImageVector, isSelected: Boolean, onClick: () -> Unit) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier
            .clip(RoundedCornerShape(8.dp))
            .clickable { onClick() }
            .padding(horizontal = 12.dp, vertical = 4.dp)
    ) {
        Icon(
            icon,
            contentDescription = label,
            tint = if (isSelected) AccentCyanGlow else Color.White.copy(alpha = 0.4f),
            modifier = Modifier.size(18.dp)
        )
        Spacer(Modifier.height(2.dp))
        Text(
            label,
            color = if (isSelected) AccentCyanGlow else Color.White.copy(alpha = 0.4f),
            fontSize = 9.sp,
            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
        )
    }
}
