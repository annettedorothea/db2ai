/**
 * Generated from: sakila.db2ai
 */

export const connectionEnv = 'SAKILA_DATABASE_URL';

export const databaseDialect = 'mysql';

export const requiresAuth = false;

export type GeneratedTool = {
    toolName: string;
    title: string;
    description: string;
    kind: 'table' | 'sql';
    table?: string;
    maxLimitCap?: number;
    sqlText?: string;
    example?: string;
};

export const generatedTools: GeneratedTool[] = [
    {
        kind: 'table',
        toolName: 'listFilms',
        title: 'Paginated Sakila film rows',
        description:
            'list films from Sakila with pagination\n\nRuns SELECT * FROM film with LIMIT/OFFSET.\nPagination: pass `limit` (default 100) and `offset` (default 0).\nNext page: same `limit`, increase `offset` (e.g. limit 20, offset 20 for page 2).\n\nExample: First page: limit 20 offset 0; next page: limit 20 offset 20',
        table: 'film',
        maxLimitCap: 500,
        example: 'First page: limit 20 offset 0; next page: limit 20 offset 20'
    },
    {
        kind: 'table',
        toolName: 'listActors',
        title: 'Paginated Sakila actor rows',
        description:
            'list actors with pagination\n\nRuns SELECT * FROM actor with LIMIT/OFFSET.\nPagination: pass `limit` (default 100) and `offset` (default 0).\nNext page: same `limit`, increase `offset` (e.g. limit 20, offset 20 for page 2).\n\nColumns returned:\n- actor_id — Primary key\n- first_name — Given name\n- last_name — Family name',
        table: 'actor',
        maxLimitCap: 500
    },
    {
        kind: 'table',
        toolName: 'listCategories',
        title: 'Paginated Sakila category rows',
        description:
            'list film categories with pagination\n\nRuns SELECT * FROM category with LIMIT/OFFSET.\nPagination: pass `limit` (default 100) and `offset` (default 0).\nNext page: same `limit`, increase `offset` (e.g. limit 20, offset 20 for page 2).',
        table: 'category',
        maxLimitCap: 500
    },
    {
        kind: 'sql',
        toolName: 'filmsByRating',
        title: 'Films by rating (G, PG, PG-13, R, NC-17)',
        description:
            'list films with a given rating\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- param1 ($1): rating (G, PG, PG-13, R, or NC-17)\n- param2 ($2): max rows to return\n\nExample: Rating PG, max 20 rows',
        sqlText: 'SELECT film_id, title, rating FROM film WHERE rating = $1 ORDER BY title LIMIT $2',
        params: [
            {
                placeholder: '$1',
                index: 1,
                label: 'rating (G, PG, PG-13, R, or NC-17)',
                propertyName: 'param1'
            },
            {
                placeholder: '$2',
                index: 2,
                label: 'max rows to return',
                propertyName: 'param2'
            }
        ],
        example: 'Rating PG, max 20 rows'
    },
    {
        kind: 'sql',
        toolName: 'filmsWithActorLastName',
        title: 'Actor-film cast via film_actor join',
        description:
            'which films feature actors whose last name starts with a given prefix\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- param1 ($1): actor last name prefix (e.g. GAR, BER, HOP)\n- param2 ($2): max rows to return\n\nExample: Last name prefix GAR, limit 25',
        sqlText:
            "SELECT a.first_name, a.last_name, f.title FROM actor a INNER JOIN film_actor fa ON a.actor_id = fa.actor_id INNER JOIN film f ON f.film_id = fa.film_id WHERE a.last_name LIKE CONCAT($1, '%') ORDER BY a.last_name, f.title LIMIT $2",
        params: [
            {
                placeholder: '$1',
                index: 1,
                label: 'actor last name prefix (e.g. GAR, BER, HOP)',
                propertyName: 'param1'
            },
            {
                placeholder: '$2',
                index: 2,
                label: 'max rows to return',
                propertyName: 'param2'
            }
        ],
        example: 'Last name prefix GAR, limit 25'
    },
    {
        kind: 'sql',
        toolName: 'searchFilms',
        title: 'Film search across title and description',
        description:
            'search films by free text in title or description\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- param1 ($1): search text (matched in title or description)\n- param2 ($2): max rows to return\n\nExample: Search dragon, limit 15',
        sqlText:
            "SELECT film_id, title, rating, LEFT(description, 120) AS description_preview FROM film WHERE title LIKE CONCAT('%', $1, '%') OR description LIKE CONCAT('%', $1, '%') ORDER BY title LIMIT $2",
        params: [
            {
                placeholder: '$1',
                index: 1,
                label: 'search text (matched in title or description)',
                propertyName: 'param1'
            },
            {
                placeholder: '$2',
                index: 2,
                label: 'max rows to return',
                propertyName: 'param2'
            }
        ],
        example: 'Search dragon, limit 15'
    }
];

