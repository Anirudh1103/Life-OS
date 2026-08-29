package com.example.lifeos.jarvis.command

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import com.example.lifeos.jarvis.logging.JarvisLog
import java.util.Locale

/**
 * Speech-to-text used only after wake-word + speaker verification.
 * Never used as the always-on wake-word detector.
 */
class JarvisCommandListener(
    private val context: Context
) {
    fun interface Callback {
        fun onFinished(transcript: String?)
    }

    private var recognizer: SpeechRecognizer? = null
    private val mainHandler = Handler(Looper.getMainLooper())

    fun start(timeoutMs: Long, callback: Callback) {
        stop()
        if (!SpeechRecognizer.isRecognitionAvailable(context)) {
            JarvisLog.w("COMMAND_STT_UNAVAILABLE")
            callback.onFinished(null)
            return
        }
        val timeout = Runnable {
            JarvisLog.d("COMMAND_TIMEOUT")
            stop()
            callback.onFinished(null)
        }
        mainHandler.post {
            JarvisLog.d("JARVIS_AUDIO_ROUTE", "stage=STT requested=TYPE_BUILTIN_MIC actual=TYPE_BUILTIN_MIC")
            val speech = SpeechRecognizer.createSpeechRecognizer(context)
            recognizer = speech
            speech.setRecognitionListener(object : RecognitionListener {
                override fun onReadyForSpeech(params: Bundle?) = Unit
                override fun onBeginningOfSpeech() = Unit
                override fun onRmsChanged(rmsdB: Float) = Unit
                override fun onBufferReceived(buffer: ByteArray?) = Unit
                override fun onEndOfSpeech() = Unit
                override fun onError(error: Int) {
                    mainHandler.removeCallbacks(timeout)
                    JarvisLog.d("COMMAND_STT_ERROR", "code=$error")
                    stop()
                    callback.onFinished(null)
                }
                override fun onResults(results: Bundle?) {
                    mainHandler.removeCallbacks(timeout)
                    val text = results
                        ?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                        ?.firstOrNull()
                        ?.trim()
                    stop()
                    callback.onFinished(text?.takeIf { it.isNotEmpty() })
                }
                override fun onPartialResults(partialResults: Bundle?) = Unit
                override fun onEvent(eventType: Int, params: Bundle?) = Unit
            })
            val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                putExtra(RecognizerIntent.EXTRA_LANGUAGE, Locale.getDefault())
                putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, false)
                putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
            }
            speech.startListening(intent)
            mainHandler.postDelayed(timeout, timeoutMs)
        }
    }

    fun stop() {
        mainHandler.removeCallbacksAndMessages(null)
        try {
            recognizer?.cancel()
            recognizer?.destroy()
        } catch (_: Exception) {
        }
        recognizer = null
    }
}
