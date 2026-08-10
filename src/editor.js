/* IGNITE RALLY — WORLD EDITOR
 *
 * The owner's build tool. It runs inside the game, on the real renderer, with
 * the real Track: what you sculpt is what the car drives on, because the
 * editor never draws its own world. It records EDITS and hands them to the
 * Track builder, which rebuilds the world from scratch with those edits in
 * place. Nothing here is a preview of a guess.
 *
 * WHY EDITS AND NOT A MESH. Every builder in track.js derives from
 * `terrainHeight(x, z)` — where trees seat, where houses stand, how the road
 * drapes, where the water meets the land, what the physics thinks the ground
 * is. An editor that pushed vertices around a mesh would move the picture and
 * leave all of that behind: houses hovering over the hill you just raised,
 * the car driving through the old ground. So a sculpt is a list of DABS which
 * `terrainHeight` itself answers with, and Apply rebuilds the world through
 * the same path a level load takes. Slower than pushing vertices; correct by
 * construction.
 *
 * The live brush preview DOES push vertices — but only on the drawn terrain
 * meshes, only until Apply, and it is explicitly labelled PREVIEW in the UI.
 *
 * Contract with track.js:
 *   new Track(scene, level, { delta, elements })
 *   - delta:    TerrainDelta (or null) sampled inside terrainHeight
 *   - elements: [{ preset, x, z, rot, scale }] stamped before the batch is
 *               realised, so placed buildings cost no extra draw calls
 * Contract with main.js:
 *   game.editor = new WorldEditor(game)  — mounts its own DOM + input
 *   game.rebuildWorld()                  — teardown + rebuild, same level
 */

import * as THREE from 'three';
import { LEVELS } from './track.js';

/* ---------------------------------------------------------------------------
 * TerrainDelta — the sculpt, as a function of (x, z)
 *
 * Queried from inside terrainHeight, which runs tens of thousands of times per
 * build (a 201x201 terrain plane alone is 40k samples, and every scattered
 * object asks again). A linear scan over the dab list would make a heavy scene
 * cost minutes, so dabs are bucketed into a coarse grid and a query only tests
 * the dabs whose radius can reach its own cell.
 * ------------------------------------------------------------------------- */
export class TerrainDelta {
  constructor(dabs = []) {
    this.dabs = [];
    this.cell = 64;
    this.grid = new Map();
    for (const d of dabs) this.add(d, false);
  }

  _key(cx, cz) { return cx + ',' + cz; }

  add(dab, dedupe = true) {
    // A stroke lays many dabs on nearly the same spot; collapsing them keeps
    // the list (and the saved scene) from growing without bound.
    if (dedupe) {
      for (const e of this.dabs) {
        if (e.mode === dab.mode && Math.abs(e.r - dab.r) < 0.5
          && Math.hypot(e.x - dab.x, e.z - dab.z) < dab.r * 0.16) {
          e.dh += dab.dh;
          return e;
        }
      }
    }
    this.dabs.push(dab);
    const c = this.cell;
    const x0 = Math.floor((dab.x - dab.r) / c), x1 = Math.floor((dab.x + dab.r) / c);
    const z0 = Math.floor((dab.z - dab.r) / c), z1 = Math.floor((dab.z + dab.r) / c);
    for (let cx = x0; cx <= x1; cx++) {
      for (let cz = z0; cz <= z1; cz++) {
        const k = this._key(cx, cz);
        if (!this.grid.has(k)) this.grid.set(k, []);
        this.grid.get(k).push(dab);
      }
    }
    return dab;
  }

  rebuild() {
    const d = this.dabs;
    this.dabs = [];
    this.grid = new Map();
    for (const x of d) this.add(x, false);
  }

  /** Height change at (x, z). Smooth falloff so a stroke reads as ground, not
   *  as a stack of discs: cos² over the radius, which meets zero with zero
   *  gradient and therefore leaves no crease at the brush edge. */
  at(x, z) {
    const list = this.grid.get(this._key(Math.floor(x / this.cell), Math.floor(z / this.cell)));
    if (!list) return 0;
    let sum = 0;
    for (let i = 0; i < list.length; i++) {
      const d = list[i];
      const dx = x - d.x, dz = z - d.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist >= d.r) continue;
      const t = Math.cos((dist / d.r) * Math.PI * 0.5);
      sum += d.dh * t * t;
    }
    return sum;
  }

  get length() { return this.dabs.length; }
  toJSON() {
    return this.dabs.map((d) => ({
      x: +d.x.toFixed(1), z: +d.z.toFixed(1),
      r: +d.r.toFixed(1), dh: +d.dh.toFixed(2), mode: d.mode,
    }));
  }
}

/* ---------------------------------------------------------------------------
 * The palette. Every entry names a preset the Track builder already knows how
 * to stamp, so the editor adds no new art and no new draw calls: placed
 * buildings join the same five instanced batches every world building uses.
 * `kind` decides which builder path stamps it at rebuild time.
 * ------------------------------------------------------------------------- */
