(function () {
  // Kid-friendly, concrete words with a picture clue. Keep them common and easy to picture.
  const WORDS = {
    easy: [
      ['CAT', '🐱'], ['DOG', '🐶'], ['SUN', '☀️'], ['PIG', '🐷'], ['COW', '🐮'],
      ['BUS', '🚌'], ['HAT', '🎩'], ['BEE', '🐝'], ['BED', '🛏️'], ['CAR', '🚗'],
      ['EGG', '🥚'], ['FOX', '🦊'], ['BAT', '🦇'], ['ANT', '🐜'], ['KEY', '🔑'],
      ['OWL', '🦉'], ['BOX', '📦'], ['ICE', '🧊'], ['PIE', '🥧'], ['BUG', '🐛'],
      ['VAN', '🚐'], ['WEB', '🕸️'], ['MAP', '🗺️'], ['CUP', '🥤'], ['ELF', '🧝'],
    ],
    medium: [
      ['FISH', '🐟'], ['CAKE', '🎂'], ['STAR', '⭐'], ['FROG', '🐸'], ['BEAR', '🐻'],
      ['DUCK', '🦆'], ['LION', '🦁'], ['MOON', '🌙'], ['TREE', '🌳'], ['BOOK', '📖'],
      ['BALL', '⚽'], ['BIKE', '🚲'], ['BOAT', '⛵'], ['SHOE', '👟'], ['CORN', '🌽'],
      ['RAIN', '🌧️'], ['DOOR', '🚪'], ['KITE', '🪁'], ['BIRD', '🐦'], ['MILK', '🥛'],
      ['SOCK', '🧦'], ['HAND', '✋'], ['FIRE', '🔥'], ['DRUM', '🥁'], ['GIFT', '🎁'],
    ],
    hard: [
      ['APPLE', '🍎'], ['HORSE', '🐴'], ['HOUSE', '🏠'], ['TRAIN', '🚂'], ['PIZZA', '🍕'],
      ['ZEBRA', '🦓'], ['TIGER', '🐯'], ['MOUSE', '🐭'], ['SNAKE', '🐍'], ['HEART', '❤️'],
      ['CLOUD', '☁️'], ['SHEEP', '🐑'], ['BREAD', '🍞'], ['CANDY', '🍬'], ['CLOCK', '⏰'],
      ['CROWN', '👑'], ['GRAPE', '🍇'], ['LEMON', '🍋'], ['PANDA', '🐼'], ['SHARK', '🦈'],
      ['WHALE', '🐳'], ['PLANE', '✈️'], ['ROBOT', '🤖'], ['TRUCK', '🚚'], ['SPOON', '🥄'],
    ],
  };

  const ROUND_SIZE = 5;
  const CHEERS = ['Great job!', 'You got it!', 'Super speller!', 'Awesome!', 'Yay!'];
  const recentByLevel = { easy: [], medium: [], hard: [] };

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Shuffle letters, making sure they never come out already spelled correctly.
  function scramble(word) {
    const letters = word.split('');
    for (let tries = 0; tries < 50; tries++) {
      const s = shuffle(letters);
      if (s.join('') !== word) return s;
    }
    return letters.slice().reverse();
  }

  function pickWords(level) {
    const list = WORDS[level];
    const recent = recentByLevel[level];
    let pool = list.filter(w => recent.indexOf(w[0]) === -1);
    if (pool.length < ROUND_SIZE) pool = list.slice();
    const picked = shuffle(pool).slice(0, ROUND_SIZE);
    recentByLevel[level] = recent.concat(picked.map(w => w[0])).slice(-15);
    return picked;
  }

  GameApp.register({
    name: 'Word Scramble',
    icon: '🔤',
    minPlayers: 1,
    maxPlayers: 1,
    difficulties: [
      { id: 'easy',   label: '🌱 Easy',   hint: '3-letter words, like CAT' },
      { id: 'medium', label: '🌳 Medium', hint: '4-letter words, like FISH' },
      { id: 'hard',   label: '⚡ Hard',   hint: '5-letter words, like APPLE' },
    ],

    start(root, { difficulty }) {
      const level = WORDS[difficulty] ? difficulty : 'easy';
      const timers = new Set();
      const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window &&
        typeof window.SpeechSynthesisUtterance === 'function';

      // State
      let words = [];
      let roundIndex = 0;
      let stars = 0;
      let word = '';
      let tiles = [];      // { id, letter }; tray position == id
      let slots = [];      // tile id or null per answer position
      let locked = [];     // slot positions placed by Hint (can't be removed)
      let busy = false;    // true while showing feedback
      let finished = false;
      let overlayEl = null;

      // ===== DOM =====
      const wrap = document.createElement('div');
      wrap.className = 'ws-wrap';
      wrap.innerHTML =
        '<div class="ws-stars" aria-label="Stars"></div>' +
        '<div class="ws-clue">' +
          '<div class="ws-emoji" aria-hidden="true"></div>' +
        '</div>' +
        '<div class="ws-message" aria-live="polite"></div>' +
        '<div class="ws-slots"></div>' +
        '<div class="ws-tray"></div>' +
        '<div class="ws-actions">' +
          '<button class="btn yellow ws-hint" data-action="hint">💡 Hint</button>' +
          (canSpeak ? '<button class="btn purple ws-speak" data-action="speak">🔊 Hear it</button>' : '') +
        '</div>' +
        '<div class="ws-confetti-layer"></div>';
      root.appendChild(wrap);

      const starsEl = wrap.querySelector('.ws-stars');
      const emojiEl = wrap.querySelector('.ws-emoji');
      const msgEl = wrap.querySelector('.ws-message');
      const slotsEl = wrap.querySelector('.ws-slots');
      const trayEl = wrap.querySelector('.ws-tray');
      const confettiLayer = wrap.querySelector('.ws-confetti-layer');

      function later(fn, ms) {
        const t = setTimeout(() => { timers.delete(t); fn(); }, ms);
        timers.add(t);
        return t;
      }

      // ===== Speech (optional) =====
      function speak(text) {
        if (!canSpeak) return;
        try {
          window.speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(text.toLowerCase());
          u.rate = 0.8;
          u.pitch = 1.2;
          window.speechSynthesis.speak(u);
        } catch (e) { /* speech is a bonus; ignore failures */ }
      }

      // ===== Game flow =====
      function newGame() {
        hideOverlay();
        finished = false;
        words = pickWords(level);
        roundIndex = 0;
        stars = 0;
        startRound();
      }

      function startRound() {
        busy = false;
        const [w, emoji] = words[roundIndex];
        word = w;
        emojiEl.textContent = emoji;
        emojiEl.classList.remove('ws-bounce');
        void emojiEl.offsetWidth;
        emojiEl.classList.add('ws-pop-in');
        tiles = scramble(word).map((letter, id) => ({ id, letter }));
        slots = word.split('').map(() => null);
        locked = word.split('').map(() => false);
        setMessage('What is this? Spell it!');
        confettiLayer.innerHTML = '';
        renderStars();
        render();
      }

      function setMessage(text, cls) {
        msgEl.textContent = text;
        msgEl.className = 'ws-message' + (cls ? ' ' + cls : '');
      }

      function inTray(id) {
        return slots.indexOf(id) === -1;
      }

      function placeTile(id) {
        if (busy || finished || !inTray(id)) return;
        const pos = slots.indexOf(null);
        if (pos === -1) return;
        slots[pos] = id;
        render(pos);
        checkIfFull();
      }

      function returnSlot(pos) {
        if (busy || finished || slots[pos] === null || locked[pos]) return;
        slots[pos] = null;
        render();
      }

      function undo() {
        if (busy || finished) return;
        for (let i = slots.length - 1; i >= 0; i--) {
          if (slots[i] !== null && !locked[i]) { returnSlot(i); return; }
        }
      }

      function typeLetter(ch) {
        if (busy || finished) return;
        const t = tiles.find(t => t.letter === ch && inTray(t.id));
        if (t) placeTile(t.id);
      }

      function hint() {
        if (busy || finished) return;
        // First position that isn't already right
        let pos = -1;
        for (let i = 0; i < word.length; i++) {
          if (slots[i] === null || tiles[slots[i]].letter !== word[i]) { pos = i; break; }
        }
        if (pos === -1) return;
        const need = word[pos];
        if (slots[pos] !== null) slots[pos] = null; // wrong letter goes back home

        // Find a tile with the needed letter: tray first, then a later slot where it's misplaced, then any later unlocked slot.
        let tile = tiles.find(t => t.letter === need && inTray(t.id));
        if (!tile) {
          for (let k = pos + 1; k < slots.length && !tile; k++) {
            const id = slots[k];
            if (id !== null && !locked[k] && tiles[id].letter === need && word[k] !== need) tile = tiles[id];
          }
        }
        if (!tile) {
          for (let k = pos + 1; k < slots.length && !tile; k++) {
            const id = slots[k];
            if (id !== null && !locked[k] && tiles[id].letter === need) tile = tiles[id];
          }
        }
        if (!tile) { render(); return; }
        const from = slots.indexOf(tile.id);
        if (from !== -1) slots[from] = null;
        slots[pos] = tile.id;
        locked[pos] = true;
        setMessage('Here is a little help! 💡');
        render(pos);
        checkIfFull();
      }

      function checkIfFull() {
        if (slots.indexOf(null) !== -1) return;
        const guess = slots.map(id => tiles[id].letter).join('');
        busy = true;
        if (guess === word) onCorrect();
        else onWrong();
      }

      function onCorrect() {
        stars++;
        renderStars(true);
        setMessage('🎉 ' + CHEERS[Math.floor(Math.random() * CHEERS.length)] + ' 🎉', 'ws-good');
        slotsEl.classList.add('ws-win');
        emojiEl.classList.remove('ws-pop-in');
        void emojiEl.offsetWidth;
        emojiEl.classList.add('ws-bounce');
        spawnConfetti(confettiLayer, 40);
        speak(word);
        later(() => {
          slotsEl.classList.remove('ws-win');
          roundIndex++;
          if (roundIndex >= words.length) showVictory();
          else startRound();
        }, 1900);
      }

      function onWrong() {
        setMessage('Oops, so close! Try again 💕', 'ws-try');
        slotsEl.classList.remove('ws-shake');
        void slotsEl.offsetWidth;
        slotsEl.classList.add('ws-shake');
        later(() => {
          slotsEl.classList.remove('ws-shake');
          for (let i = 0; i < slots.length; i++) if (!locked[i]) slots[i] = null;
          busy = false;
          render();
        }, 700);
      }

      function showVictory() {
        finished = true;
        hideOverlay();
        overlayEl = document.createElement('div');
        overlayEl.className = 'ws-finished';
        overlayEl.innerHTML =
          '<div class="ws-card">' +
            '<div class="ws-trophy">🏆</div>' +
            '<h2>You did it!</h2>' +
            '<div class="ws-final-stars">' + '⭐'.repeat(stars) + '</div>' +
            '<div class="ws-final-text">You spelled ' + stars + ' words!</div>' +
            '<div class="ws-card-row">' +
              '<button class="btn purple" data-action="again">🔄 Play Again</button>' +
              '<button class="btn yellow" data-action="menu">🏠 Menu</button>' +
            '</div>' +
          '</div>';
        wrap.appendChild(overlayEl);
        spawnConfetti(overlayEl, 90);
        speak('You did it!');
      }

      function hideOverlay() {
        if (overlayEl && overlayEl.parentNode) overlayEl.parentNode.removeChild(overlayEl);
        overlayEl = null;
      }

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

      // ===== Rendering =====
      function renderStars(popLast) {
        let html = '';
        for (let i = 0; i < ROUND_SIZE; i++) {
          const on = i < stars;
          const pop = popLast && i === stars - 1;
          html += '<span class="ws-star' + (on ? ' on' : '') + (pop ? ' pop' : '') + '">' + (on ? '⭐' : '☆') + '</span>';
        }
        starsEl.innerHTML = html;
      }

      function render(popPos) {
        slotsEl.style.setProperty('--n', word.length);
        trayEl.style.setProperty('--n', word.length);
        slotsEl.innerHTML = slots.map((id, i) => {
          if (id === null) return '<button class="ws-slot empty" data-slot="' + i + '" aria-label="Empty"></button>';
          const cls = 'ws-slot filled' + (locked[i] ? ' hinted' : '') + (i === popPos ? ' pop' : '');
          return '<button class="' + cls + '" data-slot="' + i + '">' + tiles[id].letter + '</button>';
        }).join('');
        trayEl.innerHTML = tiles.map(t => {
          if (!inTray(t.id)) return '<div class="ws-tile ghost" aria-hidden="true"></div>';
          return '<button class="ws-tile" data-tile="' + t.id + '">' + t.letter + '</button>';
        }).join('');
      }

      // ===== Input =====
      function onClick(e) {
        const el = e.target.closest('[data-tile],[data-slot],[data-action]');
        if (!el || !wrap.contains(el)) return;
        const ds = el.dataset;
        if (ds.tile !== undefined) placeTile(Number(ds.tile));
        else if (ds.slot !== undefined) returnSlot(Number(ds.slot));
        else if (ds.action === 'hint') hint();
        else if (ds.action === 'speak') speak(word);
        else if (ds.action === 'again') newGame();
        else if (ds.action === 'menu') GameApp.backToMenu();
      }
      wrap.addEventListener('click', onClick);

      function onKeyDown(e) {
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        if (finished) {
          if (e.key === 'Enter') { e.preventDefault(); newGame(); }
          return;
        }
        if (e.key === 'Backspace') { e.preventDefault(); undo(); return; }
        if (e.key && e.key.length === 1 && /[a-z]/i.test(e.key)) {
          typeLetter(e.key.toUpperCase());
        }
      }
      window.addEventListener('keydown', onKeyDown);

      newGame();

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
