package com.example.lifeos.ui.dashboard

import androidx.compose.animation.*
import androidx.compose.animation.core.tween
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.lifeos.VoiceEnrollment
import com.example.lifeos.Calendar
import com.example.lifeos.Focus
import com.example.lifeos.Fitness
import com.example.lifeos.Learning
import com.example.lifeos.Finance
import com.example.lifeos.Settings
import com.example.lifeos.Tasks
import com.example.lifeos.jarvis.orbVisualState
import com.example.lifeos.R
import com.example.lifeos.theme.*
import com.example.lifeos.data.models.Task
import com.example.lifeos.data.models.Category
import com.example.lifeos.data.models.Topic
import com.example.lifeos.data.models.FinanceAccount
import com.example.lifeos.data.models.FinanceTransaction
import com.example.lifeos.data.models.FitnessActivity
import com.example.lifeos.jarvis.prefs.JarvisPrefs
import com.example.lifeos.theme.*
import com.example.lifeos.ui.components.LifeOSCard
import com.example.lifeos.ui.components.LifeOSOrb
import com.example.lifeos.ui.utils.LifeOSWindowSize
import com.example.lifeos.ui.viewmodels.DashboardViewModel
import androidx.navigation3.runtime.NavKey
import java.text.SimpleDateFormat
import java.util.*
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.text.style.TextAlign

@Composable
fun DashboardScreen(
    onNavigate: (NavKey) -> Unit,
    windowSize: LifeOSWindowSize,
    modifier: Modifier = Modifier,
    viewModel: DashboardViewModel = viewModel()
) {
    val tasks by viewModel.tasks.collectAsStateWithLifecycle()
    val calendarEvents by viewModel.calendarEvents.collectAsStateWithLifecycle()
    val context = LocalContext.current
    val needsJarvisSetup = remember { !JarvisPrefs.isSetupCompleted(context) }

    LaunchedEffect(Unit) {
        viewModel.refresh()
    }

    val displayTasks = remember(tasks) {
        tasks.filter { t -> t.is_in_today || t.due_at != null }
            .sortedWith(compareBy<Task> { it.is_completed }.thenBy { it.due_at ?: "" })
            .take(6) // Increased for larger screens
    }

    val isCompact = windowSize == LifeOSWindowSize.Compact
    val isExpanded = windowSize == LifeOSWindowSize.Expanded

    if (!isCompact) {
        LandscapeDashboard(onNavigate, displayTasks, viewModel)
    } else {
        Box(modifier = modifier.fillMaxSize().background(MaterialTheme.colorScheme.background)) {
            LazyColumn(
                modifier = Modifier.fillMaxSize().padding(horizontal = if (isCompact) 20.dp else 32.dp),
                verticalArrangement = Arrangement.spacedBy(28.dp)
            ) {
                item { Spacer(Modifier.height(12.dp)) }

                item { WelcomeHeader(viewModel, windowSize) }

                if (needsJarvisSetup) {
                    item { JarvisSetupBanner(onSetup = { onNavigate(VoiceEnrollment) }) }
                }

                item { TodayAtAGlance(tasks, windowSize) }

                if (isCompact) {
                    val todayDate = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())
                    val todayEvents = calendarEvents.filter { it.date == todayDate }
                    
                    if (todayEvents.isNotEmpty()) {
                        item {
                            Text(
                                "Today's Schedule",
                                color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.4f),
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Black,
                                letterSpacing = 1.sp
                            )
                            Spacer(Modifier.height(16.dp))
                            LifeOSCard {
                                todayEvents.take(2).forEachIndexed { index, event ->
                                    ScheduleItem(
                                        time = if (event.is_all_day) "All day" else "${formatTime12(event.start_time ?: "")} – ${formatTime12(event.end_time ?: "")}",
                                        title = event.title,
                                        loc = event.location ?: "Online",
                                        accentColor = if (event.type == com.example.lifeos.data.models.CalendarEventType.MEETING) AccentViolet else AccentCyan
                                    )
                                    if (index < todayEvents.size.coerceAtMost(2) - 1) {
                                        Spacer(Modifier.height(12.dp))
                                    }
                                }
                            }
                        }
                    }
                }

                item {
                    if (isExpanded) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(28.dp)
                        ) {
                            Box(modifier = Modifier.weight(1.5f)) {
                                PersonalisedTaskList(displayTasks, onNavigate, onToggle = { viewModel.toggleTask(it) })
                            }
                            Box(modifier = Modifier.weight(1f)) {
                                JarvisInsightsCard()
                            }
                        }
                    } else {
                        PersonalisedTaskList(displayTasks, onNavigate, onToggle = { viewModel.toggleTask(it) })
                    }
                }

                item { QuickActions(onNavigate, windowSize) }

                item { Spacer(Modifier.height(80.dp)) }
            }
        }
    }
}

@Composable
fun WelcomeHeader(viewModel: DashboardViewModel, windowSize: LifeOSWindowSize) {
    val date by viewModel.currentDate.collectAsStateWithLifecycle()
    val time by viewModel.currentTime.collectAsStateWithLifecycle()
    val hour = java.util.Calendar.getInstance().get(java.util.Calendar.HOUR_OF_DAY)
    val title = if (System.currentTimeMillis() % 2 == 0L) "Sir" else "Boss"
    val greeting = when (hour) {
        in 5..11 -> "Good morning, $title ☀️"
        in 12..16 -> "Good afternoon, $title 🌤️"
        else -> "Good evening, $title 🌙"
    }

    val isCompact = windowSize == LifeOSWindowSize.Compact

    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.Bottom
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = greeting,
                color = MaterialTheme.colorScheme.onBackground,
                fontSize = if (isCompact) 32.sp else 42.sp,
                fontWeight = FontWeight.Black,
                letterSpacing = (-0.5).sp
            )
            Text(
                text = "Have a productive and amazing day ahead.",
                color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.5f),
                fontSize = if (isCompact) 14.sp else 16.sp,
                modifier = Modifier.padding(top = 4.dp)
            )
            
            Row(
                modifier = Modifier.padding(top = 16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                HeaderChip(Icons.Default.CalendarToday, date, AccentCyan)
                Spacer(Modifier.width(12.dp))
                HeaderChip(Icons.Default.Schedule, time, AccentViolet)
            }
        }
        
        if (!isCompact) {
            ProfileHeaderAction { /* Navigate to profile */ }
        }
    }
}

