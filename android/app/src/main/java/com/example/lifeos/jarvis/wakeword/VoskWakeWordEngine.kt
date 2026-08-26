package com.example.lifeos.jarvis.wakeword

import android.content.Context
import android.util.Log
import com.example.lifeos.jarvis.JarvisController
import com.example.lifeos.jarvis.JarvisState
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import org.vosk.Model
import org.vosk.Recognizer
import org.vosk.android.RecognitionListener
import org.vosk.android.SpeechService
import java.io.BufferedInputStream
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.net.HttpURLConnection
import java.net.URL
import java.util.zip.ZipInputStream

class VoskWakeWordEngine(
    private val context: Context,
    private val ioDispatcher: CoroutineDispatcher = Dispatchers.IO
) : WakeWordEngine {

    private val _detectedWakeWord = MutableSharedFlow<WakeWord>()
    override val detectedWakeWord: Flow<WakeWord> = _detectedWakeWord.asSharedFlow()

    private var speechService: SpeechService? = null
    private var model: Model? = null
    private var recognizer: Recognizer? = null
    private var isRunning = false

    private val modelUrl = "https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip"
    private val modelDirName = "vosk_model"
    private val zipFileName = "model.zip"

    // Guard cooldown to prevent duplicate triggers in quick succession
    private var lastSpottedTime = 0L
    private val spotCooldownMs = 3000L

    override suspend fun start() = withContext(ioDispatcher) {
        if (isRunning) return@withContext
        isRunning = true
        Log.d("JARVIS", "VoskWakeWordEngine starting...")

        val destDir = File(context.filesDir, modelDirName)
        if (!destDir.exists() || destDir.list()?.isEmpty() == true) {
            destDir.mkdirs()
            try {
                downloadAndExtractModel(destDir)
            } catch (e: Exception) {
                Log.e("JARVIS", "Failed to download and extract Vosk model", e)
                JarvisController.updateState(JarvisState.Error("Voice model download failed. Check internet connection."))
                isRunning = false
                return@withContext
            }
        }

        try {
            if (model == null) {
                Log.d("JARVIS", "Loading Vosk Model from private storage: ${destDir.absolutePath}")
                model = Model(destDir.absolutePath)
            }

            if (recognizer == null) {
                // Initialize Vosk recognizer with a highly restricted grammar for optimal CPU efficiency
                recognizer = Recognizer(model, 16000.0f, "[\"jarvis\", \"hey jarvis\", \"[unk]\"]")
            }

            withContext(Dispatchers.Main) {
                speechService = SpeechService(recognizer, 16000.0f)
                speechService?.startListening(object : RecognitionListener {
                    override fun onResult(hypothesis: String) {
                        checkSpeechHypothesis(hypothesis)
                    }

                    override fun onPartialResult(hypothesis: String) {
                        checkSpeechHypothesis(hypothesis)
                    }

                    override fun onFinalResult(hypothesis: String) {
                        checkSpeechHypothesis(hypothesis)
                    }

                    override fun onError(e: Exception) {
                        Log.e("JARVIS", "Vosk speech engine error", e)
                        JarvisController.updateState(JarvisState.Error("Voice recognition engine failure: ${e.message}"))
                    }

                    override fun onTimeout() {
                        Log.d("JARVIS", "Vosk speech engine listener timeout.")
                    }
                })

                Log.d("JARVIS", "VoskWakeWordEngine listening for wake phrases...")
                JarvisController.updateState(JarvisState.Listening)
            }

        } catch (e: Exception) {
            Log.e("JARVIS", "Failed to initialize Vosk SpeechService", e)
            JarvisController.updateState(JarvisState.Error("Voice Engine failed to start: ${e.message}"))
            isRunning = false
        }
    }

    override suspend fun stop() {
        withContext(Dispatchers.Main) {
            isRunning = false
            speechService?.stop()
            speechService = null
            Log.d("JARVIS", "VoskWakeWordEngine stopped.")
            JarvisController.updateState(JarvisState.Disabled)
        }
    }

    override fun release() {
        isRunning = false
        speechService?.stop()
        speechService = null
        recognizer = null
    }

    private fun checkSpeechHypothesis(hypothesis: String) {
        val now = System.currentTimeMillis()
        if (now - lastSpottedTime < spotCooldownMs) return

        // Hypothesis format can be {"partial" : "jarvis"} or {"text" : "jarvis"}
        val text = hypothesis.lowercase()
        if (text.contains("hey jarvis") || text.contains("hey_jarvis")) {
            lastSpottedTime = now
            CoroutineScope(Dispatchers.IO).launch {
                Log.d("JARVIS", "Wake phrase detected: Hey JARVIS!")
                _detectedWakeWord.emit(WakeWord.HEY_JARVIS)
            }
        } else if (text.contains("jarvis")) {
            lastSpottedTime = now
            CoroutineScope(Dispatchers.IO).launch {
                Log.d("JARVIS", "Wake phrase detected: JARVIS!")
                _detectedWakeWord.emit(WakeWord.JARVIS)
            }
        }
    }

    private fun downloadAndExtractModel(destDir: File) {
        val tempZip = File(context.cacheDir, zipFileName)
        if (tempZip.exists()) tempZip.delete()

        Log.d("JARVIS", "Starting Vosk voice model download: $modelUrl")
        JarvisController.updateState(JarvisState.DownloadingModel(0))

        val url = URL(modelUrl)
        val connection = url.openConnection() as HttpURLConnection
        connection.connect()

        if (connection.responseCode != HttpURLConnection.HTTP_OK) {
            throw java.io.IOException("Server returned HTTP ${connection.responseCode}")
        }

        val fileLength = connection.contentLength
        connection.inputStream.use { input ->
            FileOutputStream(tempZip).use { output ->
                val data = ByteArray(8192)
                var total: Long = 0
                var count: Int
                while (input.read(data).also { count = it } != -1) {
                    total += count
                    if (fileLength > 0) {
                        val progress = ((total * 100) / fileLength).toInt()
                        JarvisController.updateState(JarvisState.DownloadingModel(progress))
                    }
                    output.write(data, 0, count)
                }
            }
        }

        Log.d("JARVIS", "Voice model download complete. Extracting files...")
        JarvisController.updateState(JarvisState.DownloadingModel(100))

        ZipInputStream(BufferedInputStream(FileInputStream(tempZip))).use { zipStream ->
            var entry = zipStream.nextEntry
            while (entry != null) {
                val name = entry.name
                // Strip the top-level directory wrapper from the zip files to unpack directly to destDir
                val cleanName = if (name.startsWith("vosk-model-small-en-us-0.15/")) {
                    name.substring("vosk-model-small-en-us-0.15/".length)
                } else {
                    name
                }

                if (cleanName.isNotEmpty()) {
                    val targetFile = File(destDir, cleanName)
                    if (entry.isDirectory) {
                        targetFile.mkdirs()
                    } else {
                        targetFile.parentFile?.mkdirs()
                        FileOutputStream(targetFile).use { out ->
                            zipStream.copyTo(out)
                        }
                    }
                }
                zipStream.closeEntry()
                entry = zipStream.nextEntry
            }
        }

        tempZip.delete()
        Log.d("JARVIS", "Voice model files extracted successfully into: ${destDir.absolutePath}")
    }
}
