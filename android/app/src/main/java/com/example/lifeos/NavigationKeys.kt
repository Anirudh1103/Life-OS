package com.example.lifeos

import androidx.navigation3.runtime.NavKey
import kotlinx.serialization.Serializable

@Serializable data object Dashboard : NavKey
@Serializable data object Tasks : NavKey
@Serializable data object Fitness : NavKey
@Serializable data object Learning : NavKey
@Serializable data object Finance : NavKey
@Serializable data object Alarms : NavKey
@Serializable data object Profile : NavKey
@Serializable data object Settings : NavKey
@Serializable data object VoiceEnrollment : NavKey
