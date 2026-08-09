// The editor: wiring.
//
// Two views over one document. The MAP is live and redraws on every pointer
// move; the 3D PREVIEW is the real engine and costs ~66 ms to rebuild, so it is
// debounced and catches up when you stop. That split is the whole performance
// design, and it is why editing feels immediate while still showing you the
// actual world rather than an impression of one.
//
// State is one `TrackDef` plus an undo stack of whole snapshots. Snapshots
// rather than diffs because a track is ~2 KB of JSON: 200 of them is less
// memory than one terrain mesh, and a diff system would be real code with real
// bugs in exchange for nothing.

import type { TrackDef } from '../tracks/trackDef';
import { validateTrack } from '../tracks/trackDef';
import {
  builtInTracks, localTracks, saveLocalTrack, deleteLocalTrack, packTrack, resolveTrackFromUrl,
} from '../tracks/registry';
import { MapView } from './mapView';
import { Preview } from './preview';
import { renderPanel, TabId } from './panel';
import { hitTest, sampleLoop, lapLength, cornerSpeedKmh, starterLoop } from './geometry';

// ---- document + history ---------------------------------------------------

let def: TrackDef = resolveTrackFromUrl();
const past: string[] = [];
const future: string[] = [];
let dirty = false;

const snapshot = () => JSON.stringify(def);

function commit(mutate: (d: TrackDef) => void, _label: string) {
  past.push(snapshot());
  if (past.length > 200) past.shift();
  future.length = 0;
  mutate(def);
  dirty = true;
  changed();
}

function undo() {
  const prev = past.pop();
  if (!prev) return;
  future.push(snapshot());
  def = JSON.parse(prev) as TrackDef;
  changed();
}

function redo() {
  const next = future.pop();
  if (!next) return;
  past.push(snapshot());
  def = JSON.parse(next) as TrackDef;
  changed();
}

// ---- views ----------------------------------------------------------------

const mapCanvas = document.getElementById('map') as HTMLCanvasElement;
const previewCanvas = document.getElementById('preview3d') as HTMLCanvasElement;
const map = new MapView(mapCanvas);
const preview = new Preview(previewCanvas);
const panelEl = document.getElementById('panel')!;

let tab: TabId = 'shape';
const selected = new Set<number>();
let hover = -1;
let hoverSample = -1;

// ---- the debounce that makes this usable ----------------------------------
//
// 220 ms after the last change. Long enough that dragging a corner through
// twenty positions rebuilds once rather than twenty times; short enough that
// letting go feels like it answered you.
let rebuildTimer = 0;
let pendingRebuild = false;

function scheduleRebuild() {
  pendingRebuild = true;
  clearTimeout(rebuildTimer);
  rebuildTimer = window.setTimeout(() => {
    const issues = validateTrack(def);
    // Building a track whose points are outside the world would throw deep
    // inside the terrain loop; refusing here keeps the preview showing the last
    // good world with the error visible instead of a blank canvas.
    if (issues.some((i) => i.level === 'error')) { pendingRebuild = false; updateStatus(); return; }
    preview.rebuild(def);
    pendingRebuild = false;
    updateStatus();
  }, 220);
}

function changed() {
  renderPanel(panelEl, def, tab, commit);
  (document.getElementById('trackName') as HTMLInputElement).value = def.name;
  scheduleRebuild();
  updateStatus();
}

// ---- status bar -----------------------------------------------------------

function updateStatus() {
  const issues = validateTrack(def);
  const samples = sampleLoop(def, 1);
  const len = samples.length ? lapLength(def) : 0;
  let tightest = Infinity, tightIdx = 0;
  samples.forEach((s, i) => {
    const v = cornerSpeedKmh(s.k, 0.72);
    if (v < tightest) { tightest = v; tightIdx = i; }
  });

  document.getElementById('stLen')!.textContent = len ? `${(len / 1000).toFixed(2)} km` : '—';
  document.getElementById('stPts')!.textContent = String(def.road.points.length);
  document.getElementById('stTight')!.textContent = samples.length
    ? `${tightest.toFixed(0)} km/h` : '—';
  document.getElementById('stBuild')!.textContent = pendingRebuild
    ? 'building…' : preview.lastBuildMs ? `${preview.lastBuildMs.toFixed(0)} ms` : '—';

  const box = document.getElementById('issues')!;
  box.innerHTML = '';
  if (!issues.length) {
    const ok = document.createElement('span');
    ok.className = 'iss ok';
    ok.textContent = `✓ no problems${dirty ? ' · unsaved' : ''}`;
    box.appendChild(ok);
  } else {
    for (const i of issues.slice(0, 6)) {
      const s = document.createElement('span');
      s.className = `iss ${i.level}`;
      s.textContent = `${i.level === 'error' ? '✕' : '!'} ${i.message}`;
      box.appendChild(s);
    }
  }
  void tightIdx;
}

