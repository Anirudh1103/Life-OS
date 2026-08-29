package com.example.lifeos.jarvis

import com.example.lifeos.jarvis.brain.MultiModelBrain
import com.example.lifeos.jarvis.command.JarvisCommandRouter
import com.example.lifeos.jarvis.command.CommandResult
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import io.github.jan.supabase.gotrue.auth
import com.example.lifeos.data.SupabaseProvider
import android.content.Context
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

data class DetectionLog(
    val id: Long,
    val phrase: String,
    val time: String
)

@kotlinx.serialization.Serializable
data class ChatMessage(
    val role: String, // "user" or "assistant"
    val content: String,
    val timestamp: Long = System.currentTimeMillis()
)

object JarvisController {

    private val scope = CoroutineScope(Dispatchers.Main)
    private var brain: MultiModelBrain? = null
    private var appContext: Context? = null
    private var commandRouter: JarvisCommandRouter? = null
    private var chatTts: TextToSpeech? = null
    private var isChatTtsReady = false
    private var pendingSpeech: String? = null

    private val _activeSpeakingTimestamp = MutableStateFlow<Long?>(null)
    val activeSpeakingTimestamp: StateFlow<Long?> = _activeSpeakingTimestamp.asStateFlow()

    private val _isPaused = MutableStateFlow(false)
    val isPaused: StateFlow<Boolean> = _isPaused.asStateFlow()

    private var speakableSentences: List<String> = emptyList()
    private var currentSentenceIdx = 0

    private val _messages = MutableStateFlow<List<ChatMessage>>(listOf(
        ChatMessage("assistant", "Good day, Sir. I am JARVIS. How can I assist you today?")
    ))
    val messages: StateFlow<List<ChatMessage>> = _messages.asStateFlow()

    fun initialize(context: Context, newBrain: MultiModelBrain) {
        appContext = context.applicationContext
        brain = newBrain
        commandRouter = JarvisCommandRouter(context.applicationContext)
        chatTts = TextToSpeech(appContext) { status ->
            isChatTtsReady = status == TextToSpeech.SUCCESS
            if (isChatTtsReady) {
                chatTts?.language = Locale.US
                chatTts?.setPitch(0.70f)
                chatTts?.setSpeechRate(1.1f)

                try {
                    val voices = chatTts?.voices
                    val preferredVoice = voices?.filter { 
                        val name = it.name.lowercase(Locale.ROOT)
                        !name.contains("female") && !name.contains("girl") && !name.contains("woman")
                    }?.find { 
                        val name = it.name.lowercase(Locale.ROOT)
                        (name.contains("en-gb") && (name.contains("male") || name.contains("danny") || name.contains("oliver") || name.contains("fis"))) ||
                        name.contains("en-us-x-iom") || 
                        name.contains("en-us-x-iol")
                    } ?: voices?.filter { !it.name.lowercase(Locale.ROOT).contains("female") }
                      ?.find { it.name.lowercase(Locale.ROOT).contains("male") }
                      ?: voices?.find { it.locale.language == "en" && it.locale.country == "GB" && it.name.lowercase(Locale.ROOT).contains("fis") }
                      ?: voices?.find { it.locale.language == "en" && it.locale.country == "GB" }
                      ?: voices?.firstOrNull { it.locale.language == "en" }

                    if (preferredVoice != null) {
                        chatTts?.voice = preferredVoice
                        android.util.Log.i("JARVIS", "Selected Chat TTS voice: ${preferredVoice.name}")
                    }
                } catch (e: Exception) {
                    android.util.Log.e("JARVIS", "Failed to select preferred TTS voice", e)
                }

                pendingSpeech?.let {
                    pendingSpeech = null
                    speakMessage(it)
                }
            } else {
                android.util.Log.e("JARVIS", "Chat TTS initialization failed: $status")
            }
        }.apply {
            setOnUtteranceProgressListener(object : UtteranceProgressListener() {
                override fun onStart(utteranceId: String?) {
                    setSpeaking(true)
                }
                override fun onDone(utteranceId: String?) {
                    if (_isPaused.value) return
                    scope.launch(Dispatchers.Main) {
                        currentSentenceIdx++
                        speakCurrentSentence()
                    }
                }
                @Deprecated("Deprecated in Java")
                override fun onError(utteranceId: String?) {
                    scope.launch(Dispatchers.Main) {
                        stopMessage()
                    }
                }
                override fun onError(utteranceId: String?, errorCode: Int) {
                    scope.launch(Dispatchers.Main) {
                        stopMessage()
                    }
                }
            })
        }
    }

    private val _state = MutableStateFlow<JarvisState>(JarvisState.Disabled)
    val state: StateFlow<JarvisState> = _state.asStateFlow()

    private val _detectionsCount = MutableStateFlow(0)
    val detectionsCount: StateFlow<Int> = _detectionsCount.asStateFlow()

    private val _detectionLogs = MutableStateFlow<List<DetectionLog>>(emptyList())
    val detectionLogs: StateFlow<List<DetectionLog>> = _detectionLogs.asStateFlow()

