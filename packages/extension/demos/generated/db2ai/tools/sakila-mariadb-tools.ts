/**
 * Generated from: sakila-mariadb.db2ai
 */
import { loggingAdapter } from '../../../src/utils/logging-adapter.js';
import * as z from 'zod/v4';
import { prepareListFilmsInput } from '../../../src/hooks/db2ai/sakila-mariadb-tools/listFilms.js';
import { prepareSearchFilmsInput } from '../../../src/hooks/db2ai/sakila-mariadb-tools/searchFilms.js';

export const connectionEnv = 'SAKILA_MARIADB_DATABASE_URL';

export const databaseDialect = 'mariadb';

export const requiresAuth = false;

export type GeneratedSqlParam = {
    placeholder: string;
    index: number;
    name: string;
    propertyName: string;
    description: string;
    example?: string;
    jsonSchemaType: 'string' | 'integer' | 'number' | 'boolean';
};

export type GeneratedTool = {
    toolName: string;
    title: string;
    description: string;
    kind: 'sql';
    access: 'public' | 'protected';
    hasAuthorize: boolean;
    hasPrepare: boolean;
    sqlText: string;
    params?: GeneratedSqlParam[];
};

export type InvokeOptions = Record<string, unknown>;

export type DbHostContext = {
    connectionString: string;
    databaseDialect: 'postgres' | 'mysql' | 'mariadb' | 'sqlserver' | 'oracle';
    credential?: string;
    upstreamCredential?: string;
    credentials?: unknown;
};

export const generatedTools: GeneratedTool[] = [
    {
        kind: 'sql',
        toolName: 'listFilms',
        title: 'Paginated film rows',
        description:
            'list films from Sakila (MariaDB dialect smoke test against the Sakila Docker DB)\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nExample call: limit=20, offset=0',
        access: 'public',
        hasAuthorize: false,
        hasPrepare: true,
        sqlText: 'SELECT film_id, title, release_year, rating FROM film ORDER BY title LIMIT ? OFFSET ?',
        params: [
            {
                placeholder: ':limit',
                index: 1,
                name: 'limit',
                propertyName: 'limit',
                description: 'max rows per page',
                example: '20',
                jsonSchemaType: 'integer'
            },
            {
                placeholder: ':offset',
                index: 2,
                name: 'offset',
                propertyName: 'offset',
                description: 'rows to skip',
                example: '0',
                jsonSchemaType: 'integer'
            }
        ]
    },
    {
        kind: 'sql',
        toolName: 'searchFilms',
        title: 'Title search in Sakila',
        description:
            'search Sakila films by title substring\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nExample call: searchText=love, maxRows=10',
        access: 'public',
        hasAuthorize: false,
        hasPrepare: true,
        sqlText:
            "SELECT film_id, title, release_year, rating FROM film WHERE title LIKE CONCAT('%', ?, '%') ORDER BY title LIMIT ?",
        params: [
            {
                placeholder: ':searchText',
                index: 1,
                name: 'searchText',
                propertyName: 'searchText',
                description: 'matched in film title',
                example: 'love',
                jsonSchemaType: 'string'
            },
            {
                placeholder: ':maxRows',
                index: 2,
                name: 'maxRows',
                propertyName: 'maxRows',
                description: 'max rows',
                example: '10',
                jsonSchemaType: 'integer'
            }
        ]
    }
];

export const mcpServerName = 'sakila-mariadb-tools';
export const mcpServerVersion = '0.5.0';

const preparers: Record<string, (options: InvokeOptions) => InvokeOptions | Promise<InvokeOptions>> = {
    listFilms: prepareListFilmsInput,
    searchFilms: prepareSearchFilmsInput
};

export const inputZodByTool = {
    listFilms: z
        .object({
            limit: z.union([z.number().int(), z.string()]).describe('max rows per page (SQL :limit) (example: 20)'),
            offset: z.union([z.number().int(), z.string()]).describe('rows to skip (SQL :offset) (example: 0)')
        })
        .strict(),
    searchFilms: z
        .object({
            searchText: z.string().describe('matched in film title (SQL :searchText) (example: love)'),
            maxRows: z.union([z.number().int(), z.string()]).describe('max rows (SQL :maxRows) (example: 10)')
        })
        .strict()
};

