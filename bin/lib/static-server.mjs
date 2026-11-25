// A static file server over the generated site and the list of its public routes, shared by the browser checks (console-check, lab-check).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.txt': 'text/plain',
  '.xml': 'application/xml',
  '.mp3': 'audio/mpeg',
};

export async function serve(dir) {
  const server = http.createServer((rq, rs) => {
    const url = decodeURIComponent(rq.url.split('?')[0]);
    let f = path.join(dir, url);
    if (!f.startsWith(dir)) {
      rs.writeHead(403);
      return rs.end();
    }
    if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
    if (!fs.existsSync(f)) {
      rs.writeHead(404, { 'content-type': 'text/html' });
      return rs.end('404');
    }
    rs.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(rs);
  });
  await new Promise((r) => server.listen(0, r));
  return { base: `http://localhost:${server.address().port}`, close: () => server.close() };
}

// Public routes of the build ("/", "/about/"), without the pages isInternal accepts (see internalRoutes in config.mjs).
export function routesOf(dir, isInternal = () => false) {
  const list = [];
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.name.startsWith('_')) continue;
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name === 'index.html') list.push('/' + path.relative(dir, d).replace(/\\/g, '/'));
    }
  };
  walk(dir);
  return list
    .map((r) => (r === '/.' || r === '/' ? '/' : r + '/'))
    .filter((r) => !isInternal(r))
    .sort();
}
