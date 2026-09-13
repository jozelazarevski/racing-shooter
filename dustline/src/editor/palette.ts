// The component palette.
//
// Thumbnails are rendered from each component's own geometry (see
// props/thumbnail.ts), so the picture in the palette cannot disagree with the
// thing you get — there is no icon to update when a tree changes shape.
//
// Two ways to place, because both are worth having: DRAG a component onto the
// map or the 3D view to put it exactly where you dropped it, or CLICK to arm
// it and then click the map, which is faster when you are placing twenty tyre
// stacks along one corner.

import type { PropTemplate } from '../world/props/types';
import { allTemplates } from '../world/props/registry';
import { thumbnail } from '../world/props/thumbnail';
import { isSolid } from '../world/props/types';

export const DRAG_MIME = 'application/x-dustline-component';

export interface PaletteHooks {
  /** the armed component, or null when nothing is armed */
  onArm: (id: string | null) => void;
}

export class Palette {
  private armed: string | null = null;
  private items = new Map<string, HTMLElement>();

  constructor(private root: HTMLElement, private hooks: PaletteHooks) {
    this.render();
  }

  get armedId(): string | null { return this.armed; }

  arm(id: string | null) {
    this.armed = id;
    for (const [tid, el] of this.items) el.classList.toggle('on', tid === id);
    this.hooks.onArm(id);
  }

  private render() {
    const groups = new Map<string, PropTemplate[]>();
    for (const t of allTemplates()) {
      const list = groups.get(t.category);
      if (list) list.push(t); else groups.set(t.category, [t]);
    }

    this.root.innerHTML = '';
    for (const [category, list] of groups) {
      const h = document.createElement('h4');
      h.textContent = category;
      this.root.appendChild(h);
      const grid = document.createElement('div');
      grid.className = 'pal';
      for (const t of list) grid.appendChild(this.item(t));
      this.root.appendChild(grid);
    }

    const hint = document.createElement('div');
    hint.id = 'palHint';
    hint.innerHTML = 'drag onto the map or the 3D view<br />or click to arm, then click to place<br /><br />'
      + 'a component is one file in<br />src/world/props/ — geometry,<br />physics and preview together';
    this.root.appendChild(hint);
  }

  private item(t: PropTemplate): HTMLElement {
    const el = document.createElement('div');
    // `solid` colours the label, because whether a thing stops a car is the
    // single most important fact about it when you are placing it near a road
    el.className = `pitem${isSolid(t.physics, t.authoring.defaultScale) ? ' solid' : ''}`;
    el.draggable = true;
    el.title = `${t.name} — ${t.description}`;

    const img = document.createElement('img');
    img.src = thumbnail(t, 96);
    img.alt = t.name;
    img.draggable = false;
    el.appendChild(img);

    const label = document.createElement('span');
    label.textContent = t.name;
    el.appendChild(label);

    el.addEventListener('dragstart', (e) => {
      e.dataTransfer?.setData(DRAG_MIME, t.id);
      e.dataTransfer?.setData('text/plain', t.id);   // some browsers need a text flavour
      if (e.dataTransfer) e.dataTransfer.effectAllowed = 'copy';
      this.arm(t.id);
    });
    el.addEventListener('click', () => this.arm(this.armed === t.id ? null : t.id));

    this.items.set(t.id, el);
    return el;
  }
}
