package com.example.lifeos.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.lifeos.data.SupabaseProvider
import io.github.jan.supabase.gotrue.auth
import io.github.jan.supabase.gotrue.providers.builtin.Email
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.delay

sealed class AuthState {
    object Idle : AuthState()
    object Loading : AuthState()
    data class Authenticated(val userId: String) : AuthState()
    data class Error(val message: String) : AuthState()
}

class AuthViewModel : ViewModel() {
    private val client = SupabaseProvider.client

    private val _state = MutableStateFlow<AuthState>(AuthState.Idle)
    val state: StateFlow<AuthState> = _state.asStateFlow()

    init {
        checkCurrentSession()
    }

    private fun checkCurrentSession() {
        viewModelScope.launch {
            val user = client.auth.currentUserOrNull()
            if (user != null) {
                _state.value = AuthState.Authenticated(user.id)
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
            client.auth.signOut()
            _state.value = AuthState.Idle
        }
    }
}
