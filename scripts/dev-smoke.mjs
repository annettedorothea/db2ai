#!/usr/bin/env node
/**
 * Dev smoke shortcuts — delegates to @core2ai/core/scripts/consumer-dev-smoke.mjs
 *
 * Usage: node scripts/dev-smoke.mjs [--all-smoke|--e2e|<scenario>]
 */
import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as url from 'node:url';

const consumerRoot = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const configPath = path.join(consumerRoot, 'scripts/dev-smoke.config.json');
const args = process.argv.slice(2);

if (args.length === 0) {
    console.error('Usage: node scripts/dev-smoke.mjs [--all-smoke|--e2e|<scenario>]');
    process.exit(1);
}

function resolveCore2aiScript(scriptName) {
    const candidates = [
        path.resolve(consumerRoot, '../core2ai/scripts', scriptName),
        path.join(consumerRoot, 'node_modules/@core2ai/core/scripts', scriptName),
        path.join(consumerRoot, 'packages/cli/node_modules/@core2ai/core/scripts', scriptName)
    ];
    return candidates.find((candidate) => fs.existsSync(candidate));
}

const scriptPath = resolveCore2aiScript('consumer-dev-smoke.mjs');
if (!scriptPath) {
    console.error('[dev-smoke] missing consumer-dev-smoke.mjs — install @core2ai/core or clone sibling ../core2ai');
    process.exit(1);
}

const result = spawnSync(process.execPath, [scriptPath, configPath, ...args], {
    cwd: consumerRoot,
    stdio: 'inherit'
});
process.exit(result.status ?? 1);
