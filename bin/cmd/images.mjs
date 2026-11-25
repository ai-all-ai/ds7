#!/usr/bin/env node
// `ds7 images`: the image pipeline of public/. Settings: "images" in ds7.config.json (CONFIG.md).
//   ds7 images [--check]                       responsive WebP variants (name-400.webp ...) of the large pictures and their manifest
//   ds7 images optimize [--dry|--check|--adopt] re-encode each WebP once at images.optimize.quality, recorded so it never runs twice
//   ds7 images strip [--check|--verify] [DIR…] remove hidden metadata (C2PA, EXIF, XMP, text chunks, comments); WebP in public/
//                                              gets a small XMP block with a title and keywords from the file name
//   ds7 images dupes                           pictures used twice: identical files, and near copies by a perceptual hash
// strip needs nothing; the other modes need sharp from the project (npm i -D sharp).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { loadConfig } from '../lib/config.mjs';
import { requireOptional, optional } from '../lib/optional.mjs';
import { imageSize } from '../lib/image-size.mjs';
import { walk } from '../lib/cli.mjs';

const cfg = loadConfig().images;
const argv = process.argv.slice(2);
const mode = ['optimize', 'strip', 'dupes'].includes(argv[0]) ? argv[0] : 'variants';
const has = (f) => argv.includes(`--${f}`);
const VARIANT = /-(\d{2,4})\.webp$/;
const posix = (f) => f.split(path.sep).join('/');
const urlOf = (f) => '/' + posix(path.relative(cfg.publicDir, f));
const kb = (n) => `${Math.round(n / 1024)} kB`;

// ---- variants
async function variants() {
  const sharp = requireOptional('sharp', 'ds7 images');
  const check = has('check');
  const sources = walk(cfg.dir).filter((f) => /\.(webp|jpe?g|png)$/i.test(f) && !VARIANT.test(f));
  const manifest = {};
  const stale = [];
  let built = 0;
  for (const file of sources) {
    const meta = await sharp(file).metadata();
    if (!meta.width || meta.width < cfg.minWidth) continue;
    const stem = path.join(path.dirname(file), path.basename(file).replace(/\.\w+$/, ''));
    const made = [];
    for (const w of cfg.widths) {
      if (w >= meta.width) continue;
      const out = `${stem}-${w}.webp`;
      made.push(w);
      if (fs.existsSync(out) && fs.statSync(out).mtimeMs >= fs.statSync(file).mtimeMs) continue;
      if (check) stale.push(out);
      else {
        await sharp(file)
          .resize({ width: w, withoutEnlargement: true })
          .webp({ quality: cfg.quality })
          .toFile(out);
        built++;
      }
    }
    if (made.length) manifest[urlOf(file)] = made;
  }
  if (check) {
    console.log(
      stale.length
        ? `images: ${stale.length} variant(s) missing or older than their picture`
        : 'images: every variant is up to date',
    );
    for (const f of stale.slice(0, 20)) console.log(`  ${posix(f)}`);
    process.exit(stale.length ? 1 : 0);
  }
  if (cfg.manifest && Object.keys(manifest).length) {
    fs.mkdirSync(path.dirname(cfg.manifest), { recursive: true });
    fs.writeFileSync(cfg.manifest, JSON.stringify(manifest, null, 2) + '\n');
  }
  console.log(
    `images: ${built} variant(s) written${cfg.manifest ? `, manifest ${cfg.manifest}` : ''}`,
  );
}

// ---- optimize: the record keeps the size of the picture data (VP8, VP8L, ALPH chunks), so metadata changes do not matter
function webpChunks(buf) {
  const out = [];
  for (let i = 12; i + 8 <= buf.length; ) {
    const size = buf.readUInt32LE(i + 4);
    out.push({ type: buf.toString('latin1', i, i + 4), data: buf.subarray(i + 8, i + 8 + size) });
    i += 8 + size + (size & 1);
  }
  return out;
}
const payload = (buf) =>
  webpChunks(buf)
    .filter((c) => ['VP8 ', 'VP8L', 'ALPH'].includes(c.type))
    .reduce((a, c) => a + c.data.length, 0);

