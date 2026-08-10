// THE TEMPLATE LIBRARY — one import for every reusable shape in the game.
//
// See `README.md` next to this file for what belongs here and what does not.
// The short version: this folder is SHAPES AND THE TOOLS TO BUILD THEM. It
// knows nothing about placement, scatter, the registry, tracks or the editor,
// and nothing here has a side effect on import.
//
// Import from the barrel when you want several things:
//
//     import { HOUSE_TEMPLATES, realize, boatHull, strut } from '../templates';
//
// or from a file directly when you want one:
//
//     import { gablePrismGeo } from '../templates/geometry';

export * from './geometry';
export * from './buildings';
export * from './boats';
export * from './textures';
export * from './horizon';
