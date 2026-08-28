package com.example.lifeos.ui.jarvis

import android.Manifest
import android.content.pm.PackageManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
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
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import com.example.lifeos.jarvis.prefs.JarvisPrefs
import com.example.lifeos.theme.*
import com.example.lifeos.ui.components.LifeOSButton
import com.example.lifeos.ui.components.LifeOSOrb
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import com.example.lifeos.jarvis.audio.toFloatPcm

@Composable
fun VoiceEnrollmentScreen(
    onFinish: () -> Unit,
    modifier: Modifier = Modifier
) {
    var currentStep by remember { mutableStateOf(1) }
    val context = LocalContext.current

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(DarkBg)
    ) {
        AnimatedContent(
            targetState = currentStep,
            transitionSpec = {
                fadeIn(animationSpec = tween(500)) togetherWith fadeOut(animationSpec = tween(500))
            },
            label = "onboarding_step"
        ) { step ->
            when (step) {
                1 -> WakeWordSetupStep(onNext = { currentStep = 2 })
                2 -> TeachJarvisStep(onNext = { currentStep = 3 })
                3 -> VoiceVerificationStep(onNext = { currentStep = 4 })
                4 -> SetupCompleteStep(onFinish = {
                    JarvisPrefs.setSetupCompleted(context, true)
                    onFinish()
                })
            }
        }
    }
}

@Composable
fun WakeWordSetupStep(onNext: () -> Unit) {
    val context = LocalContext.current
    val launcher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) onNext()
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(28.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(Modifier.height(60.dp))
        
        LifeOSOrb(size = 120.dp, state = "idle")
        
        Spacer(Modifier.height(48.dp))
        
        Text(
            text = "JARVIS listens for",
            color = Color.White.copy(alpha = 0.6f),
            fontSize = 16.sp,
            fontWeight = FontWeight.Medium
        )
        
        Text(
            text = "\"Hey Jarvis\"",
            color = AccentViolet,
            fontSize = 32.sp,
            fontWeight = FontWeight.Black,
            modifier = Modifier.padding(vertical = 8.dp)
        )
        
        Text(
            text = "To provide a seamless hands-free experience, we need access to your microphone.",
            color = Color.White.copy(alpha = 0.5f),
            fontSize = 14.sp,
            textAlign = TextAlign.Center,
            lineHeight = 22.sp,
            modifier = Modifier.padding(horizontal = 20.dp)
        )
        
        Spacer(Modifier.weight(1f))
        
        InfoRow(Icons.Default.Lock, "Always private", "Audio stays on your device")
        InfoRow(Icons.Default.VerifiedUser, "Only you can wake JARVIS", "Secure voice verification")
        InfoRow(Icons.Default.CloudQueue, "Works in the background", "Optimized for low power")
        
        Spacer(Modifier.height(40.dp))
        
        LifeOSButton(
            text = "Grant Microphone Access",
            onClick = {
                val permission = Manifest.permission.RECORD_AUDIO
                if (ContextCompat.checkSelfPermission(context, permission) == PackageManager.PERMISSION_GRANTED) {
                    onNext()
                } else {
                    launcher.launch(permission)
                }
            }
        )
    }
}

