import type { Model } from 'db-2-ai-dsl-language';
import { databaseDialectFromModel } from 'db-2-ai-dsl-language';
import {
    assertGeneratedToolsDestinationMatchesHostProduct,
    ensureLoggingAdapterStubFromSource,
    ensureParentDir,
    resolveBootstrapProjectRootFromSource,
    resolveGeneratedCliDir,
    writeGeneratedDemosTestSupport,
    writeGeneratedMcpRuntimes,
    writeGeneratedModuleMcpServers,
    writeGeneratedScripts,
    type ProjectBootstrapConfig
} from '@toolfactory.dev/core/codegen';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as url from 'node:url';
import { renderBootstrap } from './generator/render-bootstrap.js';
import { renderCheckStubs } from './generator/render-check-stubs.js';
import { renderToolsModule } from './generator/render-tools-module.js';

export type GeneratedOutputFiles = {
    tsPath: string;
    mcpRuntimePaths: {
        stdioRuntimePath: string;
        publicHttpRuntimePath: string;
        passthroughHttpRuntimePath: string;
        oauthHttpRuntimePath: string;
    };
    moduleMcpServerPaths: string[];
};

declare const __dirname: string | undefined;

function bundleSafeGeneratorImplementationDir(): string {
    if (typeof __dirname !== 'undefined' && __dirname.length > 0) {
        return __dirname;
    }
    return path.dirname(url.fileURLToPath(import.meta.url));
}

const __generatorDirname = bundleSafeGeneratorImplementationDir();

function createBootstrapConfig(databaseDialect: ReturnType<typeof databaseDialectFromModel>): ProjectBootstrapConfig {
    const databaseDriverDep =
        databaseDialect === 'mysql' || databaseDialect === 'mariadb'
            ? 'mysql2'
            : databaseDialect === 'sqlserver'
              ? 'mssql'
              : databaseDialect === 'oracle'
                ? 'oracledb'
                : 'pg';
    return {
        hostProduct: 'db2ai',
        generatorImplementationDir: __generatorDirname,
        embedHomeEnv: 'DB2AI_EMBED_HOME',
        fallbackProjectName: 'db2ai-project',
        requiredRuntimeDeps: ['@modelcontextprotocol/sdk', 'zod', databaseDriverDep],
        dependencyVersionFallbacks: {
            '@modelcontextprotocol/sdk': '^1.29.0',
            zod: '^4.4.3',
            pg: '^8.16.0',
            mysql2: '^3.22.3',
            mssql: '^11.0.1',
            oracledb: '^6.10.0'
        },
        resolvePackageRoot(dir) {
            const oneUp = path.resolve(dir, '..');
            if (fs.existsSync(path.join(oneUp, 'package.json'))) {
                return oneUp;
            }
            return path.resolve(dir, '..', '..');
        },
        missingDepsMessage(pjsonPath, missing) {
            return `[generate] "${pjsonPath}": install runtime dependencies: ${missing.join(', ')} (npm install), then run a generated servers/*-mcp-server.js host.`;
        }
    };
}

export async function generateOutput(model: Model, source: string, destination: string): Promise<GeneratedOutputFiles> {
    ensureParentDir(destination);
    const databaseDialect = databaseDialectFromModel(model);
    const bootstrapConfig = createBootstrapConfig(databaseDialect);
    const parsed = path.parse(destination);
    const tsPath = parsed.ext === '.ts' ? destination : path.join(parsed.dir, `${parsed.name}.ts`);
    const hostProduct = bootstrapConfig.hostProduct;
    if (!hostProduct) {
        throw new Error('Codegen: bootstrapConfig.hostProduct is required (api2ai or db2ai).');
    }
    assertGeneratedToolsDestinationMatchesHostProduct(tsPath, hostProduct);

    const stubPaths = await renderCheckStubs(source, model, tsPath);
    const toolsModuleSource = await renderToolsModule({
        model,
        source,
        destinationTsPath: tsPath,
        stubPaths,
        bootstrapConfig,
        databaseDialect
    });
    fs.writeFileSync(tsPath, toolsModuleSource);

    const projectRoot = resolveBootstrapProjectRootFromSource(source);
    const cliDir = resolveGeneratedCliDir(tsPath);
    const mcpRuntimePaths = writeGeneratedMcpRuntimes(cliDir, bootstrapConfig, projectRoot);
    const moduleMcpServerPaths = writeGeneratedModuleMcpServers(tsPath);
    renderBootstrap(projectRoot, bootstrapConfig);
    ensureLoggingAdapterStubFromSource(source);
    writeGeneratedDemosTestSupport(projectRoot);
    writeGeneratedScripts(projectRoot);

    return {
        tsPath,
        mcpRuntimePaths,
        moduleMcpServerPaths
    };
}
