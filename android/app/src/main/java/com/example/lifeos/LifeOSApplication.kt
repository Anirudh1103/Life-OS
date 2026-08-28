package com.example.lifeos

import android.app.Application
import com.example.lifeos.jarvis.JarvisController
import com.example.lifeos.jarvis.brain.*

class LifeOSApplication : Application() {
    override fun onCreate() {
        super.onCreate()

        // Initialize JARVIS Multi-Model Brain with fallbacks
        // API keys are now securely loaded from local.properties via BuildConfig
        val providers = mutableListOf<BrainProvider>()

        // Only add providers with valid API keys
        if (BuildConfig.GEMINI_API_KEY.isNotBlank()) {
            providers.add(GeminiProvider(BuildConfig.GEMINI_API_KEY))
        }
        if (BuildConfig.GROQ_API_KEY.isNotBlank()) {
            providers.add(GroqProvider(BuildConfig.GROQ_API_KEY))
        }
        if (BuildConfig.OPENROUTER_API_KEY.isNotBlank()) {
            providers.add(OpenRouterProvider(BuildConfig.OPENROUTER_API_KEY))
        }

        // Brain will try providers in order: Gemini → Groq → OpenRouter
        val brain = if (providers.isNotEmpty()) {
            MultiModelBrain(providers)
        } else {
            // Fallback: use Gemini with empty key (will show proper error)
            MultiModelBrain(listOf(GeminiProvider("")))
        }

        JarvisController.initialize(this, brain)
    }
}
