/* Does the component system actually work, end to end?
 *
 * The claim being tested is not "the palette draws". It is: a component is one
 * file carrying geometry, physical rules and a preview; you can place it from
 * the editor; and the thing you placed exists in the GAME as a real object with
 * the collider its file declared.
 *
 *   npx vite build
 *   (cd ../play-dustline && python3 -m http.server 8903 &)
 *   node tools/components-smoke.mjs
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE || 'http://localhost:8903/';
const EXE = process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const browser = await chromium.launch({
  executablePath: EXE,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
const ctx = await browser.newContext({ viewport: { width: 1500, height: 950 } });

let fails = 0;
const check = (ok, label, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) fails++;
};

const errors = [];
const page = await ctx.newPage();
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message.split('\n')[0]}`));
page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text().slice(0, 140)}`); });
page.on('response', (r) => { if (r.status() >= 400) errors.push(`HTTP ${r.status()}: ${r.url()}`); });

await page.goto(`${BASE}editor.html`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__editor?.preview?.terrain, null, { timeout: 60000 });
await page.waitForTimeout(1200);

// ---- 1. every component is discovered and previews itself ----
const palette = await page.evaluate(() => {
  const items = [...document.querySelectorAll('.pitem')];
  return {
    count: items.length,
    categories: [...document.querySelectorAll('#palette h4')].map((h) => h.textContent),
    allHaveThumbs: items.every((el) => el.querySelector('img')?.src.startsWith('data:image/png')),
    names: items.map((el) => el.querySelector('span').textContent),
  };
});
check(palette.count >= 8 && palette.allHaveThumbs,
  'every component is discovered and renders its own preview',
  `${palette.count} components in ${palette.categories.length} categories`);
check(palette.categories.length >= 3, 'components are grouped by category', palette.categories.join(', '));

// ---- 2. the scattered world is built from components ----
const scattered = await page.evaluate(() => window.__editor.preview.componentCounts);
check(Object.keys(scattered).length >= 3 && (scattered.pine ?? 0) > 100,
  'scatter layers build through the component system',
  Object.entries(scattered).map(([k, v]) => `${k}=${v}`).join(' '));

// ---- 3. placing a component from the palette ----
const placed = await page.evaluate(async () => {
  const e = window.__editor;
  const before = (e.def.props ?? []).length;
  // the armed-click path, which is what the palette's click handler drives
  document.querySelector('.pitem').click();                 // arm the first component
  const canvas = document.getElementById('map');
  const r = canvas.getBoundingClientRect();
  canvas.dispatchEvent(new PointerEvent('pointerdown', {
    bubbles: true, clientX: r.left + r.width * 0.5, clientY: r.top + r.height * 0.5,
    button: 0, pointerId: 1,
  }));
  await new Promise((res) => setTimeout(res, 1200));
  const list = e.def.props ?? [];
  return { before, after: list.length, last: list[list.length - 1] ?? null };
});
check(placed.after === placed.before + 1 && placed.last,
  'clicking an armed component places it',
  placed.last ? `${placed.last.template} at (${placed.last.x}, ${placed.last.z}) scale ${placed.last.scale}` : '');

// ---- 4. it reaches the preview as real geometry ----
const inPreview = await page.evaluate(async () => {
  const e = window.__editor;
  await new Promise((r) => setTimeout(r, 900));
  const id = e.def.props[e.def.props.length - 1].template;
  return { id, count: e.preview.componentCounts[id] ?? 0 };
});
check(inPreview.count > 0, 'the placed component is built into the preview world',
  `${inPreview.id} instances: ${inPreview.count}`);

// ---- 5. physical rules travel with the component ----
const physics = await page.evaluate(() => {
  const e = window.__editor;
  // place one of each solid trackside component beside the start line
  const put = (template, x, z, scale) => e.commit((d) => {
    d.props = d.props ?? [];
    d.props.push({ template, x, z, rot: 0, scale });
  }, 'test');
  put('tyreStack', 40, -40, 1);
  put('boulder', 60, -40, 2);
  put('bush', 80, -40, 1);          // declared non-solid: must get NO collider
  put('rock', 100, -40, 0.6);       // below its solidity threshold: NO collider
  put('rock', 120, -40, 1.5);       // above it: collider
  return (e.def.props ?? []).length;
});
check(physics > 0, 'placed a physics test set', `${physics} props total`);

// ---- 6. the GAME loads them and builds the declared colliders ----
const shareUrl = await page.evaluate(() => {
  const json = JSON.stringify(window.__editor.def);
  const bytes = new TextEncoder().encode(json);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return `index.html?t=${btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}`;
});

const gamePage = await ctx.newPage();
const gameErrors = [];
gamePage.on('pageerror', (e) => gameErrors.push(e.message.split('\n')[0]));
await gamePage.goto(BASE + shareUrl, { waitUntil: 'load' });
await gamePage.waitForFunction(() => window.__dust?.track, null, { timeout: 90000 });

const game = await gamePage.evaluate(() => {
  const d = window.__dust;
  const props = d.track.props ?? [];
  // count colliders near each test prop: Rapier exposes them through the world
  const near = (x, z, r) => {
    let n = 0;
    d.world.forEachCollider((c) => {
      const t = c.translation();
      if (Math.hypot(t.x - x, t.z - z) < r) n++;
    });
    return n;
  };
  return {
    propCount: props.length,
    tyre: near(40, -40, 4),
    boulder: near(60, -40, 5),
    bush: near(80, -40, 4),
    smallRock: near(100, -40, 4),
    bigRock: near(120, -40, 4),
  };
});

check(game.propCount >= 6, 'the game loads every placed component', `${game.propCount} props`);
check(game.tyre > 0, 'a solid component gets its collider', `tyre stack: ${game.tyre}`);
check(game.boulder > 0, 'a solid component gets its collider', `boulder: ${game.boulder}`);
check(game.bush === 0, 'a component declared NOT solid gets no collider', `bush: ${game.bush}`);
check(game.smallRock === 0, 'a scale-dependent rule is respected below its threshold',
  `rock @0.6: ${game.smallRock} colliders`);
check(game.bigRock > 0, 'a scale-dependent rule is respected above its threshold',
  `rock @1.5: ${game.bigRock} colliders`);
check(gameErrors.length === 0, 'no page errors in the game', gameErrors.slice(0, 3).join(' | '));
check(errors.length === 0, 'no page errors in the editor', errors.slice(0, 4).join(' | '));

await browser.close();
console.log(fails ? `\n${fails} FAILED` : '\ncomponent smoke passed');
process.exit(fails ? 1 : 0);
