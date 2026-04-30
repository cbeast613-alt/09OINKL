import { NextResponse } from 'next/server';
import { z } from 'zod';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const GEMINI_MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash'];
const TIMEOUT_MS = 10000;

const TranslationSchema = z.object({
  text: z.string().min(1).max(5000),
  sourceLang: z.string().default('auto'),
  targetLang: z.string(),
  tone: z.enum(['casual', 'formal']).default('casual'),
});

async function googleTranslate(text: string, from: string, to: string): Promise<string> {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Google Translate failed');
  const data = await res.json();
  return data[0].map((x: any) => x[0]).join('');
}

async function googleRomanize(text: string, lang: string): Promise<string> {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${lang}&tl=en&dt=rm&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    const data = await res.json();
    let out = '';
    if (data?.[0]) {
      for (const chunk of data[0]) { if (chunk[3]) out += chunk[3] + ' '; }
    }
    return out.trim();
  } catch { return ''; }
}

async function callGemini(prompt: string, system: string): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_KEY_MISSING');

  for (const model of GEMINI_MODELS) {
    try {
      const res = await fetch(`${GEMINI_API_BASE}/${model}:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: system }] },
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 2048 }
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS)
      });
      if (!res.ok) continue;
      const data = await res.json();
      const out = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (out) return out.trim();
    } catch (e) { console.error(`Gemini ${model} failed`, e); }
  }
  throw new Error('All Gemini models failed');
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { text, sourceLang, targetLang, tone } = TranslationSchema.parse(body);

    // Prompt building
    const isHinglish = targetLang === 'hi';
    const system = isHinglish 
      ? `You are a Hinglish translator. Translate English to Hinglish (Hindi grammar in Roman script, English technical words). Return ONLY the translation.`
      : `You are a professional translator. Translate to the target language. Tone: ${tone}. Return ONLY the translation.`;

    let translation = '';
    let engine = 'gemini';
    let romanization = '';

    try {
      translation = await callGemini(text, system);
      if (targetLang === 'hi') {
        translation = translation.replace(/[\u0900-\u097F]+/g, '').trim();
      }
    } catch (e) {
      console.warn('Gemini failed, falling back to Google', e);
      translation = await googleTranslate(text, sourceLang, targetLang);
      engine = 'google';
    }

    if (/[^\u0000-\u007F]/.test(translation)) {
      romanization = await googleRomanize(translation, targetLang);
    }

    return NextResponse.json({ 
      translation, 
      romanization, 
      engine,
      success: true 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}
