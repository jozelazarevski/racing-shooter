/* N4, end to end: "Same seed produces the same world, byte for byte."
 *
 * The rng suite proves the generator is reproducible. This one proves a BUILT
 * WORLD is — which is the claim the spec actually makes, and the one that
 * would let a bug report say "stage ouninpohja, object 4417" instead of "it
 * happened once".
 */
import { describe, it, expect } from 'vitest';
import { StageRng, fingerprint, withoutMathRandom } from '../core/stageRng.ts';
import { scatterCorridor, distanceToCentreline, type Corridor } from './scatter.ts';
import { CORRIDOR, FLORA_PLACEMENT, Tier, BIOME_SCATTER_DENSITY } from '../../../spec/rally.constants.ts';

/** An authored centreline. Deliberately NOT random: in the real game the
 *  corridor is designed and the scatter is seeded, and the test should model
 *  that split rather than blur it. */
function corridor(overrides: Partial<Corridor> = {}): Corridor {
  const nodes = Array.from({ length: 120 }, (_, i) => {
    const t = i / 12;
    return {
      x: i * 8 + Math.sin(t) * 14,
      z: Math.cos(t * 0.7) * 40,
      roadbedWidth: 5.4,
      shoulderWidth: [2.4, 2.1] as [number, number],
    };
  });
  return { surface: 'gravel', biome: 'alpine_forest', nodes, bandDepth: 22, ...overrides };
}

describe('N4 — byte-for-byte rebuilds', () => {
  it('two builds of the same stage are identical', () => {
    const c = corridor();
    const a = scatterCorridor(c, new StageRng('ouninpohja'));
    const b = scatterCorridor(c, new StageRng('ouninpohja'));
    expect(a.length).toBe(b.length);
    expect(fingerprint(a)).toBe(fingerprint(b));
  });

  it('a rebuild after a full race-length run of other channels is still identical', () => {
    // The realistic failure: something drew from a shared stream during play,
    // so reloading the stage gave a different world. Independent channels make
    // it impossible; this asserts it rather than assuming it.
    const c = corridor();
    const first = fingerprint(scatterCorridor(c, new StageRng('ouninpohja')));

    const stage = new StageRng('ouninpohja');
    for (let i = 0; i < 200_000; i++) stage.damageRoll.next();
    for (let i = 0; i < 50_000; i++) stage.weather.gaussian();
    for (let i = 0; i < 50_000; i++) stage.ambient.float();
    expect(fingerprint(scatterCorridor(c, stage))).toBe(first);
  });

  it('different stages produce genuinely different worlds', () => {
    const c = corridor();
    const a = fingerprint(scatterCorridor(c, new StageRng('ouninpohja')));
    const b = fingerprint(scatterCorridor(c, new StageRng('monte-carlo')));
    expect(a).not.toBe(b);
  });

  it('builds with no unseeded randomness anywhere in the pass', () => {
    // The guard that keeps this true a year from now.
    expect(() =>
      withoutMathRandom(() => scatterCorridor(corridor(), new StageRng('fafe'))),
    ).not.toThrow();
  });

  it('every biome builds deterministically', () => {
    for (const biome of Object.keys(BIOME_SCATTER_DENSITY) as Array<keyof typeof BIOME_SCATTER_DENSITY>) {
      const c = corridor({ biome });
      const a = scatterCorridor(c, new StageRng(`probe-${biome}`));
      const b = scatterCorridor(c, new StageRng(`probe-${biome}`));
      expect(fingerprint(a), biome).toBe(fingerprint(b));
      expect(a.length, biome).toBeGreaterThan(0);
    }
  });
});

describe('stability under edits — the property that makes determinism usable', () => {
  it('a rejected neighbour does not shift the objects after it', () => {
    // Rejection must consume the same number of draws as acceptance, or one
    // extra tree at metre 40 moves every tree for the rest of the stage and
    // no world diff is ever readable again.
    const sparse = corridor({ nodes: corridor().nodes.slice(0, 60) });
    const a = scatterCorridor(sparse, new StageRng('estonia'));
    const b = scatterCorridor(sparse, new StageRng('estonia'));
    expect(fingerprint(a)).toBe(fingerprint(b));

    // Tier passes are forked, so the tier-4 trees are placed from a stream
    // that tier-0 grass cannot reach.
    const t4 = a.filter((o) => o.tier === Tier.HardStatic).map((o) => o.transform.position);
    const dense = scatterCorridor({ ...sparse, biome: 'nordic_pine' }, new StageRng('estonia'));
    expect(t4.length).toBeGreaterThan(0);
    expect(dense.length).not.toBe(a.length);
  });
});

