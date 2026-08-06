/* IGNITE RALLY v2 — boot, loop, HUD.
 *
 * Phases 1 and 2 in one runnable page: a specified world (corridor, grading,
 * scatter, lint) driven by a specified vehicle (Rapier, fixed 1/120 s, Pacejka,
 * SI units), all of it seeded so any bug reproduces from the stage id alone.
 */
import * as THREE from 'three';
import { STAGES, buildStage, type Stage } from './world/stage.ts';
import { lintStage, lintSummary } from './world/lint.ts';
import { locate } from './world/corridor.ts';
import { sampleHeight } from './world/terrain.ts';
import { initPhysics, createWorld, probeGround, FixedStepper, type PhysicsWorld } from './physics/world.ts';
import { Vehicle, WHEEL_RADIUS, type DriverInput } from './physics/vehicle.ts';
import { Input } from './core/input.ts';
import { createRenderer, type Renderer } from './render/scene.ts';
import { fingerprint } from './core/stageRng.ts';
import { RaceDirector, formatTime, formatDelta } from './race/director.ts';
import { RoadDriver } from './race/driver.ts';
import { SIM, ROLLOVER } from '../../spec/rally.constants.ts';

const $ = (id: string) => document.getElementById(id)!;

/** Chase cameras. Three, because a rally stage needs a close one for placing
 *  the car and a far one for reading the road ahead. */
const CAMS = [
  { name: 'CHASE', back: 8.4, height: 3.1, look: 11, fov: 62 },
  { name: 'FAR', back: 13.5, height: 5.4, look: 16, fov: 66 },
  { name: 'BONNET', back: -0.4, height: 1.35, look: 22, fov: 72 },
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
  private last = 0;
  private frames = 0;
  private fps = 0;
  private fpsClock = 0;
  race!: RaceDirector;
  rival!: Vehicle;
  rivalDriver!: RoadDriver;
  private playerDriver!: RoadDriver;

  /** Progress along the centreline. Exposed so the headless harness can drive
   *  the race without reaching into a private field. */
  playerDriverState(x: number, z: number) {
    return this.playerDriver.locate(x, z);
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

    // The rival. Same Vehicle class, same physics, same tyres — the only
    // difference is who supplies the input. A rival on a different model would
    // teach the player the wrong thing about grip.
    this.rivalDriver = new RoadDriver(this.stage.corridor, 0.78, 2.0);
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
    this.playerDriver = new RoadDriver(this.stage.corridor);
    this.race = new RaceDirector(def.id, this.stage.length);

    const canvas = $('view') as HTMLCanvasElement;
    this.view = createRenderer(canvas, this.stage);
    this.input = new Input(canvas);
    addEventListener('resize', () => this.view.resize());

    $('stage-name').textContent = def.name;
    $('stage-sub').textContent =
      `${def.country} · ${def.surface} · ${(this.stage.length / 1000).toFixed(2)} km · ` +
      `${this.stage.corners.length} corners`;
    $('build-info').innerHTML =
      `built in ${buildMs.toFixed(0)} ms · ${this.stage.objects.length.toLocaleString()} objects · ` +
      `seed ${this.stage.rng.seed} · fingerprint <b>${fingerprint(this.stage.objects)}</b><br>` +
      `§15 lint: <b class="${summary.ok ? 'ok' : 'bad'}">${summary.passed} pass, ${summary.failed} fail</b>, ${summary.skipped} not yet implementable` +
      (summary.ok ? '' : `<br>${results.filter((r) => r.status === 'fail').map((r) => `${r.id}: ${r.detail}`).join('<br>')}`);

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
      this.car.step(player, h);

      const rp = this.rival.body.translation();
      const rq = this.rival.body.rotation();
      const rvx = 2 * (rq.x * rq.z + rq.w * rq.y);
      const rvz = 1 - 2 * (rq.x * rq.x + rq.y * rq.y);
      const rivalCmd = this.rivalDriver.drive(rp.x, rp.z, rvx, rvz, this.rival.telemetry.speedMs);
      this.rival.step(this.race.locked ? { ...rivalCmd, throttle: 0, brake: 1 } : rivalCmd, h);

      this.phys.world.step();
      this.phys.time += h;

      const pp = this.car.body.translation();
      this.race.update(h, this.playerDriver.locate(pp.x, pp.z).distance);
    });

    this.enforceWorldBounds();
    this.syncCar();
    this.updateCamera(dt);
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

  /** Copy the rigid body's transform to the mesh. Note what is NOT here: no
   *  height correction, no pitch derived from climb rate, no ground snapping.
   *  The body's pose is the truth and the mesh follows it. */
  private syncCar(): void {
    const p = this.car.body.translation();
    const q = this.car.body.rotation();
    this.view.car.position.set(p.x, p.y, p.z);
    this.view.car.quaternion.set(q.x, q.y, q.z, q.w);

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
    const cam = CAMS[this.camIndex]!;
    const p = this.car.body.translation();
    const q = this.car.body.rotation();
    const quat = new THREE.Quaternion(q.x, q.y, q.z, q.w);

    // Yaw only. Following the car's roll and pitch makes a rally camera
    // unwatchable over a crest — the horizon tumbles and the player loses the
    // road, which is the one thing the camera exists to show.
    const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(quat);
    const yaw = Math.atan2(fwd.x, fwd.z);
    const flat = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));

    const want = new THREE.Vector3(p.x, p.y, p.z)
      .addScaledVector(flat, -cam.back)
      .add(new THREE.Vector3(0, cam.height, 0));

    // Never let the camera end up under the ground: sample the same
    // heightfield the car drives on and stay above it.
    const floor = sampleHeight(this.stage.heightfield, want.x, want.z) + 1.4;
    want.y = Math.max(want.y, floor);

    const k = 1 - Math.exp(-dt * (this.camIndex === 2 ? 40 : 9));
    this.camPos.lerp(want, k);
    this.camLook.lerp(
      new THREE.Vector3(p.x, p.y + 1.1, p.z).addScaledVector(flat, cam.look),
      1 - Math.exp(-dt * 11),
    );
    this.view.camera.position.copy(this.camPos);
    this.view.camera.lookAt(this.camLook);
    if (this.view.camera.fov !== cam.fov) {
      this.view.camera.fov = cam.fov;
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

    $('time').textContent = formatTime(race.elapsed);

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
      `<br>${rivalGap < 0 ? 'Beat the rival' : 'Rival ahead'} by ${Math.abs(Math.round(rivalGap))} m`;
    $('result-splits').innerHTML = rows;
    $('result').style.display = 'flex';
  }

  /**
   * Recovery. §7 gives 2.5 s on the roof before a reset; leaving the world is
   * not in the spec because in a specified game it cannot happen, but it can
   * here: a car that slides off the outside of a corner at speed runs past the
   * 90 m of terrain either side of the corridor and falls for ever. Measured on
   * Safari, it reached 575 km/h straight down — which is the terminal velocity
   * the spec's own drag coefficient and 11 m/s² gravity imply, so at least the
   * aerodynamics were right.
   *
   * Phase 3 turns this into proper reset nodes every 120 m (lint L12). For now
   * it is the difference between a bad corner and a lost run.
   */
  /** Seconds each car has spent going nowhere. */
  private stuckFor = [0, 0];

  enforceWorldBounds(dt = SIM.fixedTimestep * 6): void {
    const hf = this.stage.heightfield;
    const cars = [
      [this.car, this.playerDriver],
      [this.rival, this.rivalDriver],
    ] as const;
    for (let n = 0; n < cars.length; n++) {
      const [car, driver] = cars[n]!;
      const p = car.body.translation();

      // Stuck: wedged against a tree, on its side in a ditch, nose into a bank.
      // The player has R for this; a rival has nothing, and a stranded rival
      // makes the whole race pointless. Measured on Safari, the AI beached
      // itself at 798 m and sat there for the rest of the run.
      this.stuckFor[n] = car.telemetry.speedMs < 1.5 && this.race.phase === 'running'
        ? this.stuckFor[n]! + dt
        : 0;
      const stuck = this.stuckFor[n]! > 4;
      const outside =
        p.x < hf.x0 || p.z < hf.z0 ||
        p.x > hf.x0 + hf.nx * hf.cell || p.z > hf.z0 + hf.nz * hf.cell;
      const fallen = p.y < hf.minY - 25;
      const rolled = car.telemetry.roofTime > ROLLOVER.onRoofResetDelay;
      if (!outside && !fallen && !rolled && !stuck) continue;
      this.stuckFor[n] = 0;

      // Put it back a little way ahead, so a car that beached ON a segment does
      // not reset straight back into the same obstacle.
      const seg = this.stage.corridor.segments[
        Math.min(this.stage.corridor.segments.length - 1, driver.state.cursor + 2)
      ]!;
      car.reset(
        seg.x,
        sampleHeight(hf, seg.x, seg.z) + 0.6,
        seg.z,
        Math.atan2(seg.hx, seg.hz),
      );
    }
  }

  /** Put the car back on the centreline at the nearest segment. */
  private resetToRoad(): void {
    const p = this.car.body.translation();
    const { seg } = locate(this.stage.corridor, p.x, p.z);
    this.car.reset(
      seg.x,
      sampleHeight(this.stage.heightfield, seg.x, seg.z) + 0.60,
      seg.z,
      Math.atan2(seg.hx, seg.hz),
    );
  }
}

