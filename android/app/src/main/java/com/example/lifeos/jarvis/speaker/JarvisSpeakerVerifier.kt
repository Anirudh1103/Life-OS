package com.example.lifeos.jarvis.speaker

import android.content.Context
import android.util.Log
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import java.util.*

@Serializable
data class SpeakerEmbedding(
    val averagePitch: Float,
    val spectralCentroid: Float,
    val energyBands: List<Float>,
    val metadataVersion: String = "1.0",
    val timestamp: Long = System.currentTimeMillis()
)

object JarvisSpeakerVerifier {

    private const val PREFS_NAME = "jarvis_voice_prefs"
    private const val KEY_PROFILE = "user_voice_profile"
    private const val KEY_VERIFICATION_ENABLED = "speaker_verification_enabled"
    private const val TAG = "JARVIS_SPEAKER"

    // Default threshold prioritizes false trigger prevention
    const val DEFAULT_THRESHOLD = 0.60f

    /**
     * Extracts voice features (pitch, ZCR, energy bands) from a raw 16kHz 16-bit PCM audio buffer.
     */
    fun extractEmbedding(samples: ShortArray): SpeakerEmbedding {
        val pitch = calculatePitch(samples, 16000)
        val zcr = calculateZeroCrossingRate(samples)
        val energy = calculateEnergyBands(samples)
        return SpeakerEmbedding(pitch, zcr, energy)
    }

    /**
     * Pitch detection using Autocorrelation method limited to human voice range (50Hz - 350Hz)
     */
    private fun calculatePitch(samples: ShortArray, sampleRate: Int): Float {
        var maxAutocorr = 0.0
        var bestLag = -1
        
        val minLag = sampleRate / 350 // lag for 350Hz (~45 samples)
        val maxLag = sampleRate / 50  // lag for 50Hz (~320 samples)

        if (samples.size <= maxLag) return 0f

        val autocorr = DoubleArray(maxLag + 1)
        for (lag in minLag..maxLag) {
            var sum = 0.0
            for (i in 0 until samples.size - lag) {
                sum += samples[i].toDouble() * samples[i + lag].toDouble()
            }
            autocorr[lag] = sum
            if (sum > maxAutocorr) {
                maxAutocorr = sum
                bestLag = lag
            }
        }
        return if (bestLag > 0) sampleRate.toFloat() / bestLag.toFloat() else 0f
    }

    /**
     * Zero Crossing Rate as a proxy for spectral centroid frequency balances
     */
    private fun calculateZeroCrossingRate(samples: ShortArray): Float {
        if (samples.isEmpty()) return 0f
        var crossings = 0
        for (i in 0 until samples.size - 1) {
            if ((samples[i] >= 0 && samples[i + 1] < 0) || (samples[i] < 0 && samples[i + 1] >= 0)) {
                crossings++
            }
        }
        return crossings.toFloat() / samples.size.toFloat()
    }

    /**
     * Root Mean Square (RMS) envelope segments representing speech prosody energy distribution
     */
    private fun calculateEnergyBands(samples: ShortArray): List<Float> {
        val segmentSize = samples.size / 8
        if (segmentSize <= 0) return List(8) { 0f }
        val bands = mutableListOf<Float>()
        for (b in 0 until 8) {
            var sumSquare = 0.0
            val start = b * segmentSize
            for (i in start until start + segmentSize) {
                val s = samples[i].toDouble() / 32768.0
                sumSquare += s * s
            }
            val rms = kotlin.math.sqrt(sumSquare / segmentSize).toFloat()
            bands.add(rms)
        }
        return bands
    }

