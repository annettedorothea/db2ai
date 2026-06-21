export const MAX_SQL_LIMIT = 100;

export type SqlInvokeOptions = Record<string, unknown>;

function capPositiveInt(value: unknown, paramName: string, max: number): number {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 1) {
        throw new Error(`${paramName} must be a positive integer.`);
    }
    if (n > max) {
        throw new Error(`${paramName} must not exceed ${max}.`);
    }
    return Math.floor(n);
}

/** Cap SQL :limit param when present (no default injection). */
export function capSqlLimit(options: SqlInvokeOptions): SqlInvokeOptions {
    const raw = options.limit;
    if (raw == null || String(raw).trim() === '') {
        return options;
    }
    return { ...options, limit: capPositiveInt(raw, 'limit', MAX_SQL_LIMIT) };
}

/** Cap SQL :maxRows param when present (no default injection). */
export function capSqlMaxRows(options: SqlInvokeOptions): SqlInvokeOptions {
    const raw = options.maxRows;
    if (raw == null || String(raw).trim() === '') {
        return options;
    }
    return { ...options, maxRows: capPositiveInt(raw, 'maxRows', MAX_SQL_LIMIT) };
}
