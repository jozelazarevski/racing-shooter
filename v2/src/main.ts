/* IGNITE RALLY v2 — boot, loop, HUD.
 *
 * Phases 1 and 2 in one runnable page: a specified world (corridor, grading,
 * scatter, lint) driven by a specified vehicle (Rapier, fixed 1/120 s, Pacejka,
 * SI units), all of it seeded so any bug reproduces from the stage id alone.
 */
import * as THREE from 'three';
import { STAGES, buildStage, type Stage } from './world/stage.ts';
import { lintStage, lintSummary } from './world/lint.ts';
import { sampleHeight } from './world/terrain.ts';
import { initPhysics, createWorld, probeGround, FixedStepper, type PhysicsWorld } from './physics/world.ts';
import { Vehicle, WHEEL_RADIUS, type DriverInput } from './physics/vehicle.ts';
import { Input, type Scheme } from './core/input.ts';
import { createRenderer, type Renderer } from './render/scene.ts';
import { fingerprint } from './core/stageRng.ts';
import { RaceDirector, formatTime, formatDelta } from './race/director.ts';
import { RoadDriver } from './race/driver.ts';
import { CutMonitor, ResetMonitor, nodeFor } from './race/reset.ts';
import {
  ITINERARY, classification, completeLeg, damageClass, emptyRally, isComplete,
  legFor, loadRally, saveRally, unlocked, type RallyState,
} from './race/rally.ts';
import { Cannon } from './combat/weapons.ts';
import { SIM, RESET, VEHICLE } from '../../spec/rally.constants.ts';

const $ = (id: string) => document.getElementById(id)!;

/* The five v1 cameras, brought across with their numbers.
 *
 * v1's "units" and v2's metres are the same scale — a car is 4.4 u there and
 * 4.2 m here — so the figures transfer directly. The reasoning behind them is
 * worth keeping too, because every one was a response to a specific complaint:
 *
 *   CHASE once sat at h 7.5 / back 13 / look 10 — bumper height and close
 *   enough that the car filled the screen, so you could not see far enough up
 *   the road to place the next corner. Lifted, pulled back, look-ahead pushed
 *   well down the road.
 *
 *   TRAIL sits between the overhead family and the chase family and exists for
 *   ONE reason: spotting rocks. From TOP-DOWN (52 up, 20 back — 69 degrees of
 *   elevation, 56 away) a boulder is a flat disc against flat ground: no side
 *   face, no useful shadow, and the car is small enough that judging a gap is
 *   guesswork. At 51 degrees and 33 away every solid shows its side and its
 *   cast shadow, and the car is roughly twice the size on screen.
 *
 * `chase` selects the yaw source. A chase camera follows the car's own
 * heading; the overhead ones follow the damped direction of travel, because at
 * that distance raw heading whips on every steering flick.
 */
const CAMS = [
  { name: 'TOP-DOWN',  back: 20, h: 52,   look: 7,  lookH: 0,   spdBack: 6, spdH: 10, chase: false, steer: 1.00, fov: 60 },
  { name: 'TOP FAR',   back: 24, h: 84,   look: 1,  lookH: 0,   spdBack: 4, spdH: 10, chase: false, steer: 1.00, fov: 60 },
  { name: 'TRAIL',     back: 21, h: 26,   look: 15, lookH: 1.6, spdBack: 5, spdH: 6,  chase: true,  steer: 0.90, fov: 62 },
  { name: 'CHASE',     back: 17, h: 11.5, look: 19, lookH: 3.2, spdBack: 4, spdH: 2,  chase: true,  steer: 0.76, fov: 64 },
  { name: 'CHASE FAR', back: 26, h: 17,   look: 22, lookH: 3.4, spdBack: 4, spdH: 2,  chase: true,  steer: 0.84, fov: 66 },
  { name: 'BONNET',    back: -0.4, h: 1.35, look: 22, lookH: 1.2, spdBack: 0, spdH: 0, chase: true, steer: 0.55, fov: 72 },
];

class Game {
  stage!: Stage;
  phys!: PhysicsWorld;
  car!: Vehicle;
  view!: Renderer;
  input!: Input;
  stepper = new FixedStepper();
  camIndex = 0;
  private camPos = new THREE.Vector3();
  private camLook = new THREE.Vector3();
  /** Damped direction of travel, for the overhead views. */
  private travelYaw = 0;
  /** Damped camera yaw, so switching views does not snap. */
  private camYaw = 0;
  /** Last steering input, for the camera's lead into a corner. */
  private lastSteer = 0;
  private last = 0;
  private frames = 0;
  private fps = 0;
  private fpsClock = 0;
  race!: RaceDirector;
  rival!: Vehicle;
  rivalDriver!: RoadDriver;
  private playerDriver!: RoadDriver;
  cannon!: Cannon;
  /** Arcade score, v1's currency: points for what you destroy. */
  score = 0;
  /** The rally this stage belongs to. Loaded before the stage builds, because
   *  it decides how bent the car starts. */
  rally: RallyState = emptyRally();
  /** True when this run counts toward the classification — you are driving the
   *  leg you are ON, not practising one you have already passed. */
  isCurrentLeg = false;

  /** Progress along the centreline. Exposed so the headless harness can drive
   *  the race without reaching into a private field. */
  playerDriverState(x: number, z: number) {
    return this.playerDriver.locate(x, z);
  }

  /** The driver that tracks the player's car — and, in a reference lap, drives
   *  it. Exposed for the same reason: a harness that made its own would be
   *  carrying a second cursor that no reset ever re-seats. */
  get referenceDriver(): RoadDriver {
    return this.playerDriver;
  }

