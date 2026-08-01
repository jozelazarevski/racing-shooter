// Procedural race circuits + rich themed worlds around them.
// Three levels share one Track class: the level's theme picks the circuit layout
// and every color in the world (terrain, sky, vegetation, road tint, lighting).
import * as THREE from 'three';
import {
  roadTexture, wallTexture, groundTexture, buildingTexture,
  chevronTexture, checkerTexture, glowTexture, cloudTexture,
  grassTexture, bannerTexture, hazardTexture, crowdTexture, awningTexture,
  finishBannerTexture,
} from './textures.js';

export const LEVELS = [
  { id: 1, name: 'PINE VALLEY',  theme: 'forest' },
  { id: 2, name: 'DUST CANYON',  theme: 'desert' },
  { id: 3, name: 'FROST PEAK',   theme: 'snow' },
];

// Hand-designed circuit control points (x, z) per theme.
const CIRCUITS = {
  // classic forest rally loop
  forest: [
    [0, -180], [90, -170], [150, -120], [215, -130], [252, -70],
    [230, 10], [160, 42], [152, 112], [205, 172], [140, 232],
    [40, 202], [-42, 238], [-132, 212], [-162, 130], [-120, 62],
    [-192, 12], [-252, -62], [-212, -142], [-120, -122], [-62, -172],
  ],
  // wide, fast sweepers with one lazy esses section through the dunes
  desert: [
    [0, -235], [100, -225], [185, -185], [245, -110], [255, -15],
    [230, 80], [160, 150], [70, 180], [-10, 150], [-70, 90],
    [-140, 70], [-215, 125], [-255, 40], [-245, -55], [-200, -135],
    [-120, -190], [-40, -220],
  ],
  // tight, twisty mountain switchbacks
  snow: [
    [0, -215], [85, -210], [160, -185], [150, -110], [215, -125],
    [255, -60], [215, -5], [250, 55], [205, 115], [235, 180],
    [150, 205], [75, 160], [0, 205], [-85, 225], [-145, 165],
    [-105, 100], [-180, 70], [-245, 110], [-255, 25], [-190, -30],
    [-245, -105], [-180, -170], [-90, -145], [-55, -210],
  ],
};

