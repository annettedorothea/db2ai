export type OracleDmlReturningPrepared = {
    sqlText: string;
    returningColumns: string[];
    outBindNames: string[];
};

function parseReturningColumnList(text: string): string[] {
    return text
        .split(',')
        .map((part) => part.trim())
        .map((part) => {
            const dot = part.lastIndexOf('.');
            return dot >= 0 ? part.slice(dot + 1).trim() : part;
        })
        .filter((col) => col.length > 0);
}

/** True when the column name looks like a numeric identifier (e.g. plant_id). */
export function isOracleNumericReturningColumn(column: string): boolean {
    const bare = column.includes('.') ? column.slice(column.lastIndexOf('.') + 1) : column;
    return /_id$/i.test(bare) || /^id$/i.test(bare);
}

/**
 * Oracle DML RETURNING requires `INTO` bind variables. Accept Postgres-style
 * `RETURNING col1, col2` and append generated OUT bind placeholders.
 * OUT bind names use `retN` — must start with a letter (node-oracledb parser rule).
 */
export function prepareOracleDmlReturning(sqlText: string): OracleDmlReturningPrepared | undefined {
    const trimmed = sqlText.trim().replace(/;\s*$/, '');
    if (!/\b(INSERT|UPDATE|DELETE)\b/i.test(trimmed)) {
        return undefined;
    }

    const returningMatch = trimmed.match(/\bRETURNING\s+([\s\S]+)$/i);
    if (!returningMatch || returningMatch.index === undefined) {
        return undefined;
    }

    const returningPart = returningMatch[1].trim();
    if (/\s+INTO\s+/i.test(returningPart)) {
        return undefined;
    }

    const columns = parseReturningColumnList(returningPart);
    if (columns.length === 0) {
        return undefined;
    }

    const outBindNames = columns.map((_, index) => `ret${index}`);
    const intoClause = outBindNames.map((name) => `:${name}`).join(', ');
    const sqlWithoutReturning = trimmed.slice(0, returningMatch.index).trimEnd();
    const prepared = `${sqlWithoutReturning} RETURNING ${columns.join(', ')} INTO ${intoClause}`;

    return { sqlText: prepared, returningColumns: columns, outBindNames };
}
