// 화면을 찍는다. 라이트·다크 두 벌.
//
// 차트나 캔버스가 아니어도 그림으로만 보이는 것이 있다 — 색이 어긋난 것,
// 카드가 배경에 묻힌 것, 글자가 잘린 것. DOM 값으로는 안 잡힌다.
//
//   SHOT_ONLY=start-screen npm run shot   한 화면만
//   SHOT_THEME=dark        npm run shot   한 테마만
import fs from 'node:fs';
import { launch, IPHONE_12, DEFAULT_URL } from './_browser.mjs';

const URL = process.env.SHOT_URL || DEFAULT_URL;
const OUT = 'screenshots';
fs.mkdirSync(OUT, { recursive: true });

const ALL = [
  'start-screen', 'more-screen', 'setup-screen', 'manual-select-screen',
  'records-screen', 'recovery-screen', 'video-gallery-screen',
  'routines-screen', 'settings-screen', 'account-screen',
  'ai-quiz-screen', 'game-screen', 'result-screen',
];
const screens = process.env.SHOT_ONLY ? process.env.SHOT_ONLY.split(',') : ALL;
const themes = process.env.SHOT_THEME ? [process.env.SHOT_THEME] : ['light', 'dark'];

const browser = await launch();

for (const theme of themes) {
  const page = await browser.newPage({ ...IPHONE_12, colorScheme: theme });
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(700);

  for (const id of screens) {
    const found = await page.evaluate((sid) => {
      const el = document.getElementById(sid);
      if (!el) return false;
      document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
      el.classList.add('active');
      return true;
    }, id);
    if (!found) {
      console.log(`  ? ${id} — 없음`);
      continue;
    }
    await page.waitForTimeout(250);
    const file = `${OUT}/${theme}-${id}.png`;
    await page.screenshot({ path: file });
    console.log(`  ${file}`);
  }
  await page.close();
}

await browser.close();
console.log(`\n${themes.length}개 테마 × ${screens.length}개 화면`);
