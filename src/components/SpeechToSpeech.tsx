'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Mic, MicOff, Play, Pause, RotateCcw, Settings2, Copy, Check } from 'lucide-react';
import { useSpeech } from '../hooks/useSpeech';
import { useTranslationStore } from '../store/translationStore';
import { LanguageSelector } from './LanguageSelector';
import { motion, AnimatePresence } from 'framer-motion';

export const SpeechToSpeech: React.FC = () => {
  const { 
    sourceLang, targetLang, setSourceLang, setTargetLang,
    sourceText, setSourceText, simpleTranslation, setTranslatedText,
    romanization, addToHistory
  } = useTranslationStore();

  const [isTranslating, setIsTranslating] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(0.85);
  const [showSpeedControls, setShowSpeedControls] = useState(false);
  const [copiedTranslation, setCopiedTranslation] = useState(false);

  const handleTranscript = useCallback((text: string) => {
    setSourceText(text);
  }, [setSourceText]);

  const { 
    isListening, isSpeaking, error,
    startListening, stopListening, speak, stopSpeaking 
  } = useSpeech({
    lang: sourceLang === 'auto' ? 'en-US' : sourceLang,
    onTranscript: handleTranscript
  });

  // Handle translation when listening stops
  useEffect(() => {
    if (!isListening && sourceText.trim() && !simpleTranslation && !isTranslating) {
      const translateAndSpeak = async () => {
        setIsTranslating(true);
        try {
          const response = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              text: sourceText, 
              sourceLang: sourceLang === 'auto' ? 'en' : sourceLang, 
              targetLang 
            }),
          });
          
          if (response.ok) {
            const data = await response.json();
            setTranslatedText(
              data.simpleTranslation,
              data.formalTranslation,
              data.romanization,
              data.formality,
              data.difficulty
            );
            
            addToHistory({
              sourceText,
              translatedText: data.simpleTranslation,
              simpleTranslation: data.simpleTranslation,
              formalTranslation: data.formalTranslation,
              romanization: data.romanization,
              formality: data.formality,
              difficulty: data.difficulty,
              sourceLang: data.sourceLang,
              targetLang
            });
            
            // Auto play the simplified translation with slower speed for clarity
            speak(data.simpleTranslation, targetLang, playbackRate);
          } else {
            const errorData = await response.json().catch(() => ({}));
            setTranslatedText(`❌ ${errorData.error || 'Translation failed'}`, '', '', 'Hard', 'Hard');
          }
        } catch (error) {
          console.error('Translation failed:', error);
          const errorMsg = '❌ Internet check karo aur dobara try karo 🌐';
          setTranslatedText(errorMsg, errorMsg, '', 'Hard', 'Hard');
        } finally {
          setIsTranslating(false);
        }
      };
      
      const timer = setTimeout(translateAndSpeak, 500);
      return () => clearTimeout(timer);
    }
  }, [isListening, sourceText, sourceLang, targetLang, simpleTranslation, isTranslating, setTranslatedText, addToHistory, speak, playbackRate]);

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      setSourceText('');
      setTranslatedText('', '', '', 'Easy', 'Easy');
      stopSpeaking();
      setIsTranslating(false);
      startListening();
    }
  };

  const togglePlayback = () => {
    if (isSpeaking) {
      stopSpeaking();
    } else if (simpleTranslation && !simpleTranslation.startsWith('❌')) {
      speak(simpleTranslation, targetLang, playbackRate);
    }
  };

  const replay = () => {
    stopSpeaking();
    if (simpleTranslation && !simpleTranslation.startsWith('❌')) {
      speak(simpleTranslation, targetLang, playbackRate);
    }
  };

  const handleCopy = useCallback(() => {
    if (simpleTranslation && !simpleTranslation.startsWith('❌')) {
      navigator.clipboard.writeText(simpleTranslation);
      setCopiedTranslation(true);
      setTimeout(() => setCopiedTranslation(false), 2000);
    }
  }, [simpleTranslation]);

  const speedOptions = [0.75, 0.85, 1.0, 1.25, 1.5];

  return (
    <div className="w-full max-w-4xl mx-auto glass-panel overflow-hidden flex flex-col shadow-2xl">
      
      <div className="flex flex-col md:flex-row items-center border-b border-slate-200 dark:border-slate-700/50">
        <div className="flex-1 p-3 w-full border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-700/50">
          <LanguageSelector value={sourceLang} onChange={setSourceLang} isSource={true} />
        </div>
        <div className="flex-1 p-3 w-full bg-slate-50/30 dark:bg-slate-900/30">
          <LanguageSelector value={targetLang} onChange={setTargetLang} />
        </div>
      </div>

      <div className="flex flex-col items-center justify-center p-8 min-h-[450px] relative">
        {error && (
          <div className="absolute top-4 w-full text-center text-red-500 text-sm bg-red-50 dark:bg-red-900/20 py-2 rounded mx-2">
            {error}
          </div>
        )}
        
        {/* Interactive Avatar / Visualizer Area */}
        <div className="flex w-full items-center justify-center mb-12 gap-6 md:gap-16">
          {/* User Side */}
          <div className="flex flex-col items-center">
            <div className="relative">
              {isListening && (
                <motion.div 
                  className="absolute inset-0 bg-blue-500 rounded-full opacity-30"
                  animate={{ scale: [1, 1.4, 1] }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                />
              )}
              <button
                onClick={toggleListening}
                className={`relative z-10 p-5 rounded-full shadow-lg transition-all transform hover:scale-105 focus:outline-none ${
                  isListening 
                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/50' 
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50'
                }`}
              >
                {isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
              </button>
            </div>
            <div className="mt-4 text-sm font-medium text-slate-500">You speak</div>
          </div>

          {/* Connection Line */}
          <div className="flex-1 flex items-center justify-center relative min-h-[60px]">
            <div className="absolute w-full h-[2px] bg-slate-200 dark:bg-slate-700 rounded-full"></div>
            <AnimatePresence>
              {(isListening || isTranslating || isSpeaking) && (
                <motion.div
                  initial={{ width: '0%', opacity: 0 }}
                  animate={{ width: '100%', opacity: 1 }}
                  exit={{ width: '0%', opacity: 0 }}
                  className="absolute h-[2px] bg-blue-500 rounded-full"
                >
                  <motion.div 
                    className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_10px_#3b82f6]"
                    animate={{ x: isSpeaking ? [-100, 0] : [0, 100] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
            <div className="z-10 bg-white dark:bg-slate-900 p-2 rounded-full border border-slate-200 dark:border-slate-700">
              <span className="text-2xl">🌍</span>
            </div>
          </div>

          {/* AI / Output Side */}
          <div className="flex flex-col items-center relative">
            <div className="relative">
              {isSpeaking && (
                <motion.div 
                  className="absolute inset-0 bg-green-500 rounded-full opacity-30"
                  animate={{ scale: [1, 1.4, 1] }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                />
              )}
              <button
                onClick={togglePlayback}
                disabled={!simpleTranslation || simpleTranslation.startsWith('❌')}
                className={`relative z-10 p-5 rounded-full shadow-lg transition-all transform hover:scale-105 focus:outline-none ${
                  isSpeaking 
                    ? 'bg-green-500 hover:bg-green-600 text-white shadow-green-500/50' 
                    : !simpleTranslation || simpleTranslation.startsWith('❌')
                      ? 'bg-slate-100 dark:bg-slate-800/50 text-slate-400 cursor-not-allowed'
                      : 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700'
                }`}
              >
                {isSpeaking ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
              </button>
            </div>
            <div className="mt-4 text-sm font-medium text-slate-500">You hear</div>

            {/* Playback Controls Panel */}
            {simpleTranslation && !simpleTranslation.startsWith('❌') && (
              <div className="absolute top-full mt-4 flex gap-2">
                <button 
                  onClick={replay}
                  className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  title="Replay"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button 
                  onClick={handleCopy}
                  className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  title="Copy text"
                >
                  {copiedTranslation ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
                <div className="relative">
                  <button 
                    onClick={() => setShowSpeedControls(!showSpeedControls)}
                    className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    title="Playback Speed"
                  >
                    <Settings2 className="w-4 h-4" />
                  </button>
                  <AnimatePresence>
                    {showSpeedControls && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl p-2 z-20 w-32"
                      >
                        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 px-2">Speed</div>
                        {speedOptions.map(speed => (
                          <button
                            key={speed}
                            onClick={() => { setPlaybackRate(speed); setShowSpeedControls(false); }}
                            className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors ${
                              playbackRate === speed 
                                ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' 
                                : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {speed}x
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Text Display Area */}
        <div className="w-full space-y-6 mt-6">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">🎤 Original</p>
            <div className="min-h-[50px] bg-white/50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-100 dark:border-slate-700">
              <p className="text-slate-700 dark:text-slate-300 text-base">
                {sourceText || <span className="text-slate-400 italic">Your speech will appear here...</span>}
              </p>
            </div>
          </div>
          
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">🔊 Speaking</p>
            <div className="min-h-[60px] bg-blue-50/50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-100 dark:border-blue-800/50 relative">
              {isTranslating ? (
                <div className="flex justify-center items-center space-x-2 text-blue-500">
                  <motion.div className="w-2 h-2 bg-blue-500 rounded-full" animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} />
                  <motion.div className="w-2 h-2 bg-blue-500 rounded-full" animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} />
                  <motion.div className="w-2 h-2 bg-blue-500 rounded-full" animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} />
                </div>
              ) : simpleTranslation && !simpleTranslation.startsWith('❌') ? (
                <p className="text-lg font-semibold text-slate-800 dark:text-slate-100 whitespace-pre-wrap break-words">{simpleTranslation}</p>
              ) : null}
            </div>

            {/* Pronunciation */}
            {romanization && simpleTranslation && !simpleTranslation.startsWith('❌') && (
              <div className="mt-3 p-3 rounded-lg bg-slate-200/50 dark:bg-slate-800/50">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  🔤 How to say it
                </p>
                <p className="text-slate-700 dark:text-slate-300 text-sm font-mono">{romanization}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
