import { writeGeneratedStdioMcpHost, type ProjectBootstrapConfig } from '@toolfactory.dev/core/codegen';

/** Writes `generated/{product}/cli/stdio-mcp-server.ts`. */
export function renderStdioMcpHost(cliDir: string, config: ProjectBootstrapConfig, projectRoot: string): string {
    return writeGeneratedStdioMcpHost(cliDir, config, projectRoot);
}
