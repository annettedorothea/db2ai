import { EmptyFileSystem, type LangiumDocument } from 'langium';
import { parseHelper } from 'langium/test';
import { beforeAll, describe, expect, test } from 'vitest';
import { createDb2AiDslServices } from '../src/db-2-ai-dsl-module.js';
import type { Model } from '../src/generated/ast.js';

let parse: ReturnType<typeof parseHelper<Model>>;
let document: LangiumDocument<Model> | undefined;

beforeAll(async () => {
    const services = createDb2AiDslServices(EmptyFileSystem);
    parse = parseHelper<Model>(services.Db2AiDsl);
});

describe('Parsing tests', () => {
    test('parses database env and one query', async () => {
        document = await parse(`
            database env "PAGILA_DATABASE_URL"

            SELECT * FROM film {
                toolName: "listFilms"
                intent: "list films"
            }
        `);

        expect(document.parseResult.parserErrors).toHaveLength(0);
        expect(document.parseResult.value.env).toBe('PAGILA_DATABASE_URL');
        expect(document.parseResult.value.queries).toHaveLength(1);
        expect(document.parseResult.value.queries[0].table?.name).toBe('film');
        expect(document.parseResult.value.queries[0].toolName).toBe('listFilms');
    });

    test('parses query with optional example, summary, and maxLimit', async () => {
        document = await parse(`
            database env "PAGILA_DATABASE_URL"

            SELECT * FROM actor {
                summary: "Actors"
                example: "All actors"
                intent: "list actors"
                toolName: "listActors"
                maxLimit: 200
            }
        `);

        expect(document.parseResult.parserErrors).toHaveLength(0);
        const q = document.parseResult.value.queries[0];
        expect(q.table?.name).toBe('actor');
        expect(q.summary).toBe('Actors');
        expect(q.example).toBe('All actors');
        expect(q.maxLimit).toBe(200);
    });
});
