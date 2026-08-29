package com.example.lifeos.ui.settings

import androidx.compose.animation.*
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.activity.compose.BackHandler
import android.content.Intent
import android.os.Build
import com.example.lifeos.jarvis.prefs.JarvisPrefs
import com.example.lifeos.jarvis.audio.toFloatPcm
import kotlinx.coroutines.launch
import androidx.compose.ui.text.style.TextAlign
import com.example.lifeos.jarvis.service.JarvisWakeWordService
import com.example.lifeos.theme.*
import com.example.lifeos.ui.components.LifeOSCard
import com.example.lifeos.ui.components.LifeOSOrb

import com.example.lifeos.ui.components.LifeOSButton
import com.example.lifeos.ui.components.LifeOSOrb

import com.example.lifeos.ui.jarvis.WakeWordResultScreen

private enum class SettingsSubScreen {
    Main, WakeWord, VoiceProfile, Advanced, Diagnostics
}

@Composable
fun SettingsScreen(
    onEnrollVoice: () -> Unit = {},
    modifier: Modifier = Modifier
) {
    var currentSubScreen by remember { mutableStateOf(SettingsSubScreen.Main) }
    val context = LocalContext.current

    Box(modifier = modifier.fillMaxSize().background(MaterialTheme.colorScheme.background)) {
        AnimatedContent(
            targetState = currentSubScreen,
            transitionSpec = {
                if (targetState != SettingsSubScreen.Main) {
                    slideInHorizontally { it } + fadeIn() togetherWith slideOutHorizontally { -it } + fadeOut()
                } else {
                    slideInHorizontally { -it } + fadeIn() togetherWith slideOutHorizontally { it } + fadeOut()
                }
            },
            label = "settings_nav"
        ) { subScreen ->
            when (subScreen) {
                SettingsSubScreen.Main -> MainSettings(
                    onNavigate = { currentSubScreen = it },
                    onEnrollVoice = onEnrollVoice
                )
                SettingsSubScreen.WakeWord -> WakeWordSettings(
                    onBack = { currentSubScreen = SettingsSubScreen.Main },
                    onOpenDiagnostics = { currentSubScreen = SettingsSubScreen.Diagnostics }
                )
                SettingsSubScreen.VoiceProfile -> VoiceProfileSettings(
                    onBack = { currentSubScreen = SettingsSubScreen.Main },
                    onReEnroll = onEnrollVoice
                )
                SettingsSubScreen.Advanced -> AdvancedSettings(onBack = { currentSubScreen = SettingsSubScreen.Main })
                SettingsSubScreen.Diagnostics -> WakeWordResultScreen(
                    onFinish = { currentSubScreen = SettingsSubScreen.Main },
                    onReEnroll = onEnrollVoice
                )
            }
        }
    }

    if (currentSubScreen != SettingsSubScreen.Main) {
        BackHandler { currentSubScreen = SettingsSubScreen.Main }
    }
}

