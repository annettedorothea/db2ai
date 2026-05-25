import type { Model } from 'db-2-ai-dsl-language';
import { DEFAULT_MAX_LIMIT_CAP, DEFAULT_PAGE_LIMIT } from 'db-2-ai-dsl-language';
import { extractDestinationAndName } from '@core2ai/codegen';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as url from 'node:url';
import {
    buildInputSchemaByTool,
    quotePostgresIdent,
    resolveToolsFromModel,
    type JsonSchemaDict,
    type ResolvedDbToolCodegen,
    type ResolvedSqlToolCodegen,
    type ResolvedTableToolCodegen
} from './db-query-codegen.js';
import { buildInputZodBlock } from './json-schema-to-zod-codegen.js';

export type GeneratedOutputFiles = {
    tsPath: string;
    jsPath: string;
    mcpServePath: string;
};

declare const __dirname: string | undefined;

function bundleSafeGeneratorImplementationDir(): string {
    // VS Code extension embed bundle (CJS): esbuild sets __dirname next to cli.cjs + resources/.
    if (typeof __dirname !== 'undefined' && __dirname.length > 0) {
        return __dirname;
    }
    // CLI via `node packages/cli/...` (ESM source).
    return path.dirname(url.fileURLToPath(import.meta.url));
}

const __generatorDirname = bundleSafeGeneratorImplementationDir();

function resolveEmbedHomeDirectory(): string | undefined {
    const raw = process.env.DB2AI_EMBED_HOME?.trim();
    return raw ? path.resolve(raw) : undefined;
}

function resolveGeneratedCliDir(destinationTsPath: string): string {
    const dir = path.dirname(path.resolve(destinationTsPath));
    return path.basename(dir) === 'tools' ? path.join(path.dirname(dir), 'cli') : path.join(dir, 'cli');
}

function resolveBootstrapProjectRootFromSource(db2aiSourcePath: string): string {
    return path.dirname(path.resolve(db2aiSourcePath));
}

function resolveBundledMcpServeSourcePath(): string {
    const embed = resolveEmbedHomeDirectory();
    if (embed) {
        return path.join(embed, 'resources', 'mcp-serve-emitted.mjs');
    }
    return path.resolve(__generatorDirname, '..', 'resources', 'mcp-serve-emitted.mjs');
}

function resolveCliPackageJsonPathForVersions(): string {
    const embed = resolveEmbedHomeDirectory();
    if (embed) {
        return path.join(embed, 'package.json');
    }
    return path.resolve(__generatorDirname, '..', 'package.json');
}

function copyBundledMcpServeInto(cliDir: string): string {
    const src = resolveBundledMcpServeSourcePath();
    if (!fs.existsSync(src)) {
        throw new Error(
            `Bundled MCP host missing (${src}). Run npm run bundle:mcp-runtime from the db2ai workspace root.`
        );
    }
    if (!fs.existsSync(cliDir)) {
        fs.mkdirSync(cliDir, { recursive: true });
    }
    const dest = path.join(cliDir, 'mcp-serve.mjs');
    fs.copyFileSync(src, dest);
    return dest;
}

function readCliPackageJson(): { version: string; dependencies?: Record<string, string> } {
    const p = resolveCliPackageJsonPathForVersions();
    const raw = fs.readFileSync(p, 'utf-8');
    return JSON.parse(raw) as { version: string; dependencies?: Record<string, string> };
}

function readCliVersionsForBootstrap(): { sdk: string; zod: string; pg: string } {
    const pkg = readCliPackageJson();
    return {
        sdk: pkg.dependencies?.['@modelcontextprotocol/sdk'] ?? '^1.29.0',
        zod: pkg.dependencies?.zod ?? '^4.4.3',
        pg: pkg.dependencies?.pg ?? '^8.16.0'
    };
}

function resolveMcpServerIdentityFromDestination(destinationTsPath: string): { name: string; version: string } {
    const pkg = readCliPackageJson();
    return {
        name: path.parse(destinationTsPath).name,
        version: pkg.version ?? '0.0.1'
    };
}

function renderMcpServerIdentityExports(name: string, version: string): string {
    return `export const mcpServerName = ${JSON.stringify(name)};
export const mcpServerVersion = ${JSON.stringify(version)};
`;
}

