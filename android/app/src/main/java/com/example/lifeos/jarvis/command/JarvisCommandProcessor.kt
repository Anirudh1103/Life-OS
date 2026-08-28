package com.example.lifeos.jarvis.command

/**
 * Future AI command router. Intentionally not connected to Gemini or any LLM.
 * After speaker-verified STT, LifeOS tools / smart-home can be plugged in here
 * without changing the wake-word pipeline.
 */
interface JarvisCommandProcessor {
    suspend fun process(command: String): String
}

class DeferredJarvisCommandProcessor : JarvisCommandProcessor {
    override suspend fun process(command: String): String {
        return "I heard \"$command\". Command routing to LifeOS tools is not connected yet."
    }
}
