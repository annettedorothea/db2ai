import { describe, expect, test } from 'vitest';
import { mysqlBindValues, postgresBindValues } from '../src/sql-params.js';

describe('SQL bind value order', () => {
    test('postgres uses one value per distinct placeholder index', () => {
        const sql = "SELECT 1 WHERE title LIKE '%' || $1 || '%' OR description LIKE '%' || $1 || '%' LIMIT $2";
        const valueByIndex = new Map<number, unknown>([
            [1, 'dragon'],
            [2, 15]
        ]);
        expect(postgresBindValues(sql, valueByIndex)).toEqual(['dragon', 15]);
    });

    test('mysql repeats values for each placeholder occurrence', () => {
        const sql = "SELECT 1 WHERE title LIKE CONCAT('%', $1, '%') OR description LIKE CONCAT('%', $1, '%') LIMIT $2";
        const valueByIndex = new Map<number, unknown>([
            [1, 'dragon'],
            [2, 15]
        ]);
        expect(mysqlBindValues(sql, valueByIndex)).toEqual(['dragon', 'dragon', 15]);
    });
});
