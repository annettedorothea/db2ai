import { createPublicKey, createSign, randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { signJwt } from './jwt.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEMO_KID = 'demo-rs256';

let privateKeyPem;

function getPrivateKeyPem() {
    if (!privateKeyPem) {
        privateKeyPem = readFileSync(join(__dirname, 'demo-rsa-private.pem'), 'utf8');
    }
    return privateKeyPem;
}

function base64urlEncode(value) {
    const buf = typeof value === 'string' ? Buffer.from(value, 'utf8') : Buffer.from(value);
    return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/u, '');
}

export function signJwtRs256(payload) {
    const header = { alg: 'RS256', typ: 'JWT', kid: DEMO_KID };
    const headerSeg = base64urlEncode(JSON.stringify(header));
    const payloadSeg = base64urlEncode(JSON.stringify(payload));
    const signingInput = `${headerSeg}.${payloadSeg}`;
    const signer = createSign('RSA-SHA256');
    signer.update(signingInput);
    signer.end();
    const sig = signer.sign(getPrivateKeyPem());
    return `${signingInput}.${base64urlEncode(sig)}`;
}

export function getJwksDocument() {
    const pub = createPublicKey(getPrivateKeyPem());
    const jwk = pub.export({ format: 'jwk' });
    return {
        keys: [
            {
                ...jwk,
                alg: 'RS256',
                use: 'sig',
                kid: DEMO_KID
            }
        ]
    };
}

export function mintCustomerToken(customerId, role = 'user', ttlSeconds = 3600, issuer) {
    const now = Math.floor(Date.now() / 1000);
    const payload = {
        customerId: String(customerId),
        role: String(role),
        iat: now,
        exp: now + ttlSeconds,
        jti: randomBytes(8).toString('hex')
    };
    if (issuer) {
        payload.iss = issuer;
    }
    if (process.env.OAUTH_IDP_SIGN_ALG === 'RS256') {
        return signJwtRs256(payload);
    }
    return signJwt(payload);
}
