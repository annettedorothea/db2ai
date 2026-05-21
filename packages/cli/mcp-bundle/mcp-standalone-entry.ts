/**
 * Entry for esbuild → resources/mcp-serve-emitted.mjs (copied to generated/cli/mcp-serve.mjs).
 */
import * as path from 'node:path';
import { loadLocalEnvFiles } from '../src/env.js';
import { runMcpServerFromGeneratedModule } from './mcp-server.js';

const modPath = process.argv[2];
if (!modPath) {
    console.error('Usage: node mcp-serve.mjs <path-to-*-tools.mjs>');
    process.exit(1);
}

loadLocalEnvFiles([process.cwd(), path.dirname(path.resolve(modPath))]);
await runMcpServerFromGeneratedModule(modPath);
