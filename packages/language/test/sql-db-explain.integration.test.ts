import path from 'node:path';
import pg from 'pg';
import { EmptyFileSystem } from 'langium';
import { parseHelper } from 'langium/test';
import { beforeAll, describe, expect, test } from 'vitest';
import { createDb2AiDslServices } from '../src/db-2-ai-dsl-module.js';
import type { Model } from '../src/generated/ast.js';
import { validateSqlBlocksWithExamples } from '../src/sql-db-validator.js';

const ordersUrl = process.env.ORDERS_DATABASE_URL ?? 'postgresql://postgres:postgres@127.0.0.1:55433/orders_database';
const pagilaUrl = process.env.PAGILA_DATABASE_URL ?? 'postgresql://postgres:postgres@127.0.0.1:55432/pagila';
const sakilaUrl = process.env.SAKILA_DATABASE_URL ?? 'mysql://sakila:p_ssW0rd@127.0.0.1:53306/sakila';

const fixtureDir = path.resolve(process.cwd(), 'test/fixtures');

let parse: ReturnType<typeof parseHelper<Model>>;
let ordersAvailable = false;
let pagilaAvailable = false;
let sakilaAvailable = false;

async function canConnectPostgres(url: string): Promise<boolean> {
    const client = new pg.Client({ connectionString: url });
    try {
        await client.connect();
        await client.query('SELECT 1');
        return true;
    } catch {
        return false;
    } finally {
        await client.end().catch(() => undefined);
    }
}

async function canConnectMysql(url: string): Promise<boolean> {
    try {
        const mysql = await import('mysql2/promise');
        const connection = await mysql.createConnection(url);
        try {
            await connection.query('SELECT 1');
            return true;
        } finally {
            await connection.end();
        }
    } catch {
        return false;
    }
}

async function countOrders(url: string): Promise<number> {
    const client = new pg.Client({ connectionString: url });
    await client.connect();
    try {
        const result = await client.query<{ count: string }>('SELECT COUNT(*)::text AS count FROM orders');
        return Number.parseInt(result.rows[0]?.count ?? '0', 10);
    } finally {
        await client.end();
    }
}

beforeAll(async () => {
    const services = createDb2AiDslServices(EmptyFileSystem);
    parse = parseHelper<Model>(services.Db2AiDsl);

    ordersAvailable = await canConnectPostgres(ordersUrl);
    pagilaAvailable = await canConnectPostgres(pagilaUrl);
    sakilaAvailable = await canConnectMysql(sakilaUrl);
});

describe('EXPLAIN DB validation (integration)', () => {
    test('postgres INSERT probe does not change orders row count', async (ctx) => {
        if (!ordersAvailable) {
            ctx.skip();
        }

        process.env.ORDERS_DATABASE_URL = ordersUrl;
        const documentUri = path.join(fixtureDir, 'explain-orders-insert.db2ai');
        const document = await parse(
            `
            database env "ORDERS_DATABASE_URL"

            SQL {
                toolName: createOrder
                access: public
                intent: "create order"
                query: "INSERT INTO orders (customer_id, product_id, quantity) VALUES ($1, $2, 1) RETURNING order_id"
                params: {
                    $1: { name: customerId description: "customer" example: "alice" type: string }
                    $2: { name: productId description: "product" example: "1" type: integer }
                }
            }
        `,
            { validation: false, documentUri }
        );

        const before = await countOrders(ordersUrl);
        const diags = await validateSqlBlocksWithExamples(document.parseResult.value, documentUri);
        const after = await countOrders(ordersUrl);

        expect(diags.filter((d) => d.severity === 1)).toHaveLength(0);
        expect(after).toBe(before);
    });

    test('postgres SELECT probe succeeds against pagila', async (ctx) => {
        if (!pagilaAvailable) {
            ctx.skip();
        }

        process.env.PAGILA_DATABASE_URL = pagilaUrl;
        const documentUri = path.join(fixtureDir, 'explain-pagila-select.db2ai');
        const document = await parse(
            `
            database env "PAGILA_DATABASE_URL"

            SQL {
                toolName: listFilms
                access: public
                intent: "list films"
                query: "SELECT film_id FROM film LIMIT $1 OFFSET $2"
                params: {
                    $1: { name: limit description: "limit" example: "10" type: integer }
                    $2: { name: offset description: "offset" example: "0" type: integer }
                }
            }
        `,
            { validation: false, documentUri }
        );

        const diags = await validateSqlBlocksWithExamples(document.parseResult.value, documentUri);
        expect(diags.filter((d) => d.severity === 1)).toHaveLength(0);
    });

    test('mysql SELECT probe succeeds against sakila', async (ctx) => {
        if (!sakilaAvailable) {
            ctx.skip();
        }

        process.env.SAKILA_DATABASE_URL = sakilaUrl;
        const documentUri = path.join(fixtureDir, 'explain-sakila-select.db2ai');
        const document = await parse(
            `
            database mysql env "SAKILA_DATABASE_URL"

            SQL {
                toolName: listFilms
                access: public
                intent: "list films"
                query: "SELECT film_id FROM film LIMIT $1 OFFSET $2"
                params: {
                    $1: { name: limit description: "limit" example: "10" type: integer }
                    $2: { name: offset description: "offset" example: "0" type: integer }
                }
            }
        `,
            { validation: false, documentUri }
        );

        const diags = await validateSqlBlocksWithExamples(document.parseResult.value, documentUri);
        expect(diags.filter((d) => d.severity === 1)).toHaveLength(0);
    });
});
