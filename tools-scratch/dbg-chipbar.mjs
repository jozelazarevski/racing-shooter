/* The driver chip in the bar, wide and narrow (owner: "Move the name up or
 * just have a first letter"). Shoots the menu header at desktop and phone
 * width and reports the chip's box, so "it fits" is measured, not eyeballed. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
for (const [w, h, tag] of [[1280, 800, 'wide'], [420, 780, 'narrow'], [360, 740, 'phone']]) {
  const p = await browser.newPage({ viewport: { width: w, height: h } });
  p.setDefaultTimeout(180000);
  await p.goto(`${BASE}/?unlockall=1`, { waitUntil: 'load', timeout: 180000 });
  await p.waitForFunction(() => document.getElementById('profile-chip'), undefined, { timeout: 120000 });
  await p.evaluate(() => { window.__game?.setProfileName?.('JOSIP'); });
  await new Promise((r) => setTimeout(r, 1200));
  const box = await p.evaluate(() => {
    const q = (id) => { const e = document.getElementById(id); if (!e) return null;
      const r = e.getBoundingClientRect();
      return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; };
    const chip = document.getElementById('profile-chip');
    const cs = chip && getComputedStyle(chip);
    return { chip: q('profile-chip'), cred: q('topbar-cred'), bar: q('topbar'),
      tabs: q('menu-tabs'), status: !!document.getElementById('menu-status'),
      nameShown: getComputedStyle(document.getElementById('profile-name')).display,
      iniShown: getComputedStyle(document.getElementById('profile-initial')).display,
      ini: document.getElementById('profile-initial')?.textContent,
      overflow: cs ? chip.scrollWidth > chip.clientWidth + 1 : null };
  });
  console.log(tag, JSON.stringify(box));
  await p.screenshot({ path: `/tmp/claude-0/chip-${tag}.png`, clip: { x: 0, y: 0, width: w, height: Math.min(h, 320) } });
  await p.close();
}
await browser.close();
