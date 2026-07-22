/**
 * Generated from: pagila-postgresql.db2ai
 */
import { loggingAdapter } from '@toolfactory.dev/core/logging';
import * as z from 'zod/v4';
import { verifyCredential } from '../../../src/hooks/db2ai/pagila-postgresql-tools/verifyPagilaPostgresqlCredential.js';
import { prepareToolCallForListFilms } from '../../../src/hooks/db2ai/pagila-postgresql-tools/prepareToolCallForListFilms.js';
import { prepareToolCallForListActors } from '../../../src/hooks/db2ai/pagila-postgresql-tools/prepareToolCallForListActors.js';
import { prepareToolCallForListCustomers } from '../../../src/hooks/db2ai/pagila-postgresql-tools/prepareToolCallForListCustomers.js';
import { prepareToolCallForListCategories } from '../../../src/hooks/db2ai/pagila-postgresql-tools/prepareToolCallForListCategories.js';
import { prepareToolCallForListCountries } from '../../../src/hooks/db2ai/pagila-postgresql-tools/prepareToolCallForListCountries.js';
import { prepareToolCallForListInventory } from '../../../src/hooks/db2ai/pagila-postgresql-tools/prepareToolCallForListInventory.js';
import { prepareToolCallForFilmsByMpaaRating } from '../../../src/hooks/db2ai/pagila-postgresql-tools/prepareToolCallForFilmsByMpaaRating.js';
import { prepareToolCallForFilmsWithActorLastName } from '../../../src/hooks/db2ai/pagila-postgresql-tools/prepareToolCallForFilmsWithActorLastName.js';
import { prepareToolCallForSearchFilms } from '../../../src/hooks/db2ai/pagila-postgresql-tools/prepareToolCallForSearchFilms.js';

export const connectionEnv = 'PAGILA_POSTGRESQL_DATABASE_URL';

export const databaseDialect = 'postgres';

export const requiresAuth = true;

