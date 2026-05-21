import type { CompletionParams, CompletionItem, Position } from 'vscode-languageserver';
import { CompletionItemKind, CompletionList, InsertTextFormat, TextEdit } from 'vscode-languageserver';
import type { CompletionProviderOptions } from 'langium/lsp';
import { DefaultCompletionProvider } from 'langium/lsp';
import type { AstNode, CstNode, LangiumDocument, LeafCstNode } from 'langium';
import { AstUtils, Cancellation, CstUtils, isLeafCstNode } from 'langium';
import { loadSchema, resolveDatabaseUrlFromEnvForDocument } from './schema.js';
import { isModel, isQuery, type Model, type Query } from './generated/ast.js';

function debugCompletion(message: string, data?: unknown): void {
    if (process.env.DB2AI_DSL_DEBUG_COMPLETION === '1') {
        // eslint-disable-next-line no-console
        console.log(`[db2ai-dsl completion] ${message}`, data !== undefined ? data : '');
    }
}

function openingBraceLeaf(queryCst: CstNode | undefined): LeafCstNode | undefined {
    if (!queryCst) {
        return undefined;
    }
    for (const n of CstUtils.flattenCst(queryCst)) {
        if (isLeafCstNode(n) && n.text === '{') {
            return n;
        }
    }
    return undefined;
}

function fromKeywordLeaf(queryCst: CstNode | undefined): LeafCstNode | undefined {
    if (!queryCst) {
        return undefined;
    }
    for (const n of CstUtils.flattenCst(queryCst)) {
        if (isLeafCstNode(n) && n.text === 'FROM') {
            return n;
        }
    }
    return undefined;
}

function tableNameLeaf(query: Query): LeafCstNode | undefined {
    const cst = query.$cstNode;
    const from = fromKeywordLeaf(cst);
    if (!from) {
        return undefined;
    }
    let best: LeafCstNode | undefined;
    for (const n of CstUtils.flattenCst(cst!)) {
        if (!isLeafCstNode(n)) {
            continue;
        }
        if (n.offset <= from.offset) {
            continue;
        }
        const brace = openingBraceLeaf(cst);
        if (brace && n.offset >= brace.offset) {
            continue;
        }
        if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(n.text)) {
            if (!best || n.offset > best.offset) {
                best = n;
            }
        }
    }
    return best;
}

/** Pick the query whose FROM … { region contains `offset` (rightmost FROM wins). */
function findQueryForTableCompletion(model: Model, offset: number): Query | undefined {
    let best: Query | undefined;
    let bestFromOffset = -1;
    for (const query of model.queries) {
        const from = fromKeywordLeaf(query.$cstNode);
        if (!from || offset <= from.offset) {
            continue;
        }
        const brace = openingBraceLeaf(query.$cstNode);
        if (brace && offset >= brace.offset) {
            continue;
        }
        if (from.offset > bestFromOffset) {
            bestFromOffset = from.offset;
            best = query;
        }
    }
    return best;
}

function cursorAwaitingTableName(
    query: Query,
    offset: number,
    textDocument: LangiumDocument['textDocument'],
    position: Position
): boolean {
    const from = fromKeywordLeaf(query.$cstNode);
    const brace = openingBraceLeaf(query.$cstNode);
    if (!from) {
        return false;
    }
    if (offset <= from.offset) {
        return false;
    }
    if (brace && offset >= brace.offset) {
        return false;
    }
    const tableLeaf = tableNameLeaf(query);
    if (tableLeaf) {
        return false;
    }
    const between = textDocument.getText({
        start: textDocument.positionAt(from.offset + 4),
        end: position
    });
    return /^\s*$/.test(between);
}

function tableItemsForQuery(
    query: Query,
    root: CstNode,
    offset: number,
    textDoc: LangiumDocument['textDocument'],
    position: Position,
    candidates: string[]
): CompletionItem[] {
    const tableLeaf = tableNameLeaf(query);
    if (tableLeaf) {
        const prefixEnd = Math.min(offset, tableLeaf.offset + tableLeaf.text.length);
        const typedPrefix = textDoc.getText({
            start: textDoc.positionAt(tableLeaf.offset),
            end: textDoc.positionAt(prefixEnd)
        });
        let filtered =
            typedPrefix.length === 0
                ? candidates
                : candidates.filter(t => t.startsWith(typedPrefix));
        if (filtered.length === 0 && candidates.length > 0) {
            filtered = candidates;
        }
        return filtered.map(table => ({
            label: table,
            kind: CompletionItemKind.Value,
            detail: 'PostgreSQL table',
            insertTextFormat: InsertTextFormat.PlainText,
            sortText: '0',
            textEdit: TextEdit.replace(tableLeaf.range, table)
        }));
    }

    if (cursorAwaitingTableName(query, offset, textDoc, position) && candidates.length > 0) {
        return candidates.map(table => ({
            label: table,
            kind: CompletionItemKind.Value,
            detail: 'PostgreSQL table',
            insertTextFormat: InsertTextFormat.PlainText,
            sortText: '0',
            textEdit: TextEdit.insert(position, table)
        }));
    }

    return [];
}

export class Db2AiDslCompletionProvider extends DefaultCompletionProvider {
    override readonly completionOptions: CompletionProviderOptions = {};

    override async getCompletion(
        document: LangiumDocument,
        params: CompletionParams,
        cancelToken?: Cancellation.CancellationToken
    ): Promise<CompletionList | undefined> {
        const tableItems = await this.buildTableCompletionItems(document, params.position);
        debugCompletion('getCompletion tableItems count', tableItems.length);
        if (tableItems.length > 0) {
            return CompletionList.create(this.deduplicateItems(tableItems), false);
        }
        return super.getCompletion(document, params, cancelToken);
    }

    private async buildTableCompletionItems(
        document: LangiumDocument,
        position: Position
    ): Promise<CompletionItem[]> {
        const root = document.parseResult.value?.$cstNode;
        const model = document.parseResult.value;
        if (!root || !isModel(model) || !model.env) {
            debugCompletion('no model/env', { hasRoot: !!root });
            return [];
        }

        const textDoc = document.textDocument;
        const offset = textDoc.offsetAt(position);

        let query = findQueryForTableCompletion(model, offset);
        if (!query) {
            const leafAt =
                CstUtils.findLeafNodeAtOffset(root, offset) ??
                CstUtils.findLeafNodeBeforeOffset(root, offset);
            if (leafAt) {
                query = AstUtils.getContainerOfType(leafAt.astNode as AstNode, isQuery);
            }
        }
        if (!query) {
            debugCompletion('no query at offset', offset);
            return [];
        }

        const connectionUrl = resolveDatabaseUrlFromEnvForDocument(String(model.env), document.uri.toString());
        if (connectionUrl === undefined) {
            debugCompletion('no connection URL for env', String(model.env));
            return [];
        }

        let loaded;
        try {
            loaded = await loadSchema(connectionUrl);
        } catch (err) {
            debugCompletion('loadSchema failed', String(err));
            return [];
        }

        return tableItemsForQuery(query, root, offset, textDoc, position, loaded.tables);
    }
}
