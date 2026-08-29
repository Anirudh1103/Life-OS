package com.example.lifeos.jarvis.wakeword

/**
 * Central wake-word configuration for sherpa-onnx KeywordSpotter.
 *
 * The engine is a constrained neural keyword spotter (not SpeechRecognizer and not
 * `text.contains(...)`). The keyword is the full BPE sequence for "Hey Jarvis":
 *
 *   ▁HE Y ▁JA R V IS
 *
 * That sequence is required in order. Partial phrases such as "Hey" (▁HE Y) or
 * "Jarvis" (▁JA R V IS) do not complete the keyword graph.
 *
 * Sherpa-onnx defaults (see KeywordSpotterConfig):
 * - keywordsScore = 1.5f     (token boosting; higher → easier to trigger)
 * - keywordsThreshold = 0.25f (acoustic threshold; higher → harder to trigger)
 *
 * We bias toward fewer false activations:
 * - Lower boost than the library default
 * - Higher threshold than the library default
 *
 * Do not lower these values to chase quiet-speech recall.
 */
object WakeWordConfig {
    const val PHRASE = "Hey Jarvis"
    const val KEYWORD_ALIAS = "hey_jarvis"

    const val KEYWORD_BPE = "\u2581HE Y \u2581JA R V I S"

    fun keywordLine(): String = "$KEYWORD_BPE @$KEYWORD_ALIAS"

    const val SAMPLE_RATE = 16_000
    const val FEATURE_DIM = 80
    const val NUM_THREADS = 1
    const val FRAME_MS = 100

    /**
     * Token boosting. Standard 3.0f for highly responsive detection.
     */
    const val KEYWORDS_SCORE = 3.0f

    /**
     * Detection threshold. Standard 0.05f for maximum sensitivity.
     */
    const val KEYWORDS_THRESHOLD = 0.05f

    const val NUM_TRAILING_BLANKS = 2

    const val ASSET_ENCODER = "kws/encoder.int8.onnx"
    const val ASSET_DECODER = "kws/decoder.onnx"
    const val ASSET_JOINER = "kws/joiner.int8.onnx"
    const val ASSET_TOKENS = "kws/tokens.txt"
    const val ASSET_KEYWORDS = "kws/keywords.txt"

    const val COOLDOWN_MS = 2_500L
}
