# Advertising

CookSimple can show **one slim Google AdSense banner below each recipe**. It is
built and tested but **off** until you add your AdSense IDs. The site's advantage
is a clean cooking experience, so ads fit around the recipe, never in front of it.

## Turning ads on

1. Sign up at <https://adsense.google.com> with the site URL and wait for approval.
2. In AdSense, create a **Display ad** unit (fixed size is fine) and copy its
   **ad unit ID** (the `data-ad-slot` number). Your **publisher ID** looks like
   `ca-pub-1234567890123456`.
3. In AdSense → **Privacy & messaging**, publish the **European regulations**
   (GDPR) consent message. Google shows it to visitors in the EU, UK and
   Switzerland; no extra code is needed on the site.
4. Edit `site.config.json`:

   ```json
   "ads": { "enabled": true, "client": "ca-pub-1234567890123456", "slots": { "below-recipe": "1234567890" } }
   ```

5. `npm run build`, `npm test`, commit, `npx wrangler deploy`.

The build then adds the slot and AdSense's script to recipe pages only, writes
`/ads.txt`, widens the Content Security Policy to Google's ad origins, and
switches the About page's privacy and advertising text to describe the ads.
A half-filled config (enabled but no valid IDs) stops the build with a clear
error instead of shipping a broken slot. After deploying, open a recipe page
with the browser console open and check for "Refused to load" CSP messages;
if Google adds a new origin, add it to the `G` list in `scripts/build.mjs`.

## Size and placement

| Position | Where | Size |
| --- | --- | --- |
| `below-recipe` | Recipe page, after the recipe and its notes, before "More to cook" | 320×100 on phones, 728×90 from 768 px wide |
| `home-between-sections` | Home page between recipe rows (supported, not used) | same |

The box has a fixed size in CSS, so its space is reserved before the ad loads
and nothing on the page moves. It is labelled "Advertisement". If Google has no
ad to show, the slot hides itself. It never appears in the print view.

## Never

- Cover or split the ingredients or the instructions.
- Appear in Cook Mode or on the print view.
- Autoplay video or sound.
- Use pop-ups, interstitials, sticky overlays, anchor or vignette ads (turn
  **Auto ads off** in AdSense so Google doesn't add its own).
- Look like site buttons or content.
