// 진입점. CSS 를 순서대로 들이고 앱 본체를 띄운다.
//
// ⚠ CSS 순서를 바꾸지 말 것. 특이도가 같은 규칙끼리는 나중에 온 쪽이 이기므로,
// 순서가 바뀌면 어디가 어떻게 달라졌는지 알 수 없는 방식으로 화면이 틀어진다.
// 이 여섯 줄은 legacy/index.html 의 <style> 한 덩어리를 자른 것이고 순서가 곧 원본이다.
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/screens.css';
import './styles/game.css';
import './styles/result.css';
import './styles/figures.css';

// 아이폰 화면 위 콘솔. 개발 빌드에만 들어간다 — 프로덕션에서는 이 블록이 통째로 사라진다.
if (import.meta.env.DEV) {
  import('./dev/console.js');
}

import './app.js';
import { paintIcons } from './ui/icons.js';
import { initNav } from './ui/nav.js';
import { hideSplash } from './ui/splash.js';

// data-icon 이 적힌 자리에 선 아이콘을 채운다
paintIcons();
// 하단 탭바와 뒤로가기. app.js 가 화면을 다 만든 뒤여야 한다.
initNav();
// 앱이 다 붙은 뒤에 스플래시를 걷는다
hideSplash();

// 서비스 워커 등록은 vite-plugin-pwa 가 넣는다(injectRegister: 'auto').
// 여기서 또 등록하면 두 벌이 서로를 덮어쓴다.
