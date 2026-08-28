package com.example.lifeos.jarvis.brain

import io.ktor.client.*
import io.ktor.client.call.*
import io.ktor.client.engine.okhttp.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.plugins.*
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

class GroqProvider(private val apiKey: String) : BrainProvider {
    override val name: String = "Groq Cloud"

    private val client = HttpClient(OkHttp) {
        install(ContentNegotiation) {
            json(Json { ignoreUnknownKeys = true })
        }
        install(HttpTimeout) {
            requestTimeoutMillis = 10000
        }
    }

    override suspend fun generateResponse(prompt: String): String? {
        if (apiKey.isBlank() || apiKey == "your-groq-key") {
            android.util.Log.w("JARVIS", "Groq: API key not configured or is placeholder")
            return null
        }

        return try {
            android.util.Log.d("JARVIS", "Groq: Sending POST to https://api.groq.com/openai/v1/chat/completions")
            android.util.Log.d("JARVIS", "Groq: Model=qwen/qwen3.6-27b")

            val httpResponse = client.post("https://api.groq.com/openai/v1/chat/completions") {
                header("Authorization", "Bearer $apiKey")
                contentType(ContentType.Application.Json)
                setBody(GroqRequest(
                    model = "qwen/qwen3.6-27b",
                    messages = listOf(Message(role = "user", content = prompt))
                ))
            }

            android.util.Log.d("JARVIS", "Groq: Received HTTP ${httpResponse.status.value}")

            if (httpResponse.status == HttpStatusCode.OK) {
                val response: GroqResponse = httpResponse.body()
                val content = response.choices.firstOrNull()?.message?.content
                android.util.Log.d("JARVIS", "Groq: Response parsed, length=${content?.length ?: 0}")
                content
            } else {
                val errorBody = httpResponse.bodyAsText()
                android.util.Log.e("JARVIS", "Groq: HTTP ${httpResponse.status.value} Error Response:")
                android.util.Log.e("JARVIS", "Groq: $errorBody")
                null
            }
        } catch (e: Exception) {
            android.util.Log.e("JARVIS", "Groq Error (${e.javaClass.simpleName}): ${e.message}", e)
            android.util.Log.e("JARVIS", "Groq Stack Trace:", e)
            null
        }
    }
}

@Serializable
data class GroqRequest(
    val model: String,
    val messages: List<Message>
)

@Serializable
data class GroqResponse(
    val choices: List<Choice>
)

@Serializable
data class Choice(
    val message: Message
)

@Serializable
data class Message(
    val role: String,
    val content: String
)
