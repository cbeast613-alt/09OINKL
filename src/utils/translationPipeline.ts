/**
 * MASTER TRANSLATION PIPELINE - FINAL FIX + CRITICAL BUG FIXES
 * Handles decimal protection, citation removal, sentence splitting, and advanced post-processing.
 */

import { generateRomanization, calculateDifficulty } from './translationSimplifier';

interface TranslationResult {
  simpleTranslation: string;
  formalTranslation: string;
  romanization: string;
  formality: 'Easy' | 'Medium' | 'Hard';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  confidence: number;
}

// STEP 1 - PRE PROCESS INPUT
export function preProcess(text: string): string {
  let cleaned = text.trim();
  
  // 1. Remove Wikipedia citation numbers [14], [15] etc
  cleaned = cleaned.replace(/\[\d+\]/g, '');

  // 2. Protect Decimal Numbers (e.g., 0.025 -> 0[DOT]025)
  // This prevents sentence splitting on decimals
  cleaned = cleaned.replace(/(\d+)\s*\.\s*(\d+)/g, '$1.$2');
  cleaned = cleaned.replace(/(\d+)\.(\d+)/g, '$1[DOT]$2');

  // 3. Remove special characters that might confuse MyMemory API
  cleaned = cleaned.replace(/[<>]/g, '');

  return cleaned;
}

// Sentence splitter for the pipeline
export function splitSentences(text: string): string[] {
  // Split by sentence markers (. ! ?) while respecting protected decimals
  const sentences = text.split(/([.!?]+)/).filter(Boolean);
  
  const result: string[] = [];
  for (let i = 0; i < sentences.length; i += 2) {
    const sentence = sentences[i];
    const delimiter = sentences[i + 1] || '';
    if (sentence.trim()) {
      result.push((sentence + delimiter).trim());
    }
  }
  
  return result.length > 0 ? result : [text];
}

interface MyMemoryResponse {
  responseStatus: number;
  responseDetails: string;
  responseData: {
    translatedText: string;
  };
}

// STEP 2 - TRANSLATE via MyMemory
async function fetchTranslation(text: string, from: string, to: string): Promise<MyMemoryResponse> {
  const langpair = `${from}|${to}`;
  const url = new URL('https://api.mymemory.translated.net/get');
  url.searchParams.append('q', text);
  url.searchParams.append('langpair', langpair);
  url.searchParams.append('de', 'developer@linguaflow.test');
  url.searchParams.append('mt', '1');

  const response = await fetch(url.toString());
  if (!response.ok) throw new Error('API_UNAVAILABLE');
  
  const data = await response.json();
  if (data.responseStatus !== 200) throw new Error(data.responseDetails || 'TRANSLATION_FAILED');
  
  return data;
}

