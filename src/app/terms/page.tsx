import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service - LinguaFlow',
  description: 'Terms of Service for LinguaFlow translation platform.',
};

export default function TermsOfService() {
  return (
    <main className="flex-1 flex flex-col relative w-full h-full min-h-screen pb-12 pt-8">
      <div className="flex-1 px-4 w-full flex flex-col gap-6 max-w-4xl mx-auto">
        <Link href="/" className="text-brand-600 dark:text-brand-400 hover:underline mb-4 inline-block w-fit">
          &larr; Back to Home
        </Link>
        
        <div className="glass-panel p-8">
          <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-3">1. Acceptable Use</h2>
            <p className="text-foreground/80 mb-4">
              LinguaFlow is provided for personal and reasonable commercial use. You agree not to misuse our services or attempt to access them using a method other than the interface and the instructions that we provide. Do not use the platform for any illegal activities or to translate illicit material.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-3">2. No Warranty</h2>
            <p className="text-foreground/80 mb-4">
              Our translation services are provided "as is", without any warranties of any kind, either express or implied. While we strive to provide accurate translations through third-party APIs, we do not guarantee the accuracy, reliability, or completeness of any translation results.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-3">3. Liability Disclaimer</h2>
            <p className="text-foreground/80 mb-4">
              Under no circumstances shall LinguaFlow, its developers, or its affiliates be liable for any direct, indirect, incidental, special, or consequential damages that result from the use of, or the inability to use, our translation services or materials provided on the platform. You assume full responsibility for your use of the translations.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-3">4. Changes to Terms</h2>
            <p className="text-foreground/80 mb-4">
              We reserve the right to modify these Terms of Service at any time. We will indicate any changes by updating the terms on this page. Your continued use of LinguaFlow after any such changes constitutes your acceptance of the new Terms of Service.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
