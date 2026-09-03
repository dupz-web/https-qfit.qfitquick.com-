// 회복 화면의 한국어 내용을 구조로 뽑는다.
//
// 손으로 옮겨 적으면 4,800자에서 반드시 어딘가가 틀리고, 틀린 것은 번역본과
// 대조할 방법이 없다. 그래서 마크업에서 기계로 뽑는다.
//
// <b> 는 남긴다 — 강조가 붙은 자리가 곧 "여기가 요점"이라, 번역본도 같은 자리를
// 강조해야 한다. 렌더할 때 innerHTML 로 넣는다.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf-8');
const block = html.slice(
  html.indexOf('id="recovery-screen"'),
  html.indexOf('id="video-gallery-screen"')
);

const clean = (s) =>
  s.replace(/\s+/g, ' ').replace(/&amp;/g, '&').trim();
const li = (chunk) =>
  [...chunk.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].map((x) => clean(x[1]));

const out = { cards: [], injuries: [] };

// ── 회복 카드 ──────────────────────────────────────────
for (const m of block.matchAll(
  /<div class="recovery-card">\s*<div class="recovery-card-title">([\s\S]*?)<\/div>\s*<ol class="recovery-list">([\s\S]*?)<\/ol>/g
)) {
  out.cards.push({ title: clean(m[1]), items: li(m[2]) });
}

// ── 부위별 아코디언 ────────────────────────────────────
for (const m of block.matchAll(
  /<div class="injury-accordion">\s*<button type="button" class="injury-summary">([\s\S]*?)<\/button>\s*<div class="injury-body">([\s\S]*?)<\/div>\s*<\/div>/g
)) {
  const part = clean(m[1]);
  const body = m[2];
  const groups = [];
  for (const g of body.matchAll(/<h4[^>]*>([\s\S]*?)<\/h4>\s*<ul[^>]*>([\s\S]*?)<\/ul>/g)) {
    groups.push({ h: clean(g[1]), items: li(g[2]) });
  }
  const warn = (body.match(/class="warn-line"[^>]*>([\s\S]*?)<\/p>/) || [])[1];
  out.injuries.push({ part, groups, warn: warn ? clean(warn) : '' });
}

const items = out.cards.reduce((n, c) => n + c.items.length, 0);
const gItems = out.injuries.reduce(
  (n, i) => n + i.groups.reduce((k, g) => k + g.items.length, 0),
  0
);
console.log(`회복 카드 ${out.cards.length}개 · 항목 ${items}`);
console.log(`부위 ${out.injuries.length}개 · 소제목 ${out.injuries.reduce((n, i) => n + i.groups.length, 0)} · 항목 ${gItems}`);
console.log(`부위 목록: ${out.injuries.map((i) => i.part).join(' ')}`);
const chars = out.cards.concat(out.injuries).map((x) => JSON.stringify(x)).join('').length;
console.log(`글자 약 ${chars}`);

fs.writeFileSync(
  path.join(ROOT, 'scripts', '_recovery-ko.json'),
  JSON.stringify(out, null, 1),
  'utf-8'
);
console.log('scripts/_recovery-ko.json 저장');
