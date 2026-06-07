import { describe, expect, test } from 'vitest';
import { buildMysqlExplainSql, buildPostgresExplainSql, buildSqlserverExplainSql } from '../src/sql-db-probe.js';

describe('sql-db-probe', () => {
    test('buildPostgresExplainSql prefixes EXPLAIN (VERBOSE) and rewrites named placeholders', () => {
        const sql = 'SELECT * FROM film LIMIT :limit OFFSET :offset';
        const probe = buildPostgresExplainSql(sql);
        expect(probe).toBe('EXPLAIN (VERBOSE) SELECT * FROM film LIMIT $1 OFFSET $2');
        expect(probe).not.toContain('ANALYZE');
    });

    test('buildPostgresExplainSql works for INSERT with RETURNING', () => {
        const sql = 'INSERT INTO orders (customer_id, product_id) VALUES (:customerId, :productId) RETURNING order_id';
        expect(buildPostgresExplainSql(sql)).toBe(
            'EXPLAIN (VERBOSE) INSERT INTO orders (customer_id, product_id) VALUES ($1, $2) RETURNING order_id'
        );
    });

    test('buildMysqlExplainSql prefixes EXPLAIN and rewrites named placeholders', () => {
        const sql = "SELECT * FROM film WHERE title LIKE CONCAT('%', :searchText, '%') LIMIT :maxRows";
        expect(buildMysqlExplainSql(sql)).toBe(
            "EXPLAIN SELECT * FROM film WHERE title LIKE CONCAT('%', ?, '%') LIMIT ?"
        );
    });

    test('buildSqlserverExplainSql uses SET NOEXEC ON batch with @param rewrites', () => {
        const sql = 'SELECT TOP (:limit) product_id FROM products ORDER BY product_id';
        expect(buildSqlserverExplainSql(sql)).toBe(
            'SET NOEXEC ON; SELECT TOP (@limit) product_id FROM products ORDER BY product_id; SET NOEXEC OFF;'
        );
    });
});
