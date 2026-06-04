import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { compileGeneratedForSmoke, withMcpStatelessHttpSession } from '../generated/index.js';
import { demosRoot, demosTmpRoot } from '../support/paths.js';
import { ensurePagilaDocker } from '../support/pagila-docker.js';
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

describe('Pagila generated stateless-http-mcp-server (MCP HTTP)', () => {
    let connectionString = '';
    let runRoot = '';

    beforeAll(async () => {
        ({ connectionString } = await ensurePagilaDocker(demosRoot));
    }, 180_000);

    afterAll(async () => {
        if (runRoot) {
            await fs.rm(runRoot, { recursive: true, force: true });
        }
    });

    it('calls listActors with x-api-token from MCP client header', async () => {
        const port = await findFreePort();
        runRoot = await fs.mkdtemp(path.join(demosTmpRoot, 'pagila-http-'));
        const generateSourcePath = path.join(runRoot, 'pagila.db2ai');
        await fs.copyFile(path.join(demosRoot, 'pagila.db2ai'), generateSourcePath);
        const generatedTsPath = path.join(runRoot, 'generated/tools/pagila-tools.ts');
        await fs.mkdir(path.dirname(generatedTsPath), { recursive: true });
        runDemoGenerate(generateSourcePath, generatedTsPath);
        compileGeneratedForSmoke(runRoot);

        const mcpUrl = `http://127.0.0.1:${port}/mcp`;
        await withMcpStatelessHttpSession(
            {
                statelessHttpMcpServerPath: path.join(runRoot, 'generated/cli/stateless-http-mcp-server.js'),
                generatedModulePath: path.join(runRoot, 'generated/tools/pagila-tools.js'),
                hostArgs: ['--port', String(port), '--path', '/mcp'],
                mcpUrl,
                cwd: runRoot,
                env: {
                    PAGILA_DATABASE_URL: connectionString,
                    MCP_AUTH_HEADER: 'x-api-token'
                },
                authHeader: { name: 'x-api-token', value: 'demo' }
            },
            async (session) => {
                const toolNames = await session.listToolNames();
                expect(toolNames).toContain('listActors');

                const actors = await session.callTool('listActors', { limit: 5, offset: 0 });
                expect(actors).toMatchObject({
                    rowCount: expect.any(Number),
                    rows: expect.any(Array)
                });
            }
        );
    }, 180_000);
});
