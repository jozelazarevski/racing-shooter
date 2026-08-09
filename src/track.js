// The world BUILDER. One Track class turns a level's theme into a circuit,
// its terrain, its water, its structures and its scatter.
//
// What used to sit in this file, and now does not:
//   world/levels.js     the career roster            (pure data)
//   world/circuits.js   circuit control polygons     (pure data)
//   world/themes.js     per-theme art direction      (pure data)
//   world/catalog.js    props, houses, element kits  (data + asset builders)
//   world/constants.js  ROAD_HALF, RIM_RADIUS, tunnel bore
//   world/rng.js        the seeded-world generator
//   engine/dispose.js   generic three.js resource disposal
//
// Those modules know nothing about this one. The arrow points one way: data
// and engine utilities never import the builder.
import * as THREE from 'three';
import {
  roadTexture, wallTexture, groundTexture, buildingTexture, buildingGlowTexture,
  chevronTexture, checkerTexture,
  bannerTexture, hazardTexture, crowdTexture, awningTexture,
  finishBannerTexture, cliffTexture, puddleTexture, plankTexture,
  barrelTexture, riverTexture, riverBankTexture, iglooTexture,
  roadNeonEmissiveTexture,
  contactShadowTexture, stoneTexture, junctionTexture,
  townhouseTexture, townhouseGlowTexture,
} from './textures.js';

import { disposeSubtree } from './engine/dispose.js';
import { RIM_RADIUS, ROAD_HALF, TUNNEL_HW, TUNNEL_APEX, WALL_OFF, CENTER_SAMPLES }
  from './world/constants.js';
import { LEVELS } from './world/levels.js';
import { CIRCUITS } from './world/circuits.js';
import { THEMES } from './world/themes.js';
import {
  NARROW_TUNE, FORD_TUNE, VIZ_TUNE, SPONSORS, NEON_SPONSORS,
  PROP_SPECS, PROP_SCORE, PROP_PICKUPS, BARREL_PALETTES,
  HOUSE_TEMPLATES, COTTAGES, ELEMENT_KITS,
  THEME_CROSSROADS, ELEMENT_KIT_BY_THEME,
  gablePrismGeo, mergeBoxes, propAssets,
} from './world/catalog.js';
import { skyMethods } from './world/sky.js';
import { floraMethods } from './world/flora.js';

// Compatibility surface. `Track` is defined here; everything else below is
// re-exported from its new home so that existing importers of './track.js'
// keep working. New code should import from the module that owns the name.
export { disposeSubtree } from './engine/dispose.js';
export { RIM_RADIUS, ROAD_HALF, TUNNEL_HW, TUNNEL_APEX, WALL_OFF }
  from './world/constants.js';
export { LEVELS } from './world/levels.js';
export { circuitPoints } from './world/circuits.js';
export { HOUSE_TEMPLATES, COTTAGES } from './world/catalog.js';
export { seededRandom, seedForLevel, withSeed } from './world/rng.js';

const _clearV = new THREE.Vector3();   // scratch for _clearsRoad

/** Hermite ease on an already-normalised 0..1 ramp (clamps its own ends). */
const smoothstep01 = (t) => {
  const u = t <= 0 ? 0 : t >= 1 ? 1 : t;
  return u * u * (3 - 2 * u);
};

const N = CENTER_SAMPLES;   // centerline samples

const _m4 = new THREE.Matrix4(); // scratch (smashTree instance-zeroing)

export class Track {
  constructor(scene, level = LEVELS[0]) {
    this.scene = scene;
    this.level = level;
    // ---- THEME = the LOOK. ROUTE = the SHAPE. They used to be the same key,
    // which meant a new circuit cost a whole new art set and no two worlds could
    // share a palette. Real rally does not work that way — Monte Carlo and
    // Sweden are both snow-and-mountain and drive nothing alike.
    //
    // A level may now name a `route` (its control points) and a `tune` (per
    // level overrides layered over the theme: elevation, jump count, cliff
    // walls, gorge and bridge). Levels that name neither behave exactly as
    // before, so every existing world is untouched.
    const base = THEMES[level && level.theme] || THEMES.forest;
    const T = (level && level.tune) ? { ...base, ...level.tune } : base;
    this.T = T;
    // plain-number lighting/fog summary for main.js
    this.theme = {
      fogColor: T.fogColor, fogNear: T.fogNear, fogFar: T.fogFar,
      hemiSky: T.hemiSky, hemiGround: T.hemiGround, hemiIntensity: T.hemiIntensity,
      sunColor: T.sunColor, sunIntensity: T.sunIntensity,
      // compass bearing / height of the sun this level DRAWS in its sky — the
      // directional key is aimed from the same bearing so shadows point the way
      // the visible sun says they should
      sunAz: T.sunAz, sunEl: T.sunEl,
      skyTop: T.skyTop, skyHorizon: T.skyHorizon,
      // [hexA, hexB] debris chip colors for fence/cliff scrape particles
      splinter: T.splinter,
      // ambient weather particle recipe for this level: { type, color, rate? }
      weather: T.weather,
      // surface condition tag: 'snow' | 'wet' | undefined (dry)
      surface: T.surface,
      // hazard-system spec contract (data only — runtime systems live in the
      // game code): each is undefined on levels without that hazard.
      geysers: T.geysers,        // { count }
      fallHazard: T.fallHazard,  // { kind: 'rock'|'burningTree'|'icicle', period, dmg }
      chase: T.chase,            // { kind: 'avalanche' }
      strips: T.strips,          // { kind: 'flume'|'maglev', count }
      critters: T.critters,      // { kind: 'scorpion'|'rat', count }
    };
    // levels are self-contained: fog is set here (main.js may re-apply from theme)
    // AERIAL PERSPECTIVE STARTS CLOSER. Fog is the only depth cue that works
    // on every world, and it used to start ~320-520 u out - past most of what
    // the player looks at. Pulling the near plane in by a quarter layers the
    // mid-ground without touching the far limit. Computed LOCALLY - never
    // written back to T, because a theme object is shared across rebuilds and
    // a *= would compound every restart.
    const fogNear = Math.max(T.fogNear * 0.72, Math.min(T.fogNear, 190));
    scene.fog = new THREE.Fog(T.fogColor, fogNear, T.fogFar);

    // EVERYTHING the track builds goes in here, nothing straight into the
    // scene. That is what makes a level swappable without reloading the page:
    // one node to remove, one subtree to dispose. Adding to the scene direct
    // (52 call sites, once) left orphans behind on every rebuild.
    this.group = new THREE.Group();
    scene.add(this.group);

    const pts = CIRCUITS[(level && (level.route || level.theme))] || CIRCUITS.forest;
    this.curve = new THREE.CatmullRomCurve3(
      pts.map(([x, z]) => new THREE.Vector3(x, 0, z)),
      true, 'centripetal'
    );
    this.N = N;
    this.center = [];
    this.tan = [];
    this.nrm = []; // "left" normal (up × tangent)
    for (let i = 0; i < N; i++) {
      const t = i / N;
      const p = this.curve.getPointAt(t);
      const tg = this.curve.getTangentAt(t); tg.y = 0; tg.normalize();
      this.center.push(p);
      this.tan.push(tg);
      this.nrm.push(new THREE.Vector3(tg.z, 0, -tg.x));
    }
    // Elevation profile: the road climbs and descends over the lap (tan/nrm and
    // curvature stay XZ-based — heading math is unaffected by the y channel).
    for (let i = 0; i < N; i++) this.center[i].y = this._elevProfile(i);
    // A COAST ROAD RUNS ABOVE THE WATER.
    //
    // The elevation profile is written without any knowledge of the sea, and on
    // CINQUE TERRE it dipped the carriageway up to 2.9 u BELOW the waterline for
    // 70 of 225 sampled stations. The sea is a flat plane at coast.level drawn
    // over everything, so the racing line was simply submerged: the player
    // drives out along the seafront and ends up steering a car across open
    // water. Reported with a screenshot of exactly that.
    //
    // The road is the one thing in this world that is never allowed to be
    // wrong, so it wins: any station under the waterline is lifted to a
    // freeboard above it, and the profile is then relaxed so the lift arrives
    // as a rise in the road rather than a step in it. The relax is re-clamped
    // each pass, so smoothing can never push a station back under.
    if (T.coast) {
      const SEA = (T.coast.level ?? -2) + 1.6;
      let lifted = 0;
      for (let i = 0; i < N; i++) {
        if (this.center[i].y < SEA) { this.center[i].y = SEA; lifted++; }
      }
      if (lifted) {
        for (let pass = 0; pass < 8; pass++) {
          const src = new Float32Array(N);
          for (let i = 0; i < N; i++) src[i] = this.center[i].y;
          for (let i = 0; i < N; i++) {
            const v = (src[(i - 1 + N) % N] + 2 * src[i] + src[(i + 1) % N]) / 4;
            this.center[i].y = Math.max(v, SEA);
          }
        }
      }
    }
    this.length = this.curve.getLength();
    this.segLen = this.length / N;

    // grade (dY/ds along travel) per sample, for slope forces + mesh pitching
    this._slope = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      this._slope[i] =
        (this.center[(i + 2) % N].y - this.center[(i - 2 + N) % N].y) / (4 * this.segLen);
    }

    // curvature per sample (radians of heading change per world unit)
    this.curvature = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const a = this.tan[(i - 8 + N) % N];
      const b = this.tan[(i + 8) % N];
      this.curvature[i] = Math.acos(THREE.MathUtils.clamp(a.dot(b), -1, 1)) / (16 * this.segLen);
    }

    // ---- width-variation: per-sample drivable half-width (pinch sections) ----
    this._buildWidthProfile();

    // Natural jumps. Must happen HERE — before any mesh is built — so the road
    // ribbon, its skirts, the ruts, the terrain blend and every prop placement
    // follow the hump for free.
    this._buildCrests();
    // ---- outback creeks: cut the dry watercourses into the same profile, for
    // the same reason and under the same contract as the crests above.
    this._planCreeks();

    this._checkLayout();

    // OVERPASSES: where the ROUTE crosses itself, one leg rises on a bridge.
    // nearestIndex is hint-windowed (±30 samples), so index continuity keeps
    // every car on its own leg through the stack - the capability the 2-opt
    // uncrossing was invented to avoid is simply real now. Planned first so
    // gorges, tunnels, ramps and skirts all keep clear.
    this._overpasses = [];
    this._planOverpasses();

    // the hero gorge must exist before ANY height is sampled (terrain mesh,
    // road skirts and every scenery placement read it through _blendHeight)
    if (this.T.heroBridge) this._planGorge();
    // GORGE JUMPS: carved chasms where the roadway is simply OUT - a baked
    // kicker lip launches anything at racing speed clean across (the r96
    // ballistic flight does the rest); anything slower drops in and drives
    // out along the chasm floor, whose ends ease back to grade below the
    // off-road climb limit. Planned here for the same reason as the hero
    // gorge: every height sample after this point must read the cut.
    this._jumpGorges = [];
    this._jumpCut = null;
    if (this.T.gorgeJump) this._planJumpGorges();
    // TUNNELS are planned, not found: the road-field blend flattens the
    // ground beside every carriageway, so no natural cutting is ever deep
    // enough to bore. Instead the straightest eligible stretches are chosen
    // here and a rock ridge is RAISED over them in both height fields - the
    // bore then runs through a hill that genuinely exists.
    this._tunnels = [];
    if (this.T.tunnels) this._planTunnels();

    this.animated = { flags: [], clouds: [] };
    // World-space circle colliders for on-road obstacles: [{x, z, r}].
    // Always present; [] on levels without obstacles. Consumed by car physics.
    this.obstacles = [];
    // World-space mud puddles on the road: [{x, z, r}]. Always present; [] on
    // levels without them. Visual decals here — driving effects live elsewhere.
    this.puddles = [];
    // ---- river-fords: shallow water bands crossing the road. [{i, x, z, y,
    // half}] where `half` is the half-width of the band in world units along
    // the track. Always present; [] on dry levels. Splash/wet-tire physics
    // lives in the vehicle code.
    this.fords = [];
    // ---- viz-zones: sectional visibility hazards [{i0, i1, len, mid, half,
    // kind, strength}]. Always present; [] on clear worlds. The game lead
    // reads this to pull scene fog in while the player is inside.
    this.vizZones = [];
    // Destructible roadside props: [{mesh, x, z, r, type, scoreValue, pickup}].
    // Always present. The game code detects car contact, removes the entry and
    // animates the mesh flying away itself; `pickup` is a type string on the
    // crates that carry a reward (else null).
    this.props = [];
    // Smashable trees: [{x, z, y, r, id, parts, kind, s, dead}] — every tree /
    // cactus / snag instance, so cars can fell them (mostly a free-roam thing).
    this.trees = [];
    // SOLID scenery circle colliders (Law of Solidity — no ghost scenery):
    // [{x, z, r, y}] for big boulders, huts, gantry legs, the grandstand
    // front and distant mesas. Car physics treats them like this.obstacles.
    this.solids = [];
    // Shootable buildings: [{x, z, y, r, w, h, hp, solid, parts, dead}]. Huts
    // and igloos are instanced, so `parts` names the mesh + slot to blank when
    // one is levelled, and `solid` is the collider to pull out of this.solids.
    this.buildings = [];
    // Smashable trackside tire stacks: [{x, z, y, r, ids, dead}] — one entry
    // per STACK; ids are the instance indices inside the tire InstancedMesh.
    this.tireStacks = [];
    // Soft bushes cars brush through: [{x, z, y, r, id, lastHit}].
    this.bushes = [];
    this.bushColor = this.T.bushColor;   // leaf-particle tint for the consumer
    // Knockable sponsor boards: [{x, z, y, r, dead, group, board, heading}].
    this.banners = [];
    // Open grazing ground for the animal system: [{x, z, r}] — flat, road-free
    // circles out in the country. Data only; behaviour lives in the game code.
    this.pastures = [];
    // decorative side-road junctions: [{index, side, angle, len}] — the
    // traffic system reads these; geometry is scenery only
    this.crossroads = [];
    // (fences were removed from the game entirely — the world is open and
    // off-road slowness is the boundary; see RULES.md)
    // Soft world radius for free-roam driving; the game turns players around
    // once they wander past it.
    this.worldBounds = 1400;
    // Baked contact-shadow specs {x, z, r, y} collected by every builder and
    // realized as ONE instanced decal mesh at the end of _buildEnvironment.
    this._shadows = [];
    this._buildRoad();
    // dirt shoulder aprons under the road edges: they bury themselves where
    // the ground meets the road, and skin the cut face where it falls away
    // (switchback faces, hill folds). Cliff-walled levels are skinned by the
    // cliff ribbons instead.
    if (!T.cliffWalls) this._buildRoadSkirts();
    this._buildWalls();
    this._buildStartGate();
    this._buildRamps();      // ramps claim the straightest sections…
    this._buildBoostPads();  // …then pads fill in around them
    this._buildObstacles();  // …then rock towers block straights between them
    this._buildPuddles();
    this._buildFords();      // ---- river-fords: streams wash over the road
    // MEDITERRANEAN: loose stone dragged onto corner exits. After the fords, so
    // it can keep clear of the one water crossing.
    this._buildCornerGravel();
    this._buildVizZones();   // ---- viz-zones: forest tunnels / fog banks / squalls
    this._buildNarrowDressing(); // ---- width-variation: pinch edge markers
    this._buildProps();      // …and smashable props fill the roadsides
    this._buildEnvironment();
  }

  /** Dev sanity check: warn if the centerline passes too close to itself
   *  (any two non-adjacent samples nearer than the full road ribbon width). */
  _checkLayout() {
    const minGap = (WALL_OFF + 0.6) * 2;
    let worst = Infinity, wi = -1, wj = -1;
    for (let i = 0; i < N; i += 2) {
      const jMax = Math.min(N - 1, i + N - 40);
      for (let j = i + 40; j <= jMax; j += 2) {
        const dx = this.center[i].x - this.center[j].x;
        const dz = this.center[i].z - this.center[j].z;
        const d2 = dx * dx + dz * dz;
        if (d2 < worst) { worst = d2; wi = i; wj = j; }
      }
    }
    const d = Math.sqrt(worst);
    if (d < minGap) {
      console.warn(
        `Track layout "${this.level && this.level.name}": centerline self-approach ` +
        `${d.toFixed(1)}u between samples ${wi} and ${wj} (< ${minGap.toFixed(1)}u road width)`
      );
    }
  }

  /** Road elevation at sample i: 2–3 smooth sine octaves over the lap, forced
   *  flat around the start line so the grid/gate/grandstand sit at y=0. All
   *  phases are fixed per theme — layouts stay deterministic across loads. */
  _elevProfile(i) {
    const E = this.T.elev || { amp: 0, ph: [0, 0, 0] };
    const flat = THREE.MathUtils.smoothstep(this._circDist(i, 0), 45, 130);
    if (E.profile === 'ascent') {
      // Hand-shaped mountain-pass profile: E.keys is a monotone-in-t list of
      // [lapFraction, roadY] pairs, smoothstepped between neighbours (the sine
      // octaves can't produce a sustained climb). The zigzag switchback layout
      // makes path length >> height gain, so road grades stay drivable.
      const f = i / N;
      const K = E.keys;
      let y = K[K.length - 1][1];
      for (let k = 0; k < K.length - 1; k++) {
        if (f <= K[k + 1][0]) {
          y = K[k][1] + (K[k + 1][1] - K[k][1])
            * THREE.MathUtils.smoothstep(f, K[k][0], K[k + 1][0]);
          break;
        }
      }
      return y * flat;
    }
    const t = (i / N) * Math.PI * 2;
    const raw =
      0.52 * Math.sin(2 * t + E.ph[0]) +      // period ~N/2
      0.34 * Math.sin(3.3 * t + E.ph[1]) +    // period ~N/3.3
      0.14 * Math.sin(7 * t + E.ph[2]);       // period ~N/7
    // dead-flat within ±45 samples of the start, easing up to full amplitude
    return E.amp * raw * flat;
  }

  /** Grade dY/ds (rise per unit of travel) at sample i. Positive = climbing. */
  slopeAt(i) {
    return this._slope[((i % N) + N) % N];
  }

  // ---- width-variation ----------------------------------------------------
  /** Drivable half-width at sample i. ROAD_HALF everywhere except inside a
   *  narrow section, where it smoothly pinches to ~55–65% and back. Physics
   *  callers use `t.widthAt?.(i) ?? ROAD_HALF` so either side of a merge
   *  degrades gracefully. */
  widthAt(i) {
    const w = this._width;
    return w ? w[((i % N) + N) % N] : ROAD_HALF;
  }

  /** True when sample i lies within `pad` samples of a narrow section
   *  (used by ramp/pad/obstacle/prop placement so nothing big lands in, or
   *  hangs off, a pinched stretch of road). */
  _nearNarrow(i, pad = 0) {
    return (this._narrowSecs ?? []).some((s) => this._circDist(i, s.mid) < s.half + pad);
  }

  /** Deterministic per-theme narrow sections: 2–4 stretches of 34–68 samples
   *  on straights/mild curves where the road pinches to `min`×ROAD_HALF with
   *  smooth cosine shoulders. Off for cliff-walled corridors (already tight). */
  _buildWidthProfile() {
    this._width = new Float32Array(N).fill(ROAD_HALF);
    this._narrowSecs = [];
    const T = this.T;
    const themeKey = (this.level && this.level.theme) || 'forest';
    const spec = T.narrows !== undefined
      ? T.narrows
      : T.cliffWalls ? false : (NARROW_TUNE[themeKey] ?? { count: 3, min: 0.6 });
    if (!spec || !(spec.count > 0)) return;
    // seeded LCG from the theme name — layouts stay deterministic across loads
    let seed = 2166136261 >>> 0;
    for (let k = 0; k < themeKey.length; k++) {
      seed = ((seed ^ themeKey.charCodeAt(k)) * 16777619) >>> 0;
    }
    const rnd = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    for (let tries = 0; tries < 500 && this._narrowSecs.length < spec.count; tries++) {
      const len = 34 + Math.floor(rnd() * 34);            // 34–68 samples
      const i0 = Math.floor(rnd() * N);
      // clear of the start/grid both ends
      if (this._circDist(i0, 0) < 90 || this._circDist((i0 + len) % N, 0) < 90) continue;
      // straights / mild curves only — never mid-hairpin
      let ok = true;
      for (let k = -8; ok && k <= len + 8; k++) {
        if (this.curvature[(i0 + k + N) % N] > 0.016) ok = false;
      }
      if (!ok) continue;
      const mid = (i0 + (len >> 1)) % N;
      const half = len / 2;
      if (this._narrowSecs.some((s) => this._circDist(mid, s.mid) < s.half + half + 110)) continue;
      // pinch floor ≈ 55–65% of ROAD_HALF (never below 5u half-width)
      const minW = Math.max(5, ROAD_HALF * (spec.min ?? 0.6) * (0.95 + rnd() * 0.12));
      this._narrowSecs.push({ i0, len, mid, half, minW });
      for (let k = 0; k <= len; k++) {
        // cosine shoulders over the outer 35% each side, flat floor between
        const edge = Math.min(k, len - k) / (len * 0.35);
        const f = THREE.MathUtils.smoothstep(Math.min(1, edge), 0, 1);
        const j = (i0 + k) % N;
        this._width[j] = Math.min(this._width[j], ROAD_HALF + (minW - ROAD_HALF) * f);
      }
    }
  }

  /** Pinch dressing: the squeeze must read as intentional — stone markers and
   *  a hazard-striped post pair at each pinch entry/exit, plus rocks tracing
   *  the narrowed edges. Markers are SOLID stone (Law of Solidity).
   *
   *  A pinch is a SQUEEZE, never a trap: every marker is pushed out far enough
   *  that its collision face clears the declared drivable width. The car body
   *  collides as a CAR_R-radius disc against `solids` (see vehicles.js), so a
   *  marker of radius r must sit at |lateral| ≥ widthAt + r + CAR_R for the
   *  full width to stay honestly free. Clip one and you were already off the
   *  road — running wide is punished, threading the gap is not. */
  _buildNarrowDressing() {
    if (!this._narrowSecs || !this._narrowSecs.length) return;
    const CAR_R = 1.8; // car collision radius used by the solids sweep
    const rockMat = new THREE.MeshStandardMaterial({
      color: this.T.rockColor ?? 0x8d8578, flatShading: true, roughness: 1,
    });
    const postMat = new THREE.MeshStandardMaterial({ map: hazardTexture(), roughness: 0.85 });
    const rockGeo = new THREE.DodecahedronGeometry(1, 0);
    const postGeo = new THREE.CylinderGeometry(0.16, 0.22, 2.2, 6);
    const hash = (n) => { const s = Math.sin(n) * 43758.5453; return s - Math.floor(s); };
    for (const sec of this._narrowSecs) {
      for (const side of [1, -1]) {
        // striped posts flag the entry and the exit of the squeeze
        for (const k of [2, sec.len - 2]) {
          const j = (sec.i0 + k) % N;
          const lat = (this.widthAt(j) + 0.45 + CAR_R + 0.2) * side;
          const p = this.pointAt(j, lat);
          const post = new THREE.Mesh(postGeo, postMat);
          post.position.set(p.x, p.y + 1.05, p.z);
          post.castShadow = true;
          this.group.add(post);
          this.solids.push({ x: p.x, z: p.z, r: 0.45, y: p.y, mat: 'metal' });
          this._addShadow(p.x, p.z, 0.8, p.y);
        }
        // low stone teeth trace the pinched edge so it reads as built, not broken
        for (let k = 6; k < sec.len - 4; k += 7) {
          const j = (sec.i0 + k) % N;
          const w = this.widthAt(j);
          if (w > ROAD_HALF - 0.8) continue;             // only along the squeeze
          const s = 0.55 + hash(j * 7.7 - side) * 0.5;
          const lat = (w + s * 0.95 + CAR_R + 0.2 + hash(j * 3.1 + side) * 0.7) * side;
          const p = this.pointAt(j, lat);
          // fine at this sample, inside the road two samples later where the
          // centreline swings under it — that is the rock you cannot see coming
          if (!this._clearsRoad(p.x, p.z, s * 0.95, 0.9)) continue;
          const rock = new THREE.Mesh(rockGeo, rockMat);
          rock.scale.set(s, s * 0.75, s * 0.9);
          rock.rotation.y = hash(j * 1.3) * Math.PI * 2;
          rock.position.set(p.x, p.y + s * 0.3, p.z);
          rock.castShadow = true;
          this.group.add(rock);
          this.solids.push({ x: p.x, z: p.z, r: s * 0.95, y: p.y, mat: 'stone' });
          this._addShadow(p.x, p.z, s * 1.3, p.y);
        }
      }
    }
  }
  // ---- end width-variation -------------------------------------------------

  // ---------- queries ----------
  nearestIndex(pos, hint = null) {
    // XZ distance only — the elevated centerline must not bias index tracking
    const d2 = (i) => {
      const dx = pos.x - this.center[i].x, dz = pos.z - this.center[i].z;
      return dx * dx + dz * dz;
    };
    let best = -1, bd = Infinity;
    if (hint === null) {
      for (let i = 0; i < N; i += 4) {
        const d = d2(i);
        if (d < bd) { bd = d; best = i; }
      }
      hint = best; bd = Infinity;
    }
    for (let k = -30; k <= 30; k++) {
      const i = (hint + k + N) % N;
      const d = d2(i);
      if (d < bd) { bd = d; best = i; }
    }
    return best;
  }

  lateralOffset(pos, i) {
    const dx = pos.x - this.center[i].x, dz = pos.z - this.center[i].z;
    return dx * this.nrm[i].x + dz * this.nrm[i].z;
  }

  pointAt(i, lateral) {
    // road surface is flat across its width — y comes straight from the profile
    return new THREE.Vector3(
      this.center[i].x + this.nrm[i].x * lateral,
      this.center[i].y,
      this.center[i].z + this.nrm[i].z * lateral
    );
  }

  headingAt(i) { return Math.atan2(this.tan[i].x, this.tan[i].z); }

  gridSlot(slot) {
    const row = Math.floor(slot / 2);
    const i = (N - 10 - row * 8 + N) % N;
    const lateral = (slot % 2 === 0 ? -1 : 1) * 3.6;
    return { index: i, lateral };
  }

  /** Road surface height at a track position: the elevation profile, plus the
   *  ramp wedge height when inside a ramp zone (ramps ADD to road height). */
  groundHeightAt(i, lateral) {
    let roadY = this.center[i].y;
    // gorge jumps: the roadway is OUT across the chasm - the surface here IS
    // the collapsed span, and the crest detector launches anything fast
    if (this._jumpCut) roadY -= this._jumpCut[i];
    for (const r of this.ramps) {
      const di = (i - r.index + N) % N;
      if (di < r.len && Math.abs(lateral - r.lateral) < r.halfW) {
        return roadY + r.height * (di / r.len);
      }
    }
    return roadY;
  }

  /** Road height under a WORLD POSITION, interpolated along the centreline.
   *
   *  `groundHeightAt` takes an integer sample index, so the road it describes
   *  is a staircase: the height under a moving car holds flat for a few frames
   *  and then jumps by a whole inter-sample step. Standing still that is
   *  invisible. At 50 u/s over 2.4 u samples the car crosses a step every
   *  three frames, and anything that DIFFERENTIATES the ground height sees
   *  0, 0, then a spike of (step / dt) — about 29 u/s on a 20% grade, with an
   *  implied acceleration in the thousands.
   *
   *  That is measurement noise, not terrain, and the jump detector in
   *  vehicles.js was triggering on it. This returns the same profile sampled
   *  continuously, so a derivative of it means what it says.
   *
   *  @param i a nearby sample index (the caller's tracked index is ideal)
   */
  groundHeightAtPos(pos, i, lateral) {
    if (!this.center.length) return 0;
    return this.groundHeightAtFrac(this.fracIndexAt(pos, i), lateral);
  }

  /** Where a world position sits along the centreline, measured in SAMPLES and
   *  fractional. The integer `trackIndex` a car carries is only the nearest
   *  sample; anything that predicts forward from it starts up to a full sample
   *  (segLen, ~2.4 u) behind where the car really is. */
  fracIndexAt(pos, i) {
    const n = this.center.length;
    if (!n) return 0;
    const a = ((i % n) + n) % n;
    // The tangent is unit length, so this projection is in metres; over the
    // segment length it is the interpolation parameter. Clamped to one segment
    // either side — beyond that the caller's index hint was simply wrong, and
    // extrapolating a bad hint is worse than sitting on the sample.
    const t = this.tan[a];
    const f = ((pos.x - this.center[a].x) * t.x + (pos.z - this.center[a].z) * t.z)
            / (this.segLen > 0 ? this.segLen : 1);
    return a + Math.max(-1, Math.min(1, f));
  }

  /** Road height at a fractional sample index — the continuous form of
   *  `groundHeightAt`, which only accepts integers. */
  groundHeightAtFrac(idx, lateral) {
    const n = this.center.length;
    if (!n) return 0;
    const lo = Math.floor(idx);
    const f = idx - lo;
    const a = ((lo % n) + n) % n;
    const b = (a + 1) % n;
    const yLo = this.groundHeightAt(a, lateral);
    const yHi = this.groundHeightAt(b, lateral);
    return yLo + (yHi - yLo) * f;
  }

  /** Distance from (x,z) to the nearest centerline sample (coarse), plus that
   *  sample's road elevation. Returns [dist, roadY]. */
  _nearRoad(x, z) {
    let best = Infinity, bi = 0;
    for (let i = 0; i < N; i += 5) {
      const dx = x - this.center[i].x, dz = z - this.center[i].z;
      const d = dx * dx + dz * dz;
      if (d < best) { best = d; bi = i; }
    }
    return [Math.sqrt(best), this.center[bi].y];
  }

  /** Distance from (x,z) to the nearest centerline sample (coarse). */
  _distToTrack(x, z) {
    return this._nearRoad(x, z)[0];
  }

  /** Track distance + nearest-sample road y on a lazy 8-unit grid, bilinearly
   *  blended between the four surrounding corners. Each corner runs _nearRoad
   *  once, then is memoized, so warm calls are a handful of ops — cheap enough
   *  for per-frame use. Writes {d, y} into this._fieldTmp and returns it. */
  _roadFieldCoarse(x, z) {
    const out = this._fieldTmp || (this._fieldTmp = { d: 0, y: 0 });
    const CS = 8, HALF = 2048, CELLS = (HALF * 2) / CS;
    const gx = (x + HALF) / CS, gz = (z + HALF) / CS;
    const x0 = Math.floor(gx), z0 = Math.floor(gz);
    if (x0 < 0 || z0 < 0 || x0 >= CELLS || z0 >= CELLS) {
      const v = this._nearRoad(x, z);
      out.d = v[0]; out.y = v[1];
      return out;
    }
    const cache = this._distCache || (this._distCache = new Map());
    const corner = (cx, cz) => {
      const key = cx * 1024 + cz;
      let v = cache.get(key);
      if (v === undefined) {
        v = this._nearRoad(cx * CS - HALF, cz * CS - HALF);
        cache.set(key, v);
      }
      return v;
    };
    const fx = gx - x0, fz = gz - z0;
    const c00 = corner(x0, z0), c10 = corner(x0 + 1, z0);
    const c01 = corner(x0, z0 + 1), c11 = corner(x0 + 1, z0 + 1);
    const a = c00[0] * (1 - fx) + c10[0] * fx;
    const b = c01[0] * (1 - fx) + c11[0] * fx;
    out.d = a * (1 - fz) + b * fz;
    const ya = c00[1] * (1 - fx) + c10[1] * fx;
    const yb = c01[1] * (1 - fx) + c11[1] * fx;
    out.y = ya * (1 - fz) + yb * fz;
    return out;
  }

  _distToTrackCoarse(x, z) {
    return this._roadFieldCoarse(x, z).d;
  }

  /** Open-country rolling hills (no road influence). `hillDrop` sinks the whole
   *  open field below the road datum — FURKA RIDGE uses it so the ridge road
   *  stands well proud of everything around it. */
  _hillNoise(x, z) {
    // Fourth octave (λ ≈ 55 u, ≈ 5 terrain cells) exists purely so the FACETS
    // read: with only the three long octaves every 10 u quad was very nearly
    // coplanar with its neighbours, so flat shading had no tone to give and the
    // open field rendered as one smooth green sheet. Max grade added is
    // 1.4 × 0.114 ≈ 9°, well inside what the car drives over in free roam, and
    // the SAME function feeds prop placement (terrainHeight) and the mesh, so
    // nothing floats. `relief` lets a theme dial it out (neon grid, salt flats).
    const rel = this.T.relief !== undefined ? this.T.relief : 1;
    return (
      Math.sin(x * 0.012) * Math.cos(z * 0.010) * 3.4 +
      Math.sin(x * 0.030 + 1.7) * Math.cos(z * 0.026 + 0.6) * 1.7 +
      Math.sin(x * 0.070 + 3.1) * Math.cos(z * 0.062 + 2.2) * 0.7 +
      Math.sin(x * 0.114 + 5.3) * Math.cos(z * 0.101 + 1.4) * 2.2 * rel
      - (this.T.hillDrop || 0)
      + this._highland(x, z)
    );
  }

  /** THE MOUNTAINS YOU CAN ACTUALLY DRIVE UP.
   *
   *  The drivable world used to span barely nine units of height, top to
   *  bottom: a pancake with painted cones sitting on the horizon behind it.
   *  Head for the hills in free roam and you never arrived — the "mountains"
   *  were scenery at r ≈ 800 with no collision and no slope to climb.
   *
   *  This raises the real ground into a massif that rings the world. No track
   *  reaches past r = 320 in any of the 21 worlds (measured), so starting the
   *  climb at 400 leaves every racing line untouched, and _blendHeight has
   *  already finished its corridor blend by 70 u out.
   *
   *  GRADE IS THE WHOLE POINT: a mountain you cannot climb is the bug being
   *  fixed. The radial ramp contributes ~10% and the ridge octaves ~5% on top,
   *  so the steepest ground is around 15% — a real climb that a car pulls up
   *  with speed in hand, rather than a wall. */
  _highland(x, z) {
    const scale = this.T.highland !== undefined ? this.T.highland
      : (this.T.relief === 0 ? 0 : 1);       // flat-by-design worlds opt out
    if (!scale) return 0;
    const t = smoothstep01((Math.hypot(x, z) - 400) / 1050);
    if (t <= 0) return 0;
    // ridged octaves so the massif has spurs, saddles and side valleys to pick
    // a line through instead of being one smooth cone
    const ridge =
      Math.sin(x * 0.0042 + 0.9) * Math.cos(z * 0.0039 - 0.4) * 0.55 +
      Math.sin(x * 0.0091 - 2.1) * Math.cos(z * 0.0084 + 1.3) * 0.30 +
      Math.sin(x * 0.0180 + 4.2) * Math.cos(z * 0.0165 + 2.7) * 0.15;
    const massif = t * 68 * (0.72 + 0.28 * ridge) * this._riverValley(x, z);
    return scale * (massif + this._rimWall(x, z));
  }

  /** THE BORDER. Beyond the climbable massif the ground turns up into a wall
   *  that rings the world — a headwall no car gets over, so the scenery reads
   *  as a closed bowl end to end instead of trailing off into nothing.
   *
   *  This is deliberately NOT an invisible barrier. It is the same terrain the
   *  car already drives on, just steeper than traction allows: the ramp gains
   *  260 u over 260 u of run, which is a ~100% grade at the steepest point
   *  against the ~20% the massif tops out at. You drive up, slow, and slide
   *  back — the world stops you with a mountain, not with a wall you cannot
   *  see. The river valley cuts it too, so the water still has a way out.
   *
   *  RIM_R sits past the far terrain patch's useful radius, well beyond the
   *  fog, so from the road it is a skyline rather than a fence. */
  _rimWall(x, z) {
    const RIM_R = RIM_RADIUS, RIM_RUN = 260, RIM_H = 260;
    const r = Math.hypot(x, z);
    if (r <= RIM_R) return 0;
    // ease in so the foot of the wall meets the massif smoothly, then climb
    const u = Math.min(1, (r - RIM_R) / RIM_RUN);
    const crest = 0.55 + 0.45 * Math.sin(Math.atan2(z, x) * 3.7 + 1.1);  // uneven skyline
    return RIM_H * u * u * (0.75 + 0.25 * crest) * this._riverValley(x, z);
  }

  /** 0 in the river's valley floor, easing to 1 well clear of it. The river
   *  runs out to r ≈ 1100, straight through where the massif now stands, and
   *  water does not climb a mountain — so the mountain opens a valley for it
   *  to leave through. _riverDist only reaches one 42 u cell, far too short
   *  for a valley this wide, so this walks a downsampled centreline. */
  _riverValley(x, z) {
    const R = this._river;
    if (!R) return 1;
    let best = Infinity;
    const line = R.coarse ?? R.line;
    for (const p of line) {
      const d = (p.x - x) * (p.x - x) + (p.z - z) * (p.z - z);
      if (d < best) best = d;
    }
    // The valley DEEPENS the ground around the river, it does not delete the
    // massif — cutting the full 68 u either flattened the range wherever the
    // river wandered, or (taper it sharply to avoid that) turned the valley
    // sides into the very wall this whole change exists to remove. Taking 45%
    // over a 240 u run leaves the river in a proper gorge with ~23% sides.
    return 0.55 + 0.45 * smoothstep01((Math.sqrt(best) - 60) / 240);
  }

  /** Terrain cap from OTHER road strands passing near (x,z): the lowest road y
   *  among samples 11–25.2u away in XZ that fold back much closer than their path
   *  distance from the nearest sample (hairpins, S-folds, stacked legs). Where two strands at
   *  different heights run close (frost S-folds, the alpine switchback stack),
   *  ground near the lower ribbon must never rise above it — un-capped blends
   *  poke sawtooth wedges up through the road. Infinity when no strand near. */
  _roadClampY(x, z) {
    let best = Infinity, bi = 0;
    for (let i = 0; i < N; i += 4) {
      const dx = x - this.center[i].x, dz = z - this.center[i].z;
      const d = dx * dx + dz * dz;
      if (d < best) { best = d; bi = i; }
    }
    if (best > 25.2 * 25.2) return Infinity;   // no strand in capping range
    let clamp = Infinity;
    for (let i = 0; i < N; i += 4) {
      const di = Math.abs(i - bi);
      const gap = Math.min(di, N - di);
      if (gap <= 12) continue;                              // own path neighbours
      const dx = x - this.center[i].x, dz = z - this.center[i].z;
      const d2 = dx * dx + dz * dz;
      if (d2 < 11 * 11 || d2 > 25.2 * 25.2 || this.center[i].y >= clamp) continue;
      // an ordinary along-road sample sits nearly its path-distance away in
      // XZ; only genuine fold-backs (hairpins, S-folds, stacked legs) come
      // much closer than their path distance — those are what get capped
      if (Math.sqrt(d2) > 0.72 * gap * this.segLen) continue;
      clamp = this.center[i].y;
    }
    return clamp;
  }

  /** Shared road→hills height blend. `tuck` eases the corridor slightly UNDER
   *  the ribbon (full 0.45 by d=14, zero at the drivable edge) so residual
   *  mesh interpolation error stays hidden below the road surface. */
  _blendHeight(d, roadY, x, z) {
    const B = this.T.blend;
    const near = B ? B.near : 15, far = B ? B.far : 70;
    // Pass worlds stack road strands 26-30u apart at different heights, so the
    // nearest-sample blend can hand a point under one leg the height of the
    // NEXT leg up and poke a lip through the ribbon. An extra tuck under the
    // whole corridor (hidden by the skirt) keeps the ground below the road.
    // THE ROAD IS THE FLOOR. This used to ramp the tuck IN from d = 10.8, which
    // is the drivable edge — meaning under the carriageway itself the tuck was
    // zero and the terrain mesh sat exactly coplanar with the road ribbon.
    // Coplanar surfaces z-fight, and the ground samples every 10 u while the
    // road is smooth, so wherever interpolation put a terrain triangle a hair
    // high it painted straight over the road. That is the road vanishing under
    // the hillside. The tuck is now DEEPEST under the road and eases out to
    // nothing at the far edge of the blend, so the ribbon always has clear air
    // beneath it and there is nothing to fight with.
    const tuck = 0.55 * (1 - THREE.MathUtils.smoothstep(d, 12, 30))
      + (this.T.retainingWalls || this.T.shelfRoad
        ? 0.75 * THREE.MathUtils.smoothstep(d, 2, 11) : 0);
    let h;
    if (d <= near) h = roadY - tuck;
    else {
      const n = this._hillNoise(x, z);
      if (d >= far) h = n;
      else {
        const f = THREE.MathUtils.smoothstep(d, near, far);
        h = (roadY - tuck) * (1 - f) + n * f;
      }
    }
    // the hero gorge is carved out of whatever the ground would otherwise be,
    // road corridor included — that is the hole the suspension bridge spans
    if (this._gorge || this._jumpGorges?.length) h -= this._gorgeCut(x, z);
    if (this._tunnels?.length) h = this._tunnelRidge(x, z, h);
    // the river runs in a real bed, not on top of the field — but the channel
    // is flattened out again as it nears the road so the FORD stays a shallow
    // wash across the carriageway instead of a trench (and so the road skirts,
    // which were built before the river was planned, still meet the ground)
    if (this._river && this._river.bed) {
      // Blend the ground toward the smoothed bed profile rather than denting
      // whatever noise happened to be here — see _planRiver. The ford still
      // flattens out (the fade on `d`) so the crossing stays a shallow wash on
      // the carriageway instead of a trench across the racing line.
      // THE CHANNEL CROSS-SECTION — the template every river in the game is
      // cut to. A FLAT FLOOR across the full water width, then a bank that
      // ramps back up to whatever the ground was doing.
      //
      // It used to be a cosine falloff from the centreline, which meant the
      // carve was only about half applied by the time it reached the water's
      // own edge. That is survivable when the bed profile hugs the ground —
      // and it does not: the profile is forced monotonically DOWNHILL (water
      // does not run uphill, and the level reaches and vertical falls depend
      // on it), so on a long reach it sits far below the local hillside. The
      // narrow falloff could not dig that deep, so the ribbon's edges were
      // swallowed by the ground. Measured on the built meshes: 84 % of the
      // water's vertices were BELOW the terrain at their own position, the
      // worst by 35 u. The bank band, which conforms to the ground properly,
      // was at 0 % — which is what made the river read as disconnected blue
      // shards with grass growing through them.
      //
      // Carving the FULL water width flat guarantees containment by
      // construction, on every world, at every station: the floor is one depth
      // below the profile and the surface sits 0.42 of a depth above the floor,
      // so there is no terrain that can rise into it.
      const R = this._river;
      const { d: rd, k } = this._riverNearest(x, z);
      const hw = R.halfAt ? R.halfAt[k] : R.half;
      const outer = hw + R.bank;
      if (rd < outer) {
        const floorY = R.bed[k] - R.depth;
        // 1 across the water, ramping to 0 at the bank top
        const t = rd <= hw ? 1
          : Math.max(0, 1 - (rd - hw) / Math.max(1e-3, outer - hw));
        // the ford fade is unchanged: the crossing stays a shallow wash on the
        // carriageway instead of a trench across the racing line
        const w = smoothstep01(t) * THREE.MathUtils.smoothstep(d, 9, 22);
        h = h * (1 - w) + floorY * w;
      }
    }
    return h;
  }

  // ---- continuous river ------------------------------------------------------
  /** Plan ONE waterway that spans the whole world and threads every ford.
   *
   *  What shipped before was a 130 u meander built independently at each ford,
   *  so from above you saw two disconnected flat quads with hard straight ends
   *  whose banks did not even line up across the road. This builds a single
   *  centripetal spline: it enters at one world edge, passes through each ford
   *  crossing perpendicular to the road at that point, and leaves at the far
   *  edge. Everything downstream (bed carve, water ribbon, banks, reeds, ford
   *  wash) reads this one curve, so the crossing cannot mismatch.
   *
   *  `chosen` = the ford samples picked by _buildFords, ascending by index. */
  _planRiver(chosen) {
    if (!chosen.length) return;
    let pts = [];              // reassigned by the radius relaxation below
    const lead = 34;                       // straight run either side of a ford
    const order = chosen.slice().sort((a, b) => a.i - b.i);
    const P = (x, z, lock) => { const v = new THREE.Vector3(x, 0, z); v.lock = !!lock; return v; };
    // The circuit is a CLOSED loop, so `nrm` points to the same hand all the
    // way round. Entering every ford from the same side would force the reach
    // between two crossings back over the carriageway — which is exactly the
    // stray second water band the first build produced. Alternate instead: come
    // out of ford k on one side, and enter ford k+1 from that same side.
    let enter = -1;
    for (let k = 0; k < order.length; k++) {
      const fd = order[k];
      const c = this.center[fd.i], n = this.nrm[fd.i];
      const exit = -enter;
      // the crossing itself: dead straight and square to the road, and LOCKED
      // (the road-avoidance pass below must never move a crossing point)
      pts.push(P(c.x + n.x * lead * enter, c.z + n.z * lead * enter, true));
      pts.push(P(c.x, c.z, true));
      pts.push(P(c.x + n.x * lead * exit, c.z + n.z * lead * exit, true));
      // Reach to the next crossing. A straight line between two fords cuts
      // straight back over the carriageway wherever the circuit bends between
      // them (the track is a loop, so "the far side of ford k" and "the near
      // side of ford k+1" are only connected without crossing if you go the way
      // the ROAD goes). So the reach is generated FROM THE CENTERLINE, held out
      // at a wandering 48-78 u offset on the side the river is currently on —
      // it parallels the circuit and can never re-cross it.
      if (k + 1 < order.length) {
        const from = fd.i, to = order[k + 1].i;
        const span = ((to - from) + N) % N;
        const steps = Math.max(3, Math.round(span / 14));
        for (let s = 1; s < steps; s++) {
          const t = s / steps;
          const gi = (from + Math.round(span * t)) % N;
          const off = 62 + Math.sin(t * Math.PI * 2.4 + fd.i * 0.31) * 16;
          const q = this.pointAt(gi, exit * off);
          pts.push(P(q.x, q.z));
        }
      }
      enter = exit;
    }
    // Run both ends out past the visible world so the river never "starts".
    // Seven fixed 150 u steps did not do that: the tails follow the local
    // tangent rather than heading straight out, so they were petering out
    // around r ≈ 1100 — inside the far terrain (r 2100) and inside the fog,
    // which is a river that stops in the middle of a field. Keep stepping
    // until the tail is genuinely past the world edge.
    const OUT_R = 2600;                    // clear of the far terrain and the fog
    const extend = (from, to, sign) => {
      let dx = to.x - from.x, dz = to.z - from.z;
      const l = Math.hypot(dx, dz) || 1;
      dx /= l; dz /= l;
      for (let k = 1; k <= 30; k++) {
        const step = 150 * k;
        const sway = Math.sin(k * 0.75 + (sign > 0 ? 1.3 : 4.1)) * 40;
        const nx = to.x + dx * step - dz * sway;
        const nz = to.z + dz * step + dx * sway;
        pts[sign > 0 ? 'push' : 'unshift'](P(nx, nz));
        if (Math.hypot(nx, nz) > OUT_R) break;
      }
    };
    extend(pts[1], pts[0], -1);
    extend(pts[pts.length - 2], pts[pts.length - 1], 1);
    // ROAD AVOIDANCE. Between the locked crossings the spline is free to wander,
    // and left alone it happily loops back over the carriageway — which is what
    // put a second, ford-less water band across the road in the first build.
    // Any unlocked control point that strays inside the corridor is pushed back
    // out along the road normal at its nearest sample.
    const KEEP = 46;
    const tmpv = new THREE.Vector3();
    for (const p of pts) {
      if (p.lock) continue;
      for (let pass = 0; pass < 5; pass++) {
        const i = this.nearestIndex(tmpv.set(p.x, 0, p.z), null);
        const c = this.center[i];
        const d = Math.hypot(p.x - c.x, p.z - c.z);
        if (d >= KEEP) break;
        const n = this.nrm[i];
        const sgn = (p.x - c.x) * n.x + (p.z - c.z) * n.z >= 0 ? 1 : -1;
        p.x = c.x + n.x * KEEP * sgn;
        p.z = c.z + n.z * KEEP * sgn;
      }
    }

    const half = 4.0, bank = 6.0;
    // A RIVER MAY NOT BEND TIGHTER THAN IT IS WIDE.
    //
    // The ribbon is built by offsetting the centreline by its own half-width.
    // That is only a valid construction while the turning radius stays larger
    // than the offset: below it the two edges cross and the strip folds back
    // through itself. Measured on the shipped roster, PINE VALLEY's reach bent
    // to a 6.7 u radius where its widest station needs 10 — which is the hard
    // V, with the bank showing through the crease, in the report.
    //
    // No height rule can fix that, because it is not a height problem. So the
    // constraint is applied to the PATH, before anything is built from it:
    // relax any control point whose turn is too tight, leaving the ford
    // crossings pinned (they have to meet the road square) and the ends pinned
    // (they have to reach the world edge). Bounded iterations, because a
    // constraint that cannot be met should give up rather than flatten the
    // river into a straight line.
    const NEED = (half * 1.36 + bank) * 1.15;      // widest station, plus margin
    // Relaxation has to run on the SAMPLED CURVE, not on the control polygon.
    // The first attempt eased the control points and made PINE VALLEY better
    // (6.7 -> 8.9 u) while making HEDGEROW DASH WORSE (10.9 -> 6.5): a
    // centripetal Catmull-Rom overshoots BETWEEN its controls, so a smooth
    // control polygon is no guarantee about the curve drawn through it. So
    // sample, relax the samples, and rebuild the spline from those.
    const relax = (ctrl) => {
      const c0 = new THREE.CatmullRomCurve3(ctrl, false, 'centripetal');
      const M = Math.max(48, Math.min(300, Math.round(c0.getLength() / 24)));
      const pl = [];
      for (let i = 0; i <= M; i++) pl.push(c0.getPointAt(i / M));
      // A sample sitting on the road is a FORD and must stay put: the crossing
      // has to meet the carriageway square, which is the whole reason the
      // reach was routed through it.
      const pin = pl.map((q) => this._distToTrackCoarse(q.x, q.z) < 26);
      pin[0] = pin[pl.length - 1] = true;
      for (let pass = 0; pass < 60; pass++) {
        let bad = 0;
        for (let i = 1; i < pl.length - 1; i++) {
          if (pin[i]) continue;
          const A = pl[i - 1], C = pl[i], D = pl[i + 1];
          const ab = Math.hypot(C.x - A.x, C.z - A.z);
          const bc = Math.hypot(D.x - C.x, D.z - C.z);
          const ac = Math.hypot(D.x - A.x, D.z - A.z);
          const area = Math.abs((C.x - A.x) * (D.z - A.z) - (D.x - A.x) * (C.z - A.z)) / 2;
          const rad = area < 1e-6 ? Infinity : (ab * bc * ac) / (4 * area);
          if (rad >= NEED) continue;
          bad++;
          C.x = C.x * 0.4 + (A.x + D.x) * 0.3;
          C.z = C.z * 0.4 + (A.z + D.z) * 0.3;
        }
        if (!bad) break;
      }
      return pl;
    };
    pts = relax(pts);

    const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
    // dense polyline for distance queries + a uniform hash grid over it
    const SAMP = Math.max(64, Math.ceil(curve.getLength() / 11));
    const line = [];
    for (let s = 0; s <= SAMP; s++) line.push(curve.getPointAt(s / SAMP));
    const CELL = 42;                        // > half + bank, so a 3×3 lookup is exact
    const grid = new Map();
    for (let k = 0; k < line.length; k++) {
      const key = `${Math.floor(line[k].x / CELL)},${Math.floor(line[k].z / CELL)}`;
      let a = grid.get(key);
      if (!a) grid.set(key, a = []);
      a.push(k);
    }
    // depth 1.5 barely dented the ground; the banks need to actually rise
    // around the water for it to read as a river rather than blue paint
    // every 6th sample is plenty to measure a 250 u-wide valley against, and
    // _riverValley scans this list once per terrain vertex — keep it short
    const coarse = line.filter((_, i) => i % 6 === 0);
    this._river = { curve, line, coarse, grid, CELL, half, bank, depth: 2.6, bed: null, fords: order };

    // THE BED. Carving used to mean "subtract a bump from whatever the ground
    // was doing", which is not a riverbed: the hill octaves vary by about as
    // much across ten units as the whole channel was deep, so ridges pushed up
    // through a level water surface and broke the reach into disconnected blue
    // shards. So sample the ground the river crosses, smooth it along the
    // flow, and force it to fall — water does not run uphill — then blend the
    // terrain TOWARD that profile inside the channel instead of denting it.
    // _blendHeight skips the channel entirely while `bed` is null, so these
    // samples see the pre-river ground and this cannot feed on itself.
    const raw = line.map((p) => this.terrainHeight(p.x, p.z));
    const SM = 10;                                    // smoothing half-window
    const smooth = raw.map((_, k) => {
      let s = 0, n = 0;
      for (let j = -SM; j <= SM; j++) {
        const i = k + j;
        if (i >= 0 && i < raw.length) { s += raw[i]; n++; }
      }
      return s / n;
    });
    // walk downhill from whichever end is higher so the profile never climbs
    const flowsForward = smooth[0] >= smooth[smooth.length - 1];
    const bed = smooth.slice();
    if (flowsForward) {
      for (let k = 1; k < bed.length; k++) bed[k] = Math.min(bed[k], bed[k - 1]);
    } else {
      for (let k = bed.length - 2; k >= 0; k--) bed[k] = Math.min(bed[k], bed[k + 1]);
    }

    // THE FLOOR IS STEPPED, BECAUSE THE WATER IS.
    //
    // The water runs in LEVEL REACHES joined by VERTICAL FALLS — that is the
    // shape that was asked for and it is what makes a waterfall read as one.
    // The bed it was cut into was smooth, so at every fall the surface stepped
    // down and the ground beneath it did not: the water hung over the slope
    // with daylight under its lip. Reported as "look at the river how it is
    // floating in the air", and correctly — no clamp on the WATER can fix it,
    // because the water is the thing that is right. It is the GROUND that has
    // to have a rock face at the fall.
    //
    // So the same quantisation is applied here, ONCE, and the channel is
    // carved from the result. The water profile in _buildRiver then re-derives
    // the identical steps from this bed (its own pass becomes a no-op, every
    // drop already exceeding FALL), so the rock face and the face of the water
    // are the same face by construction — not two things kept in agreement.
    const FALL = 1.1;                    // must match _buildRiver's FALL
    const step = bed.slice();
    if (flowsForward) {
      let hold = step[0];
      for (let k = 0; k < step.length; k++) {
        if (hold - step[k] > FALL) hold = step[k];
        step[k] = hold;
      }
    } else {
      let hold = step[step.length - 1];
      for (let k = step.length - 1; k >= 0; k--) {
        if (hold - step[k] > FALL) hold = step[k];
        step[k] = hold;
      }
    }
    this._river.bed = step;
    // The direction the bed was stepped along. The water-profile pass in
    // _buildRiver must walk the SAME direction: a reach-and-fall profile run
    // against the flow reads every fall as a climb and flattens the whole
    // river to its lowest level.
    this._river.flow = flowsForward ? 1 : -1;
    // THE WIDTH IS PART OF THE TEMPLATE, so the carve and the ribbon have to
    // read the SAME number. The water's half-width breathes (so the reach does
    // not read as a canal) by up to 1.36x, but the channel was cut flat only
    // out to the UNWOBBLED half — which left the widest sixth of the water
    // sitting on the bank ramp, with the ground rising into it. That is the
    // green wedges biting into the ribbon in the report. Baked per station
    // here, and both consumers index it through `_riverNearest`, so they cannot
    // disagree again.
    this._river.halfAt = bed.map((_, k) => {
      const t = k / Math.max(1, bed.length - 1);
      return half * (1 + 0.24 * Math.sin(t * 41 + 0.7) + 0.12 * Math.sin(t * 17.3));
    });
  }

  /** Nearest centreline sample to (x, z): {d, k}. d is Infinity past the bed. */
  /** Depth of open water at (x,z), 0 when dry — ANYWHERE on the waterway, not
   *  only at the marked crossings.
   *
   *  The wet-tyre and splash handling used to key off `this.fords`, a list of
   *  two or three sample indices on the road. So the river was only wet where
   *  it had been declared wet: drive off the road into the same river fifty
   *  metres upstream and the car crossed it bone dry, at full grip, throwing
   *  nothing. This asks the geometry instead.
   *
   *  Depth shelves to nothing at the banks, and is a thin wash where the river
   *  washes over the road (the bed is lifted to the deck there) but a real
   *  channel out in the open — which is why an off-road crossing should cost
   *  you far more than a ford does. */
  waterAt(x, z) {
    const R = this._river;
    if (!R) return 0;
    const { d } = this._riverNearest(x, z);
    if (!(d < R.half)) return 0;
    const across = Math.cos((d / R.half) * Math.PI * 0.5);   // 1 mid-channel
    const near = 1 - THREE.MathUtils.smoothstep(this._distToTrack(x, z), 10, 26);
    return R.depth * across * (0.12 + 0.88 * (1 - near));
  }

  _riverNearest(x, z) {
    const R = this._river;
    const cx = Math.floor(x / R.CELL), cz = Math.floor(z / R.CELL);
    let best = Infinity, bk = -1;
    for (let a = -1; a <= 1; a++) {
      for (let b = -1; b <= 1; b++) {
        const arr = R.grid.get(`${cx + a},${cz + b}`);
        if (!arr) continue;
        for (const k of arr) {
          const p = R.line[k];
          const d = (p.x - x) * (p.x - x) + (p.z - z) * (p.z - z);
          if (d < best) { best = d; bk = k; }
        }
      }
    }
    return { d: best === Infinity ? Infinity : Math.sqrt(best), k: bk };
  }

  /** Distance from (x, z) to the river centreline, or Infinity past the bed. */
  _riverDist(x, z) {
    const R = this._river;
    const cx = Math.floor(x / R.CELL), cz = Math.floor(z / R.CELL);
    let best = Infinity;
    for (let a = -1; a <= 1; a++) {
      for (let b = -1; b <= 1; b++) {
        const arr = R.grid.get(`${cx + a},${cz + b}`);
        if (!arr) continue;
        for (const k of arr) {
          const p = R.line[k];
          const d = (p.x - x) * (p.x - x) + (p.z - z) * (p.z - z);
          if (d < best) best = d;
        }
      }
    }
    return best === Infinity ? Infinity : Math.sqrt(best);
  }

  // ---- end continuous river --------------------------------------------------

  /** Depth of the river gorge at (x, z): 0 everywhere outside it, easing to
   *  the full depth along the channel. Applied inside _blendHeight so the
   *  scenery field, the terrain mesh and the free-roam ground all agree. */
  /** Is (x,z) inside a jump gorge's footprint (pad grows it outward)?
   *  The rule "a gorge is a hole" needs one test every builder can ask. */
  _inJumpGorge(x, z, pad = 0) {
    if (!this._jumpGorges?.length) return false;
    for (const G of this._jumpGorges) {
      if (this._gorgeCutOne(G, x, z) > 0.4) return true;
      if (pad > 0 && this._gorgeCutOne(G, x, z) > 0.05) return true;
    }
    return false;
  }

  _gorgeCutOne(G, x, z) {
    const dx = x - G.x, dz = z - G.z;
    const u = dx * G.ax + dz * G.az;          // along the gorge
    const v = dx * G.vx + dz * G.vz;          // across it (= along the road)
    const au = Math.abs(u), av = Math.abs(v);
    if (au > G.len || av >= G.half) return 0;
    // ease out over the last 55%: keeps the floor's end grade under the
    // off-road climb limit, so a fallen car can drive out along the chasm
    const along = 1 - THREE.MathUtils.smoothstep(au, G.len * 0.38, G.len);
    // U-shaped channel: full depth down the middle, rims easing back to grade
    const prof = Math.pow(Math.cos((av / G.half) * Math.PI * 0.5), 1.5);
    return G.depth * prof * along;
  }

  /** Total chasm depth at a point: the hero-bridge gorge plus every gorge
   *  JUMP chasm (same carve, no deck — the road is simply out). */
  _gorgeCut(x, z) {
    let c = 0;
    if (this._gorge) c += this._gorgeCutOne(this._gorge, x, z);
    if (this._jumpGorges) {
      for (const G of this._jumpGorges) c += this._gorgeCutOne(G, x, z);
    }
    return c;
  }

  /** True when sample i lies within `pad` samples of the bridge span or any
   *  jump chasm (so ramps, pads, obstacles, puddles and props keep off). */
  _nearGorge(i, pad) {
    if (this._onOverpass(i, Math.min(pad, 24))) return true;
    if (this._gorge && this._circDist(i, this._gorge.i) < pad) return true;
    if (this._jumpGorges) {
      for (const G of this._jumpGorges) {
        if (this._circDist(i, G.i) < pad) return true;
      }
    }
    if (this._tunnels) {
      for (const T of this._tunnels) {
        if (i >= T.s - pad && i <= T.e + pad) return true;
      }
    }
    return false;
  }

  /** Pick where the gorge crosses the road. Runs BEFORE any geometry is built
   *  (the terrain, the skirts and the scenery all read _gorgeCut). */
  _planGorge() {
    const H = this.T.heroBridge;
    const [f0, f1] = H.at;
    let best = -1, bc = Infinity;
    for (let i = (f0 * N) | 0; i < (f1 * N) | 0; i += 2) {
      if (this._circDist(i, 0) < 70) continue;
      let mc = 0;
      for (let k = -14; k <= 14; k++) mc = Math.max(mc, this.curvature[(i + k + N) % N]);
      if (mc < bc) { bc = mc; best = i; }
    }
    if (best < 0) return;
    const c = this.center[best], t = this.tan[best], n = this.nrm[best];
    // the gorge crosses the road at a slant, not square on: from the deck the
    // chasm and its river then run away diagonally into the distance instead
    // of hiding directly beneath you
    const th = H.skew !== undefined ? H.skew : 0.72;
    const cs = Math.cos(th), sn = Math.sin(th);
    const ax = n.x * cs + t.x * sn, az = n.z * cs + t.z * sn;   // along the gorge
    const vx = -n.x * sn + t.x * cs, vz = -n.z * sn + t.z * cs; // across it
    this._gorge = {
      i: best, x: c.x, z: c.z,
      ax, az, vx, vz,
      half: H.half, len: H.len, depth: H.depth,
      // how far along the ROAD the channel reaches, given the slant
      spanU: H.half / Math.max(0.35, Math.abs(t.x * vx + t.z * vz)),
      floorY: c.y - H.depth,
    };
  }

  /** Pick the straightest stretches for the jump chasms, carve them via
   *  _gorgeCut, bake the launch kickers into the roadway, and precompute the
   *  per-sample road collapse that groundHeightAt applies. */
  _planOverpasses() {
    // XZ self-intersections of the centerline, neighbours excluded
    for (let i = 0; i < N; i++) {
      const a1 = this.center[i], a2 = this.center[(i + 1) % N];
      for (let j = i + 40; j < N; j++) {
        if (i < 40 && j > N - 40) continue;          // circular neighbours
        const b1 = this.center[j], b2 = this.center[(j + 1) % N];
        const d1x = a2.x - a1.x, d1z = a2.z - a1.z;
        const d2x = b2.x - b1.x, d2z = b2.z - b1.z;
        const den = d1x * d2z - d1z * d2x;
        if (Math.abs(den) < 1e-9) continue;
        const t = ((b1.x - a1.x) * d2z - (b1.z - a1.z) * d2x) / den;
        const u = ((b1.x - a1.x) * d1z - (b1.z - a1.z) * d1x) / den;
        if (t < 0 || t > 1 || u < 0 || u > 1) continue;
        if (this._overpasses.some((o) =>
          (this._circDist(i, o.ia) < 30 && this._circDist(j, o.ib) < 30))) continue;
        this._overpasses.push({ ia: i, ib: j, x: a1.x + t * d1x, z: a1.z + t * d1z });
        j += 30;
      }
    }
    if (!this._overpasses.length) return;
    // alternate which leg flies (the sketch's up/down arrows), bake the rise
    const CLEAR = 8.6;
    const HALF = Math.ceil(30 / this.segLen);
    this._overpasses.forEach((o, k) => {
      o.up = (k % 2 === 0) ? o.ib : o.ia;
      o.half = HALF;
      for (let sN = -HALF; sN <= HALF; sN++) {
        const j = (o.up + sN + N) % N;
        this.center[j].y += CLEAR * Math.pow(Math.cos((sN / HALF) * Math.PI / 2), 1.2);
      }
    });
  }

  /** True when sample i lies on an overpass flyover span (+pad). */
  _onOverpass(i, pad = 0) {
    for (const o of this._overpasses ?? []) {
      if (this._circDist(i, o.up) < o.half + pad) return true;
    }
    return false;
  }

  _planJumpGorges() {
    const J = this.T.gorgeJump;
    const count = J.count ?? 1;
    const half = J.half ?? 14, len = J.len ?? 190, depth = J.depth ?? 24;
    const taken = this._gorge ? [this._gorge.i] : [];
    for (let k = 0; k < count; k++) {
      let best = -1, bc = Infinity;
      for (let i = 0; i < N; i += 2) {
        if (this._circDist(i, 0) < 90) continue;
        if (taken.some((t) => this._circDist(i, t) < 140)) continue;
        let mc = 0;
        for (let w = -16; w <= 16; w++) mc = Math.max(mc, this.curvature[(i + w + N) % N]);
        if (mc < bc) { bc = mc; best = i; }
      }
      // a jump needs a genuine straight: launching mid-corner throws the car
      // off the far rim sideways, which is a trap rather than a stunt
      if (best < 0 || bc > 0.009) break;
      taken.push(best);
      const c = this.center[best], t = this.tan[best], n = this.nrm[best];
      const th = J.skew ?? 0.5;
      const cs = Math.cos(th), sn = Math.sin(th);
      const ax = n.x * cs + t.x * sn, az = n.z * cs + t.z * sn;
      const vx = -n.x * sn + t.x * cs, vz = -n.z * sn + t.z * cs;
      this._jumpGorges.push({
        i: best, x: c.x, z: c.z, ax, az, vx, vz, half, len, depth,
        spanU: half / Math.max(0.35, Math.abs(t.x * vx + t.z * vz)),
        floorY: c.y - depth,
      });
    }
    if (!this._jumpGorges.length) return;
    // launch kickers: a rising lip baked into the roadway short of each rim,
    // on BOTH sides - the race runs one way, but a spun car crosses back.
    // The physical GAP is only the deep middle of the carve (the rest keeps
    // full-grade roadway right up to a SHARP lip), and the kicker slope is
    // real: ~0.19, worth ~8 u/s of launch at racing speed - the math that
    // clears a ~21 u gap at 40+ u/s and drops anything slower in.
    for (const G of this._jumpGorges) {
      G.gapS = Math.ceil((G.spanU * 0.61 + 1) / this.segLen);
      for (const dir of [1, -1]) {
        for (let sN = 0; sN < 5; sN++) {
          const j = (G.i + dir * (G.gapS + 1 + sN) + N) % N;
          this.center[j].y += 2.3 * Math.pow(1 - sN / 5, 1.4);
        }
      }
    }
    // the collapse itself, per sample: the ribbon, the physics and the AI all
    // read the road surface through groundHeightAt, so one array does it all.
    // Shallow rim-cut is ZEROED - the roadway holds grade to the lip, then
    // the surface is simply out.
    this._jumpCut = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      let cut = 0;
      for (const G of this._jumpGorges) {
        const c1 = this._gorgeCutOne(G, this.center[i].x, this.center[i].z);
        cut += c1 >= G.depth * 0.35 ? c1 : 0;
      }
      this._jumpCut[i] = cut;
    }
  }

  _planTunnels() {
    const S = this.T.tunnels;
    const count = S.count ?? 1;
    const lenS = Math.round((S.len ?? 80) / this.segLen);
    for (let k = 0; k < count; k++) {
      let best = -1, bc = Infinity;
      for (let i = 0; i < N; i += 2) {
        if (this._circDist(i, 0) < 100) continue;
        if (this._nearGorge(i, 150)) continue;
        if (this._tunnels.some((t) => this._circDist(i, t.mid) < 170)) continue;
        let mc = 0;
        for (let w = -lenS; w <= lenS; w++) mc = Math.max(mc, this.curvature[(i + w + N) % N]);
        if (mc < bc) { bc = mc; best = i; }
      }
      // a bore through a corner self-intersects; only genuine straights bore
      if (best < 0 || bc > 0.013) break;
      const half = lenS >> 1;
      if (best - half < 0 || best + half >= N) break;    // no wrap runs
      const s0 = best - half, e0 = best + half;
      const pts = [];
      for (let j = s0; j <= e0; j += 3) {
        pts.push([this.center[j].x, this.center[j].z, this.center[j].y]);
      }
      this._tunnels.push({ mid: best, s: s0, e: e0, pts, h: S.ridge ?? 13 });
    }
  }

  /** The hill the tunnel bores through: terrain rises to roadY + h over the
   *  tunnel line, easing across ~34 u and at the portals. Applied in BOTH
   *  height fields, so physics and the visible mesh agree. */
  _tunnelRidge(x, z, h) {
    for (const T of this._tunnels) {
      let bd = 1e9, by = 0, bi = 0;
      for (let k = 0; k < T.pts.length; k++) {
        const p = T.pts[k];
        const d = (x - p[0]) * (x - p[0]) + (z - p[1]) * (z - p[1]);
        if (d < bd) { bd = d; by = p[2]; bi = k; }
      }
      bd = Math.sqrt(bd);
      if (bd > 34) continue;
      // THE BORE IS A HOLE, AND A HEIGHTFIELD CANNOT HOLD A HOLE.
      //
      // This raised the ground to roof height for ANY point within 34 u of the
      // tunnel line - the roadway included - so the hill was built straight
      // through the space the car drives in. The shell mesh was then drawn
      // inside solid rock, and the player was buried: three VIEW RESET
      // (buried) messages stacked up in the reported frame.
      //
      // So the CORRIDOR never rises. Inside the bore's half-width the ground
      // is held at or below the roadway, and the flank ramps up over the next
      // dozen units, which is what makes the hillside close in beside the road
      // instead of standing as a wall on the verge.
      const CORR = TUNNEL_HW + 2.0, FLANK = TUNNEL_HW + 14.0;
      if (bd < CORR) { h = Math.min(h, by - 1.2); continue; }
      const open = Math.min(1, (bd - CORR) / (FLANK - CORR));
      const across = Math.pow(Math.cos((bd / 34) * Math.PI * 0.5), 1.3);
      const ease = Math.min(1, Math.min(bi, T.pts.length - 1 - bi) / 3);
      const w = across * ease * open;
      if (w < 0.06) continue;
      h = Math.max(h, by + T.h * w);
    }
    return h;
  }

  /** Rolling-hill height used by scenery placement and the free-roam mode's
   *  per-frame ground queries (track distance is cached). Near the road it
   *  blends to the ROAD's elevation at the nearest centerline sample, so the
   *  meadow rises to meet the climbing road; the strand cap (_roadClampY)
   *  keeps it under any OTHER ribbon passing close by. */
  /** Signed distance to the theme's coastline, positive on the SEA side. */
  _coastSide(x, z) {
    const C = this.T.coast;
    const abx = C.b[0] - C.a[0], abz = C.b[1] - C.a[1];
    return ((x - C.a[0]) * abz - (z - C.a[1]) * abx) / Math.hypot(abx, abz);
  }

  /** Seaward of the coastline the land sinks to the sea floor over a beach
   *  band. The road corridor is exempt exactly the way the river carve
   *  exempts it, so the seafront straight keeps its shoulder. */
  _coastDepress(x, z, h, dRoad) {
    const C = this.T.coast;
    const sd = this._coastSide(x, z);
    if (sd <= 0) return h;
    const w = smoothstep01(Math.min(1, sd / (C.beach ?? 60)))
      * THREE.MathUtils.smoothstep(dRoad, 24, 44);
    return h * (1 - w) + (C.floor ?? -7) * w;
  }

  /** Nothing gets BUILT in the sea — no cottage on the seabed, no sheep
   *  grazing underwater. Placement, not physics: driving in is allowed and
   *  the water is scenery (the ford machinery is the wet physics). */
  _underwater(x, z) {
    const C = this.T.coast;
    if (!C) return false;
    return this.terrainHeight(x, z) < (C.level ?? -2) + 0.6;
  }

  /** IN WATER - sea OR river. `_underwater` only ever knew about the sea, so
   *  every scatter that used it still dropped its props into the river: straw
   *  bales standing in the current, trees growing mid-stream. One test now
   *  covers both, and anything that would look absurd wet asks it. */
  _inWater(x, z) {
    if (this._underwater(x, z)) return true;
    if (!this._river) return false;
    const R = this._river;
    return this._riverDist(x, z) < (R.half ?? 8) + 2.5;
  }

  /** Harbour worlds only: the open stone strip between the seafront road and
   *  the water. Nothing leafy scatters here — the reference quay is bare
   *  stone, bollards and barrels, not a shrubbery with a sea view. */
  _onQuayStrip(x, z) {
    return !!this.T.quay && !!this.T.coast && this._coastSide(x, z) > -30;
  }

  terrainHeight(x, z) {
    const fld = this._roadFieldCoarse(x, z);
    let h = this._blendHeight(fld.d, fld.y, x, z);
    if (this.T.coast) h = this._coastDepress(x, z, h, fld.d);
    if (fld.d <= 27) {
      const clamp = this._roadClampY(x, z);
      if (clamp < Infinity) h = Math.min(h, clamp - 0.45);
    }
    return this._roadFloor(x, z, h, fld.d);
  }

  /** THE ROAD IS THE FLOOR — the hard guarantee, applied last.
   *
   *  Everything above works off a COARSE road field, which bilinearly mixes
   *  the heights of whatever strands are nearby. Where two legs of a pass run
   *  close at different elevations that mix is not either of them, so the
   *  ground beside the lower leg could still come out above its surface —
   *  measured up to 1.9 u proud at the road edge on Gotthard, which is the
   *  carriageway disappearing into the hillside.
   *
   *  So after all the blending, take the height of the ACTUAL nearest road
   *  sample and refuse to let the ground near it exceed that. Cheap because it
   *  only runs near the road, and exact because it scans the centreline rather
   *  than a smoothed field. Eased out over the verge so the shoulder still
   *  rises naturally away from the carriageway instead of ending in a step. */
  _roadFloor(x, z, h, coarseD) {
    if (coarseD > 34) return h;                 // nowhere near the road
    let best = Infinity, bi = 0;
    for (let i = 0; i < N; i += 4) {
      const dx = x - this.center[i].x, dz = z - this.center[i].z;
      const d2 = dx * dx + dz * dz;
      if (d2 < best) { best = d2; bi = i; }
    }
    for (let k = -4; k <= 4; k++) {             // refine around the coarse pick
      const i = (bi + k + N) % N;
      const dx = x - this.center[i].x, dz = z - this.center[i].z;
      const d2 = dx * dx + dz * dz;
      if (d2 < best) { best = d2; bi = i; }
    }
    const d = Math.sqrt(best);
    return Math.min(h, this._roadCeil(bi, d));
  }

  /** The highest the ground may be at distance `d` from road sample `bi`.
   *
   *  This started as a smoothstep that relaxed the clamp over 15 u, and that
   *  is the wrong shape for the job. The RIBBON is drawn wider than the
   *  drivable width (widthAt + WALL_OFF + 0.6 - ROAD_HALF, a fringe of about
   *  2 u), and the terrain mesh only samples every 10 u. So a vertex just
   *  inside the fringe was clamped hard while its neighbour a cell further out
   *  was barely clamped at all, and the triangle BETWEEN them crossed back up
   *  over the ribbon's outer edge — the jagged wedges of grass eating into the
   *  carriageway. In a cutting, where the ground climbs fast, that is most of
   *  the road edge.
   *
   *  A cone fixes it by construction: full clearance right across the visible
   *  ribbon, then a straight ramp away at a bounded gradient. Because the
   *  ceiling is linear in `d`, interpolating between two vertices that both
   *  satisfy it cannot produce a point that violates it — which is exactly the
   *  guarantee the smoothstep could not give. 0.5 still lets a hillside climb
   *  10 u within 20 u of the verge, so cuttings still read as cuttings. */
  _roadCeil(bi, d) {
    // a tunnel stretch inverts the contract: the hill is SUPPOSED to stand
    // over the carriageway there - the bore shell keeps it readable
    if (this._tunnels) {
      for (const T of this._tunnels) {
        if (bi >= T.s && bi <= T.e) return this.center[bi].y + T.h + 6;
      }
    }
    const drivable = this.widthAt ? this.widthAt(bi) : ROAD_HALF;
    // the ribbon as DRAWN, not as driven — the fringe is part of the road
    const ribbon = drivable + (WALL_OFF + 0.6 - ROAD_HALF);
    const edge = ribbon + 1.5;
    return this.center[bi].y - 0.35 + Math.max(0, d - edge) * 0.5;
  }

  /** Is this point inside a tunnel bore, and if so what is the bore there?
   *
   *  Anything that reasons about "the ground" needs to know, because over a
   *  tunnel the terrain height IS the hill overhead: a rule that keeps you
   *  above the ground will happily put you on top of the mountain. Returns
   *  {i, floorY, apex, half} for the bore at (pos), or null outside. Tunnel
   *  runs never wrap the index (_planTunnels refuses them), so a plain range
   *  test is enough. */
  tunnelAt(pos, hint = null, pad = 0) {
    if (!this._tunnels?.length) return null;
    const bi = this.nearestIndex(pos, hint);
    for (const T of this._tunnels) {
      // `pad` reaches past the portals, because the ridge EASES out over ~34 u
      // either side: the hill still stands over the sightline for a while
      // after the bore proper has ended.
      if (bi < T.s - pad || bi > T.e + pad) continue;
      if (Math.abs(this.lateralOffset(pos, bi)) > TUNNEL_HW) continue;
      return { i: bi, floorY: this.center[bi].y, apex: TUNNEL_APEX, half: TUNNEL_HW };
    }
    return null;
  }

  /** Terrain-MESH vertex height: same blend as terrainHeight but with an
   *  EXACT full-resolution nearest scan (build-time only) — the coarse
   *  bilinear field mixes y values of different strands where two road
   *  strands at different elevations pass near each other, which is what
   *  tore the terrain into sawtooth wedges through the ribbon. */
  _terrainMeshHeight(x, z) {
    let best = Infinity, bi = 0;
    for (let i = 0; i < N; i += 3) {
      const dx = x - this.center[i].x, dz = z - this.center[i].z;
      const d = dx * dx + dz * dz;
      if (d < best) { best = d; bi = i; }
    }
    for (let k = -2; k <= 2; k++) {
      const i = (bi + k + N) % N;
      const dx = x - this.center[i].x, dz = z - this.center[i].z;
      const d = dx * dx + dz * dz;
      if (d < best) { best = d; bi = i; }
    }
    const d = Math.sqrt(best);
    let h = this._blendHeight(d, this.center[bi].y, x, z);
    // the coast term must live in BOTH ground functions: this one builds the
    // mesh the player SEES, terrainHeight() the ground physics STANDS ON.
    // With the term only in the latter, the physics said "seabed at -7" while
    // the rendered land stayed dry — the sea existed as scattered pokes.
    if (this.T.coast) h = this._coastDepress(x, z, h, d);
    if (d <= 27) {
      // exact strand cap (window/exclusion mirror _roadClampY)
      let clamp = Infinity;
      for (let i = 0; i < N; i += 2) {
        const di = Math.abs(i - bi);
        const gap = Math.min(di, N - di);
        if (gap <= 12) continue;
        const dx = x - this.center[i].x, dz = z - this.center[i].z;
        const d2 = dx * dx + dz * dz;
        if (d2 < 11 * 11 || d2 > 25.2 * 25.2 || this.center[i].y >= clamp) continue;
        if (Math.sqrt(d2) > 0.72 * gap * this.segLen) continue;
        clamp = this.center[i].y;
      }
      if (clamp < Infinity) h = Math.min(h, clamp - 0.45);
    }
    // and the same hard ceiling the physics height uses — this is the function
    // that actually feeds the rendered vertices, so without it the ground can
    // still be DRAWN through the carriageway even when the car drives level
    h = Math.min(h, this._roadCeil(bi, d));
    return h;
  }

  // ---------- track construction ----------
  _buildRoad() {
    const geo = new THREE.BufferGeometry();
    const verts = new Float32Array((N + 1) * 2 * 3);
    const uvs = new Float32Array((N + 1) * 2 * 2);
    const idx = [];
    for (let i = 0; i <= N; i++) {
      const j = i % N;
      const c = this.center[j], n = this.nrm[j];
      // ---- width-variation: the ribbon follows the drivable width profile
      // (fringe margin beyond ROAD_HALF is preserved, so edges converge) ----
      const w = this.widthAt(j) + (WALL_OFF + 0.6 - ROAD_HALF);
      const o = i * 6;
      // under a hero bridge the ribbon drops away so the plank deck laid on
      // top of it is never coplanar (coplanar strips z-fight into dark bands
      // at grazing angles). Physics still reads center[j].y — the DECK is the
      // surface the car drives on there.
      const y = c.y - this._deckDip(j);
      verts[o] = c.x + n.x * w; verts[o + 1] = y; verts[o + 2] = c.z + n.z * w;
      verts[o + 3] = c.x - n.x * w; verts[o + 4] = y; verts[o + 5] = c.z - n.z * w;
      const v = (i * this.segLen) / 10;
      uvs[i * 4] = 0; uvs[i * 4 + 1] = v;
      uvs[i * 4 + 2] = 1; uvs[i * 4 + 3] = v;
    }
    for (let i = 0; i < N; i++) {
      const a = i * 2, b = i * 2 + 1, c = i * 2 + 2, d = i * 2 + 3;
      idx.push(a, b, c, b, d, c);
    }
    geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    const tex = roadTexture(this.T.road);
    tex.anisotropy = 8;
    // surface condition drives the material response: wet roads go glossy and
    // catch the scene environment (main.js supplies a PMREM env), snow stays
    // soft with a faint icy sheen, dry dirt is fully rough as before.
    // envMapIntensity is a standard-material property, safe before env exists.
    const surf = this.T.surface;
    // Roughness pulled UP and env pulled DOWN from 0.30/1.3 and 0.55/0.6: with
    // the key light now ~35 % stronger and raked lower, a 0.30-rough road threw
    // a broad white specular smear straight down the carriageway that the bloom
    // pass then blew out — the same failure mode as the sun billboard. Wet road
    // still reads wet (sheen + the roadTexture's own gleam), it just no longer
    // mirrors the sun into the player's eyes.
    const mat = new THREE.MeshStandardMaterial({
      map: tex, metalness: 0,
      roughness: surf === 'wet' ? 0.52 : surf === 'snow' ? 0.7 : 1,
      envMapIntensity: surf === 'wet' ? 0.75 : surf === 'snow' ? 0.45 : 1,
    });
    // NEO-KYOTO: the edge line-work glows through an emissive companion map
    // (black except the lines) so bloom catches it against the night
    if (this.T.roadNeon) {
      mat.emissive = new THREE.Color(0xffffff);
      mat.emissiveMap = roadNeonEmissiveTexture(this.T.roadNeon);
      mat.emissiveMap.anisotropy = 8;
      mat.emissiveIntensity = 1.7;
    }
    // ...and belt-and-braces on top of the tuck: bias the road toward the
    // camera in the depth test so that even where a stray terrain triangle
    // does come up level with it, the carriageway is what you see. The road is
    // the one surface in this game that must never be occluded by the ground.
    mat.polygonOffset = true;
    mat.polygonOffsetFactor = -4;
    mat.polygonOffsetUnits = -4;
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = 'road';
    mesh.receiveShadow = true;
    mesh.renderOrder = 1;
    this.group.add(mesh);
  }

  /** How far the road ribbon drops below the centerline at sample j so a hero
   *  bridge deck can sit on top of it (0 everywhere else). Feathered over a
   *  few samples at each end so the ribbon has no hard step. */
  _deckDip(j) {
    if (!this._gorge) return 0;
    const d = this._circDist(j, this._gorge.i);
    const span = this._spanSamples();
    if (d > span + 4) return 0;
    return 0.34 * (1 - THREE.MathUtils.smoothstep(d, span - 1, span + 4));
  }

  /** Mountain-pass embankments (ascent-profile levels): a dirt apron drops
   *  from each road edge down the slope, so from below every switchback leg
   *  reads as a chunky stacked band on the face instead of an edge-on sliver.
   *  On the uphill side the apron simply buries itself inside the hill. */
  _buildRoadSkirts() {
    // Pass worlds are built as a shelf cut into the face: instead of a broad
    // dirt apron the edge falls almost vertically, so each switchback leg
    // reads as its own stone-faced terrace with the parapet on its lip.
    const steep = !!(this.T.retainingWalls || this.T.shelfRoad);
    const dirt = this.T.skirtColor
      ? new THREE.Color(this.T.skirtColor)
      : new THREE.Color(this.T.terrainDirt).lerp(new THREE.Color(0x8a5a32), 0.4);
    const dark = dirt.clone().multiplyScalar(steep ? 0.86 : 0.7);
    for (const side of [1, -1]) {
      const rows = 3;
      const verts = new Float32Array((N + 1) * rows * 3);
      const colors = new Float32Array((N + 1) * rows * 3);
      const idx = [];
      for (let i = 0; i <= N; i++) {
        const j = i % N;
        const c = this.center[j], n = this.nrm[j];
        const t = j * (Math.PI * 2 / N);
        // On the INSIDE of tight turns the apron may not reach past the turn
        // radius, or the ribbon folds over itself and sweeps up across the
        // road (visible as pale shards on hairpins/S-folds). Clamp reach.
        const a = this.tan[j], b = this.tan[(j + 8) % N];
        const insideSign = (a.x * b.z - a.z * b.x) > 0 ? 1 : -1;
        const maxLat = side === insideSign
          ? Math.max(WALL_OFF + 0.6, 0.85 / Math.max(this.curvature[j], 1e-4))
          : Infinity;
        // [lateral, y, color] — a shoulder lip, a steep face, and a toe that
        // reaches down to the LOCAL terrain (strand-capped folds drop far
        // below the road; a fixed-depth toe would hang in the air there)
        // over the gorge the road is a bridge deck: the apron collapses to a
        // thin lip instead of hanging a curtain down into the chasm
        const onSpan = (this._gorge && this._circDist(j, this._gorge.i) < this._spanSamples() + 4)
          || this._onOverpass(j, 4);
        // ---- width-variation: skirts hug the (possibly pinched) road edge ----
        const wOff = WALL_OFF + this.widthAt(j) - ROAD_HALF;
        const face = onSpan ? 0.5 : steep
          ? 1.35 + Math.sin(9 * t + side) * 0.18
          : 2.6 + Math.sin(9 * t + side) * 0.4;
        const latToe = Math.min(wOff + face + (onSpan ? 0.3 : steep ? 1.1 : 2.8), maxLat);
        const ground = this._terrainMeshHeight(c.x + n.x * latToe * side, c.z + n.z * latToe * side);
        // on a bridge span the apron collapses to a hair under the deck edge
        const toeY = onSpan ? c.y - 1.6 : Math.min(c.y - 2.9, ground - 0.6);
        const rowSpec = [
          [Math.min(wOff + 0.55, maxLat), c.y - (onSpan ? 0.34 : 0.06), dirt],
          [Math.min(wOff + face, maxLat),
            c.y - (steep ? 1.5 : 2.1) - Math.sin(17 * t - side) * 0.35, dirt],
          [latToe, toeY, dark],
        ];
        for (let r = 0; r < rows; r++) {
          const [lat, y, col] = rowSpec[r];
          const o = (i * rows + r) * 3;
          verts[o] = c.x + n.x * lat * side;
          verts[o + 1] = y;
          verts[o + 2] = c.z + n.z * lat * side;
          colors[o] = col.r; colors[o + 1] = col.g; colors[o + 2] = col.b;
        }
      }
      for (let i = 0; i < N; i++) {
        for (let r = 0; r < rows - 1; r++) {
          const a = i * rows + r, b = a + 1, c = (i + 1) * rows + r, d = c + 1;
          idx.push(a, c, b, b, c, d);
        }
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geo.setIndex(idx);
      geo.computeVertexNormals();
      const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
        vertexColors: true, roughness: 1, side: THREE.DoubleSide,
      }));
      mesh.name = 'road-skirt';
      mesh.receiveShadow = true;
      this.group.add(mesh);
    }
  }

  _buildWalls() {
    if (this.T.cliffWalls) {
      // Slot-canyon look: tall stratified cliff ribbons just outside the road.
      // Purely visual — the physics clamp stays at WALL_OFF like every level.
      // T.cliffPalette re-skins the face per theme (glacial blue-white ice).
      const tex = cliffTexture(this.T.cliffPalette);
      tex.anisotropy = 4;
      this._cliffRibbon(1, tex);
      this._cliffRibbon(-1, tex);
      return;
    }
    // Open-world tracks: no fences anywhere. The road is fastest; drifting
    // wide just puts you on slow rough ground (see RULES.md — off-road IS
    // the boundary). Canyon keeps its rock walls above because stone is real.
  }

  /** Deterministic canyon-wall profile at sample j (independent of Math.random
   *  so cactus/rim placement can query the same shape). All frequencies are
   *  integer multiples of one lap, so the ribbon closes seamlessly. */
  _cliffProfile(j, side) {
    const t = (j % N) * (Math.PI * 2 / N);
    const ph = side * 2.13;                      // asymmetric left/right walls
    // the walls open up around the start line so the gate + grandstand read
    const gap = THREE.MathUtils.smoothstep(this._circDist(j % N, 0), 30, 85);
    let h = (this.T.cliffHeight ?? 18)
      + Math.sin(9 * t + ph) * 2.6
      + Math.sin(23 * t + 1.3 - ph) * 1.5
      + Math.sin(61 * t + 4.1 + ph) * 0.9;       // ≈14–22 when fully walled
    // A MESA RIM IS CASTELLATED, NOT WAVY. Erosion bays cut flat-bottomed
    // notches into the skyline and the odd tower stands proud - which is most
    // of the reference's "ruined fortress" mood before any building exists.
    // Integer frequencies keep the seam-closure contract above, and because
    // the rim cacti query THIS function, they follow the new skyline free.
    const notch = this.T.cliffRimNotch ?? 0;
    if (notch > 0) {
      const nb = THREE.MathUtils.smoothstep(Math.sin(29 * t + 2.6 * ph), 0.55, 0.9);
      h -= notch * nb * nb * (this.T.cliffHeight ?? 18) * 0.45;
      const tw = THREE.MathUtils.smoothstep(Math.sin(53 * t - 1.7 * ph), 0.78, 0.97);
      h += notch * tw * tw * 5;
    }
    h = Math.max(1.7, h * gap);                  // low stone berm through the gap
    // cliffSetback pushes the faces off the verge: the corridor becomes a
    // DEEP VALLEY with a drivable floor, not a walled slot ("don't build
    // walled track in desert - or make it look like a deep valley")
    const base = WALL_OFF + 0.65 + (this.T.cliffSetback ?? 0)
      + 0.24 * (Math.sin(31 * t + 2.2 + ph) + 1);
    const l1 = 0.85 + 0.5 * Math.sin(17 * t + 0.7 - ph);   // mid-face lean
    const l2 = 2.0 + 0.85 * Math.sin(13 * t + 2.9 + ph) + 0.4 * Math.sin(47 * t - ph);
    return { h, base, l1, l2 };
  }

  _cliffRibbon(side, tex) {
    const rows = 5;                       // base, mid, rim edge, rim plateau, outer ground
    const verts = new Float32Array((N + 1) * rows * 3);
    const uvs = new Float32Array((N + 1) * rows * 2);
    const cols = new Float32Array((N + 1) * rows * 3);
    const idx = [];
    // STRATA ARE HORIZONTAL IN THE WORLD, NOT ON THE WALLPAPER. The v
    // coordinate used to be a fraction of the LOCAL wall height, so the bands
    // stretched with the profile swing and rode up and down with the road -
    // wallpaper glued to a ribbon. v now maps WORLD height across the wall's
    // global extremes, so the rim rises and falls THROUGH the layers the way
    // sedimentary rock actually does. One deterministic prepass finds the
    // extremes; the texture's own baked bleach/talus stripes stop tracking
    // the rim, so rim light and talus shade move into vertex colours below.
    let yMin = Infinity, yMax = -Infinity;
    for (let j = 0; j < N; j++) {
      const base = this.center[j].y;
      const Pp = this._cliffProfile(j, side);
      if (base < yMin) yMin = base;
      if (base + Pp.h > yMax) yMax = base + Pp.h;
    }
    const ySpan = Math.max(1, yMax - yMin);
    // deterministic per-vertex jitter, identical at the i=0 / i=N seam
    const hash = (n) => { const s = Math.sin(n) * 43758.5453; return s - Math.floor(s); };
    for (let i = 0; i <= N; i++) {
      const j = i % N;
      const c = this.center[j], n = this.nrm[j];
      const P = this._cliffProfile(j, side);
      const jt = (k) => hash(j * 12.9898 + k * 78.233 + side * 37.719) - 0.5;
      const tt = j * (Math.PI * 2 / N);
      const rimY = Math.max(0.9, P.h * 0.97 + jt(9) * 0.5);
      const rowSpec = [                            // [lateral, y, v]
        [P.base + jt(0) * 0.14, 0, 0.02],
        [P.base + P.l1 + jt(1) * 0.55, P.h * 0.52 + jt(2) * 0.7, 0.5],
        [P.base + P.l2 + jt(3) * 0.55, P.h + jt(4) * 0.8, 0.985],  // noisy rim edge
        [P.base + P.l2 + 5.5 + Math.sin(29 * tt + side) * 1.2, rimY, 0.94],
        [P.base + P.l2 + 12.5 + Math.sin(19 * tt - side) * 2.0, 0, 0.10],
      ];
      const u = (i * this.segLen) / 20;
      for (let r = 0; r < rows; r++) {
        const [lat, y] = rowSpec[r];
        const o = (i * rows + r) * 3;
        verts[o] = c.x + n.x * lat * side;
        verts[o + 1] = c.y + y;                // cliffs base at (and ride) the road y
        verts[o + 2] = c.z + n.z * lat * side;
        uvs[(i * rows + r) * 2] = u;
        // world-height v: 0 at the lowest wall foot anywhere on the lap, 1 at
        // the highest rim - horizontal geology by construction
        uvs[(i * rows + r) * 2 + 1] = 0.02 + 0.96
          * THREE.MathUtils.clamp((c.y + y - yMin) / ySpan, 0, 1);
        // rim light / talus shade / per-column life, never above 1.0
        const shade = (r === 2 || r === 3 ? 1.0 : r === 1 ? 0.95 : 0.83)
          * (0.96 + jt(r + 11) * 0.08);
        cols[o] = cols[o + 1] = cols[o + 2] = Math.min(1, shade);
      }
    }
    for (let i = 0; i < N; i++) {
      for (let r = 0; r < rows - 1; r++) {
        const a = i * rows + r, b = a + 1, c = (i + 1) * rows + r, d = c + 1;
        idx.push(a, c, b, b, c, d);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
      map: tex, roughness: 1, side: THREE.DoubleSide, vertexColors: true,
    }));
    mesh.receiveShadow = true;
    this.group.add(mesh);
  }

  _checkerFlag(x, y, z) {
    const flag = new THREE.Mesh(
      new THREE.PlaneGeometry(1.7, 1.1),
      new THREE.MeshBasicMaterial({ map: checkerTexture(), side: THREE.DoubleSide })
    );
    flag.material.map = checkerTexture();
    flag.material.map.repeat.set(3, 1);
    flag.geometry.translate(0.85, 0, 0); // pivot at the pole
    flag.position.set(x, y, z);
    this.group.add(flag);
    this.animated.flags.push({ mesh: flag, phase: Math.random() * 9 });
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.07, 2.2, 6),
      new THREE.MeshStandardMaterial({ color: 0xd8d2c2 })
    );
    pole.position.set(x, y - 0.4, z);
    this.group.add(pole);
  }

  _buildStartGate() {
    const i = 0;
    const c = this.center[i], n = this.nrm[i];
    const heading = this.headingAt(i);
    // checkered strip on the road
    const strip = new THREE.Mesh(
      new THREE.PlaneGeometry(ROAD_HALF * 2 + 2, 4),
      new THREE.MeshBasicMaterial({ map: checkerTexture(), transparent: true, opacity: 0.92 })
    );
    strip.material.map.repeat.set(5, 1);
    strip.rotation.order = 'YXZ';
    strip.rotation.y = heading;
    strip.rotation.x = -Math.PI / 2;
    strip.position.set(c.x, c.y + 0.04, c.z);  // start area is flat (c.y = 0)
    this.group.add(strip);

    // scaffold towers + banner
    const wood = new THREE.MeshStandardMaterial({
      color: 0x5d4426, roughness: 0.8, envMapIntensity: 0.5,
    });
    const steel = new THREE.MeshStandardMaterial({
      color: 0x4a4640, roughness: 0.35, metalness: 0.7, envMapIntensity: 0.5,
    });
    for (const side of [1, -1]) {
      const bx = c.x + n.x * 12.5 * side, bz = c.z + n.z * 12.5 * side;
      for (const [ox, oz] of [[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 10, 8), steel);
        leg.position.set(bx + ox, 5, bz + oz);
        leg.castShadow = true;
        this.group.add(leg);
        this.solids.push({ x: bx + ox, z: bz + oz, r: 0.6, y: c.y, mat: 'metal' });
      }
      for (let ly = 2.5; ly <= 8.5; ly += 3) {
        const brace = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.22, 2.1), wood);
        brace.position.set(bx, ly, bz);
        brace.castShadow = true;
        this.group.add(brace);
      }
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.7, 2.6), wood);
      cabin.position.set(bx, 10, bz);
      cabin.castShadow = true;
      this.group.add(cabin);
      this._addShadow(bx, bz, 2.6, c.y);        // grounds the gantry legs
      // waving checkered flags on the towers
      this._checkerFlag(bx, 11.8, bz);
    }
    const banner = new THREE.Mesh(
      new THREE.BoxGeometry(26, 2.4, 0.5),
      new THREE.MeshStandardMaterial({ map: wallTexture(), roughness: 0.85 })
    );
    banner.material.map = wallTexture();
    banner.material.map.repeat.set(6, 1);
    banner.position.set(c.x, 9, c.z);
    banner.rotation.y = heading;
    banner.castShadow = true;
    this.group.add(banner);

    // FINISH banner hung on the crossbar, visible from both directions
    const finTex = finishBannerTexture();
    for (const flip of [0, Math.PI]) {
      const fin = new THREE.Mesh(
        new THREE.PlaneGeometry(24, 2.15),
        new THREE.MeshStandardMaterial({ map: finTex, roughness: 0.85 })
      );
      fin.position.set(c.x, 9, c.z);
      fin.rotation.y = heading + flip;
      fin.translateZ(0.32);
      this.group.add(fin);
    }

    // traffic-light box hanging from the banner
    const housing = new THREE.Mesh(
      new THREE.BoxGeometry(7.4, 2.6, 1.2),
      new THREE.MeshStandardMaterial({
        color: 0x24211c, roughness: 0.35, metalness: 0.7, envMapIntensity: 0.5,
      })
    );
    housing.position.set(c.x, 6.6, c.z);
    housing.rotation.y = heading;
    housing.castShadow = true;
    this.group.add(housing);
    this.lampMats = {};
    const lampSpecs = [['red', -2.3, 0xff3222], ['yellow', 0, 0xffd022], ['green', 2.3, 0x35e04a]];
    for (const [name, off, lit] of lampSpecs) {
      const mat = new THREE.MeshBasicMaterial({ color: 0x2a2622 });
      mat.userData = { lit: new THREE.Color(lit), dim: new THREE.Color(lit).multiplyScalar(0.12) };
      mat.color.copy(mat.userData.dim);
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.85, 14, 10), mat);
      lamp.position.set(c.x, 6.6, c.z);
      lamp.rotation.y = heading;
      lamp.translateX(off);
      this.group.add(lamp);
      this.lampMats[name] = mat;
    }
    this.setLights('red');
  }

  /** phase: 'red' | 'yellow' | 'green' | 'off' */
  setLights(phase) {
    for (const [name, mat] of Object.entries(this.lampMats)) {
      mat.color.copy(name === phase ? mat.userData.lit : mat.userData.dim);
    }
  }

  _circDist(a, b) {
    const d = Math.abs(a - b) % N;
    return Math.min(d, N - d);
  }

  _buildBoostPads() {
    // Boost pads are GONE. Speed should come from driving — the racing line,
    // a slipstream tow, nitro you earned — not from stamped chevrons that hand
    // it out for touching the right patch of road. Array kept so the "clear of
    // a pad" placement guards elsewhere still resolve.
    this.boostPads = [];
    if (this.boostPads.length === 0) return;
    const tex = chevronTexture();
    const min = this.T.padMaxCurv;
    let last = -999;
    for (let i = 40; i < N && this.boostPads.length < 5; i += 10) {
      if (this._nearNarrow(i, 14)) continue; // ---- width-variation: pads clear of pinches
      if (this.ramps.some((r) => this._circDist(i, r.index) < 50)) continue;
      if (this._nearGorge(i, 50)) continue;
      if (this.curvature[i] < min && i - last > 140) {
        last = i;
        const lateral = (this.boostPads.length % 2 === 0) ? -3.2 : 3.2;
        this.boostPads.push({ index: i, lateral });
        const p = this.pointAt(i, lateral);
        const pad = new THREE.Mesh(
          new THREE.PlaneGeometry(5.4, 8.5),
          new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })
        );
        pad.rotation.order = 'YXZ';
        pad.rotation.y = this.headingAt(i);
        // pitch the decal to hug the sloped road (tilt back on climbs)
        pad.rotation.x = -Math.PI / 2 - Math.atan(this.slopeAt(i));
        pad.position.set(p.x, p.y + 0.06, p.z);
        this.group.add(pad);
      }
    }
  }

  /** Natural jumps: the ROAD ITSELF lifts into a smooth crest — a rise, a
   *  brow, and a fall you can launch off if you take it fast enough. This
   *  replaces the old prop ramps, which were plywood wedges bolted onto the
   *  surface that launched you off a hard lip at their far edge. A crest is
   *  landscape, not furniture: take it slowly and you simply roll over it.
   *
   *  Baked into the elevation profile (see the call site) rather than added by
   *  `groundHeightAt`, so everything downstream inherits the shape.
   *
   *  The hump is half a cosine wave, which starts and ends with ZERO gradient —
   *  no lip to catch a wheel, and the join into the flat road is invisible. */
  _buildCrests() {
    this.crests = [];
    // Two or three identical humps a lap is not "jumps in the road", it is a
    // feature you meet twice and stop noticing. More of them, and no two the
    // same size: a long shallow brow you skim, a short sharp one that throws
    // the car, and everything between. Heights and lengths are rolled per
    // crest, so a world is not the same set of jumps every time you load it.
    const want = (this.T.rampCount || 3) + 3;
    const baseH = this.T.crestHeight ?? 2.9;
    const len = 22;                       // nominal samples spanned by the hump
    // rank windows by how straight they are across the crest's full length —
    // a jump landing mid-corner is a wreck, not a thrill
    const windows = [];
    for (let i = 0; i < N; i += 5) {
      if (i < 60 || i > N - 90) continue;   // clear of the start gate
      if (this._nearNarrow(i, 30)) continue; // never inside a pinch
      let maxCurv = 0;
      for (let k = -4; k < len + 2; k++) maxCurv = Math.max(maxCurv, this.curvature[(i + k + N) % N]);
      windows.push({ i, maxCurv });
    }
    windows.sort((a, b) => a.maxCurv - b.maxCurv);
    // tighter spacing than before, or the extra crests have nowhere to go
    const gap = Math.min(120, ((N - 150) / want) | 0);
    const chosen = [];
    const take = (limit) => {
      for (const w of windows) {
        if (chosen.length >= want) return;
        if (w.maxCurv > limit) return;               // sorted: nothing later is straighter
        if (this._nearGorge(w.i, 60)) continue;
        if (chosen.some((c) => this._circDist(w.i, c) < gap)) continue;
        chosen.push(w.i);
      }
    };
    take(this.T.rampMaxCurv);
    // A twisty circuit can have no window straight enough to clear the ramp
    // threshold, which used to mean a track with no jumps at all. Crests are
    // part of the terrain now, not bolted-on furniture, so every world gets
    // some: relax the straightness limit until the quota is filled, rather than
    // stopping at two. PINE VALLEY was shipping a single jump a lap this way.
    if (chosen.length < want) take(this.T.rampMaxCurv * 2.2);
    if (chosen.length < want) take(this.T.rampMaxCurv * 4);
    if (chosen.length < Math.min(3, want)) take(Infinity);
    for (const i of chosen) {
      // A SHORT crest of a given height is a launch; a LONG one of the same
      // height is a brow you float over. Rolling the two together is what makes
      // them feel like different jumps rather than one jump repeated.
      const h = baseH * (0.72 + Math.random() * 0.85);       // ~2.1 .. 4.6 u
      const L = Math.round(len * (0.7 + Math.random() * 0.7)); // ~15 .. 33 samples
      this.crests.push({ index: i, len: L, height: +h.toFixed(2) });
      for (let k = 0; k < L; k++) {
        const f = k / L;                                     // 0..1 across it
        this.center[(i + k) % N].y += h * 0.5 * (1 - Math.cos(f * Math.PI * 2));
      }
    }
    // the elevation just changed under us — the grade the physics and the mesh
    // pitching read has to be rebuilt or cars will climb a hill they can't feel
    for (let i = 0; i < N; i++) {
      this._slope[i] =
        (this.center[(i + 2) % N].y - this.center[(i - 2 + N) % N].y) / (4 * this.segLen);
    }
  }

  /** OUTBACK RED DIRT: dry creek crossings — the region's signature terrain
   *  event, and the reason it needs geometry that did not exist.
   *
   *  A crest is the OPPOSITE shape: it is a hump, it is visible from a long
   *  way back, and it launches you off its own brow. A creek is a NOTCH. The
   *  plain runs dead flat to the lip, drops a bank at ~15 % into a sand bed
   *  and climbs the far one, and the far bank is where a car carrying 150 km/h
   *  leaves the ground — you cannot see the fall until you are on it, which is
   *  precisely why the Bible makes the river red gums grow ONLY on the creek
   *  line: the tree line is the advance warning, and `_buildOutbackScrub`
   *  reads the wash polylines planted here to honour that.
   *
   *  Same construction contract as `_buildCrests`: baked into center[].y
   *  before any mesh exists, so the road ribbon, the shoulder skirts, the
   *  terrain blend and every scatter inherit the cut for free. The profile is
   *  a full negative cosine wave, which starts and ends at ZERO gradient —
   *  there is no lip to catch a wheel, only the fall.
   *
   *  `T.creeks` = {count, depth, len, half}. Absent on every other theme, so
   *  this returns before it can touch anyone else's seeded RNG stream.
   */
  _planCreeks() {
    this.creeks = [];
    const S = this.T.creeks;
    if (!S || !(S.count > 0)) return;
    const want = S.count | 0;
    const depth = S.depth ?? 3.6;
    const baseLen = S.len ?? 34;
    // straight-ish only: a bank taken at an angle is a barrel roll, not a jump
    const maxCurv = (this.T.rampMaxCurv ?? 0.014) * 1.2;
    const windows = [];
    for (let i = 0; i < N; i += 4) {
      if (i < 70 || i > N - 90) continue;             // clear of the start gate
      if (this._nearNarrow(i, 30)) continue;
      let mc = 0;
      for (let k = -6; k < baseLen + 6; k++) mc = Math.max(mc, this.curvature[(i + k + N) % N]);
      windows.push({ i, mc });
    }
    windows.sort((a, b) => a.mc - b.mc);
    const chosen = [];
    // The crests are already down and each one blocks a stretch either side of
    // it, so a first pass at full spacing routinely places one creek short —
    // same failure mode `_buildCrests` documents, same fix: relax and go round
    // again rather than ship a lap with a feature missing.
    const take = (gap, crestPad) => {
      for (const w of windows) {
        if (chosen.length >= want) return;
        if (w.mc > maxCurv) return;                    // sorted: nothing later is straighter
        // never cut a creek through a crest — the two profiles would ADD and
        // the exit bank would become a ski jump nobody authored
        if (this.crests.some((c) => this._circDist(w.i, c.index) < c.len + crestPad)) continue;
        if (chosen.some((c) => this._circDist(w.i, c) < gap)) continue;
        chosen.push(w.i);
      }
    };
    take(Math.min(150, ((N - 160) / want) | 0), 26);
    if (chosen.length < want) take(110, 20);
    if (chosen.length < want) take(90, 16);
    for (const i of chosen) {
      const L = Math.round(baseLen * (0.85 + Math.random() * 0.4));   // ~29..48 samples
      const d = depth * (0.75 + Math.random() * 0.55);                // ~2.7..5.0 u banks
      for (let k = 0; k < L; k++) {
        const f = k / L;
        this.center[(i + k) % N].y -= d * 0.5 * (1 - Math.cos(f * Math.PI * 2));
      }
      const mid = (i + (L >> 1)) % N;
      this.creeks.push({
        index: i, mid, len: L, depth: +d.toFixed(2), half: S.half ?? 9,
        // the wash itself, running away from the road on both sides. Planned
        // here (it is pure XZ) so the flora builder can use it even though the
        // bed geometry is not built until the environment pass.
        line: [this._creekWash(mid, 1), this._creekWash(mid, -1)],
      });
    }
    // the profile moved under us — same rebuild the crests do, for the same
    // reason (the physics and the mesh pitching both read _slope)
    for (let i = 0; i < N; i++) {
      this._slope[i] =
        (this.center[(i + 2) % N].y - this.center[(i - 2 + N) % N].y) / (4 * this.segLen);
    }
  }

  /** One side of a creek's wash: a meandering polyline of {x, z, w} leaving the
   *  road at sample `mid` on `side` and wandering out into the plain. Width
   *  grows with distance — a creek is narrowest where the road crosses it,
   *  because that is where the crossing was graded. */
  _creekWash(mid, side) {
    const n = this.nrm[mid], t = this.tan[mid];
    const c = this.center[mid];
    // leave the road at a slant so the bed is not a stripe drawn square across
    const skew = (Math.random() - 0.5) * 0.7;
    let dx = n.x * side + t.x * skew, dz = n.z * side + t.z * skew;
    const inv = 1 / Math.hypot(dx, dz);
    dx *= inv; dz *= inv;
    const pts = [];
    let px = c.x + dx * 9, pz = c.z + dz * 9, ang = 0, d = 9;
    for (let k = 0; k < 11; k++) {
      pts.push({ x: px, z: pz, w: 7 + d * 0.06 + Math.random() * 3 });
      ang += (Math.random() - 0.5) * 0.34;                 // the meander
      const cs = Math.cos(ang), sn = Math.sin(ang);
      const step = 11 + Math.random() * 9;
      px += (dx * cs - dz * sn) * step;
      pz += (dx * sn + dz * cs) * step;
      d += step;
    }
    return pts;
  }

  _buildRamps() {
    // Prop launch ramps are GONE — replaced by natural crests baked into the
    // road's own elevation (`_buildCrests`). The array stays so the many
    // "keep clear of a ramp" placement guards elsewhere still resolve; they
    // simply never match now.
    this.ramps = [];
    if (this.ramps.length === 0) return;
    const woodTex = buildingTexture();
    const hazTex = hazardTexture();
    // rank every window by how straight it is over the ramp's whole length
    const windows = [];
    for (let i = 0; i < N; i += 5) {
      if (i < 60 || i > N - 90) continue; // keep clear of the start gate
      if (this._nearNarrow(i, 30)) continue; // ---- width-variation: no ramps in pinches
      let maxCurv = 0;
      for (let k = -4; k < 22; k++) maxCurv = Math.max(maxCurv, this.curvature[(i + k + N) % N]);
      windows.push({ i, maxCurv });
    }
    windows.sort((a, b) => a.maxCurv - b.maxCurv);
    // jump-heavy levels (redwood crests, the avalanche pass) place extra ramps
    const want = this.T.rampCount || 3;
    const gap = Math.min(180, ((N - 150) / want) | 0);
    const chosen = [];
    for (const w of windows) {
      if (chosen.length >= want) break;
      if (w.maxCurv > this.T.rampMaxCurv) break;
      if (this._nearGorge(w.i, 60)) continue;
      if (chosen.some((c) => this._circDist(w.i, c) < gap)) continue;
      chosen.push(w.i);
    }
    for (const i of chosen) {
      {
        const lateral = [-3.4, 3.4, 0, 3.4, -3.4, 0][this.ramps.length];
        const len = 16, height = 3.1, halfW = 3.3;
        this.ramps.push({ index: i, lateral, len, height, halfW });
        // wedge mesh: an inclined deck with hazard-striped sides
        const L = len * this.segLen;
        const mid = (i + len / 2) % N;
        const p = this.pointAt(mid, lateral);
        const g = new THREE.Group();
        const angle = Math.atan2(height, L);
        const deck = new THREE.Mesh(
          new THREE.BoxGeometry(halfW * 2, 0.4, Math.hypot(L, height)),
          new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.95 })
        );
        deck.rotation.x = -angle;
        deck.position.y = height / 2 - 0.1;
        deck.castShadow = true;
        g.add(deck);
        for (const s of [-1, 1]) {
          const rail = new THREE.Mesh(
            new THREE.BoxGeometry(0.25, 0.8, Math.hypot(L, height)),
            new THREE.MeshStandardMaterial({ map: hazTex, roughness: 0.9 })
          );
          rail.rotation.x = -angle;
          rail.position.set(s * (halfW + 0.1), height / 2 + 0.2, 0);
          g.add(rail);
        }
        // back support wall
        const back = new THREE.Mesh(
          new THREE.BoxGeometry(halfW * 2, height, 0.5),
          new THREE.MeshStandardMaterial({ map: hazTex, roughness: 0.9 })
        );
        back.position.set(0, height / 2, L / 2 - 0.2);
        g.add(back);
        // sit the wedge on the elevated road at its mid index and pitch the
        // whole group with the road grade so both ends meet the surface
        g.position.set(p.x, p.y, p.z);
        g.rotation.order = 'YXZ';
        g.rotation.y = this.headingAt(mid);
        g.rotation.x = -Math.atan(this.slopeAt(mid));
        this.group.add(g);
      }
    }
  }

  /** On-road rock obstacles (canyon hoodoos / volcano basalt boulders).
   *  Fills this.obstacles with world-space colliders {x, z, r}; the car
   *  collision response against them lives in the vehicle code. */
  _buildObstacles() {
    this._obstacleIdx = [];
    const spec = this.T.obstacleSpec;
    if (!spec) return;
    // straight-ish sections only, clear of start, ramps, pads and each other
    const chosen = [];
    for (let i = 0; i < N && chosen.length < spec.count; i += 7) {
      if (this._circDist(i, 0) < 60) continue;
      if (this._nearGorge(i, 45)) continue;
      if (this._nearNarrow(i, 25)) continue; // ---- width-variation: keep blockers out of pinches
      // alpine: loose boulders litter the fast DESCENT only (the downhill
      // window is short, so they pack tighter, and rockfall on a sweeper is
      // fair game — elsewhere obstacles keep to straights)
      if (this.curvature[i] > (spec.downhill ? 0.02 : 0.012)) continue;
      if (spec.downhill && this.slopeAt(i) > -0.02) continue;
      if (this.ramps.some((r) => this._circDist(i, r.index) < 41)) continue;  // 25 + ramp len
      if (this.boostPads.some((p) => this._circDist(i, p.index) < 25)) continue;
      if (chosen.some((c) => this._circDist(i, c) < (spec.downhill ? 38 : 120))) continue;
      chosen.push(i);
    }
    this._obstacleIdx = chosen;
    const strata = ['#cf9a5e', '#a06844', '#b8845a', '#8f5a36', '#c9a06a'].map(
      (c) => new THREE.MeshStandardMaterial({ color: c, flatShading: true, roughness: 1 })
    );
    const basaltMat = new THREE.MeshStandardMaterial({
      color: 0x25212a, flatShading: true, roughness: 0.45, metalness: 0.1, emissive: 0x1c0a04,
    });
    // alpine rockfall: mossy granite, matching the trackside boulder palette
    const graniteMat = new THREE.MeshStandardMaterial({
      color: 0x7a9a6c, flatShading: true, roughness: 1,
    });
    const logMat = new THREE.MeshStandardMaterial({ color: 0x7a5230, roughness: 0.95 });
    const logCapMat = new THREE.MeshStandardMaterial({ color: 0xc8a468, roughness: 0.9 });
    const rootMat = new THREE.MeshStandardMaterial({ color: 0x5e3820, roughness: 1 });
    chosen.forEach((i, k) => {
      // EVERYTHING HUGS THE VERGE. These used to be deliberate mid-lane
      // blockers: lateral ±1.2–4.5 with a collider radius up to 3.2, so a rock
      // at 1.2 spanned −1.0 to 3.4 and physically straddled the centreline.
      // There was no line through it — you either stopped or you took the hit,
      // three to six times a lap, and it read as the road being unfair rather
      // than difficult. A rally stage has rocks and fallen timber ON it; what
      // it does not have is a boulder parked on the racing line.
      //
      // So the placement is now derived from the road rather than from a
      // constant: reserve a clear corridor down the middle, and fit the
      // obstacle into whatever shoulder is left, sitting against the outer
      // edge. Run wide and it is still there waiting for you — which is the
      // point of it — but the line is always open.
      const roots = spec.style === 'roots';
      const w = this.widthAt ? this.widthAt(i) : ROAD_HALF;
      // Clear corridor: never less than ±4.5 (a car is ~2 wide, so that is
      // room to place it rather than merely to fit), and on a wide road it
      // scales so the verge does not swallow the stage.
      // OFF THE CARRIAGEWAY ENTIRELY, not merely out of the middle.
      //
      // These sat at `clear + r` — inside the drivable width, at the edge of a
      // reserved corridor. That was the second attempt at the same request and
      // it was still wrong: the road is 18 u wide, so a boulder whose inner
      // edge is at 4.95 is squarely in the outer half of the lane and a wide
      // line still hits it. The ask, three times, was to get rocks OUT of the
      // road, so they now sit just beyond the drivable edge: still framing the
      // corner, still there to punish you for running wide off the road, but
      // never on it.
      const side = k % 2 === 0 ? -1 : 1;
      const r = roots ? 1.2 + Math.random() * 0.5 : 2.2 + Math.random();
      // Set BACK from the verge, not hard against it. At `w + r + 0.9` the
      // inner edges landed at 9.9 against a 9 u road half — a near-continuous
      // boulder ring in the exact band where you leave the road, which fights
      // both the open-world rule ("leave the road anywhere") and the shortcut
      // work. Rocks belong beside the course, not lining its edge like bollards.
      const lateral = side * (w + r + 4.6);
      const p = this.pointAt(i, lateral);
      // AND CHECK IT AGAINST THE WHOLE LAP. `lateral` is measured along the
      // normal at sample `i`; on a switchback world the road's other leg
      // swings underneath, so an obstacle correctly set back from ITS leg can
      // land on the carriageway of the one below. Measured on TREMOLA DESCENT
      // after the setback above, one came out 5.6 u from the centreline —
      // squarely in the lane. This is the third system to need the lap-wide
      // check (road cabins and props were the first two); an offset is not a
      // distance, and `_distToTrack` searches the lap.
      if (this._distToTrack(p.x, p.z) < w + r + 1.5) return;
      if (spec.style === 'roots') {
        // gnarled redwood roots breaking the surface: 3 low half-buried ridges
        const g = new THREE.Group();
        for (let s = 0; s < 3; s++) {
          const seg = new THREE.Mesh(
            new THREE.CylinderGeometry(0.2 + Math.random() * 0.12, 0.32, r * (1.4 + Math.random() * 0.7), 6),
            rootMat
          );
          seg.rotation.z = Math.PI / 2 + (Math.random() - 0.5) * 0.3;  // lie low
          seg.rotation.y = (Math.random() - 0.5) * 1.4;
          seg.position.set((Math.random() - 0.5) * r, 0.12 + s * 0.14, (Math.random() - 0.5) * r);
          seg.castShadow = true;
          g.add(seg);
        }
        g.position.set(p.x, p.y, p.z);
        g.rotation.y = this.headingAt(i) + Math.PI / 2;    // roots reach across the lane
        this.group.add(g);
      } else if (spec.style === 'logs') {
        // jungle log pile: 2-3 stacked horizontal trunks lying across the lane
        const g = new THREE.Group();
        const nLogs = 2 + (Math.random() < 0.5 ? 1 : 0);
        const len = r * 2.1;
        const lr = 0.62;
        const spots = [[-lr * 1.05, lr], [lr * 1.05, lr], [0, lr * 2.7]];
        for (let s = 0; s < nLogs; s++) {
          const log = new THREE.Mesh(
            new THREE.CylinderGeometry(lr * (0.9 + Math.random() * 0.2), lr, len, 9),
            [logMat, logCapMat, logCapMat]
          );
          log.rotation.z = Math.PI / 2;                    // lie flat, axis along local X
          log.rotation.y = (Math.random() - 0.5) * 0.16;
          log.position.set(spots[s][0] + (Math.random() - 0.5) * 0.3, spots[s][1], (Math.random() - 0.5) * 0.3);
          log.castShadow = true;
          g.add(log);
        }
        g.position.set(p.x, p.y, p.z);
        // logs run across the road (local X = world road-normal direction)
        g.rotation.y = this.headingAt(i) + Math.PI / 2 + (Math.random() - 0.5) * 0.4;
        this.group.add(g);
      } else if (spec.style === 'basalt' || spec.style === 'boulder') {
        // two-lump boulder: glossy obsidian (volcano) or mossy granite (alpine)
        const rockMat = spec.style === 'boulder' ? graniteMat : basaltMat;
        const g = new THREE.Group();
        const low = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 0), rockMat);
        low.scale.set(r, r * 0.72, r * 0.9);
        low.position.y = r * 0.42;
        low.rotation.y = Math.random() * Math.PI * 2;
        low.castShadow = true;
        g.add(low);
        const top = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 0), rockMat);
        top.scale.set(r * 0.55, r * 0.5, r * 0.55);
        top.position.y = r * 0.95;
        top.rotation.y = Math.random() * Math.PI * 2;
        top.castShadow = true;
        g.add(top);
        g.position.set(p.x, p.y, p.z);
        this.group.add(g);
      } else {
        // hoodoo: 4–5 stacked tapered sandstone drums with a wider cap stone
        const g = new THREE.Group();
        const nSeg = 4 + (Math.random() < 0.4 ? 1 : 0);
        const wr = [1, 0.8, 0.64, 0.78, 0.55];
        let y = p.y;                                     // stack up from the road surface
        for (let s = 0; s < nSeg; s++) {
          const rad = r * wr[Math.min(s, wr.length - 1)] * (0.92 + Math.random() * 0.16);
          const hh = (2.5 - s * 0.25) * (0.85 + Math.random() * 0.35);
          const seg = new THREE.Mesh(
            new THREE.CylinderGeometry(rad * 0.8, rad, hh, 8),
            strata[s % strata.length]
          );
          seg.position.set(
            p.x + (Math.random() - 0.5) * 0.5, y + hh / 2,
            p.z + (Math.random() - 0.5) * 0.5
          );
          seg.rotation.y = Math.random() * Math.PI * 2;
          seg.castShadow = true;
          g.add(seg);
          y += hh * 0.96;
        }
        this.group.add(g);
      }
      // collision stays horizontal ({x, z, r}); y is the road height for visuals
      this.obstacles.push({ x: p.x, z: p.z, r, y: p.y });
      this._addShadow(p.x, p.z, r * 1.35, p.y);
    });
  }

  /** Flat mud-puddle decals on the road surface (visual only here; the
   *  splash/slowdown reaction lives in the vehicle code via this.puddles). */
  _buildPuddles() {
    const count = this.T.puddleCount | 0;
    if (!count) return;
    // theme knob T.puddle re-tints the decal (glacial's icy frozen slicks)
    const tex = puddleTexture(this.T.puddle);
    const chosen = [];
    for (let i = 3; i < N && chosen.length < count; i += 5) {
      if (this._circDist(i, 0) < 50) continue;
      if (this._nearGorge(i, 40)) continue;
      if (this._nearNarrow(i, 6)) continue; // ---- width-variation: puddles clear of pinches
      if (this.ramps.some((r) => this._circDist(i, r.index) < 41)) continue;
      if (this.boostPads.some((p) => this._circDist(i, p.index) < 25)) continue;
      if (this._obstacleIdx.some((o) => this._circDist(i, o) < 25)) continue;
      // high-count levels (jungle's 8 river-fed pools) pack a little tighter
      if (chosen.some((c) => this._circDist(i, c) < (count > 6 ? 55 : 80))) continue;
      chosen.push(i);
    }
    for (const i of chosen) {
      const rad = 3 + Math.random() * 2;
      const lateral = Math.random() * 7 - 3.5;             // may sit mid-road
      const p = this.pointAt(i, lateral);
      const m = new THREE.Mesh(
        new THREE.CircleGeometry(1, 26),
        new THREE.MeshStandardMaterial({
          // a water puddle is glossy; a BULLDUST hole (outback) is the same
          // decal with the shine taken out of it, so the theme may dial the
          // reflectance right down without needing its own decal system
          map: tex, transparent: true, depthWrite: false,
          roughness: this.T.puddleRough ?? 0.25, metalness: this.T.puddleMetal ?? 0.08,
        })
      );
      m.rotation.order = 'YXZ';
      m.rotation.y = this.headingAt(i);
      // pitch with the road grade so the decal hugs the slope; the in-plane
      // spin variety moves to rotation.z (applied first in YXZ order)
      m.rotation.x = -Math.PI / 2 - Math.atan(this.slopeAt(i));
      m.rotation.z = Math.random() * Math.PI * 2;
      m.scale.set(rad, rad * (0.72 + Math.random() * 0.25), 1);
      m.position.set(p.x, p.y + 0.04, p.z);
      m.renderOrder = 1;
      this.group.add(m);
      this.puddles.push({ x: p.x, z: p.z, r: rad, y: p.y });
    }
  }

  /** MEDITERRANEAN TERRACE hazard signature: gravel dragged onto the EXIT of a
   *  corner by the cars that went through before you (Bible 3.6 — loose stone
   *  on the outside of 40 % of corners, and the reason a warm open tarmac stage
   *  bites). `_buildRoadsideDetail` already scatters gravel on the VERGE, at a
   *  lateral of 10.9–14; this is the stuff that is on the road, past the apex,
   *  exactly where you unwind the wheel and get on the throttle.
   *
   *  It registers in `this.puddles`, which is the engine's existing "patch of
   *  road that costs you grip" contract — hull drag, a short slick, and a spray
   *  that is already `particles.dust` rather than water — and which the rival
   *  corner planner already avoids. This theme keeps `puddleCount: 0`, so
   *  nothing wet is ever built on a world whose Bible entry forbids it.
   *
   *  Placement obeys the carriageway rule the same way `_buildObstacles` does:
   *  the patch is pinned to the outer edge and its inner edge is checked
   *  against max(4.5, widthAt × 0.55), so the racing line stays clean. Run
   *  wide on the exit and the gravel is still there — that is the point. */
  _buildCornerGravel() {
    const spec = this.T.cornerGravel;
    const count = spec && spec.count | 0;
    if (!count) return;
    const tex = puddleTexture({
      // DRY palette: pale limestone chippings on grey tarmac. The sheen is
      // nearly off and the gleam is killed outright — a wet highlight here
      // would break the region's "never wet" rule on its own.
      rim: '#a2977a', mud: '#c6ba99',
      sheen: 'rgba(226,214,182,0.20)', gleam: 'rgba(0,0,0,0)',
    });
    const mat = new THREE.MeshStandardMaterial({
      map: tex, transparent: true, roughness: 1, metalness: 0, depthWrite: false,
    });
    const stoneGeo = this._rockGeo || (this._rockGeo = this._topLitRockGeo(0));
    const stones = new THREE.InstancedMesh(
      stoneGeo,
      new THREE.MeshStandardMaterial({
        color: this.T.rockColor ?? 0xc0b596, flatShading: true, roughness: 1, vertexColors: true,
      }),
      count * 12
    );
    const q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
    const scol = new THREE.Color();
    const m4 = new THREE.Matrix4();
    let sk = 0;
    const chosen = [];
    for (let i = 0; i < N && chosen.length < count; i += 3) {
      // a corner, then walk forward to where it opens out again: the exit
      if (this.curvature[i] < 0.0125) continue;
      let e = i;
      for (let s = 8; s < 46; s += 2) {
        e = (i + s) % N;
        if (this.curvature[e] < 0.010) break;
      }
      if (this._circDist(e, 0) < 55) continue;
      if (this._nearNarrow(e, 8)) continue;             // pinches stay clean
      if (this._nearGorge(e, 40)) continue;
      if (this.ramps.some((r) => this._circDist(e, r.index) < 34)) continue;
      if (this.fords.some((f) => this._circDist(e, f.i) < 30)) continue;
      if (this._obstacleIdx.some((o) => this._circDist(e, o) < 24)) continue;
      if (chosen.some((c) => this._circDist(e, c.i) < 44)) continue;
      // outside of the bend the car has just come through
      const a = this.tan[i], b = this.tan[(i + 12) % N];
      const side = (a.x * b.z - a.z * b.x) > 0 ? -1 : 1;
      const halfW = this.widthAt(e);
      const r = 1.8 + Math.random() * 0.8;
      const lat = side * (halfW - r * 0.55);
      if (Math.abs(lat) - r < Math.max(4.5, halfW * 0.55)) continue;
      chosen.push({ i: e, lat, r });
    }
    for (const c of chosen) {
      const p = this.pointAt(c.i, c.lat);
      const m = new THREE.Mesh(new THREE.CircleGeometry(1, 22), mat);
      m.rotation.order = 'YXZ';
      m.rotation.y = this.headingAt(c.i);
      m.rotation.x = -Math.PI / 2 - Math.atan(this.slopeAt(c.i));
      m.rotation.z = Math.random() * Math.PI * 2;
      // drawn out along the road: gravel is dragged, not dropped
      m.scale.set(c.r, c.r * (1.5 + Math.random() * 0.6), 1);
      m.position.set(p.x, p.y + 0.035, p.z);
      m.renderOrder = 1;
      this.group.add(m);
      this.puddles.push({ x: p.x, z: p.z, r: c.r, y: p.y });
      // a dozen loose stones sitting proud of the decal so the patch reads as
      // stone from the car, not as a stain on the tarmac
      for (let s = 0; s < 12; s++) {
        const t = (Math.random() - 0.5) * 2, u = (Math.random() - 0.5) * 2;
        const sp = this.pointAt(
          (c.i + Math.round(t * c.r * 2.2) + N) % N, c.lat + u * c.r * 0.85
        );
        const sc = 0.1 + Math.random() * 0.18;
        q.setFromAxisAngle(up, Math.random() * Math.PI * 2);
        m4.compose(new THREE.Vector3(sp.x, sp.y + sc * 0.16, sp.z), q,
          new THREE.Vector3(sc, sc * 0.5, sc));
        stones.setMatrixAt(sk, m4);
        scol.setScalar(0.85 + Math.random() * 0.3);
        stones.setColorAt(sk++, scol);
      }
    }
    stones.count = sk;
    if (sk) this.group.add(stones);
  }

  // ---- river-fords ---------------------------------------------------------
  /** River fords: a visible watercourse crossing the ROAD perpendicular-ish,
   *  4–8u wide, with shallow water OVER the road surface (the jungle's
   *  _buildRivers streams pass UNDER the deck — these wash across it). The
   *  stream ribbon meanders off into the landscape on both sides; foam lines
   *  mark the water's edge across the road. Physics (splash, drag, wet tires)
   *  is consumed from track.fords by the vehicle code. */
  _buildFords() {
    const themeKey = (this.level && this.level.theme) || 'forest';
    const spec = this.T.fords !== undefined ? this.T.fords : FORD_TUNE[themeKey];
    const count = spec && spec.count | 0;
    if (!count) return;
    // deterministic per theme (offset seed so fords never mirror the narrows)
    let seed = 374761393 >>> 0;
    for (let k = 0; k < themeKey.length; k++) {
      seed = ((seed ^ themeKey.charCodeAt(k)) * 2246822519) >>> 0;
    }
    const rnd = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const chosen = [];
    for (let tries = 0; tries < 400 && chosen.length < count; tries++) {
      const i = 60 + Math.floor(rnd() * (N - 120));
      if (this.curvature[i] > 0.013) continue;                 // straight-ish crossings
      if (this._circDist(i, 0) < 70) continue;
      if (this._nearNarrow(i, 20)) continue;
      if (this.ramps.some((r) => this._circDist(i, r.index) < 45)) continue;
      if (this.boostPads.some((p) => this._circDist(i, p.index) < 25)) continue;
      if (this._obstacleIdx.some((o) => this._circDist(i, o) < 25)) continue;
      if (chosen.some((c) => this._circDist(i, c.i) < 150)) continue;
      chosen.push({ i, half: 3 + rnd() * 2 });                 // 6–10u wide band
    }
    if (!chosen.length) return;
    // ONE river through all of them (see _planRiver): the water ribbon itself
    // is built later, in _buildRiver, from that single curve — this loop now
    // only registers the physics bands and paints the foam lines on the road.
    this._planRiver(chosen);
    const foamMat = new THREE.MeshBasicMaterial({
      color: 0xf2fbff, transparent: true, opacity: 0.4, depthWrite: false,
    });
    for (const fd of chosen) {
      const c = this.center[fd.i];
      const roadW = this.widthAt(fd.i);
      this.fords.push({ i: fd.i, x: c.x, z: c.z, y: c.y, half: fd.half });
      // foam lines where the water meets the road at both edges of the band
      const heading = this.headingAt(fd.i);
      for (const s of [-1, 1]) {
        const foam = new THREE.Mesh(new THREE.PlaneGeometry(roadW * 2 + 2.5, 0.55), foamMat);
        foam.rotation.order = 'YXZ';
        foam.rotation.y = heading;
        foam.rotation.x = -Math.PI / 2 - Math.atan(this.slopeAt(fd.i));
        const fp = this.pointAt(fd.i, 0);
        foam.position.set(
          fp.x + this.tan[fd.i].x * fd.half * s * 0.9,
          fp.y + 0.09,
          fp.z + this.tan[fd.i].z * fd.half * s * 0.9
        );
        foam.renderOrder = 2;
        this.group.add(foam);
      }
    }
  }
  // ---- end river-fords -----------------------------------------------------

  // ---- viz-zones -----------------------------------------------------------
  /** Deterministic per-theme visibility zones: 40–90-sample sections where
   *  sight is impaired — 'forest' (dense tree corridor + canopy gloom),
   *  'fogbank' (pure data; runtime pulls fog in) and 'squall' (rain burst).
   *  The runtime fog response lives in the game lead; rivals read the zones
   *  through their corner-speed planner. */
  _buildVizZones() {
    const themeKey = (this.level && this.level.theme) || 'forest';
    const spec = this.T.viz !== undefined ? this.T.viz : VIZ_TUNE[themeKey];
    if (!spec || !spec.length) return;
    let seed = 668265263 >>> 0;
    for (let k = 0; k < themeKey.length; k++) {
      seed = ((seed ^ themeKey.charCodeAt(k)) * 374761393) >>> 0;
    }
    const rnd = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    for (const [kind, count] of spec) {
      for (let want = 0, tries = 0; want < count && tries < 400; tries++) {
        // corridors run a bit shorter than fog banks (their tree walls need a
        // gentle stretch of road); fog/squalls take 40–90 samples anywhere
        const len = kind === 'forest' ? 40 + Math.floor(rnd() * 26) : 40 + Math.floor(rnd() * 50);
        const i0 = Math.floor(rnd() * N);
        if (this._circDist(i0, 0) < 80 || this._circDist((i0 + len) % N, 0) < 80) continue;
        const mid = (i0 + (len >> 1)) % N, half = len / 2;
        if (this._nearNarrow(mid, half + 8)) continue;        // keep clear of pinches
        if (this.vizZones.some((z) => this._circDist(mid, z.mid) < z.half + half + 50)) continue;
        // forest corridors want gentle road (trees at the edge of a hairpin
        // block the sight line the driver NEEDS); fog can sit anywhere
        if (kind === 'forest') {
          let ok = true;
          for (let k2 = -4; ok && k2 <= len + 4; k2++) {
            if (this.curvature[(i0 + k2 + N) % N] > 0.024) ok = false;
          }
          if (!ok) continue;
          // …and never over a ford: the canopy gloom decal would swallow the
          // white bow-wave that sells the crossing (fords are built first)
          if (this.fords.some((f) => this._circDist(mid, f.i) < half + 10)) continue;
        }
        this.vizZones.push({ i0, i1: (i0 + len) % N, len, mid, half, kind, strength: 1 });
        want++;
      }
    }
    if (this.vizZones.some((z) => z.kind === 'forest')) this._buildVizCorridors();
  }

  /** Thick-forest corridors: big canopy pines planted DENSE along both road
   *  edges of every 'forest' viz zone, leaning inward so the road reads as a
   *  tunnel through the woods, plus a translucent canopy-shadow ribbon over
   *  the road for under-canopy gloom. Trees register in this.trees (kind
   *  'pine', s ≥ 1.0 ⇒ SOLID trunks per the material law), kept ~1.5–2u off
   *  the drivable edge so wide lines are punished, never blocked. */
  _buildVizCorridors() {
    const T = this.T;
    const zones = this.vizZones.filter((z) => z.kind === 'forest');
    // shared instanced pine (theme-tinted): trunk + two canopy tiers (+ cap)
    let cap = 0;
    for (const z of zones) cap += Math.ceil(z.len / 2) * 2 + 4;
    // Broadleaf themes get broadleaf corridors. These are the DENSE trees that
    // form the tunnel and therefore dominate the view, so leaving them as cones
    // meant the Amazon still read as a pine forest no matter what was planted
    // in the scatter around it: 86 of its 486 trees were conifers, and they were
    // the ones you actually drive between.
    const broadleaf = (this.level?.theme === 'jungle' || this.level?.theme === 'redwood');
    const trunkGeo = broadleaf
      ? new THREE.CylinderGeometry(0.34, 0.66, 5.4, 7)   // clear bole, no low branches
      : new THREE.CylinderGeometry(0.42, 0.6, 3.2, 7);
    trunkGeo.translate(0, broadleaf ? 2.7 : 1.6, 0);
    let lowGeo, topGeo;
    if (broadleaf) {
      // stacked parasols: a closed canopy seen from underneath
      lowGeo = new THREE.SphereGeometry(3.6, 9, 5);
      lowGeo.scale(1, 0.46, 1);
      lowGeo.translate(0, 6.4, 0);
      topGeo = new THREE.SphereGeometry(2.5, 8, 5);
      topGeo.scale(1, 0.5, 1);
      topGeo.translate(0.5, 8.3, -0.4);
    } else {
      lowGeo = new THREE.ConeGeometry(3.1, 4.8, 8);
      lowGeo.translate(0, 5.1, 0);
      topGeo = new THREE.ConeGeometry(2.1, 3.9, 8);
      topGeo.translate(0, 8.1, 0);
    }
    const trunkMat = new THREE.MeshStandardMaterial({ color: T.trunkColor ?? 0x5a4028, roughness: 1 });
    const lowMat = new THREE.MeshStandardMaterial({ color: T.foliageLow ?? 0x2c6e2a, flatShading: true, roughness: 1 });
    const topMat = new THREE.MeshStandardMaterial({ color: T.foliageTop ?? 0x3c8a34, flatShading: true, roughness: 1 });
    const parts = [
      new THREE.InstancedMesh(trunkGeo, trunkMat, cap),
      new THREE.InstancedMesh(lowGeo, lowMat, cap),
      new THREE.InstancedMesh(topGeo, topMat, cap),
    ];
    if (T.treeSnowCap) {
      const capGeo = new THREE.ConeGeometry(1.5, 2.1, 8);
      capGeo.translate(0, 8.9, 0);
      parts.push(new THREE.InstancedMesh(
        capGeo, new THREE.MeshStandardMaterial({ color: 0xf2f6fa, flatShading: true, roughness: 0.9 }), cap));
    }
    for (const part of parts) part.castShadow = true;
    const hash = (n) => { const s = Math.sin(n) * 43758.5453; return s - Math.floor(s); };
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const pos = new THREE.Vector3(), scl = new THREE.Vector3();
    const color = new THREE.Color();
    const F = T.foliage || { h: 0.29, hVar: 0.06, s: 0.5, sVar: 0.2, l: 0.32, lVar: 0.14 };
    let k = 0;
    for (const z of zones) {
      for (let s = 0; s < z.len && k < cap; s += 2) {   // a pair every ~3.8u: thick
        const j = (z.i0 + s) % N;
        for (const side of [1, -1]) {
          if (k >= cap) break;
          const h1 = hash(j * 5.7 + side * 2.3);
          // two staggered rows pressed near the road edge. The trunks are
          // SOLID, so like the pinch markers they are pushed out until the
          // collision face (trunk r + the 1.8u car radius) clears the drivable
          // width — the canopy leans in over the road, the trunks never do.
          const row = h1 < 0.55 ? 0 : 1;
          const sc = 1.15 + hash(j * 9.1 - side) * 0.75;      // big canopy pines
          const lat = (this.widthAt(j) + 0.75 * sc + 2.0 + row * 3.2 + h1 * 1.4) * side;
          const p = this.pointAt(j, lat);
          const ty = this.terrainHeight(p.x, p.z) - 0.2;
          // lean the whole tree inward over the road (rotation about the tangent)
          const lean = (0.10 + hash(j * 3.3 + side) * 0.12) * side;
          q.setFromAxisAngle(this.tan[j], lean);
          pos.set(p.x, ty, p.z);
          scl.set(sc, sc * (0.95 + hash(j * 1.9) * 0.35), sc);
          m4.compose(pos, q, scl);
          for (const part of parts) part.setMatrixAt(k, m4);
          color.setHSL(
            F.h + hash(j * 2.2 + side) * F.hVar,
            F.s + hash(j * 4.4 - side) * F.sVar,
            Math.max(0.1, (F.l + hash(j * 6.6) * F.lVar) * 0.82)  // corridor reads darker
          );
          parts[1].setColorAt(k, color);
          parts[2].setColorAt(k, color.clone().multiplyScalar(1.15));
          parts[0].setColorAt(k, color.clone().setScalar(0.85));
          // collision r tracks the TRUNK, not the canopy (the canopy overhangs
          // the road; only the trunk is solid) — see the clearance note above
          this.trees.push({ x: p.x, z: p.z, y: ty, r: 0.75 * sc, id: k, parts, kind: 'pine', s: sc });
          this._addShadow(p.x, p.z, 2.6 * sc, ty + 0.2);
          k++;
        }
      }
      // under-canopy gloom: a dark translucent ribbon over the road, tapering
      // out at both ends (same decal spirit as the baked contact shadows)
      const rows = 2;
      const gv = new Float32Array((z.len + 1) * rows * 3);
      const gidx = [];
      for (let s2 = 0; s2 <= z.len; s2++) {
        const j = (z.i0 + s2) % N;
        const c = this.center[j], n = this.nrm[j];
        const taper = Math.min(1, Math.min(s2, z.len - s2) / 7);
        const w = (this.widthAt(j) + 2.2) * taper;
        const o = s2 * rows * 3;
        gv[o] = c.x + n.x * w; gv[o + 1] = c.y + 0.05; gv[o + 2] = c.z + n.z * w;
        gv[o + 3] = c.x - n.x * w; gv[o + 4] = c.y + 0.05; gv[o + 5] = c.z - n.z * w;
      }
      for (let s2 = 0; s2 < z.len; s2++) {
        const a = s2 * 2, b = a + 1, c2 = a + 2, d2 = a + 3;
        gidx.push(a, b, c2, b, d2, c2);
      }
      const ggeo = new THREE.BufferGeometry();
      ggeo.setAttribute('position', new THREE.BufferAttribute(gv, 3));
      ggeo.setIndex(gidx);
      const gloom = new THREE.Mesh(ggeo, new THREE.MeshBasicMaterial({
        color: 0x03130a, transparent: true, opacity: 0.34, depthWrite: false,
      }));
      gloom.renderOrder = 1;
      this.group.add(gloom);
    }
    for (const part of parts) {
      part.count = k;
      if (part.instanceColor) part.instanceColor.needsUpdate = true;
    }
    this.group.add(...parts);
  }
  // ---- end viz-zones -------------------------------------------------------

  /** Build one prop mesh (origin at its base). Returns {mesh, r} — geometry and
   *  most materials are shared; only theme tints (hay color, barrel wrap) vary. */
  _makeProp(type) {
    const A = propAssets();
    switch (type) {
      case 'hay': {
        if (!this._hayPropMat) {
          this._hayPropMat = new THREE.MeshStandardMaterial({ color: this.T.hayColor, roughness: 1 });
        }
        const m = new THREE.Mesh(A.geo.hay, this._hayPropMat);
        m.castShadow = true;
        return { mesh: m, r: 1.5 };
      }
      case 'crate': {
        const m = new THREE.Mesh(A.geo.crate, A.mat.crate);
        m.castShadow = true;
        return { mesh: m, r: 1.6 };
      }
      case 'cone': {
        const g = new THREE.Group();
        g.add(new THREE.Mesh(A.geo.coneBase, A.mat.coneBase));
        const c = new THREE.Mesh(A.geo.cone, A.mat.cone);
        c.castShadow = true;
        g.add(c);
        return { mesh: g, r: 1.0 };
      }
      case 'barrel': {
        if (!this._barrelPropMat) {
          const pal = BARREL_PALETTES[this.level && this.level.theme] || {};
          this._barrelPropMat = new THREE.MeshStandardMaterial({
            map: barrelTexture(pal), roughness: 0.9,
          });
        }
        const m = new THREE.Mesh(A.geo.barrel, [this._barrelPropMat, A.mat.barrelCap, A.mat.barrelCap]);
        m.castShadow = true;
        return { mesh: m, r: 1.3 };
      }
      case 'snowman': {
        const g = new THREE.Group();
        const body = new THREE.Mesh(A.geo.ballBody, A.mat.snow);
        body.position.y = 0.68;
        body.castShadow = true;
        g.add(body);
        const head = new THREE.Mesh(A.geo.ballHead, A.mat.snow);
        head.position.y = 1.75;
        g.add(head);
        const nose = new THREE.Mesh(A.geo.carrot, A.mat.carrot);
        nose.rotation.x = Math.PI / 2;                   // carrot points +z
        nose.position.set(0, 1.8, 0.62);
        g.add(nose);
        for (const s of [-1, 1]) {
          const eye = new THREE.Mesh(A.geo.eye, A.mat.coal);
          eye.position.set(s * 0.18, 1.95, 0.44);
          g.add(eye);
        }
        return { mesh: g, r: 1.4 };
      }
      case 'penguin': {
        // little voxel penguin waddling near the road (glacial)
        const g = new THREE.Group();
        const body = new THREE.Mesh(A.geo.pengBody, A.mat.pengBlack);
        body.position.y = 0.53;
        body.castShadow = true;
        g.add(body);
        const belly = new THREE.Mesh(A.geo.pengBelly, A.mat.pengWhite);
        belly.position.set(0, 0.5, 0.25);
        g.add(belly);
        const head = new THREE.Mesh(A.geo.pengHead, A.mat.pengBlack);
        head.position.y = 1.14;
        g.add(head);
        const beak = new THREE.Mesh(A.geo.pengBeak, A.mat.pengOrange);
        beak.position.set(0, 1.1, 0.3);
        g.add(beak);
        for (const s of [-1, 1]) {
          const eye = new THREE.Mesh(A.geo.eye, A.mat.pengWhite);
          eye.position.set(s * 0.13, 1.2, 0.21);
          g.add(eye);
          const wing = new THREE.Mesh(A.geo.pengWing, A.mat.pengBlack);
          wing.position.set(s * 0.38, 0.6, 0);
          wing.rotation.z = s * 0.22;
          g.add(wing);
          const foot = new THREE.Mesh(A.geo.pengFoot, A.mat.pengOrange);
          foot.position.set(s * 0.16, 0.04, 0.08);
          g.add(foot);
        }
        return { mesh: g, r: 0.6 };
      }
      default: {                                         // 'rock' — small pebble
        const m = new THREE.Mesh(A.geo.rock, A.mat.rock);
        m.castShadow = true;
        return { mesh: m, r: 1.0 };
      }
    }
  }

  /** Scatter this level's destructible props near the road: MOST sit inside
   *  the fences on the drivable surface (|lateral| 3.5–8.5) so racing actually
   *  smashes them; the rest dress the trackside (|lateral| 10.5–22, hugging
   *  the cliff base on canyon). Keeps clear of the start, ramps, boost pads
   *  and rock obstacles. */
  _buildProps() {
    const themeKey = PROP_SPECS[this.level && this.level.theme] ? this.level.theme : 'forest';
    const usedI = [];
    const spotFor = (shoulder) => {
      for (let tries = 0; tries < 40; tries++) {
        const i = (Math.random() * N) | 0;
        if (this._circDist(i, 0) < 30) continue;                                  // start grid + gate
        if (this._nearGorge(i, 40)) continue;                                     // the bridge span
        if (this.ramps.some((r) => this._circDist(i, r.index) < 36)) continue;    // 20 + ramp len
        if (this.boostPads.some((p) => this._circDist(i, p.index) < 20)) continue;
        if (this._obstacleIdx.some((o) => this._circDist(i, o) < 20)) continue;
        if (usedI.some((u) => this._circDist(i, u) < 4)) continue;                // no piles
        if (shoulder && this._nearNarrow(i, 6)) continue; // ---- width-variation: keep the pinch lane clear
        const side = Math.random() < 0.5 ? -1 : 1;
        // SHOULDER PROPS SIT OUTSIDE THE RACING LINE, not across it.
        //
        // This was `3.5 + rand*5`, so with radii up to 1.7 a prop's inner edge
        // reached 1.8 u of the centreline. Measured, 674 of 1050 props sat
        // inside the drivable width and 326 sat inside the 4.5 u corridor the
        // obstacles reserve — worst 1.78 u. On the timber worlds those are
        // `hay`, recoloured to cut-log rounds, so the road was strewn with
        // rock- and log-shaped objects however carefully the boulders had been
        // moved aside. That is what the player photographed.
        //
        // They are NOT blockers — a car drives straight through one and
        // accelerates — so this is clutter on the line rather than a wall. It
        // still reads as "rocks and logs in the middle of the road", and it is
        // the same complaint.
        //
        // They stay ON the drivable surface, just past the line: run wide,
        // clip an apex, take a corner properly, and you will still smash them,
        // which is the whole point of them being there.
        const wHere = this.widthAt ? this.widthAt(i) : ROAD_HALF;
        const clearHere = Math.max(4.5, wHere * 0.55);   // the obstacle corridor
        const lateral = shoulder
          ? side * (clearHere + 1.8 + Math.random() * 1.6)
          : this.T.cliffWalls
            ? side * (10.5 + Math.random() * 0.8)      // hug the canyon walls
            : side * (10.5 + Math.random() * 11.5);
        const p = this.pointAt(i, lateral);
        // AND CHECK IT AGAINST THE WHOLE LAP, not just this sample's normal.
        //
        // `lateral` is measured along the normal at sample `i`. On a hairpin
        // world the road's other leg swings underneath that offset, so a prop
        // correctly placed 6.8 u from ITS leg can be 2.4 u from the centreline
        // of the one below — measured on COL DE TURINI after the widening
        // above, which is what caught this. It is the same defect that put a
        // cabin on the centreline of FURKA RIDGE and 38 tire stacks inside the
        // road: an offset is not a distance.
        //
        // `_distToTrack` searches the lap, so it sees the near leg whichever
        // one it is. BOTH branches need it: a trackside prop placed 10-22 u
        // along one leg's normal can land 2.4 u from another leg just as
        // easily, and on COL DE TURINI one did.
        const need = shoulder ? clearHere + 1.8 : wHere + 1.8;
        if (this._distToTrack(p.x, p.z) < need) continue;
        usedI.push(i);
        // shoulder props sit on the road surface; trackside ones on the terrain
        const y = Math.abs(lateral) <= 9.5 ? p.y : this.terrainHeight(p.x, p.z);
        return { x: p.x, y, z: p.z };
      }
      return null;
    };
    for (const [type, count] of PROP_SPECS[themeKey]) {
      // ~25% of crates carry a random pickup (always at least one per level)
      let pickupSet = null;
      if (type === 'crate') {
        pickupSet = new Set();
        const order = Array.from({ length: count }, (_, k) => k);
        for (let k = order.length - 1; k > 0; k--) {
          const j = (Math.random() * (k + 1)) | 0;
          [order[k], order[j]] = [order[j], order[k]];
        }
        for (let k = 0; k < Math.max(1, Math.round(count * 0.25)); k++) pickupSet.add(order[k]);
      }
      // ROCKS AND TIMBER NEVER TAKE THE ON-ROAD BRANCH.
      //
      // Asked for three times: "remove rocks from the middle of the road". The
      // first two passes moved them to the edge of a reserved corridor but left
      // them ON the carriageway, so a wide line still met them and the answer
      // was still no. Rock- and log-shaped props are now trackside only.
      //
      // Man-made clutter stays on the road, because that is the stuff you are
      // MEANT to smash — crates, cones, barrels, fences read as debris and
      // hitting one is the game working. A rock reads as terrain, and hitting
      // terrain in the road reads as the road being unfair.
      const trackside = /rock|stone|boulder|hay|log|timber/i.test(type);
      for (let k = 0; k < count; k++) {
        const spot = spotFor(!trackside && Math.random() < 0.62);
        if (!spot) continue;
        const { mesh, r } = this._makeProp(type);
        mesh.position.set(spot.x, spot.y, spot.z);
        mesh.rotation.y = Math.random() * Math.PI * 2;
        const s = 0.9 + Math.random() * 0.25;
        mesh.scale.setScalar(s);
        this.group.add(mesh);
        this._addShadow(spot.x, spot.z, r * s * 1.2, spot.y);
        this.props.push({
          mesh, x: spot.x, y: spot.y, z: spot.z, r: r * s, type,
          scoreValue: PROP_SCORE[type],
          pickup: pickupSet && pickupSet.has(k)
            ? PROP_PICKUPS[(Math.random() * PROP_PICKUPS.length) | 0]
            : null,
        });
      }
    }
    // placement is randomized — make absolutely sure a pickup crate survived
    if (!this.props.some((p) => p.type === 'crate' && p.pickup)) {
      const c = this.props.find((p) => p.type === 'crate');
      if (c) c.pickup = PROP_PICKUPS[(Math.random() * PROP_PICKUPS.length) | 0];
    }
  }

  /** Fell tree `tr`: hide its instanced parts and hand back a one-off
   *  stand-in mesh the game can send flying. Returns null if already dead.
   *  The stand-in is rebuilt from the tree's OWN instanced part geometry and
   *  per-instance tint, so a felled cactus flies away as a cactus, a snag as
   *  a snag, a palm as a palm — never as a generic pine. */
  smashTree(tr) {
    if (tr.dead) return null;
    tr.dead = true;
    const g = new THREE.Group();
    const tint = new THREE.Color();
    for (const part of tr.parts) {
      // Same as smashBuilding: keep the pristine transform so restoreSmashed
      // can stand the tree back up between races. Keyed by instance id because
      // one InstancedMesh carries every tree of that part type.
      if (!part.m0) part.m0 = {};
      if (!part.m0[tr.id]) {
        const m = new THREE.Matrix4();
        part.getMatrixAt(tr.id, m);
        part.m0[tr.id] = m;
      }
      // capture the per-instance color BEFORE zeroing the instance out
      if (part.instanceColor) part.getColorAt(tr.id, tint);
      else tint.setScalar(1);
      const src = part.material;
      const m = new THREE.Mesh(part.geometry, new THREE.MeshStandardMaterial({
        color: (src.color ? src.color.clone() : new THREE.Color(1, 1, 1)).multiply(tint),
        map: src.map ?? null,
        flatShading: !!src.flatShading,
        roughness: src.roughness ?? 1,
      }));
      m.castShadow = true;
      g.add(m);
      _m4.makeScale(0, 0, 0);
      part.setMatrixAt(tr.id, _m4);
      part.instanceMatrix.needsUpdate = true;
    }
    g.position.set(tr.x, tr.y ?? this.terrainHeight(tr.x, tr.z), tr.z);
    g.scale.setScalar(tr.s ?? 1);
    return g;
  }

  // ---------- environment ----------
  _buildEnvironment() {
    this._buildTerrain();
    this._buildSky();
    const m4 = new THREE.Matrix4();
    this._buildHorizon(m4);
    if (this.T.coast) this._buildSea();
    if (this.T.vineRows) this._buildVineRows();
    if (this.T.windmill) this._buildWindmill();
    if (this.T.lighthouse) this._buildLighthouse();
    if (this.T.quay) this._buildQuayside(m4);        // harbour: quay wall + dockside kit
    if (this.T.quay) this._buildMarina();           // pontoons, rigged boats, rings
    if (this.T.frontage) this._buildStreetLife();   // market stalls, produce, a fountain
    if (this.T.stoneBridges) this._buildStoneBridges();
    if (this._overpasses.length) this._buildOverpassDecks();
    if (this.T.japan) this._buildJapan();
    if (this.creeks?.length) this._buildCreekBeds(m4);   // outback dry watercourses
    this._buildForest(m4);
    this._buildGroundCover(m4);
    this._buildHuts(m4);
    this._buildTrackside(m4);
    this._buildBanners();
    this._buildGrandstand();
    if (this.T.outcrops) this._buildOutcrops(m4);    // mesas + hoodoos beyond the canyon
    if (this.T.bridgeCount) this._buildBridges();
    if (this.T.oasis) {
      // oasisCount ponds (OASIS AMBUSH scatters three; canyon keeps its one)
      for (let k = 0, n = this.T.oasisCount || 1; k < n; k++) this._buildOasis();
    }
    if (this._river) this._buildRiver();             // the one world-spanning waterway
    if (this._river) this._buildRiverCrossings();    // fords get an apron, culverts a mouth
    if (this.T.riverCount) this._buildRivers();      // jungle streams under the road
    if (this.T.hollowArch) this._buildHollowArch();  // redwood drive-through trunk
    if (this.T.lamps) this._buildLamps();            // neon / undercity road lamps
    if (this.T.frontage) this._buildOldTown(m4);     // OLD TOWN street frontage + arches
    if (this.T.logYards) this._buildLogYards();      // flume timber stacks
    if (this.T.retainingWalls) this._buildRetainingWalls();   // alpine-pass parapets
    if (this.T.heroBridge) this._buildHeroBridge();           // hero rope crossing
    if (this.T.tunnels) this._buildTunnels();                 // galleries through the cuts
    if (this.T.guardFence) this._buildGuardFence();           // breakable mountain rail fence
    if (this.T.roadCabins) this._buildRoadCabins();           // log cabins on the shelves
    if (this.T.snowPatches) this._buildSnowPatches(m4);       // old snow at altitude
    this._buildWorldElements(m4);                    // farms, chapels, fences, dressing
    this._buildPastures();                           // grazing spots for the animal system
    this._buildCrossroads();                         // dirt side-road junctions (rural worlds)
    // FARMLAND: the banks that line every lane. AFTER the crossroads, the
    // props and the tire stacks, because it leaves a gap wherever one of them
    // already occupies the verge — a hedge cannot grow across a field gate.
    if (this.T.hedgeBanks) this._buildHedgeBanks(m4);
    this._buildRoadsideDetail(m4);                   // corner markers + gravel
    this._buildContactShadows();                     // baked AO under everything
  }

  /** OUTBACK RED DIRT: the dry creek beds, drawn from the wash polylines
   *  `_planCreeks` planted before the terrain existed.
   *
   *  Three things, and each of them is doing a job the region asked for:
   *
   *    - the WASH: a pale sand ribbon leaving the road on both sides and
   *      meandering out across the red plain. It is the only bright, low-
   *      saturation shape in a world made entirely of red ground, so it reads
   *      as a line across the landscape from a very long way off — which is
   *      the whole point of a 350 m sight line.
   *    - the BANK GRAVEL: a scatter of coarse stone along the first stretch of
   *      each wash, where the bank has been cut back for the crossing.
   *    - the FLOODWAY BOARDS: black-and-yellow chevrons on posts, one pair per
   *      creek, planted ~24 samples before the lip. Real station tracks are
   *      signed like this precisely because the drop is invisible until you
   *      are on it, and the Bible calls the signs out by name. They are SOLID
   *      at r = 0.4, well outside the carriageway (see the lateral below), so
   *      they obey the Law of Solidity without ever being in the way. */
  _buildCreekBeds(m4) {
    const beds = [];
    for (const ck of this.creeks) for (const side of ck.line) beds.push(side);
    const segGeo = new THREE.BoxGeometry(1, 1, 1);
    segGeo.translate(0, -0.5, 0);                       // hangs BELOW its anchor
    const bedMesh = new THREE.InstancedMesh(
      segGeo,
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, flatShading: true }),
      beds.length * 12
    );
    const sand = new THREE.Color('#d8b98a');
    const sandDark = new THREE.Color('#b4915f');
    const col = new THREE.Color();
    const q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
    let k = 0;
    for (const line of beds) {
      for (let s = 0; s + 1 < line.length; s++) {
        const a = line[s], b = line[s + 1];
        const dx = b.x - a.x, dz = b.z - a.z;
        const len = Math.hypot(dx, dz);
        if (len < 0.5) continue;
        const mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2;
        const w = (a.w + b.w) / 2;
        // the bed lies just under the plain — a channel, not a painted stripe
        const y = this.terrainHeight(mx, mz) + 0.06;
        q.setFromAxisAngle(up, Math.atan2(dx, dz));
        m4.compose(new THREE.Vector3(mx, y, mz), q, new THREE.Vector3(w, 0.55, len * 1.06));
        bedMesh.setMatrixAt(k, m4);
        col.copy(sand).lerp(sandDark, Math.random() * 0.55);
        bedMesh.setColorAt(k++, col);
      }
    }
    bedMesh.count = k;
    bedMesh.receiveShadow = true;
    this.group.add(bedMesh);

    // coarse bank gravel where the crossing was cut through
    const pebGeo = new THREE.DodecahedronGeometry(1, 0);
    const gravel = new THREE.InstancedMesh(
      pebGeo,
      new THREE.MeshStandardMaterial({ color: this.T.rockColor ?? 0x8e4a30,
        flatShading: true, roughness: 1 }),
      this.creeks.length * 44
    );
    let gk = 0;
    for (const ck of this.creeks) {
      for (const line of ck.line) {
        for (let n = 0; n < 22; n++) {
          const t = Math.random() * 2.4;                 // first ~2 wash segments
          const i0 = Math.min(line.length - 2, t | 0);
          const f = t - i0;
          const px = line[i0].x + (line[i0 + 1].x - line[i0].x) * f
            + (Math.random() - 0.5) * line[i0].w * 1.5;
          const pz = line[i0].z + (line[i0 + 1].z - line[i0].z) * f
            + (Math.random() - 0.5) * line[i0].w * 1.5;
          const s = 0.22 + Math.random() * 0.4;
          if (!this._clearsRoad(px, pz, s, 0.8)) continue;
          m4.makeScale(s, s * 0.6, s);
          m4.setPosition(px, this.terrainHeight(px, pz) + s * 0.2, pz);
          gravel.setMatrixAt(gk++, m4);
        }
      }
    }
    gravel.count = gk;
    this.group.add(gravel);

    // FLOODWAY boards on the approach to every creek
    const boardTex = chevronTexture();
    const boardMat = new THREE.MeshStandardMaterial({
      map: boardTex, transparent: true, side: THREE.DoubleSide, roughness: 0.9,
    });
    const boardGeo = new THREE.PlaneGeometry(2.4, 1.7);
    const postMat = new THREE.MeshStandardMaterial({ color: 0x8e8478, roughness: 1 });
    const postGeo = new THREE.CylinderGeometry(0.09, 0.11, 2.2, 5);
    for (const ck of this.creeks) {
      const j = (ck.index - 24 + N) % N;
      const heading = this.headingAt(j);
      for (const side of [1, -1]) {
        // ROAD_HALF is 9 and the car collides as a 1.8 u disc: 12.6 leaves the
        // full drivable width free even where the centreline swings under it
        const lat = 12.6 * side;
        const p = this.pointAt(j, lat);
        if (!this._clearsRoad(p.x, p.z, 0.4, 1.0)) continue;
        const post = new THREE.Mesh(postGeo, postMat);
        post.position.set(p.x, p.y + 1.1, p.z);
        post.castShadow = true;
        const board = new THREE.Mesh(boardGeo, boardMat);
        board.position.set(p.x, p.y + 2.2, p.z);
        board.rotation.y = heading + Math.PI / 2;        // face back down the road
        this.group.add(post, board);
        this.solids.push({ x: p.x, z: p.z, r: 0.4, y: p.y, mat: 'metal' });
        this._addShadow(p.x, p.z, 0.7, p.y);
      }
    }
  }

  /** ALPINE PASSES: dry-stone retaining parapets. A pass is built as a shelf
   *  cut into the face — every edge that falls away is held up by masonry, and
   *  the outside of every hairpin is walled. Instanced blocks with one small
   *  SOLID collider each, sitting far enough out (T.retainingWalls.lateral)
   *  that they never eat into the racing line: you only meet the stone if you
   *  have already left the road. */
  _buildRetainingWalls() {
    const S = this.T.retainingWalls;
    const LAT = S.lateral, H = S.height, MAX = S.max || 380;
    const geo = new THREE.BoxGeometry(3.4, H, 0.9);
    geo.translate(0, H / 2, 0);
    const mesh = new THREE.InstancedMesh(
      geo,
      new THREE.MeshStandardMaterial({
        map: stoneTexture(), roughness: 1, envMapIntensity: 0.4, vertexColors: false,
      }),
      MAX
    );
    mesh.castShadow = mesh.receiveShadow = true;
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0), col = new THREE.Color();
    let k = 0;
    for (let i = 0; i < N && k < MAX; i++) {
      if (this._circDist(i, 0) < 26) continue;              // keep the start gate clear
      const tight = this.curvature[i] > 0.028;
      // outside of the corner (the hairpin's exposed edge)
      const a = this.tan[i], b = this.tan[(i + 12) % N];
      const outside = (a.x * b.z - a.z * b.x) > 0 ? -1 : 1;
      for (const side of [1, -1]) {
        if (k >= MAX) break;
        const p = this.pointAt(i, LAT * side);
        // A fixed lateral offset is measured along ONE sample's normal, and on
        // the inside of a hairpin that lands well inside the road proper. On
        // GOTTHARD and TREMOLA the wall was sitting 5.7 u from the centreline —
        // over 3 u inside your own lane, as an 85-hull stone. Skip any block
        // that cannot clear the carriageway.
        if (!this._clearsRoad(p.x, p.z, 1.2, 1.0)) continue;
        const ground = this._terrainMeshHeight(p.x, p.z);
        // wall it where the shelf falls away, and always around tight bends
        if (p.y - ground < S.drop && !(tight && side === outside)) continue;
        // A parapet runs ALONG the road. headingAt() maps local +Z to the
        // tangent and +X across it, and this block's long axis is X (3.4 wide,
        // 0.9 deep) - so the bare heading pointed every block radially out of
        // the road edge and a hairpin came out as a comb of piano keys.
        q.setFromAxisAngle(up, this.headingAt(i) + Math.PI / 2);
        m4.compose(new THREE.Vector3(p.x, p.y - 0.55, p.z), q, new THREE.Vector3(1, 1, 1));
        mesh.setMatrixAt(k, m4);
        col.setScalar(0.86 + Math.random() * 0.28);
        mesh.setColorAt(k++, col);
        this.solids.push({ x: p.x, z: p.z, r: 1.2, y: p.y, mat: 'stone' });
      }
    }
    mesh.count = k;
    mesh.name = 'retaining-wall';
    if (k) this.group.add(mesh);
  }

  /** How many samples the bridge deck covers each way from the gorge centre. */
  _spanSamples() {
    return Math.ceil((this._gorge.spanU + 3.5) / this.segLen);
  }

  /** HERO CROSSING: a rope suspension bridge over the red-rock river gorge.
   *  Plank deck laid on the road, chunky timber towers at both ends, hemp main
   *  cables sagging in a catenary between them, vertical hangers down to rope
   *  railings along both edges — and a CHECKPOINT gate arch on the far bank
   *  with a log pile and fallen timber beside it. Collision comes only from
   *  the four tower posts and the two gate posts; the deck is just road. */
  _buildHeroBridge() {
    const G = this._gorge;
    if (!G) return;
    const span = this._spanSamples();
    const i0 = (G.i - span + N) % N, i1 = (G.i + span) % N;
    const deckW = WALL_OFF + 0.6;
    const wood = new THREE.MeshStandardMaterial({ color: 0x5a3a22, roughness: 0.95 });
    const darkWood = new THREE.MeshStandardMaterial({ color: 0x3e2716, roughness: 1 });
    const rope = new THREE.MeshStandardMaterial({ color: 0xc7a271, roughness: 1 });
    const g = new THREE.Group();

    // --- plank deck: individual timber baulks laid across the roadway ---
    // (discrete boxes, not one flat ribbon — a ribbon laid a few centimetres
    // over the road ribbon z-fights into black bands at grazing angles)
    {
      const rows = span * 2;
      const plankGeo = new THREE.BoxGeometry(deckW * 2, 0.22, 1.15);
      const tex = plankTexture();
      tex.anisotropy = 8;
      const planks = new THREE.InstancedMesh(
        plankGeo,
        new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 }),
        rows * 3
      );
      planks.name = 'bridge-deck';
      planks.receiveShadow = planks.castShadow = true;
      const m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
      const up = new THREE.Vector3(0, 1, 0), col = new THREE.Color();
      let k = 0;
      const step = 1.5 / this.segLen;                 // a baulk every ~1.5u
      for (let f = 0; f <= rows; f += step) {
        const j = (i0 + Math.round(f) + N) % N;
        const c = this.center[j];
        q.setFromAxisAngle(up, this.headingAt(j));
        m4.compose(new THREE.Vector3(c.x, c.y - 0.02, c.z), q, new THREE.Vector3(1, 1, 1));
        planks.setMatrixAt(k, m4);
        col.setScalar(0.86 + Math.random() * 0.28);
        planks.setColorAt(k++, col);
        if (k >= rows * 3) break;
      }
      planks.count = k;
      g.add(planks);
    }

    // --- towers at both ends ---
    const towerH = 7.4;
    const towerTop = [];
    for (const end of [i0, i1]) {
      const c = this.center[end], n = this.nrm[end];
      const pair = [];
      for (const side of [1, -1]) {
        const px = c.x + n.x * (deckW - 0.5) * side, pz = c.z + n.z * (deckW - 0.5) * side;
        const post = new THREE.Mesh(new THREE.BoxGeometry(1.5, towerH, 1.5), darkWood);
        post.position.set(px, c.y + towerH / 2 - 0.4, pz);
        post.rotation.y = this.headingAt(end);
        post.castShadow = true;
        g.add(post);
        pair.push(new THREE.Vector3(px, c.y + towerH - 0.6, pz));
        this.solids.push({ x: px, z: pz, r: 1.5, y: c.y + 1, mat: 'hut' });
        this._addShadow(px, pz, 2.4, c.y);
      }
      // cross beam over the roadway
      const beam = new THREE.Mesh(
        new THREE.BoxGeometry((deckW - 0.5) * 2 + 1.5, 0.7, 0.9), darkWood);
      beam.position.set(c.x, c.y + towerH - 0.9, c.z);
      // headingAt() maps local +Z along the road and local +X ACROSS it, and
      // this beam's long axis is X - so a quarter turn laid the 13 u baulk
      // lengthwise down the middle of the deck, at head height.
      beam.rotation.y = this.headingAt(end);
      beam.castShadow = true;
      g.add(beam);
      towerTop.push(pair);
    }

    // --- main cables (catenary) + hangers + rope railings ---
    const SEG = 22;
    for (let s = 0; s < 2; s++) {
      const side = s === 0 ? 1 : -1;
      const cable = [], railTop = [], railMid = [];
      for (let k = 0; k <= SEG; k++) {
        const t = k / SEG;
        const j = (i0 + Math.round(t * span * 2)) % N;
        const c = this.center[j], n = this.nrm[j];
        const x = c.x + n.x * (deckW - 0.5) * side, z = c.z + n.z * (deckW - 0.5) * side;
        // catenary: full tower height at the ends, sagging near the deck mid-span
        const sag = Math.cosh((t - 0.5) * 3.4) / Math.cosh(1.7);
        const y = c.y + 1.5 + (towerH - 2.1) * sag;
        cable.push(new THREE.Vector3(x, y, z));
        const dip = 0.55 * Math.sin(t * Math.PI);      // rope rails dip slightly
        railTop.push(new THREE.Vector3(x, c.y + 1.25 - dip * 0.35, z));
        railMid.push(new THREE.Vector3(x, c.y + 0.62 - dip * 0.3, z));
      }
      const tube = (pts, r, seg, mat) => {
        const m = new THREE.Mesh(
          new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), seg, r, 5, false), mat);
        m.castShadow = true;
        g.add(m);
      };
      tube(cable, 0.22, 30, rope);
      tube(railTop, 0.11, 26, rope);
      tube(railMid, 0.09, 26, rope);
      // vertical hangers from the cable down to the rail
      for (let k = 2; k < SEG - 1; k += 2) {
        const a = cable[k], b = railTop[k];
        const hang = new THREE.Mesh(new THREE.BoxGeometry(0.11, a.y - b.y, 0.11), rope);
        hang.position.set(a.x, (a.y + b.y) / 2, a.z);
        g.add(hang);
      }
      // deck-edge kerb rail the hangers land on
      for (let k = 0; k < SEG; k += 1) {
        const a = railMid[k], b = railMid[k + 1];
        if (!b) break;
        const len = a.distanceTo(b);
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.35, 0.16), wood);
        post.position.set(a.x, a.y - 0.35, a.z);
        g.add(post);
        if (len <= 0) break;
      }
    }
    this.group.add(g);

    // --- CHECKPOINT gate arch on the far bank ---
    const gi = (i1 + Math.round(11 / this.segLen)) % N;
    {
      const c = this.center[gi], n = this.nrm[gi];
      const arch = new THREE.Group();
      for (const side of [1, -1]) {
        const px = c.x + n.x * (deckW + 0.9) * side, pz = c.z + n.z * (deckW + 0.9) * side;
        const post = new THREE.Mesh(new THREE.BoxGeometry(1.3, 8.6, 1.3), darkWood);
        post.position.set(px, c.y + 4.3, pz);
        post.rotation.y = this.headingAt(gi);
        post.castShadow = true;
        arch.add(post);
        this.solids.push({ x: px, z: pz, r: 1.3, y: c.y + 1, mat: 'hut' });
        this._addShadow(px, pz, 2.2, c.y);
      }
      const w = (deckW + 0.9) * 2 + 1.3;
      const beam = new THREE.Mesh(new THREE.BoxGeometry(w, 1.0, 1.0), darkWood);
      beam.position.set(c.x, c.y + 8.1, c.z);
      beam.rotation.y = this.headingAt(gi);   // across the road, not along it
      beam.castShadow = true;
      arch.add(beam);
      // plank sign reading CHECKPOINT, visible from both approaches
      const signTex = bannerTexture('CHECKPOINT', '#3a2414', '#f0cf94');
      for (const flip of [0, Math.PI]) {
        const sign = new THREE.Mesh(
          new THREE.PlaneGeometry(w * 0.62, 2.2),
          new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.9 }));
        sign.position.set(c.x, c.y + 6.6, c.z);
        sign.rotation.y = this.headingAt(gi) + Math.PI / 2 + flip;
        sign.translateZ(0.56);
        arch.add(sign);
      }
      const cap = new THREE.Mesh(new THREE.BoxGeometry(w * 0.66, 0.34, 1.6), wood);
      cap.position.set(c.x, c.y + 8.75, c.z);
      cap.rotation.y = this.headingAt(gi) + Math.PI / 2;
      arch.add(cap);
      this.group.add(arch);
    }

    // --- log pile + fallen timber on the far bank ---
    {
      const K = ELEMENT_KITS[this.T.elements || 'alpine'];
      const B = this._elemB();          // shared — see the note on _elemB
      const c = this.center[(gi + Math.round(16 / this.segLen)) % N], n = this.nrm[gi];
      for (const [off, side] of [[15, 1], [19, -1]]) {
        const px = c.x + n.x * off * side, pz = c.z + n.z * off * side;
        if (!this._buildableSpot(px, pz, 4, 3.2)) continue;
        this._element(B, 'logpile', px, pz, this.headingAt(gi) + (Math.random() - 0.5), K);
      }
      // a couple of loose fallen logs
      const logGeo = new THREE.CylinderGeometry(0.55, 0.62, 6.5, 8);
      logGeo.rotateZ(Math.PI / 2);
      for (let k = 0; k < 3; k++) {
        const off = (13 + Math.random() * 9) * (k % 2 ? 1 : -1);
        const px = c.x + n.x * off, pz = c.z + n.z * off;
        const log = new THREE.Mesh(logGeo, wood);
        log.position.set(px, this.terrainHeight(px, pz) + 0.5, pz);
        log.rotation.y = Math.random() * Math.PI;
        log.castShadow = true;
        this.group.add(log);
        this._addShadow(px, pz, 3.4);
      }
    }

    this._buildGorgeRiver();
  }

  /** The pale turquoise river winding along the bottom of the hero gorge. */
  _buildGorgeRiver() {
    // A JUMP gorge is meant to be an empty hole: no floor, no water, nothing
    // that reads as a way across. Worlds that carry jump gorges get a dry gap.
    if (this._jumpGorges?.length) return;
    const G = this._gorge;
    const SEG = 26, HALF = 7.5;
    const verts = new Float32Array((SEG + 1) * 2 * 3);
    const uvs = new Float32Array((SEG + 1) * 2 * 2);
    const idx = [];
    for (let k = 0; k <= SEG; k++) {
      const t = (k / SEG - 0.5) * 2 * G.len;
      // the channel meanders a little as it runs down the gorge
      const wob = Math.sin(t * 0.035) * 4.5 + Math.sin(t * 0.011 + 1.3) * 3;
      const x = G.x + G.ax * t + G.vx * wob;
      const z = G.z + G.az * t + G.vz * wob;
      const y = G.floorY + 0.55 + Math.abs(t) * 0.02;
      const o = k * 6;
      verts[o] = x + G.vx * HALF; verts[o + 1] = y; verts[o + 2] = z + G.vz * HALF;
      verts[o + 3] = x - G.vx * HALF; verts[o + 4] = y; verts[o + 5] = z - G.vz * HALF;
      uvs[k * 4] = 0; uvs[k * 4 + 1] = t / 26;
      uvs[k * 4 + 2] = 1; uvs[k * 4 + 3] = t / 26;
    }
    for (let k = 0; k < SEG; k++) {
      const a = k * 2, b = a + 1, c = a + 2, d = a + 3;
      idx.push(a, b, c, b, d, c);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    const tex = riverTexture();
    tex.wrapT = THREE.RepeatWrapping;
    const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
      map: tex, roughness: 0.25, metalness: 0.05,
      color: 0x9fe4e0,                                  // pale glacial turquoise
      envMapIntensity: 1.2, transparent: true, opacity: 0.94,
    }));
    mesh.name = 'gorge-river';
    this.group.add(mesh);
  }

  /** FURKA RIDGE: the reddish wooden guard fence that runs the DOWNHILL edge
   *  of a mountain pass — posts and two rails, following the road all the way
   *  down the serpentine, with gaps through the hairpins.
   *
   *  It is BREAKABLE, never a wall: every bay is one instance of a single
   *  InstancedMesh (one draw call for the whole pass) plus an entry in the
   *  existing knockable-board array, so a car bursts through it at speed and
   *  missiles/blasts level it, exactly like a sponsor board. `smashBanner`
   *  below zeroes the instance and hands back a loose bay to fling. */
  _buildGuardFence() {
    const S = this.T.guardFence;
    const LAT = S.lateral, MAX = S.max || 190;
    const geo = mergeBoxes([
      { w: 0.24, h: 1.5, d: 0.24, x: -2.5, y: 0.75, z: 0 },
      { w: 0.24, h: 1.5, d: 0.24, x: 2.5, y: 0.75, z: 0 },
      { w: 5.4, h: 0.2, d: 0.14, x: 0, y: 1.28, z: 0 },
      { w: 5.4, h: 0.2, d: 0.14, x: 0, y: 0.78, z: 0 },
    ]);
    const mat = new THREE.MeshStandardMaterial({ color: S.color, roughness: 0.95 });
    const mesh = new THREE.InstancedMesh(geo, mat, MAX);
    mesh.castShadow = true;
    mesh.name = 'guard-fence';
    this._guardFenceMesh = mesh;
    this._guardFenceGeo = geo;
    this._guardFenceMat = mat;
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    const step = Math.max(2, Math.round(5.6 / this.segLen));   // one bay ≈ 5.6u
    let k = 0;
    for (let i = 0; i < N && k < MAX; i += step) {
      if (this._circDist(i, 0) < 30) continue;                 // clear of the gate
      if (this._nearGorge(i, 42)) continue;                    // the bridge has its own rails
      if (this.curvature[i] > 0.045) continue;                 // gap through hairpins
      // downhill side: the edge that falls away
      let side = 0, drop = 0;
      for (const sd of [1, -1]) {
        const p = this.pointAt(i, LAT * sd);
        const d = p.y - this._terrainMeshHeight(p.x, p.z);
        if (d > drop) { drop = d; side = sd; }
      }
      if (!side || drop < 1.4) continue;
      const p = this.pointAt(i, LAT * side);
      q.setFromAxisAngle(up, this.headingAt(i));
      m4.compose(new THREE.Vector3(p.x, p.y - 0.35, p.z), q, new THREE.Vector3(1, 1, 1));
      mesh.setMatrixAt(k, m4);
      this.banners.push({
        x: p.x, z: p.z, y: p.y - 0.35, r: 1.2, dead: false,
        kind: 'fence', id: k, heading: this.headingAt(i),
      });
      k++;
    }
    mesh.count = k;
    if (k) this.group.add(mesh);
  }

  /** Unit hedge-bank prism: a trapezoid cross-section in the local X-Y plane
   *  (base 1 wide at y=0, crest 0.36 wide at y=1) extruded 1 along local Z.
   *
   *  It exists because nothing in the kit is this shape. A BoxGeometry has no
   *  batter, and the shared gable prism (gablePrismGeo) is a triangle whose
   *  ridge runs along local X — i.e. ACROSS the road once it is rotated by
   *  headingAt, which is the wrong axis and gives no crest for a hedge to sit
   *  on. Local Z is along the lane, so scale is (bankWidth, height, bayLength).
   *  Twelve triangles, built once per world. */
  _bankPrismGeo() {
    const b0 = [-0.5, 0, -0.5], b1 = [0.5, 0, -0.5], b2 = [0.5, 0, 0.5], b3 = [-0.5, 0, 0.5];
    const t0 = [-0.18, 1, -0.5], t1 = [0.18, 1, -0.5], t2 = [0.18, 1, 0.5], t3 = [-0.18, 1, 0.5];
    const tris = [
      [t0, t3, t2], [t0, t2, t1],          // crest
      [b1, t1, t2], [b1, t2, b2],          // +x batter
      [b0, t3, t0], [b0, b3, t3],          // -x batter
      [b0, t0, t1], [b0, t1, b1],          // end cap
      [b3, t2, t3], [b3, b2, t2],          // end cap
      [b0, b1, b2], [b0, b2, b3],          // sole (buried, but never see-through)
    ];
    const pos = new Float32Array(tris.length * 9);
    let o = 0;
    for (const t of tris) for (const v of t) { pos[o++] = v[0]; pos[o++] = v[1]; pos[o++] = v[2]; }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.computeVertexNormals();
    return geo;
  }

  /** FARMLAND HEDGEROW: THE BANK.
   *
   *  Every other world's answer to "what happens if you go wide" is runoff,
   *  scenery, or a wall you can see coming from a corner away. This region's
   *  answer, per RALLY_WORLD_BIBLE 3.8, is that there is no answer: an earth
   *  bank 1.2-2.2 m high topped with 1.6-2.4 m of thorn runs continuously down
   *  both sides of the lane, and a car that leaves the road hits it.
   *
   *  Two InstancedMeshes — bank prisms and hedge blocks, one draw call each —
   *  and one small SOLID per bay. The bays are spaced so their PUSH-OUT circles
   *  (r + the 1.8 u car radius the physics adds) overlap: a chain of separated
   *  colliders is a fence with holes in it, and the whole point of this world
   *  is that there are no holes.
   *
   *  It is deliberately NOT stone. The solids are tagged 'bank', which falls to
   *  the generic barrier response in onSolidCrash — a scrape costs paint and
   *  speed and caps at 24 hull. Earth is not a cliff face, and this thing is
   *  close enough to the carriageway that stone damage would make the world
   *  unplayable rather than intimidating.
   *
   *  Gaps are authored, not accidental: the start gate, every field entrance
   *  (the crossroad spurs), every ford, one gateway per ~11 bays, and anywhere
   *  a prop or a tire stack already stands on the verge. */
  _buildHedgeBanks(m4) {
    const S = this.T.hedgeBanks;
    const LAT = S.lateral, H = S.bankH, W = S.bankW, HH = S.hedgeH, MAX = S.max || 520;
    // One bay per `step` samples; the mesh runs 8 % long so the run reads
    // continuous instead of as a row of separate lumps.
    const step = Math.max(2, Math.round((S.bay || 6.2) / this.segLen));
    const bayLen = step * this.segLen * 1.08;
    const bankGeo = this._bankPrismGeo();
    const hedgeGeo = new THREE.BoxGeometry(1, 1, 1);
    hedgeGeo.translate(0, 0.5, 0);
    const banks = new THREE.InstancedMesh(
      bankGeo,
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(this.T.terrainScree || this.T.terrainDirt),
        flatShading: true, roughness: 1, envMapIntensity: 0.3,
      }),
      MAX
    );
    const hedges = new THREE.InstancedMesh(
      hedgeGeo,
      new THREE.MeshStandardMaterial({
        color: 0xffffff, flatShading: true, roughness: 1, envMapIntensity: 0.25,
      }),
      MAX
    );
    banks.castShadow = banks.receiveShadow = true;
    hedges.castShadow = hedges.receiveShadow = true;
    banks.name = 'hedge-bank';
    hedges.name = 'hedge-top';
    const q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
    const col = new THREE.Color(), leaf = new THREE.Color();
    const F = this.T.foliage;
    // Verge furniture that was here first — a bay is dropped rather than grown
    // through a crate or a tire stack. Only things actually standing in the
    // bank's own lateral band count: props scatter from 10.5 to 22 u out, and
    // testing all of them threw away half the run for objects the bank was
    // never going to touch.
    const verge = [...this.props, ...this.tireStacks].filter(
      (v) => Math.abs(this._distToTrack(v.x, v.z) - LAT) < W * 0.5 + (v.r ?? 1.2));
    let k = 0, bay = 0;
    for (let i = 0; i < N && k < MAX; i += step) {
      if (this._circDist(i, 0) < 34) continue;                    // start grid + gate
      if (this._nearGorge(i, 40)) continue;
      // streams wash across the lane; the bank opens for them on both sides
      if (this.fords.some((f) => this._circDist(i, f.i) < f.half / this.segLen + 5)) continue;
      bay++;
      for (const side of [1, -1]) {
        if (k >= MAX) break;
        // field entrance: the spur cuts the bank clean through
        if (this.crossroads.some((c) => this._circDist(i, c.index)
          < (c.side === side ? 9 : 4))) continue;
        // one five-bar gateway every ~18 bays, staggered between the sides —
        // roughly a gate every 110 u of hedge, which is the Bible's field
        // entrance rate. They are the only way off the lane; that is the point.
        if ((bay + (side > 0 ? 0 : 9)) % 18 === 0) continue;
        const p = this.pointAt(i, LAT * side);
        // AN OFFSET IS NOT A DISTANCE. `pointAt` measures along one sample's
        // normal; on the inside of a bend the road swings under it. The bank
        // is the closest thing to the carriageway in the world, so it is the
        // one that must ask the whole lap how far away the road actually is.
        if (!this._clearsRoad(p.x, p.z, W / 2, 1.0)) continue;
        if (verge.some((v) => (v.x - p.x) ** 2 + (v.z - p.z) ** 2 < 5.8)) continue;
        // seat it on the lower of the road and the field: the lane is sunken,
        // so the bank always meets the road side and buries into the field side
        const ground = this._terrainMeshHeight(p.x, p.z);
        const base = Math.min(p.y, ground) - 0.4;
        const h = H * (0.86 + Math.random() * 0.3);
        q.setFromAxisAngle(up, this.headingAt(i));
        m4.compose(new THREE.Vector3(p.x, base, p.z), q, new THREE.Vector3(W, h, bayLen));
        banks.setMatrixAt(k, m4);
        col.setScalar(0.84 + Math.random() * 0.3);
        banks.setColorAt(k, col);
        // the thorn on top: flailed, so it is a block, not a blob — jittered in
        // height and yaw so the run has a ragged skyline rather than a hemline
        const hh = HH * (0.8 + Math.random() * 0.42);
        q.setFromAxisAngle(up, this.headingAt(i) + (Math.random() - 0.5) * 0.16);
        m4.compose(new THREE.Vector3(p.x, base + h * 0.92, p.z), q,
          new THREE.Vector3(W * 0.8, hh, bayLen * 1.02));
        hedges.setMatrixAt(k, m4);
        leaf.setHSL(F.h + Math.random() * F.hVar, F.s + Math.random() * F.sVar,
          Math.max(0.10, F.l - 0.06 + Math.random() * F.lVar));
        hedges.setColorAt(k, leaf);
        this.solids.push({ x: p.x, z: p.z, r: W / 2, y: base + h * 0.5, mat: 'bank' });
        k++;
      }
    }
    banks.count = hedges.count = k;
    if (k) this.group.add(banks, hedges);
    else { bankGeo.dispose(); hedgeGeo.dispose(); }
  }

  /** Log cabins standing on the shelves right beside the pass, the way real
   *  mountain huts do. Uses the world-element archetypes so they are SOLID
   *  'hut' colliders with plank-burst crashes like every other building. */
  _buildRoadCabins() {
    const K = ELEMENT_KITS[this.T.elements || 'alpine'];
    const B = this._elemB();          // shared with the huts and the farmsteads
    let placed = 0;
    for (let tries = 0; tries < 220 && placed < this.T.roadCabins; tries++) {
      const i = (Math.random() * N) | 0;
      if (this._circDist(i, 0) < 40) continue;
      const side = Math.random() < 0.5 ? 1 : -1;
      const p = this.pointAt(i, side * (20 + Math.random() * 14));
      if (!this._buildableSpot(p.x, p.z, 7, 2.4)) continue;
      // AND IT MUST ACTUALLY BE OFF THE ROAD.
      //
      // `pointAt(i, 20..34)` measures along ONE sample's normal. On a world
      // whose road switchbacks up a mountain, the neighbouring leg of the
      // centreline swings underneath that offset, so "34 u to the side" can
      // land on tarmac. `_buildableSpot` cannot catch it: it tests terrain
      // flatness and spacing against other buildings, and never asks how far
      // the road is. Measured on FURKA RIDGE — the only world with roadCabins
      // — FOUR OF FIVE cabins intruded, the worst sitting at lateral 0.25 with
      // a 5 u solid radius. A house on the centreline, with push-out.
      //
      // `_clearsRoad` does a global nearest-sample search and is what
      // _buildHuts and _buildRetainingWalls already use. The cabin's collider
      // is ~5 u, so clear that plus the usual margin.
      if (!this._clearsRoad(p.x, p.z, 6.2)) continue;   // house footprint grew to r=6.0
      // face the road
      const rot = this.headingAt(i) + (side > 0 ? -Math.PI / 2 : Math.PI / 2);
      this._element(B, Math.random() < 0.7 ? 'house' : 'shed', p.x, p.z, rot, K);
      placed++;
    }
    // no realize here — `_buildWorldElements` flushes the shared batch once,
    // after every producer has written into it
  }

  /** The bay itself: one water plane on the sea side of the coastline,
   *  aligned to it and big enough to reach the rim mountains, which rise
   *  straight from the water the way a Riviera skyline does. Fog washes it
   *  to haze at distance — but it is WATER fading out, not a void. */
  _buildSea() {
    const C = this.T.coast;
    const abx = C.b[0] - C.a[0], abz = C.b[1] - C.a[1];
    const L = Math.hypot(abx, abz);
    const ux = abx / L, uz = abz / L;             // along the coastline
    const nx = abz / L, nz = -abx / L;            // seaward (grad of _coastSide)
    // Corner-built in world space rather than a rotated plane: the first cut
    // used rotation.y with the axes crossed and the "sea" sprawled under the
    // whole map, surfacing as blue speckles in every inland dip. Four
    // explicit corners cannot be misplaced: the quad spans the coastline and
    // extends only SEAWARD.
    const mx = (C.a[0] + C.b[0]) / 2, mz = (C.a[1] + C.b[1]) / 2;
    const y = C.level ?? -2;
    // TO THE HORIZON, AND EXEMPT FROM FOG. The first sea was a 1900 u quad
    // under scene fog, and scene fog is the land's warm dust colour — so past
    // ~1000 u the water faded to the exact cream it was built to replace, and
    // the player kept seeing "the white stuff" over the bay. Water doesn't
    // haze like a dusty hillside: the material opts out of fog and the fade
    // is baked per-vertex instead — seaColor at the beach easing toward the
    // sky-horizon tone with distance from the arena, meeting the sky dome at
    // a proper sea horizon line instead of a cream wall.
    const HALF = 4200, DEEP = 4200;
    // COORDINATE LADDERS: uniform-fine in the near field, geometric to the
    // horizon. Power spacing in both axes was fine in only ONE direction at a
    // time - near the beach the triangles came out as slivers about 10 u deep
    // and 60 u wide, and a sliver shades as a BAND, which is why the bay kept
    // reading as a flat gradient however hard the colours were jittered. The
    // reference is a field of small triangles, so the water the player can
    // actually see is now a uniform CELL-metre grid, and only past it does
    // the spacing grow.
    const CELL = 20;
    const ladder = (near, far) => {
      const out = [];
      for (let v = 0; v <= near; v += CELL) out.push(v);
      // Gentle growth, not x1.55. Cells that reach ~1000 u across are flat
      // enough to mirror the sun as ONE sheet, while the fine near cells break
      // the same glare into facets - and the boundary between the two showed up
      // as a hard vertical seam across the bay, measured 196 vs 168 brightness
      // either side of it. Growing slowly keeps facets small for long enough
      // that the glare stays broken all the way out.
      let v = near, step = CELL * 1.4;
      while (v < far - 1) { v = Math.min(far, v + step); out.push(v); step *= 1.22; }
      return out;
    };
    const halfLadder = ladder(L / 2 + 320, HALF);
    const us = halfLadder.slice(1).reverse().map((v) => -v).concat(halfLadder);
    const dns = ladder(400, DEEP);
    const COLS = us.length - 1, ROWS = dns.length - 1;
    const cNear = new THREE.Color(this.T.seaColor ?? 0x3d7f9e);
    const cFar = cNear.clone().lerp(new THREE.Color(this.T.skyHorizon ?? '#dce8f0'), 0.8);
    const verts = new Float32Array((COLS + 1) * (ROWS + 1) * 3);
    const cols = new Float32Array((COLS + 1) * (ROWS + 1) * 3);
    const tmp = new THREE.Color();
    for (let r = 0, k = 0; r <= ROWS; r++) {
      for (let c = 0; c <= COLS; c++, k++) {
        // power spacing BOTH ways: fine columns through the middle of the
        // coastline (where the arena and every camera live) growing coarse
        // toward the edges, fine rows through the shallow/deep gradient near
        // the beach. Uniform columns were 190 u wide — near-shore triangles
        // that big shade as one flat gradient, which is exactly the "flat
        // water" the reference forbids. Centre columns now land ~15-40 u.
        const du = us[c], dn = dns[r];
        const wx = mx + ux * du + nx * dn, wz = mz + uz * du + nz * dn;
        // FACETED WATER, per the player's reference: every vertex bobs a
        // little (deterministic hash - rebuild-stable), damped to nothing at
        // the waterline so the shore contour never moves. flatShading below
        // turns the jitter into the light-catching triangle field.
        const hsh = Math.sin(wx * 12.9898 + wz * 78.233) * 43758.5453;
        const bob = (hsh - Math.floor(hsh) - 0.5)
          * 2.9 * smoothstep01(THREE.MathUtils.clamp((dn - 3) / 42, 0, 1));
        verts[k * 3] = wx; verts[k * 3 + 1] = y + bob; verts[k * 3 + 2] = wz;
        // Haze by distance from the ROAD, not from the world origin. Origin is
        // not where the player is: on a coast that sits off-centre, the water
        // at one end of the bay measured 750 u from origin and the other end
        // far less, so half the bay washed pale while the other half stayed
        // saturated - and the near-field/far-field grid boundary turned that
        // gradient into a hard vertical seam across the water. Distance to the
        // carriageway is what "far away" actually means to a driver.
        const haze = smoothstep01(THREE.MathUtils.clamp((this._distToTrack(wx, wz) - 380) / 1400, 0, 1));
        tmp.copy(cNear).lerp(cFar, haze);
        // SHALLOWS to DEEP: turquoise off the beach, darkening teal past the
        // bar - depth the way the player's reference art shades its bays,
        // not one flat fill
        const shal = 1 - smoothstep01(THREE.MathUtils.clamp(dn / 55, 0, 1));
        if (shal > 0) tmp.lerp(new THREE.Color(0x7adfd6), shal * 0.8);
        const deep = smoothstep01(THREE.MathUtils.clamp((dn - 55) / 180, 0, 1));
        if (deep > 0) tmp.lerp(new THREE.Color(0x17415e), deep * 0.7);
        cols[k * 3] = tmp.r; cols[k * 3 + 1] = tmp.g; cols[k * 3 + 2] = tmp.b;
      }
    }
    const idx = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const a = r * (COLS + 1) + c, b2 = a + 1, d = a + COLS + 1, e = d + 1;
        // wound UP. The first version pushed (a,e,b2),(a,d,e), whose face
        // normals came out at y = -0.998: the sea was built face-down and
        // only looked lit because DoubleSide flips normals on back faces.
        idx.push(a, b2, e, a, e, d);
      }
    }
    const geoIdx = new THREE.BufferGeometry();
    geoIdx.setAttribute('position', new THREE.BufferAttribute(verts, 3));
    geoIdx.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    geoIdx.setIndex(idx);
    // PER-FACE COLOUR, NOT PER-VERTEX. Vertex colours are Gouraud-interpolated
    // no matter what flatShading says (flat shading only affects NORMALS), so
    // a jitter baked per vertex smears into soft noise and the shallows —
    // where the bob is damped to keep the waterline clean — still read as one
    // flat gradient. De-indexing gives every triangle its own three vertices;
    // one deterministic hash per FACE then tints the whole triangle ±5 %
    // luminance, which is what makes the low-poly facet field read right up
    // to the beach, exactly like the player's reference art. ~3k faces, and
    // computeVertexNormals on unshared vertices yields true face normals.
    const geo = geoIdx.toNonIndexed();
    geoIdx.dispose();
    const fpos = geo.getAttribute('position'), fcol = geo.getAttribute('color');
    for (let f = 0; f < fpos.count; f += 3) {
      const cx = (fpos.getX(f) + fpos.getX(f + 1) + fpos.getX(f + 2)) / 3;
      const cz = (fpos.getZ(f) + fpos.getZ(f + 1) + fpos.getZ(f + 2)) / 3;
      // Facet jitter belongs to the near field ONLY. Carried out to 1780 u
      // it was tinting single facets hundreds of units across by 11 % - one
      // of those reads as a pale sheet with a dead-straight edge, which is
      // the 'seam' that showed up in the bay. Gone by ~700 u, where facets
      // are too big to jitter honestly.
      const fade = 1 - smoothstep01(THREE.MathUtils.clamp((this._distToTrack(cx, cz) - 250) / 450, 0, 1));
      // Two hashes, because facets differ in TONE as well as brightness in the
      // reference art: one shifts the whole triangle's luminance, the other
      // rocks it between green-turquoise and blue. 5 % was invisible.
      const fsh = Math.sin(cx * 17.2318 + cz * 3.7135) * 24634.6345;
      const tsh = Math.sin(cx * 4.8891 + cz * 21.4471) * 13571.1357;
      // THE SHALLOWS ARE THE NEAREST WATER TO EVERY CAMERA and were the
      // flattest, because the vertex bob is deliberately damped there to pin
      // the waterline. Louder COLOUR jitter restores the facet read without
      // moving a vertex, and a milky lerp at the waterline gives the foam
      // dashes water that looks like it made them.
      const rdu = cx - mx, rdz = cz - mz;
      const dnF = rdu * nx + rdz * nz;
      const shallow = dnF > 1 && dnF < 55 ? 1.35 : 1;
      const j = 1 + (fsh - Math.floor(fsh) - 0.5) * 0.3 * fade * shallow
        + (shallow > 1 ? 0.03 : 0);
      const tw = (tsh - Math.floor(tsh) - 0.5) * 0.19 * fade * shallow;
      const milk = dnF > 0 && dnF < 8 ? 0.15 * (1 - dnF / 8) : 0;
      for (let v = 0; v < 3; v++) {
        let r2 = fcol.getX(f + v) * j * (1 - tw * 0.7);
        let g2 = fcol.getY(f + v) * j * (1 + tw);
        let b2 = fcol.getZ(f + v) * j * (1 - tw * 0.5);
        if (milk > 0) {
          r2 += (0.92 - r2) * milk; g2 += (0.965 - g2) * milk; b2 += (0.95 - b2) * milk;
        }
        fcol.setXYZ(f + v, Math.min(1, r2), Math.min(1, g2), Math.min(1, b2));
      }
    }
    geo.computeVertexNormals();
    const sea = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
      // matte enough that the depth gradient READS - at 0.14 the sun's
      // specular washed the whole bay to one flat cyan
      vertexColors: true, roughness: 0.7, metalness: 0.02,
      side: THREE.DoubleSide, fog: false, flatShading: true,
    }));
    sea.name = 'sea';
    sea.receiveShadow = true;
    this.group.add(sea);

    // SURF: two foam bands hugging the waterline - a bright broken line at
    // the beach and a fainter one a few metres out
    // one bright ribbon only: the old 0.2-opacity outer band was invisible
    // and cost a draw; the broken outer line is dashes now (see WAVE CRESTS)
    for (const [dn, w, op] of [[2.2, 1.5, 0.5]]) {
      const segs = 64;
      const fverts = new Float32Array((segs + 1) * 2 * 3);
      for (let c2 = 0; c2 <= segs; c2++) {
        const du = -HALF * 0.35 + (HALF * 0.7 * c2) / segs;
        const wig = Math.sin(c2 * 1.7) * 2.2;
        for (let e = 0; e < 2; e++) {
          const dd = dn + wig * 0.3 + e * w;
          const o = (c2 * 2 + e) * 3;
          fverts[o] = mx + ux * du + nx * dd;
          fverts[o + 1] = y + 0.06;
          fverts[o + 2] = mz + uz * du + nz * dd;
        }
      }
      const fidx = [];
      for (let c2 = 0; c2 < segs; c2++) {
        const a = c2 * 2, b2 = a + 1, c3 = a + 2, d = a + 3;
        fidx.push(a, c3, b2, b2, c3, d);
      }
      const fgeo = new THREE.BufferGeometry();
      fgeo.setAttribute('position', new THREE.BufferAttribute(fverts, 3));
      fgeo.setIndex(fidx);
      const foam = new THREE.Mesh(fgeo, new THREE.MeshBasicMaterial({
        color: 0xffffff, transparent: true, opacity: op, depthWrite: false,
      }));
      foam.name = 'sea-foam';
      this.group.add(foam);
    }

    // ISLETS: craggy rock stacks, not traffic cones - a wet-band clone of the
    // shared top-lit rock geometry whose baked gradient darkens below local
    // y ~= -0.1, so the tide line comes free with the vertex colours
    const wetRock = (detail) => {
      const g2 = this._topLitRockGeo(detail).clone();
      const pp = g2.attributes.position, cc = g2.attributes.color;
      for (let vi = 0; vi < pp.count; vi++) {
        if (pp.getY(vi) < -0.1) {
          const dk = 0.34 + 0.16 * (pp.getY(vi) + 1);
          cc.setXYZ(vi, dk, dk, dk);
        }
      }
      return g2;
    };
    const wetMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.T.rockColor ?? 0x8a8272).lerp(new THREE.Color(0x3c4448), 0.25),
      flatShading: true, roughness: 0.95, vertexColors: true,
    });
    const isle = new THREE.InstancedMesh(wetRock(1), wetMat, 4);
    const im4 = new THREE.Matrix4();
    const iq = new THREE.Quaternion(), iup = new THREE.Vector3(0, 1, 0);
    const ISLES = [[-330, 120, 14, 9], [140, 180, 20, 13], [430, 240, 11, 7], [-90, 320, 26, 15]];
    for (let k = 0; k < ISLES.length; k++) {
      const [du, dn, w, hI] = ISLES[k];
      iq.setFromAxisAngle(iup, k * 1.7);
      im4.compose(new THREE.Vector3(mx + ux * du + nx * dn, y - 2, mz + uz * du + nz * dn),
        iq, new THREE.Vector3(w, hI, w * 0.8));
      isle.setMatrixAt(k, im4);
    }
    isle.castShadow = true;
    this.group.add(isle);


    // SAILS: little day boats moored in the bay. On a quay world (harbour)
    // a second flotilla moors CLOSE IN — sail boats and smaller rowing boats
    // bobbing 8-25 u off the waterline, right under the quay wall, which is
    // what makes the seafront read as a working harbour and not a beach.
    // THE OPEN-WATER FLOTILLA. These used to be a BOX with a CONE stuck on
    // top, and on a quay world eight of them moored 8-25 u out - the same
    // water the marina fills, so its slips had toy boats parked through the
    // real ones, and the cones were the little white pyramids dotted over
    // every harbour screenshot. They share the marina's hull now, and on a
    // quay world they keep to the far bay and leave the moorings to the
    // marina, which does that job properly.
    const HBs = this._boatHull();
    const bdeckMat = new THREE.MeshStandardMaterial({ color: 0x9a7c52, roughness: 1,
      side: THREE.DoubleSide, flatShading: true });
    const BOATS = this.T.quay
      ? [[-260, 120, 1, 0xf2ede2], [-40, 190, 1, 0xc85a40], [150, 105, 1, 0xf2ede2],
         [330, 165, 1, 0x4a6e8a], [430, 88, 0, 0xe8dcc4]]
      : [[-220, 42, 1, 0xf2ede2], [-60, 70, 1, 0xc85a40], [60, 38, 1, 0xf2ede2],
         [230, 85, 1, 0x6a8a5a], [340, 55, 0, 0xf2ede2]];
    const nSails = BOATS.reduce((n, bt) => n + bt[2], 0);
    const hulls = new THREE.InstancedMesh(HBs.hull,
      new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true,
        roughness: 0.55, side: THREE.DoubleSide, flatShading: true }), BOATS.length);
    const bdecks = new THREE.InstancedMesh(HBs.deck, bdeckMat, BOATS.length);
    const bmastG = new THREE.CylinderGeometry(0.09, 0.13, 7.6, 8);
    const bmasts = new THREE.InstancedMesh(bmastG,
      new THREE.MeshStandardMaterial({ color: 0xcfcabc, roughness: 0.5 }),
      Math.max(1, nSails));
    const sailG = this._sailGeo([0, 1.35, 0.1], [0, 7.3, -0.05], [0, 1.8, -3.4], 0.3);
    const sails = new THREE.InstancedMesh(sailG,
      new THREE.MeshStandardMaterial({ color: 0xf7f5ee, flatShading: true,
        roughness: 0.8, side: THREE.DoubleSide }), Math.max(1, nSails));
    // THE BOATS OUT IN THE BAY GET THE SAME RIG AS THE ONES IN THE SLIPS.
    //
    // The flotilla shares the marina's HULL, but it was still carrying a bare
    // pole and one flat triangle while the moored fleet had a coachroof, a
    // boom, a jib, standing rigging and guardrails. From the seafront the
    // difference is obvious - reported as "sailboats need the same high poly
    // you've developed" - and it costs four more instanced meshes for the whole
    // bay, because every one of these parts is identical on every boat.
    const bjibG = this._sailGeo([0, 0.95, 3.6], [0, 6.7, 0.1], [0, 1.1, 0.3], 0.24);
    const bjibs = new THREE.InstancedMesh(bjibG,
      new THREE.MeshStandardMaterial({ color: 0xeee9dc, flatShading: true,
        roughness: 0.8, side: THREE.DoubleSide }), Math.max(1, nSails));
    const bboomG = new THREE.CylinderGeometry(0.07, 0.08, 3.6, 8);
    bboomG.rotateX(Math.PI / 2);
    bboomG.translate(0, 1.72, -1.7);
    const bbooms = new THREE.InstancedMesh(bboomG,
      new THREE.MeshStandardMaterial({ color: 0xcfcabc, roughness: 0.5 }),
      Math.max(1, nSails));
    // coachroof + a dark window band, welded so it is one draw call
    const bcabG = this._bundle([
      new THREE.BoxGeometry(1.5, 0.6, 2.6).translate(0, 1.28, -1.0),
      new THREE.BoxGeometry(1.56, 0.2, 2.2).translate(0, 1.42, -1.0),
    ]);
    const bcabs = new THREE.InstancedMesh(bcabG,
      new THREE.MeshStandardMaterial({ color: 0xf2ede2, roughness: 0.8,
        flatShading: true }), BOATS.length);
    // standing rigging and a guardrail, from their real endpoints
    const MHb = [0, 8.6, 0.05];
    const brigG = this._bundle([
      this._strut(MHb, [0, 1.1, 3.9], 0.03, 4),
      this._strut(MHb, [0, 0.95, -3.7], 0.03, 4),
      this._strut(MHb, [-1.1, 1.0, -0.2], 0.028, 4),
      this._strut(MHb, [1.1, 1.0, -0.2], 0.028, 4),
      this._strut([-1.2, 1.5, -2.8], [-1.25, 1.5, 2.2], 0.024, 4),
      this._strut([1.2, 1.5, -2.8], [1.25, 1.5, 2.2], 0.024, 4),
    ]);
    const brigs = new THREE.InstancedMesh(brigG,
      new THREE.MeshStandardMaterial({ color: 0xcfcabc, roughness: 0.5,
        metalness: 0.3 }), Math.max(1, nSails));
    const bcol = new THREE.Color();
    const bl = new THREE.Matrix4(), blq = new THREE.Quaternion();
    let sk2 = 0;
    for (let k = 0; k < BOATS.length; k++) {
      const du = BOATS[k][0], dn = BOATS[k][1], hasSail = BOATS[k][2], tint = BOATS[k][3];
      const bx = mx + ux * du + nx * dn, bz = mz + uz * du + nz * dn;
      // a rowing boat is smaller and carries no rig
      const bs = hasSail ? 0.62 + ((k * 7) % 3) * 0.05 : 0.42;
      iq.setFromAxisAngle(iup, k * 2.3);
      // floated on the chine, the same rule the marina uses
      im4.compose(new THREE.Vector3(bx, y + 0.38 * bs, bz), iq,
        new THREE.Vector3(bs, bs, bs));
      hulls.setMatrixAt(k, im4);
      hulls.setColorAt(k, bcol.set(tint));
      bdecks.setMatrixAt(k, im4);
      // every boat gets a coachroof; the rigged ones get the whole wardrobe
      blq.identity();
      bl.compose(new THREE.Vector3(0, 1.0, 0), blq, new THREE.Vector3(1, 1, 1));
      bcabs.setMatrixAt(k, new THREE.Matrix4().multiplyMatrices(im4, bl));
      if (hasSail) {
        bl.compose(new THREE.Vector3(0, 1.0, 0.05), blq, new THREE.Vector3(1, 1, 1));
        const wm = new THREE.Matrix4().multiplyMatrices(im4, bl);
        sails.setMatrixAt(sk2, wm);
        bjibs.setMatrixAt(sk2, wm);
        bbooms.setMatrixAt(sk2, wm);
        brigs.setMatrixAt(sk2, wm);
        bl.compose(new THREE.Vector3(0, 4.8, 0.05), blq, new THREE.Vector3(1, 1, 1));
        bmasts.setMatrixAt(sk2, new THREE.Matrix4().multiplyMatrices(im4, bl));
        sk2++;
      }
    }
    bjibs.count = bbooms.count = brigs.count = sk2;
    bcabs.count = BOATS.length;
    bjibs.castShadow = bbooms.castShadow = brigs.castShadow = bcabs.castShadow = true;
    sails.count = bmasts.count = sk2;
    hulls.castShadow = sails.castShadow = bdecks.castShadow = true;
    if (hulls.instanceColor) hulls.instanceColor.needsUpdate = true;
    this.group.add(hulls, bdecks, bmasts, sails, bjibs, bbooms, brigs, bcabs);

    // SEA ROCKS: near-shore outcrops with the same wet tide band. Placement
    // rejects everything that matters: every flotilla mooring, every buoy,
    // every isle, and on a quay world the whole marina/mole water. Only
    // stacks a car can actually reach (shallow, big) become solid.
    const seaRocks = new THREE.InstancedMesh(wetRock(0), wetMat, 48);
    let srk = 0;
    const srCol = new THREE.Color();
    const srTaken = [];
    const hsh2 = (n) => { const v = Math.sin(n * 12.9898) * 43758.5453; return v - Math.floor(v); };
    for (let cand = 0; cand < 60 && srk < 30; cand++) {
      const du = (hsh2(cand + 0.7) - 0.5) * (L + 480);
      const dn = this.T.quay ? 48 + hsh2(cand + 1.3) * 72 : 16 + hsh2(cand + 1.3) * 54;
      if (this.T.quay && du > 0.62 * L && dn < 70) continue;   // harbour mouth + mole
      const bx = mx + ux * du + nx * dn, bz = mz + uz * du + nz * dn;
      let clear = true;
      for (const bt of BOATS) {
        if (Math.hypot((bt[0] - du), (bt[1] - dn)) < 28) { clear = false; break; }
      }
      if (!clear) continue;
      for (const t2 of srTaken) {
        if (Math.hypot(t2[0] - du, t2[1] - dn) < 34) { clear = false; break; }
      }
      if (!clear) continue;
      for (const [idu, idn, iw] of ISLES) {
        if (Math.hypot(idu - du, idn - dn) < 40 + iw) { clear = false; break; }
      }
      if (!clear) continue;
      srTaken.push([du, dn]);
      const sscale = 1.2 + hsh2(cand + 2.9) * 3.4;
      iq.setFromAxisAngle(iup, hsh2(cand + 4.1) * Math.PI * 2);
      im4.compose(new THREE.Vector3(bx, y - sscale * 0.45, bz), iq,
        new THREE.Vector3(sscale, sscale * (0.8 + hsh2(cand + 5.3) * 0.7), sscale * 0.85));
      seaRocks.setMatrixAt(srk, im4);
      srCol.setScalar(0.82 + hsh2(cand + 6.7) * 0.24);
      seaRocks.setColorAt(srk++, im4 && srCol);
      // a shoulder lump beside the big ones
      if (srk < 30 && sscale > 2.4) {
        const la = hsh2(cand + 8.3) * Math.PI * 2;
        im4.compose(new THREE.Vector3(bx + Math.cos(la) * sscale * 1.1, y - sscale * 0.4,
          bz + Math.sin(la) * sscale * 1.1), iq,
          new THREE.Vector3(sscale * 0.55, sscale * 0.4, sscale * 0.5));
        seaRocks.setMatrixAt(srk, im4);
        seaRocks.setColorAt(srk++, srCol);
      }
      if (dn <= 24 && sscale >= 2) {
        this.solids.push({ x: bx, z: bz, r: sscale * 0.85, y, mat: 'stone' });
      }
    }
    seaRocks.count = srk;
    seaRocks.castShadow = true;
    if (seaRocks.instanceColor) seaRocks.instanceColor.needsUpdate = true;
    this.group.add(seaRocks);
    // spare capacity for the lighthouse promontory (built after the sea)
    this._seaRocks = { mesh: seaRocks, next: srk, wetRock, wetMat, im4, iq, iup };

    // FOAM, ONE MESH, FOUR JOBS. The 90 open-bay dashes stay; the same
    // InstancedMesh now also carries the broken waterline band the reference
    // shows, a dimmer outer break line, and a surf ring around every isle and
    // sea rock - about 480 instances, one draw call. Alpha variety comes from
    // instanceColor (MeshBasicMaterial honours it): a dash tinted toward the
    // theme's own sea colour reads as faded foam over that exact water.
    const CRESTS = 500;
    const crest = new THREE.InstancedMesh(
      new THREE.BoxGeometry(3.4, 0.05, 0.32),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4,
        depthWrite: false }),
      CRESTS);
    const seaTint = new THREE.Color(this.T.seaColor ?? 0x3d7f9e);
    const foamCol = new THREE.Color();
    const cyaw = Math.atan2(ux, uz);
    let ck2 = 0;
    const dash = (du, dn2, yawJ, sx, sz, fade) => {
      if (ck2 >= CRESTS) return;
      const wx = mx + ux * du + nx * dn2, wz = mz + uz * du + nz * dn2;
      iq.setFromAxisAngle(iup, cyaw + yawJ);
      im4.compose(new THREE.Vector3(wx, y + 0.05, wz), iq, new THREE.Vector3(sx, 1, sz));
      crest.setMatrixAt(ck2, im4);
      foamCol.setRGB(1, 1, 1).lerp(seaTint, fade);
      crest.setColorAt(ck2++, foamCol);
    };
    // (a) open-bay drift dashes - as before
    for (let k = 0; k < 90; k++) {
      dash((Math.sin(k * 12.9898) * 0.5 + 0.5) * 1400 - 700,
        14 + (Math.sin(k * 78.233) * 0.5 + 0.5) * 300,
        Math.sin(k * 3.7) * 0.3, 1, 1, 0.25);
    }
    // (b) the waterline band: broken foam patches at the drawn shore
    for (let k = 0; k < 170; k++) {
      const du = -700 + k * (1400 / 170) + Math.sin(k * 7.31) * 3;
      dash(du, 1.5 + (Math.sin(k * 12.9898) * 0.5 + 0.5) * 3.5,
        Math.sin(k * 5.1) * 0.25,
        0.5 + (Math.sin(k * 3.3) * 0.5 + 0.5) * 1.1,
        1.2 + (Math.sin(k * 9.7) * 0.5 + 0.5) * 2.0,
        0.10 + (Math.sin(k * 2.2) * 0.5 + 0.5) * 0.2);
    }
    // (c) the outer break line, dimmer
    for (let k = 0; k < 110; k++) {
      const du = -700 + k * (1400 / 110) + Math.sin(k * 4.7) * 5;
      dash(du, 7 + (Math.sin(k * 6.9) * 0.5 + 0.5) * 7,
        Math.sin(k * 8.3) * 0.3, 0.8, 1.4, 0.35 + (Math.sin(k * 3.1) * 0.5 + 0.5) * 0.15);
    }
    // (d) surf rings around every isle and sea rock
    const ring = (cdu, cdn, rr) => {
      for (let k = 0; k < 8; k++) {
        const an = (k / 8) * Math.PI * 2;
        dash(cdu + Math.cos(an) * rr, cdn + Math.sin(an) * rr,
          an + Math.PI / 2 - cyaw, 0.7, 1.1, 0.2);
      }
    };
    for (const [idu, idn, iw] of ISLES) ring(idu, idn, iw * 0.75);
    for (const t2 of srTaken) ring(t2[0], t2[1], 4.5);
    crest.count = ck2;
    if (crest.instanceColor) crest.instanceColor.needsUpdate = true;
    this.group.add(crest);

    // harbour buoys
    const buoy = new THREE.InstancedMesh(
      new THREE.SphereGeometry(0.6, 6, 5),
      new THREE.MeshStandardMaterial({ color: 0xd23c28, roughness: 0.6 }), 4);
    for (let k = 0; k < 4; k++) {
      const du = -260 + k * 160, dn2 = 26 + (k % 2) * 18;
      im4.compose(new THREE.Vector3(mx + ux * du + nx * dn2, y + 0.3, mz + uz * du + nz * dn2),
        iq, new THREE.Vector3(1, 1, 1));
      buoy.setMatrixAt(k, im4);
    }
    this.group.add(buoy);
  }

  /** Old snow lying in the hollows above `minY`: flat white decals conformed
   *  to the ground, one instanced draw call. Pure decoration. */
  _buildSnowPatches(m4) {
    const S = this.T.snowPatches;
    const geo = new THREE.CircleGeometry(1, 9);
    geo.rotateX(-Math.PI / 2);
    const mesh = new THREE.InstancedMesh(
      geo,
      new THREE.MeshStandardMaterial({
        color: 0xd8e2ea, roughness: 1, polygonOffset: true,
        polygonOffsetFactor: -1, polygonOffsetUnits: -1,
      }),
      S.count
    );
    const q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
    const nrm = new THREE.Vector3();
    let k = 0;
    this._scatter(S.count, () => {
      const p = Math.random() < 0.5
        ? this._trackSidePos(20, 70)
        : (() => {
            const a = Math.random() * Math.PI * 2, r = 70 + Math.random() * 420;
            const x = Math.cos(a) * r, z = Math.sin(a) * r;
            return this._distToTrack(x, z) < 20 ? null : { x, z };
          })();
      if (!p) return null;
      return this.terrainHeight(p.x, p.z) >= S.minY ? p : null;
    }, (p) => {
      const r = 2.2 + Math.random() * 5.5;
      const y = this.terrainHeight(p.x, p.z);
      const e = r * 0.7;
      const hx = this.terrainHeight(p.x + e, p.z) - this.terrainHeight(p.x - e, p.z);
      const hz = this.terrainHeight(p.x, p.z + e) - this.terrainHeight(p.x, p.z - e);
      nrm.set(-hx / (2 * e), 1, -hz / (2 * e)).normalize();
      q.setFromUnitVectors(up, nrm);
      m4.compose(new THREE.Vector3(p.x, y + 0.09, p.z), q,
        new THREE.Vector3(r, 1, r * (0.6 + Math.random() * 0.7)));
      mesh.setMatrixAt(k++, m4);
    });
    mesh.count = k;
    mesh.name = 'snow-patches';
    if (k) this.group.add(mesh);
  }

  /** A near massif: the mountain the pass actually climbs into. A fan of big
   *  rock peaks standing a few hundred units beyond the summit, so from the
   *  valley the road visibly disappears into a wall of mountain instead of a
   *  flat green horizon. SOLID (free roamers can reach them). */
  /** Rock tone for a NEAR mountain, dark enough to read as rock on any theme.
   *
   *  peakColor is the tone for peaks on the HORIZON, where distance washes
   *  colour out; used close up it renders as a pale slab. Mixing toward
   *  hillColor fixed the limestone themes but not the snow ones, where both
   *  are near-white - on FURKA the massif still owned 79 % of the near-white
   *  pixels in the worst frame. So the mix is followed by a hard lightness
   *  CEILING: whatever the theme's palette, a mountain a few hundred units
   *  away comes out as rock you can see the shape of. */
  _massifRock() {
    const c = new THREE.Color(this.T.peakColor)
      .lerp(new THREE.Color(this.T.hillColor ?? 0x6b6a58), 0.62);
    const hsl = { h: 0, s: 0, l: 0 };
    c.getHSL(hsl);
    c.setHSL(hsl.h, Math.max(hsl.s, 0.12), Math.min(hsl.l, 0.42));
    return c.getHex();
  }

  /** THE CRAG GEOMETRY: a mountain, not a traffic cone.
   *
   *  The massif was ConeGeometry(1, 1, 6) - six sides, ONE height segment -
   *  so up close each mountain was six enormous flat quads, and the player's
   *  screenshot of PINE VALLEY is two of them filling the sky as blank grey
   *  walls. Ten sides and five height rings now, every shared vertex displaced
   *  radially by a position-keyed hash (position-keyed so the side wall and
   *  the base cap move together and nothing cracks), which breaks the
   *  silhouette into crags. ~110 faces, built once, instanced per peak.
   *
   *  And COLOUR, baked per face: the foot blends into the theme's own hill
   *  tone so the range grows out of the land instead of being parked on it;
   *  the body carries alternating strata bands warmed and cooled off the base
   *  rock; the crest lightens, or turns to snow on worlds that cap their
   *  boulders; and every facet gets its own tone wobble so the faces read as
   *  rock instead of upholstery.
   */
  _cragGeo() {
    const geo = new THREE.ConeGeometry(1, 1, 10, 5);
    const p0 = geo.attributes.position;
    const hsh = (a, b, c) => {
      const v = Math.sin(a * 12.9898 + b * 78.233 + c * 37.719) * 43758.5453;
      return v - Math.floor(v);
    };
    for (let i = 0; i < p0.count; i++) {
      const x = p0.getX(i), y = p0.getY(i), z = p0.getZ(i);
      const r = Math.hypot(x, z);
      if (r < 1e-3) continue;                        // apex + cap centre stay
      const hf = y + 0.5;                            // 0 at foot, 1 at crest
      const j = 1 + (hsh(x, y, z) - 0.5) * (0.36 - 0.22 * hf);
      p0.setX(i, x * j); p0.setZ(i, z * j);
      if (hf > 0.05 && hf < 0.95) p0.setY(i, y + (hsh(z, x, y) - 0.5) * 0.05);
    }
    return geo.toNonIndexed();
  }

  _buildMassif(m4) {
    const M = this.T.massif;
    const geo = this._cragGeo();
    const pos = geo.attributes.position;
    const cols = new Float32Array(pos.count * 3);
    const rockA = new THREE.Color(M.color ?? this._massifRock());
    const rockB = rockA.clone().offsetHSL(0.015, 0.05, -0.045);   // warm stratum
    const foot = new THREE.Color(this.T.hillColor ?? 0x6e8a5c);
    const snow = !!(this.T.rockSnowCap || this.T.treeSnowCap);
    const crest = snow ? new THREE.Color(0xf2f6fa)
      : rockA.clone().offsetHSL(0, -0.04, 0.10);
    const tmp = new THREE.Color();
    const fh = (a, b) => {
      const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
      return v - Math.floor(v);
    };
    for (let f = 0; f < pos.count; f += 3) {
      const hf = THREE.MathUtils.clamp(
        (pos.getY(f) + pos.getY(f + 1) + pos.getY(f + 2)) / 3 + 0.5, 0, 1);
      // strata bands off the base rock, alternating by height
      tmp.copy((Math.floor(hf * 7) % 2) ? rockB : rockA);
      // the foot grows out of the land
      if (hf < 0.34) tmp.lerp(foot, (1 - hf / 0.34) * 0.7);
      // the crest lightens - or snows
      if (hf > 0.72) tmp.lerp(crest, ((hf - 0.72) / 0.28) * (snow ? 0.95 : 0.6));
      // per-facet tone, so faces read as rock instead of upholstery
      tmp.multiplyScalar(0.90 + fh(pos.getX(f), pos.getZ(f)) * 0.18);
      for (let k = 0; k < 3; k++) {
        cols[(f + k) * 3] = tmp.r; cols[(f + k) * 3 + 1] = tmp.g; cols[(f + k) * 3 + 2] = tmp.b;
      }
    }
    geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    geo.computeVertexNormals();
    const rock = new THREE.InstancedMesh(
      geo,
      new THREE.MeshStandardMaterial({
        color: 0xffffff, vertexColors: true, flatShading: true, roughness: 1,
      }),
      M.count
    );
    const q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
    const shade = new THREE.Color();
    for (let k = 0; k < M.count; k++) {
      const t = M.count > 1 ? k / (M.count - 1) : 0.5;
      const a = M.az + (t - 0.5) * M.spread + (Math.random() - 0.5) * 0.1;
      const r = M.r0 + Math.random() * (M.r1 - M.r0);
      const h = M.h0 + Math.random() * (M.h1 - M.h0);
      const w = M.w0 + Math.random() * (M.w1 - M.w0);
      let x = Math.cos(a) * r, z = Math.sin(a) * r;
      // "the dry inland range standing behind the terraces" — INLAND. On a
      // coast world the azimuth ring can land a peak in the bay, a cream
      // mountain rising out of open water. Reflect it across the coastline
      // to the land side, footprint clear of the beach.
      if (this.T.coast) {
        const sd = this._coastSide(x, z);
        const margin = (this.T.coast.beach ?? 60) + w * 0.6;
        if (sd > -margin) {
          const C = this.T.coast;
          const abx = C.b[0] - C.a[0], abz = C.b[1] - C.a[1];
          const L = Math.hypot(abx, abz);
          const nx = abz / L, nz = -abx / L;       // seaward normal
          const back = sd + margin;
          x -= nx * back; z -= nz * back;
        }
      }
      q.setFromAxisAngle(up, Math.random() * Math.PI);
      const y = -12 - (this.T.hillDrop || 0) + this._highland(x, z);
      m4.compose(new THREE.Vector3(x, y + h / 2, z), q, new THREE.Vector3(w, h, w * 0.85));
      rock.setMatrixAt(k, m4);
      // per-cone shade: eight identical tones stack into one flat wall, and a
      // flat wall is what read as a void
      shade.setScalar(0.78 + Math.random() * 0.3);
      rock.setColorAt(k, shade);
      this.solids.push({ x, z, r: w * 0.3, y: y + 4, mat: 'stone' });
    }
    rock.name = 'massif';
    if (rock.instanceColor) rock.instanceColor.needsUpdate = true;
    this.group.add(rock);
  }

  /** FURKA RIDGE: the Rhône glacier tongue spilling off the skyline — a
   *  stepped ice field of big pale slabs, well outside the drivable world. */
  _buildGlacier(m4) {
    // GLACIER ICE, NOT PAPER. At 0xdff0fb under an alpine sun these slabs were
    // the white wedge that kept filling the frame on FURKA: with the massif
    // fixed, hiding the glacier still dropped the near-white share of the worst
    // frame from 4.9 % to 0.55 %, so it owned nearly all of what was left.
    // Real ice is a blue-grey that darkens fast out of the light - the tone
    // comes down, the blue comes up, and the faces get enough spread to show
    // the stepped tongue instead of one flat sheet.
    const ice = new THREE.MeshStandardMaterial({
      color: 0x9fc4dc, roughness: 0.62, flatShading: true, envMapIntensity: 0.5,
    });
    const geo = new THREE.BoxGeometry(1, 1, 1);
    geo.translate(0, 0.5, 0);
    const slabs = new THREE.InstancedMesh(geo, ice, 14);
    const q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
    const col = new THREE.Color();
    // the tongue pours down a north-west flank towards the road
    const a0 = -2.25;
    for (let k = 0; k < 14; k++) {
      const t = k / 13;
      const r = 560 + t * 320;
      const a = a0 + (t - 0.5) * 0.34 + (k % 2 ? 0.05 : -0.05);
      const w = 210 - t * 90, d = 130 - t * 40, h = 26 + t * 96;
      q.setFromAxisAngle(up, a + 1.2);
      const gx = Math.cos(a) * r, gz = Math.sin(a) * r;
      m4.compose(
        new THREE.Vector3(gx, -18 - (this.T.hillDrop || 0) + t * 4 + this._highland(gx, gz), gz),
        q, new THREE.Vector3(w, h, d)
      );
      slabs.setMatrixAt(k, m4);
      col.setRGB(0.78 + t * 0.14, 0.88 + t * 0.1, 1.0).multiplyScalar(0.7 + Math.random() * 0.3);
      slabs.setColorAt(k, col);
    }
    slabs.name = 'glacier';
    this.group.add(slabs);
  }

  /** THE PASS HOTEL — the Belvédère moment from the player's photo: a tall
   *  gabled hotel standing alone on the outside of a mid-climb hairpin, the
   *  serpentine wrapping around it. Placed at the tightest corner in the
   *  middle third of the lap (that is the switchback stack), on the outside
   *  of the bend, seated on the real terrain. */
  _buildPassHotel(m4) {
    // sharpest corner that is genuinely UP THE CLIMB: restrict to samples in
    // the upper half of the lap's elevation range, else the valley bend at
    // the foot of the pass wins on curvature and the hotel ends up flat
    let maxY = -1e9, minY = 1e9;
    for (let i = 0; i < this.N; i++) {
      maxY = Math.max(maxY, this.center[i].y);
      minY = Math.min(minY, this.center[i].y);
    }
    const yGate = minY + (maxY - minY) * 0.45;
    let best = -1, bestC = 0;
    for (let i = Math.floor(this.N * 0.15); i < Math.floor(this.N * 0.7); i++) {
      if (this.center[i].y < yGate) continue;
      if (this.curvature[i] > bestC) { bestC = this.curvature[i]; best = i; }
    }
    if (best < 0) return;
    // outside of the bend: the normal points left of travel; curvature sign
    // is unsigned, so probe both sides and take the one that DROPS (the
    // outside of a climbing hairpin hangs over the lower leg)
    const lat = 21;
    const pL = this.pointAt(best, lat), pR = this.pointAt(best, -lat);
    const hL = this.terrainHeight(pL.x, pL.z), hR = this.terrainHeight(pR.x, pR.z);
    const p = hL < hR ? pL : pR;
    const gy = Math.max(hL < hR ? hL : hR, this.groundHeightAt(best, 0) - 2.5);
    const W = 17, D = 9.5, H = 11;                      // three storeys + attic
    const yaw = Math.atan2(this.tan[best].x, this.tan[best].z) + Math.PI / 2;
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(W, H, D),
      new THREE.MeshStandardMaterial({
        map: townhouseTexture(), color: 0xe8e0d0, roughness: 0.8,
        emissive: 0xffffff, emissiveMap: townhouseGlowTexture(),
        emissiveIntensity: this.T.hutGlow ?? 0.4,
      })
    );
    body.name = 'pass-hotel';
    body.position.set(p.x, gy + H / 2, p.z);
    body.rotation.y = yaw;
    body.castShadow = body.receiveShadow = true;
    const roof = new THREE.Mesh(gablePrismGeo(), new THREE.MeshStandardMaterial({
      color: 0x9aa2a8, flatShading: true, roughness: 0.6,   // silvered mansard
    }));
    roof.scale.set(W + 1.6, 5.2, D + 1.6);
    roof.position.set(p.x, gy + H, p.z);
    roof.rotation.y = yaw;
    roof.castShadow = true;
    this.group.add(body, roof);
    this._addShadow(p.x, p.z, Math.max(W, D) * 0.8);
    // THE PLINTH. `gy` is clamped to within 2.5 u of the ROAD, so on a steep
    // hillside the hotel's floor stands well above the raw ground - measured
    // 3.8 u on FURKA, which is a building with daylight under it. A real
    // Belvedere sits on masonry, so build the masonry: a retaining base from
    // the ground up to the floor, sized just inside the footprint.
    const terr = this.terrainHeight(p.x, p.z);
    const stand = gy - terr;
    if (stand > 0.3) {
      const plinth = new THREE.Mesh(new THREE.BoxGeometry(W * 2 - 0.6, stand + 0.6, D * 2 - 0.6),
        new THREE.MeshStandardMaterial({ color: 0x6f6a60, roughness: 1, flatShading: true }));
      plinth.position.set(p.x, terr + (stand + 0.6) / 2 - 0.3, p.z);
      plinth.rotation.y = yaw;
      plinth.castShadow = plinth.receiveShadow = true;
      this.group.add(plinth);
    }
    // ...and the record is planted where the structure MEETS THE GROUND, which
    // is the plinth's foot, not the floor above it.
    this.solids.push({ x: p.x, z: p.z, r: Math.max(W, D) * 0.62, y: terr, mat: 'stone' });
  }

  /** THE LIGHTHOUSE - the harbour reference's headland sentinel: banded
   *  white tower, red lantern room, standing where land meets the water. */
  _buildLighthouse() {
    const C = this.T.coast;
    if (!C) return;
    const abx = C.b[0] - C.a[0], abz = C.b[1] - C.a[1];
    const L = Math.hypot(abx, abz);
    const ux = abx / L, uz = abz / L;
    const nx = abz / L, nz = -abx / L;
    let spot = null;
    // ON A QUAY WORLD THE LIGHT STANDS ON A MOLE — a stone breakwater running
    // out from the harbour mouth, lighthouse on the tip, exactly where the
    // player's harbour reference puts it and guaranteed VISIBLE from the quay
    // (the old landward-headland search kept finding spots behind the town,
    // or none at all, and the "lighthouse world" shipped without one in view).
    if (this.T.quay) {
      const lvl = C.level ?? -2;
      const du = L * 0.95;
      const bx = C.a[0] + ux * du, bz = C.a[1] + uz * du;   // waterline anchor
      if (this._distToTrackCoarse(bx, bz) > 24) {
        const stone = new THREE.MeshStandardMaterial({
          color: 0x9a9282, flatShading: true, roughness: 1,
        });
        const mole = new THREE.Group();
        // the pier: a long low block from the beach out into the bay, plus a
        // slightly wider cap slab so it reads as dressed stone from the quay
        // the mole shortens: the last stretch is ROCK now (below), so the
        // dressed stone hands over to a natural promontory under the tower
        const runL = 26, runW = 6.5, top = lvl + 1.25;
        const mcx = bx + nx * (runL / 2 - 6), mcz = bz + nz * (runL / 2 - 6);
        const pier = new THREE.Mesh(new THREE.BoxGeometry(runW, 5.2, runL), stone);
        pier.position.set(mcx, top - 2.6, mcz);
        pier.rotation.y = Math.atan2(nx, nz);
        const slab = new THREE.Mesh(new THREE.BoxGeometry(runW + 1.1, 0.5, runL + 0.8), stone);
        slab.position.set(mcx, top + 0.05, mcz);
        slab.rotation.y = pier.rotation.y;
        pier.castShadow = slab.castShadow = true;
        pier.receiveShadow = slab.receiveShadow = true;
        mole.add(pier, slab);
        this.group.add(mole);
        spot = { x: bx + nx * (runL + 4), z: bz + nz * (runL + 4), y: top + 0.9, rocky: true };
      }
    }
    // THE LIGHT STANDS ON ROCK. The reference puts the tower on a rocky
    // promontory with skerries off the point, not on a paved slab - so the
    // spot gets a pile of wet-band sea rocks poured under and around it,
    // written into the sea's spare instanced slots (the sea builds first).
    if (spot && this._seaRocks) {
      const SR = this._seaRocks;
      const put = (px, pz, sx, sy, sz, seed) => {
        if (SR.next >= SR.mesh.instanceMatrix.count) return;
        SR.iq.setFromAxisAngle(SR.iup, seed * 2.39996);
        SR.im4.compose(new THREE.Vector3(px, (C.level ?? -2) - sy * 0.35, pz),
          SR.iq, new THREE.Vector3(sx, sy, sz));
        SR.mesh.setMatrixAt(SR.next, SR.im4);
        SR.mesh.setColorAt(SR.next++, new THREE.Color().setScalar(0.85 + (seed % 1) * 0.2));
      };
      const hsh = (n) => { const v = Math.sin(n * 12.9898) * 43758.5453; return v - Math.floor(v); };
      for (let k = 0; k < 10; k++) {
        const an = hsh(k + 0.3) * Math.PI * 2;
        const rr = 3.5 + hsh(k + 1.7) * 6.5;
        put(spot.x + Math.cos(an) * rr, spot.z + Math.sin(an) * rr,
          2.2 + hsh(k + 2.9) * 3.4, 1.6 + hsh(k + 4.1) * 2.6, 2.0 + hsh(k + 5.3) * 2.8, k);
      }
      // skerries off the point
      put(spot.x + nx * 14, spot.z + nz * 14, 2.6, 1.4, 2.2, 11);
      put(spot.x + nx * 22 + ux * 6, spot.z + nz * 22 + uz * 6, 1.8, 1.0, 1.6, 12);
      SR.mesh.count = SR.next;
      if (SR.mesh.instanceColor) SR.mesh.instanceColor.needsUpdate = true;
    }
    // ...and the keeper lives beside it: one cottage through the shared
    // element batches (realized later in _buildWorldElements - zero draws),
    // on the landward side of the tower where the ground is real.
    if (spot) {
      const kitName = this.T.elements
        || ELEMENT_KIT_BY_THEME[this.level && this.level.theme] || 'farm';
      const K = ELEMENT_KITS[kitName] ?? ELEMENT_KITS.farm;
      const cx2 = spot.x - nx * 9 + ux * 4, cz2 = spot.z - nz * 9 + uz * 4;
      this._element(this._elemB(), 'cottageA', cx2, cz2,
        Math.atan2(nx, nz) + Math.PI, K, 0.85,
        spot.rocky ? spot.y - 0.2 : null);
    }
    if (!spot) {
      for (const du of [L * 0.92, L * 0.06, L * 0.75, L * 0.25]) {
        const x = C.a[0] + ux * du - nx * 8, z = C.a[1] + uz * du - nz * 8;
        const h = this.terrainHeight(x, z);
        if (h > (C.level ?? -2) + 0.8 && this._distToTrackCoarse(x, z) > 22) {
          spot = { x, z, y: h };
          break;
        }
      }
    }
    if (!spot) return;
    // THE COASTAL LIGHTHOUSE TOWER, built the way the reference draws one: a
    // battered stone plinth, a banded tapering tower, a GALLERY on corbels
    // with a railing you can count the stanchions on, a glazed lantern room
    // with astragals, and a domed cap under a finial. The old one was four
    // primitives - a cone on a cylinder - and read as a traffic bollard from
    // the quay. Everything rigid bundles down to five draw calls.
    const g = new THREE.Group();
    const white = new THREE.MeshStandardMaterial({ color: 0xf2efe6, roughness: 0.7,
      flatShading: true });
    const red = new THREE.MeshStandardMaterial({ color: 0xc0392b, roughness: 0.6,
      flatShading: true });
    const stoneL = new THREE.MeshStandardMaterial({ color: 0x8e8778, roughness: 1,
      flatShading: true });
    const ironL = new THREE.MeshStandardMaterial({ color: 0x2b2f34, roughness: 0.45,
      metalness: 0.5, flatShading: true });
    const SEG = 20;
    const BY = spot.y;                                   // base of the tower
    const at2 = (geo, yy) => geo.translate(0, yy, 0);
    // plinth, shaft and the two navigation bands
    const shaft = this._bundle([
      at2(new THREE.CylinderGeometry(3.05, 3.5, 1.1, SEG), 0.55),
      at2(new THREE.CylinderGeometry(2.85, 3.05, 0.35, SEG), 1.28),
      at2(new THREE.CylinderGeometry(1.72, 2.85, 12.2, SEG), 7.55),
    ]);
    const shaftM = new THREE.Mesh(shaft, white);
    shaftM.position.set(spot.x, BY, spot.z);
    const bands = new THREE.Mesh(this._bundle([
      at2(new THREE.CylinderGeometry(2.45, 2.6, 2.0, SEG), 5.1),
      at2(new THREE.CylinderGeometry(1.99, 2.07, 1.7, SEG), 11.3),
    ]), red);
    bands.position.set(spot.x, BY, spot.z);
    // gallery: corbel ring, deck, kick plate, stanchions and two handrails
    const galY = 13.7, galR = 2.45;
    const galParts = [
      at2(new THREE.CylinderGeometry(2.35, 1.7, 0.5, SEG), galY - 0.35),
      at2(new THREE.CylinderGeometry(galR, galR, 0.18, SEG), galY),
    ];
    const railParts = [];
    for (let k = 0; k < 16; k++) {
      const an = (k / 16) * Math.PI * 2;
      const px = Math.sin(an) * (galR - 0.14), pz = Math.cos(an) * (galR - 0.14);
      railParts.push(this._strut([px, galY, pz], [px, galY + 0.95, pz], 0.045, 5));
      const an2 = ((k + 1) / 16) * Math.PI * 2;
      const qx = Math.sin(an2) * (galR - 0.14), qz = Math.cos(an2) * (galR - 0.14);
      for (const hy of [galY + 0.45, galY + 0.95]) {
        railParts.push(this._strut([px, hy, pz], [qx, hy, qz], 0.04, 4));
      }
    }
    const galleryM = new THREE.Mesh(this._bundle(galParts), stoneL);
    galleryM.position.set(spot.x, BY, spot.z);
    const railM = new THREE.Mesh(this._bundle(railParts), ironL);
    railM.position.set(spot.x, BY, spot.z);
    // lantern room: glazing between vertical astragals, capped by a dome
    const lamp = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.55, 2.1, 12),
      new THREE.MeshBasicMaterial({ color: 0xffe9a0 }));
    lamp.position.set(spot.x, BY + galY + 1.25, spot.z);
    const astParts = [];
    for (let k = 0; k < 10; k++) {
      const an = (k / 10) * Math.PI * 2;
      const px = Math.sin(an) * 1.56, pz = Math.cos(an) * 1.56;
      astParts.push(this._strut([px, galY + 0.2, pz], [px, galY + 2.3, pz], 0.06, 5));
    }
    astParts.push(at2(new THREE.CylinderGeometry(1.68, 1.68, 0.2, 12), galY + 2.35));
    astParts.push(at2(new THREE.SphereGeometry(1.62, 14, 7, 0, Math.PI * 2, 0, Math.PI / 2.4),
      galY + 2.4));
    astParts.push(at2(new THREE.SphereGeometry(0.24, 10, 8), galY + 3.62));
    astParts.push(this._strut([0, galY + 3.6, 0], [0, galY + 4.35, 0], 0.05, 5));
    const lantM = new THREE.Mesh(this._bundle(astParts), red);
    lantM.position.set(spot.x, BY, spot.z);
    // a door, so the tower has a scale you can read
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.05, 1.9, 0.3), ironL);
    door.position.set(spot.x, BY + 2.5, spot.z + 2.72);
    shaftM.castShadow = bands.castShadow = galleryM.castShadow = true;
    lantM.castShadow = railM.castShadow = true;
    g.add(shaftM, bands, galleryM, railM, lamp, lantM, door);
    this.group.add(g);
    this._addShadow(spot.x, spot.z, 3.4);
    this.solids.push({ x: spot.x, z: spot.z, r: 2.7, y: spot.y + 2, mat: 'stone' });
  }

  /** QUAYSIDE DRESSING (harbour worlds): the seaward flank of the seafront
   *  road gets the working-harbour kit from the player's reference — a low
   *  quay wall of capstones along the water edge, iron bollards, and
   *  clusters of barrels, crates and coiled rope on the stone. Everything is
   *  COSMETIC and everything stays ≥ 10.8 u off the centreline (drivable
   *  half-width is 9): dressing, never an obstacle. */

  /** STREET LIFE: what makes a street look lived-in rather than built.
   *
   *  The frontage gives a town its walls; the reference gives it a market -
   *  stalls under striped awnings, produce crates stacked at the doors,
   *  barrels against the render, and a fountain where the road opens out. All
   *  of it sits on the PAVEMENT band between the carriageway and the building
   *  line, so it dresses the drive without narrowing it, and all of it is
   *  registered crushable rather than solid: a market you can plough through
   *  is a feature, a market that stops you dead is a wall with fruit on it.
   */
  _buildStreetLife() {
    const F = this.T.frontage || {};
    const SIDES = F.side ? [F.side] : [1, -1];
    const inner = ROAD_HALF + 2.2;                       // clear of the road
    const outer = Math.max(inner + 1.5, (F.lateral ?? 15.5) - 2.4);
    const A = propAssets();
    const awnMat = new THREE.MeshStandardMaterial({
      color: 0xffffff, vertexColors: true, roughness: 0.9, side: THREE.DoubleSide,
    });
    const legMat = new THREE.MeshStandardMaterial({ color: 0x6a4a2c, roughness: 1 });
    const stallGeo = new THREE.BoxGeometry(3.2, 0.9, 1.8);
    const awnGeo = new THREE.BoxGeometry(3.8, 0.18, 2.4);
    const legGeo = new THREE.BoxGeometry(0.16, 2.1, 0.16);
    const STALLS = 26;
    const awns = new THREE.InstancedMesh(awnGeo, awnMat, STALLS);
    const boards = new THREE.InstancedMesh(stallGeo,
      new THREE.MeshStandardMaterial({ color: 0x8a6238, roughness: 1 }), STALLS);
    const legs = new THREE.InstancedMesh(legGeo, legMat, STALLS * 4);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0), col = new THREE.Color();
    const AWNING = ['#c9483a', '#e0e0d8', '#3f6b8a', '#d8a23a', '#4a7a4a'];
    let sk = 0, lk = 0;
    for (let n = 0; n < STALLS * 3 && sk < STALLS; n++) {
      const i = ((Math.random() * N) | 0);
      if (this.curvature[i] > 0.02) continue;            // not on a tight bend
      const side = SIDES[(Math.random() * SIDES.length) | 0];
      const lat = (inner + Math.random() * (outer - inner)) * side;
      const p = this.pointAt(i, lat);
      if (this._inWater(p.x, p.z)) continue;
      if (!this._clearsRoad(p.x, p.z, 2.4, 1.2)) continue;
      const y = this.terrainHeight(p.x, p.z);
      const yaw = this.headingAt(i);
      q.setFromAxisAngle(up, yaw);
      m4.compose(new THREE.Vector3(p.x, y + 0.45, p.z), q, new THREE.Vector3(1, 1, 1));
      boards.setMatrixAt(sk, m4);
      m4.compose(new THREE.Vector3(p.x, y + 2.1, p.z), q, new THREE.Vector3(1, 1, 1));
      awns.setMatrixAt(sk, m4);
      col.set(AWNING[(Math.random() * AWNING.length) | 0]);
      awns.setColorAt(sk, col);
      for (const [ox, oz] of [[-1.7, -1.0], [1.7, -1.0], [-1.7, 1.0], [1.7, 1.0]]) {
        if (lk >= legs.count) break;
        const wx = p.x + Math.cos(yaw) * ox - Math.sin(yaw) * oz;
        const wz = p.z + Math.sin(yaw) * ox + Math.cos(yaw) * oz;
        m4.compose(new THREE.Vector3(wx, y, wz), q, new THREE.Vector3(1, 1, 1));
        legs.setMatrixAt(lk++, m4);
      }
      this._addShadow(p.x, p.z, 2.6, y);
      // produce at the stall: crushable, like every other street prop
      for (let c = 0; c < 2; c++) {
        const type = Math.random() < 0.5 ? 'crate' : 'barrel';
        const { mesh, r } = this._makeProp(type);
        const ox = (Math.random() - 0.5) * 3.4, oz = 1.6 + Math.random() * 0.9;
        const wx = p.x + Math.cos(yaw) * ox - Math.sin(yaw) * oz;
        const wz = p.z + Math.sin(yaw) * ox + Math.cos(yaw) * oz;
        if (!this._clearsRoad(wx, wz, r, 1.0)) continue;
        mesh.position.set(wx, this.terrainHeight(wx, wz), wz);
        mesh.rotation.y = Math.random() * Math.PI * 2;
        this.group.add(mesh);
        this.props.push({ mesh, x: wx, y: mesh.position.y, z: wz, r, type,
          scoreValue: PROP_SCORE[type], pickup: null });
      }
      sk++;
    }
    awns.count = boards.count = sk;
    legs.count = lk;
    awns.name = 'street-awnings';
    if (awns.instanceColor) awns.instanceColor.needsUpdate = true;
    awns.castShadow = boards.castShadow = legs.castShadow = true;
    if (sk) this.group.add(awns, boards, legs);
  }


  /** Three corners of a triangle into a flat position array. */
  _tri(arr, a, b, c) {
    arr.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
  }

  /** A quad as two triangles, wound a->b->c->d. */
  _quad(arr, a, b, c, d) { this._tri(arr, a, b, c); this._tri(arr, a, c, d); }

  /** A flat-shaded BufferGeometry from a raw triangle soup. */
  _geo(arr) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));
    g.computeVertexNormals();
    return g;
  }

  /** WHITE BASE COLOURS, OR THE INSTANCE COLOUR MULTIPLIES BY NOTHING.
   *
   *  `vertexColors: true` compiles USE_COLOR, and USE_COLOR reads a `color`
   *  attribute the geometry may never have had - an unbound attribute is
   *  (0,0,0), so diffuse * vColor * instanceColor comes out BLACK however
   *  bright the instance colour is. Every geometry handed to a per-instance
   *  tinted material goes through here first. */
  _white(geo) {
    const n = geo.attributes.position.count;
    geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3).fill(1), 3));
    return geo;
  }

  /** THE BOAT HULL, lofted through nine stations with a hard chine.
   *
   *  ONE hull for the whole game. There used to be two kinds of boat in a
   *  harbour: the marina's, and a flotilla of BOX HULLS WITH A CONE ON TOP
   *  moored in the same water - those cones are the toy boats dotted across
   *  every harbour screenshot. A hull is not a box, so it is built once, here,
   *  and everything that floats uses it.
   *
   *  Five stations and a plain V gave a boat-shaped wedge; the reference is a
   *  proper hull, so the loft runs nine stations and carries a CHINE - the
   *  crease between topside and bottom that catches the light down the whole
   *  length, and is most of what tells the eye this is a hull rather than a
   *  shape. ~70 triangles, instanced across every boat in the world.
   *
   *  Per station: z aft->forward, deck half-beam, chine half-beam, chine
   *  height, keel depth, sheer height. Deck datum is y = 1.0.
   */
  _boatHull() {
    if (this._boatGeo) return this._boatGeo;
    const STA = [
      [-4.30, 1.28, 1.18, -0.30, -1.00, 1.00],   // transom
      [-3.40, 1.42, 1.30, -0.36, -1.14, 0.97],
      [-2.00, 1.53, 1.40, -0.42, -1.26, 0.95],
      [-0.60, 1.55, 1.42, -0.44, -1.28, 0.97],
      [0.80, 1.50, 1.35, -0.42, -1.24, 1.01],
      [2.00, 1.32, 1.15, -0.36, -1.10, 1.10],
      [3.10, 1.02, 0.85, -0.28, -0.86, 1.24],
      [4.00, 0.62, 0.48, -0.18, -0.52, 1.42],
      [4.70, 0.10, 0.08, -0.05, -0.12, 1.62],    // stem, sheer up to the bow
    ];
    const hv = [], dv = [], bv = [];
    for (let i = 0; i < STA.length - 1; i++) {
      const S = STA[i], T = STA[i + 1];
      for (const sg of [1, -1]) {
        const D0 = [sg * S[1], S[5], S[0]], D1 = [sg * T[1], T[5], T[0]];
        const C0 = [sg * S[2], S[3], S[0]], C1 = [sg * T[2], T[3], T[0]];
        const K0 = [0, S[4], S[0]], K1 = [0, T[4], T[0]];
        this._quad(hv, D0, D1, C1, C0);            // topside
        this._quad(hv, C0, C1, K1, K0);            // bottom
        // the rubbing band: a dark strake right on the sheer line
        const b0 = [sg * (S[1] + 0.04), S[5] - 0.16, S[0]];
        const b1 = [sg * (T[1] + 0.04), T[5] - 0.16, T[0]];
        this._quad(bv, D0, D1, b1, b0);
      }
      const e0 = S[1] * 0.90, e1 = T[1] * 0.90, h0 = S[5] + 0.02, h1 = T[5] + 0.02;
      this._quad(dv, [-e0, h0, S[0]], [e0, h0, S[0]], [e1, h1, T[0]], [-e1, h1, T[0]]);
    }
    const S = STA[0];
    this._quad(hv, [-S[1], S[5], S[0]], [S[1], S[5], S[0]], [S[2], S[3], S[0]],
      [-S[2], S[3], S[0]]);
    this._tri(hv, [-S[2], S[3], S[0]], [S[2], S[3], S[0]], [0, S[4], S[0]]);
    this._boatGeo = {
      hull: this._white(this._geo(hv)), deck: this._geo(dv), band: this._geo(bv),
    };
    return this._boatGeo;
  }

  /** A STRUT BETWEEN TWO POINTS - a cylinder posed from its real endpoints.
   *  Standing rigging, railings and gantry legs all run somewhere specific,
   *  so they are built from where they start and stop rather than posed by
   *  hand with an Euler, which is the trap that has cost this file three
   *  separate bugs. */
  _strut(a, b, r, seg) {
    const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2];
    const len = Math.hypot(dx, dy, dz);
    const geo = new THREE.CylinderGeometry(r, r, len, seg ?? 5);
    geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0), new THREE.Vector3(dx / len, dy / len, dz / len)));
    geo.translate((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
    return geo;
  }

  /** MANY SMALL FIXED PARTS, ONE DRAW CALL. Detail is spokes, rings, glazing
   *  bars and stanchions - dozens of little meshes, each of which would
   *  otherwise be its own draw. Anything rigidly fixed relative to its parent
   *  is concatenated into a single geometry here instead. */
  _bundle(geos) {
    const parts = geos.map((gm) => (gm.index ? gm.toNonIndexed() : gm));
    let n = 0;
    for (const gm of parts) n += gm.attributes.position.array.length;
    const pos = new Float32Array(n);
    let o = 0;
    for (const gm of parts) {
      pos.set(gm.attributes.position.array, o);
      o += gm.attributes.position.array.length;
    }
    const out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    out.computeVertexNormals();
    return out;
  }

  /** A SAIL IS NOT FLAT. Lofted from the luff toward the clew with a belly
   *  that dies at head, tack and clew - a handful of triangles, and it stops
   *  the canvas reading as a paper cut-out. */
  _sailGeo(A, B, C, belly) {
    const mix = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t,
      p[2] + (q[2] - p[2]) * t];
    const v = [], ROWS = 4;
    for (let r = 0; r < ROWS; r++) {
      const t0 = r / ROWS, t1 = (r + 1) / ROWS;
      const l0 = mix(A, B, t0), l1 = mix(A, B, t1);
      const f = (t) => Math.sin(Math.PI * t) * belly;
      const o0 = mix(l0, C, 0.5), o1 = mix(l1, C, 0.5);
      o0[0] += f(t0); o1[0] += f(t1);
      this._tri(v, l0, l1, o1); this._tri(v, l0, o1, o0);
      this._tri(v, o0, o1, C);
    }
    return this._geo(v);
  }

  /** THE MARINA: a pontoon reached from the shore, boats with real hulls.
   *
   *  Two things were wrong with the first cut, and both are visible from the
   *  seafront. The pontoon floated 26 u out in open water with nothing joining
   *  it to the land - a jetty you cannot walk on to. And the boats were a box
   *  hull with a lid: a rectangle is not a hull, so from the shore they read as
   *  black rafts rather than boats.
   *
   *  So the shoreline is MEASURED (walk seaward until the ground drops under
   *  the sea) and everything is laid out from it: a gangway off the quay lip,
   *  the pontoon a dozen metres out, fingers projecting seaward from it, and a
   *  boat in each slip with its bow to open water. The hull is lofted through
   *  five stations - flat transom, full midships, fine bow with a rising sheer
   *  - which is what makes the shape read as a boat at any distance.
   *
   *  Every part type is ONE InstancedMesh across the whole marina, so the eight
   *  boats and their rigs cost eight draw calls between them.
   */
  _buildMarina() {
    const C = this.T.coast;
    if (!C) return;
    const abx = C.b[0] - C.a[0], abz = C.b[1] - C.a[1];
    const L = Math.hypot(abx, abz);
    const ux = abx / L, uz = abz / L;                 // along the shore
    const nx = abz / L, nz = -abx / L;                // seaward
    const mx = (C.a[0] + C.b[0]) / 2, mz = (C.a[1] + C.b[1]) / 2;
    const y = C.level ?? -2;
    const P = (du, dn) => [mx + ux * du + nx * dn, mz + uz * du + nz * dn];
    const at = (du, dn) => { const p = P(du, dn); return new THREE.Vector3(p[0], y, p[1]); };
    // yaw maps local +Z ALONG the shore and +X seaward (the headingAt
    // convention); +PI/2 turns that so local +Z points out to sea, which is
    // where a moored bow looks. Built the other way round the pontoon marched
    // out to sea and the fingers lay along it - measured, twice.
    const yaw = Math.atan2(ux, uz);
    const g = new THREE.Group();
    const timber = new THREE.MeshStandardMaterial({ color: 0x8a6a44, roughness: 1, flatShading: true });
    const pile = new THREE.MeshStandardMaterial({ color: 0x5f4a30, roughness: 1 });

    // WHERE IS THE WATER? Never assume - the beach band, the sea level and the
    // road shoulder all move per world, and a pontoon laid out from a guessed
    // shoreline either sits on the sand or floats offshore. Walk out until the
    // ground goes under.
    // WHERE THE WATER STARTS IS NOT WHERE THE GROUND GOES UNDER IT.
    //
    // The obvious test - walk seaward until terrainHeight drops below sea
    // level - put the waterline about 7 u out, and every bollard laid off that
    // stood ankle-deep in the bay. The sea MESH is what the player sees, and
    // `_buildSea` lays its rows from dn = 0 outward: the drawn waterline is
    // the coastline itself, whatever the heightfield does either side of it.
    // So the quay dressing is placed at negative dn and the moorings at
    // positive, and nothing has to guess.
    const PON = 15;                                 // pontoon, well afloat

    // a flat quad between four points, used for the ramps that have to meet
    // ground at one end and water at the other - explicit corners instead of a
    // pitch Euler, because the Euler order trap has cost this file three bugs
    const quad = (a, b, c, d, mat) => {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute([
        a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2],
        a[0], a[1], a[2], c[0], c[1], c[2], d[0], d[1], d[2],
      ], 3));
      geo.computeVertexNormals();
      const m = new THREE.Mesh(geo, mat);
      m.receiveShadow = true;
      return m;
    };

    // --- the pontoon, its piles and the gangway off the shore ---------------
    //
    // ONE BOAT PER SLIP. The first layout moored TWO boats nose-to-tail in
    // each slip, at dn 20.1 and 26.4 - and a boat is 9.4 u long, so they
    // overlapped by three metres and drove through each other. A marina moors
    // one boat between each pair of fingers, all bows out, all at the same
    // distance off; that is both what a marina looks like and what makes the
    // spacing checkable, because every boat shares a heading and the whole
    // fleet can be tested as axis-aligned boxes in the (along, out) frame.
    // THIRTY BOATS IN ONE STRAIGHT LINE IS A FENCE, NOT A HARBOUR.
    //
    // Measured on the shipped build: the fleet ran du -120.8 to +120.8 - 241
    // metres of unbroken boats - every hull at the same distance offshore and
    // every scale between 0.90 and 1.12. From the seafront that is a picket of
    // identical white sails marching to the horizon.
    //
    // The r119 check that passed on this layout tested that no two boats
    // OVERLAP. They did not overlap. A non-overlap test says nothing about
    // whether thirty identical objects in a row look like a place.
    //
    // Three basins, at different distances off with open water between them.
    const SLIPS = 30;
    const FLEN = 14;
    const PITCH = 8.6;
    const BASINS = [
      { du: -96, n: 11, dn: PON + 5 },
      { du: 6, n: 10, dn: PON - 3 },
      { du: 102, n: 9, dn: PON + 9 },
    ];
    const SPAN = 250;                                // still used by the quay dressing
    const FINGERS = SLIPS + BASINS.length;
    for (const B of BASINS) {
      const bw = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.42, PITCH * B.n + 4), timber);
      const wp = at(B.du, B.dn);
      bw.position.set(wp.x, y + 0.5, wp.z);
      bw.rotation.y = yaw;
      bw.castShadow = true;
      g.add(bw);
    }
    // the gangway: quay lip down to the pontoon deck
    {
      const gy = this.terrainHeight(...P(6, -3)) + 0.35;
      const a = P(6 - 1.7, -3), b = P(6 + 1.7, -3);
      const c = P(6 + 1.7, PON - 2.1), d = P(6 - 1.7, PON - 2.1);
      g.add(quad([a[0], gy, a[1]], [b[0], gy, b[1]],
        [c[0], y + 0.78, c[1]], [d[0], y + 0.78, d[1]], timber));
    }
    // THIRTY-ONE FINGERS AND NINETY-THREE PILES IS NOT NINETY-THREE DRAW
    // CALLS. Both are one instanced mesh; the old loop added a Mesh per part,
    // which was survivable at five fingers and is not at thirty-one.
    const fingers = new THREE.InstancedMesh(new THREE.BoxGeometry(FLEN, 0.5, 2.2),
      timber, FINGERS);
    const posts = new THREE.InstancedMesh(
      new THREE.CylinderGeometry(0.22, 0.26, 3.4, 6), pile, FINGERS * 3);
    const fm = new THREE.Matrix4(), fq = new THREE.Quaternion();
    const fup = new THREE.Vector3(0, 1, 0), fone = new THREE.Vector3(1, 1, 1);
    fq.setFromAxisAngle(fup, yaw);
    const fingerAt = [];
    let fpk = 0, fgi = 0;
    for (const B of BASINS) {
      for (let f = 0; f <= B.n; f++) {
        const du = B.du - (PITCH * B.n) / 2 + PITCH * f;
        const p = at(du, B.dn + FLEN / 2);
        fm.compose(new THREE.Vector3(p.x, y + 0.48, p.z), fq, fone);
        fingers.setMatrixAt(fgi++, fm);
        if (f < B.n) fingerAt.push({ du: du + PITCH / 2, dn: B.dn });
        for (let k = 0; k < 3; k++) {
          const pp = at(du, B.dn + 2 + k * (FLEN / 2.6));
          fm.compose(new THREE.Vector3(pp.x, y - 0.9, pp.z), fq, fone);
          posts.setMatrixAt(fpk++, fm);
        }
      }
    }
    fingers.count = fgi;
    posts.count = fpk;
    fingers.castShadow = true;
    g.add(fingers, posts);

    const HB = this._boatHull();
    const hullG = HB.hull, deckG = HB.deck, bandG = HB.band;
    const tri = (arr, a, b, c) => {
      arr.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
    };
    const buf = (arr) => this._geo(arr);
    const white = (geo) => this._white(geo);

    // --- spars, rigging and deck gear ---------------------------------------
    const strut = (a, b, r, seg) => this._strut(a, b, r, seg);
    const bundle = (geos) => this._bundle(geos);

    const DECK = 1.0;                                  // deck datum, boat local
    const cabG = white(new THREE.BoxGeometry(1, 1, 1).toNonIndexed());
    const mastG = new THREE.CylinderGeometry(0.09, 0.14, 9.4, 12);
    const boomG = new THREE.CylinderGeometry(0.08, 0.09, 4.6, 10);
    boomG.rotateX(Math.PI / 2);
    const fendG = new THREE.TorusGeometry(0.26, 0.09, 6, 10);   // fist-sized: 120 tris, not 224
    fendG.rotateY(Math.PI / 2);
    const portG = new THREE.CylinderGeometry(0.15, 0.15, 0.1, 10);
    portG.rotateZ(Math.PI / 2);

    // yacht standing rigging + guardrails, all in one bundle
    const MH = [0, DECK + 9.2, 0.05];                  // masthead
    const rigParts = [
      strut(MH, [0, DECK + 0.6, 4.5], 0.035, 4),       // forestay
      strut(MH, [0, DECK + 0.05, -4.2], 0.035, 4),     // backstay
      strut(MH, [-1.34, DECK + 0.1, -0.2], 0.032, 4),  // port shroud
      strut(MH, [1.34, DECK + 0.1, -0.2], 0.032, 4),   // starboard shroud
    ];
    for (const sg of [1, -1]) {
      rigParts.push(strut([sg * 1.42, DECK + 0.62, -3.3], [sg * 1.5, DECK + 0.62, 2.5], 0.026, 4));
      for (const sz of [-3.3, -1.4, 0.5, 2.5]) {
        rigParts.push(strut([sg * 1.46, DECK, sz], [sg * 1.46, DECK + 0.64, sz], 0.035, 5));
      }
    }
    const rigG = bundle(rigParts);
    // yacht deck gear: cockpit coaming, two winches, a hatch and the pushpit
    const gearG = bundle([
      strut([-0.95, DECK + 0.02, -3.6], [-0.95, DECK + 0.22, -1.1], 0.07, 4),
      strut([0.95, DECK + 0.02, -3.6], [0.95, DECK + 0.22, -1.1], 0.07, 4),
      strut([-0.95, DECK + 0.22, -3.6], [0.95, DECK + 0.22, -3.6], 0.07, 4),
      new THREE.CylinderGeometry(0.16, 0.19, 0.34, 10).translate(-0.78, DECK + 0.3, -2.2),
      new THREE.CylinderGeometry(0.16, 0.19, 0.34, 10).translate(0.78, DECK + 0.3, -2.2),
      new THREE.BoxGeometry(0.75, 0.1, 0.75).translate(0, DECK + 0.12, 1.55),
      strut([0, DECK + 0.62, 4.4], [-0.7, DECK + 0.62, 3.5], 0.032, 4),
      strut([0, DECK + 0.62, 4.4], [0.7, DECK + 0.62, 3.5], 0.032, 4),
      strut([0, DECK, 4.45], [0, DECK + 0.64, 4.4], 0.035, 5),
    ]);
    // trawler working gear: stern gantry, net drum, mast light and rail
    const gantG = bundle([
      strut([-1.12, DECK, -3.2], [-0.9, DECK + 1.75, -3.5], 0.07, 6),
      strut([1.12, DECK, -3.2], [0.9, DECK + 1.75, -3.5], 0.07, 6),
      strut([-0.9, DECK + 1.75, -3.5], [0.9, DECK + 1.75, -3.5], 0.07, 6),
      new THREE.CylinderGeometry(0.34, 0.34, 1.5, 12)
        .rotateZ(Math.PI / 2).translate(0, DECK + 0.5, -2.4),
    ]);
    const tRailG = bundle([
      strut([-1.2, DECK, 3.4], [-1.35, DECK + 0.62, 1.4], 0.045, 5),
      strut([1.2, DECK, 3.4], [1.35, DECK + 0.62, 1.4], 0.045, 5),
      strut([-1.35, DECK + 0.62, 1.4], [1.35, DECK + 0.62, 1.4], 0.04, 5),
      strut([-1.35, DECK + 0.62, 1.4], [-1.42, DECK + 0.62, -2.6], 0.04, 5),
      strut([1.35, DECK + 0.62, 1.4], [1.42, DECK + 0.62, -2.6], 0.04, 5),
    ]);
    // rudder and skeg, under the transom where a boat actually carries them
    const keelG = bundle([
      new THREE.BoxGeometry(0.14, 0.95, 0.8).translate(0, -1.75, -3.4),
      new THREE.BoxGeometry(0.28, 0.62, 2.6).translate(0, -1.86, -0.6),
    ]);

    const sail = (Aa, Bb, Cc, belly) => this._sailGeo(Aa, Bb, Cc, belly);
    // A MOORED BOAT DOES NOT FLY ITS SAILS.
    //
    // Twenty of the thirty boats were yachts and every one of them carried a
    // full-size 9.4 m mainsail AND a jib, hoisted, while tied up in a slip.
    // That is not a lighting or a spacing problem - it is twenty white
    // triangles of identical size and shape standing in a row, and it is
    // literally the wall of sails in the player's photograph. Boats in a
    // marina have their main flaked on the boom under a cover and their jib
    // rolled on the forestay.
    //
    // Same two instanced meshes, same indices, same draw calls - the geometry
    // is a furled bundle instead of a sail. The sails in this world are now
    // on the boats that are SAILING, out in the bay (see the flotilla in
    // _buildSea), which is where a sail means something.
    const mainG = this._bundle([
      new THREE.CylinderGeometry(0.19, 0.15, 4.3, 8)
        .rotateX(Math.PI / 2).translate(0, 1.66, -2.15),
      // the cover's tie-downs, three little bands round the bundle
      new THREE.CylinderGeometry(0.22, 0.22, 0.12, 8)
        .rotateX(Math.PI / 2).translate(0, 1.66, -0.6),
      new THREE.CylinderGeometry(0.22, 0.22, 0.12, 8)
        .rotateX(Math.PI / 2).translate(0, 1.66, -2.2),
      new THREE.CylinderGeometry(0.22, 0.22, 0.12, 8)
        .rotateX(Math.PI / 2).translate(0, 1.66, -3.8),
    ]);
    // the headsail, rolled up the forestay
    const jibG = this._strut([0, 0.85, 4.3], [0, 9.0, 0.08], 0.14, 8);
    // SAILS ARE WHITE CANVAS, and they are NOT per-instance coloured. Two
    // instanced meshes sharing one vertexColors material rendered every sail
    // black - the colour attribute belongs to the mesh, the shader define to
    // the material, and one material cannot serve both.
    const sailMat = () => new THREE.MeshStandardMaterial({ color: 0xdcd6c6,
      roughness: 0.9, flatShading: true });

    // A HULL RUNS -4.30 TO +4.70 IN ITS OWN FRAME, so a boat whose stern is to
    // clear the walkway sits at PON + 2.6 + 4.30 * scale. Worked out per boat
    // rather than fixed, because the scale varies and a trawler is 12 % longer
    // than the yacht beside it.
    // A MARINA IS MOSTLY SMALL BOATS. The old mix ran 0.90 to 1.12 - a spread
    // of 24 per cent, invisible at fifty metres - and every hull carried the
    // same 9.4 u mast, which is what built the uniform skyline. This is a real
    // population, and a third of it carries NO MAST AT ALL: the motor launches
    // are what actually break a picket of sails.
    //   0 = motor launch (no rig)  1 = small yacht  2 = cruiser  3 = trawler
    const KIND = [1, 0, 2, 1, 0, 3, 1, 0, 1, 2, 0, 1, 3, 0, 1,
      2, 0, 1, 0, 1, 3, 0, 2, 1, 0, 1, 0, 2, 1, 0];
    const SCALE_OF = [0.60, 0.86, 1.28, 1.10];
    const SCALE_AT = (i) => SCALE_OF[KIND[i % KIND.length]]
      * (0.92 + (((Math.sin(i * 7.13) * 43758.5453) % 1) + 1) % 1 * 0.16);
    const slips = [];
    for (let f = 0; f < fingerAt.length && slips.length < SLIPS; f++) {
      const du = fingerAt[f].du;
      // a metre of scatter fore-and-aft: thirty boats whose bows line up to
      // the centimetre read as a car park, and the slack is on the axis that
      // cannot cause a collision - neighbours sit side by side, not in line
      const jit = ((Math.sin(slips.length * 12.9898) * 43758.5453) % 1) * 1.6;
      slips.push([du, fingerAt[f].dn + 2.6 + 4.30 * SCALE_AT(slips.length) + jit]);
    }
    const N = slips.length;
    const IM = (geo, mat, n) => new THREE.InstancedMesh(geo, mat, n);
    const alloy = () => new THREE.MeshStandardMaterial({ color: 0xcfcabc,
      roughness: 0.5, metalness: 0.35, flatShading: true });
    const hulls = IM(hullG, new THREE.MeshStandardMaterial({
      color: 0xffffff, vertexColors: true, roughness: 0.55,
      side: THREE.DoubleSide, flatShading: true }), N);
    const decks = IM(deckG, new THREE.MeshStandardMaterial({
      color: 0x9a7c52, roughness: 1, side: THREE.DoubleSide, flatShading: true }), N);
    const bands = IM(bandG, new THREE.MeshStandardMaterial({
      color: 0x2b2a27, roughness: 0.6, side: THREE.DoubleSide, flatShading: true }), N);
    const cabins = IM(cabG, new THREE.MeshStandardMaterial({
      color: 0xffffff, vertexColors: true, roughness: 0.8, flatShading: true }), N * 3);
    const masts = IM(mastG, alloy(), N);
    const booms = IM(boomG, alloy(), N);
    const rigs = IM(rigG, alloy(), N);
    const gears = IM(gearG, new THREE.MeshStandardMaterial({
      color: 0xe8e3d6, roughness: 0.7, flatShading: true }), N);
    const gants = IM(gantG, new THREE.MeshStandardMaterial({
      color: 0x8f4232, roughness: 0.85, flatShading: true }), N);
    const trails = IM(tRailG, alloy(), N);
    const keels = IM(keelG, new THREE.MeshStandardMaterial({
      color: 0x2c3138, roughness: 0.8, flatShading: true }), N);
    const ports = IM(portG, new THREE.MeshStandardMaterial({
      color: 0x1d242c, roughness: 0.35, metalness: 0.4 }), N * 8);
    const mains = IM(mainG, sailMat(), N);
    const jibs = IM(jibG, sailMat(), N);
    const fends = IM(fendG, new THREE.MeshStandardMaterial({
      color: 0x201d1a, roughness: 0.9 }), N * 3);

    const m4 = new THREE.Matrix4(), lm = new THREE.Matrix4();
    const q = new THREE.Quaternion(), lq = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0), col = new THREE.Color();
    const V = (a, b, c) => new THREE.Vector3(a, b, c);
    const ONE = V(1, 1, 1);
    // local part -> world, so a coachroof offset AFT stays aft whatever the
    // shore bearing is. The first cut computed the offset and then threw it
    // away, which is why every cabin sat dead amidships.
    const put = (mesh, k, boat, pos, scl, rot) => {
      lq.setFromAxisAngle(up, rot || 0);
      lm.compose(pos, lq, scl);
      m4.multiplyMatrices(boat, lm);
      mesh.setMatrixAt(k, m4);
    };
    const HULLS = [0xf4efe4, 0x2f5f8f, 0xa8352c, 0xf4efe4, 0x2e6a4a, 0xefe6d2,
      0xf4efe4, 0x3d6f8f, 0xd8b45a, 0xefe6d2, 0x7a4a86, 0xf4efe4,
      0x2f5f8f, 0xc2603a, 0xf4efe4, 0x4a7f6a, 0xefe6d2, 0x8f3550];
    // working boats wear working colours, and not all the same one
    const WORK = [0x2f5f8f, 0x1f6b52, 0x8f4232, 0x3a5a72, 0x6a6f3a, 0x9a5a2a,
      0x2f5f8f, 0x4a3f6a, 0x7a2f2a, 0x2a6a6a];
    let ck = 0, fk = 0, mk = 0, pk = 0, gk = 0, tk = 0;
    for (let i = 0; i < N; i++) {
      const p = at(slips[i][0], slips[i][1]);
      const kind = KIND[i % KIND.length];
      const trawler = kind === 3;
      const motor = kind === 0;
      const sc = SCALE_AT(i);
      // bows to open water, with a degree or two of scatter on the warps
      q.setFromAxisAngle(up, yaw + Math.PI / 2 + (i % 2 ? 0.05 : -0.05));
      // FLOAT HER ON THE CHINE. At +0.55 the whole underwater body showed
      // above the waterline at the transom - a dark wedge under the stern that
      // reads as a box bolted on. Sitting the hull so the waterline meets the
      // chine crease is both what a boat does and what hides the bottom.
      const boat = new THREE.Matrix4().compose(V(p.x, y + 0.38, p.z), q, V(sc, sc, sc));
      hulls.setMatrixAt(i, boat);
      // STRIDE THE PALETTE. Walking it in order put runs of the same blue next
      // to each other - eighteen liveries and the near row still read as one
      // colour - and every trawler wore the identical navy on top of that.
      col.set(trawler ? WORK[(i / 3 | 0) % WORK.length]
        : HULLS[(i * 7) % HULLS.length]);
      hulls.setColorAt(i, col);
      decks.setMatrixAt(i, boat);
      bands.setMatrixAt(i, boat);
      keels.setMatrixAt(i, boat);
      // a yacht carries a low coachroof aft; a trawler a tall wheelhouse
      // forward with a stubby funnel behind it, and both wear a window band
      if (trawler) {
        put(cabins, ck, boat, V(0, DECK + 0.77, 0.9), V(2.0, 1.5, 2.1));
        cabins.setColorAt(ck++, col.set(0xece7d8));
        put(cabins, ck, boat, V(0, DECK + 1.15, 0.9), V(2.06, 0.5, 2.16));
        cabins.setColorAt(ck++, col.set(0x2b3038));
        put(cabins, ck, boat, V(0, DECK + 1.42, -0.6), V(0.5, 0.9, 0.5));
        cabins.setColorAt(ck++, col.set(0x8a4a3a));
        gants.setMatrixAt(gk, boat);
        trails.setMatrixAt(gk, boat);
        gk++;
      } else {
        put(cabins, ck, boat, V(0, DECK + 0.36, -1.25),
          V(1.85, motor ? 1.15 : 0.72, motor ? 4.4 : 3.3));
        cabins.setColorAt(ck++, col.set(0xf4efe4));
        put(cabins, ck, boat, V(0, DECK + 0.46, -1.25), V(1.9, 0.26, 3.0));
        cabins.setColorAt(ck++, col.set(0x39424e));
        put(cabins, ck, boat, V(0, DECK + 0.22, 0.9), V(1.35, 0.34, 1.1));
        cabins.setColorAt(ck++, col.set(0x39424e));
        gears.setMatrixAt(tk++, boat);
        if (!motor) rigs.setMatrixAt(mk, boat);
      }
      // rig: full on a yacht, a short derrick on the trawler
      const mh = motor ? 0.0001 : (trawler ? 0.46 : 1.0);
      put(masts, i, boat, V(0, DECK + 4.7 * mh, 0.05), V(motor ? 0.0001 : 1, mh, 1));
      if (motor) {
        // a launch carries nothing aloft: collapse the boom rather than skip
        // it, so every per-boat instanced mesh keeps index === boat index
        lm.compose(V(0, DECK, 0), lq.identity(), V(0.0001, 0.0001, 0.0001));
        m4.multiplyMatrices(boat, lm);
        booms.setMatrixAt(i, m4);
      } else if (trawler) {
        lq.setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.62);
        lm.compose(V(0, DECK + 2.3, -1.2), lq, V(1, 1, 0.62));
        m4.multiplyMatrices(boat, lm);
        booms.setMatrixAt(i, m4);
      } else {
        put(booms, i, boat, V(0, DECK + 1.45, -2.15), ONE);
        put(mains, mk, boat, V(0, DECK, 0), ONE);
        put(jibs, mk, boat, V(0, DECK, 0), ONE);
        mk++;
      }
      // portholes down both topsides, and tyre fenders on the moored side
      for (const sg of [1, -1]) {
        for (const pz of [-1.9, -0.3, 1.3, 2.5]) {
          put(ports, pk++, boat, V(sg * 1.47, DECK - 0.45, pz), ONE);
        }
      }
      const side = i % 2 ? 1 : -1;
      for (const fz of [-2.4, 0.1, 2.2]) {
        put(fends, fk++, boat, V(side * 1.52, DECK - 0.38, fz), ONE);
      }
    }
    mains.count = jibs.count = rigs.count = mk;
    cabins.count = ck;
    fends.count = fk;
    ports.count = pk;
    gants.count = trails.count = gk;
    gears.count = tk;
    booms.count = N;
    for (const m of [hulls, decks, bands, keels, cabins, masts, booms, rigs,
      gears, gants, trails, ports, mains, jibs, fends]) {
      m.castShadow = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
      g.add(m);
    }

    // --- cleats on the pontoon, bollards on the quay lip ---------------------
    const ringG = new THREE.TorusGeometry(0.34, 0.075, 5, 9);
    ringG.rotateX(Math.PI / 2);
    const rings = new THREE.InstancedMesh(ringG, new THREE.MeshStandardMaterial({
      color: 0x2a2622, roughness: 0.6, metalness: 0.5 }), 64);
    const bollG = new THREE.CylinderGeometry(0.26, 0.34, 0.85, 8);
    const bolls = new THREE.InstancedMesh(bollG, new THREE.MeshStandardMaterial({
      color: 0x6d6a62, roughness: 0.9, flatShading: true }), 40);
    let rk = 0, bk = 0;
    q.setFromAxisAngle(up, yaw);
    for (let du = -SPAN * 0.5; du <= SPAN * 0.5 && rk < rings.count; du += 12) {
      const p = at(du, PON + 2.4);
      m4.compose(V(p.x, y + 0.82, p.z), q, ONE);
      rings.setMatrixAt(rk++, m4);
    }
    for (let du = -SPAN * 0.8; du <= SPAN * 0.8 && bk < bolls.count; du += 11) {
      const p = at(du, -4);
      const gy = this.terrainHeight(p.x, p.z);
      m4.compose(V(p.x, gy + 0.36, p.z), q, ONE);
      bolls.setMatrixAt(bk++, m4);
    }
    rings.count = rk; bolls.count = bk;
    bolls.castShadow = true;
    g.add(rings, bolls);

    // --- the two remaining pieces of the harbour kit ------------------------
    // An ORNATE CANNON on its carriage, laid along the wall pointing out to
    // sea, and a DOCKING RAMP - a slipway running from the quay down into the
    // water, which is how a boat gets out of it.
    const carr = new THREE.MeshStandardMaterial({ color: 0x6b4a2c, roughness: 1, flatShading: true });
    const iron = new THREE.MeshStandardMaterial({ color: 0x25282c, roughness: 0.4,
      metalness: 0.65, flatShading: true });
    // ORNATE, not a pipe on a plank. A gun is a stepped casting: cascabel
    // knob, breech, base ring, chase tapering to a muzzle astragal and swell,
    // with trunnions either side; the carriage is stepped cheeks on a bed
    // with SPOKED wheels. All of it bundles into two geometries, so three
    // cannons cost two draw calls between them.
    const XR = Math.PI / 2;                       // cylinders lie along X
    const lie = (g2) => g2.rotateZ(XR);
    const ironParts = [
      new THREE.SphereGeometry(0.17, 12, 8).translate(-1.62, 1.05, 0),
      lie(new THREE.CylinderGeometry(0.36, 0.38, 0.9, 16)).translate(-1.15, 1.05, 0),
      lie(new THREE.CylinderGeometry(0.41, 0.41, 0.14, 16)).translate(-0.68, 1.05, 0),
      lie(new THREE.CylinderGeometry(0.24, 0.31, 1.92, 16)).translate(0.30, 1.05, 0),
      lie(new THREE.CylinderGeometry(0.30, 0.30, 0.12, 16)).translate(1.28, 1.05, 0),
      lie(new THREE.CylinderGeometry(0.31, 0.33, 0.30, 16)).translate(1.47, 1.05, 0),
      new THREE.CylinderGeometry(0.115, 0.115, 0.94, 10).rotateX(XR).translate(-0.25, 1.05, 0),
    ];
    for (const wx of [-0.82, 0.66]) {
      const wr = wx < 0 ? 0.46 : 0.34;            // trail wheels run larger
      for (const wz of [0.8, -0.8]) {
        const tw = new THREE.TorusGeometry(wr, 0.075, 8, 18);
        ironParts.push(tw.translate(wx, wr - 0.02, wz));
        ironParts.push(new THREE.CylinderGeometry(0.11, 0.11, 0.22, 10)
          .rotateX(XR).translate(wx, wr - 0.02, wz));
        for (let sp = 0; sp < 8; sp++) {
          const an = (sp / 8) * Math.PI * 2;
          ironParts.push(new THREE.BoxGeometry(0.055, wr * 0.92, 0.055)
            .rotateZ(an).translate(wx + Math.sin(an) * wr * 0.46,
              wr - 0.02 - Math.cos(an) * wr * 0.46, wz));
        }
      }
      ironParts.push(new THREE.CylinderGeometry(0.09, 0.09, 1.74, 10)
        .rotateX(XR).translate(wx, wr - 0.02, 0));
    }
    const woodParts = [];
    for (const cz of [0.62, -0.62]) {
      woodParts.push(new THREE.BoxGeometry(2.5, 0.46, 0.26).translate(-0.18, 0.62, cz));
      woodParts.push(new THREE.BoxGeometry(1.5, 0.34, 0.26).translate(-0.55, 0.95, cz));
      woodParts.push(new THREE.BoxGeometry(0.7, 0.26, 0.26).translate(-1.35, 0.42, cz));
    }
    woodParts.push(new THREE.BoxGeometry(2.4, 0.16, 1.35).translate(-0.18, 0.42, 0));
    const gunIron = new THREE.InstancedMesh(this._bundle(ironParts), iron, 3);
    const gunWood = new THREE.InstancedMesh(this._bundle(woodParts), carr, 3);
    gunIron.castShadow = gunWood.castShadow = true;
    let cgk = 0;
    for (const cn of [[-SPAN * 0.62, 1], [SPAN * 0.18, -1], [SPAN * 0.72, 1]]) {
      const p = at(cn[0], -19);        // up by the wall, not out on the sand
      const gy = this.terrainHeight(p.x, p.z);
      // A GUN POINTS OUT TO SEA. `yaw` maps local +X seaward, so the +-PI/2 the
      // first version used laid the barrel ALONG the quay, aimed at the next
      // cannon. The flip is now just a few degrees of train either side.
      m4.compose(V(p.x, gy, p.z),
        q.setFromAxisAngle(up, yaw + cn[1] * 0.3), ONE);
      gunIron.setMatrixAt(cgk, m4);
      gunWood.setMatrixAt(cgk, m4);
      cgk++;
      this.solids.push({ x: p.x, z: p.z, r: 1.5, y: gy + 0.5, mat: 'stone' });
    }
    g.add(gunIron, gunWood);
    // the slipway: from the quay lip down under the water, corners placed
    // explicitly so the top meets the ground and the bottom meets the seabed
    {
      const du = -SPAN * 0.34, HW = 4.5;
      const a = P(du - HW, -7), b = P(du + HW, -7);
      const c = P(du + HW, 13), d = P(du - HW, 13);
      const ty = this.terrainHeight(a[0], a[1]) + 0.12;
      const conc = new THREE.MeshStandardMaterial({ color: 0x9a9484, roughness: 1,
        side: THREE.DoubleSide, flatShading: true });
      g.add(quad([a[0], ty, a[1]], [b[0], ty, b[1]],
        [c[0], y - 1.9, c[1]], [d[0], y - 1.9, d[1]], conc));
    }

    g.name = 'marina';
    this.group.add(g);
  }

  _buildQuayside(m4) {
    const C = this.T.coast;
    if (!C) return;
    const abx = C.b[0] - C.a[0], abz = C.b[1] - C.a[1];
    const L = Math.hypot(abx, abz);
    const cnx = abz / L, cnz = -abx / L;                  // seaward normal
    const mk = (geo, mat, max) => new THREE.InstancedMesh(geo, mat, max);
    const capGeo = new THREE.BoxGeometry(0.95, 0.55, 2.6);
    const caps = mk(capGeo, new THREE.MeshStandardMaterial({
      color: 0xb0a894, flatShading: true, roughness: 1 }), 260);
    const bolGeo = new THREE.CylinderGeometry(0.22, 0.17, 0.85, 7);
    bolGeo.translate(0, 0.42, 0);
    const bols = mk(bolGeo, new THREE.MeshStandardMaterial({
      color: 0x26282c, roughness: 0.5, metalness: 0.55 }), 60);
    const barGeo = new THREE.CylinderGeometry(0.5, 0.44, 1.05, 8);
    barGeo.translate(0, 0.52, 0);
    const bars = mk(barGeo, new THREE.MeshStandardMaterial({
      color: 0x7a5a34, flatShading: true, roughness: 0.9 }), 70);
    const crGeo = new THREE.BoxGeometry(1.15, 1.0, 1.15);
    crGeo.translate(0, 0.5, 0);
    const crs = mk(crGeo, new THREE.MeshStandardMaterial({
      color: 0xb99a68, flatShading: true, roughness: 0.95 }), 50);
    const ropeGeo = new THREE.CylinderGeometry(0.66, 0.7, 0.16, 9);
    ropeGeo.translate(0, 0.08, 0);
    const ropes = mk(ropeGeo, new THREE.MeshStandardMaterial({
      color: 0xd8c9a4, roughness: 1 }), 40);
    const q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
    let kc = 0, kb = 0, kr = 0, kx = 0, ko = 0;
    // THE STONE APRON: the strip between the road edge and the waterline IS
    // the quay, so it is paved, not lawn. A conforming ribbon of stone-grey
    // facets from the road shoulder down to just past the waterline; without
    // it the harbour front reads as a seaside meadow with barrels on it.
    const apron = { pos: [], col: [], idx: [], prev: -99 };
    const aCol = new THREE.Color(0x9c947e), aTmp = new THREE.Color();
    for (let i = 0; i < N; i++) {
      const c = this.center[i];
      const sd0 = this._coastSide(c.x, c.z);
      if (sd0 < -55 || sd0 > -13) continue;             // only the seafront reach
      if (this._circDist(i, 0) < 26) continue;          // the grid owns the line
      // which side of THIS sample faces the water
      const dot = this.nrm[i].x * cnx + this.nrm[i].z * cnz;
      const side = dot > 0 ? 1 : -1;
      const at = (lat, dAlong = 0) => {
        const p = this.pointAt(i, lat * side);
        if (dAlong) { p.x += this.tan[i].x * dAlong; p.z += this.tan[i].z * dAlong; }
        p.y = this.terrainHeight(p.x, p.z);
        return p;
      };
      // apron cross-section: road shoulder -> mid-quay -> water's edge
      {
        const inner = at(10.1);
        const walk = Math.max(2, -this._coastSide(inner.x, inner.z) - 0.4);
        const base = apron.pos.length / 3;
        for (const f of [0, 0.55, 1]) {
          const px = inner.x + cnx * walk * f, pz = inner.z + cnz * walk * f;
          apron.pos.push(px, this.terrainHeight(px, pz) + 0.07, pz);
          const hsh = Math.sin(px * 7.31 + pz * 13.77) * 43758.5453;
          aTmp.copy(aCol).multiplyScalar(0.93 + (hsh - Math.floor(hsh)) * 0.16);
          apron.col.push(aTmp.r, aTmp.g, aTmp.b);
        }
        if (i === apron.prev + 1) {
          const a = base - 3;
          for (let s2 = 0; s2 < 2; s2++) {
            apron.idx.push(a + s2, a + s2 + 1, base + s2, a + s2 + 1, base + s2 + 1, base + s2);
          }
        }
        apron.prev = i;
      }
      q.setFromAxisAngle(up, this.headingAt(i));
      // the quay wall: one capstone per sample = a near-continuous low wall
      if (kc < 260) {
        const p = at(11.0);
        m4.compose(new THREE.Vector3(p.x, p.y + 0.18, p.z), q, new THREE.Vector3(1, 1, 1));
        caps.setMatrixAt(kc++, m4);
      }
      if (i % 5 === 0 && kb < 60) {                     // mooring bollards
        const p = at(10.8);
        m4.compose(new THREE.Vector3(p.x, p.y + 0.42, p.z), q, new THREE.Vector3(1, 1, 1));
        bols.setMatrixAt(kb++, m4);
      }
      if (i % 9 === 4 && Math.random() < 0.75 && kr < 68) {   // barrel clusters
        const nBar = 1 + ((Math.random() * 3) | 0);
        for (let b = 0; b < nBar && kr < 68; b++) {
          const p = at(12.1 + Math.random() * 1.6, (Math.random() - 0.5) * 2.2);
          q.setFromAxisAngle(up, Math.random() * Math.PI);
          m4.compose(new THREE.Vector3(p.x, p.y, p.z), q,
            new THREE.Vector3(1, 0.85 + Math.random() * 0.3, 1));
          bars.setMatrixAt(kr++, m4);
        }
      }
      if (i % 11 === 7 && Math.random() < 0.6 && kx < 50) {   // crates
        const p = at(12.4 + Math.random() * 1.2, (Math.random() - 0.5) * 2);
        q.setFromAxisAngle(up, Math.random() * Math.PI);
        m4.compose(new THREE.Vector3(p.x, p.y, p.z), q,
          new THREE.Vector3(1, 0.8 + Math.random() * 0.5, 1));
        crs.setMatrixAt(kx++, m4);
      }
      if (i % 13 === 2 && ko < 40) {                    // coiled mooring lines
        const p = at(11.9 + Math.random() * 1.4, (Math.random() - 0.5) * 1.6);
        q.setFromAxisAngle(up, Math.random() * Math.PI);
        m4.compose(new THREE.Vector3(p.x, p.y + 0.02, p.z), q, new THREE.Vector3(1, 1, 1));
        ropes.setMatrixAt(ko++, m4);
      }
    }
    caps.count = kc; bols.count = kb; bars.count = kr; crs.count = kx; ropes.count = ko;
    caps.name = 'quay-wall';
    for (const m of [caps, bols, bars, crs, ropes]) {
      if (!m.count) continue;
      m.castShadow = true;
      m.receiveShadow = true;
      this.group.add(m);
    }
    if (apron.idx.length) {
      const ag = new THREE.BufferGeometry();
      ag.setAttribute('position', new THREE.Float32BufferAttribute(apron.pos, 3));
      ag.setAttribute('color', new THREE.Float32BufferAttribute(apron.col, 3));
      ag.setIndex(apron.idx);
      ag.computeVertexNormals();
      const am = new THREE.Mesh(ag, new THREE.MeshStandardMaterial({
        vertexColors: true, flatShading: true, roughness: 1,
        side: THREE.DoubleSide, polygonOffset: true,
        polygonOffsetFactor: -1, polygonOffsetUnits: -1,
      }));
      am.name = 'quay-apron';
      am.receiveShadow = true;
      this.group.add(am);
    }
  }

  /** THE WINDMILL - the estate landmark from the player's vineyard art:
   *  tapered stone tower, conical cap, four lattice sails, on open ground. */
  _buildWindmill() {
    let spot = null;
    for (let tries = 0; tries < 40 && !spot; tries++) {
      const p = this._trackSidePos(46, 110);
      if (!p) continue;
      const h0 = this.terrainHeight(p.x, p.z);
      let ok = true;
      for (const [dx, dz] of [[8, 0], [-8, 0], [0, 8], [0, -8]]) {
        if (Math.abs(this.terrainHeight(p.x + dx, p.z + dz) - h0) > 1.4) { ok = false; break; }
      }
      if (ok) spot = { x: p.x, z: p.z, y: h0 };
    }
    if (!spot) return;
    const g = new THREE.Group();
    const stone = new THREE.MeshStandardMaterial({ color: 0xd8d0c0, flatShading: true, roughness: 1 });
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 3.4, 11, 8), stone);
    tower.position.set(spot.x, spot.y + 5.5, spot.z);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(3.0, 2.6, 8),
      new THREE.MeshStandardMaterial({ color: 0x8a4630, flatShading: true, roughness: 0.9 }));
    cap.position.set(spot.x, spot.y + 12.2, spot.z);
    const sailMat = new THREE.MeshStandardMaterial({ color: 0xf2ecd8, roughness: 0.85,
      side: THREE.DoubleSide });
    const hub = new THREE.Group();
    for (let k = 0; k < 4; k++) {
      const sail = new THREE.Mesh(new THREE.BoxGeometry(1.7, 7.2, 0.16), sailMat);
      sail.position.set(0, 4.2, 0);
      const arm = new THREE.Group();
      arm.add(sail);
      arm.rotation.z = (k * Math.PI) / 2 + 0.5;
      hub.add(arm);
    }
    hub.position.set(spot.x, spot.y + 10.4, spot.z + 3.1);
    tower.castShadow = cap.castShadow = true;
    g.add(tower, cap, hub);
    this.group.add(g);
    this._addShadow(spot.x, spot.z, 4.5);
    this.solids.push({ x: spot.x, z: spot.z, r: 3.4, y: spot.y + 2, mat: 'stone' });
  }

  /** STONE BRIDGES: arched masonry spans where the road crosses a dip - the
   *  parapets read from far off, and the deck carries a baked hump that a
   *  fast car JUMPS. Placement is honest: only where the ground beside the
   *  road genuinely falls away. */
  _buildStoneBridges() {
    const B = this.T.stoneBridges;
    const count = B.count ?? 2;
    // find dips: ground 5+ u below the deck on both sides, straight-ish road
    const cands = [];
    for (let i = 0; i < N; i += 3) {
      if (this._circDist(i, 0) < 90 || this._nearGorge(i, 60)) continue;
      if (this.curvature[i] > 0.01) continue;
      const c = this.center[i], n = this.nrm[i];
      const dl = c.y - this.terrainHeight(c.x + n.x * 15, c.z + n.z * 15);
      const dr = c.y - this.terrainHeight(c.x - n.x * 15, c.z - n.z * 15);
      const drop = Math.min(dl, dr);
      if (drop > 4.5) cands.push({ i, drop });
    }
    cands.sort((a, b) => b.drop - a.drop);
    const picked = [];
    for (const cand of cands) {
      if (picked.length >= count) break;
      if (picked.some((q) => this._circDist(cand.i, q.i) < 120)) continue;
      picked.push(cand);
    }
    const stone = new THREE.MeshStandardMaterial({
      color: 0x9a9188, flatShading: true, roughness: 1,
    });
    for (const { i } of picked) {
      const span = Math.ceil(26 / this.segLen);
      // the jump hump: raise the deck through the crossing
      for (let k = -span; k <= span; k++) {
        const j = (i + k + N) % N;
        this.center[j].y += 1.5 * Math.pow(Math.cos((k / span) * Math.PI * 0.5), 1.4);
      }
      const g = new THREE.Group();
      for (const side of [1, -1]) {
        // parapet walls the length of the span
        const wall = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), stone);
        const a = this.center[(i - span + N) % N], b2 = this.center[(i + span) % N];
        const mxx = (a.x + b2.x) / 2, mzz = (a.z + b2.z) / 2;
        const yaw = this.headingAt(i);
        const nn = this.nrm[i];
        wall.scale.set(1.1, 1.6, span * 2 * this.segLen);
        wall.position.set(mxx + nn.x * 10.6 * side, this.center[i].y + 0.6, mzz + nn.z * 10.6 * side);
        wall.rotation.y = yaw;
        wall.castShadow = true;
        g.add(wall);
        this.solids.push({ x: wall.position.x, z: wall.position.z, r: 1.4,
          y: this.center[i].y + 1, mat: 'stone' });
        // arch faces: two masonry blocks descending under the deck
        for (const k of [-span * 0.55, span * 0.55]) {
          const j = (i + Math.round(k) + N) % N;
          const c = this.center[j];
          const pier = new THREE.Mesh(new THREE.BoxGeometry(2.2, 9, 3.2), stone);
          pier.position.set(c.x + nn.x * 8.5 * side, c.y - 4.6, c.z + nn.z * 8.5 * side);
          pier.rotation.y = yaw;
          g.add(pier);
        }
      }
      this.group.add(g);
    }
  }

  /** TORII GATES straddling the road + hillside PAGODAS - the Japanese
   *  dressing Suzuka asked for. Vermillion posts and lintels; tiered pagoda
   *  roofs on the knolls. Pure scenery plus parapet-grade solids. */
  _buildJapan() {
    const J = this.T.japan;
    const verm = new THREE.MeshStandardMaterial({ color: 0xc0392b, roughness: 0.8 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x2e2320, roughness: 0.9 });
    // torii over the carriageway at calm, distinctive spots
    let placed = 0;
    for (let i = 60; i < N && placed < (J.torii ?? 4); i += 7) {
      if (this.curvature[i] > 0.006 || this._nearGorge(i, 30)) continue;
      const c = this.center[i], n = this.nrm[i];
      const yaw = this.headingAt(i);
      const g = new THREE.Group();
      for (const side of [1, -1]) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 8.2, 8), verm);
        post.position.set(c.x + n.x * 11 * side, c.y + 4.1, c.z + n.z * 11 * side);
        g.add(post);
        this.solids.push({ x: post.position.x, z: post.position.z, r: 0.9,
          y: c.y + 1, mat: 'stone' });
      }
      const lintel = new THREE.Mesh(new THREE.BoxGeometry(25.5, 0.9, 1.3), verm);
      lintel.position.set(c.x, c.y + 8.4, c.z);
      lintel.rotation.y = yaw;
      const lintel2 = new THREE.Mesh(new THREE.BoxGeometry(22.5, 0.6, 1.0), dark);
      lintel2.position.set(c.x, c.y + 7.2, c.z);
      lintel2.rotation.y = yaw;
      g.add(lintel, lintel2);
      g.traverse((mm) => { mm.castShadow = true; });
      this.group.add(g);
      placed++;
      i += 120;                                   // spread the gates out
    }
    // pagodas on open knolls
    const wall = new THREE.MeshStandardMaterial({ color: 0x8a2f26, flatShading: true, roughness: 0.9 });
    const roof = new THREE.MeshStandardMaterial({ color: 0x35302c, flatShading: true, roughness: 0.85 });
    for (let k = 0; k < (J.pagodas ?? 2); k++) {
      let spot = null;
      for (let t2 = 0; t2 < 30 && !spot; t2++) {
        const q = this._trackSidePos(34, 90);
        if (!q) continue;
        const h0 = this.terrainHeight(q.x, q.z);
        let ok = true;
        for (const [dx, dz] of [[6, 0], [-6, 0], [0, 6], [0, -6]]) {
          if (Math.abs(this.terrainHeight(q.x + dx, q.z + dz) - h0) > 1.6) { ok = false; break; }
        }
        if (ok) spot = { x: q.x, z: q.z, y: h0 };
      }
      if (!spot) continue;
      const g = new THREE.Group();
      let w = 7.5, y = spot.y;
      for (let tier = 0; tier < 3; tier++) {
        const body = new THREE.Mesh(new THREE.BoxGeometry(w, 3.1, w), wall);
        body.position.set(spot.x, y + 1.55, spot.z);
        const cap = new THREE.Mesh(new THREE.ConeGeometry(w * 0.95, 1.6, 4), roof);
        cap.rotation.y = Math.PI / 4;
        cap.position.set(spot.x, y + 3.9, spot.z);
        g.add(body, cap);
        y += 3.6; w *= 0.74;
      }
      const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.2, 6), roof);
      spire.position.set(spot.x, y + 1.4, spot.z);
      g.add(spire);
      g.traverse((mm) => { mm.castShadow = true; });
      this.group.add(g);
      this._addShadow(spot.x, spot.z, 6);
      this.solids.push({ x: spot.x, z: spot.z, r: 4.4, y: spot.y + 2, mat: 'stone' });
    }
  }

  /** OVERPASS DECKS: parapet rails and piers under every flyover span, so
   *  the raised leg reads as a BRIDGE (the sketch's own word) and not a
   *  floating ramp. Solids ride the parapets - falling off is not on. */
  _buildOverpassDecks() {
    const stone = new THREE.MeshStandardMaterial({
      color: 0x8f8a80, flatShading: true, roughness: 1,
    });
    for (const o of this._overpasses) {
      const g = new THREE.Group();
      for (let sN = -o.half; sN <= o.half; sN += 2) {
        const j = (o.up + sN + N) % N;
        const c = this.center[j], n = this.nrm[j];
        for (const side of [1, -1]) {
          const rail = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.1, 2 * this.segLen + 0.4), stone);
          rail.position.set(c.x + n.x * 10.2 * side, c.y + 0.45, c.z + n.z * 10.2 * side);
          rail.rotation.y = this.headingAt(j);
          g.add(rail);
          if (sN % 6 === 0) {
            this.solids.push({ x: rail.position.x, z: rail.position.z, r: 1.2,
              y: c.y + 0.6, mat: 'stone' });
          }
        }
        if (Math.abs(sN) % 8 === 0) {
          const ground = this.terrainHeight(c.x, c.z);
          if (c.y - ground > 2.5) {
            const pier = new THREE.Mesh(new THREE.BoxGeometry(2.6, c.y - ground + 1, 3.4), stone);
            pier.position.set(c.x, (c.y + ground) / 2 - 0.4, c.z);
            pier.rotation.y = this.headingAt(j);
            g.add(pier);
          }
        }
      }
      g.traverse((m) => { m.castShadow = true; });
      this.group.add(g);
    }
  }

  /** VINEYARD PARCELS: one contour, many parallel rows.
   *
   *  Three earlier cuts, three lessons. A single rigid box per row floated
   *  its ends over any slope. Short straight panels drape correctly but read
   *  as rectangular patches, where the reference is a hillside combed by long
   *  curves. Letting every row walk its OWN contour gave curves, but rows walk
   *  independently: on real ground they fan apart, converge and braid, which
   *  looks like hoses dropped on the grass, not planting.
   *
   *  So a parcel now walks ONE master contour - stepping SEG at a time along
   *  the local fall line's perpendicular, re-read each step, never doubling
   *  back - and every row is that master path OFFSET sideways along its
   *  normals. Parallel BY CONSTRUCTION: rows cannot converge, cannot cross,
   *  and the whole block bends together the way a planted hillside does. The
   *  one thing an offset curve can do is fold through the inside of a tight
   *  bend, and a folded segment is simply dropped.
   *
   *  Panels are short, sample their own ground, and pitch to the local grade
   *  about their WIDTH axis - a rotation about the length axis instead would
   *  roll the row onto its side, which stood the tilled strip up as a wall.
   *  Dressing: tilled soil under each row, trellis posts proud of the canopy,
   *  per-panel height jitter for a ragged top line, hue drift. Three draw
   *  calls for the whole wine country. */
  _buildVineRows() {
    const V = this.T.vineRows;
    const blocks = V.count ?? 20;
    const ROWS_MAX = 16, STEPS_MAX = 15, SEG = 2.7, SPACING = 2.9;
    const CLEAR = ROAD_HALF + 5.5;                 // no vine reaches the verge
    const CAP = blocks * ROWS_MAX * (STEPS_MAX * 2 + 1);
    const unit = new THREE.BoxGeometry(1, 1, 1);
    unit.translate(0, 0.5, 0);
    const vines = new THREE.InstancedMesh(unit,
      new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true, roughness: 1 }), CAP);
    const soil = new THREE.InstancedMesh(unit.clone(),
      new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true, roughness: 1 }), CAP);
    const postGeo = new THREE.BoxGeometry(0.2, 1, 0.2);
    postGeo.translate(0, 0.5, 0);
    const posts = new THREE.InstancedMesh(postGeo,
      new THREE.MeshStandardMaterial({ color: 0x7a5836, roughness: 1 }),
      Math.ceil(CAP / 3) + blocks);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
    const eul = new THREE.Euler(0, 0, 0, 'YXZ');
    const up = new THREE.Vector3(0, 1, 0);
    const pos = new THREE.Vector3(), scl = new THREE.Vector3(), col = new THREE.Color();
    let vk = 0, sk = 0, pk = 0;
    // Parcels are kept apart at PARCEL scale. Testing every panel against a
    // shared grid punched holes through the middle of otherwise good rows,
    // and a vineyard with gaps in its rows reads as damaged, not as planted.
    const planted = [];

    // downhill unit vector at (x,z), or null where the land is effectively flat
    const fall = (x, z) => {
      const gx = this.terrainHeight(x + 7, z) - this.terrainHeight(x - 7, z);
      const gz = this.terrainHeight(x, z + 7) - this.terrainHeight(x, z - 7);
      const m = Math.hypot(gx, gz);
      return m < 0.5 ? null : { x: gx / m, z: gz / m };
    };

    // NB the rejection lives in the position generator, not in the placer:
    // _scatter counts a placer that bails as a parcel spent, so rejecting
    // overlaps there quietly thinned the wine country by two thirds.
    const seedPos = () => {
      const q = this._trackSidePos(26, 95);
      if (!q) return null;
      for (const c of planted) {
        if (Math.hypot(c[0] - q.x, c[1] - q.z) < 52) return null;
      }
      return q;
    };
    this._scatter(blocks, seedPos, (p) => {
      const h0 = this.terrainHeight(p.x, p.z);
      for (const [ox, oz] of [[11, 0], [-11, 0], [0, 11], [0, -11]]) {
        if (Math.abs(this.terrainHeight(p.x + ox, p.z + oz) - h0) > 3.4) return;
      }
      const rows = 9 + (Math.random() * (ROWS_MAX - 8) | 0);
      const steps = 7 + (Math.random() * (STEPS_MAX - 8) | 0);
      const halfW = ((rows - 1) / 2) * SPACING;      // how far the block reaches out
      // flat ground has no contour to follow: hold one estate heading instead
      const seedFall = fall(p.x, p.z);
      const est = Math.sin(Math.floor(p.x / 140) * 12.9898 + Math.floor(p.z / 140) * 78.233) * 43758.5453;
      const flatYaw = (est - Math.floor(est)) * Math.PI;
      const sd = seedFall || { x: Math.cos(flatYaw), z: Math.sin(flatYaw) };

      // ---- the master contour, walked out of the seed in both directions
      const walk = (way) => {
        const acc = [];
        let cx = p.x, cz = p.z;
        let dirx = -sd.z * way, dirz = sd.x * way;
        for (let s = 0; s < steps; s++) {
          const f = fall(cx, cz);
          if (f) {
            let nx = -f.z, nz = f.x;
            if (nx * dirx + nz * dirz < 0) { nx = -nx; nz = -nz; }
            dirx += (nx - dirx) * 0.5;                  // ease the turn
            dirz += (nz - dirz) * 0.5;
            const m = Math.hypot(dirx, dirz) || 1;
            dirx /= m; dirz /= m;
          }
          cx += dirx * SEG; cz += dirz * SEG;
          // the whole BLOCK has to clear the road, not just its middle
          if (this._distToTrack(cx, cz) < CLEAR + halfW) break;
          acc.push([cx, cz]);
        }
        return acc;
      };
      const back = walk(-1).reverse();
      const path = back.concat([[p.x, p.z]], walk(1));
      if (path.length < 4) return;

      // per-point normals, from the local tangent
      const nx = [], nz = [];
      for (let i = 0; i < path.length; i++) {
        const a = path[Math.max(0, i - 1)], b = path[Math.min(path.length - 1, i + 1)];
        const tx = b[0] - a[0], tz = b[1] - a[1];
        const m = Math.hypot(tx, tz) || 1;
        nx.push(-tz / m); nz.push(tx / m);
      }

      const hue = 0.245 + Math.random() * 0.045;                   // parcel varietal
      let any = 0;
      for (let r = 0; r < rows; r++) {
        const off = (r - (rows - 1) / 2) * SPACING;
        const sat = 0.5 + Math.random() * 0.14, lum = 0.17 + Math.random() * 0.06;
        for (let i = 0; i + 1 < path.length && vk < CAP; i++) {
          const ax = path[i][0] + nx[i] * off, az = path[i][1] + nz[i] * off;
          const ex = path[i + 1][0] + nx[i + 1] * off, ez = path[i + 1][1] + nz[i + 1] * off;
          const len = Math.hypot(ex - ax, ez - az);
          if (len < SEG * 0.4) continue;              // folded through a tight bend
          const mx = (ax + ex) / 2, mz = (az + ez) / 2;
          if (this._distToTrack(mx, mz) < CLEAR) continue;
          const ya = this.terrainHeight(ax, az), yb = this.terrainHeight(ex, ez);
          if (Math.abs(yb - ya) > 1.8) break;         // the land breaks: END the row
          const gy = Math.min((ya + yb) / 2, this.terrainHeight(mx, mz) + 0.3);
          // rows run along local Z, so the grade turns about local X. About Z
          // it would ROLL the row onto its side.
          eul.set(-Math.atan2(yb - ya, len), Math.atan2(ex - ax, ez - az), 0);
          q.setFromEuler(eul);
          m4.compose(pos.set(mx, gy - 0.02, mz), q, scl.set(SPACING * 0.99, 0.07, len * 1.06));
          soil.setMatrixAt(sk, m4);
          col.setHSL(0.072, 0.36, 0.19 + Math.random() * 0.05);
          soil.setColorAt(sk++, col);
          const ch = 1.0 + Math.random() * 0.3;
          m4.compose(pos.set(mx, gy + 0.44, mz), q, scl.set(1.15, ch, len * 1.04));
          vines.setMatrixAt(vk, m4);
          col.setHSL(hue + (Math.random() - 0.5) * 0.02, sat, lum + (Math.random() - 0.5) * 0.05);
          vines.setColorAt(vk++, col);
          // CRASHABLE. A trellis panel is wire and leaf, not masonry: it goes
          // through the same material law as a sapling, so at pace you plough a
          // gap through the row and the panels fly off, and at a crawl the row
          // shoulders you back. Registered per panel, so the gap you carve is
          // the width of the car, not the whole block.
          this.trees.push({
            x: mx, z: mz, y: gy, r: 1.0, id: vk - 1, parts: [vines],
            kind: 'vine', s: 0.7, solid: false,
          });
          if (i % 3 === 0 && pk < posts.count) {
            m4.compose(pos.set(ax, ya, az), q.setFromAxisAngle(up, 0),
              scl.set(1, 1.8 + Math.random() * 0.22, 1));
            posts.setMatrixAt(pk++, m4);
          }
          any++;
        }
      }
      if (any) { planted.push([p.x, p.z]); this._addShadow(p.x, p.z, 9); }
    });
    vines.count = vk;
    soil.count = sk;
    posts.count = pk;
    vines.name = 'vine-canopy';
    soil.name = 'vine-soil';
    posts.name = 'vine-posts';
    vines.castShadow = posts.castShadow = true;
    soil.receiveShadow = true;
    if (vines.instanceColor) vines.instanceColor.needsUpdate = true;
    if (soil.instanceColor) soil.instanceColor.needsUpdate = true;
    this.group.add(vines, soil, posts);
  }

  /** TUNNELS: rock galleries where the road runs through a deep cutting.
   *  Detection is honest - a stretch only tunnels if the ground already
   *  stands well above the roadway on BOTH sides - so flat worlds carrying
   *  the flag simply build none. One DoubleSide sweep is both bore and
   *  hillside shell; flared portal rings finish the mouths; wall solids stop
   *  cars phasing out; a lamp strip runs under the crown. */
  _buildTunnels() {
    for (const T of this._tunnels) this._buildTunnel(T.s, T.e);
  }

  _buildTunnel(s0, e0) {
    const HW = TUNNEL_HW, WALL = 4.6, APEX = TUNNEL_APEX;
    const PROF = [
      [-HW, 0], [-HW, WALL], [-HW * 0.55, APEX], [0, APEX + 0.5],
      [HW * 0.55, APEX], [HW, WALL], [HW, 0],
    ];
    const STEP = 2;
    const rings = [];
    // flared mouths: one extra ring past each portal, profile widened
    for (let j = s0 - STEP; j <= e0 + STEP; j += STEP) {
      const i = ((j % N) + N) % N;
      const flare = (j < s0 || j > e0) ? 1.16 : 1.0;
      const c = this.center[i], n = this.nrm[i];
      const y = this.groundHeightAt(i, 0);
      rings.push(PROF.map(([lat, up]) => [
        c.x + n.x * lat * flare, y + up * flare, c.z + n.z * lat * flare,
      ]));
    }
    const P = PROF.length;
    const pos = new Float32Array(rings.length * P * 3);
    rings.flat().forEach((v, k) => { pos[k * 3] = v[0]; pos[k * 3 + 1] = v[1]; pos[k * 3 + 2] = v[2]; });
    const idx = [];
    for (let r = 0; r < rings.length - 1; r++) {
      for (let q = 0; q < P - 1; q++) {
        const a = r * P + q, b = a + 1, c2 = a + P, d = c2 + 1;
        idx.push(a, c2, b, b, c2, d);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    const bore = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
      color: this.T.terrainScree ? new THREE.Color(this.T.terrainScree).multiplyScalar(0.72)
        : 0x55504a,
      roughness: 1, flatShading: true, side: THREE.DoubleSide,
      emissive: 0x2b2620,
    }));
    bore.name = 'tunnel';
    bore.castShadow = bore.receiveShadow = true;
    this.group.add(bore);
    // lamp strip under the crown + wall solids every few metres
    const span = Math.floor((e0 - s0) / STEP);
    const lampGeo = new THREE.BoxGeometry(2.6, 0.26, 0.5);
    const nLamp = Math.ceil(span / 3) + 1;
    const lamps = new THREE.InstancedMesh(
      lampGeo, new THREE.MeshBasicMaterial({ color: 0xffe6bc }), nLamp);
    // No real lights in here: a bore lit by three PointLights costs every
    // material in the world a recompile, and this game runs on phones. The
    // lamps are emissive bars and each one drops a warm pool on the roadway,
    // which is what actually makes the tunnel read as lit rather than as a
    // black hole with a bright dot in it.
    const poolTex = Track._tunnelPoolTex || (Track._tunnelPoolTex = (() => {
      const cv = document.createElement('canvas');
      cv.width = cv.height = 64;
      const cx2 = cv.getContext('2d');
      const rg = cx2.createRadialGradient(32, 32, 1, 32, 32, 31);
      rg.addColorStop(0, 'rgba(255,220,168,0.95)');
      rg.addColorStop(0.34, 'rgba(255,198,132,0.32)');
      rg.addColorStop(0.72, 'rgba(255,186,116,0.07)');
      rg.addColorStop(1, 'rgba(255,180,110,0)');
      cx2.fillStyle = rg;
      cx2.fillRect(0, 0, 64, 64);
      return new THREE.CanvasTexture(cv);
    })());
    const poolGeo = new THREE.PlaneGeometry(17, 20);
    poolGeo.rotateX(-Math.PI / 2);
    const pools = new THREE.InstancedMesh(poolGeo, new THREE.MeshBasicMaterial({
      map: poolTex, transparent: true, blending: THREE.AdditiveBlending,
      depthWrite: false, opacity: 0.8, fog: false,
    }), nLamp);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
    let lk = 0, qk = 0;
    for (let j = s0 + 2; j < e0; j += STEP * 3) {
      const i = j % N;
      const c = this.center[i];
      q.setFromAxisAngle(up, this.headingAt(i));
      const road = this.groundHeightAt(i, 0);
      m4.compose(new THREE.Vector3(c.x, road + APEX - 0.4, c.z), q,
        new THREE.Vector3(1, 1, 1));
      if (lk < lamps.count) lamps.setMatrixAt(lk++, m4);
      m4.compose(new THREE.Vector3(c.x, road + 0.16, c.z), q, new THREE.Vector3(1, 1, 1));
      if (qk < pools.count) pools.setMatrixAt(qk++, m4);
    }
    lamps.count = lk;
    pools.count = qk;
    lamps.name = 'tunnel-lamps';
    pools.name = 'tunnel-lightpool';
    pools.renderOrder = 2;
    this.group.add(lamps, pools);
    for (let j = s0; j <= e0; j += 1) {
      const i = j % N;
      const c = this.center[i], n = this.nrm[i];
      for (const side of [1, -1]) {
        this.solids.push({
          x: c.x + n.x * (HW - 0.5) * side, z: c.z + n.z * (HW - 0.5) * side,
          r: 1.4, y: this.groundHeightAt(i, 0) + 1, mat: 'stone',
        });
      }
    }
  }

  /** Queue a baked contact shadow under an object. r is the DECAL radius in
   *  world units (≈1.3× the object footprint). Pass y for objects sitting on
   *  the road/cliff (quad stays flat there); omit it for terrain objects —
   *  the decal then samples terrainHeight and tilts to the local slope. */
  _addShadow(x, z, r, y = null) {
    this._shadows.push({ x, z, r, y });
  }

  /** One InstancedMesh of soft dark radial decals hugging the ground under
   *  every tree / big rock / hut / obstacle / prop — the cheapest possible
   *  fake ambient occlusion, and the thing that visually glues the props to
   *  the terrain. Build-time only; a single extra draw call per world. */
  _buildContactShadows() {
    const specs = this._shadows;
    if (!specs.length) return;
    const geo = new THREE.PlaneGeometry(2, 2);       // scale r → radius r
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({
      map: contactShadowTexture(), transparent: true, opacity: 0.4,
      depthWrite: false,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    });
    const mesh = new THREE.InstancedMesh(geo, mat, specs.length);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0), nrm = new THREE.Vector3();
    const pos = new THREE.Vector3(), scl = new THREE.Vector3();
    let k = 0;
    for (const s of specs) {
      let y = s.y;
      if (y === null) {
        y = this.terrainHeight(s.x, s.z);
        // conform to the local ground slope (finite differences, build-time)
        const e = Math.max(1.0, s.r * 0.6);
        const hx = this.terrainHeight(s.x + e, s.z) - this.terrainHeight(s.x - e, s.z);
        const hz = this.terrainHeight(s.x, s.z + e) - this.terrainHeight(s.x, s.z - e);
        nrm.set(-hx / (2 * e), 1, -hz / (2 * e)).normalize();
        q.setFromUnitVectors(up, nrm);
      } else {
        q.identity();
      }
      m4.compose(pos.set(s.x, y + 0.07, s.z), q, scl.set(s.r, 1, s.r));
      mesh.setMatrixAt(k++, m4);
    }
    mesh.renderOrder = 1;
    mesh.name = 'contact-shadows';
    this.group.add(mesh);
  }

  // ---------- world elements (farms, chapels, outposts, fences) ----------

  /** Is (x, z) flat enough (± `tol` over a `r` radius) to build on, and clear
   *  of everything already standing there? */
  _buildableSpot(x, z, r, tol = 2.2) {
    // NOT IN THE WATER, AND NOT ON THE QUAY. This gate is the one place every
    // village building passes through, and it only ever knew about the sea -
    // so a farmhouse could land on a river bank or, on a harbour world, on the
    // open stone between the seafront road and the water, which is the one
    // view that whole world is built around. Measured by looking: a red-roofed
    // house standing on the beach at HARBOR QUAY.
    if (this._inWater(x, z)) return false;
    if (this._onQuayStrip(x, z)) return false;
    const h = this.terrainHeight(x, z);
    for (const [dx, dz] of [[r, 0], [-r, 0], [0, r], [0, -r],
      [r * 0.7, r * 0.7], [-r * 0.7, -r * 0.7], [r * 0.7, -r * 0.7], [-r * 0.7, r * 0.7]]) {
      if (Math.abs(this.terrainHeight(x + dx, z + dz) - h) > tol) return false;
    }
    for (const s of this.solids) {
      const dx = s.x - x, dz = s.z - z, rr = r + s.r + 2;
      if (dx * dx + dz * dz < rr * rr) return false;
    }
    for (const t of this.trees) {
      const dx = t.x - x, dz = t.z - z, rr = r + 2.5;
      if (dx * dx + dz * dz < rr * rr) return false;
    }
    return true;
  }

  /** One structure. Pushes its parts into the instancing buckets `B`, adds the
   *  SOLID collider + contact shadow, and returns its footprint radius. */
  /** Stamp one HOUSE_TEMPLATE into the shared part batches at a world
   *  position, in a theme's colours. This is the ONLY place a structure gets
   *  built: the shapes live in the table above, the base anchoring lives in
   *  `_realizeElements`, and every builder that wants a building comes through
   *  here. That is the point — see the header on HOUSE_TEMPLATES for the two
   *  independent copies of the same roof bug that made it necessary. */
  _element(B, type, x, z, rot, K, scale = 1, yOverride = null) {
    // == null catches undefined too - a caller passing undefined must not NaN
    const y = (yOverride == null ? this.terrainHeight(x, z) : yOverride) - 0.25;
    const cs = Math.cos(rot), sn = Math.sin(rot);
    const T = HOUSE_TEMPLATES[type] ?? HOUSE_TEMPLATES.logpile;
    // NO TWO ALIKE: each placement gets its own footprint stretch, height,
    // mirror and weathering shade, so the shared templates stop reading as
    // copy-paste rows of one house. The solid follows the stretched print.
    const wS = 0.86 + Math.random() * 0.34;
    const dS = 0.86 + Math.random() * 0.34;
    const hS = 0.88 + Math.random() * 0.34;
    const mir = Math.random() < 0.5 ? -1 : 1;
    const shade = 0.9 + Math.random() * 0.2;
    const tinted = (c) => {
      const col = new THREE.Color(c);
      col.multiplyScalar(shade);
      return col.getHex();
    };
    // A STREET IS MANY COLOURS. Every kit carried ONE wall tone, so a terrace
    // came out as one colour repeated however much the footprints varied -
    // which is exactly what a Mediterranean harbour is NOT. A kit may now
    // carry `palette` (wall colours) and `roofs` (tile colours); each house
    // draws its own from them, and the second wall tone is derived from the
    // one it drew so trim and render still belong to the same building.
    const pick = (list) => (list && list.length)
      ? list[(Math.random() * list.length) | 0] : null;
    const wallC = pick(K.palette), roofC = pick(K.roofs);
    const slot = (key) => {
      if (key === 'wall' && wallC !== null) return wallC;
      if (key === 'wall2' && wallC !== null) {
        return new THREE.Color(wallC).multiplyScalar(0.86).getHex();
      }
      if (key === 'roof' && roofC !== null) return roofC;
      return K[key];
    };
    for (const [kind, dx, dy, dz, sx, sy, sz, colKey, roll = 0] of T.parts) {
      const ox = dx * scale * wS, oy = dy * scale * hS, oz = dz * scale * dS * mir;
      B[kind].push({
        x: x + ox * cs - oz * sn, y: y + oy, z: z + ox * sn + oz * cs,
        sx: sx * scale * wS, sy: sy * scale * hS, sz: sz * scale * dS,
        rot, roll: roll * mir,
        // a string names a slot in the theme kit (weather-shaded per house);
        // a number is a literal that must not be re-tinted (the chapel cross)
        color: typeof colKey === 'string' ? tinted(slot(colKey)) : colKey,
      });
    }
    const r = T.r * scale * Math.max(wS, dS), mat = T.mat ?? 'hut';
    const solid = { x, z, r, y: y + 0.6, mat };
    this.solids.push(solid);
    this._addShadow(x, z, r * 1.35);
    return { r, solid, y };
  }

  /** Current fill level of each part bucket — bracket an `_element` call with
   *  two of these and the difference is exactly that structure's slots. */
  _batchLens(B) {
    const o = {};
    for (const k of Object.keys(B)) o[k] = B[k].length;
    return o;
  }

  /** Everything the world is dressed with beyond the road: farmsteads and
   *  outposts (SOLID), field walls (SOLID stone), and BREAKABLE rail fences,
   *  troughs, feed bins and hay racks out in the fields. All the rigid parts
   *  land in five InstancedMeshes; the breakables become this.props entries so
   *  the existing smash/weapon paths handle them with no new systems. */
  _buildWorldElements(m4) {
    const kitName = this.T.elements
      || ELEMENT_KIT_BY_THEME[this.level && this.level.theme] || 'farm';
    const K = ELEMENT_KITS[kitName];
    // Flush regardless: the huts and road cabins have already written into the
    // shared batch by now, so an early return here would leave every building
    // in the world without a mesh.
    if (!K) { this._realizeElements(this._elemB(), m4); return; }
    // breakable field dressing this kit uses (livestock gear by default)
    const FIELD = K.field ?? ['trough', 'feedbin', 'hayrack'];
    const B = this._elemB();

    // --- pick 3 farmstead / outpost sites well off the racing line ---
    const sites = [];
    for (let s = 0; s < 3; s++) {
      for (let tries = 0; tries < 40; tries++) {
        const p = this._trackSidePos(34, 108);
        if (!p) continue;
        if (sites.some((q) => (q.x - p.x) ** 2 + (q.z - p.z) ** 2 < 90 * 90)) continue;
        if (!this._buildableSpot(p.x, p.z, 16, 2.6)) continue;
        sites.push({ x: p.x, z: p.z, rot: Math.random() * Math.PI * 2 });
        break;
      }
    }
    const pastures = [];
    for (const site of sites) {
      const cs = Math.cos(site.rot), sn = Math.sin(site.rot);
      const at = (dx, dz) => ({ x: site.x + dx * cs - dz * sn, z: site.z + dx * sn + dz * cs });
      // main building + two outbuildings around a yard
      const layout = [[0, 0, K.builds[0]], [-17, 9, K.builds[1 % K.builds.length]],
        [13, 13, K.builds[2 % K.builds.length]]];
      for (const [dx, dz, type] of layout) {
        const p = at(dx, dz);
        if (!this._buildableSpot(p.x, p.z, 8, 3.2)) continue;
        this._element(B, type, p.x, p.z, site.rot + (Math.random() - 0.5) * 0.7, K);
      }
      const dp = at(-4, 16);
      if (this._buildableSpot(dp.x, dp.z, 4, 3.0)) {
        this._element(B, K.dress[(Math.random() * K.dress.length) | 0], dp.x, dp.z,
          Math.random() * Math.PI * 2, K);
      }
      // paddock: a rail fence run along the open side, with the grazing ground
      // it encloses handed to the animal system as a pasture
      const pd = at(-6, 34);
      this._fenceRun(pd.x, pd.z, site.rot + Math.PI / 2, 6, K);
      if (this._buildableSpot(pd.x, pd.z, 12, 3.0)) pastures.push({ x: pd.x, z: pd.z, r: 13 });
      // trough / feed bin / hay rack in the paddock (kits without livestock —
      // the city — declare `field: []` and get none)
      const fp = at(-14, 30);
      if (FIELD.length) {
        this._fieldProp(fp.x, fp.z, Math.random() * Math.PI * 2,
          FIELD[(Math.random() * FIELD.length) | 0], K);
      }
    }

    // --- two landmarks somewhere else on the lap (chapel / silo / tower) ---
    for (const type of K.landmarks) {
      for (let tries = 0; tries < 30; tries++) {
        const p = this._trackSidePos(30, 130);
        if (!p || !this._buildableSpot(p.x, p.z, 9, 2.6)) continue;
        this._element(B, type, p.x, p.z, Math.random() * Math.PI * 2, K);
        break;
      }
    }

    // --- THE RUIN ON THE RIM. A canyon needs a destination, and the
    // reference gives it one: a broken pueblo standing against the sky. On
    // cliff worlds it goes on the RIM PLATEAU - the deterministic profile is
    // queried for the tallest wall section clear of the start gap, and the
    // ruin sits at rim height on the flat row of the ribbon, unreachable and
    // silhouetted. On open desert worlds it crowns the highest buildable
    // ground in the 60-140 u band instead.
    if (K.ruin) {
      if (this.T.cliffWalls) {
        let best = null;
        for (let c = 0; c < 24; c++) {
          const i = (Math.random() * N) | 0;
          if (this._circDist(i, 0) < 85) continue;
          const side = Math.random() < 0.5 ? 1 : -1;
          const prof = this._cliffProfile(i, side);
          if (!best || prof.h > best.h) best = { i, side, ...prof };
        }
        if (best && best.h > 10) {
          const lat = best.side * (best.base + best.l2 + 6.5);
          const p = this.pointAt(best.i, lat);
          const rimY = this.center[best.i].y + best.h * 0.97 - 0.3;
          this._element(B, K.ruin, p.x, p.z,
            this.headingAt(best.i) + Math.PI / 2, K, 1.2, rimY);
        }
      } else {
        let best = null;
        for (let c = 0; c < 24; c++) {
          const p = this._trackSidePos(60, 140);
          if (!p || !this._buildableSpot(p.x, p.z, 11, 4.5)) continue;
          const h = this.terrainHeight(p.x, p.z);
          if (!best || h > best.h) best = { p, h };
        }
        if (best) {
          this._element(B, K.ruin, best.p.x, best.p.z,
            Math.random() * Math.PI * 2, K, 1.35);
        }
      }
    }

    // --- field walls: dry-stone boundaries running across open country ---
    for (let w = 0; w < (K.stoneWalls || 0); w++) {
      for (let tries = 0; tries < 24; tries++) {
        const p = this._trackSidePos(30, 130);
        if (!p || !this._buildableSpot(p.x, p.z, 8, 3.0)) continue;
        this._stoneWallRun(B, p.x, p.z, Math.random() * Math.PI * 2, 6 + ((Math.random() * 5) | 0), K);
        break;
      }
    }

    // --- standalone fence runs + field dressing out in the open ---
    for (let f = 0, nf = K.fenceRuns ?? 2; f < nf; f++) {
      const p = this._trackSidePos(26, 120);
      if (p && this._buildableSpot(p.x, p.z, 10, 3.2)) {
        this._fenceRun(p.x, p.z, Math.random() * Math.PI * 2, 5, K);
      }
    }
    for (let d = 0; d < 3 && FIELD.length; d++) {
      const p = this._trackSidePos(22, 110);
      if (p) {
        this._fieldProp(p.x, p.z, Math.random() * Math.PI * 2,
          FIELD[(Math.random() * FIELD.length) | 0], K);
      }
    }

    this._sitePastures = pastures;
    this._realizeElements(B, m4);
  }

  /** The ONE part batch every structure in the world feeds into.
   *
   *  Was three separate batches realized at three different times — the
   *  farmsteads, the road cabins, and (after this change) the scattered
   *  cottages — which meant three copies of the same five InstancedMeshes and
   *  fifteen draw calls where five will do. Sharing it is also what lets a
   *  builder register a DESTRUCTIBLE before the meshes exist: it records the
   *  bucket and slot it wrote into, and `_realizeElements` resolves those to
   *  real meshes once, at the end. */
  _elemB() {
    if (!this._elemBatch) this._elemBatch = { wall: [], box: [], cyl: [], cone: [], prism: [] };
    return this._elemBatch;
  }

  /** Note the slots a structure occupies so it can be shot down later. Called
   *  with the batch lengths captured BEFORE and AFTER an `_element` stamp. */
  _registerElementBuilding(meta, before, after) {
    const slots = [];
    for (const key of Object.keys(after)) {
      for (let i = before[key]; i < after[key]; i++) slots.push([key, i]);
    }
    (this._pendingBuildings ??= []).push({ ...meta, slots });
  }

  /** Turn the five part buckets into five InstancedMeshes (one draw call each
   *  for every building in the world). */
  _realizeElements(B, m4) {
    const gWall = new THREE.BoxGeometry(1, 1, 1); gWall.translate(0, 0.5, 0);
    const gBox = new THREE.BoxGeometry(1, 1, 1); gBox.translate(0, 0.5, 0);
    const gCyl = new THREE.CylinderGeometry(0.5, 0.5, 1, 10); gCyl.translate(0, 0.5, 0);
    const gCone = new THREE.ConeGeometry(0.5, 1, 10); gCone.translate(0, 0.5, 0);
    const specs = [
      // The emissive window map came across from `_buildHuts` when the
      // cottages moved onto the shared templates. It is not a port for its own
      // sake: without it the scattered dwellings lost their lit panes, and
      // WITH it every farmhouse, chapel and kiosk in the game gained them.
      ['wall', gWall, new THREE.MeshStandardMaterial({
        map: buildingTexture(), roughness: 0.85, envMapIntensity: 0.45,
        emissive: 0xffffff, emissiveMap: buildingGlowTexture(),
        emissiveIntensity: this.T.hutGlow !== undefined ? this.T.hutGlow : 0.5,
      })],
      ['box', gBox, new THREE.MeshStandardMaterial({ roughness: 0.9, envMapIntensity: 0.4 })],
      ['cyl', gCyl, new THREE.MeshStandardMaterial({ roughness: 0.9, envMapIntensity: 0.4 })],
      ['cone', gCone, new THREE.MeshStandardMaterial({
        flatShading: true, roughness: 0.9, envMapIntensity: 0.4,
      })],
      ['prism', gablePrismGeo(), new THREE.MeshStandardMaterial({
        flatShading: true, roughness: 0.9, envMapIntensity: 0.4,
      })],
    ];
    const q = new THREE.Quaternion(), qr = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0), fwd = new THREE.Vector3(0, 0, 1);
    const col = new THREE.Color();
    for (const [key, geo, mat] of specs) {
      const list = B[key];
      if (!list.length) continue;
      const mesh = new THREE.InstancedMesh(geo, mat, list.length);
      mesh.name = 'element-' + key;
      mesh.castShadow = mesh.receiveShadow = true;
      list.forEach((p, k) => {
        q.setFromAxisAngle(up, p.rot);
        if (p.roll) q.multiply(qr.setFromAxisAngle(fwd, p.roll));
        m4.compose(new THREE.Vector3(p.x, p.y, p.z), q, new THREE.Vector3(p.sx, p.sy, p.sz));
        mesh.setMatrixAt(k, m4);
        col.set(p.color).multiplyScalar(0.92 + Math.random() * 0.16);
        mesh.setColorAt(k, col);
      });
      this.group.add(mesh);
      (this._elemMeshes ??= {})[key] = mesh;
    }
    // ONLY THE SHARED BATCH MAY RESOLVE DEFERRED BUILDINGS.
    //
    // A third caller — the log-yard dressing — still had its own local batch
    // and realized it early, part-way through the world build. That call
    // created an `element-cyl` mesh with six instances in it and nothing else,
    // then drained the pending list: every cottage registered so far was
    // handed a single part pointing at a slot that mesh did not have, and lost
    // its walls, its roof and its destructibility. Measured on FURKA RIDGE as
    // eight buildings of one part each, indices 6 and 7 into a mesh of six.
    // The log yard shares the batch now, but the guard stays: a private batch
    // must never be able to claim structures it did not build.
    if (B !== this._elemBatch) return;
    for (const b of (this._pendingBuildings ?? [])) {
      const parts = b.slots
        .map(([key, i]) => ({ mesh: this._elemMeshes[key], i }))
        .filter((pt) => pt.mesh);
      if (parts.length) this.buildings.push({ ...b, parts, slots: undefined });
    }
    this._pendingBuildings = [];
  }

  /** A dry-stone field wall: `n` instanced blocks in a line, each a small
   *  SOLID stone collider. Runs out in the fields, never along the road. */
  _stoneWallRun(B, x, z, rot, n, K) {
    const cs = Math.cos(rot), sn = Math.sin(rot);
    for (let k = 0; k < n; k++) {
      const d = (k - (n - 1) / 2) * 3.1;
      const wx = x + cs * d, wz = z + sn * d;
      const wy = this.terrainHeight(wx, wz) - 0.3;
      B.box.push({
        x: wx, y: wy, z: wz, sx: 3.2, sy: 1.15 + Math.random() * 0.3, sz: 0.85,
        rot: rot + Math.PI / 2, roll: 0, color: K.stone,
      });
      this.solids.push({ x: wx, z: wz, r: 1.3, y: wy + 0.6, mat: 'stone' });
    }
    this._addShadow(x, z, n * 1.7);
  }

  /** BREAKABLE wooden rail fence: `n` bays in a line, each its own prop entry
   *  (a car smashes through it, a missile blows it apart). Scenery only — it
   *  encloses fields and paddocks, it never lines the road. */
  _fenceRun(x, z, rot, n, K) {
    if (!this._fenceGeo) {
      this._fenceGeo = mergeBoxes([
        { w: 0.26, h: 1.6, d: 0.26, x: -2.0, y: 0.8, z: 0 },
        { w: 0.26, h: 1.6, d: 0.26, x: 2.0, y: 0.8, z: 0 },
        { w: 4.2, h: 0.18, d: 0.14, x: 0, y: 1.32, z: 0 },
        { w: 4.2, h: 0.18, d: 0.14, x: 0, y: 0.78, z: 0 },
      ]);
    }
    if (!this._fenceMat) {
      this._fenceMat = new THREE.MeshStandardMaterial({ color: K.fenceColor, roughness: 0.95 });
    }
    const cs = Math.cos(rot), sn = Math.sin(rot);
    for (let k = 0; k < n; k++) {
      const d = (k - (n - 1) / 2) * 4.2;
      const fx = x + cs * d, fz = z + sn * d;
      if (this._distToTrack(fx, fz) < 20) continue;          // never near the road
      const fy = this.terrainHeight(fx, fz) - 0.15;
      const mesh = new THREE.Mesh(this._fenceGeo, this._fenceMat);
      mesh.name = 'fence';
      mesh.position.set(fx, fy, fz);
      mesh.rotation.y = rot + Math.PI / 2;
      mesh.castShadow = true;
      this.group.add(mesh);
      this.props.push({
        mesh, x: fx, y: fy, z: fz, r: 2.1, type: 'fence', scoreValue: 30, pickup: null,
      });
      this._addShadow(fx, fz, 2.4);
    }
  }

  /** BREAKABLE farm dressing: water trough / feed bin / hay rack. One merged
   *  mesh each, registered as a prop. */
  _fieldProp(x, z, rot, type, K) {
    if (this._distToTrack(x, z) < 18) return;
    const cache = this._fieldGeos || (this._fieldGeos = {});
    if (!cache[type]) {
      cache[type] = type === 'trough'
        ? mergeBoxes([
            { w: 4.0, h: 0.25, d: 1.4, x: 0, y: 0.62, z: 0 },
            { w: 4.0, h: 0.7, d: 0.16, x: 0, y: 0.9, z: 0.62 },
            { w: 4.0, h: 0.7, d: 0.16, x: 0, y: 0.9, z: -0.62 },
            { w: 0.3, h: 0.6, d: 1.4, x: -1.7, y: 0.3, z: 0 },
            { w: 0.3, h: 0.6, d: 1.4, x: 1.7, y: 0.3, z: 0 },
          ])
        : type === 'feedbin'
          ? mergeBoxes([
              { w: 1.8, h: 1.7, d: 1.8, x: 0, y: 0.85, z: 0 },
              { w: 2.1, h: 0.22, d: 2.1, x: 0, y: 1.8, z: 0 },
              { w: 0.9, h: 0.5, d: 0.2, x: 0, y: 0.5, z: 0.9 },
            ])
          : mergeBoxes([                                       // hay rack
              { w: 0.24, h: 2.0, d: 0.24, x: -1.4, y: 1.0, z: -0.7 },
              { w: 0.24, h: 2.0, d: 0.24, x: 1.4, y: 1.0, z: -0.7 },
              { w: 0.24, h: 1.4, d: 0.24, x: -1.4, y: 0.7, z: 0.7 },
              { w: 0.24, h: 1.4, d: 0.24, x: 1.4, y: 0.7, z: 0.7 },
              { w: 3.0, h: 0.18, d: 1.7, x: 0, y: 1.5, z: 0 },
              { w: 3.0, h: 0.9, d: 0.16, x: 0, y: 1.0, z: -0.7 },
            ]);
    }
    if (!this._fieldMat) {
      this._fieldMat = new THREE.MeshStandardMaterial({ color: K.trim, roughness: 0.95 });
    }
    const y = this.terrainHeight(x, z) - 0.1;
    const mesh = new THREE.Mesh(cache[type], this._fieldMat);
    mesh.name = 'field-prop';
    mesh.position.set(x, y, z);
    mesh.rotation.y = rot;
    mesh.castShadow = true;
    this.group.add(mesh);
    this.props.push({
      mesh, x, y, z, r: type === 'trough' ? 2.2 : 1.5, type,
      scoreValue: 35, pickup: null,
    });
    this._addShadow(x, z, 2.4);
  }

  /** Decorative crossroads: short dirt side-roads that join the circuit at
   *  plausible angles (60-120°) and head off toward the farms, pastures and
   *  cabins the world is dressed with. They are TERRAIN, not track — drivable
   *  under the normal off-road rules, no colliders. Each junction gets a
   *  widened, radially-faded intersection patch over the road edge.
   *
   *  Data for the traffic agent — `track.crossroads` is an array of:
   *    index    main-road centerline sample at the junction (0..N-1)
   *    side     +1 / -1, which side of the road the spur leaves on
   *             (matches the `lateral` sign used by pointAt/nearestIndex)
   *    angle    radians between the spur and the road tangent, 0..PI
   *    len      graded length of the spur in world units (12..30)
   *    x, z     world position of the spur mouth (on the road edge)
   *    dx, dz   unit direction of the spur, pointing away from the road
   *    endX,endZ far end of the graded surface
   *    halfWidth lane half-width at the far end (the mouth flares to 5.4)
   *    y        road centerline height at the junction
   *  The first four are the canonical schema; the rest are derived
   *  conveniences (dx,dz === tan*cos(angle) + nrm*side*sin(angle)). */
  _buildCrossroads() {
    const want = Math.min(4,
      (this.T.crossroads ?? THEME_CROSSROADS[this.level && this.level.theme] ?? 0) | 0);
    if (!want) return;
    // spurs lead somewhere: pastures and farm buildings, nearest-road first
    const targets = [
      ...(this.pastures || []).map((p) => ({ x: p.x, z: p.z, r: p.r })),
      ...this.solids.filter((s) => s.mat === 'hut').map((s) => ({ x: s.x, z: s.z, r: s.r + 8 })),
    ];
    if (!targets.length) return;
    // one shared surface: the theme's own dirt palette, overlays stripped
    // (a spur is bare graded dirt whatever dresses the main carriageway)
    const spurTex = roadTexture({
      ...this.T.road, wet: null, snowCover: null, ice: null, cobbles: null, neon: null, ruts: true,
    });
    spurTex.anisotropy = 8;
    // RGBA vertex colours drive the feather: the ribbon used to be a blunt
    // rectangle that stopped dead in open grass (and from the default TOP-DOWN
    // camera that straight cut is the first thing you see). Alpha now runs to 0
    // along an outer skirt column on each side and over the last third of the
    // run, so the surface dissolves into the field instead of being cut off.
    const spurMat = new THREE.MeshStandardMaterial({
      map: spurTex, roughness: 1, vertexColors: true,
      transparent: true, depthWrite: false,
      polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3,
    });
    // junction + destination dressing, all instanced across every spur
    const dress = this._spurDressing(want);
    const patchMat = new THREE.MeshStandardMaterial({
      map: junctionTexture(this.T.road), roughness: 1, transparent: true,
      depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4,
    });
    const tmp = new THREE.Vector3();
    const MAXC = 0.5;                                  // cos 60° — junction angle cone
    const used = [];
    for (const tg of targets) {
      if (this.crossroads.length >= want) break;
      const i = this.nearestIndex(tmp.set(tg.x, 0, tg.z), null);
      if (this._circDist(i, 0) < 45) continue;               // clear of the gate
      if (this._gorge && this._nearGorge(i, this._spanSamples() + 14)) continue;
      if (used.some((u) => this._circDist(i, u) < 70)) continue;
      let mc = 0;
      for (let k = -6; k <= 6; k++) mc = Math.max(mc, this.curvature[(i + k + N) % N]);
      if (mc > 0.022) continue;                              // junctions live on straights
      const c = this.center[i], n = this.nrm[i], t = this.tan[i];
      const side = (tg.x - c.x) * n.x + (tg.z - c.z) * n.z >= 0 ? 1 : -1;
      // the approach must sit near road grade — no spurs off a shelf edge or
      // through a retaining wall / guard fence drop
      const e1 = this.pointAt(i, side * 15);
      if (Math.abs(c.y - this.terrainHeight(e1.x, e1.z)) > 2.2) continue;
      // direction toward the target, clamped into the 60-120° cone
      let dx = tg.x - c.x, dz = tg.z - c.z;
      const dl = Math.hypot(dx, dz) || 1;
      dx /= dl; dz /= dl;
      const along = dx * t.x + dz * t.z;
      let ux = dx, uz = dz;
      if (Math.abs(along) > MAXC) {
        const sa = Math.sign(along) || 1, sn2 = Math.sqrt(1 - MAXC * MAXC);
        ux = t.x * sa * MAXC + n.x * side * sn2;
        uz = t.z * sa * MAXC + n.z * side * sn2;
      }
      const len = Math.min(30, Math.max(12, dl - (tg.r || 10)));
      // never lay a spur (or its farmstead) into the river: the reach runs
      // parallel to the circuit at ~62 u, which is exactly the band the
      // pastures and huts these spurs aim at live in
      const mouth = this.pointAt(i, side * 8);
      if (this._river) {
        let wet = false;
        for (let f = 0; f <= len + 18 && !wet; f += 5) {
          if (this._riverDist(mouth.x + ux * f, mouth.z + uz * f) < 17) wet = true;
        }
        if (wet) continue;
      }
      // --- spur ribbon: starts under the road edge, conforms to the terrain ---
      const S = Math.max(4, Math.ceil(len / 3));
      const p0 = this.pointAt(i, side * 8);
      const y0 = c.y - 0.06;
      // Across the spur. This MUST match the handedness the road ribbon uses
      // (nrm = (tan.z, 0, -tan.x)) — the triangle winding below is copied from
      // _buildRoad, so flipping this normal flips the face. It was `(-uz, ux)`,
      // which made computeVertexNormals emit ny = -1: every spur was built
      // upside-down and back-face-culled away, invisible from the car and from
      // straight above even though the mesh sat correctly on the terrain.
      const px = uz, pz = -ux;
      // FOUR columns per row, not two: an outer skirt at alpha 0 on each side
      // feathers the spur into the grass, and the far end tapers AND fades.
      const COLS = 4;
      const verts = new Float32Array((S + 1) * COLS * 3);
      const uvs = new Float32Array((S + 1) * COLS * 2);
      const cols = new Float32Array((S + 1) * COLS * 4);
      const idx = [];
      const base = new THREE.Color(1, 1, 1);
      for (let s = 0; s <= S; s++) {
        const f = s / S;
        // junction flare → lane → nothing: the last third narrows to a track
        const half = (5.4 - 2.0 * f) * (1 - 0.62 * THREE.MathUtils.smoothstep(f, 0.55, 1));
        const feather = 1.1 + 0.9 * (1 - f);
        const qx = p0.x + ux * f * len, qz = p0.z + uz * f * len;
        const blend = THREE.MathUtils.smoothstep(f, 0, 0.4);
        // opaque up the graded run, gone by the end
        const aLong = 1 - THREE.MathUtils.smoothstep(f, 0.62, 1);
        for (let cI = 0; cI < COLS; cI++) {
          // columns: outer-left, left, right, outer-right
          const sl = cI < 2 ? 1 : -1;
          const outer = (cI === 0 || cI === 3);
          const off = half + (outer ? feather : 0);
          const vx = qx + px * off * sl, vz = qz + pz * off * sl;
          const ty = this._terrainMeshHeight(vx, vz) + (outer ? 0.13 : 0.22);
          const o = (s * COLS + cI) * 3;
          verts[o] = vx;
          verts[o + 1] = y0 * (1 - blend) + ty * blend;
          verts[o + 2] = vz;
          const u = (s * COLS + cI) * 2;
          uvs[u] = outer ? (sl > 0 ? -0.12 : 1.12) : (sl > 0 ? 0 : 1);
          uvs[u + 1] = (f * len) / 10;
          const cq = (s * COLS + cI) * 4;
          cols[cq] = base.r; cols[cq + 1] = base.g; cols[cq + 2] = base.b;
          cols[cq + 3] = aLong * (outer ? 0 : 1);
        }
      }
      for (let s = 0; s < S; s++) {
        for (let cI = 0; cI < COLS - 1; cI++) {
          const a = s * COLS + cI, b = a + 1;
          const d = (s + 1) * COLS + cI, e = d + 1;
          idx.push(a, b, d, b, e, d);
        }
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
      geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
      geo.setAttribute('color', new THREE.BufferAttribute(cols, 4));
      geo.setIndex(idx);
      geo.computeVertexNormals();
      const spur = new THREE.Mesh(geo, spurMat);
      spur.name = 'crossroad-spur';
      spur.receiveShadow = true;
      this.group.add(spur);
      // --- widened intersection patch straddling the road edge ---
      const pc = this.pointAt(i, side * 9.5);
      const patch = new THREE.Mesh(this._patchGeo || (this._patchGeo = (() => {
        const pg = new THREE.PlaneGeometry(17, 17);
        pg.rotateX(-Math.PI / 2);
        return pg;
      })()), patchMat);
      patch.name = 'crossroad-patch';
      patch.position.set(pc.x, c.y + 0.05, pc.z);
      patch.rotation.y = Math.atan2(ux, uz);
      patch.renderOrder = 2;
      patch.receiveShadow = true;
      this.group.add(patch);
      used.push(i);
      dress.place(p0, ux, uz, px, pz, len, c.y, tg);
      // Traffic-agent contract (see the doc comment above): the four required
      // fields plus a ready-made world-space ray so a router never has to redo
      // the cone maths. u = tan*cos(angle) + nrm*side*sin(angle) reconstructs
      // (dx, dz) exactly from {index, side, angle} if only those are wanted.
      this.crossroads.push({
        index: i, side, angle: Math.acos(THREE.MathUtils.clamp(ux * t.x + uz * t.z, -1, 1)), len,
        x: p0.x, z: p0.z,                                    // mouth, on the road edge
        dx: ux, dz: uz,                                      // unit direction away from the road
        endX: p0.x + ux * len, endZ: p0.z + uz * len,        // far end of the graded spur
        halfWidth: 3.4,                                      // lane half-width at the far end
        y: c.y,                                              // road height at the junction
      });
    }
    dress.finish();
  }

  /** Junction + destination dressing for the crossroad spurs.
   *
   *  A graded strip running into empty grass reads as unfinished geometry, so
   *  every spur now gets (a) a mouth you can recognise as a gateway — two gate
   *  posts, an open five-bar gate leaf and a short post-and-rail fence flanking
   *  the first stretch — and (b) a VISIBLE DESTINATION at the far end: a
   *  farmstead of barn + silo + feed trough, so from the junction it is obvious
   *  the track goes somewhere.
   *
   *  COST: eight InstancedMeshes total for the whole level regardless of how
   *  many junctions there are (`want` ≤ 4), i.e. 8 extra draw calls and ~1.4 k
   *  triangles. Everything reuses box/cylinder/cone primitives that are already
   *  in the level's geometry set.
   *
   *  SOLIDITY (RULES §1): the barn and silo push out as 'hut'; gate posts and
   *  fence rails join the SOLID fence family. Nothing here is ghost scenery. */
  _spurDressing(want) {
    const T = this.T;
    const q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), v3 = new THREE.Vector3();
    const m4 = new THREE.Matrix4();
    const mk = (geo, mat, n, cast = true) => {
      const im = new THREE.InstancedMesh(geo, mat, Math.max(1, n));
      im.castShadow = cast; im.receiveShadow = true; im.count = 0;
      return im;
    };
    const box = new THREE.BoxGeometry(1, 1, 1); box.translate(0, 0.5, 0);
    const cyl = new THREE.CylinderGeometry(1, 1, 1, 8); cyl.translate(0, 0.5, 0);
    const cone = new THREE.ConeGeometry(1, 1, 8); cone.translate(0, 0.5, 0);
    // The three above are base-anchored by `translate(0, 0.5, 0)`; this one is
    // the only one that also needed a rotateY, and it is the only one that lost
    // its translate — so every barn had HALF ITS ROOF inside the hayloft and
    // showed a flat lid, the same defect as `_buildHuts` from the same cause.
    // Found by tests/test-buildings.mjs on the first run after that fix, which
    // is the whole argument for asserting the geometric property rather than
    // patching the builder that happened to be reported.
    const roof = new THREE.ConeGeometry(0.86, 0.5, 4);
    roof.rotateY(Math.PI / 4);
    roof.translate(0, 0.25, 0);
    const timber = new THREE.MeshStandardMaterial({
      color: 0x6b4a2a, flatShading: true, roughness: 0.95,
    });
    const wallMat = new THREE.MeshStandardMaterial({
      map: buildingTexture(), roughness: 0.85, envMapIntensity: 0.4,
      emissive: 0xffffff, emissiveMap: buildingGlowTexture(),
      emissiveIntensity: T.hutGlow !== undefined ? T.hutGlow : 0.45,
    });
    const roofMat = new THREE.MeshStandardMaterial({
      // a shade deeper than the cottage roofs so the barn reads as its own
      // building rather than a bright plate dropped on the field
      color: new THREE.Color(T.hutRoof).multiplyScalar(0.78),
      flatShading: true, roughness: 0.85,
    });
    const siloMat = new THREE.MeshStandardMaterial({
      color: 0xc8c2b4, flatShading: true, roughness: 0.7, metalness: 0.15,
    });
    const M = {
      posts: mk(box, timber, want * 10),          // gate posts + fence posts
      rails: mk(box, timber, want * 8),           // gate leaf + post-and-rail
      barn: mk(box, wallMat, want),
      barnRoof: mk(roof, roofMat, want),
      silo: mk(cyl, siloMat, want),
      siloCap: mk(cone, roofMat, want),
      trough: mk(box, timber, want * 2),
      grid: mk(box, timber, want * 5),            // cattle-grid bars at the mouth
    };
    const push = (im, x, y, z, rot, sx, sy, sz) => {
      if (im.count >= im.instanceMatrix.count) return;
      q.setFromAxisAngle(up, rot);
      m4.compose(v3.set(x, y, z), q, new THREE.Vector3(sx, sy, sz));
      im.setMatrixAt(im.count++, m4);
    };
    return {
      /** p0 = spur mouth, (ux,uz) = along the spur, (px,pz) = across it. */
      place: (p0, ux, uz, px, pz, len, roadY, tan) => {
        const rot = Math.atan2(ux, uz);
        const gy = (x, z) => this.terrainHeight(x, z);
        // --- cattle grid: five bars laid across the mouth ---
        for (let k = 0; k < 5; k++) {
          const f = 2.0 + k * 0.85;
          const x = p0.x + ux * f, z = p0.z + uz * f;
          push(M.grid, x, roadY - 0.02, z, rot, 9.4, 0.18, 0.34);
        }
        // --- gate posts + open leaf, 6 u up the spur ---
        const gx = p0.x + ux * 6.5, gz = p0.z + uz * 6.5;
        for (const sl of [1, -1]) {
          const x = gx + px * 5.0 * sl, z = gz + pz * 5.0 * sl;
          const y = gy(x, z);
          push(M.posts, x, y - 0.2, z, rot, 0.55, 2.6, 0.55);
          this.solids.push({ x, z, r: 0.5, y, mat: 'fence' });
        }
        // the leaf swung open along the fence line, so the way in reads OPEN
        for (let k = 0; k < 3; k++) {
          const x = gx + px * 5.0 + ux * (1.4 + k * 0.0), z = gz + pz * 5.0 + uz * 1.4;
          push(M.rails, x, gy(x, z) + 0.6 + k * 0.62, z, rot + 1.15, 3.0, 0.16, 0.14);
        }
        // --- post-and-rail fence flanking the first stretch ---
        for (const sl of [1, -1]) {
          for (let k = 0; k < 3; k++) {
            const f = 10 + k * 5.5;
            const off = 5.0 + f * 0.06;
            const x = p0.x + ux * f + px * off * sl, z = p0.z + uz * f + pz * off * sl;
            const y = gy(x, z);
            push(M.posts, x, y - 0.15, z, rot, 0.36, 1.9, 0.36);
            this.solids.push({ x, z, r: 0.34, y, mat: 'fence' });
            if (k < 2) {
              const f2 = f + 2.75, off2 = 5.0 + f2 * 0.06;
              const rx = p0.x + ux * f2 + px * off2 * sl, rz = p0.z + uz * f2 + pz * off2 * sl;
              push(M.rails, rx, gy(rx, rz) + 1.15, rz, rot, 0.13, 0.16, 5.6);
            }
          }
        }
        // --- destination: barn + silo + trough, squared up at the far end ---
        const ex = p0.x + ux * (len + 15), ez = p0.z + uz * (len + 15);
        const ey = gy(ex, ez);
        const bw = 8.0, bh = 5.0;
        // instance slots have to be grabbed BEFORE the push — `push` bumps
        // im.count itself, so afterwards the index is already gone
        const bi = M.barn.count, bri = M.barnRoof.count;
        push(M.barn, ex, ey - 0.5, ez, rot + 0.22, bw, bh, bw * 0.78);
        push(M.barnRoof, ex, ey - 0.5 + bh, ez, rot + 0.22, bw * 1.22, bh * 0.8, bw * 1.02);
        const barnSolid = { x: ex, z: ez, r: bw * 0.62, y: ey, mat: 'hut' };
        this.solids.push(barnSolid);
        // the farm buildings are buildings too — you can shoot these down
        this.buildings.push({
          x: ex, z: ez, y: ey, r: bw * 0.62, w: bw, h: bh, hp: 150, solid: barnSolid,
          parts: [{ mesh: M.barn, i: bi }, { mesh: M.barnRoof, i: bri }],
          roofColor: this.T.hutRoof,
        });
        this._addShadow(ex, ez, bw * 0.8);
        const sx2 = ex + px * 7.5, sz2 = ez + pz * 7.5;
        const sy2 = gy(sx2, sz2);
        const si = M.silo.count, sci = M.siloCap.count;
        push(M.silo, sx2, sy2 - 0.4, sz2, rot, 1.9, 7.6, 1.9);
        push(M.siloCap, sx2, sy2 - 0.4 + 7.6, sz2, rot, 2.2, 1.5, 2.2);
        const siloSolid = { x: sx2, z: sz2, r: 2.0, y: sy2, mat: 'hut' };
        this.solids.push(siloSolid);
        this.buildings.push({
          x: sx2, z: sz2, y: sy2, r: 2.2, w: 4, h: 7.6, hp: 100, solid: siloSolid,
          parts: [{ mesh: M.silo, i: si }, { mesh: M.siloCap, i: sci }],
          roofColor: 0xd8d2c4,
        });
        this._addShadow(sx2, sz2, 2.5);
        const tx = ex - px * 6.5 - ux * 3, tz = ez - pz * 6.5 - uz * 3;
        push(M.trough, tx, gy(tx, tz) - 0.1, tz, rot + 0.5, 1.1, 0.75, 4.2);
      },
      finish: () => {
        for (const im of Object.values(M)) {
          if (!im.count) continue;
          im.instanceMatrix.needsUpdate = true;
          this.group.add(im);
        }
      },
    };
  }

  /** Open grazing ground for the animal system: 4-8 flat, road-free circles.
   *  Data only — behaviour lives in the game code. */
  _buildPastures() {
    const out = (this._sitePastures || []).slice(0, 4);
    for (let tries = 0; tries < 160 && out.length < 7; tries++) {
      const p = this._trackSidePos(30, 150);
      if (!p) continue;
      const r = 12 + Math.random() * 8;
      if (out.some((q) => (q.x - p.x) ** 2 + (q.z - p.z) ** 2 < (r + q.r + 14) ** 2)) continue;
      if (!this._buildableSpot(p.x, p.z, r * 0.75, 2.4)) continue;
      out.push({ x: p.x, z: p.z, r });
    }
    // world-space grazing spots: [{x, z, r}]
    this.pastures = out;
  }

  /** DECOR micro-detail along the road fringes (no collision): gravel spill
   *  clusters just off the edge, and reflector marker posts on the OUTSIDE of
   *  corners (skipped on cliff-walled worlds where rock lines the road). */
  _buildRoadsideDetail(m4) {
    const T = this.T;
    const q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
    // --- gravel spill clusters (skip worlds with no loose-stone language) ---
    if (T.pebbleCount > 0) {
      const SPOTS = 40;
      const gravelGeo = this._rockGeo || (this._rockGeo = this._topLitRockGeo(0));
      const gravel = new THREE.InstancedMesh(
        gravelGeo,
        new THREE.MeshStandardMaterial({
          color: T.rockColor, flatShading: true, roughness: 1, vertexColors: true,
        }),
        SPOTS * 3
      );
      const gcol = new THREE.Color();
      let gk = 0;
      this._scatter(SPOTS, () => this._trackSidePos(10.9, 14), (p) => {
        for (let c = 0; c < 3; c++) {
          const ox = (Math.random() - 0.5) * 1.6, oz = (Math.random() - 0.5) * 1.6;
          const s = 0.16 + Math.random() * 0.26;
          const gy = this.terrainHeight(p.x + ox, p.z + oz) + s * 0.2;
          q.setFromAxisAngle(up, Math.random() * Math.PI * 2);
          m4.compose(new THREE.Vector3(p.x + ox, gy, p.z + oz), q, new THREE.Vector3(s, s * 0.55, s));
          gravel.setMatrixAt(gk, m4);
          gcol.setScalar(0.85 + Math.random() * 0.3);
          gravel.setColorAt(gk++, gcol);
        }
      });
      gravel.count = gk;
      this.group.add(gravel);
    }
    // --- reflector marker posts on corner outsides ---
    // (skipped where stone already lines the road: canyon cliffs, pass parapets)
    if (T.cliffWalls || T.retainingWalls || T.guardFence) return;
    const postGeo = new THREE.BoxGeometry(0.15, 0.85, 0.15);
    postGeo.translate(0, 0.43, 0);
    const bandGeo = new THREE.BoxGeometry(0.18, 0.22, 0.18);
    bandGeo.translate(0, 0.74, 0);
    const postMat = new THREE.MeshStandardMaterial({ color: 0xe8e4da, roughness: 0.7 });
    // reflective head: unlit + theme-accented so it pops at dusk/night too
    const bandColor = new THREE.Color(T.splinter[0]).lerp(new THREE.Color(0xffffff), 0.2);
    const bandMat = new THREE.MeshBasicMaterial({ color: bandColor });
    const MAXM = 90;
    const posts = new THREE.InstancedMesh(postGeo, postMat, MAXM);
    const bands = new THREE.InstancedMesh(bandGeo, bandMat, MAXM);
    let mk = 0, lastI = -999;
    for (let i = 0; i < N && mk < MAXM; i += 4) {
      if (this.curvature[i] < 0.017 || i - lastI < 14) continue;
      if (this._circDist(i, 0) < 40) continue;
      lastI = i;
      // outside of the corner
      const a = this.tan[i], b = this.tan[(i + 12) % N];
      const side = (a.x * b.z - a.z * b.x) > 0 ? -1 : 1;
      const p = this.pointAt(i, (WALL_OFF + 1.7) * side);
      const y = this.terrainHeight(p.x, p.z);
      q.setFromAxisAngle(up, this.headingAt(i));
      m4.compose(new THREE.Vector3(p.x, y, p.z), q, new THREE.Vector3(1, 1, 1));
      posts.setMatrixAt(mk, m4);
      bands.setMatrixAt(mk++, m4);
    }
    posts.count = bands.count = mk;
    if (mk) this.group.add(posts, bands);
  }

  /** STEEP GROUND IS ROCK, NOT PAINT.
   *
   *  The terrain bake colours by HEIGHT alone - lerp low to high, clamped -
   *  so any hillside above the ramp's ceiling came out as ONE flat colour. On
   *  OLIVE COAST a whole slope filled the player's screen as a single
   *  featureless sheet, the same beige as the fog and the sky, with nothing
   *  on it to say "this is ground" at all. Real slopes shed their soil: past
   *  about 24 degrees the colour now pulls toward a darker rock tone derived
   *  from the theme's own high colour, so a face breaks into shaded form and
   *  a cutting shows earth. Slope comes from grid-neighbour differencing on
   *  the already-computed heights - no extra height samples, build-time only.
   */
  _slopeRock(pos, colors, cHigh) {
    const W = Math.round(Math.sqrt(pos.count));
    if (W * W !== pos.count) return;
    const cell = Math.abs(pos.getX(1) - pos.getX(0)) || 1;
    const rock = cHigh.clone().multiplyScalar(0.60);
    const tmp = new THREE.Color();
    for (let iz = 0; iz < W; iz++) {
      for (let ix = 0; ix < W; ix++) {
        const i = iz * W + ix;
        const y0 = pos.getY(i);
        const yx = pos.getY(iz * W + (ix + 1 < W ? ix + 1 : ix - 1));
        const yz = pos.getY((iz + 1 < W ? iz + 1 : iz - 1) * W + ix);
        const slope = Math.max(Math.abs(yx - y0), Math.abs(yz - y0)) / cell;
        const k = THREE.MathUtils.smoothstep(slope, 0.45, 1.15) * 0.52;
        if (k < 0.02) continue;
        tmp.setRGB(colors[i * 3], colors[i * 3 + 1], colors[i * 3 + 2]);
        tmp.lerp(rock, k);
        colors[i * 3] = tmp.r; colors[i * 3 + 1] = tmp.g; colors[i * 3 + 2] = tmp.b;
      }
    }
  }

  /** Shared top-lit rock geometry: a dodecahedron with a baked vertex-color
   *  brightness gradient (dark underside → sun-catching crown) that multiplies
   *  whatever material/instance color rides on top. */
  _topLitRockGeo(detail) {
    const geo = new THREE.DodecahedronGeometry(1, detail);
    const pos = geo.attributes.position;
    const cols = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      // TOP-LIT, NOT BLOWN OUT. This ran 0.68 -> 1.20, and a vertex colour
      // above 1 BRIGHTENS the material: under a strong sun the tops washed to
      // white, which is what turned every boulder field into "white mountains
      // with no purpose". The gradient still reads; it just stops at 1.
      const t = THREE.MathUtils.clamp((pos.getY(i) + 1) / 2, 0, 1);
      const v = 0.66 + 0.34 * t;
      cols[i * 3] = v; cols[i * 3 + 1] = v; cols[i * 3 + 2] = v;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    return geo;
  }

  /** LOG FLUME FURY: trackside timber yards — pyramid stacks of cut logs
   *  (6 per stack) close enough to the road to sell the logging operation.
   *  Each stack gets one SOLID collider (stacked timber does not yield). */
  _buildLogYards() {
    const count = this.T.logYards | 0;
    const logGeo = new THREE.CylinderGeometry(0.55, 0.55, 1, 9);
    logGeo.rotateZ(Math.PI / 2);                        // axis → local x
    const logMat = new THREE.MeshStandardMaterial({ color: 0x8a6238, roughness: 0.95 });
    const logs = new THREE.InstancedMesh(logGeo, logMat, count * 6);
    logs.castShadow = true;
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
    const col = new THREE.Color();
    let k = 0;
    // half the yards cluster in the start bowl (visible from the grid), the
    // rest scatter down the lap
    const makePos = () => {
      if (Math.random() < 0.5) {
        const gi = (((Math.random() * 160 - 80) | 0) + N) % N;
        const side = Math.random() < 0.5 ? 1 : -1;
        const p = this.pointAt(gi, side * (13.5 + Math.random() * 9));
        if (this._distToTrack(p.x, p.z) < 12.5) return null;
        return { x: p.x, z: p.z };
      }
      return this._trackSidePos(13, 26);
    };
    this._scatter(count, makePos, (p) => {
      const y = this.terrainHeight(p.x, p.z);
      const rot = Math.random() * Math.PI;
      const len = 4 + Math.random() * 2;
      q.setFromAxisAngle(up, rot);
      const dx = Math.sin(rot + Math.PI / 2), dz = Math.cos(rot + Math.PI / 2);
      // 3 + 2 + 1 pyramid across the stack's local z
      const rows = [[-1.15, 0, 1.15], [-0.58, 0.58], [0]];
      rows.forEach((offs, tier) => {
        for (const off of offs) {
          m4.compose(
            new THREE.Vector3(p.x + dx * off, y + 0.55 + tier * 0.95, p.z + dz * off),
            q, new THREE.Vector3(len * (0.9 + Math.random() * 0.2), 1, 1)
          );
          logs.setMatrixAt(k, m4);
          col.setHSL(0.07 + Math.random() * 0.03, 0.4, 0.3 + Math.random() * 0.12);
          logs.setColorAt(k++, col);
        }
      });
      this.solids.push({ x: p.x, z: p.z, r: 2.4, y, mat: 'hut' });
      this._addShadow(p.x, p.z, 4.0);
    });
    logs.count = k;
    this.group.add(logs);
  }

  /** REDWOOD RAMPAGE: one fallen giant straddles the road — cars drive under
   *  it. Decorative beam (≥ 6u clearance over the deck); collision comes ONLY
   *  from the two trunk-half SOLIDS standing at the road edges. */
  _buildHollowArch() {
    // straightest window well away from the start and any ramp
    let best = -1, bc = Infinity;
    for (let i = 90; i < N - 90; i += 5) {
      if (this.ramps.some((r) => this._circDist(i, r.index) < 60)) continue;
      let mc = 0;
      for (let k = -6; k <= 6; k++) mc = Math.max(mc, this.curvature[(i + k + N) % N]);
      if (mc < bc) { bc = mc; best = i; }
    }
    if (best < 0) return;
    const i = best;
    const c = this.center[i];
    const bark = new THREE.MeshStandardMaterial({ color: 0x6a3922, roughness: 1 });
    const barkDark = new THREE.MeshStandardMaterial({ color: 0x4a2716, roughness: 1 });
    const cut = new THREE.MeshStandardMaterial({ color: 0xb88a54, roughness: 0.9 });
    const g = new THREE.Group();
    for (const side of [1, -1]) {
      // shattered trunk halves the fallen giant rests on
      const stump = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 3.3, 12, 10), bark);
      stump.position.set(side * 12.4, 6, 0);
      stump.castShadow = true;
      g.add(stump);
      // root flare at the base
      const flare = new THREE.Mesh(new THREE.ConeGeometry(4.4, 3.4, 8), barkDark);
      flare.position.set(side * 12.4, 1.4, 0);
      flare.castShadow = true;
      g.add(flare);
    }
    // the fallen trunk itself, lying across the road (bottom ≈ y 9 — well
    // clear of the 6u minimum and of any nearby ramp apex)
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(3.1, 3.3, 33, 12), [bark, cut, cut]);
    beam.rotation.z = Math.PI / 2;
    beam.position.y = 12.2;
    beam.castShadow = true;
    g.add(beam);
    // a couple of snapped branch stubs on top
    for (const [bx, ba] of [[-4, 0.5], [5.5, -0.4]]) {
      const stub = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.75, 4.5, 7), barkDark);
      stub.position.set(bx, 14.6, 0.6);
      stub.rotation.z = ba;
      g.add(stub);
    }
    g.position.set(c.x, c.y, c.z);
    g.rotation.order = 'YXZ';
    g.rotation.y = this.headingAt(i);                 // local +x = road normal
    g.rotation.x = -Math.atan(this.slopeAt(i));
    this.group.add(g);
    // collision: ONLY the two trunk halves, at the road edges
    const n = this.nrm[i];
    for (const side of [1, -1]) {
      this.solids.push({
        x: c.x + n.x * 12.4 * side, z: c.z + n.z * 12.4 * side,
        r: 3.4, y: c.y, mat: 'hut',
      });
    }
  }

  /** Trackside lamps (NEO-KYOTO / undercity): unlit emissive heads on dark
   *  posts down both road edges — pure set dressing, bloom does the glowing. */
  /** STREET LAMPS - and the metronome they used to be.
   *
   *  Measured on LANTERN QUARTER: 128 lamps, consecutive step 26.24 u at a
   *  coefficient of variation of 0.02. The matrix was `makeTranslation` - a
   *  translation and NOTHING else, so every post was the same height, the same
   *  rotation, the same six-sided cylinder presenting the same facet to the
   *  sun, and the sides strictly alternated. It is the same defect as the row
   *  of identical boats in the harbour, and it costs nothing to fix because
   *  every knob is instance data on two meshes that already exist.
   *
   *  Deterministic hash off the sample index, so a rebuild is identical.
   */
  _buildLamps() {
    const L = { color: 0xffffff, every: 38, height: 6.4, ...this.T.lamps };
    const hash = (n) => { const v = Math.sin(n * 12.9898) * 43758.5453; return v - Math.floor(v); };
    const specs = [];
    for (let i = 10; i < N; i += L.every) {
      const h = hash(i);
      // the side comes off the hash, not off a strict alternation, and about
      // one sample in six carries a PAIR - a junction, which gives the street
      // punctuation instead of a beat
      const both = hash(i + 7.7) > 0.84;
      const side = h > 0.5 ? 1 : -1;
      specs.push({ i, side, k: h });
      if (both) specs.push({ i, side: -side, k: hash(i + 3.3) });
    }
    const postGeo = new THREE.CylinderGeometry(0.09, 0.13, L.height, 6);
    postGeo.translate(0, L.height / 2, 0);
    const headGeo = new THREE.SphereGeometry(0.3, 8, 6);
    headGeo.translate(0, L.height + 0.15, 0);
    const postMat = new THREE.MeshStandardMaterial({ color: 0x1c1e24, roughness: 0.6, metalness: 0.5 });
    const headMat = new THREE.MeshBasicMaterial({ color: 0xffffff, vertexColors: true });
    this._white(headGeo);
    const posts = new THREE.InstancedMesh(postGeo, postMat, specs.length);
    const heads = new THREE.InstancedMesh(headGeo, headMat, specs.length);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0), col = new THREE.Color();
    const base = new THREE.Color(L.color);
    const hsl = { h: 0, s: 0, l: 0 };
    base.getHSL(hsl);
    let k = 0;
    for (const sp of specs) {
      // a third of a pitch of slack along the road, so the rhythm breaks
      const along = (sp.k - 0.5) * L.every * 0.34;
      const p = this.pointAt(Math.round(sp.i + along + N) % N, (WALL_OFF + 0.9) * sp.side);
      // yaw alone changes which facet of a six-sided post catches the sun
      q.setFromAxisAngle(up, sp.k * Math.PI * 2);
      const hh = 0.86 + sp.k * 0.3;
      m4.compose(new THREE.Vector3(p.x, p.y, p.z), q, new THREE.Vector3(1, hh, 1));
      posts.setMatrixAt(k, m4);
      heads.setMatrixAt(k, m4);
      // sodium temperature wanders, and roughly one lamp in twelve is dead
      const dead = hash(sp.i + 19.1) > 0.92;
      col.setHSL(hsl.h, hsl.s, dead ? 0.06 : hsl.l * (0.9 + sp.k * 0.2));
      heads.setColorAt(k++, col);
    }
    posts.count = heads.count = k;
    if (heads.instanceColor) heads.instanceColor.needsUpdate = true;
    this.group.add(posts, heads);
  }

  /** OLD TOWN NIGHT (LANTERN QUARTER): the street itself.
   *
   *  Every other world is a road THROUGH a landscape, so its roadside is
   *  scattered — huts, farmsteads, boulders, trees, all placed independently
   *  by `_scatter`. A town is the opposite: the buildings ARE the corridor,
   *  they are CONTINUOUS, and they are the entire reason this region has no
   *  runoff. Nothing in the existing kit builds a continuous frontage, which
   *  is why this builder exists and why only this theme turns it on.
   *
   *  Four things in one pass so they can share two instanced meshes:
   *    1. THE FRONTAGE — terraces of gable-fronted townhouses down both kerbs,
   *       broken every 4–9 units by a side alley (region checklist R07: no
   *       unbroken frontage past 120 m). Where the road swings back under an
   *       offset the terrace STEPS BACK instead of eating the carriageway.
   *    2. THE QUARTER BEHIND — a sparser, taller second rank, so the town has
   *       depth in the fog instead of ending at the pavement. These are
   *       registered as shootable `buildings`; the frontage deliberately is
   *       not (see the note at the registration site).
   *    3. THE ARCHED GATEWAYS — one hung over each authored width pinch, so
   *       the squeeze you see and the squeeze the physics applies are the same
   *       squeeze. Only the piers are solid: a solid on the span would collide
   *       with a car driving under it (`solids` is a circle test with a ±6 u
   *       height window, not a box), exactly as the start gantry avoids.
   *    4. THE CAMPANILE — the single landmark, tall enough to navigate by.
   *
   *  EVERY SOLID IS VALIDATED WITH `_clearsRoad`, never with a bare lateral
   *  offset. A fixed offset is measured along ONE sample's normal and a street
   *  grid doubles back on itself constantly — the same defect that once put a
   *  cabin on the centreline of FURKA RIDGE. */
  _buildOldTown(m4) {
    const F = {
      lateral: 15.5, depth: 8, unit: 7.0, height: 10.0, run: [7, 14], rows: 6,
      tints: ['#c9b58e', '#a89c92', '#b09088', '#9aa0a4', '#c0a878', '#8e9298'],
      ...this.T.frontage,
    };
    // THE SKYLINE MUST BE ROOFTOPS. The shared horizon builder rings every
    // world with cone hills and a farther ring of peaks. Behind an old town
    // that is a mountain range, which the region's negative list forbids
    // outright ("any silhouette that is not architectural") — and no amount of
    // fog or haze tuning hides a 300 u cone, because at this fog distance the
    // cone IS the fog colour and the haze band behind it is not. Dropped here
    // rather than in `_buildHorizon` so no other world is touched.
    for (const n of ['horizon-hills', 'horizon-peaks']) {
      const mesh = this.group.getObjectByName(n);
      if (!mesh) continue;
      this.group.remove(mesh);
      mesh.geometry.dispose();
      mesh.material.map?.dispose();
      mesh.material.dispose();
    }
    const MAX = 2600;                 // deep enough that the back lanes exist
    const bodyGeo = new THREE.BoxGeometry(1, 1, 1);
    bodyGeo.translate(0, 0.5, 0);
    // THE FACADE IS THE STYLE. The body has no colour of its own - it wears a
    // generated facade texture, and the per-house tint only MULTIPLIES that.
    // So a northern timber-and-grey facade stayed northern however warm the
    // tints were, which is why an Aegean street came out grey-green. The
    // texture takes a regional palette now: light render (so the tint carries
    // the colour) and regional joinery.
    // FOUR BUILDINGS, NOT ONE. The facade generator carried a fixed bay layout,
    // so every house in every town was the same house - reported as "this house
    // I see everywhere". Four variants are built (merchant terrace, cottage,
    // tall house, wide three-bay), each its own texture and its own instanced
    // mesh, and a building picks one. The cottage is weighted heaviest so a
    // street is mostly modest houses with the big blocks as punctuation.
    // A STREET WHERE EVERY HOUSE IS LIT IS A STREET WHERE NOBODY LIVES.
    // Four bay layouts, each in TWO lighting states - a lit house and a mostly
    // dark one - so a terrace reads as occupied rather than as a switchboard.
    // Emissive is a MATERIAL property and these are instanced meshes, so
    // per-house lighting has to be per-mesh: eight slots instead of four, which
    // is eight more draw calls on the one world type that has a night street.
    const VARIANTS = 4;
    const SLOTS = VARIANTS * 2;
    const faceTexes = [];
    for (let v = 0; v < VARIANTS; v++) faceTexes.push(townhouseTexture(F.face, v));
    const faceTex = faceTexes[0];
    faceTex.anisotropy = 4;
    const bodyMat = new THREE.MeshStandardMaterial({
      map: faceTex, roughness: 0.86, envMapIntensity: 0.35,
      // the lit bays are the ONLY light source that reaches the upper half of
      // the frame — without them a night street is a black band over the road
      emissive: 0xffffff,
      emissiveIntensity: this.T.hutGlow ?? 1,
    });
    const roofMat = new THREE.MeshStandardMaterial({
      color: F.roof ?? this.T.hutRoof ?? 0x33363c, flatShading: true,
      roughness: 0.72, envMapIntensity: 0.4,
    });
    const bodySet = [];
    for (let sl = 0; sl < SLOTS; sl++) {
      const v = sl >> 1, dark = (sl & 1) === 1;
      const tex = faceTexes[v];
      const m = bodyMat.clone();
      m.map = tex;
      tex.anisotropy = 4;
      m.emissiveMap = townhouseGlowTexture(F.glow, v, dark ? 0.13 : 0.6);
      m.emissiveIntensity = (this.T.hutGlow ?? 1) * (dark ? 0.75 : 1);
      const im = new THREE.InstancedMesh(bodyGeo, m, Math.ceil(MAX / 3));
      im.name = 'oldtown-frontage';
      im.castShadow = im.receiveShadow = true;
      bodySet.push(im);
    }
    const roofSet = bodySet.map(() => {
      const im = new THREE.InstancedMesh(gablePrismGeo(), roofMat, Math.ceil(MAX / 3));
      im.castShadow = im.receiveShadow = true;
      return im;
    });
    const kv = new Array(SLOTS).fill(0);
    // the cottage (1) twice, so the street is mostly modest houses
    const VPICK = [0, 1, 1, 2, 3];
    // ...and roughly two houses in five have the lights off
    const pickSlot = () => VPICK[(Math.random() * VPICK.length) | 0] * 2
      + (Math.random() < 0.42 ? 1 : 0);
    const bodies = bodySet[0];
    const roofs = roofSet[0];
    bodies.castShadow = bodies.receiveShadow = true;
    roofs.castShadow = true;
    // wall-bracket lanterns: emissive heads on short arms, bloom does the glow
    // (same contract as `_buildLamps` — no point lights, a night city cannot
    // afford two hundred of them and a shader recompile per light count)
    const LMAX = 200;
    const armGeo = new THREE.BoxGeometry(0.7, 0.1, 0.1);
    armGeo.translate(-0.35, 0, 0);
    const bulbGeo = new THREE.SphereGeometry(0.26, 7, 5);
    bulbGeo.translate(-0.72, -0.12, 0);
    const arms = new THREE.InstancedMesh(
      armGeo, new THREE.MeshStandardMaterial({ color: 0x1a1c20, roughness: 0.6, metalness: 0.5 }), LMAX);
    const bulbs = new THREE.InstancedMesh(
      bulbGeo, new THREE.MeshBasicMaterial({ color: this.T.lamps?.color ?? 0xffb14a }), LMAX);
    let lk = 0;

    const q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
    const col = new THREE.Color();
    const tints = F.tints.map((c) => new THREE.Color(c));
    let k = 0;

    /** Place one masonry block. Returns its solid, or null if it could not be
     *  fitted clear of the road at any of the offered lateral offsets. */
    const put = (i, side, lat, wAlong, dAcross, h, roofH, tint) => {
      if (k >= MAX) return null;
      const p = this.pointAt(i, lat * side);
      const r = Math.hypot(wAlong, dAcross) / 2;
      // THE QUAY IS OPEN TO THE WATER (harbour reference): no house between
      // the seafront road and the sea. Any block whose centre lands within
      // `seaOpen` units of the waterline — or in the water — is refused, so
      // the seaward flank stays bare quay and the terrace lines the land side.
      if (F.seaOpen && this.T.coast && this._coastSide(p.x, p.z) > -F.seaOpen) return null;
      if (!this._clearsRoad(p.x, p.z, r, 1.6)) return null;
      // never swallow a tree or a smashable prop that is already placed
      for (const t of this.trees) {
        if ((t.x - p.x) ** 2 + (t.z - p.z) ** 2 < (r + 1.4) ** 2) return null;
      }
      for (const pr of this.props) {
        if ((pr.x - p.x) ** 2 + (pr.z - p.z) ** 2 < (r + 1.0) ** 2) return null;
      }
      const y = this.terrainHeight(p.x, p.z) - 0.5;
      q.setFromAxisAngle(up, this.headingAt(i));
      // local +X is the road normal and local +Z runs along the street, so the
      // GABLE END faces the road: the Baltic gable-fronted terrace, and the
      // one roof orientation that still reads as separate houses in a row
      const vi = pickSlot();
      const bm = bodySet[vi], rm = roofSet[vi];
      if (kv[vi] >= bm.count) return null;
      // a cottage is a cottage: the variant sets the storey count, so it must
      // set the HEIGHT too or a one-storey facade gets stretched over three
      const vh = h * [1, 0.62, 1.24, 0.94][vi >> 1];
      m4.compose(new THREE.Vector3(p.x, y, p.z), q, new THREE.Vector3(dAcross, vh, wAlong));
      bm.setMatrixAt(kv[vi], m4);
      m4.compose(new THREE.Vector3(p.x, y + vh, p.z), q,
        new THREE.Vector3(dAcross * 1.06, roofH, wAlong * 1.04));
      rm.setMatrixAt(kv[vi], m4);
      col.copy(tint).multiplyScalar(0.86 + Math.random() * 0.26);
      bm.setColorAt(kv[vi], col);
      rm.setColorAt(kv[vi], col.setScalar(0.8 + Math.random() * 0.4));
      const myMesh = bm, myRoof = rm, myIdx = kv[vi];
      kv[vi]++;
      k++;
      h = vh;
      const solid = { x: p.x, z: p.z, r, y: y + 0.6, mat: 'hut' };
      this.solids.push(solid);
      return { solid, p, y, h, r, lat, mesh: myMesh, roof: myRoof, idx: myIdx };
    };

    // chimney stacks: a small dark box riding most ridges. The cheapest thing
    // that breaks the "one extruded slab" read of a long terrace — the
    // roofline becomes an irregular crenellation instead of a clean line.
    const CMAX = 640;
    const chimGeo = new THREE.BoxGeometry(0.62, 1.7, 0.62);
    chimGeo.translate(0, 0.85, 0);
    const chims = new THREE.InstancedMesh(chimGeo, new THREE.MeshStandardMaterial({
      color: 0x4c4642, flatShading: true, roughness: 0.95,
    }), CMAX);
    let ck = 0;
    const chimOff = new THREE.Vector3();
    const chimAt = (i, side, lat, dAcross, wAlong, eaveY, roofH) => {
      if (ck >= CMAX) return;
      const p = this.pointAt(i, lat * side);
      q.setFromAxisAngle(up, this.headingAt(i));
      // A STACK STANDS ON THE ROOF IT IS ON, NOT ON THE RIDGE IT IS NEAR.
      //
      // The base used to be handed in as `eaveY + roofH * 0.8` - the height of
      // the ridge - and the stack was THEN slid up to 0.30 * depth sideways
      // across the roof. A gable falls away from its ridge, so at 2.4 u across
      // an 8 u-deep roof the tiles are only 0.4 of the way up while the stack
      // was still sitting at 0.8: about a metre of daylight under every
      // chimney on the street, which is exactly what was reported.
      //
      // Pick the offset FIRST, then read the roof height at that offset.
      const across = (Math.random() < 0.5 ? -1 : 1) * dAcross * (0.14 + Math.random() * 0.16);
      const along = (Math.random() - 0.5) * wAlong * 0.22;
      chimOff.set(across, 0, along).applyQuaternion(q);
      // gable slopes across the roof's DEPTH: full height on the ridge, zero
      // at the eaves. 0.35 sinks the stack's foot into the tiles.
      const f = Math.max(0, 1 - Math.abs(across) / (dAcross * 0.5));
      const baseY = eaveY + roofH * f - 0.35;
      m4.compose(new THREE.Vector3(p.x + chimOff.x, baseY, p.z + chimOff.z), q,
        new THREE.Vector3(1, 0.75 + Math.random() * 0.6, 1));
      chims.setMatrixAt(ck++, m4);
    };

    // ---- 1 + 2: the frontage and the rank behind it ----
    //
    // A DESIGNED STREET, NOT A ROW OF BOXES. Three stacked sources of
    // variation keep the copy-paste rhythm out of the streetwall:
    //   - each terrace RUN draws its own base height and a small setback
    //     jitter, so adjacent blocks read as built decades apart;
    //   - each HOUSE jitters width and height inside the run, and roughly one
    //     in nine grows into a tall merchant house standing half a storey
    //     proud of its neighbours, with a steeper roof;
    //   - most roofs carry a chimney stack (above).
    const step = Math.max(2, Math.round(F.unit / this.segLen));
    const SIDES = F.side ? [F.side] : [1, -1];
    const placedS = { 1: new Set(), [-1]: new Set() };   // feeds the string lights
    for (const side of SIDES) {
      let run = 0, want = F.run[0] + ((Math.random() * (F.run[1] - F.run[0] + 1)) | 0);
      let gap = 0;
      let runH = 0.84 + Math.random() * 0.44;            // this block's build height
      let runJ = (Math.random() - 0.5) * 1.6;            // and its setback jitter
      for (let s = 0; s * step < N; s++) {
        const i = (s * step) % N;
        // the start gate, the grid and the grandstand own this stretch
        if (this._circDist(i, 0) < 40) { run = 0; continue; }
        if (gap > 0) { gap--; run = 0; continue; }
        // step the terrace back rather than break it, where the road swings in
        let placed = null;
        const tall = run > 0 && Math.random() < 0.11;    // the merchant house
        const hh = F.height * runH * (0.93 + Math.random() * 0.14) * (tall ? 1.42 : 1);
        const ww = F.unit * (tall ? 0.9 : 0.94 + Math.random() * 0.22);
        const roofH = tall ? 3.2 + Math.random() * 1.3 : 2.0 + Math.random() * 1.2;
        for (const extra of [0, 3.5, 7]) {
          placed = put(i, side, F.lateral + runJ + extra, ww, F.depth, hh, roofH,
            tints[(Math.random() * tints.length) | 0]);
          if (placed) break;
        }
        if (!placed) { run = 0; continue; }
        placedS[side].add(i);
        if (Math.random() < 0.62) chimAt(i, side, placed.lat, F.depth, ww, placed.y + hh, roofH);
        // A LANTERN ON THE BRACKET, every third house. Anchored to the FRONT
        // FACE, not the block centre — the arm only reaches 0.72 u and a
        // 8 u-deep building would have swallowed the bulb whole.
        if (lk < LMAX && run % 3 === 0) {
          const fp = this.pointAt(i, (placed.lat - F.depth * 0.5 - 0.15) * side);
          q.setFromAxisAngle(up, this.headingAt(i) + (side > 0 ? 0 : Math.PI));
          m4.compose(new THREE.Vector3(fp.x, placed.y + 4.3, fp.z), q,
            new THREE.Vector3(1, 1, 1));
          arms.setMatrixAt(lk, m4);
          bulbs.setMatrixAt(lk++, m4);
        }
        if (++run >= want) {                       // side alley, then a new block
          gap = 1 + ((Math.random() * 2) | 0);
          want = F.run[0] + ((Math.random() * (F.run[1] - F.run[0] + 1)) | 0);
          runH = 0.84 + Math.random() * 0.44;      // the next block, its own build
          runJ = (Math.random() - 0.5) * 1.6;
        }
        // THE VILLAGE HAS DEPTH. One rank behind the frontage reads as a
        // stage flat - a single terrace with nothing behind it. The reference
        // is a village climbing away from the road, roofs stepping back to the
        // skyline, so `rows` ranks are laid: each further out, sparser than the
        // last, and a touch lower so the rows read as receding rather than as
        // a wall. Every one of them is shootable set dressing.
        const RANKS = F.rows ?? 1;
        for (let rank = 1; rank <= RANKS; rank++) {
        // RANKS THINNED TOO FAST TO READ AS A TOWN. `s % (3 + rank)` places
        // one bay in four at rank 1 and one in eight by rank 5, so the ranks
        // the frontage was meant to hide behind were mostly gaps. Held flatter,
        // the hillside actually fills in.
        if (s % (2 + Math.min(rank, 3)) === 0) {
          const back = put(i, side,
            F.lateral + F.depth + 9 + (rank - 1) * (F.depth + 12) + Math.random() * 12,
            F.unit * (1.1 + Math.random() * 0.5), F.depth + 2 + Math.random() * 3,
            F.height * (1.05 + Math.random() * 0.55) * (1 - (rank - 1) * 0.07),
            2.4 + Math.random() * 1.4,
            tints[(Math.random() * tints.length) | 0]);
          // THE FRONTAGE IS NOT SHOOTABLE AND THE BLOCK BEHIND IT IS.
          // The frontage is the corridor — level a terrace and the region's
          // whole premise (no runoff, a mistake ends against masonry) goes with
          // it. The rank behind is set dressing, so it takes fire like any
          // other building in the game.
          if (back) {
            this.buildings.push({
              x: back.p.x, z: back.p.z, y: back.y, r: back.r * 0.7,
              w: back.r * 1.2, h: back.h, hp: 220, solid: back.solid,
              parts: [{ mesh: back.mesh, i: back.idx }, { mesh: back.roof, i: back.idx }],
              roofColor: this.T.hutRoof,
            });
            this._addShadow(back.p.x, back.p.z, back.r * 1.25);
          }
        }
        }
      }
    }

    // ---- 2b: parish steeples IN the street line — the landmark you steer
    // at. The campanile stands back in the quarter; these two stand shoulder
    // to shoulder with the terraces: a double-height gable tower with a tall
    // wedge spire, closing the view down a straight.
    for (const frac of [0.3, 0.68]) {
      const i0 = (frac * N) | 0;
      let done = false;
      for (let d = 0; d < 48 && !done; d += 4) {
        for (const i of [(i0 + d) % N, (i0 - d + N) % N]) {
          for (const side of [1, -1]) {
            const st = put(i, side, F.lateral + 1.5, F.unit * 1.12, F.depth * 0.9,
              F.height * 2.05, 6.4 + Math.random() * 1.6,
              tints[(Math.random() * tints.length) | 0]);
            if (st) { done = true; break; }
          }
          if (done) break;
        }
      }
    }

    for (let v = 0; v < SLOTS; v++) {
      bodySet[v].count = roofSet[v].count = kv[v];
      if (bodySet[v].instanceColor) bodySet[v].instanceColor.needsUpdate = true;
      if (roofSet[v].instanceColor) roofSet[v].instanceColor.needsUpdate = true;
    }
    arms.count = bulbs.count = lk;
    chims.count = ck;
    chims.name = 'oldtown-chimneys';
    bulbs.name = 'oldtown-lanterns';
    for (let v = 0; v < SLOTS; v++) {
      if (kv[v]) this.group.add(bodySet[v], roofSet[v]);
    }
    if (ck) this.group.add(chims);
    if (lk) this.group.add(arms, bulbs);

    // ---- string lights over the street (night quarters only): warm bulb
    // catenaries slung facade-to-facade wherever terraces face each other on
    // a straight-enough stretch. Emissive spheres, no wire, no point lights —
    // at night the bulbs ARE the read, same contract as the lamps.
    if (this.T.lamps) {
      const SMAX = 42 * 9;
      const strGeo = new THREE.SphereGeometry(0.14, 6, 5);
      const strings = new THREE.InstancedMesh(strGeo,
        new THREE.MeshBasicMaterial({ color: this.T.lamps.color ?? 0xffb14a }), SMAX);
      let sk = 0, since = 99;
      for (let s = 0; s * step < N; s++) {
        const i = (s * step) % N;
        since++;
        if (!placedS[1].has(i) || !placedS[-1].has(i)) continue;
        if (this.curvature[i] > 0.009 || since < 5) continue;
        if (sk + 9 > SMAX) break;
        since = 0;
        const a = this.pointAt(i, F.lateral - F.depth * 0.5 - 0.2);
        const b = this.pointAt(i, -(F.lateral - F.depth * 0.5 - 0.2));
        const yTop = Math.max(a.y, b.y) + 6.6;
        for (let t = 0; t < 9; t++) {
          const f = t / 8;
          const y = yTop - 1.35 * (1 - (2 * f - 1) ** 2);   // the catenary sag
          m4.makeTranslation(a.x + (b.x - a.x) * f, y, a.z + (b.z - a.z) * f);
          strings.setMatrixAt(sk++, m4);
        }
      }
      strings.count = sk;
      strings.name = 'oldtown-strings';
      if (sk) this.group.add(strings);
    }

    // ---- 3: the arched gateways over the authored pinches (two per stage) ----
    for (const sec of (this._narrowSecs || []).slice(0, 2)) this._buildArchGateway(sec.mid, F);

    // ---- 4: the campanile ----
    this._buildCampanile();

    // ---- kerb bollards: the region's edge treatment is "kerb plus bollard
    // line", and it is what tells you where the street edge is between lamps.
    // COSMETIC, like the trackside lamps and the reflector marker posts — a
    // solid line of colliders 2 u off the drivable edge would be a wall, not a
    // kerb, and this world already has walls.
    const bolGeo = new THREE.CylinderGeometry(0.16, 0.2, 0.95, 6);
    bolGeo.translate(0, 0.48, 0);
    const bols = new THREE.InstancedMesh(bolGeo, new THREE.MeshStandardMaterial({
      color: 0x2a2c30, roughness: 0.55, metalness: 0.45,
    }), 260);
    let bk = 0;
    for (let i = 0; i < N && bk < 258; i += 9) {
      if (this._circDist(i, 0) < 34) continue;
      for (const side of [1, -1]) {
        const p = this.pointAt(i, (WALL_OFF + 1.4) * side);
        m4.makeTranslation(p.x, p.y - 0.15, p.z);
        bols.setMatrixAt(bk++, m4);
      }
    }
    bols.count = bk;
    bols.name = 'oldtown-bollards';
    if (bk) this.group.add(bols);
  }

  /** One arched gateway straddling a width pinch: two masonry piers, a voussoir
   *  ring between them and the building mass carried over the top. Bible calls
   *  for a 4.2–5.0 m opening at 4.6 m clear; this road is far wider than a real
   *  old-town street, so the OPENING tracks the pinched carriageway and the
   *  clear height is set above anything a crest can throw a car to (crests are
   *  already excluded from pinches by `_buildCrests`). */
  _buildArchGateway(mid, F) {
    const CAR_R = 1.8;
    const w = this.widthAt(mid);
    const lat = w + 1.5 + CAR_R + 0.3;                  // pier centre
    const clear = 6.4;                                  // soffit height
    const stone = this._archStoneMat || (this._archStoneMat = new THREE.MeshStandardMaterial({
      map: stoneTexture(), roughness: 0.92, envMapIntensity: 0.35,
    }));
    // one facade material for BOTH gateways — a fresh pair of 192x256 canvases
    // per arch is pure waste, and disposeSubtree frees a shared material once
    const faceMat = this._archFaceMat || (this._archFaceMat = new THREE.MeshStandardMaterial({
      map: townhouseTexture({ render: '#a89c88' }), roughness: 0.88,
      emissive: 0xffffff, emissiveMap: townhouseGlowTexture(),
      emissiveIntensity: (this.T.hutGlow ?? 1) * 0.8,
    }));
    const g = new THREE.Group();
    const c = this.center[mid];
    const pierW = 2.6, pierD = 5.0;
    for (const side of [1, -1]) {
      const pier = new THREE.Mesh(new THREE.BoxGeometry(pierW, clear, pierD), stone);
      pier.position.set(side * lat, clear / 2, 0);
      pier.castShadow = pier.receiveShadow = true;
      g.add(pier);
      const p = this.pointAt(mid, lat * side);
      this.solids.push({ x: p.x, z: p.z, r: 1.55, y: p.y, mat: 'stone' });
      this._addShadow(p.x, p.z, 2.4, p.y);
    }
    // voussoir ring: a close-laid semicircle of wedge blocks over the opening.
    // Spacing matters — at nine blocks over a 35 u arc it read as loose rubble
    // rather than an arch, so they are laid nearly edge to edge.
    const span = lat - pierW * 0.5;
    const RISE = 0.5;
    const VN = 16;
    for (let s = 0; s <= VN; s++) {
      const a = (s / VN) * Math.PI;
      const blk = new THREE.Mesh(new THREE.BoxGeometry(2.9, 1.5, pierD), stone);
      blk.position.set(-Math.cos(a) * span, clear + Math.sin(a) * span * RISE, 0);
      blk.rotation.z = a - Math.PI / 2;
      blk.castShadow = true;
      g.add(blk);
    }
    // the storey carried over the arch — this is a BUILDING you drive through,
    // so it is built as a short TERRACE of unit-width bays rather than one
    // stretched box, which is what makes it read as a gatehouse
    const total = lat * 2 + pierW;
    const bays = Math.max(3, Math.round(total / F.unit));
    const bw = total / bays;
    const yOver = clear + span * RISE + 2.8;
    for (let s = 0; s < bays; s++) {
      const x = -total / 2 + bw * (s + 0.5);
      const over = new THREE.Mesh(new THREE.BoxGeometry(bw * 1.01, 5.4, pierD * 1.3), faceMat);
      over.position.set(x, yOver, 0);
      over.castShadow = over.receiveShadow = true;
      g.add(over);
    }
    const roof = new THREE.Mesh(gablePrismGeo(), new THREE.MeshStandardMaterial({
      color: this.T.hutRoof ?? 0x565c66, flatShading: true, roughness: 0.72,
    }));
    // the gatehouse spans the street, so its ridge runs ACROSS it (local +X)
    // and the pitches fall up and down the road — the prism's own orientation
    roof.scale.set(total, 2.6, pierD * 1.36);
    roof.position.set(0, yOver + 2.7, 0);
    roof.castShadow = true;
    g.add(roof);
    // a lantern hung under the keystone
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.34, 8, 6),
      new THREE.MeshBasicMaterial({ color: this.T.lamps?.color ?? 0xffb14a }));
    lamp.position.set(0, clear + span * RISE - 1.4, 0);
    g.add(lamp);
    g.position.set(c.x, c.y, c.z);
    g.rotation.y = this.headingAt(mid);                 // local +x = road normal
    this.group.add(g);
  }

  /** The one landmark: a cathedral campanile beside the summit square, tall
   *  enough to sit above the frontage from anywhere on the upper half of the
   *  lap. Hand-placed rather than scattered, because "visible from three
   *  points on the route" is a placement requirement, not a density. */
  _buildCampanile() {
    const want = (0.45 * N) | 0;
    let at = null;
    for (let d = 0; d < 90 && !at; d += 6) {
      for (const i of [(want + d) % N, (want - d + N) % N]) {
        for (const side of [1, -1]) {
          for (const lat of [34, 42, 50]) {
            const p = this.pointAt(i, lat * side);
            if (!this._clearsRoad(p.x, p.z, 5.2, 3)) continue;
            at = p; break;
          }
          if (at) break;
        }
        if (at) break;
      }
    }
    if (!at) return;
    const y = this.terrainHeight(at.x, at.z) - 0.6;
    const stone = new THREE.MeshStandardMaterial({
      map: stoneTexture(), roughness: 0.92, envMapIntensity: 0.35,
    });
    const g = new THREE.Group();
    const shaft = new THREE.Mesh(new THREE.BoxGeometry(7.4, 30, 7.4), stone);
    shaft.position.y = 15;
    shaft.castShadow = shaft.receiveShadow = true;
    g.add(shaft);
    // belfry: an open lantern stage, lit, which is what makes it read at night
    const belfry = new THREE.Mesh(new THREE.BoxGeometry(8.2, 5.0, 8.2),
      new THREE.MeshBasicMaterial({ color: 0xffc76a }));
    belfry.position.y = 32.4;
    g.add(belfry);
    const cornice = new THREE.Mesh(new THREE.BoxGeometry(9.4, 0.9, 9.4), stone);
    cornice.position.y = 35.2;
    g.add(cornice);
    const spire = new THREE.Mesh(new THREE.ConeGeometry(6.2, 9.5, 4),
      new THREE.MeshStandardMaterial({
        color: this.T.hutRoof ?? 0x33363c, flatShading: true, roughness: 0.7,
      }));
    spire.rotation.y = Math.PI / 4;
    spire.position.y = 40.4;
    spire.castShadow = true;
    g.add(spire);
    g.position.set(at.x, y, at.z);
    g.rotation.y = Math.random() * Math.PI;
    g.name = 'oldtown-campanile';
    this.group.add(g);
    this.solids.push({ x: at.x, z: at.z, r: 5.4, y: y + 0.6, mat: 'hut' });
    this._addShadow(at.x, at.z, 7.4, y);
  }

  _buildTerrain() {
    const T = this.T;
    const STRATA = ['#c98b52', '#a45f34', '#b5764a', '#8d4c2a', '#cfa06a', '#96552f']
      .map((c) => new THREE.Color(c));
    // TWO PATCHES, not one 4200 u plane at a uniform 10 u.
    //
    // The old single grid was 352 800 triangles — 63–72 % of every world's
    // entire budget — spread evenly out to ±2100 u. But no circuit reaches
    // past ~320 u from the origin and fog closes between 1150 and 1600 u, so
    // the great majority of those triangles were drawn inside opaque fog.
    //
    //   near: ±1000 u at 10 u cells (80 k tris) — three times the widest
    //         circuit, and 10 u is LOAD-BEARING: it guarantees no triangle can
    //         span a road ribbon and rise through it (cap window 25.2 ≥ 11 +
    //         cell diagonal). This is the only region that can touch a road.
    //   far : the full 4200 u at 40 u cells (22 k tris) — distant hills seen
    //         through haze, where a 40 u facet is indistinguishable.
    //
    // The far patch is dropped 0.4 u so the near one always wins where they
    // overlap: no seam stitching, no T-junction cracks, and at that distance
    // the step is well inside the fog.
    //
    // Physics is untouched: terrainHeight() is analytic (_blendHeight), it
    // never samples this mesh, so nothing here can move a car.
    const SIZE = 2000, SEG = 200;
    const UNITS_PER_TILE = 87.5;                 // 4200/48 — keep texel density
    this._buildFarTerrain(4200, 105, UNITS_PER_TILE);
    // THE WORLD NEVER ENDS ("no white stuff like this ever"): an immense
    // ground-toned disk under everything, far past every camera reach. Any
    // view that outruns the terrain patches - the roam TOP FAR camera at the
    // world edge was the reproduced case - lands on fogged ground, never on
    // raw background. Coast worlds' seas draw over it; fog owns the far end.
    {
      const skirt = new THREE.Mesh(
        new THREE.CircleGeometry(9000, 48),
        new THREE.MeshStandardMaterial({
          color: new THREE.Color(T.terrainLow).lerp(new THREE.Color(T.terrainHigh), 0.4),
          roughness: 1,
        })
      );
      skirt.geometry.rotateX(-Math.PI / 2);
      // seat it under the world's true floor: gorges carve to -30, rivers and
      // coasts to -8 - a fixed depth would fill them with a flat wash
      let floor = -3.2 - (T.hillDrop || 0);
      for (let gx = -1000; gx <= 1000; gx += 80) {
        for (let gz = -1000; gz <= 1000; gz += 80) {
          floor = Math.min(floor, this.terrainHeight(gx, gz));
        }
      }
      if (this._gorge) floor = Math.min(floor, this._gorge.floorY);
      for (const G of this._jumpGorges ?? []) floor = Math.min(floor, G.floorY);
      skirt.position.y = floor - 2.5;
      skirt.name = 'world-skirt';
      this.group.add(skirt);
    }
    const geo = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const cLow = new THREE.Color(T.terrainLow);
    const cHigh = new THREE.Color(T.terrainHigh);
    const cDirt = new THREE.Color(T.terrainDirt);
    const tmp = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      const far = Math.max(Math.abs(x), Math.abs(z)) > 900;
      let h = far
        // skip the track-distance falloff far away, but keep the FULL hill
        // noise: dropping octaves here left a visible ±2.4 u step at the 900 u
        // ring where the two height functions disagreed
        ? this._hillNoise(x, z)
        : this._terrainMeshHeight(x, z);
      // the far branch skips _terrainMeshHeight and with it the coast sink —
      // reapply it or the bay grows hills past 900 u
      if (far && T.coast) h = this._coastDepress(x, z, h, 9999);
      pos.setY(i, h - 0.12);
      const t = THREE.MathUtils.clamp((h + 2) / 7, 0, 1);
      tmp.copy(cLow).lerp(cHigh, t);
      // a sand ring where coastal ground meets the water
      if (T.coast) {
        const sand = 1 - THREE.MathUtils.smoothstep(h, -0.6, 1.2);
        if (sand > 0 && h > -3.5) tmp.lerp(new THREE.Color('#d8c9a0'), sand * 0.85);
      }
      // sprinkle dirt patches
      const dirt = Math.max(0, Math.sin(x * 0.045 + 2) * Math.sin(z * 0.05) - 0.72) * 3;
      tmp.lerp(cDirt, THREE.MathUtils.clamp(dirt, 0, 0.55));
      // Valley shading: hollows sit a little deeper in tone than the crests, so
      // the rolling ground reads as form instead of a flat wash. Gentler than
      // it was (0.84) because this MULTIPLIES a colour that is already lerping
      // down to terrainLow in the same hollows — the two stack, and on a dark
      // world the bottom of a dip came out ~3.6x darker than the rise before
      // it. Measured on Ember: the road and the lava field both fell to a mean
      // of 9/255 in the low sections, so there was no way to see where to
      // drive. Form, not a hole.
      tmp.multiplyScalar(0.93 + 0.07 * t);
      // the hero gorge is cut through red-rock strata: banded ochre/rust walls
      // fading back to the snowfield at the rim
      if (this._gorge || this._jumpGorges?.length) {
        const cut = this._gorgeCut(x, z);
        if (cut > 0.6) {
          const band = STRATA[((Math.floor(h * 0.42) % STRATA.length) + STRATA.length) % STRATA.length];
          tmp.lerp(band, THREE.MathUtils.clamp(cut / 6, 0, 1) * 0.94);
        }
      }
      // facet life: a per-vertex tone wobble (deterministic, rebuild-stable)
      // so gentle ground that saturates the height ramp still breaks into a
      // soft patchwork instead of one flat sheet
      const tj = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
      tmp.multiplyScalar(0.92 + (tj - Math.floor(tj)) * 0.13);
      colors[i * 3] = tmp.r; colors[i * 3 + 1] = tmp.g; colors[i * 3 + 2] = tmp.b;
    }
    this._slopeRock(pos, colors, cHigh);
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    const REPEAT = SIZE / UNITS_PER_TILE;        // same texel density as before
    const gtex = groundTexture(T.ground).clone();
    gtex.needsUpdate = true;
    gtex.repeat.set(REPEAT, REPEAT);
    // 2×, not 4×: the ground is by far the largest surface on screen and the
    // facet mosaic now carries the detail the anisotropic filtering used to be
    // paying for. Buys back part of what flat shading + the facet maths cost.
    gtex.anisotropy = 2;
    const mat = new THREE.MeshStandardMaterial({
      // FLAT SHADING IS THE WHOLE LOOK and it is free: three derives the face
      // normal from screen-space derivatives of vViewPosition, so every
      // triangle gets one constant tone with no extra geometry, no extra
      // attribute and no extra draw call.
      map: gtex, vertexColors: true, roughness: 1, metalness: 0, flatShading: true,
    });
    this._facetGround(mat, SEG / REPEAT);
    const ground = new THREE.Mesh(geo, mat);
    ground.receiveShadow = true;
    this.group.add(ground);
  }

  /** The distant ring of the ground, at a quarter of the near patch's
   *  resolution. Everything out here is seen through haze and fog, so it needs
   *  height and tone but not detail. Heights come from `_hillNoise` alone,
   *  which is what the old grid already switched to beyond 900 u — using the
   *  full mesh height function here would only cost time for a result nothing
   *  can resolve. No shadow receipt: nothing casts this far out. */
  _buildFarTerrain(size, seg, unitsPerTile) {
    const T = this.T;
    const geo = new THREE.PlaneGeometry(size, size, seg, seg);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const cLow = new THREE.Color(T.terrainLow);
    const cHigh = new THREE.Color(T.terrainHigh);
    const cDirt = new THREE.Color(T.terrainDirt);
    const tmp = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      let h = this._hillNoise(x, z);
      // On a coast world the sea owns everything seaward, all the way out.
      // Raw hill noise out here put fogged cream hills in the middle of the
      // bay — the "white stuff" past the water. Full depression, no road
      // exemption: no road reaches this ring.
      if (T.coast) h = this._coastDepress(x, z, h, 9999);
      // SINK THIS MESH WHERE THE NEAR PATCH COVERS IT.
      //
      // This ring exists only to carry the horizon PAST the near patch, but it
      // was built across the whole 4200 u plane — including straight under the
      // track — out of raw hill noise, which knows nothing about the road. The
      // near patch is cut down for the carriageway and this one is not, so
      // wherever the road runs through a cutting this mesh sat ABOVE it and
      // painted over it: measured up to 13.7 u proud, across ~50% of the
      // carriageway on Pine Valley, Frost Peak and Redwood. That is the road
      // disappearing under the hillside, and the car driving along under it.
      //
      // The near patch already switches to pure _hillNoise beyond 900 u (same
      // square metric), so the two agree out there and the seam is invisible.
      // Inside that, drop this mesh far enough that it can never show through.
      const m = Math.max(Math.abs(x), Math.abs(z));
      h -= 60 * (1 - smoothstep01((m - 820) / 80));
      pos.setY(i, h - 0.52);                    // 0.4 under the near patch
      const t = THREE.MathUtils.clamp((h + 2) / 7, 0, 1);
      tmp.copy(cLow).lerp(cHigh, t);
      const dirt = Math.max(0, Math.sin(x * 0.045 + 2) * Math.sin(z * 0.05) - 0.72) * 3;
      tmp.lerp(cDirt, THREE.MathUtils.clamp(dirt, 0, 0.55));
      tmp.multiplyScalar(0.93 + 0.07 * t);      // matches the near patch
      // facet life: a per-vertex tone wobble (deterministic, rebuild-stable)
      // so gentle ground that saturates the height ramp still breaks into a
      // soft patchwork instead of one flat sheet
      const tj = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
      tmp.multiplyScalar(0.92 + (tj - Math.floor(tj)) * 0.13);
      colors[i * 3] = tmp.r; colors[i * 3 + 1] = tmp.g; colors[i * 3 + 2] = tmp.b;
    }
    this._slopeRock(pos, colors, cHigh);
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    const REPEAT = size / unitsPerTile;
    const gtex = groundTexture(T.ground).clone();
    gtex.needsUpdate = true;
    gtex.repeat.set(REPEAT, REPEAT);
    gtex.anisotropy = 1;
    const mat = new THREE.MeshStandardMaterial({
      map: gtex, vertexColors: true, roughness: 1, metalness: 0, flatShading: true,
    });
    this._facetGround(mat, seg / REPEAT);
    this.group.add(new THREE.Mesh(geo, mat));
  }

  /** Per-facet ground tone + slope tint, injected into the standard shader.
   *
   *  Flat shading alone gives each triangle a constant *light* response; the
   *  reference art also gives each one a slightly different *albedo*, which is
   *  what makes low-poly ground read as a hand-placed mosaic. Two additions,
   *  together about a dozen fragment ALU ops and zero new varyings/attributes:
   *
   *   1. a hash keyed on the terrain quad index (derived from the map uv, which
   *      is already a varying) — deterministic in world space, so it never
   *      shimmers as the camera moves, and aligned to the 10 u grid so tone
   *      steps land exactly on quad edges;
   *   2. a slope tint toward the theme's scree colour, using the world-space
   *      geometric normal (`normal` under FLAT_SHADED, rotated back out of view
   *      space by the always-declared `viewMatrix` uniform). Steep faces turn to
   *      bare rock/earth the way a real hillside does; flat ground is untouched.
   */
  _facetGround(mat, cellScale) {
    const T = this.T;
    const scree = new THREE.Color(T.terrainScree !== undefined ? T.terrainScree : T.terrainDirt);
    // NOTE ON UNITS: `slope` below is 1 − |n·up|, not an angle. The open field
    // only reaches ~20° (slope ≈ 0.06), so the useful band is TINY — an
    // innocent-looking [0.16, 0.55] range never fires at all. Road cuts, gorge
    // walls and the sunk-field rims are the only places that reach 0.2+.
    const amp = T.facetAmp !== undefined ? T.facetAmp : 0.34;
    const range = T.screeSlope || [0.018, 0.115];
    mat.onBeforeCompile = (sh) => {
      mat.userData.shader = sh;             // live-tunable from the gfx harness
      sh.uniforms.uFacetCell = { value: cellScale };
      sh.uniforms.uFacetAmp = { value: amp };
      sh.uniforms.uScree = { value: scree };
      sh.uniforms.uScreeRange = { value: new THREE.Vector2(range[0], range[1]) };
      sh.uniforms.uScreeMax = { value: T.screeMax !== undefined ? T.screeMax : 0.45 };
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>
          uniform float uFacetCell, uFacetAmp, uScreeMax;
          uniform vec3 uScree;
          uniform vec2 uScreeRange;`)
        .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
          {
            // sine-free hash: the classic fract(sin(dot(..))*43758) DEGENERATES
            // here — the cell index runs to ~420, and sin() of an argument that
            // large is near-constant on SwiftShader and on plenty of mobile
            // GPUs, so the whole field came out one flat tone. This one is
            // exact in float and costs less.
            vec2 fcell = floor(vMapUv * uFacetCell);
            vec3 fp = fract(vec3(fcell.xyx) * 0.1031);
            fp += dot(fp, fp.yzx + 33.33);
            float fh = fract((fp.x + fp.y) * fp.z);
            diffuseColor.rgb *= 1.0 + (fh - 0.5) * uFacetAmp;
            vec3 wN = normalize((vec4(normal, 0.0) * viewMatrix).xyz);
            float slope = 1.0 - clamp(abs(wN.y), 0.0, 1.0);
            diffuseColor.rgb = mix(diffuseColor.rgb, uScree,
              uScreeMax * smoothstep(uScreeRange.x, uScreeRange.y, slope));
          }`);
    };
    // distinct key so this program is not shared with plain ground materials
    mat.customProgramCacheKey = () => 'facetGround';
  }


  /** The scattered dwellings — the buildings a player sees most of.
   *
   *  This used to own its geometry: one BoxGeometry wall and one ConeGeometry
   *  roof, composed at a random width and height. Two consequences, both
   *  reported. It was ONE SHAPE repeated ten times a world, so a village read
   *  as a row of identical crates; and because the roof cone was never
   *  translated to its own base, half of every roof sat inside the house — a
   *  bug that also existed, independently and identically, in the spur
   *  farmstead's barn builder.
   *
   *  It now stamps the shared HOUSE_TEMPLATES like every other structure in
   *  the game. Three cottage variants instead of one box, colours from the
   *  theme kit, base anchoring inherited from the one place that does it, and
   *  the parts land in the same five InstancedMeshes as the farmsteads rather
   *  than two more of their own.
   */
  _buildHuts(m4) {
    if (this.T.hutStyle === 'igloo') return this._buildIgloos(m4);
    const COUNT = this.T.hutCount !== undefined ? this.T.hutCount : 14;
    const kitName = this.T.elements
      || ELEMENT_KIT_BY_THEME[this.level && this.level.theme] || 'farm';
    const K = ELEMENT_KITS[kitName] ?? ELEMENT_KITS.farm;
    const B = this._elemB();
    let placed = 0;
    // hutZone [f0, f1] clusters the dwellings into one stretch of the lap (the
    // valley village at the foot of a pass); f0 > f1 wraps through the line
    // A COTTAGE NEVER STANDS ON THE BEACH. This scatter was the last building
    // generator that did not ask, so on HARBOR QUAY one hut landed on the sand
    // seaward of the seafront road — a lone red-roofed house out on the strand
    // with the marina behind it. Every other placer already gates on the same
    // two tests; this one now does too.
    const raw = this.T.hutZone
      ? () => this._zonePos(this.T.hutZone, 20, 62)
      : () => this._trackSidePos(24, 64);
    const makePos = () => {
      const p = raw();
      return p && !this._inWater(p.x, p.z) && !this._onQuayStrip(p.x, p.z) ? p : null;
    };
    this._scatter(COUNT, makePos, (p) => {
      const type = COTTAGES[(Math.random() * COTTAGES.length) | 0];
      // SCALE. The car is 4.4 u long and 2.6 u wide; a cottage is a bit wider
      // than a car is long. The templates are authored at that size, so this
      // is variation, not sizing — keep it narrow or the village stops looking
      // like one settlement.
      const scale = 0.92 + Math.random() * 0.30;
      const rad = HOUSE_TEMPLATES[type].r * scale;
      // A HOUSE MUST NEVER STAND ON THE ROAD.
      //
      // `_trackSidePos` / `_zonePos` measure their offset from ONE track index,
      // so on a lap that doubles back a hut placed a clear 20 u from its own leg
      // can be sitting on the carriageway of the NEXT one. Measured, FURKA RIDGE
      // and ESTONIA CRESTS each had FOUR huts whose footprint overlapped the
      // road — a 50-hull wall you cannot see coming, reported as "remove the
      // house". `_clearsRoad` re-checks against the nearest leg anywhere on the
      // lap, and the margin is generous because a building is the one obstacle
      // that can end a race outright.
      if (!this._clearsRoad(p.x, p.z, rad, 3.5)) return;
      const before = this._batchLens(B);
      const el = this._element(B, type, p.x, p.z, Math.random() * Math.PI * 2, K, scale);
      // A building is a target, not scenery: register it so cannon rounds and
      // blasts can level it. The slots are resolved to real meshes in
      // `_realizeElements`, once the batch has been turned into geometry.
      this._registerElementBuilding({
        x: p.x, z: p.z, y: el.y, r: rad * 0.62, w: rad * 2, h: 5 * scale,
        hp: 120, solid: el.solid, roofColor: this.T.hutRoof,
      }, before, this._batchLens(B));
      placed++;
    });
  }

  /** Blank a destroyed building's instances and drop its collider, so you can
   *  drive through the rubble afterwards. Returns its debris recipe. */
  smashBuilding(b) {
    if (b.dead) return null;
    b.dead = true;
    const zero = new THREE.Matrix4().makeScale(0, 0, 0);
    for (const p of b.parts) {
      // Keep the original transform BEFORE blanking it, so the world can be
      // put back between races. Captured once — a rebuilt building that is
      // smashed again must not overwrite the pristine matrix with itself.
      if (!p.m0) { p.m0 = new THREE.Matrix4(); p.mesh.getMatrixAt(p.i, p.m0); }
      p.mesh.setMatrixAt(p.i, zero);
      p.mesh.instanceMatrix.needsUpdate = true;
    }
    const si = this.solids.indexOf(b.solid);
    if (si >= 0) this.solids.splice(si, 1);
    return b;
  }

  /** Put every smashed building and tree back.
   *
   *  `resetRace` restored props, herds, pickups, husks and car parts, but never
   *  the world's buildings or trees — so a house you flattened in race 1 was
   *  still rubble in race 2 of the same session, and the "STRUCTURE HOLDING"
   *  hint fired once per building per PAGE LOAD rather than per race. Starting
   *  a race on a world someone has already levelled is not a fresh start. */
  restoreSmashed() {
    let buildings = 0, trees = 0;
    for (const b of this.buildings ?? []) {
      if (!b.dead) continue;
      for (const p of b.parts) {
        if (!p.m0) continue;
        p.mesh.setMatrixAt(p.i, p.m0);
        p.mesh.instanceMatrix.needsUpdate = true;
      }
      b.dead = false;
      b.hp = b.maxHp ?? b.hp;
      b._hinted = false; b._hinted2 = false;
      if (b.solid && !this.solids.includes(b.solid)) this.solids.push(b.solid);
      buildings++;
    }
    for (const tr of this.trees ?? []) {
      if (!tr.dead) continue;
      for (const part of tr.parts ?? []) {
        const m = part.m0 && part.m0[tr.id];
        if (!m) continue;
        part.setMatrixAt(tr.id, m);
        part.instanceMatrix.needsUpdate = true;
      }
      tr.dead = false;
      tr.hp = undefined;                 // re-derived from size on the next hit
      trees++;
    }
    return { buildings, trees };
  }

  /** Glacial dwellings: white ice-block domes (half-sunk spheres) with a short
   *  entrance tunnel. Same trackside placement + SOLID 'hut' collider as huts. */
  _buildIgloos(m4) {
    const COUNT = this.T.hutCount !== undefined ? this.T.hutCount : 8;
    const domeGeo = new THREE.SphereGeometry(1, 16, 10);
    const tunnelGeo = new THREE.CylinderGeometry(1, 1, 1, 10, 1, false);
    tunnelGeo.rotateX(Math.PI / 2);                 // axis along local Z
    const iceMat = new THREE.MeshStandardMaterial({
      map: iglooTexture(), roughness: 0.75, envMapIntensity: 0.55,
    });
    const doorMat = new THREE.MeshStandardMaterial({ color: 0x22303c, roughness: 1 });
    const domes = new THREE.InstancedMesh(domeGeo, iceMat, COUNT);
    const tunnels = new THREE.InstancedMesh(tunnelGeo, iceMat, COUNT);
    const doors = new THREE.InstancedMesh(new THREE.CircleGeometry(1, 10), doorMat, COUNT);
    domes.castShadow = tunnels.castShadow = true;
    const q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
    let placed = 0;
    // cliff-walled levels: the canyon walls open up around the start line, so
    // the village sits in that bowl where racers actually see it
    const makePos = this.T.cliffWalls
      ? () => {
          const gi = (((Math.random() * 150 - 75) | 0) + N) % N;
          const side = Math.random() < 0.5 ? 1 : -1;
          const p = this.pointAt(gi, side * (15 + Math.random() * 22));
          if (this._distToTrack(p.x, p.z) < 14) return null;
          return { x: p.x, z: p.z };
        }
      : () => this._trackSidePos(18, 52);
    this._scatter(COUNT, makePos, (p) => {
      const R = 3.2 + Math.random() * 1.6;          // dome radius
      const rot = Math.random() * Math.PI * 2;      // entrance direction
      const y = this.terrainHeight(p.x, p.z) - R * 0.35;   // half-sunk into the snow
      q.setFromAxisAngle(up, rot);
      m4.compose(new THREE.Vector3(p.x, y, p.z), q, new THREE.Vector3(R, R * 0.92, R));
      domes.setMatrixAt(placed, m4);
      // entrance tunnel pokes out of the dome along the rotated +Z
      const dx = Math.sin(rot), dz = Math.cos(rot);
      const tr = R * 0.34;
      const tx = p.x + dx * R * 0.92, tz = p.z + dz * R * 0.92;
      m4.compose(new THREE.Vector3(tx, y + R * 0.35 + tr * 0.4, tz), q, new THREE.Vector3(tr, tr, R * 0.7));
      tunnels.setMatrixAt(placed, m4);
      // dark doorway disc capping the tunnel mouth
      m4.compose(
        new THREE.Vector3(tx + dx * R * 0.36, y + R * 0.35 + tr * 0.4, tz + dz * R * 0.36),
        q, new THREE.Vector3(tr * 0.82, tr * 0.82, 1)
      );
      doors.setMatrixAt(placed, m4);
      const solid = { x: p.x, z: p.z, r: R * 0.95, y: y + R * 0.35, mat: 'hut' };
      this.solids.push(solid);
      // ice blocks come apart easier than stone walls
      this.buildings.push({
        x: p.x, z: p.z, y, r: R * 0.95, w: R * 2, h: R, hp: 90, solid,
        parts: [{ mesh: domes, i: placed }, { mesh: tunnels, i: placed }, { mesh: doors, i: placed }],
        roofColor: 0xdfeef8,
      });
      this._addShadow(p.x, p.z, R * 1.3);
      placed++;
    });
    domes.count = tunnels.count = doors.count = placed;
    this.group.add(domes, tunnels, doors);
  }

  _buildTrackside(m4) {
    const q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
    // tire stacks guarding the sharpest corners (2 or 3 tires high)
    const tireGeo = new THREE.TorusGeometry(0.62, 0.3, 8, 14);
    tireGeo.rotateX(Math.PI / 2);
    const tires = new THREE.InstancedMesh(
      tireGeo, new THREE.MeshStandardMaterial({ color: 0x22201c, roughness: 0.95 }), 190
    );
    tires.castShadow = true;
    const tcolor = new THREE.Color();
    let tk = 0;
    for (let i = 0; i < N && tk < 180; i += 6) {
      if (this.curvature[i] > 0.017) {
        // outside of the corner: opposite the direction the tangent is turning
        const a = this.tan[i], b = this.tan[(i + 12) % N];
        const side = (a.x * b.z - a.z * b.x) > 0 ? -1 : 1;
        // cliff-walled levels stack the tires right against the rock face;
        // pass levels tuck them inside the stone parapet
        const tireOff = this.T.cliffWalls ? WALL_OFF + 0.8
          : (this.T.retainingWalls || this.T.guardFence || this.T.hedgeBanks)
            ? WALL_OFF + 1.2 : WALL_OFF + 2.2;
        const p = this.pointAt(i, tireOff * side);
        // Same trap as the road cabins: `tireOff` is measured along ONE
        // sample's normal, and on a hairpin the road's other leg swings under
        // it. Measured, 38 of 763 stacks landed inside the drivable width, the
        // worst at lateral 4.01 — a solid on the racing line dressed as
        // trackside furniture. The stack's collider is 1.1.
        if (!this._clearsRoad(p.x, p.z, 1.1, 0.6)) continue;
        const stack = Math.random() < 0.5 ? 3 : 2;
        const ids = [];
        for (let s = 0; s < stack && tk < 180; s++) {
          m4.makeTranslation(p.x + (Math.random() - 0.5) * 0.4, p.y + 0.32 + s * 0.62, p.z + (Math.random() - 0.5) * 0.4);
          tires.setMatrixAt(tk, m4);
          tcolor.set(s === stack - 1 && Math.random() < 0.5 ? 0xd8d2c2 : 0x22201c);
          ids.push(tk);
          tires.setColorAt(tk++, tcolor);
        }
        // one smashable entry per STACK (see smashTireStack)
        if (ids.length) {
          this.tireStacks.push({ x: p.x, z: p.z, y: p.y, r: 1.1, ids, dead: false });
          this._addShadow(p.x, p.z, 1.45, p.y);
        }
      }
    }
    tires.count = tk;
    this._tireMesh = tires;
    this.group.add(tires);

    // hay bales
    const hayCount = this.T.hayCount !== undefined ? this.T.hayCount : 50;
    const hayGeo = new THREE.CylinderGeometry(0.8, 0.8, 1.5, 10);
    hayGeo.rotateZ(Math.PI / 2);
    const hay = new THREE.InstancedMesh(
      hayGeo, new THREE.MeshStandardMaterial({ color: this.T.hayColor, roughness: 1 }), Math.max(hayCount, 1)
    );
    hay.castShadow = true;
    let hk = 0;
    // hayNear/hayFar move the stack off the verge: a world whose road edge is
    // already occupied (FARMLAND's hedge banks) puts its bales in the field
    // behind the hedge, where a real silage stack sits anyway. Unset = 12.5-20,
    // the figures every other world has always used.
    const hayNear = this.T.hayNear ?? 12.5, hayFar = this.T.hayFar ?? 20;
    // A straw bale standing in the river is not scenery, it is a mistake. The
    // rejection lives in the position generator so a wet spot is RETRIED
    // rather than counting as a bale spent.
    this._scatter(hayCount, () => {
      const p = this._trackSidePos(hayNear, hayFar);
      return p && !this._inWater(p.x, p.z) ? p : null;
    }, (p) => {
      q.setFromAxisAngle(up, Math.random() * Math.PI);
      m4.compose(new THREE.Vector3(p.x, this.terrainHeight(p.x, p.z) + 0.8, p.z), q, new THREE.Vector3(1, 1, 1));
      hay.setMatrixAt(hk++, m4);
      this._addShadow(p.x, p.z, 1.6);
    });
    hay.count = hk;
    this.group.add(hay);
  }

  _buildBanners() {
    // sponsor boards facing the track. NEO-KYOTO swaps in holographic boards:
    // neon sponsor palettes on unlit (MeshBasic) panels so they burn through
    // the night and bloom picks up the lettering.
    const neonStyle = this.T.bannerStyle === 'neon';
    const post = new THREE.CylinderGeometry(0.14, 0.16, 3.4, 7);
    const postMat = new THREE.MeshStandardMaterial({
      color: 0x4a4640, roughness: 0.35, metalness: 0.7, envMapIntensity: 0.5,
    });
    const boardGeo = new THREE.PlaneGeometry(9, 2.2);
    const sponsors = neonStyle ? NEON_SPONSORS : SPONSORS;
    const mats = sponsors.map(([text, bg, fg]) => neonStyle
      ? new THREE.MeshBasicMaterial({ map: bannerTexture(text, bg, fg), side: THREE.DoubleSide })
      : new THREE.MeshStandardMaterial({ map: bannerTexture(text, bg, fg), roughness: 0.8, side: THREE.DoubleSide }));
    // cliff-walled levels stand the boards right at the rock face so they stay
    // inside the canyon instead of vanishing behind it; pass levels stand them
    // clear of the stone parapet
    const boardOff = this.T.cliffWalls ? WALL_OFF + 0.75
      : (this.T.retainingWalls || this.T.guardFence || this.T.hedgeBanks)
        ? WALL_OFF + 6.4 : WALL_OFF + 3.6;
    for (let b = 0; b < 10; b++) {
      const i = ((b + 0.5) * N / 10) | 0;
      if (this.curvature[i] > this.T.boardMaxCurv) continue; // keep boards off tight corners
      let side = b % 2 === 0 ? 1 : -1;
      let p = this.pointAt(i, boardOff * side);
      // a harbour quay is not an ad site: a board between the seafront road
      // and the water blocks the one view the world is built around. Stand
      // it on the land side instead (or drop it if both sides are quay).
      if (this._onQuayStrip(p.x, p.z)) {
        side = -side;
        p = this.pointAt(i, boardOff * side);
        if (this._onQuayStrip(p.x, p.z)) continue;
      }
      const g = new THREE.Group();
      const board = new THREE.Mesh(boardGeo, mats[b % mats.length]);
      board.position.y = 2.6;
      board.castShadow = true;
      g.add(board);
      for (const s of [-1, 1]) {
        const pl = new THREE.Mesh(post, postMat);
        pl.position.set(s * 4, 1.7, -0.1);
        g.add(pl);
      }
      g.position.set(p.x, this.terrainHeight(p.x, p.z), p.z);
      // Boards face ONCOMING traffic, both sides of the road alike. The yaw
      // used to depend on which side the board stood, so every board on one
      // side presented its back - and because the material is DoubleSide you
      // read the lettering mirrored rather than seeing nothing.
      g.rotation.y = this.headingAt(i) + Math.PI;
      this.group.add(g);
      this.banners.push({
        x: p.x, z: p.z, y: g.position.y, r: 1.3, dead: false,
        group: g, board, heading: g.rotation.y,
      });
      this._addShadow(p.x, p.z, 3.2);
    }
  }

  /** Knock sponsor board `b` down: hide the standing group and hand back one
   *  standalone board+post group for the game to fling. Null if already dead. */
  smashBanner(b) {
    if (!b || b.dead) return null;
    b.dead = true;
    // guard-fence bay: zero its instance and hand back a loose bay to fling
    if (b.kind === 'fence') {
      if (!this._guardFenceMesh) return null;
      _m4.makeScale(0, 0, 0);
      this._guardFenceMesh.setMatrixAt(b.id, _m4);
      this._guardFenceMesh.instanceMatrix.needsUpdate = true;
      const bay = new THREE.Mesh(this._guardFenceGeo, this._guardFenceMat);
      bay.castShadow = true;
      bay.position.set(b.x, b.y, b.z);
      bay.rotation.y = b.heading;
      return bay;
    }
    b.group.visible = false;
    const g = new THREE.Group();
    const board = new THREE.Mesh(b.board.geometry, b.board.material);
    board.position.y = 2.6;
    g.add(board);
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.16, 3.4, 7),
      new THREE.MeshStandardMaterial({ color: 0x4a4640, roughness: 0.6, metalness: 0.5 })
    );
    post.position.set(0, 1.7, -0.1);
    g.add(post);
    g.position.set(b.x, b.y, b.z);
    g.rotation.y = b.heading;
    return g;
  }

  /** Smash tire stack `st`: zero its instances and hand back 2-3 loose tire
   *  meshes (NOT added to the scene) for the game to fling. Null if dead. */
  smashTireStack(st) {
    if (!st || st.dead || !this._tireMesh) return null;
    st.dead = true;
    _m4.makeScale(0, 0, 0);
    for (const id of st.ids) this._tireMesh.setMatrixAt(id, _m4);
    this._tireMesh.instanceMatrix.needsUpdate = true;
    if (!this._looseTireGeo) {
      this._looseTireGeo = new THREE.TorusGeometry(0.62, 0.3, 6, 10);
      this._looseTireGeo.rotateX(Math.PI / 2);
      this._looseTireMat = new THREE.MeshStandardMaterial({ color: 0x22201c, roughness: 0.95 });
    }
    return st.ids.map((id, k) => {
      const m = new THREE.Mesh(this._looseTireGeo, this._looseTireMat);
      m.castShadow = true;
      m.position.set(st.x, st.y + 0.32 + k * 0.62, st.z);
      return m;
    });
  }

  _buildGrandstand() {
    // stepped stand full of spectators near the start line
    const i = (N - 40 + N) % N;
    const p = this.pointAt(i, WALL_OFF + 16);
    // STAND IT ON THE GROUND, not at road height. `pointAt` returns the ROAD's
    // elevation, and this sits 26 u off the centreline where the terrain has
    // usually fallen away — measured on FURKA RIDGE the stand and all three of
    // its colliders hovered 2.0 to 2.3 u in the air. NATURE.md rule 6:
    // everything that stands, stands ON the ground.
    p.y = this.terrainHeight(p.x, p.z);
    const g = new THREE.Group();
    const crowd = crowdTexture();
    const frame = new THREE.MeshStandardMaterial({ color: 0x5d4426, roughness: 0.9 });
    for (let row = 0; row < 3; row++) {
      const step = new THREE.Mesh(
        new THREE.BoxGeometry(20, 2.2, 3.2),
        new THREE.MeshStandardMaterial({ map: crowd, roughness: 1 })
      );
      step.position.set(0, 1.1 + row * 1.9, row * 3.0);
      step.castShadow = true;
      g.add(step);
    }
    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(21, 0.35, 9),
      new THREE.MeshStandardMaterial({ map: awningTexture(), roughness: 0.9 })
    );
    roof.material.map.repeat.set(6, 1);
    roof.position.set(0, 8.6, 3.2);
    roof.rotation.x = 0.14;
    roof.castShadow = true;
    g.add(roof);
    for (const [ox, oz] of [[-9.8, -0.5], [9.8, -0.5], [-9.8, 7.2], [9.8, 7.2]]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.5, 8.6, 0.5), frame);
      leg.position.set(ox, 4.3, oz);
      g.add(leg);
    }
    g.position.copy(p);
    // width runs along the track; step rows climb away from it
    g.rotation.y = this.headingAt(i) + Math.PI / 2;
    this.group.add(g);
    // 3 solid colliders along the 20-unit front face (which runs with the track)
    for (const off of [-7, 0, 7]) {
      const cx = p.x + this.tan[i].x * off;
      const cz = p.z + this.tan[i].z * off;
      // Each collider takes the ground under ITSELF — the stand is 20 u wide
      // and the hillside under it is not level.
      this.solids.push({ x: cx, z: cz, r: 2.5, y: this.terrainHeight(cx, cz), mat: 'metal' });
    }
  }

  /** Wooden plank foot-bridges spanning the canyon overhead. Deck sits at
   *  y=9 — well above the max ramp-jump apex — so cars never clip it. */
  _buildBridges() {
    const count = this.T.bridgeCount | 0;
    if (!count) return;
    const chosen = [];
    for (let i = 60; i < N && chosen.length < count; i += 10) {
      if (this._circDist(i, 0) < 120) continue;                 // clear of the start bowl
      if (this.curvature[i] > 0.02) continue;
      if (this.ramps.some((r) => this._circDist(i, r.index) < 45)) continue;
      if (chosen.some((c) => this._circDist(i, c) < 200)) continue;
      chosen.push(i);
    }
    const span = (WALL_OFF + 4.5) * 2;                          // ends embed into the cliffs
    const deckTex = plankTexture();
    deckTex.repeat.set(9, 1);
    const deckMat = new THREE.MeshStandardMaterial({
      map: deckTex, roughness: 0.8, envMapIntensity: 0.5,
    });
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x6a4a2c, roughness: 0.8, envMapIntensity: 0.5,
    });
    const ropeMat = new THREE.MeshStandardMaterial({ color: 0x8a7048, roughness: 1 });
    for (const i of chosen) {
      const c = this.center[i];
      const g = new THREE.Group();
      const deck = new THREE.Mesh(new THREE.BoxGeometry(span, 0.35, 3.2), deckMat);
      deck.position.y = 9;
      deck.castShadow = deck.receiveShadow = true;
      g.add(deck);
      // under-beams
      for (const s of [-1, 1]) {
        const beam = new THREE.Mesh(new THREE.BoxGeometry(span, 0.28, 0.5), woodMat);
        beam.position.set(0, 8.75, s * 1.15);
        g.add(beam);
      }
      // rope rails on short posts down both edges of the deck
      for (const s of [-1, 1]) {
        for (const ry of [9.6, 10.1]) {
          const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, span, 5), ropeMat);
          rope.rotation.z = Math.PI / 2;
          rope.position.set(0, ry, s * 1.45);
          g.add(rope);
        }
        for (let px = -span / 2 + 1.2; px <= span / 2 - 1.1; px += 3.4) {
          const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 1.25, 6), woodMat);
          post.position.set(px, 9.75, s * 1.45);
          g.add(post);
        }
      }
      // --- SUPPORTS -----------------------------------------------------
      //
      // THE BUG THIS FIXES: the deck sits at a hard-coded 9 u above the road
      // and the original comment said the ends "embed into the cliffs" — which
      // is true on a theme that HAS cliffs. FLUME sets bridgeCount: 3 and no
      // cliffWalls, so its three crossings hung in mid-air with nothing holding
      // them up. Reported as "hanging bridges are flying", and that is exactly
      // what they were doing.
      //
      // Rather than dropping the bridges from cliff-less worlds, both ends now
      // get a timber trestle down to whatever the ground actually is. A
      // structure is either supported or it is not there — it is never floating.
      // Where the theme does have cliff walls the trestle is short and hidden
      // inside the rock, which costs nothing.
      const nrm = this.nrm[i];
      const deckY = c.y + 9;
      let anchored = 0;
      for (const s2 of [-1, 1]) {
        const ex = c.x + nrm.x * s2 * (span / 2 - 0.6);
        const ez = c.z + nrm.z * s2 * (span / 2 - 0.6);
        // Sampled from the same terrain the car drives on, so the pier lands on
        // the ground rather than near it.
        const gy = this.terrainHeight(ex, ez);
        const drop = deckY - gy;
        if (!(drop > 0.4)) { anchored++; continue; }   // already inside solid ground
        // Two legs per end, splayed, plus a cross-brace: a single post under a
        // 25 u span reads as a stilt, not a trestle.
        for (const lean of [-1, 1]) {
          const leg = new THREE.Mesh(
            new THREE.CylinderGeometry(0.16, 0.26, drop, 6),
            woodMat
          );
          leg.castShadow = true;
          leg.position.set(
            s2 * (span / 2 - 0.6) + lean * 0.1 * s2,
            9 - drop / 2,
            lean * 1.15
          );
          leg.rotation.x = lean * -0.05;
          g.add(leg);
        }
        const brace = new THREE.Mesh(
          new THREE.BoxGeometry(0.16, 0.16, 2.5),
          woodMat
        );
        brace.position.set(s2 * (span / 2 - 0.6), 9 - Math.min(drop * 0.55, drop - 0.3), 0);
        g.add(brace);
        anchored++;
      }
      // A crossing that could not find ground at either end is not scenery, it
      // is a bug with a texture on it.
      if (!anchored) continue;

      g.position.set(c.x, c.y, c.z);      // deck rides at road y + 9, above any jump
      g.rotation.y = this.headingAt(i);   // local X = road normal → deck spans the canyon
      this.group.add(g);
    }
  }

  /** One small palm oasis pond, well off-track. */
  _buildOasis() {
    // hunt for a reasonably flat spot away from the road
    let spot = null;
    for (let tries = 0; tries < 60 && !spot; tries++) {
      const p = this._trackSidePos(34, 58);
      if (!p) continue;
      const h0 = this.terrainHeight(p.x, p.z);
      let flat = true;
      for (const [dx, dz] of [[7, 0], [-7, 0], [0, 7], [0, -7]]) {
        if (Math.abs(this.terrainHeight(p.x + dx, p.z + dz) - h0) > 0.9) { flat = false; break; }
      }
      if (flat) spot = { x: p.x, z: p.z, y: h0 };
    }
    if (!spot) {
      const p = this.pointAt((N * 0.3) | 0, 40);
      spot = { x: p.x, z: p.z, y: this.terrainHeight(p.x, p.z) };
    }
    // pond: darker wet-mud rim under a blue water ellipse
    const rim = new THREE.Mesh(
      new THREE.CircleGeometry(1, 26),
      new THREE.MeshStandardMaterial({ color: 0x6a4a2c, roughness: 0.9 })
    );
    rim.rotation.x = -Math.PI / 2;
    rim.scale.set(8.6, 6.4, 1);
    rim.position.set(spot.x, spot.y + 0.3, spot.z);
    this.group.add(rim);
    const water = new THREE.Mesh(
      new THREE.CircleGeometry(1, 26),
      new THREE.MeshStandardMaterial({ color: 0x2e86c8, roughness: 0.15, metalness: 0.1 })
    );
    water.rotation.x = -Math.PI / 2;
    water.scale.set(7.2, 5.2, 1);
    water.position.set(spot.x, spot.y + 0.38, spot.z);
    this.group.add(water);
    // palms leaning over the water
    const up = new THREE.Vector3(0, 1, 0);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8a6242, roughness: 1 });
    const frondMat = new THREE.MeshStandardMaterial({
      color: 0x2f8a3c, flatShading: true, roughness: 0.9, side: THREE.DoubleSide,
    });
    const leafGeo = new THREE.ConeGeometry(0.5, 2.6, 4);
    leafGeo.rotateZ(-Math.PI / 2);       // axis → +x
    leafGeo.translate(1.15, 0, 0);
    leafGeo.scale(1, 0.28, 0.75);        // flattened frond
    const nPalms = 2 + (Math.random() < 0.5 ? 1 : 0);
    for (let pi = 0; pi < nPalms; pi++) {
      const ang = (pi / nPalms) * Math.PI * 2 + Math.random() * 0.8;
      const px = spot.x + Math.cos(ang) * (7.6 + Math.random() * 1.5);
      const pz = spot.z + Math.sin(ang) * (5.8 + Math.random() * 1.5);
      const g = new THREE.Group();
      const leanDir = Math.atan2(spot.z - pz, spot.x - px);   // lean toward the water
      let tip = new THREE.Vector3(0, 0, 0);
      let tiltA = 0;
      for (let s = 0; s < 3; s++) {
        tiltA += 0.16 + Math.random() * 0.06;
        const len = 1.6;
        const dir = new THREE.Vector3(
          Math.sin(tiltA) * Math.cos(leanDir), Math.cos(tiltA), Math.sin(tiltA) * Math.sin(leanDir)
        );
        const seg = new THREE.Mesh(
          new THREE.CylinderGeometry(0.14 + (2 - s) * 0.035, 0.17 + (2 - s) * 0.035, len, 6),
          trunkMat
        );
        seg.position.copy(tip).addScaledVector(dir, len / 2);
        seg.quaternion.setFromUnitVectors(up, dir);
        seg.castShadow = true;
        g.add(seg);
        tip.addScaledVector(dir, len * 0.96);
      }
      const nLeaves = 5 + (Math.random() < 0.5 ? 1 : 0);
      for (let k = 0; k < nLeaves; k++) {
        const leaf = new THREE.Mesh(leafGeo, frondMat);
        leaf.position.copy(tip);
        const q1 = new THREE.Quaternion().setFromAxisAngle(up, (k / nLeaves) * Math.PI * 2 + Math.random() * 0.5);
        const q2 = new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(0, 0, 1), -0.45 - Math.random() * 0.3
        );
        leaf.quaternion.copy(q1).multiply(q2);
        g.add(leaf);
      }
      // coconuts
      for (let k = 0; k < 2; k++) {
        const nut = new THREE.Mesh(
          new THREE.SphereGeometry(0.17, 6, 5),
          new THREE.MeshStandardMaterial({ color: 0x6a4a26, roughness: 1 })
        );
        nut.position.copy(tip).add(new THREE.Vector3((Math.random() - 0.5) * 0.5, -0.25, (Math.random() - 0.5) * 0.5));
        g.add(nut);
      }
      const s = 0.9 + Math.random() * 0.5;
      g.scale.setScalar(s);
      g.position.set(px, spot.y + 0.25, pz);
      this.group.add(g);
    }
  }

  /** Jungle streams: blue water ribbons with foam-painted banks, meandering
   *  across the circuit slightly BELOW road level (the road bridges over).
   *  Each river threads through one of the road's mud puddles — that puddle
   *  IS the crossing hazard, so the existing puddle mechanic covers it. */
  /** Build the one continuous waterway planned by _planRiver: a shoreline band
   *  laid in the carved bed, the water ribbon inside it (lifting to a shallow
   *  sheet where it washes across the road at a ford), reeds along the margin
   *  and a scatter of rocks breaking the surface.
   *
   *  BUDGET — four extra draw calls and roughly 5 k triangles for the whole
   *  world, which is less than the two throwaway 64-segment ford quads this
   *  replaces plus the reeds. Everything is one mesh or one InstancedMesh; the
   *  water is a single strip, not a per-crossing patch. */
  _buildRiver() {
    const R = this._river;
    const curve = R.curve;
    const total = curve.getLength();
    // Density, not a fixed budget: the reach is now ~5.5 km end to end because
    // both tails run past the world edge, and the old cap of 230 would have
    // stretched those segments to 24 u — coarsening the water right where you
    // drive through it to pay for geometry out in the fog.
    const SEGS = Math.max(90, Math.min(460, Math.round(total / 13)));
    const waterTex = riverTexture();
    waterTex.anisotropy = 4;
    const bankTex = riverBankTexture(this.T.riverBank);
    bankTex.anisotropy = 4;
    bankTex.repeat.set(1, 1);

    // sample once; both ribbons and all the dressing reuse these frames
    const F = [];
    for (let s = 0; s <= SEGS; s++) {
      const t = s / SEGS;
      const p = curve.getPointAt(t);
      const tn = curve.getTangentAt(t);
      const nx = tn.z, nz = -tn.x;
      // width breathes a little so the reach never reads as a canal — read
      // from the plan, not recomputed, so the carve and the ribbon are the
      // same shape (see `halfAt` in _planRiver)
      const df = this._distToTrackCoarse(p.x, p.z);
      const kk = this._riverNearest(p.x, p.z).k;
      let w = (R.halfAt && R.halfAt[kk] != null) ? R.halfAt[kk] : R.half;
      // ...and the MAIN river may not span one either. Where the reach crosses
      // a jump gorge the ribbon pinches to nothing, so the water stops at the
      // rim instead of laying a blue plank over the gap.
      if (this._inJumpGorge(p.x, p.z, 6)) w = 0;
      F.push({ t, x: p.x, z: p.z, nx, nz, w, df });
    }

    // `frames` defaults to the shared sample list, but the WATER passes its own:
    // a quantised copy carrying a doubled station at every fall, which is what
    // lets one strip contain vertical faces at all. See the water section below.
    const strip = (cols, yFor, uvFor, alphaFor, frames = F) => {
      const C = cols.length;
      const ROWS = frames.length;
      const verts = new Float32Array(ROWS * C * 3);
      const uvs = new Float32Array(ROWS * C * 2);
      const colA = new Float32Array(ROWS * C * 4);
      const idx = [];
      for (let s = 0; s < ROWS; s++) {
        const f = frames[s];
        for (let c = 0; c < C; c++) {
          const off = cols[c] * f.w;
          const vx = f.x + f.nx * off, vz = f.z + f.nz * off;
          const o = (s * C + c) * 3;
          verts[o] = vx; verts[o + 1] = yFor(f, off, vx, vz); verts[o + 2] = vz;
          const u = (s * C + c) * 2;
          const uv = uvFor(f, c, C);
          uvs[u] = uv[0]; uvs[u + 1] = uv[1];
          const q = (s * C + c) * 4;
          colA[q] = colA[q + 1] = colA[q + 2] = 1;
          colA[q + 3] = alphaFor(f, c, C);
        }
      }
      for (let s = 0; s < ROWS - 1; s++) {
        for (let c = 0; c < C - 1; c++) {
          const a = s * C + c, b = a + 1, d = (s + 1) * C + c, e = d + 1;
          // WINDING: columns run along +normal and rows along +tangent, and
          // n × t points DOWN — so the naive (a,b,d) order builds the ribbon
          // face-down and FrontSide materials cull it away entirely. Reversed.
          idx.push(a, d, b, b, d, e);
        }
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
      geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
      geo.setAttribute('color', new THREE.BufferAttribute(colA, 4));
      geo.setIndex(idx);
      geo.computeVertexNormals();
      return geo;
    };

    // --- shoreline: pebbles/mud from the waterline out over the bank top ---
    const BANK = (R.half + R.bank) / R.half;
    const bankGeo = strip(
      [-BANK, -1.02, 1.02, BANK],
      (f, off, vx, vz) => this.terrainHeight(vx, vz) + 0.05,
      (f, c) => [f.t * (total / 26), c === 0 ? 0 : c === 1 ? 0.42 : c === 2 ? 0.58 : 1],
      // outer columns feather into the grass; the whole band also fades out
      // across the road so the ford stays clean water on the carriageway
      (f, c, C) => (c === 0 || c === C - 1 ? 0 : 1)
        // THE SHINGLE BAND MUST NOT CLIMB ONTO THE ROAD. At 9-20 it was still
        // a third opaque over the carriageway, and being drawn with
        // polygonOffset and no depth write it won the depth test against the
        // road and painted a bright pebble slab across the tarmac beside every
        // crossing. Held back to the verge; the wash carries the crossing.
        * THREE.MathUtils.smoothstep(f.df, 14, 30)
        // ...and the shoreline fades out with the water at the tails
        * Math.min(smoothstep01(f.t / 0.06), smoothstep01((1 - f.t) / 0.06))
    );
    const bank = new THREE.Mesh(bankGeo, new THREE.MeshStandardMaterial({
      map: bankTex, roughness: 1, vertexColors: true, transparent: true,
      depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    }));
    bank.name = 'river-bank';
    bank.receiveShadow = true;
    this.group.add(bank);

    // --- water: sits IN the bed, rises to a shallow sheet over the ford ---
    // ---- LEVEL REACHES, VERTICAL FALLS (the big river, not just the streams) --
    //
    // THE BUG: `waterY` above reads the bed under every station, so the surface
    // followed the ground along its length and the river rendered as a ribbon
    // draped down the hillside. Measured on PINE VALLEY, AMAZON RAPIDS and LOG
    // FLUME FURY the `river-water` mesh had 2502 level triangles, ZERO vertical
    // ones, and slopes running up to 41.8 degrees. Reported, correctly, as
    // "the water is not falling 90 degrees as asked".
    //
    // `_buildRivers` (the small jungle streams) was given level-reach/vertical-
    // drop treatment earlier and is clean — 384 level, 54 vertical, nothing in
    // between. This is the same correction applied to the world-spanning river,
    // which is the one you actually drive across on every world.
    //
    // A strip has ONE height per station, so a drop is otherwise forced to
    // slope across a whole segment. The fix is two stations at the same x/z:
    // the lip at the old level and the foot at the new one. The quad between
    // them has no length in plan, so it stands upright by construction.
    const FALL = 1.1;                  // bed drop that ends a reach, in units

    // PASS 1 — the natural surface: level reaches that only ever DESCEND.
    // A river does not run uphill. Where the bed climbs, the water pools and
    // the bed pokes through it; only a bed that falls by more than FALL ends
    // the reach. Letting a rising bed lift the surface instead produced 153
    // upward steps on PINE VALLEY, one of them a 13 u wall of water facing
    // upstream — measurably worse than the slope it replaced.
    // WALKED ALONG THE FLOW, which is not always along t: the curve's
    // parameter runs whichever way the spline was authored, and the bed was
    // stepped downhill from whichever end is higher. Running this loop against
    // the flow turns every fall into a climb the hold logic ignores, and the
    // river comes out as one flat sheet at the level of its lowest point.
    const surf = new Array(F.length);
    const dirF = R.flow ?? 1;
    let hold = null;
    for (let i = 0; i < F.length; i++) {
      const s = dirF > 0 ? i : F.length - 1 - i;
      const f = F[s];
      const bed = R.bed ? R.bed[this._riverNearest(f.x, f.z).k] : this.terrainHeight(f.x, f.z);
      const open = bed - R.depth * 0.58;   // see waterY — measured from the channel floor
      if (hold === null) hold = open;
      if (hold - open > FALL) hold = open;
      surf[s] = hold;
    }

    // PASS 2 — the fords. Where the river CROSSES the road the wash sits on
    // the DECK, so the road works as a weir.
    //
    // "Where it crosses" is the load-bearing part, and it used to be tested
    // with distance to the ROADLINE alone. On HEDGEROW DASH the river runs
    // down a ravine BESIDE a road that climbs the hillside above it: within
    // 26 u laterally for a long stretch, 280 u from the nearest actual
    // crossing, with the deck 41 u above the water. The blend hauled the
    // river up toward that deck and built a wall of water standing in the
    // valley — the single worst "floating river" offender measured, and the
    // one in the report's screenshot. A ford is a PLACE, planned and stored
    // in R.fords; proximity to the road is not it.
    const fordPts = (R.fords ?? []).map((fd) => this.center[fd.i]).filter(Boolean);
    const fordDist = (x, z) => {
      let m = Infinity;
      for (const c of fordPts) m = Math.min(m, Math.hypot(x - c.x, z - c.z));
      return m;
    };
    for (let s = 0; s < F.length; s++) {
      const f = F[s];
      const nearFord = 1 - THREE.MathUtils.smoothstep(fordDist(f.x, f.z), 30, 46);
      if (nearFord <= 0) continue;
      _clearV.set(f.x, 0, f.z);
      const deck = this.center[this.nearestIndex(_clearV)].y + 0.05;
      // A FORD IS A PLACE *AND* A LEVEL. HEDGEROW DASH's planner threaded a
      // crossing where the road runs 43 u above the river — the road BRIDGES
      // the ravine there, it does not ford it — and this blend then ramped the
      // water 42 u up the embankment to reach a deck it had no business on.
      // If the deck is not within a car's height or two of the water, there is
      // no weir: the river keeps its level and passes under.
      const heightGate = 1 - THREE.MathUtils.smoothstep(Math.abs(deck - surf[s]), 5, 10);
      const lift = (1 - THREE.MathUtils.smoothstep(f.df, 10, 26)) * nearFord * heightGate;
      if (lift <= 0) continue;
      // Blend TO the deck, not `Math.max` toward it. Taking the max let a
      // pooled reach that already sat above the road stay there, and the wash
      // came out 1.8 u proud of the carriageway on PINE VALLEY — a wall of
      // water where a crossing should be. On the deck (lift = 1) this is the
      // deck height exactly; the ramp either side is stepped by pass 3.
      surf[s] = surf[s] * (1 - lift) + deck * lift;
    }

    // PASS 2b — CONTAINMENT. The surface is level bank to bank and holds along
    // a reach, which is what makes the falls vertical; the ground it crosses
    // does neither. Where the carve is deliberately faded out — the 9-22 u
    // approach to a ford, so the crossing is a wash and not a trench — nothing
    // was keeping the two in step, and the ribbon's edges were swallowed.
    //
    // So this is the rule, checked at every station against the ground under
    // the water's OWN EDGES rather than its centreline (the edges are what
    // sink first, and they are what a player sees):
    //
    //     the surface sits at least MIN above the highest ground it covers,
    //     and never more than one channel depth above it
    //
    // It only ever moves a station that breaks that, so the level reaches and
    // vertical falls survive everywhere they were already valid — this is a
    // clamp on the profile, not a replacement for it.
    const MIN_CLEAR = 0.12;
    for (let s = 0; s < F.length; s++) {
      const f = F[s];
      let hi = -Infinity;
      // CENTRE columns only. The outermost columns are SUPPOSED to be under
      // the ground — that is what a shoreline is: the surface meets the bank
      // somewhere inside the ribbon's width. Clamping the whole surface above
      // the highest EDGE meant that wherever one bank stood tall the entire
      // river was floated up to that bank's top: measured as the 5-8 u sheets
      // standing over the channel on PINE VALLEY and LOG FLUME.
      for (const c of [-0.5, 0, 0.5]) {
        const vx = f.x + f.nx * c * f.w, vz = f.z + f.nz * c * f.w;
        const g = this.terrainHeight(vx, vz);
        if (g > hi) hi = g;
      }
      // THE CULVERT RULE. Near the road the carve fades out on purpose (the
      // roadbed must survive), so the ground here is road-grade even though
      // the river runs 40 u lower either side. Raising the water over that
      // lip built a 40 u hump of water climbing onto the carriageway at a
      // spot that is NOT a ford — and a 40 u waterfall one station later,
      // hanging in the air with no rock face behind it. That pair, on
      // HEDGEROW DASH, is the screenshot in the report. A river that meets a
      // road embankment anywhere but a ford goes UNDER it: skip the raise,
      // let the embankment swallow the ribbon, and it re-emerges on the far
      // side — a culvert, which is what a real road over a real stream has.
      _clearV.set(f.x, 0, f.z);
      const deckC = this.center[this.nearestIndex(_clearV)].y + 0.05;
      // ...and a planned ford whose deck is far above the water is a BRIDGE,
      // which for the water is the same as no ford at all
      const culvert = f.df < 24
        && (fordDist(f.x, f.z) > 46 || Math.abs(deckC - surf[s]) > 9);
      // ...and the raise is CAPPED. Where a knob of ground pokes far through
      // the reach, lifting the whole river over it built a one-station slab
      // standing 7.9 u above the valley floor either side (HEDGEROW, at a
      // mid-channel rock). A boulder in a stream parts the water: past 2 u the
      // knob pierces the surface and the river keeps its level — which is
      // also exactly how the deliberate in-stream rocks already read.
      const need = hi + MIN_CLEAR;
      if (!culvert && surf[s] < need && need - surf[s] <= 2.0) surf[s] = need;
      // ...and never a slab standing proud of the land it runs through
      const cap = hi + R.depth;
      if (surf[s] > cap) surf[s] = cap;
    }

    // PASS 2c — MONOTONE, AND THIS ONE WINS.
    //
    // Pass 2b raises a station by up to 2 u to keep the ribbon's edges out of
    // the ground, and it does that per station, independently - so a knob of
    // ground lifts one station above its downstream neighbour and the river
    // runs uphill for a segment. Measured: 7 such rises on PINE VALLEY (worst
    // 1.76 u) and 17 on LOG FLUME FURY (worst 1.79), every one of them well
    // clear of any ford, all of them under 2b's own 2 u cap.
    //
    // Water does not run uphill, and containment is cosmetic, so containment
    // gives way: a running minimum along the FLOW clamps any station that
    // would rise. Where that re-swallows an edge, the ground is standing above
    // the natural level of the reach - which is a rock in a stream, and is
    // what the passes above already say should pierce the surface.
    //
    // Fords are exempt, by the same declared exception the rule carries
    // everywhere else: there the wash sits on the road deck by design.
    let flowMin = Infinity;
    for (let i = 0; i < F.length; i++) {
      const s = dirF > 0 ? i : F.length - 1 - i;
      if (F[s].df < 30) continue;
      if (surf[s] > flowMin) surf[s] = flowMin;
      else flowMin = surf[s];
    }

    // PASS 3 — emit, doubling the station wherever the level changes so the
    // change is carried by an upright quad instead of a sloped one. Off the
    // ford a step has to be worth taking (STEPMIN) or the approach becomes a
    // shimmer of micro-terraces; across the carriageway itself the water must
    // track the deck exactly, or you drive through a lip of water.
    const STEPMIN = 0.35;
    // THE WATER'S FACE MUST STAND WHERE THE ROCK'S FACE STANDS.
    //
    // A fall used to be emitted as two stations at the x/z of whichever F
    // sample first noticed the level change. The GROUND's step comes from the
    // carve, which is quantised on the plan polyline — an 11 u grid — while
    // the F stations sit on a ~13 u grid. The two faces could therefore stand
    // up to half a station apart, and wherever the water's face landed on the
    // low side of the rock's, the lip hung in the air by the full fall height
    // with daylight underneath. Measured: 4.9 u of proud lip on PINE VALLEY 20 u
    // from the road, 41.9 u on HEDGEROW DASH where the river drops through a
    // ravine. Reported, twice, as the river floating.
    //
    // So a fall is now placed by asking the BED where it steps: find the pair
    // of plan samples whose stepped-bed values differ, and emit the lip and
    // the foot either side of that midpoint, 0.8 u apart. The rock face and
    // the water face are then the same face to within the carve's own lateral
    // smoothing, whatever the two grids are doing.
    const fallBoundary = (sPrev, sNow) => {
      if (!R.bed || !R.line) return null;
      let kA = this._riverNearest(F[sPrev].x, F[sPrev].z).k;
      let kB = this._riverNearest(F[sNow].x, F[sNow].z).k;
      if (kA > kB) [kA, kB] = [kB, kA];
      let best = -1, bestDrop = 0.5;      // below 0.5 it is a clamp artefact, not a fall
      for (let j = kA; j < kB; j++) {
        const drop = Math.abs(R.bed[j] - R.bed[j + 1]);
        if (drop > bestDrop) { bestDrop = drop; best = j; }
      }
      if (best < 0) return null;
      const a = R.line[best], b = R.line[best + 1];
      let tx = b.x - a.x, tz = b.z - a.z;
      const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
      return { mx: (a.x + b.x) / 2, mz: (a.z + b.z) / 2, tx, tz };
    };
    const wf = [];
    let cur = null;
    for (let s = 0; s < F.length; s++) {
      const f = F[s];
      const want = surf[s];
      if (cur === null) cur = want;
      const onDeck = f.df <= 10 && fordDist(f.x, f.z) < 34;
      if (Math.abs(want - cur) > (onDeck ? 0.01 : STEPMIN)) {
        const B = onDeck ? null : fallBoundary(Math.max(0, s - 1), s);
        if (B) {
          // BOTH stations at the boundary's own x/z: the fall stays a TRUE
          // vertical face — the 90-degree drop that was asked for by name —
          // and the alignment alone is the fix. (A first cut gave the pair a
          // 1.6 u horizontal run so the ground could step "across" it; that
          // remade every waterfall as a 35-60 degree ramp and failed the
          // suite that guards exactly this. The ground's own step is blurred
          // by the carve's lateral smoothing around this midpoint, so the lip
          // overhangs by at most about half the fall — inside the ceiling.)
          const nx = B.tz, nz = -B.tx;             // F's normal convention
          const w = (F[Math.max(0, s - 1)].w + f.w) / 2;
          const tMid = (F[Math.max(0, s - 1)].t + f.t) / 2;
          wf.push({ t: tMid, x: B.mx, z: B.mz, nx, nz, w, y: cur });
          cur = want;
          wf.push({ t: tMid + 1e-4, x: B.mx, z: B.mz, nx, nz, w, y: cur });
          wf.push({ ...f, y: cur });
        } else if (Math.abs(want - cur) > 3 && !onDeck) {
          // NO ROCK, NO WALL — AND NO SLOPE EITHER. A level change with no bed
          // step behind it means the GROUND is ramping (a carve fade at an
          // embankment, a clamp seam on a rough bank). One vertical face here
          // is how a 40 u sheet of water ends up standing on air; but a plain
          // ramp of water breaks the older law that water is level or falling,
          // never tilted — and a first cut that ramped it scattered ~750
          // sloped triangles per world through open country. So it becomes a
          // STAIRCASE: walk the ground in short substeps, and every time the
          // ground-following level has moved enough, emit a level tread and a
          // vertical riser. Rapids, in the game's own idiom — every triangle
          // level or upright, every tread just above the terrain under it, so
          // it can neither hang nor tilt.
          const prev = F[Math.max(0, s - 1)];
          const lo = Math.min(cur, want), hiY = Math.max(cur, want);
          // Substeps run all the way TO the station (j = N2 uses the station's
          // own level), so the closing riser stands wherever the ground change
          // is actually detected. Closing at the station unconditionally left
          // a 9 u lip on HEDGEROW when the ground dropped in the last 1.6 u
          // gap the old loop never sampled.
          const N2 = 12;
          let level = cur;
          for (let j = 1; j <= N2; j++) {
            const a = j / N2;
            const x = prev.x + (f.x - prev.x) * a, z = prev.z + (f.z - prev.z) * a;
            const gWant = j === N2 ? want
              : Math.max(lo, Math.min(hiY, this.terrainHeight(x, z) + MIN_CLEAR));
            if (Math.abs(gWant - level) > 0.5) {
              const t2 = prev.t + (f.t - prev.t) * (j === N2 ? a - 0.02 : a);
              const w2 = prev.w + (f.w - prev.w) * a;
              wf.push({ t: t2, x, z, nx: f.nx, nz: f.nz, w: w2, y: level });
              level = gWant;
              wf.push({ t: t2 + 1e-4, x, z, nx: f.nx, nz: f.nz, w: w2, y: level });
            }
          }
          cur = want;
          // whatever sub-step remainder is left closes with a small riser at
          // the station — vertical, and at most the 0.5 u stair threshold tall
          // (the big drops were already stepped where the loop detected them)
          if (Math.abs(cur - level) > 0.01) {
            wf.push({ ...f, y: level });
            wf.push({ ...f, y: cur, t: f.t + 1e-4 });
          } else {
            wf.push({ ...f, y: cur });
          }
        } else {
          wf.push({ ...f, y: cur });
          cur = want;
          // Nudge the foot's u so the upright face gets texture across it
          // instead of one smeared column.
          wf.push({ ...f, y: cur, t: f.t + 1e-4 });
        }
      } else {
        wf.push({ ...f, y: cur });
      }
    }
    const waterGeo = strip(
      [-1, -0.35, 0.35, 1],
      (f) => f.y,
      (f, c, C) => [f.t * (total / 18), c / (C - 1)],
      // Fade the last stretch of each tail to nothing. The reach now runs well
      // past the fog, but a hard-edged rectangle of water is the exact thing
      // that reads as "the river stops here" if one ever does come into view.
      (f) => Math.min(smoothstep01(f.t / 0.06), smoothstep01((1 - f.t) / 0.06)),
      wf,
    );
    const water = new THREE.Mesh(waterGeo, new THREE.MeshStandardMaterial({
      map: waterTex, roughness: 0.18, metalness: 0.06, side: THREE.DoubleSide,
      transparent: true, opacity: 0.9, vertexColors: true, depthWrite: false,
    }));
    water.name = 'river-water';
    water.renderOrder = 1;
    water.receiveShadow = true;
    this.group.add(water);

    // --- margin dressing: reeds along the bank, boulders in the stream ---
    const q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
    const m4 = new THREE.Matrix4(), v3 = new THREE.Vector3();
    const reedGeo = new THREE.ConeGeometry(0.5, 1, 4);
    reedGeo.translate(0, 0.5, 0);
    const reeds = new THREE.InstancedMesh(reedGeo, new THREE.MeshStandardMaterial({
      color: this.T.reedColor !== undefined ? this.T.reedColor : 0x6f8a3e,
      flatShading: true, roughness: 1,
    }), 160);
    reeds.count = 0;
    const rockGeo = this._rockGeo || (this._rockGeo = this._topLitRockGeo(0));
    const rocks = new THREE.InstancedMesh(rockGeo, new THREE.MeshStandardMaterial({
      color: this.T.rockColor, flatShading: true, roughness: 0.9, vertexColors: true,
    }), 40);
    rocks.count = 0;
    rocks.castShadow = true;
    const put = (im, x, y, z, rot, sx, sy, sz) => {
      if (im.count >= im.instanceMatrix.count) return;
      q.setFromAxisAngle(up, rot);
      m4.compose(v3.set(x, y, z), q, new THREE.Vector3(sx, sy, sz));
      im.setMatrixAt(im.count++, m4);
    };
    for (let s = 2; s < SEGS - 2; s += 2) {
      const f = F[s];
      if (f.df < 22) continue;                       // keep the ford approach clear
      for (const sl of [1, -1]) {
        if (Math.random() > 0.5) continue;
        const off = f.w * (1.05 + Math.random() * 0.5);
        const x = f.x + f.nx * off * sl, z = f.z + f.nz * off * sl;
        const y = this.terrainHeight(x, z);
        const h = 0.9 + Math.random() * 1.5;
        put(reeds, x, y - 0.1, z, Math.random() * 3.14, 0.5 + Math.random() * 0.3, h, 0.5);
      }
      if (Math.random() < 0.16) {
        const off = f.w * (Math.random() - 0.5) * 1.2;
        const x = f.x + f.nx * off, z = f.z + f.nz * off;
        const sc = 0.5 + Math.random() * 0.7;
        put(rocks, x, this.terrainHeight(x, z) + sc * 0.3, z, Math.random() * 3.14, sc, sc * 0.8, sc);
      }
    }
    if (reeds.count) { reeds.instanceMatrix.needsUpdate = true; this.group.add(reeds); }
    if (rocks.count) { rocks.instanceMatrix.needsUpdate = true; this.group.add(rocks); }
  }

  /** WHERE THE RIVER MEETS THE ROAD, SOMETHING IS BUILT THERE.
   *
   *  A river crosses a road in exactly two ways and the game already models
   *  both: at a FORD the water washes over the carriageway, and anywhere else
   *  it passes UNDER the embankment - a culvert, which is what a real road
   *  over a real stream has. The culvert was correct and completely invisible:
   *  the ribbon ran up to the shoulder, dived into a grass bank and did not
   *  come out, which from the car reads as a river that stops dead in a field.
   *  Measured on PINE VALLEY, a crossing 155 u from the nearest ford.
   *
   *  So every crossing gets built. A culvert gets a battered stone headwall
   *  each side with an arch mouth cut into it, wing walls splaying back into
   *  the bank, and a parapet along the road above. A ford gets a stone apron
   *  either side of the wash and a pair of depth markers, so the crossing
   *  announces itself before you are in it.
   */
  _buildRiverCrossings() {
    const R = this._river;
    if (!R || !R.curve) return;
    const curve = R.curve;
    // walk the reach and take the LOCAL MINIMUM of distance-to-road: one
    // structure per crossing, not one per sample inside it
    const N = 900;
    const samp = [];
    for (let i = 0; i <= N; i++) {
      const p = curve.getPointAt(i / N);
      samp.push({ p, d: this._distToTrackCoarse(p.x, p.z) });
    }
    const cross = [];
    for (let i = 2; i < N - 2; i++) {
      if (samp[i].d > 16) continue;
      if (samp[i].d > samp[i - 1].d || samp[i].d > samp[i + 1].d) continue;
      const p = samp[i].p;
      if (cross.some((c) => Math.hypot(c.p.x - p.x, c.p.z - p.z) < 60)) continue;
      const tan = curve.getTangentAt(i / N);
      cross.push({ p, tan });
    }
    if (!cross.length) return;

    const stone = new THREE.MeshStandardMaterial({
      color: this.T.wallColor ?? 0x8e8778, roughness: 1, flatShading: true,
    });
    const cap = new THREE.MeshStandardMaterial({
      color: 0x9a9488, roughness: 1, flatShading: true,
    });
    const g = new THREE.Group();
    g.name = 'river-crossings';
    const V = (a, b, c) => new THREE.Vector3(a, b, c);

    for (const c of cross) {
      const idx = this.nearestIndex(V(c.p.x, 0, c.p.z));
      const deck = this.center[idx].y;
      const roadYaw = this.headingAt(idx);
      // is this a ford? the wash sits on the deck there, so nothing may block it
      const isFord = (this.fords || []).some(
        (f) => Math.hypot(f.x - c.p.x, f.z - c.p.z) < 34);
      // the river's own bearing, for wing walls that follow the water
      const rYaw = Math.atan2(c.tan.x, c.tan.z);
      const hw = R.half + 1.2;

      if (isFord) {
        // THE WASH IS A THING, SO IT IS BUILT AS A THING.
        //
        // The water ribbon is supposed to rise onto the deck here, and four
        // profile passes argue about whether it may: pass 2 lifts it, 2b
        // clamps it to the ground with a 2 u cap meant for boulders, 2c takes
        // a running minimum along the flow and can put it back. Measured on
        // PINE VALLEY the ribbon still sat 2 u under the carriageway at its
        // own ford - the river ran to one shoulder and reappeared at the
        // other, with dry road between, which is the thing being complained
        // about. Rather than add a fifth rule to that argument, the sheet of
        // water that lies ON the road is its own mesh: sampled off the road
        // surface itself, so it follows the camber and cannot be anywhere
        // else. The ribbon either side is unchanged.
        {
          // AXES: the sheet follows the RIVER, not the road. Built the other
          // way round it came out as a band lying along the carriageway, and
          // the texture - whose V runs ACROSS the stream and whose U repeats
          // ALONG it, the same convention the ribbon uses - was stretched
          // sideways over the whole thing, which rendered the wash as a flat
          // white slab of foam.
          const AX = 12, AL = 6;                    // across the stream / along it
          const halfA = hw + 0.8;                   // half the river's width
          const halfL = ROAD_HALF + 9;              // far enough to clear the road
          const ax = Math.cos(rYaw), az = -Math.sin(rYaw);   // across the stream
          const lx = Math.sin(rYaw), lz = Math.cos(rYaw);    // along the flow
          const vs = [], uv = [], wcol = [];
          for (let il = 0; il <= AL; il++) {
            for (let ia = 0; ia <= AX; ia++) {
              const a = -halfA + (2 * halfA) * (ia / AX);
              const l = -halfL + (2 * halfL) * (il / AL);
              const wx = c.p.x + ax * a + lx * l;
              const wz = c.p.z + az * a + lz * l;
              // ABOVE THE ROAD RIBBON, NOT ABOVE THE TERRAIN. The carriageway
              // is its own mesh laid over the ground, so a sheet seated on
              // terrainHeight slides underneath it and is never seen.
              const ny = this.center[this.nearestIndex(V(wx, 0, wz))].y;
              vs.push(wx, Math.max(this.terrainHeight(wx, wz), ny) + 0.12, wz);
              uv.push(l / 18, ia / AX);
              // feather the ends into the ribbon and the sides into the verge
              wcol.push(1, 1, 1, Math.min(
                smoothstep01((halfL - Math.abs(l)) / 5),
                smoothstep01((halfA - Math.abs(a)) / 1.2)));
            }
          }
          const idxw = [];
          for (let il = 0; il < AL; il++) {
            for (let ia = 0; ia < AX; ia++) {
              const p0 = il * (AX + 1) + ia, p1 = p0 + 1;
              const p2 = p0 + AX + 1, p3 = p2 + 1;
              idxw.push(p0, p2, p1, p1, p2, p3);
            }
          }
          const wgeo = new THREE.BufferGeometry();
          wgeo.setAttribute('position', new THREE.Float32BufferAttribute(vs, 3));
          wgeo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
          wgeo.setAttribute('color', new THREE.Float32BufferAttribute(wcol, 4));
          wgeo.setIndex(idxw);
          wgeo.computeVertexNormals();
          const wash = new THREE.Mesh(wgeo, new THREE.MeshStandardMaterial({
            map: riverTexture(), roughness: 0.16, metalness: 0.06,
            transparent: true, opacity: 0.85, depthWrite: false,
            vertexColors: true, side: THREE.DoubleSide,
          }));
          wash.name = 'ford-wash';
          wash.renderOrder = 2;
          g.add(wash);
        }
        // FORD: depth markers either side, so the crossing announces itself.
        for (const sg of [1, -1]) {
          const mx = c.p.x + Math.sin(rYaw) * sg * (hw + 1.0);
          const mz = c.p.z + Math.cos(rYaw) * sg * (hw + 1.0);
          const gy = this.terrainHeight(mx, mz);
          const post = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.19, 2.2, 8),
            new THREE.MeshStandardMaterial({ color: 0xe8e4d8, roughness: 0.9 }));
          post.position.set(mx, gy + 1.1, mz);
          post.castShadow = true;
          g.add(post);
          const band = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.34, 8),
            new THREE.MeshStandardMaterial({ color: 0xb3352c, roughness: 0.9 }));
          band.position.set(mx, gy + 1.5, mz);
          g.add(band);
          this.solids.push({ x: mx, z: mz, r: 0.35, y: gy + 1, mat: 'wood' });
        }
        continue;
      }

      // CULVERT: a headwall each side of the embankment with an arch mouth,
      // wing walls splaying into the bank, and a parapet on the road above.
      const bedY = this.terrainHeight(c.p.x, c.p.z) - 0.4;
      for (const sg of [1, -1]) {
        const off = ROAD_HALF + 3.5;
        const hx = c.p.x + Math.sin(roadYaw) * sg * off;
        const hz = c.p.z + Math.cos(roadYaw) * sg * off;
        const gy = this.terrainHeight(hx, hz);
        const H = Math.max(2.4, deck - bedY + 0.6);
        // the wall, built as two piers and a lintel so the mouth is a hole
        // rather than a dark rectangle painted on a slab
        const pierW = 1.5;
        for (const px of [-(hw + pierW / 2), hw + pierW / 2]) {
          const pier = new THREE.Mesh(new THREE.BoxGeometry(pierW, H, 1.6), stone);
          pier.position.set(hx + Math.cos(roadYaw) * px, bedY + H / 2,
            hz - Math.sin(roadYaw) * px);
          pier.rotation.y = roadYaw;
          pier.castShadow = true; pier.receiveShadow = true;
          g.add(pier);
        }
        const openH = Math.min(H * 0.55, 2.2);
        const lint = new THREE.Mesh(
          new THREE.BoxGeometry(hw * 2 + pierW * 2, H - openH, 1.6), stone);
        lint.position.set(hx, bedY + openH + (H - openH) / 2, hz);
        lint.rotation.y = roadYaw;
        lint.castShadow = true;
        g.add(lint);
        // a voussoir arch under the lintel, so the mouth reads as masonry
        for (let k = 0; k < 7; k++) {
          const a = Math.PI * (k + 0.5) / 7;
          const vx = -Math.cos(a) * hw, vy = Math.sin(a) * openH * 0.5;
          const vo = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.42, 1.7), cap);
          vo.position.set(hx + Math.cos(roadYaw) * vx, bedY + openH * 0.5 + vy,
            hz - Math.sin(roadYaw) * vx);
          vo.rotation.set(0, roadYaw, a - Math.PI / 2);
          g.add(vo);
        }
        // wing walls, splayed back along the water into the bank
        for (const wsg of [1, -1]) {
          const wl = 5.5;
          const wx = hx + Math.cos(roadYaw) * wsg * (hw + 1.2)
            + Math.sin(rYaw) * sg * wl * 0.5;
          const wz = hz - Math.sin(roadYaw) * wsg * (hw + 1.2)
            + Math.cos(rYaw) * sg * wl * 0.5;
          const wg = this.terrainHeight(wx, wz);
          const wing = new THREE.Mesh(new THREE.BoxGeometry(0.9, 2.2, wl), stone);
          wing.position.set(wx, wg + 0.5, wz);
          wing.rotation.y = rYaw + wsg * 0.22;
          wing.castShadow = true;
          g.add(wing);
        }
        this.solids.push({ x: hx, z: hz, r: hw + 1.5, y: bedY + 1, mat: 'stone' });
      }
      // parapet on the road above the culvert - the giveaway from the car
      for (const sg of [1, -1]) {
        const px = c.p.x + Math.sin(roadYaw) * sg * (ROAD_HALF + 1.1);
        const pz = c.p.z + Math.cos(roadYaw) * sg * (ROAD_HALF + 1.1);
        const par = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.95, hw * 2 + 9), cap);
        par.position.set(px, deck + 0.45, pz);
        par.rotation.y = roadYaw + Math.PI / 2;
        par.castShadow = true;
        g.add(par);
        this.solids.push({ x: px, z: pz, r: 1.4, y: deck + 0.5, mat: 'stone' });
      }
    }
    this.group.add(g);
  }

  _buildRivers() {
    const count = Math.min(this.T.riverCount | 0, this.puddles.length);
    if (!count) return;
    // pick well-separated puddles as crossing points
    const cross = [];
    for (const pd of this.puddles) {
      if (cross.length >= count) break;
      if (cross.some((c) => Math.hypot(c.x - pd.x, c.z - pd.z) < 140)) continue;
      cross.push(pd);
    }
    const tex = riverTexture();
    tex.anisotropy = 4;
    const mat = new THREE.MeshStandardMaterial({
      map: tex, roughness: 0.2, metalness: 0.05, side: THREE.DoubleSide,
    });
    const tmp = new THREE.Vector3();
    for (const pd of cross) {
      const ci = this.nearestIndex(tmp.set(pd.x, 0, pd.z));
      const n = this.nrm[ci], tg = this.tan[ci];
      // meandering path perpendicular to the road; dead straight at the crossing
      const pts = [];
      for (let s = -5; s <= 5; s++) {
        const d = s * 15;
        const sway = Math.sin(s * 1.25 + ci * 0.7) * 9 * Math.min(1, Math.abs(s) / 2.2);
        pts.push(new THREE.Vector3(pd.x + n.x * d + tg.x * sway, 0, pd.z + n.z * d + tg.z * sway));
      }
      const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
      const SEGS = 64, HALF = 3.2;

      // ---- LEVEL REACHES, VERTICAL DROPS (NATURE rules 1 and 3) ----------
      //
      // THE BUG THIS FIXES: every vertex took its height from the terrain
      // under it, so on falling ground the ribbon draped down the slope and
      // the stream rendered as a sheet of water lying at an angle. Reported as
      // "waterfalls should fall vertically not on an angle" — and that is
      // precisely what it was: a fall with no vertical in it.
      //
      // NATURE rule 3: a water surface is either ~0 degrees (a pool, or a
      // river running level) or ~90 degrees (a fall face), never in between.
      // So the stream is built as a chain of LEVEL quads joined by VERTICAL
      // ones. Each reach holds its height until the bed has dropped by more
      // than STEP; the drop is then a separate upright quad at a single
      // station, which is what makes it vertical rather than merely steep.
      //
      // Draping the profile in one strip cannot express this: a strip has one
      // height per station, so a drop is forced to slope across a whole
      // segment. Measured, the first attempt at quantising still left 28
      // segments between 8 and 38 degrees. Two stations per drop removes them.
      //
      // This is the along-stream counterpart of the correction _buildFords
      // already carries across the stream ("real water is level bank to bank").
      const STEP = 1.1;
      const path = [];
      for (let s2 = 0; s2 <= SEGS; s2++) {
        const t = s2 / SEGS;
        const q = curve.getPointAt(t);
        const tn = curve.getTangentAt(t);
        const df0 = this._distToTrackCoarse(q.x, q.z);
        const bed = this.terrainHeight(q.x, q.z) - 0.12
          + 0.45 * THREE.MathUtils.smoothstep(df0, 11, 17);
        // banks taper into the undergrowth at both ends
        const wv = HALF * (0.3 + 0.7 * Math.sqrt(Math.sin(Math.PI * t)));
        path.push({ x: q.x, z: q.z, nx: tn.z * wv, nz: -tn.x * wv, bed, t });
      }
      // Water never runs uphill: the held level only ever descends.
      let hold = path[0].bed;
      for (const pt of path) {
        if (hold - pt.bed > STEP) hold = pt.bed;
        pt.y = Math.min(hold, pt.bed + 0.35);
      }

      const vArr = [], uArr = [], idx = [];
      let base = 0;
      const quad = (ax, ay, az, bx, by, bz, cx, cy, cz, dx2, dy2, dz2, u0, u1) => {
        vArr.push(ax, ay, az, bx, by, bz, cx, cy, cz, dx2, dy2, dz2);
        uArr.push(u0, 0, u0, 1, u1, 0, u1, 1);
        idx.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
        base += 4;
      };

      for (let s2 = 0; s2 < SEGS; s2++) {
        const a = path[s2], b2 = path[s2 + 1];
        // The reach: both ends at the UPSTREAM level, so the quad is flat.
        quad(
          a.x + a.nx, a.y, a.z + a.nz,
          a.x - a.nx, a.y, a.z - a.nz,
          b2.x + b2.nx, a.y, b2.z + b2.nz,
          b2.x - b2.nx, a.y, b2.z - b2.nz,
          a.t * 6, b2.t * 6,
        );
        // The fall: an upright face at the station where the level changes.
        if (b2.y < a.y - 0.02) {
          quad(
            b2.x + b2.nx, a.y, b2.z + b2.nz,
            b2.x + b2.nx, b2.y, b2.z + b2.nz,
            b2.x - b2.nx, a.y, b2.z - b2.nz,
            b2.x - b2.nx, b2.y, b2.z - b2.nz,
            b2.t * 6, b2.t * 6 + 0.35,
          );
        }
      }
      const verts = new Float32Array(vArr);
      const uvs = new Float32Array(uArr);

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
      geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
      geo.setIndex(idx);
      geo.computeVertexNormals();
      const mesh = new THREE.Mesh(geo, mat);
      mesh.receiveShadow = true;
      this.group.add(mesh);
    }
  }

  /** Per-frame ambient animation: waving flags, drifting clouds. */
  update(dt, time) {
    for (const f of this.animated.flags) {
      f.mesh.rotation.y = Math.sin(time * 5 + f.phase) * 0.35 + Math.sin(time * 1.7 + f.phase) * 0.2;
    }
    for (const c of this.animated.clouds) {
      c.sprite.position.x += c.speed * dt;
      if (c.sprite.position.x > 1100) c.sprite.position.x = -1100;
    }
  }

  /** Tear the whole world down so another one can be built in its place
   *  without reloading the page. Everything the track made lives under
   *  `this.group`, so this is one detach plus a walk to free GPU memory —
   *  geometries and textures are NOT garbage collected on their own, and a
   *  player hopping between tracks would otherwise leak a world each time.
   *
   *  Shared module-level assets (the prop geometry cache, the texture makers'
   *  memoised canvases) are deliberately left alone: they are reused by the
   *  next world and disposing them would cost a rebuild for nothing. */
  dispose() {
    disposeSubtree(this.group);
    this.scene.remove(this.group);
    // drop the world-sized lookup tables too — these are the big retained
    // arrays (900 centreline samples, every collider, the river grid)
    this.solids = []; this.buildings = []; this.trees = []; this.props = [];
    this.tireStacks = []; this.banners = [];
    this._river = null;
    this.disposed = true;
  }
}

// The two method groups that live in their own files. Installed here, once,
// after the class is defined — `this` inside them is the Track instance, so
// nothing about call order or shared state differs from having them inline.
//
// Written with defineProperties rather than Object.assign so the methods land
// non-enumerable, exactly like the ones declared in the class body: a plain
// assign would make them show up in `for…in` and in JSON dumps of a track,
// which the class's own methods do not.
for (const group of [skyMethods, floraMethods]) {
  for (const [name, fn] of Object.entries(group)) {
    Object.defineProperty(Track.prototype, name, {
      value: fn, writable: true, enumerable: false, configurable: true,
    });
  }
}
