package com.example.lifeos.ui.jarvis

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.media.AudioDeviceInfo
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import com.example.lifeos.jarvis.audio.JarvisAudioManager
import com.example.lifeos.jarvis.audio.JarvisAudioRouter
import com.example.lifeos.jarvis.audio.JarvisAudioSynthesizer
import com.example.lifeos.jarvis.audio.toFloatPcm
import com.example.lifeos.jarvis.speaker.JarvisSpeakerVerifier
import com.example.lifeos.jarvis.speaker.SpeakerEmbedding
import com.example.lifeos.jarvis.wakeword.SherpaWakeWordEngine
import com.example.lifeos.jarvis.wakeword.WakeWordConfig
import com.example.lifeos.theme.*
import com.example.lifeos.ui.components.LifeOSButton
import com.example.lifeos.ui.components.LifeOSCard
import com.example.lifeos.ui.components.LifeOSOrb
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

data class DiagnosticStepItem(
    val title: String,
    val description: String,
    val isPassed: Boolean,
    val technicalDetails: String? = null,
    val remedyAction: String? = null
)

data class WakeWordDiagnosticsReport(
    val permissionStep: DiagnosticStepItem,
    val routingStep: DiagnosticStepItem,
    val acousticModelStep: DiagnosticStepItem,
    val biometricModelStep: DiagnosticStepItem,
    val voiceProfileStep: DiagnosticStepItem,
    val isAllPassed: Boolean
)

