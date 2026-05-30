import { readGeneratedModule } from '@core2ai/core/mcp-host';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';
import { expect } from 'vitest';
import { generateAction } from '../../src/generate-command.js';
import { compileGeneratedForSmoke } from './compile-generated-fixture.js';
import { restoreEnv } from './env.js';

/** Matches Pagila/Sakila MCP config in packages/extension/demos/.cursor/mcp.json */
const DEFAULT_AUTH_ENV = 'DB2AI_AUTH_TOKEN';

export type DirectInvokeFixtureOptions = {
    demosRoot: string;
    tmpRoot: string;
    tmpPrefix: string;
    sourcePath: string;
    generatedToolsName: string;
    databaseEnv: string;
    connectionString: string;
    /** Env var name for --auth-env when generated tools include protected/checked access */
    authEnv?: string;
};

export type DirectInvokeFixture = {
    imported: Record<string, unknown>;
    generated: ReturnType<typeof readGeneratedModule>;
    hostContext: unknown;
};

export function asRecord(value: unknown): Record<string, unknown> {
    expect(value).toBeTypeOf('object');
    expect(value).not.toBeNull();
    return value as Record<string, unknown>;
}

export async function withGeneratedDirectInvokeFixture(
    options: DirectInvokeFixtureOptions,
    run: (fixture: DirectInvokeFixture) => Promise<void>
): Promise<void> {
    const runRoot = await fs.mkdtemp(path.join(options.tmpRoot, options.tmpPrefix));
    const generatedTsPath = path.join(runRoot, `generated/tools/${options.generatedToolsName}.ts`);
    const generatedJsPath = path.join(runRoot, `generated/tools/${options.generatedToolsName}.js`);
    const authEnv = options.authEnv ?? DEFAULT_AUTH_ENV;
    const previousDatabaseUrl = process.env[options.databaseEnv];
    const previousAuthToken = process.env[authEnv];

    try {
        process.env[options.databaseEnv] = options.connectionString;
        await generateAction(options.sourcePath, generatedTsPath);
        compileGeneratedForSmoke(runRoot);

        const imported = (await import(`${pathToFileURL(generatedJsPath).href}?t=${Date.now()}`)) as Record<
            string,
            unknown
        >;
        const generated = readGeneratedModule(imported);
        const hostArgv = generated.requiresAuth === true ? (['--auth-env', authEnv] as const) : ([] as const);
        generated.adapter.configureFromArgv([...hostArgv], [options.demosRoot]);
        if (generated.requiresAuth === true && previousAuthToken === undefined) {
            process.env[authEnv] = '';
        }
        generated.adapter.validateAtStartup(generated.requiresAuth === true);
        const hostContext = generated.adapter.resolveHostContext();

        await run({ imported, generated, hostContext });
    } finally {
        restoreEnv(options.databaseEnv, previousDatabaseUrl);
        restoreEnv(authEnv, previousAuthToken);
        await fs.rm(runRoot, { recursive: true, force: true });
    }
}