@Composable
fun ProfileHeaderAction(onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .size(48.dp)
            .clip(CircleShape)
            .background(MaterialTheme.colorScheme.surface)
            .border(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.1f), CircleShape)
            .clickable { onClick() },
        contentAlignment = Alignment.Center
    ) {
        Icon(Icons.Default.Person, null, tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f), modifier = Modifier.size(24.dp))
    }
}

@Composable
fun HeaderChip(icon: ImageVector, text: String, color: Color) {
    Surface(
        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
        shape = RoundedCornerShape(12.dp),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.1f))
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(icon, null, tint = color, modifier = Modifier.size(14.dp))
            Spacer(Modifier.width(8.dp))
            Text(text, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f), fontSize = 12.sp, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
fun TodayAtAGlance(tasks: List<Task>, windowSize: LifeOSWindowSize) {
    val isCompact = windowSize == LifeOSWindowSize.Compact
    
    Column {
        Text(
            "Today at a glance",
            color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.4f),
            fontSize = 12.sp,
            fontWeight = FontWeight.Black,
            letterSpacing = 1.sp
        )
        Spacer(Modifier.height(16.dp))
        
        if (isCompact) {
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                val total = tasks.size
                val completed = tasks.count { it.is_completed }
                val title = if (System.currentTimeMillis() % 2 == 0L) "Sir" else "Boss"
                GlanceCard("Tasks", total.toString(), "Total", Icons.Default.List, AccentViolet, Modifier.weight(1f))
                GlanceCard("Done", completed.toString(), "Today", Icons.Default.CheckCircle, Color(0xFF10B981), Modifier.weight(1f))
                GlanceCard("Focus", "Active", "Neural", Icons.Default.Timer, AccentCyan, Modifier.weight(1f))
                GlanceCard("Status", "Online", title, Icons.Default.LocalFireDepartment, Color(0xFFFFB300), Modifier.weight(1f))
            }
        } else {
            // Adaptive layout for tablet: wider cards or grid
            Row(horizontalArrangement = Arrangement.spacedBy(20.dp)) {
                val total = tasks.size
                val completed = tasks.count { it.is_completed }
                val title = if (System.currentTimeMillis() % 2 == 0L) "Sir" else "Boss"
                GlanceCard("Active Tasks", total.toString(), "directives pending", Icons.Default.List, AccentViolet, Modifier.weight(1f))
                GlanceCard("Completed", completed.toString(), "finished today", Icons.Default.CheckCircle, Color(0xFF10B981), Modifier.weight(1f))
                GlanceCard("Focus Session", "Orb Active", "deep work", Icons.Default.Timer, AccentCyan, Modifier.weight(1f))
                GlanceCard("Core Status", "Nominal", title, Icons.Default.LocalFireDepartment, Color(0xFFFFB300), Modifier.weight(1f))
            }
        }
    }
}

@Composable
fun GlanceCard(title: String, value: String, sub: String, icon: ImageVector, color: Color, modifier: Modifier) {
    Surface(
        modifier = modifier,
        color = MaterialTheme.colorScheme.surface.copy(alpha = 0.5f),
        shape = RoundedCornerShape(20.dp),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.1f))
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            horizontalAlignment = Alignment.Start
        ) {
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .background(color.copy(alpha = 0.1f), CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Icon(icon, null, tint = color, modifier = Modifier.size(18.dp))
            }
            Spacer(Modifier.height(16.dp))
            Text(title, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f), fontSize = 11.sp, fontWeight = FontWeight.Bold)
            Text(value, color = MaterialTheme.colorScheme.onSurface, fontSize = 24.sp, fontWeight = FontWeight.Black)
            Text(sub, color = color.copy(alpha = 0.5f), fontSize = 10.sp, fontWeight = FontWeight.Medium)
        }
    }
}

@Composable
fun PersonalisedTaskList(tasks: List<Task>, onNavigate: (NavKey) -> Unit, onToggle: (Task) -> Unit) {
    Column {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("Personalised Task List", color = MaterialTheme.colorScheme.onBackground, fontSize = 18.sp, fontWeight = FontWeight.Bold)
            Text(
                "View all",
                color = AccentCyan,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.clickable { /* onNavigate(Tasks) */ }
            )
        }
        Spacer(Modifier.height(16.dp))
        LifeOSCard {
            if (tasks.isEmpty()) {
                val title = if (System.currentTimeMillis() % 2 == 0L) "Sir" else "Boss"
                Text("No active directives, $title.", color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.3f), modifier = Modifier.padding(12.dp))
            } else {
                tasks.forEachIndexed { index, task ->
                    TaskRow(task, onToggle = { onToggle(task) })
                    if (index < tasks.size - 1) {
                        HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.1f), modifier = Modifier.padding(vertical = 12.dp))
                    }
                }
            }
        }
    }
}

