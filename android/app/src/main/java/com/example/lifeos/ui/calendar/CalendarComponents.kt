package com.example.lifeos.ui.calendar

import androidx.compose.animation.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.lifeos.data.models.CalendarEvent
import com.example.lifeos.data.models.CalendarEventType
import com.example.lifeos.data.models.RecurrenceType
import com.example.lifeos.theme.*
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun MiniCalendar(
    selectedDate: Calendar,
    onDateSelected: (Calendar) -> Unit
) {
    val tempCal = (selectedDate.clone() as Calendar).apply { set(Calendar.DAY_OF_MONTH, 1) }
    val monthTitle = SimpleDateFormat("MMMM yyyy", Locale.US).format(selectedDate.time)
    val startOffset = (tempCal.get(Calendar.DAY_OF_WEEK) + 5) % 7 // Monday = 0
    val daysInMonth = selectedDate.getActualMaximum(Calendar.DAY_OF_MONTH)

    Column(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(monthTitle, color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold)
            Row {
                IconButton(onClick = { 
                    val new = (selectedDate.clone() as Calendar).apply { add(Calendar.MONTH, -1) }
                    onDateSelected(new)
                }, modifier = Modifier.size(24.dp)) {
                    Icon(Icons.Default.ChevronLeft, null, tint = Color.White.copy(alpha = 0.5f))
                }
                IconButton(onClick = { 
                    val new = (selectedDate.clone() as Calendar).apply { add(Calendar.MONTH, 1) }
                    onDateSelected(new)
                }, modifier = Modifier.size(24.dp)) {
                    Icon(Icons.Default.ChevronRight, null, tint = Color.White.copy(alpha = 0.5f))
                }
            }
        }

        Spacer(Modifier.height(12.dp))

        Row(modifier = Modifier.fillMaxWidth()) {
            listOf("MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN").forEach {
                Text(it, modifier = Modifier.weight(1f), textAlign = TextAlign.Center, color = Color.White.copy(alpha = 0.3f), fontSize = 9.sp, fontWeight = FontWeight.Black)
            }
        }

        Spacer(Modifier.height(8.dp))

        var day = 1
        for (row in 0..5) {
            if (day > daysInMonth) break
            Row(modifier = Modifier.fillMaxWidth().padding(vertical = 2.dp)) {
                for (col in 0..6) {
                    val isOffset = row == 0 && col < startOffset
                    if (isOffset || day > daysInMonth) {
                        Box(modifier = Modifier.weight(1f))
                    } else {
                        val isSelected = day == selectedDate.get(Calendar.DAY_OF_MONTH)
                        val isToday = day == Calendar.getInstance().get(Calendar.DAY_OF_MONTH) && 
                                     selectedDate.get(Calendar.MONTH) == Calendar.getInstance().get(Calendar.MONTH)
                        
                        val bg = if (isSelected) AccentViolet else Color.Transparent
                        val contentColor = if (isSelected) Color.White else if (isToday) AccentCyan else Color.White.copy(alpha = 0.7f)

                        val d = day
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .aspectRatio(1f)
                                .clip(CircleShape)
                                .background(bg)
                                .clickable { 
                                    val new = (selectedDate.clone() as Calendar).apply { set(Calendar.DAY_OF_MONTH, d) }
                                    onDateSelected(new)
                                },
                            contentAlignment = Alignment.Center
                        ) {
                            Text(day.toString(), color = contentColor, fontSize = 11.sp, fontWeight = if (isSelected || isToday) FontWeight.Black else FontWeight.Medium)
                        }
                        day++
                    }
                }
            }
        }
    }
}

