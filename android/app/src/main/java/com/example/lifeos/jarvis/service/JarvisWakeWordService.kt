package com.example.lifeos.jarvis.service

import android.app.AlarmManager
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import android.os.SystemClock
import android.util.Log
import androidx.core.app.NotificationCompat
import com.example.lifeos.MainActivity
import com.example.lifeos.jarvis.JarvisController
import com.example.lifeos.jarvis.JarvisState
import com.example.lifeos.jarvis.audio.JarvisAudioManager
import com.example.lifeos.jarvis.audio.toFloatPcm
import com.example.lifeos.jarvis.command.DeferredJarvisCommandProcessor
import com.example.lifeos.jarvis.command.JarvisCommandListener
import com.example.lifeos.jarvis.logging.JarvisLog
import com.example.lifeos.jarvis.navigation.JarvisNavigationManager
import com.example.lifeos.jarvis.prefs.JarvisPrefs
import com.example.lifeos.jarvis.speaker.JarvisSpeakerVerifier
import com.example.lifeos.jarvis.wakeword.SherpaWakeWordEngine
import com.example.lifeos.jarvis.wakeword.WakeWordConfig
import com.example.lifeos.jarvis.wakeword.WakeWordController
import com.example.lifeos.jarvis.wakeword.WakeWordEventBus
import com.example.lifeos.jarvis.wakeword.WakeWordHit
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch
import kotlinx.coroutines.flow.MutableStateFlow
import android.graphics.PixelFormat
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.view.Gravity
import android.view.WindowManager
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.*
import androidx.savedstate.SavedStateRegistry
import androidx.savedstate.SavedStateRegistryController
import androidx.savedstate.SavedStateRegistryOwner
import androidx.savedstate.setViewTreeSavedStateRegistryOwner

import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import java.util.Locale
import io.ktor.client.*
import io.ktor.client.engine.okhttp.*
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import java.io.File
import java.io.FileOutputStream
import android.media.ToneGenerator
import android.media.AudioManager
import android.media.AudioAttributes
import android.media.MediaPlayer
import com.example.lifeos.jarvis.audio.JarvisAudioSynthesizer
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.material.icons.outlined.NotificationsActive
import com.example.lifeos.BuildConfig

class JarvisWakeWordService : Service(), LifecycleOwner, ViewModelStoreOwner, SavedStateRegistryOwner, TextToSpeech.OnInitListener {

    private var tts: TextToSpeech? = null
    private var isTtsReady = false
    private var mediaPlayer: MediaPlayer? = null
    
    private val httpClient = HttpClient(OkHttp)
    private val JARVIS_VOICE_ID = "pNInz6obpgdq514hcHCY"

    private val lifecycleRegistry = LifecycleRegistry(this)
    override val lifecycle: Lifecycle = lifecycleRegistry

    private val _viewModelStore = ViewModelStore()
    override val viewModelStore: ViewModelStore = _viewModelStore

    private val savedStateRegistryController = SavedStateRegistryController.create(this)
    override val savedStateRegistry: SavedStateRegistry = savedStateRegistryController.savedStateRegistry

    private var windowManager: WindowManager? = null
    private var overlayView: ComposeView? = null
    private val isPillVisible = MutableStateFlow(false)

    private val serviceJob = Job()
    private val serviceScope = CoroutineScope(Dispatchers.Default + serviceJob)

    private var wakeWordEngine: SherpaWakeWordEngine? = null
    private var audioManager: JarvisAudioManager? = null
    private var commandListener: JarvisCommandListener? = null
    private var recordingJob: Job? = null
    private var isServiceRunning = false
    private var isDestroying = false
    private var listeningPaused = false
    private var currentSessionId = 0L
    private var currentWakeCycleId = 0L
    private var wakeLock: PowerManager.WakeLock? = null

    companion object {
        const val NOTIFICATION_ID = 1001
        const val CHANNEL_ID = "jarvis_wake_word_channel"
        const val ACTION_START = "com.example.lifeos.jarvis.START"
        const val ACTION_STOP = "com.example.lifeos.jarvis.STOP"
        const val ACTION_REFRESH_SETTINGS = "com.example.lifeos.jarvis.REFRESH_SETTINGS"
        const val ACTION_PAUSE_LISTENING = "com.example.lifeos.jarvis.PAUSE_LISTENING"
        const val ACTION_RESUME_LISTENING = "com.example.lifeos.jarvis.RESUME_LISTENING"
        const val ACTION_PROACTIVE_REMINDER = "com.example.lifeos.jarvis.PROACTIVE_REMINDER"
    }

