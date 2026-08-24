// ---------------------------------------------------------------------------
// PROFILE SYNC — one career across devices and sessions.
//
// THE ASK: "create DB to store all user profiles and progress across
// different devices and sessions."
//
// The game is a static, offline-first PWA on GitHub Pages: there is no server
// of ours to put a database on, and shipping one would end offline play. So
// the database is A TABLE OF PROFILE SNAPSHOTS, reached through this module,
// with two transports over the same engine:
//
//   SYNC CODES  work today, no infrastructure: the whole profile is packed
//               into a compact string (deflate + base64url). Copy it on one
//               device, enter it on another. The merge engine below makes the
//               import safe to run in either direction, any number of times.
//
//   CLOUD       a hosted Postgres row per profile (Supabase's free tier, or
//               any PostgREST-compatible endpoint — see db/README.md for the
//               five-minute setup and the exact schema). Activated by filling
//               window.IGNITE_SYNC in index.html. Every profile carries an
//               unguessable 26-character syncId; that id IS the credential
//               (capability model), so two devices that share a sync code
//               share a row and stay converged automatically from then on.
//
// THE MERGE NEVER LOSES PROGRESS. Cross-device sync dies on the first "my
// stars vanished", so nothing here is last-write-wins for progression:
// per-world results keep the BEST of both sides (most stars, best place,
// highest score), credits keep the max, owned cars and upgrade levels union.
// Only cosmetic/selection state (which car is selected, name, color) follows
// the newer snapshot. A merge of A into B and B into A produce the same
// career, so the order devices come online in cannot matter.
// ---------------------------------------------------------------------------

const SNAP_V = 1;
const CODE_TAG = 'IGNITE1.';        // prefix marks compressed sync codes
const CODE_TAG_RAW = 'IGNITE0.';    // fallback for browsers without CompressionStream

// ---- snapshot ----------------------------------------------------------

/** Everything one profile owns, as one JSON-able object. `keys` is read by
 *  PREFIX, the same rule the wipe path uses: whatever a future feature parks
 *  under ir-p<id>-* travels with the career automatically. */
export function snapshotProfile(reg, id) {
  const p = reg.list.find((x) => x.id === id);
  if (!p) return null;
  const pre = `ir-p${id}-`;
  const keys = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith(pre)) continue;
      try { keys[k.slice(pre.length)] = JSON.parse(localStorage.getItem(k)); }
      catch { /* an unreadable key stays on the device rather than poisoning the snapshot */ }
    }
  } catch { /* private mode */ }
  return { v: SNAP_V, when: Date.now(),
    profile: { name: p.name, color: p.color, syncId: p.syncId ?? null }, keys };
}

/** Write a snapshot into a local profile id. Only called with MERGED data. */
export function applySnapshot(id, snap) {
  const pre = `ir-p${id}-`;
  try {
    for (const [base, val] of Object.entries(snap.keys ?? {})) {
      localStorage.setItem(pre + base, JSON.stringify(val));
    }
  } catch { /* private mode */ }
}

// ---- merge -------------------------------------------------------------

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);

/** Per-world career result: the best of both sides, field by field. A result
 *  only ever improves, so "best" is well-defined and merge order cannot
 *  matter. */
function mergeWorldResult(a, b) {
  if (!a) return b;
  if (!b) return a;
  return {
    ...a, ...b,
    place: Math.min(a.place ?? 99, b.place ?? 99),
    bestScore: Math.max(a.bestScore ?? 0, b.bestScore ?? 0),
    stars: Math.max(a.stars ?? 0, b.stars ?? 0),
  };
}

/** Generic progression merge for everything without a bespoke rule:
 *  numbers keep the max (upgrade levels, medals, high scores), arrays of
 *  primitives union (owned cars), objects recurse, and anything else follows
 *  whichever snapshot is newer. Conservative on purpose: the failure mode of
 *  "max" is a player keeping something twice, the failure mode of
 *  last-write-wins is a career quietly deleted by an old phone. */
function mergeMax(a, b, newerIsB) {
  if (a === undefined) return b;
  if (b === undefined) return a;
  if (typeof a === 'number' && typeof b === 'number') return Math.max(a, b);
  if (Array.isArray(a) && Array.isArray(b)
      && a.every((x) => typeof x !== 'object') && b.every((x) => typeof x !== 'object')) {
    return [...new Set([...a, ...b])];
  }
  if (isObj(a) && isObj(b)) {
    const out = {};
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
      out[k] = mergeMax(a[k], b[k], newerIsB);
    }
    return out;
  }
  return newerIsB ? b : a;
}

/** Merge two snapshots of the same career. Symmetric for progression;
 *  selection/cosmetics follow the newer side. */
