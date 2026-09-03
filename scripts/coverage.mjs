// 마크업이 쓰는 클래스 중 CSS 규칙이 없는 것을 찾는다.
//
// CSS 를 통째로 새로 쓸 때 제일 흔한 사고는 "몇 개를 빠뜨린 것"이다.
// 빠진 클래스는 오류를 내지 않는다 — 그냥 스타일이 없는 채로 렌더되고,
// 그건 화면을 하나하나 열어 봐야 알게 된다. 화면이 열여섯 개면 놓친다.
//
// JS 가 붙이는 클래스(classList.add)도 같이 센다. 마크업에 없어서
// HTML 만 훑으면 안 보이는데, 실제로는 운동 중에 붙는 것들이다.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf-8');
const js = fs.readFileSync(path.join(ROOT, 'src', 'app.js'), 'utf-8');

const cssFiles = fs
  .readdirSync(path.join(ROOT, 'src', 'styles'))
  .filter((f) => f.endsWith('.css'));
const css = cssFiles
  .map((f) => fs.readFileSync(path.join(ROOT, 'src', 'styles', f), 'utf-8'))
  .join('\n');

// ── 쓰이는 클래스 ────────────────────────────────────────
const used = new Set();
for (const [, v] of html.matchAll(/class="([^"]*)"/g)) {
  v.split(/\s+/).filter(Boolean).forEach((c) => used.add(c));
}
// JS: classList.add('x'), className = 'a b'
for (const [, v] of js.matchAll(/classList\.(?:add|remove|toggle)\(\s*'([^']+)'/g)) {
  v.split(/\s+/).filter(Boolean).forEach((c) => used.add(c));
}
for (const [, v] of js.matchAll(/className\s*=\s*'([^']*)'/g)) {
  v.split(/\s+/).filter(Boolean).forEach((c) => used.add(c));
}

// ── CSS 가 정의하는 클래스 ───────────────────────────────
const defined = new Set();
// 주석을 먼저 걷어낸다. 주석 안의 .foo 를 정의로 세면 검사가 거짓말을 한다.
const cssNoComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
for (const [, c] of cssNoComments.matchAll(/\.([a-zA-Z][\w-]*)/g)) defined.add(c);

// ── 예외 ─────────────────────────────────────────────────
// 'anim-' 은 JS 가 'anim-' + key 로 조립한다. 접두사로 취급한다.
const PREFIX_OK = ['anim-'];
// JS 가 잡는 손잡이라 스타일이 없는 게 정상인 것들.
// 여기 추가할 때는 정말 손잡이인지 확인할 것 — 빠뜨린 것을 여기 넣으면
// 검사가 통과하면서 화면만 망가진다.
const IGNORE = new Set([
  'anim-',
  'recovery-trigger-btn', 'video-gallery-trigger-btn', 'repeat-trigger-btn',
]);

const missing = [...used]
  .filter((c) => !IGNORE.has(c))
  .filter((c) => !defined.has(c))
  .filter((c) => !PREFIX_OK.some((p) => c.startsWith(p) && defined.has(c)))
  .sort();

// 반대쪽도 본다: CSS 에만 있고 아무도 안 쓰는 것 (지워도 되는 것)
const unused = [...defined].filter((c) => !used.has(c)).sort();

console.log(`쓰이는 클래스 ${used.size}개 / CSS 정의 ${defined.size}개`);

if (missing.length) {
  console.log(`\n=== 스타일이 없는 클래스 ${missing.length}개 ===`);
  missing.forEach((c) => console.log('  .' + c));
} else {
  console.log('\n스타일 빠진 클래스 없음');
}

if (process.env.SHOW_UNUSED && unused.length) {
  console.log(`\n--- CSS 에만 있고 안 쓰이는 것 ${unused.length}개 ---`);
  console.log('  ' + unused.join(' '));
}

process.exit(missing.length ? 1 : 0);
