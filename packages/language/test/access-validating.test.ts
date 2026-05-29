import path from 'node:path';
import { EmptyFileSystem } from 'langium';
import { parseHelper, type ParseHelperOptions } from 'langium/test';
import { beforeAll, beforeEach, describe, expect, test } from 'vitest';
import { getAccessKind, getOptionalParams } from '../src/query-access.js';
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
    process.env.ACCESS_DEMO_DATABASE_URL = 'postgresql://postgres:postgres@localhost:55433/access_demo';
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
            database env "ACCESS_DEMO_DATABASE_URL"

            SQL {
                toolName: "listActors"
                access: protected
                intent: "list actors"
                query: "SELECT 1"
            }
        `);

        const diagnostics = document.diagnostics ?? [];
        expect(diagnostics.some((d) => d.message.includes('require `auth` on the model'))).toBe(true);
    });

    test('accepts checked access with optionalParams for known SQL param', async () => {
        const document = await parseValidated(`
            database env "ACCESS_DEMO_DATABASE_URL"

            auth

            SQL {
                toolName: "listCustomerOrders"
                access: checked {
                    optionalParams: ["customerId"]
                }
                intent: "orders"
                query: "SELECT 1 FROM orders WHERE customer_id = $1"
                params: {
                    $1: { name: customerId description: "customer" example: "alice" type: string }
                }
            }
        `);

        expect(document.diagnostics ?? []).toHaveLength(0);
        const entry = document.parseResult.value.entries[0];
        expect(isSqlQuery(entry)).toBe(true);
        if (isSqlQuery(entry)) {
            expect(getAccessKind(entry)).toBe('checked');
            expect(getOptionalParams(entry)).toEqual(['customerId']);
        }
    });

    test('warns when optionalParams entry is not a SQL param name', async () => {
        const document = await parseValidated(`
            database env "ACCESS_DEMO_DATABASE_URL"

            auth

            SQL {
                toolName: "listCustomerOrders"
                access: checked {
                    optionalParams: ["missingParam"]
                }
                intent: "orders"
                query: "SELECT 1 FROM orders WHERE customer_id = $1"
                params: {
                    $1: { name: customerId description: "customer" example: "alice" type: string }
                }
            }
        `);

        const diagnostics = document.diagnostics ?? [];
        expect(diagnostics).toHaveLength(1);
        expect(diagnostics[0]?.severity).toBe(2);
        expect(diagnostics[0]?.message).toContain('optionalParams entry "missingParam"');
    });
});
