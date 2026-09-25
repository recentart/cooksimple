import { html, raw, jsonScript } from './html.js';

export const LOGO = raw(
  '<svg class="logo" viewBox="0 0 32 32" width="28" height="28" aria-hidden="true" focusable="false"><circle class="logo-bg" cx="16" cy="16" r="15"/><path class="logo-fg" d="M9 17.5h14a7 7 0 0 1-14 0Z"/><path class="logo-steam" d="M12.5 13c0-1.6 1.4-1.9 1.4-3.4M16 13c0-1.6 1.4-1.9 1.4-3.4M19.5 13c0-1.6 1.4-1.9 1.4-3.4" fill="none" stroke-width="1.6" stroke-linecap="round"/></svg>',
);

/**
 * The page shell shared by every page.
 * ctx: { site, assets, headScript }
 * page: { path, title, description, image, imageAlt, ogType, jsonld[], body, script, noindex, bodyClass }
 */
export function layout(ctx, page) {
  const { site, assets } = ctx;
  const url = site.url + page.path;
  const image = page.image || `${site.url}/images/social/cooksimple.png`;
  const fullTitle = page.path === '/' ? page.title : `${page.title} | ${site.name}`;
  const nav = [
    ['/search/', 'Recipes', 'Recipes'],
    ['/what-can-i-make/', 'What can I make?', 'What can I make?'],
    ['/shopping-list/', 'Shopping list', 'List'],
  ];
  return html`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${fullTitle}</title>
<meta name="description" content="${page.description}">
<link rel="canonical" href="${url}">
${page.noindex ? html`<meta name="robots" content="noindex">` : ''}
<meta property="og:site_name" content="${site.name}">
<meta property="og:type" content="${page.ogType || 'website'}">
<meta property="og:title" content="${page.title}">
<meta property="og:description" content="${page.description}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${image}">
<meta property="og:image:alt" content="${page.imageAlt || `${site.name}: ${site.tagline}`}">
<meta property="og:locale" content="en_US">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#faf8f4" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#161513" media="(prefers-color-scheme: dark)">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/images/icons/apple-touch-icon.png">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="stylesheet" href="${assets}/styles/site.css">
<script>${raw(ctx.headScript)}</script>
<script type="module" src="${assets}/client/${page.script || 'home.js'}"></script>
${(page.jsonld || []).map((d) => html`<script type="application/ld+json">${jsonScript(d)}</script>\n`)}
</head>
<body${page.bodyClass ? html` class="${page.bodyClass}"` : ''}>
<a class="skip-link" href="#main">Skip to content</a>
<header class="site-header">
  <div class="wrap header-row">
    <a class="brand" href="/">${LOGO}<span>${site.name}</span></a>
    <nav class="main-nav" aria-label="Main">
      <ul>
        ${nav.map(([href, long, short]) => html`<li><a href="${href}"${page.path === href ? raw(' aria-current="page"') : ''}><span class="nav-long">${long}</span><span class="nav-short" aria-hidden="true">${short}</span>${href === '/shopping-list/' ? raw('<span class="nav-count" data-list-count hidden></span>') : ''}</a></li>`)}
      </ul>
    </nav>
  </div>
</header>
<main id="main" tabindex="-1">
${page.body}
</main>
<footer class="site-footer">
  <div class="wrap footer-row">
    <p class="footer-brand">${LOGO}<span><strong>${site.name}</strong> · ${site.tagline}</span></p>
    <ul class="footer-links">
      <li><a href="/recipes/">All recipes</a></li>
      <li><a href="/about/">About</a></li>
      <li><a href="/about/#privacy">Privacy</a></li>
      <li><a href="/about/#conversions">How conversions work</a></li>
    </ul>
    <p class="footer-note">No accounts, no tracking, no pop-ups. Everything you save stays in your browser.</p>
  </div>
</footer>
<div class="toast" role="status" aria-live="polite" hidden></div>
</body>
</html>
`;
}
