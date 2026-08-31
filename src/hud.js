// DOM HUD: circular speedometer, standings, weapon status. (NO minimap — hard rule.)
const $ = (id) => document.getElementById(id);
const SUFFIX = ['ST', 'ND', 'RD', 'TH', 'TH', 'TH', 'TH', 'TH'];

export function fmtTime(s) {
  if (!isFinite(s)) return '–:––.–';
  const m = Math.floor(s / 60);
  const sec = s - m * 60;
  return `${m}:${sec.toFixed(1).padStart(4, '0')}`;
}

export class Hud {
  constructor(game) {
    this.game = game;
    this.el = {
      hud: $('hud'), position: $('position'), posSuffix: $('position-suffix'),
      racerCount: $('racer-count'), lap: $('lap'), lapsTotal: $('laps-total'),
      time: $('race-time'), score: $('score'), standings: $('standings'),
      health: $('health-fill'), healthNum: $('health-num'), deaths: $('deaths'),
      heat: $('heat-fill'), heatNum: $('heat-num'),
      missiles: $('missile-icons'), mines: $('mine-icons'), shock: $('shock-status'),
      rounds: $('round-count'), sos: $('sos-count'),
      nitro: $('nitro-fill'), feed: $('feed'), center: $('center-msg'),
      wrongWay: $('wrong-way'), vignette: $('damage-vignette'),
      // touch button badges
      bMissile: $('b-missile'), bMine: $('b-mine'), bShock: $('b-shock'),
      tUnstuck: $('t-unstuck'), bUnstuck: $('b-unstuck'),
      tFire: $('t-fire'), tShock: $('t-shock'), tNitro: $('t-nitro'),
      bRounds: $('b-rounds'),
      // RALLY_HUD_REVIEW §4 additions
      speedNum: $('speed-num'), danger: $('danger-lane'), chatter: $('chatter'),
      strip: $('progress-strip'), floats: $('dmg-floats'), arrows: $('edge-arrows'),
      healthBox: $('health-box'),
    };
    this.speedo = $('speedo');
    this.spCtx = this.speedo.getContext('2d');
    this.vignetteLevel = 0;
    this._standingsHtml = '';
    this._standingsTimer = 0;
    this._lastHealth = null;
    this._stripKey = '';
    this._arrowPool = [];
    this._watchLeftColumn();
  }

  /** THE LEFT COLUMN STACKS ITSELF.
   *
   *  On a phone the hull panel and the message feed were pinned to hard-coded
   *  offsets — `top:96px` and `top:150px` — chosen for a race-info panel
   *  carrying a position, a lap and a clock. It also carries the CONTRACTS
   *  list, which is three rows and only appears once a race is running, so the
   *  panel grows to 146 px after the numbers those offsets were picked from
   *  were measured. Result, on every phone size tested (390x844, 360x800,
   *  320x568, and 844x390 landscape): the hull panel sat ENTIRELY inside
   *  race-info — a 150x47 overlap on a 150x47 panel — and the feed clipped its
   *  bottom corner as well.
   *
   *  A bigger magic number would have failed the same way the moment a fourth
   *  contract, a longer world name or a larger accessibility font arrived. So
   *  nothing here is a constant: the panels publish their measured heights and
   *  the stylesheet stacks off those. The observer fires on content change, not
   *  per frame, so this costs nothing while racing.
   */
  _watchLeftColumn() {
    const info = document.getElementById('race-info');
    const hull = document.getElementById('health-box');
    if (!info || !hull || typeof ResizeObserver === 'undefined') return;
    const root = document.documentElement;
    const publish = () => {
      root.style.setProperty('--info-h', `${Math.round(info.offsetHeight)}px`);
      root.style.setProperty('--hull-h', `${Math.round(hull.offsetHeight)}px`);
    };
    this._leftObs = new ResizeObserver(publish);
    this._leftObs.observe(info);
    this._leftObs.observe(hull);
    publish();
  }

