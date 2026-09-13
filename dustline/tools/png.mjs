/* A PNG decoder, because comparing rendered images needs pixels, not bytes.
 *
 * Only the case the renderer actually emits: 8 bits per channel, not
 * interlaced, grey / RGB / grey+alpha / RGBA. Anything else throws rather than
 * quietly returning something wrong.
 *
 * PNG stores each row with a filter byte in front saying how that row was
 * predicted from its neighbours, so decoding is inflate + undo the prediction.
 */
import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';

const CHANNELS = { 0: 1, 2: 3, 4: 2, 6: 4 };

export function decode(path) {
  const buf = readFileSync(path);
  let off = 8; // skip the signature
  let w = 0, h = 0, depth = 0, ctype = 0;
  const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString('ascii', off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') {
      w = data.readUInt32BE(0); h = data.readUInt32BE(4);
      depth = data[8]; ctype = data[9];
      if (data[12] !== 0) throw new Error(`${path}: interlaced`);
    } else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    off += 12 + len; // length + type + data + crc
  }
  if (depth !== 8) throw new Error(`${path}: ${depth}-bit`);
  const ch = CHANNELS[ctype];
  if (!ch) throw new Error(`${path}: colour type ${ctype}`);

  const raw = inflateSync(Buffer.concat(idat));
  const stride = w * ch;
  const px = Buffer.alloc(h * stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, y * (stride + 1) + 1 + stride);
    const out = px.subarray(y * stride, (y + 1) * stride);
    const prev = y ? px.subarray((y - 1) * stride, y * stride) : null;
    for (let i = 0; i < stride; i++) {
      const a = i >= ch ? out[i - ch] : 0;          // left
      const b = prev ? prev[i] : 0;                  // above
      const c = prev && i >= ch ? prev[i - ch] : 0;  // above-left
      let v = line[i];
      if (f === 1) v += a;
      else if (f === 2) v += b;
      else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      } else if (f !== 0) throw new Error(`${path}: filter ${f}`);
      out[i] = v & 255;
    }
  }
  return { w, h, ch, px };
}

/** How far apart two images are, ignoring the rasteriser's edge jitter. */
export function compare(pathA, pathB) {
  const a = decode(pathA), b = decode(pathB);
  if (a.w !== b.w || a.h !== b.h || a.ch !== b.ch) {
    return { resized: `${a.w}x${a.h}x${a.ch} -> ${b.w}x${b.h}x${b.ch}` };
  }
  let sum = 0, over = 0;
  for (let i = 0; i < a.px.length; i++) {
    const d = Math.abs(a.px[i] - b.px[i]);
    sum += d;
    if (d > 8) over++;
  }
  return { mean: sum / a.px.length, moved: (100 * over) / a.px.length };
}
