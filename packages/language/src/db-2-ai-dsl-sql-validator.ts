import type { ValidationAcceptor } from 'langium';
import { CstUtils, isLeafCstNode } from 'langium';
import type { SqlQuery } from './generated/ast.js';
import { extractPlaceholderNumbers } from './sql-params.js';

export const SQL_BLOCK_KEYS = ['toolName', 'intent', 'example', 'summary', 'query', 'params'] as const;

export function checkSqlQuery(sqlQuery: SqlQuery, accept: ValidationAcceptor): void {
    checkSqlRequiredKeys(sqlQuery, accept);
    reportSqlDuplicateBlockKeys(sqlQuery, accept);
    checkSqlParamMap(sqlQuery, accept);
}

function checkSqlRequiredKeys(sqlQuery: SqlQuery, accept: ValidationAcceptor): void {
    if (sqlQuery.toolName === undefined) {
        accept('error', 'SQL tool requires `toolName: "..."`.', { node: sqlQuery, property: 'toolName' });
    } else if (String(sqlQuery.toolName).trim().length === 0) {
        accept('error', 'SQL tool `toolName` must not be empty.', { node: sqlQuery, property: 'toolName' });
    }
    if (sqlQuery.intent === undefined) {
        accept('error', 'SQL tool requires `intent: "..."`.', { node: sqlQuery, property: 'intent' });
    } else if (String(sqlQuery.intent).trim().length === 0) {
        accept('error', 'SQL tool `intent` must not be empty.', { node: sqlQuery, property: 'intent' });
    }
    if (sqlQuery.query === undefined || String(sqlQuery.query).trim().length === 0) {
        accept('error', 'SQL tool requires `query: "..."`.', { node: sqlQuery, property: 'query' });
    }
}

function reportSqlDuplicateBlockKeys(sqlQuery: SqlQuery, accept: ValidationAcceptor): void {
    const cst = sqlQuery.$cstNode;
    if (!cst) {
        return;
    }
    const allowed = new Set<string>(SQL_BLOCK_KEYS);
    const seen = new Set<string>();
    for (const leaf of CstUtils.flattenCst(cst)) {
        if (!isLeafCstNode(leaf)) {
            continue;
        }
        const text = leaf.text;
        if (!allowed.has(text)) {
            continue;
        }
        if (!seen.has(text)) {
            seen.add(text);
            continue;
        }
        accept('error', `Duplicate key "${text}". Each property may appear at most once per block.`, {
            node: sqlQuery,
            range: leaf.range
        });
    }
}

function checkSqlParamMap(sqlQuery: SqlQuery, accept: ValidationAcceptor): void {
    const queryText = sqlQuery.query !== undefined ? String(sqlQuery.query) : '';
    const placeholdersInQuery = extractPlaceholderNumbers(queryText);
    const entries = sqlQuery.params?.entries ?? [];

    if (placeholdersInQuery.length > 0 && entries.length === 0) {
        accept('error', 'SQL tool with `$n` placeholders in `query` requires a `params: { … }` block.', {
            node: sqlQuery,
            property: 'params'
        });
        return;
    }

    const seenPlaceholders = new Set<string>();
    for (const entry of entries) {
        const ph = entry.placeholder;
        if (ph === undefined || ph.trim().length === 0) {
            continue;
        }
        if (seenPlaceholders.has(ph)) {
            accept('error', `Duplicate param key "${ph}". Each placeholder may appear at most once.`, {
                node: entry,
                property: 'placeholder'
            });
            continue;
        }
        seenPlaceholders.add(ph);

        const index = Number.parseInt(ph.replace(/^\$/, ''), 10);
        if (!placeholdersInQuery.includes(index)) {
            accept('error', `Param "${ph}" is not used in \`query\`.`, {
                node: entry,
                property: 'placeholder'
            });
        }
    }

    for (const n of placeholdersInQuery) {
        const ph = `$${n}`;
        if (!seenPlaceholders.has(ph)) {
            accept('error', `Query uses ${ph} but \`params\` has no entry for it.`, {
                node: sqlQuery,
                property: 'query'
            });
        }
    }
}
