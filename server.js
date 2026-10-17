/*
 * Steadfast local development server.
 *
 * A tiny, dependency-free static file server. Unlike `python -m http.server`,
 * it sends `Cache-Control: no-store` so the browser never serves a stale
 * app.js / styles.css during development. This is a DEV-ONLY server; a real
 * production host can and should cache fingerprinted assets normally.
 */

import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)));
const PORT = Number(process.env.PORT) || 4173;

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
};

const server = http.createServer(async (req, res) => {
  try {
    // Strip query string (e.g. the ?v= cache-busting param) and decode.
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    const relPath = normalize(urlPath === '/' ? '/index.html' : urlPath);

    // Prevent directory traversal: resolved path must stay inside ROOT.
    const filePath = join(ROOT, relPath);
    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403).end('Forbidden');
      return;
    }

    const body = await readFile(filePath);
    const type = CONTENT_TYPES[extname(filePath).toLowerCase()] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': type,
      // Dev-only: always revalidate so edits show up immediately.
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    });
    res.end(body);
  } catch (err) {
    if (err && err.code === 'ENOENT') {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found');
    } else {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Server error');
    }
  }
});

server.listen(PORT, () => {
  console.log(`Steadfast dev server running at http://localhost:${PORT}/ (no-store caching)`);
});
