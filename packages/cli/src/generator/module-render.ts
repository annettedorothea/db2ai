import * as path from 'node:path';
import type { Model } from 'db-2-ai-dsl-language';
import {
    getAccessKind,
    isSqlQuery,
    type AccessKind,
    type ResolvedDatabaseDialect,
    type ResolvedSqlParam,
    type SqlParamType
} from 'db-2-ai-dsl-language';
import type { ResolvedDbToolCodegen } from '../db-query-codegen.js';

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
    kind: 'sql';
    access: AccessKind;
    sqlText: string;
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
    return {
        kind: 'sql',
        toolName: tool.toolName,
        title: tool.title,
        description: tool.description,
        access: tool.access,
        sqlText: tool.sqlText,
        params: tool.params.map(serializeSqlParam)
    };
}

function requiresAuthLiteral(model: Model): string {
    if (!model.auth) {
        return 'false';
    }
    const needsCredential = model.entries.some((entry) => isSqlQuery(entry) && getAccessKind(entry) !== 'public');
    return needsCredential ? 'true' : 'false';
}

function renderGeneratedImports(mcpHostJwtImport: string, parameterCheckerImports: string): string {
    const lines = [mcpHostJwtImport, parameterCheckerImports].filter((line) => line.length > 0);
    return lines.length > 0 ? `${lines.join('\n')}\n\n` : '';
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
    model: Model,
    source: string,
    parameterCheckerImports = '',
    mcpHostJwtImport = ''
): string {
    const toolsLiteral = serializeToolsForModule(tools);
    const sourceRef = renderSourceReference(source);
    const importPrefix = renderGeneratedImports(mcpHostJwtImport, parameterCheckerImports);
    return `/**
 * Generated from: ${sourceRef}
 */
${importPrefix}export const connectionEnv = ${JSON.stringify(connectionEnv)};

export const databaseDialect = ${JSON.stringify(databaseDialect)};

export const requiresAuth = ${requiresAuthLiteral(model)};

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
    kind: 'sql';
    access: 'public' | 'protected' | 'checked';
    sqlText: string;
    params?: GeneratedSqlParam[];
};

export type InvokeOptions = Record<string, unknown>;

export type DbHostContext = {
    connectionString: string;
    databaseDialect: 'postgres' | 'mysql';
    credential?: string;
    jwt?: Record<string, unknown>;
};

export type CheckedHostContext = {
    credential: string;
    jwt?: Record<string, unknown>;
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
    model: Model,
    source: string,
    parameterCheckerImports = '',
    mcpHostJwtImport = ''
): string {
    const sourceRef = renderSourceReference(source);
    const importPrefix = renderGeneratedImports(mcpHostJwtImport, parameterCheckerImports);
    return `/**
 * Generated from: ${sourceRef}
 */
${importPrefix}export const connectionEnv = ${JSON.stringify(connectionEnv)};

export const databaseDialect = ${JSON.stringify(databaseDialect)};

export const requiresAuth = ${requiresAuthLiteral(model)};

export const generatedTools = ${serializeToolsForModule(tools)};

${mcpServerIdentityBlock}
${toolRuntimeBlock}
`;
}
