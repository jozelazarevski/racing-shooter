/* CLAUDE.md v1.5 §11 — STAGE RULES, the validator half.
 *
 * "Every rule MUST be enforced in two places: the generator (so it never
 * produces a violation) and the validator (so a hand edit cannot introduce
 * one)." This engine builds worlds at load, so the generator IS the builder
 * code; this module checks the OUTPUT, logs every finding as
 * `stageViolation` telemetry, and applies the §13.2 deterministic
 * auto-fixes (obstacle rocks out of street corridors, kicker landing zones
 * cleared). Findings it cannot fix deterministically — finish run-out/
 * run-in curvature, rails over the road, handle-less merged geometry —
 * carry fix:'generator' for the §13.3 round.
 *
 * Runs once per race build, after applyRouteDensity (the prop lists fill
 * late); tools-scratch/report-stagerules.mjs sweeps the roster with it for
 * the §13.1 report. Cull conventions are the density pass's own: a tree is
 * parts.setMatrixAt(id, scale0)+dead+culled; a solid is im/inst zeroed with
 * r=0; a handle-less record is COUNTED, never ghosted.
 */
import * as THREE from 'three';
import { propClassOf } from './route.js';
import { DRIVING, stageTemplate } from './driving.js';

const _m4 = new THREE.Matrix4();

/** circumradius of the lap at sample i over a ±k window; straight ≈ 1e9. */
function radiusAt(t, i, k = 6) {
  const N = t.center.length;
  const a = t.center[(i - k + N) % N], b = t.center[i % N], c = t.center[(i + k) % N];
  const abx = b.x - a.x, abz = b.z - a.z;
  const bcx = c.x - b.x, bcz = c.z - b.z;
  const cross = abx * bcz - abz * bcx;
  if (Math.abs(cross) < 1e-6) return 1e9;
  const ab = Math.hypot(abx, abz), bc = Math.hypot(bcx, bcz);
  const ac = Math.hypot(c.x - a.x, c.z - a.z);
  return (ab * bc * ac) / (2 * Math.abs(cross));
}

function cullTree(tr) {
  if (tr.culled || tr.dead) return true;
  if (!tr.parts?.length) return false;
  tr.culled = true; tr.dead = true;
  _m4.makeScale(0, 0, 0);
  for (const part of tr.parts) {
    part.setMatrixAt(tr.id, _m4);
    part.instanceMatrix.needsUpdate = true;
  }
  return true;
}

function cullSolid(ob) {
  if (ob.culled) return true;
  if (!(ob.im && ob.inst !== undefined && ob.im.setMatrixAt)) return false;
  _m4.makeScale(0, 0, 0);
  ob.im.setMatrixAt(ob.inst, _m4);
  ob.im.instanceMatrix.needsUpdate = true;
  ob.r = 0; ob.culled = true; ob.dead = true;
  return true;
}

