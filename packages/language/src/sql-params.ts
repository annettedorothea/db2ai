import type { SqlParamEntry } from './generated/ast.js';
import type { SqlParamType } from './generated/ast.js';
import type { ResolvedDatabaseDialect } from './dialect.js';
import { parseSqlParamSpec, type ParsedSqlParamSpec } from './sql-param-spec.js';

/** Named SQL placeholders `:identifier` (not PostgreSQL casts `::type`). */
const NAMED_PLACEHOLDER_REGEX = /(?<![:\w]):([A-Za-z_][A-Za-z0-9_]*)/g;

export function namedPlaceholderRef(name: string): string {
    return `:${name}`;
}

/** First occurrence order; duplicates allowed (MySQL bind order). */
export function extractNamedPlaceholders(sql: string): string[] {
    const order: string[] = [];
    for (const match of sql.matchAll(NAMED_PLACEHOLDER_REGEX)) {
        const name = match[1];
        if (name) {
            order.push(name);
        }
    }
    return order;
}

/** Unique names in first-occurrence order (PostgreSQL bind order). */
export function extractUniqueNamedPlaceholders(sql: string): string[] {
    const seen = new Set<string>();
    const unique: string[] = [];
    for (const name of extractNamedPlaceholders(sql)) {
        if (!seen.has(name)) {
            seen.add(name);
            unique.push(name);
        }
    }
    return unique;
}

export function rewriteNamedPlaceholdersForPostgres(sql: string): string {
    const unique = extractUniqueNamedPlaceholders(sql);
    const nameToIndex = new Map(unique.map((name, i) => [name, i + 1]));
    return sql.replace(NAMED_PLACEHOLDER_REGEX, (_match, name: string) => {
        const index = nameToIndex.get(name);
        return index !== undefined ? `$${index}` : _match;
    });
}

export function rewriteNamedPlaceholdersForMysql(sql: string): string {
    return sql.replace(NAMED_PLACEHOLDER_REGEX, '?');
}

export function rewriteNamedPlaceholdersForSqlserver(sql: string): string {
    return sql.replace(NAMED_PLACEHOLDER_REGEX, (_match, name: string) => `@${name}`);
}

export function rewriteNamedPlaceholdersForDialect(sql: string, dialect: ResolvedDatabaseDialect): string {
    if (dialect === 'mysql') {
        return rewriteNamedPlaceholdersForMysql(sql);
    }
    if (dialect === 'sqlserver') {
        return rewriteNamedPlaceholdersForSqlserver(sql);
    }
    return rewriteNamedPlaceholdersForPostgres(sql);
}

export type ResolvedSqlParam = {
    placeholder: string;
    index: number;
    name: string;
    propertyName: string;
    description: string;
    example?: string;
    jsonSchemaType: SqlParamType;
};

export function resolveSqlParamEntry(entry: SqlParamEntry): ResolvedSqlParam & { parsed: ParsedSqlParamSpec } {
    const name = String(entry.key).trim();
    const parsed = parseSqlParamSpec(entry.spec);
    return {
        placeholder: namedPlaceholderRef(name),
        index: 0,
        name,
        propertyName: name,
        description: parsed.description ?? '',
        example: parsed.example,
        jsonSchemaType: parsed.paramType,
        parsed
    };
}

export function resolveSqlParams(entries: SqlParamEntry[]): Array<ResolvedSqlParam & { parsed: ParsedSqlParamSpec }> {
    return entries.map((entry) => resolveSqlParamEntry(entry));
}

export function resolveSqlParamsOrdered(
    entries: SqlParamEntry[],
    sql: string
): Array<ResolvedSqlParam & { parsed: ParsedSqlParamSpec }> {
    const resolved = resolveSqlParams(entries);
    const byName = new Map(resolved.map((p) => [p.name, p]));
    const order = extractUniqueNamedPlaceholders(sql);
    return order
        .map((name, i) => {
            const param = byName.get(name);
            if (!param) {
                return undefined;
            }
            return { ...param, index: i + 1 };
        })
        .filter((p): p is ResolvedSqlParam & { parsed: ParsedSqlParamSpec } => p !== undefined);
}

export function mysqlBindParamNames(sql: string): string[] {
    return extractNamedPlaceholders(sql);
}

/** One bind value per distinct named placeholder (PostgreSQL-style after rewrite to `$n`). */
export function postgresBindValues(sql: string, valueByName: ReadonlyMap<string, unknown>): unknown[] {
    return extractUniqueNamedPlaceholders(sql).map((name) => valueByName.get(name));
}

/** One bind value per `:name` occurrence (MySQL `?` after rewrite). */
export function mysqlBindValues(sql: string, valueByName: ReadonlyMap<string, unknown>): unknown[] {
    return extractNamedPlaceholders(sql).map((name) => valueByName.get(name));
}
