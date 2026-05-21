/**
 * Generated from: examples/pagila.db2ai
 */

export const connectionEnv = "PAGILA_DATABASE_URL";

export const generatedTools = [
    {
        "kind": "table",
        "toolName": "listFilms",
        "title": "Paginated film rows",
        "description": "list films from Pagila with pagination\n\nRuns SELECT * FROM public.film with LIMIT/OFFSET.\nPagination: pass `limit` (default 100) and `offset` (default 0).\nNext page: same `limit`, increase `offset` (e.g. limit 20, offset 20 for page 2).\n\nExample: First page: limit 20 offset 0; next page: limit 20 offset 20",
        "table": "film",
        "maxLimitCap": 500,
        "example": "First page: limit 20 offset 0; next page: limit 20 offset 20"
    },
    {
        "kind": "table",
        "toolName": "listActors",
        "title": "Paginated actor rows",
        "description": "list actors with pagination\n\nRuns SELECT * FROM public.actor with LIMIT/OFFSET.\nPagination: pass `limit` (default 100) and `offset` (default 0).\nNext page: same `limit`, increase `offset` (e.g. limit 20, offset 20 for page 2).\n\nColumns returned:\n- actor_id — Primary key\n- first_name — Given name\n- last_name — Family name",
        "table": "actor",
        "maxLimitCap": 500
    },
    {
        "kind": "table",
        "toolName": "listCustomers",
        "title": "Paginated customer rows",
        "description": "list customers with pagination\n\nRuns SELECT * FROM public.customer with LIMIT/OFFSET.\nPagination: pass `limit` (default 100) and `offset` (default 0).\nNext page: same `limit`, increase `offset` (e.g. limit 20, offset 20 for page 2).\n\nColumns returned:\n- active — Active customer flag\n- address_id — Address ID\n- email — Email address\n\nExample: First 10 customers: limit 10 offset 0",
        "table": "customer",
        "maxLimitCap": 500,
        "example": "First 10 customers: limit 10 offset 0"
    },
    {
        "kind": "table",
        "toolName": "listCategories",
        "title": "Paginated category rows",
        "description": "list categories with pagination\n\nRuns SELECT * FROM public.category with LIMIT/OFFSET.\nPagination: pass `limit` (default 100) and `offset` (default 0).\nNext page: same `limit`, increase `offset` (e.g. limit 20, offset 20 for page 2).",
        "table": "category",
        "maxLimitCap": 500
    },
    {
        "kind": "table",
        "toolName": "listCountries",
        "title": "Paginated country rows",
        "description": "list countries with pagination\n\nRuns SELECT * FROM public.country with LIMIT/OFFSET.\nPagination: pass `limit` (default 100) and `offset` (default 0).\nNext page: same `limit`, increase `offset` (e.g. limit 20, offset 20 for page 2).\n\nColumns returned:\n- country — country name\n- last_update — last update timestamp",
        "table": "country",
        "maxLimitCap": 500
    },
    {
        "kind": "table",
        "toolName": "listInventory",
        "title": "Paginated inventory rows",
        "description": "list inventory with pagination\n\nRuns SELECT * FROM public.inventory with LIMIT/OFFSET.\nPagination: pass `limit` (default 100) and `offset` (default 0).\nNext page: same `limit`, increase `offset` (e.g. limit 20, offset 20 for page 2).\n\nColumns returned:\n- inventory_id — Primary key\n- film_id — Film ID\n- store_id — Store ID",
        "table": "inventory",
        "maxLimitCap": 500
    },
    {
        "kind": "sql",
        "toolName": "filmsByMpaaRating",
        "title": "Films by MPAA rating (G, PG, PG-13, R, NC-17)",
        "description": "list films with a given MPAA age rating\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- param1 ($1): MPAA rating (G, PG, PG-13, R, or NC-17)\n- param2 ($2): max rows to return\n\nExample: MPAA rating PG-13, max 20 rows",
        "sqlText": "SELECT film_id, title, rating FROM film WHERE rating = $1::mpaa_rating ORDER BY title LIMIT $2",
        "params": [
            {
                "placeholder": "$1",
                "index": 1,
                "label": "MPAA rating (G, PG, PG-13, R, or NC-17)",
                "propertyName": "param1"
            },
            {
                "placeholder": "$2",
                "index": 2,
                "label": "max rows to return",
                "propertyName": "param2"
            }
        ],
        "example": "MPAA rating PG-13, max 20 rows"
    },
    {
        "kind": "sql",
        "toolName": "filmsWithActorLastName",
        "title": "Actor–film cast via film_actor join",
        "description": "which films feature actors whose last name starts with a given prefix\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- param1 ($1): actor last name prefix (e.g. GAR, BER, HOP)\n- param2 ($2): max rows to return\n\nExample: Last name prefix GAR (e.g. Gardner), limit 25",
        "sqlText": "SELECT a.first_name, a.last_name, f.title FROM actor a INNER JOIN film_actor fa ON a.actor_id = fa.actor_id INNER JOIN film f ON f.film_id = fa.film_id WHERE a.last_name ILIKE $1 || '%' ORDER BY a.last_name, f.title LIMIT $2",
        "params": [
            {
                "placeholder": "$1",
                "index": 1,
                "label": "actor last name prefix (e.g. GAR, BER, HOP)",
                "propertyName": "param1"
            },
            {
                "placeholder": "$2",
                "index": 2,
                "label": "max rows to return",
                "propertyName": "param2"
            }
        ],
        "example": "Last name prefix GAR (e.g. Gardner), limit 25"
    },
    {
        "kind": "sql",
        "toolName": "searchFilms",
        "title": "Film full-text style search (title and description)",
        "description": "search films by free text in title or description\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- param1 ($1): search text (matched in title or description)\n- param2 ($2): max rows to return\n\nExample: Search dragon, limit 15",
        "sqlText": "SELECT film_id, title, rating, LEFT(description, 120) AS description_preview FROM film WHERE title ILIKE '%' || $1 || '%' OR description ILIKE '%' || $1 || '%' ORDER BY title LIMIT $2",
        "params": [
            {
                "placeholder": "$1",
                "index": 1,
                "label": "search text (matched in title or description)",
                "propertyName": "param1"
            },
            {
                "placeholder": "$2",
                "index": 2,
                "label": "max rows to return",
                "propertyName": "param2"
            }
        ],
        "example": "Search dragon, limit 15"
    }
];

