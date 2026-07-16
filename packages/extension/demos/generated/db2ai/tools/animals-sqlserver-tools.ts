/**
 * Generated from: animals-sqlserver.db2ai
 */
import { loggingAdapter } from '../../../src/utils/logging-adapter.js';
import * as z from 'zod/v4';
import { prepareToolCallForListAnimals } from '../../../src/hooks/db2ai/animals-sqlserver-tools/prepareToolCallForListAnimals.js';
import { prepareToolCallForSearchAnimals } from '../../../src/hooks/db2ai/animals-sqlserver-tools/prepareToolCallForSearchAnimals.js';

export const connectionEnv = 'ANIMALS_SQLSERVER_DATABASE_URL';

export const databaseDialect = 'sqlserver';

export const requiresAuth = false;

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
        toolName: 'listAnimals',
        title: 'Paginated animal catalog',
        description:
            'list animals with common name, Latin name, and short English description\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- limit: max rows (type: integer) (example: 20)\n\nExample call: limit=20',
        access: 'public',
        hasCheckToolAccess: false,
        hasPrepareToolCall: true,
        sqlText:
            '\n        SELECT TOP (@limit)\n            animal_id,\n            common_name,\n            latin_name,\n            description\n        FROM animals\n        ORDER BY common_name\n    ',
        params: [
            {
                placeholder: ':limit',
                index: 1,
                name: 'limit',
                propertyName: 'limit',
                description: 'max rows',
                example: '20',
                jsonSchemaType: 'integer'
            }
        ]
    },
    {
        kind: 'sql',
        toolName: 'searchAnimals',
        title: 'Name search in the animal catalog',
        description:
            'search animals by common or Latin name (substring match)\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- maxRows: max rows to return (type: integer) (example: 10)\n- searchText: text matched in common or Latin name (type: string) (example: fox)\n\nExample call: maxRows=10, searchText=fox',
        access: 'public',
        hasCheckToolAccess: false,
        hasPrepareToolCall: true,
        sqlText:
            "\n        SELECT TOP (@maxRows)\n            animal_id,\n            common_name,\n            latin_name,\n            description\n        FROM animals\n        WHERE\n            common_name LIKE '%' + @searchText + '%'\n            OR latin_name LIKE '%' + @searchText + '%'\n        ORDER BY common_name\n    ",
        params: [
            {
                placeholder: ':maxRows',
                index: 1,
                name: 'maxRows',
                propertyName: 'maxRows',
                description: 'max rows to return',
                example: '10',
                jsonSchemaType: 'integer'
            },
            {
                placeholder: ':searchText',
                index: 2,
                name: 'searchText',
                propertyName: 'searchText',
                description: 'text matched in common or Latin name',
                example: 'fox',
                jsonSchemaType: 'string'
            }
        ]
    },
    {
        kind: 'sql',
        toolName: 'createAnimal',
        title: 'Add one animal to the catalog',
        description:
            'insert a new animal row into the catalog\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- commonName: English common name (type: string) (example: European hedgehog)\n- latinName: Latin species name (type: string) (example: Erinaceus europaeus)\n- aboutText: short English description (type: string) (example: Small nocturnal insectivore with spines, common in gardens and hedgerows.)\n\nExample call: commonName=European hedgehog, latinName=Erinaceus europaeus, aboutText=Small nocturnal insectivore with spines, common in gardens and hedgerows.',
        access: 'public',
        hasCheckToolAccess: false,
        hasPrepareToolCall: false,
        sqlText:
            '\n        INSERT INTO animals (common_name, latin_name, description)\n        OUTPUT INSERTED.animal_id, INSERTED.common_name, INSERTED.latin_name, INSERTED.description\n        VALUES (@commonName, @latinName, @aboutText)\n    ',
        params: [
            {
                placeholder: ':commonName',
                index: 1,
                name: 'commonName',
                propertyName: 'commonName',
                description: 'English common name',
                example: 'European hedgehog',
                jsonSchemaType: 'string'
            },
            {
                placeholder: ':latinName',
                index: 2,
                name: 'latinName',
                propertyName: 'latinName',
                description: 'Latin species name',
                example: 'Erinaceus europaeus',
                jsonSchemaType: 'string'
            },
            {
                placeholder: ':aboutText',
                index: 3,
                name: 'aboutText',
                propertyName: 'aboutText',
                description: 'short English description',
                example: 'Small nocturnal insectivore with spines, common in gardens and hedgerows.',
                jsonSchemaType: 'string'
            }
        ]
    },
    {
        kind: 'sql',
        toolName: 'updateAnimal',
        title: 'Update one animal by id',
        description:
            'update an existing animal row in the catalog\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- commonName: English common name (type: string) (example: European hedgehog)\n- latinName: Latin species name (type: string) (example: Erinaceus europaeus)\n- aboutText: short English description (type: string) (example: Small nocturnal insectivore with spines, common in gardens and hedgerows.)\n- animalId: animal id to update (type: integer) (example: 1)\n\nExample call: commonName=European hedgehog, latinName=Erinaceus europaeus, aboutText=Small nocturnal insectivore with spines, common in gardens and hedgerows., animalId=1',
        access: 'public',
        hasCheckToolAccess: false,
        hasPrepareToolCall: false,
        sqlText:
            '\n        UPDATE animals\n        SET\n            common_name = @commonName,\n            latin_name = @latinName,\n            description = @aboutText\n        OUTPUT INSERTED.animal_id, INSERTED.common_name, INSERTED.latin_name, INSERTED.description\n        WHERE animal_id = @animalId\n    ',
        params: [
            {
                placeholder: ':commonName',
                index: 1,
                name: 'commonName',
                propertyName: 'commonName',
                description: 'English common name',
                example: 'European hedgehog',
                jsonSchemaType: 'string'
            },
            {
                placeholder: ':latinName',
                index: 2,
                name: 'latinName',
                propertyName: 'latinName',
                description: 'Latin species name',
                example: 'Erinaceus europaeus',
                jsonSchemaType: 'string'
            },
            {
                placeholder: ':aboutText',
                index: 3,
                name: 'aboutText',
                propertyName: 'aboutText',
                description: 'short English description',
                example: 'Small nocturnal insectivore with spines, common in gardens and hedgerows.',
                jsonSchemaType: 'string'
            },
            {
                placeholder: ':animalId',
                index: 4,
                name: 'animalId',
                propertyName: 'animalId',
                description: 'animal id to update',
                example: '1',
                jsonSchemaType: 'integer'
            }
        ]
    },
    {
        kind: 'sql',
        toolName: 'deleteAnimal',
        title: 'Remove one animal by id',
        description:
            'delete an animal row from the catalog by id\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- animalId: animal id to delete (type: integer) (example: 999)\n\nExample call: animalId=999',
        access: 'public',
        hasCheckToolAccess: false,
        hasPrepareToolCall: false,
        sqlText:
            '\n        DELETE FROM animals\n        OUTPUT DELETED.animal_id, DELETED.common_name, DELETED.latin_name, DELETED.description\n        WHERE animal_id = @animalId\n    ',
        params: [
            {
                placeholder: ':animalId',
                index: 1,
                name: 'animalId',
                propertyName: 'animalId',
                description: 'animal id to delete',
                example: '999',
                jsonSchemaType: 'integer'
            }
        ]
    }
];