import mysql from 'mysql2/promise';

function resolveConnectionString(hostContext: DbHostContext): string {
    const cs = hostContext.connectionString?.trim();
    if (cs) {
        return cs;
    }
    throw new Error(
        'Missing database connection. MCP host must pass hostContext.connectionString (from database env in .db2ai).'
    );
}

function normalizeMysqlRows(rows: unknown): unknown[] {
    return Array.isArray(rows) ? rows : [];
}

function normalizeMysqlParamValue(value: unknown): string | number | null {
    if (value === undefined || value === null) {
        return null;
    }
    const text = String(value);
    const trimmed = text.trim();
    if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) {
        return Number(trimmed);
    }
    return text;
}

function connectionUrlForMysqlDriver(connectionUrl: string): string {
    const trimmed = connectionUrl.trim();
    if (trimmed.startsWith('mariadb://')) {
        return `mysql://${trimmed.slice('mariadb://'.length)}`;
    }
    return trimmed;
}

function compactSqlForLog(sql: string): string {
    return sql.replace(/\s+/g, ' ').trim();
}

export async function invokeTool(
    toolName: string,
    options: InvokeOptions = {},
    hostContext?: DbHostContext
): Promise<unknown> {
    const toolMeta = generatedTools.find((t) => t.toolName === toolName);
    if (!toolMeta) {
        throw new Error('Unknown tool: ' + toolName);
    }
    loggingAdapter.debug('invokeTool', { toolName });

    if (hostContext === undefined) {
        throw new Error('invokeTool requires hostContext from the MCP host (stdio-mcp-server or http-mcp-server).');
    }
    const host = hostContext as DbHostContext;
    let optionsResolved = options;

    if (toolMeta.hasPrepare) {
        const prepare = preparers[toolName];
        if (typeof prepare !== 'function') {
            throw new Error('No preparer for tool: ' + toolName);
        }
        optionsResolved = await Promise.resolve(prepare(optionsResolved));
    }
    const connectionString = connectionUrlForMysqlDriver(resolveConnectionString(host));
    const client = await mysql.createConnection(connectionString);
    try {
        switch (toolName) {
            case 'listFilms': {
                const sqlText = 'SELECT film_id, title, release_year, rating FROM film ORDER BY title LIMIT ? OFFSET ?';
                const sqlValues = [
                    normalizeMysqlParamValue(optionsResolved['limit']),
                    normalizeMysqlParamValue(optionsResolved['offset'])
                ];
                loggingAdapter.debug('executeSql', {
                    toolName: 'listFilms',
                    sql: compactSqlForLog(sqlText),
                    values: sqlValues
                });
                const [rows] = await client.query(sqlText, sqlValues);
                const resultRows = normalizeMysqlRows(rows);
                return {
                    rows: resultRows,
                    rowCount: resultRows.length
                };
            }
            case 'searchFilms': {
                const sqlText =
                    "SELECT film_id, title, release_year, rating FROM film WHERE title LIKE CONCAT('%', ?, '%') ORDER BY title LIMIT ?";
                const sqlValues = [
                    normalizeMysqlParamValue(optionsResolved['searchText']),
                    normalizeMysqlParamValue(optionsResolved['maxRows'])
                ];
                loggingAdapter.debug('executeSql', {
                    toolName: 'searchFilms',
                    sql: compactSqlForLog(sqlText),
                    values: sqlValues
                });
                const [rows] = await client.query(sqlText, sqlValues);
                const resultRows = normalizeMysqlRows(rows);
                return {
                    rows: resultRows,
                    rowCount: resultRows.length
                };
            }
            default:
                throw new Error('Unknown tool: ' + toolName);
        }
    } finally {
        await client.end();
    }
}
