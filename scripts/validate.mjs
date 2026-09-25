// Check recipe files without building the site.
//   node scripts/validate.mjs                 all recipes
//   node scripts/validate.mjs my-recipe-id    just one (or several)
//   node scripts/validate.mjs --no-images     skip the illustration-file check
//   node scripts/validate.mjs --preview id    also print the rendered ingredients and steps

import { loadAll } from './lib/recipes.mjs';
import { ingredientParts, ingredientText } from '../src/lib/ingredient.js';
import { renderStep } from '../src/lib/tokens.js';

const args = process.argv.slice(2);
const illustrations = !args.includes('--no-images');
const preview = args.includes('--preview');
const only = args.filter((a) => !a.startsWith('--'));
const { recipes, errors, warnings } = loadAll({ illustrations, only: only.length ? only : null });

for (const w of warnings) console.log(`warning  ${w}`);
for (const e of errors) console.log(`ERROR    ${e}`);

if (preview) {
  for (const r of recipes) {
    for (const system of ['us', 'metric']) {
      for (const factor of [1, 2, 0.5]) {
        console.log(`\n== ${r.title} — ${system}, ×${factor} (${r.servings * factor} ${r.servingsLabel})`);
        for (const ing of r.ingredients) console.log(`  • ${ingredientText(ingredientParts(ing, factor, system))}`);
        if (factor === 1) r.steps.forEach((s, i) => console.log(`  ${i + 1}. ${renderStep(s.text, { factor, system, mode: 'text' })}`));
      }
    }
  }
}

console.log(`\n${recipes.length} recipe(s) checked, ${errors.length} error(s), ${warnings.length} warning(s).`);
process.exit(errors.length ? 1 : 0);
