import type { CompletionParams, CompletionItem, Position } from 'vscode-languageserver';
import { CompletionItemKind, CompletionList, InsertTextFormat, TextEdit } from 'vscode-languageserver';
import type { CompletionProviderOptions } from 'langium/lsp';
import { DefaultCompletionProvider } from 'langium/lsp';
import type { AstNode, CstNode, LangiumDocument, LeafCstNode } from 'langium';
import { AstUtils, Cancellation, CstUtils, isLeafCstNode } from 'langium';
import { SQL_BLOCK_KEYS } from './db-2-ai-dsl-sql-validator.js';
import { QUERY_BLOCK_KEYS, type QueryBlockKey } from './db-2-ai-dsl-validator.js';
import { columnsForTable, loadSchema, resolveDatabaseUrlFromEnvForDocument } from './schema.js';
import type { LoadedSchema } from './schema.js';
import {
    isColumnDescriptionEntry,
    isModel,
    isSqlQuery,
    isTableQuery,
    type ColumnDescriptionEntry,
    type Model,
    type ModelEntry,
    type SqlQuery,
    type TableQuery
} from './generated/ast.js';

function debugCompletion(message: string, data?: unknown): void {
    if (process.env.DB2AI_DSL_DEBUG_COMPLETION === '1') {
        // eslint-disable-next-line no-console
        console.log(`[db2ai-dsl completion] ${message}`, data !== undefined ? data : '');
    }
}

function openingBraceLeaf(cst: CstNode | undefined): LeafCstNode | undefined {
    if (!cst) {
        return undefined;
    }
    for (const n of CstUtils.flattenCst(cst)) {
        if (isLeafCstNode(n) && n.text === '{') {
            return n;
        }
    }
    return undefined;
}

