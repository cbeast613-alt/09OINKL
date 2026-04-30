import { useState, useEffect, useCallback, useRef } from 'react';

// Extended window interface for speech recognition
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    SpeechRecognition: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    webkitSpeechRecognition: any;
  }
}

interface UseSpeechProps {
  lang?: string;
  onTranscript?: (text: string) => void;
}

export function useSpeech({ lang = 'en-US', onTranscript }: UseSpeechProps = {}) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        // Normalize language code for Speech Recognition
        const langCodeMap: Record<string, string> = {
          'en': 'en-US', 'es': 'es-ES', 'fr': 'fr-FR', 'de': 'de-DE',
          'it': 'it-IT', 'pt': 'pt-BR', 'ja': 'ja-JP', 'ko': 'ko-KR',
          'zh': 'zh-CN', 'ru': 'ru-RU', 'ar': 'ar-SA', 'hi': 'hi-IN',
        };
        const normalizedLang = langCodeMap[lang] || lang || 'en-US';
        recognition.lang = normalizedLang;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          let isFinal = false;
          for (let i = event.results.length - 1; i < event.results.length; ++i) {
            if (event.results[i]) {
              currentTranscript += event.results[i][0].transcript;
              if (event.results[i].isFinal) {
                isFinal = true;
              }
            }
          }
          setTranscript(currentTranscript);
          if (onTranscript && isFinal) {
            onTranscript(currentTranscript);
          }
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onerror = (event: any) => {
          let errorMsg = event.error;
          if (event.error === 'not-allowed') {
            errorMsg = 'Microphone permission denied. Please enable microphone access.';
          } else if (event.error === 'no-speech') {
            errorMsg = 'No speech detected. Please try again.';
          } else if (event.error === 'network') {
            errorMsg = 'Network error. Please check your connection.';
          }
          setError(errorMsg);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
      
      synthesisRef.current = window.speechSynthesis;
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthesisRef.current) {
        synthesisRef.current.cancel();
      }
    };
  }, [lang, onTranscript]);

  const startListening = useCallback(() => {
    setError(null);
    setTranscript('');
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Failed to start recognition:', err);
      }
    } else {
      setError('Speech recognition not available.');
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  const speak = useCallback((text: string, voiceLang: string = lang, rate: number = 1.0) => {
    if (!synthesisRef.current) {
      setError('Speech synthesis not available.');
      return;
    }

    synthesisRef.current.cancel(); // Stop any ongoing speech

    if (!text) return;

    // Map language codes to proper Web Speech API codes
    const langCodeMap: Record<string, string> = {
      'auto': 'en-US',
      'en': 'en-US',
      'es': 'es-ES',
      'fr': 'fr-FR',
      'de': 'de-DE',
      'it': 'it-IT',
      'pt': 'pt-BR',
      'ja': 'ja-JP',
      'ko': 'ko-KR',
      'zh-CN': 'zh-CN',
      'zh-TW': 'zh-TW',
      'ru': 'ru-RU',
      'ar': 'ar-SA',
      'hi': 'hi-IN',
    };
    
    const normalizedLang = langCodeMap[voiceLang] || voiceLang || 'en-US';

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = normalizedLang;
    utterance.rate = Math.max(0.5, Math.min(2.0, rate)); // Clamp rate between 0.5 and 2.0
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (event) => {
      console.error('Speech synthesis error', event);
      setIsSpeaking(false);
      setError(`Speech synthesis error: ${event.error}`);
    };

    synthesisRef.current.speak(utterance);
  }, [lang]);

  const stopSpeaking = useCallback(() => {
    if (synthesisRef.current) {
      synthesisRef.current.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return {
    isListening,
    isSpeaking,
    transcript,
    error,
    startListening,
    stopListening,
    speak,
    stopSpeaking
  };
}
