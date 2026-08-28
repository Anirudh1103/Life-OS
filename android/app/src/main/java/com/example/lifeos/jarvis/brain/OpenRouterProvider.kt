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

class OpenRouterProvider(private val apiKey: String) : BrainProvider {
    override val name: String = "OpenRouter"

    private val client = HttpClient(OkHttp) {
        install(ContentNegotiation) {
            json(Json { ignoreUnknownKeys = true })
        }
        install(HttpTimeout) {
            requestTimeoutMillis = 15000
        }
    }

    override suspend fun generateResponse(prompt: String): String? {
        if (apiKey.isBlank() || apiKey == "your-openrouter-key") {
            android.util.Log.w("JARVIS", "OpenRouter: API key not configured or is placeholder")
            return null
        }

        return try {
            android.util.Log.d("JARVIS", "OpenRouter: Sending POST to https://openrouter.ai/api/v1/chat/completions")
            android.util.Log.d("JARVIS", "OpenRouter: Model=mistralai/mistral-nemo")

            val httpResponse = client.post("https://openrouter.ai/api/v1/chat/completions") {
                header("Authorization", "Bearer $apiKey")
                header("HTTP-Referer", "https://lifeos.example.com")
                header("X-Title", "LifeOS Android")
                contentType(ContentType.Application.Json)
                setBody(OpenRouterRequest(
                    model = "mistralai/mistral-nemo",
                    messages = listOf(OpenMessage(role = "user", content = prompt)),
                    max_tokens = 2048
                ))
            }

            android.util.Log.d("JARVIS", "OpenRouter: Received HTTP ${httpResponse.status.value}")

            if (httpResponse.status == HttpStatusCode.OK) {
                val response: OpenRouterResponse = httpResponse.body()
                val content = response.choices.firstOrNull()?.message?.content
                android.util.Log.d("JARVIS", "OpenRouter: Response parsed, length=${content?.length ?: 0}")
                content
            } else {
                val errorBody = httpResponse.bodyAsText()
                android.util.Log.e("JARVIS", "OpenRouter: HTTP ${httpResponse.status.value} Error Response:")
                android.util.Log.e("JARVIS", "OpenRouter: $errorBody")
                null
            }
        } catch (e: Exception) {
            android.util.Log.e("JARVIS", "OpenRouter Error (${e.javaClass.simpleName}): ${e.message}", e)
            android.util.Log.e("JARVIS", "OpenRouter Stack Trace:", e)
            null
        }
    }
}

@Serializable
data class OpenRouterRequest(
    val model: String,
    val messages: List<OpenMessage>,
    val max_tokens: Int = 2048
)

@Serializable
data class OpenRouterResponse(
    val choices: List<OpenChoice>
)

@Serializable
data class OpenChoice(
    val message: OpenMessage
)

@Serializable
data class OpenMessage(
    val role: String,
    val content: String
)
