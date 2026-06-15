import { ensureDockerDatabase, type DockerDatabaseRuntime } from './docker.js';

function buildSakilaDatabaseUrl(hostPort: string): string {
    return `mysql://sakila:p_ssW0rd@127.0.0.1:${hostPort}/sakila`;
}

export function ensureSakilaDocker(demosRoot: string): Promise<DockerDatabaseRuntime> {
    return ensureDockerDatabase(demosRoot, {
        description: 'Sakila',
        containerName: 'db2ai-sakila',
        containerPort: '3306',
        defaultHostPort: '53306',
        hostPortEnv: 'SAKILA_HOST_PORT',
        databaseUrlEnv: 'SAKILA_DATABASE_URL',
        composeDockerArgs: ['up', '-d', '--wait', 'sakila'],
        waitTimeoutMs: 120_000,
        buildConnectionString: buildSakilaDatabaseUrl
    });
}
