import type { Model } from 'db-2-ai-dsl-language';
import { accessRequiresAuth, isSqlQuery, isToolAuthorizeEnabled, isToolValidateEnabled } from 'db-2-ai-dsl-language';
import {
    authorizeExportName,
    ensureToolAuthStubsFromSource,
    renderAuthorizerImports,
    renderAuthorizersMap,
    renderValidatorImports,
    renderValidatorsMap,
    renderInvokeAuthPipeline as renderInvokeAuthPipelineCore,
    resolveAuthPipelineTier,
    type AuthPipelineTier,
    type AuthStubMaps,
    type ToolAuthStubSpec,
    validateInputExportName
} from '@core2ai/core/codegen';

export {
    authorizeExportName,
    validateInputExportName,
    renderAuthorizerImports,
    renderAuthorizersMap,
    renderValidatorImports,
    renderValidatorsMap,
    resolveAuthPipelineTier,
    type AuthPipelineTier,
    type AuthStubMaps
};

function listToolAuthSpecs(model: Model): ToolAuthStubSpec[] {
    const specs: ToolAuthStubSpec[] = [];
    for (const entry of model.entries) {
        if (!isSqlQuery(entry)) {
            continue;
        }
        const toolName = entry.toolName?.trim();
        if (!toolName) {
            continue;
        }
        const authorize = isToolAuthorizeEnabled(entry);
        const validate = isToolValidateEnabled(entry);
        if (authorize || validate) {
            specs.push({ toolName, authorize, validate });
        }
    }
    return specs;
}

export function listAuthorizeToolNames(model: Model): string[] {
    return listToolAuthSpecs(model)
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

export function listValidateToolNames(model: Model): string[] {
    return listToolAuthSpecs(model)
        .filter((spec) => spec.validate)
        .map((spec) => spec.toolName);
}

export function modelHasAuthPipeline(model: Model): boolean {
    return model.entries.some(
        (entry) => isSqlQuery(entry) && (accessRequiresAuth(entry) || isToolValidateEnabled(entry))
    );
}

export async function renderCheckStubs(
    source: string,
    model: Model,
    toolsModuleTsPath: string
): Promise<Map<string, string>> {
    const specs = listToolAuthSpecs(model);
    if (specs.length === 0) {
        return new Map();
    }
    return ensureToolAuthStubsFromSource(source, specs, toolsModuleTsPath);
}

export function renderInvokeAuthPipeline(
    tier: AuthPipelineTier,
    hasVerifyCredential: boolean,
    stubMaps: AuthStubMaps
): string {
    return renderInvokeAuthPipelineCore('db2ai', tier, hasVerifyCredential, stubMaps);
}
