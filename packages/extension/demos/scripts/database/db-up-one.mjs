#!/usr/bin/env node
/**
 * Start one demo database container (idempotent — does not stop other demo DBs).
 *
 * Usage: node ./scripts/database/db-up-one.mjs <demoName>
 *   demoName: sakila-mysql | pagila-postgresql | orders-postgresql | animals-sqlserver | plants-oracle
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEMO_LAUNCH_REGISTRY } from '../demo-launch-registry.mjs';
import { loadProjectEnvLocal } from '../generated/load-env-local.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const databaseDir = path.dirname(fileURLToPath(import.meta.url));

const demoName = process.argv[2]?.trim();
const spec = demoName ? DEMO_LAUNCH_REGISTRY[demoName] : undefined;
if (!spec) {
    console.error(`[db:up] unknown demo "${demoName}" — use: ${Object.keys(DEMO_LAUNCH_REGISTRY).join(', ')}`);
    process.exit(1);
}

loadProjectEnvLocal(projectRoot);

function runDocker(args) {
    const result = spawnSync('docker', ['compose', ...args], { cwd: projectRoot, stdio: 'inherit' });
    if (result.status !== 0) {
        process.exit(result.status ?? 1);
    }
}

function runNodeScript(scriptName) {
    const result = spawnSync(process.execPath, [path.join(databaseDir, scriptName)], {
        cwd: projectRoot,
        stdio: 'inherit',
        env: process.env
    });
    if (result.status !== 0) {
        process.exit(result.status ?? 1);
    }
}

for (const db of spec.docker) {
    const profiles = db.profiles ?? [];
    const profileArgs = profiles.flatMap((p) => ['--profile', p]);
    const services = db.service;
    console.log(`[db:up] starting ${services}${profiles.length ? ` (profiles: ${profiles.join(', ')})` : ''}…`);
    runDocker([...profileArgs, 'up', '-d', '--wait', '--remove-orphans', services]);
    for (const script of db.postScripts ?? []) {
        console.log(`[db:up] running ${script}…`);
        runNodeScript(script);
    }
}

console.log(`[db:up] ${demoName} database ready.`);
