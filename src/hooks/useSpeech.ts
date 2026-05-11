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
  const [spokenWordIndex, setSpokenWordIndex] = useState<{ start: number; length: number } | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ── Initialize Speech Recognition ONCE on mount ────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        let isFinal = false;
        for (let i = event.results.length - 1; i < event.results.length; ++i) {
          if (event.results[i]) {
            currentTranscript += event.results[i][0].transcript;
            if (event.results[i].isFinal) isFinal = true;
          }
        }
        setTranscript(currentTranscript);
        // Use the latest onTranscript via ref so we don't need it as a dep
        if (onTranscriptRef.current && isFinal) onTranscriptRef.current(currentTranscript);
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onerror = (event: any) => {
        let errorMsg = event.error;
        if (event.error === 'not-allowed') errorMsg = 'Microphone access denied — allow it in browser settings and refresh.';
        else if (event.error === 'no-speech') errorMsg = 'No speech detected. Please try again.';
        else if (event.error === 'network') errorMsg = 'Network error. Please check your connection.';
        setError(errorMsg);
        setIsListening(false);
      };

      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
    }

    synthesisRef.current = window.speechSynthesis;

    return () => {
      recognitionRef.current?.stop();
      synthesisRef.current?.cancel();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount only

  // Keep a ref to the latest onTranscript callback (avoids stale closures)
  const onTranscriptRef = useRef(onTranscript);
  useEffect(() => { onTranscriptRef.current = onTranscript; }, [onTranscript]);

  // ── Update recognition language when prop changes (no re-init) ──
  useEffect(() => {
    if (!recognitionRef.current) return;
    const langCodeMap: Record<string, string> = {
      'en': 'en-US', 'es': 'es-ES', 'fr': 'fr-FR', 'de': 'de-DE',
      'it': 'it-IT', 'pt': 'pt-BR', 'ja': 'ja-JP', 'ko': 'ko-KR',
      'zh': 'zh-CN', 'ru': 'ru-RU', 'ar': 'ar-SA', 'hi': 'hi-IN',
    };
    recognitionRef.current.lang = langCodeMap[lang] || lang || 'en-US';
  }, [lang]);


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
      setError('Voice input not supported. Try Chrome or Edge.');
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    setSpokenWordIndex(null);
    if (synthesisRef.current) {
      synthesisRef.current.cancel();
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsSpeaking(false);
  }, []);

  const speak = useCallback(async (text: string, voiceLang: string = lang, rate: number = 1.0) => {
    stopSpeaking(); // Stop any ongoing speech
    setSpokenWordIndex(null);

    if (!text) return;

    const indianLanguages = ['hi', 'bn', 'gu', 'kn', 'ml', 'mr', 'or', 'pa', 'ta', 'te'];
    const baseLang = voiceLang.split('-')[0];

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
      'bn': 'bn-IN',
      'gu': 'gu-IN',
      'kn': 'kn-IN',
      'ml': 'ml-IN',
      'mr': 'mr-IN',
      'or': 'or-IN',
      'pa': 'pa-IN',
      'ta': 'ta-IN',
      'te': 'te-IN'
    };
    
    const normalizedLang = langCodeMap[voiceLang] || langCodeMap[baseLang] || voiceLang || 'en-US';

    if (indianLanguages.includes(baseLang)) {
      setIsSpeaking(true);
      try {
        const response = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, langCode: baseLang, rate }),
        });

        if (response.ok && response.body) {
          const chunks = [];
          const reader = response.body.getReader();
          
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
          }
          
          const blob = new Blob(chunks, { type: "audio/mpeg" });
          const audioUrl = URL.createObjectURL(blob);
          const audio = new Audio(audioUrl);
          audioRef.current = audio;
          
          audio.onended = () => {
            setIsSpeaking(false);
            URL.revokeObjectURL(audioUrl);
          };
          audio.onerror = (e) => {
            console.error('Sarvam AI Audio playback error', e);
            setIsSpeaking(false);
            setError('Failed to play audio');
            URL.revokeObjectURL(audioUrl);
          };
          
          await audio.play();
          return;
        } else {
          console.warn('Sarvam TTS API returned error, falling back to browser TTS');
        }
      } catch (err) {
        console.error('Failed to call Sarvam TTS API, falling back to browser TTS:', err);
      }
    }

    if (!synthesisRef.current) {
      setError('Speech synthesis not available.');
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = normalizedLang;
    utterance.rate = Math.max(0.5, Math.min(2.0, rate)); // Clamp rate between 0.5 and 2.0
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setSpokenWordIndex(null);
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      setSpokenWordIndex(null);
    };
    utterance.onerror = (event) => {
      console.error('Speech synthesis error', event);
      setIsSpeaking(false);
      setSpokenWordIndex(null);
      setError(`Speech synthesis error: ${event.error}`);
    };
    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        const textFromChar = text.substring(event.charIndex);
        const match = textFromChar.match(/^\S+/);
        const length = match ? match[0].length : (event.charLength || 1);
        setSpokenWordIndex({ start: event.charIndex, length });
      }
    };

    synthesisRef.current.speak(utterance);
  }, [lang, stopSpeaking]);

  return {
    isListening,
    isSpeaking,
    transcript,
    error,
    spokenWordIndex,
    startListening,
    stopListening,
    speak,
    stopSpeaking
  };
}
