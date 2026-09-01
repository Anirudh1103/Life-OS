package com.example.lifeos.ui.fitness

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.example.lifeos.ui.fitness.components.*
import com.example.lifeos.ui.viewmodels.JarvisFoodLoggingState

@Composable
fun JarvisFoodLoggingDialog(
    state: JarvisFoodLoggingState,
    onLogPrompt: (String) -> Unit,
    onDismiss: () -> Unit
) {
    var promptInput by remember { mutableStateOf("") }
    val isProcessing = state !is JarvisFoodLoggingState.Idle && state !is JarvisFoodLoggingState.Error

    Dialog(onDismissRequest = { if (!isProcessing) onDismiss() }) {
        Card(
            colors = CardDefaults.cardColors(containerColor = Color(0xFF0F1322)),
            shape = RoundedCornerShape(28.dp),
            border = BorderStroke(1.dp, Color(0xFF232B45)),
            modifier = Modifier
                .fillMaxWidth()
                .padding(8.dp)
                .shadow(24.dp, RoundedCornerShape(28.dp), spotColor = Color(0xFF8A5DF2))
        ) {
            Column(
                modifier = Modifier
                    .padding(24.dp)
                    .fillMaxWidth(),
                horizontalAlignment = Alignment.CenterHorizontally
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
                                .clip(CircleShape)
                                .background(
                                    Brush.linearGradient(
                                        listOf(Color(0xFF8A5DF2), Color(0xFF6366F1))
                                    )
                                ),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Default.AutoAwesome, contentDescription = null, tint = Color.White, modifier = Modifier.size(16.dp))
                        }
                        Spacer(Modifier.width(10.dp))
                        Column {
                            Text("Jarvis Food Intelligence", color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                            Text("Conversational nutrition logging", color = Color.White.copy(alpha = 0.45f), fontSize = 9.sp)
                        }
                    }

                    IconButton(onClick = onDismiss, enabled = !isProcessing, modifier = Modifier.size(28.dp)) {
                        Icon(Icons.Default.Close, null, tint = Color.White.copy(alpha = 0.5f))
                    }
                }

                Spacer(Modifier.height(20.dp))

                // Interactive Animated Processing State
                AnimatedContent(
                    targetState = state,
                    label = "jarvis_state_anim"
                ) { targetState ->
                    when (targetState) {
                        is JarvisFoodLoggingState.Understanding -> {
                            ProcessingStateStep(
                                title = "Understanding meal...",
                                subtitle = "Extracting ingredients & quantities",
                                stepColor = Color(0xFF2DE1FC)
                            )
                        }
                        is JarvisFoodLoggingState.Calculating -> {
                            ProcessingStateStep(
                                title = "Calculating nutrition...",
                                subtitle = "Computing macros, calories & micronutrients",
                                stepColor = Color(0xFFFF8A3D)
                            )
                        }
                        is JarvisFoodLoggingState.Logging -> {
                            ProcessingStateStep(
                                title = "Logging meal to database...",
                                subtitle = "Updating daily progress & goals",
                                stepColor = Color(0xFF8A5DF2)
                            )
                        }
                        is JarvisFoodLoggingState.Success -> {
                            SuccessStateStep(mealTitle = targetState.meal.title, calories = targetState.meal.totalCalories)
                        }
                        is JarvisFoodLoggingState.Error -> {
                            ErrorStateStep(message = targetState.message)
                        }
                        is JarvisFoodLoggingState.Idle -> {
                            // Default Input View
                            Column(modifier = Modifier.fillMaxWidth()) {
                                OutlinedTextField(
                                    value = promptInput,
                                    onValueChange = { promptInput = it },
                                    placeholder = {
                                        Text(
                                            "e.g. I ate 2 eggs, 3 egg whites, 1 onion, 1 tomato and a roti",
                                            color = Color.White.copy(alpha = 0.35f),
                                            fontSize = 12.sp
                                        )
                                    },
                                    colors = OutlinedTextFieldDefaults.colors(
                                        focusedContainerColor = Color(0xFF14192B),
                                        unfocusedContainerColor = Color(0xFF14192B),
                                        focusedBorderColor = Color(0xFF8A5DF2),
                                        unfocusedBorderColor = Color(0xFF222944),
                                        focusedTextColor = Color.White,
                                        unfocusedTextColor = Color.White
                                    ),
                                    shape = RoundedCornerShape(16.dp),
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(100.dp)
                                )

                                Spacer(Modifier.height(14.dp))

                                // Quick suggestion chips
                                Text("Suggested Examples:", color = Color.White.copy(alpha = 0.4f), fontSize = 9.sp, fontWeight = FontWeight.Bold)
                                Spacer(Modifier.height(6.dp))

                                val examples = listOf(
                                    "2 eggs, 3 whites & onion tomato scramble",
                                    "180g chicken breast with 1.5 cups basmati rice & curd",
                                    "1 banana, 1 scoop whey protein & almond milk",
                                    "2 rotis, 100g paneer bhurji & mixed vegetables"
                                )

                                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                    examples.forEach { example ->
                                        Surface(
                                            onClick = { promptInput = example },
                                            color = Color(0xFF161B30),
                                            shape = RoundedCornerShape(10.dp),
                                            border = BorderStroke(1.dp, Color(0xFF242C4B)),
                                            modifier = Modifier.fillMaxWidth()
                                        ) {
                                            Row(
                                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                                                verticalAlignment = Alignment.CenterVertically
                                            ) {
                                                Icon(Icons.Default.Add, null, tint = AccentPurpleGlow, modifier = Modifier.size(12.dp))
                                                Spacer(Modifier.width(6.dp))
                                                Text(example, color = Color.White.copy(alpha = 0.75f), fontSize = 10.sp)
                                            }
                                        }
                                    }
                                }

                                Spacer(Modifier.height(18.dp))

                                // Action Button
                                Button(
                                    onClick = { onLogPrompt(promptInput) },
                                    enabled = promptInput.isNotBlank(),
                                    shape = RoundedCornerShape(16.dp),
                                    colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
                                    contentPadding = PaddingValues(0.dp),
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(46.dp)
                                        .clip(RoundedCornerShape(16.dp))
                                        .background(
                                            Brush.linearGradient(
                                                listOf(Color(0xFF8A5DF2), Color(0xFF6366F1))
                                            )
                                        )
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(Icons.Default.AutoAwesome, null, tint = Color.White, modifier = Modifier.size(14.dp))
                                        Spacer(Modifier.width(8.dp))
                                        Text("Log with Jarvis", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
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

@Composable
fun ProcessingStateStep(title: String, subtitle: String, stepColor: Color) {
    val infiniteTransition = rememberInfiniteTransition(label = "step_pulse")
    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 0.92f,
        targetValue = 1.08f,
        animationSpec = infiniteRepeatable(
            animation = tween(600, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulse_scale"
    )

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 24.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Box(
            modifier = Modifier
                .size(64.dp)
                .clip(CircleShape)
                .background(stepColor.copy(alpha = 0.15f))
                .border(2.dp, stepColor.copy(alpha = 0.5f), CircleShape),
            contentAlignment = Alignment.Center
        ) {
            CircularProgressIndicator(
                color = stepColor,
                strokeWidth = 3.dp,
                modifier = Modifier.size(40.dp)
            )
        }

        Spacer(Modifier.height(16.dp))
        Text(title, color = Color.White, fontSize = 15.sp, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(4.dp))
        Text(subtitle, color = Color.White.copy(alpha = 0.5f), fontSize = 11.sp)
    }
}

@Composable
fun SuccessStateStep(mealTitle: String, calories: Int) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 20.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Box(
            modifier = Modifier
                .size(60.dp)
                .clip(CircleShape)
                .background(Color(0xFF10B981).copy(alpha = 0.2f))
                .border(2.dp, Color(0xFF10B981), CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Icon(Icons.Default.Check, null, tint = Color(0xFF10B981), modifier = Modifier.size(32.dp))
        }

        Spacer(Modifier.height(14.dp))
        Text("Meal Logged Successfully!", color = Color.White, fontSize = 15.sp, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(4.dp))
        Text("$mealTitle • $calories kcal", color = AccentGreenGlow, fontSize = 12.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
fun ErrorStateStep(message: String) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 20.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Box(
            modifier = Modifier
                .size(56.dp)
                .clip(CircleShape)
                .background(Color(0xFFF43F5E).copy(alpha = 0.15f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(Icons.Default.ErrorOutline, null, tint = Color(0xFFF43F5E), modifier = Modifier.size(28.dp))
        }

        Spacer(Modifier.height(12.dp))
        Text("Processing Failed", color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(4.dp))
        Text(message, color = Color.White.copy(alpha = 0.5f), fontSize = 11.sp)
    }
}
