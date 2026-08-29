package com.example.lifeos.ui.alarm

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.MoreTime
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Fill
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.lifeos.theme.*
import com.example.lifeos.ui.viewmodels.AlarmViewModel
import com.example.lifeos.ui.viewmodels.Alarm
import kotlinx.coroutines.delay
import java.text.SimpleDateFormat
import java.util.*
import kotlin.math.cos
import kotlin.math.sin

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AlarmScreen(
    modifier: Modifier = Modifier,
    onBack: () -> Unit = {},
    viewModel: AlarmViewModel = viewModel()
) {
    val alarms by viewModel.alarms.collectAsStateWithLifecycle()
    var showTimePicker by remember { mutableStateOf(false) }

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

    Box(modifier = modifier.fillMaxSize().background(MaterialTheme.colorScheme.background)) {
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 24.dp),
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
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, "Back", tint = MaterialTheme.colorScheme.onBackground)
                    }
                    Text(
                        "Clock & Neural Sync",
                        color = MaterialTheme.colorScheme.onBackground,
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Black
                    )
                    IconButton(onClick = { showTimePicker = true }) {
                        Icon(Icons.Default.Add, "Add Alarm", tint = accentCyan)
                    }
                }
            }

            // Analogue Clock Face
            item {
                Box(
                    modifier = Modifier
                        .size(280.dp)
                        .shadow(40.dp, CircleShape, spotColor = accentViolet.copy(alpha = 0.3f))
                        .background(MaterialTheme.colorScheme.surface.copy(alpha = 0.2f), CircleShape)
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
                        color = MaterialTheme.colorScheme.onBackground,
                        fontSize = 36.sp,
                        fontWeight = FontWeight.Black,
                        letterSpacing = (-1).sp
                    )
                    Text(
                        text = dateString,
                        color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.4f),
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp
                    )
                }
            }

            // Alarms Section
            item {
                SectionHeader("Neural Wake-up Directives", "Establish schedule")
            }

            items(alarms) { alarm ->
                AlarmItem(
                    alarm = alarm,
                    onToggle = { viewModel.toggleAlarm(alarm.id, it) },
                    onDelete = { viewModel.deleteAlarm(alarm.id) }
                )
            }

            // World Clocks Section
            item {
                SectionHeader("Global Matrix Sync", "3 Sectors Active")
            }

            item {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    WorldClockCard("USA (Washington)", "America/New_York")
                    WorldClockCard("China (Beijing)", "Asia/Shanghai")
                    WorldClockCard("Brazil (São Paulo)", "America/Sao_Paulo")
                }
                Spacer(modifier = Modifier.height(100.dp))
            }
        }
    }

    if (showTimePicker) {
        LifeOSTimePickerDialog(
            onDismiss = { showTimePicker = false },
            onConfirm = { hour, min ->
                viewModel.addAlarm(hour, min)
                showTimePicker = false
            }
        )
    }
}

