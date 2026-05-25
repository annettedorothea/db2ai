import { spawn, type SpawnOptionsWithoutStdio } from 'node:child_process';

const DEFAULT_PAGILA_HOST_PORT = '55432';
const PAGILA_CONTAINER_NAME = 'db2ai-pagila';

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

export type PagilaDockerRuntime = {
    connectionString: string;
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

export async function ensurePagilaDocker(demosRoot: string): Promise<PagilaDockerRuntime> {
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