function renderDbMcpHostAdapterBlock(authKind: 'none' | 'credential'): string {
    const authCheck =
        authKind === 'credential'
            ? `
        if (!credential) {
            throw new Error(
                'Missing host credential. Pass --auth-env on mcp-serve.mjs and set the variable (re-read on every tool call).'
            );
        }`
            : `
        credential = credential || undefined;`;
    return `const META_AUTH_ENV_KEY = 'MCP_HOST_AUTH_ENV_KEY';
const META_ENV_DIRS = 'MCP_HOST_ENV_DIRS';

function applyHostEnvKeys(hostConfig, envDirs) {
    if (hostConfig.authEnv) {
        process.env[META_AUTH_ENV_KEY] = hostConfig.authEnv;
    } else {
        delete process.env[META_AUTH_ENV_KEY];
    }
    if (envDirs.length > 0) {
        process.env[META_ENV_DIRS] = JSON.stringify(envDirs);
    } else {
        delete process.env[META_ENV_DIRS];
    }
}

function decodeJwtPayloadUnsafe(token) {
    const parts = String(token).trim().split('.');
    if (parts.length !== 3) {
        throw new Error('credential is not a JWT (expected three dot-separated segments).');
    }
    let b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4 !== 0) {
        b64 += '=';
    }
    return JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
}

export const mcpHostAdapter = {
    configureFromArgv(argv, envDirs) {
        let authEnv;
        for (let i = 0; i < argv.length; i++) {
            const arg = argv[i];
            if (arg === '--auth-env') {
                authEnv = argv[++i];
                if (!authEnv) {
                    throw new Error('Missing value after --auth-env');
                }
                continue;
            }
            if (arg.startsWith('-')) {
                throw new Error('Unknown option: ' + arg);
            }
            throw new Error('Unexpected positional argument: ' + arg);
        }
        applyHostEnvKeys({ authEnv }, envDirs);
    },

    validateAtStartup(requiresAuth) {
        const connectionString = process.env[connectionEnv]?.trim();
        if (!connectionString) {
            throw new Error(
                'Environment variable "' + connectionEnv + '" is missing or empty (database env from .db2ai).'
            );
        }
        if (!requiresAuth) {
            return;
        }
        const authEnvName = process.env[META_AUTH_ENV_KEY]?.trim();
        if (!authEnvName) {
            throw new Error('Generated tools require auth; pass --auth-env <ENV_VAR_NAME> on the MCP host.');
        }
        const credential = process.env[authEnvName]?.trim();
        if (!credential) {
            throw new Error(
                'Environment variable "' + authEnvName + '" is missing or empty (required by --auth-env).'
            );
        }
    },

    resolveHostContext() {
        const connectionString = process.env[connectionEnv]?.trim();
        if (!connectionString) {
            throw new Error(
                'Missing database URL. Set environment variable "' + connectionEnv + '" (from database env in .db2ai).'
            );
        }

        const authKey = process.env[META_AUTH_ENV_KEY]?.trim();
        let credential = authKey ? process.env[authKey]?.trim() : undefined;${authCheck}

        let jwt;
        if (credential) {
            const segments = String(credential).trim().split('.');
            if (segments.length === 3) {
                try {
                    jwt = decodeJwtPayloadUnsafe(credential);
                } catch {
                    jwt = undefined;
                }
            }
        }

        return { connectionString, credential, jwt };
    },

    envDirsForReload() {
        const raw = process.env[META_ENV_DIRS];
        if (!raw?.trim()) {
            return [];
        }
        try {
            const dirs = JSON.parse(raw);
            if (Array.isArray(dirs) && dirs.every((d) => typeof d === 'string')) {
                return dirs;
            }
        } catch {
            // ignore malformed config
        }
        return [];
    }
};
`;
}

function warnIfPackageJsonMissingMcpDeps(packageJsonDir: string): void {
    const pjsonPath = path.join(packageJsonDir, 'package.json');
    if (!fs.existsSync(pjsonPath)) {
        return;
    }
    let pkg: unknown;
    try {
        pkg = JSON.parse(fs.readFileSync(pjsonPath, 'utf-8'));
    } catch {
        return;
    }
    if (!pkg || typeof pkg !== 'object') {
        return;
    }
    const rec = pkg as { dependencies?: Record<string, string>; optionalDependencies?: Record<string, string> };
    const merged = {
        ...(rec.optionalDependencies ?? {}),
        ...(rec.dependencies ?? {})
    };
    const need = ['@modelcontextprotocol/sdk', 'zod', 'pg'] as const;
    const missing = need.filter(key => merged[key] === undefined);
    if (missing.length > 0) {
        console.warn(
            `[generate] "${pjsonPath}": install runtime dependencies: ${missing.join(', ')} (npm install), then generated/cli/mcp-serve.mjs can run.`
        );
    }
}