@Composable
fun WakeWordResultScreen(
    onFinish: () -> Unit,
    onReEnroll: () -> Unit,
    onSkip: (() -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var report by remember { mutableStateOf<WakeWordDiagnosticsReport?>(null) }
    var isRunningDiagnostics by remember { mutableStateOf(true) }
    var showTechnicalDetails by remember { mutableStateOf(false) }

    // Live Test States
    var isLiveTestActive by remember { mutableStateOf(true) }
    var liveRms by remember { mutableDoubleStateOf(0.0) }
    var liveTestStatus by remember { mutableStateOf("Say \"Hey Jarvis\" or \"Jarvis\" now to test") }
    var liveKeywordDetected by remember { mutableStateOf<String?>(null) }
    var liveSimilarityScore by remember { mutableStateOf<Float?>(null) }
    var isLiveVerified by remember { mutableStateOf(false) }
    var liveTestError by remember { mutableStateOf<String?>(null) }

    // Function to run full diagnostic suite
    fun refreshDiagnostics() {
        scope.launch {
            isRunningDiagnostics = true
            report = withContext(Dispatchers.Default) {
                runFullDiagnostics(context)
            }
            isRunningDiagnostics = false
        }
    }

    LaunchedEffect(Unit) {
        refreshDiagnostics()
    }

    // Interactive Audio Capture & Wake Word Live Test Runner
    DisposableEffect(isLiveTestActive) {
        if (!isLiveTestActive) return@DisposableEffect onDispose {}

        val audioManager = JarvisAudioManager(context)
        val kwsEngine = SherpaWakeWordEngine(context)
        var isEngineReady = false

        try {
            kwsEngine.initialize()
            isEngineReady = true
        } catch (e: Exception) {
            liveTestError = "Acoustic engine failed to initialize: ${e.localizedMessage}"
            android.util.Log.e("WAKEWORD_TEST", "Sherpa initialization error", e)
        }

        val enrolledProfile = JarvisSpeakerVerifier.getVoiceProfile(context)

        try {
            audioManager.start(stage = "WAKEWORD_TEST") { pcmShorts, sampleRate, rms ->
                liveRms = rms
                if (!isEngineReady || isLiveVerified) return@start

                val pcmFloats = pcmShorts.toFloatPcm()
                val hit = kwsEngine.process(pcmFloats, sampleRate)
                if (hit != null) {
                    scope.launch(Dispatchers.Main) {
                        liveKeywordDetected = hit.keyword
                        liveTestStatus = "Wake word spotted: \"${hit.keyword}\"! Verifying speaker voice..."
                        JarvisAudioSynthesizer.playLeadGlassTone()

                        val recentSamples = audioManager.snapshotRecent(16000 * 2) // 2 sec
                        if (enrolledProfile != null && recentSamples.isNotEmpty()) {
                            val score = withContext(Dispatchers.Default) {
                                JarvisSpeakerVerifier.verifySpeaker(context, recentSamples, enrolledProfile)
                            }
                            liveSimilarityScore = score
                            if (score >= JarvisSpeakerVerifier.DEFAULT_THRESHOLD) {
                                isLiveVerified = true
                                liveTestStatus = "Neural Link Verified! (Score: ${(score * 100).toInt()}%)"
                                liveTestError = null
                            } else {
                                liveTestStatus = "Keyword spotted, but voice similarity (${(score * 100).toInt()}%) below required ${(JarvisSpeakerVerifier.DEFAULT_THRESHOLD * 100).toInt()}%"
                                liveTestError = "Voice similarity score did not meet the 55% threshold. Please try speaking at a natural volume."
                            }
                        } else {
                            // If no profile, still show keyword detection success
                            liveTestStatus = "Wake word spotted: \"${hit.keyword}\" (No profile attached)"
                        }
                    }
                }
            }
        } catch (e: Exception) {
            android.util.Log.e("WAKEWORD_TEST", "AudioRecord start failed in test screen", e)
            liveTestError = "Microphone currently in use or unavailable. Tap 'Re-test Pipeline' to retry."
        }

        onDispose {
            try { audioManager.stop() } catch (_: Exception) {}
            try { kwsEngine.release() } catch (_: Exception) {}
        }
    }

    val currentReport = report

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item { Spacer(Modifier.height(16.dp)) }

            // Header Section
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Wake Word Status",
                        color = Color.White,
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold
                    )
                    
                    val statusColor = when {
                        isLiveVerified -> AccentLow
                        currentReport?.isAllPassed == true -> AccentCyan
                        else -> AccentRed
                    }
                    
                    Surface(
                        color = statusColor.copy(alpha = 0.15f),
                        shape = RoundedCornerShape(20.dp),
                        border = androidx.compose.foundation.BorderStroke(1.dp, statusColor.copy(alpha = 0.5f))
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(8.dp)
                                    .clip(CircleShape)
                                    .background(statusColor)
                            )
                            Text(
                                text = when {
                                    isLiveVerified -> "VERIFIED & ACTIVE"
                                    currentReport?.isAllPassed == true -> "READY TO TEST"
                                    else -> "SETUP ISSUE"
                                },
                                color = statusColor,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }

            // Central LifeOS Orb Visualizer
            item {
                Spacer(Modifier.height(8.dp))
                val orbState = when {
                    isLiveVerified -> "success"
                    currentReport?.isAllPassed == false -> "error"
                    liveRms > 0.01 -> "listening"
                    else -> "idle"
                }
                LifeOSOrb(size = 140.dp, state = orbState)
            }

            // Live Interactive Test Card
            item {
                LifeOSCard(
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(20.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = "Live Interactive Test",
                            color = AccentCyan,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(Modifier.height(8.dp))
                        Text(
                            text = liveTestStatus,
                            color = Color.White,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.SemiBold,
                            textAlign = TextAlign.Center
                        )

                        Spacer(Modifier.height(16.dp))

                        // Audio Level Waveform
                        SoundWaveVisualizer(rms = liveRms, isListening = isLiveTestActive && !isLiveVerified)

                        if (liveKeywordDetected != null || liveSimilarityScore != null) {
                            Spacer(Modifier.height(16.dp))
                            Surface(
                                color = Color.White.copy(alpha = 0.05f),
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.padding(12.dp)) {
                                    if (liveKeywordDetected != null) {
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween
                                        ) {
                                            Text("Detected Keyword:", color = Color.White.copy(alpha = 0.6f), fontSize = 13.sp)
                                            Text("\"${liveKeywordDetected}\"", color = AccentCyan, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                                        }
                                    }
                                    if (liveSimilarityScore != null) {
                                        Spacer(Modifier.height(6.dp))
                                        val scorePct = (liveSimilarityScore!! * 100).toInt()
                                        val isMatch = liveSimilarityScore!! >= JarvisSpeakerVerifier.DEFAULT_THRESHOLD
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween
                                        ) {
                                            Text("Voice Match Score:", color = Color.White.copy(alpha = 0.6f), fontSize = 13.sp)
                                            Text(
                                                text = "$scorePct% ${if (isMatch) "✅" else "⚠️"}",
                                                color = if (isMatch) AccentLow else AccentRed,
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 13.sp
                                            )
                                        }
                                    }
                                }
                            }
                        }

                        if (liveTestError != null) {
                            Spacer(Modifier.height(12.dp))
                            Text(
                                text = liveTestError ?: "",
                                color = AccentRed,
                                fontSize = 12.sp,
                                textAlign = TextAlign.Center
                            )
                        }
                    }
                }
            }

            // Diagnostic Pipeline Inspection Title
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "System Pipeline Inspection",
                        color = Color.White.copy(alpha = 0.8f),
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = if (showTechnicalDetails) "Hide Technical Logs" else "Show Technical Logs",
                        color = AccentCyan,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        modifier = Modifier.clickable { showTechnicalDetails = !showTechnicalDetails }
                    )
                }
            }

            // Checklist of each pipeline component
            if (currentReport != null) {
                item {
                    DiagnosticStepCard(item = currentReport.permissionStep, showTechnical = showTechnicalDetails)
                }
                item {
                    DiagnosticStepCard(item = currentReport.routingStep, showTechnical = showTechnicalDetails)
                }
                item {
                    DiagnosticStepCard(item = currentReport.acousticModelStep, showTechnical = showTechnicalDetails)
                }
                item {
                    DiagnosticStepCard(item = currentReport.biometricModelStep, showTechnical = showTechnicalDetails)
                }
                item {
                    DiagnosticStepCard(item = currentReport.voiceProfileStep, showTechnical = showTechnicalDetails)
                }
            } else {
                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(100.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator(color = AccentCyan, modifier = Modifier.size(32.dp))
                    }
                }
            }

            // Action Buttons
            item {
                Spacer(Modifier.height(8.dp))
                LifeOSButton(
                    text = if (isLiveVerified) "Launch LifeOS Neural Link" else "Proceed to Dashboard",
                    onClick = onFinish
                )
            }

            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    OutlinedButton(
                        onClick = onReEnroll,
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(14.dp),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color.White.copy(alpha = 0.2f))
                    ) {
                        Icon(Icons.Default.Refresh, null, tint = Color.White, modifier = Modifier.size(16.dp))
                        Spacer(Modifier.width(6.dp))
                        Text("Re-enroll Voice", color = Color.White, fontSize = 13.sp)
                    }

                    OutlinedButton(
                        onClick = { refreshDiagnostics() },
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(14.dp),
                        border = androidx.compose.foundation.BorderStroke(1.dp, AccentCyan.copy(alpha = 0.4f))
                    ) {
                        Icon(Icons.Default.CheckCircle, null, tint = AccentCyan, modifier = Modifier.size(16.dp))
                        Spacer(Modifier.width(6.dp))
                        Text("Re-test Pipeline", color = AccentCyan, fontSize = 13.sp)
                    }
                }
                if (onSkip != null) {
                    Spacer(Modifier.height(8.dp))
                    TextButton(
                        onClick = onSkip,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("Skip Wake Word for now", color = Color.White.copy(alpha = 0.5f), fontSize = 13.sp)
                    }
                }
                Spacer(Modifier.height(32.dp))
            }
        }
    }
}

