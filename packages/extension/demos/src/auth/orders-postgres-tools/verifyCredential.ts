import { createRemoteJWKSet, jwtVerify } from 'jose';

export type VerifyCredentialInput = {
    inboundCredential: string;
};

export type VerifyCredentialResult = {
    upstreamCredential: string;
    sessionClaims?: Record<string, unknown>;
};

const DEFAULT_HS256_SECRET = 'db2ai-orders-postgres';

function resolveIssuer(): string | undefined {
    const issuer = process.env.OAUTH_ISSUER?.trim() || process.env.ORDERS_POSTGRES_OAUTH_IDP_URL?.trim();
    return issuer ? issuer.replace(/\/$/, '') : undefined;
}

function resolveHs256Secret(): string {
    return process.env.ORDERS_POSTGRES_JWT_SECRET?.trim() || DEFAULT_HS256_SECRET;
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

function pickSessionClaims(payload: Record<string, unknown>): Record<string, unknown> {
    const claims: Record<string, unknown> = {};
    for (const key of ['customerId', 'role', 'sub']) {
        if (payload[key] !== undefined) {
            claims[key] = payload[key];
        }
    }
    return claims;
}

async function verifyOidcCredential(token: string, issuer: string): Promise<VerifyCredentialResult> {
    const verifyOptions: { issuer: string; audience?: string } = { issuer };
    const audience = process.env.OAUTH_AUDIENCE?.trim();
    if (audience) {
        verifyOptions.audience = audience;
    }
    const { payload } = await jwtVerify(token, jwksForIssuer(issuer), verifyOptions);
    const sessionClaims = pickSessionClaims(payload as Record<string, unknown>);
    return { upstreamCredential: token, sessionClaims };
}

async function verifyDemoHs256Credential(token: string): Promise<VerifyCredentialResult> {
    const secret = new TextEncoder().encode(resolveHs256Secret());
    const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] });
    const sessionClaims = pickSessionClaims(payload as Record<string, unknown>);
    return { upstreamCredential: token, sessionClaims };
}

export async function verifyCredential(input: VerifyCredentialInput): Promise<VerifyCredentialResult> {
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
