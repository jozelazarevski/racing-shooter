// Race HUD (§7.4 subset for M3): position + lap top-left, timer, countdown,
// standings ticker, results screen with one-input restart (§11 pillar 3).

import type { RaceDirector } from '../race/director';

function fmt(t: number): string {
  if (!isFinite(t)) return '--:--.-';
  const m = Math.floor(t / 60);
  const s = t - m * 60;
  return `${m}:${s.toFixed(1).padStart(4, '0')}`;
}

export class RaceHUD {
  private root: HTMLDivElement;
  private posEl: HTMLDivElement;
  private lapEl: HTMLDivElement;
  private timeEl: HTMLDivElement;
  private standEl: HTMLDivElement;
  private countEl: HTMLDivElement;
  private resultsEl: HTMLDivElement;
  private shownResults = false;
  onRestart: (() => void) | null = null;

  constructor() {
    const style = document.createElement('style');
    style.textContent = `
      #race-hud { position: fixed; top: 12px; right: 12px; text-align: right;
        color: #fff; font: 700 16px 'Consolas', monospace; text-shadow: 0 2px 6px rgba(0,0,0,.6);
        pointer-events: none; letter-spacing: 1px; }
      #race-hud .pos { font-size: 42px; line-height: 1; color: #9fdcff; }
      #race-hud .lap, #race-hud .time { margin-top: 4px; }
      #race-standings { position: fixed; bottom: 14px; left: 14px; color: #e8f4ff;
        font: 12px/1.6 'Consolas', monospace; background: rgba(10,12,16,.6);
        border: 1px solid rgba(120,220,255,.22); border-radius: 8px; padding: 8px 12px;
        pointer-events: none; }
      #race-standings b { color: #9fdcff; }
      #countdown { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center;
        font: 900 120px 'Consolas', monospace; color: #9fdcff; pointer-events: none;
        text-shadow: 0 6px 24px rgba(0,0,0,.6); }
      #results { position: fixed; inset: 0; display: none; align-items: center; justify-content: center;
        background: rgba(8,10,14,.78); backdrop-filter: blur(6px); z-index: 40; }
      #results .card { background: rgba(16,20,26,.95); border: 1px solid rgba(120,220,255,.3);
        border-radius: 14px; padding: 28px 40px; color: #e8f4ff; font: 14px/1.9 'Consolas', monospace;
        text-align: center; min-width: 340px; }
      #results h2 { font-size: 26px; letter-spacing: 4px; color: #9fdcff; margin-bottom: 14px; }
      #results table { margin: 0 auto 18px; border-collapse: collapse; }
      #results td { padding: 2px 14px; text-align: left; }
      #results tr.me td { color: #ffd166; font-weight: 700; }
      #results button { pointer-events: auto; cursor: pointer; font: 700 16px 'Consolas', monospace;
        letter-spacing: 2px; color: #0d0f12; background: #9fdcff; border: 0; border-radius: 8px;
        padding: 12px 34px; }
      #results button:hover { background: #c3ecff; }
    `;
    document.head.appendChild(style);

    this.root = document.createElement('div');
    this.root.id = 'race-hud';
    this.posEl = document.createElement('div'); this.posEl.className = 'pos';
    this.lapEl = document.createElement('div'); this.lapEl.className = 'lap';
    this.timeEl = document.createElement('div'); this.timeEl.className = 'time';
    this.root.append(this.posEl, this.lapEl, this.timeEl);
    document.body.appendChild(this.root);

    this.standEl = document.createElement('div');
    this.standEl.id = 'race-standings';
    document.body.appendChild(this.standEl);

    this.countEl = document.createElement('div');
    this.countEl.id = 'countdown';
    document.body.appendChild(this.countEl);

    this.resultsEl = document.createElement('div');
    this.resultsEl.id = 'results';
    document.body.appendChild(this.resultsEl);
  }

  update(director: RaceDirector) {
    const p = director.player;
    this.posEl.textContent = `${p.position}/${director.racers.length}`;
    this.lapEl.textContent = `LAP ${Math.min(p.lap, director.laps)}/${director.laps}`;
    this.timeEl.textContent = fmt(director.raceTime);

    if (director.state === 'countdown') {
      const c = Math.ceil(director.countdown);
      this.countEl.textContent = String(c);
    } else if (director.raceTime < 1) {
      this.countEl.textContent = 'GO';
    } else {
      this.countEl.textContent = '';
    }

    const rows = [...director.racers].sort((a, b) => a.position - b.position)
      .map((r) => `${r.position}. ${r.isPlayer ? '<b>YOU</b>' : r.name}`).join('<br>');
    this.standEl.innerHTML = rows;

    if (director.state === 'finished' && !this.shownResults) {
      this.shownResults = true;
      this.showResults(director);
    }
  }

  private showResults(director: RaceDirector) {
    const rows = [...director.racers].sort((a, b) => a.position - b.position).map((r) =>
      `<tr class="${r.isPlayer ? 'me' : ''}"><td>${r.position}.</td><td>${r.isPlayer ? 'YOU' : r.name}</td>` +
      `<td>${r.finished ? fmt(r.finishTime) : 'running'}</td><td>best ${fmt(r.bestLap)}</td></tr>`).join('');
    this.resultsEl.innerHTML = `
      <div class="card">
        <h2>RACE COMPLETE</h2>
        <table>${rows}</table>
        <button id="btn-next">NEXT RACE</button>
      </div>`;
    this.resultsEl.style.display = 'flex';
    document.getElementById('btn-next')!.addEventListener('click', () => {
      this.hideResults();
      this.onRestart?.();
    });
  }

  hideResults() {
    this.resultsEl.style.display = 'none';
    this.shownResults = false;
  }
}
