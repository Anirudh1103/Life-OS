package com.example.lifeos.ui.learning

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Book
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.lifeos.ui.viewmodels.LearningViewModel
import com.example.lifeos.data.models.Category

@Composable
fun LearningScreen(
    modifier: Modifier = Modifier,
    viewModel: LearningViewModel = viewModel()
) {
    val categories by viewModel.categories.collectAsState()
    val topics by viewModel.topics.collectAsState()

    val darkBackground = Color(0xFF0C0A1C)
    val cardBackground = Color(0xFF13112E)
    val accentViolet = Color(0xFF8A5DF2)

    Box(modifier = modifier.fillMaxSize().background(darkBackground)) {
        Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
            Text(
                "Learning Hub",
                color = Color.White,
                fontSize = 24.sp,
                fontWeight = FontWeight.Black
            )
            Spacer(modifier = Modifier.height(24.dp))

            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(16.dp),
                modifier = Modifier.fillMaxSize()
            ) {
                item {
                    StreakCard(accentViolet, cardBackground)
                }

                item {
                    Text("Knowledge Matrix", color = Color.White.copy(alpha = 0.6f), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }

                if (categories.isEmpty()) {
                    item {
                        Text("No learning sectors loaded, Sir.", color = Color.White.copy(alpha = 0.3f), fontSize = 12.sp)
                    }
                } else {
                    items(categories) { category ->
                        val catTopics = topics.filter { it.category_id == category.id }
                        val completedCount = catTopics.count { it.is_completed }
                        val progress = if (catTopics.isEmpty()) 0 else (completedCount * 100 / catTopics.size)

                        TopicCard(
                            title = category.name,
                            description = "${catTopics.size} Topics | $completedCount Completed",
                            progress = progress,
                            background = cardBackground,
                            accent = accentViolet
                        )
                    }
                }

                item {
                    Spacer(modifier = Modifier.height(8.dp))
                    Button(
                        onClick = { /* TODO: Launch Quiz */ },
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = Color.White.copy(alpha = 0.05f)),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Icon(Icons.Default.AutoAwesome, contentDescription = null, tint = Color(0xFFFFD700), modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Initiate Flashcard Session", color = Color.White)
                    }
                }
            }
        }
    }
}

@Composable
fun StreakCard(accent: Color, background: Color) {
    Card(
        colors = CardDefaults.cardColors(containerColor = background),
        shape = RoundedCornerShape(24.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier.padding(24.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text("Study Streak", color = Color.White.copy(alpha = 0.7f), fontSize = 14.sp)
                Text("24 Days", color = Color.White, fontSize = 28.sp, fontWeight = FontWeight.Black)
            }
            Icon(Icons.Default.Book, contentDescription = null, tint = accent, modifier = Modifier.size(48.dp))
        }
    }
}

@Composable
fun TopicCard(title: String, description: String, progress: Int, background: Color, accent: Color) {
    Card(
        colors = CardDefaults.cardColors(containerColor = background),
        shape = RoundedCornerShape(20.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(title, color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                    Text(description, color = Color.White.copy(alpha = 0.4f), fontSize = 11.sp)
                }
                if (progress < 100) {
                   Icon(Icons.Default.PlayArrow, contentDescription = null, tint = accent)
                } else {
                   Text("SYNCED", color = Color(0xFF00FFC6), fontSize = 10.sp, fontWeight = FontWeight.Black)
                }
            }
            Spacer(modifier = Modifier.height(12.dp))
            LinearProgressIndicator(
                progress = { progress / 100f },
                modifier = Modifier.fillMaxWidth().height(4.dp),
                color = if (progress == 100) Color(0xFF00FFC6) else accent,
                trackColor = Color.White.copy(alpha = 0.05f)
            )
        }
    }
}
