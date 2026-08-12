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
 *   new Track(scene, level, edit)
 *   - delta:    TerrainDelta (or null) sampled inside terrainHeight
 *   - elements: [{ preset, x, z, rot, scale }] stamped before the batch is
 *               realised, so placed buildings cost no extra draw calls
 *   - props:    [{ kind, x, z, rot, scale }] hand-planted trees and rocks
 *   - erase:    keep-out circles the generators skip
 *   - waters:   [{ x, z, r, y }] lake surfaces
 *   - warp:     [{ x, z, r, dx, dz }] pulls applied to the racing line
 *   - theme / tune: the world recipe (another world's look, weather, features)
 * Contract with main.js:
 *   game.editor = new WorldEditor(game)  — mounts its own DOM + input
 *   game.rebuildWorld()                  — teardown + rebuild, same level
 */

import * as THREE from 'three';
import { LEVELS, EDIT_PROP_KINDS, ROAD_HALF } from './track.js';

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
        if (e.mode === dab.mode && Math.abs(e.r - dab.r) < 0.5 && e.e === dab.e
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
   *  as a stack of discs: cos^e over the radius. e = 2 is the default and the
   *  only shape the brush used to have — it meets zero with zero gradient and
   *  therefore leaves no crease at the brush edge, which is what you want for
   *  a hillside. HARDNESS lowers the exponent toward 0.6, which is what you
   *  want for a terrace or a plateau: a flat top and a defined shoulder.
   *  Stored per dab so a scene keeps the shape it was carved with. */
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
      sum += d.dh * (d.e === undefined ? t * t : Math.pow(t, d.e));
    }
    return sum;
  }

  get length() { return this.dabs.length; }
  toJSON() {
    return this.dabs.map((d) => {
      const o = { x: +d.x.toFixed(1), z: +d.z.toFixed(1),
        r: +d.r.toFixed(1), dh: +d.dh.toFixed(2), mode: d.mode };
      if (d.e !== undefined) o.e = +d.e.toFixed(2);
      return o;
    });
  }
}

/* ---------------------------------------------------------------------------
 * The palette. Every entry names a preset the Track builder already knows how
 * to stamp, so the editor adds no new art and no new draw calls: placed
 * buildings join the same five instanced batches every world building uses.
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

/* NATURE. The counterpart to CLEAR AREA, which could only ever take scenery
 * away. Every key here is a kind `Track._buildEditProps` knows how to stamp
 * (EDIT_PROP_KINDS), and the list is FILTERED through that table at render
 * time, so the palette can never offer something the builder cannot build. */
export const NATURE_PALETTE = [
  ['pine', 'CONIFER'], ['broadleaf', 'BROADLEAF'], ['slim', 'SLIM TREE'],
  ['snag', 'DEAD SNAG'], ['bush', 'BUSH'], ['rock', 'ROCK'], ['boulder', 'BOULDER'],
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
  noise: 'NOISE — drag to roughen the ground. FORCE sets how broken it gets',
  place: 'PLACE — pick a preset, then TAP the ground. ROT and SCALE aim it',
  nature: 'NATURE — pick a tree or rock, then TAP. COUNT > 1 scatters the brush',
  erase: 'ERASE — tap to remove what is under the brush, yours or the world\'s',
  clear: 'CLEAR AREA — tap to strip the world\'s own scenery from a circle',
  rotate: 'ROTATE — tap an object you placed to turn it by ROT',
  select: 'SELECT — tap an object to move, turn or remove it. SHIFT-TAP adds more; arrows nudge',
  road: 'ROAD — pick TUNNEL, BRIDGE or RIVER, then tap the road',
  route: 'MOVE ROAD — drag a marker on the racing line to bend the lap',
  widen: 'WIDEN — tap the road to open the carriageway (SIZE = length, FORCE = metres). NARROWER inverts it',
  water: 'WATER — tap to sink a lake (SIZE sets it). SELECT it to set its level',
  orbit: 'ORBIT — drag to swing the camera, pinch or wheel to zoom',
};

/* KEYBOARD. A build tool that can only be driven by hunting for a button is a
 * build tool you use once. Every tool, every camera move and every file action
 * has a key; the same table renders the help overlay, so the two cannot drift.
 * `mod` means ctrl (or cmd). */
const KEYS = [
  ['TOOLS', [
    ['q', 'RAISE', { tool: 'raise' }], ['w', 'LOWER', { tool: 'lower' }],
    ['e', 'SMOOTH', { tool: 'smooth' }], ['r', 'FLATTEN', { tool: 'flatten' }],
    ['t', 'NOISE', { tool: 'noise' }],
    ['a', 'PLACE', { tool: 'place' }], ['s', 'NATURE', { tool: 'nature' }],
    ['d', 'WATER', { tool: 'water' }], ['f', 'ROAD', { tool: 'road' }],
    ['g', 'MOVE ROAD', { tool: 'route' }],
    ['v', 'SELECT', { tool: 'select' }], ['x', 'ERASE', { tool: 'erase' }],
    ['c', 'CLEAR AREA', { tool: 'clear' }], ['b', 'ORBIT', { tool: 'orbit' }],
  ]],
  ['BRUSH', [
    ['[', 'smaller brush', { act: 'radius-' }], [']', 'bigger brush', { act: 'radius+' }],
    ['-', 'weaker force', { act: 'force-' }], ['=', 'stronger force', { act: 'force+' }],
    [',', 'turn selection left', { act: 'rot-' }],
    ['.', 'turn selection right', { act: 'rot+' }],
  ]],
  ['THE SELECTION', [
    ['arrowleft', 'nudge west', { act: 'nudge-x-' }],
    ['arrowright', 'nudge east', { act: 'nudge-x+' }],
    ['arrowup', 'nudge north', { act: 'nudge-z-' }],
    ['arrowdown', 'nudge south', { act: 'nudge-z+' }],
    ['shift+arrowleft', 'nudge west, ten times', { act: 'nudge-X-' }],
    ['shift+arrowright', 'nudge east, ten times', { act: 'nudge-X+' }],
    ['shift+arrowup', 'nudge north, ten times', { act: 'nudge-Z-' }],
    ['shift+arrowdown', 'nudge south, ten times', { act: 'nudge-Z+' }],
  ]],
  ['CAMERA', [
    ['1', 'top-down', { act: 'cam-top' }], ['2', 'low angle', { act: 'cam-low' }],
    ['0', 'back to the start line', { act: 'cam-home' }],
    ['\\', 'frame the selection', { act: 'cam-focus' }],
  ]],
  ['DO AND UNDO', [
    ['mod+z', 'UNDO', { act: 'undo' }], ['mod+shift+z', 'REDO', { act: 'redo' }],
    ['mod+y', 'REDO', { act: 'redo' }],
    ['delete', 'delete the selection', { act: 'del' }],
    ['backspace', 'delete the selection', { act: 'del' }],
    ['mod+d', 'duplicate the selection', { act: 'dup' }],
  ]],
  ['THE WORLD', [
    ['enter', 'APPLY', { act: 'apply' }], ['p', 'TEST DRIVE', { act: 'drive' }],
    ['k', 'CHECK the scene', { act: 'check' }],
    ['mod+s', 'SAVE', { act: 'save' }], ['mod+o', 'SCENES', { act: 'scenes' }],
    ['?', 'this list', { act: 'help' }], ['escape', 'close / deselect / EXIT', { act: 'esc' }],
  ]],
];

/* How far back UNDO reaches. Each step holds the whole scene twice — before
 * and after — which is what makes redo free and every tool undoable without
 * writing an inverse. The price is memory: a heavy scene is ~100 kB of JSON,
 * so an unbounded stack is a leak with a friendly name. Sixty steps is deeper
 * than any session anyone has run and costs at most a few megabytes. */
const HISTORY_DEPTH = 60;

/** Scene codes are base64url of the JSON, so they survive a chat window, a
 *  text field and a URL without escaping. Not compression — a scene is small
 *  and correctness beats another 30%: what matters is that a code pasted into
 *  another device rebuilds the identical world. */
