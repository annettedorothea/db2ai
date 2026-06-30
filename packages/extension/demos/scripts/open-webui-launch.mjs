/**
 * Keep identical in api2ai and db2ai packages/extension/demos/scripts/open-webui-launch.mjs
 *
 * Shared Open WebUI runtime for api2ai + db2ai demos (global pip/pipx install preferred).
 */
import { randomBytes } from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const PYTHON_CANDIDATES = ['python3.12', 'python3.11', 'python3.10', 'python3', 'python'];

/**
 * @returns {NodeJS.ProcessEnv}
 */
export function augmentedEnv() {
    const home = os.homedir();
    const extra = [
        path.join(home, '.local', 'bin'),
        path.join(home, '.local', 'pipx', 'venvs', 'open-webui', 'bin'),
        path.join(home, 'Library', 'Python', '3.13', 'bin'),
        path.join(home, 'Library', 'Python', '3.12', 'bin'),
        path.join(home, 'Library', 'Python', '3.11', 'bin'),
        '/opt/homebrew/bin',
        '/usr/local/bin'
    ];
    const pathVar = process.env.PATH ?? '';
    const prefix = extra.filter((entry) => existsSync(entry)).join(path.delimiter);
    return prefix ? { ...process.env, PATH: `${prefix}${path.delimiter}${pathVar}` } : { ...process.env };
}

/**
 * @param {string} url
 * @returns {string | undefined}
 */
export function probeHttp(url) {
    const result = spawnSync('curl', ['-s', '-o', '/dev/null', '-w', '%{http_code}', url], {
        encoding: 'utf8'
    });
    const code = result.stdout?.trim() ?? '';
    return code && code !== '000' ? code : undefined;
}

/**
 * @param {number} port
 * @returns {boolean}
 */
export function isOpenWebUiListening(port) {
    const code = probeHttp(`http://127.0.0.1:${port}/`);
    return code === '200' || code === '302' || code === '307';
}

/**
 * @param {string} command
 * @param {string[]} args
 * @returns {boolean}
 */
function commandOk(command, args) {
    return spawnSync(command, args, { stdio: 'ignore', env: augmentedEnv() }).status === 0;
}

/**
 * @param {number} port
 * @returns {{ command: string, args: string[] } | null}
 */
function resolveFromOpenWebUiCommandEnv(port) {
    const raw = process.env.OPEN_WEBUI_COMMAND?.trim();
    if (!raw) {
        return null;
    }
    const tokens = raw.split(/\s+/).filter(Boolean);
    if (tokens.length === 0) {
        return null;
    }
    const command = tokens[0];
    const prefixArgs = tokens.slice(1);
    const helpArgs = prefixArgs.length > 0 ? [...prefixArgs, '--help'] : ['--help'];
    if (!commandOk(command, helpArgs)) {
        return null;
    }
    return { command, args: [...prefixArgs, 'serve', '--port', String(port)] };
}

/**
 * @param {number} port
 * @returns {{ command: string, args: string[] } | null}
 */
export function resolveOpenWebUiLaunch(port) {
    const serveArgs = ['serve', '--port', String(port)];

    const fromEnv = resolveFromOpenWebUiCommandEnv(port);
    if (fromEnv) {
        return fromEnv;
    }

    if (commandOk('open-webui', ['--help'])) {
        return { command: 'open-webui', args: serveArgs };
    }

    const which = spawnSync('which', ['open-webui'], { encoding: 'utf8', env: augmentedEnv() });
    const whichBin = which.stdout?.trim();
    if (which.status === 0 && whichBin && commandOk(whichBin, ['--help'])) {
        return { command: whichBin, args: serveArgs };
    }

    for (const python of PYTHON_CANDIDATES) {
        if (commandOk(python, ['-m', 'open_webui', '--help'])) {
            return { command: python, args: ['-m', 'open_webui', ...serveArgs] };
        }
    }

    const demosRoot = process.env.OPEN_WEBUI_DEMOS_ROOT;
    if (demosRoot) {
        const venvBin = path.join(demosRoot, '.open-webui-venv', 'bin');
        const venvOpenWebUi = path.join(venvBin, 'open-webui');
        if (existsSync(venvOpenWebUi) && commandOk(venvOpenWebUi, ['--help'])) {
            return { command: venvOpenWebUi, args: serveArgs };
        }

        const venvPython = path.join(venvBin, 'python3');
        if (existsSync(venvPython) && commandOk(venvPython, ['-m', 'open_webui', '--help'])) {
            return { command: venvPython, args: ['-m', 'open_webui', ...serveArgs] };
        }
    }

    return null;
}