  async boot(stageId: string): Promise<void> {
    const def = STAGES.find((s) => s.id === stageId) ?? STAGES[0]!;
    setStatus(`Building ${def.name}…`);
    await new Promise((r) => setTimeout(r, 16));   // let the message paint

    const t0 = performance.now();
    this.stage = buildStage(def);
    const buildMs = performance.now() - t0;

    // The lint runs on every boot, in the browser. A stage that fails §15 says
    // so on screen rather than shipping quietly — "fails loudly", as specified.
    const results = lintStage(this.stage);
    const summary = lintSummary(results);

    setStatus('Starting physics…');
    await initPhysics();
    this.phys = createWorld(this.stage.heightfield, this.stage.objects);

    const first = this.stage.corridor.segments[0]!;
    const heading = Math.atan2(first.hx, first.hz);
    this.car = new Vehicle(
      this.phys,
      first.x,
      // Rest height: wheel attach 0.30 below the origin, contact 0.46 below
      // that at the static compression the spring rate implies.
      sampleHeight(this.stage.heightfield, first.x, first.z) + 0.52,
      first.z,
      heading,
    );
    this.car.surface = first.surfaceId as typeof this.car.surface;
    this.car.compound = def.surface === 'tarmac' ? 'tarmac_slick' : def.surface === 'snow' ? 'snow_studded' : 'gravel';

    // §11.2.6, the whole point of the rally: damage is not repaired by a reset,
    // and only a service park repairs it — so it arrives with the car. A leg
    // you are re-driving for practice starts fresh, because its result does not
    // count toward the classification either.
    this.isCurrentLeg = legFor(def.id) === this.rally.leg && !this.rally.retired;
    if (this.isCurrentLeg) this.car.damageJ = this.rally.damageJ;

    // The rival. Same Vehicle class, same physics, same tyres — the only
    // difference is who supplies the input. A rival on a different model would
    // teach the player the wrong thing about grip.
    // It drives the stage's own racing line, at a fraction of that line's speed
    // profile. `bias` holds it 2 m off the line for the first 120 m so the
    // start straight is not a fight for the same piece of road, then fades.
    this.rivalDriver = new RoadDriver(this.stage.corridor, 0.82, {
      line: this.stage.line,
      bias: 2.0,
    });
    this.rival = new Vehicle(
      this.phys,
      first.x + -first.hz * 2.6,
      sampleHeight(this.stage.heightfield, first.x, first.z) + 0.52,
      first.z + first.hx * 2.6,
      heading,
    );
    this.rival.surface = this.car.surface;
    this.rival.compound = this.car.compound;

    // The player gets a RoadDriver too — not to drive, only to track progress
    // along the centreline with a monotonic cursor. A nearest-segment search
    // over the whole stage would jump between the two legs of a switchback.
    this.playerDriver = new RoadDriver(this.stage.corridor, 1, { line: this.stage.line });
    // The finish line is the LAST SEGMENT, not the stage length. Those are not
    // the same number: the last segment sits one step short of the total, and
    // the cursor can never report more than it.
    const last = this.stage.corridor.segments[this.stage.corridor.segments.length - 1]!;
    this.race = new RaceDirector(def.id, this.stage.length, last.distance);
    this.cannon = new Cannon(this.phys);

    const canvas = $('view') as HTMLCanvasElement;
    this.view = createRenderer(canvas, this.stage);
    this.input = new Input();
    this.input.bindTouchButtons(document);
    this.input.bindJoystick($('pad'), $('pad-base'), $('pad-knob'));
    addEventListener('resize', () => this.view.resize());

    $('stage-name').textContent = def.name;
    const legIndex = legFor(def.id);
    $('stage-sub').textContent =
      (legIndex >= 0 ? `SS${legIndex + 1}/${ITINERARY.length} · ` : '') +
      `${def.country} · ${def.surface} · ${(this.stage.length / 1000).toFixed(2)} km · ` +
      `${this.stage.corners.length} corners` +
      (this.isCurrentLeg && this.rally.damageJ > 0
        ? ` · carrying ${(this.rally.damageJ / 1000).toFixed(0)} kJ`
        : '') +
      // A run that does not count must say so while you are driving it, not
      // only when you cross the line.
      (legIndex >= 0 && !this.isCurrentLeg
        ? this.rally.retired ? ' · RETIRED — practice only' : ' · practice — does not count'
        : '');
    $('build-info').innerHTML =
      `built in ${buildMs.toFixed(0)} ms · ${this.stage.objects.length.toLocaleString()} objects · ` +
      `seed ${this.stage.rng.seed} · fingerprint <b>${fingerprint(this.stage.objects)}</b><br>` +
      `§15 lint: <b class="${summary.ok ? 'ok' : 'bad'}">${summary.passed} pass, ${summary.failed} fail</b>, ${summary.skipped} not yet implementable` +
      (summary.ok ? '' : `<br>${results.filter((r) => r.status === 'fail').map((r) => `${r.id}: ${r.detail}`).join('<br>')}`);

    this.travelYaw = heading;
    this.camYaw = heading;
    // CHASE is index 3 and is the one to open on: TOP-DOWN first would start
    // every stage looking straight down at a car you cannot place.
    this.camIndex = 3;

    setStatus('');
    this.last = performance.now();
    requestAnimationFrame(this.frame);
  }

  private frame = (now: number): void => {
    const dt = (now - this.last) / 1000;
    this.last = now;

    if (this.input.takeCamera()) this.camIndex = (this.camIndex + 1) % CAMS.length;
    if (this.input.takeReset()) this.resetToRoad();

    // Physics: fixed step, input sampled inside it (§14.1, §14.2).
    this.stepper.advance(dt, (h) => {
      const cmd = this.input.sample(h);
      // Held on the line until the lights go out — but steering still works, so
      // you can set the car up rather than stare at a frozen screen.
      const player = this.race.locked ? { ...cmd, throttle: 0, brake: 1 } : cmd;
      this.lastSteer = cmd.steer;
      this.car.step(player, h);

      // NOTE: the tracer meshes are updated once per FRAME, in syncCar. An
      // earlier copy of that block also ran here, inside the fixed step, which
      // meant rebuilding 24 instance matrices up to five times per frame and
      // throwing away four of the five. Rendering does not belong in the
      // physics loop even when it is cheap.
      const rp = this.rival.body.translation();
      const rq = this.rival.body.rotation();
      const rvx = 2 * (rq.x * rq.z + rq.w * rq.y);
      const rvz = 1 - 2 * (rq.x * rq.x + rq.y * rq.y);
      const rivalCmd = this.rivalDriver.drive(rp.x, rp.z, rvx, rvz, this.rival.telemetry.speedMs);
      this.rival.step(this.race.locked ? { ...rivalCmd, throttle: 0, brake: 1 } : rivalCmd, h);

      this.stepWeapons(cmd, h);
      this.phys.world.step();
      this.phys.time += h;

      const pp = this.car.body.translation();
      this.race.update(h, this.playerDriver.locate(pp.x, pp.z).distance);
    });

    // Real frame time. §11.1's delays are in seconds of stage time, so feeding
    // this a constant meant they ran at whatever multiple of real time the
    // constant happened to be — three times fast at 60 fps, seven times fast in
    // the headless harness, which is how Fafe's smoke dummy came to be "stuck"
    // 0.8 s after it stopped rather than 6 s.
    this.enforceWorldBounds(Math.min(dt, 0.25));
    this.emitParticles(dt);
    this.syncCar();
    this.updateCamera(dt);
    this.view.followSun(this.car.body.translation().x, this.car.body.translation().y, this.car.body.translation().z);
    this.updateHud();

    this.frames++;
    this.fpsClock += dt;
    if (this.fpsClock >= 0.5) {
      this.fps = this.frames / this.fpsClock;
      this.frames = 0;
      this.fpsClock = 0;
    }

    this.view.renderer.render(this.view.scene, this.view.camera);
    requestAnimationFrame(this.frame);
  };

