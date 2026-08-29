import { useState, useRef } from 'react';

// Custom Jarvis Voice ID (Daniel or standard community Jarvis clone ID)
const JARVIS_VOICE_ID = import.meta.env.VITE_ELEVENLABS_VOICE_ID || 'pNInz6obpgdq514hcHCY'; // Default refined British Male ID

export const useJarvisVoice = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const sentencesRef = useRef<string[]>([]);
  const currentSentenceIdxRef = useRef<number>(0);
  const onStartRef = useRef<(() => void) | undefined>(undefined);
  const onEndRef = useRef<(() => void) | undefined>(undefined);
  const isPausedRef = useRef(false);

  // Check ElevenLabs key presence
  const elevenLabsApiKey = import.meta.env.VITE_ELEVENLABS_API_KEY || '';

  // Selector helper for local speech synthesis voices
  const getLocalJarvisVoice = (): SpeechSynthesisVoice | null => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return null;
    const voices = window.speechSynthesis.getVoices();

    // 1. Try to find a British Male voice (Paul Bettany style)
    const britishMale = voices.find(voice => {
      const name = voice.name.toLowerCase();
      const lang = voice.lang.toLowerCase();
      return (
        lang.startsWith('en-gb') && 
        (name.includes('male') || name.includes('daniel') || name.includes('arthur') || 
         name.includes('oliver') || name.includes('google') || name.includes('natural') ||
         name.includes('james') || name.includes('george'))
      );
    });
    if (britishMale) return britishMale;

    // 2. Try to find any British voice that might be male (check common names, exclude known female names like hazel, susan, zira, hannah)
    const britishAnyMale = voices.find(voice => {
      const name = voice.name.toLowerCase();
      const lang = voice.lang.toLowerCase();
      return (
        lang.startsWith('en-gb') &&
        !name.includes('hazel') &&
        !name.includes('susan') &&
        !name.includes('hannah') &&
        !name.includes('female') &&
        !name.includes('girl') &&
        !name.includes('woman')
      );
    });
    if (britishAnyMale) return britishAnyMale;

    // 3. Try to find a US/English Male voice (Microsoft David, Microsoft Mark, etc.)
    const englishMale = voices.find(voice => {
      const name = voice.name.toLowerCase();
      const lang = voice.lang.toLowerCase();
      return (
        lang.startsWith('en-') && 
        (name.includes('male') || name.includes('david') || name.includes('mark') || 
         name.includes('brian') || name.includes('guy') || name.includes('george') || 
         name.includes('james') || name.includes('natural') || name.includes('google'))
      );
    });
    if (englishMale) return englishMale;

    // 4. Try to find any English voice that is not explicitly female
    const englishAnyMale = voices.find(voice => {
      const name = voice.name.toLowerCase();
      const lang = voice.lang.toLowerCase();
      return (
        lang.startsWith('en-') &&
        !name.includes('hazel') &&
        !name.includes('susan') &&
        !name.includes('zira') &&
        !name.includes('hannah') &&
        !name.includes('female') &&
        !name.includes('girl') &&
        !name.includes('woman') &&
        !name.includes('heera') &&
        !name.includes('elena')
      );
    });
    if (englishAnyMale) return englishAnyMale;

    // 5. Fallback to any British voice
    const anyBritish = voices.find(voice => voice.lang.toLowerCase().startsWith('en-gb'));
    if (anyBritish) return anyBritish;

    // 6. Fallback to any English voice
    const anyEnglish = voices.find(voice => voice.lang.toLowerCase().startsWith('en-'));
    if (anyEnglish) return anyEnglish;

    // 7. Ultimate fallback: default voice
    return voices.find(voice => voice.default) || voices[0] || null;
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

  const speakCurrentSentence = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const sentences = sentencesRef.current;
    const idx = currentSentenceIdxRef.current;

    if (idx >= sentences.length) {
      setIsPlaying(false);
      setIsPaused(false);
      if (onEndRef.current) onEndRef.current();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(sentences[idx]);
    const localVoice = getLocalJarvisVoice();
    if (localVoice) {
      utterance.voice = localVoice;
    }

    utterance.rate = 0.96;
    utterance.pitch = 0.88;

    utterance.onstart = () => {
      if (idx === 0 && onStartRef.current) {
        onStartRef.current();
      }
    };

    utterance.onend = () => {
      if (isPausedRef.current) return;
      currentSentenceIdxRef.current = idx + 1;
      speakCurrentSentence();
    };

    utterance.onerror = (e) => {
      console.warn("Speech utterance error:", e);
      if (isPausedRef.current) return;
      currentSentenceIdxRef.current = idx + 1;
      speakCurrentSentence();
    };

    currentUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const speak = async (
    text: string, 
    onStart?: () => void, 
    onEnd?: () => void
  ) => {
    stop();

    const getSpeakableText = (rawText: string): string => {
      return rawText
        .split('\n')
        .filter(line => {
          const trimmed = line.trim();
          if (!trimmed) return false;
          // Filter out commands
          if (trimmed.startsWith('[COMMAND:')) return false;
          // Filter out suggestion chips: e.g. [Prioritize task]
          const chipMatch = trimmed.match(/^\[([^[\]]+)\]$/);
          if (chipMatch && !trimmed.startsWith('[ ]') && !trimmed.startsWith('[x]')) {
            return false;
          }
          return true;
        })
        .join('\n');
    };

    const cleanText = getSpeakableText(text)
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

    const sentences = cleanText.split(/(?<=[.?!])\s+/).filter(Boolean);
    if (sentences.length === 0) {
      if (onEnd) onEnd();
      return;
    }

    sentencesRef.current = sentences;
    currentSentenceIdxRef.current = 0;
    onStartRef.current = onStart;
    onEndRef.current = onEnd;
    isPausedRef.current = false;

    setIsPlaying(true);
    setIsPaused(false);

    speakCurrentSentence();
  };

  const pause = () => {
    // Resume/Pause Web Audio Context if running
    if (audioContextRef.current) {
      if (audioContextRef.current.state === 'running') {
        audioContextRef.current.suspend();
        setIsPaused(true);
      }
    } else if (typeof window !== 'undefined' && window.speechSynthesis) {
      isPausedRef.current = true;
      setIsPaused(true);
      window.speechSynthesis.cancel();
    }
  };

  const resume = () => {
    if (audioContextRef.current) {
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
        setIsPaused(false);
      }
    } else if (typeof window !== 'undefined' && window.speechSynthesis) {
      isPausedRef.current = false;
      setIsPaused(false);
      speakCurrentSentence();
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
    isPausedRef.current = false;
    sentencesRef.current = [];
    currentSentenceIdxRef.current = 0;

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
