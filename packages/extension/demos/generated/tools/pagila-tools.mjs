/**
 * Generated from: pagila.db2ai
 */
import { resolveCredentialAndOptionalJwt } from '@core2ai/core/mcp-host';

export const connectionEnv = "PAGILA_DATABASE_URL";

export const databaseDialect = "postgres";

export const requiresAuth = true;

export const generatedTools = [
    {
        "kind": "sql",
        "toolName": "listFilms",
        "title": "Paginated film rows",
        "description": "list films from Pagila with pagination\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- limit ($1): max rows per page (example: 100)\n- offset ($2): rows to skip (example: 0)\n\nExample call: limit=100, offset=0",
        "access": "public",
        "sqlText": "SELECT * FROM film LIMIT LEAST($1, 500) OFFSET $2",
        "params": [
            {
                "placeholder": "$1",
                "index": 1,
                "name": "limit",
                "propertyName": "limit",
                "description": "max rows per page",
                "example": "100",
                "jsonSchemaType": "integer"
            },
            {
                "placeholder": "$2",
                "index": 2,
                "name": "offset",
                "propertyName": "offset",
                "description": "rows to skip",
                "example": "0",
                "jsonSchemaType": "integer"
            }
        ]
    },
    {
        "kind": "sql",
        "toolName": "listActors",
        "title": "Paginated actor rows",
        "description": "list actors with pagination\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- limit ($1): max rows per page (example: 100)\n- offset ($2): rows to skip (example: 0)\n\nExample call: limit=100, offset=0",
        "access": "protected",
        "sqlText": "SELECT * FROM actor LIMIT LEAST($1, 500) OFFSET $2",
        "params": [
            {
                "placeholder": "$1",
                "index": 1,
                "name": "limit",
                "propertyName": "limit",
                "description": "max rows per page",
                "example": "100",
                "jsonSchemaType": "integer"
            },
            {
                "placeholder": "$2",
                "index": 2,
                "name": "offset",
                "propertyName": "offset",
                "description": "rows to skip",
                "example": "0",
                "jsonSchemaType": "integer"
            }
        ]
    },
    {
        "kind": "sql",
        "toolName": "listCustomers",
        "title": "Paginated customer rows",
        "description": "list customers with pagination\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- limit ($1): max rows per page (example: 10)\n- offset ($2): rows to skip (example: 0)\n\nExample call: limit=10, offset=0",
        "access": "public",
        "sqlText": "SELECT * FROM customer LIMIT LEAST($1, 500) OFFSET $2",
        "params": [
            {
                "placeholder": "$1",
                "index": 1,
                "name": "limit",
                "propertyName": "limit",
                "description": "max rows per page",
                "example": "10",
                "jsonSchemaType": "integer"
            },
            {
                "placeholder": "$2",
                "index": 2,
                "name": "offset",
                "propertyName": "offset",
                "description": "rows to skip",
                "example": "0",
                "jsonSchemaType": "integer"
            }
        ]
    },
    {
        "kind": "sql",
        "toolName": "listCategories",
        "title": "Paginated category rows",
        "description": "list categories with pagination\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- limit ($1): max rows per page (example: 100)\n- offset ($2): rows to skip (example: 0)\n\nExample call: limit=100, offset=0",
        "access": "public",
        "sqlText": "SELECT * FROM category LIMIT LEAST($1, 500) OFFSET $2",
        "params": [
            {
                "placeholder": "$1",
                "index": 1,
                "name": "limit",
                "propertyName": "limit",
                "description": "max rows per page",
                "example": "100",
                "jsonSchemaType": "integer"
            },
            {
                "placeholder": "$2",
                "index": 2,
                "name": "offset",
                "propertyName": "offset",
                "description": "rows to skip",
                "example": "0",
                "jsonSchemaType": "integer"
            }
        ]
    },
    {
        "kind": "sql",
        "toolName": "listCountries",
        "title": "Paginated country rows",
        "description": "list countries with pagination\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- limit ($1): max rows per page (example: 100)\n- offset ($2): rows to skip (example: 0)\n\nExample call: limit=100, offset=0",
        "access": "public",
        "sqlText": "SELECT * FROM country LIMIT LEAST($1, 500) OFFSET $2",
        "params": [
            {
                "placeholder": "$1",
                "index": 1,
                "name": "limit",
                "propertyName": "limit",
                "description": "max rows per page",
                "example": "100",
                "jsonSchemaType": "integer"
            },
            {
                "placeholder": "$2",
                "index": 2,
                "name": "offset",
                "propertyName": "offset",
                "description": "rows to skip",
                "example": "0",
                "jsonSchemaType": "integer"
            }
        ]
    },
    {
        "kind": "sql",
        "toolName": "listInventory",
        "title": "Paginated inventory rows",
        "description": "list inventory with pagination\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- limit ($1): max rows per page (example: 100)\n- offset ($2): rows to skip (example: 0)\n\nExample call: limit=100, offset=0",
        "access": "public",
        "sqlText": "SELECT * FROM inventory LIMIT LEAST($1, 500) OFFSET $2",
        "params": [
            {
                "placeholder": "$1",
                "index": 1,
                "name": "limit",
                "propertyName": "limit",
                "description": "max rows per page",
                "example": "100",
                "jsonSchemaType": "integer"
            },
            {
                "placeholder": "$2",
                "index": 2,
                "name": "offset",
                "propertyName": "offset",
                "description": "rows to skip",
                "example": "0",
                "jsonSchemaType": "integer"
            }
        ]
    },
    {
        "kind": "sql",
        "toolName": "filmsByMpaaRating",
        "title": "Films by MPAA rating (G, PG, PG-13, R, NC-17)",
        "description": "list films with a given MPAA age rating\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- rating ($1): MPAA rating (G, PG, PG-13, R, or NC-17) (example: PG-13)\n- maxRows ($2): max rows to return (example: 20)\n\nExample call: rating=PG-13, maxRows=20",
        "access": "public",
        "sqlText": "SELECT film_id, title, rating FROM film WHERE rating::text = $1 ORDER BY title LIMIT $2",
        "params": [
            {
                "placeholder": "$1",
                "index": 1,
                "name": "rating",
                "propertyName": "rating",
                "description": "MPAA rating (G, PG, PG-13, R, or NC-17)",
                "example": "PG-13",
                "jsonSchemaType": "string"
            },
            {
                "placeholder": "$2",
                "index": 2,
                "name": "maxRows",
                "propertyName": "maxRows",
                "description": "max rows to return",
                "example": "20",
                "jsonSchemaType": "integer"
            }
        ]
    },
    {
        "kind": "sql",
        "toolName": "filmsWithActorLastName",
        "title": "Actor–film cast via film_actor join",
        "description": "which films feature actors whose last name starts with a given prefix\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- lastNamePrefix ($1): actor last name prefix (e.g. GAR, BER, HOP) (example: GAR)\n- maxRows ($2): max rows to return (example: 25)\n\nExample call: lastNamePrefix=GAR, maxRows=25",
        "access": "public",
        "sqlText": "SELECT a.first_name, a.last_name, f.title FROM actor a INNER JOIN film_actor fa ON a.actor_id = fa.actor_id INNER JOIN film f ON f.film_id = fa.film_id WHERE a.last_name ILIKE $1 || '%' ORDER BY a.last_name, f.title LIMIT $2",
        "params": [
            {
                "placeholder": "$1",
                "index": 1,
                "name": "lastNamePrefix",
                "propertyName": "lastNamePrefix",
                "description": "actor last name prefix (e.g. GAR, BER, HOP)",
                "example": "GAR",
                "jsonSchemaType": "string"
            },
            {
                "placeholder": "$2",
                "index": 2,
                "name": "maxRows",
                "propertyName": "maxRows",
                "description": "max rows to return",
                "example": "25",
                "jsonSchemaType": "integer"
            }
        ]
    },
    {
        "kind": "sql",
        "toolName": "searchFilms",
        "title": "Film full-text style search (title and description)",
        "description": "search films by free text in title or description\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- searchText ($1): search text (matched in title or description) (example: dog)\n- maxRows ($2): max rows to return (example: 15)\n\nExample call: searchText=dog, maxRows=15",
        "access": "public",
        "sqlText": "SELECT film_id, title, rating, LEFT(description, 120) AS description_preview FROM film WHERE title ILIKE '%' || $1 || '%' OR description ILIKE '%' || $1 || '%' ORDER BY title LIMIT $2",
        "params": [
            {
                "placeholder": "$1",
                "index": 1,
                "name": "searchText",
                "propertyName": "searchText",
                "description": "search text (matched in title or description)",
                "example": "dog",
                "jsonSchemaType": "string"
            },
            {
                "placeholder": "$2",
                "index": 2,
                "name": "maxRows",
                "propertyName": "maxRows",
                "description": "max rows to return",
                "example": "15",
                "jsonSchemaType": "integer"
            }
        ]
    }
];