export const PALETTE = [
  { group: 'HOUSES', items: [
    ['house', 'HOUSE'], ['cube', 'CUBE HOUSE'], ['towerhouse', 'TOWER HOUSE'],
    ['domed', 'DOMED'], ['courtyard', 'COURTYARD'], ['adobe', 'ADOBE'],
    ['stilt', 'STILT HOUSE'],
  ] },
  { group: 'COTTAGES', items: [
    ['cottageA', 'COTTAGE A'], ['cottageB', 'COTTAGE B'], ['cottageC', 'COTTAGE C'],
    ['cottageD', 'COTTAGE D'], ['cottageE', 'COTTAGE E'], ['cottageF', 'COTTAGE F'],
    ['cottageG', 'COTTAGE G'], ['cottageH', 'COTTAGE H'],
  ] },
  { group: 'WORKING', items: [
    ['barn', 'BARN'], ['shed', 'SHED'], ['silo', 'SILO'],
    ['windmill', 'WINDMILL'], ['well', 'WELL'], ['logpile', 'LOG PILE'],
  ] },
  { group: 'LANDMARKS', items: [
    ['chapel', 'CHAPEL'], ['watchtower', 'WATCHTOWER'], ['puebloRuin', 'RUIN'],
    ['kiosk', 'KIOSK'], ['signalhut', 'SIGNAL HUT'],
  ] },
];

/* WEATHER DECKS. Each is a patch over the theme, in the theme's own language,
 * so a deck costs no new systems: `weather` drives the ambient particle
 * recipe, `surface` tells the physics the road is wet or snowed, and the fog
 * pair closes the world down in a squall. CLEAR is the absence of all three,
 * which is why it has to null them explicitly - a theme that ships rain would
 * otherwise keep raining. */
export const WEATHER_DECKS = {
  clear: { weather: null, surface: undefined },
  rain: { weather: { type: 'rain', color: 0x9fb4c8, rate: 220 }, surface: 'wet',
    fogNear: 150, fogFar: 900 },
  snow: { weather: { type: 'snow', color: 0xffffff, rate: 90 }, surface: 'snow',
    fogNear: 120, fogFar: 700 },
  fog: { weather: null, surface: undefined, fogNear: 40, fogFar: 380 },
};
export const WEATHER_ORDER = ['clear', 'rain', 'snow', 'fog'];

/* The palettes a scene may borrow. Every one is a shipped theme, so borrowing
 * costs nothing and cannot fail: this is the "reuse the old to make new" of
 * the world recipe - one world's route wearing another world's country. */
export const THEME_MENU = [
  ['', 'AS BUILT'], ['forest', 'PINE FOREST'], ['alpine', 'ALPINE'],
  ['pass', 'HIGH PASS'], ['desert', 'DESERT'], ['canyon', 'CANYON'],
  ['snow', 'SNOWFIELD'], ['jungle', 'JUNGLE'], ['outback', 'OUTBACK'],
  ['medterrace', 'MEDITERRANEAN'], ['harbor', 'HARBOUR'], ['citadel', 'CITADEL'],
  ['oldtown', 'OLD TOWN'], ['vineyard', 'VINEYARD'], ['farmland', 'FARMLAND'],
  ['neon', 'NEON CITY'], ['dunes', 'DUNES'], ['glacial', 'GLACIAL'],
];

/* ---------------------------------------------------------------------------
 * WorldEditor
 * ------------------------------------------------------------------------- */
export class WorldEditor {
  constructor(game) {
    this.game = game;
    this.active = false;

    this.tool = 'raise';
    this.radius = 40;
    this.strength = 3;

    this.delta = new TerrainDelta();
    this.elements = [];
    // circles the world must leave empty. This is how generated scenery -
    // trees, rocks, villages, the lot - gets DELETED: you cannot move what
    // the builder invents each time, but you can tell it to keep out.
    this.erase = [];
    // per-scene overrides: another world's palette on this route, and a
    // weather deck. Both are read by the Track constructor as `edit.theme`
    // and `edit.tune`, so a recombined world needs no new art.
    this.themeName = null;
    this.weather = null;
    // sited features, not counts: lap fractions for the bores, one for a span
    this.roadFeat = { tunnels: [], bridge: null };
    this.waters = [];
    this.sceneName = '';
    this.dirty = false;

    // orbit camera
    this.target = new THREE.Vector3();
    this.dist = 220;
    this.yaw = 0.6;
    this.pitch = 0.85;

    this._ray = new THREE.Raycaster();
    this._ndc = new THREE.Vector2();
    this._ptr = new Map();          // active pointers, for pinch/two-finger pan
    this._pinch = 0;
    this._painting = false;
    this._hit = new THREE.Vector3();
    this._hasHit = false;
    this._previewed = new Set();     // meshes whose vertices we pushed

    this._buildDOM();
  }

  /* --- storage ----------------------------------------------------------- */
  static list() {
    try { return JSON.parse(localStorage.getItem('ir-scenes') || '{}'); }
    catch { return {}; }
  }
  static save(name, data) {
    const all = WorldEditor.list();
    all[name] = data;
    localStorage.setItem('ir-scenes', JSON.stringify(all));
  }
  static remove(name) {
    const all = WorldEditor.list();
    delete all[name];
    localStorage.setItem('ir-scenes', JSON.stringify(all));
  }

  serialize() {
    return {
      v: 1,
      base: this.game.level ? this.game.level.id : 1,
      name: this.sceneName,
      dabs: this.delta.toJSON(),
      erase: this.erase.map((z) => ({ x: +z.x.toFixed(1), z: +z.z.toFixed(1), r: +z.r.toFixed(1) })),
      theme: this.themeName || undefined,
      weather: this.weather || undefined,
      road: (this.roadFeat.tunnels.length || this.roadFeat.bridge != null)
        ? { tunnels: this.roadFeat.tunnels.map((f) => +f.toFixed(4)),
          bridge: this.roadFeat.bridge } : undefined,
      waters: this.waters.length ? this.waters.map((w) => ({
        x: +w.x.toFixed(1), z: +w.z.toFixed(1), r: +w.r.toFixed(1), y: +w.y.toFixed(2),
      })) : undefined,
      elements: this.elements.map((e) => ({
        preset: e.preset, x: +e.x.toFixed(1), z: +e.z.toFixed(1),
        rot: +e.rot.toFixed(3), scale: +e.scale.toFixed(2),
      })),
    };
  }

