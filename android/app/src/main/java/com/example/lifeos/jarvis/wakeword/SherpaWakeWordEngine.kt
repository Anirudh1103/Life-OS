package com.example.lifeos.jarvis.wakeword

import android.content.Context
import android.util.Log
import com.example.lifeos.jarvis.logging.JarvisLog
import com.k2fsa.sherpa.onnx.KeywordSpotter
import com.k2fsa.sherpa.onnx.KeywordSpotterConfig
import com.k2fsa.sherpa.onnx.OnlineModelConfig
import com.k2fsa.sherpa.onnx.OnlineStream
import com.k2fsa.sherpa.onnx.OnlineTransducerModelConfig
import com.k2fsa.sherpa.onnx.getFeatureConfig

/**
 * On-device neural keyword spotter for the complete phrase "Hey Jarvis".
 * Does not use SpeechRecognizer, string matching, Gemini, or network audio.
 */
class SherpaWakeWordEngine(
    context: Context
) : WakeWordEngine {

    private val appContext = context.applicationContext
    private var spotter: KeywordSpotter? = null
    private var stream: OnlineStream? = null
    private var lastHitAt = 0L

    private var pcmFeedCount = 0L

    @Synchronized
    override fun initialize() {
        if (spotter != null) return
        JarvisLog.d("JARVIS_WAKEWORD_MODEL_LOADING", "model=Zipformer2 keywords=${WakeWordConfig.ASSET_KEYWORDS}")
        val config = KeywordSpotterConfig(
            featConfig = getFeatureConfig(
                sampleRate = WakeWordConfig.SAMPLE_RATE,
                featureDim = WakeWordConfig.FEATURE_DIM
            ),
            modelConfig = OnlineModelConfig(
                transducer = OnlineTransducerModelConfig(
                    encoder = WakeWordConfig.ASSET_ENCODER,
                    decoder = WakeWordConfig.ASSET_DECODER,
                    joiner = WakeWordConfig.ASSET_JOINER
                ),
                tokens = WakeWordConfig.ASSET_TOKENS,
                numThreads = WakeWordConfig.NUM_THREADS,
                provider = "cpu",
                modelType = "zipformer2"
            ),
            maxActivePaths = 10,
            keywordsFile = WakeWordConfig.ASSET_KEYWORDS,
            keywordsScore = WakeWordConfig.KEYWORDS_SCORE,
            keywordsThreshold = WakeWordConfig.KEYWORDS_THRESHOLD,
            numTrailingBlanks = WakeWordConfig.NUM_TRAILING_BLANKS
        )
        spotter = KeywordSpotter(assetManager = appContext.assets, config = config)
        JarvisLog.d("JARVIS_WAKEWORD_MODEL_LOADED")
        openStream()
        if (stream == null || stream?.ptr == 0L) {
            release()
            JarvisLog.e("JARVIS_WAKEWORD_ENGINE_INIT_FAILED", "Wake-word stream failed to encode BPE tokens")
            throw IllegalStateException("Wake-word graph failed to encode. The keyword file must use UTF-8 BPE tokens.")
        }
        JarvisLog.d("JARVIS_WAKEWORD_ENGINE_INITIALIZED", "phrase=${WakeWordConfig.PHRASE} threshold=${WakeWordConfig.KEYWORDS_THRESHOLD} boost=${WakeWordConfig.KEYWORDS_SCORE}")
    }

    @Synchronized
    override fun process(samples: FloatArray, sampleRate: Int): WakeWordHit? {
        val kws = spotter ?: return null
        val s = stream ?: return null
        s.acceptWaveform(samples, sampleRate)

        pcmFeedCount++
        if (pcmFeedCount % 30 == 0L) {
            val ready = kws.isReady(s)
            JarvisLog.d("JARVIS_WAKEWORD_PCM_FEED", "samples=${samples.size} totalFrames=$pcmFeedCount ready=$ready")
        }

        var hit: WakeWordHit? = null
        var decodeCount = 0
        while (kws.isReady(s)) {
            decodeCount++
            kws.decode(s)
            val result = kws.getResult(s)
            val keyword = result.keyword.trim()
            
            // Diagnostic: Log partial tokens if something is being detected
            if (result.tokens.isNotEmpty()) {
                Log.d("JARVIS", "WAKE_WORD_TOKENS: [${result.tokens.joinToString(" ")}] result=\"$keyword\"")
            }

            if (keyword.isNotEmpty()) {
                val now = System.currentTimeMillis()
                val isMatched = keyword.equals(WakeWordConfig.KEYWORD_ALIAS, ignoreCase = true) ||
                        keyword.contains("hey_jarvis", ignoreCase = true) ||
                        keyword.contains("jarvis", ignoreCase = true) ||
                        keyword.contains("JA", ignoreCase = false)

                if (isMatched) {
                    val timeSinceLastHit = now - lastHitAt
                    if (timeSinceLastHit >= WakeWordConfig.COOLDOWN_MS) {
                        lastHitAt = now
                        kws.reset(s)
                        hit = WakeWordHit(keyword = keyword)
                        Log.i("JARVIS", "WAKE_WORD_DETECTED: $keyword (Sensitivity: ${WakeWordConfig.KEYWORDS_THRESHOLD}) timeSinceLastHit=${timeSinceLastHit}ms")
                    } else {
                        Log.d("JARVIS", "WAKE_WORD_DETECTED_BUT_COOLDOWN: $keyword timeSinceLastHit=${timeSinceLastHit}ms cooldown=${WakeWordConfig.COOLDOWN_MS}ms")
                    }
                } else if (keyword.startsWith("garbage_")) {
                    Log.d("JARVIS", "WAKE_WORD_PARTIAL_MATCH: $keyword")
                } else {
                    Log.d("JARVIS", "WAKE_WORD_RESULT: $keyword (Tokens: ${result.tokens.joinToString(" ")})")
                }
            }
        }
        
        if (decodeCount > 1) {
            Log.d("JARVIS", "WAKE_WORD_MULTIPLE_DECODES: count=$decodeCount")
        }
        
        return hit
    }

    @Synchronized
    override fun reset() {
        stream?.let { spotter?.reset(it) }
    }

    @Synchronized
    override fun release() {
        try {
            stream?.release()
        } catch (_: Exception) {
        }
        stream = null
        try {
            spotter?.release()
        } catch (_: Exception) {
        }
        spotter = null
    }

    private fun openStream() {
        val kws = spotter ?: return
        try {
            stream?.release()
        } catch (_: Exception) {
        }
        stream = null
        val created = try {
            kws.createStream()
        } catch (t: Throwable) {
            JarvisLog.e("WAKE_WORD_STREAM_FAILED", t)
            null
        }
        if (created == null || created.ptr == 0L) {
            JarvisLog.e("WAKE_WORD_STREAM_INVALID")
            try {
                created?.release()
            } catch (_: Exception) {
            }
            stream = null
            return
        }
        stream = created
    }
}
