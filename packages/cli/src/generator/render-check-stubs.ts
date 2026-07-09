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
    listCheckToolAccessToolNamesFromSpecs,
    listPrepareToolCallHookEntriesFromSpecs,
    listPrepareToolCallToolNamesFromSpecs,
    prepareToolCallExportName,
    renderCheckStubsFromSpecs,
    renderCheckToolAccessHookImports,
    renderCheckToolAccessHooksMap,
    renderPrepareToolCallHookImports,
    renderPrepareToolCallHooksMap,
    resolveAuthPipelineTier,
    type ToolHookStubSpec,
    type AuthPipelineTier,
    type HookStubMaps
} from '@toolfactory.dev/core/codegen';
import { renderInvokeAuthPipeline } from '../codegen/auth-pipeline-render.js';

export {
    checkToolAccessExportName,
    prepareToolCallExportName,
    renderCheckToolAccessHookImports,
    renderCheckToolAccessHooksMap,
    renderPrepareToolCallHookImports,
    renderPrepareToolCallHooksMap,
    renderInvokeAuthPipeline,
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
    return listCheckToolAccessToolNamesFromSpecs(listToolHookSpecs(model));
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
    return listPrepareToolCallToolNamesFromSpecs(listToolHookSpecs(model));
}

export function listPrepareToolCallHookEntries(model: Model): { toolName: string; access: 'public' | 'protected' }[] {
    return listPrepareToolCallHookEntriesFromSpecs(listToolHookSpecs(model));
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
    return renderCheckStubsFromSpecs(source, listToolHookSpecs(model), toolsModuleTsPath);
}
