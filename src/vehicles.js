// Car meshes (built from primitives), arcade physics, and rival AI.
import * as THREE from 'three';
import { ROAD_HALF, RIM_RADIUS, mergeBoxes } from './track.js';
import { numberPlateTexture } from './textures.js';

const WALL_LIMIT = ROAD_HALF + 0.55; // barrier clamp for car center
const SPRAY_SNOW = new THREE.Color(0xf4faff); // tire spray tints (snow / wet)
/** Seconds of held throttle going nowhere, on a slick surface with the wrong
 *  compound fitted, before the car is written off (see PlayerCar.update). */
const BOG_WRECK_S = 5;
const SPRAY_WET = new THREE.Color(0x9dbcd2);
const FORD_FOAM = new THREE.Color(0xeef7fb); // ---- river-fords: bow-wave white
const GRADE = 16;   // grade force: vf -= GRADE * slope * dt while grounded on-road
const DOWNHILL_CAP = 1.12; // downhill overspeed ceiling (× topSpeed)
// Steepest ground a car can still pull itself up. The drivable massif peaks
// near 24%, so this leaves all of it alone and only ever engages on the border
// wall, which runs an order of magnitude steeper.
const MAX_GRADE = 0.45;
/** Fastest a crest may throw the car upward, u/s. Uncapped, a steep ramp taken
 *  on nitro sent cars 100+ u into the infield. It also bounds a jump: against
 *  gravity 26 this is 0.85 s of hang time and 2.3 u of height before the road
 *  falls away underneath. A car may not launch while the ground is rising
 *  faster than this — see the coherence check in the crest branch. */
const VY_CAP = 11;

const SCORCH = new THREE.Color(0x1c1a18); // damage tint target
const _hitNormal = new THREE.Vector3(); // scratch: obstacle bounce normal
const _splash = new THREE.Vector3();    // scratch: puddle splash spawn point
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
  box(2.5, 0.4, bodyLen - 0.3, darkMat, 0, baseY, 0); // chassis
  box(2.6, bodyH, bodyLen - noseLen, bodyMat, 0, baseY + bodyH / 2 + 0.12, -noseLen / 2, true);
  const nose = new THREE.Mesh(_wedgeGeo(2.6, bodyH, noseLen, { frontDrop, frontBack: 0.14 }), bodyMat);
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
  const WSEG = 14;
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
  return g;
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

