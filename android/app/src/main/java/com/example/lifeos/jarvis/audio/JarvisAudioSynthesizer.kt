package com.example.lifeos.jarvis.audio

import android.media.AudioFormat
import android.media.AudioTrack
import android.media.AudioAttributes
import android.os.Handler
import android.os.Looper
import android.util.Log
import kotlin.math.*

/**
 * Premium JARVIS sound synthesis using procedural lead glass tones.
 */
object JarvisAudioSynthesizer {
    private const val TAG = "JarvisAudio"

    fun playLeadGlassTone() {
        val sampleRate = 44100
        val duration = 3.0 // Extended to 3.0s
        val numSamples = (sampleRate * duration).toInt()
        val buffer = ShortArray(numSamples)

        var phase1 = 0.0
        var phase2 = 0.0

        for (i in 0 until numSamples) {
            val t = i.toDouble() / sampleRate
            
            // Osc 1: 1800Hz -> 2400Hz (30ms ramp)
            val freq1 = if (t < 0.03) {
                1800.0 * (2400.0 / 1800.0).pow(t / 0.03)
            } else 2400.0
            phase1 += 2.0 * PI * freq1 / sampleRate
            val g1 = 0.5 * exp(-3.07 * t) // Slower decay for 3.0s (ln(0.0001)/3.0)
            
            // Osc 2: 880Hz -> 1200Hz (30ms ramp)
            val freq2 = if (t < 0.03) {
                880.0 * (1200.0 / 880.0).pow(t / 0.03)
            } else 1200.0
            phase2 += 2.0 * PI * freq2 / sampleRate
            val g2 = 0.25 * exp(-4.6 * t) // Slower decay

            val sample = (sin(phase1) * g1 + sin(phase2) * g2)
            buffer[i] = (sample * Short.MAX_VALUE).toInt().coerceIn(Short.MIN_VALUE.toInt(), Short.MAX_VALUE.toInt()).toShort()
        }

        try {
            val usage = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                AudioAttributes.USAGE_ASSISTANT
            } else {
                AudioAttributes.USAGE_ASSISTANCE_SONIFICATION
            }
            
            val audioTrack = AudioTrack.Builder()
                .setAudioAttributes(AudioAttributes.Builder()
                    .setUsage(usage)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build())
                .setAudioFormat(AudioFormat.Builder()
                    .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                    .setSampleRate(sampleRate)
                    .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                    .build())
                .setBufferSizeInBytes(numSamples * 2)
                .setTransferMode(AudioTrack.MODE_STATIC)
                .build()

            audioTrack.write(buffer, 0, numSamples)
            audioTrack.play()
            
            // Release resources after playback
            Handler(Looper.getMainLooper()).postDelayed({
                try {
                    audioTrack.stop()
                    audioTrack.release()
                } catch (_: Exception) {}
            }, 4000)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to synthesize JARVIS tone", e)
        }
    }
}
