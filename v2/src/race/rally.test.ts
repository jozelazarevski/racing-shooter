/* The rally: progression, carried damage, the service park, retirement. */
import { beforeEach, describe, expect, it } from 'vitest';
import {
  ITINERARY, TERMINAL_DAMAGE_J, classification, completeLeg, damageClass,
  emptyRally, isComplete, legFor, loadRally, saveRally, unlocked,
} from './rally.ts';
import { STAGES } from '../world/stage.ts';

beforeEach(() => {
  const store = new Map<string, string>();
  (globalThis as { localStorage?: unknown }).localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
  };
});

const leg = (stageId: string, over: Partial<{ raw: number; penalty: number; damageJ: number }> = {}) => ({
  stageId, raw: 180, penalty: 0, resets: 0, cuts: 0, damageJ: 0, ...over,
});

describe('the itinerary', () => {
  it('names only stages that exist, each once', () => {
    const ids = ITINERARY.map((l) => l.stageId);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(STAGES.some((s) => s.id === id)).toBe(true);
  });

  it('covers every stage in the game, so none is unreachable', () => {
    expect(new Set(ITINERARY.map((l) => l.stageId))).toEqual(new Set(STAGES.map((s) => s.id)));
  });

  it('has exactly one service park, and not on the first leg', () => {
    expect(ITINERARY.filter((l) => l.service).length).toBe(1);
    expect(ITINERARY[0]!.service).toBe(false);
  });
});

describe('progression', () => {
  it('starts on leg one with nothing driven', () => {
    const s = emptyRally();
    expect(s.leg).toBe(0);
    expect(classification(s)).toBe(0);
    expect(unlocked(s)).toEqual(new Set([ITINERARY[0]!.stageId]));
  });

  it('unlocks the next stage on finishing one, and no more than one', () => {
    let s = emptyRally();
    s = completeLeg(s, leg(ITINERARY[0]!.stageId));
    expect(unlocked(s).size).toBe(2);
    expect(unlocked(s).has(ITINERARY[1]!.stageId)).toBe(true);
    expect(unlocked(s).has(ITINERARY[2]!.stageId)).toBe(false);
  });

  it('classifies on driving PLUS penalties, not driving alone', () => {
    let s = emptyRally();
    s = completeLeg(s, leg(ITINERARY[0]!.stageId, { raw: 170, penalty: 22 }));
    s = completeLeg(s, leg(ITINERARY[1]!.stageId, { raw: 200, penalty: 0 }));
    expect(classification(s)).toBe(392);
  });

  it('completes after the last leg and accepts nothing further', () => {
    let s = emptyRally();
    for (const l of ITINERARY) s = completeLeg(s, leg(l.stageId));
    expect(isComplete(s)).toBe(true);
    const after = completeLeg(s, leg('ouninpohja'));
    expect(after).toBe(s);
    expect(after.results.length).toBe(ITINERARY.length);
  });
});

describe('§11.2.6 — only a service park repairs damage', () => {
  it('carries damage from one stage into the next', () => {
    let s = emptyRally();
    s = completeLeg(s, leg(ITINERARY[0]!.stageId, { damageJ: 18_000 }));
    expect(s.damageJ).toBe(18_000);
  });

  it('repairs it at the service park, and only there', () => {
    const serviceLeg = ITINERARY.findIndex((l) => l.service);
    expect(serviceLeg).toBeGreaterThan(0);
    let s = emptyRally();
    for (let i = 0; i < serviceLeg; i++) {
      s = completeLeg(s, leg(ITINERARY[i]!.stageId, { damageJ: 10_000 * (i + 1) }));
      // Every leg before the one after the service park keeps its damage.
      if (i < serviceLeg - 1) expect(s.damageJ).toBeGreaterThan(0);
    }
    // Arriving at the leg with `service: true` clears it.
    expect(s.leg).toBe(serviceLeg);
    expect(s.damageJ).toBe(0);
  });

  it('does not repair anything on an ordinary leg', () => {
    let s = emptyRally();
    s = completeLeg(s, leg(ITINERARY[0]!.stageId, { damageJ: 30_000 }));
    s = completeLeg(s, leg(ITINERARY[1]!.stageId, { damageJ: 44_000 }));
    expect(s.damageJ).toBe(44_000);
  });
});

describe('§9 — terminal damage retires the car', () => {
  it('retires at the top of the major band', () => {
    let s = emptyRally();
    s = completeLeg(s, leg(ITINERARY[0]!.stageId, { damageJ: TERMINAL_DAMAGE_J }));
    expect(s.retired).toBe(true);
  });

  it('does not retire just below it', () => {
    let s = emptyRally();
    s = completeLeg(s, leg(ITINERARY[0]!.stageId, { damageJ: TERMINAL_DAMAGE_J - 1 }));
    expect(s.retired).toBe(false);
  });

  it('a retired car does not reach the service park', () => {
    const serviceLeg = ITINERARY.findIndex((l) => l.service);
    let s = emptyRally();
    for (let i = 0; i < serviceLeg - 1; i++) s = completeLeg(s, leg(ITINERARY[i]!.stageId));
    s = completeLeg(s, leg(ITINERARY[serviceLeg - 1]!.stageId, { damageJ: TERMINAL_DAMAGE_J }));
    expect(s.retired).toBe(true);
    expect(s.damageJ).toBe(TERMINAL_DAMAGE_J);
  });

  it('a retired rally accepts no further legs', () => {
    let s = emptyRally();
    s = completeLeg(s, leg(ITINERARY[0]!.stageId, { damageJ: TERMINAL_DAMAGE_J }));
    const before = s.leg;
    s = completeLeg(s, leg(ITINERARY[1]!.stageId));
    expect(s.leg).toBe(before);
  });

  it('reports the §9 vocabulary', () => {
    expect(damageClass(1_000)).toBe('cosmetic');
    expect(damageClass(30_000)).toBe('mechanical_minor');
    expect(damageClass(119_000)).toBe('major');
    expect(damageClass(200_000)).toBe('terminal');
  });
});

describe('storage', () => {
  it('round-trips', () => {
    let s = emptyRally();
    s = completeLeg(s, leg(ITINERARY[0]!.stageId, { raw: 171.3, penalty: 10, damageJ: 4_500 }));
    saveRally(s);
    const back = loadRally();
    expect(back.leg).toBe(s.leg);
    expect(back.damageJ).toBe(4_500);
    expect(classification(back)).toBeCloseTo(181.3, 6);
  });

  it('starts a fresh rally on a corrupt store rather than throwing', () => {
    localStorage.setItem('ignite-v2-rally', '{not json');
    expect(loadRally()).toEqual(emptyRally());
    localStorage.setItem('ignite-v2-rally', '{"leg":"three"}');
    expect(loadRally()).toEqual(emptyRally());
  });

  it('clamps a leg index that has outrun the itinerary', () => {
    localStorage.setItem('ignite-v2-rally', JSON.stringify({ leg: 99, results: [], damageJ: -5 }));
    const s = loadRally();
    expect(s.leg).toBe(ITINERARY.length);
    expect(s.damageJ).toBe(0);
  });

  it('survives a store that throws on write', () => {
    (globalThis as { localStorage?: unknown }).localStorage = {
      getItem: () => null,
      setItem: () => { throw new Error('quota'); },
    };
    expect(() => saveRally(emptyRally())).not.toThrow();
  });
});

describe('legFor', () => {
  it('finds a stage in the itinerary and reports -1 for one that is not', () => {
    expect(legFor(ITINERARY[2]!.stageId)).toBe(2);
    expect(legFor('not-a-stage')).toBe(-1);
  });
});
