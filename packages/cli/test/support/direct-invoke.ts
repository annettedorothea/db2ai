import { readGeneratedModule } from '@core2ai/core/mcp-host';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';
import { expect } from 'vitest';
import { generateAction } from '../../src/generate-command.js';
import { restoreEnv } from './env.js';

export type DirectInvokeFixtureOptions = {
    demosRoot: string;
    tmpRoot: string;
    tmpPrefix: string;
    sourcePath: string;
    generatedToolsName: string;
    databaseEnv: string;
    connectionString: string;
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
    const generatedJsPath = path.join(runRoot, `generated/tools/${options.generatedToolsName}.mjs`);
    const previousDatabaseUrl = process.env[options.databaseEnv];

    try {
        process.env[options.databaseEnv] = options.connectionString;
        await generateAction(options.sourcePath, generatedTsPath);

        const imported = (await import(`${pathToFileURL(generatedJsPath).href}?t=${Date.now()}`)) as Record<
            string,
            unknown
        >;
        const generated = readGeneratedModule(imported);
        generated.adapter.configureFromArgv([], [options.demosRoot]);
        generated.adapter.validateAtStartup(generated.requiresAuth === true);
        const hostContext = generated.adapter.resolveHostContext();

        await run({ imported, generated, hostContext });
    } finally {
        restoreEnv(options.databaseEnv, previousDatabaseUrl);
        await fs.rm(runRoot, { recursive: true, force: true });
    }
}
