// A static file server the browser tools start for themselves.
//
// Every headless tool here needs the built bundle served over HTTP, and until
// this existed each one told you to start `python3 -m http.server` in another
// shell and then failed with a connection error when you had not, or when the
// one from an hour ago had died. A check that depends on a manual setup step is
// a check people stop running.
//
// `ensureServer()` reuses an already-running server if it finds one, so it
// costs nothing during a dev session with a server already up.

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.wasm': 'application/wasm',
  '.woff2': 'font/woff2',
};

async function alreadyServing(base) {
  try {
    const res = await fetch(new URL('editor.html', base), { signal: AbortSignal.timeout(1500) });
    return res.ok;
  } catch {
    return false;
  }
}

/** Serve `root` at `base` unless something already is.
 *  Returns a stop function — a no-op when an existing server was reused, so a
 *  tool can always call it without worrying about which case it got. */
export async function ensureServer(base, root) {
  if (await alreadyServing(base)) return () => {};

  const port = Number(new URL(base).port || 80);
  const server = createServer(async (req, res) => {
    try {
      // strip the query and refuse to climb out of the root
      const rel = normalize(decodeURIComponent((req.url || '/').split('?')[0])).replace(/^(\.\.[/\\])+/, '');
      let file = join(root, rel);
      if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
      const body = await readFile(file);
      res.writeHead(200, {
        'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream',
        'Cache-Control': 'no-store',
      });
      res.end(body);
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('not found');
    }
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', resolve);
  });
  return () => new Promise((resolve) => server.close(resolve));
}
