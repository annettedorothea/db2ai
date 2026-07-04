import type { Model } from 'db-2-ai-dsl-language';
import {
    accessRequiresAuth,
    getAccessKind,
    isSqlQuery,
    isCheckToolAccessEnabled,
    isPrepareToolCallEnabled
} from 'db-2-ai-dsl-language';
import {
    checkToolAccessExportName,
    ensureToolHookStubsFromSource,
    renderCheckToolAccessHookImports,
    renderCheckToolAccessHooksMap,
    renderPrepareToolCallHookImports,
    renderPrepareToolCallHooksMap,
    renderInvokeAuthPipeline as renderInvokeAuthPipelineCore,
    resolveAuthPipelineTier,
    type AuthPipelineTier,
    type HookStubMaps,
    type ToolHookStubSpec,
    prepareToolCallExportName
} from '@toolfactory.dev/core/codegen';

export {
    checkToolAccessExportName,
    prepareToolCallExportName,
    renderCheckToolAccessHookImports,
    renderCheckToolAccessHooksMap,
    renderPrepareToolCallHookImports,
    renderPrepareToolCallHooksMap,
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
        const checkToolAccess = isCheckToolAccessEnabled(entry);
        const prepareToolCall = isPrepareToolCallEnabled(entry);
        if (checkToolAccess || prepareToolCall) {
            specs.push({ toolName, checkToolAccess, prepareToolCall, access: getAccessKind(entry) });
        }
    }
    return specs;
}

export function listCheckToolAccessToolNames(model: Model): string[] {
    return listToolHookSpecs(model)
        .filter((spec) => spec.checkToolAccess)
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

export function listPrepareToolCallToolNames(model: Model): string[] {
    return listToolHookSpecs(model)
        .filter((spec) => spec.prepareToolCall)
        .map((spec) => spec.toolName);
}

export function listPrepareToolCallHookEntries(model: Model): { toolName: string; access: 'public' | 'protected' }[] {
    return listToolHookSpecs(model)
        .filter((spec) => spec.prepareToolCall)
        .map(({ toolName, access }) => ({ toolName, access }));
}

export function modelHasAuthPipeline(model: Model): boolean {
    return model.entries.some(
        (entry) => isSqlQuery(entry) && (accessRequiresAuth(entry) || isPrepareToolCallEnabled(entry))
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
