import { describe, expect, test } from 'vitest';
import {
    buildMysqlExplainSql,
    buildPostgresExplainSql,
    rewriteLogicalPlaceholdersForMysql
} from '../src/sql-db-probe.js';

describe('sql-db-probe', () => {
    test('buildPostgresExplainSql prefixes EXPLAIN (VERBOSE) without ANALYZE', () => {
        const sql = 'SELECT * FROM film LIMIT $1 OFFSET $2';
        const probe = buildPostgresExplainSql(sql);
        expect(probe).toBe(`EXPLAIN (VERBOSE) ${sql}`);
        expect(probe).not.toContain('ANALYZE');
    });

    test('buildPostgresExplainSql works for INSERT with RETURNING', () => {
        const sql = 'INSERT INTO orders (customer_id, product_id) VALUES ($1, $2) RETURNING order_id';
        expect(buildPostgresExplainSql(sql)).toBe(`EXPLAIN (VERBOSE) ${sql}`);
    });

    test('rewriteLogicalPlaceholdersForMysql replaces each $n with ?', () => {
        expect(rewriteLogicalPlaceholdersForMysql('SELECT 1 WHERE a = $1 AND b = $2')).toBe(
            'SELECT 1 WHERE a = ? AND b = ?'
        );
    });

    test('buildMysqlExplainSql prefixes EXPLAIN and rewrites placeholders', () => {
        const sql = "SELECT * FROM film WHERE title LIKE CONCAT('%', $1, '%') LIMIT $2";
        expect(buildMysqlExplainSql(sql)).toBe(
            "EXPLAIN SELECT * FROM film WHERE title LIKE CONCAT('%', ?, '%') LIMIT ?"
        );
    });
});
