// One pooled GPU particle system drives every effect: explosions, sparks,
// exhaust, drift smoke, missile trails.
import * as THREE from 'three';
import { particleTexture } from './textures.js';

const MAX = 4000;

const VERT = /* glsl */ `
  attribute float aSize;
  attribute float aAlpha;
  attribute vec3 aColor;
  varying float vAlpha;
  varying vec3 vColor;
  void main() {
    vAlpha = aAlpha;
    vColor = aColor;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (280.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;
const FRAG = /* glsl */ `
  uniform sampler2D uMap;
  varying float vAlpha;
  varying vec3 vColor;
  void main() {
    vec4 tex = texture2D(uMap, gl_PointCoord);
    gl_FragColor = vec4(vColor, tex.a * vAlpha);
  }
`;

export class Particles {
  constructor(scene) {
    this.geo = new THREE.BufferGeometry();
    this.pos = new Float32Array(MAX * 3);
    this.col = new Float32Array(MAX * 3);
    this.size = new Float32Array(MAX);
    this.alpha = new Float32Array(MAX);
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    this.geo.setAttribute('aColor', new THREE.BufferAttribute(this.col, 3).setUsage(THREE.DynamicDrawUsage));
    this.geo.setAttribute('aSize', new THREE.BufferAttribute(this.size, 1).setUsage(THREE.DynamicDrawUsage));
    this.geo.setAttribute('aAlpha', new THREE.BufferAttribute(this.alpha, 1).setUsage(THREE.DynamicDrawUsage));

    // CPU-side state
    this.vel = new Float32Array(MAX * 3);
    this.life = new Float32Array(MAX);
    this.maxLife = new Float32Array(MAX);
    this.drag = new Float32Array(MAX);
    this.grav = new Float32Array(MAX);
    this.shrink = new Float32Array(MAX);
    this.baseSize = new Float32Array(MAX);
    this.head = 0;

    const mat = new THREE.ShaderMaterial({
      uniforms: { uMap: { value: particleTexture() } },
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });
    this.points = new THREE.Points(this.geo, mat);
    this.points.frustumCulled = false;
    scene.add(this.points);
    // park everything far below the world
    for (let i = 0; i < MAX; i++) this.pos[i * 3 + 1] = -9999;
  }

  spawn(x, y, z, vx, vy, vz, color, size, life, { drag = 0, grav = 0, shrink = 0.8 } = {}) {
    const i = this.head;
    this.head = (this.head + 1) % MAX;
    this.pos[i * 3] = x; this.pos[i * 3 + 1] = y; this.pos[i * 3 + 2] = z;
    this.vel[i * 3] = vx; this.vel[i * 3 + 1] = vy; this.vel[i * 3 + 2] = vz;
    this.col[i * 3] = color.r; this.col[i * 3 + 1] = color.g; this.col[i * 3 + 2] = color.b;
    this.life[i] = life; this.maxLife[i] = life;
    this.baseSize[i] = size; this.size[i] = size;
    this.alpha[i] = 1;
    this.drag[i] = drag; this.grav[i] = grav; this.shrink[i] = shrink;
  }

  update(dt) {
    for (let i = 0; i < MAX; i++) {
      if (this.life[i] <= 0) continue;
      this.life[i] -= dt;
      if (this.life[i] <= 0) { this.pos[i * 3 + 1] = -9999; this.alpha[i] = 0; continue; }
      const k = 1 - this.drag[i] * dt;
      this.vel[i * 3] *= k;
      this.vel[i * 3 + 1] = this.vel[i * 3 + 1] * k - this.grav[i] * dt;
      this.vel[i * 3 + 2] *= k;
      this.pos[i * 3] += this.vel[i * 3] * dt;
      this.pos[i * 3 + 1] += this.vel[i * 3 + 1] * dt;
      this.pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt;
      const f = this.life[i] / this.maxLife[i];
      this.alpha[i] = f * f;
      this.size[i] = this.baseSize[i] * (this.shrink[i] + (1 - this.shrink[i]) * f);
    }
    this.geo.attributes.position.needsUpdate = true;
    this.geo.attributes.aColor.needsUpdate = true;
    this.geo.attributes.aSize.needsUpdate = true;
    this.geo.attributes.aAlpha.needsUpdate = true;
  }

  // ---- effect recipes ----
  explosion(p, big = false) {
    const n = big ? 90 : 45;
    const colors = [new THREE.Color('#fff3b0'), new THREE.Color('#ffb52e'), new THREE.Color('#ff5e2e'), new THREE.Color('#d43a1a')];
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = (Math.random() ** 0.6) * (big ? 26 : 15);
      const up = Math.random() * (big ? 20 : 12);
      this.spawn(p.x, p.y + 0.5, p.z,
        Math.cos(a) * r, up, Math.sin(a) * r,
        colors[(Math.random() * colors.length) | 0],
        (big ? 5 : 3.4) * (0.5 + Math.random()),
        0.5 + Math.random() * (big ? 0.9 : 0.5),
        { drag: 2.2, grav: 8, shrink: 0.3 });
    }
    // white flash core
    for (let i = 0; i < 8; i++)
      this.spawn(p.x, p.y + 1, p.z, (Math.random() - 0.5) * 4, Math.random() * 3, (Math.random() - 0.5) * 4,
        new THREE.Color('#ffffff'), big ? 14 : 9, 0.18, { shrink: 1 });
    // smoke
    for (let i = 0; i < (big ? 20 : 10); i++) {
      const a = Math.random() * Math.PI * 2, r = Math.random() * 5;
      this.spawn(p.x + Math.cos(a) * 2, p.y + 1, p.z + Math.sin(a) * 2,
        Math.cos(a) * r, 4 + Math.random() * 5, Math.sin(a) * r,
        new THREE.Color('#4a443c'), 6 + Math.random() * 5, 1.2 + Math.random(), { drag: 1.5, shrink: 0.2 });
    }
  }

  sparks(p, normal, count = 10) {
    const c1 = new THREE.Color('#ffe86b'), c2 = new THREE.Color('#2ef7ff');
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 4 + Math.random() * 10;
      this.spawn(p.x, p.y + 0.3, p.z,
        normal.x * sp + Math.cos(a) * 3, 2 + Math.random() * 5, normal.z * sp + Math.sin(a) * 3,
        Math.random() < 0.6 ? c1 : c2, 1.4 + Math.random(), 0.25 + Math.random() * 0.3,
        { grav: 22, shrink: 0.4 });
    }
  }

  exhaust(p, back, color, boost = false) {
    const c = boost ? new THREE.Color('#ffb32e') : color;
    this.spawn(
      p.x + (Math.random() - 0.5) * 0.5, p.y + 0.35, p.z + (Math.random() - 0.5) * 0.5,
      back.x * (boost ? 26 : 9) + (Math.random() - 0.5) * 2, 0.6, back.z * (boost ? 26 : 9) + (Math.random() - 0.5) * 2,
      c, boost ? 3.4 : 1.7, boost ? 0.4 : 0.28, { drag: 3, shrink: 0.4 });
  }

  driftSmoke(p) {
    // dust kicked up from the dirt
    this.spawn(p.x, p.y + 0.2, p.z,
      (Math.random() - 0.5) * 3, 1.5 + Math.random() * 2, (Math.random() - 0.5) * 3,
      new THREE.Color('#b39a6e'), 2.6 + Math.random() * 2, 0.7 + Math.random() * 0.4,
      { drag: 2, shrink: 0.2 });
  }

  trail(p, color) {
    this.spawn(p.x, p.y, p.z,
      (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2,
      color, 2.2, 0.35, { shrink: 0.5 });
  }

  pickupBurst(p, color) {
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * Math.PI * 2;
      this.spawn(p.x, p.y, p.z, Math.cos(a) * 9, 5 + Math.random() * 4, Math.sin(a) * 9,
        color, 2.2, 0.5, { drag: 2, grav: 6, shrink: 0.4 });
    }
  }
}
