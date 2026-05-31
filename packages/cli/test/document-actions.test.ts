import { EmptyFileSystem } from 'langium';
import { parseHelper } from 'langium/test';
import { createDb2AiDslServices } from 'db-2-ai-dsl-language';
import type { Model } from 'db-2-ai-dsl-language';
import { collectLangiumDocumentErrors } from '@core2ai/core/codegen';
import { describe, expect, test } from 'vitest';

describe('document-actions validation', () => {
    test('parse succeeds for minimal valid syntax', async () => {
        const services = createDb2AiDslServices(EmptyFileSystem);
        const parse = parseHelper<Model>(services.Db2AiDsl);
        const document = await parse(
            `
database env "PAGILA_DATABASE_URL"

SQL {
    toolName: listFilms
    access: public
    intent: "list films"
    query: "SELECT * FROM film LIMIT $1 OFFSET $2"
    params: {
        $1: { name: limit description: "max rows" example: "100" type: integer }
        $2: { name: offset description: "skip rows" example: "0" type: integer }
    }
}
`,
            { validation: false }
        );

        expect(document.parseResult.parserErrors).toHaveLength(0);
    });

    test('validate reports duplicate toolName as blocking error', async () => {
        const services = createDb2AiDslServices(EmptyFileSystem);
        const parse = parseHelper<Model>(services.Db2AiDsl);
        const document = await parse(
            `
database env "PAGILA_DATABASE_URL"

SQL {
    toolName: dupTool
    access: public
    intent: "first"
    query: "SELECT 1"
}

SQL {
    toolName: dupTool
    access: public
    intent: "second"
    query: "SELECT 2"
}
`,
            { validation: true }
        );

        const errors = collectLangiumDocumentErrors(document);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some((error) => error.message.includes('must be unique'))).toBe(true);
    });
});
