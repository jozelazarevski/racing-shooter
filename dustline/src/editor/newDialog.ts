// NEW TRACK — choose a land and a weather.
//
// "New" used to clone DUSTBOWL. You got a fresh loop and a fresh seed and
// somebody else's octaves, snow line, gravel, pines and sky, and changing that
// meant knowing which of forty numbers in the panel to touch. The starting
// point was quietly arguing for one kind of world.
//
// The two lists are INDEPENDENT because a land and a weather are independent:
// alpine in a snowfall and alpine at golden hour are the same terrain lit
// differently. Eight by seven is fifty-six starting points from fifteen
// entries.
//
// EACH CARD SHOWS ITS OWN COLOURS rather than describing them. The weather
// swatch is the actual sky gradient, the actual fog and the actual sun, drawn
// from the same four stops the dome is built from — so what you pick is what
// you get, and nothing here can drift out of step with the preset table.

import type { TrackDef } from '../tracks/trackDef';
import { LANDS, WEATHERS, composeTrack, LandPreset, WeatherPreset } from '../tracks/presets';
import { starterLoop } from './geometry';

const CSS = `
#ndlg { position: fixed; inset: 0; z-index: 60; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 12px; padding: 24px;
  background: rgba(8,10,14,0.9); backdrop-filter: blur(3px);
  font: 13px/1.5 'Consolas','Menlo',ui-monospace,monospace; color: #d8e4f0; }
#ndlg h2 { font: 700 12px/1 'Consolas',monospace; letter-spacing: 4px; color: #fff; }
#ndlg h3 { font: 700 10px/1 'Consolas',monospace; letter-spacing: 3px; color: #8fa3b8;
  text-transform: uppercase; align-self: flex-start; margin-top: 2px; }
#ndlg .wrap { width: min(940px, 100%); max-height: 76vh; overflow-y: auto;
  display: flex; flex-direction: column; gap: 6px; }
#ndlg .row { display: grid; grid-template-columns: repeat(auto-fill, minmax(168px, 1fr)); gap: 8px; }
#ndlg button.opt { display: flex; flex-direction: column; gap: 5px; text-align: left;
  background: #151a21; border: 1px solid #2a3340; border-radius: 9px; padding: 9px;
  color: inherit; font: inherit; cursor: pointer; transition: border-color .12s; }
#ndlg button.opt:hover { border-color: #9fdcff; }
#ndlg button.opt.sel { border-color: #ffd400; background: #1d2129; }
#ndlg button.opt b { font-size: 12px; letter-spacing: 1px; color: #fff; }
#ndlg button.opt span { color: #7f93a8; font-size: 11px; line-height: 1.35; }
#ndlg .swatch { height: 34px; border-radius: 5px; position: relative; overflow: hidden; }
#ndlg .swatch i { position: absolute; border-radius: 50%; filter: blur(1px); }
#ndlg .terra { height: 34px; border-radius: 5px; display: flex; overflow: hidden; }
#ndlg .terra i { flex: 1; }
#ndlg .go { display: flex; gap: 10px; align-items: center; }
#ndlg .btn { background: #1b212a; border: 1px solid #2a3340; color: #d8e4f0;
  border-radius: 6px; padding: 7px 18px; cursor: pointer; font: inherit; }
#ndlg .btn:hover { border-color: #9fdcff; }
#ndlg .btn.primary { background: #1d4b6b; border-color: #2f7ea8; color: #eaf7ff; }
#ndlg .hint { color: #6b7f94; font-size: 11px; }
`;

/** The weather's own four sky stops, its fog and its sun — the same values the
 *  dome and the light are built from. */
function weatherSwatch(w: WeatherPreset): string {
  return `<div class="swatch" style="background:linear-gradient(${w.stops[0]},${w.stops[1]} 55%,${w.stops[2]} 80%,${w.stops[3]})">
    <i style="width:16px;height:16px;left:70%;top:14%;background:${w.sunColor};
       box-shadow:0 0 14px 6px ${w.sunColor}66"></i>
    <i style="inset:auto 0 0 0;height:11px;border-radius:0;filter:blur(3px);background:${w.fogColor};opacity:.85"></i>
  </div>`;
}

