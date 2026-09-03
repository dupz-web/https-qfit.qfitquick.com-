import { ICON } from './ui/icons.js';
import { openSheet, closeSheet } from './ui/sheet.js';
import { getSupabase, hasStoredSession, isSupabaseReady } from './cloud/supabase.js';
// Q-fit 앱 본체. legacy/index.html 의 IIFE 본문을 그대로 옮긴 것이다.
// 화면별 분리는 라우터를 다시 짜는 단계에서 이어서 한다.

import { Sound } from './audio/sound.js';
import { STATIC_UI } from './data/i18n-strings.js';
import { COACHES } from './data/coaches.js';
import { EXERCISES } from './data/exercises.js';
import { MUSCLE_GROUPS } from './data/muscle-groups.js';
import { DURATION_PRESETS } from './data/durations.js';
import { MOTIVATION_LINES } from './data/motivation.js';
import { PHOTO_SEQUENCES } from './data/photo-sequences.js';
import { ACHIEVEMENTS } from './data/achievements.js';
import { VIDEO_CLIPS } from './data/video-clips.js';
import { AI_GOAL_POOLS } from './data/ai-goals.js';
import { photoUrl, clipUrl } from './core/assets.js';

// ---------- DATA ----------
// ---------- i18n ----------
let LANG = (function(){
 try{ return localStorage.getItem('wodrush_lang_v1') || 'ko'; }catch(e){ return 'ko'; }
})();
let vibrationEnabled = (function(){
 try{ return localStorage.getItem('wodrush_vibration_v1') !== 'off'; }catch(e){ return true; }
})();
function t(obj){
 if(obj == null) return '';
 if(typeof obj === 'string') return obj;
 return obj[LANG] || obj.ko || '';
}
function setLang(lang){
 LANG = lang;
 try{ localStorage.setItem('wodrush_lang_v1', lang); }catch(e){}
 applyStaticTranslations();
 renderExGrid();
 renderGroupRow();
 if(typeof updateBestBox === 'function') updateBestBox();
 const lb = document.getElementById('lang-btn');
 if(lb) lb.textContent = LANG === 'ko' ? 'EN' : '한글';
}


function applyStaticTranslations(){
 const map = [
 ['.eyebrow', 'eyebrow'], ['.tagline', 'tagline'],
 ['#open-records-btn', 'recordsBtn'], ['#open-account-btn', 'accountBtn'],
 ['#open-routines-btn', 'routinesBtn'], ['#mode-ai-btn', 'aiModeBtn'],
 ['#save-routine-btn', 'saveRoutineBtn'],
 ['#manual-confirm-btn', 'nextBtn'], ['#manual-back-btn', 'backBtn'],
 ['#setup-back-btn', 'backBtn'], ['#play-btn', 'startWod'],
 ['#lb-back-btn', 'lbBackBtn'],
 ['#retry-btn', 'retryBtn'], ['#home-btn', 'homeBtn'], ['#share-btn', 'shareBtn'],
 ['#records-back-btn', 'lbBackBtn'],
 ['#inapp-open-btn', 'inappOpenBtn'], ['#inapp-dismiss-btn', 'inappDismiss'],
 ['#warmup-toggle-text', 'warmupToggle'], ['#warmup-title', 'warmupTitle'],
 ['#warmup-skip-btn', 'warmupSkip'],
 ];
 map.forEach(([sel, key])=>{
 if(!key) return;
 const el = document.querySelector(sel);
 if(el) el.textContent = t(STATIC_UI[key]);
 });

 updateSetNote();
 const wodLabels = document.querySelectorAll('.section-label');
 // first section-label is WOD config, second is muscle group quick-select
 if(wodLabels[0] && wodLabels[0].childNodes[0]){ wodLabels[0].childNodes[0].textContent = t(STATIC_UI.wodLabel) + ' '; }
 if(wodLabels[1]){ wodLabels[1].textContent = t(STATIC_UI.groupLabel); }
 const durationLabelEl = document.getElementById('duration-section-label');
 if(durationLabelEl) durationLabelEl.textContent = t(STATIC_UI.durationLabel);

 const modeLabelEl = document.querySelector('.mode-card-title');
 if(modeLabelEl) modeLabelEl.textContent = t(STATIC_UI.modeLabel);
 const modeMap = [
 ['#mode-random','modeRandom'], ['#mode-manual','modeManual'],
 ['#quick-beginner','modeBeginner'], ['#quick-advanced','modeAdvanced'],
 ];
 modeMap.forEach(([sel,key])=>{
 const btn = document.querySelector(sel);
 if(!btn) return;
 const icon = btn.querySelector('.mode-icon');
 btn.textContent = '';
 if(icon) btn.appendChild(icon);
 btn.appendChild(document.createTextNode(t(STATIC_UI[key])));
 });

 const durBtns = document.querySelectorAll('#duration-row .duration-btn');
 const durKeys = [['durationShort','durationShortSub'],['durationNormal','durationNormalSub'],['durationLong','durationLongSub']];
 durBtns.forEach((btn,i)=>{
 if(!durKeys[i]) return;
 const sub = btn.querySelector('.sub');
 btn.textContent = t(STATIC_UI[durKeys[i][0]]);
 const subEl = document.createElement('span');
 subEl.className = 'sub';
 subEl.textContent = t(STATIC_UI[durKeys[i][1]]);
 btn.appendChild(subEl);
 });

 const disclaimer = document.querySelector('.disclaimer');
 if(disclaimer) disclaimer.innerHTML = t(STATIC_UI.disclaimer);

 const nickInput = document.getElementById('nickname-input');
 if(nickInput) nickInput.placeholder = t(STATIC_UI.nicknamePh);
 const routineNameInput = document.getElementById('routine-name-input');
 if(routineNameInput) routineNameInput.placeholder = t(STATIC_UI.routineNamePh);
 const routinesTitleEl = document.querySelector('#routines-screen .lb-title');
 if(routinesTitleEl) routinesTitleEl.textContent = t(STATIC_UI.routinesTitle);

 const howtoTitle = document.querySelector('.howto-title');
 if(howtoTitle) howtoTitle.textContent = t(STATIC_UI.howtoTitle);
 const howtoPlatforms = document.querySelectorAll('.howto-platform');
 if(howtoPlatforms[0]) howtoPlatforms[0].textContent = t(STATIC_UI.howtoIOSTitle);
 if(howtoPlatforms[1]) howtoPlatforms[1].textContent = t(STATIC_UI.howtoAndroidTitle);
 const howtoLists = document.querySelectorAll('.howto-list');
 if(howtoLists[0]){
 const items = howtoLists[0].querySelectorAll('li');
 if(items[0]) items[0].innerHTML = t(STATIC_UI.howtoIOS1);
 if(items[1]) items[1].innerHTML = t(STATIC_UI.howtoIOS2);
 if(items[2]) items[2].innerHTML = t(STATIC_UI.howtoIOS3);
 if(items[3]) items[3].innerHTML = t(STATIC_UI.howtoIOS4);
 }
 if(howtoLists[1]){
 const items = howtoLists[1].querySelectorAll('li');
 if(items[0]) items[0].innerHTML = t(STATIC_UI.howtoAndroid1);
 if(items[1]) items[1].innerHTML = t(STATIC_UI.howtoAndroid2);
 if(items[2]) items[2].innerHTML = t(STATIC_UI.howtoAndroid3);
 }
 const howtoNote = document.querySelector('.howto-note');
 if(howtoNote) howtoNote.textContent = t(STATIC_UI.howtoNote);

 const recTitle = document.querySelector('#records-screen .lb-title');
 if(recTitle) recTitle.textContent = t(STATIC_UI.recTitle);
 // 순서가 아니라 이름으로 잇는다. 예전에는 인덱스로 넣었는데 마크업에는 라벨이
 // 여섯 개, JS 는 네 개만 알고 있어서 셋째부터 한 칸씩 밀렸다 —
 // '이번 주 횟수' 자리에 '이번 달 완주' 가 찍히고 '총 완주' 가 두 번 나왔다.
 // 숫자는 주간인데 이름은 월간이라, 틀린 값을 자신 있게 보여주는 화면이었다.
 document.querySelectorAll('.record-label[data-i18n]').forEach(el => {
 const entry = STATIC_UI[el.dataset.i18n];
 if(entry) el.textContent = t(entry);
 });
 const histLabel = document.querySelectorAll('#records-screen .section-label')[0];
 if(histLabel) histLabel.textContent = t(STATIC_UI.recHistoryLabel);

 const inappTitle = document.querySelector('.inapp-title');
 if(inappTitle) inappTitle.textContent = t(STATIC_UI.inappTitle);
 const inappText = document.querySelector('.inapp-text');
 if(inappText) inappText.innerHTML = t(STATIC_UI.inappText);
 const inappHint = document.querySelector('.inapp-hint');
 if(inappHint) inappHint.innerHTML = t(STATIC_UI.inappHint);

}




let selectedTotalSets = 8; // total sets shown to user, including boss
function regularSetCount(){ return selectedTotalSets - 1; }
function updateSetNote(){
 const setNote = document.querySelector('.set-note');
 if(!setNote) return;
 const restAt = Math.min(Math.floor(selectedTotalSets/2), selectedTotalSets-2);
 setNote.textContent = LANG==='ko'
 ? ('· 총 ' + selectedTotalSets + '세트 (' + restAt + '세트 후 휴식)')
 : ('· ' + selectedTotalSets + ' sets total (rest after ' + restAt + ')');
}

// ---------- STATE ----------
let selectedCoach = COACHES[0];
let selectedExKeys = new Set(['SQUAT','RUNINPLACE','BURPEE','JUMPSQUAT']);
let selectedDurationPreset = 'normal';
function getDurationPreset(){
 if(selectedDurationPreset === 'custom'){
 const input = document.getElementById('custom-duration-input');
 const val = Math.max(4, Math.min(30, parseInt(input && input.value, 10) || 10));
 return { base: val, range: 1 }; // range:1 → always exactly `val` seconds
 }
 return DURATION_PRESETS[selectedDurationPreset] || DURATION_PRESETS.normal;
}
let score = 0, streak = 0;
let tipTimeout = null;
let motivationTimeout = null;
let midRestIndex = 0, midRestGiven = false;
let bonusMissionIndex = -1, bonusXpEarned = 0;
let missions = [];
let missionIndex = 0;
let warmupCompletedThisSession = false;
let wodStartTimestamp = 0;
let missionActive = false;
let isPaused = false;
let missionInterval = null;

// ---------- DOM ----------
const startScreen = document.getElementById('start-screen');
const setupScreen = document.getElementById('setup-screen');
const countdownScreen = document.getElementById('countdown-screen');
const wodPreviewScreen = document.getElementById('wod-preview-screen');
const warmupScreen = document.getElementById('warmup-screen');
const warmupVideo = document.getElementById('warmup-video');
const warmupSkipBtn = document.getElementById('warmup-skip-btn');
const warmupToggle = document.getElementById('warmup-toggle');
const gameScreen = document.getElementById('game-screen');
const resultScreen = document.getElementById('result-screen');
const app = document.getElementById('app');

// ---------- SUPABASE (선택 기능 — 로그인 없이도 앱은 완전히 돈다) ----------
// 주소·키와 '언제 받을지'는 cloud/supabase.js 가 들고 있다.
let currentUserId = null;

const accountScreen = document.getElementById('account-screen');
const openAccountBtn = document.getElementById('open-account-btn');
const accountBackBtn = document.getElementById('account-back-btn');
const flashOverlay = document.getElementById('flash-overlay');

const exGrid = document.getElementById('ex-grid');
const exSearchInput = document.getElementById('ex-search-input');
if(exSearchInput){ exSearchInput.addEventListener('input', ()=> renderExGrid()); }
const groupRow = document.getElementById('group-row');
const playBtn = document.getElementById('play-btn');
const manualSelectScreen = document.getElementById('manual-select-screen');
const aiQuizScreen = document.getElementById('ai-quiz-screen');
const routinesScreen = document.getElementById('routines-screen');
const settingsScreen = document.getElementById('settings-screen');
const setupBackBtn = document.getElementById('setup-back-btn');
const countdownNum = document.getElementById('countdown-num');
const nicknameInput = document.getElementById('nickname-input');
const weightInput = document.getElementById('weight-input');
const recordsScreen = document.getElementById('records-screen');
const openRecordsBtn = document.getElementById('open-records-btn');
const langBtn = document.getElementById('lang-btn');
const recordsBackBtn = document.getElementById('records-back-btn');
const recoveryScreen = document.getElementById('recovery-screen');
const openRecoveryBtn = document.getElementById('open-recovery-btn');
const recoveryBackBtn = document.getElementById('recovery-back-btn');
const videoGalleryScreen = document.getElementById('video-gallery-screen');
const moreScreen = document.getElementById('more-screen');
const openVideoGalleryBtn = document.getElementById('open-video-gallery-btn');
const videoGalleryBackBtn = document.getElementById('video-gallery-back-btn');
const videoGalleryGrid = document.getElementById('video-gallery-grid');
const resultChallengeBtn = document.getElementById('result-challenge-btn');
const shareBtn = document.getElementById('share-btn');
const historyList = document.getElementById('history-list');

const scoreVal = document.getElementById('score-val');
const missionCountEl = document.getElementById('mission-count');
const nextPreview = document.getElementById('next-preview');
const missionTimebarFill = document.getElementById('mission-timebar-fill');
const bossBanner = document.getElementById('boss-banner');
const bonusBanner = document.getElementById('bonus-banner');
const coachEmoji = document.getElementById('coach-emoji');
const coachLine = document.getElementById('coach-line');
const figureWrap = document.getElementById('figure-wrap');
const photoDemoWrap = document.getElementById('photo-demo-wrap');
const photoDemoA = document.getElementById('photo-demo-a');
const photoDemoB = document.getElementById('photo-demo-b');
const exName = document.getElementById('ex-name');
const exTarget = document.getElementById('ex-target');
const exCue = document.getElementById('ex-cue');
const holdRing = document.getElementById('hold-ring');
const holdRingProg = document.getElementById('hold-ring-prog');
const holdNum = document.getElementById('hold-num');
const clearBanner = document.getElementById('clear-banner');

const finalSub = document.getElementById('final-sub');
const finalRank = document.getElementById('final-rank');
const resultCoachEmoji = document.getElementById('result-coach-emoji');
const resultCoachLine = document.getElementById('result-coach-line');
const retryBtn = document.getElementById('retry-btn');
const homeBtn = document.getElementById('home-btn');

const bestScoreBox = document.getElementById('best-score-box');
const bestScoreVal = document.getElementById('best-score-val');

function showScreen(el){
 [startScreen,accountScreen,manualSelectScreen,aiQuizScreen,routinesScreen,settingsScreen,setupScreen,wodPreviewScreen,warmupScreen,countdownScreen,gameScreen,resultScreen,recordsScreen,recoveryScreen,videoGalleryScreen,moreScreen].forEach(s=>s.classList.remove('active'));
 el.classList.add('active');
 // safety net: a leftover shake() animation frame can occasionally get
 // orphaned (e.g. tab backgrounded mid-shake) and leave the whole #app
 // permanently offset sideways — force it back to 0 on every screen
 // change so this can never persist across a navigation.
 if(app) app.style.setProperty('--shake', '0px');
 if(el === moreScreen){
 try{
 const savedPrefs = loadSetupPrefs();
 const show = !!(savedPrefs && Array.isArray(savedPrefs.exKeys) && savedPrefs.exKeys.length);
 const moreBtn = document.getElementById('repeat-trigger-more');
 if(moreBtn) moreBtn.style.display = show ? '' : 'none';
 }catch(e){ console.error('repeat button refresh failed:', e); }
 }
 if(el === startScreen){
 try{
 const savedPrefs = loadSetupPrefs();
 const show = !!(savedPrefs && Array.isArray(savedPrefs.exKeys) && savedPrefs.exKeys.length);
 const startBtn = document.getElementById('repeat-trigger-start');
 if(startBtn) startBtn.style.display = show ? '' : 'none';
 }catch(e){ console.error('repeat button refresh failed:', e); }
 try{ renderWeekStrip(); }catch(e){ console.error('week strip render failed:', e); }
 }
 // 화면이 바뀌었다고 알린다. 탭바와 뒤로가기가 이 신호를 듣는다 —
 // 그쪽에서 showScreen 을 직접 부르게 하면 위에 붙은 훅들을 건너뛰게 된다.
 document.dispatchEvent(new CustomEvent('screenchange', { detail: { id: el.id } }));
}

// 밖에서 화면을 부를 수 있는 유일한 문. 다만 여는 버튼이 따로 있는 화면은
// 그 버튼을 누르는 편이 낫다 — 버튼이 화면을 채우는 렌더까지 들고 있다.
export function showScreenById(id){
 const el = document.getElementById(id);
 if(el) showScreen(el);
}
export function isWorkoutRunning(){ return missionActive; }

