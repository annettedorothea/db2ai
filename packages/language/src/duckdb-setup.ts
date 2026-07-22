import * as fs from 'node:fs';
import * as path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { DuckDBConnection } from '@duckdb/node-api';

export type DuckDbInitDatabaseFn = (db: DuckDBConnection) => void | Promise<void>;

function documentUriToFsPath(documentUri: string): string {
    const withoutFragment = documentUri.includes('#') ? documentUri.slice(0, documentUri.indexOf('#')) : documentUri;
    return withoutFragment.startsWith('file://') ? fileURLToPath(withoutFragment) : withoutFragment;
}

/** Project root for a `.db2ai` document (directory containing the DSL file). */
export function resolveDuckdbProjectRootFromDocumentUri(documentUri: string): string {
    return path.dirname(path.resolve(documentUriToFsPath(documentUri)));
}

/** `flight.db2ai` → `…/src/db/db2ai/flight-tools/initDatabase.js` */
export function resolveInitDatabaseJsPath(projectRoot: string, documentUri: string): string {
    const filePath = documentUriToFsPath(documentUri);
    const baseName = path.basename(filePath, path.extname(filePath));
    return path.join(projectRoot, 'src', 'db', 'db2ai', `${baseName}-tools`, 'initDatabase.js');
}

export async function loadInitDatabaseFn(initDatabaseJsPath: string): Promise<DuckDbInitDatabaseFn> {
    if (!fs.existsSync(initDatabaseJsPath)) {
        throw new Error(`initDatabase stub not found at ${initDatabaseJsPath} (run generate:all / build:generated).`);
    }
    const mtime = fs.statSync(initDatabaseJsPath).mtimeMs;
    const href = `${pathToFileURL(initDatabaseJsPath).href}?t=${mtime}`;
    const mod = (await import(href)) as { initDatabase?: DuckDbInitDatabaseFn };
    if (typeof mod.initDatabase !== 'function') {
        throw new Error(`initDatabase export missing in ${initDatabaseJsPath}`);
    }
    return mod.initDatabase;
}

/** In-memory DuckDB + initDatabase (same setup as MCP invoke). */
export async function openDuckdbValidationSession(documentUri: string): Promise<DuckDBConnection> {
    const projectRoot = resolveDuckdbProjectRootFromDocumentUri(documentUri);
    const initPath = resolveInitDatabaseJsPath(projectRoot, documentUri);
    const initDatabase = await loadInitDatabaseFn(initPath);
    const connection = await DuckDBConnection.create();
    try {
        await initDatabase(connection);
    } catch (err) {
        connection.closeSync();
        throw err;
    }
    return connection;
}
