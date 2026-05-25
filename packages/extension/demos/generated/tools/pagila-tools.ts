/**
 * Generated from: pagila.db2ai
 */

export const connectionEnv = 'PAGILA_DATABASE_URL';

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
        title: 'Paginated film rows',
        description:
            'list films from Pagila with pagination\n\nRuns SELECT * FROM public.film with LIMIT/OFFSET.\nPagination: pass `limit` (default 100) and `offset` (default 0).\nNext page: same `limit`, increase `offset` (e.g. limit 20, offset 20 for page 2).\n\nExample: First page: limit 20 offset 0; next page: limit 20 offset 20',
        table: 'film',
        maxLimitCap: 500,
        example: 'First page: limit 20 offset 0; next page: limit 20 offset 20'
    },
    {
        kind: 'table',
        toolName: 'listActors',
        title: 'Paginated actor rows',
        description:
            'list actors with pagination\n\nRuns SELECT * FROM public.actor with LIMIT/OFFSET.\nPagination: pass `limit` (default 100) and `offset` (default 0).\nNext page: same `limit`, increase `offset` (e.g. limit 20, offset 20 for page 2).\n\nColumns returned:\n- actor_id — Primary key\n- first_name — Given name\n- last_name — Family name',
        table: 'actor',
        maxLimitCap: 500
    },
    {
        kind: 'table',
        toolName: 'listCustomers',
        title: 'Paginated customer rows',
        description:
            'list customers with pagination\n\nRuns SELECT * FROM public.customer with LIMIT/OFFSET.\nPagination: pass `limit` (default 100) and `offset` (default 0).\nNext page: same `limit`, increase `offset` (e.g. limit 20, offset 20 for page 2).\n\nColumns returned:\n- active — Active customer flag\n- address_id — Address ID\n- email — Email address\n\nExample: First 10 customers: limit 10 offset 0',
        table: 'customer',
        maxLimitCap: 500,
        example: 'First 10 customers: limit 10 offset 0'
    },
    {
        kind: 'table',
        toolName: 'listCategories',
        title: 'Paginated category rows',
        description:
            'list categories with pagination\n\nRuns SELECT * FROM public.category with LIMIT/OFFSET.\nPagination: pass `limit` (default 100) and `offset` (default 0).\nNext page: same `limit`, increase `offset` (e.g. limit 20, offset 20 for page 2).',
        table: 'category',
        maxLimitCap: 500
    },
    {
        kind: 'table',
        toolName: 'listCountries',
        title: 'Paginated country rows',
        description:
            'list countries with pagination\n\nRuns SELECT * FROM public.country with LIMIT/OFFSET.\nPagination: pass `limit` (default 100) and `offset` (default 0).\nNext page: same `limit`, increase `offset` (e.g. limit 20, offset 20 for page 2).\n\nColumns returned:\n- country — country name\n- last_update — last update timestamp',
        table: 'country',
        maxLimitCap: 500
    },
    {
        kind: 'table',
        toolName: 'listInventory',
        title: 'Paginated inventory rows',
        description:
            'list inventory with pagination\n\nRuns SELECT * FROM public.inventory with LIMIT/OFFSET.\nPagination: pass `limit` (default 100) and `offset` (default 0).\nNext page: same `limit`, increase `offset` (e.g. limit 20, offset 20 for page 2).\n\nColumns returned:\n- inventory_id — Primary key\n- film_id — Film ID\n- store_id — Store ID',
        table: 'inventory',
        maxLimitCap: 500
    },
    {
        kind: 'sql',
        toolName: 'filmsByMpaaRating',
        title: 'Films by MPAA rating (G, PG, PG-13, R, NC-17)',
        description:
            'list films with a given MPAA age rating\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- param1 ($1): MPAA rating (G, PG, PG-13, R, or NC-17)\n- param2 ($2): max rows to return\n\nExample: MPAA rating PG-13, max 20 rows',
        sqlText: 'SELECT film_id, title, rating FROM film WHERE rating::text = $1 ORDER BY title LIMIT $2',
        params: [
            {
                placeholder: '$1',
                index: 1,
                label: 'MPAA rating (G, PG, PG-13, R, or NC-17)',
                propertyName: 'param1'
            },
            {
                placeholder: '$2',
                index: 2,
                label: 'max rows to return',
                propertyName: 'param2'
            }
        ],
        example: 'MPAA rating PG-13, max 20 rows'
    },
    {
        kind: 'sql',
        toolName: 'filmsWithActorLastName',
        title: 'Actor–film cast via film_actor join',
        description:
            'which films feature actors whose last name starts with a given prefix\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- param1 ($1): actor last name prefix (e.g. GAR, BER, HOP)\n- param2 ($2): max rows to return\n\nExample: Last name prefix GAR (e.g. Gardner), limit 25',
        sqlText:
            "SELECT a.first_name, a.last_name, f.title FROM actor a INNER JOIN film_actor fa ON a.actor_id = fa.actor_id INNER JOIN film f ON f.film_id = fa.film_id WHERE a.last_name ILIKE $1 || '%' ORDER BY a.last_name, f.title LIMIT $2",
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
        example: 'Last name prefix GAR (e.g. Gardner), limit 25'
    },
    {
        kind: 'sql',
        toolName: 'searchFilms',
        title: 'Film full-text style search (title and description)',
        description:
            'search films by free text in title or description\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- param1 ($1): search text (matched in title or description)\n- param2 ($2): max rows to return\n\nExample: Search dragon, limit 15',
        sqlText:
            "SELECT film_id, title, rating, LEFT(description, 120) AS description_preview FROM film WHERE title ILIKE '%' || $1 || '%' OR description ILIKE '%' || $1 || '%' ORDER BY title LIMIT $2",
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

export const mcpServerName = 'pagila-tools';
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
    listCustomers: z
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
    listCountries: z
        .object({
            limit: z.number().describe('Rows per page (default 100).').optional(),
            offset: z.number().describe('Rows to skip for pagination (default 0).').optional()
        })
        .strict(),
    listInventory: z
        .object({
            limit: z.number().describe('Rows per page (default 100).').optional(),
            offset: z.number().describe('Rows to skip for pagination (default 0).').optional()
        })
        .strict(),
    filmsByMpaaRating: z
        .object({
            param1: z.string().describe('MPAA rating (G, PG, PG-13, R, or NC-17) (SQL $1)'),
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

        return { connectionString, credential, jwt };
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

import pg from 'pg';

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

export async function invokeTool(
    toolName: string,
    options: InvokeOptions = {},
    hostContext?: unknown
): Promise<unknown> {
    const connectionString = resolveConnectionString(hostContext);
    const client = new pg.Client({ connectionString });
    await client.connect();
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
                const sql = `SELECT * FROM "film" LIMIT $1 OFFSET $2`;
                const result = await client.query(sql, [effectiveLimit, offset]);
                return {
                    rows: result.rows,
                    rowCount: result.rowCount ?? result.rows.length,
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
                const sql = `SELECT * FROM "actor" LIMIT $1 OFFSET $2`;
                const result = await client.query(sql, [effectiveLimit, offset]);
                return {
                    rows: result.rows,
                    rowCount: result.rowCount ?? result.rows.length,
                    limit: effectiveLimit,
                    offset
                };
            }
            case 'listCustomers': {
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
                const sql = `SELECT * FROM "customer" LIMIT $1 OFFSET $2`;
                const result = await client.query(sql, [effectiveLimit, offset]);
                return {
                    rows: result.rows,
                    rowCount: result.rowCount ?? result.rows.length,
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
                const sql = `SELECT * FROM "category" LIMIT $1 OFFSET $2`;
                const result = await client.query(sql, [effectiveLimit, offset]);
                return {
                    rows: result.rows,
                    rowCount: result.rowCount ?? result.rows.length,
                    limit: effectiveLimit,
                    offset
                };
            }
            case 'listCountries': {
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
                const sql = `SELECT * FROM "country" LIMIT $1 OFFSET $2`;
                const result = await client.query(sql, [effectiveLimit, offset]);
                return {
                    rows: result.rows,
                    rowCount: result.rowCount ?? result.rows.length,
                    limit: effectiveLimit,
                    offset
                };
            }
            case 'listInventory': {
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
                const sql = `SELECT * FROM "inventory" LIMIT $1 OFFSET $2`;
                const result = await client.query(sql, [effectiveLimit, offset]);
                return {
                    rows: result.rows,
                    rowCount: result.rowCount ?? result.rows.length,
                    limit: effectiveLimit,
                    offset
                };
            }
            case 'filmsByMpaaRating': {
                const result = await client.query({
                    text: 'SELECT film_id, title, rating FROM film WHERE rating::text = $1 ORDER BY title LIMIT $2',
                    values: [
                        options['param1'] !== undefined && options['param1'] !== null
                            ? String(options['param1'])
                            : null,
                        options['param2'] !== undefined && options['param2'] !== null ? String(options['param2']) : null
                    ]
                });
                return {
                    rows: result.rows,
                    rowCount: result.rowCount ?? result.rows.length
                };
            }
            case 'filmsWithActorLastName': {
                const result = await client.query({
                    text: "SELECT a.first_name, a.last_name, f.title FROM actor a INNER JOIN film_actor fa ON a.actor_id = fa.actor_id INNER JOIN film f ON f.film_id = fa.film_id WHERE a.last_name ILIKE $1 || '%' ORDER BY a.last_name, f.title LIMIT $2",
                    values: [
                        options['param1'] !== undefined && options['param1'] !== null
                            ? String(options['param1'])
                            : null,
                        options['param2'] !== undefined && options['param2'] !== null ? String(options['param2']) : null
                    ]
                });
                return {
                    rows: result.rows,
                    rowCount: result.rowCount ?? result.rows.length
                };
            }
            case 'searchFilms': {
                const result = await client.query({
                    text: "SELECT film_id, title, rating, LEFT(description, 120) AS description_preview FROM film WHERE title ILIKE '%' || $1 || '%' OR description ILIKE '%' || $1 || '%' ORDER BY title LIMIT $2",
                    values: [
                        options['param1'] !== undefined && options['param1'] !== null
                            ? String(options['param1'])
                            : null,
                        options['param2'] !== undefined && options['param2'] !== null ? String(options['param2']) : null
                    ]
                });
                return {
                    rows: result.rows,
                    rowCount: result.rowCount ?? result.rows.length
                };
            }
            default:
                throw new Error(`Unknown tool: ${toolName}`);
        }
    } finally {
        await client.end();
    }
}
