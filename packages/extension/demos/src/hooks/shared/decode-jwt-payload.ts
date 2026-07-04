import { createRemoteJWKSet, jwtVerify } from 'jose';

export type JwtClaims = {
    customerId?: string;
    role?: string;
    sub?: string;
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

function pickJwtClaims(payload: Record<string, unknown>): JwtClaims {
    const data: JwtClaims = {};
    for (const key of ['customerId', 'role', 'sub'] as const) {
        if (payload[key] !== undefined) {
            data[key] = String(payload[key]);
        }
    }
    return data;
}

/** Verify and decode a orders-postgresql demo JWT from the raw MCP credential. */
export async function decodeJwtPayload(credential: string): Promise<JwtClaims> {
    const token = credential.trim();
    if (!token) {
        throw new Error('Missing credential.');
    }
    const issuer = resolveIssuer();
    if (issuer) {
        const verifyOptions: { issuer: string; audience?: string } = { issuer };
        const audience = process.env.OAUTH_AUDIENCE?.trim();
        if (audience) {
            verifyOptions.audience = audience;
        }
        const { payload } = await jwtVerify(token, jwksForIssuer(issuer), verifyOptions);
        return pickJwtClaims(payload as Record<string, unknown>);
    }
    const secret = new TextEncoder().encode(resolveHs256Secret());
    const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] });
    return pickJwtClaims(payload as Record<string, unknown>);
}
