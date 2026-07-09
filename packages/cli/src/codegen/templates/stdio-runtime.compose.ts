import { renderStdioRuntimeTemplate } from '@toolfactory.dev/core/codegen';
import { renderMcpHostSharedSource } from '../fragments/mcp-host-fragments.js';
import { requireBaseUrlEnvArgvCheckFragment } from '../fragments/oauth-host-runtime.js';

/** Generated `cli/stdio-runtime.ts` for db2ai projects. */
export function renderStdioRuntimeCompose(loggingImport: string): string {
    return renderStdioRuntimeTemplate({
        loggingImport,
        sharedHost: renderMcpHostSharedSource('stdio'),
        requireBaseUrlEnvArgvCheck: requireBaseUrlEnvArgvCheckFragment('hostConfig.baseUrlEnvKey')
    });
}
