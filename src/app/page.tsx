"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Languages, 
  ArrowRightLeft, 
  Copy, 
  Check, 
  Volume2, 
  Settings2, 
  Sparkles,
  RefreshCw,
  Zap
} from 'lucide-react';

const LANGUAGES = [
  { code: 'auto', name: 'Detect Language' },
  { code: 'hi', name: 'Hindi (Hinglish)' },
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ar', name: 'Arabic' },
  { code: 'ru', name: 'Russian' },
];

export default function Home() {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [romanization, setRomanization] = useState('');
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('hi');
  const [isLoading, setIsLoading] = useState(false);
  const [tone, setTone] = useState<'casual' | 'formal'>('casual');
  const [copied, setCopied] = useState(false);
  const [engine, setEngine] = useState('');

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (inputText.trim().length > 0) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(handleTranslate, 800);
    } else {
      setOutputText('');
      setRomanization('');
    }
  }, [inputText, targetLang, tone]);

  const handleTranslate = async () => {
    if (!inputText.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: inputText, 
          sourceLang, 
          targetLang, 
          tone 
        }),
      });
      const data = await res.json();
      if (data.success) {
        setOutputText(data.translation);
        setRomanization(data.romanization);
        setEngine(data.engine);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const swapLanguages = () => {
    if (sourceLang === 'auto') return;
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setInputText(outputText);
    setOutputText(inputText);
  };

  return (
    <main className="min-h-screen p-4 md:p-8 lg:p-12 relative overflow-hidden">
      <div className="bg-gradient" />
      
      {/* Header */}
      <header className="max-w-6xl mx-auto mb-12 flex items-center justify-between animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/20">
            <Languages className="text-white" size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              LinguaFlow <span className="text-indigo-500">v2</span>
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Next-gen AI Translation</p>
          </div>
        </div>
        
        <div className="hidden md:flex items-center gap-4 bg-white/50 dark:bg-slate-800/50 p-1 rounded-full border border-slate-200 dark:border-slate-700 backdrop-blur">
          <button 
            onClick={() => setTone('casual')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${tone === 'casual' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-300'}`}
          >
            Casual
          </button>
          <button 
            onClick={() => setTone('formal')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${tone === 'formal' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-300'}`}
          >
            Formal
          </button>
        </div>
      </header>

      {/* Main Translator Section */}
      <section className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-6 items-start animate-fade-in" style={{ animationDelay: '0.1s' }}>
        
        {/* Input Card */}
        <div className="glass rounded-3xl p-6 relative group transition-all hover:shadow-2xl hover:shadow-indigo-500/5">
          <div className="flex items-center justify-between mb-4">
            <select 
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value)}
              className="bg-transparent font-medium text-slate-600 dark:text-slate-300 cursor-pointer hover:text-indigo-500 transition-colors border-none"
            >
              {LANGUAGES.map(l => (
                <option key={l.code} value={l.code} className="dark:bg-slate-900">{l.name}</option>
              ))}
            </select>
            <span className="text-xs text-slate-400 font-mono uppercase tracking-widest">{inputText.length} / 5000</span>
          </div>
          
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type something to translate..."
            className="w-full h-64 bg-transparent border-none resize-none text-xl md:text-2xl text-slate-900 dark:text-white placeholder-slate-400 font-light focus:ring-0 leading-relaxed"
          />
          
          {inputText && (
            <button 
              onClick={() => setInputText('')}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-indigo-500 transition-all opacity-0 group-hover:opacity-100"
            >
              <RefreshCw size={18} />
            </button>
          )}
        </div>

        {/* Swap Button (Desktop) */}
        <div className="flex lg:flex-col items-center justify-center py-2 lg:py-12">
          <button 
            onClick={swapLanguages}
            disabled={sourceLang === 'auto'}
            className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all text-slate-600 dark:text-slate-300 hover:text-indigo-500 border border-slate-200 dark:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowRightLeft className="rotate-90 lg:rotate-0" />
          </button>
        </div>

        {/* Output Card */}
        <div className="glass rounded-3xl p-6 relative min-h-[300px] flex flex-col transition-all border-indigo-500/10 hover:border-indigo-500/30">
          <div className="flex items-center justify-between mb-4">
            <select 
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="bg-transparent font-medium text-indigo-500 cursor-pointer border-none"
            >
              {LANGUAGES.filter(l => l.code !== 'auto').map(l => (
                <option key={l.code} value={l.code} className="dark:bg-slate-900">{l.name}</option>
              ))}
            </select>
            
            {isLoading ? (
              <div className="flex items-center gap-2 text-indigo-500 text-xs font-bold uppercase tracking-widest animate-pulse">
                <Sparkles size={14} /> Processing
              </div>
            ) : engine && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-500/10 text-indigo-500 rounded-full text-[10px] font-bold uppercase tracking-tighter">
                <Zap size={10} fill="currentColor" /> {engine} AI
              </div>
            )}
          </div>

          <div className={`flex-grow text-xl md:text-2xl font-medium leading-relaxed ${isLoading ? 'text-slate-300 dark:text-slate-600' : 'text-slate-900 dark:text-white'}`}>
            {outputText || (isLoading ? 'Translating magic...' : 'Translation will appear here')}
          </div>

          {romanization && (
            <div className="mt-6 p-4 bg-slate-500/5 rounded-2xl border border-slate-500/10 animate-fade-in">
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Pronunciation</div>
              <div className="text-slate-600 dark:text-slate-400 italic text-lg leading-relaxed">{romanization}</div>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="flex gap-2">
              <button className="p-3 text-slate-400 hover:text-indigo-500 hover:bg-indigo-500/5 rounded-xl transition-all">
                <Volume2 size={20} />
              </button>
              <button className="p-3 text-slate-400 hover:text-indigo-500 hover:bg-indigo-500/5 rounded-xl transition-all">
                <Settings2 size={20} />
              </button>
            </div>
            
            <button 
              onClick={copyToClipboard}
              disabled={!outputText}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/20'} disabled:opacity-50`}
            >
              {copied ? (
                <>
                  <Check size={18} /> Copied!
                </>
              ) : (
                <>
                  <Copy size={18} /> Copy
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Footer Info */}
      <footer className="max-w-6xl mx-auto mt-16 text-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <div className="inline-flex items-center gap-6 px-8 py-4 bg-white/50 dark:bg-slate-800/50 rounded-3xl border border-slate-200 dark:border-slate-700 backdrop-blur text-sm text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Gemini Flash 2.0 Active
          </div>
          <div className="w-px h-4 bg-slate-300 dark:bg-slate-700" />
          <div>High-precision translation</div>
          <div className="w-px h-4 bg-slate-300 dark:bg-slate-700" />
          <div>Zero Latency Fallback</div>
        </div>
      </footer>

      <style jsx global>{`
        .bg-gradient {
          background: 
            radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.15) 0px, transparent 50%),
            radial-gradient(at 100% 0%, rgba(168, 85, 247, 0.15) 0px, transparent 50%),
            radial-gradient(at 100% 100%, rgba(244, 114, 182, 0.15) 0px, transparent 50%),
            radial-gradient(at 0% 100%, rgba(99, 102, 241, 0.15) 0px, transparent 50%);
        }
      `}</style>
    </main>
  );
}
