import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

// mkcert 로 만든 로컬 인증서가 있으면 dev 서버를 HTTPS 로 띄운다.
// HTTP 로는 서비스 워커가 등록되지 않아(보안 컨텍스트가 아니다) 아이폰에서
// PWA 설치·오프라인을 하나도 검증할 수 없다. localhost 만 예외라 LAN/USB 접속에는
// 인증서가 반드시 필요하다. 없으면 그냥 HTTP 로 뜬다 — 앱 자체는 돈다.
const certDir = path.resolve(import.meta.dirname, '.mkcert');
const keyPath = path.join(certDir, 'key.pem');
const certPath = path.join(certDir, 'cert.pem');
const https =
  fs.existsSync(keyPath) && fs.existsSync(certPath)
    ? { key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) }
    : undefined;

export default defineConfig({
  // 상대 경로로 뽑는다. GitHub Pages 가 저장소 이름이 붙은 하위 경로로 서빙하기 때문에
  // 절대 경로('/assets/...')로 뽑으면 배포본이 전부 404 가 된다.
  base: './',

  server: {
    host: true, // USB 테더링·LAN 의 다른 기기에서 접속하려면 필요하다
    port: 5173,
    https,
  },

  build: {
    outDir: 'dist',
    // 미디어가 22MB 라 인라인 임계값을 낮게 둔다
    assetsInlineLimit: 4096,
  },
});