@Composable
fun TaskRow(task: Task, onToggle: () -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        IconButton(onClick = onToggle, modifier = Modifier.size(28.dp)) {
            Icon(
                if (task.is_completed) Icons.Default.CheckCircle else Icons.Default.RadioButtonUnchecked,
                null,
                tint = if (task.is_completed) Color(0xFF10B981) else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.2f),
                modifier = Modifier.size(24.dp)
            )
        }
        Spacer(Modifier.width(16.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(
                task.title,
                color = if (task.is_completed) MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f) else MaterialTheme.colorScheme.onSurface,
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                textDecoration = if (task.is_completed) TextDecoration.LineThrough else TextDecoration.None
            )
            if (task.due_at != null) {
                Text("Scheduled for Today, 10:00 AM", color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f), fontSize = 12.sp)
            }
        }
        if (task.priority != "none") {
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(8.dp))
                    .background(AccentViolet.copy(alpha = 0.1f))
                    .padding(horizontal = 10.dp, vertical = 4.dp)
            ) {
                Text(task.priority.uppercase(), color = AccentViolet, fontSize = 10.sp, fontWeight = FontWeight.Black)
            }
        }
        Spacer(Modifier.width(16.dp))
        Icon(Icons.Default.StarBorder, null, tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.1f), modifier = Modifier.size(20.dp))
    }
}

@Composable
fun QuickActions(onNavigate: (NavKey) -> Unit, windowSize: LifeOSWindowSize) {
    val isCompact = windowSize == LifeOSWindowSize.Compact
    
    Column {
        Text(
            "Quick Actions",
            color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.4f),
            fontSize = 12.sp,
            fontWeight = FontWeight.Black,
            letterSpacing = 1.sp
        )
        Spacer(Modifier.height(16.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(if (isCompact) 12.dp else 20.dp)) {
            QuickActionItem("Fitness", Icons.Default.Favorite, Color(0xFFF43F5E), Modifier.weight(1f))
            QuickActionItem("Learning", Icons.Default.Book, AccentViolet, Modifier.weight(1f))
            QuickActionItem("Finance", Icons.Default.AccountBalanceWallet, Color(0xFF10B981), Modifier.weight(1f))
            QuickActionItem("Clock", Icons.Default.Schedule, AccentCyan, Modifier.weight(1f))
        }
    }
}

@Composable
fun QuickActionItem(label: String, icon: ImageVector, color: Color, modifier: Modifier) {
    Surface(
        modifier = modifier,
        color = MaterialTheme.colorScheme.surface.copy(alpha = 0.5f),
        shape = RoundedCornerShape(20.dp),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.1f))
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .background(color.copy(alpha = 0.1f), CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Icon(icon, null, tint = color, modifier = Modifier.size(20.dp))
            }
            Spacer(Modifier.height(12.dp))
            Text(label, color = MaterialTheme.colorScheme.onSurface, fontSize = 12.sp, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
fun JarvisInsightsCard() {
    LifeOSCard {
        Row(verticalAlignment = Alignment.CenterVertically) {
            LifeOSOrb(size = 40.dp, state = "idle")
            Spacer(Modifier.width(16.dp))
            Text("JARVIS Insights", color = MaterialTheme.colorScheme.onSurface, fontSize = 16.sp, fontWeight = FontWeight.Bold)
        }
        Spacer(Modifier.height(20.dp))
        val title = if (System.currentTimeMillis() % 2 == 0L) "Sir" else "Boss"
        Text(
            "$title, you have 2 pending directives and a focus session scheduled for this afternoon. Your streak is strong at 24 days.",
            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
            fontSize = 13.sp,
            lineHeight = 20.sp
        )
        Spacer(Modifier.height(24.dp))
        Text("Daily Progress", color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f), fontSize = 11.sp, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(8.dp))
        Box(modifier = Modifier.fillMaxWidth().height(6.dp).background(MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f), CircleShape)) {
            Box(modifier = Modifier.fillMaxWidth(0.65f).fillMaxHeight().background(AccentViolet, CircleShape))
        }
    }
}

@Composable
fun JarvisSetupBanner(onSetup: () -> Unit) {
    Surface(
        modifier = Modifier.fillMaxWidth().clickable { onSetup() },
        color = MaterialTheme.colorScheme.surfaceVariant,
        shape = RoundedCornerShape(24.dp),
        border = BorderStroke(1.dp, AccentViolet.copy(alpha = 0.2f))
    ) {
        Row(
            modifier = Modifier.padding(20.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            LifeOSOrb(size = 64.dp, state = "idle")
            Spacer(Modifier.width(20.dp))
            Column(modifier = Modifier.weight(1f)) {
                val title = if (System.currentTimeMillis() % 2 == 0L) "Sir" else "Boss"
                Text("Hey $title,", color = MaterialTheme.colorScheme.onSurface, fontSize = 16.sp, fontWeight = FontWeight.Black)
                Text(
                    "JARVIS is not set up yet. Enable your wake word to enable hands-free experience.",
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                    fontSize = 12.sp,
                    lineHeight = 18.sp
                )
                Spacer(Modifier.height(12.dp))
                Text("Set Up Now ›", color = AccentViolet, fontSize = 14.sp, fontWeight = FontWeight.Black)
            }
            Icon(Icons.Default.Close, null, tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.2f), modifier = Modifier.size(20.dp))
        }
    }
}

