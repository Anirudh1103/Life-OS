package com.example.lifeos.ui.main

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.provider.Settings
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.webkit.WebChromeClient
import android.util.Log
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.*
import androidx.compose.animation.core.*
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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation3.runtime.NavKey
import com.example.lifeos.jarvis.JarvisController
import com.example.lifeos.jarvis.JarvisState
import com.example.lifeos.jarvis.DetectionLog
import com.example.lifeos.jarvis.service.JarvisWakeWordService
import com.example.lifeos.jarvis.wakeword.WakeWord
import kotlinx.coroutines.flow.collectLatest

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen(
    onItemClick: (NavKey) -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val sharedPrefs = remember { context.getSharedPreferences("jarvis_prefs", Context.MODE_PRIVATE) }

    // Read Vite URL state from SharedPreferences
    var savedUrl by remember { 
        mutableStateOf(sharedPrefs.getString("life_os_url", "http://10.0.2.2:5173") ?: "http://10.0.2.2:5173") 
    }
    var inputUrl by remember { mutableStateOf(savedUrl) }

    val jarvisState by JarvisController.state.collectAsStateWithLifecycle()
    val detectionsCount by JarvisController.detectionsCount.collectAsStateWithLifecycle()
    val detectionLogs by JarvisController.detectionLogs.collectAsStateWithLifecycle()
    val loadedPhrases by JarvisController.loadedPhrases.collectAsStateWithLifecycle()

    var showDiagnosticsOverlay by remember { mutableStateOf(false) }
    var showPermissionRationale by remember { mutableStateOf(false) }
    var showSettings by remember { mutableStateOf(false) }

    val webViewInstance = remember { mutableStateOf<WebView?>(null) }

    // Inject background voice query events to WebView JS when received
    LaunchedEffect(Unit) {
        com.example.lifeos.VoiceQueryManager.queryFlow.collectLatest { query ->
            if (query != null) {
                Log.d("JARVIS", "Dispatching JS CustomEvent jarvis_voice_query to WebView: $query")
                val escapedQuery = query.replace("'", "\\'")
                webViewInstance.value?.evaluateJavascript(
                    "window.dispatchEvent(new CustomEvent('jarvis_voice_query', { detail: { text: '$escapedQuery' } }));",
                    null
                )
                com.example.lifeos.VoiceQueryManager.queryFlow.value = null // Reset
            }
        }
    }

    // Inject wake word spotted event to WebView JS when detected
    LaunchedEffect(jarvisState) {
        if (jarvisState is JarvisState.Detected) {
            Log.d("JARVIS", "Dispatching JS CustomEvent jarvis_wake_word_detected to WebView")
            webViewInstance.value?.evaluateJavascript(
                "window.dispatchEvent(new CustomEvent('jarvis_wake_word_detected'));",
                null
            )
        }
    }

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
            startJarvisForeground(context)
        } else {
            permissionLauncher.launch(requiredPermissions)
        }
    }

    fun disableJarvis() {
        stopJarvisForeground(context)
    }

    // Premium Color Palette
    val darkBackground = Color(0xFF0C0A1C)
    val cardBackground = Color(0xFF13112E)
    val borderLight = Color(0xFF221E4E)
    val accentViolet = Color(0xFF8A5DF2)
    val accentCyan = Color(0xFF2DE1FC)
    val accentGreen = Color(0xFF00FFC6)
    val accentRed = Color(0xFFFF4E70)

    Box(modifier = Modifier.fillMaxSize().background(darkBackground)) {
        
        // Fullscreen Web application container
        AndroidView(
            factory = { ctx ->
                WebView(ctx).apply {
                    webViewClient = WebViewClient()
                    webChromeClient = WebChromeClient()
                    setLayerType(android.view.View.LAYER_TYPE_HARDWARE, null)
                    setBackgroundColor(0xFF0C0A1C.toInt())
                    settings.apply {
                        javaScriptEnabled = true
                        domStorageEnabled = true
                        databaseEnabled = true
                        mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                        loadWithOverviewMode = true
                        useWideViewPort = true
                    }
                    loadUrl(savedUrl)
                    webViewInstance.value = this
                }
            },
            modifier = Modifier.fillMaxSize()
        )

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
                imageVector = if (showDiagnosticsOverlay) Icons.Default.Close else Icons.Default.Build,
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

                    // Status Description
                    Text(
                        text = getStatusText(jarvisState),
                        color = Color.White,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = getStatusSubtext(jarvisState),
                        color = Color.White.copy(alpha = 0.6f),
                        fontSize = 11.sp,
                        lineHeight = 16.sp
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    // Collapsible Server Settings Panel
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { showSettings = !showSettings }
                            .padding(vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = if (showSettings) Icons.Default.KeyboardArrowUp else Icons.Default.Settings,
                            contentDescription = "Settings",
                            tint = Color.White.copy(alpha = 0.5f),
                            modifier = Modifier.size(14.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "Vite Server Configuration",
                            color = Color.White.copy(alpha = 0.5f),
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    if (showSettings) {
                        Spacer(modifier = Modifier.height(8.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            OutlinedTextField(
                                value = inputUrl,
                                onValueChange = { inputUrl = it },
                                singleLine = true,
                                label = { Text("Server URL", fontSize = 10.sp, color = Color.White.copy(alpha = 0.5f)) },
                                modifier = Modifier.weight(1f),
                                colors = TextFieldDefaults.colors(
                                    focusedTextColor = Color.White,
                                    unfocusedTextColor = Color.White,
                                    focusedContainerColor = cardBackground,
                                    unfocusedContainerColor = cardBackground,
                                    focusedIndicatorColor = accentCyan,
                                    unfocusedIndicatorColor = borderLight
                                )
                            )
                            Button(
                                onClick = {
                                    sharedPrefs.edit().putString("life_os_url", inputUrl.trim()).apply()
                                    savedUrl = inputUrl.trim()
                                    webViewInstance.value?.loadUrl(savedUrl)
                                    showSettings = false
                                    showDiagnosticsOverlay = false
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = accentViolet),
                                shape = RoundedCornerShape(8.dp),
                                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 8.dp)
                            ) {
                                Text("SAVE", fontSize = 10.sp, fontWeight = FontWeight.Bold)
                            }
                        }
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
                            text = "Microphone permission is required. Enable in Android settings.",
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
                        text = "DOWNLOADING OFFLINE VOICE MODEL",
                        color = Color.White,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.ExtraBold,
                        letterSpacing = 1.5.sp
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    Text(
                        text = "$progress% complete",
                        color = accentCyan,
                        fontSize = 24.sp,
                        fontWeight = FontWeight.Black
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = "Downloading English voice recognition package (~40 MB) for 100% private, on-device hotword spotting. Do not close the application.",
                        color = Color.White.copy(alpha = 0.5f),
                        fontSize = 10.sp,
                        textAlign = TextAlign.Center,
                        lineHeight = 16.sp,
                        modifier = Modifier.padding(horizontal = 40.dp)
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
        JarvisState.Listening -> accentGreen
        is JarvisState.DownloadingModel -> accentViolet
        is JarvisState.Detected -> accentCyan
        is JarvisState.Error -> accentRed
    }

    val label = when (state) {
        JarvisState.Disabled -> "OFFLINE"
        JarvisState.Starting -> "STARTING"
        JarvisState.Listening -> "ACTIVE"
        is JarvisState.DownloadingModel -> "UPDATING"
        is JarvisState.Detected -> "SPOTTED"
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
    borderLight: Color,
    cardBackground: Color,
    accentCyan: Color,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
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
            Text(
                text = "DIAGNOSTICS PANEL",
                color = Color.White,
                fontSize = 12.sp,
                fontWeight = FontWeight.ExtraBold,
                letterSpacing = 1.sp
            )

            Spacer(modifier = Modifier.height(12.dp))

            // Technical details row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                DiagItem(label = "Engine", value = "Vosk offline")
                DiagItem(
                    label = "Microphone",
                    value = if (state is JarvisState.Listening || state is JarvisState.Detected) "Active" else "Offline"
                )
                DiagItem(label = "DetectionsCount", value = "$detectionsCount")
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Phrases Info Box
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color.White.copy(alpha = 0.02f), RoundedCornerShape(10.dp))
                    .border(1.dp, borderLight.copy(alpha = 0.5f), RoundedCornerShape(10.dp))
                    .padding(8.dp)
            ) {
                Column {
                    Text(
                        text = "Supported Phrases:",
                        color = Color.White.copy(alpha = 0.5f),
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = if (loadedPhrases.isNotEmpty()) loadedPhrases.joinToString("  |  ") else "built-in JARVIS",
                        color = accentCyan,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            Text(
                text = "SPOTTED HISTORY LOGS",
                color = Color.White.copy(alpha = 0.6f),
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 0.5.sp
            )

            Spacer(modifier = Modifier.height(6.dp))

            // List of spotted logs
            LazyColumn(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                if (detectionLogs.isEmpty()) {
                    item {
                        Text(
                            text = "No wake words detected yet.",
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
            Button(
                onClick = {
                    val intent = Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS)
                    context.startActivity(intent)
                },
                colors = ButtonDefaults.buttonColors(containerColor = Color.White.copy(alpha = 0.05f)),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier.fillMaxWidth(),
                contentPadding = PaddingValues(vertical = 6.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Info,
                    contentDescription = "Battery Config",
                    tint = Color.White.copy(alpha = 0.6f),
                    modifier = Modifier.size(12.dp)
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    text = "Configure Battery Optimization (Disable for Galaxy Tab S9 Ultra)",
                    color = Color.White.copy(alpha = 0.8f),
                    fontSize = 9.sp,
                    fontWeight = FontWeight.Bold
                )
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

private fun getStatusText(state: JarvisState): String {
    return when (state) {
        JarvisState.Disabled -> "● Jarvis is Offline"
        JarvisState.Starting -> "Initializing Jarvis Engine..."
        JarvisState.Listening -> "Listening locally for wake words..."
        is JarvisState.DownloadingModel -> "Downloading voice model..."
        is JarvisState.Detected -> "✦ Wake Word Spotted: ${state.wakeWord}!"
        is JarvisState.Error -> "System Alert"
    }
}

private fun getStatusSubtext(state: JarvisState): String {
    return when (state) {
        JarvisState.Disabled -> "Enable background listener to trigger voice commands."
        JarvisState.Starting -> "Verifying microphone permission and loading local acoustic voice models."
        JarvisState.Listening -> "Say \"JARVIS\" or \"Hey JARVIS\" clearly. Voice processing is 100% local."
        is JarvisState.DownloadingModel -> "Fetching optimized 40 MB speech models to allow offline recognition."
        is JarvisState.Detected -> "Preparing to listen for your command, Sir."
        is JarvisState.Error -> state.message
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