  /** How many feed rows fit between the feed's top and the controls below it.
   *  Recomputed per message rather than cached: the feed's own top moves with
   *  the panels above it, and an orientation change moves everything. */
  _feedRows() {
    const feed = this.el.feed;
    if (!feed || !document.body.classList.contains('touch')) return 5;
    const top = feed.getBoundingClientRect().top;
    // the highest thing in the bottom control cluster is the ceiling
    let floor = window.innerHeight;
    for (const id of ['t-drift', 't-fire', 't-nitro', 't-missile', 't-mine', 't-shock', 'speed-box']) {
      const el = document.getElementById(id);
      if (!el || getComputedStyle(el).display === 'none') continue;
      const r = el.getBoundingClientRect();
      if (r.height > 0 && r.top < floor) floor = r.top;
    }
    const ROW = 34;                                   // message height + gap
    return Math.max(1, Math.min(5, Math.floor((floor - top - 8) / ROW)));
  }

  show() { this.el.hud.classList.add('on'); }
  hide() { this.el.hud.classList.remove('on'); }

  // HARD RULE (user): NO MINIMAPS — ever. Do not reintroduce a map overlay
  // in any form; the road, the HUD arrows and the standings carry the info.

  // ---------- circular speedometer ----------
  drawSpeedo(kmh, boosting) {
    const c = this.spCtx;
    const W = this.speedo.width, H = this.speedo.height;
    const cx = W / 2, cy = H / 2, R = W * 0.42;
    const MAX = 240;
    const a0 = Math.PI * 0.75, sweep = Math.PI * 1.5;
    const frac = Math.min(1, kmh / MAX);
    c.clearRect(0, 0, W, H);

    // dial face
    c.beginPath();
    c.arc(cx, cy, R + W * 0.05, 0, Math.PI * 2);
    c.fillStyle = 'rgba(24,16,8,0.82)';
    c.fill();
    c.lineWidth = W * 0.015;
    c.strokeStyle = 'rgba(255,212,0,0.5)';
    c.stroke();

    // track arc
    c.lineWidth = W * 0.055;
    c.lineCap = 'round';
    c.beginPath();
    c.arc(cx, cy, R * 0.86, a0, a0 + sweep);
    c.strokeStyle = 'rgba(255,255,255,0.12)';
    c.stroke();
    // speed arc, green → amber → red (drawn as segments for consistent color stops)
    if (frac > 0.003) {
      const SEGS = 24;
      for (let s = 0; s < SEGS * frac; s++) {
        const f0 = s / SEGS, f1 = Math.min(frac, (s + 0.85) / SEGS);
        const t = f0;
        const col = t < 0.55 ? '#4dd06a' : t < 0.8 ? '#ffd400' : '#e8402a';
        c.beginPath();
        c.arc(cx, cy, R * 0.86, a0 + sweep * f0, a0 + sweep * f1);
        c.strokeStyle = boosting ? '#7fd4ff' : col;
        c.stroke();
      }
    }
    // ticks
    c.lineWidth = W * 0.012;
    c.strokeStyle = 'rgba(255,255,255,0.6)';
    for (let v = 0; v <= MAX; v += 40) {
      const a = a0 + sweep * (v / MAX);
      c.beginPath();
      c.moveTo(cx + Math.cos(a) * R * 0.68, cy + Math.sin(a) * R * 0.68);
      c.lineTo(cx + Math.cos(a) * R * 0.6, cy + Math.sin(a) * R * 0.6);
      c.stroke();
    }
    // needle
    const na = a0 + sweep * frac;
    c.lineWidth = W * 0.03;
    c.lineCap = 'round';
    c.strokeStyle = boosting ? '#7fd4ff' : '#ffd400';
    c.beginPath();
    c.moveTo(cx - Math.cos(na) * R * 0.1, cy - Math.sin(na) * R * 0.1);
    c.lineTo(cx + Math.cos(na) * R * 0.62, cy + Math.sin(na) * R * 0.62);
    c.stroke();
    c.beginPath();
    c.arc(cx, cy, W * 0.035, 0, Math.PI * 2);
    c.fillStyle = '#ffd400';
    c.fill();
    // digital readout
    c.fillStyle = '#fff8e0';
    c.font = `900 ${W * 0.21}px "Luckiest Guy", Arial`;
    c.textAlign = 'center';
    c.fillText(String(kmh), cx, cy + R * 0.62);
    c.fillStyle = 'rgba(232,201,135,0.9)';
    c.font = `700 ${W * 0.075}px Arial`;
    c.fillText('KM/H', cx, cy + R * 0.82);
  }

