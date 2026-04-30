'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Check, ChevronDown, Pin, PinOff } from 'lucide-react';
import { LANGUAGES, getLanguageByCode, Language } from '../data/languages';
import { useTranslationStore } from '../store/translationStore';
import { motion, AnimatePresence } from 'framer-motion';

interface LanguageSelectorProps {
  value: string;
  onChange: (code: string) => void;
  isSource?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ value, onChange, isSource = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dynamicLanguages, setDynamicLanguages] = useState<Language[]>(LANGUAGES);

  const { pinnedLanguages, recentLanguages, togglePinLanguage } = useTranslationStore();

  useEffect(() => {
    fetch('/api/languages')
      .then(res => res.json())
      .then((data: Record<string, string>) => {
        const backendLangs = Object.entries(data).map(([code, name]) => {
          const existing = LANGUAGES.find(l => l.code === code);
          return {
            code,
            name,
            flag: existing?.flag || '🌐',
            nativeName: existing?.nativeName || '',
            tier: existing?.tier || 3,
            supportsSpeech: existing?.supportsSpeech || false,
            supportsTTS: existing?.supportsTTS || false,
          };
        });
        backendLangs.sort((a, b) => a.name.localeCompare(b.name));
        setDynamicLanguages(backendLangs);
      })
      .catch(err => console.error("Failed to fetch languages", err));
  }, []);

  const selectedLang = value === 'auto' 
    ? { code: 'auto', name: 'Detect Language', flag: '✨', nativeName: '' } as Language
    : dynamicLanguages.find(l => l.code === value) || getLanguageByCode(value) || { code: value, name: value, flag: '🌐', nativeName: '' } as Language;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredLanguages = useMemo(() => {
    const query = search.toLowerCase();
    return dynamicLanguages.filter(l => 
      l.name.toLowerCase().includes(query) || 
      l.nativeName.toLowerCase().includes(query)
    );
  }, [search, dynamicLanguages]);

  const pinnedList = useMemo(() => dynamicLanguages.filter(l => pinnedLanguages.includes(l.code)), [pinnedLanguages, dynamicLanguages]);
  const recentList = useMemo(() => dynamicLanguages.filter(l => recentLanguages.includes(l.code) && !pinnedLanguages.includes(l.code)), [recentLanguages, pinnedLanguages, dynamicLanguages]);

  const handleSelect = (code: string) => {
    onChange(code);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">{selectedLang?.flag}</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {selectedLang?.name}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-64 md:w-80 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden"
          >
            <div className="p-2 border-b border-slate-100 dark:border-slate-800">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search languages..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto p-2 scrollbar-thin">
              {isSource && search === '' && (
                <LanguageOption
                  lang={{ code: 'auto', name: 'Detect Language', flag: '✨', nativeName: '', tier: 1, supportsSpeech: false, supportsTTS: false }}
                  isSelected={value === 'auto'}
                  onSelect={() => handleSelect('auto')}
                />
              )}

              {search === '' && pinnedList.length > 0 && (
                <div className="mb-2">
                  <div className="px-3 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">Pinned</div>
                  {pinnedList.map(l => (
                    <LanguageOption
                      key={l.code}
                      lang={l}
                      isSelected={value === l.code}
                      onSelect={() => handleSelect(l.code)}
                      isPinned={true}
                      onPinToggle={(e) => { e.stopPropagation(); togglePinLanguage(l.code); }}
                    />
                  ))}
                </div>
              )}

              {search === '' && recentList.length > 0 && (
                <div className="mb-2">
                  <div className="px-3 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">Recent</div>
                  {recentList.map(l => (
                    <LanguageOption
                      key={l.code}
                      lang={l}
                      isSelected={value === l.code}
                      onSelect={() => handleSelect(l.code)}
                      isPinned={false}
                      onPinToggle={(e) => { e.stopPropagation(); togglePinLanguage(l.code); }}
                    />
                  ))}
                </div>
              )}

              <div>
                <div className="px-3 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {search === '' ? 'All Languages' : 'Search Results'}
                </div>
                {filteredLanguages.length === 0 ? (
                  <div className="p-3 text-sm text-slate-500 text-center">No languages found</div>
                ) : (
                  filteredLanguages.map(l => (
                    <LanguageOption
                      key={l.code}
                      lang={l}
                      isSelected={value === l.code}
                      onSelect={() => handleSelect(l.code)}
                      isPinned={pinnedLanguages.includes(l.code)}
                      onPinToggle={(e) => { e.stopPropagation(); togglePinLanguage(l.code); }}
                    />
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const LanguageOption = ({ 
  lang, 
  isSelected, 
  onSelect, 
  isPinned, 
  onPinToggle 
}: { 
  lang: Language; 
  isSelected: boolean; 
  onSelect: () => void;
  isPinned?: boolean;
  onPinToggle?: (e: React.MouseEvent) => void;
}) => (
  <button
    onClick={onSelect}
    className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors group ${
      isSelected ? 'bg-blue-50 dark:bg-blue-900/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
    }`}
  >
    <div className="flex items-center gap-3">
      <span className="text-lg">{lang.flag}</span>
      <div className="flex flex-col">
        <span className={`text-sm font-medium ${isSelected ? 'text-blue-700 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}>
          {lang.name}
        </span>
        {lang.nativeName && (
          <span className="text-xs text-slate-500 dark:text-slate-400">{lang.nativeName}</span>
        )}
      </div>
    </div>
    <div className="flex items-center gap-2">
      {onPinToggle && lang.code !== 'auto' && (
        <div 
          onClick={onPinToggle} 
          className={`p-1 rounded-md transition-colors ${isPinned ? 'text-blue-600' : 'text-slate-300 hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-400'}`}
        >
          {isPinned ? <Pin className="w-4 h-4 fill-current" /> : <PinOff className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />}
        </div>
      )}
      {isSelected && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
    </div>
  </button>
);
