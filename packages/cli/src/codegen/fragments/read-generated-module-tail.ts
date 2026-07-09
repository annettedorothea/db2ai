/** Tail of readGeneratedModule for db2ai tool modules. */
export function readGeneratedModuleTailFragment(): string {
    return `
    const connectionEnv = imported.connectionEnv;
    const verifyCredential = imported.verifyCredential;
    const verifyCredentialFn =
        typeof verifyCredential === 'function' ? (verifyCredential as VerifyCredentialFn) : undefined;
    const tokenExchange = imported.tokenExchange;
    const tokenExchangeFn =
        typeof tokenExchange === 'function' ? (tokenExchange as TokenExchangeFn) : undefined;
    return {
        generatedTools: generatedTools as Array<{
            toolName: string;
            title?: string;
            description: string;
            access?: string;
        }>,
        invokeTool: invokeTool as (
            toolName: string,
            args?: Record<string, unknown>,
            hostContext?: unknown
        ) => Promise<unknown>,
        inputZodByTool:
            inputZodByTool && typeof inputZodByTool === 'object' && !Array.isArray(inputZodByTool)
                ? (inputZodByTool as Record<string, unknown>)
                : undefined,
        mcpServerName: typeof mcpServerName === 'string' ? mcpServerName : undefined,
        mcpServerVersion: typeof mcpServerVersion === 'string' ? mcpServerVersion : undefined,
        mcpBuildGeneratedAt: typeof mcpBuildGeneratedAt === 'string' ? mcpBuildGeneratedAt : undefined,
        requiresAuth: imported.requiresAuth === true,
        connectionEnv: typeof connectionEnv === 'string' ? connectionEnv : undefined,
        databaseDialect: parseDatabaseDialect(imported.databaseDialect),
        verifyCredential: verifyCredentialFn,
        tokenExchange: tokenExchangeFn
    };`.trim();
}
