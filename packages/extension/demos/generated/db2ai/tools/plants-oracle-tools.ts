/**
 * Generated from: plants-oracle.db2ai
 */
import { loggingAdapter } from '../../../src/utils/logging-adapter.js';
import * as z from 'zod/v4';
import { prepareToolCallForListPlants } from '../../../src/hooks/db2ai/plants-oracle-tools/prepareToolCallForListPlants.js';
import { prepareToolCallForSearchPlants } from '../../../src/hooks/db2ai/plants-oracle-tools/prepareToolCallForSearchPlants.js';

export const connectionEnv = 'PLANTS_ORACLE_DATABASE_URL';

export const databaseDialect = 'oracle';

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
        toolName: 'listPlants',
        title: 'Paginated plant catalog',
        description:
            'list plants with common name, Latin name, and short English description\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- limit: max rows (type: integer) (example: 20)\n\nExample call: limit=20',
        access: 'public',
        hasCheckToolAccess: false,
        hasPrepareToolCall: true,
        sqlText:
            '\n        SELECT\n            plant_id,\n            common_name,\n            latin_name,\n            description\n        FROM plants\n        ORDER BY common_name\n        FETCH FIRST :limit ROWS ONLY\n    ',
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
        toolName: 'searchPlants',
        title: 'Name search in the plant catalog',
        description:
            'search plants by common or Latin name (substring match)\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- searchText: text matched in common or Latin name (type: string) (example: oak)\n- maxRows: max rows to return (type: integer) (example: 10)\n\nExample call: searchText=oak, maxRows=10',
        access: 'public',
        hasCheckToolAccess: false,
        hasPrepareToolCall: true,
        sqlText:
            "\n        SELECT\n            plant_id,\n            common_name,\n            latin_name,\n            description\n        FROM plants\n        WHERE\n            common_name LIKE '%' || :searchText || '%'\n            OR latin_name LIKE '%' || :searchText || '%'\n        ORDER BY common_name\n        FETCH FIRST :maxRows ROWS ONLY\n    ",
        params: [
            {
                placeholder: ':searchText',
                index: 1,
                name: 'searchText',
                propertyName: 'searchText',
                description: 'text matched in common or Latin name',
                example: 'oak',
                jsonSchemaType: 'string'
            },
            {
                placeholder: ':maxRows',
                index: 2,
                name: 'maxRows',
                propertyName: 'maxRows',
                description: 'max rows to return',
                example: '10',
                jsonSchemaType: 'integer'
            }
        ]
    },
    {
        kind: 'sql',
        toolName: 'createPlant',
        title: 'Add one plant to the catalog',
        description:
            'insert a new plant row into the catalog\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- commonName: English common name (type: string) (example: Mint)\n- latinName: Latin species name (type: string) (example: Mentha spicata)\n- aboutText: short English description (type: string) (example: Aromatic herb with serrated leaves, used fresh in drinks and cooking.)\n\nExample call: commonName=Mint, latinName=Mentha spicata, aboutText=Aromatic herb with serrated leaves, used fresh in drinks and cooking.',
        access: 'public',
        hasCheckToolAccess: false,
        hasPrepareToolCall: false,
        sqlText:
            '\n        INSERT INTO plants (common_name, latin_name, description)\n        VALUES (:commonName, :latinName, :aboutText)\n        RETURNING plant_id, common_name, latin_name, description\n    ',
        params: [
            {
                placeholder: ':commonName',
                index: 1,
                name: 'commonName',
                propertyName: 'commonName',
                description: 'English common name',
                example: 'Mint',
                jsonSchemaType: 'string'
            },
            {
                placeholder: ':latinName',
                index: 2,
                name: 'latinName',
                propertyName: 'latinName',
                description: 'Latin species name',
                example: 'Mentha spicata',
                jsonSchemaType: 'string'
            },
            {
                placeholder: ':aboutText',
                index: 3,
                name: 'aboutText',
                propertyName: 'aboutText',
                description: 'short English description',
                example: 'Aromatic herb with serrated leaves, used fresh in drinks and cooking.',
                jsonSchemaType: 'string'
            }
        ]
    },
    {
        kind: 'sql',
        toolName: 'updatePlant',
        title: 'Update one plant by id',
        description:
            'update an existing plant row in the catalog\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- commonName: English common name (type: string) (example: Mint)\n- latinName: Latin species name (type: string) (example: Mentha spicata)\n- aboutText: short English description (type: string) (example: Aromatic herb with serrated leaves, used fresh in drinks and cooking.)\n- plantId: plant id to update (type: integer) (example: 1)\n\nExample call: commonName=Mint, latinName=Mentha spicata, aboutText=Aromatic herb with serrated leaves, used fresh in drinks and cooking., plantId=1',
        access: 'public',
        hasCheckToolAccess: false,
        hasPrepareToolCall: false,
        sqlText:
            '\n        UPDATE plants\n        SET\n            common_name = :commonName,\n            latin_name = :latinName,\n            description = :aboutText\n        WHERE plant_id = :plantId\n        RETURNING plant_id, common_name, latin_name, description\n    ',
        params: [
            {
                placeholder: ':commonName',
                index: 1,
                name: 'commonName',
                propertyName: 'commonName',
                description: 'English common name',
                example: 'Mint',
                jsonSchemaType: 'string'
            },
            {
                placeholder: ':latinName',
                index: 2,
                name: 'latinName',
                propertyName: 'latinName',
                description: 'Latin species name',
                example: 'Mentha spicata',
                jsonSchemaType: 'string'
            },
            {
                placeholder: ':aboutText',
                index: 3,
                name: 'aboutText',
                propertyName: 'aboutText',
                description: 'short English description',
                example: 'Aromatic herb with serrated leaves, used fresh in drinks and cooking.',
                jsonSchemaType: 'string'
            },
            {
                placeholder: ':plantId',
                index: 4,
                name: 'plantId',
                propertyName: 'plantId',
                description: 'plant id to update',
                example: '1',
                jsonSchemaType: 'integer'
            }
        ]
    },
    {
        kind: 'sql',
        toolName: 'deletePlant',
        title: 'Remove one plant by id',
        description:
            'delete a plant row from the catalog by id\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- plantId: plant id to delete (type: integer) (example: 999)\n\nExample call: plantId=999',
        access: 'public',
        hasCheckToolAccess: false,
        hasPrepareToolCall: false,
        sqlText:
            '\n        DELETE FROM plants\n        WHERE plant_id = :plantId\n        RETURNING plant_id, common_name, latin_name, description\n    ',
        params: [
            {
                placeholder: ':plantId',
                index: 1,
                name: 'plantId',
                propertyName: 'plantId',
                description: 'plant id to delete',
                example: '999',
                jsonSchemaType: 'integer'
            }
        ]
    }
];

