import type { Model } from 'db-2-ai-dsl-language';
import { buildInputZodBlock } from '@core2ai/codegen';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as url from 'node:url';
import { buildInputSchemaByTool, resolveToolsFromModel, type JsonSchemaDict } from './db-query-codegen.js';
import { renderDbMcpHostAdapterBlock } from './generator/host-adapter-render.js';
import { renderInvokeBlockJs, renderInvokeBlockTs } from './generator/invoke-render.js';
import { renderJsModule, renderMcpServerIdentityExports, renderTsModule } from './generator/module-render.js';
import {
    copyBundledMcpServeInto,
    ensureParentDir,
    resolveBootstrapProjectRootFromSource,
    resolveGeneratedCliDir,
    resolveMcpServerIdentityFromDestination,
    writeMinimalPackageJsonIfAbsent
} from './generator/project-bootstrap.js';

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

export async function generateOutput(model: Model, source: string, destination: string): Promise<GeneratedOutputFiles> {
    ensureParentDir(destination);
    const parsed = path.parse(destination);
    const tsPath = parsed.ext === '.ts' ? destination : path.join(parsed.dir, `${parsed.name}.ts`);
    const jsPath = path.join(parsed.dir, `${parsed.name}.mjs`);

    const envName = String(model.env).trim();
    const tools = resolveToolsFromModel(model);
    const inputSchemaByTool = buildInputSchemaByTool(tools) as Record<string, JsonSchemaDict>;
    const authKind: 'none' | 'credential' = 'none';
    const { name: mcpServerName, version: mcpServerVersion } = resolveMcpServerIdentityFromDestination(
        tsPath,
        __generatorDirname
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

    const cliDir = resolveGeneratedCliDir(tsPath);
    const mcpServePath = copyBundledMcpServeInto(cliDir, __generatorDirname);
    writeMinimalPackageJsonIfAbsent(resolveBootstrapProjectRootFromSource(source), __generatorDirname);

    return { tsPath, jsPath, mcpServePath };
}
