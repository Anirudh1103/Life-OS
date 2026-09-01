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

    // Audio gain multiplier. Set to 1.0f for analysis - will adjust based on measurements.
    private val audioGain = 1.0f

    val isRunning: Boolean get() = running.get()

    fun hasMicrophonePermission(): Boolean {
        return ContextCompat.checkSelfPermission(appContext, Manifest.permission.RECORD_AUDIO) ==
            PackageManager.PERMISSION_GRANTED
    }

    @Synchronized
    @androidx.annotation.RequiresPermission(Manifest.permission.RECORD_AUDIO)
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
            var continuousSilenceSamples = 0L
            var totalProcessedSamples = 0L
            
            while (running.get()) {
                val read = try {
                    record.read(buffer, 0, buffer.size)
                } catch (t: Throwable) {
                    JarvisLog.e("AUDIO_ERROR", t)
                    break
                }
                if (read > 0) {
                    totalProcessedSamples += read

                    // Phase 4: Instrument raw microphone audio before any processing
                    var rawSumSquare = 0.0
                    var rawPeak = 0.0
                    for (i in 0 until read) {
                        val s = buffer[i].toDouble() / 32768.0
                        rawSumSquare += s * s
                        rawPeak = maxOf(rawPeak, kotlin.math.abs(s))
                    }
                    val rawRms = kotlin.math.sqrt(rawSumSquare / read)

                    // Detect constant zero/silence (system suppression)
                    var allZeros = true
                    for (i in 0 until read) {
                        if (buffer[i] != 0.toShort()) {
                            allZeros = false
                            break
                        }
                    }
                    if (allZeros) {
                        continuousSilenceSamples += read
                        if (continuousSilenceSamples >= sampleRate * 5 && continuousSilenceSamples % (sampleRate * 5) < read) {
                            JarvisLog.w("AUDIO_SILENCE_DETECTED", "Mic is returning constant zeros (${continuousSilenceSamples / sampleRate}s). Possible system suppression.")
                        }
                    } else {
                        continuousSilenceSamples = 0L
                    }

                    // Phase 4: Instrument audio after gain application
                    var clippedSamples = 0
                    if (audioGain != 1.0f) {
                        for (i in 0 until read) {
                            val original = buffer[i].toDouble()
                            val amplified = (original * audioGain).toInt()
                            if (amplified == Short.MAX_VALUE.toInt() || amplified == Short.MIN_VALUE.toInt()) {
                                clippedSamples++
                            }
                            buffer[i] = amplified.coerceIn(Short.MIN_VALUE.toInt(), Short.MAX_VALUE.toInt()).toShort()
                        }
                    }
                    
                    // Phase 4: Instrument audio after all preprocessing
                    var frameSumSquare = 0.0
                    var postPeak = 0.0
                    for (i in 0 until read) {
                        val s = buffer[i].toDouble() / 32768.0
                        frameSumSquare += s * s
                        postPeak = maxOf(postPeak, kotlin.math.abs(s))
                    }
                    val frameRms = kotlin.math.sqrt(frameSumSquare / read)
                    
                    // Phase 4: Log comprehensive audio pipeline metrics
                    if (totalProcessedSamples % (sampleRate * 2) < read) {
                        val clippingPercent = if (read > 0) (clippedSamples * 100.0 / read) else 0.0
                        JarvisLog.d("AUDIO_PIPELINE_TRACE", 
                            "RAW: rms=${String.format(java.util.Locale.US, "%.4f", rawRms)} peak=${String.format(java.util.Locale.US, "%.4f", rawPeak)} | " +
                            "POST_GAIN: rms=${String.format(java.util.Locale.US, "%.4f", frameRms)} peak=${String.format(java.util.Locale.US, "%.4f", postPeak)} | " +
                            "GAIN=${audioGain}x CLIPPING=${String.format(java.util.Locale.US, "%.1f", clippingPercent)}% SAMPLES=$read")
                    }

                    var minVal = Short.MAX_VALUE.toInt()
                    var maxVal = Short.MIN_VALUE.toInt()
                    for (i in 0 until read) {
                        val v = buffer[i].toInt()
                        if (v < minVal) minVal = v
                        if (v > maxVal) maxVal = v
                    }

                    appendRing(buffer, read)
                    if (totalProcessedSamples % (sampleRate * 2) < read) {
                        val routedDev = record.routedDevice?.productName ?: "Built-in Mic"
                        android.util.Log.d("JARVIS_MIC", "timestamp=${System.currentTimeMillis()} sampleCount=$read sampleRate=$sampleRate channelCount=1 pcmFormat=PCM_16BIT rms=${String.format(java.util.Locale.US, "%.4f", rawRms)} peak=${String.format(java.util.Locale.US, "%.4f", rawPeak)} min=$minVal max=$maxVal inputDevice=\"$routedDev\" audioSource=VOICE_RECOGNITION")
                        android.util.Log.d("JARVIS_AUDIO", "framesCaptured=${totalProcessedSamples / frameSamples} framesProcessed=${totalProcessedSamples / frameSamples} framesSentToWakeWord=${totalProcessedSamples / frameSamples} framesDropped=0")
                        JarvisLog.d("JARVIS_AUDIO_FEED", "feeding frame len=$read to listener (totalSamples=$totalProcessedSamples)")
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
        if (!running.get()) return
        running.set(false)
        try {
            captureThread?.interrupt()
            captureThread?.join(500)
        } catch (_: Exception) {}
        captureThread = null
        
        try {
            audioRecord?.stop()
        } catch (_: Exception) {}
        try {
            audioRecord?.release()
        } catch (_: Exception) {}
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
    
    // Instrument KWS input conversion
    var sumSquare = 0.0
    var peak = 0.0f
    for (i in 0 until n) {
        val f = this[i] / 32768.0f
        out[i] = f
        sumSquare += f.toDouble() * f.toDouble()
        peak = maxOf(peak, kotlin.math.abs(f))
    }
    val rms = if (n > 0) kotlin.math.sqrt(sumSquare / n) else 0.0
    
    // Log KWS input characteristics periodically
    if (n > 0 && System.currentTimeMillis() % 2000 < 100) {
        android.util.Log.d("KWS_INPUT_TRACE", 
            "CONVERSION: samples=$n rms=${String.format(java.util.Locale.US, "%.4f", rms)} peak=${String.format(java.util.Locale.US, "%.4f", peak)}")
    }
    
    return out
}
