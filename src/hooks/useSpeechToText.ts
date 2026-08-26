import { useState, useEffect, useRef } from 'react';

interface UseSpeechToTextOptions {
  onTranscriptChange?: (text: string) => void;
  onFinalResult?: (text: string) => void;
  onError?: (err: any) => void;
  bargeInOnly?: boolean; // New option to filter everything but "Jarvis" or "Stop"
}

export const useSpeechToText = (options?: UseSpeechToTextOptions) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  const bargeInOnlyRef = useRef(options?.bargeInOnly ?? false);

  // Sync ref with option
  useEffect(() => {
    bargeInOnlyRef.current = options?.bargeInOnly ?? false;
  }, [options?.bargeInOnly]);

  useEffect(() => {
    // Check speech recognition support
    const SpeechRecognition = 
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("Speech recognition is not supported in this browser. Please use Chrome/Safari.");
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false; // Stop listening after speech finishes
    rec.interimResults = true; // Stream results as they come
    rec.lang = 'en-US';

    rec.onstart = () => {
      setIsListening(true);
      setTranscript('');
    };

    rec.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      const activeText = (final || interim).toLowerCase().trim();

      // If in bargeInOnly mode, we only allow specific keywords
      if (bargeInOnlyRef.current) {
        const allowed = ['stop', 'jarvis', 'cancel', 'wait'];
        const isAllowed = allowed.some(keyword => activeText.includes(keyword));
        if (!isAllowed) return; // Discard system's own speech picking up
      }

      setTranscript(activeText);

      if (options?.onTranscriptChange && activeText) {
        options.onTranscriptChange(activeText);
      }

      if (final && options?.onFinalResult) {
        options.onFinalResult(final);
      }
    };

    rec.onerror = (event: any) => {
      console.error("Speech Recognition Error:", event.error);
      setIsListening(false);
      if (options?.onError) {
        options.onError(event.error);
      }
    };

    rec.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = rec;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error("Failed to start speech recognition:", err);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    isSupported: !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
  };
};
