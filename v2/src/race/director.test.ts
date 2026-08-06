/* The race director, tested without a car.
 *
 * Timing, splits and the personal best are pure logic over (dt, distance), so
 * they are testable at unit level — and should be, because verifying them
 * through a full AI-driven lap makes them hostage to how well the AI drives.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { RaceDirector, SECTOR_METRES, formatTime, formatDelta } from './director.ts';

/** localStorage is a browser API; vitest runs in node. */
beforeEach(() => {
  const store = new Map<string, string>();
  (globalThis as { localStorage?: unknown }).localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
  };
});

/** Drive a stage at a constant speed, in physics steps. */
function run(director: RaceDirector, lengthM: number, speedMs: number): void {
  const dt = 1 / 120;
  let d = 0;
  for (let i = 0; i < 200_000 && director.phase !== 'finished'; i++) {
    if (director.phase === 'running') d += speedMs * dt;
    director.update(dt, Math.min(d, lengthM));
  }
}

/**
 * Drive it the way the GAME does: distance snapped to the 4 m centreline grid.
 *
 * This distinction is the whole reason for the test below. The director was
 * only ever driven here with a continuous distance that reached the stage
 * length exactly, so a finish line at `length - 1` was always crossed. The game
 * feeds it a SEGMENT's distance, which stops one step short of the length — so
 * in the game the line could not be crossed at all, and every run ended with
 * the car sitting at the end of the road while recovery put it back, forever.
 */
function runQuantised(director: RaceDirector, lengthM: number, step: number, speedMs: number): void {
  const dt = 1 / 120;
  const lastNode = Math.floor((lengthM - 1e-9) / step) * step;
  let d = 0;
  for (let i = 0; i < 200_000 && director.phase !== 'finished'; i++) {
    if (director.phase === 'running') d += speedMs * dt;
    director.update(dt, Math.min(Math.floor(d / step) * step, lastNode));
  }
}

describe('countdown', () => {
  it('holds the car, counts down, then releases', () => {
    const d = new RaceDirector('probe', 4000);
    expect(d.phase).toBe('countdown');
    expect(d.locked).toBe(true);
    expect(d.countdownText).toBe('3');

    for (let i = 0; i < 120; i++) d.update(1 / 120, 0);   // 1 s
    expect(d.countdownText).toBe('2');

    for (let i = 0; i < 300; i++) d.update(1 / 120, 0);   // 3.5 s total
    expect(d.phase).toBe('running');
    expect(d.locked).toBe(false);
  });

  it('does not run the clock during the countdown', () => {
    const d = new RaceDirector('probe', 4000);
    for (let i = 0; i < 120; i++) d.update(1 / 120, 0);
    expect(d.elapsed).toBe(0);
  });
});

describe('sectors', () => {
  it('splits every 500 m of centreline, per §1.1', () => {
    const d = new RaceDirector('probe', 4000);
    run(d, 4000, 20);
    // 4000 m / 500 = 8 sectors, the last coinciding with the finish.
    expect(d.splits.length).toBe(8);
    expect(SECTOR_METRES).toBe(500);
  });

  it('sector times increase and match the constant speed', () => {
    const d = new RaceDirector('probe', 4000);
    run(d, 4000, 25);
    for (let i = 1; i < d.splits.length; i++) {
      expect(d.splits[i]!.elapsed).toBeGreaterThan(d.splits[i - 1]!.elapsed);
    }
    // 500 m at 25 m/s is 20 s, within one physics step.
    expect(d.splits[0]!.elapsed).toBeCloseTo(20, 1);
  });

  it('records the sectors it did cross when one is skipped', () => {
    // A car that goes off and rejoins further along jumps a boundary.
    const d = new RaceDirector('probe', 4000);
    for (let i = 0; i < 400; i++) d.update(1 / 120, 0);   // clear the countdown
    d.update(1 / 120, 1200);                              // teleport past S1 and S2
    expect(d.splits.map((s) => s.index)).toEqual([1, 2]);
  });

  it('has no delta on a first run', () => {
    const d = new RaceDirector('fresh-stage', 4000);
    run(d, 4000, 20);
    expect(d.splits.every((s) => s.delta === null)).toBe(true);
  });
});

