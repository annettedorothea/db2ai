#!/usr/bin/env node
/**
 * Fixtures + MCP hosts (foreground). Assumes generate + build:generated already done.
 * Used by demos start:all (after VSIX generate) and monorepo start:all:demos.
 */
import { waitForForegroundServiceShutdown } from '../generated/db2ai/scripts/foreground-lifecycle.mjs';
import { demosRoot, prepareWorkspaceEnv, serviceChildren, setStartLogTag } from './start-shared.mjs';
import { startFixtures } from './start-fixtures.mjs';
import { startMcpHosts } from './start-mcp-hosts.mjs';

/**
 * @param {string} logTag
 */
export async function startDemoStack(logTag) {
    setStartLogTag(logTag);
    prepareWorkspaceEnv();

    console.log(`[${logTag}] foreground — LOG_LEVEL=debug, MCP banners in this terminal.`);
    await startFixtures(logTag);
    await startMcpHosts(logTag);

    console.log(
        `[${logTag}] Ctrl+C stops MCP/IDP processes started here (npm run demo:kill-all also stops Docker).`
    );
    await waitForForegroundServiceShutdown({ label: logTag, serviceChildren, demosRoot });
}