  /** Everything the Track constructor needs, in its own vocabulary. */
  buildPayload() {
    const tune = {};
    if (this.weather) Object.assign(tune, WEATHER_DECKS[this.weather] || {});
    // `at` is what turns a count into a place — see _planTunnels / _planGorge
    if (this.roadFeat.tunnels.length) {
      tune.tunnels = { count: this.roadFeat.tunnels.length, at: [...this.roadFeat.tunnels] };
    }
    if (this.roadFeat.bridge != null) {
      const f = this.roadFeat.bridge;
      tune.heroBridge = { at: [Math.max(0, f - 0.03), Math.min(1, f + 0.03)],
        half: 24, len: 210, depth: 28, skew: 0 };
    }
    return {
      delta: this.delta,
      elements: this.elements,
      erase: this.erase,
      waters: this.waters,
      theme: this.themeName || undefined,
      tune: Object.keys(tune).length ? tune : undefined,
    };
  }

  load(data) {
    this.delta = new TerrainDelta(data.dabs || []);
    this.elements = (data.elements || []).map((e) => ({ ...e }));
    this.erase = (data.erase || []).map((z) => ({ ...z }));
    this.themeName = data.theme || null;
    this.weather = data.weather || null;
    // v1 scenes stored COUNTS ("two tunnels, somewhere"); there is no place to
    // recover from a number, so an old scene keeps its features by count and
    // gains sited ones only when you tap for them.
    const rd = data.road || {};
    this.roadFeat = {
      tunnels: Array.isArray(rd.tunnels) ? [...rd.tunnels] : [],
      bridge: typeof rd.bridge === 'number' ? rd.bridge : null,
    };
    this.waters = (data.waters || []).map((w) => ({ ...w }));
    this.sceneName = data.name || '';
    this.dirty = false;
  }

  /* --- lifecycle --------------------------------------------------------- */
  enter() {
    if (this.active) return;
    const g = this.game;
    this.active = true;
    this._prevState = g.state;
    g.state = 'editor';

    // hide the racing UI; the editor owns the screen
    document.getElementById('hud')?.style.setProperty('display', 'none');
    // 'hidden', NOT 'off'. A .screen is hidden with .hidden - .off is the
    // class the menu PANELS use - so the editor opened on top of a fully
    // visible track list and the tools floated over the world cards.
    document.getElementById('title-screen')?.classList.add('hidden');
    document.getElementById('results')?.classList.add('hidden');
    for (const id of ['race-info', 'score-box', 'health-box', 'weapon-box',
      'speed-box', 'joy-zone', 'touch-ui', 'feed']) {
      const el = document.getElementById(id);
      if (el) { el.dataset.edHid = el.style.display || ''; el.style.display = 'none'; }
    }
    this.root.classList.remove('off');

    // park the camera above the start line, looking down the road
    const c = g.track.center[0];
    this.target.set(c.x, c.y, c.z);
    this._syncCam();
    this._bindPointer();
    this._renderPalette();
    this._status('EDITOR — sculpt, place, then APPLY');
  }

  exit() {
    if (!this.active) return;
    this.active = false;
    this._unbindPointer();
    this._clearPreview();
    this.root.classList.add('off');
    document.getElementById('hud')?.style.removeProperty('display');
    for (const id of ['race-info', 'score-box', 'health-box', 'weapon-box',
      'speed-box', 'joy-zone', 'touch-ui', 'feed']) {
      const el = document.getElementById(id);
      if (el && el.dataset.edHid !== undefined) {
        el.style.display = el.dataset.edHid;
        delete el.dataset.edHid;
      }
    }
    // showMenu() is the one path that puts the title screen back up IN PLACE
    // (it owns the tab state and the level cards); setting state alone left a
    // live renderer with no UI on it.
    document.getElementById('title-screen')?.classList.remove('hidden');
    this.game.state = 'title';
    this.game.showMenu?.();
  }

  /* --- per-frame --------------------------------------------------------- */
  update() {
    if (!this.active) return;
    this._syncCam();
    if (this.ring) this.ring.visible = this._hasHit && this._isSculpt();
    this.game.renderer.render(this.game.scene, this.game.camera);
  }

  _isSculpt() { return ['raise', 'lower', 'smooth', 'flatten'].includes(this.tool); }

  _syncCam() {
    const cam = this.game.camera;
    const cp = Math.max(0.12, Math.min(1.52, this.pitch));
    cam.position.set(
      this.target.x + Math.sin(this.yaw) * Math.cos(cp) * this.dist,
      this.target.y + Math.sin(cp) * this.dist,
      this.target.z + Math.cos(this.yaw) * Math.cos(cp) * this.dist,
    );
    cam.lookAt(this.target);
    cam.updateMatrixWorld();
  }

