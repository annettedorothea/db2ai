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
});