export const mcpServerName = "pagila-tools";
export const mcpServerVersion = "0.0.4";

import * as z from 'zod/v4';

export const inputZodByTool = {
    "listFilms": z.object({ "limit": z.number().describe("max rows per page (SQL $1)"), "offset": z.number().describe("rows to skip (SQL $2)") }).strict(),
    "listActors": z.object({ "limit": z.number().describe("max rows per page (SQL $1)"), "offset": z.number().describe("rows to skip (SQL $2)") }).strict(),
    "listCustomers": z.object({ "limit": z.number().describe("max rows per page (SQL $1)"), "offset": z.number().describe("rows to skip (SQL $2)") }).strict(),
    "listCategories": z.object({ "limit": z.number().describe("max rows per page (SQL $1)"), "offset": z.number().describe("rows to skip (SQL $2)") }).strict(),
    "listCountries": z.object({ "limit": z.number().describe("max rows per page (SQL $1)"), "offset": z.number().describe("rows to skip (SQL $2)") }).strict(),
    "listInventory": z.object({ "limit": z.number().describe("max rows per page (SQL $1)"), "offset": z.number().describe("rows to skip (SQL $2)") }).strict(),
    "filmsByMpaaRating": z.object({ "rating": z.string().describe("MPAA rating (G, PG, PG-13, R, or NC-17) (SQL $1)"), "maxRows": z.number().describe("max rows to return (SQL $2)") }).strict(),
    "filmsWithActorLastName": z.object({ "lastNamePrefix": z.string().describe("actor last name prefix (e.g. GAR, BER, HOP) (SQL $1)"), "maxRows": z.number().describe("max rows to return (SQL $2)") }).strict(),
    "searchFilms": z.object({ "searchText": z.string().describe("search text (matched in title or description) (SQL $1)"), "maxRows": z.number().describe("max rows to return (SQL $2)") }).strict()
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

function isExpectedDatabaseUrl(connectionString) {
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
            throw new Error(
                'Generated tools include protected or checked access; pass --auth-env <ENV_VAR_NAME> on the MCP host.'
            );
        }
        // Credential value may be empty at startup — public tools work without a token; protected/checked fail at invoke.
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
                'Database URL from "' + connectionEnv + '" does not match generated database dialect "' + databaseDialect + '".'
            );
        }

        const authKey = process.env[META_AUTH_ENV_KEY]?.trim();
        const { credential, jwt } = resolveCredentialAndOptionalJwt(authKey);
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

