// FADING TYRE-SKID DECALS — PORTED FROM IGNITE RALLY (`src/particles.js:658-736`,
// the `SkidMarks` class), together with the emission gate that drives it
// (`src/vehicles.js:1198-1210`).
//
// dustline lays no rubber at all: a car can be fully sideways on tarmac and the
// road behind it is clean. v1 answers that with one `InstancedMesh` of dark,
// road-hugging quads — cars call `add()` while sliding, each mark sits for a
// few seconds and then shrinks away.
//
// WHAT CAME ACROSS VERBATIM: the quad (0.42 x 1.55, laid flat), the colour
// 0x141009 at opacity 0.42, the polygon offset that keeps it off the road
// surface, `renderOrder = 1` ("above the road, below particles"), the 7-second
// life, the 1.4-second shrink-out, the width scale `0.75 + intensity * 0.5`,
// and the ring-buffer pool with its two typed arrays.
//
// THREE DELIBERATE CHANGES:
//
//   1. THE DEFAULT POOL IS 2000, NOT v1'S 800, and the arithmetic is the
//      reason. A sliding car lays a PAIR of marks every 0.028 s and a mark
//      lives 7 s, so one car sliding continuously holds 7 / 0.028 * 2 = 500
//      slots. v1's 800 covers one and a half cars; dustline races four, and at
//      800 the ring wraps mid-corner and the head of a four-car skid pattern
//      erases its own tail. 4 * 500 = 2000 is the worst case where every racer
//      is sliding at once. See the memory note below for what that costs.
//   2. THE EMISSION CLOCK LIVES HERE, as `due()`. v1 keeps it as `_skidClock`
//      on the car (`vehicles.js:1200`), which is where per-car state belongs in
//      that codebase; dustline's `VehicleController` is physics and has no
//      render state, and the alternative — the caller carrying a clock array
//      next to the render loop — puts v1's 0.028 s constant somewhere it cannot
//      be read next to the 7 s life it has to be balanced against. The interval
//      is unchanged.
//   3. `dispose()` EXISTS. v1 never tears its instance down because that game
//      keeps one for the process lifetime.
//
// NOT CHANGED, AND WORTH KNOWING: a mark is a flat quad at a fixed Y, so it
// does not follow the terrain under it. v1 places them at `car.y + 0.07` and
// the polygon offset absorbs the rest. On dustline's crowned road (12 cm of
// camber, `tracks/terrain.ts`) 7 cm of lift plus the offset clears the crown at
// the centre, but a mark laid on one carriageway and viewed from the other is
// the case that has NOT been checked — it is a flat plane against a curved
// surface, and if it z-fights, the lift is the number to raise.

import * as THREE from 'three';

const _SK_UP = new THREE.Vector3(0, 1, 0);
const _skM = new THREE.Matrix4();
const _skQ = new THREE.Quaternion();
const _skS = new THREE.Vector3();
const _skP = new THREE.Vector3();

const _ZERO_M4 = new THREE.Matrix4().makeScale(0, 0, 0);

/** Seconds a mark lasts before it is gone. v1's. */
const LIFE = 7;
/** Seconds of shrink-out at the end of that life. v1's. */
const FADE = 1.4;
/** Seconds between one car's pairs of marks, from v1's `_skidClock`. */
export const SKID_INTERVAL = 0.028;
/** How many cars `due()` can clock independently. Four racers today; the array
 *  is 32 floats, so this is not worth being tight about. */
const MAX_EMITTERS = 16;

/** Road-hugging dark quads that persist and fade.
 *
 *  MEMORY CEILING AT THE DEFAULT 2000 MARKS: the `instanceMatrix` is
 *  2000 * 16 floats = 128 KB, held on both sides (three.js keeps the CPU copy
 *  it uploads from), plus `life` at 8 KB and `data` at 40 KB, so about 304 KB
 *  total. One geometry, one material, ONE DRAW CALL. Fixed at construction:
 *  the pool never grows, and mark 2001 overwrites the oldest.
 *
 *  THE COST THAT IS NOT MEMORY is overdraw. These are transparent, depth-write
 *  off, and they lie on the most-looked-at surface in the game, so a full pool
 *  in view is 2000 blended quads over the road. `update()` only recomposes
 *  marks inside their last `FADE` seconds — a fifth of the pool at steady state
 *  — but every live mark is still drawn every frame. If that shows up in a
 *  frame-time measurement, the pool size is the knob, not the fade. */
export class SkidMarks {
  readonly mesh: THREE.InstancedMesh;
  private max: number;
  private life: Float32Array;      // seconds remaining (0 = free slot)
  private data: Float32Array;      // x, y, z, heading, width-scale
  private head = 0;
  private clocks = new Float32Array(MAX_EMITTERS);

  /** Number of marks currently alive. Read by tools that measure the pool. */
  alive = 0;

