package com.example.lifeos.jarvis.wakeword

import android.content.Context
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

    @Synchronized
    override fun initialize() {
        if (spotter != null) return
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
            keywordsThreshold = com.example.lifeos.jarvis.prefs.JarvisPrefs.getWakeWordSensitivity(appContext),
            numTrailingBlanks = WakeWordConfig.NUM_TRAILING_BLANKS
        )
        spotter = KeywordSpotter(assetManager = appContext.assets, config = config)
        openStream()
        if (stream == null || stream?.ptr == 0L) {
            release()
            throw IllegalStateException("Wake-word graph failed to encode. The keyword file must use UTF-8 BPE tokens.")
        }
        JarvisLog.d("WAKE_WORD_ENGINE_READY", "phrase=${WakeWordConfig.PHRASE} threshold=${WakeWordConfig.KEYWORDS_THRESHOLD}")
    }

    @Synchronized
    override fun process(samples: FloatArray, sampleRate: Int): WakeWordHit? {
        val kws = spotter ?: return null
        val s = stream ?: return null
        s.acceptWaveform(samples, sampleRate)
        var hit: WakeWordHit? = null
        while (kws.isReady(s)) {
            kws.decode(s)
            val result = kws.getResult(s)
            val keyword = result.keyword.trim()
            
            // Diagnostic: Log partial tokens if something is being detected
            if (result.tokens.isNotEmpty()) {
                JarvisLog.d("WAKE_WORD_TOKENS", result.tokens.joinToString(" "))
            }

            if (keyword.isNotEmpty()) {
                val now = System.currentTimeMillis()
                if (keyword == WakeWordConfig.KEYWORD_ALIAS) {
                    kws.reset(s)
                    if (now - lastHitAt >= WakeWordConfig.COOLDOWN_MS) {
                        lastHitAt = now
                        hit = WakeWordHit(keyword = keyword)
                        JarvisLog.d("WAKE_WORD_DETECTED", keyword)
                    }
                } else if (keyword.startsWith("garbage_")) {
                    // Important: DO NOT reset on garbage matches if they are prefixes
                    // But we log it for diagnostics
                    JarvisLog.d("WAKE_WORD_REJECTED_GARBAGE", keyword)
                    // kws.reset(s) // Removing reset to prevent breaking the combined phrase
                } else {
                    JarvisLog.d("WAKE_WORD_PARTIAL_OR_OTHER", keyword)
                }
            }
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
        val keywords = WakeWordConfig.keywordLine()
        JarvisLog.d("WAKE_WORD_KEYWORDS", keywords.replace('\u2581', '_'))
        val created = try {
            kws.createStream(keywords)
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
