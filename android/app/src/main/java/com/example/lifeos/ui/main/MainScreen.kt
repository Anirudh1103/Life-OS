package com.example.lifeos.ui.main

import android.Manifest
import android.content.Context
import android.content.Intent
import com.example.lifeos.alarm.AlarmController
import java.util.Calendar
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.BorderStroke
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation3.runtime.NavKey
import com.example.lifeos.jarvis.JarvisController
import com.example.lifeos.jarvis.JarvisState
import com.example.lifeos.jarvis.debugLabel
import com.example.lifeos.jarvis.DetectionLog
import com.example.lifeos.jarvis.service.JarvisWakeWordService
import com.example.lifeos.ui.dashboard.DashboardScreen
import com.example.lifeos.ui.utils.rememberWindowSizeClass

@Composable
fun MainScreen(
    onItemClick: (NavKey) -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val jarvisState by JarvisController.state.collectAsStateWithLifecycle()
    val detectionsCount by JarvisController.detectionsCount.collectAsStateWithLifecycle()
    val detectionLogs by JarvisController.detectionLogs.collectAsStateWithLifecycle()
    val loadedPhrases by JarvisController.loadedPhrases.collectAsStateWithLifecycle()
    val lastSpeakerScore by JarvisController.lastSpeakerScore.collectAsStateWithLifecycle()
    val audioPipelineStatus by JarvisController.audioPipelineStatus.collectAsStateWithLifecycle()
    val windowSize = rememberWindowSizeClass()

    var showDiagnosticsOverlay by remember { mutableStateOf(false) }
    var showPermissionRationale by remember { mutableStateOf(false) }

    // Required Permissions list
    val requiredPermissions = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        arrayOf(Manifest.permission.RECORD_AUDIO, Manifest.permission.POST_NOTIFICATIONS)
    } else {
        arrayOf(Manifest.permission.RECORD_AUDIO)
    }

    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val recordAudioGranted = permissions[Manifest.permission.RECORD_AUDIO] == true
        if (recordAudioGranted) {
            showPermissionRationale = false
            com.example.lifeos.jarvis.prefs.JarvisPrefs.setListenEnabled(context, true)
            startJarvisForeground(context)
        } else {
            showPermissionRationale = true
        }
    }

    fun checkAndEnableJarvis() {
        val allGranted = requiredPermissions.all {
            ContextCompat.checkSelfPermission(context, it) == PackageManager.PERMISSION_GRANTED
        }

        if (allGranted) {
            com.example.lifeos.jarvis.prefs.JarvisPrefs.setListenEnabled(context, true)
            startJarvisForeground(context)
        } else {
            permissionLauncher.launch(requiredPermissions)
        }
    }

    fun disableJarvis() {
        com.example.lifeos.jarvis.prefs.JarvisPrefs.setListenEnabled(context, false)
        stopJarvisForeground(context)
    }

    // Colors
    val darkBackground = Color(0xFF0C0A1C)
    val borderLight = Color(0xFF221E4E)
    val accentViolet = Color(0xFF8A5DF2)
    val accentCyan = Color(0xFF2DE1FC)
    val accentGreen = Color(0xFF00FFC6)
    val accentRed = Color(0xFFFF4E70)
    val cardBackground = Color(0xFF13112E)

    Box(modifier = Modifier.fillMaxSize().background(darkBackground)) {
        
        // Native Content
        DashboardScreen(onNavigate = onItemClick, windowSize = windowSize, modifier = Modifier.fillMaxSize())

        // Floating Toggle Gear/Assistant Button (Bottom Left)
        Box(
            modifier = Modifier
                .align(Alignment.BottomStart)
                .padding(16.dp)
                .size(48.dp)
                .background(accentViolet.copy(alpha = 0.8f), CircleShape)
                .border(1.dp, Color.White.copy(alpha = 0.2f), CircleShape)
                .clickable { showDiagnosticsOverlay = !showDiagnosticsOverlay },
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = if (showDiagnosticsOverlay) Icons.Default.Close else Icons.Default.Terminal,
                contentDescription = "Diagnostics Toggle",
                tint = Color.White,
                modifier = Modifier.size(20.dp)
            )
        }

        // Slide-Out Translucent Diagnostics Overlay Drawer
        AnimatedVisibility(
            visible = showDiagnosticsOverlay,
            enter = slideInHorizontally(initialOffsetX = { -it }) + fadeIn(),
            exit = slideOutHorizontally(targetOffsetX = { -it }) + fadeOut(),
            modifier = Modifier
                .fillMaxHeight()
                .fillMaxWidth(0.85f)
                .align(Alignment.CenterStart)
        ) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black.copy(alpha = 0.85f))
                    .border(BorderStroke(1.dp, borderLight), RoundedCornerShape(topEnd = 24.dp, bottomEnd = 24.dp))
                    .padding(16.dp)
            ) {
                Column(modifier = Modifier.fillMaxSize()) {
                    
                    // Panel Header
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "JARVIS TERMINAL",
                            color = Color.White,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Black
                        )
                        StatusBadge(
                            state = jarvisState,
                            accentCyan = accentCyan,
                            accentGreen = accentGreen,
                            accentRed = accentRed,
                            accentViolet = accentViolet
                        )
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // Controls
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        if (jarvisState is JarvisState.Disabled || jarvisState is JarvisState.Error) {
                            Button(
                                onClick = { checkAndEnableJarvis() },
                                colors = ButtonDefaults.buttonColors(containerColor = accentViolet),
                                shape = RoundedCornerShape(10.dp),
                                modifier = Modifier.weight(1f)
                            ) {
                                Text("START", fontWeight = FontWeight.Bold)
                            }
                        } else if (jarvisState !is JarvisState.DownloadingModel) {
                            Button(
                                onClick = { disableJarvis() },
                                colors = ButtonDefaults.buttonColors(containerColor = accentRed),
                                shape = RoundedCornerShape(10.dp),
                                modifier = Modifier.weight(1f)
                            ) {
                                Text("STOP", fontWeight = FontWeight.Bold)
                            }
                        }

                            Button(
                                onClick = {
                                    val intent = Intent(
                                        Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                                        Uri.parse("package:${context.packageName}")
                                    )
                                    context.startActivity(intent)
                                },
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = if (Settings.canDrawOverlays(context)) accentGreen.copy(alpha = 0.2f) else accentCyan
                                ),
                                shape = RoundedCornerShape(10.dp),
                                modifier = Modifier.weight(1f)
                            ) {
                                Text(
                                    text = if (Settings.canDrawOverlays(context)) "OVERLAY ✓" else "OVERLAY",
                                    fontWeight = FontWeight.Bold,
                                    color = if (Settings.canDrawOverlays(context)) accentGreen else Color.White
                                )
                            }
                    }

                    if (showPermissionRationale) {
                        Spacer(modifier = Modifier.height(10.dp))
                        Text(
                            text = "Microphone permission is required.",
                            color = accentRed,
                            fontSize = 10.sp
                        )
                    }

                    Spacer(modifier = Modifier.height(24.dp))

                    // Diagnostics Panel Body
                    DiagnosticPanel(
                        state = jarvisState,
                        detectionsCount = detectionsCount,
                        detectionLogs = detectionLogs,
                        loadedPhrases = loadedPhrases,
                        lastSpeakerScore = lastSpeakerScore,
                        audioPipelineStatus = audioPipelineStatus,
                        borderLight = borderLight,
                        cardBackground = cardBackground,
                        accentCyan = accentCyan,
                        modifier = Modifier.weight(1f)
                    )
                }
            }
        }

        // Fullscreen Voice Model Downloading Progress Screen Overlay
        if (jarvisState is JarvisState.DownloadingModel) {
            val progress = (jarvisState as JarvisState.DownloadingModel).progress
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black.copy(alpha = 0.92f)),
                contentAlignment = Alignment.Center
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    CircularProgressIndicator(
                        color = accentCyan,
                        strokeWidth = 4.dp,
                        modifier = Modifier.size(54.dp)
                    )
                    Spacer(modifier = Modifier.height(24.dp))
                    Text(
                        text = "LOADING INTELLIGENCE...",
                        color = Color.White,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.ExtraBold,
                        letterSpacing = 1.5.sp
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    Text(
                        text = "$progress%",
                        color = accentCyan,
                        fontSize = 24.sp,
                        fontWeight = FontWeight.Black
                    )
                }
            }
        }
    }
}