export const mcpServerName = 'plants-oracle-tools';
export const mcpServerVersion = '1.0.0';

export { mcpBuildGeneratedAt } from '../mcp-build-generated-at.js';

const prepareToolCallHooks: Record<
    string,
    (options: InvokeOptions, credential?: string) => InvokeOptions | Promise<InvokeOptions>
> = {
    listPlants: prepareToolCallForListPlants,
    searchPlants: prepareToolCallForSearchPlants
};

export const inputZodByTool = {
    listPlants: z
        .object({ limit: z.number().int().describe('max rows (SQL :limit) (type: integer) (example: 20)') })
        .strict(),
    searchPlants: z
        .object({
            searchText: z
                .string()
                .describe('text matched in common or Latin name (SQL :searchText) (type: string) (example: oak)'),
            maxRows: z.number().int().describe('max rows to return (SQL :maxRows) (type: integer) (example: 10)')
        })
        .strict(),
    createPlant: z
        .object({
            commonName: z.string().describe('English common name (SQL :commonName) (type: string) (example: Mint)'),
            latinName: z
                .string()
                .describe('Latin species name (SQL :latinName) (type: string) (example: Mentha spicata)'),
            aboutText: z
                .string()
                .describe(
                    'short English description (SQL :aboutText) (type: string) (example: Aromatic herb with serrated leaves, used fresh in drinks and cooking.)'
                )
        })
        .strict(),
    updatePlant: z
        .object({
            commonName: z.string().describe('English common name (SQL :commonName) (type: string) (example: Mint)'),
            latinName: z
                .string()
                .describe('Latin species name (SQL :latinName) (type: string) (example: Mentha spicata)'),
            aboutText: z
                .string()
                .describe(
                    'short English description (SQL :aboutText) (type: string) (example: Aromatic herb with serrated leaves, used fresh in drinks and cooking.)'
                ),
            plantId: z.number().int().describe('plant id to update (SQL :plantId) (type: integer) (example: 1)')
        })
        .strict(),
    deletePlant: z
        .object({
            plantId: z.number().int().describe('plant id to delete (SQL :plantId) (type: integer) (example: 999)')
        })
        .strict()
};

import oracledb from 'oracledb';

