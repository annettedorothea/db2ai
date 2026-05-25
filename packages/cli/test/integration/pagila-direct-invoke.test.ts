import { readGeneratedModule } from '@core2ai/core/mcp-host';
import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { generateAction } from '../../src/generate-command.js';
import { ensurePagilaDocker } from '../support/pagila-docker.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, '../../../..');
const cliRoot = path.resolve(__dirname, '../..');
const demosRoot = path.join(workspaceRoot, 'packages/extension/demos');
const pagilaSourcePath = path.join(demosRoot, 'pagila.db2ai');
const tmpRoot = path.join(cliRoot, 'tmp');

function asRecord(value: unknown): Record<string, unknown> {
    expect(value).toBeTypeOf('object');
    expect(value).not.toBeNull();
    return value as Record<string, unknown>;
}

function restoreEnv(name: string, previousValue: string | undefined): void {
    if (previousValue === undefined) {
        delete process.env[name];
        return;
    }
    process.env[name] = previousValue;
}

describe('Pagila generated module direct invocation', () => {
    it('ensures Pagila in Docker, generates tools, and invokes table and SQL tools', async () => {
        const { connectionString } = await ensurePagilaDocker(demosRoot);
        const runRoot = await fs.mkdtemp(path.join(tmpRoot, 'pagila-direct-'));
        const generatedTsPath = path.join(runRoot, 'generated/tools/pagila-tools.ts');
        const generatedJsPath = path.join(runRoot, 'generated/tools/pagila-tools.mjs');
        const previousDatabaseUrl = process.env.PAGILA_DATABASE_URL;

        try {
            process.env.PAGILA_DATABASE_URL = connectionString;
            await generateAction(pagilaSourcePath, generatedTsPath);

            const imported = await import(`${pathToFileURL(generatedJsPath).href}?t=${Date.now()}`);
            const generated = readGeneratedModule(imported as Record<string, unknown>);
            generated.adapter.configureFromArgv([], [demosRoot]);
            generated.adapter.validateAtStartup(generated.requiresAuth === true);
            const hostContext = generated.adapter.resolveHostContext();

            const films = asRecord(await generated.invokeTool('listFilms', { limit: 5, offset: 0 }, hostContext));
            expect(films.rowCount).toBeGreaterThan(0);
            expect(films.rows).toBeInstanceOf(Array);

            const ratedFilms = asRecord(
                await generated.invokeTool('filmsByMpaaRating', { param1: 'PG', param2: '3' }, hostContext)
            );
            expect(ratedFilms.rowCount).toBeGreaterThan(0);
            expect(ratedFilms.rows).toBeInstanceOf(Array);
        } finally {
            restoreEnv('PAGILA_DATABASE_URL', previousDatabaseUrl);
            await fs.rm(runRoot, { recursive: true, force: true });
        }
    }, 180_000);
});
