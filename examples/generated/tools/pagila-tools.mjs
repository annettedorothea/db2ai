/**
 * Generated from: examples/pagila.db2ai
 */

export const connectionEnv = "PAGILA_DATABASE_URL";

export const generatedTools = [
    {
        "toolName": "listFilms",
        "title": "Paginated film rows",
        "description": "list films from Pagila with pagination\n\nRuns SELECT * FROM public.film with LIMIT/OFFSET.\nPagination: pass `limit` (default 100) and `offset` (default 0).\nNext page: same `limit`, increase `offset` (e.g. limit 20, offset 20 for page 2).\n\nExample: First page: limit 20 offset 0; next page: limit 20 offset 20",
        "table": "film",
        "maxLimitCap": 500,
        "example": "First page: limit 20 offset 0; next page: limit 20 offset 20"
    },
    {
        "toolName": "listActors",
        "title": "Paginated actor rows",
        "description": "list actors with pagination\n\nRuns SELECT * FROM public.actor with LIMIT/OFFSET.\nPagination: pass `limit` (default 100) and `offset` (default 0).\nNext page: same `limit`, increase `offset` (e.g. limit 20, offset 20 for page 2).",
        "table": "actor",
        "maxLimitCap": 500
    },
    {
        "toolName": "listCustomers",
        "title": "Paginated customer rows",
        "description": "list customers with pagination\n\nRuns SELECT * FROM public.customer with LIMIT/OFFSET.\nPagination: pass `limit` (default 100) and `offset` (default 0).\nNext page: same `limit`, increase `offset` (e.g. limit 20, offset 20 for page 2).\n\nExample: First 10 customers: limit 10 offset 0",
        "table": "customer",
        "maxLimitCap": 500,
        "example": "First 10 customers: limit 10 offset 0"
    },
    {
        "toolName": "listCategories",
        "title": "Paginated category rows",
        "description": "list categories with pagination\n\nRuns SELECT * FROM public.category with LIMIT/OFFSET.\nPagination: pass `limit` (default 100) and `offset` (default 0).\nNext page: same `limit`, increase `offset` (e.g. limit 20, offset 20 for page 2).",
        "table": "category",
        "maxLimitCap": 500
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
            default:
                throw new Error(`Unknown tool: ${toolName}`);
        }
    } finally {
        await client.end();
    }
}
