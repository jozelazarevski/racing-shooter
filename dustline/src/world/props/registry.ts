// The component registry.
//
// Templates are DISCOVERED, not listed. Every `*.ts` in this folder that
// default-exports a `PropTemplate` is a component, and adding one to the world
// is adding a file — there is no manifest to forget to update, which is the
// single most common way a plugin-shaped system rots.
//
// `eager: true` because the palette needs every template's metadata to draw
// itself, so lazy loading would only buy a flash of empty palette.

import type { PropTemplate, PropPart } from './types';
import { disposeWallMaps } from './wallTexture';

const modules = import.meta.glob<{ default: PropTemplate }>('./*.ts', { eager: true });

const TEMPLATES = new Map<string, PropTemplate>();
for (const [path, mod] of Object.entries(modules)) {
  const t = mod?.default;
  if (!t || typeof t !== 'object' || !('id' in t) || !('build' in t)) continue;   // types.ts etc.
  if (TEMPLATES.has(t.id)) {
    console.warn(`[props] duplicate template id "${t.id}" from ${path} — keeping the first`);
    continue;
  }
  TEMPLATES.set(t.id, t);
}

export function allTemplates(): PropTemplate[] {
  return [...TEMPLATES.values()].sort((a, b) => (
    a.category === b.category ? a.name.localeCompare(b.name) : a.category.localeCompare(b.category)
  ));
}

export function getTemplate(id: string): PropTemplate | null {
  return TEMPLATES.get(id) ?? null;
}

export function templateIds(): string[] {
  return [...TEMPLATES.keys()];
}

export function categories(): string[] {
  return [...new Set(allTemplates().map((t) => t.category))];
}

/** Built parts, per template, per world build.
 *
 *  Cached because `build()` allocates geometry and materials, and a world that
 *  scatters pines and also has ten placed by hand must not build the pine
 *  twice — they would be two InstancedMeshes and two sets of GPU buffers for
 *  one tree. The cache is cleared between worlds by `resetPartCache()`, which
 *  the editor calls on every rebuild so a disposed geometry is never reused. */
const partCache = new Map<string, PropPart[]>();

export function partsFor(template: PropTemplate): PropPart[] {
  let parts = partCache.get(template.id);
  if (!parts) {
    parts = template.build();
    partCache.set(template.id, parts);
  }
  return parts;
}

/** Drop the cache. MUST be called whenever the previous world's geometry has
 *  been disposed — reusing a disposed BufferGeometry renders nothing and logs
 *  no error, which is a miserable thing to debug. */
export function resetPartCache() {
  partCache.clear();
  // The wall textures are cached across components — sixty-four canvases for
  // three distinct pictures is not a trade worth making — but the caller has
  // just disposed the materials that hold them, and a disposed texture handed
  // out again renders black with no error. Same rule as the geometry: cleared
  // together or not at all.
  disposeWallMaps();
}
