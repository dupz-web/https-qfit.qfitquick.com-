// 리마인더 규칙을 잰다.
//
// 알림은 잘못 만들면 앱을 지우게 만드는 기능이다. 두 가지가 특히 중요하다:
//  · 4일 경계를 정확히 지킬 것 (3일째에 오면 재촉이고, 5일째면 늦다)
//  · 같은 공백에 두 번 알리지 말 것 (쌓이는 순간 사람들은 알림을 끈다)
// 이건 화면으로 확인할 수 없어서 — 나흘을 기다릴 수는 없다 — 규칙을 직접 잰다.
import { launch, context, DEFAULT_URL } from './_browser.mjs';

const browser = await launch();
const page = await (await context(browser)).newPage();
await page.goto(process.env.REM_URL || DEFAULT_URL, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(600);

const DAY = 86400000;

const r = await page.evaluate(async (DAY) => {
  const m = await import('/src/notify/reminder.js');
  const now = Date.now();
  const clear = () => {
    try { localStorage.removeItem('qfit_reminder_sent_v1'); } catch {}
  };

  const out = {};
  out.gapDays = m.GAP_DAYS;

  // 경계
  clear();
  out['3일째'] = m.isDue(now - 3 * DAY, now);
  clear();
  out['4일 직전'] = m.isDue(now - 4 * DAY + 60000, now);
  clear();
  out['4일 지남'] = m.isDue(now - 4 * DAY - 60000, now);
  clear();
  out['10일 지남'] = m.isDue(now - 10 * DAY, now);

  // 한 번도 안 한 사람은 재촉하지 않는다
  clear();
  out['기록없음'] = m.isDue(0, now);

  // 같은 공백에 두 번 알리지 않는다
  clear();
  const last = now - 6 * DAY;
  const first = m.isDue(last, now);
  m.markSent(now);
  const second = m.isDue(last, now + 60000);
  out['처음'] = first;
  out['보낸직후'] = second;

  // 다시 운동하면 그 다음 공백에는 또 알린다
  const after = m.isDue(now + 1 * DAY, now + 6 * DAY);
  out['다시운동뒤'] = after;

  clear();
  return out;
}, DAY);

const EXPECT = {
  gapDays: 4,
  '3일째': false,
  '4일 직전': false,
  '4일 지남': true,
  '10일 지남': true,
  기록없음: false,
  처음: true,
  보낸직후: false,
  다시운동뒤: true,
};

let fail = 0;
for (const [k, want] of Object.entries(EXPECT)) {
  const got = r[k];
  const ok = got === want;
  if (!ok) fail++;
  console.log(`  ${ok ? '통과' : '실패'}  ${k.padEnd(10)} ${String(got).padEnd(6)} (기대 ${want})`);
}

await browser.close();
console.log(fail ? `\n실패 ${fail}건` : '\n전부 통과');
process.exit(fail ? 1 : 0);
