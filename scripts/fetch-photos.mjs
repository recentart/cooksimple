// Finds a freely licensed photo of each dish on Wikimedia Commons and saves
// it to src/photos/<id>.jpg, with its credit in data/photos.json.
//   node scripts/fetch-photos.mjs            fetch photos for recipes that have none
//   node scripts/fetch-photos.mjs <id> ...   (re)fetch just these recipes
//
// Only CC0, public-domain, CC BY and CC BY-SA files are used, and each page
// credits the author and licence. Every chosen photo is checked by eye; a
// wrong or poor match goes in REJECT (by file name) and gets re-fetched, and
// a recipe with no good photo goes in NONE and keeps just its illustration.

import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './lib/recipes.mjs';

const API = 'https://commons.wikimedia.org/w/api.php';
const UA = 'CookSimple/1.0 (https://github.com/recentart/cooksimple; photo credits for a recipe site)';
const WIDTH = 960; // a standard Wikimedia thumbnail step; odd widths are refused

// Search terms where the recipe title isn't what the dish is called on Commons.
const QUERIES = {
  'baked-chicken-wings': 'chicken wings', 'baked-falafel': 'falafel', 'baked-sweet-potato-fries': 'sweet potato fries',
  'basil-pesto-pasta': 'pasta pesto', 'berry-banana-smoothie': 'berry smoothie', 'black-bean-burgers': 'black bean burger',
  'blt-sandwiches': 'BLT sandwich', 'brown-butter-gnocchi': 'gnocchi sage butter', 'buffalo-cauliflower-bites': 'buffalo cauliflower',
  'butter-shortbread': 'shortbread', 'caramel-flan': 'flan caramel', 'chicken-and-shrimp-paella': 'paella',
  'chicken-salad-sandwiches': 'chicken salad sandwich', 'chicken-shawarma': 'chicken shawarma plate', 'chicken-tinga-tacos': 'tinga de pollo',
  'chicken-vegetable-stir-fry': 'chicken stir fry', chilaquiles: 'chilaquiles', 'chocolate-mousse': 'chocolate mousse',
  'chunky-guacamole': 'guacamole', 'cilantro-lime-rice': 'cilantro rice', 'classic-apple-pie': 'apple pie',
  'classic-beef-chili': 'chili con carne', 'classic-cheeseburgers': 'cheeseburger', 'classic-crepes': 'crêpes',
  'classic-deviled-eggs': 'deviled eggs', 'classic-lasagna': 'lasagna', 'classic-meatloaf': 'meatloaf',
  'classic-pot-roast': 'pot roast', 'classic-potato-salad': 'potato salad', 'cold-soba-noodle-salad': 'soba noodle salad',
  'cranberry-orange-scones': 'scones', 'creamy-coleslaw': 'coleslaw', 'creamy-mashed-potatoes': 'mashed potatoes',
  'crispy-rice-treats': 'rice krispie treats', 'crispy-roasted-chickpeas': 'roasted chickpeas', 'crispy-tofu-stir-fry': 'tofu stir fry',
  'cucumber-tzatziki': 'tzatziki', 'easy-tiramisu': 'tiramisu', 'egg-salad-sandwiches': 'egg salad sandwich',
  'fish-tacos': 'fish tacos', 'fluffy-quinoa': 'cooked quinoa', 'fresh-spring-rolls': 'gỏi cuốn',
  'garlicky-sauteed-spinach': 'sautéed spinach', 'greek-chicken-souvlaki': 'souvlaki', 'grilled-cheese-sandwiches': 'grilled cheese sandwich',
  'honey-roasted-carrots': 'roasted carrots', 'honey-soy-glazed-salmon': 'glazed salmon', 'italian-pasta-salad': 'pasta salad',
  'jerk-chicken': 'jerk chicken', 'juicy-baked-chicken-breasts': 'baked chicken breast', 'lemon-baked-cod': 'baked cod',
  'lentil-salad': 'lentil salad', 'lentil-shepherds-pie': 'shepherd’s pie', 'maple-nut-granola': 'granola',
  'mexican-rice': 'Mexican rice', 'mexican-street-corn': 'elote', 'miso-soup': 'miso soup',
  'new-york-cheesecake': 'New York cheesecake', 'no-bake-energy-bites': 'energy balls', 'oatmeal-raisin-cookies': 'oatmeal raisin cookies',
  'one-bowl-chocolate-cake': 'chocolate cake', 'oven-pulled-pork': 'pulled pork', 'pan-seared-pork-chops': 'pork chop',
  'pan-seared-steak': 'steak', 'perfect-white-rice': 'steamed white rice', 'philly-cheesesteaks': 'cheesesteak',
  'pork-tenderloin-with-apples': 'pork tenderloin', 'quick-miso-ramen': 'miso ramen', 'rice-congee': 'congee',
  'roasted-broccoli': 'roasted broccoli', 'roasted-brussels-sprouts': 'roasted Brussels sprouts', 'roasted-cauliflower': 'roasted cauliflower',
  'roasted-sweet-potatoes': 'roasted sweet potatoes', 'roasted-vegetable-couscous': 'couscous vegetables', 'salmon-cakes': 'salmon cakes',
  'sausage-egg-breakfast-sandwiches': 'breakfast sandwich English muffin', 'shrimp-scampi': 'shrimp scampi', 'silky-hummus': 'hummus',
  'simple-green-salad': 'green salad', 'simple-roast-chicken': 'roast chicken', 'skillet-cornbread': 'cornbread',
  'smashed-cucumber-salad': 'cucumber salad', 'soft-dinner-rolls': 'dinner rolls', 'soft-scrambled-eggs': 'scrambled eggs',
  'spinach-artichoke-dip': 'spinach artichoke dip', 'spinach-feta-egg-bites': 'egg muffins', 'spinach-ricotta-stuffed-shells': 'stuffed shells pasta',
  'stovetop-mac-and-cheese': 'macaroni and cheese', 'stovetop-popcorn': 'popcorn bowl', 'stuffed-bell-peppers': 'stuffed peppers',
  'stuffed-portobello-mushrooms': 'stuffed mushrooms', 'sweet-potato-black-bean-tacos': 'vegetarian tacos', 'tadka-dal': 'dal tadka',
  'tofu-banh-mi': 'bánh mì', 'tofu-scramble': 'tofu scramble', 'tomato-bruschetta': 'bruschetta',
  'tuna-noodle-casserole': 'tuna casserole', 'tuna-salad-sandwiches': 'tuna sandwich', 'turkish-eggs': 'çılbır',
  'tuscan-white-bean-skillet': 'white beans tomato', 'vanilla-cupcakes': 'cupcakes', 'vanilla-panna-cotta': 'panna cotta',
  'vanilla-pudding': 'vanilla pudding', 'vegetable-barley-soup': 'barley soup', 'vegetable-fried-rice': 'fried rice',
  'vegetable-frittata': 'frittata', 'vegetable-lo-mein': 'lo mein', 'white-bean-kale-soup': 'white bean soup',
  'avocado-toast-with-eggs': 'avocado toast egg', 'breakfast-potato-hash': 'potato hash egg', 'butternut-squash-soup': 'butternut squash soup',
  'chicken-noodle-soup': 'chicken noodle soup', 'garlic-butter-shrimp': 'garlic shrimp', 'three-bean-chili': 'bean chili',
  'lemon-garlic-chicken-thighs': 'roasted chicken thighs', 'one-pan-chicken-and-rice': 'chicken and rice', 'sheet-pan-salmon-and-green-beans': 'salmon green beans',
  'weeknight-beef-tacos': 'ground beef tacos', 'crispy-roasted-potatoes': 'roasted potatoes', 'tomato-basil-soup': 'tomato soup',
  'red-lentil-soup': 'red lentil soup', 'chickpea-salad-sandwiches': 'chickpea salad sandwich', 'black-bean-quesadillas': 'quesadilla',
  'peanut-sesame-noodles': 'sesame noodles', 'spaghetti-aglio-e-olio': 'spaghetti aglio e olio', 'one-pot-tomato-spinach-pasta': 'pasta tomato spinach',
  'classic-pancakes': 'pancakes stack', 'overnight-oats': 'overnight oats', 'banana-oat-muffins': 'banana muffins',
  'chocolate-chip-cookies': 'chocolate chip cookies', 'fudgy-brownies': 'brownies', 'stovetop-rice-pudding': 'rice pudding',
  'coconut-chickpea-curry': 'chickpea curry', 'dutch-baby': 'Dutch baby pancake', 'buttermilk-waffles': 'waffles',
  'buttermilk-biscuits': 'buttermilk biscuits', 'baked-oatmeal': 'baked oatmeal', 'pasta-e-fagioli': 'pasta e fagioli',
  'beef-and-bean-burritos': 'burrito', 'breakfast-burritos': 'breakfast burrito', 'cheese-omelet': 'omelette',
  'honey-garlic-chicken': 'honey garlic chicken', 'thai-red-curry-shrimp': 'Thai red curry shrimp', 'chicken-caesar-salad': 'chicken Caesar salad',
  'italian-wedding-soup': 'Italian wedding soup', 'potato-leek-soup': 'potato leek soup', 'corn-chowder': 'corn chowder',
  'french-onion-soup': 'French onion soup', 'egg-drop-soup': 'egg drop soup', 'chicken-tortilla-soup': 'tortilla soup',
  'black-bean-soup': 'black bean soup', 'beef-stew': 'beef stew', 'chicken-and-dumplings': 'chicken and dumplings',
  'mushroom-stroganoff': 'mushroom stroganoff', 'mushroom-risotto': 'mushroom risotto', 'butter-chicken': 'butter chicken',
  'shrimp-and-grits': 'shrimp and grits', 'shrimp-pad-thai': 'pad thai', 'kung-pao-chicken': 'kung pao chicken',
  'orange-chicken': 'orange chicken', 'teriyaki-chicken': 'chicken teriyaki', 'beef-bulgogi': 'bulgogi',
  'carne-asada': 'carne asada', 'pork-carnitas': 'carnitas', 'sausage-and-peppers': 'sausage and peppers',
  'fish-and-chips': 'fish and chips', 'mango-sticky-rice': 'mango sticky rice', 'peach-cobbler': 'peach cobbler',
  'carrot-cake': 'carrot cake', 'lemon-bars': 'lemon bars', 'pumpkin-pie': 'pumpkin pie', 'strawberry-shortcake': 'strawberry shortcake',
  'peanut-butter-cookies': 'peanut butter cookies', snickerdoodles: 'snickerdoodle', 'baba-ganoush': 'baba ghanoush',
  'pico-de-gallo': 'pico de gallo', 'cottage-pie': 'cottage pie', 'chicken-pot-pie': 'chicken pot pie',
  'eggplant-parmesan': 'eggplant parmesan', 'chicken-parmesan': 'chicken parmigiana', 'margherita-pizza': 'pizza Margherita',
};