  constructor(scene: THREE.Scene, max = 2000) {
    this.max = max;
    const geo = new THREE.PlaneGeometry(0.42, 1.55);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x141009, transparent: true, opacity: 0.42, depthWrite: false,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    });
    this.mesh = new THREE.InstancedMesh(geo, mat, max);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 1; // above the road, below particles
    this.life = new Float32Array(max);
    this.data = new Float32Array(max * 5);
    _skM.makeScale(0, 0, 0);
    for (let i = 0; i < max; i++) this.mesh.setMatrixAt(i, _skM);
    scene.add(this.mesh);
  }

  /** v1's per-car emission gate, from `vehicles.js:1199-1203`.
   *
   *  Call once per car per rendered frame with whether that car is sliding
   *  hard enough to be leaving rubber. Returns true on the frames where a pair
   *  of marks is due; the clock only runs while `sliding`, so a car that stops
   *  sliding and starts again lays its next mark immediately rather than
   *  wherever the free-running clock happened to be.
   *
   *  v1's slide test is `|lateral velocity| > 6 && speed > 12`, on the ground
   *  and alive. dustline's equivalent inputs are `WheelState.slipping` and
   *  `VehicleController.speedKmh`; which of those the caller uses is the
   *  caller's decision, and this only meters the rate. */
  due(car: number, dt: number, sliding: boolean): boolean {
    if (car < 0 || car >= MAX_EMITTERS) return false;
    if (!sliding) { this.clocks[car] = 0; return false; }
    this.clocks[car] -= dt;
    if (this.clocks[car] > 0) return false;
    // CHANGE 4: THE REMAINDER CARRIES. v1 assigns `_skidClock = 0.028`, which
    // throws away however far past zero the frame went, so the real spacing is
    // the interval rounded UP to a whole frame: at 60 Hz that is 0.0333 s and
    // 30 pairs a second, not the 35.7 the constant says, and the number moves
    // with the frame rate. Measured: 300 pairs over 10 s at 60 Hz against the
    // 357 the interval asks for, and 422 marks over one 7 s mark life against
    // 500. Carrying the remainder is what v1 itself does for ambient weather
    // ("a fractional accumulator keeps rates frame-rate independent"), and the
    // pool arithmetic in the class comment above assumes it.
    //
    // The clamp bounds the debt at one interval: without it a long stall
    // (a tab restored, a level load) would fire on every frame afterwards
    // until it had paid back the whole gap.
    this.clocks[car] = Math.max(-SKID_INTERVAL, this.clocks[car]) + SKID_INTERVAL;
    return true;
  }

  /** Lay one mark. `heading` points along the direction of TRAVEL, not the car
   *  — a car that is sideways still streaks along its velocity — and
   *  `intensity` 0..1 widens it (v1 passes `min(1, |lateralVel| / 16)`). */
  add(x: number, y: number, z: number, heading: number, intensity = 1) {
    const i = this.head;
    this.head = (this.head + 1) % this.max;
    if (this.life[i] <= 0) this.alive++;
    this.life[i] = LIFE;
    const o = i * 5;
    this.data[o] = x; this.data[o + 1] = y; this.data[o + 2] = z;
    this.data[o + 3] = heading;
    this.data[o + 4] = 0.75 + intensity * 0.5;
    this.compose(i, 1);
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  private compose(i: number, fade: number) {
    const o = i * 5;
    _skQ.setFromAxisAngle(_SK_UP, this.data[o + 3]);
    _skS.set(this.data[o + 4] * fade, 1, fade);
    _skP.set(this.data[o], this.data[o + 1], this.data[o + 2]);
    _skM.compose(_skP, _skQ, _skS);
    this.mesh.setMatrixAt(i, _skM);
  }

  update(dt: number) {
    let dirty = false;
    for (let i = 0; i < this.max; i++) {
      if (this.life[i] <= 0) continue;
      this.life[i] -= dt;
      if (this.life[i] <= 0) {
        _skM.makeScale(0, 0, 0);
        this.mesh.setMatrixAt(i, _skM);
        this.alive--;
        dirty = true;
      } else if (this.life[i] < FADE) {
        this.compose(i, this.life[i] / FADE); // shrink out at end of life
        dirty = true;
      }
    }
    if (dirty) this.mesh.instanceMatrix.needsUpdate = true;
  }

  /** Drop every mark on the ground. Swapping level leaves the previous
   *  world's rubber hanging in mid-air over the new one otherwise. */
  reset() {
    this.life.fill(0);
    this.clocks.fill(0);
    this.head = 0;
    this.alive = 0;
    for (let i = 0; i < this.max; i++) this.mesh.setMatrixAt(i, _ZERO_M4);
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  dispose() {
    this.mesh.removeFromParent();
    this.mesh.dispose();
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}
