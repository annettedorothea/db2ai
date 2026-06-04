#!/usr/bin/env node
/**
 * Mini OAuth 2.1 authorization server for MCP demos (mock-api).
 * Sync logic with api2ai shopping-api/oauth-idp/server.mjs — ports/secrets differ.
 */
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { createServer } from 'node:http';
import { getJwksDocument, mintCustomerToken } from './jwt.mjs';

const PORT = Number(process.env.ORDERS_DEMO_OAUTH_IDP_PORT) || 3862;
const CLIENT_ID = 'mcp-demo-local';
const CURSOR_REDIRECT = 'cursor://anysphere.cursor-mcp/oauth/callback';
const DEMO_USERS = [
    { customerId: 'alice', role: 'user', label: 'alice (user)' },
    { customerId: 'bob', role: 'user', label: 'bob (user)' },
    { customerId: 'admin', role: 'admin', label: 'admin' }
];

/** @type {Map<string, { customerId: string; role: string; redirectUri: string; codeChallenge: string; expiresAt: number }>} */
const pendingCodes = new Map();

function sendJson(res, status, body) {
    res.writeHead(status, { 'content-type': 'application/json' });
    res.end(JSON.stringify(body));
}

function readFormBody(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        req.on('data', (c) => chunks.push(c));
        req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
        req.on('error', reject);
    });
}

function parseFormUrlEncoded(text) {
    const out = new Map();
    for (const part of text.split('&')) {
        if (!part) {
            continue;
        }
        const [k, v = ''] = part.split('=');
        out.set(decodeURIComponent(k.replace(/\+/g, ' ')), decodeURIComponent(v.replace(/\+/g, ' ')));
    }
    return out;
}

function sha256Base64Url(value) {
    return createHash('sha256').update(value).digest('base64url');
}

function verifyPkce(codeVerifier, codeChallenge) {
    if (!codeVerifier || !codeChallenge) {
        return false;
    }
    if (codeChallenge.includes('.')) {
        return false;
    }
    const expected = sha256Base64Url(codeVerifier);
    try {
        const a = Buffer.from(expected);
        const b = Buffer.from(codeChallenge);
        return a.length === b.length && timingSafeEqual(a, b);
    } catch {
        return expected === codeChallenge;
    }
}

function issuerUrl(req) {
    return `http://127.0.0.1:${PORT}`;
}

function openIdConfigurationDocument(base) {
    return {
        issuer: base,
        authorization_endpoint: `${base}/authorize`,
        token_endpoint: `${base}/token`,
        jwks_uri: `${base}/jwks`,
        response_types_supported: ['code'],
        grant_types_supported: ['authorization_code'],
        code_challenge_methods_supported: ['S256'],
        token_endpoint_auth_methods_supported: ['none']
    };
}

function handleMetadata(req, res) {
    const base = issuerUrl(req);
    sendJson(res, 200, openIdConfigurationDocument(base));
}

function sendAuthorizeHelpPage(res, title) {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(
        `<!doctype html><html><body><h1>${title}</h1>` +
            '<p>Open login via <strong>Cursor MCP OAuth</strong> (&quot;Needs login&quot; on <code>orders-demo-oauth</code>), not by bookmarking <code>/authorize</code>.</p>' +
            '<p>Cursor sends <code>response_type=code</code>, <code>client_id=mcp-demo-local</code>, PKCE <code>code_challenge</code>, and redirect <code>cursor://anysphere.cursor-mcp/oauth/callback</code>.</p>' +
            '<p>Processes: <code>npm run demo:oauth-idp</code>, <code>npm run demo:mcp-oauth:orders-demo</code>, orders-demo Docker.</p>' +
            '</body></html>'
    );
}

