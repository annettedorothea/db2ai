import type { CompletionParams, CompletionItem, Position } from 'vscode-languageserver';
import { CompletionItemKind, CompletionList, InsertTextFormat, TextEdit } from 'vscode-languageserver';
import type { CompletionProviderOptions } from 'langium/lsp';
import { DefaultCompletionProvider } from 'langium/lsp';
import type { AstNode, CstNode, LangiumDocument, LeafCstNode } from 'langium';
import { AstUtils, Cancellation, CstUtils, isLeafCstNode } from 'langium';
import {
    isModel,
    isSqlParamEntry,
    isSqlParamSpec,
    isSqlQuery,
    type Model,
    type SqlParamEntry,
    type SqlParamSpec,
    type SqlQuery
} from './generated/ast.js';
import { usedSqlParamSpecFieldKinds } from './sql-param-spec.js';

const SQL_BLOCK_KEYS = ['toolName', 'intent', 'query', 'summary', 'params'] as const;
type SqlBlockKey = (typeof SQL_BLOCK_KEYS)[number];
const SQL_PARAM_SPEC_KEYS = ['name', 'description', 'example', 'type'] as const;
type SqlParamSpecKey = (typeof SQL_PARAM_SPEC_KEYS)[number];

const SQL_KEYWORD_SORT: Record<SqlBlockKey, string> = {
    toolName: '0100',
    intent: '0101',
    query: '0102',
    summary: '0103',
    params: '0107'
};

const SQL_PARAM_SPEC_SORT: Record<SqlParamSpecKey, string> = {
    name: '0200',
    description: '0201',
    example: '0202',
    type: '0203'
};

const SQL_BLOCK_KEYWORD_INSERT: Record<SqlBlockKey, string> = {
    toolName: 'toolName: "$1"$0',
    intent: 'intent: "$1"$0',
    query: 'query: "$1"$0',
    summary: 'summary: "$1"$0',
    params: 'params: {\n    $1: {\n        name: $2\n        description: "$3"\n        example: "$4"\n        type: $5\n    }\n}$0'
};

const SQL_PARAM_SPEC_INSERT: Record<SqlParamSpecKey, string> = {
    name: 'name: $1$0',
    description: 'description: "$1"$0',
    example: 'example: "$1"$0',
    type: 'type: $1$0'
};

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

function queryBlockOpeningBrace(queryCst: CstNode | undefined): LeafCstNode | undefined {
    return openingBraceLeaf(queryCst);
}

