import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TranslationHistoryItem {
  id: string;
  sourceText: string;
  translatedText: string;
  simpleTranslation?: string;
  formalTranslation?: string;
  sourceLang: string;
  targetLang: string;
  romanization?: string;
  formality?: 'Easy' | 'Medium' | 'Hard';
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  timestamp: number;
}

interface TranslationState {
  sourceLang: string;
  targetLang: string;
  sourceText: string;
  translatedText: string;
  simpleTranslation: string;
  formalTranslation: string;
  simpleMeaning: string;
  memoryHook: string;
  romanization: string;
  formality: 'Easy' | 'Medium' | 'Hard';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  isTranslating: boolean;
  history: TranslationHistoryItem[];
  pinnedLanguages: string[];
  recentLanguages: string[];
  feedbackText: string;
  
  // Actions
  setSourceLang: (lang: string) => void;
  setTargetLang: (lang: string) => void;
  swapLanguages: () => void;
  setSourceText: (text: string) => void;
  setTranslatedText: (
    simpleText: string, 
    formalText: string, 
    romanization?: string,
    formality?: 'Easy' | 'Medium' | 'Hard',
    difficulty?: 'Easy' | 'Medium' | 'Hard',
    simpleMeaning?: string,
    memoryHook?: string,
  ) => void;
  setIsTranslating: (isTranslating: boolean) => void;
  addToHistory: (item: Omit<TranslationHistoryItem, 'id' | 'timestamp'>) => void;
  clearHistory: () => void;
  togglePinLanguage: (langCode: string) => void;
  addRecentLanguage: (langCode: string) => void;
  clearSourceText: () => void;
  submitFeedback: (feedback: 'good' | 'too-formal' | 'try-simpler') => void;
}

export const useTranslationStore = create<TranslationState>()(
  persist(
    (set) => ({
      sourceLang: 'auto',
      targetLang: 'es',
      sourceText: '',
      translatedText: '',
      simpleTranslation: '',
      formalTranslation: '',
      simpleMeaning: '',
      memoryHook: '',
      romanization: '',
      formality: 'Easy',
      difficulty: 'Easy',
      isTranslating: false,
      history: [],
      pinnedLanguages: ['en', 'es', 'fr'],
      recentLanguages: [],
      feedbackText: '',

      setSourceLang: (lang) => set((state) => {
        // Inline addRecentLanguage logic — avoids calling set() inside set()
        if (lang === 'auto') return { sourceLang: lang };
        const filtered = state.recentLanguages.filter((c) => c !== lang);
        return {
          sourceLang: lang,
          recentLanguages: [lang, ...filtered].slice(0, 5),
        };
      }),
      setTargetLang: (lang) => set((state) => {
        const filtered = state.recentLanguages.filter((c) => c !== lang);
        return {
          targetLang: lang,
          recentLanguages: [lang, ...filtered].slice(0, 5),
        };
      }),
      swapLanguages: () => set((state) => {
        if (state.sourceLang === 'auto') return state;
        // Use simpleTranslation as new source; clear all output so a fresh
        // translation is triggered by the useEffect in TextTranslation.
        return {
          sourceLang: state.targetLang,
          targetLang: state.sourceLang,
          sourceText: state.simpleTranslation || state.translatedText,
          translatedText: '',
          simpleTranslation: '',
          formalTranslation: '',
          simpleMeaning: '',
          memoryHook: '',
          romanization: '',
          formality: 'Easy',
          difficulty: 'Easy',
        };
      }),
      setSourceText: (text) => set({ sourceText: text }),
      setTranslatedText: (
        simpleText,
        formalText,
        romanization = '',
        formality = 'Easy',
        difficulty = 'Easy',
        simpleMeaning = '',
        memoryHook = '',
      ) =>
        set({
          translatedText: simpleText,
          simpleTranslation: simpleText,
          formalTranslation: formalText,
          simpleMeaning,
          memoryHook,
          romanization,
          formality,
          difficulty,
        }),
      setIsTranslating: (isTranslating) => set({ isTranslating }),

      addToHistory: (item) => set((state) => {
        const newItem: TranslationHistoryItem = {
          ...item,
          id: Math.random().toString(36).substr(2, 9),
          timestamp: Date.now(),
        };
        const newHistory = [newItem, ...state.history].slice(0, 50);
        return { history: newHistory };
      }),
      clearHistory: () => set({ history: [] }),

      togglePinLanguage: (langCode) =>
        set((state) => {
          if (state.pinnedLanguages.includes(langCode)) {
            return {
              pinnedLanguages: state.pinnedLanguages.filter((c) => c !== langCode),
            };
          }
          return { pinnedLanguages: [...state.pinnedLanguages, langCode] };
        }),

      addRecentLanguage: (langCode) =>
        set((state) => {
          if (langCode === 'auto') return state;
          const filtered = state.recentLanguages.filter((c) => c !== langCode);
          return { recentLanguages: [langCode, ...filtered].slice(0, 5) };
        }),

      clearSourceText: () =>
        set({
          sourceText: '',
          translatedText: '',
          simpleTranslation: '',
          formalTranslation: '',
          simpleMeaning: '',
          memoryHook: '',
          romanization: '',
          formality: 'Easy',
          difficulty: 'Easy',
        }),

      submitFeedback: (feedback) =>
        set(() => {
          const timestamp = new Date().toLocaleTimeString();
          return {
            feedbackText: `[${timestamp}] ${feedback}`,
          };
        }),
    }),
    {
      name: 'linguaflow-storage',
      partialize: (state) => ({
        pinnedLanguages: state.pinnedLanguages,
        recentLanguages: state.recentLanguages,
      }),
    }
  )
);
