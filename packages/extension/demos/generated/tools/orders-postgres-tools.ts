/**
 * Generated from: orders-postgres.db2ai
 */
import { loggingAdapter } from '../../src/utils/logging-adapter.js';
import { checkListCustomerOrdersParameters } from '../../src/auth/orders-postgres-tools/listCustomerOrders.js';
import { checkCreateOrderParameters } from '../../src/auth/orders-postgres-tools/createOrder.js';
import { checkCreateProductParameters } from '../../src/auth/orders-postgres-tools/createProduct.js';
import { checkUpdateProductParameters } from '../../src/auth/orders-postgres-tools/updateProduct.js';
import { checkDeleteProductParameters } from '../../src/auth/orders-postgres-tools/deleteProduct.js';

export const connectionEnv = 'ORDERS_POSTGRES_DATABASE_URL';

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
    databaseDialect: 'postgres' | 'mysql' | 'mariadb' | 'sqlserver' | 'oracle';
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
        toolName: 'listCustomerOrders',
        title: 'Customer order rows',
        description:
            'List orders for a customer.\n        When customerId is omitted, the value from the JWT is used.\n        Checked access: customerId must match the token claim when provided.\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- customerId (:customerId): Customer id (e.g. alice, bob). Defaults from JWT when omitted on checked tools. (example: alice)\n\nExample call: customerId=alice',
        access: 'checked',
        sqlText:
            '\n        SELECT\n            order_id,\n            customer_id,\n            product_id,\n            quantity\n        FROM\n            orders\n        WHERE\n            customer_id = $1\n        ORDER BY\n            order_id\n    ',
        params: [
            {
                placeholder: ':customerId',
                index: 1,
                name: 'customerId',
                propertyName: 'customerId',
                description: 'Customer id (e.g. alice, bob). Defaults from JWT when omitted on checked tools.',
                example: 'alice',
                jsonSchemaType: 'string'
            }
        ]
    },
    {
        kind: 'sql',
        toolName: 'listProducts',
        title: 'Product catalog rows',
        description:
            'list products in the orders-postgres catalog\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- limit (:limit): max rows (example: 50)\n\nExample call: limit=50',
        access: 'public',
        sqlText: 'SELECT product_id, name, price FROM products ORDER BY product_id LIMIT $1',
        params: [
            {
                placeholder: ':limit',
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
            'List products that have at least one review, with review details.\n        Protected: requires host credential (MCP header or ORDERS_POSTGRES_TOKEN in .env).\n        One row per review; same product may appear multiple times.\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- limit (:limit): max rows (example: 50)\n\nExample call: limit=50',
        access: 'protected',
        sqlText:
            '\n        SELECT\n            p.product_id,\n            p.name,\n            p.price,\n            r.review_id,\n            r.rating,\n            r.comment\n        FROM\n            products p\n        INNER JOIN\n            reviews r ON r.product_id = p.product_id\n        ORDER BY\n            p.product_id,\n            r.review_id\n        LIMIT\n            LEAST($1, 200)\n    ',
        params: [
            {
                placeholder: ':limit',
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
        toolName: 'createOrder',
        title: 'Create order for customer and product',
        description:
            'Insert a new order row (quantity defaults to 1).\n        When customerId is omitted, the value from the JWT is used.\n        Checked access: customerId must match the token claim when provided.\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- customerId (:customerId): \n                Customer id (e.g. alice, bob).\n                Defaults from JWT when omitted on checked tools.\n             (example: alice)\n- productId (:productId): Product id from the catalog (example: 1)\n\nExample call: customerId=alice, productId=1',
        access: 'checked',
        sqlText:
            'INSERT INTO orders (customer_id, product_id, quantity) VALUES ($1, $2, 1) RETURNING order_id, customer_id, product_id, quantity',
        params: [
            {
                placeholder: ':customerId',
                index: 1,
                name: 'customerId',
                propertyName: 'customerId',
                description:
                    '\n                Customer id (e.g. alice, bob).\n                Defaults from JWT when omitted on checked tools.\n            ',
                example: 'alice',
                jsonSchemaType: 'string'
            },
            {
                placeholder: ':productId',
                index: 2,
                name: 'productId',
                propertyName: 'productId',
                description: 'Product id from the catalog',
                example: '1',
                jsonSchemaType: 'integer'
            }
        ]
    },
    {
        kind: 'sql',
        toolName: 'createProduct',
        title: 'Create product (admin only)',
        description:
            'Insert a new product into the catalog.\n        Checked access: admin role required (JWT role claim).\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- productName (:productName): Product name (example: Widget Pro)\n- price (:price): Unit price (example: 10.99)\n\nExample call: productName=Widget Pro, price=10.99',
        access: 'checked',
        sqlText: 'INSERT INTO products (name, price) VALUES ($1, $2) RETURNING product_id, name, price',
        params: [
            {
                placeholder: ':productName',
                index: 1,
                name: 'productName',
                propertyName: 'productName',
                description: 'Product name',
                example: 'Widget Pro',
                jsonSchemaType: 'string'
            },
            {
                placeholder: ':price',
                index: 2,
                name: 'price',
                propertyName: 'price',
                description: 'Unit price',
                example: '10.99',
                jsonSchemaType: 'number'
            }
        ]
    },
    {
        kind: 'sql',
        toolName: 'updateProduct',
        title: 'Update product (admin only)',
        description:
            'Update name and price of an existing product.\n        Checked access: admin role required (JWT role claim).\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- productName (:productName): New product name (example: Widget Pro)\n- price (:price): New unit price (example: 12.99)\n- productId (:productId): Product id to update (example: 1)\n\nExample call: productName=Widget Pro, price=12.99, productId=1',
        access: 'checked',
        sqlText: 'UPDATE products SET name = $1, price = $2 WHERE product_id = $3 RETURNING product_id, name, price',
        params: [
            {
                placeholder: ':productName',
                index: 1,
                name: 'productName',
                propertyName: 'productName',
                description: 'New product name',
                example: 'Widget Pro',
                jsonSchemaType: 'string'
            },
            {
                placeholder: ':price',
                index: 2,
                name: 'price',
                propertyName: 'price',
                description: 'New unit price',
                example: '12.99',
                jsonSchemaType: 'number'
            },
            {
                placeholder: ':productId',
                index: 3,
                name: 'productId',
                propertyName: 'productId',
                description: 'Product id to update',
                example: '1',
                jsonSchemaType: 'integer'
            }
        ]
    },
    {
        kind: 'sql',
        toolName: 'deleteProduct',
        title: 'Delete product (admin only)',
        description:
            'Delete a product by id.\n        Checked access: admin role required (JWT role claim).\n        Fails if the product is referenced by orders or reviews (foreign key).\n\nRuns a prepared SQL statement. Pass parameter values by name (see input schema).\n\nParameters:\n- productId (:productId): Product id to delete (example: 999)\n\nExample call: productId=999',
        access: 'checked',
        sqlText: 'DELETE FROM products WHERE product_id = $1 RETURNING product_id, name, price',
        params: [
            {
                placeholder: ':productId',
                index: 1,
                name: 'productId',
                propertyName: 'productId',
                description: 'Product id to delete',
                example: '999',
                jsonSchemaType: 'integer'
            }
        ]
    }
];

export const mcpServerName = 'orders-postgres-tools';
export const mcpServerVersion = '0.2.1';

const parameterCheckers: Record<
    string,
    (options: InvokeOptions, host: CheckedHostContext) => InvokeOptions | Promise<InvokeOptions>
> = {
    listCustomerOrders: checkListCustomerOrdersParameters,
    createOrder: checkCreateOrderParameters,
    createProduct: checkCreateProductParameters,
    updateProduct: checkUpdateProductParameters,
    deleteProduct: checkDeleteProductParameters
};

import * as z from 'zod/v4';

export const inputZodByTool = {
    listCustomerOrders: z
        .object({
            customerId: z
                .string()
                .describe(
                    'Customer id (e.g. alice, bob). Defaults from JWT when omitted on checked tools. (SQL :customerId)'
                )
                .optional()
        })
        .strict(),
    listProducts: z.object({ limit: z.number().describe('max rows (SQL :limit)') }).strict(),
    listProductsWithReviews: z.object({ limit: z.number().describe('max rows (SQL :limit)') }).strict(),
    createOrder: z
        .object({
            customerId: z
                .string()
                .describe(
                    'Customer id (e.g. alice, bob).\n                Defaults from JWT when omitted on checked tools.\n             (SQL :customerId)'
                )
                .optional(),
            productId: z.number().describe('Product id from the catalog (SQL :productId)')
        })
        .strict(),
    createProduct: z
        .object({
            productName: z.string().describe('Product name (SQL :productName)'),
            price: z.number().describe('Unit price (SQL :price)')
        })
        .strict(),
    updateProduct: z
        .object({
            productName: z.string().describe('New product name (SQL :productName)'),
            price: z.number().describe('New unit price (SQL :price)'),
            productId: z.number().describe('Product id to update (SQL :productId)')
        })
        .strict(),
    deleteProduct: z.object({ productId: z.number().describe('Product id to delete (SQL :productId)') }).strict()
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
            case 'listCustomerOrders': {
                const sqlText =
                    '\n        SELECT\n            order_id,\n            customer_id,\n            product_id,\n            quantity\n        FROM\n            orders\n        WHERE\n            customer_id = $1\n        ORDER BY\n            order_id\n    ';
                const sqlValues = [
                    optionsResolved['customerId'] !== undefined && optionsResolved['customerId'] !== null
                        ? String(optionsResolved['customerId'])
                        : null
                ];
                loggingAdapter.debug('executeSql', {
                    toolName: 'listCustomerOrders',
                    sql: compactSqlForLog(sqlText),
                    values: sqlValues
                });
                const result = await client.query({ text: sqlText, values: sqlValues });
                return {
                    rows: result.rows,
                    rowCount: result.rowCount ?? result.rows.length
                };
            }
            case 'listProducts': {
                const sqlText = 'SELECT product_id, name, price FROM products ORDER BY product_id LIMIT $1';
                const sqlValues = [normalizePostgresNumericParamValue(optionsResolved['limit'])];
                loggingAdapter.debug('executeSql', {
                    toolName: 'listProducts',
                    sql: compactSqlForLog(sqlText),
                    values: sqlValues
                });
                const result = await client.query({ text: sqlText, values: sqlValues });
                return {
                    rows: result.rows,
                    rowCount: result.rowCount ?? result.rows.length
                };
            }
            case 'listProductsWithReviews': {
                const sqlText =
                    '\n        SELECT\n            p.product_id,\n            p.name,\n            p.price,\n            r.review_id,\n            r.rating,\n            r.comment\n        FROM\n            products p\n        INNER JOIN\n            reviews r ON r.product_id = p.product_id\n        ORDER BY\n            p.product_id,\n            r.review_id\n        LIMIT\n            LEAST($1, 200)\n    ';
                const sqlValues = [normalizePostgresNumericParamValue(optionsResolved['limit'])];
                loggingAdapter.debug('executeSql', {
                    toolName: 'listProductsWithReviews',
                    sql: compactSqlForLog(sqlText),
                    values: sqlValues
                });
                const result = await client.query({ text: sqlText, values: sqlValues });
                return {
                    rows: result.rows,
                    rowCount: result.rowCount ?? result.rows.length
                };
            }
            case 'createOrder': {
                const sqlText =
                    'INSERT INTO orders (customer_id, product_id, quantity) VALUES ($1, $2, 1) RETURNING order_id, customer_id, product_id, quantity';
                const sqlValues = [
                    optionsResolved['customerId'] !== undefined && optionsResolved['customerId'] !== null
                        ? String(optionsResolved['customerId'])
                        : null,
                    normalizePostgresNumericParamValue(optionsResolved['productId'])
                ];
                loggingAdapter.debug('executeSql', {
                    toolName: 'createOrder',
                    sql: compactSqlForLog(sqlText),
                    values: sqlValues
                });
                const result = await client.query({ text: sqlText, values: sqlValues });
                return {
                    rows: result.rows,
                    rowCount: result.rowCount ?? result.rows.length
                };
            }
            case 'createProduct': {
                const sqlText = 'INSERT INTO products (name, price) VALUES ($1, $2) RETURNING product_id, name, price';
                const sqlValues = [
                    optionsResolved['productName'] !== undefined && optionsResolved['productName'] !== null
                        ? String(optionsResolved['productName'])
                        : null,
                    normalizePostgresNumericParamValue(optionsResolved['price'])
                ];
                loggingAdapter.debug('executeSql', {
                    toolName: 'createProduct',
                    sql: compactSqlForLog(sqlText),
                    values: sqlValues
                });
                const result = await client.query({ text: sqlText, values: sqlValues });
                return {
                    rows: result.rows,
                    rowCount: result.rowCount ?? result.rows.length
                };
            }
            case 'updateProduct': {
                const sqlText =
                    'UPDATE products SET name = $1, price = $2 WHERE product_id = $3 RETURNING product_id, name, price';
                const sqlValues = [
                    optionsResolved['productName'] !== undefined && optionsResolved['productName'] !== null
                        ? String(optionsResolved['productName'])
                        : null,
                    normalizePostgresNumericParamValue(optionsResolved['price']),
                    normalizePostgresNumericParamValue(optionsResolved['productId'])
                ];
                loggingAdapter.debug('executeSql', {
                    toolName: 'updateProduct',
                    sql: compactSqlForLog(sqlText),
                    values: sqlValues
                });
                const result = await client.query({ text: sqlText, values: sqlValues });
                return {
                    rows: result.rows,
                    rowCount: result.rowCount ?? result.rows.length
                };
            }
            case 'deleteProduct': {
                const sqlText = 'DELETE FROM products WHERE product_id = $1 RETURNING product_id, name, price';
                const sqlValues = [normalizePostgresNumericParamValue(optionsResolved['productId'])];
                loggingAdapter.debug('executeSql', {
                    toolName: 'deleteProduct',
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
