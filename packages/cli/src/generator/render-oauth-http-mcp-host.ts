import { writeGeneratedOAuthHttpMcpHost, type ProjectBootstrapConfig } from '@core2ai/core/codegen';

/** Writes `generated/{product}/cli/oauth-http-mcp-server.ts`. */
export function renderOAuthHttpMcpHost(cliDir: string, config: ProjectBootstrapConfig, projectRoot: string): string {
    return writeGeneratedOAuthHttpMcpHost(cliDir, config, projectRoot);
}
