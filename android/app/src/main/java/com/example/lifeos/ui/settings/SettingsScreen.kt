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
import com.example.lifeos.jarvis.service.JarvisWakeWordService
import com.example.lifeos.theme.*
import com.example.lifeos.ui.components.LifeOSCard
import com.example.lifeos.ui.components.LifeOSOrb

import com.example.lifeos.ui.components.LifeOSButton
import com.example.lifeos.ui.components.LifeOSOrb

private enum class SettingsSubScreen {
    Main, WakeWord, VoiceProfile, Advanced
}

@Composable
fun SettingsScreen(
    onEnrollVoice: () -> Unit = {},
    modifier: Modifier = Modifier
) {
    var currentSubScreen by remember { mutableStateOf(SettingsSubScreen.Main) }
    val context = LocalContext.current

    Box(modifier = modifier.fillMaxSize().background(DarkBg)) {
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
                SettingsSubScreen.WakeWord -> WakeWordSettings(onBack = { currentSubScreen = SettingsSubScreen.Main })
                SettingsSubScreen.VoiceProfile -> VoiceProfileSettings(
                    onBack = { currentSubScreen = SettingsSubScreen.Main },
                    onReEnroll = onEnrollVoice
                )
                SettingsSubScreen.Advanced -> AdvancedSettings(onBack = { currentSubScreen = SettingsSubScreen.Main })
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
                color = Color.White,
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
                SettingsRow("General", null, Icons.Default.Settings, Color.White.copy(alpha = 0.6f))
                SettingsRow("Appearance", "Dark Mode", Icons.Default.Palette, AccentViolet)
                SettingsRow("Notifications", null, Icons.Default.Notifications, AccentCyan)
            }
        }

        item {
            SettingsGroup("Privacy & Data") {
                SettingsRow("Data & Storage", null, Icons.Default.Storage, Color.White.copy(alpha = 0.6f))
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
private fun WakeWordSettings(onBack: () -> Unit) {
    val context = LocalContext.current
    var sensitivity by remember { mutableFloatStateOf(JarvisPrefs.getWakeWordSensitivity(context)) }

    Column(modifier = Modifier.fillMaxSize().padding(28.dp)) {
        SettingsHeader("Wake Word", onBack)
        
        Spacer(Modifier.height(32.dp))
        
        Text("Your Wake Word", color = Color.White.copy(alpha = 0.4f), fontSize = 12.sp, fontWeight = FontWeight.Bold)
        Text("Hey Jarvis", color = Color.White, fontSize = 24.sp, fontWeight = FontWeight.Black, modifier = Modifier.padding(vertical = 8.dp))
        
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
        
        LifeOSButton(text = "Change Wake Word", onClick = { /* Not supported yet */ }, containerColor = Color.White.copy(alpha = 0.05f))
        
        Spacer(Modifier.height(40.dp))
        
        Text("Wake Word Sensitivity", color = Color.White.copy(alpha = 0.4f), fontSize = 12.sp, fontWeight = FontWeight.Bold)
        Text("Higher sensitivity may increase false activations.", color = Color.White.copy(alpha = 0.3f), fontSize = 11.sp, modifier = Modifier.padding(top = 4.dp, bottom = 16.dp))
        
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
                inactiveTrackColor = Color.White.copy(alpha = 0.1f)
            )
        )
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text("Low", color = Color.White.copy(alpha = 0.3f), fontSize = 10.sp)
            Text("Medium", color = Color.White.copy(alpha = 0.3f), fontSize = 10.sp)
            Text("High", color = Color.White.copy(alpha = 0.3f), fontSize = 10.sp)
        }
        
        Spacer(Modifier.height(40.dp))
        
        Text("Wake Word Engine", color = Color.White.copy(alpha = 0.4f), fontSize = 12.sp, fontWeight = FontWeight.Bold)
        SettingsRow(label = "Sherpa KWS", value = "On-device", icon = Icons.Default.Memory, color = AccentViolet, onClick = {})
    }
}

