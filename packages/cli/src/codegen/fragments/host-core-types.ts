/** db2ai host types embedded in generated MCP runtimes. */
export function hostCoreTypesFragment(): string {
    return `
type DatabaseDialect = 'postgres' | 'mysql' | 'mariadb' | 'sqlserver' | 'oracle';

/** Host context inside MCP server templates. Tool modules use DbHostContext; this wider shape is shared across stdio/HTTP hosts. */
type ApiLikeHostContext = {
    baseUrl?: string;
    connectionString?: string;
    databaseDialect?: DatabaseDialect;
    credential?: string;
};

type VerifyCredentialFn = (credential: string) => void | Promise<void>;

type TokenExchangeFn = (idpCredential: string) => Promise<string>;

type GeneratedHostModule = {
    generatedTools: Array<{ toolName: string; title?: string; description: string; access?: string }>;
    invokeTool: (
        toolName: string,
        args?: Record<string, unknown>,
        hostContext?: unknown
    ) => Promise<unknown>;
    inputZodByTool?: Record<string, unknown>;
    mcpServerName?: string;
    mcpServerVersion?: string;
    mcpBuildGeneratedAt?: string;
    requiresAuth: boolean;
    connectionEnv?: string;
    databaseDialect?: DatabaseDialect;
    verifyCredential?: VerifyCredentialFn;
    tokenExchange?: TokenExchangeFn;
};`.trim();
}

export function dbHelperFunctionsFragment(): string {
    return `
function parseDatabaseDialect(value: unknown): DatabaseDialect | undefined {
    return value === 'postgres' || value === 'mysql' || value === 'mariadb' || value === 'sqlserver' || value === 'oracle'
        ? value
        : undefined;
}

function isExpectedDatabaseUrl(connectionString: string, dialect: DatabaseDialect): boolean {
    if (dialect === 'mysql') {
        return connectionString.startsWith('mysql://');
    }
    if (dialect === 'mariadb') {
        return connectionString.startsWith('mariadb://');
    }
    if (dialect === 'sqlserver') {
        return (
            connectionString.startsWith('sqlserver://') ||
            connectionString.startsWith('mssql://') ||
            /^Server=/i.test(connectionString)
        );
    }
    if (dialect === 'oracle') {
        return connectionString.startsWith('oracle://');
    }
    return connectionString.startsWith('postgresql://') || connectionString.startsWith('postgres://');
}`.trim();
}
