import React from "react";
import { motion } from "framer-motion";

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

      {/* SVG Multi-Ring Holographic Core */}
      <svg
        viewBox="-10 -10 120 120"
        className="w-full h-full relative z-10 overflow-visible drop-shadow-[0_0_12px_rgba(56,189,248,0.5)]"
      >
        <defs>
          <linearGradient id="cyanBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00f2fe" />
            <stop offset="100%" stopColor="#4facfe" />
          </linearGradient>
          <linearGradient id="purpleVioletGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>

        {/* Outer Ring: Segmented Tachometer Track (Counter-Clockwise) */}
        <motion.circle
          cx="50"
          cy="50"
          r="44"
          fill="none"
          stroke="url(#cyanBlueGrad)"
          strokeWidth="2.5"
          strokeDasharray="18 8 6 8 32 10"
          strokeLinecap="round"
          animate={{ rotate: -360 }}
          transition={{
            duration: isThinking ? 3 : 16,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{ transformOrigin: "50px 50px" }}
        />

        {/* Middle Ring: Fast Holographic Dashes (Clockwise) */}
        <motion.circle
          cx="50"
          cy="50"
          r="34"
          fill="none"
          stroke="url(#purpleVioletGrad)"
          strokeWidth="2"
          strokeDasharray="8 6 16 6 4 10"
          strokeLinecap="round"
          animate={{ rotate: 360 }}
          transition={{
            duration: isThinking ? 2 : 10,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{ transformOrigin: "50px 50px" }}
        />

        {/* Inner Arc Stabilizer Segments */}
        <motion.circle
          cx="50"
          cy="50"
          r="24"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="1.5"
          strokeDasharray="24 14"
          strokeOpacity="0.8"
          animate={{ rotate: -360 }}
          transition={{
            duration: isListening ? 1.5 : 8,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{ transformOrigin: "50px 50px" }}
        />

        {/* Center Nucleus / Energy Core */}
        <motion.circle
          cx="50"
          cy="50"
          r="12"
          fill="#00f2fe"
          animate={{
            scale: isListening ? [0.85, 1.25, 0.85] : [0.95, 1.05, 0.95],
            opacity: [0.85, 1, 0.85],
          }}
          transition={{
            duration: isListening ? 0.6 : 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ transformOrigin: "50px 50px" }}
        />

        {/* Center Sparkle Point */}
        <circle cx="50" cy="50" r="4.5" fill="#ffffff" />
      </svg>
    </div>
  );
};
