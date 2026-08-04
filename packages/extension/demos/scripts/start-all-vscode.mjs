#!/usr/bin/env node
/**
 * VS Code / Copilot demo path: kill-all, install, generate, compile, fixtures only.
 * Does not start HTTP MCP hosts — Copilot uses stdio servers from `.vscode/mcp.json`.
 */
import { installGenerateCompile, prepareWorkspaceEnv, runNpm, setStartLogTag } from './start-shared.mjs';
import { startFixtures } from './start-fixtures.mjs';

const logTag = 'start:all:vscode';

async function main() {
    setStartLogTag(logTag);
    prepareWorkspaceEnv();

    console.log(`[${logTag}] stopping previous demo processes…`);
    runNpm(['run', 'demo:kill-all']);

    installGenerateCompile();

    await startFixtures(logTag);

    console.log(`[${logTag}] demo backends ready (no HTTP MCP hosts).`);
    console.log(`[${logTag}] Enable stdio servers in .vscode/mcp.json (VS Code / Copilot Agent mode).`);
}

main().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${logTag}] failed:`, message);
    process.exit(1);
});
