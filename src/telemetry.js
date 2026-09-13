/* RALLY_PATCH_02 fix 0 — TELEMETRY, the gate for everything else.
 *
 * "The video analysis cost more than the fixes will; the next check must be
 * a log, not a recording." A 4000-event ring buffer of driving events, each
 * stamped with race time and lap. Dump with `window.__rally.dump()` (JSONL),
 * or the pause menu's COPY RACE LOG button, which puts it on the clipboard —
 * on iOS the share sheet is the transport.
 *
 * Event kinds (PATCH_02 §3 fix 0): damage, offmesh, airborne, nitro,
 * unstuck, rivalTarget, lapTrigger, startLights.
 * CORRIDOR v2.0 §15 adds: gate {id, passed, lateralM, kind} (step 1);
 * return / cut / slope / prop arrive with their build steps.
 */
const CAP = 4000;

export class Telemetry {
  constructor(game) {
    this.game = game;
    this.buf = new Array(CAP);
    this.head = 0;
    this.n = 0;
  }

  log(kind, data) {
    const g = this.game;
    // the stamp spreads LAST: a data payload carrying its own `kind` (the
    // gate events carry the SECTION kind) must never rename the event
    this.buf[this.head] = {
      t: +((g.raceTime ?? 0).toFixed(2)), lap: g.player?.lap ?? 0, ...data, kind,
    };
    this.head = (this.head + 1) % CAP;
    if (this.n < CAP) this.n++;
  }

  /** JSONL, oldest first. */
  dump() {
    const out = [];
    for (let i = 0; i < this.n; i++) {
      out.push(JSON.stringify(this.buf[(this.head - this.n + i + CAP) % CAP]));
    }
    return out.join('\n');
  }

  clear() { this.head = 0; this.n = 0; }
}

export function installRally(game) {
  const t = game.telemetry = new Telemetry(game);
  if (typeof window !== 'undefined') {
    window.__rally = {
      dump: () => t.dump(),
      clear: () => t.clear(),
      count: () => t.n,
    };
  }
  return t;
}
