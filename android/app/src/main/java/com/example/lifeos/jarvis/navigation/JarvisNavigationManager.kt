package com.example.lifeos.jarvis.navigation

import androidx.navigation3.runtime.NavKey
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.asSharedFlow

object JarvisNavigationManager {
    private val _navEvents = MutableSharedFlow<NavKey>(extraBufferCapacity = 1)
    val navEvents = _navEvents.asSharedFlow()

    private val _backEvents = MutableSharedFlow<Unit>(extraBufferCapacity = 1)
    val backEvents = _backEvents.asSharedFlow()

    fun navigateTo(key: NavKey) {
        _navEvents.tryEmit(key)
    }

    fun goBack() {
        _backEvents.tryEmit(Unit)
    }
}
