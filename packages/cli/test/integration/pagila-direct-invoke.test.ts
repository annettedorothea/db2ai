import { readGeneratedModule } from '@core2ai/mcp-host';
import { describe, expect, it } from 'vitest';
import { spawn, type SpawnOptionsWithoutStdio } from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { generateAction } from '../../src/generate-command.js';

const DEFAULT_PAGILA_HOST_PORT = '55432';
const PAGILA_CONTAINER_NAME = 'db2ai-pagila';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, '../../../..');
const cliRoot = path.resolve(__dirname, '../..');
const demosRoot = path.join(workspaceRoot, 'packages/extension/demos');
const pagilaSourcePath = path.join(demosRoot, 'pagila.db2ai');
const tmpRoot = path.join(cliRoot, 'tmp');

type CommandResult = {
    stdout: string;
    stderr: string;
    exitCode: number | null;
};

type PagilaContainerState = {
    exists: boolean;
    running: boolean;
    health: string;
    hostPort?: string;
};

function runCommand(command: string, args: string[], options: SpawnOptionsWithoutStdio = {}): Promise<CommandResult> {
    return new Promise((resolve) => {
        const child = spawn(command, args, {
            ...options,
            stdio: ['ignore', 'pipe', 'pipe']
        });
        let stdout = '';
        let stderr = '';
        child.stdout.setEncoding('utf8');
        child.stderr.setEncoding('utf8');
        child.stdout.on('data', (chunk: string) => {
            stdout += chunk;
        });
        child.stderr.on('data', (chunk: string) => {
            stderr += chunk;
        });
        child.once('error', (error) => {
            resolve({
                stdout,
                stderr: stderr ? `${stderr}\n${error.message}` : error.message,
                exitCode: -1
            });
        });
        child.once('close', (exitCode) => {
            resolve({ stdout, stderr, exitCode });
        });
    });
}

async function requireCommand(
    command: string,
    args: string[],
    options: SpawnOptionsWithoutStdio = {}
): Promise<CommandResult> {
    const result = await runCommand(command, args, options);
    if (result.exitCode !== 0) {
        throw new Error(
            [
                `Command failed (${result.exitCode}): ${command} ${args.join(' ')}`,
                result.stdout.trim(),
                result.stderr.trim()
            ]
                .filter((line) => line.length > 0)
                .join('\n')
        );
    }
    return result;
}

function parsePublishedHostPort(stdout: string): string | undefined {
    for (const line of stdout.split(/\r?\n/)) {
        const match = line.trim().match(/:(\d+)$/);
        if (match) {
            return match[1];
        }
    }
    return undefined;
}

async function inspectPagilaContainer(): Promise<PagilaContainerState> {
    const inspect = await runCommand('docker', [
        'inspect',
        '--format',
        '{{.State.Running}} {{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}',
        PAGILA_CONTAINER_NAME
    ]);
    if (inspect.exitCode !== 0) {
        return { exists: false, running: false, health: 'missing' };
    }

    const [runningRaw, healthRaw] = inspect.stdout.trim().split(/\s+/);
    const port = await runCommand('docker', ['port', PAGILA_CONTAINER_NAME, '5432/tcp']);
    return {
        exists: true,
        running: runningRaw === 'true',
        health: healthRaw ?? 'none',
        hostPort: port.exitCode === 0 ? parsePublishedHostPort(port.stdout) : undefined
    };
}

async function waitForExistingPagilaContainer(): Promise<PagilaContainerState> {
    const deadline = Date.now() + 90_000;
    let current = await inspectPagilaContainer();
    while (Date.now() < deadline) {
        if (current.running && current.health === 'healthy') {
            return current;
        }
        await new Promise((resolve) => setTimeout(resolve, 1_000));
        current = await inspectPagilaContainer();
    }
    throw new Error(`Pagila container exists but did not become healthy (health: ${current.health}).`);
}

function resolveConfiguredPagilaHostPort(): string | undefined {
    const configured = process.env.PAGILA_HOST_PORT?.trim();
    return configured && configured.length > 0 ? configured : undefined;
}

