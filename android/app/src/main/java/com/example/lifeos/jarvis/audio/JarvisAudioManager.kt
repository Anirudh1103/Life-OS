package com.example.lifeos.jarvis.audio

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import androidx.core.content.ContextCompat
import com.example.lifeos.jarvis.logging.JarvisLog
import com.example.lifeos.jarvis.wakeword.WakeWordConfig
import java.util.concurrent.atomic.AtomicBoolean

/**
 * Single authoritative microphone pipeline for JARVIS.
 * Callers must not create additional AudioRecord instances while this is running.
 */
class JarvisAudioManager(
    context: Context
) {
    private val appContext: Context = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.S) {
        try {
            context.createAttributionContext("jarvis_microphone")
        } catch (_: Exception) {
            context.applicationContext
        }
    } else {
        context.applicationContext
    }

    fun interface FrameListener {
        fun onPcm16(frame: ShortArray, length: Int, rms: Double)
    }

    private val running = AtomicBoolean(false)
    private var audioRecord: AudioRecord? = null
    private var captureThread: Thread? = null

    private val ring = ShortArray(WakeWordConfig.SAMPLE_RATE * RING_SECONDS)
    private var ringWrite = 0
    private var ringFilled = 0
    private val ringLock = Any()

    private val router = JarvisAudioRouter(appContext)

    // Audio gain multiplier to boost weak microphone signals for wake-word detection
    // Set to 1.0x (unity) to prevent distortion, rely on neural engine sensitivity
    private val audioGain = 1.0f

    val isRunning: Boolean get() = running.get()

    fun hasMicrophonePermission(): Boolean {
        return ContextCompat.checkSelfPermission(appContext, Manifest.permission.RECORD_AUDIO) ==
            PackageManager.PERMISSION_GRANTED
    }

    @Synchronized
    fun start(stage: String = "WAKEWORD", listener: FrameListener) {
        if (running.get()) return
        if (!hasMicrophonePermission()) {
            throw SecurityException("RECORD_AUDIO permission is not granted")
        }

        val sampleRate = WakeWordConfig.SAMPLE_RATE
        val minBuf = AudioRecord.getMinBufferSize(
            sampleRate,
            AudioFormat.CHANNEL_IN_MONO,
            AudioFormat.ENCODING_PCM_16BIT
        )
        if (minBuf <= 0) {
            throw IllegalStateException("AudioRecord buffer size unavailable ($minBuf)")
        }

        val frameSamples = sampleRate * WakeWordConfig.FRAME_MS / 1000
        
        val record = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.S) {
            AudioRecord.Builder()
                .setContext(appContext) // Crucial for attributionTag
                .setAudioSource(MediaRecorder.AudioSource.VOICE_RECOGNITION)
                .setAudioFormat(AudioFormat.Builder()
                    .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                    .setSampleRate(sampleRate)
                    .setChannelMask(AudioFormat.CHANNEL_IN_MONO)
                    .build())
                .setBufferSizeInBytes(maxOf(minBuf, frameSamples * 4))
                .build()
        } else {
            AudioRecord(
                MediaRecorder.AudioSource.VOICE_RECOGNITION,
                sampleRate,
                AudioFormat.CHANNEL_IN_MONO,
                AudioFormat.ENCODING_PCM_16BIT,
                maxOf(minBuf, frameSamples * 4)
            )
        }

        if (record.state != AudioRecord.STATE_INITIALIZED) {
            record.release()
            throw IllegalStateException("AudioRecord failed to initialize")
        }

        // Configure input device strictly to Built-in Mic
        router.configureAudioRecord(record, stage)
        router.attachRoutingListener(record, stage)

        audioRecord = record
        running.set(true)
        ringWrite = 0
        ringFilled = 0
        record.startRecording()
        JarvisLog.d("JARVIS_AUDIO_STARTED", "stage=$stage")

        // Verify actual routed device after recording starts
        router.verifyInputRoute(record, stage)

        captureThread = Thread({
            val buffer = ShortArray(frameSamples)
            var totalSamplesProcessed = 0L
            var sumSquare = 0.0
            
            while (running.get()) {
                val read = try {
                    record.read(buffer, 0, buffer.size)
                } catch (t: Throwable) {
                    JarvisLog.e("AUDIO_ERROR", t)
                    break
                }
                if (read > 0) {
                    // Apply audio gain to boost weak microphone signals
                    for (i in 0 until read) {
                        val amplified = (buffer[i] * audioGain).toInt()
                        buffer[i] = amplified.coerceIn(Short.MIN_VALUE.toInt(), Short.MAX_VALUE.toInt()).toShort()
                    }
                    
                    var frameSumSquare = 0.0
                    for (i in 0 until read) {
                        val s = buffer[i].toDouble() / 32768.0
                        frameSumSquare += s * s
                    }
                    val frameRms = kotlin.math.sqrt(frameSumSquare / read)

                    // Diagnostic: Global average RMS
                    sumSquare += frameSumSquare
                    totalSamplesProcessed += read
                    if (totalSamplesProcessed >= sampleRate * 2) {
                        val globalRms = kotlin.math.sqrt(sumSquare / totalSamplesProcessed)
                        JarvisLog.d("JARVIS_AUDIO_LEVEL", "Global RMS=${String.format(java.util.Locale.US, "%.4f", globalRms)} (Gain=${audioGain}x)")
                        totalSamplesProcessed = 0
                        sumSquare = 0.0
                    }

                    appendRing(buffer, read)
                    if (totalSamplesProcessed % (sampleRate * 2) == 0L) {
                        JarvisLog.d("JARVIS_AUDIO_FEED", "feeding frame len=$read to listener")
                    }
                    listener.onPcm16(buffer, read, frameRms)
                } else if (read < 0) {
                    JarvisLog.e("AUDIO_ERROR read=$read")
                    break
                }
            }
        }, "jarvis-audio").apply {
            isDaemon = true
            priority = Thread.MAX_PRIORITY
            start()
        }
    }

    @Synchronized
    fun stop() {
        running.set(false)
        captureThread?.join(500)
        captureThread = null
        try {
            audioRecord?.stop()
        } catch (_: Exception) {
        }
        audioRecord?.release()
        audioRecord = null
        router.stopMonitoring()
        JarvisLog.d("JARVIS_AUDIO_STOPPED")
    }

    fun snapshotRecent(maxSamples: Int = WakeWordConfig.SAMPLE_RATE * 2): ShortArray {
        synchronized(ringLock) {
            val count = minOf(maxSamples, ringFilled)
            if (count <= 0) return ShortArray(0)
            val out = ShortArray(count)
            val start = (ringWrite - count + ring.size) % ring.size
            for (i in 0 until count) {
                out[i] = ring[(start + i) % ring.size]
            }
            return out
        }
    }

    private fun appendRing(frame: ShortArray, length: Int) {
        synchronized(ringLock) {
            for (i in 0 until length) {
                ring[ringWrite] = frame[i]
                ringWrite = (ringWrite + 1) % ring.size
                if (ringFilled < ring.size) ringFilled++
            }
        }
    }

    companion object {
        private const val RING_SECONDS = 2
    }
}

fun ShortArray.toFloatPcm(length: Int = size): FloatArray {
    val n = minOf(length, size)
    val out = FloatArray(n)
    for (i in 0 until n) {
        out[i] = this[i] / 32768.0f
    }
    return out
}
