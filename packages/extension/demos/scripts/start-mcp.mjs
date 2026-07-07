#!/usr/bin/env node
/**
 * MCP hosts only: kill MCP → generate → build → start all MCP hosts (foreground).
 * Databases/IdP must already be running (start:all or start:fixtures).
 */
import { waitForForegroundServiceShutdown } from './foreground-lifecycle.mjs';
import { demosRoot, prepareWorkspaceEnv, runNpm, serviceChildren, setStartLogTag } from './start-shared.mjs';
import { startMcpHosts } from './start-mcp-hosts.mjs';

const logTag = 'start:mcp';

async function main() {
    setStartLogTag(logTag);
    prepareWorkspaceEnv();

    console.log(`[${logTag}] stopping MCP hosts only…`);
    runNpm(['run', 'demo:kill-mcp']);

    console.log(`[${logTag}] generate + compile…`);
    runNpm(['run', 'generate:all']);
    runNpm(['run', 'build:generated']);

    console.log(`[${logTag}] foreground — LOG_LEVEL=debug, MCP banners in this terminal.`);
    await startMcpHosts(logTag);

    console.log(`[${logTag}] Ctrl+C stops MCP processes started here (DBs/IdP keep running).`);
    await waitForForegroundServiceShutdown({ label: logTag, serviceChildren, demosRoot });
}

main().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${logTag}] failed:`, message);
    process.exit(1);
});
