import type { Model, SqlQuery } from 'db-2-ai-dsl-language';
import { isSqlQuery } from 'db-2-ai-dsl-language';
import { jsonSchemaExampleValue, resolveSqlParamsOrdered, type ResolvedSqlParam } from 'db-2-ai-dsl-language';

export type JsonSchemaDict = Record<string, unknown>;

export type ResolvedSqlToolCodegen = {
    kind: 'sql';
    toolName: string;
    title: string;
    description: string;
    sqlText: string;
    params: ResolvedSqlParam[];
};

export type ResolvedDbToolCodegen = ResolvedSqlToolCodegen;

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

function buildSqlTitle(query: SqlQuery): string {
    const summary = query.summary?.trim();
    if (summary && summary.length > 0) {
        return summary;
    }
    return requireToolName(query.toolName, 'SQL tool');
}

function buildSqlParamDescriptionLines(params: ResolvedSqlParam[]): string[] {
    if (params.length === 0) {
        return [];
    }
    const lines = ['', 'Parameters:'];
    for (const p of params) {
        let line = `- ${p.propertyName} (${p.placeholder}): ${p.description}`;
        if (p.example !== undefined && p.example.trim().length > 0) {
            line += ` (example: ${p.example.trim()})`;
        }
        lines.push(line);
    }
    return lines;
}

function buildSqlExampleCallLine(params: ResolvedSqlParam[]): string | undefined {
    const parts = params
        .filter((p) => p.example !== undefined && p.example.trim().length > 0)
        .map((p) => `${p.propertyName}=${p.example!.trim()}`);
    if (parts.length === 0) {
        return undefined;
    }
    return `Example call: ${parts.join(', ')}`;
}

function buildSqlDescription(query: SqlQuery, params: ResolvedSqlParam[]): string {
    const intent = requireIntent(query.intent, 'SQL tool');
    const lines = [
        intent,
        '',
        'Runs a prepared SQL statement. Pass parameter values by name (see input schema).',
        ...buildSqlParamDescriptionLines(params)
    ];
    const exampleCall = buildSqlExampleCallLine(params);
    if (exampleCall) {
        lines.push('', exampleCall);
    }
    return lines.join('\n');
}

function resolveSqlTool(query: SqlQuery): ResolvedSqlToolCodegen {
    const sqlText = query.query !== undefined ? String(query.query) : '';
    const entries = query.params?.entries ?? [];
    const params = resolveSqlParamsOrdered(entries, sqlText);
    return {
        kind: 'sql',
        toolName: requireToolName(query.toolName, 'SQL tool'),
        title: buildSqlTitle(query),
        description: buildSqlDescription(query, params),
        sqlText,
        params
    };
}

export function resolveToolsFromModel(model: Model): ResolvedDbToolCodegen[] {
    const tools: ResolvedDbToolCodegen[] = [];
    for (const entry of model.entries) {
        if (isSqlQuery(entry)) {
            tools.push(resolveSqlTool(entry));
        }
    }
    return tools;
}

function buildSqlInputSchema(tool: ResolvedSqlToolCodegen): JsonSchemaDict {
    const properties: Record<string, unknown> = {};
    const required: string[] = [];
    for (const p of tool.params) {
        const prop: Record<string, unknown> = {
            type: p.jsonSchemaType,
            description: `${p.description} (SQL ${p.placeholder})`
        };
        if (p.example !== undefined && p.example.trim().length > 0) {
            prop.examples = [jsonSchemaExampleValue(p.example, p.jsonSchemaType)];
        }
        properties[p.propertyName] = prop;
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
        out[tool.toolName] = buildSqlInputSchema(tool);
    }
    return out;
}

export function quotePostgresIdent(ident: string): string {
    return `"${ident.replace(/"/g, '""')}"`;
}

export function quoteMysqlIdent(ident: string): string {
    return `\`${ident.replace(/`/g, '``')}\``;
}
