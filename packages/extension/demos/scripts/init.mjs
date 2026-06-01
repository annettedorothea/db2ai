#!/usr/bin/env node
/**
 * Demo workspace setup: env from example, install, Docker DBs, generate, compile.
 */
import { copyFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const demosRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function runNpm(args) {
    const result = spawnSync('npm', args, { cwd: demosRoot, stdio: 'inherit', shell: process.platform === 'win32' });
    if (result.status !== 0) {
        process.exit(result.status ?? 1);
    }
}

function ensureEnvFromExample(exampleName, targetName) {
    const examplePath = path.join(demosRoot, exampleName);
    const targetPath = path.join(demosRoot, targetName);
    if (existsSync(targetPath)) {
        console.log(`[init] ${targetName} already exists — not overwritten.`);
        return;
    }
    if (!existsSync(examplePath)) {
        console.warn(`[init] ${exampleName} missing — skip env copy.`);
        return;
    }
    copyFileSync(examplePath, targetPath);
    console.log(`[init] Created ${targetName} from ${exampleName} — edit database URLs and tokens as needed.`);
}

ensureEnvFromExample('.env.example', '.env');
runNpm(['install']);
runNpm(['run', 'db:up:all']);
runNpm(['run', 'generate:all']);
runNpm(['run', 'build:generated']);
console.log('[init] Done. Enable MCP servers in Cursor, then reload MCP after DSL or env changes.');