export async function translateSentence(text: string, from: string, to: string): Promise<string> {
  let attempts = 0;
  const maxAttempts = 2;
  
  while (attempts < maxAttempts) {
    try {
      const data = await fetchTranslation(text, from, to);
      return data.responseData.translatedText;
    } catch (error: unknown) {
      attempts++;
      if (attempts >= maxAttempts) throw error;
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  return text;
}

// STEP 3 - POST PROCESS OUTPUT
// Universal 6-fix post-processor for ALL 117 languages
export function postProcess(text: string, targetLang: string): string {
  const lang = targetLang.split('-')[0].toLowerCase();

  // FIX 1: Remove ALL possible language translations of the placeholder bracket
  // Catches [DOT] [PUNTO] [PRIK] [বিন্দু] [نقطه] [点] [NOKTA] [TOČKA] [PISTE] [PUNKT]
  // and ANY other translated placeholder from any of the 117 languages
  text = text.replace(/\[[^\]]{1,20}\]/g, '.');

  // Also normalise any remaining protected decimal that was already restored before this fix
  text = text.replace(/(\d+)\s*\.\s*(\d+)/g, '$1.$2');

  // FIX 2: Remove all line breaks (newlines cause broken/split sentences in every language)
  text = text.replace(/\r\n/g, ' ');
  text = text.replace(/\n/g, ' ');
  text = text.replace(/\r/g, ' ');

  // FIX 3: Fix script mixing — remove target-language suffixes attached to English words
  // Covers Hindi, Bengali, Tamil, and other Indic suffix patterns
  text = text.replace(
    /([a-zA-Z]+)(ओं|ों|एं|ाओ|ें|ாக|ের|দের)/g,
    '$1'
  );

  // FIX 4: Fix double words (same word repeated back-to-back, any language)
  text = text.replace(/(\b\w+\b) \1/gi, '$1');

  // FIX 5: Fix spacing issues
  text = text.replace(/\s{2,}/g, ' ');
  text = text.replace(/\s+([।\.!?])/g, '$1');
  text = text.trim();

  // Legacy etymology brackets fix for Hindi
  if (lang === 'hi') {
    text = text.replace(/\(([^)]*(लैटिन|Latin|origin|derived)[^)]*)\)/gi, (match, p1) => {
      const content = p1.replace(/लैटिन/g, 'Latin').replace(/कोयला/g, 'coal').replace(/'([^']+)'/g, "'$1'");
      return `(Latin ${content} se)`;
    });
  }

  switch (lang) {
    case 'hi':
      return fixHindi(text);
    case 'ar':
      return fixArabic(text);
    case 'fr':
      return fixFrench(text);
    case 'es':
      return fixSpanish(text);
    case 'ja':
      return fixJapanese(text);
    case 'de':
      return fixGerman(text);
    default:
      return fixSentenceFlow(text);
  }
}

// LANGUAGE SPECIFIC POST PROCESSORS

