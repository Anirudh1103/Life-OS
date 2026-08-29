package com.example.lifeos.jarvis.speaker

/**
 * Speaker-verification configuration. CAM++ cosine similarity on VoxCeleb-trained
 * embeddings typically scores same-speaker pairs well above 0.45 and other-speaker
 * pairs below 0.35. 0.55 is chosen to prefer rejecting strangers / media audio.
 */
object SpeakerConfig {
    const val MODEL_ASSET = "speaker/campplus_sv_en_voxceleb_16k.onnx"
    const val MODEL_ID = "campplus_sv_en_voxceleb_16k"
    const val CONFIG_VERSION = 1
    const val SIMILARITY_THRESHOLD = 0.45f
    const val NUM_THREADS = 1
}