    /**
     * Calculates the similarity between a query audio block and the enrolled profile.
     * Returns a confidence score between 0.0 (completely different) and 1.0 (exact match).
     */
    fun verifySpeaker(samples: ShortArray, enrolled: SpeakerEmbedding): Float {
        val query = extractEmbedding(samples)
        Log.d(TAG, "Speaker Verification query - Pitch: ${query.averagePitch} Hz, ZCR: ${query.spectralCentroid}")
        Log.d(TAG, "Speaker Verification enrolled - Pitch: ${enrolled.averagePitch} Hz, ZCR: ${enrolled.spectralCentroid}")

        // 1. Pitch similarity (difference ratio)
        val pitchDiff = kotlin.math.abs(query.averagePitch - enrolled.averagePitch)
        val maxPitch = kotlin.math.max(query.averagePitch, enrolled.averagePitch)
        val pitchScore = if (maxPitch > 0) 1.0f - (pitchDiff / maxPitch) else 0f

        // 2. Zero crossing rate similarity
        val zcrDiff = kotlin.math.abs(query.spectralCentroid - enrolled.spectralCentroid)
        val maxZcr = kotlin.math.max(query.spectralCentroid, enrolled.spectralCentroid)
        val zcrScore = if (maxZcr > 0) 1.0f - (zcrDiff / maxZcr) else 0f

        // 3. Energy bands cosine similarity
        var dotProduct = 0f
        var normA = 0f
        var normB = 0f
        for (i in 0 until 8) {
            val a = query.energyBands[i]
            val b = enrolled.energyBands[i]
            dotProduct += a * b
            normA += a * a
            normB += b * b
        }
        val bandScore = if (normA > 0 && normB > 0) {
            dotProduct / (kotlin.math.sqrt(normA) * kotlin.math.sqrt(normB))
        } else 0f

        // Weighted combination: 40% pitch, 20% ZCR, 40% energy envelope similarity
        val similarity = (pitchScore * 0.4f) + (zcrScore * 0.2f) + (bandScore * 0.4f)
        Log.d(TAG, "Speaker Similarity score: $similarity (Threshold: $DEFAULT_THRESHOLD)")
        return similarity
    }

    /**
     * Averages multiple speaker enrollment samples to create a robust speaker voiceprint.
     */
    fun createProfileFromSamples(samples: List<SpeakerEmbedding>): SpeakerEmbedding {
        if (samples.isEmpty()) return SpeakerEmbedding(0f, 0f, emptyList())
        val avgPitch = samples.map { it.averagePitch }.filter { it > 0f }.average().toFloat()
        val avgZcr = samples.map { it.spectralCentroid }.average().toFloat()
        
        val avgBands = mutableListOf<Float>()
        for (i in 0 until 8) {
            val avgBand = samples.map { it.energyBands[i] }.average().toFloat()
            avgBands.add(avgBand)
        }
        return SpeakerEmbedding(avgPitch, avgZcr, avgBands)
    }

    fun saveVoiceProfile(context: Context, profile: SpeakerEmbedding) {
        val sharedPrefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val jsonStr = Json.encodeToString(SpeakerEmbedding.serializer(), profile)
        sharedPrefs.edit().putString(KEY_PROFILE, jsonStr).apply()
        Log.d(TAG, "Voice profile saved successfully locally.")
    }

    fun getVoiceProfile(context: Context): SpeakerEmbedding? {
        val sharedPrefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val jsonStr = sharedPrefs.getString(KEY_PROFILE, null) ?: return null
        return try {
            Json.decodeFromString(SpeakerEmbedding.serializer(), jsonStr)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to decode stored voice profile", e)
            null
        }
    }

    fun deleteVoiceProfile(context: Context) {
        val sharedPrefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        sharedPrefs.edit().remove(KEY_PROFILE).apply()
        Log.d(TAG, "Voice profile deleted from secure storage.")
    }

    fun isSpeakerVerificationEnabled(context: Context): Boolean {
        val sharedPrefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return sharedPrefs.getBoolean(KEY_VERIFICATION_ENABLED, true)
    }

    fun setSpeakerVerificationEnabled(context: Context, enabled: Boolean) {
        val sharedPrefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        sharedPrefs.edit().putBoolean(KEY_VERIFICATION_ENABLED, enabled).apply()
        Log.d(TAG, "Speaker verification toggle set to: $enabled")
    }
}
