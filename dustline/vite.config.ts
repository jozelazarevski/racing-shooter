import { defineConfig } from 'vite';

// Built bundle lands at the repo root as /play-dustline so GitHub Pages
// serves it at .../racing-shooter/play-dustline/ next to IGNITE RALLY.
export default defineConfig({
  base: './',
  build: { outDir: '../play-dustline', emptyOutDir: true, target: 'es2022' },
});