@Composable
fun StatusBadge(
    state: JarvisState,
    accentCyan: Color,
    accentGreen: Color,
    accentRed: Color,
    accentViolet: Color
) {
    val color = when (state) {
        JarvisState.Disabled -> Color.Gray
        JarvisState.Starting -> accentViolet
        JarvisState.ListeningForWakeWord -> accentGreen
        is JarvisState.WakeWordDetected -> accentCyan
        JarvisState.VerifyingSpeaker -> accentViolet
        JarvisState.ListeningForCommand -> accentGreen
        JarvisState.Processing -> accentViolet
        JarvisState.Responding -> accentCyan
        is JarvisState.DownloadingModel -> accentViolet
        is JarvisState.Error -> accentRed
    }

    val label = when (state) {
        JarvisState.Disabled -> "OFFLINE"
        JarvisState.Starting -> "STARTING"
        JarvisState.ListeningForWakeWord -> "ACTIVE"
        is JarvisState.WakeWordDetected -> "WAKE"
        JarvisState.VerifyingSpeaker -> "VERIFY"
        JarvisState.ListeningForCommand -> "COMMAND"
        JarvisState.Processing -> "PROCESS"
        JarvisState.Responding -> "SPEAK"
        is JarvisState.DownloadingModel -> "UPDATING"
        is JarvisState.Error -> "ERROR"
    }

    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier
            .background(color.copy(alpha = 0.1f), RoundedCornerShape(8.dp))
            .border(1.dp, color.copy(alpha = 0.2f), RoundedCornerShape(8.dp))
            .padding(horizontal = 8.dp, vertical = 4.dp)
    ) {
        Box(
            modifier = Modifier
                .size(6.dp)
                .background(color, CircleShape)
        )
        Spacer(modifier = Modifier.width(6.dp))
        Text(
            text = label,
            color = color,
            fontSize = 9.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = 1.sp
        )
    }
}

