import type { Model } from './generated/ast.js';

export type ResolvedDatabaseDialect = 'postgres' | 'mysql' | 'mariadb' | 'sqlserver';

export const DEFAULT_DATABASE_DIALECT: ResolvedDatabaseDialect = 'postgres';

export function isMysqlDialect(dialect: ResolvedDatabaseDialect): boolean {
    return dialect === 'mysql' || dialect === 'mariadb';
}

/** mysql2 expects `mysql://`; rewrite MariaDB URLs at connect time. */
export function connectionUrlForMysqlDriver(connectionUrl: string): string {
    const trimmed = connectionUrl.trim();
    if (trimmed.startsWith('mariadb://')) {
        return `mysql://${trimmed.slice('mariadb://'.length)}`;
    }
    return trimmed;
}

export function normalizeDatabaseDialect(value: string | undefined): ResolvedDatabaseDialect {
    if (value === undefined || value.trim().length === 0) {
        return DEFAULT_DATABASE_DIALECT;
    }
    const normalized = value.trim().toLowerCase();
    if (normalized === 'postgres' || normalized === 'postgresql') {
        return 'postgres';
    }
    if (normalized === 'mysql') {
        return 'mysql';
    }
    if (normalized === 'mariadb') {
        return 'mariadb';
    }
    if (normalized === 'sqlserver' || normalized === 'mssql') {
        return 'sqlserver';
    }
    return DEFAULT_DATABASE_DIALECT;
}

export function databaseDialectFromModel(model: Pick<Model, 'dialect'>): ResolvedDatabaseDialect {
    return normalizeDatabaseDialect(model.dialect);
}

export function databaseDialectDisplayName(dialect: ResolvedDatabaseDialect): string {
    switch (dialect) {
        case 'mysql':
            return 'MySQL';
        case 'mariadb':
            return 'MariaDB';
        case 'sqlserver':
            return 'SQL Server';
        default:
            return 'PostgreSQL';
    }
}

export function databaseSchemaDescription(dialect: ResolvedDatabaseDialect): string {
    switch (dialect) {
        case 'mysql':
        case 'mariadb':
            return 'current database schema';
        case 'sqlserver':
            return 'dbo schema';
        default:
            return 'public schema';
    }
}

export function isSupportedConnectionUrlForDialect(dialect: ResolvedDatabaseDialect, connectionUrl: string): boolean {
    const trimmed = connectionUrl.trim();
    switch (dialect) {
        case 'mysql':
            return trimmed.startsWith('mysql://');
        case 'mariadb':
            return trimmed.startsWith('mariadb://');
        case 'sqlserver':
            return trimmed.startsWith('sqlserver://') || trimmed.startsWith('mssql://');
        default:
            return trimmed.startsWith('postgresql://') || trimmed.startsWith('postgres://');
    }
}

export function expectedConnectionUrlDescription(dialect: ResolvedDatabaseDialect): string {
    switch (dialect) {
        case 'mysql':
            return 'mysql:// URL';
        case 'mariadb':
            return 'mariadb:// URL';
        case 'sqlserver':
            return 'sqlserver:// or mssql:// URL';
        default:
            return 'postgresql:// or postgres:// URL';
    }
}
