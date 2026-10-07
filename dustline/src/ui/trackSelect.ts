// THE TRACK PICKER.
//
// Saving a track in the editor has always put it somewhere the game could load
// it from. The game just had no way to ASK: `/V2/` booted the first
// built-in and nothing else, so a track you had just made was reachable only by
// hand-typing `?track=<id>` into the address bar. That is not "saved into the
// game", it is saved next to it.
//
// So: a list, shown before the race, of everything this browser can play —
// what ships with the build and what you have made — with your own tracks
// first and the one you saved last already selected.
//
// EACH ENTRY DRAWS ITS OWN ROAD. A list of names tells you a track exists; a
// name plus its outline tells you which one it is, and the outline is free
// because the loop is already in the data. Nothing is built to draw it: the
// control points go straight into the same closed centripetal spline the
// engine uses, so the shape on the card is the shape you will drive.

import * as THREE from 'three';
import type { TrackDef } from '../tracks/trackDef';
import { allTracks, localTracks, lastSavedId } from '../tracks/registry';

/** The loop, as a path in a 100x100 box. The engine's own curve, sampled. */
function outline(def: TrackDef, n = 140): string {
  const curve = new THREE.CatmullRomCurve3(
    def.road.points.map(([x, z]) => new THREE.Vector3(x, 0, z)), true, 'centripetal',
  );
  const pts: [number, number][] = [];
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (let i = 0; i < n; i++) {
    const p = curve.getPoint(i / n);
    pts.push([p.x, p.z]);
    minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
    minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z);
  }
  // one scale for both axes, or a long thin circuit comes out looking round
  const span = Math.max(maxX - minX, maxZ - minZ) || 1;
  const cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2;
  const to = ([x, z]: [number, number]) =>
    `${(50 + ((x - cx) / span) * 88).toFixed(1)},${(50 + ((z - cz) / span) * 88).toFixed(1)}`;
  return `M${pts.map(to).join('L')}Z`;
}

/** Rough lap length in km, from the same samples. Worth showing because it is
 *  the one number that tells you what you are choosing between. */
function lapKm(def: TrackDef): number {
  const curve = new THREE.CatmullRomCurve3(
    def.road.points.map(([x, z]) => new THREE.Vector3(x, 0, z)), true, 'centripetal',
  );
  let d = 0;
  let prev = curve.getPoint(0);
  for (let i = 1; i <= 160; i++) {
    const p = curve.getPoint(i / 160);
    d += prev.distanceTo(p);
    prev = p;
  }
  return d / 1000;
}

const CSS = `
#tsel { position: fixed; inset: 0; z-index: 50; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 18px; padding: 32px;
  background: radial-gradient(ellipse at 50% 30%, #16202b 0%, #0a0c10 70%);
  font: 14px/1.5 'Consolas','Menlo',ui-monospace,monospace; color: #d8e4f0; }
#tsel h1 { font: 700 15px/1 'Consolas',monospace; letter-spacing: 6px; color: #fff; }
#tsel .sub { color: #7f93a8; font-size: 12px; letter-spacing: 1px; margin-top: -10px; }
#tsel .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: 12px; width: min(920px, 100%); max-height: 62vh; overflow-y: auto; padding: 4px; }
#tsel button.card { display: flex; flex-direction: column; gap: 8px; text-align: left;
  background: #151a21; border: 1px solid #2a3340; border-radius: 10px; padding: 12px;
  color: inherit; font: inherit; cursor: pointer; transition: border-color .12s, transform .12s; }
#tsel button.card:hover { border-color: #9fdcff; transform: translateY(-1px); }
#tsel button.card:focus-visible, #tsel button.card.sel { outline: none; border-color: #ffd400; }
#tsel .card b { font-size: 13px; letter-spacing: 1px; color: #fff; }
#tsel .card .meta { color: #7f93a8; font-size: 11px; display: flex; justify-content: space-between; }
#tsel .card .mine { color: #ffd400; }
#tsel svg { width: 100%; height: 96px; display: block; }
#tsel .hint { color: #6b7f94; font-size: 11px; letter-spacing: 1px; }
#tsel .hint b { color: #9fdcff; font-weight: 400; }
`;

/** Show the picker and resolve with the chosen track. */
export function chooseTrack(): Promise<TrackDef> {
  return new Promise((resolve) => {
    const tracks = allTracks();
    const mine = new Set(localTracks().map((t) => t.id));
    const last = lastSavedId();
    // yours first, and within each group the newest-looking first — you are
    // far more likely to want the thing you just made than DUSTBOWL again
    tracks.sort((a, b) => Number(mine.has(b.id)) - Number(mine.has(a.id)));

    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    const root = document.createElement('div');
    root.id = 'tsel';
    root.innerHTML = `<h1>DUSTLINE</h1><p class="sub">choose a track</p>
      <div class="grid"></div>
      <p class="hint">arrows to move &middot; <b>enter</b> to drive &middot;
        made in the <b>editor</b>? it is at the top</p>`;
    const grid = root.querySelector('.grid') as HTMLElement;

    const pick = (def: TrackDef) => {
      root.remove();
      style.remove();
      // The URL now says what you are driving, so a refresh keeps it and the
      // link is shareable — without this, picking a track and reloading throws
      // the choice away.
      const u = new URL(location.href);
      u.searchParams.set('track', def.id);
      history.replaceState(null, '', u);
      resolve(def);
    };

    const cards: HTMLButtonElement[] = tracks.map((def) => {
      const b = document.createElement('button');
      b.className = 'card';
      b.type = 'button';
      const isMine = mine.has(def.id);
      b.innerHTML = `
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <path d="${outline(def)}" fill="none" stroke="#3a4756" stroke-width="7"
                stroke-linejoin="round" />
          <path d="${outline(def)}" fill="none" stroke="${isMine ? '#ffd400' : '#9fdcff'}"
                stroke-width="2.5" stroke-linejoin="round" />
        </svg>
        <b></b>
        <span class="meta"><span>${lapKm(def).toFixed(2)} km</span>
          <span class="${isMine ? 'mine' : ''}">${isMine ? 'yours' : 'built in'}</span></span>`;
      // textContent, not innerHTML: a track name is user input, and it is about
      // to be handed a name someone typed into the editor.
      (b.querySelector('b') as HTMLElement).textContent = def.name;
      b.addEventListener('click', () => pick(def));
      grid.appendChild(b);
      return b;
    });

    let at = Math.max(0, tracks.findIndex((t) => t.id === last));
    const focus = (i: number) => {
      at = (i + cards.length) % cards.length;
      cards.forEach((c, k) => c.classList.toggle('sel', k === at));
      cards[at]?.focus();
      cards[at]?.scrollIntoView({ block: 'nearest' });
    };

    root.addEventListener('keydown', (e) => {
      const cols = Math.max(1, Math.round(grid.clientWidth / 202));
      if (e.key === 'ArrowRight') focus(at + 1);
      else if (e.key === 'ArrowLeft') focus(at - 1);
      else if (e.key === 'ArrowDown') focus(at + cols);
      else if (e.key === 'ArrowUp') focus(at - cols);
      else if (e.key === 'Enter' || e.key === ' ') pick(tracks[at]);
      else return;
      e.preventDefault();
    });

    document.body.appendChild(root);
    focus(at);
  });
}
