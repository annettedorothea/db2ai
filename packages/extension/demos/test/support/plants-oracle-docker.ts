import { ensureDockerDatabase, type DockerDatabaseRuntime } from './docker.js';

function buildPlantsOracleUrl(hostPort: string): string {
    const configured = process.env.PLANTS_ORACLE_DATABASE_URL?.trim();
    if (configured) {
        return configured.replace(/localhost:\d+/, `127.0.0.1:${hostPort}`);
    }
    throw new Error('Missing PLANTS_ORACLE_DATABASE_URL for plants-oracle test fixture.');
}

export function ensurePlantsOracleDocker(demosRoot: string): Promise<DockerDatabaseRuntime> {
    return ensureDockerDatabase(demosRoot, {
        description: 'plants-oracle',
        containerName: 'db2ai-plants-oracle',
        containerPort: '1521',
        defaultHostPort: '55221',
        hostPortEnv: 'PLANTS_ORACLE_HOST_PORT',
        databaseUrlEnv: 'PLANTS_ORACLE_DATABASE_URL',
        composeDockerArgs: ['--profile', 'oracle', 'up', '-d', 'plants-oracle'],
        readyWaitNodeScript: 'scripts/database/wait-plants-oracle.mjs',
        postComposeNodeScripts: ['scripts/database/apply-plants-oracle-schema.mjs'],
        waitTimeoutMs: 600_000,
        buildConnectionString: buildPlantsOracleUrl
    });
}