  /* --- picking ----------------------------------------------------------- */
  /** Terrain meshes are the big ground planes the Track builds; pick against
   *  whatever the ray hits and take the ground-most hit. Falls back to the
   *  mathematical ground (march the ray against terrainHeight) when the ray
   *  misses every mesh — off the edge of the drawn plane, or through a gap. */
  _pick(cx, cy) {
    const g = this.game;
    const r = g.renderer.domElement.getBoundingClientRect();
    this._ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    this._ray.setFromCamera(this._ndc, g.camera);
    const targets = this._terrainMeshes();
    const hits = this._ray.intersectObjects(targets, false);
    if (hits.length) { this._hit.copy(hits[0].point); this._hasHit = true; return this._hit; }
    // march
    const o = this._ray.ray.origin, d = this._ray.ray.direction;
    let t = 0;
    for (let i = 0; i < 260; i++) {
      const p = o.clone().addScaledVector(d, t);
      if (p.y <= g.track.terrainHeight(p.x, p.z)) {
        this._hit.copy(p); this._hasHit = true; return this._hit;
      }
      t += 6;
      if (t > 3000) break;
    }
    this._hasHit = false;
    return null;
  }

  _terrainMeshes() {
    if (this._tmCache && this._tmTrack === this.game.track) return this._tmCache;
    const out = [];
    this.game.track.group.traverse((o) => {
      if (!o.isMesh || o.isInstancedMesh) return;
      const gp = o.geometry && o.geometry.parameters;
      // the ground planes: big, heavily subdivided, and lying flat
      if (gp && gp.width >= 1200 && gp.widthSegments >= 40) out.push(o);
    });
    this._tmCache = out;
    this._tmTrack = this.game.track;
    return out;
  }

  /* --- sculpting --------------------------------------------------------- */
  _dab(p) {
    let dh = this.strength;
    if (this.tool === 'lower') dh = -this.strength;
    if (this.tool === 'smooth' || this.tool === 'flatten') {
      // pull the middle toward the ring height: for FLATTEN the ring is the
      // ground under the brush centre, for SMOOTH it is the average around it
      const t = this.game.track;
      const cur = t.terrainHeight(p.x, p.z) + this.delta.at(p.x, p.z);
      let ref = cur;
      if (this.tool === 'smooth') {
        let s = 0, n = 0;
        for (let a = 0; a < 8; a++) {
          const an = (a / 8) * Math.PI * 2;
          const sx = p.x + Math.cos(an) * this.radius, sz = p.z + Math.sin(an) * this.radius;
          s += t.terrainHeight(sx, sz) + this.delta.at(sx, sz); n++;
        }
        ref = s / n;
      } else {
        ref = this._flatY ?? cur;
      }
      dh = (ref - cur) * 0.35;
    }
    if (!dh) return;
    this.delta.add({ x: p.x, z: p.z, r: this.radius, dh, mode: this.tool });
    this.dirty = true;
    this._previewDab(p, dh);
  }

  /** Live vertex preview. The drawn ground planes are pushed so the stroke is
   *  visible immediately; the REAL world (physics, scatter, water) only
   *  changes at Apply, which is why the toolbar says PREVIEW until then. */
  _previewDab(p, dh) {
    // THE GROUND PLANES ARE ALREADY ROTATED FLAT at build time
    // (`geo.rotateX(-PI/2)` in _buildTerrain), so a vertex reads x -> world x,
    // y -> HEIGHT, z -> world z. Written against the unrotated PlaneGeometry
    // convention (height in z) the brush pushed the ground sideways: measured,
    // and the reason this comment exists.
    const r2 = this.radius * this.radius;
    for (const m of this._terrainMeshes()) {
      const pos = m.geometry.attributes.position;
      if (!pos) continue;
      let touched = false;
      for (let i = 0; i < pos.count; i++) {
        const dx = pos.getX(i) - p.x, dz = pos.getZ(i) - p.z;
        const d2 = dx * dx + dz * dz;
        if (d2 >= r2) continue;
        const t = Math.cos((Math.sqrt(d2) / this.radius) * Math.PI * 0.5);
        pos.setY(i, pos.getY(i) + dh * t * t);
        touched = true;
      }
      if (touched) {
        pos.needsUpdate = true;
        m.geometry.computeVertexNormals();
        m.geometry.computeBoundingSphere();   // or picking misses the new hill
        this._previewed.add(m);
      }
    }
  }

  _clearPreview() { this._previewed.clear(); }

  /* --- element placing ---------------------------------------------------- */
  _place(p) {
    if (!this.preset) { this._status('pick a preset first'); return; }
    const e = { preset: this.preset, x: p.x, z: p.z,
      rot: this._placeRot ?? 0, scale: this._placeScale ?? 1 };
    this.elements.push(e);
    this.dirty = true;
    this._ghost(e);
    this._status(`placed ${this.preset} (${this.elements.length} total) — APPLY to build`);
  }

  /** A placed building only becomes real at Apply (it has to join the batched
   *  instanced meshes). Until then it is a marker, so the layout can be seen.
   *
   *  AFTER Apply the marker must get out of the way. It used to stay a big
   *  yellow wireframe box around the finished house, which made every
   *  building the editor placed look like a placeholder crate — reported as
   *  exactly that. A built object keeps only a flat footprint ring on the
   *  ground: enough to see what you put there and to aim ERASE at, and low
   *  enough that the actual house is what you look at. */
  _ghost(e) {
    if (!this._ghosts) {
      this._ghosts = new THREE.Group();
      this._ghosts.name = 'editor-ghosts';
      this.game.scene.add(this._ghosts);
    }
    const y = this.game.track.terrainHeight(e.x, e.z) + this.delta.at(e.x, e.z);
    let m;
    if (e.built) {
      const r = 3.4 * e.scale;
      m = new THREE.Mesh(new THREE.RingGeometry(r, r + 0.5, 20),
        new THREE.MeshBasicMaterial({ color: 0xffc14a, transparent: true,
          opacity: 0.55, depthWrite: false, side: THREE.DoubleSide }));
      m.rotation.x = -Math.PI / 2;
      m.position.set(e.x, y + 0.25, e.z);
    } else {
      m = new THREE.Mesh(
        new THREE.BoxGeometry(6 * e.scale, 7 * e.scale, 6 * e.scale),
        new THREE.MeshBasicMaterial({ color: 0xffc14a, wireframe: true }));
      m.position.set(e.x, y + 3.5 * e.scale, e.z);
      m.rotation.y = e.rot;
    }
    m.userData.el = e;
    this._ghosts.add(m);
  }

