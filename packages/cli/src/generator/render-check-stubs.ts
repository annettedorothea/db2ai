import type { Model } from 'db-2-ai-dsl-language';
import {
    accessRequiresAuth,
    getAccessKind,
    isAfterToolCallEnabled,
    isSqlQuery,
    isCheckToolAccessEnabled,
    isPrepareToolCallEnabled
} from 'db-2-ai-dsl-language';
import {
    afterToolCallExportName,
    checkToolAccessExportName,
    listAfterToolCallHookEntriesFromSpecs,
    listAfterToolCallToolNamesFromSpecs,
    listCheckToolAccessToolNamesFromSpecs,
    listPrepareToolCallHookEntriesFromSpecs,
    listPrepareToolCallToolNamesFromSpecs,
    prepareToolCallExportName,
    renderAfterToolCallHookImports,
    renderAfterToolCallHooksMap,
    renderCheckStubsFromSpecs,
    renderCheckToolAccessHookImports,
    renderCheckToolAccessHooksMap,
    renderPrepareToolCallHookImports,
    renderPrepareToolCallHooksMap,
    resolveInvokePipelineTier,
    type ToolHookStubSpec,
    type InvokePipelineTier,
    type HookStubMaps
} from '@toolfactory.dev/core/codegen';
import { renderInvokePipeline } from '../codegen/invoke-pipeline-render.js';

export {
    afterToolCallExportName,
    checkToolAccessExportName,
    prepareToolCallExportName,
    renderAfterToolCallHookImports,
    renderAfterToolCallHooksMap,
    renderCheckToolAccessHookImports,
    renderCheckToolAccessHooksMap,
    renderPrepareToolCallHookImports,
    renderPrepareToolCallHooksMap,
    renderInvokePipeline,
    resolveInvokePipelineTier,
    type InvokePipelineTier,
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
        const afterToolCall = isAfterToolCallEnabled(entry);
        if (checkToolAccess || prepareToolCall || afterToolCall) {
            specs.push({
                toolName,
                checkToolAccess,
                prepareToolCall,
                afterToolCall,
                access: getAccessKind(entry)
            });
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

export function listAfterToolCallToolNames(model: Model): string[] {
    return listAfterToolCallToolNamesFromSpecs(listToolHookSpecs(model));
}

export function listPrepareToolCallHookEntries(model: Model): { toolName: string; access: 'public' | 'protected' }[] {
    return listPrepareToolCallHookEntriesFromSpecs(listToolHookSpecs(model));
}

export function listAfterToolCallHookEntries(model: Model): { toolName: string; access: 'public' | 'protected' }[] {
    return listAfterToolCallHookEntriesFromSpecs(listToolHookSpecs(model));
}

export function modelHasInvokePipeline(model: Model): boolean {
    return model.entries.some(
        (entry) =>
            isSqlQuery(entry) &&
            (accessRequiresAuth(entry) || isPrepareToolCallEnabled(entry) || isAfterToolCallEnabled(entry))
    );
}

export async function renderCheckStubs(
    source: string,
    model: Model,
    toolsModuleTsPath: string
): Promise<Map<string, string>> {
    return renderCheckStubsFromSpecs(source, listToolHookSpecs(model), toolsModuleTsPath);
}