  /** Weapons, inside the fixed step like everything else, so a shell's flight
   *  does not depend on the frame rate either. */
  stepWeapons(cmd: DriverInput, h: number): void {
    if (cmd.fire && !this.race.locked) this.fireCannon();
    for (const hit of this.cannon.step(h, this.car.body, this.rival.body)) this.onHit(hit);
  }

  /** Muzzle position and direction: from the nose, along the car's heading. */
  private fireCannon(): void {
    const p = this.car.body.translation();
    const q = this.car.body.rotation();
    const fx = 2 * (q.x * q.z + q.w * q.y);
    const fy = 2 * (q.y * q.z - q.w * q.x);
    const fz = 1 - 2 * (q.x * q.x + q.y * q.y);
    const v = this.car.body.linvel();
    if (this.cannon.fire(p.x + fx * 2.4, p.y + 0.5, p.z + fz * 2.4, fx, fy + 0.02, fz, v.x, v.y, v.z)) {
      // Recoil, in the right direction and the right order of magnitude:
      // 0.9 kg at 400 m/s is 360 N.s against 1230 kg, so about 0.3 m/s. Enough
      // to feel at the limit, not enough to be a weapon against yourself.
      const j = this.cannon.spec.mass * this.cannon.spec.muzzle;
      this.car.body.applyImpulse({ x: -fx * j, y: 0, z: -fz * j }, true);
    }
  }

  /** What a hit does. Scoring follows §3.1 tiers, so the same silhouette that
   *  tells you what an object does to your car tells you what it is worth. */
  private onHit(hit: ReturnType<Cannon['step']>[number]): void {
    const SCORE: Record<number, number> = { 0: 0, 1: 5, 2: 12, 3: 40, 4: 0 };
    if (hit.destroyed && hit.object) this.score += SCORE[hit.object.tier] ?? 0;
    if (hit.hitRival) {
      this.rival.registerImpact(Math.sqrt((2 * hit.energyJ) / 1230), 90);
      this.score += 150;
    }
    // Debris burst, coloured by what was struck.
    this.view.particles.burst(hit.x, hit.y, hit.z, hit.destroyed ? 26 : 12,
      hit.object && hit.object.tier >= 3 ? 0x6b5a3e : hit.destroyed ? 0x6d8a4a : 0xffc27a);
    if (hit.destroyed && hit.object) this.view.hideObject(hit.object.id);
  }

  /** Wheel spray. Emitted per FRAME, not per physics step: particles are
   *  cosmetic, and §14.5 forbids gameplay logic reading render delta, not
   *  decoration. Both cars throw, because a rival trailing dust is how you see
   *  it coming without taking your eyes off the road. */
  private emitParticles(dt: number): void {
    const step = Math.min(dt, 0.05);
    for (const car of [this.car, this.rival]) {
      const t = car.telemetry;
      const v = car.body.linvel();
      const speed = Math.hypot(v.x, v.z);
      if (speed < 3) continue;
      const nx = v.x / speed;
      const nz = v.z / speed;
      for (const w of t.wheels) {
        if (!w.grounded) continue;
        this.view.particles.emitWheel(
          w.contact.x, w.contact.y, w.contact.z,
          nx * speed, nz * speed,
          car.surface, speed, w.utilisation, step,
        );
      }
    }
    this.view.particles.update(step);
  }

  /** Copy the rigid body's transform to the mesh. Note what is NOT here: no
   *  height correction, no pitch derived from climb rate, no ground snapping.
   *  The body's pose is the truth and the mesh follows it. */
  private syncCar(): void {
    const p = this.car.body.translation();
    const q = this.car.body.rotation();
    this.view.car.position.set(p.x, p.y, p.z);
    this.view.car.quaternion.set(q.x, q.y, q.z, q.w);

    // Tracers: a stretched box from where each shell was to where it is.
    const m = new THREE.Matrix4();
    const up = new THREE.Vector3(0, 1, 0);
    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    for (let i = 0; i < this.cannon.shots.length; i++) {
      const sh = this.cannon.shots[i]!;
      if (!sh.alive) { m.makeScale(0, 0, 0); this.view.tracers.setMatrixAt(i, m); continue; }
      a.set(sh.px, sh.py, sh.pz);
      b.set(sh.x, sh.y, sh.z);
      const len = Math.max(0.5, a.distanceTo(b) * 2.2);
      const mid = a.clone().lerp(b, 0.5);
      const dir = b.clone().sub(a).normalize();
      m.lookAt(new THREE.Vector3(), dir, up);
      m.scale(new THREE.Vector3(1, 1, len));
      m.setPosition(mid);
      this.view.tracers.setMatrixAt(i, m);
    }
    this.view.tracers.instanceMatrix.needsUpdate = true;

    const rp = this.rival.body.translation();
    const rq = this.rival.body.rotation();
    this.view.rival.position.set(rp.x, rp.y, rp.z);
    this.view.rival.quaternion.set(rq.x, rq.y, rq.z, rq.w);

    const tel = this.car.telemetry;
    for (let i = 0; i < 4; i++) {
      const w = tel.wheels[i]!;
      const mesh = this.view.wheels[i]!;
      // Wheel centre = attachment - (rayLength - compression) + radius, which
      // for travel 0.20 and radius 0.34 is attachment - 0.20 + compression.
      mesh.position.set(w.ax, w.ay - 0.2 + w.compression, w.az);
      mesh.rotation.x -= (w.omega * SIM.fixedTimestep) / 2;
    }
  }

