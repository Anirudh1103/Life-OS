package com.example.lifeos.ui.calendar

import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Videocam
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.lifeos.data.models.CalendarEvent
import com.example.lifeos.theme.*
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun DayView(
    selectedDate: Calendar,
    events: List<CalendarEvent>,
    onEventClick: (CalendarEvent) -> Unit
) {
    val scrollState = rememberScrollState()
    val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.US)
    val dateStr = dateFormat.format(selectedDate.time)
    
    val dayEvents = events.filter { it.date == dateStr && !it.is_all_day }
    val allDayEvents = events.filter { it.date == dateStr && it.is_all_day }

    Column(modifier = Modifier.fillMaxSize()) {
        // All Day Section
        if (allDayEvents.isNotEmpty()) {
            Text("All day", color = Color.White.copy(alpha = 0.3f), fontSize = 11.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(bottom = 8.dp))
            allDayEvents.forEach { event ->
                AllDayEventCard(event) { onEventClick(event) }
                Spacer(Modifier.height(8.dp))
            }
            Spacer(Modifier.height(16.dp))
        }

        // Timeline
        Box(modifier = Modifier.weight(1f).verticalScroll(scrollState)) {
            Column {
                (6..23).forEach { hour ->
                    TimelineHourRow(hour)
                }
            }

            // Events on Timeline
            dayEvents.forEach { event ->
                TimelineEventCard(event) { onEventClick(event) }
            }

            // Current Time Indicator
            CurrentTimeIndicator(selectedDate)
        }
    }
}

@Composable
fun AllDayEventCard(event: CalendarEvent, onClick: () -> Unit) {
    val color = getEventColor(event.type)
    Card(
        onClick = onClick,
        colors = CardDefaults.cardColors(containerColor = color.copy(alpha = 0.1f)),
        border = BorderStroke(1.dp, color.copy(alpha = 0.3f)),
        shape = RoundedCornerShape(12.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.Videocam, null, tint = color, modifier = Modifier.size(16.dp))
            Spacer(Modifier.width(12.dp))
            Text(event.title, color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
            Text("All day", color = Color.White.copy(alpha = 0.5f), fontSize = 11.sp)
        }
    }
}

@Composable
fun TimelineHourRow(hour: Int) {
    val displayHour = when {
        hour == 0 -> "12 AM"
        hour < 12 -> "$hour AM"
        hour == 12 -> "12 PM"
        else -> "${hour - 12} PM"
    }
    
    Row(modifier = Modifier.height(80.dp).fillMaxWidth(), verticalAlignment = Alignment.Top) {
        Text(
            text = displayHour,
            color = Color.White.copy(alpha = 0.3f),
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.width(50.dp).padding(top = 4.dp)
        )
        Box(modifier = Modifier.fillMaxWidth().height(1.dp).background(Color.White.copy(alpha = 0.05f)).align(Alignment.Top))
    }
}

@Composable
fun BoxScope.TimelineEventCard(event: CalendarEvent, onClick: () -> Unit) {
    if (event.start_time == null || event.end_time == null) return
    
    val startParts = event.start_time.split(":")
    val endParts = event.end_time.split(":")
    
    val startMin = startParts[0].toInt() * 60 + startParts[1].toInt()
    val endMin = endParts[0].toInt() * 60 + endParts[1].toInt()
    val duration = endMin - startMin
    
    // Offset by 6 AM (Timeline start)
    val topOffset = ((startMin - 6 * 60) * (80.0 / 60.0)).dp
    val height = (duration * (80.0 / 60.0)).dp
    
    val color = getEventColor(event.type)
    
    Card(
        onClick = onClick,
        colors = CardDefaults.cardColors(containerColor = color.copy(alpha = 0.15f)),
        shape = RoundedCornerShape(12.dp),
        border = BorderStroke(1.dp, color.copy(alpha = 0.4f)),
        modifier = Modifier
            .padding(start = 60.dp, end = 12.dp)
            .offset(y = topOffset)
            .height(height)
            .fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Text("${formatTime12(event.start_time)} - ${formatTime12(event.end_time)}", color = color, fontSize = 10.sp, fontWeight = FontWeight.Black)
            Text(event.title, color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold)
            if (event.location != null) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(modifier = Modifier.size(6.dp).background(color, CircleShape))
                    Spacer(Modifier.width(6.dp))
                    Text(event.location, color = Color.White.copy(alpha = 0.4f), fontSize = 11.sp)
                }
            }
        }
    }
}

@Composable
fun BoxScope.CurrentTimeIndicator(selectedDate: Calendar) {
    val now = Calendar.getInstance()
    val isToday = selectedDate.get(Calendar.YEAR) == now.get(Calendar.YEAR) &&
                 selectedDate.get(Calendar.DAY_OF_YEAR) == now.get(Calendar.DAY_OF_YEAR)
    
    if (!isToday) return
    
    val currentMin = now.get(Calendar.HOUR_OF_DAY) * 60 + now.get(Calendar.MINUTE)
    if (currentMin < 6 * 60) return // Before timeline start
    
    val topOffset = ((currentMin - 6 * 60) * (80.0 / 60.0)).dp
    
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .offset(y = topOffset)
            .padding(start = 45.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(modifier = Modifier.size(8.dp).background(AccentViolet, CircleShape))
        Box(modifier = Modifier.weight(1f).height(1.dp).background(AccentViolet))
    }
}

fun formatTime12(time24: String): String {
    val parts = time24.split(":")
    val h = parts[0].toInt()
    val m = parts[1]
    return when {
        h == 0 -> "12:$m AM"
        h < 12 -> "$h:$m AM"
        h == 12 -> "12:$m PM"
        else -> "${h - 12}:$m PM"
    }
}
