import { createHash, randomBytes } from 'node:crypto';
import { spawn, type ChildProcess } from 'node:child_process';
import path from 'node:path';
import { demosRoot } from './paths.js';

export async function fetchOAuthTokenFromIdp(idpBaseUrl: string, customerId: string): Promise<string> {
    const verifier = randomBytes(32).toString('base64url');
    const challenge = createHash('sha256').update(verifier).digest('base64url');
    const authorize = new URL(`${idpBaseUrl.replace(/\/$/, '')}/authorize`);
    authorize.searchParams.set('response_type', 'code');
    authorize.searchParams.set('client_id', 'mcp-demo-local');
    authorize.searchParams.set('redirect_uri', 'cursor://anysphere.cursor-mcp/oauth/callback');
    authorize.searchParams.set('code_challenge', challenge);
    authorize.searchParams.set('code_challenge_method', 'S256');
    authorize.searchParams.set('state', 'test');
    authorize.searchParams.set('customerId', customerId);

    const authRes = await fetch(authorize, { redirect: 'manual' });
    if (authRes.status < 300 || authRes.status >= 400) {
        throw new Error(`authorize failed: HTTP ${authRes.status}`);
    }
    const location = authRes.headers.get('location');
    if (!location) {
        throw new Error('authorize missing Location header');
    }
    const code = new URL(location).searchParams.get('code');
    if (!code) {
        throw new Error('authorize redirect missing code');
    }

    const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: 'cursor://anysphere.cursor-mcp/oauth/callback',
        client_id: 'mcp-demo-local',
        code_verifier: verifier
    });
    const tokenRes = await fetch(`${idpBaseUrl.replace(/\/$/, '')}/token`, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body
    });
    if (!tokenRes.ok) {
        throw new Error(`token failed: HTTP ${tokenRes.status} ${await tokenRes.text()}`);
    }
    const json = (await tokenRes.json()) as { access_token?: string };
    if (!json.access_token) {
        throw new Error('token response missing access_token');
    }
    return json.access_token;
}

export function startOAuthIdpServer(
    serverRelativePath: string,
    port: number,
    env: Record<string, string | undefined> = {}
): ChildProcess {
    const serverPath = path.join(demosRoot, serverRelativePath);
    return spawn(process.execPath, [serverPath], {
        cwd: demosRoot,
        env: { ...process.env, ...env },
        stdio: ['ignore', 'pipe', 'pipe']
    });
}

export async function waitForOAuthIdp(idpBaseUrl: string, child: ChildProcess | undefined): Promise<void> {
    const deadline = Date.now() + 10_000;
    const discoveryUrl = `${idpBaseUrl.replace(/\/$/, '')}/.well-known/oauth-authorization-server`;
    let lastError: unknown;
    while (Date.now() < deadline) {
        if (child?.exitCode !== null && child?.exitCode !== undefined) {
            throw new Error(`OAuth IdP exited before startup with code ${child.exitCode}.`);
        }
        try {
            const response = await fetch(discoveryUrl);
            if (response.ok) {
                return;
            }
            lastError = new Error(`HTTP ${response.status}`);
        } catch (error) {
            lastError = error;
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error(
        `OAuth IdP did not start in time: ${lastError instanceof Error ? lastError.message : String(lastError)}`
    );
}
