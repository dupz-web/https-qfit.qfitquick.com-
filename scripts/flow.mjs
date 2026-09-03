// 핵심 루프가 끝까지 도는지 본다: 홈 → 모드 → 설정 → 미리보기 → 카운트다운 → 운동.
//
// 스모크는 "홈이 뜬다"까지고, 모듈로 쪼갠 뒤 실제로 깨지는 건 화면을 넘어가는 자리다.
// 참조가 하나 끊겨도 홈은 멀쩡히 뜨기 때문에 여기까지 와야 알 수 있다.
import { launch, context, DEFAULT_URL } from './_browser.mjs';
import fs from 'node:fs';

const URL = process.env.FLOW_URL || DEFAULT_URL;
const SHOT_DIR = 'screenshots';
fs.mkdirSync(SHOT_DIR, { recursive: true });

const browser = await launch();
const ctx = await context(browser); // 기준 기기: 아이폰 12
const page = await ctx.newPage();

const errors = [];
page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});

const active = () => page.evaluate(() => document.querySelector('.screen.active')?.id);
const step = async (label, fn) => {
  await fn();
  const id = await active();
  console.log(`  ${label.padEnd(22)} → ${id}`);
  return id;
};

await page.goto(URL, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(600);

console.log('--- 화면 이동 ---');
await step('시작', async () => {});
await step('▶ 1분 시작', () => page.click('#one-min-start-btn'));
await step('🎲 랜덤 선택', () => page.click('#mode-random'));

// 준비운동은 끄고 간다 — 8.6MB 영상을 받을 이유가 없다
await page.evaluate(() => {
  const t = document.getElementById('warmup-toggle');
  if (t && t.checked) t.click();
});

await page.screenshot({ path: `${SHOT_DIR}/setup.png` });
await step('START Q', () => page.click('#play-btn'));

// 미리보기 3.2초 → 카운트다운 3-2-1(650ms×3)
await page.waitForTimeout(3600);
await step('미리보기 대기', async () => {});
await page.waitForTimeout(2600);
const finalScreen = await step('카운트다운 대기', async () => {});

const game = await page.evaluate(() => {
  const q = (s) => document.querySelector(s);
  const vis = (s) => {
    const e = q(s);
    if (!e) return null;
    const r = e.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  return {
    exName: q('.ex-name')?.textContent?.trim() ?? null,
    setCounter: q('#set-counter')?.textContent?.trim() ?? null,
    holdRingNum: q('.hold-ring .num')?.textContent?.trim() ?? null,
    photoSrc: q('#photo-demo-a')?.getAttribute('src') ?? null,
    figureClass: q('.figure-wrap')?.className ?? null,
    photoVisible: vis('.photo-demo-wrap'),
    // 가로 넘침 — 폰에서 페이지가 밀리는지
    overflowPx: Math.max(0, document.documentElement.scrollWidth - window.innerWidth),
  };
});

console.log('\n--- 운동 화면 ---');
for (const [k, v] of Object.entries(game)) console.log(`  ${k.padEnd(14)} ${JSON.stringify(v)}`);

await page.screenshot({ path: `${SHOT_DIR}/game.png` });

// 사진이 실제로 로드됐는지 (src 만 박히고 404 인 경우를 잡는다)
const photoOk = await page.evaluate(() => {
  const img = document.getElementById('photo-demo-a');
  return img ? img.naturalWidth > 0 : false;
});
console.log(`  사진 실제 로드     ${photoOk}`);

await browser.close();

// 가로 넘침은 여기서 판정하지 않는다 — `npm run phone` 이 네 폭 × 화면별로 맡는다.
// 한 검사가 두 가지를 판정하면 빨간불이 떴을 때 어느 쪽이 깨진 건지 모른다.
if (game.overflowPx > 0) {
  console.log(`  ⚠ 가로 넘침 ${game.overflowPx}px — 판정은 'npm run phone' 이 한다`);
}

const ok =
  finalScreen === 'game-screen' &&
  !!game.exName &&
  photoOk &&
  errors.length === 0;

if (errors.length) {
  console.log(`\n=== 오류 ${errors.length}건 ===`);
  errors.slice(0, 20).forEach((e) => console.log('  ' + e.slice(0, 200)));
}
console.log(ok ? '\n통과' : '\n실패');
process.exit(ok ? 0 : 1);
