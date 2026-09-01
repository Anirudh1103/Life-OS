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
import com.example.lifeos.ui.jarvis.LifeOSSplash
import com.example.lifeos.ui.jarvis.AboutLifeOSScreen
import com.example.lifeos.ui.jarvis.WakeWordSetupScreen
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
import com.example.lifeos.ui.jarvis.JarvisSidePanel
import com.example.lifeos.ui.calendar.CalendarScreen
import com.example.lifeos.ui.focus.FocusScreen
import com.example.lifeos.ui.journal.JournalScreen
import com.example.lifeos.ui.resources.ResourcesScreen
import androidx.compose.ui.res.painterResource
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
    var authenticationAnimationActive by remember { mutableStateOf(false) }
    var isWakeWordSetupDone by remember { mutableStateOf(JarvisPrefs.isSetupCompleted(context)) }
    
    // Manage onboarding screen state locally
    val introSeen = remember { JarvisPrefs.hasSeenIntro(context) }
    var onboardingScreen by remember { mutableStateOf(if (introSeen) "LOGIN_SCREEN" else "ABOUT_SCREEN") }

    // Fix kotlin pattern matching
    LaunchedEffect(introSeen) {
        if (introSeen) {
            onboardingScreen = "LOGIN_SCREEN"
        }
    }

    LaunchedEffect(Unit) {
        kotlinx.coroutines.delay(3000)
        launchReady = true
    }

    LaunchedEffect(authState, isWakeWordSetupDone) {
        val state = authState
        if (state is AuthState.Authenticated) {
            // Migrate temporary voice profile to user-specific profile upon successful login
            com.example.lifeos.jarvis.speaker.SpeakerProfileStore(context).migrateTemporaryProfile(state.userId)
            
            // Check for required permissions before starting service
            val hasRecordAudio = ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED
            
            // Automatically start the service if wake word listening is enabled and microphone permission is granted
            val shouldStart = JarvisPrefs.isListenEnabled(context) && hasRecordAudio
            if (shouldStart) {
                val startIntent = Intent(context, JarvisWakeWordService::class.java).apply {
                    action = JarvisWakeWordService.ACTION_START
                }
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(startIntent)
                } else {
                    context.startService(startIntent)
                }
            }
        } else if (!isWakeWordSetupDone) {
            // Stop JarvisWakeWordService when not authenticated, BUT only if wake word setup isn't done.
            val stopIntent = Intent(context, JarvisWakeWordService::class.java).apply {
                action = JarvisWakeWordService.ACTION_STOP
            }
            context.stopService(stopIntent)
        }
    }

    if (!launchReady || authState is AuthState.Initializing) {
        LifeOSSplash()
    } else if (authState is AuthState.Authenticated && !authenticationAnimationActive) {
        if (!isWakeWordSetupDone) {
            VoiceEnrollmentScreen(onFinish = {
                isWakeWordSetupDone = true
            })
        } else {
            AppDrawerContent(authViewModel, windowSize)
        }
    } else {
        // User is not authenticated or login animation is active
        when (onboardingScreen) {
            "ABOUT_SCREEN" -> {
                AboutLifeOSScreen(onContinue = {
                    onboardingScreen = "LOGIN_SCREEN"
                })
            }
            else -> {
                LoginScreen(
                    viewModel = authViewModel,
                    onAuthenticationStarted = { authenticationAnimationActive = true },
                    onAuthenticationAnimated = { authenticationAnimationActive = false }
                )
            }
        }
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
    LaunchedEffect(Unit) {
        JarvisNavigationManager.openChatEvents.collect {
            showJarvisChat = true
        }
    }

    // Restore listening only if the user previously enabled it.
    LaunchedEffect(Unit) {
        val permission = Manifest.permission.RECORD_AUDIO
        val granted = ContextCompat.checkSelfPermission(context, permission) == PackageManager.PERMISSION_GRANTED
        
        // If microphone permission is granted and Jarvis listening is enabled in settings, start the service
        val shouldStart = granted && JarvisPrefs.isListenEnabled(context)
        
        if (shouldStart) {
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

    val darkBackground = MaterialTheme.colorScheme.background
    val drawerBackground = MaterialTheme.colorScheme.surface
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
                            Text("LifeOS", color = MaterialTheme.colorScheme.onBackground, fontSize = 24.sp, fontWeight = FontWeight.Black)
                            Text("SYSTEM CORE v1.0", color = Color(0xFF2DE1FC), fontSize = 8.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                        }
                        IconButton(
                            onClick = { scope.launch { drawerState.close() } },
                            modifier = Modifier.size(32.dp)
                        ) {
                            Icon(Icons.Default.Close, contentDescription = "Close", tint = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.5f))
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
                    DrawerItem("Clock", Icons.Default.Schedule, currentKey == Alarms) {
                        backStack.add(Alarms)
                        scope.launch { drawerState.close() }
                    }

                    Spacer(modifier = Modifier.height(16.dp))
                    Box(modifier = Modifier.fillMaxWidth().height(1.dp).background(MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f)))
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
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.4f)),
                        shape = RoundedCornerShape(16.dp),
                        border = BorderStroke(1.dp, accentViolet.copy(alpha = 0.2f)),
                        modifier = Modifier.fillMaxWidth().clickable {
                            showJarvisChat = true
                            scope.launch { drawerState.close() }
                        }
                    ) {
                        Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text("JARVIS AI", color = MaterialTheme.colorScheme.onPrimaryContainer, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                Spacer(modifier = Modifier.height(2.dp))
                                Text("Your intelligent assistant.", color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.5f), fontSize = 9.sp)
                            }
                            Box(modifier = Modifier.size(24.dp).background(accentViolet.copy(alpha = 0.15f), CircleShape), contentAlignment = Alignment.Center) {
                                Icon(Icons.Default.AutoAwesome, null, tint = accentViolet, modifier = Modifier.size(12.dp))
                            }
                        }
                    }
                }
            }
        }
    ) {
        Row(modifier = Modifier.fillMaxSize()) {
            if (!isCompact) {
                LifeOsNavigationSidebar(
                    currentKey = currentKey,
                    onNavigate = { backStack.add(it) },
                    accentCyan = accentCyan,
                    accentViolet = accentViolet,
                    authViewModel = authViewModel
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
                                        Icon(Icons.Default.Menu, null, tint = MaterialTheme.colorScheme.onBackground)
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
                        Box(
                            modifier = Modifier
                                .widthIn(max = if (isCompact) 1200.dp else 1650.dp)
                                .fillMaxSize()
                        ) {
                            NavDisplay(
                                backStack = backStack,
                                onBack = { backStack.removeLastOrNull() },
                                entryProvider = entryProvider {
                                    entry<Dashboard> { DashboardScreen(onNavigate = { backStack.add(it) }, windowSize = windowSize) }
                                    entry<Tasks> { TasksScreen() }
                                    entry<Fitness> { FitnessScreen() }
                                    entry<Learning> { LearningScreen() }
                                    entry<Finance> { FinanceScreen() }
                                    entry<Alarms> { AlarmScreen(onBack = { backStack.removeLastOrNull() }) }
                                    entry<Profile> { ProfileScreen(onToggleDiagnostics = { }) }
                                    entry<Settings> { SettingsScreen(onEnrollVoice = { backStack.add(VoiceEnrollment) }) }
                                    entry<VoiceEnrollment> { VoiceEnrollmentScreen({ backStack.removeLastOrNull() }) }
                                    entry<Calendar> { CalendarScreen() }
                                    entry<Focus> { FocusScreen() }
                                    entry<Journal> { JournalScreen() }
                                    entry<Resources> { ResourcesScreen() }
                                },
                                modifier = Modifier.fillMaxSize().background(MaterialTheme.colorScheme.background)
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

                if (showJarvisChat && isCompact) {
                    JarvisChatConsole(onClose = { showJarvisChat = false })
                }
            }

            if (showJarvisChat && !isCompact) {
                JarvisSidePanel(onClose = { showJarvisChat = false })
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
        Box(modifier = Modifier.size(32.dp).clip(CircleShape).background(MaterialTheme.colorScheme.surface).border(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.2f), CircleShape), contentAlignment = Alignment.Center) {
            Icon(Icons.Default.Person, null, tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f), modifier = Modifier.size(16.dp))
        }
        Box(modifier = Modifier.size(10.dp).align(Alignment.BottomEnd).background(Color(0xFF00FFC6), CircleShape).border(2.dp, MaterialTheme.colorScheme.background, CircleShape))
    }
}

@Composable
fun DrawerItem(label: String, icon: androidx.compose.ui.graphics.vector.ImageVector, selected: Boolean, hasAndroidTag: Boolean = false, isRed: Boolean = false, onClick: () -> Unit) {
    val tint = if (isRed) Color(0xFFFF4E70) else if (selected) Color(0xFF2DE1FC) else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
    Surface(onClick = onClick, color = if (selected) MaterialTheme.colorScheme.primary.copy(alpha = 0.1f) else Color.Transparent, shape = RoundedCornerShape(12.dp), modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
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
        BoxWithConstraints(modifier = Modifier.fillMaxWidth().height(72.dp).clip(RoundedCornerShape(24.dp)).background(MaterialTheme.colorScheme.surface.copy(alpha = 0.92f)).border(BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.1f)), RoundedCornerShape(24.dp)).shadow(12.dp, RoundedCornerShape(24.dp))) {
            val tabWidth = maxWidth / 5
            val animatedOffset by animateDpAsState(targetValue = tabWidth * selectedIndex, animationSpec = spring(dampingRatio = Spring.DampingRatioLowBouncy, stiffness = Spring.StiffnessMediumLow), label = "nav_selected_offset")
            Box(modifier = Modifier.offset(x = animatedOffset).width(tabWidth).fillMaxHeight().padding(horizontal = 8.dp, vertical = 6.dp).clip(RoundedCornerShape(18.dp)).background(Brush.radialGradient(colors = listOf(accentViolet.copy(alpha = 0.22f), accentViolet.copy(alpha = 0.04f)))).border(1.dp, accentViolet.copy(alpha = 0.12f), RoundedCornerShape(18.dp)))
            Row(modifier = Modifier.fillMaxSize(), verticalAlignment = Alignment.CenterVertically) {
                navItems.forEachIndexed { index, (route, label, icon) ->
                    val isSelected = selectedIndex == index
                    val contentColor by animateColorAsState(targetValue = if (isSelected) accentViolet else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f), label = "nav_content_color")
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
    Surface(modifier = Modifier.fillMaxHeight().width(80.dp), color = MaterialTheme.colorScheme.surface, border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.1f))) {
        Column(modifier = Modifier.fillMaxSize().padding(vertical = 24.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(12.dp)) {
            IconButton(onClick = onOpenDrawer) { Icon(Icons.Default.Menu, null, tint = MaterialTheme.colorScheme.onSurface) }
            Spacer(Modifier.height(24.dp))
            navItems.forEachIndexed { index, (route, label, icon) ->
                val isSelected = selectedIndex == index
                val contentColor = if (isSelected) accentViolet else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                Column(modifier = Modifier.size(64.dp).clip(RoundedCornerShape(16.dp)).background(if (isSelected) accentViolet.copy(alpha = 0.1f) else Color.Transparent).clickable { onNavigate(route) }, horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
                    Icon(if (label == "Home" && isSelected) Icons.Default.Home else icon, label, tint = contentColor, modifier = Modifier.size(24.dp))
                    Text(label, color = contentColor, fontSize = 10.sp, fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium)
                }
            }
            Spacer(Modifier.weight(1f))
            IconButton(onClick = { onNavigate(Settings) }) { Icon(Icons.Default.Settings, null, tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)) }
        }
    }
}

@Composable
fun LifeOsNavigationSidebar(
    currentKey: NavKey?,
    onNavigate: (NavKey) -> Unit,
    accentCyan: Color,
    accentViolet: Color,
    authViewModel: AuthViewModel
) {
    val context = LocalContext.current
    val sidebarItems = remember {
        listOf(
            Triple(Dashboard, "Dashboard", R.drawable.ic_dashboard),
            Triple(Tasks, "Tasks", R.drawable.ic_tasks),
            Triple(Calendar, "Calendar", R.drawable.ic_calendar),
            Triple(Fitness, "Fitness", R.drawable.ic_fitness),
            Triple(Learning, "Learning", R.drawable.ic_learning),
            Triple(Finance, "Finance", R.drawable.ic_finance),
            Triple(Focus, "Focus", R.drawable.ic_focus),
            Triple(Journal, "Journal", R.drawable.ic_journal),
            Triple(Resources, "Resources", R.drawable.ic_resources),
            Triple(Alarms, "Clock", R.drawable.ic_clock),
            Triple(Settings, "Settings", R.drawable.ic_settings)
        )
    }

    Surface(
        modifier = Modifier
            .fillMaxHeight()
            .width(260.dp),
        color = MaterialTheme.colorScheme.surface,
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.1f))
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(vertical = 24.dp, horizontal = 16.dp),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Column {
                // Top Logo Section
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier
                        .padding(horizontal = 8.dp)
                        .padding(bottom = 24.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .background(
                                Brush.linearGradient(listOf(accentCyan, accentViolet)),
                                RoundedCornerShape(12.dp)
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            painter = painterResource(id = R.drawable.ic_lifeos_logo_new),
                            contentDescription = "Logo",
                            tint = Color.Unspecified,
                            modifier = Modifier.size(22.dp)
                        )
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text(
                            "LifeOS",
                            color = MaterialTheme.colorScheme.onBackground,
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Black
                        )
                        Text(
                            "SYSTEM CORE v1.0",
                            color = accentCyan,
                            fontSize = 7.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 1.sp
                        )
                    }
                }

                // Nav Items
                sidebarItems.forEach { (route, label, iconRes) ->
                    val isSelected = currentKey == route
                    val contentColor = if (isSelected) accentCyan else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                    val bg = if (isSelected) accentCyan.copy(alpha = 0.1f) else Color.Transparent
                    
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 2.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .background(bg)
                            .clickable { onNavigate(route) }
                            .padding(horizontal = 16.dp, vertical = 10.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            painter = painterResource(id = iconRes),
                            contentDescription = label,
                            tint = contentColor,
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(modifier = Modifier.width(16.dp))
                        Text(
                            text = label,
                            color = contentColor,
                            fontSize = 14.sp,
                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium
                        )
                    }
                }
            }

            // Bottom Profile Section
            Column {
                // Horizontal divider
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(1.dp)
                        .background(MaterialTheme.colorScheme.outline.copy(alpha = 0.1f))
                )
                
                Spacer(modifier = Modifier.height(12.dp))

                // Profile card capsule
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(16.dp))
                        .background(MaterialTheme.colorScheme.onSurface.copy(alpha = 0.02f))
                        .border(BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.1f)), RoundedCornerShape(16.dp))
                        .padding(12.dp)
                ) {
                    // Profile image
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .clip(CircleShape)
                            .background(MaterialTheme.colorScheme.surfaceVariant)
                            .border(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.2f), CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Person,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                            modifier = Modifier.size(18.dp)
                        )
                    }

                    Spacer(modifier = Modifier.width(12.dp))

                    Column(modifier = Modifier.weight(1f)) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(
                                text = "Anirudh CM",
                                color = MaterialTheme.colorScheme.onSurface,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                        Text(
                            text = "LifeOS Personal",
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f),
                            fontSize = 9.sp,
                            fontWeight = FontWeight.Medium
                        )
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                // Action buttons row
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceEvenly,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(onClick = { 
                        val newTheme = !VoiceQueryManager.isDarkTheme.value
                        VoiceQueryManager.isDarkTheme.value = newTheme
                        com.example.lifeos.jarvis.prefs.JarvisPrefs.setDarkTheme(context, newTheme)
                    }) {
                        Icon(
                            painter = painterResource(id = R.drawable.ic_moon),
                            contentDescription = "Toggle Theme",
                            tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f),
                            modifier = Modifier.size(18.dp)
                        )
                    }
                    IconButton(onClick = { }) {
                        Icon(
                            painter = painterResource(id = R.drawable.ic_bell),
                            contentDescription = "Notifications",
                            tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f),
                            modifier = Modifier.size(18.dp)
                        )
                    }
                    IconButton(onClick = { authViewModel.signOut() }) {
                        Icon(
                            painter = painterResource(id = R.drawable.ic_external),
                            contentDescription = "Logout",
                            tint = Color(0xFFFF4E70),
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }
            }
        }
    }
}
