// DUSTLINE — M3: full race loop. Fixed-timestep Rapier sim (120 Hz) with
// interpolated rendering; 4 racers (player + 3 AI on the baked line),
// countdown, sectors, laps, positions, results.
//
// THE FRAME NOW GOES THROUGH A COMPOSER, ported from IGNITE RALLY. v1 draws
// every frame with `this.composer.render()` (`src/main.js:6519`) rather than
// `renderer.render`, and resizes the composer alongside the renderer
// (`src/main.js:1011`). Both of those are done here; what the chain contains,
// and the image-based lighting that goes with it, is `render/post.ts`. The
// chain is optional — see `postWanted` there for how it switches itself off
// under a software rasteriser, which is what the headless tools run on.
// Ported with it: v1's moving shadow rig (`_updateCamera`, `src/main.js:1918`),
// which re-aims the sun at the player every frame; the light itself and its
// tuning live in `render/scene.ts`.
//
// AND IT IS DRIVABLE WITH TWO THUMBS. Every reference image for this game is a
// portrait phone screenshot with on-screen controls, and until this line the
// game had no touch input at all — `core/input.ts` was keyboard and gamepad,
// so on the device it is aimed at the car did not move. `ui/touch.ts` carries
// v1's tuned joystick across; the two lines here are all the wiring it needs.
//
// A NOTE ON WHY THAT WIRING IS CALLED OUT. The ported modules landed as dead
// code first — `sky.ts`, `skidMarks.ts` and `touch.ts` all existed, all
// typechecked, and none of them had a single importer, so the running game was
// unchanged while the commit message said otherwise. Ported is not delivered.
// An import is the difference, and it is worth one comment to remember that.

import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { GameLoop, FIXED_DT } from './core/loop';
import { Input, InputState } from './core/input';
import { VehicleController } from './physics/vehicleController';
import { buildRenderer, buildWorld, buildCarVisual, shadowFollower, CarVisual } from './render/scene';
import { Post, buildEnvironment } from './render/post';
import { ChaseCamera } from './render/camera';
import { Telemetry } from './ui/telemetry';
import { RaceHUD } from './ui/hud';
import { chooseTrack } from './ui/trackSelect';
import { initTouchControls } from './ui/touch';
import { Terrain } from './tracks/terrain';
import { WheelFX } from './render/particles';
import { Sky } from './render/sky';
import { buildMountains, buildVegetation } from './render/scenery';
import { bakeRacingLine } from './ai/racingLine';
import { AIDriver, DriverSpec } from './ai/driver';
import { RaceDirector } from './race/director';
import carData from './data/car.json';
import aiData from './data/ai.json';
import { resolveTrackFromUrl } from './tracks/registry';

// Countdown hold: NO brake — in this control scheme brake at standstill
// means reverse, and a braking grid would quietly drive itself backwards.
// The handbrake pins the rears instead.
const IDLE: InputState = {
  throttle: 0, brake: 0, steer: 0, handbrake: true, nitro: false,
  fire: false, rearFire: false, lookBack: false, reset: false, usingGamepad: false,
};

