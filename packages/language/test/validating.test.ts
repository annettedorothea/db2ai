import path from 'node:path';
import { EmptyFileSystem, type LangiumDocument } from 'langium';
import { parseHelper, type ParseHelperOptions } from 'langium/test';
import { beforeAll, beforeEach, describe, expect, test } from 'vitest';
import { clearSchemaCache } from '../src/schema.js';
import { createDb2AiDslServices } from '../src/db-2-ai-dsl-module.js';
import type { Model } from '../src/generated/ast.js';

let parse: ReturnType<typeof parseHelper<Model>>;
let document: LangiumDocument<Model> | undefined;
let caseIndex = 0;

const fixtureDir = path.resolve(process.cwd(), 'test/fixtures');

beforeAll(async () => {
    const services = createDb2AiDslServices(EmptyFileSystem);
    parse = parseHelper<Model>(services.Db2AiDsl);
});

beforeEach(() => {
    clearSchemaCache();
    process.env.PAGILA_DATABASE_URL = 'postgresql://postgres:postgres@localhost:55432/pagila';
    process.env.SAKILA_DATABASE_URL = 'mysql://root:root@localhost:53306/sakila';
});

function parseValidated(input: string) {
    caseIndex += 1;
    const documentUri = path.join(fixtureDir, `case-${caseIndex}.db2ai`);
    const options: ParseHelperOptions = { validation: true, documentUri };
    return parse(input, options);
}

function errorMessages(doc: LangiumDocument<Model>): string[] {
    return (doc.diagnostics ?? []).filter((d) => d.severity === 1).map((d) => d.message);
}

describe('Validating', () => {
    test('accepts SQL tool with valid env', async () => {
        document = await parseValidated(`
            database postgres env "PAGILA_DATABASE_URL"

            SQL {
                toolName: listFilms
                access: public
                intent: "list films"
                query: "SELECT * FROM film LIMIT :limit OFFSET :offset"
                params: {
                    limit: { description: "max rows" example: "100" type: integer }
                    offset: { description: "skip rows" example: "0" type: integer }
                }
            }
        `);

        expect(errorMessages(document)).toHaveLength(0);
    });

    test('requires toolName, intent, and query', async () => {
        document = await parseValidated(`
            database postgres env "PAGILA_DATABASE_URL"

            SQL {
                summary: "x"
            }
        `);

        const messages = errorMessages(document);
        expect(messages.some((m) => m.includes('toolName'))).toBe(true);
        expect(messages.some((m) => m.includes('intent'))).toBe(true);
        expect(messages.some((m) => m.includes('query'))).toBe(true);
    });

    test('rejects invalid env var name', async () => {
        document = await parseValidated(`
            database postgres env "not-valid"

            SQL {
                toolName: t
                access: public
                intent: "i"
                query: "SELECT 1"
            }
        `);

        expect(errorMessages(document).some((m) => m.includes('environment variable name'))).toBe(true);
    });

    test('rejects mysql URL for postgres dialect', async () => {
        process.env.PAGILA_DATABASE_URL = 'mysql://localhost/db';
        document = await parseValidated(`
            database postgres env "PAGILA_DATABASE_URL"

            SQL {
                toolName: t
                access: public
                intent: "i"
                query: "SELECT 1"
            }
        `);

        expect(errorMessages(document).some((m) => m.includes('PostgreSQL'))).toBe(true);
    });

    test('accepts mysql URL for explicit mysql dialect', async () => {
        document = await parseValidated(`
            database mysql env "SAKILA_DATABASE_URL"

            SQL {
                toolName: listFilms
                access: public
                intent: "list films"
                query: "SELECT * FROM film LIMIT :limit OFFSET :offset"
                params: {
                    limit: { description: "max rows" example: "100" type: integer }
                    offset: { description: "skip rows" example: "0" type: integer }
                }
            }
        `);

        expect(errorMessages(document)).toHaveLength(0);
    });

    test('rejects postgres URL for explicit mysql dialect', async () => {
        process.env.SAKILA_DATABASE_URL = 'postgresql://postgres:postgres@localhost:55432/pagila';
        document = await parseValidated(`
            database mysql env "SAKILA_DATABASE_URL"

            SQL {
                toolName: listFilms
                access: public
                intent: "list films"
                query: "SELECT 1"
            }
        `);

        expect(errorMessages(document).some((m) => m.includes('MySQL'))).toBe(true);
    });

    test('rejects duplicate tool names', async () => {
        document = await parseValidated(`
            database postgres env "PAGILA_DATABASE_URL"

            SQL {
                toolName: dup
                access: public
                intent: "first"
                query: "SELECT 1"
            }

            SQL {
                toolName: dup
                access: public
                intent: "second"
                query: "SELECT 2"
            }
        `);

        expect(errorMessages(document).some((m) => m.includes('toolName "dup" must be unique'))).toBe(true);
    });
});
