/* The race: countdown, clock, sector splits, personal best.
 *
 * This is what turns a drivable stage into something worth driving twice. The
 * physics was the hard part; without a finish line it is a tech demo.
 *
 * §1.1 defines a sector as 500 m of centreline "used for timing, streaming and
 * LOD", so that is what a split is here — not three arbitrary thirds.
 */

export type RacePhase = 'countdown' | 'running' | 'finished';

/** §1.1: 500 m of centreline. */
export const SECTOR_METRES = 500;

export interface SectorSplit {
  index: number;
  /** Seconds from the start of the stage to the end of this sector. */
  elapsed: number;
  /** Seconds against the personal best for the same sector; null with no PB. */
  delta: number | null;
}

const KEY = (stageId: string) => `ignite-v2-best:${stageId}`;

interface StoredBest {
  total: number;
  sectors: number[];
}

function loadBest(stageId: string): StoredBest | null {
  try {
    const raw = localStorage.getItem(KEY(stageId));
    if (!raw) return null;
    const v = JSON.parse(raw) as StoredBest;
    return typeof v?.total === 'number' && Array.isArray(v.sectors) ? v : null;
  } catch {
    // A corrupt or unavailable store must never stop the race starting.
    return null;
  }
}

function saveBest(stageId: string, best: StoredBest): void {
  try {
    localStorage.setItem(KEY(stageId), JSON.stringify(best));
  } catch { /* private mode, quota — not worth failing a race over */ }
}

export class RaceDirector {
  phase: RacePhase = 'countdown';
  /** Seconds of race time. Physics time, not wall time, so it is unaffected by
   *  a dropped frame or a background tab. */
  elapsed = 0;
  /** Seconds remaining on the countdown. */
  countdown = 3.2;

  readonly splits: SectorSplit[] = [];
  readonly best: StoredBest | null;
  /** Set when the run finishes. */
  result: { total: number; isBest: boolean; previous: number | null } | null = null;

  private nextSector = 1;
  private readonly sectors: number;

  constructor(private readonly stageId: string, private readonly lengthMetres: number) {
    this.best = loadBest(stageId);
    this.sectors = Math.max(1, Math.ceil(lengthMetres / SECTOR_METRES));
  }

  /** True while the player's controls should be ignored. */
  get locked(): boolean {
    return this.phase === 'countdown' && this.countdown > 0.6;
  }

  /** The big number on screen during the countdown: 3, 2, 1, then GO. */
  get countdownText(): string {
    if (this.phase !== 'countdown') return '';
    const n = Math.ceil(this.countdown - 0.6);
    return n > 0 ? String(n) : 'GO';
  }

  /**
   * Advance the race. Called from inside the fixed physics step, with the
   * player's distance along the centreline.
   */
  update(dt: number, distanceMetres: number): void {
    if (this.phase === 'countdown') {
      this.countdown -= dt;
      if (this.countdown <= 0) this.phase = 'running';
      return;
    }
    if (this.phase !== 'running') return;

    this.elapsed += dt;

    // Sector boundaries. A run that skips one — off the road and rejoining
    // further along — still records the ones it did cross, in order.
    while (
      this.nextSector <= this.sectors &&
      // The final boundary IS the finish line, so it uses the same threshold.
      // Comparing against the full length instead left the last sector
      // unrecorded: the finish fired at length - 1 and closed the race first.
      distanceMetres >= Math.min(this.nextSector * SECTOR_METRES, this.lengthMetres - 1)
    ) {
      const i = this.nextSector - 1;
      const bestSector = this.best?.sectors[i];
      this.splits.push({
        index: this.nextSector,
        elapsed: this.elapsed,
        delta: bestSector === undefined ? null : this.elapsed - bestSector,
      });
      this.nextSector++;
    }

    if (distanceMetres >= this.lengthMetres - 1) this.finish();
  }

  private finish(): void {
    if (this.phase === 'finished') return;
    this.phase = 'finished';
    const total = this.elapsed;
    const previous = this.best?.total ?? null;
    const isBest = previous === null || total < previous;
    this.result = { total, isBest, previous };
    if (isBest) {
      saveBest(this.stageId, { total, sectors: this.splits.map((s) => s.elapsed) });
    }
  }

  /** The split to show on the HUD, for a few seconds after crossing. */
  latestSplit(): SectorSplit | null {
    const s = this.splits[this.splits.length - 1];
    if (!s) return null;
    return this.elapsed - s.elapsed < 3.5 ? s : null;
  }
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const r = seconds - m * 60;
  return `${m}:${r.toFixed(2).padStart(5, '0')}`;
}

export function formatDelta(delta: number): string {
  return `${delta >= 0 ? '+' : '−'}${Math.abs(delta).toFixed(2)}`;
}
