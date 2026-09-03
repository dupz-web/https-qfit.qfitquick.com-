export const ACHIEVEMENTS = [
  { id:'first', icon:'🎯', label:{ko:'첫 운동', en:'First Workout'}, check:p => (p.totalCompletions||0) >= 1 },
  { id:'streak3', icon:'🔥', label:{ko:'3일 연속', en:'3-Day Streak'}, check:p => (p.bestStreakEver||0) >= 3 },
  { id:'time10', icon:'⏱️', label:{ko:'누적 운동 10분', en:'10 Min Total'}, check:p => (p.totalWorkoutSeconds||0) >= 600 },
  { id:'total100', icon:'💯', label:{ko:'100회 완주', en:'100 Sessions'}, check:p => (p.totalCompletions||0) >= 100 },
  { id:'cal1000', icon:'🔥', label:{ko:'누적 1000kcal', en:'1000 kcal Total'}, check:p => (p.totalCalories||0) >= 1000 },
  { id:'comeback', icon:'🌙', label:{ko:'컴백', en:'Comeback'}, check:p => (p.comebackCount||0) >= 1 },
  { id:'dailychal5', icon:'🎯', label:{ko:'챌린지 마스터', en:'Challenge Master'}, check:p => (p.dailyChallengesCompleted||0) >= 5 },
  { id:'rival1', icon:'⚔️', label:{ko:'라이벌 등장', en:'Rival Accepted'}, check:p => (p.challengesAccepted||0) >= 1 },
];
