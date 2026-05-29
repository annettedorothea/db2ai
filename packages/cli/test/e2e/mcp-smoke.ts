import { readGeneratedModule, runMcpStdioSmoke } from '@core2ai/core/mcp-host';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';
import { generateAction } from '../../src/generate-command.js';
import { restoreEnv } from '../support/env.js';

/** Matches Pagila/Sakila MCP config in packages/extension/demos/.cursor/mcp.json */
const DEFAULT_AUTH_ENV = 'DB2AI_AUTH_TOKEN';

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
    hostArgs?: string[];
    /** Env var for --auth-env when generated tools include protected/checked access */
    authEnv?: string;
    extraEnv?: Record<string, string>;
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
    const authEnv = options.authEnv ?? DEFAULT_AUTH_ENV;
    const previousDatabaseUrl = process.env[options.envName];
    const previousAuthToken = process.env[authEnv];

    try {
        process.env[options.envName] = options.connectionString;
        await generateAction(options.sourcePath, generatedTsPath);

        const imported = (await import(`${pathToFileURL(generatedJsPath).href}?t=${Date.now()}`)) as Record<
            string,
            unknown
        >;
        const generated = readGeneratedModule(imported);
        const hostArgs = [...(options.hostArgs ?? [])];
        if (generated.requiresAuth === true && !hostArgs.includes('--auth-env')) {
            hostArgs.push('--auth-env', authEnv);
        }
        const smokeEnv: Record<string, string | undefined> = {
            [options.envName]: options.connectionString,
            ...(options.extraEnv ?? {})
        };
        if (generated.requiresAuth === true && smokeEnv[authEnv] === undefined) {
            smokeEnv[authEnv] = '';
        }

        const smoke = await runMcpStdioSmoke({
            mcpServePath,
            generatedModulePath: generatedJsPath,
            toolName: options.toolName,
            toolArgs: options.toolArgs,
            hostArgs,
            cwd: runRoot,
            env: smokeEnv,
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
        restoreEnv(authEnv, previousAuthToken);
        await fs.rm(runRoot, { recursive: true, force: true });
    }
}