// ---- map interaction ------------------------------------------------------

let dragging = -1;
let dragMoved = false;
let panning = false;
let spaceDown = false;
let lastPan: [number, number] = [0, 0];

mapCanvas.addEventListener('pointerdown', (e) => {
  mapCanvas.setPointerCapture(e.pointerId);
  const [wx, wz] = map.toWorld(e.offsetX, e.offsetY);
  if (e.button === 1 || spaceDown || e.button === 2) {
    panning = true;
    lastPan = [e.clientX, e.clientY];
    return;
  }
  const tol = 9 / map.view.scale;
  const hit = hitTest(def.road.points, wx, wz, tol, tol);

  if (e.altKey) {
    // insert INTO the segment under the cursor, never append: appending turns
    // one edit into a spike across the map
    if (hit.kind === 'segment') {
      commit((d) => { d.road.points.splice(hit.index + 1, 0, [Math.round(wx), Math.round(wz)]); }, 'insert point');
      selected.clear();
      selected.add(hit.index + 1);
      dragging = hit.index + 1;
    }
    return;
  }

  if (hit.kind === 'point') {
    if (e.shiftKey) {
      if (selected.has(hit.index)) selected.delete(hit.index);
      else selected.add(hit.index);
    } else if (!selected.has(hit.index)) {
      selected.clear();
      selected.add(hit.index);
    }
    dragging = hit.index;
    dragMoved = false;
    past.push(snapshot());          // one undo entry for the whole drag
    future.length = 0;
  } else if (!e.shiftKey) {
    selected.clear();
  }
  redraw();
});

mapCanvas.addEventListener('pointermove', (e) => {
  if (panning) {
    const dx = e.clientX - lastPan[0], dy = e.clientY - lastPan[1];
    lastPan = [e.clientX, e.clientY];
    map.view.cx -= dx / map.view.scale;
    map.view.cz -= dy / map.view.scale;
    redraw();
    return;
  }
  const [wx, wz] = map.toWorld(e.offsetX, e.offsetY);

  if (dragging >= 0) {
    const p = def.road.points[dragging];
    const dx = wx - p[0], dz = wz - p[1];
    // move the whole selection together, so a multi-select drag shifts a
    // section of track rather than collapsing it onto one point
    for (const i of selected) {
      def.road.points[i][0] = Math.round(def.road.points[i][0] + dx);
      def.road.points[i][1] = Math.round(def.road.points[i][1] + dz);
    }
    if (!selected.size) { p[0] = Math.round(wx); p[1] = Math.round(wz); }
    dragMoved = true;
    dirty = true;
    scheduleRebuild();
    updateStatus();
    redraw();
    return;
  }

  const tol = 9 / map.view.scale;
  const hit = hitTest(def.road.points, wx, wz, tol, -1);
  hover = hit.kind === 'point' ? hit.index : -1;

  // nearest centreline sample, for the readout
  const samples = sampleLoop(def, 1);
  let best = -1, bd = Infinity;
  for (let i = 0; i < samples.length; i++) {
    const d = (samples[i].x - wx) ** 2 + (samples[i].z - wz) ** 2;
    if (d < bd) { bd = d; best = i; }
  }
  hoverSample = Math.sqrt(bd) < 40 ? best : -1;

  const ro = document.getElementById('readout')!;
  if (hoverSample >= 0) {
    const s = samples[hoverSample];
    const r = Math.abs(s.k) > 1e-6 ? 1 / Math.abs(s.k) : Infinity;
    ro.textContent = [
      `x ${wx.toFixed(0)}  z ${wz.toFixed(0)}`,
      `lap ${(s.t * 100).toFixed(1)}%`,
      `radius ${Number.isFinite(r) ? `${r.toFixed(0)} m` : 'straight'}`,
      `≈ ${cornerSpeedKmh(s.k, 0.72).toFixed(0)} km/h`,
      `road y ${s.y.toFixed(1)} m`,
    ].join('\n');
  } else {
    ro.textContent = `x ${wx.toFixed(0)}  z ${wz.toFixed(0)}`;
  }
  redraw();
});

