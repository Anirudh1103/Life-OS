package com.example.lifeos.jarvis.logging

import android.util.Log
import com.example.lifeos.BuildConfig

/**
 * Structured JARVIS logs. Never log PCM, embeddings, or other biometric payloads.
 */
object JarvisLog {
    private const val TAG = "JARVIS"

    fun d(event: String, detail: String? = null) {
        if (!BuildConfig.DEBUG) return
        if (detail.isNullOrBlank()) Log.d(TAG, event) else Log.d(TAG, "$event | $detail")
    }

    fun w(event: String, detail: String? = null) {
        if (detail.isNullOrBlank()) Log.w(TAG, event) else Log.w(TAG, "$event | $detail")
    }

    fun e(event: String, throwable: Throwable? = null) {
        if (throwable != null) Log.e(TAG, event, throwable) else Log.e(TAG, event)
    }
}
