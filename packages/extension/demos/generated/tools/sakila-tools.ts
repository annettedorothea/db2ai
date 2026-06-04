/**
 * Generated from: sakila.db2ai
 */
export const connectionEnv = 'SAKILA_DATABASE_URL';

export const databaseDialect = 'mysql';

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
    databaseDialect: 'postgres' | 'mysql';
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
        title: 'Paginated Sakila film rows',
        description:
            'list films from Sakila with pagination\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- limit ($1): max rows per page (example: 100)\n- offset ($2): rows to skip (example: 0)\n\nExample call: limit=100, offset=0',
        access: 'public',
        sqlText: 'SELECT * FROM film LIMIT $1 OFFSET $2',
        params: [
            {
                placeholder: '$1',
                index: 1,
                name: 'limit',
                propertyName: 'limit',
                description: 'max rows per page',
                example: '100',
                jsonSchemaType: 'integer'
            },
            {
                placeholder: '$2',
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
            'List actors from Sakila with pagination.\n        Protected: requires DB2AI_AUTH_TOKEN at MCP startup.\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- limit ($1): max rows per page (example: 100)\n- offset ($2): rows to skip (example: 0)\n\nExample call: limit=100, offset=0',
        access: 'protected',
        sqlText: 'SELECT * FROM actor LIMIT $1 OFFSET $2',
        params: [
            {
                placeholder: '$1',
                index: 1,
                name: 'limit',
                propertyName: 'limit',
                description: 'max rows per page',
                example: '100',
                jsonSchemaType: 'integer'
            },
            {
                placeholder: '$2',
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
            'list film categories with pagination\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- limit ($1): max rows per page (example: 100)\n- offset ($2): rows to skip (example: 0)\n\nExample call: limit=100, offset=0',
        access: 'public',
        sqlText: 'SELECT * FROM category LIMIT $1 OFFSET $2',
        params: [
            {
                placeholder: '$1',
                index: 1,
                name: 'limit',
                propertyName: 'limit',
                description: 'max rows per page',
                example: '100',
                jsonSchemaType: 'integer'
            },
            {
                placeholder: '$2',
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
            'list films with a given rating\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- rating ($1): rating (G, PG, PG-13, R, or NC-17) (example: PG)\n- maxRows ($2): max rows to return (example: 20)\n\nExample call: rating=PG, maxRows=20',
        access: 'public',
        sqlText:
            '\n        SELECT\n            film_id,\n            title,\n            rating\n        FROM\n            film\n        WHERE\n            rating = $1\n        ORDER BY\n            title\n        LIMIT\n            $2\n    ',
        params: [
            {
                placeholder: '$1',
                index: 1,
                name: 'rating',
                propertyName: 'rating',
                description: 'rating (G, PG, PG-13, R, or NC-17)',
                example: 'PG',
                jsonSchemaType: 'string'
            },
            {
                placeholder: '$2',
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
            'Find films featuring actors whose last name starts with a prefix.\n        Joins actor, film_actor, and film (MySQL LIKE / CONCAT).\n        Ordered by last name, then film title.\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- lastNamePrefix ($1): actor last name prefix (e.g. GAR, BER, HOP) (example: GAR)\n- maxRows ($2): max rows to return (example: 25)\n\nExample call: lastNamePrefix=GAR, maxRows=25',
        access: 'public',
        sqlText:
            "\n        SELECT\n            a.first_name,\n            a.last_name,\n            f.title\n        FROM\n            actor a\n        INNER JOIN\n            film_actor fa ON a.actor_id = fa.actor_id\n        INNER JOIN\n            film f ON f.film_id = fa.film_id\n        WHERE\n            a.last_name LIKE CONCAT($1, '%')\n        ORDER BY\n            a.last_name,\n            f.title\n        LIMIT\n            $2\n    ",
        params: [
            {
                placeholder: '$1',
                index: 1,
                name: 'lastNamePrefix',
                propertyName: 'lastNamePrefix',
                description: 'actor last name prefix (e.g. GAR, BER, HOP)',
                example: 'GAR',
                jsonSchemaType: 'string'
            },
            {
                placeholder: '$2',
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
            'Search films by free text in title or description.\n        Case-sensitive substring match (MySQL LIKE with CONCAT).\n        Compare with Pagila searchFilms (ILIKE) when testing both servers.\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- searchText ($1): \n                Search text matched in title or description.\n                Example: cat, dog, academy.\n             (example: cat)\n- maxRows ($2): max rows to return (example: 15)\n\nExample call: searchText=cat, maxRows=15',
        access: 'public',
        sqlText:
            "\n        SELECT\n            film_id,\n            title,\n            rating,\n            LEFT(description, 120) AS description_preview\n        FROM\n            film\n        WHERE\n            title LIKE CONCAT('%', $1, '%')\n            OR description LIKE CONCAT('%', $1, '%')\n        ORDER BY\n            title\n        LIMIT\n            $2\n    ",
        params: [
            {
                placeholder: '$1',
                index: 1,
                name: 'searchText',
                propertyName: 'searchText',
                description:
                    '\n                Search text matched in title or description.\n                Example: cat, dog, academy.\n            ',
                example: 'cat',
                jsonSchemaType: 'string'
            },
            {
                placeholder: '$2',
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

export const mcpServerName = 'sakila-tools';
export const mcpServerVersion = '0.0.6';

import * as z from 'zod/v4';

export const inputZodByTool = {
    listFilms: z
        .object({
            limit: z.number().describe('max rows per page (SQL $1)'),
            offset: z.number().describe('rows to skip (SQL $2)')
        })
        .strict(),
    listActors: z
        .object({
            limit: z.number().describe('max rows per page (SQL $1)'),
            offset: z.number().describe('rows to skip (SQL $2)')
        })
        .strict(),
    listCategories: z
        .object({
            limit: z.number().describe('max rows per page (SQL $1)'),
            offset: z.number().describe('rows to skip (SQL $2)')
        })
        .strict(),
    filmsByRating: z
        .object({
            rating: z.string().describe('rating (G, PG, PG-13, R, or NC-17) (SQL $1)'),
            maxRows: z.number().describe('max rows to return (SQL $2)')
        })
        .strict(),
    filmsWithActorLastName: z
        .object({
            lastNamePrefix: z.string().describe('actor last name prefix (e.g. GAR, BER, HOP) (SQL $1)'),
            maxRows: z.number().describe('max rows to return (SQL $2)')
        })
        .strict(),
    searchFilms: z
        .object({
            searchText: z
                .string()
                .describe(
                    'Search text matched in title or description.\n                Example: cat, dog, academy.\n             (SQL $1)'
                ),
            maxRows: z.number().describe('max rows to return (SQL $2)')
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

export async function invokeTool(
    toolName: string,
    options: InvokeOptions = {},
    hostContext?: DbHostContext
): Promise<unknown> {
    const toolMeta = generatedTools.find((t) => t.toolName === toolName);
    if (!toolMeta) {
        throw new Error('Unknown tool: ' + toolName);
    }

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
    const client = await mysql.createConnection(connectionString);
    try {
        switch (toolName) {
            case 'listFilms': {
                const [rows] = await client.query('SELECT * FROM film LIMIT ? OFFSET ?', [
                    normalizeMysqlParamValue(options['limit']),
                    normalizeMysqlParamValue(options['offset'])
                ]);
                const resultRows = normalizeMysqlRows(rows);
                return {
                    rows: resultRows,
                    rowCount: resultRows.length
                };
            }
            case 'listActors': {
                const [rows] = await client.query('SELECT * FROM actor LIMIT ? OFFSET ?', [
                    normalizeMysqlParamValue(options['limit']),
                    normalizeMysqlParamValue(options['offset'])
                ]);
                const resultRows = normalizeMysqlRows(rows);
                return {
                    rows: resultRows,
                    rowCount: resultRows.length
                };
            }
            case 'listCategories': {
                const [rows] = await client.query('SELECT * FROM category LIMIT ? OFFSET ?', [
                    normalizeMysqlParamValue(options['limit']),
                    normalizeMysqlParamValue(options['offset'])
                ]);
                const resultRows = normalizeMysqlRows(rows);
                return {
                    rows: resultRows,
                    rowCount: resultRows.length
                };
            }
            case 'filmsByRating': {
                const [rows] = await client.query(
                    '\n        SELECT\n            film_id,\n            title,\n            rating\n        FROM\n            film\n        WHERE\n            rating = ?\n        ORDER BY\n            title\n        LIMIT\n            ?\n    ',
                    [normalizeMysqlParamValue(options['rating']), normalizeMysqlParamValue(options['maxRows'])]
                );
                const resultRows = normalizeMysqlRows(rows);
                return {
                    rows: resultRows,
                    rowCount: resultRows.length
                };
            }
            case 'filmsWithActorLastName': {
                const [rows] = await client.query(
                    "\n        SELECT\n            a.first_name,\n            a.last_name,\n            f.title\n        FROM\n            actor a\n        INNER JOIN\n            film_actor fa ON a.actor_id = fa.actor_id\n        INNER JOIN\n            film f ON f.film_id = fa.film_id\n        WHERE\n            a.last_name LIKE CONCAT(?, '%')\n        ORDER BY\n            a.last_name,\n            f.title\n        LIMIT\n            ?\n    ",
                    [normalizeMysqlParamValue(options['lastNamePrefix']), normalizeMysqlParamValue(options['maxRows'])]
                );
                const resultRows = normalizeMysqlRows(rows);
                return {
                    rows: resultRows,
                    rowCount: resultRows.length
                };
            }
            case 'searchFilms': {
                const [rows] = await client.query(
                    "\n        SELECT\n            film_id,\n            title,\n            rating,\n            LEFT(description, 120) AS description_preview\n        FROM\n            film\n        WHERE\n            title LIKE CONCAT('%', ?, '%')\n            OR description LIKE CONCAT('%', ?, '%')\n        ORDER BY\n            title\n        LIMIT\n            ?\n    ",
                    [
                        normalizeMysqlParamValue(options['searchText']),
                        normalizeMysqlParamValue(options['searchText']),
                        normalizeMysqlParamValue(options['maxRows'])
                    ]
                );
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