@Composable
private fun MainSettings(
    onNavigate: (SettingsSubScreen) -> Unit,
    onEnrollVoice: () -> Unit
) {
    val context = LocalContext.current
    val wakeWordEnabled = JarvisPrefs.isListenEnabled(context)
    val voiceProfileConfigured = com.example.lifeos.jarvis.speaker.JarvisSpeakerVerifier.getVoiceProfile(context) != null

    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(horizontal = 20.dp),
        verticalArrangement = Arrangement.spacedBy(24.dp)
    ) {
        item { Spacer(Modifier.height(12.dp)) }
        
        item {
            Text(
                text = "Settings",
                color = MaterialTheme.colorScheme.onBackground,
                fontSize = 32.sp,
                fontWeight = FontWeight.Black
            )
        }

        item { ProfileHeader() }

        item {
            SettingsGroup("Assistant") {
                SettingsRow(
                    label = "JARVIS Voice Assistant",
                    value = if (wakeWordEnabled) "Enabled" else "Disabled",
                    icon = Icons.Default.Mic,
                    color = AccentViolet,
                    onClick = { onNavigate(SettingsSubScreen.Advanced) }
                )
                SettingsRow(
                    label = "Wake Word",
                    value = "Hey Jarvis",
                    icon = Icons.Default.Language,
                    color = AccentCyan,
                    onClick = { onNavigate(SettingsSubScreen.WakeWord) }
                )
                SettingsRow(
                    label = "Voice Profile",
                    value = if (voiceProfileConfigured) "Configured" else "Not Set",
                    icon = Icons.Default.RecordVoiceOver,
                    color = Color(0xFF10B981),
                    onClick = { onNavigate(SettingsSubScreen.VoiceProfile) }
                )
            }
        }

        item {
            SettingsGroup("System") {
                SettingsRow("General", null, Icons.Default.Settings, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
                SettingsRow("Appearance", "Dark Mode", Icons.Default.Palette, AccentViolet)
                SettingsRow("Notifications", null, Icons.Default.Notifications, AccentCyan)
            }
        }

        item {
            SettingsGroup("Privacy & Data") {
                SettingsRow("Data & Storage", null, Icons.Default.Storage, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
                SettingsRow("Security & Privacy", null, Icons.Default.Security, Color(0xFF10B981))
            }
        }

        item {
            SettingsGroup("Info") {
                SettingsRow("About LifeOS", "v1.0.0", Icons.Default.Info, AccentViolet)
            }
        }
        
        item { Spacer(Modifier.height(40.dp)) }
    }
}

@Composable
private fun WakeWordSettings(
    onBack: () -> Unit,
    onOpenDiagnostics: () -> Unit
) {
    val context = LocalContext.current
    var sensitivity by remember { mutableFloatStateOf(JarvisPrefs.getWakeWordSensitivity(context)) }

    Column(modifier = Modifier.fillMaxSize().padding(28.dp)) {
        SettingsHeader("Wake Word", onBack)
        
        Spacer(Modifier.height(32.dp))
        
        Text("Your Wake Word", color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f), fontSize = 12.sp, fontWeight = FontWeight.Bold)
        Text("Hey Jarvis", color = MaterialTheme.colorScheme.onSurface, fontSize = 24.sp, fontWeight = FontWeight.Black, modifier = Modifier.padding(vertical = 8.dp))
        
        // Simulating a waveform
        Box(modifier = Modifier.fillMaxWidth().height(60.dp).padding(vertical = 12.dp)) {
            Row(horizontalArrangement = Arrangement.spacedBy(4.dp), verticalAlignment = Alignment.CenterVertically) {
                repeat(30) { i ->
                    val h = remember { (4..24).random().dp }
                    Box(Modifier.width(2.dp).height(h).background(AccentCyan.copy(alpha = 0.4f), CircleShape))
                }
            }
        }
        
        Spacer(Modifier.height(16.dp))
        
        LifeOSButton(
            text = "Run Wake Word Diagnostics & Test",
            onClick = onOpenDiagnostics,
            containerColor = AccentCyan.copy(alpha = 0.15f)
        )
        
        Spacer(Modifier.height(32.dp))
        
        Text("Wake Word Sensitivity", color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f), fontSize = 12.sp, fontWeight = FontWeight.Bold)
        Text("Higher sensitivity may increase false activations.", color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.3f), fontSize = 11.sp, modifier = Modifier.padding(top = 4.dp, bottom = 16.dp))
        
        Slider(
            value = sensitivity,
            onValueChange = { 
                sensitivity = it
                JarvisPrefs.setWakeWordSensitivity(context, it)
            },
            onValueChangeFinished = {
                // Notify service to pick up new sensitivity
                val intent = Intent(context, JarvisWakeWordService::class.java).apply {
                    action = JarvisWakeWordService.ACTION_REFRESH_SETTINGS
                }
                context.startService(intent)
            },
            valueRange = 0.1f..0.6f,
            colors = SliderDefaults.colors(
                thumbColor = AccentCyan,
                activeTrackColor = AccentCyan,
                inactiveTrackColor = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.1f)
            )
        )
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text("Low", color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.3f), fontSize = 10.sp)
            Text("Medium", color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.3f), fontSize = 10.sp)
            Text("High", color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.3f), fontSize = 10.sp)
        }
        
        Spacer(Modifier.height(32.dp))
        
        Text("Wake Word Engine", color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f), fontSize = 12.sp, fontWeight = FontWeight.Bold)
        SettingsRow(label = "Sherpa KWS", value = "On-device", icon = Icons.Default.Memory, color = AccentViolet, onClick = onOpenDiagnostics)
    }
}

