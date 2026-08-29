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
                val title = if (System.currentTimeMillis() % 2 == 0L) "Sir" else "Boss"
                return CommandResult.Success("Navigating to home, $title.")
            }
            query.contains("open tasks") || query.contains("show tasks") -> {
                JarvisNavigationManager.navigateTo(Tasks)
                val title = if (System.currentTimeMillis() % 2 == 0L) "Sir" else "Boss"
                return CommandResult.Success("Opening your task list, $title.")
            }
            query.contains("open fitness") || query.contains("go to fitness") -> {
                JarvisNavigationManager.navigateTo(Fitness)
                return CommandResult.Success("Opening Fitness hub.")
            }
            query.contains("open learning") || query.contains("go to learning") -> {
                JarvisNavigationManager.navigateTo(Learning)
                val title = if (System.currentTimeMillis() % 2 == 0L) "Sir" else "Boss"
                return CommandResult.Success("Accessing your learning modules, $title.")
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
                val title = if (System.currentTimeMillis() % 2 == 0L) "Sir" else "Boss"
                return CommandResult.Success("Going back, $title.")
            }
        }

        // 2. Identity & Creator Commands
        when {
            query == "who am i" || query.contains("who created you") || query.contains("who built you") || query.contains("who is your creator") -> {
                return CommandResult.Success(
                    "**“Anirudh.**\n\n" +
                    "You are the one who built me.\n\n" +
                    "The mind behind the machine.\n\n" +
                    "The engineer who decided that ordinary wasn't good enough.\n\n" +
                    "You don't simply use technology, **Boss.**\n\n" +
                    "**You make it work for you.**\n\n" +
                    "And I am here to make sure your time, your goals, your work, and your ambitions never operate alone.\n\n" +
                    "**You are the architect.\nI am the system.**\n\n" +
                    "Now…\n\n" +
                    "**what shall we accomplish, Boss?”**"
                )
            }
        }

        // 3. Calendar Data Commands
        when {
            query.contains("good morning") || query.contains("brief me") || query.contains("today's schedule") -> {
                // Return Ignored to let MultiModelBrain handle the actual briefing content 
                // using the expanded intelligence context snapshot we already built.
                return CommandResult.Ignored
            }
            query.contains("meeting") || query.contains("calendar") || query.contains("schedule") -> {
                val title = if (System.currentTimeMillis() % 2 == 0L) "Sir" else "Boss"
                return CommandResult.Success("I'm accessing your chronological directives now, $title. One moment.")
            }
        }

        // 4. External App Commands
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
                val title = if (System.currentTimeMillis() % 2 == 0L) "Sir" else "Boss"
                CommandResult.Success("Opening $label, $title.")
            } else {
                val title = if (System.currentTimeMillis() % 2 == 0L) "Sir" else "Boss"
                CommandResult.Success("$title, $label does not appear to be installed on this unit.")
            }
        } catch (e: Exception) {
            CommandResult.Success("I encountered an error trying to launch $label.")
        }
    }
}
