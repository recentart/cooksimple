# Advertising policy (not active)

CookSimple has **no advertising** in V1. Its advantage is a clean cooking experience, so any future ads must fit around the recipe, never in front of it.

## Reserved positions

`adSlot(site, position)` in `src/templates/components.js` renders nothing while `site.config.json` has `"ads": { "enabled": false }`. The allowed positions are:

| Position | Where |
| --- | --- |
| `home-between-sections` | Home page, between recipe rows |
| `below-recipe` | Recipe page, after the recipe and its notes, before "More to cook" |
| desktop sidebar (not built yet) | Beside the recipe on wide screens only, never overlapping it |

Each slot must reserve its height in CSS before the ad loads, so nothing on the page moves.

## Never

- Cover or split the ingredients or the instructions.
- Appear in Cook Mode or on the print view.
- Autoplay video or sound.
- Use pop-ups, interstitials, sticky overlays or anything that blocks the page.
- Look like site buttons or content ("fake download buttons", disguised links).
- Load trackers beyond what the ad itself strictly needs, and never without a clear privacy notice.

Turning ads on also means widening the Content Security Policy in `scripts/build.mjs` (it currently allows only same-origin scripts) and updating the privacy section of the About page.
