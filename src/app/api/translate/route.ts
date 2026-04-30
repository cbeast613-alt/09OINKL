// app/api/translate/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { calculateDifficulty, simplifyTranslation } from '@/utils/translationSimplifier';
import { generateComprehension } from '@/utils/comprehensionHelper';

// ------------------------------------------------------------------
// 1. Config
// ------------------------------------------------------------------
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const GEMINI_MODELS = [
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
];
const REQUEST_TIMEOUT_MS = 5000;
const MAX_OUTPUT_TOKENS = 2048;

const HINDI_FORMAL_SYSTEM = `You are a professional Hindi translator. Translate the text into a professional, formal tone using ONLY the Roman alphabet (no Devanagari). Maintain all technical words, element names, and scientist names exactly in English. Keep all numbers exact. Return ONLY the translation.`;


if (typeof window !== 'undefined') throw new Error('Server only');

// ------------------------------------------------------------------
// 2. Complete language map – covers ALL Google Translate languages
// ------------------------------------------------------------------
export const LANG_NAMES: Record<string, string> = {
  ab: 'Abkhaz', ace: 'Acehnese', ach: 'Acholi', af: 'Afrikaans',
  ak: 'Akan', alz: 'Alur', am: 'Amharic', ar: 'Arabic',
  as: 'Assamese', awa: 'Awadhi', ay: 'Aymara', az: 'Azerbaijani',
  ban: 'Balinese', bbc: 'Batak Toba', bcl: 'Bikol', be: 'Belarusian',
  bem: 'Bemba', bew: 'Betawi', bg: 'Bulgarian', bho: 'Bhojpuri',
  bik: 'Bikol', bm: 'Bambara', bn: 'Bengali', br: 'Breton',
  bs: 'Bosnian', bts: 'Batak Simalungun', btx: 'Batak Karo',
  bua: 'Buryat', ca: 'Catalan', ceb: 'Cebuano', cgg: 'Kiga',
  chm: 'Meadow Mari', ckb: 'Kurdish (Sorani)', cnh: 'Hakha Chin',
  co: 'Corsican', crh: 'Crimean Tatar', crs: 'Seychellois Creole',
  cs: 'Czech', cv: 'Chuvash', cy: 'Welsh', da: 'Danish',
  de: 'German', din: 'Dinka', doi: 'Dogri', dov: 'Dombe',
  dv: 'Dhivehi', dz: 'Dzongkha', ee: 'Ewe', el: 'Greek',
  en: 'English', eo: 'Esperanto', es: 'Spanish', et: 'Estonian',
  eu: 'Basque', fa: 'Persian', ff: 'Fula', fi: 'Finnish',
  fil: 'Filipino', fj: 'Fijian', fr: 'French', fy: 'Frisian',
  ga: 'Irish', gaa: 'Ga', gd: 'Scots Gaelic', gl: 'Galician',
  gn: 'Guarani', gom: 'Konkani', gu: 'Gujarati', ha: 'Hausa',
  haw: 'Hawaiian', he: 'Hebrew', hi: 'Hindi', hil: 'Hiligaynon',
  hmn: 'Hmong', hr: 'Croatian', hrx: 'Hunsrik', ht: 'Haitian Creole',
  hu: 'Hungarian', hy: 'Armenian', id: 'Indonesian', ig: 'Igbo',
  ilo: 'Ilocano', is: 'Icelandic', it: 'Italian', iw: 'Hebrew',
  ja: 'Japanese', jv: 'Javanese', jw: 'Javanese', ka: 'Georgian',
  kk: 'Kazakh', km: 'Khmer', kn: 'Kannada', ko: 'Korean',
  kri: 'Krio', ktu: 'Kituba', ku: 'Kurdish (Kurmanji)',
  ky: 'Kyrgyz', la: 'Latin', lb: 'Luxembourgish', lg: 'Ganda',
  li: 'Limburgish', lij: 'Ligurian', lmo: 'Lombard', ln: 'Lingala',
  lo: 'Lao', lt: 'Lithuanian', ltg: 'Latgalian', luo: 'Luo',
  lus: 'Mizo', lv: 'Latvian', mai: 'Maithili', mak: 'Makassar',
  mg: 'Malagasy', mi: 'Maori', min: 'Minangkabau', mk: 'Macedonian',
  ml: 'Malayalam', mn: 'Mongolian', mni: 'Meitei (Manipuri)',
  mr: 'Marathi', ms: 'Malay', mt: 'Maltese', my: 'Myanmar (Burmese)',
  ne: 'Nepali', new: 'Newari', nl: 'Dutch', no: 'Norwegian',
  nr: 'Southern Ndebele', nso: 'Northern Sotho', nus: 'Nuer',
  ny: 'Chichewa', oc: 'Occitan', om: 'Oromo', or: 'Odia (Oriya)',
  pa: 'Punjabi', pag: 'Pangasinan', pam: 'Kapampangan',
  pap: 'Papiamento', pl: 'Polish', ps: 'Pashto', pt: 'Portuguese',
  qu: 'Quechua', rm: 'Romansh', rn: 'Rundi', ro: 'Romanian',
  rom: 'Romani', ru: 'Russian', rw: 'Kinyarwanda', sa: 'Sanskrit',
  scn: 'Sicilian', sd: 'Sindhi', sg: 'Sango', shn: 'Shan',
  si: 'Sinhala', sk: 'Slovak', sl: 'Slovenian', sm: 'Samoan',
  sn: 'Shona', so: 'Somali', sq: 'Albanian', sr: 'Serbian',
  ss: 'Swati', st: 'Sotho', su: 'Sundanese', sv: 'Swedish',
  sw: 'Swahili', szl: 'Silesian', ta: 'Tamil', te: 'Telugu',
  tet: 'Tetum', tg: 'Tajik', th: 'Thai', ti: 'Tigrinya',
  tk: 'Turkmen', tl: 'Tagalog', tn: 'Tswana', to: 'Tongan',
  tr: 'Turkish', ts: 'Tsonga', tt: 'Tatar', uk: 'Ukrainian',
  ur: 'Urdu', ug: 'Uyghur', uz: 'Uzbek', vi: 'Vietnamese',
  wo: 'Wolof', xh: 'Xhosa', yi: 'Yiddish', yo: 'Yoruba',
  yua: 'Yucatec Maya', yue: 'Cantonese', zu: 'Zulu',

  'zh-CN': 'Chinese (Simplified)',
  'zh-TW': 'Chinese (Traditional)',
  'zh-HK': 'Chinese (Hong Kong)',
  'zh-Hans': 'Chinese (Simplified)',
  'zh-Hant': 'Chinese (Traditional)',
  zh: 'Chinese',
  'ar-SA': 'Arabic (Saudi Arabia)',
  'bn-IN': 'Bengali (India)',
  'bs-Cyrl': 'Bosnian (Cyrillic)',
  'en-AU': 'English (Australia)',
  'en-CA': 'English (Canada)',
  'en-GB': 'English (UK)',
  'en-IN': 'English (India)',
  'en-NZ': 'English (New Zealand)',
  'en-PH': 'English (Philippines)',
  'en-US': 'English (US)',
  'en-ZA': 'English (South Africa)',
  'es-AR': 'Spanish (Argentina)',
  'es-CL': 'Spanish (Chile)',
  'es-CO': 'Spanish (Colombia)',
  'es-CR': 'Spanish (Costa Rica)',
  'es-EC': 'Spanish (Ecuador)',
  'es-ES': 'Spanish (Spain)',
  'es-GT': 'Spanish (Guatemala)',
  'es-HN': 'Spanish (Honduras)',
  'es-HT': 'Spanish (Haiti)',
  'es-MX': 'Spanish (Mexico)',
  'es-NI': 'Spanish (Nicaragua)',
  'es-PA': 'Spanish (Panama)',
  'es-PE': 'Spanish (Peru)',
  'es-PR': 'Spanish (Puerto Rico)',
  'es-PY': 'Spanish (Paraguay)',
  'es-SV': 'Spanish (El Salvador)',
  'es-US': 'Spanish (US)',
  'es-UY': 'Spanish (Uruguay)',
  'es-VE': 'Spanish (Venezuela)',
  'es-419': 'Spanish (Latin America)',
  'fr-CA': 'French (Canada)',
  'fr-CH': 'French (Switzerland)',
  'fr-FR': 'French (France)',
  'nl-BE': 'Dutch (Belgium)',
  'pa-Arab': 'Punjabi (Shahmukhi)',
  'pa-PK': 'Punjabi (Pakistan)',
  'pt-BR': 'Portuguese (Brazil)',
  'pt-PT': 'Portuguese (Portugal)',
  'ms-Arab': 'Malay (Jawi)',
};