@Composable
private fun VoiceProfileSettings(onBack: () -> Unit, onReEnroll: () -> Unit) {
    val context = LocalContext.current
    val voiceProfile = com.example.lifeos.jarvis.speaker.JarvisSpeakerVerifier.getVoiceProfile(context)
    val configured = voiceProfile != null

    var showTestDialog by remember { mutableStateOf(false) }
    var showDeleteDialog by remember { mutableStateOf(false) }

    if (showTestDialog) {
        TestWakeWordDialog(onDismiss = { showTestDialog = false })
    }

    if (showDeleteDialog) {
        AlertDialog(
            onDismissRequest = { showDeleteDialog = false },
            title = { Text("Delete Voice Profile?", color = Color.White, fontWeight = FontWeight.Bold) },
            text = { Text("Jarvis will no longer respond to your wake word until you set it up again.", color = Color.White.copy(alpha = 0.7f)) },
            confirmButton = {
                TextButton(onClick = {
                    com.example.lifeos.jarvis.speaker.JarvisSpeakerVerifier.deleteVoiceProfile(context)
                    JarvisPrefs.setWakeWordStatus(context, "NOT_CONFIGURED")
                    JarvisPrefs.setListenEnabled(context, false)
                    showDeleteDialog = false
                    onBack()
                }) {
                    Text("Delete", color = AccentRed)
                }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteDialog = false }) {
                    Text("Cancel", color = Color.White.copy(alpha = 0.6f))
                }
            },
            containerColor = MaterialTheme.colorScheme.surface,
            shape = RoundedCornerShape(24.dp)
        )
    }

    Column(modifier = Modifier.fillMaxSize().padding(28.dp)) {
        SettingsHeader("Voice Profile", onBack)
        
        Spacer(Modifier.height(32.dp))
        
        Text("Voice Profile Status", color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f), fontSize = 12.sp, fontWeight = FontWeight.Bold)
        
        Row(modifier = Modifier.padding(vertical = 16.dp), verticalAlignment = Alignment.CenterVertically) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = if (configured) "Configured" else "Not Set Up",
                    color = if (configured) Color(0xFF10B981) else AccentRed,
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Black
                )
                Text(
                    text = if (configured) "JARVIS will only respond to your voice." else "Enabling this improves security.",
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f),
                    fontSize = 12.sp
                )
            }
            LifeOSOrb(size = 64.dp, state = if (configured) "success" else "idle")
        }
        
        Spacer(Modifier.height(24.dp))
        
        SettingsGroup("Actions") {
            SettingsRow("Test Voice", "Verify profile", Icons.Default.RecordVoiceOver, AccentCyan, onClick = {
                showTestDialog = true
            })
            SettingsRow("Re-enroll Voice", "Improve accuracy", Icons.Default.Refresh, AccentViolet, onClick = onReEnroll)
            SettingsRow("Delete Voice Profile", "Remove data", Icons.Default.Delete, AccentRed, onClick = {
                showDeleteDialog = true
            })
        }
        
        Spacer(Modifier.height(40.dp))
        
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(MaterialTheme.colorScheme.onSurface.copy(alpha = 0.03f), RoundedCornerShape(12.dp))
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(Icons.Default.Info, null, tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.2f), modifier = Modifier.size(20.dp))
            Spacer(Modifier.width(12.dp))
            Text("All voice data is stored locally and never leaves your device.", color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.3f), fontSize = 10.sp)
        }
    }
}

