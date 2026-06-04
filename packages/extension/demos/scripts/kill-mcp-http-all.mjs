#!/usr/bin/env node
/**
 * Stop processes listening on db2ai demo HTTP MCP ports.
 */
import { execSync } from 'node:child_process';
import { loadDemoEnvLocal } from './load-env-local.mjs';
import { listHttpPorts } from './mcp-http-demos.mjs';

function killPort(port) {
    try {
        const pids = execSync(`lsof -ti :${port}`, { encoding: 'utf8' }).trim();
        if (!pids) {
            console.log(`[mcp-http:kill] port ${port}: nothing listening`);
            return;
        }
        for (const pid of pids.split('\n').filter(Boolean)) {
            execSync(`kill ${pid}`);
        }
        console.log(`[mcp-http:kill] port ${port}: stopped ${pids.replace(/\n/g, ', ')}`);
    } catch (err) {
        const status = err && typeof err === 'object' && 'status' in err ? err.status : undefined;
        if (status === 1) {
            console.log(`[mcp-http:kill] port ${port}: nothing listening`);
            return;
        }
        throw err;
    }
}

loadDemoEnvLocal();
for (const port of listHttpPorts()) {
    killPort(port);
}
