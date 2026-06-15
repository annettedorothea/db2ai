import { ensureDockerDatabase, type DockerDatabaseRuntime } from './docker.js';

function buildAnimalsSqlserverUrl(hostPort: string): string {
    const password = process.env.ANIMALS_SQLSERVER_SA_PASSWORD?.trim();
    if (!password) {
        throw new Error('Missing ANIMALS_SQLSERVER_SA_PASSWORD for animals-sqlserver test fixture.');
    }
    const encoded = encodeURIComponent(password);
    return `sqlserver://sa:${encoded}@127.0.0.1:${hostPort}/animals?encrypt=true&trustServerCertificate=true`;
}

export function ensureAnimalsSqlserverDocker(demosRoot: string): Promise<DockerDatabaseRuntime> {
    return ensureDockerDatabase(demosRoot, {
        description: 'animals-sqlserver',
        containerName: 'db2ai-animals-sqlserver',
        containerPort: '1433',
        defaultHostPort: '55434',
        hostPortEnv: 'ANIMALS_SQLSERVER_HOST_PORT',
        databaseUrlEnv: 'ANIMALS_SQLSERVER_DATABASE_URL',
        composeDockerArgs: ['--profile', 'mssql', 'up', '-d', '--wait', 'animals-sqlserver'],
        postComposeNodeScripts: ['scripts/database/apply-animals-sqlserver-schema.mjs'],
        waitTimeoutMs: 180_000,
        buildConnectionString: buildAnimalsSqlserverUrl
    });
}
