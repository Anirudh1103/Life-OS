import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Copy, Check, Clock } from 'lucide-react';
import { JarvisResponseCard } from './JarvisResponseCard';

interface JarvisMessageItemProps {
  msg: { role: 'user' | 'model'; content: string };
  isSpeaking: boolean;
  isPlaying: boolean;
  isPaused: boolean;
  onPlayToggle: () => void;
  onSendMessage: (text: string) => void;
}

export const JarvisMessageItem: React.FC<JarvisMessageItemProps> = ({
  msg,
  isSpeaking,
  isPlaying,
  isPaused,
  onPlayToggle,
  onSendMessage
}) => {
  const isUser = msg.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    // Remove markdown-like tags for plain text copy
    const cleanText = msg.content
      .replace(/\[COMMAND:.*?\]/g, '')
      .replace(/\[(.*?)\]/g, '$1')
      .replace(/-\s*\[\s*[x ]\s*\]\s*/g, '')
      .trim();

    navigator.clipboard.writeText(cleanText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const timestamp = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} w-full mb-6 last:mb-0`}
    >
      <div className={`flex flex-col gap-2 max-w-[88%] ${isUser ? 'items-end' : 'items-start'}`}>

        {isUser ? (
          /* User Prompt Bubble Capsule */
          <div className="px-5 py-3 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 text-white shadow-lg shadow-indigo-500/5">
            <p className="text-sm font-medium leading-relaxed tracking-wide select-text">
              {msg.content}
            </p>
          </div>
        ) : (
          /* Jarvis Response Card */
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 shadow-2xl backdrop-blur-sm w-full relative overflow-hidden group">
            {/* Subtle Cyan Gradient accent */}
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#38bdf8] to-indigo-500 opacity-50" />

            <div className="text-slate-100 scannable-content leading-relaxed">
              <JarvisResponseCard text={msg.content} onChipClick={onSendMessage} />
            </div>

            {/* Action Dock (Below Text) */}
            <div className="mt-5 pt-4 border-t border-white/[0.05] flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Voice Playback Controls */}
                <button
                  onClick={onPlayToggle}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border ${
                    isSpeaking
                      ? 'bg-cyan-500/20 text-[#38bdf8] border-cyan-500/30 shadow-[0_0_10px_rgba(56,189,248,0.2)]'
                      : 'bg-white/5 text-slate-400 border-white/10 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {isPaused || !isSpeaking ? (
                    <Play className="h-3 w-3 fill-current" />
                  ) : (
                    <Pause className="h-3 w-3 fill-current" />
                  )}
                  <span>{isSpeaking ? (isPaused ? 'Resume' : 'Speaking') : 'Read Out'}</span>

                  {/* Equalizer pulse when playing */}
                  {isPlaying && (
                    <div className="flex items-end gap-0.5 h-2.5 ml-1">
                      {[1, 2, 3].map(i => (
                        <motion.div
                          key={i}
                          animate={{ height: [2, 10, 4, 8, 2] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                          className="w-0.5 bg-cyan-400 rounded-full"
                        />
                      ))}
                    </div>
                  )}
                </button>

                {/* Copy Button */}
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all text-[10px] font-black uppercase tracking-wider"
                >
                  <AnimatePresence mode="wait">
                    {copied ? (
                      <motion.div
                        key="check"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                      >
                        <Check className="h-3 w-3 text-emerald-400" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="copy"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                      >
                        <Copy className="h-3 w-3" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Timestamp */}
              <div className="flex items-center gap-1.5 text-slate-500 font-bold text-[10px]">
                <Clock className="h-3 w-3 opacity-50" />
                <span>{timestamp}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