async function optimize() {
  const o = cfg.optimize;
  const files = walk(cfg.dir)
    .filter((f) => /\.webp$/i.test(f) && !VARIANT.test(f))
    .sort();
  const record =
    !has('adopt') && fs.existsSync(o.record) ? JSON.parse(fs.readFileSync(o.record, 'utf8')) : {};
  const save = () => {
    fs.mkdirSync(path.dirname(o.record), { recursive: true });
    fs.writeFileSync(
      o.record,
      JSON.stringify(Object.fromEntries(Object.entries(record).sort()), null, 0) + '\n',
    );
  };
  const done = (f) => record[urlOf(f)] === payload(fs.readFileSync(f));
  if (has('check')) {
    const open = files.filter((f) => fs.statSync(f).size > o.checkOverKB * 1024 && !done(f));
    console.log(
      `images optimize: ${files.length} picture(s), ${open.length} over ${o.checkOverKB} kB not optimised`,
    );
    for (const f of open.slice(0, 20)) console.log(`  ${posix(f)}`);
    if (open.length) console.log('Run: ds7 images optimize');
    process.exit(open.length ? 1 : 0);
  }
  if (has('adopt')) {
    for (const f of files) record[urlOf(f)] = payload(fs.readFileSync(f));
    save();
    console.log(`images optimize: ${files.length} picture(s) recorded as already optimised`);
    return;
  }
  const sharp = requireOptional('sharp', 'ds7 images optimize');
  const dry = has('dry');
  // PSNR of the colour over the visible pixels: above ~38 dB the eye sees no difference
  const psnr = async (a, b) => {
    const [x, y] = await Promise.all([a, b].map((s) => sharp(s).ensureAlpha().raw().toBuffer()));
    let sum = 0;
    let n = 0;
    for (let i = 0; i < x.length; i += 4) {
      if (x[i + 3] < 8) continue;
      for (let c = 0; c < 3; c++) sum += (x[i + c] - y[i + c]) ** 2;
      n += 3;
    }
    return n ? 10 * Math.log10((255 * 255) / (sum / n || 1e-9)) : 99;
  };
  let before = 0;
  let after = 0;
  let changed = 0;
  const low = [];
  for (const file of files) {
    const src = fs.readFileSync(file);
    before += src.length;
    if (record[urlOf(file)] === payload(src)) {
      after += src.length;
      continue;
    }
    const out = await sharp(src)
      .webp({ quality: o.quality, alphaQuality: o.alphaQuality, effort: 6, smartSubsample: true })
      .toBuffer();
    if (out.length > src.length * (1 - o.minSaving)) {
      after += src.length;
      if (!dry) record[urlOf(file)] = payload(src);
      continue;
    }
    const db = await psnr(src, out);
    if (db < o.minPsnr) low.push(`${posix(file)} ${db.toFixed(1)} dB`);
    after += out.length;
    changed++;
    if (!dry) {
      fs.writeFileSync(file, out);
      record[urlOf(file)] = payload(out);
    }
    console.log(
      `  ${kb(src.length).padStart(8)} -> ${kb(out.length).padStart(8)}  ${db.toFixed(1)} dB  ${posix(file)}`,
    );
  }
  if (!dry) save();
  console.log(
    `images optimize${dry ? ' (dry run)' : ''}: ${changed} picture(s) rewritten, ${kb(before)} -> ${kb(after)}`,
  );
  if (low.length)
    console.log(`Look at these by eye (PSNR under ${o.minPsnr} dB):\n  ${low.join('\n  ')}`);
}

