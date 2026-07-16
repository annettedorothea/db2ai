/**
 * Generated from: sakila-mysql.db2ai
 */
import { loggingAdapter } from '../../../src/utils/logging-adapter.js';
import * as z from 'zod/v4';
import { verifyCredential } from '../../../src/hooks/db2ai/sakila-mysql-tools/verifySakilaMysqlCredential.js';
import { prepareToolCallForListFilms } from '../../../src/hooks/db2ai/sakila-mysql-tools/prepareToolCallForListFilms.js';
import { prepareToolCallForListActors } from '../../../src/hooks/db2ai/sakila-mysql-tools/prepareToolCallForListActors.js';
import { prepareToolCallForListCategories } from '../../../src/hooks/db2ai/sakila-mysql-tools/prepareToolCallForListCategories.js';
import { prepareToolCallForFilmsByRating } from '../../../src/hooks/db2ai/sakila-mysql-tools/prepareToolCallForFilmsByRating.js';
import { prepareToolCallForFilmsWithActorLastName } from '../../../src/hooks/db2ai/sakila-mysql-tools/prepareToolCallForFilmsWithActorLastName.js';
import { prepareToolCallForSearchFilms } from '../../../src/hooks/db2ai/sakila-mysql-tools/prepareToolCallForSearchFilms.js';

export const connectionEnv = 'SAKILA_MYSQL_DATABASE_URL';

export const databaseDialect = 'mysql';

export const requiresAuth = true;