function setStatus(text: string): void {
  const el = $('status');
  el.textContent = text;
  el.style.display = text ? 'flex' : 'none';
}

// --- boot -------------------------------------------------------------------
const game = new Game();

const select = $('stage-select') as HTMLSelectElement;
for (const s of STAGES) {
  const opt = document.createElement('option');
  opt.value = s.id;
  opt.textContent = `${s.name} — ${s.country}`;
  select.appendChild(opt);
}

const initial = new URLSearchParams(location.search).get('stage') ?? STAGES[0]!.id;
select.value = STAGES.some((s) => s.id === initial) ? initial : STAGES[0]!.id;
select.addEventListener('change', () => {
  location.search = `?stage=${select.value}`;
});

// Restart re-runs the same stage. The world is seeded, so it rebuilds byte for
// byte — the only thing that changes between attempts is the driving.
$('restart').addEventListener('click', () => location.reload());

game.boot(select.value).catch((err) => {
  setStatus(`Failed to start: ${err?.message ?? err}`);
  console.error(err);
});

// Expose for the headless harness, the same way v1 exposes __game.
(window as unknown as Record<string, unknown>).__v2 = game;
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
      game.phys.world.step();
      // The race director advances here too, or a headless run sits on the
      // start line for ever with the clock at zero.
      const p = game.car.body.translation();
      game.race.update(SIM.fixedTimestep, game.playerDriverState(p.x, p.z).distance);
      if (i % 30 === 0) game.enforceWorldBounds();
    }
  };
