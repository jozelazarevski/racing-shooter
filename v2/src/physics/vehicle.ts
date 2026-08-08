/* The car: a Rapier rigid body on four raycast wheels.
 *
 * THIS FILE IS WHERE THE FIVE v1 BUGS STOP EXISTING, and it is worth being
 * precise about why, because "use a physics engine" is not an explanation.
 *
 *   Car sinks into the road      The body is a rigid body resting on the
 *                                heightfield collider. There is no code that
 *                                sets its height, so there is no code that can
 *                                set it wrong. Penetration is resolved by the
 *                                solver, in the only direction it can be.
 *
 *   Car ignores the inclination  Body orientation is integrated from torque.
 *                                v1 derived pitch from CLIMB RATE, which is
 *                                zero when stopped — park on a hill and the
 *                                car stood upright. Here, four suspension
 *                                springs at different compressions produce a
 *                                pitching moment whether or not anything moves.
 *
 *   Car jumps constantly         There is no launch heuristic. The car leaves
 *                                the ground when the suspension reaches full
 *                                extension and the wheels stop finding
 *                                anything, which is what leaving the ground is.
 *
 * What remains hand-written is the tyre and suspension model, because Rapier
 * does not have one — and that is deliberate: it is where the driving feel
 * lives, and §8 specifies it in full.
 */
import RAPIER from '@dimforge/rapier3d-compat';
import {
  VEHICLE, SUSPENSION, STEERING, BRAKES, SIM, AIR, ROLLOVER,
  DAMAGE_ENERGY_BANDS_J, INCIDENCE_BANDS, SURFACES,
} from '../../../spec/rally.constants.ts';
import { tyreForce, relaxSlip, relaxationLength, type SurfaceId, type Compound, type WeatherId } from './tyre.ts';
import type { PhysicsWorld } from './world.ts';

const WHEEL_RADIUS = 0.34;

export interface DriverInput {
  /** -1 (left) to 1 (right). */
  steer: number;
  /** 0 to 1. */
  throttle: number;
  /** 0 to 1. */
  brake: number;
  handbrake: boolean;
  /** Gear change requests, consumed on read. */
  shiftUp?: boolean;
  shiftDown?: boolean;
  /** Held, not edge-triggered: the cannon has its own rate of fire. */
  fire?: boolean;
}

interface Wheel {
  /** Attachment point in body space. */
  ax: number;
  ay: number;
  az: number;
  steered: boolean;
  driven: boolean;
  front: boolean;
  /** Wheel spin, rad/s. */
  omega: number;
  /** Suspension compression, metres. */
  compression: number;
  lastCompression: number;
  grounded: boolean;
  load: number;
  slipRatio: number;
  slipAngle: number;
  utilisation: number;
  /** World contact point, for rendering dust and for debug. */
  contact: { x: number; y: number; z: number };
  /** Diagnostics: ray distance and what it hit. */
  hitDist: number;
  hitGround: boolean;
  surface: SurfaceId;
}

/** §3.2 gearing. Ratios chosen so the spec's 220 kW / 425 Nm reaches its
 *  quoted rev limit in each gear at sensible road speeds. */
const GEAR_RATIOS = [3.58, 2.26, 1.64, 1.28, 1.0];
const FINAL_DRIVE = 3.9;

export interface VehicleTelemetry {
  speedMs: number;
  speedKmh: number;
  rpm: number;
  gear: number;
  wheels: Wheel[];
  airborne: boolean;
  airtime: number;
  /** Cumulative impact energy, joules — the §9 damage currency. */
  damageJ: number;
  lastImpact: { klass: string; band: string; energyJ: number; angleDeg: number } | null;
  onRoof: boolean;
  /** Seconds spent past ROLLOVER.triggerRollDeg. §7 resets at 2.5 s. */
  roofTime: number;
}

export class Vehicle {
  readonly body: RAPIER.RigidBody;
  private readonly wheels: Wheel[];
  private readonly phys: PhysicsWorld;

