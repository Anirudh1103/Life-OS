package com.example.lifeos.data

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKeys
import io.github.jan.supabase.gotrue.SessionManager
import io.github.jan.supabase.gotrue.user.UserSession
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

/**
 * Securely persists Supabase authentication sessions using EncryptedSharedPreferences.
 */
class AndroidSessionManager(context: Context) : SessionManager {

    private val masterKeyAlias = MasterKeys.getOrCreate(MasterKeys.AES256_GCM_SPEC)
    
    private val sharedPreferences = EncryptedSharedPreferences.create(
        "lifeos_auth_prefs",
        masterKeyAlias,
        context,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    private val json = Json { ignoreUnknownKeys = true }

    override suspend fun saveSession(session: UserSession) {
        val sessionJson = json.encodeToString(session)
        sharedPreferences.edit().putString("current_session", sessionJson).apply()
        android.util.Log.d("AuthPersistence", "Session saved securely.")
    }

    override suspend fun loadSession(): UserSession? {
        val sessionJson = sharedPreferences.getString("current_session", null) ?: return null
        return try {
            val session = json.decodeFromString<UserSession>(sessionJson)
            android.util.Log.d("AuthPersistence", "Session loaded from secure storage.")
            session
        } catch (e: Exception) {
            android.util.Log.e("AuthPersistence", "Failed to decode saved session", e)
            null
        }
    }

    override suspend fun deleteSession() {
        sharedPreferences.edit().remove("current_session").apply()
        android.util.Log.d("AuthPersistence", "Session cleared from secure storage.")
    }

    /**
     * Quick check to see if a saved session exists in secure storage,
     * without fully deserializing it. Used by AuthViewModel to distinguish
     * "user never logged in" from "session exists but token refresh failed".
     */
    fun hasSession(): Boolean {
        return sharedPreferences.getString("current_session", null) != null
    }

    suspend fun getUserId(): String? {
        return loadSession()?.user?.id
    }
}
