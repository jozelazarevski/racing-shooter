// ---------------------------------------------------------------------------
// SEEDED WORLD GENERATION
// ---------------------------------------------------------------------------
//
// v1 makes 778 unseeded Math.random calls while building a world — 302 of them
// in the builder. The consequence is not "worlds vary", which would be fine: it
// is that NO WORLD BUG CAN BE REPRODUCED. Measured on the shipped game, one
// world's crest count moved 6 -> 0 across two loads with no code change. That
// is why fixed bugs come back, and why the sinking report has stayed open —
// there was never a way to make it happen twice.
//
// Rather than rewrite 302 call sites (and every helper outside this class, and
// textures.js on top), the generator is swapped in for the DURATION OF WORLD
// CONSTRUCTION and swapped back afterwards. World building is synchronous, so
// the scope is exact: everything the Track constructor touches is seeded, and
// nothing afterwards is. Gameplay randomness — damage rolls, AI jitter, particle
// scatter — is deliberately left alone, because it should vary between runs.

/** mulberry32: tiny, fast, well-distributed, and identical on every engine
 *  because it runs entirely on uint32 arithmetic. */
export function seededRandom(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** FNV-1a. Turns a level id into a seed that depends on WHAT the world is,
 *  not on where it sits in the array — so reordering the career does not
 *  silently rebuild every world. */
// The epoch is DELIBERATELY not tied to the release number. Bumping it
// reshuffles every world in the game at once, so it changes only when new
// worlds are actually wanted — never as a side effect of shipping.
export function seedForLevel(level, epoch = 'ignite-1') {
  const name = `${epoch}:${(level && level.id) ?? 0}:${(level && level.route) || (level && level.theme) || 'forest'}`;
  let h = 0x811c9dc5;
  for (let i = 0; i < name.length; i++) {
    h ^= name.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Run `fn` with Math.random seeded. Restores the real one even if fn throws —
 *  a half-built world must never leave the rest of the game deterministic. */
export function withSeed(seed, fn) {
  const real = Math.random;
  Math.random = seededRandom(seed);
  try {
    return fn();
  } finally {
    Math.random = real;
  }
}
