// 앱이 실제로 뜨는지 본다. 빌드가 통과하는 것과 앱이 도는 것은 다르다.
//
// 모듈로 쪼갠 뒤 제일 흔한 사고는 "빌드는 되는데 참조가 하나 끊긴 것"이다.
// 그건 콘솔에만 나오고 빌드는 조용히 성공한다. 그래서 여기서 콘솔을 읽는다.
import { chromium } from 'playwright';

const URL = process.env.SMOKE_URL || 'http://localhost:5173/';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 664 } });

const errors = [];
const warnings = [];
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
  if (m.type() === 'warning') warnings.push(m.text());
});
page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`));
page.on('requestfailed', (r) => {
  // warmup.mp4 는 preload="auto" 라 8.6MB 를 무조건 받기 시작하고, 헤드리스가
  // 페이지를 닫으면서 중단시킨다. 여기서는 오탐이지만 실제로도 문제라서 경고로 남긴다.
  // (5단계에서 preload="none" 으로 고친다)
  const line = `${r.url()} — ${r.failure()?.errorText}`;
  if (r.url().includes('warmup.mp4')) warnings.push(`[중단됨] ${line}`);
  else errors.push(`[404/실패] ${line}`);
});

await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });

const probe = await page.evaluate(() => {
  const q = (s) => document.querySelector(s);
  const screens = [...document.querySelectorAll('.screen')].map((e) => e.id);
  return {
    screens: screens.length,
    activeScreen: q('.screen.active')?.id ?? null,
    // 앱이 실제로 초기화됐는지: JS 가 채우는 것들
    playBtnText: q('#play-btn')?.textContent?.trim() ?? null,
    exGridChildren: q('#ex-grid')?.children.length ?? -1,
    weekStripChildren: q('.week-strip')?.children.length ?? -1,
    // 스타일이 붙었는지
    bodyBg: getComputedStyle(document.body).backgroundImage.slice(0, 40),
    appMaxWidth: getComputedStyle(q('#app')).maxWidth,
    cssVarFire: getComputedStyle(document.documentElement)
      .getPropertyValue('--fire')
      .trim(),
  };
});

console.log('--- 화면 ---');
console.log(`  .screen 개수      ${probe.screens}  (기대 16)`);
console.log(`  현재 활성 화면    ${probe.activeScreen}`);
console.log('--- JS 초기화 ---');
console.log(`  #play-btn 문구    ${JSON.stringify(probe.playBtnText)}`);
console.log(`  주간 스트립 칸    ${probe.weekStripChildren}  (기대 7)`);
console.log('--- CSS ---');
console.log(`  --fire            ${JSON.stringify(probe.cssVarFire)}`);
console.log(`  #app max-width    ${probe.appMaxWidth}  (기대 460px)`);
console.log(`  body 배경         ${probe.bodyBg}...`);

if (warnings.length) {
  console.log(`\n--- 경고 ${warnings.length}건 ---`);
  warnings.slice(0, 10).forEach((w) => console.log('  ' + w.slice(0, 160)));
}

await browser.close();

if (errors.length) {
  console.log(`\n=== 오류 ${errors.length}건 ===`);
  errors.slice(0, 25).forEach((e) => console.log('  ' + e.slice(0, 200)));
  process.exit(1);
}

const ok =
  probe.screens === 16 &&
  probe.activeScreen === 'start-screen' &&
  probe.weekStripChildren === 7 &&
  probe.cssVarFire === '#ff3d00' &&
  probe.appMaxWidth === '460px';

console.log(ok ? '\n통과' : '\n실패 — 위 값 중 기대와 다른 것이 있다');
process.exit(ok ? 0 : 1);
