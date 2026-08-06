/* Phase 4 — the bible, and the conversions between it and a renderer. */
import { describe, expect, it } from 'vitest';
import { LEGACY_BIOME_MAP, REGIONS } from '../../../spec/biomes.constants.ts';
import { STAGES } from './stage.ts';
import {
  ev100ToExposure, hueDistance, hueOf, kelvinToRgb, lintRegion, luminanceOf,
  luxToIntensity, regionFor, renderSettings, roadMaterialFor, saturationOf,
} from './region.ts';

describe('every stage resolves to a region', () => {
  it('by §3.11 mapping or by its own override', () => {
    for (const def of STAGES) {
      const region = def.region ? regionFor(def.region) : regionFor(def.biome);
      expect(region.key).toBeTruthy();
      expect(REGIONS[region.key]).toBe(region);
    }
  });

  it('refuses an unknown biome rather than falling back to a default', () => {
    // A silent fallback is how a stage ends up lit by the wrong region and
    // nobody notices — the placeholder palette did exactly that with `??`.
    expect(() => regionFor('not_a_biome')).toThrow(/no region/);
  });

  it('§3.11 maps every legacy key to a region that exists', () => {
    for (const [legacy, key] of Object.entries(LEGACY_BIOME_MAP)) {
      expect(REGIONS[key], `${legacy} -> ${key}`).toBeDefined();
    }
  });
});

