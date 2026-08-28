package com.example.lifeos.jarvis.speaker

import android.content.Context
import com.example.lifeos.jarvis.logging.JarvisLog
import com.k2fsa.sherpa.onnx.SpeakerEmbeddingExtractor
import com.k2fsa.sherpa.onnx.SpeakerEmbeddingExtractorConfig

class SpeakerEmbeddingEngine(context: Context) {
    private val extractor = SpeakerEmbeddingExtractor(
        assetManager = context.applicationContext.assets,
        config = SpeakerEmbeddingExtractorConfig(
            model = SpeakerConfig.MODEL_ASSET,
            numThreads = SpeakerConfig.NUM_THREADS,
            debug = false,
            provider = "cpu"
        )
    )

    fun embed(samples: FloatArray, sampleRate: Int = 16000): FloatArray {
        val stream = extractor.createStream()
        try {
            stream.acceptWaveform(samples, sampleRate)
            stream.inputFinished()
            return extractor.compute(stream)
        } finally {
            stream.release()
        }
    }

    fun release() {
        try {
            extractor.release()
        } catch (t: Throwable) {
            JarvisLog.e("SPEAKER_ENGINE_RELEASE_FAILED", t)
        }
    }
}

fun cosineSimilarity(a: FloatArray, b: FloatArray): Float {
    if (a.isEmpty() || b.isEmpty() || a.size != b.size) return 0f
    var dot = 0f
    var na = 0f
    var nb = 0f
    for (i in a.indices) {
        dot += a[i] * b[i]
        na += a[i] * a[i]
        nb += b[i] * b[i]
    }
    val denom = kotlin.math.sqrt(na) * kotlin.math.sqrt(nb)
    return if (denom > 0f) (dot / denom) else 0f
}

fun averageEmbeddings(vectors: List<FloatArray>): FloatArray {
    require(vectors.isNotEmpty())
    val dim = vectors.first().size
    val acc = FloatArray(dim)
    for (v in vectors) {
        require(v.size == dim)
        for (i in 0 until dim) acc[i] += v[i]
    }
    val n = vectors.size.toFloat()
    for (i in 0 until dim) acc[i] /= n
    return acc
}
