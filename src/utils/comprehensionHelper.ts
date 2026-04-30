/**
 * comprehensionHelper.ts
 * Generates "What This Means" (simpleMeaning) and "Quick Recall" (memoryHook)
 * cards locally from the source text + translated text, working for any language pair.
 * Used as a guaranteed fallback when Gemini quota is exhausted.
 */

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

interface ComprehensionOutput {
  simpleMeaning: string;
  memoryHook: string;
}

// ──────────────────────────────────────────────────────────────
// Topic keyword buckets (English source text matching)
// ──────────────────────────────────────────────────────────────

const TOPIC_HINTS: Array<{ keywords: string[]; hook: string; meaningTemplate: string }> = [
  {
    keywords: ['atom', 'electron', 'proton', 'neutron', 'nucleus', 'atomic'],
    hook: 'Think of it as: tiny building blocks — too small to see but make up everything.',
    meaningTemplate: 'This is about the tiny particles that make up all matter around us.',
  },
  {
    keywords: ['molecule', 'compound', 'bond', 'covalent', 'chemical', 'formula'],
    hook: 'Think of it as: atoms holding hands to form something new.',
    meaningTemplate: 'This talks about how atoms join together to create different substances.',
  },
  {
    keywords: ['water', 'h2o', 'hydrogen', 'oxygen', 'liquid'],
    hook: 'Remember: H₂O — 2 hydrogen + 1 oxygen = water.',
    meaningTemplate: 'This is about water and the elements that make it up.',
  },
  {
    keywords: ['sun', 'solar', 'star', 'light', 'energy', 'heat', 'fire'],
    hook: 'Imagine: a giant glowing ball of gas giving us warmth and light.',
    meaningTemplate: 'This is about the Sun — the star that gives light, heat, and energy to Earth.',
  },
  {
    keywords: ['earth', 'planet', 'gravity', 'orbit', 'rotate', 'moon'],
    hook: 'Think of it as: our home planet spinning and moving in space.',
    meaningTemplate: 'This is about Earth, our planet — how it moves and exists in space.',
  },
  {
    keywords: ['element', 'periodic', 'table', 'symbol', 'number'],
    hook: 'Think of it as: the periodic table is chemistry\'s alphabet — each element has a symbol.',
    meaningTemplate: 'This is about chemical elements — pure substances listed in the periodic table.',
  },
  {
    keywords: ['acid', 'base', 'ph', 'neutral', 'alkaline'],
    hook: 'Remember: acid is sour (like lemon), base is bitter (like soap), neutral is in between.',
    meaningTemplate: 'This is about acids and bases — substances that can be sour or bitter in nature.',
  },
  {
    keywords: ['cell', 'biology', 'organism', 'bacteria', 'virus', 'dna', 'gene'],
    hook: 'Think of it as: cells are like tiny rooms — every living thing is built from them.',
    meaningTemplate: 'This is about living things — the tiny units (cells) that make up all life.',
  },
  {
    keywords: ['force', 'newton', 'mass', 'acceleration', 'velocity', 'speed', 'motion'],
    hook: 'Remember: force = push or pull. The harder you push, the faster it moves.',
    meaningTemplate: 'This talks about forces — the pushes and pulls that make things move.',
  },
  {
    keywords: ['temperature', 'hot', 'cold', 'heat', 'celsius', 'fahrenheit', 'boil', 'freeze'],
    hook: 'Think of it as: temperature is how hot or cold something feels — measured in degrees.',
    meaningTemplate: 'This is about temperature — how we measure how hot or cold something is.',
  },
  {
    keywords: ['electricity', 'current', 'voltage', 'circuit', 'wire', 'battery'],
    hook: 'Imagine: electricity as water flowing through pipes — voltage is the pressure, current is the flow.',
    meaningTemplate: 'This is about electricity — the flow of energy through wires and devices.',
  },
  {
    keywords: ['photosynthesis', 'plant', 'chlorophyll', 'leaf', 'sunlight', 'carbon'],
    hook: 'Think of it as: plants eat sunlight and air to make their own food.',
    meaningTemplate: 'This talks about how plants use sunlight to make food — called photosynthesis.',
  },
  {
    keywords: ['hello', 'hi', 'greet', 'welcome', 'good morning', 'good evening', 'namaste'],
    hook: 'Remember: a greeting is the first word that opens every conversation.',
    meaningTemplate: 'This is a common greeting — used to say hello when you meet someone.',
  },
  {
    keywords: ['thank', 'sorry', 'please', 'excuse', 'apolog'],
    hook: 'Think of it as: these are the magic words that keep relationships smooth.',
    meaningTemplate: 'These are polite words — used to show gratitude, apologize, or ask nicely.',
  },
  {
    keywords: ['food', 'eat', 'drink', 'meal', 'cook', 'rice', 'bread'],
    hook: 'Imagine: every culture has its own words for what goes on the table.',
    meaningTemplate: 'This talks about food and eating — something everyone relates to everywhere.',
  },
  {
    keywords: ['time', 'clock', 'hour', 'minute', 'today', 'tomorrow', 'yesterday'],
    hook: 'Think of it as: time words help you know when things happen.',
    meaningTemplate: 'This is about time — words that tell us when something happens.',
  },
  {
    keywords: ['number', 'count', 'math', 'add', 'subtract', 'multiply', 'divide', 'equal'],
    hook: 'Remember: numbers are the same everywhere — only the words change.',
    meaningTemplate: 'This involves numbers or math — the universal language of counting.',
  },
  {
    keywords: ['color', 'colour', 'red', 'blue', 'green', 'yellow', 'black', 'white'],
    hook: 'Think of it as: colors describe what your eyes see — they paint the world.',
    meaningTemplate: 'This describes a color — used to tell someone what something looks like.',
  },
  {
    keywords: ['family', 'mother', 'father', 'brother', 'sister', 'parent', 'child', 'baby'],
    hook: 'Remember: family words are among the first words every child learns.',
    meaningTemplate: 'This talks about family — the people closest to us.',
  },
  {
    keywords: ['school', 'learn', 'study', 'student', 'teacher', 'class', 'book', 'exam'],
    hook: 'Think of it as: school is where you go to collect tools for your brain.',
    meaningTemplate: 'This is about learning or school — a place where we gain knowledge.',
  },
];

