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
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.example.lifeos.data.models.Meal
import com.example.lifeos.data.models.MicronutrientInfo
import com.example.lifeos.ui.fitness.components.*

@Composable
fun MealDetailsDialog(
    meal: Meal,
    onDeleteMeal: (String) -> Unit,
    onDismiss: () -> Unit
) {
    Dialog(onDismissRequest = onDismiss) {
        Card(
            colors = CardDefaults.cardColors(containerColor = Color(0xFF0F1322)),
            shape = RoundedCornerShape(24.dp),
            border = BorderStroke(1.dp, Color(0xFF232B45)),
            modifier = Modifier.fillMaxWidth().padding(8.dp)
        ) {
            Column(modifier = Modifier.padding(22.dp)) {
                // Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(meal.title, color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                        Text("${meal.mealType.name} • ${meal.timestamp}", color = Color.White.copy(alpha = 0.45f), fontSize = 10.sp)
                    }

                    IconButton(onClick = onDismiss, modifier = Modifier.size(28.dp)) {
                        Icon(Icons.Default.Close, null, tint = Color.White.copy(alpha = 0.5f))
                    }
                }

                Spacer(Modifier.height(16.dp))

                // Macros row
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(14.dp))
                        .background(Color(0xFF14192B))
                        .padding(12.dp),
                    horizontalArrangement = Arrangement.SpaceAround
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("Calories", color = Color.White.copy(alpha = 0.4f), fontSize = 8.5.sp)
                        Text("${meal.totalCalories} kcal", color = AccentOrange, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("Protein", color = Color.White.copy(alpha = 0.4f), fontSize = 8.5.sp)
                        Text("${meal.totalProtein.toInt()}g", color = AccentGreenGlow, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("Carbs", color = Color.White.copy(alpha = 0.4f), fontSize = 8.5.sp)
                        Text("${meal.totalCarbs.toInt()}g", color = AccentBlueGlow, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("Fat", color = Color.White.copy(alpha = 0.4f), fontSize = 8.5.sp)
                        Text("${meal.totalFat.toInt()}g", color = AccentPurpleGlow, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }

                Spacer(Modifier.height(16.dp))

                Text("Ingredients / Food Items", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(8.dp))

                LazyColumn(
                    modifier = Modifier.heightIn(max = 200.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    items(meal.foodItems) { item ->
                        Surface(
                            color = Color(0xFF161B30),
                            shape = RoundedCornerShape(10.dp),
                            border = BorderStroke(1.dp, Color(0xFF242D4C)),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text(item.name, color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                    Text(item.quantityText, color = Color.White.copy(alpha = 0.45f), fontSize = 9.sp)
                                }
                                Text("${item.calories} kcal", color = AccentOrange, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }

                Spacer(Modifier.height(16.dp))

                // Delete Button
                Button(
                    onClick = { onDeleteMeal(meal.id) },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFF43F5E).copy(alpha = 0.15f)),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth().height(40.dp)
                ) {
                    Icon(Icons.Default.Delete, null, tint = Color(0xFFF43F5E), modifier = Modifier.size(14.dp))
                    Spacer(Modifier.width(6.dp))
                    Text("Delete Meal", color = Color(0xFFF43F5E), fontSize = 11.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
fun AllMicronutrientsDialog(
    micros: List<MicronutrientInfo>,
    onDismiss: () -> Unit
) {
    Dialog(onDismissRequest = onDismiss) {
        Card(
            colors = CardDefaults.cardColors(containerColor = Color(0xFF0F1322)),
            shape = RoundedCornerShape(24.dp),
            border = BorderStroke(1.dp, Color(0xFF232B45)),
            modifier = Modifier.fillMaxWidth().padding(8.dp)
        ) {
            Column(modifier = Modifier.padding(22.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Complete Micronutrient Profile", color = Color.White, fontSize = 15.sp, fontWeight = FontWeight.Bold)
                    IconButton(onClick = onDismiss, modifier = Modifier.size(28.dp)) {
                        Icon(Icons.Default.Close, null, tint = Color.White.copy(alpha = 0.5f))
                    }
                }

                Spacer(Modifier.height(14.dp))

                LazyColumn(
                    modifier = Modifier.heightIn(max = 340.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(micros) { item ->
                        Surface(
                            color = Color(0xFF14192B),
                            shape = RoundedCornerShape(12.dp),
                            border = BorderStroke(1.dp, Color(0xFF212842)),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier.padding(12.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text(item.displayName, color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                    Text("${item.currentAmount} / ${item.targetAmount} ${item.unit}", color = Color.White.copy(alpha = 0.45f), fontSize = 9.sp)
                                }

                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(
                                        "${item.percentage}%",
                                        color = if (item.percentage >= 100) AccentGreenGlow else AccentCyanGlow,
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Spacer(Modifier.width(8.dp))
                                    Box(modifier = Modifier.width(50.dp).height(4.dp).clip(CircleShape).background(Color(0xFF1B2236))) {
                                        Box(
                                            modifier = Modifier
                                                .fillMaxHeight()
                                                .fillMaxWidth((item.percentage / 100f).coerceIn(0f, 1f))
                                                .clip(CircleShape)
                                                .background(if (item.percentage >= 100) AccentGreenGlow else AccentCyanGlow)
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
