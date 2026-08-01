// Procedural race circuit + the sunny off-road world around it.
import * as THREE from 'three';
import {
  roadTexture, wallTexture, groundTexture, buildingTexture,
  chevronTexture, checkerTexture, glowTexture, cloudTexture,
} from './textures.js';

// Hand-designed circuit control points (x, z)
const CONTROL_POINTS = [
  [0, -180], [90, -170], [150, -120], [215, -130], [252, -70],
  [230, 10], [160, 42], [152, 112], [205, 172], [140, 232],
  [40, 202], [-42, 238], [-132, 212], [-162, 130], [-120, 62],
  [-192, 12], [-252, -62], [-212, -142], [-120, -122], [-62, -172],
];

const N = 900;              // centerline samples
export const ROAD_HALF = 9; // drivable half-width
export const WALL_OFF = 10.4;

export class Track {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    scene.add(this.group);

    this.curve = new THREE.CatmullRomCurve3(
      CONTROL_POINTS.map(([x, z]) => new THREE.Vector3(x, 0, z)),
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

    this._buildRoad();
    this._buildWalls();
    this._buildStartGate();
    this._buildBoostPads();
    this._buildEnvironment();
  }

  // ---------- queries ----------
  /** Nearest centerline index; pass previous index as hint for a cheap local search. */
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