@Composable
fun LandscapeDashboard(
    onNavigate: (NavKey) -> Unit,
    displayTasks: List<Task>,
    viewModel: DashboardViewModel
) {
    val date by viewModel.currentDate.collectAsStateWithLifecycle()
    val time by viewModel.currentTime.collectAsStateWithLifecycle()
    val jarvisState by com.example.lifeos.jarvis.JarvisController.state.collectAsStateWithLifecycle()

    val tasks by viewModel.tasks.collectAsStateWithLifecycle()
    val fitnessActivities by viewModel.fitnessActivities.collectAsStateWithLifecycle()
    val learningCategories by viewModel.learningCategories.collectAsStateWithLifecycle()
    val learningTopics by viewModel.learningTopics.collectAsStateWithLifecycle()
    val financeAccounts by viewModel.financeAccounts.collectAsStateWithLifecycle()
    val financeTransactions by viewModel.financeTransactions.collectAsStateWithLifecycle()
    val calendarEvents by viewModel.calendarEvents.collectAsStateWithLifecycle()

    val todayDate = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())
    val todayEvents = calendarEvents.filter { it.date == todayDate }
    val title = if (System.currentTimeMillis() % 2 == 0L) "Sir" else "Boss"

    // Calculations for Today's Overview
    val completedTasks = tasks.count { it.is_completed }
    val totalTasks = tasks.size
    val progressPct = if (totalTasks > 0) (completedTasks * 100 / totalTasks) else 75
    val sweepAngle = if (totalTasks > 0) (completedTasks.toFloat() / totalTasks * 360f) else 270f

    val darkBackground = MaterialTheme.colorScheme.background
    val cardBackground = MaterialTheme.colorScheme.surface
    val accentCyan = Color(0xFF2DE1FC)
    val accentViolet = Color(0xFF8A5DF2)
    val accentGreen = Color(0xFF00FFC6)

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(darkBackground)
            .padding(horizontal = 48.dp, vertical = 32.dp),
        verticalArrangement = Arrangement.spacedBy(32.dp)
    ) {
        // 1. Premium Header Row
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    val hour = java.util.Calendar.getInstance().get(java.util.Calendar.HOUR_OF_DAY)
                    val title = if (System.currentTimeMillis() % 2 == 0L) "Sir" else "Boss"
                    val greeting = when (hour) {
                        in 5..11 -> "Good morning, Anirudh! 👋"
                        in 12..16 -> "Good afternoon, Anirudh! 🌤️"
                        else -> "Good evening, Anirudh! 🌙"
                    }
                    Text(
                        greeting,
                        color = MaterialTheme.colorScheme.onBackground,
                        fontSize = 28.sp,
                        fontWeight = FontWeight.Black
                    )
                    Text(
                        "Welcome back, $title. Let's make today productive.",
                        color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.4f),
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Medium
                    )
                }

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // Search bar
                    Box(
                        modifier = Modifier
                            .width(220.dp)
                            .height(40.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .background(MaterialTheme.colorScheme.onSurface.copy(alpha = 0.03f))
                            .border(BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.1f)), RoundedCornerShape(12.dp))
                            .padding(horizontal = 12.dp),
                        contentAlignment = Alignment.CenterStart
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    painter = painterResource(id = R.drawable.ic_search),
                                    contentDescription = null,
                                    tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.3f),
                                    modifier = Modifier.size(16.dp)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    "Search anything...",
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.3f),
                                    fontSize = 12.sp
                                )
                            }
                            Box(
                                modifier = Modifier
                                    .background(MaterialTheme.colorScheme.onSurface.copy(alpha = 0.08f), RoundedCornerShape(4.dp))
                                    .padding(horizontal = 4.dp, vertical = 2.dp)
                            ) {
                                Text(
                                    "⌘ K",
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f),
                                    fontSize = 9.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }

                    // Bell icon
                    Box(
                        modifier = Modifier
                            .size(40.dp)
                            .clip(CircleShape)
                            .background(MaterialTheme.colorScheme.onSurface.copy(alpha = 0.03f))
                            .border(BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.1f)), CircleShape)
                            .clickable { },
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            painter = painterResource(id = R.drawable.ic_bell),
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                            modifier = Modifier.size(18.dp)
                        )
                    }

                    // Waveform audio orb
                    Box(
                        modifier = Modifier
                            .size(40.dp)
                            .clip(CircleShape)
                            .background(MaterialTheme.colorScheme.surfaceVariant)
                            .border(BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.2f)), CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        LifeOSOrb(
                            size = 32.dp,
                            state = jarvisState.orbVisualState()
                        )
                    }
                }
            }
        }

        // 2. Status Chips Row
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                StatusChip(R.drawable.ic_calendar, date, accentCyan)
                StatusChip(R.drawable.ic_clock, time, accentViolet)
                StatusChip(R.drawable.ic_location, "Bengaluru, India", Color(0xFF00FFC6))
                StatusChip(R.drawable.ic_cloud, "25°C ☁️", Color(0xFFFFB300))
            }
        }

        // 3. Grid Row 1 (3 Columns)
        item {
            Row(
                modifier = Modifier.fillMaxWidth().height(420.dp),
                horizontalArrangement = Arrangement.spacedBy(32.dp)
            ) {
                // Column 1: Today's Overview
                Card(
                    colors = CardDefaults.cardColors(containerColor = cardBackground),
                    shape = RoundedCornerShape(24.dp),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.1f)),
                    modifier = Modifier.weight(1.8f).fillMaxHeight()
                ) {
                    Column(modifier = Modifier.padding(20.dp)) {
                        Text("Today's Overview", color = MaterialTheme.colorScheme.onSurface, fontSize = 16.sp, fontWeight = FontWeight.Black)
                        Text("You have a lot planned today. Stay focused!", color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f), fontSize = 11.sp)
                        
                        Spacer(modifier = Modifier.height(20.dp))
                        
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            // Stats items on the LEFT
                            Column(
                                modifier = Modifier.weight(1f),
                                verticalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                OverviewStatRow(R.drawable.ic_overview_tasks, "$totalTasks Tasks", "$completedTasks completed")
                                OverviewStatRow(R.drawable.ic_overview_events, "${todayEvents.size} Events", if (todayEvents.isNotEmpty()) "Next: ${todayEvents.first().title}" else "No events today")
                                
                                val latestWorkout = fitnessActivities.firstOrNull()?.notes ?: "No recent activity"
                                OverviewStatRow(R.drawable.ic_overview_workout, "${fitnessActivities.size} Workouts", latestWorkout)
                                
                                val latestLearning = learningTopics.firstOrNull()?.title ?: "Knowledge Matrix"
                                OverviewStatRow(R.drawable.ic_overview_learning, "${learningTopics.size} Topics", latestLearning)
                                
                                val incomeCount = financeTransactions.count { it.type == "income" }
                                val expenseCount = financeTransactions.count { it.type == "expense" }
                                OverviewStatRow(R.drawable.ic_overview_finance, "${financeTransactions.size} Trans.", "$incomeCount income • $expenseCount expense")
                                OverviewStatRow(R.drawable.ic_overview_focus, "Focus Protocol", "Neural Link Active")
                            }

                            Spacer(modifier = Modifier.width(20.dp))

                            // Circular Day Progress on the RIGHT
                            val progressOutlineColor = MaterialTheme.colorScheme.outline
                            Box(
                                contentAlignment = Alignment.Center,
                                modifier = Modifier.size(90.dp)
                            ) {
                                Canvas(modifier = Modifier.size(80.dp)) {
                                    drawCircle(
                                        color = progressOutlineColor.copy(alpha = 0.05f),
                                        style = Stroke(width = 5.dp.toPx())
                                    )
                                    drawArc(
                                        color = accentGreen,
                                        startAngle = -90f,
                                        sweepAngle = sweepAngle,
                                        useCenter = false,
                                        style = Stroke(width = 5.dp.toPx(), cap = StrokeCap.Round)
                                    )
                                }
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Text("${progressPct}%", color = MaterialTheme.colorScheme.onSurface, fontSize = 16.sp, fontWeight = FontWeight.Black)
                                    Text("Day Progress", color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f), fontSize = 8.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                }

                // Column 2: Today's Schedule (Calendar)
                Card(
                    colors = CardDefaults.cardColors(containerColor = cardBackground),
                    shape = RoundedCornerShape(24.dp),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.1f)),
                    modifier = Modifier.weight(1.5f).fillMaxHeight()
                ) {
                    Column(
                        modifier = Modifier.padding(20.dp),
                        verticalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text("Today's Schedule", color = MaterialTheme.colorScheme.onSurface, fontSize = 16.sp, fontWeight = FontWeight.Black)
                                Text(
                                    "View calendar",
                                    color = accentCyan,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.clickable { onNavigate(Calendar) }
                                )
                            }
                            
                            Spacer(modifier = Modifier.height(16.dp))
                            
                            Box(modifier = Modifier.weight(1f).fillMaxWidth()) {
                                Column(
                                    verticalArrangement = Arrangement.spacedBy(12.dp),
                                    modifier = Modifier.verticalScroll(rememberScrollState())
                                ) {
                                    if (todayEvents.isEmpty()) {
                                        Text("No events for today.", color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.3f), fontSize = 11.sp, modifier = Modifier.padding(top = 8.dp))
                                    } else {
                                        todayEvents.forEach { event ->
                                            ScheduleItem(
                                                time = if (event.is_all_day) "All day" else "${formatTime12(event.start_time ?: "")} – ${formatTime12(event.end_time ?: "")}",
                                                title = event.title,
                                                loc = event.location ?: "No location",
                                                accentColor = when(event.type) {
                                                    com.example.lifeos.data.models.CalendarEventType.MEETING -> accentViolet
                                                    com.example.lifeos.data.models.CalendarEventType.ANNIVERSARY -> Color(0xFFFF4E70)
                                                    else -> accentCyan
                                                }
                                            )
                                        }
                                    }
                                }
                            }
                        }

                        Button(
                            onClick = { onNavigate(Calendar) },
                            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f)),
                            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.2f)),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Icon(Icons.Default.Add, null, tint = MaterialTheme.colorScheme.onSurface, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Add event", color = MaterialTheme.colorScheme.onSurface, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }

                // Column 3: Tasks
                Card(
                    colors = CardDefaults.cardColors(containerColor = cardBackground),
                    shape = RoundedCornerShape(24.dp),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.1f)),
                    modifier = Modifier.weight(1.6f).fillMaxHeight()
                ) {
                    Column(
                        modifier = Modifier.padding(20.dp),
                        verticalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text("Tasks", color = MaterialTheme.colorScheme.onSurface, fontSize = 16.sp, fontWeight = FontWeight.Black)
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Box(
                                        modifier = Modifier
                                            .background(accentViolet.copy(alpha = 0.15f), RoundedCornerShape(6.dp))
                                            .padding(horizontal = 6.dp, vertical = 2.dp)
                                    ) {
                                        Text("${tasks.size} tasks", color = accentViolet, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                                    }
                                }
                                Text(
                                    "View all",
                                    color = accentCyan,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.clickable { onNavigate(Tasks) }
                                )
                            }
                            
                            Spacer(modifier = Modifier.height(16.dp))
                            
                            Box(modifier = Modifier.weight(1f).fillMaxWidth()) {
                                Column(
                                    verticalArrangement = Arrangement.spacedBy(8.dp),
                                    modifier = Modifier.verticalScroll(rememberScrollState())
                                ) {
                                    if (tasks.isEmpty()) {
                                        Text("No pending tasks.", color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f), fontSize = 11.sp)
                                    } else {
                                        tasks.forEach { task ->
                                            CheckboxTaskRow(
                                                title = task.title,
                                                priority = if (task.priority == "none") "Low" else task.priority.replaceFirstChar { it.uppercase() },
                                                isChecked = task.is_completed,
                                                onClick = { viewModel.toggleTask(task) }
                                            )
                                        }
                                    }
                                }
                            }
                        }

                        Button(
                            onClick = { onNavigate(Tasks) },
                            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f)),
                            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.2f)),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Icon(Icons.Default.Add, null, tint = MaterialTheme.colorScheme.onSurface, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Add task", color = MaterialTheme.colorScheme.onSurface, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }

        // 4. Grid Row 2 (4 Columns)
        item {
            Row(
                modifier = Modifier.fillMaxWidth().height(340.dp),
                horizontalArrangement = Arrangement.spacedBy(32.dp)
            ) {
                // Fitness Card
                Card(
                    colors = CardDefaults.cardColors(containerColor = cardBackground),
                    shape = RoundedCornerShape(20.dp),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f)),
                    modifier = Modifier.weight(1.5f).fillMaxHeight()
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text("Fitness", color = MaterialTheme.colorScheme.onSurface, fontSize = 14.sp, fontWeight = FontWeight.Black)
                                Text(
                                    "View details",
                                    color = accentCyan,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.clickable { onNavigate(Fitness) }
                                )
                            }
                            
                            Spacer(modifier = Modifier.height(12.dp))
                            
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(1.3f)) {
                                    val todayWorkout = fitnessActivities.firstOrNull()?.notes ?: "Upper Body"
                                    Text("Today's Workout", color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f), fontSize = 9.sp, fontWeight = FontWeight.Bold)
                                    Text(todayWorkout, color = MaterialTheme.colorScheme.onSurface, fontSize = 14.sp, fontWeight = FontWeight.Black)
                                    Text("45 min • Strength", color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f), fontSize = 10.sp)
                                    
                                    Spacer(modifier = Modifier.height(10.dp))
                                    
                                    Button(
                                        onClick = { onNavigate(Fitness) },
                                        colors = ButtonDefaults.buttonColors(containerColor = accentGreen),
                                        shape = RoundedCornerShape(8.dp),
                                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp),
                                        modifier = Modifier.height(28.dp)
                                    ) {
                                        Text("Start Workout", color = Color.Black, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                    }
                                }
                                
                                Box(modifier = Modifier.weight(0.7f), contentAlignment = Alignment.Center) {
                                    val activityType = fitnessActivities.firstOrNull()?.notes?.lowercase() ?: "upper body"
                                    BodyHighlightView(activityType)
                                }
                            }
                        }

                        Column {
                            // Streaks
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                listOf("M", "T", "W", "T", "F", "S", "S").forEachIndexed { idx, day ->
                                    val isChecked = idx < 3
                                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                        Text(day, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.3f), fontSize = 8.sp, fontWeight = FontWeight.Bold)
                                        Spacer(modifier = Modifier.height(2.dp))
                                        Box(
                                            modifier = Modifier
                                                .size(12.dp)
                                                .clip(CircleShape)
                                                .background(if (isChecked) accentGreen else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f))
                                                .border(1.dp, if (isChecked) accentGreen else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.1f), CircleShape),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            if (isChecked) {
                                                Icon(Icons.Default.Check, null, tint = Color.Black, modifier = Modifier.size(8.dp))
                                            }
                                        }
                                    }
                                }
                            }
                            
                            Spacer(modifier = Modifier.height(12.dp))
                            
                            val fitnessProgressCount = fitnessActivities.size
                            val fitnessProgressRatio = (fitnessProgressCount.toFloat() / 5f).coerceIn(0f, 1f)
                            
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text("Weekly Progress", color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f), fontSize = 9.sp)
                                Text("$fitnessProgressCount / 5", color = accentGreen, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            LinearProgressIndicator(
                                progress = { fitnessProgressRatio },
                                color = accentGreen,
                                trackColor = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f),
                                modifier = Modifier.fillMaxWidth().height(4.dp).clip(CircleShape)
                            )
                        }
                    }
                }

                // Learning Card
                Card(
                    colors = CardDefaults.cardColors(containerColor = cardBackground),
                    shape = RoundedCornerShape(20.dp),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f)),
                    modifier = Modifier.weight(1.4f).fillMaxHeight()
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text("Learning", color = MaterialTheme.colorScheme.onSurface, fontSize = 14.sp, fontWeight = FontWeight.Black)
                                Text(
                                    "View all",
                                    color = accentCyan,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.clickable { onNavigate(Learning) }
                                )
                            }
                            
                            Spacer(modifier = Modifier.height(16.dp))
                            
                            val displayTopicsList = learningTopics.take(2)
                            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                if (displayTopicsList.isEmpty()) {
                                    Text("No topics scheduled, $title.", color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.3f), fontSize = 11.sp, modifier = Modifier.padding(top = 8.dp))
                                } else {
                                    displayTopicsList.forEachIndexed { idx, topic ->
                                        val progress = if (topic.notes?.contains("%") == true) {
                                            topic.notes!!.filter { it.isDigit() }.toFloatOrNull()?.div(100f) ?: 0f
                                        } else 0.5f
                                        val tint = if (idx % 2 == 0) accentCyan else accentViolet
                                        LearningItem(topic.title, topic.description ?: "Active", progress, tint)
                                    }
                                }
                            }
                        }

                        Column {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text("Weekly Progress", color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f), fontSize = 9.sp)
                                Text("4 / 10", color = accentViolet, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            LinearProgressIndicator(
                                progress = { 0.4f },
                                color = accentViolet,
                                trackColor = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f),
                                modifier = Modifier.fillMaxWidth().height(4.dp).clip(CircleShape)
                            )
                        }
                    }
                }

                // Finance Card
                Card(
                    colors = CardDefaults.cardColors(containerColor = cardBackground),
                    shape = RoundedCornerShape(20.dp),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f)),
                    modifier = Modifier.weight(1.5f).fillMaxHeight()
                ) {
                    val today = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())
                    val todayTx = financeTransactions.filter { it.transaction_date.startsWith(today) }
                    val todayIncome = todayTx.filter { it.type == "income" }.sumOf { it.amount.toDouble() }.toFloat()
                    val todayExpense = todayTx.filter { it.type == "expense" }.sumOf { it.amount.toDouble() }.toFloat()
                    
                    val displayIncome = todayIncome
                    val displayExpense = todayExpense
                    val totalBalance = financeAccounts.sumOf { it.current_balance.toDouble() }.toFloat()
                    val displayBalance = if (totalBalance > 0) totalBalance else 0f

                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text("Finance", color = MaterialTheme.colorScheme.onSurface, fontSize = 14.sp, fontWeight = FontWeight.Black)
                                Text(
                                    "View all",
                                    color = accentCyan,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.clickable { onNavigate(Finance) }
                                )
                            }
                            
                            Spacer(modifier = Modifier.height(12.dp))
                            
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Column {
                                    Text("Today's Summary", color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f), fontSize = 9.sp)
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Text("₹%,.0f".format(displayIncome), color = accentGreen, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                        Text(" / ", color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.2f))
                                        Text("₹%,.0f".format(displayExpense), color = Color(0xFFFF4E70), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                    }
                                }
                            }
                            
                            Spacer(modifier = Modifier.height(8.dp))
                            
                            Text("Current Status", color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f), fontSize = 9.sp)
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text("Liquid Assets Nominal", color = MaterialTheme.colorScheme.onSurface, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("Protocol Secure", color = accentGreen, fontSize = 8.sp, fontWeight = FontWeight.Black)
                            }
                        }

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.Bottom
                        ) {
                            Column {
                                Text("Balance", color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f), fontSize = 9.sp)
                                Text("₹%,.0f".format(displayBalance), color = MaterialTheme.colorScheme.onSurface, fontSize = 16.sp, fontWeight = FontWeight.Black)
                                Text("▲ 15% vs last month", color = accentGreen, fontSize = 8.sp, fontWeight = FontWeight.Bold)
                            }
                            
                            Image(
                                painter = painterResource(id = R.drawable.ic_sparkline),
                                contentDescription = null,
                                modifier = Modifier.size(60.dp, 30.dp)
                            )
                        }
                    }
                }

                // Focus Card
                Card(
                    colors = CardDefaults.cardColors(containerColor = cardBackground),
                    shape = RoundedCornerShape(20.dp),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f)),
                    modifier = Modifier.weight(1.5f).fillMaxHeight()
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text("Focus", color = MaterialTheme.colorScheme.onSurface, fontSize = 14.sp, fontWeight = FontWeight.Black)
                                Text(
                                    "View details",
                                    color = accentCyan,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.clickable { onNavigate(Focus) }
                                )
                            }
                            
                            Spacer(modifier = Modifier.height(12.dp))
                            
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(1.2f)) {
                                    Text("Today's Focus Goal", color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f), fontSize = 9.sp, fontWeight = FontWeight.Bold)
                                    Text("120 / 180 min", color = MaterialTheme.colorScheme.onSurface, fontSize = 14.sp, fontWeight = FontWeight.Black)
                                    Text("Focused", color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f), fontSize = 10.sp)
                                    
                                    Spacer(modifier = Modifier.height(10.dp))
                                    
                                    Button(
                                        onClick = { onNavigate(Focus) },
                                        colors = ButtonDefaults.buttonColors(containerColor = accentCyan),
                                        shape = RoundedCornerShape(8.dp),
                                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp),
                                        modifier = Modifier.height(28.dp)
                                    ) {
                                        Text("Start Focus Session", color = Color.Black, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                    }
                                }
                                
                                Box(
                                    contentAlignment = Alignment.Center,
                                    modifier = Modifier.size(54.dp)
                                ) {
                                    val focusOutlineColor = MaterialTheme.colorScheme.outline
                                    Canvas(modifier = Modifier.size(54.dp)) {
                                        drawCircle(
                                            color = focusOutlineColor.copy(alpha = 0.05f),
                                            style = Stroke(width = 4.dp.toPx())
                                        )
                                        drawArc(
                                            color = accentCyan,
                                            startAngle = -90f,
                                            sweepAngle = 240f, // 66%
                                            useCenter = false,
                                            style = Stroke(width = 4.dp.toPx(), cap = StrokeCap.Round)
                                        )
                                    }
                                    Text("66%", color = MaterialTheme.colorScheme.onSurface, fontSize = 11.sp, fontWeight = FontWeight.Black)
                                }
                            }
                        }

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column {
                                Text("Focus Sessions", color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f), fontSize = 9.sp)
                                Text("2", color = MaterialTheme.colorScheme.onSurface, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            }
                            Column {
                                Text("Longest Streak", color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f), fontSize = 9.sp)
                                Text("5 days", color = MaterialTheme.colorScheme.onSurface, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun StatusChip(iconRes: Int, text: String, color: Color) {
    Surface(
        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.03f),
        shape = RoundedCornerShape(12.dp),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.1f))
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                painter = painterResource(id = iconRes),
                contentDescription = null,
                tint = color,
                modifier = Modifier.size(14.dp)
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = text,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f),
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