// Every color and density knob per theme. `fogColor…sunIntensity` are exposed
// to main.js via `track.theme`; the rest is internal art direction.
const THEMES = {
  forest: {
    // lighting / fog (plain numbers; also applied to scene.fog by Track itself)
    fogColor: 0xcfe8f5, fogNear: 320, fogFar: 1500,
    hemiSky: 0xbfe0ff, hemiGround: 0x5a8a3c,
    sunColor: 0xfff3d6, sunIntensity: 2.0,
    // sky dome + sun sprite + clouds
    skyTop: '#3f8de0', skyHorizon: '#e8f0d8', sunGlow: 0xfff2b8,
    cloudCount: 12, cloudOpacity: 0.9,
    // terrain vertex colors + ground texture
    terrainLow: '#4f8a35', terrainHigh: '#83b455', terrainDirt: '#9c7a48',
    ground: {},  // groundTexture defaults are the forest palette
    road: {},    // roadTexture defaults are the forest palette
    // horizon silhouettes
    hillColor: 0x4e8a3c, peakColor: 0x8d8578,
    // trees (material color multiplies per-instance HSL variation)
    treeCount: 260, trunkColor: 0x6b4423,
    foliageLow: 0x2c6e2a, foliageTop: 0x3c8a34,
    foliage: { h: 0.29, hVar: 0.06, s: 0.5, sVar: 0.2, l: 0.32, lVar: 0.14 },
    treeSnowCap: false,
    // ground cover
    tuftCount: 1100, grass: {},
    bushCount: 160, bushColor: 0x2f7a30,
    bush: { h: 0.30, hVar: 0.05, s: 0.5, sVar: 0, l: 0.30, lVar: 0.12 },
    rockCount: 130, pebbleCount: 160, rockColor: 0x8d8578, rockSnowCap: false,
    flowerCount: 340, flowerColors: ['#ffe234', '#ff6a8a', '#ffffff', '#ff8a3a', '#c27aff'],
    hutRoof: 0xc9a24d, hayColor: 0xd8b95e,
    // per-level gameplay-placement tuning
    rampMaxCurv: 0.014, padMaxCurv: 0.004, boardMaxCurv: 0.012,
  },
  desert: {
    fogColor: 0xf2ddb6, fogNear: 280, fogFar: 1350,
    hemiSky: 0xffe9c4, hemiGround: 0xc9a86a,
    sunColor: 0xffe6b0, sunIntensity: 2.2,
    skyTop: '#6fa8d8', skyHorizon: '#ffd9a0', sunGlow: 0xffdca0,
    cloudCount: 5, cloudOpacity: 0.55,
    terrainLow: '#c9a86a', terrainHigh: '#e2c78e', terrainDirt: '#b06e3c',
    ground: {
      base: '#c9a86a', bandLight: 'rgba(255,255,255,0.04)', bandDark: 'rgba(0,0,0,0.04)',
      patchA: 'rgba(160,110,60,0.18)', patchB: 'rgba(235,205,140,0.16)',
      speckA: 'rgba(140,90,50,0.7)', speckB: 'rgba(240,225,190,0.8)', speckCount: 90,
    },
    road: {
      base: '#c2a06b', mottleA: [150, 112, 66], mottleB: [214, 180, 126],
      rut: 'rgba(122,86,48,0.55)', rutCore: 'rgba(96,64,34,0.45)', tread: 'rgba(66,42,22,0.5)',
      stoneA: 'rgba(230,210,175,0.7)', stoneB: 'rgba(140,100,62,0.7)',
      fringe: [168, 140, 66], fringeVar: [40, 34, 26],
    },
    hillColor: 0xa85a32, peakColor: 0xc27a4a,
    treeCount: 90, trunkColor: 0x7a5230,
    foliageLow: 0x8a7444, foliageTop: 0x967e4a,
    foliage: { h: 0.10, hVar: 0.05, s: 0.40, sVar: 0.15, l: 0.45, lVar: 0.15 },
    treeSnowCap: false,
    tuftCount: 520, grass: { bladeA: '#8a7a30', bladeB: '#c8b45e' },
    bushCount: 120, bushColor: 0x8a8050,
    bush: { h: 0.12, hVar: 0.04, s: 0.35, sVar: 0.1, l: 0.42, lVar: 0.12 },
    rockCount: 300, pebbleCount: 240, rockColor: 0xb07a52, rockSnowCap: false,
    flowerCount: 90, flowerColors: ['#ffd45e', '#ff8a3a', '#e86a8a'],
    hutRoof: 0xb0794a, hayColor: 0xd8b95e,
    rampMaxCurv: 0.014, padMaxCurv: 0.004, boardMaxCurv: 0.012,
  },
  snow: {
    fogColor: 0xe2edf6, fogNear: 240, fogFar: 1250,
    hemiSky: 0xdfeaf8, hemiGround: 0xb8c6d2,
    sunColor: 0xeaf2ff, sunIntensity: 1.7,
    skyTop: '#7ba8cc', skyHorizon: '#eaf3fa', sunGlow: 0xffffff,
    cloudCount: 9, cloudOpacity: 0.95,
    terrainLow: '#dde8ee', terrainHigh: '#ffffff', terrainDirt: '#b7c4cd',
    ground: {
      base: '#e6edf2', bandLight: 'rgba(255,255,255,0.06)', bandDark: 'rgba(120,150,175,0.06)',
      patchA: 'rgba(165,190,210,0.20)', patchB: 'rgba(255,255,255,0.22)',
      speckA: 'rgba(200,220,235,0.8)', speckB: 'rgba(255,255,255,0.9)', speckCount: 80,
    },
    road: {
      base: '#6f5638', mottleA: [82, 60, 38], mottleB: [130, 102, 70],
      rut: 'rgba(46,32,20,0.6)', rutCore: 'rgba(30,20,12,0.5)', tread: 'rgba(14,9,5,0.55)',
      stoneA: 'rgba(190,200,210,0.7)', stoneB: 'rgba(70,55,40,0.7)',
      fringe: [228, 238, 246], fringeVar: [24, 16, 10],   // snow creeping onto the road
    },
    hillColor: 0xcfdce4, peakColor: 0xeef4f8,
    treeCount: 240, trunkColor: 0x5a4028,
    foliageLow: 0x5a7a62, foliageTop: 0x668a70,
    foliage: { h: 0.38, hVar: 0.04, s: 0.22, sVar: 0.10, l: 0.42, lVar: 0.10 },
    treeSnowCap: true,
    tuftCount: 360, grass: { bladeA: '#5a7a58', bladeB: '#b8d0c0' },
    bushCount: 90, bushColor: 0x9ab8a0,
    bush: { h: 0.40, hVar: 0.05, s: 0.18, sVar: 0.08, l: 0.52, lVar: 0.12 },
    rockCount: 150, pebbleCount: 140, rockColor: 0x9aa6b0, rockSnowCap: true,
    flowerCount: 60, flowerColors: ['#ffffff', '#cfe0ff', '#ffd0e0'],
    hutRoof: 0xe8eef4, hayColor: 0xd8c07a,
    rampMaxCurv: 0.022, padMaxCurv: 0.0075, boardMaxCurv: 0.02,
  },
};

const N = 900;              // centerline samples
export const ROAD_HALF = 9; // drivable half-width
export const WALL_OFF = 10.4;

