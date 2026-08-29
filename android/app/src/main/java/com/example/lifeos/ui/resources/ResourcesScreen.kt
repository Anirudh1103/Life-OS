package com.example.lifeos.ui.resources

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Book
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun ResourcesScreen(
    modifier: Modifier = Modifier
) {
    val darkBackground = Color(0xFF0C0A1C)
    val cardBackground = Color(0xFF13112E)
    val accentCyan = Color(0xFF2DE1FC)
    val accentViolet = Color(0xFF8A5DF2)

    val resources = listOf(
        Pair("Kotlin Documentation", "Complete reference of language features, coroutines, and JVM details."),
        Pair("System Design Basics", "High level architecture guide, load balancing, caching, and databases."),
        Pair("Android Development Guide", "Modern Android development with Jetpack Compose and architecture components."),
        Pair("Life-OS Operating System", "Directives and operations documentation for Stark Industrial Life-OS.")
    )

    Box(modifier = modifier.fillMaxSize().background(darkBackground)) {
        Column(modifier = Modifier.fillMaxSize().padding(24.dp)) {
            Column {
                Text(
                    "Resources Hub",
                    color = Color.White,
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Black
                )
                Text(
                    "System Knowledgebase & Documentation",
                    color = accentCyan,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp
                )
            }
            
            Spacer(modifier = Modifier.height(24.dp))

            LazyVerticalGrid(
                columns = GridCells.Fixed(2),
                horizontalArrangement = Arrangement.spacedBy(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp),
                modifier = Modifier.fillMaxSize()
            ) {
                items(resources.size) { index ->
                    val (title, desc) = resources[index]
                    Card(
                        colors = CardDefaults.cardColors(containerColor = cardBackground),
                        shape = RoundedCornerShape(20.dp),
                        border = BorderStroke(1.dp, Color.White.copy(alpha = 0.05f)),
                        modifier = Modifier.fillMaxWidth().height(160.dp)
                    ) {
                        Column(
                            modifier = Modifier.padding(16.dp).fillMaxSize(),
                            verticalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column {
                                Icon(Icons.Default.Book, null, tint = accentViolet, modifier = Modifier.size(24.dp))
                                Spacer(Modifier.height(12.dp))
                                Text(title, color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                                Spacer(Modifier.height(4.dp))
                                Text(desc, color = Color.White.copy(alpha = 0.5f), fontSize = 10.sp, lineHeight = 14.sp)
                            }
                            Text("Open Resource ›", color = accentCyan, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}
