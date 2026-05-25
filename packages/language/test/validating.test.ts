import path from 'node:path';
import { EmptyFileSystem, type LangiumDocument } from 'langium';
import { parseHelper, type ParseHelperOptions } from 'langium/test';
import { beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { clearSchemaCache } from '../src/schema.js';

vi.mock('../src/schema.js', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../src/schema.js')>();
    return {
        ...actual,
        loadSchema: vi.fn(async () => ({
            tables: ['film', 'actor', 'customer'],
            columnsByTable: {
                film: ['film_id', 'title'],
                actor: ['actor_id', 'first_name', 'last_name'],
                customer: ['customer_id']
            }
        }))
    };
});

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
    process.env.PAGILA_DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/pagila';
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
    test('accepts query when table exists in schema', async () => {
        document = await parseValidated(`
            database env "PAGILA_DATABASE_URL"

            SELECT * FROM film {
                toolName: "listFilms"
                intent: "list films"
            }
        `);

        expect(errorMessages(document)).toHaveLength(0);
    });

    test('rejects unknown table', async () => {
        document = await parseValidated(`
            database env "PAGILA_DATABASE_URL"

            SELECT * FROM not_a_table {
                toolName: "x"
                intent: "y"
            }
        `);

        expect(errorMessages(document).some((m) => m.includes('not_a_table'))).toBe(true);
    });

    test('requires toolName and intent', async () => {
        document = await parseValidated(`
            database env "PAGILA_DATABASE_URL"

            SELECT * FROM film {
                example: "x"
            }
        `);

        const messages = errorMessages(document);
        expect(messages.some((m) => m.includes('toolName'))).toBe(true);
        expect(messages.some((m) => m.includes('intent'))).toBe(true);
    });

    test('rejects duplicate toolName keys in block', async () => {
        document = await parseValidated(`
            database env "PAGILA_DATABASE_URL"

            SELECT * FROM film {
                toolName: "a"
                toolName: "b"
                intent: "x"
            }
        `);

        expect(errorMessages(document).some((m) => m.includes('Duplicate key "toolName"'))).toBe(true);
    });

    test('rejects invalid env var name', async () => {
        document = await parseValidated(`
            database env "not-valid"

            SELECT * FROM film {
                toolName: "t"
                intent: "i"
            }
        `);

        expect(errorMessages(document).some((m) => m.includes('environment variable name'))).toBe(true);
    });

    test('rejects non-postgresql value in env var', async () => {
        process.env.PAGILA_DATABASE_URL = 'mysql://localhost/db';
        document = await parseValidated(`
            database env "PAGILA_DATABASE_URL"

            SELECT * FROM film {
                toolName: "t"
                intent: "i"
            }
        `);

        expect(errorMessages(document).some((m) => m.includes('postgresql'))).toBe(true);
    });

    test('accepts valid columns map', async () => {
        document = await parseValidated(`
            database env "PAGILA_DATABASE_URL"

            SELECT * FROM actor {
                toolName: "listActors"
                intent: "list actors"
                columns: {
                    actor_id: "Primary key"
                    first_name: "Given name"
                }
            }
        `);

        expect(errorMessages(document)).toHaveLength(0);
    });

    test('rejects unknown column in columns map', async () => {
        document = await parseValidated(`
            database env "PAGILA_DATABASE_URL"

            SELECT * FROM actor {
                toolName: "listActors"
                intent: "list actors"
                columns: {
                    not_a_column: "x"
                }
            }
        `);

        expect(errorMessages(document).some((m) => m.includes('not_a_column'))).toBe(true);
    });

    test('rejects duplicate column keys in columns map', async () => {
        document = await parseValidated(`
            database env "PAGILA_DATABASE_URL"

            SELECT * FROM actor {
                toolName: "listActors"
                intent: "list actors"
                columns: {
                    actor_id: "a"
                    actor_id: "b"
                }
            }
        `);

        expect(errorMessages(document).some((m) => m.includes('Duplicate column key'))).toBe(true);
    });

    test('rejects non-positive maxLimit', async () => {
        document = await parseValidated(`
            database env "PAGILA_DATABASE_URL"

            SELECT * FROM film {
                toolName: "t"
                intent: "i"
                maxLimit: 0
            }
        `);

        expect(errorMessages(document).some((m) => m.includes('maxLimit'))).toBe(true);
    });
});
