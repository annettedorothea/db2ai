import { writeGeneratedStdioMcpHost, type ProjectBootstrapConfig } from '@core2ai/core/codegen';

/** Writes `generated/{product}/cli/stdio-mcp-server.ts`. */
export function renderStdioMcpHost(cliDir: string, config: ProjectBootstrapConfig, projectRoot: string): string {
    return writeGeneratedStdioMcpHost(cliDir, config, projectRoot);
}