// ---------- AUDIO (synthesized, no files) ----------

// ---------- VOICE ANNOUNCE (speak exercise name aloud) ----------
let cachedKoVoices = [];
let cachedEnVoices = [];
function refreshVoices(){
 if(!window.speechSynthesis) return;
 const all = window.speechSynthesis.getVoices();
 cachedKoVoices = all.filter(v => v.lang && v.lang.toLowerCase().startsWith('ko'));
 cachedEnVoices = all.filter(v => v.lang && v.lang.toLowerCase().startsWith('en'));
}
if(window.speechSynthesis){
 refreshVoices();
 window.speechSynthesis.onvoiceschanged = refreshVoices;
}
function pickEnergeticVoice(){
 const pool = LANG === 'en' ? cachedEnVoices : cachedKoVoices;
 if(!pool.length) return null;
 // score each voice — prefer higher-quality engines, and a bright/young
 // female-leaning voice for a cuter, more playful workout-coach feel
 const scoreOf = (v) => {
 const n = v.name.toLowerCase();
 let s = 0;
 if(/neural|natural|wavenet|online|google/.test(n)) s += 2;
 if(/female|woman|yuna|arin|jimin|siri/.test(n)) s += 3;
 if(/male|man|minsu|minho|철수|민수/.test(n)) s -= 3;
 if(/compact/.test(n)) s -= 1;
 return s;
 };
 const sorted = pool.slice().sort((a,b)=> scoreOf(b) - scoreOf(a));
 return sorted[0];
}
function speakExercise(label, cue){
 if(Sound.isMuted()) return;
 if(!window.speechSynthesis) return;
 try{
 window.speechSynthesis.cancel();
 const text = cue ? (label + '! ' + cue) : (label + '!');
 const doSpeak = () => {
 try{
 const u = new SpeechSynthesisUtterance(text);
 u.lang = LANG === 'en' ? 'en-US' : 'ko-KR';
 u.rate = 1.15;
 u.pitch = 1.5;
 u.volume = 1;
 const voice = pickEnergeticVoice();
 if(voice) u.voice = voice;
 // iOS in particular can suspend the Web Audio session while/after
 // speech plays — try to wake it back up once speech finishes.
 u.onend = () => Sound.unlock();
 u.onerror = () => Sound.unlock();
 window.speechSynthesis.speak(u);
 }catch(e){}
 };
 // Some mobile browsers (Chrome/Android especially) silently drop a
 // speak() call issued in the same tick right after cancel() — a
 // short delay makes the announcement reliably audible on phones.
 setTimeout(doSpeak, 60);
 }catch(e){}
}

function speakTip(tipText){
 if(Sound.isMuted() || !tipText) return;
 if(!window.speechSynthesis) return;
 try{
 const u = new SpeechSynthesisUtterance(tipText);
 u.lang = LANG === 'en' ? 'en-US' : 'ko-KR';
 u.rate = 1.1;
 u.pitch = 1.4;
 u.volume = 0.9;
 const voice = pickEnergeticVoice();
 if(voice) u.voice = voice;
 u.onend = () => Sound.unlock();
 u.onerror = () => Sound.unlock();
 window.speechSynthesis.speak(u);
 }catch(e){}
}
function speakMotivation(){
 if(Sound.isMuted()) return;
 if(!window.speechSynthesis) return;
 try{
 const lines = MOTIVATION_LINES[LANG] || MOTIVATION_LINES.ko;
 const line = lines[Math.floor(Math.random() * lines.length)];
 const u = new SpeechSynthesisUtterance(line);
 u.lang = LANG === 'en' ? 'en-US' : 'ko-KR';
 u.rate = 1.15;
 u.pitch = 1.55;
 u.volume = 0.9;
 const voice = pickEnergeticVoice();
 if(voice) u.voice = voice;
 u.onend = () => Sound.unlock();
 u.onerror = () => Sound.unlock();
 window.speechSynthesis.speak(u);
 }catch(e){}
}

function updateMuteIcon(){
 const icon = Sound.isMuted() ? ICON.soundOff : ICON.soundOn;
 const a = document.getElementById('mute-btn-start');
 const b = document.getElementById('mute-btn-game');
 // 둘 다 innerHTML 이어야 한다. 한쪽만 고쳤더니 운동 화면의 음소거 버튼이
 // SVG 소스를 글자로 찍어서, 화면 왼쪽에 태그가 그대로 흘러나왔다.
 if(a) a.innerHTML = icon;
 if(b) b.innerHTML = icon;
}
try{
 const muteStartBtn = document.getElementById('mute-btn-start');
 const muteGameBtn = document.getElementById('mute-btn-game');
 if(muteStartBtn) muteStartBtn.addEventListener('click', ()=>{ Sound.toggleMute(); updateMuteIcon(); });
 if(muteGameBtn) muteGameBtn.addEventListener('click', ()=>{ Sound.toggleMute(); updateMuteIcon(); });
 updateMuteIcon();
}catch(e){ console.error('mute button setup failed:', e); }

try{
 const pauseBtn = document.getElementById('pause-btn');
 const pauseOverlay = document.getElementById('pause-overlay');
 const resumeBtn = document.getElementById('resume-btn');
 const quitBtn = document.getElementById('quit-btn');
 const skipBtn = document.getElementById('skip-btn');
 if(skipBtn && pauseOverlay){
 skipBtn.addEventListener('click', ()=>{
 isPaused = false;
 pauseOverlay.classList.remove('on');
 Sound.startBGM();
 skipMission();
 });
 }
 if(pauseBtn && pauseOverlay){
 pauseBtn.addEventListener('click', ()=>{
 isPaused = true;
 pauseOverlay.classList.add('on');
 Sound.stopBGM();
 });
 }
 if(resumeBtn && pauseOverlay){
 resumeBtn.addEventListener('click', ()=>{
 isPaused = false;
 pauseOverlay.classList.remove('on');
 Sound.startBGM();
 });
 }
 if(quitBtn && pauseOverlay){
 quitBtn.addEventListener('click', ()=>{
 const msg = LANG==='ko' ? '정말 운동을 종료할까요? 지금까지 기록은 저장되지 않아요.' : "Quit this workout? Today's progress won't be saved.";
 if(confirm(msg)){
 isPaused = false;
 pauseOverlay.classList.remove('on');
 missionActive = false;
 clearInterval(missionInterval);
 Sound.stopBGM();
 stopLegSync();
 stopPhotoDemo();
 if(app) app.classList.remove('workout-mode');
 showScreen(startScreen);
 }
 });
 }
}catch(e){ console.error('pause/quit setup failed:', e); }

try{
 const loginPromptOverlay = document.getElementById('login-prompt-overlay');
 const loginPromptYesBtn = document.getElementById('login-prompt-yes-btn');
 const loginPromptLaterBtn = document.getElementById('login-prompt-later-btn');
 if(loginPromptYesBtn) loginPromptYesBtn.addEventListener('click', ()=>{
 if(loginPromptOverlay) loginPromptOverlay.classList.remove('on');
 try{ localStorage.setItem('wodrush_login_prompt_dismissed', 'true'); }catch(e){}
 updateAccountUI();
 showScreen(accountScreen);
 });
 if(loginPromptLaterBtn) loginPromptLaterBtn.addEventListener('click', ()=>{
 if(loginPromptOverlay) loginPromptOverlay.classList.remove('on');
 try{ localStorage.setItem('wodrush_login_prompt_dismissed', 'true'); }catch(e){}
 });
}catch(e){ console.error('login prompt setup failed:', e); }

try{
 const openSettingsBtn = document.getElementById('open-settings-btn');
 const settingsBackBtn = document.getElementById('settings-back-btn');
 const bgmToggle = document.getElementById('settings-bgm-toggle');
 const sfxToggle = document.getElementById('settings-sfx-toggle');
 const vibrationToggle = document.getElementById('settings-vibration-toggle');

 // apply persisted settings on load
 let bgmOn = true, sfxOn = true;
 try{ bgmOn = localStorage.getItem('wodrush_bgm_v1') !== 'off'; }catch(e){}
 try{ sfxOn = localStorage.getItem('wodrush_sfx_v1') !== 'off'; }catch(e){}
 Sound.setBgmMuted(!bgmOn);
 Sound.setSfxMuted(!sfxOn);
 if(bgmToggle) bgmToggle.checked = bgmOn;
 if(sfxToggle) sfxToggle.checked = sfxOn;
 if(vibrationToggle) vibrationToggle.checked = vibrationEnabled;

 if(openSettingsBtn) openSettingsBtn.addEventListener('click', ()=> showScreen(settingsScreen));
 if(settingsBackBtn) settingsBackBtn.addEventListener('click', ()=> showScreen(startScreen));
 if(bgmToggle) bgmToggle.addEventListener('change', ()=>{
 Sound.setBgmMuted(!bgmToggle.checked);
 try{ localStorage.setItem('wodrush_bgm_v1', bgmToggle.checked ? 'on' : 'off'); }catch(e){}
 });
 if(sfxToggle) sfxToggle.addEventListener('change', ()=>{
 Sound.setSfxMuted(!sfxToggle.checked);
 try{ localStorage.setItem('wodrush_sfx_v1', sfxToggle.checked ? 'on' : 'off'); }catch(e){}
 });
 if(vibrationToggle) vibrationToggle.addEventListener('change', ()=>{
 vibrationEnabled = vibrationToggle.checked;
 try{ localStorage.setItem('wodrush_vibration_v1', vibrationToggle.checked ? 'on' : 'off'); }catch(e){}
 });
}catch(e){ console.error('settings screen setup failed:', e); }

// ---------- SCREEN SHAKE / FLASH ----------
let shakeResetTimer = null;
function shake(){
 let n = 0;
 const kick = ()=>{
 n++;
 const amt = (n % 2 === 0) ? 6 : -6;
 app.style.setProperty('--shake', amt * (1 - n/6) + 'px');
 if(n < 6) requestAnimationFrame(()=>setTimeout(kick, 16));
 else app.style.setProperty('--shake','0px');
 };
 kick();
 // Guaranteed reset independent of the animation chain above — if the
 // tab gets backgrounded mid-shake (common on mobile), the rAF/setTimeout
 // chain can stall partway through and never reach the reset branch,
 // leaving the whole screen permanently offset sideways. This timer
 // always fires and snaps it back, no matter what happened above.
 clearTimeout(shakeResetTimer);
 shakeResetTimer = setTimeout(()=>{ app.style.setProperty('--shake','0px'); }, 250);
}
function flash(color){
 flashOverlay.style.background = color || '#fff';
 flashOverlay.style.opacity = '0.35';
 flashOverlay.style.transition = 'none';
 requestAnimationFrame(()=>{
 flashOverlay.style.transition = 'opacity 0.3s ease';
 flashOverlay.style.opacity = '0';
 });
}

// ---------- confetti burst (운동 직후 폭죽 연출) ----------
function fireConfetti(){
 const layer = document.getElementById('confetti-layer');
 if(!layer) return;
 const colors = ['--accent', '--hot', '--cool', '--text'];
 const count = 22;
 for(let i=0;i<count;i++){
 const piece = document.createElement('span');
 piece.className = 'confetti-piece';
 piece.style.background = `var(${colors[Math.floor(Math.random()*colors.length)]})`;
 piece.style.left = (Math.random()*100) + 'vw';
 piece.style.animationDelay = (Math.random()*0.4) + 's';
 piece.style.animationDuration = (1.3 + Math.random()*0.8) + 's';
 layer.appendChild(piece);
 setTimeout(()=>{ piece.remove(); }, 2400);
 }
}

// ---------- SYNCED LEGS (JS-driven, guarantees both legs move as one unit) ----------
let legSyncRAF = null;
function startLegSync(periodMs){
 stopLegSync();
 const legL = figureWrap.querySelector('.legL');
 const legR = figureWrap.querySelector('.legR');
 if(!legL || !legR) return;
 // draw both legs from the SAME hip point to the SAME moving foot point —
 // they are geometrically identical at every instant, so there is only
 // ever one visible leg-shape. Cannot read as "one leg at a time" because
 // there is structurally only one line being drawn (twice, on top of itself).
 const restX = 50, restY = 118;
 const upX = 50, upY = 42;
 const t0 = performance.now();
 function tick(now){
 const t = ((now - t0) % periodMs) / periodMs;
 let phase;
 if(t < 0.3) phase = t / 0.3;
 else if(t < 0.7) phase = 1;
 else phase = Math.max(0, (1 - t) / 0.3);
 const x = restX + (upX - restX) * phase;
 const y = restY + (upY - restY) * phase;
 [legL, legR].forEach(el=>{
 el.setAttribute('x1', '50');
 el.setAttribute('y1', '82');
 el.setAttribute('x2', x);
 el.setAttribute('y2', y);
 });
 legSyncRAF = requestAnimationFrame(tick);
 }
 legSyncRAF = requestAnimationFrame(tick);
}
function stopLegSync(){
 if(legSyncRAF){ cancelAnimationFrame(legSyncRAF); legSyncRAF = null; }
 const legL = figureWrap.querySelector('.legL');
 const legR = figureWrap.querySelector('.legR');
 if(legL){ legL.style.transform = ''; legL.setAttribute('x2','35'); legL.setAttribute('y2','118'); }
 if(legR){ legR.style.transform = ''; legR.setAttribute('x2','65'); legR.setAttribute('y2','118'); }
}

// ---------- REAL PHOTO DEMO (used for exercises with an actual photo sequence) ----------
let photoDemoInterval = null;
let photoDemoTop = 'a'; // which layer is currently the visible/top one
function stopPhotoDemo(){
 if(photoDemoInterval){ clearInterval(photoDemoInterval); photoDemoInterval = null; }
 if(photoDemoWrap) photoDemoWrap.style.display = 'none';
 if(figureWrap) figureWrap.style.display = '';
}
function startPhotoDemo(key){
 const seq = PHOTO_SEQUENCES[key];
 if(!seq || !photoDemoWrap || !photoDemoA || !photoDemoB){ stopPhotoDemo(); return; }
 if(figureWrap) figureWrap.style.display = 'none';
 photoDemoWrap.style.display = 'block';
 // reset both layers, show the first frame on layer A
 photoDemoA.src = photoUrl(seq[0]);
 photoDemoA.classList.add('active');
 photoDemoB.classList.remove('active');
 photoDemoTop = 'a';
 if(photoDemoInterval){ clearInterval(photoDemoInterval); photoDemoInterval = null; }
 if(seq.length > 1){
 let i = 0;
 // Slower pace + a true dissolve (both layers cross-fade at once, no
 // blank/blink moment) reads as a calm demonstration instead of a
 // flicker — and it stays big enough to read from a few steps away.
 photoDemoInterval = setInterval(()=>{
 i = (i + 1) % seq.length;
 const showing = photoDemoTop === 'a' ? photoDemoA : photoDemoB;
 const hidden = photoDemoTop === 'a' ? photoDemoB : photoDemoA;
 hidden.src = photoUrl(seq[i]);
 hidden.classList.add('active');
 showing.classList.remove('active');
 photoDemoTop = photoDemoTop === 'a' ? 'b' : 'a';
 }, 1400);
 }
}

// ---------- LOCAL PROFILE (per-device, like Geometry Dash / Magic Tiles —
// no login, your records just keep building up on whatever device you play on) ----------
const NICK_KEY = 'wodrush_nickname_v1';
const WEIGHT_KEY = 'wodrush_weight_kg_v1';
function loadWeightKg(){
 try{
 const val = parseFloat(localStorage.getItem(WEIGHT_KEY));
 if(val && val > 0){ if(weightInput) weightInput.value = val; return val; }
 }catch(e){}
 return 65; // average adult fallback used when no weight is entered
}
function saveWeightKg(kg){
 try{ if(kg && kg > 0) localStorage.setItem(WEIGHT_KEY, String(kg)); }catch(e){}
}
function currentWeightKg(){
 const v = weightInput ? parseFloat(weightInput.value) : NaN;
 return (v && v > 0) ? v : loadWeightKg();
}

