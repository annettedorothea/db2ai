/**
 * Generated from: sakila.db2ai
 */

export const connectionEnv = "SAKILA_DATABASE_URL";

export const databaseDialect = "mysql";

export const requiresAuth = false;

export const generatedTools = [
    {
        "kind": "sql",
        "toolName": "listFilms",
        "title": "Paginated Sakila film rows",
        "description": "list films from Sakila with pagination\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- limit ($1): max rows per page (example: 100)\n- offset ($2): rows to skip (example: 0)\n\nExample call: limit=100, offset=0",
        "sqlText": "SELECT * FROM film LIMIT $1 OFFSET $2",
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
        "title": "Paginated Sakila actor rows",
        "description": "list actors with pagination\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- limit ($1): max rows per page (example: 100)\n- offset ($2): rows to skip (example: 0)\n\nExample call: limit=100, offset=0",
        "sqlText": "SELECT * FROM actor LIMIT $1 OFFSET $2",
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
        "toolName": "listCategories",
        "title": "Paginated Sakila category rows",
        "description": "list film categories with pagination\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- limit ($1): max rows per page (example: 100)\n- offset ($2): rows to skip (example: 0)\n\nExample call: limit=100, offset=0",
        "sqlText": "SELECT * FROM category LIMIT $1 OFFSET $2",
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
        "toolName": "filmsByRating",
        "title": "Films by rating (G, PG, PG-13, R, NC-17)",
        "description": "list films with a given rating\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- rating ($1): rating (G, PG, PG-13, R, or NC-17) (example: PG)\n- maxRows ($2): max rows to return (example: 20)\n\nExample call: rating=PG, maxRows=20",
        "sqlText": "SELECT film_id, title, rating FROM film WHERE rating = $1 ORDER BY title LIMIT $2",
        "params": [
            {
                "placeholder": "$1",
                "index": 1,
                "name": "rating",
                "propertyName": "rating",
                "description": "rating (G, PG, PG-13, R, or NC-17)",
                "example": "PG",
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
        "title": "Actor-film cast via film_actor join",
        "description": "which films feature actors whose last name starts with a given prefix\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- lastNamePrefix ($1): actor last name prefix (e.g. GAR, BER, HOP) (example: GAR)\n- maxRows ($2): max rows to return (example: 25)\n\nExample call: lastNamePrefix=GAR, maxRows=25",
        "sqlText": "SELECT a.first_name, a.last_name, f.title FROM actor a INNER JOIN film_actor fa ON a.actor_id = fa.actor_id INNER JOIN film f ON f.film_id = fa.film_id WHERE a.last_name LIKE CONCAT($1, '%') ORDER BY a.last_name, f.title LIMIT $2",
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
        "title": "Film search across title and description",
        "description": "search films by free text in title or description\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- searchText ($1): search text (matched in title or description) (example: cat)\n- maxRows ($2): max rows to return (example: 15)\n\nExample call: searchText=cat, maxRows=15",
        "sqlText": "SELECT film_id, title, rating, LEFT(description, 120) AS description_preview FROM film WHERE title LIKE CONCAT('%', $1, '%') OR description LIKE CONCAT('%', $1, '%') ORDER BY title LIMIT $2",
        "params": [
            {
                "placeholder": "$1",
                "index": 1,
                "name": "searchText",
                "propertyName": "searchText",
                "description": "search text (matched in title or description)",
                "example": "cat",
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

export const mcpServerName = "sakila-tools";
export const mcpServerVersion = "0.0.2";

import * as z from 'zod/v4';

const __core2aiPrimitiveUnion = z.union([z.string(), z.number(), z.boolean()]);

export const inputZodByTool = {
    "listFilms": z.object({ "limit": z.number().describe("max rows per page (SQL $1)"), "offset": z.number().describe("rows to skip (SQL $2)") }).strict(),
    "listActors": z.object({ "limit": z.number().describe("max rows per page (SQL $1)"), "offset": z.number().describe("rows to skip (SQL $2)") }).strict(),
    "listCategories": z.object({ "limit": z.number().describe("max rows per page (SQL $1)"), "offset": z.number().describe("rows to skip (SQL $2)") }).strict(),
    "filmsByRating": z.object({ "rating": z.string().describe("rating (G, PG, PG-13, R, or NC-17) (SQL $1)"), "maxRows": z.number().describe("max rows to return (SQL $2)") }).strict(),
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
            throw new Error(
                'Environment variable "' + authEnvName + '" is missing or empty (required by --auth-env).'
            );
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
                'Database URL from "' + connectionEnv + '" does not match generated database dialect "' + databaseDialect + '".'
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

function normalizeMysqlRows(rows) {
    return Array.isArray(rows) ? rows : [];
}

function normalizeMysqlParamValue(value) {
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

export async function invokeTool(toolName, options = {}, hostContext) {
    const connectionString = resolveConnectionString(hostContext);
    const client = await mysql.createConnection(connectionString);
    try {
        switch (toolName) {
        case "listFilms": {
            const [rows] = await client.query("SELECT * FROM film LIMIT ? OFFSET ?", [normalizeMysqlParamValue(options["limit"]), normalizeMysqlParamValue(options["offset"])]);
            const resultRows = normalizeMysqlRows(rows);
            return {
                rows: resultRows,
                rowCount: resultRows.length
            };
        }
        case "listActors": {
            const [rows] = await client.query("SELECT * FROM actor LIMIT ? OFFSET ?", [normalizeMysqlParamValue(options["limit"]), normalizeMysqlParamValue(options["offset"])]);
            const resultRows = normalizeMysqlRows(rows);
            return {
                rows: resultRows,
                rowCount: resultRows.length
            };
        }
        case "listCategories": {
            const [rows] = await client.query("SELECT * FROM category LIMIT ? OFFSET ?", [normalizeMysqlParamValue(options["limit"]), normalizeMysqlParamValue(options["offset"])]);
            const resultRows = normalizeMysqlRows(rows);
            return {
                rows: resultRows,
                rowCount: resultRows.length
            };
        }
        case "filmsByRating": {
            const [rows] = await client.query("SELECT film_id, title, rating FROM film WHERE rating = ? ORDER BY title LIMIT ?", [normalizeMysqlParamValue(options["rating"]), normalizeMysqlParamValue(options["maxRows"])]);
            const resultRows = normalizeMysqlRows(rows);
            return {
                rows: resultRows,
                rowCount: resultRows.length
            };
        }
        case "filmsWithActorLastName": {
            const [rows] = await client.query("SELECT a.first_name, a.last_name, f.title FROM actor a INNER JOIN film_actor fa ON a.actor_id = fa.actor_id INNER JOIN film f ON f.film_id = fa.film_id WHERE a.last_name LIKE CONCAT(?, '%') ORDER BY a.last_name, f.title LIMIT ?", [normalizeMysqlParamValue(options["lastNamePrefix"]), normalizeMysqlParamValue(options["maxRows"])]);
            const resultRows = normalizeMysqlRows(rows);
            return {
                rows: resultRows,
                rowCount: resultRows.length
            };
        }
        case "searchFilms": {
            const [rows] = await client.query("SELECT film_id, title, rating, LEFT(description, 120) AS description_preview FROM film WHERE title LIKE CONCAT('%', ?, '%') OR description LIKE CONCAT('%', ?, '%') ORDER BY title LIMIT ?", [normalizeMysqlParamValue(options["searchText"]), normalizeMysqlParamValue(options["searchText"]), normalizeMysqlParamValue(options["maxRows"])]);
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
