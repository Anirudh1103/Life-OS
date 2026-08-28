package com.example.lifeos.ui.alarm

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.MoreTime
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay
import java.text.SimpleDateFormat
import java.util.*
import kotlin.math.cos
import kotlin.math.sin

@Composable
fun AlarmScreen(
    modifier: Modifier = Modifier
) {
    val darkBackground = Color(0xFF0C0A1C)
    val cardBackground = Color(0xFF13112E)
    val accentCyan = Color(0xFF2DE1FC)
    val accentViolet = Color(0xFF8A5DF2)

    // Tick the clock every 100 milliseconds for smooth movement of second hands
    val currentCalendar by produceState(initialValue = Calendar.getInstance()) {
        while (true) {
            value = Calendar.getInstance()
            delay(100)
        }
    }

    val timeString = remember(currentCalendar) {
        SimpleDateFormat("hh:mm:ss a", Locale.US).format(currentCalendar.time)
    }

    val dateString = remember(currentCalendar) {
        SimpleDateFormat("EEEE, d MMMM yyyy", Locale.US).format(currentCalendar.time)
    }

    Box(modifier = modifier.fillMaxSize().background(darkBackground)) {
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 20.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(24.dp)
        ) {
            // Header Top Bar
            item {
                Spacer(modifier = Modifier.height(12.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(onClick = { /* Go Back handled by router stack */ }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = Color.White)
                    }
                    Text(
                        "Clock",
                        color = Color.White,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold
                    )
                    IconButton(onClick = { /* Add alarm / World Clock */ }) {
                        Icon(Icons.Default.MoreTime, contentDescription = "Add Clock", tint = Color.White)
                    }
                }
            }

            // Analogue Clock Face Canvas
            item {
                Box(
                    modifier = Modifier
                        .size(240.dp)
                        .background(cardBackground.copy(alpha = 0.5f), CircleShape)
                        .border(1.dp, Color.White.copy(alpha = 0.05f), CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    AnalogClockFace(
                        calendar = currentCalendar,
                        accentViolet = accentViolet,
                        accentCyan = accentCyan
                    )
                }
            }

            // Digital Time display
            item {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = timeString,
                        color = Color.White,
                        fontSize = 32.sp,
                        fontWeight = FontWeight.Black,
                        letterSpacing = 1.sp
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = dateString,
                        color = Color.White.copy(alpha = 0.4f),
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Medium
                    )
                }
            }

            // World Clocks Section
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        "World Clock",
                        color = Color.White.copy(alpha = 0.4f),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Black,
                        letterSpacing = 1.sp
                    )
                    Text(
                        "Edit",
                        color = accentCyan,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.clickable { /* Edit world clocks */ }
                    )
                }
            }

            item {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    WorldClockCard("New York", "America/New_York", cardBackground)
                    WorldClockCard("London", "Europe/London", cardBackground)
                    WorldClockCard("Tokyo", "Asia/Tokyo", cardBackground)
                }
                Spacer(modifier = Modifier.height(24.dp))
            }
        }
    }
}

@Composable
fun AnalogClockFace(
    calendar: Calendar,
    accentViolet: Color,
    accentCyan: Color
) {
    Canvas(modifier = Modifier.size(220.dp)) {
        val center = Offset(size.width / 2, size.height / 2)
        val radius = size.width / 2

        // Hours scale numbers/ticks
        for (i in 0 until 12) {
            val angleRad = Math.toRadians((i * 30).toDouble() - 90)
            val tickStart = Offset(
                (center.x + (radius - 12.dp.toPx()) * cos(angleRad)).toFloat(),
                (center.y + (radius - 12.dp.toPx()) * sin(angleRad)).toFloat()
            )
            val tickEnd = Offset(
                (center.x + (radius - 4.dp.toPx()) * cos(angleRad)).toFloat(),
                (center.y + (radius - 4.dp.toPx()) * sin(angleRad)).toFloat()
            )
            
            val isMainHour = i % 3 == 0
            drawCircle(
                color = if (isMainHour) Color.White else Color.White.copy(alpha = 0.2f),
                radius = if (isMainHour) 2.dp.toPx() else 1.dp.toPx(),
                center = tickStart
            )
        }

        // Time values
        val hr = calendar.get(Calendar.HOUR)
        val min = calendar.get(Calendar.MINUTE)
        val sec = calendar.get(Calendar.SECOND)
        val ms = calendar.get(Calendar.MILLISECOND)

        // Hand angles in radians (continuous movement)
        val secAngle = Math.toRadians(((sec + ms / 1000f) * 6f - 90).toDouble())
        val minAngle = Math.toRadians(((min + sec / 60f) * 6f - 90).toDouble())
        val hrAngle = Math.toRadians(((hr + min / 60f) * 30f - 90).toDouble())

        // Draw Hour Hand (Thick, Violet)
        val hrHandLength = radius * 0.5f
        val hrHandEnd = Offset(
            (center.x + hrHandLength * cos(hrAngle)).toFloat(),
            (center.y + hrHandLength * sin(hrAngle)).toFloat()
        )
        drawLine(
            color = accentViolet,
            start = center,
            end = hrHandEnd,
            strokeWidth = 4.dp.toPx(),
            cap = StrokeCap.Round
        )

        // Draw Minute Hand (Medium, White)
        val minHandLength = radius * 0.75f
        val minHandEnd = Offset(
            (center.x + minHandLength * cos(minAngle)).toFloat(),
            (center.y + minHandLength * sin(minAngle)).toFloat()
        )
        drawLine(
            color = Color.White,
            start = center,
            end = minHandEnd,
            strokeWidth = 3.dp.toPx(),
            cap = StrokeCap.Round
        )

        // Draw Second Hand (Thin, Cyan)
        val secHandLength = radius * 0.85f
        val secHandEnd = Offset(
            (center.x + secHandLength * cos(secAngle)).toFloat(),
            (center.y + secHandLength * sin(secAngle)).toFloat()
        )
        drawLine(
            color = accentCyan,
            start = center,
            end = secHandEnd,
            strokeWidth = 1.5.dp.toPx(),
            cap = StrokeCap.Round
        )

        // Center PIN circle
        drawCircle(
            color = Color.White,
            radius = 4.dp.toPx(),
            center = center
        )
    }
}

@Composable
fun WorldClockCard(
    city: String,
    timeZoneId: String,
    cardBackground: Color
) {
    val currentCalendar = remember { mutableStateOf(Calendar.getInstance(TimeZone.getTimeZone(timeZoneId))) }

    LaunchedEffect(Unit) {
        while (true) {
            currentCalendar.value = Calendar.getInstance(TimeZone.getTimeZone(timeZoneId))
            delay(1000)
        }
    }

    val timeStr = remember(currentCalendar.value) {
        SimpleDateFormat("hh:mm a", Locale.US).format(currentCalendar.value.time)
    }

    val dateStr = remember(currentCalendar.value) {
        SimpleDateFormat("EEE, d MMM", Locale.US).format(currentCalendar.value.time)
    }

    Card(
        colors = CardDefaults.cardColors(containerColor = cardBackground),
        shape = RoundedCornerShape(16.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column {
                Text(
                    text = city,
                    color = Color.White,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = dateStr,
                    color = Color.White.copy(alpha = 0.4f),
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Medium
                )
            }
            Text(
                text = timeStr,
                color = Color.White,
                fontSize = 20.sp,
                fontWeight = FontWeight.Black
            )
        }
    }
}