describe('colour temperature', () => {
  it('is warm below 5000 K and cool above 7000 K', () => {
    const warm = kelvinToRgb(3200);
    const cool = kelvinToRgb(9000);
    expect(warm[0]).toBeGreaterThan(warm[2]);
    expect(cool[2]).toBeGreaterThan(cool[0]);
  });

  it('is very nearly white at daylight', () => {
    const [r, g, b] = kelvinToRgb(6500);
    for (const c of [r, g, b]) expect(c).toBeGreaterThan(0.8);
  });

  it('never returns a channel above 1, so brightness is carried by lux alone', () => {
    for (const k of [1000, 2700, 5600, 12000, 40000]) {
      const rgb = kelvinToRgb(k);
      expect(Math.max(...rgb)).toBeCloseTo(1, 6);
      expect(Math.min(...rgb)).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('the photometric ratios are bounded', () => {
  it('a brighter region is lit brighter, but never enough to clip', () => {
    const dim = luxToIntensity(60_000);
    const reference = luxToIntensity(95_000);
    const bright = luxToIntensity(140_000);
    expect(dim).toBeLessThan(reference);
    expect(bright).toBeGreaterThan(reference);
    // Nordic Winter pairs a high sun with a near-white ground; unbounded, that
    // is a white screen with a red car on it.
    expect(bright).toBeLessThan(reference * 1.35);
  });

  it('exposure is a constant, because EV100 has no consumer here', () => {
    // Documented rather than silently ignored — see the note in region.ts.
    expect(ev100ToExposure(14.2)).toBe(ev100ToExposure(16.4));
  });
});

describe('the road comes from §1, not from the ground', () => {
  it('gives tarmac a dark material and gravel a light one', () => {
    expect(luminanceOf(roadMaterialFor('tarmac_dry'))).toBeLessThan(0.25);
    expect(luminanceOf(roadMaterialFor('gravel_loose'))).toBeGreaterThan(0.4);
  });

  it('falls back to gravel for a surface with no material, not to black', () => {
    expect(roadMaterialFor('something_new')).toBe(roadMaterialFor('gravel_loose'));
  });
});

describe('colour maths', () => {
  it('measures saturation and hue the way §G3 and R01 mean them', () => {
    expect(saturationOf('#808080')).toBe(0);
    expect(saturationOf('#ff0000')).toBeCloseTo(1, 5);
    expect(hueOf('#ff0000')).toBeCloseTo(0, 5);
    expect(hueOf('#00ff00')).toBeCloseTo(120, 5);
    expect(hueDistance(350, 10)).toBeCloseTo(20, 5);
  });
});

/*
 * NINE FAILURES ACROSS TEN REGIONS, AND THEY ARE IN THE SPECIFICATION.
 *
 * The §5 lint's first run found the bible breaking its own global laws with
 * its own palette data. None of it is a bug in this code; the numbers come
 * straight out of `biomes.constants.ts`.
 *
 * THREE R02/G3 violations — G3 caps structure saturation at 45% and three
 * regions exceed it, Volcanic Highland by a third: #A8492C is 60% saturated.
 * These are unambiguous. A number is over a limit the same document sets.
 *
 * SIX R12/G1 failures, and these deserve a caveat. G1 is about the frame:
 * "if terrain or flora out-contrasts the road at 80 m, the region is
 * misgraded". This lint cannot render a frame, so it compares the road
 * material's albedo against the region's ground base — a proxy, and a strict
 * one. Nordic Winter's 4% gap is a snow road on snow ground, which is exactly
 * the situation the bible answers elsewhere with snow poles and kerbs that
 * this build does not yet place. So six of these may be answered by content
 * rather than by a palette change, and the check says what it measured so that
 * can be judged rather than guessed.
 *
 * §6 says a change to a hex value is made in the bible first and mirrored into
 * the constants in the same commit. Fixing them here would put the
 * implementation and the document into silent disagreement, which is the one
 * thing the whole arrangement exists to prevent. So they are listed, they stay
 * listed, and `npm run lint` reports them on every run until the document is
 * amended.
 */
const KNOWN_SPEC_DEFECTS = [
  'mountain_oasis R02: structure 46% over the §G3 limit',
  'mountain_oasis R12: road and ground differ by 0.9% luminance — G1 needs the road to read',
  'amazon_forest R12: road and ground differ by 0.7% luminance — G1 needs the road to read',
  'nordic_winter R02: structure 49% over the §G3 limit',
  'nordic_winter R12: road and ground differ by 4.0% luminance — G1 needs the road to read',
  'old_town_night R12: road and ground differ by 7.1% luminance — G1 needs the road to read',
  'farmland_hedgerow R12: road and ground differ by 4.7% luminance — G1 needs the road to read',
  'volcanic_highland R02: structure 60% over the §G3 limit',
  'outback_red R12: road and ground differ by 1.7% luminance — G1 needs the road to read',
];

describe('§5 region lint', () => {
  it('every region passes what can be measured, bar the defects in the bible', () => {
    for (const key of Object.keys(REGIONS)) {
      const results = lintRegion(key);
      const failed = results.filter((r) => r.status === 'fail');
      expect(failed.map((f) => `${key} ${f.id}: ${f.detail}`))
        .toEqual(KNOWN_SPEC_DEFECTS.filter((d) => d.startsWith(key)));
      // And it must not be reporting by having run nothing: six checks are
      // implemented, and every one of them must produce a verdict.
      const verdicts = results.filter((r) => r.status !== 'skip').length;
      expect(verdicts, key).toBe(6);
    }
  });

  it('reports the checks it cannot run as skipped, never as passing', () => {
    const results = lintRegion('alpine_pass');
    const skipped = results.filter((r) => r.status === 'skip');
    expect(skipped.length).toBeGreaterThan(0);
    for (const s of skipped) expect(s.detail.length).toBeGreaterThan(10);
  });

  it('catches a region whose flora weights do not sum to one', () => {
    const broken = { ...REGIONS.alpine_pass!, key: 'broken' };
    (REGIONS as Record<string, unknown>).broken = {
      ...broken,
      flora: broken.flora.map((f, i) => (i === 0 ? { ...f, weight: f.weight + 0.2 } : f)),
    };
    const r04 = lintRegion('broken').find((r) => r.id === 'R04')!;
    expect(r04.status).toBe('fail');
    delete (REGIONS as Record<string, unknown>).broken;
  });
});

describe('what the renderer is handed', () => {
  it('is complete for every stage', () => {
    for (const def of STAGES) {
      const rs = renderSettings(def.biome, def.region);
      expect(rs.fogDensity).toBeGreaterThan(0);
      expect(rs.sunIntensity).toBeGreaterThan(0);
      expect(rs.ambientIntensity).toBeGreaterThan(0);
      expect(rs.sightLineMetres).toBeGreaterThan(0);
      for (const c of [rs.skyZenith, rs.skyHorizon, rs.ground, rs.foliage]) {
        expect(c).toBeGreaterThanOrEqual(0);
        expect(c).toBeLessThanOrEqual(0xffffff);
      }
    }
  });

  it('gives different regions visibly different skies', () => {
    const a = renderSettings('alpine_forest');
    const b = renderSettings('desert_wash');
    expect(a.skyHorizon).not.toBe(b.skyHorizon);
    expect(a.fogColour).not.toBe(b.fogColour);
    expect(a.fogDensity).not.toBe(b.fogDensity);
  });
});
