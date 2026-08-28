package com.example.lifeos.jarvis.speaker

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class SpeakerMathTest {
    @Test
    fun identicalVectorsHaveUnitSimilarity() {
        val a = floatArrayOf(0.2f, 0.4f, 0.8f)
        assertEquals(1f, cosineSimilarity(a, a.copyOf()), 1e-5f)
    }

    @Test
    fun oppositeVectorsHaveNegativeSimilarity() {
        val a = floatArrayOf(1f, 0f)
        val b = floatArrayOf(-1f, 0f)
        assertTrue(cosineSimilarity(a, b) < 0f)
    }
}
