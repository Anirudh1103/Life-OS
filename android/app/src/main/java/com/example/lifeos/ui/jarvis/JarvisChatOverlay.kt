package com.example.lifeos.ui.jarvis

import androidx.compose.animation.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.ContentCopy
import androidx.compose.material.icons.outlined.PlayCircle
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.lifeos.jarvis.JarvisController
import com.example.lifeos.jarvis.ChatMessage
import com.example.lifeos.theme.*
import com.example.lifeos.ui.components.JarvisArcReactor
import java.util.Calendar

@Composable
fun JarvisChatConsole(
    onClose: () -> Unit
) {
    val messages by JarvisController.messages.collectAsStateWithLifecycle()
    val isSpeaking by JarvisController.isSpeaking.collectAsStateWithLifecycle()
    var inputText by remember { mutableStateOf("") }
    val listState = rememberLazyListState()

    val configuration = LocalConfiguration.current
    val isTablet = configuration.screenWidthDp >= 720

    val darkBackground = Color(0xFF0C0A1C)
    val cardBackground = Color(0xFF13112E)
    val accentCyan = Color(0xFF2DE1FC)
    val accentViolet = Color(0xFF8A5DF2)

    val suggestionPrompts = remember {
        val hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
        when {
            hour < 12 -> listOf("Brief me on my day", "What are my tasks?", "Open Learning")
            hour < 17 -> listOf("What tasks are left?", "Open Fitness", "How is my progress?")
            hour < 21 -> listOf("Show my achievements", "Suggest a workout", "Log my expenses")
            else -> listOf("Plan my tomorrow", "Set an alarm for 7 AM", "Daily summary")
        }
    }

    LaunchedEffect(messages.size) {
        if (messages.isNotEmpty()) {
            listState.animateScrollToItem(messages.size - 1)
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black.copy(alpha = 0.6f))
            .clickable { onClose() },
        contentAlignment = Alignment.Center
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth(if (isTablet) 0.9f else 1f)
                .fillMaxHeight(if (isTablet) 0.85f else 1f)
                .clickable(enabled = false) {},
            shape = if (isTablet) RoundedCornerShape(24.dp) else RoundedCornerShape(0.dp),
            colors = CardDefaults.cardColors(containerColor = darkBackground),
            border = BorderStroke(1.dp, Color(0xFF221E4E).copy(alpha = 0.5f))
        ) {
            if (isTablet) {
                TabletLayout(onClose, isSpeaking, suggestionPrompts, messages, inputText, { inputText = it }, { 
                    if (inputText.isNotBlank()) {
                        JarvisController.processQuery(inputText.trim())
                        inputText = ""
                    }
                }, listState, accentCyan, accentViolet, cardBackground)
            } else {
                // Phone Full-Screen Overlay
                Column(modifier = Modifier.fillMaxSize()) {
                    // Header Bar
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(cardBackground)
                            .padding(horizontal = 16.dp, vertical = 14.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        IconButton(onClick = onClose) {
                            Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = Color.White)
                        }
                        Spacer(modifier = Modifier.width(8.dp))
                        Column {
                            Text(
                                "JARVIS",
                                color = Color.White,
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Box(
                                    modifier = Modifier
                                        .size(6.dp)
                                        .background(Color(0xFF00FFC6), CircleShape)
                                )
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(
                                    "Systems Operational",
                                    color = Color.White.copy(alpha = 0.4f),
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Medium
                                )
                            }
                        }
                        Spacer(modifier = Modifier.weight(1f))
                        JarvisArcReactor(
                            size = 32.dp,
                            state = if (isSpeaking) "listening" else "idle"
                        )
                    }

                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .fillMaxWidth()
                    ) {
                        if (messages.isEmpty()) {
                            JarvisEmptyState(accentCyan)
                        } else {
                            LazyColumn(
                                state = listState,
                                modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp),
                                verticalArrangement = Arrangement.spacedBy(16.dp),
                                contentPadding = PaddingValues(top = 16.dp, bottom = 16.dp)
                            ) {
                                items(messages) { msg ->
                                    JarvisMessageItem(msg, accentCyan, accentViolet)
                                }
                            }
                        }
                    }

                    // Prompt suggestions carousel
                    LazyRow(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 8.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(suggestionPrompts) { prompt ->
                            SuggestionChip(prompt) {
                                JarvisController.processQuery(prompt)
                            }
                        }
                    }

                    ChatInputSection(
                        inputText = inputText,
                        onValueChange = { inputText = it },
                        onSend = {
                            if (inputText.isNotBlank()) {
                                JarvisController.processQuery(inputText.trim())
                                inputText = ""
                            }
                        },
                        accentViolet = accentViolet
                    )
                }
            }
        }
    }
}

