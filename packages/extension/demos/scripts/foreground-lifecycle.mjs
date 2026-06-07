#!/usr/bin/env node
/**
 * Foreground start scripts: stop MCP child processes on Ctrl+C or when a child exits.
 */
import { spawnSync } from 'node:child_process';

/** @typedef {import('node:child_process').ChildProcess} ChildProcess */

/**
 * @param {ChildProcess[]} serviceChildren
 * @returns {Promise<void>}
 */
async function stopServiceChildren(serviceChildren) {
    const waits = serviceChildren.map((child) => {
        if (!child.pid || child.exitCode !== null) {
            return Promise.resolve();
        }
        return new Promise((resolve) => {
            let settled = false;
            const finish = () => {
                if (settled) {
                    return;
                }
                settled = true;
                resolve();
            };
            child.once('exit', finish);
            try {
                child.kill('SIGTERM');
            } catch {
                finish();
                return;
            }
            setTimeout(() => {
                if (child.exitCode === null && child.pid) {
                    try {
                        child.kill('SIGKILL');
                    } catch {
                        /* already exited */
                    }
                }
                finish();
            }, 3000);
        });
    });
    await Promise.all(waits);
}

function allServiceChildrenExited(serviceChildren) {
    return serviceChildren.every((child) => child.exitCode !== null);
}

/**
 * Wait for SIGINT/SIGTERM or for all children to exit (stdio-inherit MCP often receives Ctrl+C alone).
 *
 * @param {{
 *   label: string;
 *   serviceChildren: ChildProcess[];
 *   demosRoot: string;
 * }} options
 * @returns {Promise<void>}
 */
export function waitForForegroundServiceShutdown({ label, serviceChildren, demosRoot }) {
    let shuttingDown = false;

    const shutdown = async (reason) => {
        if (shuttingDown) {
            return;
        }
        shuttingDown = true;
        console.log(`[${label}] ${reason} — stopping foreground services…`);
        await stopServiceChildren(serviceChildren);
        console.log(`[${label}] stopped (npm run demo:kill-all to stop MCP hosts and Docker).`);
        process.exit(0);
    };

    for (const child of serviceChildren) {
        child.on('exit', () => {
            if (allServiceChildrenExited(serviceChildren)) {
                void shutdown('child exit');
            }
        });
    }

    return new Promise((resolve) => {
        process.once('SIGINT', () => {
            shutdown('SIGINT').then(resolve);
        });
        process.once('SIGTERM', () => {
            shutdown('SIGTERM').then(resolve);
        });
    });
}
