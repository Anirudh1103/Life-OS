package com.example.lifeos.jarvis.brain

import com.google.ai.client.generativeai.GenerativeModel

class GeminiProvider(private val apiKey: String) : BrainProvider {
    override val name: String = "Google Gemini"
    private val model = GenerativeModel(
        modelName = "gemini-1.5-flash",
        apiKey = apiKey
    )

    override suspend fun generateResponse(prompt: String): String? {
        if (apiKey.isBlank() || apiKey == "your-gemini-key") {
            android.util.Log.w("JARVIS", "Gemini: API key not configured or is placeholder")
            return null
        }
        return try {
            android.util.Log.d("JARVIS", "Gemini: Sending request to API (model=gemini-1.5-flash)...")
            val response = model.generateContent(prompt)
            val text = response.text
            android.util.Log.d("JARVIS", "Gemini: Received response, length=${text?.length ?: 0}")
            text
        } catch (e: Exception) {
            android.util.Log.e("JARVIS", "Gemini Error (${e.javaClass.simpleName}): ${e.message}", e)
            android.util.Log.e("JARVIS", "Gemini Stack Trace:", e)
            null
        }
    }
}
