// Procedural race circuit + the whole neon world around it.
import * as THREE from 'three';
import {
  roadTexture, wallTexture, groundTexture, buildingTexture,
  chevronTexture, checkerTexture, sunTexture, glowTexture,
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
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.92, metalness: 0.1 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.receiveShadow = true;
    this.group.add(mesh);
  }

  _wallRibbon(side, hex) {
    const geo = new THREE.BufferGeometry();
    const verts = new Float32Array((N + 1) * 2 * 3);
    const uvs = new Float32Array((N + 1) * 2 * 2);
    const idx = [];
    const h = 1.15;
    for (let i = 0; i <= N; i++) {
      const j = i % N;
      const c = this.center[j], n = this.nrm[j];
      const x = c.x + n.x * WALL_OFF * side, z = c.z + n.z * WALL_OFF * side;
      const o = i * 6;
      verts[o] = x; verts[o + 1] = 0; verts[o + 2] = z;
      verts[o + 3] = x; verts[o + 4] = h; verts[o + 5] = z;
      const u = (i * this.segLen) / 6;
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
    const mat = new THREE.MeshBasicMaterial({ map: wallTexture(hex), side: THREE.DoubleSide });
    this.group.add(new THREE.Mesh(geo, mat));
  }

  _buildWalls() {
    this._wallRibbon(1, '#2ef7ff');   // left rail cyan
    this._wallRibbon(-1, '#ff2fd6');  // right rail magenta
    // support posts
    const count = Math.floor(N / 12);
    const postGeo = new THREE.BoxGeometry(0.55, 2.4, 0.55);
    const postMat = new THREE.MeshStandardMaterial({ color: 0x1a1433, roughness: 0.6, metalness: 0.7 });
    const tipGeo = new THREE.BoxGeometry(0.65, 0.3, 0.65);
    const tipMat = new THREE.MeshBasicMaterial({ color: 0x9d8bff });
    const posts = new THREE.InstancedMesh(postGeo, postMat, count * 2);
    const tips = new THREE.InstancedMesh(tipGeo, tipMat, count * 2);
    const m = new THREE.Matrix4();
    let k = 0;
    for (let i = 0; i < N; i += 12) {
      for (const side of [1, -1]) {
        const c = this.center[i], n = this.nrm[i];
        const x = c.x + n.x * (WALL_OFF + 0.9) * side, z = c.z + n.z * (WALL_OFF + 0.9) * side;
        m.makeTranslation(x, 1.2, z); posts.setMatrixAt(k, m);
        m.makeTranslation(x, 2.55, z); tips.setMatrixAt(k, m);
        k++;
      }
    }
    this.group.add(posts, tips);
  }

  _buildStartGate() {
    const i = 0;
    const c = this.center[i], n = this.nrm[i];
    const heading = this.headingAt(i);
    // checkered strip on the road
    const strip = new THREE.Mesh(
      new THREE.PlaneGeometry(ROAD_HALF * 2 + 2, 4),
      new THREE.MeshBasicMaterial({ map: checkerTexture(), transparent: true, opacity: 0.9 })
    );
    strip.material.map.repeat.set(5, 1);
    strip.rotation.order = 'YXZ';
    strip.rotation.y = heading;
    strip.rotation.x = -Math.PI / 2;
    strip.position.set(c.x, 0.04, c.z);
    this.group.add(strip);
    // pylons + banner
    const pylonGeo = new THREE.BoxGeometry(1.2, 9, 1.2);
    const pylonMat = new THREE.MeshStandardMaterial({ color: 0x141026, metalness: 0.8, roughness: 0.35 });
    const glowMat = new THREE.MeshBasicMaterial({ color: 0x2ef7ff });
    for (const side of [1, -1]) {
      const p = new THREE.Mesh(pylonGeo, pylonMat);
      p.position.set(c.x + n.x * 12.5 * side, 4.5, c.z + n.z * 12.5 * side);
      p.castShadow = true;
      this.group.add(p);
      const edge = new THREE.Mesh(new THREE.BoxGeometry(0.25, 9, 0.25), glowMat);
      edge.position.copy(p.position).add(new THREE.Vector3(0, 0, 0));
      edge.translateX(0.5); // small offset so it reads as a lit edge
      this.group.add(edge);
    }
    const banner = new THREE.Mesh(
      new THREE.BoxGeometry(26, 1.6, 0.8),
      new THREE.MeshStandardMaterial({ color: 0x141026, metalness: 0.7, roughness: 0.4 })
    );
    banner.position.set(c.x, 9.3, c.z);
    banner.rotation.y = heading;
    this.group.add(banner);
    const bannerGlow = new THREE.Mesh(
      new THREE.PlaneGeometry(24, 1.1),
      new THREE.MeshBasicMaterial({ map: checkerTexture(), color: 0x767e96, side: THREE.DoubleSide })
    );
    bannerGlow.material.map.repeat.set(10, 1);
    bannerGlow.position.set(c.x, 9.3, c.z);
    bannerGlow.rotation.y = heading;
    bannerGlow.translateZ(0.45);
    this.group.add(bannerGlow);
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
          new THREE.MeshBasicMaterial({ map: tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })
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
    // ground grid
    const gtex = groundTexture();
    gtex.repeat.set(60, 60);
    gtex.anisotropy = 4;
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(4200, 4200),
      new THREE.MeshBasicMaterial({ map: gtex })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.15;
    this.scene.add(ground);

    // sky dome gradient
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(1500, 24, 12),
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          top: { value: new THREE.Color('#040211') },
          horizon: { value: new THREE.Color('#2b0b40') },
        },
        vertexShader: `varying float vY; void main(){ vY = normalize(position).y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `uniform vec3 top; uniform vec3 horizon; varying float vY;
          void main(){ float t = smoothstep(0.0, 0.42, max(vY, 0.0)); gl_FragColor = vec4(mix(horizon, top, t), 1.0); }`,
      })
    );
    this.scene.add(sky);

    // stars
    const starGeo = new THREE.BufferGeometry();
    const sPos = new Float32Array(1300 * 3);
    const sCol = new Float32Array(1300 * 3);
    const tints = [new THREE.Color('#ffffff'), new THREE.Color('#bfe9ff'), new THREE.Color('#ffd9f4')];
    for (let i = 0; i < 1300; i++) {
      const a = Math.random() * Math.PI * 2;
      const el = Math.random() * Math.PI * 0.46 + 0.06;
      const r = 1350;
      sPos[i * 3] = Math.cos(a) * Math.cos(el) * r;
      sPos[i * 3 + 1] = Math.sin(el) * r;
      sPos[i * 3 + 2] = Math.sin(a) * Math.cos(el) * r;
      const c = tints[(Math.random() * 3) | 0].clone().multiplyScalar(0.4 + Math.random() * 0.6);
      sCol[i * 3] = c.r; sCol[i * 3 + 1] = c.g; sCol[i * 3 + 2] = c.b;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(sCol, 3));
    this.scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({
      size: 2.6, sizeAttenuation: false, vertexColors: true, fog: false,
      transparent: true, opacity: 0.9, depthWrite: false,
    })));

    // synthwave sun
    const sun = new THREE.Mesh(
      new THREE.PlaneGeometry(620, 620),
      new THREE.MeshBasicMaterial({
        map: sunTexture(), transparent: true, fog: false,
        depthWrite: false, blending: THREE.AdditiveBlending,
      })
    );
    sun.position.set(60, 150, -1380);
    this.scene.add(sun);
    const halo = new THREE.Mesh(
      new THREE.PlaneGeometry(1100, 1100),
      new THREE.MeshBasicMaterial({
        map: glowTexture(), transparent: true, fog: false, opacity: 0.35,
        color: 0xff4fc0, depthWrite: false, blending: THREE.AdditiveBlending,
      })
    );
    halo.position.set(60, 130, -1381);
    this.scene.add(halo);

    // mountain rings
    const mountains = new THREE.InstancedMesh(
      new THREE.ConeGeometry(1, 1, 5),
      new THREE.MeshStandardMaterial({ color: 0x150b28, emissive: 0x1c0f3a, emissiveIntensity: 0.35, flatShading: true }),
      70
    );
    const m4 = new THREE.Matrix4();
    for (let i = 0; i < 70; i++) {
      const ring = i < 40 ? 0 : 1;
      const a = (i / (ring === 0 ? 40 : 30)) * Math.PI * 2 + ring * 0.11;
      const r = ring === 0 ? 780 + Math.random() * 90 : 980 + Math.random() * 120;
      const h = (ring === 0 ? 90 : 150) + Math.random() * 110;
      const w = 90 + Math.random() * 130;
      m4.makeScale(w, h, w);
      m4.setPosition(Math.cos(a) * r, h / 2 - 6, Math.sin(a) * r);
      mountains.setMatrixAt(i, m4);
    }
    this.scene.add(mountains);

    // neon towers scattered around (kept off the track)
    const isNearTrack = (x, z, margin) => {
      for (let i = 0; i < N; i += 6) {
        const dx = x - this.center[i].x, dz = z - this.center[i].z;
        if (dx * dx + dz * dz < margin * margin) return true;
      }
      return false;
    };
    const boxGeo = new THREE.BoxGeometry(1, 1, 1);
    boxGeo.translate(0, 0.5, 0);
    for (let batch = 0; batch < 3; batch++) {
      const mat = new THREE.MeshStandardMaterial({
        map: buildingTexture(batch), emissiveMap: buildingTexture(batch),
        emissive: 0xffffff, emissiveIntensity: 0.55,
        color: 0x2a2444, roughness: 0.7, metalness: 0.35,
      });
      const inst = new THREE.InstancedMesh(boxGeo, mat, 34);
      let placed = 0, guard = 0;
      while (placed < 34 && guard++ < 700) {
        const a = Math.random() * Math.PI * 2;
        const r = 120 + Math.random() * 520;
        const x = Math.cos(a) * r, z = Math.sin(a) * r;
        if (isNearTrack(x, z, 42)) continue;
        const w = 12 + Math.random() * 20;
        const h = 26 + Math.random() * 110;
        m4.makeScale(w, h, w);
        m4.setPosition(x, 0, z);
        inst.setMatrixAt(placed++, m4);
      }
      inst.count = placed;
      this.scene.add(inst);
    }
  }
}
