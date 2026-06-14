import { writeGeneratedRelayHttpMcpHosts, type ProjectBootstrapConfig } from '@core2ai/core/codegen';

/** Writes `generated/cli/public-http-mcp-server.ts` and `passthrough-http-mcp-server.ts`. */
export function renderRelayHttpMcpHosts(
    cliDir: string,
    config: ProjectBootstrapConfig
): {
    publicHttpMcpHostPath: string;
    passthroughHttpMcpHostPath: string;
} {
    return writeGeneratedRelayHttpMcpHosts(cliDir, config);
}
