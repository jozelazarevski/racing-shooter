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

/* What each tool actually wants you to do. Picking a tool used to echo its own
 * name back at you, which tells you nothing you did not just read off the
 * button — and for the tools whose gesture is not obvious (tap versus drag,
 * which slider matters) that was the difference between working and broken. */
const HINT = {
  raise: 'RAISE — drag to paint the ground up. The ROAD follows the sculpt',
  lower: 'LOWER — drag to dig. The ROAD follows: dig a cutting, raise a ramp',
  smooth: 'SMOOTH — drag to average the ground under the brush',
  flatten: 'FLATTEN — drag to level everything to where you started',
  place: 'PLACE — pick a preset, then TAP the ground. ROT and SCALE aim it',
  erase: 'ERASE — tap to remove what is under the brush, yours or the world\'s',
  clear: 'CLEAR AREA — tap to strip the world\'s own scenery from a circle',
  rotate: 'ROTATE — tap an object you placed to turn it by ROT',
  select: 'SELECT — tap any object. Then DRAG it to move, ROT to turn, DELETE to remove. You see it happen',
  road: 'ROAD — pick TUNNEL, BRIDGE or RIVER, then tap the road',
  route: 'MOVE ROAD — drag a marker on the racing line to bend the lap',
  widen: 'WIDEN — tap the road to open the carriageway (SIZE = length, STRENGTH = metres). NARROW inverts it',
  water: 'WATER — tap to sink a lake (SIZE sets it)',
  orbit: 'ORBIT — drag to swing the camera, pinch or wheel to zoom',
};

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
    this.roadFeat = { tunnels: [], bridge: null, rivers: [] };
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

    // ONE UNDO STACK FOR EVERYTHING.
    //
    // Undo used to guess what you meant from the current tool, and its first
    // test was `tool === 'place' || this.preset` — but `preset` is set the
    // moment you touch the palette and never clears, so from then on UNDO
    // popped buildings no matter which tool was live. Sculpt, erase and the
    // road features had no way to be undone at all. Every edit now pushes the
    // exact inverse of itself and UNDO runs the last one.
    this._history = [];

    // Point-and-drag re-routing: displacements applied to the racing line
    // itself, {x, z, r, dx, dz}. The Track sums them over the centreline
    // before anything else is built, so the whole world follows the new shape.
    this.warp = [];
    this._drag = null;               // the control point currently being moved

    // WIDEN: pulls on the carriageway's own half-width, {x, z, r, d}. Read by
    // Track._applyWidenEdits into the ONE width profile everything else asks
    // through widthAt(), so the ribbon, the verges, the rival lateral clamp
    // and the scenery-clearance rules all open out together.
    this.widen = [];
    this._widenStep = 3;             // metres of half-width per tap

    // SELECTION. One object, picked off the ground, with its own handles.
    // `_hidden` remembers the instance matrices we blanked so a live delete
    // or move can be undone without a rebuild.
    this.sel = null;
    this._hidden = [];

    this._placeRot = 0;
    this._placeScale = 1;
    this._rotStep = Math.PI / 8;   // 22.5 deg per tap of the ROTATE tool

    this._buildDOM();
  }

  /* --- storage ------------------------------------------------------------
   *
   * SCENES BELONG TO THE PROFILE, SO THEY TRAVEL.
   *
   * They used to live under a single global `ir-scenes` key. The sync engine
   * snapshots the PROFILE key space (`ir-p<id>-*`) — career, garage, cars —
   * so a scene sat outside the only mechanism the game has for getting your
   * data onto another device: build a world on the phone and it did not
   * exist on the laptop. Moving it inside that space is the whole fix; the
   * cloud row and the sync codes then carry scenes with no new transport,
   * which is the machinery this game already had.
   *
   * The old global key is read once and folded in, so nothing built before
   * this is lost. */
  static _key(game) {
    const id = game && game.profile ? game.profile.id : null;
    return id == null ? 'ir-scenes' : `ir-p${id}-scenes`;
  }

  static list(game) {
    const k = WorldEditor._key(game);
    let mine = {};
    try { mine = JSON.parse(localStorage.getItem(k) || '{}'); } catch { /* private mode */ }
    if (k !== 'ir-scenes') {
      // one-time fold-in of anything saved before scenes were profile-scoped
      let old = {};
      try { old = JSON.parse(localStorage.getItem('ir-scenes') || '{}'); } catch { /* ignore */ }
      let grew = false;
      for (const [n, v] of Object.entries(old)) if (!(n in mine)) { mine[n] = v; grew = true; }
      if (grew || Object.keys(old).length) {
        try {
          localStorage.setItem(k, JSON.stringify(mine));
          // AND THEN THE OLD KEY GOES. Leaving it meant every `list()` folded
          // it back in, so deleting a migrated scene "worked" and the scene
          // reappeared on the next read — the card delete stopped sticking.
          // The data is in the profile store now; the legacy copy is a
          // duplicate that can only cause that.
          localStorage.removeItem('ir-scenes');
        } catch { /* private mode: the fold-in is a no-op and that is fine */ }
      }
    }
    return mine;
  }

  static save(name, data, game) {
    const k = WorldEditor._key(game);
    const all = WorldEditor.list(game);
    all[name] = data;
    try { localStorage.setItem(k, JSON.stringify(all)); } catch { /* private mode */ }
    game?.sync?.schedulePush?.();
  }

  static remove(name, game) {
    const k = WorldEditor._key(game);
    const all = WorldEditor.list(game);
    delete all[name];
    try { localStorage.setItem(k, JSON.stringify(all)); } catch { /* private mode */ }
    game?.sync?.schedulePush?.();
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
      road: (this.roadFeat.tunnels.length || this.roadFeat.bridge != null
        || this.roadFeat.rivers.length)
        ? { tunnels: this.roadFeat.tunnels.map((f) => +f.toFixed(4)),
          bridge: this.roadFeat.bridge,
          rivers: this.roadFeat.rivers.map((f) => +f.toFixed(4)) } : undefined,
      waters: this.waters.length ? this.waters.map((w) => ({
        x: +w.x.toFixed(1), z: +w.z.toFixed(1), r: +w.r.toFixed(1), y: +w.y.toFixed(2),
      })) : undefined,
      warp: this.warp.length ? this.warp.map((w) => ({
        x: +w.x.toFixed(1), z: +w.z.toFixed(1), r: +w.r.toFixed(1),
        dx: +w.dx.toFixed(1), dz: +w.dz.toFixed(1),
      })) : undefined,
      widen: this.widen.length ? this.widen.map((s) => ({
        x: +s.x.toFixed(1), z: +s.z.toFixed(1), r: +s.r.toFixed(1), w: +s.w.toFixed(2),
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
    // RIVER: authored ford crossings. The whole waterway — the spline that
    // threads them, the bed carve, the ribbon, the banks and the wash — is the
    // machinery every themed river already uses; the editor only states where
    // it crosses the road. Authoring any replaces the theme's random ones.
    if (this.roadFeat.rivers.length) {
      tune.fords = { count: this.roadFeat.rivers.length, at: [...this.roadFeat.rivers] };
    }
    return {
      delta: this.delta,
      elements: this.elements,
      erase: this.erase,
      waters: this.waters,
      warp: this.warp,
      widen: this.widen,
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
      rivers: Array.isArray(rd.rivers) ? [...rd.rivers] : [],
    };
    this.waters = (data.waters || []).map((w) => ({ ...w }));
    this.warp = (data.warp || []).map((w) => ({ ...w }));
    this.widen = (data.widen || []).map((w) => ({ ...w }));
    this.sceneName = data.name || '';
    this._history = [];
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
    if (this._routeGrp) this._routeGrp.visible = true;
    // exit() takes the markers down, so enter() has to put them back — a
    // second visit used to open on a scene with no sign of the work in it
    this._refreshMarkers();
    this._status('EDITOR — sculpt, place, then APPLY');
  }

  exit() {
    if (!this.active) return;
    this.active = false;
    this._unbindPointer();
    this._clearPreview();
    // TAKE THE MARKERS WITH YOU. The ghosts, clear-zone discs and road pins
    // live on `game.scene`, not on the track group, so a rebuild does not
    // touch them and exit() left them standing: you drove the lap through a
    // row of floating yellow rings and blue pins. They are editor furniture
    // and they belong to the editor.
    this._clearGhosts();
    this._clearZoneMarks();
    this._clearRoadMarks();
    this._clearSelection();
    if (this._routeGrp) this._routeGrp.visible = false;
    if (this.ring) this.ring.visible = false;
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
    if (this.ring) this.ring.visible = this._hasHit && this._hasRadius();
    this.game.renderer.render(this.game.scene, this.game.camera);
  }

  _isSculpt() { return ['raise', 'lower', 'smooth', 'flatten'].includes(this.tool); }

  /** Tools whose SIZE slider means something, and which therefore deserve the
   *  brush ring. It used to show only while sculpting, so ERASE, CLEAR AREA
   *  and WATER — all of which use the same radius — gave no clue how much
   *  ground they were about to take. */
  _hasRadius() {
    return this._isSculpt() || ['erase', 'clear', 'water'].includes(this.tool);
  }

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
    this._push(`a ${this.preset}`, () => {
      this.elements = this.elements.filter((q) => q !== e);
    });
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
  /** `then` runs AFTER the rebuild, not after the timer that schedules it.
   *  The delay exists only so the status line paints before a rebuild that
   *  blocks for about a second — but TEST DRIVE used to call apply() and then
   *  immediately start the race, so `startRace` set the state to 'countdown'
   *  and the rebuild, arriving 30 ms later, found swapLevel refusing to run.
   *  You drove the UNEDITED world while the screen said APPLIED. */
  apply(then = null) {
    this._status('rebuilding…');
    this._clearPreview();
    setTimeout(() => {
      this.game.editScene = this.buildPayload();
      this.game.rebuildWorld();
      this._tmCache = null;
      // the rebuild IS the truth now — the live blanking we did to preview a
      // delete or a move belongs to a world that no longer exists
      this._hidden = [];
      this._clearSelection();
      this.dirty = false;
      // everything on the list is now a real building in the rebuilt world,
      // so its marker drops to a footprint ring instead of a crate over it
      for (const e of this.elements) e.built = true;
      this._refreshMarkers();
      this._status(`APPLIED — ${this.delta.length} dabs, ${this.elements.length} objects, `
        + `${this.erase.length} cleared, ${this.warp.length} road moves`);
      if (then) then();
    }, 30);
  }

  testDrive() {
    const go = () => { this.exit(); this.game.startRace?.(); };
    if (this.dirty) this.apply(go); else go();
  }

  /* --- input -------------------------------------------------------------- */
  _bindPointer() {
    const el = this.game.renderer.domElement;
    this._onDown = (e) => {
      el.setPointerCapture?.(e.pointerId);
      this._ptr.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY });
      if (this._ptr.size === 1) {
        // THE CAMERA IS ALWAYS YOURS.
        //
        // Orbit used to need a right button or the ORBIT tool, which on a
        // phone means it needed the ORBIT tool — so with any other tool
        // selected a drag did nothing and the view was stuck wherever it had
        // been parked. Reported as the camera not being fixed.
        //
        // Now a DRAG always moves the camera and a TAP always acts. The only
        // exception is the sculpt brushes, which are painted by dragging and
        // would be useless otherwise; those keep the right button for orbit.
        this._orbiting = (e.button === 2 || e.button === 1) || this.tool === 'orbit'
          || !this._isSculpt();
        this._tapPending = !this._isSculpt() && this.tool !== 'orbit' && e.button === 0;
        if (this._isSculpt() && !this._orbiting) {
          const p = this._pick(e.clientX, e.clientY);
          if (p) {
            this._flatY = this.game.track.terrainHeight(p.x, p.z) + this.delta.at(p.x, p.z);
            this._painting = true;
            this._strokeFrom = this.delta.dabs.length;
            this._dab(p);
          }
        } else if (this._tapPending && this.tool === 'route') {
          // the one drag that is not the camera: a control point being moved
          this._beginRouteDrag(e.clientX, e.clientY);
          if (this._drag) { this._orbiting = false; this._tapPending = false; }
        } else if (this._tapPending && this.tool === 'select' && this.sel) {
          // dragging ON a selected object moves it; dragging anywhere else
          // still swings the camera, so selection never costs you the view
          const q = this._pick(e.clientX, e.clientY);
          const near = q && Math.hypot(q.x - this.sel.x, q.z - this.sel.z)
            < Math.max(6, (this.sel.r ?? 4) * 1.6);
          if (near && this.sel.kind !== 'solid') {
            const el = this._adoptSelection() || this.sel.el;
            // where it started, so UNDO puts it back there and not wherever
            // the drag happened to end
            this._selDragFrom = el ? { el, x: el.x, z: el.z } : null;
            this._selDrag = !!el;
            this._orbiting = false;
            this._tapPending = false;
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
      // once the finger has travelled, this is a drag and not a tap
      if (Math.hypot(e.clientX - rec.sx, e.clientY - rec.sy) > 8) this._tapPending = false;
      if (this._ptr.size >= 2) {
        // pinch = zoom, drag = pan
        const d = this._pinchDist();
        if (this._pinch) this.dist = Math.max(30, Math.min(1400, this.dist * (this._pinch / d)));
        this._pinch = d;
        this._pan(dx * 0.5, dy * 0.5);
      } else if (this._drag) {
        this._dragRoute(e.clientX, e.clientY);
      } else if (this._selDrag) {
        this._dragSelection(e.clientX, e.clientY);
      } else if (this._orbiting) {
        this.yaw -= dx * 0.006;
        this.pitch = Math.max(0.12, Math.min(1.52, this.pitch + dy * 0.005));
      } else if (this._painting && p) {
        this._dab(p);
      }
      e.preventDefault();
    };
    this._onUp = (e) => {
      const rec = this._ptr.get(e.pointerId);
      this._ptr.delete(e.pointerId);
      // A TAP IS A CLICK THAT DID NOT MOVE. Acting on pointerDOWN meant every
      // attempt to swing the camera also dropped a building where the finger
      // landed, so the two could not coexist; acting on pointerUP, only when
      // the finger stayed put, lets one finger do both.
      if (rec && this._tapPending && this._ptr.size === 0) {
        const moved = Math.hypot(e.clientX - rec.sx, e.clientY - rec.sy);
        if (moved <= 8) this._tapAt(e.clientX, e.clientY);
      }
      if (this._drag) this._endRouteDrag();
      if (this._selDrag) {
        this._selDrag = false;
        const from = this._selDragFrom;
        this._selDragFrom = null;
        if (from && (from.el.x !== from.x || from.el.z !== from.z)) {
          this._push('a move', () => {
            from.el.x = from.x; from.el.z = from.z;
            this._refreshMarkers();
          });
          this._status(`moved — APPLY to build it there (${this.elements.length} objects)`);
          this._syncSelPanel();
        }
      }
      this._tapPending = false;
      if (this._ptr.size === 0) {
        if (this._painting) this._endStroke();
        this._painting = false; this._orbiting = false;
      }
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

  /** One tap, one action — every click-once tool dispatches from here. */
  _tapAt(cx, cy) {
    const p = this._pick(cx, cy);
    if (!p) { this._status('tap the ground, not the sky'); return; }
    if (this.tool === 'place') this._place(p);
    else if (this.tool === 'erase') this._eraseAt(p);
    else if (this.tool === 'clear') this._eraseWorldAt(p);
    else if (this.tool === 'road') this._roadAt(p);
    else if (this.tool === 'water') this._waterAt(p);
    else if (this.tool === 'rotate') this._rotateAt(p);
    else if (this.tool === 'widen') this._widenAt(p);
    else if (this.tool === 'select') this._selectAt(p);
    else if (this.tool === 'route') this._status('drag a marker on the road to move the line');
  }

  /* --- selection: pick a thing up and change it, and SEE it change -------- */
  /** THE EDIT YOU CAN SEE.
   *
   *  Everything else in this editor is deferred: you paint, the status line
   *  counts, and the world only catches up at APPLY. That is right for a
   *  sculpt (the whole terrain has to be rebuilt) and wrong for one object,
   *  where "did that work?" should be answered by looking at it.
   *
   *  So a selected object is taken OUT of the built world immediately — its
   *  instances are blanked in place — and a live proxy is drawn in its stead,
   *  which moves and turns with you. APPLY makes it permanent by the ordinary
   *  route: an erase circle where it stood, and an element of the same
   *  template where you left it. Nothing here invents a new payload concept. */
  _selectAt(p) {
    const t = this.game.track;
    let best = null, bd = 14 * 14;
    // 1. my own placed objects win — they are the ones I am most likely to be
    //    aiming at, and they carry their template already
    for (const e of this.elements) {
      const d = (e.x - p.x) ** 2 + (e.z - p.z) ** 2;
      if (d < bd) { bd = d; best = { kind: 'mine', el: e, x: e.x, z: e.z, rot: e.rot, scale: e.scale, preset: e.preset }; }
    }
    // 2. then anything the BUILDER put down, with the template it used
    if (!best) {
      for (const w of t.placedElements ?? []) {
        const d = (w.x - p.x) ** 2 + (w.z - p.z) ** 2;
        if (d < bd) { bd = d; best = { kind: 'world', src: w, x: w.x, z: w.z, rot: w.rot, scale: w.scale, preset: w.type, r: w.r }; }
      }
    }
    // 3. and failing that, anything solid at all — trees, rocks, masonry.
    //    These have no template to re-place, so they can be removed but not
    //    moved, and the panel says so rather than pretending.
    if (!best) {
      for (const s of t.solids ?? []) {
        const d = (s.x - p.x) ** 2 + (s.z - p.z) ** 2;
        if (d < bd) { bd = d; best = { kind: 'solid', src: s, x: s.x, z: s.z, rot: 0, scale: 1, r: s.r }; }
      }
    }
    if (!best) {
      this._clearSelection();
      this._status('nothing here — tap an object');
      return;
    }
    this._clearSelection();
    this.sel = best;
    this._selMark();
    const what = best.preset ? best.preset.toUpperCase() : (best.src?.mat || 'OBJECT').toUpperCase();
    this._status(best.kind === 'solid'
      ? `${what} selected — DELETE removes it (no template to move it by)`
      : `${what} selected — drag to move, ROT to turn, DELETE to remove`);
    this._syncSelPanel();
  }

  /** Draw the selection: a ring on the ground and a box in the air, so a
   *  picked object is unmistakable from any camera angle. */
  _selMark() {
    if (!this._selGroup) {
      this._selGroup = new THREE.Group();
      this._selGroup.name = 'editor-selection';
      this.game.scene.add(this._selGroup);
    }
    const s = this.sel;
    if (!s) return;
    const t = this.game.track;
    const y = t.terrainHeight(s.x, s.z) + this.delta.at(s.x, s.z);
    const r = Math.max(2.5, (s.r ?? 3.4) * (s.scale ?? 1));
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(r, r + 0.7, 32),
      new THREE.MeshBasicMaterial({ color: 0x5ad7ff, transparent: true, opacity: 0.95, depthTest: false }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(s.x, y + 0.4, s.z);
    ring.renderOrder = 1000;
    this._selGroup.add(ring);
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(r * 1.5, r * 1.7, r * 1.5),
      new THREE.MeshBasicMaterial({ color: 0x5ad7ff, wireframe: true, transparent: true,
        opacity: 0.7, depthTest: false }));
    box.position.set(s.x, y + r * 0.85, s.z);
    box.rotation.y = s.rot ?? 0;
    box.renderOrder = 1000;
    this._selGroup.add(box);
  }

  /** Drop the highlight but keep the selection (used when it is about to be
   *  redrawn somewhere else). */
  _clearSelMarks() {
    if (!this._selGroup) return;
    for (const c of [...this._selGroup.children]) {
      c.geometry.dispose(); c.material.dispose(); this._selGroup.remove(c);
    }
  }

  _clearSelection() {
    this.sel = null;
    this._clearSelMarks();
  }

  /** Blank every batched instance standing within `r` of a point, remembering
   *  what was there. This is what makes a delete or a move VISIBLE at once:
   *  the house goes now, not at APPLY. */
  _hideAround(x, z, r) {
    const hidden = [];
    const m = new THREE.Matrix4();
    const pos = new THREE.Vector3();
    const zero = new THREE.Matrix4().makeScale(0, 0, 0);
    this.game.track.group.traverse((o) => {
      if (!o.isInstancedMesh) return;
      for (let i = 0; i < o.count; i++) {
        o.getMatrixAt(i, m);
        pos.setFromMatrixPosition(m);
        if ((pos.x - x) ** 2 + (pos.z - z) ** 2 > r * r) continue;
        hidden.push({ mesh: o, i, mat: m.clone() });
        o.setMatrixAt(i, zero);
      }
      o.instanceMatrix.needsUpdate = true;
    });
    if (hidden.length) this._hidden.push(...hidden);
    return hidden;
  }

  /** Put back what `_hideAround` blanked (one undo step's worth). */
  _unhide(list) {
    const meshes = new Set();
    for (const h of list) { h.mesh.setMatrixAt(h.i, h.mat); meshes.add(h.mesh); }
    for (const m of meshes) m.instanceMatrix.needsUpdate = true;
    this._hidden = this._hidden.filter((h) => !list.includes(h));
  }

  /** Take a world object into MY list so it can be moved or turned: erase
   *  where it stood, and add an element of the same template in its place.
   *  Idempotent — a second call on an already-adopted selection is a no-op. */
  _adoptSelection() {
    const s = this.sel;
    if (!s || s.kind !== 'world') return s && s.el ? s.el : null;
    const r = Math.max(4, (s.r ?? 4) * 1.4);
    const zone = { x: s.x, z: s.z, r };
    this.erase.push(zone);
    const el = { preset: s.preset, x: s.x, z: s.z, rot: s.rot ?? 0, scale: s.scale ?? 1 };
    this.elements.push(el);
    this.dirty = true;
    // out of the built world NOW, and a marker in its place
    const hidden = this._hideAround(s.x, s.z, r);
    this._ghost(el);
    this.sel = { ...s, kind: 'mine', el };
    this._push('adopting a world object', () => {
      this.erase = this.erase.filter((q) => q !== zone);
      this.elements = this.elements.filter((q) => q !== el);
      this._unhide(hidden);
      this._refreshMarkers();
    });
    return el;
  }

  /** DELETE the selection, visibly. */
  deleteSelection() {
    const s = this.sel;
    if (!s) { this._status('nothing selected'); return; }
    if (s.kind === 'mine') {
      const el = s.el;
      const idx = this.elements.indexOf(el);
      if (idx >= 0) this.elements.splice(idx, 1);
      // a placed object that has already been built is also in the world
      const hidden = el.built ? this._hideAround(el.x, el.z, 6 * (el.scale || 1)) : [];
      this.dirty = true;
      this._push('deleting an object', () => {
        this.elements.push(el);
        if (hidden.length) this._unhide(hidden);
        this._refreshMarkers();
      });
    } else {
      const r = Math.max(4, (s.r ?? 4) * 1.4);
      const zone = { x: s.x, z: s.z, r };
      this.erase.push(zone);
      this.dirty = true;
      const hidden = this._hideAround(s.x, s.z, r);
      this._zoneMark(zone);
      this._push('deleting a world object', () => {
        this.erase = this.erase.filter((q) => q !== zone);
        this._unhide(hidden);
        this._refreshMarkers();
      });
    }
    this._clearSelection();
    this._refreshMarkers();
    this._status('DELETED — gone from the world now, permanent at APPLY');
    this._syncSelPanel();
  }

  /** Turn the selection by the ROT slider, live. */
  rotateSelection() {
    const s = this.sel;
    if (!s) { this._status('nothing selected'); return; }
    if (s.kind === 'solid') { this._status('this one has no template — it can only be deleted'); return; }
    const el = s.kind === 'world' ? this._adoptSelection() : s.el;
    if (!el) return;
    const before = el.rot;
    el.rot = (el.rot + this._rotStep) % (Math.PI * 2);
    this.sel.rot = el.rot;
    this.dirty = true;
    this._push('a rotation', () => { el.rot = before; this._refreshMarkers(); });
    this._refreshMarkers();
    this._clearSelMarks();
    this.sel = { ...this.sel, kind: 'mine', el, rot: el.rot };
    this._selMark();
    this._status(`turned to ${Math.round(el.rot * 180 / Math.PI)}° — APPLY to build it there`);
  }

  /** Drag the selection across the ground. Called from the pointer move
   *  handler while a selection drag is live. */
  _dragSelection(cx, cy) {
    const p = this._pick(cx, cy);
    if (!p || !this.sel) return;
    const el = this.sel.el;
    if (!el) return;
    el.x = p.x; el.z = p.z;
    this.sel.x = p.x; this.sel.z = p.z;
    this.dirty = true;
    this._clearGhosts();
    for (const e of this.elements) this._ghost(e);
    this._clearSelMarks();
    this._selMark();
  }

  /** WIDEN / NARROW the carriageway itself.
   *
   *  "Make a wider u turn" was answered with MOVE ROAD and the sculpt, which
   *  bend the line and reshape the ground but leave the road exactly nine
   *  metres wide — you could move the hairpin, never open it. This is the
   *  missing gesture: tap the road, and the surface there gets wider.
   *
   *  Stated in world space like every other brush (a circle and an amount)
   *  rather than as a sample range, so it survives a MOVE ROAD that shifts
   *  the centreline underneath it: the pull is on the ROAD NEAR HERE, and
   *  wherever the road ends up, that is what opens. */
  _widenAt(p) {
    const t = this.game.track;
    const i = t.nearestIndex({ x: p.x, y: 0, z: p.z });
    const c = t.center[i];
    const d = Math.hypot(p.x - c.x, p.z - c.z);
    // the brush must be ON the road: widening open country does nothing you
    // could see, and silently doing nothing is the editor's oldest complaint
    if (d > (t.widthAt ? t.widthAt(i) : 9) + 14) {
      this._status('tap the ROAD — widen works on the carriageway');
      return;
    }
    const step = this.narrowMode ? -this._widenStep : this._widenStep;
    // read the PENDING width, not the built one: strokes only reach the road
    // at APPLY, so a second tap before then has to step up from where the
    // first tap left it or the tool would appear to stop working
    const here = this._pendingWidthAt(c.x, c.z, t.widthAt ? t.widthAt(i) : 9);
    const want = Math.max(5, Math.min(22, here + step));
    if (Math.abs(want - here) < 0.05) {
      this._status(here <= 5.05 ? 'as narrow as a road gets' : 'as wide as a road gets');
      return;
    }
    const w = { x: c.x, z: c.z, r: this.radius, w: want };
    this.widen.push(w);
    this.dirty = true;
    this._widenMark(w, i);
    this._push('a width change', () => {
      this.widen = this.widen.filter((q) => q !== w);
      this._refreshMarkers();
    });
    this._status(`${this.narrowMode ? 'NARROWED' : 'WIDENED'} to ${want.toFixed(1)} u half-width `
      + `over ${(this.radius * 2) | 0} u — APPLY to rebuild`);
  }

  /** The half-width a point will HAVE once the pending strokes are applied.
   *  Mirrors Track._applyWidenEdits exactly — same order, same falloff — so
   *  what the status line promises is what the rebuild delivers. */
  _pendingWidthAt(x, z, built) {
    let w = built;
    for (const s of this.widen) {
      const d = Math.hypot(x - s.x, z - s.z);
      if (d >= s.r) continue;
      const u = d / s.r;
      const f = 1 - (u * u * (3 - 2 * u));      // smoothstep, as the Track does
      w += (Math.max(5, Math.min(22, s.w)) - w) * f;
    }
    return w;
  }

  /** A width change is invisible until APPLY, so draw what was asked for: a
   *  ring at the NEW half-width, green for wider and amber for narrower,
   *  sitting on the road where the pull was placed. */
  _widenMark(w, i) {
    if (!this._zones) {
      this._zones = new THREE.Group();
      this._zones.name = 'editor-zones';
      this.game.scene.add(this._zones);
    }
    const t = this.game.track;
    const half = Math.max(1, w.w);
    const g = new THREE.RingGeometry(Math.max(0.5, half - 0.6), half + 0.6, 40);
    g.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({
      color: w.w >= (t.widthAt ? t.widthAt(i) : 9) ? 0x6cf07a : 0xf0a44c,
      transparent: true, opacity: 0.8, depthTest: false,
    }));
    m.position.set(w.x, t.center[i].y + 0.55, w.z);
    m.renderOrder = 999;
    m.userData.widenMark = true;
    this._zones.add(m);
  }

  /* --- undo --------------------------------------------------------------- */
  /** Record the inverse of an edit. Every mutating tool calls this, so UNDO
   *  never has to guess which one you meant from the tool that happens to be
   *  selected — which is exactly how it used to get it wrong. */
  _push(label, undo) { this._history.push({ label, undo }); }

  /** A sculpt STROKE is one action, not forty. Dragging the brush lays a dab
   *  every frame; undoing them one at a time would take as long as painting. */
  _endStroke() {
    const from = this._strokeFrom ?? this.delta.dabs.length;
    const n = this.delta.dabs.length - from;
    if (n <= 0) return;
    this._push(`${n} dab${n > 1 ? 's' : ''}`, () => {
      this.delta.dabs.length = from;
      this.delta.rebuild();
    });
    this._strokeFrom = null;
  }

  _undo() {
    const a = this._history.pop();
    if (!a) { this._status('nothing left to undo'); return; }
    a.undo();
    this.dirty = true;
    this._refreshMarkers();
    this._status(`undid ${a.label} — ${this._history.length} step`
      + `${this._history.length === 1 ? '' : 's'} left`);
  }

  /** Redraw every marker from the current model. Cheaper to think about than
   *  patching each list's markers at each call site, and it means UNDO cannot
   *  leave a ghost behind for something that no longer exists. */
  _refreshMarkers() {
    this._clearGhosts();
    for (const e of this.elements) this._ghost(e);
    this._clearZoneMarks();
    for (const z of this.erase) this._zoneMark(z);
    this._clearRoadMarks();
    const t = this.game.track;
    for (const f of this.roadFeat.tunnels) {
      this._roadMark(t.center[Math.round(f * t.center.length) % t.center.length], 0x9ad8ff);
    }
    if (this.roadFeat.bridge != null) {
      const i = Math.round(this.roadFeat.bridge * t.center.length) % t.center.length;
      this._roadMark(t.center[i], 0xffd24a);
    }
    for (const f of this.roadFeat.rivers) {
      this._roadMark(t.center[Math.round(f * t.center.length) % t.center.length], 0x54c8f0);
    }
    for (const w of this.widen) {
      this._widenMark(w, t.nearestIndex({ x: w.x, y: 0, z: w.z }));
    }
    this._routeMarks();
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
  _eraseWorldAt(p, why = null) {
    const z = { x: p.x, z: p.z, r: this.radius };
    this.erase.push(z);
    this.dirty = true;
    this._zoneMark(z);
    this._push('a clear zone', () => { this.erase = this.erase.filter((q) => q !== z); });
    this._status(why || `clear zone ${this.erase.length} (r ${Math.round(this.radius)})`
      + ' — APPLY to strip it');
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
    const dabAt = this.delta.dabs.length - 1;
    if (near) {
      const wasR = near.r, wasY = near.y;
      near.r = Math.max(near.r, r); near.y = Math.min(near.y, y);
      this._push('a lake', () => {
        near.r = wasR; near.y = wasY;
        this.delta.dabs.splice(dabAt, 1); this.delta.rebuild();
      });
    } else {
      const w = { x: p.x, z: p.z, r, y };
      this.waters.push(w);
      this._push('a lake', () => {
        this.waters = this.waters.filter((q) => q !== w);
        this.delta.dabs.splice(dabAt, 1); this.delta.rebuild();
      });
    }
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

  /** With no colour, clear every road pin — which is what UNDO and exit need.
   *  With one, clear just that kind (the bridge replaces its own pin). */
  _clearRoadMarks(color) {
    if (!this._zones) return;
    for (const c of [...this._zones.children]) {
      if (c.userData.roadMark === undefined) continue;
      if (color !== undefined && c.userData.roadMark !== color) continue;
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

    // SITE IT, DO NOT REFUSE IT.
    //
    // Both features used to test the exact station you tapped and give up if
    // it failed. On PINE VALLEY — the world the editor opens on — not one of
    // the 900 stations passed the tunnel test, so TUNNEL could not be placed
    // anywhere at all and simply argued with every tap. BRIDGE did the same
    // thing for a different reason: the camera starts parked over the start
    // line, and a gorge is forbidden within 70 samples of it.
    //
    // A tap means "about here". So walk outward from it and take the first
    // station that works, telling you how far it had to go. Only when the
    // WHOLE LAP has nowhere is there anything to refuse, and then the message
    // is about the world rather than about your aim.
    if (this.roadMode === 'river') {
      // Site it with the BUILDER'S rule (Track.fordFitAt), same discipline as
      // the tunnel: the tap means "the river crosses about here", and the
      // nearest station the ford gates accept is where it lands.
      const taken = this.roadFeat.rivers.map((f) => ({ i: Math.round(f * n) % n }));
      const site = this._walkOut(i, n, (k) => t.fordFitAt(k, taken));
      if (site == null) {
        this._status('nowhere left on this lap for another crossing — '
          + 'they need 150 samples of separation');
        return;
      }
      const f = site / n;
      this.roadFeat.rivers.push(f);
      this._roadMark(t.center[site], 0x54c8f0);
      this._push('a river crossing', () => {
        this.roadFeat.rivers = this.roadFeat.rivers.filter((q) => q !== f);
      });
      const moved = Math.round(t._circDist(site, i) * t.segLen);
      this._status(`river crossing at ${(f * 100) | 0}% of the lap`
        + (moved > 6 ? ` (${moved} u along, to a legal crossing)` : '')
        + ` — ${this.roadFeat.rivers.length} total. One river threads them all; `
        + 'APPLY to cut it');
      this.dirty = true;
      return;
    }
    if (this.roadMode === 'tunnel') {
      // Measure what the planner measures: _planTunnels looks over the whole
      // bore length, so a +/-20 sample window said "straight enough" and then
      // nothing appeared at APPLY.
      // ASK THE BUILDER, DO NOT GUESS. The editor used to keep its own copy of
      // the planner's curvature ceiling; the two then had to be kept in step by
      // hand, and when the planner learned to shorten a bore rather than refuse
      // it, the editor would have gone on refusing. `tunnelFitAt` is the one
      // rule, and it answers with the LENGTH available rather than yes/no.
      const lenS = Math.round(((t.T.tunnels && t.T.tunnels.len) || 80) / t.segLen);
      const clash = (k) => this.roadFeat.tunnels.some(
        (f) => t._circDist(Math.round(f * n) % n, k) < lenS * 2 + 8);
      const site = this._walkOut(i, n, (k) => t.tunnelFitAt(k, lenS) > 0 && !clash(k));
      if (site == null) {
        this._status(clash(i)
          ? 'every straight on this lap already has a bore — UNDO one first'
          : 'nowhere on this lap holds even a short bore — it is corners all the way');
        return;
      }
      const fit = Math.round(t.tunnelFitAt(site, lenS) * 2 * t.segLen);
      const f = site / n;
      this.roadFeat.tunnels.push(f);
      this._roadMark(t.center[site], 0x9ad8ff);
      this._push('a tunnel', () => {
        this.roadFeat.tunnels = this.roadFeat.tunnels.filter((q) => q !== f);
      });
      const moved = Math.round(t._circDist(site, i) * t.segLen);
      this._status(`tunnel at ${(f * 100) | 0}% of the lap, ${fit} u long`
        + (moved > 6 ? ` (${moved} u along, to the nearest straight)` : '')
        + ` — ${this.roadFeat.tunnels.length} total, APPLY to bore it`);
    } else {
      // ONE road bridge per world: it is a carved gorge with a span over it,
      // and two of them fighting over the same elevation profile is how you
      // get a road that leads into a hole.
      const site = this._walkOut(i, n, (k) => t._circDist(k, 0) >= 70);
      if (site == null) { this._status('this lap is too short to carry a gorge'); return; }
      const f = site / n;
      const was = this.roadFeat.bridge;
      this.roadFeat.bridge = f;
      this._clearRoadMarks(0xffd24a);
      this._roadMark(t.center[site], 0xffd24a);
      this._push('the bridge', () => { this.roadFeat.bridge = was; });
      const moved = Math.round(t._circDist(site, i) * t.segLen);
      this._status(`bridge over a new gorge at ${(f * 100) | 0}% of the lap`
        + (moved > 6 ? ` (${moved} u clear of the start line)` : '')
        + ' — APPLY to carve and span it');
    }
    this.dirty = true;
  }

  /* --- point-and-drag re-routing ------------------------------------------ */
  /** MOVE THE ROAD ITSELF.
   *
   *  The ROAD tool only ever placed tunnels and bridges — there was no way to
   *  change where the lap GOES, which is the first thing anyone expects from a
   *  track editor. Handles sit on the racing line; drag one and the centreline
   *  follows it, with the pull falling off smoothly along the lap so the road
   *  bends rather than kinking.
   *
   *  The displacement is stored, not baked: `edit.warp` is a list of pulls,
   *  and the Track sums them over the centreline before anything else is
   *  built. That is what makes the whole world follow — the terrain blend, the
   *  scenery, the overpasses and the elevation all read the moved line, so the
   *  road does not end up sliding across ground that was shaped for the old
   *  one. */
  _routeHandles() {
    const t = this.game.track, n = t.center.length;
    const out = [];
    const STEP = Math.max(1, Math.round(n / 24));      // two dozen handles
    for (let i = 0; i < n; i += STEP) out.push(i);
    return out;
  }

  _routeMarks() {
    if (this._routeGrp) {
      for (const c of [...this._routeGrp.children]) {
        c.geometry.dispose(); c.material.dispose(); this._routeGrp.remove(c);
      }
    }
    if (this.tool !== 'route') return;
    if (!this._routeGrp) {
      this._routeGrp = new THREE.Group();
      this._routeGrp.name = 'editor-route';
      this.game.scene.add(this._routeGrp);
    }
    const t = this.game.track;
    for (const i of this._routeHandles()) {
      const c = t.center[i];
      const pulled = this.warp.some((w) => Math.hypot(w.x - c.x, w.z - c.z) < 12);
      const m = new THREE.Mesh(new THREE.SphereGeometry(2.6, 10, 8),
        new THREE.MeshBasicMaterial({ color: pulled ? 0x7dff9b : 0x6fe3ff,
          transparent: true, opacity: 0.9, depthTest: false }));
      m.position.set(c.x, c.y + 3.2, c.z);
      m.renderOrder = 998;
      m.userData.station = i;
      this._routeGrp.add(m);
    }
  }

  _beginRouteDrag(cx, cy) {
    if (!this._routeGrp || !this._routeGrp.children.length) return;
    const g = this.game;
    const r = g.renderer.domElement.getBoundingClientRect();
    this._ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    this._ray.setFromCamera(this._ndc, g.camera);
    const hit = this._ray.intersectObjects(this._routeGrp.children, false)[0];
    if (!hit) return;
    const i = hit.object.userData.station;
    const c = g.track.center[i];
    this._drag = { i, ox: c.x, oz: c.z, mesh: hit.object };
  }

  _dragRoute(cx, cy) {
    const p = this._pick(cx, cy);
    if (!p || !this._drag) return;
    this._drag.mesh.position.set(p.x, p.y + 3.2, p.z);
    this._drag.nx = p.x; this._drag.nz = p.z;
  }

  _endRouteDrag() {
    const d = this._drag;
    this._drag = null;
    if (!d || d.nx === undefined) { this._routeMarks(); return; }
    const dx = d.nx - d.ox, dz = d.nz - d.oz;
    const moved = Math.hypot(dx, dz);
    if (moved < 3) { this._routeMarks(); return; }
    // REACH IS PROPORTIONAL TO THE PULL. A 10 u nudge that dragged 300 u of
    // lap with it is not an edit, it is a new circuit; a 120 u haul that only
    // reached 40 u either side would fold the road back on itself.
    const w = { x: d.ox, z: d.oz, r: Math.max(70, moved * 3.2), dx, dz };
    this.warp.push(w);
    this.dirty = true;
    this._push('a road move', () => { this.warp = this.warp.filter((q) => q !== w); });
    this._routeMarks();
    this._status(`road pulled ${Math.round(moved)} u over ${Math.round(w.r)} u of lap `
      + `(${this.warp.length} move${this.warp.length > 1 ? 's' : ''}) — APPLY to rebuild it`);
  }

  /** The nearest station to `i` that `ok` accepts, searched outward in both
   *  directions. Returns null only when the whole lap refuses. */
  _walkOut(i, n, ok) {
    if (ok(i)) return i;
    for (let d = 1; d <= n / 2; d++) {
      const a = (i + d) % n, b = (i - d + n) % n;
      if (ok(a)) return a;
      if (ok(b)) return b;
    }
    return null;
  }

  /** ERASE removes what is under the brush, whoever built it.
   *
   *  It used to drop only objects YOU had placed, and — worse — its status
   *  line lived inside the "something changed" branch, so pointing it at a
   *  tree did nothing AND said nothing. Two different silences at once: the
   *  tool looked broken because you could not tell it apart from a missed tap.
   *
   *  Now: your own objects go first, because that is the reversible, precise
   *  thing to do. If there were none, it falls through to a keep-out circle,
   *  which is the only way generated scenery can be removed at all — the
   *  village and the wood are invented afresh on every build, so there is no
   *  instance to delete, only a place to tell the builders to skip. Either
   *  way it says which of the two it did. */
  _eraseAt(p) {
    const before = this.elements.length;
    const kept = this.elements.filter((e) => Math.hypot(e.x - p.x, e.z - p.z) > this.radius);
    const gone = before - kept.length;
    if (gone) {
      const removed = this.elements.filter((e) => Math.hypot(e.x - p.x, e.z - p.z) <= this.radius);
      this.elements = kept;
      this.dirty = true;
      this._refreshMarkers();
      this._push(`erase of ${gone} object${gone > 1 ? 's' : ''}`, () => {
        this.elements.push(...removed);
      });
      this._status(`erased ${gone} placed object${gone > 1 ? 's' : ''}`);
      return;
    }
    this._eraseWorldAt(p, 'nothing of yours here — cleared the world\'s scenery instead');
  }

  /* --- rotate ------------------------------------------------------------- */
  /** Turn the object nearest the tap by the ROT slider's step.
   *
   *  `_placeRot` and `_placeScale` existed from the beginning and were never
   *  written by anything, so every building the editor placed faced due north
   *  at scale 1. The sliders now write them for the NEXT placement, and this
   *  tool re-aims one already down. */
  _rotateAt(p) {
    let best = null, bd = Infinity;
    for (const e of this.elements) {
      const d = Math.hypot(e.x - p.x, e.z - p.z);
      if (d < bd) { bd = d; best = e; }
    }
    if (!best || bd > Math.max(14, this.radius)) {
      this._status('no object of yours near that tap — place one first');
      return;
    }
    const was = best.rot || 0;
    best.rot = was + this._rotStep;
    this.dirty = true;
    this._refreshMarkers();
    this._push('a rotation', () => { best.rot = was; });
    this._status(`turned ${best.preset} to ${Math.round((best.rot * 180 / Math.PI) % 360)}°`
      + ' — APPLY to rebuild it');
  }

  /* --- DOM ---------------------------------------------------------------- */
  _status(msg) {
    if (this.statusEl) this.statusEl.textContent = msg;
    // every status line is the tail of an edit, so this is the one place that
    // has to remember to keep the CHANGES panel honest
    this._syncChanges();
  }

  /** WHAT HAVE I ACTUALLY CHANGED? Live, itemised, always on screen.
   *
   *  The editor's whole model is deferred — paint now, rebuild at APPLY — and
   *  the only account of the pending work was a sentence in the status bar
   *  that the next action overwrote. You could not tell a scene with one dab
   *  from one with forty, or notice that you had left a stray clear zone
   *  somewhere behind the camera. */
  _syncChanges() {
    const el = this.root && this.root.querySelector('#ed-changelist');
    if (!el) return;
    const rows = [];
    if (this.delta.dabs.length) rows.push([`${this.delta.dabs.length}`, 'terrain dabs']);
    if (this.elements.length) rows.push([`${this.elements.length}`, 'objects placed']);
    if (this.erase.length) rows.push([`${this.erase.length}`, 'things removed']);
    if (this.warp.length) rows.push([`${this.warp.length}`, 'road moves']);
    if (this.widen.length) rows.push([`${this.widen.length}`, 'width changes']);
    if (this.waters.length) rows.push([`${this.waters.length}`, 'lakes']);
    if (this.roadFeat.tunnels.length) rows.push([`${this.roadFeat.tunnels.length}`, 'tunnels']);
    if (this.roadFeat.bridge != null) rows.push(['1', 'bridge']);
    if (this.roadFeat.rivers.length) rows.push([`${this.roadFeat.rivers.length}`, 'river crossings']);
    if (this.themeName) rows.push(['—', `look: ${this.themeName}`]);
    if (this.weather) rows.push(['—', `sky: ${this.weather}`]);
    el.innerHTML = rows.length
      ? rows.map(([n, what]) => `<div class="ed-chg"><b>${n}</b> ${what}</div>`).join('')
        + (this.dirty ? '<div class="ed-chg pend">APPLY to rebuild</div>' : '')
      : 'nothing yet';
  }

  /** The selection panel says what is picked and what can be done to it. */
  _syncSelPanel() {
    const el = this.root && this.root.querySelector('#ed-selwhat');
    if (!el) return;
    const s = this.sel;
    if (!s) { el.textContent = 'nothing selected'; return; }
    const what = s.preset ? s.preset.toUpperCase() : (s.src?.mat || 'object').toUpperCase();
    el.textContent = s.kind === 'solid'
      ? `${what} — removable` : `${what} — move / turn / remove`;
  }

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
        <button class="ed-tool" data-tool="select">SELECT</button>
        <div id="ed-selsub">
          <div id="ed-selwhat">nothing selected</div>
          <div id="ed-selrow">
            <button class="ed-mini" data-sel="rotate">ROTATE</button>
            <button class="ed-mini" data-sel="delete">DELETE</button>
          </div>
          <div class="ed-hint">drag the object itself to move it</div>
        </div>
        <button class="ed-tool current" data-tool="raise">RAISE</button>
        <button class="ed-tool" data-tool="lower">LOWER</button>
        <button class="ed-tool" data-tool="smooth">SMOOTH</button>
        <button class="ed-tool" data-tool="flatten">FLATTEN</button>
        <button class="ed-tool" data-tool="place">PLACE</button>
        <button class="ed-tool" data-tool="erase">ERASE</button>
        <button class="ed-tool" data-tool="clear">CLEAR AREA</button>
        <button class="ed-tool" data-tool="rotate">ROTATE</button>
        <button class="ed-tool" data-tool="road">ROAD</button>
        <div id="ed-roadsub"><div id="ed-roadrow">
          <button class="ed-mini current" data-road="tunnel">TUNNEL</button>
          <button class="ed-mini" data-road="bridge">BRIDGE</button>
          <button class="ed-mini" data-road="river">RIVER</button>
        </div><div class="ed-hint">then tap the road</div></div>
        <button class="ed-tool" data-tool="route">MOVE ROAD</button>
        <button class="ed-tool" data-tool="widen">WIDEN</button>
        <div id="ed-widensub"><div id="ed-widenrow">
          <button class="ed-mini current" data-widen="wide">WIDER</button>
          <button class="ed-mini" data-widen="narrow">NARROWER</button>
        </div><div class="ed-hint">FORCE = metres per tap</div></div>
        <button class="ed-tool" data-tool="water">WATER</button>
        <button class="ed-tool" data-tool="orbit">ORBIT</button>
      </div>
      <div id="ed-sliders">
        <label>SIZE <input id="ed-radius" type="range" min="8" max="180" value="40"><b id="ed-radius-v">40</b></label>
        <label>FORCE <input id="ed-strength" type="range" min="1" max="20" value="3"><b id="ed-strength-v">3</b></label>
        <label>ROT <input id="ed-rot" type="range" min="0" max="345" step="15" value="0"><b id="ed-rot-v">0°</b></label>
        <label>SCALE <input id="ed-scale" type="range" min="50" max="220" step="5" value="100"><b id="ed-scale-v">1.0</b></label>
      </div>
      <div id="ed-changes">
        <div class="ed-pgroup">CHANGES</div>
        <div id="ed-changelist">nothing yet</div>
      </div>
      <div id="ed-world">
        <div class="ed-pgroup">WORLD RECIPE</div>
        <label>LOOK <select id="ed-theme"></select></label>
        <label>SKY <select id="ed-weather"></select></label>

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
        // TUNNEL / BRIDGE sat in the WORLD RECIPE panel on the far side of the
        // screen from the ROAD tool that uses them, so which one was armed —
        // and that you had to arm one at all — was anyone's guess. It now lives
        // under the ROAD button and only exists while ROAD is the live tool.
        root.querySelector('#ed-roadsub').classList.toggle('open', this.tool === 'road');
        root.querySelector('#ed-widensub').classList.toggle('open', this.tool === 'widen');
        root.querySelector('#ed-selsub').classList.toggle('open', this.tool === 'select');
        if (this.tool !== 'select') this._clearSelection();
        this._syncSelPanel();
        // the road handles only exist while you are moving the road
        this._routeMarks();
        this._status(HINT[this.tool] || this.tool.toUpperCase());
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
    root.querySelector('#ed-selrow').addEventListener('click', (e) => {
      const b = e.target.closest('[data-sel]');
      if (!b) return;
      if (b.dataset.sel === 'rotate') this.rotateSelection();
      else if (b.dataset.sel === 'delete') this.deleteSelection();
    });
    this.narrowMode = false;
    root.querySelector('#ed-widenrow').addEventListener('click', (e) => {
      const b = e.target.closest('[data-widen]');
      if (!b) return;
      this.narrowMode = b.dataset.widen === 'narrow';
      root.querySelectorAll('#ed-widenrow .ed-mini').forEach((x) => x.classList.toggle('current', x === b));
    });

    const rad = root.querySelector('#ed-radius'), str = root.querySelector('#ed-strength');
    rad.addEventListener('input', () => {
      this.radius = +rad.value;
      root.querySelector('#ed-radius-v').textContent = rad.value;
    });
    str.addEventListener('input', () => {
      this.strength = +str.value;
      // FORCE is metres of half-width for WIDEN, capped so one tap cannot
      // jump the road from a lane to a runway
      this._widenStep = Math.max(1, Math.min(8, +str.value));
      root.querySelector('#ed-strength-v').textContent = str.value;
    });
    // ROT and SCALE finally write the two fields `_place` has always read.
    // They were declared, defaulted and never assigned, so every building the
    // editor placed faced the same way at the same size.
    const rot = root.querySelector('#ed-rot'), scl = root.querySelector('#ed-scale');
    rot.addEventListener('input', () => {
      this._placeRot = (+rot.value) * Math.PI / 180;
      this._rotStep = Math.PI / 8;
      root.querySelector('#ed-rot-v').textContent = `${rot.value}°`;
    });
    scl.addEventListener('input', () => {
      this._placeScale = (+scl.value) / 100;
      root.querySelector('#ed-scale-v').textContent = this._placeScale.toFixed(1);
    });
  }

  _renderPalette() {
    const el = this.root.querySelector('#ed-palette');
    if (el.dataset.built) return;
    el.dataset.built = '1';
    // A NAME IS NOT A CHOICE. The palette listed twenty-six words, so picking a
    // building meant already knowing what "COTTAGE F" looks like. Each preset
    // now carries a thumbnail rendered from the REAL element pipeline
    // (assets/palette/<key>.jpg, baked by scratchpad/palbake.mjs), so what you
    // pick is a picture of what you get. The label stays underneath — the
    // image is `onerror`-hidden, so a missing thumbnail degrades to exactly
    // the old text button rather than to a broken-image icon.
    el.innerHTML = PALETTE.map((g) => `<div class="ed-pgroup">${g.group}</div>`
      + '<div class="ed-pgrid">'
      + g.items.map(([k, label]) => `<button class="ed-preset" data-preset="${k}" title="${label}">`
        + `<img class="ed-pshot" src="assets/palette/${k}.jpg" alt="" loading="lazy"`
        + ` onerror="this.style.display='none'">`
        + `<span class="ed-plabel">${label}</span></button>`).join('')
      + '</div>').join('');
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
    this.roadFeat = { tunnels: [], bridge: null, rivers: [] };
    this.waters = [];
    this._clearGhosts();
    this._clearZoneMarks();
    this.dirty = true;
    this._status('cleared — APPLY to rebuild');
  }

  /** SAVING NEVER QUIETLY REPLACES SOMETHING.
   *
   *  Two different overwrites were possible and neither said a word. Saving
   *  over an existing scene of the same name replaced it outright; and a scene
   *  named after a shipped world reads, on the track list, as that world — so
   *  it looked as though the original had been destroyed. Both now ask, and
   *  the shipped-world case says plainly that the original is untouched. */
  _saveFlow() {
    const suggested = this.sceneName
      || ((this.game.level && this.game.level.name) || 'SCENE') + ' EDIT';
    const name = prompt('Scene name:', suggested);
    if (!name) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    const existing = WorldEditor.list(this.game);
    if (trimmed in existing && trimmed !== this.sceneName) {
      if (!confirm(`"${trimmed}" already exists.\n\nReplace that saved scene?`)) {
        this._status('save cancelled — nothing was replaced');
        return;
      }
    }
    const shipped = LEVELS.some((l) => l.name.toUpperCase() === trimmed.toUpperCase());
    if (shipped) {
      if (!confirm(`"${trimmed}" is the name of a built-in world.\n\n`
        + 'The original is NOT changed — it stays on the track list and you can '
        + 'always race it. Your scene will appear beside it under the same name, '
        + 'which is easy to confuse.\n\nSave it under that name anyway?')) {
        this._status('save cancelled — pick a name of your own');
        return;
      }
    }
    this.sceneName = trimmed;
    WorldEditor.save(trimmed, this.serialize(), this.game);
    this.game._renderLevelCards?.();
    this._status(`saved "${trimmed}" — it syncs with your profile`);
  }

  _loadFlow() {
    const all = WorldEditor.list(this.game);
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