    private var reminderOverlayView: ComposeView? = null
    private val activeReminderTitle = MutableStateFlow<String?>(null)

    override fun onCreate() {
        super.onCreate()
        savedStateRegistryController.performRestore(null)
        lifecycleRegistry.handleLifecycleEvent(Lifecycle.Event.ON_CREATE)
        isDestroying = false
        
        Log.d("JARVIS", "JarvisWakeWordService onCreate")
        
        // Acquire partial wake lock to keep CPU alive during Doze mode
        // Without this, the audio capture thread gets suspended and wake word stops working
        val pm = getSystemService(POWER_SERVICE) as PowerManager
        wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "LifeOS::JarvisWakeWord").apply {
            setReferenceCounted(false)
            acquire()
        }
        Log.d("JARVIS", "Wake lock acquired")
        
        tts = TextToSpeech(this, this)
        
        createNotificationChannel()
        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager
        
        // Start foreground service immediately for background stability
        startForegroundWithNotification()
        
        Log.d("JARVIS", "Service setup complete")

        // Central Wake-Word Event Collector
        serviceScope.launch {
            com.example.lifeos.jarvis.wakeword.WakeWordEventBus.events.collect { hit ->
                handleWakeWordHit(hit)
            }
        }

        // Global response collector
        serviceScope.launch(Dispatchers.Main) {
            JarvisController.lastResponse.collectLatest { response ->
                if (response != null && JarvisController.shouldSpeakResponse.value) {
                    showVoicePill()
                    speak(response)
                }
            }
        }

