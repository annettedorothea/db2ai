import { writeGeneratedMcpServe, type ProjectBootstrapConfig } from '@core2ai/core/codegen';

/** Writes `generated/cli/mcp-serve.ts` (and optional embed copy of the MCP host). */
export function renderMcpServe(cliDir: string, config: ProjectBootstrapConfig): string {
    return writeGeneratedMcpServe(cliDir, config);
}
