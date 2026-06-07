#!/usr/bin/env node
/**
 * Foreground start scripts: stop MCP child processes and demo Docker on Ctrl+C.
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

/**
 * Wait for SIGINT/SIGTERM; stop children and optionally run an npm db-kill script.
 *
 * @param {{
 *   label: string;
 *   serviceChildren: ChildProcess[];
 *   demosRoot: string;
 *   dbKillNpmScript?: string;
 * }} options
 * @returns {Promise<void>}
 */
export function waitForForegroundShutdown({ label, serviceChildren, demosRoot, dbKillNpmScript }) {
    let shuttingDown = false;

    const shutdown = async (signal) => {
        if (shuttingDown) {
            return;
        }
        shuttingDown = true;
        console.log(`[${label}] ${signal} — stopping foreground services…`);
        await stopServiceChildren(serviceChildren);

        if (dbKillNpmScript) {
            console.log(`[${label}] stopping Docker (${dbKillNpmScript})…`);
            const result = spawnSync('npm', ['run', dbKillNpmScript], {
                cwd: demosRoot,
                stdio: 'inherit',
                shell: process.platform === 'win32'
            });
            if (result.status !== 0) {
                console.warn(`[${label}] ${dbKillNpmScript} exited with status ${result.status ?? 'unknown'}`);
            }
        }

        console.log(`[${label}] stopped.`);
        process.exit(0);
    };

    return new Promise((resolve) => {
        process.once('SIGINT', () => {
            shutdown('SIGINT').then(resolve);
        });
        process.once('SIGTERM', () => {
            shutdown('SIGTERM').then(resolve);
        });
    });
}

/**
 * Stop foreground MCP/IDP children only (no Docker). For npm run start:foreground.
 *
 * @param {{ label: string; serviceChildren: ChildProcess[]; demosRoot: string }} options
 * @returns {Promise<void>}
 */
export function waitForForegroundServiceShutdown({ label, serviceChildren, demosRoot }) {
    return waitForForegroundShutdown({ label, serviceChildren, demosRoot, dbKillNpmScript: undefined });
}
