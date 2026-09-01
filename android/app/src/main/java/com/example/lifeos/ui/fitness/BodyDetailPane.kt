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
import com.example.lifeos.data.models.BodyCompositionMetrics
import com.example.lifeos.ui.fitness.components.*

@Composable
fun BodyDetailPane(
    body: BodyCompositionMetrics,
    onRecordWeight: (Float) -> Unit,
    modifier: Modifier = Modifier
) {
    var weightInput by remember { mutableStateOf("${body.weightKg}") }

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
                            .background(AccentPurpleGlow.copy(alpha = 0.15f), CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Default.AccessibilityNew, null, tint = AccentPurpleGlow, modifier = Modifier.size(18.dp))
                    }
                    Spacer(Modifier.width(10.dp))
                    Text("Body Composition", color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                }

                Text("This Month ▾", color = Color.White.copy(alpha = 0.45f), fontSize = 11.sp)
            }

            Spacer(Modifier.height(16.dp))

            // 4 Metrics Grid
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                BodyStatCard("Weight", "${body.weightKg} kg", "Trend ↓ 0.7 kg", AccentPurpleGlow, Modifier.weight(1f))
                BodyStatCard("Body Fat", "${body.bodyFatPct}%", "Healthy range", AccentCyanGlow, Modifier.weight(1f))
                BodyStatCard("Muscle Mass", "${body.muscleMassKg} kg", "High (+0.4)", AccentGreenGlow, Modifier.weight(1f))
                BodyStatCard("BMI", "${body.bmi}", "Normal (18.5-24.9)", AccentOrange, Modifier.weight(1f))
            }

            Spacer(Modifier.height(20.dp))

            Text("Weight & Composition Trend", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(10.dp))

            // Trend Chart Box
            Surface(
                color = Color(0xFF141829),
                shape = RoundedCornerShape(16.dp),
                border = BorderStroke(1.dp, Color(0xFF222944)),
                modifier = Modifier.fillMaxWidth().height(140.dp)
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    SparklineGraph(
                        dataPoints = body.trendHistory.map { it.weightKg },
                        lineColor = AccentPurpleGlow,
                        modifier = Modifier.fillMaxWidth().height(80.dp)
                    )
                    Spacer(Modifier.height(8.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        body.trendHistory.forEach { point ->
                            Text(point.date, color = Color.White.copy(alpha = 0.4f), fontSize = 8.5.sp)
                        }
                    }
                }
            }

            Spacer(Modifier.weight(1f))

            // Quick Record Weight Form
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(14.dp))
                    .background(Color(0xFF14192B))
                    .padding(8.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedTextField(
                    value = weightInput,
                    onValueChange = { weightInput = it },
                    label = { Text("Log Weight (kg)", fontSize = 8.sp) },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White,
                        focusedBorderColor = AccentPurpleGlow,
                        unfocusedBorderColor = Color(0xFF222944)
                    ),
                    modifier = Modifier.weight(1f).height(50.dp)
                )

                Button(
                    onClick = {
                        val w = weightInput.toFloatOrNull() ?: 72.4f
                        onRecordWeight(w)
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = AccentPurpleGlow),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.height(44.dp)
                ) {
                    Text("Save", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
fun BodyStatCard(label: String, value: String, subtitle: String, color: Color, modifier: Modifier) {
    Surface(
        color = Color(0xFF141829),
        shape = RoundedCornerShape(14.dp),
        border = BorderStroke(1.dp, Color(0xFF222944)),
        modifier = modifier
    ) {
        Column(modifier = Modifier.padding(10.dp)) {
            Text(label, color = Color.White.copy(alpha = 0.4f), fontSize = 8.5.sp)
            Spacer(Modifier.height(4.dp))
            Text(value, color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Black)
            Spacer(Modifier.height(2.dp))
            Text(subtitle, color = color, fontSize = 8.sp, maxLines = 1)
        }
    }
}
