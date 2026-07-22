import * as fs from 'node:fs';
import * as path from 'node:path';
import {
    relativeJsImportPath,
    resolveBootstrapProjectRootFromSource,
    resolveHostProductFromGeneratedToolsPath,
    resolveMcpModuleNameFromToolsModule
} from '@toolfactory.dev/core/codegen';

export function resolveInitDatabaseStubDir(projectRoot: string, toolsModuleTsPath: string): string {
    const hostProduct = resolveHostProductFromGeneratedToolsPath(toolsModuleTsPath);
    const mcpModuleName = resolveMcpModuleNameFromToolsModule(toolsModuleTsPath);
    return path.join(projectRoot, 'src', 'db', hostProduct, mcpModuleName);
}

function initDatabaseStubRelativePath(toolsModuleTsPath: string): string {
    const hostProduct = resolveHostProductFromGeneratedToolsPath(toolsModuleTsPath);
    const mcpModuleName = resolveMcpModuleNameFromToolsModule(toolsModuleTsPath);
    return `src/db/${hostProduct}/${mcpModuleName}/initDatabase.ts`;
}

export function renderInitDatabaseStubFileContent(toolsModuleTsPath: string): string {
    const rel = initDatabaseStubRelativePath(toolsModuleTsPath);
    return `/**
 * Database setup for DuckDB (write-once — implement initDatabase).
 * Register views/tables from local files here (e.g. read_csv). Tool SQL uses relation names only.
 */
import type { DuckDBConnection } from '@duckdb/node-api';

export async function initDatabase(db: DuckDBConnection): Promise<void> {
    void db;
    throw new Error('Implement initDatabase in ${rel}');
}
`;
}

export async function ensureInitDatabaseStubAtProjectRoot(
    projectRoot: string,
    toolsModuleTsPath: string
): Promise<string> {
    const stubDir = resolveInitDatabaseStubDir(projectRoot, toolsModuleTsPath);
    fs.mkdirSync(stubDir, { recursive: true });
    const stubPath = path.join(stubDir, 'initDatabase.ts');
    if (!fs.existsSync(stubPath)) {
        fs.writeFileSync(stubPath, renderInitDatabaseStubFileContent(toolsModuleTsPath), 'utf8');
    }
    return stubPath;
}

export async function ensureInitDatabaseStubFromSource(source: string, toolsModuleTsPath: string): Promise<string> {
    const projectRoot = resolveBootstrapProjectRootFromSource(source);
    return ensureInitDatabaseStubAtProjectRoot(projectRoot, toolsModuleTsPath);
}

export function renderInitDatabaseImport(destinationTsPath: string, stubPath: string): string {
    const importSpec = relativeJsImportPath(destinationTsPath, stubPath);
    return `import { initDatabase } from '${importSpec}';`;
}
