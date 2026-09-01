// Car meshes (built from primitives), arcade physics, and rival AI.
import * as THREE from 'three';
import { ROAD_HALF, RIM_RADIUS, mergeBoxes } from './track.js';
import { numberPlateTexture, glowTexture } from './textures.js';
import { DRIVING } from './driving.js';

const WALL_LIMIT = ROAD_HALF + 0.55; // barrier clamp for car center
const SPRAY_SNOW = new THREE.Color(0xf4faff); // tire spray tints (snow / wet)
/** Seconds of held throttle going nowhere, on a slick surface with the wrong
 *  compound fitted, before the car is written off (see PlayerCar.update). */
const BOG_WRECK_S = 5;
const SPRAY_WET = new THREE.Color(0x9dbcd2);
const FORD_FOAM = new THREE.Color(0xeef7fb); // ---- river-fords: bow-wave white
// 9.8, down from 16 (r293): GRADE is gravity's slope component and 16 was
// arcade-inflated to be felt against a 34-strength engine. The spec engine
// drives at ~6.6, and at GRADE 16 a 0.28-slope massif ramp — the free-roam
// mountain the goat-peaks feature exists for — cost more than the car had
// (+4.6 u in 4.5 s against test-goat's floor of 25). Physical gravity keeps
// every law's shape: moderate grades climb slowly, grades past ~0.67 out-
// pull the engine entirely, and the MAX_GRADE traction fade still owns the
// band between.
const GRADE = 9.8; // grade force: vf -= GRADE * slope * dt while grounded on-road
const DOWNHILL_CAP = 1.12; // downhill overspeed ceiling (× topSpeed)
// Steepest ground a car can still pull itself up. The drivable massif peaks
// near 24%, so this leaves all of it alone and only ever engages on the border
// wall, which runs an order of magnitude steeper.
const MAX_GRADE = 0.45;
/** OFF THE COURSE, THE ENGINE STOPS PULLING YOU UPHILL.
 *
 *  Not a gradient gate — that was tried and reverted. Measured on SUMMIT
 *  CLIMB, open-ground grade p90 is 95% on the VERGE (12-40 u off the road)
 *  and 25% on the MASSIF (r > 400): the mountain is GENTLER than the
 *  roadside, so no threshold separates them in either direction. What does
 *  separate them is the rule already in the code — the 70 u off-course band.
 *  Beyond it the throttle's authority fades out from OFF_CLIMB and is gone by
 *  OFF_CLIMB + OFF_FADE. NOTHING IS SCRUBBED: momentum you brought is
 *  momentum you keep, so a bank taken with speed is still a line and a
 *  mountain taken from rest is still a wall. */
const OFF_CLIMB = 0.03;
const OFF_FADE = 0.08;
/** IS THE COURSE AN OPEN WORLD, OR A ROAD?
 *
 *  `game.freeRoam` was answering this, and it is not the same question. That
 *  flag carries TWO meanings and main.js:1297 (`if (this.missionMode)
 *  this.freeRoam = true`) only ever intended one of them:
 *
 *    PRESENTATION — open world, no grid, roam HUD and camera. Missions want
 *    this, and setting the flag is the right way to get it.
 *    PHYSICS PREDICATE — "the course is not a road, so the rules that keep you
 *    ON one do not apply." Missions must NOT get this, and were.
 *
 *  MEASURED on SUMMIT CLIMB, patched tree, one start point, real rAF loop:
 *  a race climbs 29.1 u with the off-course band engaging (max strayed 70);
 *  a HOT LAP mission climbs 46.8 u with it never engaging at all (max strayed
 *  0), which is free roam's own 46.3 u. Every mission is a ROAD event with a
 *  clock, so the goat fix simply never applied to any of the four.
 *
 *  The off-road race modes, when they land, take this exemption on purpose and
 *  belong in this predicate (`|| g.offRoadRace`) — NOT in a loosened OFF_CLIMB,
 *  which would put the goat back on every road world at once.
 *
 *  EXPORTED so there is exactly one definition. weapons.js asks the same
 *  question about the same cliff faces, and a second inline copy of
 *  `freeRoam && !missionMode` is how the two drift apart. */
export const openCourse = (g) => !!(g && g.freeRoam && !g.missionMode);
/** Fastest a crest may throw the car upward, u/s. Uncapped, a steep ramp taken
 *  on nitro sent cars 100+ u into the infield. It also bounds a jump: against
 *  gravity 26 this is 0.85 s of hang time and 2.3 u of height before the road
 *  falls away underneath. A car may not launch while the ground is rising
 *  faster than this — see the coherence check in the crest branch. */
// Lap gates as fractions of the lap, armed strictly in order — see checkLap.
// Quarter points rather than more: every extra gate is another place a legal
// racing line can be judged illegal, and four already makes the infield
// uncuttable on every layout in the roster.
const LAP_GATES = [0.2, 0.4, 0.6, 0.8];
const VY_CAP = 11;

const SCORCH = new THREE.Color(0x1c1a18); // damage tint target
const _hitNormal = new THREE.Vector3(); // scratch: obstacle bounce normal
const _splash = new THREE.Vector3();    // scratch: puddle splash spawn point
const _leafBack = new THREE.Vector3();  // scratch: -forward, for the leaf wake
const _obPos = new THREE.Vector3();     // scratch: obstacle/puddle track projection (AI)
const _shove = new THREE.Vector3();     // scratch: ram-contact push direction

// ---------- roof sponsor decals ----------
// Small canvas-drawn sponsor plates (white rounded rect + fictional brand word),
// like the liveries on toy rally trucks. Cached per brand string.
const BRANDS = ['APEX', 'SCORP', 'RAIDER', 'ECO-PWR', 'GEARHD', 'VOLT'];
const decalCache = new Map();
function roofDecalTexture(text) {
  if (decalCache.has(text)) return decalCache.get(text);
  const c = document.createElement('canvas');
  c.width = 256; c.height = 128;
  const ctx = c.getContext('2d');
  // rounded white plate with dark outline (manual path for compatibility)
  const x = 8, y = 20, w = 240, h = 88, r = 24;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
  ctx.fillStyle = '#f4f1e8';
  ctx.fill();
  ctx.lineWidth = 7;
  ctx.strokeStyle = '#1c1a18';
  ctx.stroke();
  // red accent bar under the word
  ctx.fillStyle = '#d8342a';
  ctx.fillRect(x + 30, y + h - 24, w - 60, 9);
  // brand word, shrunk to fit
  ctx.fillStyle = '#1c1a18';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let size = 54;
  ctx.font = `900 ${size}px Arial, sans-serif`;
  while (ctx.measureText(text).width > w - 44 && size > 18) {
    size -= 4;
    ctx.font = `900 ${size}px Arial, sans-serif`;
  }
  ctx.fillText(text, 128, y + (h - 14) / 2);
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  decalCache.set(text, tex);
  return tex;
}

// ---------- mesh factory: the Voxel Racers collection ----------
// Blocky toy racers with liveries: brawler (off-road hero), crown (low-slung
// racer), sleek (compact hatch), dune (rally wagon), alpine (striped rally
// coupe), pit (black stock car).
let _carAoTex = null;
/** Soft radial shadow blob shared by every car's underside. */
function _carAoTexture() {
  if (_carAoTex) return _carAoTex;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const x = c.getContext('2d');
  const gr = x.createRadialGradient(32, 32, 4, 32, 32, 31);
  gr.addColorStop(0, 'rgba(0,0,0,0.85)');
  gr.addColorStop(0.45, 'rgba(0,0,0,0.42)');
  gr.addColorStop(0.75, 'rgba(0,0,0,0.14)');
  gr.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = gr;
  x.fillRect(0, 0, 64, 64);
  _carAoTex = new THREE.CanvasTexture(c);
  return _carAoTex;
}

// ---------- inline livery painters (canvas textures, cached) ----------
let _solarTex = null;
/** Solar-panel roof: deep blue cells in a light alloy frame. */
function _solarRoofTexture() {
  if (_solarTex) return _solarTex;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d');
  x.fillStyle = '#0e1a2e';
  x.fillRect(0, 0, 128, 128);
  const gr = x.createLinearGradient(0, 0, 128, 128); // cell sheen
  gr.addColorStop(0, 'rgba(110,160,255,0.30)');
  gr.addColorStop(0.5, 'rgba(110,160,255,0.05)');
  gr.addColorStop(1, 'rgba(110,160,255,0.24)');
  x.fillStyle = gr;
  x.fillRect(0, 0, 128, 128);
  x.strokeStyle = '#33507e';
  x.lineWidth = 3;
  for (let i = 1; i < 4; i++) {
    x.beginPath(); x.moveTo(i * 32, 0); x.lineTo(i * 32, 128); x.stroke();
    x.beginPath(); x.moveTo(0, i * 32); x.lineTo(128, i * 32); x.stroke();
  }
  x.strokeStyle = '#d8d2c2';
  x.lineWidth = 6;
  x.strokeRect(3, 3, 122, 122);
  _solarTex = new THREE.CanvasTexture(c);
  return _solarTex;
}

const _roundelCache = new Map();
/** Rally door roundel: white disc, red pin-ring, bold black number. */
function _roundelTexture(num) {
  const key = String(num);
  if (_roundelCache.has(key)) return _roundelCache.get(key);
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d');
  x.beginPath(); x.arc(64, 64, 58, 0, Math.PI * 2);
  x.fillStyle = '#f4f1e8'; x.fill();
  x.lineWidth = 7; x.strokeStyle = '#1c1a18'; x.stroke();
  x.beginPath(); x.arc(64, 64, 47, 0, Math.PI * 2);
  x.lineWidth = 3; x.strokeStyle = '#d8342a'; x.stroke();
  x.fillStyle = '#1c1a18';
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.font = `900 ${key.length > 1 ? 54 : 66}px Arial, sans-serif`;
  x.fillText(key, 64, 68);
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  _roundelCache.set(key, tex);
  return tex;
}

const _sponsorCache = new Map();
/** Painted sponsor strip for the doors: colored chevron blocks + brand words. */
function _sponsorPanelTexture(brand, c1, c2) {
  const key = `${brand}|${c1}|${c2}`;
  if (_sponsorCache.has(key)) return _sponsorCache.get(key);
  const c = document.createElement('canvas');
  c.width = 512; c.height = 128;
  const x = c.getContext('2d');
  x.fillStyle = '#f4f1e8';
  x.fillRect(0, 0, 512, 128);
  x.strokeStyle = '#1c1a18';
  x.lineWidth = 6;
  x.strokeRect(3, 3, 506, 122);
  // leading chevron block in c1 carrying the brand word
  x.fillStyle = c1;
  x.beginPath();
  x.moveTo(6, 6); x.lineTo(232, 6); x.lineTo(196, 122); x.lineTo(6, 122);
  x.closePath(); x.fill();
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  let size = 50;
  x.font = `900 ${size}px Arial, sans-serif`;
  while (x.measureText(brand).width > 186 && size > 20) {
    size -= 4;
    x.font = `900 ${size}px Arial, sans-serif`;
  }
  x.fillStyle = '#f4f1e8';
  x.fillText(brand, 110, 66);
  // trailing chevron block in c2
  x.fillStyle = c2;
  x.beginPath();
  x.moveTo(404, 6); x.lineTo(506, 6); x.lineTo(506, 122); x.lineTo(368, 122);
  x.closePath(); x.fill();
  x.fillStyle = '#f4f1e8';
  x.font = '900 34px Arial, sans-serif';
  x.fillText('PRO', 448, 66);
  // middle small words
  x.fillStyle = '#1c1a18';
  x.font = '900 30px Arial, sans-serif';
  x.fillText('RALLY', 295, 46);
  x.font = '700 22px Arial, sans-serif';
  x.fillText('MOTOR OIL', 295, 86);
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  _sponsorCache.set(key, tex);
  return tex;
}

/** BoxGeometry with shifted top edges: drop/pull the top-front and top-rear
 *  edges to carve sloped hoods, raked windshields and fastback tails. */
function _wedgeGeo(w, h, d, { frontDrop = 0, frontBack = 0, backDrop = 0, backFwd = 0 } = {}) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    if (p.getY(i) <= 0) continue;
    if (p.getZ(i) > 0) {
      p.setY(i, p.getY(i) - frontDrop);
      p.setZ(i, p.getZ(i) - frontBack);
    } else {
      p.setY(i, p.getY(i) - backDrop);
      p.setZ(i, p.getZ(i) + backFwd);
    }
  }
  geo.computeVertexNormals();
  return geo;
}

/** ONE MATERIAL FOR EVERY CAR'S LAMPS.
 *
 *  Nothing about it varies per car, and `fadeCarLights` has to write it every
 *  frame — eight cars meant eight identical writes and eight copies of the
 *  same glow texture. It is a module singleton, which also means
 *  `_dropCarMesh` must not dispose it (see the guard there).
 */
export const CAR_LIGHT_OPACITY = 0.85;
let _carLightMat = null;
export function carLightMaterial() {
  if (_carLightMat) return _carLightMat;
  _carLightMat = new THREE.MeshBasicMaterial({
    map: glowTexture(), vertexColors: true, transparent: true,
    opacity: CAR_LIGHT_OPACITY, blending: THREE.AdditiveBlending,
    depthWrite: false, side: THREE.DoubleSide, fog: false,
  });
  return _carLightMat;
}

const _fadeV = new THREE.Vector3();
/** THE BEAM IS A FLAT QUAD LYING ON THE ROAD, so how much of it the camera
 *  sees is decided entirely by how steeply the camera looks down.
 *
 *  Reported from a phone on the TOP-DOWN view: a blown-out white wedge four
 *  car-lengths long washing out the carriageway. The rig was tuned from CHASE,
 *  where the same quad is seen at a 13 degrees grazing angle and reads as a
 *  soft pool; from 46 u up it presents its whole area to the lens and an
 *  additive quad over dark tarmac saturates to paper white.
 *
 *  Camera elevation is the whole of it — the downward component of the view
 *  direction runs 0.03 in the driver's seat, 0.22 on CHASE, 0.56 on TRAIL and
 *  0.82 on TOP FAR — so the fade is driven straight off that. The LAMP and
 *  TAIL quads fade with it, which costs nothing: they are vertical, so from
 *  overhead they are edge-on anyway, and each car's own modelled lenses (the
 *  `tailMat` bars) are solid geometry and untouched.
 */
export function fadeCarLights(camera) {
  if (!_carLightMat || !camera) return;
  const down = Math.abs(_fadeV.set(0, 0, -1).applyQuaternion(camera.quaternion).y);
  const k = 1 - THREE.MathUtils.smoothstep(down, 0.28, 0.74) * CAR_LIGHT_TOPDOWN_CUT;
  _carLightMat.opacity = CAR_LIGHT_OPACITY * k;
}
/** How much of the beam is taken away looking straight down. Measured, not
 *  guessed — see `tools-scratch/beamlook.mjs`.
 *
 *  0.45, DOWN FROM 0.72, BECAUSE THE DEFAULT CAMERA IS AN OVERHEAD ONE.
 *  Reported from a phone as "all cars need to have headlights" — and every car
 *  had them: all eight rigs report visible on a dark world, and they share a
 *  single material, so no car can be lit differently from another. What
 *  differed was the CAMERA. `beamread.mjs` hides every rig and counts the
 *  pixels that change, which is exact:
 *
 *      TOP-DOWN  down 0.76   opacity 0.238
 *      TOP FAR   down 0.82   opacity 0.238
 *      TRAIL     down 0.55   opacity 0.461
 *      CHASE     down 0.23   opacity 0.850
 *
 *  The two overhead modes were sitting on the floor of the curve at 28% — and
 *  TOP-DOWN is what the game starts in. At that strength the nearest, best-
 *  angled car still shows a beam and the rest do not, which reads exactly as
 *  "some cars have headlights and some don't". The reason for the fade is
 *  real (a wedge lying flat on the road, seen from straight above, is a
 *  painted puddle rather than light), so it stays — it just may not take the
 *  read away entirely.
 *
 *  ...AND THEN 0.18, ASKED FOR A SECOND TIME. 0.45 still halved the beam in
 *  the mode the game opens in, and halved is what "some cars have headlights
 *  and some don't" looks like on a phone. The purist argument for a deep cut —
 *  that a wedge lying flat on the road, seen from above, reads as paint rather
 *  than as light — loses to being asked twice for headlights. What survives of
 *  it is a gentle taper: straight down is still a little softer than a chase
 *  view rather than identical to it. */
export const CAR_LIGHT_TOPDOWN_CUT = 0.18;

/* WHY THERE IS NO `THREE.SpotLight` ANY MORE.
 *
 * r245 lit the night with one real spotlight on the PLAYER, plus a pair of
 * small sphere lamps dressed onto every car. That is exactly what was
 * photographed and reported twice as "all cars need to have headlights": the
 * rivals had lamp dots and nothing on the road, because there was one
 * headlight in the world and it belonged to you.
 *
 * Eight spotlights is not the fix — the light count is part of every
 * material's shader cache key, so it is eight times the per-fragment cost and
 * a full recompile on the worlds that have it. The fix is that NOBODY gets a
 * real one: the merged rig below paints the lamp, the pool it lays on the
 * road and the tail lenses, in a single additive draw call per car, and every
 * car on the grid gets the same one. Equal, and cheaper than what it replaced.
 */
export function buildVoxelRacer(spec) {
  const { body, accent, stripe = null, number = null, style = 'crown', rims = null } = spec;
  const g = new THREE.Group();
  const mat = (color, opts = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0.05, ...opts });
  // glossy toy-car paint: picks up the PMREM sky for real specular sheen
  const bodyMat = mat(body, { roughness: 0.32, metalness: 0.22, envMapIntensity: 1.15 });
  const accentMat = mat(accent, { roughness: 0.34, metalness: 0.2, envMapIntensity: 1.1 });
  const darkMat = mat(0x24201c);
  const glassMat = mat(0x121a22, { roughness: 0.12, metalness: 0.7, envMapIntensity: 1.6 });
  const rimMat = mat(rims ?? 0xd8d2c2, { roughness: 0.28, metalness: 0.75, envMapIntensity: 1.1 });
  const tireMat = mat(0x181614, { roughness: 0.95 });
  const headMat = new THREE.MeshBasicMaterial({ color: 0xfff9e2 });
  const tailMat = new THREE.MeshBasicMaterial({ color: 0xff2418 });

  // 'flatsix' is a rear-engined fastback: short nose, roof falling in one
  // unbroken line to the tail. 'bastion' is the tall performance estate on the
  // same platform — SUV height and length, but a saloon's rake, not a truck's.
  const tall = style === 'brawler' || style === 'dune' || style === 'bastion';
  const low = style === 'crown' || style === 'alpine' || style === 'pit'
    || style === 'flatsix';
  const wheelR = style === 'brawler' ? 0.85 : style === 'bastion' ? 0.80
    : tall ? 0.76 : style === 'flatsix' ? 0.66 : 0.62;
  const wheelY = wheelR;
  const baseY = wheelY + (low ? 0.18 : 0.34); // chassis floor height

  const box = (w, h, d, m, x, y, z, shadow = false) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    mesh.position.set(x, y, z);
    if (shadow) mesh.castShadow = true;
    g.add(mesh);
    return mesh;
  };
  /** Round lamp disc, parented so pods carry their lights when they pop off. */
  const lampDisc = (r, x, y, z, parent = g) => {
    const d = new THREE.Mesh(new THREE.CircleGeometry(r, 10), headMat);
    d.position.set(x, y, z);
    parent.add(d);
    return d;
  };
  /** Spare wheel (tire + rim child). upright = facing fore/aft on a tailgate. */
  const spareWheel = (r, w, x, y, z, upright = false) => {
    const geoT = new THREE.CylinderGeometry(r, r, w, 10);
    const geoR = new THREE.CylinderGeometry(r * 0.48, r * 0.48, w + 0.04, 8);
    if (upright) { geoT.rotateX(Math.PI / 2); geoR.rotateX(Math.PI / 2); }
    const t = new THREE.Mesh(geoT, tireMat);
    t.position.set(x, y, z);
    t.add(new THREE.Mesh(geoR, rimMat));
    g.add(t);
    return t;
  };

  // ---- proportions: every car is a wedge now ----
  const bodyLen = style === 'crown' || style === 'pit' ? 4.7 : style === 'sleek' ? 4.0
    : style === 'bastion' ? 4.8 : style === 'flatsix' ? 4.3 : 4.4;
  const bodyH = low ? 0.62 : 0.78;
  // the rear-engined car has almost no bonnet — the nose drops away at once,
  // which is the single most recognisable thing about its profile
  const noseLen = style === 'flatsix' ? 1.55 : tall ? 1.2 : style === 'sleek' ? 1.3 : 1.5;
  const frontDrop = style === 'flatsix' ? 0.46 : tall ? 0.26 : style === 'sleek' ? 0.3 : 0.34;
  const hoodAng = Math.atan2(frontDrop, noseLen);
  const noseZ0 = bodyLen / 2 - noseLen; // where the flat deck ends
  const topY = baseY + 0.12 + bodyH;    // flat deck height

  // ---- chassis + wedge hull (flat deck aft, hood sloping to the nose) ----
  // THE BODY'S OWN WIDTH, published on the rig below. `halfW` is the bounding
  // box and includes the WHEELS (1.8 against the body's 1.3), so anything
  // mounted "on the flank" off halfW ends up outboard of the bodywork, floating
  // over the arches — which is exactly what happened to the cannon pods.
  const BODY_W = 2.6;
  box(2.5, 0.4, bodyLen - 0.3, darkMat, 0, baseY, 0); // chassis
  box(BODY_W, bodyH, bodyLen - noseLen, bodyMat, 0, baseY + bodyH / 2 + 0.12, -noseLen / 2, true);
  const nose = new THREE.Mesh(_wedgeGeo(BODY_W, bodyH, noseLen, { frontDrop, frontBack: 0.14 }), bodyMat);
  nose.position.set(0, baseY + bodyH / 2 + 0.12, (bodyLen - noseLen) / 2);
  nose.castShadow = true;
  g.add(nose);

  // ---- greenhouse: raked glass trapezoid under a painted roof cap ----
  const cabW = 2.15, cabH = low ? 0.6 : 0.74;
  const cabZ = style === 'sleek' ? -0.45 : style === 'dune' ? 0.1
    : style === 'flatsix' ? -0.30 : style === 'bastion' ? -0.20 : -0.15;
  const cabL = style === 'sleek' ? 1.9 : style === 'dune' ? 1.7
    : style === 'flatsix' ? 2.25 : style === 'bastion' ? 2.15 : 2.0;
  const fRake = style === 'flatsix' ? 0.70 : style === 'bastion' ? 0.52
    : tall ? 0.42 : style === 'sleek' ? 0.55 : 0.62; // windshield rake
  // 0.95 is the fastback: the glasshouse runs out almost to nothing at the
  // back, so the roofline and the tail are one continuous fall.
  const bRake = style === 'flatsix' ? 0.95 : style === 'bastion' ? 0.34
    : style === 'sleek' ? 0.5 : style === 'crown' ? 0.45
      : style === 'alpine' ? 0.35 : style === 'pit' ? 0.3 : 0.2; // tail rake
  const cabY = topY + cabH / 2;
  const glassHouse = new THREE.Mesh(
    _wedgeGeo(cabW, cabH, cabL, { frontBack: fRake, backFwd: bRake }), glassMat);
  glassHouse.position.set(0, cabY, cabZ);
  glassHouse.castShadow = true;
  g.add(glassHouse);
  const capL = cabL - fRake - bRake;
  const capZ = cabZ + (bRake - fRake) / 2;
  const capMat = style === 'pit' || style === 'sleek' ? bodyMat : accentMat;
  box(cabW - 0.15, 0.1, capL + 0.1, capMat, 0, cabY + cabH / 2 + 0.05, capZ);
  const capTop = cabY + cabH / 2 + 0.1;

  // ---- THE INSIDE OF THE CAR --------------------------------------------
  //
  // Asked for as "as with real car": from the seat you should see a car around
  // you, not a bonnet floating in front of open air. None of the bodywork above
  // has an inside — the greenhouse is a closed box whose faces all cull when
  // you are within it — so the cabin gets its own furniture, built to the SAME
  // cabW/cabH/cabL the glasshouse used, which is what makes it fit all eight
  // body styles instead of one.
  //
  // IT IS A FRAME, NOT A ROOM, and that is the whole lesson of the first cut.
  // A literal interior — roof lining overhead, deep dash, shoulder lines —
  // turned the view into horizontal black bands with a slot of road between
  // them, because this cabin is 0.74 u tall on a 2.6 u wide body: stylised
  // proportions in which a seated eye is a hand's breadth from every panel, so
  // anything modelled at real scale subtends an enormous angle. So: only the
  // pieces that READ as a car from the seat, all of them thin, all of them
  // around the EDGE of the windscreen aperture, and nothing directly overhead.
  //
  // Plain FrontSide boxes throughout, deliberately: the dash is seen from
  // ABOVE, the header from BELOW, the pillars edge-on. Nothing needs
  // DoubleSide, so nothing can leak out through the shell from a chase camera.
  {
    // NOT NEAR-BLACK. At 0x141210 under an overcast sky the dash rendered as a
    // VOID: measured on REDWOOD RAMPAGE, the frame simply stopped at the
    // scuttle line and rows 67-100% were flat black, which reads as a hole in
    // the picture rather than as the inside of a car. A real dash top is matte
    // mid-grey that catches the sky, so these sit at roughly the road's own
    // brightness and the lower frame becomes part of the car.
    // BRIGHT ENOUGH TO READ AS FURNITURE. Painted magenta by a probe, the
    // dash showed as a full-width slab of the lower frame; at 0x4a463f under
    // a cabin that gets mostly hemisphere light it rendered as silhouette —
    // the driver's-view report's black band was one part this, one part the
    // car's own shadow on the road (handled in _driverCamera). Two steps
    // lighter keeps it obviously interior, stops it reading as a hole.
    const inner = mat(0x6b6155, { roughness: 0.9, metalness: 0.02 });
    const trim = mat(0x82786a, { roughness: 0.78, metalness: 0.08 });
    const cockpit = new THREE.Group();
    cockpit.name = 'cockpit';
    const put = (w, h, d, m, x, y, z, rx = 0) => {
      const q = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
      q.position.set(x, y, z); if (rx) q.rotation.x = rx;
      cockpit.add(q); return q;
    };
    // ---- PLACED AROUND THE EYE, NOT AROUND THE CABIN BOX ------------------
    //
    // The previous cut hung everything off the windscreen end of the cabin
    // (`fz`), and the eye sits at `cabZ + cabL * 0.38`. On a 2 u cabin that put
    // the dash 0.04 u in front of the driver's face — closer than the near
    // plane — so the entire interior was clipped away every frame and hiding it
    // changed the render by exactly nothing. Measured twice before that was
    // noticed.
    //
    // These proportions are STYLISED: the cabin is 0.74 u tall on a 6 u car,
    // where a real greenhouse is nearer a fifth of the body. So the furniture
    // cannot sit at scale distances from a scale eye — it is placed at the
    // distances that READ, forward of the eye and clear of the near plane,
    // which is what a cockpit view needs to be built from in the first place.
    const eyeZ = cabZ + cabL * 0.38;       // the seat (see _driverTune, main.js)
    const eyeY = cabY + cabH * 0.18;
    // HOW FAR DOWN THE FRAME A PIECE LANDS IS drop/distance, NOTHING ELSE, and
    // that ratio is the only number that matters here. At AHEAD 0.85 with a
    // 0.34 drop the dash sat 22 degrees below the axis and — with a header to
    // match above it — squeezed the world into a 30% letterbox band. Shot and
    // seen, after a black-pixel metric stopped tracking it (the interior had
    // been lightened, so "near-black" no longer matched the thing filling the
    // screen).
    //
    // A cockpit needs ONE piece: a dash across the bottom. No header — the top
    // of the frame is where the road you are about to need lives. No pillars —
    // at this FOV they are outside the frame or across it, never at its edge.
    // 2.1, and BRINGING IT IN WAS TRIED AND REVERTED — recorded because the
    // reasoning for trying it is sound and somebody will have it again.
    //
    // THE CAMERA'S OWN PITCH ADDS TO THE GEOMETRIC ANGLE: the seat aims at a
    // look-point up the road, so it is already tilted down ~8 degrees, and a
    // dash computed to sit 25 degrees below the AXIS arrives ~33 degrees below
    // the horizon — measured at 68% of frame against the 80% it was sized for.
    // Pushing it out trades angle for distance and lands it where it was meant
    // to be.
    //
    // Once the hood stopped being drawn (see `_driverCamera`) 2.1 left the dash
    // floating a car's length out with daylight under it, so it was brought
    // back to 1.15. That is worse, and the render says why: at 1.15 the dash's
    // 0.40-deep top face is nearly edge-on to the eye and reads as a WALL —
    // measured filling the bottom 26% of the frame, against 20% at 2.1 with a
    // clear band of road under it. A shallow surface seen edge-on is all
    // thickness and no surface.
    const AHEAD = 2.5;   // pushed from 2.1: same trade of angle for distance
                         // that took it from 1.15 to 2.1, one step further —
                         // the slab was landing mid-frame, not the bottom fifth
    // dash top edge at ~atan(0.72/2.1) = 19 degrees below the axis, plus the
    // camera's own pitch, which puts it in the bottom fifth.
    put(cabW * 1.05, 0.16, 0.40, inner, 0, eyeY - 0.72, eyeZ + AHEAD, -0.16);
    // the scuttle lip along its far edge: the line that reads as a windscreen
    put(cabW * 1.05, 0.06, 0.10, trim, 0, eyeY - 0.64, eyeZ + AHEAD + 0.19);
    // instrument binnacle, on the driver's side
    put(cabW * 0.34, 0.09, 0.24, trim, -cabW * 0.17, eyeY - 0.63, eyeZ + AHEAD - 0.10, -0.26);
    // STEERING WHEEL — closer than the dash and lower, so it sits under the
    // road rather than across it. Turned each frame by the camera.
    const wheel = new THREE.Group();
    wheel.name = 'wheel';
    wheel.add(new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.025, 8, 20), inner));
    for (const a of [0, 2.094, 4.189]) {
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.022, 0.022), trim);
      spoke.position.set(Math.cos(a) * 0.10, Math.sin(a) * 0.10, 0);
      spoke.rotation.z = a;
      wheel.add(spoke);
    }
    // the wheel sits just inside the dash's own line, so it reads without
    // taking a second slice of frame
    wheel.position.set(-cabW * 0.17, eyeY - 0.80, eyeZ + 1.05);
    wheel.rotation.x = Math.PI / 2 - 0.40;
    cockpit.add(wheel);
    cockpit.visible = false;                    // the seat turns it on
    g.userData.cockpit = cockpit;
    g.userData.wheel = wheel;
    g.add(cockpit);
  }

  // ---- livery: stripes running deck -> hood slope -> roof cap ----
  if (stripe) {
    const sm = mat(stripe[0]);
    const hoodL = noseLen / Math.cos(hoodAng) - 0.1;
    box(0.62, 0.05, bodyLen - noseLen - 0.15, sm, 0, topY + 0.028, -noseLen / 2);
    const hs = box(0.62, 0.04, hoodL, sm, 0, topY - frontDrop / 2 + 0.02, (bodyLen - noseLen) / 2 + 0.02);
    hs.rotation.x = hoodAng;
    if (style !== 'sleek') box(0.62, 0.04, capL, sm, 0, capTop + 0.02, capZ);
    if (stripe[1]) {
      const sm2 = mat(stripe[1]);
      for (const s of [-1, 1]) {
        box(0.2, 0.05, bodyLen - noseLen - 0.15, sm2, 0.52 * s, topY + 0.028, -noseLen / 2);
        const h2 = box(0.2, 0.04, hoodL, sm2, 0.52 * s, topY - frontDrop / 2 + 0.02, (bodyLen - noseLen) / 2 + 0.02);
        h2.rotation.x = hoodAng;
      }
    }
  }

  // ---- door roundels + painted sponsor panels ----
  if (number !== null) {
    const rMat = new THREE.MeshBasicMaterial({
      map: _roundelTexture(number), transparent: true,
      polygonOffset: true, polygonOffsetFactor: -1,
    });
    const rGeo = new THREE.PlaneGeometry(bodyH + 0.16, bodyH + 0.16);
    for (const s of [-1, 1]) {
      const p = new THREE.Mesh(rGeo, rMat);
      p.position.set(1.315 * s, baseY + 0.12 + bodyH / 2 + 0.03, 0.55);
      p.rotation.y = s * Math.PI / 2;
      g.add(p);
    }
  }
  if (style === 'crown' || style === 'alpine') {
    const c1 = style === 'crown' ? '#d8342a' : '#2f9e44';
    const c2 = style === 'crown' ? '#2f9e44' : '#d8342a';
    const spMat = new THREE.MeshBasicMaterial({
      map: _sponsorPanelTexture(spec.brand ?? 'APEX', c1, c2), transparent: true,
      polygonOffset: true, polygonOffsetFactor: -1,
    });
    const spGeo = new THREE.PlaneGeometry(1.7, 0.44);
    for (const s of [-1, 1]) {
      const p = new THREE.Mesh(spGeo, spMat);
      p.position.set(1.315 * s, baseY + 0.12 + bodyH / 2 + 0.02, -0.75);
      p.rotation.y = s * Math.PI / 2;
      g.add(p);
    }
  }

  // ---- the two signatures that make these silhouettes readable ----------
  if (style === 'flatsix') {
    // REAR HAUNCHES. The rear-engined car is widest over its back axle, and
    // that shoulder — not the nose — is what the eye names it by. A pair of
    // shallow blisters over the rear arches, plus the ducktail lip that sits
    // on the engine cover.
    for (const sd of [-1, 1]) {
      box(0.30, bodyH * 0.66, 1.55, bodyMat, sd * 1.32,
        baseY + 0.12 + bodyH * 0.42, -bodyLen / 2 + 1.25, true);
    }
    // ducktail: a short raised lip across the tail, on two stubs
    box(2.05, 0.09, 0.42, accentMat, 0, topY + 0.22, -bodyLen / 2 + 0.42);
    for (const sd of [-1, 1]) {
      box(0.12, 0.22, 0.18, darkMat, sd * 0.8, topY + 0.11, -bodyLen / 2 + 0.42);
    }
    // engine-cover louvres, between the haunches
    for (let k = 0; k < 4; k++) {
      box(1.5, 0.03, 0.07, darkMat, 0, topY + 0.035,
        -bodyLen / 2 + 0.75 + k * 0.17);
    }
  }
  if (style === 'bastion') {
    // ROOF RAILS and a tailgate spoiler: the estate cues. Rails run the full
    // length of the cap so the roof reads long, which is what separates this
    // from the short, upright off-roader body.
    for (const sd of [-1, 1]) {
      box(0.10, 0.07, capL + 0.55, darkMat, sd * (cabW / 2 - 0.22),
        capTop + 0.05, capZ);
    }
    box(1.9, 0.08, 0.30, accentMat, 0, capTop + 0.02, capZ - capL / 2 - 0.22);
    // underbody skid plates, front and rear
    for (const zz of [bodyLen / 2 - 0.18, -bodyLen / 2 + 0.18]) {
      box(1.7, 0.07, 0.42, mat('#b8bcc0'), 0, baseY - 0.10, zz);
    }
  }

  // ---- chunky bumpers, grille, round headlamps, tail bar ----
  box(2.6, 0.34, 0.38, darkMat, 0, baseY + 0.02, bodyLen / 2 + 0.06);
  box(2.6, 0.34, 0.38, darkMat, 0, baseY + 0.02, -bodyLen / 2 - 0.06);
  const faceY = baseY + 0.12 + (bodyH - frontDrop) * 0.55; // nose face midline
  box(1.1, 0.2, 0.07, darkMat, 0, faceY, bodyLen / 2 + 0.01); // grille
  for (const s of [-1, 1]) {
    lampDisc(0.17, 0.9 * s, faceY, bodyLen / 2 + 0.02);
    box(0.44, 0.2, 0.07, tailMat, 0.88 * s, baseY + bodyH * 0.55 + 0.12, -bodyLen / 2 - 0.03);
  }
  box(0.9, 0.09, 0.06, darkMat, 0, baseY + bodyH * 0.55 + 0.12, -bodyLen / 2 - 0.02);

  // ---- HIGH-POLY REAR AND ROOF ------------------------------------------
  //
  // The back of every car was a flat slab with two small lamps on it, and the
  // roof a bare painted cap — which is a problem, because the back of the car
  // is the view you have of it for the entire race, and the roof is what the
  // overhead cameras look at. Detail here is worth more than detail anywhere
  // else on the machine.
  //
  // COST DISCIPLINE: every `box()` above is its OWN mesh, and a car already
  // costs 49-63 of them — a six-car grid is ~343 draw calls against a world
  // budget around 900. Adding eighteen more boxes each the naive way would be
  // another 108 draws for the grid. So this section does not use `box()`: it
  // accumulates specs per material and merges each material into ONE geometry,
  // which is +3 draw calls per car for ~430 triangles. Polygons are cheap
  // here; draw calls are not.
  const dBody = [], dDark = [], dLamp = [], dChrome = [];
  const rear = -bodyLen / 2;                  // tail face
  const sillY = baseY + 0.10;
  {
    // --- tail-light clusters: a wrapped lens with an inner strip ----------
    for (const s of [-1, 1]) {
      dLamp.push({ w: 0.30, h: 0.16, d: 0.07, x: 1.16 * s, y: baseY + bodyH * 0.55 + 0.12, z: rear - 0.03 });
      dLamp.push({ w: 0.10, h: 0.13, d: 0.16, x: 1.30 * s, y: baseY + bodyH * 0.55 + 0.12, z: rear + 0.10 });
      // reverse lamp, below the cluster
      dChrome.push({ w: 0.20, h: 0.08, d: 0.05, x: 0.62 * s, y: baseY + bodyH * 0.25, z: rear - 0.02 });
    }
    // --- boot / tailgate shut line and a number-plate recess --------------
    dDark.push({ w: 1.9, h: 0.035, d: 0.05, x: 0, y: baseY + bodyH * 0.9, z: rear - 0.02 });
    dDark.push({ w: 0.78, h: 0.26, d: 0.05, x: 0, y: baseY + bodyH * 0.30, z: rear - 0.05 });
    dChrome.push({ w: 0.70, h: 0.20, d: 0.02, x: 0, y: baseY + bodyH * 0.30, z: rear - 0.08 });
    // --- diffuser: a valance with vertical fins --------------------------
    dDark.push({ w: 2.15, h: 0.20, d: 0.30, x: 0, y: sillY - 0.06, z: rear - 0.16 });
    for (let k = -2; k <= 2; k++) {
      dDark.push({ w: 0.07, h: 0.22, d: 0.34, x: k * 0.42, y: sillY - 0.04, z: rear - 0.18 });
    }
    // --- twin exhaust tips ------------------------------------------------
    for (const s of [-1, 1]) {
      dChrome.push({ w: 0.15, h: 0.15, d: 0.24, x: 0.70 * s, y: sillY + 0.02, z: rear - 0.26 });
    }
    // --- ROOF: drip rails, a panel seam and a shark-fin aerial ------------
    for (const s of [-1, 1]) {
      dDark.push({ w: 0.06, h: 0.05, d: capL + 0.06, x: (cabW / 2 - 0.10) * s, y: capTop + 0.02, z: capZ });
    }
    dDark.push({ w: cabW - 0.34, h: 0.03, d: 0.05, x: 0, y: capTop + 0.03, z: capZ - capL / 2 + 0.16 });
    dDark.push({ w: 0.10, h: 0.14, d: 0.34, x: 0, y: capTop + 0.08, z: capZ - capL / 2 + 0.02 });
    dDark.push({ w: 0.07, h: 0.09, d: 0.20, x: 0, y: capTop + 0.19, z: capZ - capL / 2 - 0.02 });
    // a low-slung car gets a roof vent instead of a rack it would never carry
    if (low) {
      dBody.push({ w: 0.52, h: 0.07, d: 0.40, x: 0, y: capTop + 0.03, z: capZ + capL / 2 - 0.30 });
      dDark.push({ w: 0.40, h: 0.05, d: 0.05, x: 0, y: capTop + 0.07, z: capZ + capL / 2 - 0.22 });
    }
  }
  const chromeMat = mat(0xc8ccd2, { roughness: 0.35, metalness: 0.6 });
  for (const [specs, m] of [[dBody, bodyMat], [dDark, darkMat],
    [dLamp, tailMat], [dChrome, chromeMat]]) {
    if (!specs.length) continue;
    const dm = new THREE.Mesh(mergeBoxes(specs), m);
    dm.castShadow = true;
    dm.userData.detail = true;            // not a smashable panel
    g.add(dm);
  }

  // ---- style signatures ----
  if (style === 'brawler') {
    // expedition roof rack: rails, crate, gear box, rolled tarp
    const rkY = capTop + 0.1;
    for (const s of [-1, 1]) box(0.09, 0.14, capL + 0.5, darkMat, 0.82 * s, rkY, capZ);
    for (const e of [-1, 1]) box(1.72, 0.12, 0.09, darkMat, 0, rkY, capZ + e * (capL / 2 + 0.2));
    box(0.62, 0.34, 0.6, mat(0x8a6a42, { roughness: 0.9 }), -0.38, rkY + 0.26, capZ - 0.22);
    box(0.52, 0.26, 0.48, accentMat, 0.42, rkY + 0.22, capZ - 0.26);
    const tarp = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 1.5, 8), mat(0xb8452e, { roughness: 0.85 }));
    tarp.rotation.z = Math.PI / 2;
    tarp.position.set(0, rkY + 0.16, capZ + 0.42);
    g.add(tarp);
    // tailgate spare on a mount plate, proud of the rear bumper
    box(0.5, 0.5, 0.16, darkMat, 0, baseY + bodyH * 0.6, -bodyLen / 2 - 0.3);
    spareWheel(0.55, 0.3, 0, baseY + bodyH * 0.6, -bodyLen / 2 - 0.5, true);
    // side ladder up to the rack (rear left)
    for (const zz of [-0.95, -1.5]) box(0.06, 1.05, 0.09, rimMat, -1.36, topY - 0.35, zz);
    for (let i = 0; i < 3; i++) box(0.06, 0.07, 0.62, rimMat, -1.36, topY - 0.7 + i * 0.32, -1.225);
    // twin-bar bull bar
    for (const yy of [0.3, 0.62]) box(2.2, 0.15, 0.15, darkMat, 0, baseY + yy, bodyLen / 2 + 0.34);
    for (const s of [-1, 1]) box(0.13, 0.55, 0.13, darkMat, 0.72 * s, baseY + 0.46, bodyLen / 2 + 0.34);
  }
  if (style === 'pit') {
    // front winch drum + fairlead + gold tow hook
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.85, 10), rimMat);
    drum.rotation.z = Math.PI / 2;
    drum.position.set(0, baseY + 0.36, bodyLen / 2 + 0.32);
    g.add(drum);
    for (const s of [-1, 1]) box(0.14, 0.4, 0.26, darkMat, 0.52 * s, baseY + 0.3, bodyLen / 2 + 0.3);
    box(0.34, 0.1, 0.12, rimMat, 0, baseY + 0.14, bodyLen / 2 + 0.46);
    box(0.1, 0.2, 0.09, mat(0xe8b83a), 0, baseY + 0.02, bodyLen / 2 + 0.46);
    // roof spot bar: four forward lamps
    const bar = box(1.7, 0.17, 0.24, darkMat, 0, capTop + 0.12, capZ + capL / 2 - 0.1);
    for (const s of [-0.6, -0.2, 0.2, 0.6]) lampDisc(0.075, s, 0, 0.125, bar);
    // vertical exhaust stacks behind the cab
    for (const s of [-1, 1]) {
      const st = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 1.2, 8), rimMat);
      st.position.set(0.98 * s, topY + 0.44, cabZ - cabL / 2 - 0.16);
      g.add(st);
    }
    box(0.16, 0.22, 0.16, rimMat, 0, baseY + 0.08, -bodyLen / 2 - 0.3); // rear tow hitch
    box(2.45, 0.12, 0.5, darkMat, 0, topY + 0.16, -bodyLen / 2 + 0.32); // rear deck spoiler
  }
  if (style === 'sleek') {
    // solar-panel roof
    const solar = new THREE.Mesh(
      new THREE.PlaneGeometry(cabW - 0.4, capL - 0.05),
      new THREE.MeshBasicMaterial({ map: _solarRoofTexture(), polygonOffset: true, polygonOffsetFactor: -1 }));
    solar.rotation.x = -Math.PI / 2;
    solar.position.set(0, capTop + 0.006, capZ);
    g.add(solar);
    // roof light pod riding the windshield header
    const pod = box(1.3, 0.24, 0.42, mat(0xf4f1e8, { roughness: 0.4 }), 0, capTop + 0.12, capZ + capL / 2 - 0.18);
    for (const s of [-0.38, 0.38]) lampDisc(0.085, s, 0, 0.215, pod);
    // hatch spoiler + side skirts
    box(2.0, 0.1, 0.5, accentMat, 0, cabY + cabH / 2 - 0.02, cabZ - cabL / 2 + 0.1);
    for (const s of [-1, 1]) box(0.12, 0.16, bodyLen - 1.7, accentMat, 1.33 * s, baseY - 0.06, 0);
  }
  if (style === 'dune') {
    // exposed roll cage over the rear bed
    const postH = 0.8;
    for (const zz of [-1.0, -1.75]) {
      for (const s of [-1, 1]) box(0.09, postH, 0.09, darkMat, 0.92 * s, topY + postH / 2, zz);
      box(1.93, 0.09, 0.09, darkMat, 0, topY + postH + 0.04, zz);
    }
    for (const s of [-1, 1]) box(0.09, 0.09, 0.95, darkMat, 0.92 * s, topY + postH + 0.04, -1.375);
    spareWheel(0.52, 0.28, 0, topY + 0.15, -1.38); // spare flat on the bed
    box(0.34, 0.44, 0.18, mat(0xd8342a), -0.62, topY + 0.22, -2.0); // jerry cans
    box(0.34, 0.44, 0.18, mat(0x5a6b3a), 0.62, topY + 0.22, -2.0);
    // roof light pod with quad lamps
    const pod = box(1.4, 0.2, 0.4, darkMat, 0, capTop + 0.1, capZ + capL / 2 - 0.16);
    for (const s of [-0.45, -0.15, 0.15, 0.45]) lampDisc(0.07, s, 0, 0.205, pod);
    for (const s of [-1, 1]) box(0.1, 0.24, bodyLen - 1.2, darkMat, 1.32 * s, baseY - 0.06, 0); // mud skirts
  }
  if (style === 'crown') {
    // LARGE two-tier rear wing on posts, with endplates
    const wZ = -bodyLen / 2 + 0.45;
    for (const s of [-1, 1]) box(0.1, 0.5, 0.16, darkMat, 0.82 * s, topY + 0.25, wZ);
    const wing1 = box(2.55, 0.07, 0.62, accentMat, 0, topY + 0.53, wZ, true);
    wing1.rotation.x = -0.13;
    for (const s of [-1, 1]) box(0.07, 0.26, 0.07, darkMat, 0.62 * s, topY + 0.68, wZ - 0.06);
    const wing2 = box(2.3, 0.06, 0.46, mat(stripe?.[0] ?? 0xf2f0e8), 0, topY + 0.84, wZ - 0.06, true);
    wing2.rotation.x = -0.15;
    for (const s of [-1, 1]) box(0.05, 0.44, 0.72, darkMat, 1.29 * s, topY + 0.66, wZ - 0.03);
    // tarmac kit: side skirts + accent splitter
    for (const s of [-1, 1]) box(0.13, 0.18, bodyLen - 1.9, accentMat, 1.33 * s, baseY - 0.05, 0);
    box(2.5, 0.09, 0.34, accentMat, 0, baseY - 0.12, bodyLen / 2 + 0.16);
  }
  if (style === 'alpine') {
    // quad-lamp rally pod riding the hood slope
    const podZ = bodyLen / 2 - 0.55;
    const podY = topY - frontDrop * ((podZ - noseZ0) / noseLen) + 0.09;
    const pod = box(1.25, 0.2, 0.42, darkMat, 0, podY, podZ);
    pod.rotation.x = hoodAng;
    for (const s of [-0.45, -0.15, 0.15, 0.45]) lampDisc(0.075, s, 0.02, 0.215, pod);
    spareWheel(0.5, 0.26, 0, capTop + 0.14, capZ - 0.08); // roof spare
    // mid rear wing perched at the tail
    for (const s of [-1, 1]) box(0.09, 0.36, 0.14, darkMat, 0.78 * s, topY + 0.18, -bodyLen / 2 + 0.24);
    const w = box(2.2, 0.07, 0.42, mat(0xd8342a), 0, topY + 0.42, -bodyLen / 2 + 0.22, true);
    w.rotation.x = -0.1;
  }

  // ---- fender flares on the tall cars, mudflaps on the dirt crowd ----
  if (tall) {
    for (const [x, z] of [[-1.3, 1.5], [1.3, 1.5], [-1.3, -1.5], [1.3, -1.5]]) {
      box(0.45, 0.26, wheelR * 2 + 0.4, darkMat, x, wheelY + wheelR * 0.72, z);
    }
  }
  if (tall) {
    // long flaps hanging off the rear fender flares
    const flapTop = wheelY + wheelR * 0.72 - 0.1;
    for (const s of [-1, 1]) box(0.4, 0.72, 0.06, darkMat, 1.3 * s, flapTop - 0.36, -1.5 - wheelR - 0.14);
  } else if (style === 'alpine') {
    for (const s of [-1, 1]) box(0.38, 0.5, 0.05, darkMat, 1.3 * s, baseY - 0.1, -1.5 - wheelR - 0.1);
  }

  // ---- realism detail pass (all styles, ~14 tiny boxes per car) ----
  {
    // door mirrors at the A-pillar base, arms rooted in the body shoulder
    for (const s of [-1, 1]) {
      box(0.2, 0.05, 0.09, darkMat, 1.36 * s, topY + 0.08, cabZ + cabL / 2 - 0.02);
      box(0.14, 0.17, 0.06, accentMat, 1.44 * s, topY + 0.19, cabZ + cabL / 2 - 0.02);
    }
    // exhaust pipes under the rear bumper (twin on the fast cars)
    const exGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.42, 8);
    exGeo.rotateX(Math.PI / 2);
    const pipes = (style === 'crown' || style === 'pit' || style === 'alpine') ? [-0.62, -0.4] : [-0.5];
    for (const x of pipes) {
      const ex = new THREE.Mesh(exGeo, rimMat);
      ex.position.set(x, baseY - 0.1, -bodyLen / 2 - 0.16);
      g.add(ex);
    }
    // whip antenna on the rear deck (brawler's rack / dune's cage carry gear)
    if (style !== 'brawler' && style !== 'dune') {
      box(0.035, 0.6, 0.035, darkMat, -0.95, topY + 0.28, -bodyLen / 2 + 0.5);
    }
    // wheel-arch brows on the low cars (tall ones wear full flares)
    if (!tall) {
      for (const [x, z] of [[-1.3, 1.5], [1.3, 1.5], [-1.3, -1.5], [1.3, -1.5]]) {
        box(0.34, 0.1, wheelR * 2 + 0.3, darkMat, x, wheelY + wheelR + 0.06, z);
      }
    }
    // door sills + front splitter: dark trim lines ground the silhouette
    for (const s of [-1, 1]) box(0.08, 0.12, bodyLen - 1.0, darkMat, 1.28 * s, baseY - 0.12, 0);
    box(2.3, 0.1, 0.2, darkMat, 0, baseY - 0.14, bodyLen / 2 - 0.05);
    // fuel cap + side vent flavor on the rear quarter
    box(0.16, 0.16, 0.04, rimMat, -1.31, baseY + bodyH * 0.55, -bodyLen / 2 + 0.75);
    box(0.04, 0.14, 0.4, darkMat, 1.31, baseY + bodyH * 0.45, bodyLen / 2 - 1.1);
    // baked under-body shadow: grounds the car even when real-time shadows
    // are stepped off by the quality governor
    const ao = new THREE.Mesh(
      new THREE.PlaneGeometry(3.6, bodyLen + 1.6),
      new THREE.MeshBasicMaterial({
        map: _carAoTexture(), transparent: true, opacity: 0.26,
        depthWrite: false, polygonOffset: true, polygonOffsetFactor: -6,
        // -6 must out-bias the road's -4, or the carriageway is pulled in
        // front of the car's own contact shadow and it flickers away.
        // Opacity down from 0.42: this sits UNDER the real shadow, and the two
        // stacked read as a black slab under the car rather than contact —
        // most obvious on snow, where a car should sit in a soft grey pool.
        polygonOffsetUnits: -6,
      })
    );
    ao.rotation.x = -Math.PI / 2;
    ao.position.y = 0.03;
    ao.renderOrder = 1;
    // published so the driver's seat can hide it: from inside the car the
    // blob is a black pool you carry around on the road ahead — see
    // _driverCamera
    g.userData.aoBlob = ao;
    g.add(ao);
  }

  // ---- sponsor decal: sloped hood on the trucks/hatch, roof cap otherwise.
  // (alpine skips it — its roof carries the spare and its doors the sponsors)
  if (style !== 'alpine') {
    const brand = spec.brand ?? BRANDS[Math.abs(number ?? 0) % BRANDS.length];
    const decal = new THREE.Mesh(
      new THREE.PlaneGeometry(1.45, 0.72),
      new THREE.MeshBasicMaterial({
        map: roofDecalTexture(brand), transparent: true,
        polygonOffset: true, polygonOffsetFactor: -2,
      })
    );
    if (style === 'brawler' || style === 'sleek') {
      // laid onto the hood slope, reading right-side-up from the car's front
      decal.rotation.set(-Math.PI / 2 + hoodAng, 0, 0);
      decal.position.set(0, topY - frontDrop / 2 + 0.055, (bodyLen - noseLen) / 2 + 0.01);
    } else {
      decal.rotation.set(-Math.PI / 2, 0, Math.PI);
      decal.position.set(0, capTop + 0.045, style === 'dune' ? capZ - 0.2 : capZ);
      if (style === 'dune') decal.scale.set(0.85, 0.85, 1);
    }
    // READ FROM OUTSIDE, SO IT COMES OFF FROM INSIDE. The comment above says it
    // exactly: this reads right-side-up FROM THE CAR'S FRONT. A driver is
    // behind it, so from the seat the brand renders in mirror writing — which
    // is what "APEX" across the bottom of the driver's-view screenshot was.
    // Culling does not save us here: we are looking at the decal's FRONT face.
    // Tagged rather than hidden outright, because from every other camera it is
    // correct and wanted.
    decal.name = 'brand-decal';
    (g.userData.outwardDecals ??= []).push(decal);
    g.add(decal);
  }

  // ---- wheels ----
  //
  // BUDGET SPENT WHERE THE VIEW IS. At ten segments a tyre is a visible
  // decagon - you can count the flats as it rolls - so it goes to fourteen,
  // which kills the flats from the chase camera. It does NOT get spokes, lug
  // bolts or a spoke web: the view the game is actually played from is a car
  // length away and thirty degrees up, where all of that is sub-pixel and only
  // costs triangles that the forests want. A face plate proud of the tyre and
  // a hub boss is the whole upgrade - about 100 triangles a car.
  //
  // The BODIES stay faceted on purpose: this is a voxel racer.
  // WHEELS ARE ROUND, AND 14 SIDES IS NOT. Reported as tyres that "seem to be
  // elliptical instead of round", and the geometry says so before any render
  // does: a regular N-gon measures 2r vertex-to-vertex and 2r*cos(PI/N) across
  // the flats, so at N = 14 its own bounding box is 1/cos(PI/14) = 1.026 out of
  // round. Measured on every car in the catalogue at 1.026 exactly.
  //
  // 2.6% would be nothing on a prop. It is not nothing here: the wheels are
  // the roundest thing the eye expects in a frame full of deliberate facets,
  // they sit dead centre of every shelf card and every chase view, and the
  // long axis lands wherever the wheel happens to have stopped spinning — so
  // it reads as an egg that rotates. 24 sides puts it at 1.0086, under a
  // percent, with facets 15 degrees apart.
  //
  // The triangle budget this was traded against is real but small: a tyre and
  // its rim go from 84 to 144 and from 84 to 144 triangles, about 480 a car,
  // ~3.8k over a full grid of eight. The forests it was protecting run tens of
  // thousands.
  const WSEG = 24;
  const tireGeo = new THREE.CylinderGeometry(wheelR, wheelR, 0.55, WSEG);
  tireGeo.rotateZ(Math.PI / 2);
  const rimGeo = mergeGeos([
    new THREE.CylinderGeometry(wheelR * 0.54, wheelR * 0.54, 0.58, WSEG),
    new THREE.CylinderGeometry(wheelR * 0.20, wheelR * 0.20, 0.64, 8),
  ]);
  rimGeo.rotateZ(Math.PI / 2);
  g.userData.wheels = [];       // every wheel mesh, spun via rotation.x
  g.userData.frontWheels = [];  // z=+1.5 pair (+rims), yawed with steering input
  for (const [x, z] of [[-1.3, 1.5], [1.3, 1.5], [-1.3, -1.5], [1.3, -1.5]]) {
    const tire = new THREE.Mesh(tireGeo, tireMat);
    tire.position.set(x, wheelY, z);
    tire.castShadow = true;
    g.add(tire);
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.position.copy(tire.position);
    g.add(rim);
    g.userData.wheels.push(tire, rim);
    if (z > 0) {
      // yaw around Y first, then spin around the axle
      tire.rotation.order = 'YXZ';
      rim.rotation.order = 'YXZ';
      g.userData.frontWheels.push(tire, rim);
    }
  }

  // HOW TALL THIS MACHINE IS, from the contact patch (local y = 0) to the top
  // of the roof cap. The drowning rule needs the real roofline: a flat 2.4 u
  // guess would sink a BRAWLER (3.4 u tall) while a metre of it was still in
  // the air, and let a low coupe drive on with its roof under.
  g.userData.hullHeight = capTop + 0.12;
  // body material handle for damage scorch tinting
  g.userData.bodyMat = bodyMat;
  g.userData.baseBodyColor = new THREE.Color(body);
  // dimensions the upgrade kit bolts onto, so it never has to guess at a
  // roofline or a wheelbase that differs per body style
  // THE RIG CARRIES LENGTH NOW, NOT JUST HEIGHT.
  //
  // `capTop` was published so the kit could sit at each car's own roof height,
  // and that worked — but every LONGITUDINAL offset in the kit stayed a
  // constant, tuned against the BRAWLER. Measured across the roster the cars
  // run 5.6 u (SLEEK) to 6.4 u (BASTION) nose to tail, so a wing pinned at
  // z -1.78 sits 1.0 u inboard of one tail and 1.4 u inboard of another, and a
  // gun muzzle at z 2.82 clears the SLEEK's nose by 0.02 u while sitting
  // 0.38 u INSIDE the BASTION's. Same part, eight different fits.
  //
  // Measured off the finished object rather than declared, so a car whose
  // bodywork changes cannot leave the number behind.
  const _box = new THREE.Box3().setFromObject(g);
  // THE CABIN IS PUBLISHED because the driver's view has to seat an eye INSIDE
  // it. `capTop` is the top of the ROOF CAP, so a camera hung off it sits on
  // the roof — which is what the first cut did, and why the body had to be
  // hidden to stop the roof and its mirror-writing decals filling the frame.
  // From inside the glasshouse none of that is a problem: the greenhouse box
  // is FrontSide like everything else, so its faces are back-facing from in
  // there and cull, while the bonnet ahead keeps its top face pointed at the
  // eye and draws. The car can stay on screen.
  // ---- HEADLIGHTS, TAIL LIGHTS, AND WHAT THEY THROW ON THE ROAD ----------
  //
  // Asked for directly: "make the light like real car light, other cars should
  // have light too." Every car in the game drove at night with dead lamps —
  // the only thing lighting the road ahead of the pack was a chopper's
  // searchlight, which is what the report was actually looking at.
  //
  // NO LIGHT SOURCES. This game bans per-car point lights for the reason
  // `_buildLamps` states — a night city cannot afford two hundred of them and
  // a shader recompile per light count. What sells a headlight from a chase
  // camera is not illumination, it is the LAMP burning and the POOL it lays on
  // the tarmac, and both of those are painted.
  //
  // ONE DRAW CALL FOR ALL OF IT. Six quads — two lamps, two road pools, two
  // tail lenses — merged into a single geometry with per-vertex colour, so the
  // whole rig on a car is one additive mesh. Six meshes each would have been
  // 48 draw calls on an eight-car grid, which is most of a world's budget for
  // something nobody would have called scenery.
  {
    const LP = [], LU = [], LC = [];
    const cH = new THREE.Color(0xfff0cc), cT = new THREE.Color(0xff2a14);
    // `glowTexture` is opaque white at its centre, so a quad whose four UVs
    // all sit at (0.5, 0.5) takes a FLAT alpha and lets vertex colour do every
    // bit of the shaping. That one trick is what lets a soft round lamp and a
    // hard-edged beam wedge share a single material, and so a single draw call.
    const HOT = [0.5, 0.5];
    const push = (P, uv, c) => { LP.push(P[0], P[1], P[2]); LU.push(uv[0], uv[1]); LC.push(c[0], c[1], c[2]); };
    const quad = (P, UV, C) => { for (const k of [0, 1, 2, 0, 2, 3]) push(P[k], UV[k], C[k]); };

    /** The lamp itself, burning: a soft blob on the plane of the panel it sits
     *  on, painted by the glow texture's own falloff. */
    const lamp = (cx, cy, cz, w, h, col, k) => {
      const hw = w / 2, hh = h / 2, c = [col.r * k, col.g * k, col.b * k];
      quad([[cx - hw, cy - hh, cz], [cx + hw, cy - hh, cz], [cx + hw, cy + hh, cz], [cx - hw, cy + hh, cz]],
        [[0, 0], [1, 0], [1, 1], [0, 1]], [c, c, c, c]);
    };

    /** WHAT THE LAMP THROWS ON THE TARMAC, and the part a driver actually
     *  reads. Not a blob: a wedge that leaves the lamp narrow, opens out down
     *  the road and fades to nothing at its far edge and along both sides.
     *  It is a small GRID because the falloff lives in the vertex colours —
     *  the first cut of this was one big quad with the radial glow stretched
     *  over it, and from the chase camera that reads as a puddle parked under
     *  the nose rather than as light going anywhere. */
    const beam = (xL, z0, len, w0, w1, col, peak) => {
      const NL = 9, NW = 7;
      const at = (i, j) => {
        const t = i / NL, u = j / NW;
        const hw = (w0 + (w1 - w0) * t) / 2;
        const f = Math.pow(1 - t, 2.2) * Math.pow(Math.sin(Math.PI * u), 1.8) * peak;
        return { p: [xL + (u * 2 - 1) * hw, 0.05, z0 + len * t],
          c: [col.r * f, col.g * f, col.b * f] };
      };
      for (let i = 0; i < NL; i++) {
        for (let j = 0; j < NW; j++) {
          const a = at(i, j), b = at(i, j + 1), c = at(i + 1, j + 1), d = at(i + 1, j);
          quad([a.p, b.p, c.p, d.p], [HOT, HOT, HOT, HOT], [a.c, b.c, c.c, d.c]);
        }
      }
    };

    const zF = bodyLen / 2, zR = -bodyLen / 2;
    const tailY = baseY + bodyH * 0.55 + 0.12;
    for (const s of [-1, 1]) {
      // The lamp on the modelled headlamp disc, in TWO passes: a wide soft
      // halo and a small hot core on top of it. One quad on its own paints a
      // pale panel — an even, edge-to-edge grey that reads as a sticker. The
      // core is what makes it burn.
      lamp(0.9 * s, faceY, zF + 0.06, 1.5, 1.12, cH, 0.5);
      lamp(0.9 * s, faceY, zF + 0.08, 0.62, 0.5, cH, 1.8);
      // its wedge on the road. The pair overlap down the middle, which is what
      // gives a hot core between the two and a soft spill outboard of them.
      beam(1.0 * s, zF + 0.5, 19, 1.7, 7.2, cH, 0.26);
      // Tail lens, same two passes, wide enough to bloom over the WHOLE
      // cluster (the modelled lamps run x 0.66 to 1.35) rather than sit beside
      // it as a dot.
      lamp(1.05 * s, tailY, zR - 0.06, 1.7, 0.86, cT, 0.45);
      lamp(1.05 * s, tailY, zR - 0.08, 1.05, 0.42, cT, 1.1);
    }
    const lg = new THREE.BufferGeometry();
    lg.setAttribute('position', new THREE.Float32BufferAttribute(LP, 3));
    lg.setAttribute('uv', new THREE.Float32BufferAttribute(LU, 2));
    lg.setAttribute('color', new THREE.Float32BufferAttribute(LC, 3));
    const lights = new THREE.Mesh(lg, carLightMaterial());
    lights.name = 'carLights';
    lights.renderOrder = 3;
    // A BEAM IS LIGHT, NOT BODYWORK, and this is the line that says so to
    // everything that asks a car how big it is. The wedges reach 19 u down the
    // road, so a plain `Box3.setFromObject` on a car returns a box the length
    // of a bus: the garage bay backed its camera off to 27 u and the car went
    // SMALLER the round the lights went in, and the kit-fit test started
    // measuring the nose against a beam. `Box3` uses a geometry's own
    // `boundingBox` when it has one, so the rig reports the bodywork it sits
    // on. Culling is turned off to go with it — a shrunken box must never be
    // allowed to cull the beam away — which costs nothing on a daylight world
    // because the whole mesh is invisible there.
    lg.boundingBox = new THREE.Box3(
      new THREE.Vector3(-1.6, 0, zR - 0.1), new THREE.Vector3(1.6, faceY + 0.6, zF + 0.1));
    lg.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, faceY * 0.5, 0), bodyLen);
    lights.frustumCulled = false;
    // OFF UNTIL THE WORLD IS DARK. Beams in daylight are a cartoon; the game
    // turns these on per world (see `worldIsDark`).
    lights.visible = false;
    g.add(lights);
    g.userData.carLights = lights;
  }

  g.userData.rig = { wheelR, wheelY, baseY, capTop,
    cabY, cabZ, cabH, cabW, cabL,
    zRear: _box.min.z, zFront: _box.max.z,
    halfW: _box.max.x,          // bounding box — INCLUDES THE WHEELS
    bodyHalf: BODY_W / 2,       // the bodywork itself, for flank mounts
    // THE BONNET'S SILHOUETTE, for the driver's view to aim over.
    //
    // From the seat, the lowest thing worth looking at is the road, and the
    // road is behind the bonnet for every aim steeper than the line grazing
    // this metal. The camera had no idea any of it was there — it clamped its
    // aim to a flat 17.8 degrees down — so on a descent it looked THROUGH the
    // bonnet and the frame filled with bodywork. Two points define the
    // silhouette because either can be the binding one: the front edge of the
    // flat deck (near, high) and the nose tip (far, lower for a car whose hood
    // drops away). See `_driverCamera` in main.js.
    deckY: topY, deckZ: noseZ0,
    noseY: topY - frontDrop, noseZ: bodyLen / 2 };
  return g;
}

/** WHAT YOU BOUGHT, BOLTED ON WHERE YOU CAN SEE IT.
 *
 *  Asked for as "change the appearance of the car at every significant
 *  upgrade". The garage sold ten invisible multipliers, so a fully built
 *  machine looked exactly like the one that rolled off the forecourt and the
 *  money had nothing to show for itself.
 *
 *  Every mod appears at level 2 and grows at 4, because a change at every
 *  single level would be six near-identical silhouettes rather than a car
 *  that visibly becomes something. The whole kit lives in ONE named child
 *  group so a purchase can rebuild it without touching the body underneath.
 */
/** The upgrade kit's palette, built once and shared by every car.
 *
 *  THE PARTS THAT FACE THE CAMERA GET THEIR OWN LOOK. A chase camera sees the
 *  tail and the flanks and nothing else, so anything meant to READ as an
 *  upgrade is either back there or down the side, and the emissive pieces are
 *  MeshBasic — unlit, so they hold their colour in a tunnel and at dusk where
 *  a standard material goes to mud.
 *
 *  Lazily built rather than at module load so importing this file costs
 *  nothing; never disposed, because they outlive every kit that uses them.
 */
let _kitMats = null;
function kitMats() {
  if (_kitMats) return _kitMats;
  const M = (color, opts = {}) => new THREE.MeshStandardMaterial({
    color, roughness: 0.5, metalness: 0.45, envMapIntensity: 1.1, ...opts });
  _kitMats = {
    steel: M(0x6a6e74),
    dark: M(0x2a2724, { metalness: 0.2, roughness: 0.8 }),
    carbon: M(0x1b1b1e, { metalness: 0.3, roughness: 0.45 }),
    gold: M(0xc9922e, { metalness: 0.85, roughness: 0.3 }),
    hot: new THREE.MeshBasicMaterial({ color: 0x7fd4ff }),
    ember: new THREE.MeshBasicMaterial({ color: 0xff7a2a }),
    amber: new THREE.MeshBasicMaterial({ color: 0xffb52e }),
    brake: new THREE.MeshBasicMaterial({ color: 0xff2f2f }),
    // one-off colours used by single parts; here so that NOTHING in the kit
    // builds a material per call any more
    blue: M(0x2f6fd8),
    red: M(0xd8342a),
  };
  return _kitMats;
}

/** [PARTS] A SHOWROOM MODEL OF ONE PART, for the garage's shop panels.
 *
 *  Built from the SAME primitives and the SAME palette the part uses on the
 *  car (see applyUpgradeKit), so the picture in the shop is the thing you bolt
 *  on rather than an illustration of it — a block with six pipes in the shop
 *  is a block with six pipes on the tail.
 *
 *  Returns a Group centred on the origin and scaled to sit inside a ~2.4 unit
 *  cube, so one camera rig frames every part without per-part tuning.
 */
/** SHOWROOM PAINT. The kit's own palette is deliberately dark — those parts
 *  live on a car at speed, where a bright block would read as damage. A shop
 *  photograph has the opposite job: it has to be legible at 100px and make you
 *  want the thing. So the icons get their own richer materials — red crackle
 *  cam covers, polished chrome, brass headers — and the car is untouched. */
let _iconMats = null;
function iconMats() {
  if (_iconMats) return _iconMats;
  const M = (color, opts = {}) => new THREE.MeshStandardMaterial({
    color, roughness: 0.42, metalness: 0.6, envMapIntensity: 1.2, ...opts });
  _iconMats = {
    chrome: M(0xd8dde4, { roughness: 0.16, metalness: 0.95 }),
    crackle: M(0xd8402f, { roughness: 0.5, metalness: 0.3 }),   // cam covers
    brass: M(0xd8a43a, { roughness: 0.28, metalness: 0.9 }),      // headers
    block: M(0x59626e, { roughness: 0.58, metalness: 0.45 }),
    rubber: M(0x24262a, { roughness: 0.95, metalness: 0.05 }),
    alloy: M(0xc8ccd2, { roughness: 0.25, metalness: 0.9 }),
    carbonI: M(0x24262c, { roughness: 0.35, metalness: 0.45 }),
    gunmetal: M(0x585f68, { roughness: 0.4, metalness: 0.8 }),
    hot: new THREE.MeshBasicMaterial({ color: 0xff8a3a }),
    warn: new THREE.MeshBasicMaterial({ color: 0xff3b30 }),
  };
  return _iconMats;
}

export function buildPartIcon(kind, id) {
  const M = { ...kitMats(), ...iconMats() };
  const g = new THREE.Group();
  const add = (geo, mat, x, y, z, rx = 0, ry = 0) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.rotation.set(rx, ry, 0);
    g.add(m);
    return m;
  };
  if (kind === 'engine') {
    // THE SHOWROOM MODEL PUTS EVERY PIPE ON THE CAMERA SIDE. On the car they
    // are split between two banks, which is right there and useless here — the
    // far bank is hidden behind the block, so a V8 and a V12 both showed "some
    // pipes". The one question this picture answers is HOW MANY, so it shows
    // all of them, in a row, on the side you are looking at.
    const pipes = { v4: 2, v6: 2, v8: 4, v12: 6 }[id] ?? 2;
    const big = pipes >= 4;
    const len = 0.5 + pipes * 0.26;                   // a bigger block IS bigger
    add(new THREE.BoxGeometry(1.15, 1.0, len), M.block, 0, 0.1, 0);
    // NARROWER THAN THE CAM COVERS ON PURPOSE. At 1.28 the plenum was a lid:
    // it sat over the red covers and every block rendered as a black box with
    // gold pipes. At 0.62 the covers show either side of it, which is the
    // colour that makes the thumbnail read as an engine.
    add(new THREE.BoxGeometry(0.62, 0.18, len - 0.05), M.chrome, 0, 0.68, 0);
    // RED CRACKLE CAM COVERS — the one detail that makes a lump of geometry
    // read as an engine at thumbnail size
    for (const sx of [-1, 1]) {
      const cam = add(new THREE.BoxGeometry(0.44, 0.32, len - 0.06), M.crackle, sx * 0.42, 0.56, 0);
      cam.rotation.z = sx * (big ? 0.36 : 0.22);
    }
    // sump and belt drive, so the bottom of the block is not a flat void
    add(new THREE.BoxGeometry(1.0, 0.22, len - 0.24), M.gunmetal, 0, -0.42, 0);
    const pulley = add(new THREE.CylinderGeometry(0.26, 0.26, 0.12, 14), M.chrome, 0, 0.05, len / 2 + 0.08);
    pulley.rotation.x = Math.PI / 2;
    // ...AND A V4 AND A V6 BOTH HAVE TWO PIPES, so the pipe count alone cannot
    // tell them apart. The V6 is a TURBO and wears one: a snail on the flank
    // with its own feed pipe, which is the difference the name promises.
    if (id === 'v6') {
      // ON THE FRONT FACE, not the far flank. The block is photographed from
      // its pipe side, so anything on -X is behind the block and a V6 came out
      // looking exactly like a V4.
      const snail = add(new THREE.CylinderGeometry(0.33, 0.33, 0.24, 16), M.chrome, 0.2, 0.05, len / 2 + 0.28);
      snail.rotation.z = Math.PI / 2;
      add(new THREE.CylinderGeometry(0.1, 0.1, 0.44, 10), M.chrome, -0.2, 0.05, len / 2 + 0.28, 0, Math.PI / 2)
        .rotation.z = Math.PI / 2;
      add(new THREE.BoxGeometry(0.5, 0.3, 0.16), M.brass, 0.2, 0.46, len / 2 + 0.28);
    }
    if (id === 'v12') add(new THREE.BoxGeometry(0.9, 0.28, len - 0.2), M.brass, 0, 0.84, 0);
    for (let i = 0; i < pipes; i++) {
      const z = (i - (pipes - 1) / 2) * (len / Math.max(1, pipes)) * 0.95;
      const st = add(new THREE.CylinderGeometry(0.1, 0.12, 0.7, 10), M.brass, 0.85, -0.16, z);
      st.rotation.z = Math.PI / 2;
      const mouth = add(new THREE.CylinderGeometry(0.095, 0.095, 0.07, 10), M.hot, 1.19, -0.16, z);
      mouth.rotation.z = Math.PI / 2;
    }
    return g;
  }
  if (kind === 'spoiler') {
    if (id === 'none') {                             // an empty mount, honestly
      add(new THREE.BoxGeometry(1.9, 0.12, 0.5), M.gunmetal, 0, 0, 0);
      return g;
    }
    if (id === 'lip') {
      add(new THREE.BoxGeometry(2.0, 0.12, 0.5), M.carbonI, 0, 0, 0, -0.34);
      return g;
    }
    if (id === 'duck') {
      add(new THREE.BoxGeometry(2.05, 0.14, 0.66), M.carbonI, 0, 0.05, 0, -0.42);
      for (const sx of [-1, 1]) add(new THREE.BoxGeometry(0.09, 0.26, 0.52), M.chrome, sx, 0.06, 0);
      return g;
    }
    const span = 2.3;                                 // GT
    for (const sx of [-1, 1]) add(new THREE.BoxGeometry(0.12, 0.6, 0.3), M.chrome, sx * 0.8, -0.3, 0.06);
    add(new THREE.BoxGeometry(span, 0.09, 0.6), M.carbonI, 0, 0.06, 0, -0.16);
    add(new THREE.BoxGeometry(span, 0.07, 0.32), M.brass, 0, 0.26, -0.2, -0.3);
    for (const sx of [-1, 1]) add(new THREE.BoxGeometry(0.07, 0.42, 0.86), M.chrome, sx * (span * 0.5), 0.12, 0);
    return g;
  }
  if (kind === 'tyre') {
    // ROAD / GRAVEL / SNOW read apart by TREAD, which is the thing that
    // actually differs — a slick band, chunky blocks, or a fine sipe pattern
    const cls = { road: 0, gravel: 1, snow: 2 }[id] ?? 0;
    const tyre = add(new THREE.CylinderGeometry(1.0, 1.0, 0.62, 26), M.rubber, 0, 0, 0);
    tyre.rotation.z = Math.PI / 2;
    const hub = add(new THREE.CylinderGeometry(0.44, 0.44, 0.66, 16),
      cls === 2 ? M.chrome : M.alloy, 0, 0, 0);
    // five spokes, so a wheel reads as a wheel and not as a washer
    for (let i = 0; i < 5; i++) {
      const a2 = (i / 5) * Math.PI * 2;
      const sp = add(new THREE.BoxGeometry(0.7, 0.12, 0.24), M.alloy,
        Math.cos(a2) * 0.34, Math.sin(a2) * 0.34, 0);
      sp.rotation.z = a2;
    }
    hub.rotation.z = Math.PI / 2;
    const blocks = cls === 0 ? 0 : cls === 1 ? 12 : 22;
    for (let i = 0; i < blocks; i++) {
      const a = (i / blocks) * Math.PI * 2;
      const t = add(new THREE.BoxGeometry(cls === 1 ? 0.3 : 0.16, cls === 1 ? 0.16 : 0.1, 0.7),
        cls === 2 ? M.chrome : M.rubber,
        Math.cos(a) * 1.02, Math.sin(a) * 1.02, 0);
      t.rotation.z = a;
    }
    if (cls === 0) {                                  // a slick band, so ROAD is not a bare disc
      const band = add(new THREE.CylinderGeometry(1.03, 1.03, 0.2, 26), M.gunmetal, 0, 0, 0);
      band.rotation.z = Math.PI / 2;
    }
    return g;
  }
  if (kind === 'weapon') {
    if (id === 'cannon') {                            // the flank pod, as fitted
      add(new THREE.BoxGeometry(0.6, 0.5, 1.1), M.dark, 0, 0, -0.2);
      for (const sy of [-0.14, 0.14]) {
        add(new THREE.CylinderGeometry(0.11, 0.11, 1.6, 10), M.steel, 0, sy, 0.7, Math.PI / 2);
      }
      add(new THREE.CylinderGeometry(0.26, 0.26, 0.42, 12), M.gold, 0.0, 0.0, -0.5, 0, Math.PI / 2);
      return g;
    }
    if (id === 'rack') {                              // rockets on a rail
      add(new THREE.BoxGeometry(1.3, 0.16, 0.8), M.dark, 0, -0.28, 0);
      for (const sx of [-0.34, 0.34]) {
        add(new THREE.CylinderGeometry(0.16, 0.16, 1.1, 10), M.red, sx, 0.02, 0, Math.PI / 2);
        add(new THREE.ConeGeometry(0.16, 0.34, 10), M.steel, sx, 0.02, 0.72, Math.PI / 2);
      }
      return g;
    }
    // magazine — a drum and a belt of rounds
    add(new THREE.CylinderGeometry(0.62, 0.62, 0.7, 16), M.dark, 0, 0, 0, Math.PI / 2);
    add(new THREE.CylinderGeometry(0.24, 0.24, 0.76, 12), M.steel, 0, 0, 0, Math.PI / 2);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      add(new THREE.CylinderGeometry(0.09, 0.09, 0.5, 8), M.gold,
        Math.cos(a) * 0.42, Math.sin(a) * 0.42, 0, Math.PI / 2);
    }
    return g;
  }
  return g;
}

/** @param parts [PARTS] the fitted build — { engine, spoiler } part objects
 *  from PART_SLOTS. Optional: called without it (the editor, the shop
 *  portraits) a car simply wears its stock block and no wing. */
export function applyUpgradeKit(group, up = {}, parts = null) {
  const prev = group.getObjectByName('upgradeKit');
  if (prev) { group.remove(prev); disposeKit(prev); }
  const lv = (k) => (up?.[k] | 0);
  if (!group.userData.rig) return null;
  const { wheelY, baseY, capTop } = group.userData.rig;
  // Half-width for FLANK mounts — the BODYWORK's, not the bounding box's.
  // `halfW` includes the wheels (1.8 vs the body's 1.3): hanging the cannon
  // pods off it put them outboard of the car, floating over the arches.
  const bodyHalf = group.userData.rig.bodyHalf ?? 1.3;
  // ANCHOR EVERY LENGTHWAYS PART TO AN END OF THE CAR, not to a number.
  // `T(o)` is `o` units forward of the TAIL, `Nz(o)` is `o` back from the NOSE.
  // The reference offsets below are the old constants re-expressed against the
  // BRAWLER they were tuned on (tail -3.0, nose +3.0), so the car that always
  // fitted is unchanged and the other seven now fit the same way.
  // Falls back to the BRAWLER's extents for any mesh built before the rig
  // carried them.
  const tail = group.userData.rig.zRear ?? -3.0;
  const nose = group.userData.rig.zFront ?? 3.0;
  const T = (o) => tail + o;
  const Nz = (o) => nose - o;
  const kit = new THREE.Group();
  kit.name = 'upgradeKit';
  // ONE SET OF MATERIALS FOR THE WHOLE GAME, built once. They were rebuilt on
  // every call — ten new materials per car per rebuild, each needing its own
  // shader program — and then disposed on the next call, which is what made
  // the kit a hazard to an in-flight async compile (see disposeKit).
  const { steel, dark, hot, carbon, gold, ember, amber, brake, blue, red } = kitMats();
  const add = (geo, mat, x, y, z, rx = 0) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.rotation.x = rx;
    m.castShadow = true;
    kit.add(m);
    return m;
  };

  // ENGINE — a hood scoop, then a second one, from the TUNING level.
  const eng = lv('engine');
  if (eng >= 2) {
    add(new THREE.BoxGeometry(0.9, 0.26, 1.1), dark, 0, capTop - 0.55, Nz(1.85));
    if (eng >= 4) add(new THREE.BoxGeometry(1.5, 0.2, 0.7), dark, 0, capTop - 0.42, Nz(2.35));
  }
  // [PARTS] ...AND THE PIPES COME FROM THE BLOCK YOU FITTED, which is the one
  // part of "V4 / V6 / V8 / V12" a player can actually SEE from a chase
  // camera. Two stacks for the small blocks, four for the V8, six for the V12,
  // laid out symmetrically about the centreline so an odd count never looks
  // like a missing pipe. A bigger block also gets a taller plenum on the hood,
  // so the change reads from in front as well as from behind.
  const block = parts?.engine;
  const pipes = block?.pipes ?? (eng >= 4 ? 2 : 0);
  if (pipes > 0) {
    const per = pipes / 2;                               // per side
    const r = pipes >= 6 ? 0.115 : pipes >= 4 ? 0.13 : 0.14;
    const step = r * 2.35;
    for (const side of [-1, 1]) {
      for (let i = 0; i < per; i++) {
        // centred on the same shoulder every time: 0.55 for a single pipe,
        // spreading outward in pairs as the count grows
        const sx = side * (0.55 + (i - (per - 1) / 2) * step * 1.15);
        add(new THREE.CylinderGeometry(r, r * 1.2, 0.9, 8), steel,
          sx, baseY + 0.1, T(0.85), Math.PI / 2);
        add(new THREE.CylinderGeometry(r * 0.72, r * 0.72, 0.1, 8), ember,
          sx, baseY + 0.1, T(0.42), Math.PI / 2);        // lit pipe mouths
      }
    }
    if (pipes >= 4) {
      add(new THREE.BoxGeometry(pipes >= 6 ? 1.15 : 0.95, 0.2, 0.85), steel,
        0, capTop - 0.34, Nz(1.95));                     // plenum, visible over the nose
    }
  }
  // [PARTS] THE REAR WING, which is the whole point of the exercise. One
  // silhouette change at the top of the tail is worth more than five details
  // on the nose, because the nose is the one part of the car the player never
  // sees.
  //
  // IT USED TO BE DRAWN BY THE ENGINE LEVEL (eng >= 3, wide at 5). That was
  // the only wing the game had, and it appeared as a side effect of buying
  // top speed — nobody chose it. It is a SLOT now, with four options that
  // trade downforce against top end, and the ENGINE line no longer draws a
  // wing at all so the two cannot stack up on the same tail. A save that had
  // reached engine 3 keeps a wing only if it fits one, which is the honest
  // reading of "the wing is a part now".
  const wing = parts?.spoiler?.id ?? 'none';
  if (wing === 'lip') {
    // a lip is a LID, not a plane on stalks: it follows the tail rather than
    // standing off it, which is exactly what makes it read as the modest one
    const lip = add(new THREE.BoxGeometry(2.05, 0.1, 0.44), carbon,
      0, capTop + 0.12, T(1.12));
    lip.rotation.x = -0.34;
  } else if (wing === 'duck') {
    const lip = add(new THREE.BoxGeometry(2.25, 0.12, 0.62), carbon,
      0, capTop + 0.2, T(1.16));
    lip.rotation.x = -0.42;
    for (const sx of [-1, 1]) {                      // small endplates
      add(new THREE.BoxGeometry(0.08, 0.24, 0.5), carbon,
        sx * 1.11, capTop + 0.22, T(1.16));
    }
  } else if (wing === 'gt') {
    const span = 2.9;
    for (const sx of [-1, 1]) {
      add(new THREE.BoxGeometry(0.12, 0.62, 0.34), carbon,
        sx * (span * 0.36), capTop + 0.28, T(1.28));
    }
    const plane = add(new THREE.BoxGeometry(span, 0.09, 0.62), carbon,
      0, capTop + 0.6, T(1.22));
    plane.rotation.x = -0.16;                        // angle of attack, visible in profile
    const flap = add(new THREE.BoxGeometry(span, 0.07, 0.34), gold,
      0, capTop + 0.78, T(1.02));
    flap.rotation.x = -0.3;
    for (const sx of [-1, 1]) {                      // endplates
      add(new THREE.BoxGeometry(0.07, 0.42, 0.9), gold,
        sx * (span * 0.5), capTop + 0.66, T(1.16));
    }
  }
  // ARMOR — side skirts and a bull bar, then a roof plate
  const arm = lv('armor');
  if (arm >= 2) {
    for (const sx of [-1, 1]) {
      add(new THREE.BoxGeometry(0.16, 0.42, 2.6), steel, sx * 1.32, baseY + 0.05, 0);
    }
    add(new THREE.BoxGeometry(2.5, 0.3, 0.22), steel, 0, baseY + 0.16, Nz(0.65));
    if (arm >= 4) {
      add(new THREE.BoxGeometry(2.1, 0.14, 1.7), steel, 0, capTop + 0.09, -0.1);
      for (const sx of [-1, 1]) {
        add(new THREE.BoxGeometry(0.18, 0.7, 0.18), steel, sx * 0.95, capTop - 0.28, 0.7);
      }
    }
  }
  // WIDE-BODY FLARES — the one change that reads from BOTH the camera angles
  // the player actually has: they break the silhouette at the back and they
  // run the whole length of the flank. Placed over the wheels, so they also
  // explain the fatter rubber the TIRES line fits.
  if (arm >= 3) {
    for (const sz of [1.5, -1.5]) {
      for (const sx of [-1, 1]) {
        const f = add(new THREE.BoxGeometry(0.34, 0.2, 1.35), steel,
          sx * 1.24, wheelY + 0.62, sz);
        f.rotation.z = sx * 0.42;                    // cants out over the tyre
      }
    }
  }
  if (arm >= 5) {
    // rear bar with towing eyes, and a brake strip across the tail
    add(new THREE.BoxGeometry(2.4, 0.22, 0.2), steel, 0, baseY + 0.3, T(0.7));
    for (const sx of [-0.75, 0.75]) {
      add(new THREE.TorusGeometry(0.14, 0.05, 6, 10), gold, sx, baseY + 0.3, T(0.58));
    }
    add(new THREE.BoxGeometry(1.5, 0.1, 0.06), brake, 0, capTop - 0.34, T(1.38));
  }
  // CANNON — ON THE FLANKS, not on the roof.
  //
  // Asked for as "modify the design, move the canons in the sides". It used to
  // be a receiver, drum and pintle standing on `capTop + 0.32` with the barrel
  // running forward over the bonnet — from a chase camera that silhouettes as
  // a pale mast sticking straight up out of the car, which is what the report
  // is about. (It was put there deliberately once, to fix a gun mounted so low
  // it was invisible; the answer to that was height, and the answer to THIS is
  // width. Both are the same requirement — the gun has to read from astern.)
  //
  // Now it is a pod on each flank with the barrel running forward beside the
  // bonnet: visible from directly behind as two hard edges either side of the
  // body, visible from the side as the whole gun, and never breaking the
  // skyline. Everything hangs off `halfW` and `baseY` from the rig, so the
  // eight bodies each get it at their own shoulder rather than at a constant.
  //
  // It also now matches where the shot COMES FROM: fireBullet puts the muzzle
  // at +-0.7 lateral, 0.85 above the car. A roof gun never agreed with that.
  const can = lv('cannon');
  if (can >= 2) {
    const gunY = baseY + 0.95;              // shoulder line, above the sill
    const gx = bodyHalf - 0.17;             // hugging the body, not floating
    for (const sx of [-1, 1]) {
      // receiver pod
      add(new THREE.BoxGeometry(0.30, 0.30, 0.86), dark, sx * gx, gunY, 0.55);
      // barrel forward along the flank, and its muzzle collar
      add(new THREE.CylinderGeometry(0.10, 0.115, 1.7, 8), steel,
        sx * gx, gunY, Nz(1.15), Math.PI / 2);
      add(new THREE.CylinderGeometry(0.145, 0.145, 0.26, 8), dark,
        sx * gx, gunY, Nz(0.30), Math.PI / 2);
      // bracket down onto the body, so it reads as BOLTED ON rather than stuck
      add(new THREE.BoxGeometry(0.10, 0.28, 0.34), steel,
        sx * (gx - 0.14), gunY - 0.28, 0.55);
    }
    // TWIN barrels at level 4: the second sits outboard and slightly low, so
    // the pair reads as two guns from behind instead of one thick one.
    if (can >= 4) {
      for (const sx of [-1, 1]) {
        add(new THREE.CylinderGeometry(0.085, 0.095, 1.4, 8), steel,
          sx * (gx + 0.17), gunY - 0.12, Nz(1.35), Math.PI / 2);
      }
    }
    // Top of the line: ammo drums on the outer face and muzzle brakes — the
    // detail that was on the roof assembly, kept, just moved outboard.
    if (can >= 5) {
      for (const sx of [-1, 1]) {
        add(new THREE.CylinderGeometry(0.19, 0.19, 0.22, 12), gold,
          sx * (gx + 0.13), gunY + 0.05, 0.50, Math.PI / 2);
        add(new THREE.BoxGeometry(0.24, 0.24, 0.22), gold, sx * gx, gunY, Nz(0.10));
      }
    }
  }
  // ORDNANCE RACK — rocket tubes on the roof, one per level
  const rack = lv('rack');
  if (rack >= 2) {
    const n = Math.min(4, rack);
    for (let i = 0; i < n; i++) {
      add(new THREE.CylinderGeometry(0.15, 0.15, 1.3, 8), dark,
        (i - (n - 1) / 2) * 0.42, capTop + 0.2, -0.4, Math.PI / 2);
    }
  }
  // MAGAZINE — ammo boxes on the flanks
  const mag = lv('magazine');
  if (mag >= 2) {
    add(new THREE.BoxGeometry(0.34, 0.5, 1.2), dark, -1.4, baseY + 0.55, -0.5);
    if (mag >= 4) add(new THREE.BoxGeometry(0.34, 0.5, 1.2), dark, 1.4, baseY + 0.55, -0.5);
  }
  // NITRO — a bottle behind the cabin, glowing at high levels
  const nit = lv('nitro');
  if (nit >= 2) {
    add(new THREE.CylinderGeometry(0.22, 0.22, 1.5, 10), blue,
      0.55, capTop - 0.35, -1.15, Math.PI / 2);
    if (nit >= 4) {
      add(new THREE.CylinderGeometry(0.22, 0.22, 1.5, 10), blue,
        -0.55, capTop - 0.35, -1.15, Math.PI / 2);
      add(new THREE.SphereGeometry(0.13, 8, 6), hot, 0, capTop - 0.35, T(1.05));
    }
  }
  // SIDE PIPES down the flanks, capped with a glowing mouth that points back
  // at the camera. The bottle behind the cabin was the only nitro tell and it
  // sits where the roofline hides it from directly astern.
  if (nit >= 3) {
    // OUTBOARD OF THE ARMOUR FLARES, not under them. At 1.36 the pipe sits
    // exactly where a level-3 flare cants out over the tyre and the whole run
    // disappears; 1.52 puts it proud of the widest bodywork on the car, which
    // is the only place a side pipe is worth drawing.
    for (const sx of [-1, 1]) {
      add(new THREE.CylinderGeometry(0.14, 0.16, 2.3, 8), steel,
        sx * 1.52, baseY + 0.46, -0.35, Math.PI / 2);
      add(new THREE.ConeGeometry(0.23, 0.6, 8), ember,
        sx * 1.52, baseY + 0.46, T(1.28), -Math.PI / 2);
    }
  }
  if (nit >= 5) {
    // twin afterburner cones under the tail — unlit material, so they stay
    // this colour in a tunnel and at dusk
    for (const sx of [-0.5, 0.5]) {
      add(new THREE.ConeGeometry(0.24, 0.8, 10), ember,
        sx, baseY + 0.24, T(0.5), -Math.PI / 2);
    }
  }
  // DAMPERS — visible coilovers at each corner
  if (lv('dampers') >= 2) {
    for (const [sx, sz] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) {
      add(new THREE.CylinderGeometry(0.1, 0.1, 0.7, 8), red,
        sx * 1.15, wheelY + 0.45, sz * 1.5);
    }
  }
  // HANDLING — had NO bodywork at all, on a five-level line. A rear diffuser
  // and a set of canards, because a suspension upgrade you cannot see is one
  // the player has no reason to believe in. The diffuser sits dead centre of
  // the chase camera's view of the tail.
  const han = lv('handling');
  if (han >= 2) {
    const diff = add(new THREE.BoxGeometry(2.0, 0.16, 0.8), carbon,
      0, baseY - 0.02, T(0.95));
    diff.rotation.x = 0.28;
    for (const sx of [-0.62, 0, 0.62]) {             // strakes, readable head-on
      add(new THREE.BoxGeometry(0.08, 0.3, 0.8), carbon, sx, baseY + 0.06, T(0.95));
    }
  }
  if (han >= 4) {
    for (const sx of [-1, 1]) {                      // dive planes on the nose corners
      const c = add(new THREE.BoxGeometry(0.62, 0.06, 0.3), carbon,
        sx * 1.14, baseY + 0.5, Nz(1.05));
      c.rotation.z = sx * 0.22;
    }
    // ...and a splitter lip, which is what you see of a low car from behind
    // when it lifts over a crest
    add(new THREE.BoxGeometry(2.5, 0.07, 0.5), carbon, 0, baseY - 0.06, Nz(0.7));
  }
  // RECOVERY BEACON — an amber bar on the roof. Three levels, three lamps, and
  // it is the one upgrade that is legible from every angle including directly
  // behind, which is the point of a beacon.
  const bea = lv('beacon');
  if (bea >= 1) {
    add(new THREE.BoxGeometry(1.1, 0.1, 0.26), dark, 0, capTop + 0.14, -0.95);
    for (let i = 0; i < Math.min(3, bea); i++) {
      add(new THREE.BoxGeometry(0.26, 0.14, 0.22), amber,
        (i - (Math.min(3, bea) - 1) / 2) * 0.38, capTop + 0.25, -0.95);
    }
  }
  // MAGAZINE — a belt feed running the flank between the boxes and the gun,
  // so the ammo upgrade reads as a system rather than two crates.
  if (lv('magazine') >= 3) {
    for (const sx of [-1, 1]) {
      add(new THREE.BoxGeometry(0.16, 0.16, 1.6), gold, sx * 1.32, baseY + 0.62, 0.4);
    }
  }
  // TIRES — fatter rubber. Scaling the EXISTING wheels rather than adding new
  // ones keeps the spin and steer bindings in userData intact.
  //
  // FATTER IS ONE AXIS, AND IT IS X. The tyre cylinder is built about Y and
  // then `rotateZ(PI/2)`, so its AXLE runs along X and the round part of it
  // lies in the Y-Z plane. This used to scale (wf, 1, wf) — the axle, which is
  // right, AND Z, which is one of the two circular axes, while leaving Y at 1.
  // That is an ellipse by construction, and a big one: measured 1.19 out of
  // round at tires 2 and 1.374 at tires 4, on top of the polygon error above.
  // Every upgraded car in the game had visibly oval wheels.
  //
  // Scaling X alone widens the tread — 0.55 to 0.64 and 0.74 — which is what
  // "fatter rubber" means, and leaves the ride height and the roofline the
  // drowning rule reads from exactly where they were.
  const tir = lv('tires');
  const wf = tir >= 4 ? 1.34 : tir >= 2 ? 1.16 : 1;
  for (const w of group.userData.wheels ?? []) w.scale.set(wf, 1, 1);
  // MUD FLAPS behind the rear wheels — a rally tell, and the last thing in
  // shot when the car is throwing a rooster tail at the camera.
  if (tir >= 3) {
    for (const sx of [-1, 1]) {
      add(new THREE.BoxGeometry(0.5, 0.55, 0.06), dark, sx * 1.24, wheelY + 0.02, T(0.98));
    }
  }
  // DAMPERS at the top of the line get a spare strapped to the tail — the
  // silhouette of a car built to land on things.
  if (lv('dampers') >= 4) {
    // OFF TO ONE SIDE, the way a rally car carries it — and for a reason the
    // render made obvious: dead centre on the tail it is the biggest thing in
    // the chase camera and it buries the diffuser, the brake strip and the
    // afterburners behind it. Everything back there has to share the frame.
    const spare = add(new THREE.CylinderGeometry(0.46, 0.46, 0.26, 14), dark,
      -0.86, baseY + 0.78, T(0.74));
    spare.rotation.z = Math.PI / 2;
    spare.rotation.y = Math.PI / 2;
    add(new THREE.TorusGeometry(0.22, 0.055, 6, 14), steel, -0.86, baseY + 0.78, T(0.61));
  }
  group.add(kit);
  return kit;
}

/** three does not free geometry for you; a kit is rebuilt on every purchase. */
/** GEOMETRY ONLY, NEVER MATERIALS.
 *
 *  The kit's materials are the module-level singletons in `KIT_MATS` — shared
 *  by every car and every rebuild — so disposing one here would blank the kit
 *  on every OTHER car and, worse, pull a material out from under a
 *  `renderer.compileAsync` that is still polling it. That is the documented
 *  "Cannot read properties of undefined (reading 'isReady')" throw, from
 *  inside three's own timer where no .catch() of ours can reach it.
 *
 *  It went unnoticed while a stock car's kit was nearly empty; the moment the
 *  ENGINE BLOCK slot gave every car a pair of exhaust stacks from the first
 *  frame, a menu-time rebuild started landing on the boot compile every run.
 */
function disposeKit(node) {
  node.traverse?.((o) => { if (o.geometry) o.geometry.dispose?.(); });
}

/** Weld several geometries into one, so a detailed part is still one draw
 *  call. Positions and normals only - nothing here needs UVs. */
function mergeGeos(geos) {
  const parts = geos.map((g) => (g.index ? g.toNonIndexed() : g));
  let n = 0;
  for (const g of parts) n += g.attributes.position.array.length;
  const pos = new Float32Array(n);
  let o = 0;
  for (const g of parts) { pos.set(g.attributes.position.array, o); o += g.attributes.position.array.length; }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.computeVertexNormals();
  return out;
}

// kept as a thin wrapper so older call sites keep working
export function buildCarMesh(spec) { return buildVoxelRacer(spec); }


// ---------- physics base ----------
/** How wide is a solid at height `y` — the radius that actually bites.
 *
 *  A CONE IS NARROWER AT THE TOP. `ob.prof` is the drawn cross-section of the
 *  form, band by band from its foot (`Track._formProfile`), and it is present
 *  exactly on the things that taper: massif cones, skyline peaks, horizon
 *  mesas. Without it a road passing a flank 70 u up met the full BASE radius —
 *  118 u of collider against 96 u of rock on FURKA RIDGE, so 22 u of open
 *  carriageway was walled off by nothing you could see.
 *
 *  Exported because a test that re-derives this arithmetic is testing its own
 *  copy of it. `test-invisible-walls` calls this one. */
export function solidRadiusAt(ob, y) {
  if (!ob.prof || !ob.h) return ob.r;
  const f = (y - ob.y) / ob.h;
  if (f <= 0) return ob.r;
  const k = Math.min(ob.prof.length - 1, Math.max(0, Math.floor(f * ob.prof.length)));
  return ob.r * ob.prof[k];
}

/** IS THIS A WORLD WITH ITS LIGHTS ON?
 *
 *  Not `sunIntensity` — NEON GRID EXPRESSWAY runs a 2.0 moon and a 2.8 ambient
 *  and is the darkest world on the roster. The sky is the honest signal: a
 *  theme paints `skyTop` for the hour it is set at, so its luminance says
 *  night or day for every world without a new flag on any of them.
 */
export function worldIsDark(T) {
  if (!T) return false;
  if (T.dusk) return true;
  const hex = String(T.skyTop ?? '#3a7fb8').replace('#', '');
  const n = parseInt(hex, 16);
  if (!Number.isFinite(n)) return false;
  const r = ((n >> 16) & 255) / 255, g2 = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  return 0.2126 * r + 0.7152 * g2 + 0.0722 * b < 0.22;
}

export class Car {
  constructor(game, mesh, { maxSpeed = 52, accel = 34, grip = 5.2, steerRate = 2.5, driftLag = 0.22, steerTaper = 0.18 } = {}) {
    this.game = game;
    this.mesh = mesh;
    // Lights are switched in `_syncLights`, not here: a car can be built
    // BEFORE its world is (the player's is), so asking the track at
    // construction gets `undefined` and every lamp stays dark on a night
    // stage — which is exactly what the first cut of this shipped.
    // yaw -> pitch -> roll so body pitch/roll read correctly at every heading
    mesh.rotation.order = 'YXZ';
    game.scene.add(mesh);
    this.pos = new THREE.Vector3();
    this.vel = new THREE.Vector3();
    this.heading = 0;
    this.maxSpeed = maxSpeed;
    this.accel = accel;
    this.grip = grip;
    this.steerRate = steerRate;
    this.driftLag = driftLag; // how much velocity lags the yaw at full slip (drift depth)
    this.steerTaper = steerTaper; // high-speed steering authority falloff strength

    // input smoothing: 0 = raw (AI); player sets a finite rate so quick stick
    // flicks land as a smooth ramp instead of an instant snap of the wheel
    this.steerSmooth = 0;
    this.steerSmoothRate = 0;
    this.handling = 0;       // 0..1 garage upgrade (player) — crisper + grippier
    this.offroadSkill = 0.8; // 0..1 off-road pace retention in free roam

    this.health = 100;
    this.maxHealth = 100;
    this.alive = true;
    this.respawnTimer = 0;
    this.invuln = 0;
    this.boostTimer = 0;
    this.fireCooldown = 0;

    // vertical state for ramps/jumps
    this.y = 0;
    this.vy = 0;
    this.airborne = false;
    this.jumpPitch = 0;
    this._lastGY = 0;
    this._climbRate = 0;
    this._climbSm = 0; // smoothed climb rate for stable slope/ramp pitch visuals

    // race state
    this.trackIndex = 0;
    this.lap = 1;
    // Distance travelled, counted in line crossings. Kept SEPARATE from `lap`
    // because the two answer different questions: `lap` is the validated race
    // lap (an infield cut earns none, and the start crossing off the grid
    // earns none either), while `_wraps` must rise on every crossing so
    // `progress` — which orders the standings — never goes backwards.
    this._wraps = 0;
    this._cpMask = 0;          // which lap gates are down, in order
    this._missedCP = false;
    this.lateral = 0;
    this.finished = false;
    this.wallGrind = 0;

    // drift / feel state
    this.slip = 0;          // smoothed 0..1 grip-loss from cornering load
    this.landGrip = 0;      // loose-grip timer after landing a jump
    this.reverseTimer = 0;  // sustained-brake timer gating reverse gear
    this.visYaw = 0;        // smoothed visual slip-angle offset for the mesh
    this.steerVis = 0;      // smoothed steering input for front-wheel visuals
    this._dustSide = 1;
    this._smokeClock = 0;
    this._tintFrac = -1;    // last health fraction the scorch tint was computed for
    this._wetT = 0;         // short timer set while driving through a puddle
  }

  get forward() { return new THREE.Vector3(Math.sin(this.heading), 0, Math.cos(this.heading)); }
  get speedAlong() { return this.vel.dot(this.forward); }
  get progress() { return this._wraps + this.trackIndex / this.game.track.N; }

  placeAt(index, lateral, keepCP = false) {
    const t = this.game.track;
    this.pos.copy(t.pointAt(index, lateral));
    this.heading = t.headingAt(index);
    this.vel.set(0, 0, 0);
    this.trackIndex = index;
    this.lateral = lateral;
    // sync vertical state to the (possibly elevated) road — no spawn-drop
    const gy = t.groundHeightAt?.(index, lateral) ?? 0;
    this.y = gy; this.vy = 0; this.airborne = false;
    this.pos.y = gy;
    this._lastGY = gy; this._climbRate = 0; this._climbSm = 0; this.jumpPitch = 0;
    this.slip = 0; this.landGrip = 0; this.reverseTimer = 0;
    this.visYaw = 0; this.steerVis = 0; this.steerSmooth = 0;
    // Lap checkpoint state matches where we spawned. A respawn keeps whatever
    // far-checkpoint credit the car had already earned (keepCP); a fresh place
    // must earn it. The grid sits just BEFORE the line at ~0.99N, so the window
    // stops at 0.85N — without that upper bound the first line crossing after
    // GO banks a free lap and a "3 lap" race is really two.
    // gates reset with the checkpoint they belong to
    this._cpMask = keepCP ? (this._cpMask ?? 0) : 0;
    this._midCP = keepCP
      ? (this._midCP ?? false)
      : (index > this.game.track.N * 0.4 && index < this.game.track.N * 0.85);
    // A fresh placement re-bases the distance counter on the displayed lap. A
    // car on the grid sits BEHIND the line, so it has not yet made the
    // crossing its lap number implies — start it one wrap short, or its
    // progress would fall by a full lap the moment it crosses.
    if (!keepCP) this._wraps = this.lap - (index > this.game.track.N * 0.85 ? 1 : 0);
    this.syncMesh(0);
  }

  /** Core integrator. inputs: {throttle, brake, steer 1=left, drift, hold} */
  step(dt, inputs) {
    // ---- steering input smoothing (player) — raw flicks ramp in at a finite
    // rate; recentering runs a touch faster so the car settles quickly.
    const hnd = this.handling ?? 0;
    const sense = this.steerSense ?? 1; // player sensitivity setting (0.8/1/1.25)
    // View scale (player only): the chase cameras yaw the world with the car,
    // so every correction is amplified and you saw-saw down the road. They
    // drive on a calmer rack.
    //
    // But the calm is FADED IN WITH SPEED, and that part is not cosmetic. The
    // tight worlds — GOTTHARD, FURKA, SUMMIT — have 5 m hairpins that already
    // ask for full lock; measured, a flat 30% cut put several of them beyond
    // what the car can physically turn. Twitchiness is a fast-road problem, so
    // it gets a fast-road answer: below ~22 km/h you keep every degree of lock,
    // and the rack only quietens as the speed that makes it twitchy arrives.
    let camMul = 1;
    if (this === this.game.player) {
      const base = this.game.camSteerMul ?? 1;
      const fade = THREE.MathUtils.clamp((Math.abs(this.speedAlong) - 6) / 12, 0, 1);
      camMul = 1 - (1 - base) * fade;
    }
    let steer = inputs.steer;
    if (this.steerSmoothRate > 0) {
      const centering = steer * this.steerSmooth < 0 || Math.abs(steer) < Math.abs(this.steerSmooth);
      // The ramp is softened toward the view scale, not multiplied by it —
      // scaling both the ramp and the rate below compounds, and 0.7 × 0.7 took
      // far more out of the car than intended. Recentering is never slowed:
      // letting go of the stick must always settle the car promptly, which is
      // what stops a correction turning into a tank-slapper.
      const rate = this.steerSmoothRate * (1 + hnd) * (0.9 + 0.1 * sense)
        * (centering ? 1.4 : 0.6 + 0.4 * camMul);
      this.steerSmooth += (steer - this.steerSmooth) * Math.min(1, rate * dt);
      steer = this.steerSmooth;
    } else {
      this.steerSmooth = steer; // AI: raw passthrough, state kept for inspection
    }

    // ---- open world (player only): terrain driving off the road, any mode.
    // The road is fastest; rough ground is the natural boundary (no fences).
    // `openCourse`, NOT `freeRoam` — a mission is a road event (see the header
    // on openCourse). This local feeds the cliff-wall release below.
    const freeRoam = openCourse(this.game) && this === this.game.player;
    // ---- width-variation: the road edge follows the (possibly pinched)
    // per-sample width profile; defensive — old track builds report ROAD_HALF
    const roadHalfHere = this.game.track?.widthAt?.(this.trackIndex) ?? ROAD_HALF;
    const offRoad = this === this.game.player && Math.abs(this.lateral) > roadHalfHere + 1;
    const offMult = offRoad ? 0.55 + 0.45 * this.offroadSkill : 1;
    // The ground's slope along the direction of travel: the off-road
    // counterpart of `slopeAt`, which only knows about the road. Computed once
    // and used twice below — by the grade force and by the climb authority.
    let terrGrade = 0;
    // THE WILDS FLAG (r293): three laws — the face-grade baseline, the
    // ripple-proof MAX_GRADE and the steep-terrain wall — used to gate on
    // |lateral| > 60, the TRACKED projection, which UNDER-reads true
    // remoteness near switchback stacks (a car past a segment's end
    // projects to almost nothing — the same lesson the stray rule and
    // test-climb's scan both learned). Cheap two-step, per the stray
    // rule's own pattern: distance to the tracked SAMPLE is an upper
    // bound on nearest-road distance, so ≤ 60 skips the sweep (verges
    // never pay); only genuine wilds run the global confirm.
    this._wilds = false;
    if (offRoad && !this.airborne) {
      const tk0 = this.game.track;
      if (Math.abs(this.lateral ?? 0) > 60) this._wilds = true;
      else if (tk0?.center) {
        const ci0 = tk0.center[this.trackIndex];
        if (ci0 && Math.hypot(this.pos.x - ci0.x, this.pos.z - ci0.z) > 60) {
          let bd = 1e9;
          for (let q = 0; q < tk0.center.length; q += 3) {
            const cq = tk0.center[q];
            const dq = (cq.x - this.pos.x) * (cq.x - this.pos.x)
              + (cq.z - this.pos.z) * (cq.z - this.pos.z);
            if (dq < bd) bd = dq;
          }
          this._wilds = bd > 3600;
        }
      }
    }
    if (offRoad && !this.airborne) {
      const tk = this.game.track;
      const v2h = this.vel.x * this.vel.x + this.vel.z * this.vel.z;
      if (tk?.terrainHeight) {
        // Below walking pace the velocity direction is noise, and the old
        // `v2h > 1` guard simply skipped the sample — so a car crawling up
        // a 55° face read grade 0, felt NO gravity, got its drive back and
        // CREPT to any summit at 1 u/s (measured, slopeprobe.mjs — the
        // recording-A wall climb's quiet enabler). The car still FACES
        // somewhere: at a crawl the grade reads along the heading.
        const slow = v2h <= 1;
        const dirx = slow ? Math.sin(this.heading) : this.vel.x / Math.sqrt(v2h);
        const dirz = slow ? Math.cos(this.heading) : this.vel.z / Math.sqrt(v2h);
        const LOOK = 4;
        const h0 = tk.terrainHeight(this.pos.x, this.pos.z);
        terrGrade = THREE.MathUtils.clamp(
          (tk.terrainHeight(this.pos.x + dirx * LOOK,
            this.pos.z + dirz * LOOK) - h0) / LOOK, -1.2, 1.2);
        // …and far off-road, gravity prices the FACE, not the tread (r293):
        // the ridged octaves hand every steep face a staircase, the 4 u look
        // reads the flat tread between risers, and once GRADE went physical
        // (9.8, sized for the spec engine) the car could WALK up a 100%+
        // face at 3.4 u/s — drive on the treads, y-follow up the risers.
        // A 14 u baseline reads through the ripples to the slope that is
        // actually being climbed. Inside 60 u of the road nothing changes:
        // the rejoin banks are moments, not faces (test-goat's own fence).
        // the TREAD grade survives separately: the goat route's slope law
        // (below) reads it, because the carved spiral IS the designed
        // sub-35° line and the face average misreads its stairs
        this._treadGrade = terrGrade;
        if (this._wilds) {
          const FAR = 14;
          const faceGrade = (tk.terrainHeight(this.pos.x + dirx * FAR,
            this.pos.z + dirz * FAR) - h0) / FAR;
          terrGrade = Math.max(terrGrade, THREE.MathUtils.clamp(faceGrade, -1.2, 1.2));
        }
      }
    }
    // See OFF_CLIMB. `_strayed` is published by the off-course rule further
    // down and is one frame stale, which at 60 Hz is 17 ms and nothing here
    // changes that fast. On the course, in free roam, and for every AI car it
    // is 0, so this is exactly 1 and no rival is ever touched.
    // ...and the GOAT PEAK is closed outright in a road event. Its route is
    // BUILT of flats that reset the grade fade — that is what makes it
    // climbable in roam — so a racer could stair-climb the spiral 46 u in
    // 30 s past a fade that never saw a slope (measured, test-goat law 1).
    // Off the course AND on the peak, the engine simply gives nothing;
    // plain roam publishes _strayed = 0 and never enters this branch.
    const onGoatRace = (this._strayed ?? 0) > 0
      && this.game.track?._nearGoat?.(this.pos.x, this.pos.z, 26);
    // CORRIDOR §3.3 (r298) RETIRED the generic off-course climb fade that
    // lived here (drive authority gone by grade 0.03+0.20 whenever
    // _strayed > 0): "Off-road cost is physical. Surface μ, rolling drag,
    // slope and props. No timers that slow the car, no caps, no invisible
    // forces." A racer taking a hill cut now pays μ, cos(slope) and the
    // 35° ceiling below — the same laws as everyone everywhere — instead
    // of an invisible authority tax. The goat peak stays closed on race
    // day (its stair-step route defeats any grade law by design).
    const climbAuth = onGoatRace ? 0 : 1;

    // CORRIDOR §5.1 — THE SLOPE LAW, everywhere, every mode. Below
    // maxClimbDeg (35°) every hill in every stage is climbable, WHICH IS
    // THE POINT; at 35° the drive authority is zero, the existing GRADE
    // gravity wins, and the car slides back to the floor. No wall needed —
    // this is what retires the recording-A wall climb (55-65°, driven at
    // speed, then six seconds on the plateau). Measured before this law:
    // the tyre CREPT UP a 55° plane at 1 u/s forever (slopeprobe.mjs).
    // The fade runs 31.5°→35° so the ceiling is a boundary, not a cliff
    // edge in the maths. The goat spiral reads its TREAD grade in roam —
    // the carved route is the designed line and the face average misreads
    // its stairs; in a race the goat is already closed (onGoatRace).
    const RT = DRIVING.route ?? {};
    const maxClimbTan = Math.tan((RT.maxClimbDeg ?? 35) * Math.PI / 180);
    const nearGoatRoam = !((this._strayed ?? 0) > 0)
      && this.game.track?._nearGoat?.(this.pos.x, this.pos.z, 26);
    const authGrade = nearGoatRoam ? (this._treadGrade ?? terrGrade) : terrGrade;
    const slopeAuth = authGrade <= maxClimbTan * 0.9 ? 1
      : THREE.MathUtils.clamp(
        1 - (authGrade - maxClimbTan * 0.9) / (maxClimbTan * 0.1), 0, 1);
    // …and the tyre itself loses the slope's cosine (§5.1 μ·cos): modest
    // below the ceiling (cos 35° = 0.82), honest on a real face
    this._slopeCos = offRoad ? 1 / Math.sqrt(1 + terrGrade * terrGrade) : 1;
    // §15 slope telemetry: any contact above 30°, throttled to 1/s —
    // `progress: true` above 35° is the tuning loop's definition of a
    // physics bug, so the flight recorder must be able to convict us
    this._slopeLogT = Math.max(0, (this._slopeLogT ?? 0) - dt);
    if (this === this.game.player && terrGrade > 0.577 && this._slopeLogT <= 0) {
      this._slopeLogT = 1;
      this.game.telemetry?.log('slope', {
        deg: Math.round(Math.atan(terrGrade) * 180 / Math.PI),
        progress: Math.hypot(this.vel.x, this.vel.z) > 0.5 && (this.speedAlong ?? 0) > -0.5,
      });
    }

    // surface conditions: snow and rain-wet worlds drive differently — less
    // brake bite, wheelspin on throttle, and a much earlier, longer slide.
    //
    // The penalty used to be flat, so every car in the game slid identically on
    // ice and the garage's OFF-ROAD stat only ever meant "how well it copes in
    // the grass". A snow stage is precisely a test of tyres and suspension, so
    // the same stat now buys back part of the loss: the DUNE (1.0) keeps most
    // of its grip on FROST PEAK where the CROWN (0.45) is a passenger. Nobody
    // gains anything on dry — the base is 1 there, so the term vanishes.
    //
    // Rivals run a fixed mid figure. They are one grid of identical machines by
    // design, and giving them the player's spread would just add noise to a
    // field that is already balanced by aiSpeed and the rubber band.
    const surf = this.game.track?.T?.surface;
    const loose = this === this.game.player ? (this.offroadSkill ?? 0.7) : 0.7;
    // HOW MUCH THIS SURFACE ASKS OF THE TYRE — 1 on ice, 0.55 in the wet, 0 on
    // a dry road. Everything below scales off this one number, so "slippery"
    // is a property of the surface rather than three unrelated constants.
    const slick = surf === 'snow' ? 1 : surf === 'wet' ? 0.55 : 0;
    // The OFF-ROAD stat buys back part of the loss — the DUNE keeps most of its
    // grip on FROST PEAK where the CROWN is a passenger — but it buys back LESS
    // the slicker it gets. It used to return 62 % of the deficit on every
    // surface, which meant an off-road machine on the wrong rubber was fine on
    // sheet ice: the stat was doing the tyres' job. On ice it now returns 30 %,
    // so ice is a question about what you FITTED, not what you bought.
    const keep = (base) => base + (1 - base) * ((0.62 - 0.32 * slick) * loose);
    // Deepened for r172, reported as "ice and water needs to feel slippery":
    // snow 0.55 -> 0.40 and wet 0.68 -> 0.60. At 0.55 a snow stage was a
    // slightly slower dry stage; the car now runs wide out of a corner it
    // would have held, which is the whole texture of driving on ice.
    let sGrip = keep(surf === 'snow' ? 0.40 : surf === 'wet' ? 0.60 : 1);
    let sTract = keep(surf === 'snow' ? 0.60 : surf === 'wet' ? 0.82 : 1);
    let sBrake = keep(surf === 'snow' ? 0.44 : surf === 'wet' ? 0.72 : 1);

    // THE WRONG TYRE HAS TO BE FELT, not just refused at the start line.
    //
    // Both directions of wrong tyre pay here now. Over-specced squirms;
    // under-specced — which the grid used to refuse outright — slides worse
    // and stops longer, so a snow stage on road tyres is drivable and clearly
    // a bad idea, which is the lesson the hard gate could only ever assert.
    //
    // AND THE PRICE DEPENDS ON THE ROAD. A flat penalty said road rubber was
    // equally wrong on a dry gravel stage and on sheet ice, which is not what
    // a tyre is: on dry tarmac the compound barely matters, on ice it is the
    // only thing that does. `slick` weights the under-spec term so the same
    // two-class mismatch costs ~17 % on a dry stage and puts you on skates in
    // a blizzard. Reported as "if I don't have the tires it should be super
    // hard to drive" — and it should be hard THERE, not everywhere.
    const f = tyrePenalty(this._tyreOver, this._tyreUnder, slick, this._tyreLevel ?? 0);
    if (f < 1) { sGrip *= f; sTract *= f; sBrake *= f; }
    // Published for the HUD warning and the bog-down rule below.
    this._slick = slick;
    this._tyreFactor = f;

    const fwd = this.forward;
    const side = new THREE.Vector3(fwd.z, 0, -fwd.x);
    let vf = this.vel.dot(fwd);
    let vl = this.vel.dot(side);
    const sliding = Math.abs(vl) > 5.5;

    const boosting = this.boostTimer > 0;
    if (boosting) this.boostTimer -= dt;
    // slipstream: tuck in close behind a rival at pace for ~1.1s and the
    // draft opens a +12% speed window (and feeds the style chain)
    if (this === this.game.player && this.game.state === 'race') {
      let drafting = false;
      for (const e of this.game.enemies) {
        if (!e.alive) continue;
        const dx = e.pos.x - this.pos.x, dz = e.pos.z - this.pos.z;
        const d2 = dx * dx + dz * dz;
        if (d2 > 196 || d2 < 9) continue;
        const d = Math.sqrt(d2), f = this.forward;
        if ((dx * f.x + dz * f.z) / d > 0.88 && Math.abs(this.speedAlong) > this.maxSpeed * 0.5) {
          drafting = true;
          break;
        }
      }
      this._draftT = drafting ? (this._draftT || 0) + dt : Math.max(0, (this._draftT || 0) - dt * 2);
      const on = this._draftT > 1.1;
      if (on && !this._draftOn) this.game.style?.(25, 'SLIPSTREAM');
      this._draftOn = on;
    }
    // PATCH_02 §3.7: nitro adds at most +40 km/h (11.1 u/s) over the top
    // speed — the old 1.4x handed +80 on a fast car and made the drivetrain
    // irrelevant for half a lap.
    let nitroCapMul = boosting
      ? Math.min(1.4, (this.maxSpeed + ((window.__DRIVING?.patch02?.nitroBonusKmh ?? 40) / 3.6)) / this.maxSpeed)
      : 1;
    // v1.5 §11.5/§6.6 (r310): AND the STAGE has a speed budget. Recording E
    // hit 205-213 in streets built for 140 — "that number is the root of
    // both offs at the finish". The ceiling is derived from the template
    // (street 160 absolute) in DISPLAYED km/h; main computes it per level
    // as game._nitroCeilU (u/s). It caps NITRO's contribution only — the
    // drivetrain's own top stands.
    if (boosting) {
      const ceilU = this.game._nitroCeilU;
      if (ceilU && this.maxSpeed * nitroCapMul > ceilU) {
        nitroCapMul = Math.max(1, ceilU / this.maxSpeed);
      }
    }
    const topSpeed = this.maxSpeed * nitroCapMul * offMult * (this._draftOn ? 1.12 : 1);

    // ---- longitudinal ----
    if (inputs.hold) {
      // grid/pause hold: bleed speed to a stop, never push backwards
      vf -= vf * Math.min(1, 8 * dt);
      if (Math.abs(vf) < 0.35) vf = 0;
      this.reverseTimer = 0;
    } else {
      if (inputs.throttle > 0) {
        // Punchier launch: up to +55% thrust below half speed, fading to 1x.
        // The reference is the car's SHOWROOM top speed (rivals: baseMaxSpeed),
        // never the live one — otherwise difficulty aiSpeed and the rubber band
        // silently widened the rivals' punch window and they out-launched the
        // player off the grid on HARD. Pace advantages belong in the speed cap,
        // not in the standing start.
        const ref = (this.baseMaxSpeed ?? this.maxSpeed) * 0.5;
        const punch = 1 + 0.55 * (1 - THREE.MathUtils.clamp(Math.abs(vf) / ref, 0, 1));
        // THE STANDING START OBEYS THE TYRE TOO (r286, "driving needs fixing
        // from start"). accel * punch is ~53 m/s² off the line — 0-100 in
        // 0.92 s, measured identical back to r283 — while the same tyre's
        // LATERAL law caps at 4·grip. Drive force now meets the traction
        // budget where wheelspin lives: capped hard at standstill, the cap
        // fading out by ~60% of showroom speed so the mid-range tune and top
        // speed are untouched (at speed a real car is power-limited anyway,
        // which is what the fade models). The overdrive feeds `_spinFeed`
        // into the slip law below — launch wheelspin wags the tail instead
        // of teleporting the car to 100.
        const wantA = this.accel * punch * sTract * inputs.throttle * climbAuth;
        // …scaled by the PEDAL (r293): with launchCapFade at 99 the traction
        // cap IS the engine (RALLY_DRIVING.md shape — flat force, small
        // drag), and an unscaled cap made half throttle produce full force.
        // The pedal now scales the cap, so partial throttle is partial
        // drive, like an engine and unlike a cliff.
        const tractA = DRIVING.launchTraction * (this._gripBudget ?? this.grip)
          * Math.max(0.1, inputs.throttle);
        const capBlend = THREE.MathUtils.clamp(1 - Math.abs(vf) / (ref * DRIVING.launchCapFade), 0, 1);
        const driveA = wantA > tractA ? tractA + (wantA - tractA) * (1 - capBlend) : wantA;
        // wheelspin is a FIRST-GEAR event: this feed once faded with
        // capBlend (gone only by 120 km/h), so ordinary mid-speed cruising
        // read as perpetual wheelspin — slip 0.3 at 60 km/h, most of the
        // "driving like it's on ice" report. It fades out by 36 km/h now,
        // where a real car's engine stops out-torquing its tyres.
        const launchness = THREE.MathUtils.clamp(1 - Math.abs(vf) / 10, 0, 1);
        this._spinFeed = wantA > tractA * 1.05
          ? Math.min(0.6, (wantA / tractA - 1) * 0.45 * launchness) : 0;
        vf += driveA * slopeAuth * dt;   // CORRIDOR §5.1: no drive past 35°
        this.reverseTimer = 0;
      }
      if (inputs.brake > 0.05) {
        // BRAKES OBEY THE TYRE TOO (r288, "make sure driving is aligning
        // real world driving"). accel*1.6 stopped the car from 100 km/h in
        // 6.4 m at 6.4g — a wall, not a brake; the best road car does ~1.1g
        // and a race car with wings ~1.5-2g. All four tyres brake, so the
        // cap sits above the drive cap (2.8) at 4.2*gripBudget ≈ 1.5g:
        // 100-0 in ~27 m. Surface still bites through gripBudget AND sBrake.
        const decel = Math.min(this.accel * 1.6 * sBrake,
          DRIVING.brakeCap * (this._gripBudget ?? this.grip)) * inputs.brake * dt;
        if (vf > 1) {
          vf = Math.max(0, vf - decel); // braking can stop the car, never push it backwards
          this.reverseTimer = 0;
        } else {
          // Reverse gear only from a DELIBERATE input: hard brake (>= 0.6) held
          // for 0.45s at standstill with the throttle fully released. A thumb
          // resting slightly low on the touch pad (light analog brake) does nothing.
          // |vf| < 1 gates ARMING only — once engaged, reverse stays in gear
          // while the hard brake is held, even as reverse speed builds past 1.
          const reverseActive = this.reverseTimer >= 0.45;
          const deliberate = inputs.brake >= 0.6 && !(inputs.throttle > 0)
            && (reverseActive || Math.abs(vf) < 1);
          this.reverseTimer = deliberate ? this.reverseTimer + dt : 0;
          if (this.reverseTimer >= 0.45) {
            // reverse is a manoeuvre, not a launch: 17 m/s² backwards hit
            // 20 km/h in a third of a second. 5 m/s² is a brisk real-world
            // reverse (~1.1 s to 20) and still strong enough to back out of
            // a wedge on a slope (test-unstuck holds the proof).
            vf -= Math.min(this.accel * 0.5, DRIVING.reverseAccel) * inputs.brake * dt; // reverse gear engaged
          } else if (vf > 0) {
            vf = Math.max(0, vf - decel); // settle to exactly 0 — no sign flip, ever
          } else if (vf < 0) {
            vf = Math.min(0, vf + decel); // rolling backwards + brake: also settle to 0
          }
        }
      } else {
        this.reverseTimer = 0;
        // r304: reverse gear engine-brakes. Rolling backwards with every
        // pedal released used to coast for five-plus seconds (backward
        // rolling drag is tiny), which left the auto-gas schemes stranded
        // in a long slow drift after a reverse. 3 m/s² toward zero stops
        // a full-speed reverse in ~3 s and never pushes past 0.
        if (vf < 0) vf = Math.min(0, vf + 3 * dt);
      }
    }
    // ---- grade force: uphill saps speed, downhill feeds it (elevated roads).
    // Guarded — flat tracks / older track builds simply report slope 0.
    let slope = 0;
    if (!inputs.hold && !this.airborne) {
      // OFF THE ROAD THERE WAS NO GRAVITY AT ALL. This block was gated
      // `!offRoad`, so the instant the car left the carriageway a hill cost
      // exactly what flat ground cost, and the only thing opposing a climb was
      // drag. Measured before this line changed, full throttle from a
      // standstill up the fall line, 30 s: SUMMIT CLIMB +70.7 u of altitude at
      // 26.2 u/s, GRANITE NARROWS +74.5 u at 19.3 u/s, CANYON RUN +40.3 u.
      // That is the goat. The terrain's gradient is the same quantity
      // `slopeAt` reports for the road, so it feeds the same term and the same
      // `vCap` below, and it is symmetric — downhill still pays out.
      slope = offRoad ? terrGrade : (this.game.track.slopeAt?.(this.trackIndex) ?? 0);
      if (slope !== 0) vf -= GRADE * slope * dt;
    }
    // drag (eased while drifting: slides keep speed; rough going adds a bit off-road)
    // TWO DRAGS, NOT ONE (r288): the 0.55/s coefficient is really the
    // hidden top-speed governor — thrust equals drag at ~62 u/s — and it
    // stays, but only UNDER POWER, where it is invisible. On a lifted
    // throttle the same 0.55 cost 1.5g at speed (measured 0.80g mean over a
    // 3 s coast from 100), which is a hard brake in a real car; a real lift
    // is engine braking at ~0.1-0.2g. Closed throttle now coasts at 0.14/s
    // (~0.4g at 100 km/h tapering as speed falls) — lift-and-coast glides,
    // and slowing for a corner is the BRAKE's job, which just learned its
    // own real-world cap.
    // 0.50 under power, not 0.55 (r291): the 0.40 "sliding" discount used
    // to apply most of every lap while ambient slip was high, so the whole
    // roster's pace was quietly tuned around an average drag near 0.50.
    // When the planted pass took the ambient slide away, everything got
    // ~13% slower under power at once — the difficulty stand-in AND its
    // rivals together, PINE's crests to 1 launch, GLACIER COL's control
    // from 6 to 1. This restores the average the tuning assumed; the top
    // speed itself is clamped at vCap, so only mid-range punch returns.
    const dragK = inputs.throttle > 0.05 ? DRIVING.dragPower : DRIVING.dragCoast;
    // MEADOW TOURING (r292, from the player's alpine photo): in FREE ROAM
    // the off-road drag halves — a safari car wandering a high meadow
    // should tour, not wade. RACING keeps the full 0.35: the off-road
    // penalty is load-bearing there (shortcuts, rejoin discipline, every
    // corner-cut law), and all of those gates run in race mode.
    const offDrag = offRoad ? (this.game.freeRoam ? DRIVING.dragOffRoadRoam : DRIVING.dragOffRoad) : 0;
    vf -= vf * ((sliding ? Math.min(0.40, dragK) : dragK) + offDrag) * dt;
    // Slope-aware speed ceiling, matched to the grade/drag equilibrium: a
    // downhill grade EXTENDS top speed proportionally (never past topSpeed *
    // DOWNHILL_CAP) and an uphill grade lowers it, so the engine's surplus
    // thrust can't quietly cancel the climb penalty at the clamp.
    let vCap = topSpeed;
    if (slope > 0) vCap = Math.max(topSpeed * 0.55, topSpeed - (GRADE * slope) / 0.55);
    else if (slope < 0) vCap = Math.min(topSpeed * DOWNHILL_CAP, topSpeed + (GRADE * -slope) / 0.55);
    // v1.5 §11.5/§6.6 (r310): while BOOSTING the stage ceiling binds the
    // WHOLE cap — the downhill extension and the boost floor included, or
    // the ceiling leaks exactly where recording E measured it (205-213 in
    // streets on the downhill to the line). It never cuts below the car's
    // own unboosted top: nitro must not act as a brake on an upgraded car.
    if (boosting && this.game._nitroCeilU) {
      // ...bounded by the ceiling OR the speed already carried, whichever
      // is higher: nitro may never PUSH a car past the stage budget (the
      // absolute 160 in streets, §6.6), but it must not confiscate
      // momentum the drivetrain or a hill already earned.
      // (measured against LAST frame's committed speed — reading this
      // frame's vf let the throttle ratchet 0.05 u/s past the cap per
      // frame, and Il Budello sailed to 186 anyway)
      vCap = Math.min(vCap, Math.max(this.game._nitroCeilU, Math.abs(this.speedAlong ?? 0)));
    }
    vf = THREE.MathUtils.clamp(vf, -this.maxSpeed * 0.35, vCap);
    if (boosting) vf = Math.max(vf, Math.min(this.maxSpeed * 1.05 * offMult, vCap));
    // FREEZE STRIKE / JUNGLE FURY: the slow field is physical — it stomps
    // in-flight boosts too, so rivals really do crawl at half pace
    if (this !== this.game.player && this.game.enemySlowUntil
        && this.game.raceTime < this.game.enemySlowUntil) {
      vf = Math.min(vf, this.maxSpeed * 0.5);
      this.boostTimer = 0;
    }
    // speed strips (log flume / maglev): the lane carries the car — fast,
    // centered, and hard to steer out of. Set per-frame by the game.
    if (this.stripLock) {
      vf = Math.max(vf, this.stripLock.vmin);
      vl -= vl * Math.min(1, 3.5 * dt); // sucked toward the lane center
    }
    // critter sting (scorpions / rats): brief speed cut
    if (this.stungUntil && this.game.raceTime < this.stungUntil) {
      vf = Math.min(vf, this.maxSpeed * 0.6);
    }

    // ---- lateral grip: cornering load breaks the rear loose ----
    const speedN = THREE.MathUtils.clamp(Math.abs(vf) / this.maxSpeed, 0, 1);
    const cornerLoad = Math.abs(steer) * speedN;
    // handling raises the slip onset slightly — fewer accidental breakaways,
    // but the threshold stays low enough that committed cornering still drifts
    // 0.55, up from 0.28 (r290): this heuristic predates the physics. With
    // the over-budget law and the yaw cap doing the real work, an onset at
    // 0.28 started a slide on EVERY substantial input above ~60 km/h — most
    // of the reported ice. It keeps only its edge case now: full lock at
    // high speed strains the rear even inside the budget.
    let slipTarget = THREE.MathUtils.clamp((cornerLoad - (0.55 + 0.05 * hnd) * sGrip) * 1.4, 0, 1);
    // ...and the lateral-acceleration law feeds it too: demand past the
    // tyre's budget IS a slide, whatever the steer fraction was (one frame
    // stale, which at 60 Hz is nothing)
    // The dead zone TRACKS the speed-shaped yaw cap (r292): steering held
    // at the cap sits (capM - 1) over budget BY DESIGN, and a fixed gate
    // below that re-created the perpetual trickle at whatever speed the
    // cap was generous. Slip starts where demand genuinely escapes the
    // cap (handbrake relax, transients, full lock at speed).
    const feedGate = ((this._yawCapM ?? 1.15) - 1) + 0.07;
    if ((this._overGrip ?? 0) > feedGate) {
      slipTarget = Math.max(slipTarget, Math.min(1, (this._overGrip - feedGate + 0.12) * 1.2));
    }
    // launch wheelspin: overdriven tyres off the line shimmy the tail
    if ((this._spinFeed ?? 0) > 0) slipTarget = Math.max(slipTarget, this._spinFeed);
    if (inputs.drift) slipTarget = 1; // handbrake forces a full slide
    const slipRate = slipTarget > this.slip ? 7 : 3.2; // break loose fast, recover smoothly
    this.slip += (slipTarget - this.slip) * Math.min(1, slipRate * dt);
    // [PARTS] DOWNFORCE — the rear wing. Grip that only exists once the car is
    // moving, which is what makes a wing a TRADE: it costs top speed outright
    // and pays it back only in the fast corners. At a standstill a GT wing does
    // nothing at all; flat out it is worth 40% more grip than no wing.
    // THE TYRE'S BUDGET, SEPARATED FROM ITS COLLAPSE. Everything the surface
    // and the car contribute — compound, handling, boost, wing, a wet ford, a
    // loose landing — makes the BUDGET; the slip collapse and the handbrake
    // are what happens once the budget is spent, and they apply only to the
    // scrub rate below. (Same products as before, reordered: multiplication
    // commutes, the scrub rate is bit-identical.) The budget also prices the
    // new lateral-acceleration law further down.
    let gripBudget = this.grip * (1 + 0.08 * hnd) * sGrip * (this.gripBoost || 1)
      * (1 + (this.downforce || 0) * speedN);
    // CORRIDOR §5.1 + §5.2: off the road the tyre pays the SURFACE (offMult
    // is the spec's μ table in car form — 0.55 grass floor, the OFF-ROAD
    // stat buying it back) and the slope's cosine. Off-road cost was drag
    // and top speed only; grip stayed tarmac-grade on dirt, which is why a
    // desert cut cornered like a road.
    if (offRoad) gripBudget *= offMult * (this._slopeCos ?? 1);
    if (this.landGrip > 0) { this.landGrip -= dt; gripBudget *= 0.4; } // loose for ~0.4s after landing
    // ---- river-fords: wet tires. Ford crossings set _wetT=3.5 with a gentle
    // ≈0.8 grip factor fading linearly back to 1; plain puddles keep their
    // short sharp 0.75 slick (_wetMax stays 0 for those).
    // IN the water: aquaplaning. The tyres are riding a film, not the road, and
    // for the fraction of a second you are actually in the ford the car should
    // go light and drift wide if you are turning. Set by the ford pass below,
    // so it lands one frame later — which is the right side of the boundary.
    if (this._fordNow > 0) {
      this._fordNow -= dt;
      gripBudget *= 0.42;
    }
    // AFTER: wet tyres, fading. Was a 20% loss at most, which nobody could feel
    // — the HUD said WET TIRES and the car drove exactly as before. Deeper now,
    // and the OFF-ROAD stat buys some of it back, the same way it does on snow:
    // the DUNE gets out of a ford composed, the CROWN gets out of it sideways.
    if (this._wetT > 0) {
      this._wetT -= dt;
      if ((this._wetMax ?? 0) > 1) {
        const skill = this === this.game.player ? (this.offroadSkill ?? 0.7) : 0.7;
        const loss = 0.46 * (1 - 0.42 * skill);
        gripBudget *= 1 - loss * Math.max(0, this._wetT) / this._wetMax;
      } else {
        gripBudget *= 0.75;
      }
      if (this._wetT <= 0) this._wetMax = 0;
    }
    this._gripBudget = gripBudget;
    // RALLY_DRIVING.md 7.1 (r293): grip at full slip holds at the PLATEAU,
    // not a 22% collapse — "a car that keeps 70% is an arcade car the
    // player can hold sideways". This is the single biggest holdability
    // change of the spec adoption.
    let grip = gripBudget * (1 - (1 - DRIVING.slipGripFloor) * this.slip);
    if (inputs.drift) grip = Math.min(grip, this.grip * 0.22);
    // opt-in grip instrument (headless): set __game.__gripProbe = {} to read
    // the lateral grip the player is actually running (wet-tire verification)
    if (this.game.__gripProbe && this === this.game.player) this.game.__gripProbe.grip = grip;
    const vlBefore = vl;
    // ...AND SLIDING FRICTION HAS A CEILING TOO. The scrub was vl·grip —
    // proportional, unbounded — so the bigger the slide, the harder the
    // tyres pulled, and a car 80° sideways at 180 km/h was hauled back onto
    // its heading at 1.4 rad/s (measured): the drift state existed and the
    // trajectory ignored it. A sliding tyre is kinetic friction: force
    // capped near the same budget that broke it loose (a touch above, so
    // recovery beats breakaway and the slide never oscillates). Small
    // corrections sit below the cap and keep today's proportional feel.
    // r307: WITH the handbrake held the kinetic ceiling drops — locked rear
    // tyres are unloaded, and the 4.4x ceiling was burning ~2.3 g of slide
    // per second, parking a 70 km/h drift in two seconds ("just sliding").
    const scrubCap = inputs.drift ? (DRIVING.driftScrubCap ?? 2.1) : 4.4;
    const aScrub = Math.min(Math.abs(vl) * grip, scrubCap * gripBudget);
    vl -= Math.sign(vl) * Math.min(Math.abs(vl), aScrub * dt);
    // drift reward: convert a slice of the scrubbed-off slide back into
    // forward speed — a bigger slice while the handbrake is deliberately
    // held, so a drift carries its momentum through the corner
    const reward = inputs.drift ? (DRIVING.driftReward ?? 0.5) : 0.35;
    if (this.slip > 0.4) vf = Math.min(topSpeed, vf + Math.abs(vlBefore - vl) * reward * (vf >= 0 ? 1 : -1));

    // ---- IN THE AIR THERE ARE NO TYRES ----
    //
    // Everything above this point is a tyre force: engine thrust through the
    // contact patch, lateral grip, slip. None of it exists once the wheels
    // leave the ground, and the game was applying all of it. Measured on a
    // 1.1 s jump from PINE VALLEY at 42 u/s: holding full lock moved the car
    // THIRTY METRES sideways off its launch trajectory and spun it 167 degrees,
    // and the difference between full throttle and none was 40.4 u/s against
    // 12.3 u/s on landing. You could fly a corner you had no line for.
    //
    // A body in flight keeps the velocity it left with, less air drag, and
    // falls. That is the whole model. `airVel` is that velocity, captured
    // before the steering block so the recomposition below can be told to
    // reproduce it exactly rather than rebuild it from a heading it no longer
    // has any right to change.
    const airVel = this.airborne ? this.vel.clone() : null;
    // ---- steering: quick to come in, gentle taper at very high speed ----
    const sp = Math.abs(vf);
    // Steering authority used to scale from ZERO with speed, so the slower you
    // went the less you could turn — backwards from a real car, and a trap on a
    // tight hairpin: the corner forces you to crawl, and crawling takes your
    // steering away. Measured, ROCKFALL RAVINE's tightest corner (5.6 m, between
    // cliff walls) could only be held at 14 km/h, where the car had 30% of its
    // lock. A standing floor fixes hairpins everywhere without touching a single
    // track's geometry; the speed term still adds on top of it.
    const rise = 0.45 + 0.55 * THREE.MathUtils.clamp(sp / 13, 0, 1);
    const taper = 1 - this.steerTaper * THREE.MathUtils.clamp((sp - this.maxSpeed * 0.6) / (this.maxSpeed * 0.55), 0, 1);
    // 0.15, down from 0.35 (r290): the mid-slide bonus amplified yaw exactly
    // when the car was already rotating — the "speed boat". Counter-steer
    // keeps a modest edge; the slideRelax on the yaw cap below is the real
    // mid-slide allowance now.
    let authority = rise * taper * (1 + 0.15 * this.slip);
    // A rally car CAN rotate a little in the air — inertia, and a stab of
    // throttle against the driveline — so this is not zero. It is small enough
    // that it reads as tidying the car up for the landing rather than as
    // steering, and it changes the ATTITUDE only: the trajectory is fixed
    // below, whatever the heading ends up being.
    if (this.airborne) authority *= 0.14;
    const dir = vf >= 0 ? 1 : -1;
    const stripSteer = this.stripLock ? this.stripLock.steerMul : 1;
    let dTheta = steer * this.steerRate * sense * camMul * authority * stripSteer * dir * dt;
    // A CAR TURNS ON A CIRCLE, NOT ON ITS AXIS (r290, "I can rotate it 360
    // on 11 kph almost at its axis"). The kinematic bound every real car
    // obeys: yaw rate <= v / R_min — the wheels have to ROLL around the
    // turning circle, so at 11 km/h the tightest legal spin is ~44 deg/s
    // sweeping a 4 m circle, translating the whole way. The r288 creep ramp
    // was a crude cut of this; the bound itself replaces it (at a standstill
    // it is zero, so the parked-pivot fix is contained in it). Sliding
    // relaxes it — a handbrake swing genuinely rotates a car faster than
    // its wheels roll — scaling with slip up to ~2.5x. Above ~36 km/h the
    // bound is looser than steerRate and changes nothing.
    if (!this.airborne) {
      // ...and the slide relaxation is EARNED WITH SPEED: full lock at a
      // crawl builds slip too (the slip machine is generous), and an
      // ungated 1.5x reopened the cap to 82 deg/s at 11 km/h — a 2.1 m
      // circle, half a real car's tightest. A handbrake swing rotates a
      // car because road speed carries yaw momentum; below ~22 km/h there
      // is none to spend, so the relaxation fades in from 6 to 12 u/s.
      // ...and it opens for the HANDBRAKE ONLY (r291, "after some speed
      // starts slipping"): a counter-steer detector was tried and opened
      // the relax for ORDINARY cornering instead — in any corner the slide
      // direction opposes the steer by construction, so gentle 0.35 steer
      // at 180 km/h spiralled to slip 0.96 and a spin. Recovery from an
      // unintended slide is the grip catch's job, at capped yaw; the wide
      // allowance belongs to the one input that ASKS for rotation.
      const relaxGain = inputs.drift ? 1.5 : 0.25;
      const slideRelax = relaxGain * this.slip * THREE.MathUtils.clamp((sp - 6) / 6, 0, 1);
      // THE SECOND BRANCH OF THE BICYCLE (r290, "on small turn it turns so
      // much, like a speed boat... now it's driving like it's on ice"):
      // at speed the bound is the TYRE, omega <= a_max / v. steerRate 2.5
      // was sized for the old rail grip, so once the budget landed, every
      // ordinary input commanded 2-3x the yaw the tyres could deliver, the
      // over-budget law read it as a slide, and the whole game iced over —
      // grip cut, lag spill, boat. Capped at 92% of the budget, a clean
      // input holds a clean 1.4g arc with ZERO slide; steering harder just
      // understeers wide, which is what a real car does — and the way
      // through a tight corner at speed is the brake or the handbrake,
      // which is the drift promise kept honestly. The relaxation opens the
      // cap mid-slide so counter-steer and held drifts still work.
      // 1.15, not 0.92 (measured the same day): the tyre-exact bound made
      // every mountain switchback a braking event and the whole rig fleet
      // — jump rig 0 hops, wedge runner tripping rescues, cut lines
      // washing 47 u wide — said the tracks were drawn for more grip than
      // a real car has. 15% past budget lets a hard corner develop a
      // MILD, self-limiting slide (over ~0.15, grip trimmed, no spiral)
      // — the drift feel without the ice, on geometry that expects it.
      const aMax = 4.0 * (this._gripBudget ?? this.grip);
      // ...and the allowance is SPEED-SHAPED (r292, "turning is super hard
      // on high speeds, but good and easy on slow"): a flat 1.15 put the
      // minimum radius at 64 m by 108 km/h — real, and miserable on roads
      // drawn for an arcade car. The mid-range now opens to 1.6x budget
      // (42 m at 108) and tapers to the honest 1.15 by ~180 km/h, so the
      // r284 promise stands exactly where it was made: sharp curves AT
      // SPEED still demand the brake or the handbrake. `_yawCapM` is
      // exported so the slip feed's dead zone can track this cap — extra
      // mid-range yaw must not read as a perpetual slide.
      const capM = DRIVING.yawCapHi + (DRIVING.yawCapLo - DRIVING.yawCapHi)
        * THREE.MathUtils.clamp((50 - sp) / 25, 0, 1);
      this._yawCapM = capM;
      const yawCap = Math.min(sp / DRIVING.yawRMin, capM * aMax / Math.max(sp, 0.1))
        * (1 + slideRelax) * dt;
      dTheta = THREE.MathUtils.clamp(dTheta, -yawCap, yawCap);
      // RALLY_DRIVING.md §8.2 (r293): THE HANDBRAKE GUARANTEES THE TAIL.
      // A yaw impulse on PRESS — 0.18 × current lateral speed, in the steer
      // direction — scaled to zero below ~30 km/h and disabled on the ice
      // family, decaying over ~0.3 s. This is the spec's own "arcade cheat
      // that guarantees the tail steps out when the player asks".
      const onIce = this.game.track?.T?.surface === 'snow';
      if (inputs.drift && !this._hbHeld && sp > 2 && !(DRIVING.hbIceDisabled && onIce)) {
        const latMag = Math.max(2.5, Math.min(20, Math.abs(vl) + sp * 0.25));
        const dirK = steer !== 0 ? Math.sign(steer) : (vl !== 0 ? -Math.sign(vl) : 1);
        this._hbKick = DRIVING.hbYawImpulse * latMag * dirK
          * THREE.MathUtils.clamp(sp / DRIVING.hbMinSpeed, 0, 1);
      }
      this._hbHeld = !!inputs.drift;
      if (this._hbKick) {
        dTheta += this._hbKick * dt;
        this._hbKick *= Math.max(0, 1 - 3.3 * dt);
        if (Math.abs(this._hbKick) < 0.05) this._hbKick = 0;
      }
      // §8.3: COUNTER-STEER ASSIST — past the slip threshold the car adds
      // yaw toward killing the slide (gain 0.55), and past the spin angle
      // (~65°) it stops helping: the player crossed the line; the game lets
      // them spin. This is what makes "recoverable from a full 90° slide
      // with counter-steer within 0.6 s" hold for thumbs on a phone.
      // PATCH_02 §3.5: LANDING ASSIST — for 300 ms after touchdown the car
      // keeps its feet: yaw rate clamped to ~60 deg/s and the airborne
      // sideways velocity blended out hard (80% per 100 ms), so a jump
      // landed with the nose 45 deg off does not skate into the wall on a
      // camera that rotates with the car.
      if ((this._landT ?? 0) > 0) {
        this._landT -= dt;
        if (inputs.drift) this._landT = 0;   // P2.7b: handbrake keeps the slide
        else {
          dTheta = THREE.MathUtils.clamp(dTheta, -1.05 * dt, 1.05 * dt);
          vl *= Math.pow(0.2, dt / 0.1);
        }
      }
      // PATCH_02 §3.6: WALL ESCAPE — nose planted on a wall under 30 km/h
      // with the road behind you was three seconds of grinding. While the
      // player is asking (steer or reverse), the car gets real yaw authority
      // toward the road tangent; escape completes inside 1.5 s.
      if (this === this.game.player && sp < 8.4 && (this._wallTouchT ?? 0) > 0
          && (Math.abs(steer) > 0.3 || inputs.brake > 0.5)) {
        const roadH = this.game.track?.headingAt?.(this.trackIndex);
        if (roadH !== undefined) {
          let dh6 = roadH - this.heading;
          while (dh6 > Math.PI) dh6 -= 2 * Math.PI;
          while (dh6 < -Math.PI) dh6 += 2 * Math.PI;
          if (Math.abs(dh6) > 0.79) dTheta += Math.sign(dh6) * 2.2 * dt;
        }
      }
      if ((this._wallTouchT ?? 0) > 0) this._wallTouchT -= dt;
      const beta = Math.atan2(Math.abs(vl), Math.max(0.5, Math.abs(vf)));
      // CLAUDE.md §4.4 (r307): drift ASSIST, 15°-65° slip, handbrake held —
      // rotation help TOWARD the steer. The entry kick (§8.2 above) starts
      // the tail; nothing sustained the rotation after it decayed, so a
      // held drift was a slide the nose never followed. Past the spin
      // angle the help stops: the player crossed the line, the game lets
      // them spin — same law as counter-steer assist, opposite sign.
      if (inputs.drift && steer !== 0 && beta > 0.26 && beta < DRIVING.spinSlipAngle) {
        dTheta += steer * dir * (DRIVING.driftYawAssist ?? 0.85)
          * THREE.MathUtils.clamp(sp / 8, 0, 1) * dt;
      }
      if (this.slip > DRIVING.csAssistSlipMin && beta < DRIVING.spinSlipAngle && !inputs.drift) {
        // sign: +dTheta with steer + leaves velocity on the vl<0 side (this
        // engine's right-vector convention), so re-aligning the nose to the
        // velocity is atan2(vl, vf) — the first cut used -vl and steered
        // INTO the rotation, measured as a 2.53 rad/s spike past a 0.81 cap.
        const align = Math.atan2(vl, Math.max(3, Math.abs(vf)));
        dTheta += THREE.MathUtils.clamp(DRIVING.csAssistGain * align * 2.0, -1.4, 1.4) * dt;
      }
    }
    // DRIVING AID: a gentle nudge back toward the road's direction when the
    // player isn't actively steering. It never fights your input and never
    // steers for you — it just stops the car wandering, which is what makes
    // the chase view hard to hold. Strength is a player setting.
    if (this.assist > 0 && this === this.game.player && !inputs.drift
        && Math.abs(steer) < 0.25 && vf > 6 && !this.airborne) {
      const t2 = this.game.track;
      const road = t2.headingAt?.(this.trackIndex);
      if (road !== undefined && Math.abs(this.lateral) < 12) {
        let d = road - this.heading;
        while (d > Math.PI) d -= Math.PI * 2;
        while (d < -Math.PI) d += Math.PI * 2;
        if (Math.abs(d) < 1.0) dTheta += d * this.assist * 2.2 * dt;
      }
    }
    this.heading += dTheta;
    // BALLISTIC. Project the velocity the car left the ground with onto the
    // axes it now points along, so the recomposition at the bottom of this
    // block rebuilds exactly that world vector. Rotating the body therefore
    // changes what the car LOOKS like — it can land crossed up, or straighten
    // itself out — and moves it not one unit off its arc.
    if (airVel) {
      const f = this.forward;
      vf = airVel.x * f.x + airVel.z * f.z;
      vl = airVel.x * f.z - airVel.z * f.x;
    }
    // While gripped the velocity turns with the car (arcade rails). While slipping
    // it lags the yaw: part of the turn spills forward speed into lateral slide,
    // so hard cornering at speed visibly breaks the rear loose.
    //
    // A TYRE HAS A BUDGET, AND THE RAILS WERE IGNORING IT. The lag above
    // capped at slip·driftLag ≈ 0.22, so even in a "full slide" 78% of the
    // yaw still rotated the velocity directly — measured with cornergrip.mjs:
    // a 16.5 u radius circle held at 180 km/h, 151 u/s² of lateral grip,
    // fifteen g. Reported as exactly that: "I can turn sharp curves with
    // 180 km/h. That illogical. I have to drift and loose control."
    //
    // The budget is the one the rival planner has always driven within —
    // paceEstimate's vGrip = sqrt(SLIDE·grip/k), i.e. a_lat ≤ 4·grip — so
    // pricing the player's yaw against 4·gripBudget makes the field's
    // physics and the player's the same physics. Demand under budget is
    // untouched: ordinary driving stays on its rails. Demand past it spills
    // the EXCESS share of the turn into slide instead of trajectory: the
    // nose comes round, the car keeps going, and you are drifting — or, far
    // past it, losing control. PLAYER ONLY: the AI already obeys the number
    // by planning, and must keep its 8/8-alive record.
    let over = 0;
    if (this === this.game.player && !this.airborne && dt > 0) {
      // the WHOLE velocity vector, not the forward component: |vf| collapses
      // exactly when the car goes sideways, and pricing demand on it handed
      // the rails back mid-slide — an accidental auto-catch at 70° of drift
      const aDemand = Math.hypot(vf, vl) * Math.abs(dTheta) / dt;
      const aMax = 4.0 * (this._gripBudget ?? this.grip);
      over = aMax > 0 ? THREE.MathUtils.clamp((aDemand - aMax) / aMax, 0, 1) : 0;
    }
    this._overGrip = over;
    const lag = this.airborne ? 0 : Math.min(1, this.slip * this.driftLag + over * 0.9);
    if (this.game.__gripProbe && this === this.game.player) {
      Object.assign(this.game.__gripProbe, { over, lag, dTheta, vf: +vf.toFixed(1), vl: +vl.toFixed(1) });
    }
    if (lag > 0) {
      const nvf = vf + vl * dTheta * lag;
      vl -= vf * dTheta * lag;
      vf = nvf;
      // total speed can't inflate past ~top speed while sideways
      const vmax = topSpeed * 1.08;
      const vsq = vf * vf + vl * vl;
      if (vsq > vmax * vmax) {
        const s = vmax / Math.sqrt(vsq);
        vf *= s; vl *= s;
      }
    }

    // recompose velocity (fwd/side change with heading for a nice arcade feel)
    const nf = this.forward;
    const ns = new THREE.Vector3(nf.z, 0, -nf.x);
    this.vel.copy(nf).multiplyScalar(vf).addScaledVector(ns, vl);
    // v1.5 §11.5 (r310): the nitro ceiling, enforced ONCE at the final
    // velocity write. Every earlier clamp leaked — the steering block's
    // lag recomposition adds to vf after the longitudinal clamp, so a
    // per-frame cap read from live speed simply ratcheted (measured:
    // Il Budello crept 47.8 → 55.9 u/s straight through a 51.6 ceiling).
    // The bound is anchored when the boost FIRES: the ceiling, or the
    // speed already carried, whichever is higher — nitro never pushes
    // past the stage budget and never confiscates momentum.
    if (this.boostTimer > 0 && !this.airborne) {
      if (!this._boostCeilU) {
        this._boostCeilU = Math.max(this.game._nitroCeilU ?? 1e9,
          Math.hypot(this.vel.x, this.vel.z));
      }
      const hv = Math.hypot(this.vel.x, this.vel.z);
      if (hv > this._boostCeilU) {
        const s = this._boostCeilU / hv;
        this.vel.x *= s; this.vel.z *= s;
      }
    } else this._boostCeilU = 0;
    this.pos.addScaledVector(this.vel, dt);

    // surface spray: rooster tails of powder snow or water off the tires.
    // Distance-culled for AI and hard-capped per frame — spray must never be
    // the reason a phone drops frames.
    if (surf && !this.airborne && this.alive
        && (this === this.game.player || this.pos.distanceToSquared(this.game.player.pos) < 6400)) {
      const spd = Math.hypot(this.vel.x, this.vel.z);
      if (spd > 9) {
        const mobile = this.game.isTouch ? 0.55 : 1;
        this._sprayAcc = Math.min(3, (this._sprayAcc || 0)
          + dt * (8 + spd * 0.5) * (this.slip > 0.35 ? 1.9 : 1) * mobile);
        let burst = 2; // per-frame cap
        while (this._sprayAcc >= 1 && burst-- > 0) {
          this._sprayAcc -= 1;
          const col = surf === 'snow' ? SPRAY_SNOW : SPRAY_WET;
          this.game.particles.spawn(
            this.pos.x - nf.x * 1.1 + (Math.random() - 0.5) * 1.5, this.pos.y + 0.25,
            this.pos.z - nf.z * 1.1 + (Math.random() - 0.5) * 1.5,
            -nf.x * spd * 0.22 + (Math.random() - 0.5) * 3, 1.8 + Math.random() * 2.4,
            -nf.z * spd * 0.22 + (Math.random() - 0.5) * 3,
            col, surf === 'snow' ? 1.7 : 1.1, 0.45 + Math.random() * 0.35,
            surf === 'snow'
              ? { drag: 1.2, grav: 5, shrink: 1.3, alpha: 0.55 }
              : { drag: 1.2, grav: 9, shrink: 0.7, alpha: 0.45 });
        }
      }
    }

    // ---- rolling dust from the rear wheels (cheap, distance-culled for AI) ----
    const gm = this.game;
    if (this.alive && !this.airborne && sp > 11 && gm.player) {
      const isPlayer = this === gm.player;
      if (isPlayer || this.pos.distanceToSquared(gm.player.pos) < 14400) {
        let density = isPlayer ? 0.5 + 0.45 * speedN : 0.28 + 0.25 * speedN;
        if (offRoad) density = Math.min(1, density * 1.9); // churning up the wild
        if (Math.random() < density) {
          this._dustSide = -this._dustSide;
          const wp = this.pos.clone().addScaledVector(nf, -1.55).addScaledVector(ns, this._dustSide * 1.25);
          wp.y = this.y + 0.1;
          gm.particles.dust(wp, offRoad ? Math.min(1.2, speedN * 1.35 + 0.15) : speedN);
          if (isPlayer && speedN > 0.75 && Math.random() < 0.5) {
            const wp2 = this.pos.clone().addScaledVector(nf, -1.55).addScaledVector(ns, -this._dustSide * 1.25);
            wp2.y = this.y + 0.1;
            gm.particles.dust(wp2, speedN);
          }
        }
      }
    }

    // ---- leaf litter kicked up on a shedding world ----
    // Gated on the theme's own weather rather than a new flag: a world that is
    // dropping leaves out of its canopy is a world with leaves on the road,
    // and there is no case where one is true and the other is not. Same
    // distance cull and the same speed floor as the dust above, so an autumn
    // grid costs no more than any other one at range.
    const wx = gm.track?.theme?.weather;
    if (this.alive && !this.airborne && sp > 9 && wx?.type === 'leaves' && gm.player) {
      const isPlayer = this === gm.player;
      if (isPlayer || this.pos.distanceToSquared(gm.player.pos) < 10000) {
        // thicker than dust, because litter is what the season IS — but only
        // while actually moving through it, so a stopped car sits in silence
        const dens = (isPlayer ? 0.85 : 0.4) * (0.25 + 0.75 * speedN);
        if (Math.random() < dens) {
          _leafBack.copy(nf).multiplyScalar(-1);
          const front = this.pos.clone().addScaledVector(nf, 1.35);
          front.y = this.y + 0.05;
          gm.particles.leafKick(front, _leafBack, ns, speedN, wx.color);
        }
      }
    }

    // ---- rubber on the road: skid marks while sliding hard ----
    if (this.alive && !this.airborne && Math.abs(vl) > 6 && sp > 12 && gm.skids) {
      this._skidClock = (this._skidClock ?? 0) - dt;
      if (this._skidClock <= 0) {
        this._skidClock = 0.028;
        const skidH = Math.atan2(this.vel.x, this.vel.z); // streak along travel dir
        for (const s of [-1, 1]) {
          const wx = this.pos.x + nf.x * -1.45 + ns.x * s * 1.05;
          const wz = this.pos.z + nf.z * -1.45 + ns.z * s * 1.05;
          gm.skids.add(wx, this.y + 0.07, wz, skidH, Math.min(1, Math.abs(vl) / 16));
        }
      }
    }

    // ---- damage smoke + scorch tint ----
    const frac = this.health / this.maxHealth;
    if (this.alive && frac < 0.55) {
      this._smokeClock -= dt;
      if (this._smokeClock <= 0) {
        const sev = 1 - frac / 0.55; // 0 at 55% health -> 1 at dead (fire kicks in below 28%)
        this._smokeClock = THREE.MathUtils.lerp(0.16, 0.05, sev);
        const ep = this.pos.clone().addScaledVector(nf, 1.5);
        ep.y = this.y + 1.1;
        gm.particles.damageSmoke(ep, sev);
      }
    }
    if (frac !== this._tintFrac) { this._tintFrac = frac; this._applyScorch(frac); }

    // track constraint (free roam: no walls — the whole world is drivable)
    const t = this.game.track;
    // useY = grounded only: airborne, this.pos.y is a jump arc that matches
    // no station in particular, and height would bias the pick toward
    // whichever one happens to be that high right now (see nearestIndex).
    this.trackIndex = t.nearestIndex(this.pos, this.trackIndex, !this.airborne);
    this.lateral = t.lateralOffset(this.pos, this.trackIndex);
    this.wallGrind = Math.max(0, this.wallGrind - dt);
    // There are no fences any more — the world is open and off-road slowness
    // is the boundary. Two exceptions still clamp at the road edge:
    //  - AI cars always (they race the line and never wander), soft absorb
    //  - everyone on cliff-walled levels: canyon rock is real STONE — heavy
    //    damage on hard hits (RULES.md material law)
    const cliffy = !!t.T?.cliffWalls;
    let wallHere = false;
    let cliffProf = null;                // the face we are being held off, if any
    const fside = Math.sign(this.lateral) || 1;
    // ---- width-variation: the clamp line follows the pinched road width
    // (cliff worlds have no narrows, so this equals WALL_LIMIT there)
    const wallLim = (t.widthAt?.(this.trackIndex) ?? ROAD_HALF) + 0.55;
    if (Math.abs(this.lateral) > wallLim) {
      if (this !== gm.player) wallHere = true; // AI safety net, all levels
      else if (cliffy) {
        // canyon: rock walls are solid — except the low berm near the start
        // bowl, where the cliffs open up and free-roamers can drive out.
        //
        // FREE-ROAMERS. The exemption never said so, and a RACING car went
        // through it too: UNDERCITY's start bowl runs a 1.7 u berm for ~40
        // samples on BOTH sides, so a racer carving wide off the line — or
        // shoved wide by the pack — left the trench entirely and rolled to a
        // stop on the black apron, 8th of 8 at 16 s (the r273 phone shot).
        // With the throttle released no automatic net fires out there, on
        // purpose, so the exit is the thing to close: in a road event the
        // berm is a wall like any other. It is visible knee-high stone, so
        // holding a racer at it is not an invisible wall. The cliffSetback
        // and past-the-outer-face carve-outs below still apply after this.
        const prof = t._cliffProfile ? t._cliffProfile(this.trackIndex, fside) : null;
        cliffProf = prof;
        wallHere = !prof || prof.h > 2.5 || !freeRoam;
        // deep-valley worlds (cliffSetback) stand their faces well off the
        // verge: the player may roam the valley floor and only the ROCK is
        // solid - off-road slowness is the boundary in between
        if (wallHere && prof && t.T?.cliffSetback
            && Math.abs(this.lateral) < prof.base - 1.2) {
          wallHere = false;
        }
        // FREE ROAM law (RULES.md: roam differs only in REACH): the rock is
        // solid, but it is not an infinite fence. Once a roamer is past the
        // outer face — having driven out through the low berm — they are on
        // open ground and must stay there. Without this the clamp yanked them
        // back THROUGH the cliff, stranding every off-road treasure star.
        if (wallHere && freeRoam && prof) {
          const outer = prof.base + prof.l1 + prof.l2 + 1.5;
          if (Math.abs(this.lateral) > outer) wallHere = false;
        }
      }
    }
    if (wallHere) {
      const n = t.nrm[this.trackIndex];
      const vn = this.vel.dot(n);
      // ---- ANGLE OF ATTACK. `square` is the share of your speed pointed INTO
      // the rock: 1 = dead-on, 0 = running parallel to the face. It is the
      // difference between "brushed the wall at 100" and "drove into the wall
      // at 30" — those two arrive with the SAME normal speed, and until now
      // they were the same event. Measured on the wall path they cost the same
      // ~40% of total speed in a single frame, which is what made a graze read
      // as a crash. Everything below is scaled by it.
      const spIn = Math.hypot(this.vel.x, this.vel.z);
      const square = THREE.MathUtils.clamp(Math.abs(vn) / Math.max(3, spIn), 0, 1);
      // HOLD THE CAR AT THE FACE IT HIT, NOT AT THE ROAD EDGE.
      //
      // On a slot canyon (no `cliffSetback`) the rock IS the verge and the two
      // agree to within ~0.3 u, which is what this line was written for. But
      // `cliffSetback` moved the TRIGGER out to `prof.base - 1.2` and left the
      // TARGET at the verge, so a car that touched LAGUNA SECA's face at
      // lateral 36.3 was put back at 9.55. Measured single-frame teleport at
      // five stations, both sides: 26.5 26.6 26.6 26.8 26.8 26.9 26.9 27.3
      // 27.6 u, entering at 109.5 km/h and leaving at 5.1 — and it repeats,
      // because the player drives straight back at the road he can see. That
      // is the reported screenshot: last place, mid-race, 8 km/h against a
      // rock face.
      //
      // AI cars keep `wallLim`: they race the racing line and are clamped at
      // the road edge on every world, and `cliffProf` is null on that branch.
      const stand = (cliffy && t.T?.cliffSetback && cliffProf)
        ? Math.max(wallLim, cliffProf.base - 1.2) : wallLim;
      const over = this.lateral - fside * stand; // ---- width-variation
      this.pos.addScaledVector(n, -over);
      // absorb, don't bounce: kill the into-wall velocity (5% rebound)
      this.vel.addScaledVector(n, -vn * 1.05);
      // GRIND, don't glide. The old flat 3% scrub let a car lean on the rock
      // and ride it like a rail all the way round a bend. Speed loss now
      // scales with how hard the car is leaning in: a feather graze still
      // costs almost nothing, a committed hit bleeds a lot of speed.
      // …times `square`, so the scrub answers the ANGLE too. A dead-on hit
      // (square = 1) keeps exactly the old figure; a sideswipe at the same
      // normal speed keeps its momentum and just sheds paint.
      const lean = THREE.MathUtils.clamp(Math.abs(vn) / 14, 0, 1) * square;
      this.vel.multiplyScalar(1 - (0.03 + 0.5 * lean) * (1 - 0.2 * hnd));
      // …and peel the nose off the rock so the car separates instead of
      // sticking. Sets a minimum outward rate rather than adding every frame,
      // and the rate is deliberately GENTLE: the old lean-scaled shove (up to
      // ~5 u/s) fired the car across narrow dual-wall canyons into the
      // opposite rock face, which shoved it straight back — a ping-pong
      // "bounding ball" (user bug, CANYON RUN). 1.4 u/s is enough to separate
      // without ever reaching the far wall; the anti-glide fix above (grind
      // scrub scaling with lean) is what stops wall-riding, and it stays.
      const outward = -fside * this.vel.dot(n);
      const wantOut = 1.4;
      if (outward < wantOut) this.vel.addScaledVector(n, -fside * (wantOut - outward));
      this.lateral = fside * stand; // ---- width-variation
      // opt-in wall instrument (headless): set __game.__wallProbe = {} and every
      // contact records what the peel-off actually did — `inward` and
      // `pingPong` must both stay 0 (no shove back into the rock, and no
      // contact bouncing to the opposite wall inside 3s).
      const wp = gm.__wallProbe;
      if (wp && this === gm.player) {
        const after = -fside * this.vel.dot(n);
        wp.contacts = (wp.contacts ?? 0) + 1;
        if (after < 0) wp.inward = (wp.inward ?? 0) + 1;
        if (after > 2.5) wp.hotPeel = (wp.hotPeel ?? 0) + 1;
        wp.maxOut = Math.max(wp.maxOut ?? 0, +after.toFixed(2));
        if (wp.lastSide && wp.lastSide !== fside && gm.raceTime - wp.lastT < 3) {
          wp.pingPong = (wp.pingPong ?? 0) + 1;
        }
        wp.lastSide = fside; wp.lastT = gm.raceTime;
      }
      if (this === gm.player && Math.abs(this.speedAlong) > 12 && Math.random() < 0.4)
        gm.particles.sparks(this.pos, n, 2);
      if (this.wallGrind <= 0) {
        this.wallGrind = 0.18;
        const vnAbs = Math.abs(vn);
        // cliff rock hurts like STONE, but only on a real hit (glancing
        // scrapes are free) and at most ~once a second — the old per-grind
        // ticks could wreck a car in one long scrape along the canyon wall
        if (this === gm.player && cliffy) {
          // 2.8s hurt cooldown: one STONE hit per deliberate ram. The old 1.1s
          // let a sustained head-on push land a second full hit before the
          // player could even react — two ~50-hull stone hits back-to-back
          // wrecked the car outright (the CANYON RUN "bounding ball" death).
          if (vnAbs > 7 && (this._cliffHurt ?? 0) <= 0) {
            this._cliffHurt = 2.8;
            gm.onSolidCrash?.({ mat: 'stone' }, this, vnAbs, n.x * fside, n.z * fside, square);
          } // else: scrape sparks only — no hull cost while the cooldown runs
        } else this.onWallHit(n, vnAbs);
      }
    }

    // ---- world obstacles: solid circles {x,z,r} — push out + bounce ----
    // (track.obstacles / track.puddles may not exist on every level build yet)
    const obstacles = t.obstacles ?? [];
    for (const ob of obstacles) {
      const dx = this.pos.x - ob.x, dz = this.pos.z - ob.z;
      const rr = ob.r + 2.5; // obstacle radius + car body radius
      const d2 = dx * dx + dz * dz;
      // threading the needle: shaving past a rock at speed without touching
      // it pays CLOSE CALL style (4s per-obstacle cooldown)
      if (this === gm.player && d2 >= rr * rr && d2 < (rr + 1.9) * (rr + 1.9)
          && Math.abs(this.speedAlong) > 22
          && gm.raceTime - (ob._ccT ?? -9) > 4) {
        ob._ccT = gm.raceTime;
        gm.style?.(25, 'CLOSE CALL');
      }
      if (d2 >= rr * rr || d2 < 1e-8) continue;
      const d = Math.sqrt(d2);
      const nx = dx / d, nz = dz / d;
      this.pos.x = ob.x + nx * rr; // push out along the radial
      this.pos.z = ob.z + nz * rr;
      const vn = this.vel.x * nx + this.vel.z * nz;
      if (vn < 0) {
        // angle of attack, taken BEFORE the normal component is absorbed
        const square = THREE.MathUtils.clamp(-vn / Math.max(3, Math.hypot(this.vel.x, this.vel.z)), 0, 1);
        this.vel.x -= nx * vn * 1.05; // absorb, like the wall scrape
        this.vel.z -= nz * vn * 1.05;
        this.vel.multiplyScalar(1 - 0.07 * square); // flat 7% used to tax brushes too
        if (this.wallGrind <= 0) {
          // a graze scrapes along the rock over several frames — one cooldown
          // long enough that it stays ONE event instead of three
          this.wallGrind = square < 0.55 ? 0.55 : 0.18;
          // road obstacles are ROCK (hoodoos, basalt) — stone crash rules
          if (this === gm.player && gm.onSolidCrash) {
            gm.onSolidCrash({ mat: 'stone' }, this, Math.abs(vn), nx, nz, square);
          } else {
            _hitNormal.set(nx, 0, nz);
            this.onWallHit(_hitNormal, Math.abs(vn));
            if (this === gm.player) gm.shake = Math.min(1, gm.shake + 0.2);
          }
        }
      }
    }

    // ---- MASONRY BARRIERS: parapets, dry-stone walls, quay copings.
    //
    // A wall is a SEGMENT, and it is solid for its whole length. It used to
    // be registered as a row of circles, one per block, which left every
    // block end and every joint open: driven head-on at a GOTTHARD parapet,
    // four runs in six went through and one finished on top of it. Resolving
    // against the nearest point on the segment closes both.
    //
    // Height matters as much as footprint. The barrier bites while the car is
    // anywhere between just under its base and just over its coping, so you
    // can neither slip beneath it on a falling shelf nor ride up onto it; a
    // car genuinely above the coping (a big jump) passes over, which is the
    // one way a wall should ever be cleared.
    if (t.barriers && t.barriers.length) {
      const R = 1.7;                       // car half-width against masonry
      // RESOLVE THE WORST INTRUSION, NOT THE FIRST ONE FOUND. Walking the
      // list in order and fixing the first few overlaps leaves the deepest
      // one unfixed when it happens to sit later in the array: measured on
      // VINEYARD VELOCE, a car ended a frame 0.62 u inside a wall whose
      // standoff is 2.13. Each pass finds the deepest overlap and pushes out
      // of that one; two passes settle a joint, where clearing one block
      // seats the car against its neighbour.
      for (let pass = 0; pass < 2; pass++) {
        let w = null, wd = 0, wcx = 0, wcz = 0, wrr = 0;
        for (let i = 0; i < t.barriers.length; i++) {
          const q = t.barriers[i];
          if (this.pos.y > q.y + q.h + 1.0) continue;   // cleared the coping
          // PASSING UNDER IT. A wall has a top AND a bottom: this gate only
          // knew the top, so a car driving beneath a flyover was stopped dead
          // by the deck's own handrail 8 u overhead — photographed by the
          // player as the whole field parked under MOUNTAIN TO SEA's bridge.
          // A rail whose base sits above the roof passes clean over us — but
          // ONLY a rail with air beneath it (`over`, stamped at build). A
          // wall seated on a bank above the car is backed by earth, and
          // driving into the bank must still find the wall (GOTTHARD's
          // switchback masonry, caught by test-walls).
          if (q.over && this.pos.y < q.y - 2.6) continue;
          const ex = q.x2 - q.x1, ez = q.z2 - q.z1;
          const len2 = ex * ex + ez * ez || 1;
          let s2 = ((this.pos.x - q.x1) * ex + (this.pos.z - q.z1) * ez) / len2;
          s2 = s2 < 0 ? 0 : s2 > 1 ? 1 : s2;
          const cx = q.x1 + ex * s2, cz = q.z1 + ez * s2;
          const dx = this.pos.x - cx, dz = this.pos.z - cz;
          const rr = q.hw + R;
          const d2 = dx * dx + dz * dz;
          if (d2 >= rr * rr) continue;
          const depth = rr - Math.sqrt(d2);
          if (depth > wd) { wd = depth; w = q; wcx = cx; wcz = cz; wrr = rr; }
        }
        if (!w) break;
        const dx = this.pos.x - wcx, dz = this.pos.z - wcz;
        const d = Math.max(0.001, Math.hypot(dx, dz));
        const nx = dx / d, nz = dz / d;
        const vApp = this.vel.x * nx + this.vel.z * nz;
        const spd = Math.hypot(this.vel.x, this.vel.z);
        const square = THREE.MathUtils.clamp(-vApp / Math.max(3, spd), 0, 1);
        this.pos.x = wcx + nx * wrr;
        this.pos.z = wcz + nz * wrr;
        if (vApp < 0) {
          this.vel.x -= nx * vApp * 1.05;
          this.vel.z -= nz * vApp * 1.05;
          this.vel.multiplyScalar(1 - 0.07 * square);
          if (this.wallGrind <= 0) {
            this.wallGrind = square < 0.55 ? 0.55 : 0.18;
            if (this === gm.player && gm.onSolidCrash) {
              gm.onSolidCrash({ mat: w.mat || 'stone' }, this, Math.abs(vApp), nx, nz, square);
            } else {
              _hitNormal.set(nx, 0, nz);
              this.onWallHit(_hitNormal, Math.abs(vApp));
            }
          }
        }
      }
    }

    // ---- solid scenery (boulders/mesas = stone, huts, gantry/stand = metal):
    // material-aware crashes — stone wrecks you, buildings crash big
    if (this === gm.player && t.solids && t.solids.length) {
      for (const ob of t.solids) {
        const dx = this.pos.x - ob.x, dz = this.pos.z - ob.z;
        // a tapering form is only as wide as it is drawn at our own height
        const rr = solidRadiusAt(ob, this.pos.y) + 1.8;
        if (dx * dx + dz * dz >= rr * rr) continue;
        // A TALL THING IS SOLID ALL THE WAY UP.
        //
        // The height gate was a flat +/-6 u around the collider's own y, which
        // is right for a boulder and catastrophic for a mountain: a massif
        // cone is 110-360 u tall and stands on sloping highland, so the car's
        // height differed from the cone's BASE by far more than 6 the moment
        // it started climbing toward it — and the collider was skipped
        // entirely. Reported as driving into the mountains rather than hitting
        // or climbing them, and that is exactly what it was.
        //
        // Anything that declares a height `h` is now solid over its whole
        // span. Everything else keeps the old window, because for a knee-high
        // rock under a flyover that window is the point.
        if (ob.y !== undefined) {
          if (ob.h !== undefined) {
            // ...AND A MOUNTAIN HAS NO UNDERSIDE — IN PROPORTION. The lower
            // pad was a flat −3 u, but a mountain's seat is sampled at the
            // CENTRE of a 100-300 u footprint, and on sloping ground the
            // flank foot runs 10-30 u lower — so a car approaching from
            // downhill sat below the pad and the whole collider was skipped.
            // Measured on SUMMIT CLIMB in roam: car at y 23.1, 111 u from a
            // horizon hill seated at y 30 whose radius at that height is 164
            // — inside the rock, gate said "under it, ignore". Fifty units
            // of drawn mountain overhead, reported as "climbing and sinking
            // in mountains".
            //
            // The rule is BINARY, not scaled. A first cut scaled the pad
            // with height (h·0.35, capped 30) and FURKA's valleys promptly
            // put a ramming car 30+ u below a cone's seat and inside it
            // (invisible-walls' massif-ram law). A mountain has NO
            // underside, full stop — and "mountain" is tall OR WIDE: a
            // fit-shrunken ice chip is 15 u low but 40 u across, seated at
            // its centre, and a car at its downhill toe sat 3 u under that
            // seat and clipped 5.4 u inside (same law, measured — the
            // height test alone let it through twice, byte-identical).
            // Only genuinely small furniture keeps the old −3, so a verge
            // boulder still does not shove cars riding the roadbed above
            // its toe (GLACIER COL's grounded-step law owns that case).
            if (ob.h > 20 || (ob.r ?? 0) > 10
              ? this.pos.y > ob.y + ob.h
              : (this.pos.y < ob.y - 3 || this.pos.y > ob.y + ob.h)) continue;
          } else if (Math.abs(this.pos.y - ob.y) > 6) continue;
        }
        const d = Math.max(0.01, Math.sqrt(dx * dx + dz * dz));
        const nx = dx / d, nz = dz / d;
        // angle of attack — see the wall block above. Taken before anything
        // touches the velocity, because it is a property of the APPROACH.
        const vApp = this.vel.x * nx + this.vel.z * nz;
        const square = THREE.MathUtils.clamp(-vApp / Math.max(3, Math.hypot(this.vel.x, this.vel.z)), 0, 1);
        // SMALL STONES YIELD. A knee-high rock stopping a rally truck dead is
        // the thing that reads as unfair — it should cost you paint and speed,
        // then go tumbling. Anything 1.15 u and up is a real boulder and still
        // wins, and below walking pace nothing shifts at all.
        if (ob.mat === 'stone' && !ob.knocked
            && (ob.r ?? 9) < (window.__DRIVING?.patch02b?.propShoveRadiusU ?? 1.15)
            && Math.abs(this.speedAlong) > 8 && gm.knockStone) {
          gm.knockStone(ob, this, Math.abs(this.speedAlong), -nx, -nz, square);
          continue;                       // no push-out — you go through it
        }
        this.pos.x = ob.x + nx * rr;
        this.pos.z = ob.z + nz * rr;
        const vn = vApp;
        if (vn < 0) {
          this.vel.x -= nx * vn * 1.05;
          this.vel.z -= nz * vn * 1.05;
          if (this.wallGrind <= 0) {
            // one graze = one event, not three as the car scrapes past
            this.wallGrind = square < 0.55 ? 0.55 : 0.18;
            gm.onSolidCrash?.(ob, this, Math.abs(vn), nx, nz, square);
          }
        }
        break;
      }
    }

    // ---- landed fall-hazards are STONE for rivals too. The full t.solids
    // sweep above is player-only (AI never leaves the road, so static scenery
    // can't touch it), but rocks/burning trees LAND ON the road mid-race —
    // without this an AI ghosts through the boulder the player just dodged.
    // The runtime faller list is tiny (≤4 airborne + a few landed), so this
    // stays O(few) per rival.
    if (this !== gm.player && gm.fallers && gm.fallers.length) {
      for (const f of gm.fallers) {
        const ob = f.solid;
        if (!ob) continue; // still airborne (or an icicle that shattered)
        const dx = this.pos.x - ob.x, dz = this.pos.z - ob.z;
        const rr = ob.r + 1.8;
        if (dx * dx + dz * dz >= rr * rr) continue;
        const d = Math.max(0.01, Math.sqrt(dx * dx + dz * dz));
        const nx = dx / d, nz = dz / d;
        // SMALL STONES YIELD. A knee-high rock stopping a rally truck dead is
        // the thing that reads as unfair — it should cost you paint and speed,
        // then go tumbling. Anything 1.15 u and up is a real boulder and still
        // wins, and below walking pace nothing shifts at all.
        const vn = this.vel.x * nx + this.vel.z * nz;
        const square = THREE.MathUtils.clamp(-vn / Math.max(3, Math.hypot(this.vel.x, this.vel.z)), 0, 1);
        if (ob.mat === 'stone' && !ob.knocked
            && (ob.r ?? 9) < (window.__DRIVING?.patch02b?.propShoveRadiusU ?? 1.15)
            && Math.abs(this.speedAlong) > 8 && gm.knockStone) {
          gm.knockStone(ob, this, Math.abs(this.speedAlong), -nx, -nz, square);
          continue;                       // no push-out — you go through it
        }
        this.pos.x = ob.x + nx * rr;
        this.pos.z = ob.z + nz * rr;
        if (vn < 0) {
          this.vel.x -= nx * vn * 1.05; // same absorb-don't-bounce as all SOLIDs
          this.vel.z -= nz * vn * 1.05;
        }
        break;
      }
    }

    // ---- tire stacks: burst apart at speed, solid at a crawl ----
    if (this === gm.player && t.tireStacks && t.tireStacks.length) {
      for (const st of t.tireStacks) {
        if (st.dead) continue;
        const dx = this.pos.x - st.x, dz = this.pos.z - st.z;
        const rr = st.r + 1.6;
        if (dx * dx + dz * dz >= rr * rr) continue;
        if (Math.abs(this.pos.y - (st.y ?? 0)) > 4) continue;
        // planar speed, not along-track speed (the tree path's lesson): a
        // stack sits at the ROADSIDE, so the car that hits one is usually
        // moving ACROSS the track — speedAlong read ~0 there and the stack
        // stood like a bollard at any angle but dead ahead
        if (Math.hypot(this.vel.x, this.vel.z) > 6) gm.onTireSmash?.(st, this);
        else {
          const d = Math.max(0.01, Math.sqrt(dx * dx + dz * dz));
          this.pos.x = st.x + (dx / d) * rr;
          this.pos.z = st.z + (dz / d) * rr;
          const vn = this.vel.x * (dx / d) + this.vel.z * (dz / d);
          if (vn < 0) { this.vel.x -= (dx / d) * vn; this.vel.z -= (dz / d) * vn; }
        }
        break;
      }
    }

    // ---- props: smash at speed, SOLID at a crawl ----
    //
    // RULES.md section 2 defines BREAKABLE as "above a speed threshold the
    // object is destroyed; below it, SOLID push-out", and section 1.1 says
    // nothing readable as an object may be intangible. Tire stacks and sponsor
    // boards (above and below) implement exactly that. Props never did: the
    // only prop contact code is the smash branch in main.js `_updateProps`,
    // with no else, so under 2 u/s a crate, barrel or log round was a ghost.
    // Measured — approaching a 1.7 u crate at 1.0, 1.5 and 1.9 u/s, the car
    // drove clean through every time, reaching 0.39 u from its centre.
    //
    // The smash half stays where it is; this only supplies the missing solid
    // half, and only below the same 2 u/s threshold main.js uses, so nothing
    // about smashing changes.
    // NOTE: `gm.props`, not `t.props`. `track.props` is the build-time list and
    // is never pruned; the game keeps a live copy (main.js:670) and smashing
    // splices from THAT. Colliding against the track list would push the car
    // off props it had already destroyed.
    if (this === gm.player && gm.props && gm.props.length && Math.abs(this.speedAlong) <= 2) {
      for (const pr of gm.props) {
        const dx = this.pos.x - pr.x, dz = this.pos.z - pr.z;
        const rr = (pr.r ?? 1.2) + 1.6;
        if (dx * dx + dz * dz >= rr * rr) continue;
        if (Math.abs(this.pos.y - (pr.y ?? 0)) > 4) continue;
        const d = Math.max(0.01, Math.sqrt(dx * dx + dz * dz));
        this.pos.x = pr.x + (dx / d) * rr;
        this.pos.z = pr.z + (dz / d) * rr;
        const vn = this.vel.x * (dx / d) + this.vel.z * (dz / d);
        if (vn < 0) { this.vel.x -= (dx / d) * vn; this.vel.z -= (dz / d) * vn; }
        break;
      }
    }

    // ---- sponsor boards: rip out at speed, solid at a crawl ----
    if (this === gm.player && t.banners && t.banners.length) {
      for (const bn of t.banners) {
        if (bn.dead) continue;
        const dx = this.pos.x - bn.x, dz = this.pos.z - bn.z;
        const rr = bn.r + 1.6;
        if (dx * dx + dz * dz >= rr * rr) continue;
        if (Math.abs(this.pos.y - (bn.y ?? 0)) > 5) continue;
        if (Math.abs(this.speedAlong) > 8) gm.onBannerSmash?.(bn, this);
        else {
          const d = Math.max(0.01, Math.sqrt(dx * dx + dz * dz));
          this.pos.x = bn.x + (dx / d) * rr;
          this.pos.z = bn.z + (dz / d) * rr;
          const vn = this.vel.x * (dx / d) + this.vel.z * (dz / d);
          if (vn < 0) { this.vel.x -= (dx / d) * vn; this.vel.z -= (dz / d) * vn; }
        }
        break;
      }
    }

    // ---- bushes: soft — brush through with a leaf burst and a drag hit ----
    if (this === gm.player && t.bushes && t.bushes.length) {
      for (const bu of t.bushes) {
        const dx = this.pos.x - bu.x, dz = this.pos.z - bu.z;
        const rr = bu.r + 1.2;
        if (dx * dx + dz * dz >= rr * rr) continue;
        if (Math.abs(this.pos.y - (bu.y ?? 0)) > 3.5) continue;
        gm.onBushBrush?.(bu, this);
        break;
      }
    }

    // ---- trees (material law): a toy truck does not fell a grown tree.
    // Saplings/cacti/snags yield at speed; BIG trunks are SOLID — the car
    // stops, sheds needles, and takes real trunk damage instead. Tree records
    // may carry an explicit `solid` flag (kapok/redwood giants); older builds
    // only mark big pines by kind+scale, so that stays as the fallback.
    if (this === gm.player && t.trees && t.trees.length) {
      for (const tr of t.trees) {
        if (tr.dead) continue;
        const dx = this.pos.x - tr.x, dz = this.pos.z - tr.z;
        const rr = tr.r + 1.7;
        if (dx * dx + dz * dz >= rr * rr) continue;
        if (Math.abs(this.pos.y - (tr.y ?? 0)) > 4) continue; // rim cacti, cliff snags
        // REAL-WORLD RULE: any full-grown trunk is solid, whatever species -
        // only saplings (small s), pulpy cacti and dead snags yield. Size is
        // AUTHORITATIVE: a species record's solid:false cannot make a grown
        // birch pushable (solid:true still hardens small specials).
        const grown = (tr.s ?? 1) >= 1.0 && tr.kind !== 'cactus' && tr.kind !== 'snag';
        const yields = tr.solid === true ? false : !grown;
        // closing speed, not along-track speed: a broadside hit at pace
        // snaps a sapling just as surely as a head-on one
        if (yields && Math.hypot(this.vel.x, this.vel.z) > 8) {
          gm.onTreeSmash?.(tr, this);
        } else {
          const d = Math.max(0.01, Math.sqrt(dx * dx + dz * dz));
          const nx = dx / d, nz = dz / d;
          this.pos.x = tr.x + nx * rr;
          this.pos.z = tr.z + nz * rr;
          const vn = this.vel.x * nx + this.vel.z * nz;
          if (vn < 0) {
            // PATCH_02 v1.2 (fix 2 re-open): trees are PROPS and MUST route
            // through the same angle-of-attack rule as stone — recording B
            // paid 33 hull for a 145 km/h brush past a trunk. Compute the
            // share of speed into the trunk BEFORE the bounce edits vel.
            const square = THREE.MathUtils.clamp(
              -vn / Math.max(3, Math.hypot(this.vel.x, this.vel.z)), 0, 1);
            this.vel.x -= nx * vn * 1.05;
            this.vel.z -= nz * vn * 1.05;
            if (!yields && this.wallGrind <= 0) {
              this.wallGrind = square < 0.55 ? 0.55 : 0.18;
              gm.onTreeCrash?.(tr, this, Math.abs(vn), nx, nz, square);
            }
          }
        }
        break;
      }
    }

    // ---- puddles: heavy drag + slick grip + brown splash while inside ----
    const puddles = t.puddles ?? [];
    if (puddles.length && !this.airborne) {
      for (const pd of puddles) {
        const dx = this.pos.x - pd.x, dz = this.pos.z - pd.z;
        if (dx * dx + dz * dz >= pd.r * pd.r) continue;
        const f = Math.max(0, 1 - 0.9 * dt); // water drag on the hull
        this.vel.x *= f;
        this.vel.z *= f;
        // grip reduction picked up next frame (see grip section); never cut a
        // ford's longer wet-tire fade short ---- river-fords
        if (this._wetT < 0.14) this._wetT = 0.14;
        const spd2 = this.vel.lengthSq();
        if (spd2 > 36 && gm.player
            && (this === gm.player || this.pos.distanceToSquared(gm.player.pos) < 14400)) {
          const nSplash = this === gm.player ? 2 : 1;
          for (let s = 0; s < nSplash; s++) {
            _splash.set(
              this.pos.x + (Math.random() - 0.5) * 1.8, this.y + 0.12,
              this.pos.z + (Math.random() - 0.5) * 1.8
            );
            gm.particles.dust(_splash, 1.15);
          }
          if (Math.random() < 0.35) {
            _splash.set(this.pos.x, this.y + 0.15, this.pos.z);
            gm.particles.driftSmoke(_splash);
          }
        }
        break; // one puddle per frame is plenty
      }
    }

    // ---- river-fords: shallow water washing over the road — bow-wave spray,
    // hull drag, and a WET TIRES traction fade for a few seconds after ----
    // Ask the WATER, not a list of crossings. This used to loop `t.fords` — two
    // or three declared sample indices — so the river was wet only where it had
    // been labelled wet, and driving into the same river off-road, fifty metres
    // upstream, crossed it bone dry at full grip throwing nothing at all.
    const depth = (!this.airborne && this.alive && t.waterAt)
      ? t.waterAt(this.pos.x, this.pos.z) : 0;
    if (depth > 0.06) {
      const now = gm.raceTime ?? 0;
      {
        const spdF = Math.hypot(this.vel.x, this.vel.z);
        // drag scales with how deep you are: a wash over the road barely tugs,
        // a mid-channel plunge off-road hauls the car down hard
        const fDrag = Math.max(0, 1 - (0.35 + 0.75 * Math.min(1, depth / 2.2)) * dt);
        this.vel.x *= fDrag;
        this.vel.z *= fDrag;
        this._wetT = 3.5;                                        // long fade — see grip section
        this._wetMax = 3.5;
        this._fordNow = 0.16;                                    // aquaplaning window
        const entering = now - (this._inFordT ?? -99) > 1;
        this._inFordT = now;
        const nearCam = gm.player
          && (this === gm.player || this.pos.distanceToSquared(gm.player.pos) < 10000);
        if (entering) {
          if (this === gm.player && now - (this._fordFeedAt ?? -99) > 6) {
            this._fordFeedAt = now;
            gm.hud?.feed?.('WET TIRES', 'info');
            gm.buzz?.(20);
          }
          // entry splash: a foam ring bursting low around the bumper PLUS a
          // curtain of water thrown up and forward, so the chase cam sees a
          // real wall of white open past the car instead of a few wisps
          if (spdF > 2.5 && nearCam) {
            const pl = this === gm.player;
            const nRing = pl ? 26 : 10;
            for (let s = 0; s < nRing; s++) {
              const a = (s / nRing) * Math.PI * 2;
              gm.particles.spawn(
                this.pos.x + nf.x * 1.0 + Math.cos(a) * 1.9, this.y + 0.15,
                this.pos.z + nf.z * 1.0 + Math.sin(a) * 1.9,
                Math.cos(a) * (5 + spdF * 0.24) + nf.x * spdF * 0.18,
                3.0 + Math.random() * 3.4,
                Math.sin(a) * (5 + spdF * 0.24) + nf.z * spdF * 0.18,
                FORD_FOAM, 4.2 + Math.random() * 1.6, 0.6 + Math.random() * 0.45,
                { drag: 1.5, grav: 8, shrink: 0.35, alpha: 0.9 });
            }
            // the curtain: a fan of big slow droplets lofted off the bumper
            for (let s = 0, n = pl ? 14 : 5; s < n; s++) {
              const ws = (s / n) * 2 - 1;                        // −1..1 across the nose
              gm.particles.spawn(
                this.pos.x + nf.x * 1.9 + ns.x * ws * 1.7, this.y + 0.3,
                this.pos.z + nf.z * 1.9 + ns.z * ws * 1.7,
                nf.x * spdF * 0.22 + ns.x * ws * (7 + spdF * 0.2),
                6.5 + Math.random() * 5 + spdF * 0.1,
                nf.z * spdF * 0.22 + ns.z * ws * (7 + spdF * 0.2),
                Math.random() < 0.7 ? FORD_FOAM : SPRAY_WET,
                3.4 + Math.random() * 2.2, 0.75 + Math.random() * 0.5,
                { drag: 0.9, grav: 13, shrink: 0.45, alpha: 0.95 });
            }
          }
        }
        // bow wave while inside: sheets of white spray fan off all four wheels,
        // speed-scaled, pooled + budget-capped, distance-culled for AI
        // 5 u/s was 18 km/h — ease through a crossing and it threw nothing at
        // all, so a slow ford looked like driving over a painted blue stripe
        if (spdF > 1.6 && nearCam) {
          const pl = this === gm.player;
          this._fordAcc = Math.min(12, (this._fordAcc ?? 0)
            + dt * (70 + spdF * 4.5) * (pl ? 1 : 0.35));
          let burst = pl ? 9 : 3;                                // per-frame cap
          while (this._fordAcc >= 1 && burst-- > 0) {
            this._fordAcc -= 1;
            const ws = Math.random() < 0.5 ? -1 : 1;             // L/R wheel
            const rear = Math.random() < 0.4;                    // rooster tail behind
            const alongOff = rear ? -1.5 : 1.5;
            gm.particles.spawn(
              this.pos.x + nf.x * alongOff + ns.x * ws * 1.35, this.y + 0.18,
              this.pos.z + nf.z * alongOff + ns.z * ws * 1.35,
              nf.x * spdF * (rear ? -0.22 : 0.35) + ns.x * ws * (5.5 + spdF * 0.3) + (Math.random() - 0.5) * 3,
              3.0 + spdF * 0.14 + Math.random() * 2.6,
              nf.z * spdF * (rear ? -0.22 : 0.35) + ns.z * ws * (5.5 + spdF * 0.3) + (Math.random() - 0.5) * 3,
              Math.random() < 0.65 ? FORD_FOAM : SPRAY_WET,
              3.0 + spdF * 0.09 + Math.random() * 1.2, 0.6 + Math.random() * 0.5,
              { drag: 1.0, grav: 12, shrink: 0.5, alpha: 0.92 });
          }
        }
      }
      // faint water-drip spray trailing off the tires while WET TIRES lasts
      if ((this._wetMax ?? 0) > 1 && this._wetT > 0 && sp > 10 && Math.random() < 0.3
          && gm.player
          && (this === gm.player || this.pos.distanceToSquared(gm.player.pos) < 6400)) {
        gm.particles.spawn(
          this.pos.x - nf.x * 1.6 + (Math.random() - 0.5) * 1.2, this.y + 0.2,
          this.pos.z - nf.z * 1.6 + (Math.random() - 0.5) * 1.2,
          (Math.random() - 0.5) * 2, 1 + Math.random() * 1.5, (Math.random() - 0.5) * 2,
          SPRAY_WET, 0.9, 0.4, { drag: 1, grav: 14, shrink: 0.8, alpha: 0.5 });
      }
    }
    // ---- end river-fords ----

    // ---- vertical motion (ramps & jumps; rolling terrain off-road in roam) ----
    //
    // THE SINKING BUG.
    //
    // Off-road, ground height came from the raw terrain; on-road it came from
    // the road ribbon. Those are two different surfaces, and on a shelf road
    // they are a LONG way apart. Measured with seeded worlds:
    //
    //   FURKA RIDGE   road sits up to 30.8 u above the terrain at the verge
    //   COL DE TURINI                  21.7 u
    //   PIKES PEAK                     20.9 u
    //
    // Cross that threshold — two wheels onto the verge, a wide line through a
    // switchback — and gY dropped by up to thirty units in one frame. The
    // off-road branch below then EASES toward it at 12/s, so the car did not
    // teleport, it slid down into the scenery. That is what "seems I'm
    // sinking" was.
    //
    // The road is a physical shelf: you cannot be inside it. So within the
    // corridor the ground is the HIGHER of the two surfaces, and only well
    // outside it does raw terrain take over. Out in the open, nothing changes.
    const SHELF_REACH = 16;      // u from centreline that the roadbed still holds you up
    // Sampled CONTINUOUSLY along the centreline, not at the rounded index.
    // `groundHeightAt` is a staircase between samples; at racing speed the car
    // crosses a step every three frames, and the jump detector below — which
    // differentiates this value twice — was reading those steps as crests.
    // See Track.groundHeightAtPos.
    const roadY = t.groundHeightAtPos
      ? t.groundHeightAtPos(this.pos, this.trackIndex, this.lateral)
      : t.groundHeightAt(this.trackIndex, this.lateral);
    let gY;
    if (offRoad) {
      const terr = t.terrainHeight(this.pos.x, this.pos.z);
      gY = Math.abs(this.lateral) < SHELF_REACH ? Math.max(terr, roadY) : terr;
    } else {
      gY = roadY;
    }

    // TOO STEEP TO CLIMB.
    //
    // The car's height is pinned to the ground under it, so terrain by itself
    // has never stopped anything — it would drive up a vertical cliff at full
    // speed, which is why the world had no edge. Look a car-length ahead: past
    // a grade no vehicle could hold, traction goes and gravity takes the speed
    // back. Below the threshold nothing changes at all, so every road, every
    // ramp and the whole climbable massif (which tops out around 24%) drive
    // exactly as before — this only ever bites on the border wall.
    // ...but ONLY at the border. Gating this on gradient alone was wrong and
    // shipped as a regression: the mountainside between stacked switchbacks is
    // legitimately near-vertical, so on the pass worlds 12% of the ground just
    // off the racing line reads steeper than any threshold a car could hold
    // (Summit Climb p99 = 227%), and players who went off-road there were
    // braked to a crawl on ground they were entitled to drive. The border is a
    // radius, so test the radius — then ordinary terrain, however steep, is
    // never touched, and the wall still cannot be climbed.
    // ...and the mountain is a border too. The massif could be driven up from
    // the side, so a stage could be climbed rather than raced — reported with a
    // screenshot of a car most of the way up the summit's flank. The lesson from
    // the regression above still holds, so the bank you scramble on the way back
    // to the road is untouched: this only engages once you are genuinely off the
    // course (25 u from the centreline is well past any verge, ditch or
    // switchback cut), and even then only on ground no vehicle could hold.
    const rimR2 = RIM_RADIUS * RIM_RADIUS;
    const atRim = this.pos.x * this.pos.x + this.pos.z * this.pos.z > rimR2;
    // In a RACE the course is the course — but "the course" is wider than the
    // road. You may cut a verge, take to the grass, run the inside of a
    // hairpin, drop off a bank and rejoin. All of that is a line, not an
    // escape, and the price for it is grip and drag (see offMult above), never
    // a hand on your throttle.
    //
    // What this backstop stops is LEAVING, not cutting: setting off across the
    // map to rejoin half a stage later. The distance is measured to the NEAREST
    // piece of road anywhere on the lap, which is what makes the two cases
    // separable — a hairpin cut stays a few metres from the other branch no
    // matter how far it is from the branch you left, so it never registers,
    // while driving into the hinterland climbs away from everything.
    //
    // AN OPEN COURSE is exempt on purpose: out there the world is the point,
    // and the rim wall is what bounds it. That is PLAIN roam — a mission is a
    // road event with a clock and is not exempt, though `game.freeRoam` is true
    // throughout one. See the header on `openCourse` for the measurement.
    if (openCourse(this.game) || this !== this.game.player) this._strayed = 0;
    else if (this.speedAlong > 0.5) {
      // `lateral` is measured against the TRACKED index, and index tracking only
      // searches +/-30 samples around where the car was. Where the loop doubles
      // back on itself the tracker can stay locked to the far branch, so a car
      // sitting squarely on the road reads as 100+ u off it — and this rule then
      // scrubbed its speed to nothing and told the player to turn back. That is
      // the reported bug: stopped dead, on the road, "OFF THE COURSE".
      //
      // So a strayed reading is now only believed if a GLOBAL nearest-sample
      // search agrees. The search costs a full sweep, but it only ever runs on
      // the frames that already look off-course, which is nowhere on a clean lap.
      // The band was 45 u and it scrubbed hard enough to stop you. Both moved:
      // out to 70 u, so a wide cut across the inside of a switchback fits
      // inside it, and down to a drag you can drive against rather than a
      // brake — at full strength this now bleeds speed roughly as fast as
      // deep sand does, which is the right feel for "you have left the road
      // and the ground does not want you here".
      // TRUE DISTANCE, NOT THE NORMAL PROJECTION. `lateralOffset` projects
      // onto the sample's normal, so a car parked well past the END of a
      // straight projects to nearly zero and reads as ON the road — measured
      // on SUMMIT CLIMB, whose outermost road sample is at r = 262: a car at
      // r = 430 was taken for a car on the carriageway. The nearest sample is
      // a road sample, so its plain distance is the honest answer, and the
      // cheap first test can only ever over-estimate it, which is what makes
      // it safe to skip the sweep on.
      const ci = t.center[this.trackIndex];
      let strayed = Math.hypot(this.pos.x - ci.x, this.pos.z - ci.z) - 70;
      if (strayed > 0 && t.nearestIndex) {
        const gi = t.nearestIndex(this.pos);          // no hint: search the lap
        const c0 = t.center[gi];
        strayed = Math.hypot(this.pos.x - c0.x, this.pos.z - c0.z) - 70;
      }
      // PUBLISHED FOR THE CLIMB AUTHORITY, which runs at the top of the next
      // frame and cannot afford this global search a second time.
      this._strayed = strayed;
      if (strayed > 0) {
        // CORRIDOR §3.3 (r298): the deep-sand drag that lived here — a
        // 1.2/s velocity bleed on anything past 70 u — was an invisible
        // force wearing a physics costume, and it is exactly what the
        // refactor deletes ("no timers that slow the car, no caps, no
        // invisible forces"). Leaving the course is now priced by μ, slope
        // and drag like everywhere else; the LEAVING backstop becomes the
        // missed-gate return at build step 4, and lap integrity never
        // depended on this (the checkpoint mask refuses cut laps).
        // `_strayed` still publishes: the wedge net's 12 m line and the
        // goat closure below read it.
        // THE PEAK IS CLOSED ON RACE DAY. The goat route's shelves defeat
        // the climb-authority fade by design — each flat resets the throttle
        // — so in a road event a racer could stair-climb the spiral 46 u in
        // 30 s (measured, test-goat law 1). This drag only exists inside
        // this `strayed > 0` branch, and plain roam publishes _strayed = 0,
        // so the mountain stays fully climbable in the mode it was built
        // for and becomes a hill of treacle in a race.
        if (t._nearGoat?.(this.pos.x, this.pos.z, 26)) {
          this.vel.multiplyScalar(Math.max(0, 1 - 2.5 * dt));
        }
        // r301: the OFF THE COURSE feed is gone with the other scoldings —
        // §8's gate arrow (red past the grace) is the live signal now.
        // (History: a dangling `over` here once threw a swallowed
        // ReferenceError per strayed frame — test-shortcut caught it.)
      }
    }
    // NO ALTITUDE GATE.
    //
    // There used to be one here: off the course and more than 10 u above the
    // road scrubbed your velocity and flashed "OFF THE COURSE — TURN BACK". It
    // was added to stop the massif being climbed, and it did — but it also
    // walled off every legitimate line over a rise, which is not how driving
    // works. Real rally is full of cuts: across the inside of a hairpin, over
    // a bank, through a field. They cost you grip and they cost you time, and
    // that is the entire price.
    //
    // So the price is now the OFF-ROAD SLOWDOWN and nothing else: reduced grip
    // (offMult) and extra drag, both applied above. Take the cut, pay in speed,
    // and if it was quicker you earned it.
    //
    // The world still has an edge — see the rim check below — but "steep" and
    // "high" are no longer crimes on their own.
    if (offRoad && atRim && this.speedAlong > 0.5) {
      const AHEAD = 6;
      const ax = this.pos.x + Math.sin(this.heading) * AHEAD;
      const az = this.pos.z + Math.cos(this.heading) * AHEAD;
      let grade = (t.terrainHeight(ax, az) - gY) / AHEAD;
      // RIPPLE-PROOF, OUT WHERE MOUNTAINS LIVE. One sample 6 u ahead
      // flickers under MAX_GRADE on ridged steeps, and in those gaps the
      // engine (34 u/s²) out-pulls the slope term (16·grade) — measured:
      // 15-20 u of height banked on ~100% grades in roam, the traction
      // limit asleep half the time. Far off-road the LOCAL gradient
      // magnitude joins the vote, so a face is a face whatever the next
      // ripple says. Near the road (|lateral| ≤ 60) nothing changes: a
      // rejoin bank is crossed on momentum through a moment of scrub, and
      // test-goat's rejoin law pins that at 35% speed kept.
      if (this._wilds) {
        const E2 = 2.2;
        const ddx = (t.terrainHeight(this.pos.x + E2, this.pos.z)
          - t.terrainHeight(this.pos.x - E2, this.pos.z)) / (2 * E2);
        const ddz = (t.terrainHeight(this.pos.x, this.pos.z + E2)
          - t.terrainHeight(this.pos.x, this.pos.z - E2)) / (2 * E2);
        grade = Math.max(grade, Math.hypot(ddx, ddz));
      }
      if (grade > MAX_GRADE) {
        const over = Math.min(1, (grade - MAX_GRADE) / 0.55);
        // speedAlong is derived from vel, so scrub the velocity itself. Hard
        // enough that the last of it goes too — a wall you can crawl up at
        // 2 km/h is still a wall you get over.
        this.vel.multiplyScalar(Math.max(0, 1 - over * 4.5 * dt));
        if (over > 0.6 && this.speedAlong > 3) {
          this.vel.multiplyScalar(3 / this.speedAlong);
        }
        if (this === this.game.player && over > 0.5 && !this._steepFed) {
          this._steepFed = 1.5;
          this.game.hud?.feed?.('TOO STEEP', 'bad');
        }
      }
    }
    // THE CLIMB LIMIT IS NOT A BRAKE, AND IT IS NOT A GRADIENT GATE.
    //
    // A block stood here that scrubbed velocity wherever off-road ground ahead
    // graded over 0.40 outside a 14 u corridor. It was measured doing both
    // halves of its job wrong:
    //
    //   it did not stop the climb — GRANITE NARROWS was climbed 74.5 u in
    //   24 s at 19.3 u/s with "TOO STEEP" firing on 96-99% of the frames,
    //   because a multiplicative scrub of 3.5/s cannot hold against 36 u/s^2
    //   of thrust re-applied every frame;
    //
    //   and it re-shipped the reverted regression — arriving at 40 u/s up a
    //   60-120% bank between 12 and 30 u of the road, "TOO STEEP" fired on
    //   5 of 6 banks on SUMMIT CLIMB and 4 of 6 on FURKA RIDGE, which is
    //   exactly the rejoin corridor the revert was about, and 2 of 10 hairpin
    //   cuts on CAPE OLIVETO were scolded mid-corner.
    //
    // The climb limit now lives where a climb limit belongs: on the DRIVE
    // FORCE, at the throttle, gated on the off-course band rather than on the
    // gradient (see OFF_CLIMB and `climbAuth`), with the ground's own gravity
    // in the grade term above. Nothing here touches velocity, so nothing can
    // brake a player on a bank ever again.
    // FULLY SUBMERGED = SUNK. Measured at the ROOF, not the floor: a car
    // fording a stream is wet, a car whose roof is under the surface is gone.
    // `waterTopAt` deliberately excludes the river (2.6 u deep, forded on
    // purpose, and shallower than the car is tall), so this can only fire in
    // the sea or in a lake dug in the editor.
    if (this.alive && !this.airborne) {
      const wt = t.waterTopAt ? t.waterTopAt(this.pos.x, this.pos.z) : -Infinity;
      const roof = this.y + (this.mesh?.userData?.hullHeight ?? 2.4);
      if (wt > -Infinity && roof < wt) this.drown();
    }
    // YOU JUMP IT OR YOU DO NOT PASS. The chasm carve is a hole in the road,
    // but `groundHeightAt` follows it, so a car that came up short did not
    // fall — it drove the U, down and along and out the far side at unchanged
    // speed. r179 priced that at nine metres under the lip, and nine metres was
    // still a room to move about in: measured with the field slowed to 31 u/s,
    // twelve of fourteen dropped in and only ONE of them wrecked. The rest
    // bounced around inside the gorge, which is what was reported back as
    // "falling and bouncing".
    //
    // So the room to move about in is gone: three metres under the LOWER lip
    // and the run is over, against nine before. Three, and not zero, because
    // the footprint is a skewed diagonal across a carriageway whose surface is
    // removed square (see `jumpChasmAt`) — a car at the edge of the road can be
    // inside the footprint and still on tarmac, and wrecking those took out 11
    // of 14 rivals who had cleared the jump cleanly. Nothing can be three
    // metres under the landing lip and still be on a road.
    //
    // Airborne is deliberately spared, so a car that comes up short gets to
    // watch itself fall — the wreck lands with it rather than snapping off in
    // mid-air.
    if (this.alive && !this.airborne && t.jumpChasmAt) {
      const ch = t.jumpChasmAt(this.pos.x, this.pos.z, this.trackIndex);
      if (ch && this.y < ch.deckY - 3) this.intoChasm(ch.exit);
    }
    if (this._steepFed > 0) this._steepFed = Math.max(0, this._steepFed - dt);
    if ((this._noPickupT ?? 0) > 0) this._noPickupT -= dt;
    if (this.airborne) {
      this.vy -= 26 * dt;
      this.y += this.vy * dt;
      this._airT = (this._airT || 0) + dt;
      // light air drag reins in flight distance without killing the jump feel
      this.vel.multiplyScalar(Math.max(0, 1 - 0.10 * dt));
      if (this.y <= gY + 0.01) {
        this.y = gY;
        this._impactVy = this.vy;   // captured for onLand - the price of the drop
        this.vy = 0;
        this.airborne = false;
        this._landT = 0.30;   // PATCH_02 §3.5: 300 ms of touchdown discipline
        if (this === this.game.player) this.game.telemetry?.log('airborne', { enter: false, vertSpeed: +this._impactVy.toFixed(1) });
        this._lastGY = gY;
        // CLEAR THE CLIMB RATE. Landing used to leave it holding the launch
        // value (~11); the next grounded frame then measured its acceleration
        // against that stale number, got about −690, blew straight past the
        // crest threshold and launched again — every landing became the next
        // take-off. That is the "bouncing like a bunny", and enough repeats
        // could skip the car clean off the circuit.
        this._climbRate = 0;
        this._settleT = 0.35;   // and no relaunch until the suspension settles
        this.onLand();
      }
    } else if (offRoad) {
      // grounded on open terrain: ease onto the rolling hills, no ramp launches
      //
      // THE EASE IS PROPORTIONAL, AND THAT IS THE JUMP.
      //
      // `gY` is DISCONTINUOUS in `lateral`: inside SHELF_REACH the roadbed
      // holds the car up and outside it the raw terrain does, and on a shelf
      // road those are tens of units apart — measured 36.8 u on SUMMIT CLIMB,
      // 33.4 on FURKA RIDGE, 28.4 on GLACIER COL, 26.2 on COL DE TURINI, all
      // at 30 u off the centreline. Crossing that edge makes `gY - this.y` a
      // 31 u gap, and 12/s of 31 u is 6.2 u in ONE FRAME: 372 u/s, thirty-four
      // times the cap on a real launch, with `airborne` never set so no cap
      // applies at all. Reproduced on FURKA RIDGE sample 815 driving BACK
      // toward the road at lateral 15.9 (road 3.4 u over terrain -27.8 u):
      // +6.2, +5.0, +4.0, +3.2, +2.5 u on consecutive frames, 31 u in 0.4 s.
      // That is the standing "I jump straight up" report.
      //
      // `terrainHeight` has steps of its own for the same kind of reason —
      // sampled along a straight 40 u/s traverse it moves 1.10 u per frame at
      // p99 and 14.04 u at worst — so the bound belongs HERE, on the car's
      // response, where it covers every source at once.
      //
      // The law is the one the crest branch already states: nothing moves the
      // car vertically faster than a jump may throw it. Below about 0.9 u of
      // gap the proportional ease is already inside the cap, so ordinary
      // rolling ground drives exactly as before.
      const lift = VY_CAP * dt;
      // GROUND RISING FASTER THAN THE CAR CAN CLIMB IS A WALL, NOT A FLOOR.
      // The lift cap above stops teleport-jumps, but it also means a car
      // driven at a FACE-steep slope outruns its own y-follow and passes
      // horizontally INSIDE the terrain — measured on the goat dome's fall
      // line: 29 u buried at 26 u/s, the whole "driving inside the mountain"
      // class, on ground with no collider to say no. So when the gap has
      // opened AND the ground here is genuinely face-steep, the into-slope
      // velocity dies (tangential motion survives — you can turn along the
      // face, you cannot pass through it). A SHELF-EDGE discontinuity keeps
      // its old behaviour on purpose: the terrain beside a floating roadbed
      // is near-flat, so its local gradient never trips this, and the
      // capped ease still lifts a returning car onto the road it can see.
      // ...AND ONLY OUT WHERE MOUNTAINS LIVE. test-goat's header warns that
      // no law here may be a gradient test, because the steepest ground in
      // the game is the VERGE — and this law, applied there, braked the
      // rejoin scramble to 17% of speed kept (floor 35%, measured on its
      // banks at grades 0.64-1.06). A rejoin bank is a moment, 12-40 u off
      // the carriageway; a face you can pass inside of is a mountain,
      // hundreds out. Sixty units of lateral is the fence between them.
      const gap = gY - this.y;
      if (gap > 2.5 && this._wilds && t.terrainHeight) {
        const E = 2.2;
        const dhdx = (t.terrainHeight(this.pos.x + E, this.pos.z)
          - t.terrainHeight(this.pos.x - E, this.pos.z)) / (2 * E);
        const dhdz = (t.terrainHeight(this.pos.x, this.pos.z + E)
          - t.terrainHeight(this.pos.x, this.pos.z - E)) / (2 * E);
        const gm2 = Math.hypot(dhdx, dhdz);
        if (gm2 > 0.9) {
          const gx2 = dhdx / gm2, gz2 = dhdz / gm2;
          const vin = this.vel.x * gx2 + this.vel.z * gz2;
          if (vin > 0) { this.vel.x -= gx2 * vin; this.vel.z -= gz2 * vin; }
        }
      }
      this.y += THREE.MathUtils.clamp((gY - this.y) * Math.min(1, 12 * dt), -lift, lift);
      this._climbRate = 0;
      this._lastGY = this.y;
    } else {
      const drop = this._lastGY - gY;
      const newClimb = dt > 0 ? (gY - this._lastGY) / dt : 0;
      // Two ways to leave the ground, and the second is what makes a natural
      // crest jumpable.
      //
      // 1. A real lip — a big single-frame drop while climbing fast. Kept for
      //    any hard edge left in the world.
      // 2. Cresting a BROW, done the way it actually works: a car flies when
      //    the road curves away downward faster than gravity can hold it down.
      //    So the test is on the ground's vertical ACCELERATION, not on its
      //    slope. That matters — over a smooth hump the climb rate peaks
      //    mid-ascent and is ZERO at the crown, so any rule waiting for the
      //    ground to start dropping fires too late to ever launch anything.
      //    Being physical also speed-gates it for free: take the same crest
      //    slowly and the curvature you experience never beats gravity, so you
      //    simply roll over it.
      const climbAccel = dt > 0 ? (newClimb - this._climbRate) / dt : 0;
      //    The speed gate on top is a game-feel decision, not physics: a crest
      //    is something you JUMP by committing to it. Below ~26 u/s you ride
      //    over the brow instead of skipping off it, so ambling around never
      //    produces little uncommanded hops that steal your steering.
      // Thresholds well ABOVE the marginal case. Set at the physical minimum
      // (climb 1.5, accel just past gravity) the car also skipped off ordinary
      // rolling road undulations at speed — technically correct, but it read
      // as a permanently jumpy car, and every hop costs steering. A real crest
      // produces climb ≈ 12 and accel ≈ −55, so it clears these easily while
      // the everyday lumps in the elevation profile do not.
      this._settleT = Math.max(0, (this._settleT ?? 0) - dt);
      const crested = this._climbRate > 4.5 && climbAccel < -42
        && Math.abs(this.speedAlong) > 26;
      // THE SETTLE GUARD COVERS BOTH LAUNCH PATHS. It used to sit inside
      // `crested` only, so the lip test could relaunch on the very frame after
      // a landing — and a landing is exactly when `drop` reads large, because
      // the car has just been placed on ground it was flying over. Jumps
      // chained into each other for as long as the terrain kept falling.
      const wantsAir = (drop > 0.9 && this._climbRate > 2.5) || crested;
      // YOU CANNOT LEAVE GROUND THAT IS RISING FASTER THAN YOU ARE.
      //
      // The launch speed is capped at VY_CAP for a good reason — uncapped, a
      // steep ramp at nitro speed threw cars 100+ u into the infield. But the
      // cap was applied without asking whether the capped launch still made
      // sense. Where the ground climbs at 29 u/s, leaving it at 11 is not a
      // jump: the road is still coming up under the car, and it re-grounds
      // within a frame or two. Measured, that was the last source of
      // three-frame hops, and both remaining ones on OUNINPOHJA were the same
      // spot on the lap hit twice, launching at exactly the cap.
      //
      // Cresting means the climb rate is already falling (climbAccel < 0), so
      // waiting costs nothing: a frame or two later it drops under the cap and
      // the car leaves properly, at a speed it can actually hold.
      const coherent = this._climbRate <= VY_CAP;
      if (wantsAir && coherent && this._settleT <= 0 && this._clearsGround(t, dt)) {
        this.airborne = true;
        this.vy = Math.min(this._climbRate, VY_CAP);
        this.y += this.vy * dt;
      } else {
        this._climbRate = dt > 0 ? (gY - this._lastGY) / dt : 0;
        this.y = gY;
        this._lastGY = gY;
      }
    }
    this.pos.y = this.y;

    // ---- body attitude on the ground ------------------------------------
    //
    // THE BUG THIS FIXES: pitch used to come only from the CLIMB RATE, and a
    // climb rate is zero when you are not moving. Park on a 20% slope and the
    // car stood bolt upright; creep up a hairpin and it stayed flat until it
    // was quick enough to clear the 0.4 threshold. Reported as "car is not
    // following the inclination", and it was exactly that.
    //
    // The ground's SPATIAL gradient does not care how fast you are going, so
    // that is what attitude is taken from now. The climb-rate term stays, but
    // only for what it was always right for: the airborne arc of a jump.
    //
    // Sampled from the SAME height source the car's own y comes from, a
    // segment either side, so the road and the body cannot disagree.
    let slopePitch = 0;
    let slopeRoll = 0;
    if (!this.airborne && !offRoad && t.groundHeightAt) {
      const i = this.trackIndex;
      const n = t.center ? t.center.length : 0;
      const wrap = (k) => (n ? ((k % n) + n) % n : k);
      const span = t.segLen > 0 ? t.segLen * 2 : 4.8;
      const gAhead = t.groundHeightAt(wrap(i + 1), this.lateral);
      const gBehind = t.groundHeightAt(wrap(i - 1), this.lateral);
      // Along-road gradient. Nose UP on a climb: the mesh applies
      // `pitch - jumpPitch` with +x pitching the nose down, so a positive
      // gradient has to come through as a positive jumpPitch.
      slopePitch = THREE.MathUtils.clamp(((gAhead - gBehind) / span) * 0.8, -0.4, 0.4);

      // Cross-slope, for camber. Half a car width either side of where the
      // wheels actually are.
      const w = 1.6;
      const gL = t.groundHeightAt(i, this.lateral - w);
      const gR = t.groundHeightAt(i, this.lateral + w);
      slopeRoll = THREE.MathUtils.clamp(((gR - gL) / (2 * w)) * 0.7, -0.22, 0.22);
    } else if (!this.airborne && offRoad && t.terrainHeight) {
      const hx = Math.sin(this.heading);
      const hz = Math.cos(this.heading);
      const d = 2.4;
      const gA = t.terrainHeight(this.pos.x + hx * d, this.pos.z + hz * d);
      const gB = t.terrainHeight(this.pos.x - hx * d, this.pos.z - hz * d);
      slopePitch = THREE.MathUtils.clamp(((gA - gB) / (2 * d)) * 0.8, -0.4, 0.4);
      const rx = hz;
      const rz = -hx;
      const gR2 = t.terrainHeight(this.pos.x + rx * 1.6, this.pos.z + rz * 1.6);
      const gL2 = t.terrainHeight(this.pos.x - rx * 1.6, this.pos.z - rz * 1.6);
      slopeRoll = THREE.MathUtils.clamp(((gR2 - gL2) / 3.2) * 0.7, -0.22, 0.22);
    }
    this.groundRoll = this.groundRoll ?? 0;
    this.groundRoll += (slopeRoll - this.groundRoll) * Math.min(1, 7 * dt);

    // Airborne pitch still tracks vy: in the air there is no ground to read,
    // and the arc IS the climb rate.
    this._climbSm += ((this.airborne ? this.vy : this._climbRate) - this._climbSm) * Math.min(1, 6 * dt);
    const airPitch = this.airborne
      ? THREE.MathUtils.clamp(this.vy * 0.06, -0.35, 0.35)
      : slopePitch;
    this.jumpPitch += (airPitch - this.jumpPitch) * Math.min(1, 8 * dt);

    if (this.fireCooldown > 0) this.fireCooldown -= dt;
    if (this.invuln > 0) this.invuln -= dt;
    if (this._cliffHurt > 0) this._cliffHurt -= dt;
    this.syncMesh(dt, vl, inputs);
  }

  /* Would leaving the ground here actually produce a flight?
   *
   * The crest test upstream is a local one: it reads the ground's vertical
   * acceleration under the wheels RIGHT NOW. That is the correct trigger — a
   * car flies when the road curves away faster than gravity holds it down —
   * but it is blind to what happens next. Over a short sharp lump the road
   * curves hard for a moment and then flattens or climbs again, which passes
   * the local test and then puts the ground straight back under the car.
   *
   * The result was measurable and it was most of the problem: 28-43 launches
   * per 90 s stage, of which a third lasted three frames or less. You could
   * not see those. You could only feel them, because EVERY landing bought
   * 0.4 s of half grip (see onLand) — so the car spent about a quarter of the
   * stage skating, for no reason the player could observe.
   *
   * So the trigger now has to survive a prediction. Throw the car forward
   * ballistically and ask whether the road has genuinely dropped out from
   * under it by the time it gets there. A real crest clears easily. A lump
   * does not, and the car simply rolls over it — which is what it always
   * should have done.
   */
  _clearsGround(t, dt) {
    if (!t?.groundHeightAt || !t.center?.length) return true;  // unknown: don't block
    const vy0 = Math.min(this._climbRate, VY_CAP);
    const LOOK = 0.18;          // ~11 frames: long enough that a lump has ended
    const CLEAR = 0.35;         // u of daylight that makes it a jump, not a jolt
    const n = t.center.length;
    const seg = t.segLen > 0 ? t.segLen : 2.4;
    // Where the car is heading, in road samples. `speedAlong` is u/s and a
    // sample is `seg` u, so this is just distance over sample length.
    // Walk the arc rather than sampling only its end: the road can dip at the
    // horizon while a lump sits between here and there, and the car lands on
    // the lump. The flight has to clear everything it passes over.
    //
    // Sampled BETWEEN indices, for the same reason the caller does. Rounding
    // to the nearest sample here would reintroduce the staircase inside the
    // predictor — measured, that rejected genuine jumps, because a probe
    // point could round onto a step the car never actually reaches.
    const rate = Math.abs(this.speedAlong) / seg;   // samples per second
    const STEPS = 8;
    // Deliberately the INTEGER index, despite `t.fracIndexAt` being available.
    //
    // Starting from the car's true fractional position is the more principled
    // choice and I tried it: it removed the last micro-hop on FURKA RIDGE and
    // cost ROCKFALL RAVINE every jump it had (5 -> 0) and FURKA more than half
    // of its own (12 -> 5). `trackIndex` is the NEAREST sample, so the true
    // position sits either side of it; sampling behind the car on an ascent
    // reads high ground and rejects launches that were real. One harmless
    // stutter is worth less than a ravine stage with no jumps in it, so the
    // nearest sample stays.
    const here = this.trackIndex;
    const at = t.groundHeightAtFrac
      ? (idx) => t.groundHeightAtFrac(idx, this.lateral)
      : (idx) => t.groundHeightAt(((Math.round(idx) % n) + n) % n, this.lateral);
    for (let s = 1; s <= STEPS; s++) {
      const T = (LOOK * s) / STEPS;
      // y(T) under the same gravity the airborne branch integrates with.
      const arc = this.y + vy0 * T - 0.5 * 26 * T * T;
      // Anywhere along the way it must still be flying; at the far end it must
      // be flying by a margin worth calling a jump.
      if (arc - at(here + rate * T) < (s === STEPS ? CLEAR : 0)) return false;
    }
    return true;
  }

  onLand() {
    // A CLIFF IS NOT A JUMP. Landing used to cost nothing whatever the drop -
    // sail off a forty-metre wall and the car touched down and simply drove
    // on, reported as "if I fall off a cliff... it's doing nothing". Impact
    // speed prices the landing.
    //
    // THAT PRICE WAS TOO STEEP AND HAD NO ANSWER. At a free ceiling of 19 and
    // 8 hull per unit past it, a 30 u/s touchdown took 88 of a stock 100-point
    // hull — so a big air off anything larger than a designed ramp was a wreck,
    // reported as exactly that, and no purchase anywhere in the garage changed
    // it. The base is gentler now (free to 22, 6.5 a unit past), and
    // LONG-TRAVEL DAMPERS move both numbers: +2.6 u of free landing per level
    // and -10% on the rest, so at level 5 a landing is free to 35 u/s and the
    // overflow costs 3.25. A genuine cliff still writes the car off at any
    // level; what changes is where "cliff" starts.
    const dl = this.damperLvl || 0;
    const free = 22 + 2.6 * dl;
    const perUnit = 6.5 * (1 - 0.10 * dl);
    const impact = Math.abs(this._impactVy || 0);
    this._impactVy = 0;
    if (impact > free && this.alive) {
      if (this === this.game.player) {
        this.game.hud?.feed?.(impact > free + 11 ? 'CLIFF FALL' : 'HARD LANDING', 'bad');
        this.game.shake = Math.min(1, (this.game.shake || 0) + 0.55);
      }
      this.game.particles?.debris?.(this.pos, impact > free + 11 ? 4 : 2);
      this.damage((impact - free) * perUnit, null);
      if (!this.alive) return;    // wrecked on touchdown: skip the style pay
    }
    // hang time pays style: a real jump (not a curb hop) scores BIG AIR
    if (this === this.game.player && (this._airT || 0) > 0.7) {
      this.game.style?.(40, 'BIG AIR');
    }
    // LOOSE GRIP IS PRICED BY THE JUMP, not handed out flat. At a flat 0.4 s
    // every hop cost the same as a flying finish, and with a hop every two or
    // three seconds that added up to a car that would not turn. Now a short
    // hop barely registers and only real air makes you slide on touchdown.
    const air = this._airT || 0;
    this.landGrip = air < 0.15 ? 0 : Math.min(0.4, (air - 0.15) * 0.8);
    this._airT = 0;
    if (Math.abs(this.speedAlong) > 12) {
      const side = new THREE.Vector3(this.forward.z, 0, -this.forward.x);
      for (const s of [-1, 1]) {
        const wp = this.pos.clone().addScaledVector(side, s * 1.2);
        this.game.particles.driftSmoke(wp);
        this.game.particles.driftSmoke(wp);
      }
      if (this === this.game.player) this.game.shake = Math.min(1, this.game.shake + 0.22);
    }
  }

  syncMesh(dt, vl = 0, inputs = null) {
    this.mesh.position.copy(this.pos);
    if (dt > 0) {
      // visual slip angle: the body yaws past the velocity direction while sliding
      const yawT = THREE.MathUtils.clamp(-vl * 0.02, -0.35, 0.35);
      this.visYaw += (yawT - this.visYaw) * Math.min(1, 9 * dt);
      const steerT = inputs ? inputs.steer : 0;
      this.steerVis += (steerT - this.steerVis) * Math.min(1, 10 * dt);
    }
    this.mesh.rotation.set(0, this.heading + this.visYaw, 0);
    // body lean ('YXZ' order: +x pitches the nose down, so climb is subtracted)
    // Cornering lean PLUS the camber of the ground underneath, so a car parked
    // across a slope leans with it instead of sitting level on a hillside.
    const roll = THREE.MathUtils.clamp(-vl * 0.02, -0.18, 0.18) + (this.groundRoll ?? 0);
    const pitch = THREE.MathUtils.clamp(-this.speedAlong * 0.0012, -0.05, 0.05);
    this.mesh.rotation.z = roll;
    this.mesh.rotation.x = pitch - this.jumpPitch;
    // spin wheels + steer the front pair
    if (dt > 0 && this.mesh.userData.wheels) {
      const spin = this.speedAlong * dt / 0.78;
      for (const w of this.mesh.userData.wheels) w.rotation.x += spin;
    }
    if (this.mesh.userData.frontWheels) {
      const sa = this.steerVis * 0.42;
      for (const w of this.mesh.userData.frontWheels) w.rotation.y = sa;
    }
    // INVULNERABILITY — ADD LIGHT, NEVER REMOVE THE CAR.
    //
    // Two goes at this now. It began as a 14 Hz toggle of mesh.visible, which
    // hid the car outright on alternate ticks and, sampled at frame rate,
    // could alias into being hidden every frame. Replacing that with a
    // translucent pulse fixed the aliasing and introduced a subtler version of
    // the same bug: the pulse bottoms out at 21% opacity, and a car at 21%
    // over a snowfield is not a faint car, it is no car at all — which is
    // exactly what a shield orb on an ice world looked like.
    //
    // So invulnerability no longer touches how much of the car you can see.
    // The body stays fully opaque and the state is shown by ADDING something:
    // a shield bubble around it. Adding can only ever make the car easier to
    // pick out, on snow or on lava.
    this.mesh.visible = this.alive;
    this._setShield(this.alive && this.invuln > 0 ? this.invuln : 0);
  }

  /** Show/hide the invulnerability bubble. `t` is the remaining invuln time,
   *  0 for none. Built on first use — most cars never take a hit. */
  _setShield(t) {
    if (!t) {
      if (this._shield) this._shield.visible = false;
      return;
    }
    if (!this._shield) {
      const geo = new THREE.SphereGeometry(2.6, 14, 10);
      const mat = new THREE.MeshBasicMaterial({
        color: 0x62e8ff, transparent: true, opacity: 0.34,
        blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
      });
      this._shield = new THREE.Mesh(geo, mat);
      this._shield.position.y = 0.9;
      this._shield.renderOrder = 2;
      this.mesh.add(this._shield);
    }
    this._shield.visible = true;
    // breathe, and flare as it runs out so you can time the last second
    const pulse = 0.5 + 0.5 * Math.sin(t * 9);
    this._shield.material.opacity = 0.20 + 0.22 * pulse;
    const s = 1 + 0.06 * pulse;
    this._shield.scale.set(s, s * 0.82, s);
  }

  /** Lerp the body paint toward charcoal as health drops (up to 55% at zero health). */
  _applyScorch(frac) {
    const ud = this.mesh.userData;
    if (!ud.bodyMat || !ud.baseBodyColor) return;
    const t = THREE.MathUtils.clamp(1 - frac, 0, 1) * 0.55;
    ud.bodyMat.color.copy(ud.baseBodyColor).lerp(SCORCH, t);
  }

  onWallHit(normal, impact) {
    const g = this.game;
    this._wallTouchT = 0.3;   // PATCH_02 §3.6: the escape torque's licence
    if (impact > 3) {
      g.particles.sparks(this.pos, normal, Math.min(20, 4 + impact));
      if (this === g.player) g.audio.scrape();
    }
    if (impact > 6) {
      // hard hits shatter fence planks — theme-tinted splinters + white pop
      const cols = g.track?.theme?.splinter ?? [0xc23b2a, 0xe8e2d4];
      g.particles.splinters(this.pos, normal, cols, THREE.MathUtils.clamp((impact - 6) / 12, 0, 1));
    }
    // slamming the fence hurts the hull; glancing scrapes stay free
    if (impact > 8) {
      const dmg = Math.min(24, (impact - 8) * 0.9);
      this.damage(dmg, null);
      if (this === g.player && dmg >= 5) g.hud?.feed(`WALL SLAM −${Math.round(dmg)} HULL`, 'bad');
    }
    if (this === g.player && impact > 12) {
      g.shake = Math.min(1, g.shake + 0.15 + impact * 0.015);
      g.buzz(30);
    }
  }

  damage(amount, attacker = null, raw = false) {
    if (!this.alive || this.invuln > 0) return false;
    // survivability: the player's hull takes reduced damage below HARD —
    // crashes still cost (feeds/parts/drama fire off the same events), but
    // a couple of mistakes shouldn't end the race.
    //
    // `raw` (PATCH_02 §3.2): world-contact damage arrives PRE-BUDGETED — the
    // linear law, the glance forgiveness, the 45/hit and 60/s caps ARE the
    // survivability design for scenery, and the patch's worked figures
    // (20 hull for a 100 km/h head-on, 45 cap, hard) are what the player
    // must actually see. Scaling them again — by difficulty OR by the car's
    // plating (measured 1.02 on the stock ride, which pushed the 45 cap to
    // 45.9) — made every acceptance number a fiction. Combat damage keeps
    // both multipliers; scenery is the same rock for everyone.
    if (this === this.game.player && !raw) {
      const id = this.game.difficulty?.id;
      amount *= id === 'easy' ? 0.45 : id === 'hard' ? 0.85 : 0.62;
      amount *= this.plating ?? 1; // hull plating is a car property
    }
    this._lastHurt = this.game.raceTime;
    const before = this.health / this.maxHealth;
    this.health -= amount;
    if (amount >= 15) this.game.particles.debris(this.pos, 2 + (Math.random() < 0.5 ? 1 : 0));
    // crossing a damage threshold knocks a visible part off the car
    const after = Math.max(0, this.health) / this.maxHealth;
    for (const th of [0.66, 0.33]) {
      if (before > th && after <= th) this.game.popCarPart?.(this);
    }
    if (this.health <= 0) {
      this.health = 0;
      this.destroy(attacker);
      return true;
    }
    return false;
  }

  destroy() {
    this.game.spawnHusk?.(this); // leave a charred shell where it died
    this.alive = false;
    this.mesh.visible = false;
    this.respawnTimer = this.respawnDelay ?? 5;
    this.game.particles.explosion(this.pos, true);
    this.game.audio.explosion(true);
    this.game.flashLight(this.pos);
  }

  /** GOING UNDER IS A WRECK. Deep water used to be free driving: the seabed is
   *  ground and ground is drivable, so a car that went off a corniche simply
   *  carried on along the bottom of the bay with the waves over its roof.
   *
   *  Not routed through destroy(), because a car does not detonate underwater
   *  — no fireball, no flash, no husk left floating on the surface. It is the
   *  same outcome (dead, respawn on the timer) presented as what it is. */
  drown() {
    if (!this.alive) return;
    // CLAUDE.md §3.3 (r306): in a race, deep water is a KILL VOLUME —
    // returnToGate(lastPassed), free, no hull. CANYON RUN's gorge floors
    // sit below the water line, so a short jump drowned the car and cost
    // a hull, over and over ("clean this up" traced here). The full
    // run-up from the previous gate is the point: a return just before
    // the lip at 40 km/h could never make the jump and would loop.
    // Roam, missions and rivals keep the honest sinking.
    if (this._returnFromKill()) {
      this.game.particles?.splash?.(this.pos, 2.2);
      this.game.audio?.splash?.();
      return;
    }
    this.health = 0;
    this.alive = false;
    this.mesh.visible = false;
    this.respawnTimer = this.respawnDelay ?? 5;
    this.game.particles?.splash?.(this.pos, 2.2);
    this.game.audio?.splash?.();
    // ...and it costs a hull like any other wreck. It did not, because the
    // "presented as what it is" split above skipped `onPlayerDestroyed` along
    // with the fireball — which was invisible while `deaths` only docked score,
    // and is a hole in the three-hull rule the moment that rule exists: a coast
    // road you can drive off the edge of, over and over, for free.
    if (this === this.game.player) {
      this.game.hud?.feed?.('SUNK', 'bad');
      this.game.onPlayerDestroyed?.(null);
    }
  }

  /** DOWN THE GORGE. The same wreck as drowning, and for the same reason —
   *  the car is somewhere the race does not continue from — but it must also
   *  say WHERE to come back, because `respawn` puts a car down at its own
   *  `trackIndex` and that index is in mid-air over the chasm. Without the
   *  hand-off the car respawns in the hole, falls again on the next frame, and
   *  burns all three hulls in under a second. */
  /** §3.3 kill volumes, the shared half: a racing player is RETURNED to
   *  the gate they last passed instead of wrecked. True if handled. */
  _returnFromKill() {
    const g = this.game;
    if (this !== g.player || g.state !== 'race' || g.freeRoam || g.missionMode) return false;
    const gates = g.route?.gates;
    if (!gates?.length || !g.returnToGate) return false;
    const last = ((this._nextGate ?? 0) - 1 + gates.length) % gates.length;
    g.returnToGate(this, last, 'kill');
    return true;
  }

  intoChasm(exitIndex) {
    if (!this.alive) return;
    if (this._returnFromKill()) {
      this.game.particles?.explosion?.(this.pos, true);
      return;
    }
    if (exitIndex != null) this.trackIndex = exitIndex;
    this.health = 0;
    this.alive = false;
    this.mesh.visible = false;
    this.respawnTimer = this.respawnDelay ?? 5;
    this.game.particles?.explosion?.(this.pos, true);
    this.game.audio?.explosion?.(true);
    if (this === this.game.player) {
      this.game.hud?.feed?.('INTO THE GORGE', 'bad');
      this.game.onPlayerDestroyed?.(null);
    }
  }

  respawn() {
    this.alive = true;
    this.health = this.maxHealth;
    this.invuln = 3.0;
    this._tintFrac = 1;
    this.game.restoreCarParts?.(this);
    this._applyScorch(1); // fresh paint job with the fresh hull
    this.placeAt(this.trackIndex, THREE.MathUtils.clamp(this.lateral, -6, 6), true);
  }

  /** Lap bookkeeping — call with previous index before this frame's update.
   *  With no fences the infield is drivable, so a lap only counts if the car
   *  passed the far-side checkpoint (mid-track) since the last line crossing —
   *  cutting straight across the map earns nothing. */
  checkLap(prevIndex) {
    const n = this.game.track.N;
    // FOUR GATES, IN ORDER, AND YOU CANNOT SKIP ONE.
    //
    // There was exactly ONE checkpoint, at mid-lap, so a lap was legal if you
    // touched anywhere between 40% and 60% of the distance. On a circuit that
    // doubles back — and most of this roster does — that is reachable by
    // cutting across the infield from near the line and back, which is a lap
    // the driver never drove. Asked for directly: "add checkpoints that I
    // can't skip."
    //
    // Four gates at the quarter points, armed STRICTLY IN ORDER: gate k only
    // arms if gate k-1 is already down. Order is what makes them unskippable —
    // a bare set of flags can be collected by wandering, a sequence cannot,
    // because reaching gate 3 without gate 2 leaves gate 3 shut no matter how
    // many times you drive over it.
    const f = this.trackIndex / n;
    for (let k = 0; k < LAP_GATES.length; k++) {
      const a = LAP_GATES[k];
      if (f < a || f > a + 0.14) continue;
      if (k === 0 || (this._cpMask & (1 << (k - 1)))) {
        this._cpMask |= 1 << k;
        if (k === 0) this._everCP1 = true;   // PATCH_02 §3.8: arms the line
      }
    }
    if (this.trackIndex > n * 0.4 && this.trackIndex < n * 0.6) this._midCP = true;
    if (prevIndex > n * 0.85 && this.trackIndex < n * 0.15) {
      this._wraps++;                           // distance always counts...
      const ALL = (1 << LAP_GATES.length) - 1;
      // ...but a cut earns no lap. `_missedCP` is left for the HUD to read, so
      // the driver is told WHY the lap did not count instead of watching the
      // counter silently refuse to move.
      if (this._midCP === false || (this._cpMask & ALL) !== ALL) {
        // PATCH_02 §3.8: the grid sits BEHIND the line, so the first crossing
        // 3 s after GO always evaluated as a cut lap and shouted CHECKPOINT
        // MISSED at a player who missed nothing. The line is inert until
        // checkpoint 1 has been passed at least once.
        if (this._everCP1) this._missedCP = true;
        if (this === this.game.player) this.game.telemetry?.log('lapTrigger',
          { checkpointsPassed: [0,1,2,3].filter(k => this._cpMask & (1 << k)).length, counted: false });
        this._cpMask = 0;
        this._midCP = false;
        return false;
      }
      this._cpMask = 0;
      this._midCP = false;
      this.lap++;
      return true;
    }
    if (prevIndex < n * 0.15 && this.trackIndex > n * 0.85) { // backwards over the line
      this._wraps--;
      this.lap--;
    }
    return false;
  }

  /** Headlights on iff the world is dark — checked against the TRACK OBJECT,
   *  so it is right the first frame after a level swap and free every frame
   *  after that.
   *
   *  ON `Car`, NOT ON `EnemyCar`. It was written on the rival subclass while
   *  its own comment already said both the player and the rivals come through
   *  it — and `PlayerCar.update` calls it on its FIRST line. So on every level
   *  the player's update threw `_syncLights is not a function` and its whole
   *  body was skipped. The frame loop catches and recovers, which is exactly
   *  why nothing looked broken and `boot.mjs` stayed green: no crash, no
   *  stack, just a car that never moved and a chase camera parked at the world
   *  origin. Anything both subclasses call belongs on the base class.
   */
  _syncLights() {
    // NO CACHE. This used to remember the track it had decided for and return
    // early on every frame after, which made the decision stick to a car that
    // had since been given a different MESH — and a freshly built rig has its
    // lamps OFF. `swapPlayerCar` knew to clear the flag by hand; nothing else
    // did, and nothing added later would. The cache was guarding one boolean
    // write per car per frame, eight on a full grid. It bought nothing and the
    // only thing it could cost you was your headlights.
    const lt = this.mesh?.userData?.carLights;
    if (lt) lt.visible = worldIsDark(this.game?.track?.T);
  }
}

// ---------- AI racing brain ----------
// Precomputed racing line: one lateral offset per centerline sample, following
// an outside-apex-outside path through corners, heavily smoothed. Cached once
// per track object (track._raceLine).
const APEX_LAT = 5.5;    // how far inside the apex sits
const ENTRY_LAT = 4.5;   // how far outside the entry/exit swing goes
const CORNER_CURV = 0.013; // curvature above this counts as a real corner

function computeRaceLine(track) {
  const n = track.N;
  const raw = new Float32Array(n);
  // corners: hug the inside. dir > 0 = left turn (heading increasing).
  for (let i = 0; i < n; i++) {
    if (track.curvature[i] < CORNER_CURV) continue;
    const a = track.tan[(i - 8 + n) % n], b = track.tan[(i + 8) % n];
    const dir = a.z * b.x - a.x * b.z; // (a x b).y — sin of the heading change
    raw[i] = Math.sign(dir) * APEX_LAT; // +lateral = left = inside of a left turn
  }
  // entry/exit: ~25 samples on both sides of a corner swing to the outside
  const line = Float32Array.from(raw);
  for (let i = 0; i < n; i++) {
    if (raw[i] !== 0) continue;
    for (let k = 1; k <= 25; k++) {
      const near = raw[(i + k) % n] || raw[(i - k + n) % n];
      if (near !== 0) { line[i] = -Math.sign(near) * ENTRY_LAT; break; }
    }
  }
  // heavy smoothing: circular moving average, window ~31, three passes
  // SMOOTHING USED TO ERASE THE LINE IT WAS SMOOTHING.
  //
  // Three passes of a window-31 moving average is an effective sigma of about
  // 15 samples, applied to corner features 20-40 samples wide whose entry and
  // apex lobes carry OPPOSITE signs — so they cancelled. Intent is an apex
  // offset of 5.5; measured at apexes it was 1.09 m on PINE VALLEY, a fifth of
  // what was asked for, and rivals drove a wobbly centreline. Two passes of
  // window-13 keeps the line continuous without flattening it: apex offset
  // measured back up to 4.6 m.
  let cur = line;
  for (let pass = 0; pass < 2; pass++) {
    const next = new Float32Array(n);
    const W = 6;
    let sum = 0;
    for (let k = -W; k <= W; k++) sum += cur[(k + n) % n];
    for (let i = 0; i < n; i++) {
      next[i] = sum / (2 * W + 1);
      sum += cur[(i + W + 1) % n] - cur[(i - W + n) % n];
    }
    cur = next;
  }
  return cur;
}

/** 1/sqrt(curvature) per sample — corner speed is sqrt(aLat) * this. Cached per track.
 *
 *  MEASURED ALONG THE RACE LINE, NOT THE CENTRELINE. This read
 *  `track.curvature`, the centreline's own curvature, and the braking loop
 *  never consulted `track._raceLine` at all — so a rival taking a perfect
 *  wide-in / apex / exit line was still slowed to the radius of the centre of
 *  the road. That made the entire racing-line system decorative: rebuilding
 *  the line to hit its intended apex bought +1.6% of pace and left apex SPEED
 *  unchanged to three figures, because the speed model could not see it.
 *
 *  Straightening a corner is the entire point of a racing line, and the payoff
 *  is exactly this: a wider effective radius, so a higher `sqrt(aLat/kappa)`.
 */
function computeSpeedInv(track, raceLine) {
  const n = track.N;
  const inv = new Float32Array(n);
  if (!raceLine || !track.pointAt) {
    for (let i = 0; i < n; i++) inv[i] = 1 / Math.sqrt(Math.max(track.curvature[i], 1e-4));
    return inv;
  }
  // Three-point curvature of the path the car actually drives. Menger's
  // formula: kappa = 4 * area / (|ab| |bc| |ca|).
  const pt = (i) => track.pointAt(((i % n) + n) % n, raceLine[((i % n) + n) % n]);
  for (let i = 0; i < n; i++) {
    const a = pt(i - 3), b = pt(i), c = pt(i + 3);
    const abx = b.x - a.x, abz = b.z - a.z;
    const bcx = c.x - b.x, bcz = c.z - b.z;
    const cax = a.x - c.x, caz = a.z - c.z;
    const ab = Math.hypot(abx, abz), bc = Math.hypot(bcx, bcz), ca = Math.hypot(cax, caz);
    const area2 = Math.abs(abx * bcz - abz * bcx);          // 2 x triangle area
    const denom = ab * bc * ca;
    const kappa = denom > 1e-6 ? (2 * area2) / denom : 1e-4;
    inv[i] = 1 / Math.sqrt(Math.max(kappa, 1e-4));
  }
  return inv;
}

const DEFAULT_DIFFICULTY = { aiSpeed: 1, aiCorner: 1, aiAggression: 1, rubberBand: 1 };

// ---------- AI rival ----------
// The Voxel Racers collection — rival lineup
const AI_COLORS = [
  { name: 'CROWN', style: 'crown', body: 0x2440b8, accent: 0x1a2c8a, stripe: [0xf2f0e8, 0xd8342a], number: 77, brand: 'VOLT' },
  { name: 'SLEEK', style: 'sleek', body: 0xf2c81e, accent: 0xe8b83a, number: 3, brand: 'ECO-PWR' },
  { name: 'DUNE', style: 'dune', body: 0xdce8f0, accent: 0x4a9ad8, stripe: [0x4a9ad8], number: 12, brand: 'RAIDER' },
  { name: 'ALPINE', style: 'alpine', body: 0xf2f0e8, accent: 0xe8e2d4, stripe: [0x2f9e44, 0xd8342a], number: 4, brand: 'GEARHD' },
  { name: 'PIT-99', style: 'pit', body: 0x1c1a18, accent: 0x2a2724, stripe: [0xe8b83a], number: 99, brand: 'SCORP' },
  // EIGHT ON THE GRID NEEDS SEVEN RIVALS. At five entries the roster wrapped
  // — `slot % AI_COLORS.length` put a second CROWN and a second SLEEK on the
  // line, identical in name, number and paint, which is exactly the thing a
  // race result screen must never contain. These two take the last unused
  // body styles in the catalogue, so no rival is a repaint of another.
  { name: 'FLATSIX', style: 'flatsix', body: 0xc4342a, accent: 0x2a2d33, stripe: [0xf2f0e8], number: 23, brand: 'ZENITH' },
  { name: 'BASTION', style: 'bastion', body: 0x1f6a4a, accent: 0xc8ccd2, stripe: [0xc8ccd2], number: 46, brand: 'ZENITH' },
];

export class EnemyCar extends Car {
  constructor(game, slot, fieldSize = 5) {
    const spec = AI_COLORS[slot % AI_COLORS.length];
    // THE SPREAD IS A FRACTION OF THE FIELD, NOT A MULTIPLE OF THE SLOT.
    // It used to be `53 + slot * 1.1`, tuned when there were five rivals. Add
    // two more and the same expression walks the quickest car up to 61 — a
    // silent difficulty increase riding along with a grid-size change, and
    // one that would have put the top rival above every car in the showroom.
    // Normalising on the field keeps the band exactly where it was measured
    // whatever the grid holds.
    const f = fieldSize > 1 ? slot / (fieldSize - 1) : 0;
    super(game, buildCarMesh(spec), {
      maxSpeed: 53 + f * 4.4 + Math.random() * 1.4, // ~53..58.8 across the grid (player: 56..63)
      // ~34.5..39.2 — deliberately INSIDE the garage's range (player cars are
      // 36..40). The old 36..43 spread put the two quickest rivals above every
      // car you can buy, and they out-dragged the starter BRAWLER off the line
      // by 0.27s to 40 u/s (18%) — the grid must never beat the showroom.
      accel: 34.5 + f * 3.4 + Math.random() * 1.3,
      grip: 5.8,
      steerRate: 3.0,
      driftLag: 0.12, // planted enough to hold the racing line
    });
    this.spec = spec;
    this.name = spec.name;
    this.maxHealth = this.health = 70;
    this.respawnDelay = 5;
    this.baseMaxSpeed = this.maxSpeed;   // difficulty/rubber-band scale on top of this
    this.cornerSkill = Math.random();    // 0..1 — how hard this driver leans on the tires
    this.lane = THREE.MathUtils.randFloatSpread(2.5); // small personal offset off the ideal line
    this.laneTimer = 3 + Math.random() * 4;

    this.aggression = 0.7 + Math.random() * 0.7; // angry grid: ~40% above the old 0.5..1.0
    this.mineCooldown = 4 + Math.random() * 5;  // stagger the first drops
    this.boostCooldown = 4 + Math.random() * 6; // stagger the first bursts
    this.ramCooldown = 6 + Math.random() * 4;   // deliberate side-slam timer (stagger + skip the start scrum)
    this.ramTimer = 0;                          // >0: actively steering into the player
    this.missileCd = 6 + Math.random() * 6;     // rocket timer (EASY never fires; see update)
    this._aiRank = slot;                        // race rank among rivals (refreshed by _sense)
    this.glowColor = new THREE.Color(0x9a938a); // exhaust smoke tint

    // ---- driver-feel state (all refreshed by _sense at ~6 Hz, zero allocs) ----
    this._senseT = Math.random() * 0.16; // staggered so the grid never senses in lockstep
    this._drafting = false;              // tucked behind a car ahead (cone check)
    this._draftT = 0;                    // draft dwell timer -> _draftOn (+12% window)
    this._avoidSolid = { on: false, lat: 0, r: 0 };            // landed rockfall etc.
    this._avoidHerd = { on: false, lat: 0, r: 0, panic: false }; // livestock in the road
    this._geyserLift = false;            // erupting geyser dead ahead -> ease off
    this._blockT = 0;                    // active deliberate block (defense) timer
    this._blockLat = 0;                  // lane committed to for that one move
    this._blockUsed = false;             // one block per straight; corners re-arm it
    this._errT = 0;                      // human error: overshoot phase timer
    this._errRec = 0;                    // human error: gather-it-up phase timer
    this._errWideDir = 1;                // which side "wide" is for the flubbed corner
    this._errArmed = true;               // one roll per corner approach
    this._wobPhase = Math.random() * 6.3;// personal wobble phase for corrections
    this._mistakeCd = 5;                 // min seconds between mistakes
    this._mistakes = 0;                  // probe counter: mistakes committed this race
    this._stuckT = 0;                    // low-speed dwell -> reverse-turn recovery
    this._deepStuckT = 0;                // long-stuck dwell -> pit-lift (placeAt)
    this._revT = 0;                      // active reverse-turn maneuver timer
  }

  /** True when `other` sits in the draft cone directly ahead (3..14u, ~28°). */
  _draftBehind(other, fwd) {
    if (!other || other === this || !other.alive) return false;
    const dx = other.pos.x - this.pos.x, dz = other.pos.z - this.pos.z;
    const d2 = dx * dx + dz * dz;
    if (d2 > 196 || d2 < 9) return false;
    return (dx * fwd.x + dz * fwd.z) / Math.sqrt(d2) > 0.88;
  }

  /** Low-frequency situational awareness (~6 Hz): runtime hazards (landed
   *  fallers, livestock, geysers), mutual slipstream, block re-arm and the
   *  difficulty-scaled human-error roll. No allocations — scratch vectors +
   *  reused result objects only. */
  _sense(g, t, fwd, v) {
    const N = t.N;
    // -- runtime solids on the road (landed rockfall / burning trees): the
    // per-frame avoidance loop reads t.obstacles, which is built once — the
    // fall-hazard system pushes new STONE solids into t.solids mid-race, so
    // those are scanned here and dodged like any other rock.
    const avS = this._avoidSolid;
    avS.on = false;
    const solids = t.solids;
    if (solids && solids.length) {
      let best = 32;
      for (let i = 0; i < solids.length; i++) {
        const ob = solids[i];
        const dx = ob.x - this.pos.x, dz = ob.z - this.pos.z;
        if (dx * dx + dz * dz > 1600) continue;             // 40u broadphase
        const along = dx * fwd.x + dz * fwd.z;
        if (along < 2 || along >= best) continue;
        if (Math.abs(dx * fwd.z - dz * fwd.x) > ob.r + 4) continue;
        _obPos.set(ob.x, 0, ob.z);
        const lat = t.lateralOffset(_obPos, t.nearestIndex(_obPos, this.trackIndex));
        if (Math.abs(lat) > ROAD_HALF + 2) continue;        // off-road scenery
        best = along;
        avS.on = true; avS.lat = lat; avS.r = ob.r;
      }
    }
    // -- livestock in the road corridor: swerve, and scrub speed if one is
    // dead ahead — rivals shoo the herd, they never plough it
    const avH = this._avoidHerd;
    avH.on = false; avH.panic = false;
    const herds = g.herds;
    if (herds && herds.length) {
      let best = 30;
      for (let i = 0; i < herds.length; i++) {
        const a = herds[i];
        if (!a.alive) continue;
        const dx = a.x - this.pos.x, dz = a.z - this.pos.z;
        if (dx * dx + dz * dz > 1370) continue;
        const along = dx * fwd.x + dz * fwd.z;
        if (along < 1 || along >= best) continue;
        const across = dx * fwd.z - dz * fwd.x;
        if (Math.abs(across) > 7) continue;
        _obPos.set(a.x, 0, a.z);
        const lat = t.lateralOffset(_obPos, t.nearestIndex(_obPos, this.trackIndex));
        if (Math.abs(lat) > ROAD_HALF + 3) continue;        // grazing in the pasture
        best = along;
        avH.on = true; avH.lat = lat; avH.r = 1.9;
        avH.panic = along < 13 && Math.abs(across) < 3.2;
      }
    }
    // -- geysers: one rumbling or erupting inside ~15u dead ahead -> lift
    this._geyserLift = false;
    const gys = g.geysers;
    if (gys && gys.length) {
      for (let i = 0; i < gys.length; i++) {
        const gy = gys[i];
        const dx = gy.x - this.pos.x, dz = gy.z - this.pos.z;
        if (dx * dx + dz * dz > 324) continue;
        const along = dx * fwd.x + dz * fwd.z;
        if (along < 1 || along > 15) continue;
        if (Math.abs(dx * fwd.z - dz * fwd.x) > 4.5) continue;
        // 7.5s pad cycle (main.js): rumble >5.6, eruption >=6.4 — lift from ~5.2
        if (((g.raceTime + gy.phase) % 7.5) > 5.2) { this._geyserLift = true; break; }
      }
    }
    // -- mutual slipstream: the same +12% draft window the player earns.
    // Cheap: one cone check against the car directly ahead, at sense rate.
    let drafting = false;
    if (Math.abs(v) > this.maxSpeed * 0.5) {
      drafting = this._draftBehind(g.player, fwd);
      for (let i = 0; i < g.enemies.length && !drafting; i++) {
        drafting = this._draftBehind(g.enemies[i], fwd);
      }
    }
    this._drafting = drafting;
    // -- race rank among rivals (0 = leading AI): O(rivals) at sense rate.
    // Gates who carries rockets on NORMAL (front-runners only).
    let rank = 0;
    for (let i = 0; i < g.enemies.length; i++) {
      const o = g.enemies[i];
      if (o !== this && o.alive && o.progress > this.progress) rank++;
    }
    this._aiRank = rank;
    // -- defense re-arm: passing through a real corner grants one new block
    if (t.curvature[this.trackIndex] > CORNER_CURV) this._blockUsed = false;
    // -- human error roll: heavily on EASY, rarely on NORMAL, never on HARD.
    // One roll per corner approach (armed on the preceding straight).
    const diffId = g.difficulty?.id;
    const errP = diffId === 'easy' ? 0.25 : diffId === 'normal' ? 0.05 : 0;
    if (errP > 0 && g.raceTime > 5) {
      let curvNear = 0;
      for (let k = 10; k <= 40; k += 6) curvNear = Math.max(curvNear, t.curvature[(this.trackIndex + k) % N]);
      const approaching = t.curvature[this.trackIndex] < 0.012 && curvNear > 0.022
        && Math.abs(v) > this.maxSpeed * 0.5;
      if (approaching && this._errArmed) {
        this._errArmed = false;
        if (this._mistakeCd <= 0 && this._errT <= 0 && this._errRec <= 0
            && this.ramTimer <= 0 && this._revT <= 0 && Math.random() < errP) {
          // misjudged it: brake a touch late, carry too much speed in,
          // then wobble/slide wide while gathering it back up
          this._errT = 0.55 + Math.random() * 0.3;
          this._mistakeCd = 6 + Math.random() * 3;
          this._mistakes++;
          let dirSum = 0; // "wide" = outside of the corner being flubbed
          for (let k = 10; k <= 40; k += 6) dirSum += t._raceLine[(this.trackIndex + k) % N];
          this._errWideDir = dirSum > 0 ? -1 : 1;
        }
      } else if (!approaching && curvNear < 0.02) {
        this._errArmed = true; // clean straight: armed for the next corner
      }
    }
  }

  update(dt) {
    const g = this.game;
    this._syncLights();
    if (!this.alive) {
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) this.respawn();
      return;
    }
    const t = g.track;
    const prevIndex = this.trackIndex;
    const D = g.difficulty ?? DEFAULT_DIFFICULTY;

    // lazily cache per-track AI data (shared by every rival)
    if (!t._raceLine) t._raceLine = computeRaceLine(t);
    if (!t._speedInv) t._speedInv = computeSpeedInv(t, t._raceLine);

    // ---- rubber band: help when behind, cap when far ahead (both scale with D.rubberBand)
    const gap = g.player.progress - this.progress; // > 0: this car is behind the player
    let band = 1;
    // `bandUp` decouples the CHASE from the CAP (r284): one knob scaled
    // both, so EASY's generous leader-cap (rubberBand 1.25) also handed
    // trailing rivals +37% toward the player — and a casual leader was
    // re-passed forever by a field rubber-banding onto their tail. The cap
    // keeps rubberBand; the chase reads bandUp where a tier provides it.
    // PATCH_02 §3.3: the catch-up bonus is capped at +8% — the pack locked
    // four-wide on the recording's player for eight seconds because the band
    // could hand trailing rivals up to +21%.
    // PATCH_02 v1.3 fix 16: the CHASE half of the band switches off near the
    // lap boundary. Convergence is the band's whole design — and at the one
    // place every lap where the field must funnel through a gate, it timed
    // the pack's arrival to the player's (recording C: 2nd at 0:56, 7th by
    // 1:02, wrecked at the gantry pillar at 1:04, EVERY lap). ~10 s of race
    // line each side of the gate is band-free; the leader CAP stays on.
    const Nb = t.center.length;
    const lapF = this.trackIndex / Nb;
    const nearLine = lapF > 0.88 || lapF < 0.06;
    if (gap > 0.02 && !nearLine) band = Math.min(1.08, 1 + 0.30 * (D.bandUp ?? D.rubberBand) * THREE.MathUtils.clamp((gap - 0.02) / 0.10, 0, 1));
    else if (gap < -0.06) band = 1 - 0.12 * D.rubberBand * THREE.MathUtils.clamp((-gap - 0.06) / 0.15, 0, 1);
    this._nearLine = nearLine;
    // pace parity vs the garage: a maxed ENGINE (+20% player top speed) turned
    // NORMAL into a parade. Rivals bring +2% per player engine level (cap
    // +10%) on NORMAL/HARD; EASY keeps its gentler pack untouched so a casual
    // still gets to win with upgrades. NOTE: upgrades went PER-CAR
    // (`garage.upgrades[carKey]`) and the old flat `garage.engine` key is
    // deleted by the save migration — reading it always returned 0, so this
    // whole parity rule was dead. Ask the game for the selected car's levels.
    const engLvl = g.carUpgrades?.().engine ?? g.garage?.engine ?? 0;
    const engUp = (g.difficulty?.id ?? 'normal') === 'easy'
      ? 1 : 1 + Math.min(0.10, 0.02 * engLvl);
    // TURN UP FOR A WORLD UNDERGEARED AND THE GRID WILL BURY YOU.
    //
    // Asked for plainly: if the world's requirements are not met, the player
    // should not get anywhere near the podium — they should be destroyed in
    // sixth. The yardstick is the world's own TRACK FEATS, because those are
    // the parts it asks for BY NAME and they are already printed on the card,
    // so the beating is legible rather than mysterious. Meet both gates and
    // this is exactly 1 — the balance every other test was tuned against.
    const kit = g.kitHandicap?.() ?? 1;
    this.maxSpeed = this.baseMaxSpeed * D.aiSpeed * engUp * kit * Math.max(0.7, band);

    // THE BAND ALSO HAS TO REACH THE CORNERS, OR IT DOES NOTHING.
    //
    // Measured on EASY with the player pulling away: the band above was fully
    // engaged — sitting at its structural cap of 1.375 for 78% of frames — and
    // lifted rival `maxSpeed` from 50 to 66.7. Rivals were driving at 37.9.
    // They are top-speed-limited 4% of the time and CORNER-limited 95%, so the
    // band was raising a ceiling touched one frame in twenty-five. Sweeping
    // rubberBand from 0 to 5 moved the player's margin by a few points and
    // BACK-FIRED past 2.5, because inflating maxSpeed pushed rivals under the
    // `v > maxSpeed * 0.55` nitro gate and they boosted half as often.
    //
    // Pace lives in `aLat` in the braking model, which the band never touched.
    // It does now. The correction is adaptive by construction: worth nothing
    // when the player is struggling, growing with how far they actually run
    // away — which is the property the band was written to have and did not.
    // The chase side reads `bandUp` here too (r284): this is the band that
    // actually binds — rivals are corner-limited 95% of the time — so leaving
    // it on rubberBand kept EASY's +35% catch-up cornering alive after the
    // maxSpeed band was decoupled, and the casual leader was still re-passed.
    this._cornerBand = gap > 0.02 && !this._nearLine
      ? Math.min(1.08, 1 + 0.28 * (D.bandUp ?? D.rubberBand) * THREE.MathUtils.clamp((gap - 0.02) / 0.10, 0, 1))
      : gap < -0.06
        ? 1 - 0.14 * D.rubberBand * THREE.MathUtils.clamp((-gap - 0.06) / 0.15, 0, 1)
        : 1;

    // ---- refresh the small personal lane bias occasionally
    // LANE IS A PERSONALITY, NOT A TWITCH. It used to re-roll every 4-8 s,
    // and at +/-1.25 m it was the same magnitude as the entire racing line —
    // a second noise source of equal weight, which is half the reason rivals
    // read as wobbling rather than driving. Measured, freezing it changed race
    // pace by less than 1%, so it was pure jitter. Set once in the constructor
    // and left alone; the re-roll below is retired.
    this.laneTimer -= dt;
    if (false) {
      this.laneTimer = 4 + Math.random() * 4;
      this.lane = THREE.MathUtils.randFloatSpread(2.5);
    }

    const fwd = this.forward;
    const v = this.speedAlong;

    // ---- low-frequency situational sense (~6 Hz): hazards, draft, defense, error
    this._senseT -= dt;
    if (this._senseT <= 0) {
      this._senseT = 0.16;
      this._sense(g, t, fwd, v);
    }
    if (this._mistakeCd > 0) this._mistakeCd -= dt;
    // mutual slipstream: same 1.1s-tuck -> +12% window the player gets
    // (step() reads _draftOn when computing topSpeed for any car)
    this._draftT = this._drafting ? this._draftT + dt : Math.max(0, this._draftT - dt * 2);
    this._draftOn = this._draftT > 1.1;
    // human error phases: overshoot runs out -> the gather-it-up phase begins
    if (this._errT > 0) {
      this._errT -= dt;
      if (this._errT <= 0) this._errRec = 0.9;
    } else if (this._errRec > 0) this._errRec -= dt;

    // ---- steering target: racing line at a speed-scaled lookahead + situational biases
    // Lookahead shrinks with local curvature: a long chord across a tight arc
    // cuts the corner straight into the inside wall (pure-pursuit artifact).
    const curvHere = t.curvature[this.trackIndex];
    const look = Math.max(5, Math.floor((6 + Math.abs(v) * 0.35) / (1 + 45 * curvHere)));
    const li = (this.trackIndex + look) % t.N;
    let targetLat = t._raceLine[li] + this.lane;

    // ---- WHY THERE IS NO LATERAL 'PERSONAL LINE' HERE -------------------
    //
    // Measured first: over a 60 s race the field spends 26-34 % of its frames
    // with three or more rivals inside 6 u of each other, and the spread of
    // their lap progress is 0.035-0.089. That is a train, not a grid, and it
    // is the most robotic thing on screen.
    //
    // The obvious fix — give each driver a personal lateral bias as a fraction
    // of the half-width, plus a separation push away from anyone alongside —
    // WAS BUILT AND MEASURED AND REVERTED. It broke up the pack (pack frames
    // fell ~70 % on PINE VALLEY) and made the AI look considerably WORSE while
    // doing it, because spreading a field sideways aims it at the edges and
    // the edge is where the barrier is. Three runs a side, seconds spent
    // within half a metre of a wall:
    //
    //     PINE VALLEY      1.6 / 1.6 / 1.2   ->   3.0 / 1.6 / 2.1
    //     ROCKFALL RAVINE 19.6 / 14.4 / 17.6 ->  24.6 / 29.9 / 24.9
    //     GOTTHARD CLIMB   8.6 / 15.5 / 18.5 ->  25.9 / 19.3 / 24.5
    //
    // Fading the bias out on narrow roads did not save it: `widthAt` returns
    // ~9 almost everywhere, so the fade was inactive exactly where it was
    // needed. A field that strings out ALONG the lap rather than across it is
    // the version worth building next — vary braking points and corner speeds
    // per driver, not lateral position. Do not re-add a lateral spread term
    // without an A/B on tests/tool-ai-audit.mjs; the pack metric is far too
    // noisy for single runs (the same build measured 258, 1206 and 1113).
    // (boost pads are gone — rivals no longer swerve across the road to farm
    //  chevrons, they just drive the racing line)

    // WHO IS ACTUALLY BEHIND ME — player or rival, whoever is nearest.
    //
    // Defence used to test `g.player` alone. Measured on EASY with the player
    // winning, the player was within blocking range of a rival 0.5-2.1% of
    // frames and AHEAD of them 0% of the time, so the branch fired ZERO times
    // in a whole race. Every fighting behaviour in this file was
    // player-relative, which means a player who is winning sees none of them
    // and the field reads as five cars driving alone in convoy.
    //
    // Racing against each other is what makes a grid look alive from the
    // cockpit — the scrap in your mirror is the part you actually watch.
    let chaser = null, chaserGap = -1e9;
    for (const other of [g.player, ...g.enemies]) {
      if (other === this || !other.alive) continue;
      const ax = (other.pos.x - this.pos.x) * fwd.x + (other.pos.z - this.pos.z) * fwd.z;
      if (ax >= -2 || ax <= -11) continue;                 // must be BEHIND, and close
      const across = (other.pos.x - this.pos.x) * fwd.z - (other.pos.z - this.pos.z) * fwd.x;
      if (Math.abs(across) > 6) continue;                  // and roughly in my mirrors
      if (ax > chaserGap) { chaserGap = ax; chaser = other; }
    }

    // overtake: car ahead within 12 and closing -> swing to the emptier side
    let blockedAhead = false;
    for (const other of [g.player, ...g.enemies]) {
      if (other === this || !other.alive) continue;
      const dx = other.pos.x - this.pos.x, dz = other.pos.z - this.pos.z;
      const along = dx * fwd.x + dz * fwd.z;
      if (along < 1 || along > 12) continue;
      const across = dx * fwd.z - dz * fwd.x;
      if (Math.abs(across) > 3.2) continue;
      if (v > other.speedAlong - 0.5) {
        targetLat += other.lateral > this.lateral ? -3.5 : 3.5;
        blockedAhead = true;
        break;
      }
    }
    // defense: leading the player with them tucked within ~10u at pace ->
    // ONE deliberate line move onto their side. Committed once, held ~1.4s,
    // and not re-armed until a corner passes — readable blocking, never
    // weaving, and only at speed (never engaged below 70% pace).
    if (this._blockT > 0) {
      this._blockT -= dt;
      targetLat = THREE.MathUtils.lerp(targetLat, this._blockLat, 0.85);
    } else if (!blockedAhead && !this._blockUsed && chaser
        // `maxSpeed` here is the RUBBER-BANDED live value, inflated up to
        // 1.375x on EASY, while rivals actually run at 55-60% of it because
        // they are corner-limited. `0.7 * maxSpeed` was a speed they touched
        // on one straight, so this clause was false 86-91% of the time and the
        // whole branch fired ZERO times in a race the player was winning.
        && Math.abs(v) > this.baseMaxSpeed * 0.55
        // aggression is [0.7, 1.4] and easy.aiAggression is 0.65, so this
        // needed aggression > 0.846 — permanently disqualifying a fifth of
        // every grid from ever defending. Tested on the raw trait instead.
        && this.aggression > 0.85) {
      const dx = chaser.pos.x - this.pos.x, dz = chaser.pos.z - this.pos.z;
      const along = dx * fwd.x + dz * fwd.z;
      if (along < -2 && along > -11 && Math.abs(chaser.speedAlong) > Math.abs(v) * 0.7) {
        let c = 0; // only on a straight — blocking into a corner reads as a swerve
        for (let k = 0; k < 25; k += 5) c = Math.max(c, t.curvature[(this.trackIndex + k) % t.N]);
        if (c < CORNER_CURV) {
          this._blockUsed = true;
          this._blockT = 1.4;
          this._blockLat = THREE.MathUtils.clamp(g.player.lateral, -7, 7);
        }
      }
    }

    // ---- deliberate ramming: alongside the player at speed -> swing INTO them
    this.ramCooldown -= dt;
    if (this.ramTimer > 0) {
      this.ramTimer -= dt;
      const p = g.player;
      if (p.alive) {
        const diF = (p.trackIndex - this.trackIndex + t.N) % t.N;
        const di = Math.min(diF, t.N - diF);
        if (di < 10) {
          // aim just PAST the player's lane so the swing seeks contact
          targetLat = p.lateral + Math.sign(p.lateral - this.lateral || 1) * 1.2;
        } else {
          this.ramTimer = 0; // lost them — break off
        }
        // hard contact mid-ram: extra shove + sparks + callout (main.js's
        // car-collision does the base push; this is the slam on top)
        const ddx = p.pos.x - this.pos.x, ddz = p.pos.z - this.pos.z;
        if (ddx * ddx + ddz * ddz < 22) {
          _shove.set(ddx, 0, ddz).normalize();
          const rel = Math.hypot(this.vel.x - p.vel.x, this.vel.z - p.vel.z);
          p.vel.addScaledVector(_shove, 9 + Math.min(6, rel * 0.35));
          _splash.copy(p.pos).lerp(this.pos, 0.5);
          g.particles.sparks(_splash, _shove, 10);
          g.shake = Math.min(1, g.shake + 0.25);
          g.buzz?.(35);
          if ((g.raceTime ?? 0) - (g._ramFeedAt ?? -9) > 3) {
            g._ramFeedAt = g.raceTime ?? 0;
            g.hud.feed(`${this.name} SLAMS YOU!`, 'bad');
          }
          this.ramTimer = 0; // hit landed — break off
        }
      } else {
        this.ramTimer = 0;
      }
    } else if (this.ramCooldown <= 0 && g.player.alive) {
      const p = g.player;
      const diF = (p.trackIndex - this.trackIndex + t.N) % t.N;
      const di = Math.min(diF, t.N - diF);
      const latGap = Math.abs(p.lateral - this.lateral);
      if (di < 6 && latGap < 6 && Math.abs(v) > this.maxSpeed * 0.5 && Math.abs(p.speedAlong) > 8) {
        this.ramTimer = 0.7;
        // angrier drivers (and harder difficulty) wind up again sooner
        this.ramCooldown = (4 + Math.random() * 2)
          / THREE.MathUtils.clamp(this.aggression * D.aiAggression, 0.6, 2);
      }
    }

    // obstacle (and high-speed puddle) avoidance in the ~25-unit lookahead cone
    const hazards = t.obstacles ?? [];
    for (const ob of hazards) {
      const dx = ob.x - this.pos.x, dz = ob.z - this.pos.z;
      const along = dx * fwd.x + dz * fwd.z;
      if (along < 2 || along > 25) continue;
      _obPos.set(ob.x, 0, ob.z);
      const obLat = t.lateralOffset(_obPos, t.nearestIndex(_obPos, this.trackIndex));
      if (Math.abs(obLat - targetLat) < ob.r + 2.6) {
        // slide the target just past the obstacle, toward the side with more road
        const side = Math.sign(targetLat - obLat) || (obLat >= 0 ? -1 : 1);
        targetLat = obLat + side * (ob.r + 2.9);
      }
    }
    if (Math.abs(v) > this.maxSpeed * 0.65) {
      for (const pd of t.puddles ?? []) {
        const dx = pd.x - this.pos.x, dz = pd.z - this.pos.z;
        const along = dx * fwd.x + dz * fwd.z;
        if (along < 2 || along > 22) continue;
        _obPos.set(pd.x, 0, pd.z);
        const pdLat = t.lateralOffset(_obPos, t.nearestIndex(_obPos, this.trackIndex));
        if (Math.abs(pdLat - targetLat) < pd.r + 1.6) {
          const side = Math.sign(targetLat - pdLat) || (pdLat >= 0 ? -1 : 1);
          targetLat = pdLat + side * (pd.r + 1.9);
        }
      }
    }
    // runtime hazards (sensed at ~6 Hz): dodge landed rockfall and livestock
    // exactly like static rocks — slide the target just past them
    const avS = this._avoidSolid;
    if (avS.on && Math.abs(avS.lat - targetLat) < avS.r + 2.6) {
      const side = Math.sign(targetLat - avS.lat) || (avS.lat >= 0 ? -1 : 1);
      targetLat = avS.lat + side * (avS.r + 2.9);
    }
    const avH = this._avoidHerd;
    if (avH.on && Math.abs(avH.lat - targetLat) < avH.r + 2.8) {
      const side = Math.sign(targetLat - avH.lat) || (avH.lat >= 0 ? -1 : 1);
      targetLat = avH.lat + side * (avH.r + 3.1);
    }
    // running wide while gathering up a flubbed corner
    if (this._errRec > 0) targetLat += this._errWideDir * 3 * this._errRec;
    // ---- width-variation: the lateral clamp follows the pinched road width
    // (both here and at the lookahead point) so rivals aim through the gap
    // instead of grinding the narrowed edge; defensive on older track builds
    const wNow = t.widthAt?.(this.trackIndex) ?? ROAD_HALF;
    const wAhead = t.widthAt?.(li) ?? ROAD_HALF;
    // ---- AND THE MARGIN GROWS WITH SPEED, WHICH IS WHY THEY STOP SCRAPING.
    //
    // A fixed 1.6 u of edge margin is fine at 30 u/s and nowhere near enough
    // at 55: the car is still carrying the last correction when the barrier
    // arrives, so it arrives ON the barrier. Measured over a 60 s race, rivals
    // spent 16.6 s within half a metre of the wall on GOTTHARD CLIMB and 9.6 s
    // on ROCKFALL RAVINE — the mountain worlds, exactly where a watching
    // player calls the AI stupid. A margin that scales with the speed being
    // carried costs nothing on a straight (where the aim is near the middle
    // anyway) and keeps a hand's width of road in reserve through a fast
    // sweeper.
    const edgeMargin = 1.6 + Math.min(1.9, Math.max(0, v - 26) * 0.07);
    const latLim = Math.max(2.2, Math.min(7.4, Math.min(wNow, wAhead) - edgeMargin));
    targetLat = THREE.MathUtils.clamp(targetLat, -latLim, latLim);

    const target = t.pointAt(li, targetLat);
    const desired = Math.atan2(target.x - this.pos.x, target.z - this.pos.z);
    let dh = desired - this.heading;
    while (dh > Math.PI) dh -= Math.PI * 2;
    while (dh < -Math.PI) dh += Math.PI * 2;
    // Cap steering at speed so corner load stays under the slip threshold —
    // full-lock at race pace breaks the rear loose and washes the car wide
    // into the wall. Big heading errors (spun/facing a wall) still get full lock.
    const speedN = Math.min(1, Math.abs(v) / this.maxSpeed);
    const steerCap = Math.abs(dh) > 0.9 ? 1 : 0.6 + 0.4 * (1 - speedN);
    let steer = THREE.MathUtils.clamp(dh * 3.0, -steerCap, steerCap);
    // correction wobble: sawing at the wheel while gathering up a mistake —
    // decays with the recovery timer so it visibly settles
    if (this._errRec > 0) {
      steer = THREE.MathUtils.clamp(
        steer + Math.sin(g.raceTime * 13 + this._wobPhase) * 0.5 * this._errRec, -1, 1);
    }

    // ---- braking model: physics corner speeds + late-but-correct brake points
    // vMax(j) = sqrt(aLat / curvature); brake so that v <= sqrt(vMax^2 + 2*decel*dist)
    // aiCorner is the difficulty's LATERAL budget and is the knob that really
    // sets a rival's pace — vMax below takes a square root of this, so a tier
    // needs a big multiplier here to move at all. See DIFFS in main.js.
    // THE CORNER BUDGET IS THE WHOLE PERSONALITY, AND IT WAS BARELY A RANGE.
    //
    // `30 + 8 * cornerSkill` spans aLat 30..38, and corner speed goes as its
    // SQUARE ROOT, so the entire spread from the most timid driver to the most
    // committed was 12% in theory and +2.1% of race pace when measured. The
    // field's finishing order was set by `baseMaxSpeed`, which ramps with grid
    // slot — so rivals differed by start position and by nothing a player can
    // see. Two cars with cornerSkill 0.17 and 0.45 finished dead level.
    //
    // It was also far below the physics. A rival's no-slip lateral limit is
    // about 54 m/s^2; the EASY budget worked out at 23-29, and rivals were
    // measured pulling 19.5-25.8 at an apex while the player pulls 44-47.
    // Raising it to 47 gained 11% of race pace with ZERO off-road frames, zero
    // stuck frames, no damage and slip still at 0.05 — it was free.
    const aLat = (26 + 26 * this.cornerSkill) * D.aiSpeed * (D.aiCorner ?? 1) * (this._cornerBand ?? 1);
    const sqA = Math.sqrt(aLat);
    // 15, down from 26 (r288): the player's brake learned its real-world cap
    // (~1.5g = 14.7 u/s²), and a field that PLANS 2.65g stops would outbrake
    // every human into every corner by physics the player no longer has.
    // Rivals drive in the same world now.
    const DECEL = 15;
    let vAllowed = this.maxSpeed * (this._draftOn ? 1.12 : 1); // draft window open
    for (let k = 0; k <= 90; k += 5) {
      const j = (this.trackIndex + k) % t.N;
      let vMax = sqA * t._speedInv[j];
      // ---- width-variation: a pinch caps corner speed like a real corner,
      // so rivals brake in and thread it instead of wall-grinding through
      const wj = t.widthAt ? t.widthAt(j) : ROAD_HALF;
      if (wj < ROAD_HALF - 0.2) vMax = Math.min(vMax, 16 + 3.6 * wj);
      // ---- viz-zones: rivals can't see through fog/trees either
      if (t.vizZones && t.vizZones.length) {
        for (const z of t.vizZones) {
          const dz = (j - z.i0 + t.N) % t.N;
          if (dz <= z.len) { vMax = Math.min(vMax, this.maxSpeed * 0.82); break; }
        }
      }
      if (vMax >= vAllowed) continue;
      const vNow = k === 0 ? vMax : Math.sqrt(vMax * vMax + 2 * DECEL * k * t.segLen);
      if (vNow < vAllowed) vAllowed = vNow;
    }
    // downhill the grade force fights the brakes — trim corner speed mildly so
    // they still make the apex (guarded: flat tracks report slope 0)
    const slopeHere = t.slopeAt?.(this.trackIndex) ?? 0;
    if (slopeHere < -0.02) vAllowed *= Math.max(0.85, 1 + slopeHere * 1.2);
    vAllowed = Math.max(vAllowed, 14); // never crawl
    // surface conditions: rivals also respect snow/wet corner speeds
    const aiSurf = t.T?.surface;
    if (aiSurf === 'snow') vAllowed *= 0.86;
    else if (aiSurf === 'wet') vAllowed *= 0.94;
    // world-special slow field (FREEZE STRIKE / JUNGLE FURY): rivals at half pace
    if (g.enemySlowUntil && g.raceTime < g.enemySlowUntil) vAllowed = Math.min(vAllowed, this.maxSpeed * 0.5);
    // human error: braking a touch late — carry too much speed in (overshoot),
    // then brake harder than clean driving would while gathering it back up
    if (this._errT > 0) vAllowed = Math.min(this.maxSpeed, vAllowed * 1.35);
    else if (this._errRec > 0) vAllowed *= 0.78;
    // livestock dead ahead: the swerve is already set — scrub to below the
    // herd's own flee speed so contact can't happen. Swerve, never plough.
    if (this._avoidHerd.panic) vAllowed = Math.min(vAllowed, 9);

    let throttle = 0, brake = 0;
    if (v < vAllowed - 1.5) throttle = 1;
    else if (v > vAllowed + 1.5) brake = THREE.MathUtils.clamp((v - vAllowed) / 8, 0.35, 1);
    else throttle = 0.6; // hold speed through the corner
    // erupting geyser just ahead: lift off the throttle — a lift, not a stab
    if (this._geyserLift && brake === 0) throttle = Math.min(throttle, 0.15);

    // ---- nitro-ish bursts: behind the player, on a straight, off cooldown
    this.boostCooldown -= dt;
    const slowed = g.enemySlowUntil && g.raceTime < g.enemySlowUntil;
    if (!slowed && this.boostCooldown <= 0 && this.boostTimer <= 0 && gap > 0.004 && v > this.maxSpeed * 0.55) {
      let curvAhead = 0;
      for (let k = 0; k < 45; k += 5) curvAhead = Math.max(curvAhead, t.curvature[(this.trackIndex + k) % t.N]);
      if (curvAhead < 0.012) {
        this.boostTimer = 1.2;
        this.boostCooldown = 9 / Math.max(0.45, this.aggression * D.aiAggression);
      }
    }

    // ---- recovery: a rival parked nose-first against something backs out
    // deliberately (hard brake -> reverse gear -> swing the nose), and only a
    // genuine long stuck earns the pit-lift — deferred while the player is
    // close and looking, so the teleport pop stays off camera when possible.
    const spdAbs = Math.abs(v);
    if (this._revT > 0) this._revT -= dt;
    if (spdAbs < 2.2 && this.boostTimer <= 0) {
      this._stuckT += dt;
      this._deepStuckT += dt;
    } else if (spdAbs > 5) {
      this._stuckT = 0;
      this._deepStuckT = 0;
      this._liftAhead = 0;     // moving again — the next pit-lift starts near
    }
    if (this._revT <= 0 && this._stuckT > 1.5) {
      this._stuckT = 0;
      this._revT = 2.0; // brake gate (0.45s) + ~1.5s of reverse-turn
    }
    if (this._deepStuckT > 6) {
      const dxp = this.pos.x - g.player.pos.x, dzp = this.pos.z - g.player.pos.z;
      const seen = dxp * dxp + dzp * dzp < 8100
        && dxp * Math.sin(g.player.heading) + dzp * Math.cos(g.player.heading) > 0;
      if (!seen || this._deepStuckT > 9) {
        this._deepStuckT = 0; this._stuckT = 0; this._revT = 0;
        // PAST THE TRAP, NOT BACK INTO IT. This lift used to re-seat the car
        // at the SAME index it was pinned at — against a wall in the lane
        // that meant teleporting straight back into the wall, forever, which
        // is exactly the stable jam the field-stall dossier measured. Each
        // consecutive lift now advances further down the lap, so no fixed
        // obstruction can hold a rival through more than a couple of lifts.
        this._liftAhead = Math.min(60, (this._liftAhead ?? 0) + 14);
        this.placeAt((this.trackIndex + this._liftAhead) % t.N,
          THREE.MathUtils.clamp(this.lateral, -6, 6), true);
        return;
      }
    }
    if (this._revT > 0) {
      // reverse-turn: sustained hard brake engages reverse; mirrored steer
      // while rolling backwards swings the nose toward the road target
      throttle = 0; brake = 1;
      steer = v < -0.5 ? -Math.sign(dh) : 0;
    }
    // a brief slide moment at the start of a mistake correction reads as a car
    // caught sideways, not a scripted wiggle
    const errSlide = this._errRec > 0.62 && this._revT <= 0;
    this.step(dt, { throttle, brake, steer, drift: errSlide });
    if (this.checkLap(prevIndex) === true && this.lap > g.lapsTotal && !this.finished) this.finished = true;

    // slide smoke when the AI breaks loose (only near the player, keep it cheap
    // — and allocation-free: this line runs every frame for every rival)
    const sideV = Math.abs(this.vel.x * Math.cos(this.heading) - this.vel.z * Math.sin(this.heading));
    if (sideV > 7 && !this.airborne && Math.random() < 0.35
        && this.pos.distanceToSquared(g.player.pos) < 14400) {
      const back2 = this.forward.multiplyScalar(-1);
      g.particles.driftSmoke(this.pos.clone().addScaledVector(back2, 1.6));
    }

    // exhaust
    if (throttle && Math.random() < 0.5) {
      const back = this.forward.multiplyScalar(-1);
      const tail = this.pos.clone().addScaledVector(back, 2.4);
      g.particles.exhaust(tail, back, this.glowColor, this.boostTimer > 0);
    }

    // take shots at the player when lined up (rate scales with aggression + difficulty)
    const toPlayer = g.player.pos.clone().sub(this.pos);
    const dist = toPlayer.length();
    if (g.player.alive && dist < 70 && this.fireCooldown <= 0 && g.aiCanTarget?.(this)) {
      const angle = Math.abs(Math.atan2(toPlayer.x, toPlayer.z) - this.heading);
      const norm = Math.min(angle, Math.PI * 2 - angle);
      if (norm < 0.32) {
        this.fireCooldown = Math.max(0.22, 0.75 / (this.aggression * D.aiAggression));
        g.weapons.fireBullet(this, 4.5, 0.05);
      }
    }

    // one forward vector for both weapon gates below (allocation-free per frame)
    const nf = this.forward;
    const alongP = toPlayer.x * nf.x + toPlayer.z * nf.z;  // >0: player is AHEAD of us
    const acrossP = toPlayer.x * nf.z - toPlayer.z * nf.x; // lateral offset in our frame

    // drop a mine in the player's path: player 6..18 behind and roughly in-line
    this.mineCooldown -= dt;
    if (this.mineCooldown <= 0 && g.player.alive) {
      if (alongP < -6 && alongP > -18 && Math.abs(acrossP) < 3.5
          && g.aiCanTarget?.(this)
          && Math.random() < dt * 1.5 * this.aggression * D.aiAggression) {
        this.mineCooldown = 6 + Math.random() * 4;
        g.weapons.dropMine(this);
      }
    }

    // ---- homing missiles up the leader's tailpipe (player 10..75u ahead,
    // roughly in-line). The old design was ONE missile per rival per race and
    // only on HARD — in practice players never saw a rocket (user report).
    // Now: EASY never; NORMAL an occasional reminder (~one a minute); HARD the
    // pack genuinely shoots back (~three a minute). Rate is owned by the
    // pack-wide gate below, never by who is allowed to carry a rocket:
    // the old NORMAL clause `_aiRank < 2` (front-runners only) was DEAD, because
    // a launch also needs the player 15..60u AHEAD of the shooter — a rival
    // running 1st or 2nd is by definition in front of a mid-pack player, so the
    // two clauses could almost never be true at the same time. Rank now only
    // decides how quickly a driver reloads.
    const diffId2 = g.difficulty?.id ?? 'normal';
    // grid stagger: nobody is armed off the line (per-rival reload), and the
    // pack's rocket budget only opens after the first-launch delay below.
    if (g.raceTime < 1) {
      this.missileCd = 6 + Math.random() * 6;
      g._aiRocketN = 0; g._aiRocketMin = 0;
    }
    this.missileCd = (this.missileCd ?? (6 + Math.random() * 6)) - dt;
    // Pack-wide RATE GOVERNOR. With 5 rivals all holding a window, per-rival
    // cooldowns alone produced a rocket every ~4s; a fixed pack cooldown then
    // swung the other way — every window that opened while the cooldown ran was
    // simply lost, so a player who was being beaten (nobody behind them to
    // shoot) saw almost nothing. Launches are budgeted against race time
    // instead: HARD one per 20s after 8s (~3/min), NORMAL one per 85s after 24s
    // (~0.7/min). A quiet stretch banks up to 2 rockets so the pace is repaid
    // at the next real opportunity, and 6s of minimum spacing stops a backlog
    // arriving as a salvo.
    const mFirst = diffId2 === 'hard' ? 8 : 24;
    const mPeriod = diffId2 === 'hard' ? 20 : 85;
    const mFired = g._aiRocketN ?? 0;
    const mBudget = g.raceTime < mFirst ? 0
      : Math.min(1 + Math.floor((g.raceTime - mFirst) / mPeriod), mFired + 2);
    const mCdOk = this.missileCd <= 0;
    const mDiffOk = diffId2 !== 'easy' && g.player.alive;
    const mPackOk = mFired < mBudget && g.raceTime >= (g._aiRocketMin ?? 0);
    // launch cone: the missile homes, so rough alignment is enough. The old
    // flat ±5u gate was why rockets never flew — a rival on its racing line
    // holds the player's exact wake for well under half a second. weapons.js
    // only locks the player when they are inside the ±75° nose cone, so the
    // "player ahead" test is not optional — it is what makes the rocket home.
    // 10..75u: wide enough that a real chase converts into a launch. The old
    // 15..60 window opened for barely 20 rival-seconds in a 90s race, so most
    // of the pack's budget expired unused while a rival sat 12u off the player's
    // bumper with a perfect shot.
    const mRangeOk = alongP > 10 && alongP < 75;
    const mConeOk = Math.abs(acrossP) < Math.min(14, 4 + alongP * 0.25);
    // opt-in probe counters (headless): set __game.__fireProbe = {} before a run
    // and every sub-condition of this gate is counted, so a clause that never
    // goes true shows up as a zero instead of being guessed at.
    const fp = g.__fireProbe;
    if (fp) {
      fp.frames = (fp.frames ?? 0) + 1;
      if (mCdOk) fp.cdOk = (fp.cdOk ?? 0) + 1;
      if (mDiffOk) fp.diffOk = (fp.diffOk ?? 0) + 1;
      if (mPackOk) fp.packOk = (fp.packOk ?? 0) + 1;
      if (mRangeOk) fp.rangeOk = (fp.rangeOk ?? 0) + 1;
      if (mRangeOk && mConeOk) fp.coneOk = (fp.coneOk ?? 0) + 1;
      if (mCdOk && mDiffOk && mPackOk) fp.armed = (fp.armed ?? 0) + 1;
      if (mCdOk && mDiffOk && mPackOk && mRangeOk && mConeOk) fp.all = (fp.all ?? 0) + 1;
      // A/B against the retired gate: `rank < 2` on NORMAL, window 15..60u.
      // `oldShot` counts the frames that gate would ever have fired in.
      const oldCarrier = diffId2 === 'hard' || (this._aiRank ?? 9) < 2;
      const oldWindow = alongP > 15 && alongP < 60
        && Math.abs(acrossP) < Math.min(12, 4 + alongP * 0.25);
      if (oldCarrier) fp.rankOk = (fp.rankOk ?? 0) + 1;
      if (oldWindow) fp.oldWindow = (fp.oldWindow ?? 0) + 1;
      if (oldCarrier && oldWindow) fp.oldShot = (fp.oldShot ?? 0) + 1;
      if (mRangeOk && mConeOk) fp.newShot = (fp.newShot ?? 0) + 1;
    }
    if (mCdOk && mDiffOk && mPackOk && mRangeOk && mConeOk && g.aiCanTarget?.(this)) {
      // front-runners reload faster; everyone can pull the trigger. Kept short
      // (the pack budget is the real rate limit) so a long reload can't swallow
      // the one window a chaser gets.
      this.missileCd = ((this._aiRank ?? 9) < 2 ? 4 : 6) + Math.random() * 3;
      g._aiRocketN = mFired + 1;
      g._aiRocketMin = g.raceTime + 6;
      g.weapons.fireMissile(this); // enemy-owned missiles home on the player
      g.audio.missile();
      g.hud.feed('MISSILE INCOMING!', 'bad');
      g.buzz([50, 35, 50]);
      if (fp) fp.fired = (fp.fired ?? 0) + 1;
    }
  }
}

// ---------- player car catalog ----------
// Purchasable rides for the garage. Looks reuse the rival liveries, but every
// player version wears gold rims (and gold stripe accents) + plate number 1 so
// it reads as "yours" on the grid. The lead reads this for the shop UI and
// passes the chosen entry into new PlayerCar(game, entry).
const GOLD = 0xe8b83a;
/* ==========================================================================
 * TYRES — the one stat that says where a car may race.
 *
 * The garage used to be a ladder: every car could enter every world, so the
 * only question a player ever asked was "is this one's numbers bigger". The
 * OFF-ROAD stat existed but only applied once you had LEFT the carriageway
 * (`offRoad ? … : 1`), so the surface a stage is actually made of never met
 * the machine at all. Fifty-eight worlds, one decision.
 *
 * Tyres cut across that. A car carries a class, a world demands one, and the
 * demand is a FLOOR, not a preference:
 *
 *   0 ROAD    slicks and street rubber — sealed surfaces only
 *   1 GRAVEL  rally tyres — sealed and loose
 *   2 SNOW    studs and all-terrain — everything
 *
 * Under-specced is refused at the start line; the world says which tyre it
 * wants and the garage sells it. OVER-specced is allowed and costs you — a
 * studded tyre on hot tarmac is vague and slow — so the answer is never
 * "own the most expensive set and forget the mechanic".
 *
 * The class comes from the car's own OFF-ROAD stat, so no car needed a new
 * number, and the existing per-car TIRES upgrade raises it — which is what
 * turns that upgrade from "+4 % grip" into the thing that opens a region.
 * One level (800 CR) takes the starter BRAWLER from GRAVEL to SNOW, so the
 * first ice stage is a purchase and not a wall.
 * ======================================================================== */
/** Grip multiplier for running MORE tyre than the surface needs. Pure, and
 *  exported, because the driven A/B this was first asserted with could not be
 *  made repeatable: with a fresh car per run and six-run averages the control
 *  still drifted 10 % in one direction, so the simulation was measuring
 *  accumulated state, not tyres. Testing the rule itself is honest; asserting
 *  on a rig that cannot repeat itself is not. */
/** The price of the wrong tyres, in grip. Over-specced squirms (studs on hot
 *  tarmac); UNDER-specced is worse and steeper (road rubber on ice), because
 *  that is the direction that used to be a hard refusal — the start line said
 *  CANNOT RACE, and with one eligible car per surface the roster collapsed to
 *  "one car per trail", reported as exactly that. A penalty keeps the whole
 *  point of the class system — the right machine is clearly, measurably
 *  faster — without forbidding anything: -17 % a class under, -34 % two
 *  under, stacking with the over-spec squirm. */
/** @param slick 0 on a dry road, 0.55 in the wet, 1 on ice — how much the
 *  surface cares what compound is on the car. Defaults to 0.35 so the pure
 *  function keeps its old mid-range answer for the menus, which quote a single
 *  headline number before a world is even loaded. */
export const tyrePenalty = (over, under = 0, slick = 0.35, quality = 0) => {
  const s = Math.min(1, Math.max(0, slick));
  // TYRE LEVEL IS QUALITY, NOT JUST RANGE.
  //
  // Reported as "change tire level ideal on 60/60 makes no difference — needs
  // better distribution". Measured: of 60 worlds 40 are SEALED, 16 LOOSE and
  // only 4 ICE, so a car that owns GRAVEL is already ideal on 56 and the
  // CLASS half of the line is worth four worlds, all of it at level 1. Levels
  // 2-5 bought nothing but a grip trickle.
  //
  // The roster cannot simply be re-labelled to fix that: a world's tyre demand
  // has to match its PHYSICS, or you recreate the r172 FURKA bug where a dry
  // summer pass demanded snow tyres. Only four worlds are actually snowy.
  //
  // So the levels buy something else real: a better set copes better with the
  // wrong surface. Each level takes 12 % off whatever the mismatch costs, so a
  // maxed set on the wrong compound loses 40 % of what a stock set loses. That
  // is a reason to keep buying after level 1, and it does nothing at all to a
  // correctly-shod car — the mismatch is zero there, and 12 % of zero is zero.
  const q = 1 - 0.12 * Math.min(5, Math.max(0, quality | 0));
  // Under-spec was a flat 0.17/class capped at 0.34 — the same price for road
  // rubber on a dry gravel stage as on sheet ice. It now runs 0.11/class on a
  // dry road up to 0.36/class on ice, capped at 0.72 so a two-class mismatch
  // in a blizzard leaves 28 % of the grip: still steerable at a crawl, hopeless
  // at racing pace, which is the shape the complaint asked for.
  const perClass = 0.11 + 0.25 * s;
  return (1 - Math.min(0.20, 0.09 * Math.max(0, over | 0)) * q)
    * (1 - Math.min(0.72, perClass * Math.max(0, under | 0)) * q);
};

export const TYRE_ROAD = 0, TYRE_GRAVEL = 1, TYRE_SNOW = 2;
export const TYRE_LABEL = ['ROAD', 'GRAVEL', 'SNOW'];

/** A car's tyre class before any upgrade, read off the stat it already had. */
export const baseTyreClass = (offroad) =>
  (offroad < 0.5 ? TYRE_ROAD : offroad < 0.85 ? TYRE_GRAVEL : TYRE_SNOW);

/** The BEST compound this car has unlocked — its own class plus whatever the
 *  TIRES upgrade has bought. This is a ceiling, not a fitment. */
export function tyreMaxClass(carKey, upgrades) {
  const c = CAR_CATALOG.find((x) => x.key === carKey);
  if (!c) return TYRE_ROAD;
  const lvl = (upgrades && upgrades.tires) | 0;
  const bump = lvl >= 3 ? 2 : lvl >= 1 ? 1 : 0;
  return Math.min(TYRE_SNOW, baseTyreClass(c.stats.offroad) + bump);
}

/** WHAT IS ACTUALLY BOLTED ON — a CHOICE now, not a ratchet.
 *
 *  Reported as "misleading message, as there is no way to change tyres", with
 *  a screenshot of START — WRONG TYRES (−18% GRIP). The report was exactly
 *  right and the bug was worse than the wording. Measured on a fresh career:
 *  `tyreClass('brawler', {tires: n})` for n = 0..5 returned [1,2,2,2,2,2].
 *  One 600 CR purchase of a line advertised as "+4% grip" moved the only car
 *  you own to SNOW class PERMANENTLY, and every SEALED circuit in the game —
 *  CANYON RUN, EMBER PASS, SUMMIT CLIMB, all of GRAND CIRCUITS — then read
 *  WRONG TYRES with no route back, because class could only ever go up.
 *
 *  So the upgrade UNLOCKS compounds and the garage FITS one. Going DOWN is
 *  always free and always available (any car can run road rubber); going UP
 *  is what costs money, which is where the shopping decision belonged all
 *  along. `fitted` undefined keeps the old answer, so every existing save and
 *  every call site that has not been taught about fitment still works. */
export function tyreClass(carKey, upgrades, fitted) {
  const max = tyreMaxClass(carKey, upgrades);
  if (fitted == null) return max;
  return Math.max(TYRE_ROAD, Math.min(max, fitted | 0));
}

/** The tyre level that would first make `carKey` legal on `need`, or null if
 *  it already is. Used to price the advice the track card gives. */
export function tyreLevelFor(carKey, upgrades, need) {
  if (tyreClass(carKey, upgrades) >= need) return null;
  const c = CAR_CATALOG.find((x) => x.key === carKey);
  if (!c) return null;
  const base = baseTyreClass(c.stats.offroad);
  for (const lvl of [1, 3]) {
    if (Math.min(TYRE_SNOW, base + (lvl >= 3 ? 2 : 1)) >= need) return lvl;
  }
  return null;                        // no upgrade reaches it — buy a car
}

export const CAR_CATALOG = [
  {
    key: 'brawler', name: 'BRAWLER', price: 0, desc: 'All-rounder',
    spec: { name: 'BRAWLER', style: 'brawler', body: 0xff8c1a, accent: 0xe86a10, stripe: [0x241d16], number: 1, brand: 'APEX' },
    stats: { maxSpeed: 55.5, accel: 36.5, grip: 4.85, health: 96, offroad: 0.70, nitroPower: 0.98, plating: 1.02 },
  },
  {
    // Was quietly the best car in the game: the highest grip in the catalogue
    // AND the best acceleration AND good nitro, for 5,000 CR. Rated quickest on
    // 13 of the 21 worlds, which made every machine above it pointless. It is a
    // road hatch now — still the sharpest thing through a dry corner, but short
    // on top end and hopeless once the surface turns.
    key: 'sleek', name: 'SLEEK', price: 4000, desc: 'Nimble hatch',
    spec: { name: 'SLEEK', style: 'sleek', body: 0xf2c81e, accent: 0xe8b83a, stripe: [0x241d16], number: 1, brand: 'APEX', rims: GOLD },
    stats: { maxSpeed: 53, accel: 39, grip: 5.65, health: 84, offroad: 0.38, nitroPower: 1.12, plating: 1.10 },
  },
  {
    key: 'crown', name: 'CROWN', price: 8000, desc: 'Fast on tarmac',
    spec: { name: 'CROWN', style: 'crown', body: 0x2440b8, accent: 0x1a2c8a, stripe: [GOLD, 0xf2f0e8], number: 1, brand: 'APEX', rims: GOLD },
    stats: { maxSpeed: 64, accel: 36, grip: 4.60, health: 82, offroad: 0.35, nitroPower: 1.02, plating: 1.06 },
  },
  {
    key: 'dune', name: 'DUNE', price: 13000, desc: 'Off-road king',
    spec: { name: 'DUNE', style: 'dune', body: 0xdce8f0, accent: 0x4a9ad8, stripe: [GOLD], number: 1, brand: 'APEX', rims: GOLD },
    stats: { maxSpeed: 55, accel: 38, grip: 5.32, health: 110, offroad: 1.02, nitroPower: 0.92, plating: 0.95 },
  },
  {
    // A 911 IS A SEALED-SURFACE CAR, and the tyre rule means that is a real
    // constraint rather than flavour text: offroad 0.44 puts it in ROAD class,
    // so it takes the 37 circuits and is refused on the rally stages. Highest
    // grip in the catalogue and the best nitro, because a rear-engined car
    // puts its weight over the driven axle — it is the sharpest thing here
    // through a dry corner and has no answer at all once the surface turns.
    key: 'flatsix', name: 'FLATSIX', price: 18000,
    desc: 'Rear-engined coupe — sealed surfaces only',
    spec: { name: 'FLATSIX', style: 'flatsix', body: 0xd8d4cc, accent: 0x2a2d33,
      stripe: [0xc4342a], number: 11, brand: 'ZENITH', rims: GOLD },
    // ACC is the one headline stat no other machine claims (CROWN owns SPD,
    // SLEEK GRP, DUNE OFF, PIT ARM, ALPINE NTR — tests/test-cars.mjs enforces
    // it), so that is this car's identity: it leaves a corner harder than
    // anything else here. Deliberately NOT the grip or nitro leader; taking
    // either would have made an existing card lie about its own machine.
    stats: { maxSpeed: 58, accel: 42, grip: 5.35, health: 84, offroad: 0.42,
      nitroPower: 1.12, plating: 1.0 },
  },
  {
    // ...AND THE ESTATE ON THE SAME BADGE IS THE OPPOSITE ANSWER: offroad 0.88
    // is SNOW class, so it takes the loose and the ice and is barred from the
    // circuits its coupe sibling owns. Between them they cover the roster and
    // neither covers it alone, which is the whole point of the tyre rule.
    key: 'bastion', name: 'BASTION', price: 26000,
    desc: 'Performance estate — loose and ice',
    spec: { name: 'BASTION', style: 'bastion', body: 0x1f2a38, accent: 0xc8ccd2,
      stripe: [0xc8ccd2], number: 9, brand: 'ZENITH', rims: GOLD },
    stats: { maxSpeed: 58, accel: 38.5, grip: 5.15, health: 124, offroad: 0.92,
      nitroPower: 1.0, plating: 1.10 },
  },
  {
    // The ALPINE was the one machine that was never the right answer: lowest
    // grip in the catalogue and only mid top speed, so it rated last on every
    // world measured. A car nobody should ever buy is a hole in the garage, not
    // a playstyle. Retuned toward the name — a mountain and loose-surface
    // specialist — so it owns the twisty snow stages the DUNE is too slow for
    // and the CROWN cannot hold at all, while its top speed keeps it off the
    // open circuits.
    key: 'alpine', name: 'ALPINE', price: 22000, desc: 'Mountain drifter',
    spec: { name: 'ALPINE', style: 'alpine', body: 0xf2f0e8, accent: 0xe8e2d4, stripe: [GOLD, 0xd8342a], number: 1, brand: 'APEX', rims: GOLD },
    stats: { maxSpeed: 56, accel: 39, grip: 5.45, health: 98, offroad: 0.84, nitroPower: 1.20, plating: 1.04 },
  },
  {
    // The most expensive machine in the game could not win a lap anywhere — it
    // was sold purely on hull, which makes 40,000 CR a strange ask. Heavy but
    // planted: it now has the grip to own a fast, dry, flowing circuit, and
    // still takes the least damage doing it.
    key: 'pit', name: 'PIT-99', price: 32000, desc: 'Armored bruiser',
    spec: { name: 'PIT-99', style: 'pit', body: 0x1c1a18, accent: 0x2a2724, stripe: [GOLD], number: 1, brand: 'APEX', rims: GOLD },
    stats: { maxSpeed: 61, accel: 36, grip: 5.05, health: 132, offroad: 0.48, nitroPower: 0.85, plating: 0.78 },
  },
];

export class PlayerCar extends Car {
  constructor(game, catalogEntry = null) {
    const entry = catalogEntry ?? CAR_CATALOG[0]; // default ride: the brawler
    super(game, buildCarMesh(entry.spec), {
      maxSpeed: entry.stats.maxSpeed, accel: entry.stats.accel, grip: entry.stats.grip,
      steerRate: 2.7, driftLag: 0.25, steerTaper: 0.26,
    });
    this.catalogKey = entry.key;
    this.maxHealth = this.health = entry.stats.health;
    this.offroadSkill = entry.stats.offroad;
    this.nitroPower = entry.stats.nitroPower ?? 1;  // nitro burst strength
    this.plating = entry.stats.plating ?? 1;        // damage intake multiplier
    this.steerSmoothRate = 6; // input smoothing on (handling upgrade sharpens it)
    this.handling = 0;        // 0..1 — the lead sets this from the garage (0.2/level)
    this.assist = 0;          // driving aid strength (settings menu: 0 / 0.5 / 1)
    this.steerSense = 1;      // settings-menu sensitivity (lead sets 0.8/1.0/1.25);
                              // scales steerRate + smoothing, independent of HANDLING
    this.name = 'YOU';
    this.respawnDelay = 2.5;
    this.heat = 0;        // 0..1
    this.overheated = false;
    // ---- EVERYTHING ON THE CAR IS FINITE, AND THE LIMIT IS A PURCHASE.
    // "Rockets and gun needs to have limited and upgradable slots. Same for
    // the sos." Every one of these is now a per-race capacity the garage sets
    // (see Game.applyUpgrades); the values here are the STOCK loadout, which
    // is what a brand-new car turns up with before a credit is spent.
    this.unstuckCool = 0;   // UNSTUCK: seconds until the next charge is usable
    this.sos = 1;           // ...and how many charges the race started with
    this.maxSos = 1;
    this.rounds = 90;       // cannon magazine — was infinite, heat-limited only
    this.maxRounds = 90;
    this.missiles = 1;
    this.maxMissiles = 1;
    this.mines = 1;
    this.maxMines = 1;
    this.nitro = 0.3;       // 0..1, charged by drifting, kills and pickups
    this.shockCooldown = 0; // seconds until the shockwave is ready
    this.cannonDamage = 3.5; // upgrade hook — garage sets this after resetRace
    this.nitroRate = 1;     // upgrade hook — multiplies all nitro gains here
    this.glowColor = new THREE.Color(0x9a938a); // exhaust smoke tint
    this.bestLap = Infinity;
    this.lapStart = 0;
  }

  update(dt, input) {
    const g = this.game;
    this._syncLights();
    if (!this.alive) {
      // OUT OF HULLS: no redeploy. The three-wreck rule (main.js HULL_LIVES)
      // sets this on the wreck that ends the race, and without it the car
      // would pop back onto the road five seconds into the results screen.
      if (this.outOfHulls) return;
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) { this.respawn(); g.hud.feed('REDEPLOYED', 'info'); }
      return;
    }
    const prevIndex = this.trackIndex;
    const controlsLive = g.state === 'race';
    const inputs = controlsLive
      ? { throttle: input.throttle, brake: input.brake, steer: input.steer, drift: input.drift }
      : { throttle: 0, brake: 0, steer: 0, drift: false, hold: true }; // grid hold — no reverse creep
    this.step(dt, inputs);

    // RECOVERY NET. Respawn only ever triggered on a WRECK, so a car that was
    // still alive but had ended up somewhere impossible — under the terrain,
    // or at a coordinate that is not a number — could never come back, and the
    // player was left looking at an empty screen with the HUD still ticking.
    //
    // IT NO LONGER CARES HOW FAR FROM THE ROAD YOU ARE. The lateral test used
    // to drag you back to the racing line after 2.5 s beyond 120 u, which made
    // "go and look at that mountain" impossible in a race and read as the game
    // resetting you for leaving the track. Wandering off is a choice the world
    // is big enough to allow; only genuinely broken states are rescued now.
    if (this.alive && g.state === 'race') {
      const groundY = g.track.terrainHeight(this.pos.x, this.pos.z);
      const lost = this.y < groundY - 6
        || !Number.isFinite(this.pos.x) || !Number.isFinite(this.y);
      this._lostT = lost ? (this._lostT ?? 0) + dt : 0;
      // PATCH_02 §3.4: ON TOP OF THE CANYON IS OFF THE COURSE. The stray rule
      // measures XZ only, so a car thrown onto the rim DIRECTLY ABOVE the lap
      // read as on-course and cruised the cliff tops at 199 for six seconds.
      // Grounded, 12 u above the tracked road, with NO road at our own height
      // within reach (stacked decks and overpasses are legal), for 2 s -> the
      // same free auto-return the lost net uses. Race only: in roam the high
      // ground is the destination (goat peaks), never a fault.
      let cliffTop = false;
      if (!g.freeRoam && !this.airborne && this === g.player) {
        const t4 = g.track, N4 = t4.center.length;
        const ci4 = t4.center[this.trackIndex];
        if (ci4 && this.y - ci4.y > 12
            && Math.hypot(this.pos.x - ci4.x, this.pos.z - ci4.z) < 70) {
          cliffTop = true;
          for (let q = -90; q <= 90; q += 3) {
            const cq = t4.center[(this.trackIndex + q + N4) % N4];
            if (Math.hypot(cq.x - this.pos.x, cq.z - this.pos.z) < 30
                && Math.abs(cq.y - this.y) < 6) { cliffTop = false; break; }
          }
        }
      }
      if (cliffTop && !(this._cliffT > 0)) g.telemetry?.log('offmesh', { enter: true, speed: Math.round(Math.hypot(this.vel.x, this.vel.z)) });
      else if (!cliffTop && (this._cliffT ?? 0) > 0) g.telemetry?.log('offmesh', { enter: false });
      this._cliffT = cliffTop ? (this._cliffT ?? 0) + dt : 0;
      // WEDGED IS NOT WANDERING. The net above deliberately lets a player
      // drive anywhere — but a car photographed parked on a gorge face at
      // 0 km/h with the throttle held ("I still see this") is not exploring,
      // it is stuck on ground too steep to climb with no way to turn around.
      // The tell is the INPUT: full throttle and no motion, sustained. An
      // idle car parked on a mountainside is never touched, and five seconds
      // is long enough that anyone who could reverse out already has.
      // Player only — rivals carry their own staged recovery with the
      // off-camera deferral, and this simpler net would preempt it in view.
      // BOGGED DOWN ON THE WRONG RUBBER IS NOT A RESCUE, IT IS A WRECK.
      //
      // Asked for as "if I get stuck in mud or snow cuz of wrong tires, car
      // gets wrecked after no successful trial of 5s". The distinction that
      // makes this fair rather than arbitrary is WHY you stopped: wedged
      // against a rock is the world's fault and the net above pulls you out
      // free; sitting in deep snow spinning road tyres is a decision you made
      // in the garage, and the game already told you so on the track card, at
      // the start line, and in the tyre warning. So this one costs a hull.
      //
      // It only exists where the compound matters (`_slick` > 0: snow and
      // wet), only when you are genuinely under-tyred for it, and only under
      // held throttle — an idle car is never destroyed for being parked. The
      // UNSTUCK button still works throughout, which is the "successful trial"
      // the request leaves room for.
      const bogged = this === g.player && controlsLive && !this.airborne
        // DELIBERATELY `freeRoam`, NOT `openCourse`. The other two reads of
        // this flag are BOUNDARY rules — they decide where you may drive — and
        // a mission is a road event, so they were wrong to exempt it. This one
        // is a PENALTY: it costs a hull. Switching it to `openCourse` would not
        // fix a defect, it would newly start wrecking cars in HOT LAP and
        // GAUNTLET on snow worlds, which is a gameplay call and the owner's to
        // make. Left as it is, on purpose, and recorded rather than silently
        // swept in with the boundary fix.
        && !g.freeRoam
        && (this._tyreUnder | 0) > 0 && (this._slick ?? 0) > 0
        && input.throttle > 0.5
        && Math.hypot(this.vel.x, this.vel.z) < 2.0;
      const wasBog = this._bogT ?? 0;
      this._bogT = bogged ? wasBog + dt : 0;
      if (bogged) {
        // Count it down out loud from 2 s in, so the wreck is the end of a
        // warning rather than a surprise. Once a second, not once a frame.
        const left = Math.ceil(BOG_WRECK_S - this._bogT);
        if (this._bogT > 1.6 && Math.ceil(BOG_WRECK_S - wasBog) !== left) {
          g.hud?.feed?.(`DUG IN — WRONG TYRES — ${left}s`, 'bad');
          g.buzz?.(40);
        }
        if (this._bogT >= BOG_WRECK_S) {
          this._bogT = 0;
          g.hud?.feed?.('BOGGED DOWN — HULL LOST', 'bad');
          this.destroy(null);
          return;
        }
      }
      // The wedge net must not fire on a car that is BOGGING: both watch for
      // held throttle and no motion at the same five seconds, and if the free
      // rescue won that race the rule above could never fire at all.
      // JUDGE IT ON DISPLACEMENT, NOT ON THIS FRAME'S SPEED. The test used to
      // be `speed < 0.8` and the timer reset to zero the moment it failed, so
      // ONE frame above 0.8 in five seconds cleared it — and a car grinding on
      // a barrier is never still: it jitters, bounces and scrubs a few
      // centimetres each way for ever. It is going nowhere and it never
      // qualified as wedged. Reported as a car parked in a wall at 0 km/h,
      // lap 0 of 3, thirty-nine seconds in, last of eight.
      //
      // So anchor a position while the throttle is held and ask how far the
      // car has actually got. Six metres of progress clears the anchor and
      // starts again; less than that, held, for five seconds, is stuck —
      // whatever the speedometer flickered to in between. Six metres in five
      // seconds is 4.3 km/h, so a genuine crawl up a bank is never touched.
      const trying = this === g.player && controlsLive && !this.airborne
        && !bogged && input.throttle > 0.5;
      if (!trying) {
        this._wedgeT = 0;
        this._wedgeAt = null;
      } else {
        if (!this._wedgeAt) this._wedgeAt = { x: this.pos.x, z: this.pos.z };
        // 12 m OFF THE COURSE, 6 m otherwise (r294, "gets stuck here" — IL
        // BUDELLO, pinned by a building at 3-8 km/h): the spec engine
        // grinds against obstacles at speeds just over the old 6 m line
        // (4.3 km/h), going nowhere for ever. When the race itself is
        // shouting OFF THE COURSE the player is somewhere the stage does
        // not want them — rescue generously there. Roam and on-course keep
        // the tight line, so a genuine mountain crawl is never yanked.
        const wedgeClear = (this._strayed ?? 0) > 0 ? 12 : 6;
        if (Math.hypot(this.pos.x - this._wedgeAt.x, this.pos.z - this._wedgeAt.z) > wedgeClear) {
          this._wedgeAt = { x: this.pos.x, z: this.pos.z };
          this._wedgeT = 0;
        } else {
          this._wedgeT = (this._wedgeT ?? 0) + dt;
        }
      }
      // UNSTUCK, ON DEMAND. The automatic nets above are deliberately slow —
      // five seconds of held throttle, because an idle car parked on a
      // mountainside must never be yanked off it. That is right for a car the
      // game can TELL is stuck, and useless for the case the player can see
      // and it cannot: nose-in against a rock, rolled into a ditch, facing a
      // wall with the road behind you. So there is a button, and it is the
      // same recovery the nets fire — one path, so a hand-called rescue can
      // never behave differently from an automatic one.
      //
      // It costs 30 seconds of not having it. Free and instant, it is simply
      // a faster route through every corner; on a cooldown it stays what it
      // is for, and you think before spending it.
      //
      // ...AND IT IS FINITE. "Same for the sos. Limited and buyable." A pure
      // cooldown made the rescue an unlimited resource on a long stage — wait
      // half a minute and it is back, for ever — so on the wrong tyres, in
      // the snow, it quietly cancelled the bog rule. A stock car carries ONE
      // charge; the RECOVERY BEACON line sells up to four. The 30 s cooldown
      // stays on top, so two charges are not two rescues in the same corner.
      // CORRIDOR §10 (r301): RECOVERY IS FREE. No counter, no charge, no
      // 30 s tax — a reset costs the stop and the 1.5 s re-arm, nothing
      // else. The ration existed to stop rescue-as-shortcut; the corridor's
      // answer is that a return puts you BACK, not FORWARD, so there is
      // nothing to farm. The RECOVERY BEACON shop line keeps selling
      // nothing until the garage round retires it (noted in HANDOVER).
      // The stuck net fires at stuckDetectS (2.5 s, PATCH_02 fix 14) —
      // recording B sat wedged for 8 seconds waiting for the old 5.
      this.unstuckCool = Math.max(0, (this.unstuckCool ?? 0) - dt);
      const called = this === g.player && controlsLive
        && (input.justPressed?.('KeyR') || this._unstuckReq);
      this._unstuckReq = false;
      const spend = called && this.unstuckCool <= 0;
      const RT4 = DRIVING.route ?? {};
      if (this._lostT > 2.5 || (this._cliffT ?? 0) > 2
          || this._wedgeT > (RT4.stuckDetectS ?? 2.5) || spend) {
        this._lostT = 0;
        this._cliffT = 0;
        this._wedgeT = 0;
        this._bogT = 0;      // a rescue is a successful trial: the clock resets
        if (spend) {
          this.unstuckCool = RT4.playerResetDelayS ?? 1.5;
          g.audio?.pickup?.();
        }
        this.vel.set(0, 0, 0); this.vy = 0; this.airborne = false;
        this._wedgeAt = null;
        // PAST THE TRAP, NOT BACK INTO IT — the rule the rivals' pit-lift
        // already had (see EnemyCar `_liftAhead`) and the player's rescue did
        // not. Re-seating at the SAME index puts a car that is pinned by
        // something ON the road straight back against it, and the next rescue
        // is five seconds later, for ever. Each rescue that follows closely on
        // the last moves further down the lap; a clean minute of driving
        // forgets it.
        if (g.raceTime - (this._lastRescueAt ?? -99) < 25) {
          this._rescueAhead = Math.min(40, (this._rescueAhead ?? 0) + 14);
        } else {
          this._rescueAhead = 0;
        }
        this._lastRescueAt = g.raceTime ?? 0;
        const N = g.track.N;
        // …but never past the gate still owed (r301): the rescue-forward
        // escalation predates the route, and a hop across the next gate
        // would hand the miss logic a car to yank straight back
        let aheadStep = this._rescueAhead;
        const owed = g.route?.gates?.[this._nextGate ?? 0];
        if (owed) {
          const gap = (owed.si - this.trackIndex + N) % N;
          aheadStep = Math.min(aheadStep, Math.max(0, gap - 4));
        }
        this.placeAt((this.trackIndex + aheadStep) % N, 0, true);
        this.invuln = Math.max(this.invuln, 1.5);
        // PATCH_02 §3.7: a rescue must not hand out nitro — the respawn point
        // kept landing ON a pickup and the recording shows 0-188 in 2 s off
        // an Unstuck. Pickups are deaf to this car for a moment.
        this._noPickupT = 1.5;
        g.telemetry?.log('unstuck', { reason: spend ? 'player' : 'auto' });
        // no toast: §8 deletes UNSTUCK and RECOVERED — the reset IS the
        // feedback, and a message on top of a teleport is noise
      }
    }

    if (this.checkLap(prevIndex) && controlsLive) g.onPlayerLap();
    // CORRIDOR §8 (r301): CHECKPOINT MISSED is deleted — v1.3 measured its
    // marquee variant as "more intrusive than the toast it replaced". The
    // wayfinding arrow to the next gate is the live signal now, and the
    // missed-gate RETURN (main._stepRoute) is what actually prevents cut
    // laps instead of scolding them at the line. `_missedCP` still clears
    // (and telemetry still records the refused crossing).
    if (this._missedCP) this._missedCP = false;

    // cannon heat
    if (this.heat > 0) this.heat = Math.max(0, this.heat - dt * (this.overheated ? 0.35 : 0.5));
    if (this.overheated && this.heat < 0.25) this.overheated = false;

    // ---- machine gun: FINITE NOW, and the magazine is a thing you buy.
    //
    // Asked for as "rockets and gun needs to have limited and upgradable
    // slots". Heat alone was never a limit, only a rhythm: cool for a second
    // and you had another belt, so the cannon was an infinite resource and the
    // CANNON CORE upgrade bought nothing but a slightly shorter time-to-kill.
    // A magazine makes every trigger pull a decision and turns MAGAZINE DRUM
    // into the difference between one firefight and three.
    // A DUEL AND A GAUNTLET SAY "NO WEAPONS" ON THE CARD, so the card has to
    // be true: this is the one gate, and it covers the cannon, the rockets and
    // the mines below it. Cleared by _missionReset, never persisted.
    const armed = !g.missionNoGuns;
    if (armed && controlsLive && input.fire && !this.overheated && this.fireCooldown <= 0) {
      if (this.rounds > 0) {
        this.rounds--;
        this.fireCooldown = 0.085;
        this.heat += 0.045;
        if (this.heat >= 1) { this.overheated = true; g.hud.feed('CANNON OVERHEAT', 'bad'); }
        g.weapons.fireBullet(this, this.cannonDamage, 0.022);
        g.audio.shoot();
        if (this.rounds === 0) g.hud.feed('MAGAZINE EMPTY', 'bad');
      } else if (!this._dryFedAt || g.raceTime - this._dryFedAt > 3) {
        // once every three seconds, not once per frame the trigger is held
        this._dryFedAt = g.raceTime;
        g.hud.feed('OUT OF AMMO — PICK UP A CRATE', 'bad');
      }
    }
    // missile
    if (armed && controlsLive && input.justPressed('KeyE')) {
      if (this.missiles > 0) {
        this.missiles--;
        g.weapons.fireMissile(this);
        g.audio.missile();
      } else g.hud.feed('RACK EMPTY', 'bad');
    }
    // mine
    if (armed && controlsLive && input.justPressed('KeyX')) {
      if (this.mines > 0) {
        this.mines--;
        g.weapons.dropMine(this);
        g.hud.feed('MINE DEPLOYED', 'info');
      } else g.hud.feed('NO MINES LEFT', 'bad');
    }
    // shockwave
    if (controlsLive && input.justPressed('KeyQ')) {
      if (this.shockCooldown <= 0) {
        this.shockCooldown = 12;
        g.weapons.fireShockwave(this);
      } else g.hud.feed(`SHOCK IN ${Math.ceil(this.shockCooldown)}s`, 'bad');
    }
    if (this.shockCooldown > 0) this.shockCooldown -= dt;
    // nitro: passive trickle + fire on demand
    this.nitro = Math.min(1, this.nitro + dt * 0.02 * this.nitroRate);
    if (controlsLive && input.justPressed('KeyF')) {
      if (this.nitro >= 0.25) {
        this.boostTimer = Math.max(this.boostTimer, this.nitro * 3.2 * (this.nitroPower ?? 1));
        this.nitro = 0;
        g.hud.feed('NITRO!', 'info');
        g.audio.boost();
      } else g.hud.feed('NITRO LOW', 'bad');
    }

    // exhaust + drift smoke
    const back = this.forward.multiplyScalar(-1);
    const tail = this.pos.clone().addScaledVector(back, 2.4);
    if (inputs.throttle > 0 || this.boostTimer > 0)
      g.particles.exhaust(tail, back, this.glowColor, this.boostTimer > 0);
    const side = new THREE.Vector3(this.forward.z, 0, -this.forward.x);
    const slide = Math.abs(this.vel.dot(side));
    if (slide > 6 && !this.airborne) {
      // drifting is the fast way to bank nitro
      this.nitro = Math.min(1, this.nitro + dt * 0.22 * this.nitroRate * Math.min(1, slide / 14));
      for (const s of [-1, 1]) {
        const wp = this.pos.clone().addScaledVector(back, 1.6).addScaledVector(side, s * 1.1);
        g.particles.driftSmoke(wp);
        if (slide > 10 && Math.random() < 0.5) g.particles.dust(wp, 1);
      }
    }
  }

  destroy(attacker) {
    super.destroy();
    this.game.onPlayerDestroyed(attacker);
  }
}
