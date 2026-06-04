import { ensureDockerDatabase, type DockerDatabaseRuntime } from './docker.js';

function buildOrdersDemoDatabaseUrl(hostPort: string): string {
    return `postgresql://postgres:postgres@127.0.0.1:${hostPort}/orders_demo`;
}

export function ensureOrdersDemoDocker(demosRoot: string): Promise<DockerDatabaseRuntime> {
    return ensureDockerDatabase(demosRoot, {
        description: 'orders-demo',
        containerName: 'db2ai-orders-demo',
        containerPort: '5432',
        defaultHostPort: '55433',
        hostPortEnv: 'ORDERS_DEMO_HOST_PORT',
        databaseUrlEnv: 'ORDERS_DEMO_DATABASE_URL',
        composeUpScript: 'db:orders-demo:up',
        buildConnectionString: buildOrdersDemoDatabaseUrl
    });
}
