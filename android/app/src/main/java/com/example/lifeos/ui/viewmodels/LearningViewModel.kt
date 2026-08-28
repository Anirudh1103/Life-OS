package com.example.lifeos.ui.viewmodels

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.lifeos.data.SupabaseProvider
import com.example.lifeos.data.SupabaseRepository
import com.example.lifeos.data.models.Category
import com.example.lifeos.data.models.Topic
import io.github.jan.supabase.gotrue.auth
import io.github.jan.supabase.gotrue.SessionStatus
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch

class LearningViewModel(application: Application) : AndroidViewModel(application) {
    private val repository = SupabaseRepository()
    private val client = SupabaseProvider.client

    private val _categories = MutableStateFlow<List<Category>>(emptyList())
    val categories: StateFlow<List<Category>> = _categories.asStateFlow()

    private val _topics = MutableStateFlow<List<Topic>>(emptyList())
    val topics: StateFlow<List<Topic>> = _topics.asStateFlow()

    init {
        observeAuth()
    }

    private fun observeAuth() {
        viewModelScope.launch {
            client.auth.sessionStatus.collectLatest { status ->
                if (status is SessionStatus.Authenticated) {
                    loadData()
                } else {
                    _categories.value = emptyList()
                    _topics.value = emptyList()
                }
            }
        }
    }

    fun loadData() {
        viewModelScope.launch {
            val user = client.auth.currentUserOrNull() ?: return@launch

            val cats = repository.getCategories(user.id)
            val tops = repository.getTopics(user.id)

            _categories.value = cats
            _topics.value = tops
        }
    }
}
