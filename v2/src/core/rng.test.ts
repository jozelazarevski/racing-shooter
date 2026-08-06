/* The determinism gate.
 *
 * RALLY_RULES N4: "All randomness comes from one seeded PRNG per stage. Same
 * seed produces the same world, byte for byte."
 *
 * This suite is what turns that sentence into a build failure. The golden
 * vectors below are the load-bearing part: they pin the exact byte sequence
 * the generator produces, so a future "harmless tidy-up" of the mixing
 * constants cannot silently rebuild every world in the game. If one of them
 * fails, the algorithm changed — that is either a bug or a deliberate epoch
 * bump, and never something to paper over by re-recording the expectation.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Rng, hashString } from './rng.ts';
import { StageRng, seedForStage, fingerprint, withoutMathRandom, SEED_EPOCH } from './stageRng.ts';
import { RNG_CHANNELS } from '../../../spec/rally.constants.ts';

describe('golden vectors — the byte-for-byte anchor', () => {
  it('xoshiro128** emits the pinned words for seed 12345', () => {
    const r = new Rng(12345, 'golden');
    expect(Array.from({ length: 6 }, () => r.next())).toEqual([
      1093274547, 203003357, 3741353573, 3803725158, 4178738660, 810247443,
    ]);
  });

  it('float() is a clean 32-bit fraction of the same stream', () => {
    const r = new Rng(12345, 'golden');
    expect(Array.from({ length: 4 }, () => +r.float().toFixed(12))).toEqual([
      0.254547816468, 0.047265402274, 0.871101760538, 0.88562377682,
    ]);
  });

  it('stage seeds derive from the stage NAME, not its position in a list', () => {
    expect(seedForStage('monte-carlo')).toBe(1582943929);
    expect(seedForStage('ouninpohja')).toBe(1293828207);
  });

  it('the per-channel derivation is pinned too', () => {
    const s = new StageRng('monte-carlo');
    expect(Array.from({ length: 3 }, () => s.scatter.next())).toEqual([
      3170932523, 1027127162, 2485899677,
    ]);
    expect(Array.from({ length: 3 }, () => s.weather.next())).toEqual([
      4046351144, 270669380, 1423348398,
    ]);
  });

  it('gaussian() and fork() are pinned', () => {
    const g = new Rng(99, 'g');
    expect(Array.from({ length: 4 }, () => +g.gaussian().toFixed(10))).toEqual([
      0.1503000629, -0.8727117706, 0.1187148063, 0.9539630866,
    ]);
    const fk = new Rng(7, 'root').fork('trees');
    expect(Array.from({ length: 3 }, () => fk.next())).toEqual([
      1837404716, 635273532, 3769870429,
    ]);
  });
});

describe('reproducibility', () => {
  it('two generators from one seed agree for a long run', () => {
    const a = new Rng(0xbeef, 'a');
    const b = new Rng(0xbeef, 'b');
    for (let i = 0; i < 10_000; i++) expect(a.next()).toBe(b.next());
  });

  it('adjacent seeds do not produce correlated openings', () => {
    // The failure this guards against is real and easy to ship: seed xoshiro
    // straight from a small integer and stages 1, 2, 3 open with almost the
    // same numbers, so three different worlds get near-identical scatter.
    const firsts = new Set<number>();
    for (let s = 1; s <= 64; s++) firsts.add(new Rng(s).next());
    expect(firsts.size).toBe(64);
  });

  it('never emits the same word twice in a row over a long run', () => {
    const r = new Rng(4242);
    let prev = r.next();
    for (let i = 0; i < 50_000; i++) {
      const v = r.next();
      expect(v).not.toBe(prev);
      prev = v;
    }
  });

  it('an all-zero state is impossible', () => {
    // xoshiro's zero state is a fixed point: it would emit 0 forever.
    for (const seed of [0, -0, 0x7fffffff, 0xffffffff]) {
      const r = new Rng(seed);
      expect(Array.from({ length: 8 }, () => r.next()).some((v) => v !== 0)).toBe(true);
    }
  });
});

describe('channel independence — §14.3 "never share"', () => {
  it('all four spec channels exist and are distinct streams', () => {
    const s = new StageRng('turini');
    const firsts = RNG_CHANNELS.map((c) => s.channel(c).next());
    expect(new Set(firsts).size).toBe(RNG_CHANNELS.length);
  });

  it('the channel list is the spec list, not a copy that has drifted', () => {
    // Imported at runtime above, so this can only fail if the spec changes —
    // but assert against the document text as well, because the .ts mirror is
    // explicitly subordinate to RALLY_RULES.md ("the document wins").
    const doc = readFileSync(
      fileURLToPath(new URL('../../../spec/RALLY_RULES.md', import.meta.url)),
      'utf8',
    );
    const line = doc.split('\n').find((l) => l.includes('One seeded PRNG instance per system'));
    expect(line).toBeDefined();
    for (const ch of RNG_CHANNELS) expect(line).toContain(ch);
  });

  it('draining one channel does not move another', () => {
    const quiet = new StageRng('fafe');
    const scatterFirst = quiet.scatter.next();

    const busy = new StageRng('fafe');
    for (let i = 0; i < 5_000; i++) busy.weather.next();
    for (let i = 0; i < 5_000; i++) busy.ambient.next();
    for (let i = 0; i < 5_000; i++) busy.damageRoll.next();

    // This is the property that makes a scatter bug attributable: retuning the
    // weather, or taking one extra damage roll mid-race, cannot move a tree.
    expect(busy.scatter.next()).toBe(scatterFirst);
  });

  it('the same channel name in two stages gives two different streams', () => {
    const a = new StageRng('pikes');
    const b = new StageRng('safari');
    expect(a.scatter.next()).not.toBe(b.scatter.next());
  });
});

describe('fork() — determinism that survives development', () => {
  it('a fork depends on its label and its stage, not on the parent position', () => {
    const early = new Rng(1234, 'root').fork('rocks');
    const late = new Rng(1234, 'root');
    for (let i = 0; i < 999; i++) late.next();
    // Same label, same seed, wildly different parent positions — same stream.
    expect(late.fork('rocks').next()).toBe(early.next());
  });

  it('adding a fork does not move the others', () => {
    const before = new StageRng('estonia').scatter;
    const trees = before.fork('trees');
    const treesRun = Array.from({ length: 20 }, () => trees.next());

    const after = new StageRng('estonia').scatter;
    after.fork('fences');           // a whole new pass, added later
    after.fork('boulders');         // and another
    const treesAgain = after.fork('trees');

    // Without this property, "deterministic" is technically true and useless:
    // every new scatter pass would reshuffle every existing one, and no diff
    // would ever be readable.
    expect(Array.from({ length: 20 }, () => treesAgain.next())).toEqual(treesRun);
  });

  it('different labels give different streams', () => {
    const root = new Rng(55, 'root');
    expect(root.fork('a').next()).not.toBe(root.fork('b').next());
  });
});

describe('distributions', () => {
  it('int() stays in range, inclusive at both ends', () => {
    const r = new Rng(11);
    let sawMin = false;
    let sawMax = false;
    for (let i = 0; i < 20_000; i++) {
      const v = r.int(3, 7);
      expect(v).toBeGreaterThanOrEqual(3);
      expect(v).toBeLessThanOrEqual(7);
      expect(Number.isInteger(v)).toBe(true);
      if (v === 3) sawMin = true;
      if (v === 7) sawMax = true;
    }
    expect(sawMin && sawMax).toBe(true);
  });

  it('int() is unbiased across a span that does not divide 2^32', () => {
    // The bug this catches: `next() % 5` favours the low buckets. With 5
    // species of tree that is a visibly wrong forest.
    const r = new Rng(12);
    const buckets = [0, 0, 0, 0, 0];
    const n = 200_000;
    for (let i = 0; i < n; i++) buckets[r.int(0, 4)]++;
    for (const b of buckets) expect(Math.abs(b / n - 0.2)).toBeLessThan(0.006);
  });

  it('int() handles a degenerate span', () => {
    const r = new Rng(13);
    expect(r.int(4, 4)).toBe(4);
  });

  it('float() stays in [0, 1)', () => {
    const r = new Rng(14);
    for (let i = 0; i < 50_000; i++) {
      const v = r.float();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('gaussian() has roughly unit variance and zero mean', () => {
    const r = new Rng(15);
    let sum = 0;
    let sumSq = 0;
    const n = 100_000;
    for (let i = 0; i < n; i++) {
      const v = r.gaussian();
      sum += v;
      sumSq += v * v;
    }
    expect(Math.abs(sum / n)).toBeLessThan(0.02);
    expect(Math.abs(sumSq / n - 1)).toBeLessThan(0.02);
  });

  it('weighted() respects the weights and tolerates a zero total', () => {
    const r = new Rng(16);
    const counts = { a: 0, b: 0 };
    for (let i = 0; i < 20_000; i++) counts[r.weighted(['a', 'b'] as const, [3, 1])!]++;
    expect(counts.a / 20_000).toBeGreaterThan(0.72);
    expect(counts.a / 20_000).toBeLessThan(0.78);
    expect(r.weighted(['x'], [0])).toBe('x');
    expect(r.weighted([], [])).toBeUndefined();
  });

  it('pick() and shuffle() are deterministic', () => {
    const a = new Rng(17);
    const b = new Rng(17);
    const src = ['pine', 'birch', 'spruce', 'rock', 'fence'];
    expect(a.pick(src)).toBe(b.pick(src));
    expect(a.shuffle([...src])).toEqual(b.shuffle([...src]));
    expect(a.pick([])).toBeUndefined();
  });

  it('shuffle() actually permutes and preserves membership', () => {
    const r = new Rng(18);
    const src = Array.from({ length: 40 }, (_, i) => i);
    const out = r.shuffle([...src]);
    expect([...out].sort((x, y) => x - y)).toEqual(src);
    expect(out).not.toEqual(src);
  });
});

describe('state — the replay half of §14.4', () => {
  it('a snapshot restores the exact continuation', () => {
    const r = new Rng(21);
    for (let i = 0; i < 100; i++) r.next();
    const snap = r.getState();
    const expected = Array.from({ length: 50 }, () => r.next());

    r.setState(snap);
    expect(Array.from({ length: 50 }, () => r.next())).toEqual(expected);
  });

  it('the snapshot carries the gaussian spare', () => {
    // Box-Muller holds one unused deviate. A restore that dropped it would
    // give a different next gaussian() — a subtle desync that would only show
    // up minutes into a replay.
    const r = new Rng(22);
    r.gaussian();                       // leaves a spare
    const snap = r.getState();
    expect(snap.spare).not.toBeNull();
    const expected = r.gaussian();
    r.setState(snap);
    expect(r.gaussian()).toBe(expected);
  });

  it('clone() runs alongside without disturbing the original', () => {
    const r = new Rng(23);
    for (let i = 0; i < 10; i++) r.next();
    const probe = r.clone();
    const probeRun = Array.from({ length: 5 }, () => probe.next());
    expect(Array.from({ length: 5 }, () => r.next())).toEqual(probeRun);
  });

  it('draws counts every raw word', () => {
    const r = new Rng(24);
    for (let i = 0; i < 37; i++) r.next();
    expect(r.draws).toBe(37);
  });
});

describe('draw accounting — "which system moved?"', () => {
  it('totalDraws reaches into forks', () => {
    // A world pass takes a fork and never touches the channel itself, so a
    // count that stopped at the channel reported zero for a stage with six
    // thousand objects in it. The dump tool printed exactly that.
    const root = new Rng(31, 'scatter');
    const trees = root.fork('trees');
    const rocks = root.fork('rocks');
    for (let i = 0; i < 100; i++) trees.next();
    for (let i = 0; i < 40; i++) rocks.next();
    root.next();

    expect(root.draws).toBe(1);
    expect(root.totalDraws).toBe(141);
  });

  it('drawTree names each fork', () => {
    const root = new Rng(32, 'scatter');
    for (let i = 0; i < 7; i++) root.fork('tier4').next();
    const deep = root.fork('tier3').fork('logs');
    for (let i = 0; i < 3; i++) deep.next();

    const tree = root.drawTree();
    expect(tree['scatter']).toBe(0);
    expect(tree['scatter/tier3/logs']).toBe(3);
  });

  it('a StageRng reports per-channel totals including forks', () => {
    const stage = new StageRng('accounting');
    const f = stage.scatter.fork('trees');
    for (let i = 0; i < 25; i++) f.next();
    for (let i = 0; i < 4; i++) stage.weather.next();

    expect(stage.draws()).toMatchObject({ scatter: 25, weather: 4, ambient: 0, damageRoll: 0 });
  });

  it('accounting does not perturb the streams it measures', () => {
    const a = new Rng(33, 'x');
    const b = new Rng(33, 'x');
    a.fork('probe');
    a.totalDraws;
    a.drawTree();
    expect(a.next()).toBe(b.next());
  });
});

describe('fingerprint', () => {
  it('is stable for equal structures and blind to key order', () => {
    expect(fingerprint({ a: 1, b: [1, 2, 'x'] })).toBe('34a06ec5');
    expect(fingerprint({ b: [1, 2, 'x'], a: 1 })).toBe('34a06ec5');
  });

  it('notices a difference in the last mantissa bit', () => {
    // "Byte for byte" means byte for byte. A digest that rounded positions
    // would let a real drift through.
    const x = 1234.5678;
    expect(fingerprint([x])).not.toBe(fingerprint([x + Number.EPSILON * 1024]));
  });

  it('distinguishes shape, not just contents', () => {
    expect(fingerprint([1, [2]])).not.toBe(fingerprint([[1], 2]));
    expect(fingerprint({ a: 1 })).not.toBe(fingerprint([1]));
    expect(fingerprint(null)).not.toBe(fingerprint(undefined));
    expect(fingerprint(0)).not.toBe(fingerprint(false));
  });
});

describe('withoutMathRandom — keeping determinism once we have it', () => {
  const real = Math.random;
  afterEach(() => { Math.random = real; });

  it('throws on an unseeded draw and names the fix', () => {
    expect(() => withoutMathRandom(() => Math.random())).toThrow(/Math\.random/);
    expect(() => withoutMathRandom(() => Math.random())).toThrow(/DETERMINISM\.md/);
  });

  it('restores Math.random afterwards, including after a throw', () => {
    try { withoutMathRandom(() => { throw new Error('boom'); }); } catch { /* expected */ }
    expect(Math.random).toBe(real);
    expect(typeof Math.random()).toBe('number');
  });

  it('nests without un-poisoning early', () => {
    withoutMathRandom(() => {
      withoutMathRandom(() => { /* inner build step */ });
      expect(() => Math.random()).toThrow();
    });
    expect(Math.random).toBe(real);
  });

  it('lets seeded work through untouched', () => {
    const out = withoutMathRandom(() => new StageRng('corniche').scatter.next());
    expect(typeof out).toBe('number');
  });
});

describe('hashString', () => {
  it('is FNV-1a 32-bit', () => {
    expect(hashString('')).toBe(0x811c9dc5);
    expect(hashString('a')).toBe(0xe40c292c);
    expect(hashString('foobar')).toBe(0xbf9cf968);
  });

  it('separates names that differ only at the end', () => {
    expect(hashString('stage-01')).not.toBe(hashString('stage-02'));
  });
});

describe('the epoch', () => {
  it('is the only switch that reshuffles every stage at once', () => {
    expect(SEED_EPOCH).toBe('ignite-v2-1');
    expect(seedForStage('monte-carlo')).toBe(hashString(`${SEED_EPOCH}:monte-carlo`));
  });
});
