import { describe, expect, test } from 'vitest';
import {
    connectionUrlForMysqlDriver,
    databaseDialectFromModel,
    isSupportedConnectionUrlForDialect,
    normalizeDatabaseDialect
} from '../src/dialect.js';

describe('dialect', () => {
    test('normalizes mariadb dialect', () => {
        expect(normalizeDatabaseDialect('mariadb')).toBe('mariadb');
        expect(
            databaseDialectFromModel({
                dialect: 'mariadb'
            })
        ).toBe('mariadb');
    });

    test('accepts mariadb:// URLs only for mariadb dialect', () => {
        expect(isSupportedConnectionUrlForDialect('mariadb', 'mariadb://user:pass@localhost:3306/sakila')).toBe(true);
        expect(isSupportedConnectionUrlForDialect('mariadb', 'mysql://user:pass@localhost:3306/sakila')).toBe(false);
        expect(isSupportedConnectionUrlForDialect('mysql', 'mariadb://user:pass@localhost:3306/sakila')).toBe(false);
        expect(isSupportedConnectionUrlForDialect('mysql', 'mysql://user:pass@localhost:3306/sakila')).toBe(true);
    });

    test('rewrites mariadb:// to mysql:// for mysql2 driver', () => {
        expect(connectionUrlForMysqlDriver('mariadb://user:pass@localhost:3306/sakila')).toBe(
            'mysql://user:pass@localhost:3306/sakila'
        );
        expect(connectionUrlForMysqlDriver('mysql://user:pass@localhost:3306/sakila')).toBe(
            'mysql://user:pass@localhost:3306/sakila'
        );
    });

    test('normalizes duckdb dialect (no URL)', () => {
        expect(normalizeDatabaseDialect('duckdb')).toBe('duckdb');
        expect(
            databaseDialectFromModel({
                dialect: 'duckdb'
            })
        ).toBe('duckdb');
        expect(isSupportedConnectionUrlForDialect('duckdb', 'postgresql://localhost/db')).toBe(false);
    });

    test('normalizes oracle dialect and accepts oracle:// URLs', () => {
        expect(normalizeDatabaseDialect('oracle')).toBe('oracle');
        expect(
            databaseDialectFromModel({
                dialect: 'oracle'
            })
        ).toBe('oracle');
        expect(isSupportedConnectionUrlForDialect('oracle', 'oracle://plants:pass@localhost:55221/FREEPDB1')).toBe(
            true
        );
        expect(isSupportedConnectionUrlForDialect('oracle', 'mysql://plants:pass@localhost:55221/FREEPDB1')).toBe(
            false
        );
    });
});