/**
 * Shared data dir for one Open WebUI instance across api2ai/db2ai on the same machine.
 * @param {string} demosRoot
 * @returns {string}
 */
export function resolveOpenWebUiDataDir(demosRoot) {
    if (process.env.OPEN_WEBUI_DATA_DIR?.trim()) {
        return process.env.OPEN_WEBUI_DATA_DIR.trim();
    }
    if (process.env.DATA_DIR?.trim()) {
        return process.env.DATA_DIR.trim();
    }
    return path.join(os.homedir(), '.open-webui-data');
}

/**
 * @param {string} demosRoot
 * @returns {string}
 */
export function resolveOpenWebUiSecretPath(demosRoot) {
    if (process.env.OPEN_WEBUI_SECRET_PATH?.trim()) {
        return process.env.OPEN_WEBUI_SECRET_PATH.trim();
    }
    return path.join(os.homedir(), '.open-webui-secret');
}

/**
 * PID file for the Open WebUI process started by npm run open-webui (shared across api2ai/db2ai on one machine).
 * @returns {string}
 */
export function resolveOpenWebUiPidPath() {
    if (process.env.OPEN_WEBUI_PID_PATH?.trim()) {
        return process.env.OPEN_WEBUI_PID_PATH.trim();
    }
    return path.join(os.homedir(), '.open-webui.pid');
}

/**
 * Stop only the Open WebUI process recorded in the PID file (does not kill other listeners on the port).
 * @param {string} demosRoot
 */
export function stopOpenWebUi(demosRoot) {
    const port = Number(process.env.OPEN_WEBUI_PORT ?? '3000');
    const pidPath = resolveOpenWebUiPidPath();
    if (!existsSync(pidPath)) {
        console.log(`[open-webui] No PID file at ${pidPath} — not stopping any process.`);
        return;
    }
    const pid = Number.parseInt(readFileSync(pidPath, 'utf8').trim(), 10);
    if (!Number.isFinite(pid) || pid <= 0) {
        console.warn(`[open-webui] Invalid PID file — removing ${pidPath}.`);
        unlinkSync(pidPath);
        return;
    }
    try {
        process.kill(pid, 'SIGTERM');
        console.log(`[open-webui] Sent SIGTERM to PID ${pid} (port ${port}).`);
    } catch (error) {
        const code = error && typeof error === 'object' && 'code' in error ? error.code : undefined;
        if (code !== 'ESRCH') {
            throw error;
        }
        console.log(`[open-webui] PID ${pid} is not running.`);
    }
    try {
        unlinkSync(pidPath);
    } catch {
        /* ignore */
    }
    console.log(`[open-webui] Data kept in ${resolveOpenWebUiDataDir(demosRoot)}.`);
}

/**
 * @param {string} secretPath
 * @returns {string}
 */
export function readOrCreateSecret(secretPath) {
    if (process.env.WEBUI_SECRET_KEY?.trim()) {
        return process.env.WEBUI_SECRET_KEY.trim();
    }
    if (existsSync(secretPath)) {
        const line = readFileSync(secretPath, 'utf8').trim();
        const match = line.match(/^WEBUI_SECRET_KEY=(.+)$/);
        if (match?.[1]) {
            return match[1];
        }
    }
    const secret = randomBytes(32).toString('hex');
    mkdirSync(path.dirname(secretPath), { recursive: true });
    writeFileSync(secretPath, `WEBUI_SECRET_KEY=${secret}\n`, 'utf8');
    console.log(`[open-webui] Created ${secretPath} (shared across demos).`);
    return secret;
}