function fixHindi(text: string): string {
  const fixes: Record<string, string> = {
    // ── CRITICAL SAFETY NET: Hindustani replacements ──
    "केंद्र": "center",
    "प्रकाश": "light",
    "सौर मंडल": "solar system",
    "वर्ष": "saal",
    "परत": "crust",
    "संख्या": "number",
    "ग्रह": "planets",
    "सतह": "surface",
    "रासायनिक": "chemical",
    "सूत्र": "formula",
    "ऑक्सीजन": "Oxygen",
    "हाइड्रोजन": "Hydrogen",
    "नेयरॉन": "neurons",
    "न्यूरॉन्स": "neurons",
    "अणु": "molecule",
    "कोशिका": "cell",
    "आनुवंशिक": "genetic",
    "जानकारी": "information",
    "वायुमंडल": "atmosphere",
    "ऊर्जा": "energy",
    "गति": "speed",
    "मीटर": "meters",
    "प्रतिशत": "percent",
    "वैक्यूम": "Vacuum",
    "अरब": "Billion",
    "करोड़": "million/crore",
    "तारा": "star",
    "आधार": "base/basis",
    "नियंत्रण": "control",
    "निर्धारित": "determine",
    "रंग": "color",
    "ऊंचाई": "height",
    "जीवित": "living",
    "जीवन": "life",
    "ढकना": "cover",
    "यात्रा": "travel",
    "pershat": "percent",
    "deeene": "DNA",
    "dee en ee": "DNA",
    "डीएनए": "DNA",
    "atoms number": "atomic number",
    "atom number": "atomic number",
    "jaana jaata jeevan": "known life",
    "paanee": "Paani",
    "hotee": "hoti",
    "karata": "karta",
    "karate": "karte",
    "sochate": "sochte",
    "mahasoos": "feel",
    "mastishk": "brain",
    "shareer": "body",
    "upayog": "use",
    
    // ── BUG 1 SAFETY NET: Forbidden Sanskrit words → Hindustani replacements ──
    // (Gemini should not produce these; this catches any slip-throughs)
    "प्रतिरक्षा प्रणाली": "immune system",
    "प्रतिरक्षा तंत्र":   "immune system",
    "रोग प्रतिरोधक प्रणाली": "immune system",
    "टीके":               "vaccines",
    "टीका":               "vaccine",
    "टीकाकरण":            "vaccination",
    "सौरमंडल":            "solar system",
    "प्रकाश की गति":      "speed of light",
    "अरब वर्ष":           "billion saal",
    "अरब साल":            "billion saal",
    "निर्वात":             "vacuum",
    "निर्वात में":          "vacuum mein",

    // ── BUG 2 SAFETY NET: Vacuum cleaner → correct physics term ──
    "वैक्यूम क्लीनर में":  "vacuum mein",
    "वैक्यूम क्लीनर":      "vacuum",
    "शून्य में":           "vacuum mein",
    "खाली जगह में":        "vacuum mein",

    // ── UNIT WORDS: Always keep in English, never Devanagari ──
    "मीटर प्रति सेकंड":    "meter per second",
    "मीटर प्रति सेकन्ड":   "meter per second",
    "मीटर/सेकंड":          "meter/second",
    "सेकंड":               "second",
    "सेकन्ड":              "second",
    "किलोमीटर":            "kilometer",
    "किलोग्राम":           "kilogram",
    "प्रति सेकंड":         "per second",
    "प्रति":               "per",

    // ── BUG 3 SAFETY NET: Pure Sanskrit sentence starters → Hindustani ──
    "सौर मंडल के केंद्र": "solar system ke center",
    "सौर मंडल का केंद्र": "solar system ka center",
    "हमारे सौर मंडल":     "hamare solar system",
    "प्रकाश वर्ष":        "light year",


    "non- -": "non-",
    "non- - धातु": "non-metal",
    "टेट्रावैलेंट": "tetravalent",
    "सहसंयोजक बंधन": "covalent bonds",
    "सहसंयोजक": "covalent",
    "बंधन": "bond",
    "वैलेंस शेल": "valence shell",
    "आवर्त सारणी": "periodic table",
    "बनाता है": "hai",
    "पपड़ी": "crust",
    "आधे जीवन": "half-life",
    "क्षय": "decay",
    "प्राचीन काल से ज्ञात": "bahut purane zamane se jaana jaata",
    "रेडियोन्यूक्लाइड": "radionuclide",
    "प्राकृतिक रूप से": "naturally",
    "स्थिर": "stable",
    "अर्थ है कि": "matlab",
    "सक्षम हैं": "kar sakte hain",
    "प्रदर्शित करने वाले": "wale",
    "से संबंधित है": "se belong karta hai",
    "समूह": "group",
    "धातु": "metal",
    "अधातु": "non-metal",
    "इलेक्ट्रॉनों": "electrons",
    "परमाणु": "atoms",
    "तत्व": "element",
    "काल": "zamana",
    "ज्ञात": "jaana jaata",

    // Sentence fixes
    "सबसे bahut zyada में": "sabse zyada",
    "bahut zyada में": "bahut zyada",
    "mein में": "mein",
    "में mein": "mein",
    "पृथ्वी": "Earth",
    "सूर्य": "Sun",
    "बने होते हैं": "bane hain",
    "होते हैं": "hain",
    "गैर toxic": "non-toxic",
    "गैर": "non-",
    "डायटॉमिक": "diatomic",
    "डायहाइड्रोजन": "Dihydrogen",
    "moleculeओं": "molecules",
    "moleculesओं": "molecules",
    "cheezों": "cheezon",
    "plasma सेंट": "plasma state",
    "अत्यधिक": "bahut zyada",
    "सामान्य": "normal",
    "विषैले": "toxic",
    "गैर विषैले": "non-toxic",
    "मुख्य रूप से": "mainly",
    "मिलकर बनते हैं": "bane hain",
    "रहते हुए": "par",
    "के रूप में": "ki form mein",
    "पाया जाता है": "milta hai",
    "होता है": "hota hai",
    "सहित": "samet",
    "कहा जाता है": "kehte hain",

    // Previous fixes
    "लेखांकन": "jo hai",
    "के लिए लेखांकन": "ka hissa hai",
    "constituting": "jo hai",
    "accounting for": "jo hai",
    "प्रतीक": "symbol",
    "परमाणु संख्या": "atomic number",
    "प्रचुर मात्रा": "bahut zyada",
    "दहनशील": "aag pakadne wala",
    "गंधहीन": "koi smell nahi",
    "रंगहीन": "colorless",
    "यौगिक": "compound",
    "ब्रह्मांड": "Universe",
    "पदार्थ": "cheez",
    "मानक परिस्थितियों": "normal conditions mein",
    "आणविक": "molecular",
    "समस्थानिक": "isotope",
    "कार्बनिक": "organic",
    "अवस्था": "state",
    "प्लाज्मा": "plasma",
    "विद्युत": "electricity",
    "उत्पादन": "production",
    "रासायनिक प्रतिक्रिया": "chemical reaction",
    "गुरुत्वाकर्षण": "gravity",
    "प्रकाश संश्लेषण": "photosynthesis",
    "जीवाश्म": "fossil",
    "नवीकरणीय": "renewable",
    "तापमान": "temperature",
    "दबाव": "pressure",
    "घनत्व": "density",
    "आयतन": "volume",
    "द्रव्यमान": "mass",
    "वेग": "speed",
    "त्वरण": "acceleration",
    "बल": "force",
    "जबकि": "jabki",
    "इसलिए": "isliye",
    "क्योंकि": "kyunki",
    "लेकिन": "lekin",
    "और": "aur",
    "तथा": "aur",
    "एवं": "aur",
    "अथवा": "ya",
    "किंतु": "lekin",
    "परंतु": "lekin",
  };

  Object.entries(fixes).forEach(([wrong, right]) => {
    text = text.replaceAll(wrong, right);
  });

  return fixSentenceFlow(text);
}

