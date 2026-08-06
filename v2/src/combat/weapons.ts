/* Weapons — the thing that makes this IGNITE RALLY rather than a rally sim.
 *
 * `CONFORMANCE.md` settled the contradiction: the spec's §17 says the game has
 * no weapons, but nothing in its physics, collision, surface, water, air or
 * damage model conflicts with a car that also carries a cannon. The tiers,
 * joules and incidence bands are indifferent to whether a projectile exists.
 * So weapons are an additive layer on top of a conformant core — and this file
 * is careful to keep it that way:
 *
 *   - a hit is scored in JOULES and classified by DAMAGE_ENERGY_BANDS_J, the
 *     same currency a collision uses. A shell and a tree are the same kind of
 *     event to the damage model.
 *   - what a hit does to an object is decided by its §3.1 TIER. Tier 4 is
 *     "hard static, full stop" and shrugs a shell off with a spark; Tier 1 and
 *     2 break away. That is the same table that decides what happens when you
 *     drive into them, so the world stays readable: silhouette tells you what
 *     an object will do, whether you hit it or shoot it.
 *
 * Projectiles are raycast per step rather than simulated as bodies. At 400 m/s
 * and a 1/120 s step a shell moves 3.3 m per tick, so a body would tunnel
 * through every tree on the stage; a segment cast between last and current
 * position cannot. It is also far cheaper, and deterministic.
 */
import RAPIER from '@dimforge/rapier3d-compat';
import { DAMAGE_ENERGY_BANDS_J, Tier, VEHICLE } from '../../../spec/rally.constants.ts';
import type { PhysicsWorld } from '../physics/world.ts';
import type { WorldObject } from '../world/scatter.ts';

export interface WeaponSpec {
  name: string;
  /** Muzzle velocity, m/s. */
  muzzle: number;
  /** Projectile mass, kg. Energy is ½mv², so this is what sets the damage. */
  mass: number;
  /** Seconds between shots. */
  interval: number;
  /** Rounds carried. */
  capacity: number;
  /** Seconds to refill one round. A cannon that runs dry for good is not a
   *  weapon, it is a countdown. */
  reload: number;
  /** Metres. Past this the shell is spent. */
  range: number;
}

export const CANNON: WeaponSpec = {
  name: 'CANNON',
  muzzle: 400,
  mass: 0.9,        // 0.5 * 0.9 * 400^2 = 72 kJ — "major" on the §9 band table
  interval: 0.32,
  capacity: 12,
  reload: 1.6,
  range: 420,
};

export interface Shot {
  x: number; y: number; z: number;
  px: number; py: number; pz: number;   // previous position, for the segment cast
  vx: number; vy: number; vz: number;
  travelled: number;
  alive: boolean;
}

export interface HitEvent {
  x: number; y: number; z: number;
  energyJ: number;
  klass: string;
  /** The object struck, if it was a prop. */
  object: WorldObject | null;
  /** True if the shell hit the rival car. */
  hitRival: boolean;
  /** True if the object was destroyed by this hit. */
  destroyed: boolean;
  /** Collider struck, for diagnostics. */
  colliderHandle: number | undefined;
}

const MAX_SHOTS = 24;

export class Cannon {
  readonly spec: WeaponSpec;
  readonly shots: Shot[] = [];
  ammo: number;
  private cooldown = 0;
  private reloadTimer = 0;

  constructor(private readonly phys: PhysicsWorld, spec: WeaponSpec = CANNON) {
    this.spec = spec;
    this.ammo = spec.capacity;
    for (let i = 0; i < MAX_SHOTS; i++) {
      this.shots.push({ x: 0, y: 0, z: 0, px: 0, py: 0, pz: 0, vx: 0, vy: 0, vz: 0, travelled: 0, alive: false });
    }
  }

  get ready(): boolean {
    return this.cooldown <= 0 && this.ammo > 0;
  }