export { verifyCredential } from '../../../src/hooks/db2ai/pagila-postgresql-tools/verifyPagilaPostgresqlCredential.js';

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
        title: 'Paginated film rows',
        description:
            'list films from Pagila with pagination\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- limit: max rows per page (type: integer) (example: 100)\n- offset: rows to skip (type: integer) (example: 0)\n\nExample call: limit=100, offset=0\n\nResponse:\nObject with rows (film table columns from SELECT *) and rowCount.\n        Use rowCount for pagination; limit is capped at 100 in SQL.',
        access: 'protected',
        hasCheckToolAccess: false,
        hasPrepareToolCall: true,
        sqlText: 'SELECT * FROM film LIMIT LEAST($1, 100) OFFSET $2',
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
            'List actors from Pagila with pagination.\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- limit: Max rows per page.\n                SQL caps at 100 via LEAST(:limit, 100). (type: integer) (example: 100)\n- offset: rows to skip (type: integer) (example: 0)\n\nExample call: limit=100, offset=0\n\nResponse:\nObject with rows (actor table columns from SELECT *) and rowCount.\n        Use rowCount for pagination; limit is capped at 100 in SQL.',
        access: 'protected',
        hasCheckToolAccess: false,
        hasPrepareToolCall: true,
        sqlText: 'SELECT * FROM actor LIMIT LEAST($1, 100) OFFSET $2',
        params: [
            {
                placeholder: ':limit',
                index: 1,
                name: 'limit',
                propertyName: 'limit',
                description:
                    '\n                Max rows per page.\n                SQL caps at 100 via LEAST(:limit, 100).\n            ',
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
            'list customers with pagination\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- limit: max rows per page (type: integer) (example: 10)\n- offset: rows to skip (type: integer) (example: 0)\n\nExample call: limit=10, offset=0\n\nResponse:\nObject with rows (customer table columns from SELECT *) and rowCount.\n        Use rowCount for pagination; limit is capped at 100 in SQL.',
        access: 'protected',
        hasCheckToolAccess: false,
        hasPrepareToolCall: true,
        sqlText: 'SELECT * FROM customer LIMIT LEAST($1, 100) OFFSET $2',
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
            'list categories with pagination\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- limit: max rows per page (type: integer) (example: 100)\n- offset: rows to skip (type: integer) (example: 0)\n\nExample call: limit=100, offset=0\n\nResponse:\nObject with rows (category_id, name, last_update) and rowCount.\n        Use rowCount for pagination; limit is capped at 100 in SQL.',
        access: 'protected',
        hasCheckToolAccess: false,
        hasPrepareToolCall: true,
        sqlText: 'SELECT * FROM category LIMIT LEAST($1, 100) OFFSET $2',
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
            'list countries with pagination\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- limit: max rows per page (type: integer) (example: 100)\n- offset: rows to skip (type: integer) (example: 0)\n\nExample call: limit=100, offset=0\n\nResponse:\nObject with rows (country_id, country, last_update) and rowCount.\n        Use rowCount for pagination; limit is capped at 100 in SQL.',
        access: 'protected',
        hasCheckToolAccess: false,
        hasPrepareToolCall: true,
        sqlText: 'SELECT * FROM country LIMIT LEAST($1, 100) OFFSET $2',
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
            'list inventory with pagination\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- limit: max rows per page (type: integer) (example: 100)\n- offset: rows to skip (type: integer) (example: 0)\n\nExample call: limit=100, offset=0\n\nResponse:\nObject with rows (inventory table columns from SELECT *) and rowCount.\n        Use rowCount for pagination; limit is capped at 100 in SQL.',
        access: 'protected',
        hasCheckToolAccess: false,
        hasPrepareToolCall: true,
        sqlText:
            '\n        SELECT\n            *\n        FROM\n            inventory\n        LIMIT\n            LEAST($1, 100)\n        OFFSET\n            $2\n    ',
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
            'List films with a given MPAA age rating.\n        Valid ratings: G, PG, PG-13, R, NC-17.\n        Results ordered by title.\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- rating: MPAA rating (G, PG, PG-13, R, or NC-17) (type: string) (example: PG-13)\n- maxRows: max rows to return (type: integer) (example: 20)\n\nExample call: rating=PG-13, maxRows=20\n\nResponse:\nObject with rows { film_id, title, rating } and rowCount.\n        Ordered by title; rowCount 0 when no films match the given MPAA rating.',
        access: 'protected',
        hasCheckToolAccess: false,
        hasPrepareToolCall: true,
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
            'which films feature actors whose last name starts with a given prefix\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- lastNamePrefix: Actor last name prefix (case-insensitive).\n                Examples: GAR, BER, HOP — matches last names starting with the prefix. (type: string) (example: GAR)\n- maxRows: max rows to return (type: integer) (example: 25)\n\nExample call: lastNamePrefix=GAR, maxRows=25\n\nResponse:\nObject with rows { first_name, last_name, title } and rowCount.\n        One row per actor–film pair; ordered by last name, then title.',
        access: 'protected',
        hasCheckToolAccess: false,
        hasPrepareToolCall: true,
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
            'Search films by free text in title or description.\n        Case-insensitive substring match (PostgreSQL ILIKE).\n        Useful for demo queries such as dog, cat, or grace.\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- searchText: search text (matched in title or description) (type: string) (example: dog)\n- maxRows: max rows to return (type: integer) (example: 15)\n\nExample call: searchText=dog, maxRows=15\n\nResponse:\nObject with rows { film_id, title, rating, description_preview } and rowCount.\n        description_preview is the first 120 characters of description; case-insensitive match in title or description.',
        access: 'protected',
        hasCheckToolAccess: false,
        hasPrepareToolCall: true,
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
    },
    {
        kind: 'sql',
        toolName: 'createActor',
        title: 'Create actor with first and last name',
        description:
            'Insert a new actor into Pagila.\n        Sets last_update to the current time.\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- firstName: actor first name (type: string) (example: MARY)\n- lastName: actor last name (type: string) (example: SMITH)\n\nExample call: firstName=MARY, lastName=SMITH\n\nResponse:\nObject with one row in rows { actor_id, first_name, last_name, last_update } and rowCount 1.\n        actor_id is the new primary key assigned by the database.',
        access: 'protected',
        hasCheckToolAccess: false,
        hasPrepareToolCall: false,
        sqlText:
            'INSERT INTO actor (first_name, last_name, last_update) VALUES ($1, $2, NOW()) RETURNING actor_id, first_name, last_name, last_update',
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
    },
    {
        kind: 'sql',
        toolName: 'updateActor',
        title: 'Update actor by id',
        description:
            "Update an actor's first and last name.\n        Sets last_update to the current time.\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- firstName: new first name (type: string) (example: MARY)\n- lastName: new last name (type: string) (example: JONES)\n- actorId: actor id to update (type: integer) (example: 1)\n\nExample call: firstName=MARY, lastName=JONES, actorId=1\n\nResponse:\nObject with one row in rows { actor_id, first_name, last_name, last_update } and rowCount 1 when actor_id exists.\n        rowCount 0 when no row matched actor_id.",
        access: 'protected',
        hasCheckToolAccess: false,
        hasPrepareToolCall: false,
        sqlText:
            'UPDATE actor SET first_name = $1, last_name = $2, last_update = NOW() WHERE actor_id = $3 RETURNING actor_id, first_name, last_name, last_update',
        params: [
            {
                placeholder: ':firstName',
                index: 1,
                name: 'firstName',
                propertyName: 'firstName',
                description: 'new first name',
                example: 'MARY',
                jsonSchemaType: 'string'
            },
            {
                placeholder: ':lastName',
                index: 2,
                name: 'lastName',
                propertyName: 'lastName',
                description: 'new last name',
                example: 'JONES',
                jsonSchemaType: 'string'
            },
            {
                placeholder: ':actorId',
                index: 3,
                name: 'actorId',
                propertyName: 'actorId',
                description: 'actor id to update',
                example: '1',
                jsonSchemaType: 'integer'
            }
        ]
    },
    {
        kind: 'sql',
        toolName: 'deleteActor',
        title: 'Delete actor by id',
        description:
            'Delete an actor by id.\n        Fails if the actor is referenced by film_actor (foreign key).\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- actorId: actor id to delete (type: integer) (example: 999)\n\nExample call: actorId=999\n\nResponse:\nObject with one row in rows { actor_id, first_name, last_name, last_update } and rowCount 1 when deleted.\n        rowCount 0 when actor_id was not found.\n        Fails if the actor is referenced by film_actor (foreign key constraint).',
        access: 'protected',
        hasCheckToolAccess: false,
        hasPrepareToolCall: false,
        sqlText: 'DELETE FROM actor WHERE actor_id = $1 RETURNING actor_id, first_name, last_name, last_update',
        params: [
            {
                placeholder: ':actorId',
                index: 1,
                name: 'actorId',
                propertyName: 'actorId',
                description: 'actor id to delete',
                example: '999',
                jsonSchemaType: 'integer'
            }
        ]
    }
];

