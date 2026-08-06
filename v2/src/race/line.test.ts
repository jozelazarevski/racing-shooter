/* The racing line and its speed profile.
 *
 * These are properties, not golden numbers. A test that asserted "the offset at
 * segment 412 is -1.08" would fail the next time a stage's widths changed and
 * would say nothing about whether the line was correct. What must hold is:
 * it stays on the road, it is deterministic, it leans the right way through a
 * corner, and no speed in the profile asks the tyres for more than they have.
 */
import { describe, expect, it } from 'vitest';
import { SIM, SURFACES, VEHICLE } from '../../../spec/rally.constants.ts';
import { buildCorridor, cornerRuns, type Corridor } from '../world/corridor.ts';
import { Rng, hashString } from '../core/rng.ts';
import { STAGES } from '../world/stage.ts';
import { buildRacingLine } from './line.ts';

const G = Math.abs(SIM.gravity);

function corridorFor(id: string): Corridor {
  const def = STAGES.find((s) => s.id === id)!;
  return buildCorridor(def.moves, def.surface, new Rng(hashString(`line-test:${id}`)));
}

describe('the racing line stays on the road', () => {
  it('never leaves the roadbed, on any stage', () => {
    for (const def of STAGES) {
      const corridor = corridorFor(def.id);
      const line = buildRacingLine(corridor);
      const halfCar = VEHICLE.trackWidth / 2;
      for (let i = 0; i < corridor.segments.length; i++) {
        const edge = corridor.segments[i]!.roadbedWidth / 2;
        // The car's outer wheel, not its centre: the line is where the middle
        // of the car goes, and half a track width of it hangs off each side.
        expect(Math.abs(line.offset[i]!) + halfCar).toBeLessThanOrEqual(edge + 1e-9);
      }
    }
  });

  it('respects its own clamp, which the smoothing must never widen', () => {
    const corridor = corridorFor('col-de-turini');
    const line = buildRacingLine(corridor);
    for (let i = 0; i < corridor.segments.length; i++) {
      expect(line.limit[i]!).toBeLessThanOrEqual(
        corridor.segments[i]!.roadbedWidth / 2 - VEHICLE.trackWidth / 2 + 1e-9,
      );
      expect(Math.abs(line.offset[i]!)).toBeLessThanOrEqual(line.limit[i]! + 1e-9);
    }
  });
});

describe('determinism — a line is a property of the corridor', () => {
  it('rebuilds identically', () => {
    const corridor = corridorFor('fafe');
    const a = buildRacingLine(corridor);
    const b = buildRacingLine(corridor);
    expect(Array.from(b.offset)).toEqual(Array.from(a.offset));
    expect(Array.from(b.speed)).toEqual(Array.from(a.speed));
  });

  it('uses no randomness — two corridors from the same moves agree', () => {
    const def = STAGES.find((s) => s.id === 'fafe')!;
    const one = buildCorridor(def.moves, def.surface, new Rng(hashString('same')));
    const two = buildCorridor(def.moves, def.surface, new Rng(hashString('same')));
    expect(Array.from(buildRacingLine(one).offset)).toEqual(
      Array.from(buildRacingLine(two).offset),
    );
  });
});

describe('geometry', () => {
  it('leans toward the inside of a corner', () => {
    // The corridor normal is (-hz, hx) — the driver's right. A corner that
    // bends toward it is a right-hander, and its apex is on that side.
    const corridor = corridorFor('ouninpohja');
    const line = buildRacingLine(corridor);
    const segs = corridor.segments;
    let checked = 0;
    for (const run of cornerRuns(corridor)) {
      if (run.grade > 4) continue;              // only corners with a real apex
      const a = segs[run.from]!;
      const b = segs[run.to]!;
      const bend = (b.x - a.x) * -a.hz + (b.z - a.z) * a.hx;
      const apex = line.offset[Math.floor((run.from + run.to) / 2)]!;
      expect(Math.sign(apex)).toBe(Math.sign(bend));
      checked++;
    }
    expect(checked).toBeGreaterThan(0);
  });

  it('is smoother than the centreline it came from', () => {
    // The point of the relaxation. Total squared curvature, not peak: a
    // narrow corridor cannot open a corner much, but it can remove the
    // rattle the seeded width jitter puts into the road edge.
    const corridor = corridorFor('safari');
    const relaxed = buildRacingLine(corridor);
    const centre = buildRacingLine(corridor, { iterations: 0 });
    const energy = (k: Float64Array) => k.reduce((a, v) => a + v * v, 0);
    expect(energy(relaxed.curvature)).toBeLessThan(energy(centre.curvature));
  });
});

