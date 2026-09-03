// 마크업의 한글 문구를 사전에 넣고 data-i18n 을 붙인다.
//
// 값이 JS 로 계속 덮이는 자리(0일 · 0회 · 점프 처럼 자리표시자인 것)는 건드리지
// 않는다 — 이름표를 붙이면 부팅 때 사전 값으로 덮어써서, 실제 값이 잠깐 보였다가
// 자리표시자로 되돌아가는 이상한 화면이 된다.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');

// [키, 한국어, 영어, 중국어]
const ENTRIES = [
  ['appTitle', 'Q-fit — 게임을 켰더니 운동이 끝나있다', "Q-fit — open the app, workout's already done", 'Q-fit — 打开就练，练完就走'],
  ['inappText1', '카카오톡 인앱 브라우저는 소리 재생을 제한합니다.', 'This in-app browser restricts sound playback.', '此内置浏览器限制声音播放。'],
  ['inappText2', '아래 버튼으로 기본 브라우저에서 열어주십시오.', 'Tap below to open in your default browser.', '请点下方按钮用系统浏览器打开。'],
  ['inappHint1', '버튼이 안 되면 오른쪽 위', 'If the button fails, tap the top-right', '按钮无效时，点右上角'],
  ['inappHint2', '"다른 브라우저로 열기"를 선택해주십시오.', 'and choose "Open in browser".', '并选择“在浏览器中打开”。'],

  ['heroLine', '1분이면 끝. 귀찮지 않은 운동.', 'One minute. No excuses.', '一分钟搞定，不用犹豫。'],
  ['startCta', '1분 시작', 'Start 1 min', '开始1分钟'],
  ['installText', '홈 화면에 추가하면 더 빠르게 써요', 'Add to home screen for faster access', '添加到主屏幕，打开更快'],
  ['installBtn', '설치', 'Install', '安装'],
  ['installDetail1', 'Safari 하단 공유 버튼()을 누르고', 'Tap the Share button in Safari, then', '点按 Safari 下方的分享按钮，然后'],
  ['installDetail2', '"홈 화면에 추가"', '"Add to Home Screen"', '“添加到主屏幕”'],
  ['weekendBanner', '주말 한정! 오늘 완주하면 XP 2배', 'Weekend only — finish today for 2x XP', '周末限定！今天完成可得双倍XP'],
  ['moreLink', '내 기록 · 루틴 더보기', 'Records · Routines · More', '记录 · 方案 · 更多'],

  ['aiEyebrow', 'AI 루틴', 'AI Routine', 'AI方案'],
  ['aiQ1', '오늘 목표가 무엇입니까?', "What's your goal today?", '今天的目标是什么？'],
  ['goalStamina', '체력', 'Stamina', '体能'],
  ['goalDiet', '다이어트', 'Weight loss', '减脂'],
  ['goalStrength', '근력', 'Strength', '力量'],

  ['setBgm', '배경음악', 'Music', '背景音乐'],
  ['setSfx', '효과음', 'Sound effects', '音效'],
  ['setVibe', '진동', 'Vibration', '震动'],

  ['quickByLevel', '난이도별 빠른 선택', 'Quick pick by level', '按难度快速选择'],

  ['accountEyebrow', '계정 연동', 'Account', '账号'],
  ['accountBlurb', '로그인하면 기기 바뀌어도 기록이 그대로 이어져요.', 'Log in to keep your records across devices.', '登录后换设备也能保留记录。'],
  ['signupBtn', '회원가입', 'Sign up', '注册'],
  ['skipAccount', '계정 없이 계속하기', 'Continue without an account', '不登录，继续使用'],

  ['setCountLabel', '세트 수', 'Sets', '组数'],
  ['sets4', '4세트', '4 sets', '4组'],
  ['sets8', '8세트', '8 sets', '8组'],
  ['sets12', '12세트', '12 sets', '12组'],
  ['customSets', '직접 입력 (세트)', 'Custom (sets)', '自定义（组数）'],
  ['durationHint', '세트 수를 고르면 운동 시간을 정할 수 있어요', 'Pick a set count to choose the length', '选好组数后即可设置时长'],
  ['customSecs', '직접 입력 (초)', 'Custom (seconds)', '自定义（秒）'],
  ['myInfo', '내 정보 (선택)', 'About you (optional)', '我的信息（选填）'],
  ['nickHint', '결과 공유할 때 이 이름으로 표시됩니다', 'Shown as your name when sharing results', '分享成绩时会显示这个名字'],
  ['weightLabel', '체중', 'Weight', '体重'],
  ['weightHint', '칼로리 추정 정확도를 높이는 데 쓰여요 (미입력 시 65kg 기준)', 'Improves calorie estimates (defaults to 65kg)', '用于更准确地估算消耗（未填按65kg计）'],
  ['saveAsRoutine', '루틴으로 저장', 'Save as routine', '保存为方案'],

  ['thisMonth', '이번 달', 'This month', '本月'],
  ['xpBottleHint', '운동 완주할 때마다 물이 차올라요', 'The bottle fills each time you finish', '每完成一次，水位就上升'],
  ['achievements', '업적', 'Achievements', '成就'],
  ['noSessions', '아직 완주 기록이 없습니다.', 'No sessions completed yet.', '还没有完成记录。'],

  ['movesBlurb', '직접 찍은 동작 영상들입니다. 스크롤하면서 자세를 참고해보십시오.', 'Videos we filmed ourselves. Scroll to check your form.', '我们自己拍的动作视频，滑动参考姿势。'],
  ['searchEmpty', '검색 결과가 없습니다', 'No results', '没有搜索结果'],

  ['todayWod', '오늘의 WOD', "Today's WOD", '今天的训练'],
  ['wodOrder', '이 순서대로 진행해요', "Here's the order", '按这个顺序进行'],
  ['warmupError', '준비운동 영상을 불러오지 못했습니다. 건너뛰고 시작해도 됩니다.', "Couldn't load the warm-up video. You can skip it.", '热身视频加载失败，可以跳过。'],

  ['bonusBanner', '보너스 라운드 · 2배 XP', 'Bonus round · 2x XP', '奖励回合 · 双倍XP'],
  ['secUnit', '초', 'sec', '秒'],
  ['savePrompt', '기록 저장할까요?', 'Save your records?', '要保存记录吗？'],
  ['loginNow', '로그인하기', 'Log in', '去登录'],
  ['later', '나중에', 'Later', '以后再说'],
  ['paused', '일시정지', 'Paused', '已暂停'],
  ['resume', '계속하기', 'Resume', '继续'],
  ['skipThis', '이번 운동 건너뛰기', 'Skip this exercise', '跳过这个动作'],
  ['quitWorkout', '운동 종료', 'End workout', '结束训练'],

  ['resultTitle', '오늘 완료!', 'Done for today!', '今天完成！'],
  ['timeLabel', '운동시간', 'Time', '训练时长'],
  ['calLabel', '칼로리', 'Calories', '消耗'],
  ['againQ', '한 번 더?', 'One more?', '再来一次？'],
  ['retrySame', '방금 운동 다시', 'Repeat that workout', '重复刚才的训练'],
  ['retryNew', '새로 운동 정하기', 'Pick a new workout', '重新选择训练'],
  ['cancelBtn', '취소', 'Cancel', '取消'],
];

