/**
 * Generated from: sakila-mysql.db2ai
 */
import { loggingAdapter } from '../../../src/utils/logging-adapter.js';
import * as z from 'zod/v4';
import {
    verifyCredential,
    toModuleCredentials,
    type ModuleCredentials
} from '../../../src/hooks/db2ai/sakila-mysql-tools/verifySakilaMysqlCredentials.js';
import { prepareListFilmsInput } from '../../../src/hooks/db2ai/sakila-mysql-tools/listFilms.js';
import { prepareListActorsInput } from '../../../src/hooks/db2ai/sakila-mysql-tools/listActors.js';
import { prepareListCategoriesInput } from '../../../src/hooks/db2ai/sakila-mysql-tools/listCategories.js';
import { prepareFilmsByRatingInput } from '../../../src/hooks/db2ai/sakila-mysql-tools/filmsByRating.js';
import { prepareFilmsWithActorLastNameInput } from '../../../src/hooks/db2ai/sakila-mysql-tools/filmsWithActorLastName.js';
import { prepareSearchFilmsInput } from '../../../src/hooks/db2ai/sakila-mysql-tools/searchFilms.js';

export const connectionEnv = 'SAKILA_MYSQL_DATABASE_URL';

export const databaseDialect = 'mysql';

export const requiresAuth = true;

export {
    verifyCredential,
    toModuleCredentials
} from '../../../src/hooks/db2ai/sakila-mysql-tools/verifySakilaMysqlCredentials.js';
export type {
    VerifyCredentialInput,
    VerifyCredentialResult,
    ModuleCredentials,
    SakilaMysqlCredentials
} from '../../../src/hooks/db2ai/sakila-mysql-tools/verifySakilaMysqlCredentials.js';

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
        title: 'Paginated Sakila film rows',
        description:
            'list films from Sakila with pagination\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nExample call: limit=100, offset=0',
        access: 'public',
        hasAuthorize: false,
        hasPrepare: true,
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
            'List actors from Sakila with pagination.\n        Protected: requires DB2AI_AUTH_TOKEN at MCP startup.\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nExample call: limit=100, offset=0',
        access: 'protected',
        hasAuthorize: false,
        hasPrepare: true,
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
            'list film categories with pagination\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nExample call: limit=100, offset=0',
        access: 'public',
        hasAuthorize: false,
        hasPrepare: true,
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
            'list films with a given rating\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nExample call: rating=PG, maxRows=20',
        access: 'public',
        hasAuthorize: false,
        hasPrepare: true,
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
            'Find films featuring actors whose last name starts with a prefix.\n        Joins actor, film_actor, and film (MySQL LIKE / CONCAT).\n        Ordered by last name, then film title.\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nExample call: lastNamePrefix=GAR, maxRows=25',
        access: 'public',
        hasAuthorize: false,
        hasPrepare: true,
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
            'Search films by free text in title or description.\n        Case-sensitive substring match (MySQL LIKE with CONCAT).\n        Compare with Pagila searchFilms (ILIKE) when testing both servers.\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nExample call: searchText=cat, maxRows=15',
        access: 'public',
        hasAuthorize: false,
        hasPrepare: true,
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
            'Insert a new actor into Sakila.\n        Sets last_update to the current time.\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nExample call: firstName=MARY, lastName=SMITH',
        access: 'public',
        hasAuthorize: false,
        hasPrepare: false,
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
export const mcpServerVersion = '0.5.0';

const preparers: Record<
    string,
    (options: InvokeOptions, credentials?: ModuleCredentials) => InvokeOptions | Promise<InvokeOptions>
> = {
    listFilms: prepareListFilmsInput,
    listActors: prepareListActorsInput,
    listCategories: prepareListCategoriesInput,
    filmsByRating: prepareFilmsByRatingInput,
    filmsWithActorLastName: prepareFilmsWithActorLastNameInput,
    searchFilms: prepareSearchFilmsInput
};

