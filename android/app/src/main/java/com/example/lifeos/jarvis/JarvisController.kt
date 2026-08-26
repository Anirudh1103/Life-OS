package com.example.lifeos.jarvis

import com.example.lifeos.jarvis.wakeword.WakeWord
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

data class DetectionLog(
    val id: Long,
    val phrase: String,
    val time: String
)

object JarvisController {

    private val _state = MutableStateFlow<JarvisState>(JarvisState.Disabled)
    val state: StateFlow<JarvisState> = _state.asStateFlow()

    private val _detectionsCount = MutableStateFlow(0)
    val detectionsCount: StateFlow<Int> = _detectionsCount.asStateFlow()

    private val _detectionLogs = MutableStateFlow<List<DetectionLog>>(emptyList())
    val detectionLogs: StateFlow<List<DetectionLog>> = _detectionLogs.asStateFlow()

    private val _loadedPhrases = MutableStateFlow<List<String>>(emptyList())
    val loadedPhrases: StateFlow<List<String>> = _loadedPhrases.asStateFlow()

    private var detectionIdCounter = 0L

    fun updateState(newState: JarvisState) {
        _state.value = newState
        if (newState is JarvisState.Detected) {
            _detectionsCount.value += 1
            val timestamp = SimpleDateFormat("HH:mm:ss", Locale.getDefault()).format(Date())
            val phrase = when (newState.wakeWord) {
                WakeWord.JARVIS -> "JARVIS"
                WakeWord.HEY_JARVIS -> "Hey JARVIS"
            }
            val newLog = DetectionLog(
                id = ++detectionIdCounter,
                phrase = phrase,
                time = timestamp
            )
            _detectionLogs.value = listOf(newLog) + _detectionLogs.value.take(29) // Keep last 30 logs
        }
    }

    fun setLoadedPhrases(phrases: List<String>) {
        _loadedPhrases.value = phrases
    }

    fun resetStats() {
        _detectionsCount.value = 0
        _detectionLogs.value = emptyList()
    }
}
