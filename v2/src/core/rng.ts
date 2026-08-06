/* Deterministic randomness for IGNITE RALLY v2.
 *
 * RALLY_RULES N4 is the requirement this file exists to satisfy:
 *
 *   "All randomness comes from one seeded PRNG per stage. Same seed produces
 *    the same world, byte for byte."
 *
 * and §14.3:
 *
 *   "One seeded PRNG instance per system: scatter, weather, ambient,
 *    damageRoll. Never share."
 *
 * ---------------------------------------------------------------------------
 * WHY THIS IS THE FIRST FILE OF v2
 * ---------------------------------------------------------------------------
 * v1 calls Math.random 778 times across the world builder. The consequence is
 * not "the worlds vary" — that would be fine — it is that no bug in world
 * generation can be reproduced. Measured on the shipped game: one world's
 * crest count moved 6 -> 0 across two loads with no code change. Four bugs are
 * open right now (car sinking, bridge floating, waterfall angle, inclination)
 * and every one of them has been stuck at "I cannot make it happen again".
 *
 * A seeded stream converts that into a test case: a seed, a channel, and a
 * failing assertion. That is the whole point of Phase 0.
 *
 * ---------------------------------------------------------------------------
 * THE THREE PROPERTIES THAT MATTER
 * ---------------------------------------------------------------------------
 * 1. REPRODUCIBLE. Same (stageSeed, channel) -> same sequence, on every engine,
 *    forever. The generator therefore runs entirely on uint32 arithmetic
 *    (Math.imul, >>> 0). No doubles are held in the state, so there is no
 *    platform-dependent floating point rounding anywhere in the stream.
 *
 * 2. INDEPENDENT. Channels are derived from the stage seed by hashing, not by
 *    splitting one stream. Drawing from `weather` cannot move `scatter` along.
 *    This is what "never share" buys you, and it is why the rule exists: if
 *    rain and rocks come off one stream, changing the rain changes the rocks
 *    and every scatter regression becomes unattributable.
 *
 * 3. STABLE UNDER EDITS. `fork(label)` gives a named sub-stream. Placing trees
 *    from `scatter.fork('trees')` means that adding a rock pass tomorrow does
 *    not move a single tree. Without forks, determinism is technically true and
 *    practically useless, because every new draw call reshuffles everything
 *    downstream of it and every diff looks like a total rebuild.
 */

// ---------------------------------------------------------------------------
// Hashing
// ---------------------------------------------------------------------------

/** FNV-1a, 32-bit. Used to turn names (stage ids, channels, fork labels) into
 *  seeds. Chosen for being short, well-defined and trivially portable — this
 *  value ends up baked into shipped worlds, so the algorithm must never be
 *  "whatever the engine does". */
