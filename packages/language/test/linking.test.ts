import { EmptyFileSystem } from 'langium';
import { parseHelper } from 'langium/test';
import { beforeAll, describe, expect, test } from 'vitest';
import { createDb2AiDslServices } from '../src/db-2-ai-dsl-module.js';
import { isCheckedAccess, isSqlQuery } from '../src/generated/ast.js';
import type { Model } from '../src/generated/ast.js';

let parse: ReturnType<typeof parseHelper<Model>>;
let services: ReturnType<typeof createDb2AiDslServices>;

beforeAll(async () => {
    services = createDb2AiDslServices(EmptyFileSystem);
    parse = parseHelper<Model>(services.Db2AiDsl);
});

const checkedSqlWithOptionalParam = `
database env "ACCESS_DEMO_DATABASE_URL"

auth

SQL {
    toolName: listCustomerOrders
    access: checked {
        optionalParams: [customerId]
    }
    intent: "orders"
    query: "SELECT 1 WHERE id = $1"
    params: {
        $1: { name: customerId description: "c" example: "a" type: string }
    }
}
`;

describe('Cross-reference linking', () => {
    test('links optionalParams to SqlParamNameField in params', async () => {
        const document = await parse(checkedSqlWithOptionalParam, { validation: true });

        const entry = document.parseResult.value.entries[0];
        expect(isSqlQuery(entry)).toBe(true);
        if (!isSqlQuery(entry) || !isCheckedAccess(entry.access)) {
            return;
        }

        const ref = entry.access.checkedBody?.optionalParams?.[0];
        expect(ref).toBeDefined();
        expect(ref?.$refText).toBe('customerId');
        expect(ref?.ref?.name).toBe('customerId');
        expect(ref?.ref?.$type).toBe('SqlParamNameField');
        const linkerErrors = (document.diagnostics ?? []).filter(
            (d) => d.severity === 1 && d.message.includes('Could not resolve reference')
        );
        expect(linkerErrors).toHaveLength(0);
    });

    test('definition provider finds SqlParamNameField from optionalParams usage', async () => {
        const document = await parse(checkedSqlWithOptionalParam, { validation: true });
        const text = document.textDocument.getText();
        const optionalParamsUsageOffset = text.indexOf('[customerId]') + 1;

        const defProvider = services.Db2AiDsl.lsp.DefinitionProvider!;
        const links = await defProvider.getDefinition(document, {
            textDocument: { uri: document.uri.toString() },
            position: document.textDocument.positionAt(optionalParamsUsageOffset)
        });
        expect(links?.length).toBeGreaterThan(0);

        const paramsNameOffset = text.lastIndexOf('name: customerId');
        expect(paramsNameOffset).toBeGreaterThan(optionalParamsUsageOffset);
        const targetOffset = document.textDocument.offsetAt(links![0]!.targetRange.start);
        expect(targetOffset).toBeGreaterThanOrEqual(paramsNameOffset);
        expect(targetOffset).toBeLessThan(paramsNameOffset + 'name: customerId'.length);
    });

    test('reference completion via default provider lists SqlParamNameField targets', async () => {
        const document = await parse(checkedSqlWithOptionalParam, { validation: true });
        const text = document.textDocument.getText();
        const emptySlotOffset = text.indexOf('[customerId]') + 1;

        const completionProvider = services.Db2AiDsl.lsp.CompletionProvider!;
        const list = await completionProvider.getCompletion(document, {
            textDocument: { uri: document.uri.toString() },
            position: document.textDocument.positionAt(emptySlotOffset)
        });
        const labels = (list?.items ?? []).map((item) => String(item.label));
        expect(labels).toContain('customerId');
    });
});