// ---------- LAST-USED SETUP (압도적 편리함: 매번 처음부터 다시 고르지 않도록) ----------
const SETUP_PREFS_KEY = 'wodrush_last_setup_v1';
function saveSetupPrefs(){
 try{
 const durationToggle = document.getElementById('custom-duration-toggle');
 const durationInput = document.getElementById('custom-duration-input');
 const setToggle = document.getElementById('custom-setcount-toggle');
 const setInput = document.getElementById('custom-setcount-input');
 const prefs = {
 exKeys: Array.from(selectedExKeys),
 durationPreset: selectedDurationPreset,
 customDurationOn: !!(durationToggle && durationToggle.checked),
 customDurationVal: durationInput ? durationInput.value : null,
 totalSets: selectedTotalSets,
 customSetOn: !!(setToggle && setToggle.checked),
 customSetVal: setInput ? setInput.value : null,
 warmupOn: !!(warmupToggle && warmupToggle.checked),
 };
 localStorage.setItem(SETUP_PREFS_KEY, JSON.stringify(prefs));
 }catch(e){ console.error('saveSetupPrefs failed:', e); }
}
function loadSetupPrefs(){
 try{
 const raw = localStorage.getItem(SETUP_PREFS_KEY);
 if(!raw) return null;
 return JSON.parse(raw);
 }catch(e){ return null; }
}
// Apply saved prefs to both the JS state AND the on-screen controls, so the
// setup screen visually reflects what you picked last time instead of
// silently resetting to the defaults every single visit.
function revealDurationCard(){
 const card = document.getElementById('duration-card');
 const hint = document.getElementById('duration-hint');
 if(card && card.style.display === 'none'){ card.style.display = ''; }
 if(hint) hint.style.display = 'none';
}
function applySetupPrefs(prefs){
 if(!prefs) return;
 try{
 if(Array.isArray(prefs.exKeys) && prefs.exKeys.length){
 selectedExKeys = new Set(prefs.exKeys);
 renderExGrid();
 renderGroupRow();
 }
 if(prefs.durationPreset){
 selectedDurationPreset = prefs.durationPreset;
 document.querySelectorAll('#duration-row .duration-btn').forEach(b=>{
 b.classList.toggle('active', b.dataset.preset === prefs.durationPreset);
 });
 const durationToggle = document.getElementById('custom-duration-toggle');
 const durationInput = document.getElementById('custom-duration-input');
 if(durationToggle){ durationToggle.checked = !!prefs.customDurationOn; }
 if(durationInput){
 if(prefs.customDurationVal) durationInput.value = prefs.customDurationVal;
 durationInput.style.display = prefs.customDurationOn ? '' : 'none';
 }
 if(prefs.customDurationOn){
 document.querySelectorAll('#duration-row .duration-btn').forEach(b=> b.classList.remove('active'));
 }
 }
 if(prefs.totalSets){
 selectedTotalSets = prefs.totalSets;
 document.querySelectorAll('#setcount-row .duration-btn').forEach(b=>{
 b.classList.toggle('active', parseInt(b.dataset.count,10) === prefs.totalSets);
 });
 const setToggle = document.getElementById('custom-setcount-toggle');
 const setInput = document.getElementById('custom-setcount-input');
 if(setToggle){ setToggle.checked = !!prefs.customSetOn; }
 if(setInput){
 if(prefs.customSetVal) setInput.value = prefs.customSetVal;
 setInput.style.display = prefs.customSetOn ? '' : 'none';
 }
 if(prefs.customSetOn){
 document.querySelectorAll('#setcount-row .duration-btn').forEach(b=> b.classList.remove('active'));
 }
 revealDurationCard();
 }
 if(warmupToggle) warmupToggle.checked = !!prefs.warmupOn;
 updateSetNote();
 }catch(e){ console.error('applySetupPrefs failed:', e); }
}
const PROFILE_KEY = 'wodrush_profile_v1';
let myNickname = '';
let myProfile = { totalCompletions:0, currentStreak:0, bestStreakEver:0, lastPlayDate:null, monthlyCounts:{}, history:[], totalWorkoutSeconds:0, xp:0, totalCalories:0, achievements:[], comebackCount:0, dailyChallengesCompleted:0, dailyChallengeDate:null, challengesAccepted:0 };

function levelFor(total){
 if(total >= 100) return { label:'Gold', icon:'', next:null };
 if(total >= 50) return { label:'Silver', icon:'', next:100 };
 if(total >= 30) return { label:'Bronze', icon:'', next:50 };
 return { label:null, icon:'', next:30 };
}
function monthKeyStr(){ return todayStr().slice(0,7); }

// ---------- XP / Level ----------
function xpLevel(xp){ return Math.floor((xp || 0) / 100) + 1; }
function xpIntoLevel(xp){ return (xp || 0) % 100; }

// ---------- Achievements ----------
function checkAchievements(){
 myProfile.achievements = myProfile.achievements || [];
 let newlyUnlocked = [];
 ACHIEVEMENTS.forEach(a=>{
 if(!myProfile.achievements.includes(a.id) && a.check(myProfile)){
 myProfile.achievements.push(a.id);
 newlyUnlocked.push(a);
 }
 });
 return newlyUnlocked;
}

// ---------- COMEBACK BONUS (재접속 유도) ----------
function checkComeback(){
 try{
 if(!myProfile.lastPlayDate || (myProfile.totalCompletions||0) < 1) return;
 const last = new Date(myProfile.lastPlayDate + 'T00:00:00');
 const today = new Date(todayStr() + 'T00:00:00');
 const gapDays = Math.round((today - last) / 86400000);
 if(gapDays < 2) return; // 어제까지 했으면 컴백 아님
 const shownKey = 'wodrush_comeback_shown_' + todayStr();
 if(localStorage.getItem(shownKey)) return;
 localStorage.setItem(shownKey, '1');
 myProfile.xp = (myProfile.xp||0) + 15;
 myProfile.comebackCount = (myProfile.comebackCount||0) + 1;
 checkAchievements();
 saveProfile();
 const banner = document.getElementById('comeback-banner');
 if(banner){
 banner.style.display = 'block';
 banner.innerHTML = LANG==='ko'
 ? ('' + gapDays + '일 만에 복귀! <b>+15 XP</b> 보너스 지급. 오늘은 가볍게 몸부터 풀어봅니다.')
 : ('Welcome back after ' + gapDays + ' days! <b>+15 XP</b> bonus added. Ease back in today.');
 }
 }catch(e){ console.error('checkComeback failed:', e); }
}

// ---------- DAILY CHALLENGE (매일 바뀌는 챌린지 · 재접속/성취감) ----------
function dailyChallengeExercise(){
 const start = new Date(new Date().getFullYear(), 0, 0);
 const dayOfYear = Math.floor((new Date() - start) / 86400000);
 return EXERCISES[dayOfYear % EXERCISES.length];
}
function isDailyChallengeDoneToday(){
 return myProfile.dailyChallengeDate === todayStr();
}
function renderDailyChallengeCard(){
 try{
 const ex = dailyChallengeExercise();
 const card = document.getElementById('daily-challenge-card');
 const iconEl = document.getElementById('dc-icon');
 const titleEl = document.getElementById('dc-title');
 const subEl = document.getElementById('dc-sub');
 if(!card || !titleEl || !subEl) return;
 const done = isDailyChallengeDoneToday();
 card.classList.toggle('done', done);
 titleEl.textContent = LANG==='ko' ? '오늘의 챌린지' : "Today's Challenge";
 subEl.textContent = done
 ? (LANG==='ko' ? '완료! 내일 또 도전해봅니다' : 'Done! Come back tomorrow')
 : (LANG==='ko' ? (t(ex.label) + ' 포함해서 완주하면 +30 XP') : ('Include ' + t(ex.label) + ' for +30 XP'));
 }catch(e){ console.error('renderDailyChallengeCard failed:', e); }
}

function loadNickname(){
 try{
 const val = localStorage.getItem(NICK_KEY);
 if(val){ myNickname = val; if(nicknameInput) nicknameInput.value = myNickname; }
 }catch(e){}
}
function saveNickname(name){
 try{ localStorage.setItem(NICK_KEY, name); }catch(e){}
}
function loadProfile(){
 try{
 const val = localStorage.getItem(PROFILE_KEY);
 if(val){
 const p = JSON.parse(val);
 myProfile = Object.assign({ totalCompletions:0, currentStreak:0, bestStreakEver:0, lastPlayDate:null, monthlyCounts:{}, history:[], totalWorkoutSeconds:0, xp:0, totalCalories:0, achievements:[], comebackCount:0, dailyChallengesCompleted:0, dailyChallengeDate:null, challengesAccepted:0 }, p);
 }
 }catch(e){}
 updateBestBox();
}
function saveProfile(){
 try{ localStorage.setItem(PROFILE_KEY, JSON.stringify(myProfile)); }catch(e){}
 syncProfileToCloud();
}

async function syncProfileToCloud(){
 if(!currentUserId) return;
 const sb = await getSupabase();
 if(!sb) return;
 try{
 await sb.from('profiles').upsert({
 id: currentUserId,
 nickname: myNickname || '익명',
 total_completions: myProfile.totalCompletions || 0,
 current_streak: myProfile.currentStreak || 0,
 best_streak_ever: myProfile.bestStreakEver || 0,
 last_play_date: myProfile.lastPlayDate,
 monthly_counts: myProfile.monthlyCounts || {},
 history: myProfile.history || [],
 updated_at: new Date().toISOString(),
 });
 }catch(e){ console.error('cloud sync failed:', e); }
}

async function fetchProfileFromCloud(){
 if(!currentUserId) return null;
 const sb = await getSupabase();
 if(!sb) return null;
 try{
 const { data, error } = await sb.from('profiles').select('*').eq('id', currentUserId).maybeSingle();
 if(error) throw error;
 return data;
 }catch(e){ console.error('cloud fetch failed:', e); return null; }
}

function applyCloudProfile(row){
 if(!row) return;
 myNickname = row.nickname || myNickname || '익명';
 myProfile = {
 totalCompletions: row.total_completions || 0,
 currentStreak: row.current_streak || 0,
 bestStreakEver: row.best_streak_ever || 0,
 lastPlayDate: row.last_play_date || null,
 monthlyCounts: row.monthly_counts || {},
 history: row.history || [],
 };
 saveNickname(myNickname);
 try{ localStorage.setItem(PROFILE_KEY, JSON.stringify(myProfile)); }catch(e){}
 updateBestBox();
}

function updateAccountUI(){
 const loginForm = document.getElementById('account-login-form');
 const signupForm = document.getElementById('account-signup-form');
 const tabs = document.querySelector('.auth-tabs');
 const backBtn = document.getElementById('account-back-btn');
 if(!loginForm) return;
 if(currentUserId){
 loginForm.style.display = 'none';
 signupForm.style.display = 'none';
 if(tabs) tabs.style.display = 'none';
 if(backBtn){
 backBtn.textContent = '로그아웃';
 backBtn.onclick = async ()=>{
 try{ if(isSupabaseReady()){ const sb = await getSupabase(); await sb.auth.signOut(); } }catch(e){}
 currentUserId = null;
 updateAccountUI();
 showScreen(startScreen);
 };
 }
 const eyebrow = document.querySelector('#account-screen .eyebrow');
 if(eyebrow) eyebrow.textContent = '계정 연동됨';
 } else {
 loginForm.style.display = 'flex';
 if(tabs){
 tabs.style.display = 'flex';
 const activeTab = tabs.querySelector('.auth-tab.active');
 signupForm.style.display = (activeTab && activeTab.dataset.tab === 'signup') ? 'flex' : 'none';
 loginForm.style.display = (activeTab && activeTab.dataset.tab === 'signup') ? 'none' : 'flex';
 }
 if(backBtn){
 backBtn.textContent = '계정 없이 계속하기';
 backBtn.onclick = ()=> showScreen(startScreen);
 }
 const eyebrow = document.querySelector('#account-screen .eyebrow');
 if(eyebrow) eyebrow.textContent = '계정 연동';
 }
}

async function checkSupabaseSession(){
 // 로그인한 적이 없으면 SDK 를 받지도 않는다. 로그인은 선택 기능이라
 // 안 쓰는 사람에게 120KB 를 받게 할 이유가 없다.
 if(!hasStoredSession()) return;
 const sb = await getSupabase();
 if(!sb) return;
 try{
 const { data } = await sb.auth.getSession();
 if(data && data.session && data.session.user){
 currentUserId = data.session.user.id;
 const row = await fetchProfileFromCloud();
 if(row) applyCloudProfile(row);
 else await syncProfileToCloud(); // first login on this device — push local data up
 updateAccountUI();
 updateBestBox();
 }
 }catch(e){ console.error('session check failed:', e); }
}

function updateBestBox(){
 const labelEl = document.getElementById('best-score-label');
 if(labelEl) labelEl.textContent = LANG==='ko' ? '내 기록' : 'My Stats';
 if(myProfile.totalCompletions > 0){
 bestScoreBox.style.display = 'block';
 const lvl = levelFor(myProfile.totalCompletions);
 bestScoreVal.textContent = (lvl.icon ? lvl.icon + ' ' : '') +
 (LANG==='ko'
 ? (myProfile.currentStreak + '일 연속 · 총 ' + myProfile.totalCompletions + '회')
 : (myProfile.currentStreak + '-day streak · ' + myProfile.totalCompletions + ' total'));
 }
}

function todayStr(){
 return new Date().toISOString().slice(0,10);
}
function todayCompletionCount(){
 const today = todayStr();
 return (myProfile.history || []).filter(ts => new Date(ts).toISOString().slice(0,10) === today).length;
}
function isYesterday(dateStr){
 const d = new Date(dateStr + 'T00:00:00');
 d.setDate(d.getDate()+1);
 return d.toISOString().slice(0,10) === todayStr();
}

