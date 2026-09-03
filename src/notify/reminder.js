// 리마인더 — 나흘 동안 운동을 안 하면 한 번 알린다(FR-03).
//
// ── 지금 어디까지 되는가 ──────────────────────────────
// 실제 '푸시'(앱을 닫아 둔 사이에 오는 알림)는 서버가 보내야 하고, 그러려면
// 배포된 주소와 푸시 구독 저장소가 있어야 한다. 지금은 배포가 없다.
// iOS 는 조건이 하나 더 붙는다 — HTTPS 배포 + 홈 화면 추가, 둘 다 있어야 한다.
//
// 그래서 여기는 이렇게 나눠 둔다:
//   · 언제 알릴지 판단하는 규칙        → 지금 동작한다(아래 dueAt/isDue)
//   · 권한을 받고 상태를 기억하는 UI    → 지금 동작한다
//   · 앱이 열려 있을 때 알림 띄우기      → 지금 동작한다
//   · 앱이 닫혀 있을 때 보내기(웹푸시)   → 배포가 붙는 날 켠다(sendPush 자리)
//
// 이렇게 두는 이유: 규칙과 UI 를 나중에 몰아서 만들면, 그때는 배포 문제와
// 로직 문제가 섞여 무엇이 안 되는지 가려내기 어려워진다.

const KEY_ON = 'qfit_reminder_on_v1';
const KEY_LAST_SENT = 'qfit_reminder_sent_v1';

/** 며칠 쉬면 알릴지. 명세서가 정한 값이다. */
export const GAP_DAYS = 4;
const DAY = 86400000;

const read = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const write = (k, v) => { try { localStorage.setItem(k, v); } catch {} };

export function isEnabled() {
  return read(KEY_ON) === '1';
}

/** 알림을 받을 수 있는 상태인가. 거절했거나 지원 안 하면 false. */
export function canNotify() {
  return typeof Notification !== 'undefined' && Notification.permission === 'granted';
}

/** 다음에 알릴 시각. 마지막 운동이 없으면 null — 한 번도 안 한 사람을 재촉하지 않는다. */
export function dueAt(lastPlayMs) {
  if (!lastPlayMs) return null;
  return lastPlayMs + GAP_DAYS * DAY;
}

/** 지금 알릴 때인가.
 *  같은 공백에 대해 두 번 알리지 않는다 — 알림이 쌓이는 앱은 그 순간부터 꺼진다. */
export function isDue(lastPlayMs, now = Date.now()) {
  const due = dueAt(lastPlayMs);
  if (!due || now < due) return false;
  const sent = Number(read(KEY_LAST_SENT) || 0);
  // 마지막으로 보낸 시각이 이번 공백 안이면 이미 보낸 것이다
  return sent < (lastPlayMs || 0) || sent < due;
}

export function markSent(now = Date.now()) {
  write(KEY_LAST_SENT, String(now));
}

/** 켜기 — 권한을 여기서 묻는다. 부팅하자마자 묻지 않는 이유는,
 *  아직 앱이 뭘 하는지도 모르는 사람에게 알림부터 물으면 대부분 거절하고
 *  그 거절은 브라우저가 기억해서 되돌리기 어렵기 때문이다. */
export async function enable() {
  if (typeof Notification === 'undefined') return false;
  const res = await Notification.requestPermission();
  const ok = res === 'granted';
  write(KEY_ON, ok ? '1' : '0');
  return ok;
}

export function disable() {
  write(KEY_ON, '0');
}

/** 앱이 열려 있는 동안 확인해서, 알릴 때면 알린다.
 *  닫혀 있는 사이는 웹푸시가 필요하고 그건 배포가 붙어야 한다. */
export function checkOnOpen(lastPlayMs) {
  if (!isEnabled() || !canNotify()) return false;
  if (!isDue(lastPlayMs)) return false;
  try {
    new Notification('Q-fit', {
      body: GAP_DAYS + '일 쉬었습니다. 1분이면 다시 시작할 수 있어요.',
      icon: `${import.meta.env.BASE_URL}icons/icon-192.png`,
      tag: 'qfit-reminder', // 같은 태그는 덮어쓴다 — 알림이 쌓이지 않는다
    });
    markSent();
    return true;
  } catch (e) {
    console.error('reminder failed:', e);
    return false;
  }
}

// 배포가 붙는 날 여기를 채운다.
// 지금 빈 채로 두는 이유: 서버 없이 흉내만 내면 "되는 것처럼 보이는데 안 오는"
// 상태가 되고, 그건 아예 없는 것보다 나쁘다.
export async function subscribePush() {
  return { ok: false, reason: 'not-deployed' };
}
