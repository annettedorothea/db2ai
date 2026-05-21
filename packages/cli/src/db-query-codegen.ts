import type { Model, Query } from 'db-2-ai-dsl-language';
import { DEFAULT_MAX_LIMIT_CAP, DEFAULT_PAGE_LIMIT } from 'db-2-ai-dsl-language';

export type ResolvedDbToolCodegen = {
    toolName: string;
    title: string;
    description: string;
    table: string;
    maxLimitCap: number;
    example?: string;
};

export type JsonSchemaDict = Record<string, unknown>;

function requireToolName(query: Query): string {
    if (query.toolName === undefined || String(query.toolName).trim().length === 0) {
        throw new Error('Codegen: query is missing required `toolName`. Re-run after validation passes.');
    }
    return String(query.toolName).trim();
}

function requireIntent(query: Query): string {
    if (query.intent === undefined || String(query.intent).trim().length === 0) {
        throw new Error('Codegen: query is missing required `intent`. Re-run after validation passes.');
    }
    return String(query.intent).trim();
}

function buildTitle(query: Query): string {
    const summary = query.summary?.trim();
    if (summary && summary.length > 0) {
        return summary;
    }
    const table = query.table?.name ?? 'table';
    return `List ${table}`;
}

function buildDescription(query: Query): string {
    const intent = requireIntent(query);
    const table = query.table?.name ?? 'table';
    const lines = [
        intent,
        '',
        `Runs SELECT * FROM public.${table} with LIMIT/OFFSET.`,
        'Pagination: pass `limit` (default 100) and `offset` (default 0).',
        'Next page: same `limit`, increase `offset` (e.g. limit 20, offset 20 for page 2).'
    ];
    if (query.example?.trim()) {
        lines.push('', `Example: ${query.example.trim()}`);
    }
    return lines.join('\n');
}

function resolveMaxLimitCap(query: Query): number {
    if (query.maxLimit !== undefined) {
        const cap = typeof query.maxLimit === 'number' ? query.maxLimit : Number(query.maxLimit);
        if (Number.isFinite(cap) && cap >= 1) {
            return cap;
        }
    }
    return DEFAULT_MAX_LIMIT_CAP;
}

export function resolveToolsFromModel(model: Model): ResolvedDbToolCodegen[] {
    return model.queries.map(query => ({
        toolName: requireToolName(query),
        title: buildTitle(query),
        description: buildDescription(query),
        table: query.table?.name ?? '',
        maxLimitCap: resolveMaxLimitCap(query),
        example: query.example
    }));
}

export function buildPaginationInputSchema(): JsonSchemaDict {
    return {
        type: 'object',
        properties: {
            limit: {
                type: 'integer',
                minimum: 1,
                default: DEFAULT_PAGE_LIMIT,
                description: `Rows per page (default ${DEFAULT_PAGE_LIMIT}).`
            },
            offset: {
                type: 'integer',
                minimum: 0,
                default: 0,
                description: 'Rows to skip for pagination (default 0).'
            }
        },
        required: [],
        additionalProperties: false
    };
}

export function buildInputSchemaByTool(tools: ResolvedDbToolCodegen[]): Record<string, JsonSchemaDict> {
    const schema = buildPaginationInputSchema();
    const out: Record<string, JsonSchemaDict> = {};
    for (const tool of tools) {
        out[tool.toolName] = schema;
    }
    return out;
}

export function quotePostgresIdent(ident: string): string {
    return `"${ident.replace(/"/g, '""')}"`;
}
