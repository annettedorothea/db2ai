import {
    asRecord,
    compileGeneratedForSmoke,
    readGeneratedToolModule,
    restoreEnv,
    type GeneratedToolModule
} from '../generated/index.js';
import * as fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';
import { runDemoGenerate } from './run-demo-generate.js';

export { asRecord, restoreEnv };

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
    /** Credential/JWT value for authEnv before host context is resolved (empty string allowed) */
    authToken?: string;
    /** Copy source + auth stubs into tmp fixture so checked-access imports resolve locally */
    isolateFixtureProjectRoot?: boolean;
};

export type DirectInvokeFixture = {
    imported: Record<string, unknown>;
    generated: GeneratedToolModule;
    hostContext: unknown;
};

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

        let generateSourcePath = options.sourcePath;
        const envDirs = [options.demosRoot];

        if (options.isolateFixtureProjectRoot) {
            const demosAuthDir = path.join(options.demosRoot, 'src', 'auth');
            const fixtureAuthDir = path.join(runRoot, 'src', 'auth');
            if (existsSync(demosAuthDir)) {
                await fs.mkdir(fixtureAuthDir, { recursive: true });
                for (const entry of await fs.readdir(demosAuthDir)) {
                    if (entry.endsWith('.ts')) {
                        await fs.copyFile(path.join(demosAuthDir, entry), path.join(fixtureAuthDir, entry));
                    }
                }
            }
            generateSourcePath = path.join(runRoot, path.basename(options.sourcePath));
            await fs.copyFile(options.sourcePath, generateSourcePath);
            envDirs.unshift(runRoot);
        }

        runDemoGenerate(generateSourcePath, generatedTsPath);
        compileGeneratedForSmoke(runRoot);

        const imported = (await import(`${pathToFileURL(generatedJsPath).href}?t=${Date.now()}`)) as Record<
            string,
            unknown
        >;
        const generated = readGeneratedToolModule(imported);
        const hostArgv = generated.requiresAuth === true ? (['--auth-env', authEnv] as const) : ([] as const);
        generated.adapter.configureFromArgv([...hostArgv], envDirs);
        if (generated.requiresAuth === true) {
            if (options.authToken !== undefined) {
                process.env[authEnv] = options.authToken;
            } else if (previousAuthToken === undefined) {
                process.env[authEnv] = '';
            }
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
