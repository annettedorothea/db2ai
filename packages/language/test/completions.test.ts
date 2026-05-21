import path from 'node:path';
import { EmptyFileSystem, type LangiumDocument } from 'langium';
import { parseHelper, type ParseHelperOptions } from 'langium/test';
import { beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import type { CompletionParams } from 'vscode-languageserver';
import { clearSchemaCache } from '../src/schema.js';

vi.mock('../src/schema.js', async importOriginal => {
    const actual = await importOriginal<typeof import('../src/schema.js')>();
    return {
        ...actual,
        loadSchema: vi.fn(async () => ({
            tables: ['actor', 'customer', 'film']
        }))
    };
});

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
    clearSchemaCache();
    process.env.PAGILA_DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/pagila';
});

function tableLabels(items: Array<{ detail?: unknown; label: unknown }>): string[] {
    return items
        .filter(i => i.detail === 'PostgreSQL table')
        .map(i => String(i.label));
}

async function completionAt(content: string, offset: number) {
    completionCase += 1;
    const documentUri = path.join(fixtureDir, `completion-case-${completionCase}.db2ai`);
    const options: ParseHelperOptions = { validation: false, documentUri };
    const document = (await parse(content, options)) as LangiumDocument<Model>;
    const position = document.textDocument.positionAt(offset);
    const params = { position, textDocument: { uri: document.uri.toString() } } satisfies CompletionParams;
    const completionProvider = sharedServices.Db2AiDsl.lsp.CompletionProvider!;
    return completionProvider.getCompletion(document as LangiumDocument, params);
}

describe('Completion for table name', () => {
    test('lists tables after FROM', async () => {
        const header = `database env "PAGILA_DATABASE_URL"\n\nSELECT * FROM `;
        const content = header;
        const offset = content.length;

        const list = await completionAt(content, offset);

        const labels = tableLabels(list?.items ?? []);
        expect(labels).toContain('film');
        expect(labels).toContain('actor');
    });

    test('loads PAGILA_DATABASE_URL from .env next to document', async () => {
        const fs = await import('node:fs');
        const path = await import('node:path');
        const { pathToFileURL } = await import('node:url');
        const envDir = path.join(fixtureDir, 'env-load');
        fs.mkdirSync(envDir, { recursive: true });
        fs.writeFileSync(
            path.join(envDir, '.env'),
            'PAGILA_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pagila\n'
        );
        delete process.env.PAGILA_DATABASE_URL;

        const header = `database env "PAGILA_DATABASE_URL"\n\nSELECT * FROM `;
        const uri = pathToFileURL(path.join(envDir, 'from-env.db2ai')).href;
        const document = (await parse(header, { validation: false, documentUri: uri })) as LangiumDocument<Model>;
        const position = document.textDocument.positionAt(header.length);
        const params = { position, textDocument: { uri: document.uri.toString() } } satisfies CompletionParams;
        const list = await sharedServices.Db2AiDsl.lsp.CompletionProvider!.getCompletion(
            document as LangiumDocument,
            params
        );

        const labels = tableLabels(list?.items ?? []);
        expect(labels).toContain('film');
    });

    test('filters tables by typed prefix', async () => {
        const header = `database env "PAGILA_DATABASE_URL"\n\nSELECT * FROM `;
        const inner = `fi`;
        const tail = ` {\n    toolName: "t"\n    intent: "x"\n}`;
        const content = header + inner + tail;
        const offset = header.length + 1;

        const list = await completionAt(content, offset);

        const labels = tableLabels(list?.items ?? []);
        expect(labels.every(l => l.startsWith('fi'))).toBe(true);
        expect(labels).toContain('film');
    });
});
