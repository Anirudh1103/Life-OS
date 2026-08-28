package com.example.lifeos

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation3.runtime.NavKey
import androidx.navigation3.runtime.entryProvider
import androidx.navigation3.runtime.rememberNavBackStack
import androidx.navigation3.ui.NavDisplay
import com.example.lifeos.jarvis.JarvisController
import com.example.lifeos.jarvis.JarvisState
import com.example.lifeos.jarvis.orbVisualState
import com.example.lifeos.jarvis.service.JarvisWakeWordService
import com.example.lifeos.ui.jarvis.VoiceEnrollmentScreen
import com.example.lifeos.ui.jarvis.LifeOSIntro
import com.example.lifeos.ui.jarvis.LifeOSSplash
import com.example.lifeos.jarvis.prefs.JarvisPrefs
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.Assignment
import androidx.compose.material.icons.outlined.FavoriteBorder
import androidx.compose.material.icons.outlined.MenuBook
import androidx.compose.material.icons.outlined.AccountBalanceWallet
import com.example.lifeos.ui.dashboard.DashboardScreen
import com.example.lifeos.ui.fitness.FitnessScreen
import com.example.lifeos.ui.main.DiagnosticPanel
import com.example.lifeos.ui.profile.ProfileScreen
import com.example.lifeos.ui.tasks.TasksScreen
import com.example.lifeos.ui.learning.LearningScreen
import com.example.lifeos.ui.finance.FinanceScreen
import com.example.lifeos.ui.alarm.AlarmScreen
import com.example.lifeos.ui.settings.SettingsScreen
import com.example.lifeos.ui.components.JarvisArcReactor
import com.example.lifeos.ui.jarvis.JarvisChatConsole
import kotlinx.coroutines.launch
import kotlinx.serialization.Serializable

import com.example.lifeos.ui.auth.AuthViewModel
import com.example.lifeos.ui.auth.AuthState
import com.example.lifeos.ui.auth.LoginScreen
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.lifeos.jarvis.navigation.JarvisNavigationManager
import com.example.lifeos.ui.utils.LifeOSWindowSize
import com.example.lifeos.ui.utils.rememberWindowSizeClass

@Composable
@OptIn(ExperimentalMaterial3Api::class)
fun MainNavigation(
    authViewModel: AuthViewModel = viewModel()
) {
    val authState by authViewModel.state.collectAsStateWithLifecycle()
    val context = LocalContext.current
    val windowSize = rememberWindowSizeClass()
    var launchReady by remember { mutableStateOf(false) }
    var onboarding by remember { mutableStateOf(false) }
    var authenticationAnimationActive by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        kotlinx.coroutines.delay(3000)
        launchReady = true
    }

    if (!launchReady) {
        LifeOSSplash()
    } else if (authState !is AuthState.Authenticated || authenticationAnimationActive) {
        LoginScreen(
            viewModel = authViewModel,
            onAuthenticationStarted = { authenticationAnimationActive = true },
            onAuthenticationAnimated = { authenticationAnimationActive = false }
        )
    } else if (onboarding) {
        VoiceEnrollmentScreen(onFinish = { onboarding = false })
    } else if (!JarvisPrefs.isSetupCompleted(context) && !JarvisPrefs.hasSeenIntro(context)) {
        LifeOSIntro(
            onBegin = {
                JarvisPrefs.setIntroSeen(context, true)
                onboarding = true
            },
            onSkip = { JarvisPrefs.setIntroSeen(context, true) }
        )
    } else {
        AppDrawerContent(authViewModel, windowSize)
    }
}

