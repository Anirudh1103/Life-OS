package com.example.lifeos.ui.tasks

import android.app.DatePickerDialog
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.lifeos.data.models.Task
import com.example.lifeos.data.models.TaskStep
import com.example.lifeos.ui.viewmodels.TasksViewModel
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun TasksScreen(
    modifier: Modifier = Modifier,
    viewModel: TasksViewModel = viewModel()
) {
    val tasks by viewModel.tasks.collectAsStateWithLifecycle()
    val subtaskCounts by viewModel.subtaskCounts.collectAsStateWithLifecycle()
    val selectedTask by viewModel.selectedTask.collectAsStateWithLifecycle()
    val selectedTaskSteps by viewModel.selectedTaskSteps.collectAsStateWithLifecycle()

    var selectedWorkspace by remember { mutableStateOf("personal") }
    var activeTab by remember { mutableStateOf("my_day") } // "my_day", "planned", "all", "completed"
    var isAddingTask by remember { mutableStateOf(false) }

    val darkBackground = Color(0xFF0C0A1C)
    val cardBackground = Color(0xFF13112E)
    val accentCyan = Color(0xFF2DE1FC)
    val accentViolet = Color(0xFF8A5DF2)

    // Filter tasks based on Workspace and Active Tab
    val filteredTasks = remember(tasks, selectedWorkspace, activeTab) {
        tasks.filter { t ->
            t.workspace == selectedWorkspace && when (activeTab) {
                "my_day" -> t.is_in_today && !t.is_completed
                "planned" -> t.due_at != null && !t.is_completed
                "all" -> true
                "completed" -> t.is_completed
                else -> true
            }
        }
    }

    Scaffold(
        modifier = modifier.fillMaxSize(),
        containerColor = darkBackground,
        floatingActionButtonPosition = FabPosition.Start, // Moves FAB to the bottom left side
        floatingActionButton = {
            if (selectedTask == null) {
                FloatingActionButton(
                    onClick = { isAddingTask = true },
                    containerColor = accentCyan,
                    contentColor = Color.Black,
                    shape = CircleShape
                ) {
                    Icon(Icons.Default.Add, contentDescription = "Add Task")
                }
            }
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .padding(paddingValues)
                .fillMaxSize()
        ) {
            // Force Single-Pane Layout for both phone and tablet to match user mockups
            val currentTask = selectedTask
            if (currentTask != null) {
                // Full Screen Detail view
                TaskDetailPanel(
                    task = currentTask,
                    steps = selectedTaskSteps,
                    cardBackground = cardBackground,
                    accentViolet = accentViolet,
                    onBack = { viewModel.selectTask(null) },
                    onTitleChange = { viewModel.updateTaskTitle(currentTask, it) },
                    onImportanceChange = { viewModel.updateTaskImportance(currentTask, it) },
                    onTodayChange = { viewModel.updateTaskInToday(currentTask, it) },
                    onPriorityChange = { viewModel.updateTaskPriority(currentTask, it) },
                    onDueDateChange = { viewModel.updateTaskDueDate(currentTask, it) },
                    onNotesChange = { viewModel.updateTaskNotes(currentTask, it) },
                    onToggleCompletion = { viewModel.toggleTask(currentTask) },
                    onDelete = {
                        viewModel.deleteTask(currentTask)
                        viewModel.selectTask(null)
                    },
                    onAddSubtask = { viewModel.addSubtask(currentTask, it) },
                    onToggleSubtask = { viewModel.toggleSubtask(it) },
                    onDeleteSubtask = { viewModel.deleteSubtask(it) }
                )
            } else {
                // Tasks List View
                Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
                    TasksListHeader(
                        selectedWorkspace = selectedWorkspace,
                        activeTab = activeTab,
                        onWorkspaceChange = { selectedWorkspace = it },
                        onTabChange = { activeTab = it },
                        accentViolet = accentViolet
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    TasksListContent(
                        tasks = filteredTasks,
                        subtaskCounts = subtaskCounts,
                        selectedTask = null,
                        cardBackground = cardBackground,
                        accentViolet = accentViolet,
                        onSelect = { viewModel.selectTask(it) },
                        onToggle = { viewModel.toggleTask(it) },
                        onToggleImportance = { t, imp -> viewModel.updateTaskImportance(t, imp) }
                    )
                }
            }

            if (isAddingTask) {
                AddTaskBottomSheet(
                    workspace = selectedWorkspace,
                    onDismiss = { isAddingTask = false },
                    onConfirm = { title, addToMyDay, dueAt ->
                        viewModel.addTask(title, selectedWorkspace, addToMyDay, dueAt)
                        isAddingTask = false
                    }
                )
            }
        }
    }
}

