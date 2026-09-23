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

/** A CAREER RECORD IS A DOCUMENT, NOT A SCORE — the same hazard `scenes`
 *  is protected from below. `mergeMax` takes the larger of every leaf, which
 *  is right for a counter and wrong for a record whose fields only mean
 *  anything together: A's round `{you:25, place:1, drivers:{IVO:18}}` merged
 *  leafwise with B's replay of it, `{you:10, place:5, drivers:{IVO:25}}`,
 *  gives `{you:25, place:5, drivers:{IVO:25}}` — a result no run produced,
 *  which paints the calendar cell P5 with no podium class while crediting a
 *  win's 25 points, and hands YOU and IVO the same 25 for one race, inflating
 *  the standings past the SEASON_PTS pool. So a record merge keeps the better
 *  WHOLE record. Records that rank equal are settled by content rather than
 *  by argument order, because the header promises A-into-B and B-into-A agree.
 *  `atLeastAsGood(x, y)` is true when x is no worse than y. */
function bestRecord(x, y, atLeastAsGood) {
  if (!x) return y;
  if (!y) return x;
  if (atLeastAsGood(x, y) && atLeastAsGood(y, x)) {
    return JSON.stringify(x) <= JSON.stringify(y) ? x : y;
  }
  return atLeastAsGood(x, y) ? x : y;
}

/** The union of two objects' keys, in an order that does not depend on which
 *  side was passed first — otherwise A-into-B and B-into-A would agree on
 *  every value and still serialise differently, which is what the suite's
 *  symmetry check actually compares. */
const unionKeys = (a, b) =>
  [...new Set([...Object.keys(a ?? {}), ...Object.keys(b ?? {})])].sort();

/** Union two `{key: record}` maps, keeping the better record under each key. */
function mergeRecordMap(a, b, atLeastAsGood) {
  if (!isObj(a) && !isObj(b)) return undefined;
  const out = {};
  for (const k of unionKeys(a, b)) {
    out[k] = bestRecord(a?.[k], b?.[k], atLeastAsGood);
  }
  return out;
}

/** `career.seasons[chapter][levelId] = {you, place, drivers}`: chapters and
 *  rounds union, and each round is kept whole from the run that scored the
 *  most points — exactly the rule the game applies live when a round is
 *  replayed (main.js `_recordSeasonRound`: `if (!old || rec.you > old.you)`).
 *  `_prizePaid` is not a record but a latch, and it has to OR: a unioned
 *  season whose flag came from the side that had not finished it yet would
 *  pay SEASON_PRIZE_CR a second time. */
function mergeSeasons(a, b) {
  if (!isObj(a) && !isObj(b)) return undefined;
  const out = {};
  for (const k of unionKeys(a, b)) {
    const ca = a?.[k] ?? {}, cb = b?.[k] ?? {};
    const ch = {};
    for (const id of unionKeys(ca, cb)) {
      if (id === '_prizePaid') { ch._prizePaid = !!(ca._prizePaid || cb._prizePaid); continue; }
      ch[id] = bestRecord(ca[id], cb[id], (x, y) => (x.you ?? 0) >= (y.you ?? 0));
    }
    out[k] = ch;
  }
  return out;
}

/** `career.seasonHistory` is an ARRAY OF OBJECTS, so `mergeMax`'s union arm
 *  (primitives only) never applied to it and it fell through to
 *  last-write-wins — one device's season titles simply vanished. History is
 *  append-only and holds one entry per chapter (main.js writes it under the
 *  `_prizePaid` latch), so the merge unions by chapter, keeps the better
 *  finish, and orders by when the season was lived; chapter breaks the tie so
 *  the array cannot depend on merge direction. */
function mergeHistory(a, b) {
  const la = Array.isArray(a) ? a : [], lb = Array.isArray(b) ? b : [];
  if (!la.length && !lb.length) return (a || b) ? [] : undefined;
  const best = new Map();
  for (const h of [...la, ...lb]) {
    if (!isObj(h)) continue;
    const k = String(h.k);
    best.set(k, bestRecord(best.get(k), h, (x, y) => (x.pos ?? 99) <= (y.pos ?? 99)));
  }
  return [...best.values()]
    .sort((x, y) => (x.when ?? 0) - (y.when ?? 0) || (x.k ?? 0) - (y.k ?? 0));
}

