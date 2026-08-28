package com.example.lifeos.ui.utils

import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.unit.dp

enum class LifeOSWindowSize {
    Compact,   // < 600dp (Phones)
    Medium,    // 600dp - 839dp (Foldables / Small Tablets)
    Expanded   // 840dp+ (Large Tablets / Desktops)
}

@Composable
fun rememberWindowSizeClass(): LifeOSWindowSize {
    val configuration = LocalConfiguration.current
    val screenWidth = configuration.screenWidthDp.dp
    
    return remember(screenWidth) {
        when {
            screenWidth < 600.dp -> LifeOSWindowSize.Compact
            screenWidth < 840.dp -> LifeOSWindowSize.Medium
            else -> LifeOSWindowSize.Expanded
        }
    }
}