@Composable
fun TasksListHeader(
    selectedWorkspace: String,
    activeTab: String,
    onWorkspaceChange: (String) -> Unit,
    onTabChange: (String) -> Unit,
    accentViolet: Color
) {
    val cardBackground = Color(0xFF13112E)

    Text(
        "Tasks",
        color = Color.White,
        fontSize = 24.sp,
        fontWeight = FontWeight.Black
    )

    Spacer(modifier = Modifier.height(12.dp))

    // Workspace Selector Tabs
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(cardBackground, RoundedCornerShape(12.dp))
            .padding(4.dp)
    ) {
        WorkspaceTab("Personal", selectedWorkspace == "personal", accentViolet, Modifier.weight(1f)) { onWorkspaceChange("personal") }
        WorkspaceTab("Work", selectedWorkspace == "work", Color(0xFF00FFC6), Modifier.weight(1f)) { onWorkspaceChange("work") }
    }

    Spacer(modifier = Modifier.height(16.dp))

    // Sub-Navigation tabs (My Day, Planned, All, Completed)
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        listOf(
            "my_day" to "My Day",
            "planned" to "Planned",
            "all" to "All",
            "completed" to "Completed"
        ).forEach { (tabId, label) ->
            val isSelected = activeTab == tabId
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(16.dp))
                    .background(if (isSelected) Color(0xFF221E4E) else Color.Transparent)
                    .clickable { onTabChange(tabId) }
                    .padding(horizontal = 12.dp, vertical = 6.dp)
            ) {
                Text(
                    text = label,
                    color = if (isSelected) Color.White else Color.White.copy(alpha = 0.5f),
                    fontSize = 11.sp,
                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium
                )
            }
        }
    }
}

@Composable
fun WorkspaceTab(
    label: String,
    isSelected: Boolean,
    color: Color,
    modifier: Modifier,
    onClick: () -> Unit
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(8.dp))
            .background(if (isSelected) color.copy(alpha = 0.15f) else Color.Transparent)
            .clickable { onClick() }
            .padding(vertical = 8.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = label,
            color = if (isSelected) color else Color.White.copy(alpha = 0.5f),
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold
        )
    }
}