        // State-based notification collector
        serviceScope.launch(Dispatchers.Main) {
            JarvisController.state.collectLatest { state ->
                val notificationText = when (state) {
                    is JarvisState.ListeningForWakeWord -> "Listening for Hey Jarvis…"
                    is JarvisState.WakeWordDetected -> "Wake word detected"
                    is JarvisState.VerifyingSpeaker -> "Verifying speaker..."
                    is JarvisState.ListeningForCommand -> "Listening for command..."
                    is JarvisState.Processing -> "Processing..."
                    is JarvisState.Responding -> "Responding..."
                    is JarvisState.Error -> "System Error: ${state.message}"
                    is JarvisState.Disabled -> "Jarvis is offline"
                    else -> "Starting JARVIS..."
                }
                updateNotificationText(notificationText)
            }
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        lifecycleRegistry.handleLifecycleEvent(Lifecycle.Event.ON_START)
        val action = intent?.action
        Log.d("JARVIS", "JarvisWakeWordService onStartCommand action: $action")

        // Ensure foreground service is running for background stability
        startForegroundWithNotification()

        if (action == ACTION_STOP) {
            stopForegroundService()
            return START_NOT_STICKY
        }

        if (action == ACTION_REFRESH_SETTINGS) {
            refreshSettings()
            return START_STICKY
        }

        if (action == ACTION_PAUSE_LISTENING) {
            listeningPaused = true
            stopAudioPipeline()
            JarvisController.updateState(JarvisState.Disabled)
            JarvisController.setAudioPipelineStatus("paused")
            return START_STICKY
        }

        if (action == ACTION_RESUME_LISTENING) {
            listeningPaused = false
            isServiceRunning = true
            startListening()
            return START_STICKY
        }

        if (action == ACTION_PROACTIVE_REMINDER) {
            val title = intent?.getStringExtra("event_title") ?: "Event"
            handleProactiveReminder(title)
            return START_STICKY
        }

        if (action == ACTION_START) {
            if (isServiceRunning && audioManager?.isRunning == true) {
                Log.d("JARVIS", "Service already running and listening, skipping restart")
                updateNotificationText("Listening for Hey Jarvis…")
                return START_STICKY
            }
            isServiceRunning = true
            JarvisController.updateState(JarvisState.Starting)
            startListening()
            return START_STICKY
        }

        // Default start behavior - always start listening if enabled
        val shouldListen = action.isNullOrEmpty() && JarvisPrefs.isListenEnabled(this)
        if (shouldListen) {
            isServiceRunning = true
            JarvisController.updateState(JarvisState.Starting)
            startListening()
        }

        return START_STICKY
    }

    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) {
            tts?.language = Locale.US
            
            val voices = tts?.voices
            Log.d("JARVIS", "Available voices: ${voices?.size}")
            
            // Search for premium British Male voices first, explicitly avoiding female voices
            val preferredVoice = voices?.filter { 
                val name = it.name.lowercase()
                !name.contains("female") && !name.contains("girl") && !name.contains("woman")
            }?.find { 
                val name = it.name.lowercase()
                (name.contains("en-gb") && (name.contains("male") || name.contains("danny") || name.contains("oliver") || name.contains("fis"))) ||
                name.contains("en-us-x-iom") || 
                name.contains("en-us-x-iol")
            } ?: voices?.filter { !it.name.lowercase().contains("female") }
              ?.find { it.name.lowercase().contains("male") }
              ?: voices?.find { it.locale.language == "en" && it.locale.country == "GB" && it.name.lowercase().contains("fis") }
              ?: voices?.find { it.locale.language == "en" && it.locale.country == "GB" }
              ?: voices?.firstOrNull { it.locale.language == "en" }
            
            if (preferredVoice != null) {
                tts?.voice = preferredVoice
                Log.d("JARVIS", "Selected sophisticated voice: ${preferredVoice.name}")
            }

            // JARVIS character recalibration: Deeper and slightly faster for that clinical intelligence feel
            tts?.setPitch(0.70f) 
            tts?.setSpeechRate(1.1f) 

            isTtsReady = true
            tts?.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
                override fun onStart(utteranceId: String?) {
                    JarvisController.setSpeaking(true)
                }

                override fun onDone(utteranceId: String?) {
                    JarvisController.setSpeaking(false)
                    if (utteranceId == "proactive_reminder") {
                        // Optional cleanup
                    }
                }

                override fun onError(utteranceId: String?) {
                    JarvisController.setSpeaking(false)
                }
            })
        }
    }

    private fun speak(text: String) {
        val clean = com.example.lifeos.jarvis.util.JarvisTextSanitizer.cleanForSpeech(text)
        if (clean.isBlank()) return
        Log.d("JARVIS", "Commanded to speak: ${clean.take(50)}...")
        // Reset engine when starting new speech to clear any partial tokens
        wakeWordEngine?.reset()
        
        // Immediate setSpeaking(true) for echo protection
        JarvisController.setSpeaking(true)
        
        val apiKey = BuildConfig.ELEVENLABS_API_KEY
        if (!apiKey.isNullOrBlank() && apiKey != "") {
            speakWithElevenLabs(clean)
        } else {
            speakWithSystemTts(clean)
        }
    }

    private fun stopAllSpeech() {
        Log.i("JARVIS", "Stopping all system speech (Barge-in requested)")
        try {
            mediaPlayer?.stop()
            mediaPlayer?.reset()
        } catch (_: Exception) {}
        
        try {
            tts?.stop()
        } catch (_: Exception) {}
        
        JarvisController.stopMessage()
        JarvisController.setSpeaking(false)
    }

    private fun speakWithElevenLabs(text: String) {
        serviceScope.launch {
            try {
                JarvisController.setSpeaking(true)
                val requestBody = org.json.JSONObject().apply {
                    put("text", text)
                    put("model_id", "eleven_turbo_v2_5")
                }.toString()

                val response = httpClient.post("https://api.elevenlabs.io/v1/text-to-speech/$JARVIS_VOICE_ID") {
                    header("xi-api-key", BuildConfig.ELEVENLABS_API_KEY)
                    contentType(ContentType.Application.Json)
                    setBody(requestBody)
                }

                if (response.status == HttpStatusCode.OK) {
                    val bytes = response.readBytes()
                    val tempFile = File(cacheDir, "jarvis_voice.mp3")
                    FileOutputStream(tempFile).use { it.write(bytes) }
                    
                    launch(Dispatchers.Main) {
                        playAudioFile(tempFile)
                    }
                } else {
                    Log.w("JARVIS", "ElevenLabs failed: ${response.status}. Falling back.")
                    speakWithSystemTts(text)
                }
            } catch (e: Exception) {
                Log.e("JARVIS", "ElevenLabs error", e)
                speakWithSystemTts(text)
            }
        }
    }

    private fun playAudioFile(file: File) {
        mediaPlayer?.stop()
        mediaPlayer?.release()
        
        mediaPlayer = MediaPlayer().apply {
            setDataSource(file.absolutePath)
            setAudioAttributes(
                AudioAttributes.Builder()
                    .setUsage(if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) AudioAttributes.USAGE_ASSISTANT else AudioAttributes.USAGE_VOICE_COMMUNICATION)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                    .build()
            )
            setOnCompletionListener { 
                JarvisController.setSpeaking(false)
            }
            prepare()
            start()
        }
    }

    private fun speakWithSystemTts(text: String) {
        if (isTtsReady) {
            Log.d("JARVIS", "Speaking with system TTS: $text")
            val id = if (text.contains("15 minutes")) "proactive_reminder" else "jarvis_response"
            tts?.speak(text, TextToSpeech.QUEUE_FLUSH, null, id)
        } else {
            Log.w("JARVIS", "TTS not ready yet.")
        }
    }

    private fun handleProactiveReminder(eventTitle: String) {
        serviceScope.launch(Dispatchers.Main) {
            // 1. Play Opening Tone (Premium Lead Glass - 3.0s)
            JarvisAudioSynthesizer.playLeadGlassTone()
            
            // 2. 0.5 sec gap after tone finishes (3.0s + 0.5s)
            delay(3500)

            // 3. Show Overlay
            showReminderPill(eventTitle)

            // 4. Speak
            val title = if (System.currentTimeMillis() % 2 == 0L) "Sir" else "Boss"
            val text = "Pardon the interruption, $title. You have $eventTitle in 15 minutes."
            speak(text)
        }
    }

    private fun showReminderPill(eventTitle: String) {
        if (!Settings.canDrawOverlays(this)) {
            Log.w("JARVIS", "Cannot show reminder pill: Permission 'Display over other apps' is missing.")
            return
        }
        if (reminderOverlayView != null) {
            Log.d("JARVIS", "Reminder pill already visible, skipping")
            return
        }

        Log.d("JARVIS", "Showing reminder pill for: $eventTitle")

        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            else
                WindowManager.LayoutParams.TYPE_PHONE,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.CENTER_HORIZONTAL
            y = 100
        }

        reminderOverlayView = ComposeView(this).apply {
            setViewTreeLifecycleOwner(this@JarvisWakeWordService)
            setViewTreeViewModelStoreOwner(this@JarvisWakeWordService)
            setViewTreeSavedStateRegistryOwner(this@JarvisWakeWordService)

            setContent {
                var visible by remember { mutableStateOf(false) }
                LaunchedEffect(Unit) {
                    visible = true
                    delay(5000)
                    visible = false
                    delay(500)
                    removeReminderPill()
                }

                ReminderPillOverlay(visible = visible, title = eventTitle)
            }
        }

        windowManager?.addView(reminderOverlayView, params)
    }

    private fun removeReminderPill() {
        reminderOverlayView?.let {
            windowManager?.removeView(it)
            reminderOverlayView = null
        }
    }

    private fun startListening() {
        if (listeningPaused) {
            Log.d("JARVIS", "startListening: ignored because listening is paused")
            return
        }
        if (!JarvisPrefs.isListenEnabled(this)) {
            Log.d("JARVIS", "startListening: ignored because listening is disabled in prefs")
            return
        }
        if (androidx.core.content.ContextCompat.checkSelfPermission(this, android.Manifest.permission.RECORD_AUDIO) != android.content.pm.PackageManager.PERMISSION_GRANTED) {
            Log.w("JARVIS", "startListening: RECORD_AUDIO permission missing")
            return
        }
        Log.i("JARVIS", "[JARVIS_WAKEWORD_SERVICE] Starting WakeWordController")
        
        // Ensure wake lock is held
        val pm = getSystemService(POWER_SERVICE) as PowerManager
        if (wakeLock == null || !wakeLock!!.isHeld) {
            wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "LifeOS::JarvisWakeWord").apply {
                setReferenceCounted(false)
                acquire()
            }
            Log.d("JARVIS", "Wake lock reacquired")
        }
        
        WakeWordController.startListening(this)
        JarvisController.updateState(JarvisState.ListeningForWakeWord)
        JarvisController.setAudioPipelineStatus("listening")
        updateNotificationText("Listening for Hey Jarvis…")
    }

    private fun handleWakeWordHit(hit: WakeWordHit) {
        val pcm = WakeWordController.snapshotRecent(16000 * 2)
        serviceScope.launch(Dispatchers.Default) {
            JarvisController.updateState(JarvisState.WakeWordDetected(hit.confidence))
            updateNotificationText("Wake word detected")

            val verificationEnabled = JarvisSpeakerVerifier.isSpeakerVerificationEnabled(this@JarvisWakeWordService)
            if (!verificationEnabled) {
                activateJarvis()
                return@launch
            }

            val enrolled = JarvisSpeakerVerifier.getVoiceProfile(this@JarvisWakeWordService)
            if (enrolled == null) {
                JarvisController.updateState(JarvisState.ListeningForWakeWord)
                updateNotificationText("Listening for Hey Jarvis…")
                return@launch
            }

            JarvisController.updateState(JarvisState.VerifyingSpeaker)
            val score = JarvisSpeakerVerifier.verifySpeaker(this@JarvisWakeWordService, pcm, enrolled)
            JarvisController.setLastSpeakerScore(score)
            val isMatch = score >= JarvisSpeakerVerifier.DEFAULT_THRESHOLD

            if (isMatch) {
                activateJarvis()
            } else {
                JarvisController.updateState(JarvisState.ListeningForWakeWord)
                updateNotificationText("Listening for Hey Jarvis…")
            }
        }
    }

    private fun activateJarvis() {
        WakeWordController.pauseForVoiceSession()
        JarvisController.updateState(JarvisState.ListeningForCommand)
        updateNotificationText("JARVIS is listening for a command")
        
        // 1. Wake screen if device is locked / asleep
        try {
            val powerManager = getSystemService(POWER_SERVICE) as android.os.PowerManager
            @Suppress("DEPRECATION")
            val screenWakeLock = powerManager.newWakeLock(
                android.os.PowerManager.SCREEN_BRIGHT_WAKE_LOCK or android.os.PowerManager.ACQUIRE_CAUSES_WAKEUP,
                "LifeOS:WakeWordTriggerLock"
            )
            screenWakeLock.acquire(4000)
        } catch (e: Exception) {
            Log.e("JARVIS", "WakeLock acquire error", e)
        }

        // 2. Launch / Bring MainActivity to front seamlessly when locked or closed
        try {
            val launchIntent = Intent(this, com.example.lifeos.MainActivity::class.java).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT or Intent.FLAG_ACTIVITY_SINGLE_TOP)
                action = "com.example.lifeos.ACTION_JARVIS_ACTIVATE"
            }
            startActivity(launchIntent)
        } catch (e: Exception) {
            Log.e("JARVIS", "Launch activity error", e)
        }

        val greeting = if (System.currentTimeMillis() % 2 == 0L) "Yes, Sir?" else "Yes, Boss?"
        serviceScope.launch(Dispatchers.Main) {
            showVoicePill()
            speak(greeting)
            
            // Echo Protection: Wait for greeting to finish before starting STT
            delay(400) 
            val startTime = System.currentTimeMillis()
            while (JarvisController.isSpeaking.value && (System.currentTimeMillis() - startTime < 3000)) {
                delay(100)
            }
            delay(300)

            if (commandListener == null) {
                commandListener = JarvisCommandListener(applicationContext)
            }

            JarvisLog.d("JARVIS_STT_STARTED")
            commandListener?.start(JarvisPrefs.commandTimeoutMs(this@JarvisWakeWordService)) { transcript ->
                serviceScope.launch {
                    if (!transcript.isNullOrBlank()) {
                        JarvisLog.d("JARVIS_COMMAND_RECEIVED", "text=$transcript")
                        JarvisController.updateState(JarvisState.Processing)
                        JarvisController.processQuery(transcript, isVoiceQuery = true)
                        JarvisController.updateState(JarvisState.Responding)
                    } else {
                        JarvisLog.d("JARVIS_COMMAND_EMPTY_OR_TIMEOUT")
                    }
                    
                    // Delay before returning to wakeword capture to avoid self-triggering
                    delay(1_500) 
                    
                    if (isServiceRunning && JarvisPrefs.isListenEnabled(this@JarvisWakeWordService)) {
                        JarvisLog.d("JARVIS_RETURNING_TO_WAKEWORD")
                        JarvisController.updateState(JarvisState.Starting)
                        WakeWordController.resumeFromVoiceSession(this@JarvisWakeWordService)
                    }
                }
            }
        }
    }

    private fun stopAudioPipeline() {
        WakeWordController.stopListening()
        JarvisController.setAudioPipelineStatus("stopped")
        
        // Stop the actual audio capture
        audioManager?.stop()
        audioManager = null
        
        // Release the wake word engine
        wakeWordEngine?.release()
        wakeWordEngine = null
        
        // Cancel recording job
        recordingJob?.cancel()
        recordingJob = null
        
        Log.d("JARVIS", "Audio pipeline stopped completely")
    }

    private fun refreshSettings() {
        val isEnabled = JarvisPrefs.isListenEnabled(this)
        if (isEnabled) {
            // Force re-initialization of engine to pick up new sensitivity/config
            wakeWordEngine?.release()
            wakeWordEngine = null
            isServiceRunning = true
            startListening()
        } else {
            stopAudioPipeline()
            isServiceRunning = false
            JarvisController.updateState(JarvisState.Disabled)
            JarvisLog.d("JARVIS_DEACTIVATED")
        }
    }

    private fun stopForegroundService() {
        if (isDestroying) return  // Guard against re-entrant calls
        isDestroying = true
        JarvisLog.d("JARVIS_DEACTIVATED")
        isServiceRunning = false
        recordingJob?.cancel()
        commandListener?.stop()
        commandListener = null
        stopAudioPipeline()
        wakeWordEngine?.release()
        wakeWordEngine = null
        JarvisController.updateState(JarvisState.Disabled)
        JarvisController.setAudioPipelineStatus("stopped")

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            stopForeground(STOP_FOREGROUND_REMOVE)
        } else {
            @Suppress("DEPRECATION")
            stopForeground(true)
        }
        stopSelf()
    }

    override fun onDestroy() {
        super.onDestroy()
        Log.d("JARVIS", "JarvisWakeWordService onDestroy - isDestroying=$isDestroying")
        
        // Only clean up if not being restarted
        if (!isDestroying) {
            stopAudioPipeline()
        }
        
        tts?.stop()
        tts?.shutdown()
        
        // Release wake lock
        try {
            wakeLock?.release()
            wakeLock = null
            Log.d("JARVIS", "Wake lock released")
        } catch (_: Exception) {}
        
        stopForegroundService()
        lifecycleRegistry.handleLifecycleEvent(Lifecycle.Event.ON_DESTROY)
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onTaskRemoved(rootIntent: Intent?) {
        super.onTaskRemoved(rootIntent)
        Log.d("JARVIS", "JarvisWakeWordService onTaskRemoved. ListeningEnabled=${JarvisPrefs.isListenEnabled(this)}")
        
        // When the app is swiped away, restart the service if listening is enabled
        if (JarvisPrefs.isListenEnabled(this)) {
            try {
                val restartServiceIntent = Intent(applicationContext, JarvisWakeWordService::class.java).apply {
                    action = ACTION_START
                }
                val restartServicePendingIntent = PendingIntent.getService(
                    applicationContext,
                    1001,
                    restartServiceIntent,
                    PendingIntent.FLAG_ONE_SHOT or PendingIntent.FLAG_IMMUTABLE
                )
                val alarmService = getSystemService(ALARM_SERVICE) as AlarmManager
                alarmService.setExactAndAllowWhileIdle(
                    AlarmManager.ELAPSED_REALTIME_WAKEUP,
                    SystemClock.elapsedRealtime() + 1000,
                    restartServicePendingIntent
                )
                Log.d("JARVIS", "Scheduled service restart alarm for background operation")
            } catch (e: Exception) {
                Log.e("JARVIS", "Failed to schedule restart alarm", e)
            }
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val serviceChannel = NotificationChannel(
                CHANNEL_ID,
                "JARVIS Wake Word Service",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Background listening service for LifeOS voice controls"
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(serviceChannel)
        }
    }

    private fun startForegroundWithNotification() {
        val notification = buildNotification("Starting JARVIS...")
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(
                NOTIFICATION_ID,
                notification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE
            )
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }
    }

    private fun showVoicePill() {
        if (!Settings.canDrawOverlays(this)) {
            Log.w("JARVIS", "Cannot show voice pill: Permission 'Display over other apps' is missing.")
            return
        }
        if (overlayView != null) {
            Log.d("JARVIS", "Voice pill already visible, skipping")
            return
        }

        Log.d("JARVIS", "Showing voice pill overlay")
        
        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            else
                @Suppress("DEPRECATION")
                WindowManager.LayoutParams.TYPE_PHONE,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or 
            WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
            WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
            WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
            WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.CENTER_HORIZONTAL
            y = 60
        }

        overlayView = ComposeView(this).apply {
            try {
                setViewTreeLifecycleOwner(this@JarvisWakeWordService)
                setViewTreeViewModelStoreOwner(this@JarvisWakeWordService)
                setViewTreeSavedStateRegistryOwner(this@JarvisWakeWordService)
            } catch (e: Exception) {
                Log.e("JARVIS", "Failed to set view tree owners", e)
            }

            setContent {
                var visible by remember { mutableStateOf(false) }
                LaunchedEffect(Unit) {
                    visible = true
                    delay(3500)
                    visible = false
                    delay(500)
                    removeVoicePill()
                }

                VoicePillOverlay(visible = visible, onDismiss = { removeVoicePill() })
            }
        }

        try {
            windowManager?.addView(overlayView, params)
            Log.d("JARVIS", "Voice pill added successfully")
        } catch (e: Exception) {
            Log.e("JARVIS", "Failed to add voice pill overlay", e)
            overlayView = null
        }
    }

    private fun removeVoicePill() {
        JarvisController.clearResponse()
        overlayView?.let {
            try {
                windowManager?.removeView(it)
                Log.d("JARVIS", "Voice pill removed successfully")
            } catch (e: Exception) {
                Log.e("JARVIS", "Failed to remove voice pill overlay", e)
            } finally {
                overlayView = null
            }
        }
    }

    private fun updateNotificationText(content: String) {
        if (isDestroying) return
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.notify(NOTIFICATION_ID, buildNotification(content))
    }

    private fun buildNotification(contentText: String): Notification {
        val mainActivityIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP
        }
        val contentPendingIntent = PendingIntent.getActivity(
            this,
            0,
            mainActivityIntent,
            PendingIntent.FLAG_IMMUTABLE
        )

        val stopIntent = Intent(this, JarvisWakeWordService::class.java).apply {
            action = ACTION_STOP
        }
        val stopPendingIntent = PendingIntent.getService(
            this,
            1,
            stopIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val appIcon = android.R.drawable.presence_audio_online

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("JARVIS Voice Assistant")
            .setContentText(contentText)
            .setSmallIcon(appIcon)
            .setContentIntent(contentPendingIntent)
            .setOngoing(true)
            .setAutoCancel(false)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .setSmallIcon(appIcon)
            .addAction(android.R.drawable.ic_media_pause, "Stop JARVIS", stopPendingIntent)
            .build().apply {
                flags = flags or Notification.FLAG_NO_CLEAR or Notification.FLAG_ONGOING_EVENT
            }
    }
}

