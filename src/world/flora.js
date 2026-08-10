// Everything that grows, and the rules for where it may stand.
//
// Two halves that belong together: the PLACEMENT helpers (_scatter,
// _clearsRoad, _trackSidePos, _zonePos, _altOK, _stoneFit) which decide
// whether a spot is legal, and the eleven biome vegetation builders which
// use them. Every builder here obeys the same contract — never on the
// road, never inside a structure, never through the rim wall.
//
// Installed on Track.prototype: see the note in sky.js.
import * as THREE from 'three';
import { grassTexture } from '../textures.js';
import { FLORA_MIX, HOUSE_TEMPLATES } from './catalog.js';
import { ROAD_HALF, WALL_OFF, CENTER_SAMPLES as N } from './constants.js';

// Scratch vector for _clearsRoad. Set immediately before every read, never
// live across a call, so a per-module instance is the same as a shared one.
const _clearV = new THREE.Vector3();

export const floraMethods = {
  /** Mid-distance canyon country outside the walls: smaller mesa blocks and a
   *  field of freestanding hoodoo towers, so rims and gaps read as desert. */
  _buildOutcrops(m4) {
    const mesaSpecs = [];
    let guard = 0;
    while (mesaSpecs.length < 18 && guard++ < 400) {
      const a = Math.random() * Math.PI * 2;
      const r = 120 + Math.random() * 480;
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (this._distToTrack(x, z) < 70) continue;
      mesaSpecs.push({ x, z, w: 20 + Math.random() * 40, h: 14 + Math.random() * 20 });
    }
    this._addMesaTiers(m4, mesaSpecs);
    // free-roamers can reach these — one solid per mesa (base tier is a unit
    // box scaled to w wide, so base footprint radius ≈ w/2)
    for (const s of mesaSpecs) {
      this.solids.push({
        x: s.x, z: s.z, r: s.w * 0.5 * 0.85, y: this.terrainHeight(s.x, s.z), mat: 'stone',
      });
    }

    // freestanding hoodoos: 4 stacked drums per tower, wider cap stone
    const COUNT = 40, SEGS = 4;
    const segGeo = new THREE.CylinderGeometry(0.8, 1, 1, 7);
    segGeo.translate(0, 0.5, 0);
    const hoodoos = new THREE.InstancedMesh(
      segGeo,
      new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true, roughness: 0.9 }),
      COUNT * SEGS
    );
    hoodoos.castShadow = true;
    const strata = ['#cf9a5e', '#a06844', '#b8845a', '#96603c'].map((c) => new THREE.Color(c));
    const q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
    const col = new THREE.Color();
    const wr = [1, 0.78, 0.6, 0.82];
    let k = 0, placed = 0;
    guard = 0;
    while (placed < COUNT && guard++ < 800) {
      const a = Math.random() * Math.PI * 2;
      const rr = 60 + Math.random() * 320;
      const x = Math.cos(a) * rr, z = Math.sin(a) * rr;
      const d = this._distToTrack(x, z);
      if (d < 26 || d > 140) continue;
      const r0 = 1.4 + Math.random() * 1.2;
      const hTot = 7 + Math.random() * 9;
      let y = this.terrainHeight(x, z) - 0.4;
      for (let s = 0; s < SEGS; s++) {
        const rad = r0 * wr[s] * (0.9 + Math.random() * 0.2);
        const hh = (hTot / SEGS) * (0.8 + Math.random() * 0.4);
        q.setFromAxisAngle(up, Math.random() * Math.PI * 2);
        m4.compose(
          new THREE.Vector3(x + (Math.random() - 0.5) * 0.4, y, z + (Math.random() - 0.5) * 0.4),
          q, new THREE.Vector3(rad, hh, rad)
        );
        hoodoos.setMatrixAt(k, m4);
        col.copy(strata[s % strata.length]).multiplyScalar(0.92 + Math.random() * 0.16);
        hoodoos.setColorAt(k++, col);
        y += hh * 0.97;
      }
      this._addShadow(x, z, r0 * 1.6);
      placed++;
    }
    hoodoos.count = k;
    this.group.add(hoodoos);
  },

  _scatter(count, makePos, place) {
    let placed = 0, guard = 0;
    while (placed < count && guard++ < count * 30) {
      const p = makePos();
      if (!p) continue;
      place(p, placed);
      placed++;
    }
    return placed;
  },

  /** The largest a stone at (x,z) may be without reaching the carriageway.
   *
   *  Scatter positions are measured along the normal at one sample, but on the
   *  inside of a bend the true distance to the road is much less than that —
   *  and then the boulder's own radius eats further in. Measured across the 21
   *  worlds, 313 solid stones reached onto the drivable road, the worst of them
   *  4.5 u inside a 9 u half-width: a rock parked in your lane, at up to 85 hull
   *  a hit. Stone is supposed to be brutal; it is not supposed to be unavoidable.
   *
   *  Returns 0 when the spot is too close to carry a stone at all — the caller
   *  must then place nothing, because a boulder you can see and drive through
   *  breaks the Law of Solidity just as badly.
   */
  _stoneFit(x, z, want) {
    const room = this._distToTrack(x, z) - (ROAD_HALF + 2.4);
    return room <= 0.4 ? 0 : Math.min(want, room);
  },

  /** Does a stone of radius r at (x,z) stay out of the road AS IT IS THERE?
   *
   *  `_stoneFit` measures against the nominal half-width, which is right for the
   *  open scatter but wrong for the deliberate edge furniture — a kerb marking a
   *  pinch is supposed to sit close. This asks the sharper question: how wide is
   *  the road at the point nearest this stone, and does the stone clear it?
   *
   *  It is the difference that matters on a hairpin. A block placed along one
   *  sample's normal is fine at that sample and inside the road two samples
   *  later, where the centreline has swung under it. */
  _clearsRoad(x, z, r, margin = 1.2) {
    _clearV.set(x, 0, z);
    const i = this.nearestIndex(_clearV);          // no hint: search the whole lap
    const half = this.widthAt ? this.widthAt(i) : ROAD_HALF;
    return this._distToTrack(x, z) - r >= half + margin;
  },

  _trackSidePos(minD, maxD) {
    const i = (Math.random() * N) | 0;
    const side = Math.random() < 0.5 ? 1 : -1;
    const dist = minD + Math.random() * (maxD - minD);
    const x = this.center[i].x + this.nrm[i].x * side * dist;
    const z = this.center[i].z + this.nrm[i].z * side * dist;
    if (this._distToTrack(x, z) < minD - 1) return null;
    if (this._underwater(x, z)) return null;
    return { x, z };
  },

  /** Trackside position restricted to one stretch of the lap. `zone` is a pair
   *  of lap fractions; f0 > f1 wraps through the start line. */
  _zonePos(zone, minD, maxD) {
    const [f0, f1] = zone;
    const span = (f1 - f0 + 1) % 1 || 1;
    const i = (((f0 + Math.random() * span) % 1) * N) | 0;
    const side = Math.random() < 0.5 ? 1 : -1;
    const dist = minD + Math.random() * (maxD - minD);
    const x = this.center[i].x + this.nrm[i].x * side * dist;
    const z = this.center[i].z + this.nrm[i].z * side * dist;
    if (this._distToTrack(x, z) < minD - 1) return null;
    return { x, z };
  },

  /** treeAltFade [y0, y1]: roll a trunk against the local ground height so a
   *  stand thins out with altitude — a mountain pass climbs out of its forest
   *  into bare rock exactly the way a real one does. True when there is no
   *  fade configured for the theme. */
  _altOK(x, z) {
    const fade = this.T.treeAltFade;
    if (!fade) return true;
    return Math.random() > THREE.MathUtils.smoothstep(this.terrainHeight(x, z), fade[0], fade[1]);
  },

  _buildForest(m4) {
    const T = this.T;
    if (T.vegetation === 'none' || !T.treeCount) return;
    if (T.vegetation === 'cactus') return this._buildCacti(m4);
    if (T.vegetation === 'outback') return this._buildOutbackScrub(m4);
    if (T.vegetation === 'charred') return this._buildCharredTrees(m4);
    if (T.vegetation === 'jungle') return this._buildJungleTrees(m4);
    if (T.vegetation === 'palm') return this._buildPalms(m4);
    if (T.vegetation === 'redwood') return this._buildRedwoods(m4);
    if (T.vegetation === 'burnt') return this._buildBurntForest(m4);
    if (T.vegetation === 'olive') return this._buildOliveGrove(m4);
    const COUNT = T.treeCount;
    const trunkGeo = new THREE.CylinderGeometry(0.35, 0.5, 2.4, 7);
    trunkGeo.translate(0, 1.2, 0);
    const trunkMat = new THREE.MeshStandardMaterial({ color: T.trunkColor, roughness: 1 });
    const lowMat = new THREE.MeshStandardMaterial({ color: T.foliageLow, flatShading: true, roughness: 1 });
    const topMat = new THREE.MeshStandardMaterial({ color: T.foliageTop, flatShading: true, roughness: 1 });
    const capMat = T.treeSnowCap
      ? new THREE.MeshStandardMaterial({ color: 0xf2f6fa, flatShading: true, roughness: 0.9 })
      : null;
    // A REAL MIXED STAND: several visually distinct species per world, not one
    // silhouette with hue jitter. Which species and in what ratio comes from
    // T.floraMix (or the per-theme FLORA_MIX default): conifers (two pine
    // silhouettes + sparse-tiered larch), deciduous (pale-trunked birch,
    // round-crowned oak) and winter bare birches. Every species is its own
    // set of InstancedMeshes — one draw call per part regardless of count.
    const capFor = (parts, capY) => {
      if (!capMat || capY == null) return;
      const capGeo = new THREE.ConeGeometry(1.3, 1.9, 8);
      capGeo.translate(0, capY, 0);
      parts.push(new THREE.InstancedMesh(capGeo, capMat, COUNT));
    };
    const mkParts = (trunk, tiers, capY) => {
      const parts = [new THREE.InstancedMesh(trunk[0], trunk[1], COUNT)];
      for (const [geoSpec, mat] of tiers) parts.push(new THREE.InstancedMesh(geoSpec, mat, COUNT));
      capFor(parts, capY);
      for (const part of parts) part.castShadow = true;
      return parts;
    };
    // --- conifers ---
    const lowA = new THREE.ConeGeometry(2.6, 4.2, 8);
    lowA.translate(0, 4.0, 0);
    const topA = new THREE.ConeGeometry(1.8, 3.4, 8);
    topA.translate(0, 6.6, 0);
    const lowB = new THREE.ConeGeometry(2.3, 3.4, 7);
    lowB.translate(0.2, 3.6, -0.12);
    const midB = new THREE.ConeGeometry(1.75, 2.9, 7);
    midB.translate(-0.16, 5.6, 0.12);
    const topB = new THREE.ConeGeometry(1.15, 2.6, 7);
    topB.translate(0.05, 7.4, -0.05);
    const larchTiers = [];
    for (const [r, y] of [[1.55, 3.3], [1.25, 4.9], [0.95, 6.3], [0.6, 7.6]]) {
      const tg = new THREE.ConeGeometry(r, 1.5, 7);      // sparse gappy tiers
      tg.translate(0, y, 0);
      larchTiers.push([tg, lowMat]);
    }
    // --- deciduous ---
    const birchTrunk = new THREE.CylinderGeometry(0.2, 0.28, 3.6, 6);
    birchTrunk.translate(0, 1.8, 0);
    const birchBark = new THREE.MeshStandardMaterial({ color: 0xe6e8e0, roughness: 0.9 });
    const birchCrown = new THREE.SphereGeometry(1.45, 7, 5);
    birchCrown.scale(1, 1.3, 1);
    birchCrown.translate(0, 4.7, 0);
    const birchTop = new THREE.SphereGeometry(0.85, 6, 5);
    birchTop.translate(0.15, 6.1, -0.1);
    const bareBranch = (rz, tx, ty2, tz) => {
      const bg = new THREE.ConeGeometry(0.09, 1.9, 5);
      bg.rotateZ(rz);
      bg.translate(tx, ty2, tz);
      return [bg, trunkMat];
    };
    const oakTrunk = new THREE.CylinderGeometry(0.42, 0.6, 2.7, 7);
    oakTrunk.translate(0, 1.35, 0);
    const oakDome = new THREE.SphereGeometry(2.35, 8, 6);
    oakDome.scale(1, 0.78, 1);
    oakDome.translate(0, 4.0, 0);
    const oakTop = new THREE.SphereGeometry(1.4, 7, 5);
    oakTop.translate(0.35, 5.5, 0.2);
    // --- rainforest ---
    // AMAZON RAPIDS was falling through to the default two-pine stand, so the
    // Amazon was planted with conifers. Three storeys instead, which is what
    // actually reads as rainforest from a car: a buttressed emergent standing
    // clear of everything, an umbrella-crowned mid-storey, and a low tree fern.
    const kapokTrunk = new THREE.CylinderGeometry(0.30, 0.72, 8.6, 7);
    kapokTrunk.translate(0, 4.3, 0);
    const kapokButtress = new THREE.ConeGeometry(1.25, 2.4, 6);   // flared root flare
    kapokButtress.translate(0, 1.2, 0);
    // emergents are flat-topped: the crown spreads sideways above the canopy
    const kapokCrown = new THREE.SphereGeometry(3.5, 9, 5);
    kapokCrown.scale(1, 0.42, 1);
    kapokCrown.translate(0, 9.1, 0);
    const kapokCrown2 = new THREE.SphereGeometry(2.2, 8, 5);
    kapokCrown2.scale(1, 0.5, 1);
    kapokCrown2.translate(0.9, 8.2, -0.6);
    const cecTrunk = new THREE.CylinderGeometry(0.20, 0.30, 5.4, 6);
    cecTrunk.translate(0, 2.7, 0);
    const cecCrown = new THREE.SphereGeometry(2.5, 8, 5);          // parasol
    cecCrown.scale(1, 0.5, 1);
    cecCrown.translate(0, 5.9, 0);
    const fernTrunk = new THREE.CylinderGeometry(0.16, 0.24, 1.9, 6);
    fernTrunk.translate(0, 0.95, 0);
    const fernFrond = new THREE.SphereGeometry(1.55, 7, 4);
    fernFrond.scale(1, 0.34, 1);
    fernFrond.translate(0, 2.35, 0);
    const SPECIES = {
      kapok: { parts: mkParts([kapokTrunk, trunkMat],
        [[kapokButtress, trunkMat], [kapokCrown, lowMat], [kapokCrown2, topMat]], null),
      kind: 'kapok', rFac: 1.25, solidAt: 1.0, tint: 'canopy', tiers: 3 },
      cecropia: { parts: mkParts([cecTrunk, trunkMat], [[cecCrown, lowMat]], null),
        kind: 'cecropia', rFac: 0.8, solidAt: 1.45, tint: 'canopy', tiers: 1 },
      treeFern: { parts: mkParts([fernTrunk, trunkMat], [[fernFrond, topMat]], null),
        kind: 'fern', rFac: 0.5, solidAt: null, tint: 'understorey', tiers: 1 },
      pineA: { parts: mkParts([trunkGeo, trunkMat], [[lowA, lowMat], [topA, topMat]], 7.35),
        kind: 'pine', rFac: 1.0, solidAt: 1.0, tint: 'conifer', tiers: 2 },
      pineB: { parts: mkParts([trunkGeo, trunkMat], [[lowB, lowMat], [midB, lowMat], [topB, topMat]], 8.15),
        kind: 'pine', rFac: 1.0, solidAt: 1.0, tint: 'conifer', tiers: 3 },
      larch: { parts: mkParts([trunkGeo, trunkMat], larchTiers, 8.3),
        kind: 'larch', rFac: 0.85, solidAt: null, tint: 'larch', tiers: 4 },
      birch: { parts: mkParts([birchTrunk, birchBark], [[birchCrown, lowMat], [birchTop, topMat]], null),
        kind: 'birch', rFac: 0.7, solidAt: null, tint: 'birch', tiers: 2 },
      birchBare: { parts: mkParts([birchTrunk, birchBark],
        [bareBranch(-0.85, 0.7, 3.4, 0), bareBranch(0.8, -0.6, 2.9, 0.1), bareBranch(-0.3, 0.15, 4.3, -0.4)], null),
        kind: 'birch', rFac: 0.55, solidAt: null, tint: 'bare', tiers: 3 },
      oak: { parts: mkParts([oakTrunk, trunkMat], [[oakDome, lowMat], [oakTop, topMat]], null),
        kind: 'oak', rFac: 1.15, solidAt: 1.35, tint: 'oak', tiers: 2 },
    };
    const mix = T.floraMix
      || FLORA_MIX[this.level && this.level.theme]
      || [['pineA', 0.55], ['pineB', 0.45]];
    const ks = {};
    for (const [name] of mix) ks[name] = 0;
    const pick = () => {
      let roll = Math.random(), acc = 0;
      for (const [name, wt] of mix) { acc += wt; if (roll < acc) return name; }
      return mix[mix.length - 1][0];
    };
    const color = new THREE.Color();
    const F = T.foliage;

    // A FOREST IS GROVES AND CLEARINGS, NOT CONFETTI. Uniform scatter reads
    // as texture; the reference reads as PLACE because trees clump into
    // stands with open ground between them. Same counts, same meshes, same
    // draws - only WHERE changes: grove centres are drawn once, most trees
    // pull toward their nearest grove, and a few clearing discs push
    // everything out entirely.
    const GROVES = [];
    {
      const nG = THREE.MathUtils.clamp(Math.round(COUNT / 50), 8, 16);
      const belt = T.treeBelt;
      for (let gI = 0; gI < nG; gI++) {
        const p2 = gI % 5 < 3
          // grove CENTRES stand well off the verge: a clump centred at 15 u
          // walls the chase camera in (measured at PINE VALLEY station 640)
          ? this._trackSidePos(34, (belt ? belt[1] : 46) + 26)
          : (() => {
              const a2 = Math.random() * Math.PI * 2;
              const r2 = 80 + Math.random() * 480;
              return { x: Math.cos(a2) * r2, z: Math.sin(a2) * r2 };
            })();
        if (p2) GROVES.push({ x: p2.x, z: p2.z, r: 26 + Math.random() * 30 });
      }
    }
    const CLEARINGS = [];
    for (let cI = 0; cI < 3 + ((Math.random() * 3) | 0); cI++) {
      const a2 = Math.random() * Math.PI * 2;
      const r2 = 90 + Math.random() * 420;
      CLEARINGS.push({ x: Math.cos(a2) * r2, z: Math.sin(a2) * r2,
        r: 30 + Math.random() * 25 });
    }
    const placed = this._scatter(COUNT,
      () => {
        let p;
        const belt = T.treeBelt;
        if (Math.random() < 0.62) p = this._trackSidePos(belt ? belt[0] : 15, belt ? belt[1] : 46);
        else {
          const a = Math.random() * Math.PI * 2;
          const r = 80 + Math.random() * 560;
          const x = Math.cos(a) * r, z = Math.sin(a) * r;
          p = this._distToTrack(x, z) < 14.5 ? null : { x, z };
        }
        if (!p) return null;
        // pull toward the nearest grove (70% of trees), and stay out of the
        // clearings - the pull keeps the tree on the same side of the road
        if (GROVES.length && Math.random() < 0.7) {
          let g2 = null, bd = 1e9;
          for (const G of GROVES) {
            const d2 = Math.hypot(G.x - p.x, G.z - p.z);
            if (d2 < bd) { bd = d2; g2 = G; }
          }
          if (g2 && bd > g2.r) {
            const pull = Math.min(0.75, (bd - g2.r) / bd);
            const nx2 = p.x + (g2.x - p.x) * pull, nz2 = p.z + (g2.z - p.z) * pull;
            // pulled trees keep a wider berth than loose scatter: a clump at
            // the 14.5 u line is a wall the camera lives inside
            if (this._distToTrack(nx2, nz2) > 20) { p = { x: nx2, z: nz2 }; }
          }
        }
        for (const cl of CLEARINGS) {
          if (Math.hypot(cl.x - p.x, cl.z - p.z) < cl.r) return null;
        }
        // the ring branch skips _trackSidePos and with it the underwater
        // check — on a coast world it was planting conifers IN the sea
        return p && !this._inWater(p.x, p.z) && !this._onQuayStrip(p.x, p.z)
          && this._altOK(p.x, p.z) ? p : null;
      },
      (p) => {
        const name = pick();
        const spec = SPECIES[name];
        const parts = spec.parts;
        const k = ks[name]++;
        // squared bias: a real stand is many modest trees and a few giants -
        // but giants live AWAY from the road, or a hero canopy parks itself
        // in front of the chase camera (measured: station 640 on PINE VALLEY
        // rendered the inside of a crown)
        const rr2 = Math.random();
        const dRoad2 = this._distToTrack(p.x, p.z);
        const sMax = dRoad2 < 26 ? 1.35 : 2.5;
        const s = Math.min(sMax, 0.6 + rr2 * rr2 * 1.9);
        const ty = this.terrainHeight(p.x, p.z) - 0.25;
        m4.makeScale(s, s * (0.85 + Math.random() * 0.45), s);
        m4.setPosition(p.x, ty, p.z);
        for (const part of parts) part.setMatrixAt(k, m4);
        this.trees.push({
          x: p.x, z: p.z, y: ty, r: spec.rFac * s, id: k, parts, kind: spec.kind, s,
          // explicit material law: true stops a car dead, false always yields
          solid: spec.solidAt != null && s >= spec.solidAt,
        });
        // per-tree foliage variation (themed hue band, shifted per species)
        switch (spec.tint) {
          case 'larch':   // paler, yellow-shifted soft needles
            color.setHSL(F.h - 0.045 + Math.random() * F.hVar, F.s * 0.85,
              Math.min(0.6, F.l + 0.10 + Math.random() * F.lVar)); break;
          case 'birch':   // light airy crown
            color.setHSL(F.h + 0.02 + Math.random() * F.hVar, F.s * 0.8,
              Math.min(0.62, F.l + 0.16 + Math.random() * F.lVar)); break;
          case 'oak':     // deep saturated dome
            color.setHSL(F.h + Math.random() * F.hVar, Math.min(1, F.s + 0.12),
              Math.max(0.16, F.l - 0.03 + Math.random() * F.lVar)); break;
          case 'canopy':  // rainforest broadleaf — deep, wet, slightly blue-green
            color.setHSL(F.h + 0.012 + Math.random() * F.hVar, Math.min(1, F.s + 0.16),
              Math.max(0.15, F.l - 0.01 + Math.random() * F.lVar)); break;
          case 'understorey': // ferns in the gloom: darker and more saturated
            color.setHSL(F.h + 0.02 + Math.random() * F.hVar, Math.min(1, F.s + 0.22),
              Math.max(0.11, F.l - 0.07 + Math.random() * F.lVar)); break;
          case 'bare':    // dark winter branches
            color.setHSL(0.07, 0.18, 0.16 + Math.random() * 0.08); break;
          default:
            color.setHSL(F.h + Math.random() * F.hVar, F.s + Math.random() * F.sVar,
              F.l + Math.random() * F.lVar);
        }
        // trunk: two wood tones, or near-white bark for the birches
        if (spec.tint === 'birch' || spec.tint === 'bare') {
          const bt = 0.92 + Math.random() * 0.14;
          parts[0].setColorAt(k, new THREE.Color(bt, bt, bt * 0.97));
        } else {
          const trunkTone = Math.random() < 0.5 ? 1.0 : 0.78;
          parts[0].setColorAt(k, new THREE.Color(trunkTone, trunkTone * 0.96, trunkTone * 0.9));
        }
        // crown tiers darken downward, brighten at the top (bare: branches)
        for (let ti = 1; ti <= spec.tiers; ti++) {
          const f = spec.tiers === 1 ? 1.2 : 0.85 + (ti - 1) / (spec.tiers - 1) * 0.45;
          parts[ti].setColorAt(k, color.clone().multiplyScalar(spec.tint === 'bare' ? 1 : f));
        }
        this._addShadow(p.x, p.z, 2.4 * spec.rFac * s);
      });
    for (const name of Object.keys(ks)) {
      for (const part of SPECIES[name].parts) part.count = ks[name];
      this.group.add(...SPECIES[name].parts);
    }
    // DECOR (no collision, < 0.5u tall): fallen logs and cut stumps scattered
    // through the stand so the forest floor reads lived-in
    if (placed > 20) this._buildForestFloorDecor(m4);
  },

  /** Instanced fallen logs + stumps among the trees. Pure decoration: nothing
   *  is pushed to trees/solids/obstacles, and everything stays low. */
  _buildForestFloorDecor(m4) {
    const T = this.T;
    const LOGS = Math.min(36, Math.max(10, (T.treeCount * 0.12) | 0));
    const STUMPS = Math.min(26, Math.max(8, (T.treeCount * 0.08) | 0));
    const q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
    const logGeo = new THREE.CylinderGeometry(0.26, 0.33, 2.8, 7);
    logGeo.rotateZ(Math.PI / 2);                    // lie along local X
    logGeo.translate(0, 0.26, 0);
    const stumpGeo = new THREE.CylinderGeometry(0.4, 0.5, 0.48, 7);
    stumpGeo.translate(0, 0.24, 0);
    const barkMat = new THREE.MeshStandardMaterial({ color: T.trunkColor, roughness: 1 });
    const cutMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(T.trunkColor).lerp(new THREE.Color(0xd8c090), 0.55), roughness: 0.95,
    });
    const logs = new THREE.InstancedMesh(logGeo, barkMat, LOGS);
    const stumps = new THREE.InstancedMesh(stumpGeo, [barkMat, cutMat, cutMat], STUMPS);
    const mossy = new THREE.Color(T.foliageLow);
    const col = new THREE.Color();
    let lk = 0;
    this._scatter(LOGS, () => this._trackSidePos(12.5, 42), (p) => {
      const s = 0.8 + Math.random() * 0.7;
      q.setFromAxisAngle(up, Math.random() * Math.PI * 2);
      m4.compose(
        new THREE.Vector3(p.x, this.terrainHeight(p.x, p.z) - 0.04, p.z),
        q, new THREE.Vector3(s, s * 0.9, s * 0.9)
      );
      logs.setMatrixAt(lk, m4);
      // some logs moss over toward the foliage tone
      col.setScalar(0.8 + Math.random() * 0.35);
      if (Math.random() < 0.4) col.lerp(mossy, 0.45);
      logs.setColorAt(lk++, col);
    });
    logs.count = lk;
    let sk = 0;
    // THE DISTANT STAND. Between the playfield scatter (out to ~640 u) and
    // the horizon rings (900 u+) there was an empty ring - the mid-distance
    // read as bare lawn on every wooded world, which is most of why the
    // scene lacked depth. One instanced 6-sided cone, 420 copies, tinted a
    // little toward the fog so the band reads as trees IN AIR.
    if (T.treeCount >= 150) {
      const bandGeo = new THREE.ConeGeometry(1, 1, 6);
      bandGeo.translate(0, 0.5, 0);
      const band = new THREE.InstancedMesh(bandGeo, new THREE.MeshStandardMaterial({
        color: 0xffffff, vertexColors: false, flatShading: true, roughness: 1,
      }), 420);
      const bandCol = new THREE.Color(), fogC2 = new THREE.Color(T.fogColor ?? 0xcccccc);
      const baseC2 = new THREE.Color(T.foliageLow ?? 0x2c6e2a);
      const bq = new THREE.Quaternion(), bup = new THREE.Vector3(0, 1, 0);
      let bk3 = 0;
      for (let k = 0; k < 900 && bk3 < 420; k++) {
        const hh = (n) => { const v = Math.sin((k + n) * 12.9898) * 43758.5453; return v - Math.floor(v); };
        const a2 = hh(0.1) * Math.PI * 2;
        const r2 = 640 + hh(1.7) * 260;
        const x2 = Math.cos(a2) * r2, z2 = Math.sin(a2) * r2;
        if (this._inWater(x2, z2)) continue;
        const gy2 = this.terrainHeight(x2, z2);
        const sw2 = 5 + hh(2.9) * 7, sh2 = 9 + hh(4.1) * 12;
        bq.setFromAxisAngle(bup, hh(5.3) * Math.PI);
        m4.compose(new THREE.Vector3(x2, gy2 - 0.4, z2), bq,
          new THREE.Vector3(sw2, sh2, sw2 * 0.9));
        band.setMatrixAt(bk3, m4);
        bandCol.copy(baseC2).multiplyScalar(0.75 + hh(6.7) * 0.4)
          .lerp(fogC2, 0.25 + hh(8.3) * 0.15);
        band.setColorAt(bk3++, bandCol);
      }
      band.count = bk3;
      if (band.instanceColor) band.instanceColor.needsUpdate = true;
      band.name = 'distant-stand';
      this.group.add(band);
    }

    this._scatter(STUMPS, () => this._trackSidePos(12, 34), (p) => {
      const s = 0.7 + Math.random() * 0.7;
      q.setFromAxisAngle(up, Math.random() * Math.PI * 2);
      m4.compose(
        new THREE.Vector3(p.x, this.terrainHeight(p.x, p.z) - 0.04, p.z),
        q, new THREE.Vector3(s, s, s)
      );
      stumps.setMatrixAt(sk++, m4);
    });
    stumps.count = sk;
    this.group.add(logs, stumps);
  },

  /** Canyon vegetation: instanced saguaros (capsule trunk + two elbow arms).
   *  Placed where they'll actually be seen: along the road inside the walls,
   *  up on the cliff rims, and around the open start bowl. */
  _buildCacti(m4) {
    const COUNT = this.T.treeCount;
    const trunkGeo = new THREE.CapsuleGeometry(0.5, 3.6, 4, 8);
    trunkGeo.translate(0, 2.3, 0);
    const armUpA = new THREE.CapsuleGeometry(0.3, 1.5, 4, 8);
    armUpA.translate(1.05, 3.5, 0);
    const armElbowA = new THREE.CapsuleGeometry(0.3, 0.9, 4, 8);
    armElbowA.rotateZ(Math.PI / 2);
    armElbowA.translate(0.6, 2.75, 0);
    const armUpB = new THREE.CapsuleGeometry(0.28, 1.1, 4, 8);
    armUpB.translate(-0.95, 3.0, 0);
    const armElbowB = new THREE.CapsuleGeometry(0.28, 0.75, 4, 8);
    armElbowB.rotateZ(Math.PI / 2);
    armElbowB.translate(-0.55, 2.4, 0);
    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true, roughness: 0.9 });
    const parts = [trunkGeo, armUpA, armElbowA, armUpB, armElbowB]
      .map((geoPart) => new THREE.InstancedMesh(geoPart, mat, COUNT));
    // DESERT FLORA MIX: saguaros plus two more species so the desert never
    // reads copy-pasted — squat ribbed BARREL cacti with a blossom crown, and
    // dry flat-topped ACACIA scrub. All of them yield to a car.
    const barrelBody = new THREE.CylinderGeometry(0.62, 0.78, 1.05, 9);
    barrelBody.translate(0, 0.55, 0);
    const barrelCrown = new THREE.SphereGeometry(0.3, 6, 5);
    barrelCrown.translate(0, 1.15, 0);
    const barrelParts = [
      new THREE.InstancedMesh(barrelBody, mat, COUNT),
      new THREE.InstancedMesh(barrelCrown,
        new THREE.MeshStandardMaterial({ color: 0xe89a4a, flatShading: true, roughness: 0.9 }), COUNT),
    ];
    const acTrunk = new THREE.CylinderGeometry(0.12, 0.22, 2.6, 6);
    acTrunk.rotateZ(0.16);
    acTrunk.translate(0, 1.3, 0);
    const acBough = new THREE.CylinderGeometry(0.08, 0.12, 1.4, 5);
    acBough.rotateZ(-0.8);
    acBough.translate(0.75, 2.2, 0);
    const acCrown = new THREE.SphereGeometry(1.9, 8, 4);
    acCrown.scale(1, 0.22, 1);
    acCrown.translate(0.35, 3.0, 0);
    const acaciaParts = [
      new THREE.InstancedMesh(acTrunk, new THREE.MeshStandardMaterial({ color: 0x6a5138, roughness: 1 }), COUNT),
      new THREE.InstancedMesh(acBough, new THREE.MeshStandardMaterial({ color: 0x6a5138, roughness: 1 }), COUNT),
      new THREE.InstancedMesh(acCrown,
        new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true, roughness: 1 }), COUNT),
    ];
    // TWO MORE SILHOUETTES, AND A TRIANGLE SAVING. A saguaro is 1,360 tris
    // (five 272-tri capsules); the agave and ocotillo below are ~60 each, so
    // shifting a fifth of the ground mix onto them CUTS the desert's triangle
    // count while adding the two shapes the mix lacked: a ground-hugging
    // spiked rosette and a splayed fan of whips.
    const agSkirtA = new THREE.ConeGeometry(1.25, 1.0, 7);
    agSkirtA.translate(0, 0.5, 0);
    const agSkirtB = new THREE.ConeGeometry(0.85, 1.4, 7);
    agSkirtB.rotateY(Math.PI / 7);                 // facets interleave: spikes
    agSkirtB.translate(0, 0.7, 0);
    const agStalk = new THREE.CylinderGeometry(0.09, 0.16, 3.4, 5);
    agStalk.translate(0, 1.7, 0);
    const agaveParts = [agSkirtA, agSkirtB, agStalk]
      .map((g2) => new THREE.InstancedMesh(g2, mat, COUNT));
    const ocParts = [];
    for (const [rz, rx] of [[0.30, 0.05], [-0.38, 0.12], [0.16, -0.34], [-0.12, 0.30]]) {
      const cane = new THREE.ConeGeometry(0.07, 3.4, 5);
      cane.translate(0, 1.7, 0);
      cane.rotateZ(rz); cane.rotateX(rx);
      ocParts.push(new THREE.InstancedMesh(cane, mat, COUNT));
    }
    for (const part of [...parts, ...barrelParts, ...acaciaParts,
      ...agaveParts, ...ocParts]) part.castShadow = true;
    const ks = { saguaro: 0, barrel: 0, acacia: 0, agave: 0, ocotillo: 0 };
    const q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
    const color = new THREE.Color();
    this._scatter(COUNT,
      () => {
        const roll = Math.random();
        const i = (Math.random() * N) | 0;
        const side = Math.random() < 0.5 ? 1 : -1;
        if (roll < 0.5) {
          // roadside, hugging the cliff base (small ones); dy is relative to road y
          return { i, lateral: side * (10.55 + Math.random() * 0.35), dy: 0, s: 0.5 + Math.random() * 0.35 };
        }
        if (roll < 0.8 && this.T.cliffWalls) {
          // silhouetted on the canyon rim (cliff heights are relative to road y)
          const prof = this._cliffProfile(i, side);
          if (prof.h < 7) return null;
          return {
            i, lateral: side * (prof.base + prof.l2 + 1 + Math.random() * 3.5),
            dy: prof.h * 0.97 - 0.35, s: 0.7 + Math.random() * 0.6,
          };
        }
        // open bowl around the start line — absolute terrain height
        const gi = ((Math.random() * 140 - 70 | 0) + N) % N;
        const lat = side * (13 + Math.random() * 22);
        return { i: gi, lateral: lat, terrain: true, s: 0.8 + Math.random() * 0.7 };
      },
      (spot, k) => {
        const p = this.pointAt(spot.i, spot.lateral);
        const y = spot.terrain ? this.terrainHeight(p.x, p.z) : p.y + spot.dy;
        // rim spots stay mostly saguaro (the skyline silhouette) with the odd
        // leaning ocotillo fan; ground spots run the full five-species mix
        const roll = spot.dy ? (Math.random() < 0.8 ? 0 : 0.99) : Math.random();
        const species = roll < 0.34 ? 'saguaro' : roll < 0.52 ? 'barrel'
          : roll < 0.66 ? 'acacia' : roll < 0.86 ? 'agave' : 'ocotillo';
        const sp = species === 'saguaro' ? parts : species === 'barrel' ? barrelParts
          : species === 'acacia' ? acaciaParts
          : species === 'agave' ? agaveParts : ocParts;
        const k2 = ks[species]++;
        const s = species === 'acacia' ? spot.s * 1.35 : spot.s;
        q.setFromAxisAngle(up, Math.random() * Math.PI * 2);
        m4.compose(
          new THREE.Vector3(p.x, y - 0.15, p.z),
          q, new THREE.Vector3(s, s * (0.9 + Math.random() * 0.3), s)
        );
        if (species === 'acacia') {
          color.setHSL(0.155 + Math.random() * 0.04, 0.32 + Math.random() * 0.12, 0.3 + Math.random() * 0.1);
        } else if (species === 'agave') {
          // glaucous blue-green, distinct from every other desert green
          color.setHSL(0.38 + Math.random() * 0.05, 0.18 + Math.random() * 0.08,
            0.32 + Math.random() * 0.10);
        } else if (species === 'ocotillo') {
          color.setHSL(0.09, 0.26 + Math.random() * 0.10, 0.28 + Math.random() * 0.08);
        } else {
          color.setHSL(0.30 + Math.random() * 0.06, 0.35 + Math.random() * 0.15, 0.22 + Math.random() * 0.12);
        }
        for (const part of sp) {
          part.setMatrixAt(k2, m4);
          part.setColorAt(k2, color);
        }
        this.trees.push({
          x: p.x, z: p.z, y: y - 0.15, id: k2, parts: sp, s,
          r: (species === 'barrel' ? 0.6 : species === 'agave' ? 0.55 : 0.75) * s,
          kind: species === 'acacia' ? 'acacia' : 'cactus',
          solid: false,                                  // desert scrub always yields
        });
        this._addShadow(p.x, p.z, 1.6 * s, spot.terrain ? null : y - 0.15);
      });
    for (const part of parts) { part.count = ks.saguaro; this.group.add(part); }
    for (const part of barrelParts) { part.count = ks.barrel; this.group.add(part); }
    for (const part of acaciaParts) { part.count = ks.acacia; this.group.add(part); }
    for (const part of agaveParts) { part.count = ks.agave; this.group.add(part); }
    for (const part of ocParts) { part.count = ks.ocotillo; this.group.add(part); }
  },

  /** OUTBACK RED DIRT vegetation (Bible 3.10 flora table). Three species, and
   *  the reason this is its own builder rather than a floraMix over the
   *  conifer stand is that the region's readability rule is a PLACEMENT rule,
   *  not a palette one:
   *
   *    RIVER RED GUM (tier 4, 16–24 m, pale cream fluted trunk, broad open
   *      crown) grows ONLY on the creek lines. The Bible is explicit that this
   *      is a deliberate readability device and must be preserved: on a plain
   *      where you can see 350 m, a line of big pale trunks running away from
   *      the road IS the sign that says "creek, 200 m". So the gums are placed
   *      off `this.creeks[].line` — the same polylines the beds are drawn from
   *      — and the few that are not on a creek are the odd survivor.
   *    DESERT OAK (tier 4, 8–12 m) — a dark, narrow, drooping cone. It is the
   *      only vertical silhouette out on the open gibber, and it reads at
   *      distance because it is the one thing darker than the ground.
   *    MULGA (tier 3, 4–7 m) — low grey-green multi-stem acacia scrub, the
   *      bulk of the count, and it always yields.
   *
   *  Weights follow the Bible's table renormalised over the three woody tiers
   *  (0.12 gum / 0.10 oak / 0.18 mulga → 0.30 / 0.25 / 0.45); the tier-0/1
   *  species in that table (spinifex, saltbush, dry grass) are the tuft and
   *  understorey layers, not trees. */
  _buildOutbackScrub(m4) {
    const T = this.T;
    const COUNT = T.treeCount;

    // --- river red gum: short fat pale trunk, limbs that FORK OUT wide, and
    // three overlapping crown lobes low over them. The first cut put two flat
    // discs on a tall bare pole and every one of them read as a mushroom: a
    // gum is nearly as wide as it is tall and the crown starts low. ---
    const gumTrunk = new THREE.CylinderGeometry(0.55, 0.95, 3.6, 8);
    gumTrunk.translate(0, 1.8, 0);
    const gumLimbA = new THREE.CylinderGeometry(0.2, 0.42, 3.6, 6);
    gumLimbA.rotateZ(-0.72);
    gumLimbA.translate(1.25, 4.4, 0.15);
    const gumLimbB = new THREE.CylinderGeometry(0.18, 0.4, 3.3, 6);
    gumLimbB.rotateZ(0.78);
    gumLimbB.translate(-1.2, 4.2, -0.25);
    const gumCrownA = new THREE.SphereGeometry(2.6, 8, 6);
    gumCrownA.scale(1, 0.78, 1);
    gumCrownA.translate(1.85, 6.0, 0.3);
    const gumCrownB = new THREE.SphereGeometry(2.3, 8, 6);
    gumCrownB.scale(1, 0.8, 1);
    gumCrownB.translate(-1.75, 5.6, -0.5);
    const gumCrownC = new THREE.SphereGeometry(2.0, 8, 6);
    gumCrownC.scale(1, 0.85, 1);
    gumCrownC.translate(0.1, 6.6, -0.1);
    const barkMat = new THREE.MeshStandardMaterial({ color: T.trunkColor, roughness: 0.95 });
    const gumLeafMat = new THREE.MeshStandardMaterial({
      color: 0xffffff, flatShading: true, roughness: 1,
    });
    const gumParts = [
      new THREE.InstancedMesh(gumTrunk, barkMat, COUNT),
      new THREE.InstancedMesh(gumLimbA, barkMat, COUNT),
      new THREE.InstancedMesh(gumLimbB, barkMat, COUNT),
      new THREE.InstancedMesh(gumCrownA, gumLeafMat, COUNT),
      new THREE.InstancedMesh(gumCrownB, gumLeafMat, COUNT),
      new THREE.InstancedMesh(gumCrownC, gumLeafMat, COUNT),
    ];

    // --- desert oak: a bare dark pole carrying a narrow shaggy column of
    // drooping needles. NOT a conifer triangle — the first cut used a wide
    // cone and the plain came out planted with pine trees. The silhouette is
    // narrow (r ~ 1.05 against 6 u of height) and the inverted lower cone
    // gives the sheoak's characteristic hanging skirt. ---
    const oakTrunkGeo = new THREE.CylinderGeometry(0.18, 0.34, 3.6, 6);
    oakTrunkGeo.translate(0, 1.8, 0);
    const oakCone = new THREE.ConeGeometry(1.05, 4.0, 7);
    oakCone.translate(0, 6.0, 0);
    const oakSkirt = new THREE.ConeGeometry(1.15, 3.0, 7);
    oakSkirt.rotateX(Math.PI);                          // inverted: the droop
    oakSkirt.translate(0, 4.4, 0);
    const oakBarkMat = new THREE.MeshStandardMaterial({ color: 0x5e4c3a, roughness: 1 });
    const oakLeafMat = new THREE.MeshStandardMaterial({
      color: 0xffffff, flatShading: true, roughness: 1,
    });
    const oakParts = [
      new THREE.InstancedMesh(oakTrunkGeo, oakBarkMat, COUNT),
      new THREE.InstancedMesh(oakCone, oakLeafMat, COUNT),
      new THREE.InstancedMesh(oakSkirt, oakLeafMat, COUNT),
    ];

    // --- mulga: three leaning stems under a flat grey-green pad ---
    const mulgaStems = [];
    for (let s = 0; s < 3; s++) {
      const st = new THREE.CylinderGeometry(0.07, 0.15, 2.1, 5);
      st.rotateZ((s - 1) * 0.24);
      st.rotateY(s * 2.1);
      st.translate((s - 1) * 0.26, 1.05, (s - 1) * 0.14);
      mulgaStems.push(st);
    }
    const mulgaPad = new THREE.SphereGeometry(1.5, 7, 4);
    mulgaPad.scale(1, 0.34, 1);
    mulgaPad.translate(0, 2.35, 0);
    const mulgaBarkMat = new THREE.MeshStandardMaterial({ color: 0x6a5b48, roughness: 1 });
    const mulgaLeafMat = new THREE.MeshStandardMaterial({
      color: 0xffffff, flatShading: true, roughness: 1,
    });
    const mulgaParts = [
      ...mulgaStems.map((g) => new THREE.InstancedMesh(g, mulgaBarkMat, COUNT)),
      new THREE.InstancedMesh(mulgaPad, mulgaLeafMat, COUNT),
    ];

    for (const part of [...gumParts, ...oakParts, ...mulgaParts]) part.castShadow = true;

    // every creek wash point, flattened, as the gum planting list
    const washPts = [];
    for (const ck of (this.creeks ?? [])) {
      for (const line of ck.line) for (let s = 1; s < line.length; s++) washPts.push(line[s]);
    }
    const ks = { gum: 0, oak: 0, mulga: 0 };
    const q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
    const color = new THREE.Color();
    const F = T.foliage;

    this._scatter(COUNT,
      () => {
        const roll = Math.random();
        // 0.30 of the stand is gum, and 5 in 6 of those stand on a creek
        if (roll < 0.30 && washPts.length && Math.random() < 0.84) {
          const w = washPts[(Math.random() * washPts.length) | 0];
          const a = Math.random() * Math.PI * 2;
          const r = w.w * (0.55 + Math.random() * 0.8);
          const x = w.x + Math.cos(a) * r, z = w.z + Math.sin(a) * r;
          // a gum is a BIG tree: it needs real room off the carriageway
          if (this._distToTrack(x, z) < 17) return null;
          return { x, z, sp: 'gum' };
        }
        const sp = roll < 0.30 ? 'gum' : roll < 0.55 ? 'oak' : 'mulga';
        const near = sp === 'mulga' ? 13 : 17;
        const p = Math.random() < 0.55
          ? this._trackSidePos(near, 52)
          : (() => {
            const a = Math.random() * Math.PI * 2;
            const r = 90 + Math.random() * 520;
            return { x: Math.cos(a) * r, z: Math.sin(a) * r };
          })();
        if (!p || this._distToTrack(p.x, p.z) < near) return null;
        return { x: p.x, z: p.z, sp };
      },
      (p) => {
        const sp = p.sp;
        const parts = sp === 'gum' ? gumParts : sp === 'oak' ? oakParts : mulgaParts;
        const k = ks[sp]++;
        const s = sp === 'gum' ? 0.9 + Math.random() * 0.85
          : sp === 'oak' ? 0.8 + Math.random() * 0.6
            : 0.7 + Math.random() * 0.9;
        const ty = this.terrainHeight(p.x, p.z) - 0.2;
        q.setFromAxisAngle(up, Math.random() * Math.PI * 2);
        m4.compose(new THREE.Vector3(p.x, ty, p.z), q,
          new THREE.Vector3(s, s * (0.88 + Math.random() * 0.36), s));
        // grey-green, always: R02 caps foliage saturation and the region's
        // negative list forbids green ground cover outright
        color.setHSL(
          F.h + Math.random() * F.hVar - (sp === 'oak' ? 0.02 : 0),
          (F.s + Math.random() * F.sVar) * (sp === 'mulga' ? 0.8 : 1),
          F.l + Math.random() * F.lVar - (sp === 'oak' ? 0.13 : sp === 'mulga' ? 0.02 : 0)
        );
        for (const part of parts) {
          part.setMatrixAt(k, m4);
          part.setColorAt(k, color);
        }
        this.trees.push({
          x: p.x, z: p.z, y: ty, id: k, parts, s, kind: sp,
          r: (sp === 'gum' ? 0.95 : sp === 'oak' ? 0.6 : 0.7) * s,
          // material law: only a full-grown red gum is a tree that stops a car.
          // The oaks and the mulga are scrub and always yield.
          solid: sp === 'gum' && s >= 1.15,
        });
        this._addShadow(p.x, p.z, (sp === 'gum' ? 3.2 : sp === 'oak' ? 1.5 : 1.4) * s);
      });
    for (const part of gumParts) { part.count = ks.gum; this.group.add(part); }
    for (const part of oakParts) { part.count = ks.oak; this.group.add(part); }
    for (const part of mulgaParts) { part.count = ks.mulga; this.group.add(part); }
  },

  /** Volcano vegetation: nothing green survives a lava field, so the "flora"
   *  is two stages of the same death — tall bare SNAGS with a few thin dark
   *  branches still attached, and squat broken STUMPS the ash has buried to
   *  the shoulder. Both are BREAKABLE (kind 'snag'), both jitter in scale and
   *  in how far the char has bleached them. */
  _buildCharredTrees(m4) {
    const COUNT = this.T.treeCount;
    const trunkGeo = new THREE.CylinderGeometry(0.13, 0.34, 4.8, 6);
    trunkGeo.translate(0, 2.4, 0);
    const b1 = new THREE.ConeGeometry(0.1, 2.0, 5);
    b1.rotateZ(-0.95);
    b1.translate(0.62, 3.2, 0);
    const b2 = new THREE.ConeGeometry(0.09, 1.6, 5);
    b2.rotateZ(0.85);
    b2.translate(-0.55, 2.6, 0.1);
    const b3 = new THREE.ConeGeometry(0.08, 1.4, 5);
    b3.rotateX(0.9);
    b3.translate(0, 3.7, 0.5);
    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true, roughness: 1 });
    const parts = [trunkGeo, b1, b2, b3].map((geoPart) => new THREE.InstancedMesh(geoPart, mat, COUNT));
    // stump: a snapped-off trunk with a jagged shoulder, half-buried in ash
    const stTrunk = new THREE.CylinderGeometry(0.34, 0.6, 1.5, 6);
    stTrunk.translate(0, 0.75, 0);
    const stShard = new THREE.ConeGeometry(0.2, 0.9, 4);
    stShard.rotateZ(0.22);
    stShard.translate(0.16, 1.7, 0);
    const stRoot = new THREE.CylinderGeometry(0.62, 0.95, 0.36, 6);
    stRoot.translate(0, 0.18, 0);
    const stumpParts = [stTrunk, stShard, stRoot]
      .map((geoPart) => new THREE.InstancedMesh(geoPart, mat, COUNT));
    for (const part of [...parts, ...stumpParts]) part.castShadow = true;
    const q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
    const color = new THREE.Color();
    let snags = 0, stumps = 0;
    this._scatter(COUNT,
      () => {
        if (Math.random() < 0.62) return this._trackSidePos(15, 46);
        const a = Math.random() * Math.PI * 2;
        const r = 80 + Math.random() * 560;
        const x = Math.cos(a) * r, z = Math.sin(a) * r;
        if (this._distToTrack(x, z) < 14.5) return null;
        return { x, z };
      },
      (p) => {
        // 70 % standing snags, 30 % snapped stumps
        const stump = Math.random() < 0.3;
        const sp = stump ? stumpParts : parts;
        const k = stump ? stumps++ : snags++;
        const s = stump ? 0.8 + Math.random() * 0.9 : 0.7 + Math.random() * 1.1;
        const ty = this.terrainHeight(p.x, p.z) - 0.2;
        q.setFromAxisAngle(up, Math.random() * Math.PI * 2);
        m4.compose(
          new THREE.Vector3(p.x, ty, p.z),
          q, new THREE.Vector3(s, s * (0.8 + Math.random() * 0.5), s)
        );
        // char jitter: from soot-black to ash-dusted grey (stumps sit in the
        // fallout so they run a touch greyer, never brighter than the field)
        color.setHSL(0.06 + Math.random() * 0.03,
          (0.12 + Math.random() * 0.1) * (stump ? 0.6 : 1),
          (stump ? 0.06 : 0.08) + Math.random() * 0.06);
        for (const part of sp) {
          part.setMatrixAt(k, m4);
          part.setColorAt(k, color);
        }
        this.trees.push({
          x: p.x, z: p.z, y: ty, r: (stump ? 0.6 : 0.45) * s, id: k, parts: sp,
          kind: 'snag', s, solid: false,
        });
        this._addShadow(p.x, p.z, (stump ? 1.0 : 1.2) * s);
      });
    for (const part of parts) { part.count = snags; this.group.add(part); }
    for (const part of stumpParts) { part.count = stumps; this.group.add(part); }
  },

  /** Jungle canopy — TROPICAL SPECIES ONLY. There is not one conifer anywhere
   *  on a jungle world: no cone-and-trunk pine geometry is built here and the
   *  theme never reaches the default `_buildForest` stand.
   *
   *  Four canopy species plus undergrowth, each with scale and colour jitter:
   *    KAPOK      emergent — pale buttressed trunk, broad flat plate crown,
   *               liana strands hanging off it. SOLID at full scale.
   *    BROADLEAF  mid-story — short trunk, rounded stacked crowns. Yields.
   *    PALM       tall bare stem under a fan of drooping fronds. Yields.
   *    TREEFERN   squat fibrous trunk under an arching frond rosette. Yields.
   *  plus banana-ish giant-leaf plants fanning out along the verges.
   *  Everything except the full-grown kapoks sets solid:false, which is what
   *  vehicles.js reads (`tr.solid`) to decide whether a car fells it. */
  _buildJungleTrees(m4) {
    const T = this.T;
    const COUNT = T.treeCount;
    const trunkMat = new THREE.MeshStandardMaterial({ color: T.trunkColor, roughness: 1 });
    const canMatLow = new THREE.MeshStandardMaterial({ color: T.foliageLow, flatShading: true, roughness: 1 });
    const canMatTop = new THREE.MeshStandardMaterial({ color: T.foliageTop, flatShading: true, roughness: 1 });
    // kapok: tall trunk, flared buttress base, wide plate crown + side domes
    const kTrunk = new THREE.CylinderGeometry(0.26, 0.4, 7.0, 7);
    kTrunk.translate(0, 3.5, 0);
    const kButtress = new THREE.CylinderGeometry(0.62, 1.05, 1.5, 7);
    kButtress.translate(0, 0.75, 0);
    const kCrown = new THREE.SphereGeometry(3.6, 8, 5);
    kCrown.scale(1, 0.34, 1);
    kCrown.translate(0, 7.3, 0);
    const kDomeA = new THREE.SphereGeometry(2.0, 7, 5);
    kDomeA.scale(1, 0.42, 1);
    kDomeA.translate(1.9, 6.8, 0.6);
    const kDomeB = new THREE.SphereGeometry(1.7, 7, 5);
    kDomeB.scale(1, 0.45, 1);
    kDomeB.translate(-1.8, 6.9, -0.5);
    // lianas: three thin strands dangling from the kapok crown — the single
    // most tropical read there is, and free (they ride the same instance)
    const vineMat = new THREE.MeshStandardMaterial({ color: 0x3e6b2c, roughness: 1 });
    // every strand must hang from somewhere: keep them inside the crown plate
    // footprint (radius 3.6) or they read as sticks floating in mid-air
    const vineGeos = [[2.4, 3.4, 1.2], [-2.2, 2.6, -1.0], [0.9, 3.0, -2.4]]
      .map(([vx, vlen, vz]) => {
        const v = new THREE.CylinderGeometry(0.055, 0.045, vlen, 4);
        v.translate(vx, 6.9 - vlen / 2, vz);
        return v;
      });
    const kapokParts = [
      new THREE.InstancedMesh(kTrunk, trunkMat, COUNT),
      new THREE.InstancedMesh(kButtress, trunkMat, COUNT),
      new THREE.InstancedMesh(kCrown, canMatLow, COUNT),
      new THREE.InstancedMesh(kDomeA, canMatLow, COUNT),
      new THREE.InstancedMesh(kDomeB, canMatTop, COUNT),
      ...vineGeos.map((v) => new THREE.InstancedMesh(v, vineMat, COUNT)),
    ];
    // broadleaf: short trunk, two rounded stacked crowns
    const bTrunk = new THREE.CylinderGeometry(0.24, 0.36, 4.2, 7);
    bTrunk.translate(0, 2.1, 0);
    const bCrown = new THREE.SphereGeometry(2.45, 8, 6);
    bCrown.scale(1, 0.72, 1);
    bCrown.translate(0, 4.7, 0);
    const bTop = new THREE.SphereGeometry(1.5, 7, 5);
    bTop.scale(1, 0.75, 1);
    bTop.translate(0.4, 6.0, 0.3);
    const broadParts = [
      new THREE.InstancedMesh(bTrunk, trunkMat, COUNT),
      new THREE.InstancedMesh(bCrown, canMatLow, COUNT),
      new THREE.InstancedMesh(bTop, canMatTop, COUNT),
    ];
    // rainforest palm: slim bare stem, 7 drooping fronds, a nut cluster
    const pTrunk = new THREE.CylinderGeometry(0.15, 0.28, 6.2, 6);
    pTrunk.translate(0, 3.1, 0);
    const palmGeos = [pTrunk];
    for (let li = 0; li < 7; li++) {
      const fr = new THREE.ConeGeometry(0.46, 3.3, 4);
      fr.rotateZ(-Math.PI / 2);                          // axis → +x
      fr.translate(1.6, 0, 0);
      fr.scale(1, 0.2, 0.68);                            // flattened frond
      fr.rotateZ(-0.30 - (li % 2) * 0.26);               // droop, alternating
      fr.rotateY(li * (Math.PI * 2 / 7) + 0.4);
      fr.translate(0, 6.15, 0);
      palmGeos.push(fr);
    }
    const pNut = new THREE.SphereGeometry(0.2, 6, 5);
    pNut.translate(0.26, 5.85, 0.16);
    const palmParts = [
      new THREE.InstancedMesh(pTrunk, trunkMat, COUNT),
      ...palmGeos.slice(1).map((fr) => new THREE.InstancedMesh(fr, canMatTop, COUNT)),
      new THREE.InstancedMesh(pNut, new THREE.MeshStandardMaterial({ color: 0x6a4a26, roughness: 1 }), COUNT),
    ];
    // tree fern: squat fibrous trunk under an arching frond rosette
    const fTrunk = new THREE.CylinderGeometry(0.2, 0.34, 2.0, 6);
    fTrunk.translate(0, 1.0, 0);
    const fernParts = [new THREE.InstancedMesh(fTrunk, trunkMat, COUNT)];
    for (let li = 0; li < 6; li++) {
      const fr = new THREE.BoxGeometry(0.34, 0.06, 2.2);
      fr.translate(0, 0, 1.25);
      fr.rotateX(-0.5 - (li % 2) * 0.2);                 // arch up then over
      fr.rotateY(li * (Math.PI * 2 / 6) + 0.25);
      fr.translate(0, 2.05, 0);
      fernParts.push(new THREE.InstancedMesh(fr, canMatLow, COUNT));
    }
    for (const part of [...kapokParts, ...broadParts, ...palmParts, ...fernParts]) {
      part.castShadow = true;
    }
    const color = new THREE.Color();
    const F = T.foliage;
    const ks = { kapok: 0, broad: 0, palm: 0, fern: 0 };
    // species table: [name, parts, colour-tinted part indices, radius, scale range]
    const SPECIES = [
      ['kapok', kapokParts, [2, 3, 4], 1.0, [0.9, 1.1]],
      ['broadleaf', broadParts, [1, 2], 0.8, [0.7, 0.8]],
      ['palm', palmParts, palmParts.map((_, pi) => pi).slice(1, -1), 0.55, [0.85, 0.6]],
      ['treefern', fernParts, fernParts.map((_, pi) => pi).slice(1), 0.5, [0.6, 0.5]],
    ];
    const SLOT = { kapok: 'kapok', broadleaf: 'broad', palm: 'palm', treefern: 'fern' };
    this._scatter(COUNT,
      () => {
        // denser and closer than the pine forests: a real green wall
        if (Math.random() < 0.7) return this._trackSidePos(13.5, 40);
        const a = Math.random() * Math.PI * 2;
        const r = 60 + Math.random() * 480;
        const x = Math.cos(a) * r, z = Math.sin(a) * r;
        if (this._distToTrack(x, z) < 13) return null;
        return { x, z };
      },
      (p) => {
        // 40 % emergent kapok, 25 % broadleaf, 20 % palm, 15 % tree fern
        const roll = Math.random();
        const sp = SPECIES[roll < 0.40 ? 0 : roll < 0.65 ? 1 : roll < 0.85 ? 2 : 3];
        const [kind, parts, tintIdx, rad, [s0, sVar]] = sp;
        const k = ks[SLOT[kind]]++;
        const s = s0 + Math.random() * sVar;
        const ty = this.terrainHeight(p.x, p.z) - 0.25;
        m4.makeScale(s, s * (0.85 + Math.random() * 0.4), s);
        m4.setPosition(p.x, ty, p.z);
        for (const part of parts) part.setMatrixAt(k, m4);
        this.trees.push({
          x: p.x, z: p.z, y: ty, r: rad * s, id: k, parts, kind, s,
          // kapok emergents at full growth stop a car; everything else yields
          solid: kind === 'kapok' && s >= 1.0,
        });
        color.setHSL(
          F.h + Math.random() * F.hVar,
          F.s + Math.random() * F.sVar,
          F.l + Math.random() * F.lVar
        );
        // per-instance tint, brightening toward the top of the canopy
        for (let ti = 0; ti < tintIdx.length; ti++) {
          parts[tintIdx[ti]].setColorAt(k,
            color.clone().multiplyScalar(0.85 + (ti / Math.max(1, tintIdx.length - 1)) * 0.4));
        }
        this._addShadow(p.x, p.z, (kind === 'kapok' ? 3.0 : kind === 'broadleaf' ? 2.4 : 1.8) * s);
      });
    for (const [kind, parts] of SPECIES) for (const part of parts) part.count = ks[SLOT[kind]];
    this.group.add(...kapokParts, ...broadParts, ...palmParts, ...fernParts);

    // giant-leaf plants near the road: 5 flat stretched leaves fanned from a base
    const PLANTS = 90;
    const leafMat = new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true, roughness: 0.85 });
    const leafParts = [];
    for (let li = 0; li < 5; li++) {
      const leaf = new THREE.BoxGeometry(0.55, 0.07, 2.3);
      leaf.translate(0, 0, 1.35);
      leaf.rotateX(-0.42 - (li % 2) * 0.16);             // tips lifted, alternating droop
      leaf.rotateY(li * (Math.PI * 2 / 5) + 0.3);
      leaf.translate(0, 0.5, 0);
      leafParts.push(new THREE.InstancedMesh(leaf, leafMat, PLANTS));
    }
    const q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
    const pPlaced = this._scatter(PLANTS,
      () => this._trackSidePos(11.2, 17),
      (p, k) => {
        const s = 0.55 + Math.random() * 0.4;            // small → always smashable
        const py = this.terrainHeight(p.x, p.z) - 0.05;
        q.setFromAxisAngle(up, Math.random() * Math.PI * 2);
        m4.compose(
          new THREE.Vector3(p.x, py, p.z),
          q, new THREE.Vector3(s, s * (0.9 + Math.random() * 0.3), s)
        );
        color.setHSL(0.30 + Math.random() * 0.07, 0.5 + Math.random() * 0.2, 0.26 + Math.random() * 0.12);
        for (const part of leafParts) {
          part.setMatrixAt(k, m4);
          part.setColorAt(k, color);
        }
        this.trees.push({ x: p.x, z: p.z, y: py, r: 0.65 * s, id: k, parts: leafParts, kind: 'jungle', s, solid: s >= 1.1 });
      });
    for (const part of leafParts) { part.count = pPlaced; this.group.add(part); }
  },

  /** Desert palms — TWO species so an oasis never reads copy-pasted:
   *    DATE PALM  tall bare trunk under a fan crown of drooping fronds plus a
   *               fruit cluster (the skyline shape).
   *    DOUM PALM  squat, thicker, wider stiff fan with no fruit — the scrubby
   *               understory palm that grows in clumps at the water's edge.
   *  Both carry kind 'palm' (NOT 'pine') and solid:false, so cars always fell
   *  them. The oasis level packs most of its palms into one dense grove
   *  section of the lap (T.palmGrove = [fracA, fracB]); the dune level
   *  scatters them thin. */
  _buildPalms(m4) {
    const T = this.T;
    const COUNT = T.treeCount;
    const trunkGeo = new THREE.CylinderGeometry(0.16, 0.32, 5.4, 7);
    trunkGeo.translate(0, 2.7, 0);
    const partGeos = [trunkGeo];
    for (let li = 0; li < 6; li++) {
      const fr = new THREE.ConeGeometry(0.5, 3.1, 4);
      fr.rotateZ(-Math.PI / 2);                     // axis → +x
      fr.translate(1.5, 0, 0);
      fr.scale(1, 0.22, 0.72);                      // flattened frond
      fr.rotateZ(-0.36 - (li % 2) * 0.22);          // droop, alternating
      fr.rotateY(li * (Math.PI * 2 / 6) + 0.35);
      fr.translate(0, 5.35, 0);
      partGeos.push(fr);
    }
    const nutGeo = new THREE.SphereGeometry(0.22, 6, 5);
    nutGeo.translate(0.28, 5.05, 0.18);
    partGeos.push(nutGeo);
    const PALM_OWN = new THREE.Color(1, 1, 1);   // 'keep your own material colour'
    const trunkMat = new THREE.MeshStandardMaterial({ color: T.trunkColor, roughness: 1 });
    const frondMat = new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true, roughness: 0.9 });
    const nutMat = new THREE.MeshStandardMaterial({ color: 0x6a4a26, roughness: 1 });
    const parts = partGeos.map((geoPart, gi) => new THREE.InstancedMesh(
      geoPart, gi === 0 ? trunkMat : gi === partGeos.length - 1 ? nutMat : frondMat, COUNT
    ));
    // --- doum palm: short thick trunk, 8 stiff wide fans, no fruit ---
    const dTrunk = new THREE.CylinderGeometry(0.3, 0.46, 2.5, 7);
    dTrunk.translate(0, 1.25, 0);
    const doumGeos = [dTrunk];
    for (let li = 0; li < 8; li++) {
      const fr = new THREE.ConeGeometry(0.72, 2.4, 4);
      fr.rotateZ(-Math.PI / 2);
      fr.translate(1.15, 0, 0);
      fr.scale(1, 0.16, 0.9);                       // broad flat fan
      fr.rotateZ(-0.02 - (li % 3) * 0.2);           // near-horizontal, uneven
      fr.rotateY(li * (Math.PI * 2 / 8) + 0.2);
      fr.translate(0, 2.55, 0);
      doumGeos.push(fr);
    }
    const doumParts = doumGeos.map((geoPart, gi) => new THREE.InstancedMesh(
      geoPart, gi === 0 ? trunkMat : frondMat, COUNT
    ));
    for (const part of [...parts, ...doumParts]) part.castShadow = true;
    const q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
    const color = new THREE.Color();
    const F = T.foliage;
    const grove = T.palmGrove;
    let doums = 0, dates = 0;
    this._scatter(COUNT,
      () => {
        if (grove && Math.random() < 0.6) {
          // the hidden grove: dense stand along one stretch of the lap
          const i = ((grove[0] + Math.random() * (grove[1] - grove[0])) * N) | 0;
          const side = Math.random() < 0.5 ? 1 : -1;
          const p = this.pointAt(i % N, side * (12 + Math.random() * 26));
          if (this._distToTrack(p.x, p.z) < 11.5) return null;
          return { x: p.x, z: p.z };
        }
        if (Math.random() < 0.55) return this._trackSidePos(12, 42);
        const a = Math.random() * Math.PI * 2;
        const r = 70 + Math.random() * 480;
        const x = Math.cos(a) * r, z = Math.sin(a) * r;
        if (this._distToTrack(x, z) < 11.5) return null;
        return { x, z };
      },
      (p) => {
        // 68 % date palms (the skyline), 32 % squat doum clumps
        const doum = Math.random() < 0.32;
        const sp = doum ? doumParts : parts;
        const k = doum ? doums++ : dates++;
        const s = doum ? 0.75 + Math.random() * 0.6 : 0.8 + Math.random() * 0.75;
        const ty = this.terrainHeight(p.x, p.z) - 0.2;
        q.setFromAxisAngle(up, Math.random() * Math.PI * 2);
        m4.compose(
          new THREE.Vector3(p.x, ty, p.z),
          q, new THREE.Vector3(s, s * (0.9 + Math.random() * 0.35), s)
        );
        color.setHSL(
          F.h + Math.random() * F.hVar,
          // the doums run drier and duller than the fruiting date palms
          (F.s + Math.random() * F.sVar) * (doum ? 0.78 : 1),
          F.l + Math.random() * F.lVar
        );
        for (let pi = 0; pi < sp.length; pi++) {
          sp[pi].setMatrixAt(k, m4);
          // Only the FRONDS take the foliage tint. Instance colour multiplies
          // the material's, so tinting the brown trunk green rendered it
          // near-black - a grove of black poles under pale fans, reading as
          // TV aerials rather than palms.
          const own = pi === 0 || (!doum && pi === sp.length - 1);
          sp[pi].setColorAt(k, own ? PALM_OWN : color);
        }
        // NOT 'pine' → the material law lets any car snap a palm
        this.trees.push({
          x: p.x, z: p.z, y: ty, r: (doum ? 0.7 : 0.55) * s, id: k, parts: sp,
          kind: doum ? 'doum' : 'palm', s, solid: false,
        });
        this._addShadow(p.x, p.z, (doum ? 1.5 : 1.9) * s);
      });
    for (const part of parts) { part.count = dates; this.group.add(part); }
    for (const part of doumParts) { part.count = doums; this.group.add(part); }
  },

  /** MEDITERRANEAN TERRACE: olive country.
   *
   *  WHY A NEW BUILDER. Bible 3.6 names five silhouettes and none of them is in
   *  the game: the conifer builder is cones on a stick, the palm builder is
   *  fronds, and repainting either of them green-grey would have given this
   *  region the shape of a world it is not. What is here instead:
   *    ANCIENT OLIVE  short, fat, multi-stemmed, three overlapping silver
   *                   crowns — the tier-4 tree you actually remember.
   *    GROVE OLIVE    the small planted one, and the one that lands on the grid.
   *    CORK OAK       tall trunk with the bark stripped off the bottom two
   *                   metres, which is the ruddy band you see from the road.
   *    UMBRELLA PINE  bare trunk under a flat parasol, high and wide.
   *    CYPRESS        a thin dark column. It is the tallest vertical cue in the
   *                   region and it reads at the 140 m sight line (R06)
   *                   precisely BECAUSE it is a column and nothing else here is.
   *
   *  The other half of the identity is ORDER. Olives on a terrace are planted
   *  on a strict 7 m grid, so part of the stand snaps to a rotated 7 u lattice
   *  around a handful of grove anchors — geometric rows standing against the
   *  organic maquis, which is what tells you this hillside is farmed rather
   *  than wild. Cypresses are never scattered: they go in short straight lines,
   *  because in life they mark a driveway or a cemetery wall.
   *
   *  Nothing here is 'pine', so the material law lets a car fell the small
   *  stuff; the thick-trunked species carry solid colliders at full scale. */
  _buildOliveGrove(m4) {
    const T = this.T;
    const COUNT = T.treeCount;
    const trunkMat = new THREE.MeshStandardMaterial({ color: T.trunkColor, roughness: 1 });
    // stripped cork: the raw ruddy trunk under the harvested bark
    const corkMat = new THREE.MeshStandardMaterial({ color: 0x9c5a33, roughness: 1 });
    const lowMat = new THREE.MeshStandardMaterial({ color: T.foliageLow, flatShading: true, roughness: 1 });
    const topMat = new THREE.MeshStandardMaterial({ color: T.foliageTop, flatShading: true, roughness: 1 });

    // --- ancient olive: two leaning stems, three overlapping crowns ---
    const oTrunk = new THREE.CylinderGeometry(0.42, 0.78, 2.1, 7);
    oTrunk.translate(0, 1.05, 0);
    const oLimb = new THREE.CylinderGeometry(0.2, 0.34, 1.9, 6);
    oLimb.rotateZ(0.34);
    oLimb.translate(0.42, 1.5, 0.1);
    const oCrownA = new THREE.SphereGeometry(1.95, 7, 5);
    oCrownA.scale(1, 0.74, 1);
    oCrownA.translate(0, 3.5, 0);
    const oCrownB = new THREE.SphereGeometry(1.3, 6, 5);
    oCrownB.scale(1, 0.8, 1);
    oCrownB.translate(1.35, 3.1, 0.45);
    const oCrownC = new THREE.SphereGeometry(1.15, 6, 5);
    oCrownC.scale(1, 0.8, 1);
    oCrownC.translate(-1.2, 3.3, -0.5);
    // --- grove-row olive: the small planted one ---
    const gTrunk = new THREE.CylinderGeometry(0.16, 0.27, 1.5, 6);
    gTrunk.translate(0, 0.75, 0);
    const gCrown = new THREE.SphereGeometry(1.38, 7, 5);
    gCrown.scale(1, 0.86, 1);
    gCrown.translate(0, 2.45, 0);
    const gTop = new THREE.SphereGeometry(0.82, 6, 4);
    gTop.translate(0.3, 3.15, -0.2);
    // --- cork oak: stripped band low, broad dome high ---
    const cTrunk = new THREE.CylinderGeometry(0.3, 0.44, 4.4, 7);
    cTrunk.translate(0, 2.2, 0);
    const cStrip = new THREE.CylinderGeometry(0.46, 0.54, 1.9, 8);
    cStrip.translate(0, 0.95, 0);
    const cDome = new THREE.SphereGeometry(2.85, 8, 6);
    cDome.scale(1, 0.68, 1);
    cDome.translate(0, 5.5, 0);
    const cLobe = new THREE.SphereGeometry(1.75, 7, 5);
    cLobe.scale(1, 0.7, 1);
    cLobe.translate(1.55, 4.9, 0.6);
    // --- umbrella pine: bare trunk, flat parasol ---
    const uTrunk = new THREE.CylinderGeometry(0.26, 0.44, 8.1, 7);
    uTrunk.translate(0, 4.05, 0);
    const uCanopy = new THREE.SphereGeometry(3.2, 9, 5);
    uCanopy.scale(1, 0.3, 1);
    uCanopy.translate(0, 9.2, 0);
    const uCanopy2 = new THREE.SphereGeometry(2.0, 8, 5);
    uCanopy2.scale(1, 0.28, 1);
    uCanopy2.translate(0.95, 8.5, -0.5);
    // --- cypress: the column ---
    const yStub = new THREE.CylinderGeometry(0.16, 0.22, 0.8, 6);
    yStub.translate(0, 0.4, 0);
    const yCol = new THREE.CylinderGeometry(0.34, 0.92, 8.6, 7);
    yCol.translate(0, 4.9, 0);
    const yTip = new THREE.ConeGeometry(0.4, 2.3, 7);
    yTip.translate(0, 10.2, 0);

    const mk = (specs) => {
      const parts = specs.map(([g, mat]) => new THREE.InstancedMesh(g, mat, COUNT));
      for (const p of parts) p.castShadow = true;
      return parts;
    };
    const SPECIES = {
      oliveOld: { parts: mk([[oTrunk, trunkMat], [oLimb, trunkMat], [oCrownA, lowMat],
        [oCrownB, topMat], [oCrownC, lowMat]]),
      kind: 'olive', rFac: 1.15, tiers: [2, 3, 4], solidAt: 1.0, tone: 'olive', shade: 2.6 },
      oliveRow: { parts: mk([[gTrunk, trunkMat], [gCrown, lowMat], [gTop, topMat]]),
        kind: 'olive', rFac: 0.7, tiers: [1, 2], solidAt: null, tone: 'olive', shade: 1.8 },
      corkOak: { parts: mk([[cTrunk, trunkMat], [cStrip, corkMat], [cDome, lowMat],
        [cLobe, topMat]]),
      kind: 'oak', rFac: 1.1, tiers: [2, 3], solidAt: 1.0, tone: 'oak', shade: 3.0 },
      umbrellaPine: { parts: mk([[uTrunk, trunkMat], [uCanopy, lowMat], [uCanopy2, topMat]]),
        kind: 'pine', rFac: 0.95, tiers: [1, 2], solidAt: 1.05, tone: 'pine', shade: 3.2 },
      cypress: { parts: mk([[yStub, trunkMat], [yCol, lowMat], [yTip, topMat]]),
        kind: 'cypress', rFac: 0.55, tiers: [1, 2], solidAt: null, tone: 'cypress', shade: 1.1 },
    };
    const counts = {};
    for (const k of Object.keys(SPECIES)) counts[k] = 0;

    const mix = T.floraMix || FLORA_MIX[this.level && this.level.theme]
      || [['oliveOld', 0.5], ['oliveRow', 0.5]];
    // the cypresses come out of the scatter budget and are planted as lines
    const cypWt = (mix.find(([n]) => n === 'cypress') || [null, 0])[1];
    const scatterMix = mix.filter(([n]) => n !== 'cypress' && SPECIES[n]);
    const wtSum = scatterMix.reduce((a, [, w]) => a + w, 0) || 1;
    const pick = () => {
      let roll = Math.random() * wtSum, acc = 0;
      for (const [name, wt] of scatterMix) { acc += wt; if (roll < acc) return name; }
      return scatterMix[scatterMix.length - 1][0];
    };

    const color = new THREE.Color();
    const F = T.foliage;
    const q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
    const plant = (name, x, z, s, rot) => {
      const spec = SPECIES[name];
      const k = counts[name]++;
      if (k >= COUNT) { counts[name]--; return; }
      const ty = this.terrainHeight(x, z) - 0.2;
      q.setFromAxisAngle(up, rot);
      m4.compose(new THREE.Vector3(x, ty, z), q,
        new THREE.Vector3(s, s * (0.9 + Math.random() * 0.3), s));
      for (const part of spec.parts) part.setMatrixAt(k, m4);
      this.trees.push({
        x, z, y: ty, r: spec.rFac * s, id: k, parts: spec.parts, kind: spec.kind, s,
        solid: spec.solidAt != null && s >= spec.solidAt,
      });
      // Foliage tone per species inside the theme's olive hue band. Olive is
      // the pale silvered one, cypress is the dark column, cork oak the deep
      // saturated dome — all under the 55 % saturation ceiling (R02).
      switch (spec.tone) {
        case 'cypress':
          color.setHSL(F.h + 0.03 + Math.random() * F.hVar, Math.min(0.55, F.s + 0.1),
            Math.max(0.13, F.l - 0.14 + Math.random() * F.lVar * 0.6)); break;
        case 'oak':
          color.setHSL(F.h + 0.012 + Math.random() * F.hVar, Math.min(0.55, F.s + 0.08),
            Math.max(0.16, F.l - 0.06 + Math.random() * F.lVar)); break;
        case 'pine':
          color.setHSL(F.h + 0.02 + Math.random() * F.hVar, Math.min(0.55, F.s + 0.05),
            Math.max(0.16, F.l - 0.04 + Math.random() * F.lVar)); break;
        default:      // olive: silver-green, the palest foliage in the world
          color.setHSL(F.h + Math.random() * F.hVar, F.s * 0.9 + Math.random() * F.sVar,
            F.l + 0.05 + Math.random() * F.lVar);
      }
      const woodTone = 0.86 + Math.random() * 0.28;
      spec.parts[0].setColorAt(k, new THREE.Color(woodTone, woodTone * 0.98, woodTone * 0.94));
      for (let ti = 1; ti < spec.parts.length; ti++) {
        // `tiers` names the foliage parts; anything else on the tree (the
        // olive's second stem, the cork oak's stripped band) is wood
        spec.parts[ti].setColorAt(k, spec.tiers.includes(ti)
          ? color.clone().multiplyScalar(0.9 + ti * 0.06)
          : new THREE.Color(woodTone, woodTone * 0.98, woodTone * 0.94));
      }
      this._addShadow(x, z, spec.shade * s);
    };

    // GROVE ANCHORS: the corners of the planted terraces. Each carries its own
    // rotation, so the rows run across the hillside at their own angle.
    const anchors = [];
    for (let a = 0; a < 6; a++) {
      const p = this._trackSidePos(26, 96);
      if (p) anchors.push({ x: p.x, z: p.z, rot: Math.random() * Math.PI * 2 });
    }
    const GRID = 7;                                   // the Bible's 7 m spacing
    this._scatter(COUNT - Math.round(cypWt * COUNT),
      () => {
        if (anchors.length && Math.random() < 0.45) {
          const an = anchors[(Math.random() * anchors.length) | 0];
          const cs = Math.cos(an.rot), sn = Math.sin(an.rot);
          const gx = (((Math.random() * 9) | 0) - 4) * GRID;
          const gz = (((Math.random() * 9) | 0) - 4) * GRID;
          const x = an.x + gx * cs - gz * sn + (Math.random() - 0.5) * 0.7;
          const z = an.z + gx * sn + gz * cs + (Math.random() - 0.5) * 0.7;
          return this._distToTrack(x, z) < 14 ? null : { x, z, grid: true };
        }
        const p = Math.random() < 0.55
          ? this._trackSidePos(15, 48)
          : (() => {
            const ang = Math.random() * Math.PI * 2;
            const r = 80 + Math.random() * 540;
            const x = Math.cos(ang) * r, z = Math.sin(ang) * r;
            return this._distToTrack(x, z) < 14 ? null : { x, z };
          })();
        // no olives rooted in the bay: the ring branch bypasses _trackSidePos
        return p && !this._inWater(p.x, p.z) && this._altOK(p.x, p.z) ? p : null;
      },
      (p) => {
        // on the lattice it is a planted grove, so it is a grove tree and it
        // stands the same way as its neighbours
        const name = p.grid && Math.random() < 0.82 ? 'oliveRow' : pick();
        const s = p.grid
          ? (name === 'oliveRow' ? 0.92 + Math.random() * 0.2 : 0.85 + Math.random() * 0.3)
          : 0.78 + Math.random() * 0.7;
        plant(name, p.x, p.z, s, p.grid ? 0.2 + Math.random() * 0.3 : Math.random() * Math.PI * 2);
      });

    // CYPRESS LINES: 4–6 trees in a dead straight row, marking a boundary.
    const lines = Math.max(2, Math.round(cypWt * COUNT / 5));
    for (let l = 0; l < lines; l++) {
      const p = this._trackSidePos(20, 90);
      if (!p) continue;
      const ang = Math.random() * Math.PI * 2;
      const dx = Math.cos(ang) * 5.5, dz = Math.sin(ang) * 5.5;   // 5.5 u apart
      const n = 4 + ((Math.random() * 3) | 0);
      for (let t = 0; t < n; t++) {
        const x = p.x + dx * t, z = p.z + dz * t;
        if (this._distToTrack(x, z) < 13) continue;
        plant('cypress', x, z, 0.85 + Math.random() * 0.45, Math.random() * Math.PI * 2);
      }
    }

    for (const name of Object.keys(SPECIES)) {
      for (const part of SPECIES[name].parts) part.count = counts[name];
      if (counts[name]) this.group.add(...SPECIES[name].parts);
    }
  },

  /** Gargantuan redwoods: scale 2.2–3.2 → the s ≥ 1.0 'pine' rule makes every
   *  one SOLID, so they are all placed OFF the road. Two more species dress
   *  the floor and keep the stand from reading as one repeated tree: small
   *  (smashable) redwood saplings on the verges, and TANOAK broadleaves in a
   *  lighter yellow-green — the real coast-redwood understory. */
  _buildRedwoods(m4) {
    const T = this.T;
    const COUNT = T.treeCount;
    const trunkGeo = new THREE.CylinderGeometry(0.5, 0.9, 9, 8);
    trunkGeo.translate(0, 4.5, 0);
    const lowGeo = new THREE.ConeGeometry(3.0, 6.5, 8);
    lowGeo.translate(0, 11.4, 0);
    const midGeo = new THREE.ConeGeometry(2.3, 5.5, 8);
    midGeo.translate(0, 15.1, 0);
    const topGeo = new THREE.ConeGeometry(1.5, 4.6, 8);
    topGeo.translate(0, 18.6, 0);
    const trunkMat = new THREE.MeshStandardMaterial({ color: T.trunkColor, roughness: 1 });
    const lowMat = new THREE.MeshStandardMaterial({ color: T.foliageLow, flatShading: true, roughness: 1 });
    const topMat = new THREE.MeshStandardMaterial({ color: T.foliageTop, flatShading: true, roughness: 1 });
    const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, COUNT);
    const lows = new THREE.InstancedMesh(lowGeo, lowMat, COUNT);
    const mids = new THREE.InstancedMesh(midGeo, lowMat, COUNT);
    const tops = new THREE.InstancedMesh(topGeo, topMat, COUNT);
    trunks.castShadow = lows.castShadow = mids.castShadow = tops.castShadow = true;
    const giantParts = [trunks, lows, mids, tops];
    const color = new THREE.Color();
    const F = T.foliage;
    const placed = this._scatter(COUNT,
      () => {
        // giants never crowd the ribbon: min 17u from the centerline
        if (Math.random() < 0.6) return this._trackSidePos(17, 60);
        const a = Math.random() * Math.PI * 2;
        const r = 80 + Math.random() * 540;
        const x = Math.cos(a) * r, z = Math.sin(a) * r;
        if (this._distToTrack(x, z) < 17) return null;
        return { x, z };
      },
      (p, k) => {
        const s = 2.2 + Math.random() * 1.0;             // 46–67u tall — gargantuan
        const ty = this.terrainHeight(p.x, p.z) - 0.4;
        m4.makeScale(s, s * (0.9 + Math.random() * 0.25), s);
        m4.setPosition(p.x, ty, p.z);
        for (const part of giantParts) part.setMatrixAt(k, m4);
        // kind 'pine' at s ≥ 1.0 → SOLID: hitting a giant stops a car dead
        this.trees.push({ x: p.x, z: p.z, y: ty, r: 0.85 * s, id: k, parts: giantParts, kind: 'pine', s, solid: true });
        this._addShadow(p.x, p.z, 1.6 * s);
        color.setHSL(
          F.h + Math.random() * F.hVar,
          F.s + Math.random() * F.sVar,
          F.l + Math.random() * F.lVar
        );
        lows.setColorAt(k, color);
        mids.setColorAt(k, color.clone().multiplyScalar(0.88));
        tops.setColorAt(k, color.clone().multiplyScalar(1.22));
      });
    trunks.count = lows.count = mids.count = tops.count = placed;
    this.group.add(trunks, lows, mids, tops);

    // smashable understory: the same geometry at sapling scale near the road
    const SAPS = 110;
    const sTrunks = new THREE.InstancedMesh(trunkGeo, trunkMat, SAPS);
    const sLows = new THREE.InstancedMesh(lowGeo, lowMat, SAPS);
    const sTops = new THREE.InstancedMesh(topGeo, topMat, SAPS);
    sTrunks.castShadow = sLows.castShadow = sTops.castShadow = true;
    const sapParts = [sTrunks, sLows, sTops];
    const sapPlaced = this._scatter(SAPS,
      () => this._trackSidePos(12.5, 26),
      (p, k) => {
        const s = 0.22 + Math.random() * 0.2;            // 4.5–9u saplings
        const ty = this.terrainHeight(p.x, p.z) - 0.15;
        m4.makeScale(s, s * (0.9 + Math.random() * 0.3), s);
        m4.setPosition(p.x, ty, p.z);
        for (const part of sapParts) part.setMatrixAt(k, m4);
        this.trees.push({ x: p.x, z: p.z, y: ty, r: 0.85 * s, id: k, parts: sapParts, kind: 'pine', s, solid: false });
        color.setHSL(F.h + Math.random() * F.hVar, F.s, F.l + 0.06 + Math.random() * 0.1);
        sLows.setColorAt(k, color);
        sTops.setColorAt(k, color.clone().multiplyScalar(1.2));
      });
    for (const part of sapParts) { part.count = sapPlaced; this.group.add(part); }

    // --- TANOAK: the broadleaf that actually grows under coast redwoods.
    // Short crooked trunk under two rounded crowns in a lighter, yellower
    // green than the conifers, so the stand never reads as one repeated tree.
    const OAKS = 120;
    const oTrunk = new THREE.CylinderGeometry(0.26, 0.42, 4.4, 6);
    oTrunk.rotateZ(0.06);
    oTrunk.translate(0, 2.2, 0);
    const oCrown = new THREE.SphereGeometry(2.3, 8, 6);
    oCrown.scale(1, 0.82, 1);
    oCrown.translate(0, 5.1, 0);
    const oTop = new THREE.SphereGeometry(1.4, 7, 5);
    oTop.scale(1, 0.85, 1);
    oTop.translate(0.45, 6.3, 0.3);
    // reuse the theme's canopy materials so the tanoaks sit in the same
    // brightness family as the conifers — the per-instance tint below only
    // shifts them yellower and a shade lighter
    const oakParts = [
      new THREE.InstancedMesh(oTrunk, trunkMat, OAKS),
      new THREE.InstancedMesh(oCrown, lowMat, OAKS),
      new THREE.InstancedMesh(oTop, topMat, OAKS),
    ];
    for (const part of oakParts) part.castShadow = true;
    const oakPlaced = this._scatter(OAKS,
      () => (Math.random() < 0.7 ? this._trackSidePos(13, 45) : this._trackSidePos(45, 130)),
      (p, k) => {
        const s = 0.7 + Math.random() * 0.7;
        const ty = this.terrainHeight(p.x, p.z) - 0.2;
        m4.makeScale(s, s * (0.85 + Math.random() * 0.4), s);
        m4.setPosition(p.x, ty, p.z);
        for (const part of oakParts) part.setMatrixAt(k, m4);
        // broadleaf, never a giant → always yields to a bumper
        this.trees.push({ x: p.x, z: p.z, y: ty, r: 0.75 * s, id: k, parts: oakParts, kind: 'oak', s, solid: s >= 1.05 });
        // yellower and a shade lighter than the conifers, same brightness band
        color.setHSL(
          F.h - 0.035 + Math.random() * F.hVar,
          Math.min(1, F.s + 0.08),
          Math.min(0.55, F.l + 0.05 + Math.random() * F.lVar)
        );
        oakParts[1].setColorAt(k, color);
        oakParts[2].setColorAt(k, color.clone().multiplyScalar(1.2));
        this._addShadow(p.x, p.z, 2.2 * s);
      });
    for (const part of oakParts) { part.count = oakPlaced; this.group.add(part); }
  },

  /** Burning forest: a mix of bare charred snags (ember-rim emissive) and
   *  still-standing pines whose canopies are scorched to ember-lit browns. */
  _buildBurntForest(m4) {
    const T = this.T;
    const q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
    const color = new THREE.Color();
    // --- charred snags (60%) ---
    const SNAGS = Math.round(T.treeCount * 0.6);
    const trunkGeo = new THREE.CylinderGeometry(0.13, 0.34, 4.8, 6);
    trunkGeo.translate(0, 2.4, 0);
    const b1 = new THREE.ConeGeometry(0.1, 2.0, 5);
    b1.rotateZ(-0.95);
    b1.translate(0.62, 3.2, 0);
    const b2 = new THREE.ConeGeometry(0.09, 1.6, 5);
    b2.rotateZ(0.85);
    b2.translate(-0.55, 2.6, 0.1);
    const snagMat = new THREE.MeshStandardMaterial({
      color: 0xffffff, flatShading: true, roughness: 1,
      emissive: 0x341000, emissiveIntensity: 0.55,       // ember rim
    });
    const snagParts = [trunkGeo, b1, b2].map((g0) => new THREE.InstancedMesh(g0, snagMat, SNAGS));
    for (const part of snagParts) part.castShadow = true;
    const snagPlaced = this._scatter(SNAGS,
      () => {
        if (Math.random() < 0.6) return this._trackSidePos(14, 44);
        const a = Math.random() * Math.PI * 2;
        const r = 80 + Math.random() * 520;
        const x = Math.cos(a) * r, z = Math.sin(a) * r;
        if (this._distToTrack(x, z) < 14) return null;
        return { x, z };
      },
      (p, k) => {
        const s = 0.7 + Math.random() * 1.1;
        const ty = this.terrainHeight(p.x, p.z) - 0.2;
        q.setFromAxisAngle(up, Math.random() * Math.PI * 2);
        m4.compose(new THREE.Vector3(p.x, ty, p.z), q, new THREE.Vector3(s, s * (0.8 + Math.random() * 0.5), s));
        color.setHSL(0.05 + Math.random() * 0.03, 0.14 + Math.random() * 0.1, 0.07 + Math.random() * 0.05);
        for (const part of snagParts) {
          part.setMatrixAt(k, m4);
          part.setColorAt(k, color);
        }
        this.trees.push({ x: p.x, z: p.z, y: ty, r: 0.45 * s, id: k, parts: snagParts, kind: 'snag', s, solid: false });
        this._addShadow(p.x, p.z, 1.2 * s);
      });
    for (const part of snagParts) { part.count = snagPlaced; this.group.add(part); }

    // --- scorched standing pines (40%), canopies glowing from within ---
    const PINES = T.treeCount - SNAGS;
    const pTrunk = new THREE.CylinderGeometry(0.35, 0.5, 2.4, 7);
    pTrunk.translate(0, 1.2, 0);
    const pLow = new THREE.ConeGeometry(2.6, 4.2, 8);
    pLow.translate(0, 4.0, 0);
    const pTop = new THREE.ConeGeometry(1.8, 3.4, 8);
    pTop.translate(0, 6.6, 0);
    const pTrunkMat = new THREE.MeshStandardMaterial({ color: T.trunkColor, roughness: 1 });
    const scorchMat = new THREE.MeshStandardMaterial({
      color: T.foliageLow, flatShading: true, roughness: 1,
      emissive: 0x552008, emissiveIntensity: 0.6,        // fire smouldering inside
    });
    const scorchTopMat = new THREE.MeshStandardMaterial({
      color: T.foliageTop, flatShading: true, roughness: 1,
      emissive: 0x6a2408, emissiveIntensity: 0.55,
    });
    const pTrunks = new THREE.InstancedMesh(pTrunk, pTrunkMat, PINES);
    const pLows = new THREE.InstancedMesh(pLow, scorchMat, PINES);
    const pTops = new THREE.InstancedMesh(pTop, scorchTopMat, PINES);
    pTrunks.castShadow = pLows.castShadow = pTops.castShadow = true;
    const pineParts = [pTrunks, pLows, pTops];
    const F = T.foliage;
    const pinePlaced = this._scatter(PINES,
      () => {
        if (Math.random() < 0.62) return this._trackSidePos(15, 46);
        const a = Math.random() * Math.PI * 2;
        const r = 80 + Math.random() * 560;
        const x = Math.cos(a) * r, z = Math.sin(a) * r;
        if (this._distToTrack(x, z) < 14.5) return null;
        return { x, z };
      },
      (p, k) => {
        const s = 0.75 + Math.random() * 1.1;
        const ty = this.terrainHeight(p.x, p.z) - 0.25;
        m4.makeScale(s, s * (0.85 + Math.random() * 0.4), s);
        m4.setPosition(p.x, ty, p.z);
        for (const part of pineParts) part.setMatrixAt(k, m4);
        this.trees.push({ x: p.x, z: p.z, y: ty, r: 1.0 * s, id: k, parts: pineParts, kind: 'pine', s, solid: s >= 1.0 });
        color.setHSL(
          F.h + Math.random() * F.hVar,
          F.s + Math.random() * F.sVar,
          F.l + Math.random() * F.lVar
        );
        pLows.setColorAt(k, color);
        pTops.setColorAt(k, color.clone().multiplyScalar(1.25));
        this._addShadow(p.x, p.z, 2.4 * s);
      });
    pTrunks.count = pLows.count = pTops.count = pinePlaced;
    this.group.add(pTrunks, pLows, pTops);
  },

  _buildGroundCover(m4) {
    const T = this.T;
    const q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
    // grass tufts: two crossed alpha-cut planes, dense right beside the road
    const gtex = grassTexture(T.grass);
    const tuftGeo = new THREE.PlaneGeometry(1.6, 1.3);
    tuftGeo.translate(0, 0.6, 0);
    const tuftMat = new THREE.MeshStandardMaterial({
      map: gtex, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 1,
    });
    const tufts = new THREE.InstancedMesh(tuftGeo, tuftMat, T.tuftCount * 2);
    let k = 0;
    this._scatter(T.tuftCount,
      () => {
        const p = Math.random() < 0.7 ? this._trackSidePos(11.2, 32) : this._trackSidePos(26, 62);
        return p && !this._onQuayStrip(p.x, p.z) ? p : null;
      },
      (p) => {
        const y = this.terrainHeight(p.x, p.z) - 0.05;
        const s = 0.7 + Math.random() * 1.1;
        const rot = Math.random() * Math.PI;
        for (const dr of [0, Math.PI / 2]) {
          q.setFromAxisAngle(up, rot + dr);
          m4.compose(new THREE.Vector3(p.x, y, p.z), q, new THREE.Vector3(s, s, s));
          tufts.setMatrixAt(k++, m4);
        }
      });
    tufts.count = k;
    this.group.add(tufts);

    // Understorey. One squashed blob stood in for every biome's ground layer —
    // the same shape under redwoods, in the Amazon, on an ice sheet and in a
    // wadi. It is the layer you see most of at eye height, so it is the layer
    // that most gives away that the worlds are the same world repainted.
    //
    // Four silhouettes now, chosen by what actually grows there:
    //   frond   fern / sword fern   — rainforest and redwood floor
    //   spray   tussock / bunchgrass — alpine pasture, snow edge, ice moraine
    //   spike   saltbush / creosote  — deserts, canyons, wadis
    //   blob    broadleaf scrub      — everywhere else (the original)
    const UNDER = {
      jungle: 'frond', redwood: 'frond', flume: 'frond',
      alpine: 'spray', pass: 'spray', tremola: 'spray', furka: 'spray',
      snow: 'spray', glacial: 'spray', sheetice: 'spray', avalanche: 'spray',
      desert: 'spike', dunes: 'spike', canyon: 'spike', ravine: 'spike', oasis: 'spike',
    };
    const underKind = T.understorey ?? UNDER[this.level?.theme] ?? 'blob';
    let bushGeo;
    if (underKind === 'frond') {
      // a low rosette of fronds: wide, flat, overlapping
      bushGeo = new THREE.SphereGeometry(1.15, 7, 3);
      bushGeo.scale(1, 0.3, 1);
    } else if (underKind === 'spray') {
      // bunchgrass: narrow at the base, splaying up and out
      bushGeo = new THREE.ConeGeometry(0.95, 1.5, 6, 1, true);
      bushGeo.translate(0, 0.45, 0);
    } else if (underKind === 'spike') {
      // desert scrub: sparse, angular, twice as tall as it is wide
      bushGeo = new THREE.OctahedronGeometry(0.85, 0);
      bushGeo.scale(0.8, 1.35, 0.8);
    } else {
      bushGeo = new THREE.IcosahedronGeometry(1, 0);
      bushGeo.scale(1, 0.62, 1);
    }
    const bushes = new THREE.InstancedMesh(
      bushGeo,
      new THREE.MeshStandardMaterial({ color: T.bushColor, flatShading: true, roughness: 1,
        side: (underKind === 'spray' || underKind === 'frond') ? THREE.DoubleSide : THREE.FrontSide }),
      T.bushCount
    );
    const B = T.bush;
    const bcolor = new THREE.Color();
    let bk = 0;
    this._scatter(T.bushCount, () => {
      const p = this._trackSidePos(13, 70);
      return p && !this._onQuayStrip(p.x, p.z) ? p : null;
    }, (p) => {
      const s = 0.7 + Math.random() * 1.5;
      const by = this.terrainHeight(p.x, p.z) + s * 0.3;
      m4.makeScale(s, s, s);
      m4.setPosition(p.x, by, p.z);
      bushes.setMatrixAt(bk, m4);
      bcolor.setHSL(
        B.h + Math.random() * B.hVar,
        B.s + Math.random() * B.sVar,
        B.l + Math.random() * B.lVar
      );
      // SOFT scenery: cars brush through, spraying leaves — no removal needed
      this.bushes.push({ x: p.x, z: p.z, y: by, r: 1.0 * s, id: bk, lastHit: 0 });
      bushes.setColorAt(bk++, bcolor);
    });
    bushes.count = bk;
    this.group.add(bushes);

    // boulders (snow theme gets white caps on top; volcano gets glossy obsidian)
    // — top-lit via a baked vertex-color gradient, plus a smaller offset lump
    // beside each one so they cluster instead of reading as lone blobs
    const rockRough = T.rockRoughness !== undefined ? T.rockRoughness : 0.9;
    const rockGeo = this._rockGeo || (this._rockGeo = this._topLitRockGeo(0));
    const rockMat = new THREE.MeshStandardMaterial({
      color: T.rockColor, flatShading: true, roughness: rockRough, envMapIntensity: 0.5,
      vertexColors: true,
    });
    const rocks = new THREE.InstancedMesh(rockGeo, rockMat, T.rockCount);
    const lumps = new THREE.InstancedMesh(rockGeo, rockMat, T.rockCount);
    rocks.castShadow = true;
    const caps = T.rockSnowCap
      ? new THREE.InstancedMesh(
          new THREE.DodecahedronGeometry(1, 0),
          new THREE.MeshStandardMaterial({ color: 0xf2f6fa, flatShading: true, roughness: 0.9 }),
          T.rockCount
        )
      : null;
    if (caps) caps.castShadow = true;
    const rcol = new THREE.Color();
    let rk = 0, lk = 0;
    // OFF THE VERGE. 12.5 u put boulders about three units from the road edge,
    // so a scatter meant to dress the middle distance ended up crowding the
    // carriageway. Deliberate road hazards are a different system entirely
    // (obstacleSpec), and they still place where they always did.
    this._scatter(T.rockCount, () => {
      const p = this._trackSidePos(19, 90);
      return p && !this._onQuayStrip(p.x, p.z) && !this._inWater(p.x, p.z) ? p : null;
    }, (p) => {
      let s = 0.5 + Math.random() * 2.2;
      // never let a boulder reach into the carriageway — shrink it to fit, and
      // if it cannot fit, place nothing here at all
      const fit = this._stoneFit(p.x, p.z, s * 0.9);
      if (fit <= 0) return;
      s = Math.min(s, fit / 0.9);
      const sy = s * (0.6 + Math.random() * 0.5);
      const y = this.terrainHeight(p.x, p.z) + s * 0.25;
      // big boulders are SOLID (geometry base radius 1 × instance scale s)
      // carry the instance so a knocked-loose stone can actually be SEEN to go
      if (s > 0.9) this.solids.push({ x: p.x, z: p.z, r: s * 0.9, y: y - s * 0.25, mat: 'stone',
        inst: rk, im: rocks, sc: s });
      const rot = Math.random() * Math.PI * 2;
      q.setFromAxisAngle(up, rot);
      m4.compose(new THREE.Vector3(p.x, y, p.z), q, new THREE.Vector3(s, sy, s));
      rocks.setMatrixAt(rk, m4);
      // per-rock tone jitter (multiplies the top-lit vertex gradient)
      rcol.setScalar(0.86 + Math.random() * 0.28);
      rocks.setColorAt(rk, rcol);
      if (caps) {
        m4.compose(
          new THREE.Vector3(p.x, y + sy * 0.55, p.z),
          q, new THREE.Vector3(s * 0.8, sy * 0.4, s * 0.8)
        );
        caps.setMatrixAt(rk, m4);
      }
      // companion lump shoulders most boulders for a clustered, shattered look
      if (s > 0.75 && Math.random() < 0.8) {
        const la = Math.random() * Math.PI * 2;
        const ls = s * (0.3 + Math.random() * 0.25);
        const lx = p.x + Math.cos(la) * s * 0.95, lz = p.z + Math.sin(la) * s * 0.95;
        q.setFromAxisAngle(up, Math.random() * Math.PI * 2);
        m4.compose(
          new THREE.Vector3(lx, this.terrainHeight(lx, lz) + ls * 0.3, lz),
          q, new THREE.Vector3(ls, ls * (0.6 + Math.random() * 0.4), ls)
        );
        lumps.setMatrixAt(lk, m4);
        rcol.setScalar(0.82 + Math.random() * 0.28);
        lumps.setColorAt(lk++, rcol);
      }
      if (s > 0.8) this._addShadow(p.x, p.z, s * 1.5);
      rk++;
    });
    rocks.count = rk;
    lumps.count = lk;
    this.group.add(rocks, lumps);
    if (caps) { caps.count = rk; this.group.add(caps); }

    // small stones scattered right off the road edge
    const pebbles = new THREE.InstancedMesh(rockGeo, rockMat, T.pebbleCount);
    const pcol = new THREE.Color();
    let pk = 0;
    this._scatter(T.pebbleCount, () => this._trackSidePos(11.3, 16), (p) => {
      const s = 0.12 + Math.random() * 0.32;
      q.setFromAxisAngle(up, Math.random() * Math.PI * 2);
      m4.compose(
        new THREE.Vector3(p.x, this.terrainHeight(p.x, p.z) + s * 0.3, p.z),
        q, new THREE.Vector3(s, s * 0.7, s)
      );
      pebbles.setMatrixAt(pk, m4);
      pcol.setScalar(0.85 + Math.random() * 0.3);
      pebbles.setColorAt(pk++, pcol);
    });
    pebbles.count = pk;
    this.group.add(pebbles);

    // one big hero boulder close to the racing line (in the open start bowl on
    // cliff-walled levels, where trackside ground is actually visible).
    // heroRock: false skips it (the neon expressway has no boulders).
    if (T.heroRock === false) return;
    const fallbackP = this.pointAt((N * 0.42) | 0, WALL_OFF + 7);
    const heroP = T.cliffWalls ? this.pointAt(48, -(WALL_OFF + 5.5)) : null;
    const hp = heroP
      ? { x: heroP.x, z: heroP.z }
      : (this._trackSidePos(14, 18) || { x: fallbackP.x, z: fallbackP.z });
    const hero = new THREE.Mesh(this._topLitRockGeo(1), rockMat);
    hero.scale.set(4.6, 3.3, 4.1);
    hero.rotation.y = 1.3;
    hero.position.set(hp.x, this.terrainHeight(hp.x, hp.z) + 0.9, hp.z);
    hero.castShadow = true;
    this.group.add(hero);
    // hero boulder is solid too: footprint radius ≈ (4.6 + 4.1) / 2 = 4.35
    this.solids.push({ x: hp.x, z: hp.z, r: Math.min(4.35 * 0.9, Math.max(0.5, this._stoneFit(hp.x, hp.z, 4.35 * 0.9))), y: this.terrainHeight(hp.x, hp.z), mat: 'stone' });
    this._addShadow(hp.x, hp.z, 5.8);
    if (T.rockSnowCap) {
      const heroCap = new THREE.Mesh(
        new THREE.DodecahedronGeometry(1, 1),
        new THREE.MeshStandardMaterial({ color: 0xf2f6fa, flatShading: true, roughness: 0.9 })
      );
      heroCap.scale.set(3.8, 1.4, 3.4);
      heroCap.rotation.y = 1.3;
      heroCap.position.set(hp.x, hero.position.y + 2.2, hp.z);
      this.group.add(heroCap);
    }

    // flowers sprinkled close to the road
    const flowers = new THREE.InstancedMesh(
      new THREE.SphereGeometry(0.22, 6, 5),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 }),
      T.flowerCount
    );
    const fcolors = T.flowerColors;
    const fc = new THREE.Color();
    let fk = 0;
    this._scatter(T.flowerCount, () => {
      const p = this._trackSidePos(11.8, 42);
      return p && !this._onQuayStrip(p.x, p.z) ? p : null;
    }, (p) => {
      m4.makeScale(1, 1, 1);
      m4.setPosition(p.x, this.terrainHeight(p.x, p.z) + 0.22, p.z);
      flowers.setMatrixAt(fk, m4);
      fc.set(fcolors[(Math.random() * fcolors.length) | 0]);
      flowers.setColorAt(fk++, fc);
    });
    flowers.count = fk;
    this.group.add(flowers);
  },
};

