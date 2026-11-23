(function () {
  // ===================================================================
  // Dress-Up Studio: build an avatar, dress it up, pick a place, save it.
  // Everything is drawn with inline SVG so it works offline.
  // ===================================================================

  const STORE_KEY = 'henleyParker.dressUp.looks.v1';
  const CURRENT_KEY = 'henleyParker.dressUp.current.v1';

  // ---------- Palettes ----------
  const SKINS = ['#ffe3cc', '#f9d3b4', '#f1c27d', '#e0ac69', '#c68642', '#a86b3c', '#8d5524', '#6b3e1f', '#4a2a14'];
  const HAIR_COLORS = ['#22160f', '#4a2c1a', '#7b4a2a', '#a0442a', '#d4622a', '#e8c46a', '#f3e6c0', '#b8b8b8',
    '#ff7fc4', '#a86fff', '#4fa8ff', '#3fd18b', 'rainbow'];
  const EYE_COLORS = ['#5b3a1e', '#22160f', '#3d7be0', '#3aa15c', '#8a6b2e', '#7d8a99', '#a86fff'];
  const CLOTH = ['#ff4d5e', '#ff9a3c', '#ffd84d', '#3fd18b', '#2ec4c4', '#4fa8ff', '#2b3f8f', '#a86fff',
    '#ff6fb5', '#ffffff', '#3a3a44', '#9aa0a8', '#8b5a2b', 'rainbow'];
  const NAILS = ['none', '#ff3b5c', '#ff6fb5', '#ffb3d9', '#a86fff', '#4fa8ff', '#2ec4c4', '#3fd18b',
    '#ffd84d', '#ff9a3c', '#222222', '#ffffff', '#f5c542', 'rainbow'];
  const METALS = { gold: '#f5c542', silver: '#d9dde3', rose: '#f2a7a0' };
  const GEMS = ['#ff6fb5', '#ff4d5e', '#4fa8ff', '#3fd18b', '#a86fff', '#ffffff', 'rainbow'];
  const RAINBOW = ['#ff4d5e', '#ff9a3c', '#ffd84d', '#3fd18b', '#4fa8ff', '#a86fff'];

  // ---------- Option lists (ids only; art lives in the draw functions) ----------
  const HAIR_STYLES = ['short', 'spiky', 'curly', 'long', 'ponytail', 'buns', 'braids', 'bob', 'mohawk', 'bald'];
  const EYES = ['round', 'sparkle', 'lashes', 'happy', 'wink', 'stars'];
  const MOUTHS = ['smile', 'grin', 'open', 'tongue', 'smirk'];
  const FACE_EXTRAS = ['cheeks', 'freckles', 'starSticker', 'heartSticker'];
  const TOPS = ['tee', 'tank', 'stripes', 'hoodie', 'jersey', 'star', 'sweater', 'collar'];
  const BOTTOMS = ['pants', 'shorts', 'skirt', 'tutu', 'leggings', 'overalls', 'track'];
  const DRESSES = ['none', 'gown', 'sundress', 'twirl', 'jumpsuit', 'robe'];
  const SHOES = ['sneakers', 'hightop', 'cleats', 'boots', 'rain', 'sandals', 'flats', 'none'];
  const HATS = ['none', 'cap', 'beanie', 'cowboy', 'tophat', 'wizard', 'party', 'flowers', 'bow', 'astro'];
  const EYEWEAR = ['none', 'glasses', 'sunglasses', 'hearts', 'stars', 'goggles'];
  const EXTRAS = [
    { id: 'cape', emoji: '🦸' }, { id: 'wings', emoji: '🦋' }, { id: 'scarf', emoji: '🧣' },
    { id: 'backpack', emoji: '🎒' }, { id: 'bowtie', emoji: '🎀' }, { id: 'medal', emoji: '🏅' },
  ];
  const JEWELRY = [
    { id: 'necklace', crop: '112 146 76 62' }, { id: 'pearls', crop: '112 146 76 62' },
    { id: 'earrings', crop: '86 92 128 50' }, { id: 'bracelet', crop: '58 236 56 60' },
    { id: 'watch', crop: '186 236 56 60' }, { id: 'ring', crop: '60 260 50 46' },
    { id: 'crown', emoji: '👑' }, { id: 'tiara', crop: '100 26 100 60' },
  ];
  const SCENES = [
    { id: 'studio', icon: '✨' }, { id: 'beach', icon: '🏖️' }, { id: 'castle', icon: '🏰' },
    { id: 'space', icon: '🚀' }, { id: 'city', icon: '🏙️' }, { id: 'forest', icon: '🌲' },
    { id: 'stage', icon: '🎤' }, { id: 'snow', icon: '🏔️' }, { id: 'ocean', icon: '🐠' },
    { id: 'rainbow', icon: '🌈' }, { id: 'field', icon: '⚽' },
  ];
  const NAME_EMOJI = ['⭐', '🦄', '🌈', '💖', '🐶', '🐱', '⚽', '🚀', '🦖', '🌸', '👑', '🍕'];

  function defaultLook() {
    return {
      skin: '#e0ac69', hairStyle: 'short', hairColor: '#4a2c1a',
      eyes: 'round', eyeColor: '#5b3a1e', mouth: 'smile', faceExtras: ['cheeks'],
      top: 'tee', topColor: '#4fa8ff', bottom: 'pants', bottomColor: '#2b3f8f',
      dress: 'none', dressColor: '#ff6fb5', shoes: 'sneakers', shoesColor: '#ff4d5e',
      hat: 'none', hatColor: '#ffd84d', eyewear: 'none',
      extras: [], extrasColor: '#a86fff', jewelry: [], metal: 'gold', gem: '#ff6fb5',
      nails: 'none', scene: 'studio',
    };
  }

  // Fill in anything missing (e.g. looks saved by an older version).
  function normalize(raw) {
    const base = defaultLook();
    const out = Object.assign({}, base);
    if (raw && typeof raw === 'object') {
      Object.keys(base).forEach(k => {
        if (raw[k] === undefined || raw[k] === null) return;
        if (Array.isArray(base[k])) { if (Array.isArray(raw[k])) out[k] = raw[k].slice(); }
        else if (typeof raw[k] === typeof base[k]) out[k] = raw[k];
      });
    }
    return out;
  }

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  // ---------- Small SVG helpers ----------
  let uidCounter = 0;

  function shade(hex, amt) {
    if (typeof hex !== 'string' || hex[0] !== '#') return '#7a4fd6';
    let h = hex.slice(1);
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const n = parseInt(h, 16);
    if (isNaN(n)) return hex;
    const f = amt / 100;
    const adj = v => Math.max(0, Math.min(255, Math.round(f < 0 ? v * (1 + f) : v + (255 - v) * f)));
    const r = adj((n >> 16) & 255), g = adj((n >> 8) & 255), b = adj(n & 255);
    return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
  }

  function makeCtx() {
    const uid = 'du' + (++uidCounter);
    return {
      uid,
      id: name => uid + name,
      url: name => 'url(#' + uid + name + ')',
      p: c => (c === 'rainbow' ? 'url(#' + uid + 'rb)' : c),
      d: (c, amt) => (c === 'rainbow' ? '#7a4fd6' : shade(c, amt == null ? -22 : amt)),
    };
  }

  // Readable contrast color for a decoration on top of color c.
  function contrast(c) {
    if (c === 'rainbow') return '#ffffff';
    const h = c.replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map(x => x + x).join('') : h, 16);
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return (r * 0.299 + g * 0.587 + b * 0.114) > 170 ? '#3a2545' : '#ffffff';
  }

  function circ(x, y, r, fill, extra) {
    return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + fill + '"' + (extra || '') + '/>';
  }
  function ell(x, y, rx, ry, fill, extra) {
    return '<ellipse cx="' + x + '" cy="' + y + '" rx="' + rx + '" ry="' + ry + '" fill="' + fill + '"' + (extra || '') + '/>';
  }
  function path(d, fill, extra) {
    return '<path d="' + d + '" fill="' + fill + '"' + (extra || '') + '/>';
  }
  function rect(x, y, w, h, fill, extra) {
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + fill + '"' + (extra || '') + '/>';
  }
  function line(x1, y1, x2, y2, stroke, w, extra) {
    return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + stroke +
      '" stroke-width="' + w + '" stroke-linecap="round"' + (extra || '') + '/>';
  }
  function starPts(cx, cy, R, r, n) {
    n = n || 5;
    const pts = [];
    for (let i = 0; i < n * 2; i++) {
      const a = -Math.PI / 2 + i * Math.PI / n;
      const rad = i % 2 ? r : R;
      pts.push((cx + Math.cos(a) * rad).toFixed(1) + ',' + (cy + Math.sin(a) * rad).toFixed(1));
    }
    return pts.join(' ');
  }
  function star(cx, cy, R, fill, extra) {
    return '<polygon points="' + starPts(cx, cy, R, R * 0.45) + '" fill="' + fill + '"' + (extra || '') + '/>';
  }
  function heart(cx, cy, s, fill, extra) {
    const d = 'M' + cx + ',' + (cy + s * 0.9) +
      ' C' + (cx - s * 1.4) + ',' + (cy - s * 0.1) + ' ' + (cx - s * 0.7) + ',' + (cy - s * 1.1) + ' ' + cx + ',' + (cy - s * 0.35) +
      ' C' + (cx + s * 0.7) + ',' + (cy - s * 1.1) + ' ' + (cx + s * 1.4) + ',' + (cy - s * 0.1) + ' ' + cx + ',' + (cy + s * 0.9) + ' Z';
    return path(d, fill, extra);
  }
  function rng(seed) {
    let s = seed;
    return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  }
  function grad(id, stops, x1, y1, x2, y2) {
    return '<linearGradient id="' + id + '" gradientUnits="userSpaceOnUse" x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '">' +
      stops.map((c, i) => '<stop offset="' + (i / (stops.length - 1)) + '" stop-color="' + c + '"/>').join('') +
      '</linearGradient>';
  }

  // ===================================================================
  // Avatar art. Coordinate space: 300 x 400, avatar centered at x=150.
  // ===================================================================

  function hairBack(style, c) {
    switch (style) {
      case 'long': return path('M97,104 Q95,42 150,42 Q205,42 203,104 L212,236 Q150,250 88,236 Z', c);
      case 'bob': return path('M95,104 Q93,42 150,42 Q207,42 205,104 L208,164 Q150,178 92,164 Z', c);
      case 'curly': {
        let s = circ(150, 96, 66, c);
        for (let i = 0; i < 14; i++) {
          const a = i / 14 * Math.PI * 2;
          s += circ((150 + Math.cos(a) * 62).toFixed(1), (96 + Math.sin(a) * 60).toFixed(1), 17, c);
        }
        return s;
      }
      case 'ponytail':
        return ell(210, 128, 17, 44, c, ' transform="rotate(-18 210 128)"') + circ(197, 86, 7, '#ff6fb5');
      case 'buns': return circ(106, 58, 21, c) + circ(194, 58, 21, c);
      default: return '';
    }
  }

  function hairFront(style, c) {
    const cap = 'M100,102 Q98,48 150,48 Q202,48 200,102 Q190,70 150,68 Q110,70 100,102 Z';
    switch (style) {
      case 'short': return path('M98,106 Q96,44 150,44 Q204,44 202,106 Q194,70 150,68 Q106,70 98,106 Z', c);
      case 'spiky':
        return path('M98,102 L100,62 L114,72 L118,42 L134,62 L148,34 L162,60 L178,40 L182,68 L198,58 L202,102 Q188,74 150,72 Q112,74 98,102 Z', c);
      case 'curly': {
        let s = path('M100,100 Q98,48 150,48 Q202,48 200,100 Q190,74 150,72 Q110,74 100,100 Z', c);
        for (let a = -168; a <= -12; a += 22) {
          const r = a * Math.PI / 180;
          s += circ((150 + Math.cos(r) * 47).toFixed(1), (104 + Math.sin(r) * 44).toFixed(1), 13, c);
        }
        return s;
      }
      case 'long': return path('M98,110 Q96,44 150,44 Q204,44 202,110 Q196,74 168,68 Q128,86 98,110 Z', c);
      case 'bob': return path('M98,104 Q98,44 150,44 Q202,44 202,104 L200,86 Q150,78 100,86 Z', c);
      case 'ponytail': return path(cap, c);
      case 'buns':
      case 'braids': {
        let s = path(cap, c) + line(150, 50, 150, 68, 'rgba(0,0,0,0.25)', 2);
        if (style === 'braids') {
          for (const side of [-1, 1]) {
            const x = 150 + side * 50;
            for (let i = 0; i < 7; i++) s += ell(x + side * (i * 0.6), 128 + i * 15, 10, 9, c, ' stroke="rgba(0,0,0,0.18)" stroke-width="1.5"');
            s += circ(x + side * 4, 232, 6, '#ff6fb5');
          }
        }
        return s;
      }
      case 'mohawk':
        return path(cap, c, ' opacity="0.35"') + path('M140,72 L135,24 L150,14 L165,24 L160,72 Z', c);
      default: return '';
    }
  }

  function eyes(style, color) {
    const dark = '#2a1a22';
    const one = (x, kind) => {
      if (kind === 'happy') return path('M' + (x - 9) + ',110 Q' + x + ',99 ' + (x + 9) + ',110', 'none', ' stroke="' + dark + '" stroke-width="3.5" stroke-linecap="round"');
      if (kind === 'stars') return star(x, 108, 10, '#ffd84d', ' stroke="#e0a800" stroke-width="1.5"');
      const big = kind === 'sparkle';
      let s = ell(x, 108, 9.5, 10.5, '#ffffff', ' stroke="rgba(0,0,0,0.12)" stroke-width="1"');
      s += circ(x, 109, big ? 7.5 : 6.2, color) + circ(x, 109, big ? 3.6 : 3, dark);
      s += circ(x + 2.5, 106, big ? 2.6 : 1.9, '#ffffff');
      if (big) s += circ(x - 2.5, 112, 1.3, '#ffffff');
      if (kind === 'lashes') {
        const o = x < 150 ? -1 : 1;
        s += line(x + o * 6, 100, x + o * 11, 95, dark, 2.2) + line(x + o * 9, 104, x + o * 14, 100, dark, 2.2) + line(x, 98, x + o * 2, 92, dark, 2.2);
      }
      return s;
    };
    if (style === 'wink') return one(132, 'round') + one(168, 'happy');
    return one(132, style) + one(168, style);
  }

  function mouth(style) {
    const dark = '#7a2b3a';
    const strokeAttr = ' stroke="' + dark + '" stroke-width="3.5" stroke-linecap="round"';
    switch (style) {
      case 'grin':
        return path('M136,124 Q150,146 164,124 Z', dark) + path('M139,125 L161,125 L159,130 L141,130 Z', '#ffffff');
      case 'open': return ell(150, 131, 7, 8, dark) + ell(150, 135, 4.5, 3, '#ff8fa8');
      case 'tongue': return path('M138,126 Q150,138 162,126', 'none', strokeAttr) + path('M145,131 Q150,144 155,131 Z', '#ff6f91');
      case 'smirk': return path('M138,130 Q152,136 163,124', 'none', strokeAttr);
      default: return path('M137,125 Q150,139 163,125', 'none', strokeAttr);
    }
  }

  function faceExtras(list) {
    let s = '';
    if (list.indexOf('cheeks') !== -1) s += ell(120, 124, 9, 6, '#ff6f91', ' opacity="0.4"') + ell(180, 124, 9, 6, '#ff6f91', ' opacity="0.4"');
    if (list.indexOf('freckles') !== -1) {
      [[118, 118], [124, 122], [114, 124], [182, 118], [176, 122], [186, 124]].forEach(p => { s += circ(p[0], p[1], 1.6, '#8b5a2b', ' opacity="0.7"'); });
    }
    if (list.indexOf('starSticker') !== -1) s += star(186, 134, 7, '#ffd84d', ' stroke="#e0a800" stroke-width="1"');
    if (list.indexOf('heartSticker') !== -1) s += heart(114, 134, 6, '#ff4d8d');
    return s;
  }

  // Cartoon hand with four fingers + thumb; every fingertip gets a nail.
  function hand(cx, cy, side, L) {
    const skin = L.skin, sd = shade(skin, -14);
    const fingers = [[-10.5, 12], [-3.5, 15], [3.5, 15], [10.5, 12]];
    const thumb = [cx + side * 13, cy - 2];
    let s = circ(cx, cy, 15, skin, ' stroke="' + sd + '" stroke-width="1.5"');
    s += circ(thumb[0], thumb[1], 6, skin, ' stroke="' + sd + '" stroke-width="1.2"');
    fingers.forEach(f => { s += circ(cx + f[0], cy + f[1], 5.5, skin, ' stroke="' + sd + '" stroke-width="1.2"'); });
    const nailPts = fingers.map(f => [cx + f[0], cy + f[1] + 1.6]).concat([[thumb[0] + side, thumb[1] + 1.5]]);
    nailPts.forEach((pt, i) => {
      let col;
      if (L.nails === 'none') col = shade(skin, 30);
      else if (L.nails === 'rainbow') col = RAINBOW[(i + (side > 0 ? 0 : 2)) % RAINBOW.length];
      else col = L.nails;
      s += ell(pt[0], pt[1], 3.4, 3.9, col, L.nails === 'none' ? '' : ' stroke="' + shade(col, -30) + '" stroke-width="0.8"');
      if (L.nails !== 'none') s += circ(pt[0] - 1, pt[1] - 1.4, 0.9, '#ffffff', ' opacity="0.85"');
    });
    return s;
  }

  // ----- Tops -----
  const TOP_BODY = 'M106,168 Q126,160 138,162 Q150,176 162,162 Q174,160 194,168 L200,266 Q150,274 100,266 Z';
  function sleeves(kind, c, w) {
    w = w || 26;
    const e = kind === 'long' ? [[89, 252], [211, 252]] : [[100, 212], [200, 212]];
    return line(110, 176, e[0][0], e[0][1], c, w) + line(190, 176, e[1][0], e[1][1], c, w);
  }
  function stripeBand(y, h, fill, extra) {
    const x = 106 - (y - 166) * 0.06;
    const w = 88 + 2 * (y - 166) * 0.06;
    return rect(x.toFixed(1), y, w.toFixed(1), h, fill, extra);
  }
  function neckline(d, w) {
    return path('M138,162 Q150,176 162,162', 'none', ' stroke="' + d + '" stroke-width="' + (w || 3) + '"');
  }

  function topPart(style, color, C) {
    const c = C.p(color), d = C.d(color), k = contrast(color);
    switch (style) {
      case 'tank':
        return path('M116,166 L130,166 L134,178 Q150,188 166,178 L170,166 L184,166 L198,266 Q150,274 102,266 Z', c, ' stroke="' + d + '" stroke-width="2"');
      case 'stripes':
        return sleeves('long', c) + path(TOP_BODY, c) +
          [186, 208, 230, 252].map(y => stripeBand(y, 9, '#ffffff', ' opacity="0.75"')).join('') +
          line(92, 228, 95, 216, '#ffffff', 22, ' opacity="0.5"') + line(208, 228, 205, 216, '#ffffff', 22, ' opacity="0.5"');
      case 'hoodie':
        return sleeves('long', c) + path(TOP_BODY, c) +
          path('M116,166 Q150,196 184,166 Q182,152 150,150 Q118,152 116,166 Z', d) +
          path('M122,228 L178,228 L172,256 L128,256 Z', d) +
          line(142, 176, 140, 204, '#ffffff', 2.5) + line(158, 176, 160, 204, '#ffffff', 2.5) +
          circ(140, 206, 2.5, '#ffffff') + circ(160, 206, 2.5, '#ffffff');
      case 'jersey':
        return sleeves('short', c, 30) + path(TOP_BODY, c) + stripeBand(250, 6, k, ' opacity="0.8"') +
          path('M138,162 L150,184 L162,162', 'none', ' stroke="' + k + '" stroke-width="5" stroke-linejoin="round"') +
          '<text x="150" y="240" font-size="44" font-weight="900" text-anchor="middle" fill="' + k +
          '" font-family="Arial Black, Arial, sans-serif">6</text>';
      case 'star':
        return sleeves('short', c) + path(TOP_BODY, c) +
          star(150, 214, 24, color === '#ffd84d' ? '#ffffff' : '#ffd84d', ' stroke="' + d + '" stroke-width="2"') + neckline(d);
      case 'sweater':
        return sleeves('long', c) + path(TOP_BODY, c) +
          heart(150, 214, 15, color === '#ff4d5e' ? '#ffffff' : '#ff4d5e') +
          stripeBand(256, 10, d) + line(89, 250, 90, 246, d, 26) + line(211, 250, 210, 246, d, 26) + neckline(d, 5);
      case 'collar':
        return sleeves('short', c) + path(TOP_BODY, c) +
          line(150, 176, 150, 266, d, 2) +
          [192, 214, 236].map(y => circ(152, y, 2.6, k)).join('') +
          path('M136,160 L150,178 L128,184 Z', '#ffffff', ' stroke="' + d + '" stroke-width="1.5"') +
          path('M164,160 L150,178 L172,184 Z', '#ffffff', ' stroke="' + d + '" stroke-width="1.5"');
      default: // tee
        return sleeves('short', c) + path(TOP_BODY, c) + neckline(d);
    }
  }

  // ----- Bottoms -----
  const PANTS = 'M102,256 L198,256 L190,376 L156,376 L150,292 L144,376 L110,376 Z';
  function bottomPart(style, color, C) {
    const c = C.p(color), d = C.d(color);
    const band = rect(102, 254, 96, 9, d, ' rx="4"');
    switch (style) {
      case 'shorts': return path('M102,256 L198,256 L195,314 L154,314 L150,286 L146,314 L105,314 Z', c) + band;
      case 'skirt': return path('M106,256 L194,256 L214,326 Q150,338 86,326 Z', c) + band +
        line(130, 268, 120, 326, d, 1.5, ' opacity="0.6"') + line(170, 268, 180, 326, d, 1.5, ' opacity="0.6"');
      case 'tutu': {
        let s = '';
        for (let i = 0; i < 9; i++) s += circ(94 + i * 14, 296, 15, c, ' opacity="0.85"');
        for (let i = 0; i < 8; i++) s += circ(101 + i * 14, 282, 14, shade(color === 'rainbow' ? '#a86fff' : color, 25));
        return s + band;
      }
      case 'leggings': {
        let s = path('M110,256 L190,256 L182,378 L156,378 L150,292 L144,378 L118,378 Z', c) + band;
        [[126, 290], [174, 300], [132, 330], [168, 340], [128, 362], [172, 366]].forEach(p => { s += star(p[0], p[1], 4, '#ffffff', ' opacity="0.8"'); });
        return s;
      }
      case 'track':
        return path(PANTS, c) + band + line(106, 264, 113, 372, '#ffffff', 4) + line(194, 264, 187, 372, '#ffffff', 4);
      case 'overalls':
        return path(PANTS, c) + line(150, 300, 150, 376, d, 1.5, ' opacity="0.5"');
      default: return path(PANTS, c) + band;
    }
  }
  function bottomOver(style, color, C) {
    if (style !== 'overalls') return '';
    const c = C.p(color), d = C.d(color);
    return rect(122, 200, 56, 62, c, ' rx="6"') + rect(136, 212, 28, 18, d, ' rx="4"') +
      line(126, 204, 118, 168, c, 7) + line(174, 204, 182, 168, c, 7) +
      circ(128, 206, 3.5, '#ffd84d') + circ(172, 206, 3.5, '#ffd84d');
  }

  // ----- One-piece outfits -----
  function dressPart(style, color, C) {
    const c = C.p(color), d = C.d(color), k = contrast(color);
    const solid = color === 'rainbow' ? '#a86fff' : color;
    switch (style) {
      case 'gown': {
        let s = circ(112, 176, 15, shade(solid, 20)) + circ(188, 176, 15, shade(solid, 20));
        s += path('M108,166 Q126,160 138,162 Q150,176 162,162 Q174,160 192,166 L186,248 L238,380 Q150,396 62,380 L114,248 Z', c);
        s += rect(112, 242, 76, 10, d, ' rx="5"') + heart(150, 247, 6, k);
        [[100, 330], [130, 300], [170, 320], [200, 350], [150, 360], [120, 368], [184, 290]].forEach(p => { s += star(p[0], p[1], 5, '#ffffff', ' opacity="0.85"'); });
        return s;
      }
      case 'sundress':
        return line(124, 162, 126, 182, c, 6) + line(176, 162, 174, 182, c, 6) +
          path('M116,178 Q150,190 184,178 L188,250 L216,332 Q150,346 84,332 L112,250 Z', c) +
          [[118, 300], [150, 280], [182, 304], [134, 324], [166, 326], [150, 214]].map(p =>
            circ(p[0], p[1], 5, k, ' opacity="0.85"') + circ(p[0], p[1], 2, '#ffd84d')).join('');
      case 'twirl': {
        let s = sleeves('short', c) + path('M106,168 Q126,160 138,162 Q150,176 162,162 Q174,160 194,168 L190,250 L110,250 Z', c);
        const light = shade(color === 'rainbow' ? '#ff6fb5' : color, 30);
        for (let i = 0; i < 10; i++) s += circ(88 + i * 13.8, 306, 16, c);
        for (let i = 0; i < 9; i++) s += circ(95 + i * 13.8, 286, 15, light);
        for (let i = 0; i < 8; i++) s += circ(102 + i * 13.8, 266, 14, c);
        [[120, 300], [160, 296], [140, 272], [180, 270], [104, 276], [196, 300]].forEach(p => { s += circ(p[0], p[1], 3.5, k, ' opacity="0.8"'); });
        return s + rect(110, 244, 80, 9, d, ' rx="4"');
      }
      case 'jumpsuit':
        return sleeves('short', c) + path(PANTS, c) + path(TOP_BODY, c) + rect(102, 252, 96, 10, d, ' rx="4"') +
          rect(162, 270, 22, 20, d, ' rx="4"') + line(150, 176, 150, 252, d, 2) + neckline(d);
      case 'robe': {
        let s = sleeves('long', c, 32) + path('M106,168 Q126,160 138,162 Q150,176 162,162 Q174,160 194,168 L214,374 Q150,386 86,374 Z', c);
        s += path('M86,374 Q150,386 214,374 L212,362 Q150,374 88,362 Z', d);
        [[124, 214], [174, 236], [130, 290], [170, 314], [146, 346], [190, 352], [110, 340]].forEach(p => { s += star(p[0], p[1], 7, '#ffd84d'); });
        return s;
      }
      default: return '';
    }
  }

  // ----- Shoes -----
  function shoesPart(style, color, skin, C) {
    const c = C.p(color), d = C.d(color);
    const footLine = ' stroke="' + shade(skin, -14) + '" stroke-width="1.2"';
    let s = '';
    [[132, -1], [168, 1]].forEach(f => {
      const x = f[0], dir = f[1], fx = x + dir * 4;
      switch (style) {
        case 'none':
          s += ell(x + dir * 3, 382, 15, 8, skin, footLine);
          break;
        case 'boots':
          s += rect(x - 14, 336, 28, 46, c, ' rx="6"') + ell(fx + dir * 2, 382, 19, 10, c) + rect(fx - 19, 386, 40, 6, d, ' rx="3"') + rect(x - 15, 336, 30, 7, d, ' rx="3"');
          break;
        case 'rain':
          s += rect(x - 15, 324, 30, 58, c, ' rx="10"') + ell(fx + dir * 2, 382, 19, 10, c) + rect(fx - 19, 386, 40, 6, d, ' rx="3"') +
            rect(x - 9, 332, 5, 36, '#ffffff', ' rx="2.5" opacity="0.45"');
          break;
        case 'sandals':
          s += ell(x + dir * 3, 381, 15, 8, skin, footLine) + rect(x + dir * 3 - 17, 386, 34, 5, d, ' rx="2.5"') +
            line(x + dir * 3 - 11, 378, x + dir * 3 + 11, 378, c, 4) + line(x, 372, x + dir * 3, 384, c, 4);
          break;
        case 'flats':
          s += ell(x + dir * 3, 380, 14, 7, skin) + ell(x + dir * 3, 386, 17, 7, c) + circ(x + dir * 8, 381, 3.5, d);
          break;
        case 'hightop':
          s += rect(x - 14, 352, 28, 32, c, ' rx="8"') + ell(fx, 383, 19, 10, c) + ell(fx + dir * 11, 385, 8, 6.5, '#ffffff') +
            rect(fx - 20, 387, 40, 6, '#ffffff', ' rx="3"') + circ(x, 366, 5, '#ffffff') + star(x, 366, 4, c);
          break;
        case 'cleats':
          s += ell(fx, 382, 19, 10, c) + rect(fx - 19, 386, 38, 5, '#3a3a44', ' rx="2.5"') +
            [-12, -4, 4, 12].map(o => path('M' + (fx + o - 2.5) + ',391 L' + (fx + o) + ',396 L' + (fx + o + 2.5) + ',391 Z', '#3a3a44')).join('') +
            line(fx - 8, 378, fx + 8, 378, '#ffffff', 2.5);
          break;
        default: // sneakers
          s += ell(fx, 382, 19, 11, c) + rect(fx - 19, 386, 38, 6, '#ffffff', ' rx="3"') +
            line(fx - 6, 377, fx + 4, 375, '#ffffff', 2) + line(fx - 6, 381, fx + 4, 379, '#ffffff', 2);
      }
    });
    return s;
  }

  // ----- Hats -----
  function hatPart(style, color, C) {
    const c = C.p(color), d = C.d(color), k = contrast(color);
    switch (style) {
      case 'cap':
        return path('M98,96 Q98,44 150,44 Q202,44 202,96 Z', c) + path('M94,96 Q150,82 206,96 Q208,112 150,106 Q92,112 94,96 Z', d) + circ(150, 46, 5, d);
      case 'beanie':
        return path('M98,98 Q98,40 150,40 Q202,40 202,98 Z', c) + rect(94, 82, 112, 20, d, ' rx="10"') + circ(150, 38, 12, '#ffffff') +
          line(125, 50, 122, 80, d, 2, ' opacity="0.5"') + line(150, 44, 150, 80, d, 2, ' opacity="0.5"') + line(175, 50, 178, 80, d, 2, ' opacity="0.5"');
      case 'cowboy':
        return path('M112,76 Q108,30 136,34 Q150,42 164,34 Q192,30 188,76 Z', c) + rect(112, 60, 76, 9, d) +
          ell(150, 76, 84, 13, c, ' stroke="' + d + '" stroke-width="2"');
      case 'tophat':
        return rect(116, 8, 68, 58, c, ' rx="4"') + rect(116, 50, 68, 10, '#ff4d5e') + ell(150, 66, 62, 10, c, ' stroke="' + d + '" stroke-width="2"');
      case 'wizard':
        return path('M98,74 L156,2 L202,74 Z', c) + ell(150, 74, 64, 11, d) + star(150, 46, 9, '#ffd84d') + star(174, 62, 5, '#ffd84d') + star(134, 34, 5, '#ffd84d');
      case 'party':
        return path('M122,64 L150,2 L178,64 Z', c) + path('M136,32 L164,32 L168,42 L132,42 Z', k, ' opacity="0.6"') +
          path('M128,52 L172,52 L176,62 L124,62 Z', k, ' opacity="0.6"') + circ(150, 4, 7, '#ffd84d');
      case 'flowers': {
        let s = path('M100,74 Q150,46 200,74', 'none', ' stroke="#3fd18b" stroke-width="5"');
        const cols = [color === 'rainbow' ? '#ff4d5e' : color, '#ffffff', '#ffd84d', '#ff6fb5', '#a86fff'];
        [[104, 72], [124, 60], [150, 55], [176, 60], [196, 72]].forEach((p, i) => {
          for (let j = 0; j < 5; j++) {
            const a = j / 5 * Math.PI * 2;
            s += circ((p[0] + Math.cos(a) * 6).toFixed(1), (p[1] + Math.sin(a) * 6).toFixed(1), 5, cols[i % cols.length]);
          }
          s += circ(p[0], p[1], 4, '#ffb000');
        });
        return s;
      }
      case 'bow':
        return path('M178,66 L158,50 L160,84 Z', c) + path('M178,66 L198,50 L196,84 Z', c) + circ(178, 66, 7, d);
      case 'astro':
        return circ(150, 104, 68, '#bfe6ff', ' fill-opacity="0.28" stroke="#ffffff" stroke-width="7"') +
          path('M104,72 Q118,52 140,46', 'none', ' stroke="#ffffff" stroke-width="6" stroke-linecap="round" opacity="0.8"') +
          line(150, 36, 150, 18, '#d9dde3', 4) + circ(150, 16, 6, '#ff4d5e');
      default: return '';
    }
  }

  // ----- Glasses -----
  function eyewearPart(style) {
    const bridge = line(142, 106, 158, 106, '#3a2545', 3);
    switch (style) {
      case 'glasses':
        return circ(132, 108, 14, 'rgba(255,255,255,0.18)', ' stroke="#3a2545" stroke-width="3"') +
          circ(168, 108, 14, 'rgba(255,255,255,0.18)', ' stroke="#3a2545" stroke-width="3"') + bridge +
          line(118, 106, 104, 104, '#3a2545', 3) + line(182, 106, 196, 104, '#3a2545', 3);
      case 'sunglasses':
        return rect(115, 97, 33, 22, '#1d1d28', ' rx="8"') + rect(152, 97, 33, 22, '#1d1d28', ' rx="8"') + bridge +
          line(120, 102, 128, 102, '#ffffff', 2.5, ' opacity="0.6"') + line(157, 102, 165, 102, '#ffffff', 2.5, ' opacity="0.6"') +
          line(115, 104, 104, 102, '#1d1d28', 3) + line(185, 104, 196, 102, '#1d1d28', 3);
      case 'hearts':
        return heart(132, 108, 15, '#ff4d8d', ' opacity="0.9" stroke="#c2185b" stroke-width="2"') +
          heart(168, 108, 15, '#ff4d8d', ' opacity="0.9" stroke="#c2185b" stroke-width="2"') + bridge;
      case 'stars':
        return star(132, 108, 17, '#ffd84d', ' opacity="0.92" stroke="#e0a800" stroke-width="2"') +
          star(168, 108, 17, '#ffd84d', ' opacity="0.92" stroke="#e0a800" stroke-width="2"') + bridge;
      case 'goggles':
        return line(100, 106, 200, 106, '#ff6fb5', 9) + rect(116, 93, 68, 28, '#8fe3ff', ' rx="14" opacity="0.75" stroke="#ffffff" stroke-width="4"') +
          line(126, 100, 140, 100, '#ffffff', 3, ' opacity="0.8"');
      default: return '';
    }
  }

  // ----- Extras -----
  function extrasBack(list, color, C) {
    const c = C.p(color), d = C.d(color);
    const wing = ' opacity="0.8" stroke="#ffffff" stroke-width="3"';
    let s = '';
    if (list.indexOf('wings') !== -1) {
      s += ell(92, 196, 46, 30, '#ffb3e6', wing + ' transform="rotate(-28 92 196)"') +
        ell(208, 196, 46, 30, '#b3d9ff', wing + ' transform="rotate(28 208 196)"') +
        ell(104, 244, 28, 18, '#d9b3ff', wing + ' transform="rotate(25 104 244)"') +
        ell(196, 244, 28, 18, '#ffe9a8', wing + ' transform="rotate(-25 196 244)"');
    }
    if (list.indexOf('cape') !== -1) s += path('M114,166 L186,166 L224,372 Q150,388 76,372 Z', c) + path('M114,166 L186,166 L180,178 L120,178 Z', d);
    if (list.indexOf('backpack') !== -1) s += rect(94, 180, 112, 82, d, ' rx="18"');
    return s;
  }
  function extrasFront(list, color, C) {
    const c = C.p(color), d = C.d(color);
    let s = '';
    if (list.indexOf('backpack') !== -1) s += line(124, 168, 121, 244, c, 7) + line(176, 168, 179, 244, c, 7);
    if (list.indexOf('cape') !== -1) s += path('M128,164 L142,172 L132,180 Z', c) + path('M172,164 L158,172 L168,180 Z', c) + circ(150, 170, 6, '#ffd84d');
    if (list.indexOf('medal') !== -1) {
      s += path('M136,162 L150,206 L164,162', 'none', ' stroke="#4fa8ff" stroke-width="6" stroke-linejoin="round"') +
        circ(150, 212, 11, '#f5c542', ' stroke="#d19a00" stroke-width="2"') + star(150, 212, 6, '#fff3b0');
    }
    if (list.indexOf('scarf') !== -1) {
      s += rect(118, 150, 64, 20, c, ' rx="10"') + rect(156, 160, 17, 52, c, ' rx="6"') +
        line(158, 196, 171, 196, d, 3) + line(158, 204, 171, 204, d, 3) + line(124, 158, 176, 158, d, 2, ' opacity="0.4"');
    }
    if (list.indexOf('bowtie') !== -1) {
      s += path('M150,170 L132,160 L132,180 Z', c) + path('M150,170 L168,160 L168,180 Z', c) + circ(150, 170, 5, d);
    }
    return s;
  }

  // ----- Jewelry -----
  function jewelryBody(list, metal, gem, C) {
    const m = METALS[metal] || METALS.gold, g = C.p(gem);
    let s = '';
    if (list.indexOf('necklace') !== -1) {
      s += path('M128,160 Q150,196 172,160', 'none', ' stroke="' + m + '" stroke-width="2.5"') + heart(150, 186, 7, g, ' stroke="' + m + '" stroke-width="1.5"');
    }
    if (list.indexOf('pearls') !== -1) {
      for (let i = 0; i <= 10; i++) {
        const t = i / 10, x = 126 + t * 48, y = 160 + Math.sin(t * Math.PI) * 26;
        s += circ(x.toFixed(1), y.toFixed(1), 3.6, '#fffaf2', ' stroke="#e3d6c4" stroke-width="0.8"');
      }
    }
    return s;
  }
  function jewelryArms(list, metal, gem, C) {
    const m = METALS[metal] || METALS.gold, g = C.p(gem);
    let s = '';
    if (list.indexOf('bracelet') !== -1) {
      s += ell(87, 262, 12, 4.5, 'none', ' stroke="' + m + '" stroke-width="4"') + circ(87, 266, 3, g);
      if (list.indexOf('watch') === -1) s += ell(213, 262, 12, 4.5, 'none', ' stroke="' + m + '" stroke-width="4"') + circ(213, 266, 3, g);
    }
    if (list.indexOf('watch') !== -1) {
      s += rect(201, 257, 24, 9, '#3a3a44', ' rx="4"') + circ(213, 261, 7, '#ffffff', ' stroke="' + m + '" stroke-width="2.5"') +
        line(213, 261, 213, 257, '#3a2545', 1.2) + line(213, 261, 216, 261, '#3a2545', 1.2);
    }
    if (list.indexOf('ring') !== -1) {
      [[80.5, 291], [219.5, 291]].forEach(p => {
        s += path('M' + (p[0] - 5.5) + ',' + p[1] + ' Q' + p[0] + ',' + (p[1] + 3) + ' ' + (p[0] + 5.5) + ',' + p[1], 'none', ' stroke="' + m + '" stroke-width="2.5"') +
          circ(p[0], p[1] + 1.5, 2.6, g, ' stroke="' + m + '" stroke-width="0.8"');
      });
    }
    return s;
  }
  function jewelryHead(list, metal, gem, C, phase) {
    const m = METALS[metal] || METALS.gold, g = C.p(gem);
    let s = '';
    if (phase === 'ears' && list.indexOf('earrings') !== -1) {
      [[103, 120], [197, 120]].forEach(p => { s += line(p[0], p[1], p[0], p[1] + 8, m, 2) + circ(p[0], p[1] + 13, 5.5, g, ' stroke="' + m + '" stroke-width="1.5"'); });
    }
    if (phase === 'top') {
      if (list.indexOf('crown') !== -1) {
        s += path('M112,66 L108,30 L130,50 L150,22 L170,50 L192,30 L188,66 Z', m, ' stroke="' + shade(m, -25) + '" stroke-width="2"') +
          circ(150, 52, 5, g) + circ(126, 58, 4, g) + circ(174, 58, 4, g) + circ(108, 30, 3.5, m) + circ(150, 22, 3.5, m) + circ(192, 30, 3.5, m);
      }
      if (list.indexOf('tiara') !== -1) {
        s += path('M116,64 Q150,50 184,64 L178,56 L166,58 L150,36 L134,58 L122,56 Z', m, ' stroke="' + shade(m, -25) + '" stroke-width="1.5"') + heart(150, 52, 5, g);
      }
    }
    return s;
  }

  function avatarSVG(L, C) {
    const skin = L.skin, skinD = shade(skin, -15);
    const hairC = C.p(L.hairColor);
    const ex = L.extras || [], jw = L.jewelry || [];
    const dress = L.dress && L.dress !== 'none';
    const brow = L.hairColor === 'rainbow' || L.hairStyle === 'bald' ? '#5b3a1e' : shade(L.hairColor, -30);
    let s = '';
    s += extrasBack(ex, L.extrasColor, C);
    s += hairBack(L.hairStyle, hairC);
    s += rect(122, 258, 24, 120, skin, ' rx="11"') + rect(154, 258, 24, 120, skin, ' rx="11"'); // legs
    if (!dress) s += bottomPart(L.bottom, L.bottomColor, C);
    s += shoesPart(L.shoes, L.shoesColor, skin, C);
    s += rect(139, 140, 22, 34, skin, ' rx="6"'); // neck
    s += path('M108,166 Q150,154 192,166 L196,262 L104,262 Z', skin); // torso
    s += line(110, 178, 86, 268, skin, 20) + line(190, 178, 214, 268, skin, 20); // arms
    if (dress) s += dressPart(L.dress, L.dressColor, C);
    else s += topPart(L.top, L.topColor, C) + bottomOver(L.bottom, L.bottomColor, C);
    s += hand(84, 280, 1, L) + hand(216, 280, -1, L);
    s += jewelryArms(jw, L.metal, L.gem, C);
    s += extrasFront(ex, L.extrasColor, C);
    s += jewelryBody(jw, L.metal, L.gem, C);
    s += circ(103, 110, 10, skin) + circ(197, 110, 10, skin) + circ(103, 110, 5, skinD, ' opacity="0.4"') + circ(197, 110, 5, skinD, ' opacity="0.4"');
    s += jewelryHead(jw, L.metal, L.gem, C, 'ears');
    s += circ(150, 105, 48, skin); // head
    s += eyes(L.eyes, L.eyeColor);
    s += path('M126,92 Q132,87 140,91', 'none', ' stroke="' + brow + '" stroke-width="3.5" stroke-linecap="round"') +
      path('M160,91 Q168,87 174,92', 'none', ' stroke="' + brow + '" stroke-width="3.5" stroke-linecap="round"');
    s += path('M146,118 Q150,122 154,118', 'none', ' stroke="' + skinD + '" stroke-width="2.5" stroke-linecap="round"');
    s += mouth(L.mouth);
    s += faceExtras(L.faceExtras || []);
    // Tall styles tuck under hats that cover the top of the head.
    const covers = ['cap', 'beanie', 'cowboy', 'tophat', 'wizard', 'party'].indexOf(L.hat) !== -1;
    const frontStyle = covers && (L.hairStyle === 'spiky' || L.hairStyle === 'mohawk') ? 'short' : L.hairStyle;
    s += hairFront(frontStyle, hairC);
    if (L.hat !== 'astro') s += hatPart(L.hat, L.hatColor, C);
    s += jewelryHead(jw, L.metal, L.gem, C, 'top');
    s += eyewearPart(L.eyewear);
    if (L.hat === 'astro') s += hatPart(L.hat, L.hatColor, C);
    return s;
  }

  // ===================================================================
  // Scenes. Drawn well beyond the 300x400 box so they fill any screen shape.
  // ===================================================================
  function sky(C, a, b) {
    return '<defs>' + grad(C.id('sky'), [a, b], 0, 0, 0, 340) + '</defs>' + rect(-600, -400, 1500, 1200, C.url('sky'));
  }
  function ground(fill, y) { return rect(-600, y, 1500, 700, fill); }
  function cloud(x, y, s) {
    return '<g opacity="0.95">' + circ(x, y, 14 * s, '#ffffff') + circ(x + 16 * s, y - 8 * s, 18 * s, '#ffffff') + circ(x + 34 * s, y, 14 * s, '#ffffff') +
      rect(x, y - 2 * s, 34 * s, 16 * s, '#ffffff') + '</g>';
  }
  function tree(x, y, s, col) {
    return rect(x - 5 * s, y - 30 * s, 10 * s, 32 * s, '#8b5a2b') + circ(x, y - 46 * s, 24 * s, col) + circ(x - 16 * s, y - 34 * s, 16 * s, col) + circ(x + 16 * s, y - 34 * s, 16 * s, col);
  }
  function pine(x, y, s, col, snow) {
    let t = rect(x - 4 * s, y - 14 * s, 8 * s, 16 * s, '#6b3e1f');
    t += path('M' + (x - 26 * s) + ',' + (y - 12 * s) + ' L' + x + ',' + (y - 70 * s) + ' L' + (x + 26 * s) + ',' + (y - 12 * s) + ' Z', col);
    if (snow) t += path('M' + (x - 12 * s) + ',' + (y - 44 * s) + ' L' + x + ',' + (y - 70 * s) + ' L' + (x + 12 * s) + ',' + (y - 44 * s) + ' Q' + x + ',' + (y - 38 * s) + ' ' + (x - 12 * s) + ',' + (y - 44 * s) + ' Z', '#ffffff');
    return t;
  }

  function sceneSVG(id, C) {
    let s = '';
    switch (id) {
      case 'beach': {
        s += sky(C, '#6fcfff', '#dff6ff');
        s += circ(250, 60, 44, '#ffe680', ' opacity="0.35"') + circ(250, 60, 30, '#ffd84d');
        s += cloud(30, 70, 1) + cloud(150, 40, 0.8) + cloud(-120, 60, 1) + cloud(360, 90, 1);
        s += rect(-600, 228, 1500, 90, '#2ec4e6');
        for (let x = -600; x < 900; x += 60) s += path('M' + x + ',252 q15,-8 30,0 q15,8 30,0', 'none', ' stroke="#ffffff" stroke-width="3" opacity="0.7"');
        s += path('M-600,306 Q150,282 900,306 L900,900 L-600,900 Z', '#f7dc9a');
        s += line(40, 250, 40, 344, '#8b5a2b', 4) + path('M-2,262 Q40,214 82,262 Z', '#ff6fb5') + path('M26,262 Q40,214 54,262 Z', '#ffffff');
        s += star(262, 372, 13, '#ff9a3c') + ell(30, 378, 10, 7, '#ffb3d9') + ell(-60, 360, 30, 6, '#e8c47a');
        break;
      }
      case 'castle': {
        s += sky(C, '#ffc9e6', '#e9ddff');
        s += cloud(20, 60, 0.9) + cloud(230, 40, 0.8) + cloud(-140, 80, 1) + cloud(380, 70, 1);
        s += path('M-600,300 Q-100,220 150,280 Q400,230 900,300 L900,900 L-600,900 Z', '#9be29b');
        const wall = '#f6ecff', roof = '#ff6fb5', win = '#a86fff', edge = ' stroke="#d9c6f2" stroke-width="2"';
        s += rect(60, 150, 180, 180, wall, edge);
        for (let x = 60; x < 240; x += 24) s += rect(x, 138, 14, 14, wall);
        s += rect(28, 110, 52, 220, wall, edge) + rect(220, 110, 52, 220, wall, edge);
        s += path('M22,112 L54,50 L86,112 Z', roof) + path('M214,112 L246,50 L278,112 Z', roof);
        s += rect(122, 86, 56, 70, wall, edge) + path('M116,88 L150,30 L184,88 Z', roof);
        s += line(54, 50, 54, 30, '#8b5a2b', 2) + path('M54,30 L70,36 L54,42 Z', '#ffd84d');
        s += line(246, 50, 246, 30, '#8b5a2b', 2) + path('M246,30 L262,36 L246,42 Z', '#ffd84d');
        s += path('M128,330 L128,280 Q150,254 172,280 L172,330 Z', win);
        s += path('M44,170 L44,152 Q54,140 64,152 L64,170 Z', win) + path('M236,170 L236,152 Q246,140 256,152 L256,170 Z', win) + path('M140,130 L140,114 Q150,104 160,114 L160,130 Z', win);
        s += ground('#7bd67b', 330);
        [[20, 352], [70, 372], [230, 360], [280, 376], [-50, 360], [350, 366]].forEach(p => { s += circ(p[0], p[1], 4, '#ffffff') + circ(p[0], p[1], 2, '#ffd84d'); });
        break;
      }
      case 'space': {
        s += sky(C, '#0b1033', '#3a1d6e');
        const r = rng(7);
        for (let i = 0; i < 90; i++) s += circ((r() * 1500 - 600).toFixed(0), (r() * 360 - 20).toFixed(0), (r() * 1.8 + 0.6).toFixed(1), '#ffffff', ' opacity="' + (0.5 + r() * 0.5).toFixed(2) + '"');
        s += circ(240, 80, 32, '#ff9a3c') + ell(240, 80, 54, 12, 'none', ' stroke="#ffd84d" stroke-width="5" transform="rotate(-18 240 80)"') + circ(232, 70, 8, '#ffb877');
        s += circ(48, 140, 15, '#4fa8ff') + circ(44, 136, 4, '#9fd0ff');
        s += star(110, 40, 6, '#ffd84d') + line(-40, 40, 20, 70, '#ffffff', 2, ' opacity="0.6"');
        s += path('M-600,338 Q150,306 900,338 L900,900 L-600,900 Z', '#c9c9d6');
        [[40, 360, 18], [220, 372, 14], [130, 390, 10], [290, 350, 10], [-60, 370, 20], [360, 380, 16]].forEach(c => { s += ell(c[0], c[1], c[2], c[2] * 0.35, '#a7a7ba'); });
        break;
      }
      case 'city': {
        s += sky(C, '#ffb38a', '#b48aff');
        s += circ(230, 210, 36, '#ffe08a', ' opacity="0.9"');
        const r = rng(3);
        const cols = ['#5a4b8a', '#6b5ca5', '#7d6fbf', '#4b3f78'];
        for (let x = -600; x < 900; x += 44) {
          const h = 120 + Math.floor(r() * 160), y = 340 - h, w = 40;
          s += rect(x, y, w, h, cols[Math.floor(r() * cols.length)]);
          for (let wy = y + 12; wy < 330; wy += 20) {
            for (let wx = x + 7; wx < x + w - 8; wx += 13) { if (r() > 0.45) s += rect(wx, wy, 7, 9, '#ffe680', ' opacity="0.9"'); }
          }
        }
        s += ground('#c8c3d6', 340) + rect(-600, 340, 1500, 6, '#a39cb8');
        s += line(30, 344, 30, 270, '#3a3a44', 4) + circ(30, 266, 9, '#ffe680');
        s += line(270, 344, 270, 270, '#3a3a44', 4) + circ(270, 266, 9, '#ffe680');
        break;
      }
      case 'forest': {
        s += sky(C, '#bff2ff', '#e8ffe0');
        s += circ(60, 60, 26, '#ffd84d');
        s += path('M-600,290 Q0,230 150,270 Q300,230 900,290 L900,900 L-600,900 Z', '#9be29b');
        s += pine(-40, 300, 1.6, '#2e8b57') + tree(20, 320, 1.4, '#3fae6a') + pine(80, 300, 1.2, '#2e8b57') + tree(230, 316, 1.5, '#3fae6a') +
          pine(290, 306, 1.5, '#2e8b57') + tree(360, 320, 1.4, '#3fae6a') + pine(-120, 310, 1.4, '#2e8b57');
        s += ground('#6cc46c', 338);
        s += rect(38, 360, 8, 14, '#fff3e0') + path('M28,362 Q42,342 56,362 Z', '#ff4d5e') + circ(36, 354, 2.5, '#ffffff') + circ(47, 356, 2.5, '#ffffff');
        [[100, 360, '#ff6fb5'], [210, 372, '#ffd84d'], [270, 356, '#a86fff'], [-30, 368, '#ff6fb5']].forEach(p => { s += line(p[0], p[1], p[0], p[1] + 12, '#2e8b57', 2) + circ(p[0], p[1], 5, p[2]); });
        break;
      }
      case 'stage': {
        s += sky(C, '#2a0f33', '#5a1f5e');
        s += path('M60,0 L110,0 L170,340 L20,340 Z', '#fff6c2', ' opacity="0.14"') + path('M190,0 L240,0 L280,340 L130,340 Z', '#fff6c2', ' opacity="0.14"');
        s += ground('#b9763f', 330);
        for (let x = -600; x < 900; x += 40) s += line(x, 330, x - 20, 900, '#9a5f2f', 2);
        s += rect(-600, 326, 1500, 8, '#8a4f22');
        s += ell(150, 384, 110, 16, '#fff6c2', ' opacity="0.35"');
        s += path('M-600,-400 L40,-400 L40,0 Q20,120 34,240 Q16,300 30,340 L-600,340 Z', '#d6284a') +
          path('M900,-400 L260,-400 L260,0 Q280,120 266,240 Q284,300 270,340 L900,340 Z', '#d6284a');
        s += line(10, 0, 14, 340, '#a81a38', 4) + line(290, 0, 286, 340, '#a81a38', 4);
        for (let x = -600; x < 900; x += 40) s += path('M' + x + ',-2 Q' + (x + 20) + ',34 ' + (x + 40) + ',-2 Z', '#ffcc33');
        [[30, 396], [90, 398], [150, 399], [210, 398], [270, 396]].forEach(p => { s += circ(p[0], p[1], 5, '#ffe680'); });
        break;
      }
      case 'snow': {
        s += sky(C, '#a9d8ff', '#eef8ff');
        s += path('M-200,300 L40,110 L170,300 Z', '#9db8d9') + path('M80,300 L230,80 L400,300 Z', '#8aa8cf') + path('M300,300 L460,140 L600,300 Z', '#9db8d9');
        s += path('M10,150 L40,110 L70,150 L56,144 L40,156 L24,144 Z', '#ffffff') + path('M195,130 L230,80 L265,130 L248,124 L230,138 L212,124 Z', '#ffffff');
        s += pine(20, 336, 1.2, '#2e7d5b', true) + pine(270, 340, 1.3, '#2e7d5b', true) + pine(-60, 330, 1.4, '#2e7d5b', true) + pine(350, 336, 1.2, '#2e7d5b', true);
        s += path('M-600,334 Q150,316 900,334 L900,900 L-600,900 Z', '#ffffff') + ell(150, 386, 110, 12, '#e3efff');
        const r = rng(11);
        for (let i = 0; i < 60; i++) s += circ((r() * 1500 - 600).toFixed(0), (r() * 380).toFixed(0), (r() * 2.5 + 1).toFixed(1), '#ffffff', ' opacity="0.9"');
        break;
      }
      case 'ocean': {
        s += sky(C, '#5fd0f7', '#1a5fa8');
        s += path('M40,-400 L90,-400 L60,340 L-10,340 Z', '#ffffff', ' opacity="0.08"') + path('M200,-400 L250,-400 L260,340 L190,340 Z', '#ffffff', ' opacity="0.08"');
        s += path('M-600,346 Q150,326 900,346 L900,900 L-600,900 Z', '#f2d79a');
        [[20, 350], [44, 352], [262, 354], [286, 350], [-60, 350], [350, 352]].forEach((p, i) => {
          const a = i % 2 ? 14 : -14;
          s += path('M' + p[0] + ',' + p[1] + ' q' + a + ',-40 0,-80 q' + (-a) + ',-40 0,-80', 'none', ' stroke="#2fb36b" stroke-width="8" stroke-linecap="round"');
        });
        const fish = (x, y, col, dir) => ell(x, y, 16, 10, col) + path('M' + (x - dir * 14) + ',' + y + ' L' + (x - dir * 28) + ',' + (y - 9) + ' L' + (x - dir * 28) + ',' + (y + 9) + ' Z', col) + circ(x + dir * 8, y - 2, 2.5, '#22160f');
        s += fish(60, 120, '#ff9a3c', 1) + fish(240, 190, '#ffd84d', -1) + fish(250, 70, '#ff6fb5', -1) + fish(-50, 200, '#a86fff', 1);
        [[100, 60, 6], [110, 40, 4], [210, 120, 5], [30, 220, 7], [280, 260, 5], [190, 30, 3]].forEach(b => { s += circ(b[0], b[1], b[2], 'rgba(255,255,255,0.15)', ' stroke="#ffffff" stroke-width="1.5" opacity="0.8"'); });
        s += star(240, 378, 12, '#ff6f91') + ell(60, 382, 10, 6, '#ffb3d9');
        break;
      }
      case 'rainbow': {
        s += sky(C, '#fff0fa', '#d6efff');
        RAINBOW.forEach((col, i) => { const R = 170 - i * 14; s += path('M' + (150 - R) + ',330 A' + R + ',' + R + ' 0 0 1 ' + (150 + R) + ',330', 'none', ' stroke="' + col + '" stroke-width="14"'); });
        s += cloud(-30, 316, 1.3) + cloud(270, 316, 1.3) + cloud(110, 50, 0.8);
        s += ground('#ffc2e2', 336);
        [[30, 330, '#ff4d5e'], [270, 334, '#a86fff'], [-40, 330, '#4fa8ff'], [350, 334, '#3fd18b']].forEach(p => {
          s += line(p[0], p[1], p[0], p[1] + 40, '#ffffff', 4) + circ(p[0], p[1], 15, p[2]) + path('M' + (p[0] - 8) + ',' + p[1] + ' Q' + p[0] + ',' + (p[1] - 12) + ' ' + (p[0] + 8) + ',' + p[1], 'none', ' stroke="#ffffff" stroke-width="3"');
        });
        break;
      }
      case 'field': {
        s += sky(C, '#8fd8ff', '#e5f7ff');
        s += rect(-600, 140, 1500, 100, '#6b5ca5');
        const r = rng(5), crowd = ['#ff4d5e', '#ffd84d', '#4fa8ff', '#3fd18b', '#ff6fb5', '#ffffff', '#ff9a3c'];
        for (let y = 154; y < 236; y += 14) {
          for (let x = -600; x < 900; x += 13) s += circ(x + (y % 28 ? 6 : 0), y, 5, crowd[Math.floor(r() * crowd.length)]);
        }
        s += ground('#4cbf5a', 240);
        for (let y = 240; y < 700; y += 44) s += rect(-600, y, 1500, 22, '#5bcf69');
        s += line(-600, 300, 900, 300, '#ffffff', 3) + path('M90,300 Q150,330 210,300', 'none', ' stroke="#ffffff" stroke-width="3"');
        s += rect(214, 226, 70, 50, 'none', ' stroke="#ffffff" stroke-width="4"');
        for (let x = 224; x < 284; x += 10) s += line(x, 228, x, 274, '#ffffff', 1, ' opacity="0.5"');
        s += circ(54, 372, 13, '#ffffff', ' stroke="#3a3a44" stroke-width="1.5"') + '<polygon points="' + starPts(54, 372, 6, 5, 5).split(' ').filter((_, i) => i % 2).join(' ') + '" fill="#3a3a44"/>';
        break;
      }
      default: { // studio
        s += sky(C, '#ffd1e8', '#d9c8ff');
        s += ground('#ffe3f1', 340) + ell(150, 384, 110, 18, '#ffffff', ' opacity="0.7"');
        [[30, 60, 8], [270, 90, 10], [60, 220, 6], [250, 250, 7], [140, 30, 5], [-60, 140, 9], [360, 170, 8]].forEach(p => { s += star(p[0], p[1], p[2], '#ffffff', ' opacity="0.85"'); });
        [[-40, 300, 6], [330, 310, 6]].forEach(p => { s += heart(p[0], p[1], p[2], '#ff6fb5', ' opacity="0.6"'); });
      }
    }
    return s;
  }

  // Full picture: optional scene + avatar. viewBox lets us zoom in for option previews.
  function lookSVG(L, opts) {
    opts = opts || {};
    const C = makeCtx();
    const defs = '<defs>' + grad(C.id('rb'), RAINBOW, 60, 0, 240, 400) + '</defs>';
    const vb = opts.viewBox || '0 0 300 400';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + vb + '" preserveAspectRatio="xMidYMid meet" aria-hidden="true">' + defs +
      (opts.scene ? sceneSVG(L.scene, C) : '') + (opts.avatar === false ? '' : avatarSVG(L, C)) + '</svg>';
  }

  // ===================================================================
  // Changing the look (shared by real taps and option previews)
  // ===================================================================
  function applyChoice(L, key, val) {
    const n = clone(L);
    n[key] = val;
    // Picking a top or bottom takes off the one-piece outfit so you can see it.
    if (key === 'top' || key === 'bottom' || key === 'topColor' || key === 'bottomColor') n.dress = 'none';
    return n;
  }
  function applyToggle(L, key, val, forceOn) {
    const n = clone(L);
    const list = (n[key] || []).slice();
    const i = list.indexOf(val);
    if (i === -1) list.push(val);
    else if (!forceOn) list.splice(i, 1);
    n[key] = list;
    return n;
  }

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function pickSome(arr, max) {
    const a = arr.slice().sort(() => Math.random() - 0.5);
    return a.slice(0, Math.floor(Math.random() * (max + 1)));
  }
  function randomLook() {
    const solid = CLOTH.filter(c => c !== 'rainbow');
    return normalize({
      skin: pick(SKINS), hairStyle: pick(HAIR_STYLES),
      hairColor: Math.random() < 0.7 ? pick(HAIR_COLORS.slice(0, 8)) : pick(HAIR_COLORS),
      eyes: pick(EYES), eyeColor: pick(EYE_COLORS), mouth: pick(MOUTHS), faceExtras: pickSome(FACE_EXTRAS, 2),
      top: pick(TOPS), topColor: pick(solid), bottom: pick(BOTTOMS), bottomColor: pick(solid),
      dress: Math.random() < 0.3 ? pick(DRESSES.slice(1)) : 'none', dressColor: pick(CLOTH),
      shoes: pick(SHOES.slice(0, 7)), shoesColor: pick(solid),
      hat: Math.random() < 0.5 ? pick(HATS.slice(1)) : 'none', hatColor: pick(solid),
      eyewear: Math.random() < 0.35 ? pick(EYEWEAR.slice(1)) : 'none',
      extras: pickSome(EXTRAS.map(e => e.id), 2), extrasColor: pick(solid),
      jewelry: pickSome(JEWELRY.map(j => j.id), 3), metal: pick(Object.keys(METALS)), gem: pick(GEMS),
      nails: pick(NAILS), scene: pick(SCENES).id,
    });
  }

  // ---------- Saved looks (localStorage) ----------
  function loadSaved() {
    try {
      const raw = window.localStorage.getItem(STORE_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(arr)) return [];
      return arr.filter(x => x && x.id && x.look)
        .map(x => ({ id: String(x.id), name: String(x.name || ''), look: normalize(x.look), at: x.at || 0 }));
    } catch (e) { return []; }
  }
  function writeSaved(list) {
    try { window.localStorage.setItem(STORE_KEY, JSON.stringify(list)); return true; } catch (e) { return false; }
  }
  function loadCurrent() {
    try {
      const raw = window.localStorage.getItem(CURRENT_KEY);
      if (!raw) return null;
      const o = JSON.parse(raw);
      return { look: normalize(o.look), editingId: o.editingId || null };
    } catch (e) { return null; }
  }
  function writeCurrent(look, editingId) {
    try { window.localStorage.setItem(CURRENT_KEY, JSON.stringify({ look, editingId })); } catch (e) {}
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  }

  // ---------- Tabs & sections ----------
  const TABS = [
    { id: 'skin', icon: '🖐️', label: 'Skin', sections: [{ type: 'color', key: 'skin', colors: SKINS, big: true }] },
    { id: 'hair', icon: '💇', label: 'Hair', sections: [
      { type: 'choice', key: 'hairStyle', options: HAIR_STYLES, crop: '48 14 204 204' },
      { type: 'color', key: 'hairColor', colors: HAIR_COLORS, icon: '🎨' }] },
    { id: 'face', icon: '😊', label: 'Face', sections: [
      { type: 'choice', key: 'eyes', options: EYES, crop: '112 86 76 40', icon: '👀' },
      { type: 'color', key: 'eyeColor', colors: EYE_COLORS, icon: '🎨' },
      { type: 'choice', key: 'mouth', options: MOUTHS, crop: '124 106 52 40', icon: '👄' },
      { type: 'toggle', key: 'faceExtras', options: FACE_EXTRAS.map(id => ({ id, crop: '100 90 100 60' })), icon: '✨' }] },
    { id: 'top', icon: '👕', label: 'Tops', sections: [
      { type: 'choice', key: 'top', options: TOPS, crop: '64 144 172 140' },
      { type: 'color', key: 'topColor', colors: CLOTH, icon: '🎨' }] },
    { id: 'bottom', icon: '👖', label: 'Bottoms', sections: [
      { type: 'choice', key: 'bottom', options: BOTTOMS, crop: '66 190 168 200' },
      { type: 'color', key: 'bottomColor', colors: CLOTH, icon: '🎨' }] },
    { id: 'dress', icon: '👗', label: 'Dresses', sections: [
      { type: 'choice', key: 'dress', options: DRESSES, crop: '44 146 212 250' },
      { type: 'color', key: 'dressColor', colors: CLOTH, icon: '🎨' }] },
    { id: 'shoes', icon: '👟', label: 'Shoes', sections: [
      { type: 'choice', key: 'shoes', options: SHOES, crop: '98 316 104 84', noneEmoji: '🦶' },
      { type: 'color', key: 'shoesColor', colors: CLOTH.filter(c => c !== 'rainbow'), icon: '🎨' }] },
    { id: 'hat', icon: '🧢', label: 'Hats', sections: [
      { type: 'choice', key: 'hat', options: HATS, crop: '64 -6 172 176' },
      { type: 'color', key: 'hatColor', colors: CLOTH, icon: '🎨' }] },
    { id: 'specs', icon: '🕶️', label: 'Glasses', sections: [
      { type: 'choice', key: 'eyewear', options: EYEWEAR, crop: '94 78 112 60' }] },
    { id: 'extras', icon: '🦸', label: 'Extras', sections: [
      { type: 'toggle', key: 'extras', options: EXTRAS },
      { type: 'color', key: 'extrasColor', colors: CLOTH, icon: '🎨' }] },
    { id: 'jewelry', icon: '💍', label: 'Jewelry', sections: [
      { type: 'toggle', key: 'jewelry', options: JEWELRY },
      { type: 'metal', key: 'metal', icon: '✨' },
      { type: 'color', key: 'gem', colors: GEMS, icon: '💎' }] },
    { id: 'nails', icon: '💅', label: 'Nails', sections: [{ type: 'nails', key: 'nails', colors: NAILS }] },
    { id: 'scene', icon: '🏞️', label: 'Places', sections: [{ type: 'scene', key: 'scene' }] },
  ];

  function swatchStyle(c) {
    if (c === 'rainbow') return 'background: conic-gradient(' + RAINBOW.concat(RAINBOW[0]).join(',') + ');';
    return 'background:' + c + ';';
  }

  // ===================================================================
  // The game
  // ===================================================================
  GameApp.register({
    name: 'Dress-Up Studio',
    icon: '🪞',
    minPlayers: 1,
    maxPlayers: 1,

    start(root) {
      const timers = new Set();
      const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); fn(); }, ms); timers.add(t); return t; };
      const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance === 'function';
      function speak(text) {
        if (!canSpeak) return;
        try {
          window.speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(text);
          u.rate = 0.95; u.pitch = 1.2;
          window.speechSynthesis.speak(u);
        } catch (e) {}
      }

      let saved = loadSaved();
      const cur = loadCurrent();
      let look = cur ? cur.look : defaultLook();
      let editingId = cur && cur.editingId && saved.some(s => s.id === cur.editingId) ? cur.editingId : null;
      let tab = 'hair';
      const undo = [];
      let overlayEl = null;

      const wrap = document.createElement('div');
      wrap.className = 'du-wrap';
      wrap.innerHTML =
        '<div class="du-stage">' +
          '<div class="du-avatar"></div>' +
          '<div class="du-name-tag" hidden></div>' +
          '<div class="du-tools">' +
            '<button class="du-tool save" data-action="save" aria-label="Save">💾</button>' +
            '<button class="du-tool" data-action="gallery" aria-label="My looks">🖼️<span class="du-badge"></span></button>' +
            '<button class="du-tool" data-action="random" aria-label="Surprise me">🎲</button>' +
            '<button class="du-tool" data-action="undo" aria-label="Undo">↩️</button>' +
          '</div>' +
        '</div>' +
        '<div class="du-side">' +
          '<div class="du-tabs" role="tablist"></div>' +
          '<div class="du-panel"></div>' +
        '</div>' +
        '<div class="du-fx"></div>';
      root.appendChild(wrap);

      const avatarEl = wrap.querySelector('.du-avatar');
      const nameTag = wrap.querySelector('.du-name-tag');
      const badge = wrap.querySelector('.du-badge');
      const tabsEl = wrap.querySelector('.du-tabs');
      const panelEl = wrap.querySelector('.du-panel');
      const fxEl = wrap.querySelector('.du-fx');
      const undoBtn = wrap.querySelector('[data-action="undo"]');

      // ----- Rendering -----
      function renderAvatar() {
        avatarEl.innerHTML = lookSVG(look, { scene: true });
        const s = editingId && saved.find(x => x.id === editingId);
        if (s) { nameTag.hidden = false; nameTag.textContent = s.name; } else { nameTag.hidden = true; }
        badge.textContent = saved.length ? String(saved.length) : '';
        badge.style.display = saved.length ? '' : 'none';
        undoBtn.disabled = undo.length === 0;
      }

      function renderTabs() {
        tabsEl.innerHTML = TABS.map(t =>
          '<button class="du-tab' + (t.id === tab ? ' on' : '') + '" data-tab="' + t.id + '" role="tab" aria-label="' + t.label + '">' +
            '<span class="du-tab-icon">' + t.icon + '</span><span class="du-tab-label">' + t.label + '</span></button>'
        ).join('');
      }

      function optBtn(attrs, on, inner, extraCls) {
        return '<button class="du-opt' + (on ? ' on' : '') + (extraCls ? ' ' + extraCls : '') + '" ' + attrs + '>' + inner + '</button>';
      }
      function section(icon, cls, items) {
        return '<div class="du-section">' + (icon ? '<div class="du-sec-icon">' + icon + '</div>' : '') + '<div class="' + cls + '">' + items + '</div></div>';
      }

      function renderSection(sec) {
        let items = '';
        if (sec.type === 'choice') {
          items = sec.options.map(v => {
            const inner = v === 'none' ? '<span class="du-opt-emoji">' + (sec.noneEmoji || '🚫') + '</span>'
              : lookSVG(applyChoice(look, sec.key, v), { viewBox: sec.crop });
            return optBtn('data-key="' + sec.key + '" data-val="' + v + '" aria-label="' + v + '"', look[sec.key] === v, inner);
          }).join('');
          return section(sec.icon, 'du-grid', items);
        }
        if (sec.type === 'toggle') {
          items = sec.options.map(o => {
            const on = (look[sec.key] || []).indexOf(o.id) !== -1;
            const inner = o.emoji ? '<span class="du-opt-emoji">' + o.emoji + '</span>'
              : lookSVG(applyToggle(look, sec.key, o.id, true), { viewBox: o.crop });
            return optBtn('data-toggle="' + sec.key + '" data-val="' + o.id + '" aria-label="' + o.id + '"', on, inner + (on ? '<span class="du-check">✔</span>' : ''));
          }).join('');
          return section(sec.icon, 'du-grid', items);
        }
        if (sec.type === 'color') {
          items = sec.colors.map(c =>
            '<button class="du-swatch' + (sec.big ? ' big' : '') + (look[sec.key] === c ? ' on' : '') + '" data-key="' + sec.key +
            '" data-val="' + c + '" style="' + swatchStyle(c) + '" aria-label="' + c + '"></button>'
          ).join('');
          return section(sec.icon, 'du-swatches', items);
        }
        if (sec.type === 'metal') {
          items = Object.keys(METALS).map(m =>
            '<button class="du-swatch' + (look.metal === m ? ' on' : '') + '" data-key="metal" data-val="' + m +
            '" style="background: radial-gradient(circle at 35% 30%, #ffffff, ' + METALS[m] + ' 55%, ' + shade(METALS[m], -30) + ');" aria-label="' + m + '"></button>'
          ).join('');
          return section(sec.icon, 'du-swatches', items);
        }
        if (sec.type === 'nails') {
          items = sec.colors.map(c => {
            const inner = c === 'none' ? '<span class="du-opt-emoji">🚫</span>' : lookSVG(applyChoice(look, 'nails', c), { viewBox: '64 264 40 36' });
            return optBtn('data-key="nails" data-val="' + c + '" aria-label="' + c + '"', look.nails === c, inner);
          }).join('');
          return section('', 'du-grid', items);
        }
        if (sec.type === 'scene') {
          items = SCENES.map(sc => {
            const inner = lookSVG(Object.assign({}, look, { scene: sc.id }), { scene: true, avatar: false }) + '<span class="du-scene-icon">' + sc.icon + '</span>';
            return optBtn('data-key="scene" data-val="' + sc.id + '" aria-label="' + sc.id + '"', look.scene === sc.id, inner, 'scene');
          }).join('');
          return section('', 'du-grid scenes', items);
        }
        return '';
      }

      function renderPanel(keepScroll) {
        const top = keepScroll ? panelEl.scrollTop : 0;
        const t = TABS.find(x => x.id === tab) || TABS[0];
        const hint = (tab === 'top' || tab === 'bottom') && look.dress !== 'none' ? '<div class="du-hint">👗 ➡️ 👕👖</div>' : '';
        panelEl.innerHTML = hint + t.sections.map(renderSection).join('');
        panelEl.scrollTop = top;
      }

      function renderAll(keepScroll) {
        renderAvatar();
        renderTabs();
        renderPanel(keepScroll);
      }

      function bounce() {
        avatarEl.classList.remove('du-bounce');
        void avatarEl.offsetWidth;
        avatarEl.classList.add('du-bounce');
      }

      function setLook(next) {
        undo.push(look);
        if (undo.length > 40) undo.shift();
        look = next;
        writeCurrent(look, editingId);
        renderAvatar();
        renderPanel(true);
        bounce();
      }

      // ----- Celebrations -----
      function confetti(count) {
        const colors = ['#ff6fb5', '#a86fff', '#ffd84d', '#7bffb5', '#7de0ff'];
        for (let i = 0; i < count; i++) {
          const p = document.createElement('div');
          p.className = 'confetti';
          p.style.left = Math.random() * 100 + '%';
          p.style.background = colors[i % colors.length];
          p.style.animationDelay = Math.random() * 0.6 + 's';
          p.style.animationDuration = (1.6 + Math.random() * 1.6) + 's';
          fxEl.appendChild(p);
          later(() => p.remove(), 4000);
        }
      }
      function sparkles(count) {
        const r = avatarEl.getBoundingClientRect(), w = wrap.getBoundingClientRect();
        for (let i = 0; i < count; i++) {
          const sp = document.createElement('div');
          sp.className = 'du-sparkle';
          sp.textContent = pick(['✨', '⭐', '💖', '🌟']);
          sp.style.left = (r.left - w.left + r.width * (0.15 + Math.random() * 0.7)) + 'px';
          sp.style.top = (r.top - w.top + r.height * (0.1 + Math.random() * 0.8)) + 'px';
          sp.style.animationDelay = (Math.random() * 0.5) + 's';
          fxEl.appendChild(sp);
          later(() => sp.remove(), 2200);
        }
      }
      function toast(text) {
        const t = document.createElement('div');
        t.className = 'du-toast';
        t.textContent = text;
        fxEl.appendChild(t);
        later(() => t.remove(), 1800);
      }

      // ----- Save -----
      function closeOverlay() {
        if (overlayEl && overlayEl.parentNode) overlayEl.parentNode.removeChild(overlayEl);
        overlayEl = null;
      }

      function openSave() {
        closeOverlay();
        const existing = editingId && saved.find(x => x.id === editingId);
        overlayEl = document.createElement('div');
        overlayEl.className = 'du-overlay';
        overlayEl.innerHTML =
          '<div class="du-card">' +
            '<div class="du-save-preview">' + lookSVG(look, { scene: true }) + '</div>' +
            '<input class="du-name-input" type="text" maxlength="24" autocomplete="off" placeholder="✏️ Name it!" value="' + esc(existing ? existing.name : '') + '" />' +
            '<div class="du-emoji-row">' + NAME_EMOJI.map(e => '<button class="du-emoji" data-emoji="' + e + '">' + e + '</button>').join('') +
              '<button class="du-emoji erase" data-erase="1" aria-label="Erase">⌫</button></div>' +
            '<div class="du-save-row">' +
              (existing
                ? '<button class="btn mint" data-save="update">💾 Save</button><button class="btn purple" data-save="new">➕ New</button>'
                : '<button class="btn mint" data-save="new">💾 Save</button>') +
              '<button class="btn yellow" data-save="cancel" aria-label="Cancel">✖️</button>' +
            '</div>' +
          '</div>';
        wrap.appendChild(overlayEl);
        const input = overlayEl.querySelector('.du-name-input');
        input.addEventListener('keydown', e => {
          e.stopPropagation();
          if (e.key === 'Enter') { e.preventDefault(); doSave(existing ? 'update' : 'new', input.value); }
        });
        overlayEl.addEventListener('click', e => {
          const b = e.target.closest('button');
          if (!b) { if (e.target === overlayEl) closeOverlay(); return; }
          if (b.dataset.emoji) {
            if (Array.from(input.value).length < 22) input.value += b.dataset.emoji;
          } else if (b.dataset.erase) {
            input.value = Array.from(input.value).slice(0, -1).join('');
          } else if (b.dataset.save === 'cancel') closeOverlay();
          else if (b.dataset.save) doSave(b.dataset.save, input.value);
        });
      }

      function doSave(mode, rawName) {
        let name = String(rawName || '').trim().slice(0, 30);
        if (!name) name = pick(['⭐', '🦄', '🌈', '💖', '🚀', '🌸']) + ' Look ' + (saved.length + 1);
        const prevSaved = saved, prevId = editingId;
        if (mode === 'update' && editingId && saved.some(x => x.id === editingId)) {
          saved = saved.map(x => (x.id === editingId ? { id: x.id, name, look: clone(look), at: Date.now() } : x));
        } else {
          if (saved.some(x => x.name === name)) {
            let n = 2;
            while (saved.some(x => x.name === name + ' ' + n)) n++;
            name = name + ' ' + n;
          }
          const id = 'look' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
          saved = [{ id, name, look: clone(look), at: Date.now() }].concat(saved);
          editingId = id;
        }
        closeOverlay();
        if (!writeSaved(saved)) {
          saved = prevSaved; editingId = prevId;
          toast('😢 Full!');
          return;
        }
        writeCurrent(look, editingId);
        renderAvatar();
        confetti(80);
        sparkles(14);
        toast('✨ Saved! ✨');
        speak('Saved!');
      }

      // ----- Gallery -----
      function openGallery(confirmId) {
        closeOverlay();
        overlayEl = document.createElement('div');
        overlayEl.className = 'du-gallery';
        const cards = saved.map(s => {
          const id = esc(s.id);
          const actions = s.id === confirmId
            ? '<div class="du-gal-actions confirm"><span>🗑️❓</span><button class="du-mini yes" data-gal="yes" data-id="' + id + '" aria-label="Yes, delete">✅</button><button class="du-mini" data-gal="no" aria-label="Keep">❌</button></div>'
            : '<div class="du-gal-actions"><button class="du-mini" data-gal="open" data-id="' + id + '" aria-label="Edit">✏️</button><button class="du-mini" data-gal="del" data-id="' + id + '" aria-label="Delete">🗑️</button></div>';
          return '<div class="du-gal-card' + (s.id === editingId ? ' current' : '') + '">' +
            '<button class="du-gal-thumb" data-gal="open" data-id="' + id + '" aria-label="Open ' + esc(s.name) + '">' + lookSVG(s.look, { scene: true }) + '</button>' +
            '<div class="du-gal-name">' + esc(s.name) + '</div>' + actions + '</div>';
        }).join('');
        overlayEl.innerHTML =
          '<div class="du-gal-head"><div class="du-gal-title">🖼️ My Looks</div><button class="du-tool" data-gal="close" aria-label="Close">✖️</button></div>' +
          '<div class="du-gal-grid">' +
            '<button class="du-gal-card new" data-gal="new" aria-label="New look"><span class="du-gal-plus">➕</span><span>New</span></button>' +
            cards +
          '</div>' +
          (saved.length ? '' : '<div class="du-gal-empty">💾 ➡️ 🖼️</div>');
        wrap.appendChild(overlayEl);
        overlayEl.addEventListener('click', e => {
          const b = e.target.closest('[data-gal]');
          if (!b) return;
          const act = b.dataset.gal, id = b.dataset.id;
          if (act === 'close') closeOverlay();
          else if (act === 'new') {
            editingId = null;
            closeOverlay();
            setLook(defaultLook());
            renderAll(false);
            sparkles(8);
          } else if (act === 'open') {
            const s = saved.find(x => x.id === id);
            if (!s) return;
            editingId = s.id;
            closeOverlay();
            setLook(clone(s.look));
            renderAll(false);
            sparkles(10);
          } else if (act === 'del') openGallery(id);
          else if (act === 'no') openGallery(null);
          else if (act === 'yes') {
            saved = saved.filter(x => x.id !== id);
            writeSaved(saved);
            if (editingId === id) { editingId = null; writeCurrent(look, editingId); }
            renderAvatar();
            openGallery(null);
          }
        });
      }

      // ----- Input -----
      function onClick(e) {
        if (overlayEl && overlayEl.contains(e.target)) return;
        const el = e.target.closest('[data-tab],[data-key],[data-toggle],[data-action]');
        if (!el || !wrap.contains(el)) return;
        const ds = el.dataset;
        if (ds.tab) {
          tab = ds.tab;
          renderTabs();
          renderPanel(false);
        } else if (ds.key) {
          if (look[ds.key] === ds.val && ds.key !== 'top' && ds.key !== 'bottom') return;
          setLook(applyChoice(look, ds.key, ds.val));
        } else if (ds.toggle) {
          setLook(applyToggle(look, ds.toggle, ds.val));
        } else if (ds.action === 'random') {
          setLook(randomLook());
          sparkles(6);
        } else if (ds.action === 'undo') {
          if (!undo.length) return;
          look = undo.pop();
          writeCurrent(look, editingId);
          renderAvatar();
          renderPanel(true);
        } else if (ds.action === 'save') openSave();
        else if (ds.action === 'gallery') openGallery(null);
      }
      wrap.addEventListener('click', onClick);

      function onKeyDown(e) {
        if (e.key === 'Escape' && overlayEl) { e.preventDefault(); closeOverlay(); }
      }
      window.addEventListener('keydown', onKeyDown);

      renderAll(false);

      return function cleanup() {
        timers.forEach(t => clearTimeout(t));
        timers.clear();
        wrap.removeEventListener('click', onClick);
        window.removeEventListener('keydown', onKeyDown);
        if (canSpeak) { try { window.speechSynthesis.cancel(); } catch (e) {} }
        root.innerHTML = '';
      };
    },
  });
})();
