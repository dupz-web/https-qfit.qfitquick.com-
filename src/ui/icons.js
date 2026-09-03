// 선 아이콘 몇 개.
//
// 이모지를 아이콘으로 쓰지 않는다. 이유가 셋이다:
//  - 플랫폼마다 그림이 다르다. 아이폰의 🔊 와 안드로이드의 🔊 는 다른 그림이고,
//    그래서 "우리 앱은 이렇게 생겼다"를 만들 수가 없다.
//  - 색이 박혀 있어 테마를 안 따라간다. 다크에서 혼자 튄다.
//  - 스크린리더가 "스피커 이모지"라고 읽는다.
//
// 그려야 할 뜻이 있는 자리에만 둔다. 장식으로는 쓰지 않는다 —
// 아이콘이 스무 개가 되면 그때부터는 글자보다 읽기 어렵다.

const svg = (paths, extra = '') =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ` +
  `stroke-linecap="round" stroke-linejoin="round" width="20" height="20" ` +
  `aria-hidden="true" focusable="false"${extra}>${paths}</svg>`;

export const ICON = {
  soundOn: svg(
    '<path d="M11 5 6 9H3v6h3l5 4V5Z"/>' +
    '<path d="M15.5 9a4 4 0 0 1 0 6"/>' +
    '<path d="M18.5 6.5a8 8 0 0 1 0 11"/>'
  ),
  soundOff: svg(
    '<path d="M11 5 6 9H3v6h3l5 4V5Z"/>' +
    '<path d="m16 9 5 6"/><path d="m21 9-5 6"/>'
  ),
  close: svg('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>'),
  pause: svg('<path d="M10 5v14"/><path d="M15 5v14"/>'),
  play: svg('<path d="M7 4.5v15l12-7.5-12-7.5Z" fill="currentColor" stroke="none"/>'),
  back: svg('<path d="M15 5 8 12l7 7"/>'),

  // 하단 탭
  home: svg('<path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1v-9.5Z"/>'),
  chart: svg('<path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M22 20H2"/>'),
  recovery: svg('<path d="M20.8 6.6a4.9 4.9 0 0 0-7 0L12 8.4l-1.8-1.8a4.9 4.9 0 1 0-7 7l8.8 8.8 8.8-8.8a4.9 4.9 0 0 0 0-7Z"/>'),
  more: svg('<path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/>'),
};

// 마크업에 data-icon="close" 라고 적어 두면 부팅할 때 채워 넣는다.
// HTML 안에 SVG 를 손으로 붙여 넣으면 같은 아이콘이 여러 벌이 되고,
// 하나를 고쳤을 때 나머지가 안 따라온다.
export function paintIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach((el) => {
    const name = el.dataset.icon;
    if (ICON[name]) el.innerHTML = ICON[name];
  });
}
