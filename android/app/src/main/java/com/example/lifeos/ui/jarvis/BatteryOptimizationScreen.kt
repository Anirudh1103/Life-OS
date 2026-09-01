package com.example.lifeos.ui.jarvis

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.BatteryChargingFull
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import com.example.lifeos.theme.AccentCyan
import com.example.lifeos.theme.AccentRed
import com.example.lifeos.theme.DarkBg
import com.example.lifeos.ui.components.LifeOSButton
import com.example.lifeos.ui.components.LifeOSCard

@Composable
fun BatteryOptimizationScreen(
    onNext: () -> Unit,
    onSkip: () -> Unit
) {
    val context = LocalContext.current
    var isIgnoringBatteryOptimizations by remember { mutableStateOf(checkBatteryOptimization(context)) }
    val lifecycleOwner = LocalLifecycleOwner.current

    // Re-check battery optimization status every time the screen resumes
    // (e.g. when user returns from the system battery settings dialog)
    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_RESUME) {
                isIgnoringBatteryOptimizations = checkBatteryOptimization(context)
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose {
            lifecycleOwner.lifecycle.removeObserver(observer)
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(DarkBg)
            .padding(24.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier.fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Icon
            Box(
                modifier = Modifier
                    .size(80.dp)
                    .background(
                        if (isIgnoringBatteryOptimizations) {
                            Color(0xFF10B981).copy(alpha = 0.2f)
                        } else {
                            AccentRed.copy(alpha = 0.2f)
                        },
                        shape = CircleShape
                    ),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    if (isIgnoringBatteryOptimizations) Icons.Default.CheckCircle else Icons.Default.BatteryChargingFull,
                    contentDescription = null,
                    tint = if (isIgnoringBatteryOptimizations) Color(0xFF10B981) else AccentRed,
                    modifier = Modifier.size(40.dp)
                )
            }

            // Title
            Text(
                text = "Set Battery to Unrestricted",
                color = Color.White,
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold,
                textAlign = TextAlign.Center
            )

            // Description
            Text(
                text = if (isIgnoringBatteryOptimizations) {
                    "Battery optimization is disabled for LifeOS. JARVIS will listen reliably in the background."
                } else {
                    "JARVIS needs unrestricted battery access to listen for your voice in the background. Without this, Android may kill the wake word service."
                },
                color = Color.White.copy(alpha = 0.8f),
                fontSize = 16.sp,
                textAlign = TextAlign.Center,
                lineHeight = 24.sp
            )

            // Warning Card with step-by-step instructions
            if (!isIgnoringBatteryOptimizations) {
                LifeOSCard(
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                Icons.Default.Warning,
                                contentDescription = null,
                                tint = AccentRed,
                                modifier = Modifier.size(24.dp)
                            )
                            Text(
                                text = "Why is this needed?",
                                color = Color.White,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "Android's battery optimization aggressively kills background services to save power. This prevents JARVIS from listening for \"Hey Jarvis\" when the app is in the background or the screen is off.",
                            color = Color.White.copy(alpha = 0.7f),
                            fontSize = 12.sp,
                            lineHeight = 18.sp
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        Text(
                            text = "After tapping the button below:",
                            color = AccentCyan,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "• Tap \"Allow\" in the system dialog\n• On Samsung: Also go to Settings → Apps → LifeOS → Battery → Unrestricted\n• On Xiaomi: Also go to Settings → Apps → LifeOS → Battery saver → No restrictions",
                            color = Color.White.copy(alpha = 0.6f),
                            fontSize = 11.sp,
                            lineHeight = 17.sp
                        )
                    }
                }
            }

            // Success card
            if (isIgnoringBatteryOptimizations) {
                LifeOSCard(
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            Icons.Default.CheckCircle,
                            contentDescription = null,
                            tint = Color(0xFF10B981),
                            modifier = Modifier.size(24.dp)
                        )
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "Battery Unrestricted ✓",
                                color = Color(0xFF10B981),
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = "JARVIS can run reliably in the background.",
                                color = Color.White.copy(alpha = 0.6f),
                                fontSize = 12.sp
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Action Buttons
            if (isIgnoringBatteryOptimizations) {
                LifeOSButton(
                    text = "Continue to Setup",
                    onClick = onNext
                )
            } else {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    LifeOSButton(
                        text = "Disable Battery Optimization",
                        onClick = {
                            openBatteryOptimizationSettings(context)
                        }
                    )

                    OutlinedButton(
                        onClick = {
                            isIgnoringBatteryOptimizations = checkBatteryOptimization(context)
                        },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp),
                        colors = ButtonDefaults.outlinedButtonColors(
                            contentColor = AccentCyan
                        ),
                        border = androidx.compose.foundation.BorderStroke(
                            1.dp,
                            AccentCyan.copy(alpha = 0.5f)
                        )
                    ) {
                        Text("Check Again", color = AccentCyan, fontSize = 14.sp)
                    }

                    TextButton(
                        onClick = onSkip,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            "Skip for now",
                            color = Color.White.copy(alpha = 0.5f),
                            fontSize = 13.sp
                        )
                    }
                }
            }
        }
    }
}

private fun checkBatteryOptimization(context: Context): Boolean {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        val powerManager = context.getSystemService(Context.POWER_SERVICE) as PowerManager
        return powerManager.isIgnoringBatteryOptimizations(context.packageName)
    }
    return true // Older Android versions don't have this issue
}

private fun openBatteryOptimizationSettings(context: Context) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        try {
            val intent = Intent().apply {
                action = Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS
                data = Uri.parse("package:${context.packageName}")
            }
            context.startActivity(intent)
        } catch (e: Exception) {
            // Fallback: open the general battery optimization list
            try {
                val fallbackIntent = Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS)
                context.startActivity(fallbackIntent)
            } catch (_: Exception) {
                android.util.Log.e("JARVIS", "Could not open battery optimization settings", e)
            }
        }
    }
}