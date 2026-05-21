import type { Model, SqlQuery, TableQuery } from 'db-2-ai-dsl-language';
import { DEFAULT_MAX_LIMIT_CAP, DEFAULT_PAGE_LIMIT } from 'db-2-ai-dsl-language';
import { isSqlQuery, isTableQuery } from 'db-2-ai-dsl-language';
import { resolveSqlParamsOrdered, type ResolvedSqlParam } from 'db-2-ai-dsl-language';

export type JsonSchemaDict = Record<string, unknown>;

export type ResolvedTableToolCodegen = {
    kind: 'table';
    toolName: string;
    title: string;
    description: string;
    table: string;
    maxLimitCap: number;
    example?: string;
};

export type ResolvedSqlToolCodegen = {
    kind: 'sql';
    toolName: string;
    title: string;
    description: string;
    sqlText: string;
    params: ResolvedSqlParam[];
    example?: string;
};

export type ResolvedDbToolCodegen = ResolvedTableToolCodegen | ResolvedSqlToolCodegen;

function requireToolName(toolName: string | undefined, context: string): string {
    if (toolName === undefined || String(toolName).trim().length === 0) {
        throw new Error(`Codegen: ${context} is missing required \`toolName\`. Re-run after validation passes.`);
    }
    return String(toolName).trim();
}

function requireIntent(intent: string | undefined, context: string): string {
    if (intent === undefined || String(intent).trim().length === 0) {
        throw new Error(`Codegen: ${context} is missing required \`intent\`. Re-run after validation passes.`);
    }
    return String(intent).trim();
}

function buildTableTitle(query: TableQuery): string {
    const summary = query.summary?.trim();
    if (summary && summary.length > 0) {
        return summary;
    }
    const table = query.table?.name ?? 'table';
    return `List ${table}`;
}

function buildSqlTitle(query: SqlQuery): string {
    const summary = query.summary?.trim();
    if (summary && summary.length > 0) {
        return summary;
    }
    return requireToolName(query.toolName, 'SQL tool');
}

function buildColumnDescriptionLines(query: TableQuery): string[] {
    const entries = query.columns?.entries;
    if (!entries || entries.length === 0) {
        return [];
    }
    const lines = ['', 'Columns returned:'];
    for (const entry of entries) {
        const name = entry.name?.trim();
        const description = entry.description?.trim();
        if (!name) {
            continue;
        }
        if (description && description.length > 0) {
            lines.push(`- ${name} — ${description}`);
        } else {
            lines.push(`- ${name}`);
        }
    }
    return lines;
}

function buildSqlParamDescriptionLines(query: SqlQuery): string[] {
    const entries = query.params?.entries;
    if (!entries || entries.length === 0) {
        return [];
    }
    const sqlText = query.query !== undefined ? String(query.query) : '';
    const ordered = resolveSqlParamsOrdered(
        entries.map(e => ({ placeholder: String(e.placeholder), label: String(e.label) })),
        sqlText
    );
    const lines = ['', 'Parameters:'];
    for (const p of ordered) {
        lines.push(`- ${p.propertyName} (${p.placeholder}): ${p.label}`);
    }
    return lines;
}

function buildTableDescription(query: TableQuery): string {
    const intent = requireIntent(query.intent, 'table query');
    const table = query.table?.name ?? 'table';
    const lines = [
        intent,
        '',
        `Runs SELECT * FROM public.${table} with LIMIT/OFFSET.`,
        'Pagination: pass `limit` (default 100) and `offset` (default 0).',
        'Next page: same `limit`, increase `offset` (e.g. limit 20, offset 20 for page 2).',
        ...buildColumnDescriptionLines(query)
    ];
    if (query.example?.trim()) {
        lines.push('', `Example: ${query.example.trim()}`);
    }
    return lines.join('\n');
}

function buildSqlDescription(query: SqlQuery): string {
    const intent = requireIntent(query.intent, 'SQL tool');
    const lines = [
        intent,
        '',
        'Runs a prepared SQL statement. Pass parameter values by name (see input schema).',
        ...buildSqlParamDescriptionLines(query)
    ];
    if (query.example?.trim()) {
        lines.push('', `Example: ${query.example.trim()}`);
    }
    return lines.join('\n');
}

function resolveMaxLimitCap(query: TableQuery): number {
    if (query.maxLimit !== undefined) {
        const cap = typeof query.maxLimit === 'number' ? query.maxLimit : Number(query.maxLimit);
        if (Number.isFinite(cap) && cap >= 1) {
            return cap;
        }
    }
    return DEFAULT_MAX_LIMIT_CAP;
}

function resolveTableTool(query: TableQuery): ResolvedTableToolCodegen {
    return {
        kind: 'table',
        toolName: requireToolName(query.toolName, 'table query'),
        title: buildTableTitle(query),
        description: buildTableDescription(query),
        table: query.table?.name ?? '',
        maxLimitCap: resolveMaxLimitCap(query),
        example: query.example
    };
}

function resolveSqlTool(query: SqlQuery): ResolvedSqlToolCodegen {
    const sqlText = query.query !== undefined ? String(query.query) : '';
    const entries = query.params?.entries ?? [];
    const params = resolveSqlParamsOrdered(
        entries.map(e => ({ placeholder: String(e.placeholder), label: String(e.label) })),
        sqlText
    );
    return {
        kind: 'sql',
        toolName: requireToolName(query.toolName, 'SQL tool'),
        title: buildSqlTitle(query),
        description: buildSqlDescription(query),
        sqlText,
        params,
        example: query.example
    };
}

export function resolveToolsFromModel(model: Model): ResolvedDbToolCodegen[] {
    const tools: ResolvedDbToolCodegen[] = [];
    for (const entry of model.entries) {
        if (isTableQuery(entry)) {
            tools.push(resolveTableTool(entry));
        } else if (isSqlQuery(entry)) {
            tools.push(resolveSqlTool(entry));
        }
    }
    return tools;
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

function buildSqlInputSchema(tool: ResolvedSqlToolCodegen): JsonSchemaDict {
    const properties: Record<string, unknown> = {};
    const required: string[] = [];
    for (const p of tool.params) {
        properties[p.propertyName] = {
            type: 'string',
            description: `${p.label} (SQL ${p.placeholder})`
        };
        required.push(p.propertyName);
    }
    return {
        type: 'object',
        properties,
        required,
        additionalProperties: false
    };
}

export function buildInputSchemaByTool(tools: ResolvedDbToolCodegen[]): Record<string, JsonSchemaDict> {
    const out: Record<string, JsonSchemaDict> = {};
    for (const tool of tools) {
        if (tool.kind === 'table') {
            out[tool.toolName] = buildPaginationInputSchema();
        } else {
            out[tool.toolName] = buildSqlInputSchema(tool);
        }
    }
    return out;
}

export function quotePostgresIdent(ident: string): string {
    return `"${ident.replace(/"/g, '""')}"`;
}
