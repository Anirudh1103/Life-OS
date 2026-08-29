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

    fun save(userId: String, profile: SpeakerProfile) {
        prefs().edit().putString(KEY_PROFILE + "_$userId", json.encodeToString(SpeakerProfile.serializer(), profile)).apply()
        JarvisLog.d("SPEAKER_PROFILE_SAVED for user $userId")
    }

    fun load(userId: String): SpeakerProfile? {
        val raw = prefs().getString(KEY_PROFILE + "_$userId", null) ?: return null
        return try {
            json.decodeFromString(SpeakerProfile.serializer(), raw)
        } catch (t: Throwable) {
            JarvisLog.e("SPEAKER_PROFILE_DECODE_FAILED for user $userId", t)
            null
        }
    }

    fun delete(userId: String) {
        prefs().edit().remove(KEY_PROFILE + "_$userId").apply()
        JarvisLog.d("SPEAKER_PROFILE_DELETED for user $userId")
    }

    fun hasProfile(userId: String): Boolean = load(userId) != null

    fun migrateTemporaryProfile(userId: String) {
        val temp = load("temp_onboarding")
        if (temp != null) {
            save(userId, temp)
            delete("temp_onboarding")
            JarvisLog.d("SPEAKER_PROFILE_MIGRATED to $userId")
        }
    }

    private val cachedPrefs: SharedPreferences by lazy {
        try {
            val key = MasterKeys.getOrCreate(MasterKeys.AES256_GCM_SPEC)
            EncryptedSharedPreferences.create(
                PREFS_NAME,
                key,
                appContext,
                EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            )
        } catch (t: Throwable) {
            JarvisLog.w("SPEAKER_SECURE_STORE_INIT_FAILED", t.message)
            // If encrypted fails (often due to corrupted keyset), fallback to unencrypted but log it
            appContext.getSharedPreferences(PREFS_NAME_FALLBACK, Context.MODE_PRIVATE)
        }
    }

    private fun prefs(): SharedPreferences = cachedPrefs

    companion object {
        private const val PREFS_NAME = "jarvis_speaker_profile"
        private const val PREFS_NAME_FALLBACK = "jarvis_speaker_profile_fallback"
        private const val KEY_PROFILE = "profile_json"
    }
}