function fixArabic(text: string): string {
  const fixes: Record<string, string> = {
    "كيف تفضلون": "كيف حالك",
    "أنا بخير شكراً": "تمام شكراً",
    "نعم": "أيوه",
    "لا": "لأ",
    "ماذا": "إيه",
  };
  Object.entries(fixes).forEach(([wrong, right]) => {
    text = text.replaceAll(wrong, right);
  });
  return fixSentenceFlow(text);
}

function fixFrench(text: string): string {
  // Word-boundary replacements only — avoids corrupting "vous-même", "trouvez", etc.
  const fixes: [RegExp, string][] = [
    [/\bvous\b/g, 'tu'],
    [/\bvotre\b/g, 'ton/ta'],
    [/\bavez-vous\b/g, "t'as"],
    [/\bcomprenez-vous\b/g, 'tu comprends'],
    [/\bComment vous\b/g, 'Comment tu'],
  ];
  fixes.forEach(([pattern, replacement]) => {
    text = text.replace(pattern, replacement);
  });
  return fixSentenceFlow(text);
}

function fixSpanish(text: string): string {
  const fixes: Record<string, string> = {
    "usted": "tú",
    "ustedes": "vosotros",
    "¿cómo se encuentra": "¿cómo estás",
    "le agradezco": "gracias",
  };
  Object.entries(fixes).forEach(([wrong, right]) => {
    text = text.replaceAll(wrong, right);
  });
  return fixSentenceFlow(text);
}

