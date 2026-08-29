import React, { useRef, useEffect } from 'react';
import { type ChatMessage } from '../../services/gemini';
import { JarvisArcReactor } from './JarvisArcReactor';
import { JarvisMessageItem } from './JarvisMessageItem';
import { 
  X, Send, Paperclip, Mic, MicOff,
  Maximize2, Minimize2, Trash2, Power
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface JarvisChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  setMessages: (history: ChatMessage[]) => void;
  inputMessage: string;
  setInputMessage: (text: string) => void;
  isLoading: boolean;
  isMicActive: boolean;
  setIsMicActive: (active: boolean) => void;
  isMaximized: boolean;
  setIsMaximized: (maximized: boolean) => void;
  orbState: 'idle' | 'listening' | 'thinking';
  activeSpeakingIdx: number | null;
  setActiveSpeakingIdx: (idx: number | null) => void;
  isWakeWordActive: boolean;
  setIsWakeWordActive: (active: boolean) => void;
  voice: any;
  onSendMessage: (text: string) => void;
}

export const JarvisChatModal: React.FC<JarvisChatModalProps> = ({
  isOpen,
  onClose,
  messages,
  inputMessage,
  setInputMessage,
  isLoading,
  isMicActive,
  setIsMicActive,
  isMaximized,
  setIsMaximized,
  orbState,
  activeSpeakingIdx,
  setActiveSpeakingIdx,
  isWakeWordActive,
  setIsWakeWordActive,
  voice,
  onSendMessage,
  setMessages
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;
    onSendMessage(inputMessage);
  };

  const handleClearHistory = () => {
    if (window.confirm("Wipe Jarvis memory core? All logs will be deleted.")) {
      voice.stop();
      localStorage.removeItem('life_os_jarvis_history');
      setMessages([
        { role: 'model', content: "Memory buffer wiped, Sir & Boss. Re-initializing core systems.\n\n[What's on my day?]\n[Check fitness status]" }
      ]);
      setActiveSpeakingIdx(null);
    }
  };

  const handleVoiceToggle = (msgText: string, index: number) => {
    if (activeSpeakingIdx === index) {
      if (voice.isPaused) {
        voice.resume();
      } else if (voice.isPlaying) {
        voice.pause();
      } else {
        voice.speak(
          msgText,
          () => setActiveSpeakingIdx(index),
          () => setActiveSpeakingIdx(null)
        );
      }
    } else {
      voice.speak(
        msgText,
        () => setActiveSpeakingIdx(index),
        () => setActiveSpeakingIdx(null)
      );
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-end p-4 md:p-8 bg-[#05070a]/60 backdrop-blur-md select-none"
        >
          {/* Backdrop Blur Area */}
          <div className="absolute inset-0" onClick={onClose} />

          {/* MAIN MODAL CONSOLE */}
          <motion.div
            initial={{ opacity: 0, x: 100, scale: 0.95, filter: 'blur(10px)' }}
            animate={{
              opacity: 1,
              x: 0,
              scale: 1,
              filter: 'blur(0px)',
              width: isMaximized ? 'calc(100vw - 32px)' : '460px',
              height: isMaximized ? 'calc(100vh - 32px)' : '85vh'
            }}
            exit={{ opacity: 0, x: 100, scale: 0.95, filter: 'blur(10px)' }}
            transition={{ type: 'spring', damping: 28, stiffness: 200 }}
            className="relative bg-[#080b11]/95 border border-cyan-500/20 shadow-[0_0_80px_rgba(0,0,0,0.8),0_0_20px_rgba(56,189,248,0.1)] rounded-[3rem] flex flex-col z-10 overflow-hidden"
          >
            {/* Ambient Radial Glow Background */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

            {/* HEADER OVERHAUL */}
            <header className="relative p-7 flex items-center justify-between bg-white/[0.02] border-b border-white/[0.05] z-10">
              <div className="flex items-center gap-5">
                {/* Arc Reactor Hologram */}
                <JarvisArcReactor
                  state={orbState}
                  size={52}
                  onClick={() => setIsMicActive(!isMicActive)}
                />

                <div className="space-y-1">
                  <h3 className="text-base font-black text-white tracking-[0.1em] uppercase flex items-center gap-2.5">
                    Jarvis
                    <motion.span
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"
                    />
                  </h3>
                  <p className="text-[9px] font-black text-cyan-400/80 uppercase tracking-[0.25em]">
                    Neural Engine Active
                  </p>
                </div>
              </div>

              {/* Header Actions */}
              <div className="flex items-center gap-4">
                {/* Wake Word Switch */}
                <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-white/[0.03] border border-white/[0.08] rounded-full">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Wake Word</span>
                  <button
                    onClick={() => setIsWakeWordActive(!isWakeWordActive)}
                    className={`relative w-9 h-5 rounded-full transition-all duration-300 ${
                      isWakeWordActive ? 'bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.4)]' : 'bg-slate-800'
                    }`}
                  >
                    <motion.div
                      animate={{ x: isWakeWordActive ? 18 : 2 }}
                      className="absolute top-1 left-0 w-3 h-3 rounded-full bg-white shadow-sm"
                    />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={handleClearHistory} className="p-2.5 hover:bg-white/5 rounded-2xl text-slate-400 hover:text-white transition-all">
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                  <button onClick={() => setIsMaximized(!isMaximized)} className="p-2.5 hover:bg-white/5 rounded-2xl text-slate-400 hover:text-white transition-all">
                    {isMaximized ? <Minimize2 className="h-4.5 w-4.5" /> : <Maximize2 className="h-4.5 w-4.5" />}
                  </button>
                  <button onClick={onClose} className="p-2.5 hover:bg-white/5 rounded-2xl text-slate-400 hover:text-rose-400 transition-all">
                    <X className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>
            </header>

            {/* MESSAGE LIST - Overhauled scannable layout */}
            <div className="flex-1 overflow-y-auto px-8 py-8 space-y-2 scrollbar-hide z-10">
              {messages.map((msg, idx) => (
                <JarvisMessageItem
                  key={idx}
                  msg={msg}
                  isSpeaking={activeSpeakingIdx === idx}
                  isPlaying={activeSpeakingIdx === idx && voice.isPlaying}
                  isPaused={activeSpeakingIdx === idx && voice.isPaused}
                  onPlayToggle={() => handleVoiceToggle(msg.content, idx)}
                  onSendMessage={onSendMessage}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* LOADING STATE - Pulsing holographic line */}
            {isLoading && (
              <div className="px-10 py-4 flex items-center gap-4 bg-white/[0.01] border-t border-white/[0.03]">
                <div className="flex gap-1">
                  {[0, 0.2, 0.4].map(delay => (
                    <motion.div
                      key={delay}
                      animate={{ scaleY: [1, 2.5, 1], opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay }}
                      className="w-0.5 h-3 bg-cyan-400 rounded-full"
                    />
                  ))}
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400/50 animate-pulse">
                  Analyzing Data Streams...
                </span>
              </div>
            )}

            {/* INPUT BAR REDESIGN */}
            <div className="p-8 bg-white/[0.02] border-t border-white/[0.05] z-10">
              <form
                onSubmit={handleFormSubmit}
                className="relative flex items-center bg-[#05070a]/80 border border-white/[0.1] focus-within:border-cyan-500/40 rounded-3xl px-6 py-4 transition-all shadow-2xl backdrop-blur-lg group"
              >
                {/* Voice Input Button */}
                <button
                  type="button"
                  onClick={() => setIsMicActive(!isMicActive)}
                  className={`p-2.5 rounded-2xl transition-all mr-3 ${
                    isMicActive
                      ? 'bg-rose-500/20 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.3)] animate-pulse'
                      : 'text-slate-500 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {isMicActive ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </button>

                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={isMicActive ? "System listening..." : "Ask Jarvis anything or speak..."}
                  className="flex-1 bg-transparent text-sm font-bold text-slate-100 placeholder:text-slate-600 outline-none"
                  disabled={isLoading}
                />

                <div className="flex items-center gap-2 ml-4">
                  <button type="button" className="p-2.5 text-slate-600 hover:text-white transition-colors">
                    <Paperclip className="h-5 w-5" />
                  </button>
                  <button
                    type="submit"
                    disabled={!inputMessage.trim() || isLoading}
                    className={`p-2.5 rounded-2xl transition-all ${
                      inputMessage.trim() && !isLoading
                        ? 'bg-cyan-500 text-[#05070a] shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:scale-105 active:scale-95'
                        : 'text-slate-700 bg-white/5 cursor-not-allowed'
                    }`}
                  >
                    <Send className="h-5 w-5 fill-current" />
                  </button>
                </div>
              </form>

              {/* Bottom Metadata */}
              <div className="mt-4 flex items-center justify-between px-2">
                <div className="flex items-center gap-4">
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">Contextual Intelligence Active</p>
                  <div className="h-px w-24 bg-white/[0.05]" />
                </div>
                <button className="flex items-center gap-1.5 text-slate-700 hover:text-cyan-400/60 transition-colors">
                  <Power className="h-3 w-3" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-inherit">Reset Core</span>
                </button>
              </div>
            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
