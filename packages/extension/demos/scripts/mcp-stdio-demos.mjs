/**
 * Stdio MCP demo hosts (db2ai) — keys match .cursor/mcp.json server names.
 */
import path from 'node:path';

export const STDIO_DEMOS = {
    'animals-sqlserver': {
        tools: 'animals-sqlserver-tools.js',
        connectionEnv: 'ANIMALS_SQLSERVER_DATABASE_URL',
        defaultConnection:
            'sqlserver://sa:YourStrong!Passw0rd@localhost:55434/animals?encrypt=true&trustServerCertificate=true',
        prerequisite: 'Docker animals-sqlserver (npm run db:animals-sqlserver:up)'
    },
    'plants-oracle': {
        tools: 'plants-oracle-tools.js',
        connectionEnv: 'PLANTS_ORACLE_DATABASE_URL',
        defaultConnection: 'oracle://plants:PlantsDemo123@localhost:55221/FREEPDB1',
        prerequisite: 'Docker plants-oracle (npm run start / db:plants-oracle:up; docker login container-registry.oracle.com once)'
    }
};

export const STDIO_DEMO_NAMES = Object.keys(STDIO_DEMOS);

/**
 * @param {string} name
 * @param {string} demosRoot
 * @param {NodeJS.ProcessEnv} env
 */
export function buildStdioHostLaunch(name, demosRoot, env) {
    const demo = STDIO_DEMOS[name];
    if (!demo) {
        throw new Error(`Unknown stdio demo: ${name}`);
    }
    if (demo.defaultConnection && !env[demo.connectionEnv]?.trim()) {
        env[demo.connectionEnv] = demo.defaultConnection;
    }
    const connectionString = env[demo.connectionEnv]?.trim();
    if (!connectionString) {
        throw new Error(
            `Missing ${demo.connectionEnv} for ${name}. ${demo.prerequisite ?? 'Set connection URL in .env'}.`
        );
    }
    const hostJs = path.join(demosRoot, 'generated/cli/stdio-mcp-server.js');
    const toolsJs = path.join(demosRoot, 'generated/tools', demo.tools);
    return { demo, args: [hostJs, toolsJs], connectionString };
}
