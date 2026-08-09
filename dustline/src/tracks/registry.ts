// Where tracks come from.
//
// Three sources, in the order the game looks:
//
//   1. BUILT-IN — shipped with the build, imported as JSON. `dustbowl` is the
//      original world; anything the editor exports and you commit joins them.
//   2. LOCAL — tracks saved in the editor, in localStorage. These are yours,
//      they survive reloads, and they never leave the browser.
//   3. URL — a whole track packed into the address bar (`?t=<base64>`), which
//      is how you hand someone a track without a server, a login or a file.
//
// The point of (3) is bug reports. "The road goes through a mountain at the
// third corner" is a sentence; a link that opens exactly that world is a
// reproduction. The engine is deterministic per seed, so the link is enough.

import type { TrackDef } from './trackDef';
import { trackErrors } from './trackDef';
import dustbowl from '../data/tracks/dustbowl.json';

// JSON imports widen tuples to number[], so the cast goes through unknown.
const BUILT_IN: TrackDef[] = [dustbowl as unknown as TrackDef];

const LS_KEY = 'dustline.tracks.v1';
const LS_LAST = 'dustline.tracks.last';

export function builtInTracks(): TrackDef[] {
  return BUILT_IN.map((t) => structuredClone(t));
}

export function localTracks(): TrackDef[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as TrackDef[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];   // corrupt storage must never stop the game booting
  }
}

export function saveLocalTrack(def: TrackDef) {
  const all = localTracks().filter((t) => t.id !== def.id);
  all.push(def);
  localStorage.setItem(LS_KEY, JSON.stringify(all));
  localStorage.setItem(LS_LAST, def.id);
}

export function deleteLocalTrack(id: string) {
  localStorage.setItem(LS_KEY, JSON.stringify(localTracks().filter((t) => t.id !== id)));
}

export function allTracks(): TrackDef[] {
  const local = localTracks();
  const localIds = new Set(local.map((t) => t.id));
  // a local track SHADOWS a built-in of the same id: editing a shipped track
  // and saving it should change what you play, not silently do nothing
  return [...local, ...builtInTracks().filter((t) => !localIds.has(t.id))];
}

export function findTrack(id: string): TrackDef | null {
  return allTracks().find((t) => t.id === id) ?? null;
}

// ---- URL packing ----------------------------------------------------------

/** base64url of the JSON. Not compressed: a track is ~2 KB of JSON and packs to
 *  ~2.7 KB, which every browser and chat client carries without complaint. */
export function packTrack(def: TrackDef): string {
  const json = JSON.stringify(def);
  const bytes = new TextEncoder().encode(json);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function unpackTrack(packed: string): TrackDef | null {
  try {
    const b64 = packed.replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const def = JSON.parse(new TextDecoder().decode(bytes)) as TrackDef;
    return trackErrors(def).length ? null : def;
  } catch {
    return null;
  }
}

/** Resolve what the page should load, from its own URL.
 *
 *  Falls back rather than failing: a bad `?t=` or an unknown `?track=` loads
 *  the default instead of a blank screen, because a broken link should still
 *  put you in a car. */
export function resolveTrackFromUrl(search = location.search): TrackDef {
  const params = new URLSearchParams(search);
  const packed = params.get('t');
  if (packed) {
    const def = unpackTrack(packed);
    if (def) return def;
    console.warn('[tracks] ?t= did not decode to a valid track — loading the default');
  }
  const id = params.get('track');
  if (id) {
    const def = findTrack(id);
    if (def) return def;
    console.warn(`[tracks] no track "${id}" — loading the default`);
  }
  return builtInTracks()[0];
}
