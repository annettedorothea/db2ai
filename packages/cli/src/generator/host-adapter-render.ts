import type { ResolvedDatabaseDialect } from 'db-2-ai-dsl-language';

export const MCP_HOST_JWT_IMPORT = "import { resolveCredentialAndOptionalJwt } from '@core2ai/core/mcp-host';";

function renderIsExpectedDatabaseUrlCheck(dialect: ResolvedDatabaseDialect): string {
    if (dialect === 'mysql') {
        return `return connectionString.startsWith('mysql://');`;
    }
    return `return connectionString.startsWith('postgresql://') || connectionString.startsWith('postgres://');`;
}

function renderCredentialResolve(authKind: 'none' | 'credential'): string {
    if (authKind === 'credential') {
        return `
        const { credential, jwt } = resolveCredentialAndOptionalJwt(authKey);
        return { connectionString, databaseDialect, credential, jwt };`;
    }
    return `
        return { connectionString, databaseDialect, credential: undefined, jwt: undefined };`;
}

export function renderDbMcpHostAdapterBlock(
    authKind: 'none' | 'credential',
    dialect: ResolvedDatabaseDialect,
    typescript: boolean
): string {
    const isExpectedDatabaseUrlBody = renderIsExpectedDatabaseUrlCheck(dialect);
    const credentialResolve = renderCredentialResolve(authKind);

    if (typescript) {
        return `const META_AUTH_ENV_KEY = 'MCP_HOST_AUTH_ENV_KEY';
const META_ENV_DIRS = 'MCP_HOST_ENV_DIRS';

function applyHostEnvKeys(hostConfig: { authEnv?: string }, envDirs: string[]): void {
    if (hostConfig.authEnv) {
        process.env[META_AUTH_ENV_KEY] = hostConfig.authEnv;
    } else {
        delete process.env[META_AUTH_ENV_KEY];
    }
    if (envDirs.length > 0) {
        process.env[META_ENV_DIRS] = JSON.stringify(envDirs);
    } else {
        delete process.env[META_ENV_DIRS];
    }
}

function isExpectedDatabaseUrl(connectionString: string): boolean {
    ${isExpectedDatabaseUrlBody}
}

export const mcpHostAdapter = {
    configureFromArgv(argv: string[], envDirs: string[]): void {
        let authEnv: string | undefined;
        for (let i = 0; i < argv.length; i++) {
            const arg = argv[i];
            if (arg === '--auth-env') {
                authEnv = argv[++i];
                if (!authEnv) {
                    throw new Error('Missing value after --auth-env');
                }
                continue;
            }
            if (arg.startsWith('-')) {
                throw new Error('Unknown option: ' + arg);
            }
            throw new Error('Unexpected positional argument: ' + arg);
        }
        applyHostEnvKeys({ authEnv }, envDirs);
    },

    validateAtStartup(requiresAuth: boolean): void {
        const connectionString = process.env[connectionEnv]?.trim();
        if (!connectionString) {
            throw new Error(
                'Environment variable "' + connectionEnv + '" is missing or empty (database env from .db2ai).'
            );
        }
        if (!isExpectedDatabaseUrl(connectionString)) {
            throw new Error(
                'Environment variable "' +
                    connectionEnv +
                    '" does not match generated database dialect "' +
                    databaseDialect +
                    '".'
            );
        }
        if (!requiresAuth) {
            return;
        }
        const authEnvName = process.env[META_AUTH_ENV_KEY]?.trim();
        if (!authEnvName) {
            throw new Error(
                'Generated tools include protected or checked access; pass --auth-env <ENV_VAR_NAME> on the MCP host.'
            );
        }
        // Credential value may be empty at startup — public tools work without a token; protected/checked fail at invoke.
    },

    resolveHostContext(): DbHostContext {
        const connectionString = process.env[connectionEnv]?.trim();
        if (!connectionString) {
            throw new Error(
                'Missing database URL. Set environment variable "' + connectionEnv + '" (from database env in .db2ai).'
            );
        }
        if (!isExpectedDatabaseUrl(connectionString)) {
            throw new Error(
                'Database URL from "' + connectionEnv + '" does not match generated database dialect "' + databaseDialect + '".'
            );
        }

        const authKey = process.env[META_AUTH_ENV_KEY]?.trim();${credentialResolve}
    },

    envDirsForReload(): string[] {
        const raw = process.env[META_ENV_DIRS];
        if (!raw?.trim()) {
            return [];
        }
        try {
            const dirs: unknown = JSON.parse(raw);
            if (Array.isArray(dirs) && dirs.every((d) => typeof d === 'string')) {
                return dirs;
            }
        } catch {
            // ignore malformed config
        }
        return [];
    }
};
`;
    }

    return `const META_AUTH_ENV_KEY = 'MCP_HOST_AUTH_ENV_KEY';
const META_ENV_DIRS = 'MCP_HOST_ENV_DIRS';

function applyHostEnvKeys(hostConfig, envDirs) {
    if (hostConfig.authEnv) {
        process.env[META_AUTH_ENV_KEY] = hostConfig.authEnv;
    } else {
        delete process.env[META_AUTH_ENV_KEY];
    }
    if (envDirs.length > 0) {
        process.env[META_ENV_DIRS] = JSON.stringify(envDirs);
    } else {
        delete process.env[META_ENV_DIRS];
    }
}

function isExpectedDatabaseUrl(connectionString) {
    ${isExpectedDatabaseUrlBody}
}

export const mcpHostAdapter = {
    configureFromArgv(argv, envDirs) {
        let authEnv;
        for (let i = 0; i < argv.length; i++) {
            const arg = argv[i];
            if (arg === '--auth-env') {
                authEnv = argv[++i];
                if (!authEnv) {
                    throw new Error('Missing value after --auth-env');
                }
                continue;
            }
            if (arg.startsWith('-')) {
                throw new Error('Unknown option: ' + arg);
            }
            throw new Error('Unexpected positional argument: ' + arg);
        }
        applyHostEnvKeys({ authEnv }, envDirs);
    },

    validateAtStartup(requiresAuth) {
        const connectionString = process.env[connectionEnv]?.trim();
        if (!connectionString) {
            throw new Error(
                'Environment variable "' + connectionEnv + '" is missing or empty (database env from .db2ai).'
            );
        }
        if (!isExpectedDatabaseUrl(connectionString)) {
            throw new Error(
                'Environment variable "' +
                    connectionEnv +
                    '" does not match generated database dialect "' +
                    databaseDialect +
                    '".'
            );
        }
        if (!requiresAuth) {
            return;
        }
        const authEnvName = process.env[META_AUTH_ENV_KEY]?.trim();
        if (!authEnvName) {
            throw new Error(
                'Generated tools include protected or checked access; pass --auth-env <ENV_VAR_NAME> on the MCP host.'
            );
        }
        // Credential value may be empty at startup — public tools work without a token; protected/checked fail at invoke.
    },

    resolveHostContext() {
        const connectionString = process.env[connectionEnv]?.trim();
        if (!connectionString) {
            throw new Error(
                'Missing database URL. Set environment variable "' + connectionEnv + '" (from database env in .db2ai).'
            );
        }
        if (!isExpectedDatabaseUrl(connectionString)) {
            throw new Error(
                'Database URL from "' + connectionEnv + '" does not match generated database dialect "' + databaseDialect + '".'
            );
        }

        const authKey = process.env[META_AUTH_ENV_KEY]?.trim();${credentialResolve}
    },

    envDirsForReload() {
        const raw = process.env[META_ENV_DIRS];
        if (!raw?.trim()) {
            return [];
        }
        try {
            const dirs = JSON.parse(raw);
            if (Array.isArray(dirs) && dirs.every((d) => typeof d === 'string')) {
                return dirs;
            }
        } catch {
            // ignore malformed config
        }
        return [];
    }
};
`;
}