  private updateCamera(dt: number): void {
    const M = CAMS[this.camIndex]!;
    const p = this.car.body.translation();
    const q = this.car.body.rotation();
    const v = this.car.body.linvel();
    const speed = Math.hypot(v.x, v.z);

    // Yaw source. Following the car's roll and pitch makes a rally camera
    // unwatchable over a crest — the horizon tumbles and the player loses the
    // road, which is the one thing the camera exists to show. So: yaw only.
    const quat = new THREE.Quaternion(q.x, q.y, q.z, q.w);
    const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(quat);
    const headingYaw = Math.atan2(fwd.x, fwd.z);
    // Overhead views take the damped direction of TRAVEL instead: at 50 m up,
    // raw heading whips on every steering flick.
    if (speed > 2) {
      this.travelYaw += shortestAngle(this.travelYaw, Math.atan2(v.x, v.z)) * (1 - Math.exp(-dt * 3.2));
    }
    const baseYaw = M.chase ? headingYaw : this.travelYaw;

    // Steering lead: the camera swings a little into the corner, so you see
    // where you are going rather than where you are pointing.
    this.camYaw += shortestAngle(this.camYaw, baseYaw) * (1 - Math.exp(-dt * (M.chase ? 7 : 4)));
    const yaw = this.camYaw + this.lastSteer * 0.30 * M.steer;
    const flat = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));

    // Speed pulls the camera back and up, so the faster you go the further you
    // can see — which is what spdBack and spdH are for.
    const t = Math.min(1, speed / 45);
    const back = M.back + M.spdBack * t;
    const height = M.h + M.spdH * t;

    const want = new THREE.Vector3(p.x, p.y, p.z)
      .addScaledVector(flat, -back)
      .add(new THREE.Vector3(0, height, 0));

    // Never let the camera end up under the ground: sample the same
    // heightfield the car drives on and stay above it.
    want.y = Math.max(want.y, sampleHeight(this.stage.heightfield, want.x, want.z) + 1.4);

    const k = 1 - Math.exp(-dt * (M.name === 'BONNET' ? 40 : M.chase ? 9 : 6));
    this.camPos.lerp(want, k);
    this.camLook.lerp(
      new THREE.Vector3(p.x, p.y + M.lookH, p.z).addScaledVector(flat, M.look),
      1 - Math.exp(-dt * 11),
    );
    this.view.camera.position.copy(this.camPos);
    this.view.camera.lookAt(this.camLook);
    if (this.view.camera.fov !== M.fov) {
      this.view.camera.fov = M.fov;
      this.view.camera.updateProjectionMatrix();
    }
  }

  private updateHud(): void {
    const t = this.car.telemetry;
    const seg = this.stage.corridor.segments[this.playerDriver.state.cursor]!;
    const lateral = this.playerDriver.state.lateral;
    const race = this.race;

    $('speed').textContent = Math.round(t.speedKmh).toString();
    $('gear').textContent = t.gear.toString();
    $('rpm-bar').style.width = `${Math.min(100, (t.rpm / 7200) * 100)}%`;
    $('rpm-bar').className = t.rpm > 6600 ? 'bar red' : 'bar';

    const progress = this.playerDriver.state.distance / this.stage.length;
    $('progress-bar').style.width = `${(progress * 100).toFixed(1)}%`;
    $('dist').textContent =
      `${(this.playerDriver.state.distance / 1000).toFixed(2)} / ${(this.stage.length / 1000).toFixed(2)} km`;

    // The pacenote. §1.3 grading turned into a co-driver call — L06's whole
    // point is that every corner has one.
    const ahead = this.stage.corners.find(
      (c) => this.stage.corridor.segments[c.from]!.distance > this.playerDriver.state.distance,
    );
    if (ahead) {
      const gap = this.stage.corridor.segments[ahead.from]!.distance - this.playerDriver.state.distance;
      $('pacenote').textContent = gap < 220 ? `${ahead.call.toUpperCase()}  ${Math.round(gap / 10) * 10} m` : '';
    } else {
      $('pacenote').textContent = '';
    }

    // The clock shows the time that counts: driving plus §11 penalties, with
    // the penalty called out so it is obvious where the seconds went.
    $('time').textContent = formatTime(race.clock);
    $('penalty').textContent = race.penalty ? `+${race.penalty.toFixed(0)}s` : '';
    $('penalty').className = race.penalty ? 'bad' : '';

    // Countdown, and the sector split that replaces it once running.
    const big = $('big');
    if (race.phase === 'countdown') {
      big.textContent = race.countdownText;
      big.className = 'go';
    } else {
      const split = race.latestSplit();
      if (split) {
        big.textContent = split.delta === null
          ? `S${split.index}  ${formatTime(split.elapsed)}`
          : `S${split.index}  ${formatDelta(split.delta)}`;
        big.className = split.delta === null ? 'neutral' : split.delta < 0 ? 'good' : 'bad-split';
      } else {
        big.textContent = '';
      }
    }

    // Gap to the rival, in metres of stage. Signed: negative means ahead.
    const gapM = this.rivalDriver.state.distance - this.playerDriver.state.distance;
    $('rival').textContent = race.phase === 'finished'
      ? ''
      : `RIVAL ${gapM > 0 ? '+' : ''}${Math.round(gapM)} m`;
    $('rival').className = gapM > 0 ? 'bad' : 'good';

    const onRoad = Math.abs(lateral) < seg.roadbedWidth / 2 + seg.shoulderWidth[0];
    $('ammo').textContent = '▮'.repeat(this.cannon.ammo) + '▯'.repeat(this.cannon.spec.capacity - this.cannon.ammo);
    $('score').textContent = this.score ? this.score.toLocaleString() : '';

    $('surface').textContent = onRoad ? seg.surfaceId : 'OFF ROAD';
    $('surface').className = onRoad ? '' : 'bad';

    // Damage in joules, §9. Terminal at 120 kJ cumulative.
    $('damage-bar').style.width = `${Math.min(100, (t.damageJ / 120_000) * 100)}%`;

    const slip = Math.max(...t.wheels.map((w) => w.utilisation));
    $('debug').textContent =
      `${this.fps.toFixed(0)} fps · grip ${(slip * 100).toFixed(0)}% · ` +
      `${t.airborne ? `AIR ${t.airtime.toFixed(1)}s` : `${t.wheels.filter((w) => w.grounded).length}/4 down`}` +
      (t.onRoof ? ' · ON ROOF (R to reset)' : '');
    $('cam-name').textContent = CAMS[this.camIndex]!.name;

    if (race.phase === 'finished' && race.result && !this.resultShown) this.showResult();
  }

  private resultShown = false;

  private showResult(): void {
    const r = this.race.result!;
    this.resultShown = true;

    // Record the leg BEFORE drawing, so the panel can show where the rally
    // stands afterwards rather than where it stood before this stage.
    let advanced = false;
    if (this.isCurrentLeg) {
      const before = this.rally;
      this.rally = completeLeg(this.rally, {
        stageId: this.stage.def.id,
        raw: r.raw,
        penalty: r.penalty,
        resets: this.resets[0]!,
        cuts: this.cuts.cuts,
        damageJ: this.car.telemetry.damageJ,
      });
      advanced = this.rally !== before;
      saveRally(this.rally);
    }
    const rivalGap = this.rivalDriver.state.distance - this.playerDriver.state.distance;
    const rows = this.race.splits
      .map((s) => {
        const d = s.delta === null ? '—' : formatDelta(s.delta);
        const cls = s.delta === null ? 'neutral' : s.delta < 0 ? 'good' : 'bad-split';
        return `<tr><td>S${s.index}</td><td>${formatTime(s.elapsed)}</td><td class="${cls}">${d}</td></tr>`;
      })
      .join('');
    $('result-title').textContent = r.isBest ? 'STAGE BEST' : 'FINISH';
    $('result-title').className = r.isBest ? 'good' : '';
    $('result-time').textContent = formatTime(r.total);
    $('result-sub').innerHTML =
      (r.previous === null
        ? 'First run on this stage.'
        : `Previous best ${formatTime(r.previous)} · <span class="${r.total < r.previous ? 'good' : 'bad-split'}">${formatDelta(r.total - r.previous)}</span>`) +
      `<br>${rivalGap < 0 ? 'Beat the rival' : 'Rival ahead'} by ${Math.abs(Math.round(rivalGap))} m` +
      (r.penalty
        ? `<br><span class="bad">${formatTime(r.raw)} driving + ${r.penalty.toFixed(0)}s penalties</span>` +
          ` — ${this.resets[0]} reset${this.resets[0] === 1 ? '' : 's'}, ${this.cuts.cuts} cut${this.cuts.cuts === 1 ? '' : 's'}`
        : '<br>Clean run: no resets, no cuts.');
    $('result-splits').innerHTML = rows;

    // The rally line: where this leg leaves you.
    const rally = $('result-rally');
    if (!advanced) {
      rally.innerHTML = this.rally.retired
        ? '<span class="bad">RETIRED — the rally is over. START A NEW RALLY to run it again.</span>'
        : '<span class="dim">Practice run — the classification counts the leg you are on.</span>';
    } else if (this.rally.retired) {
      rally.innerHTML =
        `<span class="bad">RETIRED — ${(this.car.telemetry.damageJ / 1000).toFixed(0)} kJ, ${damageClass(this.car.telemetry.damageJ)}.</span>` +
        '<br>§9 says terminal, so the car does not start the next stage.';
    } else if (isComplete(this.rally)) {
      rally.innerHTML =
        `<span class="good">RALLY COMPLETE</span> — ${ITINERARY.length} stages in ` +
        `<b>${formatTime(classification(this.rally))}</b>`;
    } else {
      const next = ITINERARY[this.rally.leg]!;
      const nextName = STAGES.find((s) => s.id === next.stageId)?.name ?? next.stageId;
      rally.innerHTML =
        `Rally ${this.rally.leg}/${ITINERARY.length} · <b>${formatTime(classification(this.rally))}</b>` +
        ` · damage ${(this.rally.damageJ / 1000).toFixed(0)} kJ (${damageClass(this.rally.damageJ)})` +
        (next.service
          ? `<br><span class="good">SERVICE PARK</span> before ${nextName} — damage repaired.`
          : `<br>Next: ${nextName}, and the damage comes with you.`);
      $('next-leg').textContent = `NEXT: ${nextName}`;
      $('next-leg').style.display = 'block';
      $('next-leg').onclick = () => { location.search = `?stage=${next.stageId}`; };
    }
    $('result').style.display = 'flex';
  }

  /**
   * §11 — RESET, PENALTIES, BOUNDARIES.
   *
   * What was here before was one hand-written rule: if the car is upside down,
   * outside the world, or has not moved for four seconds, put it back two
   * segments ahead of wherever it stopped. None of that is in the spec. It
   * could gain you ground — two segments ahead of a car beached on the outside
   * of a hairpin is past the hairpin — and it cost nothing at all.
   *
   * Now: §11.1's six triggers, each with its own delay and its own timer;
   * §11.2's respawn at the nearest UPSTREAM reset node the car legitimately
   * passed, facing the stage, settled, with immunity and a time penalty; and
   * §11.3's cut detection on the roadbed-plus-shoulder corridor.
   *
   * Leaving the world is not one of the spec's triggers, because in a specified
   * game it cannot happen. It can here: a car that slides off the outside of a
   * corner at speed runs past the 90 m of terrain either side of the corridor
   * and falls for ever. Measured on Safari, it reached 575 km/h straight down —
   * which is the terminal velocity the spec's own drag coefficient and 11 m/s²
   * gravity imply, so at least the aerodynamics were right. It is mapped onto
   * §11.1's "outside the stage volume", which is what it is.
   */
  readonly monitors = [new ResetMonitor(), new ResetMonitor()];
  readonly cuts = new CutMonitor();
  /** How many times each car has had to be put back on the road. §15 L15 asks
   *  for a reference lap with ZERO of these, so it has to be counted rather
   *  than quietly performed. */
  readonly resets = [0, 0];

  /** @param dt seconds of stage time since the last call. It is a REQUIRED
   *  measurement, not a constant: §11.1's triggers are all times. */
  enforceWorldBounds(dt: number): void {
    const hf = this.stage.heightfield;
    const cars = [
      [this.car, this.playerDriver],
      [this.rival, this.rivalDriver],
    ] as const;
    for (let n = 0; n < cars.length; n++) {
      const [car, driver] = cars[n]!;
      const p = car.body.translation();
      const monitor = this.monitors[n]!;

      const outside =
        p.x < hf.x0 || p.z < hf.z0 ||
        p.x > hf.x0 + hf.nx * hf.cell || p.z > hf.z0 + hf.nz * hf.cell;

      const due = monitor.update(dt, {
        // §11.1 "on roof, no input" — the vehicle already keeps the timer, so
        // the trigger is simply that it is inverted and the monitor times it.
        roof: car.telemetry.onRoof,
        outOfBounds: outside,
        // "Vertical drop with no ground contact below deck level."
        offDeck: p.y < hf.minY - 25,
        // "Stuck, speed under 0.5 m/s with throttle held." The spec's numbers,
        // not the 1.5 m/s over 4 s this used to invent. A car crawling out of a
        // ditch at 1 m/s is recovering, and used to be reset for it.
        stuck: this.race.phase === 'running' && car.telemetry.speedMs < RESET.stuckSpeedThreshold,
      });
      if (!due) continue;

      this.resets[n] = (this.resets[n] ?? 0) + 1;
      monitor.serve();
      // The player's penalty is the one that counts; a rival's reset is a
      // rival's problem and does not touch the player's clock.
      if (n === 0) this.race.penalty += RESET.penaltySeconds.standard;
      this.respawn(car, driver);
    }

    // §11.3 cutting, player only. A rival cutting costs the player nothing.
    const tel = this.car.telemetry;
    const cursor = this.stage.corridor.segments[this.playerDriver.state.cursor]!;
    let wheelsOut = 0;
    for (const w of tel.wheels) {
      const lateral = (w.contact.x - cursor.x) * -cursor.hz + (w.contact.z - cursor.z) * cursor.hx;
      const side = lateral >= 0 ? 0 : 1;
      // §11.3: "The corridor is defined by the roadbed plus the shoulder."
      if (Math.abs(lateral) > cursor.roadbedWidth / 2 + cursor.shoulderWidth[side]!) wheelsOut++;
    }
    const before = this.cuts.penaltySeconds;
    if (this.race.phase === 'running') {
      this.cuts.update(dt, wheelsOut, this.playerDriver.state.distance);
      this.race.penalty += this.cuts.penaltySeconds - before;
    }
  }

  /** §11.2, all six rules. */
  private respawn(car: Vehicle, driver: RoadDriver): void {
    const node = nodeFor(this.stage.resetNodes, driver.state.distance);
    car.reset(
      node.x,
      // 3: "ride height settled, no spawn drop". VEHICLE.cogHeight is exactly
      // where the body sits at the static compression this spring rate implies,
      // so the car appears already resting rather than falling.
      //
      // Plus a decimetre, and that is not a fudge. `sampleHeight` is a BILINEAR
      // sample of the heightfield; the collider Rapier builds from the same
      // buffer is two triangles per cell. On a slope the two disagree by a few
      // centimetres, and on the steepest ground §13 allows, by more. Spawning
      // at the exact sampled height therefore sometimes puts the hull inside
      // the terrain, where the solver holds it: the car sits with its wheels
      // barely loaded and full throttle doing nothing. Measured on Fafe, the
      // smoke autopilot stopped dead at 128 m of a straight and never moved
      // again. 0.10 m clears the mismatch and is 0.14 s of fall — below the
      // threshold of anything a player can see.
      sampleHeight(this.stage.heightfield, node.x, node.z) + VEHICLE.cogHeight + 0.10,
      node.z,
      // 2: "face the stage direction". Velocity and angular velocity are zeroed
      // inside Vehicle.reset.
      node.heading,
    );
    // 4: 2.5 s of collision immunity, ending early on first throttle. The
    // vehicle owns the countdown because it is the vehicle that decides whether
    // an impact counts.
    car.immuneFor = RESET.immunitySeconds;
    // The driver's cursor moves with the car. It searches forward only, so
    // without this it cannot follow a respawn that goes backwards — and a
    // driver steering for a point it passed a hundred metres ago crashes in the
    // same place for ever.
    driver.seek(node.index);
    // 6: "damage is not repaired by a reset" — nothing here touches damageJ,
    // and that is deliberate rather than an omission.
  }

  /**
   * THE REFERENCE LAP — §15 L15.
   *
   * "Stage completable by the AI reference lap with zero resets and under 8 kJ
   *  of cumulative impact energy." That is a check the static lint can never
   *  answer, because it is a statement about a car driving, not about a data
   *  structure. So it is measured here, by the game, with the same driver, the
   *  same racing line and the same physics the player gets — and reported by
   *  `tools/reference-lap.mjs` as a build gate.
   *
   * The rival is left where it is. It is another car on the road, and a
   * reference lap that needed the road to itself would be measuring a different
   * stage from the one that ships.
   */
  runReferenceLap(skill = 1.0, maxSeconds = 420): {
    finished: boolean;
    seconds: number;
    distance: number;
    resets: number;
    damageJ: number;
    offRoadSeconds: number;
    minSpeedKmh: number;
    slowestPoint: number;
    /** §11.3 cuts and the total §11 time penalty they and the resets cost. */
    cuts: number;
    penaltySeconds: number;
    /** Metre mark where the lap gave up because the same recovery kept
     *  repeating, or 0. See the note at the loop check below. */
    loopedAt: number;
    /** Where each recovery happened, metres along the stage. A reference lap
     *  that fails L15 is only useful if it says WHERE. */
    resetPoints: number[];
  } {
    // The reference lap drives with the PLAYER's driver, not a third instance.
    // Two RoadDrivers on one car means two cursors, and only one of them is the
    // one a reset re-seats — so the other keeps its stale idea of where the car
    // is and the lap measures nothing.
    const driver = this.playerDriver;
    driver.skill = skill;
    const h = SIM.fixedTimestep;
    const steps = Math.round(maxSeconds / h);
    // The countdown is race presentation, not part of the stage.
    this.race.start();
    this.resets[0] = 0;
    let offRoad = 0;
    let minSpeed = Infinity;
    let slowestPoint = 0;
    let elapsed = 0;
    const resetPoints: number[] = [];
    let lastResetAt = -1;
    let repeats = 0;
    let loopedAt = 0;

    for (let i = 0; i < steps; i++) {
      const p = this.car.body.translation();
      const q = this.car.body.rotation();
      const fx = 2 * (q.x * q.z + q.w * q.y);
      const fz = 1 - 2 * (q.x * q.x + q.y * q.y);
      const speed = this.car.telemetry.speedMs;
      this.car.step(driver.drive(p.x, p.z, fx, fz, speed), h);

      const rp = this.rival.body.translation();
      const rq = this.rival.body.rotation();
      this.rival.step(
        this.rivalDriver.drive(
          rp.x, rp.z,
          2 * (rq.x * rq.z + rq.w * rq.y),
          1 - 2 * (rq.x * rq.x + rq.y * rq.y),
          this.rival.telemetry.speedMs,
        ),
        h,
      );

      this.phys.world.step();
      this.phys.time += h;
      elapsed += h;

      const state = driver.state;
      this.race.update(h, state.distance);
      const seg = this.stage.corridor.segments[state.cursor]!;
      const side = state.lateral >= 0 ? 0 : 1;
      if (Math.abs(state.lateral) > seg.roadbedWidth / 2 + seg.shoulderWidth[side]!) offRoad += h;
      // Ignore the standing start: every lap begins at 0 km/h and that is not
      // the stage's slowest point.
      if (state.distance > 60 && speed * 3.6 < minSpeed) {
        minSpeed = speed * 3.6;
        slowestPoint = state.distance;
      }
      // The same recovery the player gets, at the same rate the render loop
      // calls it. Each one is counted, and one is a failed reference lap.
      if (i % 6 === 0) {
        const before = this.resets[0]!;
        this.enforceWorldBounds(h * 6);
        if (this.resets[0]! > before) {
          const where = Math.round(state.distance);
          if (resetPoints.length < 12) resetPoints.push(where);
          // A RESET LOOP, and it deserves a name rather than a timeout.
          //
          // §11.2 respawns at the nearest upstream node. A human then drives
          // the corner differently; a deterministic AI drives it identically,
          // beaches in the same place, and is respawned to the same node for
          // the rest of the clock. Reporting that as "DNF at 2.26 km" would
          // suggest the car stopped there, when what happened is that it
          // reached there thirty-three times. So the lap ends and says so.
          if (where === lastResetAt) repeats++; else { repeats = 0; lastResetAt = where; }
          if (repeats >= 2) { loopedAt = where; break; }
        }
      }
      if (this.race.phase === 'finished') break;
    }

    return {
      finished: this.race.phase === 'finished',
      seconds: elapsed,
      distance: this.playerDriver.state.distance,
      resets: this.resets[0]!,
      damageJ: this.car.telemetry.damageJ,
      offRoadSeconds: offRoad,
      minSpeedKmh: Number.isFinite(minSpeed) ? minSpeed : 0,
      slowestPoint,
      cuts: this.cuts.cuts,
      penaltySeconds: this.race.penalty,
      loopedAt,
      resetPoints,
    };
  }

  /**
   * The R key: §11.1's "player requested" trigger.
   *
   * It goes through the same §11.2 respawn as every other trigger, which means
   * it also carries the same 10 s penalty. That is the point of a penalty — a
   * reset that is free is a teleport, and the fastest way round Col de Turini
   * would be to press R at every hairpin.
   */
  private resetToRoad(): void {
    this.monitors[0]!.serve();
    this.race.penalty += RESET.penaltySeconds.standard;
    this.resets[0] = (this.resets[0] ?? 0) + 1;
    this.respawn(this.car, this.playerDriver);
  }
}

