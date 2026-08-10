/* ARE THE COMMITTED ARTIFACTS STILL WHAT THEIR GENERATORS PRODUCE?
 *
 * Two tracks and the docs images are GENERATED — `make:harbour`,
 * `make:proving-ground`, `make:sets`, `make:shots` — and then committed, because
 * the game ships the JSON and the docs ship the PNGs. Which means the committed
 * copy and the generator can disagree, and nothing anywhere would notice:
 *
 *   - edit `harbour.json` by hand (or in the editor, and export over it) and the
 *     generator silently becomes a lie about how that track was made;
 *   - change the generator and forget to re-run it, and the committed track is
 *     from the old one. `verify:worlds` would still pass, happily fingerprinting
 *     the stale file.
 *
 * Both have a shape the other checks cannot see, because every other check reads
 * the committed artifact and asks whether it is CONSISTENT. This one asks
 * whether it is CURRENT.
 *
 * NON-DESTRUCTIVE. It snapshots each output, runs the generator, compares, and
 * puts the original back whatever happens — including on a crash — so running
 * the check never changes what you are about to commit.
 *
 *   node tools/verify-generated.mjs
 *
 * The image generators need a browser and take a couple of minutes, so they are
 * off by default. `--images` includes them.
 *
 * THE IMAGES ARE COMPARED AS PIXELS, NOT BYTES, and that is not laziness — the
 * renderer is not byte-deterministic. Two runs of `make:shots` back to back, on
 * the same commit, produce different files: a scatter of edge pixels lands
 * differently each time. Measured, that noise is 0.01% of subpixels off by more
 * than 8/255. One prop-sized region changing is 0.53%, and a different camera
 * is 75%. So the thresholds below sit an order of magnitude above the noise and
 * an order of magnitude below the smallest change worth catching. A byte
 * comparison here fails every single time and teaches you to ignore it.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, readdirSync, statSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { compare } from './png.mjs';

// above the rasteriser's jitter, below one prop changing
const MEAN = 0.05;   // mean absolute subpixel difference
const MOVED = 0.15;  // % of subpixels off by more than 8/255

const WITH_IMAGES = process.argv.includes('--images');
let fails = 0;
const check = (ok, label, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) fails++;
};

const sha = (buf) => createHash('sha256').update(buf).digest('hex').slice(0, 12);

/** Every file under a set of paths, as path -> bytes. */
function snapshot(paths) {
  const out = new Map();
  for (const p of paths) {
    if (statSync(p, { throwIfNoEntry: false })?.isDirectory()) {
      // `.was` is this tool's own held-back copy, not an output
      for (const f of readdirSync(p)) {
        if (f.endsWith('.was')) continue;
        out.set(join(p, f), readFileSync(join(p, f)));
      }
    } else if (statSync(p, { throwIfNoEntry: false })) {
      out.set(p, readFileSync(p));
    }
  }
  return out;
}

/* Regenerating writes over the committed file, so the comparison has to happen
 * against a copy held in memory and the original has to go back — the generator
 * output lives in the same place as the thing it is being checked against. */
function verify(name, script, outputs, { pixels = false } = {}) {
  const before = snapshot(outputs);
  let restored = false;
  const restore = () => {
    if (restored) return;
    restored = true;
    for (const [p, buf] of before) writeFileSync(p, buf);
  };
  const scratch = (p) => `${p}.was`;
  try {
    // pixel comparison needs both versions on disk at once to decode them
    if (pixels) for (const [p, buf] of before) writeFileSync(scratch(p), buf);
    execFileSync('node', [script], { stdio: 'pipe' });
    const after = snapshot(outputs);
    const changed = [];
    for (const [p, buf] of after) {
      const was = before.get(p);
      if (!was) { changed.push(`${p} is NEW`); continue; }
      if (was.equals(buf)) continue;
      if (!pixels) { changed.push(`${p} ${sha(was)} -> ${sha(buf)}`); continue; }
      const d = compare(scratch(p), p);
      if (d.resized) changed.push(`${p} resized ${d.resized}`);
      else if (d.mean > MEAN || d.moved > MOVED) {
        changed.push(`${p} mean ${d.mean.toFixed(3)} / ${d.moved.toFixed(2)}% moved`);
      }
    }
    for (const p of before.keys()) if (!after.has(p)) changed.push(`${p} was DELETED`);
    restore();
    check(changed.length === 0, `${name} is up to date with ${script}`,
      changed.length ? changed.slice(0, 4).join(' | ')
        : `${after.size} file(s) ${pixels ? 'within tolerance' : 'identical'}`);
  } catch (e) {
    restore();
    check(false, `${name}: ${script} ran`, String(e.message).split('\n')[0].slice(0, 120));
  } finally {
    restore();
    if (pixels) for (const p of before.keys()) rmSync(scratch(p), { force: true });
  }
}

verify('harbour.json', 'tools/make-harbour.mjs', ['src/data/tracks/harbour.json']);
verify('proving-ground.json', 'tools/make-proving-ground.mjs', ['src/data/tracks/proving-ground.json']);

if (WITH_IMAGES) {
  verify('the component sheets', 'tools/make-set-sheets.mjs', ['docs/sets'], { pixels: true });
  verify('the track shots', 'tools/make-shots.mjs', [
    'docs/harbour.png', 'docs/harbour-quay.png',
    'docs/harbour-frontage.png', 'docs/harbour-vineyard.png',
  ], { pixels: true });
} else {
  console.log('SKIP  the docs images (browser, ~2 min) — pass --images to include them');
}

console.log(fails ? `\n${fails} FAILED` : '\nevery generated artifact matches its generator');
process.exit(fails ? 1 : 0);
