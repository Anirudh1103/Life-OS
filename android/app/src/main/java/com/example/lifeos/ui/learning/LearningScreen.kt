package com.example.lifeos.ui.learning

import androidx.compose.animation.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.Lightbulb
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.lifeos.ui.viewmodels.LearningViewModel
import com.example.lifeos.data.models.Category
import com.example.lifeos.theme.*
import com.example.lifeos.ui.components.LifeOSCard

@Composable
fun LearningScreen(
    modifier: Modifier = Modifier,
    viewModel: LearningViewModel = viewModel()
) {
    val categories by viewModel.categories.collectAsStateWithLifecycle()
    val topics by viewModel.topics.collectAsStateWithLifecycle()
    val title = if (System.currentTimeMillis() % 2 == 0L) "Sir" else "Boss"

    Box(modifier = modifier.fillMaxSize().background(MaterialTheme.colorScheme.background)) {
        // Space-glow background effect (subtle gradient)
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.radialGradient(
                        colors = listOf(
                            AccentViolet.copy(alpha = 0.05f),
                            Color.Transparent
                        ),
                        center = androidx.compose.ui.geometry.Offset(0f, 0f)
                    )
                )
        )

        Column(modifier = Modifier.fillMaxSize().padding(24.dp)) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        "Learning Hub",
                        color = MaterialTheme.colorScheme.onBackground,
                        fontSize = 32.sp,
                        fontWeight = FontWeight.Black,
                        letterSpacing = (-1).sp
                    )
                    Text(
                        "Knowledge Matrix & Skill Synthesis",
                        color = AccentCyan,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Black,
                        letterSpacing = 1.5.sp
                    )
                }
                
                Surface(
                    color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                    shape = RoundedCornerShape(16.dp),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.1f))
                ) {
                    Row(modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp), verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.LocalFireDepartment, null, tint = Color(0xFFFFB300), modifier = Modifier.size(16.dp))
                        Spacer(Modifier.width(8.dp))
                        Text("24 Day Streak", color = MaterialTheme.colorScheme.onSurface, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }

            Spacer(modifier = Modifier.height(32.dp))

            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(24.dp),
                modifier = Modifier.fillMaxSize()
            ) {
                // Main Stats Row - Glowing glassmorphic cards
                item {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                        LearningStatCard("TOTAL SECTORS", categories.size.toString(), Icons.Default.MenuBook, AccentViolet, Modifier.weight(1f))
                        LearningStatCard("SYNTHESIZED", topics.count { it.is_completed }.toString(), Icons.Default.CheckCircle, Color(0xFF00FFC6), Modifier.weight(1f))
                        LearningStatCard("NEURAL FOCUS", "42.5h", Icons.Default.Timer, AccentCyan, Modifier.weight(1f))
                    }
                }

                item { Spacer(Modifier.height(8.dp)) }

                item {
                    Text(
                        "ACTIVE KNOWLEDGE MATRIX",
                        color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.5f),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Black,
                        letterSpacing = 2.sp
                    )
                }

                if (categories.isEmpty()) {
                    item {
                        Box(Modifier.fillMaxWidth().height(200.dp), contentAlignment = Alignment.Center) {
                            Text("No learning sectors loaded, $title.", color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.2f), fontSize = 14.sp)
                        }
                    }
                } else {
                    items(categories) { category ->
                        val catTopics = topics.filter { it.category_id == category.id }
                        val completedCount = catTopics.count { it.is_completed }
                        val progress = if (catTopics.isEmpty()) 0f else (completedCount.toFloat() / catTopics.size)

                        PremiumCategoryCard(
                            category = category,
                            topicsCount = catTopics.size,
                            completedCount = completedCount,
                            progress = progress
                        )
                    }
                }

                item {
                    Spacer(Modifier.height(16.dp))
                    Surface(
                        onClick = { },
                        color = Color.Transparent,
                        shape = RoundedCornerShape(24.dp),
                        border = BorderStroke(2.dp, Brush.linearGradient(listOf(AccentViolet, AccentCyan))),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Box(
                            modifier = Modifier
                                .background(Brush.linearGradient(listOf(AccentViolet.copy(alpha = 0.1f), AccentCyan.copy(alpha = 0.1f))))
                                .padding(24.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.AutoAwesome, null, tint = Color(0xFFFFD700))
                                Spacer(Modifier.width(16.dp))
                                Text(
                                    "INITIATE COGNITIVE SESSION", 
                                    color = MaterialTheme.colorScheme.onPrimary, 
                                    fontWeight = FontWeight.Black,
                                    letterSpacing = 1.sp
                                )
                            }
                        }
                    }
                }
                
                item { Spacer(Modifier.height(80.dp)) }
            }
        }
    }
}

