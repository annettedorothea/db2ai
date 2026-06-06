import { ensureDockerDatabase, type DockerDatabaseRuntime } from './docker.js';

function buildOrdersDatabaseUrl(hostPort: string): string {
    return `postgresql://postgres:postgres@127.0.0.1:${hostPort}/orders_database`;
}

export function ensureOrdersDatabaseDocker(demosRoot: string): Promise<DockerDatabaseRuntime> {
    return ensureDockerDatabase(demosRoot, {
        description: 'orders-database',
        containerName: 'db2ai-orders-database',
        containerPort: '5432',
        defaultHostPort: '55433',
        hostPortEnv: 'ORDERS_DATABASE_HOST_PORT',
        databaseUrlEnv: 'ORDERS_DATABASE_URL',
        composeUpScript: 'db:orders-database:up',
        buildConnectionString: buildOrdersDatabaseUrl
    });
}
