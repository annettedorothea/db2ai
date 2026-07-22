import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EmptyFileSystem } from 'langium';
import { parseHelper } from 'langium/test';
import { DiagnosticSeverity } from 'vscode-languageserver';
import { beforeAll, describe, expect, test } from 'vitest';
import { createDb2AiDslServices } from '../src/db-2-ai-dsl-module.js';
import type { Model } from '../src/generated/ast.js';
import { buildExplainSqlForDialect } from '../src/sql-db-probe.js';
import { validateSqlBlocksWithExamples } from '../src/sql-db-validator.js';

let parse: ReturnType<typeof parseHelper<Model>>;

const demosRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../extension/demos');
const flightDocumentUri = path.join(demosRoot, 'flight.db2ai');

beforeAll(async () => {
    const services = createDb2AiDslServices(EmptyFileSystem);
    parse = parseHelper<Model>(services.Db2AiDsl);
});

describe('duckdb EXPLAIN probe', () => {
    test('buildExplainSqlForDialect uses plain EXPLAIN and $n', () => {
        expect(buildExplainSqlForDialect('SELECT * FROM flights WHERE city = :city LIMIT :limit', 'duckdb')).toBe(
            'EXPLAIN SELECT * FROM flights WHERE city = $1 LIMIT $2'
        );
    });

    test('reports SQL error when column is unknown after initDatabase', async () => {
        const documentUri = `${flightDocumentUri}#broken`;
        const document = await parse(
            `
            database duckdb

            SQL {
                toolName: listFlights
                access: public
                intent: "broken"
                query: "SELECT NoSuchCol FROM flights WHERE OriginCityName = :city LIMIT :limit"
                params: {
                    city: { description: "origin" example: "New York" type: string }
                    limit: { description: "max" example: "5" type: integer }
                }
            }
        `,
            { validation: false, documentUri }
        );

        const diags = await validateSqlBlocksWithExamples(document.parseResult.value, documentUri);
        const errors = diags.filter((d) => d.severity === DiagnosticSeverity.Error);
        expect(errors.length).toBeGreaterThanOrEqual(1);
        expect(errors[0]?.message).toMatch(/SQL validation failed:.*NoSuchCol/i);
    });

    test('accepts valid flight SQL after initDatabase', async () => {
        const documentUri = `${flightDocumentUri}#ok`;
        const document = await parse(
            `
            database duckdb

            SQL {
                toolName: listFlights
                access: public
                intent: "ok"
                query: "SELECT FlightDate FROM flights WHERE OriginCityName = :city LIMIT :limit"
                params: {
                    city: { description: "origin" example: "New York" type: string }
                    limit: { description: "max" example: "5" type: integer }
                }
            }
        `,
            { validation: false, documentUri }
        );

        const diags = await validateSqlBlocksWithExamples(document.parseResult.value, documentUri);
        expect(diags.filter((d) => d.severity === DiagnosticSeverity.Error)).toHaveLength(0);
    });
});
