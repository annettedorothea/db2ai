import path from 'node:path';
import { EmptyFileSystem } from 'langium';
import { parseHelper } from 'langium/test';
import { DiagnosticSeverity } from 'vscode-languageserver';
import { beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { createDb2AiDslServices } from '../src/db-2-ai-dsl-module.js';
import type { Model } from '../src/generated/ast.js';
import * as connectivity from '../src/sql-db-connectivity.js';
import { validateSqlBlocksWithExamples } from '../src/sql-db-validator.js';

let parse: ReturnType<typeof parseHelper<Model>>;
const fixtureDir = path.resolve(process.cwd(), 'test/fixtures');

const sampleDocument = `
    database postgres env "PAGILA_DATABASE_URL"

    SQL {
        toolName: listFilms
        access: public
        intent: "list films"
        query: "SELECT film_id FROM film WHERE rating >= :rating LIMIT :maxRows"
        params: {
            rating: { description: "minimum rating" example: "PG" }
            maxRows: { description: "max rows" example: "10" type: integer }
        }
    }

    SQL {
        toolName: listStores
        access: public
        intent: "list stores"
        query: "SELECT store_id FROM store LIMIT :maxRows"
        params: {
            maxRows: { description: "max rows" example: "5" type: integer }
        }
    }
`;

beforeAll(async () => {
    const services = createDb2AiDslServices(EmptyFileSystem);
    parse = parseHelper<Model>(services.Db2AiDsl);
});

beforeEach(() => {
    vi.restoreAllMocks();
    process.env.PAGILA_DATABASE_URL = 'postgresql://postgres:postgres@127.0.0.1:55432/pagila';
});

describe('validateSqlBlocksWithExamples connectivity', () => {
    test('returns env and per-query warnings when database is unreachable', async () => {
        vi.spyOn(connectivity, 'probeDatabaseConnectivity').mockRejectedValue(
            Object.assign(new Error('connect ECONNREFUSED 127.0.0.1:55432'), { code: 'ECONNREFUSED' })
        );

        const documentUri = path.join(fixtureDir, 'sql-db-unreachable.db2ai');
        const document = await parse(sampleDocument, { validation: false, documentUri });
        const diags = await validateSqlBlocksWithExamples(document.parseResult.value, documentUri);

        const envWarnings = diags.filter(
            (d) =>
                d.severity === DiagnosticSeverity.Warning &&
                d.message.startsWith('DB validation skipped: cannot connect to database')
        );
        const queryWarnings = diags.filter(
            (d) =>
                d.severity === DiagnosticSeverity.Warning &&
                d.message === 'DB validation skipped: database unreachable.'
        );

        expect(envWarnings).toHaveLength(1);
        expect(queryWarnings).toHaveLength(2);
        expect(diags.some((d) => d.severity === DiagnosticSeverity.Error)).toBe(false);
    });

    test('returns error when database is reachable but SQL probe fails', async () => {
        vi.spyOn(connectivity, 'probeDatabaseConnectivity').mockResolvedValue(undefined);

        const pgModule = await import('pg');
        const querySpy = vi
            .spyOn(pgModule.default.Client.prototype, 'query')
            .mockImplementation(async (config: unknown) => {
                const text =
                    typeof config === 'string'
                        ? config
                        : typeof config === 'object' &&
                            config !== null &&
                            'text' in config &&
                            typeof (config as { text?: unknown }).text === 'string'
                          ? (config as { text: string }).text
                          : '';
                if (text.startsWith('EXPLAIN')) {
                    throw new Error('syntax error at or near "FROM"');
                }
                return { rows: [], rowCount: 0 };
            });
        vi.spyOn(pgModule.default.Client.prototype, 'connect').mockResolvedValue(undefined);
        vi.spyOn(pgModule.default.Client.prototype, 'end').mockResolvedValue(undefined);

        const documentUri = path.join(fixtureDir, 'sql-db-syntax-error.db2ai');
        const document = await parse(sampleDocument, { validation: false, documentUri });
        const diags = await validateSqlBlocksWithExamples(document.parseResult.value, documentUri);

        expect(diags.some((d) => d.severity === DiagnosticSeverity.Error && d.message.includes('syntax error'))).toBe(
            true
        );
        expect(
            diags.some(
                (d) =>
                    d.severity === DiagnosticSeverity.Warning &&
                    d.message === 'DB validation skipped: database unreachable.'
            )
        ).toBe(false);

        querySpy.mockRestore();
    });

    test('returns warnings when Oracle service is not registered (NJS-518)', async () => {
        vi.spyOn(connectivity, 'probeDatabaseConnectivity').mockRejectedValue(
            new Error(
                'NJS-518: cannot connect to Oracle Database. Service "FREEPDB1" is not registered with the listener at host 127.0.0.1 port 55221.'
            )
        );

        const documentUri = path.join(fixtureDir, 'sql-db-oracle-unreachable.db2ai');
        const document = await parse(sampleDocument, { validation: false, documentUri });
        const diags = await validateSqlBlocksWithExamples(document.parseResult.value, documentUri);

        expect(diags.some((d) => d.severity === DiagnosticSeverity.Error)).toBe(false);
        expect(
            diags.some(
                (d) =>
                    d.severity === DiagnosticSeverity.Warning &&
                    d.message.startsWith('DB validation skipped: cannot connect to database')
            )
        ).toBe(true);
        expect(
            diags.filter(
                (d) =>
                    d.severity === DiagnosticSeverity.Warning &&
                    d.message === 'DB validation skipped: database unreachable.'
            )
        ).toHaveLength(2);
    });
});
