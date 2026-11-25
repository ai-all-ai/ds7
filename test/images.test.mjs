// `ds7 images`: metadata strip and duplicate check (no dependency); variants and optimize need sharp and are tested only with it.
import test from 'node:test';
import assert from 'node:assert/strict';
import zlib from 'node:zlib';
import { createRequire } from 'node:module';
import { project, cli, put, read, edit } from './helpers.mjs';

let sharp = null;
try {
  sharp = createRequire(import.meta.url)('sharp');
} catch {
  /* optional */
}
const images = (dir, ...args) => cli(dir, ['images', ...args]);

// a 1x1 PNG, with an optional tEXt chunk (the kind of metadata generators leave)
const crc = (buf) => {
  let c = ~0;
  for (const b of buf) {
    c ^= b;
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
};
const pngChunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const sum = Buffer.alloc(4);
  sum.writeUInt32BE(crc(body));
  return Buffer.concat([len, body, sum]);
};
const png = (text, pixel = [255, 0, 0]) =>
  Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', Buffer.from([0, 0, 0, 1, 0, 0, 0, 1, 8, 2, 0, 0, 0])),
    ...(text ? [pngChunk('tEXt', Buffer.from(`Software\0${text}`, 'latin1'))] : []),
    pngChunk('IDAT', zlib.deflateSync(Buffer.from([0, ...pixel]))),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);

test('images strip --check finds hidden metadata and strip removes it, pixels untouched', (t) => {
  const dir = project(t);
  put(dir, 'public/images/photo.png', png('Made by a generator'));
  const before = images(dir, 'strip', '--check');
  assert.equal(before.status, 1);
  assert.match(before.out, /1 file\(s\) carry hidden metadata/);
  assert.equal(images(dir, 'strip').status, 0);
  assert.ok(!read(dir, 'public/images/photo.png').includes('generator'));
  assert.ok(Buffer.from(read(dir, 'public/images/photo.png'), 'latin1').includes('IDAT'));
  assert.equal(images(dir, 'strip', '--check').status, 0);
});

test('images strip drops generator comments and metadata from an SVG', (t) => {
  const dir = project(t);
  put(
    dir,
    'public/icon.svg',
    '<svg><!-- Generator: Some Editor --><metadata>x</metadata><path d="M0 0"/></svg>',
  );
  images(dir, 'strip');
  assert.equal(read(dir, 'public/icon.svg'), '<svg><path d="M0 0"/></svg>');
});

test('images dupes reports the same picture saved twice', (t) => {
  const dir = project(t);
  put(dir, 'public/images/a.png', png());
  put(dir, 'public/images/b.png', png());
  put(dir, 'public/images/c.png', png(null, [0, 0, 255]));
  const r = images(dir, 'dupes');
  assert.equal(r.status, 1);
  assert.match(r.out, /identical: public\/images\/a\.png, public\/images\/b\.png/);
  assert.doesNotMatch(r.out, /c\.png/);
});

test('images is off when images is false', (t) => {
  const dir = project(t);
  edit(dir, 'ds7.config.json', (s) => JSON.stringify({ ...JSON.parse(s), images: false }));
  assert.match(images(dir, 'dupes').out, /images: off/);
});

test('images writes the responsive variants of a large picture', { skip: !sharp }, async (t) => {
  const dir = project(t);
  const big = await sharp({ create: { width: 1000, height: 500, channels: 3, background: '#c33' } })
    .webp()
    .toBuffer();
  put(dir, 'public/images/hero.webp', big);
  assert.equal(images(dir).status, 0);
  assert.deepEqual(JSON.parse(read(dir, 'app/data/image-variants.json')), {
    '/images/hero.webp': [400, 800],
  });
  assert.equal(images(dir, '--check').status, 0);
});