@Composable
fun TabletLayout(
    onClose: () -> Unit,
    isSpeaking: Boolean,
    suggestionPrompts: List<String>,
    messages: List<ChatMessage>,
    inputText: String,
    onValueChange: (String) -> Unit,
    onSend: () -> Unit,
    listState: androidx.compose.foundation.lazy.LazyListState,
    accentCyan: Color,
    accentViolet: Color,
    cardBackground: Color
) {
    Row(modifier = Modifier.fillMaxSize()) {
        Column(
            modifier = Modifier
                .width(320.dp)
                .fillMaxHeight()
                .background(cardBackground.copy(alpha = 0.3f))
                .border(width = 1.dp, color = Color.White.copy(alpha = 0.05f))
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = onClose) { Icon(Icons.Default.ArrowBack, "Back", tint = Color.White) }
                Spacer(modifier = Modifier.width(8.dp))
                Text("JARVIS AI", color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Bold)
            }

            Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.weight(1f), verticalArrangement = Arrangement.Center) {
                JarvisArcReactor(size = 120.dp, state = if (isSpeaking) "listening" else "idle")
                Spacer(modifier = Modifier.height(24.dp))
                Text("Good day, Sir", color = Color.White, fontSize = 24.sp, fontWeight = FontWeight.Black)
                Text("Cognitive processors online.", color = Color.White.copy(alpha = 0.5f), fontSize = 13.sp)
                Spacer(modifier = Modifier.height(24.dp))
                suggestionPrompts.forEach { SuggestionChip(it) { JarvisController.processQuery(it) }; Spacer(Modifier.height(8.dp)) }
            }
        }

        Column(modifier = Modifier.weight(1f).fillMaxHeight()) {
            Box(modifier = Modifier.weight(1f).fillMaxWidth()) {
                LazyColumn(state = listState, modifier = Modifier.fillMaxSize().padding(horizontal = 24.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                    items(messages) { msg -> JarvisMessageItem(msg, accentCyan, accentViolet) }
                }
            }
            ChatInputSection(inputText, onValueChange, onSend, accentViolet)
        }
    }
}

@Composable
fun JarvisEmptyState(accentCyan: Color) {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.padding(32.dp)) {
            Icon(Icons.Default.AutoAwesome, null, tint = accentCyan, modifier = Modifier.size(48.dp))
            Spacer(modifier = Modifier.height(16.dp))
            Text("JARVIS", color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.Black, letterSpacing = 2.sp)
            Text("Ready for your command, Sir.", color = Color.White.copy(alpha = 0.5f), fontSize = 12.sp)
        }
    }
}