function usedSqlBlockKeys(query: SqlQuery): Set<string> {
    const used = new Set<string>();
    if (query.toolName !== undefined) {
        used.add('toolName');
    }
    if (query.intent !== undefined) {
        used.add('intent');
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

function sqlParamSpecCst(entry: SqlParamEntry): CstNode | undefined {
    return entry.spec?.$cstNode;
}

function offsetInsideSqlParamSpec(entry: SqlParamEntry, offset: number): boolean {
    const cst = sqlParamSpecCst(entry);
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

function sqlParamMapCst(query: { params?: { $cstNode?: CstNode } }): CstNode | undefined {
    return query.params?.$cstNode;
}

function offsetInsideSqlParamMap(query: { params?: { $cstNode?: CstNode } }, offset: number): boolean {
    const cst = sqlParamMapCst(query);
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

function findSqlParamEntryAtOffset(
    query: { params?: { entries?: SqlParamEntry[] } },
    root: CstNode,
    offset: number
): SqlParamEntry | undefined {
    for (const entry of query.params?.entries ?? []) {
        if (offsetInsideSqlParamSpec(entry, offset)) {
            return entry;
        }
    }
    const leaf = CstUtils.findLeafNodeAtOffset(root, offset) ?? CstUtils.findLeafNodeBeforeOffset(root, offset);
    if (leaf) {
        const spec = AstUtils.getContainerOfType(leaf.astNode as AstNode, isSqlParamSpec);
        if (spec && isSqlParamSpec(spec)) {
            const parent = spec.$container;
            if (isSqlParamEntry(parent)) {
                return parent;
            }
        }
    }
    return undefined;
}

function nextSqlParamSpecKey(used: Set<string>): SqlParamSpecKey | undefined {
    for (const key of SQL_PARAM_SPEC_KEYS) {
        if (!used.has(key)) {
            return key;
        }
    }
    return undefined;
}

function paramSpecKeywordLeafAtOffset(
    spec: SqlParamSpec,
    offset: number,
    keys: readonly SqlParamSpecKey[]
): LeafCstNode | undefined {
    const cst = spec.$cstNode;
    if (!cst) {
        return undefined;
    }
    const leaf = CstUtils.findLeafNodeAtOffset(cst, offset) ?? CstUtils.findLeafNodeBeforeOffset(cst, offset);
    if (!leaf || !isLeafCstNode(leaf)) {
        return undefined;
    }
    if (keys.includes(leaf.text as SqlParamSpecKey)) {
        return leaf;
    }
    if (matchesBlockKeywordPrefix(leaf.text, keys)) {
        return leaf;
    }
    return undefined;
}

function cursorInsideParamSpecStringValue(root: CstNode, offset: number, spec: SqlParamSpec): boolean {
    const leaf = CstUtils.findLeafNodeAtOffset(root, offset) ?? CstUtils.findLeafNodeBeforeOffset(root, offset);
    if (!leaf || !isLeafCstNode(leaf)) {
        return false;
    }
    if (!(leaf.text.startsWith('"') || leaf.text.startsWith("'"))) {
        return false;
    }
    const specCst = spec.$cstNode;
    if (!specCst) {
        return false;
    }
    return offset >= leaf.offset && offset <= leaf.offset + leaf.text.length;
}

function buildSqlParamSpecCompletionItems(
    spec: SqlParamSpec,
    root: CstNode,
    offset: number,
    textDoc: LangiumDocument['textDocument'],
    position: Position
): CompletionItem[] {
    const used = usedSqlParamSpecFieldKinds(spec);
    const nextKey = nextSqlParamSpecKey(used);
    if (!nextKey) {
        return [];
    }

    if (cursorInsideParamSpecStringValue(root, offset, spec)) {
        return [];
    }

    const keywordLeaf = paramSpecKeywordLeafAtOffset(spec, offset, SQL_PARAM_SPEC_KEYS);
    if (keywordLeaf) {
        const prefixEnd = Math.min(offset, keywordLeaf.offset + keywordLeaf.text.length);
        const typedPrefix = textDoc.getText({
            start: textDoc.positionAt(keywordLeaf.offset),
            end: textDoc.positionAt(prefixEnd)
        });
        const candidates = SQL_PARAM_SPEC_KEYS.filter((key) => key.startsWith(typedPrefix) && !used.has(key));
        if (candidates.length === 0) {
            return [];
        }
        const ordered = candidates.filter((k) => k === nextKey);
        const keysToOffer = ordered.length > 0 ? ordered : [nextKey];
        return keysToOffer.map((key) => ({
            label: key,
            kind: CompletionItemKind.Keyword,
            detail: 'SQL param property',
            insertTextFormat: InsertTextFormat.Snippet,
            sortText: SQL_PARAM_SPEC_SORT[key],
            textEdit: TextEdit.replace(keywordLeaf.range, SQL_PARAM_SPEC_INSERT[key]),
            insertText: SQL_PARAM_SPEC_INSERT[key]
        }));
    }

    const specCst = spec.$cstNode;
    const open = openingBraceLeaf(specCst);
    if (!open || offset <= open.offset) {
        return [];
    }
    const close = closingBraceLeaf(specCst);
    if (close && offset >= close.offset) {
        return [];
    }

    return [
        {
            label: nextKey,
            kind: CompletionItemKind.Keyword,
            detail: 'SQL param property',
            insertTextFormat: InsertTextFormat.Snippet,
            sortText: SQL_PARAM_SPEC_SORT[nextKey],
            insertText: SQL_PARAM_SPEC_INSERT[nextKey],
            textEdit: TextEdit.insert(position, SQL_PARAM_SPEC_INSERT[nextKey])
        }
    ];
}

function offsetInsideToolBlock(entry: { $cstNode?: CstNode }, offset: number): boolean {
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

function cursorInsideToolBlockStringValue(
    root: CstNode,
    offset: number,
    entry: { params?: { entries?: SqlParamEntry[] } }
): boolean {
    const paramEntry = findSqlParamEntryAtOffset(entry, root, offset);
    if (paramEntry?.spec && offsetInsideSqlParamSpec(paramEntry, offset)) {
        return cursorInsideParamSpecStringValue(root, offset, paramEntry.spec);
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

function blockKeywordLeafAtOffset(
    entry: { $cstNode?: CstNode },
    offset: number,
    keys: readonly string[]
): LeafCstNode | undefined {
    if (!offsetInsideToolBlock(entry, offset)) {
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

function cursorAwaitingBlockKeyword(entry: { $cstNode?: CstNode }, offset: number, keys: readonly string[]): boolean {
    if (!offsetInsideToolBlock(entry, offset)) {
        return false;
    }
    return blockKeywordLeafAtOffset(entry, offset, keys) === undefined;
}

function blockKeywordItemsForSqlQuery(
    query: SqlQuery,
    root: CstNode,
    offset: number,
    textDoc: LangiumDocument['textDocument'],
    position: Position
): CompletionItem[] {
    const used = usedSqlBlockKeys(query);

    if (!offsetInsideToolBlock(query, offset)) {
        return [];
    }
    const paramEntry = findSqlParamEntryAtOffset(query, root, offset);
    if (paramEntry?.spec && offsetInsideSqlParamSpec(paramEntry, offset)) {
        return buildSqlParamSpecCompletionItems(paramEntry.spec, root, offset, textDoc, position);
    }
    if (offsetInsideSqlParamMap(query, offset)) {
        return [];
    }
    if (cursorInsideToolBlockStringValue(root, offset, query)) {
        return [];
    }

    let candidates = SQL_BLOCK_KEYS.filter((key) => !used.has(key));

    const keywordLeaf = blockKeywordLeafAtOffset(query, offset, SQL_BLOCK_KEYS);
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
            detail: 'SQL block property',
            insertTextFormat: InsertTextFormat.Snippet,
            sortText: SQL_KEYWORD_SORT[key],
            textEdit: TextEdit.replace(keywordLeaf.range, SQL_BLOCK_KEYWORD_INSERT[key]),
            insertText: SQL_BLOCK_KEYWORD_INSERT[key]
        }));
    }

    if (!cursorAwaitingBlockKeyword(query, offset, SQL_BLOCK_KEYS) || candidates.length === 0) {
        return [];
    }

    return candidates.map((key) => ({
        label: key,
        kind: CompletionItemKind.Keyword,
        detail: 'SQL block property',
        insertTextFormat: InsertTextFormat.Snippet,
        sortText: SQL_KEYWORD_SORT[key],
        insertText: SQL_BLOCK_KEYWORD_INSERT[key],
        textEdit: TextEdit.insert(position, SQL_BLOCK_KEYWORD_INSERT[key])
    }));
}

function resolveSqlQueryAtOffset(model: Model, root: CstNode, offset: number) {
    const leafAt = CstUtils.findLeafNodeAtOffset(root, offset) ?? CstUtils.findLeafNodeBeforeOffset(root, offset);
    if (!leafAt) {
        return undefined;
    }
    return AstUtils.getContainerOfType(leafAt.astNode as AstNode, isSqlQuery);
}

function buildBlockKeywordCompletionItems(document: LangiumDocument, position: Position): CompletionItem[] {
    const root = document.parseResult.value?.$cstNode;
    const model = document.parseResult.value;
    if (!root || !isModel(model)) {
        return [];
    }

    const textDoc = document.textDocument;
    const offset = textDoc.offsetAt(position);
    const query = resolveSqlQueryAtOffset(model, root, offset);
    if (!query) {
        return [];
    }

    return blockKeywordItemsForSqlQuery(query, root, offset, textDoc, position);
}

export class Db2AiDslCompletionProvider extends DefaultCompletionProvider {
    override readonly completionOptions: CompletionProviderOptions = {};

    override async getCompletion(
        document: LangiumDocument,
        params: CompletionParams,
        cancelToken?: Cancellation.CancellationToken
    ): Promise<CompletionList | undefined> {
        const keywordItems = buildBlockKeywordCompletionItems(document, params.position);
        if (keywordItems.length > 0) {
            return CompletionList.create(this.deduplicateItems(keywordItems), false);
        }
        return super.getCompletion(document, params, cancelToken);
    }
}