const endDrag = () => {
  if (dragging >= 0 && !dragMoved) past.pop();   // a click that moved nothing is not an edit
  dragging = -1;
  panning = false;
};
mapCanvas.addEventListener('pointerup', endDrag);
mapCanvas.addEventListener('pointercancel', endDrag);
mapCanvas.addEventListener('contextmenu', (e) => e.preventDefault());
mapCanvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  map.zoomAt(e.offsetX, e.offsetY, e.deltaY > 0 ? 0.9 : 1.1);
  redraw();
}, { passive: false });

mapCanvas.addEventListener('dblclick', (e) => {
  const [wx, wz] = map.toWorld(e.offsetX, e.offsetY);
  preview.focus(wx, wz, 90);          // double-click the map to fly the preview there
});

addEventListener('keydown', (e) => {
  const typing = (e.target as HTMLElement)?.tagName?.match(/INPUT|SELECT|TEXTAREA/);
  if (typing) return;
  if (e.code === 'Space') { spaceDown = true; e.preventDefault(); }
  if (e.key === 'f' || e.key === 'F') { map.fit(def); redraw(); }
  if ((e.key === 'z' || e.key === 'Z') && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    if (e.shiftKey) redo(); else undo();
  }
  if ((e.key === 'y' || e.key === 'Y') && (e.ctrlKey || e.metaKey)) { e.preventDefault(); redo(); }
  if (e.key === 'Delete' || e.key === 'Backspace') {
    if (!selected.size) return;
    e.preventDefault();
    if (def.road.points.length - selected.size < 4) {
      alert('A closed loop needs at least 4 control points.');
      return;
    }
    const doomed = [...selected].sort((a, b) => b - a);
    commit((d) => { for (const i of doomed) d.road.points.splice(i, 1); }, 'delete points');
    selected.clear();
  }
});
addEventListener('keyup', (e) => { if (e.code === 'Space') spaceDown = false; });

// ---- draw loop ------------------------------------------------------------

let needsDraw = true;
const redraw = () => { needsDraw = true; };

function frame() {
  if (needsDraw) {
    map.draw(def, {
      showRelief: true, showSurfaces: true, showCurvature: true, showGrid: true,
      selected, hover, hoverSample,
    }, validateTrack(def));
    needsDraw = false;
  }
  preview.render();
  requestAnimationFrame(frame);
}

// ---- toolbar --------------------------------------------------------------

const $ = (id: string) => document.getElementById(id)!;

$('trackName').addEventListener('change', (e) => {
  const v = (e.target as HTMLInputElement).value;
  commit((d) => { d.name = v; }, 'rename');
});

$('btnNew').addEventListener('click', () => {
  if (dirty && !confirm('Discard unsaved changes?')) return;
  const base = builtInTracks()[0];
  const id = `track-${Date.now().toString(36)}`;
  def = {
    ...structuredClone(base),
    id,
    name: 'NEW TRACK',
    seed: (Math.random() * 0xffffffff) >>> 0,
    road: { ...base.road, points: starterLoop(180, 12) },
  };
  past.length = 0; future.length = 0;
  dirty = true;
  map.fit(def);
  preview.frameTrack(def);
  changed();
});