  gear = 1;
  rpm = 1000;
  /** Sequential automatic. Manual paddles still work; they just also exist. */
  automatic = true;
  private shiftCooldown = 0;
  private steerAngle = 0;
  private airtime = 0;
  private onRoofFor = 0;
  damageJ = 0;
  lastImpact: VehicleTelemetry['lastImpact'] = null;

  compound: Compound = 'gravel';
  weather: WeatherId = 'clear';
  surface: SurfaceId = 'gravel_loose';

  constructor(phys: PhysicsWorld, x: number, y: number, z: number, heading: number) {
    this.phys = phys;
    const desc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(x, y, z)
      .setRotation({ x: 0, y: Math.sin(heading / 2), z: 0, w: Math.cos(heading / 2) })
      .setLinearDamping(0.02)
      .setAngularDamping(0.4)
      // §14: continuous collision detection above 25 m/s, so a 200 km/h car
      // cannot tunnel through a tree between two 1/120 s steps.
      .setCcdEnabled(true)
      .setAdditionalMassProperties(
        VEHICLE.mass,
        { x: 0, y: 0, z: 0 },                      // CoM at the body origin
        { x: VEHICLE.inertiaPitch, y: VEHICLE.inertiaYaw, z: VEHICLE.inertiaRoll },
        { w: 1, x: 0, y: 0, z: 0 },
      );
    this.body = phys.world.createRigidBody(desc);

    // RIDE HEIGHT, and it has to be got right rather than eyeballed.
    //
    // A wheel ray starts at its attachment and runs `travel + radius` = 0.54 m
    // down. At the static compression this spring rate implies (~0.08 m under
    // a quarter of 1230 kg) the contact sits 0.46 m below the attachment, so
    // the body origin rests 0.52 m up — which is exactly VEHICLE.cogHeight, as
    // it should be.
    //
    // The hull must clear that. Half-height 0.35 raised 0.25 puts its underside
    // 0.10 m below the origin, so 0.42 m of air under the car at rest. The
    // first cut had the hull underside and the wheel attachment at the same
    // height: the hull rested ON the ground, every ray reported full travel,
    // and four bottomed-out springs threw the car 80 m into the sky. Isolating
    // it took one test — stepping Rapier with my forces switched off, where the
    // car settled and sat still.
    const half = { x: VEHICLE.trackWidth / 2, y: 0.35, z: VEHICLE.wheelbase / 2 + 0.4 };
    const col = RAPIER.ColliderDesc.cuboid(half.x, half.y, half.z)
      .setTranslation(0, 0.25, 0)
      .setDensity(0)                 // mass comes from the spec, below
      .setRestitution(0.12)
      .setFriction(0.4);
    phys.world.createCollider(col, this.body);

    // MASS PROPERTIES, and they are specified rather than left to the collider.
    //
    // Taking the mass from the hull box put the centre of mass at the box's
    // centre — 0.77 m above the ground, against VEHICLE.cogHeight of 0.52 m.
    // Roll resistance goes as track / (2 * cogHeight), so a CoG 50% too high
    // drops the rollover threshold from about 1.54 g to 1.04 g: below the grip
    // a tarmac tyre can generate, which means the car tips over in any corner
    // it could otherwise take. It also ignored VEHICLE.inertiaYaw/Roll/Pitch
    // entirely, so the body span of the box was setting the rotational feel.
    //
    // Rapier's principal inertia is about the local axes: x is the pitch axis
    // (across the car), y yaw (vertical), z roll (along it).
    const front = VEHICLE.wheelbase * (1 - VEHICLE.weightDistributionFront);
    const rear = -VEHICLE.wheelbase * VEHICLE.weightDistributionFront;
    const t = VEHICLE.trackWidth / 2;
    const ay = -0.06;   // see the ride-height note above
    const mk = (ax: number, az: number, steered: boolean, isFront: boolean): Wheel => ({
      ax, ay, az, steered, driven: true, front: isFront,
      omega: 0, compression: 0, lastCompression: 0, grounded: false, load: 0,
      slipRatio: 0, slipAngle: 0, utilisation: 0,
      contact: { x: 0, y: 0, z: 0 },
      hitDist: -1, hitGround: false,
      surface: 'gravel_loose',
    });
    this.wheels = [
      mk(-t, front, true, true),
      mk(t, front, true, true),
      mk(-t, rear, false, false),
      mk(t, rear, false, false),
    ];
  }

