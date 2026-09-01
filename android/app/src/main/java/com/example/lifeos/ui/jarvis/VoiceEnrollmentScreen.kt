package com.example.lifeos.ui.jarvis

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import com.example.lifeos.jarvis.prefs.JarvisPrefs
import com.example.lifeos.jarvis.prefs.WakeWordSetupState
import com.example.lifeos.theme.*
import com.example.lifeos.ui.components.LifeOSButton
import com.example.lifeos.ui.components.LifeOSOrb
import com.example.lifeos.jarvis.audio.toFloatPcm
import com.example.lifeos.jarvis.audio.JarvisAudioSynthesizer
import com.example.lifeos.jarvis.speaker.JarvisSpeakerVerifier
import com.example.lifeos.jarvis.speaker.SpeakerEmbedding
import com.example.lifeos.jarvis.wakeword.SherpaWakeWordEngine
import com.example.lifeos.jarvis.wakeword.WakeWordController
import com.example.lifeos.jarvis.wakeword.WakeWordEventBus
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlin.time.Duration.Companion.milliseconds

@Composable
fun VoiceEnrollmentScreen(
    onFinish: () -> Unit,
    onSkip: (() -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    var currentStep by remember { mutableIntStateOf(1) }
    val context = LocalContext.current

    val handleSkip: () -> Unit = {
        JarvisPrefs.setWakeWordSetupState(context, WakeWordSetupState.SKIPPED)
        JarvisPrefs.setListenEnabled(context, false)
        if (onSkip != null) {
            onSkip()
        } else {
            onFinish()
        }
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        AnimatedContent(
            targetState = currentStep,
            transitionSpec = {
                fadeIn(animationSpec = tween(400)) togetherWith fadeOut(animationSpec = tween(400))
            },
            label = "enrollment_step"
        ) { step ->
            when (step) {
                1 -> BatteryOptimizationScreen(
                    onNext = { currentStep = 2 },
                    onSkip = { currentStep = 2 }
                )
                2 -> WakeWordEnrollmentStep(
                    onNext = { currentStep = 3 },
                    onSkip = handleSkip
                )
                3 -> WakeWordResultScreen(
                    onFinish = {
                        JarvisPrefs.setWakeWordSetupState(context, WakeWordSetupState.COMPLETED)
                        JarvisPrefs.setListenEnabled(context, true)
                        onFinish()
                    },
                    onReEnroll = {
                        currentStep = 2
                    },
                    onSkip = handleSkip
                )
            }
        }
    }
}

@Composable
fun WakeWordEnrollmentStep(
    onNext: () -> Unit,
    onSkip: (() -> Unit)? = null
) {
    val context = LocalContext.current
    var hasPermission by remember {
        mutableStateOf(
            ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED
        )
    }

    val launcher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        hasPermission = isGranted
    }

    LaunchedEffect(Unit) {
        if (!hasPermission) {
            launcher.launch(Manifest.permission.RECORD_AUDIO)
        }
    }

    if (!hasPermission) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(28.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Icon(
                imageVector = Icons.Default.Mic,
                contentDescription = null,
                tint = AccentViolet,
                modifier = Modifier.size(72.dp)
            )
            Spacer(modifier = Modifier.height(24.dp))
            Text(
                text = "Jarvis Needs Microphone Access",
                color = Color.White,
                fontSize = 22.sp,
                fontWeight = FontWeight.Bold,
                textAlign = TextAlign.Center
            )
            Spacer(modifier = Modifier.height(12.dp))
            Text(
                text = "Microphone access is required to set up and use the wake word.",
                color = Color.White.copy(alpha = 0.6f),
                fontSize = 14.sp,
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(horizontal = 20.dp)
            )
            Spacer(modifier = Modifier.height(48.dp))
            LifeOSButton(
                text = "Allow Microphone",
                onClick = { 
                    launcher.launch(Manifest.permission.RECORD_AUDIO)
                }
            )
            if (onSkip != null) {
                Spacer(modifier = Modifier.height(16.dp))
                TextButton(onClick = onSkip) {
                    Text("Skip for now", color = Color.White.copy(alpha = 0.6f), fontSize = 14.sp)
                }
            }
        }
    } else {
        EnrollmentCaptureFlow(onNext = onNext, onSkip = onSkip)
    }
}

