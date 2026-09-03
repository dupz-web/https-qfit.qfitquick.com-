// 지난 빌드 산출물만 골라 지운다.
//
// 산출물이 저장소 루트에 놓이므로 Vite 의 emptyOutDir 을 켤 수 없다 — 켜면
// src/·scripts/·legacy/ 까지 통째로 날아간다. 그래서 지우는 쪽을 여기로 뺐다.
//
// 왜 필요한가: 자산 파일 이름에 해시가 붙는다(assets/index-a1b2c3.js). 안 지우면
// 빌드할 때마다 옛 이름이 그대로 남아 저장소가 계속 불어나고, 어느 것이 지금
// 쓰이는 파일인지 알 수 없게 된다.
//
// **이름을 아는 것만 지운다.** 와일드카드로 루트를 쓸면 언젠가 소스를 지운다.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');

// 빌드가 만드는 것들. 여기 없는 것은 건드리지 않는다.
const DIRS = ['assets', 'media', 'icons'];
const FILES = ['index.html', 'sw.js', 'registerSW.js', 'manifest.webmanifest'];
const PATTERNS = [/^workbox-[\w-]+\.js$/];

// 절대 지우면 안 되는 것. DIRS·FILES 를 잘못 늘렸을 때를 대비한 두 번째 그물이다.
const KEEP = new Set([
  'src', 'scripts', 'app', 'public', 'legacy', 'node_modules', '.git',
  'package.json', 'package-lock.json', 'vite.config.js', '.gitignore',
  'NOTES.md', 'README.md', '.nojekyll', 'screenshots', 'dist',
]);

let gone = 0;
for (const name of [...DIRS, ...FILES]) {
  if (KEEP.has(name)) throw new Error(`지우면 안 되는 것이 목록에 있다: ${name}`);
  const p = path.join(ROOT, name);
  if (!fs.existsSync(p)) continue;
  fs.rmSync(p, { recursive: true, force: true });
  gone++;
}
for (const name of fs.readdirSync(ROOT)) {
  if (KEEP.has(name)) continue;
  if (!PATTERNS.some((re) => re.test(name))) continue;
  fs.rmSync(path.join(ROOT, name), { force: true });
  gone++;
}

console.log(`지난 산출물 ${gone}개 지움`);