function closingBraceLeaf(cst: CstNode | undefined): LeafCstNode | undefined {
    if (!cst) {
        return undefined;
    }
    let last: LeafCstNode | undefined;
    for (const n of CstUtils.flattenCst(cst)) {
        if (isLeafCstNode(n) && n.text === '}') {
            last = n;
        }
    }
    return last;
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

function queryBlockOpeningBrace(queryCst: CstNode | undefined): LeafCstNode | undefined {
    return openingBraceLeaf(queryCst);
}

function tableNameLeaf(query: TableQuery): LeafCstNode | undefined {
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
        const brace = queryBlockOpeningBrace(cst);
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

function columnDescriptionsCst(query: TableQuery): CstNode | undefined {
    return query.columns?.$cstNode;
}

function offsetInsideColumnMap(query: TableQuery, offset: number): boolean {
    const cst = columnDescriptionsCst(query);
    if (!cst) {
        return false;
    }
    const open = openingBraceLeaf(cst);
    if (!open || offset <= open.offset) {
        return false;
    }
    const close = closingBraceLeaf(cst);
    if (close && offset >= close.offset) {
        return false;
    }
    return true;
}

function columnNameLeafForEntry(entry: ColumnDescriptionEntry): LeafCstNode | undefined {
    const cst = entry.$cstNode;
    if (!cst) {
        return undefined;
    }
    let colonOffset = Number.POSITIVE_INFINITY;
    for (const n of CstUtils.flattenCst(cst)) {
        if (isLeafCstNode(n) && n.text === ':') {
            colonOffset = n.offset;
            break;
        }
    }
    for (const n of CstUtils.flattenCst(cst)) {
        if (!isLeafCstNode(n)) {
            continue;
        }
        if (n.offset >= colonOffset) {
            continue;
        }
        if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(n.text)) {
            return n;
        }
    }
    return undefined;
}

function columnNameLeafAtOffset(query: TableQuery, offset: number): LeafCstNode | undefined {
    for (const entry of query.columns?.entries ?? []) {
        const leaf = columnNameLeafForEntry(entry);
        if (!leaf) {
            continue;
        }
        const end = leaf.offset + leaf.text.length;
        if (offset >= leaf.offset && offset <= end) {
            return leaf;
        }
    }
    return undefined;
}

function usedColumnKeys(query: TableQuery, excludeName?: string): Set<string> {
    const used = new Set<string>();
    for (const entry of query.columns?.entries ?? []) {
        const name = entry.name;
        if (!name || name === excludeName) {
            continue;
        }
        used.add(name);
    }
    return used;
}

function cursorInsideColumnDescriptionValue(root: CstNode, offset: number): boolean {
    const leaf = CstUtils.findLeafNodeAtOffset(root, offset) ?? CstUtils.findLeafNodeBeforeOffset(root, offset);
    if (!leaf) {
        return false;
    }
    if (isLeafCstNode(leaf) && /^\s+$/.test(leaf.text)) {
        return false;
    }
    const entry = AstUtils.getContainerOfType(leaf.astNode as AstNode, isColumnDescriptionEntry);
    if (!entry) {
        return false;
    }
    const nameLeaf = columnNameLeafForEntry(entry);
    if (nameLeaf && offset >= nameLeaf.offset && offset <= nameLeaf.offset + nameLeaf.text.length) {
        return false;
    }
    const entryCst = entry.$cstNode;
    if (!entryCst) {
        return false;
    }
    for (const n of CstUtils.flattenCst(entryCst)) {
        if (!isLeafCstNode(n)) {
            continue;
        }
        if (n.text.startsWith('"') || n.text.startsWith("'")) {
            if (offset >= n.offset && offset <= n.offset + n.text.length) {
                return true;
            }
        }
    }
    return false;
}

function cursorAwaitingColumnName(query: TableQuery, offset: number): boolean {
    if (!offsetInsideColumnMap(query, offset)) {
        return false;
    }
    return columnNameLeafAtOffset(query, offset) === undefined;
}

function columnItemsForQuery(
    query: TableQuery,
    offset: number,
    textDoc: LangiumDocument['textDocument'],
    position: Position,
    loaded: LoadedSchema
): CompletionItem[] {
    const tableName = query.table?.name;
    if (!tableName) {
        return [];
    }
    const allColumns = columnsForTable(loaded, tableName);
    const used = usedColumnKeys(query);
    const candidates = allColumns.filter((c) => !used.has(c));
    if (candidates.length === 0) {
        return [];
    }

    const nameLeaf = columnNameLeafAtOffset(query, offset);
    if (nameLeaf) {
        const prefixEnd = Math.min(offset, nameLeaf.offset + nameLeaf.text.length);
        const typedPrefix = textDoc.getText({
            start: textDoc.positionAt(nameLeaf.offset),
            end: textDoc.positionAt(prefixEnd)
        });
        let filtered = typedPrefix.length === 0 ? candidates : candidates.filter((c) => c.startsWith(typedPrefix));
        if (filtered.length === 0 && candidates.length > 0) {
            filtered = candidates;
        }
        return filtered.map((column) => ({
            label: column,
            kind: CompletionItemKind.Property,
            detail: 'PostgreSQL column',
            insertTextFormat: InsertTextFormat.PlainText,
            sortText: '0',
            textEdit: TextEdit.replace(nameLeaf.range, column)
        }));
    }

    if (cursorAwaitingColumnName(query, offset)) {
        return candidates.map((column) => ({
            label: column,
            kind: CompletionItemKind.Property,
            detail: 'PostgreSQL column',
            insertTextFormat: InsertTextFormat.PlainText,
            sortText: '0',
            textEdit: TextEdit.insert(position, column)
        }));
    }

    return [];
}

/** Pick the query whose FROM … { region contains `offset` (rightmost FROM wins). */
function findTableQueryForTableCompletion(model: Model, offset: number): TableQuery | undefined {
    let best: TableQuery | undefined;
    let bestFromOffset = -1;
    for (const query of model.entries) {
        if (!isTableQuery(query)) {
            continue;
        }
        const from = fromKeywordLeaf(query.$cstNode);
        if (!from || offset <= from.offset) {
            continue;
        }
        const brace = queryBlockOpeningBrace(query.$cstNode);
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
    query: TableQuery,
    offset: number,
    textDocument: LangiumDocument['textDocument'],
    position: Position
): boolean {
    const from = fromKeywordLeaf(query.$cstNode);
    const brace = queryBlockOpeningBrace(query.$cstNode);
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

function offsetInTableNameRegion(query: TableQuery, offset: number): boolean {
    const from = fromKeywordLeaf(query.$cstNode);
    const brace = queryBlockOpeningBrace(query.$cstNode);
    if (!from || offset <= from.offset) {
        return false;
    }
    if (brace && offset >= brace.offset) {
        return false;
    }
    return true;
}

function tableItemsForQuery(
    query: TableQuery,
    offset: number,
    textDoc: LangiumDocument['textDocument'],
    position: Position,
    candidates: string[]
): CompletionItem[] {
    if (!offsetInTableNameRegion(query, offset)) {
        return [];
    }
    const tableLeaf = tableNameLeaf(query);
    if (tableLeaf) {
        const prefixEnd = Math.min(offset, tableLeaf.offset + tableLeaf.text.length);
        const typedPrefix = textDoc.getText({
            start: textDoc.positionAt(tableLeaf.offset),
            end: textDoc.positionAt(prefixEnd)
        });
        let filtered = typedPrefix.length === 0 ? candidates : candidates.filter((t) => t.startsWith(typedPrefix));
        if (filtered.length === 0 && candidates.length > 0) {
            filtered = candidates;
        }
        return filtered.map((table) => ({
            label: table,
            kind: CompletionItemKind.Value,
            detail: 'PostgreSQL table',
            insertTextFormat: InsertTextFormat.PlainText,
            sortText: '0',
            textEdit: TextEdit.replace(tableLeaf.range, table)
        }));
    }

    if (cursorAwaitingTableName(query, offset, textDoc, position) && candidates.length > 0) {
        return candidates.map((table) => ({
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

const TABLE_BLOCK_KEYWORD_INSERT: Record<QueryBlockKey, string> = {
    toolName: 'toolName: "$1"$0',
    intent: 'intent: "$1"$0',
    example: 'example: "$1"$0',
    summary: 'summary: "$1"$0',
    maxLimit: 'maxLimit: $1$0',
    columns: 'columns: {\n    $1: "$2"\n}$0'
};

const SQL_BLOCK_KEYWORD_INSERT: Record<(typeof SQL_BLOCK_KEYS)[number], string> = {
    toolName: 'toolName: "$1"$0',
    intent: 'intent: "$1"$0',
    example: 'example: "$1"$0',
    summary: 'summary: "$1"$0',
    query: 'query: "$1"$0',
    params: 'params: {\n    $1: "$2"\n}$0'
};

function usedTableBlockKeys(query: TableQuery): Set<string> {
    const used = new Set<string>();
    if (query.toolName !== undefined) {
        used.add('toolName');
    }
    if (query.intent !== undefined) {
        used.add('intent');
    }
    if (query.example !== undefined) {
        used.add('example');
    }
    if (query.summary !== undefined) {
        used.add('summary');
    }
    if (query.maxLimit !== undefined) {
        used.add('maxLimit');
    }
    if (query.columns !== undefined) {
        used.add('columns');
    }
    return used;
}

function usedSqlBlockKeys(query: SqlQuery): Set<string> {
    const used = new Set<string>();
    if (query.toolName !== undefined) {
        used.add('toolName');
    }
    if (query.intent !== undefined) {
        used.add('intent');
    }
    if (query.example !== undefined) {
        used.add('example');
    }
    if (query.summary !== undefined) {
        used.add('summary');
    }
    if (query.query !== undefined) {
        used.add('query');
    }
    if (query.params !== undefined) {
        used.add('params');
    }
    return used;
}

function offsetInsideToolBlock(entry: ModelEntry, offset: number): boolean {
    const cst = entry.$cstNode;
    const open = queryBlockOpeningBrace(cst);
    if (!open || offset <= open.offset) {
        return false;
    }
    const close = closingBraceLeaf(cst);
    if (close && offset >= close.offset) {
        return false;
    }
    return true;
}

function cursorInsideToolBlockStringValue(root: CstNode, offset: number, entry: ModelEntry): boolean {
    if (isTableQuery(entry) && offsetInsideColumnMap(entry, offset)) {
        return cursorInsideColumnDescriptionValue(root, offset);
    }
    const leaf = CstUtils.findLeafNodeAtOffset(root, offset) ?? CstUtils.findLeafNodeBeforeOffset(root, offset);
    if (!leaf || !isLeafCstNode(leaf)) {
        return false;
    }
    if (leaf.text.startsWith('"') || leaf.text.startsWith("'")) {
        return offset >= leaf.offset && offset <= leaf.offset + leaf.text.length;
    }
    return false;
}

function matchesBlockKeywordPrefix(text: string, keys: readonly string[]): boolean {
    return keys.some((key) => key.startsWith(text) || text.startsWith(key));
}

function blockKeywordLeafAtOffset(entry: ModelEntry, offset: number, keys: readonly string[]): LeafCstNode | undefined {
    if (!offsetInsideToolBlock(entry, offset)) {
        return undefined;
    }
    if (isTableQuery(entry) && offsetInsideColumnMap(entry, offset)) {
        return undefined;
    }
    const cst = entry.$cstNode;
    if (!cst) {
        return undefined;
    }
    const leaf = CstUtils.findLeafNodeAtOffset(cst, offset) ?? CstUtils.findLeafNodeBeforeOffset(cst, offset);
    if (!leaf || !isLeafCstNode(leaf)) {
        return undefined;
    }
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(leaf.text)) {
        return undefined;
    }
    if (!matchesBlockKeywordPrefix(leaf.text, keys)) {
        return undefined;
    }
    return leaf;
}

function cursorAwaitingBlockKeyword(entry: ModelEntry, offset: number, keys: readonly string[]): boolean {
    if (!offsetInsideToolBlock(entry, offset)) {
        return false;
    }
    if (isTableQuery(entry) && offsetInsideColumnMap(entry, offset)) {
        return false;
    }
    return blockKeywordLeafAtOffset(entry, offset, keys) === undefined;
}

function blockKeywordItemsForEntry(
    entry: ModelEntry,
    root: CstNode,
    offset: number,
    textDoc: LangiumDocument['textDocument'],
    position: Position
): CompletionItem[] {
    const isSql = isSqlQuery(entry);
    const keys = isSql ? SQL_BLOCK_KEYS : QUERY_BLOCK_KEYS;
    const inserts = isSql ? SQL_BLOCK_KEYWORD_INSERT : TABLE_BLOCK_KEYWORD_INSERT;
    const used = isSql ? usedSqlBlockKeys(entry) : usedTableBlockKeys(entry);

    if (!offsetInsideToolBlock(entry, offset)) {
        return [];
    }
    if (isTableQuery(entry) && offsetInsideColumnMap(entry, offset)) {
        return [];
    }
    if (cursorInsideToolBlockStringValue(root, offset, entry)) {
        return [];
    }

    let candidates = keys.filter((key) => !used.has(key));

    const keywordLeaf = blockKeywordLeafAtOffset(entry, offset, keys);
    if (keywordLeaf) {
        const prefixEnd = Math.min(offset, keywordLeaf.offset + keywordLeaf.text.length);
        const typedPrefix = textDoc.getText({
            start: textDoc.positionAt(keywordLeaf.offset),
            end: textDoc.positionAt(prefixEnd)
        });
        candidates = candidates.filter((key) => key.startsWith(typedPrefix));
        if (candidates.length === 0) {
            return [];
        }
        return candidates.map((key) => ({
            label: key,
            kind: CompletionItemKind.Keyword,
            detail: isSql ? 'SQL block property' : 'Query block property',
            insertTextFormat: InsertTextFormat.Snippet,
            sortText: '1',
            textEdit: TextEdit.replace(keywordLeaf.range, inserts[key as keyof typeof inserts]),
            insertText: inserts[key as keyof typeof inserts]
        }));
    }

    if (!cursorAwaitingBlockKeyword(entry, offset, keys) || candidates.length === 0) {
        return [];
    }

    return candidates.map((key) => ({
        label: key,
        kind: CompletionItemKind.Keyword,
        detail: isSql ? 'SQL block property' : 'Query block property',
        insertTextFormat: InsertTextFormat.Snippet,
        sortText: '1',
        insertText: inserts[key as keyof typeof inserts],
        textEdit: TextEdit.insert(position, inserts[key as keyof typeof inserts])
    }));
}

function buildBlockKeywordCompletionItems(document: LangiumDocument, position: Position): CompletionItem[] {
    const root = document.parseResult.value?.$cstNode;
    const model = document.parseResult.value;
    if (!root || !isModel(model)) {
        return [];
    }

    const textDoc = document.textDocument;
    const offset = textDoc.offsetAt(position);
    const entry = resolveModelEntryAtOffset(model, root, offset);
    if (!entry) {
        return [];
    }

    return blockKeywordItemsForEntry(entry, root, offset, textDoc, position);
}

function resolveModelEntryAtOffset(model: Model, root: CstNode, offset: number): ModelEntry | undefined {
    let entry: ModelEntry | undefined = findTableQueryForTableCompletion(model, offset);
    if (!entry) {
        const leafAt = CstUtils.findLeafNodeAtOffset(root, offset) ?? CstUtils.findLeafNodeBeforeOffset(root, offset);
        if (leafAt) {
            const table = AstUtils.getContainerOfType(leafAt.astNode as AstNode, isTableQuery);
            if (table) {
                entry = table;
            } else {
                const sql = AstUtils.getContainerOfType(leafAt.astNode as AstNode, isSqlQuery);
                if (sql) {
                    entry = sql;
                }
            }
        }
    }
    return entry;
}

export class Db2AiDslCompletionProvider extends DefaultCompletionProvider {
    override readonly completionOptions: CompletionProviderOptions = {};

    override async getCompletion(
        document: LangiumDocument,
        params: CompletionParams,
        cancelToken?: Cancellation.CancellationToken
    ): Promise<CompletionList | undefined> {
        const columnItems = await this.buildColumnCompletionItems(document, params.position);
        debugCompletion('getCompletion columnItems count', columnItems.length);
        if (columnItems.length > 0) {
            return CompletionList.create(this.deduplicateItems(columnItems), false);
        }
        const tableItems = await this.buildTableCompletionItems(document, params.position);
        debugCompletion('getCompletion tableItems count', tableItems.length);
        if (tableItems.length > 0) {
            return CompletionList.create(this.deduplicateItems(tableItems), false);
        }
        const keywordItems = buildBlockKeywordCompletionItems(document, params.position);
        debugCompletion('getCompletion keywordItems count', keywordItems.length);
        if (keywordItems.length > 0) {
            return CompletionList.create(this.deduplicateItems(keywordItems), false);
        }
        return super.getCompletion(document, params, cancelToken);
    }

    private async buildSchemaItems(
        document: LangiumDocument,
        position: Position,
        buildItems: (query: TableQuery, loaded: LoadedSchema, offset: number) => CompletionItem[]
    ): Promise<CompletionItem[]> {
        const root = document.parseResult.value?.$cstNode;
        const model = document.parseResult.value;
        if (!root || !isModel(model) || !model.env) {
            return [];
        }

        const textDoc = document.textDocument;
        const offset = textDoc.offsetAt(position);
        const entry = resolveModelEntryAtOffset(model, root, offset);
        if (!entry || !isTableQuery(entry)) {
            return [];
        }
        const query = entry;

        const connectionUrl = resolveDatabaseUrlFromEnvForDocument(String(model.env), document.uri.toString());
        if (connectionUrl === undefined) {
            return [];
        }

        let loaded;
        try {
            loaded = await loadSchema(connectionUrl);
        } catch {
            return [];
        }

        return buildItems(query, loaded, offset);
    }

    private async buildColumnCompletionItems(document: LangiumDocument, position: Position): Promise<CompletionItem[]> {
        const root = document.parseResult.value?.$cstNode;
        if (!root) {
            return [];
        }
        const textDoc = document.textDocument;
        const offset = textDoc.offsetAt(position);

        return this.buildSchemaItems(document, position, (tableQuery, loaded) => {
            if (!tableQuery.columns || !offsetInsideColumnMap(tableQuery, offset)) {
                return [];
            }
            if (cursorInsideColumnDescriptionValue(root, offset)) {
                return [];
            }
            return columnItemsForQuery(tableQuery, offset, textDoc, position, loaded);
        });
    }

    private async buildTableCompletionItems(document: LangiumDocument, position: Position): Promise<CompletionItem[]> {
        const textDoc = document.textDocument;
        const offset = textDoc.offsetAt(position);

        return this.buildSchemaItems(document, position, (query, loaded) =>
            tableItemsForQuery(query, offset, textDoc, position, loaded.tables)
        );
    }
}