@Composable
fun TestWakeWordDialog(onDismiss: () -> Unit) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var currentRms by remember { mutableStateOf(0.0) }
    var testResult by remember { mutableStateOf<Pair<Boolean, Float>?>(null) }
    var statusText by remember { mutableStateOf("Listening for \"Hey Jarvis\"...") }

    // Start Wake Word Engine and Audio Manager
    val engine = remember { com.example.lifeos.jarvis.wakeword.SherpaWakeWordEngine(context) }
    val audioManager = remember { com.example.lifeos.jarvis.audio.JarvisAudioManager(context) }

    DisposableEffect(Unit) {
        engine.initialize()
        audioManager.start(stage = "DIAGNOSTICS") { frame, length, rms ->
            if (testResult != null) return@start
            currentRms = rms
            val hit = engine.process(frame.toFloatPcm(length), com.example.lifeos.jarvis.wakeword.WakeWordConfig.SAMPLE_RATE)
            if (hit != null) {
                scope.launch(kotlinx.coroutines.Dispatchers.Main) {
                    statusText = "Wake word detected. Verifying..."
                    val samples = audioManager.snapshotRecent(16000 * 2)
                    val profile = com.example.lifeos.jarvis.speaker.JarvisSpeakerVerifier.getVoiceProfile(context)
                    if (profile == null) {
                        statusText = "No voice profile enrolled!"
                        testResult = Pair(false, 0f)
                    } else {
                        val score = com.example.lifeos.jarvis.speaker.JarvisSpeakerVerifier.verifySpeaker(context, samples, profile)
                        val verified = score >= com.example.lifeos.jarvis.speaker.JarvisSpeakerVerifier.DEFAULT_THRESHOLD
                        testResult = Pair(verified, score)
                        statusText = if (verified) {
                            "Voice verified ✓"
                        } else {
                            "Voice could not be verified"
                        }
                    }
                }
            }
        }
        onDispose {
            audioManager.stop()
            engine.release()
        }
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Test Wake Word", color = Color.White, fontWeight = FontWeight.Bold) },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth().padding(vertical = 12.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = statusText,
                    color = if (testResult == null) Color.White else (if (testResult!!.first) Color(0xFF10B981) else AccentRed),
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    textAlign = TextAlign.Center
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                if (testResult != null) {
                    Text(
                        text = String.format("Similarity score: %.2f (Threshold: %.2f)", testResult!!.second, com.example.lifeos.jarvis.speaker.JarvisSpeakerVerifier.DEFAULT_THRESHOLD),
                        color = Color.White.copy(alpha = 0.6f),
                        fontSize = 13.sp
                    )
                } else {
                    LifeOSOrb(size = 100.dp, state = if (currentRms > 0.01) "listening" else "idle")
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("Close", color = AccentCyan)
            }
        },
        containerColor = MaterialTheme.colorScheme.surface,
        shape = RoundedCornerShape(24.dp)
    )
}

@Composable
private fun AdvancedSettings(onBack: () -> Unit) {
    val context = LocalContext.current
    var enableJarvis by remember { mutableStateOf(JarvisPrefs.isListenEnabled(context)) }
    var runInBackground by remember { mutableStateOf(JarvisPrefs.isRunInBackgroundEnabled(context)) }
    var speakerVerification by remember { mutableStateOf(JarvisPrefs.isSpeakerVerificationEnabled(context)) }
    var autoListenBoot by remember { mutableStateOf(JarvisPrefs.isAutoListenBootEnabled(context)) }

    Column(modifier = Modifier.fillMaxSize().padding(28.dp)) {
        SettingsHeader("JARVIS Advanced", onBack)
        
        Spacer(Modifier.height(32.dp))
        
        SettingsGroup("Functional Toggles") {
            ToggleRow("Enable JARVIS", "Listen for 'Hey Jarvis'", enableJarvis, Icons.Default.Mic) {
                enableJarvis = it
                JarvisPrefs.setListenEnabled(context, it)
                // Trigger service update
                val intent = Intent(context, JarvisWakeWordService::class.java).apply {
                    action = if (it) JarvisWakeWordService.ACTION_START else JarvisWakeWordService.ACTION_STOP
                }
                if (it && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) context.startForegroundService(intent) else context.startService(intent)
            }
            ToggleRow("Run in Background", "Keep listening when app is closed", runInBackground, Icons.Default.CloudQueue) {
                runInBackground = it
                JarvisPrefs.setRunInBackgroundEnabled(context, it)
            }
            ToggleRow("Speaker Verification", "Only you can wake JARVIS", speakerVerification, Icons.Default.VerifiedUser) {
                speakerVerification = it
                JarvisPrefs.setSpeakerVerificationEnabled(context, it)
            }
            ToggleRow("Auto Listen After Boot", "Start JARVIS on device boot", autoListenBoot, Icons.Default.PowerSettingsNew) {
                autoListenBoot = it
                JarvisPrefs.setAutoListenBootEnabled(context, it)
            }
        }

        Spacer(Modifier.height(24.dp))
        
        SettingsGroup("Diagnostics") {
            SettingsRow(
                label = "Trigger System Demo",
                value = "Run Now",
                icon = Icons.Default.PlayCircle,
                color = Color(0xFFFFB300),
                onClick = {
                    val intent = Intent(context, com.example.lifeos.jarvis.reminder.CalendarReminderReceiver::class.java).apply {
                        action = "com.example.lifeos.ACTION_PROACTIVE_REMINDER"
                        putExtra("event_title", "Daily Stand-up Meeting")
                    }
                    context.sendBroadcast(intent)
                }
            )
        }
        
        Spacer(Modifier.height(24.dp))
        
        SettingsRow("Developer Options", null, Icons.Default.Terminal, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f))
        
        Spacer(Modifier.weight(1f))
        
        SettingsRow("Disable JARVIS", "Turn off all features", Icons.Default.PowerOff, AccentRed, onClick = {
             JarvisPrefs.setListenEnabled(context, false)
             enableJarvis = false
             onBack()
        })
    }
}