  // ---------- per-frame update ----------
  update(dt) {
    const g = this.game, p = g.player;
    const kmh = Math.round(Math.abs(p.speedAlong) * 3.1);
    // §4: speed is a NUMBER in the corner. The gauge canvas is display:none;
    // drawing to a hidden canvas is pure waste, so it only renders if some
    // stylesheet ever shows it again.
    if (this.el.speedNum) {
      this.el.speedNum.firstChild.textContent = String(kmh);
      this.el.speedNum.classList.toggle('boosting', p.boostTimer > 0);
    }
    if (this.speedo.offsetParent) this.drawSpeedo(kmh, p.boostTimer > 0);
    this.el.lap.textContent = Math.min(p.lap, g.lapsTotal);
    this.el.lapsTotal.textContent = g.lapsTotal;
    this.el.time.textContent = fmtTime(g.raceTime);
    this.el.score.textContent = g.score.toLocaleString();
    if (g.missionMode) {
      // [MISSIONS] compact objective HUD: counter in the LAP row, mission
      // clock in the time row, objective + medal targets in the standings slot
      const M = g.mission;
      this.el.position.textContent = '🎯';
      this.el.posSuffix.textContent = '';
      this.el.racerCount.textContent = 'MISSION';
      if (M) {
        const d = M.def;
        // endurance runs count kills against no target and time UP toward the
        // medal marks; race missions count objectives and time DOWN
        this.el.lap.textContent = M.count;
        this.el.lapsTotal.textContent = d.survive ? '🚁' : d.goal;
        this.el.time.textContent = M.timed ? fmtTime(Math.max(0, M.tLeft)) : fmtTime(M.elapsed);
        // An endurance clock that has stopped must SAY so — the player has
        // outrun the fight and is banking nothing (see the engagement rule).
        const stalled = d.survive && M.started && !M.over && M.engaged === false;
        const urgent = d.survive
          ? M.started && !M.over && M.elapsed < d.bronze   // no medal banked yet
          : M.timed && M.started && !M.over && M.tLeft < 10;
        this.el.time.style.color = stalled ? '#8a8a8a' : urgent ? '#ff8a75' : d.survive ? '#8de89a' : '';
        // next medal mark, so the endurance clock always has something to chase
        const nextMark = d.survive
          ? (M.elapsed < d.bronze ? `🥉 ${fmtTime(d.bronze)}`
            : M.elapsed < d.silver ? `🥈 ${fmtTime(d.silver)}`
              : `🥇 ${fmtTime(d.gold)}`)
          : '';
        const key = `m|${d.id}|${M.started}|${nextMark}|${!!M.nav}|${stalled}`;
        if (this._standingsHtml !== key) {
          this._standingsHtml = key;
          this.el.standings.innerHTML =
            `<div class="srow me">${d.tip}</div>`
            + (d.survive
              ? `<div class="srow">${stalled ? '⏸ OUT OF THE FIGHT' : `NEXT MEDAL ${nextMark}`}</div>`
              : `<div class="srow">🥇 ${fmtTime(d.gold)} · 🥈 ${fmtTime(d.silver)}</div>`)
            + (M.nav ? '<div class="srow" id="m-nav"></div>' : '')
            + (M.started || !M.timed ? '' : '<div class="srow">MOVE TO START THE CLOCK</div>');
          this._navEl = M.nav ? this.el.standings.querySelector('#m-nav') : null;
        }
        // objective compass — an arrow + a distance, never a map (RULES §0)
        if (M.nav && this._navEl) {
          this._navEl.textContent = `${M.nav.arrow} ${M.nav.icon} ${M.nav.dist}m`;
        }
      }
    } else if (g.freeRoam) {
      this.el.position.textContent = '🌍';
      this.el.posSuffix.textContent = '';
      this.el.racerCount.textContent = 'ROAM';
      this.el.lap.textContent = '∞';
      if (this._standingsHtml !== 'roam') {
        this._standingsHtml = 'roam';
        this.el.standings.innerHTML =
          '<div class="srow">SMASH PROPS FOR CREDITS</div><div class="srow">SHOOT DOWN CHOPPERS</div>';
      }
    } else {
      const rank = g.playerRank;
      this.el.position.textContent = rank;
      this.el.posSuffix.textContent = SUFFIX[rank - 1] || 'TH';
      this.el.racerCount.textContent = 1 + g.enemies.length;
    }

    // §4 FIELD AWARENESS: the standings LIST became a progress strip — all
    // eight cars as dots by continuous progress, player highlighted. The
    // review's finding 3.8 was a race spent 8th of 8 with no way to know
    // whether the field was ahead, behind, or missing. Missions and roam
    // keep the text rows (their slot carries objectives, not a field).
    document.body.classList.toggle('hud-rows', !!(g.missionMode || g.freeRoam));
    this._standingsTimer -= dt;
    if (!g.freeRoam && !g.missionMode && this.el.strip && this._standingsTimer <= 0) {
      this._standingsTimer = 0.25;
      const cars = [g.player, ...g.enemies];
      let lo = Infinity, hi = -Infinity;
      for (const c of cars) { lo = Math.min(lo, c.progress); hi = Math.max(hi, c.progress); }
      const span = Math.max(0.05, hi - lo);
      const html = cars.map((c) => {
        const f = Math.round(((c.progress - lo) / span) * 92 + 2);
        return `<i class="${c === g.player ? 'me' : ''}${c.alive ? '' : ' dead'}" style="left:${f}%"></i>`;
      }).join('');
      if (html !== this._stripKey) { this._stripKey = html; this.el.strip.innerHTML = html; }
    }
    if (this.el.strip) this.el.strip.style.display = (g.missionMode || g.freeRoam) ? 'none' : '';

    const hp = Math.max(0, Math.round(p.health));
    this.el.health.style.width = hp + '%';
    this.el.healthNum.textContent = hp;
    this.el.health.style.background = hp > 50
      ? 'linear-gradient(90deg,#2fb84a,#7de08a)'
      : hp > 25 ? 'linear-gradient(90deg,#ffb52e,#ffe86b)' : 'linear-gradient(90deg,#e8402a,#ff8b3b)';
    // §4 HULL PRESENTATION, watched off the NUMBER so no damage path can
    // forget to announce itself: bar flash (120 ms), edge vignette scaled by
    // the size of the hit over 20, a floating number spawned AT THE CAR (the
    // one place the eyes are), and a 2 Hz pulse below 25.
    if (this._lastHealth === null || p.health > this._lastHealth) this._lastHealth = p.health;
    const drop = this._lastHealth - p.health;
    if (drop >= 1 && p.alive) {
      const hb = this.el.healthBox;
      if (hb) {
        hb.classList.remove('hit'); void hb.offsetWidth; hb.classList.add('hit');
        clearTimeout(this._hitT);
        this._hitT = setTimeout(() => hb.classList.remove('hit'), 120);
      }
      this.vignetteLevel = Math.min(1.2, this.vignetteLevel
        + Math.min(1, 0.25 + Math.max(0, drop - 20) * 0.03));
      if (this.el.floats && p.mesh) {
        const v = (this._pv ??= p.mesh.position.clone());
        v.copy(p.mesh.position).project(g.camera);
        if (v.z < 1) {
          const d = document.createElement('div');
          d.className = 'dfloat';
          d.textContent = `−${Math.round(drop)}`;
          d.style.left = `${(v.x + 1) * 50}%`;
          d.style.top = `${(1 - (v.y + 1) / 2) * 100}%`;
          this.el.floats.appendChild(d);
          setTimeout(() => d.remove(), 750);
        }
      }
    }
    this._lastHealth = p.health;
    this.el.healthBox?.classList.toggle('pulse', hp < 25 && hp > 0 && p.alive);
    // HULLS, NOT WRECKS. A rising count of things that had already gone wrong
    // told you nothing about what you had left; three-strikes needs the number
    // you are about to run out of, and it needs to be alarming before it is
    // spent, not after. Free roam and missions have no hull budget, so they
    // keep the plain tally.
    const lives = g.hullLives ?? 3;
    if (g.freeRoam || g.missionMode) {
      this.el.deaths.textContent = g.deaths;
      this.el.deaths.classList.remove('low', 'last');
    } else {
      const left = Math.max(0, lives - g.deaths);
      this.el.deaths.textContent = '◆'.repeat(left) + '◇'.repeat(Math.max(0, lives - left));
      this.el.deaths.classList.toggle('low', left === 2);
      this.el.deaths.classList.toggle('last', left <= 1);
    }

    this.el.heat.style.width = Math.round(p.heat * 100) + '%';
    this.el.heatNum.textContent = p.overheated ? 'OVERHEAT' : Math.round(p.heat * 100) + '%';
    this.el.heat.classList.toggle('overheat', p.overheated);
    this.el.missiles.textContent = p.missiles > 0 ? '▲ '.repeat(p.missiles).trim() : '—';
    this.el.mines.textContent = p.mines > 0 ? '● '.repeat(p.mines).trim() : '—';
    // FINITE AMMO HAS TO BE LEGIBLE BEFORE IT RUNS OUT (r173). Rounds are a
    // number rather than pips — a full drum is 240 of them — and it ambers at
    // a quarter left so the last firefight is a decision, not a surprise.
    if (this.el.rounds) {
      const rd = p.rounds ?? 0, mx = p.maxRounds || 1;
      this.el.rounds.textContent = rd > 0 ? String(rd) : 'EMPTY';
      this.el.rounds.classList.toggle('low', rd > 0 && rd / mx <= 0.25);
      this.el.rounds.classList.toggle('out', rd <= 0);
    }
    if (this.el.sos) {
      const n = p.sos ?? 0;
      this.el.sos.textContent = n > 0
        ? '🆘'.repeat(n) + (p.unstuckCool > 0 ? ` ${Math.ceil(p.unstuckCool)}s` : '')
        : 'SPENT';
      this.el.sos.classList.toggle('out', n <= 0);
    }
    if (p.shockCooldown <= 0) {
      this.el.shock.textContent = 'READY';
      this.el.shock.className = 'ready';
    } else {
      this.el.shock.textContent = Math.ceil(p.shockCooldown) + 's';
      this.el.shock.className = '';
    }
    this.el.nitro.style.width = Math.round(p.nitro * 100) + '%';
    this.el.nitro.classList.toggle('boosting', p.boostTimer > 0);

    // touch buttons double as ammo/status readouts
    if (this.game.isTouch) {
      this.el.bMissile.textContent = p.missiles;
      this.el.bMine.textContent = p.mines;
      const shockReady = p.shockCooldown <= 0;
      this.el.tShock.classList.toggle('cooling', !shockReady);
      this.el.bShock.style.display = shockReady ? 'none' : 'flex';
      if (!shockReady) this.el.bShock.textContent = Math.ceil(p.shockCooldown);
      // UNSTUCK: dimmed and unpressable while it recharges, counting down on
      // its own face so the wait is never a mystery
      // ...and since r173 it is also FINITE, so the badge carries whichever
      // number is currently stopping you: the seconds while it recharges, the
      // charges left when it is ready, and a struck-through face at zero.
      if (this.el.tUnstuck) {
        const cool = p.unstuckCool ?? 0, left = p.sos ?? 0;
        const dead = left <= 0;
        this.el.tUnstuck.classList.toggle('cooling', cool > 0 || dead);
        this.el.bUnstuck.style.display = 'flex';
        this.el.bUnstuck.textContent = dead ? '0' : cool > 0 ? Math.ceil(cool) : left;
      }
      const nf = Math.round(p.nitro * 100);
      this.el.tNitro.style.background =
        `conic-gradient(rgba(127,212,255,${p.boostTimer > 0 ? 1 : 0.8}) ${nf}%, rgba(38,26,12,.6) 0)`;
      // The fire button carries the magazine ON A BADGE now — its face as a
      // bare number was the review's "unlabelled number in a brown circle".
      // The face only changes state words (DRY/HOT), never counts.
      const rd = p.rounds ?? 0;
      this.el.tFire.classList.toggle('hot', p.overheated);
      this.el.tFire.classList.toggle('dry', rd <= 0);
      this.el.tFire.firstChild.textContent = rd <= 0 ? 'DRY' : p.overheated ? 'HOT!' : 'FIRE';
      if (this.el.bRounds) this.el.bRounds.textContent = String(rd);
    }

    // wrong-way detection
    const t = g.track;
    const tangent = t.tan[p.trackIndex];
    const onCircuit = !g.freeRoam || !!g.mission?.def.circuit; // [MISSIONS] some missions race the circuit
    const wrongWay = g.state === 'race' && p.alive && onCircuit &&
      p.speedAlong > 6 && (p.forward.dot(tangent) < -0.35);
    this.el.wrongWay.style.display = wrongWay ? 'block' : 'none';

    this.vignetteLevel = Math.max(0, this.vignetteLevel - dt * 1.8);
    this.el.vignette.style.opacity = Math.min(1, this.vignetteLevel);

    if (this.el.arrows && g.state === 'race') this._edgeArrows();
  }