@Composable
fun TeachJarvisStep(onNext: () -> Unit) {
    val context = LocalContext.current
    var count by remember { mutableIntStateOf(0) }
    val scope = rememberCoroutineScope()
    
    // States for the engine
    val engine = remember { com.example.lifeos.jarvis.wakeword.SherpaWakeWordEngine(context) }
    val audioManager = remember { com.example.lifeos.jarvis.audio.JarvisAudioManager(context) }

    DisposableEffect(Unit) {
        engine.initialize()
        audioManager.start { frame, length ->
            val hit = engine.process(frame.toFloatPcm(length), com.example.lifeos.jarvis.wakeword.WakeWordConfig.SAMPLE_RATE)
            if (hit != null) {
                scope.launch {
                    if (count < 5) {
                        count++
                    }
                }
            }
        }
        onDispose {
            audioManager.stop()
            engine.release()
        }
    }

    LaunchedEffect(count) {
        if (count >= 5) {
            delay(800)
            onNext()
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(28.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("Teach JARVIS", color = Color.White, fontWeight = FontWeight.Bold)
            IconButton(onClick = { /* Handle Close */ }) {
                Icon(Icons.Default.Close, null, tint = Color.White.copy(alpha = 0.5f))
            }
        }
        
        Spacer(Modifier.weight(1f))
        
        Text("Say", color = Color.White.copy(alpha = 0.6f), fontSize = 18.sp)
        Text(
            "\"Hey Jarvis\"",
            color = AccentCyan,
            fontSize = 36.sp,
            fontWeight = FontWeight.Black,
            modifier = Modifier.padding(vertical = 12.dp)
        )
        
        Spacer(Modifier.height(40.dp))
        
        LifeOSOrb(size = 200.dp, state = "listening")
        
        Spacer(Modifier.weight(1f))
        
        Text(
            text = "${if (count > 5) 5 else count} / 5",
            color = Color.White,
            fontSize = 18.sp,
            fontWeight = FontWeight.Bold
        )
        
        Text(
            text = "Say it clearly with your\nnatural voice",
            color = Color.White.copy(alpha = 0.4f),
            fontSize = 14.sp,
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(top = 12.dp)
        )
        
        Spacer(Modifier.height(60.dp))
    }
}

@Composable
fun VoiceVerificationStep(onNext: () -> Unit) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    
    val phrases = listOf(
        "My name is Anirudh.",
        "JARVIS, I use LifeOS every day.",
        "This is my personal voice profile.",
        "Let's make LifeOS smarter together.",
        "Hey Jarvis, what are my tasks today?"
    )
    
    var completedIndex by remember { mutableIntStateOf(0) }
    val capturedEmbeddings = remember { mutableStateListOf<com.example.lifeos.jarvis.speaker.SpeakerEmbedding>() }

    // Audio states
    val audioManager = remember { com.example.lifeos.jarvis.audio.JarvisAudioManager(context) }
    
    DisposableEffect(Unit) {
        audioManager.start { frame, length ->
            // We want to capture audio for the current phrase
            // In a real implementation, we'd detect silence or use a button
            // For now, we'll simulate the capture when the user clicks or wait a bit
        }
        onDispose { audioManager.stop() }
    }

    LaunchedEffect(completedIndex) {
        if (completedIndex >= phrases.size) {
            // Save the profile
            val finalProfile = com.example.lifeos.jarvis.speaker.JarvisSpeakerVerifier.createProfileFromSamples(capturedEmbeddings)
            com.example.lifeos.jarvis.speaker.JarvisSpeakerVerifier.saveVoiceProfile(context, finalProfile)
            delay(1000)
            onNext()
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(28.dp)
    ) {
        Text(
            "Now, let's verify it's you",
            color = Color.White,
            fontSize = 24.sp,
            fontWeight = FontWeight.Black
        )
        Text(
            "JARVIS will only respond to your voice.",
            color = Color.White.copy(alpha = 0.5f),
            fontSize = 14.sp,
            modifier = Modifier.padding(top = 8.dp, bottom = 32.dp)
        )
        
        phrases.forEachIndexed { index, phrase ->
            VerificationRow(
                index = index + 1,
                text = phrase,
                status = when {
                    index < completedIndex -> "done"
                    index == completedIndex -> "active"
                    else -> "pending"
                },
                onClick = {
                    if (index == completedIndex) {
                        // Capture a sample from the audio manager ring buffer
                        val samples = audioManager.snapshotRecent()
                        if (samples.isNotEmpty()) {
                            val embedding = com.example.lifeos.jarvis.speaker.JarvisSpeakerVerifier.extractEmbedding(samples)
                            capturedEmbeddings.add(embedding)
                            completedIndex++
                        }
                    }
                }
            )
            Spacer(Modifier.height(16.dp))
        }
        
        Spacer(Modifier.weight(1f))
        
        // Visualizing waveform at the bottom
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(60.dp),
            contentAlignment = Alignment.Center
        ) {
            Text("Tap the active phrase after speaking it", color = AccentCyan.copy(alpha = 0.5f), fontSize = 12.sp)
        }
    }
}

@Composable
fun SetupCompleteStep(onFinish: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(28.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(Modifier.weight(1f))
        
        LifeOSOrb(size = 220.dp, state = "success")
        
        Spacer(Modifier.height(48.dp))
        
        Text(
            "You're all set!",
            color = Color.White,
            fontSize = 32.sp,
            fontWeight = FontWeight.Black
        )
        
        Text(
            "Say \"Hey Jarvis\" anytime\nto wake me up.",
            color = Color.White.copy(alpha = 0.5f),
            fontSize = 16.sp,
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(top = 16.dp)
        )
        
        Spacer(Modifier.weight(1f))
        
        LifeOSButton(
            text = "Continue to LifeOS",
            onClick = onFinish
        )
        
        Spacer(Modifier.height(16.dp))
    }
}

@Composable
fun InfoRow(icon: ImageVector, title: String, sub: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(40.dp)
                .background(AccentViolet.copy(alpha = 0.1f), CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Icon(icon, null, tint = AccentViolet, modifier = Modifier.size(20.dp))
        }
        Spacer(Modifier.width(16.dp))
        Column {
            Text(title, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
            Text(sub, color = Color.White.copy(alpha = 0.4f), fontSize = 12.sp)
        }
    }
}

@Composable
fun VerificationRow(index: Int, text: String, status: String, onClick: () -> Unit = {}) {
    val bgColor = if (status == "active") Color.White.copy(alpha = 0.05f) else Color.Transparent
    val borderColor = if (status == "active") AccentViolet.copy(alpha = 0.3f) else Color.White.copy(alpha = 0.05f)
    
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(bgColor)
            .border(1.dp, borderColor, RoundedCornerShape(16.dp))
            .clickable(enabled = status == "active") { onClick() }
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(24.dp)
                .background(Color.White.copy(alpha = 0.1f), CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Text(index.toString(), color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
        }
        Spacer(Modifier.width(16.dp))
        Text(
            text = text,
            color = if (status == "pending") Color.White.copy(alpha = 0.3f) else Color.White,
            fontSize = 14.sp,
            modifier = Modifier.weight(1f)
        )
        if (status == "done") {
            Icon(Icons.Default.Check, null, tint = Color(0xFF10B981), modifier = Modifier.size(18.dp))
        } else if (status == "active") {
            Icon(Icons.Default.Mic, null, tint = AccentViolet, modifier = Modifier.size(18.dp))
        }
    }
}
