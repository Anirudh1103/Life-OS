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
    private val context: Context
) {
    fun interface FrameListener {
        fun onPcm16(frame: ShortArray, length: Int)
    }

    private val running = AtomicBoolean(false)
    private var audioRecord: AudioRecord? = null
    private var captureThread: Thread? = null

    private val ring = ShortArray(WakeWordConfig.SAMPLE_RATE * RING_SECONDS)
    private var ringWrite = 0
    private var ringFilled = 0
    private val ringLock = Any()

    val isRunning: Boolean get() = running.get()

    fun hasMicrophonePermission(): Boolean {
        return ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) ==
            PackageManager.PERMISSION_GRANTED
    }

    @Synchronized
    fun start(listener: FrameListener) {
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
        val record = AudioRecord(
            MediaRecorder.AudioSource.VOICE_RECOGNITION,
            sampleRate,
            AudioFormat.CHANNEL_IN_MONO,
            AudioFormat.ENCODING_PCM_16BIT,
            maxOf(minBuf, frameSamples * 4)
        )
        if (record.state != AudioRecord.STATE_INITIALIZED) {
            record.release()
            throw IllegalStateException("AudioRecord failed to initialize")
        }

        audioRecord = record
        running.set(true)
        ringWrite = 0
        ringFilled = 0
        record.startRecording()
        JarvisLog.d("JARVIS_AUDIO_STARTED")

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
                    // Diagnostic: Calculate RMS power for volume monitoring
                    for (i in 0 until read) {
                        val s = buffer[i].toDouble() / 32768.0
                        sumSquare += s * s
                    }
                    totalSamplesProcessed += read
                    
                    // Log RMS level every ~2 seconds
                    if (totalSamplesProcessed >= sampleRate * 2) {
                        val rms = kotlin.math.sqrt(sumSquare / totalSamplesProcessed)
                        JarvisLog.d("JARVIS_AUDIO_LEVEL", "RMS=${String.format(java.util.Locale.US, "%.4f", rms)}")
                        totalSamplesProcessed = 0
                        sumSquare = 0.0
                    }

                    appendRing(buffer, read)
                    listener.onPcm16(buffer, read)
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