// File names checked by eye and rejected (wrong dish, poor photo, people, text...).
const REJECT = new Set([
  "Fresh baked apple crisp 02.jpg",
  "Baba ghanoush prep.jpg",
  "Baking oatmeal chocolate chip cookies 76.jpg",
  "Banana bread slices.jpg",
  "Pasta Pesto, Dec 2025.jpg",
  "Korean.cuisine-Bulgogi-01.jpg",
  "Heuchera 'Berry Smoothie'.JPG",
  "Fancy Veggie Burger and Fries - Joe's Burger House 2024-07-07.jpg",
  "At New York City 2023 150.jpg",
  "Waffle batter in the waffle iron in Kłóbka, Włocławek County, Kuyavian-Pomeranian Voivodeship, Poland, August 2022.jpg",
  "WD Q656071 carrot cake encased at WCNA 2018 jeh.jpg",
  "Chicken Shawarma (94298).jpg",
  "Chicken fried rice - Stir Fry by CK 2023-12-02.jpg",
  "Piadina Sandwich Breakfast with Salad and Tomatoes.jpg",
  "Apple Chocolate Mousse Pavlos way--) IMG 0444 (5468866047).jpg",
  "Cilantro Lemon Grass Rice (30567531577).jpg",
  "Chili con carne 50 A.jpg",
  "Homemade meatloaf 04.jpg",
  "Stacked Like Pancakes Mercury Lounge 05.jpg",
  "Spinach-Chickpea Curry (3117324894).jpg",
  "Dish of pelau, coleslaw, cassava pone, and a mac and cheese pie.jpg",
  "Kellogg's Rice Krispie Treat (37168997861).jpg",
  "Roasted Chickpea.jpg",
  "Gungoguma (roasted sweet potatoes) 2.jpg",
  "Black pepper tofu fried udon - Stir Fry by CK.jpg",
  "French Onion Soup..JPG",
  "Brownies with Ice cream.jpg",
  "DSCF0412 Seared salmon fillet topped with sautéed shrimp served with creamed spinach and a side salad.jpg",
  "Red Lion and Sun, Highgate, London (5560981816).jpg",
  "Meatballs for Italian wedding soup - November 2024 - Sarah Stierch.jpg",
  "Homemade Japchae, Dhaka 03.jpg",
  "2026-09-16 17 00 54 The baked chicken portion of a Stouffer's Baked Chicken meal (tender chicken breast with gravy and mashed potatoes) in Ewing Township, Mercer County, New Jersey.jpg",
  "Rice topped with Kung Pao Chicken at Beixinqiao (20221101114219).jpg",
  "Baked cod fillet.jpg",
  "Lemon Milk Candy Bar.jpg",
  "Granola b.JPG",
  "Mushroom Risotto (4789415965).jpg",
  "Baked Mushroom Stroganoff Spud with Squash (3612329429).jpg",
  "Energy Balls (Unsplash).jpg",
  "Tomahawk Pork Chop from Netherlands.jpg",
  "Peanut butter cookies, 2015-07-12.jpg",
  "Taiwanese food Cold Peanut Noodles, Sesame Noodles, white Paocai.jpg",
  "White steamed red bean rice pudding 2.jpg",
  "Pork tenderloin sandwich.JPG",
  "Pumpkin Pie.jpg",
  "Roasted Brussels sprouts (49931073552).jpg",
  "(20240728) Rotterdam V11 Salmon & Crab Cakes with buffalo sauce.jpg",
  "Breakfast muffin - Green Kitchen.jpg",
  "Rice, beans and Salmon Fish.jpg",
  "Thai-Pad-Thai 2023-06-04.jpg",
  "Homemade hummus and pita 03.jpg",
  "Roasted chicken leg piece-MB20.jpg",
  "Snickerdoodles close-up.jpg",
  "McD-Egg-McMuffin.jpg",
  "2018-05-23 19 05 06 Jumbo pasta shells stuffed with cheese and bread in Ewing Township, Mercer County, New Jersey.jpg",
  "02023 1271 Rice puddings.jpg",
  "Stuffed red peppers, dark rye bread, Rostov-on-Don, Russia.jpg",
  "Vegetarian tacos at Cabuche.jpg",
  "Chicken teriyaki, Fried chicken, Krasnoyarsk, Russia.jpg",
  "0131Lee Kum Kee Chili Bean Sauce (Toban Djan) 02.jpg",
  "Tuna casserole.JPG",
  "01Stewed fried milkfish with yardlong beans, taro, and white radish in guava, tomato and lemon grass broth 05.jpg",
  "Spring Mini Cupcakes Publix Bakery.jpg",
]);
// Recipes with no suitable free photo: they keep just the illustration.
const NONE = new Set([
  "baked-oatmeal", "brown-butter-gnocchi", "chickpea-salad-sandwiches",
  "sheet-pan-salmon-and-green-beans", "teriyaki-chicken", "spinach-feta-egg-bites",
  "berry-banana-smoothie", "buttermilk-waffles", "banana-oat-muffins", "classic-meatloaf",
  "classic-pancakes", "crispy-roasted-chickpeas", "french-onion-soup", "fudgy-brownies", "japchae",
  "juicy-baked-chicken-breasts", "lemon-bars", "mushroom-stroganoff", "no-bake-energy-bites",
  "pan-seared-pork-chops", "perfect-white-rice", "salmon-cakes", "shrimp-pad-thai",
  "spinach-ricotta-stuffed-shells", "stovetop-rice-pudding", "three-bean-chili",
  "tuna-noodle-casserole", "tuscan-white-bean-skillet", "vanilla-cupcakes",
]);

