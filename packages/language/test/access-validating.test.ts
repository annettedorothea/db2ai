import path from 'node:path';
import { EmptyFileSystem } from 'langium';
import { parseHelper, type ParseHelperOptions } from 'langium/test';
import { beforeAll, beforeEach, describe, expect, test } from 'vitest';
import { getAccessKind, getOptionalParams, isToolValidateEnabled } from '../src/query-access.js';
import { isSqlQuery } from '../src/generated/ast.js';
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
    process.env.ORDERS_POSTGRESQL_DATABASE_URL = 'postgresql://postgres:postgres@localhost:55433/orders_postgres';
});

function parseValidated(input: string) {
    caseIndex += 1;
    const documentUri = path.join(fixtureDir, `access-case-${caseIndex}.db2ai`);
    const options: ParseHelperOptions = { validation: true, documentUri };
    return parse(input, options);
}

describe('Access validating', () => {
    test('reports protected without auth keyword', async () => {
        const document = await parseValidated(`
            database postgres env "ORDERS_POSTGRESQL_DATABASE_URL"

            SQL {
                toolName: listActors
                access: protected
                intent: "list actors"
                query: "SELECT 1"
            }
        `);

        const diagnostics = document.diagnostics ?? [];
        expect(diagnostics.some((d) => d.message.includes('requires `auth` on the model'))).toBe(true);
    });

    test('reports authorize on public access', async () => {
        const document = await parseValidated(`
            database postgres env "ORDERS_POSTGRESQL_DATABASE_URL"

            SQL {
                toolName: listCustomerOrders
                access: public
                authorize: true
                intent: "orders"
                query: "SELECT 1"
            }
        `);

        const diagnostics = document.diagnostics ?? [];
        expect(diagnostics.some((d) => d.message.includes('authorize: true requires access `protected`'))).toBe(true);
    });

    test('warns when auth keyword has no protected SQL blocks', async () => {
        const document = await parseValidated(`
            database postgres env "ORDERS_POSTGRESQL_DATABASE_URL"

            auth

            SQL {
                toolName: listActors
                access: public
                intent: "list actors"
                query: "SELECT 1"
            }
        `);

        const diagnostics = document.diagnostics ?? [];
        expect(diagnostics.some((d) => d.message.includes('`auth` has no effect'))).toBe(true);
    });

    test('warns when database env variable is not set', async () => {
        delete process.env.ORDERS_POSTGRESQL_DATABASE_URL;
        const document = await parseValidated(`
            database postgres env "ORDERS_POSTGRESQL_DATABASE_URL"

            SQL {
                toolName: listActors
                access: public
                intent: "list actors"
                query: "SELECT 1"
            }
        `);

        const diagnostics = document.diagnostics ?? [];
        expect(
            diagnostics.some(
                (d) => d.message.includes('ORDERS_POSTGRESQL_DATABASE_URL') && d.message.includes('not set')
            )
        ).toBe(true);
    });

    test('accepts protected with prepare optionalParams for known SQL param', async () => {
        const document = await parseValidated(`
            database postgres env "ORDERS_POSTGRESQL_DATABASE_URL"

            auth

            SQL {
                toolName: listCustomerOrders
                access: protected
                prepare: {
                    optionalParams: [customerId]
                }
                intent: "orders"
                query: "SELECT 1 FROM orders WHERE customer_id = :customerId"
                params: {
                    customerId: { description: "customer" example: "alice" type: string }
                }
            }
        `);

        expect(document.diagnostics ?? []).toHaveLength(0);
        const entry = document.parseResult.value.entries[0];
        expect(isSqlQuery(entry)).toBe(true);
        if (isSqlQuery(entry)) {
            expect(getAccessKind(entry)).toBe('protected');
            expect(isToolValidateEnabled(entry)).toBe(true);
            expect(getOptionalParams(entry)).toEqual(['customerId']);
        }
    });

    test('reports unresolved optionalParams reference', async () => {
        const document = await parseValidated(`
            database postgres env "ORDERS_POSTGRESQL_DATABASE_URL"

            auth

            SQL {
                toolName: listCustomerOrders
                access: protected
                prepare: {
                    optionalParams: [missingParam]
                }
                intent: "orders"
                query: "SELECT 1 FROM orders WHERE customer_id = :customerId"
                params: {
                    customerId: { description: "customer" example: "alice" type: string }
                }
            }
        `);

        const diagnostics = document.diagnostics ?? [];
        expect(diagnostics.length).toBeGreaterThan(0);
        expect(diagnostics.some((d) => d.message.includes('missingParam'))).toBe(true);
        expect(diagnostics.some((d) => d.message.toLowerCase().includes('could not resolve reference'))).toBe(true);
    });
});
