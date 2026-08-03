// DOM HUD: circular speedometer, standings, minimap, weapon status.
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
      nitro: $('nitro-fill'), feed: $('feed'), center: $('center-msg'),
      wrongWay: $('wrong-way'), vignette: $('damage-vignette'),
      // touch button badges
      bMissile: $('b-missile'), bMine: $('b-mine'), bShock: $('b-shock'),
      tFire: $('t-fire'), tShock: $('t-shock'), tNitro: $('t-nitro'),
    };
    this.speedo = $('speedo');
    this.spCtx = this.speedo.getContext('2d');
    this.mapCv = $('minimap-cv');
    this.mapCtx = this.mapCv ? this.mapCv.getContext('2d') : null;
    this._mapBase = null;
    this.vignetteLevel = 0;
    this._standingsHtml = '';
    this._standingsTimer = 0;
  }

  show() { this.el.hud.classList.add('on'); }
  hide() { this.el.hud.classList.remove('on'); }

  // ---------- circuit minimap (top-center panel, per the reference) ----------
  // The circuit outline is baked once to an offscreen canvas from the track's
  // real centerline; per frame we blit it and plot live car dots.
  _buildMinimap() {
    const t = this.game.track, cv = this.mapCv;
    if (!t?.center?.length || !cv) return;
    const W = cv.width, H = cv.height, pad = 30;
    let nx = Infinity, xx = -Infinity, nz = Infinity, xz = -Infinity;
    for (const c of t.center) {
      nx = Math.min(nx, c.x); xx = Math.max(xx, c.x);
      nz = Math.min(nz, c.z); xz = Math.max(xz, c.z);
    }
    const s = Math.min((W - pad * 2) / (xx - nx), (H - pad * 2) / (xz - nz));
    this._mapT = {
      s,
      ox: (W - (xx - nx) * s) / 2 - nx * s,
      oz: (H - (xz - nz) * s) / 2 - nz * s,
    };
    const base = document.createElement('canvas');
    base.width = W; base.height = H;
    const c2 = base.getContext('2d');
    const { ox, oz } = this._mapT;
    c2.lineJoin = 'round'; c2.lineCap = 'round';
    const path = () => {
      c2.beginPath();
      for (let i = 0; i <= t.N; i += 3) {
        const c = t.center[i % t.N];
        const x = c.x * s + ox, y = c.z * s + oz;
        i === 0 ? c2.moveTo(x, y) : c2.lineTo(x, y);
      }
      c2.closePath();
    };
    path(); c2.strokeStyle = 'rgba(0,0,0,.6)'; c2.lineWidth = 11; c2.stroke();
    path(); c2.strokeStyle = '#d8b878'; c2.lineWidth = 5; c2.stroke();
    // start line tick
    const c0 = t.center[0], n0 = t.nrm[0];
    c2.strokeStyle = '#fff3d0'; c2.lineWidth = 3;
    c2.beginPath();
    c2.moveTo((c0.x - n0.x * 9) * s + ox, (c0.z - n0.z * 9) * s + oz);
    c2.lineTo((c0.x + n0.x * 9) * s + ox, (c0.z + n0.z * 9) * s + oz);
    c2.stroke();
    this._mapBase = base;
    this._mapN = t.N;
  }

  drawMinimap() {
    const g = this.game, c = this.mapCtx;
    if (!c) return;
    if (!this._mapBase || this._mapN !== g.track?.N) this._buildMinimap();
    if (!this._mapBase) return;
    const cv = this.mapCv;
    c.clearRect(0, 0, cv.width, cv.height);
    c.drawImage(this._mapBase, 0, 0);
    const { s, ox, oz } = this._mapT;
    const dot = (x, z, color, r, rim) => {
      c.beginPath();
      c.arc(x * s + ox, z * s + oz, r, 0, Math.PI * 2);
      c.fillStyle = color; c.fill();
      c.lineWidth = 2; c.strokeStyle = rim; c.stroke();
    };
    for (const e of g.enemies) {
      if (e.alive) dot(e.pos.x, e.pos.z, '#ff5b3d', 4.5, 'rgba(0,0,0,.55)');
    }
    const p = g.player;
    if (p?.alive) dot(p.pos.x, p.pos.z, '#ffd400', 6, '#fff');
  }

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
    this.drawSpeedo(kmh, p.boostTimer > 0);
    this.drawMinimap();
    this.el.lap.textContent = Math.min(p.lap, g.lapsTotal);
    this.el.lapsTotal.textContent = g.lapsTotal;
    this.el.time.textContent = fmtTime(g.raceTime);
    this.el.score.textContent = g.score.toLocaleString();
    if (g.freeRoam) {
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

    // standings (rebuilt at 2 Hz)
    this._standingsTimer -= dt;
    if (!g.freeRoam && this._standingsTimer <= 0) {
      this._standingsTimer = 0.5;
      const order = [g.player, ...g.enemies].sort((a, b) => b.progress - a.progress);
      const html = order.map((c, i) =>
        `<div class="srow${c === g.player ? ' me' : ''}${c.alive ? '' : ' dead'}">${i + 1}. ${c.name}</div>`
      ).join('');
      if (html !== this._standingsHtml) {
        this._standingsHtml = html;
        this.el.standings.innerHTML = html;
      }
    }

    const hp = Math.max(0, Math.round(p.health));
    this.el.health.style.width = hp + '%';
    this.el.healthNum.textContent = hp;
    this.el.health.style.background = hp > 50
      ? 'linear-gradient(90deg,#2fb84a,#7de08a)'
      : hp > 25 ? 'linear-gradient(90deg,#ffb52e,#ffe86b)' : 'linear-gradient(90deg,#e8402a,#ff8b3b)';
    this.el.deaths.textContent = g.deaths;

    this.el.heat.style.width = Math.round(p.heat * 100) + '%';
    this.el.heatNum.textContent = p.overheated ? 'OVERHEAT' : Math.round(p.heat * 100) + '%';
    this.el.heat.classList.toggle('overheat', p.overheated);
    this.el.missiles.textContent = p.missiles > 0 ? '▲ '.repeat(p.missiles).trim() : '—';
    this.el.mines.textContent = p.mines > 0 ? '● '.repeat(p.mines).trim() : '—';
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
      const nf = Math.round(p.nitro * 100);
      this.el.tNitro.style.background =
        `conic-gradient(rgba(127,212,255,${p.boostTimer > 0 ? 1 : 0.8}) ${nf}%, rgba(38,26,12,.6) 0)`;
      this.el.tFire.classList.toggle('hot', p.overheated);
      this.el.tFire.textContent = p.overheated ? 'HOT!' : 'FIRE';
    }

    // wrong-way detection
    const t = g.track;
    const tangent = t.tan[p.trackIndex];
    const wrongWay = g.state === 'race' && p.alive && !g.freeRoam &&
      p.speedAlong > 6 && (p.forward.dot(tangent) < -0.35);
    this.el.wrongWay.style.display = wrongWay ? 'block' : 'none';

    this.vignetteLevel = Math.max(0, this.vignetteLevel - dt * 1.8);
    this.el.vignette.style.opacity = Math.min(1, this.vignetteLevel);

  }

  damageFlash(strength = 0.7) { this.vignetteLevel = Math.min(1.2, this.vignetteLevel + strength); }

  feed(text, kind = 'info') {
    const div = document.createElement('div');
    div.className = `feed-msg ${kind}`;
    div.textContent = text;
    this.el.feed.appendChild(div);
    while (this.el.feed.children.length > 5) this.el.feed.firstChild.remove();
    setTimeout(() => div.remove(), 3300);
  }

  centerMsg(text) {
    const el = this.el.center;
    el.textContent = text;
    el.classList.remove('pop');
    void el.offsetWidth; // restart animation
    el.classList.add('pop');
  }
}