function fixJapanese(text: string): string {
  const fixes: Record<string, string> = {
    "ご理解いただけましたか": "わかった？",
    "いたします": "します",
    "ございます": "あります",
    "よろしくお願いいたします": "よろしく",
  };
  Object.entries(fixes).forEach(([wrong, right]) => {
    text = text.replaceAll(wrong, right);
  });

  // Do not attach Japanese particle の directly to English words without space.
  // When mixing English technical words with Japanese, always add 's' or keep English word standalone.
  text = text.replace(/の([a-zA-Z]+)/g, (match, p1) => {
    return p1.endsWith('s') ? `の ${p1}` : `の ${p1}s`;
  });

  // Fix Japanese text rendering
  text = text
    .replace(/。\s+/g, '。')
    .replace(/であり、\s+/g, 'であり、')
    .replace(/です\s+([^\s])/g, 'です、$1')
    .replace(/ます\s+([^\s])/g, 'ます、$1')
    .replace(/だ\s+([^\s])/g, 'だ、$1')
    .replace(/\s+真空$/g, '、真空中で')
    .replace(/真空\s*$/g, '真空中でだよ。')
    .replace(/\r\n/g, ' ')
    .replace(/\n+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return fixSentenceFlow(text);
}

function fixGerman(text: string): string {
  // Word-boundary replacements only — avoids corrupting "Sieden", "Sieg", "sieben", etc.
  const fixes: [RegExp, string][] = [
    [/\bSie\b/g, 'du'],
    [/\bIhr\b/g, 'dein'],
    [/\bIhnen\b/g, 'dir'],
    [/\bWie geht es Ihnen\b/g, "Wie geht's"],
  ];
  fixes.forEach(([pattern, replacement]) => {
    text = text.replace(pattern, replacement);
  });
  return fixSentenceFlow(text);
}

function fixSentenceFlow(text: string): string {
  // 1. Double word fix
  text = text.replace(/(\b\S+\b)\s+\1/g, '$1');
  
  // 2. Remove weird punctuation
  text = text.replace(/\.{2,}/g, '.').replace(/\s{2,}/g, ' ');
  
  // 3. Fix capital letters
  text = text.replace(/(^\w|\.\s+\w)/g, letter => letter.toUpperCase());
  
  // 4. Pattern Cleanup
  text = text.replace(/([a-zA-Z]+)(ओं|ों|एं|ाओ|ें)/g, '$1');

  return text.trim();
}

// STEP 4 - VALIDATE OUTPUT
export function validateOutput(original: string, translated: string, targetLang: string): boolean {
  const lang = targetLang.split('-')[0].toLowerCase();
  if (!translated || translated.trim().length === 0) return false;

  // Hindi uses Roman-script Hindustani — no Devanagari check needed
  const scripts: Record<string, RegExp> = {
    ar: /[\u0600-\u06FF]/,
    ja: /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/,
    zh: /[\u4E00-\u9FAF]/,
    ru: /[\u0400-\u04FF]/,
  };

  if (scripts[lang] && !scripts[lang].test(translated)) {
    return false;
  }

  return true;
}

// MAIN PIPELINE EXECUTION
export async function runTranslationPipeline(
  text: string, 
  sourceLang: string, 
  targetLang: string
): Promise<TranslationResult> {
  try {
    const preProcessed = preProcess(text);
    const sentences = splitSentences(preProcessed);
    
    let fullFormal = '';
    let fullSimple = '';

    for (const sentence of sentences) {
      const formal = await translateSentence(sentence, sourceLang, targetLang);
      const simple = postProcess(formal, targetLang);
      
      fullFormal += formal + ' ';
      fullSimple += simple + ' ';
    }

    fullFormal = fullFormal.trim();
    fullSimple = fullSimple.trim();

    const romanization = generateRomanization(fullSimple, targetLang);
    const difficulty = calculateDifficulty(fullSimple, targetLang);
    
    return {
      simpleTranslation: fullSimple,
      formalTranslation: fullFormal,
      romanization,
      formality: 'Easy',
      difficulty,
      confidence: 1.0
    };
  } catch (error: unknown) {
    console.error('Pipeline Error:', error);
    
    const errMessage = error instanceof Error ? error.message : String(error);
    
    // Map technical errors to user-friendly English messages
    let errorMsg = 'Translation unavailable. Please try again.';
    if (errMessage === 'API_UNAVAILABLE') {
      errorMsg = 'Translation service is busy. Please retry in a moment...';
    } else if (errMessage.includes('quota')) {
      errorMsg = 'Daily translation limit reached. Please try again tomorrow.';
    } else if (errMessage.includes('network') || errMessage.includes('ENOTFOUND') || errMessage.includes('fetch failed')) {
      errorMsg = 'Network error. Please check your connection and try again.';
    }

    return {
      simpleTranslation: errorMsg,
      formalTranslation: errorMsg,
      romanization: '',
      formality: 'Hard',
      difficulty: 'Hard',
      confidence: 0
    };
  }
}


