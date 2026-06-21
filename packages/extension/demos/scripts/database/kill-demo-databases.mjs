#!/usr/bin/env node
/**
 * Remove demo DB containers by fixed name so `docker compose up` never hits name conflicts
 * (e.g. leftover containers from another checkout or compose project label).
 *
 * Usage: node ./scripts/kill-demo-databases.mjs [main|mssql|oracle|all]
 *   main  — pagila, sakila, orders-postgresql
 *   mssql — animals-sqlserver only
 *   oracle — plants-oracle only
 *   all   — every demo DB container (default for db:kill:all)
 */
import { spawnSync } from 'node:child_process';

/** Must match container_name in docker-compose.yml. */
export const DEMO_DB_CONTAINER_GROUPS = {
    main: ['db2ai-pagila', 'db2ai-sakila', 'db2ai-orders-postgresql'],
    mssql: ['db2ai-animals-sqlserver'],
    oracle: ['db2ai-plants-oracle'],
    all: ['db2ai-pagila', 'db2ai-sakila', 'db2ai-orders-postgresql', 'db2ai-animals-sqlserver', 'db2ai-plants-oracle']
};

function resolveContainerNames(scopeArg) {
    const scope = scopeArg?.trim() || 'all';
    const names = DEMO_DB_CONTAINER_GROUPS[scope];
    if (!names) {
        console.error(`[db:kill] unknown scope "${scopeArg}" — use: main, mssql, oracle, all`);
        process.exit(1);
    }
    return { scope, names };
}

function containerExists(name) {
    const result = spawnSync('docker', ['inspect', '-f', '{{.Id}}', name], { encoding: 'utf8' });
    return result.status === 0;
}

function removeContainer(name) {
    if (!containerExists(name)) {
        return;
    }
    console.log(`[db:kill] removing container ${name}…`);
    const result = spawnSync('docker', ['rm', '-f', name], { stdio: 'inherit' });
    if (result.status !== 0) {
        process.exit(result.status ?? 1);
    }
}

const { scope, names } = resolveContainerNames(process.argv[2]);

for (const name of names) {
    removeContainer(name);
}

console.log(`[db:kill] ${scope} demo database containers cleared.`);