/** The land's own surface colours, in the order a lap meets them. Read from the
 *  preset's road, off-road and zone surfaces rather than written out again. */
const SURF: Record<string, string> = {
  tarmac: '#54565b', gravel: '#b09a6a', mud: '#5e4a30',
  snow: '#eef2f6', ice: '#bcd8e8', sand: '#d8c07a',
};
function landSwatch(l: LandPreset): string {
  const ids = [l.surfaces.road, l.surfaces.offroad,
    ...l.surfaces.bands.map((b) => b.surface), ...l.surfaces.zones.map((z) => z.surface)];
  const seen = [...new Set(ids)];
  const bars = seen.map((s) => `<i style="background:${SURF[s] ?? '#888'}"></i>`).join('');
  const sea = l.water ? `<i style="background:${l.water.deep};flex:0.8"></i>` : '';
  return `<div class="terra">${bars}${sea}</div>`;
}

export function newTrackDialog(): Promise<TrackDef | null> {
  return new Promise((resolve) => {
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);
    const root = document.createElement('div');
    root.id = 'ndlg';
    document.body.appendChild(root);

    let land = 0;
    let weather = 0;

    root.innerHTML = `<h2>NEW TRACK</h2>
      <div class="wrap">
        <h3>Land</h3><div class="row" id="lands"></div>
        <h3>Weather</h3><div class="row" id="weathers"></div>
      </div>
      <div class="go">
        <button class="btn" id="nCancel">Cancel</button>
        <button class="btn primary" id="nGo">Create</button>
      </div>
      <p class="hint">Every choice here is ordinary track data — the panel can change
        all of it afterwards. This only decides where you start.</p>`;

    const lands = root.querySelector('#lands') as HTMLElement;
    const weathers = root.querySelector('#weathers') as HTMLElement;

    const paint = () => {
      Array.from(lands.children).forEach((c, i) => c.classList.toggle('sel', i === land));
      Array.from(weathers.children).forEach((c, i) => c.classList.toggle('sel', i === weather));
    };

    LANDS.forEach((l, i) => {
      const b = document.createElement('button');
      b.className = 'opt';
      b.type = 'button';
      b.innerHTML = `${landSwatch(l)}<b></b><span></span>`;
      (b.querySelector('b') as HTMLElement).textContent = l.name;
      (b.querySelector('span') as HTMLElement).textContent = l.blurb;
      b.addEventListener('click', () => { land = i; paint(); });
      lands.appendChild(b);
    });
    WEATHERS.forEach((w, i) => {
      const b = document.createElement('button');
      b.className = 'opt';
      b.type = 'button';
      b.innerHTML = `${weatherSwatch(w)}<b></b><span></span>`;
      (b.querySelector('b') as HTMLElement).textContent = w.name;
      (b.querySelector('span') as HTMLElement).textContent = w.blurb;
      b.addEventListener('click', () => { weather = i; paint(); });
      weathers.appendChild(b);
    });

    const done = (t: TrackDef | null) => { root.remove(); style.remove(); resolve(t); };
    (root.querySelector('#nCancel') as HTMLElement).addEventListener('click', () => done(null));
    (root.querySelector('#nGo') as HTMLElement).addEventListener('click', () => {
      // A fresh seed per track, so two tracks off the same preset are not the
      // same world with a different road.
      const seed = (Math.random() * 0xffffffff) >>> 0;
      done(composeTrack(LANDS[land], WEATHERS[weather], starterLoop(180, 12), seed));
    });
    root.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') done(null);
      if (e.key === 'Enter') (root.querySelector('#nGo') as HTMLElement).click();
    });

    paint();
    (root.querySelector('#nGo') as HTMLElement).focus();
  });
}
