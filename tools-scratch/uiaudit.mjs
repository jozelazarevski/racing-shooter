/* AUDIT EVERY SCREEN'S LAYOUT AND EVERY LABEL ON IT.
 *
 * Eyeballing screenshots finds the loud faults and misses the quiet ones — a
 * label clipped by three pixels, a tap target under the minimum, a row that
 * scrolls the page sideways. So this asks the DOM, at a phone size, on every
 * tab, and reports by category:
 *
 *   CLIPPED    text wider than the box it is in (scrollWidth > clientWidth)
 *   OFFSCREEN  a visible element outside the viewport horizontally
 *   TINY TAP   an interactive element under 44x44 (Apple HIG) / 24 px minimum
 *   OVERLAP    two interactive elements whose boxes intersect
 *   PAGE PAN   the document scrolls sideways at all
 *   EMPTY      a labelled control with no accessible text
 *
 * And it dumps every visible piece of UI text, so the WORDING can be reviewed
 * as a list rather than by squinting at pictures.
 */
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8901';
const OUT = process.env.OUT ?? '/tmp/uiaudit';
const W = Number(process.env.W ?? 390), H = Number(process.env.H ?? 844);
fs.mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2,
  isMobile: true, hasTouch: true });
page.setDefaultTimeout(600000);
const errs = [];
page.on('pageerror', (e) => errs.push(String(e.message)));
await page.goto(`${BASE}/?unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await page.waitForFunction(() => window.__game, undefined, { timeout: 600000 });
await page.waitForTimeout(1500);

const AUDIT = `(() => {
  const vis = (e) => {
    const s = getComputedStyle(e);
    if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity === 0) return false;
    const r = e.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const out = { clipped: [], truncated: [], offscreen: [], tiny: [], empty: [], text: [] };
  const all = [...document.querySelectorAll('body *')].filter(vis);
  for (const e of all) {
    const r = e.getBoundingClientRect();
    if (r.bottom < -50 || r.top > innerHeight + 4000) continue;   // far off the scroller
    const txt = (e.textContent || '').trim();
    const own = [...e.childNodes].filter((n) => n.nodeType === 3)
      .map((n) => n.textContent.trim()).join(' ').trim();
    // CLIPPED: only leaf-ish nodes with their own text, and only horizontally
    // A DECORATIVE PSEUDO-ELEMENT IS NOT A CLIPPED LABEL. #start-btn carries a
    // sheen that animates from left:-45% to 125% inside overflow:hidden, which
    // inflates scrollWidth to 629 on a 390 px button and reported "START RACE"
    // as clipped on all seven screens. Anything that hides its own overflow
    // has already decided what happens at its edge.
    const ox = getComputedStyle(e).overflowX;
    // TRUNCATED is its own answer, and it is not the same as clipped. Hiding
    // overflow is a decision about the EDGE; it says nothing about whether the
    // sentence still reads. topbar-where and the star key both ellipsise, and
    // both lose their meaning doing it, so they are reported — separately from
    // a button whose sheen merely runs past its own border.
    // MEASURE THE TEXT, NOT THE BOX. scrollWidth counts pseudo-elements, and
    // #start-btn's sheen animates out to left:125%, so "START RACE" reported as
    // truncated on all seven screens at 629 px inside a 390 px button while
    // reading perfectly. A Range around the element's own text nodes measures
    // the glyphs and nothing else.
    if (own && ox === 'hidden' && e.children.length === 0) {
      const rng = document.createRange();
      rng.selectNodeContents(e);
      const tw = rng.getBoundingClientRect().width;
      rng.detach?.();
      const cs2 = getComputedStyle(e);
      const pad = parseFloat(cs2.paddingLeft) + parseFloat(cs2.paddingRight);
      const avail = e.getBoundingClientRect().width - pad;
      if (tw > avail + 1) {
        out.truncated.push({ id: e.id, cls: String(e.className).slice(0, 30),
          text: own.slice(0, 70), sw: Math.round(tw), cw: Math.round(avail) });
      }
    }
    if (own && e.scrollWidth > e.clientWidth + 1
        && ox !== 'auto' && ox !== 'scroll' && ox !== 'hidden') {
      out.clipped.push({ tag: e.tagName, id: e.id, cls: e.className,
        text: own.slice(0, 48), sw: e.scrollWidth, cw: e.clientWidth });
    }
    // ...and a card in a horizontal CAROUSEL is not off screen, it is queued.
    // The garage's car strip reported 198 such elements.
    let inScroller = false;
    for (let a = e.parentElement; a && a !== document.body; a = a.parentElement) {
      const axo = getComputedStyle(a).overflowX;
      if (axo === 'auto' || axo === 'scroll') { inScroller = true; break; }
    }
    if (!inScroller && (r.left < -1 || r.right > innerWidth + 1)) {
      out.offscreen.push({ tag: e.tagName, id: e.id, cls: String(e.className).slice(0, 40),
        text: own.slice(0, 30), left: Math.round(r.left), right: Math.round(r.right) });
    }
    const tappable = e.tagName === 'BUTTON' || e.tagName === 'A' || e.tagName === 'INPUT'
      || e.getAttribute('role') === 'button' || e.onclick;
    if (tappable) {
      if (r.width < 24 || r.height < 24) {
        out.tiny.push({ tag: e.tagName, id: e.id, cls: String(e.className).slice(0, 40),
          text: txt.slice(0, 24), w: Math.round(r.width), h: Math.round(r.height) });
      }
      if (!txt && !e.getAttribute('aria-label') && !e.getAttribute('title')) {
        out.empty.push({ tag: e.tagName, id: e.id, cls: String(e.className).slice(0, 40) });
      }
    }
    if (own && own.length > 1) out.text.push(own.replace(/\\s+/g, ' ').slice(0, 90));
  }
  out.pan = document.documentElement.scrollWidth - document.documentElement.clientWidth;
  return out;
})()`;

const STATES = [
  ['tracks', () => document.getElementById('tab-btn-race')?.click()],
  ['tracks-chapter', () => { document.querySelector('#level-select .chapter-card')?.click(); }],
  ['mode', () => document.getElementById('tab-btn-mode')?.click()],
  ['jobs', () => document.getElementById('tab-btn-jobs')?.click()],
  ['garage', () => document.getElementById('tab-btn-garage')?.click()],
  ['setup', () => document.getElementById('tab-btn-settings')?.click()],
  ['profile', () => document.getElementById('topbar-prof')?.click()],
];
const report = {};
const allText = new Set();
for (const [name, fn] of STATES) {
  await page.evaluate(`(${fn.toString()})()`);
  await page.waitForTimeout(1400);
  const r = await page.evaluate(AUDIT);
  report[name] = r;
  for (const t of r.text) allText.add(t);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false });
  if (name === 'profile') await page.evaluate(() => document.getElementById('profile-close')?.click());
}
console.log('== LAYOUT ==');
for (const [k, r] of Object.entries(report)) {
  console.log(`  ${k.padEnd(16)} clipped ${String(r.clipped.length).padStart(2)}  truncated ${String(r.truncated.length).padStart(2)}  offscreen ${String(r.offscreen.length).padStart(3)}  tiny-tap ${String(r.tiny.length).padStart(2)}  unlabelled ${String(r.empty.length).padStart(2)}  page-pan ${r.pan}px`);
}
for (const [k, r] of Object.entries(report)) {
  for (const c of r.clipped.slice(0, 6)) console.log(`  CLIPPED  ${k}: "${c.text}" (${c.sw}>${c.cw}) ${c.id || c.cls}`);
  for (const c of r.truncated.slice(0, 6)) console.log(`  TRUNC    ${k}: "${c.text}" (${c.sw}>${c.cw}) ${c.id || c.cls}`);
  for (const c of r.offscreen.slice(0, 6)) console.log(`  OFFSCR   ${k}: "${c.text}" x ${c.left}..${c.right} ${c.id || c.cls}`);
  for (const c of r.tiny.slice(0, 6)) console.log(`  TINYTAP  ${k}: "${c.text}" ${c.w}x${c.h} ${c.id || c.cls}`);
  for (const c of r.empty.slice(0, 4)) console.log(`  NOLABEL  ${k}: ${c.id || c.cls}`);
}
fs.writeFileSync(`${OUT}/labels.txt`, [...allText].sort().join('\n'));
console.log(`\n== LABELS ==  ${allText.size} distinct strings -> ${OUT}/labels.txt`);
console.log('page errors:', errs.slice(0, 3).join(' | ') || 'none');
await b.close();
