// 부위 묶음. keys 는 EXERCISES 의 key 를 가리킨다 — 여기 없는 key 를 적으면
// 그 묶음을 골랐을 때 후보가 조용히 비어 버린다.
// 주간 부위별 비중(FR-12)도 이 표를 기준으로 센다.
export const MUSCLE_GROUPS = [
  { id:'lower', label:{ko:'하체',en:'Lower',zh:'下肢'}, keys:['SQUAT','LUNGE','JUMPSQUAT'] },
  { id:'upper', label:{ko:'상체',en:'Upper',zh:'上肢'}, keys:['PUSHUP','PIKEPUSHUP','ARMYCRAWL'] },
  { id:'core',  label:{ko:'코어',en:'Core',zh:'核心'}, keys:['PLANK','LEGRAISE','CRUNCH','HIPBRIDGE'] },
  { id:'full',  label:{ko:'전신',en:'Full Body',zh:'全身'}, keys:['RUNINPLACE','BURPEE','ARMYCRAWL'] },
];
