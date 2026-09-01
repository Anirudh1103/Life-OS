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
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.lifeos.ui.viewmodels.CalendarViewModel
import com.example.lifeos.ui.viewmodels.CalendarViewMode
import com.example.lifeos.data.models.CalendarEventType
import com.example.lifeos.data.models.CalendarEvent
import com.example.lifeos.data.models.RecurrenceType
import com.example.lifeos.theme.*
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun CalendarScreen(
    viewModel: CalendarViewModel = viewModel()
) {
    val selectedDate by viewModel.selectedDate.collectAsStateWithLifecycle()
    val viewMode by viewModel.viewMode.collectAsStateWithLifecycle()
    val dayEvents by viewModel.currentDayEvents.collectAsStateWithLifecycle()
    val upcomingEvents by viewModel.upcomingEvents.collectAsStateWithLifecycle()
    val selectedEvent by viewModel.selectedEvent.collectAsStateWithLifecycle()
    
    var showAddDialog by remember { mutableStateOf(false) }
    
    val dateTitle = SimpleDateFormat("d MMMM yyyy, EEEE", Locale.US).format(selectedDate.time)

    Row(modifier = Modifier.fillMaxSize().background(MaterialTheme.colorScheme.background)) {
        // Main Content Area
        Column(modifier = Modifier.weight(1f).padding(24.dp)) {
            CalendarHeader(
                viewMode = viewMode,
                onViewModeChange = { viewModel.setViewMode(it) },
                onAddClick = { showAddDialog = true }
            )

            Spacer(Modifier.height(32.dp))

            Row(verticalAlignment = Alignment.CenterVertically) {
                Button(
                    onClick = { viewModel.setDate(Calendar.getInstance()) },
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.surface),
                    shape = RoundedCornerShape(12.dp),
                    contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp)
                ) {
                    Text("Today", color = MaterialTheme.colorScheme.onSurface, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                }

                Spacer(modifier = Modifier.width(16.dp))

                Row(verticalAlignment = Alignment.CenterVertically) {
                    IconButton(onClick = { viewModel.prevDate() }) {
                        Icon(Icons.Default.ChevronLeft, null, tint = MaterialTheme.colorScheme.onBackground)
                    }
                    IconButton(onClick = { viewModel.nextDate() }) {
                        Icon(Icons.Default.ChevronRight, null, tint = MaterialTheme.colorScheme.onBackground)
                    }
                }

                Spacer(modifier = Modifier.width(8.dp))

                Text(dateTitle, color = MaterialTheme.colorScheme.onBackground, fontSize = 18.sp, fontWeight = FontWeight.Bold)

                Spacer(modifier = Modifier.weight(1f))

                Button(
                    onClick = { viewModel.fetchEvents() },
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.surface),
                    shape = RoundedCornerShape(12.dp),
                    contentPadding = PaddingValues(horizontal = 12.dp)
                ) {
                    Icon(Icons.Default.Sync, null, tint = MaterialTheme.colorScheme.onSurface, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Sync", color = MaterialTheme.colorScheme.onSurface, fontSize = 12.sp)
                }
            }

            Spacer(Modifier.height(24.dp))

            Box(modifier = Modifier.weight(1f)) {
                when(viewMode) {
                    CalendarViewMode.DAY -> DayView(selectedDate, dayEvents) { viewModel.selectEvent(it) }
                    else -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Text("View Mode Coming Soon", color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.3f))
                    }
                }
            }
        }

        // Right Sidebar Panel
        Surface(
            modifier = Modifier.width(340.dp).fillMaxHeight(),
            color = MaterialTheme.colorScheme.surface.copy(alpha = 0.3f),
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.1f))
        ) {
            Column(modifier = Modifier.fillMaxSize()) {
                if (selectedEvent != null) {
                    EventDetailsPanel(
                        event = selectedEvent!!,
                        onClose = { viewModel.selectEvent(null) },
                        onEdit = { },
                        onDelete = { viewModel.deleteEvent(selectedEvent!!.id) }
                    )
                } else {
                    Column(modifier = Modifier.padding(24.dp), verticalArrangement = Arrangement.spacedBy(32.dp)) {
                        MiniCalendar(selectedDate) { viewModel.setDate(it) }
                        UpcomingEventsList(upcomingEvents)
                        QuickAddRow { type -> 
                            // Open add dialog with pre-selected type
                            showAddDialog = true
                        }
                    }
                }
            }
        }
    }

    if (showAddDialog) {
        AddEventDialog(
            defaultDate = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(selectedDate.time),
            onDismiss = { showAddDialog = false },
            onConfirm = { event ->
                viewModel.createEvent(event)
                showAddDialog = false
            }
        )
    }
}

