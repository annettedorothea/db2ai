#!/usr/bin/env node
/**
 * Start all demo database containers (Pagila, Sakila, orders-postgres, animals-sqlserver, plants-oracle).
 *
 * plants-oracle may take several minutes on first pull; one-time: docker login container-registry.oracle.com
 *
 * Usage: node ./scripts/database/db-up-all.mjs  (npm run db:up:all)
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadProjectEnvLocal } from '../generated/load-env-local.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const databaseDir = path.dirname(fileURLToPath(import.meta.url));

loadProjectEnvLocal(projectRoot);

function runDocker(args) {
    const result = spawnSync('docker', ['compose', ...args], { cwd: projectRoot, stdio: 'inherit' });
    if (result.status !== 0) {
        process.exit(result.status ?? 1);
    }
}

function runNodeScript(scriptName, extraArgs = []) {
    const result = spawnSync(process.execPath, [path.join(databaseDir, scriptName), ...extraArgs], {
        cwd: projectRoot,
        stdio: 'inherit',
        env: process.env
    });
    if (result.status !== 0) {
        process.exit(result.status ?? 1);
    }
}

console.log('[db:up:all] clearing previous demo DB containers…');
runNodeScript('kill-demo-databases.mjs', ['all']);

console.log('[db:up:all] starting Pagila, Sakila, orders-postgres, animals-sqlserver…');
runDocker(['--profile', 'mssql', 'up', '-d', '--wait', 'pagila', 'sakila', 'orders-postgres', 'animals-sqlserver']);

console.log('[db:up:all] applying animals-sqlserver schema…');
runNodeScript('apply-animals-sqlserver-schema.mjs');

console.log(
    '[db:up:all] starting plants-oracle (may take several minutes; one-time: docker login container-registry.oracle.com)…'
);
runDocker(['--profile', 'oracle', 'up', '-d', 'plants-oracle']);
runNodeScript('wait-plants-oracle.mjs');
runNodeScript('apply-plants-oracle-schema.mjs');

console.log('[db:up:all] all demo databases are up.');