    private val _loadedPhrases = MutableStateFlow<List<String>>(emptyList())
    val loadedPhrases: StateFlow<List<String>> = _loadedPhrases.asStateFlow()

    private val _lastResponse = MutableStateFlow<String?>(null)
    val lastResponse: StateFlow<String?> = _lastResponse.asStateFlow()

    private val _isSpeaking = MutableStateFlow(false)
    val isSpeaking: StateFlow<Boolean> = _isSpeaking.asStateFlow()

    private val _shouldSpeakResponse = MutableStateFlow(false)
    val shouldSpeakResponse: StateFlow<Boolean> = _shouldSpeakResponse.asStateFlow()

    private var detectionIdCounter = 0L

    private val _lastSpeakerScore = MutableStateFlow<Float?>(null)
    val lastSpeakerScore: StateFlow<Float?> = _lastSpeakerScore.asStateFlow()

    private val _audioPipelineStatus = MutableStateFlow("stopped")
    val audioPipelineStatus: StateFlow<String> = _audioPipelineStatus.asStateFlow()

    fun setAudioPipelineStatus(status: String) {
        _audioPipelineStatus.value = status
    }

    fun setLastSpeakerScore(score: Float?) {
        _lastSpeakerScore.value = score
    }

    fun updateState(newState: JarvisState) {
        _state.value = newState
        if (newState is JarvisState.WakeWordDetected) {
            _detectionsCount.value += 1
            val timestamp = SimpleDateFormat("HH:mm:ss", Locale.getDefault()).format(Date())
            val newLog = DetectionLog(
                id = ++detectionIdCounter,
                phrase = "Hey Jarvis",
                time = timestamp
            )
            _detectionLogs.value = listOf(newLog) + _detectionLogs.value.take(29)
        }
    }

    fun setLoadedPhrases(phrases: List<String>) {
        _loadedPhrases.value = phrases
    }

    fun completeTask(taskId: String) {
        scope.launch {
            val repository = com.example.lifeos.data.SupabaseRepository()
            repository.updateTask(taskId, true)
            // Optional: Refresh context or add a system message
        }
    }

    fun triggerMorningBriefing() {
        processQuery("Good morning", isVoiceQuery = true)
    }

    fun processQuery(query: String, customResponse: String? = null, isVoiceQuery: Boolean = false) {
        _shouldSpeakResponse.value = isVoiceQuery

        if (query.isBlank() && customResponse != null) {
            // Replay mode: just trigger speech/pill without adding to history
            _lastResponse.value = customResponse
            return
        }

        // Add user message to history
        _messages.value = _messages.value + ChatMessage("user", query)

        if (customResponse != null) {
            _lastResponse.value = customResponse
            _messages.value = _messages.value + ChatMessage("assistant", customResponse)
            return
        }

        // 1. Try local Command Router first
        val localResult = commandRouter?.routeCommand(query)
        if (localResult is CommandResult.Success) {
            _lastResponse.value = localResult.response
            _messages.value = _messages.value + ChatMessage("assistant", localResult.response)
            return
        }

        // 2. If not deterministic, fall back to AI Brain
        // Immediate UI feedback
        _lastResponse.value = "Processing..."

        scope.launch {
            val user = SupabaseProvider.client.auth.currentUserOrNull()
            if (user == null) {
                val err = "You must be logged in for me to access your neural data."
                _lastResponse.value = err
                _messages.value = _messages.value + ChatMessage("assistant", err)
                return@launch
            }

            val repository = com.example.lifeos.data.SupabaseRepository()
            val contextSnapshot = repository.getIntelligenceSnapshot(user.id)

            try {
                val response = brain?.processQuery(query, contextSnapshot)

                if (response != null) {
                    _lastResponse.value = response.speech
                    _messages.value = _messages.value + ChatMessage("assistant", response.speech)
                    handleAction(response.action, user.id)
                } else {
                    val err = "My cognitive processors are offline. Please check that you have configured at least one AI provider (Gemini, Groq, or OpenRouter) in your local.properties file."
                    _lastResponse.value = err
                    _messages.value = _messages.value + ChatMessage("assistant", err)
                }
            } catch (e: Exception) {
                val err = "I apologize. I encountered an error: ${e.message ?: "Unknown error"}. Please verify your API keys are valid."
                _lastResponse.value = err
                _messages.value = _messages.value + ChatMessage("assistant", err)
                android.util.Log.e("JARVIS", "Error processing query", e)
            }
        }
    }

    fun togglePlayPause(message: ChatMessage) {
        if (_activeSpeakingTimestamp.value == message.timestamp) {
            if (_isPaused.value) {
                resumeMessage()
            } else if (_isSpeaking.value) {
                pauseMessage()
            } else {
                startSpeakingMessage(message)
            }
        } else {
            startSpeakingMessage(message)
        }
    }

