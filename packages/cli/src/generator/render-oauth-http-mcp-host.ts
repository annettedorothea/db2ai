import { writeGeneratedOAuthHttpMcpHost, type ProjectBootstrapConfig } from '@toolfactory.dev/core/codegen';

/** Writes `generated/{product}/cli/oauth-http-mcp-server.ts`. */
export function renderOAuthHttpMcpHost(cliDir: string, config: ProjectBootstrapConfig, projectRoot: string): string {
    return writeGeneratedOAuthHttpMcpHost(cliDir, config, projectRoot);
}