function writeMinimalPackageJsonIfAbsent(projectRoot: string): void {
    const dest = path.join(projectRoot, 'package.json');
    if (fs.existsSync(dest)) {
        warnIfPackageJsonMissingMcpDeps(projectRoot);
        return;
    }
    const { sdk, zod, pg } = readCliVersionsForBootstrap();
    const slug =
        path
            .basename(projectRoot)
            .replace(/[^a-zA-Z0-9-]/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 80) || 'db2ai-project';
    const body = {
        name: slug,
        private: true,
        type: 'module',
        dependencies: {
            '@modelcontextprotocol/sdk': sdk,
            zod,
            pg
        }
    };
    fs.writeFileSync(dest, `${JSON.stringify(body, null, 4)}\n`, 'utf-8');
}

function ensureParentDir(destination: string): void {
    const data = extractDestinationAndName(destination);
    if (!fs.existsSync(data.destination)) {
        fs.mkdirSync(data.destination, { recursive: true });
    }
}

function serializeJsonForModule(value: unknown): string {
    return JSON.stringify(value, null, 4);
}

function renderSourceReference(source: string): string {
    return path.basename(source);
}

function renderTableInvokeCase(tool: ResolvedTableToolCodegen): string {
    const quotedTable = quotePostgresIdent(tool.table);
    return `        case ${JSON.stringify(tool.toolName)}: {
            const effectiveLimit = Math.min(
                typeof options.limit === 'number' && Number.isFinite(options.limit) ? options.limit : DEFAULT_PAGE_LIMIT,
                ${tool.maxLimitCap}
            );
            const offset =
                typeof options.offset === 'number' && Number.isFinite(options.offset) && options.offset >= 0
                    ? Math.floor(options.offset)
                    : 0;
            const sql = \`SELECT * FROM ${quotedTable} LIMIT $1 OFFSET $2\`;
            const result = await client.query(sql, [effectiveLimit, offset]);
            return {
                rows: result.rows,
                rowCount: result.rowCount ?? result.rows.length,
                limit: effectiveLimit,
                offset
            };
        }`;
}

function renderSqlInvokeCase(tool: ResolvedSqlToolCodegen): string {
    const valueExprs = tool.params
        .map(
            p =>
                `options[${JSON.stringify(p.propertyName)}] !== undefined && options[${JSON.stringify(p.propertyName)}] !== null ? String(options[${JSON.stringify(p.propertyName)}]) : null`
        )
        .join(', ');
    return `        case ${JSON.stringify(tool.toolName)}: {
            const result = await client.query({ text: ${JSON.stringify(tool.sqlText)}, values: [${valueExprs}] });
            return {
                rows: result.rows,
                rowCount: result.rowCount ?? result.rows.length
            };
        }`;
}

function renderInvokeSwitchCases(tools: ResolvedDbToolCodegen[]): string {
    return tools
        .map(tool => (tool.kind === 'table' ? renderTableInvokeCase(tool) : renderSqlInvokeCase(tool)))
        .join('\n');
}

function renderInvokeBlockTs(tools: ResolvedDbToolCodegen[]): string {
    const toolCases = renderInvokeSwitchCases(tools);
    return `
import pg from 'pg';

export const DEFAULT_PAGE_LIMIT = ${DEFAULT_PAGE_LIMIT};
export const DEFAULT_MAX_LIMIT_CAP = ${DEFAULT_MAX_LIMIT_CAP};

export type InvokeOptions = Record<string, unknown> & {
    limit?: number;
    offset?: number;
};

function resolveConnectionString(hostContext: unknown): string {
    if (hostContext && typeof hostContext === 'object' && 'connectionString' in hostContext) {
        const cs = (hostContext as { connectionString?: unknown }).connectionString;
        if (cs !== undefined && cs !== null && String(cs).trim().length > 0) {
            return String(cs).trim();
        }
    }
    throw new Error(
        'Missing database connection. MCP host must pass hostContext.connectionString (from database env in .db2ai).'
    );
}

export async function invokeTool(
    toolName: string,
    options: InvokeOptions = {},
    hostContext?: unknown
): Promise<unknown> {
    const connectionString = resolveConnectionString(hostContext);
    const client = new pg.Client({ connectionString });
    await client.connect();
    try {
        switch (toolName) {
${toolCases}
            default:
                throw new Error(\`Unknown tool: \${toolName}\`);
        }
    } finally {
        await client.end();
    }
}
`.trim();
}

