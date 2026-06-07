import type { ValidationAcceptor } from 'langium';
import type { SqlParamEntry, SqlQuery } from './generated/ast.js';
import { extractNamedPlaceholders, extractUniqueNamedPlaceholders } from './sql-params.js';
import { RESERVED_SQL_PARAM_NAMES, parseExampleAsType, parseSqlParamSpec } from './sql-param-spec.js';

export function checkSqlQuery(sqlQuery: SqlQuery, accept: ValidationAcceptor): void {
    checkSqlRequiredKeys(sqlQuery, accept);
    checkSqlParamMap(sqlQuery, accept);
}

function checkSqlRequiredKeys(sqlQuery: SqlQuery, accept: ValidationAcceptor): void {
    if (sqlQuery.toolName === undefined) {
        accept('error', 'SQL tool requires `toolName: <id>`.', { node: sqlQuery, property: 'toolName' });
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

function checkParamKey(entry: SqlParamEntry, accept: ValidationAcceptor): void {
    const key = entry.key !== undefined ? String(entry.key).trim() : '';
    if (key.length === 0) {
        accept('error', 'Param map key must be a valid identifier.', { node: entry, property: 'key' });
        return;
    }
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
        accept('error', `Param key "${key}" must be a valid identifier.`, { node: entry, property: 'key' });
    } else if (RESERVED_SQL_PARAM_NAMES.has(key)) {
        accept('error', `Param key "${key}" is reserved (use a different name).`, {
            node: entry,
            property: 'key'
        });
    }
}

function checkSqlParamSpec(entry: SqlParamEntry, accept: ValidationAcceptor): void {
    checkParamKey(entry, accept);

    const spec = entry.spec;
    if (!spec) {
        accept('error', 'Param requires a spec block `{ description: "…" }`.', {
            node: entry,
            property: 'spec'
        });
        return;
    }

    const parsed = parseSqlParamSpec(spec);
    if (parsed.description === undefined || parsed.description.trim().length === 0) {
        accept('error', 'Param spec requires `description: "..."`.', { node: spec, property: 'fields' });
    }

    if (parsed.example !== undefined) {
        const typeError = parseExampleAsType(parsed.example, parsed.paramType);
        if (typeError) {
            accept('error', typeError, { node: spec, property: 'fields' });
        }
    }
}

function checkUniqueParamKeys(entries: SqlParamEntry[], accept: ValidationAcceptor): void {
    const seen = new Map<string, SqlParamEntry>();
    for (const entry of entries) {
        const key = entry.key !== undefined ? String(entry.key).trim() : '';
        if (!key) {
            continue;
        }
        const prior = seen.get(key);
        if (prior) {
            accept('error', `Duplicate param key "${key}". Keys must be unique within this SQL tool.`, {
                node: entry,
                property: 'key'
            });
        } else {
            seen.set(key, entry);
        }
    }
}

function checkSqlParamMap(sqlQuery: SqlQuery, accept: ValidationAcceptor): void {
    const queryText = sqlQuery.query !== undefined ? String(sqlQuery.query) : '';
    const placeholdersInQuery = extractUniqueNamedPlaceholders(queryText);
    const entries = sqlQuery.params?.entries ?? [];

    if (placeholdersInQuery.length > 0 && entries.length === 0) {
        accept('error', 'SQL tool with `:name` placeholders in `query` requires a `params: { … }` block.', {
            node: sqlQuery,
            property: 'params'
        });
        return;
    }

    const seenKeys = new Set<string>();
    for (const entry of entries) {
        checkSqlParamSpec(entry, accept);

        const key = entry.key !== undefined ? String(entry.key).trim() : '';
        if (key.length === 0) {
            continue;
        }
        if (seenKeys.has(key)) {
            accept('error', `Duplicate param key "${key}". Each key may appear at most once.`, {
                node: entry,
                property: 'key'
            });
            continue;
        }
        seenKeys.add(key);

        if (!placeholdersInQuery.includes(key)) {
            accept('error', `Param "${key}" is not used in \`query\` (no matching :${key}).`, {
                node: entry,
                property: 'key'
            });
        }
    }

    checkUniqueParamKeys(entries, accept);

    for (const name of placeholdersInQuery) {
        if (!seenKeys.has(name)) {
            accept('error', `Query uses :${name} but \`params\` has no entry for "${name}".`, {
                node: sqlQuery,
                property: 'query'
            });
        }
    }

    const allOccurrences = extractNamedPlaceholders(queryText);
    for (const name of allOccurrences) {
        if (!seenKeys.has(name)) {
            break;
        }
    }
}
