import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import * as fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import * as path from 'node:path';
import { compileGeneratedForSmoke, withMcpStatelessHttpSession } from '../generated/index.js';
import { ensureAccessDemoDocker } from '../support/access-demo-docker.js';
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

const ALICE_ACCESS_DEMO_TOKEN =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjdXN0b21lcklkIjoiYWxpY2UiLCJyb2xlIjoidXNlciJ9.W8kJLviah23DKhSJ-gd6LF7phONqmyOqe57WD8sHwFo';

describe('access-demo generated stateless-http-mcp-server (MCP HTTP)', () => {
    let connectionString = '';
    let runRoot = '';

    beforeAll(async () => {
        ({ connectionString } = await ensureAccessDemoDocker(demosRoot));
    }, 180_000);

    afterAll(async () => {
        if (runRoot) {
            await fs.rm(runRoot, { recursive: true, force: true });
        }
    });

    it('calls listCustomerOrders with JWT from MCP client header', async () => {
        const port = await findFreePort();
        runRoot = await fs.mkdtemp(path.join(demosTmpRoot, 'access-demo-http-'));
        const demosAuthDir = path.join(demosRoot, 'src', 'auth');
        const fixtureAuthDir = path.join(runRoot, 'src', 'auth');
        if (existsSync(demosAuthDir)) {
            await fs.mkdir(fixtureAuthDir, { recursive: true });
            for (const entry of await fs.readdir(demosAuthDir)) {
                if (entry.endsWith('.ts')) {
                    await fs.copyFile(path.join(demosAuthDir, entry), path.join(fixtureAuthDir, entry));
                }
            }
        }
        const generateSourcePath = path.join(runRoot, 'access-demo.db2ai');
        await fs.copyFile(path.join(demosRoot, 'access-demo.db2ai'), generateSourcePath);
        const generatedTsPath = path.join(runRoot, 'generated/tools/access-demo-tools.ts');
        await fs.mkdir(path.dirname(generatedTsPath), { recursive: true });
        runDemoGenerate(generateSourcePath, generatedTsPath);
        compileGeneratedForSmoke(runRoot);

        const mcpUrl = `http://127.0.0.1:${port}/mcp`;
        await withMcpStatelessHttpSession(
            {
                statelessHttpMcpServerPath: path.join(runRoot, 'generated/cli/stateless-http-mcp-server.js'),
                generatedModulePath: path.join(runRoot, 'generated/tools/access-demo-tools.js'),
                hostArgs: ['--port', String(port), '--path', '/mcp'],
                mcpUrl,
                cwd: runRoot,
                env: {
                    ACCESS_DEMO_DATABASE_URL: connectionString,
                    MCP_AUTH_HEADER: 'x-api-token'
                },
                authHeader: { name: 'x-api-token', value: ALICE_ACCESS_DEMO_TOKEN }
            },
            async (session) => {
                const toolNames = await session.listToolNames();
                expect(toolNames).toContain('listCustomerOrders');

                const orders = await session.callTool('listCustomerOrders', {});
                expect(orders).toMatchObject({
                    rowCount: expect.any(Number),
                    rows: expect.any(Array)
                });
            }
        );
    }, 180_000);
});
