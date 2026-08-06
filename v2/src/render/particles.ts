/* Particles: wheel spray, and the dust a rally car drags behind it.
 *
 * This is the biggest single visual gap against v1, and it is not decoration.
 * A gravel stage without dust reads as tarmac; snow without spray reads as
 * white tarmac. The plume is also the clearest feedback the game gives about
 * grip — §8's `utilisation` is exactly "how far into the friction budget this
 * tyre is", so a tyre that is sliding throws visibly more than one that is
 * gripping, and you can see the limit before you feel it.
 *
 * Which particle a surface throws is specified: SURFACES[id].particle is one of
 * dust / stones / mud / grass / sand / snow / spray / splash / none. This reads
 * that field rather than guessing from the surface name.
 *
 * One BufferGeometry, one draw call, a ring buffer of points. No allocation
 * per particle — a rally car at speed emits a few hundred a second, and a
 * garbage collection pause is a physics spiral waiting to happen.
 */
import * as THREE from 'three';
import { SURFACES } from '../../../spec/rally.constants.ts';

const MAX = 1400;

/** Colour and behaviour per §-specified particle kind. */
const KINDS: Record<string, { colour: number; rise: number; drag: number; life: number; size: number }> = {
  dust:   { colour: 0xbda882, rise: 1.5, drag: 1.6, life: 1.5, size: 1.5 },
  stones: { colour: 0x8d8175, rise: 2.6, drag: 0.5, life: 0.9, size: 0.6 },
  mud:    { colour: 0x5b4632, rise: 2.2, drag: 0.9, life: 1.0, size: 0.8 },
  grass:  { colour: 0x6f8b4a, rise: 2.0, drag: 1.1, life: 0.9, size: 0.6 },
  sand:   { colour: 0xd8bd8a, rise: 1.3, drag: 1.9, life: 1.8, size: 1.7 },
  snow:   { colour: 0xf2f6fa, rise: 1.8, drag: 1.5, life: 1.4, size: 1.3 },
  spray:  { colour: 0xdbe6ef, rise: 1.2, drag: 2.1, life: 0.8, size: 1.0 },
  splash: { colour: 0xcfe0ee, rise: 3.0, drag: 1.4, life: 0.7, size: 1.1 },
};

export class Particles {
  readonly points: THREE.Points;

  private readonly pos: Float32Array;
  private readonly col: Float32Array;
  private readonly scl: Float32Array;
  private readonly vel: Float32Array;
  private readonly age: Float32Array;
  private readonly life: Float32Array;
  private readonly rise: Float32Array;
  private readonly drag: Float32Array;
  private next = 0;
  /** Fractional particles carried between frames, so a low emission rate still
   *  produces a steady trickle instead of nothing at all. */
  private debt = 0;