export const mcpServerName = 'sakila-tools';
export const mcpServerVersion = '0.0.1';

import * as z from 'zod/v4';

const __core2aiPrimitiveUnion = z.union([z.string(), z.number(), z.boolean()]);

export const inputZodByTool = {
    listFilms: z
        .object({
            limit: z.number().describe('Rows per page (default 100).').optional(),
            offset: z.number().describe('Rows to skip for pagination (default 0).').optional()
        })
        .strict(),
    listActors: z
        .object({
            limit: z.number().describe('Rows per page (default 100).').optional(),
            offset: z.number().describe('Rows to skip for pagination (default 0).').optional()
        })
        .strict(),
    listCategories: z
        .object({
            limit: z.number().describe('Rows per page (default 100).').optional(),
            offset: z.number().describe('Rows to skip for pagination (default 0).').optional()
        })
        .strict(),
    filmsByRating: z
        .object({
            param1: z.string().describe('rating (G, PG, PG-13, R, or NC-17) (SQL $1)'),
            param2: z.string().describe('max rows to return (SQL $2)')
        })
        .strict(),
    filmsWithActorLastName: z
        .object({
            param1: z.string().describe('actor last name prefix (e.g. GAR, BER, HOP) (SQL $1)'),
            param2: z.string().describe('max rows to return (SQL $2)')
        })
        .strict(),
    searchFilms: z
        .object({
            param1: z.string().describe('search text (matched in title or description) (SQL $1)'),
            param2: z.string().describe('max rows to return (SQL $2)')
        })
        .strict()
};

const META_AUTH_ENV_KEY = 'MCP_HOST_AUTH_ENV_KEY';
const META_ENV_DIRS = 'MCP_HOST_ENV_DIRS';

function applyHostEnvKeys(hostConfig, envDirs) {
    if (hostConfig.authEnv) {
        process.env[META_AUTH_ENV_KEY] = hostConfig.authEnv;
    } else {
        delete process.env[META_AUTH_ENV_KEY];
    }
    if (envDirs.length > 0) {
        process.env[META_ENV_DIRS] = JSON.stringify(envDirs);
    } else {
        delete process.env[META_ENV_DIRS];
    }
}

function decodeJwtPayloadUnsafe(token) {
    const parts = String(token).trim().split('.');
    if (parts.length !== 3) {
        throw new Error('credential is not a JWT (expected three dot-separated segments).');
    }
    let b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4 !== 0) {
        b64 += '=';
    }
    return JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
}

function isExpectedDatabaseUrl(connectionString) {
    if (databaseDialect === 'mysql') {
        return connectionString.startsWith('mysql://');
    }
    return connectionString.startsWith('postgresql://') || connectionString.startsWith('postgres://');
}

