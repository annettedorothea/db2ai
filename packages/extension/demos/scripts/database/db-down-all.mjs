#!/usr/bin/env node
/**
 * Stop all demo database containers (Pagila, Sakila, orders-postgres, animals-sqlserver, plants-oracle).
 *
 * Usage: node ./scripts/database/db-down-all.mjs  (npm run db:down)
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const databaseDir = path.dirname(fileURLToPath(import.meta.url));

function runDocker(args) {
    const result = spawnSync('docker', ['compose', ...args], { cwd: projectRoot, stdio: 'inherit' });
    if (result.status !== 0) {
        process.exit(result.status ?? 1);
    }
}

function runNodeScript(scriptName, extraArgs = []) {
    const result = spawnSync(process.execPath, [path.join(databaseDir, scriptName), ...extraArgs], {
        cwd: projectRoot,
        stdio: 'inherit'
    });
    if (result.status !== 0) {
        process.exit(result.status ?? 1);
    }
}

console.log('[db:down] docker compose down (main + mssql + oracle profiles)…');
runDocker(['--profile', 'mssql', '--profile', 'oracle', 'down']);
console.log('[db:down] removing any leftover demo DB containers by name…');
runNodeScript('kill-demo-databases.mjs', ['all']);
console.log('[db:down] all demo databases stopped.');
