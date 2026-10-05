// A tiny static file server (node:http) for fixture folders: the doctor smoke test and the tests.
// Binds to 127.0.0.1 on a free port; never serves outside its root.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

/**
 * Serve `root` on 127.0.0.1. Options: `routes` maps a URL path to {status, body, type, delayMs} for scripted
 * responses (slow endpoints, errors). Returns { url, port, close() }.
 */
export async function serveStatic(root, { port = 0, routes = {} } = {}) {
  const base = path.resolve(root);
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    let p = decodeURIComponent(url.pathname);
    const scripted = routes[p];
    if (scripted) {
      const send = () => {
        res.writeHead(scripted.status || 200, { 'content-type': scripted.type || 'application/json; charset=utf-8', 'cache-control': 'no-store' });
        res.end(typeof scripted.body === 'string' ? scripted.body : JSON.stringify(scripted.body ?? {}));
      };
      if (scripted.delayMs) setTimeout(send, scripted.delayMs);
      else send();
      return;
    }
    if (p.endsWith('/')) p += 'index.html';
    const file = path.resolve(base, `.${p}`);
    if (file !== base && !file.startsWith(base + path.sep)) {
      res.writeHead(403);
      res.end('forbidden');
      return;
    }
    fs.readFile(file, (err, buf) => {
      if (err) {
        res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
        res.end('not found');
        return;
      }
      res.writeHead(200, { 'content-type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store' });
      res.end(req.method === 'HEAD' ? undefined : buf);
    });
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', resolve);
  });
  const actual = server.address().port;
  return {
    url: `http://127.0.0.1:${actual}`,
    port: actual,
    close: () =>
      new Promise((resolve) => {
        server.close(() => resolve());
        if (typeof server.closeAllConnections === 'function') server.closeAllConnections();
      }),
  };
}