export class Car {
  constructor(game, mesh, { maxSpeed = 52, accel = 34, grip = 5.2, steerRate = 2.5, driftLag = 0.22, steerTaper = 0.18 } = {}) {
    this.game = game;
    this.mesh = mesh;
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
    const freeRoam = !!(this.game.freeRoam && this === this.game.player);
    // ---- width-variation: the road edge follows the (possibly pinched)
    // per-sample width profile; defensive — old track builds report ROAD_HALF
    const roadHalfHere = this.game.track?.widthAt?.(this.trackIndex) ?? ROAD_HALF;
    const offRoad = this === this.game.player && Math.abs(this.lateral) > roadHalfHere + 1;
    const offMult = offRoad ? 0.55 + 0.45 * this.offroadSkill : 1;

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
    const f = tyrePenalty(this._tyreOver, this._tyreUnder, slick);
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
    const topSpeed = this.maxSpeed * (boosting ? 1.4 : 1) * offMult * (this._draftOn ? 1.12 : 1);

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
        vf += this.accel * punch * sTract * inputs.throttle * dt;
        this.reverseTimer = 0;
      }
      if (inputs.brake > 0.05) {
        const decel = this.accel * 1.6 * sBrake * inputs.brake * dt;
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
            vf -= this.accel * 0.5 * inputs.brake * dt; // reverse gear engaged
          } else if (vf > 0) {
            vf = Math.max(0, vf - decel); // settle to exactly 0 — no sign flip, ever
          } else if (vf < 0) {
            vf = Math.min(0, vf + decel); // rolling backwards + brake: also settle to 0
          }
        }
      } else {
        this.reverseTimer = 0;
      }
    }
    // ---- grade force: uphill saps speed, downhill feeds it (elevated roads).
    // Guarded — flat tracks / older track builds simply report slope 0.
    let slope = 0;
    if (!inputs.hold && !this.airborne && !offRoad) {
      slope = this.game.track.slopeAt?.(this.trackIndex) ?? 0;
      if (slope !== 0) vf -= GRADE * slope * dt;
    }
    // drag (eased while drifting: slides keep speed; rough going adds a bit off-road)
    vf -= vf * ((sliding ? 0.40 : 0.55) + (offRoad ? 0.35 : 0)) * dt;
    // Slope-aware speed ceiling, matched to the grade/drag equilibrium: a
    // downhill grade EXTENDS top speed proportionally (never past topSpeed *
    // DOWNHILL_CAP) and an uphill grade lowers it, so the engine's surplus
    // thrust can't quietly cancel the climb penalty at the clamp.
    let vCap = topSpeed;
    if (slope > 0) vCap = Math.max(topSpeed * 0.55, topSpeed - (GRADE * slope) / 0.55);
    else if (slope < 0) vCap = Math.min(topSpeed * DOWNHILL_CAP, topSpeed + (GRADE * -slope) / 0.55);
    vf = THREE.MathUtils.clamp(vf, -this.maxSpeed * 0.35, vCap);
    if (boosting) vf = Math.max(vf, this.maxSpeed * 1.05 * offMult);
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
    let slipTarget = THREE.MathUtils.clamp((cornerLoad - (0.28 + 0.05 * hnd) * sGrip) * 1.7, 0, 1);
    if (inputs.drift) slipTarget = 1; // handbrake forces a full slide
    const slipRate = slipTarget > this.slip ? 7 : 3.2; // break loose fast, recover smoothly
    this.slip += (slipTarget - this.slip) * Math.min(1, slipRate * dt);
    let grip = this.grip * (1 + 0.08 * hnd) * (1 - 0.78 * this.slip) * sGrip * (this.gripBoost || 1);
    if (inputs.drift) grip = Math.min(grip, this.grip * 0.22);
    if (this.landGrip > 0) { this.landGrip -= dt; grip *= 0.4; } // loose for ~0.4s after landing
    // ---- river-fords: wet tires. Ford crossings set _wetT=3.5 with a gentle
    // ≈0.8 grip factor fading linearly back to 1; plain puddles keep their
    // short sharp 0.75 slick (_wetMax stays 0 for those).
    // IN the water: aquaplaning. The tyres are riding a film, not the road, and
    // for the fraction of a second you are actually in the ford the car should
    // go light and drift wide if you are turning. Set by the ford pass below,
    // so it lands one frame later — which is the right side of the boundary.
    if (this._fordNow > 0) {
      this._fordNow -= dt;
      grip *= 0.42;
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
        grip *= 1 - loss * Math.max(0, this._wetT) / this._wetMax;
      } else {
        grip *= 0.75;
      }
      if (this._wetT <= 0) this._wetMax = 0;
    }
    // opt-in grip instrument (headless): set __game.__gripProbe = {} to read
    // the lateral grip the player is actually running (wet-tire verification)
    if (this.game.__gripProbe && this === this.game.player) this.game.__gripProbe.grip = grip;
    const vlBefore = vl;
    vl -= vl * Math.min(1, grip * dt);
    // drift reward: convert a slice of the scrubbed-off slide back into forward speed
    if (this.slip > 0.4) vf = Math.min(topSpeed, vf + Math.abs(vlBefore - vl) * 0.35 * (vf >= 0 ? 1 : -1));

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
    let authority = rise * taper * (1 + 0.35 * this.slip); // extra yaw mid-slide for counter-steer
    // A rally car CAN rotate a little in the air — inertia, and a stab of
    // throttle against the driveline — so this is not zero. It is small enough
    // that it reads as tidying the car up for the landing rather than as
    // steering, and it changes the ATTITUDE only: the trajectory is fixed
    // below, whatever the heading ends up being.
    if (this.airborne) authority *= 0.14;
    const dir = vf >= 0 ? 1 : -1;
    const stripSteer = this.stripLock ? this.stripLock.steerMul : 1;
    let dTheta = steer * this.steerRate * sense * camMul * authority * stripSteer * dir * dt;
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
    const lag = this.airborne ? 0 : this.slip * this.driftLag;
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
    const fside = Math.sign(this.lateral) || 1;
    // ---- width-variation: the clamp line follows the pinched road width
    // (cliff worlds have no narrows, so this equals WALL_LIMIT there)
    const wallLim = (t.widthAt?.(this.trackIndex) ?? ROAD_HALF) + 0.55;
    if (Math.abs(this.lateral) > wallLim) {
      if (this !== gm.player) wallHere = true; // AI safety net, all levels
      else if (cliffy) {
        // canyon: rock walls are solid — except the low berm near the start
        // bowl, where the cliffs open up and free-roamers can drive out
        const prof = t._cliffProfile ? t._cliffProfile(this.trackIndex, fside) : null;
        wallHere = !prof || prof.h > 2.5;
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
      const over = this.lateral - fside * wallLim; // ---- width-variation
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
      this.lateral = fside * wallLim; // ---- width-variation
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
            if (this.pos.y < ob.y - 3 || this.pos.y > ob.y + ob.h) continue;
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
        if (ob.mat === 'stone' && !ob.knocked && (ob.r ?? 9) < 1.15
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
        if (ob.mat === 'stone' && !ob.knocked && (ob.r ?? 9) < 1.15
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
        if (Math.abs(this.speedAlong) > 6) gm.onTireSmash?.(st, this);
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
            this.vel.x -= nx * vn * 1.05;
            this.vel.z -= nz * vn * 1.05;
            if (!yields && this.wallGrind <= 0) {
              this.wallGrind = 0.18;
              gm.onTreeCrash?.(tr, this, Math.abs(vn), nx, nz);
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
    // FREE ROAM is exempt on purpose: out there the world is the point, and the
    // rim wall is what bounds it.
    if (!this.game.freeRoam && this === this.game.player && this.speedAlong > 0.5) {
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
      let strayed = Math.abs(this.lateral) - 70;
      if (strayed > 0 && t.nearestIndex && t.lateralOffset) {
        const gi = t.nearestIndex(this.pos);          // no hint: search the lap
        strayed = Math.abs(t.lateralOffset(this.pos, gi)) - 70;
      }
      if (strayed > 0) {
        const over = Math.min(1, strayed / 30);
        this.vel.multiplyScalar(Math.max(0, 1 - over * 1.2 * dt));
        if (over > 0.5 && !this._steepFed) {
          this._steepFed = 1.8;
          this.game.hud?.feed?.('OFF THE COURSE — TURN BACK', 'bad');
        }
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
      const grade = (t.terrainHeight(ax, az) - gY) / AHEAD;
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
    // CLIMBING IS A FUNCTION OF INCLINATION — everywhere, not just the rim.
    //
    // The gate above stops the border wall; this one is the report "climbing
    // the hills needs to be appropriate with the inclination — too steep
    // can't be climbed". The physics: driving force is capped by traction,
    // traction by the normal force, so past tan(θ) ≈ μ the wheels cannot hold
    // and gravity takes the rest. 0.40 (~22°) is the budget — every ROAD in
    // the game grades under 24 % and is exempt anyway (this is off-road only),
    // so nothing on a racing line changes.
    //
    // THE REGRESSION THIS MUST NOT RE-SHIP (see the rim gate's history): the
    // banks beside a switchback stack read near-vertical, and braking there
    // stranded players scrambling BACK to the road. So the rejoin corridor is
    // exempt — this only engages beyond 14 u of lateral, confirmed by a
    // global search before it is believed (the tracked index lies exactly on
    // stacked legs), and the whole check runs only on frames already moving
    // uphill off-road, which is nowhere on a clean lap.
    const CLIMB_MAX = 0.40;
    if (!this.airborne && offRoad && this.alive && this === this.game.player) {
      const v2h = this.vel.x * this.vel.x + this.vel.z * this.vel.z;
      if (v2h > 1) {
        const inv = 1 / Math.sqrt(v2h);
        const dxh = this.vel.x * inv, dzh = this.vel.z * inv;
        const LOOK = 4;
        const gradeUp = (t.terrainHeight(this.pos.x + dxh * LOOK, this.pos.z + dzh * LOOK) - gY) / LOOK;
        if (gradeUp > CLIMB_MAX && Math.abs(this.lateral) > 14) {
          let lat = Math.abs(this.lateral);
          if (t.nearestIndex && t.lateralOffset) {
            const gi = t.nearestIndex(this.pos);   // no hint: search the lap
            lat = Math.abs(t.lateralOffset(this.pos, gi));
          }
          if (lat > 14) {
            const over = Math.min(1, (gradeUp - CLIMB_MAX) / 0.30);
            // traction fades out...
            this.vel.multiplyScalar(Math.max(0, 1 - over * 3.5 * dt));
            // ...and gravity's slope component pushes back down. 26 is the
            // game's own g (the airborne branch integrates with it).
            const gPush = 26 * Math.min(1.2, gradeUp) * over * 0.55;
            this.vel.x -= dxh * gPush * dt;
            this.vel.z -= dzh * gPush * dt;
            if (over > 0.4 && !this._steepFed) {
              this._steepFed = 1.5;
              this.game.hud?.feed?.('TOO STEEP', 'bad');
            }
          }
        }
      }
    }
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
    if (this._steepFed > 0) this._steepFed = Math.max(0, this._steepFed - dt);
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
      this.y += (gY - this.y) * Math.min(1, 12 * dt);
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

  damage(amount, attacker = null) {
    if (!this.alive || this.invuln > 0) return false;
    // survivability: the player's hull takes reduced damage below HARD —
    // crashes still cost (feeds/parts/drama fire off the same events), but
    // a couple of mistakes shouldn't end the race
    if (this === this.game.player) {
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
    if (this.trackIndex > n * 0.4 && this.trackIndex < n * 0.6) this._midCP = true;
    if (prevIndex > n * 0.85 && this.trackIndex < n * 0.15) {
      this._wraps++;                           // distance always counts...
      if (this._midCP === false) return false; // ...but a cut earns no lap
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
    if (gap > 0.02) band = 1 + 0.30 * D.rubberBand * THREE.MathUtils.clamp((gap - 0.02) / 0.10, 0, 1);
    else if (gap < -0.06) band = 1 - 0.12 * D.rubberBand * THREE.MathUtils.clamp((-gap - 0.06) / 0.15, 0, 1);
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
    this._cornerBand = gap > 0.02
      ? 1 + 0.28 * D.rubberBand * THREE.MathUtils.clamp((gap - 0.02) / 0.10, 0, 1)
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
    const latLim = Math.min(7.4, Math.min(wNow, wAhead) - 1.6);
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
    const DECEL = 26;
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
    if (g.player.alive && dist < 70 && this.fireCooldown <= 0) {
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
    if (mCdOk && mDiffOk && mPackOk && mRangeOk && mConeOk) {
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
export const tyrePenalty = (over, under = 0, slick = 0.35) => {
  const s = Math.min(1, Math.max(0, slick));
  // Under-spec was a flat 0.17/class capped at 0.34 — the same price for road
  // rubber on a dry gravel stage as on sheet ice. It now runs 0.11/class on a
  // dry road up to 0.36/class on ice, capped at 0.72 so a two-class mismatch
  // in a blizzard leaves 28 % of the grip: still steerable at a crawl, hopeless
  // at racing pace, which is the shape the complaint asked for.
  const perClass = 0.11 + 0.25 * s;
  return (1 - Math.min(0.20, 0.09 * Math.max(0, over | 0)))
    * (1 - Math.min(0.72, perClass * Math.max(0, under | 0)));
};

export const TYRE_ROAD = 0, TYRE_GRAVEL = 1, TYRE_SNOW = 2;
export const TYRE_LABEL = ['ROAD', 'GRAVEL', 'SNOW'];

/** A car's tyre class before any upgrade, read off the stat it already had. */
export const baseTyreClass = (offroad) =>
  (offroad < 0.5 ? TYRE_ROAD : offroad < 0.85 ? TYRE_GRAVEL : TYRE_SNOW);

/** What this car is running, given its per-car upgrade row. */
export function tyreClass(carKey, upgrades) {
  const c = CAR_CATALOG.find((x) => x.key === carKey);
  if (!c) return TYRE_ROAD;
  const lvl = (upgrades && upgrades.tires) | 0;
  const bump = lvl >= 3 ? 2 : lvl >= 1 ? 1 : 0;
  return Math.min(TYRE_SNOW, baseTyreClass(c.stats.offroad) + bump);
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
    stats: { maxSpeed: 58, accel: 38, grip: 5.00, health: 100, offroad: 0.80, nitroPower: 1.0, plating: 1.0 },
  },
  {
    // Was quietly the best car in the game: the highest grip in the catalogue
    // AND the best acceleration AND good nitro, for 5,000 CR. Rated quickest on
    // 13 of the 21 worlds, which made every machine above it pointless. It is a
    // road hatch now — still the sharpest thing through a dry corner, but short
    // on top end and hopeless once the surface turns.
    key: 'sleek', name: 'SLEEK', price: 4000, desc: 'Nimble hatch',
    spec: { name: 'SLEEK', style: 'sleek', body: 0xf2c81e, accent: 0xe8b83a, stripe: [0x241d16], number: 1, brand: 'APEX', rims: GOLD },
    stats: { maxSpeed: 54, accel: 40, grip: 5.60, health: 90, offroad: 0.45, nitroPower: 1.15, plating: 1.10 },
  },
  {
    key: 'crown', name: 'CROWN', price: 8000, desc: 'Fast on tarmac',
    spec: { name: 'CROWN', style: 'crown', body: 0x2440b8, accent: 0x1a2c8a, stripe: [GOLD, 0xf2f0e8], number: 1, brand: 'APEX', rims: GOLD },
    stats: { maxSpeed: 63, accel: 37, grip: 4.60, health: 85, offroad: 0.42, nitroPower: 1.05, plating: 1.05 },
  },
  {
    key: 'dune', name: 'DUNE', price: 13000, desc: 'Off-road king',
    spec: { name: 'DUNE', style: 'dune', body: 0xdce8f0, accent: 0x4a9ad8, stripe: [GOLD], number: 1, brand: 'APEX', rims: GOLD },
    stats: { maxSpeed: 56, accel: 38, grip: 5.15, health: 105, offroad: 1.00, nitroPower: 0.95, plating: 0.95 },
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
    stats: { maxSpeed: 60, accel: 42, grip: 5.45, health: 82, offroad: 0.44,
      nitroPower: 1.10, plating: 1.0 },
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
    stats: { maxSpeed: 59, accel: 38, grip: 5.20, health: 118, offroad: 0.88,
      nitroPower: 1.0, plating: 1.12 },
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
    stats: { maxSpeed: 57, accel: 39, grip: 5.25, health: 95, offroad: 0.85, nitroPower: 1.20, plating: 1.05 },
  },
  {
    // The most expensive machine in the game could not win a lap anywhere — it
    // was sold purely on hull, which makes 40,000 CR a strange ask. Heavy but
    // planted: it now has the grip to own a fast, dry, flowing circuit, and
    // still takes the least damage doing it.
    key: 'pit', name: 'PIT-99', price: 32000, desc: 'Armored bruiser',
    spec: { name: 'PIT-99', style: 'pit', body: 0x1c1a18, accent: 0x2a2724, stripe: [GOLD], number: 1, brand: 'APEX', rims: GOLD },
    stats: { maxSpeed: 60, accel: 36, grip: 5.05, health: 130, offroad: 0.55, nitroPower: 0.90, plating: 0.78 },
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
    this.unstuckCool = 0;   // UNSTUCK button: 30 s between calls
    this.missiles = 3;
    this.maxMissiles = 5;
    this.mines = 2;
    this.maxMines = 4;
    this.nitro = 0.3;       // 0..1, charged by drifting, kills and pickups
    this.shockCooldown = 0; // seconds until the shockwave is ready
    this.cannonDamage = 7;  // upgrade hook — garage sets this after resetRace
    this.nitroRate = 1;     // upgrade hook — multiplies all nitro gains here
    this.glowColor = new THREE.Color(0x9a938a); // exhaust smoke tint
    this.bestLap = Infinity;
    this.lapStart = 0;
  }

  update(dt, input) {
    const g = this.game;
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
      const wedged = this === g.player && controlsLive && !this.airborne
        && !bogged
        && input.throttle > 0.5
        && Math.hypot(this.vel.x, this.vel.z) < 0.8;
      this._wedgeT = wedged ? (this._wedgeT ?? 0) + dt : 0;
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
      this.unstuckCool = Math.max(0, (this.unstuckCool ?? 0) - dt);
      const called = this === g.player && controlsLive
        && (input.justPressed?.('KeyR') || this._unstuckReq);
      this._unstuckReq = false;
      const spend = called && this.unstuckCool <= 0;
      if (called && !spend) {
        g.hud.feed(`UNSTUCK RECHARGING — ${Math.ceil(this.unstuckCool)}s`, 'bad');
      }
      if (this._lostT > 2.5 || this._wedgeT > 5 || spend) {
        this._lostT = 0;
        this._wedgeT = 0;
        this._bogT = 0;      // a rescue is a successful trial: the clock resets
        if (spend) { this.unstuckCool = 30; g.audio?.pickup?.(); }
        this.vel.set(0, 0, 0); this.vy = 0; this.airborne = false;
        this.placeAt(this.trackIndex, 0, true);
        this.invuln = Math.max(this.invuln, 1.5);
        g.hud.feed(spend ? 'UNSTUCK — back on the road' : 'RECOVERED', 'info');
      }
    }

    if (this.checkLap(prevIndex) && controlsLive) g.onPlayerLap();

    // cannon heat
    if (this.heat > 0) this.heat = Math.max(0, this.heat - dt * (this.overheated ? 0.35 : 0.5));
    if (this.overheated && this.heat < 0.25) this.overheated = false;

    // machine gun
    if (controlsLive && input.fire && !this.overheated && this.fireCooldown <= 0) {
      this.fireCooldown = 0.085;
      this.heat += 0.045;
      if (this.heat >= 1) { this.overheated = true; g.hud.feed('CANNON OVERHEAT', 'bad'); }
      g.weapons.fireBullet(this, this.cannonDamage, 0.022);
      g.audio.shoot();
    }
    // missile
    if (controlsLive && input.justPressed('KeyE')) {
      if (this.missiles > 0) {
        this.missiles--;
        g.weapons.fireMissile(this);
        g.audio.missile();
      } else g.hud.feed('NO MISSILES', 'bad');
    }
    // mine
    if (controlsLive && input.justPressed('KeyX')) {
      if (this.mines > 0) {
        this.mines--;
        g.weapons.dropMine(this);
        g.hud.feed('MINE DEPLOYED', 'info');
      } else g.hud.feed('NO MINES', 'bad');
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
