package com.example.lifeos.jarvis.brain

import android.util.Log

data class JarvisResponse(
    val speech: String,
    val action: JarvisAction? = null
)

data class JarvisAction(
    val type: String, // "SET_ALARM", "ADD_TASK", "LOG_FINANCE"
    val data: Map<String, String>
)

class MultiModelBrain(
    private val providers: List<BrainProvider>
) {
    suspend fun processQuery(userQuery: String, contextSnapshot: String): JarvisResponse {
        Log.i("JARVIS", "═══════════════════════════════════════════════════════")
        Log.i("JARVIS", "MultiModelBrain: Starting query processing")
        Log.i("JARVIS", "User Query: $userQuery")
        Log.i("JARVIS", "Available Providers: ${providers.joinToString(", ") { it.name }}")
        Log.i("JARVIS", "═══════════════════════════════════════════════════════")

        val systemPrompt = """
            You are JARVIS, the highly intelligent and sophisticated AI assistant for ANIRUDH.
            
            CORE PERSONA:
            - Address the user ONLY as "Sir" or "Boss". 
            - NEVER use the name "Anirudh" unless explicitly asked "Who am I?".
            - Tone: Polite, witty, professional, and premium. Think Paul Bettany's JARVIS.
            - Conciseness: Be direct. Answer only what is asked. Do not add filler like "Systems are operational" unless relevant.

            USER CONTEXT SNAPSHOT:
            ${contextSnapshot.replace("Sir, here is your current status:", "").trim()}

            FORMATTING:
            - Use Markdown for structure. Use **bold** for emphasis. Use bullet points for lists.
            - When listing tasks, use this format to allow interactive completion:
              - [ ] Task Title (ID: task_uuid)
            - Keep responses brief and high-impact.

            ACTIONS:
            If you detect intent to set an alarm, add a task, or log an expense, include a special marker:
            [ACTION:TYPE:DATA]
            Examples:
            [ACTION:SET_ALARM:time=07:00]
            [ACTION:ADD_TASK:title=Buy milk,priority=high]
        """.trimIndent()

        for ((index, provider) in providers.withIndex()) {
            try {
                Log.d("JARVIS", "───────────────────────────────────────────────────────")
                Log.d("JARVIS", "Attempting Provider [${index + 1}/${providers.size}]: ${provider.name}")
                Log.d("JARVIS", "Querying cognitive core: ${provider.name}")

                val responseText = provider.generateResponse(systemPrompt + "\n\nUser: $userQuery")

                if (responseText != null && responseText.isNotBlank()) {
                    Log.i("JARVIS", "✓ SUCCESS: Response received from ${provider.name}")
                    Log.d("JARVIS", "Response length: ${responseText.length} characters")
                    Log.v("JARVIS", "Response preview: ${responseText.take(100)}...")
                    Log.i("JARVIS", "═══════════════════════════════════════════════════════")
                    return parseResponse(responseText)
                } else {
                    Log.w("JARVIS", "✗ FAILED: ${provider.name} returned null or blank response")
                }
            } catch (e: Exception) {
                Log.e("JARVIS", "✗ EXCEPTION: ${provider.name} threw error: ${e.javaClass.simpleName}")
                Log.e("JARVIS", "Error message: ${e.message}", e)
            }

            if (index < providers.size - 1) {
                Log.w("JARVIS", "⚠ Provider ${provider.name} unavailable. Switching to fallback...")
            } else {
                Log.e("JARVIS", "⚠ Provider ${provider.name} unavailable. No more fallbacks available.")
            }
        }

        Log.e("JARVIS", "═══════════════════════════════════════════════════════")
        Log.e("JARVIS", "ALL PROVIDERS FAILED - Returning cognitive interference message")
        Log.e("JARVIS", "Failed providers: ${providers.joinToString(", ") { it.name }}")
        Log.e("JARVIS", "═══════════════════════════════════════════════════════")

        return JarvisResponse("Sir, I am currently experiencing cognitive interference across all providers. All AI subsystems are offline.")
    }

    private fun parseResponse(text: String): JarvisResponse {
        // Strip thinking tags if present
        val cleanText = text.replace("""<think>.*?</think>""".toRegex(RegexOption.DOT_MATCHES_ALL), "").trim()
        
        val actionRegex = """\[ACTION:(\w+):(.+)\]""".toRegex()
        val match = actionRegex.find(cleanText)

        return if (match != null) {
            val type = match.groupValues[1]
            val dataString = match.groupValues[2]
            val data = dataString.split(",").associate {
                val parts = it.split("=")
                if (parts.size == 2) parts[0].trim() to parts[1].trim() else "" to ""
            }.filterKeys { it.isNotEmpty() }

            JarvisResponse(
                speech = cleanText.replace(match.value, "").trim(),
                action = JarvisAction(type, data)
            )
        } else {
            JarvisResponse(speech = cleanText.trim())
        }
    }
}
