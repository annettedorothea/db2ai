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
            connectionString,
            isolateFixtureProjectRoot: true
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
});