export const mcpServerName = 'pagila-postgresql-tools';
export const mcpServerVersion = '1.0.1';

export { mcpBuildGeneratedAt } from '../mcp-build-generated-at.js';

const prepareToolCallHooks: Record<
    string,
    (options: InvokeOptions, credential?: string) => InvokeOptions | Promise<InvokeOptions>
> = {
    listFilms: (options, credential) => prepareToolCallForListFilms(options, credential!),
    listActors: (options, credential) => prepareToolCallForListActors(options, credential!),
    listCustomers: (options, credential) => prepareToolCallForListCustomers(options, credential!),
    listCategories: (options, credential) => prepareToolCallForListCategories(options, credential!),
    listCountries: (options, credential) => prepareToolCallForListCountries(options, credential!),
    listInventory: (options, credential) => prepareToolCallForListInventory(options, credential!),
    filmsByMpaaRating: (options, credential) => prepareToolCallForFilmsByMpaaRating(options, credential!),
    filmsWithActorLastName: (options, credential) => prepareToolCallForFilmsWithActorLastName(options, credential!),
    searchFilms: (options, credential) => prepareToolCallForSearchFilms(options, credential!)
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
            limit: z
                .number()
                .int()
                .describe(
                    'Max rows per page.\n                SQL caps at 100 via LEAST(:limit, 100).\n             (SQL :limit) (type: integer) (example: 100)'
                ),
            offset: z.number().int().describe('rows to skip (SQL :offset) (type: integer) (example: 0)')
        })
        .strict(),
    listCustomers: z
        .object({
            limit: z.number().int().describe('max rows per page (SQL :limit) (type: integer) (example: 10)'),
            offset: z.number().int().describe('rows to skip (SQL :offset) (type: integer) (example: 0)')
        })
        .strict(),
    listCategories: z
        .object({
            limit: z.number().int().describe('max rows per page (SQL :limit) (type: integer) (example: 100)'),
            offset: z.number().int().describe('rows to skip (SQL :offset) (type: integer) (example: 0)')
        })
        .strict(),
    listCountries: z
        .object({
            limit: z.number().int().describe('max rows per page (SQL :limit) (type: integer) (example: 100)'),
            offset: z.number().int().describe('rows to skip (SQL :offset) (type: integer) (example: 0)')
        })
        .strict(),
    listInventory: z
        .object({
            limit: z.number().int().describe('max rows per page (SQL :limit) (type: integer) (example: 100)'),
            offset: z.number().int().describe('rows to skip (SQL :offset) (type: integer) (example: 0)')
        })
        .strict(),
    filmsByMpaaRating: z
        .object({
            rating: z
                .string()
                .describe('MPAA rating (G, PG, PG-13, R, or NC-17) (SQL :rating) (type: string) (example: PG-13)'),
            maxRows: z.number().int().describe('max rows to return (SQL :maxRows) (type: integer) (example: 20)')
        })
        .strict(),
    filmsWithActorLastName: z
        .object({
            lastNamePrefix: z
                .string()
                .describe(
                    'Actor last name prefix (case-insensitive).\n                Examples: GAR, BER, HOP — matches last names starting with the prefix.\n             (SQL :lastNamePrefix) (type: string) (example: GAR)'
                ),
            maxRows: z.number().int().describe('max rows to return (SQL :maxRows) (type: integer) (example: 25)')
        })
        .strict(),
    searchFilms: z
        .object({
            searchText: z
                .string()
                .describe(
                    'search text (matched in title or description) (SQL :searchText) (type: string) (example: dog)'
                ),
            maxRows: z.number().int().describe('max rows to return (SQL :maxRows) (type: integer) (example: 15)')
        })
        .strict(),
    createActor: z
        .object({
            firstName: z.string().describe('actor first name (SQL :firstName) (type: string) (example: MARY)'),
            lastName: z.string().describe('actor last name (SQL :lastName) (type: string) (example: SMITH)')
        })
        .strict(),
    updateActor: z
        .object({
            firstName: z.string().describe('new first name (SQL :firstName) (type: string) (example: MARY)'),
            lastName: z.string().describe('new last name (SQL :lastName) (type: string) (example: JONES)'),
            actorId: z.number().int().describe('actor id to update (SQL :actorId) (type: integer) (example: 1)')
        })
        .strict(),
    deleteActor: z
        .object({
            actorId: z.number().int().describe('actor id to delete (SQL :actorId) (type: integer) (example: 999)')
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
    const connectionString = resolveConnectionString(host);
    const client = new Client({ connectionString });
    await client.connect();
    try {
        switch (toolName) {
            case 'listFilms': {
                const sqlText = 'SELECT * FROM film LIMIT LEAST($1, 100) OFFSET $2';
                const sqlValues = [
                    normalizePostgresNumericParamValue(optionsResolved['limit']),
                    normalizePostgresNumericParamValue(optionsResolved['offset'])
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
                const sqlText = 'SELECT * FROM actor LIMIT LEAST($1, 100) OFFSET $2';
                const sqlValues = [
                    normalizePostgresNumericParamValue(optionsResolved['limit']),
                    normalizePostgresNumericParamValue(optionsResolved['offset'])
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
                const sqlText = 'SELECT * FROM customer LIMIT LEAST($1, 100) OFFSET $2';
                const sqlValues = [
                    normalizePostgresNumericParamValue(optionsResolved['limit']),
                    normalizePostgresNumericParamValue(optionsResolved['offset'])
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
                const sqlText = 'SELECT * FROM category LIMIT LEAST($1, 100) OFFSET $2';
                const sqlValues = [
                    normalizePostgresNumericParamValue(optionsResolved['limit']),
                    normalizePostgresNumericParamValue(optionsResolved['offset'])
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
                const sqlText = 'SELECT * FROM country LIMIT LEAST($1, 100) OFFSET $2';
                const sqlValues = [
                    normalizePostgresNumericParamValue(optionsResolved['limit']),
                    normalizePostgresNumericParamValue(optionsResolved['offset'])
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
                    '\n        SELECT\n            *\n        FROM\n            inventory\n        LIMIT\n            LEAST($1, 100)\n        OFFSET\n            $2\n    ';
                const sqlValues = [
                    normalizePostgresNumericParamValue(optionsResolved['limit']),
                    normalizePostgresNumericParamValue(optionsResolved['offset'])
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
                    optionsResolved['rating'] !== undefined && optionsResolved['rating'] !== null
                        ? String(optionsResolved['rating'])
                        : null,
                    normalizePostgresNumericParamValue(optionsResolved['maxRows'])
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
                    optionsResolved['lastNamePrefix'] !== undefined && optionsResolved['lastNamePrefix'] !== null
                        ? String(optionsResolved['lastNamePrefix'])
                        : null,
                    normalizePostgresNumericParamValue(optionsResolved['maxRows'])
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
                    optionsResolved['searchText'] !== undefined && optionsResolved['searchText'] !== null
                        ? String(optionsResolved['searchText'])
                        : null,
                    normalizePostgresNumericParamValue(optionsResolved['maxRows'])
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
            case 'createActor': {
                const sqlText =
                    'INSERT INTO actor (first_name, last_name, last_update) VALUES ($1, $2, NOW()) RETURNING actor_id, first_name, last_name, last_update';
                const sqlValues = [
                    optionsResolved['firstName'] !== undefined && optionsResolved['firstName'] !== null
                        ? String(optionsResolved['firstName'])
                        : null,
                    optionsResolved['lastName'] !== undefined && optionsResolved['lastName'] !== null
                        ? String(optionsResolved['lastName'])
                        : null
                ];
                loggingAdapter.debug('executeSql', {
                    toolName: 'createActor',
                    sql: compactSqlForLog(sqlText),
                    values: sqlValues
                });
                const result = await client.query({ text: sqlText, values: sqlValues });
                return {
                    rows: result.rows,
                    rowCount: result.rowCount ?? result.rows.length
                };
            }
            case 'updateActor': {
                const sqlText =
                    'UPDATE actor SET first_name = $1, last_name = $2, last_update = NOW() WHERE actor_id = $3 RETURNING actor_id, first_name, last_name, last_update';
                const sqlValues = [
                    optionsResolved['firstName'] !== undefined && optionsResolved['firstName'] !== null
                        ? String(optionsResolved['firstName'])
                        : null,
                    optionsResolved['lastName'] !== undefined && optionsResolved['lastName'] !== null
                        ? String(optionsResolved['lastName'])
                        : null,
                    normalizePostgresNumericParamValue(optionsResolved['actorId'])
                ];
                loggingAdapter.debug('executeSql', {
                    toolName: 'updateActor',
                    sql: compactSqlForLog(sqlText),
                    values: sqlValues
                });
                const result = await client.query({ text: sqlText, values: sqlValues });
                return {
                    rows: result.rows,
                    rowCount: result.rowCount ?? result.rows.length
                };
            }
            case 'deleteActor': {
                const sqlText =
                    'DELETE FROM actor WHERE actor_id = $1 RETURNING actor_id, first_name, last_name, last_update';
                const sqlValues = [normalizePostgresNumericParamValue(optionsResolved['actorId'])];
                loggingAdapter.debug('executeSql', {
                    toolName: 'deleteActor',
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
