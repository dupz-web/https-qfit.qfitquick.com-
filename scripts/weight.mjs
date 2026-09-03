// 첫 방문에 실제로 몇 바이트를 받는지 잰다.
//
// "미디어를 프리캐시에서 뺐다"는 말만으로는 확인이 안 된다 — 어딘가에서
// preload 나 <img> 하나가 남아 있으면 그대로 다시 받는다. 실제로 그랬다:
// warmup.mp4 가 preload="auto" 라 화면을 열기만 해도 8.6MB 를 받고 있었다.
//
// 그래서 빈 캐시로 열어서 오간 바이트를 센다.
import { launch, IPHONE_12 } from './_browser.mjs';

const TARGET = process.env.WEIGHT_URL || 'https://localhost:4173/';
const LIMIT_KB = Number(process.env.WEIGHT_LIMIT || 900); // 첫 로드 상한

const browser = await launch();
const ctx = await browser.newContext({ ...IPHONE_12, serviceWorkers: 'allow' });
const page = await ctx.newPage();

const byType = new Map();
let total = 0;

page.on('response', async (res) => {
  try {
    const h = await res.allHeaders();
    const len = Number(h['content-length'] || 0);
    const size = len || (await res.body().catch(() => Buffer.alloc(0))).length;
    if (!size) return;
    total += size;
    const url = new URL(res.url());
    const kind = url.origin !== new URL(TARGET).origin
      ? '외부(폰트·CDN)'
      : /\.(mp4|webm)$/.test(url.pathname) ? '영상'
      : /\.(webp|jpg|png)$/.test(url.pathname) ? '이미지'
      : /\.css$/.test(url.pathname) ? 'CSS'
      : /\.js$/.test(url.pathname) ? 'JS'
      : /\.(html|\/)$/.test(url.pathname) || url.pathname === '/' ? 'HTML'
      : '기타';
    byType.set(kind, (byType.get(kind) || 0) + size);
  } catch {}
});

await page.goto(TARGET, { waitUntil: 'networkidle', timeout: 45000 });
// 서비스 워커가 프리캐시를 받을 시간을 준다 — 그것도 첫 방문 비용이다
await page.waitForTimeout(3500);

await browser.close();

const kb = (b) => (b / 1024).toFixed(1) + ' KB';
console.log('첫 방문에 받은 것');
[...byType.entries()]
  .sort((a, b) => b[1] - a[1])
  .forEach(([k, v]) => console.log(`  ${k.padEnd(16)} ${kb(v).padStart(10)}`));
console.log(`  ${'합계'.padEnd(16)} ${kb(total).padStart(10)}   (상한 ${LIMIT_KB} KB)`);

const ok = total / 1024 <= LIMIT_KB;
console.log(ok ? '\n통과' : `\n초과 — ${(total / 1024 - LIMIT_KB).toFixed(0)} KB 넘음`);
process.exit(ok ? 0 : 1);
