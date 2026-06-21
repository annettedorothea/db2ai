// Sync with api2ai oauth-idp/jwt.mjs — ports/secrets differ per product.
import { createHmac, randomBytes } from 'node:crypto';

const DEFAULT_SECRET = 'db2ai-orders-postgresql';

export function jwtSecret() {
    return process.env.ORDERS_POSTGRESQL_JWT_SECRET?.trim() || DEFAULT_SECRET;
}

function base64urlEncode(buf) {
    return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/u, '');
}

function base64urlDecodeJson(segment) {
    let b64 = segment.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4 !== 0) {
        b64 += '=';
    }
    return JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
}

export function signJwt(payload, secret = jwtSecret()) {
    const header = { alg: 'HS256', typ: 'JWT' };
    const headerSeg = base64urlEncode(Buffer.from(JSON.stringify(header)));
    const payloadSeg = base64urlEncode(Buffer.from(JSON.stringify(payload)));
    const signingInput = `${headerSeg}.${payloadSeg}`;
    const sig = createHmac('sha256', secret).update(signingInput).digest();
    return `${signingInput}.${base64urlEncode(sig)}`;
}

export function verifyJwt(token, secret = jwtSecret()) {
    const parts = String(token).trim().split('.');
    if (parts.length !== 3) {
        return { ok: false, error: 'invalid_format' };
    }
    const [headerSeg, payloadSeg, sigSeg] = parts;
    const signingInput = `${headerSeg}.${payloadSeg}`;
    const expected = createHmac('sha256', secret).update(signingInput).digest();
    const actual = Buffer.from(sigSeg.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
    if (actual.length !== expected.length || !actual.equals(expected)) {
        return { ok: false, error: 'bad_signature' };
    }
    let payload;
    try {
        payload = base64urlDecodeJson(payloadSeg);
    } catch {
        return { ok: false, error: 'bad_payload' };
    }
    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.exp === 'number' && payload.exp < now) {
        return { ok: false, error: 'expired' };
    }
    return { ok: true, payload };
}

export { getJwksDocument, mintCustomerToken, signJwtRs256 } from './signing.mjs';
