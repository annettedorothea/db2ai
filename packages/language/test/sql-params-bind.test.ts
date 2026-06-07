import { describe, expect, test } from 'vitest';
import { mysqlBindValues, postgresBindValues, rewriteNamedPlaceholdersForDialect } from '../src/sql-params.js';

describe('SQL bind value order', () => {
    test('postgres uses one value per distinct named placeholder', () => {
        const sql =
            "SELECT 1 WHERE title LIKE '%' || :searchText || '%' OR description LIKE '%' || :searchText || '%' LIMIT :maxRows";
        const valueByName = new Map<string, unknown>([
            ['searchText', 'dragon'],
            ['maxRows', 15]
        ]);
        expect(postgresBindValues(sql, valueByName)).toEqual(['dragon', 15]);
    });

    test('postgres rewrite reuses the same $n for repeated :name', () => {
        const sql =
            "SELECT 1 WHERE title ILIKE '%' || :searchText || '%' OR description ILIKE '%' || :searchText || '%' LIMIT :maxRows";
        expect(rewriteNamedPlaceholdersForDialect(sql, 'postgres')).toBe(
            "SELECT 1 WHERE title ILIKE '%' || $1 || '%' OR description ILIKE '%' || $1 || '%' LIMIT $2"
        );
    });

    test('oracle keeps native :name placeholders', () => {
        const sql =
            "SELECT 1 FROM plants WHERE common_name LIKE '%' || :searchText || '%' FETCH FIRST :maxRows ROWS ONLY";
        expect(rewriteNamedPlaceholdersForDialect(sql, 'oracle')).toBe(sql);
    });

    test('mysql repeats values for each placeholder occurrence', () => {
        const sql =
            "SELECT 1 WHERE title LIKE CONCAT('%', :searchText, '%') OR description LIKE CONCAT('%', :searchText, '%') LIMIT :maxRows";
        const valueByName = new Map<string, unknown>([
            ['searchText', 'dragon'],
            ['maxRows', 15]
        ]);
        expect(mysqlBindValues(sql, valueByName)).toEqual(['dragon', 'dragon', 15]);
    });
});