@Composable
fun SectionHeader(title: String, count: Int) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier.padding(top = 16.dp, bottom = 8.dp)
    ) {
        Text(title, color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Black)
        Spacer(modifier = Modifier.width(8.dp))
        Box(
            modifier = Modifier
                .background(Color(0xFF221E4E), RoundedCornerShape(8.dp))
                .padding(horizontal = 8.dp, vertical = 2.dp)
        ) {
            Text("$count", color = Color(0xFF2DE1FC), fontSize = 10.sp, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
fun TasksListContent(
    tasks: List<Task>,
    subtaskCounts: Map<String, Pair<Int, Int>>,
    selectedTask: Task?,
    cardBackground: Color,
    accentViolet: Color,
    onSelect: (Task) -> Unit,
    onToggle: (Task) -> Unit,
    onToggleImportance: (Task, Boolean) -> Unit
) {
    val today = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())
    val tomorrow = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(
        Calendar.getInstance().apply { add(Calendar.DAY_OF_YEAR, 1) }.time
    )

    // Timeline grouping matching mockup layout (Today, Tomorrow, Upcoming/Others)
    val todayTasks = tasks.filter {
        it.is_in_today || (it.due_at != null && it.due_at.startsWith(today))
    }
    val tomorrowTasks = tasks.filter {
        it.due_at != null && it.due_at.startsWith(tomorrow) && !it.is_in_today
    }
    val upcomingTasks = tasks.filter {
        it.id !in todayTasks.map { t -> t.id } && it.id !in tomorrowTasks.map { t -> t.id }
    }

    LazyColumn(
        verticalArrangement = Arrangement.spacedBy(8.dp),
        modifier = Modifier.fillMaxSize()
    ) {
        if (tasks.isEmpty()) {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 80.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            "Your day is clear.",
                            color = Color.White,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            "Create your first task and start making progress.",
                            color = Color.White.copy(alpha = 0.4f),
                            fontSize = 11.sp
                        )
                    }
                }
            }
        } else {
            if (todayTasks.isNotEmpty()) {
                item { SectionHeader("Today", todayTasks.size) }
                items(todayTasks, key = { it.id }) { task ->
                    val counts = subtaskCounts[task.id] ?: Pair(0, 0)
                    TaskCardItem(
                        task = task,
                        completedSubtasks = counts.first,
                        totalSubtasks = counts.second,
                        isSelected = selectedTask?.id == task.id,
                        cardBackground = cardBackground,
                        accentViolet = accentViolet,
                        onClick = { onSelect(task) },
                        onToggle = { onToggle(task) },
                        onToggleImportance = { onToggleImportance(task, !task.is_important) }
                    )
                }
            }

            if (tomorrowTasks.isNotEmpty()) {
                item { SectionHeader("Tomorrow", tomorrowTasks.size) }
                items(tomorrowTasks, key = { it.id }) { task ->
                    val counts = subtaskCounts[task.id] ?: Pair(0, 0)
                    TaskCardItem(
                        task = task,
                        completedSubtasks = counts.first,
                        totalSubtasks = counts.second,
                        isSelected = selectedTask?.id == task.id,
                        cardBackground = cardBackground,
                        accentViolet = accentViolet,
                        onClick = { onSelect(task) },
                        onToggle = { onToggle(task) },
                        onToggleImportance = { onToggleImportance(task, !task.is_important) }
                    )
                }
            }

            if (upcomingTasks.isNotEmpty()) {
                item { SectionHeader("Upcoming & Others", upcomingTasks.size) }
                items(upcomingTasks, key = { it.id }) { task ->
                    val counts = subtaskCounts[task.id] ?: Pair(0, 0)
                    TaskCardItem(
                        task = task,
                        completedSubtasks = counts.first,
                        totalSubtasks = counts.second,
                        isSelected = selectedTask?.id == task.id,
                        cardBackground = cardBackground,
                        accentViolet = accentViolet,
                        onClick = { onSelect(task) },
                        onToggle = { onToggle(task) },
                        onToggleImportance = { onToggleImportance(task, !task.is_important) }
                    )
                }
            }
        }
    }
}