@Composable
fun SectionHeader(title: String, sub: String) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.Bottom
    ) {
        Column {
            Text(
                title.uppercase(),
                color = AccentCyan,
                fontSize = 11.sp,
                fontWeight = FontWeight.Black,
                letterSpacing = 1.5.sp
            )
            Text(
                sub,
                color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.4f),
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

@Composable
fun AlarmItem(alarm: Alarm, onToggle: (Boolean) -> Unit, onDelete: () -> Unit) {
    Surface(
        color = MaterialTheme.colorScheme.surface.copy(alpha = 0.5f),
        shape = RoundedCornerShape(24.dp),
        border = BorderStroke(1.dp, Color.White.copy(alpha = 0.05f)),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier.padding(20.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column {
                Text(
                    text = alarm.time,
                    color = if (alarm.isEnabled) MaterialTheme.colorScheme.onSurface else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f),
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Black
                )
                Text(
                    text = "Daily • Neural Briefing Active",
                    color = AccentViolet.copy(alpha = if (alarm.isEnabled) 0.8f else 0.4f),
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold
                )
            }
            
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = onDelete) {
                    Icon(Icons.Default.Delete, null, tint = Color(0xFFFF4E70).copy(alpha = 0.3f), modifier = Modifier.size(20.dp))
                }
                Switch(
                    checked = alarm.isEnabled,
                    onCheckedChange = onToggle,
                    colors = SwitchDefaults.colors(
                        checkedThumbColor = Color.White,
                        checkedTrackColor = AccentCyan,
                        uncheckedThumbColor = Color.Gray,
                        uncheckedTrackColor = Color.DarkGray
                    )
                )
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
    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val glowAlpha by infiniteTransition.animateFloat(
        initialValue = 0.2f,
        targetValue = 0.5f,
        animationSpec = infiniteRepeatable(
            animation = tween(2000, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "glow"
    )

    val octagonColor = MaterialTheme.colorScheme.surfaceVariant

    Canvas(modifier = Modifier.fillMaxSize()) {
        val center = Offset(size.width / 2, size.height / 2)
        val radius = minOf(size.width, size.height) / 2

        // 1. Central Octagon Background (Centered)
        val octagonPath = Path()
        val octagonRadius = radius * 0.82f
        for (i in 0 until 8) {
            val angle = Math.toRadians((i * 45).toDouble() - 90)
            val x = (center.x + octagonRadius * cos(angle)).toFloat()
            val y = (center.y + octagonRadius * sin(angle)).toFloat()
            if (i == 0) octagonPath.moveTo(x, y) else octagonPath.lineTo(x, y)
        }
        octagonPath.close()
        
        drawPath(
            path = octagonPath,
            color = octagonColor.copy(alpha = 0.4f),
            style = Fill
        )
        drawPath(
            path = octagonPath,
            color = Color.White.copy(alpha = 0.15f),
            style = Stroke(width = 1.5.dp.toPx())
        )

        // 2. Outer Glow
        drawCircle(
            brush = Brush.radialGradient(
                colors = listOf(accentViolet.copy(alpha = glowAlpha * 0.25f), Color.Transparent),
                center = center,
                radius = radius * 1.1f
            ),
            radius = radius * 1.1f,
            center = center
        )

        // 3. Hours scale numbers/ticks
        for (i in 0 until 60) {
            val angleRad = Math.toRadians((i * 6).toDouble() - 90)
            val isHour = i % 5 == 0
            val tickLength = if (isHour) 14.dp.toPx() else 6.dp.toPx()
            
            // Outer relative to radius
            val tickStart = Offset(
                (center.x + (radius - 2.dp.toPx()) * cos(angleRad)).toFloat(),
                (center.y + (radius - 2.dp.toPx()) * sin(angleRad)).toFloat()
            )
            val tickEnd = Offset(
                (center.x + (radius - tickLength - 2.dp.toPx()) * cos(angleRad)).toFloat(),
                (center.y + (radius - tickLength - 2.dp.toPx()) * sin(angleRad)).toFloat()
            )
            
            drawLine(
                color = if (isHour) Color.White.copy(alpha = 0.8f) else Color.White.copy(alpha = 0.2f),
                start = tickStart,
                end = tickEnd,
                strokeWidth = if (isHour) 2.5.dp.toPx() else 1.dp.toPx(),
                cap = StrokeCap.Round
            )
        }

        // Time values
        val hr = calendar.get(Calendar.HOUR)
        val min = calendar.get(Calendar.MINUTE)
        val sec = calendar.get(Calendar.SECOND)
        val ms = calendar.get(Calendar.MILLISECOND)

        val secAngle = Math.toRadians(((sec + ms / 1000f) * 6f - 90).toDouble())
        val minAngle = Math.toRadians(((min + sec / 60f) * 6f - 90).toDouble())
        val hrAngle = Math.toRadians(((hr + min / 60f) * 30f - 90).toDouble())

        // 4. Hands (Drawn from exact center)
        val hrHandLength = radius * 0.45f
        val minHandLength = radius * 0.7f
        val secHandLength = radius * 0.88f

        // Draw Hour Hand
        drawLine(
            color = accentViolet,
            start = center,
            end = Offset((center.x + hrHandLength * cos(hrAngle)).toFloat(), (center.y + hrHandLength * sin(hrAngle)).toFloat()),
            strokeWidth = 6.dp.toPx(),
            cap = StrokeCap.Round
        )

        // Draw Minute Hand
        drawLine(
            color = Color.White,
            start = center,
            end = Offset((center.x + minHandLength * cos(minAngle)).toFloat(), (center.y + minHandLength * sin(minAngle)).toFloat()),
            strokeWidth = 4.dp.toPx(),
            cap = StrokeCap.Round
        )

        // Draw Second Hand
        drawLine(
            color = accentCyan,
            start = center,
            end = Offset((center.x + secHandLength * cos(secAngle)).toFloat(), (center.y + secHandLength * sin(secAngle)).toFloat()),
            strokeWidth = 2.dp.toPx(),
            cap = StrokeCap.Round
        )

        // 5. Center PIN
        drawCircle(color = accentCyan, radius = 6.dp.toPx(), center = center)
        drawCircle(color = Color.White, radius = 3.dp.toPx(), center = center)
    }
}

@Composable
fun WorldClockCard(city: String, timeZoneId: String) {
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

    Surface(
        color = MaterialTheme.colorScheme.surface.copy(alpha = 0.3f),
        shape = RoundedCornerShape(20.dp),
        border = BorderStroke(1.dp, Color.White.copy(alpha = 0.05f)),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier.padding(20.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column {
                Text(
                    text = city,
                    color = MaterialTheme.colorScheme.onSurface,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = dateStr,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f),
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium
                )
            }
            Text(
                text = timeStr,
                color = MaterialTheme.colorScheme.onSurface,
                fontSize = 22.sp,
                fontWeight = FontWeight.Black
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LifeOSTimePickerDialog(onDismiss: () -> Unit, onConfirm: (Int, Int) -> Unit) {
    val state = rememberTimePickerState(initialHour = 7, initialMinute = 0)
    
    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = MaterialTheme.colorScheme.surface,
        title = {
            Text("Directive Initialization Time", color = MaterialTheme.colorScheme.onSurface, fontWeight = FontWeight.Black)
        },
        text = {
            TimePicker(
                state = state,
                colors = TimePickerDefaults.colors(
                    clockDialColor = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f),
                    selectorColor = AccentCyan,
                    periodSelectorSelectedContainerColor = AccentViolet.copy(alpha = 0.2f),
                    periodSelectorSelectedContentColor = MaterialTheme.colorScheme.onSurface
                )
            )
        },
        confirmButton = {
            Button(
                onClick = { onConfirm(state.hour, state.minute) },
                colors = ButtonDefaults.buttonColors(containerColor = AccentViolet)
            ) {
                Text("ESTABLISH")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("ABORT", color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
            }
        }
    )
}
