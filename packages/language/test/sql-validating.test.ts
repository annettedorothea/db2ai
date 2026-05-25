import path from 'node:path';
import { EmptyFileSystem, type LangiumDocument } from 'langium';
import { parseHelper } from 'langium/test';
import { beforeAll, beforeEach, describe, expect, test } from 'vitest';
import { clearSchemaCache } from '../src/schema.js';
import { createDb2AiDslServices } from '../src/db-2-ai-dsl-module.js';
import type { Model } from '../src/generated/ast.js';

let parse: ReturnType<typeof parseHelper<Model>>;
let caseIndex = 0;
const fixtureDir = path.resolve(process.cwd(), 'test/fixtures');

beforeAll(async () => {
    const services = createDb2AiDslServices(EmptyFileSystem);
    parse = parseHelper<Model>(services.Db2AiDsl);
});

beforeEach(() => {
    clearSchemaCache();
    process.env.PAGILA_DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/pagila';
});

function parseValidated(input: string) {
    caseIndex += 1;
    const documentUri = path.join(fixtureDir, `sql-case-${caseIndex}.db2ai`);
    return parse(input, { validation: true, documentUri });
}

function errorMessages(doc: LangiumDocument<Model>): string[] {
    return (doc.diagnostics ?? []).filter((d) => d.severity === 1).map((d) => d.message);
}

describe('SQL tool validation', () => {
    test('accepts matching query placeholders and params', async () => {
        const document = await parseValidated(`
            database env "PAGILA_DATABASE_URL"

            SQL {
                toolName: "filmsByRating"
                intent: "films with minimum rating"
                query: "SELECT film_id FROM film WHERE rating >= $1 LIMIT $2"
                params: {
                    $1: "minimum rating"
                    $2: "max rows"
                }
            }
        `);

        expect(errorMessages(document)).toHaveLength(0);
    });

    test('rejects missing params entry for placeholder in query', async () => {
        const document = await parseValidated(`
            database env "PAGILA_DATABASE_URL"

            SQL {
                toolName: "x"
                intent: "y"
                query: "SELECT 1 WHERE id = $1"
                params: {}
            }
        `);

        expect(errorMessages(document).some((m) => m.includes('params') || m.includes('$1'))).toBe(true);
    });

    test('rejects unused param key', async () => {
        const document = await parseValidated(`
            database env "PAGILA_DATABASE_URL"

            SQL {
                toolName: "x"
                intent: "y"
                query: "SELECT 1"
                params: {
                    $1: "unused"
                }
            }
        `);

        expect(errorMessages(document).some((m) => m.includes('not used'))).toBe(true);
    });

    test('rejects duplicate param keys', async () => {
        const document = await parseValidated(`
            database env "PAGILA_DATABASE_URL"

            SQL {
                toolName: "x"
                intent: "y"
                query: "SELECT 1 WHERE a = $1"
                params: {
                    $1: "a"
                    $1: "b"
                }
            }
        `);

        expect(errorMessages(document).some((m) => m.includes('Duplicate param'))).toBe(true);
    });
});
