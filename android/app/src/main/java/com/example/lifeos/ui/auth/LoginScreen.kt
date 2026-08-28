package com.example.lifeos.ui.auth

import android.view.View
import android.graphics.Canvas
import com.caverock.androidsvg.SVG
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import kotlinx.coroutines.delay

private enum class JarvisOrbState { IDLE, FOCUS, PROCESSING, SUCCESS, ERROR }

private class SvgCanvasView(
    context: android.content.Context,
    private val svg: SVG,
    private val centerArtwork: Boolean = false
) : View(context) {
    init { setLayerType(View.LAYER_TYPE_SOFTWARE, null) }
    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        // AndroidSVG uses the actual canvas viewport here, preserving its original viewBox.
        // The supplied wordmark artwork sits left of centre inside its 900-unit source canvas.
        // Translate only its render viewport; the canonical SVG file itself stays untouched.
        if (centerArtwork) canvas.translate(width * 0.16f, 0f)
        svg.renderToCanvas(canvas)
    }
}

/** Renders the supplied SVG asset natively; no WebView/text fallback is involved. */
@Composable private fun SvgAsset(name: String, modifier: Modifier = Modifier) = AndroidView(
    factory = { c ->
        val id = c.resources.getIdentifier(name, "raw", c.packageName)
        val svg = c.resources.openRawResource(id).use { SVG.getFromInputStream(it) }
        SvgCanvasView(c, svg, centerArtwork = name == "lifeos_logo")
    },
    modifier = modifier
)

@Composable private fun JarvisOrb(state: JarvisOrbState, modifier: Modifier = Modifier) {
    val ambient = rememberInfiniteTransition(label = "jarvis")
    val breathe by ambient.animateFloat(1f, 1.025f, infiniteRepeatable(tween(1850, easing = FastOutSlowInEasing), RepeatMode.Reverse), label = "breathe")
    val rings by ambient.animateFloat(0f, if (state == JarvisOrbState.PROCESSING) 360f else 4f, infiniteRepeatable(tween(if (state == JarvisOrbState.PROCESSING) 1700 else 14000, easing = LinearEasing), RepeatMode.Restart), label = "rings")
    val stateScale by animateFloatAsState(if (state == JarvisOrbState.SUCCESS) 1.12f else if (state == JarvisOrbState.PROCESSING) 1.045f else 1f, tween(400), label = "state")
    Box(modifier, contentAlignment = Alignment.Center) {
        SvgAsset("jarvis_rings", Modifier.fillMaxSize().rotate(rings).alpha(if (state == JarvisOrbState.FOCUS) .65f else .46f))
        if (state == JarvisOrbState.SUCCESS) SvgAsset("glow_ring", Modifier.fillMaxSize().scale(stateScale))
        SvgAsset("jarvis_orb", Modifier.fillMaxSize(.64f).scale(breathe * stateScale))
        if (state == JarvisOrbState.PROCESSING) SvgAsset("waveform", Modifier.align(Alignment.BottomCenter).fillMaxWidth(.74f).height(26.dp).alpha(.72f))
        if (state == JarvisOrbState.SUCCESS) SvgAsset("spark", Modifier.align(Alignment.TopEnd).size(30.dp))
    }
}