function buildPagilaDatabaseUrl(hostPort: string): string {
    return `postgres://postgres:postgres@127.0.0.1:${hostPort}/pagila`;
}

async function ensurePagilaDocker(): Promise<{ connectionString: string }> {
    const configuredHostPort = resolveConfiguredPagilaHostPort();
    const startupHostPort = configuredHostPort ?? DEFAULT_PAGILA_HOST_PORT;

    await requireCommand('docker', ['info']);

    const current = await inspectPagilaContainer();
    if (current.exists) {
        if (!current.running) {
            await requireCommand('docker', ['start', PAGILA_CONTAINER_NAME]);
        }
        const ready = await waitForExistingPagilaContainer();
        if (!ready.hostPort) {
            throw new Error('Pagila container is healthy, but its published host port could not be detected.');
        }
        if (configuredHostPort !== undefined && ready.hostPort !== configuredHostPort) {
            throw new Error(
                `Pagila container is already running on host port ${ready.hostPort}, but PAGILA_HOST_PORT=${configuredHostPort}.`
            );
        }
        return {
            connectionString: process.env.PAGILA_DATABASE_URL?.trim() || buildPagilaDatabaseUrl(ready.hostPort)
        };
    }

    await requireCommand('npm', ['--prefix', demosRoot, 'run', 'db:up'], {
        env: {
            ...process.env,
            PAGILA_HOST_PORT: startupHostPort
        }
    });

    const started = await inspectPagilaContainer();
    if (!started.running || started.health !== 'healthy') {
        throw new Error(`Pagila container is not healthy after startup (health: ${started.health}).`);
    }
    if (started.hostPort !== startupHostPort) {
        throw new Error(
            `Pagila container started on host port ${started.hostPort ?? 'unknown'}, expected ${startupHostPort}.`
        );
    }

    return {
        connectionString: process.env.PAGILA_DATABASE_URL?.trim() || buildPagilaDatabaseUrl(startupHostPort)
    };
}

function asRecord(value: unknown): Record<string, unknown> {
    expect(value).toBeTypeOf('object');
    expect(value).not.toBeNull();
    return value as Record<string, unknown>;
}

function restoreEnv(name: string, previousValue: string | undefined): void {
    if (previousValue === undefined) {
        delete process.env[name];
        return;
    }
    process.env[name] = previousValue;
}

describe('Pagila generated module direct invocation', () => {
    it('ensures Pagila in Docker, generates tools, and invokes table and SQL tools', async () => {
        const { connectionString } = await ensurePagilaDocker();
        const runRoot = await fs.mkdtemp(path.join(tmpRoot, 'pagila-direct-'));
        const generatedTsPath = path.join(runRoot, 'generated/tools/pagila-tools.ts');
        const generatedJsPath = path.join(runRoot, 'generated/tools/pagila-tools.mjs');
        const previousDatabaseUrl = process.env.PAGILA_DATABASE_URL;

        try {
            process.env.PAGILA_DATABASE_URL = connectionString;
            await generateAction(pagilaSourcePath, generatedTsPath);

            const imported = await import(`${pathToFileURL(generatedJsPath).href}?t=${Date.now()}`);
            const generated = readGeneratedModule(imported as Record<string, unknown>);
            generated.adapter.configureFromArgv([], [demosRoot]);
            generated.adapter.validateAtStartup(generated.requiresAuth === true);
            const hostContext = generated.adapter.resolveHostContext();

            const films = asRecord(await generated.invokeTool('listFilms', { limit: 5, offset: 0 }, hostContext));
            expect(films.rowCount).toBeGreaterThan(0);
            expect(films.rows).toBeInstanceOf(Array);

            const ratedFilms = asRecord(
                await generated.invokeTool('filmsByMpaaRating', { param1: 'PG', param2: '3' }, hostContext)
            );
            expect(ratedFilms.rowCount).toBeGreaterThan(0);
            expect(ratedFilms.rows).toBeInstanceOf(Array);
        } finally {
            restoreEnv('PAGILA_DATABASE_URL', previousDatabaseUrl);
            await fs.rm(runRoot, { recursive: true, force: true });
        }
    }, 180_000);
});