  get telemetry(): VehicleTelemetry {
    const v = this.body.linvel();
    const speed = Math.hypot(v.x, v.y, v.z);
    return {
      speedMs: speed,
      speedKmh: speed * 3.6,
      rpm: this.rpm,
      gear: this.gear,
      wheels: this.wheels,
      airborne: this.airtime > 0.08,
      airtime: this.airtime,
      damageJ: this.damageJ,
      lastImpact: this.lastImpact,
      onRoof: this.onRoofFor > 0.2,
      roofTime: this.onRoofFor,
    };
  }

  /** One fixed physics step. Called only from the accumulator. */
  step(input: DriverInput, dt: number): void {
    // Rapier's addForce/addTorque are PERSISTENT — they stay applied until
    // explicitly reset, unlike an impulse. Every force this method adds is a
    // this-step-only force, so the slate has to be wiped first.
    //
    // Without this the car flew. Not from the suspension: aerodynamic drag
    // opposes velocity, so a car falling at 1 m/s gets a small upward force,
    // which is still applied on the next step, and the next. Accumulated at
    // 120 Hz it reached tens of thousands of newtons and threw the car 86 m
    // up, then reversed sign and drove it into the ground just as hard. The
    // give-away in the trace was that no wheel ever reported contact while the
    // car was being launched — so it could not be the springs.
    this.body.resetForces(false);
    this.body.resetTorques(false);

    const susp = this.surface.startsWith('tarmac') ? SUSPENSION.tarmac : SUSPENSION.gravel;
    const rot = this.body.rotation();
    const pos = this.body.translation();

    const fwd = rotate(rot, { x: 0, y: 0, z: 1 });
    const right = rotate(rot, { x: 1, y: 0, z: 0 });
    const up = rotate(rot, { x: 0, y: 1, z: 0 });

    // --- steering, §4 ------------------------------------------------------
    const speed = length(this.body.linvel());
    const maxLock = ((this.surface.startsWith('tarmac') ? STEERING.maxLockTarmacDeg : STEERING.maxLockGravelDeg) * Math.PI) / 180;
    // Speed-sensitive: full lock at a standstill would be undrivable at speed,
    // and this is specified rather than a feel choice.
    const speedFactor = 1 - STEERING.speedSensitiveFactor * Math.min(1, speed / STEERING.speedSensitiveReference);
    const target = input.steer * maxLock * speedFactor;
    const rackRate = (STEERING.rackSpeedDegPerSec * Math.PI) / 180;
    this.steerAngle += clamp(target - this.steerAngle, -rackRate * dt, rackRate * dt);

    // --- gearbox -----------------------------------------------------------
    if (input.shiftUp && this.gear < VEHICLE.gearCount) this.gear++;
    if (input.shiftDown && this.gear > 1) this.gear--;
    // Sequential automatic by default. A five-speed box with no auto-shift and
    // no limiter let the car reach 243 km/h in first gear in the smoke test —
    // physically nonsense, and nothing about it looked wrong on screen.
    if (this.automatic) {
      if (this.shiftCooldown > 0) this.shiftCooldown -= dt;
      else if (this.rpm > VEHICLE.revLimit * 0.94 && this.gear < VEHICLE.gearCount) {
        this.gear++;
        this.shiftCooldown = VEHICLE.shiftTimeMs / 1000 + 0.25;
      } else if (this.rpm < 2400 && this.gear > 1) {
        this.gear--;
        this.shiftCooldown = VEHICLE.shiftTimeMs / 1000 + 0.25;
      }
    }
    const ratio = GEAR_RATIOS[this.gear - 1]! * FINAL_DRIVE;

    // Engine speed follows the driven wheels.
    let drivenOmega = 0;
    let drivenCount = 0;
    for (const w of this.wheels) if (w.driven) { drivenOmega += w.omega; drivenCount++; }
    drivenOmega /= Math.max(1, drivenCount);
    this.rpm = clamp(Math.abs(drivenOmega) * ratio * (60 / (2 * Math.PI)), 900, VEHICLE.revLimit);

    // §3: torque curve peaking at 3500 rpm, falling to the limiter.
    const rpmN = this.rpm / VEHICLE.peakTorqueRpm;
    const torqueCurve = rpmN <= 1 ? 0.55 + 0.45 * rpmN : Math.max(0.35, 1 - 0.42 * (rpmN - 1));
    // The limiter, and the shift interruption. Without a hard cut the wheels
    // keep accelerating past the rev limit for ever: clamping the DISPLAYED rpm
    // does nothing, because the torque is computed from a curve that never
    // reaches zero.
    const limited = this.rpm >= VEHICLE.revLimit * 0.995 || this.shiftCooldown > VEHICLE.shiftTimeMs / 1000;
    const engineTorque = limited ? 0 : VEHICLE.peakTorqueNm * torqueCurve * input.throttle;
    // Centre diff split, §3. All four driven — this is a rally car.
    const wheelTorque = (engineTorque * ratio) / 4;

    // --- wheels ------------------------------------------------------------
    const restLength = susp.travel;
    const rayLen = restLength + WHEEL_RADIUS;
    let groundedCount = 0;

    // PASS 1 — probe every wheel before applying any force.
    //
    // This split is what finally made the anti-roll bars work. A bar's force
    // depends on the compression DIFFERENCE across an axle, so a single loop
    // has to read its partner's compression from the previous step. Feeding a
    // step-stale value through a 620 Nm/deg bar oscillates: both earlier
    // attempts were measurably worse than having no bar at all, whichever sign
    // they used. With both compressions current, the bar is just a spring
    // between two known positions.
    const probes = this.wheels.map((w) => {
      const origin = add(pos, add(scale(right, w.ax), add(scale(up, w.ay), scale(fwd, w.az))));
      const down = scale(up, -1);
      const hit = this.phys.world.castRayAndGetNormal(
        new RAPIER.Ray(origin, down), rayLen, true, undefined, undefined, undefined, this.body,
      );
      const wasGrounded = w.grounded;
      w.lastCompression = w.compression;
      w.compression = hit ? clamp(rayLen - hit.timeOfImpact, 0, restLength) : 0;
      return { w, origin, down, hit, wasGrounded };
    });

    // PASS 2 — forces.
    for (const { w, origin, down, hit, wasGrounded } of probes) {
      if (!hit) {
        w.grounded = false;
        w.hitDist = -1;
        w.hitGround = false;
        w.load = 0;
        w.utilisation = 0;
        // Free-spinning wheel: engine torque still accelerates it, so the revs
        // flare in the air the way they should.
        w.omega += ((w.driven ? wheelTorque : 0) / 8) * dt;
        w.omega *= 1 - 0.6 * dt;
        continue;
      }

      groundedCount++;
      w.grounded = true;
      const dist = hit.timeOfImpact;
      w.hitDist = dist;
      w.hitGround = hit.collider?.handle === this.phys.ground.handle;
      const contact = add(origin, scale(down, dist));
      w.contact = contact;

      const normal = hit.normal;

      // --- suspension, §5 --------------------------------------------------
      const springRate = w.front ? susp.springFront : susp.springRear;
      // §5 anti-roll bar. arbFront 620, arbRear 480 Nm/deg. The bar transfers
      // load ONTO the more-compressed side to resist the roll, so the sign is
      // positive; taking load off that side amplifies roll instead. Both
      // compressions come from pass 1, so neither is stale.
      const partner = this.wheels[w.front ? (w.ax < 0 ? 1 : 0) : (w.ax < 0 ? 3 : 2)]!;
      const arb = w.front ? susp.arbFront : susp.arbRear;
      const rollDeg = (Math.atan2(w.compression - partner.compression, VEHICLE.trackWidth) * 180) / Math.PI;
      // Two guards, both physical rather than fudges:
      //
      //  - the bar needs BOTH wheels on the ground to react against. With one
      //    wheel in the air the compression difference is the whole travel, and
      //    the bar drives the grounded side down hard at exactly the moment the
      //    car is already tipping.
      //  - clamped to a third of the static corner load. A torsion bar that can
      //    out-push the spring it is helping is not a bar, it is a jack.
      const arbCap = 0.33 * (VEHICLE.mass * -SIM.gravity) / 4;
      const arbForce = partner.grounded ? clamp((arb * rollDeg) / VEHICLE.trackWidth, -arbCap, arbCap) : 0;
      // The damper must not see the step change from "not touching" to
      // "touching". On the frame a wheel lands, (compression - 0) / (1/120) is
      // a compression rate of ~24 m/s, and 4200 N.s/m of bump damping turns
      // that into a 100 kN spike — four of those launched the car off the start
      // line every time and it never came down. Rate is zero on the landing
      // frame, and clamped after: real damper velocities are metres per second,
      // not tens.
      const rawRate = wasGrounded ? (w.compression - w.lastCompression) / dt : 0;
      const compressionRate = clamp(rawRate, -8, 8);
      const damping = compressionRate > 0 ? susp.bumpDamping : susp.reboundDamping;
      // F = k*x + c*x_dot. The PLUS is the whole thing: a damper resists the
      // motion it is undergoing, so while the suspension is compressing it
      // pushes the body up HARDER, not less. With a minus the damper feeds
      // energy in instead of taking it out — the car pitched nose-down, rebounded
      // past equilibrium, and bounced itself off the ground within half a second.
      // Every compression figure looked plausible at the first contact, which is
      // what made it worth tracing frame by frame rather than eyeballing.
      let force = springRate * w.compression + damping * compressionRate + arbForce;

      // Bump stop: the last 30 mm of travel is 6x stiffer. Without it a big
      // landing bottoms out silently and the car simply passes through.
      const intoStop = w.compression - (restLength - susp.bumpStopZone);
      if (intoStop > 0) force += springRate * susp.bumpStopRateMultiplier * intoStop;
      // A spring cannot pull the car down, and no suspension on earth delivers
      // eight times static load. The ceiling is a guard against a geometry
      // mistake becoming a catapult rather than a tuning value.
      force = clamp(force, 0, 8 * (VEHICLE.mass * -SIM.gravity) / 4);
      w.load = force;

      // Suspension pushes along the CONTACT NORMAL, not the body's up axis.
      // That is what makes the car follow the camber of the road instead of
      // hovering at its own attitude, and it works standing still.
      this.body.addForceAtPoint(scale(normal, force), contact, true);

      // --- tyre, §8 --------------------------------------------------------
      const vAt = this.velocityAt(contact);
      // Wheel frame: steered wheels rotate about the contact normal.
      const steer = w.steered ? this.steerAngle : 0;
      const wf = normalise(projectOnPlane(rotateAxis(fwd, up, steer), normal));
      const wr = normalise(cross(normal, wf));

      const vLong = dot(vAt, wf);
      const vLat = dot(vAt, wr);

      // Slip ratio: (wheel surface speed - ground speed) / |ground speed|.
      // The +1 guard keeps it finite at a standstill, which is where a naive
      // division sends the tyre force to infinity and the car to the moon.
      const wheelSpeed = w.omega * WHEEL_RADIUS;
      const targetSlip = (wheelSpeed - vLong) / Math.max(1, Math.abs(vLong));
      w.slipRatio = relaxSlip(w.slipRatio, clamp(targetSlip, -4, 4), speed, relaxationLength(w.surface), dt);
      // SAE convention: alpha = atan(vLat / vLong), and tyre.ts already
      // negates the Magic Formula output so the force OPPOSES the slip.
      // Negating vLat here as well made it reinforce: any sideways drift grew
      // its own driving force, and the car slid, spun and ended up on its roof
      // on every stage. Two minus signs, three levels apart.
      w.slipAngle = Math.atan2(vLat, Math.max(0.8, Math.abs(vLong)));

      const f = tyreForce({
        slipRatio: w.slipRatio,
        slipAngle: w.slipAngle,
        load: force,
        surface: this.surface,
        compound: this.compound,
        weather: this.weather,
      });
      w.utilisation = f.utilisation;

      this.body.addForceAtPoint(add(scale(wf, f.fx), scale(wr, f.fy)), contact, true);

      // --- wheel spin ------------------------------------------------------
      const rollingResistance = (SURFACES[this.surface]?.rollingResistance ?? 0.03) * force * Math.sign(w.omega);
      let brakeTorque = (w.front ? BRAKES.torqueFront : BRAKES.torqueRear) * input.brake;
      if (input.handbrake && !w.front) brakeTorque += BRAKES.torqueRear * 1.6;
      const drive = w.driven ? wheelTorque : 0;
      const reaction = -f.fx * WHEEL_RADIUS;
      // Rotational inertia at the wheel: the wheel and hub, PLUS the engine and
      // gearbox seen through the gearing, which scales with the square of the
      // ratio. Omitting the reflected term is not a small error — in first gear
      // it is 0.2 * (3.58 * 3.9)^2 / 4 ~= 10 kg m^2 against the wheel's own 1.4,
      // so the driveline came out eight times too light. Full throttle from rest
      // spun the wheels straight past the friction peak, the revs climbed into
      // an upshift, and the car sat at the start line in fourth gear going
      // 25 km/h. This is why a real car needs a clutch and why the model needs
      // this term.
      const ENGINE_INERTIA = 0.22;                       // kg m^2 at the crank
      const inertia = 1.4 + (ENGINE_INERTIA * ratio * ratio) / 4;
      let domega = (drive + reaction - rollingResistance * WHEEL_RADIUS) / inertia;
      domega -= (brakeTorque / inertia) * Math.sign(w.omega);
      w.omega += domega * dt;
      // A brake stronger than the wheel's momentum must lock it, not reverse
      // it — sign-flipping is how hand-rolled models produce phantom reverse.
      if (brakeTorque > 0 && Math.sign(w.omega) !== Math.sign(w.omega - domega * dt)) w.omega = 0;
      if (input.handbrake && !w.front) w.omega = 0;
    }

    // --- aero, §3 ----------------------------------------------------------
    const v = this.body.linvel();
    if (speed > 0.5) {
      const drag = 0.5 * 1.225 * VEHICLE.dragCoefficient * VEHICLE.frontalArea * speed * speed;
      this.body.addForce(scale(normalise(v), -drag), true);
      const downforce = VEHICLE.downforceAt40ms * (speed / 40) ** 2;
      this.body.addForce({ x: 0, y: -downforce, z: 0 }, true);
    }

    // --- airborne, §6 ------------------------------------------------------
    if (groundedCount === 0) {
      this.airtime += dt;
      // Limited attitude authority in the air. Real, and the difference
      // between a jump you can save and one you cannot.
      const decay = this.airtime > AIR.authorityDecayAfter ? AIR.authorityDecayFactor : 1;
      const pitch = (AIR.pitchAuthorityDegPerSec * Math.PI) / 180 * decay;
      this.body.applyTorqueImpulse(scale(right, -input.brake * pitch * VEHICLE.inertiaPitch * dt * 0.02), true);
      this.body.applyTorqueImpulse(scale(right, input.throttle * pitch * VEHICLE.inertiaPitch * dt * 0.02), true);
      const yaw = (AIR.yawAuthorityDegPerSec * Math.PI) / 180 * decay;
      this.body.applyTorqueImpulse(scale(up, -input.steer * yaw * VEHICLE.inertiaYaw * dt * 0.02), true);
    } else {
      this.airtime = 0;
    }

    // --- rollover, §7 ------------------------------------------------------
    this.onRoofFor = dot(up, { x: 0, y: 1, z: 0 }) < Math.cos((ROLLOVER.triggerRollDeg * Math.PI) / 180)
      ? this.onRoofFor + dt
      : 0;
  }

