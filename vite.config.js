import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    // 서비스 워커를 빌드가 만든다.
    //
    // 손으로 쓰던 예전 sw.js 는 두 가지가 문제였다:
    //  1. 미디어 45개를 install 때 전부 프리캐시했다 — 첫 방문에 22.5MB 다운로드.
    //     3G 나 저가 요금제에서는 사실상 이탈이다.
    //  2. 캐시 이름('zip-v28')을 손으로 올려야 했다. 잊으면 cache-first 때문에
    //     사용자에게 영원히 구버전 미디어가 나간다. 그게 제일 디버깅하기 어렵다.
    //
    // 이제 앱 껍데기(HTML·CSS·JS·아이콘)만 미리 받고 — 파일 해시가 곧 버전이라
    // 잊을 수가 없다 — 미디어는 실제로 볼 때 받아서 캐시에 남긴다.
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: false, // public/manifest.webmanifest 를 그대로 쓴다
      workbox: {
        globPatterns: ['**/*.{js,css,html}', 'icons/*.png', 'manifest.webmanifest'],
        globIgnores: [
          // 미디어는 프리캐시에서 뺀다. 이 한 줄이 첫 로드 22.5MB 를 없앴다.
          '**/media/**',
          // Supabase SDK(약 219KB)도 뺀다. 로그인은 선택 기능인데 프리캐시에
          // 남겨 두면 결국 모두가 받게 되어, 지연 로딩으로 만든 뜻이 사라진다.
          '**/supabase-*.js',
        ],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // 운동 사진·영상. 한 번 본 것은 남겨 두어 다음엔 오프라인에서도 나온다.
            urlPattern: ({ url }) => url.pathname.includes('/media/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'qfit-media',
              // 비디오는 Range 요청으로 조각을 받는다. 이게 없으면 사파리에서
              // 캐시된 영상이 재생되지 않는 일이 생긴다.
              rangeRequests: true,
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 60 },
            },
          },
          {
            // 폰트. 없으면 오프라인에서 타이포가 통째로 달라진다.
            urlPattern: ({ url }) => url.origin === 'https://cdn.jsdelivr.net',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'qfit-font',
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  // 상대 경로로 뽑는다. GitHub Pages 가 저장소 이름이 붙은 하위 경로로 서빙하기 때문에
  // 절대 경로('/assets/...')로 뽑으면 배포본이 전부 404 가 된다.
  base: './',

  server: {
    port: 5173,
  },

  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        // Supabase 를 이름이 정해진 청크로 뽑는다. 해시 이름 그대로 두면
        // 프리캐시 제외 규칙을 쓸 수가 없다.
        manualChunks(id) {
          if (id.includes('@supabase')) return 'supabase';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
      },
    },
    // 미디어가 22MB 라 인라인 임계값을 낮게 둔다
    assetsInlineLimit: 4096,
  },
});
