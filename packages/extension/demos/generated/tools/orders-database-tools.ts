/**
 * Generated from: orders-database.db2ai
 */
import { checkListCustomerOrdersParameters } from '../../src/auth/orders-database-tools/listCustomerOrders.js';

export const connectionEnv = 'ORDERS_DATABASE_URL';

export const databaseDialect = 'postgres';

export const requiresAuth = true;

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
    access: 'public' | 'protected' | 'checked';
    sqlText: string;
    params?: GeneratedSqlParam[];
};

export type InvokeOptions = Record<string, unknown>;

export type DbHostContext = {
    connectionString: string;
    databaseDialect: 'postgres' | 'mysql';
    credential?: string;
    jwt?: Record<string, unknown>;
};

export type CheckedHostContext = {
    credential: string;
    jwt?: Record<string, unknown>;
};

export const generatedTools: GeneratedTool[] = [
    {
        kind: 'sql',
        toolName: 'listProducts',
        title: 'Product catalog rows',
        description:
            'list products in the orders-database catalog\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- limit ($1): max rows (example: 50)\n\nExample call: limit=50',
        access: 'public',
        sqlText: 'SELECT product_id, name, price FROM products ORDER BY product_id LIMIT $1',
        params: [
            {
                placeholder: '$1',
                index: 1,
                name: 'limit',
                propertyName: 'limit',
                description: 'max rows',
                example: '50',
                jsonSchemaType: 'integer'
            }
        ]
    },
    {
        kind: 'sql',
        toolName: 'listProductsWithReviews',
        title: 'Products with reviews (requires credential).\n        Join products and reviews; cap 200 rows in SQL.',
        description:
            'List products that have at least one review, with review details.\n        Protected: requires host credential (MCP header or ORDERS_DATABASE_TOKEN in .env).\n        One row per review; same product may appear multiple times.\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- limit ($1): max rows (example: 50)\n\nExample call: limit=50',
        access: 'protected',
        sqlText:
            '\n        SELECT\n            p.product_id,\n            p.name,\n            p.price,\n            r.review_id,\n            r.rating,\n            r.comment\n        FROM\n            products p\n        INNER JOIN\n            reviews r ON r.product_id = p.product_id\n        ORDER BY\n            p.product_id,\n            r.review_id\n        LIMIT\n            LEAST($1, 200)\n    ',
        params: [
            {
                placeholder: '$1',
                index: 1,
                name: 'limit',
                propertyName: 'limit',
                description: 'max rows',
                example: '50',
                jsonSchemaType: 'integer'
            }
        ]
    },
    {
        kind: 'sql',
        toolName: 'listCustomerOrders',
        title: 'Customer order rows',
        description:
            'List orders for a customer.\n        When customerId is omitted, the value from the JWT is used.\n        Checked access: customerId must match the token claim when provided.\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- customerId ($1): \n                Customer id (e.g. alice, bob).\n                Defaults from JWT when omitted on checked tools.\n             (example: alice)\n\nExample call: customerId=alice',
        access: 'checked',
        sqlText:
            'SELECT order_id, customer_id, product_id, quantity FROM orders WHERE customer_id = $1 ORDER BY order_id',
        params: [
            {
                placeholder: '$1',
                index: 1,
                name: 'customerId',
                propertyName: 'customerId',
                description:
                    '\n                Customer id (e.g. alice, bob).\n                Defaults from JWT when omitted on checked tools.\n            ',
                example: 'alice',
                jsonSchemaType: 'string'
            }
        ]
    }
];

export const mcpServerName = 'orders-database-tools';
export const mcpServerVersion = '0.0.6';

const parameterCheckers: Record<
    string,
    (options: InvokeOptions, host: CheckedHostContext) => InvokeOptions | Promise<InvokeOptions>
> = {
    listCustomerOrders: checkListCustomerOrdersParameters
};

import * as z from 'zod/v4';

export const inputZodByTool = {
    listProducts: z.object({ limit: z.number().describe('max rows (SQL $1)') }).strict(),
    listProductsWithReviews: z.object({ limit: z.number().describe('max rows (SQL $1)') }).strict(),
    listCustomerOrders: z
        .object({
            customerId: z
                .string()
                .describe(
                    'Customer id (e.g. alice, bob).\n                Defaults from JWT when omitted on checked tools.\n             (SQL $1)'
                )
                .optional()
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

    if (hostContext === undefined) {
        throw new Error('invokeTool requires hostContext from the MCP host (stdio-mcp-server or http-mcp-server).');
    }
    const host = hostContext as DbHostContext;
    if (toolMeta.access !== 'public') {
        if (!host.credential || !String(host.credential).trim()) {
            throw new Error(
                'Missing host credential. stdio: set env for --auth-env on stdio-mcp-server; stateless HTTP: MCP auth header (e.g. x-api-token); OAuth HTTP: complete MCP login (Authorization Bearer from Cursor).'
            );
        }
    }
    let optionsResolved = options;
    if (toolMeta.access === 'checked') {
        const check = parameterCheckers[toolName];
        if (typeof check !== 'function') {
            throw new Error('No parameter checker for checked tool: ' + toolName);
        }
        optionsResolved = await Promise.resolve(
            check(options, {
                credential: String(host.credential).trim(),
                jwt: host.jwt
            })
        );
    }
    const connectionString = resolveConnectionString(host);
    const client = new Client({ connectionString });
    await client.connect();
    try {
        switch (toolName) {
            case 'listProducts': {
                const result = await client.query({
                    text: 'SELECT product_id, name, price FROM products ORDER BY product_id LIMIT $1',
                    values: [normalizePostgresNumericParamValue(optionsResolved['limit'])]
                });
                return {
                    rows: result.rows,
                    rowCount: result.rowCount ?? result.rows.length
                };
            }
            case 'listProductsWithReviews': {
                const result = await client.query({
                    text: '\n        SELECT\n            p.product_id,\n            p.name,\n            p.price,\n            r.review_id,\n            r.rating,\n            r.comment\n        FROM\n            products p\n        INNER JOIN\n            reviews r ON r.product_id = p.product_id\n        ORDER BY\n            p.product_id,\n            r.review_id\n        LIMIT\n            LEAST($1, 200)\n    ',
                    values: [normalizePostgresNumericParamValue(optionsResolved['limit'])]
                });
                return {
                    rows: result.rows,
                    rowCount: result.rowCount ?? result.rows.length
                };
            }
            case 'listCustomerOrders': {
                const result = await client.query({
                    text: 'SELECT order_id, customer_id, product_id, quantity FROM orders WHERE customer_id = $1 ORDER BY order_id',
                    values: [
                        optionsResolved['customerId'] !== undefined && optionsResolved['customerId'] !== null
                            ? String(optionsResolved['customerId'])
                            : null
                    ]
                });
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
