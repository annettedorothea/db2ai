import type { ResolvedDatabaseDialect } from 'db-2-ai-dsl-language';

function renderInlineJwtHelpers(): string {
    return `
function decodeJwtPayloadUnsafe(token: string): Record<string, unknown> {
    const parts = String(token).trim().split('.');
    if (parts.length !== 3) {
        throw new Error('credential is not a JWT (expected three dot-separated segments).');
    }
    let b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4 !== 0) {
        b64 += '=';
    }
    return JSON.parse(Buffer.from(b64, 'base64').toString('utf8')) as Record<string, unknown>;
}

function resolveCredentialFromEnv(authEnvKey: string | undefined): string | undefined {
    const key = authEnvKey?.trim();
    if (!key) {
        return undefined;
    }
    const value = process.env[key]?.trim();
    return value && value.length > 0 ? value : undefined;
}

function resolveCredentialAndOptionalJwt(authEnvKey: string | undefined): {
    credential?: string;
    jwt?: Record<string, unknown>;
} {
    const credential = resolveCredentialFromEnv(authEnvKey);
    if (!credential) {
        return {};
    }
    const segments = String(credential).trim().split('.');
    if (segments.length !== 3) {
        return { credential };
    }
    try {
        return { credential, jwt: decodeJwtPayloadUnsafe(credential) };
    } catch {
        return { credential };
    }
}
`;
}

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

export function renderDbMcpHostAdapterBlock(authKind: 'none' | 'credential', dialect: ResolvedDatabaseDialect): string {
    const isExpectedDatabaseUrlBody = renderIsExpectedDatabaseUrlCheck(dialect);
    const credentialResolve = renderCredentialResolve(authKind);
    const jwtHelpers = authKind === 'credential' ? renderInlineJwtHelpers() : '';

    return `${jwtHelpers}const META_AUTH_ENV_KEY = 'MCP_HOST_AUTH_ENV_KEY';
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
