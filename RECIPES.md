# Adding a recipe

Each recipe is one JSON file in `recipes/`, named after its id
(`recipes/chicken-fried-rice.json`). There is no CMS and no database:
add the file, run the checks, build, commit.

```bash
node scripts/validate.mjs chicken-fried-rice --preview   # check one recipe and print it at 1×, 2×, ½×, US and metric
npm run build                                            # validate everything and regenerate public/
npm test                                                 # unit + build tests
```

`recipes/lemon-garlic-chicken-thighs.json` is a complete example that uses
every common feature. Copy it as a starting point.

## Content rules

- **Only original or properly licensed recipes.** Never copy a recipe's
  description, method, notes or photos from a website, book or video. Write the
  method in your own words from your own cooking knowledge. Ingredient lists are
  facts, but the wording around them is not.
- A licensed recipe needs `source.type: "licensed"` plus title, author, url,
  license and licenseUrl. The recipe page shows the attribution.
- No life stories. The description is one or two plain sentences saying what
  the dish is.
- Diet labels (`vegetarian`, `vegan`) are checked against the ingredient
  vocabulary: the build fails if a labelled recipe uses meat, fish, dairy, eggs,
  honey or animal-rennet cheese (Parmesan). Use the key
  `vegetarian hard cheese` in vegetarian recipes. Make no health or nutrition claims.
- Food safety: give internal temperatures for meat and fish
  (chicken 165°F minimum, ground beef 160°F, pork 145°F, fish 145°F or the
  texture cue), and cooling/storage times that follow normal guidance.

## Recipe fields

| Field | Required | Notes |
| --- | --- | --- |
| `id` | yes | Lowercase slug, same as the file name. It becomes the URL `/recipes/<id>/`. |
| `title` | yes | Up to 70 characters. Unique. |
| `description` | yes | 50–160 characters. Used on cards and as the meta description. Unique. |
| `added` | yes | Date the recipe was added, `YYYY-MM-DD`. Drives "Recently added". |
| `servings` | yes | Whole number the ingredient amounts are written for. |
| `servingsLabel` | no | Plural noun when the recipe makes pieces rather than servings: `"cookies"`, `"muffins"`, `"pancakes"`. Default `"servings"`. |
| `scaleOptions` | no | Serving buttons. Default `[2, 4, 6, 8, 10]` plus the base for servings, or ½×, 1×, 2×, 3× for pieces. Must include `servings`. |
| `scaleNote` | no | Shown when the reader scales. Use it for pan sizes and anything else that changes with batch size. |
| `prepMinutes`, `cookMinutes` | yes | Whole minutes. Be honest: include chopping. |
| `totalMinutes` | no | Only when there is extra time (resting, chilling, soaking). Must be at least prep + cook. |
| `cuisine` | yes | One of: American, Mexican, Tex-Mex, Italian, Chinese, Chinese-American, Indian, Middle Eastern, Mediterranean, North African, Thai, Japanese, Korean, French, Greek, British, Global. |
| `mealTypes` | yes | One or more of: breakfast, lunch, dinner, dessert, snack, side. |
| `diets` | yes | `[]`, `["vegetarian"]` or `["vegan"]` (vegan implies vegetarian). |
| `tags` | yes | Any of: `one-pan` (everything cooks in one pan, pot or sheet pan), `make-ahead`, `no-cook`, `freezer-friendly`, `baking`. "Quick" is worked out from the total time (30 minutes or less). |
| `featured` | no | `true` puts the recipe in the home page's hand-picked "Popular recipes" row. |
| `equipment` | no | Short strings, e.g. `"12-inch oven-safe skillet"`, `"{len 9x13 in} baking dish"`. |
| `image` | yes | `{ "file": "<id>.svg", "alt": "..." }`. The file lives in `src/illustrations/`. For a licensed photo add `credit`, `license`, `licenseUrl`. |
| `source` | yes | `{ "type": "original" }` or a licensed source (see above). |
| `ingredients` | yes | List of ingredients, or of groups `{ "group": "For the sauce", "items": [ ... ] }`. |
| `steps` | yes | List of `{ "text": "...", "uses": ["ingredient-id", ...] }`. |
| `notes` | no | List of short strings: substitutions, storage, make-ahead. |

## Ingredient fields

```json
{ "id": "flour", "amount": "2 1/4", "unit": "cup", "item": "all-purpose flour", "key": "all-purpose flour", "prep": "spooned and leveled" }
```

