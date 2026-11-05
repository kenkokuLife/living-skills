#!/usr/bin/env node
// Builds manifest.json from skills/*/ (names, versions, file SHA-256). No dependencies.
//   node scripts/build-manifest.mjs          write manifest.json
//   node scripts/build-manifest.mjs --check  fail if manifest.json is stale or a skill breaks the rules
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'bundle.json'), 'utf8'));
const problems = [];
const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');

function frontmatter(text, file) {
  const m = /^---\n([\s\S]*?)\n---\n/.exec(text);
  if (!m) { problems.push(`${file}: missing YAML frontmatter`); return {}; }
  const out = { metadata: {} };
  let inMeta = false;
  for (const line of m[1].split('\n')) {
    const meta = /^ {2}([\w-]+):\s*"?(.*?)"?$/.exec(line);
    if (inMeta && meta) { out.metadata[meta[1]] = meta[2]; continue; }
    inMeta = false;
    const kv = /^([\w-]+):\s*(.*)$/.exec(line);
    if (!kv) continue;
    if (kv[1] === 'metadata') { inMeta = true; continue; }
    out[kv[1]] = kv[2];
  }
  return out;
}

const files = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
  const p = path.join(dir, e.name);
  return e.isDirectory() ? files(p) : [p];
});

// Things that must never be published from this repository.
const forbidden = [/\/Users\/[^/\s]+/, /\/home\/[^/\s]+/, /C:\\Users\\/i, /prj_[0-9a-z]{26}/, /(api[_-]?key|secret|token)\s*[:=]\s*['"]?[A-Za-z0-9_\-]{16,}/i, /-----BEGIN [A-Z ]*PRIVATE KEY-----/];

const skills = fs.readdirSync(path.join(root, 'skills'), { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).sort().map((name) => {
  const dir = path.join(root, 'skills', name);
  const skillFile = path.join(dir, 'SKILL.md');
  if (!fs.existsSync(skillFile)) { problems.push(`skills/${name}: no SKILL.md`); return null; }
  const fm = frontmatter(fs.readFileSync(skillFile, 'utf8'), `skills/${name}/SKILL.md`);
  if (fm.name !== name) problems.push(`skills/${name}: frontmatter name "${fm.name}" must equal the directory name`);
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name) || name.length > 64) problems.push(`skills/${name}: invalid skill name`);
  if (!fm.description || fm.description.length > 1024) problems.push(`skills/${name}: description missing or longer than 1024 characters`);
  if (fm.metadata.version !== pkg.version) problems.push(`skills/${name}: metadata.version ${fm.metadata.version} != bundle version ${pkg.version}`);
  const entries = files(dir).sort().map((abs) => {
    const buf = fs.readFileSync(abs);
    const rel = path.relative(root, abs).split(path.sep).join('/');
    for (const re of forbidden) if (re.test(buf.toString('utf8'))) problems.push(`${rel}: contains content that must not be published (${re})`);
    return { path: rel, install_as: path.relative(dir, abs).split(path.sep).join('/'), sha256: sha256(buf), bytes: buf.length };
  });
  return { name, version: fm.metadata.version, files: entries };
}).filter(Boolean);

const manifest = {
  manifest_version: 1,
  bundle: pkg.name,
  version: pkg.version,
  repository: pkg.repository,
  requires: pkg.requires,
  install_targets: pkg.install_targets,
  skills,
};
const text = JSON.stringify(manifest, null, 2) + '\n';
const target = path.join(root, 'manifest.json');

if (problems.length) { console.error(problems.map((p) => '✗ ' + p).join('\n')); process.exit(1); }
if (process.argv.includes('--check')) {
  const current = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : '';
  if (current !== text) { console.error('✗ manifest.json is stale: run node scripts/build-manifest.mjs'); process.exit(1); }
  console.log(`✓ manifest.json is current (${skills.length} skills, ${pkg.name} ${pkg.version})`);
} else {
  fs.writeFileSync(target, text);
  console.log(`wrote manifest.json (${skills.length} skills, ${pkg.name} ${pkg.version}, sha256 ${sha256(Buffer.from(text))})`);
}
