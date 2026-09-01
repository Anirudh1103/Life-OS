package com.example.lifeos.jarvis.prefs

import android.content.Context
import android.content.SharedPreferences

enum class WakeWordSetupState {
    NOT_CONFIGURED,
    IN_PROGRESS,
    COMPLETED,
    SKIPPED
}

enum class VoiceEnrollmentState {
    NOT_STARTED,
    RECORDING,
    PROCESSING,
    ENROLLED,
    FAILED
}

/**
 * Single location for JARVIS listening / security preferences.
 * Voice embeddings are stored separately by [com.example.lifeos.jarvis.speaker.SpeakerProfileStore].
 */
object JarvisPrefs {
    const val PREFS_NAME = "jarvis_prefs"

    private const val KEY_LISTEN_ENABLED = "wake_word_enabled"
    private const val KEY_SPEAKER_VERIFICATION = "speaker_verification_enabled"
    private const val KEY_COMMAND_TIMEOUT_MS = "command_timeout_ms"
    private const val KEY_DEVELOPER_DIAGNOSTICS = "developer_diagnostics_enabled"
    private const val KEY_SETUP_COMPLETED = "jarvis_setup_completed"
    private const val KEY_INTRO_SEEN = "jarvis_intro_seen"
    private const val KEY_RUN_IN_BACKGROUND = "run_in_background"
    private const val KEY_AUTO_LISTEN_BOOT = "auto_listen_boot"
    private const val KEY_WAKE_WORD_SENSITIVITY = "wake_word_sensitivity"
    private const val KEY_DARK_THEME = "dark_theme_enabled"
    private const val KEY_WAKE_WORD_STATUS = "wake_word_status"

    /** Default: disabled until wakeword setup is completed by user */
    const val DEFAULT_LISTEN_ENABLED = false

    /**
     * After activation, return to wake-word listening if the user does not speak.
     * 8s is long enough for a natural pause after "Hey Jarvis" without leaving STT running.
     */
    const val DEFAULT_COMMAND_TIMEOUT_MS = 8_000L

    fun prefs(context: Context): SharedPreferences =
        context.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    fun isListenEnabled(context: Context): Boolean =
        prefs(context).getBoolean(KEY_LISTEN_ENABLED, DEFAULT_LISTEN_ENABLED)

    fun setListenEnabled(context: Context, enabled: Boolean) {
        prefs(context).edit().putBoolean(KEY_LISTEN_ENABLED, enabled).apply()
    }

    fun isSpeakerVerificationEnabled(context: Context): Boolean =
        prefs(context).getBoolean(KEY_SPEAKER_VERIFICATION, true)

    fun setSpeakerVerificationEnabled(context: Context, enabled: Boolean) {
        prefs(context).edit().putBoolean(KEY_SPEAKER_VERIFICATION, enabled).apply()
    }

    fun commandTimeoutMs(context: Context): Long =
        prefs(context).getLong(KEY_COMMAND_TIMEOUT_MS, DEFAULT_COMMAND_TIMEOUT_MS)

    fun setCommandTimeoutMs(context: Context, timeoutMs: Long) {
        prefs(context).edit().putLong(KEY_COMMAND_TIMEOUT_MS, timeoutMs).apply()
    }

    fun isDeveloperDiagnosticsEnabled(context: Context): Boolean =
        prefs(context).getBoolean(KEY_DEVELOPER_DIAGNOSTICS, false)

    fun setDeveloperDiagnosticsEnabled(context: Context, enabled: Boolean) {
        prefs(context).edit().putBoolean(KEY_DEVELOPER_DIAGNOSTICS, enabled).apply()
    }

    fun isSetupCompleted(context: Context): Boolean =
        prefs(context).getBoolean(KEY_SETUP_COMPLETED, false)

    fun setSetupCompleted(context: Context, completed: Boolean) {
        prefs(context).edit().putBoolean(KEY_SETUP_COMPLETED, completed).apply()
    }

    fun getWakeWordSetupState(context: Context): WakeWordSetupState {
        val raw = prefs(context).getString(KEY_WAKE_WORD_STATUS, WakeWordSetupState.NOT_CONFIGURED.name)
        return try {
            WakeWordSetupState.valueOf(raw ?: WakeWordSetupState.NOT_CONFIGURED.name)
        } catch (_: Exception) {
            WakeWordSetupState.NOT_CONFIGURED
        }
    }

    fun setWakeWordSetupState(context: Context, state: WakeWordSetupState) {
        prefs(context).edit().putString(KEY_WAKE_WORD_STATUS, state.name).apply()
        setSetupCompleted(context, state == WakeWordSetupState.COMPLETED)
    }

    fun getWakeWordStatus(context: Context): String =
        prefs(context).getString(KEY_WAKE_WORD_STATUS, "NOT_CONFIGURED") ?: "NOT_CONFIGURED"

    fun setWakeWordStatus(context: Context, status: String) {
        prefs(context).edit().putString(KEY_WAKE_WORD_STATUS, status).apply()
        setSetupCompleted(context, status == "CONFIGURED" || status == WakeWordSetupState.COMPLETED.name)
    }

    fun hasSeenIntro(context: Context): Boolean =
        prefs(context).getBoolean(KEY_INTRO_SEEN, false)

    fun setIntroSeen(context: Context, seen: Boolean) {
        prefs(context).edit().putBoolean(KEY_INTRO_SEEN, seen).apply()
    }

    fun isRunInBackgroundEnabled(context: Context): Boolean =
        prefs(context).getBoolean(KEY_RUN_IN_BACKGROUND, true)

    fun setRunInBackgroundEnabled(context: Context, enabled: Boolean) {
        prefs(context).edit().putBoolean(KEY_RUN_IN_BACKGROUND, enabled).apply()
    }

    fun isAutoListenBootEnabled(context: Context): Boolean =
        prefs(context).getBoolean(KEY_AUTO_LISTEN_BOOT, false)

    fun setAutoListenBootEnabled(context: Context, enabled: Boolean) {
        prefs(context).edit().putBoolean(KEY_AUTO_LISTEN_BOOT, enabled).apply()
    }

    fun getWakeWordSensitivity(context: Context): Float =
        prefs(context).getFloat(KEY_WAKE_WORD_SENSITIVITY, 0.40f)

    fun setWakeWordSensitivity(context: Context, sensitivity: Float) {
        prefs(context).edit().putFloat(KEY_WAKE_WORD_SENSITIVITY, sensitivity).apply()
    }

    fun isDarkTheme(context: Context): Boolean =
        prefs(context).getBoolean(KEY_DARK_THEME, true)

    fun setDarkTheme(context: Context, enabled: Boolean) {
        prefs(context).edit().putBoolean(KEY_DARK_THEME, enabled).apply()
    }
}
