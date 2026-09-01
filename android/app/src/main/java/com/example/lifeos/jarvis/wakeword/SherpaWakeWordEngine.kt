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
import java.io.BufferedReader
import java.io.InputStreamReader

data class KeywordValidationResult(
    val alias: String,
    val tokens: List<String>,
    val missingTokens: List<String>,
    val isValid: Boolean
)

/**
 * On-device neural keyword spotter for the complete phrase "Hey Jarvis".
 * Validates BPE token compatibility before initializing native Sherpa-ONNX spotter.
 */
class SherpaWakeWordEngine(
    context: Context
) : WakeWordEngine {

    private val appContext = context.applicationContext
    private var spotter: KeywordSpotter? = null
    private var stream: OnlineStream? = null
    private var lastHitAt = 0L

    private var pcmFeedCount = 0L
    private var lastTokens = ""

    private var _state: WakeWordEngineState = WakeWordEngineState.UNINITIALIZED
    override val state: WakeWordEngineState get() = _state

    private var _failureReason: String? = null
    override val failureReason: String? get() = _failureReason

    @Synchronized
    override fun getRecentTokens(): String = lastTokens

    /**
     * Reads and validates tokens.txt and keywords.txt from assets before native initialization.
     */
    fun validateKeywordAssets(): List<KeywordValidationResult> {
        val vocab = mutableSetOf<String>()
        try {
            appContext.assets.open(WakeWordConfig.ASSET_TOKENS).use { inputStream ->
                BufferedReader(InputStreamReader(inputStream, Charsets.UTF_8)).useLines { lines ->
                    for (line in lines) {
                        val trimmed = line.trim()
                        if (trimmed.isEmpty()) continue
                        val lastSpaceIdx = trimmed.lastIndexOf(' ')
                        if (lastSpaceIdx > 0) {
                            val token = trimmed.substring(0, lastSpaceIdx)
                            vocab.add(token)
                        }
                    }
                }
            }
        } catch (e: Exception) {
            Log.e("JARVIS", "Failed to read tokens.txt from assets", e)
        }

        val results = mutableListOf<KeywordValidationResult>()
        try {
            appContext.assets.open(WakeWordConfig.ASSET_KEYWORDS).use { inputStream ->
                BufferedReader(InputStreamReader(inputStream, Charsets.UTF_8)).useLines { lines ->
                    for (line in lines) {
                        val trimmed = line.trim()
                        if (trimmed.isEmpty()) continue
                        val parts = trimmed.split("@")
                        val phrasePart = parts[0].trim()
                        val alias = if (parts.size > 1) parts[1].trim() else "unknown"
                        val tokenList = phrasePart.split("\\s+".toRegex()).filter { it.isNotBlank() }
                        val missing = tokenList.filter { !vocab.contains(it) }
                        val valid = missing.isEmpty() && tokenList.isNotEmpty()
                        
                        val result = KeywordValidationResult(
                            alias = alias,
                            tokens = tokenList,
                            missingTokens = missing,
                            isValid = valid
                        )
                        results.add(result)

                        Log.i(
                            "JARVIS",
                            "[JARVIS_WAKEWORD_KEYWORD_VALIDATION] alias=$alias tokens=$tokenList missingTokens=$missing valid=$valid"
                        )
                    }
                }
            }
        } catch (e: Exception) {
            Log.e("JARVIS", "Failed to read keywords.txt from assets", e)
        }

        return results
    }

    @Synchronized
    override fun initialize() {
        if (_state == WakeWordEngineState.READY && spotter != null) return
        _state = WakeWordEngineState.INITIALIZING
        _failureReason = null

        try {
            Log.i(
                "JARVIS",
                "[JARVIS_WAKEWORD_INIT] modelType=zipformer2 provider=cpu sampleRate=${WakeWordConfig.SAMPLE_RATE} " +
                "featureDim=${WakeWordConfig.FEATURE_DIM} encoder=${WakeWordConfig.ASSET_ENCODER} " +
                "decoder=${WakeWordConfig.ASSET_DECODER} joiner=${WakeWordConfig.ASSET_JOINER} " +
                "tokens=${WakeWordConfig.ASSET_TOKENS} keywords=${WakeWordConfig.ASSET_KEYWORDS}"
            )

            // Step 1: Pre-validate keyword vocabulary compatibility
            val validations = validateKeywordAssets()
            val invalidKeyword = validations.find { !it.isValid }
            if (invalidKeyword != null) {
                _state = WakeWordEngineState.FAILED
                _failureReason = "KEYWORD_ENCODING_FAILED: alias=${invalidKeyword.alias} missingTokens=${invalidKeyword.missingTokens}"
                Log.e("JARVIS", "[JARVIS_WAKEWORD_INIT_FAILED] $_failureReason")
                return
            }

            if (validations.isEmpty()) {
                _state = WakeWordEngineState.FAILED
                _failureReason = "KEYWORD_ENCODING_FAILED: No valid keywords in ${WakeWordConfig.ASSET_KEYWORDS}"
                Log.e("JARVIS", "[JARVIS_WAKEWORD_INIT_FAILED] $_failureReason")
                return
            }

            // Step 2: Build configuration
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
                maxActivePaths = 20,
                keywordsFile = WakeWordConfig.ASSET_KEYWORDS,
                keywordsScore = WakeWordConfig.KEYWORDS_SCORE,
                keywordsThreshold = WakeWordConfig.KEYWORDS_THRESHOLD,
                numTrailingBlanks = WakeWordConfig.NUM_TRAILING_BLANKS
            )

            // Step 3: Construct KeywordSpotter with defensive error trapping
            spotter = try {
                KeywordSpotter(assetManager = appContext.assets, config = config)
            } catch (t: Throwable) {
                Log.e("JARVIS", "[JARVIS_WAKEWORD_NATIVE_INIT_FAILED]", t)
                null
            }

            if (spotter == null) {
                _state = WakeWordEngineState.FAILED
                _failureReason = "NATIVE_SPOTTER_INSTANTIATION_FAILED"
                Log.e("JARVIS", "[JARVIS_WAKEWORD_INIT_FAILED] $_failureReason")
                return
            }

            // Step 4: Open OnlineStream
            openStream()
            val s = stream
            if (s == null || s.ptr == 0L) {
                release()
                _state = WakeWordEngineState.FAILED
                _failureReason = "STREAM_CREATION_FAILED"
                Log.e("JARVIS", "[JARVIS_WAKEWORD_INIT_FAILED] $_failureReason")
                return
            }

            _state = WakeWordEngineState.READY
            _failureReason = null
            Log.i(
                "JARVIS",
                "[JARVIS_WAKEWORD_INIT_RESULT] spotter=SUCCESS stream=SUCCESS streamPtr=${s.ptr} ready=true"
            )
        } catch (e: Exception) {
            _state = WakeWordEngineState.FAILED
            _failureReason = "INIT_CRITICAL_EXCEPTION: ${e.message}"
            Log.e("JARVIS", "[JARVIS_WAKEWORD_ENGINE_INIT_CRITICAL_ERROR]", e)
            release()
        }
    }

    @Synchronized
    override fun process(samples: FloatArray, sampleRate: Int): WakeWordHit? {
        val kws = spotter ?: return null
        val s = stream ?: return null
        if (_state != WakeWordEngineState.READY) return null

        s.acceptWaveform(samples, sampleRate)
        pcmFeedCount++

        if (pcmFeedCount % 100 == 0L) {
            var sum = 0.0
            for (f in samples) sum += f * f
            val rms = kotlin.math.sqrt(sum / samples.size)
            var peak = 0.0
            for (f in samples) peak = maxOf(peak, kotlin.math.abs(f).toDouble())
            Log.d(
                "JARVIS",
                "STREAMING_STATE: frame=$pcmFeedCount rms=${String.format(java.util.Locale.US, "%.4f", rms)} " +
                "peak=${String.format(java.util.Locale.US, "%.4f", peak)} stream_alive=${s.ptr != 0L}"
            )
        }

        var hit: WakeWordHit? = null
        var decodeCount = 0
        while (kws.isReady(s)) {
            kws.decode(s)
            decodeCount++

            if (decodeCount > 0 && pcmFeedCount % 100 == 0L) {
                Log.d("JARVIS", "STREAMING_DECODE: frame=$pcmFeedCount decodes_this_frame=$decodeCount")
            }

            val result = kws.getResult(s)
            val keyword = result.keyword.trim()

            if (result.tokens.isNotEmpty()) {
                val tokenStr = result.tokens.joinToString(" ")
                lastTokens = tokenStr
                Log.d("JARVIS", "WAKE_WORD_TOKENS: [$tokenStr] keyword=\"$keyword\"")
            }

            if (keyword.isNotEmpty()) {
                val tokensDetected = result.tokens.joinToString(" ")
                Log.d(
                    "JARVIS",
                    "KEYWORD_MATCHING: keyword_from_model=\"$keyword\" tokens_from_model=[$tokensDetected] " +
                    "last_seen_tokens=[$lastTokens] frameCount=$pcmFeedCount"
                )

                val now = System.currentTimeMillis()
                val isHeyJarvis = keyword.equals(WakeWordConfig.KEYWORD_ALIAS, ignoreCase = true) ||
                                  keyword.contains(WakeWordConfig.KEYWORD_ALIAS, ignoreCase = true)

                if (isHeyJarvis) {
                    val timeSinceLastHit = now - lastHitAt
                    if (timeSinceLastHit >= WakeWordConfig.COOLDOWN_MS) {
                        lastHitAt = now
                        hit = WakeWordHit(keyword = keyword)
                        Log.i("JARVIS", "WAKE_WORD_DETECTED: $keyword (Type: ACTIVATE)")
                    } else {
                        Log.d("JARVIS", "WAKE_WORD_COOLDOWN_SUPPRESSED: $keyword (${timeSinceLastHit}ms < ${WakeWordConfig.COOLDOWN_MS}ms)")
                    }
                    // Only reset stream on genuine wake-word match
                    kws.reset(s)
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
        _state = WakeWordEngineState.UNINITIALIZED
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
            Log.e("JARVIS", "WAKE_WORD_STREAM_FAILED", t)
            null
        }
        if (created == null || created.ptr == 0L) {
            Log.e("JARVIS", "WAKE_WORD_STREAM_INVALID")
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
