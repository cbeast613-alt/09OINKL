// Hindi-specific word replacement dictionary for simplification
const hindiSimplifier: Record<string, string> = {
  'रासायनिक': 'chemical',
  'प्रतीक': 'symbol',
  'परमाणु': 'atom',
  'प्रचुर मात्रा': 'bahut zyada',
  'दहनशील': 'aag pakadne wala',
  'गंधहीन': 'koi smell nahi',
  'रंगहीन': 'colorless',
  'यौगिक': 'compound',
  'अणु': 'molecule',
  'तत्व': 'element',
  'ब्रह्मांड': 'universe',
  'पदार्थ': 'cheez',
  'मानक परिस्थितियों': 'normal conditions mein',
  'आणविक': 'molecular',
  'समस्थानिक': 'isotope',
  'इलेक्ट्रॉन': 'electron',
  'प्रोटॉन': 'proton',
  'न्यूट्रॉन': 'neutron',
  'कार्बनिक': 'organic',
  'अवस्था': 'state',
  'सूत्र': 'formula',
  'पृथ्वी': 'Earth',
  'रासायनिक तत्व': 'chemical element',
  'परमाणु संख्या': 'atomic number',
  'प्लाज्मा अवस्था': 'plasma state',
};

// Formal to casual mappings for various languages
const formalToCasual: Record<string, Record<string, string>> = {
  ar: {
    'كيف تفضلون': 'كيف حالك',
    'ألا تفضل': 'تحب ما',
    'يسعدني': 'تمام',
    'شكراً لك': 'شكرا',
    'من فضلك': 'لو سمحت',
  },
  fr: {
    'avez-vous compris': "t'as compris",
    'comment allez-vous': 'ça va',
    'merci beaucoup': 'merci',
    's\'il vous plaît': 'stp',
    'enchanté': 'salut',
  },
  es: {
    'usted es': 'eres',
    '¿cómo se encuentra?': '¿cómo estás?',
    'muchas gracias': 'gracias',
    'por favor': 'porfa',
    'señor': 'amigo',
  },
  de: {
    'Sie sind': 'Du bist',
    'wie geht es Ihnen': 'wie geht\'s dir',
    'vielen Dank': 'danke',
    'bitte sehr': 'bitte',
    'Herr': 'du',
  },
  ja: {
    'ご理解いただけましたか': 'わかった',
    'おられます': 'いる',
    'させていただきます': 'やる',
    'いたします': 'する',
    '申し上げます': 'いう',
  },
  ru: {
    'благодарю вас': 'спасибо',
    'пожалуйста': 'пожалуйста',
    'уважаемый': 'привет',
    'как дела': 'как дела',
    'спешу вам сообщить': 'слушай',
  },
  pt: {
    'como vai o senhor': 'como vai',
    'muito obrigado': 'obrigado',
    'se faz o favor': 'por favor',
    'encantado': 'oi',
    'nunca': 'nunca não',
  },
  it: {
    'come sta lei': 'come stai',
    'grazie mille': 'grazie',
    'per favore': 'per piacere',
    'signore': 'amico',
    'encantato': 'ciao',
  },
  ko: {
    '존댓말': '반말',
    '감사합니다': '고마워',
    '안녕하세요': '안녕',
    '실례합니다': '미안해',
    '말씀했습니다': '말했어',
  },
  zh: {
    '您好': '你好',
    '谢谢您': '谢谢',
    '请问': '问一下',
    '麻烦您': '麻烦你',
    '非常感谢': '谢谢啊',
  },
};

// Detect language formality level (1-5, where 1 is casual and 5 is very formal)
function detectFormality(text: string, language: string): number {
  let formalityScore = 2; // Default to casual

  const formalIndicators: Record<string, string[]> = {
    ar: ['يسعدني', 'تفضلوا', 'الكريم', 'الفاضل', 'حضرتك'],
    fr: ['vous', 'monsieur', 'madame', 'enchanté', 'permettez-moi'],
    es: ['usted', 'señor', 'señora', 'disculpe', 'le presento'],
    de: ['Sie', 'Ihnen', 'Herr', 'Frau', 'erlauben'],
    ja: ['ます', 'ございます', 'いたします', 'さん', 'せんせい'],
    ru: ['вас', 'благодарю', 'уважаемый', 'пожалуйста'],
    pt: ['senhor', 'senhora', 'muito', 'agradecido', 'permita'],
    it: ['lei', 'signore', 'signora', 'grazie mille', 'permetterebbe'],
    ko: ['습니다', '있습니다', '됩니다', '하십시오'],
    zh: ['您', '麻烦您', '非常感谢', '谢谢您'],
  };

  const indicators = formalIndicators[language] || [];
  let formalCount = 0;
  indicators.forEach((indicator) => {
    if (text.includes(indicator)) formalCount++;
  });

  if (formalCount > 3) formalityScore = 4;
  else if (formalCount > 1) formalityScore = 3;

  return formalityScore;
}