@Composable
fun LearningStatCard(label: String, value: String, icon: ImageVector, color: Color, modifier: Modifier) {
    Surface(
        modifier = modifier,
        color = MaterialTheme.colorScheme.surface.copy(alpha = 0.4f),
        shape = RoundedCornerShape(24.dp),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f))
    ) {
        Box {
            // Subtle glow background
            Box(
                modifier = Modifier
                    .matchParentSize()
                    .background(
                        Brush.radialGradient(
                            colors = listOf(color.copy(alpha = 0.1f), Color.Transparent),
                            center = androidx.compose.ui.geometry.Offset(0f, 0f)
                        )
                    )
            )

            Column(modifier = Modifier.padding(20.dp)) {
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .background(color.copy(alpha = 0.15f), CircleShape)
                        .border(1.dp, color.copy(alpha = 0.2f), CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(icon, null, tint = color, modifier = Modifier.size(20.dp))
                }
                Spacer(Modifier.height(20.dp))
                Text(
                    label,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f),
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Black,
                    letterSpacing = 0.5.sp
                )
                Text(
                    value,
                    color = MaterialTheme.colorScheme.onSurface,
                    fontSize = 26.sp,
                    fontWeight = FontWeight.Black,
                    letterSpacing = (-0.5).sp
                )
            }
        }
    }
}

@Composable
fun PremiumCategoryCard(category: Category, topicsCount: Int, completedCount: Int, progress: Float) {
    val title = if (System.currentTimeMillis() % 2 == 0L) "Sir" else "Boss"
    
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface.copy(alpha = 0.6f)),
        shape = RoundedCornerShape(28.dp),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.1f))
    ) {
        Box {
            // Subtle premium gradient overlay
            Box(
                modifier = Modifier
                    .matchParentSize()
                    .background(
                        Brush.linearGradient(
                            colors = listOf(AccentCyan.copy(alpha = 0.03f), Color.Transparent),
                            start = androidx.compose.ui.geometry.Offset(0f, 0f),
                            end = androidx.compose.ui.geometry.Offset(1000f, 1000f)
                        )
                    )
            )

            Column(modifier = Modifier.padding(24.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(56.dp)
                            .background(
                                Brush.linearGradient(listOf(AccentCyan.copy(alpha = 0.2f), Color.Transparent)),
                                RoundedCornerShape(16.dp)
                            )
                            .border(BorderStroke(1.dp, AccentCyan.copy(alpha = 0.3f)), RoundedCornerShape(16.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Outlined.Lightbulb, null, tint = AccentCyan, modifier = Modifier.size(28.dp))
                    }
                    Spacer(Modifier.width(20.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(category.name, color = MaterialTheme.colorScheme.onSurface, fontSize = 22.sp, fontWeight = FontWeight.Black, letterSpacing = (-0.5).sp)
                        Text("$topicsCount Directives | $completedCount Synthesized", color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f), fontSize = 13.sp, fontWeight = FontWeight.Medium)
                    }
                    
                    if (progress >= 1.0f) {
                        Box(
                            modifier = Modifier
                                .background(Color(0xFF00FFC6).copy(alpha = 0.15f), RoundedCornerShape(12.dp))
                                .border(BorderStroke(1.dp, Color(0xFF00FFC6).copy(alpha = 0.3f)), RoundedCornerShape(12.dp))
                                .padding(horizontal = 12.dp, vertical = 6.dp)
                        ) {
                            Text("MASTERED", color = Color(0xFF00FFC6), fontSize = 10.sp, fontWeight = FontWeight.Black)
                        }
                    } else {
                        IconButton(
                            onClick = { },
                            modifier = Modifier
                                .size(48.dp)
                                .background(AccentViolet.copy(alpha = 0.1f), CircleShape)
                                .border(1.dp, AccentViolet.copy(alpha = 0.2f), CircleShape)
                        ) {
                            Icon(Icons.Default.PlayArrow, null, tint = AccentViolet)
                        }
                    }
                }
                
                Spacer(modifier = Modifier.height(28.dp))
                
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    Text("NEURAL SYNTHESIS PROGRESS", color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f), fontSize = 10.sp, fontWeight = FontWeight.Black, letterSpacing = 1.sp)
                    Text("${(progress * 100).toInt()}%", color = AccentCyan, fontSize = 15.sp, fontWeight = FontWeight.Black)
                }
                Spacer(modifier = Modifier.height(12.dp))
                Box(modifier = Modifier.fillMaxWidth().height(10.dp).clip(CircleShape).background(MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f))) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth(progress)
                            .fillMaxHeight()
                            .clip(CircleShape)
                            .background(
                                Brush.linearGradient(listOf(AccentCyan, Color(0xFF4FACFE)))
                            )
                            .shadow(12.dp, CircleShape, spotColor = AccentCyan)
                    )
                }
                
                if (progress < 1.0f) {
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        text = "Optimal retention window is open, $title.",
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.3f),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}