@Composable
fun EnrollmentCaptureFlow(
    onNext: () -> Unit,
    onSkip: (() -> Unit)? = null
) {
    val context = LocalContext.current
    var sampleCount by remember { mutableIntStateOf(1) }
    var currentRms by remember { mutableDoubleStateOf(0.0) }
    var statusText by remember { mutableStateOf("Say: \"Hey Jarvis\"") }
    var heardTokens by remember { mutableStateOf("") }
    var isProcessing by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    val capturedEmbeddings = remember { mutableStateListOf<SpeakerEmbedding>() }

    LaunchedEffect(Unit) {
        WakeWordController.startListening(context)
    }

    LaunchedEffect(Unit) {
        WakeWordEventBus.currentRms.collect { rms ->
            if (!isProcessing) {
                currentRms = rms
            }
        }
    }

    LaunchedEffect(Unit) {
        WakeWordEventBus.lastTokens.collect { tokens ->
            if (!isProcessing && tokens.isNotBlank()) {
                heardTokens = "heard: ${tokens.replace("▁", "").trim()}"
            }
        }
    }

    LaunchedEffect(Unit) {
        WakeWordEventBus.events.collect { hit ->
            if (isProcessing) return@collect
            if (hit.keyword.contains("hey_jarvis", ignoreCase = true)) {
                android.util.Log.i("JARVIS_ENROLLMENT", "wakeWordCallbackReceived=true keyword=${hit.keyword} step=$sampleCount")
                isProcessing = true
                statusText = "Neural Link Established!"
                heardTokens = "MATCH: ${hit.keyword.uppercase()}"
                JarvisAudioSynthesizer.playLeadGlassTone()
                delay(800.milliseconds)

                val fullSamples = WakeWordController.snapshotRecent(16000 * 2)
                android.util.Log.d("JARVIS_ENROLLMENT", "snapshot_samples=${fullSamples.size}")

                val embedding = withContext(Dispatchers.Default) {
                    JarvisSpeakerVerifier.extractEmbedding(context, fullSamples)
                }

                val embeddingNorm = kotlin.math.sqrt(embedding.vector.map { it * it }.sum())
                android.util.Log.d("JARVIS_ENROLLMENT", "sample=$sampleCount embedding_norm=$embeddingNorm vector_size=${embedding.vector.size}")

                if (embedding.vector.isNotEmpty() && embeddingNorm > 0.05f) {
                    capturedEmbeddings.add(embedding)
                    android.util.Log.d("JARVIS_ENROLLMENT", "sampleAccepted=true currentStep=$sampleCount newStep=${sampleCount + 1}")

                    if (sampleCount < 6) {
                        sampleCount++
                        statusText = "Excellent. Again, please."
                        delay(1200)
                        statusText = "Say: \"Hey Jarvis\""
                        heardTokens = ""
                        isProcessing = false
                    } else {
                        statusText = "Calibrating voice profile..."
                        withContext(Dispatchers.Default) {
                            val finalProfile = JarvisSpeakerVerifier.createProfileFromSamples(capturedEmbeddings)
                            JarvisSpeakerVerifier.saveVoiceProfile(context, finalProfile)
                        }
                        delay(400)
                        onNext()
                    }
                } else {
                    android.util.Log.w("JARVIS_ENROLLMENT", "sampleRejected=true sample=$sampleCount embedding_norm=$embeddingNorm - POOR AUDIO QUALITY")
                    statusText = "Audio quality too low. Please try again."
                    delay(1500)
                    statusText = "Say: \"Hey Jarvis\""
                    heardTokens = ""
                    isProcessing = false
                }
            }
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
            Text("Set Up Jarvis", color = Color.White, fontWeight = FontWeight.Bold)
            if (onSkip != null) {
                Text(
                    text = "Skip",
                    color = Color.White.copy(alpha = 0.6f),
                    fontSize = 13.sp,
                    modifier = Modifier.clickable { 
                        onSkip() 
                    }
                )
            } else {
                Icon(Icons.Default.Mic, null, tint = AccentCyan, modifier = Modifier.size(20.dp))
            }
        }

        Spacer(Modifier.height(40.dp))

        Text(
            text = "Step $sampleCount of 6",
            color = Color.White.copy(alpha = 0.5f),
            fontSize = 14.sp,
            fontWeight = FontWeight.Bold
        )

        Spacer(Modifier.weight(1f))

        Text(
            text = statusText,
            color = Color.White,
            fontSize = 24.sp,
            fontWeight = FontWeight.Black,
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(horizontal = 24.dp)
        )

        if (heardTokens.isNotEmpty()) {
            Spacer(Modifier.height(8.dp))
            Text(
                text = heardTokens,
                color = AccentCyan.copy(alpha = 0.7f),
                fontSize = 12.sp,
                fontFamily = FontFamily.Monospace,
                fontWeight = FontWeight.Bold
            )
        }

        Spacer(Modifier.height(32.dp))

        LifeOSOrb(size = 180.dp, state = if (currentRms > 0.01 && !isProcessing) "listening" else "idle")

        Spacer(Modifier.weight(1f))

        SoundWaveVisualizer(rms = currentRms, isListening = !isProcessing)

        Spacer(Modifier.height(24.dp))

        Text(
            text = "Speak clearly in your natural voice.",
            color = Color.White.copy(alpha = 0.4f),
            fontSize = 12.sp,
            textAlign = TextAlign.Center
        )

        Spacer(Modifier.height(40.dp))
    }
}

@Composable
fun SoundWaveVisualizer(rms: Double, isListening: Boolean) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(50.dp),
        horizontalArrangement = Arrangement.Center,
        verticalAlignment = Alignment.CenterVertically
    ) {
        val barsCount = 15
        val random = remember { java.util.Random() }
        repeat(barsCount) { i ->
            val factor = if (isListening) (rms * 12).coerceIn(0.08, 1.0) else 0.08
            val heightAnim by animateDpAsState(
                targetValue = (factor * (16 + random.nextInt(32))).dp,
                animationSpec = spring(stiffness = Spring.StiffnessVeryLow),
                label = "wave_bar_$i"
            )
            Box(
                modifier = Modifier
                    .padding(horizontal = 3.dp)
                    .width(4.dp)
                    .height(heightAnim)
                    .clip(CircleShape)
                    .background(
                        Brush.verticalGradient(
                            colors = listOf(AccentCyan, AccentViolet)
                        )
                    )
            )
        }
    }
}