export const mcpHostAdapter = {
    configureFromArgv(argv, envDirs) {
        let authEnv;
        for (let i = 0; i < argv.length; i++) {
            const arg = argv[i];
            if (arg === '--auth-env') {
                authEnv = argv[++i];
                if (!authEnv) {
                    throw new Error('Missing value after --auth-env');
                }
                continue;
            }
            if (arg.startsWith('-')) {
                throw new Error('Unknown option: ' + arg);
            }
            throw new Error('Unexpected positional argument: ' + arg);
        }
        applyHostEnvKeys({ authEnv }, envDirs);
    },

    validateAtStartup(requiresAuth) {
        const connectionString = process.env[connectionEnv]?.trim();
        if (!connectionString) {
            throw new Error(
                'Environment variable "' + connectionEnv + '" is missing or empty (database env from .db2ai).'
            );
        }
        if (!isExpectedDatabaseUrl(connectionString)) {
            throw new Error(
                'Environment variable "' +
                    connectionEnv +
                    '" does not match generated database dialect "' +
                    databaseDialect +
                    '".'
            );
        }
        if (!requiresAuth) {
            return;
        }
        const authEnvName = process.env[META_AUTH_ENV_KEY]?.trim();
        if (!authEnvName) {
            throw new Error('Generated tools require auth; pass --auth-env <ENV_VAR_NAME> on the MCP host.');
        }
        const credential = process.env[authEnvName]?.trim();
        if (!credential) {
            throw new Error('Environment variable "' + authEnvName + '" is missing or empty (required by --auth-env).');
        }
    },

    resolveHostContext() {
        const connectionString = process.env[connectionEnv]?.trim();
        if (!connectionString) {
            throw new Error(
                'Missing database URL. Set environment variable "' + connectionEnv + '" (from database env in .db2ai).'
            );
        }
        if (!isExpectedDatabaseUrl(connectionString)) {
            throw new Error(
                'Database URL from "' +
                    connectionEnv +
                    '" does not match generated database dialect "' +
                    databaseDialect +
                    '".'
            );
        }

        const authKey = process.env[META_AUTH_ENV_KEY]?.trim();
        let credential = authKey ? process.env[authKey]?.trim() : undefined;
        credential = credential || undefined;

        let jwt;
        if (credential) {
            const segments = String(credential).trim().split('.');
            if (segments.length === 3) {
                try {
                    jwt = decodeJwtPayloadUnsafe(credential);
                } catch {
                    jwt = undefined;
                }
            }
        }

        return { connectionString, databaseDialect, credential, jwt };
    },

    envDirsForReload() {
        const raw = process.env[META_ENV_DIRS];
        if (!raw?.trim()) {
            return [];
        }
        try {
            const dirs = JSON.parse(raw);
            if (Array.isArray(dirs) && dirs.every((d) => typeof d === 'string')) {
                return dirs;
            }
        } catch {
            // ignore malformed config
        }
        return [];
    }
};

import mysql from 'mysql2/promise';

export const DEFAULT_PAGE_LIMIT = 100;
export const DEFAULT_MAX_LIMIT_CAP = 1000;

export type InvokeOptions = Record<string, unknown> & {
    limit?: number;
    offset?: number;
};