@Composable
fun LoginScreen(viewModel: AuthViewModel, onAuthenticationStarted: () -> Unit = {}, onAuthenticationAnimated: () -> Unit = {}) {
    val auth by viewModel.state.collectAsStateWithLifecycle()
    val dark = androidx.compose.foundation.isSystemInDarkTheme()
    val text = if (dark) Color(0xFFF7F6FF) else Color(0xFF17142A)
    val muted = if (dark) Color(0xFFAAA7D0) else Color(0xFF656080)
    val config = LocalConfiguration.current
    val tablet = config.smallestScreenWidthDp >= 600
    var email by remember { mutableStateOf("") }; var password by remember { mutableStateOf("") }; var visible by remember { mutableStateOf(false) }
    var attempted by remember { mutableStateOf(false) }; var focused by remember { mutableStateOf(false) }; var success by remember { mutableStateOf(false) }
    val emailError = attempted && !android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches(); val passwordError = attempted && password.isBlank()
    val state = when { auth is AuthState.Loading -> JarvisOrbState.PROCESSING; auth is AuthState.Authenticated -> JarvisOrbState.SUCCESS; auth is AuthState.Error -> JarvisOrbState.ERROR; focused -> JarvisOrbState.FOCUS; else -> JarvisOrbState.IDLE }
    LaunchedEffect(auth) { if (auth is AuthState.Authenticated && !success) { success = true; delay(800); onAuthenticationAnimated() } }
    var stage by remember { mutableIntStateOf(0) }; LaunchedEffect(Unit) { delay(150); stage = 1; delay(200); stage = 2; delay(200); stage = 3 }
    Box(Modifier.fillMaxSize().background(if (dark) Color(0xFF050611) else Color(0xFFF5F4FA))) {
        AmbientBackground(dark)
        Column(Modifier.fillMaxSize().imePadding().verticalScroll(rememberScrollState()).padding(horizontal = if (tablet) 52.dp else 18.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Spacer(Modifier.height(if (tablet) 42.dp else 26.dp)); AnimatedVisibility(stage >= 1) { JarvisOrb(state, Modifier.size(if (tablet) 350.dp else 280.dp)) }
            AnimatedVisibility(stage >= 2) { SvgAsset("lifeos_logo", Modifier.width(if (tablet) 380.dp else 270.dp).height(if (tablet) 126.dp else 90.dp).padding(top = 4.dp)) }
            AnimatedVisibility(stage >= 2) { Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.padding(top = if (tablet) 22.dp else 18.dp)) { Text("Welcome back", color = text, fontSize = if (tablet) 40.sp else 34.sp, fontWeight = FontWeight.Medium); Spacer(Modifier.height(8.dp)); Text("Sign in to continue your journey with JARVIS", color = muted, fontSize = if (tablet) 17.sp else 15.sp) } }
            AnimatedVisibility(stage >= 3) { GlassCard(dark, tablet, text, muted, email, password, visible, emailError, passwordError, { email = it }, { password = it }, { visible = !visible }, { focused = it }, auth is AuthState.Loading, (auth as? AuthState.Error)?.message, { attempted = true; if (!emailError && !passwordError) { onAuthenticationStarted(); viewModel.signIn(email, password) } }) }
            Spacer(Modifier.height(28.dp))
        }
    }
}

@Composable private fun AmbientBackground(dark: Boolean) {
    val a by rememberInfiniteTransition(label = "ambient").animateFloat(.55f, .82f, infiniteRepeatable(tween(7000, easing = FastOutSlowInEasing), RepeatMode.Reverse), label = "glow")
    Box(Modifier.fillMaxSize().background(Brush.verticalGradient(listOf(if (dark) Color(0xFF080B22) else Color(0xFFF0EDFF), if (dark) Color(0xFF060611) else Color(0xFFF7F8FD)))))
    Box(Modifier.fillMaxWidth().height(350.dp).alpha(a).background(Brush.radialGradient(listOf(Color(0xFF6429C6).copy(.25f), Color.Transparent))))
}

@Composable private fun GlassCard(dark: Boolean, tablet: Boolean, text: Color, muted: Color, email: String, password: String, visible: Boolean, emailError: Boolean, passwordError: Boolean, onEmail: (String)->Unit, onPassword: (String)->Unit, toggle: ()->Unit, onFocus: (Boolean)->Unit, loading: Boolean, error: String?, submit: ()->Unit) {
    Column(Modifier.widthIn(max = if (tablet) 680.dp else 560.dp).fillMaxWidth().padding(top = if (tablet) 42.dp else 32.dp).background(if (dark) Color(0xE60D1030) else Color(0xEEFFFFFF), RoundedCornerShape(if (tablet) 34.dp else 28.dp)).border(1.dp, Color(0xFF9967FF).copy(.38f), RoundedCornerShape(if (tablet) 34.dp else 28.dp)).padding(if (tablet) 32.dp else 28.dp)) {
        LifeOSTextField("Email", "Enter your email", email, onEmail, Icons.Default.Email, false, false, emailError, "Enter a valid email address.", onFocus, ImeAction.Next, text, muted, tablet = tablet)
        Spacer(Modifier.height(if (tablet) 24.dp else 22.dp)); LifeOSTextField("Password", "Enter your password", password, onPassword, Icons.Default.Lock, true, visible, passwordError, "Password cannot be empty.", onFocus, ImeAction.Done, text, muted, toggle, tablet)
        Spacer(Modifier.height(if (tablet) 32.dp else 30.dp)); GradientButton(loading, submit, tablet)
        AnimatedVisibility(error != null) { Text(error ?: "", color = Color(0xFFFF8394), fontSize = 12.sp, modifier = Modifier.padding(top = 12.dp)) }
        Row(Modifier.fillMaxWidth().padding(top = 22.dp), horizontalArrangement = Arrangement.Center, verticalAlignment = Alignment.CenterVertically) { SvgAsset("security_shield", Modifier.size(24.dp)); Spacer(Modifier.width(9.dp)); Text("Your data is protected with enterprise-grade security.", color = muted, fontSize = 11.sp) }
    }
}

