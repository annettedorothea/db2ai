import { beforeAll, describe, expect, it } from 'vitest';
import * as path from 'node:path';
import { asRecord, withGeneratedDirectInvokeFixture } from '../support/direct-invoke.js';
import { ensureOrdersDatabaseDocker } from '../support/orders-database-docker.js';
import { demosRoot, demosTmpRoot } from '../support/paths.js';

const ordersDatabaseSourcePath = path.join(demosRoot, 'orders-database.db2ai');

/** Demo JWT: customerId alice, role user (see .env.example) */
const ALICE_ORDERS_DATABASE_TOKEN =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjdXN0b21lcklkIjoiYWxpY2UiLCJyb2xlIjoidXNlciJ9.ShOdN6nsAyAubIwP7IouU8lws5WtNmdt6-VX2s4dF6U';

const ORDERS_DATABASE_AUTH_ENV = 'ORDERS_DATABASE_TOKEN';

describe('orders-database generated module direct invocation', () => {
    let connectionString = '';

    beforeAll(async () => {
        ({ connectionString } = await ensureOrdersDatabaseDocker(demosRoot));
    }, 180_000);

    function ordersDatabaseFixture(authToken: string | undefined) {
        return {
            demosRoot,
            tmpRoot: demosTmpRoot,
            tmpPrefix: 'orders-database-direct-',
            sourcePath: ordersDatabaseSourcePath,
            generatedToolsName: 'orders-database-tools',
            databaseEnv: 'ORDERS_DATABASE_URL',
            connectionString,
            authEnv: ORDERS_DATABASE_AUTH_ENV,
            authToken,
            isolateFixtureProjectRoot: true
        };
    }

    it('invokes listProducts (public) without a credential', async () => {
        await withGeneratedDirectInvokeFixture(ordersDatabaseFixture(''), async ({ generated, hostContext }) => {
            const products = asRecord(await generated.invokeTool('listProducts', { limit: 10 }, hostContext));
            expect(products.rowCount).toBeGreaterThan(0);
            expect(products.rows).toBeInstanceOf(Array);
        });
    }, 180_000);

    it('invokes listProductsWithReviews (protected) with demo JWT', async () => {
        await withGeneratedDirectInvokeFixture(
            ordersDatabaseFixture(ALICE_ORDERS_DATABASE_TOKEN),
            async ({ generated, hostContext }) => {
                const products = asRecord(
                    await generated.invokeTool('listProductsWithReviews', { limit: 10 }, hostContext)
                );
                expect(products.rowCount).toBeGreaterThan(0);
                expect(products.rows).toBeInstanceOf(Array);
            }
        );
    }, 180_000);

    it('invokes listCustomerOrders (checked) using customerId from JWT', async () => {
        await withGeneratedDirectInvokeFixture(
            ordersDatabaseFixture(ALICE_ORDERS_DATABASE_TOKEN),
            async ({ generated, hostContext }) => {
                const orders = asRecord(await generated.invokeTool('listCustomerOrders', {}, hostContext));
                expect(orders.rowCount).toBeGreaterThan(0);
                expect(orders.rows).toBeInstanceOf(Array);
                const rows = orders.rows as Record<string, unknown>[];
                expect(rows.every((row) => row.customer_id === 'alice')).toBe(true);
            }
        );
    }, 180_000);
});