// ── 1. 사전에 넣는다 ────────────────────────────────────
const dictPath = path.join(ROOT, 'src/data/i18n-strings.js');
let dict = fs.readFileSync(dictPath, 'utf-8');
const q = (s) => "'" + s.replace(/'/g, "\\'") + "'";

let added = 0;
const lines = ENTRIES.filter(([k]) => !new RegExp(`^\\s*${k}:`, 'm').test(dict))
  .map(([k, ko, en, zh]) => {
    added++;
    return ` ${k}: {ko:${q(ko)}, en:${q(en)}, zh:${q(zh)}},`;
  });
if (lines.length) {
  dict = dict.replace(/\n\};\s*$/, '\n' + lines.join('\n') + '\n};\n');
  fs.writeFileSync(dictPath, dict, 'utf-8');
}
console.log(`사전에 ${added}개 추가`);

// ── 2. 마크업에 이름표를 붙인다 ──────────────────────────
const ko2key = new Map(ENTRIES.map(([k, ko]) => [ko, k]));
const file = path.join(ROOT, 'app', 'index.html');
let html = fs.readFileSync(file, 'utf-8');
let tagged = 0;
html = html.replace(
  /<([a-z][\w-]*)([^>]*)>([^<>{}]*[가-힣][^<>]*)(?=<)/g,
  (whole, tag, attrs, text) => {
    if (attrs.includes('data-i18n')) return whole;
    const key = ko2key.get(text.trim());
    if (!key) return whole;
    tagged++;
    return `<${tag}${attrs} data-i18n="${key}">${text}`;
  }
);
fs.writeFileSync(file, html, 'utf-8');
console.log(`마크업 ${tagged}곳에 이름표 부착`);
