#!/usr/bin/env node
/**
 * Full demo stack: kill-all, install, VSIX generate, compile, fixtures + MCP (foreground).
 * Author / Create Demo Workspace path — requires installed extension CLI.
 * Monorepo developers: use repo-root `npm run start:all:demos` instead.
 */
import { installGenerateCompile, prepareWorkspaceEnv, runNpm, setStartLogTag } from './start-shared.mjs';
import { startDemoStack } from './start-stack.mjs';

const logTag = 'start:all';

async function main() {
    setStartLogTag(logTag);
    prepareWorkspaceEnv();

    console.log(`[${logTag}] stopping previous demo processes…`);
    runNpm(['run', 'demo:kill-all']);

    installGenerateCompile();

    await startDemoStack(logTag);
}

main().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${logTag}] failed:`, message);
    process.exit(1);
});
