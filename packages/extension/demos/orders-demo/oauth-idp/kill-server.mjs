#!/usr/bin/env node
import { execSync } from 'node:child_process';

const PORT = Number(process.env.ORDERS_DEMO_OAUTH_IDP_PORT) || 3862;

try {
    const pids = execSync(`lsof -ti :${PORT}`, { encoding: 'utf8' }).trim();
    if (!pids) {
        console.log(`No process listening on port ${PORT}`);
        process.exit(0);
    }
    for (const pid of pids.split('\n').filter(Boolean)) {
        execSync(`kill ${pid}`);
    }
    console.log(`Stopped process(es) on port ${PORT}: ${pids.replace(/\n/g, ', ')}`);
} catch (err) {
    const status = err && typeof err === 'object' && 'status' in err ? err.status : undefined;
    if (status === 1) {
        console.log(`No process listening on port ${PORT}`);
        process.exit(0);
    }
    throw err;
}