export { verifyCredential } from '../../../src/hooks/db2ai/sakila-mysql-tools/verifySakilaMysqlCredential.js';

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
        title: 'Paginated Sakila film rows',
        description:
            'list films from Sakila with pagination\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- limit: max rows per page (type: integer) (example: 100)\n- offset: rows to skip (type: integer) (example: 0)\n\nExample call: limit=100, offset=0',
        access: 'public',
        hasCheckToolAccess: false,
        hasPrepareToolCall: true,
        sqlText: 'SELECT * FROM film LIMIT ? OFFSET ?',
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
        title: 'Paginated Sakila actor rows',
        description:
            'List actors from Sakila with pagination.\n        Protected: requires MCP auth header matching MCP_AUTH_EXPECTED.\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- limit: max rows per page (type: integer) (example: 100)\n- offset: rows to skip (type: integer) (example: 0)\n\nExample call: limit=100, offset=0',
        access: 'protected',
        hasCheckToolAccess: false,
        hasPrepareToolCall: true,
        sqlText: 'SELECT * FROM actor LIMIT ? OFFSET ?',
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
        toolName: 'listCategories',
        title: 'Paginated Sakila category rows',
        description:
            'list film categories with pagination\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- limit: max rows per page (type: integer) (example: 100)\n- offset: rows to skip (type: integer) (example: 0)\n\nExample call: limit=100, offset=0',
        access: 'public',
        hasCheckToolAccess: false,
        hasPrepareToolCall: true,
        sqlText: 'SELECT * FROM category LIMIT ? OFFSET ?',
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
        toolName: 'filmsByRating',
        title: 'Films by rating (G, PG, PG-13, R, NC-17)',
        description:
            'list films with a given rating\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- rating: rating (G, PG, PG-13, R, or NC-17) (type: string) (example: PG)\n- maxRows: max rows to return (type: integer) (example: 20)\n\nExample call: rating=PG, maxRows=20',
        access: 'public',
        hasCheckToolAccess: false,
        hasPrepareToolCall: true,
        sqlText:
            '\n        SELECT\n            film_id,\n            title,\n            rating\n        FROM\n            film\n        WHERE\n            rating = ?\n        ORDER BY\n            title\n        LIMIT\n            ?\n    ',
        params: [
            {
                placeholder: ':rating',
                index: 1,
                name: 'rating',
                propertyName: 'rating',
                description: 'rating (G, PG, PG-13, R, or NC-17)',
                example: 'PG',
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
        title: 'Actor-film cast via film_actor join',
        description:
            'Find films featuring actors whose last name starts with a prefix.\n        Joins actor, film_actor, and film (MySQL LIKE / CONCAT).\n        Ordered by last name, then film title.\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- lastNamePrefix: actor last name prefix (e.g. GAR, BER, HOP) (type: string) (example: GAR)\n- maxRows: max rows to return (type: integer) (example: 25)\n\nExample call: lastNamePrefix=GAR, maxRows=25',
        access: 'public',
        hasCheckToolAccess: false,
        hasPrepareToolCall: true,
        sqlText:
            "\n        SELECT\n            a.first_name,\n            a.last_name,\n            f.title\n        FROM\n            actor a\n        INNER JOIN\n            film_actor fa ON a.actor_id = fa.actor_id\n        INNER JOIN\n            film f ON f.film_id = fa.film_id\n        WHERE\n            a.last_name LIKE CONCAT(?, '%')\n        ORDER BY\n            a.last_name,\n            f.title\n        LIMIT\n            ?\n    ",
        params: [
            {
                placeholder: ':lastNamePrefix',
                index: 1,
                name: 'lastNamePrefix',
                propertyName: 'lastNamePrefix',
                description: 'actor last name prefix (e.g. GAR, BER, HOP)',
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
        title: 'Film search across title and description',
        description:
            'Search films by free text in title or description.\n        Case-sensitive substring match (MySQL LIKE with CONCAT).\n        Compare with Pagila searchFilms (ILIKE) when testing both servers.\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- searchText: Search text matched in title or description.\n                Example: cat, dog, academy. (type: string) (example: cat)\n- maxRows: max rows to return (type: integer) (example: 15)\n\nExample call: searchText=cat, maxRows=15',
        access: 'public',
        hasCheckToolAccess: false,
        hasPrepareToolCall: true,
        sqlText:
            "\n        SELECT\n            film_id,\n            title,\n            rating,\n            LEFT(description, 120) AS description_preview\n        FROM\n            film\n        WHERE\n            title LIKE CONCAT('%', ?, '%')\n            OR description LIKE CONCAT('%', ?, '%')\n        ORDER BY\n            title\n        LIMIT\n            ?\n    ",
        params: [
            {
                placeholder: ':searchText',
                index: 1,
                name: 'searchText',
                propertyName: 'searchText',
                description:
                    '\n                Search text matched in title or description.\n                Example: cat, dog, academy.\n            ',
                example: 'cat',
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
    },
    {
        kind: 'sql',
        toolName: 'insertActor',
        title: 'Insert actor with first and last name',
        description:
            'Insert a new actor into Sakila.\n        Sets last_update to the current time.\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- firstName: actor first name (type: string) (example: MARY)\n- lastName: actor last name (type: string) (example: SMITH)\n\nExample call: firstName=MARY, lastName=SMITH',
        access: 'public',
        hasCheckToolAccess: false,
        hasPrepareToolCall: false,
        sqlText: 'INSERT INTO actor (first_name, last_name, last_update) VALUES (?, ?, NOW())',
        params: [
            {
                placeholder: ':firstName',
                index: 1,
                name: 'firstName',
                propertyName: 'firstName',
                description: 'actor first name',
                example: 'MARY',
                jsonSchemaType: 'string'
            },
            {
                placeholder: ':lastName',
                index: 2,
                name: 'lastName',
                propertyName: 'lastName',
                description: 'actor last name',
                example: 'SMITH',
                jsonSchemaType: 'string'
            }
        ]
    }
];

export const mcpServerName = 'sakila-mysql-tools';
export const mcpServerVersion = '1.0.0';

export { mcpBuildGeneratedAt } from '../mcp-build-generated-at.js';

const prepareToolCallHooks: Record<
    string,
    (options: InvokeOptions, credential?: string) => InvokeOptions | Promise<InvokeOptions>
> = {
    listFilms: prepareToolCallForListFilms,
    listActors: (options, credential) => prepareToolCallForListActors(options, credential!),
    listCategories: prepareToolCallForListCategories,
    filmsByRating: prepareToolCallForFilmsByRating,
    filmsWithActorLastName: prepareToolCallForFilmsWithActorLastName,
    searchFilms: prepareToolCallForSearchFilms
};

export const inputZodByTool = {
    listFilms: z
        .object({
            limit: z.number().int().describe('max rows per page (SQL :limit) (type: integer) (example: 100)'),
            offset: z.number().int().describe('rows to skip (SQL :offset) (type: integer) (example: 0)')
        })
        .strict(),
    listActors: z
        .object({
            limit: z.number().int().describe('max rows per page (SQL :limit) (type: integer) (example: 100)'),
            offset: z.number().int().describe('rows to skip (SQL :offset) (type: integer) (example: 0)')
        })
        .strict(),
    listCategories: z
        .object({
            limit: z.number().int().describe('max rows per page (SQL :limit) (type: integer) (example: 100)'),
            offset: z.number().int().describe('rows to skip (SQL :offset) (type: integer) (example: 0)')
        })
        .strict(),
    filmsByRating: z
        .object({
            rating: z
                .string()
                .describe('rating (G, PG, PG-13, R, or NC-17) (SQL :rating) (type: string) (example: PG)'),
            maxRows: z.number().int().describe('max rows to return (SQL :maxRows) (type: integer) (example: 20)')
        })
        .strict(),
    filmsWithActorLastName: z
        .object({
            lastNamePrefix: z
                .string()
                .describe(
                    'actor last name prefix (e.g. GAR, BER, HOP) (SQL :lastNamePrefix) (type: string) (example: GAR)'
                ),
            maxRows: z.number().int().describe('max rows to return (SQL :maxRows) (type: integer) (example: 25)')
        })
        .strict(),
    searchFilms: z
        .object({
            searchText: z
                .string()
                .describe(
                    'Search text matched in title or description.\n                Example: cat, dog, academy.\n             (SQL :searchText) (type: string) (example: cat)'
                ),
            maxRows: z.number().int().describe('max rows to return (SQL :maxRows) (type: integer) (example: 15)')
        })
        .strict(),
    insertActor: z
        .object({
            firstName: z.string().describe('actor first name (SQL :firstName) (type: string) (example: MARY)'),
            lastName: z.string().describe('actor last name (SQL :lastName) (type: string) (example: SMITH)')
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
        await verifyCredential(credential);
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
                const sqlText = 'SELECT * FROM film LIMIT ? OFFSET ?';
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
            case 'listActors': {
                const sqlText = 'SELECT * FROM actor LIMIT ? OFFSET ?';
                const sqlValues = [
                    normalizeMysqlNumericParamValue(optionsResolved['limit']),
                    normalizeMysqlNumericParamValue(optionsResolved['offset'])
                ];
                loggingAdapter.debug('executeSql', {
                    toolName: 'listActors',
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
            case 'listCategories': {
                const sqlText = 'SELECT * FROM category LIMIT ? OFFSET ?';
                const sqlValues = [
                    normalizeMysqlNumericParamValue(optionsResolved['limit']),
                    normalizeMysqlNumericParamValue(optionsResolved['offset'])
                ];
                loggingAdapter.debug('executeSql', {
                    toolName: 'listCategories',
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
            case 'filmsByRating': {
                const sqlText =
                    '\n        SELECT\n            film_id,\n            title,\n            rating\n        FROM\n            film\n        WHERE\n            rating = ?\n        ORDER BY\n            title\n        LIMIT\n            ?\n    ';
                const sqlValues = [
                    optionsResolved['rating'] !== undefined && optionsResolved['rating'] !== null
                        ? String(optionsResolved['rating'])
                        : null,
                    normalizeMysqlNumericParamValue(optionsResolved['maxRows'])
                ];
                loggingAdapter.debug('executeSql', {
                    toolName: 'filmsByRating',
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
            case 'filmsWithActorLastName': {
                const sqlText =
                    "\n        SELECT\n            a.first_name,\n            a.last_name,\n            f.title\n        FROM\n            actor a\n        INNER JOIN\n            film_actor fa ON a.actor_id = fa.actor_id\n        INNER JOIN\n            film f ON f.film_id = fa.film_id\n        WHERE\n            a.last_name LIKE CONCAT(?, '%')\n        ORDER BY\n            a.last_name,\n            f.title\n        LIMIT\n            ?\n    ";
                const sqlValues = [
                    optionsResolved['lastNamePrefix'] !== undefined && optionsResolved['lastNamePrefix'] !== null
                        ? String(optionsResolved['lastNamePrefix'])
                        : null,
                    normalizeMysqlNumericParamValue(optionsResolved['maxRows'])
                ];
                loggingAdapter.debug('executeSql', {
                    toolName: 'filmsWithActorLastName',
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
                    "\n        SELECT\n            film_id,\n            title,\n            rating,\n            LEFT(description, 120) AS description_preview\n        FROM\n            film\n        WHERE\n            title LIKE CONCAT('%', ?, '%')\n            OR description LIKE CONCAT('%', ?, '%')\n        ORDER BY\n            title\n        LIMIT\n            ?\n    ";
                const sqlValues = [
                    optionsResolved['searchText'] !== undefined && optionsResolved['searchText'] !== null
                        ? String(optionsResolved['searchText'])
                        : null,
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
            case 'insertActor': {
                const sqlText = 'INSERT INTO actor (first_name, last_name, last_update) VALUES (?, ?, NOW())';
                const sqlValues = [
                    optionsResolved['firstName'] !== undefined && optionsResolved['firstName'] !== null
                        ? String(optionsResolved['firstName'])
                        : null,
                    optionsResolved['lastName'] !== undefined && optionsResolved['lastName'] !== null
                        ? String(optionsResolved['lastName'])
                        : null
                ];
                loggingAdapter.debug('executeSql', {
                    toolName: 'insertActor',
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