@Composable
fun VoicePillOverlay(visible: Boolean, onDismiss: () -> Unit) {
    val jarvisResponse by JarvisController.lastResponse.collectAsState(initial = null)
    val isSpeaking by JarvisController.isSpeaking.collectAsState(initial = false)

    AnimatedVisibility(
        visible = visible,
        enter = slideInVertically(initialOffsetY = { -it }) + fadeIn(),
        exit = slideOutVertically(targetOffsetY = { -it }) + fadeOut()
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 24.dp, vertical = 8.dp),
            contentAlignment = Alignment.Center
        ) {
            Surface(
                modifier = Modifier
                    .wrapContentWidth()
                    .heightIn(min = 56.dp)
                    .shadow(20.dp, RoundedCornerShape(28.dp))
                    .border(BorderStroke(1.dp, Color(0xFF2DE1FC).copy(alpha = 0.3f)), RoundedCornerShape(28.dp)),
                color = MaterialTheme.colorScheme.surface,
                shape = RoundedCornerShape(28.dp)
            ) {
                Column(
                    modifier = Modifier.padding(horizontal = 20.dp, vertical = 12.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        // Glowing Pulse Node
                        Box(contentAlignment = Alignment.Center) {
                            if (isSpeaking) {
                                val infiniteTransition = rememberInfiniteTransition(label = "pulse")
                                val scale by infiniteTransition.animateFloat(
                                    initialValue = 0.8f,
                                    targetValue = 1.2f,
                                    animationSpec = infiniteRepeatable(
                                        animation = tween(1000, easing = FastOutSlowInEasing),
                                        repeatMode = RepeatMode.Reverse
                                    ),
                                    label = "scale"
                                )
                                Box(
                                    modifier = Modifier
                                        .size(12.dp)
                                        .scale(scale)
                                        .background(Color(0xFF8A5DF2), CircleShape)
                                )
                            } else {
                                Box(
                                    modifier = Modifier
                                        .size(12.dp)
                                        .background(Color(0xFF2DE1FC), CircleShape)
                                )
                            }
                        }

                        Text(
                            text = if (isSpeaking) "JARVIS is speaking..." else {
                                if (System.currentTimeMillis() % 2 == 0L) "I'm listening, Sir..." else "I'm listening, Boss..."
                            },
                            color = Color.White,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 0.5.sp
                        )

                        Spacer(modifier = Modifier.width(4.dp))

                        IconButton(
                            onClick = {
                                JarvisController.processQuery("who are you")
                                // Auto dismiss after some time if needed, but for now we keep it visible to show response
                            },
                            modifier = Modifier.size(32.dp).background(Color(0xFF8A5DF2).copy(alpha = 0.2f), CircleShape)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Mic,
                                contentDescription = "Open Jarvis",
                                tint = Color(0xFF2DE1FC),
                                modifier = Modifier.size(16.dp)
                            )
                        }
                    }

                    if (jarvisResponse != null) {
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = jarvisResponse!!,
                            color = Color.White.copy(alpha = 0.8f),
                            fontSize = 12.sp,
                            lineHeight = 18.sp,
                            textAlign = TextAlign.Center,
                            modifier = Modifier.widthIn(max = 300.dp)
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun ReminderPillOverlay(visible: Boolean, title: String) {
    AnimatedVisibility(
        visible = visible,
        enter = slideInVertically(initialOffsetY = { -it }) + fadeIn(),
        exit = slideOutVertically(targetOffsetY = { -it }) + fadeOut()
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 24.dp, vertical = 16.dp),
            contentAlignment = Alignment.Center
        ) {
            Surface(
                modifier = Modifier
                    .wrapContentWidth()
                    .heightIn(min = 64.dp)
                    .shadow(24.dp, RoundedCornerShape(32.dp), spotColor = Color(0xFFFFB300), ambientColor = Color(0xFFFFB300))
                    .border(BorderStroke(1.dp, Color(0xFFFFB300).copy(alpha = 0.4f)), RoundedCornerShape(32.dp)),
                color = MaterialTheme.colorScheme.surface,
                shape = RoundedCornerShape(32.dp)
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 24.dp, vertical = 14.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .background(Color(0xFFFFB300).copy(alpha = 0.1f), CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Outlined.NotificationsActive,
                            contentDescription = null,
                            tint = Color(0xFFFFB300),
                            modifier = Modifier.size(20.dp)
                        )
                    }

                    Column {
                        Text(
                            text = "UPCOMING EVENT",
                            color = Color(0xFFFFB300),
                            fontSize = 9.sp,
                            fontWeight = FontWeight.Black,
                            letterSpacing = 1.sp
                        )
                        Text(
                            text = title,
                            color = Color.White,
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "Starting in 15 minutes",
                            color = Color.White.copy(alpha = 0.5f),
                            fontSize = 11.sp
                        )
                    }
                }
            }
        }
    }
}
