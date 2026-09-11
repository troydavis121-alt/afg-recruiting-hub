#!/usr/bin/env node
// Injects seed/items.json into the SEED constant in apps-script/Code.gs and
// the DEMO constant in index.html, between the /* SEED:START */ and
// /* SEED:END */ marker comments, so the three copies can never drift apart.
//
// Usage: node scripts/sync-seed.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const seedPath = path.join(root, 'seed', 'items.json');
const seed = JSON.parse(readFileSync(seedPath, 'utf8'));
const seedJson = JSON.stringify(seed, null, 2);

const START = '/* SEED:START */';
const END = '/* SEED:END */';

function inject(filePath, varName) {
  const src = readFileSync(filePath, 'utf8');
  const startIdx = src.indexOf(START);
  const endIdx = src.indexOf(END);
  if (startIdx === -1 || endIdx === -1) {
    throw new Error(`Could not find SEED markers in ${filePath}`);
  }
  const before = src.slice(0, startIdx + START.length);
  const after = src.slice(endIdx);
  const block = `\nconst ${varName} = ${seedJson};\n`;
  writeFileSync(filePath, before + block + after, 'utf8');
  console.log(`Updated ${varName} in ${path.relative(root, filePath)}`);
}

inject(path.join(root, 'apps-script', 'Code.gs'), 'SEED');
inject(path.join(root, 'index.html'), 'DEMO');

console.log('Seed sync complete. seed/items.json, Code.gs, and index.html now match.');
