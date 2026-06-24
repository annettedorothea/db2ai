import { createRemoteJWKSet, jwtVerify } from 'jose';
export class OrdersPostgresqlCredentials {
    constructor(init) {
        this.customerId = init.customerId;
        this.role = init.role;
        this.sub = init.sub;
    }
    toString() {
        const parts = [];
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
export function toOrdersPostgresqlCredentials(data) {
    const init = {};
    for (const key of ['customerId', 'role', 'sub']) {
        if (data[key] !== undefined) {
            init[key] = String(data[key]);
        }
    }
    return new OrdersPostgresqlCredentials(init);
}
const DEFAULT_HS256_SECRET = 'db2ai-orders-postgresql';
function resolveIssuer() {
    const issuer = process.env.OAUTH_ISSUER?.trim() || process.env.ORDERS_POSTGRESQL_OAUTH_IDP_URL?.trim();
    return issuer ? issuer.replace(/\/$/, '') : undefined;
}
function resolveHs256Secret() {
    return process.env.ORDERS_POSTGRESQL_JWT_SECRET?.trim() || DEFAULT_HS256_SECRET;
}
const jwksByIssuer = new Map();
function jwksForIssuer(issuer) {
    let jwks = jwksByIssuer.get(issuer);
    if (!jwks) {
        jwks = createRemoteJWKSet(new URL(`${issuer}/jwks`));
        jwksByIssuer.set(issuer, jwks);
    }
    return jwks;
}
function pickModuleCredentials(payload) {
    const data = {};
    for (const key of ['customerId', 'role', 'sub']) {
        if (payload[key] !== undefined) {
            data[key] = String(payload[key]);
        }
    }
    return data;
}
async function verifyOidcCredential(token, issuer) {
    const verifyOptions = { issuer };
    const audience = process.env.OAUTH_AUDIENCE?.trim();
    if (audience) {
        verifyOptions.audience = audience;
    }
    const { payload } = await jwtVerify(token, jwksForIssuer(issuer), verifyOptions);
    const moduleCredentials = pickModuleCredentials(payload);
    return {
        upstreamCredential: token,
        credentials: toOrdersPostgresqlCredentials(moduleCredentials)
    };
}
async function verifyDemoHs256Credential(token) {
    const secret = new TextEncoder().encode(resolveHs256Secret());
    const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] });
    const moduleCredentials = pickModuleCredentials(payload);
    return {
        upstreamCredential: token,
        credentials: toOrdersPostgresqlCredentials(moduleCredentials)
    };
}
export async function verifyOrdersPostgresqlCredentials(input) {
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
