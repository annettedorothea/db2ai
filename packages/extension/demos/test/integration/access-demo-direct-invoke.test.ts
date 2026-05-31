import { beforeAll, describe, expect, it } from 'vitest';
import * as path from 'node:path';
import { asRecord, withGeneratedDirectInvokeFixture } from '../support/direct-invoke.js';
import { ensureAccessDemoDocker } from '../support/access-demo-docker.js';
import { demosRoot, demosTmpRoot } from '../support/paths.js';

const accessDemoSourcePath = path.join(demosRoot, 'access-demo.db2ai');

/** Demo JWT: customerId alice, role user (see .env.example) */
const ALICE_ACCESS_DEMO_TOKEN =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjdXN0b21lcklkIjoiYWxpY2UiLCJyb2xlIjoidXNlciJ9.W8kJLviah23DKhSJ-gd6LF7phONqmyOqe57WD8sHwFo';

const ACCESS_DEMO_AUTH_ENV = 'ACCESS_DEMO_TOKEN';

describe('Access demo generated module direct invocation', () => {
    let connectionString = '';

    beforeAll(async () => {
        ({ connectionString } = await ensureAccessDemoDocker(demosRoot));
    }, 180_000);

    function accessDemoFixture(authToken: string | undefined) {
        return {
            demosRoot,
            tmpRoot: demosTmpRoot,
            tmpPrefix: 'access-demo-direct-',
            sourcePath: accessDemoSourcePath,
            generatedToolsName: 'access-demo-tools',
            databaseEnv: 'ACCESS_DEMO_DATABASE_URL',
            connectionString,
            authEnv: ACCESS_DEMO_AUTH_ENV,
            authToken,
            isolateFixtureProjectRoot: true
        };
    }

    it('invokes listProducts (public) without a credential', async () => {
        await withGeneratedDirectInvokeFixture(accessDemoFixture(''), async ({ generated, hostContext }) => {
            const products = asRecord(await generated.invokeTool('listProducts', { limit: 10 }, hostContext));
            expect(products.rowCount).toBeGreaterThan(0);
            expect(products.rows).toBeInstanceOf(Array);
        });
    }, 180_000);

    it('invokes listProductsWithReviews (protected) with demo JWT', async () => {
        await withGeneratedDirectInvokeFixture(
            accessDemoFixture(ALICE_ACCESS_DEMO_TOKEN),
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
            accessDemoFixture(ALICE_ACCESS_DEMO_TOKEN),
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