@Composable
fun OverviewStatRow(iconRes: Int, title: String, sub: String) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier.fillMaxWidth()
    ) {
        Icon(
            painter = painterResource(id = iconRes),
            contentDescription = null,
            tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f),
            modifier = Modifier.size(16.dp)
        )
        Spacer(modifier = Modifier.width(10.dp))
        Text(title, color = MaterialTheme.colorScheme.onSurface, fontSize = 11.sp, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.width(6.dp))
        Text(sub, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.35f), fontSize = 10.sp, fontWeight = FontWeight.Medium)
    }
}

@Composable
fun ScheduleItem(time: String, title: String, loc: String, accentColor: Color) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(6.dp)
                .background(accentColor, CircleShape)
        )
        Spacer(modifier = Modifier.width(12.dp))
        Column {
            Text(time, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f), fontSize = 9.sp, fontWeight = FontWeight.Bold)
            Text(title, color = MaterialTheme.colorScheme.onSurface, fontSize = 12.sp, fontWeight = FontWeight.Bold)
            Text(loc, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.3f), fontSize = 9.sp)
        }
    }
}

@Composable
fun CheckboxTaskRow(title: String, priority: String, isChecked: Boolean, onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .padding(vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.weight(1f)
        ) {
            Icon(
                imageVector = if (isChecked) Icons.Default.CheckCircle else Icons.Default.RadioButtonUnchecked,
                contentDescription = null,
                tint = if (isChecked) Color(0xFF10B981) else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.2f),
                modifier = Modifier.size(18.dp)
            )
            Spacer(modifier = Modifier.width(10.dp))
            Text(
                text = title,
                color = if (isChecked) MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f) else MaterialTheme.colorScheme.onSurface,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                textDecoration = if (isChecked) TextDecoration.LineThrough else TextDecoration.None
            )
        }

        val badgeBg = when (priority) {
            "High" -> Color(0xFFFF4E70).copy(alpha = 0.1f)
            "Medium" -> Color(0xFFFFB300).copy(alpha = 0.1f)
            else -> Color(0xFF10B981).copy(alpha = 0.1f)
        }
        val badgeTint = when (priority) {
            "High" -> Color(0xFFFF4E70)
            "Medium" -> Color(0xFFFFB300)
            else -> Color(0xFF10B981)
        }

        Box(
            modifier = Modifier
                .clip(RoundedCornerShape(6.dp))
                .background(badgeBg)
                .padding(horizontal = 6.dp, vertical = 2.dp)
        ) {
            Text(priority, color = badgeTint, fontSize = 8.sp, fontWeight = FontWeight.Black)
        }
    }
}

