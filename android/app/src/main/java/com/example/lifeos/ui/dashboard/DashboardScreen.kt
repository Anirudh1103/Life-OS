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
import com.example.lifeos.data.models.Task
import com.example.lifeos.jarvis.prefs.JarvisPrefs
import com.example.lifeos.theme.*
import com.example.lifeos.ui.components.LifeOSCard
import com.example.lifeos.ui.components.LifeOSOrb
import com.example.lifeos.ui.utils.LifeOSWindowSize
import com.example.lifeos.ui.viewmodels.DashboardViewModel
import androidx.navigation3.runtime.NavKey
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun DashboardScreen(
    onNavigate: (NavKey) -> Unit,
    windowSize: LifeOSWindowSize,
    modifier: Modifier = Modifier,
    viewModel: DashboardViewModel = viewModel()
) {
    val tasks by viewModel.tasks.collectAsStateWithLifecycle()
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

    Box(modifier = modifier.fillMaxSize().background(DarkBg)) {
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

@Composable
fun WelcomeHeader(viewModel: DashboardViewModel, windowSize: LifeOSWindowSize) {
    val date by viewModel.currentDate.collectAsStateWithLifecycle()
    val time by viewModel.currentTime.collectAsStateWithLifecycle()
    val hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
    val greeting = when (hour) {
        in 5..11 -> "Good morning, Sir ☀️"
        in 12..16 -> "Good afternoon, Sir 🌤️"
        else -> "Good evening, Sir 🌙"
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
                color = Color.White,
                fontSize = if (isCompact) 32.sp else 42.sp,
                fontWeight = FontWeight.Black,
                letterSpacing = (-0.5).sp
            )
            Text(
                text = "Have a productive and amazing day ahead.",
                color = Color.White.copy(alpha = 0.5f),
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
            .background(CardBg)
            .border(1.dp, Color.White.copy(alpha = 0.1f), CircleShape)
            .clickable { onClick() },
        contentAlignment = Alignment.Center
    ) {
        Icon(Icons.Default.Person, null, tint = Color.White.copy(alpha = 0.6f), modifier = Modifier.size(24.dp))
    }
}

@Composable
fun HeaderChip(icon: ImageVector, text: String, color: Color) {
    Surface(
        color = Color.White.copy(alpha = 0.05f),
        shape = RoundedCornerShape(12.dp),
        border = BorderStroke(1.dp, Color.White.copy(alpha = 0.05f))
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(icon, null, tint = color, modifier = Modifier.size(14.dp))
            Spacer(Modifier.width(8.dp))
            Text(text, color = Color.White.copy(alpha = 0.7f), fontSize = 12.sp, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
fun TodayAtAGlance(tasks: List<Task>, windowSize: LifeOSWindowSize) {
    val isCompact = windowSize == LifeOSWindowSize.Compact
    
    Column {
        Text(
            "Today at a glance",
            color = Color.White.copy(alpha = 0.4f),
            fontSize = 12.sp,
            fontWeight = FontWeight.Black,
            letterSpacing = 1.sp
        )
        Spacer(Modifier.height(16.dp))
        
        if (isCompact) {
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                val total = tasks.size
                val completed = tasks.count { it.is_completed }
                GlanceCard("Tasks", total.toString(), "Total", Icons.Default.List, AccentViolet, Modifier.weight(1f))
                GlanceCard("Done", completed.toString(), "Today", Icons.Default.CheckCircle, Color(0xFF10B981), Modifier.weight(1f))
                GlanceCard("Focus", "3h 24m", "Today", Icons.Default.Timer, AccentCyan, Modifier.weight(1f))
                GlanceCard("Streak", "24", "Days", Icons.Default.LocalFireDepartment, Color(0xFFFFB300), Modifier.weight(1f))
            }
        } else {
            // Adaptive layout for tablet: wider cards or grid
            Row(horizontalArrangement = Arrangement.spacedBy(20.dp)) {
                val total = tasks.size
                val completed = tasks.count { it.is_completed }
                GlanceCard("Active Tasks", total.toString(), "directives pending", Icons.Default.List, AccentViolet, Modifier.weight(1f))
                GlanceCard("Completed", completed.toString(), "finished today", Icons.Default.CheckCircle, Color(0xFF10B981), Modifier.weight(1f))
                GlanceCard("Focus Session", "3h 24m", "deep work", Icons.Default.Timer, AccentCyan, Modifier.weight(1f))
                GlanceCard("Current Streak", "24", "consecutive days", Icons.Default.LocalFireDepartment, Color(0xFFFFB300), Modifier.weight(1f))
            }
        }
    }
}

@Composable
fun GlanceCard(title: String, value: String, sub: String, icon: ImageVector, color: Color, modifier: Modifier) {
    Surface(
        modifier = modifier,
        color = CardBg.copy(alpha = 0.5f),
        shape = RoundedCornerShape(20.dp),
        border = BorderStroke(1.dp, Color.White.copy(alpha = 0.05f))
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
            Text(title, color = Color.White.copy(alpha = 0.4f), fontSize = 11.sp, fontWeight = FontWeight.Bold)
            Text(value, color = Color.White, fontSize = 24.sp, fontWeight = FontWeight.Black)
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
            Text("Personalised Task List", color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Bold)
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
                Text("No active directives, Sir.", color = Color.White.copy(alpha = 0.3f), modifier = Modifier.padding(12.dp))
            } else {
                tasks.forEachIndexed { index, task ->
                    TaskRow(task, onToggle = { onToggle(task) })
                    if (index < tasks.size - 1) {
                        HorizontalDivider(color = Color.White.copy(alpha = 0.05f), modifier = Modifier.padding(vertical = 12.dp))
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
                tint = if (task.is_completed) Color(0xFF10B981) else Color.White.copy(alpha = 0.2f),
                modifier = Modifier.size(24.dp)
            )
        }
        Spacer(Modifier.width(16.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(
                task.title,
                color = if (task.is_completed) Color.White.copy(alpha = 0.4f) else Color.White,
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                textDecoration = if (task.is_completed) TextDecoration.LineThrough else TextDecoration.None
            )
            if (task.due_at != null) {
                Text("Scheduled for Today, 10:00 AM", color = Color.White.copy(alpha = 0.4f), fontSize = 12.sp)
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
        Icon(Icons.Default.StarBorder, null, tint = Color.White.copy(alpha = 0.1f), modifier = Modifier.size(20.dp))
    }
}

@Composable
fun QuickActions(onNavigate: (NavKey) -> Unit, windowSize: LifeOSWindowSize) {
    val isCompact = windowSize == LifeOSWindowSize.Compact
    
    Column {
        Text(
            "Quick Actions",
            color = Color.White.copy(alpha = 0.4f),
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
        color = CardBg.copy(alpha = 0.5f),
        shape = RoundedCornerShape(20.dp),
        border = BorderStroke(1.dp, Color.White.copy(alpha = 0.05f))
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
            Text(label, color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
fun JarvisInsightsCard() {
    LifeOSCard {
        Row(verticalAlignment = Alignment.CenterVertically) {
            LifeOSOrb(size = 40.dp, state = "idle")
            Spacer(Modifier.width(16.dp))
            Text("JARVIS Insights", color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Bold)
        }
        Spacer(Modifier.height(20.dp))
        Text(
            "Sir, you have 2 pending directives and a focus session scheduled for this afternoon. Your streak is strong at 24 days.",
            color = Color.White.copy(alpha = 0.6f),
            fontSize = 13.sp,
            lineHeight = 20.sp
        )
        Spacer(Modifier.height(24.dp))
        Text("Daily Progress", color = Color.White.copy(alpha = 0.4f), fontSize = 11.sp, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(8.dp))
        Box(modifier = Modifier.fillMaxWidth().height(6.dp).background(Color.White.copy(alpha = 0.05f), CircleShape)) {
            Box(modifier = Modifier.fillMaxWidth(0.65f).fillMaxHeight().background(AccentViolet, CircleShape))
        }
    }
}

@Composable
fun JarvisSetupBanner(onSetup: () -> Unit) {
    Surface(
        modifier = Modifier.fillMaxWidth().clickable { onSetup() },
        color = Color(0xFF17122E),
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
                Text("Hey Sir,", color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Black)
                Text(
                    "JARVIS is not set up yet. Enable your wake word to enable hands-free experience.",
                    color = Color.White.copy(alpha = 0.6f),
                    fontSize = 12.sp,
                    lineHeight = 18.sp
                )
                Spacer(Modifier.height(12.dp))
                Text("Set Up Now ›", color = AccentViolet, fontSize = 14.sp, fontWeight = FontWeight.Black)
            }
            Icon(Icons.Default.Close, null, tint = Color.White.copy(alpha = 0.2f), modifier = Modifier.size(20.dp))
        }
    }
}