const SPONSORS = [
  ['AETHER', '#14243a', '#7fd4ff'],
  ['HYPER-FLUX', '#2a1436', '#ff7fd4'],
  ['CLAW TIRES', '#1c1812', '#e8b83a'],
  ['VOLT FUEL', '#26300f', '#d4ff5e'],
  ['RALLY CO.', '#3a1414', '#ffd4c2'],
];

export class Track {
  constructor(scene, level = LEVELS[0]) {
    this.scene = scene;
    this.level = level;
    const T = THEMES[level && level.theme] || THEMES.forest;
    this.T = T;
    // plain-number lighting/fog summary for main.js
    this.theme = {
      fogColor: T.fogColor, fogNear: T.fogNear, fogFar: T.fogFar,
      hemiSky: T.hemiSky, hemiGround: T.hemiGround,
      sunColor: T.sunColor, sunIntensity: T.sunIntensity,
    };
    // levels are self-contained: fog is set here (main.js may re-apply from theme)
    scene.fog = new THREE.Fog(T.fogColor, T.fogNear, T.fogFar);

    this.group = new THREE.Group();
    scene.add(this.group);

    const pts = CIRCUITS[level && level.theme] || CIRCUITS.forest;
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
    this.length = this.curve.getLength();
    this.segLen = this.length / N;

    // curvature per sample (radians of heading change per world unit)
    this.curvature = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const a = this.tan[(i - 8 + N) % N];
      const b = this.tan[(i + 8) % N];
      this.curvature[i] = Math.acos(THREE.MathUtils.clamp(a.dot(b), -1, 1)) / (16 * this.segLen);
    }

    this._checkLayout();

    this.animated = { flags: [], clouds: [] };
    this._buildRoad();
    this._buildWalls();
    this._buildStartGate();
    this._buildRamps();      // ramps claim the straightest sections…
    this._buildBoostPads();  // …then pads fill in around them
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

  // ---------- queries ----------
  nearestIndex(pos, hint = null) {
    let best = -1, bd = Infinity;
    if (hint === null) {
      for (let i = 0; i < N; i += 4) {
        const d = pos.distanceToSquared(this.center[i]);
        if (d < bd) { bd = d; best = i; }
      }
      hint = best; bd = Infinity;
    }
    for (let k = -30; k <= 30; k++) {
      const i = (hint + k + N) % N;
      const d = pos.distanceToSquared(this.center[i]);
      if (d < bd) { bd = d; best = i; }
    }
    return best;
  }

  lateralOffset(pos, i) {
    const dx = pos.x - this.center[i].x, dz = pos.z - this.center[i].z;
    return dx * this.nrm[i].x + dz * this.nrm[i].z;
  }

