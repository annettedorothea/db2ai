import {
    asRecord,
    compileGeneratedForSmoke,
    credentialWithOptionalJwt,
    readGeneratedToolModule,
    restoreEnv,
    type GeneratedToolModule
} from '../generated/index.js';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';
import { copyAuthStubsFromDemos } from './copy-auth-stubs-from-demos.js';
import { copyLoggingAdapterStub } from './copy-logging-adapter-stub.js';
import { runDemoGenerate } from './run-demo-generate.js';

export { asRecord, restoreEnv };

/** Matches Pagila/Sakila MCP config in packages/extension/demos/.cursor/mcp.json */
const DEFAULT_AUTH_ENV = 'DB2AI_AUTH_TOKEN';

function resolveDirectInvokeHostContext(
    imported: Record<string, unknown>,
    generated: GeneratedToolModule,
    options: DirectInvokeFixtureOptions,
    authEnv: string
): unknown {
    const connectionEnvKey = typeof imported.connectionEnv === 'string' ? imported.connectionEnv : options.databaseEnv;
    const connectionString = process.env[connectionEnvKey]?.trim();
    if (!connectionString) {
        throw new Error(`Missing database URL in environment variable "${connectionEnvKey}".`);
    }
    const databaseDialect =
        imported.databaseDialect === 'mysql' ||
        imported.databaseDialect === 'postgres' ||
        imported.databaseDialect === 'sqlserver'
            ? imported.databaseDialect
            : 'postgres';
    const hostContext: Record<string, unknown> = { connectionString, databaseDialect };
    if (generated.requiresAuth === true) {
        const credential = process.env[authEnv]?.trim();
        if (credential) {
            Object.assign(hostContext, credentialWithOptionalJwt(credential));
        }
    }
    return hostContext;
}

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

        if (options.isolateFixtureProjectRoot) {
            await copyAuthStubsFromDemos(runRoot);
            generateSourcePath = path.join(runRoot, path.basename(options.sourcePath));
            await fs.copyFile(options.sourcePath, generateSourcePath);
        }

        runDemoGenerate(generateSourcePath, generatedTsPath);
        await copyLoggingAdapterStub(runRoot);
        compileGeneratedForSmoke(runRoot);

        const imported = (await import(`${pathToFileURL(generatedJsPath).href}?t=${Date.now()}`)) as Record<
            string,
            unknown
        >;
        const generated = readGeneratedToolModule(imported);
        if (generated.requiresAuth === true) {
            if (options.authToken !== undefined) {
                process.env[authEnv] = options.authToken;
            } else if (previousAuthToken === undefined) {
                process.env[authEnv] = '';
            }
        }
        const hostContext = resolveDirectInvokeHostContext(imported, generated, options, authEnv);

        await run({ imported, generated, hostContext });
    } finally {
        restoreEnv(options.databaseEnv, previousDatabaseUrl);
        restoreEnv(authEnv, previousAuthToken);
        await fs.rm(runRoot, { recursive: true, force: true });
    }
}
