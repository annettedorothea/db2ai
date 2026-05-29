#!/usr/bin/env node
/**
 * Run a core2ai pin script from node_modules/@core2ai/core, with fallback to sibling ../core2ai.
 *
 * Usage: node scripts/run-core2ai-script.mjs <script-name.mjs> [args...]
 */
import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

const scriptName = process.argv[2];
const scriptArgs = process.argv.slice(3);
const consumerRoot = process.cwd();

if (!scriptName) {
    console.error('Usage: node scripts/run-core2ai-script.mjs <script-name.mjs> [args...]');
    process.exit(1);
}

const candidates = [
    path.resolve(consumerRoot, '../core2ai/scripts', scriptName),
    path.join(consumerRoot, 'node_modules/@core2ai/core/scripts', scriptName)
];

const scriptPath = candidates.find((candidate) => fs.existsSync(candidate));

if (!scriptPath) {
    console.error(
        `[run-core2ai-script] missing ${scriptName}. Install @core2ai/core or clone sibling ../core2ai.`
    );
    process.exit(1);
}

const nodeCommand = process.execPath;
const result = spawnSync(nodeCommand, [scriptPath, ...scriptArgs], {
    cwd: consumerRoot,
    stdio: 'inherit'
});

process.exit(result.status ?? 1);
