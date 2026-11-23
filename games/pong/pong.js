(function () {
  GameApp.register({
    name: 'Pong',
    icon: '🏓',
    minPlayers: 1,
    maxPlayers: 2,

    start(root, { players }) {
      const wrap = document.createElement('div');
      wrap.className = 'pong-wrap';
      const canvas = document.createElement('canvas');
      wrap.appendChild(canvas);
      root.appendChild(wrap);

      const ctx = canvas.getContext('2d');

      // Logical playfield (rendering scales to fit)
      const W = 1000, H = 600;
      const paddleH = 120, paddleW = 16, paddleInset = 24;
      const winningScore = 5;

      function resize() {
        const rect = wrap.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.max(1, Math.floor(rect.width * dpr));
        canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      }
      resize();
      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(wrap);

      const leftPaddle = { y: H / 2 - paddleH / 2 };
      const rightPaddle = { y: H / 2 - paddleH / 2 };
      const ball = { x: W / 2, y: H / 2, vx: 6, vy: 3, r: 12 };

      let leftScore = 0;
      let rightScore = 0;
      let winner = null;
      let paused = true;
      let message = 'Tap to start';

      const aiSide = players === 1 ? 'right' : null;

      // Pointers: map each active touch/pointer to a side; paddle follows pointer Y.
      const activePointers = new Map();

      function clientToLogical(clientX, clientY) {
        const rect = canvas.getBoundingClientRect();
        return {
          x: ((clientX - rect.left) / rect.width) * W,
          y: ((clientY - rect.top) / rect.height) * H,
        };
      }

      function onPointerDown(e) {
        e.preventDefault();
        try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
        const p = clientToLogical(e.clientX, e.clientY);
        const side = p.x < W / 2 ? 'left' : 'right';
        activePointers.set(e.pointerId, { side, y: p.y });
        if (winner) { reset(); paused = false; return; }
        if (paused) { paused = false; }
      }
      function onPointerMove(e) {
        if (!activePointers.has(e.pointerId)) return;
        const p = clientToLogical(e.clientX, e.clientY);
        activePointers.get(e.pointerId).y = p.y;
      }
      function onPointerEnd(e) {
        activePointers.delete(e.pointerId);
      }
      canvas.addEventListener('pointerdown', onPointerDown);
      canvas.addEventListener('pointermove', onPointerMove);
      canvas.addEventListener('pointerup', onPointerEnd);
      canvas.addEventListener('pointercancel', onPointerEnd);

      // Keyboard: W/S left, Up/Down right
      const keys = {};
      function onKeyDown(e) {
        keys[e.key.toLowerCase()] = true;
        if (winner) { reset(); paused = false; return; }
        if (paused) paused = false;
      }
      function onKeyUp(e) { keys[e.key.toLowerCase()] = false; }
      window.addEventListener('keydown', onKeyDown);
      window.addEventListener('keyup', onKeyUp);

      function reset() {
        leftScore = 0;
        rightScore = 0;
        winner = null;
        resetBall(Math.random() < 0.5 ? -1 : 1);
        paused = true;
        message = 'Tap to start';
      }

      function resetBall(dir) {
        ball.x = W / 2;
        ball.y = H / 2;
        ball.vx = 6 * dir;
        ball.vy = Math.random() * 4 - 2;
      }

      function step() {
        if (paused || winner) return;

        // Pointer input → paddles
        for (const { side, y } of activePointers.values()) {
          const target = Math.max(paddleH / 2, Math.min(H - paddleH / 2, y)) - paddleH / 2;
          if (side === 'left') leftPaddle.y = target;
          else if (!aiSide) rightPaddle.y = target;
        }

        // Keyboard
        const speed = 9;
        if (keys['w']) leftPaddle.y -= speed;
        if (keys['s']) leftPaddle.y += speed;
        if (!aiSide) {
          if (keys['arrowup']) rightPaddle.y -= speed;
          if (keys['arrowdown']) rightPaddle.y += speed;
        }
        leftPaddle.y = Math.max(0, Math.min(H - paddleH, leftPaddle.y));
        rightPaddle.y = Math.max(0, Math.min(H - paddleH, rightPaddle.y));

        // AI: ease toward ball with capped speed (beatable)
        if (aiSide === 'right') {
          const target = ball.y - paddleH / 2;
          const diff = target - rightPaddle.y;
          const aiSpeed = 5;
          rightPaddle.y += Math.sign(diff) * Math.min(Math.abs(diff), aiSpeed);
        }

        ball.x += ball.vx;
        ball.y += ball.vy;

        // Top/bottom
        if (ball.y - ball.r < 0) { ball.y = ball.r; ball.vy = -ball.vy; }
        if (ball.y + ball.r > H) { ball.y = H - ball.r; ball.vy = -ball.vy; }

        // Left paddle
        if (
          ball.vx < 0 &&
          ball.x - ball.r < paddleInset + paddleW &&
          ball.x - ball.r > paddleInset - 4 &&
          ball.y > leftPaddle.y &&
          ball.y < leftPaddle.y + paddleH
        ) {
          ball.vx = -ball.vx * 1.04;
          const offset = (ball.y - (leftPaddle.y + paddleH / 2)) / (paddleH / 2);
          ball.vy += offset * 2;
        }
        // Right paddle
        if (
          ball.vx > 0 &&
          ball.x + ball.r > W - paddleInset - paddleW &&
          ball.x + ball.r < W - paddleInset + 4 &&
          ball.y > rightPaddle.y &&
          ball.y < rightPaddle.y + paddleH
        ) {
          ball.vx = -ball.vx * 1.04;
          const offset = (ball.y - (rightPaddle.y + paddleH / 2)) / (paddleH / 2);
          ball.vy += offset * 2;
        }

        // Score
        if (ball.x < -30) {
          rightScore++;
          if (!checkWinner()) { resetBall(1); paused = true; message = 'Tap to serve'; }
        }
        if (ball.x > W + 30) {
          leftScore++;
          if (!checkWinner()) { resetBall(-1); paused = true; message = 'Tap to serve'; }
        }
      }

      function checkWinner() {
        if (leftScore >= winningScore) {
          winner = players === 1 ? '🎉 You win! 🎉' : '🎉 Player 1 wins! 🎉';
          return true;
        }
        if (rightScore >= winningScore) {
          winner = players === 1 ? '🤖 Computer wins!' : '🎉 Player 2 wins! 🎉';
          return true;
        }
        return false;
      }

      function draw() {
        const rect = wrap.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const sx = (rect.width * dpr) / W;
        const sy = (rect.height * dpr) / H;
        ctx.setTransform(sx, 0, 0, sy, 0, 0);

        // Background
        ctx.fillStyle = '#3a2545';
        ctx.fillRect(0, 0, W, H);

        // Center line
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = 4;
        ctx.setLineDash([16, 16]);
        ctx.beginPath();
        ctx.moveTo(W / 2, 0);
        ctx.lineTo(W / 2, H);
        ctx.stroke();
        ctx.setLineDash([]);

        // Paddles
        ctx.fillStyle = '#ff6fb5';
        ctx.fillRect(paddleInset, leftPaddle.y, paddleW, paddleH);
        ctx.fillStyle = '#a86fff';
        ctx.fillRect(W - paddleInset - paddleW, rightPaddle.y, paddleW, paddleH);

        // Ball
        ctx.fillStyle = '#ffd84d';
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
        ctx.fill();

        // Scores
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 72px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(String(leftScore), W * 0.3, 96);
        ctx.fillText(String(rightScore), W * 0.7, 96);

        // Labels
        ctx.font = 'bold 20px system-ui, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.fillText(players === 1 ? 'YOU' : 'PLAYER 1', W * 0.3, 124);
        ctx.fillText(players === 1 ? 'COMPUTER' : 'PLAYER 2', W * 0.7, 124);

        if (winner) drawBanner(winner, 'Tap to play again');
        else if (paused) drawBanner(message, players === 2 ? 'Left = W/S    Right = ↑/↓' : 'Tap or drag your side');
      }

      function drawBanner(big, small) {
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(0, H / 2 - 90, W, 180);
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.font = 'bold 48px system-ui, sans-serif';
        ctx.fillText(big, W / 2, H / 2 + 6);
        if (small) {
          ctx.font = 'bold 22px system-ui, sans-serif';
          ctx.fillStyle = 'rgba(255,255,255,0.85)';
          ctx.fillText(small, W / 2, H / 2 + 48);
        }
      }

      let rafId;
      function loop() {
        step();
        draw();
        rafId = requestAnimationFrame(loop);
      }
      rafId = requestAnimationFrame(loop);

      return function cleanup() {
        cancelAnimationFrame(rafId);
        resizeObserver.disconnect();
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);
        root.innerHTML = '';
      };
    },
  });
})();
