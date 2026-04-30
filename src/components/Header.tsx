'use client';

import React from 'react';
import { Type, Mic, Languages } from 'lucide-react';
import { motion } from 'framer-motion';

export type TranslationMode = 'text' | 'speech-to-text' | 'speech-to-speech';

interface HeaderProps {
  mode: TranslationMode;
  onModeChange: (mode: TranslationMode) => void;
}

export const Header: React.FC<HeaderProps> = ({ mode, onModeChange }) => {
  const modes = [
    { id: 'text' as const, label: 'Text', icon: Type },
    { id: 'speech-to-text' as const, label: 'Voice to Text', icon: Mic },
    { id: 'speech-to-speech' as const, label: 'Voice to Voice', icon: Languages },
  ];

  return (
    <header className="w-full glass-panel sticky top-0 z-50 mb-8 p-4">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
            LF
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
            LinguaFlow
          </h1>
        </div>

        <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-lg">
          {modes.map((m) => {
            const Icon = m.icon;
            const isActive = mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => onModeChange(m.id)}
                className={`relative px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 rounded-md ${
                  isActive ? 'text-blue-700 dark:text-blue-300' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-mode"
                    className="absolute inset-0 bg-white dark:bg-slate-700 rounded-md shadow-sm"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span className="inline text-[10px] sm:text-sm">{m.label}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
