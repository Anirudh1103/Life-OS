package com.example.lifeos.jarvis.command

import android.content.Context
import android.content.Intent
import android.net.Uri
import com.example.lifeos.*
import com.example.lifeos.jarvis.navigation.JarvisNavigationManager

sealed class CommandResult {
    data class Success(val response: String) : CommandResult()
    object Ignored : CommandResult()
}

class JarvisCommandRouter(private val context: Context) {

    fun routeCommand(text: String): CommandResult {
        val query = text.lowercase().trim()

        // 1. Navigation Commands
        when {
            query.contains("go to home") || query.contains("open home") || query == "home" -> {
                JarvisNavigationManager.navigateTo(Dashboard)
                return CommandResult.Success("Navigating to home, Sir.")
            }
            query.contains("open tasks") || query.contains("show tasks") -> {
                JarvisNavigationManager.navigateTo(Tasks)
                return CommandResult.Success("Opening your task list, Sir.")
            }
            query.contains("open fitness") || query.contains("go to fitness") -> {
                JarvisNavigationManager.navigateTo(Fitness)
                return CommandResult.Success("Opening Fitness hub.")
            }
            query.contains("open learning") || query.contains("go to learning") -> {
                JarvisNavigationManager.navigateTo(Learning)
                return CommandResult.Success("Accessing your learning modules, Sir.")
            }
            query.contains("open finance") || query.contains("show my money") -> {
                JarvisNavigationManager.navigateTo(Finance)
                return CommandResult.Success("Opening Finance dashboard.")
            }
            query.contains("open clock") || query.contains("show alarm") -> {
                JarvisNavigationManager.navigateTo(Alarms)
                return CommandResult.Success("Opening Clock.")
            }
            query.contains("open settings") || query.contains("go to settings") -> {
                JarvisNavigationManager.navigateTo(Settings)
                return CommandResult.Success("Opening System Settings.")
            }
            query.contains("go back") || query == "back" -> {
                JarvisNavigationManager.goBack()
                return CommandResult.Success("Going back, Sir.")
            }
        }

        // 2. External App Commands
        when {
            query.contains("open youtube") -> return launchApp("com.google.android.youtube", "YouTube")
            query.contains("open spotify") -> return launchApp("com.spotify.music", "Spotify")
            query.contains("open chrome") -> return launchApp("com.android.chrome", "Chrome")
        }

        return CommandResult.Ignored
    }

    private fun launchApp(packageName: String, label: String): CommandResult {
        return try {
            val intent = context.packageManager.getLaunchIntentForPackage(packageName)
            if (intent != null) {
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                context.startActivity(intent)
                CommandResult.Success("Opening $label, Sir.")
            } else {
                CommandResult.Success("Sir, $label does not appear to be installed on this unit.")
            }
        } catch (e: Exception) {
            CommandResult.Success("I encountered an error trying to launch $label.")
        }
    }
}
