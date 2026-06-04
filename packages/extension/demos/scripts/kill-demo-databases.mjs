#!/usr/bin/env node
/**
 * Remove demo DB containers by fixed name so `docker compose up` never hits name conflicts
 * (e.g. leftover containers from another checkout or compose project label).
 */
import { spawnSync } from 'node:child_process';

/** Must match container_name in docker-compose.yml. */
const DEMO_DB_CONTAINER_NAMES = ['db2ai-pagila', 'db2ai-sakila', 'db2ai-orders-demo'];

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

for (const name of DEMO_DB_CONTAINER_NAMES) {
    removeContainer(name);
}

console.log('[db:kill] demo database containers cleared.');
