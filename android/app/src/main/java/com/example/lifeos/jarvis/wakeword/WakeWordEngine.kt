package com.example.lifeos.jarvis.wakeword

import kotlinx.coroutines.flow.Flow

interface WakeWordEngine {

    suspend fun start()

    suspend fun stop()

    fun release()

    val detectedWakeWord: Flow<WakeWord>
}
