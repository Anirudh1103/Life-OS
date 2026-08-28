package com.example.lifeos.ui.finance

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.TrendingDown
import androidx.compose.material.icons.automirrored.filled.TrendingUp
import androidx.compose.material.icons.filled.AccountBalanceWallet
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.lifeos.ui.viewmodels.FinanceViewModel
import com.example.lifeos.data.models.FinanceTransaction
import java.util.Locale

@Composable
fun FinanceScreen(
    modifier: Modifier = Modifier,
    viewModel: FinanceViewModel = viewModel()
) {
    val accounts by viewModel.accounts.collectAsState()
    val transactions by viewModel.transactions.collectAsState()

    val darkBackground = Color(0xFF0C0A1C)
    val cardBackground = Color(0xFF13112E)
    val accentGreen = Color(0xFF00FFC6)

    Box(modifier = modifier.fillMaxSize().background(darkBackground)) {
        Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    "Financial Core",
                    color = Color.White,
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Black
                )
                IconButton(
                    onClick = { /* TODO: Add Transaction */ },
                    modifier = Modifier.background(accentGreen.copy(alpha = 0.1f), androidx.compose.foundation.shape.CircleShape)
                ) {
                    Icon(Icons.Default.Add, contentDescription = "Add", tint = accentGreen)
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(16.dp),
                modifier = Modifier.fillMaxSize()
            ) {
                item {
                    val totalBalance = accounts.sumOf { it.current_balance.toDouble() }.toFloat()
                    BalanceCard(totalBalance, accentGreen, cardBackground)
                }

                item {
                    Text("Account Assets", color = Color.White.copy(alpha = 0.6f), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        accounts.take(3).forEach { acc ->
                           AccountPill(acc.name, acc.current_balance, Modifier.weight(1f))
                        }
                    }
                }

                item {
                    Text("Recent Activity", color = Color.White.copy(alpha = 0.6f), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }

                if (transactions.isEmpty()) {
                    item {
                        Text("No transaction logs detected.", color = Color.White.copy(alpha = 0.3f), fontSize = 12.sp)
                    }
                } else {
                    items(transactions) { tx ->
                        TransactionItem(tx, cardBackground)
                    }
                }
            }
        }
    }
}

@Composable
fun AccountPill(name: String, balance: Float, modifier: Modifier) {
    Card(
        colors = CardDefaults.cardColors(containerColor = Color(0xFF1B183E)),
        shape = RoundedCornerShape(12.dp),
        modifier = modifier
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Text(name, color = Color.White.copy(alpha = 0.5f), fontSize = 10.sp, maxLines = 1)
            Text("₹ ${balance.toInt()}", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
fun BalanceCard(balance: Float, accent: Color, background: Color) {
    Card(
        colors = CardDefaults.cardColors(containerColor = background),
        shape = RoundedCornerShape(24.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(24.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.AccountBalanceWallet, contentDescription = null, tint = accent, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(8.dp))
                Text("Liquidity Pool", color = Color.White.copy(alpha = 0.7f), fontSize = 12.sp)
            }
            Text("₹ ${String.format(Locale.US, "%,.0f", balance)}", color = Color.White, fontSize = 32.sp, fontWeight = FontWeight.Black)
            Spacer(modifier = Modifier.height(16.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                FlowStat("Health", "Nominal", Icons.AutoMirrored.Filled.TrendingUp, Color(0xFF00FFC6))
                FlowStat("Risk", "Secure", Icons.AutoMirrored.Filled.TrendingDown, Color(0xFF2DE1FC))
            }
        }
    }
}

@Composable
fun FlowStat(label: String, value: String, icon: androidx.compose.ui.graphics.vector.ImageVector, color: Color) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Icon(icon, contentDescription = null, tint = color, modifier = Modifier.size(14.dp))
        Spacer(modifier = Modifier.width(4.dp))
        Column {
            Text(label, color = Color.White.copy(alpha = 0.4f), fontSize = 9.sp)
            Text(value, color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
fun TransactionItem(tx: FinanceTransaction, background: Color) {
    val amountColor = if (tx.type == "income") Color(0xFF00FFC6) else Color.White

    Card(
        colors = CardDefaults.cardColors(containerColor = background),
        shape = RoundedCornerShape(16.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(tx.merchant ?: tx.description ?: "Unknown", color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                Text(tx.transaction_date.take(10), color = Color.White.copy(alpha = 0.4f), fontSize = 11.sp)
            }
            Text(
                text = "${if (tx.type == "income") "+" else "-"} ₹ ${Math.abs(tx.amount).toInt()}",
                color = amountColor,
                fontSize = 15.sp,
                fontWeight = FontWeight.Black
            )
        }
    }
}
