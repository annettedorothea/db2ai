import { EmptyFileSystem } from 'langium';
import { parseHelper } from 'langium/test';
import { createDb2AiDslServices } from 'db-2-ai-dsl-language';
import type { Model } from 'db-2-ai-dsl-language';
import { collectLangiumDocumentErrors } from '@core2ai/core/codegen';
import { describe, expect, test } from 'vitest';

describe('generate validation gate', () => {
    test('reports linker errors for unresolved optionalParams', async () => {
        const services = createDb2AiDslServices(EmptyFileSystem);
        const parse = parseHelper<Model>(services.Db2AiDsl);
        const document = await parse(
            `
database env "PAGILA_DATABASE_URL"

SQL {
    toolName: listOrders
    access: checked {
        optionalParams: [missingParam]
    }
    intent: "list orders"
    query: "SELECT 1 WHERE id = $1"
    params: {
        $1: { name: customerId description: "id" example: "1" type: string }
    }
}
`,
            { validation: true }
        );

        const errors = collectLangiumDocumentErrors(document);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some((error: { message: string }) => error.message.includes('Could not resolve reference'))).toBe(
            true
        );
    });
});
