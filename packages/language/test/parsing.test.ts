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
        expect(document.parseResult.value.dialect).toBeUndefined();
        expect(document.parseResult.value.entries).toHaveLength(1);
        const entry = document.parseResult.value.entries[0];
        expect(entry.$type).toBe('TableQuery');
        if (entry.$type === 'TableQuery') {
            expect(entry.table?.name).toBe('film');
            expect(entry.toolName).toBe('listFilms');
        }
    });

    test('parses explicit postgres dialect', async () => {
        document = await parse(`
            database postgres env "PAGILA_DATABASE_URL"

            SELECT * FROM film {
                toolName: "listFilms"
                intent: "list films"
            }
        `);

        expect(document.parseResult.parserErrors).toHaveLength(0);
        expect(document.parseResult.value.dialect).toBe('postgres');
        expect(document.parseResult.value.env).toBe('PAGILA_DATABASE_URL');
    });

    test('parses explicit mysql dialect', async () => {
        document = await parse(`
            database mysql env "SAKILA_DATABASE_URL"

            SELECT * FROM film {
                toolName: "listFilms"
                intent: "list films"
            }
        `);

        expect(document.parseResult.parserErrors).toHaveLength(0);
        expect(document.parseResult.value.dialect).toBe('mysql');
        expect(document.parseResult.value.env).toBe('SAKILA_DATABASE_URL');
    });

    test('parses query with optional example, summary, and maxLimit', async () => {
        document = await parse(`
            database env "PAGILA_DATABASE_URL"

            SELECT * FROM actor {
                toolName: "listActors"
                intent: "list actors"
                summary: "Actors"
                example: "All actors"
                maxLimit: 200
            }
        `);

        expect(document.parseResult.parserErrors).toHaveLength(0);
        const q = document.parseResult.value.entries[0];
        expect(q.$type).toBe('TableQuery');
        if (q.$type !== 'TableQuery') {
            return;
        }
        expect(q.table?.name).toBe('actor');
        expect(q.summary).toBe('Actors');
        expect(q.example).toBe('All actors');
        expect(q.maxLimit).toBe(200);
    });

    test('rejects query properties outside the canonical order', async () => {
        document = await parse(`
            database env "PAGILA_DATABASE_URL"

            SELECT * FROM actor {
                summary: "Actors"
                toolName: "listActors"
                intent: "list actors"
            }
        `);

        expect(document.parseResult.parserErrors.length).toBeGreaterThan(0);
    });

    test('parses columns map in query block', async () => {
        document = await parse(`
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

        expect(document.parseResult.parserErrors).toHaveLength(0);
        const q = document.parseResult.value.entries[0];
        expect(q.$type).toBe('TableQuery');
        if (q.$type !== 'TableQuery') {
            return;
        }
        expect(q.columns?.entries).toHaveLength(2);
        expect(q.columns?.entries[0].name).toBe('actor_id');
        expect(q.columns?.entries[0].description).toBe('Primary key');
        expect(q.columns?.entries[1].name).toBe('first_name');
    });

    test('parses empty columns map', async () => {
        document = await parse(`
            database env "PAGILA_DATABASE_URL"

            SELECT * FROM actor {
                toolName: "listActors"
                intent: "list actors"
                columns: {}
            }
        `);

        expect(document.parseResult.parserErrors).toHaveLength(0);
        const empty = document.parseResult.value.entries[0];
        expect(empty.$type).toBe('TableQuery');
        if (empty.$type === 'TableQuery') {
            expect(empty.columns?.entries).toHaveLength(0);
        }
    });

    test('parses SQL tool with query and params', async () => {
        document = await parse(`
            database env "PAGILA_DATABASE_URL"

            SQL {
                toolName: "filmsByRating"
                intent: "films with minimum rating"
                query: "SELECT film_id, title FROM film WHERE rating >= $1 LIMIT $2"
                params: {
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
                }
            }
        `);

        expect(document.parseResult.parserErrors).toHaveLength(0);
        const entry = document.parseResult.value.entries[0];
        expect(entry.$type).toBe('SqlQuery');
        if (entry.$type === 'SqlQuery') {
            expect(entry.toolName).toBe('filmsByRating');
            expect(entry.query).toContain('$1');
            expect(entry.params?.entries).toHaveLength(2);
            expect(entry.params?.entries[0].placeholder).toBe('$1');
            expect(entry.params?.entries[0].spec?.fields.some((f) => f.name === 'rating')).toBe(true);
        }
    });
});
