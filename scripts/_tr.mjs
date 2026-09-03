// 번역을 채운다. 한국어 원문으로 찾아 en/zh 를 넣는다.
//
// 줄 번호가 아니라 원문으로 찾는 이유: 같은 문구가 여러 번 나오면 한 번에
// 처리되고, 파일이 바뀌어도 안 어긋난다.
import fs from 'node:fs';
import path from 'node:path';

const file = path.resolve(import.meta.dirname, '..', process.argv[2]);
const map = JSON.parse(fs.readFileSync(process.argv[3], 'utf-8'));
let s = fs.readFileSync(file, 'utf-8');

const esc = (x) => x.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
let done = 0;
const missed = [];

for (const [ko, [en, zh]] of Object.entries(map)) {
  const needle = `{ko:'${esc(ko)}', en:'', zh:''}`;
  if (!s.includes(needle)) {
    missed.push(ko);
    continue;
  }
  const n = s.split(needle).length - 1;
  s = s.split(needle).join(`{ko:'${esc(ko)}', en:'${esc(en)}', zh:'${esc(zh)}'}`);
  done += n;
}

fs.writeFileSync(file, s, 'utf-8');
console.log(`${done}곳 채움`);
if (missed.length) {
  console.log(`못 찾은 것 ${missed.length}개:`);
  missed.forEach((m) => console.log('  ' + m.slice(0, 60)));
}
