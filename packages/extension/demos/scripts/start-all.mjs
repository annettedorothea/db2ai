#!/usr/bin/env node
/**
 * Full demo stack: kill-all, install, fixtures (background), generate, compile, MCP hosts (foreground).
 * Use for /test-all and release checks.
 */
import { waitForForegroundServiceShutdown } from './foreground-lifecycle.mjs';
import {
    demosRoot,
    installGenerateCompile,
    prepareWorkspaceEnv,
    runNpm,
    serviceChildren,
    setStartLogTag
} from './start-shared.mjs';
import { startFixtures } from './start-fixtures.mjs';
import { startMcpHosts } from './start-mcp-hosts.mjs';

const logTag = 'start:all';

async function main() {
    setStartLogTag(logTag);
    prepareWorkspaceEnv();

    console.log(`[${logTag}] stopping previous demo processes…`);
    runNpm(['run', 'demo:kill-all']);

    installGenerateCompile();

    console.log(`[${logTag}] foreground — LOG_LEVEL=debug, MCP banners in this terminal.`);
    await startFixtures(logTag);
    await startMcpHosts(logTag);

    console.log(`[${logTag}] Ctrl+C stops MCP/IDP processes started here (npm run demo:kill-all also stops Docker).`);
    await waitForForegroundServiceShutdown({ label: logTag, serviceChildren, demosRoot });
}

main().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${logTag}] failed:`, message);
    process.exit(1);
});
