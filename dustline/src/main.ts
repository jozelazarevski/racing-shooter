// DUSTLINE M1 — driving prototype entry point.
// Fixed-timestep Rapier sim (120 Hz) + interpolated Three.js rendering.

import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { GameLoop, FIXED_DT } from './core/loop';
import { Input } from './core/input';
import { VehicleController } from './physics/vehicleController';
import { buildRenderer, buildWorld, buildCarVisual } from './render/scene';
import { ChaseCamera } from './render/camera';
import { Telemetry } from './ui/telemetry';
import carData from './data/car.json';

async function boot() {
  await RAPIER.init();

  const canvas = document.getElementById('app') as HTMLCanvasElement;
  const renderer = buildRenderer(canvas);
  const scene = new THREE.Scene();
  buildWorld(scene);
  const carVisual = buildCarVisual(scene);
  const chase = new ChaseCamera();
  addEventListener('resize', () => renderer.setSize(innerWidth, innerHeight));

  // physics world: flat ground collider (M1)
  const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
  world.timestep = FIXED_DT;
  const groundBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
  world.createCollider(RAPIER.ColliderDesc.cuboid(600, 1, 600).setTranslation(0, -1, 0).setFriction(1), groundBody);

  const car = new VehicleController(RAPIER, world, new THREE.Vector3(0, 1.2, -24));
  const input = new Input();
  const telemetry = new Telemetry();

  // interpolation scratch
  const iPos = new THREE.Vector3();
  const iQuat = new THREE.Quaternion();
  const vel = new THREE.Vector3();
  const susp = carData.suspension;
  const wheelR = carData.tire.wheelRadius;

  const loop = new GameLoop({
    fixedUpdate: (dt) => {
      input.poll();
      car.fixedUpdate(dt, input.state);
      world.step();
    },
    render: (alpha, frameDt) => {
      iPos.lerpVectors(car.prevPos, car.currPos, alpha);
      iQuat.slerpQuaternions(car.prevQuat, car.currQuat, alpha);
      carVisual.root.position.copy(iPos);
      carVisual.root.quaternion.copy(iQuat);

      // wheels: seat at suspension length, steer fronts, spin all
      for (let i = 0; i < 4; i++) {
        const w = car.wheels[i];
        const m = susp.mounts[i];
        const drop = w.grounded
          ? Math.max(0.05, (susp.restLength + susp.maxTravel) - w.compressionM)
          : susp.restLength + susp.maxTravel;
        carVisual.wheels[i].position.set(m[0], m[1] - drop + wheelR, m[2]);
        carVisual.wheels[i].rotation.set(0, w.steer, 0);
        carVisual.wheels[i].rotateX(w.spin);
      }

      const lv = car.body.linvel();
      vel.set(lv.x, lv.y, lv.z);
      chase.update(frameDt, iPos, iQuat, vel, car.speedKmh, car.nitroActive, input.state.lookBack);
      telemetry.update(frameDt, loop, car);
      renderer.render(scene, chase.camera);
    },
  });

  document.getElementById('boot')?.remove();
  loop.start();

  // headless-test + tuning hook
  (window as unknown as { __dust: object }).__dust = { car, world, loop, input };
}

boot();