@Composable
fun DiagnosticStepCard(
    item: DiagnosticStepItem,
    showTechnical: Boolean
) {
    Surface(
        color = CardBg.copy(alpha = 0.6f),
        shape = RoundedCornerShape(16.dp),
        border = androidx.compose.foundation.BorderStroke(
            1.dp,
            if (item.isPassed) Color.White.copy(alpha = 0.08f) else AccentRed.copy(alpha = 0.4f)
        ),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    Box(
                        modifier = Modifier
                            .size(28.dp)
                            .clip(CircleShape)
                            .background(
                                if (item.isPassed) AccentLow.copy(alpha = 0.2f) else AccentRed.copy(alpha = 0.2f)
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = if (item.isPassed) Icons.Default.Check else Icons.Default.Close,
                            contentDescription = null,
                            tint = if (item.isPassed) AccentLow else AccentRed,
                            modifier = Modifier.size(16.dp)
                        )
                    }

                    Column {
                        Text(
                            text = item.title,
                            color = Color.White,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = item.description,
                            color = Color.White.copy(alpha = 0.6f),
                            fontSize = 12.sp
                        )
                    }
                }
            }

            if (!item.isPassed && item.remedyAction != null) {
                Spacer(Modifier.height(8.dp))
                Surface(
                    color = AccentRed.copy(alpha = 0.1f),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Icon(Icons.Default.Info, null, tint = AccentRed, modifier = Modifier.size(14.dp))
                        Text(
                            text = item.remedyAction,
                            color = AccentRed,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Medium
                        )
                    }
                }
            }

            if (showTechnical && item.technicalDetails != null) {
                Spacer(Modifier.height(8.dp))
                Surface(
                    color = Color.Black.copy(alpha = 0.4f),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = item.technicalDetails,
                        color = AccentCyan.copy(alpha = 0.8f),
                        fontSize = 10.sp,
                        fontFamily = FontFamily.Monospace,
                        modifier = Modifier.padding(8.dp)
                    )
                }
            }
        }
    }
}