@Composable
private fun SettingsHeader(title: String, onBack: () -> Unit) {
    Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        IconButton(onClick = onBack) { Icon(Icons.Default.ArrowBack, null, tint = MaterialTheme.colorScheme.onBackground) }
        Spacer(Modifier.width(12.dp))
        Text(title, color = MaterialTheme.colorScheme.onBackground, fontSize = 20.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun ToggleRow(label: String, sub: String, checked: Boolean, icon: ImageVector, onCheckedChange: (Boolean) -> Unit) {
    Row(modifier = Modifier.fillMaxWidth().padding(vertical = 12.dp), verticalAlignment = Alignment.CenterVertically) {
        Box(modifier = Modifier.size(36.dp).background(MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f), CircleShape), contentAlignment = Alignment.Center) {
            Icon(icon, null, tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f), modifier = Modifier.size(18.dp))
        }
        Spacer(Modifier.width(16.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(label, color = MaterialTheme.colorScheme.onSurface, fontSize = 14.sp, fontWeight = FontWeight.Bold)
            Text(sub, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f), fontSize = 11.sp)
        }
        Switch(
            checked = checked, 
            onCheckedChange = onCheckedChange,
            colors = SwitchDefaults.colors(checkedThumbColor = AccentCyan, checkedTrackColor = AccentCyan.copy(alpha = 0.3f))
        )
    }
}

@Composable
fun ProfileHeader() {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(24.dp))
            .background(MaterialTheme.colorScheme.surface.copy(alpha = 0.5f))
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(56.dp)
                .clip(CircleShape)
                .background(AccentViolet.copy(alpha = 0.1f))
                .border(2.dp, AccentViolet.copy(alpha = 0.3f), CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Icon(Icons.Default.Person, null, tint = AccentViolet, modifier = Modifier.size(28.dp))
        }
        Spacer(Modifier.width(16.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text("Anirudh", color = MaterialTheme.colorScheme.onSurface, fontSize = 18.sp, fontWeight = FontWeight.Bold)
            Text("anirudh@email.com", color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f), fontSize = 12.sp)
        }
        Icon(Icons.Default.ChevronRight, null, tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.2f))
    }
}

@Composable
fun SettingsGroup(title: String, content: @Composable ColumnScope.() -> Unit) {
    Column {
        Text(
            text = title,
            color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.3f),
            fontSize = 12.sp,
            fontWeight = FontWeight.Black,
            letterSpacing = 1.sp,
            modifier = Modifier.padding(bottom = 12.dp, start = 8.dp)
        )
        LifeOSCard(content = content)
    }
}

@Composable
fun SettingsRow(label: String, value: String?, icon: ImageVector, color: Color, onClick: () -> Unit = {}) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .padding(vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(36.dp)
                .background(color.copy(alpha = 0.1f), CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Icon(icon, null, tint = color, modifier = Modifier.size(18.dp))
        }
        Spacer(Modifier.width(16.dp))
        Text(label, color = MaterialTheme.colorScheme.onSurface, fontSize = 15.sp, fontWeight = FontWeight.Medium, modifier = Modifier.weight(1f))
        if (value != null) {
            Text(value, color = color.copy(alpha = 0.7f), fontSize = 13.sp, fontWeight = FontWeight.Bold)
            Spacer(Modifier.width(8.dp))
        }
        Icon(Icons.Default.ChevronRight, null, tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.2f), modifier = Modifier.size(16.dp))
    }
}