function setStatus(text: string): void {
  const el = $('status');
  el.textContent = text;
  el.style.display = text ? 'flex' : 'none';
}

// --- boot -------------------------------------------------------------------
const game = new Game();

// The rally is loaded before anything is built, because it decides which stages
// may be started and how bent the car starts.
game.rally = loadRally();
const open = unlocked(game.rally);

/** The stage the URL asked for, if it names a real one. Read before the list is
 *  built so a locked stage opened by URL still appears selected in it. */
function initialId(): string {
  const q = new URLSearchParams(location.search).get('stage');
  return q && STAGES.some((s) => s.id === q) ? q : '';
}

const select = $('stage-select') as HTMLSelectElement;
for (const s of STAGES) {
  const opt = document.createElement('option');
  opt.value = s.id;
  const n = legFor(s.id) + 1;
  opt.textContent = `${n ? `SS${n} ` : ''}${s.name} — ${s.country}`;
  // A stage you have not reached cannot be picked from the list. An itinerary
  // you can skip to the end of is a stage select with extra words. A URL still
  // opens it — see the note below.
  opt.disabled = !open.has(s.id) && s.id !== initialId();
  select.appendChild(opt);
}

// An explicit ?stage= opens ANY stage that exists, locked or not.
//
// The lock is a UI affordance — it shapes the itinerary and the select — and
// treating it as an access control is both pointless (it is a URL) and
// actively harmful. Silently substituting the current leg for a locked one
// meant `npm run reference` asked for six stages, was given Ouninpohja six
// times, and reported "every stage passes L15". A run that does not count is
// marked as practice; it is not redirected.
const asked = new URLSearchParams(location.search).get('stage');
const startAt = ITINERARY[Math.min(game.rally.leg, ITINERARY.length - 1)]!.stageId;
const initial = asked && STAGES.some((s) => s.id === asked) ? asked : startAt;
select.value = initial;
select.addEventListener('change', () => {
  location.search = `?stage=${select.value}`;
});

