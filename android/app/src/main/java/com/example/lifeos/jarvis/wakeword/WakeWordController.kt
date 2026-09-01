package com.example.lifeos.jarvis.wakeword

import android.Manifest
import android.content.Context
import android.util.Log
import androidx.annotation.RequiresPermission
import com.example.lifeos.jarvis.audio.JarvisAudioManager
import com.example.lifeos.jarvis.audio.toFloatPcm
import com.example.lifeos.jarvis.prefs.JarvisPrefs
import kotlinx.coroutines.*
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicLong

object WakeWordController {
    private const val TAG = "JARVIS"

    private val controllerScope = CoroutineScope(Dispatchers.Default + SupervisorJob())

    private var appContext: Context? = null
    private var engine: SherpaWakeWordEngine? = null
    private var audioManager: JarvisAudioManager? = null

    private var heartbeatJob: Job? = null
    private var isServiceActive = false
    private val isAudioActive = AtomicBoolean(false)

    private val frameCounter = AtomicLong(0)
    private var lastAudioTimestamp = 0L
    private var lastDetectionTimestamp = 0L
    private var lastHitTime = 0L

    @Synchronized
    fun initialize(context: Context) {
        if (appContext == null) {
            appContext = context.applicationContext
        }
        val ctx = appContext ?: return
        if (engine == null) {
            engine = SherpaWakeWordEngine(ctx).apply {
                initialize()
            }
        }
        if (audioManager == null) {
            audioManager = JarvisAudioManager(ctx)
        }
        startHeartbeat()
    }

    private fun startHeartbeat() {
        heartbeatJob?.cancel()
        heartbeatJob = controllerScope.launch {
            while (isActive) {
                delay(5000)
                val engineState = engine?.state ?: WakeWordEngineState.UNINITIALIZED
                val runtimeState = WakeWordEventBus.runtimeState.value
                val frames = frameCounter.get()
                Log.i(
                    TAG,
                    "[JARVIS_WAKEWORD_HEARTBEAT] serviceRunning=$isServiceActive audioRunning=${isAudioActive.get()} " +
                    "engineState=$engineState runtimeState=$runtimeState framesProcessed=$frames " +
                    "lastAudioAt=$lastAudioTimestamp lastDetectionAt=$lastDetectionTimestamp"
                )
            }
        }
    }

    @Synchronized
    @RequiresPermission(Manifest.permission.RECORD_AUDIO)
    fun startListening(context: Context) {
        initialize(context)
        isServiceActive = true
        val eng = engine
        val manager = audioManager

        if (eng == null || manager == null) {
            Log.e(TAG, "[JARVIS_WAKEWORD_CONTROLLER] Initialization failed; cannot start listening")
            WakeWordEventBus.updateRuntimeState(WakeWordRuntimeState.ERROR)
            return
        }

        if (isAudioActive.get() && manager.isRunning) {
            Log.d(TAG, "[JARVIS_WAKEWORD_CONTROLLER] Audio capture already active, setting state to LISTENING")
            WakeWordEventBus.updateRuntimeState(WakeWordRuntimeState.LISTENING)
            return
        }

        WakeWordEventBus.updateRuntimeState(WakeWordRuntimeState.STARTING)
        Log.i(TAG, "[JARVIS_WAKEWORD_CONTROLLER] Starting continuous wake-word capture")

        isAudioActive.set(true)
        manager.start(stage = "WAKEWORD") { pcmShorts, length, rms ->
            lastAudioTimestamp = System.currentTimeMillis()
            val currentFrames = frameCounter.incrementAndGet()

            val currentState = WakeWordEventBus.runtimeState.value
            if (currentState == WakeWordRuntimeState.PAUSED_FOR_VOICE_SESSION ||
                currentState == WakeWordRuntimeState.DISABLED) {
                return@start
            }

            if (currentState == WakeWordRuntimeState.STARTING) {
                WakeWordEventBus.updateRuntimeState(WakeWordRuntimeState.LISTENING)
            }

            if (currentFrames % 100 == 0L) {
                Log.d(
                    TAG,
                    "[JARVIS_WAKEWORD_PROCESS] state=$currentState frame=$currentFrames " +
                    "samples=$length sampleRate=${WakeWordConfig.SAMPLE_RATE}"
                )
            }

            val pcmFloats = pcmShorts.toFloatPcm(length)
            val hit = eng.process(pcmFloats, WakeWordConfig.SAMPLE_RATE)

            val recentTokens = eng.getRecentTokens()
            WakeWordEventBus.updateAudioMetrics(rms, recentTokens)

            if (hit != null) {
                val now = System.currentTimeMillis()
                if (now - lastHitTime >= WakeWordConfig.COOLDOWN_MS) {
                    lastHitTime = now
                    lastDetectionTimestamp = now
                    Log.i(
                        TAG,
                        "[JARVIS_WAKEWORD_DETECTION] keyword=${hit.keyword} frame=$currentFrames " +
                        "timestamp=$now serviceState=$isServiceActive engineState=${eng.state}"
                    )
                    WakeWordEventBus.updateRuntimeState(WakeWordRuntimeState.TRIGGERED)
                    WakeWordEventBus.emitHit(hit)
                } else {
                    Log.d(TAG, "[JARVIS_WAKEWORD_COOLDOWN] Suppressing repeated hit within cooldown")
                }
            }
        }
        WakeWordEventBus.updateRuntimeState(WakeWordRuntimeState.LISTENING)
    }

    @Synchronized
    fun pauseForVoiceSession() {
        Log.d(TAG, "[JARVIS_WAKEWORD_CONTROLLER] Pausing wake-word listening for voice session")
        WakeWordEventBus.updateRuntimeState(WakeWordRuntimeState.PAUSED_FOR_VOICE_SESSION)
        audioManager?.stop()
        isAudioActive.set(false)
        engine?.reset()
    }

    @Synchronized
    fun resumeFromVoiceSession(context: Context) {
        Log.d(TAG, "[JARVIS_WAKEWORD_CONTROLLER] Resuming wake-word listening from voice session")
        if (isServiceActive && JarvisPrefs.isListenEnabled(context)) {
            startListening(context)
        }
    }

    @Synchronized
    fun stopListening() {
        Log.i(TAG, "[JARVIS_WAKEWORD_CONTROLLER] Stopping continuous wake-word capture")
        isServiceActive = false
        isAudioActive.set(false)
        audioManager?.stop()
        engine?.reset()
        WakeWordEventBus.updateRuntimeState(WakeWordRuntimeState.DISABLED)
    }

    fun snapshotRecent(samples: Int = 16000 * 2): ShortArray {
        return audioManager?.snapshotRecent(samples) ?: ShortArray(0)
    }

    fun getRecentTokens(): String {
        return engine?.getRecentTokens() ?: ""
    }

    val isRunning: Boolean get() = isAudioActive.get() && (audioManager?.isRunning == true)
}