@Composable
@OptIn(ExperimentalMaterial3Api::class)
fun AppDrawerContent(authViewModel: AuthViewModel, windowSize: LifeOSWindowSize) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val drawerState = rememberDrawerState(initialValue = DrawerValue.Closed)

    val jarvisState by JarvisController.state.collectAsStateWithLifecycle()
    var showJarvisChat by remember { mutableStateOf(false) }

    val backStack = rememberNavBackStack(Dashboard)
    val currentKey = backStack.lastOrNull()

    // Observe JARVIS navigation events
    LaunchedEffect(Unit) {
        JarvisNavigationManager.navEvents.collect { key ->
            backStack.add(key)
        }
    }
    LaunchedEffect(Unit) {
        JarvisNavigationManager.backEvents.collect {
            backStack.removeLastOrNull()
        }
    }

    // Restore listening only if the user previously enabled it.
    LaunchedEffect(Unit) {
        val permission = Manifest.permission.RECORD_AUDIO
        val granted = ContextCompat.checkSelfPermission(context, permission) == PackageManager.PERMISSION_GRANTED
        if (granted && JarvisPrefs.isListenEnabled(context)) {
            val startIntent = Intent(context, JarvisWakeWordService::class.java).apply {
                action = JarvisWakeWordService.ACTION_START
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(startIntent)
            } else {
                context.startService(startIntent)
            }
        }
    }

    val darkBackground = Color(0xFF0C0A1C)
    val drawerBackground = Color(0xFF13112E)
    val accentCyan = Color(0xFF2DE1FC)
    val accentViolet = Color(0xFF8A5DF2)

    val isCompact = windowSize == LifeOSWindowSize.Compact

    ModalNavigationDrawer(
        drawerState = drawerState,
        gesturesEnabled = isCompact,
        drawerContent = {
            ModalDrawerSheet(
                drawerContainerColor = drawerBackground,
                modifier = Modifier
                    .width(300.dp)
                    .fillMaxHeight(),
                drawerShape = RoundedCornerShape(topEnd = 24.dp, bottomEnd = 24.dp)
            ) {
                Column(modifier = Modifier.padding(24.dp).fillMaxHeight()) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text("LifeOS", color = Color.White, fontSize = 24.sp, fontWeight = FontWeight.Black)
                            Text("COMMAND CORE CONTROL", color = Color(0xFF2DE1FC), fontSize = 8.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                        }
                        IconButton(
                            onClick = { scope.launch { drawerState.close() } },
                            modifier = Modifier.size(32.dp)
                        ) {
                            Icon(Icons.Default.Close, contentDescription = "Close", tint = Color.White.copy(alpha = 0.5f))
                        }
                    }

                    Spacer(modifier = Modifier.height(32.dp))

                    DrawerItem("Personalised Tasks", Icons.Default.CheckCircle, currentKey == Tasks) {
                        backStack.add(Tasks)
                        scope.launch { drawerState.close() }
                    }
                    DrawerItem("Fitness", Icons.Default.FavoriteBorder, currentKey == Fitness) {
                        backStack.add(Fitness)
                        scope.launch { drawerState.close() }
                    }
                    DrawerItem("Learning", Icons.Default.Book, currentKey == Learning) {
                        backStack.add(Learning)
                        scope.launch { drawerState.close() }
                    }
                    DrawerItem("Finance", Icons.Default.AccountBalanceWallet, currentKey == Finance) {
                        backStack.add(Finance)
                        scope.launch { drawerState.close() }
                    }
                    DrawerItem("Clock", Icons.Default.Schedule, currentKey == Alarms, hasAndroidTag = true) {
                        backStack.add(Alarms)
                        scope.launch { drawerState.close() }
                    }

                    Spacer(modifier = Modifier.height(16.dp))
                    Box(modifier = Modifier.fillMaxWidth().height(1.dp).background(Color.White.copy(alpha = 0.05f)))
                    Spacer(modifier = Modifier.height(16.dp))

                    DrawerItem("Settings", Icons.Default.Settings, currentKey == Settings) {
                        backStack.add(Settings)
                        scope.launch { drawerState.close() }
                    }
                    DrawerItem("Profile", Icons.Default.Person, currentKey == Profile) {
                        backStack.add(Profile)
                        scope.launch { drawerState.close() }
                    }

                    Spacer(modifier = Modifier.weight(1f))

                    DrawerItem("Sign out", Icons.Default.Logout, false, isRed = true) {
                        authViewModel.signOut()
                        scope.launch { drawerState.close() }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    Card(
                        colors = CardDefaults.cardColors(containerColor = Color(0xFF221E4E).copy(alpha = 0.4f)),
                        shape = RoundedCornerShape(16.dp),
                        border = BorderStroke(1.dp, Color(0xFF8A5DF2).copy(alpha = 0.2f)),
                        modifier = Modifier.fillMaxWidth().clickable {
                            showJarvisChat = true
                            scope.launch { drawerState.close() }
                        }
                    ) {
                        Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text("JARVIS AI", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                Spacer(modifier = Modifier.height(2.dp))
                                Text("Your intelligent assistant.", color = Color.White.copy(alpha = 0.5f), fontSize = 9.sp)
                            }
                            Box(modifier = Modifier.size(24.dp).background(Color(0xFF8A5DF2).copy(alpha = 0.15f), CircleShape), contentAlignment = Alignment.Center) {
                                Icon(Icons.Default.AutoAwesome, null, tint = Color(0xFF8A5DF2), modifier = Modifier.size(12.dp))
                            }
                        }
                    }
                }
            }
        }
    ) {
        Row(modifier = Modifier.fillMaxSize()) {
            if (!isCompact) {
                LifeOsNavigationRail(
                    currentKey = currentKey,
                    onNavigate = { backStack.add(it) },
                    accentViolet = accentViolet,
                    onOpenDrawer = { scope.launch { drawerState.open() } }
                )
            }

            Box(modifier = Modifier.weight(1f)) {
                Scaffold(
                    containerColor = darkBackground,
                    topBar = {
                        if (isCompact) {
                            TopAppBar(
                                title = { },
                                navigationIcon = {
                                    IconButton(onClick = { scope.launch { drawerState.open() } }) {
                                        Icon(Icons.Default.Menu, null, tint = Color.White)
                                    }
                                },
                                actions = { ProfileHeaderAction { backStack.add(Profile) } },
                                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.Transparent)
                            )
                        }
                    },
                    bottomBar = {
                        if (isCompact) {
                            LifeOsBottomNavigation(currentKey, { backStack.add(it) }, accentViolet)
                        }
                    }
                ) { innerPadding ->
                    Box(modifier = Modifier.fillMaxSize().padding(innerPadding), contentAlignment = Alignment.TopCenter) {
                        Box(modifier = Modifier.widthIn(max = 1200.dp).fillMaxSize()) {
                            NavDisplay(
                                backStack = backStack,
                                onBack = { backStack.removeLastOrNull() },
                                entryProvider = entryProvider {
                                    entry<Dashboard> { DashboardScreen(onNavigate = { backStack.add(it) }, windowSize = windowSize) }
                                    entry<Tasks> { TasksScreen() }
                                    entry<Fitness> { FitnessScreen() }
                                    entry<Learning> { LearningScreen() }
                                    entry<Finance> { FinanceScreen() }
                                    entry<Alarms> { AlarmScreen() }
                                    entry<Profile> { ProfileScreen(onToggleDiagnostics = { }) }
                                    entry<Settings> { SettingsScreen(onEnrollVoice = { backStack.add(VoiceEnrollment) }) }
                                    entry<VoiceEnrollment> { VoiceEnrollmentScreen({ backStack.removeLastOrNull() }) }
                                },
                                modifier = Modifier.fillMaxSize()
                            )
                        }
                    }
                }

                if (!showJarvisChat) {
                    Box(modifier = Modifier.fillMaxSize().padding(horizontal = 24.dp, vertical = if (isCompact) 96.dp else 24.dp)) {
                        JarvisArcReactor(
                            state = jarvisState.orbVisualState(),
                            modifier = Modifier.align(Alignment.BottomEnd),
                            onClick = { showJarvisChat = true }
                        )
                    }
                }

                if (showJarvisChat) {
                    JarvisChatConsole(onClose = { showJarvisChat = false })
                }
            }
        }
    }

    if (showJarvisChat) {
        BackHandler { showJarvisChat = false }
    }
}

