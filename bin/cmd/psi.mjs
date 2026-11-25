#!/usr/bin/env node
// PageSpeed Insights (Lighthouse lab data plus Chrome UX Report field data) for a live URL. Needs the site online and internet access.
// The field block (real visitors, 28 days) appears only when the site has enough traffic; until then the lab block is what there is.
// Scores are compared with the DS7 targets (SPEC section 4): performance, accessibility and best practices 95, SEO 100.
//   ds7 psi https://example.com/ [--strategy mobile|desktop] [--key API_KEY] [--file saved-response.json]
import fs from 'node:fs';

const args = process.argv.slice(2);
const flag = (k) => {
  const i = args.indexOf(`--${k}`);
  return i > -1 ? args[i + 1] : undefined;
};
const url = args.find((a) => /^https?:\/\//.test(a));
const strategy = flag('strategy') || 'mobile';
const TARGET = { performance: 95, accessibility: 95, 'best-practices': 95, seo: 100 };

let data;
if (flag('file')) data = JSON.parse(fs.readFileSync(flag('file'), 'utf8'));
else {
  if (!url) {
    console.error(
      'Usage: ds7 psi https://example.com/ [--strategy mobile|desktop] [--key API_KEY]',
    );
    process.exit(1);
  }
  const q = new URLSearchParams({ url, strategy });
  for (const c of ['performance', 'accessibility', 'best-practices', 'seo'])
    q.append('category', c);
  if (flag('key') || process.env.PSI_KEY) q.set('key', flag('key') || process.env.PSI_KEY);
  const res = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${q}`);
  if (!res.ok) {
    console.error(`PageSpeed Insights answered ${res.status}: ${(await res.text()).slice(0, 300)}`);
    process.exit(1);
  }
  data = await res.json();
}

const lh = data.lighthouseResult;
if (!lh) {
  console.error('No lighthouseResult in the response');
  process.exit(1);
}
console.log(`PageSpeed Insights, ${strategy}: ${data.id || url || flag('file')}\n`);
const failed = [];
for (const [id, cat] of Object.entries(lh.categories)) {
  const score = Math.round(cat.score * 100),
    target = TARGET[id] ?? 90;
  console.log(
    `  ${cat.title.padEnd(16)} ${String(score).padStart(3)}  (target ${target})${score < target ? '  <-- below' : ''}`,
  );
  if (score < target) failed.push(cat.title);
}
console.log('\nLab (Lighthouse)');
for (const id of [
  'first-contentful-paint',
  'largest-contentful-paint',
  'total-blocking-time',
  'cumulative-layout-shift',
  'speed-index',
]) {
  const a = lh.audits[id];
  if (a) console.log(`  ${a.title.padEnd(28)} ${a.displayValue}`);
}
const field = data.loadingExperience?.metrics;
console.log('\nField (real visitors, Chrome UX Report)');
if (!field) console.log('  no field data yet: the site has too little traffic');
else {
  const unit = {
    LARGEST_CONTENTFUL_PAINT_MS: (v) => `${(v / 1000).toFixed(2)} s`,
    INTERACTION_TO_NEXT_PAINT: (v) => `${v} ms`,
    CUMULATIVE_LAYOUT_SHIFT_SCORE: (v) => (v / 100).toFixed(2),
    FIRST_CONTENTFUL_PAINT_MS: (v) => `${(v / 1000).toFixed(2)} s`,
  };
  for (const [k, m] of Object.entries(field))
    console.log(`  ${k.padEnd(32)} ${(unit[k] || String)(m.percentile)}  ${m.category}`);
  console.log(`  overall: ${data.loadingExperience.overall_category}`);
}
const weak = Object.values(lh.audits)
  .filter(
    (a) =>
      a.score !== null &&
      a.score < 0.9 &&
      !['notApplicable', 'informative', 'manual'].includes(a.scoreDisplayMode),
  )
  .sort((a, b) => a.score - b.score)
  .slice(0, 10);
if (weak.length) {
  console.log('\nWhat to look at first');
  for (const a of weak) console.log(`  ${a.title}${a.displayValue ? ` (${a.displayValue})` : ''}`);
}
process.exit(failed.length ? 1 : 0);
