package com.example.lifeos.ui.components

import android.graphics.Bitmap
import android.os.Build
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView

@Composable
fun LifeOSWebView(
    url: String,
    modifier: Modifier = Modifier,
    onWebViewCreated: (WebView) -> Unit = {}
) {
    var isLoading by remember { mutableStateOf(true) }
    var errorOccurred by remember { mutableStateOf<String?>(null) }
    val webViewRef = remember { mutableStateOf<WebView?>(null) }

    val accentCyan = Color(0xFF2DE1FC)
    val darkBackground = Color(0xFF0C0A1C)

    Box(modifier = modifier.fillMaxSize().background(darkBackground)) {
        AndroidView(
            factory = { ctx ->
                WebView(ctx).apply {
                    webViewClient = object : WebViewClient() {
                        override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                            isLoading = true
                            errorOccurred = null
                        }

                        override fun onPageFinished(view: WebView?, url: String?) {
                            isLoading = false
                        }

                        override fun onReceivedError(
                            view: WebView?,
                            request: WebResourceRequest?,
                            error: WebResourceError?
                        ) {
                            // Only show error for main frame failures
                            if (request?.isForMainFrame == true) {
                                isLoading = false
                                errorOccurred = error?.description?.toString() ?: "Failed to connect to server"
                            }
                        }
                    }
                    settings.apply {
                        javaScriptEnabled = true
                        domStorageEnabled = true
                        databaseEnabled = true
                        mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                    }
                    setBackgroundColor(0x00000000)
                    onWebViewCreated(this)
                    webViewRef.value = this
                    loadUrl(url)
                }
            },
            update = { view ->
                // Only reload if the base URL has actually changed and we aren't currently loading
                val currentUrl = view.url?.removeSuffix("/")
                val targetUrl = url.removeSuffix("/")
                if (currentUrl != targetUrl && !isLoading && errorOccurred == null) {
                    view.loadUrl(url)
                }
            },
            modifier = Modifier.fillMaxSize()
        )

        // Loading Overlay
        AnimatedVisibility(
            visible = isLoading,
            enter = fadeIn(),
            exit = fadeOut()
        ) {
            Box(
                modifier = Modifier.fillMaxSize().background(darkBackground),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    CircularProgressIndicator(color = accentCyan)
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        "Initializing LifeOS Core...",
                        color = Color.White,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }

        // Error Overlay
        if (errorOccurred != null) {
            Box(
                modifier = Modifier.fillMaxSize().background(darkBackground).padding(32.dp),
                contentAlignment = Alignment.Center
            ) {
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF13112E)),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(
                            imageVector = Icons.Default.Warning,
                            contentDescription = "Error",
                            tint = Color(0xFFFF4E70),
                            modifier = Modifier.size(48.dp)
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            "Vite Server Offline",
                            color = Color.White,
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Black
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        val isEmulator = Build.PRODUCT.contains("sdk") ||
                                         Build.MODEL.contains("Emulator") ||
                                         Build.MANUFACTURER.contains("Genymotion")

                        val connectionHint = if (!isEmulator && url.contains("10.0.2.2")) {
                            "\n\nNote: 10.0.2.2 only works on emulators. On a physical device, use your computer's local IP (e.g. 192.168.x.x)."
                        } else ""

                        Text(
                            "Target: $url$connectionHint",
                            color = Color.White.copy(alpha = 0.6f),
                            fontSize = 12.sp,
                            textAlign = TextAlign.Center
                        )
                        Spacer(modifier = Modifier.height(24.dp))
                        Button(
                            onClick = {
                                errorOccurred = null
                                isLoading = true
                                webViewRef.value?.reload()
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF8A5DF2))
                        ) {
                            Icon(Icons.Default.Refresh, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("RETRY CONNECTION")
                        }
                    }
                }
            }
        }
    }
}
