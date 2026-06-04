import { EmptyFileSystem, type LangiumDocument } from 'langium';
import { parseHelper } from 'langium/test';
import { beforeAll, describe, expect, test } from 'vitest';
import { createDb2AiDslServices } from '../src/db-2-ai-dsl-module.js';
import { getAccessKind } from '../src/query-access.js';
import { parseSqlParamSpec } from '../src/sql-param-spec.js';
import { isSqlParamNameField, isSqlQuery } from '../src/generated/ast.js';
import type { Model } from '../src/generated/ast.js';

let parse: ReturnType<typeof parseHelper<Model>>;
let document: LangiumDocument<Model> | undefined;

beforeAll(async () => {
    const services = createDb2AiDslServices(EmptyFileSystem);
    parse = parseHelper<Model>(services.Db2AiDsl);
});

describe('Parsing tests', () => {
    test('parses database env and one SQL tool', async () => {
        document = await parse(`
            database env "PAGILA_DATABASE_URL"

            SQL {
                toolName: listFilms
                access: public
                intent: "list films"
                query: "SELECT * FROM film LIMIT $1 OFFSET $2"
            }
        `);

        expect(document.parseResult.parserErrors).toHaveLength(0);
        expect(document.parseResult.value.env).toBe('PAGILA_DATABASE_URL');
        expect(document.parseResult.value.dialect).toBeUndefined();
        expect(document.parseResult.value.entries).toHaveLength(1);
        const entry = document.parseResult.value.entries[0];
        expect(entry.$type).toBe('SqlQuery');
        expect(entry.toolName).toBe('listFilms');
        if (isSqlQuery(entry)) {
            expect(getAccessKind(entry)).toBe('public');
        }
    });

    test('parses multiline intent and param description', async () => {
        document = await parse(`
            database env "PAGILA_DATABASE_URL"

            SQL {
                toolName: listFilms
                access: public
                intent: '''
                    List films with pagination.
                    Use for catalog browsing only.
                '''
                query: "SELECT 1 LIMIT $1"
                params: {
                    $1: {
                        name: limit
                        description: '''
                            Max rows per page.
                            Capped in SQL.
                        '''
                        example: "10"
                        type: integer
                    }
                }
            }
        `);

        expect(document.parseResult.parserErrors).toHaveLength(0);
        const entry = document.parseResult.value.entries[0];
        expect(isSqlQuery(entry)).toBe(true);
        if (isSqlQuery(entry)) {
            expect(entry.intent).toContain('catalog browsing');
            expect(entry.intent).toContain('\n');
            const paramSpec = parseSqlParamSpec(entry.params?.entries[0]?.spec);
            expect(paramSpec.description).toContain('Max rows');
            expect(paramSpec.description).toContain('\n');
        }
    });

    test('parses multiline query with triple quotes', async () => {
        document = await parse(`
            database env "PAGILA_DATABASE_URL"

            SQL {
                toolName: listFilms
                access: public
                intent: "list films"
                query: '''
                    SELECT film_id, title
                    FROM film
                    LIMIT $1
                '''
                params: {
                    $1: { name: limit description: "max" example: "10" type: integer }
                }
            }
        `);

        expect(document.parseResult.parserErrors).toHaveLength(0);
        const entry = document.parseResult.value.entries[0];
        expect(isSqlQuery(entry)).toBe(true);
        if (isSqlQuery(entry)) {
            expect(entry.query).toContain('SELECT film_id');
            expect(entry.query).toContain('\n');
            expect(entry.query).not.toContain("'''");
        }
    });

    test('parses auth keyword and checked access', async () => {
        document = await parse(`
            database env "ORDERS_DEMO_DATABASE_URL"

            auth

            SQL {
                toolName: listCustomerOrders
                access: checked {
                    optionalParams: [customerId]
                }
                intent: "orders"
                query: "SELECT 1"
            }
        `);

        expect(document.parseResult.parserErrors).toHaveLength(0);
        expect(document.parseResult.value.auth).toBeDefined();
        const entry = document.parseResult.value.entries[0];
        if (isSqlQuery(entry)) {
            expect(getAccessKind(entry)).toBe('checked');
        }
    });

    test('parses explicit postgres dialect', async () => {
        document = await parse(`
            database postgres env "PAGILA_DATABASE_URL"

            SQL {
                toolName: listFilms
                access: public
                intent: "list films"
                query: "SELECT 1"
            }
        `);

        expect(document.parseResult.parserErrors).toHaveLength(0);
        expect(document.parseResult.value.dialect).toBe('postgres');
        expect(document.parseResult.value.env).toBe('PAGILA_DATABASE_URL');
    });

    test('parses explicit mysql dialect', async () => {
        document = await parse(`
            database mysql env "SAKILA_DATABASE_URL"

            SQL {
                toolName: listFilms
                access: public
                intent: "list films"
                query: "SELECT 1"
            }
        `);

        expect(document.parseResult.parserErrors).toHaveLength(0);
        expect(document.parseResult.value.dialect).toBe('mysql');
        expect(document.parseResult.value.env).toBe('SAKILA_DATABASE_URL');
    });

    test('parses SQL tool with summary and params', async () => {
        document = await parse(`
            database env "PAGILA_DATABASE_URL"

            SQL {
                toolName: listActors
                access: public
                intent: "list actors"
                query: "SELECT * FROM actor LIMIT $1 OFFSET $2"
                summary: "Actors"
                params: {
                    $1: {
                        name: limit
                        description: "max rows"
                        example: "100"
                        type: integer
                    }
                    $2: {
                        name: offset
                        description: "skip rows"
                        example: "0"
                        type: integer
                    }
                }
            }
        `);

        expect(document.parseResult.parserErrors).toHaveLength(0);
        const q = document.parseResult.value.entries[0];
        expect(q.$type).toBe('SqlQuery');
        expect(q.summary).toBe('Actors');
        expect(q.params?.entries).toHaveLength(2);
    });

    test('rejects SQL properties outside the canonical order', async () => {
        document = await parse(`
            database env "PAGILA_DATABASE_URL"

            SQL {
                summary: "Actors"
                toolName: listActors
                access: public
                intent: "list actors"
                query: "SELECT 1"
            }
        `);

        expect(document.parseResult.parserErrors.length).toBeGreaterThan(0);
    });

    test('parses SQL tool with query and params', async () => {
        document = await parse(`
            database env "PAGILA_DATABASE_URL"

            SQL {
                toolName: filmsByRating
                access: public
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
            expect(
                entry.params?.entries[0].spec?.fields.some((f) => isSqlParamNameField(f) && f.name === 'rating')
            ).toBe(true);
        }
    });
});
