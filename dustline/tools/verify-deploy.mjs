/* DOES THE DEPLOYED SITE ACTUALLY WORK?
 *
 * Everything else in `tools/` checks the source. This checks THE THING A
 * VISITOR GETS: the committed build, served the way GitHub Pages serves a
 * project site — from a `/racing-shooter/` sub-path, not from the root.
 *
 * That prefix is the whole point. A page that works when served at `/` can
 * still break on Pages, because every absolute path in it resolves one level
 * too high; the failure is invisible locally and total once deployed. The
 * server here refuses to serve anything outside the prefix, which turns that
 * class of bug from "nobody noticed" into a 404 in this output.
 *
 * It clicks through everything a visitor can reach: the admin page and every
 * link and contact sheet on it, the editor, all three built-in tracks in the
 * real game, and the other game at the repository root.
 *
 *   npx vite build          # the COMMITTED build is what gets served
 *   node tools/verify-deploy.mjs
 */
import { createServer } from 'node:http';
import { readFile, stat, readdir } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { chromium } from 'playwright-core';

const ROOT = '/home/user/racing-shooter';
const PREFIX = '/racing-shooter';
const PORT = 8911;
const MIME = { '.html':'text/html', '.js':'text/javascript', '.mjs':'text/javascript',
  '.json':'application/json', '.css':'text/css', '.png':'image/png', '.svg':'image/svg+xml',
  '.wasm':'application/wasm', '.webmanifest':'application/manifest+json', '.mp3':'audio/mpeg',
  '.jpg':'image/jpeg', '.ico':'image/x-icon' };

const server = createServer(async (req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (!p.startsWith(PREFIX)) { res.writeHead(404); return res.end('outside prefix'); }
  p = p.slice(PREFIX.length) || '/';
  let f = join(ROOT, p);
  try {
    if ((await stat(f)).isDirectory()) f = join(f, 'index.html');
  } catch { res.writeHead(404); return res.end('not found'); }
  try {
    const body = await readFile(f);
    res.writeHead(200, { 'content-type': MIME[extname(f)] ?? 'application/octet-stream' });
    res.end(body);
  } catch { res.writeHead(404); res.end('not found'); }
});
await new Promise((r) => server.listen(PORT, r));
const BASE = `http://localhost:${PORT}${PREFIX}`;

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });

let fails = 0;
const check = (ok, label, detail='') => { console.log(`${ok?'PASS':'FAIL'}  ${label}${detail?` — ${detail}`:''}`); if (!ok) fails++; };

async function visit(path, ready, timeout = 120000) {
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  const errs = [];
  p.on('pageerror', e => errs.push(e.message.split('\n')[0]));
  p.on('response', r => { if (r.status() >= 400) errs.push(`HTTP ${r.status()} ${r.url().replace(BASE,'')}`); });
  await p.goto(BASE + path, { waitUntil: 'load' });
  let info = null;
  if (ready) info = await p.waitForFunction(ready, null, { timeout }).then(h => h.jsonValue()).catch(e => ({ error: e.message.slice(0,80) }));
  return { p, errs, info };
}

// 1. the admin page, and that every link on it resolves
{
  const { p, errs } = await visit('/admin/', null);
  const links = await p.$$eval('a.card', as => as.map(a => a.getAttribute('href')));
  const bad = [];
  for (const href of links) {
    const u = new URL(href, BASE + '/admin/').toString();
    const r = await p.request.get(u);
    if (!r.ok()) bad.push(`${href} -> ${r.status()}`);
  }
  const imgs = await p.$$eval('.sets img, .sets figure img', is => is.map(i => i.getAttribute('src')));
  const badImg = [];
  for (const src of imgs) {
    const r = await p.request.get(new URL(src, BASE + '/admin/').toString());
    if (!r.ok()) badImg.push(`${src} -> ${r.status()}`);
  }
  check(errs.length === 0, 'admin page loads clean', errs.slice(0,3).join(' | '));
  check(bad.length === 0, `every admin link resolves (${links.length})`, bad.join(' | '));
  check(badImg.length === 0, `every sheet image resolves (${imgs.length})`, badImg.slice(0,4).join(' | '));

  // AND THE PAGE LISTS EVERY SHEET THERE IS. Resolving only catches a link to a
  // sheet that is gone; the opposite — a sheet that exists and is linked from
  // nowhere — is invisible, and it is the likelier one, because sheet filenames
  // carry their page count and a category growing past nine renames them.
  const onDisk = (await readdir(join(ROOT, 'dustline/docs/sets'))).filter((f) => f.endsWith('.png')).sort();
  const linked = new Set(imgs.map((s) => s.split('/').pop()));
  const unlisted = onDisk.filter((f) => !linked.has(f));
  check(unlisted.length === 0,
    `the admin page lists every sheet in docs/sets (${onDisk.length})`, unlisted.join(', '));
  await p.close();
}

// 2. the editor, booted from the committed build
{
  const { p, errs, info } = await visit('/play-dustline/editor.html',
    () => window.__editor?.preview?.terrain ? {
      components: window.__editor.templateIds().length,
      tracks: window.__editor.builtInTracks().map(t => t.id),
    } : null);
  await p.waitForTimeout(2500);
  check(!info?.error && info?.components > 100, 'editor boots with the full palette',
    info?.error ?? `${info?.components} components, tracks: ${info?.tracks?.join(', ')}`);
  check(errs.length === 0, 'editor has no page errors', errs.slice(0,3).join(' | '));
  await p.close();
}

// 3. every built-in track, in the GAME
for (const id of ['dustbowl', 'proving-ground', 'harbour']) {
  const { p, errs, info } = await visit(`/play-dustline/index.html?track=${id}`,
    () => window.__dust?.track ? {
      id: window.__dust.track.id, name: window.__dust.track.name,
      racers: window.__dust.racers?.length ?? 0,
      tris: window.__dust.renderer?.info?.render?.triangles ?? 0,
    } : null);
  await p.waitForTimeout(3000);
  const t = await p.evaluate(() => ({ tris: window.__dust.renderer.info.render.triangles,
    calls: window.__dust.renderer.info.render.calls }));
  check(info?.id === id && info?.racers >= 3, `game runs ${id}`,
    `${info?.name}, ${info?.racers} racers, ${t.tris.toLocaleString()} tris / ${t.calls} draws`);
  check(errs.length === 0, `${id} has no page errors`, errs.slice(0,3).join(' | '));
  await p.close();
}

// 4. the other game at the repo root
{
  const { p, errs } = await visit('/', null);
  await p.waitForTimeout(4000);
  const real = errs.filter(e => !/favicon/i.test(e));
  check(real.length === 0, 'IGNITE RALLY at the root loads clean', real.slice(0,3).join(' | '));
  await p.close();
}

await b.close();
server.close();
console.log(fails ? `\n${fails} FAILED` : '\nthe deployed site works end to end');
process.exit(fails ? 1 : 0);
