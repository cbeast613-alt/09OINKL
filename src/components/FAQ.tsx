'use client';

import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FAQItemProps {
  question: string;
  answer: string;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-slate-200 dark:border-slate-800 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/30 px-2 transition-colors group"
      >
        <span className="text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {question}
        </span>
        <ChevronDown 
          className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="pb-4 px-2 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const FAQ: React.FC = () => {
  const faqs = [
    {
      question: "Which translation engine powers LinguaFlow?",
      answer: "LinguaFlow is powered by an advanced third-party translation API (Google Gemini) that specializes in nuanced, context-aware translations across dozens of global languages."
    },
    {
      question: "Is my text stored?",
      answer: "No. Your privacy is our priority. Text sent for translation is processed in real-time and is never stored on our servers or used for data mining."
    },
    {
      question: "Who made LinguaFlow?",
      answer: "LinguaFlow is an independent developer project designed to bridge language gaps with a focus on speed, authenticity, and user experience."
    },
    {
      question: "How do I report a bug?",
      answer: "We appreciate your feedback! You can report bugs or suggest features by opening a GitHub issue on our repository or by contacting us directly via email."
    }
  ];

  return (
    <section className="w-full max-w-4xl mx-auto mt-12 mb-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-6">
        <HelpCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Frequently Asked Questions</h2>
      </div>
      <div className="divide-y divide-slate-200 dark:divide-slate-800">
        {faqs.map((faq, index) => (
          <FAQItem key={index} question={faq.question} answer={faq.answer} />
        ))}
      </div>
    </section>
  );
};
