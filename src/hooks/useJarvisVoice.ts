import { useState, useRef } from 'react';

// Custom Jarvis Voice ID (Daniel or standard community Jarvis clone ID)
const JARVIS_VOICE_ID = import.meta.env.VITE_ELEVENLABS_VOICE_ID || 'pNInz6obpgdq514hcHCY'; // Default refined British Male ID

export const useJarvisVoice = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Check ElevenLabs key presence
  const elevenLabsApiKey = import.meta.env.VITE_ELEVENLABS_API_KEY || '';

  // Selector helper for local speech synthesis voices
  const getLocalJarvisVoice = (): SpeechSynthesisVoice | null => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return null;
    const voices = window.speechSynthesis.getVoices();
    const britishMaleVoice = voices.find(voice => {
      const name = voice.name.toLowerCase();
      const lang = voice.lang.toLowerCase();
      return (
        lang.startsWith('en-gb') && 
        (name.includes('male') || name.includes('daniel') || name.includes('arthur') || name.includes('oliver') || name.includes('google'))
      );
    });

    if (britishMaleVoice) return britishMaleVoice;
    return voices.find(voice => voice.lang.toLowerCase().startsWith('en-gb')) || null;
  };

  const playElevenLabsAudio = async (audioBlob: Blob, onStart?: () => void, onEnd?: () => void) => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;

      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;

      // 1. High-Pass Filter: Cuts off mud below 120Hz
      const highpass = ctx.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.value = 120;

      // 2. Peaking Intercom Filter: Metallic peak boost at 3.2kHz
      const peaking = ctx.createBiquadFilter();
      peaking.type = 'peaking';
      peaking.frequency.value = 3200;
      peaking.Q.value = 1.8;
      peaking.gain.value = 3.5;

      // Connect node flow: source -> highpass -> peaking -> speakers
      source.connect(highpass);
      highpass.connect(peaking);
      peaking.connect(ctx.destination);

      source.onended = () => {
        setIsPlaying(false);
        if (onEnd) onEnd();
        ctx.close();
        audioContextRef.current = null;
        activeSourceRef.current = null;
      };

      activeSourceRef.current = source;
      setIsPlaying(true);
      setIsPaused(false);
      if (onStart) onStart();
      source.start(0);
    } catch (err) {
      console.error("Web Audio playback failed:", err);
      if (onEnd) onEnd();
    }
  };

  const speak = async (
    text: string, 
    onStart?: () => void, 
    onEnd?: () => void
  ) => {
    stop();

    const cleanText = text
      .replace(/[-*#_`~\[\]()|]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return;

    // 1. Primary path: ElevenLabs Custom Voice Clone
    if (elevenLabsApiKey) {
      try {
        setIsPlaying(true);
        if (onStart) onStart();

        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${JARVIS_VOICE_ID}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': elevenLabsApiKey
          },
          body: JSON.stringify({
            text: cleanText,
            model_id: 'eleven_turbo_v2_5',
            voice_settings: {
              stability: 0.82,
              similarity_boost: 0.88,
              style: 0.0
            }
          })
        });

        if (!response.ok) {
          throw new Error(`ElevenLabs TTS response status: ${response.status}`);
        }

        const audioBlob = await response.blob();
        await playElevenLabsAudio(audioBlob, undefined, onEnd);
        return;
      } catch (err) {
        console.warn("ElevenLabs TTS failed, falling back to Web Speech:", err);
      }
    }

    // 2. Zero-Cost Fallback: System SpeechSynthesis
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      if (onEnd) onEnd();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const localVoice = getLocalJarvisVoice();
    if (localVoice) {
      utterance.voice = localVoice;
    }

    utterance.rate = 0.96;
    utterance.pitch = 0.88;

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
      if (onStart) onStart();
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      currentUtteranceRef.current = null;
      if (onEnd) onEnd();
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
      currentUtteranceRef.current = null;
      if (onEnd) onEnd();
    };

    currentUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const pause = () => {
    // Resume/Pause Web Audio Context if running
    if (audioContextRef.current) {
      if (audioContextRef.current.state === 'running') {
        audioContextRef.current.suspend();
        setIsPaused(true);
      }
    } else if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  const resume = () => {
    if (audioContextRef.current) {
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
        setIsPaused(false);
      }
    } else if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  };

  const stop = () => {
    // Clear Web Audio context
    if (activeSourceRef.current) {
      try {
        activeSourceRef.current.stop();
      } catch {}
      activeSourceRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Clear system SpeechSynthesis
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    setIsPlaying(false);
    setIsPaused(false);
    currentUtteranceRef.current = null;
  };

  return {
    isPlaying,
    isPaused,
    speak,
    pause,
    resume,
    stop
  };
};