// --- the itinerary ----------------------------------------------------------
function renderItinerary(): void {
  const rows: string[] = [];
  for (let i = 0; i < ITINERARY.length; i++) {
    const legDef = ITINERARY[i]!;
    if (legDef.service) {
      rows.push('<tr class="service"><td colspan="4">— SERVICE PARK · DAMAGE REPAIRED —</td></tr>');
    }
    const def = STAGES.find((s) => s.id === legDef.stageId)!;
    const done = game.rally.results[i];
    const isNow = i === game.rally.leg && !game.rally.retired;
    const locked = !open.has(legDef.stageId);
    const time = done ? formatTime(done.raw + done.penalty) : isNow ? 'NOW' : '—';
    const notes = done
      ? [done.penalty ? `+${done.penalty.toFixed(0)}s` : '', done.resets ? `${done.resets}R` : '',
         done.cuts ? `${done.cuts}C` : ''].filter(Boolean).join(' ') || 'clean'
      : '';
    const name = locked
      ? def.name
      : `<a href="?stage=${def.id}">${def.name}</a>`;
    rows.push(
      `<tr class="${isNow ? 'now' : locked ? 'locked' : ''}">` +
      `<td>SS${i + 1}</td><td>${name}</td><td>${time}</td><td>${notes}</td></tr>`,
    );
  }
  $('itinerary-legs').innerHTML = rows.join('');
  $('itinerary-sub').innerHTML = game.rally.retired
    ? '<span class="bad">RETIRED.</span> §9 calls the damage terminal, so the car does not start again. Only a new rally clears it.'
    : isComplete(game.rally)
      ? `<span class="good">COMPLETE</span> — ${ITINERARY.length} stages in <b>${formatTime(classification(game.rally))}</b>`
      : `Classification <b>${formatTime(classification(game.rally))}</b> after ${game.rally.leg} of ${ITINERARY.length}` +
        `<br>Carrying ${(game.rally.damageJ / 1000).toFixed(0)} kJ of damage (${damageClass(game.rally.damageJ)}).` +
        ' §11.2.6: only a service park repairs it.';
}
renderItinerary();

