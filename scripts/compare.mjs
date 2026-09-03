// 원본(legacy)과 재구조화한 것을 화면별로 나란히 잰다.
//
// 0단계의 약속은 "동작을 바꾸지 않는다"인데, 그건 눈으로 훑어서는 확인할 수 없다.
// 화면마다 크기·색·개수를 숫자로 뽑아 두 쪽을 맞춰 본다. 다른 칸만 보면 된다.
import { launch, IPHONE_12 } from './_browser.mjs';

const A = process.env.URL_A || 'http://localhost:5199/'; // 원본
const B = process.env.URL_B || 'https://localhost:5173/'; // 재구조화

const SCREENS = [
  'start-screen', 'more-screen', 'ai-quiz-screen', 'settings-screen',
  'routines-screen', 'manual-select-screen', 'account-screen', 'setup-screen',
  'records-screen', 'recovery-screen', 'video-gallery-screen', 'result-screen',
];

async function measure(url) {
  const browser = await launch();
  const page = await browser.newPage(IPHONE_12);
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(700);

  const out = await page.evaluate((screens) => {
    const res = {};
    const all = [...document.querySelectorAll('.screen')];
    for (const id of screens) {
      const el = document.getElementById(id);
      if (!el) { res[id] = null; continue; }
      all.forEach((s) => s.classList.remove('active'));
      el.classList.add('active');
      // 레이아웃 강제 계산
      void document.body.offsetHeight;
      const cs = getComputedStyle(el);
      res[id] = {
        overflow: Math.max(0, document.documentElement.scrollWidth - window.innerWidth),
        scrollH: el.scrollHeight,
        buttons: el.querySelectorAll('button').length,
        nodes: el.querySelectorAll('*').length,
        pad: cs.paddingTop + '/' + cs.paddingBottom,
        bg: cs.backgroundColor,
      };
    }
    return res;
  }, SCREENS);

  await browser.close();
  return out;
}

const [a, b] = await Promise.all([measure(A), measure(B)]);

const keys = ['overflow', 'scrollH', 'buttons', 'nodes', 'pad', 'bg'];
let diffs = 0;

console.log('화면'.padEnd(22) + '항목'.padEnd(10) + '원본'.padEnd(16) + '재구조화');
console.log('-'.repeat(70));
for (const id of SCREENS) {
  if (!a[id] || !b[id]) { console.log(`${id}  한쪽에 없음`); diffs++; continue; }
  for (const k of keys) {
    const va = String(a[id][k]), vb = String(b[id][k]);
    if (va !== vb) {
      console.log(`${id.padEnd(22)}${k.padEnd(10)}${va.padEnd(16)}${vb}`);
      diffs++;
    }
  }
}
if (!diffs) console.log('(모든 칸이 같다)');

console.log('\n--- 가로 넘침 (양쪽 공통) ---');
for (const id of SCREENS) {
  const o = b[id]?.overflow;
  if (o) console.log(`  ${id.padEnd(22)} ${o}px  (원본 ${a[id]?.overflow}px)`);
}

console.log(`\n다른 칸 ${diffs}개`);
process.exit(diffs === 0 ? 0 : 1);
