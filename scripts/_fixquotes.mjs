// 작은따옴표가 escape 안 된 자리를 고친다.
//
// {ko:'…', en:'…', zh:'…'} 한 덩어리를 통째로 다시 조립한다. 값 안에 그대로
// 들어간 ' 는 파일을 통째로 깨뜨리는데, 오류 메시지는 엉뚱한 줄을 가리킨다.
import fs from 'node:fs';
import path from 'node:path';

const file = path.resolve(import.meta.dirname, '..', process.argv[2]);
let s = fs.readFileSync(file, 'utf-8');
let fixed = 0;

// ko/en/zh 세 값을 순서대로 읽는다. 값의 끝은 다음 키(", en:" / ", zh:") 또는
// 덩어리의 끝(" }" / "'}")으로 판단한다 — 따옴표만 보고 자르면 값 안의 '에 걸린다.
s = s.replace(
  /\{ko:'([\s\S]*?)', en:'([\s\S]*?)', zh:'([\s\S]*?)'\}/g,
  (whole, ko, en, zh) => {
    const esc = (x) => x.replace(/\\'/g, "'").replace(/'/g, "\\'");
    const out = `{ko:'${esc(ko)}', en:'${esc(en)}', zh:'${esc(zh)}'}`;
    if (out !== whole) fixed++;
    return out;
  }
);

fs.writeFileSync(file, s, 'utf-8');
console.log(`${fixed}곳 고침`);