  _clearGhosts() {
    if (!this._ghosts) return;
    for (const c of [...this._ghosts.children]) {
      c.geometry.dispose(); c.material.dispose(); this._ghosts.remove(c);
    }
  }

  _undo() {
    if (this.tool === 'place' || this.preset) {
      if (this.elements.length) {
        this.elements.pop();
        const last = this._ghosts && this._ghosts.children[this._ghosts.children.length - 1];
        if (last) { last.geometry.dispose(); last.material.dispose(); this._ghosts.remove(last); }
        this._status(`undo — ${this.elements.length} placed`);
        return;
      }
    }
    if (this.tool === 'clear' && this.erase.length) {
      this.erase.pop();
      this._clearZoneMarks();
      for (const z of this.erase) this._zoneMark(z);
      this._status(`undo — ${this.erase.length} clear zones`);
      return;
    }
    if (this.delta.dabs.length) {
      this.delta.dabs.pop();
      this.delta.rebuild();
      this._status(`undo — ${this.delta.length} dabs (APPLY to see it)`);
    }
  }

  /* --- apply -------------------------------------------------------------- */
  apply() {
    this._status('rebuilding…');
    this._clearPreview();
    // let the status paint before the (synchronous, second-long) rebuild
    setTimeout(() => {
      this.game.editScene = this.buildPayload();
      this.game.rebuildWorld();
      this._tmCache = null;
      this.dirty = false;
      this._clearGhosts();
      // everything on the list is now a real building in the rebuilt world,
      // so its marker drops to a footprint ring instead of a crate over it
      for (const e of this.elements) { e.built = true; this._ghost(e); }
      this._clearZoneMarks();
      for (const z of this.erase) this._zoneMark(z);
      this._status(`APPLIED — ${this.delta.length} dabs, ${this.elements.length} objects, `
        + `${this.erase.length} cleared`);
    }, 30);
  }

  testDrive() {
    if (this.dirty) this.apply();
    this.exit();
    this.game.startRace?.();
  }