@Composable
fun DiagnosticPanel(
    state: JarvisState,
    detectionsCount: Int,
    detectionLogs: List<DetectionLog>,
    loadedPhrases: List<String>,
    lastSpeakerScore: Float? = null,
    audioPipelineStatus: String = "unknown",
    borderLight: Color,
    cardBackground: Color,
    accentCyan: Color,
    modifier: Modifier = Modifier,
    onStart: (() -> Unit)? = null,
    onStop: (() -> Unit)? = null
) {
    val context = LocalContext.current
    val accentViolet = Color(0xFF8A5DF2)
    val accentRed = Color(0xFFFF4E70)

    Card(
        modifier = modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = cardBackground),
        border = BorderStroke(1.dp, borderLight),
        shape = RoundedCornerShape(20.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "SYSTEM LOGS",
                    color = Color.White,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.ExtraBold,
                    letterSpacing = 1.sp
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Technical details row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                DiagItem(label = "Engine", value = "Sherpa KWS")
                DiagItem(
                    label = "Microphone",
                    value = if (state is JarvisState.Disabled || state is JarvisState.Error) "Offline" else "Active"
                )
                DiagItem(label = "Hits", value = "$detectionsCount")
            }

            Spacer(modifier = Modifier.height(8.dp))
            Text(
                "DEV  ${state.debugLabel()}  |  audio=$audioPipelineStatus  |  speaker=${lastSpeakerScore?.let { String.format("%.2f", it) } ?: "—"}",
                color = Color.White.copy(alpha = 0.45f),
                fontSize = 10.sp,
                fontFamily = FontFamily.Monospace
            )

            Spacer(modifier = Modifier.height(12.dp))

            // List of spotted logs
            LazyColumn(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                if (detectionLogs.isEmpty()) {
                    item {
                        Text(
                            text = "Awaiting command, Sir.",
                            color = Color.White.copy(alpha = 0.3f),
                            fontSize = 11.sp,
                            modifier = Modifier.fillMaxWidth().padding(vertical = 12.dp),
                            textAlign = TextAlign.Center
                        )
                    }
                } else {
                    items(detectionLogs, key = { it.id }) { log ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(Color.White.copy(alpha = 0.03f), RoundedCornerShape(8.dp))
                                .padding(horizontal = 10.dp, vertical = 6.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    imageVector = Icons.Default.CheckCircle,
                                    contentDescription = "Spotted",
                                    tint = accentCyan,
                                    modifier = Modifier.size(12.dp)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = log.phrase,
                                    color = Color.White,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                            Text(
                                text = log.time,
                                color = Color.White.copy(alpha = 0.4f),
                                fontSize = 11.sp,
                                fontFamily = FontFamily.Monospace
                            )
                        }
                    }
                }
            }

            // Samsung/Battery Saver optimization guides footer button
            Spacer(modifier = Modifier.height(10.dp))
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Button(
                    onClick = {
                        val calendar = Calendar.getInstance().apply {
                            add(Calendar.SECOND, 10)
                        }
                        AlarmController.setAlarm(context, calendar.timeInMillis)
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = accentCyan.copy(alpha = 0.2f)),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.weight(1f),
                    contentPadding = PaddingValues(vertical = 6.dp)
                ) {
                    Icon(Icons.Default.Notifications, contentDescription = null, modifier = Modifier.size(12.dp), tint = accentCyan)
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("ALARM TEST", color = accentCyan, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                }

                Button(
                    onClick = {
                        val intent = Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS)
                        context.startActivity(intent)
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color.White.copy(alpha = 0.05f)),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.weight(1f),
                    contentPadding = PaddingValues(vertical = 6.dp)
                ) {
                    Text(
                        text = "BATTERY OPT.",
                        color = Color.White.copy(alpha = 0.8f),
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}

@Composable
fun DiagItem(label: String, value: String) {
    Column {
        Text(
            text = label,
            color = Color.White.copy(alpha = 0.4f),
            fontSize = 9.sp,
            fontWeight = FontWeight.Bold
        )
        Text(
            text = value,
            color = Color.White,
            fontSize = 12.sp,
            fontWeight = FontWeight.ExtraBold
        )
    }
}

private fun startJarvisForeground(context: Context) {
    val startIntent = Intent(context, JarvisWakeWordService::class.java).apply {
        action = JarvisWakeWordService.ACTION_START
    }
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        context.startForegroundService(startIntent)
    } else {
        context.startService(startIntent)
    }
}

private fun stopJarvisForeground(context: Context) {
    val stopIntent = Intent(context, JarvisWakeWordService::class.java).apply {
        action = JarvisWakeWordService.ACTION_STOP
    }
    context.startService(stopIntent)
}
