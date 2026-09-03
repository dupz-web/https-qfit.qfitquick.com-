// 마크업의 한글 중 이미 사전에 있는 문구에 data-i18n 이름표를 붙인다.
//
// 붙이고 나면 applyStaticTranslations 의 한 줄이 전부 몰아 채운다 —
// 셀렉터를 손으로 나열하는 방식은 문구를 넣을 때마다 목록에도 적어야 하고,
// 잊으면 그 자리만 번역이 안 된 채로 남는다(오류도 경고도 안 난다).
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const dict = fs.readFileSync(path.join(ROOT, 'src/data/i18n-strings.js'), 'utf-8');

// 사전의 ko 값 → 키
const ko2key = new Map();
for (const m of dict.matchAll(/^\s*(\w+):\s*\{\s*ko:\s*'([^']*)'/gm)) {
  if (!ko2key.has(m[2])) ko2key.set(m[2], m[1]);
}
console.log(`사전 항목 ${ko2key.size}개`);

const file = path.join(ROOT, 'app', 'index.html');
let html = fs.readFileSync(file, 'utf-8');

let tagged = 0;
const missed = new Map();

html = html.replace(
  /<([a-z][\w-]*)([^>]*)>([^<>{}]*[가-힣][^<>]*)(?=<)/g,
  (whole, tag, attrs, text) => {
    if (attrs.includes('data-i18n')) return whole;
    const key = ko2key.get(text.trim());
    if (!key) {
      const t = text.trim();
      if (t) missed.set(t, (missed.get(t) || 0) + 1);
      return whole;
    }
    tagged++;
    return `<${tag}${attrs} data-i18n="${key}">${text}`;
  }
);

if (!process.env.DRY) fs.writeFileSync(file, html, 'utf-8');
console.log(`이름표 부착 ${tagged}곳${process.env.DRY ? ' (안 씀 — DRY)' : ''}`);
console.log(`사전에 없는 문구 ${missed.size}종`);
[...missed.entries()].slice(0, 20).forEach(([t, n]) =>
  console.log(`  ×${n}  ${t.slice(0, 46)}`)
);
