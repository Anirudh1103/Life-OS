package com.example.lifeos.jarvis.wakeword

enum class WakeWordRuntimeState {
    DISABLED,
    STARTING,
    LISTENING,
    PROCESSING,
    TRIGGERED,
    PAUSED_FOR_VOICE_SESSION,
    ERROR
}
