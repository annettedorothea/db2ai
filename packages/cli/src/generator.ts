import type { Model } from 'db-2-ai-dsl-language';
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
} from '@core2ai/codegen';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as url from 'node:url';
import { buildInputSchemaByTool, resolveToolsFromModel, type JsonSchemaDict } from './db-query-codegen.js';
import { renderDbMcpHostAdapterBlock } from './generator/host-adapter-render.js';
import { renderInvokeBlockJs, renderInvokeBlockTs } from './generator/invoke-render.js';
import { renderJsModule, renderMcpServerIdentityExports, renderTsModule } from './generator/module-render.js';

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

function createBootstrapConfig(): ProjectBootstrapConfig {
    return {
        generatorImplementationDir: __generatorDirname,
        embedHomeEnv: 'DB2AI_EMBED_HOME',
        fallbackProjectName: 'db2ai-project',
        requiredRuntimeDeps: ['@modelcontextprotocol/sdk', 'zod', 'pg'],
        dependencyVersionFallbacks: {
            '@modelcontextprotocol/sdk': '^1.29.0',
            zod: '^4.4.3',
            pg: '^8.16.0'
        },
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

export async function generateOutput(model: Model, source: string, destination: string): Promise<GeneratedOutputFiles> {
    ensureParentDir(destination);
    const bootstrapConfig = createBootstrapConfig();
    const parsed = path.parse(destination);
    const tsPath = parsed.ext === '.ts' ? destination : path.join(parsed.dir, `${parsed.name}.ts`);
    const jsPath = path.join(parsed.dir, `${parsed.name}.mjs`);

    const envName = String(model.env).trim();
    const tools = resolveToolsFromModel(model);
    const inputSchemaByTool = buildInputSchemaByTool(tools) as Record<string, JsonSchemaDict>;
    const authKind: 'none' | 'credential' = 'none';
    const { name: mcpServerName, version: mcpServerVersion } = resolveMcpServerIdentityFromDestination(
        tsPath,
        bootstrapConfig
    );
    const mcpServerIdentityBlock = renderMcpServerIdentityExports(mcpServerName, mcpServerVersion);
    const sharedRuntimePrefix = `${buildInputZodBlock(inputSchemaByTool)}\n${renderDbMcpHostAdapterBlock(authKind)}\n`;
    fs.writeFileSync(
        tsPath,
        renderTsModule(
            tools,
            envName,
            mcpServerIdentityBlock,
            `${sharedRuntimePrefix}${renderInvokeBlockTs(tools)}`,
            source
        )
    );
    fs.writeFileSync(
        jsPath,
        renderJsModule(
            tools,
            envName,
            mcpServerIdentityBlock,
            `${sharedRuntimePrefix}${renderInvokeBlockJs(tools)}`,
            source
        )
    );
    await formatGeneratedFilesWithPrettier([tsPath, jsPath]);

    const cliDir = resolveGeneratedCliDir(tsPath);
    const mcpServePath = copyBundledMcpServeInto(cliDir, bootstrapConfig);
    writeMinimalPackageJsonIfAbsent(resolveBootstrapProjectRootFromSource(source), bootstrapConfig);

    return { tsPath, jsPath, mcpServePath };
}
