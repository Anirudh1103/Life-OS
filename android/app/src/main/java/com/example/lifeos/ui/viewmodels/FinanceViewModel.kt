package com.example.lifeos.ui.viewmodels

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.lifeos.data.SupabaseProvider
import com.example.lifeos.data.SupabaseRepository
import com.example.lifeos.data.models.FinanceAccount
import com.example.lifeos.data.models.FinanceTransaction
import io.github.jan.supabase.gotrue.auth
import io.github.jan.supabase.gotrue.SessionStatus
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch

class FinanceViewModel(application: Application) : AndroidViewModel(application) {
    private val repository = SupabaseRepository()
    private val client = SupabaseProvider.client
    
    private val _accounts = MutableStateFlow<List<FinanceAccount>>(emptyList())
    val accounts: StateFlow<List<FinanceAccount>> = _accounts.asStateFlow()

    private val _transactions = MutableStateFlow<List<FinanceTransaction>>(emptyList())
    val transactions: StateFlow<List<FinanceTransaction>> = _transactions.asStateFlow()

    init {
        observeAuth()
    }

    private fun observeAuth() {
        viewModelScope.launch {
            client.auth.sessionStatus.collectLatest { status ->
                if (status is SessionStatus.Authenticated) {
                    loadData()
                } else {
                    _accounts.value = emptyList()
                    _transactions.value = emptyList()
                }
            }
        }
    }

    fun loadData() {
        viewModelScope.launch {
            val user = client.auth.currentUserOrNull() ?: return@launch

            val accs = repository.getFinanceAccounts(user.id)
            val txs = repository.getTransactions(user.id)
            
            _accounts.value = accs
            _transactions.value = txs
        }
    }
}