export const inputSchemaByTool = {
    "listFilms": {
        "type": "object",
        "properties": {
            "limit": {
                "type": "integer",
                "minimum": 1,
                "default": 100,
                "description": "Rows per page (default 100)."
            },
            "offset": {
                "type": "integer",
                "minimum": 0,
                "default": 0,
                "description": "Rows to skip for pagination (default 0)."
            }
        },
        "required": [],
        "additionalProperties": false
    },
    "listActors": {
        "type": "object",
        "properties": {
            "limit": {
                "type": "integer",
                "minimum": 1,
                "default": 100,
                "description": "Rows per page (default 100)."
            },
            "offset": {
                "type": "integer",
                "minimum": 0,
                "default": 0,
                "description": "Rows to skip for pagination (default 0)."
            }
        },
        "required": [],
        "additionalProperties": false
    },
    "listCustomers": {
        "type": "object",
        "properties": {
            "limit": {
                "type": "integer",
                "minimum": 1,
                "default": 100,
                "description": "Rows per page (default 100)."
            },
            "offset": {
                "type": "integer",
                "minimum": 0,
                "default": 0,
                "description": "Rows to skip for pagination (default 0)."
            }
        },
        "required": [],
        "additionalProperties": false
    },
    "listCategories": {
        "type": "object",
        "properties": {
            "limit": {
                "type": "integer",
                "minimum": 1,
                "default": 100,
                "description": "Rows per page (default 100)."
            },
            "offset": {
                "type": "integer",
                "minimum": 0,
                "default": 0,
                "description": "Rows to skip for pagination (default 0)."
            }
        },
        "required": [],
        "additionalProperties": false
    },
    "listCountries": {
        "type": "object",
        "properties": {
            "limit": {
                "type": "integer",
                "minimum": 1,
                "default": 100,
                "description": "Rows per page (default 100)."
            },
            "offset": {
                "type": "integer",
                "minimum": 0,
                "default": 0,
                "description": "Rows to skip for pagination (default 0)."
            }
        },
        "required": [],
        "additionalProperties": false
    },
    "listInventory": {
        "type": "object",
        "properties": {
            "limit": {
                "type": "integer",
                "minimum": 1,
                "default": 100,
                "description": "Rows per page (default 100)."
            },
            "offset": {
                "type": "integer",
                "minimum": 0,
                "default": 0,
                "description": "Rows to skip for pagination (default 0)."
            }
        },
        "required": [],
        "additionalProperties": false
    },
    "filmsByMpaaRating": {
        "type": "object",
        "properties": {
            "param1": {
                "type": "string",
                "description": "MPAA rating (G, PG, PG-13, R, or NC-17) (SQL $1)"
            },
            "param2": {
                "type": "string",
                "description": "max rows to return (SQL $2)"
            }
        },
        "required": [
            "param1",
            "param2"
        ],
        "additionalProperties": false
    },
    "filmsWithActorLastName": {
        "type": "object",
        "properties": {
            "param1": {
                "type": "string",
                "description": "actor last name prefix (e.g. GAR, BER, HOP) (SQL $1)"
            },
            "param2": {
                "type": "string",
                "description": "max rows to return (SQL $2)"
            }
        },
        "required": [
            "param1",
            "param2"
        ],
        "additionalProperties": false
    },
    "searchFilms": {
        "type": "object",
        "properties": {
            "param1": {
                "type": "string",
                "description": "search text (matched in title or description) (SQL $1)"
            },
            "param2": {
                "type": "string",
                "description": "max rows to return (SQL $2)"
            }
        },
        "required": [
            "param1",
            "param2"
        ],
        "additionalProperties": false
    }
};

