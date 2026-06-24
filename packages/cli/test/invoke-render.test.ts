import { describe, expect, test } from 'vitest';
import { collectSqlBindValueExpressions, renderInvokeBlockTs } from '../src/generator/invoke-render.js';
import type { ResolvedSqlToolCodegen } from '../src/db-query-codegen.js';

describe('renderInvokeBlockTs', () => {
    test('omits compactSqlForLog when there are no SQL tools', () => {
        const block = renderInvokeBlockTs([], 'postgres', false, 'none', {
            authorizers: false,
            preparers: false
        });
        expect(block).not.toContain('compactSqlForLog');
        expect(block).toContain('_options: InvokeOptions = {}');
    });
});

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
        access: 'public',
        hasAuthorize: false,
        hasPrepare: false
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

    test('mariadb uses the same bind expressions as mysql', () => {
        const mysqlExprs = collectSqlBindValueExpressions(tool, 'mysql', 'options');
        const mariadbExprs = collectSqlBindValueExpressions(tool, 'mariadb', 'options');
        expect(mariadbExprs).toEqual(mysqlExprs);
    });

    test('oracle emits one expression per unique named placeholder', () => {
        const exprs = collectSqlBindValueExpressions(tool, 'oracle', 'options');
        expect(exprs).toHaveLength(2);
        expect(exprs[0]).toContain('options["searchText"]');
        expect(exprs[1]).toContain('normalizeOracleNumericParamValue');
    });
});
