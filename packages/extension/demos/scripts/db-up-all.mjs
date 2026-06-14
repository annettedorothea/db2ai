#!/usr/bin/env node
/**
 * Start all demo database containers (Pagila, Sakila, orders-postgres, animals-sqlserver, plants-oracle).
 *
 * plants-oracle may take several minutes on first pull; one-time: docker login container-registry.oracle.com
 *
 * Usage: node ./scripts/db-up-all.mjs  (npm run db:up:all)
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const demosRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function runNpm(args) {
    const result = spawnSync('npm', args, { cwd: demosRoot, stdio: 'inherit', shell: process.platform === 'win32' });
    if (result.status !== 0) {
        process.exit(result.status ?? 1);
    }
}

function runDocker(args) {
    const result = spawnSync('docker', ['compose', ...args], { cwd: demosRoot, stdio: 'inherit' });
    if (result.status !== 0) {
        process.exit(result.status ?? 1);
    }
}

function runNodeScript(relativePath) {
    const result = spawnSync(process.execPath, [path.join(demosRoot, relativePath)], {
        cwd: demosRoot,
        stdio: 'inherit'
    });
    if (result.status !== 0) {
        process.exit(result.status ?? 1);
    }
}

console.log('[db:up:all] clearing previous demo DB containers…');
runNpm(['run', 'db:kill:all']);

console.log('[db:up:all] starting Pagila, Sakila, orders-postgres, animals-sqlserver…');
runDocker(['--profile', 'mssql', 'up', '-d', '--wait', 'pagila', 'sakila', 'orders-postgres', 'animals-sqlserver']);

console.log('[db:up:all] applying animals-sqlserver schema…');
runNodeScript('./scripts/apply-animals-sqlserver-schema.mjs');

console.log(
    '[db:up:all] starting plants-oracle (may take several minutes; one-time: docker login container-registry.oracle.com)…'
);
runNpm(['run', 'db:plants-oracle:up']);

console.log('[db:up:all] all demo databases are up.');
