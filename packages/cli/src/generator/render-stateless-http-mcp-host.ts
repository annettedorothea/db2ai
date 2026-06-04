import { writeGeneratedStatelessHttpMcpHost, type ProjectBootstrapConfig } from '@core2ai/core/codegen';

/** Writes `generated/cli/stateless-http-mcp-server.ts`. */
export function renderStatelessHttpMcpHost(cliDir: string, config: ProjectBootstrapConfig): string {
    return writeGeneratedStatelessHttpMcpHost(cliDir, config);
}
