import { writeGeneratedStdioMcpHost, type ProjectBootstrapConfig } from '@core2ai/core/codegen';

/** Writes `generated/cli/stdio-mcp-server.ts`. */
export function renderStdioMcpHost(cliDir: string, config: ProjectBootstrapConfig): string {
    return writeGeneratedStdioMcpHost(cliDir, config);
}
