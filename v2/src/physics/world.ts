/* Rapier world, fixed timestep, §14.1.
 *
 * "Fixed timestep, accumulator based, with a maximum of 5 catch up steps per
 *  frame to avoid a spiral."
 *
 * v1 stepped its physics with whatever `requestAnimationFrame` handed it. That
 * makes the car's behaviour a function of the frame rate: the same input on a
 * 60 Hz phone and a 144 Hz desktop gives different results, and a single long
 * frame — a garbage collection, a texture upload — can throw the car through
 * the ground. A fixed step removes the whole class.
 */
import RAPIER from '@dimforge/rapier3d-compat';
import { SIM, Tier } from '../../../spec/rally.constants.ts';
import type { Heightfield } from '../world/terrain.ts';
import type { WorldObject } from '../world/scatter.ts';

export type Rapier = typeof RAPIER;

let ready: Promise<void> | null = null;
/** Rapier ships as WASM and must be initialised once before any use. */
export function initPhysics(): Promise<void> {
  ready ??= RAPIER.init();
  return ready;
}

export interface PhysicsWorld {
  world: RAPIER.World;
  ground: RAPIER.Collider;
  /** Collider handle -> the world object it belongs to, for §9 damage. */
  props: Map<number, WorldObject>;
  /** Simulated seconds elapsed. Physics time, not wall time. */
  time: number;
}

/** Straight-down raycast against the physics world, in world units.
 *  Exists so a test can ask the SOLVER where the ground is, rather than asking
 *  the array and hoping the two agree — which is exactly the assumption that
 *  was wrong. */
export function probeGround(
  phys: PhysicsWorld,
  x: number,
  z: number,
  exclude?: RAPIER.RigidBody,
): number | null {
  const ray = new RAPIER.Ray({ x, y: 4000, z }, { x: 0, y: -1, z: 0 });
  // Excluding the car matters: a ray dropped from 4 km up hits its roof first,
  // and "ground height" would come back as the top of the thing being measured.
  const hit = phys.world.castRay(ray, 8000, true, undefined, undefined, undefined, exclude);
  return hit ? 4000 - hit.timeOfImpact : null;
}

export function createWorld(hf: Heightfield, objects: WorldObject[]): PhysicsWorld {
  const world = new RAPIER.World({ x: 0, y: SIM.gravity, z: 0 });
  world.timestep = SIM.fixedTimestep;
  // §14.1's "4 solver substeps". Rapier calls these solver iterations; more of
  // them means a stiffer, less spongy contact response, which is what stops a
  // 1230 kg car settling into a heightfield under its own weight.
  world.integrationParameters.numSolverIterations = SIM.solverSubsteps;

  // The heightfield IS the ground. Not a mesh approximating the ground, not a
  // ribbon over it — the same Float32Array the renderer and the lint read.
  // Rapier reads the buffer as a column-major matrix whose FIRST index is z
  // and second is x, so nrows is the z count and ncols the x count. See the
  // note on Heightfield.heights: the transposed version builds without error
  // and drops the car through the ground on the start line.
  const groundBody = world.createRigidBody(
    RAPIER.RigidBodyDesc.fixed().setTranslation(
      hf.x0 + (hf.nx * hf.cell) / 2,
      0,
      hf.z0 + (hf.nz * hf.cell) / 2,
    ),
  );
  const ground = world.createCollider(
    RAPIER.ColliderDesc.heightfield(hf.nz, hf.nx, hf.heights, {
      x: hf.nx * hf.cell,
      y: 1,
      z: hf.nz * hf.cell,
    }),
    groundBody,
  );

  // --- Props -------------------------------------------------------------
  //
  // Tier 0 has no collider at all (§3.1) and Tier 1 is a break-away sensor, so
  // neither reaches the solver: at 40 grass per 100 m2 that is a hundred
  // thousand bodies for things the car passes straight through.
  //
  // The rest go on ONE fixed rigid body as many colliders, rather than one body
  // each. Measured: a body per prop gave 5,529 dynamic bodies on Ouninpohja and
  // the whole game ran at 1 fps. Rapier keeps static colliders in a separate
  // broad phase and never integrates them, so this costs almost nothing while
  // keeping the collision geometry exactly as authored.
  //
  // The cost, stated plainly: Tier 3 is specified as "falls, momentum
  // exchange" and here it does not fall. Collision, tier and damage
  // classification are all correct; only knock-down is missing, and it is
  // listed as a known gap in PHASES.md rather than pretended.
  const props = new Map<number, WorldObject>();
  const propBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
  for (const o of objects) {
    if (o.tier <= Tier.Yielding) continue;
    const [x, y, z] = o.transform.position;
    const half = Math.max(0.2, o.collider.height / 2);
    const radius = Math.max(0.08, o.collider.radius);
    const desc =
      o.collider.shape === 'box'
        ? RAPIER.ColliderDesc.cuboid(radius, half, radius)
        : RAPIER.ColliderDesc.cylinder(half, radius);
    desc
      .setTranslation(x, y + half, z)
      .setRotation(quatFromY(o.transform.rotationY))
      .setRestitution(0.15)
      .setFriction(0.6);
    const col = world.createCollider(desc, propBody);
    props.set(col.handle, o);
  }

  return { world, ground, props, time: 0 };
}

function quatFromY(angle: number) {
  return { x: 0, y: Math.sin(angle / 2), z: 0, w: Math.cos(angle / 2) };
}

/**
 * The accumulator.
 *
 * `maxCatchUpSteps` is the spiral guard: if the browser stalls for a second,
 * running 120 catch-up steps takes longer than a second and the next frame is
 * worse. Dropping the surplus makes the simulation briefly slower than real
 * time, which is always the right trade — a stutter beats a lock-up.
 */
export class FixedStepper {
  private accumulator = 0;
  /** Interpolation factor 0-1 between the last two physics states, for
   *  rendering. Without it a 120 Hz sim shown at 60 Hz visibly judders. */
  alpha = 0;
  steps = 0;

  advance(dtSeconds: number, step: (dt: number) => void): void {
    // Clamp the incoming delta too: a backgrounded tab returns with a delta of
    // several seconds.
    this.accumulator += Math.min(dtSeconds, 0.25);
    let n = 0;
    while (this.accumulator >= SIM.fixedTimestep && n < SIM.maxCatchUpSteps) {
      step(SIM.fixedTimestep);
      this.accumulator -= SIM.fixedTimestep;
      n++;
      this.steps++;
    }
    if (n === SIM.maxCatchUpSteps) this.accumulator = 0;
    this.alpha = this.accumulator / SIM.fixedTimestep;
  }
}
