import type { Model } from 'db-2-ai-dsl-language';
import {
    accessRequiresAuth,
    getAccessKind,
    isSqlQuery,
    isToolAuthorizeEnabled,
    isToolPrepareEnabled
} from 'db-2-ai-dsl-language';
import {
    authorizeExportName,
    ensureToolHookStubsFromSource,
    renderAuthorizerImports,
    renderAuthorizersMap,
    renderPreparerImports,
    renderPreparersMap,
    renderInvokeAuthPipeline as renderInvokeAuthPipelineCore,
    resolveAuthPipelineTier,
    type AuthPipelineTier,
    type HookStubMaps,
    type ToolHookStubSpec,
    prepareInputExportName
} from '@toolfactory.dev/core/codegen';

export {
    authorizeExportName,
    prepareInputExportName,
    renderAuthorizerImports,
    renderAuthorizersMap,
    renderPreparerImports,
    renderPreparersMap,
    resolveAuthPipelineTier,
    type AuthPipelineTier,
    type HookStubMaps
};

function listToolHookSpecs(model: Model): ToolHookStubSpec[] {
    const specs: ToolHookStubSpec[] = [];
    for (const entry of model.entries) {
        if (!isSqlQuery(entry)) {
            continue;
        }
        const toolName = entry.toolName?.trim();
        if (!toolName) {
            continue;
        }
        const authorize = isToolAuthorizeEnabled(entry);
        const prepare = isToolPrepareEnabled(entry);
        if (authorize || prepare) {
            specs.push({ toolName, authorize, prepare, access: getAccessKind(entry) });
        }
    }
    return specs;
}

export function listAuthorizeToolNames(model: Model): string[] {
    return listToolHookSpecs(model)
        .filter((spec) => spec.authorize)
        .map((spec) => spec.toolName);
}

export function listProtectedToolNames(model: Model): string[] {
    const names: string[] = [];
    for (const entry of model.entries) {
        if (!isSqlQuery(entry)) {
            continue;
        }
        const toolName = entry.toolName?.trim();
        if (toolName && accessRequiresAuth(entry)) {
            names.push(toolName);
        }
    }
    return names;
}

export function listPrepareToolNames(model: Model): string[] {
    return listToolHookSpecs(model)
        .filter((spec) => spec.prepare)
        .map((spec) => spec.toolName);
}

export function modelHasAuthPipeline(model: Model): boolean {
    return model.entries.some(
        (entry) => isSqlQuery(entry) && (accessRequiresAuth(entry) || isToolPrepareEnabled(entry))
    );
}

export async function renderCheckStubs(
    source: string,
    model: Model,
    toolsModuleTsPath: string
): Promise<Map<string, string>> {
    const specs = listToolHookSpecs(model);
    if (specs.length === 0) {
        return new Map();
    }
    return ensureToolHookStubsFromSource(source, specs, toolsModuleTsPath);
}

export function renderInvokeAuthPipeline(
    tier: AuthPipelineTier,
    hasVerifyCredential: boolean,
    stubMaps: HookStubMaps
): string {
    return renderInvokeAuthPipelineCore('db2ai', tier, hasVerifyCredential, stubMaps);
}