  /** Velocity of the body at a world point, including rotation. */
  private velocityAt(p: { x: number; y: number; z: number }) {
    const v = this.body.linvel();
    const w = this.body.angvel();
    const c = this.body.translation();
    const r = { x: p.x - c.x, y: p.y - c.y, z: p.z - c.z };
    return {
      x: v.x + (w.y * r.z - w.z * r.y),
      y: v.y + (w.z * r.x - w.x * r.z),
      z: v.z + (w.x * r.y - w.y * r.x),
    };
  }

  /**
   * §9.4 — an impact, classified by angle of incidence and energy.
   *
   * This is the specified version of the thing r65 added to v1 by hand. The
   * five bands and their numbers come from the table; the energy is real
   * joules, ½ m v_n², not a hull number tuned until it felt right.
   */
  registerImpact(normalSpeed: number, incidenceDeg: number): void {
    const energyJ = 0.5 * VEHICLE.mass * normalSpeed * normalSpeed;
    const band = INCIDENCE_BANDS.find((b) => incidenceDeg <= b.maxAngleDeg) ?? INCIDENCE_BANDS[INCIDENCE_BANDS.length - 1]!;
    const klass = DAMAGE_ENERGY_BANDS_J.find((b) => energyJ <= b.max)!.klass;
    this.damageJ += energyJ;
    this.lastImpact = { klass, band: band.name, energyJ, angleDeg: incidenceDeg };

    // Speed loss from the band, applied as an impulse against travel.
    const loss = band.speedLoss[0] + (band.speedLoss[1] - band.speedLoss[0]) * Math.min(1, incidenceDeg / band.maxAngleDeg);
    const v = this.body.linvel();
    this.body.setLinvel({ x: v.x * (1 - loss), y: v.y, z: v.z * (1 - loss) }, true);
  }

