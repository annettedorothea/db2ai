import type { Model } from 'db-2-ai-dsl-language';
import {
    getAccessKind,
    isSqlQuery,
    type ResolvedDatabaseDialect,
    type ResolvedSqlParam,
    type SqlParamType
} from 'db-2-ai-dsl-language';
import {
    buildInputZodBlock,
    resolveMcpServerIdentityFromDestination,
    type ProjectBootstrapConfig
} from '@core2ai/core/codegen';
import * as path from 'node:path';
import {
    buildInputSchemaByTool,
    resolveToolsFromModel,
    type JsonSchemaDict,
    type ResolvedDbToolCodegen
} from '../db-query-codegen.js';
import { renderInvokeBlockTs } from './invoke-render.js';
import { renderParameterCheckerImports, renderParameterCheckersMap } from './render-check-stubs.js';

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
    access: 'public' | 'protected' | 'checked';
    sqlText: string;
    params?: GeneratedSqlParam[];
};

export type RenderToolsModuleInput = {
    model: Model;
    source: string;
    destinationTsPath: string;
    stubPaths: Map<string, string>;
    bootstrapConfig: ProjectBootstrapConfig;
    databaseDialect: ResolvedDatabaseDialect;
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

function renderGeneratedImports(parameterCheckerImports: string): string {
    const loggingImport = "import { loggingAdapter } from '../../src/utils/logging-adapter.js';";
    const parts = [loggingImport];
    if (parameterCheckerImports.length > 0) {
        parts.push(parameterCheckerImports);
    }
    return `${parts.join('\n')}\n\n`;
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

function renderMcpServerIdentityExports(name: string, version: string): string {
    return `export const mcpServerName = ${JSON.stringify(name)};
export const mcpServerVersion = ${JSON.stringify(version)};
`;
}

function authRuntimeKind(model: Model): 'none' | 'credential' {
    return model.auth ? 'credential' : 'none';
}

function assembleToolsModuleSource(
    tools: ResolvedDbToolCodegen[],
    connectionEnv: string,
    databaseDialect: ResolvedDatabaseDialect,
    mcpServerIdentityBlock: string,
    toolRuntimeBlock: string,
    model: Model,
    source: string,
    parameterCheckerImports: string
): string {
    const toolsLiteral = serializeToolsForModule(tools);
    const sourceRef = renderSourceReference(source);
    const importPrefix = renderGeneratedImports(parameterCheckerImports);
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
    databaseDialect: 'postgres' | 'mysql' | 'mariadb' | 'sqlserver';
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

/** Renders `generated/tools/*-tools.ts` source text. */
export function renderToolsModule(input: RenderToolsModuleInput): string {
    const { model, source, destinationTsPath, stubPaths, bootstrapConfig, databaseDialect } = input;
    const envName = String(model.env).trim();
    const tools = resolveToolsFromModel(model);
    const inputSchemaByTool = buildInputSchemaByTool(model, tools) as Record<string, JsonSchemaDict>;
    const authKind = authRuntimeKind(model);
    const hasAuth = authKind === 'credential';
    const hasChecked = stubPaths.size > 0;
    const parameterCheckerImports = hasChecked ? renderParameterCheckerImports(destinationTsPath, stubPaths) : '';
    const parameterCheckersMap = hasChecked ? renderParameterCheckersMap(stubPaths) : '';

    const { name: mcpServerName, version: mcpServerVersion } = resolveMcpServerIdentityFromDestination(
        destinationTsPath,
        bootstrapConfig
    );
    const mcpServerIdentityBlock = renderMcpServerIdentityExports(mcpServerName, mcpServerVersion);
    const authRuntimePrefix = parameterCheckersMap.length > 0 ? `${parameterCheckersMap}\n\n` : '';
    const inputZodBlock = buildInputZodBlock(inputSchemaByTool);
    const invokeBlockTs = renderInvokeBlockTs(tools, databaseDialect, hasAuth, hasChecked);

    return assembleToolsModuleSource(
        tools,
        envName,
        databaseDialect,
        mcpServerIdentityBlock,
        `${authRuntimePrefix}${inputZodBlock}\n${invokeBlockTs}`,
        model,
        source,
        parameterCheckerImports
    );
}
