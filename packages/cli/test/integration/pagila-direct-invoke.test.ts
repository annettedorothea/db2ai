import { describe, expect, it } from 'vitest';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { asRecord, withGeneratedDirectInvokeFixture } from '../support/direct-invoke.js';
import { ensurePagilaDocker } from '../support/pagila-docker.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, '../../../..');
const cliRoot = path.resolve(__dirname, '../..');
const demosRoot = path.join(workspaceRoot, 'packages/extension/demos');
const pagilaSourcePath = path.join(demosRoot, 'pagila.db2ai');
const tmpRoot = path.join(cliRoot, 'tmp');

describe('Pagila generated module direct invocation', () => {
    it('ensures Pagila in Docker, generates tools, and invokes SQL tools', async () => {
        const { connectionString } = await ensurePagilaDocker(demosRoot);
        await withGeneratedDirectInvokeFixture(
            {
                demosRoot,
                tmpRoot,
                tmpPrefix: 'pagila-direct-',
                sourcePath: pagilaSourcePath,
                generatedToolsName: 'pagila-tools',
                databaseEnv: 'PAGILA_DATABASE_URL',
                connectionString
            },
            async ({ generated, hostContext }) => {
                const films = asRecord(await generated.invokeTool('listFilms', { limit: 5, offset: 0 }, hostContext));
                expect(films.rowCount).toBeGreaterThan(0);
                expect(films.rows).toBeInstanceOf(Array);

                const ratedFilms = asRecord(
                    await generated.invokeTool('filmsByMpaaRating', { rating: 'PG', maxRows: 3 }, hostContext)
                );
                expect(ratedFilms.rowCount).toBeGreaterThan(0);
                expect(ratedFilms.rows).toBeInstanceOf(Array);
            }
        );
    }, 180_000);
});