const LICENCE_OK = /^(cc0|public domain|pd|cc by(-sa)? [0-9.]+( [a-z-]+)?)$/i;
const BAD_TITLE = /\b(logo|menu|signs?|map|labels?|packag\w*|box|cans?|advert\w*|restaurant|shop|store|market|stall|festival|poster|diagram|screenshot|stamp|drawing|illustration|painting|book|cover|ingredients|raw|uncooked|factory|plant|field|farm|harvest|prep|preparation|preparing|batter|dough|baking|making|encased|process)\b/i;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const strip = (h) => String(h || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

// fetch with retries: Commons connections sometimes time out.
async function get(url) {
  for (let i = 0; i < 5; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30000) });
      if (res.ok) return res;
    } catch {}
    await sleep(3000 * (i + 1));
  }
  return null;
}

async function candidates(query) {
  const params = {
    action: 'query', generator: 'search', gsrsearch: `${query} filetype:bitmap`, gsrnamespace: '6', gsrlimit: '30',
    prop: 'imageinfo', iiprop: 'url|size|mime|extmetadata', iiurlwidth: String(WIDTH), format: 'json', formatversion: '2', origin: '*',
  };
  const res = await get(`${API}?${new URLSearchParams(params)}`);
  if (!res) throw new Error(`Commons API failed for "${query}"`);
  const data = await res.json();
  const pages = (data.query?.pages || []).sort((a, b) => a.index - b.index);
  const out = [];
  for (const p of pages) {
    const ii = p.imageinfo?.[0];
    if (!ii || ii.mime !== 'image/jpeg') continue;
    const m = ii.extmetadata || {};
    const licence = strip(m.LicenseShortName?.value);
    const author = strip(m.Artist?.value).replace(/^User:/, '');
    const title = p.title.replace(/^File:/, '');
    if (!LICENCE_OK.test(licence) || !author || author.length > 80) continue;
    if (BAD_TITLE.test(title) || REJECT.has(title)) continue;
    if (ii.width < 1200 || !ii.thumburl) continue;
    const ratio = ii.thumbwidth / ii.thumbheight;
    if (ratio < 1.2 || ratio > 1.8) continue;
    const pd = /public domain|^pd$/i.test(licence);
    const cc0 = /cc0/i.test(licence);
    out.push({
      title, thumb: ii.thumburl.split('?')[0].replace('//thumb.wikimedia.org/', '//upload.wikimedia.org/'), width: ii.thumbwidth, height: ii.thumbheight,
      author, license: pd ? 'Public domain' : licence.replace(/^cc/i, 'CC'),
      licenseUrl: m.LicenseUrl?.value || (cc0 ? 'https://creativecommons.org/publicdomain/zero/1.0/' : ii.descriptionurl),
      sourceUrl: ii.descriptionurl,
    });
  }
  return out;
}

