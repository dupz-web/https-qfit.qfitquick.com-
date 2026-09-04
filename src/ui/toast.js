// 잠깐 떴다 사라지는 한 줄.
//
// 막을 때는 반드시 말해 준다. 예전에는 상한에 걸리면 카드를 눌러도 체크가
// 안 켜지기만 했는데, 그러면 왜 안 되는지 알 길이 없어서 고장으로 읽힌다.
//
// 화면을 가리지 않고 스스로 사라지는 것이라 닫기 버튼을 두지 않는다.
// 대신 role=status 로 두어 스크린리더에는 읽히게 한다 — 눈으로 못 보고
// 지나친 사람에게는 이 한 줄이 유일한 설명이다.

let el = null;
let hideTimer = null;

export function toast(text, ms = 2200) {
  if (!text) return;
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    document.getElementById('app')?.appendChild(el);
  }
  el.textContent = text;
  // 애니메이션을 처음부터 다시 튼다. 안 그러면 연달아 부를 때
  // 두 번째부터는 이미 끝난 애니메이션이라 아무 움직임이 없다.
  el.classList.remove('on');
  void el.offsetWidth;
  el.classList.add('on');

  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => el.classList.remove('on'), ms);
}
