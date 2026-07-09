import { renderPassthroughHttpRuntimeTemplate, renderPublicHttpRuntimeTemplate } from '@toolfactory.dev/core/codegen';
import { renderMcpHostSharedSource } from '../fragments/mcp-host-fragments.js';
import { requireBaseUrlEnvArgvCheckFragment } from '../fragments/oauth-host-runtime.js';

function httpRuntimeSlots(loggingImport: string, mode: 'public-http' | 'passthrough-http') {
    return {
        loggingImport,
        sharedHost: renderMcpHostSharedSource(mode),
        requireBaseUrlEnvArgvCheck: requireBaseUrlEnvArgvCheckFragment('httpHostConfig.baseUrlEnvKey')
    };
}

/** Generated `cli/public-http-runtime.ts` for db2ai projects. */
export function renderPublicHttpRuntimeCompose(loggingImport: string): string {
    return renderPublicHttpRuntimeTemplate(httpRuntimeSlots(loggingImport, 'public-http'));
}

/** Generated `cli/passthrough-http-runtime.ts` for db2ai projects. */
export function renderPassthroughHttpRuntimeCompose(loggingImport: string): string {
    return renderPassthroughHttpRuntimeTemplate(httpRuntimeSlots(loggingImport, 'passthrough-http'));
}
