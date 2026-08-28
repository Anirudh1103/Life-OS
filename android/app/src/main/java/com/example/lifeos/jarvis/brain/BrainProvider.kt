package com.example.lifeos.jarvis.brain

interface BrainProvider {
    val name: String
    suspend fun generateResponse(prompt: String): String?
}
