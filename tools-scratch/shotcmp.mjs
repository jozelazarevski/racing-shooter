/* Screenshot a local HTML file. Lives in tools-scratch because that is where
 * playwright-core resolves from. */
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args:['--no-sandbox'] });
const p = await (await b.newContext({ viewport:{width:900,height:1200}, deviceScaleFactor:2 })).newPage();
await p.goto('file://' + process.argv[2], { waitUntil:'load' });
await p.screenshot({ path: process.argv[3], fullPage: true });
await b.close();
