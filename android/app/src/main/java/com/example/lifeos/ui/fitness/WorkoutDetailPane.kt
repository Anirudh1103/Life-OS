package com.example.lifeos.ui.fitness

import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.lifeos.data.models.WorkoutSessionDetail
import com.example.lifeos.data.models.WorkoutSetItem
import com.example.lifeos.ui.fitness.components.*

@Composable
fun WorkoutDetailPane(
    workout: WorkoutSessionDetail,
    onAddSet: (weight: Float, reps: Int) -> Unit,
    modifier: Modifier = Modifier
) {
    var newSetWeight by remember { mutableStateOf("80") }
    var newSetReps by remember { mutableStateOf("8") }

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
                            .background(AccentGreenGlow.copy(alpha = 0.15f), CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Default.FitnessCenter, null, tint = AccentGreenGlow, modifier = Modifier.size(18.dp))
                    }
                    Spacer(Modifier.width(10.dp))
                    Column {
                        Text(workout.name, color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                        Text(workout.muscleFocus, color = Color.White.copy(alpha = 0.45f), fontSize = 10.sp)
                    }
                }

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier
                        .background(AccentGreenGlow.copy(alpha = 0.15f), RoundedCornerShape(10.dp))
                        .padding(horizontal = 8.dp, vertical = 4.dp)
                ) {
                    Icon(Icons.Default.Check, null, tint = AccentGreenGlow, modifier = Modifier.size(12.dp))
                    Spacer(Modifier.width(4.dp))
                    Text("Completed", color = AccentGreenGlow, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                }
            }

            Spacer(Modifier.height(16.dp))

            // Metrics Row
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp))
                    .background(Color(0xFF141829))
                    .padding(14.dp),
                horizontalArrangement = Arrangement.SpaceAround
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("Duration", color = Color.White.copy(alpha = 0.4f), fontSize = 9.sp)
                    Text(workout.durationFormatted, color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                }
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("Calories Burned", color = Color.White.copy(alpha = 0.4f), fontSize = 9.sp)
                    Text("${workout.caloriesBurned} kcal", color = AccentOrange, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                }
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("Total Sets", color = Color.White.copy(alpha = 0.4f), fontSize = 9.sp)
                    Text("${workout.sets.size}", color = AccentCyanGlow, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                }
            }

            Spacer(Modifier.height(18.dp))

            // Set Table Header
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text("Set", color = Color.White.copy(alpha = 0.4f), fontSize = 10.sp, fontWeight = FontWeight.Bold, modifier = Modifier.width(36.dp))
                Text("Weight", color = Color.White.copy(alpha = 0.4f), fontSize = 10.sp, fontWeight = FontWeight.Bold, modifier = Modifier.width(60.dp))
                Text("Reps", color = Color.White.copy(alpha = 0.4f), fontSize = 10.sp, fontWeight = FontWeight.Bold, modifier = Modifier.width(50.dp))
                Text("Status", color = Color.White.copy(alpha = 0.4f), fontSize = 10.sp, fontWeight = FontWeight.Bold, modifier = Modifier.width(44.dp))
            }

            Spacer(Modifier.height(8.dp))

            // Sets List
            LazyColumn(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                items(workout.sets) { set ->
                    SetRowItem(set = set)
                }
            }

            Spacer(Modifier.height(12.dp))

            // Quick Add Set Form
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
                    value = newSetWeight,
                    onValueChange = { newSetWeight = it },
                    label = { Text("Weight (kg)", fontSize = 8.sp) },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White,
                        focusedBorderColor = AccentGreenGlow,
                        unfocusedBorderColor = Color(0xFF222944)
                    ),
                    modifier = Modifier.weight(1f).height(50.dp)
                )

                OutlinedTextField(
                    value = newSetReps,
                    onValueChange = { newSetReps = it },
                    label = { Text("Reps", fontSize = 8.sp) },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White,
                        focusedBorderColor = AccentGreenGlow,
                        unfocusedBorderColor = Color(0xFF222944)
                    ),
                    modifier = Modifier.weight(1f).height(50.dp)
                )

                Button(
                    onClick = {
                        val w = newSetWeight.toFloatOrNull() ?: 80f
                        val r = newSetReps.toIntOrNull() ?: 8
                        onAddSet(w, r)
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = AccentGreenGlow),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.height(44.dp)
                ) {
                    Text("+ Set", color = Color.Black, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
fun SetRowItem(set: WorkoutSetItem) {
    Surface(
        color = Color(0xFF14192B),
        shape = RoundedCornerShape(12.dp),
        border = BorderStroke(1.dp, Color(0xFF212842)),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 10.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("${set.setNumber}", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold, modifier = Modifier.width(36.dp))
            Text("${set.weightKg.toInt()} kg", color = AccentGreenGlow, fontSize = 12.sp, fontWeight = FontWeight.Bold, modifier = Modifier.width(60.dp))
            Text("${set.reps}", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold, modifier = Modifier.width(50.dp))
            Box(
                modifier = Modifier
                    .size(20.dp)
                    .clip(CircleShape)
                    .background(AccentGreenGlow.copy(alpha = 0.2f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Default.Check, null, tint = AccentGreenGlow, modifier = Modifier.size(12.dp))
            }
        }
    }
}
