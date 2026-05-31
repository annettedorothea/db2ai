import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { withMcpStdioSession } from '@core2ai/core/test-fixtures';
import {
    demosRoot,
    ensurePagilaDocker,
    pagilaDatabaseEnv,
    pagilaTmpRoot,
    preparePagilaGeneratedFixture
} from '../support/pagila-fixture.js';

/** Matches Pagila MCP config in packages/extension/demos/.cursor/mcp.json */
const authEnv = 'DB2AI_AUTH_TOKEN';
const hostArgs = ['--auth-env', authEnv];

describe('Pagila generated mcp-serve (MCP stdio)', () => {
    let connectionString = '';
    let runRoot = '';
    let fixtureRoot = '';
    let mcpServePath = '';
    let generatedJsPath = '';

    beforeAll(async () => {
        const runtime = await ensurePagilaDocker(demosRoot);
        connectionString = runtime.connectionString;

        runRoot = await fs.mkdtemp(path.join(pagilaTmpRoot, 'pagila-mcp-'));
        fixtureRoot = path.join(runRoot, 'fixture');
        const fixture = await preparePagilaGeneratedFixture(fixtureRoot);
        mcpServePath = fixture.mcpServePath;
        generatedJsPath = fixture.generatedJsPath;
    }, 180_000);

    afterAll(async () => {
        if (runRoot) {
            await fs.rm(runRoot, { recursive: true, force: true });
        }
    });

    function mcpConnectOptions() {
        return {
            mcpServePath,
            generatedModulePath: generatedJsPath,
            hostArgs,
            cwd: fixtureRoot,
            env: {
                [pagilaDatabaseEnv]: connectionString,
                [authEnv]: ''
            }
        };
    }

    it('lists tools via MCP stdio (listTools)', async () => {
        await withMcpStdioSession(mcpConnectOptions(), async (session) => {
            const toolNames = await session.listToolNames();
            expect(toolNames).toContain('listFilms');
            expect(toolNames).toContain('filmsByMpaaRating');
        });
    });

    it('calls listFilms via MCP stdio (callTool)', async () => {
        await withMcpStdioSession(mcpConnectOptions(), async (session) => {
            const response = await session.callTool('listFilms', {
                limit: 5,
                offset: 0
            });
            expect(response).toMatchObject({
                rowCount: expect.any(Number),
                rows: expect.any(Array)
            });
            const result = response as { rowCount: number; rows: unknown[] };
            expect(result.rowCount).toBeGreaterThan(0);
            expect(result.rows.length).toBeGreaterThan(0);
        });
    });
});