describe('personal best', () => {
  it('stores the first run and compares the second against it', () => {
    const first = new RaceDirector('pb-stage', 4000);
    run(first, 4000, 20);
    expect(first.result?.isBest).toBe(true);
    expect(first.result?.previous).toBeNull();

    const faster = new RaceDirector('pb-stage', 4000);
    expect(faster.best?.total).toBeCloseTo(first.result!.total, 3);
    run(faster, 4000, 25);
    expect(faster.result?.isBest).toBe(true);
    expect(faster.result!.total).toBeLessThan(first.result!.total);
    // Every sector was quicker, so every delta is negative.
    expect(faster.splits.every((s) => s.delta !== null && s.delta < 0)).toBe(true);
  });

  it('does not overwrite the best with a slower run', () => {
    const fast = new RaceDirector('keep-stage', 4000);
    run(fast, 4000, 30);
    const slow = new RaceDirector('keep-stage', 4000);
    run(slow, 4000, 15);
    expect(slow.result?.isBest).toBe(false);
    expect(slow.splits.every((s) => s.delta !== null && s.delta > 0)).toBe(true);

    const third = new RaceDirector('keep-stage', 4000);
    expect(third.best!.total).toBeCloseTo(fast.result!.total, 3);
  });

  it('keeps stages separate', () => {
    const a = new RaceDirector('stage-a', 4000);
    run(a, 4000, 30);
    expect(new RaceDirector('stage-b', 4000).best).toBeNull();
  });

  it('survives a corrupt or unavailable store rather than failing the race', () => {
    localStorage.setItem('ignite-v2-best:broken', '{not json');
    expect(new RaceDirector('broken', 4000).best).toBeNull();
    (globalThis as { localStorage?: unknown }).localStorage = {
      getItem() { throw new Error('blocked'); },
      setItem() { throw new Error('blocked'); },
    };
    const d = new RaceDirector('blocked', 4000);
    expect(d.best).toBeNull();
    expect(() => run(d, 4000, 25)).not.toThrow();
    expect(d.result?.isBest).toBe(true);
  });
});

describe('finish', () => {
  it('stops the clock once and only once', () => {
    const d = new RaceDirector('finish-stage', 4000);
    run(d, 4000, 25);
    expect(d.phase).toBe('finished');
    const total = d.result!.total;
    for (let i = 0; i < 500; i++) d.update(1 / 120, 4000);
    expect(d.elapsed).toBe(total);
  });

  it('a 4 km stage at 25 m/s takes about 160 s', () => {
    const d = new RaceDirector('sanity', 4000);
    run(d, 4000, 25);
    expect(d.result!.total).toBeCloseTo(160, 0);
  });

  it('CAN BE REACHED by the distance the game actually supplies', () => {
    // The stage is 4,002 m long; its last centreline node sits at 4,000 m.
    // A finish line anywhere beyond 4,000 is unreachable no matter how fast or
    // how long the car drives. This is the defect, in one assertion.
    const length = 4002;
    const step = 4;
    const last = 4000;

    const unreachable = new RaceDirector('default-finish', length);
    runQuantised(unreachable, length, step, 25);
    expect(unreachable.phase).not.toBe('finished');

    const real = new RaceDirector('real-finish', length, last);
    runQuantised(real, length, step, 25);
    expect(real.phase).toBe('finished');
    expect(real.result!.total).toBeCloseTo(160, 0);
  });

  it('records the final sector when the finish is the last node', () => {
    const length = 4002;
    const d = new RaceDirector('final-sector', length, 4000);
    runQuantised(d, length, 4, 25);
    // 4,000 m of 500 m sectors is 8 boundaries, the last one at the line.
    expect(d.splits.length).toBe(8);
    expect(d.splits[7]!.elapsed).toBeCloseTo(d.result!.total, 5);
  });
});

describe('formatting', () => {
  it('formats times and signed deltas', () => {
    expect(formatTime(0)).toBe('0:00.00');
    expect(formatTime(62.5)).toBe('1:02.50');
    expect(formatTime(3599.99)).toBe('59:59.99');
    expect(formatDelta(1.234)).toBe('+1.23');
    expect(formatDelta(-0.5)).toBe('−0.50');
    expect(formatDelta(0)).toBe('+0.00');
  });
});
