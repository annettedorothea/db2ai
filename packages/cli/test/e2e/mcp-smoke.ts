import { runMcpStdioSmoke } from '@core2ai/core/mcp-host';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { generateAction } from '../../src/generate-command.js';
import { restoreEnv } from '../support/env.js';

export type DbMcpSmokeOptions = {
    label: string;
    sourcePath: string;
    tmpRoot: string;
    tmpPrefix: string;
    generatedToolsName: string;
    envName: string;
    connectionString: string;
    toolName: string;
    toolArgs: Record<string, unknown>;
    timeoutMs?: number;
};

function asRecord(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new Error(`Expected object JSON response, got ${typeof value}.`);
    }
    return value as Record<string, unknown>;
}

export async function runDbMcpSmoke(options: DbMcpSmokeOptions): Promise<void> {
    const runRoot = await fs.mkdtemp(path.join(options.tmpRoot, options.tmpPrefix));
    const generatedTsPath = path.join(runRoot, `generated/tools/${options.generatedToolsName}.ts`);
    const generatedJsPath = path.join(runRoot, `generated/tools/${options.generatedToolsName}.mjs`);
    const mcpServePath = path.join(runRoot, 'generated/cli/mcp-serve.mjs');
    const previousDatabaseUrl = process.env[options.envName];

    try {
        process.env[options.envName] = options.connectionString;
        await generateAction(options.sourcePath, generatedTsPath);
        const smoke = await runMcpStdioSmoke({
            mcpServePath,
            generatedModulePath: generatedJsPath,
            toolName: options.toolName,
            toolArgs: options.toolArgs,
            cwd: runRoot,
            env: {
                [options.envName]: options.connectionString
            },
            timeoutMs: options.timeoutMs ?? 20_000
        });

        const response = asRecord(smoke.responseJson);
        if (typeof response.rowCount !== 'number' || response.rowCount <= 0) {
            throw new Error(`MCP ${options.label} ${options.toolName} did not return rows.`);
        }
        if (!Array.isArray(response.rows)) {
            throw new Error(`MCP ${options.label} ${options.toolName} did not return a rows array.`);
        }
        console.log(`MCP ${options.label} smoke passed. Tools: ${smoke.toolNames.join(', ')}`);
    } finally {
        restoreEnv(options.envName, previousDatabaseUrl);
        await fs.rm(runRoot, { recursive: true, force: true });
    }
}
