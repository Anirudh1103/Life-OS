import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { geminiService, type ChatMessage } from '../../services/gemini';
import { JarvisArcReactor } from './JarvisArcReactor';
import { JarvisChatModal } from './JarvisChatModal';
import { useWakeWord } from '../../hooks/useWakeWord';
import { useSpeechToText } from '../../hooks/useSpeechToText';
import { useJarvisVoice } from '../../hooks/useJarvisVoice';

export const JarvisContainer: React.FC = () => {
  const { user } = useAuth();
  
  // State variables
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [orbState, setOrbState] = useState<'idle' | 'listening' | 'thinking'>('idle');
  const [activeSpeakingIdx, setActiveSpeakingIdx] = useState<number | null>(null);
  
  // Persistent wake-word switch state
  const [isWakeWordActive, setIsWakeWordActive] = useState(() => {
    const saved = localStorage.getItem('life_os_jarvis_wakeword_active');
    return saved !== 'false'; // Default to active (true)
  });

  // Track if we are in active hands-free loop
  const [continuousSpeechMode, setContinuousSpeechMode] = useState(false);

  // Custom voice hook (must be initialized before handlers)
  const voice = useJarvisVoice();

  // Save history helper
  const saveChatHistory = (history: ChatMessage[]) => {
    setMessages(history);
    localStorage.setItem('life_os_jarvis_history', JSON.stringify(history));
  };

  // Main Send Message handler
  const handleSendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isLoading || !user) return;

    // Use a lock-like check to prevent double-firing from rapid STT events
    if (isLoading) return;
    setIsLoading(true);

    // Prime the browser's speechSynthesis engine under the user gesture context
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.speak(new SpeechSynthesisUtterance(''));
      } catch {}
    }

    voice.stop();
    setActiveSpeakingIdx(null);

    const userMsg: ChatMessage = {
      role: 'user',
      content: trimmed
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages); // Local state update first for UI responsiveness
    setInputMessage('');

    try {
      const reply = await geminiService.chatWithJarvis(user.id, trimmed, messages);
      const cleanReply = reply.replace(/\[COMMAND:.*?\]/g, '').trim();

      const modelReply: ChatMessage = {
        role: 'model',
        content: cleanReply
      };

      const newHistory = [...updatedMessages, modelReply];
      saveChatHistory(newHistory);

      // Auto-play TTS
      const newIndex = newHistory.length - 1;
      voice.speak(
        cleanReply,
        () => setActiveSpeakingIdx(newIndex),
        () => setActiveSpeakingIdx(null)
      );

    } catch (err) {
      console.error(err);
      const errorReply: ChatMessage = {
        role: 'model',
        content: "System Warning: Jarvis connection failed. Please verify that your Gemini API Key is configured correctly in the settings tab."
      };
      saveChatHistory([...updatedMessages, errorReply]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to detect specific voice barge-in interrupt phrases
  const isBargeInCommand = (text: string): boolean => {
    const clean = text.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim();
    const bargeInKeywords = ['stop', 'jarvis', 'cancel', 'wait', 'shut up', 'quiet'];
    return bargeInKeywords.some(keyword => clean.includes(keyword));
  };

  // Speech-to-Text hook
  const stt = useSpeechToText({
    bargeInOnly: voice.isPlaying && !voice.isPaused, // Only listen for keywords while Jarvis is actively speaking
    onTranscriptChange: (text) => {
      if (!voice.isPlaying || voice.isPaused) {
        // Normal mode: Stream text directly into input bar
        setInputMessage(text);
      } else {
        // Jarvis is speaking (Barge-in mode): check for stop command and filter all other output
        if (isBargeInCommand(text)) {
          console.log("[Jarvis Audio] Voice Barge-in detected during playback:", text);
          voice.stop();
          setInputMessage('');
          setIsMicActive(true);
          setContinuousSpeechMode(true);
        }
      }
    },
    onFinalResult: (text) => {
      if (!voice.isPlaying || voice.isPaused) {
        // Normal mode: Submit query to model
        setInputMessage(text);
        handleSendMessage(text);
      } else {
        // Jarvis is speaking: check final result segment for barge-in triggers
        if (isBargeInCommand(text)) {
          console.log("[Jarvis Audio] Final Voice Barge-in detected:", text);
          voice.stop();
          setInputMessage('');
          setIsMicActive(true);
          setContinuousSpeechMode(true);
        }
      }
    },
    onError: () => {
      setIsMicActive(false);
      setContinuousSpeechMode(false);
    }
  });

  // 1. Wake-Word hook trigger (Active only when mic is inactive, not loading, and speech is not actively playing)
  useWakeWord({
    isActive: isWakeWordActive && !isMicActive && !isLoading && (!isOpen || (isOpen && (!voice.isPlaying || voice.isPaused))),
    onWakeWordDetected: () => {
      // Force stop any lingering audio context before switching to microphone input
      voice.stop();
      setActiveSpeakingIdx(null);

      if (!isOpen) {
        setIsOpen(true);
      }
      // Wait for wake-word microphone channel release before starting STT
      setTimeout(() => {
        setIsMicActive(true);
        setContinuousSpeechMode(true);
      }, 350);
    }
  });

  // Load chat history on open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const historyStr = localStorage.getItem('life_os_jarvis_history');
      if (historyStr) {
        setMessages(JSON.parse(historyStr));
      } else {
        setMessages([
          { role: 'model', content: "Good day, Sir. I am Jarvis, your neural assistant. How can I optimize your workflow or routine today?\n\n[What's on my day?]\n[Check fitness streak]\n[Create a tasks list]" }
        ]);
      }
    }
  }, [isOpen]);

  // Sync mic state changes with STT listening with a safe de-conflict delay
  useEffect(() => {
    let timer: any;
    if (isMicActive) {
      // Allow background wake-word or other recognition tasks 200ms to stop and clear
      timer = setTimeout(() => {
        stt.startListening();
      }, 200);
    } else {
      stt.stopListening();
    }
    return () => clearTimeout(timer);
  }, [isMicActive]);

  // Sync mic state if STT recognition terminates naturally
  useEffect(() => {
    if (!stt.isListening && isMicActive) {
      setIsMicActive(false);
    }
  }, [stt.isListening]);

  // Dynamic Conversational Mic Loop:
  // Re-arm STT listening automatically while Jarvis is speaking or after he finishes (if continuous mode is active)
  useEffect(() => {
    let timer: any;
    if (continuousSpeechMode && isOpen && !isLoading && !isMicActive) {
      timer = setTimeout(() => {
        setIsMicActive(true);
      }, 300);
    }
    return () => clearTimeout(timer);
  }, [voice.isPlaying, continuousSpeechMode, isOpen, isLoading]);

  // Sync orb states
  useEffect(() => {
    if (isLoading) {
      setOrbState('thinking');
    } else if (isMicActive || voice.isPlaying) {
      setOrbState('listening');
    } else {
      setOrbState('idle');
    }
  }, [isLoading, isMicActive, voice.isPlaying]);

  // Listen for native Android wake-word detected events (hybrid JS bridge)
  useEffect(() => {
    const handleAndroidWake = () => {
      console.log("[Jarvis Web] Wake word detected by Android native background service.");
      voice.stop();
      setIsOpen(true);
      setTimeout(() => {
        setIsMicActive(true);
        setContinuousSpeechMode(true);
      }, 350);
    };
    window.addEventListener('jarvis_wake_word_detected', handleAndroidWake);
    return () => window.removeEventListener('jarvis_wake_word_detected', handleAndroidWake);
  }, [voice]);

  // Save wake-word preference
  useEffect(() => {
    localStorage.setItem('life_os_jarvis_wakeword_active', String(isWakeWordActive));
  }, [isWakeWordActive]);

  // Clean speech on close
  useEffect(() => {
    if (!isOpen) {
      voice.stop();
      stt.stopListening();
      setIsMicActive(false);
      setContinuousSpeechMode(false);
      setActiveSpeakingIdx(null);
    }
  }, [isOpen]);

  if (!user) return null;

  return (
    <>
      {/* Floaty Stark Arc Reactor Trigger - Positioned at bottom right */}
      {!isOpen && (
        <JarvisArcReactor
          state={orbState}
          size={64}
          onClick={async () => {
            // Explicitly request mic access under user gesture context to whitelist SpeechRecognition
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
              try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                stream.getTracks().forEach(track => track.stop()); // Release device immediately
              } catch (e) {
                console.warn("Microphone permissions denied:", e);
              }
            }
            setIsOpen(true);
          }}
          className="fixed !top-auto bottom-8 right-8 z-50 hover:scale-110 active:scale-95 transition-all shadow-[0_0_30px_rgba(56,189,248,0.2)]"
        />
      )}

      {/* Holographic Chat Drawer Modal wrapped in AnimatePresence for smooth exits */}
      <AnimatePresence>
        {isOpen && (
          <JarvisChatModal 
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            messages={messages}
            setMessages={saveChatHistory}
            inputMessage={inputMessage}
            setInputMessage={setInputMessage}
            isLoading={isLoading}
            isMicActive={isMicActive}
            setIsMicActive={(active) => {
              setIsMicActive(active);
              setContinuousSpeechMode(active); // Sync continuous state with manual mic clicks
            }}
            isMaximized={isMaximized}
            setIsMaximized={setIsMaximized}
            orbState={orbState}
            activeSpeakingIdx={activeSpeakingIdx}
            setActiveSpeakingIdx={setActiveSpeakingIdx}
            isWakeWordActive={isWakeWordActive}
            setIsWakeWordActive={setIsWakeWordActive}
            voice={voice}
            onSendMessage={handleSendMessage}
          />
        )}
      </AnimatePresence>
    </>
  );
};
export default JarvisContainer;