| Field | Notes |
| --- | --- |
| `id` | Short slug, unique in the recipe. Needed when a step lists it in `uses`. |
| `amount` | `"2"`, `"1.5"`, `"1/2"`, `"1 1/2"`, or a range `"2-3"`. Leave it out only for `"scale": "taste"`. |
| `unit` | One of `tsp tbsp cup floz pint quart gallon ml l oz lb g kg` (measured) or `clove can jar package pinch dash slice sprig bunch stalk head piece handful block fillet sheet ear stick` (counted). Leave it out for whole items ("2 eggs", "1 onion"). Weight is `oz`; liquid volume is `floz`. |
| `item` | What it is, as the reader should see it: `"yellow onion"`, `"boneless, skinless chicken thighs"`. For unit-less counted items use the singular (`"yellow onion"`); the plural is added automatically, or give `plural` for irregular words. |
| `key` | The matching entry in `data/ingredients.json`. It drives the shopping list, "What can I make?" and the diet checks. Add a new vocabulary entry if nothing fits. |
| `prep` | `"finely chopped"`. No leading comma. |
| `note` | `"or 1/2 tsp dried"`. No parentheses. |
| `size` | Package size for counted units: `"size": "15 oz"` renders `1 (15 oz) can`. It never scales but does convert to grams. |
| `optional` | `true` for garnishes and extras. |
| `scale` | How the amount reacts to the serving scaler (below). |
| `scaleNote` | Required with `"scale": "fixed"`: why it does not scale. |
| `gramsPerCup` | Weight of 1 US cup, only if it differs from the vocabulary entry. |

### Scaling rules (`scale`)

- `linear` (default): multiplied by the serving ratio.
- `fixed`: never changes. Only when there is a clear reason, stated in
  `scaleNote`: water for boiling pasta, oil to coat a pan, a single bay leaf.
- `whole`: counted things that cannot be split (eggs). Rounded to a whole
  number, with the exact value shown next to it.
- `taste`: no amount ("Kosher salt, to taste").

Temperatures and cook times never scale. Anything that changes with batch size
(pan size, bake time) goes in the recipe `scaleNote`.

### Units, volume and weight

- The site converts US ↔ metric exactly (1 cup = 236.59 mL, 1 oz = 28.35 g).
- Volume becomes weight only when the vocabulary entry (or the ingredient) has
  `gramsPerCup`. Flour, sugars, butter, oats, cocoa and chocolate chips have it.
  Don't add a density for anything that isn't commonly weighed.
- Tiny volumes stay in spoons in metric mode, with mL alongside.

## Tokens in step text

Steps, notes, `prep` and `note` can contain tokens that follow the reader's
unit and serving choices:

| Token | US | Metric | Notes |
| --- | --- | --- | --- |
| `{temp 425F oven}` | 425°F | 220°C | Oven temperatures appear in the recipe summary and round to 5°C. |
| `{temp 165F internal}` | 165°F | 74°C | Doneness temperatures round to 1°. Also `oil`, `water`, or no kind. |
| `{time 5 min}` | 5 minutes | | Adds a "Start 5:00 timer" button. |
| `{time 20-25 min}` | 20–25 minutes | | The timer uses the low end, so the reader checks early. |
| `{time 1 hr 30 min}` | 1 hour 30 minutes | | |
| `{time 8 hr notimer}` | 8 hours | | No timer button (overnight, marinating). |
| `{qty 1 cup}` | 1 cup | 237 mL | Scales with servings. `{qty 1 tbsp fixed}` does not. |
| `{count 12}` | 12 | 12 | A plain number that scales ("shape into {count 12} balls"). Avoid it before a singular noun. |
| `{len 1 in}` | 1-inch | 2.5 cm | Also `{len 9x13 in}`. |

Every time a step says how long something takes, use a `{time}` token so the
reader gets a timer. Keep each step to one or two actions (Cook Mode shows one
step at a time, in large type); roughly 200–350 characters is a good size.
Give a visual or texture cue alongside every time ("until golden, 8–10 minutes").

## Ingredient vocabulary (`data/ingredients.json`)

```json
"canned chickpeas": { "aisle": "pantry", "family": ["chickpea"], "syn": ["chickpeas", "garbanzo beans"] }
```

- `aisle`: produce, meat-seafood, dairy-eggs, bakery, pantry, baking, spices, frozen, other.
- `one`: singular form, for counted items ("yellow onion").
- `family`: broader names someone might type in "What can I make?", only when
  the ingredient could stand in for them (chicken thighs → "chicken").
- `syn`: other names for exactly this ingredient.
- `pantry: true`: basic staples (salt, pepper, oil, flour, sugar, water).
- `contains`: meat, fish, dairy, egg, honey, rennet. Used by the diet checks.
- `varies`: flags that depend on the brand, with a note shown to readers
  (flour tortillas may contain lard).
- `gramsPerCup`: only for ingredients that are commonly weighed.
- `shop: false`: never goes on a shopping list (water).
