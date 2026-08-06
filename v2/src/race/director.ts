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

  /** §11.2.5 and §11.3 time penalties, seconds. Added to the clock rather than
   *  subtracted from it, because a penalty you cannot see on the HUD while you
   *  are still driving is a penalty you cannot respond to. */
  penalty = 0;

  readonly splits: SectorSplit[] = [];
  readonly best: StoredBest | null;
  /** Set when the run finishes. `raw` is the driving; `total` includes §11
   *  penalties and is the time that counts. */
  result: { total: number; raw: number; penalty: number; isBest: boolean; previous: number | null } | null = null;

  private nextSector = 1;
  private readonly sectors: number;
  /** The distance that counts as crossing the line. */
  private readonly finishAt: number;

  /**
   * @param finishAt Distance that ends the race. Defaults to a metre short of
   *   the stage length, which is right for a continuous distance — and WRONG
   *   for the one the game actually supplies.
   *
   *   The race reads progress from the driver's centreline cursor, so the
   *   number it sees is a SEGMENT's distance: quantised to the 4 m grid, and
   *   therefore never larger than `length - 4`. Against a threshold of
   *   `length - 1` the finish line could not be crossed by any car at any
   *   speed. Every run reached the end of the road and sat there while the
   *   recovery logic put it back on the road, over and over — 36 times in the
   *   first reference lap, all of them between 4,709 m and 4,713 m of a
   *   4,719 m stage. The unit tests passed throughout, because they fed a
   *   continuous distance that reached the length exactly.
   */
  constructor(
    private readonly stageId: string,
    private readonly lengthMetres: number,
    finishAt = lengthMetres - 1,
  ) {
    this.best = loadBest(stageId);
    this.finishAt = finishAt;
    // Sectors are counted to the LINE, not to a length the car never reaches.
    // Counting to the length gave a stage whose finish landed exactly on a
    // 500 m boundary two final splits at the same time: the boundary fired,
    // and then the extra sector clamped to the same distance and fired again.
    this.sectors = Math.max(1, Math.ceil(finishAt / SECTOR_METRES));
  }

  /** Skip the countdown and go green now. The reference-lap harness uses this:
   *  the lights are race presentation, not part of the stage being measured. */
  start(): void {
    this.countdown = 0;
    this.phase = 'running';
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
      // unrecorded: the finish closed the race before the boundary could be
      // crossed.
      distanceMetres >= Math.min(this.nextSector * SECTOR_METRES, this.finishAt)
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

    if (distanceMetres >= this.finishAt) this.finish();
  }

  /** The time that counts: driving plus §11 penalties. */
  get clock(): number {
    return this.elapsed + this.penalty;
  }

  private finish(): void {
    if (this.phase === 'finished') return;
    this.phase = 'finished';
    const raw = this.elapsed;
    const total = raw + this.penalty;
    const previous = this.best?.total ?? null;
    const isBest = previous === null || total < previous;
    this.result = { total, raw, penalty: this.penalty, isBest, previous };
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
