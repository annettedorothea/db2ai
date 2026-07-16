#!/usr/bin/env node
/**
 * Monorepo-only generate-all for db2ai development.
 * Uses packages/cli/bin/cli.js — never the VSIX extension scan path.
 *
 * Usage (from db2ai repo root): npm run generate:all
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const PRODUCT = 'db2ai';
const DSL_EXT = '.db2ai';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const demosRoot = path.join(repoRoot, 'packages', 'extension', 'demos');
const cliPath = path.join(repoRoot, 'packages', 'cli', 'bin', 'cli.js');

function formatCodegenBuildTimestamp(date = new Date()) {
    const offsetMinutes = -date.getTimezoneOffset();
    const sign = offsetMinutes >= 0 ? '+' : '-';
    const absOffset = Math.abs(offsetMinutes);
    const offsetHours = Math.floor(absOffset / 60);
    const offsetMins = absOffset % 60;
    const tzLabel =
        offsetMins === 0
            ? `UTC${sign}${offsetHours}`
            : `UTC${sign}${offsetHours}:${String(offsetMins).padStart(2, '0')}`;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${d} ${h}:${min} (${tzLabel})`;
}

if (!existsSync(cliPath)) {
    console.error(`[monorepo-generate-all] CLI not found at ${cliPath}`);
    process.exit(1);
}
if (!existsSync(demosRoot)) {
    console.error(`[monorepo-generate-all] demos root not found at ${demosRoot}`);
    process.exit(1);
}

const dslFiles = readdirSync(demosRoot, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(DSL_EXT))
    .map((entry) => entry.name)
    .sort();

if (dslFiles.length === 0) {
    console.error(`[monorepo-generate-all] no *${DSL_EXT} files at ${demosRoot}`);
    process.exit(1);
}

process.env.TF_BUILD_GENERATED_AT = formatCodegenBuildTimestamp();

for (const dslName of dslFiles) {
    const dslPath = path.join(demosRoot, dslName);
    const baseName = path.basename(dslName, DSL_EXT);
    const outPath = path.join(demosRoot, 'generated', PRODUCT, 'tools', `${baseName}-tools.ts`);
    console.log(`[monorepo-generate-all] ${dslName} → generated/${PRODUCT}/tools/${baseName}-tools.ts`);
    execFileSync(process.execPath, [cliPath, 'generate', dslPath, outPath], {
        stdio: 'inherit',
        cwd: demosRoot,
        env: process.env
    });
}

console.log('[monorepo-generate-all] formatting demos…');
execFileSync('npm', ['run', 'format'], {
    cwd: demosRoot,
    stdio: 'inherit',
    shell: process.platform === 'win32'
});
