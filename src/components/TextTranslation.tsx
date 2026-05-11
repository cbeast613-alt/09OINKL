'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { ArrowLeftRight, Copy, Volume2, Check, X, Loader2, Info, Minus, Plus } from 'lucide-react';
import { useTranslationStore } from '../store/translationStore';
import { LanguageSelector } from './LanguageSelector';
import { useSpeech } from '../hooks/useSpeech';
import { diffWords } from '../utils/diff';
import { getTextSizeClass } from '../utils/text';

export const TextTranslation: React.FC = () => {
  const { 
    sourceLang, detectedSourceLang, targetLang, sourceText, simpleTranslation, formalTranslation, 
    romanization, isTranslating,
    setSourceLang, setDetectedSourceLang, setTargetLang, setSourceText, setTranslatedText, 
    setIsTranslating, swapLanguages, addToHistory,
    textSizeScale, setTextSizeScale
  } = useTranslationStore();

  const [copiedSource, setCopiedSource] = useState(false);
  const [copiedTarget, setCopiedTarget] = useState(false);
  const [activeTab, setActiveTab] = useState<'simple' | 'formal'>('simple');
  const [isMounted, setIsMounted] = useState(false);
  const [speakingTarget, setSpeakingTarget] = useState<'source' | 'translation' | null>(null);

  const { speak, stopSpeaking, isSpeaking, spokenWordIndex } = useSpeech({ lang: detectedSourceLang || 'en' });

  useEffect(() => {
    if (!isSpeaking) setSpeakingTarget(null);
  }, [isSpeaking]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const displayedTranslation = activeTab === 'formal' ? (formalTranslation || simpleTranslation) : (simpleTranslation || formalTranslation);

  const handleTranslate = useCallback(async () => {
    if (!sourceText.trim() || isTranslating || sourceText.length > 500) return;
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
        
        if (data.sourceLang) {
          setDetectedSourceLang(data.sourceLang);
        }
        
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
  }, [sourceText, sourceLang, targetLang, setTranslatedText, setIsTranslating, addToHistory, setDetectedSourceLang, isTranslating]);

  // Debounce translation logic
  useEffect(() => {
    if (!sourceText.trim()) {
      setTranslatedText('', '', '', 'Easy', 'Easy');
      return;
    }

    const timer = setTimeout(() => {
      handleTranslate();
    }, 800);

    return () => clearTimeout(timer);
  }, [sourceText, sourceLang, targetLang, setTranslatedText, setIsTranslating, addToHistory]);

  const [copyError, setCopyFailed] = useState<string | null>(null);

  const handleCopy = useCallback(async (text: string, isSource: boolean) => {
    if (!text || text.startsWith('❌')) return;
    try {
      await navigator.clipboard.writeText(text);
      if (isSource) {
        setCopiedSource(true);
        setTimeout(() => setCopiedSource(false), 1500);
      } else {
        setCopiedTarget(true);
        setTimeout(() => setCopiedTarget(false), 1500);
      }
    } catch (err) {
      console.error('Failed to copy: ', err);
      setCopyFailed('Copy failed — please copy manually');
      setTimeout(() => setCopyFailed(null), 3000);
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleTranslate();
      }
      // Ctrl/Cmd + Shift + C
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handleCopy(displayedTranslation, false);
      }
      // Ctrl/Cmd + Shift + L
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        swapLanguages();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTranslate, handleCopy, displayedTranslation, swapLanguages]);

  const handleClearText = useCallback(() => {
    setSourceText('');
    setTranslatedText('', '', '', 'Easy', 'Easy');
  }, [setSourceText, setTranslatedText]);

  return (
    <div className="w-full max-w-6xl mx-auto bg-white dark:bg-slate-900 shadow-xl rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col">
      
      {/* STEP 1 - Top language bar (full width) */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center px-2 py-2 sm:p-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 gap-1 sm:gap-2">
        {/* Source language - left */}
        <div className="min-w-0">
          <LanguageSelector 
            value={sourceLang} 
            onChange={setSourceLang} 
            isSource={true} 
            align="left"
            label="Translate from"
            ariaLabel="Select source language"
          />
        </div>

        {/* Swap button - center */}
        <button
          onClick={swapLanguages}
          disabled={sourceLang === 'auto'}
          className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed justify-self-center flex-shrink-0 mt-5"
          aria-label="Swap languages"
        >
          <ArrowLeftRight className="w-5 h-5" />
        </button>

        {/* Target language - right */}
        <div className="min-w-0">
          <LanguageSelector 
            value={targetLang} 
            onChange={setTargetLang} 
            align="right"
            label="Translate to"
            ariaLabel="Select target language"
          />
        </div>
      </div>

      {/* STEP 2 - Two panels side by side - ALWAYS row */}
      <div className="flex flex-row flex-1" style={{minHeight: '280px'}}>
        {/* LEFT - Source */}
        <div className="flex-1 flex flex-col border-r border-slate-200 dark:border-slate-700 min-w-0 relative bg-white dark:bg-slate-900 p-3 sm:p-4">
          <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">Source text</label>
          <textarea
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            placeholder="Enter text to translate..."
            className={`w-full flex-1 resize-none bg-transparent ${getTextSizeClass(textSizeScale)} text-slate-800 dark:text-slate-100 focus:outline-none placeholder:text-slate-400`}
            maxLength={500}
            spellCheck="false"
          />
          <div className="flex items-center justify-between mt-2">
            <span className={`text-[10px] sm:text-xs transition-colors ${sourceText.length > 490 ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
              {sourceText.length} / 500
            </span>
            {/* Clear button */}
            {sourceText && (
              <button
                onClick={handleClearText}
                className="p-1.5 rounded-full bg-slate-200/80 dark:bg-slate-700/80 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-400 transition-colors"
                aria-label="Clear text"
                title="Clear text"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* RIGHT - Translation */}
        <div className="flex-1 flex flex-col bg-slate-50/80 dark:bg-slate-800/50 overflow-y-auto min-w-0 relative p-3 sm:p-4">
          <div className="flex justify-between items-center mb-2">
            <label className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">Translation</label>
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-200/50 dark:bg-slate-700/50 rounded-lg p-0.5">
                <button
                  onClick={() => setTextSizeScale(Math.max(0, textSizeScale - 1))}
                  className="p-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-white dark:hover:bg-slate-800 rounded transition-colors disabled:opacity-50"
                  disabled={textSizeScale <= 0}
                  title="Decrease text size"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <div className="w-px h-3 bg-slate-300 dark:bg-slate-600 mx-0.5"></div>
                <button
                  onClick={() => setTextSizeScale(Math.min(4, textSizeScale + 1))}
                  className="p-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-white dark:hover:bg-slate-800 rounded transition-colors disabled:opacity-50"
                  disabled={textSizeScale >= 4}
                  title="Increase text size"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              {formalTranslation && simpleTranslation && formalTranslation !== simpleTranslation && !displayedTranslation?.startsWith('❌') && (
              <div className="flex bg-slate-200/50 dark:bg-slate-700/50 rounded-lg p-0.5">
                <button
                  onClick={() => setActiveTab('simple')}
                  className={`px-2.5 py-1 text-[10px] sm:text-xs font-medium rounded-md transition-colors ${activeTab === 'simple' ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  Simple
                </button>
                <button
                  onClick={() => setActiveTab('formal')}
                  className={`px-2.5 py-1 text-[10px] sm:text-xs font-medium rounded-md transition-colors ${activeTab === 'formal' ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  Formal
                </button>
              </div>
            )}
            </div>
          </div>
          
          {/* Translation output */}
          <div className="flex-1 relative">
            {isTranslating && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-sm z-10 gap-2 rounded-lg">
                <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Translating...</span>
              </div>
            )}
            {displayedTranslation?.startsWith('❌') ? (
              <p className={`${getTextSizeClass(textSizeScale)} whitespace-pre-wrap break-words text-red-500 font-medium`}>
                {displayedTranslation}
              </p>
            ) : activeTab === 'formal' && formalTranslation && simpleTranslation && formalTranslation !== simpleTranslation ? (
              <div className={`${getTextSizeClass(textSizeScale)} whitespace-pre-wrap break-words text-slate-800 dark:text-slate-100 leading-relaxed`}>
                {diffWords(simpleTranslation, formalTranslation).map((part, i) => (
                  <span
                    key={i}
                    className={
                      part.added ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded px-0.5' :
                      part.removed ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 line-through rounded px-0.5' :
                      ''
                    }
                  >{part.value}</span>
                ))}
              </div>
            ) : (
              <p className={`${getTextSizeClass(textSizeScale)} whitespace-pre-wrap break-words text-slate-800 dark:text-slate-100`}>
                {!displayedTranslation ? (
                  <span className="text-slate-400">Translation will appear here...</span>
                ) : speakingTarget === 'translation' && spokenWordIndex ? (
                  <>
                    {displayedTranslation.substring(0, spokenWordIndex.start)}
                    <span className="bg-yellow-200 dark:bg-yellow-800/60 text-slate-900 dark:text-slate-50 rounded px-0.5">
                      {displayedTranslation.substring(spokenWordIndex.start, spokenWordIndex.start + spokenWordIndex.length)}
                    </span>
                    {displayedTranslation.substring(spokenWordIndex.start + spokenWordIndex.length)}
                  </>
                ) : (
                  displayedTranslation
                )}
              </p>
            )}
            {displayedTranslation?.startsWith('❌') && (
              <button
                onClick={handleTranslate}
                className="mt-3 px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-lg transition-colors"
              >
                Retry
              </button>
            )}
          </div>

          {/* Pronunciation */}
          {romanization && (
            <div className="mt-2 p-2 rounded-lg bg-slate-200/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
              <p className="text-xs font-semibold text-slate-500 uppercase mb-1">🔤 Pronunciation</p>
              <p className="text-sm text-slate-700 dark:text-slate-300 font-mono">{romanization}</p>
            </div>
          )}
        </div>
      </div>

      {/* STEP 3 - Bottom bar (full width, below both panels) */}
      <div className="border-t border-slate-200 dark:border-slate-700 px-2 py-2 sm:p-3 flex items-center justify-between bg-white dark:bg-slate-900">
        {/* Left side - source actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => handleCopy(sourceText, true)}
            disabled={!sourceText}
            className="flex items-center gap-1 p-1.5 sm:p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors disabled:opacity-40"
            title="Copy source text"
          >
            {copiedSource ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            <span className="hidden sm:inline text-xs font-medium">{copiedSource ? 'Copied ✓' : 'Copy'}</span>
          </button>
          <button
            onClick={() => {
              if (isSpeaking) {
                stopSpeaking();
              } else {
                setSpeakingTarget('source');
                speak(sourceText, detectedSourceLang);
              }
            }}
            disabled={!sourceText}
            className={`p-1.5 sm:p-2 rounded-lg transition-colors disabled:opacity-40 ${isSpeaking && speakingTarget === 'source' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500'}`}
            title={isSpeaking && speakingTarget === 'source' ? "Stop listening" : "Listen to source"}
          >
            <Volume2 className="w-4 h-4" />
          </button>
          {copyError && (
            <div className="absolute bottom-full mb-2 bg-red-500 text-white text-[10px] px-2 py-1 rounded shadow-lg animate-bounce">
              {copyError}
            </div>
          )}
          <div className="relative group ml-1 sm:ml-2">
            <Info className="w-4 h-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-help transition-colors" />
            <div className="absolute bottom-full left-0 mb-2 w-56 p-3 bg-slate-800 dark:bg-slate-700 text-white text-[11px] rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
              <p className="font-semibold mb-1.5 text-slate-200">Keyboard Shortcuts</p>
              <ul className="space-y-1 text-slate-300">
                <li><span className="inline-block w-8 font-mono text-slate-400">⌘+↵</span> Force translation</li>
                <li><span className="inline-block w-8 font-mono text-slate-400">⌘⇧C</span> Copy translation</li>
                <li><span className="inline-block w-8 font-mono text-slate-400">⌘⇧L</span> Swap languages</li>
              </ul>
              <p className="mt-1.5 text-[9px] text-slate-400 italic">Use Ctrl on Windows/Linux</p>
            </div>
          </div>
        </div>

        {/* Right side - translation actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => handleCopy(displayedTranslation, false)}
            disabled={!displayedTranslation || displayedTranslation.startsWith('❌')}
            className="flex items-center gap-1 px-2 py-1.5 sm:px-3 rounded-lg text-xs sm:text-sm font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="Copy translation"
          >
            {copiedTarget ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedTarget ? 'Copied ✓' : 'Copy'}</span>
          </button>
          <button
            onClick={() => {
              if (isSpeaking) {
                stopSpeaking();
              } else {
                setSpeakingTarget('translation');
                speak(displayedTranslation, targetLang);
              }
            }}
            disabled={!displayedTranslation || displayedTranslation.startsWith('❌')}
            className={`flex items-center gap-1 px-2 py-1.5 sm:px-3 rounded-lg text-xs sm:text-sm font-medium transition-colors disabled:opacity-40 ${isSpeaking && speakingTarget === 'translation' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
            title={isSpeaking && speakingTarget === 'translation' ? "Stop listening" : "Listen to translation"}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isSpeaking && speakingTarget === 'translation' ? 'Stop' : 'Listen'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
