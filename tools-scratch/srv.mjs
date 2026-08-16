import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const ROOT = '/home/user/racing-shooter';
const T = { '.html':'text/html', '.js':'text/javascript', '.mjs':'text/javascript', '.json':'application/json', '.css':'text/css', '.png':'image/png', '.svg':'image/svg+xml', '.wasm':'application/wasm' };
http.createServer((q,s)=>{ let p = decodeURIComponent(q.url.split('?')[0]); if(p==='/')p='/index.html';
  const f = path.join(ROOT,p);
  if(!f.startsWith(ROOT)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){s.writeHead(404);return s.end('nope');}
  s.writeHead(200,{'Content-Type':T[path.extname(f)]??'application/octet-stream','Cache-Control':'no-store'});
  fs.createReadStream(f).pipe(s);
}).listen(Number(process.argv[2]??8920));