const recipes = readdirSync(join(ROOT, 'recipes')).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(readFileSync(join(ROOT, 'recipes', f), 'utf8')));
const photosFile = join(ROOT, 'data', 'photos.json');
const photos = existsSync(photosFile) ? JSON.parse(readFileSync(photosFile, 'utf8')) : {};
const dir = join(ROOT, 'src', 'photos');
mkdirSync(dir, { recursive: true });
const save = () => writeFileSync(photosFile, `${JSON.stringify(Object.fromEntries(Object.keys(photos).sort().map((k) => [k, photos[k]])), null, 2)}\n`);

const only = process.argv.slice(2);
const todo = recipes.filter((r) => (only.length ? only.includes(r.id) : !photos[r.id]) && !NONE.has(r.id));
for (const id of NONE) if (photos[id]) { delete photos[id]; rmSync(join(dir, `${id}.jpg`), { force: true }); }

for (const r of todo) {
  const query = QUERIES[r.id] || r.title;
  // Prefer files whose name contains every word of the search.
  const words = query.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/[^a-z0-9]+/).filter((w) => w.length > 2 && w !== 'and');
  const named = (c) => { const t = c.title.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); return words.every((w) => t.includes(w.replace(/s$/, ''))); };
  const list = await candidates(query);
  const pick = list.find(named) || list[0];
  await sleep(200);
  if (!pick) { console.log(`- ${r.id}: no candidate for "${query}"`); continue; }
  const res = await get(pick.thumb);
  if (!res) { console.log(`- ${r.id}: download failed ${pick.thumb}`); continue; }
  writeFileSync(join(dir, `${r.id}.jpg`), Buffer.from(await res.arrayBuffer()));
  const alt = query.charAt(0).toUpperCase() + query.slice(1);
  photos[r.id] = { file: pick.title, width: pick.width, height: pick.height, alt, author: pick.author, license: pick.license, licenseUrl: pick.licenseUrl, sourceUrl: pick.sourceUrl };
  save();
  console.log(`+ ${r.id}: ${pick.title} (${pick.license}, ${pick.author})`);
  await sleep(200);
}

save();
console.log(`${Object.keys(photos).length} photos listed in data/photos.json`);
