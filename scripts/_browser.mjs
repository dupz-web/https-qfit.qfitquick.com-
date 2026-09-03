// 검사 스크립트들이 공유하는 브라우저 설정.
//
// dev 서버가 자체 서명 인증서로 HTTPS 를 쓰므로 크로미움을 두 겹으로 열어 줘야 한다:
//   - ignoreHTTPSErrors  : 페이지 이동
//   - --ignore-certificate-errors : 서비스 워커 스크립트 요청
// 앞의 것만 주면 페이지는 뜨는데 SW 등록만 조용히 실패한다. 그러면
// "오프라인이 안 되는데 화면은 멀쩡한" 상태를 검사로는 못 잡는다.
import { chromium } from 'playwright';

export const DEFAULT_URL = process.env.QFIT_URL || 'http://localhost:5173/';

export const launch = () =>
  chromium.launch({ args: ['--ignore-certificate-errors'] });

// 기준 기기: 아이폰 12 (390×664, 사파리 크롬 제외)
export const IPHONE_12 = {
  viewport: { width: 390, height: 664 },
  deviceScaleFactor: 2,
  hasTouch: true,
  isMobile: true,
  ignoreHTTPSErrors: true,
};

export const context = (browser, over = {}) =>
  browser.newContext({ ...IPHONE_12, ...over });