function handleAuthorize(req, res, url) {
    const clientId = url.searchParams.get('client_id') ?? '';
    const redirectUri = url.searchParams.get('redirect_uri') ?? '';
    const state = url.searchParams.get('state') ?? '';
    const codeChallenge = url.searchParams.get('code_challenge') ?? '';
    const responseType = url.searchParams.get('response_type') ?? '';

    if (responseType !== 'code') {
        if (!responseType && !clientId && !redirectUri && !codeChallenge) {
            sendAuthorizeHelpPage(res, 'orders-demo OAuth IDP');
            return;
        }
        sendJson(res, 400, { error: 'unsupported_response_type', detail: responseType || '(missing)' });
        return;
    }
    if (clientId !== CLIENT_ID) {
        sendJson(res, 400, { error: 'invalid_client' });
        return;
    }
    if (redirectUri !== CURSOR_REDIRECT) {
        sendJson(res, 400, { error: 'invalid_redirect_uri', detail: redirectUri });
        return;
    }
    if (!codeChallenge) {
        sendJson(res, 400, { error: 'invalid_request', detail: 'code_challenge required' });
        return;
    }

    const pick = url.searchParams.get('customerId');
    if (!pick) {
        const links = DEMO_USERS.map(
            (u) =>
                `<li><a href="${url.pathname}?${new URLSearchParams({
                    ...Object.fromEntries(url.searchParams),
                    customerId: u.customerId
                }).toString()}">${u.label}</a></li>`
        ).join('');
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
        res.end(
            `<!doctype html><html><body><h1>orders-demo OAuth IDP</h1><p>Login as:</p><ul>${links}</ul></body></html>`
        );
        return;
    }

    const user = DEMO_USERS.find((u) => u.customerId === pick);
    if (!user) {
        sendJson(res, 404, { error: 'unknown_user' });
        return;
    }

    const code = randomBytes(24).toString('hex');
    pendingCodes.set(code, {
        customerId: user.customerId,
        role: user.role,
        redirectUri,
        codeChallenge,
        expiresAt: Date.now() + 5 * 60_000
    });

    const redirect = new URL(redirectUri);
    redirect.searchParams.set('code', code);
    if (state) {
        redirect.searchParams.set('state', state);
    }
    res.writeHead(302, { Location: redirect.toString() });
    res.end();
}

async function handleToken(req, res) {
    const raw = await readFormBody(req);
    const form = parseFormUrlEncoded(raw);
    const grantType = form.get('grant_type');
    if (grantType !== 'authorization_code') {
        sendJson(res, 400, { error: 'unsupported_grant_type' });
        return;
    }
    const code = form.get('code') ?? '';
    const redirectUri = form.get('redirect_uri') ?? '';
    const clientId = form.get('client_id') ?? '';
    const codeVerifier = form.get('code_verifier') ?? '';

    if (clientId !== CLIENT_ID) {
        sendJson(res, 400, { error: 'invalid_client' });
        return;
    }
    const pending = pendingCodes.get(code);
    if (!pending || pending.expiresAt < Date.now()) {
        pendingCodes.delete(code);
        sendJson(res, 400, { error: 'invalid_grant' });
        return;
    }
    if (redirectUri !== pending.redirectUri) {
        sendJson(res, 400, { error: 'invalid_grant', detail: 'redirect_uri mismatch' });
        return;
    }
    if (!verifyPkce(codeVerifier, pending.codeChallenge)) {
        sendJson(res, 400, { error: 'invalid_grant', detail: 'pkce verification failed' });
        return;
    }
    pendingCodes.delete(code);

    const accessToken = mintCustomerToken(pending.customerId, pending.role, 3600, issuerUrl(req));
    sendJson(res, 200, {
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: 3600
    });
}

const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', issuerUrl(req));

    if (
        (url.pathname === '/.well-known/oauth-authorization-server' ||
            url.pathname === '/.well-known/openid-configuration') &&
        req.method === 'GET'
    ) {
        handleMetadata(req, res);
        return;
    }
    if (url.pathname === '/jwks' && req.method === 'GET') {
        sendJson(res, 200, getJwksDocument());
        return;
    }
    if (url.pathname === '/authorize' && req.method === 'GET') {
        handleAuthorize(req, res, url);
        return;
    }
    if (url.pathname === '/token' && req.method === 'POST') {
        await handleToken(req, res);
        return;
    }
    if (url.pathname === '/register' && req.method === 'POST') {
        sendJson(res, 201, {
            client_id: CLIENT_ID,
            client_id_issued_at: Math.floor(Date.now() / 1000),
            redirect_uris: [CURSOR_REDIRECT],
            grant_types: ['authorization_code'],
            response_types: ['code'],
            token_endpoint_auth_method: 'none'
        });
        return;
    }

    sendJson(res, 404, { error: 'not_found' });
});

server.listen(PORT, '127.0.0.1', () => {
    console.error(`[orders-demo-oauth-idp] http://127.0.0.1:${PORT}`);
    console.error(`[orders-demo-oauth-idp] Cursor redirect: ${CURSOR_REDIRECT}`);
    console.error(`[orders-demo-oauth-idp] client_id: ${CLIENT_ID}`);
});