$('itinerary-btn').addEventListener('click', () => {
  renderItinerary();
  $('itinerary').classList.add('open');
});
$('itinerary-close').addEventListener('click', () => $('itinerary').classList.remove('open'));
$('new-rally').addEventListener('click', () => {
  game.rally = emptyRally();
  saveRally(game.rally);
  location.search = `?stage=${ITINERARY[0]!.stageId}`;
});

// Restart re-runs the same stage. The world is seeded, so it rebuilds byte for
// byte — the only thing that changes between attempts is the driving.
$('restart').addEventListener('click', () => location.reload());

// --- controls, matching v1 ---------------------------------------------------
// Both settings are stored, because a player who has found the sensitivity that
// suits their thumb should not have to find it again on the next stage.
const CTRL_KEY = 'ignite-v2-controls';
const stored = (() => {
  try { return JSON.parse(localStorage.getItem(CTRL_KEY) ?? '{}'); } catch { return {}; }
})() as { scheme?: Scheme; sens?: number };

const schemeSel = $('scheme') as HTMLSelectElement;
const sensInput = $('sens') as HTMLInputElement;

function applyControls(): void {
  const scheme = schemeSel.value as Scheme;
  const sens = Number(sensInput.value);
  game.input?.setScheme(scheme);
  if (game.input) game.input.joySens = sens;
  $('sens-val').textContent = sens.toFixed(2) + '×';
  // Two-thumb puts the pedals on buttons and rails the pad to steering only,
  // so the throttle and brake buttons only exist in that scheme.
  document.body.classList.toggle('two-thumb', scheme === 'two-thumb');
  try { localStorage.setItem(CTRL_KEY, JSON.stringify({ scheme, sens })); } catch { /* private mode */ }
}

