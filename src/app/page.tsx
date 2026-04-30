'use client';

import React, { useState } from 'react';
import { Header, TranslationMode } from '../components/Header';
import { TextTranslation } from '../components/TextTranslation';
import { SpeechToText } from '../components/SpeechToText';
import { SpeechToSpeech } from '../components/SpeechToSpeech';
import { SessionHistory } from '../components/SessionHistory';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
  const [mode, setMode] = useState<TranslationMode>('text');

  return (
    <main className="flex-1 flex flex-col relative w-full h-full min-h-screen pb-12">
      <Header mode={mode} onModeChange={setMode} />
      
      <div className="flex-1 px-4 w-full flex flex-col gap-8 max-w-6xl mx-auto mt-4">
        <AnimatePresence mode="wait">
          {mode === 'text' && (
            <motion.div
              key="text-mode"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              <TextTranslation />
            </motion.div>
          )}
          
          {mode === 'speech-to-text' && (
            <motion.div
              key="stt-mode"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              <SpeechToText />
            </motion.div>
          )}

          {mode === 'speech-to-speech' && (
            <motion.div
              key="sts-mode"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              <SpeechToSpeech />
            </motion.div>
          )}
        </AnimatePresence>

        <SessionHistory />
      </div>
    </main>
  );
}
