'use client';

import React from 'react';
import { Clock, Trash2, ArrowRight } from 'lucide-react';
import { useTranslationStore } from '../store/translationStore';
import { getLanguageByCode } from '../data/languages';
import { motion } from 'framer-motion';

export const SessionHistory: React.FC = () => {
  const { history, clearHistory } = useTranslationStore();
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || history.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full mt-12 mb-8"
    >
      <div className="flex items-center justify-between mb-4 px-2">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-700 dark:text-slate-300">
          <Clock className="w-5 h-5" />
          Session History
        </h3>
        <button 
          onClick={clearHistory}
          className="text-sm flex items-center gap-1 text-slate-500 hover:text-red-500 transition-colors bg-white/50 dark:bg-slate-800/50 px-3 py-1.5 rounded-full shadow-sm"
          aria-label="Clear session history"
        >
          <Trash2 className="w-4 h-4" />
          Clear
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {history.slice(0, 9).map((item) => {
          const sLang = getLanguageByCode(item.sourceLang);
          const tLang = getLanguageByCode(item.targetLang);
          return (
            <div key={item.id} className="glass-panel p-4 hover:shadow-lg transition-shadow cursor-default flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                <span>{sLang?.name || item.sourceLang}</span>
                <ArrowRight className="w-3 h-3" />
                <span>{tLang?.name || item.targetLang}</span>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-sm text-slate-800 dark:text-slate-200 font-medium line-clamp-2" title={item.sourceText}>{item.sourceText}</p>
                <div className="h-px w-full bg-slate-100 dark:bg-slate-800/50 my-1"></div>
                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2" title={item.translatedText}>{item.translatedText}</p>
                {item.romanization && (
                  <p className="text-xs text-slate-400 mt-1">{item.romanization}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </motion.div>
  );
};
