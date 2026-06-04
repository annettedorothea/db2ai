import { writeGeneratedOAuthHttpMcpHost, type ProjectBootstrapConfig } from '@core2ai/core/codegen';

/** Writes `generated/cli/oauth-http-mcp-server.ts`. */
export function renderOAuthHttpMcpHost(cliDir: string, config: ProjectBootstrapConfig): string {
    return writeGeneratedOAuthHttpMcpHost(cliDir, config);
}