// ---- strip
const humanize = (file) => {
  const stem = path
    .basename(file)
    .replace(/\.\w+$/, '')
    .replace(/-\d{2,4}$/, '')
    .replace(/^\d+[-_]/, '');
  const text = stem.replace(/[-_]+/g, ' ').trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
};
const xmlEsc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const xmp = (title) => {
  const stop = new Set(cfg.strip.stopwords);
  const words = [
    ...new Set(
      title
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 2 && !stop.has(w)),
    ),
  ];
  const t = xmlEsc(title);
  const kw = words.map((k) => `<rdf:li>${xmlEsc(k)}</rdf:li>`).join('');
  return Buffer.from(
    `<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?><x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title><rdf:Alt><rdf:li xml:lang="x-default">${t}</rdf:li></rdf:Alt></dc:title><dc:description><rdf:Alt><rdf:li xml:lang="x-default">${t}</rdf:li></rdf:Alt></dc:description><dc:subject><rdf:Bag>${kw}</rdf:Bag></dc:subject></rdf:Description></rdf:RDF></x:xmpmeta><?xpacket end="w"?>`,
    'utf8',
  );
};
const chunk = (type, data) => {
  const head = Buffer.alloc(8);
  head.write(type, 0, 'latin1');
  head.writeUInt32LE(data.length, 4);
  return Buffer.concat([head, data, Buffer.alloc(data.length & 1)]);
};
function cleanWebp(file, buf, wantXmp) {
  const chunks = webpChunks(buf).filter((c) => !['EXIF', 'XMP ', 'C2PA'].includes(c.type));
  let vp8x = chunks.find((c) => c.type === 'VP8X');
  if (!vp8x && wantXmp) {
    const size = imageSize(buf);
    if (!size) throw new Error('size unknown');
    const vp8l = chunks.find((c) => c.type === 'VP8L');
    const data = Buffer.alloc(10);
    data[0] = vp8l && vp8l.data[4] & 0x10 ? 0x10 : 0; // alpha flag of a lossless picture
    data.writeUIntLE(size.width - 1, 4, 3);
    data.writeUIntLE(size.height - 1, 7, 3);
    vp8x = { type: 'VP8X', data };
    chunks.unshift(vp8x);
  }
  if (vp8x) {
    vp8x.data = Buffer.from(vp8x.data);
    vp8x.data[0] = (vp8x.data[0] & ~0x0c) | (wantXmp ? 0x04 : 0); // EXIF and XMP flags
  }
  if (wantXmp) chunks.push({ type: 'XMP ', data: xmp(humanize(file)) });
  const body = Buffer.concat(chunks.map((c) => chunk(c.type, c.data)));
  const riff = Buffer.alloc(12);
  riff.write('RIFF', 0, 'latin1');
  riff.writeUInt32LE(body.length + 4, 4);
  riff.write('WEBP', 8, 'latin1');
  return Buffer.concat([riff, body]);
}
function cleanPng(buf) {
  const drop = new Set(['caBX', 'tEXt', 'iTXt', 'zTXt', 'eXIf']);
  const parts = [buf.subarray(0, 8)];
  for (let i = 8; i + 12 <= buf.length; ) {
    const size = buf.readUInt32BE(i);
    if (!drop.has(buf.toString('latin1', i + 4, i + 8))) parts.push(buf.subarray(i, i + 12 + size));
    i += 12 + size;
  }
  return Buffer.concat(parts);
}
// JPEG: keep JFIF (APP0), ICC (APP2) and the image; drop EXIF, XMP, IPTC (APP1, APP13 ...) and comments
function cleanJpeg(buf) {
  const parts = [buf.subarray(0, 2)];
  let i = 2;
  while (i + 4 <= buf.length && buf[i] === 0xff) {
    const marker = buf[i + 1];
    if (marker === 0xda) break;
    const size = buf.readUInt16BE(i + 2);
    const app = (marker >= 0xe1 && marker <= 0xef && marker !== 0xe2) || marker === 0xfe;
    if (!app) parts.push(buf.subarray(i, i + 2 + size));
    i += 2 + size;
  }
  parts.push(buf.subarray(i));
  return Buffer.concat(parts);
}
const cleanSvg = (text) =>
  text
    .replace(/<metadata[\s\S]*?<\/metadata>\s*/gi, '')
    .replace(/\sxmlns:c2pa="[^"]*"/gi, '')
    .replace(
      /<!--[\s\S]*?(generator|created with|adobe|inkscape|sketch|figma|c2pa)[\s\S]*?-->\s*/gi,
      '',
    );

