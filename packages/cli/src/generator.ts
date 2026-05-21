import type { Model } from 'db-2-ai-dsl-language';
import { DEFAULT_MAX_LIMIT_CAP, DEFAULT_PAGE_LIMIT } from 'db-2-ai-dsl-language';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as url from 'node:url';
import { extractDestinationAndName } from './util.js';
import {
    buildInputSchemaByTool,
    quotePostgresIdent,
    resolveToolsFromModel,
    type ResolvedDbToolCodegen
} from './db-query-codegen.js';

export type GeneratedOutputFiles = {
    tsPath: string;
    jsPath: string;
    mcpServePath: string;
};

declare const __dirname: string | undefined;

function bundleSafeGeneratorImplementationDir(): string {
    const cjsBundleDir = typeof __dirname !== 'undefined' ? __dirname : '';
    if (cjsBundleDir.length > 0) {
        return cjsBundleDir;
    }
    return url.fileURLToPath(new URL('.', import.meta.url));
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

function readCliVersionsForBootstrap(): { sdk: string; zod: string; pg: string } {
    const p = resolveCliPackageJsonPathForVersions();
    const raw = fs.readFileSync(p, 'utf-8');
    const pkg = JSON.parse(raw) as { dependencies?: Record<string, string> };
    return {
        sdk: pkg.dependencies?.['@modelcontextprotocol/sdk'] ?? '^1.29.0',
        zod: pkg.dependencies?.zod ?? '^4.4.3',
        pg: pkg.dependencies?.pg ?? '^8.16.0'
    };
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
    return path.relative(process.cwd(), path.resolve(source)) || path.basename(source);
}

function renderInvokeSwitchCases(tools: ResolvedDbToolCodegen[]): string {
    return tools
        .map(tool => {
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
        })
        .join('\n');
}

function renderInvokeBlockTs(tools: ResolvedDbToolCodegen[]): string {
    const toolCases = renderInvokeSwitchCases(tools);
    return `
import pg from 'pg';

export const DEFAULT_PAGE_LIMIT = ${DEFAULT_PAGE_LIMIT};
export const DEFAULT_MAX_LIMIT_CAP = ${DEFAULT_MAX_LIMIT_CAP};

export type InvokeOptions = {
    limit?: number;
    offset?: number;
};

export async function invokeTool(toolName: string, options: InvokeOptions = {}): Promise<unknown> {
    const connectionString = process.env[connectionEnv];
    if (!connectionString || String(connectionString).trim().length === 0) {
        throw new Error(\`Missing database URL: set environment variable "\${connectionEnv}".\`);
    }
    const client = new pg.Client({ connectionString: String(connectionString).trim() });
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

export async function invokeTool(toolName, options = {}) {
    const connectionString = process.env[connectionEnv];
    if (!connectionString || String(connectionString).trim().length === 0) {
        throw new Error(\`Missing database URL: set environment variable "\${connectionEnv}".\`);
    }
    const client = new pg.Client({ connectionString: String(connectionString).trim() });
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
    inputSchemaLiteral: string,
    invokeBlock: string,
    source: string
): string {
    const toolsLiteral = serializeJsonForModule(tools);
    const sourceRef = renderSourceReference(source);
    return `/**
 * Generated from: ${sourceRef}
 */

export const connectionEnv = ${JSON.stringify(connectionEnv)};

export type GeneratedTool = {
    toolName: string;
    title: string;
    description: string;
    table: string;
    maxLimitCap: number;
    example?: string;
};

export const generatedTools: GeneratedTool[] = ${toolsLiteral};

export const inputSchemaByTool: Record<string, Record<string, unknown>> = ${inputSchemaLiteral};

${invokeBlock}
`;
}

function renderJsModule(
    tools: ResolvedDbToolCodegen[],
    connectionEnv: string,
    inputSchemaLiteral: string,
    invokeBlock: string,
    source: string
): string {
    const sourceRef = renderSourceReference(source);
    return `/**
 * Generated from: ${sourceRef}
 */

export const connectionEnv = ${JSON.stringify(connectionEnv)};

export const generatedTools = ${serializeJsonForModule(tools)};

export const inputSchemaByTool = ${inputSchemaLiteral};

${invokeBlock}
`;
}

export async function generateOutput(model: Model, source: string, destination: string): Promise<GeneratedOutputFiles> {
    ensureParentDir(destination);
    const parsed = path.parse(destination);
    const tsPath = parsed.ext === '.ts' ? destination : path.join(parsed.dir, `${parsed.name}.ts`);
    const jsPath = path.join(parsed.dir, `${parsed.name}.mjs`);

    const envName = String(model.env).trim();
    const tools = resolveToolsFromModel(model);
    const inputSchemaByTool = buildInputSchemaByTool(tools);
    const inputSchemaLiteral = serializeJsonForModule(inputSchemaByTool);
    fs.writeFileSync(tsPath, renderTsModule(tools, envName, inputSchemaLiteral, renderInvokeBlockTs(tools), source));
    fs.writeFileSync(jsPath, renderJsModule(tools, envName, inputSchemaLiteral, renderInvokeBlockJs(tools), source));

    const cliDir = resolveGeneratedCliDir(tsPath);
    const mcpServePath = copyBundledMcpServeInto(cliDir);
    writeMinimalPackageJsonIfAbsent(resolveBootstrapProjectRootFromSource(source));

    return { tsPath, jsPath, mcpServePath };
}
