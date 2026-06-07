import pg from 'pg';
import mysql from 'mysql2/promise';
import type { RowDataPacket } from 'mysql2';
import type { ResolvedDatabaseDialect } from './dialect.js';
import {
    DEFAULT_DATABASE_DIALECT,
    connectionUrlForMysqlDriver,
    expectedConnectionUrlDescription,
    isMysqlDialect,
    isSupportedConnectionUrlForDialect
} from './dialect.js';
import { loadLocalEnvFiles, workspaceDirsForDocumentUri } from './env.js';

export type LoadedSchema = {
    dialect: ResolvedDatabaseDialect;
    tables: string[];
    columnsByTable: Record<string, string[]>;
};

const cache = new Map<string, LoadedSchema>();

export function clearSchemaCache(): void {
    cache.clear();
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

export async function loadSchema(
    connectionUrl: string,
    dialect: ResolvedDatabaseDialect = DEFAULT_DATABASE_DIALECT
): Promise<LoadedSchema> {
    const key = `${dialect}:${connectionUrl.trim()}`;
    const cached = cache.get(key);
    if (cached) {
        return cached;
    }
    if (!isSupportedConnectionUrlForDialect(dialect, connectionUrl)) {
        throw new Error(`Expected ${expectedConnectionUrlDescription(dialect)} for ${dialect} database.`);
    }

    const loaded = isMysqlDialect(dialect)
        ? await loadMysqlSchema(connectionUrl.trim(), dialect as 'mysql' | 'mariadb')
        : await loadPostgresSchema(connectionUrl.trim());
    cache.set(key, loaded);
    return loaded;
}

async function loadPostgresSchema(connectionUrl: string): Promise<LoadedSchema> {
    const client = new pg.Client({ connectionString: connectionUrl });
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
        return { dialect: 'postgres', tables, columnsByTable };
    } finally {
        await client.end();
    }
}

type MysqlTableRow = RowDataPacket & { table_name: string };
type MysqlColumnRow = RowDataPacket & { table_name: string; column_name: string };

async function loadMysqlSchema(connectionUrl: string, dialect: 'mysql' | 'mariadb'): Promise<LoadedSchema> {
    const connection = await mysql.createConnection(connectionUrlForMysqlDriver(connectionUrl));
    try {
        const [tablesRows] = await connection.query<MysqlTableRow[]>(
            `SELECT TABLE_NAME AS table_name
             FROM information_schema.tables
             WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE'
             ORDER BY TABLE_NAME`
        );
        const [columnsRows] = await connection.query<MysqlColumnRow[]>(
            `SELECT TABLE_NAME AS table_name, COLUMN_NAME AS column_name
             FROM information_schema.columns
             WHERE table_schema = DATABASE()
             ORDER BY TABLE_NAME, ORDINAL_POSITION`
        );
        const tables = tablesRows.map((row) => row.table_name);
        const columnsByTable: Record<string, string[]> = {};
        for (const row of columnsRows) {
            const list = columnsByTable[row.table_name] ?? [];
            list.push(row.column_name);
            columnsByTable[row.table_name] = list;
        }
        return { dialect, tables, columnsByTable };
    } finally {
        await connection.end();
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