@Composable
fun ProfileHeaderAction(onProfileClick: () -> Unit) {
    Box(modifier = Modifier.padding(end = 16.dp).size(36.dp).clickable { onProfileClick() }) {
        Box(modifier = Modifier.size(32.dp).clip(CircleShape).background(Color(0xFF221E4E)).border(1.dp, Color.White.copy(alpha = 0.2f), CircleShape), contentAlignment = Alignment.Center) {
            Icon(Icons.Default.Person, null, tint = Color.White.copy(alpha = 0.6f), modifier = Modifier.size(16.dp))
        }
        Box(modifier = Modifier.size(10.dp).align(Alignment.BottomEnd).background(Color(0xFF00FFC6), CircleShape).border(2.dp, Color(0xFF0C0A1C), CircleShape))
    }
}

@Composable
fun DrawerItem(label: String, icon: androidx.compose.ui.graphics.vector.ImageVector, selected: Boolean, hasAndroidTag: Boolean = false, isRed: Boolean = false, onClick: () -> Unit) {
    val tint = if (isRed) Color(0xFFFF4E70) else if (selected) Color(0xFF2DE1FC) else Color.White.copy(alpha = 0.5f)
    Surface(onClick = onClick, color = if (selected) Color(0xFF221E4E) else Color.Transparent, shape = RoundedCornerShape(12.dp), modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
        Row(modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp), verticalAlignment = Alignment.CenterVertically) {
            Icon(icon, null, tint = tint, modifier = Modifier.size(20.dp))
            Spacer(modifier = Modifier.width(16.dp))
            Text(label, color = tint, fontSize = 14.sp, fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium, modifier = Modifier.weight(1f))
            if (hasAndroidTag) {
                Box(modifier = Modifier.background(Color(0xFF8A5DF2).copy(alpha = 0.2f), RoundedCornerShape(4.dp)).padding(horizontal = 6.dp, vertical = 2.dp)) {
                    Text("Android", color = Color(0xFF8A5DF2), fontSize = 8.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
fun LifeOsBottomNavigation(currentKey: NavKey?, onNavigate: (NavKey) -> Unit, accentViolet: Color) {
    val navItems = remember { listOf(Triple(Dashboard, "Home", Icons.Outlined.Home), Triple(Tasks, "Tasks", Icons.Outlined.Assignment), Triple(Fitness, "Fitness", Icons.Outlined.FavoriteBorder), Triple(Learning, "Learning", Icons.Outlined.MenuBook), Triple(Finance, "Finance", Icons.Outlined.AccountBalanceWallet)) }
    val selectedIndex = remember(currentKey) { when (currentKey) { Dashboard -> 0; Tasks -> 1; Fitness -> 2; Learning -> 3; Finance -> 4; else -> 0 } }
    Box(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 16.dp)) {
        BoxWithConstraints(modifier = Modifier.fillMaxWidth().height(72.dp).clip(RoundedCornerShape(24.dp)).background(Color(0xFF13112E).copy(alpha = 0.92f)).border(BorderStroke(1.dp, Color.White.copy(alpha = 0.05f)), RoundedCornerShape(24.dp)).shadow(12.dp, RoundedCornerShape(24.dp))) {
            val tabWidth = maxWidth / 5
            val animatedOffset by animateDpAsState(targetValue = tabWidth * selectedIndex, animationSpec = spring(dampingRatio = Spring.DampingRatioLowBouncy, stiffness = Spring.StiffnessMediumLow), label = "nav_selected_offset")
            Box(modifier = Modifier.offset(x = animatedOffset).width(tabWidth).fillMaxHeight().padding(horizontal = 8.dp, vertical = 6.dp).clip(RoundedCornerShape(18.dp)).background(Brush.radialGradient(colors = listOf(accentViolet.copy(alpha = 0.22f), accentViolet.copy(alpha = 0.04f)))).border(1.dp, accentViolet.copy(alpha = 0.12f), RoundedCornerShape(18.dp)))
            Row(modifier = Modifier.fillMaxSize(), verticalAlignment = Alignment.CenterVertically) {
                navItems.forEachIndexed { index, (route, label, icon) ->
                    val isSelected = selectedIndex == index
                    val contentColor by animateColorAsState(targetValue = if (isSelected) accentViolet else Color(0xFFA8A8B8), label = "nav_content_color")
                    Box(modifier = Modifier.weight(1f).fillMaxHeight().clickable(interactionSource = remember { MutableInteractionSource() }, indication = null, onClick = { onNavigate(route) }), contentAlignment = Alignment.Center) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
                            Icon(if (label == "Home" && isSelected) Icons.Default.Home else icon, label, tint = contentColor, modifier = Modifier.size(22.dp))
                            Spacer(Modifier.height(4.dp))
                            Text(label, color = contentColor, fontSize = 11.sp)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun LifeOsNavigationRail(currentKey: NavKey?, onNavigate: (NavKey) -> Unit, accentViolet: Color, onOpenDrawer: () -> Unit) {
    val navItems = remember { listOf(Triple(Dashboard, "Home", Icons.Outlined.Home), Triple(Tasks, "Tasks", Icons.Outlined.Assignment), Triple(Fitness, "Fitness", Icons.Outlined.FavoriteBorder), Triple(Learning, "Learning", Icons.Outlined.MenuBook), Triple(Finance, "Finance", Icons.Outlined.AccountBalanceWallet)) }
    val selectedIndex = remember(currentKey) { when (currentKey) { Dashboard -> 0; Tasks -> 1; Fitness -> 2; Learning -> 3; Finance -> 4; else -> 0 } }
    Surface(modifier = Modifier.fillMaxHeight().width(80.dp), color = Color(0xFF13112E), border = BorderStroke(1.dp, Color.White.copy(alpha = 0.05f))) {
        Column(modifier = Modifier.fillMaxSize().padding(vertical = 24.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(12.dp)) {
            IconButton(onClick = onOpenDrawer) { Icon(Icons.Default.Menu, null, tint = Color.White) }
            Spacer(Modifier.height(24.dp))
            navItems.forEachIndexed { index, (route, label, icon) ->
                val isSelected = selectedIndex == index
                val contentColor = if (isSelected) accentViolet else Color(0xFFA8A8B8)
                Column(modifier = Modifier.size(64.dp).clip(RoundedCornerShape(16.dp)).background(if (isSelected) accentViolet.copy(alpha = 0.1f) else Color.Transparent).clickable { onNavigate(route) }, horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
                    Icon(if (label == "Home" && isSelected) Icons.Default.Home else icon, label, tint = contentColor, modifier = Modifier.size(24.dp))
                    Text(label, color = contentColor, fontSize = 10.sp, fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium)
                }
            }
            Spacer(Modifier.weight(1f))
            IconButton(onClick = { onNavigate(Settings) }) { Icon(Icons.Default.Settings, null, tint = Color.White.copy(alpha = 0.5f)) }
        }
    }
}
