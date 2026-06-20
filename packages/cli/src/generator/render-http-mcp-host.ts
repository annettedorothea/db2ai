import { writeGeneratedHttpMcpHosts, type ProjectBootstrapConfig } from '@core2ai/core/codegen';

/** Writes `generated/{product}/cli/public-http-mcp-server.ts` and `passthrough-http-mcp-server.ts`. */
export function renderHttpMcpHosts(
    cliDir: string,
    config: ProjectBootstrapConfig,
    projectRoot: string
): {
    publicHttpMcpHostPath: string;
    passthroughHttpMcpHostPath: string;
} {
    return writeGeneratedHttpMcpHosts(cliDir, config, projectRoot);
}
