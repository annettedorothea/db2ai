import { spawn, type SpawnOptionsWithoutStdio } from 'node:child_process';

export type CommandResult = {
    stdout: string;
    stderr: string;
    exitCode: number | null;
};

export type DockerContainerState = {
    exists: boolean;
    running: boolean;
    health: string;
    hostPort?: string;
};

export type DockerDatabaseRuntime = {
    connectionString: string;
};

export type DockerDatabaseConfig = {
    description: string;
    containerName: string;
    containerPort: string;
    defaultHostPort: string;
    hostPortEnv: string;
    databaseUrlEnv: string;
    composeUpScript: string;
    waitTimeoutMs?: number;
    buildConnectionString: (hostPort: string) => string;
};

export function runCommand(
    command: string,
    args: string[],
    options: SpawnOptionsWithoutStdio = {}
): Promise<CommandResult> {
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

export async function requireCommand(
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

export async function inspectDockerContainer(
    containerName: string,
    containerPort: string
): Promise<DockerContainerState> {
    const inspect = await runCommand('docker', [
        'inspect',
        '--format',
        '{{.State.Running}} {{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}',
        containerName
    ]);
    if (inspect.exitCode !== 0) {
        return { exists: false, running: false, health: 'missing' };
    }

    const [runningRaw, healthRaw] = inspect.stdout.trim().split(/\s+/);
    const port = await runCommand('docker', ['port', containerName, `${containerPort}/tcp`]);
    return {
        exists: true,
        running: runningRaw === 'true',
        health: healthRaw ?? 'none',
        hostPort: port.exitCode === 0 ? parsePublishedHostPort(port.stdout) : undefined
    };
}

export async function waitForHealthyDockerContainer(
    containerName: string,
    containerPort: string,
    description: string,
    timeoutMs = 90_000
): Promise<DockerContainerState> {
    const deadline = Date.now() + timeoutMs;
    let current = await inspectDockerContainer(containerName, containerPort);
    while (Date.now() < deadline) {
        if (current.running && current.health === 'healthy') {
            return current;
        }
        await new Promise((resolve) => setTimeout(resolve, 1_000));
        current = await inspectDockerContainer(containerName, containerPort);
    }
    throw new Error(`${description} container exists but did not become healthy (health: ${current.health}).`);
}

function configuredHostPort(envName: string): string | undefined {
    const configured = process.env[envName]?.trim();
    return configured && configured.length > 0 ? configured : undefined;
}

function configuredDatabaseUrl(envName: string): string | undefined {
    const configured = process.env[envName]?.trim();
    return configured && configured.length > 0 ? configured : undefined;
}

export async function ensureDockerDatabase(
    demosRoot: string,
    config: DockerDatabaseConfig
): Promise<DockerDatabaseRuntime> {
    const configuredPort = configuredHostPort(config.hostPortEnv);
    const startupHostPort = configuredPort ?? config.defaultHostPort;

    await requireCommand('docker', ['info']);

    const current = await inspectDockerContainer(config.containerName, config.containerPort);
    if (current.exists) {
        if (!current.running) {
            await requireCommand('docker', ['start', config.containerName]);
        }
        const ready = await waitForHealthyDockerContainer(
            config.containerName,
            config.containerPort,
            config.description,
            config.waitTimeoutMs
        );
        if (!ready.hostPort) {
            throw new Error(
                `${config.description} container is healthy, but its published host port could not be detected.`
            );
        }
        if (configuredPort !== undefined && ready.hostPort !== configuredPort) {
            throw new Error(
                `${config.description} container is already running on host port ${ready.hostPort}, but ${config.hostPortEnv}=${configuredPort}.`
            );
        }
        return {
            connectionString:
                configuredDatabaseUrl(config.databaseUrlEnv) ?? config.buildConnectionString(ready.hostPort)
        };
    }

    const composeResult = await runCommand('npm', ['--prefix', demosRoot, 'run', config.composeUpScript], {
        env: {
            ...process.env,
            [config.hostPortEnv]: startupHostPort
        }
    });
    if (composeResult.exitCode !== 0) {
        const output = `${composeResult.stdout}\n${composeResult.stderr}`;
        const raced = /already in use|Conflict/i.test(output);
        const afterRace = await inspectDockerContainer(config.containerName, config.containerPort);
        if (!raced || !afterRace.exists) {
            throw new Error(
                [
                    `Command failed (${composeResult.exitCode}): npm --prefix ${demosRoot} run ${config.composeUpScript}`,
                    composeResult.stdout.trim(),
                    composeResult.stderr.trim()
                ]
                    .filter((line) => line.length > 0)
                    .join('\n')
            );
        }
        if (!afterRace.running) {
            await requireCommand('docker', ['start', config.containerName]);
        }
    }

    const ready = await waitForHealthyDockerContainer(
        config.containerName,
        config.containerPort,
        config.description,
        config.waitTimeoutMs
    );
    if (!ready.hostPort) {
        throw new Error(
            `${config.description} container is healthy, but its published host port could not be detected.`
        );
    }
    if (configuredPort !== undefined && ready.hostPort !== configuredPort) {
        throw new Error(
            `${config.description} container is already running on host port ${ready.hostPort}, but ${config.hostPortEnv}=${configuredPort}.`
        );
    }
    const hostPort = ready.hostPort ?? startupHostPort;
    if (configuredPort === undefined && ready.hostPort !== startupHostPort) {
        throw new Error(
            `${config.description} container started on host port ${ready.hostPort ?? 'unknown'}, expected ${startupHostPort}.`
        );
    }

    return {
        connectionString: configuredDatabaseUrl(config.databaseUrlEnv) ?? config.buildConnectionString(hostPort)
    };
}