@Composable
fun CalendarHeader(
    viewMode: CalendarViewMode,
    onViewModeChange: (CalendarViewMode) -> Unit,
    onAddClick: () -> Unit
) {
    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
        Column {
            Text("Calendar", color = MaterialTheme.colorScheme.onBackground, fontSize = 28.sp, fontWeight = FontWeight.Black)
            Text("Plan your day. Stay on track.", color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.5f), fontSize = 13.sp)
        }

        Surface(
            color = MaterialTheme.colorScheme.surface,
            shape = RoundedCornerShape(12.dp),
            modifier = Modifier.padding(horizontal = 16.dp)
        ) {
            Row(modifier = Modifier.padding(4.dp)) {
                ViewModeButton("Day", viewMode == CalendarViewMode.DAY) { onViewModeChange(CalendarViewMode.DAY) }
                ViewModeButton("Week", viewMode == CalendarViewMode.WEEK) { onViewModeChange(CalendarViewMode.WEEK) }
                ViewModeButton("Month", viewMode == CalendarViewMode.MONTH) { onViewModeChange(CalendarViewMode.MONTH) }
            }
        }

        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            // Search Bar
            Surface(
                color = MaterialTheme.colorScheme.surface,
                shape = RoundedCornerShape(12.dp),
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f)),
                modifier = Modifier.width(240.dp).height(40.dp)
            ) {
                Row(modifier = Modifier.padding(horizontal = 12.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Search, null, tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.3f), modifier = Modifier.size(16.dp))
                    Spacer(Modifier.width(8.dp))
                    Text("Search events, meetings...", color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.3f), fontSize = 11.sp)
                    Spacer(Modifier.weight(1f))
                    Text("⌘ K", color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.2f), fontSize = 10.sp, fontWeight = FontWeight.Bold)
                }
            }

            IconButton(onClick = { }, modifier = Modifier.size(40.dp).background(MaterialTheme.colorScheme.surface, RoundedCornerShape(12.dp)).border(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f), RoundedCornerShape(12.dp))) {
                Icon(Icons.Default.FilterList, null, tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
            }

            Button(
                onClick = { onViewModeChange(CalendarViewMode.DAY /* Placeholder for Add */); onAddClick() },
                colors = ButtonDefaults.buttonColors(containerColor = AccentViolet),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.height(40.dp)
            ) {
                Icon(Icons.Default.Add, null, tint = Color.White, modifier = Modifier.size(16.dp))
                Spacer(Modifier.width(8.dp))
                Text("Add Event", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                Spacer(Modifier.width(4.dp))
                Icon(Icons.Default.KeyboardArrowDown, null, tint = Color.White, modifier = Modifier.size(16.dp))
            }
        }
    }
}