function encodeCode(obj) {
  const json = JSON.stringify(obj);
  const bytes = new TextEncoder().encode(json);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
/** A scene NAME is the one string in this tool that can come from somewhere
 *  else. It used to be typed into a prompt by the only person who would ever
 *  see it; now a CODE pasted from another device carries one, and the scene
 *  browser prints it into markup. Anything printed there goes through this
 *  first — an imported name is untrusted text, not markup. */
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function decodeCode(code) {
  const s = String(code).trim().replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(s + '==='.slice((s.length + 3) % 4));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return JSON.parse(new TextDecoder().decode(bytes));
}
export { encodeCode as encodeSceneCode, decodeCode as decodeSceneCode };

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
    this.hardness = 0;              // 0 = soft hillside, 100 = terrace shoulder
    this.natureCount = 1;           // props per tap of the NATURE brush
    this.natureKind = 'pine';
    // LINE: two taps and a run of objects between them. Off by default, so a
    // single tap still means a single object.
    this.lineMode = false;
    this.spacing = 20;              // units between objects along a run
    this._lineFrom = null;          // the anchor, once the first tap has landed

    this.delta = new TerrainDelta();
    this.elements = [];
    this.props = [];
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

    // ONE UNDO STACK FOR EVERYTHING, AND IT REDOES.
    //
    // Undo used to guess what you meant from the current tool, and its first
    // test was `tool === 'place' || this.preset` — but `preset` is set the
    // moment you touch the palette and never clears, so from then on UNDO
    // popped buildings no matter which tool was live. Sculpt, erase and the
    // road features had no way to be undone at all.
    //
    // The fix after that recorded a hand-written inverse per tool, which
    // worked but had to be re-derived for every new tool and could not redo.
    // A scene is a few kB of plain data, so the honest thing is to keep the
    // WHOLE STATE either side of each action: undo and redo are then the same
    // operation in two directions, and a tool cannot forget to be undoable.
    this._history = [];              // [{label, before, after}]
    this._redo = [];

    // Point-and-drag re-routing: displacements applied to the racing line
    // itself, {x, z, r, dx, dz}. The Track sums them over the centreline
    // before anything else is built, so the whole world follows the new shape.
    this.warp = [];
    this._drag = null;               // the control point currently being moved
    // `sel` (declared with the selection tools above) is the ONE selection.
    // This used to be a second one — {type, ref} — living beside it, which is
    // exactly the sort of pair that drifts: two things claiming to know what
    // is picked, and the inspector believing the wrong one.

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
    // MORE THAN ONE. `sel` is still the primary selection and every existing
    // path reads it unchanged; `also` is the rest of a shift-tapped group.
    // A second selection MODEL is what the r155 merge had to unpick, so this
    // is deliberately not one: it is a list of the same `mine` entries, and
    // every group operation is just the singular one run over `_selGroupEls()`.
    this.also = [];
    this._hidden = [];

    this._placeRot = 0;
    this._placeScale = 1;
    this._rotStep = Math.PI / 8;   // 22.5 deg per tap of the ROTATE tool
    this.snap = 0;                 // grid size in units; 0 = free placement

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

  /** THE DRAFT. Work that has not been SAVEd used to exist only in this tab:
   *  a reload, a crash or an accidental EXIT and an hour of sculpting was
   *  gone, because the editor's model lived nowhere but in memory. Every edit
   *  now writes a draft, and re-entering the editor offers it back. It is
   *  deliberately OUTSIDE the named-scene store — a draft is not a scene until
   *  you name it — and deliberately one slot, keyed by the base world. */
  static _draftKey(game) { return WorldEditor._key(game) + '-draft'; }

  /** Debounced, because it is called from every action and a heavy scene is a
   *  hundred kilobytes of JSON: serialising and writing that on each dab of a
   *  scatter is a visible hitch for a file nobody is going to read until the
   *  next session. A second of lag on a crash recovery costs nothing. */
  _saveDraft() {
    clearTimeout(this._draftTimer);
    this._draftTimer = setTimeout(() => this._saveDraftNow(), 900);
  }

  _saveDraftNow() {
    clearTimeout(this._draftTimer);
    try {
      localStorage.setItem(WorldEditor._draftKey(this.game),
        JSON.stringify({ t: Date.now(), scene: this.serialize() }));
    } catch { /* private mode, or a quota that a draft has no right to fight */ }
  }

  static draft(game) {
    try {
      const raw = localStorage.getItem(WorldEditor._draftKey(game));
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  static clearDraft(game) {
    try { localStorage.removeItem(WorldEditor._draftKey(game)); } catch { /* ignore */ }
  }

  /** Is there anything in this scene at all? Used by the draft prompt and by
   *  EXIT, both of which have to know the difference between "nothing yet" and
   *  "an hour of work". */
  isEmpty() {
    return !this.delta.length && !this.elements.length && !this.props.length
      && !this.erase.length && !this.waters.length && !this.warp.length
      && !this.roadFeat.tunnels.length && this.roadFeat.bridge == null
      && !this.roadFeat.rivers.length && !this.themeName && !this.weather;
  }

  serialize() {
    return {
      // v2 adds props (hand-planted nature), brush hardness on the dabs, and
      // the scene's own name for the CODE round trip. Everything a v1 scene
      // carried is read exactly as before — see load().
      v: 2,
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
      props: this.props.length ? this.props.map((p) => ({
        kind: p.kind, x: +p.x.toFixed(1), z: +p.z.toFixed(1),
        rot: +(p.rot || 0).toFixed(3), scale: +(p.scale || 1).toFixed(2),
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
      props: this.props,
      erase: this.erase,
      waters: this.waters,
      warp: this.warp,
      widen: this.widen,
      theme: this.themeName || undefined,
      tune: Object.keys(tune).length ? tune : undefined,
    };
  }

  /** Put a saved scene into the model. Split from `load` so UNDO/REDO can use
   *  the same code path without wiping the very history they are walking. */
  _applyState(data) {
    // ARRAYS, OR NOTHING. A scene now arrives from outside — a pasted CODE, a
    // synced profile — so a field that is supposed to be a list can turn up as
    // a string or a number. `for (const d of "abc")` does not throw; it fills
    // the sculpt with NaN and the world comes out silently wrong, which is the
    // worst of the three possible outcomes.
    const arr = (v) => (Array.isArray(v) ? v : []);
    this.delta = new TerrainDelta(arr(data.dabs).filter(
      (d) => d && Number.isFinite(d.x) && Number.isFinite(d.z) && d.r > 0));
    this.elements = arr(data.elements).filter((e) => e && typeof e.preset === 'string')
      .map((e) => ({ ...e }));
    this.props = arr(data.props).map((p) => ({ ...p }))
      .filter((p) => p && EDIT_PROP_KINDS[p.kind]);   // a later palette loads on an older build
    this.erase = arr(data.erase).map((z) => ({ ...z }));
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
    this.waters = arr(data.waters).map((w) => ({ ...w }));
    this.warp = arr(data.warp).map((w) => ({ ...w }));
    this.widen = arr(data.widen).filter((w) => w && Number.isFinite(w.w))
      .map((w) => ({ ...w }));
    this.sel = null;
  }

  load(data) {
    this._applyState(data);
    this.sceneName = data.name || '';
    this._history = [];
    this._redo = [];
    this.dirty = false;
    this._syncControls();
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
    this._bindKeys();
    this._renderPalette();
    this._syncControls();
    if (this._routeGrp) this._routeGrp.visible = true;
    // exit() takes the markers down, so enter() has to put them back — a
    // second visit used to open on a scene with no sign of the work in it
    this._refreshMarkers();
    this._offerDraft();
    this._status('EDITOR — sculpt, place, then APPLY.  ? for the key list');
  }

  /** A draft is offered, never restored behind your back: silently reviving an
   *  hour of someone else's abandoned work on top of a fresh world is a worse
   *  failure than losing it. */
  _offerDraft() {
    if (!this.isEmpty()) return;
    const d = WorldEditor.draft(this.game);
    if (!d || !d.scene) return;
    const base = d.scene.base;
    if (this.game.level && base !== this.game.level.id) return;
    const n = (d.scene.dabs || []).length + (d.scene.elements || []).length
      + (d.scene.props || []).length;
    if (!n) return;
    const when = new Date(d.t || Date.now()).toLocaleString();
    if (!confirm(`Unsaved work from ${when} on this world (${n} edits).\n\nBring it back?`)) {
      WorldEditor.clearDraft(this.game);
      return;
    }
    this.load(d.scene);
    this.dirty = true;
    this._refreshMarkers();
    this._status(`recovered ${n} edits — APPLY to see them`);
  }

  exit() {
    if (!this.active) return;
    // NEVER LOSE THE ROOM ON THE WAY OUT — and never nag about it either.
    // EXIT sits one tap from APPLY, so it gets pressed by accident; a
    // confirmation would then be in the way every single time to guard against
    // the rare case. The draft is the real safety net: unsaved work is written
    // on the way out and offered back the next time you open this world.
    if (!this.isEmpty()) this._saveDraftNow();
    this.active = false;
    this._unbindPointer();
    this._unbindKeys();
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
    this._cancelRun();
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

  _isSculpt() { return ['raise', 'lower', 'smooth', 'flatten', 'noise'].includes(this.tool); }

  /** Tools whose SIZE slider means something, and which therefore deserve the
   *  brush ring. It used to show only while sculpting, so ERASE, CLEAR AREA
   *  and WATER — all of which use the same radius — gave no clue how much
   *  ground they were about to take. */
  _hasRadius() {
    return this._isSculpt() || ['erase', 'clear', 'water', 'nature'].includes(this.tool);
  }

  /** The falloff exponent the HARDNESS slider asks for. 2 is the historical
   *  shape and stays the default, so a scene carved before hardness existed
   *  reads back identically. */
  _falloff() {
    if (!this.hardness) return undefined;
    return 2 - (this.hardness / 100) * 1.4;      // 2.0 soft → 0.6 hard
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

  /** SNAP is off by default and lives on the point, not on the tool, so every
   *  placing tool gets it for free and nothing else has to know about it. */
  _snapped(p) {
    if (!this.snap || !p) return p;
    const s = this.snap;
    return { x: Math.round(p.x / s) * s, y: p.y, z: Math.round(p.z / s) * s };
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
    if (this.tool === 'noise') {
      // ROUGHEN. One dab of alternating sign per pass, a third of the brush
      // wide and thrown somewhere inside it: what you get is broken ground
      // rather than a bump, and because every lump is an ordinary dab it
      // obeys every rule the rest of the sculpt does — the road clamps over
      // it, the scatter reads it, and UNDO takes the whole stroke.
      const a = Math.random() * Math.PI * 2;
      const rr = Math.sqrt(Math.random()) * this.radius * 0.8;
      const x = p.x + Math.cos(a) * rr, z = p.z + Math.sin(a) * rr;
      const amp = this.strength * (0.35 + Math.random() * 0.65) * (Math.random() < 0.5 ? -1 : 1);
      this.delta.add({ x, z, r: Math.max(6, this.radius * (0.22 + Math.random() * 0.2)),
        dh: amp, mode: 'noise' }, false);
      this.dirty = true;
      this._previewDab({ x, z }, amp, Math.max(6, this.radius * 0.3));
      return;
    }
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
    this.delta.add({ x: p.x, z: p.z, r: this.radius, dh, mode: this.tool, e: this._falloff() });
    this.dirty = true;
    this._previewDab(p, dh);
  }

  /** Live vertex preview. The drawn ground planes are pushed so the stroke is
   *  visible immediately; the REAL world (physics, scatter, water) only
   *  changes at Apply, which is why the toolbar says PREVIEW until then. */
  _previewDab(p, dh, radius = this.radius) {
    // THE GROUND PLANES ARE ALREADY ROTATED FLAT at build time
    // (`geo.rotateX(-PI/2)` in _buildTerrain), so a vertex reads x -> world x,
    // y -> HEIGHT, z -> world z. Written against the unrotated PlaneGeometry
    // convention (height in z) the brush pushed the ground sideways: measured,
    // and the reason this comment exists.
    const r2 = radius * radius;
    const e = this._falloff();
    for (const m of this._terrainMeshes()) {
      const pos = m.geometry.attributes.position;
      if (!pos) continue;
      let touched = false;
      for (let i = 0; i < pos.count; i++) {
        const dx = pos.getX(i) - p.x, dz = pos.getZ(i) - p.z;
        const d2 = dx * dx + dz * dz;
        if (d2 >= r2) continue;
        const t = Math.cos((Math.sqrt(d2) / radius) * Math.PI * 0.5);
        pos.setY(i, pos.getY(i) + dh * (e === undefined ? t * t : Math.pow(t, e)));
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
    const q = this._snapped(p);
    this._act(`a ${this.preset}`, () => {
      const e = { preset: this.preset, x: q.x, z: q.z,
        rot: this._placeRot ?? 0, scale: this._placeScale ?? 1 };
      this.elements.push(e);
      this.sel = { kind: 'mine', el: e, x: e.x, z: e.z, rot: e.rot, scale: e.scale, preset: e.preset };
    });
    this._status(`placed ${this.preset} (${this.elements.length} total) — APPLY to build`);
  }

  /* --- nature ------------------------------------------------------------- */
  /** PLANT SOMETHING. `COUNT` turns the tap into a scatter across the brush,
   *  which is the difference between placing a tree and planting a copse —
   *  nobody is going to tap four hundred times for a wood.
   *
   *  Scale and rotation are jittered on a scatter and exact on a single tap,
   *  so one tree is a decision and a copse is a copse. */
  _natureAt(p) {
    const kind = this.natureKind;
    if (!EDIT_PROP_KINDS[kind]) { this._status('pick a tree or a rock first'); return; }
    const n = Math.max(1, this.natureCount | 0);
    const added = [];
    this._act(n === 1 ? `a ${kind}` : `${n} ${kind}s`, () => {
      for (let i = 0; i < n; i++) {
        let x = p.x, z = p.z, s = this._placeScale ?? 1, rot = this._placeRot ?? 0;
        if (n > 1) {
          const a = Math.random() * Math.PI * 2;
          const rr = Math.sqrt(Math.random()) * this.radius;
          x += Math.cos(a) * rr; z += Math.sin(a) * rr;
          s *= 0.7 + Math.random() * 0.7;
          rot = Math.random() * Math.PI * 2;
        }
        const q = this._snapped({ x, z });
        const e = { kind, x: q.x, z: q.z, rot, scale: +s.toFixed(2) };
        this.props.push(e);
        added.push(e);
      }
      this.sel = added.length === 1
        ? { kind: 'mine', el: added[0], x: added[0].x, z: added[0].z,
          rot: added[0].rot, scale: added[0].scale, preset: added[0].kind }
        : null;
    });
    this._status(`planted ${n} ${kind}${n > 1 ? 's' : ''} `
      + `(${this.props.length} natural object${this.props.length === 1 ? '' : 's'}) — APPLY to grow`);
  }

  /* --- runs of objects ----------------------------------------------------- */
  /** A ROW, NOT A ROW OF TAPS.
   *
   *  A fence, an avenue, a village street and a line of pylons are all the
   *  same gesture: the same object, repeated, evenly, along a line. Doing that
   *  by hand is one tap per object plus a fight to keep the spacing even, and
   *  the spacing is the only part that actually reads — an avenue with three
   *  gaps in it does not look like an avenue.
   *
   *  TWO TAPS, NOT A DRAG. A drag already means "move the camera" everywhere
   *  in this tool except the sculpt brushes, and the editor is used on a phone
   *  as often as a desktop. So the first tap drops an anchor and the second
   *  completes the run — which also means you can orbit the camera in between
   *  to see where the far end ought to go. */
  _lineTap(p) {
    const q = this._snapped(p);
    if (!this._lineFrom) {
      this._lineFrom = { x: q.x, z: q.z };
      this._lineMark();
      this._status(`run started — tap the far end. SPACING ${this.spacing} u, `
        + 'ESC to cancel');
      return;
    }
    const from = this._lineFrom;
    this._lineFrom = null;
    this._clearLineMark();
    this._placeRun(from, q);
  }

  /** Lay the run. Rotation follows the LINE, so a row of cottages fronts the
   *  street it stands on rather than all facing north; the ROT slider is added
   *  on top, which is how you turn a row of houses to face away from it. */
  _placeRun(from, to) {
    const dx = to.x - from.x, dz = to.z - from.z;
    const len = Math.hypot(dx, dz);
    const step = Math.max(2, this.spacing);
    if (len < step * 0.5) {
      this._status('too short for a run — tap further away, or lower SPACING');
      return;
    }
    const n = Math.floor(len / step) + 1;
    if (n > 120) { this._status('that run is too long — raise SPACING'); return; }
    const ang = Math.atan2(dx, dz);          // world heading of the run
    const ux = dx / len, uz = dz / len;
    const nature = this.tool === 'nature';
    if (!nature && !this.preset) { this._status('pick a preset first'); return; }
    if (nature && !EDIT_PROP_KINDS[this.natureKind]) {
      this._status('pick a tree or a rock first'); return;
    }
    const made = [];
    this._act(`a run of ${n}`, () => {
      for (let i = 0; i < n; i++) {
        const d = i * step;
        const s = this._snapped({ x: from.x + ux * d, z: from.z + uz * d });
        const e = nature
          ? { kind: this.natureKind, x: s.x, z: s.z,
            rot: ang + (this._placeRot ?? 0), scale: this._placeScale ?? 1 }
          : { preset: this.preset, x: s.x, z: s.z,
            rot: ang + (this._placeRot ?? 0), scale: this._placeScale ?? 1 };
        (nature ? this.props : this.elements).push(e);
        made.push(e);
      }
    });
    // the run becomes the selection, so it can be nudged or turned as one
    const first = made[0];
    this.sel = { kind: 'mine', el: first, x: first.x, z: first.z,
      rot: first.rot, scale: first.scale, preset: first.preset || first.kind };
    this.also = made.slice(1);
    this._selMarkRefresh();
    this._status(`ran ${n} ${nature ? this.natureKind : this.preset} `
      + `${step} u apart over ${Math.round(len)} u — APPLY to build`);
  }

  /** Forget a half-made run. Anything that changes what the next tap means —
   *  switching tool, switching ONE/RUN, ESC, leaving — has to call this, or
   *  the next tap somewhere else completes a run you had abandoned. */
  _cancelRun() {
    if (!this._lineFrom) return;
    this._lineFrom = null;
    this._clearLineMark();
  }

  /** The anchor, while a run is half-made. Without it the first tap of a run
   *  looks exactly like a tap that did nothing. */
  _lineMark() {
    this._clearLineMark();
    if (!this._lineFrom) return;
    if (!this._lineGrp) {
      this._lineGrp = new THREE.Group();
      this._lineGrp.name = 'editor-line';
      this.game.scene.add(this._lineGrp);
    }
    const f = this._lineFrom;
    const y = this.game.track.terrainHeight(f.x, f.z) + this.delta.at(f.x, f.z);
    const g = new THREE.RingGeometry(3, 4.4, 20);
    g.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({
      color: 0xffe066, transparent: true, opacity: 0.95, depthTest: false }));
    m.position.set(f.x, y + 0.6, f.z);
    m.renderOrder = 1001;
    this._lineGrp.add(m);
  }

  _clearLineMark() {
    if (!this._lineGrp) return;
    for (const c of [...this._lineGrp.children]) {
      c.geometry.dispose(); c.material.dispose(); this._lineGrp.remove(c);
    }
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
  _ghost(e, kind = 'element') {
    if (!this._ghosts) {
      this._ghosts = new THREE.Group();
      this._ghosts.name = 'editor-ghosts';
      this.game.scene.add(this._ghosts);
    }
    const t = this.game.track;
    const nature = kind === 'prop';
    const color = nature ? 0x7dff9b : 0xffc14a;
    const lift = this.delta.at(e.x, e.z);
    const y = t.terrainHeight(e.x, e.z) + lift;

    // WHAT YOU PLACED, VISIBLE NOW.
    //
    // This used to be a yellow wireframe crate until APPLY, which told you a
    // building was coming but not what it looked like, how big it was, or
    // whether it fitted between the two you already had — and APPLY costs a
    // full world rebuild, so checking meant waiting. Reported exactly that
    // way: "what I build needs to be visible in real time, not after apply".
    //
    // So the real thing is drawn immediately, from the real template and the
    // real kit (Track.previewElement / previewProp). It is the same building
    // the rebuild will produce down to the weathering shade, because an
    // authored placement seeds its jitter from its own position.
    //
    // The preview costs a few draw calls each, which is the whole reason the
    // built world batches instead — so at APPLY these are thrown away and the
    // batched instance takes over. `built` is what marks that handover, and a
    // built object keeps only a flat footprint ring: enough to see what you
    // put there and to aim at, low enough that the house is what you look at.
    if (!e.built) {
      let g = null;
      try {
        g = nature ? t.previewProp(e.kind, e.x, e.z, e.rot || 0, e.scale || 1)
          : t.previewElement(e.preset, e.x, e.z, e.rot || 0, e.scale || 1);
      } catch { g = null; }
      if (g) {
        // the sculpt is previewed on the drawn ground but not yet in
        // terrainHeight, so lift the object by the pending dab as well
        if (lift) g.position.y += lift;
        g.userData.el = e;
        g.userData.kind = kind;
        g.userData.preview = true;
        this._ghosts.add(g);
        return;
      }
      // NO TEMPLATE, NO SILENCE. An unknown preset (a scene from a later
      // palette) still gets a marker, or it would look like the tap missed.
      const s = e.scale || 1;
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(6 * s, 7 * s, 6 * s),
        new THREE.MeshBasicMaterial({ color, wireframe: true }));
      box.position.set(e.x, y + 3.5 * s, e.z);
      box.rotation.y = e.rot || 0;
      box.userData.el = e;
      box.userData.kind = kind;
      this._ghosts.add(box);
      return;
    }
    const r = (nature ? 2.2 : 3.4) * (e.scale || 1);
    const m = new THREE.Mesh(new THREE.RingGeometry(r, r + 0.5, 20),
      new THREE.MeshBasicMaterial({ color, transparent: true,
        opacity: 0.55, depthWrite: false, side: THREE.DoubleSide }));
    m.rotation.x = -Math.PI / 2;
    m.position.set(e.x, y + 0.25, e.z);
    m.userData.el = e;
    m.userData.kind = kind;
    this._ghosts.add(m);
  }

  _clearGhosts() {
    if (!this._ghosts) return;
    for (const c of [...this._ghosts.children]) {
      // a preview is a Group of real meshes; a marker is a single mesh
      c.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) o.material.dispose();
      });
      this._ghosts.remove(c);
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
      for (const e of this.props) e.built = true;
      this._refreshMarkers();
      this._status(`APPLIED — ${this.delta.length} dabs, ${this.elements.length} objects, `
        + `${this.props.length} natural, ${this.erase.length} cleared, `
        + `${this.warp.length} road moves`);
      if (then) then();
    }, 30);
  }

  testDrive() {
    const go = () => { this._quietExit(); this.game.startRace?.(); };
    if (this.dirty) this.apply(go); else go();
  }

  /** TEST DRIVE is not leaving: it is going to look at the thing you just
   *  built and coming back. So it must not ask you whether you meant to. */
  _quietExit() {
    const d = this.dirty;
    this.dirty = false;
    this.exit();
    this.dirty = d;
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
            // one of MY objects that has already been through APPLY is real
            // geometry too — take it out of the world for the drag, or you
            // watch a marker slide away from a house that never moved
            if (el && el.built && !this._selHidden) {
              this._selHidden = this._hideAround(el.x, el.z, 7 * (el.scale || 1));
            }
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
        if (moved <= 8) this._tapAt(e.clientX, e.clientY, e.shiftKey);
      }
      if (this._drag) this._endRouteDrag();
      if (this._selDrag) {
        this._selDrag = false;
        const from = this._selDragFrom;
        const hid = this._selHidden;
        this._selDragFrom = null;
        this._selHidden = null;
        if (from && (from.el.x !== from.x || from.el.z !== from.z)) {
          // The drag already moved it, so there is no "before" left to
          // snapshot — but we know exactly where it started. Put it back for
          // the length of one snapshot and let the action move it again, and
          // the history entry is an honest pair instead of a closure holding
          // references that a later restore would invalidate.
          const dx = from.el.x - from.x, dz = from.el.z - from.z;
          const moved = [from.el, ...this.also];
          for (const q of moved) { q.x -= dx; q.z -= dz; }
          this._act(moved.length > 1 ? `moving ${moved.length} objects` : 'a move', () => {
            for (const q of moved) { q.x += dx; q.z += dz; }
          }, hid ? () => this._unhide(hid) : null);
          this._status(`moved ${moved.length > 1 ? `${moved.length} objects` : ''}`
            + ` — APPLY to build ${moved.length > 1 ? 'them' : 'it'} there`);
          this._syncInspector();
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

  /* --- keyboard ----------------------------------------------------------- */
  /** The combo an event spells, in the same vocabulary KEYS is written in:
   *  `mod` for ctrl-or-cmd, `shift` only when it is part of the binding rather
   *  than part of the character. Building the string and comparing it is the
   *  whole matcher — the alternative, a chain of `if (ev.ctrlKey && …)`, is
   *  where the two halves start to disagree about what `mod+shift+z` means. */
  static _combo(ev) {
    const mod = ev.ctrlKey || ev.metaKey;
    const key = String(ev.key).toLowerCase();
    // shift is only meaningful when it does not simply pick a different
    // character: '?' is shift+'/', and nobody writes that binding as shift+/
    const named = key.length > 1;
    return (mod ? 'mod+' : '') + (ev.shiftKey && (mod || named) ? 'shift+' : '') + key;
  }

  _bindKeys() {
    if (this._onKey) return;
    this._onKey = (ev) => {
      if (!this.active) return;
      const tgt = ev.target;
      // typing in a name field is typing, not a shortcut
      if (tgt && /^(INPUT|TEXTAREA|SELECT)$/.test(tgt.tagName) && tgt.type !== 'range') return;
      const want = WorldEditor._combo(ev);
      for (const [, rows] of KEYS) {
        for (const [combo, , what] of rows) {
          if (combo !== want) continue;
          ev.preventDefault();
          if (what.tool) this._pickTool(what.tool);
          else this._hotAct(what.act);
          return;
        }
      }
    };
    window.addEventListener('keydown', this._onKey);
  }

  _unbindKeys() {
    if (!this._onKey) return;
    window.removeEventListener('keydown', this._onKey);
    this._onKey = null;
  }

  _hotAct(act) {
    const S = this.sel;
    switch (act) {
      case 'undo': this._undo(); break;
      case 'redo': this._redoStep(); break;
      case 'apply': this.apply(); break;
      case 'drive': this.testDrive(); break;
      case 'save': this._saveFlow(); break;
      case 'scenes': this._openScenes(); break;
      case 'check': this._check(); break;
      case 'help': this._toggleHelp(); break;
      case 'del': this.deleteSelection(); break;
      case 'dup': this._duplicateSelection(); break;
      case 'radius-': this._setSlider('ed-radius', this.radius - 8); break;
      case 'radius+': this._setSlider('ed-radius', this.radius + 8); break;
      case 'force-': this._setSlider('ed-strength', this.strength - 1); break;
      case 'force+': this._setSlider('ed-strength', this.strength + 1); break;
      case 'nudge-x-': this._nudgeSelection(-1, 0); break;
      case 'nudge-x+': this._nudgeSelection(1, 0); break;
      case 'nudge-z-': this._nudgeSelection(0, -1); break;
      case 'nudge-z+': this._nudgeSelection(0, 1); break;
      case 'nudge-X-': this._nudgeSelection(-10, 0); break;
      case 'nudge-X+': this._nudgeSelection(10, 0); break;
      case 'nudge-Z-': this._nudgeSelection(0, -10); break;
      case 'nudge-Z+': this._nudgeSelection(0, 10); break;
      case 'rot-': this._turnSelection(-this._rotStep); break;
      case 'rot+': this._turnSelection(this._rotStep); break;
      case 'cam-top': this.pitch = 1.5; break;
      case 'cam-low': this.pitch = 0.28; break;
      case 'cam-home': this._camHome(); break;
      case 'cam-focus': this._focusSelection(); break;
      case 'esc':
        if (this._lineFrom) { this._cancelRun(); this._status('run cancelled'); }
        else if (!this.root.querySelector('#ed-modal').classList.contains('off')) this._closeModal();
        else if (S) { this._clearSelection(); this._syncInspector(); this._refreshMarkers(); }
        else this.exit();
        break;
      default: break;
    }
  }

  _setSlider(id, v) {
    const el = this.root.querySelector('#' + id);
    if (!el) return;
    el.value = String(Math.max(+el.min, Math.min(+el.max, v)));
    el.dispatchEvent(new Event('input'));
  }

  _camHome() {
    const c = this.game.track.center[0];
    this.target.set(c.x, c.y, c.z);
    this.dist = 220; this.yaw = 0.6; this.pitch = 0.85;
    this._status('camera back at the start line');
  }

  _focusSelection() {
    const p = this._selectionPos();
    if (!p) { this._status('nothing selected to frame'); return; }
    this.target.set(p.x, this.game.track.terrainHeight(p.x, p.z), p.z);
    this.dist = Math.max(60, Math.min(this.dist, 160));
    this._status('framed the selection');
  }

  /** One tap, one action — every click-once tool dispatches from here. */
  _tapAt(cx, cy, add = false) {
    const p = this._pick(cx, cy);
    if (!p) { this._status('tap the ground, not the sky'); return; }
    if (add && this.tool === 'select') { this._addToSelection(p); return; }
    if (this.lineMode && (this.tool === 'place' || this.tool === 'nature')) {
      this._lineTap(p);
      return;
    }
    if (this.tool === 'place') this._place(p);
    else if (this.tool === 'nature') this._natureAt(p);
    else if (this.tool === 'erase') this._eraseAt(p);
    else if (this.tool === 'clear') this._eraseWorldAt(p);
    else if (this.tool === 'road') this._roadAt(p);
    else if (this.tool === 'water') this._waterAt(p);
    else if (this.tool === 'rotate') this._rotateAt(p);
    else if (this.tool === 'widen') this._widenAt(p);
    else if (this.tool === 'select') this._selectAt(p);
    else if (this.tool === 'route') this._status('drag a marker on the road to move the line');
  }

  /* --- undo / redo -------------------------------------------------------- */
  /** The whole model, as a string. Small — a heavily edited scene is a few kB
   *  — and it includes the transient `built` flags, so undoing across an APPLY
   *  does not turn every finished house back into a placeholder crate. */
  _stateSnapshot() {
    return JSON.stringify({
      dabs: this.delta.dabs, elements: this.elements, props: this.props,
      erase: this.erase, waters: this.waters, warp: this.warp, widen: this.widen,
      roadFeat: this.roadFeat, theme: this.themeName, weather: this.weather,
    });
  }

  _stateRestore(s) {
    const d = JSON.parse(s);
    this.delta = new TerrainDelta(d.dabs || []);
    this.elements = d.elements || [];
    this.props = d.props || [];
    this.erase = d.erase || [];
    this.waters = d.waters || [];
    this.warp = d.warp || [];
    this.widen = d.widen || [];
    this.roadFeat = d.roadFeat || { tunnels: [], bridge: null, rivers: [] };
    this.themeName = d.theme || null;
    this.weather = d.weather || null;
    // A RESTORE INVALIDATES EVERY REFERENCE. The lists above are rebuilt from
    // JSON, so every object in them is new — and anything still holding the
    // old ones is holding corpses. `sel` was already dropped for that reason;
    // the group has to go with it, or an undo leaves `also` pointing at
    // objects that are in no list at all. Measured: after undoing a nudge, a
    // group DUPLICATE pushed its copies into `elements` because the stale
    // originals failed the `props.includes()` test, and the count it reported
    // was zero.
    this._clearSelection();
    this._syncControls();
  }

  /** Run a mutation as ONE undoable action. Every tool goes through here, so a
   *  new tool is undoable and redoable the moment it exists — there is no
   *  per-tool inverse to write and therefore none to get wrong.
   *
   *  `visualUndo` is the one thing a snapshot cannot carry. The selection
   *  tools blank instances in the BUILT world so a delete or a move is visible
   *  before APPLY, and that lives on the GPU, not in the model — so an action
   *  that hid something hands back the closure that puts it on screen again.
   *  It restores pixels only; the model is always the snapshot's job, which is
   *  what keeps the two from ever disagreeing about what the scene contains. */
  _act(label, fn, visualUndo = null) {
    this._flushSlider();
    const before = this._stateSnapshot();
    const r = fn();
    const after = this._stateSnapshot();
    const vis = visualUndo || (typeof r === 'function' ? r : null);
    if (before === after && !vis) return false;
    this._history.push({ label, before, after, vis });
    if (this._history.length > HISTORY_DEPTH) this._history.shift();
    this._redo.length = 0;
    this.dirty = true;
    this._refreshMarkers();
    this._syncInspector();
    this._saveDraft();
    return true;
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
    //    aiming at, and they carry their template already. Buildings AND
    //    plants: a hand-planted tree is as much "mine" as a hand-placed
    //    chapel, and it is the same drag, the same ROT and the same DELETE.
    //    (`preset` for a plant is its kind; both are what the panel names.)
    for (const e of this.elements.concat(this.props)) {
      const d = (e.x - p.x) ** 2 + (e.z - p.z) ** 2;
      if (d < bd) {
        bd = d;
        best = { kind: 'mine', el: e, x: e.x, z: e.z, rot: e.rot, scale: e.scale,
          preset: e.preset || e.kind };
      }
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
    // 4. and finally the parts of a scene that are not objects at all — a
    //    lake, a clear zone, a road pin. Last, so nothing above is affected.
    if (!best) best = this._selectNonObject(p);
    if (!best) {
      this._clearSelection();
      this._status('nothing here — tap an object');
      return;
    }
    this._clearSelection();
    this.sel = best;
    this._selMark();
    this._syncInspector();
    this._syncInspector();
    if (best.kind === 'water' || best.kind === 'zone' || best.kind === 'road') {
      this._status(`${this._selName()} selected — the panel on the right sets its numbers`);
      return;
    }
    const what = best.preset ? best.preset.toUpperCase() : (best.src?.mat || 'OBJECT').toUpperCase();
    this._status(best.kind === 'solid'
      ? `${what} selected — DELETE removes it (no template to move it by)`
      : `${what} selected — drag to move, ROT to turn, DELETE to remove`);
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
    // the rest of a shift-tapped group gets a plainer ring: enough to see what
    // is coming with you, quiet enough that the primary still reads as primary
    for (const q of this.also) {
      const qy = t.terrainHeight(q.x, q.z) + this.delta.at(q.x, q.z);
      const qr = Math.max(2.5, 3.4 * (q.scale ?? 1));
      const m = new THREE.Mesh(new THREE.RingGeometry(qr, qr + 0.5, 26),
        new THREE.MeshBasicMaterial({ color: 0x5ad7ff, transparent: true,
          opacity: 0.55, depthTest: false }));
      m.rotation.x = -Math.PI / 2;
      m.position.set(q.x, qy + 0.4, q.z);
      m.renderOrder = 1000;
      this._selGroup.add(m);
    }
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
    this.also = [];
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
    const el = { preset: s.preset, x: s.x, z: s.z, rot: s.rot ?? 0, scale: s.scale ?? 1 };
    // out of the built world NOW, and a marker in its place
    const hidden = this._hideAround(s.x, s.z, r);
    this._act('adopting a world object', () => {
      this.erase.push({ x: s.x, z: s.z, r });
      this.elements.push(el);
    }, () => this._unhide(hidden));
    this.sel = { ...s, kind: 'mine', el };
    return el;
  }

  /** DELETE the selection, visibly. */
  deleteSelection() {
    const s = this.sel;
    if (!s) { this._status('nothing selected'); return; }
    // a lake, a clear zone or a road pin is a line in the scene, not geometry
    // in a batch: nothing to blank, so it simply comes off the list
    if (s.kind === 'water' || s.kind === 'zone' || s.kind === 'road') {
      const name = this._selName();
      this._act(`deleting ${name}`, () => {
        if (s.kind === 'water') this.waters = this.waters.filter((w) => w !== s.ref);
        else if (s.kind === 'zone') this.erase = this.erase.filter((z) => z !== s.ref);
        else if (s.ref.what === 'bridge') this.roadFeat.bridge = null;
        else if (s.ref.what === 'tunnel') {
          this.roadFeat.tunnels = this.roadFeat.tunnels.filter((f) => f !== s.ref.f);
        } else this.roadFeat.rivers = this.roadFeat.rivers.filter((f) => f !== s.ref.f);
      });
      this._clearSelection();
      this._refreshMarkers();
      this._syncInspector();
      this._status(`deleted ${name} — APPLY to rebuild`);
      return;
    }
    if (s.kind === 'mine') {
      const el = s.el;
      // a placed object that has already been built is also in the world
      const hidden = el.built ? this._hideAround(el.x, el.z, 6 * (el.scale || 1)) : [];
      // whichever of my two lists it came out of — a plant is deleted by the
      // same button as a building, and filtering only `elements` left every
      // hand-planted tree undeletable. And the whole group, if there is one.
      const els = this._selGroupEls();
      for (const q of els) {
        if (q !== el && q.built) hidden.push(...this._hideAround(q.x, q.z, 6 * (q.scale || 1)));
      }
      this._act(els.length > 1 ? `deleting ${els.length} objects` : 'deleting an object', () => {
        this.elements = this.elements.filter((q) => !els.includes(q));
        this.props = this.props.filter((q) => !els.includes(q));
      }, hidden.length ? () => this._unhide(hidden) : null);
    } else {
      const r = Math.max(4, (s.r ?? 4) * 1.4);
      const hidden = this._hideAround(s.x, s.z, r);
      this._act('deleting a world object', () => {
        this.erase.push({ x: s.x, z: s.z, r });
      }, () => this._unhide(hidden));
    }
    this._clearSelection();
    this._refreshMarkers();
    this._status('DELETED — gone from the world now, permanent at APPLY');
    this._syncInspector();
  }

  /** Turn the selection by the ROT slider, live. */
  rotateSelection() {
    const s = this.sel;
    if (!s) { this._status('nothing selected'); return; }
    if (s.kind === 'solid') { this._status('this one has no template — it can only be deleted'); return; }
    const el = s.kind === 'world' ? this._adoptSelection() : s.el;
    if (!el) return;
    this._act('a rotation', () => {
      el.rot = (el.rot + this._rotStep) % (Math.PI * 2);
    });
    this.sel.rot = el.rot;
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
    // everything else in the group keeps its offset from the one under the
    // finger, so a village moves as a village and not into a heap
    const dx = p.x - el.x, dz = p.z - el.z;
    for (const q of this.also) { q.x += dx; q.z += dz; }
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
    this._act('a width change', () => {
      this.widen.push({ x: c.x, z: c.z, r: this.radius, w: want });
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
  /** THE OLD CONTRACT, STILL HONOURED.
   *
   *  `_push` recorded a hand-written inverse AFTER the change had happened,
   *  which is why it cannot produce a "before" snapshot the way `_act` does —
   *  by the time it is called, before is gone. Every call site in this file
   *  has been moved onto `_act`; this remains so that a tool written against
   *  the older shape still undoes rather than throwing, and it earns its keep
   *  by carrying an `after` snapshot so REDO works for it too.
   *
   *  The caveat, stated because it is the reason the call sites moved: an
   *  inverse closure holds direct references to model objects, and a snapshot
   *  restore replaces those objects wholesale. Undo runs newest-first, so a
   *  closure entry sitting under a snapshot entry can be handed stale objects.
   *  `_act` has no such failure mode. Prefer it. */
  _push(label, undo) {
    this._history.push({ label, undo, after: this._stateSnapshot() });
    if (this._history.length > HISTORY_DEPTH) this._history.shift();
    this._redo.length = 0;
    this.dirty = true;
  }

  /** Put back every instance any selection tool blanked. Used when undo or
   *  redo has moved the model somewhere the live blanking no longer describes:
   *  showing the world un-previewed is honest, and APPLY is the truth. */
  _unhideAll() {
    if (!this._hidden || !this._hidden.length) return;
    this._unhide([...this._hidden]);
    this._hidden = [];
  }

  /** A sculpt STROKE is one action, not forty. Dragging the brush lays a dab
   *  every frame; undoing them one at a time would take as long as painting.
   *  The "before" state is SYNTHESISED from `_strokeFrom` rather than captured
   *  at pointer-down, so a stroke driven straight through `_dab` (the tests do
   *  exactly that) is as undoable as one painted with a finger. */
  _endStroke() {
    const from = this._strokeFrom ?? this.delta.dabs.length;
    const n = this.delta.dabs.length - from;
    if (n <= 0) { this._strokeFrom = null; return; }
    const after = this._stateSnapshot();
    const pre = JSON.parse(after);
    pre.dabs = pre.dabs.slice(0, from);
    this._history.push({ label: `${n} dab${n > 1 ? 's' : ''}`,
      before: JSON.stringify(pre), after });
    if (this._history.length > HISTORY_DEPTH) this._history.shift();
    this._redo.length = 0;
    this._strokeFrom = null;
    this.dirty = true;
    this._saveDraft();
  }

  _undo() {
    this._flushSlider();
    const a = this._history.pop();
    if (!a) { this._status('nothing left to undo'); return; }
    this._redo.push(a);
    if (a.undo) {
      // legacy shape: the closure IS the inverse, and it restores the live
      // world as well as the model. Snapshot what it produced so REDO has a
      // "before" to come back from.
      a.undo();
      a.before = this._stateSnapshot();
    } else {
      this._stateRestore(a.before);
      if (a.vis) a.vis();          // and put back whatever was blanked on screen
    }
    this.dirty = true;
    this._refreshMarkers();
    this._syncInspector();
    this._saveDraft();
    this._status(`undid ${a.label} — ${this._history.length} step`
      + `${this._history.length === 1 ? '' : 's'} left, ${this._redo.length} to redo`);
  }

  _redoStep() {
    this._flushSlider();
    const a = this._redo.pop();
    if (!a) { this._status('nothing to redo'); return; }
    this._history.push(a);
    this._stateRestore(a.after);
    // A redone delete or move cannot replay its live blanking — the instance
    // indices belonged to the world as it stood before the undo. The model is
    // right, the picture catches up at APPLY, and leaving the world UNhidden
    // is the honest half-state: it shows more than the scene has, never less.
    if (a.vis || a.undo) this._unhideAll();
    this.dirty = true;
    this._refreshMarkers();
    this._syncInspector();
    this._saveDraft();
    this._status(`redid ${a.label} — ${this._redo.length} left to redo`);
  }

  /** Redraw every marker from the current model. Cheaper to think about than
   *  patching each list's markers at each call site, and it means UNDO cannot
   *  leave a ghost behind for something that no longer exists. */
  _refreshMarkers() {
    this._clearGhosts();
    for (const e of this.elements) this._ghost(e, 'element');
    for (const e of this.props) this._ghost(e, 'prop');
    this._clearZoneMarks();
    for (const z of this.erase) this._zoneMark(z);
    for (const w of this.waters) this._waterMark(w);
    this._clearRoadMarks();
    const t = this.game.track;
    for (const f of this.roadFeat.tunnels) {
      this._roadMark(t.center[Math.round(f * t.center.length) % t.center.length], 0x9ad8ff, f);
    }
    if (this.roadFeat.bridge != null) {
      const i = Math.round(this.roadFeat.bridge * t.center.length) % t.center.length;
      this._roadMark(t.center[i], 0xffd24a, this.roadFeat.bridge);
    }
    for (const f of this.roadFeat.rivers) {
      this._roadMark(t.center[Math.round(f * t.center.length) % t.center.length], 0x54c8f0, f);
    }
    for (const w of this.widen) {
      this._widenMark(w, t.nearestIndex({ x: w.x, y: 0, z: w.z }));
    }
    this._routeMarks();
    // theirs APPENDS a ring and a box, so it has to be cleared first or every
    // refresh leaves another copy of the highlight stacked on the same object
    this._clearSelMarks();
    this._selMark();
    this._syncCounts();
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
    this._act('a clear zone', () => {
      this.erase.push({ x: p.x, z: p.z, r: this.radius });
    });
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
    m.userData.zone = z;
    this._zones.add(m);
  }

  /** A lake's own ring, so SELECT has something to hit and so the surface you
   *  are about to raise is visible before you raise it. */
  _waterMark(w) {
    if (!this._zones) {
      this._zones = new THREE.Group();
      this._zones.name = 'editor-zones';
      this.game.scene.add(this._zones);
    }
    const g = new THREE.RingGeometry(w.r * 0.96, w.r, 44);
    g.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({
      color: 0x39a8ff, transparent: true, opacity: 0.8, depthTest: false }));
    m.position.set(w.x, w.y + 0.15, w.z);
    m.renderOrder = 998;
    m.userData.water = w;
    this._zones.add(m);
  }

  _clearZoneMarks() {
    if (!this._zones) return;
    for (const c of [...this._zones.children]) {
      if (c.userData.roadMark !== undefined) continue;
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
   *  same guarantees every other sculpt gets.
   *
   *  The LEVEL is then yours: select the lake and raise or lower its surface,
   *  which is how you flood a valley rather than just puddle a field. */
  _waterAt(p) {
    if (!p) return;
    const t = this.game.track;
    const r = this.radius;
    const surf = t.terrainHeight(p.x, p.z) + this.delta.at(p.x, p.z);
    // dig first: a bowl about a fifth as deep as it is wide, floored so a
    // huge brush does not punch a well through the world
    const depth = Math.min(9, Math.max(3, r * 0.22));
    // ...then stand the water just under the original rim, so the bank shows
    const y = surf - 0.5;
    let sel = null;
    this._act('a lake', () => {
      this.delta.add({ x: p.x, z: p.z, r, dh: -depth, mode: 'water' });
      const near = this.waters.find((w) => Math.hypot(w.x - p.x, w.z - p.z) < w.r * 0.6);
      if (near) {
        near.r = Math.max(near.r, r); near.y = Math.min(near.y, y);
        sel = near;
      } else {
        const w = { x: p.x, z: p.z, r, y };
        this.waters.push(w);
        sel = w;
      }
      this.sel = { kind: 'water', ref: sel, x: sel.x, z: sel.z, r: sel.r };
    });
    this._status(`water: ${this.waters.length} ${this.waters.length === 1 ? 'lake' : 'lakes'}`
      + ` — ${depth.toFixed(1)} u deep, APPLY to fill. SELECT it to set the level`);
  }

  /** Where a sited road feature will be cut. Lives with the zone marks so it
   *  is cleared and rebuilt on the same schedule. */
  _roadMark(c, color, frac = null) {
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
    m.userData.frac = frac;
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
      this._act('a river crossing', () => { this.roadFeat.rivers.push(f); });
      const moved = Math.round(t._circDist(site, i) * t.segLen);
      this._status(`river crossing at ${(f * 100) | 0}% of the lap`
        + (moved > 6 ? ` (${moved} u along, to a legal crossing)` : '')
        + ` — ${this.roadFeat.rivers.length} total. One river threads them all; `
        + 'APPLY to cut it');
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
      this._act('a tunnel', () => { this.roadFeat.tunnels.push(f); });
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
      this._act('the bridge', () => { this.roadFeat.bridge = f; });
      const moved = Math.round(t._circDist(site, i) * t.segLen);
      this._status(`bridge over a new gorge at ${(f * 100) | 0}% of the lap`
        + (moved > 6 ? ` (${moved} u clear of the start line)` : '')
        + ' — APPLY to carve and span it');
    }
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
    if (!this.game.track) return;      // the editor can be built before a world is
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
    this._act('a road move', () => { this.warp.push(w); });
    this._status(`road pulled ${Math.round(moved)} u over ${Math.round(w.r)} u of lap `
      + `(${this.warp.length} move${this.warp.length > 1 ? 's' : ''}) — APPLY to rebuild it`);
  }

  /* --- selection extras --------------------------------------------------- */
  /** The SELECT tool picks OBJECTS — see `_selectAt` above, which is the
   *  primary path and the one that can take a world-built structure out of the
   *  batch and hand it to you. This is the rest of the scene: a lake, a clear
   *  zone, a road pin. They have no instances to blank and no template to
   *  re-place, so they cannot go down that path — but they are the parts of a
   *  scene most in need of exact numbers, which is what the inspector gives
   *  them. Consulted only when no object was near the tap, so the object case
   *  is never made worse by it. */
  _selectNonObject(p) {
    let best = null, bd = Infinity;
    const consider = (kind, ref, x, z, reach) => {
      const d = Math.hypot(x - p.x, z - p.z);
      if (d < reach && d < bd) { bd = d; best = { kind, ref, x, z, r: reach }; }
    };
    for (const w of this.waters) consider('water', w, w.x, w.z, w.r);
    for (const z of this.erase) consider('zone', z, z.x, z.z, z.r);
    const t = this.game.track, n = t.center.length;
    const pin = (f, what) => {
      const c = t.center[Math.round(f * n) % n];
      consider('road', { f, what }, c.x, c.z, 26);
    };
    for (const f of this.roadFeat.tunnels) pin(f, 'tunnel');
    for (const f of this.roadFeat.rivers) pin(f, 'river');
    if (this.roadFeat.bridge != null) pin(this.roadFeat.bridge, 'bridge');
    return best;
  }

  /** What the status line and the inspector call the current selection. */
  _selName() {
    const s = this.sel;
    if (!s) return 'nothing';
    if (s.kind === 'water') return 'a lake';
    if (s.kind === 'zone') return 'a clear zone';
    if (s.kind === 'road') return `the ${s.ref.what}`;
    if (s.preset) return s.preset;
    return (s.src && s.src.mat) || 'an object';
  }

  /** DUPLICATE. A row of six identical cottages is six taps of this and six
   *  drags, not six trips back to the palette to line up ROT and SCALE again. */
  _duplicateSelection() {
    const els = this._selGroupEls();
    if (!els.length) { this._status('DUPLICATE works on objects you have placed'); return; }
    const copies = [];
    this._act(els.length > 1 ? `${els.length} duplicates` : 'a duplicate', () => {
      for (const el of els) {
        const copy = { ...el, x: el.x + 12, z: el.z + 12, built: false };
        (this.props.includes(el) ? this.props : this.elements).push(copy);
        copies.push(copy);
      }
    });
    // the copies become the selection, so the next drag moves what you just
    // made rather than the thing you copied it from
    const first = copies[0];
    this.sel = { kind: 'mine', el: first, x: first.x, z: first.z,
      rot: first.rot, scale: first.scale, preset: first.preset || first.kind };
    this.also = copies.slice(1);
    this._selMarkRefresh();
    this._status(copies.length > 1
      ? `duplicated ${copies.length} objects — drag them where you want them`
      : `duplicated ${this._selName()} — drag it where you want it`);
  }

  /** Turn the selection by an exact amount (the , and . keys). Their ROTATE
   *  button steps by `_rotStep`; this is the same edit from the keyboard, and
   *  it works on a plant as well as a building. */
  _turnSelection(by) {
    const s = this.sel;
    if (s && s.kind === 'world') this._adoptSelection();
    const els = this._selGroupEls();
    if (!els.length) { this._status('nothing turnable selected'); return; }
    this._act('a rotation', () => {
      for (const el of els) el.rot = (el.rot || 0) + by;
    });
    const el = els[0];
    this.sel = { ...this.sel, kind: 'mine', el, rot: el.rot };
    this._selMarkRefresh();
    this._status(els.length > 1
      ? `turned ${els.length} objects by ${Math.round(by * 180 / Math.PI)}° — APPLY`
      : `turned to ${Math.round((el.rot * 180 / Math.PI) % 360)}° — APPLY`);
  }

  /** Redraw the highlight where the selection now is. */
  _selMarkRefresh() { this._clearSelMarks(); this._selMark(); this._syncInspector(); }

  /** Every object the current selection covers — the primary plus anything
   *  shift-tapped onto it. Only objects I own can be in a group: a world
   *  solid has no template, so there is nothing to move it BY. */
  _selGroupEls() {
    const out = [];
    if (this.sel && this.sel.kind === 'mine' && this.sel.el) out.push(this.sel.el);
    for (const e of this.also) if (!out.includes(e)) out.push(e);
    return out;
  }

  /** Add to (or take out of) the group. Shift-tap, the way every editor
   *  since the first one has spelled it. */
  _addToSelection(p) {
    let best = null, bd = Infinity;
    for (const e of this.elements.concat(this.props)) {
      const d = Math.hypot(e.x - p.x, e.z - p.z);
      if (d < bd && d < Math.max(14, this.radius)) { bd = d; best = e; }
    }
    if (!best) { this._status('nothing of yours there to add'); return; }
    if (this.sel && this.sel.el === best) { this._status('that one is already the selection'); return; }
    const at = this.also.indexOf(best);
    if (at >= 0) this.also.splice(at, 1);
    else if (!this.sel) {
      this.sel = { kind: 'mine', el: best, x: best.x, z: best.z,
        rot: best.rot, scale: best.scale, preset: best.preset || best.kind };
    } else this.also.push(best);
    this._selMarkRefresh();
    const n = this._selGroupEls().length;
    this._status(`${n} object${n === 1 ? '' : 's'} selected — move, turn, duplicate or delete them together`);
  }

  /** NUDGE. A drag is how you place something; arrow keys are how you get it
   *  exactly right afterwards, which a mouse cannot do at any zoom. */
  _nudgeSelection(dx, dz) {
    const els = this._selGroupEls();
    if (!els.length) { this._status('nothing selected to nudge'); return; }
    this._act('a nudge', () => {
      for (const e of els) { e.x += dx; e.z += dz; }
    });
    if (this.sel && this.sel.el) { this.sel.x = this.sel.el.x; this.sel.z = this.sel.el.z; }
    this._selMarkRefresh();
    const step = Math.round(Math.hypot(dx, dz));
    this._status(`nudged ${els.length > 1 ? `${els.length} objects` : this._selName()}`
      + ` ${step} u — APPLY to rebuild`);
  }

  /** Where the selection sits, for the camera and the inspector. */
  _selectionPos() {
    const s = this.sel;
    return s ? { x: s.x, z: s.z } : null;
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
    const near = (e) => Math.hypot(e.x - p.x, e.z - p.z) <= this.radius;
    const gone = this.elements.filter(near).length + this.props.filter(near).length;
    if (gone) {
      this._act(`erase of ${gone} object${gone > 1 ? 's' : ''}`, () => {
        this.elements = this.elements.filter((e) => !near(e));
        this.props = this.props.filter((e) => !near(e));
        this.sel = null;
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
    for (const e of this.elements.concat(this.props)) {
      const d = Math.hypot(e.x - p.x, e.z - p.z);
      if (d < bd) { bd = d; best = e; }
    }
    if (!best || bd > Math.max(14, this.radius)) {
      this._status('no object of yours near that tap — place one first');
      return;
    }
    this._act('a rotation', () => { best.rot = (best.rot || 0) + this._rotStep; });
    this._status(`turned ${best.preset || best.kind} to `
      + `${Math.round((best.rot * 180 / Math.PI) % 360)}° — APPLY to rebuild it`);
  }

  /* --- validation --------------------------------------------------------- */
  /** CHECK. Every rule the world has to satisfy is enforced by the builder, so
   *  a scene cannot be *broken* — but it can very easily be DISAPPOINTING in
   *  ways that only show up once you are driving it: a chapel standing in the
   *  carriageway, a lake whose surface is above the road it drowns, a clear
   *  zone that swallowed the start line's own scenery.
   *
   *  This is the pass that says so before you find out at 140 km/h. It reports;
   *  it never edits. See SCENE-RULES.md for the laws it is checking against. */
  _check() {
    const t = this.game.track;
    const out = [];
    const onRoad = (x, z, pad) => t._distToTrack(x, z) < (ROAD_HALF + pad);
    let inRoad = 0;
    for (const e of this.elements) if (onRoad(e.x, e.z, 3 * (e.scale || 1))) inRoad++;
    if (inRoad) {
      out.push(`${inRoad} placed building${inRoad > 1 ? 's are' : ' is'} on or over the `
        + 'carriageway — the car will hit them at racing speed');
    }
    let propsIn = 0;
    for (const e of this.props) if (onRoad(e.x, e.z, 1.5 * (e.scale || 1))) propsIn++;
    if (propsIn) out.push(`${propsIn} plant${propsIn > 1 ? 's are' : ' is'} in the road`);

    for (const w of this.waters) {
      const V = new THREE.Vector3(w.x, 0, w.z);
      const i = t.nearestIndex(V);
      const c = t.center[i];
      if (Math.hypot(c.x - w.x, c.z - w.z) < w.r && c.y < w.y) {
        out.push(`a lake at ${Math.round(w.x)}, ${Math.round(w.z)} stands `
          + `${(w.y - c.y).toFixed(1)} u above the road it covers — lower it or move it`);
      }
    }
    for (const z of this.erase) {
      if (Math.hypot(z.x - t.center[0].x, z.z - t.center[0].z) < z.r) {
        out.push('a clear zone covers the start line — the grid dressing goes with it');
      }
    }
    const steep = this.delta.dabs.filter((d) => Math.abs(d.dh) / Math.max(1, d.r) > 0.9);
    if (steep.length) {
      out.push(`${steep.length} sculpt dab${steep.length > 1 ? 's are' : ' is'} steeper than `
        + 'the ground can hold — expect a cliff face, not a hill');
    }
    const bytes = JSON.stringify(this.serialize()).length;
    if (bytes > 120000) {
      out.push(`this scene is ${(bytes / 1024) | 0} kB — large enough that saving it may `
        + 'not fit beside your career data');
    }
    // WIDEN is stated in world space and resolved against whatever centreline
    // the rebuild produces, so a stroke placed before a MOVE ROAD can end up
    // pulling on a stretch of lap that is no longer under it.
    const orphanWiden = this.widen.filter((w) => {
      const i = t.nearestIndex({ x: w.x, y: 0, z: w.z });
      const c = t.center[i];
      return Math.hypot(c.x - w.x, c.z - w.z) > w.r;
    });
    if (orphanWiden.length) {
      out.push(`${orphanWiden.length} width change${orphanWiden.length > 1 ? 's are' : ' is'} no `
        + 'longer near the road — the lap moved out from under them');
    }
    if (this.roadFeat.tunnels.length > 4) {
      out.push(`${this.roadFeat.tunnels.length} tunnels on one lap — the builder will drop `
        + 'any that cannot keep their separation');
    }
    this._showModal('CHECK', out.length
      ? `<p class="ed-warn">${out.length} thing${out.length > 1 ? 's' : ''} worth `
        + `looking at:</p><ul>${out.map((s) => `<li>${s}</li>`).join('')}</ul>`
        + `<p class="ed-note">Scene size ${(bytes / 1024).toFixed(1)} kB.</p>`
      : '<p class="ed-good">Nothing to report. Nothing is standing in the road, no water '
        + 'is above the road it covers, and the scene is a comfortable size.</p>'
        + `<p class="ed-note">Scene size ${(bytes / 1024).toFixed(1)} kB.</p>`);
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
    if (this.props.length) rows.push([`${this.props.length}`, 'trees and rocks planted']);
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
  _buildDOM() {
    const root = document.createElement('div');
    root.id = 'editor-ui';
    root.className = 'off';
    const tool = (t, label) => `<button class="ed-tool" data-tool="${t}">${label}</button>`;
    root.innerHTML = `
      <div id="ed-top">
        <button class="ed-btn" data-act="exit">✕ EXIT</button>
        <span id="ed-status">EDITOR</span>
        <span id="ed-counts"></span>
        <button class="ed-btn" data-act="undo" title="ctrl+Z">↶</button>
        <button class="ed-btn" data-act="redo" title="ctrl+shift+Z">↷</button>
        <button class="ed-btn ed-go" data-act="apply">APPLY</button>
        <button class="ed-btn" data-act="drive">TEST DRIVE</button>
      </div>
      <div id="ed-tools">
        <div class="ed-tgroup">SCULPT</div>
        <button class="ed-tool current" data-tool="raise">RAISE</button>
        ${tool('lower', 'LOWER')}${tool('smooth', 'SMOOTH')}
        ${tool('flatten', 'FLATTEN')}${tool('noise', 'NOISE')}
        <div class="ed-tgroup">BUILD</div>
        ${tool('place', 'PLACE')}${tool('nature', 'NATURE')}
        <div id="ed-linesub"><div id="ed-linerow">
          <button class="ed-mini current" data-line="one">ONE</button>
          <button class="ed-mini" data-line="run">RUN</button>
        </div><div class="ed-hint">RUN: tap each end. SPACING sets the gap</div></div>
        ${tool('water', 'WATER')}
        ${tool('road', 'ROAD')}
        <div id="ed-roadsub"><div id="ed-roadrow">
          <button class="ed-mini current" data-road="tunnel">TUNNEL</button>
          <button class="ed-mini" data-road="bridge">BRIDGE</button>
          <button class="ed-mini" data-road="river">RIVER</button>
        </div><div class="ed-hint">then tap the road</div></div>
        ${tool('route', 'MOVE ROAD')}
        ${tool('widen', 'WIDEN')}
        <div id="ed-widensub"><div id="ed-widenrow">
          <button class="ed-mini current" data-widen="wide">WIDER</button>
          <button class="ed-mini" data-widen="narrow">NARROWER</button>
        </div><div class="ed-hint">FORCE = metres per tap</div></div>
        <div class="ed-tgroup">EDIT</div>
        ${tool('select', 'SELECT')}
        ${tool('erase', 'ERASE')}${tool('clear', 'CLEAR AREA')}
        ${tool('orbit', 'ORBIT')}
      </div>
      <div id="ed-right">
      <div id="ed-sliders">
        <label>SIZE <input id="ed-radius" type="range" min="8" max="180" value="40"><b id="ed-radius-v">40</b></label>
        <label>FORCE <input id="ed-strength" type="range" min="1" max="20" value="3"><b id="ed-strength-v">3</b></label>
        <label>EDGE <input id="ed-hard" type="range" min="0" max="100" step="5" value="0"><b id="ed-hard-v">SOFT</b></label>
        <label>ROT <input id="ed-rot" type="range" min="0" max="345" step="15" value="0"><b id="ed-rot-v">0°</b></label>
        <label>SCALE <input id="ed-scale" type="range" min="50" max="220" step="5" value="100"><b id="ed-scale-v">1.0</b></label>
        <label>COUNT <input id="ed-count" type="range" min="1" max="40" value="1"><b id="ed-count-v">1</b></label>
        <label>SPACING <input id="ed-spacing" type="range" min="4" max="90" step="2" value="20"><b id="ed-spacing-v">20</b></label>
        <label>SNAP <input id="ed-snap" type="range" min="0" max="20" step="1" value="0"><b id="ed-snap-v">OFF</b></label>
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
      <div id="ed-inspect" class="off">
        <div class="ed-pgroup">SELECTION <span id="ed-insp-name"></span></div>
        <div id="ed-insp-body"></div>
        <div class="ed-insprow">
          <button class="ed-mini" data-act="turn">ROTATE</button>
          <button class="ed-mini" data-act="dup">DUPLICATE</button>
          <button class="ed-mini ed-danger" data-act="del">DELETE</button>
        </div>
      </div>
      </div>
      <div id="ed-palette"></div>
      <div id="ed-nature"></div>
      <div id="ed-bottom">
        <button class="ed-btn" data-act="save">SAVE</button>
        <button class="ed-btn" data-act="scenes">SCENES</button>
        <button class="ed-btn" data-act="check">CHECK</button>
        <button class="ed-btn" data-act="help">?</button>
        <button class="ed-btn" data-act="clear">CLEAR ALL</button>
      </div>
      <div id="ed-modal" class="off"><div id="ed-modal-card">
        <div id="ed-modal-head"><span id="ed-modal-title"></span>
          <button class="ed-btn" data-act="modal-close">✕</button></div>
        <div id="ed-modal-body"></div>
      </div></div>`;
    document.body.appendChild(root);
    this.root = root;
    this.statusEl = root.querySelector('#ed-status');

    root.addEventListener('click', (e) => {
      const t = e.target.closest('[data-tool]');
      if (t) { this._pickTool(t.dataset.tool); return; }
      const a = e.target.closest('[data-act]');
      if (!a) return;
      const act = a.dataset.act;
      if (act === 'exit') this.exit();
      else if (act === 'apply') this.apply();
      else if (act === 'drive') this.testDrive();
      else if (act === 'undo') this._undo();
      else if (act === 'redo') this._redoStep();
      else if (act === 'clear') this._clearAll();
      else if (act === 'save') this._saveFlow();
      else if (act === 'scenes') this._openScenes();
      else if (act === 'check') this._check();
      else if (act === 'help') this._toggleHelp();
      else if (act === 'del') this.deleteSelection();
      else if (act === 'turn') this.rotateSelection();
      else if (act === 'dup') this._duplicateSelection();
      else if (act === 'modal-close') this._closeModal();
    });

    // world recipe: another world's look, and the weather over it
    const th = root.querySelector('#ed-theme');
    th.innerHTML = THEME_MENU.map(([v, l]) => `<option value="${v}">${l}</option>`).join('');
    th.addEventListener('change', () => {
      this._act('the look', () => { this.themeName = th.value || null; });
      this._status(this.themeName ? `look: ${th.options[th.selectedIndex].text} — APPLY` : 'look: as built');
    });
    const wx = root.querySelector('#ed-weather');
    wx.innerHTML = WEATHER_ORDER.map((k) => `<option value="${k}">${k.toUpperCase()}</option>`).join('');
    wx.addEventListener('change', () => {
      this._act('the sky', () => { this.weather = wx.value; });
      this._status(`sky: ${wx.value.toUpperCase()} — APPLY`);
    });
    root.querySelector('#ed-linerow').addEventListener('click', (e) => {
      const b = e.target.closest('[data-line]');
      if (!b) return;
      this.lineMode = b.dataset.line === 'run';
      root.querySelectorAll('#ed-linerow .ed-mini').forEach((x) => x.classList.toggle('current', x === b));
      this._cancelRun();
      this._status(this.lineMode
        ? `RUN — tap each end of the line. SPACING ${this.spacing} u`
        : 'ONE — a tap places a single object');
    });
    this.roadMode = 'tunnel';
    root.querySelector('#ed-roadrow').addEventListener('click', (e) => {
      const b = e.target.closest('[data-road]');
      if (!b) return;
      this.roadMode = b.dataset.road;
      root.querySelectorAll('#ed-roadrow .ed-mini').forEach((x) => x.classList.toggle('current', x === b));
    });
    this.narrowMode = false;
    root.querySelector('#ed-widenrow').addEventListener('click', (e) => {
      const b = e.target.closest('[data-widen]');
      if (!b) return;
      this.narrowMode = b.dataset.widen === 'narrow';
      root.querySelectorAll('#ed-widenrow .ed-mini').forEach((x) => x.classList.toggle('current', x === b));
    });

    const bind = (id, out, fn) => {
      const el = root.querySelector('#' + id);
      el.addEventListener('input', () => {
        root.querySelector('#' + out).textContent = fn(+el.value);
      });
      return el;
    };
    bind('ed-radius', 'ed-radius-v', (v) => { this.radius = v; return String(v); });
    bind('ed-strength', 'ed-strength-v', (v) => {
      this.strength = v;
      // FORCE is metres of half-width for WIDEN, capped so one tap cannot
      // jump the road from a lane to a runway
      this._widenStep = Math.max(1, Math.min(8, v));
      return String(v);
    });
    bind('ed-hard', 'ed-hard-v', (v) => {
      this.hardness = v;
      return v === 0 ? 'SOFT' : v === 100 ? 'HARD' : `${v}%`;
    });
    // ROT and SCALE finally write the two fields `_place` has always read.
    // They were declared, defaulted and never assigned, so every building the
    // editor placed faced the same way at the same size. They now also drive
    // the SELECTION, so an object already down can be aimed exactly.
    bind('ed-rot', 'ed-rot-v', (v) => {
      this._placeRot = v * Math.PI / 180;
      this._applyToSelection('rot', this._placeRot);
      return `${v}°`;
    });
    bind('ed-scale', 'ed-scale-v', (v) => {
      this._placeScale = v / 100;
      this._applyToSelection('scale', this._placeScale);
      return this._placeScale.toFixed(2);
    });
    bind('ed-count', 'ed-count-v', (v) => { this.natureCount = v; return String(v); });
    bind('ed-spacing', 'ed-spacing-v', (v) => { this.spacing = v; return `${v} u`; });
    bind('ed-snap', 'ed-snap-v', (v) => { this.snap = v; return v ? `${v} u` : 'OFF'; });
    this._pickTool('raise');
  }

  /** Selecting a tool is one place, not three: the keyboard, the toolbar and
   *  the palette all come through here, so the button highlight, the palette
   *  visibility, the road sub-row and the route handles can never disagree. */
  _pickTool(t) {
    this.tool = t;
    const root = this.root;
    root.querySelectorAll('.ed-tool').forEach((b) => b.classList.toggle('current', b.dataset.tool === t));
    root.querySelector('#ed-palette').classList.toggle('open', t === 'place');
    root.querySelector('#ed-nature').classList.toggle('open', t === 'nature');
    // TUNNEL / BRIDGE sat in the WORLD RECIPE panel on the far side of the
    // screen from the ROAD tool that uses them, so which one was armed —
    // and that you had to arm one at all — was anyone's guess. It now lives
    // under the ROAD button and only exists while ROAD is the live tool.
    root.querySelector('#ed-roadsub').classList.toggle('open', t === 'road');
    // WIDEN and SELECT carry the same kind of sub-choice, under the same rule
    root.querySelector('#ed-widensub').classList.toggle('open', t === 'widen');
    root.querySelector('#ed-linesub').classList.toggle('open', t === 'place' || t === 'nature');
    // a half-made run belongs to the tool that started it
    this._cancelRun();
    // a selection belongs to the SELECT tool: leaving it live under a brush
    // means the next DELETE key removes something you can no longer see picked
    if (t !== 'select') this._clearSelection();
    this._syncInspector();
    this._syncInspector();
    // the road handles only exist while you are moving the road
    this._routeMarks();
    this._status(HINT[t] || t.toUpperCase());
  }

  /** Push the ROT / SCALE sliders straight onto whatever is selected. Without
   *  this the sliders only ever aimed the NEXT object, so an object already
   *  placed could be turned in 22.5° steps and never resized at all. */
  _applyToSelection(field, value) {
    const S = this.sel;
    const el = S && S.kind === 'mine' ? S.el : null;
    if (!el || el[field] === value) return;
    // A slider drag fires input a hundred times; one history entry, not a
    // hundred, so UNDO steps back over the whole adjustment.
    if (this._sliderAct !== el) {
      this._sliderBefore = this._stateSnapshot();
      this._sliderAct = el;
    }
    el[field] = value;
    S[field] = value;
    this._sliderField = field;
    this.dirty = true;
    clearTimeout(this._sliderTimer);
    this._sliderTimer = setTimeout(() => this._flushSlider(), 400);
    this._refreshMarkers();
  }

  /** Close an open slider adjustment into ONE history entry.
   *
   *  It has to be able to run early as well as on the timer: an UNDO pressed
   *  inside the 400 ms window would otherwise walk back one step, and then the
   *  timer would fire and push an entry whose "before" is a state the scene
   *  has already left — an undo stack with a lie in the middle of it. */
  _flushSlider() {
    clearTimeout(this._sliderTimer);
    if (!this._sliderBefore) return;
    const after = this._stateSnapshot();
    if (this._sliderBefore !== after) {
      this._history.push({ label: `a ${this._sliderField} change`,
        before: this._sliderBefore, after });
      this._redo.length = 0;
      this._saveDraft();
    }
    this._sliderAct = null; this._sliderBefore = null;
  }

  /** Give back everything this editor put in the world and on the page. The
   *  game keeps one editor for its whole life, but a test — or any caller that
   *  builds a throwaway one to inspect a scene — must be able to leave no
   *  duplicate `#editor-ui` behind and no orphan marker group in the scene. */
  dispose() {
    this._unbindPointer();
    this._unbindKeys();
    for (const grp of [this._ghosts, this._zones, this._routeGrp, this._selGroup, this._lineGrp]) {
      if (!grp) continue;
      // walk it: a live preview is a GROUP of real meshes, not one mesh, and
      // assuming otherwise threw on the first scene that had one
      grp.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) o.material.dispose();
      });
      grp.parent?.remove(grp);
    }
    if (this.ring) {
      this.ring.geometry.dispose(); this.ring.material.dispose();
      this.ring.parent?.remove(this.ring);
      this.ring = null;
    }
    this._ghosts = this._zones = this._routeGrp = this._selGroup = this._lineGrp = null;
    this.root?.remove();
    this.active = false;
  }

  /** Mirror the model back into the controls. UNDO, REDO and LOAD all change
   *  the world recipe behind the panel's back; without this the dropdown went
   *  on claiming a look the scene no longer had. */
  _syncControls() {
    if (!this.root) return;
    const th = this.root.querySelector('#ed-theme');
    if (th) th.value = this.themeName || '';
    const wx = this.root.querySelector('#ed-weather');
    if (wx) wx.value = this.weather || 'clear';
    this._syncCounts();
  }

  _syncCounts() {
    const el = this.root && this.root.querySelector('#ed-counts');
    if (!el) return;
    const n = this.delta.length + this.elements.length + this.props.length
      + this.erase.length + this.waters.length + this.warp.length;
    el.textContent = n ? `${this.delta.length}◆ ${this.elements.length}⌂ `
      + `${this.props.length}⑂ ${this.waters.length}≈ ${this.warp.length}⤳`
      + (this.dirty ? '  PREVIEW' : '') : '';
  }

  /* --- inspector ---------------------------------------------------------- */
  _syncInspector() {
    const panel = this.root.querySelector('#ed-inspect');
    const S = this.sel;
    if (!S) { panel.classList.add('off'); return; }
    panel.classList.remove('off');
    this.root.querySelector('#ed-insp-name').textContent = this._selName().toUpperCase();
    const body = this.root.querySelector('#ed-insp-body');
    const row = (l, v) => `<div class="ed-krow"><span>${l}</span><b>${v}</b></div>`;
    let html = row('AT', `${Math.round(S.x)}, ${Math.round(S.z)}`);
    const el = S.kind === 'mine' ? S.el : null;
    if (el) {
      html += row('TURN', `${Math.round(((el.rot || 0) * 180 / Math.PI) % 360)}°`)
        + row('SCALE', (el.scale || 1).toFixed(2))
        + '<div class="ed-hint">Drag it on the ground to move it. '
        + 'ROT and SCALE on the right now aim THIS one.</div>';
      // put the sliders where the object already is, so a nudge is a nudge
      this._setSliderSilently('ed-rot', Math.round(((el.rot || 0) * 180 / Math.PI + 360) % 360));
      this._setSliderSilently('ed-scale', Math.round((el.scale || 1) * 100));
    } else if (S.kind === 'water') {
      html += row('LEVEL', S.ref.y.toFixed(1)) + row('RADIUS', Math.round(S.ref.r))
        + `<div class="ed-inspow">
             <button class="ed-mini" data-wat="-2">LOWER</button>
             <button class="ed-mini" data-wat="2">RAISE</button>
             <button class="ed-mini" data-wat="r-">SMALLER</button>
             <button class="ed-mini" data-wat="r+">WIDER</button>
           </div><div class="ed-hint">The bank is wherever the ground crosses this level.</div>`;
    } else if (S.kind === 'zone') {
      html += row('RADIUS', Math.round(S.ref.r))
        + `<div class="ed-inspow">
             <button class="ed-mini" data-zon="-10">SMALLER</button>
             <button class="ed-mini" data-zon="10">WIDER</button>
           </div>`;
    } else if (S.kind === 'road') {
      html += row('LAP', `${(S.ref.f * 100) | 0}%`)
        + '<div class="ed-hint">Where it sits is chosen by the builder from where you '
        + 'tapped. DELETE it and tap again to move it.</div>';
    } else if (S.kind === 'world' || S.kind === 'solid') {
      html += '<div class="ed-hint">Built by the world. '
        + (S.kind === 'solid'
          ? 'It has no template, so it can only be removed.'
          : 'Drag or turn it and the editor takes it over.') + '</div>';
    }
    body.innerHTML = html;
    body.onclick = (ev) => {
      const w = ev.target.closest('[data-wat]');
      if (w && S.kind === 'water') {
        const v = w.dataset.wat;
        this._act('the water level', () => {
          if (v === 'r-') S.ref.r = Math.max(8, S.ref.r - 10);
          else if (v === 'r+') S.ref.r += 10;
          else S.ref.y += +v;
        });
        S.r = S.ref.r;
        this._status(`lake level ${S.ref.y.toFixed(1)}, radius ${Math.round(S.ref.r)}`
          + ' — APPLY to fill it');
        return;
      }
      const z = ev.target.closest('[data-zon]');
      if (z && S.kind === 'zone') {
        this._act('the clear zone', () => {
          S.ref.r = Math.max(10, S.ref.r + (+z.dataset.zon));
        });
        S.r = S.ref.r;
        this._status(`clear zone radius ${Math.round(S.ref.r)} — APPLY`);
      }
    };
  }

  /** Move a slider to where the selection already is, without firing the input
   *  handler back at the object it came from. The backing field moves with it:
   *  a slider that reads 90° must mean 90° for the NEXT thing placed too, or
   *  deselecting silently changes what the control does. */
  _setSliderSilently(id, v) {
    const el = this.root.querySelector('#' + id);
    if (!el) return;
    const clamped = Math.max(+el.min, Math.min(+el.max, v));
    el.value = String(clamped);
    const out = this.root.querySelector('#' + id + '-v');
    if (id === 'ed-scale') {
      this._placeScale = clamped / 100;
      if (out) out.textContent = this._placeScale.toFixed(2);
    } else {
      this._placeRot = clamped * Math.PI / 180;
      if (out) out.textContent = `${clamped}°`;
    }
  }

  /* --- palettes ----------------------------------------------------------- */
  _renderPalette() {
    const el = this.root.querySelector('#ed-palette');
    if (!el.dataset.built) {
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
        this._pickTool('place');
        this._status(`PLACE ${this.preset} — tap the ground`);
      });
    }
    const nat = this.root.querySelector('#ed-nature');
    if (nat.dataset.built) return;
    nat.dataset.built = '1';
    // FILTERED THROUGH THE BUILDER'S OWN TABLE. The palette cannot offer a
    // plant `_buildEditProps` does not know how to stamp, because it is built
    // from the intersection of the two lists.
    nat.innerHTML = '<div class="ed-pgroup">NATURE</div><div class="ed-pgrid">'
      + NATURE_PALETTE.filter(([k]) => EDIT_PROP_KINDS[k])
        .map(([k, label]) => `<button class="ed-preset ed-nat${k === this.natureKind ? ' current' : ''}"`
          + ` data-nat="${k}">${label}</button>`).join('')
      + '</div><div class="ed-hint">COUNT on the right scatters a whole copse '
      + 'across the brush in one tap.</div>';
    nat.addEventListener('click', (e) => {
      const b = e.target.closest('[data-nat]');
      if (!b) return;
      this.natureKind = b.dataset.nat;
      nat.querySelectorAll('.ed-nat').forEach((x) => x.classList.toggle('current', x === b));
      this._pickTool('nature');
      this._status(`NATURE ${this.natureKind} — tap the ground`);
    });
  }

  _clearAll() {
    if (!confirm('Clear all edits in this scene?')) return;
    this._act('clearing the scene', () => {
      this.delta = new TerrainDelta();
      this.elements = [];
      this.props = [];
      this.erase = [];
      this.themeName = null;
      this.weather = null;
      // sited features, not counts: lap fractions for the bores, one for a span
      this.roadFeat = { tunnels: [], bridge: null, rivers: [] };
      this.waters = [];
      this.warp = [];
      this.widen = [];
      this.sel = null;
    });
    this._status('cleared — APPLY to rebuild');
  }

  /* --- modal -------------------------------------------------------------- */
  _showModal(title, html) {
    const m = this.root.querySelector('#ed-modal');
    this.root.querySelector('#ed-modal-title').textContent = title;
    this.root.querySelector('#ed-modal-body').innerHTML = html;
    m.classList.remove('off');
    return this.root.querySelector('#ed-modal-body');
  }

  _closeModal() { this.root.querySelector('#ed-modal').classList.add('off'); }

  _toggleHelp() {
    const m = this.root.querySelector('#ed-modal');
    if (!m.classList.contains('off')
      && this.root.querySelector('#ed-modal-title').textContent === 'KEYS') {
      this._closeModal();
      return;
    }
    const html = KEYS.map(([g, rows]) => `<div class="ed-pgroup">${g}</div>`
      + rows.map(([k, label]) => `<div class="ed-krow"><span>${label}</span>`
        + `<b>${k.replace('mod', 'ctrl').toUpperCase()}</b></div>`).join('')).join('');
    this._showModal('KEYS', html);
  }

  /* --- saving, scenes and codes -------------------------------------------- */
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
    WorldEditor.clearDraft(this.game);
    this.game._renderLevelCards?.();
    this._status(`saved "${trimmed}" — it syncs with your profile`);
  }

  /** THE SCENE BROWSER. Save and load used to be `prompt()` — a text box you
   *  had to type a name into exactly, with no way to see what a scene was, how
   *  big it was, which world it sat on, or to rename, copy or delete one
   *  without leaving the editor. */
  _openScenes() {
    const all = WorldEditor.list(this.game);
    const names = Object.keys(all).sort();
    const rows = names.map((n) => {
      const d = all[n] || {};
      const lv = LEVELS.find((l) => l.id === d.base);
      const bits = [];
      if ((d.dabs || []).length) bits.push(`${d.dabs.length} dabs`);
      if ((d.elements || []).length) bits.push(`${d.elements.length} objects`);
      if ((d.props || []).length) bits.push(`${d.props.length} plants`);
      if ((d.waters || []).length) bits.push(`${d.waters.length} lakes`);
      if ((d.warp || []).length) bits.push(`${d.warp.length} road moves`);
      const kb = (JSON.stringify(d).length / 1024).toFixed(1);
      return `<div class="ed-scene" data-scene="${encodeURIComponent(n)}">
        <div class="ed-scene-h"><b>${esc(n)}</b><span>${kb} kB</span></div>
        <div class="ed-scene-s">${esc(lv ? lv.name : 'world ' + d.base)}
          ${d.theme ? ' · ' + esc(d.theme) : ''}${d.weather && d.weather !== 'clear' ? ' · ' + esc(d.weather) : ''}
          ${bits.length ? ' — ' + bits.join(', ') : ' — empty'}</div>
        <div class="ed-inspow">
          <button class="ed-mini" data-sact="load">LOAD</button>
          <button class="ed-mini" data-sact="copy">COPY CODE</button>
          <button class="ed-mini" data-sact="rename">RENAME</button>
          <button class="ed-mini" data-sact="dupe">DUPLICATE</button>
          <button class="ed-mini ed-danger" data-sact="del">DELETE</button>
        </div></div>`;
    }).join('');
    const body = this._showModal('SCENES',
      (rows || '<p class="ed-note">No saved scenes yet. Build something and press SAVE.</p>')
      + '<div class="ed-pgroup">MOVE A SCENE BETWEEN DEVICES</div>'
      + '<p class="ed-note">A CODE is the whole scene as text — copy it out of one device '
      + 'and paste it into another. It carries the base world with it.</p>'
      + '<div class="ed-inspow"><button class="ed-mini" data-sact="export-current">'
      + 'COPY THIS SCENE\'S CODE</button>'
      + '<button class="ed-mini" data-sact="import">PASTE A CODE</button></div>'
      + '<textarea id="ed-code" spellcheck="false" placeholder="scene code appears here, '
      + 'or paste one in and press PASTE A CODE"></textarea>');

    body.onclick = (ev) => {
      const b = ev.target.closest('[data-sact]');
      if (!b) return;
      const act = b.dataset.sact;
      const card = b.closest('[data-scene]');
      const name = card ? decodeURIComponent(card.dataset.scene) : null;
      const codeBox = body.querySelector('#ed-code');
      if (act === 'export-current') {
        codeBox.value = encodeCode(this.serialize());
        codeBox.select();
        navigator.clipboard?.writeText(codeBox.value).catch(() => {});
        this._status('scene code copied — paste it on the other device');
        return;
      }
      if (act === 'import') { this._importCode(codeBox.value); return; }
      if (!name) return;
      const all2 = WorldEditor.list(this.game);
      if (act === 'load') {
        this._closeModal();
        this._loadNamed(name, all2[name]);
      } else if (act === 'copy') {
        codeBox.value = encodeCode(all2[name]);
        codeBox.select();
        navigator.clipboard?.writeText(codeBox.value).catch(() => {});
        this._status(`code for "${name}" copied`);
      } else if (act === 'rename') {
        const to = (prompt('Rename to:', name) || '').trim();
        if (!to || to === name) return;
        if (all2[to] && !confirm(`"${to}" exists. Replace it?`)) return;
        WorldEditor.save(to, { ...all2[name], name: to }, this.game);
        WorldEditor.remove(name, this.game);
        if (this.sceneName === name) this.sceneName = to;
        this.game._renderLevelCards?.();
        this._openScenes();
      } else if (act === 'dupe') {
        let to = name + ' COPY', k = 2;
        while (all2[to]) to = `${name} COPY ${k++}`;
        WorldEditor.save(to, { ...all2[name], name: to }, this.game);
        this.game._renderLevelCards?.();
        this._openScenes();
      } else if (act === 'del') {
        if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
        WorldEditor.remove(name, this.game);
        this.game._renderLevelCards?.();
        this._openScenes();
      }
    };
  }

  _importCode(raw) {
    if (!raw || !raw.trim()) { this._status('paste a scene code into the box first'); return; }
    let data;
    try { data = decodeCode(raw); } catch { data = null; }
    if (!data || typeof data !== 'object' || !Number.isFinite(data.base)) {
      this._status('that is not a scene code — nothing was changed');
      return;
    }
    // The name is going into the track list, the browser card and the save
    // key, so it is trimmed to a line of ordinary text before any of that —
    // a code from another device is text, and text arrives however it likes.
    let name = String(data.name || 'IMPORTED SCENE')
      .replace(/[\r\n\t]+/g, ' ').trim().slice(0, 40) || 'IMPORTED SCENE';
    const all = WorldEditor.list(this.game);
    const stem = name;                       // the CLEANED name, not the raw one
    let k = 2;
    while (all[name]) name = `${stem} ${k++}`;
    data.name = name;
    WorldEditor.save(name, data, this.game);
    this.game._renderLevelCards?.();
    this._openScenes();
    this._status(`imported "${name}" — LOAD it to open it`);
  }

  _loadNamed(pick, data) {
    if (!data) { this._status('that scene is gone'); return; }
    const lv = LEVELS.find((l) => l.id === data.base);
    const swap = lv && (!this.game.level || this.game.level.id !== lv.id);
    this.load(data);
    this.sceneName = pick;
    if (swap) {
      // the edits travel with the request, never as ambient game state
      this.game.swapLevel(lv, true, this.buildPayload());
      this._tmCache = null;
      for (const e of this.elements) e.built = true;
      for (const e of this.props) e.built = true;
      this._refreshMarkers();
    } else {
      this.apply();
    }
    this._status(`loaded "${pick}"`);
  }
}
