package com.example.lifeos.jarvis.wakeword

enum class WakeWordEngineState {
    UNINITIALIZED,
    INITIALIZING,
    READY,
    FAILED
}

interface WakeWordEngine {
    val state: WakeWordEngineState
    val failureReason: String?
    fun initialize()
    fun process(samples: FloatArray, sampleRate: Int): WakeWordHit?
    fun reset()
    fun release()
    fun getRecentTokens(): String = ""
}
