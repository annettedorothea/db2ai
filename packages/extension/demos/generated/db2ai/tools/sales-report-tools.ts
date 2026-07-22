/**
 * Generated from: sales-report.db2ai
 */
import { loggingAdapter } from '../../../src/utils/logging-adapter.js';
import * as z from 'zod/v4';
import { initDatabase } from '../../../src/db/db2ai/sales-report-tools/initDatabase.js';

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
        toolName: 'listSalesByRegion',
        title: 'Sales lines for a region',
        description:
            'list cleaned sales lines from the messy Excel Umsatz sheet filtered by region\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- region: sales region (Nord, West, Süd, Ost) (type: string) (example: Nord)\n- limit: max rows (type: integer) (example: 20)\n\nExample call: region=Nord, limit=20',
        access: 'public',
        hasCheckToolAccess: false,
        hasPrepareToolCall: false,
        sqlText:
            '\n        SELECT\n            customer_id,\n            customer_name,\n            region,\n            product_group,\n            net_eur,\n            document_date\n        FROM\n            sales_lines\n        WHERE\n            region = $1\n        ORDER BY\n            document_date,\n            customer_id\n        LIMIT\n            $2\n    ',
        params: [
            {
                placeholder: ':region',
                index: 1,
                name: 'region',
                propertyName: 'region',
                description: 'sales region (Nord, West, Süd, Ost)',
                example: 'Nord',
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
    },
    {
        kind: 'sql',
        toolName: 'listSalesByProductGroup',
        title: 'Sales lines for a product group',
        description:
            'list cleaned sales lines filtered by Warengruppe / product group\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- productGroup: Warengruppe (Maschinen, Ersatzteile, Software, Schulung, Sensorik, Dienstleistung) (type: string) (example: Maschinen)\n- limit: max rows (type: integer) (example: 20)\n\nExample call: productGroup=Maschinen, limit=20',
        access: 'public',
        hasCheckToolAccess: false,
        hasPrepareToolCall: false,
        sqlText:
            '\n        SELECT\n            customer_id,\n            customer_name,\n            region,\n            product_group,\n            net_eur,\n            document_date\n        FROM\n            sales_lines\n        WHERE\n            product_group = $1\n        ORDER BY\n            document_date,\n            customer_id\n        LIMIT\n            $2\n    ',
        params: [
            {
                placeholder: ':productGroup',
                index: 1,
                name: 'productGroup',
                propertyName: 'productGroup',
                description: 'Warengruppe (Maschinen, Ersatzteile, Software, Schulung, Sensorik, Dienstleistung)',
                example: 'Maschinen',
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
    },
    {
        kind: 'sql',
        toolName: 'summarizeSalesByRegion',
        title: 'Net sales totals by region',
        description:
            'sum net sales and line counts by region from the cleaned Excel Umsatz view\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).',
        access: 'public',
        hasCheckToolAccess: false,
        hasPrepareToolCall: false,
        sqlText:
            '\n        SELECT\n            region,\n            COUNT(*) AS line_count,\n            COUNT(DISTINCT customer_id) AS customer_count,\n            ROUND(SUM(net_eur), 2) AS net_eur_total\n        FROM\n            sales_lines\n        GROUP BY\n            region\n        ORDER BY\n            net_eur_total DESC\n    ',
        params: []
    },
    {
        kind: 'sql',
        toolName: 'summarizeSalesByProductGroup',
        title: 'Net sales totals by product group',
        description:
            'sum net sales and line counts by Warengruppe / product group from the cleaned Excel Umsatz view\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).',
        access: 'public',
        hasCheckToolAccess: false,
        hasPrepareToolCall: false,
        sqlText:
            '\n        SELECT\n            product_group,\n            COUNT(*) AS line_count,\n            COUNT(DISTINCT customer_id) AS customer_count,\n            ROUND(SUM(net_eur), 2) AS net_eur_total\n        FROM\n            sales_lines\n        GROUP BY\n            product_group\n        ORDER BY\n            net_eur_total DESC\n    ',
        params: []
    },
    {
        kind: 'sql',
        toolName: 'summarizeSalesByRegionAndProductGroup',
        title: 'Net sales by region and product group',
        description:
            'cross-tab net sales by region and Warengruppe for regional product mix analysis\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).',
        access: 'public',
        hasCheckToolAccess: false,
        hasPrepareToolCall: false,
        sqlText:
            '\n        SELECT\n            region,\n            product_group,\n            COUNT(*) AS line_count,\n            ROUND(SUM(net_eur), 2) AS net_eur_total\n        FROM\n            sales_lines\n        GROUP BY\n            region,\n            product_group\n        ORDER BY\n            region,\n            net_eur_total DESC\n    ',
        params: []
    },
    {
        kind: 'sql',
        toolName: 'summarizeSalesBySegment',
        title: 'Net sales totals by customer segment',
        description:
            'sum net sales by customer segment using Excel sales lines joined to Kunden stamm\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).',
        access: 'public',
        hasCheckToolAccess: false,
        hasPrepareToolCall: false,
        sqlText:
            '\n        SELECT\n            c.segment,\n            COUNT(*) AS line_count,\n            ROUND(SUM(s.net_eur), 2) AS net_eur_total\n        FROM\n            sales_lines s\n            INNER JOIN customers c ON c.customer_id = s.customer_id\n        GROUP BY\n            c.segment\n        ORDER BY\n            net_eur_total DESC\n    ',
        params: []
    },
    {
        kind: 'sql',
        toolName: 'topCustomersByRevenue',
        title: 'Top customers by revenue',
        description:
            'rank customers by total net revenue from the cleaned Excel sales view\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- limit: max customers (type: integer) (example: 5)\n\nExample call: limit=5',
        access: 'public',
        hasCheckToolAccess: false,
        hasPrepareToolCall: false,
        sqlText:
            '\n        SELECT\n            s.customer_id,\n            s.customer_name,\n            c.city,\n            c.segment,\n            ROUND(SUM(s.net_eur), 2) AS net_eur_total\n        FROM\n            sales_lines s\n            INNER JOIN customers c ON c.customer_id = s.customer_id\n        GROUP BY\n            s.customer_id,\n            s.customer_name,\n            c.city,\n            c.segment\n        ORDER BY\n            net_eur_total DESC\n        LIMIT\n            $1\n    ',
        params: [
            {
                placeholder: ':limit',
                index: 1,
                name: 'limit',
                propertyName: 'limit',
                description: 'max customers',
                example: '5',
                jsonSchemaType: 'integer'
            }
        ]
    }
];

export const mcpServerName = 'sales-report-tools';
export const mcpServerVersion = '1.0.1';

export { mcpBuildGeneratedAt } from '../mcp-build-generated-at.js';

export const inputZodByTool = {
    listSalesByRegion: z
        .object({
            region: z
                .string()
                .describe('sales region (Nord, West, Süd, Ost) (SQL :region) (type: string) (example: Nord)'),
            limit: z.number().int().describe('max rows (SQL :limit) (type: integer) (example: 20)')
        })
        .strict(),
    listSalesByProductGroup: z
        .object({
            productGroup: z
                .string()
                .describe(
                    'Warengruppe (Maschinen, Ersatzteile, Software, Schulung, Sensorik, Dienstleistung) (SQL :productGroup) (type: string) (example: Maschinen)'
                ),
            limit: z.number().int().describe('max rows (SQL :limit) (type: integer) (example: 20)')
        })
        .strict(),
    summarizeSalesByRegion: z.object({}).strict(),
    summarizeSalesByProductGroup: z.object({}).strict(),
    summarizeSalesByRegionAndProductGroup: z.object({}).strict(),
    summarizeSalesBySegment: z.object({}).strict(),
    topCustomersByRevenue: z
        .object({ limit: z.number().int().describe('max customers (SQL :limit) (type: integer) (example: 5)') })
        .strict()
};

import { DuckDBConnection, type DuckDBValue } from '@duckdb/node-api';

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
            case 'listSalesByRegion': {
                const sqlText =
                    '\n        SELECT\n            customer_id,\n            customer_name,\n            region,\n            product_group,\n            net_eur,\n            document_date\n        FROM\n            sales_lines\n        WHERE\n            region = $1\n        ORDER BY\n            document_date,\n            customer_id\n        LIMIT\n            $2\n    ';
                const sqlValues: DuckDBValue[] = [
                    options['region'] !== undefined && options['region'] !== null ? String(options['region']) : null,
                    normalizePostgresNumericParamValue(options['limit'])
                ];
                loggingAdapter.debug('executeSql', {
                    toolName: 'listSalesByRegion',
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
            case 'listSalesByProductGroup': {
                const sqlText =
                    '\n        SELECT\n            customer_id,\n            customer_name,\n            region,\n            product_group,\n            net_eur,\n            document_date\n        FROM\n            sales_lines\n        WHERE\n            product_group = $1\n        ORDER BY\n            document_date,\n            customer_id\n        LIMIT\n            $2\n    ';
                const sqlValues: DuckDBValue[] = [
                    options['productGroup'] !== undefined && options['productGroup'] !== null
                        ? String(options['productGroup'])
                        : null,
                    normalizePostgresNumericParamValue(options['limit'])
                ];
                loggingAdapter.debug('executeSql', {
                    toolName: 'listSalesByProductGroup',
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
            case 'summarizeSalesByRegion': {
                const sqlText =
                    '\n        SELECT\n            region,\n            COUNT(*) AS line_count,\n            COUNT(DISTINCT customer_id) AS customer_count,\n            ROUND(SUM(net_eur), 2) AS net_eur_total\n        FROM\n            sales_lines\n        GROUP BY\n            region\n        ORDER BY\n            net_eur_total DESC\n    ';
                const sqlValues: DuckDBValue[] = [];
                loggingAdapter.debug('executeSql', {
                    toolName: 'summarizeSalesByRegion',
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
            case 'summarizeSalesByProductGroup': {
                const sqlText =
                    '\n        SELECT\n            product_group,\n            COUNT(*) AS line_count,\n            COUNT(DISTINCT customer_id) AS customer_count,\n            ROUND(SUM(net_eur), 2) AS net_eur_total\n        FROM\n            sales_lines\n        GROUP BY\n            product_group\n        ORDER BY\n            net_eur_total DESC\n    ';
                const sqlValues: DuckDBValue[] = [];
                loggingAdapter.debug('executeSql', {
                    toolName: 'summarizeSalesByProductGroup',
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
            case 'summarizeSalesByRegionAndProductGroup': {
                const sqlText =
                    '\n        SELECT\n            region,\n            product_group,\n            COUNT(*) AS line_count,\n            ROUND(SUM(net_eur), 2) AS net_eur_total\n        FROM\n            sales_lines\n        GROUP BY\n            region,\n            product_group\n        ORDER BY\n            region,\n            net_eur_total DESC\n    ';
                const sqlValues: DuckDBValue[] = [];
                loggingAdapter.debug('executeSql', {
                    toolName: 'summarizeSalesByRegionAndProductGroup',
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
            case 'summarizeSalesBySegment': {
                const sqlText =
                    '\n        SELECT\n            c.segment,\n            COUNT(*) AS line_count,\n            ROUND(SUM(s.net_eur), 2) AS net_eur_total\n        FROM\n            sales_lines s\n            INNER JOIN customers c ON c.customer_id = s.customer_id\n        GROUP BY\n            c.segment\n        ORDER BY\n            net_eur_total DESC\n    ';
                const sqlValues: DuckDBValue[] = [];
                loggingAdapter.debug('executeSql', {
                    toolName: 'summarizeSalesBySegment',
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
            case 'topCustomersByRevenue': {
                const sqlText =
                    '\n        SELECT\n            s.customer_id,\n            s.customer_name,\n            c.city,\n            c.segment,\n            ROUND(SUM(s.net_eur), 2) AS net_eur_total\n        FROM\n            sales_lines s\n            INNER JOIN customers c ON c.customer_id = s.customer_id\n        GROUP BY\n            s.customer_id,\n            s.customer_name,\n            c.city,\n            c.segment\n        ORDER BY\n            net_eur_total DESC\n        LIMIT\n            $1\n    ';
                const sqlValues: DuckDBValue[] = [normalizePostgresNumericParamValue(options['limit'])];
                loggingAdapter.debug('executeSql', {
                    toolName: 'topCustomersByRevenue',
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
