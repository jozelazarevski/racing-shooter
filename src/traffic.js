// IGNITE RALLY — ambient civilian traffic: tractors (some towing hay wagons)
// and farm trucks putter along the road edge on rural worlds, and CROSS the
// carriageway at the dirt crossroads the track publishes. Racers must dodge.
//
// SELF-ATTACHING: this module owns NO hook in main.js. It polls for
// window.__game, then installs itself — builds per-world traffic and runs its
// own requestAnimationFrame update loop that reads game state (game.state,
// game.raceTime, game.track identity) and pauses when the game is paused.
//
// Law of Solidity: a tractor is a heavy slow vehicle. Contact pushes the car
// out with the standard ≤5% rebound absorb; real hits cost hull like
// METAL-to-heavy — min(28, (impact − 6) × 1.4) — with a 'TRACTOR!' feed.
// Mutual: the tractor lurches, briefly stops, the driver block wobbles.
// Weapons destroy tractors (hp 70): explosion + flying parts + a charred
// husk-style wreck that despawns ~10 s. +150 score through the style chain.
//
// Crossings read `track.crossroads` (published by track.js): each entry gives
// the spur mouth (x,z) on the road edge, the unit direction away from the road
// (dx,dz), the graded length and the junction height. A crossing vehicle
// shuttles spur → mouth → across the carriageway → far shoulder and back,
// pausing at the mouth to "look both ways" so the hazard is telegraphed.

import * as THREE from 'three';
import { disposeSubtree } from './track.js';

// Worlds that read as farmland / mountain-pasture country. Canyon, volcano,
// glacier, dune, ravine and the two city worlds get no civilian traffic.
const RURAL = new Set([
  'forest', 'alpine', 'redwood', 'flume', 'oasis', 'desert', 'jungle',
  'snow', 'wildfire', 'pass', 'tremola', 'furka', 'medterrace', 'farmland',
  'outback', 'vineyard', 'deepwood', 'dolomiti',
]);

// theme-tinted paint (body / darker trim)
const TINTS = {
  forest:  [0xd23c28, 0x8a2418],   // classic red
  alpine:  [0x2e72c8, 0x1c4a88],   // alpine blue
  redwood: [0x3e8a3a, 0x266224],   // john-green
  flume:   [0xd2802e, 0x92561c],   // lumber orange
  oasis:   [0x3e8a3a, 0x266224],
  desert:  [0xc8a83c, 0x8a7226],   // dusty yellow
  jungle:  [0x3e8a3a, 0x266224],
  snow:    [0xc44a2c, 0x8a2c18],   // barn red against the white
  wildfire:[0xb8532a, 0x7a3418],
  pass:    [0x2e72c8, 0x1c4a88],
  tremola: [0x3e8a3a, 0x266224],
  furka:   [0xc8b03c, 0x8a7226],
  medterrace: [0xd8632a, 0x8f3a16],  // olive-grove orange
  farmland:[0x3e6e3a, 0x25401f],   // farm green, kept off the region accent
  outback: [0xcfc2a6, 0x8a7f66],  // dust-caked station ute cream
  vineyard: [0x7a3a8a, 0x4e2458],  // wine purple
  deepwood: [0x3e8a3a, 0x266224],
  dolomiti: [0x2e72c8, 0x1c4a88],
};

const TRACTOR_HP = 70;
const BODY_R = 2.4;      // tractor collision circle
const WAGON_R = 2.0;     // wagon collision circle
const CAR_R = 2.0;       // car body radius for push-out
const HIT_RATE = 0.9;    // s between damage events per car
const WRECK_LIFE = 10;   // s a wreck husk lingers
const RESPAWN_AFTER = 6; // s after the husk sinks before a fresh tractor returns
const MOUTH_LAT = 8;     // lateral of the spur mouth (track.js: pointAt(i, side*8))
const FAR_SHOULDER = 13; // lateral it parks at on the far side of the road
const ROAD_EDGE = 9.5;   // carriageway edge (vehicles.js ROAD_HALF + line)
const AVOID_R = 2.9;     // radius rivals steer around (body radius + margin)
const PARKED = 1e6;      // coordinate that parks an avoidance proxy out of reach

// scratch — no per-frame allocations
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _n = new THREE.Vector3();
const _PUFF = new THREE.Color(0x4e4a42);
const _STACK_TIP = new THREE.Vector3(0.42, 2.85, 0.55);
const _TRUCK_STACK_TIP = new THREE.Vector3(0.99, 2.58, 1.5);

