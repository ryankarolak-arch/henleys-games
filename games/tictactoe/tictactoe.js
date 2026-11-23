(function () {
  GameApp.register({
    name: 'Tic Tac Toe',
    icon: '⭕',
    minPlayers: 1,
    maxPlayers: 2,
    difficulties: [
      { id: 'easy',   label: '🌱 Easy',   hint: 'For little kids' },
      { id: 'medium', label: '🌳 Medium', hint: 'A fair match' },
      { id: 'hard',   label: '⚡ Hard',   hint: 'Very tough!' },
    ],

    start(root, { players, difficulty }) {
      const aiPlays = players === 1 ? 'O' : null;
      const diff = difficulty || 'medium';

      let board = Array(9).fill('');
      let turn = 'X';
      let gameOver = false;

      const wrap = document.createElement('div');
      wrap.className = 'ttt-wrap';

      const status = document.createElement('div');
      status.className = 'ttt-status';
      wrap.appendChild(status);

      const boardEl = document.createElement('div');
      boardEl.className = 'ttt-board';
      wrap.appendChild(boardEl);

      const cells = [];
      for (let i = 0; i < 9; i++) {
        const c = document.createElement('button');
        c.className = 'ttt-cell';
        c.addEventListener('click', () => onCellClick(i));
        boardEl.appendChild(c);
        cells.push(c);
      }

      const resetBtn = document.createElement('button');
      resetBtn.className = 'btn purple';
      resetBtn.textContent = '🔄 New Game';
      resetBtn.addEventListener('click', reset);
      wrap.appendChild(resetBtn);

      root.appendChild(wrap);

      function onCellClick(i) {
        if (gameOver || board[i]) return;
        if (aiPlays && turn === aiPlays) return;
        placeMark(i, turn);
      }

      function placeMark(i, mark) {
        board[i] = mark;
        cells[i].textContent = mark;
        cells[i].classList.add(mark.toLowerCase());

        const winLine = checkWin(board);
        if (winLine) {
          winLine.forEach(idx => cells[idx].classList.add('win'));
          gameOver = true;
          if (players === 1) {
            status.textContent = mark === 'X' ? '🎉 You win! 🎉' : '🤖 Computer wins!';
          } else {
            status.textContent = '🎉 Player ' + (mark === 'X' ? 1 : 2) + ' wins! 🎉';
          }
          return;
        }
        if (board.every(Boolean)) {
          gameOver = true;
          status.textContent = "It's a tie!";
          return;
        }

        turn = turn === 'X' ? 'O' : 'X';
        updateStatus();

        if (aiPlays && turn === aiPlays) {
          setTimeout(aiMove, 450);
        }
      }

      function aiMove() {
        if (gameOver) return;
        let move;
        if (diff === 'easy')        move = easyMove(board);
        else if (diff === 'hard')   move = hardMove(board, aiPlays);
        else                        move = mediumMove(board, aiPlays);
        placeMark(move, aiPlays);
      }

      // Easy: pure random. A 5yo who notices their own winning line will win.
      function easyMove(b) {
        const empty = [];
        for (let i = 0; i < 9; i++) if (!b[i]) empty.push(i);
        return empty[Math.floor(Math.random() * empty.length)];
      }

      // Medium: take a win, block a loss, else positional — with some slop so kids can still win.
      function mediumMove(b, mark) {
        const opp = mark === 'X' ? 'O' : 'X';
        for (let i = 0; i < 9; i++) {
          if (!b[i]) { const t = b.slice(); t[i] = mark; if (checkWin(t)) return i; }
        }
        // Block ~75% of the time (leaves openings sometimes)
        if (Math.random() < 0.75) {
          for (let i = 0; i < 9; i++) {
            if (!b[i]) { const t = b.slice(); t[i] = opp; if (checkWin(t)) return i; }
          }
        }
        if (!b[4] && Math.random() < 0.75) return 4;
        const corners = [0, 2, 6, 8].filter(i => !b[i]);
        if (corners.length) return corners[Math.floor(Math.random() * corners.length)];
        const sides = [1, 3, 5, 7].filter(i => !b[i]);
        return sides[Math.floor(Math.random() * sides.length)];
      }

      // Hard: minimax. Never loses.
      function hardMove(b, mark) {
        const opp = mark === 'X' ? 'O' : 'X';
        const result = minimax(b.slice(), true, mark, opp);
        return result.move;
      }

      function minimax(b, isMax, me, opp) {
        const win = checkWin(b);
        if (win) {
          return { score: b[win[0]] === me ? 10 : -10, move: -1 };
        }
        if (b.every(Boolean)) return { score: 0, move: -1 };

        let best = null;
        for (let i = 0; i < 9; i++) {
          if (!b[i]) {
            b[i] = isMax ? me : opp;
            const { score } = minimax(b, !isMax, me, opp);
            b[i] = '';
            if (
              best === null ||
              (isMax && score > best.score) ||
              (!isMax && score < best.score)
            ) {
              best = { score, move: i };
            }
          }
        }
        return best;
      }

      function checkWin(b) {
        const lines = [
          [0, 1, 2], [3, 4, 5], [6, 7, 8],
          [0, 3, 6], [1, 4, 7], [2, 5, 8],
          [0, 4, 8], [2, 4, 6],
        ];
        for (const L of lines) {
          const [a, b2, c] = L;
          if (b[a] && b[a] === b[b2] && b[a] === b[c]) return L;
        }
        return null;
      }

      function updateStatus() {
        if (gameOver) return;
        if (players === 1) {
          const diffLabel = diff.charAt(0).toUpperCase() + diff.slice(1);
          status.textContent = turn === 'X'
            ? 'Your turn! (' + diffLabel + ')'
            : '🤖 Computer thinking...';
        } else {
          status.textContent = 'Player ' + (turn === 'X' ? 1 : 2) + "'s turn (" + turn + ')';
        }
      }

      function reset() {
        board = Array(9).fill('');
        turn = 'X';
        gameOver = false;
        cells.forEach(c => { c.textContent = ''; c.className = 'ttt-cell'; });
        updateStatus();
      }

      updateStatus();

      return function cleanup() {
        root.innerHTML = '';
      };
    },
  });
})();
