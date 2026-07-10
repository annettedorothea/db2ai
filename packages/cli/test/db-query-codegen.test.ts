import { EmptyFileSystem } from 'langium';
import { parseHelper } from 'langium/test';
import { beforeAll, describe, expect, test } from 'vitest';
import { createDb2AiDslServices } from 'db-2-ai-dsl-language';
import type { Model } from 'db-2-ai-dsl-language';
import { buildInputSchemaByTool, resolveToolsFromModel } from '../src/db-query-codegen.js';

let parse: ReturnType<typeof parseHelper<Model>>;

beforeAll(async () => {
    const services = createDb2AiDslServices(EmptyFileSystem);
    parse = parseHelper<Model>(services.Db2AiDsl);
});

describe('buildSqlDescription via resolveToolsFromModel', () => {
    test('includes Response section when DSL response is set', async () => {
        const document = await parse(
            `
            database postgres env "PAGILA_POSTGRESQL_DATABASE_URL"

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
        `,
            { validation: false }
        );

        const tools = resolveToolsFromModel(document.parseResult.value);
        expect(tools[0]?.description).toContain('Response:\nObject with rows and rowCount.');
    });

    test('input schema param descriptions include type hints', async () => {
        const document = await parse(
            `
            database postgres env "PAGILA_POSTGRESQL_DATABASE_URL"

            SQL {
                toolName: listFilms
                access: public
                intent: "list films"
                query: "SELECT * FROM film LIMIT :limit OFFSET :offset"
                params: {
                    limit: { description: "max rows" example: "10" type: integer }
                    offset: { description: "skip rows" example: "0" type: integer }
                }
            }
        `,
            { validation: false }
        );

        const model = document.parseResult.value;
        const tools = resolveToolsFromModel(model);
        const schema = buildInputSchemaByTool(model, tools);
        const props = schema.listFilms?.properties as Record<string, { description?: string }>;
        expect(props.limit.description).toBe('max rows (SQL :limit) (type: integer) (example: 10)');
        expect(tools[0]?.description).toContain('Parameters:\n- limit: max rows (type: integer) (example: 10)');
        expect(tools[0]?.description).toContain('- offset: skip rows (type: integer) (example: 0)');
    });
});
