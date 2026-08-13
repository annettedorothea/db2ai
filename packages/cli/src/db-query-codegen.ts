import type { Model, SqlQuery } from 'db-2-ai-dsl-language';
import { databaseDialectFromModel, isMysqlDialect, type ResolvedDatabaseDialect } from 'db-2-ai-dsl-language';
import {
    getAccessKind,
    getClientMayOmit,
    isSqlQuery,
    isAfterToolCallEnabled,
    isCheckToolAccessEnabled,
    isPrepareToolCallEnabled
} from 'db-2-ai-dsl-language';
import {
    jsonSchemaExampleValue,
    mysqlBindParamNames,
    resolveSqlParamsOrdered,
    rewriteNamedPlaceholdersForDialect,
    type ResolvedSqlParam
} from 'db-2-ai-dsl-language';
import { enrichJsonSchemaPropertyDescription } from '@toolfactory.dev/core/codegen';

export type JsonSchemaDict = Record<string, unknown>;

export type McpToolAnnotations = {
    readOnlyHint?: boolean;
    destructiveHint?: boolean;
    idempotentHint?: boolean;
    openWorldHint?: boolean;
};

export type ResolvedSqlToolCodegen = {
    kind: 'sql';
    toolName: string;
    title: string;
    description: string;
    sqlText: string;
    params: ResolvedSqlParam[];
    mysqlBindNames?: readonly string[];
    access: 'public' | 'protected';
    hasCheckToolAccess: boolean;
    hasPrepareToolCall: boolean;
    hasAfterToolCall: boolean;
    annotations?: McpToolAnnotations;
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
    const lines = [intent];
    const exampleCall = buildSqlExampleCallLine(params);
    if (exampleCall) {
        lines.push('', exampleCall);
    }
    const responseText = query.response?.trim();
    if (responseText) {
        lines.push('', `Response:\n${responseText}`);
    }
    return lines.join('\n');
}

function resolveToolAnnotations(query: SqlQuery): McpToolAnnotations | undefined {
    const source = query.annotations;
    if (!source) {
        return undefined;
    }
    const annotations: McpToolAnnotations = {};
    if (source.readOnlyHint !== undefined) {
        annotations.readOnlyHint = source.readOnlyHint;
    }
    if (source.destructiveHint !== undefined) {
        annotations.destructiveHint = source.destructiveHint;
    }
    if (source.idempotentHint !== undefined) {
        annotations.idempotentHint = source.idempotentHint;
    }
    if (source.openWorldHint !== undefined) {
        annotations.openWorldHint = source.openWorldHint;
    }
    return Object.keys(annotations).length > 0 ? annotations : undefined;
}

function resolveSqlTool(query: SqlQuery, dialect: ResolvedDatabaseDialect): ResolvedSqlToolCodegen {
    const logicalSql = query.query !== undefined ? String(query.query) : '';
    const entries = query.params?.entries ?? [];
    const params = resolveSqlParamsOrdered(entries, logicalSql);
    const sqlText = rewriteNamedPlaceholdersForDialect(logicalSql, dialect);
    const annotations = resolveToolAnnotations(query);
    return {
        kind: 'sql',
        toolName: requireToolName(query.toolName, 'SQL tool'),
        title: buildSqlTitle(query),
        description: buildSqlDescription(query, params),
        sqlText,
        params,
        mysqlBindNames: isMysqlDialect(dialect) ? mysqlBindParamNames(logicalSql) : undefined,
        access: getAccessKind(query),
        hasCheckToolAccess: isCheckToolAccessEnabled(query),
        hasPrepareToolCall: isPrepareToolCallEnabled(query),
        hasAfterToolCall: isAfterToolCallEnabled(query),
        ...(annotations ? { annotations } : {})
    };
}

export function resolveToolsFromModel(model: Model): ResolvedDbToolCodegen[] {
    const dialect = databaseDialectFromModel(model);
    const tools: ResolvedDbToolCodegen[] = [];
    for (const entry of model.entries) {
        if (isSqlQuery(entry)) {
            tools.push(resolveSqlTool(entry, dialect));
        }
    }
    return tools;
}

function buildSqlInputSchema(tool: ResolvedSqlToolCodegen, optionalParams: readonly string[]): JsonSchemaDict {
    const properties: Record<string, unknown> = {};
    const required: string[] = [];
    const optional = new Set(optionalParams.map((p) => p.trim()).filter((p) => p.length > 0));
    for (const p of tool.params) {
        const prop: JsonSchemaDict = {
            type: p.jsonSchemaType
        };
        if (p.example !== undefined && p.example.trim().length > 0) {
            prop.examples = [jsonSchemaExampleValue(p.example, p.jsonSchemaType)];
        }
        prop.description = enrichJsonSchemaPropertyDescription(`${p.description} (SQL ${p.placeholder})`, prop);
        properties[p.propertyName] = prop;
        if (!optional.has(p.propertyName)) {
            required.push(p.propertyName);
        }
    }
    return {
        type: 'object',
        properties,
        required,
        additionalProperties: false
    };
}

export function buildInputSchemaByTool(model: Model, tools: ResolvedDbToolCodegen[]): Record<string, JsonSchemaDict> {
    const out: Record<string, JsonSchemaDict> = {};
    for (const tool of tools) {
        const query = model.entries.find((e) => isSqlQuery(e) && e.toolName?.trim() === tool.toolName);
        const clientMayOmit = query && isSqlQuery(query) ? getClientMayOmit(query) : [];
        out[tool.toolName] = buildSqlInputSchema(tool, clientMayOmit);
    }
    return out;
}

export function quotePostgresIdent(ident: string): string {
    return `"${ident.replace(/"/g, '""')}"`;
}

export function quoteMysqlIdent(ident: string): string {
    return `\`${ident.replace(/`/g, '``')}\``;
}
