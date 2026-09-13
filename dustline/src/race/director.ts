// Race director (M3): countdown, ordered sector checkpoints, lap counting,
// live positions by continuous progress, finish + results. 3 laps, 4 racers.

import type { VehicleController } from '../physics/vehicleController';
import { LineNode, nearestNode } from '../ai/racingLine';
import raceData from '../data/race.json';

export interface RacerEntry {
  ctrl: VehicleController;
  name: string;
  isPlayer: boolean;
  lap: number;              // 1-based current lap
  lineIdx: number;
  sectorsPassed: boolean[]; // ordered checkpoints this lap
  progress: number;         // lap + idx/n, drives the standings
  finished: boolean;
  finishTime: number;
  lapStart: number;
  bestLap: number;
  position: number;
}

export type RaceState = 'countdown' | 'race' | 'finished';

export class RaceDirector {
  state: RaceState = 'countdown';
  countdown = raceData.countdownSec;
  raceTime = 0;
  laps = raceData.laps;
  racers: RacerEntry[] = [];
  private sectorIdx: number[];

  constructor(private line: LineNode[]) {
    const n = line.length;
    this.sectorIdx = raceData.sectorFractions.map((f: number) => Math.floor(f * n));
  }

  addRacer(ctrl: VehicleController, name: string, isPlayer: boolean) {
    this.racers.push({
      ctrl, name, isPlayer, lap: 1, lineIdx: 0,
      sectorsPassed: this.sectorIdx.map(() => false),
      progress: 1, finished: false, finishTime: 0, lapStart: 0, bestLap: Infinity,
      position: this.racers.length + 1,
    });
  }

  get player(): RacerEntry {
    return this.racers.find((r) => r.isPlayer)!;
  }

  /** Grid slots behind the start line, 2×2. */
  gridSlot(i: number): { x: number; z: number; heading: number } {
    const n = this.line.length;
    const back = (i >> 1) + 1;
    const node = this.line[(n - back * 3) % n];
    const lane = (i % 2 === 0 ? 1 : -1) * raceData.gridLaneOffset;
    return {
      x: node.x + node.dirZ * lane,
      z: node.z - node.dirX * lane,
      heading: Math.atan2(node.dirX, node.dirZ),
    };
  }

  update(dt: number) {
    if (this.state === 'countdown') {
      this.countdown -= dt;
      if (this.countdown <= 0) {
        this.state = 'race';
        this.raceTime = 0;
        for (const r of this.racers) r.lapStart = 0;
      }
      return;
    }
    this.raceTime += dt;

    const n = this.line.length;
    for (const r of this.racers) {
      if (r.finished) continue;
      const t = r.ctrl.body.translation();
      const prev = r.lineIdx;
      r.lineIdx = nearestNode(this.line, t.x, t.z, prev);

      // ordered sector checkpoints (cutting the map earns nothing)
      for (let s = 0; s < this.sectorIdx.length; s++) {
        const si = this.sectorIdx[s];
        if (this.crossed(prev, r.lineIdx, si) && (s === 0 || r.sectorsPassed[s - 1])) {
          r.sectorsPassed[s] = true;
        }
      }
      // start/finish line: counts only with all sectors collected
      if (this.crossed(prev, r.lineIdx, 0) && prev > n * 0.5) {
        if (r.sectorsPassed.every(Boolean)) {
          const lapTime = this.raceTime - r.lapStart;
          r.bestLap = Math.min(r.bestLap, lapTime);
          r.lapStart = this.raceTime;
          r.lap++;
          r.sectorsPassed = this.sectorIdx.map(() => false);
          if (r.lap > this.laps) {
            r.finished = true;
            r.finishTime = this.raceTime;
          }
        }
      }
      // progress = lap + fraction from ordered segments. Within the current
      // segment we measure forward distance from its entry gate; sitting
      // BEHIND the gate (grid spawns, wrong-way) clamps to zero — so nobody
      // ranks ahead by standing near the finish line.
      const k = r.sectorsPassed.filter(Boolean).length;
      const gates = [0, ...this.sectorIdx, n];
      const segStart = gates[k];
      const segLen = Math.max(1, gates[k + 1] - segStart);
      let segDelta = (r.lineIdx - segStart + n) % n;
      if (segDelta > n * 0.5) segDelta = 0; // behind the gate
      const frac = (k + Math.min(1, segDelta / segLen)) / (this.sectorIdx.length + 1);
      r.progress = r.lap + frac * 0.999;
    }

    // standings: finishers by time, then live progress
    const sorted = [...this.racers].sort((a, b) => {
      if (a.finished && b.finished) return a.finishTime - b.finishTime;
      if (a.finished !== b.finished) return a.finished ? -1 : 1;
      return b.progress - a.progress;
    });
    sorted.forEach((r, i) => { r.position = i + 1; });

    if (this.player.finished && this.state !== 'finished') this.state = 'finished';
  }

  private crossed(prev: number, curr: number, gate: number): boolean {
    const n = this.line.length;
    const a = (prev - gate + n) % n;
    const b = (curr - gate + n) % n;
    // wrapped past the gate going forward (window keeps teleports honest)
    return a > n - 20 && b < 20 && a !== b;
  }

  restart(placeRacer: (r: RacerEntry, slot: { x: number; z: number; heading: number }) => void) {
    this.state = 'countdown';
    this.countdown = raceData.countdownSec;
    this.raceTime = 0;
    this.racers.forEach((r, i) => {
      r.lap = 1; r.finished = false; r.finishTime = 0; r.lapStart = 0;
      r.bestLap = Infinity; r.sectorsPassed = this.sectorIdx.map(() => false);
      r.progress = 1; r.lineIdx = (this.line.length - ((i >> 1) + 1) * 3) % this.line.length;
      placeRacer(r, this.gridSlot(i));
    });
  }
}