  pointAt(i, lateral) {
    return new THREE.Vector3(
      this.center[i].x + this.nrm[i].x * lateral, 0,
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

  /** Road surface height at a track position — non-zero on ramps. */
  groundHeightAt(i, lateral) {
    for (const r of this.ramps) {
      const di = (i - r.index + N) % N;
      if (di < r.len && Math.abs(lateral - r.lateral) < r.halfW) {
        return r.height * (di / r.len);
      }
    }
    return 0;
  }

  /** Distance from (x,z) to the nearest centerline sample (coarse). */
  _distToTrack(x, z) {
    let best = Infinity;
    for (let i = 0; i < N; i += 5) {
      const dx = x - this.center[i].x, dz = z - this.center[i].z;
      const d = dx * dx + dz * dz;
      if (d < best) best = d;
    }
    return Math.sqrt(best);
  }

  /** Rolling-hill height used by the terrain mesh and scenery placement. */
  terrainHeight(x, z) {
    const n =
      Math.sin(x * 0.012) * Math.cos(z * 0.010) * 3.4 +
      Math.sin(x * 0.030 + 1.7) * Math.cos(z * 0.026 + 0.6) * 1.7 +
      Math.sin(x * 0.070 + 3.1) * Math.cos(z * 0.062 + 2.2) * 0.7;
    const d = this._distToTrack(x, z);
    const f = THREE.MathUtils.smoothstep(d, 15, 70);
    return n * f;
  }

  // ---------- track construction ----------
  _buildRoad() {
    const geo = new THREE.BufferGeometry();
    const verts = new Float32Array((N + 1) * 2 * 3);
    const uvs = new Float32Array((N + 1) * 2 * 2);
    const idx = [];
    const w = WALL_OFF + 0.6;
    for (let i = 0; i <= N; i++) {
      const j = i % N;
      const c = this.center[j], n = this.nrm[j];
      const o = i * 6;
      verts[o] = c.x + n.x * w; verts[o + 1] = 0; verts[o + 2] = c.z + n.z * w;
      verts[o + 3] = c.x - n.x * w; verts[o + 4] = 0; verts[o + 5] = c.z - n.z * w;
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
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 1, metalness: 0 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.receiveShadow = true;
    this.group.add(mesh);
  }

  _wallRibbon(side) {
    const geo = new THREE.BufferGeometry();
    const verts = new Float32Array((N + 1) * 2 * 3);
    const uvs = new Float32Array((N + 1) * 2 * 2);
    const idx = [];
    const h = 1.35;
    for (let i = 0; i <= N; i++) {
      const j = i % N;
      const c = this.center[j], n = this.nrm[j];
      const x = c.x + n.x * WALL_OFF * side, z = c.z + n.z * WALL_OFF * side;
      const o = i * 6;
      verts[o] = x; verts[o + 1] = 0; verts[o + 2] = z;
      verts[o + 3] = x; verts[o + 4] = h; verts[o + 5] = z;
      const u = (i * this.segLen) / 8;
      uvs[i * 4] = u; uvs[i * 4 + 1] = 0;
      uvs[i * 4 + 2] = u; uvs[i * 4 + 3] = 1;
    }
    for (let i = 0; i < N; i++) {
      const a = i * 2, b = i * 2 + 1, c = i * 2 + 2, d = i * 2 + 3;
      idx.push(a, b, c, b, d, c);
    }
    geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    const mat = new THREE.MeshStandardMaterial({ map: wallTexture(), roughness: 0.9, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    this.group.add(mesh);
  }

  _buildWalls() {
    this._wallRibbon(1);
    this._wallRibbon(-1);
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
    strip.position.set(c.x, 0.04, c.z);
    this.group.add(strip);

    // scaffold towers + banner
    const wood = new THREE.MeshStandardMaterial({ color: 0x5d4426, roughness: 0.85 });
    const steel = new THREE.MeshStandardMaterial({ color: 0x4a4640, roughness: 0.5, metalness: 0.6 });
    for (const side of [1, -1]) {
      const bx = c.x + n.x * 12.5 * side, bz = c.z + n.z * 12.5 * side;
      for (const [ox, oz] of [[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 10, 8), steel);
        leg.position.set(bx + ox, 5, bz + oz);
        leg.castShadow = true;
        this.group.add(leg);
      }
      for (let ly = 2.5; ly <= 8.5; ly += 3) {
        const brace = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.22, 2.1), wood);
        brace.position.set(bx, ly, bz);
        this.group.add(brace);
      }
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.7, 2.6), wood);
      cabin.position.set(bx, 10, bz);
      cabin.castShadow = true;
      this.group.add(cabin);
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
      new THREE.MeshStandardMaterial({ color: 0x24211c, roughness: 0.6, metalness: 0.4 })
    );
    housing.position.set(c.x, 6.6, c.z);
    housing.rotation.y = heading;
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
    this.boostPads = [];
    const tex = chevronTexture();
    const min = this.T.padMaxCurv;
    let last = -999;
    for (let i = 40; i < N && this.boostPads.length < 5; i += 10) {
      if (this.ramps.some((r) => this._circDist(i, r.index) < 50)) continue;
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
        pad.rotation.x = -Math.PI / 2;
        pad.position.set(p.x, 0.06, p.z);
        this.group.add(pad);
      }
    }
  }

  _buildRamps() {
    // launch ramps on the straightest sections of the circuit
    this.ramps = [];
    const woodTex = buildingTexture();
    const hazTex = hazardTexture();
    // rank every window by how straight it is over the ramp's whole length
    const windows = [];
    for (let i = 0; i < N; i += 5) {
      if (i < 60 || i > N - 90) continue; // keep clear of the start gate
      let maxCurv = 0;
      for (let k = -4; k < 22; k++) maxCurv = Math.max(maxCurv, this.curvature[(i + k + N) % N]);
      windows.push({ i, maxCurv });
    }
    windows.sort((a, b) => a.maxCurv - b.maxCurv);
    const chosen = [];
    for (const w of windows) {
      if (chosen.length >= 3) break;
      if (w.maxCurv > this.T.rampMaxCurv) break;
      if (chosen.some((c) => this._circDist(w.i, c) < 180)) continue;
      chosen.push(w.i);
    }
    for (const i of chosen) {
      {
        const lateral = [-3.4, 3.4, 0][this.ramps.length];
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
        g.position.set(p.x, 0, p.z);
        g.rotation.y = this.headingAt(mid);
        this.group.add(g);
      }
    }
  }

  // ---------- environment ----------
  _buildEnvironment() {
    this._buildTerrain();
    this._buildSky();
    const m4 = new THREE.Matrix4();
    this._buildHorizon(m4);
    this._buildForest(m4);
    this._buildGroundCover(m4);
    this._buildHuts(m4);
    this._buildTrackside(m4);
    this._buildBanners();
    this._buildGrandstand();
  }

