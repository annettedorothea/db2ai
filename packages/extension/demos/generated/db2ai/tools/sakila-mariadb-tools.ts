/**
 * Generated from: sakila-mariadb.db2ai
 */
import { loggingAdapter } from '../../../src/utils/logging-adapter.js';
import * as z from 'zod/v4';
import { prepareToolCallForListFilms } from '../../../src/hooks/db2ai/sakila-mariadb-tools/prepareToolCallForListFilms.js';
import { prepareToolCallForSearchFilms } from '../../../src/hooks/db2ai/sakila-mariadb-tools/prepareToolCallForSearchFilms.js';

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
    hasCheckToolAccess: boolean;
    hasPrepareToolCall: boolean;
    sqlText: string;
    params?: GeneratedSqlParam[];
};

export type InvokeOptions = Record<string, unknown>;

export type DbHostContext = {
    connectionString: string;
    databaseDialect: 'postgres' | 'mysql' | 'mariadb' | 'sqlserver' | 'oracle';
    credential?: string;
};

export const generatedTools: GeneratedTool[] = [
    {
        kind: 'sql',
        toolName: 'listFilms',
        title: 'Paginated film rows',
        description:
            'list films from Sakila (MariaDB dialect smoke test against the Sakila Docker DB)\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- limit: max rows per page (type: integer) (example: 20)\n- offset: rows to skip (type: integer) (example: 0)\n\nExample call: limit=20, offset=0',
        access: 'public',
        hasCheckToolAccess: false,
        hasPrepareToolCall: true,
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
            'search Sakila films by title substring\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- searchText: matched in film title (type: string) (example: love)\n- maxRows: max rows (type: integer) (example: 10)\n\nExample call: searchText=love, maxRows=10',
        access: 'public',
        hasCheckToolAccess: false,
        hasPrepareToolCall: true,
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
export const mcpServerVersion = '1.0.1';

export { mcpBuildGeneratedAt } from '../mcp-build-generated-at.js';

const prepareToolCallHooks: Record<
    string,
    (options: InvokeOptions, credential?: string) => InvokeOptions | Promise<InvokeOptions>
> = {
    listFilms: prepareToolCallForListFilms,
    searchFilms: prepareToolCallForSearchFilms
};

export const inputZodByTool = {
    listFilms: z
        .object({
            limit: z.number().int().describe('max rows per page (SQL :limit) (type: integer) (example: 20)'),
            offset: z.number().int().describe('rows to skip (SQL :offset) (type: integer) (example: 0)')
        })
        .strict(),
    searchFilms: z
        .object({
            searchText: z.string().describe('matched in film title (SQL :searchText) (type: string) (example: love)'),
            maxRows: z.number().int().describe('max rows (SQL :maxRows) (type: integer) (example: 10)')
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

function normalizeMysqlNumericParamValue(value: unknown): number | null {
    if (value === undefined || value === null) {
        return null;
    }
    const n = typeof value === 'number' ? value : Number(String(value));
    return Number.isFinite(n) ? n : null;
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
        throw new Error('invokeTool requires hostContext from the MCP host (servers/*-mcp-server).');
    }
    const host = hostContext as DbHostContext;
    let optionsResolved = options;
    let credential: string | undefined = host.credential?.trim() ? String(host.credential).trim() : undefined;

    if (toolMeta.access === 'protected') {
        const inbound = host.credential;
        if (!inbound || !String(inbound).trim()) {
            throw new Error(
                'Missing host credential. stdio: set env for --auth-env on the MCP host; passthrough HTTP: MCP auth header (e.g. x-api-token); OAuth HTTP: complete MCP login (Authorization Bearer from Cursor).'
            );
        }
        credential = String(inbound).trim();
    }
    if (toolMeta.hasPrepareToolCall) {
        const prepareToolCall = prepareToolCallHooks[toolName];
        if (typeof prepareToolCall !== 'function') {
            throw new Error('No prepareToolCall hook for tool: ' + toolName);
        }
        if (toolMeta.access === 'protected') {
            if (credential === undefined) {
                throw new Error('prepareToolCall requires credential for protected tools.');
            }
            optionsResolved = await Promise.resolve(prepareToolCall(optionsResolved, credential));
        } else {
            optionsResolved = await Promise.resolve(prepareToolCall(optionsResolved));
        }
    }
    const connectionString = connectionUrlForMysqlDriver(resolveConnectionString(host));
    const client = await mysql.createConnection(connectionString);
    try {
        switch (toolName) {
            case 'listFilms': {
                const sqlText = 'SELECT film_id, title, release_year, rating FROM film ORDER BY title LIMIT ? OFFSET ?';
                const sqlValues = [
                    normalizeMysqlNumericParamValue(optionsResolved['limit']),
                    normalizeMysqlNumericParamValue(optionsResolved['offset'])
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
                    optionsResolved['searchText'] !== undefined && optionsResolved['searchText'] !== null
                        ? String(optionsResolved['searchText'])
                        : null,
                    normalizeMysqlNumericParamValue(optionsResolved['maxRows'])
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
