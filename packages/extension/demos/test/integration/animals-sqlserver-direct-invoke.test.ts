import { beforeAll, describe, expect, it } from 'vitest';
import * as path from 'node:path';
import { asRecord, withGeneratedDirectInvokeFixture } from '../support/direct-invoke.js';
import { ensureAnimalsSqlserverDocker } from '../support/animals-sqlserver-docker.js';
import { demosRoot, demosTmpRoot } from '../support/paths.js';

const animalsSqlserverSourcePath = path.join(demosRoot, 'animals-sqlserver.db2ai');

describe('animals-sqlserver generated module direct invocation', () => {
    let connectionString = '';

    beforeAll(async () => {
        ({ connectionString } = await ensureAnimalsSqlserverDocker(demosRoot));
    }, 240_000);

    function animalsSqlserverFixture() {
        return {
            demosRoot,
            tmpRoot: demosTmpRoot,
            tmpPrefix: 'animals-sqlserver-direct-',
            sourcePath: animalsSqlserverSourcePath,
            generatedToolsName: 'animals-sqlserver-tools',
            databaseEnv: 'ANIMALS_SQLSERVER_DATABASE_URL',
            connectionString
        };
    }

    it('invokes listAnimals without auth', async () => {
        await withGeneratedDirectInvokeFixture(animalsSqlserverFixture(), async ({ generated, hostContext }) => {
            const result = asRecord(await generated.invokeTool('listAnimals', { limit: 5 }, hostContext));
            expect(result.rowCount).toBeGreaterThan(0);
            expect(result.rows).toBeInstanceOf(Array);
            const rows = result.rows as Record<string, unknown>[];
            expect(rows[0]).toHaveProperty('common_name');
            expect(rows[0]).toHaveProperty('latin_name');
            expect(rows[0]).toHaveProperty('description');
        });
    }, 240_000);

    it('invokes searchAnimals by substring', async () => {
        await withGeneratedDirectInvokeFixture(animalsSqlserverFixture(), async ({ generated, hostContext }) => {
            const result = asRecord(
                await generated.invokeTool('searchAnimals', { searchText: 'fox', maxRows: 5 }, hostContext)
            );
            expect(result.rowCount).toBeGreaterThan(0);
            const rows = result.rows as Record<string, unknown>[];
            expect(rows.some((row) => String(row.common_name).toLowerCase().includes('fox'))).toBe(true);
        });
    }, 240_000);

    it('creates, updates, and deletes an animal', async () => {
        await withGeneratedDirectInvokeFixture(animalsSqlserverFixture(), async ({ generated, hostContext }) => {
            const created = asRecord(
                await generated.invokeTool(
                    'createAnimal',
                    {
                        commonName: 'Test shrew',
                        latinName: 'Sorex testus',
                        aboutText: 'Temporary row for integration test.'
                    },
                    hostContext
                )
            );
            expect(created.rowCount).toBe(1);
            const createdRows = created.rows as Record<string, unknown>[];
            const animalId = Number(createdRows[0]?.animal_id);
            expect(animalId).toBeGreaterThan(0);

            const updated = asRecord(
                await generated.invokeTool(
                    'updateAnimal',
                    {
                        animalId,
                        commonName: 'Updated shrew',
                        latinName: 'Sorex updated',
                        aboutText: 'Updated description.'
                    },
                    hostContext
                )
            );
            expect(updated.rowCount).toBe(1);
            expect(String((updated.rows as Record<string, unknown>[])[0]?.common_name)).toBe('Updated shrew');

            const deleted = asRecord(await generated.invokeTool('deleteAnimal', { animalId }, hostContext));
            expect(deleted.rowCount).toBe(1);
            expect(Number((deleted.rows as Record<string, unknown>[])[0]?.animal_id)).toBe(animalId);
        });
    }, 240_000);
});
