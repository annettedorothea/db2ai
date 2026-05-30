#!/usr/bin/env node
/**
 * Install consumer git hooks — delegates to @core2ai/core/scripts/install-consumer-git-hooks.mjs
 */
import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as url from 'node:url';

const consumerRoot = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');

function resolveCore2aiScript(scriptName) {
    const candidates = [
        path.resolve(consumerRoot, '../core2ai/scripts', scriptName),
        path.join(consumerRoot, 'node_modules/@core2ai/core/scripts', scriptName)
    ];
    return candidates.find((candidate) => fs.existsSync(candidate));
}

const scriptPath = resolveCore2aiScript('install-consumer-git-hooks.mjs');
if (!scriptPath) {
    console.error('[install-hooks] missing install-consumer-git-hooks.mjs — install @core2ai/core or clone sibling ../core2ai');
    process.exit(1);
}

const result = spawnSync(process.execPath, [scriptPath, consumerRoot], {
    cwd: consumerRoot,
    stdio: 'inherit'
});
process.exit(result.status ?? 1);
