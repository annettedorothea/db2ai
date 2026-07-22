import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

/** Dialect string from generated `*-tools.ts` → npm package for dist/mcp bundles. */
const DIALECT_RUNTIME_DEPS = {
    postgres: 'pg',
    mysql: 'mysql2',
    mariadb: 'mysql2',
    sqlserver: 'mssql',
    oracle: 'oracledb',
    duckdb: '@duckdb/node-api'
};

/**
 * Read `export const databaseDialect = '…'` from generated tools (prefer `.ts`, fall back to `.js`).
 *
 * @param {string} demosRoot
 * @param {string} moduleName
 * @returns {string | undefined}
 */
function readDatabaseDialect(demosRoot, moduleName) {
    const toolsDir = path.join(demosRoot, 'generated', 'db2ai', 'tools');
    const candidates = [
        path.join(toolsDir, `${moduleName}-tools.ts`),
        path.join(toolsDir, `${moduleName}-tools.js`)
    ];
    for (const filePath of candidates) {
        if (!existsSync(filePath)) {
            continue;
        }
        const text = readFileSync(filePath, 'utf-8');
        const match = /export const databaseDialect\s*=\s*['"](\w+)['"]/.exec(text);
        if (match) {
            return match[1];
        }
    }
    return undefined;
}

/**
 * Extra runtime dependencies for a db2ai MCP dist bundle (driver for the module dialect).
 *
 * @param {string} moduleName
 * @param {Record<string, string>} rootDeps
 * @param {string} demosRoot
 * @returns {Record<string, string>}
 */
export function db2aiExtraRuntimeDeps(moduleName, rootDeps, demosRoot) {
    const dialect = readDatabaseDialect(demosRoot, moduleName);
    if (!dialect) {
        return {};
    }
    const pkgName = DIALECT_RUNTIME_DEPS[dialect];
    if (!pkgName) {
        return {};
    }
    const version = rootDeps[pkgName];
    if (!version) {
        throw new Error(
            `[extra-runtime-deps] demos package.json missing dependency "${pkgName}" for dialect "${dialect}" (${moduleName})`
        );
    }
    return { [pkgName]: version };
}