  _buildTerrain() {
    const T = this.T;
    const SIZE = 4200, SEG = 150;
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
      const h = far
        ? Math.sin(x * 0.012) * Math.cos(z * 0.010) * 3.4 // skip track-distance falloff far away
        : this.terrainHeight(x, z);
      pos.setY(i, h - 0.12);
      const t = THREE.MathUtils.clamp((h + 2) / 7, 0, 1);
      tmp.copy(cLow).lerp(cHigh, t);
      // sprinkle dirt patches
      const dirt = Math.max(0, Math.sin(x * 0.045 + 2) * Math.sin(z * 0.05) - 0.72) * 3;
      tmp.lerp(cDirt, THREE.MathUtils.clamp(dirt, 0, 0.55));
      colors[i * 3] = tmp.r; colors[i * 3 + 1] = tmp.g; colors[i * 3 + 2] = tmp.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    const gtex = groundTexture(T.ground);
    gtex.repeat.set(48, 48);
    gtex.anisotropy = 4;
    const ground = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
      map: gtex, vertexColors: true, roughness: 1, metalness: 0,
    }));
    ground.receiveShadow = true;
    this.scene.add(ground);
  }

  _buildSky() {
    const T = this.T;
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(1500, 24, 12),
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          top: { value: new THREE.Color(T.skyTop) },
          horizon: { value: new THREE.Color(T.skyHorizon) },
        },
        vertexShader: `varying float vY; void main(){ vY = normalize(position).y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `uniform vec3 top; uniform vec3 horizon; varying float vY;
          void main(){ float t = smoothstep(0.0, 0.5, max(vY, 0.0)); gl_FragColor = vec4(mix(horizon, top, t), 1.0); }`,
      })
    );
    this.scene.add(sky);

    const sun = new THREE.Mesh(
      new THREE.PlaneGeometry(400, 400),
      new THREE.MeshBasicMaterial({
        map: glowTexture(), color: T.sunGlow, transparent: true, fog: false,
        depthWrite: false, blending: THREE.AdditiveBlending,
      })
    );
    sun.position.set(500, 900, 400);
    sun.lookAt(0, 0, 0);
    this.scene.add(sun);

    const ctex = cloudTexture();
    for (let i = 0; i < T.cloudCount; i++) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({
        map: ctex, transparent: true, opacity: T.cloudOpacity, fog: false, depthWrite: false,
      }));
      const a = (i / T.cloudCount) * Math.PI * 2 + Math.random();
      const r = 550 + Math.random() * 500;
      sp.position.set(Math.cos(a) * r, 190 + Math.random() * 160, Math.sin(a) * r);
      const s = 160 + Math.random() * 180;
      sp.scale.set(s, s * 0.5, 1);
      this.scene.add(sp);
      this.animated.clouds.push({ sprite: sp, speed: 1.5 + Math.random() * 2.5 });
    }
  }

  _buildHorizon(m4) {
    const T = this.T;
    const hills = new THREE.InstancedMesh(
      new THREE.ConeGeometry(1, 1, 7),
      new THREE.MeshStandardMaterial({ color: T.hillColor, flatShading: true, roughness: 1 }),
      40
    );
    const peaks = new THREE.InstancedMesh(
      new THREE.ConeGeometry(1, 1, 5),
      new THREE.MeshStandardMaterial({ color: T.peakColor, flatShading: true, roughness: 1 }),
      30
    );
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * Math.PI * 2;
      const r = 760 + Math.random() * 110;
      const h = 70 + Math.random() * 90;
      const w = 130 + Math.random() * 150;
      m4.makeScale(w, h, w);
      m4.setPosition(Math.cos(a) * r, h / 2 - 8, Math.sin(a) * r);
      hills.setMatrixAt(i, m4);
    }
    for (let i = 0; i < 30; i++) {
      const a = (i / 30) * Math.PI * 2 + 0.1;
      const r = 980 + Math.random() * 140;
      const h = 160 + Math.random() * 140;
      const w = 120 + Math.random() * 140;
      m4.makeScale(w, h, w);
      m4.setPosition(Math.cos(a) * r, h / 2 - 8, Math.sin(a) * r);
      peaks.setMatrixAt(i, m4);
    }
    this.scene.add(hills, peaks);
  }

  _scatter(count, makePos, place) {
    let placed = 0, guard = 0;
    while (placed < count && guard++ < count * 30) {
      const p = makePos();
      if (!p) continue;
      place(p, placed);
      placed++;
    }
    return placed;
  }

  _trackSidePos(minD, maxD) {
    const i = (Math.random() * N) | 0;
    const side = Math.random() < 0.5 ? 1 : -1;
    const dist = minD + Math.random() * (maxD - minD);
    const x = this.center[i].x + this.nrm[i].x * side * dist;
    const z = this.center[i].z + this.nrm[i].z * side * dist;
    if (this._distToTrack(x, z) < minD - 1) return null;
    return { x, z };
  }

  _buildForest(m4) {
    const T = this.T;
    const COUNT = T.treeCount;
    const trunkGeo = new THREE.CylinderGeometry(0.35, 0.5, 2.4, 7);
    trunkGeo.translate(0, 1.2, 0);
    const lowGeo = new THREE.ConeGeometry(2.6, 4.2, 8);
    lowGeo.translate(0, 4.0, 0);
    const topGeo = new THREE.ConeGeometry(1.8, 3.4, 8);
    topGeo.translate(0, 6.6, 0);
    const trunkMat = new THREE.MeshStandardMaterial({ color: T.trunkColor, roughness: 1 });
    const lowMat = new THREE.MeshStandardMaterial({ color: T.foliageLow, flatShading: true, roughness: 1 });
    const topMat = new THREE.MeshStandardMaterial({ color: T.foliageTop, flatShading: true, roughness: 1 });
    const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, COUNT);
    const lows = new THREE.InstancedMesh(lowGeo, lowMat, COUNT);
    const tops = new THREE.InstancedMesh(topGeo, topMat, COUNT);
    lows.castShadow = tops.castShadow = true;
    // snowy pines get a white cap cone over the upper foliage
    let caps = null;
    if (T.treeSnowCap) {
      const capGeo = new THREE.ConeGeometry(1.35, 2.0, 8);
      capGeo.translate(0, 7.35, 0);
      caps = new THREE.InstancedMesh(
        capGeo,
        new THREE.MeshStandardMaterial({ color: 0xf2f6fa, flatShading: true, roughness: 0.9 }),
        COUNT
      );
    }
    const color = new THREE.Color();
    const F = T.foliage;

    const placed = this._scatter(COUNT,
      () => {
        if (Math.random() < 0.62) return this._trackSidePos(15, 46);
        const a = Math.random() * Math.PI * 2;
        const r = 80 + Math.random() * 560;
        const x = Math.cos(a) * r, z = Math.sin(a) * r;
        if (this._distToTrack(x, z) < 14.5) return null;
        return { x, z };
      },
      (p, k) => {
        const s = 0.75 + Math.random() * 1.25;
        m4.makeScale(s, s * (0.85 + Math.random() * 0.45), s);
        m4.setPosition(p.x, this.terrainHeight(p.x, p.z) - 0.25, p.z);
        trunks.setMatrixAt(k, m4);
        lows.setMatrixAt(k, m4);
        tops.setMatrixAt(k, m4);
        if (caps) caps.setMatrixAt(k, m4);
        // per-tree foliage variation (themed hue band)
        color.setHSL(
          F.h + Math.random() * F.hVar,
          F.s + Math.random() * F.sVar,
          F.l + Math.random() * F.lVar
        );
        lows.setColorAt(k, color);
        tops.setColorAt(k, color.clone().multiplyScalar(1.2));
      });
    trunks.count = lows.count = tops.count = placed;
    this.scene.add(trunks, lows, tops);
    if (caps) { caps.count = placed; this.scene.add(caps); }
  }

  _buildGroundCover(m4) {
    const T = this.T;
    const q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
    // grass tufts: two crossed alpha-cut planes, dense right beside the road
    const gtex = grassTexture(T.grass);
    const tuftGeo = new THREE.PlaneGeometry(1.6, 1.3);
    tuftGeo.translate(0, 0.6, 0);
    const tuftMat = new THREE.MeshStandardMaterial({
      map: gtex, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 1,
    });
    const tufts = new THREE.InstancedMesh(tuftGeo, tuftMat, T.tuftCount * 2);
    let k = 0;
    this._scatter(T.tuftCount,
      () => (Math.random() < 0.7 ? this._trackSidePos(11.2, 32) : this._trackSidePos(26, 62)),
      (p) => {
        const y = this.terrainHeight(p.x, p.z) - 0.05;
        const s = 0.7 + Math.random() * 1.1;
        const rot = Math.random() * Math.PI;
        for (const dr of [0, Math.PI / 2]) {
          q.setFromAxisAngle(up, rot + dr);
          m4.compose(new THREE.Vector3(p.x, y, p.z), q, new THREE.Vector3(s, s, s));
          tufts.setMatrixAt(k++, m4);
        }
      });
    tufts.count = k;
    this.scene.add(tufts);

    // bushes (lush, dry or frosted depending on theme)
    const bushGeo = new THREE.IcosahedronGeometry(1, 0);
    bushGeo.scale(1, 0.62, 1);
    const bushes = new THREE.InstancedMesh(
      bushGeo,
      new THREE.MeshStandardMaterial({ color: T.bushColor, flatShading: true, roughness: 1 }),
      T.bushCount
    );
    const B = T.bush;
    const bcolor = new THREE.Color();
    let bk = 0;
    this._scatter(T.bushCount, () => this._trackSidePos(13, 70), (p) => {
      const s = 0.7 + Math.random() * 1.5;
      m4.makeScale(s, s, s);
      m4.setPosition(p.x, this.terrainHeight(p.x, p.z) + s * 0.3, p.z);
      bushes.setMatrixAt(bk, m4);
      bcolor.setHSL(
        B.h + Math.random() * B.hVar,
        B.s + Math.random() * B.sVar,
        B.l + Math.random() * B.lVar
      );
      bushes.setColorAt(bk++, bcolor);
    });
    bushes.count = bk;
    this.scene.add(bushes);

    // boulders (snow theme gets white caps on top)
    const rocks = new THREE.InstancedMesh(
      new THREE.DodecahedronGeometry(1, 0),
      new THREE.MeshStandardMaterial({ color: T.rockColor, flatShading: true, roughness: 1 }),
      T.rockCount
    );
    rocks.castShadow = true;
    const caps = T.rockSnowCap
      ? new THREE.InstancedMesh(
          new THREE.DodecahedronGeometry(1, 0),
          new THREE.MeshStandardMaterial({ color: 0xf2f6fa, flatShading: true, roughness: 0.9 }),
          T.rockCount
        )
      : null;
    let rk = 0;
    this._scatter(T.rockCount, () => this._trackSidePos(12.5, 90), (p) => {
      const s = 0.5 + Math.random() * 2.2;
      const sy = s * (0.6 + Math.random() * 0.5);
      const y = this.terrainHeight(p.x, p.z) + s * 0.25;
      q.setFromAxisAngle(up, Math.random() * Math.PI * 2);
      m4.compose(new THREE.Vector3(p.x, y, p.z), q, new THREE.Vector3(s, sy, s));
      rocks.setMatrixAt(rk, m4);
      if (caps) {
        m4.compose(
          new THREE.Vector3(p.x, y + sy * 0.55, p.z),
          q, new THREE.Vector3(s * 0.8, sy * 0.4, s * 0.8)
        );
        caps.setMatrixAt(rk, m4);
      }
      rk++;
    });
    rocks.count = rk;
    this.scene.add(rocks);
    if (caps) { caps.count = rk; this.scene.add(caps); }

    // small stones scattered right off the road edge
    const pebbles = new THREE.InstancedMesh(
      new THREE.DodecahedronGeometry(1, 0),
      new THREE.MeshStandardMaterial({ color: T.rockColor, flatShading: true, roughness: 1 }),
      T.pebbleCount
    );
    let pk = 0;
    this._scatter(T.pebbleCount, () => this._trackSidePos(11.3, 16), (p) => {
      const s = 0.12 + Math.random() * 0.32;
      q.setFromAxisAngle(up, Math.random() * Math.PI * 2);
      m4.compose(
        new THREE.Vector3(p.x, this.terrainHeight(p.x, p.z) + s * 0.3, p.z),
        q, new THREE.Vector3(s, s * 0.7, s)
      );
      pebbles.setMatrixAt(pk++, m4);
    });
    pebbles.count = pk;
    this.scene.add(pebbles);

    // one big hero boulder close to the racing line
    const fallbackP = this.pointAt((N * 0.42) | 0, WALL_OFF + 7);
    const hp = this._trackSidePos(14, 18) || { x: fallbackP.x, z: fallbackP.z };
    const hero = new THREE.Mesh(
      new THREE.DodecahedronGeometry(1, 1),
      new THREE.MeshStandardMaterial({ color: T.rockColor, flatShading: true, roughness: 1 })
    );
    hero.scale.set(4.6, 3.3, 4.1);
    hero.rotation.y = 1.3;
    hero.position.set(hp.x, this.terrainHeight(hp.x, hp.z) + 0.9, hp.z);
    hero.castShadow = true;
    this.scene.add(hero);
    if (T.rockSnowCap) {
      const heroCap = new THREE.Mesh(
        new THREE.DodecahedronGeometry(1, 1),
        new THREE.MeshStandardMaterial({ color: 0xf2f6fa, flatShading: true, roughness: 0.9 })
      );
      heroCap.scale.set(3.8, 1.4, 3.4);
      heroCap.rotation.y = 1.3;
      heroCap.position.set(hp.x, hero.position.y + 2.2, hp.z);
      this.scene.add(heroCap);
    }

    // flowers sprinkled close to the road
    const flowers = new THREE.InstancedMesh(
      new THREE.SphereGeometry(0.22, 6, 5),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 }),
      T.flowerCount
    );
    const fcolors = T.flowerColors;
    const fc = new THREE.Color();
    let fk = 0;
    this._scatter(T.flowerCount, () => this._trackSidePos(11.8, 42), (p) => {
      m4.makeScale(1, 1, 1);
      m4.setPosition(p.x, this.terrainHeight(p.x, p.z) + 0.22, p.z);
      flowers.setMatrixAt(fk, m4);
      fc.set(fcolors[(Math.random() * fcolors.length) | 0]);
      flowers.setColorAt(fk++, fc);
    });
    flowers.count = fk;
    this.scene.add(flowers);
  }

  _buildHuts(m4) {
    const COUNT = 14;
    const wallGeo = new THREE.BoxGeometry(1, 1, 1);
    wallGeo.translate(0, 0.5, 0);
    const roofGeo = new THREE.ConeGeometry(0.85, 0.55, 4);
    roofGeo.rotateY(Math.PI / 4);
    const wallMat = new THREE.MeshStandardMaterial({ map: buildingTexture(), roughness: 1 });
    const roofMat = new THREE.MeshStandardMaterial({ color: this.T.hutRoof, flatShading: true, roughness: 1 });
    const walls = new THREE.InstancedMesh(wallGeo, wallMat, COUNT);
    const roofs = new THREE.InstancedMesh(roofGeo, roofMat, COUNT);
    walls.castShadow = roofs.castShadow = true;
    const q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
    let placed = 0;
    this._scatter(COUNT, () => this._trackSidePos(24, 64), (p) => {
      const w = 9 + Math.random() * 6;
      const h = 5 + Math.random() * 2.5;
      const rot = Math.random() * Math.PI * 2;
      const y = this.terrainHeight(p.x, p.z) - 0.6;
      q.setFromAxisAngle(up, rot);
      m4.compose(new THREE.Vector3(p.x, y, p.z), q, new THREE.Vector3(w, h, w));
      walls.setMatrixAt(placed, m4);
      m4.compose(new THREE.Vector3(p.x, y + h, p.z), q, new THREE.Vector3(w * 1.6, h * 1.1, w * 1.6));
      roofs.setMatrixAt(placed++, m4);
    });
    walls.count = roofs.count = placed;
    this.scene.add(walls, roofs);
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
        const p = this.pointAt(i, (WALL_OFF + 2.2) * side);
        const stack = Math.random() < 0.5 ? 3 : 2;
        for (let s = 0; s < stack && tk < 180; s++) {
          m4.makeTranslation(p.x + (Math.random() - 0.5) * 0.4, 0.32 + s * 0.62, p.z + (Math.random() - 0.5) * 0.4);
          tires.setMatrixAt(tk, m4);
          tcolor.set(s === stack - 1 && Math.random() < 0.5 ? 0xd8d2c2 : 0x22201c);
          tires.setColorAt(tk++, tcolor);
        }
      }
    }
    tires.count = tk;
    this.scene.add(tires);

    // hay bales
    const hayGeo = new THREE.CylinderGeometry(0.8, 0.8, 1.5, 10);
    hayGeo.rotateZ(Math.PI / 2);
    const hay = new THREE.InstancedMesh(
      hayGeo, new THREE.MeshStandardMaterial({ color: this.T.hayColor, roughness: 1 }), 50
    );
    hay.castShadow = true;
    let hk = 0;
    this._scatter(50, () => this._trackSidePos(12.5, 20), (p) => {
      q.setFromAxisAngle(up, Math.random() * Math.PI);
      m4.compose(new THREE.Vector3(p.x, this.terrainHeight(p.x, p.z) + 0.8, p.z), q, new THREE.Vector3(1, 1, 1));
      hay.setMatrixAt(hk++, m4);
    });
    hay.count = hk;
    this.scene.add(hay);
  }

  _buildBanners() {
    // sponsor boards facing the track
    const post = new THREE.CylinderGeometry(0.14, 0.16, 3.4, 7);
    const postMat = new THREE.MeshStandardMaterial({ color: 0x4a4640, roughness: 0.6, metalness: 0.5 });
    const boardGeo = new THREE.PlaneGeometry(9, 2.2);
    const mats = SPONSORS.map(([text, bg, fg]) =>
      new THREE.MeshStandardMaterial({ map: bannerTexture(text, bg, fg), roughness: 0.8, side: THREE.DoubleSide }));
    for (let b = 0; b < 10; b++) {
      const i = ((b + 0.5) * N / 10) | 0;
      if (this.curvature[i] > this.T.boardMaxCurv) continue; // keep boards off tight corners
      const side = b % 2 === 0 ? 1 : -1;
      const p = this.pointAt(i, (WALL_OFF + 3.6) * side);
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
      g.rotation.y = this.headingAt(i) + (side > 0 ? Math.PI : 0);
      this.group.add(g);
    }
  }

  _buildGrandstand() {
    // stepped stand full of spectators near the start line
    const i = (N - 40 + N) % N;
    const p = this.pointAt(i, WALL_OFF + 16);
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
}
