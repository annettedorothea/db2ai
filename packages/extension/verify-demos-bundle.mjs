#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const extensionRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)));
const demosRoot = path.join(extensionRoot, 'demos');
const required = JSON.parse(readFileSync(path.join(extensionRoot, 'demo-bundle-required.json'), 'utf8'));

const missing = required.filter((relative) => !existsSync(path.join(demosRoot, relative)));
if (missing.length > 0) {
    console.error('[verify-demos-bundle] missing bundled demo workspace files:');
    for (const relative of missing) {
        console.error(`  demos/${relative}`);
    }
    process.exit(1);
}

console.log('[verify-demos-bundle] ok');