function resolveConnectionString(hostContext: DbHostContext): string {
    const cs = hostContext.connectionString?.trim();
    if (cs) {
        return cs;
    }
    throw new Error(
        'Missing database connection. MCP host must pass hostContext.connectionString (from database env in .db2ai).'
    );
}

function parseOracleConnectInput(connectionString: string): { user: string; password: string; connectString: string } {
    const trimmed = connectionString.trim();
    const asHttp = trimmed.replace(/^oracle:\/\//i, 'http://');
    const url = new URL(asHttp);
    const serviceName = url.pathname.replace(/^\//, '');
    if (serviceName.length === 0) {
        throw new Error(
            'Oracle connection URL must include a service name path (e.g. oracle://user:pass@host:1521/FREEPDB1).'
        );
    }
    const port = url.port.length > 0 ? url.port : '1521';
    return {
        user: decodeURIComponent(url.username),
        password: decodeURIComponent(url.password),
        connectString: `${url.hostname}:${port}/${serviceName}`
    };
}

function compactSqlForLog(sql: string): string {
    return sql.replace(/\s+/g, ' ').trim();
}

function normalizeOracleNumericParamValue(value: unknown): number | null {
    if (value === undefined || value === null) {
        return null;
    }
    const n = typeof value === 'number' ? value : Number(String(value));
    return Number.isFinite(n) ? n : null;
}

function rowsFromOracleDmlReturning(
    outBinds: Record<string, unknown[]> | undefined,
    columns: string[],
    bindNames: string[]
): Record<string, unknown>[] {
    if (!outBinds || columns.length === 0) {
        return [];
    }
    const row: Record<string, unknown> = {};
    for (let index = 0; index < columns.length; index++) {
        const values = outBinds[bindNames[index]];
        row[columns[index].toUpperCase()] = Array.isArray(values) && values.length > 0 ? values[0] : null;
    }
    return [row];
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
    const connection = await oracledb.getConnection(parseOracleConnectInput(connectionString));
    try {
        switch (toolName) {
            case 'listPlants': {
                const sqlText =
                    '\n        SELECT\n            plant_id,\n            common_name,\n            latin_name,\n            description\n        FROM plants\n        ORDER BY common_name\n        FETCH FIRST :limit ROWS ONLY\n    ';
                const binds = {
                    limit: normalizeOracleNumericParamValue(optionsResolved['limit'])
                };
                loggingAdapter.debug('executeSql', {
                    toolName: 'listPlants',
                    sql: compactSqlForLog(sqlText),
                    values: binds
                });
                const result = await connection.execute(sqlText, binds, {
                    outFormat: oracledb.OUT_FORMAT_OBJECT,
                    autoCommit: true
                });
                const resultRows = Array.isArray(result.rows) ? result.rows : [];
                return {
                    rows: resultRows,
                    rowCount: resultRows.length
                };
            }
            case 'searchPlants': {
                const sqlText =
                    "\n        SELECT\n            plant_id,\n            common_name,\n            latin_name,\n            description\n        FROM plants\n        WHERE\n            common_name LIKE '%' || :searchText || '%'\n            OR latin_name LIKE '%' || :searchText || '%'\n        ORDER BY common_name\n        FETCH FIRST :maxRows ROWS ONLY\n    ";
                const binds = {
                    searchText:
                        optionsResolved['searchText'] !== undefined && optionsResolved['searchText'] !== null
                            ? String(optionsResolved['searchText'])
                            : null,
                    maxRows: normalizeOracleNumericParamValue(optionsResolved['maxRows'])
                };
                loggingAdapter.debug('executeSql', {
                    toolName: 'searchPlants',
                    sql: compactSqlForLog(sqlText),
                    values: binds
                });
                const result = await connection.execute(sqlText, binds, {
                    outFormat: oracledb.OUT_FORMAT_OBJECT,
                    autoCommit: true
                });
                const resultRows = Array.isArray(result.rows) ? result.rows : [];
                return {
                    rows: resultRows,
                    rowCount: resultRows.length
                };
            }
            case 'createPlant': {
                const sqlText =
                    'INSERT INTO plants (common_name, latin_name, description)\n        VALUES (:commonName, :latinName, :aboutText) RETURNING plant_id, common_name, latin_name, description INTO :ret0, :ret1, :ret2, :ret3';
                const binds = {
                    commonName:
                        optionsResolved['commonName'] !== undefined && optionsResolved['commonName'] !== null
                            ? String(optionsResolved['commonName'])
                            : null,
                    latinName:
                        optionsResolved['latinName'] !== undefined && optionsResolved['latinName'] !== null
                            ? String(optionsResolved['latinName'])
                            : null,
                    aboutText:
                        optionsResolved['aboutText'] !== undefined && optionsResolved['aboutText'] !== null
                            ? String(optionsResolved['aboutText'])
                            : null,
                    ret0: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
                    ret1: { type: oracledb.STRING, dir: oracledb.BIND_OUT, maxSize: 4000 },
                    ret2: { type: oracledb.STRING, dir: oracledb.BIND_OUT, maxSize: 4000 },
                    ret3: { type: oracledb.STRING, dir: oracledb.BIND_OUT, maxSize: 4000 }
                };
                loggingAdapter.debug('executeSql', {
                    toolName: 'createPlant',
                    sql: compactSqlForLog(sqlText),
                    values: binds
                });
                const result = await connection.execute(sqlText, binds, {
                    outFormat: oracledb.OUT_FORMAT_OBJECT,
                    autoCommit: true
                });
                const resultRows = rowsFromOracleDmlReturning(
                    result.outBinds,
                    ['plant_id', 'common_name', 'latin_name', 'description'],
                    ['ret0', 'ret1', 'ret2', 'ret3']
                );
                return {
                    rows: resultRows,
                    rowCount: resultRows.length
                };
            }
            case 'updatePlant': {
                const sqlText =
                    'UPDATE plants\n        SET\n            common_name = :commonName,\n            latin_name = :latinName,\n            description = :aboutText\n        WHERE plant_id = :plantId RETURNING plant_id, common_name, latin_name, description INTO :ret0, :ret1, :ret2, :ret3';
                const binds = {
                    commonName:
                        optionsResolved['commonName'] !== undefined && optionsResolved['commonName'] !== null
                            ? String(optionsResolved['commonName'])
                            : null,
                    latinName:
                        optionsResolved['latinName'] !== undefined && optionsResolved['latinName'] !== null
                            ? String(optionsResolved['latinName'])
                            : null,
                    aboutText:
                        optionsResolved['aboutText'] !== undefined && optionsResolved['aboutText'] !== null
                            ? String(optionsResolved['aboutText'])
                            : null,
                    plantId: normalizeOracleNumericParamValue(optionsResolved['plantId']),
                    ret0: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
                    ret1: { type: oracledb.STRING, dir: oracledb.BIND_OUT, maxSize: 4000 },
                    ret2: { type: oracledb.STRING, dir: oracledb.BIND_OUT, maxSize: 4000 },
                    ret3: { type: oracledb.STRING, dir: oracledb.BIND_OUT, maxSize: 4000 }
                };
                loggingAdapter.debug('executeSql', {
                    toolName: 'updatePlant',
                    sql: compactSqlForLog(sqlText),
                    values: binds
                });
                const result = await connection.execute(sqlText, binds, {
                    outFormat: oracledb.OUT_FORMAT_OBJECT,
                    autoCommit: true
                });
                const resultRows = rowsFromOracleDmlReturning(
                    result.outBinds,
                    ['plant_id', 'common_name', 'latin_name', 'description'],
                    ['ret0', 'ret1', 'ret2', 'ret3']
                );
                return {
                    rows: resultRows,
                    rowCount: resultRows.length
                };
            }
            case 'deletePlant': {
                const sqlText =
                    'DELETE FROM plants\n        WHERE plant_id = :plantId RETURNING plant_id, common_name, latin_name, description INTO :ret0, :ret1, :ret2, :ret3';
                const binds = {
                    plantId: normalizeOracleNumericParamValue(optionsResolved['plantId']),
                    ret0: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
                    ret1: { type: oracledb.STRING, dir: oracledb.BIND_OUT, maxSize: 4000 },
                    ret2: { type: oracledb.STRING, dir: oracledb.BIND_OUT, maxSize: 4000 },
                    ret3: { type: oracledb.STRING, dir: oracledb.BIND_OUT, maxSize: 4000 }
                };
                loggingAdapter.debug('executeSql', {
                    toolName: 'deletePlant',
                    sql: compactSqlForLog(sqlText),
                    values: binds
                });
                const result = await connection.execute(sqlText, binds, {
                    outFormat: oracledb.OUT_FORMAT_OBJECT,
                    autoCommit: true
                });
                const resultRows = rowsFromOracleDmlReturning(
                    result.outBinds,
                    ['plant_id', 'common_name', 'latin_name', 'description'],
                    ['ret0', 'ret1', 'ret2', 'ret3']
                );
                return {
                    rows: resultRows,
                    rowCount: resultRows.length
                };
            }
            default:
                throw new Error('Unknown tool: ' + toolName);
        }
    } finally {
        await connection.close();
    }
}
