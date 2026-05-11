#!/usr/bin/env node
/**
 * Find usages of CSS custom properties (var(--xxx)) that are not declared in
 * the design-token files. Catches typos like var(--space-7) when the scale
 * skips 7.
 *
 * Run: node scripts/check-css-vars.mjs
 * Exit code 1 if any undefined var is used (good for CI).
 */
import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const ROOT = dirname(dirname(__filename));
const WEB_SRC = join(ROOT, 'apps', 'web', 'src');

// Files that declare design tokens (anything in :root or under apps/web/src/styles)
const TOKEN_FILES = [
  join(WEB_SRC, 'styles', 'tokens.css'),
  join(WEB_SRC, 'styles', 'themes', 'light.css'),
  join(WEB_SRC, 'styles', 'themes', 'dark.css'),
];

// Vars allowed even if not declared in tokens (defined inline via style={} or fallback)
const RUNTIME_VARS = new Set([
  '--node-color',  // LevelJourney sets via inline style
  '--cell',        // ActivityHeatmap inline
  '--cell-h',
  '--cell-gap',
  '--ci',          // confetti keyframe
  '--cat-color',   // DictionaryPage sets per-category via inline style
  '--tint',        // AchievementsPage badge accent set via inline style
]);

async function walk(dir) {
  const out = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const ent of entries) {
    const p = join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === 'node_modules' || ent.name === 'dist') continue;
      out.push(...(await walk(p)));
    } else if (ent.isFile() && (p.endsWith('.css') || p.endsWith('.tsx') || p.endsWith('.ts'))) {
      out.push(p);
    }
  }
  return out;
}

async function main() {
  const files = await walk(WEB_SRC);

  // 1. Collect declared custom-property names from ALL css files (some
  //    components scope vars locally inside their own .module.css).
  const declared = new Set(RUNTIME_VARS);
  for (const file of files) {
    if (!file.endsWith('.css')) continue;
    const src = await readFile(file, 'utf8');
    for (const m of src.matchAll(/(--[a-zA-Z0-9_-]+)\s*:/g)) {
      declared.add(m[1]);
    }
  }

  // 2. Scan all source files for var(--xxx) usages
  const offenders = []; // { file, line, varName }
  for (const file of files) {
    const src = await readFile(file, 'utf8');
    const lines = src.split('\n');
    lines.forEach((line, i) => {
      for (const m of line.matchAll(/var\((--[a-zA-Z0-9_-]+)/g)) {
        const name = m[1];
        if (!declared.has(name)) {
          offenders.push({ file: relative(ROOT, file), line: i + 1, varName: name });
        }
      }
    });
  }

  if (offenders.length === 0) {
    console.log('✓ All CSS custom properties are declared in tokens/themes.');
    return;
  }

  console.error(`✗ Found ${offenders.length} usages of undefined CSS custom properties:\n`);
  for (const o of offenders) {
    console.error(`  ${o.file}:${o.line}  →  ${o.varName}`);
  }
  console.error(`\nDeclare them in apps/web/src/styles/tokens.css or themes/, or add to RUNTIME_VARS in scripts/check-css-vars.mjs if they're set inline via style={}.`);
  process.exit(1);
}

main().catch((err) => {
  console.error('Error running check:', err);
  process.exit(2);
});
