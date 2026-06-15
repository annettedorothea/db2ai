import { ensureDockerDatabase, type DockerDatabaseRuntime } from './docker.js';

function buildPagilaDatabaseUrl(hostPort: string): string {
    return `postgres://postgres:postgres@127.0.0.1:${hostPort}/pagila`;
}

export function ensurePagilaDocker(demosRoot: string): Promise<DockerDatabaseRuntime> {
    return ensureDockerDatabase(demosRoot, {
        description: 'Pagila',
        containerName: 'db2ai-pagila',
        containerPort: '5432',
        defaultHostPort: '55432',
        hostPortEnv: 'PAGILA_HOST_PORT',
        databaseUrlEnv: 'PAGILA_DATABASE_URL',
        composeDockerArgs: ['up', '-d', '--wait', 'pagila'],
        buildConnectionString: buildPagilaDatabaseUrl
    });
}
