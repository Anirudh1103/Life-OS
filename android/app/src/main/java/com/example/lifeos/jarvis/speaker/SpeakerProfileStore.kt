package com.example.lifeos.jarvis.speaker

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKeys
import com.example.lifeos.jarvis.logging.JarvisLog
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

@Serializable
data class SpeakerProfile(
    val vector: List<Float>,
    val modelId: String,
    val enrolledAt: Long,
    val configVersion: Int = SpeakerConfig.CONFIG_VERSION
)

class SpeakerProfileStore(context: Context) {
    private val appContext = context.applicationContext
    private val json = Json { ignoreUnknownKeys = true }

    fun save(profile: SpeakerProfile) {
        prefs().edit().putString(KEY_PROFILE, json.encodeToString(SpeakerProfile.serializer(), profile)).apply()
        JarvisLog.d("SPEAKER_PROFILE_SAVED")
    }

    fun load(): SpeakerProfile? {
        val raw = prefs().getString(KEY_PROFILE, null) ?: return null
        return try {
            json.decodeFromString(SpeakerProfile.serializer(), raw)
        } catch (t: Throwable) {
            JarvisLog.e("SPEAKER_PROFILE_DECODE_FAILED", t)
            null
        }
    }

    fun delete() {
        prefs().edit().remove(KEY_PROFILE).apply()
        JarvisLog.d("SPEAKER_PROFILE_DELETED")
    }

    fun hasProfile(): Boolean = load() != null

    private fun prefs(): SharedPreferences {
        return try {
            val key = MasterKeys.getOrCreate(MasterKeys.AES256_GCM_SPEC)
            EncryptedSharedPreferences.create(
                PREFS_NAME,
                key,
                appContext,
                EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            )
        } catch (t: Throwable) {
            JarvisLog.w("SPEAKER_SECURE_STORE_FALLBACK", t.message)
            appContext.getSharedPreferences(PREFS_NAME_FALLBACK, Context.MODE_PRIVATE)
        }
    }

    companion object {
        private const val PREFS_NAME = "jarvis_speaker_profile"
        private const val PREFS_NAME_FALLBACK = "jarvis_speaker_profile_fallback"
        private const val KEY_PROFILE = "profile_json"
    }
}
