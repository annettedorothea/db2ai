import { beforeAll, describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import * as path from 'node:path';
import { asRecord, withGeneratedDirectInvokeFixture } from '../support/direct-invoke.js';
import { ensureOrdersPostgresDocker } from '../support/orders-postgres-docker.js';
import { demosRoot, demosTmpRoot } from '../support/paths.js';

const ordersPostgresSourcePath = path.join(demosRoot, 'orders-postgres.db2ai');
const ORDERS_POSTGRES_AUTH_ENV = 'ORDERS_POSTGRES_TOKEN';
const DEFAULT_ORDERS_POSTGRES_JWT_SECRET = 'db2ai-orders-postgres';

function mintAliceOrdersPostgresToken(): string {
    process.env.ORDERS_POSTGRES_JWT_SECRET =
        process.env.ORDERS_POSTGRES_JWT_SECRET?.trim() || DEFAULT_ORDERS_POSTGRES_JWT_SECRET;
    return execFileSync(process.execPath, [path.join(demosRoot, 'orders-postgres/get-token.mjs'), 'alice'], {
        cwd: demosRoot,
        encoding: 'utf8'
    }).trim();
}

describe('orders-postgres generated module direct invocation', () => {
    let connectionString = '';
    let aliceToken = '';

    beforeAll(async () => {
        ({ connectionString } = await ensureOrdersPostgresDocker(demosRoot));
        aliceToken = mintAliceOrdersPostgresToken();
    }, 180_000);

    function ordersPostgresFixture(authToken: string | undefined) {
        return {
            demosRoot,
            tmpRoot: demosTmpRoot,
            tmpPrefix: 'orders-postgres-direct-',
            sourcePath: ordersPostgresSourcePath,
            generatedToolsName: 'orders-postgres-tools',
            databaseEnv: 'ORDERS_POSTGRES_DATABASE_URL',
            connectionString,
            authEnv: ORDERS_POSTGRES_AUTH_ENV,
            authToken,
            isolateFixtureProjectRoot: true
        };
    }

    it('invokes listProducts (public) without a credential', async () => {
        await withGeneratedDirectInvokeFixture(ordersPostgresFixture(''), async ({ generated, hostContext }) => {
            const products = asRecord(await generated.invokeTool('listProducts', { limit: 10 }, hostContext));
            expect(products.rowCount).toBeGreaterThan(0);
            expect(products.rows).toBeInstanceOf(Array);
        });
    }, 180_000);

    it('invokes listProductsWithReviews (protected) with demo JWT', async () => {
        await withGeneratedDirectInvokeFixture(
            ordersPostgresFixture(aliceToken),
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
            ordersPostgresFixture(aliceToken),
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
