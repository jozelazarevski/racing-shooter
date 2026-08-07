/* §11 — reset nodes, triggers, penalties and cutting. */
import { describe, expect, it } from 'vitest';
import { CUTTING, RESET } from '../../../spec/rally.constants.ts';
import { Rng, hashString } from '../core/rng.ts';
import { buildCorridor } from '../world/corridor.ts';
import { STAGES } from '../world/stage.ts';
import {
  CutMonitor, NODE_SPACING_MAX, ResetMonitor, buildResetNodes, nodeFor, worstNodeGap,
} from './reset.ts';

const corridorFor = (id: string) => {
  const def = STAGES.find((s) => s.id === id)!;
  return buildCorridor(def.moves, def.surface, new Rng(hashString(`reset:${id}`)));
};

describe('L12 — a reset node at least every 120 m', () => {
  it('holds on every stage, including the run to the finish', () => {
    for (const def of STAGES) {
      const corridor = corridorFor(def.id);
      const nodes = buildResetNodes(corridor);
      expect(worstNodeGap(nodes)).toBeLessThanOrEqual(NODE_SPACING_MAX + 1e-6);
      expect(nodes[0]!.distance).toBe(0);
      // The last node is the last segment, so no part of the stage is more
      // than one spacing from a node behind it.
      const last = corridor.segments[corridor.segments.length - 1]!;
      expect(nodes[nodes.length - 1]!.distance).toBeCloseTo(last.distance, 6);
    }
  });

  it('prefers straight road, without ever breaking the spacing to get it', () => {
    // Col de Turini is hairpins joined by traverses. A node in the middle of a
    // 20 m hairpin respawns the car pointing at the apex with no run-up.
    const corridor = corridorFor('col-de-turini');
    const nodes = buildResetNodes(corridor);
    const tight = nodes.filter((n) => corridor.segments[n.index]!.cornerRadius < 40).length;
    expect(tight / nodes.length).toBeLessThan(0.2);
    expect(worstNodeGap(nodes)).toBeLessThanOrEqual(NODE_SPACING_MAX + 1e-6);
  });
});

describe('§11.2.1 — respawn UPSTREAM of where the car got to', () => {
  it('never puts a car further down the stage than it drove', () => {
    const corridor = corridorFor('fafe');
    const nodes = buildResetNodes(corridor);
    for (const passed of [0, 37, 119, 120, 121, 1500, 4000]) {
      expect(nodeFor(nodes, passed).distance).toBeLessThanOrEqual(passed + 1e-9);
    }
  });

  it('picks the nearest one behind, not the nearest one', () => {
    const corridor = corridorFor('fafe');
    const nodes = buildResetNodes(corridor);
    const chosen = nodeFor(nodes, 250);
    const behind = nodes.filter((n) => n.distance <= 250);
    expect(chosen).toBe(behind[behind.length - 1]);
  });
});

describe('§11.1 — every trigger keeps its own clock', () => {
  it('fires at the specified delay and not before', () => {
    const m = new ResetMonitor();
    const dt = 1 / 120;
    let fired: string | null = null;
    for (let t = 0; t < RESET.onRoofDelay - dt; t += dt) {
      fired = m.update(dt, { roof: true });
      expect(fired).toBeNull();
    }
    // One step past 2.5 s.
    for (let i = 0; i < 3 && !fired; i++) fired = m.update(dt, { roof: true });
    expect(fired).toBe('roof');
  });

  it('a trigger that goes away resets its own clock and no one else\'s', () => {
    const m = new ResetMonitor();
    const dt = 0.1;
    for (let i = 0; i < 15; i++) m.update(dt, { stuck: true, roof: true });   // 1.5 s
    // Roof recovers; stuck continues. Roof must start again from zero, and
    // stuck must fire at ITS delay measured from the original entry.
    let fired: string | null = null;
    for (let t = 1.5; t < RESET.stuckDelay + 0.2 && !fired; t += dt) {
      fired = m.update(dt, { stuck: true });
    }
    expect(fired).toBe('stuck');
  });

  it('the shorter delay wins when a car trips two at once', () => {
    // On its roof (2.5 s) at the bottom of a ravine (2.0 s): off-deck ripens
    // first and should be the one that fires.
    const m = new ResetMonitor();
    const dt = 0.05;
    let fired: string | null = null;
    for (let i = 0; i < 60 && !fired; i++) fired = m.update(dt, { roof: true, offDeck: true });
    expect(fired).toBe('offDeck');
  });
});

describe('§11.2 — a reset costs something', () => {
  it('takes the standard 10 s and starts the immunity', () => {
    const m = new ResetMonitor();
    m.serve();
    expect(m.penaltySeconds).toBe(RESET.penaltySeconds.standard);
    expect(m.immunity).toBe(RESET.immunitySeconds);
    expect(m.count).toBe(1);
  });

  it('immunity runs down with time and ends early on throttle', () => {
    const m = new ResetMonitor();
    m.serve();
    m.update(1.0, {});
    expect(m.immunity).toBeCloseTo(RESET.immunitySeconds - 1.0, 6);
    m.onThrottle();
    expect(m.immunity).toBe(0);
  });

  it('career mode costs twice what casual does, per the table', () => {
    const casual = new ResetMonitor();
    const career = new ResetMonitor();
    casual.serve('casual');
    career.serve('career');
    expect(career.penaltySeconds).toBe(RESET.penaltySeconds.career);
    expect(casual.penaltySeconds).toBe(RESET.penaltySeconds.casual);
  });
});

describe('§11.3 — cutting', () => {
  const dt = 0.1;

  it('registers a cut when three wheels are off for 1.2 s and gain ground', () => {
    const c = new CutMonitor();
    let d = 100;
    for (let i = 0; i < 20; i++) { d += 5; c.update(dt, 3, d); }
    expect(c.cuts).toBe(1);
    expect(c.penaltySeconds).toBe(CUTTING.penaltyFirst);
  });

  it('does NOT penalise a mistake that loses ground', () => {
    // Off the road, stopped, rejoining where it left. That is a bad corner,
    // not a cut, and §11.3 says so: the exit must be LATER on the centreline.
    const c = new CutMonitor();
    for (let i = 0; i < 30; i++) c.update(dt, 4, 500);
    c.update(dt, 0, 500);
    expect(c.cuts).toBe(0);
  });

  it('does not penalise a brief excursion', () => {
    const c = new CutMonitor();
    let d = 200;
    for (let i = 0; i < 8; i++) { d += 4; c.update(dt, 3, d); }   // 0.8 s < 1.2 s
    c.update(dt, 0, d + 4);
    expect(c.cuts).toBe(0);
  });

  it('ignores two wheels on the shoulder, which is normal driving', () => {
    const c = new CutMonitor();
    let d = 300;
    for (let i = 0; i < 40; i++) { d += 5; c.update(dt, 2, d); }
    expect(c.cuts).toBe(0);
  });

  it('escalates to 5 s on the third cut in one stage', () => {
    const c = new CutMonitor();
    let d = 0;
    for (let cut = 0; cut < 3; cut++) {
      for (let i = 0; i < 20; i++) { d += 5; c.update(dt, 3, d); }
      for (let i = 0; i < 5; i++) { d += 5; c.update(dt, 0, d); }
    }
    expect(c.cuts).toBe(3);
    expect(c.penaltySeconds).toBe(CUTTING.penaltyFirst * 2 + CUTTING.penaltyThird);
  });
});