@Composable private fun LifeOSTextField(label: String, placeholder: String, value: String, change: (String)->Unit, icon: androidx.compose.ui.graphics.vector.ImageVector, isPassword: Boolean, visible: Boolean, error: Boolean, errorText: String, onFocus: (Boolean)->Unit, ime: ImeAction, text: Color, muted: Color, toggle: (() -> Unit)? = null, tablet: Boolean = false) {
    val interactions = remember { MutableInteractionSource() }; val focused by interactions.collectIsFocusedAsState()
    Column { Text(label, color = muted, fontSize = if (tablet) 17.sp else 14.sp, modifier = Modifier.padding(bottom = 8.dp))
        OutlinedTextField(value, change, singleLine = true, interactionSource = interactions, placeholder = { Text(placeholder, color = muted.copy(.8f), fontSize = if (tablet) 18.sp else 16.sp) }, leadingIcon = { Icon(icon, null, tint = Color(0xFFC177FF), modifier = Modifier.size(if (tablet) 26.dp else 24.dp)) }, trailingIcon = if (isPassword) {{ IconButton(toggle ?: {}) { Icon(if (visible) Icons.Default.VisibilityOff else Icons.Default.Visibility, if (visible) "Hide password" else "Show password", tint = muted) } }} else null, visualTransformation = if (isPassword && !visible) PasswordVisualTransformation() else VisualTransformation.None, isError = error, keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(keyboardType = if (isPassword) KeyboardType.Password else KeyboardType.Email, imeAction = ime), modifier = Modifier.fillMaxWidth().heightIn(min = if (tablet) 76.dp else 64.dp), shape = RoundedCornerShape(16.dp), colors = OutlinedTextFieldDefaults.colors(focusedTextColor = text, unfocusedTextColor = text, focusedBorderColor = Color(0xFFA96DFF), unfocusedBorderColor = Color(0xFF7550B9).copy(.55f), cursorColor = Color(0xFFB877FF), focusedContainerColor = Color(0xFF0E1030).copy(.42f), unfocusedContainerColor = Color(0xFF0E1030).copy(.24f)))
        LaunchedEffect(focused) { onFocus(focused) }; AnimatedVisibility(error) { Text(errorText, color = Color(0xFFFF8394), fontSize = 11.sp, modifier = Modifier.padding(top = 5.dp)) }
    }
}

@Composable private fun GradientButton(loading: Boolean, click: () -> Unit, tablet: Boolean) {
    val source = remember { MutableInteractionSource() }; val pressed by source.collectIsPressedAsState(); val scale by animateFloatAsState(if (pressed) .97f else 1f, tween(130), label = "press")
    Box(Modifier.fillMaxWidth().height(if (tablet) 76.dp else 64.dp).scale(scale).background(Brush.horizontalGradient(listOf(Color(0xFF892BF0), Color(0xFF5C39F0), Color(0xFF2579F4))), RoundedCornerShape(17.dp)).clickable(interactionSource = source, indication = null, enabled = !loading, onClick = click), contentAlignment = Alignment.Center) { if (loading) Row(verticalAlignment = Alignment.CenterVertically) { CircularProgressIndicator(Modifier.size(19.dp), color = Color.White, strokeWidth = 2.dp); Spacer(Modifier.width(10.dp)); Text("Signing in…", color = Color.White, fontSize = if (tablet) 20.sp else 18.sp) } else Row(verticalAlignment = Alignment.CenterVertically) { Text("Sign In", color = Color.White, fontSize = if (tablet) 21.sp else 20.sp); Spacer(Modifier.width(18.dp)); Icon(Icons.Default.ArrowForward, null, tint = Color.White) } }
}
