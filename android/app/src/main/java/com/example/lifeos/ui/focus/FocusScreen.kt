package com.example.lifeos.ui.focus

import androidx.compose.animation.core.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay

@Composable
fun FocusScreen(
    modifier: Modifier = Modifier
) {
    val darkBackground = Color(0xFF0C0A1C)
    val cardBackground = Color(0xFF13112E)
    val accentCyan = Color(0xFF2DE1FC)
    val accentViolet = Color(0xFF8A5DF2)

    var timeLeft by remember { mutableStateOf(25 * 60) }
    var timerRunning by remember { mutableStateOf(false) }

    LaunchedEffect(timerRunning) {
        if (timerRunning) {
            while (timeLeft > 0) {
                delay(1000)
                timeLeft--
            }
            timerRunning = false
        }
    }

    val progress = timeLeft.toFloat() / (25 * 60)

    Box(modifier = modifier.fillMaxSize().background(darkBackground)) {
        Column(modifier = Modifier.fillMaxSize().padding(24.dp)) {
            Column {
                Text(
                    "Focus Console",
                    color = Color.White,
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Black
                )
                Text(
                    "Stark Industrial Focus Orchestration",
                    color = accentCyan,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp
                )
            }
            
            Spacer(modifier = Modifier.height(24.dp))

            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(20.dp),
                modifier = Modifier.fillMaxSize()
            ) {
                // Focus Timer card
                item {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = cardBackground),
                        shape = RoundedCornerShape(24.dp),
                        border = BorderStroke(1.dp, Color.White.copy(alpha = 0.05f)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(
                            modifier = Modifier.padding(24.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Box(
                                contentAlignment = Alignment.Center,
                                modifier = Modifier.size(200.dp)
                            ) {
                                // Draw circular progress ring
                                Canvas(modifier = Modifier.size(180.dp)) {
                                    drawCircle(
                                        color = Color.White.copy(alpha = 0.05f),
                                        style = Stroke(width = 8.dp.toPx())
                                    )
                                    drawArc(
                                        brush = Brush.sweepGradient(listOf(accentCyan, accentViolet, accentCyan)),
                                        startAngle = -90f,
                                        sweepAngle = 360f * progress,
                                        useCenter = false,
                                        style = Stroke(width = 8.dp.toPx(), cap = StrokeCap.Round)
                                    )
                                }
                                
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    val minutes = timeLeft / 60
                                    val seconds = timeLeft % 60
                                    Text(
                                        text = String.format("%02d:%02d", minutes, seconds),
                                        color = Color.White,
                                        fontSize = 32.sp,
                                        fontWeight = FontWeight.Black
                                    )
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(
                                        text = if (timerRunning) "Zone Active" else "Ready",
                                        color = accentCyan,
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold,
                                        letterSpacing = 1.sp
                                    )
                                }
                            }
                            
                            Spacer(Modifier.height(16.dp))

                            Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                                Button(
                                    onClick = { timerRunning = !timerRunning },
                                    colors = ButtonDefaults.buttonColors(containerColor = if (timerRunning) Color(0xFFFF4E70) else accentCyan),
                                    shape = RoundedCornerShape(12.dp)
                                ) {
                                    Icon(
                                        imageVector = if (timerRunning) Icons.Default.Pause else Icons.Default.PlayArrow,
                                        contentDescription = null,
                                        tint = if (timerRunning) Color.White else Color.Black
                                    )
                                    Spacer(Modifier.width(8.dp))
                                    Text(
                                        text = if (timerRunning) "Pause Session" else "Start Session",
                                        color = if (timerRunning) Color.White else Color.Black,
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }

                                OutlinedButton(
                                    onClick = {
                                        timerRunning = false
                                        timeLeft = 25 * 60
                                    },
                                    border = BorderStroke(1.dp, Color.White.copy(alpha = 0.2f)),
                                    shape = RoundedCornerShape(12.dp),
                                    colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.White)
                                ) {
                                    Text("Reset", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                }

                // Stats Cards
                item {
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(16.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Card(
                            colors = CardDefaults.cardColors(containerColor = cardBackground),
                            shape = RoundedCornerShape(20.dp),
                            modifier = Modifier.weight(1f)
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Text("Focus Today", color = Color.White.copy(alpha = 0.5f), fontSize = 10.sp)
                                Spacer(Modifier.height(4.dp))
                                Text("120 / 180 min", color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Black)
                                Spacer(Modifier.height(2.dp))
                                Text("66% Completed", color = accentCyan, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                            }
                        }

                        Card(
                            colors = CardDefaults.cardColors(containerColor = cardBackground),
                            shape = RoundedCornerShape(20.dp),
                            modifier = Modifier.weight(1f)
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Text("Active Streak", color = Color.White.copy(alpha = 0.5f), fontSize = 10.sp)
                                Spacer(Modifier.height(4.dp))
                                Text("5 Days", color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Black)
                                Spacer(Modifier.height(2.dp))
                                Text("Longest: 12 days", color = Color.White.copy(alpha = 0.4f), fontSize = 9.sp)
                            }
                        }
                    }
                }

                // Focus History Row Header
                item {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Info, null, tint = Color.White.copy(alpha = 0.5f), modifier = Modifier.size(16.dp))
                        Spacer(Modifier.width(8.dp))
                        Text("Directives Log", color = Color.White.copy(alpha = 0.5f), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }

                items(2) { index ->
                    val title = if (index == 0) "Completed Coding session" else "Completed Research analysis"
                    val duration = if (index == 0) "45 min" else "60 min"
                    val time = if (index == 0) "11:30 AM" else "09:00 AM"

                    Card(
                        colors = CardDefaults.cardColors(containerColor = cardBackground),
                        shape = RoundedCornerShape(16.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                            Box(modifier = Modifier.size(36.dp).background(accentCyan.copy(alpha = 0.15f), CircleShape), contentAlignment = Alignment.Center) {
                                Box(modifier = Modifier.size(8.dp).background(accentCyan, CircleShape))
                            }
                            Spacer(Modifier.width(16.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(title, color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                                Spacer(Modifier.height(2.dp))
                                Text(time, color = Color.White.copy(alpha = 0.4f), fontSize = 10.sp)
                            }
                            Text(duration, color = accentCyan, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}
