import { describe, expect, test } from 'vitest';
import { collectSqlBindValueExpressions } from '../src/generator/invoke-render.js';

describe('collectSqlBindValueExpressions', () => {
    const params = [
        {
            placeholder: '$1',
            index: 1,
            name: 'searchText',
            propertyName: 'searchText',
            description: 'search',
            jsonSchemaType: 'string' as const
        },
        {
            placeholder: '$2',
            index: 2,
            name: 'maxRows',
            propertyName: 'maxRows',
            description: 'limit',
            jsonSchemaType: 'integer' as const
        }
    ];

    const sql =
        "SELECT film_id FROM film WHERE title ILIKE '%' || $1 || '%' OR description ILIKE '%' || $1 || '%' ORDER BY title LIMIT $2";

    test('postgres emits one expression per unique placeholder', () => {
        const exprs = collectSqlBindValueExpressions(sql, 'postgres', params, 'options');
        expect(exprs).toHaveLength(2);
        expect(exprs[0]).toContain('options["searchText"]');
        expect(exprs[1]).toContain('normalizePostgresNumericParamValue');
    });

    test('mysql emits one expression per placeholder occurrence', () => {
        const exprs = collectSqlBindValueExpressions(sql, 'mysql', params, 'options');
        expect(exprs).toHaveLength(3);
        expect(exprs[0]).toContain('options["searchText"]');
        expect(exprs[1]).toContain('options["searchText"]');
        expect(exprs[2]).toContain('normalizeMysqlParamValue');
    });
});
