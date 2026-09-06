// OPEN A TRACK.
//
// This was a `prompt()` with a numbered list in it. You could technically edit
// an existing track — you typed "3" — but nothing about that says "your tracks
// live here and you can go back to them", which is why it did not read as a
// feature that existed.
//
// It is the same card grid the game's picker uses, and deliberately so: the
// two lists are the same list, and seeing your track in the editor exactly as
// it appears in the game is the fastest way to believe that saving put it
// there. The road outline is drawn from the track's own control points through
// the engine's own spline, so the shape on the card is the shape you edit.

import * as THREE from 'three';
import type { TrackDef } from '../tracks/trackDef';
import { builtInTracks, localTracks, deleteLocalTrack } from '../tracks/registry';

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
  const span = Math.max(maxX - minX, maxZ - minZ) || 1;
  const cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2;
  const to = ([x, z]: [number, number]) =>
    `${(50 + ((x - cx) / span) * 86).toFixed(1)},${(50 + ((z - cz) / span) * 86).toFixed(1)}`;
  return `M${pts.map(to).join('L')}Z`;
}

const CSS = `
#odlg { position: fixed; inset: 0; z-index: 60; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 14px; padding: 28px;
  background: rgba(8,10,14,0.86); backdrop-filter: blur(3px);
  font: 13px/1.5 'Consolas','Menlo',ui-monospace,monospace; color: #d8e4f0; }
#odlg h2 { font: 700 12px/1 'Consolas',monospace; letter-spacing: 4px; color: #fff; }
#odlg .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 10px; width: min(900px, 100%); max-height: 66vh; overflow-y: auto; padding: 4px; }
#odlg .card { position: relative; display: flex; flex-direction: column; gap: 6px;
  background: #151a21; border: 1px solid #2a3340; border-radius: 9px; padding: 10px; }
#odlg .card:hover { border-color: #9fdcff; }
#odlg .card .open { all: unset; cursor: pointer; display: flex; flex-direction: column; gap: 6px; }
#odlg .card b { font-size: 12px; letter-spacing: 1px; color: #fff; }
#odlg .card .meta { color: #7f93a8; font-size: 11px; display: flex; justify-content: space-between; }
#odlg .card .mine { color: #ffd400; }
#odlg svg { width: 100%; height: 84px; display: block; }
#odlg .del { position: absolute; top: 6px; right: 6px; background: #1b212a;
  border: 1px solid #2a3340; color: #8fa3b8; border-radius: 5px; cursor: pointer;
  font: 11px 'Consolas',monospace; padding: 1px 6px; }
#odlg .del:hover { border-color: #ff6b5e; color: #ffb3ab; }
#odlg .close { background: #1b212a; border: 1px solid #2a3340; color: #d8e4f0;
  border-radius: 6px; padding: 6px 16px; cursor: pointer; font: inherit; }
#odlg .close:hover { border-color: #9fdcff; }
#odlg .hint { color: #6b7f94; font-size: 11px; }
`;

/** Show the dialog. Resolves with the chosen track, or null if dismissed.
 *  `canDiscard` is asked before opening anything, so the caller keeps ownership
 *  of what "unsaved" means. */
export function openTrackDialog(canDiscard: () => boolean): Promise<TrackDef | null> {
  return new Promise((resolve) => {
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);
    const root = document.createElement('div');
    root.id = 'odlg';
    document.body.appendChild(root);

    const done = (t: TrackDef | null) => { root.remove(); style.remove(); resolve(t); };

    const render = () => {
      const local = localTracks();
      const mine = new Set(local.map((t) => t.id));
      // A saved track SHADOWS a built-in of the same id, so it must not be
      // listed twice — the shadowed one is not openable and showing it would
      // offer a copy you cannot get back to.
      const list = [...local, ...builtInTracks().filter((t) => !mine.has(t.id))];
      root.innerHTML = `<h2>OPEN A TRACK</h2><div class="grid"></div>
        <button class="close">Cancel</button>
        <p class="hint">Saved tracks are yours and appear in the game.
          Opening a built-in one and saving it makes your own copy under the same name.</p>`;
      const grid = root.querySelector('.grid') as HTMLElement;

      for (const def of list) {
        const isMine = mine.has(def.id);
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
          <button class="open" type="button">
            <svg viewBox="0 0 100 100" aria-hidden="true">
              <path d="${outline(def)}" fill="none" stroke="#39434f" stroke-width="7" stroke-linejoin="round" />
              <path d="${outline(def)}" fill="none" stroke="${isMine ? '#ffd400' : '#9fdcff'}"
                    stroke-width="2.5" stroke-linejoin="round" />
            </svg>
            <b></b>
            <span class="meta"><span>${(def.props?.length ?? 0)} placed</span>
              <span class="${isMine ? 'mine' : ''}">${isMine ? 'yours' : 'built in'}</span></span>
          </button>`;
        // textContent: the name came out of a text box someone typed into.
        (card.querySelector('b') as HTMLElement).textContent = def.name;
        (card.querySelector('.open') as HTMLElement)
          .addEventListener('click', () => { if (canDiscard()) done(structuredClone(def)); });
        if (isMine) {
          const del = document.createElement('button');
          del.className = 'del';
          del.type = 'button';
          del.textContent = '✕';
          del.title = 'Delete this saved track';
          del.addEventListener('click', () => {
            if (!confirm(`Delete "${def.name}"? This cannot be undone.`)) return;
            deleteLocalTrack(def.id);
            render();                       // the list is the source of truth
          });
          card.appendChild(del);
        }
        grid.appendChild(card);
      }
      (root.querySelector('.close') as HTMLElement).addEventListener('click', () => done(null));
    };

    root.addEventListener('keydown', (e) => { if (e.key === 'Escape') done(null); });
    render();
    (root.querySelector('.close') as HTMLElement).focus();
  });
}
