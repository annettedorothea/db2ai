import { ensureDockerDatabase, type DockerDatabaseRuntime } from './docker.js';

function defaultPlantsPassword(): string {
    return process.env.PLANTS_ORACLE_PASSWORD?.trim() || 'PlantsDemo123';
}

function buildPlantsOracleUrl(hostPort: string): string {
    const password = encodeURIComponent(defaultPlantsPassword());
    return `oracle://plants:${password}@127.0.0.1:${hostPort}/FREEPDB1`;
}

export function ensurePlantsOracleDocker(demosRoot: string): Promise<DockerDatabaseRuntime> {
    return ensureDockerDatabase(demosRoot, {
        description: 'plants-oracle',
        containerName: 'db2ai-plants-oracle',
        containerPort: '1521',
        defaultHostPort: '55221',
        hostPortEnv: 'PLANTS_ORACLE_HOST_PORT',
        databaseUrlEnv: 'PLANTS_ORACLE_DATABASE_URL',
        composeUpScript: 'db:plants-oracle:up',
        readyWaitNpmScript: 'db:plants-oracle:wait',
        waitTimeoutMs: 600_000,
        buildConnectionString: buildPlantsOracleUrl
    });
}