describe('the speed profile never asks for more than the tyres have', () => {
  it('stays inside the lateral friction limit everywhere', () => {
    for (const def of STAGES) {
      const corridor = corridorFor(def.id);
      const line = buildRacingLine(corridor);
      for (let i = 0; i < corridor.segments.length; i++) {
        const k = Math.abs(line.curvature[i]!);
        if (k < 1e-6) continue;
        const ay = line.speed[i]! ** 2 * k;
        const muLat = SURFACES[corridor.segments[i]!.surfaceId]!.muLat;
        expect(ay).toBeLessThanOrEqual(muLat * G + 1e-6);
      }
    }
  });

  it('can always slow down in time for what comes next', () => {
    // The backward pass, restated as the property it exists to guarantee.
    for (const def of STAGES) {
      const corridor = corridorFor(def.id);
      const line = buildRacingLine(corridor);
      const n = corridor.segments.length;
      for (let i = 0; i < n - 1; i++) {
        const muLong = SURFACES[corridor.segments[i]!.surfaceId]!.muLong;
        const ds = Math.max(0.01, line.distance[i + 1]! - line.distance[i]!);
        expect(line.speed[i]! ** 2).toBeLessThanOrEqual(
          line.speed[i + 1]! ** 2 + 2 * muLong * G * ds + 1e-6,
        );
      }
    }
  });

  it('holds the car down over a crest', () => {
    // §13's vertical geometry, as a speed limit. Ouninpohja's crests are the
    // ones that used to launch the reference lap off the road.
    const corridor = corridorFor('ouninpohja');
    const line = buildRacingLine(corridor);
    const segs = corridor.segments;
    for (let i = 1; i < segs.length - 1; i++) {
      const ds = Math.max(1e-3, segs[i + 1]!.distance - segs[i - 1]!.distance);
      const kv = (segs[i + 1]!.gradient - segs[i - 1]!.gradient) / ds;
      if (kv >= -1e-6) continue;
      // 1.3 g of vertical demand is the documented allowance; nothing may
      // exceed it, so nothing may be thrown into orbit by the profile.
      expect(line.speed[i]! ** 2 * -kv).toBeLessThanOrEqual(1.3 * G + 1e-6);
    }
  });

  it('accelerates from rest rather than starting at the limit', () => {
    const corridor = corridorFor('safari');
    const line = buildRacingLine(corridor);
    // The forward pass starts from whatever the first point allows, so early
    // speeds must climb — a profile that opened at 70 m/s on the grid would be
    // telling the driver to be flat out before the car has moved.
    expect(line.speed[0]!).toBeLessThan(line.speed[40]!);
  });
});

describe('the driver learns from a crash', () => {
  it('takes a fifth off the target approaching a place it came to grief', async () => {
    const { RoadDriver } = await import('./driver.ts');
    const corridor = corridorFor('safari');
    const d = new RoadDriver(corridor, 1);
    // A segment ~50 m before 2,000 m, which is inside the caution zone.
    const at = corridor.segments.findIndex((s) => s.distance > 1960);
    const before = d.targetSpeed(at);
    d.beCautiousAt(2000);
    expect(d.targetSpeed(at)).toBeCloseTo(before * 0.8, 5);
    d.beCautiousAt(2000);
    expect(d.targetSpeed(at)).toBeCloseTo(before * 0.64, 5);
  });

  it('leaves the rest of the stage alone', () => {
    // A caution at one corner must not slow the whole stage down.
    const corridor = corridorFor('safari');
    const far = corridor.segments.findIndex((s) => s.distance > 3000);
    return import('./driver.ts').then(({ RoadDriver }) => {
      const d = new RoadDriver(corridor, 1);
      const before = d.targetSpeed(far);
      d.beCautiousAt(1000);
      expect(d.targetSpeed(far)).toBe(before);
    });
  });

  it('stops cutting speed once it is slow enough to be pointless', () => {
    return import('./driver.ts').then(({ RoadDriver }) => {
      const corridor = corridorFor('safari');
      const d = new RoadDriver(corridor, 1);
      const at = corridor.segments.findIndex((s) => s.distance > 1960);
      const before = d.targetSpeed(at);
      for (let i = 0; i < 20; i++) d.beCautiousAt(2000);
      // The floor is 40% of the profile, so a driver that keeps failing keeps
      // moving instead of creeping to a halt.
      expect(d.targetSpeed(at)).toBeGreaterThanOrEqual(before * 0.4 - 1e-6);
    });
  });
});
