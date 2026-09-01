package com.example.lifeos.jarvis.util

object JarvisTextSanitizer {
    /**
     * Sanitizes Markdown, AI command tags, bullet points, and special characters
     * so that TTS engines (ElevenLabs and Android TextToSpeech) do not pronounce
     * "asterisk", "hash", "bracket", etc.
     */
    fun cleanForSpeech(raw: String): String {
        if (raw.isBlank()) return ""

        return raw
            .split("\n")
            .filter { line ->
                val trimmed = line.trim()
                if (trimmed.isEmpty()) return@filter false
                if (trimmed.startsWith("[COMMAND:")) return@filter false
                val isChip = trimmed.matches(Regex("^\\[([^\\[\\]]+)\\]$")) &&
                             !trimmed.startsWith("[ ]") &&
                             !trimmed.startsWith("[x]")
                !isChip
            }
            .joinToString(" ")
            .replace("```", " ")
            .replace(Regex("""\(ID: [a-f0-9-]+\)"""), "") // Remove task IDs
            .replace(Regex("""\[COMMAND:[^\]]+\]"""), "") // Remove command action tags
            .replace(Regex("(?m)^\\s*[-*+]\\s+"), "") // Remove markdown list bullets
            .replace(Regex("(?m)^\\s*\\d+[.)]\\s+"), "") // Remove list numbering
            .replace(Regex("(?m)^\\s*[-*]\\s*\\[[ xX]\\]\\s*"), "") // Remove checkboxes
            .replace(Regex("""\[(.*?)\]\(.*?\)"""), "$1") // Replace markdown links [text](url) with just text
            .replace(Regex("""\*{1,3}|`|#{1,6}|_|\~|>|\|"""), "") // Strip all markdown formatting characters (*, `, #, _, ~, >, |)
            .replace(Regex("""\s+"""), " ")
            .trim()
    }
}