/** Merge two snapshots of the same career. Symmetric for progression;
 *  selection/cosmetics follow the newer side. */
export function mergeSnapshots(a, b) {
  if (!a) return b;
  if (!b) return a;
  // r363 (owner: "I want to delete all progress when I reset career. All
  // I 0"): RESET BEATS RESURRECTION. The symmetric union above never
  // deletes — which is right for two live careers and wrong for exactly
  // one case: the player pressed RESET CAREER, and the next pullMerge
  // handed their whole career straight back from the cloud row. A reset
  // stamps `career.resetAt`; any snapshot OLDER than the newest stamp is
  // pre-reset history and contributes nothing. A device that raced after
  // the reset is newer than the stamp and merges normally.
  const ra = Math.max(a.keys?.career?.resetAt ?? 0, b.keys?.career?.resetAt ?? 0);
  if (ra) {
    // ...and the test for "older than the stamp" used to be `(a.when ?? 0) <
    // ra`, which could never fire for the local side and so never deleted
    // anything. `when` is stamped at SNAPSHOT time (snapshotProfile above),
    // not at the time the career was last written, and `adopt` passes
    // `this.snapshot()` — taken microseconds ago — as `a`. The device still
    // holding the PRE-reset career therefore always read as "a device that
    // raced after the reset": the union below handed its whole `finished`
    // straight back and pullMerge pushed the resurrected career over the
    // cloud row, which is the owner's report verbatim — reset, and within
    // seconds every world, star and rung is back on both devices. What the
    // test needs is a MODIFICATION time, so it now reads `career.savedAt`,
    // which SyncService stamps only when a save actually changed the career
    // (_stampCareer) and which travels with the career in storage. A career
    // carrying no stamp at all was last written before the stamp existed,
    // i.e. before the reset, so `?? 0` blanks it — which is the verdict that
    // case wants.
    const blank = (s) => ({ ...s,
      keys: { career: { finished: {}, rungs: {}, resetAt: ra, savedAt: ra } } });
    const wrote = (s) => s.keys?.career?.savedAt ?? 0;
    if (wrote(a) < ra) a = blank(a);
    if (wrote(b) < ra) b = blank(b);
  }
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
      // Only `finished` used to get the best-of-both treatment; every other
      // career field came wholesale from the higher-`when` side, i.e. the
      // plain last-write-wins the header promises this module never applies
      // to progression. It was not even a clock race: `adopt` merges
      // `this.snapshot()`, stamped `Date.now()` microseconds earlier,
      // against whatever the other device pushed, so `newerIsB` is false on
      // essentially every real pull or import and the LOCAL career won every
      // time. Import a career onto a second device and its stars arrived
      // while its rungs, chapter trophies, season standings, season titles
      // and sponsors did not — "my trophies vanished but my stars didn't" —
      // and pullMerge then pushed that stripped career back over the cloud
      // row, taking the only remote copy with it. The fields below are
      // progression and each merges by its own rule. `job`, `jobsDone`,
      // `quests`, `feats` and anything a later feature parks here keep the
      // newer-side behaviour they have always had: `job` in particular is a
      // single active assignment, and taking the max of its `pay` and `need`
      // across two different jobs would invent one that was never offered.
      const career = { ...(newerIsB ? kb : ka), finished };
      const put = (k, v) => { if (v !== undefined) career[k] = v; };
      put('rungs', mergeMax(ka?.rungs, kb?.rungs, newerIsB));
      // a finale trophy only ever improves — a win upgrades a P3 and a P3
      // never downgrades a win (main.js: `!oldTr || rank < oldTr.place`) — so
      // the LOWER place is the better record and leafwise max would demote a
      // championship to the other device's P3
      put('trophies', mergeRecordMap(ka?.trophies, kb?.trophies,
        (x, y) => (x.place ?? 99) <= (y.place ?? 99)));
      put('sponsors', mergeRecordMap(ka?.sponsors, kb?.sponsors,
        (x, y) => (x.perRace ?? 0) >= (y.perRace ?? 0)));
      put('seasons', mergeSeasons(ka?.seasons, kb?.seasons));
      put('seasonHistory', mergeHistory(ka?.seasonHistory, kb?.seasonHistory));
      put('savedAt', Math.max(ka?.savedAt ?? 0, kb?.savedAt ?? 0) || undefined);
      // the reset stamp has to survive its own merge. `{ ...ka }` dropped it
      // whenever the side that won the spread was the one that had never
      // seen the reset — legitimately un-blanked, because it raced after the
      // stamp without ever receiving it — and pushNow then wrote a stampless
      // career back to the row, so the reset could never be made to stick.
      if (ra) career.resetAt = ra;
      keys.career = career;
    } else if (base === 'scenes') {
      // A SCENE IS A DOCUMENT, NOT A SCORE. `mergeMax` walks into objects and
      // takes the larger of every leaf, which for two different edits of the
      // same world would splice them together into a scene that was never
      // built — a delta from one and a building list from the other. Scenes
      // union by NAME, and where both devices hold the same name the newer
      // snapshot's copy wins whole.
      const out = { ...(newerIsB ? ka : kb), ...(newerIsB ? kb : ka) };
      keys.scenes = out;
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

export async function cloudPush(syncId, snap) {
  const r = await cloudFetch('ignite_profiles', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify([{ id: syncId, data: snap, updated_at: new Date().toISOString() }]),
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
    // What the stored career looked like before the player touched anything
    // this session. mergeSnapshots needs the career's MODIFICATION time to
    // tell a career raced after a RESET CAREER from pre-reset history, and no
    // such stamp existed anywhere in storage: the snapshot's `when` is
    // stamped when the snapshot is taken, which is always "now". This hook is
    // the one place every profile-scoped write passes through, so the stamp
    // is written from here — and the baseline is what stops a write of some
    // OTHER profile key, or the merge's own write, from reading as "the
    // career changed".
    const bootId = this._activeId();
    this._seen = { id: bootId, sig: this._careerRead(bootId)?.sig ?? null };
    // the save hook: main.js pings this whenever a profile key is written
    window.__igniteSyncDirty = () => { this._stampCareer(); this.schedulePush(); };
  }

  /** The profile whose keys are being written. `profile` is only set once
   *  main.js loads its state, which happens AFTER this service is built, so
   *  the registry's active id stands in until then. */
  _activeId() {
    return this.game.profile?.id ?? this.game.profiles?.active ?? null;
  }

  /** The stored career plus a comparable form of it with its own stamp
   *  removed, or null when there is nothing readable to stamp. */
  _careerRead(id) {
    if (id == null) return null;
    try {
      const career = JSON.parse(localStorage.getItem(`ir-p${id}-career`) ?? 'null');
      if (!isObj(career)) return null;
      const body = { ...career };
      delete body.savedAt;
      return { career, sig: JSON.stringify(body) };
    } catch { return null; }
  }

  /** Stamp `career.savedAt` when a save has actually changed the career.
   *  Compared against the baseline rather than stamped unconditionally
   *  because the hook also fires for `garage`, `cars` and the registry, and a
   *  device whose career is untouched must stay blankable by the reset merge.
   *  `applySnapshot` writes with raw setItem and never reaches the hook, so
   *  adopting a merge cannot forge a fresh stamp onto pre-reset history. */
  _stampCareer() {
    const id = this._activeId();
    const now = this._careerRead(id);
    if (!now) return;
    if (this._seen.id === id && this._seen.sig === now.sig) return;
    this._seen = { id, sig: now.sig };
    try {
      localStorage.setItem(`ir-p${id}-career`,
        JSON.stringify({ ...now.career, savedAt: Date.now() }));
    } catch { /* private mode */ }
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
    // the merge's own write is not a player save — re-baseline it, or the
    // next write of any profile key would see a changed career and stamp
    // `savedAt` onto a career the reset merge had just blanked
    this._seen = { id: this.game.profile.id,
      sig: this._careerRead(this.game.profile.id)?.sig ?? null };
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
    clearTimeout(this._t);
    this._t = setTimeout(() => this.pushNow(), 4000);   // settle a burst of saves
  }

  async pushNow() {
    if (!cloudConfigured()) return false;
    try {
      this.status = 'sync';
      const ok = await cloudPush(this.ensureSyncId(), this.snapshot());
      this.status = ok ? 'ok' : 'error';
      return ok;
    } catch { this.status = 'error'; return false; }
    finally { this.game._renderSyncStatus?.(); }
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
