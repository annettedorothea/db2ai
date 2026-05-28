import * as path from 'node:path';
import type { ResolvedDatabaseDialect, ResolvedSqlParam, SqlParamType } from 'db-2-ai-dsl-language';
import type { ResolvedDbToolCodegen, ResolvedSqlToolCodegen, ResolvedTableToolCodegen } from '../db-query-codegen.js';

export type GeneratedSqlParam = {
    placeholder: string;
    index: number;
    name: string;
    propertyName: string;
    description: string;
    example?: string;
    jsonSchemaType: SqlParamType;
};

export type GeneratedToolModule = {
    toolName: string;
    title: string;
    description: string;
    kind: 'table' | 'sql';
    table?: string;
    maxLimitCap?: number;
    sqlText?: string;
    example?: string;
    params?: GeneratedSqlParam[];
};

function serializeSqlParam(param: ResolvedSqlParam): GeneratedSqlParam {
    return {
        placeholder: param.placeholder,
        index: param.index,
        name: param.name,
        propertyName: param.propertyName,
        description: param.description,
        example: param.example,
        jsonSchemaType: param.jsonSchemaType
    };
}

function toGeneratedToolModule(tool: ResolvedDbToolCodegen): GeneratedToolModule {
    if (tool.kind === 'table') {
        const tableTool: ResolvedTableToolCodegen = tool;
        return {
            kind: 'table',
            toolName: tableTool.toolName,
            title: tableTool.title,
            description: tableTool.description,
            table: tableTool.table,
            maxLimitCap: tableTool.maxLimitCap,
            example: tableTool.example
        };
    }
    const sqlTool: ResolvedSqlToolCodegen = tool;
    return {
        kind: 'sql',
        toolName: sqlTool.toolName,
        title: sqlTool.title,
        description: sqlTool.description,
        sqlText: sqlTool.sqlText,
        params: sqlTool.params.map(serializeSqlParam)
    };
}

function serializeJsonForModule(value: unknown): string {
    return JSON.stringify(value, null, 4);
}

function serializeToolsForModule(tools: ResolvedDbToolCodegen[]): string {
    return serializeJsonForModule(tools.map(toGeneratedToolModule));
}

function renderSourceReference(source: string): string {
    return path.basename(source);
}

export function renderMcpServerIdentityExports(name: string, version: string): string {
    return `export const mcpServerName = ${JSON.stringify(name)};
export const mcpServerVersion = ${JSON.stringify(version)};
`;
}

export function renderTsModule(
    tools: ResolvedDbToolCodegen[],
    connectionEnv: string,
    databaseDialect: ResolvedDatabaseDialect,
    mcpServerIdentityBlock: string,
    toolRuntimeBlock: string,
    source: string
): string {
    const toolsLiteral = serializeToolsForModule(tools);
    const sourceRef = renderSourceReference(source);
    return `/**
 * Generated from: ${sourceRef}
 */

export const connectionEnv = ${JSON.stringify(connectionEnv)};

export const databaseDialect = ${JSON.stringify(databaseDialect)};

export const requiresAuth = false;

export type GeneratedSqlParam = {
    placeholder: string;
    index: number;
    name: string;
    propertyName: string;
    description: string;
    example?: string;
    jsonSchemaType: 'string' | 'integer' | 'number' | 'boolean';
};

export type GeneratedTool = {
    toolName: string;
    title: string;
    description: string;
    kind: 'table' | 'sql';
    table?: string;
    maxLimitCap?: number;
    sqlText?: string;
    example?: string;
    params?: GeneratedSqlParam[];
};

export const generatedTools: GeneratedTool[] = ${toolsLiteral};

${mcpServerIdentityBlock}
${toolRuntimeBlock}
`;
}

export function renderJsModule(
    tools: ResolvedDbToolCodegen[],
    connectionEnv: string,
    databaseDialect: ResolvedDatabaseDialect,
    mcpServerIdentityBlock: string,
    toolRuntimeBlock: string,
    source: string
): string {
    const sourceRef = renderSourceReference(source);
    return `/**
 * Generated from: ${sourceRef}
 */

export const connectionEnv = ${JSON.stringify(connectionEnv)};

export const databaseDialect = ${JSON.stringify(databaseDialect)};

export const requiresAuth = false;

export const generatedTools = ${serializeToolsForModule(tools)};

${mcpServerIdentityBlock}
${toolRuntimeBlock}
`;
}
