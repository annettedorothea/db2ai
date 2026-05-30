#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TS_NOCHECK = '// @ts-nocheck\n';
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const generatedDir = path.join(repoRoot, 'packages/language/src/generated');

if (!fs.existsSync(generatedDir)) {
    process.exit(0);
}

for (const entry of fs.readdirSync(generatedDir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.ts')) {
        continue;
    }

    const filePath = path.join(generatedDir, entry.name);
    const source = fs.readFileSync(filePath, 'utf-8');
    if (source.startsWith('// @ts-nocheck')) {
        continue;
    }

    fs.writeFileSync(filePath, TS_NOCHECK + source);
}
