package com.example.lifeos.ui.components

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

@Composable
fun JarvisArcReactor(
    state: String,
    modifier: Modifier = Modifier,
    size: Dp = 64.dp,
    onClick: () -> Unit = {}
) {
    LifeOSOrb(
        modifier = modifier
            .size(size)
            .clickable { onClick() },
        size = size,
        state = state
    )
}
