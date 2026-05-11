import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy - LinguaFlow',
  description: 'Privacy Policy for LinguaFlow translation platform.',
};

export default function PrivacyPolicy() {
  return (
    <main className="flex-1 flex flex-col relative w-full h-full min-h-screen pb-12 pt-8">
      <div className="flex-1 px-4 w-full flex flex-col gap-6 max-w-4xl mx-auto">
        <Link href="/" className="text-brand-600 dark:text-brand-400 hover:underline mb-4 inline-block w-fit">
          &larr; Back to Home
        </Link>
        
        <div className="glass-panel p-8">
          <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-3">1. Data Collection</h2>
            <p className="text-foreground/80 mb-4">
              At LinguaFlow, we believe in a privacy-first approach. We do not track, collect, or store any personal data or usage metrics.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-3">2. Voice Data Handling</h2>
            <p className="text-foreground/80 mb-4">
              When using our voice-to-text or voice-to-voice translation features, your audio is processed directly in your browser using the Web Speech API. We do not transmit or store your voice recordings on our servers.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-3">3. Translation APIs</h2>
            <p className="text-foreground/80 mb-4">
              LinguaFlow utilizes third-party translation services to provide accurate and fast translations. The text you enter is sent securely to these APIs exclusively for the purpose of translation.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-3">4. Data Storage</h2>
            <p className="text-foreground/80 mb-4">
              No translation data, source text, or result text is stored on our servers. The only data stored locally in your browser includes recent language selections (if applicable) and application preferences, which remain entirely on your device.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
