// Recipe card markup, shared by the build and by the search pages in the
// browser so a card looks identical wherever it appears.

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

export function minutes(total) {
  if (total < 60) return `${total} min`;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return m ? `${h} hr ${m} min` : `${h} hr`;
}

export function servingsText(r, n = r.servings) {
  if (!r.servingsLabel || r.servingsLabel === 'servings') return `${n} ${n === 1 ? 'serving' : 'servings'}`;
  return `${n} ${n === 1 ? r.servingsLabelOne : r.servingsLabel}`;
}

const MEAL = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', dessert: 'Dessert', snack: 'Snack', side: 'Side dish' };

/** Up to three short labels, most useful first. */
export function cardTags(r) {
  const tags = [];
  if (r.quick) tags.push('Quick');
  if (r.diets.includes('vegan')) tags.push('Vegan');
  else if (r.diets.includes('vegetarian')) tags.push('Vegetarian');
  if (r.tags.includes('one-pan')) tags.push('One-pan');
  if (r.tags.includes('make-ahead') && tags.length < 3) tags.push('Make-ahead');
  if (tags.length < 3) tags.push(MEAL[r.mealTypes[0]]);
  return tags.slice(0, 3);
}

/**
 * r: { id, title, description, totalMinutes, servings, servingsLabel, servingsLabelOne, quick, diets, tags, mealTypes }
 * opts: { heading: 'h2' | 'h3', eager, extra: html string appended to the body }
 */
export function cardHTML(r, { heading = 'h3', eager = false, extra = '' } = {}) {
  return `<article class="card">
  <div class="card-img"><img src="/images/recipes/${esc(r.id)}.svg" width="400" height="300" alt="" ${eager ? '' : 'loading="lazy" '}decoding="async"></div>
  <div class="card-body">
    <${heading} class="card-title"><a href="/recipes/${esc(r.id)}/">${esc(r.title)}</a></${heading}>
    <p class="card-meta"><span>${esc(minutes(r.totalMinutes))}</span><span aria-hidden="true"> · </span><span>${esc(servingsText(r))}</span></p>
    <p class="card-desc">${esc(r.description)}</p>
    <ul class="card-tags" aria-label="Tags">${cardTags(r).map((t) => `<li>${esc(t)}</li>`).join('')}</ul>${extra}
  </div>
</article>`;
}
