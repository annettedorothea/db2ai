import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateAction } from '../src/generate-command.js';
import { runMcpStdioSmoke } from './mcp-stdio-smoke.js';
import { ensurePagilaDocker } from '../test/support/pagila-docker.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cliRoot = path.resolve(__dirname, '../..');
const workspaceRoot = path.resolve(cliRoot, '../..');
const demosRoot = path.join(workspaceRoot, 'packages/extension/demos');
const pagilaSourcePath = path.join(demosRoot, 'pagila.db2ai');
const tmpRoot = path.join(cliRoot, 'tmp');

function asRecord(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new Error(`Expected object JSON response, got ${typeof value}.`);
    }
    return value as Record<string, unknown>;
}

export async function runPagilaMcpSmoke(): Promise<void> {
    const { connectionString } = await ensurePagilaDocker(demosRoot);
    const runRoot = await fs.mkdtemp(path.join(tmpRoot, 'pagila-mcp-'));
    const generatedTsPath = path.join(runRoot, 'generated/tools/pagila-tools.ts');
    const generatedJsPath = path.join(runRoot, 'generated/tools/pagila-tools.mjs');
    const mcpServePath = path.join(runRoot, 'generated/cli/mcp-serve.mjs');

    try {
        await generateAction(pagilaSourcePath, generatedTsPath);
        const smoke = await runMcpStdioSmoke({
            mcpServePath,
            generatedModulePath: generatedJsPath,
            toolName: 'listFilms',
            toolArgs: {
                limit: 5,
                offset: 0
            },
            cwd: runRoot,
            env: {
                PAGILA_DATABASE_URL: connectionString
            },
            timeoutMs: 20_000
        });

        const response = asRecord(smoke.responseJson);
        if (typeof response.rowCount !== 'number' || response.rowCount <= 0) {
            throw new Error('MCP Pagila listFilms did not return rows.');
        }
        if (!Array.isArray(response.rows)) {
            throw new Error('MCP Pagila listFilms did not return a rows array.');
        }
        console.log(`MCP Pagila smoke passed. Tools: ${smoke.toolNames.join(', ')}`);
    } finally {
        await fs.rm(runRoot, { recursive: true, force: true });
    }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    runPagilaMcpSmoke().catch((error) => {
        console.error(error instanceof Error ? error.stack : String(error));
        process.exit(1);
    });
}