export function hashString(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** SplitMix32. Expands one seed word into the four well-mixed words xoshiro
 *  needs. Seeding xoshiro directly from a small integer leaves the state
 *  nearly all zeroes and the first few outputs visibly correlated — stage 1
 *  and stage 2 would start with near-identical scatter. */
function splitmix32(seed: number): () => number {
  let a = seed | 0;
  return () => {
    a = (a + 0x9e3779b9) | 0;
    let t = a ^ (a >>> 16);
    t = Math.imul(t, 0x21f0aaad);
    t = t ^ (t >>> 15);
    t = Math.imul(t, 0x735a2d97);
    return (t ^ (t >>> 15)) >>> 0;
  };
}

const rotl = (x: number, k: number): number => ((x << k) | (x >>> (32 - k))) >>> 0;

// ---------------------------------------------------------------------------
// The generator
// ---------------------------------------------------------------------------

/** A serialisable snapshot of a stream's position.
 *  §14.4 wants replays to carry periodic state snapshots for correction; this
 *  is the random half of that snapshot. */
export interface RngState {
  s0: number;
  s1: number;
  s2: number;
  s3: number;
  /** Box-Muller keeps one spare normal deviate. It is part of the state: a
   *  restore that dropped it would produce a different next gaussian(). */
  spare: number | null;
  /** Draw counter. Not used by the algorithm — it is for assertions and for
   *  telling you how far a stream has advanced when a gate fails. */
  count: number;
}

/**
 * xoshiro128**, a 32-bit generator with a 2^128 period.
 *
 * Deliberately not Math.random (unseedable), not an LCG (visible lattice
 * structure in 2D — scatter placed with one would sit on diagonal lines), and
 * not a 64-bit design (BigInt is slow, and doubles cannot hold 64-bit integer
 * state exactly, which is precisely the reproducibility hazard we are here to
 * eliminate).
 */
export class Rng {
  private s0 = 0;
  private s1 = 0;
  private s2 = 0;
  private s3 = 0;
  private spare: number | null = null;
  private count = 0;

  /** Kept for fork() so sub-streams derive from a stable name, never from the
   *  live position of the parent. */
  readonly seed: number;
  readonly label: string;

  constructor(seed: number, label = '') {
    this.seed = seed >>> 0;
    this.label = label;
    const mix = splitmix32(this.seed);
    this.s0 = mix();
    this.s1 = mix();
    this.s2 = mix();
    this.s3 = mix();
    // An all-zero state is a fixed point of xoshiro: it would emit zero
    // forever. splitmix32 makes it vanishingly unlikely, not impossible.
    if ((this.s0 | this.s1 | this.s2 | this.s3) === 0) this.s0 = 0x9e3779b9;
  }

  /** Build from a name rather than a number. */
  static fromName(name: string): Rng {
    return new Rng(hashString(name), name);
  }

  /** Next raw 32-bit word. Every other method is built on this one. */
  next(): number {
    const result = (Math.imul(rotl(Math.imul(this.s1, 5) >>> 0, 7), 9) >>> 0);
    const t = (this.s1 << 9) >>> 0;
    this.s2 = (this.s2 ^ this.s0) >>> 0;
    this.s3 = (this.s3 ^ this.s1) >>> 0;
    this.s1 = (this.s1 ^ this.s2) >>> 0;
    this.s0 = (this.s0 ^ this.s3) >>> 0;
    this.s2 = (this.s2 ^ t) >>> 0;
    this.s3 = rotl(this.s3, 11);
    this.count++;
    return result;
  }

  /** Uniform in [0, 1). The divisor is 2^32 exactly, so this is a clean
   *  32-bit fraction with no rounding surprises. */
  float(): number {
    return this.next() / 4294967296;
  }

  /** Uniform in [min, max). */
  range(min: number, max: number): number {
    return min + (max - min) * this.float();
  }

  /** Uniform integer in [min, max] inclusive.
   *  Uses rejection sampling rather than a modulo: `next() % n` is biased
   *  toward low values whenever n does not divide 2^32, and for the small n
   *  this game uses (pick a tree species from 5) that bias is measurable. */
  int(min: number, max: number): number {
    const span = Math.floor(max) - Math.ceil(min) + 1;
    if (span <= 0) return Math.ceil(min);
    const limit = 4294967296 - (4294967296 % span);
    let v = this.next();
    while (v >= limit) v = this.next();
    return Math.ceil(min) + (v % span);
  }

  /** True with probability p. */
  chance(p: number): boolean {
    return this.float() < p;
  }

  /** Uniform in [-m, m). The everyday "jitter this position" call. */
  jitter(m: number): number {
    return (this.float() * 2 - 1) * m;
  }

  /** One element, uniformly. Returns undefined for an empty array rather than
   *  throwing — but note it still consumes no draw in that case, which keeps
   *  an empty species table from desynchronising the stream. */
  pick<T>(arr: readonly T[]): T | undefined {
    if (arr.length === 0) return undefined;
    return arr[this.int(0, arr.length - 1)];
  }

  /** Weighted pick. Weights need not sum to 1. */
  weighted<T>(arr: readonly T[], weights: readonly number[]): T | undefined {
    if (arr.length === 0) return undefined;
    let total = 0;
    for (let i = 0; i < arr.length; i++) total += Math.max(0, weights[i] ?? 0);
    if (total <= 0) return this.pick(arr);
    let r = this.float() * total;
    for (let i = 0; i < arr.length; i++) {
      r -= Math.max(0, weights[i] ?? 0);
      if (r < 0) return arr[i];
    }
    return arr[arr.length - 1];
  }

  /** Fisher-Yates, in place, returning the same array. */
  shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = this.int(0, i);
      const t = arr[i];
      arr[i] = arr[j];
      arr[j] = t;
    }
    return arr;
  }

  /** Standard normal, mean 0, sd 1. Box-Muller with the spare retained.
   *  Wanted for scatter clustering and for weather variation, where uniform
   *  noise reads as obviously artificial. */
  gaussian(): number {
    if (this.spare !== null) {
      const v = this.spare;
      this.spare = null;
      return v;
    }
    let u = 0;
    let v = 0;
    let s = 0;
    do {
      u = this.float() * 2 - 1;
      v = this.float() * 2 - 1;
      s = u * u + v * v;
    } while (s >= 1 || s === 0);
    const f = Math.sqrt((-2 * Math.log(s)) / s);
    this.spare = v * f;
    return u * f;
  }

  /**
   * A named, independent sub-stream.
   *
   * This is the method that makes determinism survive development. Derive the
   * seed from (parent seed, label) — never from the parent's current position —
   * so a fork's sequence depends only on what it is called and which stage it
   * belongs to. Add a fork, remove a fork, reorder the calls: every other fork
   * is untouched.
   */
  fork(label: string): Rng {
    const child = new Rng(
      (hashString(`${this.label}/${label}`) ^ Math.imul(this.seed, 0x2545f491)) >>> 0,
      `${this.label}/${label}`,
    );
    // Remembered only so `totalDraws` can report the whole tree. A fork that
    // did not register here would make a channel look untouched even after it
    // had placed six thousand objects — which is exactly what the first cut of
    // the dump tool printed.
    this.forks.push(child);
    return child;
  }

  private readonly forks: Rng[] = [];

  /** Position snapshot, for replay correction and for gates. */
  getState(): RngState {
    return { s0: this.s0, s1: this.s1, s2: this.s2, s3: this.s3, spare: this.spare, count: this.count };
  }

  setState(st: RngState): void {
    this.s0 = st.s0 >>> 0;
    this.s1 = st.s1 >>> 0;
    this.s2 = st.s2 >>> 0;
    this.s3 = st.s3 >>> 0;
    this.spare = st.spare;
    this.count = st.count;
  }

  /** An independent copy at the same position. Useful for "what would this
   *  have drawn" probes that must not disturb the real stream. */
  clone(): Rng {
    const c = new Rng(this.seed, this.label);
    c.setState(this.getState());
    return c;
  }

  /** How many raw words this stream itself has drawn. */
  get draws(): number {
    return this.count;
  }

  /** Draws by this stream and every fork beneath it. The number to look at
   *  when asking "which system moved" after a fingerprint changes. */
  get totalDraws(): number {
    let n = this.count;
    for (const f of this.forks) n += f.totalDraws;
    return n;
  }

  /** Per-label breakdown of this stream and its forks, for the same question
   *  one level finer. */
  drawTree(): Record<string, number> {
    const out: Record<string, number> = { [this.label || '(root)']: this.count };
    for (const f of this.forks) Object.assign(out, f.drawTree());
    return out;
  }
}
