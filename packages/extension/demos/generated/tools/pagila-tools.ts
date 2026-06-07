/**
 * Generated from: pagila.db2ai
 */
import { loggingAdapter } from '../../src/utils/logging-adapter.js';

export const connectionEnv = 'PAGILA_DATABASE_URL';

export const databaseDialect = 'postgres';

export const requiresAuth = true;

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
    access: 'public' | 'protected' | 'checked';
    sqlText: string;
    params?: GeneratedSqlParam[];
};

export type InvokeOptions = Record<string, unknown>;

export type DbHostContext = {
    connectionString: string;
    databaseDialect: 'postgres' | 'mysql' | 'sqlserver';
    credential?: string;
    jwt?: Record<string, unknown>;
};

export type CheckedHostContext = {
    credential: string;
    jwt?: Record<string, unknown>;
};

export const generatedTools: GeneratedTool[] = [
    {
        kind: 'sql',
        toolName: 'listFilms',
        title: 'Paginated film rows',
        description:
            'list films from Pagila with pagination\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- limit (:limit): max rows per page (example: 100)\n- offset (:offset): rows to skip (example: 0)\n\nExample call: limit=100, offset=0',
        access: 'public',
        sqlText: 'SELECT * FROM film LIMIT LEAST($1, 500) OFFSET $2',
        params: [
            {
                placeholder: ':limit',
                index: 1,
                name: 'limit',
                propertyName: 'limit',
                description: 'max rows per page',
                example: '100',
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
        toolName: 'listActors',
        title: 'Paginated actor rows',
        description:
            'List actors from Pagila with pagination.\n        Protected: requires DB2AI_AUTH_TOKEN at MCP startup.\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- limit (:limit): \n                Max rows per page.\n                SQL caps at 500 via LEAST(:limit, 500).\n             (example: 100)\n- offset (:offset): rows to skip (example: 0)\n\nExample call: limit=100, offset=0',
        access: 'protected',
        sqlText: 'SELECT * FROM actor LIMIT LEAST($1, 500) OFFSET $2',
        params: [
            {
                placeholder: ':limit',
                index: 1,
                name: 'limit',
                propertyName: 'limit',
                description:
                    '\n                Max rows per page.\n                SQL caps at 500 via LEAST(:limit, 500).\n            ',
                example: '100',
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
        toolName: 'listCustomers',
        title: 'Paginated customer rows',
        description:
            'list customers with pagination\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- limit (:limit): max rows per page (example: 10)\n- offset (:offset): rows to skip (example: 0)\n\nExample call: limit=10, offset=0',
        access: 'public',
        sqlText: 'SELECT * FROM customer LIMIT LEAST($1, 500) OFFSET $2',
        params: [
            {
                placeholder: ':limit',
                index: 1,
                name: 'limit',
                propertyName: 'limit',
                description: 'max rows per page',
                example: '10',
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
        toolName: 'listCategories',
        title: 'Paginated category rows',
        description:
            'list categories with pagination\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- limit (:limit): max rows per page (example: 100)\n- offset (:offset): rows to skip (example: 0)\n\nExample call: limit=100, offset=0',
        access: 'public',
        sqlText: 'SELECT * FROM category LIMIT LEAST($1, 500) OFFSET $2',
        params: [
            {
                placeholder: ':limit',
                index: 1,
                name: 'limit',
                propertyName: 'limit',
                description: 'max rows per page',
                example: '100',
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
        toolName: 'listCountries',
        title: 'Paginated country rows',
        description:
            'list countries with pagination\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- limit (:limit): max rows per page (example: 100)\n- offset (:offset): rows to skip (example: 0)\n\nExample call: limit=100, offset=0',
        access: 'public',
        sqlText: 'SELECT * FROM country LIMIT LEAST($1, 500) OFFSET $2',
        params: [
            {
                placeholder: ':limit',
                index: 1,
                name: 'limit',
                propertyName: 'limit',
                description: 'max rows per page',
                example: '100',
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
        toolName: 'listInventory',
        title: 'Paginated inventory rows',
        description:
            'list inventory with pagination\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- limit (:limit): max rows per page (example: 100)\n- offset (:offset): rows to skip (example: 0)\n\nExample call: limit=100, offset=0',
        access: 'public',
        sqlText:
            '\n        SELECT\n            *\n        FROM\n            inventory\n        LIMIT\n            LEAST($1, 500)\n        OFFSET\n            $2\n    ',
        params: [
            {
                placeholder: ':limit',
                index: 1,
                name: 'limit',
                propertyName: 'limit',
                description: 'max rows per page',
                example: '100',
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
        toolName: 'filmsByMpaaRating',
        title: 'Films by MPAA rating (G, PG, PG-13, R, NC-17)',
        description:
            'List films with a given MPAA age rating.\n        Valid ratings: G, PG, PG-13, R, NC-17.\n        Results ordered by title.\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- rating (:rating): MPAA rating (G, PG, PG-13, R, or NC-17) (example: PG-13)\n- maxRows (:maxRows): max rows to return (example: 20)\n\nExample call: rating=PG-13, maxRows=20',
        access: 'public',
        sqlText:
            '\n        SELECT\n            film_id,\n            title,\n            rating\n        FROM\n            film\n        WHERE\n            rating::text = $1\n        ORDER BY\n            title\n        LIMIT\n            $2\n    ',
        params: [
            {
                placeholder: ':rating',
                index: 1,
                name: 'rating',
                propertyName: 'rating',
                description: 'MPAA rating (G, PG, PG-13, R, or NC-17)',
                example: 'PG-13',
                jsonSchemaType: 'string'
            },
            {
                placeholder: ':maxRows',
                index: 2,
                name: 'maxRows',
                propertyName: 'maxRows',
                description: 'max rows to return',
                example: '20',
                jsonSchemaType: 'integer'
            }
        ]
    },
    {
        kind: 'sql',
        toolName: 'filmsWithActorLastName',
        title: 'Actor–film cast via film_actor join',
        description:
            'which films feature actors whose last name starts with a given prefix\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- lastNamePrefix (:lastNamePrefix): \n                Actor last name prefix (case-insensitive).\n                Examples: GAR, BER, HOP — matches last names starting with the prefix.\n             (example: GAR)\n- maxRows (:maxRows): max rows to return (example: 25)\n\nExample call: lastNamePrefix=GAR, maxRows=25',
        access: 'public',
        sqlText:
            "\n        SELECT\n            a.first_name,\n            a.last_name,\n            f.title\n        FROM\n            actor a\n        INNER JOIN\n            film_actor fa ON a.actor_id = fa.actor_id\n        INNER JOIN\n            film f ON f.film_id = fa.film_id\n        WHERE\n            a.last_name ILIKE $1 || '%'\n        ORDER BY\n            a.last_name,\n            f.title\n        LIMIT\n            $2\n    ",
        params: [
            {
                placeholder: ':lastNamePrefix',
                index: 1,
                name: 'lastNamePrefix',
                propertyName: 'lastNamePrefix',
                description:
                    '\n                Actor last name prefix (case-insensitive).\n                Examples: GAR, BER, HOP — matches last names starting with the prefix.\n            ',
                example: 'GAR',
                jsonSchemaType: 'string'
            },
            {
                placeholder: ':maxRows',
                index: 2,
                name: 'maxRows',
                propertyName: 'maxRows',
                description: 'max rows to return',
                example: '25',
                jsonSchemaType: 'integer'
            }
        ]
    },
    {
        kind: 'sql',
        toolName: 'searchFilms',
        title: 'Film full-text style search (title and description)',
        description:
            'Search films by free text in title or description.\n        Case-insensitive substring match (PostgreSQL ILIKE).\n        Useful for demo queries such as dog, cat, or grace.\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- searchText (:searchText): search text (matched in title or description) (example: dog)\n- maxRows (:maxRows): max rows to return (example: 15)\n\nExample call: searchText=dog, maxRows=15',
        access: 'public',
        sqlText:
            "\n        SELECT\n            film_id,\n            title,\n            rating,\n            LEFT(description, 120) AS description_preview\n        FROM\n            film\n        WHERE\n            title ILIKE '%' || $1 || '%'\n            OR description ILIKE '%' || $1 || '%'\n        ORDER BY\n            title\n        LIMIT\n            $2\n    ",
        params: [
            {
                placeholder: ':searchText',
                index: 1,
                name: 'searchText',
                propertyName: 'searchText',
                description: 'search text (matched in title or description)',
                example: 'dog',
                jsonSchemaType: 'string'
            },
            {
                placeholder: ':maxRows',
                index: 2,
                name: 'maxRows',
                propertyName: 'maxRows',
                description: 'max rows to return',
                example: '15',
                jsonSchemaType: 'integer'
            }
        ]
    }
];

export const mcpServerName = 'pagila-tools';
export const mcpServerVersion = '0.1.0';

import * as z from 'zod/v4';

export const inputZodByTool = {
    listFilms: z
        .object({
            limit: z.number().describe('max rows per page (SQL :limit)'),
            offset: z.number().describe('rows to skip (SQL :offset)')
        })
        .strict(),
    listActors: z
        .object({
            limit: z
                .number()
                .describe(
                    'Max rows per page.\n                SQL caps at 500 via LEAST(:limit, 500).\n             (SQL :limit)'
                ),
            offset: z.number().describe('rows to skip (SQL :offset)')
        })
        .strict(),
    listCustomers: z
        .object({
            limit: z.number().describe('max rows per page (SQL :limit)'),
            offset: z.number().describe('rows to skip (SQL :offset)')
        })
        .strict(),
    listCategories: z
        .object({
            limit: z.number().describe('max rows per page (SQL :limit)'),
            offset: z.number().describe('rows to skip (SQL :offset)')
        })
        .strict(),
    listCountries: z
        .object({
            limit: z.number().describe('max rows per page (SQL :limit)'),
            offset: z.number().describe('rows to skip (SQL :offset)')
        })
        .strict(),
    listInventory: z
        .object({
            limit: z.number().describe('max rows per page (SQL :limit)'),
            offset: z.number().describe('rows to skip (SQL :offset)')
        })
        .strict(),
    filmsByMpaaRating: z
        .object({
            rating: z.string().describe('MPAA rating (G, PG, PG-13, R, or NC-17) (SQL :rating)'),
            maxRows: z.number().describe('max rows to return (SQL :maxRows)')
        })
        .strict(),
    filmsWithActorLastName: z
        .object({
            lastNamePrefix: z
                .string()
                .describe(
                    'Actor last name prefix (case-insensitive).\n                Examples: GAR, BER, HOP — matches last names starting with the prefix.\n             (SQL :lastNamePrefix)'
                ),
            maxRows: z.number().describe('max rows to return (SQL :maxRows)')
        })
        .strict(),
    searchFilms: z
        .object({
            searchText: z.string().describe('search text (matched in title or description) (SQL :searchText)'),
            maxRows: z.number().describe('max rows to return (SQL :maxRows)')
        })
        .strict()
};

import { Client } from 'pg';

function resolveConnectionString(hostContext: DbHostContext): string {
    const cs = hostContext.connectionString?.trim();
    if (cs) {
        return cs;
    }
    throw new Error(
        'Missing database connection. MCP host must pass hostContext.connectionString (from database env in .db2ai).'
    );
}

function compactSqlForLog(sql: string): string {
    return sql.replace(/\s+/g, ' ').trim();
}

function normalizePostgresNumericParamValue(value: unknown): number | null {
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
        throw new Error('invokeTool requires hostContext from the MCP host (stdio-mcp-server or http-mcp-server).');
    }
    const host = hostContext as DbHostContext;
    if (toolMeta.access !== 'public') {
        if (!host.credential || !String(host.credential).trim()) {
            throw new Error(
                'Missing host credential. stdio: set env for --auth-env on stdio-mcp-server; stateless HTTP: MCP auth header (e.g. x-api-token); OAuth HTTP: complete MCP login (Authorization Bearer from Cursor).'
            );
        }
    }
    const connectionString = resolveConnectionString(host);
    const client = new Client({ connectionString });
    await client.connect();
    try {
        switch (toolName) {
            case 'listFilms': {
                const sqlText = 'SELECT * FROM film LIMIT LEAST($1, 500) OFFSET $2';
                const sqlValues = [
                    normalizePostgresNumericParamValue(options['limit']),
                    normalizePostgresNumericParamValue(options['offset'])
                ];
                loggingAdapter.debug('executeSql', {
                    toolName: 'listFilms',
                    sql: compactSqlForLog(sqlText),
                    values: sqlValues
                });
                const result = await client.query({ text: sqlText, values: sqlValues });
                return {
                    rows: result.rows,
                    rowCount: result.rowCount ?? result.rows.length
                };
            }
            case 'listActors': {
                const sqlText = 'SELECT * FROM actor LIMIT LEAST($1, 500) OFFSET $2';
                const sqlValues = [
                    normalizePostgresNumericParamValue(options['limit']),
                    normalizePostgresNumericParamValue(options['offset'])
                ];
                loggingAdapter.debug('executeSql', {
                    toolName: 'listActors',
                    sql: compactSqlForLog(sqlText),
                    values: sqlValues
                });
                const result = await client.query({ text: sqlText, values: sqlValues });
                return {
                    rows: result.rows,
                    rowCount: result.rowCount ?? result.rows.length
                };
            }
            case 'listCustomers': {
                const sqlText = 'SELECT * FROM customer LIMIT LEAST($1, 500) OFFSET $2';
                const sqlValues = [
                    normalizePostgresNumericParamValue(options['limit']),
                    normalizePostgresNumericParamValue(options['offset'])
                ];
                loggingAdapter.debug('executeSql', {
                    toolName: 'listCustomers',
                    sql: compactSqlForLog(sqlText),
                    values: sqlValues
                });
                const result = await client.query({ text: sqlText, values: sqlValues });
                return {
                    rows: result.rows,
                    rowCount: result.rowCount ?? result.rows.length
                };
            }
            case 'listCategories': {
                const sqlText = 'SELECT * FROM category LIMIT LEAST($1, 500) OFFSET $2';
                const sqlValues = [
                    normalizePostgresNumericParamValue(options['limit']),
                    normalizePostgresNumericParamValue(options['offset'])
                ];
                loggingAdapter.debug('executeSql', {
                    toolName: 'listCategories',
                    sql: compactSqlForLog(sqlText),
                    values: sqlValues
                });
                const result = await client.query({ text: sqlText, values: sqlValues });
                return {
                    rows: result.rows,
                    rowCount: result.rowCount ?? result.rows.length
                };
            }
            case 'listCountries': {
                const sqlText = 'SELECT * FROM country LIMIT LEAST($1, 500) OFFSET $2';
                const sqlValues = [
                    normalizePostgresNumericParamValue(options['limit']),
                    normalizePostgresNumericParamValue(options['offset'])
                ];
                loggingAdapter.debug('executeSql', {
                    toolName: 'listCountries',
                    sql: compactSqlForLog(sqlText),
                    values: sqlValues
                });
                const result = await client.query({ text: sqlText, values: sqlValues });
                return {
                    rows: result.rows,
                    rowCount: result.rowCount ?? result.rows.length
                };
            }
            case 'listInventory': {
                const sqlText =
                    '\n        SELECT\n            *\n        FROM\n            inventory\n        LIMIT\n            LEAST($1, 500)\n        OFFSET\n            $2\n    ';
                const sqlValues = [
                    normalizePostgresNumericParamValue(options['limit']),
                    normalizePostgresNumericParamValue(options['offset'])
                ];
                loggingAdapter.debug('executeSql', {
                    toolName: 'listInventory',
                    sql: compactSqlForLog(sqlText),
                    values: sqlValues
                });
                const result = await client.query({ text: sqlText, values: sqlValues });
                return {
                    rows: result.rows,
                    rowCount: result.rowCount ?? result.rows.length
                };
            }
            case 'filmsByMpaaRating': {
                const sqlText =
                    '\n        SELECT\n            film_id,\n            title,\n            rating\n        FROM\n            film\n        WHERE\n            rating::text = $1\n        ORDER BY\n            title\n        LIMIT\n            $2\n    ';
                const sqlValues = [
                    options['rating'] !== undefined && options['rating'] !== null ? String(options['rating']) : null,
                    normalizePostgresNumericParamValue(options['maxRows'])
                ];
                loggingAdapter.debug('executeSql', {
                    toolName: 'filmsByMpaaRating',
                    sql: compactSqlForLog(sqlText),
                    values: sqlValues
                });
                const result = await client.query({ text: sqlText, values: sqlValues });
                return {
                    rows: result.rows,
                    rowCount: result.rowCount ?? result.rows.length
                };
            }
            case 'filmsWithActorLastName': {
                const sqlText =
                    "\n        SELECT\n            a.first_name,\n            a.last_name,\n            f.title\n        FROM\n            actor a\n        INNER JOIN\n            film_actor fa ON a.actor_id = fa.actor_id\n        INNER JOIN\n            film f ON f.film_id = fa.film_id\n        WHERE\n            a.last_name ILIKE $1 || '%'\n        ORDER BY\n            a.last_name,\n            f.title\n        LIMIT\n            $2\n    ";
                const sqlValues = [
                    options['lastNamePrefix'] !== undefined && options['lastNamePrefix'] !== null
                        ? String(options['lastNamePrefix'])
                        : null,
                    normalizePostgresNumericParamValue(options['maxRows'])
                ];
                loggingAdapter.debug('executeSql', {
                    toolName: 'filmsWithActorLastName',
                    sql: compactSqlForLog(sqlText),
                    values: sqlValues
                });
                const result = await client.query({ text: sqlText, values: sqlValues });
                return {
                    rows: result.rows,
                    rowCount: result.rowCount ?? result.rows.length
                };
            }
            case 'searchFilms': {
                const sqlText =
                    "\n        SELECT\n            film_id,\n            title,\n            rating,\n            LEFT(description, 120) AS description_preview\n        FROM\n            film\n        WHERE\n            title ILIKE '%' || $1 || '%'\n            OR description ILIKE '%' || $1 || '%'\n        ORDER BY\n            title\n        LIMIT\n            $2\n    ";
                const sqlValues = [
                    options['searchText'] !== undefined && options['searchText'] !== null
                        ? String(options['searchText'])
                        : null,
                    normalizePostgresNumericParamValue(options['maxRows'])
                ];
                loggingAdapter.debug('executeSql', {
                    toolName: 'searchFilms',
                    sql: compactSqlForLog(sqlText),
                    values: sqlValues
                });
                const result = await client.query({ text: sqlText, values: sqlValues });
                return {
                    rows: result.rows,
                    rowCount: result.rowCount ?? result.rows.length
                };
            }
            default:
                throw new Error('Unknown tool: ' + toolName);
        }
    } finally {
        await client.end();
    }
}
