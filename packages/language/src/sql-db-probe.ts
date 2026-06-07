/** Rewrite logical `$n` placeholders to MySQL `?` (matches invoke + explain probes). */
export function rewriteLogicalPlaceholdersForMysql(sqlText: string): string {
    return sqlText.replace(/\$[0-9]+/g, '?');
}

/** PostgreSQL dry-run probe SQL. Never use ANALYZE — that executes the statement. */
export function buildPostgresExplainSql(sqlText: string): string {
    return `EXPLAIN (VERBOSE) ${sqlText}`;
}

/** MySQL dry-run probe SQL with positional `?` placeholders. */
export function buildMysqlExplainSql(sqlText: string): string {
    return `EXPLAIN ${rewriteLogicalPlaceholdersForMysql(sqlText)}`;
}
