import { ensureDockerDatabase, type DockerDatabaseRuntime } from './docker.js';

function defaultSaPassword(): string {
    return process.env.ANIMALS_SQLSERVER_SA_PASSWORD?.trim() || 'YourStrong!Passw0rd';
}

function buildAnimalsSqlserverUrl(hostPort: string): string {
    const password = encodeURIComponent(defaultSaPassword());
    return `sqlserver://sa:${password}@127.0.0.1:${hostPort}/animals?encrypt=true&trustServerCertificate=true`;
}

export function ensureAnimalsSqlserverDocker(demosRoot: string): Promise<DockerDatabaseRuntime> {
    return ensureDockerDatabase(demosRoot, {
        description: 'animals-sqlserver',
        containerName: 'db2ai-animals-sqlserver',
        containerPort: '1433',
        defaultHostPort: '55434',
        hostPortEnv: 'ANIMALS_SQLSERVER_HOST_PORT',
        databaseUrlEnv: 'ANIMALS_SQLSERVER_DATABASE_URL',
        composeUpScript: 'db:animals-sqlserver:up',
        waitTimeoutMs: 180_000,
        buildConnectionString: buildAnimalsSqlserverUrl
    });
}