export function runStageValidator(game) {
  const t = game.track, route = game.route;
  if (!t?.center?.length) return [];
  const N = t.center.length;
  const sampleLen = Math.max(1, Math.hypot(
    t.center[1].x - t.center[0].x, t.center[1].z - t.center[0].z));
  const V = [];
  const log = (rule, detail) => {
    V.push({ rule, ...detail });
    game.telemetry?.log('stageViolation', { rule, ...detail });
  };
  const kindAt = (i) => (route?.kindAtIndex ? route.kindAtIndex(i) : 'trail');
  const half = (i) => t.widthAt?.(i) ?? 9;

  // ---- 11.1 finish run-out (80 m past the line clear of corners tighter
  // than 60 m radius) and run-in (60 m before it) — generator findings ----
  const runoutS = Math.round(80 / sampleLen), runinS = Math.round(60 / sampleLen);
  for (let i = 3; i <= runoutS; i += 3) {
    const r = radiusAt(t, i % N);
    if (r < 60) { log('finish-runout', { atM: Math.round(i * sampleLen), radiusM: Math.round(r), fix: 'generator' }); break; }
  }
  for (let i = 3; i <= runinS; i += 3) {
    const r = radiusAt(t, (N - i) % N);
    if (r < 60) { log('finish-runin', { atM: Math.round(i * sampleLen), radiusM: Math.round(r), fix: 'generator' }); break; }
  }

  // ---- 11.3 rails/fences with a foot on the driving surface -------------
  let railOver = 0;
  for (const b of t.barriers ?? []) {
    if (b.over) continue;                        // deck rails belong to decks
    for (const [bx, bz] of [[b.x1, b.z1], [b.x2, b.z2]]) {
      const gi = t.nearestIndex ? t.nearestIndex({ x: bx, z: bz }, null) : 0;
      const c = t.center[gi];
      if (Math.hypot(bx - c.x, bz - c.z) < half(gi) - 0.3
          && Math.abs((b.y ?? c.y) - c.y) < 4) { railOver++; break; }
    }
  }
  if (railOver) log('rail-over-road', { count: railOver, fix: 'generator' });

  // ---- 11.3 street corridors: rocks and free-standing obstacles OUT ----
  // (r299's density pass rations the 4-12 m band on non-street and skipped
  // streets entirely; v1.5 says a street segment's corridor holds facades,
  // kerbs, crates — never boulders or grown trees.)
  const pad = DRIVING.route?.trailPadM ?? 12;
  let stCulled = 0, stStuck = 0;
  for (const tr of t.trees ?? []) {
    if (tr.dead || tr.culled) continue;
    if (propClassOf(tr) !== 'obstacle') continue;
    const gi = t.nearestIndex ? t.nearestIndex(tr, null) : 0;
    if (kindAt(gi) !== 'street') continue;
    const c = t.center[gi];
    if (Math.hypot(tr.x - c.x, tr.z - c.z) > half(gi) + pad) continue;
    if (cullTree(tr)) stCulled++; else stStuck++;
  }
  for (const ob of t.solids ?? []) {
    if (ob.culled || !(ob.r > 0)) continue;
    if (ob.mat !== 'stone' || ob.r > 8) continue;   // huge radii are massif anchors
    if (propClassOf(ob) !== 'obstacle') continue;
    const gi = t.nearestIndex ? t.nearestIndex(ob, null) : 0;
    if (kindAt(gi) !== 'street') continue;
    const c = t.center[gi];
    if (Math.hypot(ob.x - c.x, ob.z - c.z) > half(gi) + pad) continue;
    if (cullSolid(ob)) stCulled++; else stStuck++;
  }
  if (stCulled || stStuck) {
    log('street-obstacles', { culled: stCulled, unculled: stStuck,
      fix: stStuck ? 'generator' : 'auto' });
  }

  // ---- 11.3 kicker landing zones, clear across the full speed range -----
  // The fan reaches from the crest apex to where the fastest car lands —
  // sized from the stage's own nitro ceiling, not a constant. This is the
  // rule recording E paid for at 3:xx (kicker into a rock, -44, dead stop)
  // and this session's own race log paid at t=32-35 (four rock hits after
  // a jump, 100 hull in 2.7 s).
  let lzCulled = 0, lzStuck = 0;
  const reachS = Math.round(((game._nitroCeilU ?? 48) * 1.9) / sampleLen);
  const inFan = (p, from, span) => {
    const gi = t.nearestIndex ? t.nearestIndex(p, null) : 0;
    const rel = (gi - from + N) % N;
    if (rel > span) return false;
    const c = t.center[gi];
    if (Math.hypot(p.x - c.x, p.z - c.z) > half(gi) + 6) return false;
    // r343b: the PHYSICS' own vertical window. A solid without `h` is only
    // solid within ±6 u of its own y (vehicles.js keeps that window on
    // purpose — "for a knee-high rock under a flyover that window is the
    // point"), so a record 12 u under the road deck (CLIFF KNOT gi548,
    // y −1 vs road 10.9) can never touch a landing car and is not a
    // violation. Tall things (`h`) are solid over their whole span.
    if (p.y !== undefined && p.h === undefined && Math.abs(p.y - c.y) > 6) return false;
    return true;
  };
  for (const cr of t.crests ?? []) {
    const from = (cr.index + Math.round(cr.len * 0.5)) % N;
    const span = Math.round(cr.len * 0.5) + reachS;
    for (const tr of t.trees ?? []) {
      if (tr.dead || tr.culled || propClassOf(tr) !== 'obstacle') continue;
      if (!inFan(tr, from, span)) continue;
      // r343: a stuck record inside two overlapping fans counted once per
      // crest — the report doubled. Count each record once.
      if (cullTree(tr)) lzCulled++; else if (!tr._lzCounted) { tr._lzCounted = true; lzStuck++; }
    }
    for (const ob of t.solids ?? []) {
      if (ob.culled || !(ob.r > 0)) continue;
      if (ob.mat !== 'stone' || ob.r > 8 || propClassOf(ob) !== 'obstacle') continue;
      // r343: §7.3's words are "obstacle PROPS" — culvert masonry is §7.13
      // structure with its own _clearsRoad discipline, and until the src
      // tags existed this filter could not tell a parapet from a rock. Bore
      // walls stay IN the rule (a landing at a tunnel mouth was the owner's
      // race log); their fix is tunnelFitAt's directional fan guard.
      if (ob.src === 'culvertParapet' || ob.src === 'culvertHeadwall') continue;
      if (!inFan(ob, from, span)) continue;
      if (cullSolid(ob)) lzCulled++; else if (!ob._lzCounted) { ob._lzCounted = true; lzStuck++; }
    }
  }
  if (lzCulled || lzStuck) {
    log('kicker-landing', { kickers: (t.crests ?? []).length, culled: lzCulled,
      unculled: lzStuck, fix: lzStuck ? 'generator' : 'auto' });
  }

  // ---- 11.2 pickups: the validator re-checks what the generator built ---
  const kind = stageTemplate(game.level);
  const nitroCap = kind === 'street' ? 1 : 2;
  const nitros = (game.pickups ?? []).filter((p) => p.type === 'nitro');
  if (nitros.length > nitroCap) {
    log('nitro-count', { have: nitros.length, cap: nitroCap, fix: 'generator' });
  }
  const guardS = Math.round(80 / sampleLen);
  for (const p of nitros) {
    if (Math.min(p.index, N - p.index) <= guardS) {
      log('nitro-finish-straight', { index: p.index, fix: 'generator' });
    }
  }

  // ---- v2.3 §7.12 (r332): no pickup inside the world's mass -------------
  // (a pickup on a shelf road sits far ABOVE the valley floor and is fine;
  // the violation is terrain standing over the beacon — recording F 0:08)
  for (const p of game.pickups ?? []) {
    const terr = t.terrainHeight?.(p.pos.x, p.pos.z);
    if (Number.isFinite(terr) && terr > p.pos.y + 0.5) {
      log('pickup-buried', { index: p.index, type: p.type,
        overM: +(terr - p.pos.y).toFixed(1), fix: 'generator' });
    }
  }

  // ---- v2.3 §7.13 (r332): no structure base hovering over terrain -------
  // (the _element plinth carries every footprint to its lowest ground; this
  // re-checks that promise the spec's way: base within 0.1 u of terrain at
  // every footprint corner, with the plinth's own 0.25 sink as slack)
  {
    let hovers = 0, worst = 0;
    for (const el of t.placedElements ?? []) {
      if (!Number.isFinite(el.baseY)) continue;
      let lowG = Infinity;
      for (let a = 0; a < 12; a++) {
        const th = a * Math.PI / 6;
        const g = t.terrainHeight?.(el.x + Math.cos(th) * el.r, el.z + Math.sin(th) * el.r);
        if (Number.isFinite(g) && g < lowG) lowG = g;
      }
      const hover = el.baseY - lowG;
      if (hover > 0.35) { hovers++; if (hover > worst) worst = hover; }
    }
    if (hovers) log('structure-hover', { count: hovers, worstM: +worst.toFixed(1), fix: 'generator' });
  }

  game._stageReport = V;
  return V;
}