// Simplify translations using language-specific rules
export function simplifyTranslation(
  text: string,
  targetLanguage: string
): { simplified: string; formality: 'Easy' | 'Medium' | 'Hard' } {
  let simplified = text;
  const langCode = targetLanguage.split('-')[0].toLowerCase();

  // Apply formal to casual mappings
  if (formalToCasual[langCode]) {
    Object.entries(formalToCasual[langCode]).forEach(([formal, casual]) => {
      const regex = new RegExp(formal, 'gi');
      simplified = simplified.replace(regex, casual);
    });
  }

  // Language-specific simplification rules
  switch (langCode) {
    case 'hi':
      // Apply Hindi dictionary replacements
      Object.entries(hindiSimplifier).forEach(([formal, casual]) => {
        const regex = new RegExp(formal, 'g');
        simplified = simplified.replace(regex, casual);
      });
      // Convert formal Hindi pronouns to casual
      simplified = simplified.replace(/आप/g, 'tum').replace(/आपको/g, 'tumhe');
      break;

    case 'ar':
      // Use spoken Arabic (Ammiya) conventions
      simplified = simplified.replace(/كان/g, 'kan');
      simplified = simplified.replace(/هو/g, 'hu');
      simplified = simplified.replace(/هي/g, 'hiya');
      // Remove diacritics for easier reading
      simplified = simplified.replace(/[\u064B-\u0652]/g, '');
      break;

    case 'ja':
      // Convert formal (keigo) to casual plain present form
      // Bug fix: ます → る (present plain), NOT た (past plain)
      simplified = simplified.replace(/ます/g, 'る');
      simplified = simplified.replace(/ますが/g, 'るけど');
      simplified = simplified.replace(/ございます/g, 'ある');
      simplified = simplified.replace(/いたします/g, 'する');
      simplified = simplified.replace(/さん/g, ''); // Remove honorifics
      break;

    case 'ko':
      // Convert formal to casual Korean
      simplified = simplified.replace(/습니다/g, 'ㄴ거야');
      simplified = simplified.replace(/하십시오/g, '해');
      simplified = simplified.replace(/있습니다/g, '있어');
      break;

    case 'ru':
      // Simplify Russian formality
      simplified = simplified.replace(/благодарю/g, 'спасибо');
      simplified = simplified.replace(/уважаемый/g, 'привет');
      break;

    case 'de':
      // Replace formal Sie with casual du forms
      simplified = simplified.replace(/Sie/g, 'du');
      simplified = simplified.replace(/Ihnen/g, 'dir');
      simplified = simplified.replace(/Ihrer/g, 'deiner');
      break;

    case 'pt':
      // Simplify Portuguese
      simplified = simplified.replace(/senhor/g, 'cara');
      simplified = simplified.replace(/senhora/g, 'mulher');
      simplified = simplified.replace(/muito obrigado/g, 'obrigado');
      break;

    case 'it':
      // Simplify Italian
      simplified = simplified.replace(/lei/g, 'tu');
      simplified = simplified.replace(/grazie mille/g, 'grazie');
      break;

    case 'tr':
      // Simplify Turkish - use casual forms
      simplified = simplified.replace(/siz/g, 'sen');
      simplified = simplified.replace(/misiniz/g, 'misin');
      break;

    case 'el':
      // Simplify Greek - remove formal markers
      simplified = simplified.replace(/θέλω να σας/g, 'θέλω να σε');
      break;

    case 'th':
      // Simplify Thai - use casual registers
      simplified = simplified.replace(/ค่ะ/g, 'ค่า');
      simplified = simplified.replace(/ครับ/g, 'ครับ');
      break;

    case 'vi':
      // Simplify Vietnamese - use casual forms
      simplified = simplified.replace(/quý vị/g, 'bạn');
      break;

    case 'pl':
      // Simplify Polish - use casual forms
      simplified = simplified.replace(/pan/g, 'ty');
      simplified = simplified.replace(/pani/g, 'ty');
      break;

    case 'nl':
      // Simplify Dutch - use casual forms
      simplified = simplified.replace(/u/g, 'je');
      break;

    case 'sv':
      // Simplify Swedish - use casual forms
      simplified = simplified.replace(/ni/g, 'du');
      break;

    case 'no':
      // Simplify Norwegian - use casual forms
      simplified = simplified.replace(/De/g, 'du');
      break;

    case 'da':
      // Simplify Danish - use casual forms
      simplified = simplified.replace(/jer/g, 'dig');
      break;
  }

  // Break long sentences into shorter chunks
  const sentences = simplified.split(/([.!?]+)/).filter(Boolean);
  simplified = sentences
    .map((sentence) => {
      if (sentence.match(/[.!?]/)) return sentence;
      // Split overly long clauses
      if (sentence.length > 100 && sentence.includes(',')) {
        return sentence.split(',').join('.\n');
      }
      return sentence;
    })
    .join('');

  // Determine formality level
  const formalityScore = detectFormality(text, langCode);
  const formality: 'Easy' | 'Medium' | 'Hard' = 
    formalityScore <= 2 ? 'Easy' : formalityScore <= 3 ? 'Medium' : 'Hard';

  return { simplified: simplified.trim(), formality };
}