$('btnOpen').addEventListener('click', () => {
  const all = [...localTracks(), ...builtInTracks()];
  const names = all.map((t, i) => `${i + 1}. ${t.name}${localTracks().some((l) => l.id === t.id) ? ' (saved)' : ''}`);
  const pick = prompt(`Open which track?\n\n${names.join('\n')}\n\nNumber, or "d<n>" to delete a saved one:`);
  if (!pick) return;
  if (/^d\d+$/i.test(pick.trim())) {
    const i = parseInt(pick.trim().slice(1), 10) - 1;
    if (all[i] && confirm(`Delete "${all[i].name}"?`)) { deleteLocalTrack(all[i].id); alert('Deleted.'); }
    return;
  }
  const i = parseInt(pick, 10) - 1;
  if (!all[i]) return;
  if (dirty && !confirm('Discard unsaved changes?')) return;
  def = structuredClone(all[i]);
  past.length = 0; future.length = 0;
  dirty = false;
  map.fit(def);
  preview.frameTrack(def);
  changed();
});

$('btnSave').addEventListener('click', () => {
  const errs = validateTrack(def).filter((i) => i.level === 'error');
  if (errs.length && !confirm(`This track has ${errs.length} error(s) and will not load. Save anyway?`)) return;
  saveLocalTrack(def);
  dirty = false;
  updateStatus();
});

$('btnExport').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(def, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${def.id}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
});

$('btnImport').addEventListener('click', () => ($('fileInput') as HTMLInputElement).click());
$('fileInput').addEventListener('change', async (e) => {
  const f = (e.target as HTMLInputElement).files?.[0];
  if (!f) return;
  try {
    const parsed = JSON.parse(await f.text()) as TrackDef;
    const errs = validateTrack(parsed).filter((i) => i.level === 'error');
    if (errs.length) { alert(`That file is not a loadable track:\n\n${errs.map((x) => x.message).join('\n')}`); return; }
    def = parsed;
    past.length = 0; future.length = 0;
    dirty = true;
    map.fit(def);
    preview.frameTrack(def);
    changed();
  } catch (err) {
    alert(`Could not read that file: ${(err as Error).message}`);
  }
  (e.target as HTMLInputElement).value = '';
});

$('btnLink').addEventListener('click', async () => {
  const url = `${location.origin}${location.pathname.replace(/editor\.html$/, 'index.html')}?t=${packTrack(def)}`;
  try {
    await navigator.clipboard.writeText(url);
    alert(`Playable link copied (${url.length} characters).\n\nAnyone who opens it drives this exact track — no server, no upload.`);
  } catch {
    prompt('Copy this link:', url);
  }
});

$('btnDrive').addEventListener('click', () => {
  const errs = validateTrack(def).filter((i) => i.level === 'error');
  if (errs.length) { alert(`Fix these first:\n\n${errs.map((x) => x.message).join('\n')}`); return; }
  window.open(`./index.html?t=${packTrack(def)}`, '_blank');
});

let layout = 0;
$('btnLayout').addEventListener('click', () => {
  layout = (layout + 1) % 3;
  const v = $('views');
  v.className = layout === 1 ? 'map-only' : layout === 2 ? 'd3-only' : '';
  redraw();
});

for (const t of Array.from(document.querySelectorAll('.tab'))) {
  t.addEventListener('click', () => {
    for (const o of Array.from(document.querySelectorAll('.tab'))) o.classList.remove('on');
    t.classList.add('on');
    tab = (t as HTMLElement).dataset.tab as TabId;
    renderPanel(panelEl, def, tab, commit);
  });
}

addEventListener('beforeunload', (e) => {
  if (dirty) { e.preventDefault(); e.returnValue = ''; }
});

// ---- go -------------------------------------------------------------------

preview.rebuild(def);
preview.frameTrack(def);
$('previewNote').textContent = `rebuilt in ${preview.lastBuildMs.toFixed(0)} ms · drag orbit · shift-drag pan · wheel zoom`;
changed();

// Fit AFTER the browser has laid the grid out. Fitting during module
// evaluation measures a canvas that has not been sized yet, which silently
// leaves the map at whatever scale zero-width implies.
requestAnimationFrame(() => { map.fit(def); redraw(); });
frame();

(window as unknown as { __editor: object }).__editor = {
  get def() { return def; },
  set def(d: TrackDef) { def = d; changed(); },
  map, preview, validate: () => validateTrack(def), commit,
};