// ---------- merged voxel geometry (vertex-colored, 1 draw call per mesh) ----------
function mergeGeos(geos) {
  let total = 0;
  for (const g of geos) total += g.attributes.position.count;
  const pos = new Float32Array(total * 3);
  const nor = new Float32Array(total * 3);
  const col = new Float32Array(total * 3);
  let o = 0;
  for (const g of geos) {
    pos.set(g.attributes.position.array, o * 3);
    nor.set(g.attributes.normal.array, o * 3);
    col.set(g.attributes.color.array, o * 3);
    o += g.attributes.position.count;
    g.dispose();
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return out;
}

function paint(g, hex) {
  const c = new THREE.Color(hex);
  const n = g.attributes.position.count;
  const col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}

function box(w, h, d, x, y, z, hex) {
  const g = new THREE.BoxGeometry(w, h, d).toNonIndexed();
  g.translate(x, y, z);
  return paint(g, hex);
}

/** Wheel pair on one shared axle (mesh origin = axle center, so rotating the
 *  mesh about X spins both wheels + hubs correctly). */
function wheelPairGeo(r, w, xOff, hubHex) {
  const parts = [];
  for (const s of [-1, 1]) {
    const cyl = new THREE.CylinderGeometry(r, r, w, 10).toNonIndexed();
    cyl.rotateZ(Math.PI / 2);
    cyl.translate(s * xOff, 0, 0);
    parts.push(paint(cyl, 0x24262a));
    // bright hub bar — makes the spin readable
    const hub = new THREE.BoxGeometry(w + 0.06, r * 0.9, r * 0.34).toNonIndexed();
    hub.translate(s * xOff, 0, 0);
    parts.push(paint(hub, hubHex));
  }
  return mergeGeos(parts);
}

function buildTractorMeshes(tint, tintDark, mat) {
  const group = new THREE.Group();
  const DK = 0x23262b, CH = 0x3a3f46;
  const body = new THREE.Mesh(mergeGeos([
    box(1.5, 0.55, 2.7, 0, 0.85, 0.1, CH),          // chassis
    box(1.15, 0.85, 1.5, 0, 1.35, 0.8, tint),       // engine hood
    box(1.0, 0.6, 0.15, 0, 1.2, 1.6, DK),           // grille
    box(0.9, 0.4, 0.25, 0, 0.85, 1.72, DK),         // front weight block
    box(1.3, 0.35, 1.1, 0, 1.2, -0.75, tintDark),   // cab floor / seat pan
    box(1.1, 0.8, 0.22, 0, 1.85, -1.25, tintDark),  // seat back
    box(0.4, 0.3, 1.9, 1.08, 1.7, -0.55, tint),     // fender R
    box(0.4, 0.3, 1.9, -1.08, 1.7, -0.55, tint),    // fender L
    box(0.5, 0.35, 0.12, 0, 1.75, -0.15, DK),       // steering column
    box(0.16, 1.15, 0.16, 0.42, 2.15, 0.55, DK),    // exhaust stack
    box(0.24, 0.12, 0.24, 0.42, 2.78, 0.55, 0x14161a), // stack cap
  ]), mat);
  const driver = new THREE.Mesh(mergeGeos([
    box(0.62, 0.6, 0.4, 0, 0.3, 0, 0x3558a8),       // overalls
    box(0.42, 0.42, 0.42, 0, 0.85, 0, 0xe8b48a),    // head
    box(0.5, 0.14, 0.5, 0, 1.1, 0, 0xd8b04a),       // straw hat
  ]), mat);
  driver.position.set(0, 1.35, -0.75);
  const rearW = new THREE.Mesh(wheelPairGeo(0.98, 0.4, 0.98, 0xd8c23c), mat);
  rearW.position.set(0, 0.98, -0.55);
  const frontW = new THREE.Mesh(wheelPairGeo(0.52, 0.3, 0.8, 0xd8c23c), mat);
  frontW.position.set(0, 0.52, 1.25);
  body.castShadow = rearW.castShadow = frontW.castShadow = true;
  group.add(body, driver, rearW, frontW);
  return { group, body, driver, rearW, frontW, rwR: 0.98, fwR: 0.52, stack: _STACK_TIP };
}

/** Slow farm truck — same part names as the tractor (body / driver / rearW /
 *  frontW) so every downstream system treats the two identically. */
function buildTruckMeshes(tint, tintDark, mat) {
  const group = new THREE.Group();
  const DK = 0x23262b, WOOD = 0x8a6238, HAY = 0xd8b04a;
  const body = new THREE.Mesh(mergeGeos([
    box(1.9, 0.4, 4.6, 0, 0.75, 0, 0x33373d),        // ladder chassis
    box(1.85, 0.95, 1.5, 0, 1.42, 1.35, tint),       // cab
    box(1.62, 0.5, 0.12, 0, 1.72, 2.06, 0x8ec2d8),   // windscreen
    box(1.9, 0.55, 1.3, 0, 1.0, 1.4, tintDark),      // cab skirt
    box(1.7, 0.35, 0.3, 0, 0.72, 2.32, DK),          // front bumper
    box(1.85, 0.18, 3.0, 0, 1.05, -0.85, WOOD),      // flat bed
    box(0.12, 0.62, 3.0, 0.9, 1.44, -0.85, WOOD),    // stake sides
    box(0.12, 0.62, 3.0, -0.9, 1.44, -0.85, WOOD),
    box(1.85, 0.62, 0.12, 0, 1.44, -2.3, WOOD),      // tailgate
    box(1.5, 0.62, 1.2, 0, 1.45, -0.4, HAY),         // hay bales on the bed
    box(1.5, 0.62, 1.2, 0, 1.45, -1.7, 0xc89c38),
    box(1.2, 0.5, 1.0, 0, 1.95, -1.05, HAY),
    box(0.14, 1.05, 0.14, 0.99, 1.95, 1.5, DK),      // exhaust stack behind the cab
    box(0.2, 0.1, 0.2, 0.99, 2.5, 1.5, 0x14161a),
  ]), mat);
  const driver = new THREE.Mesh(mergeGeos([
    box(0.6, 0.55, 0.38, 0, 0.28, 0, 0x2e4a70),
    box(0.4, 0.4, 0.4, 0, 0.8, 0, 0xe8b48a),
    box(0.46, 0.13, 0.46, 0, 1.03, 0, 0x6a5a3a),     // flat cap
  ]), mat);
  driver.position.set(0, 1.12, 1.05);
  const rearW = new THREE.Mesh(wheelPairGeo(0.62, 0.42, 0.92, 0xb8b0a4), mat);
  rearW.position.set(0, 0.62, -1.35);
  const frontW = new THREE.Mesh(wheelPairGeo(0.6, 0.34, 0.92, 0xb8b0a4), mat);
  frontW.position.set(0, 0.6, 1.5);
  body.castShadow = rearW.castShadow = frontW.castShadow = true;
  group.add(body, driver, rearW, frontW);
  return { group, body, driver, rearW, frontW, rwR: 0.62, fwR: 0.6, stack: _TRUCK_STACK_TIP };
}

/** Panel van - a delivery box on wheels. */
function buildVanMeshes(tint, tintDark, mat) {
  const group = new THREE.Group();
  const DK = 0x23262b;
  const body = new THREE.Mesh(mergeGeos([
    box(1.8, 0.35, 4.2, 0, 0.7, 0, 0x33373d),        // chassis
    box(1.75, 1.5, 2.6, 0, 1.6, -0.6, tint),         // cargo box
    box(1.7, 0.95, 1.3, 0, 1.32, 1.35, tintDark),    // cab
    box(1.5, 0.5, 0.12, 0, 1.6, 2.0, 0x8ec2d8),      // windscreen
    box(1.6, 0.3, 0.28, 0, 0.68, 2.1, DK),           // bumper
    box(1.6, 1.1, 0.1, 0, 1.55, -1.92, tintDark),    // rear doors
  ]), mat);
  const driver = new THREE.Mesh(mergeGeos([
    box(0.6, 0.55, 0.38, 0, 0.28, 0, 0x4a4a52),
    box(0.4, 0.4, 0.4, 0, 0.8, 0, 0xe8b48a),
  ]), mat);
  driver.position.set(0, 1.05, 1.1);
  const rearW = new THREE.Mesh(wheelPairGeo(0.52, 0.32, 0.9, 0xb8b0a4), mat);
  rearW.position.set(0, 0.52, -1.35);
  const frontW = new THREE.Mesh(wheelPairGeo(0.52, 0.32, 0.9, 0xb8b0a4), mat);
  frontW.position.set(0, 0.52, 1.45);
  body.castShadow = rearW.castShadow = frontW.castShadow = true;
  group.add(body, driver, rearW, frontW);
  return { group, body, driver, rearW, frontW, rwR: 0.52, fwR: 0.52, stack: _TRUCK_STACK_TIP };
}

/** Road-maintenance truck: hazard-orange, tipper bed, amber beacon. */
function buildMaintenanceMeshes(tint, tintDark, mat) {
  const ORANGE = 0xd88a1e, ORDK = 0x9a5f12, DK = 0x23262b;
  const group = new THREE.Group();
  const body = new THREE.Mesh(mergeGeos([
    box(1.95, 0.4, 4.4, 0, 0.75, 0, 0x33373d),
    box(1.85, 0.98, 1.4, 0, 1.45, 1.42, ORANGE),     // cab
    box(1.6, 0.5, 0.12, 0, 1.72, 2.1, 0x8ec2d8),
    box(1.9, 0.9, 2.6, 0, 1.35, -0.75, ORDK),        // tipper bed
    box(1.7, 0.3, 2.4, 0, 1.85, -0.75, 0x6a625a),    // gravel load
    box(0.5, 0.14, 0.5, 0, 2.05, 1.42, DK),          // beacon base
    box(0.3, 0.3, 0.3, 0, 2.3, 1.42, 0xffb020),      // amber beacon
    box(1.9, 0.18, 0.4, 0, 0.66, 2.35, 0xe0e0e0),    // stripe bumper
  ]), mat);
  const driver = new THREE.Mesh(mergeGeos([
    box(0.6, 0.55, 0.38, 0, 0.28, 0, 0xd88a1e),      // hi-vis
    box(0.4, 0.4, 0.4, 0, 0.8, 0, 0xe8b48a),
    box(0.46, 0.16, 0.46, 0, 1.05, 0, 0xffffff),     // hard hat
  ]), mat);
  driver.position.set(0, 1.15, 1.1);
  const rearW = new THREE.Mesh(wheelPairGeo(0.62, 0.42, 0.95, 0xb8b0a4), mat);
  rearW.position.set(0, 0.62, -1.3);
  const frontW = new THREE.Mesh(wheelPairGeo(0.6, 0.34, 0.95, 0xb8b0a4), mat);
  frontW.position.set(0, 0.6, 1.55);
  body.castShadow = rearW.castShadow = frontW.castShadow = true;
  group.add(body, driver, rearW, frontW);
  return { group, body, driver, rearW, frontW, rwR: 0.62, fwR: 0.6, stack: _TRUCK_STACK_TIP };
}

/** Family car - lower and quicker than the farm machinery; often tows. */
function buildCarMeshes(tint, tintDark, mat) {
  const group = new THREE.Group();
  const DK = 0x23262b;
  const body = new THREE.Mesh(mergeGeos([
    box(1.7, 0.5, 3.6, 0, 0.72, 0, tint),            // shell
    box(1.5, 0.5, 1.9, 0, 1.2, -0.15, tintDark),     // glasshouse
    box(1.35, 0.4, 0.1, 0, 1.18, 0.85, 0x8ec2d8),    // windscreen
    box(1.5, 0.22, 0.5, 0, 0.62, 1.85, DK),          // bumper
    box(1.5, 0.22, 0.4, 0, 0.62, -1.82, DK),
  ]), mat);
  const driver = new THREE.Mesh(mergeGeos([
    box(0.55, 0.5, 0.36, 0, 0.26, 0, 0x6a3a5a),
    box(0.38, 0.38, 0.38, 0, 0.72, 0, 0xe8b48a),
  ]), mat);
  driver.position.set(0, 0.95, 0.2);
  const rearW = new THREE.Mesh(wheelPairGeo(0.42, 0.28, 0.82, 0x2a2d33), mat);
  rearW.position.set(0, 0.42, -1.15);
  const frontW = new THREE.Mesh(wheelPairGeo(0.42, 0.28, 0.82, 0x2a2d33), mat);
  frontW.position.set(0, 0.42, 1.15);
  body.castShadow = rearW.castShadow = frontW.castShadow = true;
  group.add(body, driver, rearW, frontW);
  return { group, body, driver, rearW, frontW, rwR: 0.42, fwR: 0.42, stack: _STACK_TIP };
}

/** Box luggage trailer - towed by the family car, same contract as the hay
 *  wagon so attachWagon-style logic applies unchanged. */
function buildTrailerMeshes(mat) {
  const group = new THREE.Group();
  const DK = 0x23262b;
  const body = new THREE.Mesh(mergeGeos([
    box(1.4, 0.9, 1.9, 0, 1.05, 0, 0xd8d4c8),        // box
    box(1.45, 0.12, 2.0, 0, 1.55, 0, 0x8a8478),      // lid
    box(0.12, 0.12, 1.4, 0, 0.62, 1.5, DK),          // hitch beam
  ]), mat);
  const wheels = new THREE.Mesh(wheelPairGeo(0.42, 0.24, 0.78, DK), mat);
  wheels.position.set(0, 0.42, -0.1);
  body.castShadow = wheels.castShadow = true;
  group.add(body, wheels);
  return { group, body, wheels };
}

function buildWagonMeshes(mat) {
  const group = new THREE.Group();
  const WOOD = 0x8a6238, HAY = 0xd8b04a;
  const body = new THREE.Mesh(mergeGeos([
    box(1.7, 0.5, 2.3, 0, 0.95, 0, WOOD),           // bed
    box(0.14, 0.55, 2.3, 0.85, 1.35, 0, WOOD),      // side planks
    box(0.14, 0.55, 2.3, -0.85, 1.35, 0, WOOD),
    box(1.7, 0.55, 0.14, 0, 1.35, 1.15, WOOD),
    box(1.7, 0.55, 0.14, 0, 1.35, -1.15, WOOD),
    box(1.35, 0.6, 1.9, 0, 1.65, 0, HAY),           // hay mound
    box(0.95, 0.45, 1.4, 0, 2.05, 0, 0xc89c38),
    box(0.14, 0.14, 1.5, 0, 0.75, 1.8, WOOD),       // hitch beam
  ]), mat);
  const wheels = new THREE.Mesh(wheelPairGeo(0.62, 0.26, 0.95, WOOD), mat);
  wheels.position.set(0, 0.62, -0.15);
  body.castShadow = wheels.castShadow = true;
  group.add(body, wheels);
  return { group, body, wheels };
}

// ---------- install ----------
function install(game) {
  if (game.__trafficInstalled) return;
  game.__trafficInstalled = true;

  const S = {
    ents: [],            // live traffic entities for the current world
    track: null,
    mat: null,
    wreckMat: new THREE.MeshStandardMaterial({ color: 0x1d1a16, roughness: 1 }),
    lastRaceTime: 0,
    t: 0,                // own sim clock (advances only while unpaused)
    crossFeedT: -9,
    proxies: [],         // AI-avoidance ghost solids (see registerProxy)
    proxyHost: null,     // the track.solids array they were pushed into
  };
  game.__traffic = S;    // read-only handle for the headless conformance probes

  // ---- AI avoidance without touching vehicles.js ----------------------------
  // Rivals sense hazards by scanning the LIVE `track.solids` array at ~6 Hz
  // (`Car._sense`), reading only {x, z, r} — that is how mid-race rockfall gets
  // dodged. The player's own `track.solids` push-out loop, by contrast, skips
  // any entry whose `y` is more than 6 u from the car. So a proxy parked at
  // y = -9999 is *invisible* to the player's collision (traffic.js keeps that,
  // with the relative-speed impact model below) yet fully visible to rival
  // steering: they slide around a tractor instead of grinding along it.
  function registerProxy() {
    const host = game.track && game.track.solids;
    if (!Array.isArray(host)) return null;
    if (S.proxyHost && S.proxyHost !== host) S.proxies.length = 0;
    S.proxyHost = host;
    const pr = { x: PARKED, z: PARKED, r: AVOID_R, y: -9999, mat: 'traffic' };
    host.push(pr);
    S.proxies.push(pr);
    return pr;
  }

  function dropProxies() {
    const host = S.proxyHost;
    if (Array.isArray(host)) {
      for (const pr of S.proxies) {
        const i = host.indexOf(pr);
        if (i >= 0) host.splice(i, 1);
      }
    }
    S.proxies.length = 0;
    S.proxyHost = null;
  }

  /** Park a proxy where rivals can't see it (dead traffic, or a crossing rig
   *  still out on its spur) — the 40 u broadphase rejects it for free. */
  function moveProxy(pr, x, z, live) {
    if (!pr) return;
    if (live) { pr.x = x; pr.z = z; } else { pr.x = pr.z = PARKED; }
  }

  // race restart hook: resetRace() puts every other world system back to
  // pristine, so traffic rides the same signal. Wrapped, not edited — main.js
  // knows nothing about this module. The raceTime-rewind watch in tick() stays
  // as a belt-and-braces fallback for any path that skips resetRace.
  if (typeof game.resetRace === 'function' && !game.__trafficResetWrap) {
    game.__trafficResetWrap = true;
    const origReset = game.resetRace.bind(game);
    game.resetRace = () => {
      origReset();
      try { resetTraffic(); } catch { /* defensive */ }
    };
  }

  // weapons blast hook: missiles / mines / shockwave already funnel through
  // game.blastWorld — wrap it once, non-invasively, so blasts hurt tractors
  if (typeof game.blastWorld === 'function' && !game.__trafficBlastWrap) {
    game.__trafficBlastWrap = true;
    const orig = game.blastWorld.bind(game);
    game.blastWorld = (x, z, radius, credit) => {
      orig(x, z, radius, credit);
      try { onBlast(x, z, radius, credit); } catch { /* defensive */ }
    };
  }

  // ---------- world (re)build ----------
  function clearWorld() {
    // Removing the group is not enough: GPU buffers survive until dispose(),
    // and rebuild() runs on every level change. Left as a bare remove this
    // leaked a full set of vehicles per swap (~37 geometries a hop, measured).
    for (const e of S.ents) {
      if (e.group.parent) e.group.parent.remove(e.group);
      disposeSubtree(e.group);
      if (e.wagon) {
        if (e.wagon.group.parent) e.wagon.group.parent.remove(e.wagon.group);
        disposeSubtree(e.wagon.group);
      }
    }
    S.ents.length = 0;
    dropProxies();
  }

  function rebuild() {
    clearWorld();
    S.track = game.track;
    const trk = game.track;
    S.crossBuilt = Array.isArray(trk?.crossroads) && trk.crossroads.length > 0;
    const theme = game.level && game.level.theme;
    if (!trk || !trk.center || !trk.center.length || !RURAL.has(theme)) return;
    const [tint, tintDark] = TINTS[theme] || TINTS.forest;
    S.mat = S.mat || new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, metalness: 0.05 });
    const N = trk.center.length;
    // 3 road vehicles spread around the lap, hugging alternating lane edges.
    // They travel WITH the race direction — slow movers you overtake, never
    // head-on traps the AI can't read.
    const spawns = [
      { f: 0.16, side: -1, lat: 5.8, speed: 6.5, kind: 'tractor', wagon: 'hay' },
      { f: 0.34, side: 1, lat: 6.2, speed: 11.5, kind: 'van', wagon: null },
      { f: 0.52, side: -1, lat: 6.2, speed: 7.5, kind: 'maint', wagon: null },
      { f: 0.70, side: 1, lat: 6.0, speed: 12.5, kind: 'car', wagon: 'trailer' },
      { f: 0.86, side: -1, lat: 6.4, speed: 9.5, kind: 'truck', wagon: null },
    ];
    for (const sp of spawns) {
      const ent = makeVehicle(sp.kind, tint, tintDark);
      ent.fi = ent.spawnFi = (sp.f * N) % N;
      ent.lat = sp.side * sp.lat;
      ent.baseSpeed = sp.speed;
      if (sp.wagon) attachWagon(ent, sp.wagon);
      S.ents.push(ent);
      poseRoad(ent, true);
    }
    // ---- crossroad crossings: one vehicle per junction, up to 2 ----
    // Defensive throughout: bad or missing data simply yields no crossings.
    try {
      const crs = Array.isArray(trk.crossroads) ? trk.crossroads : [];
      let made = 0;
      for (const cr of crs) {
        if (made >= 2) break;
        const route = makeRoute(trk, cr);
        if (!route) continue;
        const ent = makeVehicle(made === 0 ? 'tractor' : 'van', tint, tintDark);
        ent.baseSpeed = 4.6 + made * 0.8;   // slow = telegraphed
        ent.cross = route;
        if (made === 0) attachWagon(ent);   // the farm rig hauling hay across
        S.ents.push(ent);
        poseCross(ent, true);
        made++;
      }
    } catch { /* malformed crossroads data — skip the feature */ }
  }

  /** Turn one published crossroad record into a straight shuttle route.
   *  s is measured along (dx,dz) from the spur mouth on the road edge:
   *  s = +len is the far end of the graded spur, s < 0 crosses the road. */
  function makeRoute(trk, cr) {
    if (!cr || !Number.isFinite(cr.x) || !Number.isFinite(cr.z)) return null;
    if (!Number.isFinite(cr.dx) || !Number.isFinite(cr.dz)) return null;
    const dl = Math.hypot(cr.dx, cr.dz);
    if (!(dl > 0.5)) return null;
    const dx = cr.dx / dl, dz = cr.dz / dl;
    const N = trk.center.length;
    const i = ((cr.index | 0) % N + N) % N;
    const n = trk.nrm && trk.nrm[i];
    if (!n) return null;
    // lateral gained per unit of s (|.| = sin(junction angle) ≥ ~0.86)
    const latPerS = dx * n.x + dz * n.z;
    if (Math.abs(latPerS) < 0.2) return null;      // degenerate, near-parallel
    const side = latPerS >= 0 ? 1 : -1;
    const len = THREE.MathUtils.clamp(Number(cr.len) || 20, 10, 40);
    const y = Number.isFinite(cr.y) ? cr.y : trk.center[i].y;
    return {
      i, side, dx, dz, latPerS, y,
      cx: cr.x, cz: cr.z,                          // mouth, on the road edge
      sOut: len - 2,                               // park short of the spur end
      sIn: -(MOUTH_LAT + FAR_SHOULDER) / Math.abs(latPerS), // far shoulder
      sEdgeNear: (ROAD_EDGE - MOUTH_LAT) / Math.abs(latPerS),   // spur-side road edge
      sEdgeFar: (-ROAD_EDGE - MOUTH_LAT) / Math.abs(latPerS),   // far road edge
      s: len - 2, dir: -1, wait: 1.5 + Math.random() * 2.5,
      looked: false, turn: false, feedT: -9,
    };
  }

  function makeVehicle(kind, tint, tintDark) {
    const m = kind === 'truck' ? buildTruckMeshes(tint, tintDark, S.mat)
      : kind === 'van' ? buildVanMeshes(tint, tintDark, S.mat)
      : kind === 'maint' ? buildMaintenanceMeshes(tint, tintDark, S.mat)
      : kind === 'car' ? buildCarMeshes(tint, tintDark, S.mat)
      : buildTractorMeshes(tint, tintDark, S.mat);
    (game.worldLayer || game.scene).add(m.group);
    return {
      ...m, kind,
      wagon: null, cross: null, proxy: registerProxy(),
      fi: 0, spawnFi: 0, lat: 0, baseSpeed: 7, speed: 0,
      hp: TRACTOR_HP, alive: true,
      stopT: 0, wobT: 0, lurchX: 0, lurchZ: 0, puffT: Math.random(),
      wreckT: 0, respawnT: 0, sink: 0,
      x: 0, y: 0, z: 0, heading: 0,
      vx: 0, vz: 0,        // world velocity — collisions run in this frame
      wx: 0, wz: 0, wy: 0, // wagon collider center
    };
  }

  function attachWagon(ent, kind = 'hay') {
    const w = kind === 'trailer' ? buildTrailerMeshes(S.mat) : buildWagonMeshes(S.mat);
    (game.worldLayer || game.scene).add(w.group);
    ent.wagon = { ...w, hitch: kind === 'trailer' ? 3.6 : 4.4, proxy: registerProxy() };
  }

  // ---------- posing ----------
  function roadPose(trk, fi, lat, group) {
    const N = trk.center.length;
    const i0 = Math.floor(fi) % N;
    const i1 = (i0 + 1) % N;
    const f = fi - Math.floor(fi);
    const c0 = trk.center[i0], c1 = trk.center[i1];
    const n0 = trk.nrm[i0], n1 = trk.nrm[i1];
    const nx = n0.x + (n1.x - n0.x) * f, nz = n0.z + (n1.z - n0.z) * f;
    group.position.set(
      c0.x + (c1.x - c0.x) * f + nx * lat,
      c0.y + (c1.y - c0.y) * f,
      c0.z + (c1.z - c0.z) * f + nz * lat
    );
    const t0 = trk.tan[i0], t1 = trk.tan[i1];
    const tx = t0.x + (t1.x - t0.x) * f, tz = t0.z + (t1.z - t0.z) * f;
    group.rotation.order = 'YXZ';
    group.rotation.y = Math.atan2(tx, tz);
    group.rotation.x = -Math.atan2(c1.y - c0.y, trk.segLen || 2);
    group.rotation.z = 0;
  }

  function poseRoad(ent, snap) {
    const trk = S.track;
    roadPose(trk, ent.fi, ent.lat, ent.group);
    ent.group.position.x += ent.lurchX;
    ent.group.position.z += ent.lurchZ;
    ent.x = ent.group.position.x; ent.y = ent.group.position.y; ent.z = ent.group.position.z;
    ent.heading = ent.group.rotation.y;
    if (ent.wagon) {
      const N = trk.center.length;
      let wfi = ent.fi - ent.wagon.hitch / (trk.segLen || 2);
      wfi = ((wfi % N) + N) % N;
      roadPose(trk, wfi, ent.lat, ent.wagon.group);
      ent.wx = ent.wagon.group.position.x;
      ent.wy = ent.wagon.group.position.y;
      ent.wz = ent.wagon.group.position.z;
    }
    if (snap) ent.group.updateMatrixWorld(true);
  }

  /** Height along a crossing route: pinned to road grade while the vehicle is
   *  on (or beside) the carriageway, easing onto the terrain further out — the
   *  spur ribbon itself is graded exactly this way in track.js. */
  function crossY(c, s, x, z) {
    const lat = Math.abs(MOUTH_LAT + s * Math.abs(c.latPerS));
    const t = THREE.MathUtils.clamp((lat - 9.5) / 8, 0, 1);
    if (t <= 0) return c.y;
    let th = c.y;
    try { if (S.track.terrainHeight) th = S.track.terrainHeight(x, z); } catch { /* keep road grade */ }
    if (!Number.isFinite(th)) th = c.y;
    return c.y * (1 - t) + th * t;
  }

  function poseCross(ent, snap) {
    const c = ent.cross;
    const x = c.cx + c.dx * c.s, z = c.cz + c.dz * c.s;
    const y = crossY(c, c.s, x, z);
    ent.group.position.set(x + ent.lurchX, y, z + ent.lurchZ);
    ent.group.rotation.order = 'YXZ';
    ent.group.rotation.y = Math.atan2(c.dx * c.dir, c.dz * c.dir);
    ent.group.rotation.x = 0;
    ent.group.rotation.z = 0;
    ent.x = ent.group.position.x; ent.y = y; ent.z = ent.group.position.z;
    ent.heading = ent.group.rotation.y;
    if (ent.wagon) {
      const ws = c.s - c.dir * ent.wagon.hitch;          // trails behind
      const wx = c.cx + c.dx * ws, wz = c.cz + c.dz * ws;
      const wy = crossY(c, ws, wx, wz);
      ent.wagon.group.position.set(wx, wy, wz);
      ent.wagon.group.rotation.order = 'YXZ';
      ent.wagon.group.rotation.set(0, ent.group.rotation.y, 0);
      ent.wx = wx; ent.wy = wy; ent.wz = wz;
    }
    if (snap) ent.group.updateMatrixWorld(true);
  }

  /** Signed lateral of a crossing vehicle, in the spur's own side units:
   *  +MOUTH_LAT at the mouth, 0 on the centreline, negative past it. */
  function crossLat(c, s) { return MOUTH_LAT + s * Math.abs(c.latPerS); }

  /** Point the rivals' avoidance proxies at the current hull positions. A
   *  crossing rig only registers once it is near the carriageway — parked out
   *  on its spur it is scenery, and rivals must not swerve for it. */
  function syncProxies(ent) {
    const near = ent.alive && (!ent.cross || Math.abs(crossLat(ent.cross, ent.cross.s)) < ROAD_EDGE + 3);
    moveProxy(ent.proxy, ent.x, ent.z, near);
    if (ent.wagon) {
      const wNear = ent.alive && (!ent.cross
        || Math.abs(crossLat(ent.cross, ent.cross.s - ent.cross.dir * ent.wagon.hitch)) < ROAD_EDGE + 3);
      moveProxy(ent.wagon.proxy, ent.wx, ent.wz, wNear);
    }
  }

  /** Warn the player about a vehicle pulling across the road ahead. Rate
   *  limited per junction AND globally so it never spams the feed. */
  function telegraph(ent) {
    const c = ent.cross;
    if (S.t - c.feedT < 12 || S.t - S.crossFeedT < 5) return;
    const p = game.player;
    if (!p || !p.pos) return;
    const dx = p.pos.x - ent.x, dz = p.pos.z - ent.z;
    if (dx * dx + dz * dz > 110 * 110) return;
    c.feedT = S.t; S.crossFeedT = S.t;
    game.hud?.feed?.(ent.kind === 'truck' ? 'TRUCK CROSSING!' : 'TRACTOR CROSSING!', 'info');
  }

  // ---------- per-frame ----------
  function updateEntity(ent, dt) {
    if (!ent.alive) { ent.vx = ent.vz = 0; syncProxies(ent); updateWreck(ent, dt); return; }
    // ease speed: stopped after a hit, else puttering at base pace
    const target = ent.stopT > 0 ? 0 : ent.baseSpeed;
    ent.stopT = Math.max(0, ent.stopT - dt);
    ent.speed += THREE.MathUtils.clamp(target - ent.speed, -8 * dt, 3.2 * dt);
    ent.lurchX *= Math.exp(-6 * dt);
    ent.lurchZ *= Math.exp(-6 * dt);

    if (ent.cross) {
      const c = ent.cross;
      // The rig shuttles spur ⇄ far shoulder, so BOTH legs put it on the
      // carriageway: the look-both-ways pause and the warning are symmetric,
      // triggered a few units before the edge it is about to pull past.
      const atEdge = c.dir < 0 ? c.s <= c.sEdgeNear + 4 : c.s >= c.sEdgeFar - 4;
      const onRoad = Math.abs(crossLat(c, c.s)) < ROAD_EDGE + 1.5;
      if (c.wait > 0) {
        c.wait -= dt;
        ent.speed = 0;
        if (c.wait <= 0 && c.turn) { c.dir = -c.dir; c.turn = false; }
      } else if (!c.looked && atEdge && !onRoad) {
        c.looked = true;
        c.wait = 1.1;
        telegraph(ent);
      } else {
        c.s += c.dir * ent.speed * dt;
        if (c.s >= c.sOut) { c.s = c.sOut; c.wait = 4 + Math.random() * 5; c.turn = true; c.looked = false; }
        else if (c.s <= c.sIn) { c.s = c.sIn; c.wait = 4 + Math.random() * 5; c.turn = true; c.looked = false; }
        else if (onRoad) telegraph(ent);
      }
      poseCross(ent, false);
    } else {
      const trk = S.track;
      const N = trk.center.length;
      ent.fi = (ent.fi + (ent.speed * dt) / (trk.segLen || 2)) % N;
      poseRoad(ent, false);
    }

    // world velocity for the relative-impact model (heading already points
    // down the direction of travel for both road and crossing routes)
    ent.vx = Math.sin(ent.heading) * ent.speed;
    ent.vz = Math.cos(ent.heading) * ent.speed;
    syncProxies(ent);

    // wheels spin with ground speed (a crossing rig turns round at each end,
    // so its heading already carries the direction — always spin forward)
    ent.rearW.rotation.x += (ent.speed / ent.rwR) * dt;
    ent.frontW.rotation.x += (ent.speed / ent.fwR) * dt;
    if (ent.wagon) ent.wagon.wheels.rotation.x += (ent.speed / 0.62) * dt;

    // driver: idle bob + crash wobble
    ent.wobT = Math.max(0, ent.wobT - dt);
    const bob = ent.speed > 0.5 ? Math.sin(S.t * 9 + ent.spawnFi) * 0.05 : 0;
    ent.driver.rotation.z = bob + (ent.wobT > 0 ? Math.sin(ent.wobT * 18) * 0.4 * ent.wobT : 0);
    ent.driver.rotation.x = ent.wobT > 0 ? Math.sin(ent.wobT * 14) * 0.25 * ent.wobT : 0;

    // light exhaust puffs off the stack (pooled particles, low rate)
    ent.puffT -= dt;
    if (ent.puffT <= 0 && ent.speed > 0.5 && ent.stack && game.particles?.spawn) {
      ent.puffT = 0.45 + Math.random() * 0.35;
      ent.group.updateMatrixWorld();
      _v1.copy(ent.stack).applyMatrix4(ent.group.matrixWorld);
      game.particles.spawn(
        _v1.x, _v1.y, _v1.z,
        (Math.random() - 0.5) * 0.6, 1.6 + Math.random() * 0.8, (Math.random() - 0.5) * 0.6,
        _PUFF, 1.1 + Math.random() * 0.6, 0.8 + Math.random() * 0.4,
        { drag: 1.4, shrink: 0.25 });
    }
  }

  function updateWreck(ent, dt) {
    if (ent.wreckT > 0) {
      ent.wreckT -= dt;
      if (ent.wreckT > 3 && Math.random() < 0.18 && game.particles?.damageSmoke) {
        _v1.set(ent.x, ent.y + 1, ent.z);
        game.particles.damageSmoke(_v1, 0.8);
      }
      if (ent.wreckT < 1.5) {
        ent.group.position.y -= dt * 1.3;
        if (ent.wagon) ent.wagon.group.position.y -= dt * 1.3;
      }
      if (ent.wreckT <= 0) {
        ent.group.visible = false;
        if (ent.wagon) ent.wagon.group.visible = false;
        ent.respawnT = RESPAWN_AFTER;
      }
      return;
    }
    ent.respawnT -= dt;
    if (ent.respawnT <= 0) respawn(ent);
  }

  function respawn(ent) {
    ent.alive = true;
    ent.hp = TRACTOR_HP;
    ent.speed = 0; ent.stopT = 0; ent.wobT = 0;
    ent.vx = ent.vz = 0;
    ent.lurchX = ent.lurchZ = 0;
    ent.wreckT = 0; ent.respawnT = 0;
    ent.fi = ent.spawnFi;
    if (ent.cross) {
      const c = ent.cross;
      c.s = c.sOut; c.dir = -1; c.wait = 1.5 + Math.random() * 2.5;
      c.looked = false; c.turn = false; c.feedT = -9;
    }
    for (const m of [ent.body, ent.driver, ent.rearW, ent.frontW]) { m.material = S.mat; m.visible = true; }
    ent.body.rotation.set(0, 0, 0);
    ent.group.visible = true;
    if (ent.wagon) {
      for (const m of [ent.wagon.body, ent.wagon.wheels]) { m.material = S.mat; m.visible = true; }
      ent.wagon.body.rotation.set(0, 0, 0);
      ent.wagon.group.visible = true;
    }
    if (ent.cross) poseCross(ent, true); else poseRoad(ent, true);
    syncProxies(ent);
  }

  // ---------- collision (Law of Solidity: SOLID push-out, heavy-metal cost) ----------
  // Traffic MOVES, so the impact that matters is the RELATIVE closing speed
  // along the contact normal — catching a tractor doing 7 u/s at 12 u/s is a
  // 5 u/s nudge, not a 12 u/s wall slam. Everything downstream (rebound,
  // damage, lurch) is computed in the tractor's frame.
  function collideCar(car, ent, cx, cy, cz, r) {
    const dx = car.pos.x - cx, dz = car.pos.z - cz;
    const rr = r + CAR_R;
    const d2 = dx * dx + dz * dz;
    if (d2 >= rr * rr || d2 < 1e-8) return;
    if (Math.abs(car.pos.y - cy) > 3.5) return; // flying clean over
    const d = Math.sqrt(d2);
    const nx = dx / d, nz = dz / d;
    car.pos.x = cx + nx * rr;               // push-out along the contact normal
    car.pos.z = cz + nz * rr;
    const vn = (car.vel.x - ent.vx) * nx + (car.vel.z - ent.vz) * nz;
    if (vn >= 0) return;
    const impact = -vn;
    car.vel.x -= nx * vn * 1.05;            // ≤5% rebound — never pinball
    car.vel.z -= nz * vn * 1.05;
    // AI can't steer around traffic (their avoidance list is out of reach) —
    // bias the push tangentially along their heading so rivals skirt the
    // tractor and keep racing instead of stalling nose-first against it
    if (car !== game.player) {
      const fx = Math.sin(car.heading), fz = Math.cos(car.heading);
      if (fx * -nx + fz * -nz > 0.35) { // driving into it
        const s = (fx * -nz + fz * nx) >= 0 ? 1 : -1;
        const tx = -nz * s, tz = nx * s;
        car.pos.x += tx * 0.3;
        car.pos.z += tz * 0.3;
        const boost = Math.min(5, 2 + impact * 0.3);
        car.vel.x += tx * boost;
        car.vel.z += tz * boost;
      }
    }
    _n.set(nx, 0, nz);
    if (impact > 3 && game.particles?.sparks) {
      _v1.set(cx + nx * r, cy + 0.8, cz + nz * r);
      game.particles.sparks(_v1, _n, Math.min(16, 4 + impact | 0));
    }
    // mutual: a REAL hit makes the tractor lurch and briefly stop; light rubs
    // only wobble the driver (a grinding rival must not park the tractor —
    // a permanently stopped tractor becomes a rolling roadblock for the AI)
    if (impact > 6) {
      ent.stopT = Math.max(ent.stopT, 0.9 + impact * 0.05);
      ent.wobT = Math.max(ent.wobT, 0.7);
      ent.lurchX += -nx * Math.min(1.1, impact * 0.05);
      ent.lurchZ += -nz * Math.min(1.1, impact * 0.05);
    } else if (impact > 2) {
      ent.wobT = Math.max(ent.wobT, 0.4);
    }
    if (impact > 6 && S.t - (car._tracHitT ?? -9) > HIT_RATE) {
      car._tracHitT = S.t;
      const dmg = Math.min(28, (impact - 6) * 1.4);
      car.damage?.(dmg, null);
      ent.hp -= impact * 1.2;               // bodywork breaks it too (Law #4)
      ent.wobT = 1.2;
      if (car === game.player) {
        game.hud?.feed?.(`TRACTOR!  −${Math.round(dmg)} HULL`, 'bad');
        game.shake = Math.min(1, (game.shake ?? 0) + 0.2 + impact * 0.015);
        game.buzz?.(35);
        game.audio?.scrape?.();
        if (dmg >= 18) game.crashDrama?.();
      }
      if (ent.hp <= 0) killTractor(ent, car === game.player);
    }
  }

  function collisions() {
    const p = game.player;
    for (const ent of S.ents) {
      if (!ent.alive) continue;
      if (p && p.alive) {
        collideCar(p, ent, ent.x, ent.y, ent.z, BODY_R);
        if (ent.wagon) collideCar(p, ent, ent.wx, ent.wy, ent.wz, WAGON_R);
      }
      if (!game.freeRoam && Array.isArray(game.enemies)) {
        for (const e of game.enemies) {
          if (!e.alive) continue;
          collideCar(e, ent, ent.x, ent.y, ent.z, BODY_R);
          if (ent.wagon) collideCar(e, ent, ent.wx, ent.wy, ent.wz, WAGON_R);
        }
      }
    }
  }

  // ---------- weapons vs traffic ----------
  function weaponsVsTraffic() {
    const w = game.weapons;
    if (!w) return;
    if (Array.isArray(w.bullets)) {
      for (const b of w.bullets) {
        if (!b.active || b.owner !== game.player) continue;
        for (const ent of S.ents) {
          if (!ent.alive) continue;
          let hit = hitsCircle(b.pos, ent.x, ent.y, ent.z, BODY_R + 0.6);
          if (!hit && ent.wagon) hit = hitsCircle(b.pos, ent.wx, ent.wy, ent.wz, WAGON_R + 0.6);
          if (!hit) continue;
          b.active = false; // weapons.update zeroes the instance next frame
          ent.hp -= b.dmg || 8;
          ent.wobT = Math.max(ent.wobT, 0.8);
          ent.stopT = Math.max(ent.stopT, 0.8);
          if (game.particles?.sparks) { _n.set(0, 1, 0); game.particles.sparks(b.pos, _n, 6); }
          game.audio?.hit?.();
          if (ent.hp <= 0) killTractor(ent, true);
          break;
        }
      }
    }
    if (Array.isArray(w.missiles)) {
      for (const m of w.missiles) {
        if (m.owner !== game.player || m.life <= 0) continue;
        for (const ent of S.ents) {
          if (!ent.alive) continue;
          const dx = m.pos.x - ent.x, dz = m.pos.z - ent.z;
          if (dx * dx + dz * dz < 3.4 * 3.4) { m.life = 0; break; } // detonate at the airframe; the blast wrap pays out
        }
      }
    }
  }

  function hitsCircle(p, x, y, z, r) {
    const dx = p.x - x, dz = p.z - z;
    return dx * dx + dz * dz < r * r && Math.abs(p.y - (y + 1.3)) < 2.6;
  }

  function onBlast(x, z, radius, credit) {
    for (const ent of S.ents) {
      if (!ent.alive) continue;
      const dx = ent.x - x, dz = ent.z - z;
      const rr = radius + BODY_R;
      if (dx * dx + dz * dz < rr * rr) {
        ent.hp -= 80;
        if (ent.hp <= 0) killTractor(ent, credit === game.player);
      }
    }
  }

  // ---------- destruction ----------
  function killTractor(ent, byPlayer) {
    if (!ent.alive) return;
    ent.alive = false;
    ent.hp = 0;
    ent.speed = 0;
    ent.wreckT = WRECK_LIFE;
    ent.vx = ent.vz = 0;
    syncProxies(ent);   // a husk is scenery again — rivals stop swerving for it
    _v1.set(ent.x, ent.y + 1, ent.z);
    game.particles?.explosion?.(_v1, false);
    game.audio?.explosion?.(false);
    game.flashLight?.(_v1);
    // flying parts: wheels + driver tumble off (clones, cleaned up by the
    // game's own flyingProps pipeline — resetRace clears them too)
    if (Array.isArray(game.flyingProps)) {
      const parts = [ent.rearW, ent.frontW, ent.driver];
      if (ent.wagon) parts.push(ent.wagon.wheels);
      for (const src of parts) {
        src.visible = false;
        const fly = src.clone();
        src.getWorldPosition(fly.position);
        src.getWorldQuaternion(fly.quaternion);
        (game.worldLayer || game.scene).add(fly);
        game.flyingProps.push({
          mesh: fly,
          vel: new THREE.Vector3((Math.random() - 0.5) * 9, 7 + Math.random() * 5, (Math.random() - 0.5) * 9),
          spin: new THREE.Vector3((Math.random() - 0.5) * 11, (Math.random() - 0.5) * 11, (Math.random() - 0.5) * 11),
          life: 1.9,
        });
      }
    }
    // charred husk-style wreck: slumped, dark, smoking
    ent.body.material = S.wreckMat;
    ent.body.rotation.z = (Math.random() - 0.5) * 0.4;
    if (ent.wagon) {
      ent.wagon.body.material = S.wreckMat;
      ent.wagon.body.rotation.z = (Math.random() - 0.5) * 0.4;
    }
    if (byPlayer) {
      if (typeof game.style === 'function') game.style(150, 'TRACTOR DESTROYED');
      else {
        game.score = (game.score ?? 0) + 150;
        game.hud?.feed?.('TRACTOR DESTROYED  +150', 'good');
      }
      game.styleBump?.();
    }
  }

  // ---------- reset / world-change watch ----------
  function resetTraffic() {
    for (const ent of S.ents) respawn(ent);
    S.crossFeedT = -9;
  }

  // ---------- own rAF loop, paced by game state ----------
  let last = performance.now();
  let warned = false;
  function tick(now) {
    requestAnimationFrame(tick);
    let dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    try {
      // world identity change (defensive — levels normally swap via reload)
      if (game.track !== S.track) rebuild();
      // crossroads published AFTER install (another agent's system may attach
      // the data late) — adopt it once by rebuilding this world's traffic
      if (!S.crossBuilt && S.ents.length
          && Array.isArray(game.track?.crossroads) && game.track.crossroads.length) {
        rebuild();
      }
      if (!S.ents.length) return;
      // race restart: raceTime rewinds → put traffic back to pristine
      if ((game.raceTime ?? 0) < S.lastRaceTime - 1e-6) resetTraffic();
      S.lastRaceTime = game.raceTime ?? 0;
      const st = game.state;
      const moving = st === 'race' || st === 'countdown' || st === 'finished';
      if (!moving) return; // paused / title / menus: traffic freezes with the game
      if (game.hitStop > 0) dt *= 0.3; // match the game's slow-motion beat
      S.t += dt;
      for (const ent of S.ents) updateEntity(ent, dt);
      if (st !== 'countdown') {
        collisions();
        weaponsVsTraffic();
      }
    } catch (err) {
      if (!warned) { warned = true; console.warn('[traffic] update error:', err); }
    }
  }
  rebuild();
  requestAnimationFrame(tick);
}

// ---------- self-attach: poll for the game object ----------
(function boot() {
  const g = window.__game;
  if (g && g.scene && g.track) {
    try { install(g); } catch (err) { console.warn('[traffic] install failed:', err); }
  } else {
    requestAnimationFrame(boot);
  }
})();
