package com.example.lifeos

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import com.example.lifeos.theme.LifeOSTheme
import com.example.lifeos.ui.alarm.AlarmOverlayScreen
import kotlinx.coroutines.flow.MutableStateFlow

object VoiceQueryManager {
    val queryFlow = MutableStateFlow<String?>(null)
    val isAlarmActive = MutableStateFlow(false)
    val isDarkTheme = MutableStateFlow(true) // Default to dark
}

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        super.onCreate(savedInstanceState)
        
        // Initialize theme state from prefs
        VoiceQueryManager.isDarkTheme.value = com.example.lifeos.jarvis.prefs.JarvisPrefs.isDarkTheme(this)

        handleIntent(intent)

        enableEdgeToEdge()
        setContent {
            val isAlarmActive by VoiceQueryManager.isAlarmActive.collectAsState()
            val isDarkTheme by VoiceQueryManager.isDarkTheme.collectAsState()

            LifeOSTheme(darkTheme = isDarkTheme) {
                Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
                    Box(modifier = Modifier.fillMaxSize()) {
                        MainNavigation()

                        if (isAlarmActive) {
                            AlarmOverlayScreen(onDismiss = { VoiceQueryManager.isAlarmActive.value = false })
                        }
                    }
                }
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        handleIntent(intent)
    }

    private fun handleIntent(intent: Intent?) {
        if (intent?.action == "com.example.lifeos.ACTION_VOICE_QUERY") {
            val query = intent.getStringExtra("query")
            if (query != null) {
                VoiceQueryManager.queryFlow.value = query
            }
        } else if (intent?.action == "com.example.lifeos.ACTION_ALARM_TRIGGER") {
            VoiceQueryManager.isAlarmActive.value = true
        }
    }
}