export function mergeSnapshots(a, b) {
  if (!a) return b;
  if (!b) return a;
  const newerIsB = (b.when ?? 0) >= (a.when ?? 0);
  const newer = newerIsB ? b : a;
  const keys = {};
  for (const base of new Set([...Object.keys(a.keys ?? {}), ...Object.keys(b.keys ?? {})])) {
    const ka = a.keys?.[base], kb = b.keys?.[base];
    if (base === 'career') {
      const finished = {};
      for (const id of new Set([
        ...Object.keys(ka?.finished ?? {}), ...Object.keys(kb?.finished ?? {})])) {
        finished[id] = mergeWorldResult(ka?.finished?.[id], kb?.finished?.[id]);
      }
      keys.career = { ...(newerIsB ? kb : ka), finished };
    } else if (base === 'scenes') {
      // A SCENE IS A DOCUMENT, NOT A SCORE. `mergeMax` walks into objects and
      // takes the larger of every leaf, which for two different edits of the
      // same world would splice them together into a scene that was never
      // built — a delta from one and a building list from the other. Scenes
      // union by NAME, and where both devices hold the same name the newer
      // snapshot's copy wins whole.
      const out = { ...(newerIsB ? ka : kb), ...(newerIsB ? kb : ka) };
      keys.scenes = out;
    } else if (base === 'scenes-draft') {
      // THE DRAFT IS A DOCUMENT TOO — and it now reaches the row on every
      // edit, so two devices genuinely can hold two different drafts. Left
      // to `mergeMax` they splice: `base` is a number so the max of two
      // world ids wins, `t` takes the newer clock, and each scene field
      // follows whichever side is newer — a draft that was never sculpted
      // anywhere. The draft carries its own write time; the newer document
      // wins whole and the other is gone, which is exactly what a draft is.
      keys[base] = ((kb?.t ?? 0) >= (ka?.t ?? 0) ? kb : ka) ?? kb ?? ka;
    } else if (base === 'cars') {
      keys.cars = mergeMax(ka, kb, newerIsB);
      // the one field where max/union is wrong: you drive ONE car, and it is
      // whichever you picked most recently
      if (newer.keys?.cars?.selected) keys.cars.selected = newer.keys.cars.selected;
    } else {
      keys[base] = mergeMax(ka, kb, newerIsB);
    }
  }
  return { v: SNAP_V, when: Math.max(a.when ?? 0, b.when ?? 0),
    profile: { ...newer.profile, syncId: a.profile?.syncId ?? b.profile?.syncId ?? null },
    keys };
}

// ---- sync codes (no-infrastructure transport) --------------------------

const b64url = (bytes) => btoa(String.fromCharCode(...bytes))
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64url = (s) => {
  const t = s.replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(t + '='.repeat((4 - t.length % 4) % 4)), (c) => c.charCodeAt(0));
};

async function pipe(bytes, stream) {
  const out = new Response(new Blob([bytes]).stream().pipeThrough(stream));
  return new Uint8Array(await out.arrayBuffer());
}

export async function encodeSyncCode(snap) {
  const raw = new TextEncoder().encode(JSON.stringify(snap));
  try {
    const packed = await pipe(raw, new CompressionStream('deflate-raw'));
    return CODE_TAG + b64url(packed);
  } catch {
    return CODE_TAG_RAW + b64url(raw);   // pre-2023 Safari: bigger code, same data
  }
}

export async function decodeSyncCode(code) {
  const c = String(code ?? '').trim();
  let raw;
  if (c.startsWith(CODE_TAG)) {
    raw = await pipe(unb64url(c.slice(CODE_TAG.length)), new DecompressionStream('deflate-raw'));
  } else if (c.startsWith(CODE_TAG_RAW)) {
    raw = unb64url(c.slice(CODE_TAG_RAW.length));
  } else {
    throw new Error('not a sync code');
  }
  const snap = JSON.parse(new TextDecoder().decode(raw));
  if (snap.v !== SNAP_V || !isObj(snap.keys)) throw new Error('unrecognised sync payload');
  return snap;
}

// ---- cloud adapter (PostgREST/Supabase row-per-profile) ----------------

/** 26 chars of crockford-ish base32 ≈ 130 bits. The id is the credential:
 *  anyone holding it can read/write that one row and no other. That is the
 *  same trust model as the sync code itself — a secret you deliberately
 *  carry to your other device. */
export function newSyncId() {
  const A = 'abcdefghjkmnpqrstvwxyz0123456789';
  const b = crypto.getRandomValues(new Uint8Array(26));
  return [...b].map((x) => A[x % 32]).join('');
}

const cloudCfg = () => {
  const c = window.IGNITE_SYNC;
  return c && c.url && c.key ? c : null;
};
export const cloudConfigured = () => !!cloudCfg();

async function cloudFetch(path, opts = {}) {
  const c = cloudCfg();
  if (!c) return null;
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 8000);
  try {
    return await fetch(`${c.url.replace(/\/$/, '')}/rest/v1/${path}`, {
      ...opts, signal: ctl.signal,
      headers: {
        apikey: c.key, Authorization: `Bearer ${c.key}`,
        'Content-Type': 'application/json', ...(opts.headers ?? {}),
      },
    });
  } finally { clearTimeout(t); }
}

export async function cloudPull(syncId) {
  const r = await cloudFetch(`ignite_profiles?id=eq.${encodeURIComponent(syncId)}&select=data`);
  if (!r || !r.ok) return null;
  const rows = await r.json();
  return rows[0]?.data ?? null;
}

