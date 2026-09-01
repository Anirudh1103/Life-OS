package com.example.lifeos.jarvis.wakeword

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File

class WakeWordKeywordValidationTest {

    @Test
    fun testKeywordsExistInTokensVocab() {
        val tokensFile = File("src/main/assets/kws/tokens.txt")
        assertTrue("tokens.txt must exist at ${tokensFile.absolutePath}", tokensFile.exists())

        val vocab = mutableSetOf<String>()
        tokensFile.forEachLine(Charsets.UTF_8) { line ->
            val trimmed = line.trim()
            if (trimmed.isNotEmpty()) {
                val lastSpaceIdx = trimmed.lastIndexOf(' ')
                if (lastSpaceIdx > 0) {
                    vocab.add(trimmed.substring(0, lastSpaceIdx))
                }
            }
        }

        assertTrue("Vocabulary must contain at least 500 tokens", vocab.size >= 500)

        val keywordsFile = File("src/main/assets/kws/keywords.txt")
        assertTrue("keywords.txt must exist at ${keywordsFile.absolutePath}", keywordsFile.exists())

        val lines = keywordsFile.readLines(Charsets.UTF_8).filter { it.isNotBlank() }
        assertEquals("keywords.txt must contain exactly 1 keyword line", 1, lines.size)

        val line = lines.first()
        val parts = line.split("@")
        assertEquals("Keyword line must have format '[BPE] @alias'", 2, parts.size)

        val phraseTokens = parts[0].trim().split("\\s+".toRegex()).filter { it.isNotBlank() }
        val alias = parts[1].trim()

        assertEquals("Alias must be hey_jarvis", "hey_jarvis", alias)
        assertEquals("Phrase must have exactly 6 BPE tokens for 'Hey Jarvis'", 6, phraseTokens.size)

        for (token in phraseTokens) {
            assertTrue("Token '$token' must exist in tokens.txt vocabulary", vocab.contains(token))
        }

        // Expected tokens: ▁HE, Y, ▁JA, R, VI, S
        assertEquals("▁HE", phraseTokens[0])
        assertEquals("Y", phraseTokens[1])
        assertEquals("▁JA", phraseTokens[2])
        assertEquals("R", phraseTokens[3])
        assertEquals("VI", phraseTokens[4])
        assertEquals("S", phraseTokens[5])
    }
}