@Composable
fun LearningItem(title: String, duration: String, progress: Float, accentColor: Color) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Icon with background circle
        Box(
            modifier = Modifier
                .size(32.dp)
                .background(accentColor.copy(alpha = 0.1f), RoundedCornerShape(8.dp)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Default.Book,
                contentDescription = null,
                tint = accentColor,
                modifier = Modifier.size(16.dp)
            )
        }
        Spacer(modifier = Modifier.width(12.dp))
        Column(modifier = Modifier.weight(1f)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = title,
                    color = Color.White,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    maxLines = 1,
                    overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis,
                    modifier = Modifier.weight(1f)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = duration,
                    color = Color.White.copy(alpha = 0.4f),
                    fontSize = 10.sp,
                    maxLines = 1
                )
            }
            Spacer(modifier = Modifier.height(6.dp))
            LinearProgressIndicator(
                progress = { progress },
                color = accentColor,
                trackColor = Color.White.copy(alpha = 0.05f),
                modifier = Modifier.fillMaxWidth().height(4.dp).clip(CircleShape)
            )
        }
    }
}

fun formatTime12(time24: String): String {
    if (time24.isBlank()) return "--:--"
    val parts = time24.split(":")
    if (parts.size < 2) return time24
    val h = parts[0].toIntOrNull() ?: return time24
    val m = parts[1]
    return when {
        h == 0 -> "12:$m AM"
        h < 12 -> "$h:$m AM"
        h == 12 -> "12:$m PM"
        else -> "${h - 12}:$m PM"
    }
}

