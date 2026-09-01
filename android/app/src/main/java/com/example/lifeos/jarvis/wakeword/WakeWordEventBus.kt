package com.example.lifeos.jarvis.wakeword

import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow

object WakeWordEventBus {
    private val _events = MutableSharedFlow<WakeWordHit>(extraBufferCapacity = 16)
    val events = _events.asSharedFlow()

    private val _runtimeState = MutableStateFlow(WakeWordRuntimeState.DISABLED)
    val runtimeState = _runtimeState.asStateFlow()

    private val _currentRms = MutableStateFlow(0.0)
    val currentRms = _currentRms.asStateFlow()

    private val _lastTokens = MutableStateFlow("")
    val lastTokens = _lastTokens.asStateFlow()

    fun emitHit(hit: WakeWordHit) {
        _events.tryEmit(hit)
    }

    fun updateRuntimeState(state: WakeWordRuntimeState) {
        _runtimeState.value = state
    }

    fun updateAudioMetrics(rms: Double, tokens: String) {
        _currentRms.value = rms
        if (tokens.isNotBlank()) {
            _lastTokens.value = tokens
        }
    }
}
