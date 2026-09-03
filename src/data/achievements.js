// 업적. check 는 프로필을 받아 참/거짓만 돌려주는 순수 함수다.
//
// 챌린지 관련 업적(챌린지 마스터·라이벌 등장) 둘은 뺐다 — 챌린지 기능 자체를
// 없애기로 했기 때문이다(FR-05). 이미 받은 사람의 프로필에는 그 id 가 남아
// 있지만, 목록에 없는 id 는 화면이 그냥 무시하므로 따로 지울 것은 없다.
export const ACHIEVEMENTS = [
 { id:'first', icon:'', label:{ko:'첫 운동', en:'First Workout', zh:'首次锻炼'}, check:p => (p.totalCompletions||0) >= 1 },
 { id:'streak3', icon:'', label:{ko:'3일 연속', en:'3-Day Streak', zh:'连续3天'}, check:p => (p.bestStreakEver||0) >= 3 },
 { id:'time10', icon:'', label:{ko:'누적 운동 10분', en:'10 Min Total', zh:'累计10分钟'}, check:p => (p.totalWorkoutSeconds||0) >= 600 },
 { id:'total100', icon:'', label:{ko:'100회 완주', en:'100 Sessions', zh:'完成100次'}, check:p => (p.totalCompletions||0) >= 100 },
 { id:'cal1000', icon:'', label:{ko:'누적 1000kcal', en:'1000 kcal Total', zh:'累计1000千卡'}, check:p => (p.totalCalories||0) >= 1000 },
 { id:'comeback', icon:'', label:{ko:'컴백', en:'Comeback', zh:'重返训练'}, check:p => (p.comebackCount||0) >= 1 },
];
