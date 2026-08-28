# JARVIS Android Setup Guide

## Overview
JARVIS is your AI-powered voice assistant on Android. This guide will help you set up both the wake word detection and chat features.

## Prerequisites

### 1. API Keys Setup (Required for Chat)
JARVIS chat requires at least ONE AI provider API key. Copy `local.properties.example` to `local.properties` and add your keys:

```properties
# At least one of these is required:
GEMINI_API_KEY=your-key-here          # Get from: https://makersuite.google.com/app/apikey
GROQ_API_KEY=your-key-here            # Get from: https://console.groq.com/keys
OPENROUTER_API_KEY=your-key-here      # Get from: https://openrouter.ai/keys

# Required for data sync:
SUPABASE_URL=your-project-url
SUPABASE_KEY=your-anon-key

# Optional for premium voice:
ELEVENLABS_API_KEY=your-key-here      # Get from: https://elevenlabs.io/app/settings/api-keys
```

**Note:** The wake word detection works completely offline and doesn't need any API keys!

### 2. Android Permissions
JARVIS needs these permissions:
- **Microphone** (RECORD_AUDIO) - For wake word detection and voice commands
- **Notifications** (POST_NOTIFICATIONS, Android 13+) - For foreground service notification
- **Overlay** (SYSTEM_ALERT_WINDOW) - For voice response pill overlay

## Setup Steps

### Step 1: Enable Wake Word Detection

1. Open the app and go to **Settings** (from the drawer menu or profile icon)
2. Scroll to the **Intelligence** section
3. Toggle **"Wake Word Recognition"** to ON
4. The app will request microphone permission if not already granted
5. Grant the permission when prompted

You should see a persistent notification saying "JARVIS Voice Assistant - Listening for Hey Jarvis..."

### Step 2: Voice Profile Setup (Optional but Recommended)

Speaker verification ensures only YOUR voice can activate JARVIS after the wake word is detected.

