import { describe, expect, it } from 'vitest';
import * as path from 'node:path';
import { asRecord, withGeneratedDirectInvokeFixture } from '../support/direct-invoke.js';
import { demosRoot, demosTmpRoot } from '../support/paths.js';
import { ensureSakilaDocker } from '../support/sakila-docker.js';

const sakilaSourcePath = path.join(demosRoot, 'sakila.db2ai');

describe('Sakila generated module direct invocation', () => {
    it('ensures Sakila in Docker, generates MySQL tools, and invokes SQL tools', async () => {
        const { connectionString } = await ensureSakilaDocker(demosRoot);
        await withGeneratedDirectInvokeFixture(
            {
                demosRoot,
                tmpRoot: demosTmpRoot,
                tmpPrefix: 'sakila-direct-',
                sourcePath: sakilaSourcePath,
                generatedToolsName: 'sakila-tools',
                databaseEnv: 'SAKILA_DATABASE_URL',
                connectionString
            },
            async ({ imported, generated, hostContext }) => {
                expect(imported.databaseDialect).toBe('mysql');

                const films = asRecord(await generated.invokeTool('listFilms', { limit: 5, offset: 0 }, hostContext));
                expect(films.rowCount).toBeGreaterThan(0);
                expect(films.rows).toBeInstanceOf(Array);

                const ratedFilms = asRecord(
                    await generated.invokeTool('filmsByRating', { rating: 'PG', maxRows: 3 }, hostContext)
                );
                expect(ratedFilms.rowCount).toBeGreaterThan(0);
                expect(ratedFilms.rows).toBeInstanceOf(Array);

                const searchResults = asRecord(
                    await generated.invokeTool('searchFilms', { searchText: 'ACADEMY', maxRows: 5 }, hostContext)
                );
                expect(searchResults.rowCount).toBeGreaterThan(0);
                expect(searchResults.rows).toBeInstanceOf(Array);
            }
        );
    }, 240_000);
});