@Composable
private fun VoiceProfileSettings(onBack: () -> Unit, onReEnroll: () -> Unit) {
    val context = LocalContext.current
    val voiceProfile = com.example.lifeos.jarvis.speaker.JarvisSpeakerVerifier.getVoiceProfile(context)
    val configured = voiceProfile != null

    Column(modifier = Modifier.fillMaxSize().padding(28.dp)) {
        SettingsHeader("Voice Profile", onBack)
        
        Spacer(Modifier.height(32.dp))
        
        Text("Voice Profile Status", color = Color.White.copy(alpha = 0.4f), fontSize = 12.sp, fontWeight = FontWeight.Bold)
        
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
                    color = Color.White.copy(alpha = 0.4f),
                    fontSize = 12.sp
                )
            }
            LifeOSOrb(size = 64.dp, state = if (configured) "success" else "idle")
        }
        
        Spacer(Modifier.height(24.dp))
        
        SettingsGroup("Actions") {
            SettingsRow("Test Voice", "Verify profile", Icons.Default.RecordVoiceOver, AccentCyan)
            SettingsRow("Re-enroll Voice", "Improve accuracy", Icons.Default.Refresh, AccentViolet, onClick = onReEnroll)
            SettingsRow("Delete Voice Profile", "Remove data", Icons.Default.Delete, AccentRed, onClick = {
                com.example.lifeos.jarvis.speaker.JarvisSpeakerVerifier.deleteVoiceProfile(context)
                onBack()
            })
        }
        
        Spacer(Modifier.height(40.dp))
        
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(Color.White.copy(alpha = 0.03f), RoundedCornerShape(12.dp))
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(Icons.Default.Info, null, tint = Color.White.copy(alpha = 0.2f), modifier = Modifier.size(20.dp))
            Spacer(Modifier.width(12.dp))
            Text("All voice data is stored locally and never leaves your device.", color = Color.White.copy(alpha = 0.3f), fontSize = 10.sp)
        }
    }
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
                val intent = Intent(context, com.example.lifeos.jarvis.service.JarvisWakeWordService::class.java).apply {
                    action = if (it) com.example.lifeos.jarvis.service.JarvisWakeWordService.ACTION_START else com.example.lifeos.jarvis.service.JarvisWakeWordService.ACTION_STOP
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
        
        SettingsRow("Developer Options", null, Icons.Default.Terminal, Color.White.copy(alpha = 0.4f))
        
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
        IconButton(onClick = onBack) { Icon(Icons.Default.ArrowBack, null, tint = Color.White) }
        Spacer(Modifier.width(12.dp))
        Text(title, color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun ToggleRow(label: String, sub: String, checked: Boolean, icon: ImageVector, onCheckedChange: (Boolean) -> Unit) {
    Row(modifier = Modifier.fillMaxWidth().padding(vertical = 12.dp), verticalAlignment = Alignment.CenterVertically) {
        Box(modifier = Modifier.size(36.dp).background(Color.White.copy(alpha = 0.05f), CircleShape), contentAlignment = Alignment.Center) {
            Icon(icon, null, tint = Color.White.copy(alpha = 0.6f), modifier = Modifier.size(18.dp))
        }
        Spacer(Modifier.width(16.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(label, color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold)
            Text(sub, color = Color.White.copy(alpha = 0.4f), fontSize = 11.sp)
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
            .background(CardBg.copy(alpha = 0.5f))
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
            Text("Anirudh", color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Bold)
            Text("anirudh@email.com", color = Color.White.copy(alpha = 0.4f), fontSize = 12.sp)
        }
        Icon(Icons.Default.ChevronRight, null, tint = Color.White.copy(alpha = 0.2f))
    }
}

@Composable
fun SettingsGroup(title: String, content: @Composable ColumnScope.() -> Unit) {
    Column {
        Text(
            text = title,
            color = Color.White.copy(alpha = 0.3f),
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
        Text(label, color = Color.White, fontSize = 15.sp, fontWeight = FontWeight.Medium, modifier = Modifier.weight(1f))
        if (value != null) {
            Text(value, color = color.copy(alpha = 0.7f), fontSize = 13.sp, fontWeight = FontWeight.Bold)
            Spacer(Modifier.width(8.dp))
        }
        Icon(Icons.Default.ChevronRight, null, tint = Color.White.copy(alpha = 0.2f), modifier = Modifier.size(16.dp))
    }
}
