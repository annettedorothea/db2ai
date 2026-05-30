#!/usr/bin/env node
/**
 * Thin wrapper — shared logic in @core2ai/core/scripts/demos-generate.mjs
 */
import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const demosRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const consumerRoot = path.resolve(demosRoot, '../../..');

function resolveCore2aiScript(scriptName) {
    const candidates = [
        path.resolve(consumerRoot, '../core2ai/scripts', scriptName),
        path.join(consumerRoot, 'node_modules/@core2ai/core/scripts', scriptName)
    ];
    return candidates.find((candidate) => fs.existsSync(candidate));
}

const scriptPath = resolveCore2aiScript('demos-generate.mjs');
if (!scriptPath) {
    console.error('[generate] missing demos-generate.mjs — install @core2ai/core or clone sibling ../core2ai');
    process.exit(1);
}

const configPath = path.join(demosRoot, 'demos-generate.config.json');
const args = [scriptPath, configPath, ...process.argv.slice(2)];
const result = spawnSync(process.execPath, args, { cwd: demosRoot, stdio: 'inherit' });
process.exit(result.status ?? 1);
