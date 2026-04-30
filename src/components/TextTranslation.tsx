'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { ArrowLeftRight, Copy, Volume2, Check } from 'lucide-react';
import { useTranslationStore } from '../store/translationStore';
import { LanguageSelector } from './LanguageSelector';
// import { motion } from 'framer-motion';

export const TextTranslation: React.FC = () => {
  const { 
    sourceLang, targetLang, sourceText, simpleTranslation, formalTranslation, 
    romanization, isTranslating,
    setSourceLang, setTargetLang, setSourceText, setTranslatedText, 
    setIsTranslating, swapLanguages, addToHistory
  } = useTranslationStore();

  const [copiedSource, setCopiedSource] = useState(false);
  const [copiedTarget, setCopiedTarget] = useState(false);
  const [activeTab, setActiveTab] = useState<'simple' | 'formal'>('simple');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const displayedTranslation = activeTab === 'simple' ? simpleTranslation : formalTranslation;

  // Text-to-Speech function
  const speakText = useCallback(
    (text: string) => {
      if (!text || text.startsWith('❌')) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }, []
  );

  // Debounce translation logic
  useEffect(() => {
    if (!sourceText.trim()) {
      setTranslatedText('', '', '', 'Easy', 'Easy');
      return;
    }

    const timer = setTimeout(async () => {
      setIsTranslating(true);
      try {
        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: sourceText, sourceLang, targetLang }),
        });
        
        if (response.ok) {
          const data = await response.json();
          setTranslatedText(
            data.simpleTranslation,
            data.formalTranslation,
            data.romanization,
            data.formality,
            data.difficulty,
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
    }, 800);

    return () => clearTimeout(timer);
  }, [sourceText, sourceLang, targetLang, setTranslatedText, setIsTranslating, addToHistory]);

  const handleCopy = useCallback((text: string, isSource: boolean) => {
    if (!text || text.startsWith('❌')) return;
    navigator.clipboard.writeText(text);
    if (isSource) {
      setCopiedSource(true);
      setTimeout(() => setCopiedSource(false), 2000);
    } else {
      setCopiedTarget(true);
      setTimeout(() => setCopiedTarget(false), 2000);
    }
  }, []);


  // const getDifficultyColor = () => {
  //   switch (difficulty) {
  //     case 'Easy': return 'text-green-600 bg-green-50 dark:bg-green-900/20';
  //     case 'Medium': return 'text-amber-600 bg-amber-50 dark:bg-amber-900/20';
  //     case 'Hard': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
  //     default: return 'text-slate-600';
  //   }
  // };

  // const countWords = (text: string) => text.trim().split(/\s+/).filter(w => w.length > 0).length;

  return (
    <div className="w-full max-w-6xl mx-auto bg-white dark:bg-slate-900 shadow-xl rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col h-[600px]">
      
      {/* STEP 1 - Top language bar (full width) */}
      <div className="flex items-center justify-between p-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        {/* Source language - left */}
        <div className="flex-1">
          <LanguageSelector 
            value={sourceLang} 
            onChange={setSourceLang} 
            isSource={true} 
          />
        </div>

        {/* Swap button - center */}
        <button
          onClick={swapLanguages}
          disabled={sourceLang === 'auto'}
          className="mx-3 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Swap languages"
        >
          <ArrowLeftRight className="w-5 h-5" />
        </button>

        {/* Target language - right */}
        <div className="flex-1 flex justify-end">
          <LanguageSelector 
            value={targetLang} 
            onChange={setTargetLang} 
          />
        </div>
      </div>

      {/* STEP 2 - Two panels side by side */}
      <div className="flex flex-row flex-1 min-h-0">
        {/* LEFT - Source */}
        <div className="flex-1 flex flex-col border-r border-slate-200 dark:border-slate-700">
          <textarea
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            placeholder="Enter text..."
            className="flex-1 p-4 resize-none bg-transparent text-base text-slate-800 dark:text-slate-100 focus:outline-none placeholder:text-slate-400 min-h-[200px]"
            maxLength={5000}
            spellCheck="false"
          />
        </div>

        {/* RIGHT - Translation */}
        <div className="flex-1 flex flex-col bg-slate-50/50 dark:bg-slate-900/50 overflow-y-auto">
          {/* Simple/Formal tabs - only show when both translations exist */}
          {simpleTranslation && formalTranslation && simpleTranslation !== formalTranslation && (
            <div className="flex gap-2 p-2 border-b border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setActiveTab('simple')}
                className={`px-3 py-1 text-sm font-medium rounded transition-colors ${activeTab === 'simple' ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'}`}
              >
                🎯 Simple
              </button>
              <button
                onClick={() => setActiveTab('formal')}
                className={`px-3 py-1 text-sm font-medium rounded transition-colors ${activeTab === 'formal' ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'}`}
              >
                📚 Formal
              </button>
            </div>
          )}

          {/* Translation output */}
          <div className="flex-1 p-4 relative">
            {isTranslating && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-10">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay:'0ms'}}/>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay:'150ms'}}/>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay:'300ms'}}/>
                </div>
              </div>
            )}
            <p className="text-base text-slate-800 dark:text-slate-100 whitespace-pre-wrap break-words min-h-[160px]">
              {displayedTranslation || <span className="text-slate-400">Translation will appear here...</span>}
            </p>
          </div>

          {/* Pronunciation */}
          {romanization && (
            <div className="mx-3 mb-2 p-2 rounded-lg bg-slate-200/50 dark:bg-slate-800/50">
              <p className="text-xs font-semibold text-slate-500 uppercase mb-1">🔤 Pronunciation</p>
              <p className="text-sm text-slate-700 dark:text-slate-300 font-mono">{romanization}</p>
            </div>
          )}


        </div>
      </div>

      {/* STEP 3 - Bottom bar (full width, below both panels) */}
      <div className="border-t border-slate-200 dark:border-slate-700 p-3 flex items-center justify-between bg-white dark:bg-slate-900">
        {/* Left side - source actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleCopy(sourceText, true)}
            disabled={!sourceText}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors disabled:opacity-40"
            title="Copy source text"
          >
            {copiedSource ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={() => speakText(sourceText)}
            disabled={!sourceText}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors disabled:opacity-40"
            title="Listen to source"
          >
            <Volume2 className="w-4 h-4" />
          </button>
          <span className="text-xs text-slate-400">
            {sourceText.length} / 5000
          </span>
        </div>

        {/* Right side - translation actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleCopy(displayedTranslation, false)}
            disabled={!displayedTranslation || displayedTranslation.startsWith('❌')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="Copy translation"
          >
            {copiedTarget ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copiedTarget ? 'Copied!' : 'Copy'}</span>
          </button>
          <button
            onClick={() => speakText(displayedTranslation)}
            disabled={!displayedTranslation || displayedTranslation.startsWith('❌')}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors disabled:opacity-40"
            title="Listen to translation"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
