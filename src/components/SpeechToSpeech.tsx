'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Mic, MicOff, Play, Pause, RotateCcw, Settings2, Copy, Check, ArrowLeftRight, Loader2, Minus, Plus } from 'lucide-react';
import { useSpeech } from '../hooks/useSpeech';
import { useTranslationStore } from '../store/translationStore';
import { LanguageSelector } from './LanguageSelector';
import { motion, AnimatePresence } from 'framer-motion';
import { getTextSizeClass } from '../utils/text';

export const SpeechToSpeech: React.FC = () => {
  const { 
    sourceLang, targetLang, setSourceLang, setTargetLang,
    sourceText, setSourceText, simpleTranslation, formalTranslation, setTranslatedText,
    romanization, addToHistory, swapLanguages,
    textSizeScale, setTextSizeScale
  } = useTranslationStore();

  const [isTranslating, setIsTranslating] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(0.85);
  const [showSpeedControls, setShowSpeedControls] = useState(false);
  const [copiedTranslation, setCopiedTranslation] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleTranscript = useCallback((text: string) => {
    setSourceText(text);
  }, [setSourceText]);

  const { 
    isListening, isSpeaking, error, spokenWordIndex,
    startListening, stopListening, speak, stopSpeaking 
  } = useSpeech({
    lang: sourceLang === 'auto' ? 'en-US' : sourceLang,
    onTranscript: handleTranscript
  });

  const handleTranslateAndSpeak = useCallback(async () => {
    if (!sourceText.trim() || isTranslating) return;
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
        const errorMsg = '❌ Translation failed. Check your internet and try again.';
        setTranslatedText(errorMsg, errorMsg, '', 'Hard', 'Hard');
      }
    } catch (error) {
      console.error('Translation failed:', error);
      const errorMsg = '❌ Translation failed. Check your internet and try again.';
      setTranslatedText(errorMsg, errorMsg, '', 'Hard', 'Hard');
    } finally {
      setIsTranslating(false);
    }
  }, [sourceText, sourceLang, targetLang, setTranslatedText, addToHistory, speak, playbackRate, isTranslating]);

  // Handle translation when listening stops
  useEffect(() => {
    if (!isListening && sourceText.trim() && !simpleTranslation && !isTranslating) {
      const timer = setTimeout(handleTranslateAndSpeak, 500);
      return () => clearTimeout(timer);
    }
  }, [isListening, sourceText, simpleTranslation, isTranslating, handleTranslateAndSpeak]);

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
    } else if ((formalTranslation || simpleTranslation) && !(formalTranslation || simpleTranslation).startsWith('❌')) {
      speak(formalTranslation || simpleTranslation, targetLang, playbackRate);
    }
  };

  const replay = () => {
    stopSpeaking();
    if ((formalTranslation || simpleTranslation) && !(formalTranslation || simpleTranslation).startsWith('❌')) {
      speak(formalTranslation || simpleTranslation, targetLang, playbackRate);
    }
  };

  const [copyError, setCopyError] = useState<string | null>(null);

  const handleCopy = useCallback(async () => {
    const text = formalTranslation || simpleTranslation;
    if (text && !text.startsWith('❌')) {
      try {
        await navigator.clipboard.writeText(text);
        setCopiedTranslation(true);
        setTimeout(() => setCopiedTranslation(false), 1500);
      } catch (err) {
        setCopyError('Copy failed — please copy manually');
        setTimeout(() => setCopyError(null), 3000);
      }
    }
  }, [formalTranslation, simpleTranslation]);

  const speedOptions = [0.75, 0.85, 1.0, 1.25, 1.5];

  return (
    <div className="w-full max-w-4xl mx-auto glass-panel overflow-hidden flex flex-col shadow-2xl">
      
      {/* Languages Header - Always side by side */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center px-2 py-2 sm:p-3 border-b border-slate-200 dark:border-slate-700/50 gap-1 sm:gap-2">
        <div className="min-w-0">
          <LanguageSelector value={sourceLang} onChange={setSourceLang} isSource={true} align="left" label="Translate from" ariaLabel="Select source language" />
        </div>
        <button
          onClick={swapLanguages}
          disabled={sourceLang === 'auto'}
          className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 mt-5"
          aria-label="Swap languages"
        >
          <ArrowLeftRight className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <LanguageSelector value={targetLang} onChange={setTargetLang} align="right" label="Translate to" ariaLabel="Select target language" />
        </div>
      </div>

      <div className="flex flex-col items-center justify-center p-4 sm:p-8 min-h-[400px] relative">
        {error && (
          <div className="absolute top-4 left-4 right-4 text-center text-red-500 text-sm bg-red-50 dark:bg-red-900/20 py-2 rounded">
            {error}
          </div>
        )}
        
        {/* Interactive Avatar / Visualizer Area */}
        <div className="flex w-full items-center justify-center mb-8 sm:mb-12 gap-4 sm:gap-6 md:gap-16">
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
                className={`relative z-10 p-4 sm:p-5 rounded-full shadow-lg transition-all transform hover:scale-105 focus:outline-none ${
                  isListening 
                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/50' 
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50'
                }`}
              >
                {isListening ? <MicOff className="w-6 h-6 sm:w-8 sm:h-8" /> : <Mic className="w-6 h-6 sm:w-8 sm:h-8" />}
              </button>
            </div>
            <div className="mt-3 text-xs sm:text-sm font-medium text-slate-500">You speak</div>
          </div>

          {/* Connection Line */}
          <div className="flex-1 flex items-center justify-center relative min-h-[40px] sm:min-h-[60px]">
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
            <div className="z-10 bg-white dark:bg-slate-900 p-1.5 sm:p-2 rounded-full border border-slate-200 dark:border-slate-700">
              <span className="text-lg sm:text-2xl">🌍</span>
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
                className={`relative z-10 p-4 sm:p-5 rounded-full shadow-lg transition-all transform hover:scale-105 focus:outline-none ${
                  isSpeaking 
                    ? 'bg-green-500 hover:bg-green-600 text-white shadow-green-500/50' 
                    : !simpleTranslation || simpleTranslation.startsWith('❌')
                      ? 'bg-slate-100 dark:bg-slate-800/50 text-slate-400 cursor-not-allowed'
                      : 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700'
                }`}
              >
                {isSpeaking ? <Pause className="w-6 h-6 sm:w-8 sm:h-8" /> : <Play className="w-6 h-6 sm:w-8 sm:h-8 ml-0.5" />}
              </button>
            </div>
            <div className="mt-3 text-xs sm:text-sm font-medium text-slate-500">You hear</div>

            {/* Playback Controls Panel */}
            {simpleTranslation && !simpleTranslation.startsWith('❌') && (
              <div className="absolute top-full mt-3 sm:mt-4 flex gap-1.5 sm:gap-2">
                <button 
                  onClick={replay}
                  className="p-1.5 sm:p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  title="Replay"
                >
                  <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
                <div className="relative">
                  <button 
                    onClick={handleCopy}
                    className="p-1.5 sm:p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    title="Copy text"
                  >
                    {copiedTranslation ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" /> : <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                  </button>
                  {copyError && (
                    <div className="absolute bottom-full right-0 mb-2 bg-red-500 text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-30">
                      {copyError}
                    </div>
                  )}
                </div>
                <div className="relative">
                  <button 
                    onClick={() => setShowSpeedControls(!showSpeedControls)}
                    className="p-1.5 sm:p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    title="Playback Speed"
                  >
                    <Settings2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                  <AnimatePresence>
                    {showSpeedControls && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl p-2 z-20 w-28 sm:w-32"
                      >
                        <div className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 px-2">Speed</div>
                        {speedOptions.map(speed => (
                          <button
                            key={speed}
                            onClick={() => { setPlaybackRate(speed); setShowSpeedControls(false); }}
                            className={`w-full text-left px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-xs sm:text-sm transition-colors ${
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

        {/* Text Display Area - Always side by side */}
        <div className="w-full flex flex-row gap-2 sm:gap-4 mt-4" style={{ minHeight: '120px' }}>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">🎤 Original</p>
            <div className="bg-white/50 dark:bg-slate-800/50 rounded-lg p-2.5 border border-slate-100 dark:border-slate-700 overflow-y-auto" style={{ minHeight: '80px' }}>
              <p className={`${getTextSizeClass(textSizeScale)} text-slate-700 dark:text-slate-300 transition-all`}>
                {sourceText || <span className="text-slate-400 italic">Your speech will appear here...</span>}
              </p>
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center mb-1">
              <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">🔊 Translation</p>
              <div className="flex items-center bg-blue-100/50 dark:bg-blue-800/30 rounded-lg p-0.5">
                <button onClick={() => setTextSizeScale(Math.max(0, textSizeScale - 1))} className="p-1 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-white dark:hover:bg-slate-800 rounded transition-colors disabled:opacity-50" disabled={textSizeScale <= 0} title="Decrease text size"><Minus className="w-3 h-3" /></button>
                <div className="w-px h-3 bg-blue-200 dark:bg-blue-700 mx-0.5"></div>
                <button onClick={() => setTextSizeScale(Math.min(4, textSizeScale + 1))} className="p-1 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-white dark:hover:bg-slate-800 rounded transition-colors disabled:opacity-50" disabled={textSizeScale >= 4} title="Increase text size"><Plus className="w-3 h-3" /></button>
              </div>
            </div>
            <div className="bg-blue-50/50 dark:bg-blue-900/20 rounded-lg p-2.5 border border-blue-100 dark:border-blue-800/50 relative overflow-y-auto" style={{ minHeight: '80px' }}>
              {isTranslating ? (
                <div className="flex flex-col justify-center items-center py-4 gap-2 text-blue-500 dark:text-blue-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-xs font-medium">Translating...</span>
                </div>
              ) : (formalTranslation || simpleTranslation) && !(formalTranslation || simpleTranslation).startsWith('❌') ? (
                <div>
                  <p className={`${getTextSizeClass(textSizeScale)} font-semibold text-slate-800 dark:text-slate-100 whitespace-pre-wrap break-words transition-all`}>
                    {spokenWordIndex && isSpeaking ? (
                      <>
                        {(formalTranslation || simpleTranslation).substring(0, spokenWordIndex.start)}
                        <span className="bg-yellow-200 dark:bg-yellow-800/60 text-slate-900 dark:text-slate-50 rounded px-0.5">
                          {(formalTranslation || simpleTranslation).substring(spokenWordIndex.start, spokenWordIndex.start + spokenWordIndex.length)}
                        </span>
                        {(formalTranslation || simpleTranslation).substring(spokenWordIndex.start + spokenWordIndex.length)}
                      </>
                    ) : (
                      formalTranslation || simpleTranslation
                    )}
                  </p>
                  {romanization && (
                    <div className="mt-2 p-1.5 rounded bg-slate-200/50 dark:bg-slate-800/50">
                      <p className="text-[8px] font-semibold text-slate-600 dark:text-slate-400 uppercase mb-0.5">🔤 Pronunciation</p>
                      <p className="text-slate-700 dark:text-slate-300 text-[10px] font-mono leading-tight">{romanization}</p>
                    </div>
                  )}
                </div>
              ) : (formalTranslation?.startsWith('❌') || simpleTranslation?.startsWith('❌')) ? (
                <div>
                  <p className={`${getTextSizeClass(textSizeScale)} font-semibold text-red-500 whitespace-pre-wrap break-words transition-all`}>{formalTranslation || simpleTranslation}</p>
                  <button
                    onClick={handleTranslateAndSpeak}
                    className="mt-2 px-3 py-1.5 bg-blue-100 hover:bg-blue-200 dark:bg-blue-800 dark:hover:bg-blue-700 text-blue-700 dark:text-blue-100 text-xs font-medium rounded-lg transition-colors"
                  >
                    Retry
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
