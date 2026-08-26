import { useState, useEffect, useRef } from 'react';

interface UseWakeWordOptions {
  onWakeWordDetected?: () => void;
  isActive?: boolean;
}

export const useWakeWord = (options?: UseWakeWordOptions) => {
  const [isWakeWordListening, setIsWakeWordListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const activeRef = useRef(options?.isActive ?? true);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Sync active state
  useEffect(() => {
    activeRef.current = options?.isActive ?? true;
    if (activeRef.current) {
      startListening();
    } else {
      stopListening();
    }
  }, [options?.isActive]);

  // Acquire mic stream with hardware/software Echo Cancellation constraints
  const acquireEchoCancelledStream = async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
    try {
      // Clear any stale stream tracks
      releaseEchoCancelledStream();

      // Explicitly open the microphone with AEC and noise filter constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      mediaStreamRef.current = stream;
      console.log("[Jarvis Audio] Background Echo Cancellation & Noise Suppression stream armed.");
    } catch (err) {
      console.warn("[Jarvis Audio] Echo cancellation stream acquisition failed:", err);
    }
  };

  // Close and release microphone stream
  const releaseEchoCancelledStream = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch {}
      });
      mediaStreamRef.current = null;
      console.log("[Jarvis Audio] Echo cancellation stream released.");
    }
  };

  // Synthesize a futuristic high-tech chime
  const playActivationChime = () => {
    if (typeof window === 'undefined') return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    try {
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1600, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {
      console.warn("Failed to play synthesized chime:", e);
    }
  };

  useEffect(() => {
    const SpeechRecognition = 
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("SpeechRecognition is not supported on this browser for wake words.");
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onresult = (event: any) => {
      if (!activeRef.current) return;

      // Cumulative result scan to capture 'jarvis' across split inputs
      let fullTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        fullTranscript += event.results[i][0].transcript.toLowerCase();
      }

      // Check if cumulative transcript contains 'jarvis'
      if (fullTranscript.includes('jarvis')) {
        console.log("[Jarvis Audio] Wake Word Spotted:", fullTranscript);
        
        // Stop listener immediately to clear buffer and release mic lock!
        rec.stop();
        releaseEchoCancelledStream();
        
        playActivationChime();
        if (options?.onWakeWordDetected) {
          options.onWakeWordDetected();
        }
      }
    };

    rec.onerror = (event: any) => {
      console.warn("[Jarvis Audio] Wake-word listener error:", event.error);
      if (event.error === 'not-allowed') {
        setIsWakeWordListening(false);
      }
    };

    rec.onend = () => {
      // Auto restart listening if active
      if (activeRef.current) {
        try {
          rec.start();
        } catch {
          // already running
        }
      } else {
        setIsWakeWordListening(false);
        releaseEchoCancelledStream();
      }
    };

    recognitionRef.current = rec;

    if (activeRef.current) {
      startListening();
    }

    return () => {
      activeRef.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      releaseEchoCancelledStream();
    };
  }, []);

  const startListening = async () => {
    if (recognitionRef.current && !isWakeWordListening) {
      try {
        // Arm background echo-cancellation stream
        await acquireEchoCancelledStream();
        
        recognitionRef.current.start();
        setIsWakeWordListening(true);
        console.log("Wake-word background spotter armed.");
      } catch {
        // already started
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isWakeWordListening) {
      recognitionRef.current.stop();
      setIsWakeWordListening(false);
      releaseEchoCancelledStream();
      console.log("Wake-word background spotter disarmed.");
    }
  };

  return {
    isWakeWordListening,
    startListening,
    stopListening
  };
};
