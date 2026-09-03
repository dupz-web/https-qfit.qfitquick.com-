// 색 토큰의 대비를 잰다. 눈으로 고르지 않는다.
//
// 원래 --muted(#8a7f74) 가 카드 위에서 3.4:1 이었는데, 하필 그 조합이
// 설명·힌트 텍스트 41곳에 10~11.5px 로 쓰이고 있었다. 초보자에게 제일 필요한
// 안내가 제일 안 보이는 상태였고, 눈으로는 "좀 흐린가" 정도로만 보인다.
// 그래서 숫자로 재고, 못 넘으면 실패시킨다.
//
// 기준 (WCAG 2.1):
//   본문      4.5:1
//   큰 글자   3:1   (18.66px 이상 굵게, 또는 24px 이상)
//   UI 경계   3:1
import fs from 'node:fs';
import path from 'node:path';

const CSS = fs.readFileSync(
  path.resolve(import.meta.dirname, '..', 'src', 'styles', 'tokens.css'),
  'utf-8'
);

// ── 색 계산 ──────────────────────────────────────────────
const hex = (h) => {
  h = h.trim().replace('#', '');
  if (h.length === 3) h = [...h].map((c) => c + c).join('');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};
const lum = (rgb) => {
  const [r, g, b] = rgb.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [x, y] = [lum(hex(a)), lum(hex(b))].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

// ── 토큰 읽기 ────────────────────────────────────────────
// 블록별로 따로 뽑는다. 라이트에서 통과해도 다크에서 떨어지는 게 흔하다.
function block(name, re) {
  const m = CSS.match(re);
  if (!m) throw new Error(`${name} 블록을 못 찾음`);
  const vars = {};
  for (const [, k, v] of m[1].matchAll(/--([\w-]+)\s*:\s*(#[0-9a-fA-F]{3,6})\s*;/g)) {
    vars[k] = v;
  }
  return vars;
}

const light = block('라이트', /\/\* ===== 라이트 ===== \*\/\s*:root\{([\s\S]*?)\n\}/);
// 다크는 [data-theme="dark"] 블록에서 읽는다. 미디어쿼리 안쪽과 값이 같은데
// 중첩이 없어 파싱이 흔들리지 않는다. 두 블록이 갈라지면 아래 checkThemesMatch 가 잡는다.
const darkRaw = block('다크', /:root\[data-theme="dark"\]\{([\s\S]*?)\n\}/);
const dark = { ...light, ...darkRaw }; // 다크는 덮어쓰는 것만 적혀 있다

// 다크 값이 두 곳에 적혀 있다 — @media 안쪽과 [data-theme="dark"].
// 한쪽만 고치면 "시스템이 다크일 때"와 "손으로 다크를 골랐을 때"의 색이 달라지는데,
// 둘 다 다크라서 눈으로는 거의 구별이 안 된다. 그래서 여기서 맞춰 본다.
{
  const media = block('다크(미디어쿼리)', /@media \(prefers-color-scheme: dark\) \{\s*:root:not\(\[data-theme="light"\]\)\{([\s\S]*?)\n  \}/);
  const keys = new Set([...Object.keys(media), ...Object.keys(darkRaw)]);
  const off = [...keys].filter((k) => media[k] !== darkRaw[k]);
  if (off.length) {
    console.log('=== 다크 블록 두 개가 어긋난다 ===');
    off.forEach((k) => console.log(`  --${k}: @media=${media[k] ?? '없음'}  [data-theme]=${darkRaw[k] ?? '없음'}`));
    process.exit(1);
  }
}

// ── 검사할 조합 ──────────────────────────────────────────
// [글자, 바탕, 최소비, 설명]
const PAIRS = [
  ['text',      'bg',        4.5, '본문 / 배경'],
  ['text',      'surface',   4.5, '본문 / 카드'],
  ['text',      'surface-2', 4.5, '본문 / 눌린 카드'],
  ['text-dim',  'bg',        4.5, '보조문 / 배경   ← 예전에 여기가 3.4:1 이었다'],
  ['text-dim',  'surface',   4.5, '보조문 / 카드'],
  ['text-dim',  'surface-2', 4.5, '보조문 / 눌린 카드'],
  ['on-accent', 'accent',    4.5, '버튼 글자 / 강조색'],
  ['on-hot',    'hot',       4.5, '버튼 글자 / 경고색'],
  ['on-cool',   'cool',      4.5, '버튼 글자 / 회복색'],
  ['accent-text', 'bg',      4.5, '강조 글자 / 배경  ← 노랑은 밝은 바탕에서 못 쓴다'],
  ['accent-text', 'surface',  4.5, '강조 글자 / 카드'],
  ['hot',       'bg',        3.0, '경고색 / 배경'],
  ['cool',      'bg',        3.0, '회복색 / 배경'],
  ['danger',    'surface',   4.5, '삭제 글자 / 카드'],
  ['line',      'surface',   1.3, '경계선 / 카드 (보이기만 하면 된다)'],
];

let failed = 0;
for (const [theme, vars] of [['라이트', light], ['다크', dark]]) {
  console.log(`\n=== ${theme} ===`);
  for (const [fg, bg, min, label] of PAIRS) {
    if (!vars[fg] || !vars[bg]) {
      console.log(`  ?     ${label}  — 토큰 없음 (--${fg} / --${bg})`);
      failed++;
      continue;
    }
    const r = ratio(vars[fg], vars[bg]);
    const ok = r >= min;
    if (!ok) failed++;
    console.log(
      `  ${ok ? '통과' : '미달'}  ${r.toFixed(2).padStart(5)}:1  (하한 ${min})  ` +
        `${label}  ${vars[fg]} on ${vars[bg]}`
    );
  }
}

console.log(failed ? `\n미달 ${failed}건` : '\n전부 통과');
process.exit(failed ? 1 : 0);
