import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { compileGeneratedForSmoke, withMcpRelayHttpSession } from '../generated/index.js';
import { copyLoggingAdapterStub } from '../support/copy-logging-adapter-stub.js';
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

describe('Pagila generated passthrough-http-mcp-server (MCP HTTP)', () => {
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
        await copyLoggingAdapterStub(runRoot);
        await fs.mkdir(path.join(runRoot, 'src/auth/pagila-tools'), { recursive: true });
        await fs.copyFile(
            path.join(demosRoot, 'src/auth/pagila-tools/listActors.ts'),
            path.join(runRoot, 'src/auth/pagila-tools/listActors.ts')
        );
        await fs.copyFile(
            path.join(demosRoot, 'src/auth/pagila-tools/verifyCredential.ts'),
            path.join(runRoot, 'src/auth/pagila-tools/verifyCredential.ts')
        );
        compileGeneratedForSmoke(runRoot);

        const mcpUrl = `http://127.0.0.1:${port}/mcp`;
        await withMcpRelayHttpSession(
            {
                relayHttpMcpServerPath: path.join(runRoot, 'generated/cli/passthrough-http-mcp-server.js'),
                generatedModulePath: path.join(runRoot, 'generated/tools/pagila-tools.js'),
                hostArgs: ['--port', String(port), '--path', '/mcp'],
                mcpUrl,
                cwd: runRoot,
                env: {
                    PAGILA_DATABASE_URL: connectionString,
                    MCP_AUTH_HEADER: 'x-api-token',
                    MCP_AUTH_EXPECTED: 'demo'
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

    it('rejects listActors when x-api-token fails checked validation', async () => {
        const port = await findFreePort();
        const rejectRoot = await fs.mkdtemp(path.join(demosTmpRoot, 'pagila-http-reject-'));
        const generateSourcePath = path.join(rejectRoot, 'pagila.db2ai');
        await fs.copyFile(path.join(demosRoot, 'pagila.db2ai'), generateSourcePath);
        const generatedTsPath = path.join(rejectRoot, 'generated/tools/pagila-tools.ts');
        await fs.mkdir(path.dirname(generatedTsPath), { recursive: true });
        runDemoGenerate(generateSourcePath, generatedTsPath);
        await copyLoggingAdapterStub(rejectRoot);
        await fs.mkdir(path.join(rejectRoot, 'src/auth/pagila-tools'), { recursive: true });
        await fs.copyFile(
            path.join(demosRoot, 'src/auth/pagila-tools/listActors.ts'),
            path.join(rejectRoot, 'src/auth/pagila-tools/listActors.ts')
        );
        await fs.copyFile(
            path.join(demosRoot, 'src/auth/pagila-tools/verifyCredential.ts'),
            path.join(rejectRoot, 'src/auth/pagila-tools/verifyCredential.ts')
        );
        compileGeneratedForSmoke(rejectRoot);

        const mcpUrl = `http://127.0.0.1:${port}/mcp`;
        try {
            await withMcpRelayHttpSession(
                {
                    relayHttpMcpServerPath: path.join(rejectRoot, 'generated/cli/passthrough-http-mcp-server.js'),
                    generatedModulePath: path.join(rejectRoot, 'generated/tools/pagila-tools.js'),
                    hostArgs: ['--port', String(port), '--path', '/mcp'],
                    mcpUrl,
                    cwd: rejectRoot,
                    env: {
                        PAGILA_DATABASE_URL: connectionString,
                        MCP_AUTH_HEADER: 'x-api-token',
                        MCP_AUTH_EXPECTED: 'demo'
                    },
                    authHeader: { name: 'x-api-token', value: 'wrong-key' }
                },
                async (session) => {
                    await expect(session.callTool('listActors', { limit: 1, offset: 0 })).rejects.toThrow(
                        /returned an error result/
                    );
                }
            );
        } finally {
            await fs.rm(rejectRoot, { recursive: true, force: true });
        }
    }, 180_000);
});
