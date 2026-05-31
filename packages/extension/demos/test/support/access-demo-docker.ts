import { ensureDockerDatabase, type DockerDatabaseRuntime } from './docker.js';

function buildAccessDemoDatabaseUrl(hostPort: string): string {
    return `postgresql://postgres:postgres@127.0.0.1:${hostPort}/access_demo`;
}

export function ensureAccessDemoDocker(demosRoot: string): Promise<DockerDatabaseRuntime> {
    return ensureDockerDatabase(demosRoot, {
        description: 'access-demo',
        containerName: 'db2ai-access-demo',
        containerPort: '5432',
        defaultHostPort: '55433',
        hostPortEnv: 'ACCESS_DEMO_HOST_PORT',
        databaseUrlEnv: 'ACCESS_DEMO_DATABASE_URL',
        composeUpScript: 'db:access-demo:up',
        buildConnectionString: buildAccessDemoDatabaseUrl
    });
}
