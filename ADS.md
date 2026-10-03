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
3. Each unit's code contains a line like
   `<script src="//www.highperformanceformat.com/0123456789abcdef0123456789abcdef/invoke.js"></script>`.
   Copy just the `src` address into `site.config.json`:

   ```json
   "ads": {
     "network": "adsterra",
     "banners": {
       "728x90": "//www.highperformanceformat.com/0123…/invoke.js",
       "320x50": "//www.highperformanceformat.com/4567…/invoke.js"
     }
   }
   ```

4. `npm run build`, `npm test`, commit, `npx wrangler deploy`.

A mistyped code stops the build with a clear error instead of shipping a broken
slot. With one size filled in, that size is used on every screen.

## How it works

- Recipe pages get a labelled "Advertisement" box after the recipe and its
  notes, before "More to cook": **320×50 on phones, 728×90 from 768 px wide**.
  The box size is reserved in CSS, so nothing on the page moves.
- `src/client/recipe-page.js` puts a sandboxed `<iframe>` in the box pointing at
  `/ad/728x90` or `/ad/320x50`. The build writes those small pages; each holds
  one Adsterra banner snippet (one per page, because the snippet uses a global
  `atOptions` variable).
- The frames are sandboxed without `allow-same-origin`, so the ad code can't
  read the page, local storage (saved recipes, notes, meal plan, shopping list)
  or cookies. The site's own pages still load no third-party scripts at all; the
  only change to their security policy is `frame-src 'self'`.
- `/ad/*` gets its own policy in `_headers` (sandbox, may only be framed by this
  site) and is skipped by the service worker.
- The About page's privacy and advertising text switch to describe the ads.

If real ads stay blank after switching on, check the browser console inside the
ad frame first: some ad code expects cookies or storage, which the sandbox blocks.

## Never

- Cover or split the ingredients or the instructions.
- Appear in Cook Mode or on the print view.
- Autoplay video or sound.
- Use pop-unders, pop-ups, interstitials, sticky overlays or social-bar units.
- Look like site buttons or content.