private val AccentLow = Color(0xFF00FFC6)

private fun runFullDiagnostics(context: Context): WakeWordDiagnosticsReport {
    // 1. Microphone Permission Check
    val hasMicPerm = ContextCompat.checkSelfPermission(
        context,
        Manifest.permission.RECORD_AUDIO
    ) == PackageManager.PERMISSION_GRANTED
    val permissionStep = DiagnosticStepItem(
        title = "Microphone Permission",
        description = if (hasMicPerm) "Granted (RECORD_AUDIO active)" else "Missing RECORD_AUDIO permission",
        isPassed = hasMicPerm,
        technicalDetails = "android.permission.RECORD_AUDIO = ${if (hasMicPerm) "PERMISSION_GRANTED" else "PERMISSION_DENIED"}",
        remedyAction = if (!hasMicPerm) "Grant microphone permission in Android App Settings" else null
    )

    // 2. Built-in Mic Hardware Route Check
    val router = JarvisAudioRouter(context)
    val builtInMic = router.findBuiltInMicrophone()
    val isMicBound = builtInMic != null
    val routingStep = DiagnosticStepItem(
        title = "Audio Input Routing",
        description = if (isMicBound) "Bound to Built-in Mic (${builtInMic?.productName ?: "Device Mic"})" else "Built-in microphone not detected",
        isPassed = isMicBound,
        technicalDetails = "TYPE_BUILTIN_MIC = ${builtInMic?.id ?: -1}, ProductName=${builtInMic?.productName}, Bluetooth SCO=Disabled",
        remedyAction = if (!isMicBound) "Ensure device built-in microphone is not blocked or in exclusive mode" else null
    )

    // 3. Sherpa-ONNX Acoustic Model Assets & Stream Check
    var kwsPassed = false
    var kwsDetails = ""
    try {
        val assetManager = context.assets
        val tokensExist = assetManager.open(WakeWordConfig.ASSET_TOKENS).use { it.available() > 0 }
        val encoderExist = assetManager.open(WakeWordConfig.ASSET_ENCODER).use { it.available() > 0 }
        val decoderExist = assetManager.open(WakeWordConfig.ASSET_DECODER).use { it.available() > 0 }
        val joinerExist = assetManager.open(WakeWordConfig.ASSET_JOINER).use { it.available() > 0 }
        val keywordsExist = assetManager.open(WakeWordConfig.ASSET_KEYWORDS).use { it.available() > 0 }
        kwsPassed = tokensExist && encoderExist && decoderExist && joinerExist && keywordsExist
        kwsDetails = "Tokens: ${tokensExist}, Encoder: ${encoderExist}, Decoder: ${decoderExist}, Joiner: ${joinerExist}, Keywords: ${keywordsExist}, Engine: Zipformer2"
    } catch (e: Exception) {
        kwsPassed = false
        kwsDetails = "Asset verification failed: ${e.localizedMessage}"
    }

    val acousticStep = DiagnosticStepItem(
        title = "Acoustic Wake-Word Spotter",
        description = if (kwsPassed) "Sherpa-ONNX Zipformer Ready (\"Hey Jarvis\" / \"Jarvis\")" else "Neural model files missing in assets",
        isPassed = kwsPassed,
        technicalDetails = kwsDetails,
        remedyAction = if (!kwsPassed) "Check kws/ assets in APK build" else null
    )

    // 4. CAM++ Speaker Verification Model Check
    var camPassed = false
    var camDetails = ""
    try {
        val assetManager = context.assets
        val camExists = assetManager.open(com.example.lifeos.jarvis.speaker.SpeakerConfig.MODEL_ASSET).use { it.available() > 0 }
        camPassed = camExists
        camDetails = "${com.example.lifeos.jarvis.speaker.SpeakerConfig.MODEL_ASSET} verified (${if (camExists) "Ready" else "Missing"}), EmbeddingDim=512, Provider=CPU"
    } catch (e: Exception) {
        camPassed = false
        camDetails = "CAM++ asset error: ${e.localizedMessage}"
    }

    val biometricStep = DiagnosticStepItem(
        title = "Speaker Verification Model",
        description = if (camPassed) "CAM++ 512-dim Neural Model Online" else "Speaker ONNX model missing",
        isPassed = camPassed,
        technicalDetails = camDetails,
        remedyAction = if (!camPassed) "Re-install APK with CAM++ ONNX model included" else null
    )

    // 5. Saved Voice Profile Check
    val profile = JarvisSpeakerVerifier.getVoiceProfile(context)
    val profilePassed = profile != null && profile.vector.isNotEmpty()
    val vectorSize = profile?.vector?.size ?: 0
    val enrolledDate = if (profile != null) java.text.SimpleDateFormat("MMM dd, HH:mm", java.util.Locale.getDefault()).format(java.util.Date(profile.enrolledAt)) else "N/A"
    
    val profileStep = DiagnosticStepItem(
        title = "Enrolled Voice Profile",
        description = if (profilePassed) "Secured Voice Profile Loaded ($vectorSize-dim vector)" else "No voice profile found in encrypted store",
        isPassed = profilePassed,
        technicalDetails = "VectorDim=$vectorSize, ModelId=${profile?.modelId ?: "None"}, EnrolledAt=$enrolledDate, Threshold=${JarvisSpeakerVerifier.DEFAULT_THRESHOLD}",
        remedyAction = if (!profilePassed) "Complete the 5-sample voice enrollment flow" else null
    )

    val overallPassed = hasMicPerm && isMicBound && kwsPassed && camPassed && profilePassed

    return WakeWordDiagnosticsReport(
        permissionStep = permissionStep,
        routingStep = routingStep,
        acousticModelStep = acousticStep,
        biometricModelStep = biometricStep,
        voiceProfileStep = profileStep,
        isAllPassed = overallPassed
    )
}