// ──────────────────────────────────────────────────────────────
// Generic fallback templates
// ──────────────────────────────────────────────────────────────

const GENERIC_HOOKS = [
  'Think of it as: the same idea, just dressed in a new language.',
  'Remember: languages are different paths to the same meaning.',
  'Imagine: your brain is learning a new costume for the same thought.',
  'Think of it as: different words, same world — just a different zip code of language.',
  'Remember: every translation is a bridge between two worlds.',
];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ──────────────────────────────────────────────────────────────
// Sentence count for meaning template
// ──────────────────────────────────────────────────────────────

function getWordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// ──────────────────────────────────────────────────────────────
// Main Export
// ──────────────────────────────────────────────────────────────

export function generateComprehension(
  sourceText: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _translatedText: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _targetLang: string
): ComprehensionOutput {
  const lc = sourceText.toLowerCase();

  // 1. Try to match a topic from source text
  for (const topic of TOPIC_HINTS) {
    if (topic.keywords.some((kw) => lc.includes(kw))) {
      return {
        simpleMeaning: topic.meaningTemplate,
        memoryHook: topic.hook,
      };
    }
  }

  // 2. Generic fallback: build a meaning from sentence length
  const wordCount = getWordCount(sourceText);
  let simpleMeaning: string;

  if (wordCount <= 5) {
    simpleMeaning = `This is a short phrase. It means exactly what it says — read the translation slowly once.`;
  } else if (wordCount <= 15) {
    simpleMeaning = `This is a simple sentence. Read the translation once and you'll get the main idea right away.`;
  } else {
    simpleMeaning = `This is a longer passage. Focus on the key words first — the main idea will become clear.`;
  }

  return {
    simpleMeaning,
    memoryHook: randomFrom(GENERIC_HOOKS),
  };
}
