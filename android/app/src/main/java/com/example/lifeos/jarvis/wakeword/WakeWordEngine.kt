package com.example.lifeos.jarvis.wakeword

interface WakeWordEngine {
    fun initialize()
    fun process(samples: FloatArray, sampleRate: Int): WakeWordHit?
    fun reset()
    fun release()
}
