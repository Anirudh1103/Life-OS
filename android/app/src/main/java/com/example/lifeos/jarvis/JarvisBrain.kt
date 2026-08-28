package com.example.lifeos.jarvis

import com.google.ai.client.generativeai.GenerativeModel
import com.google.ai.client.generativeai.type.content
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow

class JarvisBrain(apiKey: String) {
    private val model = GenerativeModel(
        modelName = "gemini-1.5-flash",
        apiKey = apiKey
    )

    suspend fun processIntent(userQuery: String, context: String): String {
        val prompt = """
            You are JARVIS, a highly intelligent and sophisticated AI assistant for ANIRUDH.
            Current Context: $context
            
            User says: "$userQuery"
            
            Respond in your characteristic polite, witty, and helpful tone (as if you are the assistant to Tony Stark).
            Keep it concise but premium.
        """.trimIndent()

        return try {
            val response = model.generateContent(prompt)
            response.text ?: "I'm sorry, Sir. I encountered a bit of a glitch in my processors."
        } catch (e: Exception) {
            "I'm afraid I can't reach the main server at the moment, Sir. $e"
        }
    }
}