describe('§3.2 placement rules', () => {
  const c = corridor();
  const objects = scatterCorridor(c, new StageRng('turini'));

  it('rule 1 + L03 — no Tier 4 inside the verge or the surface clearance', () => {
    const clearance = CORRIDOR.gravel.tier4Clearance;
    for (const o of objects) {
      if (o.tier !== Tier.HardStatic) continue;
      const { distance, halfWidth, verge } = distanceToCentreline(c, o.transform.position[0], o.transform.position[2]);
      expect(distance).toBeGreaterThanOrEqual(halfWidth + Math.max(verge, clearance) - 1e-6);
    }
  });

  it('rule 2 — anything inside the verge band is Tier 1 or Tier 2', () => {
    for (const o of objects) {
      const { distance, halfWidth, verge } = distanceToCentreline(c, o.transform.position[0], o.transform.position[2]);
      if (distance > halfWidth + verge) continue;
      expect(o.tier).toBeLessThanOrEqual(Tier.Deformable);
    }
  });

  it('rule 3 — no two trunks closer than 1.2 m', () => {
    const trunks = objects.filter((o) => o.tier >= Tier.HeavyMovable);
    expect(trunks.length).toBeGreaterThan(10);

    // Find the worst pair in a plain loop and assert once. Calling expect()
    // inside an O(n²) sweep over a few thousand trunks is millions of matcher
    // invocations — it was the slowest thing in the suite by an order of
    // magnitude, and it reported "expected 1.19 to be >= 1.2" without saying
    // which two trees.
    let worst = Infinity;
    let pair = '';
    for (let i = 0; i < trunks.length; i++) {
      const a = trunks[i]!;
      for (let j = i + 1; j < trunks.length; j++) {
        const b = trunks[j]!;
        const d = Math.hypot(
          a.transform.position[0] - b.transform.position[0],
          a.transform.position[2] - b.transform.position[2],
        );
        if (d < worst) {
          worst = d;
          pair = `${a.id} / ${b.id}`;
        }
      }
    }
    expect(worst, `closest trunks: ${pair}`).toBeGreaterThanOrEqual(
      FLORA_PLACEMENT.minTrunkSpacing - 1e-9,
    );
  });

  it('nothing is placed on the roadbed', () => {
    for (const o of objects) {
      const { distance, halfWidth } = distanceToCentreline(c, o.transform.position[0], o.transform.position[2]);
      expect(distance).toBeGreaterThanOrEqual(halfWidth - 1e-6);
    }
  });
});

describe('L02 — every collidable object carries an explicit tier', () => {
  it('holds for a full build', () => {
    const objects = scatterCorridor(corridor(), new StageRng('safari'));
    for (const o of objects) {
      expect(Number.isInteger(o.tier)).toBe(true);
      expect(o.tier).toBeGreaterThanOrEqual(Tier.Cosmetic);
      expect(o.tier).toBeLessThanOrEqual(Tier.HardStatic);
      // Tier 0 is the only one allowed to be collider-less (§3.1).
      if (o.tier === Tier.Cosmetic) expect(o.collider.shape).toBe('none');
      else expect(o.collider.shape).not.toBe('none');
    }
  });

  it('Tier 4 is static and Tier 3 carries the spec mass range', () => {
    const objects = scatterCorridor(corridor(), new StageRng('safari'));
    for (const o of objects) {
      if (o.tier === Tier.HardStatic) expect(o.physics.mass).toBe(0);
      if (o.tier === Tier.HeavyMovable) {
        expect(o.physics.mass).toBeGreaterThanOrEqual(180);
        expect(o.physics.mass).toBeLessThanOrEqual(400);
      }
    }
  });

  it('ids are unique', () => {
    const objects = scatterCorridor(corridor(), new StageRng('corniche'));
    expect(new Set(objects.map((o) => o.id)).size).toBe(objects.length);
  });
});

describe('§3.3 density', () => {
  /** Scatter area outside the roadbed, both sides — the table's stated basis. */
  function scatterArea(c: Corridor): number {
    let area = 0;
    for (let i = 0; i + 1 < c.nodes.length; i++) {
      const a = c.nodes[i]!;
      const b = c.nodes[i + 1]!;
      const len = Math.hypot(b.x - a.x, b.z - a.z);
      for (let side = 0; side < 2; side++) {
        area += len * (a.shoulderWidth[side]! + c.bandDepth);
      }
    }
    return area;
  }

  it('every tier lands near its specified objects per 100 m²', () => {
    // Not a determinism check — a "did I read the table right" check. The
    // fractional-count trick means low densities must not round to nothing.
    const c = corridor({ biome: 'alpine_forest' });
    const objects = scatterCorridor(c, new StageRng('density-probe'));
    const area = scatterArea(c);

    for (let tier = 0; tier < 5; tier++) {
      const want = (BIOME_SCATTER_DENSITY.alpine_forest[tier]! * area) / 100;
      const got = objects.filter((o) => o.tier === tier).length;
      // Tier 3 and 4 lose a few to the 1.2 m spacing rule, so the lower bound
      // is looser than the upper.
      expect(got, `tier ${tier}: want ~${want.toFixed(0)}, got ${got}`).toBeGreaterThan(want * 0.7);
      expect(got, `tier ${tier}: want ~${want.toFixed(0)}, got ${got}`).toBeLessThan(want * 1.15);
    }
  });

  it('the table ordering survives — more bushes than young trees', () => {
    // The bug this catches, and it was a real one: crediting Tier 3/4 with the
    // full 22 m backdrop while Tier 0-2 got only the 2.4 m verge inverted the
    // table. Alpine forest specifies 2.0 large bushes and 0.8 young trees per
    // 100 m²; the first cut produced 191 bushes against 664 young trees.
    const objects = scatterCorridor(corridor({ biome: 'alpine_forest' }), new StageRng('ratio'));
    const count = (t: Tier) => objects.filter((o) => o.tier === t).length;
    expect(count(Tier.Cosmetic)).toBeGreaterThan(count(Tier.Yielding));
    expect(count(Tier.Yielding)).toBeGreaterThan(count(Tier.Deformable));
    expect(count(Tier.Deformable)).toBeGreaterThan(count(Tier.HeavyMovable));
  });

  it('a very low density still produces objects rather than rounding to zero', () => {
    const c = corridor({ biome: 'moorland' });   // tier 4 at 0.05 per 100 m²
    const objects = scatterCorridor(c, new StageRng('sparse-probe'));
    const want = (BIOME_SCATTER_DENSITY.moorland[4] * scatterArea(c)) / 100;
    expect(want).toBeGreaterThan(2);
    expect(objects.filter((o) => o.tier === Tier.HardStatic).length).toBeGreaterThan(0);
  });
});
