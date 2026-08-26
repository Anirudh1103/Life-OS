package com.example.lifeos.jarvis

import com.example.lifeos.jarvis.wakeword.WakeWord

sealed interface JarvisState {
    data object Disabled : JarvisState
    data object Starting : JarvisState
    data object Listening : JarvisState
    data class DownloadingModel(val progress: Int) : JarvisState
    data class Detected(val wakeWord: WakeWord) : JarvisState
    data class Error(val message: String) : JarvisState
}