// Generate romanization for non-Latin scripts
export function generateRomanization(text: string, language: string): string {
  const langCode = language.split('-')[0].toLowerCase();

  const romanizationMap: Record<string, Record<string, string>> = {
    hi: {
      '\u0905': 'a', '\u0906': 'aa', '\u0907': 'i', '\u0908': 'ii', '\u0909': 'u', '\u090A': 'uu', '\u090B': 'ri',
      '\u090F': 'e', '\u0910': 'ai', '\u0913': 'o', '\u0914': 'au', '\u0902': 'an', '\u0903': 'ah',
      '\u0915': 'ka', '\u0916': 'kha', '\u0917': 'ga', '\u0918': 'gha', '\u0919': 'ng', '\u091A': 'cha', '\u091B': 'chha',
      '\u091C': 'ja', '\u091D': 'jha', '\u091E': 'ny', '\u091F': 'ta', '\u0920': 'tha', '\u0921': 'da', '\u0922': 'dha',
      '\u0923': 'na', '\u0924': 'ta', '\u0925': 'tha', '\u0926': 'da', '\u0927': 'dha', '\u0928': 'na', '\u0929': 'pa',
      '\u092A': 'pha', '\u092B': 'ba', '\u092C': 'bha', '\u092D': 'ma', '\u092E': 'ya', '\u092F': 'ra', '\u0930': 'la',
      '\u0935': 'va', '\u0936': 'sha', '\u0937': 'sha', '\u0938': 'sa', '\u0939': 'ha', '\u093C': '', '\u094D': '',
      '\u0940': 'ee', '\u0941': 'u', '\u0942': 'oo', '\u0947': 'e', '\u0948': 'ai', '\u094B': 'o', '\u094C': 'ou',
    },
    ja: {
      '\u3042': 'a', '\u3044': 'i', '\u3046': 'u', '\u3048': 'e', '\u304A': 'o', '\u304B': 'ka', '\u304D': 'ki',
      '\u304F': 'ku', '\u3051': 'ke', '\u3053': 'ko', '\u304C': 'ga', '\u304E': 'gi', '\u3050': 'gu', '\u3052': 'ge',
      '\u3054': 'go', '\u3055': 'sa', '\u3057': 'shi', '\u3059': 'su', '\u305B': 'se', '\u305D': 'so', '\u305A': 'za',
      '\u3058': 'ji', '\u305C': 'ze', '\u305E': 'zo', '\u305F': 'ta', '\u3061': 'chi', '\u3064': 'tsu',
      '\u3066': 'te', '\u3068': 'to', '\u3060': 'da', '\u3062': 'di', '\u3065': 'du', '\u3067': 'de', '\u3069': 'do',
      '\u306A': 'na', '\u306B': 'ni', '\u306C': 'nu', '\u306D': 'ne', '\u306E': 'no', '\u306F': 'ha', '\u3072': 'hi',
      '\u3075': 'fu', '\u3078': 'he', '\u307B': 'ho', '\u3070': 'ba', '\u3073': 'bi', '\u3076': 'bu', '\u3079': 'be',
      '\u307C': 'bo', '\u3071': 'pa', '\u3074': 'pi', '\u3077': 'pu', '\u307A': 'pe', '\u307D': 'po', '\u307E': 'ma',
      '\u307F': 'mi', '\u3080': 'mu', '\u3081': 'me', '\u3082': 'mo', '\u3084': 'ya', '\u3086': 'yu', '\u3088': 'yo',
      '\u3089': 'ra', '\u308A': 'ri', '\u308B': 'ru', '\u308C': 're', '\u308D': 'ro', '\u308F': 'wa', '\u3092': 'wo',
      '\u3093': 'n',
    },
    ko: {
      '\uAC00': 'ga', '\uB098': 'na', '\uB2E4': 'da', '\uB77C': 'ra', '\uB9C8': 'ma', '\uBC14': 'ba',
      '\uC0AC': 'sa', '\uC544': 'a', '\uC790': 'ja', '\uCC28': 'cha', '\uCE74': 'ka', '\uD0C0': 'ta',
      '\uD328': 'pa', '\uD558': 'ha', '\uAC1C': 'gae', '\uAC38': 'gan', '\uAC54': 'gal',
    },
    ar: {
      '\u0627': 'a', '\u0628': 'b', '\u062A': 't', '\u062B': 'th', '\u062C': 'j', '\u062D': 'h', '\u062E': 'kh',
      '\u062F': 'd', '\u0630': 'dh', '\u0631': 'r', '\u0632': 'z', '\u0633': 's', '\u0634': 'sh', '\u0635': 's',
      '\u0636': 'd', '\u0637': 't', '\u0638': 'z', '\u0639': 'a', '\u063A': 'gh', '\u0641': 'f', '\u0642': 'q',
      '\u0643': 'k', '\u0644': 'l', '\u0645': 'm', '\u0646': 'n', '\u0647': 'h', '\u0648': 'w', '\u064A': 'y',
    },
    zh: {
      '\u4F60': 'ni', '\u597D': 'hao', '\u8C22': 'xie', '\u8C23\u8C23': 'xiexie', '\u5988': 'ma',
      '\u7238': 'ba', '\u611B': 'ai', '\u6C34': 'shui', '\u706B': 'huo', '\u6728': 'mu',
      '\u91D1': 'jin', '\u571F': 'tu', '\u4EBA': 'ren', '\u53E3': 'kou', '\u624B': 'shou',
    },
    ru: {
      '\u0430': 'a', '\u0431': 'b', '\u0432': 'v', '\u0433': 'g', '\u0434': 'd', '\u0435': 'ye', '\u0451': 'yo', '\u0436': 'zh',
      '\u0437': 'z', '\u0438': 'i', '\u0439': 'y', '\u043A': 'k', '\u043B': 'l', '\u043C': 'm', '\u043D': 'n', '\u043E': 'o',
      '\u043F': 'p', '\u0440': 'r', '\u0441': 's', '\u0442': 't', '\u0443': 'u', '\u0444': 'f', '\u0445': 'h', '\u0446': 'ts',
      '\u0447': 'ch', '\u0448': 'sh', '\u0449': 'sch', '\u044A': '', '\u044B': 'y', '\u044C': '', '\u044D': 'e', '\u044E': 'yu',
      '\u044F': 'ya',
    },
    th: {
      '\u0E01': 'k', '\u0E02': 'kh', '\u0E04': 'kh', '\u0E07': 'ng', '\u0E08': 'ch', '\u0E09': 'ch', '\u0E0A': 'ch',
      '\u0E0B': 's', '\u0E0C': 'ch', '\u0E0D': 'y', '\u0E0E': 'd', '\u0E15': 't', '\u0E16': 'th', '\u0E17': 'th',
      '\u0E18': 'th', '\u0E19': 'n', '\u0E1A': 'b', '\u0E1B': 'p', '\u0E1C': 'ph', '\u0E1D': 'ph', '\u0E1F': 'f',
      '\u0E20': 'ph', '\u0E21': 'm', '\u0E22': 'y', '\u0E23': 'r', '\u0E25': 'l', '\u0E27': 'w', '\u0E28': 's',
      '\u0E29': 's', '\u0E2A': 's', '\u0E2B': 'h', '\u0E2C': 'w', '\u0E2D': 'o', '\u0E2E': 'h',
    },
  };

  let romanized = text;
  const map = romanizationMap[langCode] || {};

  Object.entries(map).forEach(([char, romanization]) => {
    romanized = romanized.split(char).join(romanization);
  });

  return romanized || text;
}

// Calculate translation difficulty
export function calculateDifficulty(text: string, language: string): 'Easy' | 'Medium' | 'Hard' {
  const langCode = language.split('-')[0].toLowerCase();

  // Non-Latin scripts are harder to read
  const nonLatinScripts = ['ja', 'ko', 'zh', 'hi', 'ar', 'th', 'he'];
  if (nonLatinScripts.includes(langCode)) {
    return text.length > 100 ? 'Hard' : 'Medium';
  }

  // Check text length
  if (text.length > 150) return 'Hard';
  if (text.length > 75) return 'Medium';
  return 'Easy';
}
