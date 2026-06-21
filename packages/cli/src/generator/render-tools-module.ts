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
    emitGeneratedZodPreamble,
    ensureVerifyCredentialStubFromSource,
    relativeImportToLoggingAdapter,
    renderVerifyCredentialImport,
    renderVerifyCredentialReExport,
    resolveBootstrapProjectRootFromSource,
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
import {
    listAuthorizeToolNames,
    listValidateToolNames,
    modelHasAuthPipeline,
    renderAuthorizerImports,
    renderAuthorizersMap,
    renderValidatorImports,
    renderValidatorsMap,
    resolveAuthPipelineTier
} from './render-check-stubs.js';

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
    access: 'public' | 'protected';
    hasAuthorize: boolean;
    hasValidate: boolean;
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
        hasAuthorize: tool.hasAuthorize,
        hasValidate: tool.hasValidate,
        sqlText: tool.sqlText,
        params: tool.params.map(serializeSqlParam)
    };
}

function requiresAuthLiteral(model: Model): string {
    const needsProtected = model.entries.some((entry) => isSqlQuery(entry) && getAccessKind(entry) === 'protected');
    return needsProtected && model.auth ? 'true' : 'false';
}

function renderGeneratedImports(
    destinationTsPath: string,
    projectRoot: string,
    authStubImports: string,
    verifyCredentialImport: string,
    hasZodSchemas: boolean
): string {
    const loggingSpec = relativeImportToLoggingAdapter(destinationTsPath, projectRoot);
    const loggingImport = `import { loggingAdapter } from '${loggingSpec}';`;
    const parts = [loggingImport];
    if (hasZodSchemas) {
        parts.push(emitGeneratedZodPreamble().trimEnd());
    }
    if (verifyCredentialImport.length > 0) {
        parts.push(verifyCredentialImport);
    }
    if (authStubImports.length > 0) {
        parts.push(authStubImports);
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
    destinationTsPath: string,
    projectRoot: string,
    authStubImports: string,
    verifyStubPath: string | undefined,
    verifyCredentialImport: string,
    hasZodSchemas: boolean
): string {
    const toolsLiteral = serializeToolsForModule(tools);
    const sourceRef = renderSourceReference(source);
    const importPrefix = renderGeneratedImports(
        destinationTsPath,
        projectRoot,
        authStubImports,
        verifyCredentialImport,
        hasZodSchemas
    );
    const verifyExportBlock =
        verifyStubPath !== undefined ? `\n${renderVerifyCredentialReExport(destinationTsPath, verifyStubPath)}\n` : '';
    return `/**
 * Generated from: ${sourceRef}
 */
${importPrefix}export const connectionEnv = ${JSON.stringify(connectionEnv)};

export const databaseDialect = ${JSON.stringify(databaseDialect)};

export const requiresAuth = ${requiresAuthLiteral(model)};
${verifyExportBlock}
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
    access: 'public' | 'protected';
    hasAuthorize: boolean;
    hasValidate: boolean;
    sqlText: string;
    params?: GeneratedSqlParam[];
};

export type InvokeOptions = Record<string, unknown>;

export type DbHostContext = {
    connectionString: string;
    databaseDialect: 'postgres' | 'mysql' | 'mariadb' | 'sqlserver' | 'oracle';
    credential?: string;
    upstreamCredential?: string;
    credentials?: unknown;
};

export const generatedTools: GeneratedTool[] = ${toolsLiteral};

${mcpServerIdentityBlock}
${toolRuntimeBlock}
`;
}

/** Renders `generated/{product}/tools/*-tools.ts` source text. */
export async function renderToolsModule(input: RenderToolsModuleInput): Promise<string> {
    const { model, source, destinationTsPath, stubPaths, bootstrapConfig, databaseDialect } = input;
    const envName = String(model.env).trim();
    const tools = resolveToolsFromModel(model);
    const inputSchemaByTool = buildInputSchemaByTool(model, tools) as Record<string, JsonSchemaDict>;
    const authKind = authRuntimeKind(model);
    const hasAuth = authKind === 'credential';
    const hasAuthPipeline = modelHasAuthPipeline(model);
    const authorizeToolNames = listAuthorizeToolNames(model);
    const validateToolNames = listValidateToolNames(model);
    const authPipelineTier = resolveAuthPipelineTier(hasAuthPipeline, authorizeToolNames, validateToolNames);
    const authorizerImports =
        authorizeToolNames.length > 0 ? renderAuthorizerImports(destinationTsPath, stubPaths, authorizeToolNames) : '';
    const validatorImports = validateToolNames.length > 0 ? renderValidatorImports(destinationTsPath, stubPaths) : '';
    const authStubImports = [authorizerImports, validatorImports].filter((s) => s.length > 0).join('\n');
    const authMapBlocks: string[] = [];
    if (authPipelineTier === 'full') {
        if (authorizeToolNames.length > 0) {
            authMapBlocks.push(renderAuthorizersMap(authorizeToolNames));
        }
        if (validateToolNames.length > 0) {
            authMapBlocks.push(renderValidatorsMap(validateToolNames));
        }
    }
    const authRuntimePrefixBlock = authMapBlocks.length > 0 ? `${authMapBlocks.join('\n\n')}\n\n` : '';

    const { name: mcpServerName, version: mcpServerVersion } = resolveMcpServerIdentityFromDestination(
        destinationTsPath,
        bootstrapConfig
    );
    const mcpServerIdentityBlock = renderMcpServerIdentityExports(mcpServerName, mcpServerVersion);
    const inputZodBlock = buildInputZodBlock(inputSchemaByTool);
    const stubMaps = {
        authorizers: authorizeToolNames.length > 0,
        validators: validateToolNames.length > 0
    };
    const invokeBlockTs = renderInvokeBlockTs(tools, databaseDialect, hasAuth, authPipelineTier, stubMaps);

    const hasValidateTools = validateToolNames.length > 0;
    const needsVerifyCredential = hasAuth;
    const verifyStubPath =
        needsVerifyCredential || hasValidateTools
            ? await ensureVerifyCredentialStubFromSource(source, destinationTsPath)
            : undefined;
    const projectRoot = resolveBootstrapProjectRootFromSource(source);
    const verifyCredentialImport =
        verifyStubPath !== undefined
            ? renderVerifyCredentialImport(destinationTsPath, verifyStubPath, {
                  includeVerify: needsVerifyCredential,
                  includeModuleCredentials: authPipelineTier === 'full' || !needsVerifyCredential
              })
            : '';

    const hasZodSchemas = Object.keys(inputSchemaByTool).length > 0;

    return assembleToolsModuleSource(
        tools,
        envName,
        databaseDialect,
        mcpServerIdentityBlock,
        `${authRuntimePrefixBlock}${inputZodBlock}\n${invokeBlockTs}`,
        model,
        source,
        destinationTsPath,
        projectRoot,
        authStubImports,
        verifyStubPath,
        verifyCredentialImport,
        hasZodSchemas
    );
}
