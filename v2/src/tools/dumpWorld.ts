#!/usr/bin/env tsx
/* The reproduction tool.
 *
 *   npm run world -- ouninpohja
 *   npm run world -- ouninpohja --json > before.json
 *
 * This is the payoff of Phase 0, and the reason it came before the engine
 * change. A bug report on v1 reads "the car sank, once, on a switchback".
 * A bug report against a seeded world reads:
 *
 *   npm run world -- ouninpohja        ->  fingerprint 5f1c2a90
 *
 * and anyone, on any machine, gets the same 5f1c2a90 and the same object at
 * index 4417. That is the difference between a story and a test case.
 *
 * Two fingerprints that differ when they should not is itself the alarm: it
 * means something unseeded crept back into the build.
 */
import { StageRng, fingerprint, withoutMathRandom } from '../core/stageRng.ts';
import { scatterCorridor, type Corridor, type Biome, type SurfaceKind } from '../world/scatter.ts';
import { Tier } from '../../../spec/rally.constants.ts';

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith('--')));
const stageId = args.find((a) => !a.startsWith('--'));

if (!stageId) {
  console.error('usage: npm run world -- <stage-id> [--json] [--biome=<name>] [--surface=<name>]');
  process.exit(2);
}

const flagValue = (name: string, fallback: string): string =>
  args.find((a) => a.startsWith(`--${name}=`))?.split('=')[1] ?? fallback;

const biome = flagValue('biome', 'alpine_forest') as Biome;
const surface = flagValue('surface', 'gravel') as SurfaceKind;

/* A placeholder centreline. Phase 1 replaces this with the real authored
 * stage geometry; until then it is a fixed, non-random shape so the tool
 * still demonstrates — and gates — the property that matters. */
const corridor: Corridor = {
  surface,
  biome,
  bandDepth: 22,
  nodes: Array.from({ length: 240 }, (_, i) => {
    const t = i / 12;
    return {
      x: i * 8 + Math.sin(t) * 14,
      z: Math.cos(t * 0.7) * 40,
      roadbedWidth: 5.4,
      shoulderWidth: [2.4, 2.1] as [number, number],
    };
  }),
};

const stage = new StageRng(stageId);
const objects = withoutMathRandom(() => scatterCorridor(corridor, stage));
const digest = fingerprint(objects);

if (flags.has('--json')) {
  console.log(JSON.stringify({ stageId, seed: stage.seed, fingerprint: digest, objects }, null, 2));
} else {
  const byTier = [0, 0, 0, 0, 0];
  for (const o of objects) byTier[o.tier]!++;
  console.log(`stage        ${stageId}`);
  console.log(`seed         ${stage.seed}`);
  console.log(`biome        ${biome} on ${surface}`);
  console.log(`objects      ${objects.length}`);
  console.log(`  tier 0     ${byTier[Tier.Cosmetic]}   cosmetic, no collider`);
  console.log(`  tier 1     ${byTier[Tier.Yielding]}   yielding`);
  console.log(`  tier 2     ${byTier[Tier.Deformable]}   deformable`);
  console.log(`  tier 3     ${byTier[Tier.HeavyMovable]}   heavy movable`);
  console.log(`  tier 4     ${byTier[Tier.HardStatic]}   hard static`);
  console.log(`draws        ${JSON.stringify(stage.draws())}`);
  console.log(`fingerprint  ${digest}`);
  console.log('');
  console.log('Run it again. The fingerprint must not change. If it does, something');
  console.log('unseeded got into the build — that is the bug, before any other bug.');
}