  /** Put the car back on the road, upright. Phase 3 makes these reset nodes;
   *  for now it is the manual recovery any rally game needs. */
  reset(x: number, y: number, z: number, heading: number): void {
    this.body.setTranslation({ x, y, z }, true);
    this.body.setRotation({ x: 0, y: Math.sin(heading / 2), z: 0, w: Math.cos(heading / 2) }, true);
    this.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
    this.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
    for (const w of this.wheels) { w.omega = 0; w.slipRatio = 0; w.slipAngle = 0; }
    this.gear = 1;
    this.onRoofFor = 0;
  }
}

export { WHEEL_RADIUS, SIM };

// --- small vector helpers ---------------------------------------------------
type V = { x: number; y: number; z: number };
const add = (a: V, b: V): V => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
const scale = (a: V, s: number): V => ({ x: a.x * s, y: a.y * s, z: a.z * s });
const dot = (a: V, b: V) => a.x * b.x + a.y * b.y + a.z * b.z;
const cross = (a: V, b: V): V => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
});
const length = (a: V) => Math.hypot(a.x, a.y, a.z);
const normalise = (a: V): V => { const l = length(a) || 1; return scale(a, 1 / l); };
const projectOnPlane = (a: V, n: V): V => add(a, scale(n, -dot(a, n)));
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function rotate(q: { x: number; y: number; z: number; w: number }, v: V): V {
  const t = cross({ x: q.x, y: q.y, z: q.z }, v);
  return add(v, add(scale(t, 2 * q.w), scale(cross({ x: q.x, y: q.y, z: q.z }, t), 2)));
}

/** Rodrigues rotation of `v` about unit `axis` by `angle`. */
function rotateAxis(v: V, axis: V, angle: number): V {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return add(add(scale(v, c), scale(cross(axis, v), s)), scale(axis, dot(axis, v) * (1 - c)));
}
