// Shared ending of the checking commands (layout, docs, audit html/seo/a11y/perf): the baseline of known findings and the --json output.
//  - `ds7-baseline.json` in the project root lists findings accepted for now, per command. Findings listed there are shown as "known" and do not fail the command; any other finding fails.
//    A finding is identified by rule, place (without a line number) and text, so a finding whose text changes counts as new.
//  - `--update-baseline` writes the findings of this run as the new baseline of this command; `--no-baseline` ignores the file for one run.
//  - `--json` prints one JSON object instead of text: command, summary, problems (new), known, fixed, findings, notes.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './project.mjs';

export const BASELINE_FILE = 'ds7-baseline.json';
const argv = process.argv.slice(2);
export const wants = {
  json: argv.includes('--json'),
  update: argv.includes('--update-baseline'),
  ignoreBaseline: argv.includes('--no-baseline'),
};

export const keyOf = (f) => `${f.rule} | ${String(f.where).replace(/:\d+$/, '')} | ${f.detail}`;

function readBaseline() {
  const file = path.join(ROOT, BASELINE_FILE);
  if (!fs.existsSync(file)) return { file, data: null };
  try {
    return { file, data: JSON.parse(fs.readFileSync(file, 'utf8')) };
  } catch (e) {
    console.error(`${BASELINE_FILE} is not valid JSON: ${e.message}`);
    process.exit(1);
  }
}

// command: the name stored in the baseline ("layout", "seo", ...); cli: how the user runs it ("layout", "audit seo");
// summary(n): the first line of the text output for n new problems; show(fresh): prints the details of the new findings.
export function conclude({ command, cli = command, summary, findings, show, notes = [] }) {
  const base = readBaseline();
  if (wants.update) {
    const data = base.data ?? {
      note: 'Findings accepted for now. Fix them and run the command with --update-baseline to drop them; new findings still fail.',
    };
    const keys = [...new Set(findings.map(keyOf))].sort();
    if (keys.length) data[command] = keys;
    else delete data[command];
    fs.writeFileSync(base.file, JSON.stringify(data, null, 2) + '\n');
    console.log(`${command}: baseline updated, ${keys.length} known findings in ${BASELINE_FILE}`);
    process.exit(0);
  }
  const known = new Set(wants.ignoreBaseline || !base.data ? [] : (base.data[command] ?? []));
  const fresh = [],
    accepted = [];
  for (const f of findings) (known.has(keyOf(f)) ? accepted : fresh).push(f);
  const present = new Set(findings.map(keyOf));
  const fixed = [...known].filter((k) => !present.has(k));
  const code = fresh.length ? 1 : 0;

  if (wants.json) {
    console.log(
      JSON.stringify(
        {
          command,
          summary: summary(fresh.length),
          problems: fresh.length,
          known: accepted.length,
          fixed: fixed.length,
          findings: [
            ...fresh.map((f) => ({ ...f, known: false })),
            ...accepted.map((f) => ({ ...f, known: true })),
          ],
          notes,
        },
        null,
        2,
      ),
    );
    process.exit(code);
  }
  console.log(summary(fresh.length) + (accepted.length ? ` (${accepted.length} known)` : ''));
  show(fresh);
  if (fixed.length)
    console.log(
      `\nbaseline: ${fixed.length} known finding(s) no longer occur; run \`ds7 ${cli} --update-baseline\` to drop them`,
    );
  process.exit(code);
}

// The shape every audit shares: findings grouped by rule, a few lines per rule.
export const showByRule =
  (limit, label = (rule, list) => `${rule}: ${list.length}`) =>
  (fresh) => {
    const by = fresh.reduce((a, p) => ((a[p.rule] = a[p.rule] || []).push(p), a), {});
    for (const [rule, list] of Object.entries(by).sort((a, b) => b[1].length - a[1].length)) {
      console.log(`\n${label(rule, list)}`);
      for (const i of list.slice(0, limit)) console.log(`  ${i.where}  ${i.detail}`);
      if (list.length > limit) console.log(`  ... ${list.length - limit} more`);
    }
  };
