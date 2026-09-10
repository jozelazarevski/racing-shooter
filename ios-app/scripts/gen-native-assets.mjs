/* Generate the native icon and splash from the game's own icon art.
 *
 *   - AppIcon-512@2x.png : assets/icon-512.png upscaled to 1024, flattened
 *     onto the game's ink brown — the App Store rejects icons with an alpha
 *     channel. If the icon art is ever re-exported at 1024, point SRC at it
 *     and drop the upscale.
 *   - Splash (x3)        : 2732x2732 ink-brown field with the icon centred,
 *     replacing Capacitor's grey placeholder. Matches the game's own
 *     background_color so the launch frame reads as the game loading.
 *
 * Run once after `cap add ios`, and again only if the icon art changes.
 */
import sharp from 'sharp';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(here, '..', '..', 'assets', 'icon-512.png');
const ICONSET = resolve(here, '..', 'ios/App/App/Assets.xcassets/AppIcon.appiconset');
const SPLASHSET = resolve(here, '..', 'ios/App/App/Assets.xcassets/Splash.imageset');
const INK = { r: 0x2b, g: 0x1c, b: 0x0e };   // --ink / manifest background_color

await sharp(SRC)
  .resize(1024, 1024, { kernel: 'lanczos3' })
  .flatten({ background: INK })
  .png()
  .toFile(resolve(ICONSET, 'AppIcon-512@2x.png'));
console.log('gen-native-assets: AppIcon 1024 written');

const logo = await sharp(SRC).resize(820, 820, { kernel: 'lanczos3' }).png().toBuffer();
const splash = await sharp({
  create: { width: 2732, height: 2732, channels: 3, background: INK },
})
  .composite([{ input: logo, gravity: 'centre' }])
  .png()
  .toBuffer();

for (const name of ['splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png']) {
  await sharp(splash).toFile(resolve(SPLASHSET, name));
}
console.log('gen-native-assets: splash set written');
