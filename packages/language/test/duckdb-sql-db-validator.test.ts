import path from 'node:path';
import { EmptyFileSystem } from 'langium';
import { parseHelper } from 'langium/test';
import { DiagnosticSeverity } from 'vscode-languageserver';
import { beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { createDb2AiDslServices } from '../src/db-2-ai-dsl-module.js';
import type { Model } from '../src/generated/ast.js';
import * as duckdbSetup from '../src/duckdb-setup.js';
import { validateSqlBlocksWithExamples } from '../src/sql-db-validator.js';

let parse: ReturnType<typeof parseHelper<Model>>;
const fixtureDir = path.resolve(process.cwd(), 'test/fixtures');

const duckdbDocument = `
    database duckdb

    SQL {
        toolName: listFlights
        access: public
        intent: "list flights"
        query: "SELECT FlightDate FROM flights WHERE OriginCityName = :city LIMIT :limit"
        params: {
            city: { description: "origin" example: "New York" type: string }
            limit: { description: "max" example: "5" type: integer }
        }
    }
`;

beforeAll(async () => {
    const services = createDb2AiDslServices(EmptyFileSystem);
    parse = parseHelper<Model>(services.Db2AiDsl);
});

beforeEach(() => {
    vi.restoreAllMocks();
});

describe('validateSqlBlocksWithExamples duckdb', () => {
    test('returns setup warning when initDatabase session cannot open', async () => {
        vi.spyOn(duckdbSetup, 'openDuckdbValidationSession').mockRejectedValue(
            new Error('initDatabase stub not found')
        );

        const documentUri = path.join(fixtureDir, 'sql-db-duckdb-setup.db2ai');
        const document = await parse(duckdbDocument, { validation: false, documentUri });
        const diags = await validateSqlBlocksWithExamples(document.parseResult.value, documentUri);

        expect(
            diags.some(
                (d) => d.severity === DiagnosticSeverity.Warning && d.message.includes('DuckDB initDatabase failed')
            )
        ).toBe(true);
        expect(diags.some((d) => d.severity === DiagnosticSeverity.Error)).toBe(false);
    });

    test('returns SQL error when EXPLAIN probe fails after setup', async () => {
        const connection = {
            runAndReadAll: vi.fn().mockRejectedValue(new Error('Binder Error: Referenced column "NoSuchCol"')),
            closeSync: vi.fn()
        };
        vi.spyOn(duckdbSetup, 'openDuckdbValidationSession').mockResolvedValue(
            connection as unknown as Awaited<ReturnType<typeof duckdbSetup.openDuckdbValidationSession>>
        );

        const documentUri = path.join(fixtureDir, 'sql-db-duckdb-explain.db2ai');
        const document = await parse(duckdbDocument, { validation: false, documentUri });
        const diags = await validateSqlBlocksWithExamples(document.parseResult.value, documentUri);

        expect(diags.some((d) => d.severity === DiagnosticSeverity.Error && d.message.includes('NoSuchCol'))).toBe(
            true
        );
        expect(connection.closeSync).toHaveBeenCalled();
    });
});