export const mcpServerName = 'animals-sqlserver-tools';
export const mcpServerVersion = '1.0.0';

export { mcpBuildGeneratedAt } from '../mcp-build-generated-at.js';

const prepareToolCallHooks: Record<
    string,
    (options: InvokeOptions, credential?: string) => InvokeOptions | Promise<InvokeOptions>
> = {
    listAnimals: prepareToolCallForListAnimals,
    searchAnimals: prepareToolCallForSearchAnimals
};

export const inputZodByTool = {
    listAnimals: z
        .object({ limit: z.number().int().describe('max rows (SQL :limit) (type: integer) (example: 20)') })
        .strict(),
    searchAnimals: z
        .object({
            maxRows: z.number().int().describe('max rows to return (SQL :maxRows) (type: integer) (example: 10)'),
            searchText: z
                .string()
                .describe('text matched in common or Latin name (SQL :searchText) (type: string) (example: fox)')
        })
        .strict(),
    createAnimal: z
        .object({
            commonName: z
                .string()
                .describe('English common name (SQL :commonName) (type: string) (example: European hedgehog)'),
            latinName: z
                .string()
                .describe('Latin species name (SQL :latinName) (type: string) (example: Erinaceus europaeus)'),
            aboutText: z
                .string()
                .describe(
                    'short English description (SQL :aboutText) (type: string) (example: Small nocturnal insectivore with spines, common in gardens and hedgerows.)'
                )
        })
        .strict(),
    updateAnimal: z
        .object({
            commonName: z
                .string()
                .describe('English common name (SQL :commonName) (type: string) (example: European hedgehog)'),
            latinName: z
                .string()
                .describe('Latin species name (SQL :latinName) (type: string) (example: Erinaceus europaeus)'),
            aboutText: z
                .string()
                .describe(
                    'short English description (SQL :aboutText) (type: string) (example: Small nocturnal insectivore with spines, common in gardens and hedgerows.)'
                ),
            animalId: z.number().int().describe('animal id to update (SQL :animalId) (type: integer) (example: 1)')
        })
        .strict(),
    deleteAnimal: z
        .object({
            animalId: z.number().int().describe('animal id to delete (SQL :animalId) (type: integer) (example: 999)')
        })
        .strict()
};

