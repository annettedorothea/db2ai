export function validateOAuthHttpHostAtStartupFragment(): string {
    return `
function validateOAuthHttpHostAtStartup(
    httpHostConfig: OAuthHttpHostRuntimeConfig,
    generated: GeneratedHostModule
): void {
    if (generated.connectionEnv) {
        const connectionString = process.env[generated.connectionEnv]?.trim();
        if (!connectionString) {
            throw new Error(
                'Environment variable "' + generated.connectionEnv + '" is missing or empty (database env from .db2ai).'
            );
        }
        const dialect: DatabaseDialect = generated.databaseDialect ?? 'postgres';
        if (!isExpectedDatabaseUrl(connectionString, dialect)) {
            throw new Error(
                'Environment variable "' +
                    generated.connectionEnv +
                    '" does not match generated database dialect "' +
                    dialect +
                    '".'
            );
        }
    } else {
    const baseUrlKey = httpHostConfig.baseUrlEnvKey?.trim();
    if (!baseUrlKey) {
        throw new Error('Required: --base-url-env <ENV_VAR_NAME>');
    }
    const baseUrl = process.env[baseUrlKey]?.trim();
    if (!baseUrl) {
        throw new Error(
            'Environment variable "' + baseUrlKey + '" is missing or empty (required by --base-url-env).'
        );
    }
    }
}`.trim();
}

export function oauthHostContextBaseUrlFieldsFragment(): string {
    return `
function oauthHostContextBaseUrlFields(
    httpHostConfig: OAuthHttpHostRuntimeConfig,
    generated: GeneratedHostModule
): Pick<ApiLikeHostContext, 'baseUrl'> {
    if (generated.connectionEnv) {
        return {};
    }
    return { baseUrl: resolveOAuthHostBaseUrl(httpHostConfig) };
}`.trim();
}

function enrichDbHostContextFragment(): string {
    return `
function enrichDbHostContext(generated: GeneratedHostModule, context: ApiLikeHostContext): ApiLikeHostContext {
    if (!generated.connectionEnv) {
        return context;
    }
    const connectionString = process.env[generated.connectionEnv]?.trim();
    if (!connectionString) {
        throw new Error(
            'Missing database URL. Set environment variable "' + generated.connectionEnv + '" (from .db2ai).'
        );
    }
    const dialect: DatabaseDialect = generated.databaseDialect ?? 'postgres';
    if (!isExpectedDatabaseUrl(connectionString, dialect)) {
        throw new Error(
            'Database URL from "' + generated.connectionEnv + '" does not match dialect "' + dialect + '".'
        );
    }
    return { ...context, connectionString, databaseDialect: dialect };
}`.trim();
}

export function resolveHostContextForOAuthSessionFragment(): string {
    return `${enrichDbHostContextFragment()}

async function resolveHostContextForOAuthSession(
    httpHostConfig: OAuthHttpHostRuntimeConfig,
    generated: GeneratedHostModule,
    headers: Record<string, string | string[] | undefined>,
    sessionStore: Map<string, McpOAuthSession>,
    sessionId: string | undefined
): Promise<ApiLikeHostContext> {
    const apiFields = oauthHostContextBaseUrlFields(httpHostConfig, generated);
    let session = sessionId ? sessionStore.get(sessionId) : undefined;
    if (sessionId && !session) {
        session = { sessionId, createdAt: Date.now() };
        sessionStore.set(sessionId, session);
    }

    const bearer = readBearerFromHeaders(headers);
    const inbound = bearer?.trim();

    if (
        session?.exchangedAt &&
        session.credential &&
        (!inbound || session.sourceCredential === inbound)
    ) {
        return enrichDbHostContext(generated, {
            ...apiFields,
            credential: session.credential
        });
    }

    if (!inbound) {
        if (session?.credential) {
            return enrichDbHostContext(generated, {
                ...apiFields,
                credential: session.credential
            });
        }
        return enrichDbHostContext(generated, { ...apiFields });
    }

    const credential = await resolveOAuthSessionCredential(generated, inbound, session);

    return enrichDbHostContext(generated, {
        ...apiFields,
        credential
    });
}`.trim();
}

export function requireBaseUrlEnvArgvCheckFragment(hostConfigExpr: string): string {
    return `if (!generated.connectionEnv && !${hostConfigExpr}) {
        throw new Error(
            'Required: --base-url-env <ENV_VAR_NAME> for HTTP/OpenAPI tools, or export connectionEnv from a .db2ai module.'
        );
    }`;
}
