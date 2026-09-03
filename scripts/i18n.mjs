// 번역이 빠진 자리를 찾는다.
//
// 이 앱의 i18n 은 "사전에 등록된 것만 번역된다" 구조라, 문구를 새로 넣고
// 등록을 잊으면 그 자리만 한국어로 남는다. 그런데 한국어로 남은 것은
// 화면을 그 언어로 열어 봐야만 보인다 — 오류도, 경고도 안 난다.
// 그래서 세어서 막는다.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const LANGS = ['ko', 'en', 'zh'];

const files = [
  ...fs.readdirSync(path.join(ROOT, 'src', 'data')).map((f) => path.join('src', 'data', f)),
  path.join('src', 'app.js'),
].filter((f) => f.endsWith('.js'));

let missing = 0;
let total = 0;

for (const rel of files) {
  const src = fs.readFileSync(path.join(ROOT, rel), 'utf-8');
  const holes = [];

  // {ko:'…', en:'…'} 꼴을 찾아 각 언어가 다 있는지 본다.
  // 중첩 따옴표를 정확히 파싱하려는 대신, ko 부터 닫는 중괄호까지를 한 덩어리로 본다.
  for (const m of src.matchAll(/\{\s*ko\s*:\s*(?:'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")[\s\S]*?\}/g)) {
    total++;
    const chunk = m[0];
    const lack = LANGS.filter((l) => !new RegExp(`\\b${l}\\s*:`).test(chunk));
    if (lack.length) {
      const line = src.slice(0, m.index).split('\n').length;
      const ko = (chunk.match(/ko\s*:\s*['"]([^'"]{0,28})/) || [])[1] ?? '?';
      holes.push({ line, lack, ko });
    }
  }

  if (holes.length) {
    console.log(`\n${rel.replace(/\\/g, '/')}  — ${holes.length}곳`);
    holes.slice(0, 12).forEach((h) =>
      console.log(`  ${String(h.line).padStart(4)}행  [${h.lack.join(',')} 없음]  ${h.ko}`)
    );
    if (holes.length > 12) console.log(`  … 그 밖에 ${holes.length - 12}곳`);
    missing += holes.length;
  }
}

// 코드 안에 박힌 2갈래 분기도 센다. LANG==='ko' ? A : B 는 언어가 셋이 되는 순간
// 중국어에서 영어가 나온다 — 틀린 것도 아니고 맞는 것도 아닌 상태다.
const app = fs.readFileSync(path.join(ROOT, 'src', 'app.js'), 'utf-8');
const inline = [...app.matchAll(/LANG\s*===\s*'ko'\s*\?/g)].length;

console.log(`\n{ko,…} 덩어리 ${total}개 중 빠진 것 ${missing}개`);
console.log(`app.js 안의 2갈래 분기(LANG==='ko' ? …) ${inline}곳 — 중국어에서 영어가 나온다`);

const limit = Number(process.env.I18N_ALLOW ?? 0);
const bad = missing + inline;
if (bad > limit) {
  console.log(`\n남은 것 ${bad}개 (허용 ${limit})`);
  process.exit(1);
}
console.log('\n통과');