import sql from 'mssql';

function resolveConnectionString(hostContext: DbHostContext): string {
    const cs = hostContext.connectionString?.trim();
    if (cs) {
        return cs;
    }
    throw new Error(
        'Missing database connection. MCP host must pass hostContext.connectionString (from database env in .db2ai).'
    );
}

function parseSqlserverConnectInput(connectionString: string): string | Record<string, unknown> {
    const trimmed = connectionString.trim();
    if (/^Server=/i.test(trimmed)) {
        return trimmed;
    }
    const asHttp = trimmed.replace(/^mssql:\/\//i, 'http://').replace(/^sqlserver:\/\//i, 'http://');
    const url = new URL(asHttp);
    const database = url.pathname.replace(/^\//, '');
    const encryptParam = url.searchParams.get('encrypt');
    const trustParam = url.searchParams.get('trustServerCertificate');
    return {
        server: url.hostname,
        port: url.port.length > 0 ? Number.parseInt(url.port, 10) : 1433,
        database: database.length > 0 ? database : undefined,
        user: decodeURIComponent(url.username),
        password: decodeURIComponent(url.password),
        options: {
            encrypt: encryptParam === 'false' ? false : true,
            trustServerCertificate: trustParam === 'true' || trustParam === '1'
        }
    };
}

function compactSqlForLog(sql: string): string {
    return sql.replace(/\s+/g, ' ').trim();
}

function normalizeSqlserverNumericParamValue(value: unknown): number | null {
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
    const pool = await sql.connect(parseSqlserverConnectInput(connectionString));
    try {
        switch (toolName) {
            case 'listAnimals': {
                const sqlText =
                    '\n        SELECT TOP (@limit)\n            animal_id,\n            common_name,\n            latin_name,\n            description\n        FROM animals\n        ORDER BY common_name\n    ';
                const request = pool.request();
                request.input('limit', sql.Int, normalizeSqlserverNumericParamValue(optionsResolved['limit']));
                loggingAdapter.debug('executeSql', {
                    toolName: 'listAnimals',
                    sql: compactSqlForLog(sqlText),
                    values: {
                        limit: optionsResolved['limit']
                    }
                });
                const result = await request.query(sqlText);
                const resultRows = Array.isArray(result.recordset) ? result.recordset : [];
                return {
                    rows: resultRows,
                    rowCount: resultRows.length
                };
            }
            case 'searchAnimals': {
                const sqlText =
                    "\n        SELECT TOP (@maxRows)\n            animal_id,\n            common_name,\n            latin_name,\n            description\n        FROM animals\n        WHERE\n            common_name LIKE '%' + @searchText + '%'\n            OR latin_name LIKE '%' + @searchText + '%'\n        ORDER BY common_name\n    ";
                const request = pool.request();
                request.input('maxRows', sql.Int, normalizeSqlserverNumericParamValue(optionsResolved['maxRows']));
                request.input(
                    'searchText',
                    sql.NVarChar(sql.MAX),
                    optionsResolved['searchText'] !== undefined && optionsResolved['searchText'] !== null
                        ? String(optionsResolved['searchText'])
                        : null
                );
                loggingAdapter.debug('executeSql', {
                    toolName: 'searchAnimals',
                    sql: compactSqlForLog(sqlText),
                    values: {
                        maxRows: optionsResolved['maxRows'],
                        searchText: optionsResolved['searchText']
                    }
                });
                const result = await request.query(sqlText);
                const resultRows = Array.isArray(result.recordset) ? result.recordset : [];
                return {
                    rows: resultRows,
                    rowCount: resultRows.length
                };
            }
            case 'createAnimal': {
                const sqlText =
                    '\n        INSERT INTO animals (common_name, latin_name, description)\n        OUTPUT INSERTED.animal_id, INSERTED.common_name, INSERTED.latin_name, INSERTED.description\n        VALUES (@commonName, @latinName, @aboutText)\n    ';
                const request = pool.request();
                request.input(
                    'commonName',
                    sql.NVarChar(sql.MAX),
                    optionsResolved['commonName'] !== undefined && optionsResolved['commonName'] !== null
                        ? String(optionsResolved['commonName'])
                        : null
                );
                request.input(
                    'latinName',
                    sql.NVarChar(sql.MAX),
                    optionsResolved['latinName'] !== undefined && optionsResolved['latinName'] !== null
                        ? String(optionsResolved['latinName'])
                        : null
                );
                request.input(
                    'aboutText',
                    sql.NVarChar(sql.MAX),
                    optionsResolved['aboutText'] !== undefined && optionsResolved['aboutText'] !== null
                        ? String(optionsResolved['aboutText'])
                        : null
                );
                loggingAdapter.debug('executeSql', {
                    toolName: 'createAnimal',
                    sql: compactSqlForLog(sqlText),
                    values: {
                        commonName: optionsResolved['commonName'],
                        latinName: optionsResolved['latinName'],
                        aboutText: optionsResolved['aboutText']
                    }
                });
                const result = await request.query(sqlText);
                const resultRows = Array.isArray(result.recordset) ? result.recordset : [];
                return {
                    rows: resultRows,
                    rowCount: resultRows.length
                };
            }
            case 'updateAnimal': {
                const sqlText =
                    '\n        UPDATE animals\n        SET\n            common_name = @commonName,\n            latin_name = @latinName,\n            description = @aboutText\n        OUTPUT INSERTED.animal_id, INSERTED.common_name, INSERTED.latin_name, INSERTED.description\n        WHERE animal_id = @animalId\n    ';
                const request = pool.request();
                request.input(
                    'commonName',
                    sql.NVarChar(sql.MAX),
                    optionsResolved['commonName'] !== undefined && optionsResolved['commonName'] !== null
                        ? String(optionsResolved['commonName'])
                        : null
                );
                request.input(
                    'latinName',
                    sql.NVarChar(sql.MAX),
                    optionsResolved['latinName'] !== undefined && optionsResolved['latinName'] !== null
                        ? String(optionsResolved['latinName'])
                        : null
                );
                request.input(
                    'aboutText',
                    sql.NVarChar(sql.MAX),
                    optionsResolved['aboutText'] !== undefined && optionsResolved['aboutText'] !== null
                        ? String(optionsResolved['aboutText'])
                        : null
                );
                request.input('animalId', sql.Int, normalizeSqlserverNumericParamValue(optionsResolved['animalId']));
                loggingAdapter.debug('executeSql', {
                    toolName: 'updateAnimal',
                    sql: compactSqlForLog(sqlText),
                    values: {
                        commonName: optionsResolved['commonName'],
                        latinName: optionsResolved['latinName'],
                        aboutText: optionsResolved['aboutText'],
                        animalId: optionsResolved['animalId']
                    }
                });
                const result = await request.query(sqlText);
                const resultRows = Array.isArray(result.recordset) ? result.recordset : [];
                return {
                    rows: resultRows,
                    rowCount: resultRows.length
                };
            }
            case 'deleteAnimal': {
                const sqlText =
                    '\n        DELETE FROM animals\n        OUTPUT DELETED.animal_id, DELETED.common_name, DELETED.latin_name, DELETED.description\n        WHERE animal_id = @animalId\n    ';
                const request = pool.request();
                request.input('animalId', sql.Int, normalizeSqlserverNumericParamValue(optionsResolved['animalId']));
                loggingAdapter.debug('executeSql', {
                    toolName: 'deleteAnimal',
                    sql: compactSqlForLog(sqlText),
                    values: {
                        animalId: optionsResolved['animalId']
                    }
                });
                const result = await request.query(sqlText);
                const resultRows = Array.isArray(result.recordset) ? result.recordset : [];
                return {
                    rows: resultRows,
                    rowCount: resultRows.length
                };
            }
            default:
                throw new Error('Unknown tool: ' + toolName);
        }
    } finally {
        await pool.close();
    }
}
