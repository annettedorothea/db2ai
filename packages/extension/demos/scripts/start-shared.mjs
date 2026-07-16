#!/usr/bin/env node
/**
 * Thin re-export of generated start helpers (VSIX/author demos workspace).
 * Monorepo developers: use repo-root `npm run start:all:demos` (not demos start:all).
 */
export {
    demosRoot,
    serviceChildren,
    startLogTag,
    setStartLogTag,
    runNpm,
    runNode,
    prepareWorkspaceEnv,
    startService,
    waitForHttpOk,
    waitForTcpListen,
    waitForMcpHost,
    waitForBackend,
    generateAndCompile,
    installGenerateCompile,
    printMcpReminder
} from '../generated/db2ai/scripts/start-service-lib.mjs';
