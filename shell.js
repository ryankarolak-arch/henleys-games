(function () {
  const games = [];
  let currentCleanup = null;

  function register(game) {
    games.push(game);
  }

  function boot() {
    renderMenu();
  }

  function cleanupCurrent() {
    if (currentCleanup) {
      try { currentCleanup(); } catch (e) { console.warn(e); }
      currentCleanup = null;
    }
  }

  function renderMenu() {
    cleanupCurrent();
    const app = document.getElementById('app');
    app.innerHTML = '';

    const menu = document.createElement('div');
    menu.className = 'menu';

    const h1 = document.createElement('h1');
    h1.textContent = "Henley Parker Games";
    menu.appendChild(h1);

    const subtitle = document.createElement('div');
    subtitle.className = 'subtitle';
    subtitle.textContent = 'Pick a game to play!';
    menu.appendChild(subtitle);

    const tiles = document.createElement('div');
    tiles.className = 'tiles';

    games.forEach(game => {
      const tile = document.createElement('div');
      tile.className = 'tile';
      tile.innerHTML =
        '<div class="icon">' + game.icon + '</div>' +
        '<div class="name">' + game.name + '</div>';
      tile.addEventListener('click', () => pickGame(game));
      tiles.appendChild(tile);
    });

    const upcoming = [];
    upcoming.forEach(g => {
      const tile = document.createElement('div');
      tile.className = 'tile locked';
      tile.innerHTML =
        '<div class="icon">' + g.icon + '</div>' +
        '<div class="name">' + g.name + '<br><small>coming soon</small></div>';
      tiles.appendChild(tile);
    });

    menu.appendChild(tiles);
    app.appendChild(menu);
  }

  function pickGame(game) {
    if (game.minPlayers !== game.maxPlayers) {
      showPlayerPicker(game);
    } else if (game.difficulties && game.minPlayers === 1) {
      showDifficultyPicker(game, 1);
    } else {
      startGame(game, game.minPlayers, null);
    }
  }

  function closeOverlay(overlay) {
    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
  }

  function showPlayerPicker(game) {
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.innerHTML =
      '<div class="card">' +
        '<h2>' + game.icon + ' ' + game.name + '</h2>' +
        '<div class="row">' +
          '<button class="btn purple" data-players="1">🧍 1 Player</button>' +
          '<button class="btn" data-players="2">🧍🧍 2 Players</button>' +
        '</div>' +
        '<div class="row" style="margin-top:16px;">' +
          '<button class="btn yellow" data-cancel="1">Cancel</button>' +
        '</div>' +
      '</div>';
    overlay.addEventListener('click', (e) => {
      const ds = e.target.dataset || {};
      if (ds.players) {
        closeOverlay(overlay);
        const p = Number(ds.players);
        if (p === 1 && game.difficulties) {
          showDifficultyPicker(game, 1);
        } else {
          startGame(game, p, null);
        }
      } else if (ds.cancel) {
        closeOverlay(overlay);
      }
    });
    document.body.appendChild(overlay);
  }

  function showDifficultyPicker(game, players) {
    const overlay = document.createElement('div');
    overlay.className = 'overlay';

    const buttons = game.difficulties.map((d, i) => {
      const cls = i === 0 ? 'btn mint' : i === 1 ? 'btn yellow' : 'btn';
      return (
        '<button class="' + cls + '" data-diff="' + d.id + '">' +
          d.label +
          (d.hint ? '<div style="font-size:12px;font-weight:400;opacity:0.75;margin-top:2px;">' + d.hint + '</div>' : '') +
        '</button>'
      );
    }).join('');

    overlay.innerHTML =
      '<div class="card">' +
        '<h2>How hard should it be?</h2>' +
        '<div class="row" style="flex-direction:column;align-items:stretch;">' + buttons + '</div>' +
        '<div class="row" style="margin-top:16px;">' +
          '<button class="btn purple" data-cancel="1">Cancel</button>' +
        '</div>' +
      '</div>';

    overlay.addEventListener('click', (e) => {
      const ds = e.target.closest('[data-diff],[data-cancel]') ? e.target.closest('[data-diff],[data-cancel]').dataset : {};
      if (ds.diff) {
        closeOverlay(overlay);
        startGame(game, players, ds.diff);
      } else if (ds.cancel) {
        closeOverlay(overlay);
      }
    });
    document.body.appendChild(overlay);
  }

  function startGame(game, playerCount, difficulty) {
    cleanupCurrent();
    const app = document.getElementById('app');
    app.innerHTML = '';

    const view = document.createElement('div');
    view.className = 'game-view';

    const back = document.createElement('button');
    back.className = 'back-btn';
    back.innerHTML = '←';
    back.setAttribute('aria-label', 'Back to menu');
    back.addEventListener('click', renderMenu);
    view.appendChild(back);

    const root = document.createElement('div');
    root.className = 'game-root';
    view.appendChild(root);

    app.appendChild(view);

    try {
      currentCleanup = game.start(root, { players: playerCount, difficulty });
    } catch (e) {
      console.error('Game crashed:', e);
      renderMenu();
    }
  }

  window.GameApp = { register, boot, backToMenu: renderMenu };
})();