import pg from 'pg';

export const DEFAULT_PAGE_LIMIT = 100;
export const DEFAULT_MAX_LIMIT_CAP = 1000;

export async function invokeTool(toolName, options = {}) {
    const connectionString = process.env[connectionEnv];
    if (!connectionString || String(connectionString).trim().length === 0) {
        throw new Error(`Missing database URL: set environment variable "${connectionEnv}".`);
    }
    const client = new pg.Client({ connectionString: String(connectionString).trim() });
    await client.connect();
    try {
        switch (toolName) {
        case "listFilms": {
            const effectiveLimit = Math.min(
                typeof options.limit === 'number' && Number.isFinite(options.limit) ? options.limit : DEFAULT_PAGE_LIMIT,
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
        case "listActors": {
            const effectiveLimit = Math.min(
                typeof options.limit === 'number' && Number.isFinite(options.limit) ? options.limit : DEFAULT_PAGE_LIMIT,
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
        case "listCustomers": {
            const effectiveLimit = Math.min(
                typeof options.limit === 'number' && Number.isFinite(options.limit) ? options.limit : DEFAULT_PAGE_LIMIT,
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
        case "listCategories": {
            const effectiveLimit = Math.min(
                typeof options.limit === 'number' && Number.isFinite(options.limit) ? options.limit : DEFAULT_PAGE_LIMIT,
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
        case "listCountries": {
            const effectiveLimit = Math.min(
                typeof options.limit === 'number' && Number.isFinite(options.limit) ? options.limit : DEFAULT_PAGE_LIMIT,
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
        case "listInventory": {
            const effectiveLimit = Math.min(
                typeof options.limit === 'number' && Number.isFinite(options.limit) ? options.limit : DEFAULT_PAGE_LIMIT,
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
        case "filmsByMpaaRating": {
            const result = await client.query({ text: "SELECT film_id, title, rating FROM film WHERE rating = $1::mpaa_rating ORDER BY title LIMIT $2", values: [options["param1"] !== undefined && options["param1"] !== null ? String(options["param1"]) : null, options["param2"] !== undefined && options["param2"] !== null ? String(options["param2"]) : null] });
            return {
                rows: result.rows,
                rowCount: result.rowCount ?? result.rows.length
            };
        }
        case "filmsWithActorLastName": {
            const result = await client.query({ text: "SELECT a.first_name, a.last_name, f.title FROM actor a INNER JOIN film_actor fa ON a.actor_id = fa.actor_id INNER JOIN film f ON f.film_id = fa.film_id WHERE a.last_name ILIKE $1 || '%' ORDER BY a.last_name, f.title LIMIT $2", values: [options["param1"] !== undefined && options["param1"] !== null ? String(options["param1"]) : null, options["param2"] !== undefined && options["param2"] !== null ? String(options["param2"]) : null] });
            return {
                rows: result.rows,
                rowCount: result.rowCount ?? result.rows.length
            };
        }
        case "searchFilms": {
            const result = await client.query({ text: "SELECT film_id, title, rating, LEFT(description, 120) AS description_preview FROM film WHERE title ILIKE '%' || $1 || '%' OR description ILIKE '%' || $1 || '%' ORDER BY title LIMIT $2", values: [options["param1"] !== undefined && options["param1"] !== null ? String(options["param1"]) : null, options["param2"] !== undefined && options["param2"] !== null ? String(options["param2"]) : null] });
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
