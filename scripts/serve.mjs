// Minimal static server for local testing of public/ (no dependencies).
// Mirrors Cloudflare's behaviour closely enough: /path serves /path/index.html,
// /path redirects to /path/, unknown paths get 404.html, and the _headers
// rules for "/*" are applied.
//   node scripts/serve.mjs [port]

import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname, normalize } from 'node:path';
import { ROOT } from './lib/recipes.mjs';

const PUBLIC = join(ROOT, 'public');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8' };

function globalHeaders() {
  const file = join(PUBLIC, '_headers');
  if (!existsSync(file)) return {};
  const out = {};
  let inGlobal = false;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    if (/^\S/.test(line) && !line.startsWith('#')) inGlobal = line.trim() === '/*';
    else if (inGlobal && /^\s+\S+:/.test(line)) {
      const [k, ...v] = line.trim().split(':');
      out[k] = v.join(':').trim();
    }
  }
  return out;
}

export function startServer(port = 8787) {
  const headers = globalHeaders();
  const server = createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    let path = decodeURIComponent(url.pathname);
    let file = normalize(join(PUBLIC, path));
    if (!file.startsWith(PUBLIC)) {
      res.writeHead(400).end();
      return;
    }
    if (existsSync(file) && statSync(file).isDirectory()) {
      if (!path.endsWith('/')) {
        res.writeHead(307, { Location: `${path}/${url.search}` }).end();
        return;
      }
      file = join(file, 'index.html');
    }
    let status = 200;
    if (!existsSync(file) || path.includes('/_headers')) {
      file = join(PUBLIC, '404.html');
      status = 404;
    }
    res.writeHead(status, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store', ...headers });
    res.end(readFileSync(file));
  });
  return new Promise((resolve) => server.listen(port, () => resolve(server)));
}

if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('scripts/serve.mjs')) {
  const port = Number(process.argv[2]) || 8787;
  startServer(port).then(() => console.log(`Serving public/ at http://localhost:${port}/`));
}
