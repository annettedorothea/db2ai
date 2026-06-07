import { describe, expect, test } from 'vitest';
import { collectSqlBindValueExpressions } from '../src/generator/invoke-render.js';
import type { ResolvedSqlToolCodegen } from '../src/db-query-codegen.js';

describe('collectSqlBindValueExpressions', () => {
    const tool: ResolvedSqlToolCodegen = {
        kind: 'sql',
        toolName: 'searchFilms',
        title: 'Search films',
        description: '',
        sqlText:
            "SELECT film_id FROM film WHERE title ILIKE '%' || $1 || '%' OR description ILIKE '%' || $1 || '%' ORDER BY title LIMIT $2",
        params: [
            {
                placeholder: ':searchText',
                index: 1,
                name: 'searchText',
                propertyName: 'searchText',
                description: 'search',
                jsonSchemaType: 'string'
            },
            {
                placeholder: ':maxRows',
                index: 2,
                name: 'maxRows',
                propertyName: 'maxRows',
                description: 'limit',
                jsonSchemaType: 'integer'
            }
        ],
        mysqlBindNames: ['searchText', 'searchText', 'maxRows'],
        access: 'public'
    };

    test('postgres emits one expression per unique placeholder', () => {
        const exprs = collectSqlBindValueExpressions(tool, 'postgres', 'options');
        expect(exprs).toHaveLength(2);
        expect(exprs[0]).toContain('options["searchText"]');
        expect(exprs[1]).toContain('normalizePostgresNumericParamValue');
    });

    test('mysql emits one expression per placeholder occurrence', () => {
        const exprs = collectSqlBindValueExpressions(tool, 'mysql', 'options');
        expect(exprs).toHaveLength(3);
        expect(exprs[0]).toContain('options["searchText"]');
        expect(exprs[1]).toContain('options["searchText"]');
        expect(exprs[2]).toContain('normalizeMysqlParamValue');
    });
});
