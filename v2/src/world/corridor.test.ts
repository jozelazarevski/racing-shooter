/* Corridor geometry, and one test that exists because the lint agreed with the
 * bug it was supposed to catch.
 *
 * §1.3 gives every Grade 1-3 corner a runoff figure — 5 m at a hairpin — and
 * §1.2 puts it on the shoulder. Which shoulder was decided by a string-to-index
 * mapping written in two places, both of them backwards, and the L08 lint read
 * the same inverted index. Everything agreed and everything was wrong: the
 * runoff was built on the INSIDE of every slow corner on every stage, where no
 * car has ever left the road.
 *
 * So this test does not ask the code which side is the outside. It measures
 * where the road goes.
 */
import { describe, expect, it } from 'vitest';
import { CORNER_GRADES } from '../../../spec/rally.constants.ts';
import { Rng, hashString } from '../core/rng.ts';
import { buildCorridor, cornerRuns, outsideOfCorner } from './corridor.ts';
import { STAGES } from './stage.ts';

describe('§1.3 runoff goes on the outside of the corner', () => {
  it('holds on every slow corner of every stage, measured geometrically', () => {
    for (const def of STAGES) {
      const corridor = buildCorridor(def.moves, def.surface, new Rng(hashString(`runoff:${def.id}`)));
      const segs = corridor.segments;
      let checked = 0;
      for (const run of cornerRuns(corridor)) {
        if (run.grade > 3) continue;
        const needed = CORNER_GRADES.find((g) => g.grade === run.grade)!.runoff;
        // Where does the road actually go? Project the displacement across the
        // run onto the entry normal. Positive means it bends toward the
        // +normal side, so that side is the inside.
        const a = segs[run.from]!;
        const b = segs[run.to]!;
        const bend = (b.x - a.x) * -a.hz + (b.z - a.z) * a.hx;
        const outside = bend > 0 ? 1 : 0;
        const mid = segs[Math.floor((run.from + run.to) / 2)]!;
        expect(mid.shoulderWidth[outside]).toBeGreaterThanOrEqual(needed - 1e-9);
        checked++;
      }
      expect(checked).toBeGreaterThan(0);
    }
  });

  it('the helper agrees with the measurement, so the two can never drift apart', () => {
    for (const def of STAGES) {
      const corridor = buildCorridor(def.moves, def.surface, new Rng(hashString(`side:${def.id}`)));
      const segs = corridor.segments;
      for (const run of cornerRuns(corridor)) {
        const a = segs[run.from]!;
        const b = segs[run.to]!;
        const bend = (b.x - a.x) * -a.hz + (b.z - a.z) * a.hx;
        if (Math.abs(bend) < 0.5) continue;   // too short to have a direction
        expect(outsideOfCorner(run.direction)).toBe(bend > 0 ? 1 : 0);
      }
    }
  });
});

describe('the normal is the driver\'s right, and everything depends on it', () => {
  it('a right-hand corner bends toward +normal', () => {
    const corridor = buildCorridor(
      [{ kind: 'straight', length: 80 }, { kind: 'corner', angle: 90, radius: 40 }],
      'gravel',
      new Rng(hashString('hand')),
    );
    const segs = corridor.segments;
    const a = segs[19]!;
    const b = segs[segs.length - 1]!;
    const bend = (b.x - a.x) * -a.hz + (b.z - a.z) * a.hx;
    expect(bend).toBeGreaterThan(0);
    expect(cornerRuns(corridor).some((r) => r.direction === 'right')).toBe(true);
  });
});
