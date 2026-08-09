// Seeded randomness, because a world that cannot be rebuilt cannot be debugged.
//
// Every scatter decision in dustline used raw `Math.random()`: 260 pines, 150
// rocks, 170 bushes, 14 clouds and 30 mountains, all re-rolled on every load.
// The practical consequence is not "worlds vary" — it is that no complaint
// about a world can be reproduced. "There is a tree in the road" is not
// actionable when the next load has a different tree somewhere else, and a
// visual regression cannot be caught by comparing two runs that were never
// going to match.
//
// The sister project learned this the expensive way and wrote it down: a
// world's crest count moved 6 -> 0 across two loads with no code change, and a
// sinking-car report stayed open for weeks because it could not be made to
// happen twice.
//
// So: a track carries a seed, and everything built from it draws from a
// generator forked off that seed. Two loads of the same track are identical.
// Change the seed and the scatter reshuffles without touching the layout.
//
// NOT seeded, deliberately: anything that happens while PLAYING — tyre smoke,
// damage rolls, AI jitter. Those should vary between runs.

/** mulberry32 — small, fast, well distributed, and identical on every engine
 *  because it is entirely uint32 arithmetic. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** FNV-1a over a string. Used to fork one seed into independent named streams. */
export function hashString(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** A named stream of randomness.
 *
 *  Streams are FORKED BY NAME rather than shared, and that is the whole point:
 *  if pines and rocks drew from one generator, adding a single pine would shift
 *  every rock in the world. Named forks mean each layer's scatter depends only
 *  on the seed and its own name, so editing one layer leaves the others exactly
 *  where they were. That is the difference between an editor you can nudge and
 *  one where every change is a full reshuffle. */
export class Rng {
  private next: () => number;

  constructor(seed: number) {
    this.next = mulberry32(seed);
  }

  /** A generator for `name`, independent of every other name. */
  static fork(seed: number, name: string): Rng {
    return new Rng((seed ^ hashString(name)) >>> 0);
  }

  /** [0, 1) */
  float(): number { return this.next(); }

  /** [min, max) */
  range(min: number, max: number): number { return min + this.next() * (max - min); }

  /** integer in [0, n) */
  int(n: number): number { return Math.floor(this.next() * n) % n; }

  /** [-half, half) */
  centered(half: number): number { return (this.next() - 0.5) * 2 * half; }

  pick<T>(items: readonly T[]): T { return items[this.int(items.length)]; }
}
