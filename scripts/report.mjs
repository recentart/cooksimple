// Quick content report: recipes without a nutrition estimate, label summary.
import { loadAll } from './lib/recipes.mjs';
const { recipes } = loadAll({ illustrations: false });
const since = process.argv[2] || '';
for (const r of recipes.filter((x) => x.added >= since)) {
  const n = r.nutrition;
  const flag = n.missing ? `NO NUTRITION (${n.missing.join(', ')})` : `${n.kcal} kcal ${n.protein}p ${n.carbs}c ${n.fat}f`;
  console.log(`${r.id.padEnd(36)} ${String(r.totalMinutes).padStart(4)}m  ${flag}  [${r.labels.join(' ')}]`);
}
console.log(`${recipes.length} recipes total`);
