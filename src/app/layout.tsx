import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

import { OfflineIndicator } from "../components/OfflineIndicator";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LinguaFlow - Professional Translation",
  description: "Fast, accurate, and professional text and voice translation supporting 30+ languages including regional Indian languages.",
  keywords: ["translation", "translate", "voice translation", "languages", "privacy-first", "Indian languages"],
  openGraph: {
    title: "LinguaFlow - Professional Translation",
    description: "Fast, accurate, and professional text and voice translation supporting 30+ languages including regional Indian languages.",
    url: "https://linguaflow-delta.vercel.app/",
    siteName: "LinguaFlow",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LinguaFlow - Professional Translation",
    description: "Fast, accurate, and professional text and voice translation supporting 30+ languages including regional Indian languages.",
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
    other: [
      { rel: 'manifest', url: '/site.webmanifest' },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <OfflineIndicator />
        {children}
        <footer className="w-full border-t border-white/10 dark:border-white/5 py-6 mt-auto">
          <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-foreground/60">
            <div>&copy; 2025 LinguaFlow. All rights reserved.</div>
            <div className="flex gap-4">
              <Link href="/privacy-policy" className="hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <span className="text-foreground/30">|</span>
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
