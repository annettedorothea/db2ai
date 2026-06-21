import { createRemoteJWKSet, jwtVerify } from 'jose';

export type ModuleCredentials = {
    customerId?: string;
    role?: string;
    sub?: string;
};

export class OrdersPostgresqlCredentials implements ModuleCredentials {
    readonly customerId?: string;
    readonly role?: string;
    readonly sub?: string;

    constructor(init: ModuleCredentials) {
        this.customerId = init.customerId;
        this.role = init.role;
        this.sub = init.sub;
    }

    toString(): string {
        const parts: string[] = [];
        if (this.customerId !== undefined) {
            parts.push(`customerId=${this.customerId}`);
        }
        if (this.role !== undefined) {
            parts.push(`role=${this.role}`);
        }
        if (this.sub !== undefined) {
            parts.push(`sub=${this.sub}`);
        }
        return parts.join(' ') || '[orders-postgresql credentials]';
    }
}

export function toOrdersPostgresqlCredentials(
    data: ModuleCredentials | Record<string, unknown>
): OrdersPostgresqlCredentials {
    const init: ModuleCredentials = {};
    for (const key of ['customerId', 'role', 'sub'] as const) {
        if (data[key] !== undefined) {
            init[key] = String(data[key]);
        }
    }
    return new OrdersPostgresqlCredentials(init);
}

export type VerifyCredentialInput = {
    inboundCredential: string;
};

export type VerifyCredentialResult = {
    upstreamCredential: string;
    credentials: OrdersPostgresqlCredentials;
};

const DEFAULT_HS256_SECRET = 'db2ai-orders-postgresql';

function resolveIssuer(): string | undefined {
    const issuer = process.env.OAUTH_ISSUER?.trim() || process.env.ORDERS_POSTGRESQL_OAUTH_IDP_URL?.trim();
    return issuer ? issuer.replace(/\/$/, '') : undefined;
}

function resolveHs256Secret(): string {
    return process.env.ORDERS_POSTGRESQL_JWT_SECRET?.trim() || DEFAULT_HS256_SECRET;
}

const jwksByIssuer = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function jwksForIssuer(issuer: string): ReturnType<typeof createRemoteJWKSet> {
    let jwks = jwksByIssuer.get(issuer);
    if (!jwks) {
        jwks = createRemoteJWKSet(new URL(`${issuer}/jwks`));
        jwksByIssuer.set(issuer, jwks);
    }
    return jwks;
}

function pickModuleCredentials(payload: Record<string, unknown>): ModuleCredentials {
    const data: ModuleCredentials = {};
    for (const key of ['customerId', 'role', 'sub'] as const) {
        if (payload[key] !== undefined) {
            data[key] = String(payload[key]);
        }
    }
    return data;
}

async function verifyOidcCredential(token: string, issuer: string): Promise<VerifyCredentialResult> {
    const verifyOptions: { issuer: string; audience?: string } = { issuer };
    const audience = process.env.OAUTH_AUDIENCE?.trim();
    if (audience) {
        verifyOptions.audience = audience;
    }
    const { payload } = await jwtVerify(token, jwksForIssuer(issuer), verifyOptions);
    const moduleCredentials = pickModuleCredentials(payload as Record<string, unknown>);
    return {
        upstreamCredential: token,
        credentials: toOrdersPostgresqlCredentials(moduleCredentials)
    };
}

async function verifyDemoHs256Credential(token: string): Promise<VerifyCredentialResult> {
    const secret = new TextEncoder().encode(resolveHs256Secret());
    const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] });
    const moduleCredentials = pickModuleCredentials(payload as Record<string, unknown>);
    return {
        upstreamCredential: token,
        credentials: toOrdersPostgresqlCredentials(moduleCredentials)
    };
}

export async function verifyOrdersPostgresqlCredentials(input: VerifyCredentialInput): Promise<VerifyCredentialResult> {
    const token = input.inboundCredential.trim();
    if (!token) {
        throw new Error('Missing credential.');
    }
    const issuer = resolveIssuer();
    if (issuer) {
        return verifyOidcCredential(token, issuer);
    }
    return verifyDemoHs256Credential(token);
}

export { verifyOrdersPostgresqlCredentials as verifyCredential, toOrdersPostgresqlCredentials as toModuleCredentials };