import pg from 'pg';

function resolveConnectionString(hostContext) {
    if (hostContext && typeof hostContext === 'object' && hostContext.connectionString != null) {
        const cs = String(hostContext.connectionString).trim();
        if (cs.length > 0) {
            return cs;
        }
    }
    throw new Error(
        'Missing database connection. MCP host must pass hostContext.connectionString (from database env in .db2ai).'
    );
}

function normalizePostgresNumericParamValue(value) {
    if (value === undefined || value === null) {
        return null;
    }
    const n = typeof value === 'number' ? value : Number(String(value));
    return Number.isFinite(n) ? n : null;
}

export async function invokeTool(toolName, options = {}, hostContext) {
    const toolMeta = generatedTools.find((t) => t.toolName === toolName);
    if (!toolMeta) {
        throw new Error('Unknown tool: ' + toolName);
    }

    const host = hostContext ?? mcpHostAdapter.resolveHostContext();
    if (toolMeta.access !== 'public') {
        if (!host.credential || !String(host.credential).trim()) {
            throw new Error(
                'Missing host credential. Pass --auth-env on mcp-serve.mjs and set the variable (re-read on every tool call).'
            );
        }
    }
    const connectionString = resolveConnectionString(host);
    const client = new pg.Client({ connectionString });
    await client.connect();
    try {
        switch (toolName) {
        case "listFilms": {
            const result = await client.query({ text: "SELECT * FROM film LIMIT LEAST($1, 500) OFFSET $2", values: [normalizePostgresNumericParamValue(options["limit"]), normalizePostgresNumericParamValue(options["offset"])] });
            return {
                rows: result.rows,
                rowCount: result.rowCount ?? result.rows.length
            };
        }
        case "listActors": {
            const result = await client.query({ text: "SELECT * FROM actor LIMIT LEAST($1, 500) OFFSET $2", values: [normalizePostgresNumericParamValue(options["limit"]), normalizePostgresNumericParamValue(options["offset"])] });
            return {
                rows: result.rows,
                rowCount: result.rowCount ?? result.rows.length
            };
        }
        case "listCustomers": {
            const result = await client.query({ text: "SELECT * FROM customer LIMIT LEAST($1, 500) OFFSET $2", values: [normalizePostgresNumericParamValue(options["limit"]), normalizePostgresNumericParamValue(options["offset"])] });
            return {
                rows: result.rows,
                rowCount: result.rowCount ?? result.rows.length
            };
        }
        case "listCategories": {
            const result = await client.query({ text: "SELECT * FROM category LIMIT LEAST($1, 500) OFFSET $2", values: [normalizePostgresNumericParamValue(options["limit"]), normalizePostgresNumericParamValue(options["offset"])] });
            return {
                rows: result.rows,
                rowCount: result.rowCount ?? result.rows.length
            };
        }
        case "listCountries": {
            const result = await client.query({ text: "SELECT * FROM country LIMIT LEAST($1, 500) OFFSET $2", values: [normalizePostgresNumericParamValue(options["limit"]), normalizePostgresNumericParamValue(options["offset"])] });
            return {
                rows: result.rows,
                rowCount: result.rowCount ?? result.rows.length
            };
        }
        case "listInventory": {
            const result = await client.query({ text: "SELECT * FROM inventory LIMIT LEAST($1, 500) OFFSET $2", values: [normalizePostgresNumericParamValue(options["limit"]), normalizePostgresNumericParamValue(options["offset"])] });
            return {
                rows: result.rows,
                rowCount: result.rowCount ?? result.rows.length
            };
        }
        case "filmsByMpaaRating": {
            const result = await client.query({ text: "SELECT film_id, title, rating FROM film WHERE rating::text = $1 ORDER BY title LIMIT $2", values: [options["rating"] !== undefined && options["rating"] !== null ? String(options["rating"]) : null, normalizePostgresNumericParamValue(options["maxRows"])] });
            return {
                rows: result.rows,
                rowCount: result.rowCount ?? result.rows.length
            };
        }
        case "filmsWithActorLastName": {
            const result = await client.query({ text: "SELECT a.first_name, a.last_name, f.title FROM actor a INNER JOIN film_actor fa ON a.actor_id = fa.actor_id INNER JOIN film f ON f.film_id = fa.film_id WHERE a.last_name ILIKE $1 || '%' ORDER BY a.last_name, f.title LIMIT $2", values: [options["lastNamePrefix"] !== undefined && options["lastNamePrefix"] !== null ? String(options["lastNamePrefix"]) : null, normalizePostgresNumericParamValue(options["maxRows"])] });
            return {
                rows: result.rows,
                rowCount: result.rowCount ?? result.rows.length
            };
        }
        case "searchFilms": {
            const result = await client.query({ text: "SELECT film_id, title, rating, LEFT(description, 120) AS description_preview FROM film WHERE title ILIKE '%' || $1 || '%' OR description ILIKE '%' || $1 || '%' ORDER BY title LIMIT $2", values: [options["searchText"] !== undefined && options["searchText"] !== null ? String(options["searchText"]) : null, options["searchText"] !== undefined && options["searchText"] !== null ? String(options["searchText"]) : null, normalizePostgresNumericParamValue(options["maxRows"])] });
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