function resolveConnectionString(hostContext: unknown): string {
    if (hostContext && typeof hostContext === 'object' && 'connectionString' in hostContext) {
        const cs = (hostContext as { connectionString?: unknown }).connectionString;
        if (cs !== undefined && cs !== null && String(cs).trim().length > 0) {
            return String(cs).trim();
        }
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
    hostContext?: unknown
): Promise<unknown> {
    const connectionString = resolveConnectionString(hostContext);
    const client = await mysql.createConnection(connectionString);
    try {
        switch (toolName) {
            case 'listFilms': {
                const effectiveLimit = Math.min(
                    typeof options.limit === 'number' && Number.isFinite(options.limit)
                        ? options.limit
                        : DEFAULT_PAGE_LIMIT,
                    500
                );
                const offset =
                    typeof options.offset === 'number' && Number.isFinite(options.offset) && options.offset >= 0
                        ? Math.floor(options.offset)
                        : 0;
                const sql = 'SELECT * FROM `film` LIMIT ? OFFSET ?';
                const [rows] = await client.query(sql, [effectiveLimit, offset]);
                const resultRows = normalizeMysqlRows(rows);
                return {
                    rows: resultRows,
                    rowCount: resultRows.length,
                    limit: effectiveLimit,
                    offset
                };
            }
            case 'listActors': {
                const effectiveLimit = Math.min(
                    typeof options.limit === 'number' && Number.isFinite(options.limit)
                        ? options.limit
                        : DEFAULT_PAGE_LIMIT,
                    500
                );
                const offset =
                    typeof options.offset === 'number' && Number.isFinite(options.offset) && options.offset >= 0
                        ? Math.floor(options.offset)
                        : 0;
                const sql = 'SELECT * FROM `actor` LIMIT ? OFFSET ?';
                const [rows] = await client.query(sql, [effectiveLimit, offset]);
                const resultRows = normalizeMysqlRows(rows);
                return {
                    rows: resultRows,
                    rowCount: resultRows.length,
                    limit: effectiveLimit,
                    offset
                };
            }
            case 'listCategories': {
                const effectiveLimit = Math.min(
                    typeof options.limit === 'number' && Number.isFinite(options.limit)
                        ? options.limit
                        : DEFAULT_PAGE_LIMIT,
                    500
                );
                const offset =
                    typeof options.offset === 'number' && Number.isFinite(options.offset) && options.offset >= 0
                        ? Math.floor(options.offset)
                        : 0;
                const sql = 'SELECT * FROM `category` LIMIT ? OFFSET ?';
                const [rows] = await client.query(sql, [effectiveLimit, offset]);
                const resultRows = normalizeMysqlRows(rows);
                return {
                    rows: resultRows,
                    rowCount: resultRows.length,
                    limit: effectiveLimit,
                    offset
                };
            }
            case 'filmsByRating': {
                const [rows] = await client.query(
                    'SELECT film_id, title, rating FROM film WHERE rating = ? ORDER BY title LIMIT ?',
                    [normalizeMysqlParamValue(options['param1']), normalizeMysqlParamValue(options['param2'])]
                );
                const resultRows = normalizeMysqlRows(rows);
                return {
                    rows: resultRows,
                    rowCount: resultRows.length
                };
            }
            case 'filmsWithActorLastName': {
                const [rows] = await client.query(
                    "SELECT a.first_name, a.last_name, f.title FROM actor a INNER JOIN film_actor fa ON a.actor_id = fa.actor_id INNER JOIN film f ON f.film_id = fa.film_id WHERE a.last_name LIKE CONCAT(?, '%') ORDER BY a.last_name, f.title LIMIT ?",
                    [normalizeMysqlParamValue(options['param1']), normalizeMysqlParamValue(options['param2'])]
                );
                const resultRows = normalizeMysqlRows(rows);
                return {
                    rows: resultRows,
                    rowCount: resultRows.length
                };
            }
            case 'searchFilms': {
                const [rows] = await client.query(
                    "SELECT film_id, title, rating, LEFT(description, 120) AS description_preview FROM film WHERE title LIKE CONCAT('%', ?, '%') OR description LIKE CONCAT('%', ?, '%') ORDER BY title LIMIT ?",
                    [
                        normalizeMysqlParamValue(options['param1']),
                        normalizeMysqlParamValue(options['param1']),
                        normalizeMysqlParamValue(options['param2'])
                    ]
                );
                const resultRows = normalizeMysqlRows(rows);
                return {
                    rows: resultRows,
                    rowCount: resultRows.length
                };
            }
            default:
                throw new Error(`Unknown tool: ${toolName}`);
        }
    } finally {
        await client.end();
    }
}