function renderInvokeBlockJs(tools: ResolvedDbToolCodegen[]): string {
    const toolCases = renderInvokeSwitchCases(tools);
    return `
import pg from 'pg';

export const DEFAULT_PAGE_LIMIT = ${DEFAULT_PAGE_LIMIT};
export const DEFAULT_MAX_LIMIT_CAP = ${DEFAULT_MAX_LIMIT_CAP};

function resolveConnectionString(hostContext) {
    if (hostContext && typeof hostContext === 'object' && hostContext.connectionString != null) {
        const cs = String(hostContext.connectionString).trim();
        if (cs.length > 0) {
            return cs;
        }
    }
    throw new Error(
        'Missing database connection. MCP host must pass hostContext.connectionString (from database env in .db2ai).'
    );
}

export async function invokeTool(toolName, options = {}, hostContext) {
    const connectionString = resolveConnectionString(hostContext);
    const client = new pg.Client({ connectionString });
    await client.connect();
    try {
        switch (toolName) {
${toolCases}
            default:
                throw new Error(\`Unknown tool: \${toolName}\`);
        }
    } finally {
        await client.end();
    }
}
`.trim();
}

function renderTsModule(
    tools: ResolvedDbToolCodegen[],
    connectionEnv: string,
    mcpServerIdentityBlock: string,
    toolRuntimeBlock: string,
    source: string
): string {
    const toolsLiteral = serializeJsonForModule(tools);
    const sourceRef = renderSourceReference(source);
    return `/**
 * Generated from: ${sourceRef}
 */

export const connectionEnv = ${JSON.stringify(connectionEnv)};

export const requiresAuth = false;

export type GeneratedTool = {
    toolName: string;
    title: string;
    description: string;
    kind: 'table' | 'sql';
    table?: string;
    maxLimitCap?: number;
    sqlText?: string;
    example?: string;
};

export const generatedTools: GeneratedTool[] = ${toolsLiteral};

${mcpServerIdentityBlock}
${toolRuntimeBlock}
`;
}

function renderJsModule(
    tools: ResolvedDbToolCodegen[],
    connectionEnv: string,
    mcpServerIdentityBlock: string,
    toolRuntimeBlock: string,
    source: string
): string {
    const sourceRef = renderSourceReference(source);
    return `/**
 * Generated from: ${sourceRef}
 */

export const connectionEnv = ${JSON.stringify(connectionEnv)};

export const requiresAuth = false;

export const generatedTools = ${serializeJsonForModule(tools)};

${mcpServerIdentityBlock}
${toolRuntimeBlock}
`;
}

export async function generateOutput(model: Model, source: string, destination: string): Promise<GeneratedOutputFiles> {
    ensureParentDir(destination);
    const parsed = path.parse(destination);
    const tsPath = parsed.ext === '.ts' ? destination : path.join(parsed.dir, `${parsed.name}.ts`);
    const jsPath = path.join(parsed.dir, `${parsed.name}.mjs`);

    const envName = String(model.env).trim();
    const tools = resolveToolsFromModel(model);
    const inputSchemaByTool = buildInputSchemaByTool(tools) as Record<string, JsonSchemaDict>;
    const authKind: 'none' | 'credential' = 'none';
    const { name: mcpServerName, version: mcpServerVersion } = resolveMcpServerIdentityFromDestination(tsPath);
    const mcpServerIdentityBlock = renderMcpServerIdentityExports(mcpServerName, mcpServerVersion);
    const sharedRuntimePrefix = `${buildInputZodBlock(inputSchemaByTool)}\n${renderDbMcpHostAdapterBlock(authKind)}\n`;
    fs.writeFileSync(
        tsPath,
        renderTsModule(tools, envName, mcpServerIdentityBlock, `${sharedRuntimePrefix}${renderInvokeBlockTs(tools)}`, source)
    );
    fs.writeFileSync(
        jsPath,
        renderJsModule(tools, envName, mcpServerIdentityBlock, `${sharedRuntimePrefix}${renderInvokeBlockJs(tools)}`, source)
    );

    const cliDir = resolveGeneratedCliDir(tsPath);
    const mcpServePath = copyBundledMcpServeInto(cliDir);
    writeMinimalPackageJsonIfAbsent(resolveBootstrapProjectRootFromSource(source));

    return { tsPath, jsPath, mcpServePath };
}