@Composable
fun SuggestionChip(prompt: String, onClick: () -> Unit) {
    Surface(
        modifier = Modifier
            .clickable { onClick() }
            .shadow(4.dp, RoundedCornerShape(16.dp)),
        color = Color(0xFF1A163F),
        shape = RoundedCornerShape(16.dp),
        border = BorderStroke(1.dp, Color(0xFF2DE1FC).copy(alpha = 0.2f))
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Icon(
                imageVector = Icons.Default.AutoAwesome,
                contentDescription = null,
                tint = Color(0xFF2DE1FC),
                modifier = Modifier.size(12.dp)
            )
            Text(prompt, color = Color(0xFF2DE1FC), fontSize = 11.sp, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
fun ChatInputSection(inputText: String, onValueChange: (String) -> Unit, onSend: () -> Unit, accentViolet: Color) {
    Surface(color = Color(0xFF0C0A1C), modifier = Modifier.fillMaxWidth()) {
        Row(modifier = Modifier.fillMaxWidth().padding(16.dp).navigationBarsPadding().imePadding(), horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
            IconButton(onClick = {}, modifier = Modifier.background(Color.White.copy(alpha = 0.05f), CircleShape).size(40.dp)) {
                Icon(Icons.Default.AttachFile, "Attach", tint = Color.White.copy(alpha = 0.6f))
            }
            OutlinedTextField(
                value = inputText,
                onValueChange = onValueChange,
                placeholder = { Text("Message JARVIS...", fontSize = 12.sp, color = Color.White.copy(alpha = 0.3f)) },
                modifier = Modifier.weight(1f),
                shape = RoundedCornerShape(20.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    unfocusedTextColor = Color.White, focusedTextColor = Color.White,
                    focusedBorderColor = Color(0xFF2DE1FC), unfocusedBorderColor = Color.White.copy(alpha = 0.1f),
                    cursorColor = Color(0xFF2DE1FC), focusedContainerColor = Color.White.copy(alpha = 0.02f)
                ),
                singleLine = true
            )
            IconButton(onClick = onSend, modifier = Modifier.size(40.dp).background(Brush.linearGradient(listOf(accentViolet, Color(0xFF6366F1))), CircleShape)) {
                Icon(Icons.AutoMirrored.Filled.Send, "Send", tint = Color.White, modifier = Modifier.size(16.dp))
            }
        }
    }
}

@Composable
fun JarvisMessageItem(message: ChatMessage, accentCyan: Color, accentViolet: Color) {
    val isAssistant = message.role == "assistant"
    Column(modifier = Modifier.fillMaxWidth(), horizontalAlignment = if (isAssistant) Alignment.Start else Alignment.End) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = if (isAssistant) Arrangement.Start else Arrangement.End, modifier = Modifier.fillMaxWidth()) {
            if (isAssistant) {
                Icon(Icons.Default.AutoAwesome, null, tint = accentCyan, modifier = Modifier.size(10.dp))
                Spacer(modifier = Modifier.width(4.dp))
                Text("JARVIS", color = accentCyan, fontWeight = FontWeight.Black, fontSize = 8.sp, letterSpacing = 1.sp)
            } else {
                Text("YOU", color = accentViolet, fontWeight = FontWeight.Black, fontSize = 8.sp, letterSpacing = 1.sp)
            }
        }
        Spacer(modifier = Modifier.height(4.dp))
        Surface(
            color = if (isAssistant) Color(0xFF1A163F) else accentViolet.copy(alpha = 0.2f),
            shape = RoundedCornerShape(topStart = if (isAssistant) 4.dp else 16.dp, topEnd = if (isAssistant) 16.dp else 4.dp, bottomStart = 16.dp, bottomEnd = 16.dp),
            border = BorderStroke(1.dp, if (isAssistant) accentCyan.copy(alpha = 0.2f) else accentViolet.copy(alpha = 0.3f)),
            modifier = Modifier
                .widthIn(max = 300.dp)
                .then(if (isAssistant) Modifier.shadow(12.dp, RoundedCornerShape(16.dp), spotColor = accentCyan, ambientColor = accentCyan) else Modifier)
        ) {
            val backgroundBrush = if (isAssistant) {
                Brush.linearGradient(
                    colors = listOf(Color(0xFF1A163F), Color(0xFF13112E))
                )
            } else null

            Box(modifier = Modifier.then(if (backgroundBrush != null) Modifier.background(backgroundBrush) else Modifier).padding(12.dp)) {
                Column {
                    JarvisMarkdownText(text = message.content, accentCyan = accentCyan)
                    if (isAssistant && message.content != "Processing, Sir...") {
                        Spacer(modifier = Modifier.height(16.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp, Alignment.End),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            val clipboard = LocalClipboardManager.current
                            
                            // Premium Action Button: Copy
                            Surface(
                                onClick = { clipboard.setText(AnnotatedString(message.content)) },
                                color = Color.White.copy(alpha = 0.05f),
                                shape = RoundedCornerShape(12.dp),
                                border = BorderStroke(1.dp, Color.White.copy(alpha = 0.1f)),
                                modifier = Modifier.size(36.dp)
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Icon(Icons.Outlined.ContentCopy, "Copy", tint = Color.White.copy(alpha = 0.7f), modifier = Modifier.size(16.dp))
                                }
                            }

                            // Premium Action Button: Play
                            Surface(
                                onClick = { 
                                    JarvisController.speakMessage(message.content)
                                },
                                color = AccentViolet.copy(alpha = 0.15f),
                                shape = RoundedCornerShape(12.dp),
                                border = BorderStroke(1.dp, AccentViolet.copy(alpha = 0.3f)),
                                modifier = Modifier.size(36.dp)
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Icon(Icons.Outlined.PlayCircle, "Play Voice", tint = AccentViolet, modifier = Modifier.size(18.dp))
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun JarvisMarkdownText(text: String, accentCyan: Color) {
    val lines = text.split("\n")
    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        lines.forEach { line ->
            when {
                line.trim().startsWith("- [ ]") -> {
                    val taskParts = line.split("(ID:")
                    val title = taskParts[0].replace("- [ ]", "").trim()
                    val id = taskParts.getOrNull(1)?.replace(")", "")?.trim()
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Checkbox(checked = false, onCheckedChange = { if (id != null) JarvisController.completeTask(id) }, 
                            colors = CheckboxDefaults.colors(uncheckedColor = accentCyan.copy(alpha = 0.5f), checkmarkColor = Color.Black),
                            modifier = Modifier.scale(0.7f).size(24.dp))
                        Text(text = parseBoldText(title), color = Color.White, fontSize = 13.sp)
                    }
                }
                line.trim().startsWith("-") || line.trim().startsWith("*") -> {
                    Row {
                        Text("• ", color = accentCyan, fontSize = 13.sp)
                        Text(text = parseBoldText(line.trim().substring(1).trim()), color = Color.White, fontSize = 13.sp, lineHeight = 18.sp)
                    }
                }
                else -> {
                    Text(text = parseBoldText(line), color = Color.White, fontSize = 13.sp, lineHeight = 18.sp)
                }
            }
        }
    }
}

fun parseBoldText(text: String): AnnotatedString {
    return buildAnnotatedString {
        // Render paired Markdown emphasis, then discard any unpaired formatting
        // markers instead of exposing literal asterisks in the chat bubble.
        val matcher = Regex("(\\*{1,3})(.+?)\\1").findAll(text)
        var cursor = 0

        matcher.forEach { match ->
            append(text.substring(cursor, match.range.first).replace("*", ""))
            withStyle(style = SpanStyle(fontWeight = FontWeight.Bold, color = Color(0xFF2DE1FC))) {
                append(match.groupValues[2])
            }
            cursor = match.range.last + 1
        }

        append(text.substring(cursor).replace("*", ""))
    }
}
