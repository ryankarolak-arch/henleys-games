(function () {
  const characters = [
    {
      id: 'aurora', name: 'Aurora',
      bodyColor: '#c8b6ff', maneColor: '#7ed6ff',
      accent: 'stars', accentColor: '#ffd84d',
      aura: '#a86fff', trail: '#7ed6ff',
    },
    {
      id: 'lily', name: 'Lily',
      bodyColor: '#ffffff', maneColor: '#ff6fb5',
      accent: 'lily', accentColor: '#ff3a8a',
      aura: '#ff9fd8', trail: '#ff6fb5',
    },
    {
      id: 'flower', name: 'Flower',
      bodyColor: '#fff2a8', maneColor: '#7bffb5',
      accent: 'daisy', accentColor: '#ffd84d',
      aura: '#7bffb5', trail: '#ffd84d',
    },
    {
      id: 'emily', name: 'Emily',
      bodyColor: '#ffc4dc', maneColor: '#a86fff',
      accent: 'heart', accentColor: '#ff3a6f',
      aura: '#ff6fb5', trail: '#a86fff',
    },
    {
      id: 'elizabeth', name: 'Elizabeth',
      bodyColor: '#f6efff', maneColor: '#5a3fbf',
      accent: 'crown', accentColor: '#ffd84d',
      aura: '#a86fff', trail: '#5a3fbf',
    },
    {
      id: 'cece', name: 'CeCe',
      bodyColor: '#ffb39e', maneColor: '#3affd0',
      accent: 'sparkles', accentColor: '#ffffff',
      aura: '#ff6f4d', trail: '#3affd0',
    },
    {
      id: 'alysa', name: 'Alysa',
      bodyColor: '#cdf0d8', maneColor: '#c8b6ff',
      accent: 'butterfly', accentColor: '#ff6fb5',
      aura: '#7bffb5', trail: '#c8b6ff',
    },
    {
      id: 'cutie', name: 'Cutie',
      bodyColor: '#ffe8d4', maneColor: '#ff5f8a',
      accent: 'bow', accentColor: '#ff3a8a',
      aura: '#ff9fd8', trail: '#ff5f8a',
    },
  ];

  GameApp.register({
    name: 'Unicorn Race',
    icon: '🦄',
    minPlayers: 1,
    maxPlayers: 1,

    start(root) {
      const wrap = document.createElement('div');
      wrap.className = 'race-wrap';
      const canvas = document.createElement('canvas');
      wrap.appendChild(canvas);
      root.appendChild(wrap);
      const ctx = canvas.getContext('2d');

      const W = 1000, H = 600;
      const GROUND_Y = 500;
      const UNICORN_SCREEN_X = 220;
      const UNICORN_SIZE = 80;
      const TRACK_LENGTH = 8000;

      // State
      let phase = 'select'; // select | countdown | racing | finished
      let selectedCharacter = characters[0];
      let player = null;
      let opponents = [];
      let gems = [];
      let trolls = [];
      let particles = [];
      let countdownValue = 3;
      let countdownTimer = 0;
      let raceTime = 0;
      let results = null;
      let overlayEl = null;

      function resize() {
        const rect = wrap.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.max(1, Math.floor(rect.width * dpr));
        canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      }
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(wrap);

      // ===== Character select overlay =====

      function showSelectScreen() {
        hideOverlay();
        player = null;
        phase = 'select';
        overlayEl = document.createElement('div');
        overlayEl.className = 'race-select';
        overlayEl.innerHTML =
          '<div class="race-card">' +
            '<h2>🦄 Pick your unicorn!</h2>' +
            '<div class="char-row">' +
              characters.map((c, i) =>
                '<button class="char-tile" data-idx="' + i + '" ' +
                'style="--aura:' + c.aura + ';--trail:' + c.trail + '">' +
                  '<div class="char-aura"></div>' +
                  '<canvas class="char-canvas" data-idx="' + i + '"></canvas>' +
                  '<div class="char-name">' + c.name + '</div>' +
                '</button>'
              ).join('') +
            '</div>' +
            '<button class="btn purple race-start" style="font-size:22px;padding:16px 28px;">🏁 START RACE</button>' +
          '</div>';
        wrap.appendChild(overlayEl);

        overlayEl.querySelectorAll('.char-canvas').forEach(canv => {
          const idx = Number(canv.dataset.idx);
          const dpr = window.devicePixelRatio || 1;
          const cssW = 110, cssH = 90;
          canv.width = cssW * dpr;
          canv.height = cssH * dpr;
          canv.style.width = cssW + 'px';
          canv.style.height = cssH + 'px';
          const tctx = canv.getContext('2d');
          tctx.scale(dpr, dpr);
          drawUnicorn(tctx, cssW * 0.55, 6, characters[idx], 0.85);
        });

        const syncSelected = () => {
          overlayEl.querySelectorAll('.char-tile').forEach((t, i) => {
            t.classList.toggle('selected', characters[i].id === selectedCharacter.id);
          });
        };
        syncSelected();

        overlayEl.addEventListener('click', (e) => {
          const tile = e.target.closest('.char-tile');
          if (tile) {
            selectedCharacter = characters[Number(tile.dataset.idx)];
            syncSelected();
            return;
          }
          if (e.target.classList.contains('race-start')) {
            startCountdown();
          }
        });
      }

      function hideOverlay() {
        if (overlayEl && overlayEl.parentNode) {
          overlayEl.parentNode.removeChild(overlayEl);
        }
        overlayEl = null;
      }

      // ===== Countdown → Race =====

      function startCountdown() {
        hideOverlay();
        initRace();
        phase = 'countdown';
        countdownValue = 3;
        countdownTimer = 0;
      }

      function initRace() {
        player = {
          progress: 0,
          y: GROUND_Y - UNICORN_SIZE,
          vy: 0,
          onGround: true,
          baseSpeed: 5.2,
          boostTimer: 0,
          slowTimer: 0,
          gems: 0,
          finished: false,
          finishTime: 0,
        };
        opponents = [
          { name: 'Cloudy',  speed: 4.6, progress: 0, bodyColor: '#ffffff', maneColor: '#7de0ff', finished: false, finishTime: 0 },
          { name: 'Thunder', speed: 4.9, progress: 0, bodyColor: '#c8b6ff', maneColor: '#5a3fbf', finished: false, finishTime: 0 },
          { name: 'Comet',   speed: 5.3, progress: 0, bodyColor: '#ffb86f', maneColor: '#ff5f4d', finished: false, finishTime: 0 },
        ];
        gems = [];
        for (let x = 900; x < TRACK_LENGTH - 400; x += 250 + Math.random() * 200) {
          const heights = [GROUND_Y - 40, GROUND_Y - 110, GROUND_Y - 180];
          const y = heights[Math.floor(Math.random() * heights.length)];
          gems.push({ x, y, collected: false });
        }
        trolls = [];
        let tx = 1600;
        while (tx < TRACK_LENGTH - 500) {
          trolls.push({ x: tx, hit: false });
          tx += 600 + Math.random() * 500;
        }
        particles = [];
        raceTime = 0;
        results = null;
      }

      function jump() {
        if (phase !== 'racing' || player.finished) return;
        if (player.onGround) {
          player.vy = -17;
          player.onGround = false;
          for (let i = 0; i < 8; i++) {
            addParticle(player.progress, player.y + 40, selectedCharacter.trail, 1.5);
          }
        }
      }

      function addParticle(worldX, y, color, scale) {
        particles.push({
          worldX, y,
          vx: -2 - Math.random() * 2,
          vy: -1 + Math.random() * 2,
          life: 30 + Math.random() * 20,
          maxLife: 50,
          color,
          size: (3 + Math.random() * 3) * (scale || 1),
        });
      }

      function stepRace() {
        raceTime++;

        // Jump physics
        player.y += player.vy;
        player.vy += 0.85;
        if (player.y >= GROUND_Y - UNICORN_SIZE) {
          player.y = GROUND_Y - UNICORN_SIZE;
          player.vy = 0;
          player.onGround = true;
        }

        // Speed modifiers
        if (player.boostTimer > 0) player.boostTimer--;
        if (player.slowTimer > 0) player.slowTimer--;
        let speed = player.baseSpeed;
        if (player.boostTimer > 0) speed += 2.5;
        if (player.slowTimer > 0) speed *= 0.4;

        if (!player.finished) {
          player.progress += speed;
          if (raceTime % 3 === 0) {
            addParticle(player.progress - 10, player.y + 50, selectedCharacter.trail, 1);
          }
        }

        // Opponents
        opponents.forEach(o => {
          if (!o.finished) {
            o.progress += o.speed + Math.sin(raceTime * 0.05 + o.speed) * 0.3;
          }
        });

        // Gem pickups
        gems.forEach(g => {
          if (g.collected) return;
          const dx = Math.abs(g.x - player.progress);
          const dy = Math.abs(g.y - (player.y + UNICORN_SIZE / 2));
          if (dx < 50 && dy < 60) {
            g.collected = true;
            player.gems++;
            player.boostTimer = 30;
            for (let i = 0; i < 12; i++) addParticle(g.x, g.y, '#7de0ff', 1.2);
          }
        });

        // Troll collisions (only if not jumping high enough)
        trolls.forEach(t => {
          if (t.hit) return;
          const dx = Math.abs(t.x - player.progress);
          if (dx < 38 && player.y > GROUND_Y - UNICORN_SIZE - 25) {
            t.hit = true;
            player.slowTimer = 40;
            for (let i = 0; i < 10; i++) addParticle(t.x, GROUND_Y - 30, '#8a4a6f', 1);
          }
        });

        // Particles
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.worldX += p.vx;
          p.y += p.vy;
          p.vy += 0.1;
          p.life--;
          if (p.life <= 0) particles.splice(i, 1);
        }

        // Finish lines
        if (!player.finished && player.progress >= TRACK_LENGTH) {
          player.finished = true;
          player.finishTime = raceTime;
        }
        opponents.forEach(o => {
          if (!o.finished && o.progress >= TRACK_LENGTH) {
            o.finished = true;
            o.finishTime = raceTime;
          }
        });

        // End race ~0.75s after player crosses finish
        if (player.finished && raceTime - player.finishTime > 45) {
          finishRace();
        }
        // Fallback: if race drags on forever, cap at ~50 seconds
        if (raceTime > 3600) finishRace();
      }

      function finishRace() {
        phase = 'finished';
        const all = [
          { name: 'You', progress: player.progress, finishTime: player.finishTime, finished: player.finished, isPlayer: true },
          ...opponents.map(o => ({
            name: o.name,
            progress: o.progress,
            finishTime: o.finished ? o.finishTime : Infinity,
            finished: o.finished,
            isPlayer: false,
          })),
        ];
        all.sort((a, b) => {
          if (a.finished && b.finished) return a.finishTime - b.finishTime;
          if (a.finished) return -1;
          if (b.finished) return 1;
          return b.progress - a.progress;
        });
        const place = all.findIndex(r => r.isPlayer) + 1;
        const gemBonus = player.gems * 50;
        results = { place, order: all, gemBonus };
        showResultsScreen();
      }

      function showResultsScreen() {
        hideOverlay();
        const placeLabels = { 1: '🎉 YOU WON! 🎉', 2: '🥈 Nice! 2nd Place', 3: '🥉 3rd Place', 4: '😿 4th Place' };
        const msg = placeLabels[results.place] || '🏁 Race over';
        overlayEl = document.createElement('div');
        overlayEl.className = 'race-finished';
        overlayEl.innerHTML =
          '<div class="race-card">' +
            '<h2>' + msg + '</h2>' +
            '<div style="font-size:18px;margin:12px 0;">💎 Gems: <b>' + player.gems + '</b> &nbsp;·&nbsp; bonus: <b>+' + results.gemBonus + '</b></div>' +
            '<ol class="race-results">' +
              results.order.map(r =>
                '<li' + (r.isPlayer ? ' class="me"' : '') + '>' +
                  '<span class="rname">' + r.name + '</span>' +
                  '<span class="rprog">' + (r.finished ? '✓ Finished' : Math.round(r.progress / TRACK_LENGTH * 100) + '%') + '</span>' +
                '</li>'
              ).join('') +
            '</ol>' +
            '<div class="row" style="margin-top:16px;gap:12px;flex-wrap:wrap;justify-content:center;display:flex;">' +
              '<button class="btn purple race-again">🔄 Race Again</button>' +
              '<button class="btn yellow race-change">🦄 Change Unicorn</button>' +
            '</div>' +
          '</div>';
        wrap.appendChild(overlayEl);
        overlayEl.addEventListener('click', (e) => {
          if (e.target.classList.contains('race-again')) startCountdown();
          else if (e.target.classList.contains('race-change')) showSelectScreen();
        });
        if (results.place === 1) spawnConfetti();
      }

      function spawnConfetti() {
        const colors = ['#ff6fb5', '#a86fff', '#ffd84d', '#7bffb5', '#7de0ff'];
        for (let i = 0; i < 90; i++) {
          const p = document.createElement('div');
          p.className = 'confetti';
          p.style.left = Math.random() * 100 + '%';
          p.style.background = colors[i % colors.length];
          p.style.animationDelay = Math.random() * 1.5 + 's';
          p.style.animationDuration = (2 + Math.random() * 2) + 's';
          overlayEl.appendChild(p);
        }
      }

      // ===== Rendering =====

      function draw() {
        const rect = wrap.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const sx = (rect.width * dpr) / W;
        const sy = (rect.height * dpr) / H;
        ctx.setTransform(sx, 0, 0, sy, 0, 0);

        drawBackground();
        if (phase !== 'select') {
          drawTrackAndEntities();
          drawHUD();
        }
        if (phase === 'countdown') drawCountdown();
      }

      function drawBackground() {
        const grd = ctx.createLinearGradient(0, 0, 0, H);
        grd.addColorStop(0, '#ffb6e1');
        grd.addColorStop(0.5, '#ffd6b0');
        grd.addColorStop(1, '#b8e6ff');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, W, H);

        const cameraX = player ? player.progress - UNICORN_SCREEN_X : 0;

        // Cotton-candy clouds
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        for (let i = 0; i < 9; i++) {
          const base = i * 380;
          let x = ((base - cameraX * 0.1) % 2200);
          if (x < -200) x += 2200;
          drawCloud(x - 200, 70 + (i * 37) % 110, 55);
        }

        // Gumdrop hills (mid parallax)
        const hillColors = ['#ffb6e1', '#ffc6ec'];
        for (let i = 0; i < 16; i++) {
          const base = i * 260;
          let x = ((base - cameraX * 0.3) % 2600);
          if (x < -400) x += 2600;
          ctx.fillStyle = hillColors[i % 2];
          ctx.beginPath();
          ctx.arc(x - 400, GROUND_Y + 20, 140 + (i % 3) * 30, Math.PI, 0);
          ctx.fill();
        }

        // Lollipop trees
        for (let i = 0; i < 11; i++) {
          const base = i * 340;
          let x = ((base - cameraX * 0.6) % 2400);
          if (x < -200) x += 2400;
          drawLollipop(x - 200, GROUND_Y - 20, i);
        }
      }

      function drawCloud(x, y, r) {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.arc(x + r * 0.8, y + 10, r * 0.8, 0, Math.PI * 2);
        ctx.arc(x - r * 0.8, y + 10, r * 0.8, 0, Math.PI * 2);
        ctx.arc(x + r * 0.3, y - r * 0.5, r * 0.7, 0, Math.PI * 2);
        ctx.fill();
      }

      function drawLollipop(x, groundY, seed) {
        ctx.fillStyle = '#8a5a3a';
        ctx.fillRect(x - 3, groundY - 80, 6, 80);
        const palettes = [['#ff6fb5', '#ffffff'], ['#a86fff', '#ffffff'], ['#ffd84d', '#ff9a3d']];
        const colors = palettes[seed % 3];
        ctx.save();
        ctx.translate(x, groundY - 100);
        for (let i = 0; i < 8; i++) {
          ctx.fillStyle = colors[i % 2];
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.arc(0, 0, 28, (i / 8) * Math.PI * 2, ((i + 1) / 8) * Math.PI * 2);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }

      function drawTrackAndEntities() {
        const cameraX = player.progress - UNICORN_SCREEN_X;

        // Candy-stripe ground
        const stripeW = 40;
        const offset = ((cameraX % stripeW) + stripeW) % stripeW;
        for (let x = -offset; x < W + stripeW; x += stripeW) {
          const worldStripe = Math.floor((x + cameraX) / stripeW);
          ctx.fillStyle = worldStripe % 2 === 0 ? '#ff9a3d' : '#ff6fb5';
          ctx.fillRect(x, GROUND_Y, stripeW, H - GROUND_Y);
        }
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(0, GROUND_Y, W, 4);

        // Finish line
        const finishX = TRACK_LENGTH - cameraX;
        if (finishX > -40 && finishX < W + 40) {
          const stripes = 12;
          const topY = 60;
          const stripeH = (GROUND_Y - topY) / stripes;
          for (let i = 0; i < stripes; i++) {
            ctx.fillStyle = i % 2 === 0 ? '#000' : '#fff';
            ctx.fillRect(finishX - 6, topY + i * stripeH, 12, stripeH + 1);
          }
          ctx.fillStyle = '#a86fff';
          ctx.font = 'bold 28px system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('FINISH', finishX, 50);
        }

        // Gems
        gems.forEach(g => {
          if (g.collected) return;
          const sx = g.x - cameraX;
          if (sx < -40 || sx > W + 40) return;
          drawGem(sx, g.y);
        });

        // Trolls
        trolls.forEach(t => {
          const sx = t.x - cameraX;
          if (sx < -40 || sx > W + 40) return;
          drawTroll(sx, GROUND_Y - 56, t.hit);
        });

        // Particles (behind unicorn)
        particles.forEach(p => {
          const sx = p.worldX - cameraX;
          if (sx < -20 || sx > W + 20) return;
          const alpha = p.life / p.maxLife;
          ctx.globalAlpha = alpha;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(sx, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        });

        // Opponents
        opponents.forEach(o => {
          const sx = o.progress - cameraX;
          if (sx < -80 || sx > W + 80) return;
          drawUnicorn(ctx, sx, GROUND_Y - UNICORN_SIZE, o, 0.9);
        });

        // Player unicorn
        drawUnicorn(ctx, UNICORN_SCREEN_X, player.y, selectedCharacter, 1);
      }

      function drawGem(x, y) {
        ctx.save();
        ctx.translate(x, y);
        ctx.fillStyle = '#7de0ff';
        ctx.beginPath();
        ctx.moveTo(0, -18);
        ctx.lineTo(15, 0);
        ctx.lineTo(0, 18);
        ctx.lineTo(-15, 0);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.beginPath();
        ctx.moveTo(-6, -6);
        ctx.lineTo(4, -10);
        ctx.lineTo(0, 2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      function drawStar(g, x, y, size, color) {
        g.fillStyle = color;
        g.beginPath();
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2 - Math.PI / 2;
          const r = i % 2 === 0 ? size : size * 0.4;
          const px = x + Math.cos(angle) * r;
          const py = y + Math.sin(angle) * r;
          if (i === 0) g.moveTo(px, py);
          else g.lineTo(px, py);
        }
        g.closePath();
        g.fill();
      }

      function drawHeart(g, cx, cy, size, color) {
        g.fillStyle = color;
        g.strokeStyle = '#3a2545';
        g.lineWidth = 0.8;
        g.beginPath();
        g.moveTo(cx, cy + size * 0.55);
        g.bezierCurveTo(cx - size * 1.4, cy + size * 0.1, cx - size * 1.1, cy - size * 0.9, cx, cy - size * 0.1);
        g.bezierCurveTo(cx + size * 1.1, cy - size * 0.9, cx + size * 1.4, cy + size * 0.1, cx, cy + size * 0.55);
        g.closePath();
        g.fill();
        g.stroke();
      }

      function drawFlowerBloom(g, cx, cy, petalColor, centerColor, size) {
        g.fillStyle = petalColor;
        g.strokeStyle = '#3a2545';
        g.lineWidth = 0.8;
        const petalCount = 6;
        for (let i = 0; i < petalCount; i++) {
          const angle = (i / petalCount) * Math.PI * 2;
          const px = cx + Math.cos(angle) * size * 0.7;
          const py = cy + Math.sin(angle) * size * 0.7;
          g.beginPath();
          g.arc(px, py, size * 0.5, 0, Math.PI * 2);
          g.fill();
          g.stroke();
        }
        g.fillStyle = centerColor;
        g.beginPath();
        g.arc(cx, cy, size * 0.45, 0, Math.PI * 2);
        g.fill();
        g.stroke();
      }

      function drawCrown(g, cx, cy, color) {
        g.fillStyle = color;
        g.strokeStyle = '#3a2545';
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(cx - 9, cy + 5);
        g.lineTo(cx - 9, cy + 1);
        g.lineTo(cx - 4, cy + 3);
        g.lineTo(cx, cy - 6);
        g.lineTo(cx + 4, cy + 3);
        g.lineTo(cx + 9, cy + 1);
        g.lineTo(cx + 9, cy + 5);
        g.closePath();
        g.fill();
        g.stroke();
        g.fillStyle = '#ff3a6f';
        g.beginPath();
        g.arc(cx, cy - 3, 1.5, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = '#7de0ff';
        g.beginPath();
        g.arc(cx - 4, cy + 4, 1, 0, Math.PI * 2);
        g.arc(cx + 4, cy + 4, 1, 0, Math.PI * 2);
        g.fill();
      }

      function drawBow(g, cx, cy, color) {
        g.fillStyle = color;
        g.strokeStyle = '#3a2545';
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(cx, cy);
        g.lineTo(cx - 9, cy - 5);
        g.lineTo(cx - 9, cy + 5);
        g.closePath();
        g.fill();
        g.stroke();
        g.beginPath();
        g.moveTo(cx, cy);
        g.lineTo(cx + 9, cy - 5);
        g.lineTo(cx + 9, cy + 5);
        g.closePath();
        g.fill();
        g.stroke();
        g.beginPath();
        g.arc(cx, cy, 2.5, 0, Math.PI * 2);
        g.fill();
        g.stroke();
      }

      function drawButterfly(g, cx, cy, color) {
        g.fillStyle = color;
        g.strokeStyle = '#3a2545';
        g.lineWidth = 0.8;
        g.beginPath();
        g.ellipse(cx - 4, cy - 2, 4, 3, -0.3, 0, Math.PI * 2);
        g.fill();
        g.stroke();
        g.beginPath();
        g.ellipse(cx + 4, cy - 2, 4, 3, 0.3, 0, Math.PI * 2);
        g.fill();
        g.stroke();
        g.beginPath();
        g.ellipse(cx - 3, cy + 2.5, 2.5, 2.2, 0, 0, Math.PI * 2);
        g.fill();
        g.stroke();
        g.beginPath();
        g.ellipse(cx + 3, cy + 2.5, 2.5, 2.2, 0, 0, Math.PI * 2);
        g.fill();
        g.stroke();
        g.fillStyle = '#3a2545';
        g.beginPath();
        g.ellipse(cx, cy, 1, 4, 0, 0, Math.PI * 2);
        g.fill();
      }

      function drawTroll(x, y, hit) {
        ctx.save();
        ctx.translate(x, y);
        if (hit) ctx.globalAlpha = 0.4;

        // Bright outline for high contrast against the candy-stripe ground
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        // Spiky body silhouette (very dark navy)
        const bodyPath = new Path2D();
        bodyPath.moveTo(-24, 56);
        bodyPath.lineTo(-24, 24);
        bodyPath.lineTo(-17, 32);
        bodyPath.lineTo(-10, 8);
        bodyPath.lineTo(-2, 26);
        bodyPath.lineTo(6, 2);
        bodyPath.lineTo(14, 24);
        bodyPath.lineTo(24, 18);
        bodyPath.lineTo(24, 56);
        bodyPath.closePath();

        ctx.strokeStyle = '#3affd0';
        ctx.lineWidth = 6;
        ctx.stroke(bodyPath);
        ctx.fillStyle = '#1a0f2e';
        ctx.fill(bodyPath);

        // Eyes
        ctx.fillStyle = '#ffe14d';
        ctx.beginPath();
        ctx.arc(-7, 34, 4, 0, Math.PI * 2);
        ctx.arc(9, 34, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1a0f2e';
        ctx.beginPath();
        ctx.arc(-7, 34, 1.8, 0, Math.PI * 2);
        ctx.arc(9, 34, 1.8, 0, Math.PI * 2);
        ctx.fill();

        // Jagged teeth
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(-10, 44);
        ctx.lineTo(-6, 50);
        ctx.lineTo(-2, 44);
        ctx.lineTo(2, 50);
        ctx.lineTo(6, 44);
        ctx.lineTo(10, 50);
        ctx.lineTo(10, 44);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      }

      function drawUnicorn(g, x, y, c, scale) {
        g.save();
        g.translate(x, y);
        g.scale(scale, scale);

        const outline = '#3a2545';
        g.lineJoin = 'round';

        // Soft aura
        const grd = g.createRadialGradient(0, 50, 8, 0, 50, 55);
        grd.addColorStop(0, c.bodyColor + 'aa');
        grd.addColorStop(1, c.bodyColor + '00');
        g.fillStyle = grd;
        g.beginPath();
        g.arc(0, 50, 55, 0, Math.PI * 2);
        g.fill();

        // Tail
        g.fillStyle = c.maneColor;
        g.strokeStyle = outline;
        g.lineWidth = 2;
        g.beginPath();
        g.moveTo(-26, 38);
        g.quadraticCurveTo(-52, 32, -48, 58);
        g.quadraticCurveTo(-42, 48, -34, 52);
        g.quadraticCurveTo(-50, 56, -46, 72);
        g.quadraticCurveTo(-30, 60, -22, 60);
        g.closePath();
        g.fill();
        g.stroke();

        // Stars in tail (Aurora)
        if (c.accent === 'stars') {
          drawStar(g, -38, 46, 2.5, c.accentColor);
          drawStar(g, -42, 64, 2, c.accentColor);
        }

        // Legs
        g.fillStyle = c.bodyColor;
        g.lineWidth = 1.5;
        const legs = [[-22, 56], [-10, 56], [8, 56], [20, 56]];
        legs.forEach(([lx, ly]) => {
          g.beginPath();
          g.rect(lx, ly, 8, 22);
          g.fill();
          g.stroke();
        });
        g.fillStyle = outline;
        legs.forEach(([lx]) => g.fillRect(lx, 74, 8, 4));

        // Body
        g.fillStyle = c.bodyColor;
        g.lineWidth = 2;
        g.beginPath();
        g.ellipse(0, 50, 30, 16, 0, 0, Math.PI * 2);
        g.fill();
        g.stroke();

        // Body-side accents
        if (c.accent === 'heart') drawHeart(g, -8, 50, 5, c.accentColor);
        if (c.accent === 'sparkles') {
          [[12, 46], [-15, 52], [-22, 44], [18, 40], [4, 56]].forEach(([sx, sy]) =>
            drawStar(g, sx, sy, 2.5, c.accentColor));
        }
        if (c.accent === 'butterfly') drawButterfly(g, -12, 44, c.accentColor);

        // Head
        g.fillStyle = c.bodyColor;
        g.beginPath();
        g.ellipse(26, 36, 13, 12, 0, 0, Math.PI * 2);
        g.fill();
        g.stroke();

        // Snout
        g.beginPath();
        g.ellipse(36, 40, 8, 7, 0, 0, Math.PI * 2);
        g.fill();
        g.stroke();

        // Mane
        g.fillStyle = c.maneColor;
        g.beginPath();
        g.moveTo(20, 24);
        g.quadraticCurveTo(8, 18, -2, 30);
        g.quadraticCurveTo(-8, 42, 4, 44);
        g.quadraticCurveTo(12, 32, 22, 40);
        g.closePath();
        g.fill();
        g.stroke();

        // Forelock
        g.beginPath();
        g.moveTo(22, 24);
        g.quadraticCurveTo(28, 20, 32, 30);
        g.quadraticCurveTo(28, 28, 24, 32);
        g.closePath();
        g.fill();
        g.stroke();

        // Stars in mane (Aurora)
        if (c.accent === 'stars') {
          drawStar(g, 6, 30, 2.6, c.accentColor);
          drawStar(g, -2, 38, 2.2, c.accentColor);
          drawStar(g, 14, 36, 1.8, c.accentColor);
        }

        // Ear
        g.fillStyle = c.bodyColor;
        g.beginPath();
        g.moveTo(20, 26);
        g.lineTo(18, 18);
        g.lineTo(24, 24);
        g.closePath();
        g.fill();
        g.stroke();

        // Head-top accents
        if (c.accent === 'lily') drawFlowerBloom(g, 14, 16, c.accentColor, '#ffe14d', 5);
        if (c.accent === 'daisy') drawFlowerBloom(g, 14, 16, '#ffffff', c.accentColor, 6);
        if (c.accent === 'crown') drawCrown(g, 22, 18, c.accentColor);
        if (c.accent === 'bow') drawBow(g, 18, 18, c.accentColor);

        // Horn
        g.fillStyle = '#ffd84d';
        g.strokeStyle = outline;
        g.lineWidth = 2;
        g.beginPath();
        g.moveTo(25, 22);
        g.lineTo(30, 4);
        g.lineTo(34, 22);
        g.closePath();
        g.fill();
        g.stroke();
        g.strokeStyle = '#c89a2d';
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(27, 17); g.lineTo(33, 17);
        g.moveTo(28, 11); g.lineTo(32, 11);
        g.stroke();

        // Eye
        g.fillStyle = outline;
        g.beginPath();
        g.arc(31, 35, 1.8, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = '#ffffff';
        g.beginPath();
        g.arc(31.6, 34.4, 0.7, 0, Math.PI * 2);
        g.fill();

        // Eyelashes (Emily)
        if (c.accent === 'heart') {
          g.strokeStyle = outline;
          g.lineWidth = 1.2;
          g.lineCap = 'round';
          g.beginPath();
          g.moveTo(31, 33); g.lineTo(30.5, 30.5);
          g.moveTo(33, 33.5); g.lineTo(33.5, 30.5);
          g.moveTo(34, 34); g.lineTo(35.5, 32.5);
          g.stroke();
        }

        // Blush cheeks (Cutie)
        if (c.accent === 'bow') {
          g.fillStyle = '#ff9fd8';
          g.beginPath();
          g.arc(28, 41, 2, 0, Math.PI * 2);
          g.arc(38, 43, 2, 0, Math.PI * 2);
          g.fill();
        }

        g.restore();
      }

      function drawHUD() {
        const barX = 80, barY = 20, barW = W - 160, barH = 18;
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.fillRect(barX, barY, barW, barH);
        ctx.strokeStyle = 'rgba(58, 37, 69, 0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(barX, barY, barW, barH);

        const racers = [
          { pos: player.progress, color: selectedCharacter.aura, me: true },
          ...opponents.map(o => ({ pos: o.progress, color: o.bodyColor, me: false })),
        ];
        racers.forEach(r => {
          const pct = Math.max(0, Math.min(1, r.pos / TRACK_LENGTH));
          const x = barX + pct * barW;
          ctx.fillStyle = r.color;
          ctx.beginPath();
          ctx.arc(x, barY + barH / 2, r.me ? 11 : 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.stroke();
        });

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 26px system-ui, sans-serif';
        ctx.textBaseline = 'top';
        ctx.textAlign = 'right';
        ctx.fillText('💎 ' + player.gems, W - 20, 58);
        ctx.textAlign = 'left';
        ctx.fillText('🦄 ' + selectedCharacter.name, 80, 58);

        // Tap hint during early race
        if (raceTime < 120) {
          ctx.textAlign = 'center';
          ctx.font = 'bold 22px system-ui, sans-serif';
          ctx.fillStyle = 'rgba(255,255,255,0.9)';
          ctx.fillText('Tap or press SPACE to jump!', W / 2, 100);
        }
      }

      function drawCountdown() {
        countdownTimer++;
        const frames = 45;
        const label = countdownValue > 0 ? String(countdownValue) : 'GO!';
        const progress = Math.min(1, countdownTimer / frames);
        const scale = 1 + (1 - progress) * 0.6;
        const alpha = 1 - Math.pow(progress, 3) * 0.2;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(W / 2, H / 2);
        ctx.scale(scale, scale);
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath();
        ctx.arc(0, 0, 120, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = countdownValue === 0 ? '#ffd84d' : '#fff';
        ctx.font = 'bold 120px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, 0, 0);
        ctx.restore();

        if (countdownTimer >= frames) {
          countdownTimer = 0;
          countdownValue--;
          if (countdownValue < 0) phase = 'racing';
        }
      }

      // ===== Input =====

      function onPointerDown(e) {
        if (e.target !== canvas) return;
        if (phase === 'racing') jump();
      }
      canvas.addEventListener('pointerdown', onPointerDown);

      function onKeyDown(e) {
        if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
          e.preventDefault();
          if (phase === 'racing') jump();
        }
      }
      window.addEventListener('keydown', onKeyDown);

      // ===== Loop =====

      let rafId;
      function loop() {
        if (phase === 'racing') stepRace();
        draw();
        rafId = requestAnimationFrame(loop);
      }
      rafId = requestAnimationFrame(loop);

      showSelectScreen();

      return function cleanup() {
        cancelAnimationFrame(rafId);
        ro.disconnect();
        canvas.removeEventListener('pointerdown', onPointerDown);
        window.removeEventListener('keydown', onKeyDown);
        root.innerHTML = '';
      };
    },
  });
})();