async function strip() {
  const dirs = argv.slice(1).filter((a) => !a.startsWith('--'));
  if (!dirs.length) dirs.push(...cfg.strip.dirs);
  const check = has('check');
  const sharp = has('verify') ? requireOptional('sharp', 'ds7 images strip --verify') : null;
  const pixels = async (b) =>
    crypto
      .createHash('sha1')
      .update(await sharp(b).ensureAlpha().raw().toBuffer())
      .digest('hex');
  const pub = path.resolve(cfg.publicDir) + path.sep;
  let changed = 0;
  const dirty = [];
  for (const file of dirs.flatMap((d) => walk(d))) {
    const ext = path.extname(file).toLowerCase();
    if (!['.webp', '.png', '.jpg', '.jpeg', '.svg'].includes(ext)) continue;
    const buf = fs.readFileSync(file);
    let next;
    try {
      if (ext === '.webp')
        next = cleanWebp(file, buf, cfg.strip.xmp && path.resolve(file).startsWith(pub));
      else if (ext === '.svg') next = Buffer.from(cleanSvg(buf.toString('utf8')), 'utf8');
      else if (ext === '.png') next = cleanPng(buf);
      else next = cleanJpeg(buf);
    } catch (e) {
      console.log(`  skipped ${posix(file)}: ${e.message}`);
      continue;
    }
    if (next.equals(buf)) continue;
    if (check) {
      dirty.push(posix(file));
      continue;
    }
    if (sharp && ext !== '.svg' && (await pixels(buf)) !== (await pixels(next))) {
      console.log(`  pixels would change, left as is: ${posix(file)}`);
      continue;
    }
    fs.writeFileSync(`${file}.tmp`, next);
    fs.renameSync(`${file}.tmp`, file);
    changed++;
  }
  if (check) {
    console.log(
      dirty.length
        ? `images strip: ${dirty.length} file(s) carry hidden metadata`
        : 'images strip: no hidden metadata',
    );
    for (const f of dirty.slice(0, 20)) console.log(`  ${f}`);
    if (dirty.length) console.log('Run: ds7 images strip');
    process.exit(dirty.length ? 1 : 0);
  }
  console.log(`images strip: ${changed} file(s) cleaned in ${dirs.join(', ')}`);
}

// ---- dupes: the same picture used twice (an owner rule: each photo once). dHash: 9x8 greyscale, one bit per neighbour pair
async function dupes() {
  const sharp = optional('sharp');
  const files = walk(cfg.dir)
    .filter((f) => /\.(webp|jpe?g|png|avif)$/i.test(f) && !VARIANT.test(f))
    .sort();
  const groups = [];
  const bySha = new Map();
  for (const f of files) {
    const h = crypto.createHash('sha1').update(fs.readFileSync(f)).digest('hex');
    bySha.set(h, [...(bySha.get(h) ?? []), f]);
  }
  for (const same of bySha.values()) if (same.length > 1) groups.push(['identical', same]);
  if (sharp) {
    const hashes = [];
    for (const f of files) {
      try {
        const px = await sharp(f).greyscale().resize(9, 8, { fit: 'fill' }).raw().toBuffer();
        let bits = 0n;
        for (let y = 0; y < 8; y++)
          for (let x = 0; x < 8; x++)
            bits = (bits << 1n) | (px[y * 9 + x] > px[y * 9 + x + 1] ? 1n : 0n);
        // a flat picture (one colour, a plain cut-out) has almost no edges: its hash says nothing
        const ones = [...bits.toString(2)].filter((c) => c === '1').length;
        if (ones >= 4 && ones <= 60) hashes.push([f, bits]);
      } catch {
        /* not a picture sharp reads */
      }
    }
    const dist = (a, b) => [...(a ^ b).toString(2)].filter((c) => c === '1').length;
    const seen = new Set();
    for (let i = 0; i < hashes.length; i++)
      for (let j = i + 1; j < hashes.length; j++) {
        const d = dist(hashes[i][1], hashes[j][1]);
        const key = [hashes[i][0], hashes[j][0]].join('|');
        const sameFile = [...bySha.values()].some(
          (g) => g.includes(hashes[i][0]) && g.includes(hashes[j][0]),
        );
        if (d <= cfg.dupes.distance && !sameFile && !seen.has(key)) {
          seen.add(key);
          groups.push([`near copy (distance ${d})`, [hashes[i][0], hashes[j][0]]]);
        }
      }
  }
  console.log(
    groups.length
      ? `images dupes: ${groups.length} group(s) of the same picture`
      : `images dupes: ${files.length} picture(s), no duplicates`,
  );
  for (const [kind, list] of groups) console.log(`  ${kind}: ${list.map(posix).join(', ')}`);
  if (!sharp)
    console.log('Only identical files were compared; near copies need sharp: npm i -D sharp');
  process.exit(groups.length ? 1 : 0);
}

if (cfg.off) {
  console.log('images: off (images is false in ds7.config.json)');
  process.exit(0);
}
if (mode === 'variants') await variants();
else if (mode === 'optimize') await optimize();
else if (mode === 'strip') await strip();
else await dupes();
