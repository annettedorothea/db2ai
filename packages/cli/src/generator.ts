import type { Model } from 'db-2-ai-dsl-language';
import { databaseDialectFromModel, type ResolvedDatabaseDialect } from 'db-2-ai-dsl-language';
import {
    buildInputZodBlock,
    copyBundledMcpServeInto,
    ensureParentDir,
    formatGeneratedFilesWithPrettier,
    resolveBootstrapProjectRootFromSource,
    resolveGeneratedCliDir,
    resolveMcpServerIdentityFromDestination,
    writeMinimalPackageJsonIfAbsent,
    type ProjectBootstrapConfig
} from '@core2ai/core/codegen';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as url from 'node:url';
import { buildInputSchemaByTool, resolveToolsFromModel, type JsonSchemaDict } from './db-query-codegen.js';
import {
    ensureCheckedAuthStubs,
    listCheckedToolNames,
    renderParameterCheckerImports,
    renderParameterCheckersMap
} from './generator/auth-stub-render.js';
import { MCP_HOST_JWT_IMPORT, renderDbMcpHostAdapterBlock } from './generator/host-adapter-render.js';
import { renderInvokeBlockJs, renderInvokeBlockTs } from './generator/invoke-render.js';
import { renderJsModule, renderMcpServerIdentityExports, renderTsModule } from './generator/module-render.js';

export type GeneratedOutputFiles = {
    tsPath: string;
    jsPath: string;
    mcpServePath: string;
};

declare const __dirname: string | undefined;

function bundleSafeGeneratorImplementationDir(): string {
    if (typeof __dirname !== 'undefined' && __dirname.length > 0) {
        return __dirname;
    }
    return path.dirname(url.fileURLToPath(import.meta.url));
}

const __generatorDirname = bundleSafeGeneratorImplementationDir();

function createBootstrapConfig(databaseDialect: ResolvedDatabaseDialect, model: Model): ProjectBootstrapConfig {
    const databaseDriverDep = databaseDialect === 'mysql' ? 'mysql2' : 'pg';
    const needsCore = Boolean(model.auth) || listCheckedToolNames(model).length > 0;
    const requiredRuntimeDeps = ['@modelcontextprotocol/sdk', 'zod', databaseDriverDep];
    if (needsCore) {
        requiredRuntimeDeps.push('@core2ai/core');
    }
    const dependencyVersionFallbacks: Record<string, string> = {
        '@modelcontextprotocol/sdk': '^1.29.0',
        zod: '^4.4.3',
        pg: '^8.16.0',
        mysql2: '^3.22.3'
    };
    if (needsCore) {
        dependencyVersionFallbacks['@core2ai/core'] = 'github:annettedorothea/core2ai#v0.0.4';
    }
    return {
        generatorImplementationDir: __generatorDirname,
        embedHomeEnv: 'DB2AI_EMBED_HOME',
        fallbackProjectName: 'db2ai-project',
        requiredRuntimeDeps,
        dependencyVersionFallbacks,
        resolvePackageRoot(dir) {
            const oneUp = path.resolve(dir, '..');
            if (fs.existsSync(path.join(oneUp, 'package.json'))) {
                return oneUp;
            }
            return path.resolve(dir, '..', '..');
        },
        bundledMcpMissingMessage(src) {
            return `Bundled MCP host missing (${src}). Run npm run bundle:mcp-runtime from the db2ai workspace root.`;
        },
        missingDepsMessage(pjsonPath, missing) {
            return `[generate] "${pjsonPath}": install runtime dependencies: ${missing.join(', ')} (npm install), then generated/cli/mcp-serve.mjs can run.`;
        }
    };
}

function authRuntimeKind(model: Model): 'none' | 'credential' {
    return model.auth ? 'credential' : 'none';
}

export async function generateOutput(model: Model, source: string, destination: string): Promise<GeneratedOutputFiles> {
    ensureParentDir(destination);
    const databaseDialect = databaseDialectFromModel(model);
    const bootstrapConfig = createBootstrapConfig(databaseDialect, model);
    const parsed = path.parse(destination);
    const tsPath = parsed.ext === '.ts' ? destination : path.join(parsed.dir, `${parsed.name}.ts`);
    const jsPath = path.join(parsed.dir, `${parsed.name}.mjs`);

    const envName = String(model.env).trim();
    const tools = resolveToolsFromModel(model);
    const inputSchemaByTool = buildInputSchemaByTool(model, tools) as Record<string, JsonSchemaDict>;
    const authKind = authRuntimeKind(model);
    const hasAuth = authKind === 'credential';
    const hasCheckedOps = listCheckedToolNames(model).length > 0;
    const stubPaths = hasCheckedOps ? await ensureCheckedAuthStubs(source, model) : new Map<string, string>();
    const hasChecked = stubPaths.size > 0;
    const parameterCheckerImportsTs = hasChecked ? renderParameterCheckerImports(tsPath, stubPaths, true) : '';
    const parameterCheckerImportsJs = hasChecked ? renderParameterCheckerImports(tsPath, stubPaths, false) : '';
    const parameterCheckersMapTs = hasChecked ? renderParameterCheckersMap(stubPaths, true) : '';
    const parameterCheckersMapJs = hasChecked ? renderParameterCheckersMap(stubPaths, false) : '';
    const mcpHostJwtImport = hasAuth ? MCP_HOST_JWT_IMPORT : '';

    const { name: mcpServerName, version: mcpServerVersion } = resolveMcpServerIdentityFromDestination(
        tsPath,
        bootstrapConfig
    );
    const mcpServerIdentityBlock = renderMcpServerIdentityExports(mcpServerName, mcpServerVersion);
    const authRuntimePrefixTs = parameterCheckersMapTs.length > 0 ? `${parameterCheckersMapTs}\n\n` : '';
    const authRuntimePrefixJs = parameterCheckersMapJs.length > 0 ? `${parameterCheckersMapJs}\n\n` : '';
    const inputZodBlock = buildInputZodBlock(inputSchemaByTool);
    const invokeBlockTs = renderInvokeBlockTs(tools, databaseDialect, hasAuth, hasChecked);
    const invokeBlockJs = renderInvokeBlockJs(tools, databaseDialect, hasAuth, hasChecked);
    const hostAdapterTs = renderDbMcpHostAdapterBlock(authKind, databaseDialect, true);
    const hostAdapterJs = renderDbMcpHostAdapterBlock(authKind, databaseDialect, false);

    fs.writeFileSync(
        tsPath,
        renderTsModule(
            tools,
            envName,
            databaseDialect,
            mcpServerIdentityBlock,
            `${authRuntimePrefixTs}${inputZodBlock}\n${hostAdapterTs}\n${invokeBlockTs}`,
            model,
            source,
            parameterCheckerImportsTs,
            mcpHostJwtImport
        )
    );
    fs.writeFileSync(
        jsPath,
        renderJsModule(
            tools,
            envName,
            databaseDialect,
            mcpServerIdentityBlock,
            `${authRuntimePrefixJs}${inputZodBlock}\n${hostAdapterJs}\n${invokeBlockJs}`,
            model,
            source,
            parameterCheckerImportsJs,
            mcpHostJwtImport
        )
    );
    await formatGeneratedFilesWithPrettier([tsPath, jsPath]);

    const cliDir = resolveGeneratedCliDir(tsPath);
    const mcpServePath = copyBundledMcpServeInto(cliDir, bootstrapConfig);
    writeMinimalPackageJsonIfAbsent(resolveBootstrapProjectRootFromSource(source), bootstrapConfig);

    return { tsPath, jsPath, mcpServePath };
}