    fun startSpeakingMessage(message: ChatMessage) {
        stopMessage()

        _activeSpeakingTimestamp.value = message.timestamp
        _isPaused.value = false

        // Clean suggestion chips & commands
        val cleanLines = message.content.split("\n")
            .filter { line ->
                val trimmed = line.trim()
                if (trimmed.isEmpty()) return@filter false
                if (trimmed.startsWith("[COMMAND:")) return@filter false
                val isChip = trimmed.matches(Regex("^\\[([^\\[\\]]+)\\]$")) && 
                             !trimmed.startsWith("[ ]") && 
                             !trimmed.startsWith("[x]")
                !isChip
            }
            .joinToString("\n")

        val cleanText = cleanLines
            .replace("```", " ")
            .replace(Regex("""\(ID: [a-f0-9-]+\)"""), "") // Robustly remove task IDs
            .replace(Regex("(?m)^\\s*[-*+]\\s+"), "")
            .replace(Regex("(?m)^\\s*\\d+[.)]\\s+"), "")
            .replace(Regex("(?m)^\\s*[-*]\\s*\\[[ xX]\\]\\s*"), "")
            .replace(Regex("\\*{1,3}|`|#{1,6}|_"), "")
            .replace(Regex("\\s+"), " ")
            .trim()

        if (cleanText.isBlank()) {
            stopMessage()
            return
        }

        speakableSentences = cleanText.split(Regex("(?<=[.?!])\\s+")).filter { it.isNotBlank() }
        currentSentenceIdx = 0

        if (speakableSentences.isEmpty()) {
            stopMessage()
            return
        }

        if (!isChatTtsReady || chatTts == null) {
            android.util.Log.w("JARVIS", "Chat TTS is not ready.")
            stopMessage()
            return
        }

        setSpeaking(true)
        speakCurrentSentence()
    }

    private fun speakCurrentSentence() {
        val tts = chatTts ?: return
        if (currentSentenceIdx >= speakableSentences.size) {
            stopMessage()
            return
        }

        val sentence = speakableSentences[currentSentenceIdx]
        val params = android.os.Bundle().apply {
            putString(TextToSpeech.Engine.KEY_PARAM_UTTERANCE_ID, "jarvis_sentence_$currentSentenceIdx")
        }
        tts.speak(sentence, TextToSpeech.QUEUE_FLUSH, params, "jarvis_sentence_$currentSentenceIdx")
    }

    fun pauseMessage() {
        _isPaused.value = true
        chatTts?.stop()
        setSpeaking(false)
    }

    fun resumeMessage() {
        _isPaused.value = false
        setSpeaking(true)
        speakCurrentSentence()
    }

    fun stopMessage() {
        chatTts?.stop()
        _isPaused.value = false
        setSpeaking(false)
        _activeSpeakingTimestamp.value = null
        speakableSentences = emptyList()
        currentSentenceIdx = 0
    }

    /**
     * Replays a visible chat response through Android's system TTS engine.
     * This intentionally does not depend on the wake-word foreground service:
     * the chat can be used while always-listening is disabled.
     */
    fun speakMessage(message: String) {
        val dummyMsg = ChatMessage("assistant", message, timestamp = 0L)
        startSpeakingMessage(dummyMsg)
    }

    private fun handleAction(action: com.example.lifeos.jarvis.brain.JarvisAction?, userId: String) {
        if (action == null) return

        android.util.Log.d("JARVIS", "Executing action: ${action.type} with data ${action.data}")

        val context = appContext ?: return

        when (action.type) {
            "SET_ALARM" -> {
                val time = action.data["time"] // Expected format HH:mm
                if (time != null) {
                    try {
                        val parts = time.split(":")
                        val hour = parts[0].toInt()
                        val min = parts[1].toInt()
                        val calendar = java.util.Calendar.getInstance().apply {
                            set(java.util.Calendar.HOUR_OF_DAY, hour)
                            set(java.util.Calendar.MINUTE, min)
                            set(java.util.Calendar.SECOND, 0)
                            if (timeInMillis < System.currentTimeMillis()) {
                                add(java.util.Calendar.DAY_OF_YEAR, 1)
                            }
                        }
                        com.example.lifeos.alarm.AlarmController.setAlarm(context, calendar.timeInMillis)
                    } catch (e: Exception) {
                        android.util.Log.e("JARVIS", "Failed to set alarm for $time", e)
                    }
                }
            }
            "ADD_TASK" -> {
                val title = action.data["title"] ?: "New Task"
                val priority = action.data["priority"] ?: "none"
                val workspace = action.data["workspace"] ?: "personal"
                
                scope.launch {
                    val repository = com.example.lifeos.data.SupabaseRepository()
                    repository.createTask(com.example.lifeos.data.models.Task(
                        id = java.util.UUID.randomUUID().toString(),
                        user_id = userId,
                        title = title,
                        priority = priority,
                        workspace = workspace
                    ))
                }
            }
        }
    }

    fun setSpeaking(speaking: Boolean) {
        _isSpeaking.value = speaking
    }

    fun clearResponse() {
        _lastResponse.value = null
    }

    fun resetStats() {
        _detectionsCount.value = 0
        _detectionLogs.value = emptyList()
    }
}
