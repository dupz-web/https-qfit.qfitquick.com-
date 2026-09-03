// 화면 머리 규칙 한 벌.
//
// 설계가 정한 것:
//   · 탭바로 바로 닿는 네 화면(홈·기록·회복·더보기) — 큰 제목
//   · 그 아래 화면 — 44px 뒤로 버튼 + 좌측 제목
//   · 운동 중 — 탭바를 감추고 나가는 길은 일시정지뿐
//
// 예전에는 화면마다 머리가 달랐고, 뒤로 가는 길이 화면 맨 아래 '닫기' 에
// 있었다. 스크롤을 끝까지 내려야 나가는 화면은, 깊이 들어갈수록 나가기 어렵다.
//
// 마크업을 여덟 군데 고치는 대신 여기서 만들어 넣는다. 뒤로 버튼은 원래
// 있던 '닫기' 를 대신 눌러 준다 — 그 버튼이 어디로 돌아갈지를 이미 알고 있고,
// 두 벌로 만들면 한쪽만 고쳤을 때 갈라진다.

// 화면 id → [사전 키, 원래 있던 뒤로 버튼]
const SUB_SCREENS = {
  'setup-screen': ['todayWod', '#setup-back-btn'],
  'manual-select-screen': ['modeManual', '#manual-back-btn'],
  'ai-quiz-screen': ['aiEyebrow', '#ai-quiz-back-btn'],
  'routines-screen': ['routinesTitle', '#routines-back-btn'],
  'account-screen': ['accountEyebrow', '#account-back-btn'],
  'settings-screen': ['settingsBtn', '#settings-back-btn'],
  'video-gallery-screen': ['movesBtn', '#video-gallery-back-btn'],
};

let dict = null;
let translate = null;

function titleFor(key) {
  const entry = dict?.[key];
  return entry ? translate(entry) : '';
}

export function initHeaders({ STATIC_UI, t, ICON }) {
  dict = STATIC_UI;
  translate = t;

  for (const [id, [key, backSel]] of Object.entries(SUB_SCREENS)) {
    const screen = document.getElementById(id);
    if (!screen || screen.querySelector('.hd')) continue;

    const hd = document.createElement('header');
    hd.className = 'hd';
    hd.innerHTML =
      `<button class="hd-back" type="button" aria-label="뒤로">${ICON.back}</button>` +
      `<h2 class="hd-title" data-hd-key="${key}"></h2>`;

    hd.querySelector('.hd-back').addEventListener('click', () => {
      const back = document.querySelector(backSel);
      if (back) back.click();
      else history.back();
    });

    screen.prepend(hd);

    // 화면 맨 아래의 '닫기'·'이전' 은 헤더가 대신하므로 감춘다 — 목록이 길면
    // 스크롤을 끝까지 내려야 나가는 길이 보인다. 지우지는 않는다:
    // 헤더의 뒤로 버튼이 이 버튼을 눌러 원래 동작을 그대로 쓴다.
    //
    // 다만 '계정 없이 계속하기' 처럼 뜻이 있는 버튼은 남긴다. 그건 뒤로가
    // 아니라 선택지고, 감추면 그 선택이 화면에서 사라진다.
    const back = document.querySelector(backSel);
    const generic = back && ['lbBackBtn', 'backBtn'].includes(back.dataset.i18n);
    if (generic && back.closest('.screen') === screen) back.hidden = true;

    // 큰 제목은 탭바로 바로 닿는 네 화면의 것이다. 하위 화면에서는 헤더가
    // 이름을 대므로, 남겨 두면 같은 낱말이 위아래로 두 번 나온다 —
    // 두 자리가 같은 사전 키를 읽으니 우연이 아니라 늘 그렇다.
    // 눈꼬리(eyebrow)도 같이 접는다. 제목 없이 그것만 남으면 무엇의
    // 머리말인지 알 수 없는 한 줄이 된다.
    const hero = screen.querySelector(':scope > .lb-title');
    if (hero) {
      const eyebrow = hero.previousElementSibling;
      if (eyebrow?.classList.contains('eyebrow')) eyebrow.hidden = true;
      hero.hidden = true;
    }
  }

  paintTitles();

  // 언어를 바꾸면 제목도 바뀐다. app.js 의 applyStaticTranslations 는
  // 마크업에 적힌 자리만 훑는데, 이 제목들은 여기서 만들어 넣은 것이라
  // 그 목록에 없다 — 부르는 쪽이 기억해야 하는 구조로 두면 잊는다.
  document.addEventListener('qfit:lang', paintTitles);
}

/** 언어가 바뀌면 제목도 바뀐다. */
export function paintTitles() {
  if (!dict) return;
  document.querySelectorAll('.hd-title[data-hd-key]').forEach((el) => {
    el.textContent = titleFor(el.dataset.hdKey);
  });
}