export async function cloudPush(syncId, snap, opts = {}) {
  const body = JSON.stringify([{ id: syncId, data: snap, updated_at: new Date().toISOString() }]);
  const r = await cloudFetch('ignite_profiles', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body,
    // A push flushed on the way out of the page must survive the page: only
    // keepalive requests do. The browser caps keepalive bodies at 64 KB, so
    // a heavyweight snapshot goes the ordinary way and takes its chances —
    // an oversized keepalive is REJECTED, which is strictly worse.
    ...(opts.unload && body.length < 60000 ? { keepalive: true } : {}),
  });
  return !!(r && r.ok);
}

// ---- the service the game talks to -------------------------------------

/** Debounced, merge-first cloud sync for the active profile. Quiet by
 *  design: offline, unconfigured, or a dead endpoint must never cost the
 *  player anything — localStorage stays the source of truth on this device
 *  and the cloud row converges when it can. */
export class SyncService {
  constructor(game) {
    this.game = game;
    this.status = cloudConfigured() ? 'idle' : 'off';
    this._t = null;
    this._retries = 0;
    // the save hook: main.js pings this whenever a profile key is written
    window.__igniteSyncDirty = () => this.schedulePush();
    // A DEBOUNCED PUSH MUST NOT DIE WITH THE TAB. Four seconds is the right
    // debounce for a burst of saves and exactly the wrong one for the last
    // save before the lid closes: the work is on this device and nowhere
    // else. pagehide is the one event every exit path fires (close, reload,
    // navigate, background-on-mobile), so a pending push is flushed there,
    // with keepalive so the request outlives the page.
    window.addEventListener('pagehide', () => this.flushPending(true));
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') this.flushPending(true);
    });
    // and a push that failed for want of a network fires again when the
    // network comes back, rather than waiting for the next edit
    window.addEventListener('online', () => {
      if (this.status === 'error') this.schedulePush();
    });
  }

  activeSyncId() {
    return this.game.profile?.syncId ?? null;
  }

  /** Give the active profile a cloud identity (first push or first import). */
  ensureSyncId() {
    const p = this.game.profile;
    if (!p.syncId) {
      p.syncId = newSyncId();
      this.game.saveProfiles();
    }
    return p.syncId;
  }

  snapshot() {
    return snapshotProfile(this.game.profiles, this.game.profile.id);
  }

  /** Merge `snap` (from a code or the cloud) into the ACTIVE profile and
   *  reload the game's in-memory state from storage. */
  adopt(snap) {
    const merged = mergeSnapshots(this.snapshot(), snap);
    applySnapshot(this.game.profile.id, merged);
    if (merged.profile?.syncId && !this.game.profile.syncId) {
      // importing a code links this device to the same cloud row
      this.game.profile.syncId = merged.profile.syncId;
      this.game.saveProfiles();
    }
    this.game.reloadProfileState();
    return merged;
  }

  schedulePush() {
    if (!cloudConfigured()) return;
    this._retries = 0;                 // a fresh edit gets a fresh retry budget
    clearTimeout(this._t);
    this._t = setTimeout(() => { this._t = null; this.pushNow(); }, 4000);   // settle a burst of saves
  }

  /** Run a pending debounced push RIGHT NOW — the page is going away, or a
   *  caller needs the row current. A no-op when nothing is pending, so it is
   *  safe to call from every hide/blur without spamming the endpoint. */
  flushPending(unload = false) {
    if (!this._t) return;
    clearTimeout(this._t);
    this._t = null;
    this.pushNow(unload);
  }

  async pushNow(unload = false) {
    if (!cloudConfigured()) return false;
    try {
      this.status = 'sync';
      const ok = await cloudPush(this.ensureSyncId(), this.snapshot(), { unload });
      this.status = ok ? 'ok' : 'error';
      if (ok) this._retries = 0;
      else this._retryLater();
      return ok;
    } catch { this.status = 'error'; this._retryLater(); return false; }
    finally {
      this.game._renderSyncStatus?.();
      // the editor's save chip reports the DB's answer, not this tab's hope
      this.game.editor?._cloudState?.(this.status);
    }
  }

  /** A failed push retries on its own — 8 s, 16 s, 32 s, then it stops and
   *  waits for the next edit or the `online` event. Capped because an
   *  endpoint still down after three backoffs is dead, not blinking, and
   *  hammering it forever costs battery for nothing. localStorage still
   *  holds everything. */
  _retryLater() {
    if (this._retries >= 3) return;
    this._retries += 1;
    clearTimeout(this._t);
    this._t = setTimeout(() => { this._t = null; this.pushNow(); }, 8000 * 2 ** (this._retries - 1));
  }

  /** Boot path: pull the row, merge, push the merge back. */
  async pullMerge() {
    if (!cloudConfigured() || !this.activeSyncId()) return false;
    try {
      this.status = 'sync';
      const remote = await cloudPull(this.activeSyncId());
      if (remote) this.adopt(remote);
      await this.pushNow();
      return true;
    } catch { this.status = 'error'; this.game._renderSyncStatus?.(); return false; }
  }
}
