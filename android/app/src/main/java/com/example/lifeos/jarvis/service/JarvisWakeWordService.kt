package com.example.lifeos.jarvis.service

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
import com.example.lifeos.jarvis.prefs.JarvisPrefs
import com.example.lifeos.jarvis.speaker.JarvisSpeakerVerifier
import com.example.lifeos.jarvis.wakeword.SherpaWakeWordEngine
import com.example.lifeos.jarvis.wakeword.WakeWordConfig
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
    private var listeningPaused = false
    private var currentSessionId = 0L
    private var currentWakeCycleId = 0L

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
        
        tts = TextToSpeech(this, this)
        
        createNotificationChannel()
        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager

        // Global response collector - lives for the entire service lifecycle
        serviceScope.launch(Dispatchers.Main) {
            JarvisController.lastResponse.collectLatest { response ->
                if (response != null && JarvisController.shouldSpeakResponse.value) {
                    Log.d("JARVIS", "Global collector: Received response to speak: ${response.take(20)}...")
                    showVoicePill()
                    speak(response)
                }
            }
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        lifecycleRegistry.handleLifecycleEvent(Lifecycle.Event.ON_START)
        val action = intent?.action
        Log.d("JARVIS", "JarvisWakeWordService onStartCommand action: $action")

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
            startForegroundWithNotification()
            isServiceRunning = true
            startListening()
            return START_STICKY
        }

        if (action == ACTION_PROACTIVE_REMINDER) {
            val title = intent?.getStringExtra("event_title") ?: "Event"
            handleProactiveReminder(title)
            return START_STICKY
        }

        // Start Foreground Notification first (Required within 5 seconds of Service start)
        startForegroundWithNotification()

        val shouldListen = action == ACTION_START ||
            (action.isNullOrEmpty() && JarvisPrefs.isListenEnabled(this))
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
        Log.d("JARVIS", "Commanded to speak: ${text.take(50)}...")
        val apiKey = BuildConfig.ELEVENLABS_API_KEY
        if (!apiKey.isNullOrBlank() && apiKey != "") {
            speakWithElevenLabs(text)
        } else {
            speakWithSystemTts(text)
        }
    }

    private fun speakWithElevenLabs(text: String) {
        serviceScope.launch {
            try {
                JarvisController.setSpeaking(true)
                val response = httpClient.post("https://api.elevenlabs.io/v1/text-to-speech/$JARVIS_VOICE_ID") {
                    header("xi-api-key", BuildConfig.ELEVENLABS_API_KEY)
                    contentType(ContentType.Application.Json)
                    setBody("""{"text": "$text", "model_id": "eleven_turbo_v2_5"}""")
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
        if (!Settings.canDrawOverlays(this)) return
        if (reminderOverlayView != null) return

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
            gravity = Gravity.TOP
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
            JarvisLog.d("JARVIS_LISTENING_PAUSED")
            return
        }
        if (!JarvisPrefs.isListenEnabled(this)) {
            JarvisLog.d("JARVIS_DEACTIVATED", "listening disabled")
            JarvisController.updateState(JarvisState.Disabled)
            JarvisController.setAudioPipelineStatus("disabled")
            return
        }

        val verificationRequired = JarvisSpeakerVerifier.isSpeakerVerificationEnabled(this)
        if (verificationRequired && JarvisSpeakerVerifier.getVoiceProfile(this) == null) {
            JarvisLog.w("SPEAKER_VERIFICATION_ENABLED_BUT_NO_PROFILE")
        }

        currentSessionId++
        val activeSession = currentSessionId
        JarvisLog.d("JARVIS_RUNTIME_STARTING", "sessionId=$activeSession")

        recordingJob?.cancel()
        commandListener?.stop()
        recordingJob = serviceScope.launch {
            try {
                JarvisController.updateState(JarvisState.Starting)
                val engine = wakeWordEngine ?: SherpaWakeWordEngine(applicationContext).also {
                    it.initialize()
                    wakeWordEngine = it
                }
                if (commandListener == null) {
                    commandListener = JarvisCommandListener(applicationContext)
                }

                JarvisController.setLoadedPhrases(listOf(WakeWordConfig.PHRASE))

                startWakeWordCapture(engine, activeSession)
            } catch (e: SecurityException) {
                JarvisLog.e("JARVIS_MIC_PERMISSION_REQUIRED", e)
                JarvisController.updateState(
                    JarvisState.Error(
                        "Microphone permission is required.",
                        JarvisState.ErrorAction.OpenSettings
                    )
                )
            } catch (e: Exception) {
                JarvisLog.e("JARVIS_AUDIO_ERROR", e)
                JarvisController.updateState(
                    JarvisState.Error(
                        "JARVIS couldn't start listening.",
                        JarvisState.ErrorAction.Retry
                    )
                )
            }
        }
    }

    private fun startWakeWordCapture(engine: SherpaWakeWordEngine, sessionId: Long) {
        stopAudioPipeline()
        val manager = JarvisAudioManager(applicationContext)
        audioManager = manager
        manager.start(stage = "WAKEWORD") { frame, length, _ ->
            if (sessionId != currentSessionId) return@start

            // Echo suppression: Ignore input audio frames while Jarvis is speaking through TTS
            if (JarvisController.isSpeaking.value) {
                return@start
            }

            val state = JarvisController.state.value
            if (state !is JarvisState.ListeningForWakeWord && state !is JarvisState.Starting) {
                return@start
            }
            if (state is JarvisState.Starting) {
                JarvisController.updateState(JarvisState.ListeningForWakeWord)
                JarvisController.setAudioPipelineStatus("listening")
                updateNotificationText("Listening for Hey Jarvis…")
                JarvisLog.d("JARVIS_WAKEWORD_LISTENING")
            }
            val hit = engine.process(frame.toFloatPcm(length), WakeWordConfig.SAMPLE_RATE)
            if (hit != null) {
                handleWakeWord(manager.snapshotRecent(), hit.confidence, sessionId)
            }
        }
    }

    private fun handleWakeWord(pcm: ShortArray, confidence: Float?, sessionId: Long) {
        val cycleId = ++currentWakeCycleId
        serviceScope.launch(Dispatchers.Default) {
            if (sessionId != currentSessionId || cycleId != currentWakeCycleId) return@launch

            JarvisLog.d("JARVIS_WAKEWORD_DETECTED", "confidence=$confidence cycleId=$cycleId")
            JarvisController.updateState(JarvisState.WakeWordDetected(confidence))
            updateNotificationText("Wake word detected")

            val verificationEnabled = JarvisSpeakerVerifier.isSpeakerVerificationEnabled(this@JarvisWakeWordService)
            if (!verificationEnabled) {
                JarvisLog.w("SPEAKER_VERIFICATION_SKIPPED")
                if (sessionId == currentSessionId && cycleId == currentWakeCycleId) {
                    activateJarvis(sessionId)
                }
                return@launch
            }

            val enrolled = JarvisSpeakerVerifier.getVoiceProfile(this@JarvisWakeWordService)
            if (enrolled == null) {
                JarvisLog.d("JARVIS_PROFILE_NOT_FOUND", "missing enrolled voice profile")
                JarvisController.updateState(JarvisState.ListeningForWakeWord)
                updateNotificationText("Listening for Hey Jarvis…")
                return@launch
            }

            JarvisController.updateState(JarvisState.VerifyingSpeaker)
            JarvisLog.d("JARVIS_AUDIO_ROUTE", "stage=SPEAKER_VERIFICATION requested=TYPE_BUILTIN_MIC actual=TYPE_BUILTIN_MIC")
            JarvisLog.d("JARVIS_SPEAKER_VERIFICATION_STARTED")
            
            val score = JarvisSpeakerVerifier.verifySpeaker(this@JarvisWakeWordService, pcm, enrolled)
            JarvisController.setLastSpeakerScore(score)
            val isMatch = score >= JarvisSpeakerVerifier.DEFAULT_THRESHOLD
            JarvisLog.d("JARVIS_SPEAKER_VERIFICATION_RESULT", "match=$isMatch score=$score threshold=${JarvisSpeakerVerifier.DEFAULT_THRESHOLD}")
            
            if (sessionId != currentSessionId || cycleId != currentWakeCycleId) return@launch

            if (isMatch) {
                activateJarvis(sessionId)
            } else {
                JarvisController.updateState(JarvisState.ListeningForWakeWord)
                updateNotificationText("Listening for Hey Jarvis…")
            }
        }
    }

    private fun activateJarvis(sessionId: Long) {
        if (sessionId != currentSessionId) return
        JarvisLog.d("JARVIS_ACTIVATED", "sessionId=$sessionId")
        stopAudioPipeline()
        JarvisController.updateState(JarvisState.ListeningForCommand)
        updateNotificationText("JARVIS is listening for a command")
        val greeting = if (System.currentTimeMillis() % 2 == 0L) "Yes, Sir?" else "Yes, Boss?"
        serviceScope.launch(Dispatchers.Main) {
            showVoicePill()
            speak(greeting)
            JarvisLog.d("JARVIS_STT_STARTED")
            commandListener?.start(JarvisPrefs.commandTimeoutMs(this@JarvisWakeWordService)) { transcript ->
                serviceScope.launch {
                    if (sessionId != currentSessionId) {
                        JarvisLog.d("JARVIS_STT_SESSION_MISMATCH", "discarding transcript")
                        return@launch
                    }
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
                        wakeWordEngine?.reset()
                        JarvisController.updateState(JarvisState.ListeningForWakeWord)
                        val engine = wakeWordEngine ?: return@launch
                        startWakeWordCapture(engine, sessionId)
                    }
                }
            }
        }
    }

    private fun stopAudioPipeline() {
        audioManager?.stop()
        audioManager = null
        JarvisController.setAudioPipelineStatus("stopped")
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
        tts?.stop()
        tts?.shutdown()
        stopForegroundService()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onTaskRemoved(rootIntent: Intent?) {
        super.onTaskRemoved(rootIntent)
        // If the user swipes away the app, we want the service to stay alive if listening is enabled.
        // We can't actually prevent the app process from being killed, but the START_STICKY 
        // returned from onStartCommand will prompt the OS to restart the service.
        Log.d("JARVIS", "JarvisWakeWordService onTaskRemoved. ListeningEnabled=${JarvisPrefs.isListenEnabled(this)}")
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
        if (overlayView != null) return

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
            gravity = Gravity.TOP
            y = 100
        }

        overlayView = ComposeView(this).apply {
            setViewTreeLifecycleOwner(this@JarvisWakeWordService)
            setViewTreeViewModelStoreOwner(this@JarvisWakeWordService)
            setViewTreeSavedStateRegistryOwner(this@JarvisWakeWordService)

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

        windowManager?.addView(overlayView, params)
    }

    private fun removeVoicePill() {
        JarvisController.clearResponse()
        overlayView?.let {
            windowManager?.removeView(it)
            overlayView = null
        }
    }

    private fun updateNotificationText(content: String) {
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