// ------------------------------------------------------------------
// 3. Dynamic language name resolver
// ------------------------------------------------------------------
function getLangName(code: string): string {
  if (LANG_NAMES[code]) return LANG_NAMES[code];
  try {
    const dn = new Intl.DisplayNames(['en'], { type: 'language' });
    const name = dn.of(code);
    if (name && name !== code) return name;
  } catch { /* ignore */ }
  const base = code.split('-')[0].toLowerCase();
  if (LANG_NAMES[base]) return LANG_NAMES[base];
  try {
    const dn = new Intl.DisplayNames(['en'], { type: 'language' });
    const name = dn.of(base);
    if (name && name !== base) return name;
  } catch { /* ignore */ }
  return code.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// ------------------------------------------------------------------
// 4. Zod schema
// ------------------------------------------------------------------
const TranslationRequestSchema = z.object({
  text: z.string().min(1).max(5000),
  sourceLang: z.string().default('auto'),
  targetLang: z.string().min(2),
});

// ------------------------------------------------------------------
// 5. JSON extractor
// ------------------------------------------------------------------
function extractJson(raw: string): Record<string, unknown> {
  let s = raw.replace(/^(?:json)?\s*/i, '').replace(/\s*$/i, '');
  const a = s.indexOf('{'), b = s.lastIndexOf('}');
  if (a !== -1 && b > a) s = s.slice(a, b + 1);
  return JSON.parse(s) as Record<string, unknown>;
}

// ------------------------------------------------------------------
// 6. Gemini caller
// ------------------------------------------------------------------
async function callGemini(userPrompt: string, systemPrompt?: string, temperature = 0.2): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY_MISSING');

  let lastErr: Error = new Error('GEMINI_FAILED');

  for (const model of GEMINI_MODELS) {
    const payload = {
      system_instruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      generationConfig: { temperature, topK: 40, topP: 0.92, maxOutputTokens: MAX_OUTPUT_TOKENS },
    };
    const endpoint = `${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`;
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(tid);

      if (res.status === 429 || res.status === 404 || res.status === 503 || res.status === 500) {
        console.warn(`[Gemini] ${model} returned ${res.status}, trying next model…`);
        lastErr = new Error(`GEMINI_HTTP_${res.status}`);
        await new Promise(r => setTimeout(r, 200));
        continue;
      }
      if (!res.ok) {
        const st = res.status;
        if (st === 401 || st === 403) throw new Error('GEMINI_AUTH_ERROR');
        console.warn(`[Gemini] ${model} returned ${st}, trying next model…`);
        lastErr = new Error(`GEMINI_HTTP_${st}`);
        continue;
      }

      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      if (!text) throw new Error('GEMINI_EMPTY_RESPONSE');
      return text.trim();

    } catch (err: unknown) {
      clearTimeout(tid);
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (err instanceof Error && err.name === 'AbortError') {
        lastErr = new Error(`GEMINI_TIMEOUT_${model}`);
        console.warn(`[Gemini] ${model} timed out`);
        continue;
      }
      if (errorMessage.includes('QUOTA') || errorMessage.includes('quota')) {
        lastErr = err instanceof Error ? err : new Error(errorMessage);
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

// ------------------------------------------------------------------
// 7. Google Translate & romanization
// ------------------------------------------------------------------
async function googleTranslate(text: string, from: string, to: string): Promise<string> {
  const sl = from === 'auto' ? 'auto' : from;
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(sl)}&tl=${encodeURIComponent(to)}&dt=t&hl=en&q=${encodeURIComponent(text)}`;
  const res = await fetch(url, {
    signal: AbortSignal.timeout(5000),
    headers: { 'Accept': 'application/json, text/javascript, /', 'Accept-Charset': 'UTF-8' },
  });
  if (!res.ok) throw new Error(`GOOGLE_HTTP_${res.status}`);
  const buf = await res.arrayBuffer();
  const raw = new TextDecoder('utf-8').decode(buf);
  const data = JSON.parse(raw);
  const translation: string = (data[0] as [string][])
    .map((item: [string]) => item[0])
    .filter(Boolean)
    .join('');
  if (!translation) throw new Error('GOOGLE_TRANSLATE_EMPTY');
  return translation;
}

async function googleRomanize(text: string, lang: string): Promise<string> {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${lang}&tl=en&dt=rm&q=${encodeURIComponent(text)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return '';
    const buf = await res.arrayBuffer();
    const raw = new TextDecoder('utf-8').decode(buf);
    const data = JSON.parse(raw);
    let out = '';
    if (data?.[0] && Array.isArray(data[0])) {
      for (const chunk of data[0]) { if (chunk[3]) out += chunk[3] + ' '; }
    }
    return out.trim();
  } catch { return ''; }
}

// Hinglish fixes
function applyHinglishFixes(text: string): string {
  const fixes: Record<string, string> = {
    'deeene': 'DNA', 'deenee': 'DNA', 'deeainae': 'DNA',
    'dee en ae': 'DNA', 'dee en ee': 'DNA', 'deeenae': 'DNA',
    'haidrojan': 'Hydrogen', 'hydrojan': 'Hydrogen', 'haidrogin': 'Hydrogen',
    'oxyjan': 'Oxygen', 'oxeejan': 'Oxygen', 'okseejan': 'Oxygen',
    'carban': 'Carbon', 'kaarban': 'Carbon',
    'nitrojan': 'Nitrogen', 'naitrojan': 'Nitrogen',
    'hailiyam': 'Helium', 'heeliyam': 'Helium',
    'aich too o': 'H2O', 'eich too o': 'H2O',
    'parmaanu sankhya': 'atomic number', 'parmanu sankhya': 'atomic number',
    'paramaanu sankhya': 'atomic number',
    'parmaanu': 'atom', 'parmanu': 'atom', 'paramaanu kramaank': 'atomic number',
    'rasayanik': 'chemical', 'rasaayanik': 'chemical', 'raasaayanik': 'chemical',
    'tatva': 'element', 'tatv': 'element',
    'anoo': 'molecule', 'sanyojan': 'compound',
    'aavart saarnee': 'periodic table',
    'ilaiktron': 'electron', 'prottron': 'proton', 'nyootron': 'neutron',
    'nabhik': 'nucleus', 'nabhikeeya': 'nuclear',
    'abhikriyaa': 'reaction',
    'aanuvanshik': 'genetic', 'aanuvanshikee': 'genetic', 'aanuvamshik': 'genetic',
    'jaanakaaree': 'information', 'jaanakaari': 'information',
    'koshikaon': 'cells', 'koshika': 'cell',
    'jeevit': 'living',
    'visaanu': 'virus', 'vishaanu': 'virus',
    'jeevaanu': 'bacteria', 'jeevanu': 'bacteria',
    'pratiraksha': 'immune', 'prateeraksha': 'immune',
    'tikaa': 'vaccine', 'teekaa': 'vaccine',
    'tikaakaran': 'vaccination', 'teekakaran': 'vaccination',
    'niyooron': 'neurons', 'nyooron': 'neurons', 'niyooran': 'neurons',
    'brahmaand': 'universe', 'brahmand': 'universe',
    'gurutvaakarshan': 'gravity', 'gurutvakrshan': 'gravity',
    'prakaash kee gati': 'speed of light', 'prakash ki gati': 'speed of light',
    'prakaash': 'light', 'prakash': 'light',
    'sooraj': 'Sun', 'suraj': 'Sun',
    'chandramaa': 'Moon', 'chandra': 'Moon',
    'prithvee': 'Earth', 'prithvi': 'Earth',
    'taara': 'star', 'taaraa': 'star',
    'arb saal': 'billion years', 'arb varsh': 'billion years',
    'arb': 'billion', 'kharab': 'trillion',
    'oorja': 'energy', 'urja': 'energy',
    'taapmaan': 'temperature', 'tapman': 'temperature',
    'dhabaab': 'pressure', 'dabaav': 'pressure',
    'vaayumandal': 'atmosphere', 'vayumandal': 'atmosphere',
    'gati': 'speed',
    'ainshtain': 'Einstein', 'ainstain': 'Einstein',
    'niyootan': 'Newton', 'nyootan': 'Newton',
    'prateek': 'symbol', 'pratikat': 'symbol',
    'sabase': 'sabse', 'prachur': 'bahut zyada',
    'jisaka': 'jiska', 'banaataa': 'banata',
    'teeke': 'vaccines', 'teeka': 'vaccine', 'teekaakaran': 'vaccination',
    'pranaalee': 'system', 'pranaali': 'system', 'pranaaleeon': 'system',
    'shareera': 'body', 'shareer': 'body', 'shareerakon': 'bodies',
    'mastishka': 'brain', 'mastishk': 'brain',
    'dil': 'heart', 'aankhen': 'eyes',
    'beemaariyon': 'diseases', 'beemaaree': 'disease',
    'ladana': 'fight', 'ladna': 'fight',
    'sikhaaate': 'sikhate', 'sikhaate': 'sikhate',
    'hamaaree': 'hamaari', 'hamaaraa': 'hamara',
  };
  let t = text;
  const sorted = Object.entries(fixes).sort((a, b) => b[0].length - a[0].length);
  for (const [wrong, right] of sorted) {
    t = t.replace(new RegExp(`\\b${wrong}\\b`, 'gi'), right);
  }
  return t;
}

function polishHinglish(text: string): string {
  if (!text) return '';
  let t = text.replace(/[\u0900-\u097F]+/g, '');
  t = t.replace(/\s*\.\s*/g, '. ').replace(/\s*,\s*/g, ', ')
    .replace(/\s*\?\s*/g, '? ').replace(/\s*!\s*/g, '! ');
  t = t.replace(/(\d+),(\d+)/g, '$1.$2');
  t = t.replace(/\b(\w+)\s+\1\b/gi, '$1');
  t = t.replace(/(^|\.\s+)([a-z])/g, (_, p1, p2) => p1 + p2.toUpperCase());
  t = t.replace(/\b(h2o|co2|o2|n2|h2|ch4)\b/gi, m => m.toUpperCase());
  return t.trim();
}

function postProcessJapanese(text: string, casual: boolean): string {
  let t = text.replace(/\[\d+\]/g, '').replace(/。\s+/g, '。')
    .replace(/\r?\n+/g, ' ').replace(/\s{2,}/g, ' ').trim();
  if (casual) {
    t = t.replace(/です。/g, 'んだよ。').replace(/ます。/g, 'るんだよ。');
  }
  return t;
}

// ------------------------------------------------------------------
// 8. Build Gemini prompt based on language
// ------------------------------------------------------------------
function getSimplePrompt(text: string, targetLangName: string, targetLang: string): string {
  // Hindi → Hinglish
  if (targetLang === 'hi') {
    return `You are a natural Hinglish writer. Convert the following English text into Hinglish – a mix of Hindi grammar words written in Roman letters, and ALL technical/scientific/English terms kept exactly in English.

CRITICAL RULES:
- Output ONLY Roman letters (ABCD...). Never use Devanagari.
- Keep English words: Hydrogen, DNA, vaccine, gravity, atom, molecule, cell, virus, protein, browser, etc. exactly as they are.
- Hindi words only for grammatical structure: hai, hain, ka, ki, ke, mein, se, par, aur, ye, woh, jo, isliye, kyunki, lekin, bhi, sirf, har, sab, kuch, thoda, bahut, lagbhag, jaise, etc.
- Numbers stay as in English: 3.14, 4.6 billion, 71%.
- Names untouched: Einstein, Google, India.
- Tone: Friendly, like explaining to a friend. Use short sentences.

EXAMPLES:
Text: "Hydrogen is the most abundant element in the universe."
Hinglish: "Hydrogen universe mein sabse abundant element hai."

Text: "DNA carries genetic information."
Hinglish: "DNA genetic information carry karta hai."

Text: "Water covers 71% of Earth's surface."
Hinglish: "Paani Earth ki surface ka 71% cover karta hai."

Text: "Vaccines teach the immune system to fight diseases."
Hinglish: "Vaccines hamare immune system ko bimariyon se ladna sikhate hain."

Now translate this into Hinglish, only the translation, nothing else:
${text}

Hinglish:`;
  }

  // Japanese
  if (targetLang === 'ja') {
    return `Translate the following text into Japanese. Return ONLY the translation, nothing else.
Keep technical terms (like DNA, atom, H2O, vaccine) in English.
Keep all numbers exactly as they are.
Use natural, modern Japanese.
Text: ${text}
Japanese:`;
  }

  // All other languages – return JSON with simple, formal, romanization
  return `Translate the following text into ${targetLangName}.
Return ONLY a JSON object (no markdown, no backticks) with exactly this structure:
{"simple":"...", "formal":"...", "romanization":"..."}

Instructions for "simple":
- Use everyday, very common words. Short sentences.
- Keep technical terms (atom, DNA, H2O) in English – do NOT translate them.
- Keep all numbers exactly: 4.6 billion, 71%, 0.025.
- Make it sound natural and easy to remember, like you are explaining to a friend.

Instructions for "formal":
- Professional, grammatically correct translation suitable for official documents.
- You may translate technical terms if that is customary.

Instructions for "romanization":
- For languages that do NOT use the Latin alphabet (Arabic, Chinese, Korean, Russian, Greek, Thai, Hebrew, etc.) provide a full pronunciation guide in Latin letters.
- For Latin-script languages (French, Spanish, German, Italian, etc.) set romanization to "".

Text to translate:
${text}`;
}

// ------------------------------------------------------------------
// 9. Core translation
// ------------------------------------------------------------------
async function translateWithGemini(
  processedText: string,
  targetLangName: string,
  targetLang: string,
  sourceLang: string,
): Promise<{ simple: string; formal: string; romanization: string; engine: string }> {

  // ── HINDI ─────────────────────────────────────────────────────
  if (targetLang === 'hi') {
    // Count words immediately
    const wordCount = processedText
      .trim()
      .split(/\s+/)
      .filter((w: string) => w.length > 0)
      .length;

    // If more than 250 words — 
    // skip Hinglish, use formal directly
    if (wordCount > 250) {
      const formalPrompt = `Translate 
      this text to Hindi (Roman script only, 
      NO Devanagari). Professional formal tone.
      Keep all technical words, element names,
      scientist names exactly in English.
      Keep all numbers exact.
      Return ONLY the translation.
      Text: ${processedText}`;

      const result = await callGemini(
        formalPrompt,
        HINDI_FORMAL_SYSTEM,
        0.1
      );

      return {
        simple: result.trim(),
        formal: result.trim(),
        romanization: result.trim(),
        engine: 'gemini',
      };
    }

    // Under 250 words — normal Hinglish flow
    const hinglishPrompt = getSimplePrompt(processedText, targetLangName, targetLang);

    try {
      const simpleRaw = await callGemini(hinglishPrompt, undefined, 0.1);
      let simple = simpleRaw.replace(/[\u0900-\u097F]+/g, '').replace(/\s+/g, ' ').trim();
      simple = polishHinglish(simple);

      const fixes: Record<string, string> = {
        'haidrojan': 'Hydrogen', 'hydrojan': 'Hydrogen', 'oxyjan': 'Oxygen',
        'carban': 'Carbon', 'nitrojan': 'Nitrogen', 'hailiyam': 'Helium',
        'ainshtain': 'Einstein', 'niyootan': 'Newton', 'dee en ae': 'DNA',
        'aich too o': 'H2O', 'parmaanu': 'atom', 'rasayanik': 'chemical', 'tatva': 'element',
      };
      for (const [w, c] of Object.entries(fixes)) {
        simple = simple.replace(new RegExp(w, 'gi'), c);
      }

      let formal = '';
      try {
        formal = await googleTranslate(processedText, sourceLang, 'hi');
      } catch {
        formal = simple;
      }

      return { simple, formal, romanization: simple, engine: 'gemini' };

    } catch (geminiErr) {
      console.warn('[Hindi] Gemini failed, using Google Translate + Hinglish fixes', geminiErr);
      const gtHindi = await googleTranslate(processedText, sourceLang, 'hi');
      const roman = await googleRomanize(gtHindi, 'hi');
      const formalRoman = polishHinglish(roman || gtHindi.replace(/[\u0900-\u097F]+/g, ''));
      let simple = applyHinglishFixes(formalRoman);
      simple = polishHinglish(simple);
      return { simple, formal: gtHindi, romanization: formalRoman, engine: 'google' };
    }
  }

  // ── JAPANESE ──────────────────────────────────────────────────
  if (targetLang === 'ja') {
    try {
      const gt = await googleTranslate(processedText, sourceLang, 'ja');
      const roman = await googleRomanize(gt, 'ja');
      return {
        simple: postProcessJapanese(gt, true),
        formal: postProcessJapanese(gt, false),
        romanization: roman,
        engine: 'google',
      };
    } catch (err) {
      console.warn('[Japanese] Google failed:', err);
      throw err;
    }
  }

  // ── ALL OTHER LANGUAGES ───────────────────────────────────────
  const NON_LATIN = /[\u0900-\u097F\u0600-\u06FF\u3040-\u30FF\u4E00-\u9FAF\u0400-\u04FF\u0E00-\u0E7F\u0370-\u03FF\uAC00-\uD7AF]/;

  try {
    const prompt = getSimplePrompt(processedText, targetLangName, targetLang);
    const raw = await callGemini(prompt, undefined, 0.2);
    const result = extractJson(raw) as { simple?: string; formal?: string; romanization?: string };
    let romanization = result.romanization || '';
    if (!romanization && NON_LATIN.test(result.simple || '') && (result.simple || '').length < 600) {
      romanization = await googleRomanize(result.simple || '', targetLang);
    }

    let formal = result.formal || result.simple || raw;
    try {
      formal = await googleTranslate(processedText, sourceLang, targetLang);
    } catch { /* keep Gemini's formal */ }

    return {
      simple: result.simple || raw,
      formal,
      romanization,
      engine: 'gemini',
    };

  } catch (geminiErr) {
    console.warn(`[${targetLangName}] Gemini failed(${(geminiErr as Error).message}), using Google Translate`);
    const translation = await googleTranslate(processedText, sourceLang, targetLang);
    let romanization = '';
    if (NON_LATIN.test(translation) && translation.length < 600) {
      romanization = await googleRomanize(translation, targetLang);
    }
    const { simplified } = simplifyTranslation(translation, targetLang);
    return {
      simple: simplified || translation,
      formal: translation,
      romanization,
      engine: 'google',
    };
  }
}

// ------------------------------------------------------------------
// 10. Post-process
// ------------------------------------------------------------------
function postProcess(text: string, targetLang?: string, isFormal: boolean = false): string {
  if (!text) return '';
  let t = text
    .replace(/_FIXED_DOT_/g, '.').replace(/\[DOT\]/g, '.')
    .replace(/\[[^\]]{1,20}\]/g, '.').replace(/(\d+)\s*\.\s*(\d+)/g, '$1.$2')
    .replace(/\[\d+\]/g, '');
  if (targetLang?.startsWith('ja')) t = postProcessJapanese(t, true);
  if (targetLang === 'hi' && !isFormal) t = polishHinglish(t);
  return t.replace(/\s{2,}/g, ' ').trim();
}

// ------------------------------------------------------------------
// 11. POST handler (the CORRECTED version – no stray objects)
// ------------------------------------------------------------------
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = TranslationRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { text, sourceLang, targetLang } = parsed.data;
    const targetLangName = getLangName(targetLang);

    const processedText = text.replace(/(\d+)\.(\d+)/g, '$1_FIXED_DOT_$2').replace(/\[\d+\]/g, '');

    try {
      console.log(`[Translate] ${processedText.length} chars → ${targetLangName}(${targetLang})`);
      const result = await translateWithGemini(processedText, targetLangName, targetLang, sourceLang);

      const simple = postProcess(result.simple, targetLang, false);
      const formal = postProcess(result.formal, targetLang, true);
      const romanization = result.romanization || '';

      if (!simple) throw new Error('Empty translation result');

      const difficulty = calculateDifficulty(simple, targetLang);
      const comp = generateComprehension(text, simple, targetLang);

      console.log(`[Translate] ✓ engine = ${result.engine}, ${simple.length} chars`);
      return NextResponse.json({
        simpleTranslation: simple,
        formalTranslation: formal,
        romanization,
        simpleMeaning: comp.simpleMeaning,
        memoryHook: comp.memoryHook,
        formality: 'Easy',
        difficulty,
        confidence: 1.0,
        sourceLang,
        targetLang,
        engine: result.engine,
      });

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.warn(`[Translate] All engines failed(${errorMessage}), trying MyMemory…`);
      const { runTranslationPipeline } = await import('@/utils/translationPipeline');
      const normalizedSource = sourceLang === 'auto' ? 'Autodetect' : sourceLang;
      const pipeline = await runTranslationPipeline(text, normalizedSource, targetLang);

      let simpleFallback = pipeline.simpleTranslation;
      let romanizationFallback = pipeline.romanization || '';

      if (targetLang === 'hi') {
        try {
          const roman = await googleRomanize(simpleFallback, 'hi');
          if (roman) { simpleFallback = roman; romanizationFallback = roman; }
        } catch { /* ignore */ }
      }

      const simpleFinal = postProcess(simpleFallback, targetLang, false);
      const formalFinal = postProcess(pipeline.formalTranslation, targetLang, true);
      const comp = generateComprehension(text, simpleFinal, targetLang);

      return NextResponse.json({
        simpleTranslation: simpleFinal,
        formalTranslation: formalFinal,
        romanization: romanizationFallback,
        simpleMeaning: comp.simpleMeaning,
        memoryHook: comp.memoryHook,
        formality: pipeline.formality,
        difficulty: pipeline.difficulty,
        confidence: pipeline.confidence,
        sourceLang,
        targetLang,
        engine: 'mymemory-fallback',
      });
    }

  } catch (error: unknown) {
    console.error('[Translate] Unhandled error:', error);
    // ✅ FIXED: single NextResponse.json call – no stray objects
    return NextResponse.json(
      {
        error: 'Translation failed. Please try again.',
        simpleTranslation: 'Translation temporarily unavailable. Please try again.',
        formalTranslation: 'Translation temporarily unavailable. Please try again.',
        romanization: '',
        formality: 'Hard',
        difficulty: 'Hard',
      },
      { status: 500 }
    );
  }
}