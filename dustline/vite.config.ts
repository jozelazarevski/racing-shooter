import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// Built bundle lands at the repo root as /V2 so GitHub Pages
// serves it at .../racing-shooter/V2/ next to IGNITE RALLY.
//
// TWO ENTRY POINTS: the game and the track editor. The editor is a page of the
// same app rather than a separate project on purpose — it imports the real
// Terrain, the real scenery placement and the real track format, so a preview
// cannot drift from the game. A standalone editor would be a second
// implementation of the world, and the second implementation is always the one
// that is subtly wrong.
export default defineConfig({
  base: './',
  build: {
    outDir: '../V2',
    emptyOutDir: true,
    target: 'es2022',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        editor: resolve(__dirname, 'editor.html'),
      },
    },
  },
});
