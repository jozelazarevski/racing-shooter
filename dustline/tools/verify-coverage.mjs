/* DOES THE SUITE ACTUALLY COVER THE GAME — AND DOES IT TELL THE TRUTH ABOUT
 * WHAT IT COVERED?
 *
 * This is the check that keeps the other checks honest. Every other tool in
 * this folder measures the game. This one measures the tools, because the most
 * expensive bug in v1 was not in the game at all: it was in the harness that
 * declared the game clean.
 *
 * WHAT HAPPENED, IN v1'S OWN NUMBERS.
 *
 *   BUGS.md #6 — `tests/playtest-all.mjs:11` looped
 *   `for (let lvl = 1; lvl <= 28; lvl++)` on a 57-world roster, and
 *   `tests/test-affinity.mjs:32,147` stopped at `lvl <= 21`. Worlds 29-57 had
 *   NEVER BEEN SWEPT — and six of the eight worst worlds in the whole report
 *   live in that range. The suite passed. The suite had never looked.
 *
 *   COORDINATION.md — the canonical roster was `LEVELS` in `src/track.js` (60
 *   worlds) while `src/world/levels.js` was a stale 57-entry copy that nothing
 *   in `src/` imported. A sweep that reported "57 worlds driven" silently
 *   missed CITADEL BAY, CLIFF KNOT and SEA CLIFF RUN. Two rosters, one of them
 *   fiction, and the tests were reading the fiction.
 *
 *   BUGS.md #3 — "The first sweep said 6. That was the harness counting a list
 *   it had already truncated to six examples." The finding was four times worse
 *   than reported. A pass over a truncated set is not a smaller pass; it is a
 *   false one.
 *
 *   BUGS.md #8 and COORDINATION.md — three worlds were reported "lapping at
 *   half pace". Measured properly they were not; the autopilot was cutting
 *   hairpins. And the rule that came out of it, in capitals in COORDINATION.md:
 *   MEASURE FIXED-STEP OR MEASURE NOTHING. Headless SwiftShader draws these
 *   worlds at a few fps with `dt` capped at 50 ms, so a wall-clock probe runs
 *   the simulation at about 1/8 speed — `raceTime` read 1.8 s after 20 real
 *   seconds, and every wall-clock stall observation made before that discovery
 *   was an artifact of the renderer.
 *
 * WHY IT IS THIS FILE AND NOT A NOTE IN A README. The owner's complaint is one
 * word: "still". "I can still enter the mountains instead of hitting them."
 * "Still can enter." "I still don't see jumping across cracks and gorges."
 * Those are not sixteen bugs. They are fixes that did not hold — repaired in
 * one place, left live in another — and the reason they could keep coming back
 * is that the suite which said they were gone had never covered the places they
 * were still alive. "I keep on debugging the game non stop for things that can
 * be obviously working." A green suite over half a roster is worse than no
 * suite: it costs the same to run and it spends the owner's trust.
 *
 * WHAT IT CHECKS.
 *
 *   1. THE FOLDER IS THE ROSTER. `src/data/tracks/*.json` is globbed here, at
 *      run time, and `registry.ts` is checked to still glob it too. The moment
 *      the game's list and the folder are two different things, every count
 *      below is measuring the wrong set — which is exactly the `levels.js`
 *      trap, one repo later.
 *   2. EVERY COMMITTED TRACK IS DRIVEN IN THE REAL GAME by some tool, and the
 *      coverage is derived from what the tools actually do, not from what they
 *      say. A track no tool loads is named here.
 *   3. NO TOOL CARRIES A HARDCODED ROSTER OR ROSTER SIZE that disagrees with
 *      the folder — literal id lists, numeric loop bounds (`lvl <= 28`),
 *      `.length === N` comparisons, and prose that quantifies the roster in
 *      words, which goes stale the day another track arrives.
 *   4. NO CHECK REPORTS A PASS OVER A SET IT TRUNCATED — `.slice()` in the
 *      verdict argument of `check()`, and verdicts that are constants.
 *   5. ANYTHING THAT MEASURES SIMULATION PROGRESS DRIVES THE SIMULATION
 *      FIXED-STEP, via `__dust.fastForward` — and that hook is verified to
 *      still be fixed-step at the source, because if it quietly starts taking a
 *      wall-clock dt then every tool built on it becomes a wall-clock probe
 *      without one line of the tool changing.
 *   6. EVERY CHECKING TOOL IS REACHABLE FROM AN npm SCRIPT. A check nobody runs
 *      is `levels.js` again: present, plausible, and connected to nothing.
 *
 * NUMBERS AND WHERE THEY COME FROM. There is only one number in this file that
 * a check compares against, and it is not typed here: it is
 * `readdirSync('src/data/tracks')`.filter(json).length, counted at run time.
 * That is the whole design. A threshold you can nudge is a threshold somebody
 * nudges; a roster read from the folder cannot be nudged without adding or
 * deleting a track, which is the event this file exists to notice.
 *
 * WHAT IT CANNOT SEE — stated plainly, because a check that overclaims is the
 * bug it is trying to prevent:
 *   - IT NEVER DRIVES. It reads tool source, the track folder, the built
 *     bundle and package.json. It cannot tell you a track is DRIVABLE, only
 *     that some tool loads it. `verify-clearance`, `verify-terrain-integrity`
 *     and `verify-deploy` answer the drivability questions.
 *   - COVERAGE IS INFERRED FROM SOURCE, conservatively. A tool is credited with
 *     glob-derived coverage only if it navigates `index.html?track=${var}` AND
 *     enumerates from `builtInTracks()` or the tracks folder AND carries no
 *     literal roster of its own. A tool that reaches every track by some
 *     cleverer route than that is under-credited, and will show as SYNTHETIC.
 *     Under-crediting is the safe direction; over-crediting is how a harness
 *     lies.
 *   - THE PROSE SCAN ONLY CATCHES QUANTIFIED CLAIMS: a quantifier (all, every,
 *     the), then a count, then "tracks". A bare "two tracks are generated" is a
 *     true statement about a subset and is deliberately not matched, so a stale
 *     count written without a quantifier gets through. (Examples are spelled out
 *     that way rather than quoted here, because a file that quotes the pattern
 *     it hunts for reports itself — see the same reasoning under `split()`.)
 *   - THE FIXED-STEP CHECK IS A SOURCE TEST, not a measurement. It knows a tool
 *     reads a progress quantity and does not call `fastForward`. It cannot tell
 *     you that a tool which DOES call `fastForward` also, elsewhere, draws a
 *     conclusion from a wall-clock wait.
 *   - IT DOES NOT CHECK COVERAGE OF ANYTHING BUT TRACKS. Components have their
 *     own sweep in `components-smoke.mjs` §5; this file does not duplicate it.
 *   - LOCAL AND `?t=` TRACKS ARE OUT OF SCOPE. They are not committed, so there
 *     is nothing to be stale about.
 *
 *   cd dustline && node tools/verify-coverage.mjs
 *   cd dustline && node tools/verify-coverage.mjs --table   # the tool census
 */
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, basename } from 'node:path';

