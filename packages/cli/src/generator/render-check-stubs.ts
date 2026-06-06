import type { Model } from 'db-2-ai-dsl-language';
import { getAccessKind, isSqlQuery } from 'db-2-ai-dsl-language';
import {
    ensureCheckedAuthStubsFromSource,
    parameterCheckExportName,
    renderParameterCheckerImports,
    renderParameterCheckersMap
} from '@core2ai/core/codegen';

export { parameterCheckExportName, renderParameterCheckerImports, renderParameterCheckersMap };

function listCheckedToolNames(model: Model): string[] {
    const names: string[] = [];
    for (const entry of model.entries) {
        if (!isSqlQuery(entry)) {
            continue;
        }
        if (getAccessKind(entry) === 'checked' && entry.toolName?.trim()) {
            names.push(entry.toolName.trim());
        }
    }
    return names;
}

/** Writes write-once `src/auth/<mcpModule>/<toolName>.ts` stubs; returns stub paths for imports. */
export async function renderCheckStubs(
    source: string,
    model: Model,
    toolsModuleTsPath: string
): Promise<Map<string, string>> {
    const checkedToolNames = listCheckedToolNames(model);
    if (checkedToolNames.length === 0) {
        return new Map();
    }
    return ensureCheckedAuthStubsFromSource(source, checkedToolNames, toolsModuleTsPath);
}

export function renderInvokeCredentialAndParameterCheck(hasAuth: boolean, hasChecked: boolean): string {
    const credentialGuard = hasAuth
        ? `
    if (toolMeta.access !== 'public') {
        if (!host.credential || !String(host.credential).trim()) {
            throw new Error(
                'Missing host credential. stdio: set env for --auth-env on stdio-mcp-server; stateless HTTP: MCP auth header (e.g. x-api-token); OAuth HTTP: complete MCP login (Authorization Bearer from Cursor).'
            );
        }
    }`
        : '';

    const checkedAccessBlock = hasChecked
        ? `
    if (toolMeta.access === 'checked') {
        const check = parameterCheckers[toolName];
        if (typeof check !== 'function') {
            throw new Error('No parameter checker for checked tool: ' + toolName);
        }
        optionsResolved = await Promise.resolve(
            check(options, {
                credential: String(host.credential).trim(),
                jwt: host.jwt
            })
        );
    }`
        : '';

    const optionsResolvedDecl = hasChecked ? '\n    let optionsResolved = options;' : '';

    return `${credentialGuard}${optionsResolvedDecl}${checkedAccessBlock}`;
}