  /** Fire from a muzzle position along a direction, inheriting the car's own
   *  velocity — a shell fired forwards at 200 km/h is faster over the ground
   *  than one fired from a standstill, and a player who has noticed that is
   *  playing the game properly. */
  fire(
    mx: number, my: number, mz: number,
    dx: number, dy: number, dz: number,
    carVx: number, carVy: number, carVz: number,
  ): boolean {
    if (!this.ready) return false;
    const shot = this.shots.find((s) => !s.alive);
    if (!shot) return false;
    const len = Math.hypot(dx, dy, dz) || 1;
    shot.x = shot.px = mx;
    shot.y = shot.py = my;
    shot.z = shot.pz = mz;
    shot.vx = (dx / len) * this.spec.muzzle + carVx;
    shot.vy = (dy / len) * this.spec.muzzle + carVy;
    shot.vz = (dz / len) * this.spec.muzzle + carVz;
    shot.travelled = 0;
    shot.alive = true;
    this.ammo--;
    this.cooldown = this.spec.interval;
    return true;
  }

  /**
   * Advance every live shell one physics step and resolve hits.
   *
   * @param excludeBody the firer, so a shell cannot hit the car that fired it.
   * @returns the hits scored this step.
   */
  step(dt: number, excludeBody: RAPIER.RigidBody, rivalBody: RAPIER.RigidBody | null): HitEvent[] {
    this.cooldown -= dt;

    // Trickle reload, so running dry is a lull rather than an ending.
    if (this.ammo < this.spec.capacity) {
      this.reloadTimer += dt;
      if (this.reloadTimer >= this.spec.reload) {
        this.reloadTimer = 0;
        this.ammo++;
      }
    }

    const hits: HitEvent[] = [];
    for (const s of this.shots) {
      if (!s.alive) continue;
      s.px = s.x; s.py = s.y; s.pz = s.z;
      // Shells drop. At 400 m/s over 420 m that is about half a second of
      // flight and ~1.4 m of drop — enough to matter at long range, which is
      // what makes aiming a skill rather than a click.
      s.vy -= 9.81 * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.z += s.vz * dt;

      const segX = s.x - s.px;
      const segY = s.y - s.py;
      const segZ = s.z - s.pz;
      const segLen = Math.hypot(segX, segY, segZ);
      s.travelled += segLen;
      if (s.travelled > this.spec.range) { s.alive = false; continue; }
      if (segLen <= 0) continue;

      // Cast along the segment actually travelled this step — not from the
      // muzzle, and not a point test at the new position. At 3.3 m per tick a
      // point test walks straight through a 0.4 m trunk.
      const hit = this.phys.world.castRayAndGetNormal(
        new RAPIER.Ray(
          { x: s.px, y: s.py, z: s.pz },
          { x: segX / segLen, y: segY / segLen, z: segZ / segLen },
        ),
        segLen, true, undefined, undefined, undefined, excludeBody,
      );
      if (!hit) continue;

      s.alive = false;
      const t = hit.timeOfImpact;
      const hx = s.px + (segX / segLen) * t;
      const hy = s.py + (segY / segLen) * t;
      const hz = s.pz + (segZ / segLen) * t;

      const speed = Math.hypot(s.vx, s.vy, s.vz);
      const energyJ = 0.5 * this.spec.mass * speed * speed;
      const klass = DAMAGE_ENERGY_BANDS_J.find((b) => energyJ <= b.max)!.klass;

      const handle = hit.collider?.handle;
      const object = handle === undefined ? null : (this.phys.props.get(handle) ?? null);
      const hitRival = rivalBody !== null && hit.collider?.parent()?.handle === rivalBody.handle;

      // §3.1 decides the outcome, exactly as it does for a collision. Tier 4 is
      // "hard static, full stop" — a mature trunk or a stone wall does not come
      // down because you shot it, and pretending otherwise would break the
      // promise that silhouette tells you what an object will do.
      let destroyed = false;
      if (object && object.tier <= Tier.HeavyMovable && handle !== undefined) {
        const col = this.phys.world.getCollider(handle);
        if (col) {
          this.phys.world.removeCollider(col, true);
          this.phys.props.delete(handle);
          destroyed = true;
        }
      }

      hits.push({ x: hx, y: hy, z: hz, energyJ, klass, object, hitRival, destroyed, colliderHandle: handle });
    }
    return hits;
  }

  /** Damage a shell does to a car, on the §9 hull scale used elsewhere. */
  static damageToCar(energyJ: number): number {
    // Same currency as a collision: a 72 kJ shell is "major", which is a
    // meaningful but survivable share of the 120 kJ terminal figure.
    return energyJ;
  }
}

export { VEHICLE };
