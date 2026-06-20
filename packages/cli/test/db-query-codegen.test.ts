import { EmptyFileSystem } from 'langium';
import { parseHelper } from 'langium/test';
import { beforeAll, describe, expect, test } from 'vitest';
import { createDb2AiDslServices } from 'db-2-ai-dsl-language';
import type { Model } from 'db-2-ai-dsl-language';
import { resolveToolsFromModel } from '../src/db-query-codegen.js';

let parse: ReturnType<typeof parseHelper<Model>>;

beforeAll(async () => {
    const services = createDb2AiDslServices(EmptyFileSystem);
    parse = parseHelper<Model>(services.Db2AiDsl);
});

describe('buildSqlDescription via resolveToolsFromModel', () => {
    test('includes Response section when DSL response is set', async () => {
        const document = await parse(`
            database postgres env "PAGILA_DATABASE_URL"

            SQL {
                toolName: listFilms
                access: public
                intent: "list films"
                query: "SELECT * FROM film LIMIT :limit"
                response: "Object with rows and rowCount."
                params: {
                    limit: { description: "max rows" example: "10" type: integer }
                }
            }
        `);

        const tools = resolveToolsFromModel(document.parseResult.value);
        expect(tools[0]?.description).toContain('Response:\nObject with rows and rowCount.');
    });
});
