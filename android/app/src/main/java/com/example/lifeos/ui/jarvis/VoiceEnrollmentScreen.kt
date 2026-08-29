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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
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
import com.example.lifeos.jarvis.service.JarvisWakeWordService
import com.example.lifeos.jarvis.speaker.JarvisSpeakerVerifier
import com.example.lifeos.jarvis.speaker.SpeakerEmbedding
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
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
                1 -> WakeWordEnrollmentStep(
                    onNext = { currentStep = 2 },
                    onSkip = handleSkip
                )
                2 -> WakeWordResultScreen(
                    onFinish = {
                        JarvisPrefs.setWakeWordSetupState(context, WakeWordSetupState.COMPLETED)
                        JarvisPrefs.setListenEnabled(context, true)
                        
                        // Automatically start the service
                        val startIntent = Intent(context, JarvisWakeWordService::class.java).apply {
                            action = JarvisWakeWordService.ACTION_START
                        }
                        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                            context.startForegroundService(startIntent)
                        } else {
                            context.startService(startIntent)
                        }
                        onFinish()
                    },
                    onReEnroll = {
                        currentStep = 1
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
    var isProcessing by remember { mutableStateOf(false) }
    var enrollmentState by remember { mutableStateOf(com.example.lifeos.jarvis.prefs.VoiceEnrollmentState.NOT_STARTED) }
    val scope = rememberCoroutineScope()

    val capturedEmbeddings = remember { mutableStateListOf<SpeakerEmbedding>() }

    // Simple VAD logic state variables
    var isSpeaking by remember { mutableStateOf(false) }
    var silenceStart by remember { mutableLongStateOf(0L) }

    val audioManager = remember { com.example.lifeos.jarvis.audio.JarvisAudioManager(context) }

    DisposableEffect(Unit) {
        enrollmentState = com.example.lifeos.jarvis.prefs.VoiceEnrollmentState.RECORDING
        android.util.Log.d("ENROLLMENT", "Starting enrollment audio capture")
        audioManager.start(stage = "ENROLLMENT") { _, _, rms ->
            if (isProcessing) return@start
            currentRms = rms
            
            // Diagnostic logging
            android.util.Log.d("ENROLLMENT", "RMS: $rms, isSpeaking: $isSpeaking, sampleCount: $sampleCount")
            
            // Voice Activity Detection: If audio signal crosses threshold, user is speaking
            // Increased threshold to avoid background noise triggering detection
            if (rms > 0.01) {
                if (!isSpeaking) {
                    android.util.Log.d("ENROLLMENT", "Speech detected (RMS: $rms)")
                }
                isSpeaking = true
                silenceStart = 0L
            } else if (isSpeaking) {
                if (silenceStart == 0L) {
                    silenceStart = System.currentTimeMillis()
                    android.util.Log.d("ENROLLMENT", "Silence detected, starting timer")
                }
                // If the user remains silent for 800ms after speaking, process the sample
                if (System.currentTimeMillis() - silenceStart > 800) {
                    android.util.Log.d("ENROLLMENT", "Processing sample after silence")
                    isProcessing = true
                    enrollmentState = com.example.lifeos.jarvis.prefs.VoiceEnrollmentState.PROCESSING
                    scope.launch(Dispatchers.Main) {
                        statusText = "Processing sample..."
                        JarvisAudioSynthesizer.playLeadGlassTone()
                        delay(600.milliseconds) // allow tone to complete
                        
                        val samples = audioManager.snapshotRecent(16000 * 2) // Last 2 seconds
                        val rmsCheck = calculateRms(samples)
                        android.util.Log.d("ENROLLMENT", "Sample RMS check: $rmsCheck, sample size: ${samples.size}")
                        
                        if (rmsCheck < 0.0005f) {
                            android.util.Log.d("ENROLLMENT", "Sample too quiet: $rmsCheck")
                            enrollmentState = com.example.lifeos.jarvis.prefs.VoiceEnrollmentState.FAILED
                            statusText = "Sample too quiet, try again."
                            delay(1500)
                            statusText = "Say: \"Hey Jarvis\""
                            isSpeaking = false
                            silenceStart = 0L
                            isProcessing = false
                            enrollmentState = com.example.lifeos.jarvis.prefs.VoiceEnrollmentState.RECORDING
                        } else if (samples.size < 12000) {
                            android.util.Log.d("ENROLLMENT", "Sample too short: ${samples.size}")
                            enrollmentState = com.example.lifeos.jarvis.prefs.VoiceEnrollmentState.FAILED
                            statusText = "Recording too short, try again."
                            delay(1500)
                            statusText = "Say: \"Hey Jarvis\""
                            isSpeaking = false
                            silenceStart = 0L
                            isProcessing = false
                            enrollmentState = com.example.lifeos.jarvis.prefs.VoiceEnrollmentState.RECORDING
                        } else {
                            android.util.Log.d("ENROLLMENT", "Sample accepted, extracting embedding")
                            // Extract ONNX embedding vector on background thread to prevent UI freezing
                            val embedding = kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.Default) {
                                JarvisSpeakerVerifier.extractEmbedding(context, samples)
                            }
                            capturedEmbeddings.add(embedding)
                            android.util.Log.d("ENROLLMENT", "Embedding extracted, sample count: $sampleCount")
                            
                            if (sampleCount < 5) {
                                sampleCount++
                                statusText = "Perfect! Say it again."
                                delay(1200)
                                statusText = "Say: \"Hey Jarvis\""
                                isSpeaking = false
                                silenceStart = 0L
                                isProcessing = false
                                enrollmentState = com.example.lifeos.jarvis.prefs.VoiceEnrollmentState.RECORDING
                            } else {
                                enrollmentState = com.example.lifeos.jarvis.prefs.VoiceEnrollmentState.ENROLLED
                                statusText = "Saving voice profile..."
                                android.util.Log.d("ENROLLMENT", "Saving voice profile with ${capturedEmbeddings.size} embeddings")
                                
                                // Explicitly stop audio recording BEFORE transitioning to prevent AudioRecord collision
                                audioManager.stop()
                                
                                kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.Default) {
                                    val finalProfile = JarvisSpeakerVerifier.createProfileFromSamples(capturedEmbeddings)
                                    JarvisSpeakerVerifier.saveVoiceProfile(context, finalProfile)
                                }
                                delay(400)
                                onNext()
                            }
                        }
                    }
                }
            }
        }
        onDispose {
            android.util.Log.d("ENROLLMENT", "Stopping enrollment audio capture (onDispose)")
            audioManager.stop()
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
                        audioManager.stop()
                        onSkip() 
                    }
                )
            } else {
                Icon(Icons.Default.Mic, null, tint = AccentCyan, modifier = Modifier.size(20.dp))
            }
        }

        Spacer(Modifier.height(40.dp))

        Text(
            text = "Step $sampleCount of 5",
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

private fun calculateRms(samples: ShortArray): Float {
    var sum = 0.0
    for (s in samples) {
        val normalized = s.toDouble() / 32768.0
        sum += normalized * normalized
    }
    return kotlin.math.sqrt(sum / samples.size).toFloat()
}