@Composable
fun BodyHighlightView(workoutType: String) {
    Box(contentAlignment = Alignment.Center, modifier = Modifier.size(100.dp)) {
        Image(
            painter = painterResource(id = R.drawable.ic_workout_person),
            contentDescription = null,
            modifier = Modifier.size(90.dp)
        )
        
        val isUpper = workoutType.lowercase().contains("upper")
        val isLower = workoutType.lowercase().contains("lower") || workoutType.lowercase().contains("leg")
        
        Canvas(modifier = Modifier.size(90.dp)) {
            // Very simplified neon highlight for demo purposes
            if (isUpper) {
                // Arms and Torso areas roughly
                drawCircle(color = Color(0xFF00FFC6).copy(alpha = 0.3f), radius = 10.dp.toPx(), center = androidx.compose.ui.geometry.Offset(center.x - 15.dp.toPx(), center.y - 10.dp.toPx()))
                drawCircle(color = Color(0xFF00FFC6).copy(alpha = 0.3f), radius = 10.dp.toPx(), center = androidx.compose.ui.geometry.Offset(center.x + 15.dp.toPx(), center.y - 10.dp.toPx()))
                drawRect(color = Color(0xFF00FFC6).copy(alpha = 0.2f), topLeft = androidx.compose.ui.geometry.Offset(center.x - 10.dp.toPx(), center.y - 20.dp.toPx()), size = androidx.compose.ui.geometry.Size(20.dp.toPx(), 25.dp.toPx()))
            }
            if (isLower) {
                // Legs area roughly
                drawRect(color = Color(0xFF00FFC6).copy(alpha = 0.2f), topLeft = androidx.compose.ui.geometry.Offset(center.x - 12.dp.toPx(), center.y + 20.dp.toPx()), size = androidx.compose.ui.geometry.Size(10.dp.toPx(), 25.dp.toPx()))
                drawRect(color = Color(0xFF00FFC6).copy(alpha = 0.2f), topLeft = androidx.compose.ui.geometry.Offset(center.x + 2.dp.toPx(), center.y + 20.dp.toPx()), size = androidx.compose.ui.geometry.Size(10.dp.toPx(), 25.dp.toPx()))
            }
        }
    }
}
