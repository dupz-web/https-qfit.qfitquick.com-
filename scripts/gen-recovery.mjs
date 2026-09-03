// 뽑아 둔 JSON 으로 데이터 모듈의 뼈대를 만든다.
//
// 손으로 옮겨 적지 않는 이유: 7,100자를 옮기면 어딘가가 반드시 틀리는데,
// 틀린 것을 원본과 대조할 방법이 없다. 기계가 옮기면 원본과 같다는 것이 보장된다.
// 번역(en/zh)은 이 뼈대 위에 사람이 채운다.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/_recovery-ko.json'), 'utf-8'));

const q = (s) => "'" + String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
// 아직 번역 안 된 자리는 빈 문자열로 둔다.
// t() 가 빈 값을 ko 로 되돌리므로 화면은 한국어로 나오고, npm run i18n 이 셀 수 있다.
const tri = (ko) => `{ko:${q(ko)}, en:'', zh:''}`;

const lines = [];
lines.push('// 회복 화면 내용.');
lines.push('//');
lines.push('// 마크업에 박혀 있던 385줄을 데이터로 옮긴 것이다. 화면은 이걸 읽어 그린다.');
lines.push('// 언어를 하나 더 붙이는 일이 열 하나 채우는 일이 되고, 빠뜨린 자리는');
lines.push('// npm run i18n 이 세어 준다 — 마크업에 흩어져 있으면 둘 다 안 된다.');
lines.push('//');
lines.push('// <b> 는 그대로 둔다. 강조가 붙은 자리가 곧 요점이라 번역본도 같은 자리를');
lines.push('// 강조해야 하고, 렌더는 innerHTML 로 넣는다.');
lines.push('');
lines.push('export const RECOVERY_CARDS = [');
for (const c of data.cards) {
  lines.push(` { title:${tri(c.title)},`);
  lines.push('  items:[');
  for (const it of c.items) lines.push(`   ${tri(it)},`);
  lines.push('  ] },');
}
lines.push('];');
lines.push('');
lines.push('export const INJURY_GUIDES = [');
for (const g of data.injuries) {
  lines.push(` { part:${tri(g.part)},`);
  lines.push('  groups:[');
  for (const gr of g.groups) {
    lines.push(`   { h:${tri(gr.h)}, items:[`);
    for (const it of gr.items) lines.push(`    ${tri(it)},`);
    lines.push('   ] },');
  }
  lines.push('  ],');
  if (g.warn) lines.push(`  warn:${tri(g.warn)},`);
  lines.push(' },');
}
lines.push('];');
lines.push('');

const outPath = path.join(ROOT, 'src/data/recovery.js');
fs.writeFileSync(outPath, lines.join('\n'), 'utf-8');
console.log(`src/data/recovery.js 생성 — ${lines.length}줄`);
