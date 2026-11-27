// Local dev addresses: every site gets its own name (`velo.es` gives `velo.localhost`) and a port of its own from the
// series 3010, 3020, 3030, ... Ports 3000, 4000 and 4500 are never used: other tools open them by default.
import net from 'node:net';

export const FIRST = 3010;
export const STEP = 10;
const LAST = 9990;
export const RESERVED = [3000, 4000, 4500];

// The host label from the package name: no scope, a domain loses its zone (`velo.es` → `velo`), then a DNS-safe slug
export function devName(pkgName) {
  let name = String(pkgName || '')
    .split('/')
    .pop();
  if (/^[^.\s]+(\.[a-z]{2,})+$/i.test(name)) name = name.split('.')[0];
  return (
    name
      .normalize('NFKD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+/, '')
      .slice(0, 63)
      .replace(/-+$/, '') || 'project'
  );
}

export const devUrl = (name, port) => `http://${name}.localhost:${port}`;

export const validPort = (p) =>
  Number.isInteger(p) && p >= 1 && p <= 65535 && !RESERVED.includes(p);

// Whether nothing listens on the port of the loopback address
export function isFree(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const srv = net.createServer();
    srv.once('error', () => resolve(false));
    srv.once('listening', () => srv.close(() => resolve(true)));
    srv.listen(port, host);
  });
}

// The first free port of the series after `after` (or from its start), skipping the reserved ones
export async function freePort(after = FIRST - STEP) {
  let p = Math.max(FIRST, FIRST + Math.floor((after - FIRST) / STEP + 1) * STEP);
  for (; p <= LAST; p += STEP) {
    if (!RESERVED.includes(p) && (await isFree(p))) return p;
  }
  return null;
}
