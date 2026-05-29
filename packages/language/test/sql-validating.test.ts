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

const validParamBlock = `
    $1: {
        name: rating
        description: "minimum rating"
        example: "PG"
    }
    $2: {
        name: maxRows
        description: "max rows"
        example: "10"
        type: integer
    }
`;

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
                access: public
                intent: "films with minimum rating"
                query: "SELECT film_id FROM film WHERE rating >= $1 LIMIT $2"
                params: { ${validParamBlock} }
            }
        `);

        expect(errorMessages(document)).toHaveLength(0);
    });

    test('accepts logical $n placeholders for mysql dialect', async () => {
        delete process.env.SAKILA_DATABASE_URL;
        const document = await parseValidated(`
            database mysql env "SAKILA_DATABASE_URL"

            SQL {
                toolName: "filmsByRating"
                access: public
                intent: "films with a given rating"
                query: "SELECT film_id FROM film WHERE rating = $1 LIMIT $2"
                params: { ${validParamBlock} }
            }
        `);

        expect(errorMessages(document)).toHaveLength(0);
    });

    test('rejects missing params entry for placeholder in query', async () => {
        const document = await parseValidated(`
            database env "PAGILA_DATABASE_URL"

            SQL {
                toolName: "x"
                access: public
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
                access: public
                intent: "y"
                query: "SELECT 1"
                params: {
                    $1: {
                        name: unused
                        description: "unused"
                    }
                }
            }
        `);

        expect(errorMessages(document).some((m) => m.includes('not used'))).toBe(true);
    });

    test('rejects duplicate placeholder keys', async () => {
        const document = await parseValidated(`
            database env "PAGILA_DATABASE_URL"

            SQL {
                toolName: "x"
                access: public
                intent: "y"
                query: "SELECT 1 WHERE a = $1"
                params: {
                    $1: {
                        name: first
                        description: "a"
                    }
                    $1: {
                        name: second
                        description: "b"
                    }
                }
            }
        `);

        expect(errorMessages(document).some((m) => m.includes('Duplicate param'))).toBe(true);
    });

    test('rejects duplicate param names', async () => {
        const document = await parseValidated(`
            database env "PAGILA_DATABASE_URL"

            SQL {
                toolName: "x"
                access: public
                intent: "y"
                query: "SELECT 1 WHERE a = $1 AND b = $2"
                params: {
                    $1: {
                        name: sameName
                        description: "a"
                    }
                    $2: {
                        name: sameName
                        description: "b"
                    }
                }
            }
        `);

        expect(errorMessages(document).some((m) => m.includes('Duplicate param name'))).toBe(true);
    });

    test('rejects missing name and description', async () => {
        const document = await parseValidated(`
            database env "PAGILA_DATABASE_URL"

            SQL {
                toolName: "x"
                access: public
                intent: "y"
                query: "SELECT 1 WHERE a = $1"
                params: {
                    $1: {
                        example: "x"
                    }
                }
            }
        `);

        const messages = errorMessages(document);
        expect(messages.some((m) => m.includes('name'))).toBe(true);
        expect(messages.some((m) => m.includes('description'))).toBe(true);
    });

    test('rejects invalid example for integer type', async () => {
        const document = await parseValidated(`
            database env "PAGILA_DATABASE_URL"

            SQL {
                toolName: "x"
                access: public
                intent: "y"
                query: "SELECT 1 LIMIT $1"
                params: {
                    $1: {
                        name: maxRows
                        description: "limit"
                        example: "not-a-number"
                        type: integer
                    }
                }
            }
        `);

        expect(errorMessages(document).some((m) => m.includes('integer'))).toBe(true);
    });
});