function escapeHtml(str){
 return String(str).replace(/[&<>"']/g, c=> ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function renderHistoryList(){
 const hist = (myProfile.history || []);
 if(!hist.length){
 historyList.innerHTML = '<div class="lb-empty">' + (LANG==='ko' ? '아직 완주 기록이 없습니다.' : 'No sessions completed yet.') + '</div>';
 return;
 }
 historyList.innerHTML = hist.map(ts=>{
 const d = new Date(ts);
 const dateStr = LANG==='ko' ? ((d.getMonth()+1)+'월 '+d.getDate()+'일') : (d.toLocaleString('en-US',{month:'short'}) + ' ' + d.getDate());
 const timeStr = String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');
 return '<div class="lb-row"><div class="lb-name">'+dateStr+'</div><div class="lb-stats">'+timeStr+'</div></div>';
 }).join('');
}

// ---------- MY RECORDS UI ----------
function weeklyCompletionCount(){
 const now = Date.now();
 const weekMs = 7 * 24 * 60 * 60 * 1000;
 return (myProfile.history || []).filter(ts => now - ts <= weekMs).length;
}

function renderWeekStrip(){
 const strip = document.getElementById('week-strip');
 if(!strip) return;
 strip.innerHTML = '';
 // rolling 7 days ending today — count how many times per day, not just
 // done/not-done, so the color can reflect how many rounds that day
 const countByDate = {};
 (myProfile.history || []).forEach(ts=>{
 const d = new Date(ts);
 const key = d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate();
 countByDate[key] = (countByDate[key] || 0) + 1;
 });
 // 1회=빨강 2회=주황 3회=노랑 4회=초록 5회=파랑 6회=남색 7회=보라 8회+=무지개
 const RAINBOW = ['#ff3b3b','#ff8a00','#ffd60a','#3ec96a','#3ea0ff','#3a4bdb','#9a3fe0'];
 const dowLabels = LANG==='ko' ? ['일','월','화','수','목','금','토'] : ['S','M','T','W','T','F','S'];
 const today = new Date();
 for(let i=6; i>=0; i--){
 const d = new Date(today);
 d.setDate(today.getDate() - i);
 const key = d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate();
 const isToday = i === 0;
 const count = countByDate[key] || 0;
 const cell = document.createElement('div');
 cell.className = 'week-day' + (isToday ? ' today' : '') + (count > 0 ? ' done' : '');
 const dot = document.createElement('span');
 dot.className = 'wd-dot';
 if(count >= 8){
 dot.style.background = 'conic-gradient(' + RAINBOW.concat(RAINBOW[0]).join(',') + ')';
 dot.textContent = '✓';
 } else if(count > 0){
 dot.style.background = RAINBOW[count - 1];
 dot.textContent = '✓';
 } else {
 dot.textContent = d.getDate();
 }
 cell.innerHTML = '<span class="wd-label">' + dowLabels[d.getDay()] + '</span>';
 cell.appendChild(dot);
 strip.appendChild(cell);
 }
}

function renderCalendar(){
 const grid = document.getElementById('calendar-grid');
 if(!grid) return;
 grid.innerHTML = '';
 const now = new Date();
 const year = now.getFullYear(), month = now.getMonth();
 const firstDow = new Date(year, month, 1).getDay(); // 0=Sun
 const daysInMonth = new Date(year, month + 1, 0).getDate();
 const todayDate = now.getDate();
 // which day-numbers this month have at least one completion
 const doneDays = new Set();
 (myProfile.history || []).forEach(ts=>{
 const d = new Date(ts);
 if(d.getFullYear() === year && d.getMonth() === month) doneDays.add(d.getDate());
 });
 const dowLabels = LANG==='ko' ? ['일','월','화','수','목','금','토'] : ['S','M','T','W','T','F','S'];
 dowLabels.forEach(l=>{
 const el = document.createElement('div');
 el.className = 'cal-dow';
 el.textContent = l;
 grid.appendChild(el);
 });
 for(let i=0;i<firstDow;i++){
 const el = document.createElement('div');
 el.className = 'cal-day empty';
 grid.appendChild(el);
 }
 for(let day=1; day<=daysInMonth; day++){
 const el = document.createElement('div');
 el.className = 'cal-day' + (doneDays.has(day) ? ' done' : '') + (day === todayDate ? ' today' : '');
 el.textContent = String(day);
 grid.appendChild(el);
 }
}

function renderRecordsScreen(){
 renderCalendar();
 document.getElementById('rec-best-streak').textContent = (myProfile.bestStreakEver || 0) + (LANG==='ko'?'일':'d');
 // 큰 숫자 자리에 부연을 넣으면 44px 로 '0일(오늘 0회)' 가 되어 두 줄로 넘친다.
  // 숫자는 숫자대로 두고 부연만 작게 떼어 붙인다.
  document.getElementById('rec-current-streak').innerHTML =
    (myProfile.currentStreak || 0) + (LANG==='ko' ? '일' : 'd') +
    '<span class="val-sub">' +
    (LANG==='ko' ? ('오늘 ' + todayCompletionCount() + '회') : (todayCompletionCount() + ' today')) +
    '</span>';
 document.getElementById('rec-week').textContent = weeklyCompletionCount() + (LANG==='ko'?'회':'');
 document.getElementById('rec-month').textContent = (myProfile.monthlyCounts[monthKeyStr()] || 0) + (LANG==='ko'?'회':'');
 document.getElementById('rec-total').textContent = (myProfile.totalCompletions || 0) + (LANG==='ko'?'회':'');
 const totalMin = Math.round((myProfile.totalWorkoutSeconds || 0) / 60);
 document.getElementById('rec-total-time').textContent = totalMin >= 60
 ? (Math.floor(totalMin/60) + (LANG==='ko'?'시간 ':'h ') + (totalMin%60) + (LANG==='ko'?'분':'m'))
 : (totalMin + (LANG==='ko'?'분':'m'));

 const total = myProfile.totalCompletions || 0;
 const lvl = levelFor(total);
 document.getElementById('badge-current').textContent = lvl.label ? (lvl.icon + ' ' + lvl.label) : t(STATIC_UI.recNoBadge);
 document.getElementById('badge-next').textContent = lvl.next
 ? (LANG==='ko' ? (lvl.next + '회까지 ' + (lvl.next - total) + '회 남음') : ((lvl.next - total) + ' more to reach ' + lvl.next))
 : t(STATIC_UI.recMaxBadge);
 const prevThreshold = lvl.label === 'Gold' ? 100 : lvl.label === 'Silver' ? 50 : lvl.label === 'Bronze' ? 30 : 0;
 const nextThreshold = lvl.next || 100;
 const pct = lvl.next ? Math.min(100, Math.max(0, ((total - prevThreshold) / (nextThreshold - prevThreshold)) * 100)) : 100;
 document.getElementById('badge-bar-fill').style.width = pct + '%';

 const xp = myProfile.xp || 0;
 const lvlNum = xpLevel(xp);
 const intoLevel = xpIntoLevel(xp);
 document.getElementById('xp-level-label').textContent = 'Lv.' + lvlNum;
 document.getElementById('xp-progress-label').textContent = intoLevel + ' / 100 XP';
 const waterFill = document.getElementById('xp-water-fill');
 if(waterFill){
 const bodyTop = 34, bodyBottom = 104, bodyHeight = bodyBottom - bodyTop; // bottle body region in the 60x104 viewBox
 const pct = Math.max(0, Math.min(100, intoLevel)) / 100;
 const fillHeight = Math.max(4, bodyHeight * pct);
 waterFill.setAttribute('y', bodyBottom - fillHeight);
 waterFill.setAttribute('height', fillHeight + 10); // small overflow, safely clipped by bottle shape
 const XP_LEVEL_COLORS = ['#4fc3f7', '#26c6a5', '#9ccc3f', '#ffd60a', '#ff8a3d', '#ff3d00', '#c159ff'];
 waterFill.style.fill = XP_LEVEL_COLORS[(lvlNum - 1) % XP_LEVEL_COLORS.length];
 // 네온 아바타도 같은 색 팔레트로 레벨 따라 자동으로 오라 색·표정이 진화 (별도 상점/재화 없이 단순하게)
 const avatarEl = document.getElementById('neon-avatar');
 const avatarLabelEl = document.getElementById('neon-avatar-label');
 if(avatarEl){
 const auraColor = XP_LEVEL_COLORS[(lvlNum - 1) % XP_LEVEL_COLORS.length];
 avatarEl.style.boxShadow = '0 0 18px 4px ' + auraColor + ', 0 0 4px 1px ' + auraColor + ' inset';
 avatarEl.style.borderColor = auraColor;
 avatarEl.textContent = String(lvlNum);
 }
 if(avatarLabelEl) avatarLabelEl.textContent = 'Lv.' + lvlNum + ' 네온 캐릭터';
 }

 const achvContainer = document.getElementById('achievements-grid');
 if(achvContainer){
 const unlocked = myProfile.achievements || [];
 achvContainer.innerHTML = '';
 ACHIEVEMENTS.forEach(a=>{
 const isUnlocked = unlocked.includes(a.id);
 const box = document.createElement('div');
 box.className = 'achv-box' + (isUnlocked ? ' unlocked' : '');
 box.innerHTML = '<span class="achv-icon">'+a.icon+'</span><span class="achv-label">'+t(a.label)+'</span>';
 achvContainer.appendChild(box);
 });
 }

 renderHistoryList();
}

try{
 if(openRecordsBtn) openRecordsBtn.addEventListener('click', ()=>{
 renderRecordsScreen();
 showScreen(recordsScreen);
 });
 if(recordsBackBtn) recordsBackBtn.addEventListener('click', ()=> showScreen(startScreen));
}catch(e){ console.error('records button setup failed:', e); }

try{
 document.querySelectorAll('.recovery-trigger-btn').forEach(btn=>{
 btn.addEventListener('click', ()=> showScreen(recoveryScreen));
 });
 if(recoveryBackBtn) recoveryBackBtn.addEventListener('click', ()=> showScreen(startScreen));

 const openMoreBtn = document.getElementById('open-more-btn');
 const moreBackBtn = document.getElementById('more-back-btn');
 if(openMoreBtn) openMoreBtn.addEventListener('click', ()=> showScreen(moreScreen));
 if(moreBackBtn) moreBackBtn.addEventListener('click', ()=> showScreen(startScreen));

 // ---------- Video clip gallery (운동영상 모음) ----------
 let videoClipObserver = null;
 function openVideoLightbox(clip){
 const lightbox = document.getElementById('video-lightbox');
 const video = document.getElementById('video-lightbox-video');
 const label = document.getElementById('video-lightbox-label');
 const desc = document.getElementById('video-lightbox-desc');
 const tip = document.getElementById('video-lightbox-tip');
 const risk = document.getElementById('video-lightbox-risk');
 if(!lightbox || !video) return;
 video.src = clipUrl(clip.file);
 if(label) label.textContent = clip.label;
 if(desc) desc.textContent = clip.desc;
 if(tip) tip.textContent = clip.tip;
 if(risk) risk.textContent = clip.risk || '';
 lightbox.classList.add('on');
 const p = video.play();
 if(p && p.catch) p.catch(()=>{});
 }
 function closeVideoLightbox(){
 const lightbox = document.getElementById('video-lightbox');
 const video = document.getElementById('video-lightbox-video');
 if(video){ video.pause(); video.removeAttribute('src'); video.load(); }
 if(lightbox) lightbox.classList.remove('on');
 }
 const videoLightboxCloseBtn = document.getElementById('video-lightbox-close');
 if(videoLightboxCloseBtn) videoLightboxCloseBtn.addEventListener('click', closeVideoLightbox);
 const videoLightboxEl = document.getElementById('video-lightbox');
 if(videoLightboxEl) videoLightboxEl.addEventListener('click', (e)=>{ if(e.target === videoLightboxEl) closeVideoLightbox(); });

 function renderVideoGallery(){
 if(!videoGalleryGrid || videoGalleryGrid.children.length) return; // render once
 VIDEO_CLIPS.forEach(clip=>{
 const card = document.createElement('div');
 card.className = 'video-clip-card';
 card.dataset.label = clip.label.toLowerCase();
 const video = document.createElement('video');
 video.src = clipUrl(clip.file);
 video.muted = true;
 video.loop = true;
 video.playsInline = true;
 video.setAttribute('webkit-playsinline', '');
 video.preload = 'metadata';
 const errMsg = document.createElement('div');
 errMsg.className = 'video-clip-error';
 errMsg.style.display = 'none';
 errMsg.textContent = '' + clip.file + ' 파일을 찾을 수 없습니다';
 video.addEventListener('error', ()=>{
 console.error('video clip failed to load:', clip.file, '— check that it is in the same folder as index.html');
 video.style.display = 'none';
 errMsg.style.display = 'flex';
 });
 const textWrap = document.createElement('div');
 textWrap.className = 'video-clip-text';
 const label = document.createElement('div');
 label.className = 'video-clip-label';
 label.textContent = clip.label;
 const desc = document.createElement('div');
 desc.className = 'video-clip-desc';
 desc.textContent = clip.desc;
 const tip = document.createElement('div');
 tip.className = 'video-clip-tip';
 tip.textContent = clip.tip;
 textWrap.appendChild(label);
 textWrap.appendChild(desc);
 textWrap.appendChild(tip);
 card.appendChild(video);
 card.appendChild(errMsg);
 card.appendChild(textWrap);
 card.addEventListener('click', ()=> openVideoLightbox(clip));
 videoGalleryGrid.appendChild(card);
 });
 // Only play the clip(s) actually visible on screen — keeps 12 muted
 // videos from all decoding at once, which would drain battery/CPU.
 try{
 videoClipObserver = new IntersectionObserver((entries)=>{
 entries.forEach(entry=>{
 const vid = entry.target;
 if(entry.isIntersecting){ const p = vid.play(); if(p && p.catch) p.catch(()=>{}); }
 else { vid.pause(); }
 });
 }, { threshold:0.5 });
 videoGalleryGrid.querySelectorAll('video').forEach(v=> videoClipObserver.observe(v));
 }catch(e){ console.error('video gallery observer failed:', e); }
 }
 document.querySelectorAll('.video-gallery-trigger-btn').forEach(btn=>{
 btn.addEventListener('click', ()=>{
 Sound.unlock();
 showScreen(videoGalleryScreen);
 renderVideoGallery();
 Sound.startBGM(); // fun upbeat music instead of the clips' own (muted) audio
 });
 });
 const videoSearchInput = document.getElementById('video-search-input');
 const videoSearchEmpty = document.getElementById('video-search-empty');
 if(videoSearchInput){
 videoSearchInput.addEventListener('input', ()=>{
 const term = videoSearchInput.value.trim().toLowerCase();
 let visibleCount = 0;
 if(videoGalleryGrid){
 videoGalleryGrid.querySelectorAll('.video-clip-card').forEach(card=>{
 const match = !term || (card.dataset.label || '').includes(term);
 card.style.display = match ? '' : 'none';
 if(match) visibleCount++;
 });
 }
 if(videoSearchEmpty) videoSearchEmpty.style.display = (term && visibleCount === 0) ? 'block' : 'none';
 });
 }
 if(videoGalleryBackBtn){
 videoGalleryBackBtn.addEventListener('click', ()=>{
 Sound.stopBGM();
 if(videoGalleryGrid) videoGalleryGrid.querySelectorAll('video').forEach(v=> v.pause());
 closeVideoLightbox();
 showScreen(startScreen);
 });
 }
 const jumpToInjuryBtn = document.getElementById('jump-to-injury-btn');
 if(jumpToInjuryBtn){
 jumpToInjuryBtn.addEventListener('click', ()=>{
 const anchor = document.getElementById('injury-section-anchor');
 if(anchor) anchor.scrollIntoView({ behavior:'smooth', block:'start' });
 });
 }
 document.querySelectorAll('.injury-summary').forEach(btn=>{
 btn.addEventListener('click', ()=>{
 const acc = btn.parentElement;
 if(acc) acc.classList.toggle('open');
 });
 });
 const injurySearchInput = document.getElementById('injury-search-input');
 const injurySearchEmpty = document.getElementById('injury-search-empty');
 if(injurySearchInput){
 injurySearchInput.addEventListener('input', ()=>{
 const term = injurySearchInput.value.trim().toLowerCase();
 let visibleCount = 0;
 document.querySelectorAll('.injury-accordion').forEach(acc=>{
 const summaryBtn = acc.querySelector('.injury-summary');
 const label = summaryBtn ? summaryBtn.textContent.toLowerCase() : '';
 const match = !term || label.includes(term);
 acc.style.display = match ? '' : 'none';
 if(match) visibleCount++;
 // auto-expand the matched section(s) so the answer is right there
 if(term && match && summaryBtn) acc.classList.add('open');
 if(!term) acc.classList.remove('open');
 });
 if(injurySearchEmpty) injurySearchEmpty.style.display = (term && visibleCount === 0) ? 'block' : 'none';
 });
 }
}catch(e){ console.error('recovery button setup failed:', e); }

// ---------- BOOT SEQUENCE ----------
// (moved to the very end of the script — see bottom of file. This comment
// marks where it used to live; keeping the actual calls at the end avoids
// any chance of calling a function before a const/let it depends on has
// been declared, which is exactly what caused this bug before.)

function recordCompletion(){
 const today = todayStr();
 const mKey = monthKeyStr();
 myProfile.totalCompletions = (myProfile.totalCompletions||0) + 1;
 if(myProfile.lastPlayDate === today){
 // already counted today, streak unchanged
 } else if(myProfile.lastPlayDate && isYesterday(myProfile.lastPlayDate)){
 myProfile.currentStreak = (myProfile.currentStreak||0) + 1;
 } else {
 myProfile.currentStreak = 1;
 }
 myProfile.lastPlayDate = today;
 myProfile.bestStreakEver = Math.max(myProfile.bestStreakEver || 0, myProfile.currentStreak);

 myProfile.monthlyCounts = myProfile.monthlyCounts || {};
 myProfile.monthlyCounts[mKey] = (myProfile.monthlyCounts[mKey] || 0) + 1;

 myProfile.history = myProfile.history || [];
 myProfile.history.unshift(Date.now());
 myProfile.history = myProfile.history.slice(0, 50);

 saveProfile();
 updateBestBox();
}

// ---------- SETUP: coach + exercise pickers ----------
function renderExGrid(){
 exGrid.innerHTML = '';
 const searchEl = document.getElementById('ex-search-input');
 const term = searchEl ? searchEl.value.trim().toLowerCase() : '';
 const ordered = EXERCISES.slice().sort((a,b)=> (a.pro?1:0) - (b.pro?1:0));
 const filtered = term ? ordered.filter(ex=> t(ex.label).toLowerCase().includes(term)) : ordered;
 if(term && filtered.length === 0){
 const empty = document.createElement('div');
 empty.className = 'search-empty';
 empty.textContent = LANG==='ko' ? '검색 결과가 없습니다' : 'No matching exercises';
 exGrid.appendChild(empty);
 }
 filtered.forEach(ex=>{
 const div = document.createElement('div');
 const checked = selectedExKeys.has(ex.key);
 div.className = 'ex-chip' + (checked ? ' checked' : '') + (ex.pro ? ' pro' : '');
 div.innerHTML = '<span class="box"></span><span class="name">'+ex.icon+' '+t(ex.label)+'</span>';
 div.addEventListener('click', ()=>{
 if(selectedExKeys.has(ex.key)){
 if(selectedExKeys.size > 1) selectedExKeys.delete(ex.key);
 } else {
 selectedExKeys.add(ex.key);
 }
 renderExGrid();
 renderGroupRow();
 });
 exGrid.appendChild(div);
 });
}

function renderGroupRow(){
 groupRow.innerHTML = '';
 MUSCLE_GROUPS.forEach(g=>{
 const isActive = g.keys.length === selectedExKeys.size && g.keys.every(k=> selectedExKeys.has(k));
 const div = document.createElement('div');
 div.className = 'group-btn' + (isActive ? ' active' : '');
 div.dataset.group = g.id;
 div.innerHTML = t(g.label);
 div.addEventListener('click', ()=>{
 selectedExKeys = new Set(g.keys);
 renderExGrid();
 renderGroupRow();
 });
 groupRow.appendChild(div);
 });
}
try{ renderExGrid(); }catch(e){ console.error('renderExGrid failed:', e); }
try{ renderGroupRow(); }catch(e){ console.error('renderGroupRow failed:', e); }

// ---------- START: mode selection ----------
function pickModeAndGo(keys){
 Sound.unlock();
 selectedExKeys = new Set(keys);
 renderExGrid();
 renderGroupRow();
 showScreen(setupScreen);
}
try{
 const modeRandomBtn = document.getElementById('mode-random');
 const modeManualBtn = document.getElementById('mode-manual');
 if(modeRandomBtn) modeRandomBtn.addEventListener('click', ()=> pickModeAndGo(EXERCISES.map(e=>e.key)));
 if(modeManualBtn) modeManualBtn.addEventListener('click', ()=>{
 Sound.unlock();
 showScreen(manualSelectScreen);
 });
}catch(e){ console.error('mode buttons failed:', e); }

try{
 const quickBeginnerBtn = document.getElementById('quick-beginner');
 const quickAdvancedBtn = document.getElementById('quick-advanced');
 if(quickBeginnerBtn) quickBeginnerBtn.addEventListener('click', ()=>{
 selectedExKeys = new Set(EXERCISES.filter(e=>!e.pro).map(e=>e.key));
 renderExGrid();
 renderGroupRow();
 });
 if(quickAdvancedBtn) quickAdvancedBtn.addEventListener('click', ()=>{
 selectedExKeys = new Set(EXERCISES.map(e=>e.key));
 renderExGrid();
 renderGroupRow();
 });
}catch(e){ console.error('difficulty quick-select buttons failed:', e); }

// ---------- AI ROUTINE QUIZ ----------
const QUIZ_TITLES = {
 ko: ['오늘 목표가 무엇입니까?', '난이도는?'],
 en: ["What's today's goal?", 'Difficulty?'],
};
let quizAnswers = {};
try{
 const modeAiBtn = document.getElementById('mode-ai-btn');
 const oneMinStartBtn = document.getElementById('one-min-start-btn');
 const oneMinPanel = document.getElementById('one-min-panel');
 if(oneMinStartBtn && oneMinPanel){
 oneMinStartBtn.addEventListener('click', ()=>{
 Sound.unlock();
 // 예전에는 시작 버튼을 숨기고 패널을 그 자리에 펼쳤는데, 닫는 길이 없어서
 // 한 번 열면 홈으로 되돌릴 수가 없었다. 시트는 배경을 누르거나 아래로
 // 끌어내리거나 Esc 로 닫힌다.
 openSheet(oneMinPanel, { title: '어떻게 시작할까요', from: oneMinStartBtn });
 });
 }
 const aiQuizBackBtn = document.getElementById('ai-quiz-back-btn');
 const savedPrefsAtBoot = loadSetupPrefs();
 const hasSavedRoutine = !!(savedPrefsAtBoot && Array.isArray(savedPrefsAtBoot.exKeys) && savedPrefsAtBoot.exKeys.length);
 const repeatTriggerMoreBtn = document.getElementById('repeat-trigger-more');
 const repeatTriggerStartBtn = document.getElementById('repeat-trigger-start');
 if(repeatTriggerMoreBtn && hasSavedRoutine) repeatTriggerMoreBtn.style.display = '';
 if(repeatTriggerStartBtn && hasSavedRoutine) repeatTriggerStartBtn.style.display = '';
 document.querySelectorAll('.repeat-trigger-btn').forEach(btn=>{
 btn.addEventListener('click', ()=>{
 Sound.unlock();
 flash('#ffe600');
 const prefs = loadSetupPrefs();
 applySetupPrefs(prefs); // re-apply in case the user changed things earlier this session
 saveWeightKg(currentWeightKg());
 buildMissions();
 showWodPreview(()=>{ if(prefs && prefs.warmupOn){ startWarmup(); } else { startCountdown(); } });
 });
 });
 if(modeAiBtn) modeAiBtn.addEventListener('click', ()=>{
 Sound.unlock();
 flash('#ffe600');
 quizAnswers = {};
 showQuizStep(0);
 showScreen(aiQuizScreen);
 });
 if(aiQuizBackBtn){
 aiQuizBackBtn.addEventListener('click', ()=>{
 const currentStep = document.querySelector('.quiz-step[style*="flex"]');
 const stepNum = currentStep ? Number(currentStep.dataset.step) : 0;
 if(stepNum > 0){ showQuizStep(stepNum - 1); }
 else { showScreen(startScreen); }
 });
 }

 function showQuizStep(n){
 document.querySelectorAll('.quiz-step').forEach(s=> s.style.display = (Number(s.dataset.step) === n) ? 'flex' : 'none');
 document.querySelectorAll('.quiz-progress .dot').forEach(d=> d.classList.toggle('active', Number(d.dataset.step) === n));
 const titleEl = document.getElementById('quiz-title');
 if(titleEl) titleEl.textContent = (QUIZ_TITLES[LANG] || QUIZ_TITLES.ko)[n];
 }

 function finishQuiz(){
 const pool = AI_GOAL_POOLS[quizAnswers.goal] || AI_GOAL_POOLS.full;
 let keys = pool.filter(k=>{
 if(quizAnswers.level === 'advanced') return true;
 const ex = EXERCISES.find(e=>e.key===k);
 return ex && !ex.pro;
 });
 if(keys.length < 2) keys = pool; // fallback if filtering left too few
 selectedExKeys = new Set(keys);
 renderExGrid();
 renderGroupRow();
 showScreen(setupScreen);
 }

 document.querySelectorAll('#quiz-step-0 .quiz-btn').forEach(btn=>{
 btn.addEventListener('click', ()=>{ quizAnswers.goal = btn.dataset.goal; showQuizStep(1); });
 });
 document.querySelectorAll('#quiz-step-1 .quiz-btn').forEach(btn=>{
 btn.addEventListener('click', ()=>{ quizAnswers.level = btn.dataset.level; finishQuiz(); });
 });
}catch(e){ console.error('AI quiz setup failed:', e); }

// ---------- MY ROUTINES (save / load / share a set of exercises + duration) ----------
const ROUTINES_KEY = 'wodrush_routines_v1';
function loadRoutines(){
 try{
 const raw = localStorage.getItem(ROUTINES_KEY);
 return raw ? JSON.parse(raw) : [];
 }catch(e){ return []; }
}
function saveRoutinesList(list){
 try{ localStorage.setItem(ROUTINES_KEY, JSON.stringify(list)); }catch(e){}
}
function encodeRoutine(routine){
 try{ return btoa(encodeURIComponent(JSON.stringify(routine))); }catch(e){ return null; }
}
function decodeRoutine(str){
 try{ return JSON.parse(decodeURIComponent(atob(str))); }catch(e){ return null; }
}

function renderRoutinesList(){
 const list = loadRoutines();
 const container = document.getElementById('routines-list');
 if(!container) return;
 if(!list.length){
 container.innerHTML = '<div class="lb-empty">아직 저장한 루틴이 없습니다.</div>';
 return;
 }
 container.innerHTML = '';
 list.forEach((r, i)=>{
 const row = document.createElement('div');
 row.className = 'routine-row';
 row.innerHTML =
 '<div class="info"><div class="rname"></div><div class="rmeta"></div></div>' +
 '<button class="load-btn">불러오기</button>' +
 '<button class="share-btn">공유</button>' +
 '<button class="danger del-btn">삭제</button>';
 row.querySelector('.rname').textContent = r.name;
 row.querySelector('.rmeta').textContent = r.keys.length + '개 운동 · ' + (r.duration||'normal');
 row.querySelector('.load-btn').addEventListener('click', ()=>{
 selectedExKeys = new Set(r.keys);
 selectedDurationPreset = r.duration || 'normal';
 document.querySelectorAll('#duration-row .duration-btn').forEach(b=>{
 b.classList.toggle('active', b.dataset.preset === selectedDurationPreset);
 });
 renderExGrid();
 renderGroupRow();
 showScreen(setupScreen);
 });
 row.querySelector('.share-btn').addEventListener('click', async ()=>{
 const encoded = encodeRoutine({ name:r.name, keys:r.keys, duration:r.duration });
 if(!encoded) return;
 const url = location.href.split('#')[0].split('?')[0] + '?routine=' + encoded;
 const text = (LANG==='ko' ? '내가 만든 루틴 "' + r.name + '" 해볼래?\n' : 'Try my "' + r.name + '" routine?\n') + url;
 try{
 if(navigator.share){ await navigator.share({ text, url }); return; }
 }catch(e){}
 try{
 await navigator.clipboard.writeText(text);
 alert(LANG==='ko' ? '링크를 복사했어요!' : 'Link copied!');
 }catch(e){}
 });
 row.querySelector('.del-btn').addEventListener('click', ()=>{
 const cur = loadRoutines();
 cur.splice(i, 1);
 saveRoutinesList(cur);
 renderRoutinesList();
 });
 container.appendChild(row);
 });
}

try{
 const openRoutinesBtn = document.getElementById('open-routines-btn');
 const routinesBackBtn = document.getElementById('routines-back-btn');
 const saveRoutineBtn = document.getElementById('save-routine-btn');
 if(openRoutinesBtn) openRoutinesBtn.addEventListener('click', ()=>{
 renderRoutinesList();
 showScreen(routinesScreen);
 });
 if(routinesBackBtn) routinesBackBtn.addEventListener('click', ()=> showScreen(startScreen));
 if(saveRoutineBtn) saveRoutineBtn.addEventListener('click', ()=>{
 const msgEl = document.getElementById('save-routine-msg');
 const nameInput = document.getElementById('routine-name-input');
 const name = nameInput.value.trim().slice(0,14);
 if(!name){ if(msgEl) msgEl.textContent = LANG==='ko' ? '루틴 이름을 입력해주십시오.' : 'Enter a routine name.'; return; }
 const list = loadRoutines();
 list.unshift({ name, keys: Array.from(selectedExKeys), duration: selectedDurationPreset });
 saveRoutinesList(list.slice(0, 20));
 if(msgEl) msgEl.textContent = LANG==='ko' ? '저장했어요!' : 'Saved!';
 nameInput.value = '';
 });
}catch(e){ console.error('routines UI setup failed:', e); }

// ---------- Load a routine shared via URL (?routine=...) ----------
try{
 const params = new URLSearchParams(location.search);
 const sharedRoutine = params.get('routine');
 if(sharedRoutine){
 const decoded = decodeRoutine(sharedRoutine);
 if(decoded && Array.isArray(decoded.keys) && decoded.keys.length){
 selectedExKeys = new Set(decoded.keys);
 selectedDurationPreset = decoded.duration || 'normal';
 renderExGrid();
 renderGroupRow();
 document.querySelectorAll('#duration-row .duration-btn').forEach(b=>{
 b.classList.toggle('active', b.dataset.preset === selectedDurationPreset);
 });
 showScreen(setupScreen);
 const name = decoded.name ? (' "' + decoded.name + '"') : '';
 alert(LANG==='ko' ? ('친구가 공유한 루틴' + name + '을 불러왔어요!') : ('Loaded a shared routine' + name + '!'));
 }
 }
}catch(e){ console.error('shared routine load failed:', e); }

// ---------- Load a friend's challenge via URL (?cn=nickname&cs=streak&ct=total) ----------
try{
 const cparams = new URLSearchParams(location.search);
 const cn = cparams.get('cn');
 const cs = cparams.get('cs');
 const ct = cparams.get('ct');
 if(cn && cs){
 const banner = document.getElementById('challenge-invite');
 const titleEl = document.getElementById('challenge-invite-title');
 const subEl = document.getElementById('challenge-invite-sub');
 const acceptBtn = document.getElementById('challenge-accept-btn');
 if(banner && titleEl && subEl && acceptBtn){
 banner.style.display = 'block';
 titleEl.textContent = LANG==='ko' ? ('' + cn + '님의 도전장!') : ('Challenge from ' + cn + '!');
 subEl.textContent = LANG==='ko'
 ? ('연속 ' + cs + '일 · 총 ' + (ct || 0) + '회 — 이 기록을 이겨보자!')
 : (cs + '-day streak · ' + (ct || 0) + ' total — try to beat it!');
 const flagKey = 'wodrush_challenge_seen_' + encodeURIComponent(cn + '|' + cs + '|' + (ct||''));
 acceptBtn.addEventListener('click', ()=>{
 banner.style.display = 'none';
 if(!localStorage.getItem(flagKey)){
 localStorage.setItem(flagKey, '1');
 myProfile.xp = (myProfile.xp || 0) + 10;
 myProfile.challengesAccepted = (myProfile.challengesAccepted || 0) + 1;
 checkAchievements();
 saveProfile();
 }
 try{
 const cleanUrl = new URL(location.href);
 cleanUrl.searchParams.delete('cn'); cleanUrl.searchParams.delete('cs'); cleanUrl.searchParams.delete('ct');
 history.replaceState(null, '', cleanUrl.toString());
 }catch(e){}
 });
 }
 }
}catch(e){ console.error('challenge invite load failed:', e); }

try{
 const manualConfirmBtn = document.getElementById('manual-confirm-btn');
 const manualBackBtn = document.getElementById('manual-back-btn');
 if(manualConfirmBtn) manualConfirmBtn.addEventListener('click', ()=>{
 Sound.unlock();
 showScreen(setupScreen);
 });
 if(manualBackBtn) manualBackBtn.addEventListener('click', ()=> showScreen(startScreen));
}catch(e){ console.error('manual select buttons failed:', e); }

try{
 document.querySelectorAll('#duration-row .duration-btn').forEach(btn=>{
 btn.addEventListener('click', ()=>{
 document.querySelectorAll('#duration-row .duration-btn').forEach(b=> b.classList.toggle('active', b === btn));
 selectedDurationPreset = btn.dataset.preset;
 const customToggle = document.getElementById('custom-duration-toggle');
 const customInput = document.getElementById('custom-duration-input');
 if(customToggle){ customToggle.checked = false; }
 if(customInput){ customInput.style.display = 'none'; }
 });
 });
}catch(e){ console.error('duration preset buttons failed:', e); }

try{
 const customToggle = document.getElementById('custom-duration-toggle');
 const customInput = document.getElementById('custom-duration-input');
 if(customToggle && customInput){
 customToggle.addEventListener('change', ()=>{
 if(customToggle.checked){
 selectedDurationPreset = 'custom';
 customInput.style.display = 'inline-block';
 document.querySelectorAll('#duration-row .duration-btn').forEach(b=> b.classList.remove('active'));
 } else {
 selectedDurationPreset = 'normal';
 customInput.style.display = 'none';
 document.querySelectorAll('#duration-row .duration-btn').forEach(b=> b.classList.toggle('active', b.dataset.preset === 'normal'));
 }
 });
 }
}catch(e){ console.error('custom duration toggle failed:', e); }

try{
 document.querySelectorAll('#setcount-row .duration-btn').forEach(btn=>{
 btn.addEventListener('click', ()=>{
 document.querySelectorAll('#setcount-row .duration-btn').forEach(b=> b.classList.toggle('active', b === btn));
 selectedTotalSets = parseInt(btn.dataset.count, 10) || 8;
 updateSetNote();
 const customToggle = document.getElementById('custom-setcount-toggle');
 const customInput = document.getElementById('custom-setcount-input');
 if(customToggle){ customToggle.checked = false; }
 if(customInput){ customInput.style.display = 'none'; }
 revealDurationCard();
 });
 });
}catch(e){ console.error('set count buttons failed:', e); }

try{
 const customSetToggle = document.getElementById('custom-setcount-toggle');
 const customSetInput = document.getElementById('custom-setcount-input');
 if(customSetToggle && customSetInput){
 customSetToggle.addEventListener('change', ()=>{
 if(customSetToggle.checked){
 customSetInput.style.display = 'inline-block';
 document.querySelectorAll('#setcount-row .duration-btn').forEach(b=> b.classList.remove('active'));
 selectedTotalSets = Math.max(2, Math.min(30, parseInt(customSetInput.value, 10) || 8));
 } else {
 customSetInput.style.display = 'none';
 selectedTotalSets = 8;
 document.querySelectorAll('#setcount-row .duration-btn').forEach(b=> b.classList.toggle('active', b.dataset.count === '8'));
 }
 updateSetNote();
 revealDurationCard();
 });
 customSetInput.addEventListener('input', ()=>{
 selectedTotalSets = Math.max(2, Math.min(30, parseInt(customSetInput.value, 10) || 8));
 updateSetNote();
 });
 }
}catch(e){ console.error('custom set count failed:', e); }

setupBackBtn.addEventListener('click', ()=> showScreen(startScreen));

playBtn.addEventListener('touchstart', ()=> Sound.unlock(), {passive:true});
playBtn.addEventListener('click', ()=>{
 Sound.unlock();
 flash('#ffe600');
 const nick = nicknameInput.value.trim().slice(0, 10);
 if(nick){ myNickname = nick; saveNickname(nick); }
 saveWeightKg(currentWeightKg());
 saveSetupPrefs();
 buildMissions();
 showWodPreview(()=>{
 if(warmupToggle && warmupToggle.checked){
 startWarmup();
 } else {
 startCountdown();
 }
 });
});

function showWodPreview(nextFn){
 try{
 const list = document.getElementById('wod-preview-list');
 if(list){
 list.innerHTML = '';
 missions.forEach((m, i)=>{
 const item = document.createElement('div');
 item.className = 'wod-preview-item' + (m.isBoss ? ' boss' : '');
 item.style.animationDelay = (i * 0.04) + 's';
 item.innerHTML =
 '<span class="wpi-num">' + (i+1) + '</span>' +
 '<span class="wpi-icon">' + m.ex.icon + '</span>' +
 '<span>' + t(m.ex.label) + (m.isBoss ? (LANG==='ko' ? ' (보스)' : ' (BOSS)') : '') + '</span>';
 list.appendChild(item);
 });
 }
 showScreen(wodPreviewScreen);
 setTimeout(()=>{ nextFn(); }, 3200);
 }catch(e){
 console.error('showWodPreview failed:', e);
 nextFn();
 }
}
function startWarmup(){
 try{
 showScreen(warmupScreen);
 const errEl = document.getElementById('warmup-video-error');
 if(errEl) errEl.style.display = 'none';
 if(warmupVideo){
 warmupVideo.style.display = '';
 // preload="none" 이라 여기서 처음 받는다. 준비운동을 건너뛰는 사람은
 // 8.6MB 를 아예 안 받게 된다 — 예전에는 화면을 열기만 해도 받았다.
 if(warmupVideo.readyState === 0) warmupVideo.load();
 warmupVideo.currentTime = 0;
 const p = warmupVideo.play();
 if(p && p.catch){
 p.catch((err)=>{
 // 재생 정책 거부(NotAllowedError)와 파일을 못 받은 것은 다른 일이다.
 // 예전에는 둘 다 '영상을 불러오지 못했어요' 로 나와 원인을 감췄다.
 // 재생 정책 거부(NotAllowedError)와 파일을 못 받은 것은 다른 일이다.
 // 예전에는 둘 다 '영상을 불러오지 못했어요' 로 나와 원인을 감췄다.
 const blocked = err && err.name === 'NotAllowedError';
 console.error('warmup video play() rejected:', err);
 if(errEl){
 errEl.textContent = blocked
 ? '화면을 한 번 눌러 주시면 준비운동이 시작됩니다.'
 : '준비운동 영상을 불러오지 못했습니다. 건너뛰고 시작해도 됩니다.';
 errEl.style.display = 'block';
 }
 if(blocked){
 // 소리를 끄지 않는다 — 준비운동 안내가 소리로 나오기 때문이다.
 // 대신 한 번 누르면 그 제스처로 재생한다.
 const retry = ()=>{
 warmupVideo.play().then(()=>{ if(errEl) errEl.style.display = 'none'; }).catch(()=>{});
 };
 warmupScreen.addEventListener('click', retry, { once: true });
 } else if(warmupVideo){
 warmupVideo.style.display = 'none';
 }
 });
 }
 }
 }catch(e){
 console.error('warm-up video failed to start:', e);
 startCountdown();
 }
}

function finishWarmup(){
 try{ if(warmupVideo) warmupVideo.pause(); }catch(e){}
 warmupCompletedThisSession = true;
 startCountdown();
}

try{
 if(warmupVideo) warmupVideo.addEventListener('ended', finishWarmup);
 if(warmupVideo){
 warmupVideo.addEventListener('error', ()=>{
 console.error('warmup video failed to load (check that warmup.mp4 is in the same folder as index.html)');
 const errEl = document.getElementById('warmup-video-error');
 if(errEl) errEl.style.display = 'block';
 warmupVideo.style.display = 'none';
 });
 }
 if(warmupSkipBtn) warmupSkipBtn.addEventListener('click', finishWarmup);
}catch(e){ console.error('warm-up video listeners failed:', e); }

function shuffleArr(arr){
 const a = arr.slice();
 for(let i=a.length-1;i>0;i--){
 const j = Math.floor(Math.random()*(i+1));
 [a[i],a[j]] = [a[j],a[i]];
 }
 return a;
}

function buildMissions(){
 warmupCompletedThisSession = false;
 const pool = EXERCISES.filter(e=> selectedExKeys.has(e.key));
 missions = [];

 const missionCount = regularSetCount();
 let sequence;
 if(pool.length <= missionCount){
 sequence = shuffleArr(pool);
 while(sequence.length < missionCount){
 sequence.push(pool[Math.floor(Math.random()*pool.length)]);
 }
 sequence = shuffleArr(sequence);
 } else {
 sequence = shuffleArr(pool).slice(0, missionCount);
 }

 const preset = getDurationPreset();
 let dur = preset.base + Math.floor(Math.random()*preset.range);
 for(let i=0;i<missionCount;i++){
 missions.push({ ex: sequence[i], duration: Math.round(dur), isBoss:false });
 dur *= 1.1; // 세트마다 1.1배씩 증가
 }

 // boss mission: continues the same progression, hardest version of a random pool exercise
 const bossEx = pool[Math.floor(Math.random()*pool.length)];
 missions.push({ ex:bossEx, duration: Math.round(dur), isBoss:true });

 midRestIndex = Math.min(Math.floor(missions.length/2), missions.length - 2);
 midRestGiven = false;

 // ---------- 깜짝 보너스 라운드 (재미 요소) ----------
 // ~60% chance one random non-boss set becomes a "bonus round" worth
 // double XP — an unpredictable little treat, not something you can
 // plan around, which is what makes it feel fun rather than routine.
 bonusMissionIndex = -1;
 bonusXpEarned = 0;
 if(missions.length > 2 && Math.random() < 0.6){
 bonusMissionIndex = Math.floor(Math.random() * (missions.length - 1)); // exclude boss (last index)
 missions[bonusMissionIndex].isBonus = true;
 }
}

function vibrate(pattern){
 if(!vibrationEnabled) return;
 try{ if(navigator.vibrate) navigator.vibrate(pattern); }catch(e){}
}
function startCountdown(){
 wodStartTimestamp = Date.now();
 showScreen(countdownScreen);
 let n = 3;
 countdownNum.textContent = n;
 restartAnim(countdownNum);
 Sound.countBeep(3);
 vibrate(40);
 const iv = setInterval(()=>{
 n--;
 if(n <= 0){
 clearInterval(iv);
 Sound.countBeep(0);
 vibrate([0,60,40,90]);
 startGame();
 return;
 }
 countdownNum.textContent = n;
 restartAnim(countdownNum);
 Sound.countBeep(n);
 vibrate(40);
 }, 650);
}
function restartAnim(el){
 el.style.animation = 'none';
 void el.offsetWidth;
 el.style.animation = 'pop 0.85s ease';
}

// ---------- GAME ----------
function startGame(){
 score = 0; streak = 0; missionIndex = 0;
 scoreVal.textContent = '0';
 showScreen(gameScreen);
 if(app) app.classList.add('workout-mode');
 Sound.unlock(); // re-attempt right before playback — some mobile browsers
 // re-suspend the audio context if enough async time
 // (preview screen, countdown) passed since the last unlock
 runMission();
}

function runMission(){
 if(missionIndex >= missions.length){ finishGame(); return; }
 const m = missions[missionIndex];
 missionActive = true;

 missionCountEl.textContent = (missionIndex+1) + ' / ' + missions.length;
 Sound.restartBGMForSet(missionIndex); // a slightly different tune each set
 const wodSideFill = document.getElementById('wod-side-fill');
 const wodSideBadge = document.getElementById('wod-side-badge');
 const wodPct = Math.round((missionIndex / missions.length) * 100);
 if(wodSideFill) wodSideFill.style.height = wodPct + '%';
 if(wodSideBadge) wodSideBadge.style.bottom = wodPct + '%';
 gameScreen.classList.toggle('boss', m.isBoss);
 bossBanner.classList.toggle('on', m.isBoss);
 if(bonusBanner) bonusBanner.classList.toggle('on', !!m.isBonus);
 Sound.setBGMIntensity(m.isBoss);
 if(m.isBoss){ setCoachLine(selectedCoach.bossIntro); Sound.bossHit(); }
 else { setCoachLine(pickVariant(t(selectedCoach.start))); }
 if(m.isBonus && !m.isBoss){ Sound.fanfare(); }

 figureWrap.className = 'figure-wrap anim-' + m.ex.key.toLowerCase();
 if(m.ex.key === 'LEGRAISE'){ startLegSync(1600); } else { stopLegSync(); }
 startPhotoDemo(m.ex.key);
 exName.textContent = t(m.ex.label) + (m.isBoss ? (LANG==='ko' ? ' (보스)' : ' (BOSS)') : '');
 exTarget.style.display = 'none';
 exCue.textContent = t(m.ex.cue);
 clearBanner.style.opacity = '0';
 // show what's coming up next continuously through the whole set,
 // instead of only flashing on for the last 3 seconds
 const upcomingNext = missions[missionIndex + 1];
 if(upcomingNext){
 nextPreview.textContent = (LANG==='ko' ? '다음: ' : 'Next: ') + upcomingNext.ex.icon + ' ' + t(upcomingNext.ex.label);
 } else {
 nextPreview.textContent = LANG==='ko' ? '마지막 세트!' : 'Final set!';
 }
 nextPreview.classList.add('on');
 speakExercise(t(m.ex.label), t(m.ex.cue));

 // speak the caution tip partway through the set — a reminder mid-exercise
 // rather than front-loading everything into one long announcement
 if(tipTimeout){ clearTimeout(tipTimeout); tipTimeout = null; }
 if(m.ex.tip && m.duration >= 6){
 const tipDelayMs = Math.max(2500, Math.round(m.duration * 1000 * 0.45));
 tipTimeout = setTimeout(()=>{
 if(missionActive) speakTip(t(m.ex.tip));
 }, tipDelayMs);
 }

 // motivational voice line during the quiet stretch later in a longer
 // set — timed after the tip so the two never overlap, and only every
 // other set so it doesn't get repetitive
 if(motivationTimeout){ clearTimeout(motivationTimeout); motivationTimeout = null; }
 if(m.duration >= 9 && missionIndex % 2 === 0){
 const motivationDelayMs = Math.max(5000, Math.round(m.duration * 1000 * 0.75));
 motivationTimeout = setTimeout(()=>{
 if(missionActive) speakMotivation();
 }, motivationDelayMs);
 }

 runTimer(m);
}

function setCoachLine(text){
 if(coachEmoji) coachEmoji.textContent = selectedCoach.emoji;
 if(coachLine) coachLine.textContent = t(text);
}

let lastVariant = null;
function pickVariant(list){
 if(!Array.isArray(list)) return list;
 if(list.length === 1) return list[0];
 let choice;
 do{ choice = list[Math.floor(Math.random()*list.length)]; } while(choice === lastVariant);
 lastVariant = choice;
 return choice;
}

function runTimer(m){
 const r = 65, circumference = 2*Math.PI*r;
 holdRingProg.style.strokeDasharray = circumference;
 holdRingProg.style.strokeDashoffset = 0;
 holdNum.textContent = m.duration;
 missionTimebarFill.style.width = '100%';

 let elapsed = 0;
 clearInterval(missionInterval);
 missionInterval = setInterval(()=>{
 if(!missionActive || isPaused) return;
 elapsed++;
 const remain = m.duration - elapsed;
 holdNum.textContent = Math.max(0, remain);
 const pct = Math.min(1, elapsed / m.duration);
 holdRingProg.style.strokeDashoffset = circumference * pct;
 missionTimebarFill.style.width = ((1-pct) * 100) + '%';
 if(remain === 3){ Sound.chaseThump(); }
 Sound.holdTick();
 shake();

 if(remain === 1) setCoachLine(selectedCoach.last);
 else if(remain === Math.ceil(m.duration/2)) setCoachLine(selectedCoach.push);

 if(remain > 0 && remain <= 3){
 Sound.countBeep(remain);
 }

 if(elapsed >= m.duration){
 clearInterval(missionInterval);
 completeMission(m);
 }
 }, 1000);
}

const REST_DURATION = 11; // seconds between missions

function skipMission(){
 if(!missionActive) return;
 missionActive = false;
 clearInterval(missionInterval);
 stopLegSync();
 missionIndex++;
 if(missionIndex >= missions.length){
 finishGame();
 } else if(missionIndex === midRestIndex && !midRestGiven){
 midRestGiven = true;
 runRest();
 } else {
 runMission();
 }
}

function completeMission(m){
 if(!missionActive) return;
 missionActive = false;
 streak++;

 score += 10;
 scoreVal.textContent = score;

 Sound.clear();
 setCoachLine(pickVariant(t(selectedCoach.clear)));
 const comboSuffix = (!m.isBoss && streak > 0 && streak % 3 === 0) ? (' COMBO x' + streak) : '';
 const bonusSuffix = m.isBonus ? ' +10 XP!' : '';
 clearBanner.textContent = (m.isBoss ? 'BOSS CLEAR!' : 'CLEAR!') + comboSuffix + bonusSuffix;
 if(m.isBonus){ bonusXpEarned += 10; }
 clearBanner.style.transition = 'none';
 clearBanner.style.opacity = '1';
 requestAnimationFrame(()=>{
 clearBanner.style.transition = 'opacity 0.6s ease';
 clearBanner.style.opacity = '0';
 });
 flash(m.isBoss ? 'rgba(255,80,40,0.5)' : '#fff');

 // brief ~1s beat showing what's coming up next — skipped when a rest
 // break is next, since a "next: rest" preview right before the actual
 // rest screen doesn't add anything
 stopPhotoDemo();
 figureWrap.className = 'figure-wrap';
 exTarget.style.display = 'none';
 const upcoming = missions[missionIndex + 1];
 const upcomingIsRest = (missionIndex + 1) === midRestIndex && !midRestGiven;
 if(!upcomingIsRest){
 if(upcoming){
 exName.textContent = (LANG==='ko' ? '다음: ' : 'Next: ') + upcoming.ex.icon + ' ' + t(upcoming.ex.label);
 exCue.textContent = t(upcoming.ex.cue);
 } else {
 exName.textContent = LANG==='ko' ? '마무리!' : 'Almost done!';
 exCue.textContent = '';
 }
 }

 setTimeout(()=>{
 missionIndex++;
 if(missionIndex >= missions.length){
 finishGame();
 } else if(missionIndex === midRestIndex && !midRestGiven){
 midRestGiven = true;
 runRest();
 } else {
 runMission();
 }
 }, 1000); // ~1s breather beat before the next exercise loads
}

function runRest(){
 bossBanner.classList.remove('on');
 gameScreen.classList.remove('boss');
 figureWrap.className = 'figure-wrap';
 stopPhotoDemo();
 exName.textContent = LANG==='ko' ? '휴식' : 'Rest';
 exTarget.style.display = '';
 exTarget.textContent = LANG==='ko' ? '숨 고르기' : 'Catch your breath';
 exCue.textContent = '';
 setCoachLine(LANG==='ko' ? '잠깐 숨 고르고 가자' : "Take a quick breather");

 const r = 65, circumference = 2*Math.PI*r;
 holdRingProg.style.strokeDasharray = circumference;
 holdRingProg.style.strokeDashoffset = 0;
 holdNum.textContent = REST_DURATION;

 let elapsed = 0;
 clearInterval(missionInterval);
 missionInterval = setInterval(()=>{
 elapsed++;
 const remain = REST_DURATION - elapsed;
 holdNum.textContent = Math.max(0, remain);
 holdRingProg.style.strokeDashoffset = circumference * Math.min(1, elapsed / REST_DURATION);
 Sound.holdTick();
 if(elapsed >= REST_DURATION){
 clearInterval(missionInterval);
 Sound.markIntensified(); // 휴식 후엔 좀 더 신나는 템포로 — 실제 전환은 곧 이어질 runMission()의 세트별 재시작에서 처리
 runMission();
 }
 }, 1000);
}

// ---------- AD TIMING (usage counter only — no real ad network wired up) ----------
// This tracks how many completed sessions the user has had, so that when
// an actual ad SDK (AdMob, etc.) is added later, it's easy to gate ad
// display behind "after workout" + "every 5th use" rules instead of
// showing ads immediately on open.
function checkAndMaybeShowAd(){
 let usageCount = 0;
 try{
 usageCount = parseInt(localStorage.getItem('wodrush_usage_count') || '0', 10) + 1;
 localStorage.setItem('wodrush_usage_count', String(usageCount));
 }catch(e){}
 if(usageCount % 5 === 0){
 // Placeholder hook: this is where a rewarded/interstitial ad call
 // would go once a real ad network SDK is integrated. Left as a
 // no-op for now — never shows anything fake to the user.
 console.log('[ad-timing] usage #' + usageCount + ' — would trigger ad here once a real network is connected');
 }
}

function finishGame(){
 const xpBeforeThisSession = myProfile.xp || 0;
 if(tipTimeout){ clearTimeout(tipTimeout); tipTimeout = null; }
 if(motivationTimeout){ clearTimeout(motivationTimeout); motivationTimeout = null; }
 gameScreen.classList.remove('boss');
 bossBanner.classList.remove('on');
 if(app) app.classList.remove('workout-mode');
 Sound.stopBGM();
 stopLegSync();
 stopPhotoDemo();
 Sound.fanfare();

 finalSub.textContent = (LANG==='ko' ? (missions.length + '개 미션 완주') : (missions.length + ' missions completed')) + ' · +20 XP';
 if(resultCoachEmoji) resultCoachEmoji.textContent = selectedCoach.emoji;
 if(resultCoachLine) resultCoachLine.textContent = t(selectedCoach.finish);

 // ---------- workout time + estimated calories ----------
 // Calorie estimate uses the standard formula
 // kcal = MET * 3.5 * weight(kg) / 200 * minutes, with a MET value per
 // exercise (from the Compendium of Physical Activities) instead of one
 // flat rate for everything, plus a light resting MET during the
 // mid-workout break. On top of that:
 // - warm-up minutes (if done) are added at a light MET, since that's
 // real activity time we weren't counting at all before
 // - the actual wall-clock time of the session (countdown + the short
 // gaps between sets while getting into position) is counted too, at
 // a light "transition" MET — not just the pure hold/rep seconds
 // - a modest EPOC/afterburn bonus is added for the exercise portion —
 // short, high-intensity circuits like this keep burning extra
 // calories for a while after you stop, which a plain "MET × minutes"
 // number ignores entirely
 // Still an estimate — actual burn varies by effort, body composition,
 // etc. — and a session this short (by design — "1분이면 끝") will
 // always land in a modest kcal range no matter how it's calculated;
 // that's real exercise physiology, not the app under-counting.
 const exerciseSeconds = missions.reduce((sum, m) => sum + m.duration, 0);
 const restSeconds = midRestGiven ? REST_DURATION : 0;
 const warmupSeconds = warmupCompletedThisSession ? 60 : 0;
 const wallClockSeconds = wodStartTimestamp ? Math.max(0, (Date.now() - wodStartTimestamp) / 1000) : exerciseSeconds + restSeconds;
 const transitionSeconds = Math.max(0, wallClockSeconds - exerciseSeconds - restSeconds);
 const totalSeconds = wallClockSeconds + warmupSeconds;
 const totalMinutes = Math.max(1, Math.round(totalSeconds / 60));
 const weightKg = currentWeightKg();
 const REST_MET = 1.3;
 const WARMUP_MET = 3.5;
 const TRANSITION_MET = 3.0; // light movement/positioning between sets — still real activity
 const EPOC_BONUS = 1.2; // ~20% afterburn bonus for high-intensity short circuits
 const exerciseKcal = missions.reduce((sum, m) => {
 const met = (m.ex && m.ex.met) || 6.0;
 return sum + met * 3.5 * weightKg / 200 * (m.duration / 60);
 }, 0) * EPOC_BONUS;
 const restKcal = REST_MET * 3.5 * weightKg / 200 * (restSeconds / 60);
 const warmupKcal = WARMUP_MET * 3.5 * weightKg / 200 * (warmupSeconds / 60);
 const transitionKcal = TRANSITION_MET * 3.5 * weightKg / 200 * (transitionSeconds / 60);
 const calories = Math.max(1, Math.round(exerciseKcal + restKcal + warmupKcal + transitionKcal));
 const timeVal = document.getElementById('result-time-val');
 const calVal = document.getElementById('result-cal-val');
 const timeLabel = document.getElementById('result-time-label');
 const calLabel = document.getElementById('result-cal-label');
 if(timeVal) timeVal.textContent = LANG==='ko' ? (totalMinutes + '분') : (totalMinutes + ' min');
 if(calVal) calVal.textContent = calories + 'kcal';
 if(timeLabel) timeLabel.textContent = LANG==='ko' ? '운동시간' : 'Time';
 if(calLabel) calLabel.textContent = LANG==='ko' ? '칼로리 (추정)' : 'Calories (est.)';

 showScreen(resultScreen);
 fireConfetti();
 try{ checkAndMaybeShowAd(); }catch(e){}
 const prevBest = myProfile.bestStreakEver || 0;
 myProfile.totalWorkoutSeconds = (myProfile.totalWorkoutSeconds || 0) + totalSeconds;
 myProfile.totalCalories = (myProfile.totalCalories || 0) + calories;
 const isWeekendToday = [0,6].includes(new Date().getDay());
 const baseXp = 20;
 const weekendBonusXp = isWeekendToday ? baseXp : 0; // 주말 한정: 기본 XP 2배
 myProfile.xp = (myProfile.xp || 0) + baseXp + weekendBonusXp;
 if(bonusXpEarned > 0){ myProfile.xp += bonusXpEarned; }

 let dailyChallengeMsg = weekendBonusXp > 0
 ? (LANG==='ko' ? ' · 주말 2배 XP!' : ' · Weekend 2x XP!')
 : '';
 if(bonusXpEarned > 0){
 dailyChallengeMsg += LANG==='ko' ? (' · 보너스 라운드 +' + bonusXpEarned + ' XP!') : (' · Bonus round +' + bonusXpEarned + ' XP!');
 }
 try{
 const challengeEx = dailyChallengeExercise();
 const included = missions.some(m => m.ex.key === challengeEx.key);
 if(included && myProfile.dailyChallengeDate !== todayStr()){
 myProfile.dailyChallengeDate = todayStr();
 myProfile.dailyChallengesCompleted = (myProfile.dailyChallengesCompleted || 0) + 1;
 myProfile.xp = (myProfile.xp || 0) + 30;
 dailyChallengeMsg += LANG==='ko' ? ' · 오늘의 챌린지 +30 XP!' : ' · Daily Challenge +30 XP!';
 }
 }catch(e){ console.error('daily challenge check failed:', e); }
 if(dailyChallengeMsg) finalSub.textContent = finalSub.textContent + dailyChallengeMsg;

 // ---------- XP gauge fill-up (도파민 피드백 연출) ----------
 try{
 const xpGainedTotal = (myProfile.xp || 0) - xpBeforeThisSession;
 const leveledUp = xpLevel(myProfile.xp) > xpLevel(xpBeforeThisSession);
 const lvEl = document.getElementById('result-xp-level');
 const gainEl = document.getElementById('result-xp-gain');
 const fillEl = document.getElementById('result-xp-fill');
 if(lvEl) lvEl.textContent = 'Lv.' + xpLevel(myProfile.xp) + (leveledUp ? '' : '');
 if(gainEl) gainEl.textContent = '+' + xpGainedTotal + ' XP';
 if(fillEl){
 fillEl.style.width = '0%';
 setTimeout(()=>{ fillEl.style.width = xpIntoLevel(myProfile.xp) + '%'; }, 150);
 }
 }catch(e){ console.error('result xp gauge failed:', e); }

 checkAchievements();
 recordCompletion();
 try{ renderDailyChallengeCard(); }catch(e){}

 // ---------- personalized recovery tip (workout → recovery synergy) ----------
 // Look at which exercises were actually in today's WOD and surface the
 // single most relevant body-part care tip, linking straight into the
 // recovery screen's search (pre-filled) instead of a generic message.
 try{
 const EX_TO_BODYPART = {
 SQUAT:'무릎', LUNGE:'무릎', JUMPSQUAT:'무릎', RUNINPLACE:'발목',
 BURPEE:'손목', PUSHUP:'손목', PIKEPUSHUP:'어깨', ARMYCRAWL:'손목',
 PLANK:'허리', LEGRAISE:'허리', CRUNCH:'목', HIPBRIDGE:'허리',
 };
 const BODYPART_TIP = {
 '목':'목을 과도하게 젖히거나 당기지 않았는지 확인해보십시오.',
 '어깨':'어깨가 으쓱 올라가지 않았는지, 팔꿈치 각도는 적당했는지 확인해보십시오.',
 '손목':'손목이 과도하게 꺾인 채로 체중을 지탱하지 않았는지 확인해보십시오.',
 '허리':'허리가 뜨거나 과하게 꺾이지 않았는지, 코어에 힘이 들어갔는지 확인해보십시오.',
 '무릎':'무릎이 발끝 방향을 잘 유지했는지, 착지 충격은 잘 흡수했는지 확인해보십시오.',
 '발목':'착지할 때 발목이 옆으로 꺾이지 않았는지 확인해보십시오.',
 };
 const tally = {};
 missions.forEach(m=>{
 const part = EX_TO_BODYPART[m.ex.key];
 if(part) tally[part] = (tally[part] || 0) + 1;
 });
 let topPart = null, topCount = 0;
 Object.keys(tally).forEach(part=>{
 if(tally[part] > topCount){ topPart = part; topCount = tally[part]; }
 });

 // ---------- 오늘의 운동 페르소나 (재미 요소) ----------
 // A playful, shareable title based on what today's WOD leaned toward —
 // purely for fun/personality, not a stat that affects anything.
 const PERSONA_BY_PART = {
 '무릎': { title:'레그데이 챔피언', icon:'' },
 '발목': { title:'러닝 스페셜리스트', icon:'' },
 '손목': { title:'상체 마스터', icon:'' },
 '어깨': { title:'숄더 킹', icon:'' },
 '허리': { title:'기본에 충실', icon:'' },
 '목': { title:'초콜릿복근', icon:'' },
 };
 const personaEl = document.getElementById('persona-badge');
 if(personaEl){
 // spread-out tally (no single part clearly dominant) → balance persona
 const distinctParts = Object.keys(tally).length;
 const isBalanced = !topPart || distinctParts >= 3 || (topCount / missions.length) < 0.4;
 const persona = isBalanced
 ? { title:'올라운더', icon:'' }
 : (PERSONA_BY_PART[topPart] || { title:'올라운더', icon:'' });
 personaEl.style.display = 'inline-flex';
 personaEl.textContent = persona.icon + ' 오늘의 당신: ' + persona.title;
 }

 const tipEl = document.getElementById('result-recovery-tip');
 if(tipEl && topPart){
 tipEl.style.display = 'block';
 tipEl.innerHTML = '오늘은 <b>' + topPart + '</b> 위주 운동이었습니다 — ' + (BODYPART_TIP[topPart] || '') + ' <u>회복 가이드에서 자세히 보기 →</u>';
 tipEl.onclick = ()=>{
 showScreen(recoveryScreen);
 const injuryInput = document.getElementById('injury-search-input');
 if(injuryInput){
 injuryInput.value = topPart;
 injuryInput.dispatchEvent(new Event('input'));
 const anchor = document.getElementById('injury-section-anchor');
 if(anchor) anchor.scrollIntoView({ behavior:'smooth', block:'start' });
 }
 };
 } else if(tipEl){
 tipEl.style.display = 'none';
 }
 }catch(e){ console.error('result recovery tip failed:', e); }

 // ---------- 신기록(PR) 감지 — 짐워크의 "PR 달성 알림"에서 착안 ----------
 // 스트릭뿐 아니라 칼로리·점수도 자기 최고 기록을 추적해서, 뭔가 하나라도
 // 경신하면 결과화면에 눈에 띄는 뱃지로 보여줌
 const prevBestCalories = myProfile.bestCaloriesEver || 0;
 const prevBestScore = myProfile.bestScoreEver || 0;
 const lastSessionCalories = myProfile.lastSessionCalories || 0;
 myProfile.bestCaloriesEver = Math.max(prevBestCalories, calories);
 myProfile.bestScoreEver = Math.max(prevBestScore, score);
 myProfile.lastSessionCalories = calories;
 saveProfile();

 // ---------- 지난 세션 대비 비교 (짐워크의 "이전 기록과 비교" 참고) ----------
 const vsLastEl = document.getElementById('vs-last-line');
 if(vsLastEl){
 if(lastSessionCalories > 0){
 const diff = calories - lastSessionCalories;
 vsLastEl.style.display = 'block';
 if(diff > 0){
 vsLastEl.innerHTML = LANG==='ko' ? ('지난번보다 <b>+' + diff + 'kcal</b> 더 태웠어요') : ('<b>+' + diff + 'kcal</b> more than last time');
 } else if(diff < 0){
 vsLastEl.innerHTML = LANG==='ko' ? ('지난번보다 ' + Math.abs(diff) + 'kcal 적어요') : (Math.abs(diff) + 'kcal less than last time');
 } else {
 vsLastEl.textContent = LANG==='ko' ? '지난번과 동일해요' : 'Same as last time';
 }
 } else {
 vsLastEl.style.display = 'none';
 }
 }
 const brokenRecords = [];
 if(myProfile.bestStreakEver > prevBest) brokenRecords.push(LANG==='ko' ? '연속 기록' : 'streak');
 if(myProfile.bestCaloriesEver > prevBestCalories && prevBestCalories > 0) brokenRecords.push(LANG==='ko' ? '칼로리' : 'calories');
 if(myProfile.bestScoreEver > prevBestScore && prevBestScore > 0) brokenRecords.push(LANG==='ko' ? '점수' : 'score');
 const prBadgeEl = document.getElementById('pr-badge');
 if(prBadgeEl){
 if(brokenRecords.length){
 prBadgeEl.style.display = 'inline-flex';
 prBadgeEl.textContent = '' + (LANG==='ko'
 ? ('자기 최고 기록 경신! (' + brokenRecords.join(', ') + ')')
 : ('New personal best! (' + brokenRecords.join(', ') + ')'));
 } else {
 prBadgeEl.style.display = 'none';
 }
 }

 const newBest = myProfile.bestStreakEver > prevBest;
 if(LANG==='ko'){
 const prefix = newBest ? '자기 최고 기록 경신! · ' : '';
 finalRank.textContent = prefix + '연속 ' + myProfile.currentStreak + '일(오늘 ' + todayCompletionCount() + '회) · 총 ' + myProfile.totalCompletions + '회 완주';
 } else {
 const prefix = newBest ? 'New personal best! · ' : '';
 finalRank.textContent = prefix + myProfile.currentStreak + '-day streak (' + todayCompletionCount() + ' today) · ' + myProfile.totalCompletions + ' sessions total';
 }

 try{
 const dismissed = localStorage.getItem('wodrush_login_prompt_dismissed') === 'true';
 if(!currentUserId && !dismissed && myProfile.totalCompletions === 3){
 setTimeout(()=>{
 const el = document.getElementById('login-prompt-overlay');
 if(el) el.classList.add('on');
 }, 1200);
 }
 }catch(e){}
}

const retryChoiceOverlay = document.getElementById('retry-choice-overlay');
const retrySameBtn = document.getElementById('retry-same-btn');
const retryNewBtn = document.getElementById('retry-new-btn');
const retryCancelBtn = document.getElementById('retry-cancel-btn');

retryBtn.addEventListener('click', ()=>{
 Sound.unlock();
 if(retryChoiceOverlay) retryChoiceOverlay.classList.add('on');
});
if(retrySameBtn){
 retrySameBtn.addEventListener('click', ()=>{
 if(retryChoiceOverlay) retryChoiceOverlay.classList.remove('on');
 buildMissions();
 showWodPreview(()=> startCountdown());
 });
}
if(retryNewBtn){
 retryNewBtn.addEventListener('click', ()=>{
 if(retryChoiceOverlay) retryChoiceOverlay.classList.remove('on');
 showScreen(startScreen);
 });
}
if(retryCancelBtn){
 retryCancelBtn.addEventListener('click', ()=>{
 if(retryChoiceOverlay) retryChoiceOverlay.classList.remove('on');
 });
}

homeBtn.addEventListener('click', ()=>{
 Sound.unlock();
 showScreen(startScreen);
});

// ---------- SHARE RESULT (image card → native share sheet, or download+X fallback) ----------
function wrapText(ctx, text, x, y, maxWidth, lineHeight){
 const words = text.split(' ');
 let line = '';
 let curY = y;
 for(let n=0;n<words.length;n++){
 const testLine = line + words[n] + ' ';
 if(ctx.measureText(testLine).width > maxWidth && n > 0){
 ctx.fillText(line, x, curY);
 line = words[n] + ' ';
 curY += lineHeight;
 } else {
 line = testLine;
 }
 }
 ctx.fillText(line, x, curY);
 return curY;
}

function generateShareCard(){
 const canvas = document.createElement('canvas');
 canvas.width = 600; canvas.height = 860;
 const ctx = canvas.getContext('2d');

 const grad = ctx.createLinearGradient(0, 0, 600, 860);
 grad.addColorStop(0, '#150e0a');
 grad.addColorStop(1, '#0d0a08');
 ctx.fillStyle = grad;
 ctx.fillRect(0, 0, 600, 860);

 const glow = ctx.createRadialGradient(300, 120, 20, 300, 120, 320);
 glow.addColorStop(0, 'rgba(255,90,31,0.35)');
 glow.addColorStop(1, 'rgba(255,90,31,0)');
 ctx.fillStyle = glow;
 ctx.fillRect(0, 0, 600, 500);

 ctx.textAlign = 'center';
 ctx.fillStyle = '#ff5a1f';
 ctx.font = '800 22px sans-serif';
 ctx.fillText('Z I P', 300, 100);

 ctx.fillStyle = '#ffd60a';
 ctx.font = '900 76px sans-serif';
 ctx.fillText((myProfile.currentStreak || 1) + (LANG==='ko' ? '일 연속' : '-day streak'), 300, 210);

 ctx.fillStyle = '#f5f0e8';
 ctx.font = '700 30px sans-serif';
 ctx.fillText(LANG==='ko' ? ('총 ' + (myProfile.totalCompletions || 1) + '회 완주') : ((myProfile.totalCompletions || 1) + ' sessions total'), 300, 260);

 ctx.fillStyle = '#8a7f74';
 ctx.font = '400 20px sans-serif';
 ctx.fillText(LANG==='ko' ? ((missions.length || 0) + '개 미션 완료 · ' + t(selectedCoach.name)) : ((missions.length || 0) + ' missions done · ' + t(selectedCoach.name)), 300, 300);

 ctx.strokeStyle = '#2c2420';
 ctx.lineWidth = 1;
 ctx.beginPath(); ctx.moveTo(80, 350); ctx.lineTo(520, 350); ctx.stroke();

 ctx.font = '64px sans-serif';
 ctx.fillText(selectedCoach.emoji, 300, 450);

 ctx.fillStyle = '#f5f0e8';
 ctx.font = '500 24px sans-serif';
 wrapText(ctx, t(selectedCoach.finish), 300, 500, 460, 32);

 ctx.fillStyle = '#ff5a1f';
 ctx.font = '800 26px sans-serif';
 ctx.fillText(LANG==='ko' ? '이 기록, 깰 수 있어?' : 'Think you can beat this?', 300, 600);

 ctx.fillStyle = '#5a5049';
 ctx.font = '400 15px sans-serif';
 ctx.fillText(LANG==='ko' ? '#Qfit #홈트 #오늘도완주' : '#Qfit #HomeWorkout #DailyGrind', 300, 760);

 // bake the site link into the image itself — captions/text often get
 // stripped when sharing to platforms like Instagram Stories, but this
 // stays visible no matter where the image ends up.
 const siteLabel = (location.hostname + (location.pathname !== '/' ? location.pathname : '')).replace(/\/index\.html$/, '');
 ctx.font = '700 17px sans-serif';
 const linkWidth = ctx.measureText(siteLabel).width + 40;
 ctx.fillStyle = 'rgba(255,214,10,0.12)';
 const pillX = 300 - linkWidth/2, pillY = 800;
 ctx.beginPath();
 if(ctx.roundRect) ctx.roundRect(pillX, pillY, linkWidth, 34, 17);
 else ctx.rect(pillX, pillY, linkWidth, 34);
 ctx.fill();
 ctx.fillStyle = '#ffd60a';
 ctx.fillText(siteLabel, 300, pillY + 22);

 return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
}

async function shareResult(){
 const blob = await generateShareCard();
 if(!blob) return;
 const siteUrl = location.href.split('#')[0].split('?')[0];
 const personaEl = document.getElementById('persona-badge');
 const personaText = (personaEl && personaEl.style.display !== 'none') ? personaEl.textContent : '';
 const shareText = LANG==='ko'
 ? ((personaText ? (personaText + '\n') : '') + (myProfile.currentStreak||1) + '일 연속, 총 ' + (myProfile.totalCompletions||1) + '회 완주 — 이거 깰 수 있어? Q-fit으로 붙어보자\n' + siteUrl)
 : ((personaText ? (personaText + '\n') : '') + (myProfile.currentStreak||1) + '-day streak, ' + (myProfile.totalCompletions||1) + ' sessions total — think you can beat this? Try Q-fit\n' + siteUrl);

 try{
 const file = new File([blob], 'sports-game-result.png', { type:'image/png' });
 if(navigator.canShare && navigator.canShare({ files:[file] })){
 await navigator.share({ files:[file], text: shareText, title:'Q-fit', url: siteUrl });
 return;
 }
 }catch(e){ /* cancelled or unsupported — fall through to fallback below */ }

 // fallback for desktop / unsupported browsers: download image + open X compose
 const url = URL.createObjectURL(blob);
 const a = document.createElement('a');
 a.href = url; a.download = 'sports-game-result.png';
 document.body.appendChild(a); a.click(); document.body.removeChild(a);
 setTimeout(()=> URL.revokeObjectURL(url), 4000);
 window.open('https://twitter.com/intent/tweet?text=' + encodeURIComponent(shareText), '_blank');
}

shareBtn.addEventListener('click', shareResult);

if(resultChallengeBtn) resultChallengeBtn.addEventListener('click', async ()=>{
 const nick = (myNickname || (LANG==='ko' ? '친구' : 'A friend')).slice(0,10);
 const streakVal = myProfile.currentStreak || 1;
 const totalVal = myProfile.totalCompletions || 1;
 const siteUrl = location.href.split('#')[0].split('?')[0];
 const url = siteUrl + '?cn=' + encodeURIComponent(nick) + '&cs=' + streakVal + '&ct=' + totalVal;
 const text = LANG==='ko'
 ? (nick + '님의 도전장! 연속 ' + streakVal + '일 · 총 ' + totalVal + '회 — 이걸 이겨볼래?')
 : (nick + "'s challenge! " + streakVal + '-day streak · ' + totalVal + ' total — think you can beat it?');
 try{
 if(navigator.share){ await navigator.share({ text, url }); return; }
 }catch(e){ /* cancelled — fall through */ }
 try{
 await navigator.clipboard.writeText(text + '\n' + url);
 alert(LANG==='ko' ? '도전장 링크를 복사했어요! 친구에게 붙여넣기 해보십시오.' : 'Challenge link copied! Paste it to a friend.');
 }catch(e){
 prompt(LANG==='ko' ? '아래 링크를 복사해서 보내십시오:' : 'Copy this link to share:', url);
 }
});

// iOS/mobile often suspends the AudioContext when the tab loses focus
// (screen lock, app switch, etc.) and never auto-resumes it — re-arm on return.
document.addEventListener('visibilitychange', ()=>{
 if(document.visibilityState === 'visible'){
 Sound.unlock();
 try{ if(app) app.style.setProperty('--shake', '0px'); }catch(e){}
 }
});
window.addEventListener('pageshow', ()=> Sound.unlock());
window.addEventListener('focus', ()=> Sound.unlock());

// ---------- IN-APP BROWSER DETECTION (KakaoTalk, etc.) ----------
// These webviews restrict/block audio playback entirely — no JS fix
// exists for that. The only real fix is opening in the real browser.
try{
 (function checkInAppBrowser(){
 const ua = navigator.userAgent || '';
 const isKakao = /kakaotalk/i.test(ua);
 const isInstagram = /instagram/i.test(ua);
 const isFacebook = /FBAN|FBAV/i.test(ua);
 const isNaver = /NAVER\(inapp/i.test(ua);
 if(!isKakao && !isInstagram && !isFacebook && !isNaver) return;

 const banner = document.getElementById('inapp-banner');
 if(!banner) return;
 banner.classList.add('on');

 const openBtn = document.getElementById('inapp-open-btn');
 const dismissBtn = document.getElementById('inapp-dismiss-btn');
 if(openBtn){
 openBtn.addEventListener('click', ()=>{
 const url = encodeURIComponent(location.href);
 if(isKakao){
 location.href = 'kakaotalk://web/openExternal?url=' + url;
 } else {
 // most other in-app browsers don't expose a scheme — best effort:
 // try opening in a new tab, which sometimes escapes the webview.
 window.open(location.href, '_blank');
 }
 });
 }
 if(dismissBtn){
 dismissBtn.addEventListener('click', ()=>{
 banner.classList.remove('on');
 });
 }
 })();
}catch(e){ console.error('in-app browser check failed:', e); }

// ---------- REMAINING BOOT STEPS ----------
// Deliberately placed at the very end of the script, after every const/
// let/function in this scope has already been declared — this makes it
// impossible for one of these calls to fail with a "used before
// declaration" error and take down anything after it. Each call is also
// individually try/caught so a genuine runtime bug in one feature can
// never block another.
try{ loadNickname(); }catch(e){ console.error('loadNickname failed:', e); }
try{ loadWeightKg(); }catch(e){ console.error('loadWeightKg failed:', e); }
try{ applySetupPrefs(loadSetupPrefs()); }catch(e){ console.error('applySetupPrefs boot failed:', e); }
try{ renderWeekStrip(); }catch(e){ console.error('week strip boot render failed:', e); }
try{
 const weekendBanner = document.getElementById('weekend-banner');
 if(weekendBanner && [0,6].includes(new Date().getDay())){ weekendBanner.style.display = 'block'; }
}catch(e){ console.error('weekend banner setup failed:', e); }

// ---------- "Add to Home Screen" banner ----------
// Android/Chrome supports a real one-tap native install prompt via
// beforeinstallprompt. iOS Safari has no such API — there, tapping the
// banner just expands the manual "Share → Add to Home Screen" steps,
// since that's the only way to guide someone through it there.
try{
 let deferredInstallPrompt = null;
 const installBanner = document.getElementById('install-banner');
 const installBannerMain = document.getElementById('install-banner-main');
 const installBannerText = document.getElementById('install-banner-text');
 const installBannerDetail = document.getElementById('install-banner-detail');
 const installActionBtn = document.getElementById('install-action-btn');
 const installDismissBtn = document.getElementById('install-dismiss-btn');
 const isStandaloneMode = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone;
 const installDismissed = localStorage.getItem('wodrush_install_dismissed_v1') === '1';
 const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;

 function showInstallBanner(kind){
 if(!installBanner || isStandaloneMode || installDismissed) return;
 installBanner.style.display = 'block';
 installBanner.dataset.kind = kind;
 if(kind === 'ios'){
 if(installBannerText) installBannerText.textContent = '홈 화면에 추가하면 더 빠르게 써요 (눌러서 방법 보기)';
 if(installActionBtn) installActionBtn.style.display = 'none';
 } else {
 if(installBannerText) installBannerText.textContent = '홈 화면에 추가하면 더 빠르게 써요';
 if(installActionBtn) installActionBtn.style.display = '';
 }
 }
 function dismissInstallBanner(){
 try{ localStorage.setItem('wodrush_install_dismissed_v1', '1'); }catch(e){}
 if(installBanner) installBanner.style.display = 'none';
 }

 window.addEventListener('beforeinstallprompt', (e)=>{
 e.preventDefault();
 deferredInstallPrompt = e;
 showInstallBanner('chrome');
 });
 if(isIOS && !isStandaloneMode && !installDismissed){
 showInstallBanner('ios');
 }
 if(installActionBtn){
 installActionBtn.addEventListener('click', async (e)=>{
 e.stopPropagation();
 if(deferredInstallPrompt){
 deferredInstallPrompt.prompt();
 try{ await deferredInstallPrompt.userChoice; }catch(err){}
 deferredInstallPrompt = null;
 }
 dismissInstallBanner();
 });
 }
 if(installDismissBtn){
 installDismissBtn.addEventListener('click', (e)=>{ e.stopPropagation(); dismissInstallBanner(); });
 }
 if(installBannerMain){
 installBannerMain.addEventListener('click', ()=>{
 if(installBanner && installBanner.dataset.kind === 'ios' && installBannerDetail){
 installBannerDetail.style.display = installBannerDetail.style.display === 'none' ? 'block' : 'none';
 }
 });
 }
}catch(e){ console.error('install banner setup failed:', e); }
try{ loadProfile(); }catch(e){ console.error('loadProfile failed:', e); }
try{ renderDailyChallengeCard(); }catch(e){ console.error('renderDailyChallengeCard boot failed:', e); }
try{ checkComeback(); }catch(e){ console.error('checkComeback boot failed:', e); }
try{
 langBtn.addEventListener('click', ()=>{
 try{ setLang(LANG === 'ko' ? 'en' : 'ko'); }catch(e){ console.error('setLang failed:', e); }
 });
 langBtn.textContent = LANG === 'ko' ? 'EN' : '한글';
}catch(e){ console.error('lang button setup failed:', e); }
try{ applyStaticTranslations(); }catch(e){ console.error('applyStaticTranslations failed:', e); }

try{
 if(openAccountBtn) openAccountBtn.addEventListener('click', ()=>{
 updateAccountUI();
 showScreen(accountScreen);
 });
}catch(e){ console.error('open account button failed:', e); }

try{
 document.querySelectorAll('#account-screen .auth-tab').forEach(btn=>{
 btn.addEventListener('click', ()=>{
 document.querySelectorAll('#account-screen .auth-tab').forEach(b=> b.classList.toggle('active', b === btn));
 updateAccountUI();
 });
 });
}catch(e){ console.error('account tabs failed:', e); }

try{
 const loginBtn = document.getElementById('account-login-btn');
 if(loginBtn) loginBtn.addEventListener('click', async ()=>{
 const errEl = document.getElementById('account-login-error');
 try{
 const email = document.getElementById('account-login-email').value.trim();
 const pw = document.getElementById('account-login-pw').value;
 errEl.textContent = '처리 중...';
 if(!email){ errEl.textContent = '이메일을 입력해주십시오.'; return; }
 const sb = await getSupabase();
 if(!sb){ errEl.textContent = '연결에 실패했어요. 페이지를 새로고침해서 다시 시도해주십시오.'; return; }
 const { data, error } = await sb.auth.signInWithPassword({ email, password: pw });
 if(error) throw error;
 currentUserId = data.user.id;
 const row = await fetchProfileFromCloud();
 if(row) applyCloudProfile(row);
 updateAccountUI();
 showScreen(startScreen);
 }catch(e){
 console.error('login failed:', e);
 if(errEl) errEl.textContent = '로그인 실패: ' + (e && e.message ? e.message : '이메일/비밀번호를 확인해주십시오.');
 }
 });
}catch(e){ console.error('login button failed:', e); }

try{
 const signupBtn = document.getElementById('account-signup-btn');
 if(signupBtn) signupBtn.addEventListener('click', async ()=>{
 const errEl = document.getElementById('account-signup-error');
 try{
 const email = document.getElementById('account-signup-email').value.trim();
 const pw = document.getElementById('account-signup-pw').value;
 errEl.style.color = '#ff6b5b';
 errEl.textContent = '처리 중...';
 if(!email){ errEl.textContent = '이메일을 입력해주십시오.'; return; }
 const sb = await getSupabase();
 if(!sb){ errEl.textContent = '연결에 실패했어요. 페이지를 새로고침해서 다시 시도해주십시오.'; return; }
 if(pw.length < 6){ errEl.textContent = '비밀번호는 6자리 이상이어야 합니다.'; return; }
 const { data, error } = await sb.auth.signUp({ email, password: pw });
 if(error) throw error;
 if(!data.session){
 errEl.style.color = 'var(--volt)';
 errEl.textContent = '가입 완료! 인증 메일이 1분 정도 후에 도착할 수 있습니다. (스팸함도 확인해주십시오)';
 return;
 }
 currentUserId = data.user.id;
 await syncProfileToCloud(); // push whatever local progress this device already has
 updateAccountUI();
 showScreen(startScreen);
 }catch(e){
 console.error('signup failed:', e);
 if(errEl) errEl.textContent = '가입 실패: ' + (e && e.message ? e.message : '다시 시도해주십시오.');
 }
 });
}catch(e){ console.error('signup button failed:', e); }

try{
 window.addEventListener('beforeunload', (e)=>{
 if(missionActive){
 e.preventDefault();
 e.returnValue = '';
 }
 });
}catch(e){ console.error('beforeunload setup failed:', e); }

try{ checkSupabaseSession(); }catch(e){ console.error('checkSupabaseSession failed:', e); }
