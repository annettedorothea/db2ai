/** Extract `$1`, `$2`, … placeholders from SQL text (PostgreSQL style). */
const SQL_PLACEHOLDER_REGEX = /\$([0-9]+)/g;

import type { SqlParamEntry } from './generated/ast.js';
import { parseSqlParamSpec, type ParsedSqlParamSpec } from './sql-param-spec.js';
import type { SqlParamType } from './generated/ast.js';

export function extractPlaceholderNumbers(sql: string): number[] {
    const seen = new Set<number>();
    for (const match of sql.matchAll(SQL_PLACEHOLDER_REGEX)) {
        const n = Number.parseInt(match[1] ?? '', 10);
        if (Number.isFinite(n) && n >= 1) {
            seen.add(n);
        }
    }
    return [...seen].sort((a, b) => a - b);
}

export function placeholderRef(n: number): string {
    return `$${n}`;
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
    const index = Number.parseInt(String(entry.placeholder).replace(/^\$/, ''), 10);
    const parsed = parseSqlParamSpec(entry.spec);
    const name = parsed.name ?? '';
    return {
        placeholder: String(entry.placeholder),
        index,
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
    const order = extractPlaceholderNumbers(sql);
    const byIndex = new Map(resolved.map((p) => [p.index, p]));
    return order
        .map((n) => byIndex.get(n))
        .filter((p): p is ResolvedSqlParam & { parsed: ParsedSqlParamSpec } => p !== undefined);
}

/** One bind value per distinct `$n` (PostgreSQL-style). */
export function postgresBindValues(sql: string, valueByIndex: ReadonlyMap<number, unknown>): unknown[] {
    return extractPlaceholderNumbers(sql).map((n) => valueByIndex.get(n));
}

/** One bind value per `$n` occurrence (MySQL `?` after rewrite). */
export function mysqlBindValues(sql: string, valueByIndex: ReadonlyMap<number, unknown>): unknown[] {
    const values: unknown[] = [];
    for (const match of sql.matchAll(SQL_PLACEHOLDER_REGEX)) {
        const n = Number.parseInt(match[1] ?? '', 10);
        values.push(valueByIndex.get(n));
    }
    return values;
}
