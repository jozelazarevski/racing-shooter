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
import { SIM } from '../../spec/rally.constants.ts';

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
  private startTime = 0;
  private finished = false;
  private bestByStage = new Map<string, number>();

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
    this.startTime = 0;
    this.finished = false;
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
      if (this.startTime === 0 && (cmd.throttle > 0 || cmd.brake > 0)) this.startTime = now;
      this.car.step(cmd, h);
      this.phys.world.step();
      this.phys.time += h;
    });

    this.syncCar();
    this.updateCamera(dt);
    this.updateHud(now);

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

  private updateHud(now: number): void {
    const t = this.car.telemetry;
    const p = this.car.body.translation();
    const { seg, lateral } = locate(this.stage.corridor, p.x, p.z);

    $('speed').textContent = Math.round(t.speedKmh).toString();
    $('gear').textContent = t.gear.toString();
    $('rpm-bar').style.width = `${Math.min(100, (t.rpm / 7200) * 100)}%`;
    $('rpm-bar').className = t.rpm > 6600 ? 'bar red' : 'bar';

    const progress = seg.distance / this.stage.length;
    $('progress-bar').style.width = `${(progress * 100).toFixed(1)}%`;
    $('dist').textContent = `${(seg.distance / 1000).toFixed(2)} / ${(this.stage.length / 1000).toFixed(2)} km`;

    // The pacenote. §1.3 grading turned into a co-driver call — L06's whole
    // point is that every corner has one.
    const ahead = this.stage.corners.find((c) => this.stage.corridor.segments[c.from]!.distance > seg.distance);
    if (ahead) {
      const gap = this.stage.corridor.segments[ahead.from]!.distance - seg.distance;
      $('pacenote').textContent = gap < 220 ? `${ahead.call.toUpperCase()}  ${Math.round(gap / 10) * 10} m` : '';
    } else {
      $('pacenote').textContent = '';
    }

    const elapsed = this.startTime ? (now - this.startTime) / 1000 : 0;
    if (progress > 0.995 && !this.finished && this.startTime) {
      this.finished = true;
      const best = this.bestByStage.get(this.stage.def.id);
      if (best === undefined || elapsed < best) this.bestByStage.set(this.stage.def.id, elapsed);
    }
    $('time').textContent = formatTime(elapsed);

    const onRoad = Math.abs(lateral) < seg.roadbedWidth / 2 + seg.shoulderWidth[0];
    $('surface').textContent = onRoad ? seg.surfaceId : 'OFF ROAD';
    $('surface').className = onRoad ? '' : 'bad';

    // Damage in joules, §9. Terminal at 120 kJ cumulative.
    const dmg = Math.min(100, (t.damageJ / 120_000) * 100);
    $('damage-bar').style.width = `${dmg}%`;

    const slip = Math.max(...t.wheels.map((w) => w.utilisation));
    $('debug').textContent =
      `${this.fps.toFixed(0)} fps · ${this.stepper.steps} steps · ` +
      `grip ${(slip * 100).toFixed(0)}% · ` +
      `${t.airborne ? `AIR ${t.airtime.toFixed(1)}s` : `${t.wheels.filter((w) => w.grounded).length}/4 down`}` +
      (t.onRoof ? ' · ON ROOF (R to reset)' : '');
    $('cam-name').textContent = CAMS[this.camIndex]!.name;
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

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const r = s - m * 60;
  return `${m}:${r.toFixed(2).padStart(5, '0')}`;
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
    }
  };