  /** §4 FIELD AWARENESS, the other half: a rival within 40 u but off-screen,
   *  or a missile hunting the player, gets an arrow at the play-band edge
   *  pointing at it. Pooled nodes; at most six, nearest first. */
  _edgeArrows() {
    const g = this.game, p = g.player;
    const pool = this._arrowPool;
    let n = 0;
    const place = (pos, missile) => {
      if (n >= 6 || !pos) return;
      const v = (this._av ??= p.mesh.position.clone());
      v.copy(pos).project(g.camera);
      let { x, y } = v;
      if (v.z > 1) { x = -x; y = -y; }             // behind the camera: flip
      if (v.z < 1 && Math.abs(x) < 1 && Math.abs(y) < 1) return; // on screen
      let a = pool[n];
      if (!a) { a = document.createElement('div'); a.className = 'earrow'; a.textContent = '➤'; this.el.arrows.appendChild(a); pool.push(a); }
      const left = Math.min(94, Math.max(6, (x + 1) * 50));
      const top = Math.min(66, Math.max(20, (1 - (y + 1) / 2) * 100));
      a.style.left = left + '%';
      a.style.top = top + '%';
      a.style.transform = `translate(-50%,-50%) rotate(${Math.atan2(top - 43, left - 50)}rad)`;
      a.classList.toggle('missile', !!missile);
      a.style.display = 'block';
      n++;
    };
    const near = g.enemies
      .filter((e) => e.alive && e.pos.distanceTo(p.pos) < 40)
      .sort((a, b) => a.pos.distanceTo(p.pos) - b.pos.distanceTo(p.pos));
    for (const m of (g.weapons?.missiles ?? [])) {
      if (m.active && m.target === p) place(m.mesh?.position ?? m.pos, true);
    }
    for (const e of near) place(e.mesh?.position ?? e.pos, false);
    for (let k = n; k < pool.length; k++) pool[k].style.display = 'none';
  }

