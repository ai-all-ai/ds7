#!/usr/bin/env node
// `ds7 skills link`: makes the project skills in .agents/skills visible to agents that read another folder
// (Claude Code reads .claude/skills). Each skill becomes a link to its folder, so there is one copy to edit.
//   ds7 skills link [--to .claude/skills]   creates the missing links; an existing file or folder of the same name is kept
//   ds7 skills                              lists the skills and where they are linked
import fs from 'node:fs';
import path from 'node:path';
import { arg } from '../lib/cli.mjs';

const SRC = '.agents/skills';
const DEST = arg('to', '.claude/skills');
const skills = fs.existsSync(SRC)
  ? fs
      .readdirSync(SRC)
      .filter((d) => fs.existsSync(path.join(SRC, d, 'SKILL.md')))
      .sort()
  : [];
if (!skills.length) {
  console.log(`skills: no skills in ${SRC}`);
  process.exit(0);
}
if (process.argv[2] !== 'link') {
  for (const s of skills)
    console.log(`  ${s}${fs.existsSync(path.join(DEST, s)) ? `  (in ${DEST})` : ''}`);
  console.log(
    `\n${skills.length} skill(s) in ${SRC}. Link them for agents that read ${DEST}: npx ds7 skills link`,
  );
  process.exit(0);
}
fs.mkdirSync(DEST, { recursive: true });
let made = 0;
for (const s of skills) {
  const to = path.join(DEST, s);
  if (fs.existsSync(to) || fs.lstatSync(path.dirname(to)).isSymbolicLink()) {
    console.log(`  kept     ${to}`);
    continue;
  }
  const target = path.relative(DEST, path.join(SRC, s));
  try {
    fs.symlinkSync(target, to, 'dir');
  } catch {
    // Windows without the right to make links: a copy, refreshed by running the command again after deleting it
    fs.cpSync(path.join(SRC, s), to, { recursive: true });
  }
  console.log(`  linked   ${to} → ${target}`);
  made++;
}
console.log(`skills: ${made} linked, ${skills.length - made} already there`);
