// 스플래시를 걷는다.
//
// 목적은 '로고를 몇 초 보여 주는 것'이 아니라 '앱이 준비될 때까지 빈 화면을
// 안 보이는 것'이다. 그래서 준비되는 즉시 사라지되, 너무 빨리 사라져 깜빡임처럼
// 보이지 않도록 최소 노출만 지킨다.
//
// 스플래시가 오래 남아 있으면 그건 연출이 아니라 지연이다.
const MIN_MS = 550;
const startedAt = performance.now();

export function hideSplash() {
  const el = document.getElementById('splash');
  if (!el) return;
  const wait = Math.max(0, MIN_MS - (performance.now() - startedAt));
  setTimeout(() => {
    el.style.opacity = '0';
    // 투명해진 뒤에 치운다. 남겨 두면 화면 전체를 덮은 채라 아무것도 못 누른다.
    setTimeout(() => el.remove(), 340);
  }, wait);
}
