/* DID THE PAGE EVEN BOOT, AND WHAT STOPPED IT. Ten seconds, one answer.
 * `node --check` parses a file as a SCRIPT, so it accepts things the module
 * loader rejects — a duplicate `const` in one scope among them, which is how
 * `Identifier 'lamp' has already been declared` shipped past a green syntax
 * check and every later probe just timed out waiting for a game that was
 * never going to exist. Run this after ANY edit to main.js, before the
 * probe that takes two minutes to tell you nothing. */
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await (await b.newContext({ viewport:{width:400,height:300} })).newPage();
p.setDefaultTimeout(30000);
p.on('pageerror', e => console.log('PAGEERROR: ' + e.message));
p.on('console', m => { if (m.type() === 'error') console.log('CONSOLE: ' + m.text().slice(0,300)); });
try { await p.goto('http://localhost:8901/?level=1', { waitUntil:'load', timeout:30000 }); } catch (e) { console.log('GOTO ' + e.message.slice(0,120)); }
await p.waitForTimeout(4000);
const ok = await p.evaluate(() => !!window.__game);
console.log('game? ' + ok);
await b.close();

// EXIT CODE, NOT JUST A LINE OF TEXT. A gate that only prints cannot be run by
// `gates.mjs`, and a gate nobody runs is a gate that does not exist — r271
// shipped a broken view past a suite that was all green because the suite was
// three scripts somebody remembered.
process.exit(ok ? 0 : 1);
