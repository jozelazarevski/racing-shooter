import { chromium } from 'playwright-core';
const BASE = 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1100, height: 720 } });
await page.goto(`${BASE}/?level=1&go=1&unlockall=1`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
await page.evaluate(async () => {
  const g = window.__game;
  const { WorldEditor } = await import('./src/editor.js');
  g.editor = new WorldEditor(g);
  g.editor.enter();
});
await page.keyboard.press('Shift+Slash');
await page.waitForTimeout(100);
const open = await page.evaluate(() => ({
  title: window.__game.editor.root.querySelector('#ed-modal-title').textContent,
  off: window.__game.editor.root.querySelector('#ed-modal').classList.contains('off'),
  roots: document.querySelectorAll('#editor-ui').length,
  activeEl: document.activeElement?.tagName,
}));
await page.keyboard.press('Escape');
await page.waitForTimeout(100);
const after = await page.evaluate(() => ({
  off: window.__game.editor.root.querySelector('#ed-modal').classList.contains('off'),
  state: window.__game.state,
  active: window.__game.editor.active,
  activeEl: document.activeElement?.tagName,
}));
console.log(JSON.stringify({ open, after }));
await browser.close();
