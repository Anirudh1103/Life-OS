package com.example.lifeos.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.lifeos.data.AndroidSessionManager
import com.example.lifeos.data.SupabaseProvider
import com.example.lifeos.LifeOSApplication
import io.github.jan.supabase.gotrue.auth
import io.github.jan.supabase.gotrue.SessionStatus
import io.github.jan.supabase.gotrue.providers.builtin.Email
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch
import kotlinx.coroutines.delay

sealed class AuthState {
    object Idle : AuthState()
    object Loading : AuthState()
    object Initializing : AuthState()
    data class Authenticated(val userId: String) : AuthState()
    data class Error(val message: String) : AuthState()
}

class AuthViewModel : ViewModel() {
    private val client = SupabaseProvider.client
    private val sessionManager = AndroidSessionManager(LifeOSApplication.instance)

    private val _state = MutableStateFlow<AuthState>(AuthState.Initializing)
    val state: StateFlow<AuthState> = _state.asStateFlow()

    // Track the last authenticated userId so we can survive token refresh failures
    private var lastAuthenticatedUserId: String? = null

    init {
        observeSession()
    }

    private fun observeSession() {
        viewModelScope.launch {
            client.auth.sessionStatus.collectLatest { status ->
                android.util.Log.d("Auth", "Session status changed: $status")
                when (status) {
                    is SessionStatus.Authenticated -> {
                        val userId = status.session.user?.id ?: ""
                        lastAuthenticatedUserId = userId
                        _state.value = AuthState.Authenticated(userId)
                    }
                    is SessionStatus.NotAuthenticated -> {
                        handleNotAuthenticated(status)
                    }
                    is SessionStatus.LoadingFromStorage -> {
                        _state.value = AuthState.Initializing
                    }
                    else -> {
                        // Handles RefreshFailure and any other status variants
                        handleRefreshFailure()
                    }
                }
            }
        }
    }

    /**
     * Instagram-style session persistence:
     * If user was previously authenticated OR has a saved session on disk,
     * do NOT kick them to the login screen when token refresh fails.
     * Instead, keep them authenticated with stale data or retry silently.
     */
    private fun handleNotAuthenticated(status: SessionStatus.NotAuthenticated) {
        // If we're in the middle of a manual sign-in attempt, don't interfere
        if (_state.value is AuthState.Loading) return

        // If user explicitly signed out, always go to login
        if (status.isSignOut) {
            android.util.Log.d("Auth", "User signed out explicitly. Showing login screen.")
            lastAuthenticatedUserId = null
            _state.value = AuthState.Idle
            return
        }

        // Case 1: User was authenticated in this app session — token refresh failed
        val savedUserId = lastAuthenticatedUserId
        if (savedUserId != null) {
            android.util.Log.w("Auth", "Token refresh failed but user was previously authenticated. Keeping session alive.")
            _state.value = AuthState.Authenticated(savedUserId)
            retrySessionLoad()
            return
        }

        // Case 2: App just launched — check if a saved session exists on disk
        if (sessionManager.hasSession()) {
            android.util.Log.w("Auth", "Saved session exists but token refresh failed. Attempting silent reload.")
            _state.value = AuthState.Initializing
            retrySessionLoad()
            return
        }

        // Case 3: No saved session at all — this is a genuine first launch or post-logout
        android.util.Log.d("Auth", "No saved session found. Showing login screen.")
        _state.value = AuthState.Idle
    }

    /**
     * Handle refresh failures (network errors, server errors) gracefully:
     * keep user authenticated if possible.
     */
    private fun handleRefreshFailure() {
        val savedUserId = lastAuthenticatedUserId
        if (savedUserId != null) {
            android.util.Log.w("Auth", "Session refresh failed. Keeping user authenticated with stale session.")
            _state.value = AuthState.Authenticated(savedUserId)
            retrySessionLoad()
            return
        }

        if (sessionManager.hasSession()) {
            android.util.Log.w("Auth", "Refresh failed but saved session exists. Staying on initializing.")
            _state.value = AuthState.Initializing
            retrySessionLoad()
            return
        }

        // No session at all — show login
        _state.value = AuthState.Idle
    }

    /**
     * Silently retry refreshing the session after a short delay.
     */
    private fun retrySessionLoad() {
        viewModelScope.launch {
            delay(3000)
            try {
                android.util.Log.d("Auth", "Retrying session refresh...")
                client.auth.refreshCurrentSession()
                val user = client.auth.currentUserOrNull()
                if (user != null) {
                    lastAuthenticatedUserId = user.id
                    _state.value = AuthState.Authenticated(user.id)
                    android.util.Log.d("Auth", "Session refresh succeeded.")
                }
            } catch (e: Exception) {
                android.util.Log.w("Auth", "Silent session retry failed: ${e.message}")
                // Don't change state — keep whatever state we're in
                // The user stays authenticated with stale data (Instagram-style)
            }
        }
    }

    fun signIn(emailStr: String, passwordStr: String) {
        viewModelScope.launch {
            _state.value = AuthState.Loading
            try {
                android.util.Log.d("Auth", "Attempting authentication for identity: $emailStr")
                client.auth.signInWith(Email) {
                    email = emailStr.trim()
                    password = passwordStr.trim()
                }
                
                delay(500) // Small buffer for session propagation
                val user = client.auth.currentUserOrNull()
                
                if (user != null) {
                    android.util.Log.d("Auth", "Authentication successful. Access granted to: ${user.id}")
                    lastAuthenticatedUserId = user.id
                    _state.value = AuthState.Authenticated(user.id)
                } else {
                    android.util.Log.e("Auth", "Session link failure. User is null after success.")
                    _state.value = AuthState.Error("Neural link failed. User session not found.")
                }
            } catch (e: Exception) {
                android.util.Log.e("Auth", "Access denied: ${e.message}", e)
                val msg = when {
                    e.message?.contains("Invalid login credentials") == true -> "Invalid identity or access code, Sir."
                    e.message?.contains("Email not confirmed") == true -> "Identity not verified. Please check your inbox."
                    else -> e.message ?: "Authentication failed."
                }
                _state.value = AuthState.Error(msg)
            }
        }
    }

    fun signUp(emailStr: String, passwordStr: String) {
        viewModelScope.launch {
            _state.value = AuthState.Loading
            try {
                client.auth.signUpWith(Email) {
                    email = emailStr
                    password = passwordStr
                }
                _state.value = AuthState.Error("Sign up successful. Please check your email for verification.")
            } catch (e: Exception) {
                _state.value = AuthState.Error(e.message ?: "Registration failed")
            }
        }
    }

    fun signOut() {
        viewModelScope.launch {
            lastAuthenticatedUserId = null
            client.auth.signOut()
            _state.value = AuthState.Idle
        }
    }
}
