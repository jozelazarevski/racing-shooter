/* One seeded PRNG set per stage — RALLY_RULES N4 and §14.3.
 *
 * The channel list is imported from the normative spec rather than copied, so
 * a channel added to `spec/rally.constants.ts` is a type error here until it is
 * handled. Copying the list would let the two drift silently, which is the
 * failure mode the spec's "single source of truth" header exists to prevent.
 */
import { RNG_CHANNELS, type RngChannel } from '../../../spec/rally.constants.ts';
import { Rng, hashString } from './rng.ts';

/** Bump ONLY when a deliberate world-wide reshuffle is wanted. Changing it
 *  changes every stage's scatter, weather and ambient at once — it is the one
 *  switch that invalidates every stored fingerprint on purpose. */
export const SEED_EPOCH = 'ignite-v2-1';

/** Stage id + epoch -> seed word. Deterministic across machines and sessions:
 *  a stage's seed is a property of its NAME, so it survives reordering the
 *  stage list, which v1's array-index-based world identity did not. */
export function seedForStage(stageId: string): number {
  return hashString(`${SEED_EPOCH}:${stageId}`);
}

/**
 * The random half of a stage's identity.
 *
 * Construct one per stage build, hand it to the systems that need it, and let
 * each take only its own channel. The channels are independent by
 * construction — each is seeded from (stage seed, channel name), not by
 * splitting a parent stream — so:
 *
 *   - retuning the weather cannot move a single tree;
 *   - a damage roll during a race cannot alter the world if it is rebuilt;
 *   - and a scatter bug reproduces from the stage id alone.
 *
 * That last one is the whole reason Phase 0 comes before the engine change.
 */
export class StageRng {
  readonly stageId: string;
  readonly seed: number;
  private readonly channels = new Map<RngChannel, Rng>();

  constructor(stageId: string, seed = seedForStage(stageId)) {
    this.stageId = stageId;
    this.seed = seed >>> 0;
    for (const name of RNG_CHANNELS) {
      // Independent derivation. Note the multiply: without it, two stages
      // whose seeds differ by a small amount would produce channel seeds that
      // also differ by that amount, and splitmix32 alone would not fully
      // decorrelate the first few draws.
      const chSeed = (hashString(`${this.seed}:${name}`) ^ Math.imul(this.seed, 0x85ebca6b)) >>> 0;
      this.channels.set(name, new Rng(chSeed, `${stageId}#${name}`));
    }
  }

  /** The generator for one system. Never hand the same one to two systems. */
  channel(name: RngChannel): Rng {
    const r = this.channels.get(name);
    if (!r) throw new Error(`[rng] unknown channel "${name}"`);
    return r;
  }

  /** Placement of trees, rocks, fences, props — everything in §3 scatter. */
  get scatter(): Rng { return this.channel('scatter'); }
  /** Rain, fog, wind, cloud, surface wetness. */
  get weather(): Rng { return this.channel('weather'); }
  /** Birds, insects, dust motes, distant sound one-shots — cosmetic only. */
  get ambient(): Rng { return this.channel('ambient'); }
  /** Damage variance rolls at impact time. */
  get damageRoll(): Rng { return this.channel('damageRoll'); }

  /** Rewind every channel to its first draw. A rebuild of the same stage must
   *  start here, or the second build is not the first build. */
  reset(): StageRng {
    return new StageRng(this.stageId, this.seed);
  }

  /** Draws made so far, per channel, INCLUDING forks — a world pass takes a
   *  fork per sub-pass and never touches the channel itself, so counting only
   *  the channel would report zero for a stage with six thousand objects in
   *  it. Cheap way to see which system moved when a fingerprint gate fails. */
  draws(): Record<string, number> {
    const out: Record<string, number> = {};
    for (const [name, r] of this.channels) out[name] = r.totalDraws;
    return out;
  }

  /** The same question one level finer: draws per named fork. */
  drawTree(): Record<string, number> {
    const out: Record<string, number> = {};
    for (const [, r] of this.channels) Object.assign(out, r.drawTree());
    return out;
  }
}

// ---------------------------------------------------------------------------
// Fingerprints — the machinery behind "byte for byte"
// ---------------------------------------------------------------------------

/**
 * A 32-bit content hash of an arbitrary generated structure.
 *
 * N4 says "the same world, byte for byte". To assert that in a test you need a
 * cheap comparable digest of a built world, and you need it to be sensitive to
 * float noise — hence the Float64Array view: two positions that differ in the
 * last mantissa bit produce different fingerprints, which is exactly what a
 * determinism gate should catch.
 */
export function fingerprint(value: unknown): string {
  let h = 0x811c9dc5;
  const byte = (b: number) => {
    h ^= b & 0xff;
    h = Math.imul(h, 0x01000193);
  };
  const f64 = new Float64Array(1);
  const bytes = new Uint8Array(f64.buffer);

  const walk = (v: unknown): void => {
    if (v === null) return byte(0);
    if (v === undefined) return byte(1);
    switch (typeof v) {
      case 'boolean':
        return byte(v ? 2 : 3);
      case 'number': {
        byte(4);
        f64[0] = v;
        for (let i = 0; i < 8; i++) byte(bytes[i]);
        return;
      }
      case 'string': {
        byte(5);
        for (let i = 0; i < v.length; i++) {
          byte(v.charCodeAt(i));
          byte(v.charCodeAt(i) >>> 8);
        }
        return;
      }
      default: {
        if (Array.isArray(v)) {
          byte(6);
          for (const item of v) walk(item);
          byte(7);
          return;
        }
        byte(8);
        // Sorted keys: object property order must not change the digest, or
        // an unrelated refactor would look like a determinism regression.
        const keys = Object.keys(v as object).sort();
        for (const k of keys) {
          walk(k);
          walk((v as Record<string, unknown>)[k]);
        }
        byte(9);
      }
    }
  };

  walk(value);
  return (h >>> 0).toString(16).padStart(8, '0');
}

// ---------------------------------------------------------------------------
// The guard
// ---------------------------------------------------------------------------

let guardDepth = 0;
let realRandom: (() => number) | null = null;

/**
 * Run `fn` with Math.random poisoned, so any unseeded draw throws with a stack
 * pointing at the offender.
 *
 * Determinism is not a thing you achieve once; it is a thing you keep. v1 got
 * to 778 Math.random calls one honest line at a time, and no reviewer was ever
 * going to catch the 779th. This makes the build fail instead.
 *
 * Wrap stage construction in it. Do NOT wrap the render loop: three.js and the
 * postprocessing passes call Math.random for dithering, and cosmetic noise at
 * render time is not part of world state.
 */
export function withoutMathRandom<T>(fn: () => T): T {
  if (guardDepth++ === 0) {
    realRandom = Math.random;
    Math.random = () => {
      throw new Error(
        '[rng] Math.random() called inside a deterministic build. ' +
        'Take a channel off the stage StageRng instead — see v2/DETERMINISM.md.',
      );
    };
  }
  try {
    return fn();
  } finally {
    if (--guardDepth === 0 && realRandom) {
      Math.random = realRandom;
      realRandom = null;
    }
  }
}
