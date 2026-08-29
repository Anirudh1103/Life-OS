package com.example.lifeos.jarvis.speaker

import android.content.Context
import android.util.Log
import kotlinx.serialization.Serializable
import com.example.lifeos.jarvis.audio.toFloatPcm
import com.example.lifeos.data.SupabaseProvider
import io.github.jan.supabase.gotrue.auth

@Serializable
data class SpeakerEmbedding(
    val vector: List<Float>,
    val modelId: String = SpeakerConfig.MODEL_ID,
    val enrolledAt: Long = System.currentTimeMillis(),
    val configVersion: Int = SpeakerConfig.CONFIG_VERSION
)

object JarvisSpeakerVerifier {

    private const val PREFS_NAME = "jarvis_voice_prefs"
    private const val KEY_VERIFICATION_ENABLED = "speaker_verification_enabled"
    private const val TAG = "JARVIS_SPEAKER"

    const val DEFAULT_THRESHOLD = SpeakerConfig.SIMILARITY_THRESHOLD // 0.55f

    fun extractEmbedding(context: Context, samples: ShortArray): SpeakerEmbedding {
        val engine = SpeakerEmbeddingEngine(context.applicationContext)
        val vector = try {
            engine.embed(samples.toFloatPcm()).toList()
        } finally {
            engine.release()
        }
        return SpeakerEmbedding(vector)
    }

    fun createProfileFromSamples(samples: List<SpeakerEmbedding>): SpeakerEmbedding {
        if (samples.isEmpty()) return SpeakerEmbedding(emptyList())
        val floatVectors = samples.map { it.vector.toFloatArray() }
        val avgVector = averageEmbeddings(floatVectors)
        return SpeakerEmbedding(avgVector.toList())
    }

    fun saveVoiceProfile(context: Context, profile: SpeakerEmbedding) {
        val userId = SupabaseProvider.client.auth.currentUserOrNull()?.id ?: "temp_onboarding"
        val store = SpeakerProfileStore(context)
        store.save(userId, SpeakerProfile(profile.vector, profile.modelId, profile.enrolledAt, profile.configVersion))
        Log.d(TAG, "Voice profile saved securely for $userId")
    }

    fun getVoiceProfile(context: Context): SpeakerEmbedding? {
        val userId = SupabaseProvider.client.auth.currentUserOrNull()?.id ?: "temp_onboarding"
        val store = SpeakerProfileStore(context)
        val profile = store.load(userId) ?: store.load("temp_onboarding") ?: return null
        return SpeakerEmbedding(profile.vector, profile.modelId, profile.enrolledAt, profile.configVersion)
    }

    fun deleteVoiceProfile(context: Context) {
        val userId = SupabaseProvider.client.auth.currentUserOrNull()?.id ?: "temp_onboarding"
        val store = SpeakerProfileStore(context)
        store.delete(userId)
        Log.d(TAG, "Voice profile deleted for $userId")
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

    private fun calculateRms(samples: ShortArray): Float {
        var sum = 0.0
        for (s in samples) {
            val normalized = s.toDouble() / 32768.0
            sum += normalized * normalized
        }
        return kotlin.math.sqrt(sum / samples.size).toFloat()
    }

    fun verifySpeaker(context: Context, samples: ShortArray, enrolled: SpeakerEmbedding): Float {
        val rms = calculateRms(samples)
        if (rms < 0.0005f) {
            Log.d(TAG, "Speaker Verification skipped: Signal too weak ($rms)")
            return 0f
        }

        val engine = SpeakerEmbeddingEngine(context.applicationContext)
        val queryVector = try {
            engine.embed(samples.toFloatPcm())
        } finally {
            engine.release()
        }

        val similarity = cosineSimilarity(queryVector, enrolled.vector.toFloatArray())
        Log.d(TAG, "Cosine similarity score: $similarity (Threshold: $DEFAULT_THRESHOLD)")
        return similarity
    }
}
