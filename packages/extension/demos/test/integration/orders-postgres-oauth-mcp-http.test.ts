import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { ChildProcess } from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { compileGeneratedForSmoke } from '../generated/index.js';
import { copyLoggingAdapterStub } from '../support/copy-logging-adapter-stub.js';
import { ensureOrdersPostgresDocker } from '../support/orders-postgres-docker.js';
import { fetchOAuthTokenFromIdp, startOAuthIdpServer, waitForOAuthIdp } from '../support/oauth-idp-fixture.js';
import { demosRoot, demosTmpRoot } from '../support/paths.js';
import { runDemoGenerate } from '../support/run-demo-generate.js';

async function findFreePort(): Promise<number> {
    const net = await import('node:net');
    return new Promise((resolve, reject) => {
        const server = net.createServer();
        server.once('error', reject);
        server.listen(0, '127.0.0.1', () => {
            const address = server.address();
            if (!address || typeof address === 'string') {
                server.close(() => reject(new Error('Unable to allocate a free local port.')));
                return;
            }
            const port = address.port;
            server.close(() => resolve(port));
        });
    });
}

async function waitForMcpHttp(mcpUrl: string, child: ChildProcess | undefined): Promise<void> {
    const deadline = Date.now() + 15_000;
    let lastError: unknown;
    while (Date.now() < deadline) {
        if (child?.exitCode !== null && child?.exitCode !== undefined) {
            throw new Error(`OAuth MCP host exited with code ${child.exitCode}`);
        }
        try {
            const response = await fetch(mcpUrl, {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: '{}'
            });
            if (response.status < 500) {
                return;
            }
            lastError = new Error(`HTTP ${response.status}`);
        } catch (error) {
            lastError = error;
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error(
        `OAuth MCP host not ready at ${mcpUrl}: ${lastError instanceof Error ? lastError.message : String(lastError)}`
    );
}

describe('orders-postgres oauth-http-mcp-server (oidc JWKS validation)', () => {
    let idpProcess: ChildProcess | undefined;
    let oauthHostProcess: ChildProcess | undefined;
    let connectionString = '';
    let idpBaseUrl = '';
    let mcpUrl = '';
    let runRoot = '';
    let accessToken = '';

    beforeAll(async () => {
        ({ connectionString } = await ensureOrdersPostgresDocker(demosRoot));

        const idpPort = await findFreePort();
        const mcpPort = await findFreePort();
        idpBaseUrl = `http://127.0.0.1:${idpPort}`;
        mcpUrl = `http://127.0.0.1:${mcpPort}/mcp`;

        idpProcess = startOAuthIdpServer('oauth-idp/server.mjs', idpPort, {
            ORDERS_POSTGRES_OAUTH_IDP_PORT: String(idpPort),
            OAUTH_IDP_SIGN_ALG: 'RS256'
        });
        await waitForOAuthIdp(idpBaseUrl, idpProcess);
        accessToken = await fetchOAuthTokenFromIdp(idpBaseUrl, 'alice');

        runRoot = await fs.mkdtemp(path.join(demosTmpRoot, 'orders-postgres-oauth-mcp-oidc-'));
        const generateSourcePath = path.join(runRoot, 'orders-postgres.db2ai');
        await fs.copyFile(path.join(demosRoot, 'orders-postgres.db2ai'), generateSourcePath);
        const generatedTsPath = path.join(runRoot, 'generated/tools/orders-postgres-tools.ts');
        await fs.mkdir(path.dirname(generatedTsPath), { recursive: true });
        runDemoGenerate(generateSourcePath, generatedTsPath);
        await copyLoggingAdapterStub(runRoot);
        await fs.mkdir(path.join(runRoot, 'src/auth/orders-postgres-tools'), { recursive: true });
        await fs.copyFile(
            path.join(demosRoot, 'src/auth/orders-postgres-tools/verifyCredential.ts'),
            path.join(runRoot, 'src/auth/orders-postgres-tools/verifyCredential.ts')
        );
        compileGeneratedForSmoke(runRoot);

        const oauthHostPath = path.join(runRoot, 'generated/cli/oauth-http-mcp-server.js');
        await fs.copyFile(path.join(demosRoot, 'generated/cli/oauth-http-mcp-server.js'), oauthHostPath);

        const { spawn } = await import('node:child_process');
        oauthHostProcess = spawn(
            process.execPath,
            [
                oauthHostPath,
                path.join(runRoot, 'generated/tools/orders-postgres-tools.js'),
                '--oauth-idp-url',
                idpBaseUrl,
                '--oauth-scope',
                'orders-postgres',
                '--port',
                String(mcpPort),
                '--path',
                '/mcp'
            ],
            {
                cwd: runRoot,
                env: {
                    ...process.env,
                    ORDERS_POSTGRES_DATABASE_URL: connectionString,
                    ORDERS_POSTGRES_OAUTH_IDP_URL: idpBaseUrl
                },
                stdio: ['ignore', 'pipe', 'pipe']
            }
        );
        await waitForMcpHttp(mcpUrl, oauthHostProcess);
    }, 180_000);

    afterAll(async () => {
        if (oauthHostProcess) {
            oauthHostProcess.kill();
        }
        if (idpProcess) {
            idpProcess.kill();
        }
        if (runRoot) {
            await fs.rm(runRoot, { recursive: true, force: true });
        }
    });

    it('connects with RS256 Bearer when MCP host uses oidc JWKS validation', async () => {
        const transport = new StreamableHTTPClientTransport(new URL(mcpUrl), {
            requestInit: {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            }
        });
        const client = new Client({ name: 'orders-oauth-oidc-test', version: '0.0.1' });
        await client.connect(transport, { timeout: 30_000 });
        const tools = await client.listTools(undefined, { timeout: 30_000 });
        expect(tools.tools.map((t) => t.name)).toContain('listCustomerOrders');
        await client.close();
    }, 60_000);
});
