package com.example.lifeos.jarvis

sealed interface JarvisState {
    data object Disabled : JarvisState
    data object Starting : JarvisState
    data object ListeningForWakeWord : JarvisState
    data class WakeWordDetected(val confidence: Float? = null) : JarvisState
    data object VerifyingSpeaker : JarvisState
    data object ListeningForCommand : JarvisState
    data object Processing : JarvisState
    data object Responding : JarvisState
    data class DownloadingModel(val progress: Int) : JarvisState
    data class Error(
        val message: String,
        val action: ErrorAction = ErrorAction.None
    ) : JarvisState

    enum class ErrorAction {
        None,
        OpenSettings,
        Retry,
        EnrollVoice
    }
}

fun JarvisState.orbVisualState(): String = when (this) {
    JarvisState.Disabled -> "idle"
    JarvisState.Starting -> "idle"
    JarvisState.ListeningForWakeWord -> "idle"
    is JarvisState.WakeWordDetected -> "wake"
    JarvisState.VerifyingSpeaker -> "thinking"
    JarvisState.ListeningForCommand -> "listening"
    JarvisState.Processing -> "thinking"
    JarvisState.Responding -> "listening"
    is JarvisState.DownloadingModel -> "thinking"
    is JarvisState.Error -> "idle"
}

fun JarvisState.debugLabel(): String = when (this) {
    JarvisState.Disabled -> "DISABLED"
    JarvisState.Starting -> "STARTING"
    JarvisState.ListeningForWakeWord -> "LISTENING_FOR_WAKE_WORD"
    is JarvisState.WakeWordDetected -> "WAKE_WORD_DETECTED"
    JarvisState.VerifyingSpeaker -> "VERIFYING_SPEAKER"
    JarvisState.ListeningForCommand -> "LISTENING_FOR_COMMAND"
    JarvisState.Processing -> "PROCESSING"
    JarvisState.Responding -> "RESPONDING"
    is JarvisState.DownloadingModel -> "DOWNLOADING_MODEL"
    is JarvisState.Error -> "ERROR"
}
