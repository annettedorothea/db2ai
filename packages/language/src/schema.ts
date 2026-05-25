import pg from 'pg';
import { loadLocalEnvFiles, workspaceDirsForDocumentUri } from './env.js';

export type LoadedSchema = {
    tables: string[];
    columnsByTable: Record<string, string[]>;
};

const cache = new Map<string, LoadedSchema>();

export function clearSchemaCache(): void {
    cache.clear();
}

export function isPostgresqlConnectionUrl(connectionUrl: string): boolean {
    const trimmed = connectionUrl.trim();
    return trimmed.startsWith('postgresql://') || trimmed.startsWith('postgres://');
}

export function isValidEnvVarName(name: string): boolean {
    const trimmed = name.trim();
    return /^[A-Za-z_][A-Za-z0-9_]*$/.test(trimmed);
}

export function resolveDatabaseUrlFromEnv(envName: string): string | undefined {
    const key = envName.trim();
    if (key.length === 0) {
        return undefined;
    }
    const value = process.env[key];
    if (value === undefined || value === null) {
        return undefined;
    }
    const trimmed = String(value).trim();
    return trimmed.length > 0 ? trimmed : undefined;
}

/** Load `.env` near the document (and cwd), then read the named variable. */
export function resolveDatabaseUrlFromEnvForDocument(envName: string, documentUri?: string): string | undefined {
    if (documentUri) {
        loadLocalEnvFiles(workspaceDirsForDocumentUri(documentUri));
    }
    return resolveDatabaseUrlFromEnv(envName);
}

export async function loadSchema(connectionUrl: string): Promise<LoadedSchema> {
    const key = connectionUrl.trim();
    const cached = cache.get(key);
    if (cached) {
        return cached;
    }
    if (!isPostgresqlConnectionUrl(key)) {
        throw new Error('Only postgresql:// or postgres:// connection URLs are supported.');
    }

    const client = new pg.Client({ connectionString: key });
    await client.connect();
    try {
        const tablesResult = await client.query<{ table_name: string }>(
            `SELECT table_name
             FROM information_schema.tables
             WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
             ORDER BY table_name`
        );
        const columnsResult = await client.query<{ table_name: string; column_name: string }>(
            `SELECT table_name, column_name
             FROM information_schema.columns
             WHERE table_schema = 'public'
             ORDER BY table_name, ordinal_position`
        );
        const tables = tablesResult.rows.map((row) => row.table_name);
        const columnsByTable: Record<string, string[]> = {};
        for (const row of columnsResult.rows) {
            const list = columnsByTable[row.table_name] ?? [];
            list.push(row.column_name);
            columnsByTable[row.table_name] = list;
        }
        const loaded: LoadedSchema = { tables, columnsByTable };
        cache.set(key, loaded);
        return loaded;
    } finally {
        await client.end();
    }
}

export function hasTable(loaded: LoadedSchema, tableName: string): boolean {
    return loaded.tables.includes(tableName);
}

export function columnsForTable(loaded: LoadedSchema, tableName: string): string[] {
    return loaded.columnsByTable[tableName] ?? [];
}

export function hasColumn(loaded: LoadedSchema, tableName: string, columnName: string): boolean {
    return columnsForTable(loaded, tableName).includes(columnName);
}
