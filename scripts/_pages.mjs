// GitHub Pages 를 흉내낸다: 저장소 루트를 /https-qfit.qfitquick.com-/ 아래에 건다.
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const ROOT = path.resolve(import.meta.dirname, '..');
const BASE = '/https-qfit.qfitquick.com-';
const TYPE = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css',
  '.png':'image/png', '.webp':'image/webp', '.mp4':'video/mp4', '.wav':'audio/wav',
  '.webmanifest':'application/manifest+json', '.json':'application/json', '.svg':'image/svg+xml' };
http.createServer((req, res) => {
  let u = decodeURIComponent(req.url.split('?')[0]);
  if (!u.startsWith(BASE)) { res.statusCode = 404; return res.end('밖'); }
  u = u.slice(BASE.length) || '/';
  let f = path.join(ROOT, u);
  if (u.endsWith('/')) f = path.join(f, 'index.html');
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.statusCode = 404; return res.end('없음'); }
  res.setHeader('Content-Type', TYPE[path.extname(f)] || 'application/octet-stream');
  res.end(fs.readFileSync(f));
}).listen(5180, () => console.log('5180'));
