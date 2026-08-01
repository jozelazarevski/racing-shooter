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
    };
    this.map = $('minimap');
    this.mapCtx = this.map.getContext('2d');
    this.speedo = $('speedo');
    this.spCtx = this.speedo.getContext('2d');
    this.vignetteLevel = 0;
    this._standingsHtml = '';
    this._standingsTimer = 0;
    this._computeMapTransform();
  }

  show() { this.el.hud.classList.add('on'); }
  hide() { this.el.hud.classList.remove('on'); }

  // ---------- minimap ----------
  _computeMapTransform() {
    const t = this.game.track;
    let minX = 1e9, maxX = -1e9, minZ = 1e9, maxZ = -1e9;
    for (const p of t.center) {
      minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
      minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z);
    }
    const w = this.map.width - 40, h = this.map.height - 40;
    const s = Math.min(w / (maxX - minX), h / (maxZ - minZ));
    this.mapScale = s;
    this.mapOff = {
      x: 20 + (w - (maxX - minX) * s) / 2 - minX * s,
      y: 20 + (h - (maxZ - minZ) * s) / 2 - minZ * s,
    };
  }

  _mapPt(p) { return [p.x * this.mapScale + this.mapOff.x, p.z * this.mapScale + this.mapOff.y]; }

  drawMinimap() {
    const g = this.game, c = this.mapCtx;
    c.clearRect(0, 0, this.map.width, this.map.height);
    c.beginPath();
    for (let i = 0; i <= g.track.N; i += 6) {
      const [x, y] = this._mapPt(g.track.center[i % g.track.N]);
      i === 0 ? c.moveTo(x, y) : c.lineTo(x, y);
    }
    c.closePath();
    c.strokeStyle = 'rgba(179,140,92,0.85)';
    c.lineWidth = 9;
    c.stroke();
    c.strokeStyle = 'rgba(58,36,16,0.7)';
    c.lineWidth = 2;
    c.stroke();
    const s = this._mapPt(g.track.center[0]);
    c.fillStyle = '#fff';
    c.fillRect(s[0] - 3, s[1] - 3, 6, 6);
    for (const p of g.pickups) {
      if (!p.active) continue;
      const [x, y] = this._mapPt(p.pos);
      c.fillStyle = p.color;
      c.beginPath(); c.arc(x, y, 3, 0, Math.PI * 2); c.fill();
    }
    for (const e of g.enemies) {
      if (!e.alive) continue;
      const [x, y] = this._mapPt(e.pos);
      c.fillStyle = '#e8402a';
      c.beginPath(); c.arc(x, y, 4, 0, Math.PI * 2); c.fill();
    }
    const p = this.game.player;
    const [px, py] = this._mapPt(p.pos);
    c.save();
    c.translate(px, py);
    c.rotate(Math.PI - p.heading);
    c.fillStyle = '#ffd400';
    c.shadowColor = '#3a2410'; c.shadowBlur = 4;
    c.beginPath();
    c.moveTo(0, -8); c.lineTo(5.5, 6); c.lineTo(-5.5, 6);
    c.closePath(); c.fill();
    c.restore();
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
    this.el.lap.textContent = Math.min(p.lap, g.lapsTotal);
    this.el.lapsTotal.textContent = g.lapsTotal;
    this.el.time.textContent = fmtTime(g.raceTime);
    this.el.score.textContent = g.score.toLocaleString();
    const rank = g.playerRank;
    this.el.position.textContent = rank;
    this.el.posSuffix.textContent = SUFFIX[rank - 1] || 'TH';
    this.el.racerCount.textContent = 1 + g.enemies.length;

    // standings (rebuilt at 2 Hz)
    this._standingsTimer -= dt;
    if (this._standingsTimer <= 0) {
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

    // wrong-way detection
    const t = g.track;
    const tangent = t.tan[p.trackIndex];
    const wrongWay = g.state === 'race' && p.alive &&
      p.speedAlong > 6 && (p.forward.dot(tangent) < -0.35);
    this.el.wrongWay.style.display = wrongWay ? 'block' : 'none';

    this.vignetteLevel = Math.max(0, this.vignetteLevel - dt * 1.8);
    this.el.vignette.style.opacity = Math.min(1, this.vignetteLevel);

    this.drawMinimap();
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
