// Integration test: pack DS7, install it into an empty project together with
// @ai.all/aiall, then run the real CLIs. Set AIALL_TARBALL to test a local
// AI-ALL build; otherwise the registry version pinned in package.json is used.
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { version } = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const exec = (cmd, args, cwd) => {
  const r = spawnSync(cmd, args, { cwd, encoding: 'utf8' });
  assert.equal(r.status, 0, `${cmd} ${args.join(' ')} failed:\n${r.stdout}\n${r.stderr}`);
  return r.stdout;
};

test('DS7 installs as the ds7 pack of AI-ALL and stays consistent across update', () => {
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'ds7-integration-'));
  try {
    const packDir = path.join(work, 'pack');
    const project = path.join(work, 'project');
    fs.mkdirSync(packDir);
    fs.mkdirSync(project);

    // 1. Pack DS7 and install it with AI-ALL into an empty project.
    const [{ filename }] = JSON.parse(
      exec('npm', ['pack', '--json', '--pack-destination', packDir], root),
    );
    const extra = process.env.AIALL_TARBALL ? [process.env.AIALL_TARBALL] : [];
    exec('npm', ['init', '-y'], project);
    exec(
      'npm',
      ['install', '--no-audit', '--no-fund', path.join(packDir, filename), ...extra],
      project,
    );

    const ds7 = path.join(project, 'node_modules', '@ai.all', 'ds7', 'bin', 'ds7.js');
    const aiall = path.join(project, 'node_modules', '@ai.all', 'aiall', 'bin', 'cli.js');

    // 2. init vendors the standard, enables the pack and writes the root ALL.md.
    exec(process.execPath, [ds7], project);
    const manifest = JSON.parse(
      fs.readFileSync(path.join(project, 'ds7', 'aiall-pack.json'), 'utf8'),
    );
    assert.equal(manifest.name, '@ai.all/ds7');
    assert.equal(manifest.version, version);
    for (const d of manifest.directives) {
      assert.ok(fs.existsSync(path.join(project, d.doc)), `directive doc missing: ${d.doc}`);
    }
    const config = JSON.parse(fs.readFileSync(path.join(project, '.ai', 'aiall.json'), 'utf8'));
    assert.deepEqual(config.packs, ['aiall-core', 'ds7/aiall-pack.json']);
    assert.equal(fs.readFileSync(path.join(project, 'ds7', 'VERSION'), 'utf8').trim(), version);
    assert.ok(
      !fs.existsSync(path.join(project, 'ALL.project.md')),
      'ALL.project.md must not be created',
    );
    assert.ok(
      fs.existsSync(path.join(project, 'ds7', '09-security-errors', 'SECURITY-AND-ERRORS.md')),
      'security baseline missing',
    );
    assert.ok(
      fs.existsSync(path.join(project, 'ds7', '10-operations', 'DEPLOYMENT.md')),
      'operations docs missing',
    );
    const rootAll = fs.readFileSync(path.join(project, 'ALL.md'), 'utf8');
    assert.ok(rootAll.includes('<!-- aiall:begin packs -->'));
    assert.ok(rootAll.includes('ds7/ALL.md'), 'root ALL.md must link to the ds7 rules');
    exec(process.execPath, [aiall, 'check', '--path', project], project);

    // 3. Running init again changes nothing: the pack is not listed twice.
    const again = exec(process.execPath, [ds7], project);
    assert.ok(again.includes('pack ds7/aiall-pack.json (exists, kept)'));
    const config2 = JSON.parse(fs.readFileSync(path.join(project, '.ai', 'aiall.json'), 'utf8'));
    assert.deepEqual(config2.packs, config.packs);

    // 4. Project text outside the managed block survives update.
    fs.writeFileSync(
      path.join(project, 'ALL.md'),
      `${rootAll}\n\n## Project values\n\nCUSTOM PROJECT TEXT\n`,
    );
    fs.writeFileSync(path.join(project, 'ds7', 'ALL.md'), 'stale standard');
    exec(process.execPath, [ds7, 'update'], project);
    assert.ok(
      fs.readFileSync(path.join(project, 'ds7', 'ALL.md'), 'utf8').includes('DS7 Projects'),
    );
    assert.ok(
      fs.readFileSync(path.join(project, 'ALL.md'), 'utf8').includes('CUSTOM PROJECT TEXT'),
    );
    exec(process.execPath, [aiall, 'check', '--path', project], project);

    // 5. A DS7 1.x project gets a warning, and its files are left in place.
    fs.writeFileSync(path.join(project, 'ALL.project.md'), '# old project file');
    const legacy = exec(process.execPath, [ds7, 'update'], project);
    assert.ok(legacy.includes('ALL.project.md is from DS7 1.x'));
    assert.ok(fs.existsSync(path.join(project, 'ALL.project.md')));
  } finally {
    fs.rmSync(work, { recursive: true, force: true });
  }
});
