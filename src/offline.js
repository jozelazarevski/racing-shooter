/* Offline arming + the OFFLINE READY badge.
 *
 * Kept in its own classic script (not a module, not main.js) so the service
 * worker registers even if the module graph is slow, and so this file stays
 * out of the way of the gameplay code other agents are editing.
 */
(function () {
  if (!('serviceWorker' in navigator)) return;

  // A file:// open has no service-worker support and no origin to cache
  // against; bail quietly rather than throwing on every load.
  if (location.protocol === 'file:') return;

  const badge = () => document.getElementById('offline-badge');

  const paint = (state, text, title) => {
    const el = badge();
    if (!el) return;
    el.className = state;          // 'arming' | 'ready' | 'partial'
    el.textContent = text;
    if (title) el.title = title;
  };

  const ask = (sw) => {
    if (!sw) return;
    sw.postMessage('ignite-offline-status');
  };

  // ---- OPTIONAL, BACKGROUND STORING ------------------------------------
  // The worker used to precache all 21 world previews on install — 1.15 MB of
  // menu art, fetched on a first visit before the player had opened a menu.
  // Now the game itself is stored automatically (it is small, and already in
  // the HTTP cache from the page load), and the ART is stored only if asked
  // for, one file at a time, in the background.
  const WANT = 'ignite-store-art';
  const wants = () => { try { return localStorage.getItem(WANT) === '1'; } catch { return false; } };
  const setWants = (v) => { try { localStorage.setItem(WANT, v ? '1' : '0'); } catch { /* private mode */ } };
  let storing = false;

  const askStore = () => {
    const sw = navigator.serviceWorker.controller;
    if (!sw || storing) return;
    storing = true;
    paint('arming', '✈ STORING ART…', 'Downloading world art for offline play');
    sw.postMessage('ignite-store-extras');
  };

  navigator.serviceWorker.addEventListener('message', (e) => {
    const d = e.data;
    if (!d) return;
    if (d.type === 'ignite-store-progress') {
      if (d.done >= d.total) {
        storing = false;
        paint('ready', '✈ OFFLINE READY', 'Game and world art stored — plays with no signal.');
      } else {
        paint('partial', `✈ STORING ${d.done}/${d.total}`, 'Storing world art in the background');
      }
      return;
    }
    if (d.type !== 'ignite-offline-status') return;
    if (d.ready) {
      paint('ready', '✈ OFFLINE READY',
        `All ${d.cached} files stored on this device — the game runs with no signal.`);
      setWants(true);
    } else if (d.playable) {
      // The game already runs offline. The art is the only thing outstanding,
      // and it is the player's call whether it is worth the download.
      if (wants()) askStore();
      else {
        paint('offer', '✈ SAVE ART OFFLINE',
          'The game already runs offline. Tap to also store the world art (about 1 MB).');
      }
    } else {
      paint('partial', `✈ STORING ${d.cached}/${d.core ?? d.total}`,
        'Storing the game for offline play — stay online a moment.');
    }
  });

  // the badge is a button now: tap it to opt in (and to opt back out)
  document.addEventListener('click', (ev) => {
    const el = badge();
    if (!el || ev.target !== el) return;
    if (el.className === 'offer') { setWants(true); askStore(); }
  });

  // UPDATE ON RELOAD.
  //
  // The worker serves cache-first and matches with ignoreSearch, so the ?v=rNN
  // buster in index.html is deliberately ignored — a returning player is served
  // the previous build's files no matter what the server has. The new worker
  // does install and skipWaiting, but the page that triggered it has already
  // loaded the old code, so a change only appears the SECOND time the game is
  // opened. That is indistinguishable from "you didn't fix it".
  //
  // So: the moment a new worker takes control, reload once. `hadController`
  // keeps this from firing on a first-ever visit, where there is no previous
  // build on screen to replace and a reload would just be a flicker.
  const hadController = !!navigator.serviceWorker.controller;
  let reloading = false;
  // ...but never yank the world out from under someone mid-race. If a new
  // worker lands while a lap is running, wait for the menu before reloading.
  const reloadWhenIdle = () => {
    const g = window.__game;
    const racing = g && (g.state === 'race' || g.state === 'countdown');
    if (racing) { setTimeout(reloadWhenIdle, 2000); return; }
    location.reload();
  };
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloading) return;
    reloading = true;
    reloadWhenIdle();
  });

  // Register when the main thread is IDLE, not on `load`. Registering on load
  // starts the install precache in the middle of the world build, which is the
  // busiest stretch of the whole boot.
  const bootOffline = () => {
    paint('arming', '✈ STORING…', 'Storing the game for offline play');
    navigator.serviceWorker.register('./sw.js').then((reg) => {
      // ask the browser to go and look, rather than waiting for it to decide
      reg.update?.();
      const poll = () => ask(reg.active || navigator.serviceWorker.controller);
      poll();
      // installing on a first visit: re-ask as it progresses, then stop
      let tries = 0;
      const iv = setInterval(() => {
        poll();
        if (++tries > 20) clearInterval(iv);
        const el = badge();
        if (el && (el.className === 'ready' || el.className === 'offer')) clearInterval(iv);
      }, 1500);
    }).catch((err) => {
      paint('partial', '✈ OFFLINE UNAVAILABLE', String(err && err.message || err));
    });
  };

  window.addEventListener('load', () => {
    // give the world build the main thread first; 2.5 s is the backstop for
    // browsers without requestIdleCallback (Safari, which is most phones here)
    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(bootOffline, { timeout: 4000 });
    } else {
      setTimeout(bootOffline, 2500);
    }
  });
})();
