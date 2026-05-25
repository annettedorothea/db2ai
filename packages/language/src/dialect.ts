import type { Model } from './generated/ast.js';

export type ResolvedDatabaseDialect = 'postgres' | 'mysql';

export const DEFAULT_DATABASE_DIALECT: ResolvedDatabaseDialect = 'postgres';

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
    return DEFAULT_DATABASE_DIALECT;
}

export function databaseDialectFromModel(model: Pick<Model, 'dialect'>): ResolvedDatabaseDialect {
    return normalizeDatabaseDialect(model.dialect);
}

export function databaseDialectDisplayName(dialect: ResolvedDatabaseDialect): string {
    return dialect === 'mysql' ? 'MySQL' : 'PostgreSQL';
}

export function databaseSchemaDescription(dialect: ResolvedDatabaseDialect): string {
    return dialect === 'mysql' ? 'current database schema' : 'public schema';
}

export function isSupportedConnectionUrlForDialect(dialect: ResolvedDatabaseDialect, connectionUrl: string): boolean {
    const trimmed = connectionUrl.trim();
    if (dialect === 'mysql') {
        return trimmed.startsWith('mysql://');
    }
    return trimmed.startsWith('postgresql://') || trimmed.startsWith('postgres://');
}

export function expectedConnectionUrlDescription(dialect: ResolvedDatabaseDialect): string {
    return dialect === 'mysql' ? 'mysql:// URL' : 'postgresql:// or postgres:// URL';
}