  /** Race-contracts readout under the standings: three compact rows, ✓ when
   *  done, live progress on counter contracts. Safe to call per-frame — it
   *  only touches the DOM when a row actually changes. Empty list hides it. */
  setContracts(list, ct) {
    const el = document.getElementById('contracts');
    if (!el) return;
    if (!list || !list.length) {
      if (this._contractsKey !== '') { this._contractsKey = ''; el.innerHTML = ''; }
      return;
    }
    const rows = list.map((c) => {
      // the rung's own target, not a number baked into the contract: DEMOLITION
      // II asks for 25 and must say 25
      const prog = !c.done && c.prog && ct ? ` ${c.prog(ct, c.need)}` : '';
      return `<div class="crow${c.done ? ' done' : ''}"><span>${c.done ? '✓' : '◇'} ${c.label}${prog}</span><span class="cpay">${c.pay} CR</span></div>`;
    }).join('');
    if (rows === this._contractsKey) return;
    this._contractsKey = rows;
    el.innerHTML = '<div class="clabel">CONTRACTS</div>' + rows;
  }

  damageFlash(strength = 0.7) { this.vignetteLevel = Math.min(1.2, this.vignetteLevel + strength); }

  /** §4 TOAST LANES. One lane became three, because danger, progress and
   *  chatter were visually identical (finding 3.3 — SIDESWIPED ROCK −12
   *  stacked between "DUNE: see ya!" and MINE DEPLOYED, same place, same
   *  style). Routing keys off what the message IS:
   *    danger   — hull loss, incoming fire, wrong way. Centred, red, ONE at
   *               a time, the latest preempts.
   *    chatter  — rival lines and weapon-state noise. Small, grey, one.
   *    progress — everything gold: laps, pickups, feats, credits.
   *  And NOTHING shows from the grid to GO + 3 s (finding 3.4: seven toasts
   *  in four seconds around the countdown) — the countdown owns the screen.
   */
  feed(text, kind = 'info') {
    const g = this.game;
    if (g && (g.state === 'countdown'
      || (g.state === 'race' && (g.raceTime ?? 9) < 3))) return;
    const danger = kind === 'bad' && /HULL|MISSILE|INCOMING|WRONG WAY|WRECKED|DESTROYED/.test(text);
    if (danger) return this.dangerMsg(text);
    if (/^[A-Z]+: |LOCKED|DEPLOYED|see ya|MAGAZINE|OUT OF AMMO|RACK EMPTY/.test(text)) {
      return this.chatterMsg(text);
    }
    const div = document.createElement('div');
    div.className = `feed-msg ${kind}`;
    div.textContent = text;
    this.el.feed.appendChild(div);
    // the progress lane holds at most two (its cap used to be measured
    // against the touch controls; the band layout fixes its room at 20-30%)
    while (this.el.feed.children.length > 2) this.el.feed.firstChild.remove();
    setTimeout(() => div.remove(), 1600);
  }

