'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Mic, MicOff, Copy, Check, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useSpeech } from '../hooks/useSpeech';
import { useTranslationStore } from '../store/translationStore';
import { LanguageSelector } from './LanguageSelector';
import { motion } from 'framer-motion';

export const SpeechToText: React.FC = () => {
  const { 
    sourceLang, targetLang, setSourceLang, setTargetLang,
    sourceText, setSourceText, simpleTranslation, setTranslatedText,
    romanization, difficulty, addToHistory, submitFeedback
  } = useTranslationStore();

  const [copiedTarget, setCopiedTarget] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<string | null>(null);

  const handleTranscript = useCallback((text: string) => {
    setSourceText(text);
  }, [setSourceText]);

  const { isListening, startListening, stopListening, error } = useSpeech({
    lang: sourceLang === 'auto' ? 'en-US' : sourceLang,
    onTranscript: handleTranscript
  });

  // Effect to translate when listening stops
  useEffect(() => {
    if (!isListening && sourceText.trim() && !simpleTranslation && !isTranslating) {
      const translate = async () => {
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
            const errorData = await response.json().catch(() => ({}));
            const errorMsg = `❌ ${errorData.error || 'Translation failed'}`;
            setTranslatedText(errorMsg, errorMsg, '', 'Hard', 'Hard');
          }
        } catch (error) {
          console.error('Translation failed:', error);
          const errorMsg = '❌ Internet check karo aur dobara try karo 🌐';
          setTranslatedText(errorMsg, errorMsg, '', 'Hard', 'Hard');
        } finally {
          setIsTranslating(false);
        }
      };
      
      const timer = setTimeout(translate, 500);
      return () => clearTimeout(timer);
    }
  }, [isListening, sourceText, sourceLang, targetLang, simpleTranslation, isTranslating, setTranslatedText, addToHistory]);

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

  const handleCopy = useCallback((text: string) => {
    if (!text || text.startsWith('❌')) return;
    navigator.clipboard.writeText(text);
    setCopiedTarget(true);
    setTimeout(() => setCopiedTarget(false), 2000);
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
      
      {/* Languages Header */}
      <div className="flex flex-col md:flex-row items-center border-b border-slate-200 dark:border-slate-700/50">
        <div className="flex-1 p-3 w-full border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-700/50">
          <LanguageSelector value={sourceLang} onChange={setSourceLang} isSource={true} />
        </div>
        <div className="flex-1 p-3 w-full bg-slate-50/30 dark:bg-slate-900/30">
          <LanguageSelector value={targetLang} onChange={setTargetLang} />
        </div>
      </div>

      <div className="flex flex-col items-center justify-center p-8 min-h-[400px] relative">
        {error && (
          <div className="absolute top-4 w-full text-center text-red-500 text-sm bg-red-50 dark:bg-red-900/20 py-2 rounded mx-2">
            {error}
          </div>
        )}
        
        {/* Microphone Button */}
        <div className="relative mb-8">
          {isListening && (
            <motion.div 
              className="absolute inset-0 bg-red-500 rounded-full opacity-30"
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            />
          )}
          <button
            onClick={toggleListening}
            className={`relative z-10 p-6 rounded-full shadow-lg transition-all transform hover:scale-105 focus:outline-none ${
              isListening 
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/50' 
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/50'
            }`}
            aria-label={isListening ? 'Stop listening' : 'Start listening'}
          >
            {isListening ? <MicOff className="w-10 h-10" /> : <Mic className="w-10 h-10" />}
          </button>
        </div>

        <div className="text-center font-medium text-slate-500 dark:text-slate-400 mb-8 h-6">
          {isListening ? '🎤 Listening...' : (isTranslating ? '⚙️ Translating...' : 'Click to start speaking')}
        </div>

        {/* Text Areas */}
        <div className="w-full flex flex-col lg:flex-row gap-6">
          <div className="flex-1 bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 min-h-[150px] shadow-inner border border-slate-100 dark:border-slate-700">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">🎤 You said</h3>
            <p className="text-slate-800 dark:text-slate-200 text-lg">
              {sourceText || <span className="text-slate-400 italic">Your speech will appear here...</span>}
            </p>
          </div>
          
          <div className="flex-1 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl p-4 min-h-[150px] shadow-inner border border-blue-100 dark:border-blue-800/50 relative">
            <h3 className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2">🌍 Simple Translation</h3>
            
            {isTranslating && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-10 rounded-xl">
                <motion.div className="text-center">
                  <div className="flex space-x-2 justify-center mb-3">
                    <motion.div className="w-2 h-2 bg-blue-500 rounded-full" animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} />
                    <motion.div className="w-2 h-2 bg-blue-500 rounded-full" animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} />
                    <motion.div className="w-2 h-2 bg-blue-500 rounded-full" animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} />
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Simplifying...</p>
                </motion.div>
              </div>
            )}
            
            <p className="text-slate-800 dark:text-slate-200 text-lg whitespace-pre-wrap break-words">
              {simpleTranslation || <span className="text-slate-400 italic">Translation will appear here...</span>}
            </p>
          </div>
        </div>

        {/* Pronunciation & Metadata */}
        {simpleTranslation && !simpleTranslation.startsWith('❌') && (
          <div className="w-full mt-6 space-y-3">
            {romanization && (
              <div className="p-3 rounded-lg bg-slate-200/50 dark:bg-slate-800/50">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  🔤 Pronunciation
                </p>
                <p className="text-slate-700 dark:text-slate-300 text-sm font-mono">{romanization}</p>
              </div>
            )}

            {/* Difficulty Indicator */}
            <div className="flex gap-2">
              <div className={`px-3 py-1.5 rounded text-xs font-semibold ${getDifficultyColor()}`}>
                {difficulty === 'Easy' && '🟢 Easy'}
                {difficulty === 'Medium' && '🟡 Medium'}
                {difficulty === 'Hard' && '🔴 Hard'}
              </div>
            </div>

            {/* Feedback Buttons */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => handleFeedback('good')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  feedbackGiven === 'good'
                    ? 'bg-green-500 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-green-500 hover:text-white'
                }`}
                aria-label="Good translation"
              >
                <ThumbsUp className="w-4 h-4" />
                Good
              </button>
              <button
                onClick={() => handleFeedback('too-formal')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  feedbackGiven === 'too-formal'
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-amber-500 hover:text-white'
                }`}
                aria-label="Too formal"
              >
                <ThumbsDown className="w-4 h-4" />
                Too formal
              </button>
              <button
                onClick={() => handleCopy(simpleTranslation)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-blue-500 hover:text-white transition-colors"
                aria-label="Copy translation"
              >
                {copiedTarget ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                Copy
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
