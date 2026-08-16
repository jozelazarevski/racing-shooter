import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
// ROOT is settable so a pristine `origin/main` worktree can be served on a
// second port — the only way to tell a regression from a pre-existing failure.
//   node srv.mjs 8930 /path/to/worktree
const ROOT = process.argv[3] ?? process.env.ROOT ?? '/home/user/racing-shooter';
const T = { '.html':'text/html', '.js':'text/javascript', '.mjs':'text/javascript', '.json':'application/json', '.css':'text/css', '.png':'image/png', '.svg':'image/svg+xml', '.wasm':'application/wasm' };
http.createServer((q,s)=>{ let p = decodeURIComponent(q.url.split('?')[0]); if(p==='/')p='/index.html';
  const f = path.join(ROOT,p);
  if(!f.startsWith(ROOT)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){s.writeHead(404);return s.end('nope');}
  s.writeHead(200,{'Content-Type':T[path.extname(f)]??'application/octet-stream','Cache-Control':'no-store'});
  fs.createReadStream(f).pipe(s);
}).listen(Number(process.argv[2]??8920));
