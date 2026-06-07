import { ensureDockerDatabase, type DockerDatabaseRuntime } from './docker.js';

function buildOrdersPostgresUrl(hostPort: string): string {
    return `postgresql://postgres:postgres@127.0.0.1:${hostPort}/orders_postgres`;
}

export function ensureOrdersPostgresDocker(demosRoot: string): Promise<DockerDatabaseRuntime> {
    return ensureDockerDatabase(demosRoot, {
        description: 'orders-postgres',
        containerName: 'db2ai-orders-postgres',
        containerPort: '5432',
        defaultHostPort: '55433',
        hostPortEnv: 'ORDERS_POSTGRES_HOST_PORT',
        databaseUrlEnv: 'ORDERS_POSTGRES_DATABASE_URL',
        composeUpScript: 'db:orders-postgres:up',
        buildConnectionString: buildOrdersPostgresUrl
    });
}