schemeSel.value = stored.scheme ?? 'pad';
sensInput.value = String(stored.sens ?? 1);
schemeSel.addEventListener('change', applyControls);
sensInput.addEventListener('input', applyControls);

$('settings-btn').addEventListener('click', () => {
  $('settings').classList.toggle('open');
});

game.boot(select.value).then(applyControls).catch((err) => {
  setStatus(`Failed to start: ${err?.message ?? err}`);
  console.error(err);
});

// Expose for the headless harness, the same way v1 exposes __game.
(window as unknown as Record<string, unknown>).__v2 = game;
// §15 L15: drive the whole stage with the AI and report what happened.
(window as unknown as Record<string, unknown>).__referenceLap =
  (skill?: number, maxSeconds?: number) => game.runReferenceLap(skill, maxSeconds);
// Ask the solver where the ground is, for the smoke test.
(window as unknown as Record<string, unknown>).__probeGround =
  (x: number, z: number) => probeGround(game.phys, x, z, game.car.body);
// Drive the simulation directly, ignoring requestAnimationFrame. The headless
// harness runs on SwiftShader at roughly a third of real time, so any
// wall-clock assertion measures the software rasteriser rather than the game.
// A fixed timestep is exactly what makes this substitution legitimate: N steps
// here are the same N steps the player gets.
(window as unknown as Record<string, unknown>).__stepFixed =
  (n: number, cmd: Partial<DriverInput> = {}) => {
    const input: DriverInput = { steer: 0, throttle: 0, brake: 0, handbrake: false, ...cmd };
    for (let i = 0; i < n; i++) {
      game.car.step(input, SIM.fixedTimestep);
      // Weapons go through the same path as the render loop, or the harness
      // would be testing a game the player never runs.
      game.stepWeapons(input, SIM.fixedTimestep);
      game.phys.world.step();
      // The race director advances here too, or a headless run sits on the
      // start line for ever with the clock at zero.
      const p = game.car.body.translation();
      game.race.update(SIM.fixedTimestep, game.playerDriverState(p.x, p.z).distance);
      // Every step, with the step's own dt. `i % 30` looked cheaper but this
      // function is called with n = 4 from the harness, so the modulo matched
      // on every call and the recovery ran seven times too often, each time
      // advancing §11.1's clocks by a quarter of a second.
      game.enforceWorldBounds(SIM.fixedTimestep);
    }
  };

/** Shortest signed angular difference from `a` to `b`, in radians. Damping raw
 *  atan2 values without this makes the camera take the long way round every
 *  time the car crosses the +/-pi boundary. */
function shortestAngle(a: number, b: number): number {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}