@Composable
fun TaskCardItem(
    task: Task,
    completedSubtasks: Int,
    totalSubtasks: Int,
    isSelected: Boolean,
    cardBackground: Color,
    accentViolet: Color,
    onClick: () -> Unit,
    onToggle: () -> Unit,
    onToggleImportance: () -> Unit
) {
    val isHigh = task.priority == "high"
    val isMedium = task.priority == "medium"
    val isLow = task.priority == "low"

    val priorityColor = when {
        isHigh -> accentViolet
        isMedium -> Color(0xFFFFB300)
        isLow -> Color(0xFF00FFC6)
        else -> Color.Transparent
    }

    Card(
        colors = CardDefaults.cardColors(
            containerColor = if (isSelected) cardBackground.copy(alpha = 0.7f) else cardBackground
        ),
        shape = RoundedCornerShape(16.dp),
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .border(
                width = 1.dp,
                color = if (isSelected) accentViolet.copy(alpha = 0.5f) else Color.Transparent,
                shape = RoundedCornerShape(16.dp)
            )
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onToggle) {
                Icon(
                    imageVector = if (task.is_completed) Icons.Default.CheckCircle else Icons.Default.RadioButtonUnchecked,
                    contentDescription = null,
                    tint = if (task.is_completed) accentViolet else Color.White.copy(alpha = 0.3f),
                    modifier = Modifier.size(22.dp)
                )
            }

            Spacer(modifier = Modifier.width(6.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = task.title,
                    color = if (task.is_completed) Color.White.copy(alpha = 0.4f) else Color.White,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    textDecoration = if (task.is_completed) TextDecoration.LineThrough else TextDecoration.None
                )

                // Subtitle details
                if (task.due_at != null || task.priority != "none" || totalSubtasks > 0) {
                    Spacer(modifier = Modifier.height(4.dp))
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        if (task.due_at != null) {
                            val formattedDate = remember(task.due_at) {
                                try {
                                    val date = SimpleDateFormat("yyyy-MM-dd", Locale.US).parse(task.due_at.split("T")[0])
                                    if (date != null) {
                                        SimpleDateFormat("dd MMM", Locale.US).format(date)
                                    } else ""
                                } catch (e: Exception) {
                                    ""
                                }
                            }
                            Text(
                                text = formattedDate,
                                color = Color.White.copy(alpha = 0.4f),
                                fontSize = 10.sp
                            )
                        }

                        if (totalSubtasks > 0) {
                            Text(
                                text = "$completedSubtasks/$totalSubtasks subtasks",
                                color = Color.White.copy(alpha = 0.4f),
                                fontSize = 10.sp
                            )
                        }

                        if (task.priority != "none") {
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(4.dp))
                                    .background(priorityColor.copy(alpha = 0.15f))
                                    .padding(horizontal = 4.dp, vertical = 2.dp)
                            ) {
                                Text(
                                    text = task.priority.uppercase(),
                                    color = priorityColor,
                                    fontSize = 8.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }
                }
            }

            IconButton(onClick = onToggleImportance) {
                Icon(
                    imageVector = if (task.is_important) Icons.Default.Star else Icons.Default.StarBorder,
                    contentDescription = null,
                    tint = if (task.is_important) accentViolet else Color.White.copy(alpha = 0.2f),
                    modifier = Modifier.size(18.dp)
                )
            }
        }
    }
}