@Composable
fun ViewModeButton(label: String, selected: Boolean, onClick: () -> Unit) {
    Surface(
        onClick = onClick,
        color = if (selected) MaterialTheme.colorScheme.primary.copy(alpha = 0.2f) else Color.Transparent,
        shape = RoundedCornerShape(8.dp),
        modifier = Modifier.width(70.dp).height(32.dp)
    ) {
        Box(contentAlignment = Alignment.Center) {
            Text(label, color = if (selected) AccentCyan else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f), fontSize = 12.sp, fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium)
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddEventDialog(
    defaultDate: String,
    onDismiss: () -> Unit,
    onConfirm: (CalendarEvent) -> Unit
) {
    var title by remember { mutableStateOf("") }
    var location by remember { mutableStateOf("") }
    var type by remember { mutableStateOf(CalendarEventType.MEETING) }
    var isAllDay by remember { mutableStateOf(false) }
    var startTime by remember { mutableStateOf("09:00") }
    var endTime by remember { mutableStateOf("10:00") }
    var date by remember { mutableStateOf(defaultDate) }
    var recurrence by remember { mutableStateOf(RecurrenceType.NONE) }
    
    var showRecurrenceMenu by remember { mutableStateOf(false) }

    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = MaterialTheme.colorScheme.surface,
        title = { Text("Add New Directive", color = Color.White, fontWeight = FontWeight.Black) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                OutlinedTextField(
                    value = title,
                    onValueChange = { title = it },
                    label = { Text("Title") },
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = AccentCyan)
                )

                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Checkbox(checked = isAllDay, onCheckedChange = { isAllDay = it })
                        Text("All Day", color = Color.White.copy(alpha = 0.7f), fontSize = 12.sp)
                    }
                    
                    // Recurrence Dropdown
                    Box {
                        OutlinedButton(
                            onClick = { showRecurrenceMenu = true },
                            shape = RoundedCornerShape(8.dp),
                            border = BorderStroke(1.dp, Color.White.copy(alpha = 0.1f))
                        ) {
                            Text(recurrence.name.lowercase().replaceFirstChar { it.uppercase() }, color = AccentCyan, fontSize = 12.sp)
                            Icon(Icons.Default.ArrowDropDown, null, tint = AccentCyan)
                        }
                        DropdownMenu(
                            expanded = showRecurrenceMenu,
                            onDismissRequest = { showRecurrenceMenu = false },
                            modifier = Modifier.background(MaterialTheme.colorScheme.surface)
                        ) {
                            RecurrenceType.entries.forEach { type ->
                                DropdownMenuItem(
                                    text = { Text(type.name.lowercase().replaceFirstChar { it.uppercase() }, color = Color.White) },
                                    onClick = {
                                        recurrence = type
                                        showRecurrenceMenu = false
                                    }
                                )
                            }
                        }
                    }
                }

                if (!isAllDay) {
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        OutlinedTextField(
                            value = startTime,
                            onValueChange = { startTime = it },
                            label = { Text("Start (HH:mm)") },
                            modifier = Modifier.weight(1f),
                            textStyle = androidx.compose.ui.text.TextStyle(fontSize = 14.sp)
                        )
                        OutlinedTextField(
                            value = endTime,
                            onValueChange = { endTime = it },
                            label = { Text("End (HH:mm)") },
                            modifier = Modifier.weight(1f),
                            textStyle = androidx.compose.ui.text.TextStyle(fontSize = 14.sp)
                        )
                    }
                }

                OutlinedTextField(
                    value = date,
                    onValueChange = { date = it },
                    label = { Text("Date (yyyy-MM-dd)") },
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = location,
                    onValueChange = { location = it },
                    label = { Text("Location / URL") },
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (title.isBlank()) return@Button
                    val event = CalendarEvent(
                        id = UUID.randomUUID().toString(),
                        user_id = "", // Filled by VM
                        title = title,
                        type = type,
                        date = date,
                        start_time = if (isAllDay) null else startTime,
                        end_time = if (isAllDay) null else endTime,
                        is_all_day = isAllDay,
                        location = location,
                        recurrence = recurrence
                    )
                    onConfirm(event)
                },
                colors = ButtonDefaults.buttonColors(containerColor = AccentViolet)
            ) {
                Text("Confirm")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel", color = Color.White.copy(alpha = 0.5f))
            }
        }
    )
}
