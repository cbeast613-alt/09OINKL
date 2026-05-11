'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Mic, MicOff, Copy, Check, ThumbsUp, ThumbsDown, ArrowLeftRight, Loader2, Minus, Plus } from 'lucide-react';
import { useSpeech } from '../hooks/useSpeech';
import { useTranslationStore } from '../store/translationStore';
import { LanguageSelector } from './LanguageSelector';
import { motion } from 'framer-motion';
import { getTextSizeClass } from '../utils/text';

export const SpeechToText: React.FC = () => {
  const { 
    sourceLang, targetLang, setSourceLang, setTargetLang,
    sourceText, setSourceText, simpleTranslation, formalTranslation, setTranslatedText,
    romanization, difficulty, addToHistory, submitFeedback, swapLanguages,
    textSizeScale, setTextSizeScale
  } = useTranslationStore();

  const [copiedTarget, setCopiedTarget] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleTranscript = useCallback((text: string) => {
    setSourceText(text);
  }, [setSourceText]);

  const { isListening, startListening, stopListening, error } = useSpeech({
    lang: sourceLang === 'auto' ? 'en-US' : sourceLang,
    onTranscript: handleTranscript
  });

  const handleTranslate = useCallback(async () => {
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
        setFeedbackGiven(null);
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
  }, [sourceText, sourceLang, targetLang, setTranslatedText, addToHistory, isTranslating]);

  // Effect to translate when listening stops
  useEffect(() => {
    if (!isListening && sourceText.trim() && !simpleTranslation && !isTranslating) {
      const timer = setTimeout(handleTranslate, 500);
      return () => clearTimeout(timer);
    }
  }, [isListening, sourceText, simpleTranslation, isTranslating, handleTranslate]);

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      setSourceText('');
      setTranslatedText('', '', '', 'Easy', 'Easy');
      setFeedbackGiven(null);
      startListening();
    }
  };

  const [copyError, setCopyError] = useState<string | null>(null);

  const handleCopy = useCallback(async (text: string) => {
    if (!text || text.startsWith('❌')) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedTarget(true);
      setTimeout(() => setCopiedTarget(false), 1500);
    } catch (err) {
      setCopyError('Copy failed — please copy manually');
      setTimeout(() => setCopyError(null), 3000);
    }
  }, []);

  const handleFeedback = (type: 'good' | 'too-formal' | 'try-simpler') => {
    submitFeedback(type);
    setFeedbackGiven(type);
    setTimeout(() => setFeedbackGiven(null), 3000);
  };

  const getDifficultyColor = () => {
    switch (difficulty) {
      case 'Easy':
        return 'text-green-600 dark:text-green-400';
      case 'Medium':
        return 'text-amber-600 dark:text-amber-400';
      case 'Hard':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-slate-600 dark:text-slate-400';
    }
  };

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

      <div className="flex flex-col items-center justify-center p-4 sm:p-8 min-h-[350px] relative">
        {error && (
          <div className="absolute top-4 left-4 right-4 text-center text-red-500 text-sm bg-red-50 dark:bg-red-900/20 py-2 rounded">
            {error}
          </div>
        )}
        
        {/* Microphone Button */}
        <div className="relative mb-6">
          {isListening && (
            <motion.div 
              className="absolute inset-0 bg-red-500 rounded-full opacity-30"
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            />
          )}
          <button
            onClick={toggleListening}
            className={`relative z-10 p-5 sm:p-6 rounded-full shadow-lg transition-all transform hover:scale-105 focus:outline-none ${
              isListening 
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/50' 
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/50'
            }`}
            aria-label={isListening ? 'Stop listening' : 'Start listening'}
          >
            {isListening ? <MicOff className="w-8 h-8 sm:w-10 sm:h-10" /> : <Mic className="w-8 h-8 sm:w-10 sm:h-10" />}
          </button>
        </div>

        <div className="text-center font-medium text-slate-500 dark:text-slate-400 mb-6 h-6 text-sm">
          {!isMounted ? '...' : (isListening ? '🎤 Listening...' : (isTranslating ? '⚙️ Translating...' : 'Click to start speaking'))}
        </div>

        {/* Text Areas - Always side by side */}
        <div className="w-full flex flex-row gap-2 sm:gap-4" style={{ minHeight: '180px' }}>
          <div className="flex-1 bg-white/50 dark:bg-slate-800/50 rounded-xl p-3 shadow-inner border border-slate-100 dark:border-slate-700 overflow-y-auto min-w-0">
            <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">🎤 You said</h3>
            <p className={`${getTextSizeClass(textSizeScale)} text-slate-800 dark:text-slate-200 transition-all`}>
              {sourceText || <span className="text-slate-400 italic">Your speech will appear here...</span>}
            </p>
          </div>
          
          <div className="flex-1 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl p-3 shadow-inner border border-blue-100 dark:border-blue-800/50 relative overflow-y-auto min-w-0">
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">🌍 Translation</h3>
              <div className="flex items-center bg-blue-100/50 dark:bg-blue-800/30 rounded-lg p-0.5">
                <button onClick={() => setTextSizeScale(Math.max(0, textSizeScale - 1))} className="p-1 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-white dark:hover:bg-slate-800 rounded transition-colors disabled:opacity-50" disabled={textSizeScale <= 0} title="Decrease text size"><Minus className="w-3.5 h-3.5" /></button>
                <div className="w-px h-3 bg-blue-200 dark:bg-blue-700 mx-0.5"></div>
                <button onClick={() => setTextSizeScale(Math.min(4, textSizeScale + 1))} className="p-1 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-white dark:hover:bg-slate-800 rounded transition-colors disabled:opacity-50" disabled={textSizeScale >= 4} title="Increase text size"><Plus className="w-3.5 h-3.5" /></button>
              </div>
            </div>
            
            {isTranslating && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-10 rounded-xl gap-2">
                <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Translating...</span>
              </div>
            )}
            
            <p className={`${getTextSizeClass(textSizeScale)} whitespace-pre-wrap break-words transition-all ${formalTranslation?.startsWith('❌') || simpleTranslation?.startsWith('❌') ? 'text-red-500 font-medium' : 'text-slate-800 dark:text-slate-200'}`}>
              {(formalTranslation || simpleTranslation) || <span className="text-slate-400 italic">Translation will appear...</span>}
            </p>
            {(formalTranslation?.startsWith('❌') || simpleTranslation?.startsWith('❌')) && (
              <button
                onClick={handleTranslate}
                className="mt-3 px-4 py-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-800 dark:hover:bg-blue-700 text-blue-700 dark:text-blue-100 text-sm font-medium rounded-lg transition-colors"
              >
                Retry
              </button>
            )}
          </div>
        </div>

        {/* Pronunciation & Metadata */}
        {simpleTranslation && !simpleTranslation.startsWith('❌') && (
          <div className="w-full mt-4 space-y-3">
            {romanization && (
              <div className="p-2 sm:p-3 rounded-lg bg-slate-200/50 dark:bg-slate-800/50">
                <p className="text-[10px] sm:text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  🔤 Pronunciation
                </p>
                <p className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-mono">{romanization}</p>
              </div>
            )}

            {/* Difficulty Indicator */}
            <div className="flex gap-2">
              <div className={`px-2 sm:px-3 py-1 rounded text-xs font-semibold ${getDifficultyColor()}`}>
                {difficulty === 'Easy' && '🟢 Easy'}
                {difficulty === 'Medium' && '🟡 Medium'}
                {difficulty === 'Hard' && '🔴 Hard'}
              </div>
            </div>

            {/* Feedback Buttons */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => handleFeedback('good')}
                className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded text-xs sm:text-sm font-medium transition-colors ${
                  feedbackGiven === 'good'
                    ? 'bg-green-500 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-green-500 hover:text-white'
                }`}
                aria-label="Good translation"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                Good
              </button>
              <button
                onClick={() => handleFeedback('too-formal')}
                className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded text-xs sm:text-sm font-medium transition-colors ${
                  feedbackGiven === 'too-formal'
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-amber-500 hover:text-white'
                }`}
                aria-label="Too formal"
              >
                <ThumbsDown className="w-3.5 h-3.5" />
                Too formal
              </button>
              <div className="relative">
                <button
                  onClick={() => handleCopy(formalTranslation || simpleTranslation)}
                  className="flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded text-xs sm:text-sm font-medium bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-blue-500 hover:text-white transition-colors"
                  aria-label="Copy translation"
                >
                  {copiedTarget ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedTarget ? 'Copied ✓' : 'Copy'}
                </button>
                {copyError && (
                  <div className="absolute bottom-full left-0 mb-2 bg-red-500 text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-30 animate-bounce">
                    {copyError}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
