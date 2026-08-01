// DOM HUD + canvas minimap.
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
      time: $('race-time'), score: $('score'), speed: $('speed'),
      health: $('health-fill'), healthNum: $('health-num'), deaths: $('deaths'),
      heat: $('heat-fill'), heatNum: $('heat-num'), missiles: $('missile-icons'),
      boost: $('boost-fill'), feed: $('feed'), center: $('center-msg'),
      wrongWay: $('wrong-way'), vignette: $('damage-vignette'),
    };
    this.map = $('minimap');
    this.mapCtx = this.map.getContext('2d');
    this.vignetteLevel = 0;
    this._computeMapTransform();
  }

  show() { this.el.hud.classList.add('on'); }
  hide() { this.el.hud.classList.remove('on'); }

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
    // track outline
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
    // start line
    const s = this._mapPt(g.track.center[0]);
    c.fillStyle = '#fff';
    c.fillRect(s[0] - 3, s[1] - 3, 6, 6);
    // pickups
    for (const p of g.pickups) {
      if (!p.active) continue;
      const [x, y] = this._mapPt(p.pos);
      c.fillStyle = p.type === 'health' ? '#4dff88' : '#ffb52e';
      c.beginPath(); c.arc(x, y, 3, 0, Math.PI * 2); c.fill();
    }
    // rivals
    for (const e of g.enemies) {
      if (!e.alive) continue;
      const [x, y] = this._mapPt(e.pos);
      c.fillStyle = '#e8402a';
      c.beginPath(); c.arc(x, y, 4, 0, Math.PI * 2); c.fill();
    }
    // player (arrow showing heading)
    const p = g.player;
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

  update(dt) {
    const g = this.game, p = g.player;
    const kmh = Math.round(Math.abs(p.speedAlong) * 3.1);
    this.el.speed.textContent = kmh;
    this.el.lap.textContent = Math.min(p.lap, g.lapsTotal);
    this.el.lapsTotal.textContent = g.lapsTotal;
    this.el.time.textContent = fmtTime(g.raceTime);
    this.el.score.textContent = g.score.toLocaleString();
    const rank = g.playerRank;
    this.el.position.textContent = rank;
    this.el.posSuffix.textContent = SUFFIX[rank - 1] || 'TH';
    this.el.racerCount.textContent = 1 + g.enemies.length;

    const hp = Math.max(0, Math.round(p.health));
    this.el.health.style.width = hp + '%';
    this.el.healthNum.textContent = hp;
    this.el.health.style.background = hp > 50
      ? 'linear-gradient(90deg,#22ff9a,#7dffca)'
      : hp > 25 ? 'linear-gradient(90deg,#ffb52e,#ffe86b)' : 'linear-gradient(90deg,#ff3b5b,#ff8b3b)';
    this.el.deaths.textContent = g.deaths;

    this.el.heat.style.width = Math.round(p.heat * 100) + '%';
    this.el.heatNum.textContent = p.overheated ? 'OVERHEAT' : Math.round(p.heat * 100) + '%';
    this.el.heat.classList.toggle('overheat', p.overheated);
    this.el.missiles.textContent = p.missiles > 0 ? '▲ '.repeat(p.missiles).trim() : '—';
    this.el.boost.style.width = (p.boostTimer > 0 ? Math.min(1, p.boostTimer / 1.6) * 100 : 0) + '%';

    // wrong-way detection
    const t = g.track;
    const tangent = t.tan[p.trackIndex];
    const wrongWay = g.state === 'race' && p.alive &&
      p.speedAlong > 6 && (p.forward.dot(tangent) < -0.35);
    this.el.wrongWay.style.display = wrongWay ? 'block' : 'none';

    // damage vignette decay
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
