(function () {
  // ===================================================================
  // Wizard (formerly Math Wizard): pick a subject and grade, then answer
  // 10 questions to walk the wizard to the castle for a pizza party with
  // the princess and the prince. 5 wrong answers in one trip and the trip
  // starts over. Math uses a number pad; other subjects use big choice
  // buttons. Question banks live in wizard-questions.js.
  // Everything is emoji + CSS + inline SVG, so it works offline.
  // ===================================================================

  const STORE_KEY = 'henley-wizard-v1';
  const OLD_STORE_KEY = 'henley-math-wizard-v1'; // Math Wizard records, migrated into Math
  const STEPS = 10;
  const MAX_WRONG = 5;
  const MAX_DIGITS = 4;
  const NAME_MAX = 12;
  const CHEERS = ['Great job!', 'You got it!', 'Magic!', 'Awesome!', 'Yay!', 'Super smart!', 'Wow!'];
  const TRY_AGAIN = ['Try again! 💕', 'So close! Try again 💕', 'Oops! Try again 💕'];

  const SUBJECTS = [
    { id: 'reading', label: 'Reading', icon: '📖' },
    { id: 'math', label: 'Math', icon: '🔢' },
    { id: 'art', label: 'Art', icon: '🎨' },
    { id: 'science', label: 'Science', icon: '🔬' },
    { id: 'history', label: 'History', icon: '🏛️' },
  ];
  const GRADES = [
    { id: 'g1', label: '1st Grade', icon: '🌱' },
    { id: 'g2', label: '2nd Grade', icon: '🌟' },
    { id: 'g3', label: '3rd Grade', icon: '🚀' },
  ];
  const GRADE_HINTS = {
    reading: { g1: 'Rhymes, missing letters, opposites', g2: 'Blends, compound words, short stories', g3: 'Prefixes, grammar, word meanings' },
    math: { g1: 'Like 7 + 5 and 12 − 4', g2: 'Like 36 + 25 and 10 more than 47', g3: 'Like 6 × 7, 42 ÷ 6 and ½ of 12' },
    art: { g1: 'Colors, shapes, patterns, tools', g2: 'Color wheel, 3D shapes, famous artists', g3: 'Color theory, art words, crafts' },
    science: { g1: 'Senses, animals, plants, weather', g2: 'Matter, life cycles, space', g3: 'Forces, planets, water cycle, body' },
    history: { g1: 'Symbols, holidays, helpers', g2: 'Famous Americans, landmarks, maps', g3: 'Early America, government, leaders' },
  };
  function subjectById(id) { return SUBJECTS.find(s => s.id === id) || SUBJECTS[1]; }
  function gradeById(id) { return GRADES.find(g => g.id === id) || GRADES[0]; }

  // ---------- Small helpers ----------
  function ri(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function rep(e, n) { let s = ''; for (let i = 0; i < n; i++) s += e; return s; }
  function fmtTime(ms) {
    if (ms == null) return '—';
    const s = Math.max(0, Math.round(ms / 1000));
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }
  // Text for speech: drop emoji, read blanks and symbols as words.
  function speakable(s) {
    return String(s)
      .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{1F1E6}-\u{1F1FF}\uFE0F\u200D\u2753]/gu, '')
      .replace(/_{2,}/g, ' blank ')
      .replace(/ \+ /g, ' plus ')
      .replace(/= \?/g, 'equals what')
      .replace(/\s+/g, ' ')
      .trim();
  }

  const THINGS = [
    ['🧁', 'cupcakes'], ['🍕', 'pizza slices'], ['🦄', 'unicorns'], ['🌸', 'flowers'],
    ['⭐', 'stars'], ['🍓', 'strawberries'], ['🐸', 'frogs'], ['🎈', 'balloons'],
    ['🍪', 'cookies'], ['🦋', 'butterflies'], ['💎', 'gems'], ['🐶', 'puppies'],
  ];
  const FRACS = { 2: ['½', 'one half'], 3: ['⅓', 'one third'], 4: ['¼', 'one fourth'], 5: ['⅕', 'one fifth'] };
  const SAY_PART = { '−': 'minus', '+': 'plus', '=': 'equals', '×': 'times', '÷': 'divided by', 'of': 'of' };

  // A math question: { type, prompt, visual?, text?, parts: [..., null (the answer box), ...], answer, say }
  function eq(type, prompt, parts, answer, extra) {
    const say = parts.map(p => p === null ? 'what' : SAY_PART[p] ? SAY_PART[p] : String(p)).join(' ');
    return Object.assign({ type, prompt, parts, answer, say: say + '?' }, extra || {});
  }

  // ---------- 1st grade question makers ----------
  const G1 = {
    add() {
      const a = ri(1, 10), b = ri(1, Math.min(10, 20 - a));
      return eq('add', 'Add them up!', [a, '+', b, '=', null], a + b);
    },
    sub() {
      const a = ri(4, 20), b = ri(1, Math.min(10, a));
      return eq('sub', 'Take away!', [a, '−', b, '=', null], a - b);
    },
    pictureAdd() {
      const [e, noun] = pick(THINGS);
      const a = ri(1, 5), b = ri(1, 5);
      return {
        type: 'pictureAdd', prompt: 'How many ' + noun + ' in all?',
        visual: '<span class="mw-group">' + rep(e, a) + '</span><span class="mw-plus">+</span><span class="mw-group">' + rep(e, b) + '</span>',
        parts: [null], answer: a + b, say: 'How many ' + noun + ' in all?',
      };
    },
    missingAdd() {
      const c = ri(5, 15), a = ri(1, c - 1);
      return eq('missingAdd', 'What number is missing?', [a, '+', null, '=', c], c - a);
    },
    make10() {
      const a = ri(1, 9);
      return eq('make10', 'Make 10!', [a, '+', null, '=', 10], 10 - a);
    },
    doubles() {
      const a = ri(1, 10);
      return eq('doubles', 'Doubles!', [a, '+', a, '=', null], a + a);
    },
    bigger() {
      const a = ri(1, 20);
      let b = ri(1, 20);
      while (b === a) b = ri(1, 20);
      const big = Math.random() < 0.6;
      const word = big ? 'bigger' : 'smaller';
      return {
        type: 'bigger', prompt: 'Which number is ' + word + '?',
        visual: '<span class="mw-bubble">' + a + '</span><span class="mw-or">or</span><span class="mw-bubble">' + b + '</span>',
        parts: [null], answer: big ? Math.max(a, b) : Math.min(a, b),
        say: 'Which number is ' + word + ', ' + a + ' or ' + b + '?',
      };
    },
    countBy() {
      const step = pick([2, 5, 10]);
      const start = step * ri(1, step === 10 ? 5 : 4);
      const seq = [0, 1, 2, 3].map(i => start + i * step);
      return {
        type: 'countBy', prompt: 'Count by ' + step + 's! What comes next?',
        parts: [seq[0], ',', seq[1], ',', seq[2], ',', null], answer: seq[3],
        say: 'Count by ' + step + 's. ' + seq.slice(0, 3).join(', ') + ', what comes next?',
      };
    },
    word() {
      const [e, noun] = pick(THINGS);
      if (Math.random() < 0.5) {
        const a = ri(2, 9), b = ri(1, Math.min(9, 18 - a));
        const who = pick([['The princess', 'her'], ['Henley', 'her'], ['The prince', 'him']]);
        const text = who[0] + ' has ' + a + ' ' + noun + '. The wizard gives ' + who[1] + ' ' + b + ' more. How many ' + noun + ' now?';
        return {
          type: 'word', prompt: '📖 Story problem', text,
          visual: '<span class="mw-group">' + rep(e, a) + '</span><span class="mw-plus">+</span><span class="mw-group">' + rep(e, b) + '</span>',
          parts: [null], answer: a + b, say: text,
        };
      }
      const a = ri(4, 12), b = ri(1, a - 1);
      const text = 'The wizard has ' + a + ' ' + noun + '. ' + b + ' go POOF and disappear! How many are left?';
      return {
        type: 'word', prompt: '📖 Story problem', text,
        visual: '<span class="mw-group">' + rep(e, a) + '</span>',
        parts: [null], answer: a - b, say: 'The wizard has ' + a + ' ' + noun + '. ' + b + ' go poof and disappear! How many are left?',
      };
    },
  };

  // ---------- 2nd grade question makers ----------
  const G2 = {
    add2() {
      const a = ri(11, 79);
      const b = Math.random() < 0.5 ? ri(2, 9) : ri(11, Math.min(60, 99 - a));
      return eq('add2', 'Add them up!', [a, '+', b, '=', null], a + b);
    },
    sub2() {
      const a = ri(20, 99);
      const b = Math.random() < 0.5 ? ri(2, 9) : ri(10, a - 5);
      return eq('sub2', 'Take away!', [a, '−', b, '=', null], a - b);
    },
    facts20() {
      if (Math.random() < 0.5) {
        const a = ri(4, 10), b = ri(4, 10);
        return eq('facts20', 'Quick math!', [a, '+', b, '=', null], a + b);
      }
      const a = ri(11, 20), b = ri(3, 10);
      return eq('facts20', 'Quick math!', [a, '−', b, '=', null], a - b);
    },
    missing() {
      const r = Math.random();
      if (r < 0.34) { const c = ri(10, 20), a = ri(2, c - 2); return eq('missing', 'What number is missing?', [a, '+', null, '=', c], c - a); }
      if (r < 0.67) { const a = ri(10, 20), c = ri(1, a - 2); return eq('missing', 'What number is missing?', [a, '−', null, '=', c], a - c); }
      const b = ri(2, 9), c = ri(2, 11);
      return eq('missing', 'What number is missing?', [null, '−', b, '=', c], b + c);
    },
    three() {
      const a = ri(1, 9), b = ri(1, 9), c = ri(1, 9);
      return eq('three', 'Add all three!', [a, '+', b, '+', c, '=', null], a + b + c);
    },
    tenMore() {
      const n = ri(12, 88);
      const more = Math.random() < 0.6;
      const text = (more ? '10 more' : '10 less') + ' than ' + n + ' is…';
      return { type: 'tenMore', prompt: 'Think in tens!', text, parts: [null], answer: more ? n + 10 : n - 10,
        say: 'What is 10 ' + (more ? 'more' : 'less') + ' than ' + n + '?' };
    },
    placeValue() {
      const n = ri(21, 99);
      const tens = Math.random() < 0.5;
      const text = 'How many ' + (tens ? 'tens' : 'ones') + ' are in ' + n + '?';
      return { type: 'placeValue', prompt: 'Tens and ones!', text, parts: [null], answer: tens ? Math.floor(n / 10) : n % 10, say: text };
    },
    arrays() {
      const [e, noun] = pick(THINGS);
      const rows = ri(2, 4), cols = ri(2, 5);
      let grid = '';
      for (let r = 0; r < rows; r++) grid += '<span class="mw-row">' + rep(e, cols) + '</span>';
      return { type: 'arrays', prompt: 'How many ' + noun + ' in all?', visual: '<span class="mw-array">' + grid + '</span>',
        parts: [null], answer: rows * cols, say: rows + ' rows of ' + cols + ' ' + noun + '. How many in all?' };
    },
    countBy() {
      const step = pick([2, 5, 10, 100]);
      const start = step === 100 ? 100 * ri(1, 5) : step * ri(2, step === 10 ? 6 : 12);
      const seq = [0, 1, 2, 3, 4].map(i => start + i * step);
      const hole = ri(1, 4);
      const parts = [];
      seq.forEach((v, i) => { if (i) parts.push(','); parts.push(i === hole ? null : v); });
      return { type: 'countBy', prompt: 'Count by ' + step + 's! What number is missing?', parts, answer: seq[hole],
        say: 'Count by ' + step + 's. ' + seq.map((v, i) => i === hole ? 'what' : v).join(', ') + '?' };
    },
    word() {
      const [, noun] = pick(THINGS);
      const r = Math.random();
      let text, answer;
      if (r < 0.34) {
        const a = ri(12, 45), b = ri(5, 40);
        text = 'The princess bakes ' + a + ' ' + noun + ' and the prince bakes ' + b + '. How many ' + noun + ' in all?';
        answer = a + b;
      } else if (r < 0.67) {
        const a = ri(20, 60), b = ri(5, a - 5);
        text = 'There are ' + a + ' ' + noun + ' at the castle. The wizard makes ' + b + ' go POOF! How many are left?';
        answer = a - b;
      } else {
        const b = ri(5, 30), a = b + ri(2, 25);
        text = 'Henley has ' + a + ' ' + noun + '. The prince has ' + b + '. How many more does Henley have?';
        answer = a - b;
      }
      return { type: 'word', prompt: '📖 Story problem', text, parts: [null], answer, say: text.replace('POOF', 'poof') };
    },
  };

  // ---------- 3rd grade math makers ----------
  function rectSvg(l, w, grid) {
    const u = 22, pad = 30;
    const W = l * u, H = w * u;
    let lines = '';
    if (grid) {
      for (let x = 1; x < l; x++) lines += '<line x1="' + (pad + x * u) + '" y1="' + pad + '" x2="' + (pad + x * u) + '" y2="' + (pad + H) + '" stroke="#d9c4ff" stroke-width="2"/>';
      for (let y = 1; y < w; y++) lines += '<line x1="' + pad + '" y1="' + (pad + y * u) + '" x2="' + (pad + W) + '" y2="' + (pad + y * u) + '" stroke="#d9c4ff" stroke-width="2"/>';
    }
    return '<svg class="mw-rect" viewBox="0 0 ' + (W + pad * 2) + ' ' + (H + pad * 2) + '" role="img" aria-label="rectangle">' +
      '<rect x="' + pad + '" y="' + pad + '" width="' + W + '" height="' + H + '" rx="4" fill="#fff4c2" stroke="#a86fff" stroke-width="4"/>' + lines +
      '<text x="' + (pad + W / 2) + '" y="' + (pad - 8) + '" text-anchor="middle" font-size="20" font-weight="800" fill="#3a2545">' + l + '</text>' +
      '<text x="' + (pad + W + 8) + '" y="' + (pad + H / 2 + 7) + '" text-anchor="start" font-size="20" font-weight="800" fill="#3a2545">' + w + '</text>' +
      '</svg>';
  }
  const G3 = {
    multiply() {
      let a = ri(2, 10), b = Math.random() < 0.12 ? ri(0, 1) : ri(2, 10);
      if (Math.random() < 0.5) [a, b] = [b, a];
      return eq('multiply', 'Times tables!', [a, '×', b, '=', null], a * b);
    },
    divide() {
      const b = ri(2, 10), q = ri(1, 10);
      return eq('divide', 'Divide it!', [b * q, '÷', b, '=', null], q);
    },
    missingFactor() {
      const a = ri(2, 10), b = ri(2, 10);
      return Math.random() < 0.5
        ? eq('missingFactor', 'What number is missing?', [null, '×', b, '=', a * b], a)
        : eq('missingFactor', 'What number is missing?', [a, '×', null, '=', a * b], b);
    },
    add3() {
      const a = ri(100, 850), b = ri(100, Math.min(899, 1000 - a));
      return eq('add3', 'Add big numbers!', [a, '+', b, '=', null], a + b);
    },
    sub3() {
      const a = ri(300, 999), b = ri(100, a - 50);
      return eq('sub3', 'Subtract big numbers!', [a, '−', b, '=', null], a - b);
    },
    rounding() {
      if (Math.random() < 0.5) {
        let n; do { n = ri(11, 989); } while (n % 10 === 0 || n % 10 === 5);
        const text = 'Round ' + n + ' to the nearest 10.';
        return { type: 'rounding', prompt: 'Rounding!', text, parts: [null], answer: Math.round(n / 10) * 10, say: text };
      }
      let n; do { n = ri(110, 949); } while (n % 100 === 0 || n % 100 === 50);
      const text = 'Round ' + n + ' to the nearest 100.';
      return { type: 'rounding', prompt: 'Rounding!', text, parts: [null], answer: Math.round(n / 100) * 100, say: text };
    },
    groups() {
      const [e, noun] = pick(THINGS);
      if (Math.random() < 0.5) {
        const rows = ri(2, 5), cols = ri(2, 6);
        let grid = '';
        for (let r = 0; r < rows; r++) grid += '<span class="mw-row">' + rep(e, cols) + '</span>';
        return { type: 'groups', prompt: rows + ' rows of ' + cols + '. How many ' + noun + '?', visual: '<span class="mw-array">' + grid + '</span>',
          parts: [null], answer: rows * cols, say: rows + ' rows of ' + cols + ' ' + noun + '. How many in all?' };
      }
      const g = ri(2, 5), k = ri(2, 6);
      let vis = '';
      for (let i = 0; i < g; i++) vis += '<span class="mw-bag">' + rep(e, k) + '</span>';
      const text = g + ' groups with ' + k + ' ' + noun + ' in each. How many ' + noun + ' in all?';
      return { type: 'groups', prompt: 'Equal groups!', visual: vis, text, parts: [null], answer: g * k, say: text };
    },
    twoStep() {
      const [, noun] = pick(THINGS);
      const r = Math.random();
      let text, answer;
      if (r < 0.25) {
        const g = ri(2, 5), k = ri(2, 10), e = ri(1, 9);
        text = 'Henley has ' + g + ' boxes with ' + k + ' crayons in each box. She finds ' + e + ' more crayons. How many crayons does she have now?';
        answer = g * k + e;
      } else if (r < 0.5) {
        const p = ri(2, 5), each = ri(2, 8), x = ri(1, 9);
        text = 'There are ' + (p * each + x) + ' ' + noun + '. ' + x + ' go POOF! The rest are shared equally on ' + p + ' plates. How many go on each plate?';
        answer = each;
      } else if (r < 0.75) {
        const g = ri(2, 6), k = ri(3, 10), x = ri(1, g * k - 1);
        text = 'The princess buys ' + g + ' packs of stickers with ' + k + ' stickers in each pack. She gives ' + x + ' to the prince. How many stickers does she have left?';
        answer = g * k - x;
      } else {
        const a = ri(10, 60), b = ri(10, 60), t = a + b + ri(5, 80);
        text = 'The wizard\'s book has ' + t + ' pages. He reads ' + a + ' pages on Monday and ' + b + ' pages on Tuesday. How many pages are left?';
        answer = t - a - b;
      }
      return { type: 'twoStep', prompt: '📖 Two-step story', text, parts: [null], answer, say: text.replace('POOF', 'poof') };
    },
    fraction() {
      const d = pick([2, 2, 3, 4, 4, 5]);
      const n = d * ri(2, 10);
      const [sym, word] = FRACS[d];
      const [e] = pick(THINGS);
      return { type: 'fraction', prompt: 'Fractions!', visual: n <= 20 ? '<span class="mw-group">' + rep(e, n) + '</span>' : '',
        parts: [sym, 'of', n, '=', null], answer: n / d, say: 'What is ' + word + ' of ' + n + '?' };
    },
    timeShape() {
      if (Math.random() < 0.5) {
        const h = ri(1, 11), m1 = 5 * ri(0, 7);
        const dur = 5 * ri(2, Math.floor((55 - m1) / 5));
        const fmt = m => h + ':' + String(m).padStart(2, '0');
        const what = pick(['A movie', 'Soccer practice', 'A puppet show', 'Art class']);
        const text = what + ' starts at ' + fmt(m1) + ' and ends at ' + fmt(m1 + dur) + '. How many minutes long is it?';
        return { type: 'timeShape', prompt: '⏰ Telling time', text, parts: [null], answer: dur, say: text };
      }
      const l = ri(3, 9), w = ri(2, 6);
      if (Math.random() < 0.6) {
        const text = 'This rectangle is ' + l + ' units long and ' + w + ' units wide. What is its perimeter (all the way around)?';
        return { type: 'timeShape', prompt: '📏 Perimeter', visual: rectSvg(l, w, false), text, parts: [null], answer: 2 * (l + w), say: text };
      }
      const text = 'This rectangle is ' + l + ' units long and ' + w + ' units wide. What is its area (how many squares)?';
      return { type: 'timeShape', prompt: '📐 Area', visual: rectSvg(l, w, true), text, parts: [null], answer: l * w, say: text };
    },
  };

  const MATH = { g1: G1, g2: G2, g3: G3 };

  // ---------- Building a trip of 10 questions ----------
  const recentKeys = {}; // per subject+grade, so back-to-back trips feel fresh

  function choiceQuestion(subject, cat, raw) {
    const s = subjectById(subject);
    const choices = shuffle([raw.answer].concat(raw.wrongs));
    return {
      kind: 'choice', type: cat, key: raw.key,
      prompt: raw.prompt || (s.icon + ' ' + cat), text: raw.text, visual: raw.visual || '',
      choices, answer: raw.answer,
      say: speakable(raw.say || raw.text).replace(/[.?!:]+$/, '') + '. Is it ' + choices.map(speakable).join(', or ') + '?',
    };
  }

  function bankMakers(subject, grade, tripSeen, recent) {
    const bank = (window.WizardBanks && window.WizardBanks.BANKS[subject] || {})[grade] || {};
    const makers = {};
    Object.keys(bank).forEach(cat => {
      const src = bank[cat];
      if (typeof src === 'function') {
        makers[cat] = () => { const raw = src(tripSeen); return raw ? choiceQuestion(subject, cat, raw) : null; };
        return;
      }
      makers[cat] = () => {
        const keyOf = i => 'b:' + cat + ':' + i;
        let idx = src.map((_, i) => i).filter(i => !tripSeen.has(keyOf(i)) && recent.indexOf(keyOf(i)) === -1);
        if (!idx.length) idx = src.map((_, i) => i).filter(i => !tripSeen.has(keyOf(i)));
        if (!idx.length) return null;
        const i = pick(idx);
        const item = src[i];
        return choiceQuestion(subject, cat, { key: keyOf(i), text: item[0], answer: item[1], wrongs: item.slice(2) });
      };
    });
    return makers;
  }

  function makeQuestions(subject, grade) {
    const rk = subject + ':' + grade;
    const recent = recentKeys[rk] || [];
    const tripSeen = new Set();
    let makers;
    if (subject === 'math') {
      const m = MATH[grade] || G1;
      makers = {};
      Object.keys(m).forEach(t => { makers[t] = () => m[t](); });
    } else {
      makers = bankMakers(subject, grade, tripSeen, recent);
    }
    const types = Object.keys(makers);
    const out = [];
    let lastType = null;
    let guard = 0;
    while (out.length < STEPS && guard++ < 800) {
      // Use every type once before repeating, never the same type twice in a row.
      const used = out.map(q => q.type);
      let pool = types.filter(t => t !== lastType && used.filter(u => u === t).length < Math.ceil(STEPS / types.length));
      if (!pool.length) pool = types.filter(t => t !== lastType);
      if (!pool.length) pool = types;
      const t = pick(pool);
      const q = makers[t]();
      if (!q) continue;
      q.type = t;
      if (q.kind !== 'choice') {
        q.key = q.type + '|' + q.parts.join(' ') + '|' + (q.text || '') + '|' + (q.visual || '');
        if (q.answer < 0 || q.answer > 9999 || q.answer !== Math.floor(q.answer)) continue;
      }
      if (tripSeen.has(q.key) && q.kind !== 'choice') continue;
      tripSeen.add(q.key);
      out.push(q);
      lastType = t;
    }
    recentKeys[rk] = recent.concat(out.map(q => q.key)).slice(-24);
    return out;
  }

  // ---------- Leaderboard storage (per browser / device) ----------
  function blankStats() { return { wins: 0, runs: 0, bestMistakes: null, fastestMs: null, totalCorrect: 0 }; }
  let memoryStore = null; // fallback if localStorage is blocked

  function migrateOld(old) {
    const data = { version: 2, players: {}, last: old && old.last || null, migratedFrom: OLD_STORE_KEY };
    const players = (old && old.players) || {};
    Object.keys(players).forEach(k => {
      const p = players[k] || {};
      if (!p.name) return;
      data.players[k] = {
        name: p.name, lastPlayed: p.lastPlayed || 0,
        subjects: { math: {
          wins: p.wins || 0, runs: p.runs || 0,
          bestMistakes: p.bestMistakes == null ? null : p.bestMistakes,
          fastestMs: p.fastestMs == null ? null : p.fastestMs,
          totalCorrect: p.totalCorrect || 0,
        } },
      };
    });
    return data;
  }

  function loadStore() {
    let data = null;
    try {
      const raw = window.localStorage.getItem(STORE_KEY);
      if (raw) data = JSON.parse(raw);
      if (!data) {
        const oldRaw = window.localStorage.getItem(OLD_STORE_KEY);
        if (oldRaw) { data = migrateOld(JSON.parse(oldRaw)); saveStore(data); }
      }
    } catch (e) { data = memoryStore; }
    if (!data || typeof data !== 'object' || !data.players) data = { version: 2, players: {}, last: null };
    return data;
  }
  function saveStore(data) {
    memoryStore = data;
    try { window.localStorage.setItem(STORE_KEY, JSON.stringify(data)); } catch (e) { /* private mode: keep in memory */ }
  }
  function keyFor(name) { return name.trim().toLowerCase(); }
  function ensurePlayer(data, name) {
    const k = keyFor(name);
    if (!data.players[k]) data.players[k] = { name: name.trim(), lastPlayed: 0, subjects: {} };
    if (!data.players[k].subjects) data.players[k].subjects = {};
    return data.players[k];
  }
  function statsFor(p, subject) {
    if (!p.subjects[subject]) p.subjects[subject] = blankStats();
    return p.subjects[subject];
  }
  function combined(p, filter) {
    const subs = p.subjects || {};
    const ids = filter === 'all' ? Object.keys(subs) : (subs[filter] ? [filter] : []);
    const out = blankStats();
    ids.forEach(id => {
      const s = subs[id];
      out.wins += s.wins || 0;
      out.runs += s.runs || 0;
      out.totalCorrect += s.totalCorrect || 0;
      if (s.bestMistakes != null && (out.bestMistakes == null || s.bestMistakes < out.bestMistakes)) out.bestMistakes = s.bestMistakes;
      if (s.fastestMs != null && (out.fastestMs == null || s.fastestMs < out.fastestMs)) out.fastestMs = s.fastestMs;
    });
    return out;
  }
  function ranked(data, filter) {
    const nullLast = (a, b) => (a == null ? Infinity : a) - (b == null ? Infinity : b);
    const list = Object.keys(data.players).map(k => {
      const p = data.players[k];
      return { p, s: combined(p, filter) };
    }).filter(x => filter === 'all' || x.s.runs > 0);
    list.sort((a, b) =>
      (b.s.wins - a.s.wins) ||
      nullLast(a.s.bestMistakes, b.s.bestMistakes) ||
      nullLast(a.s.fastestMs, b.s.fastestMs) ||
      (b.s.totalCorrect - a.s.totalCorrect) ||
      a.p.name.localeCompare(b.p.name));
    return list;
  }

  GameApp.register({
    name: 'Wizard',
    icon: '🧙',
    minPlayers: 1,
    maxPlayers: 1,

    start(root) {
      const timers = new Set();
      const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window &&
        typeof window.SpeechSynthesisUtterance === 'function';

      // State
      let screen = 'subject';   // subject | grade | name | play | board
      let subject = null;
      let grade = null;
      let player = null;
      let questions = [];
      let qIndex = 0;
      let wrong = 0;
      let typed = '';
      let busy = false;
      let runStart = 0;
      let showNewInput = false;
      let confirmReset = false;
      let boardReturn = 'subject';
      let boardFilter = 'all';

      const wrap = document.createElement('div');
      wrap.className = 'mw-wrap';
      root.appendChild(wrap);

      function later(fn, ms) {
        const t = setTimeout(() => { timers.delete(t); fn(); }, ms);
        timers.add(t);
        return t;
      }
      function clearTimers() { timers.forEach(t => clearTimeout(t)); timers.clear(); }

      function speak(text) {
        if (!canSpeak || !text) return;
        try {
          window.speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(text);
          u.rate = 0.85;
          u.pitch = 1.15;
          window.speechSynthesis.speak(u);
        } catch (e) { /* speech is a bonus */ }
      }
      function stopSpeech() { if (canSpeak) { try { window.speechSynthesis.cancel(); } catch (e) {} } }

      function spawnConfetti(target, count) {
        const colors = ['#ff6fb5', '#a86fff', '#ffd84d', '#7bffb5', '#7de0ff'];
        for (let i = 0; i < count; i++) {
          const p = document.createElement('div');
          p.className = 'confetti';
          p.style.left = Math.random() * 100 + '%';
          p.style.background = colors[i % colors.length];
          p.style.animationDelay = Math.random() * 0.8 + 's';
          p.style.animationDuration = (1.8 + Math.random() * 1.8) + 's';
          target.appendChild(p);
        }
      }

      function resetScreen() { clearTimers(); stopSpeech(); confirmReset = false; }

      // ===== Subject screen =====
      function showSubjectScreen() {
        resetScreen();
        screen = 'subject';
        wrap.innerHTML =
          '<div class="mw-screen">' +
            '<div class="mw-card mw-intro">' +
              '<div class="mw-hero" aria-hidden="true"><span>🧙</span><span class="mw-hero-path">✨ ✨ ✨</span><span>🏰</span></div>' +
              '<h2 class="mw-title">Wizard</h2>' +
              '<div class="mw-sub">Answer ' + STEPS + ' questions to reach the castle for a pizza party with the princess 👸 and the prince 🤴! 🍕</div>' +
              '<div class="mw-who">Pick a subject</div>' +
              '<div class="mw-subjects">' + SUBJECTS.map(s =>
                '<button class="mw-subject-btn s-' + s.id + '" data-subject="' + s.id + '"><span class="mw-subject-icon">' + s.icon + '</span><span>' + s.label + '</span></button>').join('') +
              '</div>' +
              '<div class="mw-row"><button class="btn purple" data-action="board">🏆 Leaderboard</button></div>' +
            '</div>' +
          '</div>';
      }

      // ===== Grade screen =====
      function showGradeScreen() {
        resetScreen();
        screen = 'grade';
        const s = subjectById(subject);
        const cls = ['mint', 'yellow', ''];
        wrap.innerHTML =
          '<div class="mw-screen">' +
            '<div class="mw-card mw-intro">' +
              '<div class="mw-hero" aria-hidden="true"><span>' + s.icon + '</span></div>' +
              '<h2 class="mw-title">' + s.label + '</h2>' +
              '<div class="mw-who">Pick a grade</div>' +
              '<div class="mw-grades">' + GRADES.map((g, i) =>
                '<button class="btn ' + cls[i] + ' mw-grade-btn" data-grade="' + g.id + '">' + g.icon + ' ' + g.label +
                  '<small>' + esc(GRADE_HINTS[subject][g.id]) + '</small></button>').join('') +
              '</div>' +
              '<div class="mw-row"><button class="btn purple" data-action="to-subject">👈 Subjects</button></div>' +
            '</div>' +
          '</div>';
      }

      // ===== Name screen =====
      function showNameScreen() {
        resetScreen();
        screen = 'name';
        const data = loadStore();
        const names = Object.keys(data.players).map(k => data.players[k])
          .sort((a, b) => (b.lastPlayed || 0) - (a.lastPlayed || 0));
        const needInput = showNewInput || names.length === 0;
        const s = subjectById(subject), g = gradeById(grade);
        wrap.innerHTML =
          '<div class="mw-screen">' +
            '<div class="mw-card mw-intro">' +
              '<div class="mw-hero" aria-hidden="true"><span>🧙</span><span class="mw-hero-path">✨ ✨ ✨</span><span>🏰</span></div>' +
              '<h2 class="mw-title">Wizard</h2>' +
              '<div class="mw-level-tag">' + s.icon + ' ' + s.label + ' · ' + g.icon + ' ' + g.label + '</div>' +
              '<div class="mw-who">Who is playing?</div>' +
              (names.length ? '<div class="mw-names">' + names.map(p =>
                '<button class="mw-name-btn" data-name="' + esc(p.name) + '">' + esc(p.name) + '</button>').join('') +
                (needInput ? '' : '<button class="mw-name-btn mw-new" data-action="new">➕ New player</button>') +
              '</div>' : '') +
              (needInput ?
                '<form class="mw-new-form" autocomplete="off">' +
                  '<input class="mw-name-input" type="text" maxlength="' + NAME_MAX + '" placeholder="Type your name" aria-label="Your name" autocapitalize="words" autocorrect="off" spellcheck="false" enterkeyhint="go" />' +
                  '<button type="submit" class="btn mint mw-go">Let\'s go! 🪄</button>' +
                '</form>' : '') +
              '<div class="mw-row"><button class="btn yellow" data-action="to-grade">👈 Grades</button>' +
              '<button class="btn purple" data-action="board">🏆 Leaderboard</button></div>' +
            '</div>' +
          '</div>';
        const input = wrap.querySelector('.mw-name-input');
        if (input && showNewInput) { try { input.focus(); } catch (e) {} }
      }

      function choosePlayer(name) {
        name = String(name || '').replace(/\s+/g, ' ').trim().slice(0, NAME_MAX);
        if (!name) {
          const input = wrap.querySelector('.mw-name-input');
          if (input) { input.classList.remove('mw-shake'); void input.offsetWidth; input.classList.add('mw-shake'); input.focus(); }
          return;
        }
        const data = loadStore();
        const p = ensurePlayer(data, name);
        p.lastPlayed = Date.now();
        data.last = keyFor(name);
        saveStore(data);
        player = p.name;
        showNewInput = false;
        if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
        startRun();
      }

      // ===== Play =====
      function startRun() {
        resetScreen();
        screen = 'play';
        questions = makeQuestions(subject, grade);
        qIndex = 0;
        wrong = 0;
        typed = '';
        busy = false;
        runStart = Date.now();
        const data = loadStore();
        const p = ensurePlayer(data, player);
        statsFor(p, subject).runs += 1;
        p.lastPlayed = Date.now();
        saveStore(data);
        buildPlay();
        showQuestion('Hi ' + player + '! Let\'s go to the castle! 🏰');
      }

      function stonePos(i) {
        // gentle winding path: x in %, y offset in %
        return { x: i * (100 / STEPS), y: Math.round(Math.sin(i * 1.1) * 22) };
      }

      function buildPlay() {
        let stones = '';
        for (let i = 0; i <= STEPS; i++) {
          const { x, y } = stonePos(i);
          const icon = i === 0 ? '🏡' : i === STEPS ? '🏰' : '';
          stones += '<div class="mw-stone' + (i === 0 ? ' start' : i === STEPS ? ' castle' : '') + '" data-stone="' + i + '" style="left:' + x + '%;top:calc(50% + ' + y + '%)">' + icon + '</div>';
        }
        const isMath = subject === 'math';
        wrap.innerHTML =
          '<div class="mw-play' + (isMath ? '' : ' mw-mc') + '">' +
            '<div class="mw-top">' +
              '<div class="mw-hearts" aria-label="Hearts left"></div>' +
              '<div class="mw-count"></div>' +
            '</div>' +
            '<div class="mw-map"><div class="mw-track">' + stones +
              '<div class="mw-wizard" aria-label="Wizard">🧙</div>' +
            '</div></div>' +
            '<div class="mw-main">' +
              '<div class="mw-qcard">' +
                '<div class="mw-prompt"></div>' +
                '<div class="mw-visual" aria-hidden="true"></div>' +
                '<div class="mw-text"></div>' +
                '<div class="mw-eq"></div>' +
                '<div class="mw-msg" aria-live="polite"></div>' +
                (canSpeak ? '<button class="mw-speak" data-action="speak" aria-label="Read the question">🔊</button>' : '') +
              '</div>' +
              (isMath ?
                '<div class="mw-pad">' +
                  [1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => '<button class="mw-key" data-key="' + n + '">' + n + '</button>').join('') +
                  '<button class="mw-key mw-back" data-key="back" aria-label="Erase">⌫</button>' +
                  '<button class="mw-key" data-key="0">0</button>' +
                  '<button class="mw-key mw-check" data-key="check" aria-label="Check">✓</button>' +
                '</div>' :
                '<div class="mw-choices"></div>') +
            '</div>' +
            '<div class="mw-confetti-layer"></div>' +
          '</div>';
        renderHearts();
        moveWizard(false);
      }

      function el(sel) { return wrap.querySelector(sel); }

      function renderHearts(popIndex) {
        const h = el('.mw-hearts');
        if (!h) return;
        let html = '';
        for (let i = 0; i < MAX_WRONG; i++) {
          const full = i < MAX_WRONG - wrong;
          html += '<span class="mw-heart' + (full ? '' : ' gone') + (i === popIndex ? ' lose' : '') + '">' + (full ? '💖' : '🤍') + '</span>';
        }
        h.innerHTML = html;
      }

      function moveWizard(animate) {
        const wiz = el('.mw-wizard');
        if (!wiz) return;
        const { x, y } = stonePos(qIndex);
        wiz.style.transition = animate ? '' : 'none';
        wiz.style.left = x + '%';
        wiz.style.top = 'calc(50% + ' + y + '%)';
        wrap.querySelectorAll('.mw-stone').forEach(s => {
          s.classList.toggle('done', Number(s.dataset.stone) <= qIndex && Number(s.dataset.stone) > 0);
        });
        el('.mw-count').textContent = subjectById(subject).icon + ' ' + (qIndex >= STEPS ? 'Castle!' : 'Question ' + (qIndex + 1) + ' of ' + STEPS);
      }

      function setMsg(text, cls) {
        const m = el('.mw-msg');
        if (!m) return;
        m.textContent = text;
        m.className = 'mw-msg' + (cls ? ' ' + cls : '');
      }

      function showQuestion(msg) {
        busy = false;
        typed = '';
        const q = questions[qIndex];
        el('.mw-prompt').textContent = q.prompt;
        const vis = el('.mw-visual');
        vis.innerHTML = q.visual || '';
        vis.style.display = q.visual ? '' : 'none';
        const txt = el('.mw-text');
        txt.textContent = q.text || '';
        txt.style.display = q.text ? '' : 'none';
        const card = el('.mw-qcard');
        card.classList.toggle('has-text', !!q.text);
        card.classList.toggle('long-text', !!q.text && q.text.length > 80);
        card.classList.remove('mw-pop-in');
        void card.offsetWidth;
        card.classList.add('mw-pop-in');
        const eqEl = el('.mw-eq');
        if (q.kind === 'choice') {
          eqEl.style.display = 'none';
          renderChoices();
        } else {
          eqEl.style.display = '';
          renderEq();
        }
        setMsg(msg || '');
        fitPlay();
      }

      // If a question is too tall for the screen, step down sizes (no scrolling for little hands).
      function fitPlay() {
        const play = el('.mw-play');
        if (!play) return;
        play.classList.remove('mw-tight', 'mw-tighter');
        if (play.scrollHeight > play.clientHeight + 1) play.classList.add('mw-tight');
        if (play.scrollHeight > play.clientHeight + 1) play.classList.add('mw-tighter');
      }
      function onResize() { if (screen === 'play') fitPlay(); }
      window.addEventListener('resize', onResize);

      function renderChoices() {
        const q = questions[qIndex];
        const box = el('.mw-choices');
        const longest = Math.max.apply(null, q.choices.map(c => c.length));
        box.classList.toggle('one-col', longest > 16);
        box.classList.toggle('emoji-only', q.choices.every(c => c.length <= 3));
        box.innerHTML = q.choices.map((c, i) =>
          '<button class="mw-choice" data-choice="' + i + '">' + esc(c) + '</button>').join('');
      }

      function renderEq(state) {
        const q = questions[qIndex];
        const eqEl = el('.mw-eq');
        eqEl.classList.toggle('long', q.parts.length > 7 || (q.parts.length > 5 && String(q.answer).length > 2));
        eqEl.innerHTML = q.parts.map(p => {
          if (p === null) {
            return '<span class="mw-answer' + (typed ? ' filled' : '') + (state ? ' ' + state : '') + '">' + (typed ? esc(typed) : '?') + '</span>';
          }
          if (p === ',') return '<span class="mw-comma">,</span>';
          if (p === '+' || p === '−' || p === '=') return '<span class="mw-op">' + p + '</span>';
          if (p === '×' || p === '÷') return '<span class="mw-op mw-op-big">' + p + '</span>';
          if (p === 'of') return '<span class="mw-of">of</span>';
          if (typeof p === 'string' && /[½⅓¼⅕]/.test(p)) return '<span class="mw-frac">' + p + '</span>';
          return '<span class="mw-num">' + p + '</span>';
        }).join('');
      }

      function pressKey(k) {
        if (screen !== 'play' || busy) return;
        const q = questions[qIndex];
        if (!q || q.kind === 'choice') return;
        if (k === 'back') { typed = typed.slice(0, -1); renderEq(); return; }
        if (k === 'check') { check(); return; }
        if (/^[0-9]$/.test(k)) {
          if (typed.length >= MAX_DIGITS) return;
          typed = typed === '0' ? k : typed + k;
          renderEq();
          setMsg('');
        }
      }

      function check() {
        if (!typed) {
          setMsg('Tap the numbers to answer 👇');
          return;
        }
        busy = true;
        const q = questions[qIndex];
        if (Number(typed) === q.answer) onCorrect();
        else onWrong();
      }

      function pickChoice(i) {
        if (screen !== 'play' || busy) return;
        const q = questions[qIndex];
        if (!q || q.kind !== 'choice') return;
        const btn = wrap.querySelector('.mw-choice[data-choice="' + i + '"]');
        if (!btn || btn.disabled) return;
        busy = true;
        if (q.choices[i] === q.answer) {
          btn.classList.add('right');
          wrap.querySelectorAll('.mw-choice').forEach(b => { b.disabled = true; });
          onCorrect();
        } else {
          btn.classList.add('wrong');
          btn.disabled = true;
          onWrong();
        }
      }

      function onCorrect() {
        const data = loadStore();
        const p = ensurePlayer(data, player);
        statsFor(p, subject).totalCorrect += 1;
        saveStore(data);
        if (questions[qIndex].kind !== 'choice') renderEq('right');
        const cheer = pick(CHEERS);
        setMsg('🎉 ' + cheer + ' 🎉', 'good');
        speak(cheer);
        qIndex++;
        moveWizard(true);
        sparkle();
        if (qIndex >= STEPS) {
          later(showParty, 1500);
        } else {
          later(() => showQuestion(), 1400);
        }
      }

      function sparkle() {
        const wiz = el('.mw-wizard');
        if (!wiz) return;
        wiz.classList.remove('mw-hop');
        void wiz.offsetWidth;
        wiz.classList.add('mw-hop');
        const track = el('.mw-track');
        const { x, y } = stonePos(qIndex);
        for (let i = 0; i < 6; i++) {
          const s = document.createElement('span');
          s.className = 'mw-sparkle';
          s.textContent = pick(['✨', '⭐', '💫']);
          s.style.left = x + '%';
          s.style.top = 'calc(50% + ' + y + '%)';
          s.style.setProperty('--dx', (Math.random() * 120 - 60) + 'px');
          s.style.setProperty('--dy', (-30 - Math.random() * 60) + 'px');
          s.style.animationDelay = (i * 60) + 'ms';
          track.appendChild(s);
          later(() => { if (s.parentNode) s.parentNode.removeChild(s); }, 1400);
        }
      }

      function onWrong() {
        wrong++;
        renderHearts(MAX_WRONG - wrong);
        const isChoice = questions[qIndex].kind === 'choice';
        if (!isChoice) renderEq('wrong');
        const card = el('.mw-qcard');
        card.classList.remove('mw-shake');
        void card.offsetWidth;
        card.classList.add('mw-shake');
        if (wrong >= MAX_WRONG) {
          setMsg('Oh no! 💔', 'try');
          later(showStartOver, 900);
          return;
        }
        const left = MAX_WRONG - wrong;
        setMsg(pick(TRY_AGAIN) + '  (' + left + ' ' + (left === 1 ? 'heart' : 'hearts') + ' left)', 'try');
        speak('Try again!');
        later(() => {
          card.classList.remove('mw-shake');
          typed = '';
          busy = false;
          if (!isChoice) renderEq();
        }, isChoice ? 500 : 800);
      }

      function showOverlay(html) {
        const o = document.createElement('div');
        o.className = 'mw-finished';
        o.innerHTML = html;
        el('.mw-play').appendChild(o);
        return o;
      }

      function showStartOver() {
        busy = true;
        showOverlay(
          '<div class="mw-card mw-oops">' +
            '<div class="mw-big-emoji">🧙💫</div>' +
            '<h2>Oh no! Let\'s start over</h2>' +
            '<div class="mw-sub">The wizard ran out of hearts. Every try makes your magic stronger. You can do it, ' + esc(player) + '! 💕</div>' +
            '<div class="mw-row"><button class="btn mint" data-action="restart">🪄 Start over</button>' +
            '<button class="btn yellow" data-action="to-subject">📚 Subjects</button></div>' +
          '</div>');
        speak('Oh no! Let\'s start over. You can do it!');
      }

      function showParty() {
        const ms = Date.now() - runStart;
        const data = loadStore();
        const p = ensurePlayer(data, player);
        const st = statsFor(p, subject);
        const firstWin = st.wins === 0;
        const newBestMistakes = st.bestMistakes == null || wrong < st.bestMistakes;
        const newFastest = st.fastestMs == null || ms < st.fastestMs;
        st.wins += 1;
        if (newBestMistakes) st.bestMistakes = wrong;
        if (newFastest) st.fastestMs = ms;
        p.lastPlayed = Date.now();
        saveStore(data);
        const s = subjectById(subject);
        const badges = [];
        if (firstWin) badges.push('🎖️ First ' + s.label + ' castle!');
        else {
          if (newFastest) badges.push('⚡ New fastest time!');
          if (newBestMistakes) badges.push('🌟 New best!');
        }
        busy = true;
        const o = showOverlay(
          '<div class="mw-card mw-party">' +
            '<div class="mw-castle">🏰</div>' +
            '<div class="mw-party-row"><span class="mw-dance">👸</span><span>🍕</span><span class="mw-dance d2">🧙</span><span>🍕</span><span class="mw-dance d3">🤴</span></div>' +
            '<h2>Pizza party time!</h2>' +
            '<div class="mw-sub">You made it to the castle, ' + esc(player) + '! 🎉</div>' +
            '<div class="mw-stats">' +
              '<span>' + s.icon + ' ' + s.label + ' · ' + gradeById(grade).label + '</span>' +
              '<span>❌ ' + wrong + (wrong === 1 ? ' mistake' : ' mistakes') + '</span>' +
              '<span>⏱️ ' + fmtTime(ms) + '</span>' +
              '<span>🏰 ' + st.wins + ' ' + s.label + (st.wins === 1 ? ' castle' : ' castles') + '</span>' +
            '</div>' +
            (badges.length ? '<div class="mw-badges">' + badges.map(b => '<span>' + b + '</span>').join('') + '</div>' : '') +
            '<div class="mw-row">' +
              '<button class="btn purple" data-action="again">🔄 Play Again</button>' +
              '<button class="btn mint" data-action="board-party">🏆 Leaderboard</button>' +
              '<button class="btn yellow" data-action="to-subject">📚 New Subject</button>' +
            '</div>' +
          '</div>');
        spawnConfetti(o, 100);
        speak('Pizza party time! You made it to the castle, ' + player + '!');
      }

      // ===== Leaderboard =====
      function showBoard(from) {
        clearTimers();
        stopSpeech();
        if (from) boardReturn = from;
        screen = 'board';
        const data = loadStore();
        const list = ranked(data, boardFilter);
        const medals = ['🥇', '🥈', '🥉'];
        const subjectMini = p => SUBJECTS.filter(s => p.subjects && p.subjects[s.id] && p.subjects[s.id].wins > 0)
          .map(s => '<span>' + s.icon + p.subjects[s.id].wins + '</span>').join('');
        const rows = list.length ? list.map((x, i) =>
          '<div class="mw-lb-row' + (player && keyFor(x.p.name) === keyFor(player) ? ' me' : '') + (i < 3 ? ' top' : '') + '">' +
            '<span class="mw-lb-rank">' + (medals[i] || (i + 1)) + '</span>' +
            '<span class="mw-lb-name">' + esc(x.p.name) +
              (boardFilter === 'all' && subjectMini(x.p) ? '<span class="mw-lb-subs">' + subjectMini(x.p) + '</span>' : '') + '</span>' +
            '<span class="mw-lb-stat" title="Castles reached">' + x.s.wins + '</span>' +
            '<span class="mw-lb-stat" title="Fewest mistakes on a castle trip">' + (x.s.bestMistakes == null ? '—' : x.s.bestMistakes) + '</span>' +
            '<span class="mw-lb-stat" title="Fastest castle trip">' + fmtTime(x.s.fastestMs) + '</span>' +
            '<span class="mw-lb-stat mw-lb-opt" title="Right answers">' + x.s.totalCorrect + '</span>' +
            '<span class="mw-lb-stat mw-lb-opt" title="Tries">' + x.s.runs + '</span>' +
          '</div>').join('') :
          '<div class="mw-lb-empty">' + (boardFilter === 'all' ? 'No records yet. Be the first to reach the castle! 🏰' : 'No ' + subjectById(boardFilter).label + ' trips yet. 🏰') + '</div>';
        const tabs = [{ id: 'all', label: 'All', icon: '🌈' }].concat(SUBJECTS).map(s =>
          '<button class="mw-tab' + (boardFilter === s.id ? ' on' : '') + '" data-filter="' + s.id + '">' + s.icon + ' ' + s.label + '</button>').join('');
        const hasAny = Object.keys(data.players).length > 0;
        wrap.innerHTML =
          '<div class="mw-screen">' +
            '<div class="mw-card mw-board">' +
              '<h2 class="mw-title">🏆 Leaderboard</h2>' +
              '<div class="mw-tabs">' + tabs + '</div>' +
              '<div class="mw-lb">' +
                '<div class="mw-lb-row mw-lb-head">' +
                  '<span class="mw-lb-rank">#</span><span class="mw-lb-name">Player</span>' +
                  '<span class="mw-lb-stat">🏰<small>Castles</small></span>' +
                  '<span class="mw-lb-stat">❌<small>Best</small></span>' +
                  '<span class="mw-lb-stat">⏱️<small>Fastest</small></span>' +
                  '<span class="mw-lb-stat mw-lb-opt">✅<small>Right</small></span>' +
                  '<span class="mw-lb-stat mw-lb-opt">🎲<small>Tries</small></span>' +
                '</div>' + rows +
              '</div>' +
              '<div class="mw-row">' +
                '<button class="btn purple" data-action="board-back">' + (boardReturn === 'party' ? '🔄 Play Again' : '👈 Back') + '</button>' +
                '<button class="btn yellow" data-action="menu">🏠 Menu</button>' +
              '</div>' +
              (hasAny ? (confirmReset ?
                '<div class="mw-reset-confirm">Erase everyone\'s records in every subject? ' +
                  '<button class="mw-link danger" data-action="reset-yes">Yes, erase</button>' +
                  '<button class="mw-link" data-action="reset-no">No, keep</button></div>' :
                '<button class="mw-link mw-reset" data-action="reset">Reset leaderboard</button>') : '') +
            '</div>' +
          '</div>';
      }

      function boardBack() {
        if (boardReturn === 'party' && player && subject && grade) startRun();
        else if (boardReturn === 'name') showNameScreen();
        else if (boardReturn === 'grade') showGradeScreen();
        else showSubjectScreen();
      }

      // ===== Input =====
      function onClick(e) {
        const t = e.target.closest('[data-key],[data-action],[data-name],[data-choice],[data-subject],[data-grade],[data-filter]');
        if (!t || !wrap.contains(t)) return;
        const ds = t.dataset;
        if (ds.key !== undefined) { pressKey(ds.key); return; }
        if (ds.choice !== undefined) { pickChoice(Number(ds.choice)); return; }
        if (ds.subject !== undefined) { subject = ds.subject; showGradeScreen(); return; }
        if (ds.grade !== undefined) { grade = ds.grade; showNameScreen(); return; }
        if (ds.name !== undefined) { choosePlayer(ds.name); return; }
        if (ds.filter !== undefined) { boardFilter = ds.filter; confirmReset = false; showBoard(); return; }
        switch (ds.action) {
          case 'new': showNewInput = true; showNameScreen(); break;
          case 'board': boardFilter = 'all'; showBoard(screen); break;
          case 'board-party': boardFilter = subject || 'all'; showBoard('party'); break;
          case 'board-back': boardBack(); break;
          case 'to-subject': showSubjectScreen(); break;
          case 'to-grade': showGradeScreen(); break;
          case 'speak': if (questions[qIndex]) speak(questions[qIndex].say); break;
          case 'restart': startRun(); break;
          case 'again': startRun(); break;
          case 'menu': GameApp.backToMenu(); break;
          case 'reset': confirmReset = true; showBoard(); break;
          case 'reset-no': confirmReset = false; showBoard(); break;
          case 'reset-yes':
            saveStore({ version: 2, players: {}, last: null });
            confirmReset = false;
            showBoard();
            break;
        }
      }
      wrap.addEventListener('click', onClick);

      function onSubmit(e) {
        if (!e.target.classList || !e.target.classList.contains('mw-new-form')) return;
        e.preventDefault();
        const input = e.target.querySelector('.mw-name-input');
        choosePlayer(input ? input.value : '');
      }
      wrap.addEventListener('submit', onSubmit);

      function onKeyDown(e) {
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        const tag = e.target && e.target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        if (screen !== 'play') return;
        if (el('.mw-finished')) {
          if (e.key === 'Enter' && el('.mw-finished [data-action="again"], .mw-finished [data-action="restart"]')) {
            e.preventDefault();
            startRun();
          }
          return;
        }
        const q = questions[qIndex];
        if (q && q.kind === 'choice') {
          if (/^[1-4]$/.test(e.key)) { e.preventDefault(); pickChoice(Number(e.key) - 1); }
          return;
        }
        if (/^[0-9]$/.test(e.key)) { e.preventDefault(); pressKey(e.key); }
        else if (e.key === 'Backspace' || e.key === 'Delete') { e.preventDefault(); pressKey('back'); }
        else if (e.key === 'Enter' || e.key === '=') { e.preventDefault(); pressKey('check'); }
      }
      window.addEventListener('keydown', onKeyDown);

      showSubjectScreen();

      return function cleanup() {
        clearTimers();
        wrap.removeEventListener('click', onClick);
        wrap.removeEventListener('submit', onSubmit);
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('resize', onResize);
        stopSpeech();
        root.innerHTML = '';
      };
    },
  });
})();
