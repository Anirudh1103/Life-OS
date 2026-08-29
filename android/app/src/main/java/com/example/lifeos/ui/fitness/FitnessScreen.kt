package com.example.lifeos.ui.fitness

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.DirectionsRun
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.MonitorWeight
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.lifeos.ui.viewmodels.DashboardViewModel
import com.example.lifeos.data.models.FitnessActivity

@Composable
fun FitnessScreen(
    modifier: Modifier = Modifier,
    viewModel: DashboardViewModel = viewModel()
) {
    val activities by viewModel.fitnessActivities.collectAsState()
    val darkBackground = MaterialTheme.colorScheme.background
    val cardBackground = MaterialTheme.colorScheme.surface
    val accentGreen = Color(0xFF00FFC6)
    val title = if (System.currentTimeMillis() % 2 == 0L) "Sir" else "Boss"

    Box(modifier = modifier.fillMaxSize().background(darkBackground)) {
        Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
            Text(
                "Fitness Console",
                color = MaterialTheme.colorScheme.onBackground,
                fontSize = 24.sp,
                fontWeight = FontWeight.Black
            )
            Spacer(modifier = Modifier.height(24.dp))

            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(16.dp),
                modifier = Modifier.fillMaxSize()
            ) {
                item {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                        ActivityOverviewCard(activities.size, accentGreen, cardBackground, Modifier.weight(1f))
                        WeightCard("72.5 kg", cardBackground, Modifier.weight(1f))
                    }
                }

                item {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.History, contentDescription = null, tint = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.6f), modifier = Modifier.size(14.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Session Logs", color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.6f), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }

                if (activities.isEmpty()) {
                    item {
                        Text("No kinetic logs detected, $title.", color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.3f), fontSize = 12.sp)
                    }
                } else {
                    items(activities) { activity ->
                        ActivityItem(activity, cardBackground)
                    }
                }
            }
        }
    }
}

@Composable
fun ActivityOverviewCard(count: Int, accent: Color, background: Color, modifier: Modifier) {
    Card(
        colors = CardDefaults.cardColors(containerColor = background),
        shape = RoundedCornerShape(24.dp),
        modifier = modifier
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            Icon(Icons.AutoMirrored.Filled.DirectionsRun, contentDescription = null, tint = accent, modifier = Modifier.size(24.dp))
            Spacer(modifier = Modifier.height(12.dp))
            Text("Sessions", color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f), fontSize = 12.sp)
            Text("$count", color = MaterialTheme.colorScheme.onSurface, fontSize = 24.sp, fontWeight = FontWeight.Black)
        }
    }
}

@Composable
fun WeightCard(weight: String, background: Color, modifier: Modifier) {
    Card(
        colors = CardDefaults.cardColors(containerColor = background),
        shape = RoundedCornerShape(24.dp),
        modifier = modifier
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            Icon(Icons.Default.MonitorWeight, contentDescription = null, tint = Color(0xFF2DE1FC), modifier = Modifier.size(24.dp))
            Spacer(modifier = Modifier.height(12.dp))
            Text("Weight", color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f), fontSize = 12.sp)
            Text(weight, color = MaterialTheme.colorScheme.onSurface, fontSize = 24.sp, fontWeight = FontWeight.Black)
        }
    }
}

@Composable
fun ActivityItem(activity: FitnessActivity, background: Color) {
    Card(
        colors = CardDefaults.cardColors(containerColor = background),
        shape = RoundedCornerShape(16.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(activity.notes ?: "Energy Output", color = MaterialTheme.colorScheme.onSurface, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                Text("${activity.duration_minutes} mins • ${activity.started_at.take(10)}", color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f), fontSize = 11.sp)
            }
            if (activity.calories != null) {
                Text(
                    text = "${activity.calories?.toInt()} kcal",
                    color = Color(0xFF00FFC6),
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Black
                )
            }
        }
    }
}
