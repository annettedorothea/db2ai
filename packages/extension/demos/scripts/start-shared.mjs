import { copyFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadProjectEnvLocal } from './generated/load-env-local.mjs';

export const demosRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const foreground =
    process.env.START_FOREGROUND === '1' ||
    process.env.START_FOREGROUND === 'true' ||
    process.env.START_FOREGROUND === 'yes';

/** @type {import('node:child_process').ChildProcess[]} */
export const serviceChildren = [];

export function runNpm(args) {
    const result = spawnSync('npm', args, { cwd: demosRoot, stdio: 'inherit', shell: process.platform === 'win32' });
    if (result.status !== 0) {
        process.exit(result.status ?? 1);
    }
}

export function ensureEnvFromExample(exampleName, targetName) {
    const examplePath = path.join(demosRoot, exampleName);
    const targetPath = path.join(demosRoot, targetName);
    if (existsSync(targetPath)) {
        console.log(`[start] ${targetName} already exists — not overwritten.`);
        return false;
    }
    if (!existsSync(examplePath)) {
        console.error(`[start] ${exampleName} missing — create ${targetName} with required variables.`);
        process.exit(1);
    }
    copyFileSync(examplePath, targetPath);
    console.log(`[start] Created ${targetName} from ${exampleName} — edit database URLs and tokens as needed.`);
    return true;
}

function logPrefix(label) {
    const m = label.match(/^(mcp-(?:http|oauth):[^\s(]+)/);
    if (m) {
        return m[1];
    }
    return label.split(/\s/)[0].trim();
}

function buildServiceEnv(label, extraEnv = {}) {
    const env = { ...process.env, ...extraEnv, LOG_SERVICE_PREFIX: logPrefix(label) };
    if (foreground) {
        env.LOG_LEVEL = 'debug';
    }
    return env;
}

export function startService(label, argv, extraEnv = {}, logPort) {
    const env = buildServiceEnv(label, extraEnv);
    const portHint = logPort ? ` port ${logPort}` : '';
    if (foreground) {
        const child = spawn(process.execPath, argv, {
            cwd: demosRoot,
            stdio: 'inherit',
            env
        });
        serviceChildren.push(child);
        console.log(`[start] ${label} started in foreground${portHint}`);
        return;
    }
    const child = spawn(process.execPath, argv, {
        cwd: demosRoot,
        detached: true,
        stdio: 'ignore',
        env
    });
    child.unref();
    console.log(`[start] ${label} started in background${portHint}`);
}

export async function waitForHttpOk(url, { timeoutMs = 20_000, intervalMs = 200, label = url } = {}) {
    const deadline = Date.now() + timeoutMs;
    let lastError = 'unknown';
    while (Date.now() < deadline) {
        try {
            const response = await fetch(url);
            if (response.ok) {
                return;
            }
            lastError = `HTTP ${response.status}`;
        } catch (error) {
            lastError = error instanceof Error ? error.message : String(error);
        }
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
    throw new Error(`Timed out waiting for ${label} (${lastError})`);
}

export async function waitForTcpListen(port, { timeoutMs = 15_000, intervalMs = 200, label = `port ${port}` } = {}) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        try {
            const raw = spawnSync('lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN', '-t'], { encoding: 'utf8' });
            if (raw.status === 0 && raw.stdout.trim().length > 0) {
                return;
            }
        } catch {
            /* retry */
        }
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
    throw new Error(`Timed out waiting for TCP listener on ${label}`);
}

export async function waitForMcpHost(label, port, mcpUrl) {
    await waitForTcpListen(port, { label: mcpUrl });
    console.log(`[start] ${label} listening on port ${port}.`);
}

export function prepareWorkspaceEnv() {
    loadProjectEnvLocal();
    const createdEnv = ensureEnvFromExample('.env.example', '.env');
    if (createdEnv) {
        loadProjectEnvLocal();
    }
}

export function generateAndCompile() {
    runNpm(['run', 'generate:all']);
    runNpm(['run', 'build:generated']);
}

export function installGenerateCompile() {
    runNpm(['install']);
    generateAndCompile();
}

export function printMcpReminder() {
    console.log('[start] Cursor Settings → Tools & MCPs: enable servers, then reload MCP.');
}
