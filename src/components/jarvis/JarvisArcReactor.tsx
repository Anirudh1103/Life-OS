import React from "react";
import { motion } from "framer-motion";
import jarvisOrb from "../../../android/app/src/main/res/raw/jarvis_orb.svg";

interface JarvisArcReactorProps {
  state?: "idle" | "listening" | "thinking";
  size?: number;
  className?: string;
  onClick?: () => void;
}

export const JarvisArcReactor: React.FC<JarvisArcReactorProps> = ({
  state = "idle",
  size = 42,
  className = "",
  onClick
}) => {
  const isListening = state === "listening";
  const isThinking = state === "thinking";

  return (
    <div
      className={`flex items-center justify-center select-none cursor-pointer rounded-full overflow-visible ${className}`}
      style={{
        width: size,
        height: size,
        position: className.includes('fixed') ? 'fixed' : 'relative',
        background: 'radial-gradient(circle, rgba(13, 17, 26, 0.98) 0%, rgba(8, 11, 17, 0.95) 100%)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: '0 0 20px rgba(0, 0, 0, 0.4), inset 0 0 10px rgba(56, 189, 248, 0.1)'
      }}
      onClick={onClick}
    >
      {/* Ambient Core Glow - Using larger blur and reduced opacity for holographic effect */}
      <motion.div
        animate={{
          scale: isListening ? [1, 1.25, 1] : isThinking ? [1, 1.15, 1] : [1, 1.05, 1],
          opacity: isListening ? 0.6 : 0.3,
        }}
        transition={{
          duration: isListening ? 1.2 : isThinking ? 0.8 : 2.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute inset-[-20%] rounded-full bg-cyan-500/20 blur-2xl pointer-events-none"
      />

      {/* Reuse the native Jarvis asset: neon circle with glowing eyes. */}
      <motion.img
        src={jarvisOrb}
        alt="Jarvis"
        draggable={false}
        animate={{
          scale: isListening ? [0.96, 1.06, 0.96] : isThinking ? [0.98, 1.03, 0.98] : 1,
          rotate: isThinking ? [0, 2, -2, 0] : 0,
        }}
        transition={{
          duration: isListening ? 0.8 : isThinking ? 1.1 : 0.2,
          repeat: isListening || isThinking ? Infinity : 0,
          ease: "easeInOut",
        }}
        className="relative z-10 h-full w-full rounded-full object-contain drop-shadow-[0_0_12px_rgba(139,92,246,0.5)]"
      />
    </div>
  );
};