async function boot() {
  await RAPIER.init();

  // ?track=<id> picks a saved or built-in track; ?t=<packed> carries a whole
  // track in the link. Neither can fail the boot — both fall back to default.
  //
  // WITH NO TRACK NAMED, ASK. Opening the game used to boot the first built-in
  // and nothing else, so a track saved in the editor was reachable only by
  // hand-typing its id into the address bar. A link that names a track still
  // goes straight there — that is what makes `?track=` and `?t=` shareable —
  // but the bare URL now shows what this browser can play.
  const named = new URLSearchParams(location.search);
  // "LOADING PHYSICS" goes before the picker, not after it: leaving it up
  // behind the overlay means it is still there if the picker ever fails to
  // paint, which is the one case where you want to see what happened.
  document.getElementById('boot')?.remove();
  const trackDef = (named.has('track') || named.has('t'))
    ? resolveTrackFromUrl()
    : await chooseTrack();

  const canvas = document.getElementById('app') as HTMLCanvasElement;
  const renderer = buildRenderer(canvas);
  const scene = new THREE.Scene();
  const chase = new ChaseCamera();
  const post = new Post(renderer);
  addEventListener('resize', () => {
    renderer.setSize(innerWidth, innerHeight);
    post.setSize(innerWidth, innerHeight);   // v1 resizes both, src/main.js:1010-1011
  });

  const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
  world.timestep = FIXED_DT;
  const terrain = new Terrain(trackDef);
  const built = buildWorld(scene, trackDef, terrain.spawn.x, terrain.spawn.z);
  // The sun's shadow box travels with the player from here on. Nothing else
  // about the light changes — same colour, same intensity, same direction.
  const followSun = shadowFollower(built);
  // Image-based lighting from the track's own sky colours: without it every
  // standard material reflects nothing, so metalness reads black and the car
  // paint has no sheen. One PMREM bake at load, nothing per frame.
  buildEnvironment(renderer, scene, trackDef);
  terrain.build(scene, world, RAPIER);
  // v1's five-layer sky, not the M1 mockup it replaces. `render/scenery.ts`
  // still exports `buildSky`/`buildClouds` — a 16x256 canvas gradient on a
  // sphere and some icosahedron puffs — and the editor preview still uses
  // them; this is the game's path onto the ported one. See `render/sky.ts`.
  const sky = new Sky(scene, trackDef);
  buildMountains(scene, trackDef);
  const components = buildVegetation(scene, terrain, world, RAPIER);
  console.info('[world] components:', components.counts);

  const line = bakeRacingLine(terrain);
  const director = new RaceDirector(line);

  // ---- racers: player + 3 AI ----
  interface Racer { ctrl: VehicleController; visual: CarVisual; driver: AIDriver | null; }
  const racers: Racer[] = [];

  const playerCtrl = new VehicleController(RAPIER, world, terrain.spawn, terrain);
  racers.push({ ctrl: playerCtrl, visual: buildCarVisual(scene), driver: null });
  director.addRacer(playerCtrl, 'YOU', true);

  for (const spec of aiData.drivers as DriverSpec[]) {
    const ctrl = new VehicleController(RAPIER, world, terrain.spawn, terrain);
    const driver = new AIDriver(ctrl, line, spec);
    racers.push({ ctrl, visual: buildCarVisual(scene, spec.color, spec.accent), driver });
    director.addRacer(ctrl, spec.name, false);
  }

  const placeAll = () => {
    director.racers.forEach((entry, i) => {
      const slot = director.gridSlot(i);
      const c = entry.ctrl;
      c.body.setTranslation({ x: slot.x, y: terrain.heightAt(slot.x, slot.z) + 1.0, z: slot.z }, true);
      c.body.setRotation({ x: 0, y: Math.sin(slot.heading / 2), z: 0, w: Math.cos(slot.heading / 2) }, true);
      c.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
      c.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
      const r = racers[i];
      if (r.driver) r.driver.lineIdx = entry.lineIdx;
    });
  };
  director.restart(() => {});
  placeAll();

  const input = new Input();
  // ON-SCREEN CONTROLS, AND THE REASON THEY ARE CREATED HERE. `initTouchControls`
  // returns null on anything that is not a touch device, so `touch?.` below is
  // the whole desktop story — no branch, no second code path. It has to run
  // AFTER `chooseTrack()` resolves, which is what keeps thumb pads off the
  // track picker.
  const touch = initTouchControls(input);
  const telemetry = new Telemetry();
  const hud = new RaceHUD();
  hud.onRestart = () => { director.restart(() => {}); placeAll(); };
  const fx = new WheelFX(scene, chase.camera);

  const ctrls = racers.map((r) => r.ctrl);

  // ---- fixed pipeline (also driven by tests via fastForward) ----
  const fixedStep = (dt: number) => {
    input.poll();
    const racing = director.state !== 'countdown';
    for (let i = 0; i < racers.length; i++) {
      const r = racers[i];
      let inp: InputState;
      if (r.driver) {
        inp = r.driver.update(dt, ctrls, racing);
        if (director.racers[i].finished) inp.throttle = Math.min(inp.throttle, 0.4); // cool-down lap
      } else {
        inp = racing ? input.state : IDLE;
      }
      r.ctrl.fixedUpdate(dt, inp);
    }
    world.step();
    director.update(dt);
  };

  // interpolation scratch
  const iPos = new THREE.Vector3();
  const iQuat = new THREE.Quaternion();
  const vel = new THREE.Vector3();
  const susp = carData.suspension;
  const wheelR = carData.tire.wheelRadius;

  const loop = new GameLoop({
    fixedUpdate: fixedStep,
    render: (alpha, frameDt) => {
      for (const r of racers) {
        const c = r.ctrl;
        iPos.lerpVectors(c.prevPos, c.currPos, alpha);
        iQuat.slerpQuaternions(c.prevQuat, c.currQuat, alpha);
        r.visual.root.position.copy(iPos);
        r.visual.root.quaternion.copy(iQuat);
        for (let i = 0; i < 4; i++) {
          const w = c.wheels[i];
          const m = susp.mounts[i];
          const drop = w.grounded
            ? Math.max(0.05, (susp.restLength + susp.maxTravel) - w.compressionM)
            : susp.restLength + susp.maxTravel;
          r.visual.wheels[i].position.set(m[0], m[1] - drop + wheelR, m[2]);
          r.visual.wheels[i].rotation.set(0, w.steer, 0);
          r.visual.wheels[i].rotateX(w.spin);
        }
        // wheel FX for every racer (they all kick dust)
        const lv = c.body.linvel();
        for (let i = 0; i < 4; i++) {
          const w = c.wheels[i];
          if (w.grounded) {
            fx.wheelKick(w.surface, w.slipping, w.worldContact.x, w.worldContact.y, w.worldContact.z,
              lv.x, lv.z, c.speedKmh / 3.6);
          }
        }
      }
      fx.update(frameDt);
      sky.update(frameDt);

      const plv = playerCtrl.body.linvel();
      vel.set(plv.x, plv.y, plv.z);
      iPos.lerpVectors(playerCtrl.prevPos, playerCtrl.currPos, alpha);
      iQuat.slerpQuaternions(playerCtrl.prevQuat, playerCtrl.currQuat, alpha);
      chase.update(frameDt, iPos, iQuat, vel, playerCtrl.speedKmh, playerCtrl.nitroActive, input.state.lookBack);
      // ...and the shadow box follows the car, not the camera: what has to be
      // inside a 180-unit frustum is the thing casting the shadow you are
      // looking at. v1 aims at the player for the same reason.
      followSun?.(iPos.x, iPos.y, iPos.z);
      telemetry.update(frameDt, loop, playerCtrl);
      hud.update(director);
      touch?.update(playerCtrl.speedKmh, playerCtrl.nitroActive);
      post.render(scene, chase.camera);
    },
  });

  document.getElementById('boot')?.remove();
  loop.start();

  // headless-test + tuning hook
  (window as unknown as { __dust: object }).__dust = {
    car: playerCtrl, world, loop, input, terrain, fx, line, director, racers,
    track: trackDef,
    // exposed so `tools/verify-mobile.mjs` can assert the controls exist and
    // that a synthetic thumb drag reaches the car, rather than inferring it
    sky, touch,
    // The scene and the lights `buildWorld` made. A lighting tool that has to
    // find the sun by traversing the graph and sniffing for `isDirectionalLight`
    // is a tool that silently stops working the day a second light is added;
    // handing it the objects costs nothing and cannot go stale.
    scene, lights: built,
    // exposed for tools/: the renderer's own triangle and draw-call counters
    // are the only honest answer to "what did that cost"
    renderer,
    // `post.setEnabled(false)` is the runtime escape hatch, for a tool that
    // wants the cheap path without reloading with `?nopost`.
    post,
    fastForward: (ticks: number) => { for (let i = 0; i < ticks; i++) fixedStep(FIXED_DT); },
  };
}

boot();
