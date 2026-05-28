import type { ValidationAcceptor } from 'langium';
import type { SqlParamEntry, SqlQuery } from './generated/ast.js';
import { extractPlaceholderNumbers } from './sql-params.js';
import { RESERVED_SQL_PARAM_NAMES, parseExampleAsType, parseSqlParamSpec } from './sql-param-spec.js';

export function checkSqlQuery(sqlQuery: SqlQuery, accept: ValidationAcceptor): void {
    checkSqlRequiredKeys(sqlQuery, accept);
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

function checkSqlParamSpec(entry: SqlParamEntry, accept: ValidationAcceptor): void {
    const spec = entry.spec;
    if (!spec) {
        accept('error', 'Param requires a spec block `{ name: …, description: "…" }`.', {
            node: entry,
            property: 'spec'
        });
        return;
    }

    const parsed = parseSqlParamSpec(spec);
    if (parsed.name === undefined || parsed.name.length === 0) {
        accept('error', 'Param spec requires `name: identifier`.', { node: spec, property: 'fields' });
    } else if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(parsed.name)) {
        accept('error', `Param name "${parsed.name}" must be a valid identifier.`, { node: spec, property: 'fields' });
    } else if (RESERVED_SQL_PARAM_NAMES.has(parsed.name)) {
        accept('error', `Param name "${parsed.name}" is reserved (use a different name).`, {
            node: spec,
            property: 'fields'
        });
    }

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

function checkUniqueParamNames(entries: SqlParamEntry[], accept: ValidationAcceptor): void {
    const seen = new Map<string, SqlParamEntry>();
    for (const entry of entries) {
        const parsed = parseSqlParamSpec(entry.spec);
        const name = parsed.name;
        if (!name) {
            continue;
        }
        const prior = seen.get(name);
        if (prior) {
            accept('error', `Duplicate param name "${name}". Names must be unique within this SQL tool.`, {
                node: entry,
                property: 'spec'
            });
        } else {
            seen.set(name, entry);
        }
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
        checkSqlParamSpec(entry, accept);

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

    checkUniqueParamNames(entries, accept);

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
