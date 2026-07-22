/**
 * Generated from: flight.db2ai
 */
import { loggingAdapter } from '../../../src/utils/logging-adapter.js';
import * as z from 'zod/v4';
import { initDatabase } from '../../../src/db/db2ai/flight-tools/initDatabase.js';

export const connectionEnv = undefined;

export const databaseDialect = 'duckdb';

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
    connectionString?: string;
    databaseDialect: 'postgres' | 'mysql' | 'mariadb' | 'sqlserver' | 'oracle' | 'duckdb';
    credential?: string;
};

export const generatedTools: GeneratedTool[] = [
    {
        kind: 'sql',
        toolName: 'listFlights',
        title: 'Flights matching origin city',
        description:
            'list flights from CSV-backed DuckDB view by origin city\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- city: origin city (type: string) (example: New York)\n- limit: max rows (type: integer) (example: 20)\n\nExample call: city=New York, limit=20',
        access: 'public',
        hasCheckToolAccess: false,
        hasPrepareToolCall: false,
        sqlText:
            '\n        SELECT\n            FlightDate,\n            UniqueCarrier,\n            OriginCityName,\n            DestCityName,\n            FlightNum\n        FROM\n            flights\n        WHERE\n            OriginCityName = $1\n        LIMIT\n            $2\n    ',
        params: [
            {
                placeholder: ':city',
                index: 1,
                name: 'city',
                propertyName: 'city',
                description: 'origin city',
                example: 'New York',
                jsonSchemaType: 'string'
            },
            {
                placeholder: ':limit',
                index: 2,
                name: 'limit',
                propertyName: 'limit',
                description: 'max rows',
                example: '20',
                jsonSchemaType: 'integer'
            }
        ]
    }
];

export const mcpServerName = 'flight-tools';
export const mcpServerVersion = '1.0.1';

export { mcpBuildGeneratedAt } from '../mcp-build-generated-at.js';

export const inputZodByTool = {
    listFlights: z
        .object({
            city: z.string().describe('origin city (SQL :city) (type: string) (example: New York)'),
            limit: z.number().int().describe('max rows (SQL :limit) (type: integer) (example: 20)')
        })
        .strict()
};

import { DuckDBConnection } from '@duckdb/node-api';

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
    void host;
    const connection = await DuckDBConnection.create();
    await initDatabase(connection);
    try {
        switch (toolName) {
            case 'listFlights': {
                const sqlText =
                    '\n        SELECT\n            FlightDate,\n            UniqueCarrier,\n            OriginCityName,\n            DestCityName,\n            FlightNum\n        FROM\n            flights\n        WHERE\n            OriginCityName = $1\n        LIMIT\n            $2\n    ';
                const sqlValues = [
                    options['city'] !== undefined && options['city'] !== null ? String(options['city']) : null,
                    normalizePostgresNumericParamValue(options['limit'])
                ];
                loggingAdapter.debug('executeSql', {
                    toolName: 'listFlights',
                    sql: compactSqlForLog(sqlText),
                    values: sqlValues
                });
                const reader = await connection.runAndReadAll(sqlText, sqlValues);
                const rows = reader.getRowObjectsJson();
                return {
                    rows,
                    rowCount: rows.length
                };
            }
            default:
                throw new Error('Unknown tool: ' + toolName);
        }
    } finally {
        connection.closeSync();
    }
}