  /** Starting grid slots behind the line (slot 0 = pole). */
  gridSlot(slot) {
    const row = Math.floor(slot / 2);
    const i = (N - 10 - row * 8 + N) % N;
    const lateral = (slot % 2 === 0 ? -1 : 1) * 3.6;
    return { index: i, lateral };
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

  // ---------- construction ----------
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
    const tex = roadTexture();
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
    // wooden gate posts + colorful pole banner
    const wood = new THREE.MeshStandardMaterial({ color: 0x6b4423, roughness: 0.85 });
    for (const side of [1, -1]) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.75, 9.5, 10), wood);
      p.position.set(c.x + n.x * 12.5 * side, 4.75, c.z + n.z * 12.5 * side);
      p.castShadow = true;
      this.group.add(p);
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

  _buildBoostPads() {
    // pick straight-ish, well-spaced samples
    this.boostPads = [];
    const tex = chevronTexture();
    const min = 0.004;
    let last = -999;
    for (let i = 40; i < N && this.boostPads.length < 5; i += 10) {
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

  _buildEnvironment() {
    // grass everywhere
    const gtex = groundTexture();
    gtex.repeat.set(48, 48);
    gtex.anisotropy = 4;
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(4200, 4200),
      new THREE.MeshStandardMaterial({ map: gtex, roughness: 1, metalness: 0 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.15;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // sky dome gradient — bright summer day
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(1500, 24, 12),
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          top: { value: new THREE.Color('#3f8de0') },
          horizon: { value: new THREE.Color('#cfeaf7') },
        },
        vertexShader: `varying float vY; void main(){ vY = normalize(position).y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `uniform vec3 top; uniform vec3 horizon; varying float vY;
          void main(){ float t = smoothstep(0.0, 0.5, max(vY, 0.0)); gl_FragColor = vec4(mix(horizon, top, t), 1.0); }`,
      })
    );
    this.scene.add(sky);

    // sun glow
    const sun = new THREE.Mesh(
      new THREE.PlaneGeometry(400, 400),
      new THREE.MeshBasicMaterial({
        map: glowTexture(), color: 0xfff6c8, transparent: true, fog: false,
        depthWrite: false, blending: THREE.AdditiveBlending,
      })
    );
    sun.position.set(500, 900, 400);
    sun.lookAt(0, 0, 0);
    this.scene.add(sun);

    // drifting clouds (billboard sprites)
    const ctex = cloudTexture();
    for (let i = 0; i < 12; i++) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({
        map: ctex, transparent: true, opacity: 0.9, fog: false, depthWrite: false,
      }));
      const a = (i / 12) * Math.PI * 2 + Math.random();
      const r = 550 + Math.random() * 500;
      sp.position.set(Math.cos(a) * r, 190 + Math.random() * 160, Math.sin(a) * r);
      const s = 160 + Math.random() * 180;
      sp.scale.set(s, s * 0.5, 1);
      this.scene.add(sp);
    }

    // rolling hills + rocky peaks on the horizon
    const m4 = new THREE.Matrix4();
    const hills = new THREE.InstancedMesh(
      new THREE.ConeGeometry(1, 1, 7),
      new THREE.MeshStandardMaterial({ color: 0x4e8a3c, flatShading: true, roughness: 1 }),
      40
    );
    const peaks = new THREE.InstancedMesh(
      new THREE.ConeGeometry(1, 1, 5),
      new THREE.MeshStandardMaterial({ color: 0x8d8578, flatShading: true, roughness: 1 }),
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

    this._buildTrees(m4);
    this._buildHuts(m4);
  }

  _buildTrees(m4) {
    // pine trees: instanced trunk + two foliage cones
    const COUNT = 150;
    const trunkGeo = new THREE.CylinderGeometry(0.35, 0.5, 2.4, 7);
    trunkGeo.translate(0, 1.2, 0);
    const lowGeo = new THREE.ConeGeometry(2.6, 4.2, 8);
    lowGeo.translate(0, 4.0, 0);
    const topGeo = new THREE.ConeGeometry(1.8, 3.4, 8);
    topGeo.translate(0, 6.6, 0);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b4423, roughness: 1 });
    const lowMat = new THREE.MeshStandardMaterial({ color: 0x2c6e2a, flatShading: true, roughness: 1 });
    const topMat = new THREE.MeshStandardMaterial({ color: 0x3c8a34, flatShading: true, roughness: 1 });
    const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, COUNT);
    const lows = new THREE.InstancedMesh(lowGeo, lowMat, COUNT);
    const tops = new THREE.InstancedMesh(topGeo, topMat, COUNT);
    lows.castShadow = tops.castShadow = true;

    let placed = 0, guard = 0;
    while (placed < COUNT && guard++ < 4000) {
      let x, z;
      if (placed < COUNT * 0.6) {
        // trackside clusters just beyond the fence
        const i = (Math.random() * N) | 0;
        const side = Math.random() < 0.5 ? 1 : -1;
        const dist = 15 + Math.random() * 24;
        x = this.center[i].x + this.nrm[i].x * side * dist;
        z = this.center[i].z + this.nrm[i].z * side * dist;
      } else {
        // scattered through the valley
        const a = Math.random() * Math.PI * 2;
        const r = 80 + Math.random() * 520;
        x = Math.cos(a) * r;
        z = Math.sin(a) * r;
      }
      if (this._distToTrack(x, z) < 14.5) continue;
      const s = 0.8 + Math.random() * 1.1;
      m4.makeScale(s, s * (0.85 + Math.random() * 0.4), s);
      m4.setPosition(x, 0, z);
      trunks.setMatrixAt(placed, m4);
      lows.setMatrixAt(placed, m4);
      tops.setMatrixAt(placed, m4);
      placed++;
    }
    trunks.count = lows.count = tops.count = placed;
    this.scene.add(trunks, lows, tops);
  }

  _buildHuts(m4) {
    // little wooden huts with pyramid straw roofs
    const COUNT = 14;
    const wallGeo = new THREE.BoxGeometry(1, 1, 1);
    wallGeo.translate(0, 0.5, 0);
    const roofGeo = new THREE.ConeGeometry(0.85, 0.55, 4);
    roofGeo.rotateY(Math.PI / 4);
    const wallMat = new THREE.MeshStandardMaterial({ map: buildingTexture(), roughness: 1 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0xc9a24d, flatShading: true, roughness: 1 });
    const walls = new THREE.InstancedMesh(wallGeo, wallMat, COUNT);
    const roofs = new THREE.InstancedMesh(roofGeo, roofMat, COUNT);
    walls.castShadow = roofs.castShadow = true;
    const q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);

    let placed = 0, guard = 0;
    while (placed < COUNT && guard++ < 800) {
      const i = (Math.random() * N) | 0;
      const side = Math.random() < 0.5 ? 1 : -1;
      const dist = 22 + Math.random() * 40;
      const x = this.center[i].x + this.nrm[i].x * side * dist;
      const z = this.center[i].z + this.nrm[i].z * side * dist;
      if (this._distToTrack(x, z) < 19) continue;
      const w = 9 + Math.random() * 6;
      const h = 5 + Math.random() * 2.5;
      const rot = Math.random() * Math.PI * 2;
      q.setFromAxisAngle(up, rot);
      m4.compose(new THREE.Vector3(x, 0, z), q, new THREE.Vector3(w, h, w));
      walls.setMatrixAt(placed, m4);
      m4.compose(new THREE.Vector3(x, h, z), q, new THREE.Vector3(w * 1.6, h * 1.1, w * 1.6));
      roofs.setMatrixAt(placed, m4);
      placed++;
    }
    walls.count = roofs.count = placed;
    this.scene.add(walls, roofs);
  }
}
