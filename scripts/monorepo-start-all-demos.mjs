#!/usr/bin/env node
/**
 * Monorepo-only: kill demos, install, local CLI generate, build, start fixtures + MCP.
 * Never uses the VSIX extension-scan generate path.
 *
 * Usage (from db2ai repo root): npm run start:all:demos
 */
import { spawnSync } from 'node:child_process';
import * as path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const demosRoot = path.join(repoRoot, 'packages', 'extension', 'demos');
const logTag = 'start:all:demos';

/**
 * @param {string} command
 * @param {string[]} args
 * @param {string} [cwd]
 */
function run(command, args, cwd = repoRoot) {
    const result = spawnSync(command, args, { cwd, stdio: 'inherit', env: process.env });
    if ((result.status ?? 1) !== 0) {
        process.exit(result.status ?? 1);
    }
}

async function main() {
    console.log(`[${logTag}] stopping previous demo processes…`);
    run('npm', ['run', 'demo:kill-all'], demosRoot);

    console.log(`[${logTag}] npm install (demos)…`);
    run('npm', ['install'], demosRoot);

    console.log(`[${logTag}] monorepo generate (local CLI)…`);
    run(process.execPath, [path.join(repoRoot, 'scripts', 'monorepo-generate-all.mjs')], repoRoot);

    console.log(`[${logTag}] build:generated…`);
    run('npm', ['run', 'build:generated'], demosRoot);

    const { startDemoStack } = await import(
        pathToFileURL(path.join(demosRoot, 'scripts', 'start-stack.mjs')).href
    );
    await startDemoStack(logTag);
}

main().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${logTag}] failed:`, message);
    process.exit(1);
});