/**
 * @param {number} port
 * @param {number} [timeoutMs]
 * @returns {Promise<void>}
 */
export async function waitForOpenWebUi(port, timeoutMs = 300_000) {
    const url = `http://127.0.0.1:${port}/`;
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
        if (isOpenWebUiListening(port)) {
            console.log(`[open-webui] Ready at ${url}.`);
            return;
        }
        await new Promise((resolve) => setTimeout(resolve, 3000));
        process.stdout.write('.');
    }
    console.warn('');
    console.warn(`[open-webui] Still starting after ${timeoutMs / 1000}s — check the terminal or logs.`);
}

export function printOpenWebUiInstallHint() {
    console.error('[open-webui] Open WebUI is not installed (or not on PATH for npm).');
    console.error('[open-webui] Install globally once (Python 3.11+ recommended):');
    console.error('  pipx install open-webui');
    console.error('  # or: python3 -m pip install --user open-webui');
    console.error('[open-webui] If installed but not found, set OPEN_WEBUI_COMMAND in .env (see .env.example).');
    console.error('[open-webui] Optional local fallback: python3 -m venv .open-webui-venv && pip install open-webui');
    console.error('[open-webui] Then retry: npm run open-webui');
}

/**
 * @param {{
 *   demosRoot: string,
 *   warnIfMcpHostsDown?: (env: NodeJS.ProcessEnv) => void,
 *   printOpenWebUiMcpHints: (port: number, env: NodeJS.ProcessEnv) => void,
 * }} options
 */
export function runOpenWebUiStart({ demosRoot, warnIfMcpHostsDown, printOpenWebUiMcpHints }) {
    const openWebUiPort = Number(process.env.OPEN_WEBUI_PORT ?? '3000');

    if (isOpenWebUiListening(openWebUiPort)) {
        console.log(`[open-webui] Already listening on port ${openWebUiPort} — leaving it running.`);
        printOpenWebUiMcpHints(openWebUiPort, process.env);
        return;
    }

    process.env.OPEN_WEBUI_DEMOS_ROOT = demosRoot;
    const launch = resolveOpenWebUiLaunch(openWebUiPort);
    delete process.env.OPEN_WEBUI_DEMOS_ROOT;

    if (!launch) {
        if (process.env.OPEN_WEBUI_COMMAND?.trim()) {
            console.error(
                `[open-webui] OPEN_WEBUI_COMMAND is set but not runnable: ${process.env.OPEN_WEBUI_COMMAND.trim()}`
            );
        }
        printOpenWebUiInstallHint();
        process.exit(1);
    }

    const secretPath = resolveOpenWebUiSecretPath(demosRoot);
    const dataDir = resolveOpenWebUiDataDir(demosRoot);
    const secret = readOrCreateSecret(secretPath);
    mkdirSync(dataDir, { recursive: true });

    const env = {
        ...augmentedEnv(),
        WEBUI_SECRET_KEY: secret,
        DATA_DIR: dataDir,
        OPEN_WEBUI_PORT: String(openWebUiPort)
    };

    warnIfMcpHostsDown?.(env);

    console.log(`[open-webui] Starting Open WebUI on port ${openWebUiPort}…`);
    console.log(`[open-webui] Command: ${launch.command} ${launch.args.join(' ')}`);
    console.log(`[open-webui] Data: ${dataDir}`);

    const child = spawn(launch.command, launch.args, {
        cwd: demosRoot,
        detached: true,
        stdio: 'ignore',
        env
    });
    child.unref();
    writeFileSync(resolveOpenWebUiPidPath(), `${child.pid}\n`, 'utf8');

    console.log('[open-webui] Waiting for UI (first start can take a minute)…');

    waitForOpenWebUi(openWebUiPort)
        .then(() => {
            printOpenWebUiMcpHints(openWebUiPort, env);
        })
        .catch((error) => {
            const message = error instanceof Error ? error.message : String(error);
            console.error('[open-webui] failed:', message);
            process.exit(1);
        });
}
