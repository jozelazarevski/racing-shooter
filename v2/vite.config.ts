/// <reference types="vitest" />
import { defineConfig } from 'vite';

// Phase 0 ships no playable v2 build — this tree is the deterministic core and
// its gate, nothing more. The config exists so `npm run dev` and the eventual
// Phase 2 build have somewhere to land, and so vitest picks up the same
// resolution rules the game will use.
//
// The output path mirrors dustline's: a sibling folder at the repo root, so
// GitHub Pages serves v2 alongside the shipped v1 game rather than replacing
// it. v1 stays live and playable for the whole migration.
export default defineConfig({
  base: './',
  build: { outDir: '../play-v2', emptyOutDir: true, target: 'es2022' },
  test: {
    include: ['src/**/*.test.ts'],
    // The determinism suite must not be able to pass by accident on a machine
    // with a warm cache or a lucky scheduler: it is pure computation, so any
    // flake here is a real defect.
    reporters: 'verbose',
  },
});
