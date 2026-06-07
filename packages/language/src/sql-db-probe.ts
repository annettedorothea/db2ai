import type { ResolvedDatabaseDialect } from './dialect.js';
import { rewriteNamedPlaceholdersForDialect, rewriteNamedPlaceholdersForMysql } from './sql-params.js';

/** PostgreSQL dry-run probe SQL. Never use ANALYZE — that executes the statement. */
export function buildPostgresExplainSql(sqlText: string): string {
    return `EXPLAIN (VERBOSE) ${rewriteNamedPlaceholdersForDialect(sqlText, 'postgres')}`;
}

/** MySQL dry-run probe SQL with positional `?` placeholders. */
export function buildMysqlExplainSql(sqlText: string): string {
    return `EXPLAIN ${rewriteNamedPlaceholdersForMysql(sqlText)}`;
}

/** SQL Server dry-run probe (compile without execute). Implemented in SQL Server plan step. */
export function buildSqlserverExplainSql(sqlText: string): string {
    const rewritten = rewriteNamedPlaceholdersForDialect(sqlText, 'sqlserver');
    return `SET NOEXEC ON; ${rewritten}; SET NOEXEC OFF;`;
}

/** Oracle EXPLAIN PLAN cannot parse DML RETURNING; validate the base statement only. */
function stripOracleDmlReturningClause(sqlText: string): string {
    return sqlText
        .trim()
        .replace(/;\s*$/, '')
        .replace(/\bRETURNING\s+[\s\S]+$/i, '')
        .trim();
}

/** Oracle dry-run probe — parse/plan without executing DML. */
export function buildOracleExplainSql(sqlText: string): string {
    const explainTarget = stripOracleDmlReturningClause(sqlText);
    return `EXPLAIN PLAN FOR ${rewriteNamedPlaceholdersForDialect(explainTarget, 'oracle')}`;
}

export function buildExplainSqlForDialect(sqlText: string, dialect: ResolvedDatabaseDialect): string {
    switch (dialect) {
        case 'mysql':
        case 'mariadb':
            return buildMysqlExplainSql(sqlText);
        case 'sqlserver':
            return buildSqlserverExplainSql(sqlText);
        case 'oracle':
            return buildOracleExplainSql(sqlText);
        default:
            return buildPostgresExplainSql(sqlText);
    }
}
