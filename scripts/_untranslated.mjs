// 아직 번역이 안 된 문구를 빈도순으로 센다. 반복되는 것부터 처리하면
// 손이 덜 가고, 같은 말이 화면마다 다르게 번역되는 일도 막는다.
import fs from 'node:fs';
import path from 'node:path';

const file = process.argv[2] || 'src/data/recovery.js';
const s = fs.readFileSync(path.resolve(import.meta.dirname, '..', file), 'utf-8');

const count = new Map();
for (const m of s.matchAll(/\{ko:'((?:[^'\\]|\\.)*)', en:'', zh:''\}/g)) {
  count.set(m[1], (count.get(m[1]) || 0) + 1);
}
const total = [...count.values()].reduce((a, b) => a + b, 0);
console.log(`미번역 ${count.size}종 / ${total}곳`);

const rep = [...count.entries()].filter(([, n]) => n > 1).sort((a, b) => b[1] - a[1]);
if (rep.length) {
  console.log(`\n--- 2회 이상 (${rep.length}종, ${rep.reduce((n, [, v]) => n + v, 0)}곳) ---`);
  rep.forEach(([k, n]) => console.log(`  ×${n}  ${k}`));
}
if (process.env.ALL) {
  console.log('\n--- 1회 ---');
  [...count.entries()].filter(([, n]) => n === 1).forEach(([k]) => console.log(`  ${k}`));
}
