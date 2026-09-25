// Split a JSON array of recipes into recipes/<id>.json files, formatted the
// way the hand-written ones are (one ingredient / step per line).
//   node scripts/import-batch.mjs batch.json [--force]

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './lib/recipes.mjs';

const [file, flag] = process.argv.slice(2);
const list = JSON.parse(readFileSync(file, 'utf8'));
const j = (v) => JSON.stringify(v);

function format(r) {
  const lines = ['{'];
  const keys = Object.keys(r);
  keys.forEach((k, i) => {
    const comma = i < keys.length - 1 ? ',' : '';
    const v = r[k];
    if (k === 'ingredients') {
      lines.push('  "ingredients": [');
      v.forEach((ing, n) => {
        const c = n < v.length - 1 ? ',' : '';
        if (ing.group) {
          lines.push(`    { "group": ${j(ing.group)}, "items": [`);
          ing.items.forEach((it, m) => lines.push(`      ${j(it)}${m < ing.items.length - 1 ? ',' : ''}`));
          lines.push(`    ] }${c}`);
        } else lines.push(`    ${j(ing)}${c}`);
      });
      lines.push(`  ]${comma}`);
    } else if (k === 'steps' || k === 'notes') {
      lines.push(`  ${j(k)}: [`);
      v.forEach((x, n) => lines.push(`    ${j(x)}${n < v.length - 1 ? ',' : ''}`));
      lines.push(`  ]${comma}`);
    } else lines.push(`  ${j(k)}: ${j(v)}${comma}`);
  });
  lines.push('}');
  return lines.join('\n').replace(/":(\S)/g, '": $1').replace(/,"/g, ', "') + '\n';
}

let n = 0;
for (const r of list) {
  const out = join(ROOT, 'recipes', `${r.id}.json`);
  if (existsSync(out) && flag !== '--force') {
    console.log(`skip (exists): ${r.id}`);
    continue;
  }
  writeFileSync(out, format(r));
  n++;
}
console.log(`wrote ${n} recipe file(s)`);
