# Advertising

CookSimple can show **one slim Adsterra banner below each recipe**. It is built
and tested but **off** until you paste your Adsterra banner codes into
`site.config.json`. The site's advantage is a clean cooking experience, so the
ad fits around the recipe, never in front of it.

Adsterra was picked because it is the fastest to start: instant sign-up, no
minimum traffic, sites usually approved within minutes to a day, and it accepts
a `workers.dev` address (Google AdSense needs your own domain).

## Turning ads on

1. Sign up at <https://adsterra.com> as a **Publisher** and add the site
   `https://cooksimple.freewebtoolss.workers.dev`.
2. Create two **Banner** ad units: **728×90** and **320×50**. Use banners only;
   never Popunder, Social Bar, Direct Link or Native/interstitial formats.
3. Each unit's code ends with a line like
   `<script src="https://bauval.org/22/0123456789abcdef0123456789abcdef"></script>`
   (older codes look like `//www.highperformanceformat.com/<key>/invoke.js`).
   Copy just the `src` address into `site.config.json`:

   ```json
   "ads": {
     "network": "adsterra",
     "banners": {
       "728x90": "https://bauval.org/22/0123…",
       "320x50": "https://bauval.org/22/4567…"
     }
   }
   ```

4. `npm run build`, `npm test`, commit, `npx wrangler deploy`.

A mistyped code stops the build with a clear error instead of shipping a broken
slot. A screen too narrow for every configured size shows no ad (a 728×90 is never squeezed onto a phone), so add the 320×50 unit to earn on phones.

## How it works

- Recipe pages get a labelled "Advertisement" box after the recipe and its
  notes, before "More to cook": **320×50 on phones, 728×90 from 768 px wide**.
  The box size is reserved in CSS, so nothing on the page moves.
- `src/client/recipe-page.js` puts a sandboxed `<iframe>` in the box pointing at
  `/ad/728x90` or `/ad/320x50`. The build writes those small pages; each holds
  one Adsterra banner snippet (one per page, because the snippet uses a global
  `atOptions` variable).
- The ad code runs only inside that frame, never in the recipe page itself: the
  site's pages still load no third-party scripts, and the only change to their
  security policy is `frame-src 'self'`. Adsterra's script reads
  `document.cookie` on load and crashes in an opaque-origin sandbox (tested
  2026-10-03), so the frame is sandboxed **with** `allow-same-origin`. The
  sandbox still blocks top-page navigation, forms and downloads, but the ad code
  could reach the site's own storage, like any normally embedded ad.
- `/ad/*` gets its own policy in `_headers` (sandbox, may only be framed by this
  site) and is skipped by the service worker.
- The About page's privacy and advertising text switch to describe the ads.

If ads stay blank, check that your network isn't blocking the ad host: some DNS
services and ad blockers do (Ashton's home network blocks `bauval.org`). Test on
mobile data or another network.

## Never

- Cover or split the ingredients or the instructions.
- Appear in Cook Mode or on the print view.
- Autoplay video or sound.
- Use pop-unders, pop-ups, interstitials, sticky overlays or social-bar units.
- Look like site buttons or content.
