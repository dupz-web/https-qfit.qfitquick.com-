// 아이폰에서 HTTPS 로 열기 위한 로컬 인증서를 만든다.
//
// 왜 필요한가: HTTP 로는 서비스 워커가 등록되지 않는다(보안 컨텍스트가 아니다).
// localhost 만 예외라 USB·LAN 으로 접속하는 아이폰에서는 PWA 설치·오프라인을
// 하나도 검증할 수 없다. 화면만 보고 "다 됐다"고 넘어가기 제일 쉬운 자리다.
//
// mkcert 를 쓰지 않는 이유: mkcert 는 Windows 신뢰 저장소에 CA 를 심는다.
// 신뢰해야 하는 건 아이폰 하나뿐이라 PC 를 건드릴 이유가 없다.
//
// iOS 가 인증서를 받아 주는 조건(13 이상)을 지킨다:
//   - SAN 이 있어야 한다 (CN 만으로는 거부한다)
//   - 유효기간 825일 이하
//   - extKeyUsage 에 serverAuth
import selfsigned from 'selfsigned';
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve(import.meta.dirname, '..', '.mkcert');
fs.mkdirSync(OUT, { recursive: true });

// 이 PC 가 가진 IPv4 전부 + 아이폰 USB 테더링이 주는 대역을 미리 넣어 둔다.
// 테더링을 켜야 그 IP 가 생기는데, 그때 인증서를 다시 만들게 하면
// "폰에 인증서를 또 깔아야 하나" 하는 자리가 생긴다.
const localIps = Object.values(os.networkInterfaces())
  .flat()
  .filter((n) => n && n.family === 'IPv4' && !n.internal)
  .map((n) => n.address);

const tetherIps = ['172.20.10.2', '172.20.10.3', '172.20.10.4', '172.20.10.5'];
const ips = [...new Set(['127.0.0.1', ...localIps, ...tetherIps])];

const altNames = [
  { type: 2, value: 'localhost' }, // DNS
  ...ips.map((ip) => ({ type: 7, ip })), // IP
];

// 이 버전의 generate 는 Promise 를 돌려준다
const pems = await selfsigned.generate([{ name: 'commonName', value: 'Q-fit dev' }], {
  keySize: 2048,
  days: 820, // iOS 상한 825일
  algorithm: 'sha256',
  extensions: [
    { name: 'basicConstraints', cA: false },
    { name: 'keyUsage', digitalSignature: true, keyEncipherment: true },
    { name: 'extKeyUsage', serverAuth: true },
    { name: 'subjectAltName', altNames },
  ],
});

fs.writeFileSync(path.join(OUT, 'key.pem'), pems.private);
fs.writeFileSync(path.join(OUT, 'cert.pem'), pems.cert);
// 아이폰이 사파리로 내려받을 파일. .crt 여야 iOS 가 프로파일로 인식한다.
fs.writeFileSync(path.join(OUT, 'dev-ca.crt'), pems.cert);

console.log('인증서를 만들었다: .mkcert/');
console.log('\n이 인증서가 덮는 주소:');
console.log('  localhost');
ips.forEach((ip) => console.log('  ' + ip));
console.log('\n아이폰에서 할 일 (한 번만):');
console.log('  1. 사파리로  https://<위 주소 중 하나>:5173/dev-ca.crt  를 연다');
console.log('  2. 설정 > 일반 > VPN 및 기기 관리 > 프로파일 설치');
console.log('  3. 설정 > 일반 > 정보 > 인증서 신뢰 설정 에서 "Q-fit dev" 를 켠다');
console.log('     ⚠ 3번을 빼먹으면 설치는 되지만 사파리가 계속 경고를 낸다');
