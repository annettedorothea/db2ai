/** Extract `$1`, `$2`, … placeholders from SQL text (PostgreSQL style). */
const SQL_PLACEHOLDER_REGEX = /\$([0-9]+)/g;

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

export function isValidMcpPropertyName(name: string): boolean {
    return /^[A-Za-z_][A-Za-z0-9_]*$/.test(name);
}

export type ResolvedSqlParam = {
    placeholder: string;
    index: number;
    label: string;
    propertyName: string;
};

export function resolveSqlParams(
    entries: Array<{ placeholder: string; label: string }>
): ResolvedSqlParam[] {
    return entries.map(entry => {
        const index = Number.parseInt(entry.placeholder.replace(/^\$/, ''), 10);
        const label = entry.label.trim();
        const propertyName = isValidMcpPropertyName(label) ? label : `param${index}`;
        return {
            placeholder: entry.placeholder,
            index,
            label,
            propertyName
        };
    });
}

export function resolveSqlParamsOrdered(
    entries: Array<{ placeholder: string; label: string }>,
    sql: string
): ResolvedSqlParam[] {
    const resolved = resolveSqlParams(entries);
    const order = extractPlaceholderNumbers(sql);
    const byIndex = new Map(resolved.map(p => [p.index, p]));
    return order.map(n => byIndex.get(n)).filter((p): p is ResolvedSqlParam => p !== undefined);
}
