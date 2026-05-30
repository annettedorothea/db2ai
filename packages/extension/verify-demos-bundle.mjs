#!/usr/bin/env node
import { existsSync } from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const extensionRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)));
const demosRoot = path.join(extensionRoot, 'demos');
const required = [
    'package.json',
    'demos-generate.config.json',
    'scripts/generate.mjs',
    'scripts/generate-all.mjs'
];

const missing = required.filter((relative) => !existsSync(path.join(demosRoot, relative)));
if (missing.length > 0) {
    console.error('[verify-demos-bundle] missing bundled demo workspace files:');
    for (const relative of missing) {
        console.error(`  demos/${relative}`);
    }
    process.exit(1);
}

console.log('[verify-demos-bundle] ok');
