import { EXERCISES } from './exercises.js';
import { MUSCLE_GROUPS } from './muscle-groups.js';

export const AI_GOAL_POOLS = {
  full: EXERCISES.map(e=>e.key),
  strength: [
    ...(MUSCLE_GROUPS.find(g=>g.id==='lower')||{keys:[]}).keys,
    ...(MUSCLE_GROUPS.find(g=>g.id==='upper')||{keys:[]}).keys,
  ],
  core: (MUSCLE_GROUPS.find(g=>g.id==='core')||{keys:[]}).keys,
  diet: EXERCISES.filter(e => (e.met || 0) >= 6.0).map(e=>e.key), // 다이어트: 칼로리 소모가 큰 고강도 유산소 위주
};