export const inputZodByTool = {
    listFilms: z
        .object({
            limit: z.number().describe('max rows per page (SQL :limit) (example: 100)'),
            offset: z.number().describe('rows to skip (SQL :offset) (example: 0)')
        })
        .strict(),
    listActors: z
        .object({
            limit: z.number().describe('max rows per page (SQL :limit) (example: 100)'),
            offset: z.number().describe('rows to skip (SQL :offset) (example: 0)')
        })
        .strict(),
    listCategories: z
        .object({
            limit: z.number().describe('max rows per page (SQL :limit) (example: 100)'),
            offset: z.number().describe('rows to skip (SQL :offset) (example: 0)')
        })
        .strict(),
    filmsByRating: z
        .object({
            rating: z.string().describe('rating (G, PG, PG-13, R, or NC-17) (SQL :rating) (example: PG)'),
            maxRows: z.number().describe('max rows to return (SQL :maxRows) (example: 20)')
        })
        .strict(),
    filmsWithActorLastName: z
        .object({
            lastNamePrefix: z
                .string()
                .describe('actor last name prefix (e.g. GAR, BER, HOP) (SQL :lastNamePrefix) (example: GAR)'),
            maxRows: z.number().describe('max rows to return (SQL :maxRows) (example: 25)')
        })
        .strict(),
    searchFilms: z
        .object({
            searchText: z
                .string()
                .describe(
                    'Search text matched in title or description.\n                Example: cat, dog, academy.\n             (SQL :searchText) (example: cat)'
                ),
            maxRows: z.number().describe('max rows to return (SQL :maxRows) (example: 15)')
        })
        .strict(),
    insertActor: z
        .object({
            firstName: z.string().describe('actor first name (SQL :firstName) (example: MARY)'),
            lastName: z.string().describe('actor last name (SQL :lastName) (example: SMITH)')
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
    const credentialsPlain = host.credentials;
    let credentialsForStubs: ModuleCredentials | undefined =
        credentialsPlain != null ? toModuleCredentials(credentialsPlain as Record<string, unknown>) : undefined;
    let optionsResolved = options;

    if (toolMeta.access === 'protected') {
        const inbound = host.credential;
        if (!inbound || !String(inbound).trim()) {
            throw new Error(
                'Missing host credential. stdio: set env for --auth-env on stdio-mcp-server; passthrough HTTP: MCP auth header (e.g. x-api-token); OAuth HTTP: complete MCP login (Authorization Bearer from Cursor).'
            );
        }
        if (credentialsForStubs === undefined) {
            const verified = await verifyCredential({ inboundCredential: String(inbound).trim() });
            credentialsForStubs = verified.credentials;
        }
    }
    if (toolMeta.hasPrepare) {
        const prepare = preparers[toolName];
        if (typeof prepare !== 'function') {
            throw new Error('No preparer for tool: ' + toolName);
        }
        if (toolMeta.access === 'protected') {
            if (credentialsForStubs === undefined) {
                throw new Error('Prepare requires credentials; verify credential or pass host.credentials.');
            }
            optionsResolved = await Promise.resolve(prepare(options, credentialsForStubs));
        } else {
            optionsResolved = await Promise.resolve(prepare(options));
        }
    }
    const connectionString = connectionUrlForMysqlDriver(resolveConnectionString(host));
    const client = await mysql.createConnection(connectionString);
    try {
        switch (toolName) {
            case 'listFilms': {
                const sqlText = 'SELECT * FROM film LIMIT ? OFFSET ?';
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
            case 'listActors': {
                const sqlText = 'SELECT * FROM actor LIMIT ? OFFSET ?';
                const sqlValues = [
                    normalizeMysqlParamValue(optionsResolved['limit']),
                    normalizeMysqlParamValue(optionsResolved['offset'])
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
                    normalizeMysqlParamValue(optionsResolved['limit']),
                    normalizeMysqlParamValue(optionsResolved['offset'])
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
                    normalizeMysqlParamValue(optionsResolved['rating']),
                    normalizeMysqlParamValue(optionsResolved['maxRows'])
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
                    normalizeMysqlParamValue(optionsResolved['lastNamePrefix']),
                    normalizeMysqlParamValue(optionsResolved['maxRows'])
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
                    normalizeMysqlParamValue(optionsResolved['searchText']),
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
            case 'insertActor': {
                const sqlText = 'INSERT INTO actor (first_name, last_name, last_update) VALUES (?, ?, NOW())';
                const sqlValues = [
                    normalizeMysqlParamValue(optionsResolved['firstName']),
                    normalizeMysqlParamValue(optionsResolved['lastName'])
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