const TABLE = process.argv.includes('--table');

let fails = 0;
const check = (ok, label, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) fails++;
};

// ---------------------------------------------------------------------------
// source handling: code and comments are two different questions
// ---------------------------------------------------------------------------
//
// Half the checks below must look ONLY at executable code (a tool whose header
// prose says "lap" is not measuring lap progress) and half must look ONLY at
// comments (a stale count lives in prose). So each file is split into two
// strings of the SAME LENGTH as the original, with the other stream blanked to
// spaces — which keeps every index valid as an offset into the original, and
// therefore keeps line numbers exact in the report. A finding you cannot
// navigate to is a finding somebody ignores.
//
// REGEX LITERALS ARE BLANKED OUT OF THE CODE STREAM TOO, and that is not a
// nicety: a tool that HUNTS for the identifier `raceTime` necessarily contains
// the identifier `raceTime`, so without this the first thing this file does is
// report itself. The alternative — exempting this file by name — is the same
// thing as switching the check off for the one file nobody else is auditing.
// String literals are NOT blanked, because a hardcoded roster is a list of
// strings and finding those is the point.
//
// The `/` that starts a regex is told from division by what precedes it, which
// is the standard heuristic, plus the rule that a JS regex literal cannot span
// a line. Worst case a division is mistaken for a regex; the streams stay the
// same length either way, so the only cost is a blanked expression that none of
// these checks reads.
//
// `>` IS IN THE SET BECAUSE OF ARROW FUNCTIONS, and leaving it out was a real
// bug in this file, caught by the self-test below rather than by reading it:
// `(p) => /^(['"]).*\1$/s.test(p)` in `stringArrays` was not recognised as a
// regex, so the `'` inside the character class opened a string that ran on for
// a hundred lines, and every source scan downstream went quietly blind. That is
// the failure mode this whole file is about, committed by this file.
const BEFORE_REGEX = /[(,=:[!&|?{};>]\s*$|\b(return|typeof|case|of|in|do|else)\s*$/;
function split(src) {
  let code = '', comment = '';
  let i = 0;
  const n = src.length;
  const blank = (c) => (c === '\n' ? '\n' : ' ');
  while (i < n) {
    const c = src[i], d = src[i + 1];
    if (c === '/' && d === '/') {
      while (i < n && src[i] !== '\n') { comment += src[i]; code += blank(src[i]); i++; }
      continue;
    }
    if (c === '/' && d === '*') {
      const end = src.indexOf('*/', i + 2);
      const stop = end === -1 ? n : end + 2;
      for (; i < stop; i++) { comment += src[i]; code += blank(src[i]); }
      continue;
    }
    if (c === '/' && BEFORE_REGEX.test(code.slice(Math.max(0, code.length - 24)))) {
      // scan to the closing slash on this line, respecting escapes and classes
      let j = i + 1, cls = false, closed = -1;
      for (; j < n && src[j] !== '\n'; j++) {
        if (src[j] === '\\') { j++; continue; }
        if (src[j] === '[') cls = true;
        else if (src[j] === ']') cls = false;
        else if (src[j] === '/' && !cls) { closed = j; break; }
      }
      if (closed > i) {
        for (; i <= closed; i++) { code += blank(src[i]); comment += blank(src[i]); }
        continue;
      }
    }
    if (c === "'" || c === '"' || c === '`') {
      const q = c;
      code += c; comment += blank(c); i++;
      while (i < n) {
        if (src[i] === '\\') { code += src[i] + (src[i + 1] ?? ''); comment += blank(src[i]) + blank(src[i + 1] ?? ''); i += 2; continue; }
        code += src[i]; comment += blank(src[i]);
        const done = src[i] === q;
        i++;
        if (done) break;
      }
      continue;
    }
    code += c; comment += blank(c); i++;
  }
  return { code, comment };
}
const lineAt = (src, idx) => src.slice(0, idx).split('\n').length;

// ---------------------------------------------------------------------------
// 1. THE ROSTER IS THE FOLDER
// ---------------------------------------------------------------------------
const TRACK_DIR = 'src/data/tracks';
const trackFiles = readdirSync(TRACK_DIR).filter((f) => f.endsWith('.json')).sort();
const roster = [];
const badTracks = [];
for (const f of trackFiles) {
  try {
    const def = JSON.parse(readFileSync(join(TRACK_DIR, f), 'utf8'));
    if (typeof def.id !== 'string' || !def.id) { badTracks.push(`${f}: no id`); continue; }
    if (typeof def.name !== 'string' || !def.name) { badTracks.push(`${f}: no name`); continue; }
    roster.push({ file: f, id: def.id, name: def.name });
  } catch (e) {
    badTracks.push(`${f}: ${String(e.message).slice(0, 60)}`);
  }
}
const ROSTER_IDS = new Set(roster.map((t) => t.id));
const N = roster.length;

// A duplicate id makes one of the pair unreachable by `?track=<id>` and
// invisible to every id-keyed check in this folder — a coverage hole that no
// count would show, because the count would still be right.
const dupes = [...new Set(roster.map((t) => t.id).filter((id, i, a) => a.indexOf(id) !== i))];
check(badTracks.length === 0 && N > 0 && dupes.length === 0,
  `the committed roster is ${N} track${N === 1 ? '' : 's'}`,
  badTracks.length || dupes.length
    ? [...badTracks, ...dupes.map((d) => `duplicate id "${d}"`)].join(' | ')
    : roster.map((t) => `${t.id} (${t.file})`).join(', '));

// The game's own discovery has to be the same glob, or the folder stops being
// the roster and this whole file is auditing the wrong list. v1's spelling of
// this failure: `src/world/levels.js`, a 57-entry copy of a 60-world roster
// that nothing imported and that BUGS.md #6 recommended the suites read from.
const REGISTRY = 'src/tracks/registry.ts';
const regSrc = existsSync(REGISTRY) ? readFileSync(REGISTRY, 'utf8') : '';
const globsTracks = /import\.meta\.glob<?[^(]*\(\s*['"][^'"]*data\/tracks\/\*\.json['"]/.test(regSrc);
check(globsTracks,
  'the game still discovers tracks by globbing the folder, not from a written list',
  globsTracks ? `${REGISTRY} import.meta.glob('../data/tracks/*.json')`
    : `${REGISTRY} no longer globs data/tracks — a committed track can now be invisible to the game`);

// ---------------------------------------------------------------------------
// the tool suite
// ---------------------------------------------------------------------------
const TOOLS = 'tools';
const SELF = basename(new URL(import.meta.url).pathname);
const files = readdirSync(TOOLS).filter((f) => f.endsWith('.mjs')).sort();

const kindOf = (f) => {
  if (f.startsWith('make-')) return 'generator';
  if (f.startsWith('verify-') || f.endsWith('-smoke.mjs')) return 'check';
  return 'library';
};

// Every literal array whose contents are nothing but quoted strings. Nested
// brackets are excluded on purpose: an array of arrays is not a roster written
// out by hand, which is the only thing this is looking for.
function stringArrays(code) {
  const out = [];
  for (const m of code.matchAll(/\[[^[\]]*\]/g)) {
    const inner = m[0].slice(1, -1).trim();
    if (!inner) continue;
    const parts = inner.split(',').map((s) => s.trim()).filter(Boolean);
    if (!parts.length) continue;
    if (!parts.every((p) => /^(['"]).*\1$/s.test(p))) continue;
    out.push({ at: m.index, values: parts.map((p) => p.slice(1, -1)) });
  }
  return out;
}

const tools = files.map((f) => {
  const src = readFileSync(join(TOOLS, f), 'utf8');
  const { code, comment } = split(src);
  const arrays = stringArrays(code);
  // A ROSTER LITERAL is a literal list naming two or more real tracks. One id
  // on its own is a deliberate pick — `components-smoke` loads `harbour`
  // because it is the track with water on it — and a pick is not a roster.
  const rosterLits = arrays.filter((a) => a.values.filter((v) => ROSTER_IDS.has(v)).length >= 2);
  const navTemplate = /index\.html\?track=\$\{/.test(code);
  const enumerates = /builtInTracks\(\)/.test(code)
    || /readdirSync\(\s*['"`][^'"`]*data\/tracks/.test(code);
  const drivesGame = /__dust/.test(code) && /index\.html/.test(code);

  // Coverage is inferred CONSERVATIVELY and in this order. A tool that carries
  // its own literal roster is credited with that literal and nothing more, even
  // if it also calls `builtInTracks()` somewhere — `verify-deploy` does exactly
  // that (it prints the editor's track list in one check and drives a written
  // list of three in another), and crediting it with the glob would be this
  // file telling the same kind of lie it exists to catch.
  let source = 'none', covers = new Set();
  if (!drivesGame) source = '—';
  else if (rosterLits.length) {
    source = 'literal';
    covers = new Set(rosterLits.flatMap((a) => a.values).filter((v) => ROSTER_IDS.has(v)));
  } else if (navTemplate && enumerates) {
    source = 'glob';
    covers = new Set(ROSTER_IDS);
  } else source = 'synthetic';

  return { f, src, code, comment, kind: kindOf(f), arrays, rosterLits, drivesGame, source, covers };
});

// ---------------------------------------------------------------------------
// 0. THE SCANNER ITSELF IS IN SYNC
// ---------------------------------------------------------------------------
//
// Every source check in this file rests on `split()` keeping code and comments
// apart. When it loses sync — one unbalanced quote inside an unrecognised regex
// is enough — it does not throw and it does not report less: it reports NOTHING,
// because the patterns it hunts for stop being where it looks. A silent blinding
// of the audit is precisely the class this file exists to catch, so it is
// measured rather than assumed.
//
// The invariant is cheap and total: a line that is nothing but a `//` comment in
// the source must be blank in the code stream, and the two streams must be the
// same length as the file (which is what keeps every reported line number true).
const desync = [];
for (const t of tools) {
  if (t.code.length !== t.src.length || t.comment.length !== t.src.length) {
    desync.push(`${t.f}: streams are ${t.code.length}/${t.comment.length} against ${t.src.length} chars`);
    continue;
  }
  const s = t.src.split('\n'), c = t.code.split('\n');
  for (let i = 0; i < s.length; i++) {
    if (s[i].trim().startsWith('//') && c[i].trim().length) {
      desync.push(`${t.f}:${i + 1} comment leaked into the code stream — every scan below is now blind`);
      break;
    }
  }
}
check(desync.length === 0,
  `the code/comment scanner stayed in sync over all ${tools.length} tools`, desync.join(' | '));

if (TABLE) {
  const hdr = 'tool'.padEnd(32) + 'kind'.padEnd(11) + 'drives game'.padEnd(13)
    + 'roster source'.padEnd(15) + 'tracks covered';
  console.log(`\n${hdr}\n${'-'.repeat(hdr.length)}`);
  for (const t of tools) {
    console.log(t.f.padEnd(32) + t.kind.padEnd(11) + (t.drivesGame ? 'yes' : 'no').padEnd(13)
      + t.source.padEnd(15) + (t.covers.size ? [...t.covers].join(', ') : '—'));
  }
  console.log('');
}

// ---------------------------------------------------------------------------
// 2. EVERY COMMITTED TRACK IS DRIVEN IN THE REAL GAME
// ---------------------------------------------------------------------------
const gameTools = tools.filter((t) => t.drivesGame);
const reached = new Map();                       // id -> tools that load it
for (const t of gameTools) for (const id of t.covers) {
  reached.set(id, [...(reached.get(id) ?? []), t.f]);
}
const unreached = roster.filter((t) => !reached.has(t.id));
check(unreached.length === 0,
  `every committed track is loaded in the real game by some tool (${N} track${N === 1 ? '' : 's'})`,
  unreached.length
    ? `NEVER LOADED: ${unreached.map((t) => `${t.id} (${t.file})`).join(', ')} — `
      + 'this is BUGS.md #6: a world the suite has never seen is a world the owner finds bugs in'
    : roster.map((t) => `${t.id}<-${(reached.get(t.id) ?? []).length}`).join(' '));

// A suite that is complete only because somebody remembered to type the newest
// id is complete until the next time they forget. At least one tool has to get
// its list from the folder at run time, so that a track added tomorrow is
// driven tomorrow — BUGS.md #6's own recommended fix, one repo later.
const globTools = gameTools.filter((t) => t.source === 'glob');
check(globTools.length > 0,
  'at least one game tool derives its roster at run time rather than carrying one',
  globTools.length ? globTools.map((t) => t.f).join(', ')
    : 'every tool that loads the game names its tracks by hand — the suite will silently truncate '
      + 'the day a track is added, which is exactly how worlds 29-57 went unswept');

// ---------------------------------------------------------------------------
// 3. NO HARDCODED ROSTER, ROSTER SIZE, OR ROSTER CLAIM
// ---------------------------------------------------------------------------
const stale = [];

// (a) a written-out list of track ids that is missing one
for (const t of tools) {
  for (const a of t.rosterLits) {
    const named = new Set(a.values.filter((v) => ROSTER_IDS.has(v)));
    const missing = roster.filter((r) => !named.has(r.id)).map((r) => r.id);
    if (missing.length) {
      stale.push(`${t.f}:${lineAt(t.src, a.at)} lists ${named.size} of ${N} tracks, missing ${missing.join(', ')}`);
    }
  }
}

// (b) v1's actual defect, in its actual shape: a numeric bound on a loop over
// worlds. `for (let lvl = 1; lvl <= 28; lvl++)` on a 57-world roster.
const ROSTERISH = /\b(lvl|level|levels|world|worlds|track|tracks|roster|course|stage)\b/i;
for (const t of tools) {
  for (const m of t.code.matchAll(/for\s*\(([^)]*)\)/g)) {
    const head = m[1];
    if (!ROSTERISH.test(head)) continue;
    const bound = head.match(/(<=?)\s*(\d+)\b/);
    if (!bound) continue;
    const lim = Number(bound[2]);
    const covered = bound[1] === '<=' ? lim : lim - 1;   // iterations reached
    if (covered < N) {
      stale.push(`${t.f}:${lineAt(t.src, m.index)} loops over ${ROSTERISH.exec(head)[0]} `
        + `bounded by the literal ${lim} — reaches ${covered} of ${N}`);
    }
  }
}

// (c) a roster length compared against a number somebody typed
for (const t of tools) {
  for (const m of t.code.matchAll(/\b([A-Za-z_$][\w$]*)\s*\.\s*length\s*(===|!==|==|<=|<)\s*(\d+)\b/g)) {
    if (!ROSTERISH.test(m[1])) continue;
    const lim = Number(m[3]);
    const eq = m[2].startsWith('=') || m[2].startsWith('!');
    if ((eq && lim !== N) || (!eq && lim < N)) {
      stale.push(`${t.f}:${lineAt(t.src, m.index)} ${m[1]}.length ${m[2]} ${lim}, roster is ${N}`);
    }
  }
}
check(stale.length === 0,
  `no tool carries a hardcoded roster or roster size (roster is ${N}, read from ${TRACK_DIR}/)`,
  stale.join(' | '));

// (d) and no PROSE claims a count that is no longer true. Same reasoning as
// `verify-templates`' "every 'N components' in the docs says N": a count in
// prose reads as measured, so a drifted one is worse than none at all. Only
// QUANTIFIED claims are matched — a quantifier, a count, then the word — because
// "two tracks are generated" is a true statement about a subset. (Spelled out
// rather than quoted, so this file does not report itself.)
const WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
const CLAIM = /\b(?:all|every|the)\s+(one|two|three|four|five|six|seven|eight|nine|ten|\d+)\s+(?:built-in\s+|committed\s+|shipped\s+|)tracks?\b/gi;
const prose = [];
const proseSources = [
  ...tools.map((t) => ({ name: `${TOOLS}/${t.f}`, text: t.comment, whole: t.src })),
  ...['README.md', 'TRACKS.md', 'SPEC.md', 'CLAUDE.md', 'COMPONENTS.md', 'ART-DIRECTION.md', '../ARCHITECTURE.md']
    .filter((d) => existsSync(d))
    .map((d) => { const s = readFileSync(d, 'utf8'); return { name: d, text: s, whole: s }; }),
];
for (const s of proseSources) {
  for (const m of s.text.matchAll(CLAIM)) {
    const said = WORDS[m[1].toLowerCase()] ?? Number(m[1]);
    if (said !== N) prose.push(`${s.name}:${lineAt(s.whole, m.index)} "${m[0].trim()}" but there are ${N}`);
  }
}
check(prose.length === 0, `every quantified "all N tracks" in the tools and docs says ${N}`, prose.join(' | '));

// ---------------------------------------------------------------------------
// 4. NO CHECK REPORTS A PASS OVER A SET IT TRUNCATED
// ---------------------------------------------------------------------------
//
// BUGS.md #3: "The first sweep said 6. That was the harness counting a list it
// had already truncated to six examples; agent-sweep.mjs now counts before it
// slices. The finding is four times worse than first reported, not better."
//
// Slicing in the DETAIL argument is right and every tool here does it — you
// print four examples, not four hundred. Slicing in the VERDICT argument is the
// bug. So the two arguments are told apart properly: scan from `check(` to the
// first comma at depth zero, respecting nesting and strings.
function firstArg(code, from) {
  let depth = 0, i = from, out = '';
  while (i < code.length) {
    const c = code[i];
    if (c === '(' || c === '[' || c === '{') depth++;
    else if (c === ')' || c === ']' || c === '}') { if (depth === 0) break; depth--; }
    else if (c === ',' && depth === 0) break;
    out += c;
    i++;
  }
  return out;
}
const truncated = [];
const constant = [];
for (const t of tools) {
  if (t.kind !== 'check' && t.f !== SELF) continue;
  for (const m of t.code.matchAll(/\bcheck\s*\(/g)) {
    const arg = firstArg(t.code, m.index + m[0].length);
    const at = `${t.f}:${lineAt(t.src, m.index)}`;
    if (/\.\s*(slice|splice)\s*\(/.test(arg)) truncated.push(`${at} verdict is ${arg.trim().slice(0, 60)}`);
    // A verdict that is a literal cannot fail. `check(false, ...)` is the
    // legitimate one — a tool reporting that it could not run at all.
    const bare = arg.trim();
    if (/^(true|1|!0|!!1)$/.test(bare)) constant.push(`${at} verdict is the constant ${bare}`);
  }
}
check(truncated.length === 0 && constant.length === 0,
  'no check draws its verdict from a truncated list or a constant',
  [...truncated, ...constant].join(' | '));

// ---------------------------------------------------------------------------
// 5. MEASURE FIXED-STEP OR MEASURE NOTHING
// ---------------------------------------------------------------------------
//
// These identifiers only change as the simulation steps, so reading one is the
// act of measuring progress, and under SwiftShader every wall-clock reading of
// one is an artifact (COORDINATION.md: `raceTime` read 1.8 s after 20 real
// seconds). Comments are excluded from the scan on purpose — a header that
// explains the lap-crossing census is not measuring laps.
const PROGRESS = [
  [/\braceTime\b/, 'the race clock — v1 read 1.8 s of it after 20 real seconds under SwiftShader'],
  [/\blapFrac|\blapProgress|\.laps?\b/, 'lap progress — v1 quoted "laps per 60 s" and the 60 s was wall-clock'],
  [/\bspeedKmh\b/, 'speed — only meaningful at a known point in a known step sequence'],
  [/\bdistanceAlong\b/, 'distance along the lap — a progress quantity'],
];
const FF = /\bfastForward\s*\(/;
const wallClock = [];
const fixedStepTools = [];
for (const t of tools) {
  // only tools that actually load the game: nothing else HAS a simulation to
  // measure, and scanning the rest would flag any file that merely names one of
  // these identifiers — including this one.
  if (!t.drivesGame) continue;
  const found = PROGRESS.filter(([re]) => re.test(t.code));
  const ff = FF.test(t.code);
  if (ff) fixedStepTools.push(t.f);
  if (found.length && !ff) {
    wallClock.push(`${t.f} reads ${found.map(([, why]) => why.split(' — ')[0]).join('/')} `
      + 'but never drives the sim with the fixed-step hook — that reading is a renderer artifact, '
      + 'not a measurement');
  }
}
check(wallClock.length === 0,
  'nothing reads simulation progress without driving the simulation fixed-step',
  wallClock.length ? wallClock.join(' | ')
    : `${gameTools.length} tool(s) load the game; ${fixedStepTools.length} drive it `
      + `(${fixedStepTools.join(', ') || 'none — the rest read only static state: colliders, instance '
        + 'matrices, track identity, racer count'})`);

// And the hook they would drive it with must still BE fixed-step. If
// `fastForward` ever starts taking a wall-clock dt, every tool built on it
// becomes a wall-clock probe without a single line of the tool changing — the
// silent regression this whole file is about, in the one place it would do the
// most damage.
const MAIN = 'src/main.ts', LOOP = 'src/core/loop.ts';
const mainSrc = existsSync(MAIN) ? readFileSync(MAIN, 'utf8') : '';
const loopSrc = existsSync(LOOP) ? readFileSync(LOOP, 'utf8') : '';
const ffDecl = mainSrc.match(/fastForward:[^\n]*\n?[^\n]*/);
const ffFixed = !!ffDecl && /FIXED_DT/.test(ffDecl[0]) && !/\bdt\b\s*\)/.test(ffDecl[0].replace(/FIXED_DT/g, ''));
const dtFixed = /FIXED_DT\s*=\s*1\s*\/\s*FIXED_HZ/.test(loopSrc);
check(ffFixed && dtFixed,
  'the headless drive hook is still fixed-step',
  ffFixed && dtFixed
    ? `${MAIN}:${ffDecl ? lineAt(mainSrc, mainSrc.indexOf(ffDecl[0])) : '?'} `
      + `fastForward steps FIXED_DT; ${LOOP} FIXED_DT = 1 / FIXED_HZ`
    : !ffDecl ? `${MAIN} no longer exposes __dust.fastForward — nothing can drive the sim fixed-step`
      : !ffFixed ? `${MAIN} fastForward no longer steps FIXED_DT`
        : `${LOOP} FIXED_DT is no longer 1 / FIXED_HZ`);

// ---------------------------------------------------------------------------
// 6. THE BUILT BUNDLE THE BROWSER TOOLS SERVE CARRIES EVERY TRACK
// ---------------------------------------------------------------------------
//
// Every browser tool reads `../play-dustline`, not `src/`. `builtInTracks()`
// inside that page is the glob AS OF THE LAST `vite build`. So a track can be
// committed, globbed by `registry.ts`, counted by every check above — and still
// be absent from the world the browser tools actually measure, which would let
// a glob-derived tool report a confident, complete-looking pass over a roster
// short by one. That is BUGS.md #6 again, one level down, and nothing else here
// would notice it.
const DIST = '../play-dustline';
const distAssets = existsSync(join(DIST, 'assets'))
  ? readdirSync(join(DIST, 'assets')).filter((f) => f.endsWith('.js')) : [];
if (!distAssets.length) {
  check(false, 'the built bundle carries every committed track',
    `no build at ${DIST}/assets — run \`npx vite build\` first; every browser tool in this folder `
    + 'measures that build, so without it none of them can be believed');
} else {
  const bundle = distAssets.map((f) => readFileSync(join(DIST, 'assets', f), 'utf8')).join('\n');
  // id AND name, because an id alone can collide with an unrelated string in a
  // 2 MB bundle (a track called "sand" would match a surface name); the pair
  // cannot plausibly appear by accident.
  const absent = roster.filter((t) => !(bundle.includes(`"${t.id}"`) && bundle.includes(`"${t.name}"`)));
  const built = statSync(join(DIST, 'assets', distAssets[0])).mtime.toISOString().slice(0, 16).replace('T', ' ');
  check(absent.length === 0,
    `the built bundle carries every committed track (${distAssets.length} chunk(s), built ${built})`,
    absent.length
      ? `MISSING FROM THE BUILD: ${absent.map((t) => t.id).join(', ')} — the browser tools would `
        + 'sweep the old roster and pass'
      : roster.map((t) => t.id).join(', '));
}

// ---------------------------------------------------------------------------
// 7. EVERY CHECK IS REACHABLE FROM AN npm SCRIPT
// ---------------------------------------------------------------------------
//
// COORDINATION.md's `src/world/levels.js`: a 57-entry roster that nothing
// imported, sitting next to the real one, looking exactly as authoritative. A
// checking tool that no script runs is the same object. It will be written,
// pass once by hand, and then rot — and the first anyone hears of it is the
// owner finding the bug it was written to prevent.
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const scripts = pkg.scripts ?? {};
const allScriptText = Object.values(scripts).join(' ; ');
const checkTools = tools.filter((t) => t.kind === 'check').map((t) => t.f);
const unwired = checkTools.filter((f) => !allScriptText.includes(`tools/${f}`));
check(unwired.length === 0,
  `every checking tool is reachable from an npm script (${checkTools.length} tools)`,
  unwired.length
    ? `NOT RUN BY ANYTHING: ${unwired.join(', ')} — add a script for each, and put it in `
      + '`gate` (source-only, fast) or `gate:full` (needs a build or a browser)'
    : Object.keys(scripts).filter((k) => k.startsWith('verify:') || k.startsWith('smoke:')).join(', '));

// ...and no script points at a tool that is gone. The opposite failure, and the
// cheaper one to make: renaming a tool leaves `npm run gate` exiting non-zero
// with a module-not-found, which people learn to run past.
const dangling = [];
for (const [name, body] of Object.entries(scripts)) {
  for (const m of body.matchAll(/tools\/([\w.-]+\.mjs)/g)) {
    if (!existsSync(join(TOOLS, m[1]))) dangling.push(`${name} -> tools/${m[1]}`);
  }
}
check(dangling.length === 0, 'every npm script points at a tool that exists', dangling.join(' | '));

// ---------------------------------------------------------------------------
// 8. EVERY GENERATED TRACK IS CHECKED AGAINST ITS GENERATOR
// ---------------------------------------------------------------------------
//
// `verify-generated.mjs` names its subjects by hand, which is the same shape as
// every other roster in this file: add `make-alpine.mjs`, commit `alpine.json`,
// and the committed track can drift from the generator that claims to produce
// it with nothing anywhere noticing. So the generators are discovered by what
// they WRITE, not by a list.
const genSrc = existsSync(join(TOOLS, 'verify-generated.mjs'))
  ? readFileSync(join(TOOLS, 'verify-generated.mjs'), 'utf8') : '';
const unchecked = [];
const generated = [];
for (const t of tools) {
  if (t.kind !== 'generator') continue;
  for (const m of t.code.matchAll(/writeFileSync\(\s*['"`](src\/data\/tracks\/[\w.-]+)['"`]/g)) {
    generated.push(`${t.f} -> ${m[1]}`);
    if (!genSrc.includes(m[1])) unchecked.push(`${m[1]} is written by ${t.f} and not verified by verify-generated.mjs`);
  }
}
check(unchecked.length === 0,
  `every generator that writes a committed track is checked against it (${generated.length})`,
  unchecked.length ? unchecked.join(' | ') : generated.join(', '));

// ---------------------------------------------------------------------------
console.log(`\n--- what this pass did NOT establish`);
console.log('    that any track is DRIVABLE — this file never starts a car. verify-clearance,');
console.log('    verify-terrain-integrity and verify-deploy answer that.');
console.log('    that a tool crediting itself with glob coverage really reached every track:');
console.log('    coverage is read from source, conservatively, and only ever under-credited.');
console.log('    that a fixed-step tool draws no OTHER conclusion from a wall-clock wait.');
console.log('    anything about local or ?t= tracks — they are not committed.');

console.log(fails ? `\n${fails} FAILED` : '\nthe suite covers the roster and says only what it measured');
process.exit(fails ? 1 : 0);