  /* --- input -------------------------------------------------------------- */
  _bindPointer() {
    const el = this.game.renderer.domElement;
    this._onDown = (e) => {
      el.setPointerCapture?.(e.pointerId);
      this._ptr.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY });
      if (this._ptr.size === 1) {
        // left/touch = act with the tool; right/middle = orbit
        this._orbiting = (e.button === 2 || e.button === 1) || this.tool === 'orbit';
        if (!this._orbiting) {
          const p = this._pick(e.clientX, e.clientY);
          if (p) {
            if (this._isSculpt()) {
              this._flatY = this.game.track.terrainHeight(p.x, p.z) + this.delta.at(p.x, p.z);
              this._painting = true;
              this._dab(p);
            } else if (this.tool === 'place') {
              this._place(p);
            } else if (this.tool === 'erase') {
              this._eraseAt(p);
            } else if (this.tool === 'clear') {
              this._eraseWorldAt(p);
            } else if (this.tool === 'road') {
              this._roadAt(p);
            } else if (this.tool === 'water') {
              this._waterAt(p);
            }
          }
        }
      } else {
        this._painting = false;
        this._pinch = this._pinchDist();
      }
      e.preventDefault();
    };
    this._onMove = (e) => {
      const rec = this._ptr.get(e.pointerId);
      const p = this._pick(e.clientX, e.clientY);
      if (p && this.ring) {
        this.ring.position.set(p.x, p.y + 0.4, p.z);
        this.ring.scale.setScalar(this.radius / 40);
      }
      if (!rec) return;
      const dx = e.clientX - rec.x, dy = e.clientY - rec.y;
      rec.x = e.clientX; rec.y = e.clientY;
      if (this._ptr.size >= 2) {
        // pinch = zoom, drag = pan
        const d = this._pinchDist();
        if (this._pinch) this.dist = Math.max(30, Math.min(1400, this.dist * (this._pinch / d)));
        this._pinch = d;
        this._pan(dx * 0.5, dy * 0.5);
      } else if (this._orbiting) {
        this.yaw -= dx * 0.006;
        this.pitch = Math.max(0.12, Math.min(1.52, this.pitch + dy * 0.005));
      } else if (this._painting && p) {
        this._dab(p);
      }
      e.preventDefault();
    };
    this._onUp = (e) => {
      this._ptr.delete(e.pointerId);
      if (this._ptr.size === 0) { this._painting = false; this._orbiting = false; }
      this._pinch = 0;
    };
    this._onWheel = (e) => {
      this.dist = Math.max(30, Math.min(1400, this.dist * (1 + Math.sign(e.deltaY) * 0.12)));
      e.preventDefault();
    };
    this._onCtx = (e) => e.preventDefault();
    el.addEventListener('pointerdown', this._onDown);
    el.addEventListener('pointermove', this._onMove);
    el.addEventListener('pointerup', this._onUp);
    el.addEventListener('pointercancel', this._onUp);
    el.addEventListener('wheel', this._onWheel, { passive: false });
    el.addEventListener('contextmenu', this._onCtx);

    if (!this.ring) {
      const g = new THREE.RingGeometry(38, 41, 48);
      g.rotateX(-Math.PI / 2);
      this.ring = new THREE.Mesh(g, new THREE.MeshBasicMaterial({
        color: 0x6fe3ff, transparent: true, opacity: 0.8, depthTest: false }));
      this.ring.renderOrder = 999;
      this.game.scene.add(this.ring);
    }
    this.ring.visible = true;
  }

  _unbindPointer() {
    const el = this.game.renderer.domElement;
    el.removeEventListener('pointerdown', this._onDown);
    el.removeEventListener('pointermove', this._onMove);
    el.removeEventListener('pointerup', this._onUp);
    el.removeEventListener('pointercancel', this._onUp);
    el.removeEventListener('wheel', this._onWheel);
    el.removeEventListener('contextmenu', this._onCtx);
    this._ptr.clear();
    if (this.ring) this.ring.visible = false;
  }

  _pinchDist() {
    const a = [...this._ptr.values()];
    if (a.length < 2) return 0;
    return Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y) || 1;
  }

  _pan(dx, dy) {
    const s = this.dist * 0.0022;
    const cy = Math.cos(this.yaw), sy = Math.sin(this.yaw);
    this.target.x -= (cy * dx - sy * dy) * s;
    this.target.z += (sy * dx + cy * dy) * s;
  }

  /** DELETE WHAT THE WORLD BUILT. Generated scenery has no stored identity -
   *  the village, the wood and the boulder field are invented afresh on every
   *  build - so the only honest way to remove it is to record a keep-out
   *  circle and have the builders skip it. Takes effect at APPLY, like every
   *  other edit, and the marker shows what will go. */
  _eraseWorldAt(p) {
    this.erase.push({ x: p.x, z: p.z, r: this.radius });
    this.dirty = true;
    this._zoneMark(this.erase[this.erase.length - 1]);
    this._status(`clear zone ${this.erase.length} (r ${Math.round(this.radius)}) — APPLY to strip it`);
  }

  _zoneMark(z) {
    if (!this._zones) {
      this._zones = new THREE.Group();
      this._zones.name = 'editor-zones';
      this.game.scene.add(this._zones);
    }
    const g = new THREE.RingGeometry(z.r * 0.94, z.r, 40);
    g.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({
      color: 0xff5a4a, transparent: true, opacity: 0.75, depthTest: false }));
    m.position.set(z.x, this.game.track.terrainHeight(z.x, z.z) + 0.5, z.z);
    m.renderOrder = 998;
    this._zones.add(m);
  }

  _clearZoneMarks() {
    if (!this._zones) return;
    for (const c of [...this._zones.children]) {
      c.geometry.dispose(); c.material.dispose(); this._zones.remove(c);
    }
  }

  /** WATER, IN ONE GESTURE.
   *
   *  A lake is a hole with water in it, and asking the player to dig the hole
   *  first and then find a separate fill tool is asking them to do the
   *  engine's job — "I can't add water" is what that gets you. So the tool
   *  does both: it sinks a bowl under the brush and records a surface at the
   *  level of the ground you tapped, which is what makes the shoreline meet
   *  the land instead of a blue disc lying on a field.
   *
   *  The bowl goes through the ordinary terrain delta, so BOTH height fields
   *  see it, the road clamps after it, and the scatter keeps out of it — the
   *  same guarantees every other sculpt gets. */
  _waterAt(p) {
    if (!p) return;
    const t = this.game.track;
    const r = this.radius;
    const surf = t.terrainHeight(p.x, p.z) + this.delta.at(p.x, p.z);
    // dig first: a bowl about a fifth as deep as it is wide, floored so a
    // huge brush does not punch a well through the world
    const depth = Math.min(9, Math.max(3, r * 0.22));
    this.delta.add({ x: p.x, z: p.z, r, dh: -depth, mode: 'water' });
    // ...then stand the water just under the original rim, so the bank shows
    const y = surf - 0.5;
    const near = this.waters.find((w) => Math.hypot(w.x - p.x, w.z - p.z) < w.r * 0.6);
    if (near) { near.r = Math.max(near.r, r); near.y = Math.min(near.y, y); }
    else this.waters.push({ x: p.x, z: p.z, r, y });
    this.dirty = true;
    this._status(`water: ${this.waters.length} ${this.waters.length === 1 ? 'lake' : 'lakes'}`
      + ` — ${depth.toFixed(1)} u deep, APPLY to fill`);
  }

  /** Where a sited road feature will be cut. Lives with the zone marks so it
   *  is cleared and rebuilt on the same schedule. */
  _roadMark(c, color) {
    if (!this._zones) {
      this._zones = new THREE.Group();
      this._zones.name = 'editor-zones';
      this.game.scene.add(this._zones);
    }
    const g = new THREE.RingGeometry(9, 13, 22);
    g.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({
      color, transparent: true, opacity: 0.85, depthTest: false }));
    m.position.set(c.x, c.y + 0.6, c.z);
    m.renderOrder = 999;
    m.userData.roadMark = color;
    this._zones.add(m);
  }

  _clearRoadMarks(color) {
    if (!this._zones) return;
    for (const c of [...this._zones.children]) {
      if (c.userData.roadMark !== color) continue;
      c.geometry.dispose(); c.material.dispose(); this._zones.remove(c);
    }
  }

  /** ROAD FEATURES, AT THE PLACE YOU TAPPED.
   *
   *  This used to bump a COUNT — "one more tunnel somewhere" — and let the
   *  builder choose the site. Tapping the ground did nothing you could see,
   *  which is exactly how it was reported: "the editor is not adding roads".
   *  Worse, BRIDGE raised `bridgeCount`, and that number builds wooden plank
   *  FOOTbridges over streams, not a road bridge — so the one thing the word
   *  promises was the one thing it could not do.
   *
   *  Now the tap picks the nearest point on the lap and the feature is sited
   *  THERE. A bore through a corner self-intersects and a span needs a run to
   *  land on, so the road still has the final say — but it says so NOW, in
   *  the status line, instead of silently building nothing at APPLY. */
  _roadAt(p) {
    const t = this.game.track;
    if (!p) { this._status('tap the map where the road should carry it'); return; }
    const V = new THREE.Vector3(p.x, 0, p.z);
    const i = t.nearestIndex(V);
    const c = t.center[i];
    const away = Math.hypot(c.x - p.x, c.z - p.z);
    if (away > 220) { this._status('too far from the road — tap nearer the lap'); return; }
    const n = t.center.length;
    const frac = i / n;

    if (this.roadMode === 'tunnel') {
      // MEASURE WHAT THE PLANNER MEASURES. A ±20-sample window said "straight
      // enough" while _planTunnels, which looks over the whole bore length,
      // said no — so the editor accepted the tap and then nothing appeared at
      // APPLY, which is the silence this tool was supposed to end.
      const lenS = Math.round(((t.T.tunnels && t.T.tunnels.len) || 80) / t.segLen);
      let mc = 0;
      for (let w = -lenS; w <= lenS; w++) mc = Math.max(mc, t.curvature[(i + w + n) % n]);
      if (mc > 0.013) {
        this._status(`too twisty here (${mc.toFixed(3)}) — a bore through a corner `
          + 'cuts its own mouth. Find a straighter run.');
        return;
      }
      if (this.roadFeat.tunnels.some((f) => Math.abs(f - frac) * n < 170)) {
        this._status('there is already a tunnel on this stretch'); return;
      }
      this.roadFeat.tunnels.push(frac);
      this._roadMark(c, 0x9ad8ff);
      this._status(`tunnel at ${(frac * 100) | 0}% of the lap `
        + `(${this.roadFeat.tunnels.length} total) — APPLY to bore it`);
    } else {
      // ONE road bridge per world: it is a carved gorge with a span over it,
      // and two of them fighting over the same elevation profile is how you
      // get a road that leads into a hole.
      //
      // _planGorge takes the straightest sample inside the window it is given
      // and imposes no curvature ceiling of its own, so the editor must not
      // invent one either — it only enforces the rule the planner does have:
      // not on top of the start line.
      if (t._circDist(i, 0) < 70) {
        this._status('too close to the start line for a gorge — pick a spot further round');
        return;
      }
      this.roadFeat.bridge = frac;
      this._clearRoadMarks(0xffd24a);
      this._roadMark(c, 0xffd24a);
      this._status(`bridge over a new gorge at ${(frac * 100) | 0}% of the lap `
        + '— APPLY to carve and span it');
    }
    this.dirty = true;
  }

  _eraseAt(p) {
    // drop placed objects within the brush; sculpt dabs are undone with UNDO
    const before = this.elements.length;
    this.elements = this.elements.filter((e) => Math.hypot(e.x - p.x, e.z - p.z) > this.radius);
    if (this.elements.length !== before) {
      this._clearGhosts();
      for (const e of this.elements) this._ghost(e);
      this.dirty = true;
      this._status(`erased ${before - this.elements.length}`);
    }
  }

  /* --- DOM ---------------------------------------------------------------- */
  _status(msg) { if (this.statusEl) this.statusEl.textContent = msg; }

  _buildDOM() {
    const root = document.createElement('div');
    root.id = 'editor-ui';
    root.className = 'off';
    root.innerHTML = `
      <div id="ed-top">
        <button class="ed-btn" data-act="exit">✕ EXIT</button>
        <span id="ed-status">EDITOR</span>
        <button class="ed-btn ed-go" data-act="apply">APPLY</button>
        <button class="ed-btn" data-act="drive">TEST DRIVE</button>
      </div>
      <div id="ed-tools">
        <button class="ed-tool current" data-tool="raise">RAISE</button>
        <button class="ed-tool" data-tool="lower">LOWER</button>
        <button class="ed-tool" data-tool="smooth">SMOOTH</button>
        <button class="ed-tool" data-tool="flatten">FLATTEN</button>
        <button class="ed-tool" data-tool="place">PLACE</button>
        <button class="ed-tool" data-tool="erase">ERASE</button>
        <button class="ed-tool" data-tool="clear">CLEAR AREA</button>
        <button class="ed-tool" data-tool="road">ROAD</button>
        <button class="ed-tool" data-tool="water">WATER</button>
        <button class="ed-tool" data-tool="orbit">ORBIT</button>
      </div>
      <div id="ed-sliders">
        <label>SIZE <input id="ed-radius" type="range" min="8" max="180" value="40"><b id="ed-radius-v">40</b></label>
        <label>FORCE <input id="ed-strength" type="range" min="1" max="20" value="3"><b id="ed-strength-v">3</b></label>
      </div>
      <div id="ed-world">
        <div class="ed-pgroup">WORLD RECIPE</div>
        <label>LOOK <select id="ed-theme"></select></label>
        <label>SKY <select id="ed-weather"></select></label>
        <div class="ed-pgroup">ROAD</div>
        <div id="ed-roadrow">
          <button class="ed-mini current" data-road="tunnel">TUNNEL</button>
          <button class="ed-mini" data-road="bridge">BRIDGE</button>
        </div>
        <div class="ed-hint">pick one, then tap ROAD on the map to add</div>
      </div>
      <div id="ed-palette"></div>
      <div id="ed-bottom">
        <button class="ed-btn" data-act="undo">UNDO</button>
        <button class="ed-btn" data-act="save">SAVE</button>
        <button class="ed-btn" data-act="load">LOAD</button>
        <button class="ed-btn" data-act="clear">CLEAR</button>
      </div>`;
    document.body.appendChild(root);
    this.root = root;
    this.statusEl = root.querySelector('#ed-status');

    root.addEventListener('click', (e) => {
      const t = e.target.closest('[data-tool]');
      if (t) {
        this.tool = t.dataset.tool;
        root.querySelectorAll('.ed-tool').forEach((b) => b.classList.toggle('current', b === t));
        root.querySelector('#ed-palette').classList.toggle('open', this.tool === 'place');
        this._status(this.tool.toUpperCase());
        return;
      }
      const a = e.target.closest('[data-act]');
      if (!a) return;
      const act = a.dataset.act;
      if (act === 'exit') this.exit();
      else if (act === 'apply') this.apply();
      else if (act === 'drive') this.testDrive();
      else if (act === 'undo') this._undo();
      else if (act === 'clear') this._clearAll();
      else if (act === 'save') this._saveFlow();
      else if (act === 'load') this._loadFlow();
    });

    // world recipe: another world's look, and the weather over it
    const th = root.querySelector('#ed-theme');
    th.innerHTML = THEME_MENU.map(([v, l]) => `<option value="${v}">${l}</option>`).join('');
    th.addEventListener('change', () => {
      this.themeName = th.value || null;
      this.dirty = true;
      this._status(this.themeName ? `look: ${th.options[th.selectedIndex].text} — APPLY` : 'look: as built');
    });
    const wx = root.querySelector('#ed-weather');
    wx.innerHTML = WEATHER_ORDER.map((k) => `<option value="${k}">${k.toUpperCase()}</option>`).join('');
    wx.addEventListener('change', () => {
      this.weather = wx.value === 'clear' ? 'clear' : wx.value;
      this.dirty = true;
      this._status(`sky: ${wx.value.toUpperCase()} — APPLY`);
    });
    this.roadMode = 'tunnel';
    root.querySelector('#ed-roadrow').addEventListener('click', (e) => {
      const b = e.target.closest('[data-road]');
      if (!b) return;
      this.roadMode = b.dataset.road;
      root.querySelectorAll('#ed-roadrow .ed-mini').forEach((x) => x.classList.toggle('current', x === b));
    });

    const rad = root.querySelector('#ed-radius'), str = root.querySelector('#ed-strength');
    rad.addEventListener('input', () => {
      this.radius = +rad.value;
      root.querySelector('#ed-radius-v').textContent = rad.value;
    });
    str.addEventListener('input', () => {
      this.strength = +str.value;
      root.querySelector('#ed-strength-v').textContent = str.value;
    });
  }

  _renderPalette() {
    const el = this.root.querySelector('#ed-palette');
    if (el.dataset.built) return;
    el.dataset.built = '1';
    el.innerHTML = PALETTE.map((g) => `<div class="ed-pgroup">${g.group}</div>`
      + g.items.map(([k, label]) => `<button class="ed-preset" data-preset="${k}">${label}</button>`).join('')).join('');
    el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-preset]');
      if (!b) return;
      this.preset = b.dataset.preset;
      el.querySelectorAll('.ed-preset').forEach((x) => x.classList.toggle('current', x === b));
      this.tool = 'place';
      this.root.querySelectorAll('.ed-tool').forEach((x) => x.classList.toggle('current', x.dataset.tool === 'place'));
      this._status(`PLACE ${this.preset} — tap the ground`);
    });
  }

  _clearAll() {
    if (!confirm('Clear all edits in this scene?')) return;
    this.delta = new TerrainDelta();
    this.elements = [];
    this.erase = [];
    this.themeName = null;
    this.weather = null;
    // sited features, not counts: lap fractions for the bores, one for a span
    this.roadFeat = { tunnels: [], bridge: null };
    this.waters = [];
    this._clearGhosts();
    this._clearZoneMarks();
    this.dirty = true;
    this._status('cleared — APPLY to rebuild');
  }

  _saveFlow() {
    const name = prompt('Scene name:', this.sceneName
      || ((this.game.level && this.game.level.name) || 'SCENE') + ' EDIT');
    if (!name) return;
    this.sceneName = name;
    WorldEditor.save(name, this.serialize());
    this.game._renderLevelCards?.();
    this._status(`saved "${name}"`);
  }

  _loadFlow() {
    const all = WorldEditor.list();
    const names = Object.keys(all);
    if (!names.length) { this._status('no saved scenes'); return; }
    const pick = prompt('Load which scene?\n\n' + names.join('\n'), names[0]);
    if (!pick || !all[pick]) return;
    const data = all[pick];
    const lv = LEVELS.find((l) => l.id === data.base);
    const swap = lv && (!this.game.level || this.game.level.id !== lv.id);
    this.load(data);
    if (swap) {
      // the edits travel with the request, never as ambient game state
      this.game.swapLevel(lv, true, this.buildPayload());
      this._tmCache = null;
    } else {
      this.apply();
    }
    this._clearGhosts();
    for (const e of this.elements) this._ghost(e);
    this._status(`loaded "${pick}"`);
  }
}