1. In Settings → Intelligence section, tap **"Set up voice"**
2. Follow the enrollment flow (you'll say "Hey Jarvis" 3-5 times)
3. Toggle **"Voice verification"** to ON

### Step 3: Enable Overlay Permission (Optional)

For the floating voice response pill:

1. Go to Settings → Intelligence
2. Tap **"OVERLAY"** button (in the JARVIS Terminal panel, if using diagnostic mode)
3. Or go to Android Settings → Apps → LifeOS → Display over other apps → Allow

### Step 4: Disable Battery Optimization (Recommended)

To prevent Android from killing the wake word service:

1. Go to Android Settings → Battery → Battery optimization
2. Find "LifeOS" and set to "Don't optimize"
3. Or tap "BATTERY OPT." button in the JARVIS Terminal diagnostic panel

## Usage

### Wake Word Detection
1. Once enabled, say **"Hey Jarvis"** anytime (even when screen is off)
2. If speaker verification is enabled, it will verify it's your voice
3. JARVIS will respond with "Yes, Sir?" and listen for your command
4. Speak your query within 8 seconds
5. JARVIS will process and respond

### Chat Interface
1. Tap the floating Arc Reactor orb (bottom right) OR
2. Tap the "JARVIS AI" card in the drawer menu
3. Type or use voice commands
4. JARVIS will respond using your configured AI providers

## Troubleshooting

### Wake Word Not Working

**Check these in order:**

1. **Is the service running?**
   - Look for "JARVIS Voice Assistant" in your notifications
   - If not, go to Settings and toggle "Wake Word Recognition" ON

2. **Microphone permission granted?**
   - Android Settings → Apps → LifeOS → Permissions → Microphone → Allow

3. **Battery optimization disabled?**
   - Some Android manufacturers (Samsung, Xiaomi, Oppo) aggressively kill background services
   - Add LifeOS to battery optimization whitelist

4. **Are you saying the exact phrase?**
   - Say **"Hey Jarvis"** (not just "Jarvis")
   - Speak clearly and at normal volume
   - Wait 2-3 seconds between attempts (there's a cooldown)

5. **Check diagnostic panel:**
   - Tap the purple gear icon (bottom left on Dashboard)
   - Status should show "ACTIVE" (green) when listening
   - "Hits" counter increments when wake word is detected

### Chat Not Working

**Check these in order:**

1. **Are API keys configured?**
   - Go to Settings → AI Providers section
   - At least one provider should show a green dot
   - If all are red, add keys to `android/local.properties`

2. **Are you logged in?**
   - JARVIS chat requires Supabase authentication
   - Log in from the login screen

3. **Network connection?**
   - Chat requires internet (wake word detection doesn't)
   - Check your WiFi/mobile data

4. **Check error messages:**
   - If you see "cognitive processors are offline" → API key issue
   - If you see "must be logged in" → authentication issue
   - If you see "cognitive interference" → all providers failed (check keys/network)

### Speaker Verification Not Working

1. **Re-enroll your voice:**
   - Settings → Intelligence → "Re-enroll"
   - Do this in a quiet environment

2. **Disable verification temporarily:**
   - Toggle "Voice verification" OFF
   - Wake word will still work, just without speaker ID

3. **Check speaker score:**
   - Open JARVIS Terminal (purple gear icon)
   - Look for "speaker=X.XX" in the DEV line
   - Score above 0.50 is considered a match

## Advanced

### JARVIS Terminal (Diagnostic Panel)

Tap the purple gear icon (bottom left) to access:
- Real-time service status
- Wake word detection logs
- Audio pipeline status
- Speaker verification scores
- Start/Stop controls
- Test buttons (Alarm, Battery Optimization)

### Wake Word Configuration

The wake word engine uses **Sherpa-ONNX** with a neural keyword spotter:
- **Model**: GigaSpeech 3.3M Zipformer
- **Phrase**: "Hey Jarvis" (▁HE Y ▁JA R V IS in BPE tokens)
- **Detection threshold**: 0.50 (higher = fewer false positives)
- **Cooldown**: 2.5 seconds between detections
- **Sample rate**: 16kHz
- **Completely offline** - no network required

### AI Provider Fallback Chain

JARVIS tries providers in this order:
1. **Gemini** (gemini-1.5-flash) - Fast, efficient
2. **Groq** - Fallback if Gemini fails
3. **OpenRouter** - Final fallback

If all fail, you'll see an error message.

## FAQ

**Q: Does wake word work when the screen is off?**
A: Yes! The foreground service keeps listening even with screen off. However, aggressive battery optimization may stop it.

**Q: Can I change the wake word phrase?**
A: Currently no. "Hey Jarvis" is hardcoded in the neural model. Changing it requires retraining the model.

**Q: How much battery does wake word detection use?**
A: Approximately 2-5% per hour, depending on your device. The neural model is optimized for mobile.

**Q: Is my voice data sent to any servers?**
A: NO. Wake word detection is 100% offline. Voice data only leaves your device during chat queries to AI providers.

**Q: Can I use JARVIS without any API keys?**
A: The wake word detection works offline without keys, but chat requires at least one AI provider key.

**Q: Why does JARVIS need ElevenLabs?**
A: ElevenLabs provides premium voice synthesis. If the key is missing or invalid, JARVIS falls back to Android's built-in TTS.

## Support

If issues persist:
1. Check Android logs: `adb logcat | grep JARVIS`
2. Look for errors in the diagnostic panel
3. Restart the app completely
4. Toggle wake word OFF then ON again
5. Re-grant microphone permission (Settings → Apps → LifeOS → Permissions)

## Architecture

- **Wake Word Engine**: Sherpa-ONNX (on-device neural KWS)
- **Speaker Verification**: WeSpeaker CAM++ (on-device speaker embeddings)
- **Speech Recognition**: Android SpeechRecognizer API
- **AI Brain**: Multi-provider fallback (Gemini → Groq → OpenRouter)
- **Text-to-Speech**: ElevenLabs API or Android TTS
- **Service**: Foreground service with FOREGROUND_SERVICE_TYPE_MICROPHONE

---

**Pro Tip**: Open the JARVIS Terminal diagnostic panel (purple gear) while testing. It shows real-time status and helps debug issues instantly!