  /** The danger lane: one message, 1.2 s, the latest wins. */
  dangerMsg(text) {
    const el = this.el.danger;
    if (!el) return;
    el.innerHTML = '';
    const d = document.createElement('div');
    d.className = 'dmsg';
    d.textContent = text;
    el.appendChild(d);
    clearTimeout(this._dangerT);
    this._dangerT = setTimeout(() => { if (d.parentNode) d.remove(); }, 1200);
  }

  chatterMsg(text) {
    const el = this.el.chatter;
    if (!el) return;
    el.innerHTML = '';
    const c = document.createElement('div');
    c.className = 'cmsg';
    c.textContent = text;
    el.appendChild(c);
    clearTimeout(this._chatterT);
    this._chatterT = setTimeout(() => { if (c.parentNode) c.remove(); }, 1200);
  }

  centerMsg(text) {
    const el = this.el.center;
    el.textContent = text;
    el.classList.remove('pop');
    void el.offsetWidth; // restart animation
    el.classList.add('pop');
    // BELT AND BRACES (r294, "GO" still on screen at 0:42.5): the fade is a
    // CSS animation, and a HIDDEN page freezes compositor animations — the
    // pause/resume banner popped while iOS was mid-background-switch stayed
    // at full opacity for the whole lap. A real setTimeout fires on return
    // from background whatever the compositor did; it only clears the text
    // it set, so a newer message is never stomped.
    clearTimeout(this._centerClear);
    this._centerClear = setTimeout(() => {
      if (el.textContent === text) { el.classList.remove('pop'); el.textContent = ''; }
    }, 2600);
  }
}
