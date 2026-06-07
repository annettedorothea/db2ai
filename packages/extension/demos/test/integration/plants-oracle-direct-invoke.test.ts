import { beforeAll, describe, expect, it } from 'vitest';
import * as path from 'node:path';
import { asRecord, withGeneratedDirectInvokeFixture } from '../support/direct-invoke.js';
import { ensurePlantsOracleDocker } from '../support/plants-oracle-docker.js';
import { demosRoot, demosTmpRoot } from '../support/paths.js';

const plantsOracleSourcePath = path.join(demosRoot, 'plants-oracle.db2ai');

describe('plants-oracle generated module direct invocation', () => {
    let connectionString = '';

    beforeAll(async () => {
        ({ connectionString } = await ensurePlantsOracleDocker(demosRoot));
    }, 360_000);

    function plantsOracleFixture() {
        return {
            demosRoot,
            tmpRoot: demosTmpRoot,
            tmpPrefix: 'plants-oracle-direct-',
            sourcePath: plantsOracleSourcePath,
            generatedToolsName: 'plants-oracle-tools',
            databaseEnv: 'PLANTS_ORACLE_DATABASE_URL',
            connectionString,
            isolateFixtureProjectRoot: true
        };
    }

    it('invokes listPlants without auth', async () => {
        await withGeneratedDirectInvokeFixture(plantsOracleFixture(), async ({ generated, hostContext }) => {
            const result = asRecord(await generated.invokeTool('listPlants', { limit: 5 }, hostContext));
            expect(result.rowCount).toBeGreaterThan(0);
            expect(result.rows).toBeInstanceOf(Array);
            const rows = result.rows as Record<string, unknown>[];
            expect(rows[0]).toHaveProperty('COMMON_NAME');
            expect(rows[0]).toHaveProperty('LATIN_NAME');
            expect(rows[0]).toHaveProperty('DESCRIPTION');
        });
    }, 360_000);

    it('invokes searchPlants by substring', async () => {
        await withGeneratedDirectInvokeFixture(plantsOracleFixture(), async ({ generated, hostContext }) => {
            const result = asRecord(
                await generated.invokeTool('searchPlants', { searchText: 'oak', maxRows: 5 }, hostContext)
            );
            expect(result.rowCount).toBeGreaterThan(0);
            const rows = result.rows as Record<string, unknown>[];
            expect(
                rows.some((row) =>
                    String(row.COMMON_NAME ?? row.common_name)
                        .toLowerCase()
                        .includes('oak')
                )
            ).toBe(true);
        });
    }, 360_000);

    it('creates, updates, and deletes a plant', async () => {
        await withGeneratedDirectInvokeFixture(plantsOracleFixture(), async ({ generated, hostContext }) => {
            const created = asRecord(
                await generated.invokeTool(
                    'createPlant',
                    {
                        commonName: 'Test basil',
                        latinName: 'Ocimum testum',
                        aboutText: 'Temporary row for integration test.'
                    },
                    hostContext
                )
            );
            expect(created.rowCount).toBe(1);
            const createdRows = created.rows as Record<string, unknown>[];
            const plantId = Number(createdRows[0]?.PLANT_ID ?? createdRows[0]?.plant_id);
            expect(plantId).toBeGreaterThan(0);

            const updated = asRecord(
                await generated.invokeTool(
                    'updatePlant',
                    {
                        plantId,
                        commonName: 'Updated basil',
                        latinName: 'Ocimum updated',
                        aboutText: 'Updated description.'
                    },
                    hostContext
                )
            );
            expect(updated.rowCount).toBe(1);
            const updatedRow = (updated.rows as Record<string, unknown>[])[0];
            expect(String(updatedRow?.COMMON_NAME ?? updatedRow?.common_name)).toBe('Updated basil');

            const deleted = asRecord(await generated.invokeTool('deletePlant', { plantId }, hostContext));
            expect(deleted.rowCount).toBe(1);
            const deletedRow = (deleted.rows as Record<string, unknown>[])[0];
            expect(Number(deletedRow?.PLANT_ID ?? deletedRow?.plant_id)).toBe(plantId);
        });
    }, 360_000);
});
