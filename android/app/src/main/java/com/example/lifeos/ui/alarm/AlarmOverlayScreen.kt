package com.example.lifeos.ui.alarm

import android.content.Context
import android.content.Intent
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.lifeos.alarm.AlarmService
import com.example.lifeos.jarvis.JarvisController

@Composable
fun AlarmOverlayScreen(onDismiss: () -> Unit) {
    val context = LocalContext.current
    var isDismissed by remember { mutableStateOf(false) }

    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val scale by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = 1.15f,
        animationSpec = infiniteRepeatable(
            animation = tween(800, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulse"
    )

    Box(
        modifier = Modifier.fillMaxSize().background(Color(0xFF0C0A1C)),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                "GOOD MORNING, SIR",
                color = Color.White,
                fontSize = 28.sp,
                fontWeight = FontWeight.Black,
                letterSpacing = 2.sp
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                "Your presence is required.",
                color = Color(0xFF2DE1FC).copy(alpha = 0.7f),
                fontSize = 14.sp
            )

            Spacer(modifier = Modifier.height(64.dp))

            // Stop Button
            Box(
                modifier = Modifier
                    .size(160.dp)
                    .scale(scale)
                    .background(Color(0xFF8A5DF2).copy(alpha = 0.2f), CircleShape)
                    .border(2.dp, Color(0xFF8A5DF2), CircleShape)
                    .clickable {
                        context.stopService(Intent(context, AlarmService::class.java))
                        isDismissed = true
                        // Trigger Daily Briefing via JarvisController
                        JarvisController.processQuery("summary")
                        onDismiss()
                    },
                contentAlignment = Alignment.Center
            ) {
                Text(
                    "STOP",
                    color = Color.White,
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}
