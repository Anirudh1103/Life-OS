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
import com.example.lifeos.jarvis.wakeword.VoskWakeWordEngine
import com.example.lifeos.jarvis.wakeword.WakeWord
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.*
import androidx.savedstate.SavedStateRegistry
import androidx.savedstate.SavedStateRegistryController
import androidx.savedstate.SavedStateRegistryOwner
import androidx.savedstate.setViewTreeSavedStateRegistryOwner

class JarvisWakeWordService : Service(), LifecycleOwner, ViewModelStoreOwner, SavedStateRegistryOwner {

    private val lifecycleRegistry = LifecycleRegistry(this)
    override val lifecycle: Lifecycle = lifecycleRegistry

    private val viewModelStore = ViewModelStore()
    override val viewModelStore: ViewModelStore = viewModelStore

    private val savedStateRegistryController = SavedStateRegistryController.create(this)
    override val savedStateRegistry: SavedStateRegistry = savedStateRegistryController.savedStateRegistry

    private var windowManager: WindowManager? = null
    private var overlayView: ComposeView? = null
    private val isPillVisible = MutableStateFlow(false)

    private val serviceJob = Job()
    private val serviceScope = CoroutineScope(Dispatchers.Default + serviceJob)

    private var wakeWordEngine: VoskWakeWordEngine? = null
    private var recordingJob: Job? = null
    private var isServiceRunning = false

    companion object {
        const val NOTIFICATION_ID = 1001
        const val CHANNEL_ID = "jarvis_wake_word_channel"
        const val ACTION_START = "com.example.lifeos.jarvis.START"
        const val ACTION_STOP = "com.example.lifeos.jarvis.STOP"
    }

    override fun onCreate() {
        super.onCreate()
        savedStateRegistryController.performRestore(null)
        lifecycleRegistry.handleLifecycleEvent(Lifecycle.Event.ON_CREATE)
        createNotificationChannel()
        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        lifecycleRegistry.handleLifecycleEvent(Lifecycle.Event.ON_START)
        val action = intent?.action
        Log.d("JARVIS", "JarvisWakeWordService onStartCommand action: $action")

        if (action == ACTION_STOP) {
            stopForegroundService()
            return START_NOT_STICKY
        }

        // Start Foreground Notification first (Required within 5 seconds of Service start)
        startForegroundWithNotification()

        if (action == ACTION_START) {
            isServiceRunning = true
            JarvisController.updateState(JarvisState.Starting)
            startListening()
        }

        return START_STICKY
    }

    private fun startListening() {
        recordingJob?.cancel()
        recordingJob = serviceScope.launch {
            try {
                // Initialize Vosk Engine
                val engine = VoskWakeWordEngine(applicationContext)
                wakeWordEngine = engine

                // Register loaded phrases in controller
                JarvisController.setLoadedPhrases(listOf("JARVIS", "Hey JARVIS"))

                // Listen to detection flow
                launch(Dispatchers.Main) {
                    engine.detectedWakeWord.collectLatest { word ->
                        if (isServiceRunning) {
                            JarvisController.updateState(JarvisState.Detected(word))
                            // Update Notification Content
                            updateNotificationText("✦ Wake Word Detected: $word")
                            
                            // Show Overlay Pill
                            showVoicePill()

                            // Wait for cooldown
                            delay(4000L)
                            
                            // Re-enter listening state
                            if (isServiceRunning) {
                                JarvisController.updateState(JarvisState.Listening)
                                updateNotificationText("Listening for JARVIS...")
                            }
                        }
                    }
                }

                engine.start()

            } catch (e: SecurityException) {
                Log.e("JARVIS", "Microphone permission is missing", e)
                JarvisController.updateState(JarvisState.Error("Microphone permission is required for JARVIS."))
                stopSelf()
            } catch (e: Exception) {
                Log.e("JARVIS", "Unknown exception during service start", e)
                JarvisController.updateState(JarvisState.Error(e.message ?: "Failed to start wake-word engine."))
                stopSelf()
            }
        }
    }

    private fun stopForegroundService() {
        Log.d("JARVIS", "Stopping JARVIS Wake Word Service.")
        isServiceRunning = false
        recordingJob?.cancel()
        serviceScope.cancel()

        wakeWordEngine?.release()
        wakeWordEngine = null

        JarvisController.updateState(JarvisState.Disabled)

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
        stopForegroundService()
    }

    override fun onBind(intent: Intent?): IBinder? = null

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
        if (overlayView != null || !Settings.canDrawOverlays(this)) return

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
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .addAction(android.R.drawable.ic_media_pause, "Stop JARVIS", stopPendingIntent)
            .build()
    }
}

@Composable
fun VoicePillOverlay(visible: Boolean, onDismiss: () -> Unit) {
    val context = LocalContext.current
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
                    .height(56.dp)
                    .shadow(20.dp, RoundedCornerShape(28.dp))
                    .border(BorderStroke(1.dp, Color(0xFF2DE1FC).copy(alpha = 0.3f)), RoundedCornerShape(28.dp)),
                color = Color(0xFF0C0A1C),
                shape = RoundedCornerShape(28.dp)
            ) {
                Row(
                    modifier = Modifier
                        .padding(horizontal = 20.dp)
                        .fillMaxHeight(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    // Glowing Pulse Node
                    Box(contentAlignment = Alignment.Center) {
                        val infiniteTransition = rememberInfiniteTransition(label = "pulse")
                        val scale by infiniteTransition.animateFloat(
                            initialValue = 0.8f,
                            targetValue = 1.2f,
                            animationSpec = infiniteRepeatable(
                                animation = tween(1000, easeOf = FastOutSlowInEasing),
                                repeatMode = RepeatMode.Reverse
                            ),
                            label = "scale"
                        )
                        Box(
                            modifier = Modifier
                                .size(12.dp)
                                .scale(scale)
                                .background(Color(0xFF2DE1FC), CircleShape)
                        )
                    }

                    Text(
                        text = "I'm listening, Sir...",
                        color = Color.White,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 0.5.sp
                    )

                    Spacer(modifier = Modifier.width(4.dp))

                    IconButton(
                        onClick = {
                            val launchIntent = Intent(context, MainActivity::class.java).apply {
                                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
                                action = "com.example.lifeos.ACTION_VOICE_QUERY"
                                putExtra("query", "start")
                            }
                            context.startActivity(launchIntent)
                            onDismiss()
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
            }
        }
    }
}
