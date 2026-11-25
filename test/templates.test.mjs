// Starter templates: the delivery rules of 03-performance-web-vitals/DELIVERY-AND-CACHING.md hold in the files `init` and projects copy.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { root } from './helpers.mjs';

const tpl = (name) => fs.readFileSync(path.join(root, 'templates', name), 'utf8');

test('Dockerfile builds only with generate and has no fallback build', () => {
  const s = tpl('Dockerfile');
  assert.match(s, /RUN npm run generate && test -f \.output\/public\/index\.html/);
  assert.doesNotMatch(s, /\|\|/);
});

test('Dockerfile serves the build with the DS7 nginx configuration', () => {
  assert.match(
    tpl('Dockerfile'),
    /COPY ds7\/templates\/nginx\.conf \/etc\/nginx\/conf\.d\/default\.conf/,
  );
});

test('nuxt.config pre-compresses the output and stops on prerender errors', () => {
  const s = tpl('nuxt.config.ts');
  assert.match(s, /compressPublicAssets: \{ brotli: true, gzip: true \}/);
  assert.match(s, /failOnError: true/);
});

test('nuxt.config uses features.inlineStyles, not the removed experimental option', () => {
  const s = tpl('nuxt.config.ts');
  assert.match(s, /features: \{\s*inlineStyles:/);
  assert.doesNotMatch(s, /inlineSSRStyles/);
});

test('nginx.conf serves pre-compressed files, the 404 page and immutable build files', () => {
  const s = tpl('nginx.conf');
  assert.match(s, /gzip_static on;/);
  assert.match(s, /error_page 404 \/404\.html;/);
  assert.match(s, /~\^\/_nuxt\/\s+"public, max-age=31536000, immutable"/);
  assert.match(s, /~\\\.html\$\s+"public, max-age=0, must-revalidate"/);
});

test('nginx.conf and Caddyfile set the baseline security headers', () => {
  for (const name of ['nginx.conf', 'Caddyfile']) {
    const s = tpl(name);
    for (const h of [
      'X-Content-Type-Options',
      'Referrer-Policy',
      'Permissions-Policy',
      'X-Frame-Options',
    ])
      assert.match(s, new RegExp(h), `${name} lacks ${h}`);
  }
});

test('Caddyfile serves pre-compressed files and the 404 page', () => {
  const s = tpl('Caddyfile');
  assert.match(s, /precompressed br gzip/);
  assert.match(
    s,
    /@notfound expression \{err\.status_code\} == 404\s*handle @notfound \{[\s\S]*?rewrite \* \/404\.html/,
  );
  assert.doesNotMatch(
    s,
    /handle_errors \d/,
    'status arguments need Caddy 2.8; keep the matcher form',
  );
});

test('Caddyfile treats paths without an extension as pages and gives the 404 page the security headers', () => {
  const s = tpl('Caddyfile');
  assert.match(
    s,
    /@page not path \/_nuxt\/\*[^\n]*\n\s*header @page Cache-Control "public, max-age=0, must-revalidate"/,
  );
  assert.match(s, /handle @notfound \{\s*import ds7_security/);
});

test('Caddyfile keeps hashed build files immutable: the other cache matchers exclude /_nuxt/', () => {
  const s = tpl('Caddyfile');
  for (const name of ['media', 'files'])
    assert.match(
      s,
      new RegExp(`@${name} \\{[^}]*not path /_nuxt/\\*`),
      `@${name} must exclude /_nuxt/`,
    );
});
