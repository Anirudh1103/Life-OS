package com.example.lifeos.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.*
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.lifeos.theme.*

/**
 * Premium LifeOS Orb implementation matching Reference Asset 2.
 * Multi-layered with ambient glow, rotating ring core, and status dots.
 */
@Composable
fun LifeOSOrb(
    modifier: Modifier = Modifier,
    size: Dp = 200.dp,
    state: String = "idle" // idle, listening, processing, success, error
) {
    val infiniteTransition = rememberInfiniteTransition(label = "orb_anim")
    
    // Breathing effect
    val scale by infiniteTransition.animateFloat(
        initialValue = 0.96f,
        targetValue = 1.04f,
        animationSpec = infiniteRepeatable(
            animation = tween(2000, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "breath"
    )

    // Rotation effect for the ring
    val rotation by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(if (state == "processing") 2000 else 8000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "rotation"
    )

    // Pulse effect for listening state
    val pulseAlpha by infiniteTransition.animateFloat(
        initialValue = 0.3f,
        targetValue = 0.8f,
        animationSpec = infiniteRepeatable(
            animation = tween(1000, easing = LinearOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulse"
    )

    val coreColor = when(state) {
        "error" -> Color(0xFFF43F5E)
        "success" -> Color(0xFF10B981)
        else -> AccentCyan
    }

    val secondaryColor = when(state) {
        "error" -> Color(0xFF991B1B)
        "success" -> Color(0xFF047857)
        else -> AccentViolet
    }

    Canvas(modifier = modifier.size(size).scale(scale)) {
        val center = Offset(size.toPx() / 2, size.toPx() / 2)
        val radius = size.toPx() / 2
        
        // 1. Ambient Background Glow
        drawCircle(
            brush = Brush.radialGradient(
                colors = listOf(secondaryColor.copy(alpha = 0.15f), Color.Transparent),
                center = center,
                radius = radius
            ),
            radius = radius
        )

        // 2. Main Glowing Ring Core
        val ringRadius = radius * 0.85f
        
        // Background dim ring
        drawCircle(
            color = Color.White.copy(alpha = 0.05f),
            radius = ringRadius,
            style = Stroke(width = 4.dp.toPx())
        )

        // Active animated ring
        val sweepAngle = when(state) {
            "listening" -> 360f
            "processing" -> 120f
            else -> 45f
        }
        
        rotate(rotation) {
            drawArc(
                brush = Brush.sweepGradient(
                    colors = listOf(coreColor, secondaryColor, coreColor),
                    center = center
                ),
                startAngle = 0f,
                sweepAngle = sweepAngle,
                useCenter = false,
                style = Stroke(width = 6.dp.toPx(), cap = StrokeCap.Round),
                size = Size(ringRadius * 2, ringRadius * 2),
                topLeft = Offset(center.x - ringRadius, center.y - ringRadius)
            )
        }

        // 3. Center Status Dots
        when (state) {
            "success" -> {
                // Draw Checkmark
                val path = Path().apply {
                    moveTo(center.x - radius * 0.2f, center.y)
                    lineTo(center.x - radius * 0.05f, center.y + radius * 0.15f)
                    lineTo(center.x + radius * 0.25f, center.y - radius * 0.15f)
                }
                drawPath(
                    path = path,
                    color = Color.White,
                    style = Stroke(width = 6.dp.toPx(), cap = StrokeCap.Round, join = StrokeJoin.Round)
                )
            }
            "error" -> {
                // Draw Exclamation
                drawRect(
                    color = Color.White,
                    topLeft = Offset(center.x - 2.dp.toPx(), center.y - radius * 0.2f),
                    size = Size(4.dp.toPx(), radius * 0.25f)
                )
                drawCircle(
                    color = Color.White,
                    radius = 3.dp.toPx(),
                    center = Offset(center.x, center.y + radius * 0.15f)
                )
            }
            else -> {
                val dotRadius = radius * 0.08f
                val dotSpacing = radius * 0.15f
                
                // Left Dot (Violet)
                drawCircle(
                    color = secondaryColor.copy(alpha = if (state == "listening") pulseAlpha else 1f),
                    radius = dotRadius,
                    center = Offset(center.x - dotSpacing, center.y)
                )
                
                // Right Dot (Cyan)
                drawCircle(
                    color = coreColor.copy(alpha = if (state == "listening") pulseAlpha else 1f),
                    radius = dotRadius,
                    center = Offset(center.x + dotSpacing, center.y)
                )
            }
        }
    }
}

/**
 * Premium LifeOS Button with gradient and subtle outer glow.
 */
@Composable
fun LifeOSButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    containerColor: Color = Color(0xFF5920C7)
) {
    Button(
        onClick = onClick,
        enabled = enabled,
        modifier = modifier
            .fillMaxWidth()
            .height(56.dp)
            .shadow(
                elevation = 12.dp,
                shape = RoundedCornerShape(16.dp),
                spotColor = containerColor.copy(alpha = 0.5f)
            ),
        shape = RoundedCornerShape(16.dp),
        colors = ButtonDefaults.buttonColors(
            containerColor = containerColor,
            disabledContainerColor = containerColor.copy(alpha = 0.3f)
        ),
        contentPadding = PaddingValues(0.dp)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.linearGradient(
                        colors = listOf(
                            Color.White.copy(alpha = 0.1f),
                            Color.Transparent
                        )
                    )
                ),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = text,
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 0.5.sp,
                color = Color.White.copy(alpha = if (enabled) 1f else 0.5f)
            )
        }
    }
}

/**
 * Premium Glassmorphic Card used for Dashboard and Settings.
 */
@Composable
fun LifeOSCard(
    modifier: Modifier = Modifier,
    onClick: (() -> Unit)? = null,
    content: @Composable ColumnScope.() -> Unit
) {
    val clickableModifier = if (onClick != null) Modifier.clickable { onClick() } else Modifier
    
    Surface(
        modifier = modifier
            .fillMaxWidth()
            .then(clickableModifier),
        color = MaterialTheme.colorScheme.surface.copy(alpha = 0.7f),
        shape = RoundedCornerShape(24.dp),
        border = BorderStroke(1.dp, Color.White.copy(alpha = 0.05f)),
        content = {
            Column(
                modifier = Modifier.padding(20.dp),
                content = content
            )
        }
    )
}
