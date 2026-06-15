#!/usr/bin/env node
/**
 * Wait until Oracle FREEPDB1 accepts connections (sqlplus exit code, not grep).
 */
import { setTimeout as delay } from 'node:timers/promises';
import { probePlantsOracleReady } from './oracle-container.mjs';

const timeoutMs = Number(process.env.PLANTS_ORACLE_WAIT_TIMEOUT_MS) || 600_000;
const intervalMs = 5_000;

async function main() {
    console.log('[wait-plants-oracle] waiting for FREEPDB1…');
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        if (probePlantsOracleReady()) {
            console.log('[wait-plants-oracle] Oracle is ready.');
            return;
        }
        await delay(intervalMs);
    }
    console.error(`[wait-plants-oracle] timed out after ${timeoutMs}ms`);
    process.exit(1);
}

main().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[wait-plants-oracle] failed:', message);
    process.exit(1);
});