@Composable
fun TaskDetailPanel(
    task: Task,
    steps: List<TaskStep>,
    cardBackground: Color,
    accentViolet: Color,
    onBack: () -> Unit,
    onTitleChange: (String) -> Unit,
    onImportanceChange: (Boolean) -> Unit,
    onTodayChange: (Boolean) -> Unit,
    onPriorityChange: (String) -> Unit,
    onDueDateChange: (String?) -> Unit,
    onNotesChange: (String?) -> Unit,
    onToggleCompletion: () -> Unit,
    onDelete: () -> Unit,
    onAddSubtask: (String) -> Unit,
    onToggleSubtask: (TaskStep) -> Unit,
    onDeleteSubtask: (TaskStep) -> Unit
) {
    val context = LocalContext.current
    var editingTitle by remember(task) { mutableStateOf(task.title) }
    var notesText by remember(task) { mutableStateOf(task.description ?: "") }
    var isPriorityMenuExpanded by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0C0A1C))
            .padding(16.dp)
    ) {
        // Toolbar header with Edit and Delete options on the right
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onBack) {
                Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = Color.White)
            }
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = { /* Pencil Edit Trigger placeholder */ }) {
                    Icon(Icons.Default.Edit, contentDescription = "Edit title", tint = Color.White.copy(alpha = 0.6f))
                }
                IconButton(onClick = onDelete) {
                    Icon(Icons.Default.Delete, contentDescription = "Delete Directive", tint = Color.Red.copy(alpha = 0.8f))
                }
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        // Large Checkbox and Editable Title Row
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onToggleCompletion) {
                Icon(
                    imageVector = if (task.is_completed) Icons.Default.CheckCircle else Icons.Default.RadioButtonUnchecked,
                    contentDescription = "Status",
                    tint = if (task.is_completed) accentViolet else Color.White.copy(alpha = 0.3f),
                    modifier = Modifier.size(28.dp)
                )
            }

            Spacer(modifier = Modifier.width(8.dp))

            OutlinedTextField(
                value = editingTitle,
                onValueChange = {
                    editingTitle = it
                    onTitleChange(it)
                },
                modifier = Modifier.weight(1f),
                textStyle = MaterialTheme.typography.titleLarge.copy(
                    color = Color.White,
                    fontWeight = FontWeight.Black,
                    textDecoration = if (task.is_completed) TextDecoration.LineThrough else TextDecoration.None
                ),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = Color.Transparent,
                    unfocusedBorderColor = Color.Transparent,
                    focusedContainerColor = Color.Transparent,
                    unfocusedContainerColor = Color.Transparent
                ),
                placeholder = { Text("Task Title...", color = Color.White.copy(alpha = 0.3f)) }
            )

            IconButton(onClick = { onImportanceChange(!task.is_important) }) {
                Icon(
                    imageVector = if (task.is_important) Icons.Default.Star else Icons.Default.StarBorder,
                    contentDescription = "Star",
                    tint = if (task.is_important) accentViolet else Color.White.copy(alpha = 0.2f),
                    modifier = Modifier.size(24.dp)
                )
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        // Horizontal Metadata Chips
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Due Date Chip
            val dueAt = task.due_at
            val dateLabel = if (dueAt != null) {
                try {
                    val date = SimpleDateFormat("yyyy-MM-dd", Locale.US).parse(dueAt.split("T")[0])
                    if (date != null) {
                        SimpleDateFormat("EEE, d MMM", Locale.US).format(date)
                    } else "Add due date"
                } catch (e: Exception) {
                    dueAt.split("T")[0]
                }
            } else "Add due date"

            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(20.dp))
                    .background(cardBackground)
                    .clickable {
                        val calendar = Calendar.getInstance()
                        DatePickerDialog(
                            context,
                            { _, year, month, dayOfMonth ->
                                val dateStr = String.format(Locale.US, "%d-%02d-%02d", year, month + 1, dayOfMonth)
                                onDueDateChange(dateStr)
                            },
                            calendar.get(Calendar.YEAR),
                            calendar.get(Calendar.MONTH),
                            calendar.get(Calendar.DAY_OF_MONTH)
                        ).show()
                    }
                    .padding(horizontal = 12.dp, vertical = 6.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.CalendarToday, contentDescription = null, tint = Color(0xFF2DE1FC), modifier = Modifier.size(12.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(dateLabel, color = Color.White.copy(alpha = 0.8f), fontSize = 10.sp, fontWeight = FontWeight.Bold)
                }
            }

            // Priority Chip
            val isHigh = task.priority == "high"
            val isMedium = task.priority == "medium"
            val isLow = task.priority == "low"
            val priorityColor = when {
                isHigh -> accentViolet
                isMedium -> Color(0xFFFFB300)
                isLow -> Color(0xFF00FFC6)
                else -> Color.White.copy(alpha = 0.4f)
            }
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(20.dp))
                    .background(cardBackground)
                    .clickable { isPriorityMenuExpanded = true }
                    .padding(horizontal = 12.dp, vertical = 6.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Flag, contentDescription = null, tint = priorityColor, modifier = Modifier.size(12.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = if (task.priority != "none") task.priority.uppercase() else "Priority",
                        color = Color.White.copy(alpha = 0.8f),
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
                DropdownMenu(
                    expanded = isPriorityMenuExpanded,
                    onDismissRequest = { isPriorityMenuExpanded = false },
                    modifier = Modifier.background(cardBackground)
                ) {
                    listOf("none", "low", "medium", "high").forEach { pri ->
                        DropdownMenuItem(
                            text = { Text(pri.uppercase(), color = Color.White) },
                            onClick = {
                                onPriorityChange(pri)
                                isPriorityMenuExpanded = false
                            }
                        )
                    }
                }
            }

            // Workspace List Chip
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(20.dp))
                    .background(cardBackground)
                    .padding(horizontal = 12.dp, vertical = 6.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.Book,
                        contentDescription = null,
                        tint = Color(0xFF8A5DF2),
                        modifier = Modifier.size(12.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(task.workspace.uppercase(), color = Color.White.copy(alpha = 0.8f), fontSize = 10.sp, fontWeight = FontWeight.Bold)
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Subtasks Progress Segment
        val totalSteps = steps.size
        val completedSteps = steps.count { it.is_completed }
        val progress = if (totalSteps > 0) completedSteps.toFloat() / totalSteps.toFloat() else 0f

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                "Subtasks",
                color = Color.White,
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold
            )
            Text(
                "$completedSteps / $totalSteps",
                color = Color.White.copy(alpha = 0.5f),
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold
            )
        }

        Spacer(modifier = Modifier.height(8.dp))
        LinearProgressIndicator(
            progress = { progress },
            modifier = Modifier
                .fillMaxWidth()
                .height(6.dp)
                .clip(RoundedCornerShape(3.dp)),
            color = accentViolet,
            trackColor = cardBackground
        )

        Spacer(modifier = Modifier.height(12.dp))

        // Subtasks List Checklist
        var newSubtaskTitle by remember { mutableStateOf("") }
        Column(modifier = Modifier.weight(1f)) {
            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.weight(1f)
            ) {
                if (steps.isEmpty()) {
                    item {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 16.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                "No subtasks yet. Break this task into steps.",
                                color = Color.White.copy(alpha = 0.25f),
                                fontSize = 11.sp
                            )
                        }
                    }
                } else {
                    items(steps, key = { it.id }) { step ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(cardBackground.copy(alpha = 0.4f), RoundedCornerShape(8.dp))
                                .padding(horizontal = 8.dp, vertical = 4.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            IconButton(onClick = { onToggleSubtask(step) }) {
                                Icon(
                                    imageVector = if (step.is_completed) Icons.Default.CheckCircle else Icons.Default.RadioButtonUnchecked,
                                    contentDescription = null,
                                    tint = if (step.is_completed) accentViolet else Color.White.copy(alpha = 0.3f),
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = step.title,
                                color = if (step.is_completed) Color.White.copy(alpha = 0.4f) else Color.White,
                                fontSize = 13.sp,
                                textDecoration = if (step.is_completed) TextDecoration.LineThrough else TextDecoration.None,
                                modifier = Modifier.weight(1f)
                            )
                            IconButton(onClick = { /* Reorder handle placeholder */ }) {
                                Icon(
                                    imageVector = Icons.Default.DragHandle,
                                    contentDescription = "Reorder",
                                    tint = Color.White.copy(alpha = 0.2f),
                                    modifier = Modifier.size(16.dp)
                                )
                            }
                            IconButton(onClick = { onDeleteSubtask(step) }) {
                                Icon(
                                    Icons.Default.Delete,
                                    contentDescription = "Delete",
                                    tint = Color.White.copy(alpha = 0.2f),
                                    modifier = Modifier.size(16.dp)
                                )
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Add subtask inline input styled as simple text button
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable {
                        if (newSubtaskTitle.isNotBlank()) {
                            onAddSubtask(newSubtaskTitle.trim())
                            newSubtaskTitle = ""
                        }
                    }
                    .padding(vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(Icons.Default.Add, contentDescription = null, tint = accentViolet, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(8.dp))
                BasicTextField(
                    value = newSubtaskTitle,
                    onValueChange = { newSubtaskTitle = it },
                    textStyle = MaterialTheme.typography.bodyMedium.copy(color = Color.White),
                    modifier = Modifier.weight(1f),
                    decorationBox = { innerTextField ->
                        if (newSubtaskTitle.isEmpty()) {
                            Text("Add subtask", color = accentViolet, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                        innerTextField()
                    }
                )
                if (newSubtaskTitle.isNotBlank()) {
                    IconButton(
                        onClick = {
                            onAddSubtask(newSubtaskTitle.trim())
                            newSubtaskTitle = ""
                        },
                        modifier = Modifier
                            .background(accentViolet, CircleShape)
                            .size(24.dp)
                    ) {
                        Icon(Icons.Default.Check, contentDescription = "Confirm", tint = Color.White, modifier = Modifier.size(12.dp))
                    }
                }
            }
        }

        // Notes Area
        Text(
            "Notes",
            color = Color.White,
            fontSize = 14.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(bottom = 8.dp, top = 16.dp)
        )

        Card(
            colors = CardDefaults.cardColors(containerColor = cardBackground),
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier.fillMaxWidth().height(100.dp),
            border = BorderStroke(1.dp, Color.White.copy(alpha = 0.03f))
        ) {
            Box(modifier = Modifier.fillMaxSize().padding(12.dp)) {
                BasicTextField(
                    value = notesText,
                    onValueChange = {
                        notesText = it
                        onNotesChange(it.ifBlank { null })
                    },
                    modifier = Modifier.fillMaxSize().padding(bottom = 20.dp),
                    textStyle = MaterialTheme.typography.bodyMedium.copy(color = Color.White),
                    decorationBox = { innerTextField ->
                        if (notesText.isEmpty()) {
                            Text(
                                "Add a note... Capture context, links, or ideas.",
                                color = Color.White.copy(alpha = 0.3f),
                                fontSize = 12.sp
                            )
                        }
                        innerTextField()
                    }
                )
                Icon(
                    imageVector = Icons.Default.Edit,
                    contentDescription = "Edit Notes",
                    tint = Color.White.copy(alpha = 0.4f),
                    modifier = Modifier
                        .size(16.dp)
                        .align(Alignment.BottomEnd)
                        .clickable { /* Notes focus trigger placeholder */ }
                )
            }
        }

        // Bottom completion Action Button (Gradient full width)
        Spacer(modifier = Modifier.height(24.dp))
        Button(
            onClick = onToggleCompletion,
            modifier = Modifier
                .fillMaxWidth()
                .height(48.dp)
                .background(
                    brush = Brush.linearGradient(
                        colors = listOf(accentViolet, Color(0xFF6366F1))
                    ),
                    shape = RoundedCornerShape(12.dp)
                ),
            colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
            shape = RoundedCornerShape(12.dp),
            contentPadding = PaddingValues()
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Center
            ) {
                Icon(
                    imageVector = if (task.is_completed) Icons.Default.RadioButtonUnchecked else Icons.Default.Check,
                    contentDescription = null,
                    tint = Color.White,
                    modifier = Modifier.size(16.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = if (task.is_completed) "MARK AS INCOMPLETE" else "MARK AS COMPLETED",
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    fontSize = 12.sp,
                    letterSpacing = 1.sp
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddTaskBottomSheet(
    workspace: String,
    onDismiss: () -> Unit,
    onConfirm: (title: String, addToMyDay: Boolean, dueAt: String?) -> Unit
) {
    var title by remember { mutableStateOf("") }
    var addToMyDay by remember { mutableStateOf(true) }
    var dueAt by remember { mutableStateOf<String?>(null) }
    val context = LocalContext.current

    val accentCyan = Color(0xFF2DE1FC)
    val cardBackground = Color(0xFF13112E)

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = Color(0xFF0C0A1C)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(24.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text("Create New Task", color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Bold)

            OutlinedTextField(
                value = title,
                onValueChange = { title = it },
                label = { Text("What needs to be done?", color = Color.White.copy(alpha = 0.5f)) },
                modifier = Modifier.fillMaxWidth(),
                colors = OutlinedTextFieldDefaults.colors(
                    unfocusedTextColor = Color.White,
                    focusedTextColor = Color.White,
                    focusedBorderColor = accentCyan,
                    unfocusedBorderColor = Color.White.copy(alpha = 0.1f)
                ),
                singleLine = true
            )

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Add to My Day", color = Color.White, fontSize = 14.sp)
                Switch(
                    checked = addToMyDay,
                    onCheckedChange = { addToMyDay = it },
                    colors = SwitchDefaults.colors(
                        checkedThumbColor = accentCyan,
                        checkedTrackColor = accentCyan.copy(alpha = 0.2f)
                    )
                )
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Due Date", color = Color.White, fontSize = 14.sp)
                Button(
                    onClick = {
                        val calendar = Calendar.getInstance()
                        DatePickerDialog(
                            context,
                            { _, year, month, dayOfMonth ->
                                dueAt = String.format(Locale.US, "%d-%02d-%02d", year, month + 1, dayOfMonth)
                            },
                            calendar.get(Calendar.YEAR),
                            calendar.get(Calendar.MONTH),
                            calendar.get(Calendar.DAY_OF_MONTH)
                        ).show()
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = cardBackground)
                ) {
                    Text(dueAt ?: "Select Date", color = accentCyan)
                }
            }

            Button(
                onClick = {
                    if (title.isNotBlank()) {
                        onConfirm(title.trim(), addToMyDay, dueAt)
                    }
                },
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(containerColor = accentCyan),
                shape = RoundedCornerShape(12.dp)
            ) {
                Text("Add Task", color = Color.Black, fontWeight = FontWeight.Bold)
            }
        }
    }
}