@Composable
fun UpcomingEventsList(events: List<CalendarEvent>) {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Text("Upcoming Events", color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Bold)
            Text("View all", color = AccentCyan, fontSize = 11.sp, fontWeight = FontWeight.Bold, modifier = Modifier.clickable { })
        }

        events.take(4).forEach { event ->
            val color = getEventColor(event.type)
            Card(
                colors = CardDefaults.cardColors(containerColor = CardBg.copy(alpha = 0.4f)),
                shape = RoundedCornerShape(12.dp),
                border = BorderStroke(1.dp, Color.White.copy(alpha = 0.05f))
            ) {
                Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                    Box(modifier = Modifier.size(6.dp).background(color, CircleShape))
                    Spacer(Modifier.width(12.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(event.title, color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        Text(
                            if (event.is_all_day) "All day" else "${event.start_time} - ${event.end_time}",
                            color = Color.White.copy(alpha = 0.4f),
                            fontSize = 10.sp
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun QuickAddRow(onAdd: (CalendarEventType) -> Unit) {
    Column {
        Text("Quick Add", color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(bottom = 12.dp))
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            QuickAddButton(Icons.Outlined.Event, "Event", AccentCyan) { onAdd(CalendarEventType.EVENT) }
            QuickAddButton(Icons.Outlined.VideoCall, "Meeting", AccentViolet) { onAdd(CalendarEventType.MEETING) }
            QuickAddButton(Icons.Outlined.NotificationsActive, "Reminder", Color(0xFFFFB300)) { onAdd(CalendarEventType.REMINDER) }
            QuickAddButton(Icons.Outlined.Cake, "Birthday", Color(0xFFF43F5E)) { onAdd(CalendarEventType.BIRTHDAY) }
            QuickAddButton(Icons.Outlined.Favorite, "Anniv.", Color(0xFFFF4E70)) { onAdd(CalendarEventType.ANNIVERSARY) }
        }
    }
}

@Composable
fun QuickAddButton(icon: androidx.compose.ui.graphics.vector.ImageVector, label: String, color: Color, onClick: () -> Unit) {
    Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Box(
            modifier = Modifier
                .size(44.dp)
                .clip(RoundedCornerShape(12.dp))
                .background(color.copy(alpha = 0.1f))
                .border(1.dp, color.copy(alpha = 0.2f), RoundedCornerShape(12.dp))
                .clickable { onClick() },
            contentAlignment = Alignment.Center
        ) {
            Icon(icon, null, tint = color, modifier = Modifier.size(20.dp))
        }
        Text(label, color = Color.White.copy(alpha = 0.5f), fontSize = 9.sp, fontWeight = FontWeight.Medium)
    }
}

@Composable
fun EventDetailsPanel(
    event: CalendarEvent,
    onClose: () -> Unit,
    onEdit: () -> Unit,
    onDelete: () -> Unit
) {
    val color = getEventColor(event.type)
    Column(modifier = Modifier.fillMaxSize().padding(24.dp)) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text("Event Details", color = Color.White.copy(alpha = 0.5f), fontSize = 12.sp, fontWeight = FontWeight.Bold)
            Row {
                IconButton(onClick = onEdit, modifier = Modifier.size(24.dp)) { Icon(Icons.Default.Edit, null, tint = Color.White, modifier = Modifier.size(16.dp)) }
                IconButton(onClick = onClose, modifier = Modifier.size(24.dp)) { Icon(Icons.Default.MoreHoriz, null, tint = Color.White, modifier = Modifier.size(16.dp)) }
            }
        }

        Spacer(Modifier.height(32.dp))

        Box(
            modifier = Modifier.size(64.dp).background(color.copy(alpha = 0.15f), RoundedCornerShape(16.dp)),
            contentAlignment = Alignment.Center
        ) {
            val icon = when(event.type) {
                CalendarEventType.MEETING -> Icons.Default.VideoCall
                CalendarEventType.ANNIVERSARY -> Icons.Default.Favorite
                CalendarEventType.BIRTHDAY -> Icons.Default.Cake
                else -> Icons.Default.Event
            }
            Icon(icon, null, tint = color, modifier = Modifier.size(32.dp))
        }

        Spacer(Modifier.height(24.dp))

        Text(event.title, color = Color.White, fontSize = 22.sp, fontWeight = FontWeight.Black)
        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(vertical = 8.dp)) {
            Box(modifier = Modifier.size(8.dp).background(color, CircleShape))
            Spacer(Modifier.width(8.dp))
            Text(if (event.is_all_day) "All day" else "${event.start_time} - ${event.end_time}", color = color, fontSize = 12.sp, fontWeight = FontWeight.Bold)
        }

        Spacer(Modifier.height(24.dp))
        HorizontalDivider(color = Color.White.copy(alpha = 0.05f))
        
        val eventDate = try { 
            SimpleDateFormat("yyyy-MM-dd", Locale.US).parse(event.date) 
        } catch(e: Exception) { null }
        
        DetailItem(Icons.Default.CalendarToday, eventDate?.let { SimpleDateFormat("EEEE, d MMMM yyyy", Locale.US).format(it) } ?: event.date)
        if (event.recurrence != RecurrenceType.NONE) {
            DetailItem(Icons.Default.Refresh, "Repeat every ${event.recurrence.name.lowercase()}")
        }
        DetailItem(Icons.Default.FiberManualRecord, event.type.name.lowercase().replaceFirstChar { it.uppercase() }, color)
        DetailItem(Icons.Default.People, "Add people", Color.White.copy(alpha = 0.3f))
        DetailItem(Icons.Default.StickyNote2, event.description ?: "Add notes", Color.White.copy(alpha = 0.3f))

        Spacer(Modifier.weight(1f))

        Button(
            onClick = onEdit,
            modifier = Modifier.fillMaxWidth().height(48.dp),
            colors = ButtonDefaults.buttonColors(containerColor = AccentViolet),
            shape = RoundedCornerShape(12.dp)
        ) {
            Text("Edit Event", fontWeight = FontWeight.Bold)
        }
        
        Spacer(Modifier.height(12.dp))
        
        OutlinedButton(
            onClick = onDelete,
            modifier = Modifier.fillMaxWidth().height(48.dp),
            border = BorderStroke(1.dp, Color.White.copy(alpha = 0.05f)),
            shape = RoundedCornerShape(12.dp),
            colors = ButtonDefaults.outlinedButtonColors(contentColor = Color(0xFFFF4E70))
        ) {
            Text("Delete Event", fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
fun DetailItem(icon: androidx.compose.ui.graphics.vector.ImageVector, text: String, color: Color = Color.White) {
    Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(vertical = 12.dp)) {
        Icon(icon, null, tint = Color.White.copy(alpha = 0.4f), modifier = Modifier.size(18.dp))
        Spacer(Modifier.width(16.dp))
        Text(text, color = color, fontSize = 13.sp, fontWeight = FontWeight.Medium)
    }
}

fun getEventColor(type: CalendarEventType): Color {
    return when(type) {
        CalendarEventType.MEETING -> Color(0xFF8A5DF2)
        CalendarEventType.ANNIVERSARY -> Color(0xFFFF4E70)
        CalendarEventType.BIRTHDAY -> Color(0xFFF43F5E)
        CalendarEventType.WORK -> Color(0xFF10B981)
        CalendarEventType.REMINDER -> Color(0xFFFFB300)
        else -> Color(0xFF2DE1FC)
    }
}
