package com.example.lifeos.jarvis.wakeword

enum class WakeWord {
    HEY_JARVIS
}

data class WakeWordHit(
    val wakeWord: WakeWord = WakeWord.HEY_JARVIS,
    val keyword: String,
    val confidence: Float? = null
)