  constructor() {
    this.pos = new Float32Array(MAX * 3);
    this.col = new Float32Array(MAX * 3);
    this.scl = new Float32Array(MAX);
    this.vel = new Float32Array(MAX * 3);
    this.age = new Float32Array(MAX);
    this.life = new Float32Array(MAX);
    this.rise = new Float32Array(MAX);
    this.drag = new Float32Array(MAX);
    this.age.fill(1e9);   // everything starts dead

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    geo.setAttribute('scale', new THREE.BufferAttribute(this.scl, 1));

    // A round soft sprite, drawn in the shader. A texture would be another
    // asset to load and another thing to get wrong offline.
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      vertexColors: true,
      uniforms: { uPixelRatio: { value: Math.min(devicePixelRatio, 2) } },
      vertexShader: `
        attribute float scale;
        varying vec3 vColour;
        varying float vFade;
        uniform float uPixelRatio;
        void main() {
          vColour = color;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          // Size in world units, so a plume does not shrink as it recedes any
          // faster than the world does.
          gl_PointSize = scale * 260.0 * uPixelRatio / max(1.0, -mv.z);
          vFade = clamp(scale, 0.0, 1.0);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        varying vec3 vColour;
        varying float vFade;
        void main() {
          vec2 d = gl_PointCoord - vec2(0.5);
          float r = dot(d, d);
          if (r > 0.25) discard;
          gl_FragColor = vec4(vColour, (1.0 - r * 4.0) * 0.55 * vFade);
        }`,
    });

    this.points = new THREE.Points(geo, mat);
    this.points.frustumCulled = false;   // the plume follows the car everywhere
  }

  /**
   * Emit from one wheel.
   *
   * @param util §8 friction utilisation, 0–1+. Above 1 the tyre is sliding.
   */
  emitWheel(
    x: number, y: number, z: number,
    vx: number, vz: number,
    surfaceId: string,
    speedMs: number,
    util: number,
    dt: number,
  ): void {
    const surface = SURFACES[surfaceId];
    const kind = KINDS[surface?.particle ?? 'none'];
    if (!kind || speedMs < 3) return;

    // Rate rises with speed and much faster with slip: a locked or spinning
    // wheel is what actually throws material.
    const slip = Math.max(0, util - 0.55);
    const rate = Math.min(90, speedMs * 1.6 + slip * 110);
    this.debt += rate * dt;
    const n = Math.floor(this.debt);
    this.debt -= n;

    const c = new THREE.Color(kind.colour);
    for (let i = 0; i < n; i++) {
      const k = this.next;
      this.next = (this.next + 1) % MAX;
      const j = k * 3;
      // Jitter the spawn so a plume has width rather than being a line.
      this.pos[j] = x + (Math.sin(k * 12.9898) * 0.4);
      this.pos[j + 1] = y + 0.05;
      this.pos[j + 2] = z + (Math.cos(k * 78.233) * 0.4);
      // Thrown backwards along travel, plus a little sideways scatter.
      const back = 0.22 + slip * 0.5;
      this.vel[j] = -vx * back + Math.sin(k * 43.7) * 1.3;
      this.vel[j + 1] = kind.rise * (0.6 + slip);
      this.vel[j + 2] = -vz * back + Math.cos(k * 91.3) * 1.3;
      this.col[j] = c.r;
      this.col[j + 1] = c.g;
      this.col[j + 2] = c.b;
      this.age[k] = 0;
      this.life[k] = kind.life * (0.7 + slip * 0.6);
      this.rise[k] = kind.rise;
      this.drag[k] = kind.drag;
      this.scl[k] = kind.size * (0.7 + slip * 0.8);
    }
  }

  /** Integrate and upload. Called once per FRAME, not per physics step —
   *  particles are cosmetic, so they are the one thing allowed to run on
   *  render time (§14.5 forbids gameplay logic doing this, not decoration). */
  update(dt: number): void {
    const { pos, vel, age, life, scl, drag } = this;
    for (let k = 0; k < MAX; k++) {
      const a = age[k]!;
      if (a > life[k]!) {
        // Park dead particles at the origin with zero size so they cost a
        // vertex and nothing else.
        if (scl[k] !== 0) scl[k] = 0;
        continue;
      }
      age[k] = a + dt;
      const j = k * 3;
      const d = 1 - Math.min(1, drag[k]! * dt);
      vel[j] = vel[j]! * d;
      vel[j + 2] = vel[j + 2]! * d;
      vel[j + 1] = vel[j + 1]! * d - 1.4 * dt;   // settles, does not fall like a rock
      pos[j] = pos[j]! + vel[j]! * dt;
      pos[j + 1] = pos[j + 1]! + vel[j + 1]! * dt;
      pos[j + 2] = pos[j + 2]! + vel[j + 2]! * dt;
      // Grow as it disperses, fade via the scale the shader reads.
      const t = age[k]! / life[k]!;
      scl[k] = scl[k]! * (1 + dt * 0.9) * (t > 0.7 ? 0.94 : 1);
    }
    const geo = this.points.geometry;
    geo.getAttribute('position').needsUpdate = true;
    geo.getAttribute('color').needsUpdate = true;
    geo.getAttribute('scale').needsUpdate = true;
  }
}
