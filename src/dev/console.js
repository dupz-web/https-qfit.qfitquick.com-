// 아이폰 화면 위에 콘솔을 띄운다. 개발 빌드에서만 들어간다.
//
// Safari 웹 인스펙터는 macOS 전용이라, Mac 없이 아이폰에서 무슨 일이 나는지 보려면
// 페이지 안에 콘솔을 넣는 수밖에 없다. 오류·네트워크·엘리먼트·localStorage 를 다 볼 수 있어
// 일상 작업에는 이걸로 충분하다. 브레이크포인트가 필요할 때만 ios-webkit-debug-proxy 를 쓴다.
//
// main.js 가 import.meta.env.DEV 안에서 동적 import 하므로 프로덕션 번들에는 안 들어간다.
import eruda from 'eruda';

eruda.init({
  tool: ['console', 'network', 'elements', 'resources', 'info'],
  defaults: { displaySize: 45, transparency: 0.95, theme: 'Monokai Pro' },
});

// 잡히지 않은 오류는 눈에 띄게 남긴다 — 폰에서는 콘솔을 열어 보기 전까지 모른다
window.addEventListener('error', (e) => {
  console.error('[uncaught]', e.message, e.filename + ':' + e.lineno);
});
window.addEventListener('unhandledrejection', (e) => {
  console.error('[unhandled promise]', e.reason);
});

console.log('%c Q-fit dev ', 'background:#ffd60a;color:#0d0a08;font-weight:bold', location.href);
