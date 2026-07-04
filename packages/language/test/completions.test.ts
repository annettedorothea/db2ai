import path from 'node:path';
import { EmptyFileSystem, type LangiumDocument } from 'langium';
import { parseHelper, type ParseHelperOptions } from 'langium/test';
import { beforeAll, beforeEach, describe, expect, test } from 'vitest';
import type { CompletionParams } from 'vscode-languageserver';
import { createDb2AiDslServices } from '../src/db-2-ai-dsl-module.js';
import type { Model } from '../src/generated/ast.js';

let parse: ReturnType<typeof parseHelper<Model>>;
let sharedServices: ReturnType<typeof createDb2AiDslServices>;
const fixtureDir = path.join(process.cwd(), 'test/fixtures');
let completionCase = 0;

beforeAll(async () => {
    sharedServices = createDb2AiDslServices(EmptyFileSystem);
    parse = parseHelper<Model>(sharedServices.Db2AiDsl);
});

beforeEach(() => {
    process.env.PAGILA_POSTGRESQL_DATABASE_URL = 'postgresql://postgres:postgres@localhost:55432/pagila';
    process.env.SAKILA_MYSQL_DATABASE_URL = 'mysql://root:root@localhost:53306/sakila';
});

function blockKeywordLabels(items: Array<{ detail?: unknown; label: unknown }>): string[] {
    return items.filter((i) => i.detail === 'SQL block property').map((i) => String(i.label));
}

function sortedBlockKeywordLabels(items: Array<{ detail?: unknown; label: unknown; sortText?: string }>): string[] {
    return items
        .filter((i) => i.detail === 'SQL block property')
        .sort((a, b) => String(a.sortText).localeCompare(String(b.sortText)))
        .map((i) => String(i.label));
}

async function completionAt(content: string, offset: number, parseOptions: ParseHelperOptions = { validation: false }) {
    completionCase += 1;
    const documentUri = path.join(fixtureDir, `completion-case-${completionCase}.db2ai`);
    const options: ParseHelperOptions = { ...parseOptions, documentUri };
    const document = (await parse(content, options)) as LangiumDocument<Model>;
    const position = document.textDocument.positionAt(offset);
    const params = { position, textDocument: { uri: document.uri.toString() } } satisfies CompletionParams;
    const completionProvider = sharedServices.Db2AiDsl.lsp.CompletionProvider!;
    return completionProvider.getCompletion(document as LangiumDocument, params);
}

describe('Completion for SQL block keywords', () => {
    test('lists SQL block keywords inside empty SQL block', async () => {
        const header = `database postgres env "PAGILA_POSTGRESQL_DATABASE_URL"\n\nSQL {\n    `;
        const offset = header.length;

        const list = await completionAt(header, offset);

        const labels = sortedBlockKeywordLabels(list?.items ?? []);
        expect(labels).toEqual(['toolName', 'access', 'hooks', 'intent', 'query', 'summary', 'params', 'response']);
    });

    test('does not suggest already used block keywords', async () => {
        const header = `database postgres env "PAGILA_POSTGRESQL_DATABASE_URL"\n\nSQL {\n    toolName: listFilms\n    access: public\n    intent: "list films"\n    `;
        const offset = header.length;

        const list = await completionAt(header, offset);

        const labels = blockKeywordLabels(list?.items ?? []);
        expect(labels).not.toContain('toolName');
        expect(labels).not.toContain('intent');
        expect(labels).toContain('query');
    });

    test('lists block keywords without database env value', async () => {
        delete process.env.PAGILA_POSTGRESQL_DATABASE_URL;
        const header = `database postgres env "PAGILA_POSTGRESQL_DATABASE_URL"\n\nSQL {\n    `;
        const offset = header.length;

        const list = await completionAt(header, offset);

        const labels = blockKeywordLabels(list?.items ?? []);
        expect(labels).toContain('toolName');
    });
});

describe('Completion for prepareToolCall clientMayOmit', () => {
    test('suggests clientMayOmit keyword inside prepareToolCall block', async () => {
        const marker = '/*caret*/';
        const header = `database postgres env "PAGILA_POSTGRESQL_DATABASE_URL"\n\nSQL {\n    toolName: listOrders\n    access: public\n    hooks: {\n        prepareToolCall: {\n            ${marker}\n        }\n    }\n    intent: "list orders"\n    query: "SELECT 1 WHERE id = :customerId"\n    params: {\n        customerId: { description: "id" example: "1" type: string }\n    }\n}\n`;
        const list = await completionAt(header.replace(marker, ''), header.indexOf(marker));
        const labels = (list?.items ?? []).map((item) => String(item.label));
        expect(labels).toContain('clientMayOmit');
    });

    test('suggests SQL param names inside clientMayOmit list', async () => {
        const marker = '/*caret*/';
        const header = `database postgres env "PAGILA_POSTGRESQL_DATABASE_URL"\n\nSQL {\n    toolName: listOrders\n    access: public\n    hooks: {\n        prepareToolCall: {\n            clientMayOmit: [${marker}]\n        }\n    }\n    intent: "list orders"\n    query: "SELECT 1 WHERE id = :customerId"\n    params: {\n        customerId: { description: "id" example: "1" type: string }\n    }\n}\n`;
        const list = await completionAt(header.replace(marker, ''), header.indexOf(marker), { validation: true });
        const labels = (list?.items ?? []).map((item) => String(item.label));
        expect(labels).toContain('customerId');
    });

    test('suggests SQL param names when editing clientMayOmit prefix', async () => {
        const marker = '/*caret*/';
        const header = `database postgres env "PAGILA_POSTGRESQL_DATABASE_URL"\n\nSQL {\n    toolName: listOrders\n    access: public\n    hooks: {\n        prepareToolCall: {\n            clientMayOmit: [cust${marker}]\n        }\n    }\n    intent: "list orders"\n    query: "SELECT 1 WHERE id = :customerId"\n    params: {\n        customerId: { description: "id" example: "1" type: string }\n    }\n}\n`;
        const list = await completionAt(header.replace(marker, ''), header.indexOf(marker), { validation: true });
        const labels = (list?.items ?? []).map((item) => String(item.label));
        expect(labels).toContain('customerId');
    });
});

describe('Completion for access kinds', () => {
    test('suggests public and protected after access colon', async () => {
        const marker = '/*caret*/';
        const header = `database postgres env "PAGILA_POSTGRESQL_DATABASE_URL"\n\nSQL {\n    toolName: listOrders\n    access: ${marker}\n    intent: "list orders"\n    query: "SELECT 1"\n}\n`;
        const list = await completionAt(header.replace(marker, ''), header.indexOf(marker));
        const labels = (list?.items ?? []).map((item) => String(item.label));
        expect(labels).toContain('public');
        expect(labels).toContain('protected');
    });
});
